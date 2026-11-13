import { Prisma } from "@prisma/client";
import { db } from "./db";
import { redact } from "./domain";
export type Filters = {
  minAge?: number;
  maxAge?: number;
  gender?: string;
  region?: string;
  interest?: string;
  question?: string;
};
export function responseWhere(
  id: string,
  f: Filters,
): Prisma.ResponseWhereInput {
  return {
    participant: { researchId: id },
    age: { gte: f.minAge, lte: f.maxAge },
    ...(f.gender ? { gender: f.gender } : {}),
    ...(f.region ? { region: { equals: f.region, mode: "insensitive" } } : {}),
    ...(f.interest ? { interests: { has: f.interest } } : {}),
  };
}
export async function analytics(id: string, f: Filters = {}) {
  const where = responseWhere(id, f);
  const questions = await db.question.findMany({
    where: { researchId: id, ...(f.question ? { id: f.question } : {}) },
    orderBy: { position: "asc" },
    include: { options: true },
  });
  const [
    count,
    started,
    ages,
    genders,
    regions,
    ratings,
    selected,
    texts,
    activity,
  ] = await Promise.all([
    db.response.count({ where }),
    db.researchParticipant.count({
      where: {
        researchId: id,
        OR: [
          { response: { is: where } },
          {
            response: null,
            respondent: {
              age: { gte: f.minAge, lte: f.maxAge },
              ...(f.gender ? { gender: f.gender } : {}),
              ...(f.region
                ? { region: { equals: f.region, mode: "insensitive" } }
                : {}),
              ...(f.interest ? { interests: { has: f.interest } } : {}),
            },
          },
        ],
      },
    }),
    db.response.groupBy({
      by: ["age"],
      where,
      _count: true,
      orderBy: { age: "asc" },
    }),
    db.response.groupBy({ by: ["gender"], where, _count: true }),
    db.response.groupBy({ by: ["region"], where, _count: true }),
    db.answer.groupBy({
      by: ["questionId", "number"],
      where: { response: where, number: { not: null } },
      _count: true,
    }),
    db.answerSelection.groupBy({
      by: ["optionId"],
      where: { answer: { response: where } },
      _count: true,
    }),
    db.answer.findMany({
      where: {
        response: where,
        text: { not: null },
        ...(f.question ? { questionId: f.question } : {}),
      },
      select: {
        id: true,
        text: true,
        questionId: true,
        response: { select: { id: true, age: true, gender: true } },
      },
      orderBy: { id: "asc" },
      take: 30,
    }),
    db.$queryRaw<{ day: string; count: number }[]>(
      Prisma.sql`SELECT to_char(r."completedAt", 'YYYY-MM-DD') AS day, count(*)::int AS count FROM "Response" r JOIN "ResearchParticipant" p ON p.id=r."participantId" WHERE p."researchId"=${id} ${f.minAge ? Prisma.sql`AND r.age>=${f.minAge}` : Prisma.empty} ${f.maxAge ? Prisma.sql`AND r.age<=${f.maxAge}` : Prisma.empty} ${f.gender ? Prisma.sql`AND r.gender=${f.gender}` : Prisma.empty} ${f.region ? Prisma.sql`AND lower(r.region)=lower(${f.region})` : Prisma.empty} ${f.interest ? Prisma.sql`AND ${f.interest}=ANY(r.interests)` : Prisma.empty} GROUP BY day ORDER BY day DESC LIMIT 30`,
    ),
  ]);
  return {
    count,
    started,
    completionRate: started
      ? Math.min(100, Math.round((count / started) * 100))
      : 0,
    demographics: {
      age: ages.map((a) => ({ name: String(a.age), count: a._count })),
      gender: genders.map((a) => ({ name: a.gender, count: a._count })),
      region: regions.map((a) => ({ name: a.region, count: a._count })),
    },
    activity: activity.reverse(),
    questions: questions.map((q) => {
      const rs = ratings.filter((r) => r.questionId === q.id);
      const total = rs.reduce((n, r) => n + r._count, 0);
      return {
        id: q.id,
        text: q.text,
        type: q.type,
        average: total
          ? Math.round(
              (rs.reduce((n, r) => n + r.number! * r._count, 0) / total) * 100,
            ) / 100
          : null,
        distribution: ["RATING", "YESNO"].includes(q.type)
          ? rs.map((r) => ({
              name:
                q.type === "YESNO"
                  ? r.number
                    ? "Да"
                    : "Нет"
                  : String(r.number),
              count: r._count,
            }))
          : q.options.map((o) => ({
              name: o.text,
              count: selected.find((s) => s.optionId === o.id)?._count || 0,
            })),
      };
    }),
    quotes: texts.map((a) => ({
      answerId: a.id,
      questionId: a.questionId,
      respondentId: `R-${a.response.id.slice(-7)}`,
      text: redact(a.text!),
      age: a.response.age,
      gender: a.response.gender,
    })),
  };
}
