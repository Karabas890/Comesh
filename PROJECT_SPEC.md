# Задача: разработать полноценный MVP платформы исследований молодёжной аудитории

Необходимо спроектировать и реализовать с нуля полноценный working MVP веб-платформы для проведения маркетинговых исследований среди молодёжной аудитории.

Концептуально продукт вдохновлён Cafeteria, но не должен быть его визуальной или программной копией.

Продукт состоит из двух связанных сервисов:

1. **Business Platform** — сервис для компаний, маркетинговых агентств, маркетологов, бренд-менеджеров и аналитиков.
2. **Youth App** — consumer-приложение для молодых респондентов, которые проходят исследования, отвечают на вопросы и получают за участие внутренние баллы.

Основная продуктовая идея:

> Бренды и маркетинговые агентства создают исследования → задают целевую аудиторию → молодые пользователи проходят подходящие им исследования → система агрегирует ответы → AI анализирует результаты → компания получает короткие понятные инсайты, тренды, статистику и подтверждающие цитаты.

Главная ценность продукта:

> Помочь брендам и маркетинговым агентствам быстро получать продуктовые и маркетинговые инсайты от молодёжной аудитории без длительных и дорогих традиционных исследований.

---

# 1. Общие требования

Это должен быть не статический frontend prototype, а **реально работающий full-stack MVP**.

Все основные сценарии должны работать end-to-end:

Company registration → создание исследования → публикация → появление исследования у подходящих респондентов → прохождение исследования → сохранение ответов → начисление баллов → появление результатов у компании → AI-анализ → dashboard → AI Assistant.

Не оставляй основные функции в виде TODO, fake buttons или неработающих элементов интерфейса.

Если какое-либо требование неоднозначно — принимай разумное продуктовое/техническое решение самостоятельно.

Приоритет:

1. работающий end-to-end flow;
2. хороший UX;
3. чистая архитектура;
4. безопасность;
5. maintainability;
6. производительность;
7. только затем дополнительные возможности.

---

# 2. Reference product

В качестве продуктового референса изучи:

Cafeteria App:
https://apps.apple.com/us/app/cafeteria/id6476632653?l=ru

Cafeteria:
https://www.teamcafeteria.com

TechCrunch:
https://techcrunch.com/2024/10/24/cafeteria-raises-3m-to-connect-brands-with-their-most-opinionated-customers-teens/

Исходное описание проекта:
https://docs.google.com/document/d/1Y3AGW0FfrKOKDa8YIbIuwdwr33LMqn6HJp4nlQnSjn0/edit?tab=t.0

Не копируй branding, название, тексты, изображения или UI Cafeteria.

Используй сервис только как reference для понимания UX и business model.

---

# 3. MVP scope

Не нужно реализовывать избыточную enterprise-инфраструктуру из первоначального технического описания.

В частности, для MVP НЕ нужны:

- Kubernetes;
- отдельные микросервисы ради микросервисов;
- Elasticsearch, если PostgreSQL достаточно;
- Kafka/RabbitMQ без реальной необходимости;
- отдельный ML pipeline;
- собственные ML-модели;
- сложная cloud-инфраструктура.

Предпочтительнее modular monolith, который впоследствии можно масштабировать.

---

# 4. Предлагаемый стек

Ты можешь изменить стек, если видишь технически более удачное решение, но объясни изменение в README.

Предпочтительный вариант:

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui или аналогичный качественный component system
- Recharts для аналитики
- React Hook Form
- Zod

## Backend

Допустимы:

- Next.js server/API layer

или

- отдельный backend на FastAPI.

Выбери вариант, который позволит быстрее получить надёжный MVP без ненужной сложности.

## Database

PostgreSQL.

ORM:

- Prisma для TypeScript stack;

или

- SQLAlchemy для FastAPI.

## AI

OpenAI API.

В `.env` уже находится:

OPENAI_API_KEY

ВАЖНО:

