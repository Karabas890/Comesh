import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
export async function currentUser() {
  const token = (await cookies()).get("veyra_session")?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: digest(token) },
    include: {
      user: {
        include: {
          profile: true,
          memberships: { include: { organization: true } },
        },
      },
    },
  });
  return session && session.expiresAt > new Date() ? session.user : null;
}
export async function requireUser(role?: "COMPANY" | "RESPONDENT" | "ADMIN") {
  const user = await currentUser();
  if (!user) throw new AppError(401, "Войдите в аккаунт");
  if (role && user.role !== role) throw new AppError(403, "Недостаточно прав");
  return user;
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 86400000);
  await db.session.create({
    data: { tokenHash: digest(token), userId, expiresAt },
  });
  (await cookies()).set("veyra_session", token, {
    httpOnly: true,
    secure:
      process.env.COOKIE_SECURE === "true" ||
      (process.env.NODE_ENV === "production" &&
        process.env.COOKIE_SECURE !== "false"),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}
export async function logout() {
  const token = (await cookies()).get("veyra_session")?.value;
  if (token)
    await db.session.deleteMany({ where: { tokenHash: digest(token) } });
  (await cookies()).delete("veyra_session");
}
export async function rateLimit(key: string, max: number, seconds = 60) {
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const row = await db.rateLimit.upsert({
    where: { key: digest(`${key}:${bucket}`) },
    create: {
      key: digest(`${key}:${bucket}`),
      count: 1,
      expiresAt: new Date((bucket + 1) * seconds * 1000),
    },
    update: { count: { increment: 1 } },
  });
  if (row.count > max)
    throw new AppError(429, "Слишком много запросов. Попробуйте позже.");
}
export type AuthUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;
export const orgId = (user: AuthUser) => user.memberships[0]?.organizationId;
