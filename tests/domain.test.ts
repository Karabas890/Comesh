import test from "node:test";
import assert from "node:assert/strict";
import {
  matches,
  canReadAggregate,
  canManage,
  rewardAmount,
  distribution,
  average,
  researchSchema,
  redact,
} from "../src/lib/domain";
const profile = {
  age: 20,
  gender: "Женский",
  region: "Москва",
  interests: ["Музыка"],
  categories: ["Gaming"],
};
const target = {
  minAge: 18,
  maxAge: 25,
  gender: "",
  region: "",
  interests: [],
  categories: [],
};
test("matching: age boundaries, gender, region, overlapping interests and categories", () => {
  assert.ok(matches(profile, target));
  assert.ok(
    matches(profile, {
      ...target,
      minAge: 20,
      maxAge: 20,
      region: "москва",
      interests: ["Музыка"],
    }),
  );
  assert.equal(matches(profile, { ...target, minAge: 21 }), false);
  assert.equal(matches(profile, { ...target, gender: "Мужской" }), false);
  assert.equal(matches(profile, { ...target, categories: ["Beauty"] }), false);
  assert.equal(matches(profile, { ...target, interests: ["Спорт"] }), false);
});
test("visibility: private isolation, explicit shared release, draft exclusion", () => {
  const r = {
    organizationId: "a",
    visibility: "PRIVATE",
    sharedReleased: false,
    status: "ACTIVE",
  };
  assert.ok(canReadAggregate(r, "a"));
  assert.equal(canReadAggregate(r, "b"), false);
  assert.equal(canReadAggregate({ ...r, visibility: "SHARED" }, "b"), false);
  assert.ok(
    canReadAggregate({ ...r, visibility: "SHARED", sharedReleased: true }, "b"),
  );
  assert.ok(canReadAggregate({ ...r, visibility: "OPEN" }, "b"));
  assert.equal(
    canReadAggregate({ ...r, visibility: "OPEN", status: "DRAFT" }, "b"),
    false,
  );
});
test("organization management ignores public visibility", () => {
  assert.ok(canManage({ organizationId: "a" }, "a"));
  assert.equal(canManage({ organizationId: "a" }, "b"), false);
  assert.equal(canManage({ organizationId: "a" }, undefined), false);
});
test("reward is once per completion", () => {
  assert.equal(rewardAmount(120, false), 120);
  assert.equal(rewardAmount(120, true), 0);
});
test("analytics: empty and weighted inputs", () => {
  assert.equal(average([]), null);
  assert.equal(average([1, 2, 5]), 2.67);
  assert.deepEqual(distribution(["A", "B", "A"]), [
    { name: "A", count: 2 },
    { name: "B", count: 1 },
  ]);
});
test("validation rejects malformed choices and invalid age interval", () => {
  assert.equal(
    researchSchema.shape.questions.safeParse([
      { text: "Выбор?", type: "SINGLE", required: true, options: ["A", "A"] },
    ]).success,
    false,
  );
  assert.equal(
    researchSchema.shape.target.safeParse({ ...target, minAge: 30, maxAge: 18 })
      .success,
    false,
  );
});
test("obvious PII is redacted", () => {
  assert.equal(redact("Почта sample@example.com"), "Почта [email скрыт]");
  assert.ok(!redact("Телефон +7 (999) 123-45-67").includes("999"));
});

test("AI without a configured key fails gracefully before any network request", async () => {
  const { createAIClient } = await import("../src/lib/ai");
  const previous = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    assert.throws(() => createAIClient(), /AI пока недоступен/);
  } finally {
    if (previous) process.env.OPENAI_API_KEY = previous;
  }
});

test("age range includes 12 and 99; rejects outside range and fractions", async () => {
  const { respondentAgeSchema, parentalConsentStatus } =
    await import("../src/lib/domain");
  for (const age of [12, 17, 18, 99])
    assert.equal(respondentAgeSchema.safeParse(age).success, true);
  for (const age of [11, 100, 12.5, -1, NaN])
    assert.equal(respondentAgeSchema.safeParse(age).success, false);
  assert.equal(parentalConsentStatus(12), "UNVERIFIED");
  assert.equal(parentalConsentStatus(99), "NOT_REQUIRED");
  assert.equal(
    researchSchema.shape.target.safeParse({ ...target, minAge: 12, maxAge: 99 })
      .success,
    true,
  );
});

test("production demo seed requires a private password", async () => {
  const { demoPassword } = await import("../prisma/demo-password");
  const env = process.env as Record<string, string | undefined>;
  const previousMode = env.NODE_ENV;
  const previousPassword = process.env.DEMO_PASSWORD;
  try {
    env.NODE_ENV = "production";
    delete process.env.DEMO_PASSWORD;
    assert.throws(() => demoPassword(), /DEMO_PASSWORD/);
    process.env.DEMO_PASSWORD = "short";
    assert.throws(() => demoPassword(), /DEMO_PASSWORD/);
    process.env.DEMO_PASSWORD = "Test-private-password-2026";
    assert.equal(demoPassword(), "Test-private-password-2026");
  } finally {
    if (previousMode === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = previousMode;
    if (previousPassword === undefined) delete process.env.DEMO_PASSWORD;
    else process.env.DEMO_PASSWORD = previousPassword;
  }
});

test("AI quote schemas reject fabricated IDs and require empty quotes without source text", async () => {
  const { aiOutputSchemas } = await import("../src/lib/ai");
  const { zodTextFormat } = await import("openai/helpers/zod");
  const schemas = aiOutputSchemas(["answer-1", "answer-2"]);
  const analysisQuotes = schemas.analysis.shape.representativeQuotes;
  const assistantQuotes = schemas.assistant.shape.quoteAnswerIds;
  assert.equal(
    analysisQuotes.safeParse([{ answerId: "answer-1" }]).success,
    true,
  );
  assert.equal(
    analysisQuotes.safeParse([{ answerId: "invented" }]).success,
    false,
  );
  assert.equal(assistantQuotes.safeParse(["answer-2"]).success, true);
  assert.equal(assistantQuotes.safeParse(["invented"]).success, false);
  const empty = aiOutputSchemas([]);
  assert.equal(
    empty.analysis.shape.representativeQuotes.safeParse([]).success,
    true,
  );
  assert.equal(
    empty.analysis.shape.representativeQuotes.safeParse([
      { answerId: "answer-1" },
    ]).success,
    false,
  );
  assert.equal(
    empty.assistant.shape.quoteAnswerIds.safeParse([]).success,
    true,
  );
  assert.equal(
    empty.assistant.shape.quoteAnswerIds.safeParse(["answer-1"]).success,
    false,
  );
  const format = zodTextFormat(schemas.analysis, "analysis");
  assert.ok(
    JSON.stringify(format.schema).includes('"enum":["answer-1","answer-2"]'),
  );
  assert.ok(
    JSON.stringify(zodTextFormat(empty.analysis, "analysis").schema).includes(
      '"maxItems":0',
    ),
  );
});
