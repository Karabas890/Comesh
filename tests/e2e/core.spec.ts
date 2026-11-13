const demoPassword = process.env.E2E_DEMO_PASSWORD || "VeyraDemo2026!";
import { test, expect, request as playwrightRequest } from "@playwright/test";
const APP_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const password = "TestVeyra2026!";
test("company registration → publish → respondent registration → complete → points → analytics → AI", async ({
  browser,
}) => {
  test.setTimeout(240000);
  const company = await browser.newContext();
  const youth = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const cp = await company.newPage(),
    yp = await youth.newPage();
  const errors: string[] = [];
  cp.on("pageerror", (e) => errors.push(e.message));
  yp.on("pageerror", (e) => errors.push(e.message));
  const stamp = Date.now();
  const title = `Sound in your city ${stamp}`;
  await cp.goto("/register?role=COMPANY");
  await cp
    .getByLabel("Email", { exact: true })
    .fill(`company-${stamp}@example.com`);
  await cp.getByLabel("Пароль", { exact: true }).fill(password);
  await cp.getByRole("button", { name: "Продолжить", exact: true }).click();
  await cp.getByLabel("Ваше имя", { exact: true }).fill("Тест Компания");
  await cp.getByLabel("Название компании").fill("Sound Studio");
  await cp.getByLabel("Отрасль").fill("Technology");
  await cp.getByLabel("Ваша должность").fill("Researcher");
  await cp.getByRole("checkbox").check();
  await cp
    .getByRole("button", { name: "Создать аккаунт", exact: true })
    .click();
  await expect(cp).toHaveURL("/company");
  await expect(cp.locator(".celebration-message[role=status]")).toContainText(
    "Добро пожаловать в Veyra",
  );
  await expect(cp.locator(".celebration-bursts i")).toHaveCount(54);
  await cp.reload();
  await expect(cp.locator(".registration-celebration")).toHaveCount(0);
  await cp.goto("/company/create");
  await cp.getByLabel("Название исследования").fill(title);
  await cp
    .getByLabel("Описание", { exact: true })
    .fill("Помоги выбрать наушники для города и поделись своим мнением.");
  await cp.getByLabel("Бренд / продукт").fill("Sound Studio");
  await cp.getByRole("button", { name: "Продолжить", exact: true }).click();
  await cp.getByRole("button", { name: "Продолжить", exact: true }).click();
  await cp
    .getByLabel("Текст вопроса", { exact: true })
    .fill("Что важнее всего в наушниках?");
  await cp.getByLabel("Вариант 1", { exact: true }).fill("Комфорт");
  await cp.getByLabel("Вариант 2", { exact: true }).fill("Звук");
  await cp
    .getByRole("button", { name: "Добавить вопрос", exact: true })
    .click();
  await cp
    .getByLabel("Текст вопроса", { exact: true })
    .nth(1)
    .fill("Что стоит улучшить?");
  await cp
    .getByLabel("Тип вопроса", { exact: true })
    .nth(1)
    .selectOption("TEXT");
  await cp.getByRole("button", { name: "Продолжить", exact: true }).click();
  await cp.getByRole("button", { name: "Продолжить", exact: true }).click();
  await cp.getByLabel("Награда в баллах").fill("135");
  await cp.getByRole("button", { name: "Продолжить", exact: true }).click();
  await cp.getByRole("button", { name: "Продолжить", exact: true }).click();
  await cp.getByRole("button", { name: "Опубликовать", exact: true }).click();
  await expect(cp).toHaveURL(/\/company\/research\//);
  const id = cp.url().split("/").pop()!;
  await expect(cp.getByText("Активно", { exact: true })).toBeVisible();
  await yp.goto("/register?role=RESPONDENT");
  await yp
    .getByLabel("Email", { exact: true })
    .fill(`respondent-${stamp}@example.com`);
  await yp.getByLabel("Пароль", { exact: true }).fill(password);
  await yp.getByRole("button", { name: "Продолжить", exact: true }).click();
  await yp.getByLabel("Никнейм").fill("Мнение");
  await yp.getByLabel("Возраст (12–99 лет)", { exact: true }).fill("12");
  await yp.getByRole("checkbox").check();
  await yp
    .getByRole("button", { name: "Создать аккаунт", exact: true })
    .click();
  await expect(yp).toHaveURL("/youth");
  await expect(yp.locator(".celebration-message[role=status]")).toContainText(
    "Добро пожаловать в Veyra",
  );
  await yp.emulateMedia({ reducedMotion: "reduce" });
  await expect(yp.locator(".celebration-bursts")).toBeHidden();
  await yp.getByRole("link").filter({ hasText: title }).click();
  await expect(
    yp.getByText(
      "Помоги выбрать наушники для города и поделись своим мнением.",
      { exact: true },
    ),
  ).toBeVisible();
  await yp.getByRole("button", { name: "Начать опрос", exact: true }).click();
  await expect(
    yp.getByRole("heading", { name: "Что важнее всего в наушниках?" }),
  ).toBeVisible();
  await yp.getByRole("button", { name: "A Комфорт" }).click();
  await yp.getByRole("button", { name: "Отправить", exact: true }).click();
  await yp
    .getByLabel("Твой ответ", { exact: true })
    .fill("Мне нужен лёгкий корпус и мягкие амбушюры для долгих поездок.");
  await yp.getByRole("button", { name: "Завершить", exact: true }).click();
  await expect(yp.getByText("Спасибо! Ответы сохранены.")).toBeVisible();
  await expect(yp.getByText("+135 ✦", { exact: true })).toBeVisible();
  await yp.getByRole("link", { name: "Посмотреть баллы" }).click();
  await expect(yp.getByText(title, { exact: true })).toBeVisible();
  const dup = await youth.request.post(`/api/youth/survey/${id}/complete`, {
    headers: { Origin: APP_URL },
    data: { answers: [] },
  });
  expect([400, 409]).toContain(dup.status());
  const ledger = await youth.request.get("/api/youth/rewards");
  expect(
    (await ledger.json()).filter(
      (r: { description: string }) => r.description === title,
    ),
  ).toHaveLength(1);
  await cp.reload();
  await expect(cp.getByText("Комфорт", { exact: true }).first()).toBeVisible();
  const stats = await company.request.get(`/api/research/${id}/analytics`);
  const data = await stats.json();
  expect(data.count).toBe(1);
  expect(data.completionRate).toBe(100);
  expect(data.questions[0].distribution).toContainEqual({
    name: "Комфорт",
    count: 1,
  });
  await cp.getByRole("button", { name: "Ответы", exact: true }).click();
  await expect(cp.getByText("12 лет · Не указывать · Москва")).toBeVisible();
  await cp.locator("summary").click();
  await expect(
    cp.getByText(
      "Мне нужен лёгкий корпус и мягкие амбушюры для долгих поездок.",
      { exact: true },
    ),
  ).toBeVisible();
  if (process.env.RUN_LIVE_AI === "1") {
    await cp.getByRole("button", { name: "AI-инсайты", exact: true }).click();
    await cp.getByRole("button", { name: "Создать AI-анализ" }).click();
    await expect(cp.getByText("EXECUTIVE SUMMARY")).toBeVisible({
      timeout: 120000,
    });
    const saved = await (
      await company.request.get(`/api/research/${id}/analysis`)
    ).json();
    expect(saved.stale).toBe(false);
    expect(saved.analysis.result.sampleSize).toBe(1);
    expect(saved.analysis.result.representativeQuotes.length).toBeGreaterThan(
      0,
    );
    for (const quote of saved.analysis.result.representativeQuotes) {
      expect(data.quotes).toContainEqual(quote);
    }
    const cached = await (
      await company.request.post(`/api/research/${id}/analysis`, {
        headers: { Origin: APP_URL },
        data: {},
      })
    ).json();
    expect(cached.id).toBe(saved.analysis.id);
    await cp.getByRole("button", { name: "AI-ассистент", exact: true }).click();
    await cp
      .getByLabel("Вопрос ассистенту")
      .fill("Что стоит изменить в наушниках?");
    await cp.getByRole("button", { name: "Отправить вопрос" }).click();
    await expect(cp.getByText("VEYRA AI", { exact: true })).toBeVisible({
      timeout: 120000,
    });
    await expect(cp.getByText("Рекомендации", { exact: true })).toBeVisible();
  }
  await cp.screenshot({
    path: "test-results/company-flow.png",
    fullPage: true,
  });
  await yp.screenshot({ path: "test-results/youth-flow.png", fullPage: true });
  expect(errors).toEqual([]);
  await company.request.delete("/api/account", {
    headers: { Origin: APP_URL },
    data: { password },
  });
  await youth.request.delete("/api/account", {
    headers: { Origin: APP_URL },
    data: { password },
  });
  await company.close();
  await youth.close();
});
test("API isolation, visibility, atomic rewards, matching and invalid submissions", async () => {
  const baseURL = APP_URL,
    headers = { Origin: baseURL };
  const company = await playwrightRequest.newContext({
    baseURL,
    extraHTTPHeaders: headers,
  });
  const respondent = await playwrightRequest.newContext({
    baseURL,
    extraHTTPHeaders: headers,
  });
  const outsider = await playwrightRequest.newContext({
    baseURL,
    extraHTTPHeaders: headers,
  });
  const anonymous = await playwrightRequest.newContext({
    baseURL,
    extraHTTPHeaders: headers,
  });
  expect((await anonymous.get("/api/research")).status()).toBe(401);
  expect(
    (
      await company.post("/api/auth/login", {
        data: { email: "company@example.com", password: demoPassword },
      })
    ).ok(),
  ).toBeTruthy();
  const timestamp = Date.now();
  expect(
    (
      await outsider.post("/api/auth/register", {
        data: {
          email: `other-${timestamp}@example.com`,
          password,
          name: "Other",
          role: "COMPANY",
          consent: true,
          organization: {
            name: "Other Studio",
            industry: "Testing",
            size: "1",
            title: "Researcher",
          },
        },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await respondent.post("/api/auth/login", {
        data: { email: "teen@example.com", password: demoPassword },
      })
    ).ok(),
  ).toBeTruthy();
  const studies = await (await company.get("/api/research")).json();
  const privateStudy = studies.find(
    (s: { visibility: string }) => s.visibility === "PRIVATE",
  );
  const openStudy = studies.find(
    (s: { visibility: string }) => s.visibility === "OPEN",
  );
  for (const endpoint of [
    "",
    "/analytics",
    "/responses",
    "/analysis",
    "/assistant",
  ])
    expect(
      (
        await outsider.get(`/api/research/${privateStudy.id}${endpoint}`)
      ).status(),
    ).toBe(404);
  expect((await outsider.get(`/api/library/${privateStudy.id}`)).status()).toBe(
    404,
  );
  const publicData = await (
    await outsider.get(`/api/library/${openStudy.id}`)
  ).json();
  expect(publicData.analytics.quotes).toEqual([]);
  expect(JSON.stringify(publicData)).not.toContain("email");
  expect(
    (
      await respondent.get(`/api/research/${privateStudy.id}/analytics`)
    ).status(),
  ).toBe(403);
  const draft = studies.find((s: { status: string }) => s.status === "DRAFT");
  expect((await respondent.get(`/api/youth/survey/${draft.id}`)).status()).toBe(
    409,
  );
  const input = {
    title: `Atomic ${timestamp}`,
    description: "Concurrent rewards test",
    brand: "Test",
    category: "Gaming",
    objective: "Feedback",
    visibility: "PRIVATE",
    reward: 77,
    minutes: 2,
    target: {
      minAge: 18,
      maxAge: 30,
      gender: "",
      region: "",
      interests: [],
      categories: [],
    },
    questions: [
      {
        text: "Выбери вариант",
        type: "SINGLE",
        required: true,
        options: ["A", "B"],
        scale: 5,
      },
      {
        text: "Поставь оценку",
        type: "RATING",
        required: true,
        options: [],
        scale: 5,
      },
      {
        text: "Ты согласен?",
        type: "YESNO",
        required: true,
        options: [],
        scale: 5,
      },
      {
        text: "Несколько вариантов",
        type: "MULTIPLE",
        required: true,
        options: ["A", "B"],
        scale: 5,
      },
      {
        text: "Расскажи подробнее",
        type: "TEXT",
        required: false,
        options: [],
        scale: 5,
      },
    ],
  };
  const created = await outsider.post("/api/research", { data: input });
  expect(created.ok()).toBeTruthy();
  const r = await created.json();
  expect(
    (
      await outsider.post(`/api/research/${r.id}/status`, {
        data: { status: "ACTIVE" },
      })
    ).ok(),
  ).toBeTruthy();
  const invalid = await respondent.post(`/api/youth/survey/${r.id}/complete`, {
    data: {
      answers: [
        { questionId: r.questions[0].id, optionIds: ["foreign-option"] },
      ],
    },
  });
  expect(invalid.status()).toBe(400);
  const answers = r.questions.map(
    (q: { id: string; type: string; options: { id: string }[] }) => ({
      questionId: q.id,
      ...(q.type === "SINGLE" || q.type === "MULTIPLE"
        ? { optionIds: [q.options[0].id] }
        : q.type === "RATING"
          ? { number: 4 }
          : q.type === "YESNO"
            ? { number: 1 }
            : { text: "Хороший опыт." }),
    }),
  );
  const results = await Promise.all([
    respondent.post(`/api/youth/survey/${r.id}/complete`, {
      data: { answers },
    }),
    respondent.post(`/api/youth/survey/${r.id}/complete`, {
      data: { answers },
    }),
  ]);
  expect(results.map((r) => r.status()).sort()).toEqual([200, 409]);
  const ledger = await (await respondent.get("/api/youth/rewards")).json();
  expect(
    ledger.filter(
      (l: { description: string }) => l.description === input.title,
    ),
  ).toHaveLength(1);
  const stats = await (
    await outsider.get(`/api/research/${r.id}/analytics`)
  ).json();
  expect(stats.count).toBe(1);
  expect(
    stats.questions.find((q: { type: string }) => q.type === "RATING").average,
  ).toBe(4);
  expect(
    (
      await (
        await outsider.get(`/api/research/${r.id}/analytics?minAge=30`)
      ).json()
    ).count,
  ).toBe(0);
  const excluded = await (
    await outsider.post("/api/research", {
      data: {
        ...input,
        title: "Excluded",
        target: { ...input.target, minAge: 40, maxAge: 45 },
      },
    })
  ).json();
  await outsider.post(`/api/research/${excluded.id}/status`, {
    data: { status: "ACTIVE" },
  });
  expect(
    (await respondent.get(`/api/youth/survey/${excluded.id}`)).status(),
  ).toBe(404);
  expect(
    (
      await outsider.post("/api/research", {
        headers: { Origin: "https://evil.example" },
        data: input,
      })
    ).status(),
  ).toBe(403);
  await outsider.delete("/api/account", { data: { password } });
  await Promise.all([
    company.dispose(),
    respondent.dispose(),
    outsider.dispose(),
    anonymous.dispose(),
  ]);
});