- никогда не передавать API key на frontend;
- API вызывается исключительно server-side;
- `.env`, `.env.local` и другие файлы с секретами обязательно добавить в `.gitignore`;
- создать `.env.example` БЕЗ реального ключа;
- секрет не должен попасть в git history, logs или browser bundle.

Используй **самую лёгкую и дешёвую актуальную OpenAI-модель, которая адекватно выполняет задачу**.

Не hardcode модель по всему проекту.

Используй переменную:

OPENAI_MODEL=

и central AI configuration.

Минимизируй token usage.

Не отправляй модели всю БД или весь массив ответов без необходимости.

---

# 5. Пользовательские роли

Минимум должны существовать следующие роли:

### Respondent

Молодой пользователь, проходящий исследования.

### Company User

Представитель компании.

На MVP достаточно одной company-role.

Архитектуру желательно сделать расширяемой под:

- Company Admin
- Researcher
- Analyst
- Viewer

### Platform Admin

Минимальная административная роль для управления платформой.

---

# 6. Authentication

Реализовать регистрацию и login.

При регистрации пользователь выбирает:

- «Я хочу проходить исследования»
- «Я представляю компанию»

После этого запускается соответствующий onboarding.

Использовать безопасную систему authentication.

Пароли никогда не хранить plaintext.

Должны быть:

- password hashing;
- secure sessions/tokens;
- authorization middleware;
- role-based access control;
- protected API routes;
- server-side authorization.

Пользователь компании не должен иметь возможности получить чужое private research простым изменением URL/API request.

---

# 7. Youth App

Consumer-интерфейс должен существенно отличаться от B2B dashboard.

Он должен выглядеть как современное mobile-first приложение.

Не делай его похожим на корпоративную админку.

Основная аудитория — молодые пользователи, поэтому интерфейс должен быть:

- визуальным;
- лёгким;
- быстрым;
- mobile-first;
- с крупными touch targets;
- с короткими текстами;
- с хорошей типографикой;
- без ощущения «Google Forms».

При этом избегай чрезмерно детского дизайна.

---

# 8. Respondent onboarding

После регистрации пользователь заполняет профиль.

Минимальные параметры:

- display name / nickname;
- возраст или дата рождения;
- пол — optional/prefer not to say;
- регион;
- интересы;
- любимые категории;
- интересующие бренды.

Категории, например:

- Fashion
- Beauty
- Gaming
- Entertainment
- Food
- Technology
- E-commerce
- Media
- Sport
- Music

Информация должна использоваться для matching исследований.

Не передавать компаниям напрямую имя/email/идентифицирующие данные респондента.

Company dashboard должен работать с анонимизированными respondent IDs и агрегированной демографией.

---

# 9. Youth home/feed

После onboarding пользователь попадает на главную.

Показать:

- баланс баллов;
- доступные исследования;
- потенциальную награду;
- приблизительное время прохождения;
- категорию/бренд;
- progress/streak — если уместно;
- недавно завершённые исследования.

Пример карточки:

Nike

Sneaker Trends 2026

5 min

+120 points

[Начать]

Добавь состояния:

- available;
- started;
- completed;
- unavailable;
- closed.

---

# 10. Matching

Исследование может иметь target filters:

- min age;
- max age;
- gender;
- region;
- interests;
- categories.

Respondent должен видеть только исследования, которым он соответствует.

Необходимо реализовать matching на backend.

Не полагайся только на frontend filtering.

---

# 11. Survey / Research experience

Прохождение исследования — одна из главных частей продукта.

Не используй обычную длинную HTML-форму.

Сделай conversational/chat-like flow.

Один вопрос преимущественно показывается за раз.

Пользователь отвечает → следующий вопрос появляется с небольшой естественной transition-анимацией.

Поддержать минимум:

### Single choice

### Multiple choice

### Rating

Например 1–5 или 1–10.

### Free text

### Yes / No

Архитектуру сделать расширяемой под voice answers.

Если полноценное Speech-to-Text существенно увеличивает scope MVP, можно реализовать UI/API abstraction для voice и явно документировать ограничение.

Однако text answers должны полностью работать.

Показывать:

