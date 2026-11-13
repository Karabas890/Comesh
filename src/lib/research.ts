import { Prisma } from "@prisma/client";
import { db } from "./db";
import { AppError, AuthUser, orgId } from "./auth";
import { canReadAggregate, matches, ResearchInput } from "./domain";
export const researchInclude = {
  target: true,
  questions: {
    orderBy: { position: "asc" as const },
    include: { options: { orderBy: { position: "asc" as const } } },
  },
  _count: { select: { participants: true } },
};
export async function getResearch(id: string, user: AuthUser, manage = false) {
  const r = await db.research.findUnique({
    where: { id },
    include: researchInclude,
  });
  if (!r) throw new AppError(404, "Исследование не найдено");
  if (
    user.role !== "COMPANY" ||
    (manage
      ? r.organizationId !== orgId(user)
      : !canReadAggregate(r, orgId(user)))
  )
    throw new AppError(404, "Исследование не найдено");
  return r;
}
export async function createResearch(
  input: ResearchInput,
  organizationId: string,
) {
  const { target, questions, ...data } = input;
  return db.research.create({
    data: {
      ...data,
      organizationId,
      target: { create: target },
      questions: {
        create: questions.map((q, position) => ({
          ...q,
          position,
          options: {
            create: q.options.map((text, position) => ({ text, position })),
          },
        })),
      },
    },
    include: researchInclude,
  });
}
export async function survey(id: string, user: AuthUser) {
  if (!user.profile) throw new AppError(403, "Заполните профиль");
  const r = await db.research.findUnique({
    where: { id },
    include: researchInclude,
  });
  if (!r || !matches(user.profile, r.target))
    throw new AppError(404, "Исследование недоступно");
  if (r.status !== "ACTIVE")
    throw new AppError(409, "Исследование закрыто или приостановлено");
  return r;
}
export type SubmittedAnswer = {
  questionId: string;
  text?: string;
  number?: number;
  optionIds?: string[];
};
export async function completeSurvey(
  id: string,
  user: AuthUser,
  answers: SubmittedAnswer[],
) {
  const r = await survey(id, user);
  const profile = user.profile!;
  if (
    new Set(answers.map((a) => a.questionId)).size !== answers.length ||
    answers.some((a) => !r.questions.some((q) => q.id === a.questionId))
  )
    throw new AppError(400, "Некорректный набор ответов");
  const clean = r.questions.flatMap((q) => {
    const a = answers.find((a) => a.questionId === q.id);
    const empty =
      !a ||
      (q.type === "TEXT"
        ? !a.text?.trim()
        : ["SINGLE", "MULTIPLE"].includes(q.type)
          ? !a.optionIds?.length
          : a.number === undefined);
    if (empty) {
      if (q.required) throw new AppError(400, `Ответьте: ${q.text}`);
      return [];
    }
    if (q.type === "TEXT" && (!a!.text || a!.text.length > 2000))
      throw new AppError(400, "Текст должен быть короче 2000 символов");
    if (
      ["RATING", "YESNO"].includes(q.type) &&
      (!Number.isInteger(a!.number) ||
        a!.number! < (q.type === "YESNO" ? 0 : 1) ||
        a!.number! > (q.type === "YESNO" ? 1 : q.scale))
    )
      throw new AppError(400, "Недопустимая оценка");
    if (
      ["SINGLE", "MULTIPLE"].includes(q.type) &&
      (!a!.optionIds?.length ||
        (q.type === "SINGLE" && a!.optionIds.length !== 1) ||
        new Set(a!.optionIds).size !== a!.optionIds.length ||
        a!.optionIds.some((o) => !q.options.some((opt) => opt.id === o)))
    )
      throw new AppError(400, "Некорректный вариант");
    return [
      {
        questionId: q.id,
        text: q.type === "TEXT" ? a!.text!.trim() : null,
        number: ["RATING", "YESNO"].includes(q.type) ? a!.number : null,
        selections: {
          create: ["SINGLE", "MULTIPLE"].includes(q.type)
            ? a!.optionIds!.map((optionId) => ({ optionId }))
            : [],
        },
      },
    ];
  });
  try {
    return await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Research" WHERE id = ${id} FOR UPDATE`;
      const current = await tx.research.findUniqueOrThrow({ where: { id } });
      if (current.status !== "ACTIVE")
        throw new AppError(409, "Исследование закрыто");
      const participant = await tx.researchParticipant.upsert({
        where: {
          researchId_respondentId: { researchId: id, respondentId: profile.id },
        },
        create: { researchId: id, respondentId: profile.id },
        update: {},
        include: { response: true },
      });
      if (participant.response)
        throw new AppError(409, "Вы уже завершили это исследование");
      const response = await tx.response.create({
        data: {
          participantId: participant.id,
          age: profile.age,
          gender: profile.gender,
          region: profile.region,
          interests: profile.interests,
          answers: { create: clean },
        },
      });
      await tx.rewardTransaction.create({
        data: {
          respondentId: profile.id,
          participantId: participant.id,
          amount: current.reward,
          description: current.title,
        },
      });
      return { responseId: response.id, reward: current.reward };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      throw new AppError(409, "Ответ уже сохранён");
    throw error;
  }
}
