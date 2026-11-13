import { NextRequest, NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  AppError,
  currentUser,
  createSession,
  logout,
  requireUser,
  orgId,
  rateLimit,
  digest,
} from "@/lib/auth";
import {
  categories,
  listSchema,
  matches,
  researchSchema,
  redact,
  targetSchema,
  respondentAgeSchema,
  parentalConsentStatus,
} from "@/lib/domain";
import {
  completeSurvey,
  createResearch,
  getResearch,
  survey,
} from "@/lib/research";
import { analytics, Filters, responseWhere } from "@/lib/analytics";
import { askAssistant, generateAnalysis, aiDataset } from "@/lib/ai";
export const runtime = "nodejs";
const profileSchema = z.object({
  age: respondentAgeSchema,
  gender: z.enum(["Женский", "Мужской", "Не указывать"]),
  region: z.string().trim().min(2).max(80),
  interests: listSchema,
  categories: listSchema.min(1),
  brands: listSchema,
});
const credentials = z.object({
  email: z
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(10).max(72),
});
async function body(req: NextRequest) {
  if (Number(req.headers.get("content-length") || 0) > 65536)
    throw new AppError(413, "Запрос слишком большой");
  const reader = req.body?.getReader();
  if (!reader) return {};
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 65536) {
      await reader.cancel();
      throw new AppError(413, "Запрос слишком большой");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new AppError(400, "Некорректный JSON");
  }
}
function filters(req: NextRequest): Filters {
  const p = req.nextUrl.searchParams;
  return z
    .object({
      minAge: z.coerce.number().int().min(12).max(99).optional(),
      maxAge: z.coerce.number().int().min(12).max(99).optional(),
      gender: z.string().max(40).optional(),
      region: z.string().max(80).optional(),
      interest: z.string().max(60).optional(),
      question: z.string().max(80).optional(),
    })
    .parse(
      Object.fromEntries(
        [...p.entries()].filter(
          ([k, v]) =>
            [
              "minAge",
              "maxAge",
              "gender",
              "region",
              "interest",
              "question",
            ].includes(k) && v !== "",
        ),
      ),
    );
}
async function dispatch(req: NextRequest, path: string[]) {
  const [area, id, action] = path;
  const method = req.method;
  const write = method !== "GET";
  if (write) {
    const origin = req.headers.get("origin");
    const expected = process.env.APP_ORIGIN || req.nextUrl.origin;
    if (origin !== expected)
      throw new AppError(403, "Недопустимый источник запроса");
    if (!req.headers.get("content-type")?.includes("application/json"))
      throw new AppError(415, "Ожидается JSON");
  }
  if (area === "auth") {
    if (id === "me" && method === "GET") {
      const user = await currentUser();
      if (!user) return { user: null };
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: user.profile,
          organization: user.memberships[0]?.organization,
        },
      };
    }
    if (id === "logout" && method === "POST") {
      await logout();
      return { ok: true };
    }
    if (["login", "register"].includes(id) && method === "POST") {
      // Do not trust client-supplied forwarded IP headers. Global + account buckets are shared in PostgreSQL.
      await rateLimit("auth:global", 120, 60);
      const input = await body(req);
      const c = credentials.parse(input);
      await rateLimit(`auth:${c.email}`, 10, 600);
      if (id === "login") {
        const user = await db.user.findUnique({ where: { email: c.email } });
        if (!user || !(await compare(c.password, user.passwordHash)))
          throw new AppError(401, "Неверный email или пароль");
        await createSession(user.id);
        return { role: user.role };
      }
      const data = z
        .object({
          name: z.string().trim().min(2).max(60),
          role: z.enum(["COMPANY", "RESPONDENT"]),
          consent: z.literal(true),
          profile: profileSchema.optional(),
          organization: z
            .object({
              name: z.string().trim().min(2).max(100),
              industry: z.string().min(2).max(80),
              size: z.string().min(1).max(40),
              title: z.string().min(2).max(80),
              website: z.union([z.url().max(200), z.literal("")]).optional(),
            })
            .optional(),
        })
        .parse(input);
      if (
        (data.role === "RESPONDENT" && !data.profile) ||
        (data.role === "COMPANY" && !data.organization)
      )
        throw new AppError(400, "Заполните профиль");
      const passwordHash = await hash(c.password, 12);
      const organization = data.organization;
      const user = await db.user.create({
        data: {
          email: c.email,
          passwordHash,
          name: data.name,
          role: data.role,
          consentAt: new Date(),
          ...(data.role === "RESPONDENT"
            ? {
                profile: {
                  create: {
                    ...data.profile!,
                    parentalConsentStatus: parentalConsentStatus(
                      data.profile!.age,
                    ),
                  },
                },
              }
            : {
                memberships: {
                  create: {
                    title: organization!.title,
                    organization: {
                      create: {
                        name: organization!.name,
                        industry: organization!.industry,
                        size: organization!.size,
                        website: organization!.website,
                      },
                    },
                  },
                },
              }),
        },
      });
      await createSession(user.id);
      return { role: user.role };
    }
  }
  const user = await requireUser();
  if (area === "overview" && method === "GET") {
    await requireUser("COMPANY");
    const organizationId = orgId(user);
    if (!organizationId) throw new AppError(403, "Организация не найдена");
    const [activity, insights] = await Promise.all([
      db.$queryRaw<
        { day: string; count: number }[]
      >`SELECT to_char(r."completedAt", 'YYYY-MM-DD') AS day, count(*)::int AS count FROM "Response" r JOIN "ResearchParticipant" p ON p.id=r."participantId" JOIN "Research" s ON s.id=p."researchId" WHERE s."organizationId"=${organizationId} GROUP BY day ORDER BY day DESC LIMIT 30`,
      db.aIAnalysis.findMany({
        where: { research: { organizationId } },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          researchId: true,
          result: true,
          model: true,
          research: { select: { title: true } },
        },
      }),
    ]);
    return { activity: activity.reverse(), insights };
  }
  if (area === "account") {
    if (method === "PATCH") {
      const input = z
        .object({
          name: z.string().trim().min(2).max(60),
          profile: profileSchema.optional(),
        })
        .parse(await body(req));
      await db.user.update({
        where: { id: user.id },
        data: {
          name: input.name,
          ...(user.profile && input.profile
            ? {
                profile: {
                  update: {
                    ...input.profile,
                    parentalConsentStatus: parentalConsentStatus(
                      input.profile.age,
                    ),
                  },
                },
              }
            : {}),
        },
      });
      return { ok: true };
    }
    if (method === "DELETE") {
      const input = z
        .object({ password: z.string().min(1).max(72) })
        .parse(await body(req));
      if (!(await compare(input.password, user.passwordHash)))
        throw new AppError(403, "Неверный пароль");
      await db.$transaction(async (tx) => {
        if (user.profile) {
          const affected = await tx.researchParticipant.findMany({
            where: { respondentId: user.profile.id },
            select: { researchId: true },
          });
          const ids = affected.map((a) => a.researchId);
          await tx.aIAnalysis.deleteMany({
            where: { researchId: { in: ids } },
          });
          await tx.aIConversation.deleteMany({
            where: { researchId: { in: ids } },
          });
        }
        for (const m of user.memberships) {
          const count = await tx.organizationMember.count({
            where: { organizationId: m.organizationId },
          });
          if (count === 1)
            await tx.organization.delete({ where: { id: m.organizationId } });
        }
        await tx.user.delete({ where: { id: user.id } });
      });
      await logout();
      return { ok: true };
    }
  }
  if (area === "research") {
    await requireUser("COMPANY");
    if (!id && method === "GET") {
      const organizationId = orgId(user);
      if (!organizationId) throw new AppError(403, "Организация не найдена");
      const [rows, counts] = await Promise.all([
        db.research.findMany({
          where: { organizationId },
          include: { target: true, _count: { select: { participants: true } } },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        db.$queryRaw<
          { id: string; count: number }[]
        >`SELECT s.id, count(r.id)::int AS count FROM "Research" s LEFT JOIN "ResearchParticipant" p ON p."researchId"=s.id LEFT JOIN "Response" r ON r."participantId"=p.id WHERE s."organizationId"=${organizationId} GROUP BY s.id`,
      ]);
      return rows.map((r) => ({
        ...r,
        responses: counts.find((c) => c.id === r.id)?.count || 0,
      }));
    }
    if (!id && method === "POST") {
      if (!orgId(user)) throw new AppError(403, "Организация не найдена");
      return createResearch(
        researchSchema.parse(await body(req)),
        orgId(user)!,
      );
    }
    if (id === "audience" && method === "POST") {
      const target = targetSchema.parse(await body(req));
      return {
        count: await db.respondentProfile.count({
          where: {
            age: { gte: target.minAge, lte: target.maxAge },
            ...(target.gender ? { gender: target.gender } : {}),
            ...(target.region
              ? { region: { equals: target.region, mode: "insensitive" } }
              : {}),
            ...(target.interests.length
              ? { interests: { hasSome: target.interests } }
              : {}),
            ...(target.categories.length
              ? { categories: { hasSome: target.categories } }
              : {}),
          },
        }),
      };
    }
    const r = await getResearch(id, user, true);
    if (!action && method === "GET") return r;
    if (action === "status" && method === "POST") {
      const data = z
        .object({
          status: z.enum([
            "DRAFT",
            "ACTIVE",
            "PAUSED",
            "COMPLETED",
            "ARCHIVED",
          ]),
        })
        .parse(await body(req));
      const transitions: Record<string, string[]> = {
        DRAFT: ["ACTIVE", "ARCHIVED"],
        ACTIVE: ["PAUSED", "COMPLETED"],
        PAUSED: ["ACTIVE", "COMPLETED", "ARCHIVED"],
        COMPLETED: ["ARCHIVED"],
        ARCHIVED: [],
      };
      if (!transitions[r.status].includes(data.status))
        throw new AppError(409, "Недопустимое изменение статуса");
      return db.research.update({
        where: { id },
        data: {
          status: data.status,
          ...(data.status === "ACTIVE" && !r.publishedAt
            ? { publishedAt: new Date() }
            : {}),
        },
      });
    }
    if (action === "release" && method === "POST") {
      if (r.visibility !== "SHARED")
        throw new AppError(400, "Только для Shared исследований");
      const { released } = z
        .object({ released: z.boolean() })
        .parse(await body(req));
      return db.research.update({
        where: { id },
        data: { sharedReleased: released },
      });
    }
    if (action === "analytics" && method === "GET")
      return analytics(id, filters(req));
    if (action === "responses" && method === "GET") {
      const page = z.coerce
        .number()
        .int()
        .min(1)
        .max(10000)
        .parse(req.nextUrl.searchParams.get("page") || 1);
      const where = responseWhere(id, filters(req));
      const [count, rows] = await Promise.all([
        db.response.count({ where }),
        db.response.findMany({
          where,
          orderBy: { completedAt: "desc" },
          skip: (page - 1) * 20,
          take: 20,
          select: {
            id: true,
            age: true,
            gender: true,
            region: true,
            completedAt: true,
            answers: {
              select: {
                id: true,
                text: true,
                number: true,
                question: { select: { text: true } },
                selections: { select: { option: { select: { text: true } } } },
              },
            },
          },
        }),
      ]);
      return {
        count,
        page,
        rows: rows.map((row) => ({
          ...row,
          id: `R-${row.id.slice(-7)}`,
          answers: row.answers.map((a) => ({
            ...a,
            text: a.text ? redact(a.text) : null,
          })),
        })),
      };
    }
    if (action === "analysis") {
      if (method === "POST") {
        await rateLimit(`ai:${user.id}`, 8, 3600);
        return generateAnalysis(id);
      }
      const latest = await db.aIAnalysis.findFirst({
        where: { researchId: id },
        orderBy: { createdAt: "desc" },
      });
      return {
        analysis: latest,
        stale: latest
          ? latest.fingerprint !== digest(JSON.stringify(await aiDataset(id)))
          : false,
      };
    }
    if (action === "assistant") {
      const conversation = await db.aIConversation.findUnique({
        where: { researchId_userId: { researchId: id, userId: user.id } },
      });
      if (method === "GET")
        return conversation
          ? db.aIMessage.findMany({
              where: { conversationId: conversation.id },
              orderBy: { createdAt: "asc" },
              take: 50,
            })
          : [];
      await rateLimit(`ai:${user.id}`, 8, 3600);
      const { message } = z
        .object({ message: z.string().trim().min(3).max(1000) })
        .parse(await body(req));
      return askAssistant(id, user.id, message);
    }
  }
  if (area === "library" && method === "GET") {
    await requireUser("COMPANY");
    const where: Prisma.ResearchWhereInput = {
      status: { in: ["ACTIVE", "COMPLETED"] },
      OR: [
        { visibility: "OPEN" },
        { visibility: "SHARED", sharedReleased: true },
      ],
    };
    if (id) {
      const r = await getResearch(id, user);
      const data = await analytics(id);
      return {
        research: {
          id: r.id,
          title: r.title,
          category: r.category,
          brand: r.brand,
          description: r.description,
        },
        analytics: { ...data, quotes: [] },
      };
    }
    return db.research.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        visibility: true,
        createdAt: true,
        target: true,
        _count: {
          select: { participants: { where: { response: { isNot: null } } } },
        },
      },
      take: 60,
      orderBy: { createdAt: "desc" },
    });
  }
  if (area === "youth") {
    await requireUser("RESPONDENT");
    if (!user.profile) throw new AppError(403, "Нет профиля");
    if (id === "feed") {
      const studies = await db.research.findMany({
        where: {
          OR: [
            { status: "ACTIVE" },
            { participants: { some: { respondentId: user.profile.id } } },
          ],
        },
        include: {
          target: true,
          participants: {
            where: { respondentId: user.profile.id },
            include: { response: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      const rewards = await db.rewardTransaction.aggregate({
        where: { respondentId: user.profile.id },
        _sum: { amount: true },
      });
      return {
        balance: rewards._sum.amount || 0,
        research: studies
          .filter(
            (r) => r.participants.length || matches(user.profile!, r.target),
          )
          .map(({ participants, ...r }) => ({
            ...r,
            state: participants[0]?.response
              ? "completed"
              : r.status !== "ACTIVE"
                ? "closed"
                : !matches(user.profile!, r.target)
                  ? "unavailable"
                  : participants.length
                    ? "started"
                    : "available",
          })),
      };
    }
    if (id === "rewards")
      return db.rewardTransaction.findMany({
        where: { respondentId: user.profile.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    if (id === "survey") {
      const r = await survey(action, user);
      if (method === "GET") return r;
      const sub = path[3];
      if (sub === "start") {
        const p = await db.researchParticipant.upsert({
          where: {
            researchId_respondentId: {
              researchId: action,
              respondentId: user.profile.id,
            },
          },
          create: { researchId: action, respondentId: user.profile.id },
          update: {},
          include: { response: true },
        });
        if (p.response)
          throw new AppError(409, "Вы уже завершили исследование");
        return { ok: true };
      }
      if (sub === "complete") {
        const { answers } = z
          .object({
            answers: z
              .array(
                z.object({
                  questionId: z.string(),
                  text: z.string().max(2000).optional(),
                  number: z.number().optional(),
                  optionIds: z.array(z.string()).max(12).optional(),
                }),
              )
              .max(25),
          })
          .parse(await body(req));
        return completeSurvey(action, user, answers);
      }
      if (sub === "flag") {
        const { reason } = z
          .object({ reason: z.string().trim().min(5).max(500) })
          .parse(await body(req));
        await rateLimit(`flag:${user.id}`, 5, 3600);
        return db.flag.create({
          data: { userId: user.id, researchId: action, reason },
        });
      }
    }
  }
  if (area === "admin") {
    await requireUser("ADMIN");
    if (id === "flags" && method === "PATCH") {
      const { id: flagId } = z
        .object({ id: z.string() })
        .parse(await body(req));
      return db.flag.update({
        where: { id: flagId },
        data: { resolved: true },
      });
    }
    const [users, companies, research, flags, responses] = await Promise.all([
      db.user.findMany({
        select: { id: true, name: true, role: true, createdAt: true },
        take: 100,
      }),
      db.organization.findMany({ take: 100 }),
      db.research.findMany({
        select: { id: true, title: true, status: true, visibility: true },
        take: 100,
      }),
      db.flag.findMany({
        include: { research: { select: { title: true } } },
        take: 100,
        orderBy: { createdAt: "desc" },
      }),
      db.response.count(),
    ]);
    return { users, companies, research, flags, responses };
  }
  if (area === "categories") return categories;
  throw new AppError(404, "Маршрут не найден");
}
async function handler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await context.params;
    return NextResponse.json(await dispatch(req, path), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    if (e instanceof AppError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof z.ZodError)
      return NextResponse.json(
        { error: e.issues[0]?.message || "Проверьте поля формы" },
        { status: 400 },
      );
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return NextResponse.json(
        { error: "Такая запись уже существует" },
        { status: 409 },
      );
    console.error(
      "API request failed",
      e instanceof Error ? e.name : "UnknownError",
    );
    return NextResponse.json(
      { error: "Не удалось выполнить запрос. Попробуйте снова." },
      { status: 500 },
    );
  }
}
export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