- progress;
- номер вопроса;
- возможность вернуться назад там, где это безопасно;
- reward;
- estimated completion time.

После завершения:

> Спасибо! Ответы сохранены.

> +120 баллов

Баллы должны реально начисляться в БД.

Повторно получить reward за одно исследование нельзя.

---

# 12. Rewards

Реализовать внутреннюю point economy.

Не интегрировать реальные банковские выплаты в MVP.

Нужны:

- текущий баланс;
- история операций;
- начисление за survey completion;
- transaction ledger.

Например:

+120 — Sneaker Trends

+80 — Gaming Habits

Архитектура должна позволять позже добавить:

- gift cards;
- промокоды;
- реальные выплаты;
- partner rewards.

Баланс нельзя хранить только как число, которое произвольно меняется.

Создай transaction history, чтобы операции можно было аудировать.

---

# 13. Company onboarding

После регистрации компании запросить:

- имя пользователя;
- название компании;
- industry;
- company size;
- role;
- website — optional.

После onboarding пользователь попадает в Company Dashboard.

---

# 14. Company Dashboard

B2B часть должна выглядеть как современный SaaS analytics product.

Sidebar:

- Overview
- Research
- Create Research
- Insights
- AI Assistant
- Library / Open Insights
- Settings

Top bar:

- organization;
- user;
- notifications;
- quick create.

Overview показывает:

- Active Research
- Total Responses
- Completed Research
- Average completion rate

Ниже:

- последние исследования;
- response activity;
- recent insights.

---

# 15. Создание исследования

Это один из главных flows.

Сделать wizard.

### Step 1 — Basics

- Research title
- Description
- Brand/Product
- Research objective

Objective examples:

- Concept testing
- Brand perception
- Campaign testing
- Product feedback
- Trend discovery
- Competitor analysis

### Step 2 — Audience

Target filters:

- age range;
- gender;
- region;
- interests;
- categories.

Показывать estimated audience, если данных достаточно.

### Step 3 — Questions

Конструктор вопросов.

Можно:

- добавить вопрос;
- удалить;
- изменить порядок;
- выбрать question type;
- указать required;
- добавить options.

Минимальные типы:

- single choice;
- multiple choice;
- free text;
- rating;
- yes/no.

### Step 4 — Visibility

Три варианта исследования:

#### Private

Результаты доступны только заказчику.

#### Shared

Исследование заказано одной компанией, но агрегированные результаты впоследствии могут стать доступны другим компаниям.

#### Open

Результаты входят в общую библиотеку открытой статистики.

Эта модель должна быть заложена в data model.

### Step 5 — Reward

Количество баллов за прохождение.

### Step 6 — Review

Preview исследования.

### Step 7 — Publish

После публикации оно появляется у подходящих respondents.

Statuses:

- Draft
- Active
- Paused
- Completed
- Archived

---

# 16. Research details

Company должна видеть:

- title;
- status;
- number of responses;
- target audience;
- completion rate;
- created date;
- questions;
- results;
- AI insights.

Tabs:

Overview | Insights | Questions | Responses | Demographics

---

# 17. Analytics

Analytics — ключевая часть продукта.

После появления ответов dashboard должен автоматически строить статистику.

Показывать:

### Response count

### Completion rate

### Demographics

- age;
- gender;
- region.

### Choice distributions

Для single/multiple choice.

### Rating

- average;
- distribution.

### Free text

- raw answers;
- representative quotes;
- AI themes.

Использовать нормальные визуализации:

- bar charts;
- donut/pie только там, где они действительно уместны;
- line charts для time-based data;
- cards;
- tables.

Не перегружать dashboard графиками.

---

# 18. Filters

Company должна иметь возможность фильтровать analytics:

- age;
- gender;
- region;
- interest;
- question.

Фильтры должны реально менять статистику.

---

# 19. AI analysis

AI — одна из основных частей продукта.

После появления достаточного количества ответов AI должен анализировать результаты.

Минимальный structured output:

{
  "executiveSummary": "...",
  "keyInsights": [],
  "themes": [],
  "sentiment": {},
  "representativeQuotes": [],
  "recommendedActions": [],
  "limitations": []
}

