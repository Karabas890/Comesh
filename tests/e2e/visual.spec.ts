const demoPassword = process.env.E2E_DEMO_PASSWORD || "VeyraDemo2026!";
import { test, expect } from "@playwright/test";
test("visual smoke: landing, company, respondent at 360px, admin", async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const consoleErrors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Меньше догадок/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/landing-desktop.png",
    fullPage: true,
  });
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("company@example.com");
  await page.getByLabel("Пароль", { exact: true }).fill(demoPassword);
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page).toHaveURL("/company");
  await expect(
    page.getByText("Последние исследования", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/company-desktop.png",
    fullPage: true,
  });
  await page.goto("/company/research");
  await expect(
    page.getByText("Sneaker Culture 2026", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link")
    .filter({ hasText: "Sneaker Culture 2026" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Что для тебя важнее всего при выборе?",
    }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/analytics-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "AI-инсайты", exact: true }).click();
  await expect(page.getByText("EXECUTIVE SUMMARY")).toBeVisible();
  await page.goto("/company/library");
  await expect(
    page.getByText("Energy, your way", { exact: true }),
  ).toBeVisible();
  const youth = await browser.newContext({
    viewport: { width: 360, height: 800 },
    reducedMotion: "reduce",
  });
  const yp = await youth.newPage();
  yp.on("pageerror", (e) => errors.push(e.message));
  await yp.goto("/login");
  await yp.getByLabel("Email", { exact: true }).fill("teen@example.com");
  await yp.getByLabel("Пароль", { exact: true }).fill(demoPassword);
  await yp.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(yp).toHaveURL("/youth");
  await expect(yp.getByText("Тебе подойдёт")).toBeVisible();
  expect(
    await yp.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await yp.screenshot({
    path: "test-results/youth-mobile.png",
    fullPage: true,
  });
  await yp.locator('a[href^="/youth/survey/"]').first().click();
  await yp.getByRole("button", { name: "Начать опрос", exact: true }).click();
  await expect(
    yp
      .getByRole("region", { name: "Переписка опроса" })
      .getByRole("heading", { level: 2 }),
  ).toBeVisible();
  expect(
    await yp.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await yp.screenshot({
    path: "test-results/survey-mobile.png",
    animations: "disabled",
    fullPage: true,
  });
  const admin = await browser.newContext();
  const ap = await admin.newPage();
  await ap.goto("/login");
  await ap.getByLabel("Email", { exact: true }).fill("admin@example.com");
  await ap.getByLabel("Пароль", { exact: true }).fill(demoPassword);
  await ap.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(ap).toHaveURL("/admin");
  await expect(
    ap.getByRole("heading", { name: "Пульс платформы" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  expect(consoleErrors.filter((s) => !s.includes("favicon"))).toEqual([]);
  await Promise.all([ctx.close(), youth.close(), admin.close()]);
});
