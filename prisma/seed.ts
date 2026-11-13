import { demoPassword } from "./demo-password";
import { seedExpanded } from "./seed-expanded";
import "dotenv/config";
import { hash } from "bcryptjs";
import { db } from "../src/lib/db";
import { createResearch, completeSurvey } from "../src/lib/research";
import { analytics } from "../src/lib/analytics";
import { categories } from "../src/lib/domain";
async function seedBase() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_DEMO_SEED !== "true"
  )
    throw new Error(
      "Demo seed disabled in production. Set ALLOW_DEMO_SEED=true deliberately.",
    );
  if (await db.user.findUnique({ where: { email: "company@example.com" } })) {
    console.log(
      "Base demo already exists; continuing with additional fixtures.",
    );
    return;
  }
  const passwordHash = await hash(demoPassword(), 12);
  const company = await db.user.create({
    data: {
      name: "Александра",
      email: "company@example.com",
      passwordHash,
      role: "COMPANY",
      consentAt: new Date(),
      memberships: {
        create: {
          title: "Brand strategist",
          organization: {
            create: {
              name: "Forma Studio",
              industry: "Design & Research",
              size: "11–50",
            },
          },
        },
      },
    },
    include: { memberships: true },
  });
  await db.user.create({
    data: {
      name: "Модератор",
      email: "admin@example.com",
      passwordHash,
      role: "ADMIN",
      consentAt: new Date(),
    },
  });
  const profiles = [];
  for (let i = 0; i < 25; i++) {
    const user = await db.user.create({
      data: {
        name: i === 0 ? "Саша" : `Участник ${i}`,
        email: i === 0 ? "teen@example.com" : `participant${i}@example.com`,
        passwordHash,
        role: "RESPONDENT",
        consentAt: new Date(),
        profile: {
          create: {
            age: 18 + (i % 8),
            gender:
              i % 3 === 0
                ? "Не указывать"
                : i % 2 === 0
                  ? "Женский"
                  : "Мужской",
            region: ["Москва", "Казань", "Санкт-Петербург"][i % 3],
            interests: ["Дизайн", "Музыка", i % 2 ? "Спорт" : "Игры"],
            categories,
            brands: ["Forma", "Nova"],
          },
        },
      },
      include: {
        profile: true,
        memberships: { include: { organization: true } },
      },
    });
    profiles.push(user);
  }
  const topics = [
    {
      title: "Sneaker Culture 2026",
      brand: "Forma",
      category: "Fashion",
      description:
        "Что делает кроссовки любимой парой — внешний вид, комфорт или история бренда?",
      options: [
        "Комфорт на каждый день",
        "Оригинальный дизайн",
        "Доступная цена",
        "Экологичные материалы",
      ],
      text: "Что может убедить тебя попробовать новый бренд кроссовок?",
      visibility: "PRIVATE" as const,
    },
    {
      title: "Energy, your way",
      brand: "Pulse",
      category: "Food",
      description:
        "Разбираемся, чего молодая аудитория ждёт от энергетических напитков.",
      options: [
        "Вкус без лишней сладости",
        "Натуральный состав",
        "Цена",
        "Дизайн банки",
      ],
      text: "Что тебе хотелось бы изменить в энергетических напитках?",
      visibility: "OPEN" as const,
    },
    {
      title: "Play beyond the subscription",
      brand: "Nova Play",
      category: "Gaming",
      description:
        "Подписки, любимые игры и то, за что действительно хочется платить.",
      options: [
        "Большая библиотека",
        "Новые релизы",
        "Низкая цена",
        "Игра с друзьями",
      ],
      text: "Что сделало бы игровую подписку полезнее для тебя?",
      visibility: "SHARED" as const,
    },
    {
      title: "Beauty without the noise",
      brand: "Softform",
      category: "Beauty",
      description: "Тестируем идеи упаковки, которую замечают и выбирают.",
      options: [
        "Минимализм",
        "Яркие цвета",
        "Переработанный материал",
        "Компактный формат",
      ],
      text: "Как должна выглядеть упаковка твоего любимого средства?",
      visibility: "PRIVATE" as const,
    },
    {
      title: "One more episode",
      brand: "Frame",
      category: "Entertainment",
      description: "Как мы выбираем стриминг и что заставляет остаться.",
      options: [
        "Хорошие сериалы",
        "Цена подписки",
        "Нет рекламы",
        "Совместный просмотр",
      ],
      text: "Чего тебе не хватает в стриминговых сервисах?",
      visibility: "OPEN" as const,
    },
  ];
  const textAnswers = [
    [
      "Нужен комфорт, чтобы можно было весь день ходить по городу.",
      "Мне интересен спокойный дизайн без огромного логотипа.",
      "Попробую, если можно вернуть пару после примерки.",
      "Хочется увидеть, как обувь выглядит на обычных людях.",
      "Важно, чтобы подошва не изнашивалась за один сезон.",
    ],
    [
      "Хотелось бы меньше сахара и более понятный состав.",
      "Я выбираю не слишком сладкий вкус.",
      "Удобная маленькая банка лучше большой порции.",
      "Хочу видеть содержание кофеина на лицевой стороне.",
      "Цена важна, но вкус всё равно на первом месте.",
    ],
    [
      "Нужны игры, в которые можно играть вместе с друзьями.",
      "Хотелось бы ставить подписку на паузу во время учёбы.",
      "Понятная цена без неожиданных списаний важнее количества игр.",
      "Мне нравятся инди-игры, добавляйте их чаще.",
      "Хорошая подборка по моим интересам сэкономит время.",
    ],
  ];
  for (let t = 0; t < topics.length; t++) {
    const topic = topics[t];
    const r = await createResearch(
      {
        title: topic.title,
        brand: topic.brand,
        category: topic.category,
        description: topic.description,
        objective: "Product feedback",
        visibility: topic.visibility,
        reward: [120, 80, 150, 100, 90][t],
        minutes: 4,
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
            text: "Что для тебя важнее всего при выборе?",
            type: "SINGLE",
            required: true,
            scale: 5,
            options: topic.options,
          },
          {
            text: "Где ты обычно узнаёшь о новых продуктах?",
            type: "MULTIPLE",
            required: true,
            scale: 5,
            options: ["Друзья", "Социальные сети", "Обзоры", "Магазин"],
          },
          {
            text: "Насколько тебе интересна эта категория?",
            type: "RATING",
            required: true,
            scale: 5,
            options: [],
          },
          {
            text: topic.text,
            type: "TEXT",
            required: true,
            scale: 5,
            options: [],
          },
          {
            text: "Хочешь попробовать что-то новое в этой категории?",
            type: "YESNO",
            required: true,
            scale: 5,
            options: [],
          },
        ],
      },
      company.memberships[0].organizationId,
    );
    if (t === 3) continue;
    await db.research.update({
      where: { id: r.id },
      data: {
        status: "ACTIVE",
        publishedAt: new Date(),
        sharedReleased: t === 2,
      },
    });
    if (t < 3) {
      for (let i = 1; i < profiles.length; i++) {
        const result = await completeSurvey(
          r.id,
          profiles[i],
          r.questions.map((q) => ({
            questionId: q.id,
            ...(q.type === "SINGLE"
              ? {
                  optionIds: [
                    q.options[i % 5 === 0 ? 2 : i % 3 === 0 ? 1 : 0].id,
                  ],
                }
              : q.type === "MULTIPLE"
                ? {
                    optionIds: [q.options[i % 4].id, q.options[(i + 1) % 4].id],
                  }
                : q.type === "RATING"
                  ? { number: 3 + (i % 3) }
                  : q.type === "YESNO"
                    ? { number: i % 4 ? 1 : 0 }
                    : { text: textAnswers[t][i % 5] }),
          })),
        );
        await db.response.update({
          where: { id: result.responseId },
          data: { completedAt: new Date(Date.now() - (24 - i) * 3600000 * 8) },
        });
      }
      const data = await analytics(r.id);
      await db.aIAnalysis.create({
        data: {
          researchId: r.id,
          fingerprint: "seed-example",
          model: "demo-editorial-example",
          result: {
            executiveSummary: [
              "Комфорт и повседневная практичность — заметные мотивы в этой демонстрационной выборке.",
              "Участники обращают внимание на сладость, состав и удобный формат напитка.",
              "Гибкость подписки и понятная ценность помогают снизить барьер к покупке.",
            ][t],
            keyInsights: [
              "Участники описывают конкретные повседневные ситуации использования.",
              "В текстах есть запрос на прозрачность и предсказуемое качество.",
            ],
            themes: [
              ["Комфорт", "Сдержанный дизайн", "Долговечность"],
              ["Меньше сахара", "Понятный состав", "Удобный объём"],
              ["Игра с друзьями", "Гибкая подписка", "Понятная цена"],
            ][t],
            sentiment: {
              label: "Смешанный",
              explanation:
                "Качественная редакционная оценка демонстрационных ответов.",
            },
            representativeQuotes: data.quotes.slice(0, 3),
            recommendedActions: [
              "Проверить основные темы в следующем концепт-тесте.",
              "Сравнить несколько вариантов предложения на более широкой выборке.",
            ],
            limitations: [
              "Синтетические демоданные. Это редакционный пример, а не результат вызова AI.",
              "Выборка не репрезентативна для всей аудитории.",
            ],
            sampleSize: data.count,
          },
        },
      });
    }
    if (t === 1)
      await db.research.update({
        where: { id: r.id },
        data: { status: "COMPLETED" },
      });
  }
  console.log(
    "Seed ready: 5 studies, 72 responses, 72 reward transactions, 3 labeled editorial insight examples.",
  );
}
seedBase()
  .then(seedExpanded)
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Seed failed");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