AI должен отвечать прежде всего на:

- Что наиболее важно в этих ответах?
- Какие темы повторяются?
- Что нравится аудитории?
- Что не нравится?
- Какие неожиданные результаты появились?
- Отличаются ли ответы разных сегментов?
- Какие цитаты подтверждают вывод?
- Что маркетологу стоит сделать дальше?

Очень важно:

**AI не должен придумывать статистику или цитаты.**

Статистические значения вычислять кодом/SQL.

LLM используется для интерпретации уже вычисленных данных и реальных текстовых ответов.

Каждая representative quote должна существовать в dataset.

По возможности хранить reference на source answer.

---

# 20. AI cost optimization

Так как используется реальный OPENAI_API_KEY, расход должен быть минимальным.

Реализовать:

- server-side requests;
- configurable model;
- ограниченный context;
- JSON structured output;
- caching результатов;
- regenerate только вручную или при существенном изменении dataset;
- aggregation перед отправкой модели;
- token limits;
- timeout;
- retry;
- graceful error handling.

Не вызывать AI при каждом открытии страницы.

Например:

research получает новые ответы → analysis становится stale → пользователь нажимает Generate/Refresh insights → backend вызывает AI → результат сохраняется → последующие просмотры используют сохранённый результат.

---

# 21. AI Assistant

Для каждого исследования должен существовать conversational AI Assistant.

Company может спросить:

- «Что больше всего не понравилось пользователям?»
- «Сравни ответы 14–16 и 17–19 лет»
- «Какие три основные темы повторяются?»
- «Какие цитаты подтверждают первый инсайт?»
- «Что нам изменить в рекламной кампании?»
- «Что девушки говорят об упаковке?»

Assistant должен использовать **только доступные пользователю данные**.

Private research другой компании никогда не должен попадать в context.

Assistant должен:

1. определить необходимый research;
2. получить агрегированные данные;
3. получить релевантные реальные ответы;
4. сформировать ответ;
5. по возможности показать supporting quotes.

Не делай vector database на MVP, если обычный PostgreSQL search/filtering достаточен.

---

# 22. Open Insights Library

Реализовать страницу общей статистики.

Здесь находятся исследования типа Open и разрешённые Shared datasets.

Карточка:

- название;
- category;
- audience;
- response count;
- short insight;
- date.

Company может открыть report и посмотреть агрегированную информацию.

Никогда не показывать private studies.

---

# 23. Research visibility model

Создай enum:

PRIVATE
SHARED
OPEN

Проверять visibility на backend для каждого запроса.

Это security requirement, а не только UI option.

---

# 24. Database model

Спроектируй нормализованную схему.

Минимально понадобятся сущности примерно следующего уровня:

User

RespondentProfile

Organization

OrganizationMember

Research

ResearchTarget

Question

QuestionOption

ResearchParticipant

Response

Answer

RewardTransaction

AIAnalysis

AIConversation

AIMessage

При необходимости добавь свои таблицы.

Не хранить сложные отношения в одном JSON blob, если они нормально моделируются relational structure.

JSON можно использовать для:

- AI structured output;
- metadata;
- flexible configuration.

---

# 25. Seed data

Проект после запуска не должен выглядеть пустым.

Добавь seed script.

Создать минимум:

- 1 demo company;
- 1 company user;
- несколько respondents;
- 4–6 исследований;
- минимум одно Active;
- одно Completed;
- одно Draft;
- Private/Shared/Open examples;
- 50+ realistic survey responses;
- reward transactions;
- AI insight examples.

Seed content должен быть реалистичным.

Например исследования:

### Sneaker Trends 2026

«Что влияет на выбор кроссовок среди 14–19 лет?»

### Energy Drinks & Gen Z

### Gaming Subscription Habits

### Beauty Packaging Test

### Streaming Platforms

Используй realistic fake data, но не реальные персональные данные.

---

# 26. Demo accounts

Сделай возможность легко проверить обе стороны системы.

Например:

