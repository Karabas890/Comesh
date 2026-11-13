"use client";
import { useState } from "react";
import { Sparkles, Send, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import {
  api,
  useApi,
  ErrorBox,
  Loading,
  PageTitle,
  Stat,
  Empty,
  Badge,
  Field,
  statusLabels,
} from "./ui";
import { Analytics, Study, Insight, Quote } from "@/lib/types";
import { DistributionChart, ActivityChart } from "./charts";
export function Quotes({ quotes }: { quotes: Quote[] }) {
  return (
    <div className="quote-grid">
      {quotes.map((q) => (
        <blockquote key={q.answerId}>
          <p>«{q.text}»</p>
          <footer>
            {q.respondentId} · {q.age} лет · {q.gender}
            <small>Источник: {q.answerId.slice(-8)}</small>
          </footer>
        </blockquote>
      ))}
    </div>
  );
}
export function AnalyticsView({ data }: { data: Analytics }) {
  return (
    <>
      <div className="stats-grid three">
        <Stat label="Завершили" value={data.count} />
        <Stat label="Начали" value={data.started} />
        <Stat label="Доля завершений" value={`${data.completionRate}%`} />
      </div>
      {!data.count ? (
        <Empty>
          Ответов пока нет. Статистика появится после первого прохождения.
        </Empty>
      ) : (
        <>
          <section className="panel">
            <h3>Активность ответов</h3>
            <ActivityChart data={data.activity} />
          </section>
          <div className="two-grid">
            {data.questions
              .filter((q) => q.type !== "TEXT")
              .map((q) => (
                <section className="panel" key={q.id}>
                  <h3>{q.text}</h3>
                  {q.average !== null && q.type === "RATING" && (
                    <p>
                      Средняя оценка: <strong>{q.average}</strong>
                    </p>
                  )}
                  <DistributionChart data={q.distribution} />
                </section>
              ))}
          </div>
          {!!data.quotes.length && (
            <section>
              <h2>Голоса аудитории</h2>
              <p className="muted">
                Выборка до 6 текстовых ответов. Все ответы доступны во вкладке
                «Ответы».
              </p>
              <Quotes quotes={data.quotes.slice(0, 6)} />
            </section>
          )}
        </>
      )}
    </>
  );
}
export function ResearchDetail({
  id,
  initialTab = "overview",
}: {
  id: string;
  initialTab?: string;
}) {
  const r = useApi<Study>(`research/${id}`);
  const [tab, setTab] = useState(initialTab),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v),
  ).toString();
  const a = useApi<Analytics>(`research/${id}/analytics?${query}`);
  async function status(status: string) {
    if (!confirm(`Изменить статус на «${statusLabels[status]}»?`)) return;
    setBusy(true);
    setError("");
    try {
      await api(`research/${id}/status`, "POST", { status });
      await r.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (r.loading) return <Loading />;
  if (r.error) return <ErrorBox message={r.error} />;
  if (!r.data) return null;
  const study = r.data;
  return (
    <>
      <Link className="back" href="/company/research">
        <ArrowLeft size={15} /> Все исследования
      </Link>
      <PageTitle
        eyebrow={`${study.brand} / ${study.category}`}
        title={study.title}
        description={study.description}
        action={
          <Badge tone={study.status === "ACTIVE" ? "green" : ""}>
            {statusLabels[study.status]}
          </Badge>
        }
      />
      <div className="research-meta">
        <span>{study.visibility}</span>
        <span>
          {study.target.minAge}–{study.target.maxAge} лет
        </span>
        <span>+{study.reward} баллов</span>
        <span>{new Date(study.createdAt).toLocaleDateString("ru")}</span>
        <div className="row compact">
          {study.status === "DRAFT" && (
            <button
              className="button small primary"
              disabled={busy}
              onClick={() => status("ACTIVE")}
            >
              Опубликовать
            </button>
          )}
          {study.status === "ACTIVE" && (
            <button
              className="button small"
              disabled={busy}
              onClick={() => status("PAUSED")}
            >
              На паузу
            </button>
          )}
          {study.status === "PAUSED" && (
            <button
              className="button small"
              disabled={busy}
              onClick={() => status("ACTIVE")}
            >
              Возобновить
            </button>
          )}
          {["ACTIVE", "PAUSED"].includes(study.status) && (
            <button
              className="button small"
              disabled={busy}
              onClick={() => status("COMPLETED")}
            >
              Завершить
            </button>
          )}
          {["DRAFT", "COMPLETED", "PAUSED"].includes(study.status) && (
            <button
              className="button small"
              disabled={busy}
              onClick={() => status("ARCHIVED")}
            >
              В архив
            </button>
          )}
        </div>
      </div>
      <ErrorBox message={error} />
      <div className="tabs">
        {[
          ["overview", "Обзор"],
          ["insights", "AI-инсайты"],
          ["questions", "Вопросы"],
          ["responses", "Ответы"],
          ["demographics", "Демография"],
          ["assistant", "AI-ассистент"],
        ].map(([key, title]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
          >
            {title}
          </button>
        ))}
      </div>
      {["overview", "responses", "demographics"].includes(tab) && (
        <div className="filters panel">
          <Field label="Возраст от">
            <input
              type="number"
              min={12}
              max={99}
              value={filters.minAge || ""}
              onChange={(e) =>
                setFilters({ ...filters, minAge: e.target.value })
              }
            />
          </Field>
          <Field label="До">
            <input
              type="number"
              min={12}
              max={99}
              value={filters.maxAge || ""}
              onChange={(e) =>
                setFilters({ ...filters, maxAge: e.target.value })
              }
            />
          </Field>
          <Field label="Пол">
            <select
              value={filters.gender || ""}
              onChange={(e) =>
                setFilters({ ...filters, gender: e.target.value })
              }
            >
              <option value="">Все</option>
              <option>Женский</option>
              <option>Мужской</option>
              <option>Не указывать</option>
            </select>
          </Field>
          <Field label="Регион">
            <input
              value={filters.region || ""}
              onChange={(e) =>
                setFilters({ ...filters, region: e.target.value })
              }
            />
          </Field>
          <Field label="Интерес">
            <input
              value={filters.interest || ""}
              onChange={(e) =>
                setFilters({ ...filters, interest: e.target.value })
              }
            />
          </Field>
          <Field label="Вопрос">
            <select
              value={filters.question || ""}
              onChange={(e) =>
                setFilters({ ...filters, question: e.target.value })
              }
            >
              <option value="">Все</option>
              {study.questions.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.text}
                </option>
              ))}
            </select>
          </Field>
          <button className="button small" onClick={() => setFilters({})}>
            Сбросить
          </button>
        </div>
      )}
      {a.error && <ErrorBox message={a.error} />}
      {tab === "overview" &&
        (a.loading ? <Loading /> : a.data && <AnalyticsView data={a.data} />)}
      {tab === "demographics" && a.data && (
        <div className="three-grid">
          {Object.entries(a.data.demographics).map(([key, data]) => (
            <section className="panel" key={key}>
              <h3>
                {{ age: "Возраст", gender: "Пол", region: "Регион" }[key]}
              </h3>
              <DistributionChart data={data} />
            </section>
          ))}
        </div>
      )}
      {tab === "questions" && (
        <div className="panel">
          {study.questions.map((q, i) => (
            <div className="review-question" key={q.id}>
              <Badge>{q.type}</Badge>
              <h3>
                {i + 1}. {q.text}
              </h3>
              <p>
                {q.options.map((o) => o.text).join(" · ") ||
                  (q.type === "RATING" ? `Шкала 1–${q.scale}` : "")}
                {q.required ? " · Обязательный" : ""}
              </p>
            </div>
          ))}
          {study.visibility === "SHARED" && (
            <button
              className="button"
              disabled={busy}
              onClick={async () => {
                if (
                  !confirm(
                    "Изменить доступность агрегированного отчёта в библиотеке?",
                  )
                )
                  return;
                setBusy(true);
                try {
                  await api(`research/${id}/release`, "POST", {
                    released: !study.sharedReleased,
                  });
                  await r.refresh();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {study.sharedReleased
                ? "Убрать из библиотеки"
                : "Разрешить публикацию в библиотеке"}
            </button>
          )}
        </div>
      )}
      {tab === "responses" && <Responses id={id} query={query} />}
      {tab === "insights" && <Insights id={id} />}
      {tab === "assistant" && <Assistant id={id} />}
    </>
  );
}
function Responses({ id, query }: { id: string; query: string }) {
  const [page, setPage] = useState(1);
  const { data, error, loading } = useApi<{
    count: number;
    rows: {
      id: string;
      age: number;
      gender: string;
      region: string;
      completedAt: string;
      answers: {
        id: string;
        text: string | null;
        number: number | null;
        question: { text: string };
        selections: { option: { text: string } }[];
      }[];
    }[];
  }>(`research/${id}/responses?page=${page}&${query}`);
  if (loading) return <Loading />;
  return (
    <>
      <ErrorBox message={error} />
      {data && !data.rows.length && (
        <Empty>Нет ответов для выбранного сегмента.</Empty>
      )}
      {data?.rows.map((row) => (
        <details className="panel response-row" key={row.id}>
          <summary>
            <strong>{row.id}</strong>
            <span>
              {row.age} лет · {row.gender} · {row.region}
            </span>
            <small>{new Date(row.completedAt).toLocaleString("ru")}</small>
          </summary>
          {row.answers.map((a) => (
            <div className="answer-row" key={a.id}>
              <strong>{a.question.text}</strong>
              <p>
                {a.text ??
                  a.number ??
                  a.selections.map((s) => s.option.text).join(", ")}
              </p>
            </div>
          ))}
        </details>
      ))}
      <div className="row">
        <button
          className="button"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Назад
        </button>
        <span>
          Страница {page} · Всего {data?.count || 0}
        </span>
        <button
          className="button"
          disabled={page * 20 >= (data?.count || 0)}
          onClick={() => setPage(page + 1)}
        >
          Далее
        </button>
      </div>
    </>
  );
}
function Insights({ id }: { id: string }) {
  const { data, loading, error, refresh } = useApi<{
    analysis: Insight | null;
    stale: boolean;
  }>(`research/${id}/analysis`);
  const [busy, setBusy] = useState(false),
    [failure, setFailure] = useState("");
  async function generate() {
    setBusy(true);
    setFailure("");
    try {
      await api(`research/${id}/analysis`, "POST", {});
      await refresh();
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const result = data?.analysis?.result;
  return (
    <>
      <div className="insight-toolbar">
        <div>
          <h2>За числами — люди</h2>
          <p>
            AI интерпретирует статистику. Проверяйте выводы по исходным ответам.
          </p>
        </div>
        <button className="button primary" disabled={busy} onClick={generate}>
          {busy ? (
            <RefreshCw className="spin" size={17} />
          ) : (
            <Sparkles size={17} />
          )}{" "}
          {busy
            ? "Анализируем…"
            : result
              ? "Обновить инсайты"
              : "Создать AI-анализ"}
        </button>
      </div>
      <ErrorBox message={failure || error} />
      {loading ? (
        <Loading />
      ) : !result ? (
        <Empty>
          Запустите анализ после первого ответа. Результат сохранится для
          команды.
        </Empty>
      ) : (
        <>
          {data?.stale && (
            <div className="notice">
              Данные изменились. Обновите анализ, чтобы учесть новые ответы.
            </div>
          )}
          <div className="insight-summary">
            <Badge>EXECUTIVE SUMMARY</Badge>
            <h2>{result.executiveSummary}</h2>
            <small>
              {result.sampleSize} ответов · {data?.analysis?.model} ·{" "}
              {new Date(data!.analysis!.createdAt).toLocaleDateString("ru")}
            </small>
          </div>
          <div className="two-grid">
            <section className="panel">
              <h3>Ключевые наблюдения</h3>
              {result.keyInsights.map((s, i) => (
                <p key={i}>{s}</p>
              ))}
            </section>
            <section className="panel">
              <h3>Повторяющиеся темы</h3>
              <div className="chips">
                {result.themes.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
              <p>
                {result.sentiment.label}: {result.sentiment.explanation}
              </p>
            </section>
          </div>
          <h2>Подтверждающие цитаты</h2>
          <Quotes quotes={result.representativeQuotes} />
          <section className="panel">
            <h3>Рекомендации · интерпретация AI</h3>
            <ul>
              {result.recommendedActions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
            <h4>Ограничения</h4>
            {result.limitations.map((s, i) => (
              <p key={i} className="muted">
                {s}
              </p>
            ))}
          </section>
        </>
      )}
    </>
  );
}
type AssistantResult = {
  facts: string[];
  qualitativeInsights: string[];
  recommendations: string[];
  limitations: string[];
  quotes: Quote[];
};
function AssistantReply({ content }: { content: string }) {
  let data: AssistantResult;
  try {
    data = JSON.parse(content);
  } catch {
    return <p>{content}</p>;
  }
  return (
    <>
      {[
        ["Факты", data.facts],
        ["Качественные выводы", data.qualitativeInsights],
        ["Рекомендации", data.recommendations],
        ["Ограничения", data.limitations],
      ].map(([title, items]) => (
        <div key={title as string}>
          <strong>{title as string}</strong>
          {(items as string[]).map((s, i) => (
            <p key={i}>{s}</p>
          ))}
        </div>
      ))}
      <Quotes quotes={data.quotes || []} />
    </>
  );
}
function Assistant({ id }: { id: string }) {
  const { data, refresh, error } = useApi<
    { id: string; role: string; content: string }[]
  >(`research/${id}/assistant`);
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [failure, setFailure] = useState("");
  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFailure("");
    try {
      await api(`research/${id}/assistant`, "POST", { message });
      setMessage("");
      await refresh();
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel assistant">
      <div className="assistant-heading">
        <Sparkles />
        <h2>Давайте разберёмся глубже</h2>
        <p>
          Контекст ограничен этим исследованием. Новые ответы учитываются при
          каждом вопросе.
        </p>
      </div>
      {!data?.length && (
        <div className="suggestions">
          {[
            "Какие три темы повторяются?",
            "Сравни участников 18–21 и 22–30 лет",
            "Что стоит изменить в продукте?",
          ].map((s) => (
            <button key={s} onClick={() => setMessage(s)}>
              {s} ↗
            </button>
          ))}
        </div>
      )}
      <div className="messages">
        {data?.map((m) => (
          <article key={m.id} className={`message ${m.role}`}>
            <span className="eyebrow">
              {m.role === "user" ? "ВЫ" : "VEYRA AI"}
            </span>
            {m.role === "user" ? (
              <p>{m.content}</p>
            ) : (
              <AssistantReply content={m.content} />
            )}
          </article>
        ))}
      </div>
      <ErrorBox message={failure || error} />
      {busy && <p role="status">Изучаем данные…</p>}
      <form onSubmit={send} className="chat-input">
        <input
          aria-label="Вопрос ассистенту"
          required
          minLength={3}
          maxLength={1000}
          placeholder="Что вам хочется узнать?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          className="button primary"
          disabled={busy}
          aria-label="Отправить вопрос"
        >
          <Send size={18} />
        </button>
      </form>
    </section>
  );
}
