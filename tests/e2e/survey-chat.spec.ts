import { test, expect } from "@playwright/test";
test("mobile chat: introduction, all answer types, editing and completion", async ({
  browser,
}) => {
  const origin = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
  const company = await browser.newContext({
    extraHTTPHeaders: { Origin: origin },
  });
  const youth = await browser.newContext({
    viewport: { width: 360, height: 800 },
    extraHTTPHeaders: { Origin: origin },
  });
  const password = "Chat-test-password-2026!";
  const stamp = Date.now();
  const register = (role: string) => ({
    email: role.toLowerCase() + "-chat-" + stamp + "@example.com",
    password,
    role,
    name: "Chat test",
    consent: true,
    ...(role === "COMPANY"
      ? {
          organization: {
            name: "Chat studio",
            industry: "Testing",
            size: "1",
            title: "Researcher",
          },
        }
      : {
          profile: {
            age: 20,
            gender: "Не указывать",
            region: "Москва",
            interests: [],
            categories: ["Entertainment"],
            brands: [],
          },
        }),
  });
  try {
    expect(
      (
        await company.request.post("/api/auth/register", {
          data: register("COMPANY"),
        })
      ).ok(),
    ).toBeTruthy();
    expect(
      (
        await youth.request.post("/api/auth/register", {
          data: register("RESPONDENT"),
        })
      ).ok(),
    ).toBeTruthy();
    const created = await company.request.post("/api/research", {
      data: {
        title: "Твой вечер " + stamp,
        description:
          "Говорим о сериалах и подписках. Помоги сделать просмотр удобнее.",
        brand: "Stream",
        category: "Entertainment",
        objective: "Feedback",
        visibility: "PRIVATE",
        reward: 90,
        minutes: 3,
        target: {
          minAge: 12,
          maxAge: 99,
          gender: "",
          region: "",
          interests: [],
          categories: [],
        },
        questions: [
          {
            text: "Что смотришь?",
            type: "SINGLE",
            options: ["Сериалы", "Кино"],
            required: true,
            scale: 5,
          },
          {
            text: "Что важно?",
            type: "MULTIPLE",
            options: ["Цена", "Качество", "Каталог"],
            required: true,
            scale: 5,
          },
          {
            text: "Как тебе сервис?",
            type: "RATING",
            options: [],
            required: true,
            scale: 5,
          },
          {
            text: "Посоветуешь другу?",
            type: "YESNO",
            options: [],
            required: true,
            scale: 5,
          },
          {
            text: "Что добавить?",
            type: "TEXT",
            options: [],
            required: false,
            scale: 5,
          },
        ],
      },
    });
    expect(created.ok()).toBeTruthy();
    const study = await created.json();
    expect(
      (
        await company.request.post("/api/research/" + study.id + "/status", {
          data: { status: "ACTIVE" },
        })
      ).ok(),
    ).toBeTruthy();
    const page = await youth.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/youth/survey/" + study.id);
    await expect(
      page.getByText(
        "Говорим о сериалах и подписках. Помоги сделать просмотр удобнее.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Что смотришь?" }),
    ).toHaveCount(0);
    expect(
      (
        await (
          await company.request.get("/api/research/" + study.id + "/analytics")
        ).json()
      ).started,
    ).toBe(0);
    await page.screenshot({
      path: "test-results/chat-intro-mobile.png",
      fullPage: true,
      animations: "disabled",
    });
    await page.getByRole("button", { name: "Начать опрос" }).click();
    await page.getByRole("button", { name: "Отправить", exact: true }).click();
    await expect(page.locator(".survey-chat").getByRole("alert")).toContainText(
      "Выбери или напиши",
    );
    await page.getByRole("button", { name: "A Сериалы", exact: true }).click();
    await page.getByRole("button", { name: "Отправить", exact: true }).click();
    await expect(page.locator(".survey-message-user")).toContainText("Сериалы");
    await page.getByRole("button", { name: "A Цена", exact: true }).click();
    await page.getByRole("button", { name: "B Качество", exact: true }).click();
    await page.getByRole("button", { name: "Отправить", exact: true }).click();
    await expect(page.locator(".survey-message-user").last()).toContainText(
      "Цена, Качество",
    );
    await page.getByRole("button", { name: "4", exact: true }).click();
    await page.getByRole("button", { name: "Отправить", exact: true }).click();
    await page.getByRole("button", { name: "Нет", exact: true }).click();
    await page.getByRole("button", { name: "Отправить", exact: true }).click();
    await page
      .getByLabel("Твой ответ", { exact: true })
      .fill("Больше документальных фильмов");
    await page
      .getByRole("button", { name: "Изменить ответ на вопрос 1", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "A Сериалы", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "B Кино", exact: true }).click();
    for (let i = 0; i < 4; i++)
      await page
        .getByRole("button", { name: "Отправить", exact: true })
        .click();
    await expect(page.getByLabel("Твой ответ", { exact: true })).toHaveValue(
      "Больше документальных фильмов",
    );
    await expect(page.locator(".survey-message-user").first()).toContainText(
      "Кино",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "test-results/chat-history-mobile.png",
      fullPage: true,
      animations: "disabled",
    });
    await page.getByRole("button", { name: "Завершить", exact: true }).click();
    await expect(page.getByText("Спасибо! Ответы сохранены.")).toBeVisible();
    await expect(page.locator(".survey-message-user")).toHaveCount(5);
    const stats = await (
      await company.request.get("/api/research/" + study.id + "/analytics")
    ).json();
    expect(stats.count).toBe(1);
    expect(stats.questions[0].distribution).toContainEqual({
      name: "Кино",
      count: 1,
    });
    expect(stats.questions[2].average).toBe(4);
    expect(stats.questions[3].average).toBe(0);
    expect(
      (await (await youth.request.get("/api/youth/rewards")).json()).filter(
        (r: { amount: number }) => r.amount === 90,
      ),
    ).toHaveLength(1);
    expect(errors).toEqual([]);
  } finally {
    for (const context of [company, youth]) {
      const result = await context.request.delete("/api/account", {
        data: { password },
      });
      expect([200, 401]).toContain(result.status());
      await context.close();
    }
  }
});