Company:
company@example.com

Respondent:
teen@example.com

Admin:
admin@example.com

Пароли для demo указать в README или сделать dev-only quick login.

Не использовать эти credentials как production defaults.

---

# 27. Admin

Сделать минимальный Admin dashboard.

Admin может видеть:

- users;
- companies;
- research;
- reports/flags;
- basic platform metrics.

Не трать слишком много времени на admin UI.

Главный приоритет — Company + Respondent.

---

# 28. Privacy

Так как приложение ориентировано в том числе на несовершеннолетних, privacy-by-design является обязательным.

Для MVP:

- минимизировать собираемые персональные данные;
- не показывать компаниям email/name респондента;
- использовать anonymized respondent identifiers;
- разделять authentication data и research analytics;
- ограничивать доступ по ролям;
- не отправлять unnecessary PII в OpenAI API;
- предусмотреть удаление аккаунта и связанных персональных данных;
- добавить consent/privacy screen;
- подготовить архитектуру для age restrictions/parental consent.

Не заявляй в UI или README, что приложение автоматически соответствует конкретному законодательству только потому, что реализованы базовые security measures.

В README отдельно описать, что перед production launch требуется юридическая проверка требований к обработке данных несовершеннолетних и персональных данных.

---

# 29. Security

Обязательно:

- `.env` в `.gitignore`;
- `.env.example`;
- password hashing;
- server-side auth;
- RBAC;
- authorization для organization resources;
- input validation;
- Zod/Pydantic validation;
- ORM/parameterized queries;
- XSS protection;
- secure cookies;
- sensible CORS;
- rate limiting на auth;
- rate limiting AI endpoints;
- request size limits;
- error handling без утечки stack traces/secrets;
- security headers.

Никогда не логировать:

- passwords;
- auth tokens;
- OPENAI_API_KEY;
- полные sensitive user payloads.

---

# 30. Design system

Создай оригинальную визуальную систему продукта.

Не копируй Cafeteria pixel-by-pixel.

## Company interface

Стиль:

- modern B2B SaaS;
- clean;
- data-oriented;
- professional;
- generous spacing;
- readable typography.

Референс по качеству:

Linear / Notion / Stripe Dashboard / modern analytics SaaS.

Не копировать их напрямую.

## Respondent interface

Стиль:

- mobile-first;
- expressive;
- modern;
- slightly playful;
- conversational;
- карточки;
- плавные transitions;
- заметные rewards;
- минимальное количество текста.

Используй единый design system:

- spacing;
- typography;
- border radius;
- shadows;
- semantic colors;
- states;
- buttons;
- inputs;
- cards.

Dark mode — optional.

---

# 31. UX requirements

Каждая async operation должна иметь:

- loading state;
- success state;
- error state.

Использовать:

- skeletons;
- empty states;
- confirmations;
- toast notifications;
- disabled states.

Нельзя оставлять пользователю blank screen.

Обязательно responsive design.

Company dashboard должен хорошо работать минимум от tablet до desktop.

Respondent UI — от ~360 px.

---

# 32. Accessibility

Использовать:

- semantic HTML;
- labels;
- keyboard navigation;
- visible focus states;
- достаточный contrast;
- ARIA только где необходимо.

Не делать кликабельные div вместо buttons.

---

# 33. Error handling

Обработать:

- network error;
- unauthorized;
- forbidden;
- invalid survey;
- closed survey;
- already completed survey;
- AI unavailable;
- OpenAI rate limit;
- malformed AI output;
- empty research;
- insufficient data.

Если OpenAI временно недоступен, обычная analytics часть приложения должна продолжать работать.

---

# 34. Tests

Добавить тесты на критические сценарии.

Минимум:

### Unit/integration

- survey matching;
- reward calculation;
- visibility rules;
- company authorization;
- analytics calculations.

### E2E

Критический сценарий:

1. Company login.
2. Create research.
3. Add questions.
4. Publish.
5. Respondent login.
6. Find research.
7. Complete research.
8. Receive points.
9. Company opens research.
10. Response appears.
11. Analytics updates.

