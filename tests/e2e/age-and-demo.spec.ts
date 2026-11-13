const demoPassword = process.env.E2E_DEMO_PASSWORD || "VeyraDemo2026!";
import { test, expect, request as apiRequest } from "@playwright/test";
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
test("registration and profile enforce inclusive age 12–99 on the server", async () => {
  const profile = {
    gender: "Не указывать",
    region: "Казань",
    interests: ["Игры"],
    categories: ["Gaming"],
    brands: [],
  };
  for (const age of [11, 12, 99, 100, 12.5]) {
    const ctx = await apiRequest.newContext({
      baseURL,
      extraHTTPHeaders: { Origin: baseURL },
    });
    const password = "AgeBoundary2026!";
    const result = await ctx.post("/api/auth/register", {
      data: {
        email: `age-${String(age).replace(".", "-")}-${Date.now()}@example.com`,
        password,
        name: "Age Test",
        role: "RESPONDENT",
        consent: true,
        profile: { ...profile, age },
      },
    });
    if (age === 12 || age === 99) {
      expect(result.status()).toBe(200);
      const me = await (await ctx.get("/api/auth/me")).json();
      expect(me.user.profile.age).toBe(age);
      expect(me.user.profile.parentalConsentStatus).toBe(
        age < 18 ? "UNVERIFIED" : "NOT_REQUIRED",
      );
      expect(
        (
          await ctx.patch("/api/account", {
            data: { name: "Age Test", profile: { ...profile, age: 11 } },
          })
        ).status(),
      ).toBe(400);
      expect(
        (
          await ctx.patch("/api/account", {
            data: { name: "Age Test", profile: { ...profile, age: 100 } },
          })
        ).status(),
      ).toBe(400);
      expect(
        (
          await ctx.patch("/api/account", {
            data: {
              name: "Age Test",
              profile: { ...profile, age: age === 12 ? 99 : 12 },
            },
          })
        ).status(),
      ).toBe(200);
      const changed = await (await ctx.get("/api/auth/me")).json();
      expect(changed.user.profile.parentalConsentStatus).toBe(
        age === 12 ? "NOT_REQUIRED" : "UNVERIFIED",
      );
      expect(
        (await ctx.delete("/api/account", { data: { password } })).status(),
      ).toBe(200);
    } else expect(result.status()).toBe(400);
    await ctx.dispose();
  }
});
test("expanded demo organizations own distinct studies and profiles cover age boundaries", async () => {
  const ids = new Set<string>();
  for (const email of [
    "nova@example.com",
    "mira@example.com",
    "loop@example.com",
    "orbit@example.com",
  ]) {
    const ctx = await apiRequest.newContext({
      baseURL,
      extraHTTPHeaders: { Origin: baseURL },
    });
    expect(
      (
        await ctx.post("/api/auth/login", {
          data: { email, password: demoPassword },
        })
      ).ok(),
    ).toBeTruthy();
    const rows = await (await ctx.get("/api/research")).json();
    expect(rows).toHaveLength(5);
    expect(new Set(rows.map((r: { status: string }) => r.status)).size).toBe(5);
    for (const row of rows) {
      expect(ids.has(row.id)).toBe(false);
      ids.add(row.id);
    }
    await ctx.dispose();
  }
  for (const [email, age] of [
    ["teen12@example.com", 12],
    ["senior99@example.com", 99],
  ] as const) {
    const ctx = await apiRequest.newContext({
      baseURL,
      extraHTTPHeaders: { Origin: baseURL },
    });
    expect(
      (
        await ctx.post("/api/auth/login", {
          data: { email, password: demoPassword },
        })
      ).ok(),
    ).toBeTruthy();
    expect(
      (await (await ctx.get("/api/auth/me")).json()).user.profile.age,
    ).toBe(age);
    expect((await ctx.get("/api/youth/feed")).ok()).toBeTruthy();
    await ctx.dispose();
  }
});
