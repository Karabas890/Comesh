import { z } from "zod";
export const respondentAgeSchema = z
  .number()
  .int()
  .min(12, "Минимальный возраст — 12 лет")
  .max(99, "Максимальный возраст — 99 лет");
export const parentalConsentStatus = (age: number) =>
  age < 18 ? "UNVERIFIED" : "NOT_REQUIRED";
export const categories = [
  "Fashion",
  "Beauty",
  "Gaming",
  "Entertainment",
  "Food",
  "Technology",
  "E-commerce",
  "Media",
  "Sport",
  "Music",
];
export const listSchema = z.array(z.string().trim().min(1).max(60)).max(15);
export const targetSchema = z
  .object({
    minAge: respondentAgeSchema,
    maxAge: respondentAgeSchema,
    gender: z.string().max(40).default(""),
    region: z.string().max(80).default(""),
    interests: listSchema.default([]),
    categories: listSchema.default([]),
  })
  .refine((t) => t.maxAge >= t.minAge, "Проверьте диапазон возраста");
export const questionSchema = z
  .object({
    text: z.string().trim().min(3).max(500),
    type: z.enum(["SINGLE", "MULTIPLE", "RATING", "TEXT", "YESNO"]),
    required: z.boolean(),
    scale: z.number().int().min(2).max(10).default(5),
    options: z.array(z.string().trim().min(1).max(150)).max(12).default([]),
  })
  .superRefine((q, ctx) => {
    if (
      ["SINGLE", "MULTIPLE"].includes(q.type) &&
      (q.options.length < 2 || new Set(q.options).size !== q.options.length)
    )
      ctx.addIssue({
        code: "custom",
        message: "Нужны минимум два уникальных варианта",
      });
  });
export const researchSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(5).max(2000),
  brand: z.string().trim().min(1).max(80),
  category: z.enum(categories as [string, ...string[]]),
  objective: z.string().trim().min(3).max(200),
  target: targetSchema,
  questions: z.array(questionSchema).min(1).max(25),
  visibility: z.enum(["PRIVATE", "SHARED", "OPEN"]),
  reward: z.number().int().min(1).max(1000),
  minutes: z.number().int().min(1).max(60).default(4),
});
export type ResearchInput = z.infer<typeof researchSchema>;
type Profile = {
  age: number;
  gender: string;
  region: string;
  interests: string[];
  categories: string[];
};
export function matches(
  profile: Profile,
  target: z.infer<typeof targetSchema> | null,
) {
  if (!target) return true;
  return (
    profile.age >= target.minAge &&
    profile.age <= target.maxAge &&
    (!target.gender || profile.gender === target.gender) &&
    (!target.region ||
      profile.region.toLowerCase() === target.region.toLowerCase()) &&
    (!target.interests.length ||
      target.interests.some((i) => profile.interests.includes(i))) &&
    (!target.categories.length ||
      target.categories.some((i) => profile.categories.includes(i)))
  );
}
export function canReadAggregate(
  r: {
    organizationId: string;
    visibility: string;
    sharedReleased: boolean;
    status: string;
  },
  orgId?: string,
) {
  return (
    r.organizationId === orgId ||
    (["ACTIVE", "COMPLETED"].includes(r.status) &&
      (r.visibility === "OPEN" ||
        (r.visibility === "SHARED" && r.sharedReleased)))
  );
}
export function canManage(r: { organizationId: string }, orgId?: string) {
  return r.organizationId === orgId;
}
export function rewardAmount(reward: number, completed: boolean) {
  return completed ? 0 : reward;
}
export function distribution(values: (string | number)[]) {
  return Object.entries(
    values.reduce<Record<string, number>>((acc, v) => {
      acc[String(v)] = (acc[String(v)] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, count]) => ({ name, count }));
}
export function average(values: number[]) {
  return values.length
    ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) /
        100
    : null;
}
export function redact(text: string) {
  return text
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[email скрыт]")
    .replace(/(?:\+?\d[\d ()-]{7,}\d)/g, "[номер скрыт]")
    .replace(/https?:\/\/\S+/gi, "[ссылка скрыта]");
}