Если возможно — Playwright.

---

# 35. Docker

Проект должен запускаться локально максимально просто.

Добавить Dockerfile/docker-compose при необходимости.

Желаемый flow:

cp .env.example .env

docker compose up

или:

npm install
npm run db:migrate
npm run db:seed
npm run dev

PostgreSQL можно запускать через Docker Compose.

---

# 36. README

README должен быть подробным.

Включить:

- что это за продукт;
- architecture;
- stack;
- folder structure;
- prerequisites;
- installation;
- environment variables;
- database migration;
- seed;
- запуск;
- tests;
- demo accounts;
- AI architecture;
- security decisions;
- current limitations;
- production recommendations.

Добавить Mermaid architecture diagram.

---

# 37. Code quality

Использовать:

- TypeScript strict mode;
- ESLint;
- Prettier;
- понятные naming conventions;
- небольшие компоненты;
- reusable components;
- service/repository abstractions там, где они действительно нужны;
- centralized error handling;
- centralized AI client.

Не создавать абстракции просто ради «enterprise architecture».

Следовать YAGNI, DRY и SOLID разумно, без overengineering.

---

# 38. Performance

Не загружать все ответы исследования на frontend, если их много.

Использовать:

- pagination;
- server-side aggregation;
- DB indexes;
- lazy loading;
- optimized queries.

Добавить индексы минимум для frequently queried:

- research status;
- organization;
- respondent;
- research responses;
- demographic filters.

Избегать N+1 queries.

---

# 39. Analytics correctness

Это особенно важно.

Числовые данные должны вычисляться программно.

Например:

- 63% предпочли вариант A;
- average rating = 7.4;
- 42 respondents;
- distribution by age.

Никогда не просить LLM самостоятельно вычислять статистику из большого массива raw answers.

Backend:

raw data
→ deterministic aggregation
→ structured statistics

AI:

structured statistics + selected textual answers
→ interpretation

---

# 40. Representative quotes

Для каждого AI insight желательно хранить связь:

Insight
→ Quote
→ Answer
→ Question
→ anonymized respondent.

В интерфейсе компания должна иметь возможность увидеть:

### Insight

«Пользователи считают упаковку слишком взрослой.»

Supporting responses:

> «Выглядит как продукт для родителей.»

Female, 17

> «Я бы не заметил это на полке.»

Male, 16

Использовать только реально существующие ответы.

---

# 41. AI response quality

AI Assistant должен различать:

### Fact

«61% участников выбрали вариант B.»

### Qualitative insight

«В открытых ответах регулярно упоминается простота дизайна.»

### Recommendation

«Стоит протестировать более минималистичный вариант упаковки.»

Не смешивать эти категории.

Recommendations должны явно восприниматься как интерпретация данных, а не доказанный факт.

---

# 42. Desired dashboard experience

Пользователь должен за 5–10 минут после проведения исследования получить:

1. сколько человек ответило;
2. кто именно ответил в агрегированном демографическом смысле;
3. главные themes;
4. ключевые insights;
5. representative quotes;
6. несколько recommendations;
7. возможность задать дополнительный вопрос AI.

Это центральный продуктовый KPI UX.

---

# 43. Landing page

Добавь простую публичную landing page.

Hero примерно передаёт идею:

> Understand what the next generation actually thinks.

или хороший оригинальный аналог.

Sections:

- problem;
- how it works;
- for brands;
- for young people;
- AI analytics;
- CTA.

Кнопки:

For Companies
Join as Respondent

Не копировать тексты Cafeteria.

---

# 44. MVP definition of done

MVP считается готовым только если следующий сценарий реально работает:

Company создаёт аккаунт
→ создаёт research
→ выбирает аудиторию
→ добавляет вопросы
→ устанавливает reward
→ публикует research
→ подходящий respondent видит его
→ проходит исследование
→ ответы сохраняются
→ respondent получает points
→ company видит новый response
→ charts пересчитываются
→ company запускает AI analysis
→ появляются insights + themes + quotes + recommendations
→ company задаёт вопрос AI Assistant
→ AI отвечает на основании результатов исследования.

