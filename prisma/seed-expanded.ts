import { demoPassword } from "./demo-password";
import { hash } from "bcryptjs";
import type { AuthUser } from "../src/lib/auth";
import { db } from "../src/lib/db";
import {
  createResearch,
  completeSurvey,
  researchInclude,
} from "../src/lib/research";
import { analytics } from "../src/lib/analytics";
import { categories, matches, parentalConsentStatus } from "../src/lib/domain";

const organizations = [
  {
    email: "nova@example.com",
    name: "Nova Play",
    industry: "Gaming",
    person: "Марк",
    category: "Gaming",
    titles: [
      "Игры после школы",
      "Подписка без сюрпризов",
      "Совместный вечер",
      "Игровой клуб: новый формат",
      "Сезон инди-игр",
    ],
    options: [
      "Играть вместе с друзьями",
      "Короткие игровые сессии",
      "Новые сюжеты",
      "Невысокая цена",
    ],
    answers: [
      "Хочу приглашать друзей, даже если у них нет подписки.",
      "Мне удобнее короткие задания на двадцать минут.",
      "Важна понятная цена без автоматических доплат.",
      "Люблю новые истории и спокойные игры.",
      "Нужно сохранять прогресс при смене устройства.",
    ],
  },
  {
    email: "mira@example.com",
    name: "Mira Care",
    industry: "Beauty & Care",
    person: "Лера",
    category: "Beauty",
    titles: [
      "Уход без сложностей",
      "Что рассказывает упаковка",
      "Компактный уход в поездке",
      "Новая линейка: концепт",
      "Осознанный выбор",
    ],
    options: [
      "Понятный состав",
      "Удобная упаковка",
      "Доступная цена",
      "Экологичные материалы",
    ],
    answers: [
      "Нужна простая инструкция без сложных терминов.",
      "Упаковку хочется использовать до последней капли.",
      "Небольшой формат удобно брать с собой.",
      "Выбираю средства без сильного запаха.",
      "Хочу видеть понятное объяснение состава.",
    ],
  },
  {
    email: "loop@example.com",
    name: "Loop Market",
    industry: "E-commerce",
    person: "Даниил",
    category: "E-commerce",
    titles: [
      "Первая самостоятельная покупка",
      "Доставка в моём ритме",
      "Почему я возвращаюсь",
      "Примерка нового сервиса",
      "Вторая жизнь вещей",
    ],
    options: [
      "Честные отзывы",
      "Быстрая доставка",
      "Понятный возврат",
      "Цена без скрытых доплат",
    ],
    answers: [
      "Важны отзывы с реальными фотографиями товара.",
      "Хочу заранее знать полную стоимость заказа.",
      "Пункт выдачи должен быть рядом с домом.",
      "Возможность вернуть вещь без сложной переписки помогает решиться.",
      "Мне нравится покупать вещи повторного использования.",
    ],
  },
  {
    email: "orbit@example.com",
    name: "Orbit Learning",
    industry: "Education",
    person: "София",
    category: "Technology",
    titles: [
      "Учиться в своём темпе",
      "Короткие уроки каждый день",
      "Курс, который хочется закончить",
      "Новая учебная привычка",
      "Навыки для жизни",
    ],
    options: [
      "Практические задания",
      "Короткие видео",
      "Обратная связь",
      "Свой темп обучения",
    ],
    answers: [
      "Мне нужны примеры из повседневной жизни.",
      "Удобно проходить один короткий урок в день.",
      "После ошибки хочу видеть объяснение, а не только оценку.",
      "Полезно возвращаться к сложной теме без ограничения времени.",
      "Совместные задания помогают сохранять интерес.",
    ],
  },
];
const regions = [
  "Москва",
  "Казань",
  "Санкт-Петербург",
  "Екатеринбург",
  "Новосибирск",
];
const names = [
  "Алекс",
  "Саша",
  "Женя",
  "Ника",
  "Дима",
  "Лина",
  "Миша",
  "Кира",
  "Влад",
  "Яна",
];
export async function seedExpanded() {
  const passwordHash = await hash(demoPassword(), 12);
  const profiles: AuthUser[] = [];
  for (let i = 0; i < 100; i++) {
    const age =
      i === 0
        ? 12
        : i === 99
          ? 99
          : i < 25
            ? 12 + (i % 6)
            : i < 75
              ? 18 + (i % 13)
              : 31 + (i % 35);
    const email =
      i === 0
        ? "teen12@example.com"
        : i === 99
          ? "senior99@example.com"
          : `demo.user${String(i).padStart(3, "0")}@example.com`;
    const user = await db.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `${names[i % names.length]} · demo ${i}`,
        passwordHash,
        role: "RESPONDENT",
        consentAt: new Date(),
        profile: {
          create: {
            age,
            gender: ["Женский", "Мужской", "Не указывать"][i % 3],
            region: regions[i % regions.length],
            interests: [
              ["Музыка", "Игры", "Дизайн", "Спорт", "Обучение"][i % 5],
              "Путешествия",
            ],
            categories:
              i === 0 || i === 99
                ? categories
                : [
                    categories[i % categories.length],
                    categories[(i + 3) % categories.length],
                    categories[(i + 6) % categories.length],
                  ],
            brands: [organizations[i % 4].name],
            parentalConsentStatus: parentalConsentStatus(age),
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
  for (let o = 0; o < organizations.length; o++) {
    const org = organizations[o];
    const owner = await db.user.upsert({
      where: { email: org.email },
      update: {},
      create: {
        email: org.email,
        name: org.person,
        passwordHash,
        role: "COMPANY",
        consentAt: new Date(),
        memberships: {
          create: {
            title: "Исследователь",
            organization: {
              create: {
                name: org.name,
                industry: org.industry,
                size: ["11–50", "51–200", "201+", "1–10"][o],
                website: `https://${["nova", "mira", "loop", "orbit"][o]}.example.com`,
              },
            },
          },
        },
      },
      include: { memberships: true },
    });
    const organizationId = owner.memberships[0]?.organizationId;
    if (!organizationId)
      throw new Error("Demo organization membership missing");
    for (let s = 0; s < 5; s++) {
      let r = await db.research.findFirst({
        where: { organizationId, title: org.titles[s] },
        include: researchInclude,
      });
      if (r) continue; // Additive seed: never overwrite existing studies or real responses.
      r = await createResearch(
        {
          title: org.titles[s],
          description: `${org.name}: расскажи о своём опыте и помоги выбрать, что улучшить в продукте. Вымышленное демонстрационное исследование.`,
          brand: org.name,
          category: org.category,
          objective: s === 3 ? "Concept testing" : "Product feedback",
          visibility: (
            ["OPEN", "PRIVATE", "SHARED", "PRIVATE", "OPEN"] as const
          )[s],
          reward: 60 + s * 20 + o * 10,
          minutes: 3 + (s % 3),
          target: {
            minAge: s === 0 ? 12 : s === 1 ? 18 : s === 2 ? 25 : 12,
            maxAge: s === 0 ? 17 : s === 1 ? 30 : 99,
            gender: "",
            region: s === 3 ? regions[o] : "",
            interests: [],
            categories: [],
          },
          questions: [
            {
              text: `Что важнее всего для тебя: «${org.titles[s]}»?`,
              type: "SINGLE",
              required: true,
              scale: 5,
              options: org.options,
            },
            {
              text: "Где ты ищешь информацию перед выбором?",
              type: "MULTIPLE",
              required: true,
              scale: 5,
              options: [
                "Советы знакомых",
                "Короткие видео",
                "Подробные обзоры",
                "Сайт продукта",
              ],
            },
            {
              text: "Насколько тебе удобно пользоваться похожими продуктами?",
              type: "RATING",
              required: true,
              scale: 10,
              options: [],
            },
            {
              text: "Что хочется улучшить? Расскажи на примере.",
              type: "TEXT",
              required: true,
              scale: 5,
              options: [],
            },
            {
              text: "Попробуешь новую версию, если учтут твоё мнение?",
              type: "YESNO",
              required: true,
              scale: 5,
              options: [],
            },
          ],
        },
        organizationId,
      );
      if (s === 3) continue;
      await db.research.update({
        where: { id: r.id },
        data: {
          status: "ACTIVE",
          publishedAt: new Date(Date.now() - 22 * 86400000),
          sharedReleased: s === 2 && o % 2 === 0,
        },
      });
      const eligible = profiles.filter(
        (u) => u.profile && matches(u.profile, r!.target),
      );
      const completed = eligible
        .filter(
          (u, i) =>
            i % 4 !== 3 && u.id !== profiles[0].id && u.id !== profiles[99].id,
        )
        .slice(0, 24);
      for (let i = 0; i < completed.length; i++) {
        const person = completed[i];
        const outcome = await completeSurvey(
          r.id,
          person,
          r.questions.map((q) => ({
            questionId: q.id,
            ...(q.type === "SINGLE"
              ? { optionIds: [q.options[(i + s + o) % q.options.length].id] }
              : q.type === "MULTIPLE"
                ? {
                    optionIds: [
                      q.options[i % 4].id,
                      ...(i % 2 ? [q.options[(i + 1) % 4].id] : []),
                    ],
                  }
                : q.type === "RATING"
                  ? { number: 3 + ((i * 3 + s + o) % 8) }
                  : q.type === "YESNO"
                    ? { number: i % 5 === 0 ? 0 : 1 }
                    : { text: org.answers[(i + s) % org.answers.length] }),
          })),
        );
        const completedAt = new Date(
          Date.now() - (21 - (i % 21)) * 86400000 + (i % 12) * 3600000,
        );
        const response = await db.response.update({
          where: { id: outcome.responseId },
          data: { completedAt },
        });
        await db.researchParticipant.update({
          where: { id: response.participantId },
          data: {
            startedAt: new Date(completedAt.getTime() - r.minutes * 60000),
          },
        });
        await db.rewardTransaction.update({
          where: { participantId: response.participantId },
          data: { createdAt: completedAt },
        });
      }
      for (const person of eligible
        .filter((u) => !completed.some((c) => c.id === u.id))
        .slice(0, 3)) {
        await db.researchParticipant.upsert({
          where: {
            researchId_respondentId: {
              researchId: r.id,
              respondentId: person.profile!.id,
            },
          },
          create: {
            researchId: r.id,
            respondentId: person.profile!.id,
            startedAt: new Date(Date.now() - 2 * 86400000),
          },
          update: {},
        });
      }
      const data = await analytics(r.id);
      await db.aIAnalysis.create({
        data: {
          researchId: r.id,
          fingerprint: "expanded-seed-editorial-v1",
          model: "demo-editorial-example",
          result: {
            executiveSummary: `Участники обсуждают практическую пользу и удобство: «${org.titles[s]}». Это редакционный обзор синтетических ответов.`,
            keyInsights: [
              "В открытых ответах встречаются конкретные ситуации использования.",
              "Часть участников ожидает более понятного объяснения возможностей.",
            ],
            themes: [org.options[0], org.options[1], "Прозрачность"],
            sentiment: {
              label: "Смешанный",
              explanation:
                "Редакционная оценка вымышленных текстов, не результат вызова AI.",
            },
            representativeQuotes: data.quotes.slice(0, 3),
            recommendedActions: [
              "Сравнить два варианта продукта в следующем исследовании.",
              "Проверить удобство на практическом задании.",
            ],
            limitations: [
              "Синтетическая демонстрационная выборка.",
              "Пример подготовлен seed-скриптом, а не AI.",
            ],
            sampleSize: data.count,
          },
        },
      });
      if (s === 2 && o === 0) {
        await db.flag.create({
          data: {
            userId: completed[0].id,
            researchId: r.id,
            reason: "Демо-жалоба: хотелось бы уточнить формулировку вопроса.",
            resolved: false,
          },
        });
      }
      if (s === 1 || s === 4) {
        await db.flag.create({
          data: {
            userId: completed[0].id,
            researchId: r.id,
            reason: "Демо-жалоба: описание вариантов показалось неоднозначным.",
            resolved: true,
          },
        });
      }
      await db.research.update({
        where: { id: r.id },
        data: {
          status: (
            ["ACTIVE", "COMPLETED", "PAUSED", "DRAFT", "ARCHIVED"] as const
          )[s],
        },
      });
    }
  }
  const [organizationsCount, respondents, research, responses, rewards] =
    await Promise.all([
      db.organization.count(),
      db.respondentProfile.count(),
      db.research.count(),
      db.response.count(),
      db.rewardTransaction.count(),
    ]);
  console.log(
    JSON.stringify({
      organizations: organizationsCount,
      respondents,
      research,
      responses,
      rewardTransactions: rewards,
    }),
  );
}