Если этот flow не работает — проект нельзя считать завершённым.

---

# 45. Порядок реализации

Не пытайся сразу писать весь UI.

Сначала:

1. проанализируй требования;
2. осмотри существующий repository;
3. выбери architecture;
4. создай data model;
5. настрой authentication;
6. реализуй backend/domain logic;
7. реализуй company research creation;
8. реализуй respondent flow;
9. свяжи responses/rewards;
10. реализуй deterministic analytics;
11. добавь OpenAI;
12. реализуй dashboards;
13. добавь AI Assistant;
14. seed;
15. tests;
16. polish UX;
17. README;
18. final verification.

Если repository уже содержит код — не переписывай всё автоматически. Сначала проанализируй существующую структуру и переиспользуй качественные части.

---

# 46. Работа с OPENAI_API_KEY

В repository уже может находиться `.env` с:

OPENAI_API_KEY=...

Считай этот файл секретным.

Первым делом убедись, что:

.env
.env.*
!.env.example

корректно обработаны `.gitignore`.

Не выводи значение ключа в terminal/logs.

Не копируй его в README.

Не коммить его.

Создай:

OPENAI_MODEL=<cheap-model>

AI_MAX_OUTPUT_TOKENS=<reasonable-value>

и используй configuration layer.

---

# 47. Что делать при отсутствии OpenAI key

Приложение должно запускаться и без ключа.

В таком случае:

- surveys работают;
- analytics работает;
- dashboard работает;
- AI functionality показывает понятное сообщение о недоступности.

Не ломай приложение полностью из-за отсутствующего AI provider.

---

# 48. Дополнительные улучшения

После выполнения core MVP, если остаётся время, можно добавить:

- voice responses;
- Speech-to-Text;
- CSV export;
- PDF report;
- survey templates;
- duplicate research;
- notifications;
- respondent streaks;
- badges;
- richer AI comparisons;
- company team members;
- saved dashboard filters.

Не реализовывай эти функции раньше core flow.

---

# 49. Что НЕ делать

Не:

- делай статический prototype;
- заменяй backend localStorage;
- храни OPENAI_API_KEY на клиенте;
- копируй Cafeteria UI;
- создавай Kubernetes для MVP;
- создавай ненужные микросервисы;
- вызывай AI при каждом render;
- позволяй AI придумывать цифры;
- используй fake analytics после подключения реальных responses;
- оставляй основные кнопки неработающими;
- используй lorem ipsum;
- храни plaintext passwords;
- доверяй organizationId, переданному frontend, без authorization;
- показывай компаниям PII респондентов.

---

# 50. Финальная проверка

После реализации самостоятельно пройди приложение как минимум в двух ролях.

## Company

Register/login
→ Create Research
→ Configure Audience
→ Create Questions
→ Publish
→ Inspect Dashboard.

## Respondent

Register/login
→ Complete Profile
→ Find Research
→ Complete Survey
→ Receive Points
→ View History.

Затем снова Company:

Research
→ Responses
→ Analytics
→ AI Insights
→ Ask AI.

Исправь найденные runtime errors.

Проверь browser console.

Проверь server logs.

Запусти tests.

Проверь production build.

Убедись, что `.env` и API key не отслеживаются Git.

---

# 51. Финальный отчёт

После завершения разработки предоставь короткий отчёт:

## Implemented
Что реализовано.

## Architecture
Какая архитектура и почему выбрана.

## Database
Основные entities.

## AI
Как работает AI analysis и assistant.

## Security
Какие меры реализованы.

## Testing
Какие тесты выполнены.

## Run
Как запустить проект.

## Demo
Demo accounts.

## Limitations
Что сознательно оставлено за пределами MVP.

## Next steps
5–10 наиболее важных следующих улучшений.

Не останавливайся после scaffolding.

Цель задачи — получить **работающий, визуально качественный, демонстрируемый full-stack MVP**, который можно показать потенциальным пользователям, преподавателю, акселератору или инвестору.