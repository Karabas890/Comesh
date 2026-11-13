"use client";
import Link from "next/link";
import { Plus, ArrowUpRight, Sparkles, AudioLines } from "lucide-react";
import { useState } from "react";
import {
  useApi,
  ErrorBox,
  Loading,
  PageTitle,
  Stat,
  StudyCard,
  Empty,
  Badge,
} from "./ui";
import { Study, Insight } from "@/lib/types";
import { ActivityChart } from "./charts";
export function CompanyOverview({
  mode = "overview",
}: {
  mode?: "overview" | "research" | "insights" | "assistant";
}) {
  const { data, error, loading } = useApi<Study[]>("research");
  const [filter, setFilter] = useState("ALL"),
    [search, setSearch] = useState("");
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  const rows = data || [];
  const total = rows.reduce((s, r) => s + r.responses, 0),
    started = rows.reduce((s, r) => s + r._count.participants, 0);
  const filtered = rows.filter(
    (r) =>
      (filter === "ALL" || r.status === filter) &&
      r.title.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        eyebrow="СЛУШАЙТЕ. ПОНИМАЙТЕ. СОЗДАВАЙТЕ."
        title={
          mode === "overview"
            ? "Новый день. Новые открытия."
            : mode === "insights"
              ? "Инсайты вашей аудитории"
              : mode === "assistant"
                ? "Спросите у данных"
                : "Ваши исследования"
        }
        description={
          mode === "overview"
            ? "Всё, что ваша аудитория хочет вам рассказать — в одном месте."
            : mode === "assistant"
              ? "Выберите исследование, чтобы обсудить его результаты с AI."
              : "От первого вопроса до следующего большого решения."
        }
        action={
          <Link href="/company/create" className="button primary">
            <Plus size={17} /> Создать исследование
          </Link>
        }
      />
      {mode === "overview" && (
        <>
          <div className="stats-grid">
            <Stat
              label="Активные исследования"
              value={rows.filter((r) => r.status === "ACTIVE").length}
              detail="Собирают мнения прямо сейчас"
            />
            <Stat label="Всего ответов" value={total} detail="За всё время" />
            <Stat
              label="Завершённые"
              value={rows.filter((r) => r.status === "COMPLETED").length}
              detail="Готовы к новым открытиям"
            />
            <Stat
              label="Доля завершений"
              value={`${started ? Math.round((total / started) * 100) : 0}%`}
              detail="Среди начатых прохождений"
            />
          </div>
          <div className="overview-banner">
            <div>
              <Badge tone="lime">
                <Sparkles size={13} /> ОТ ДАННЫХ К СМЫСЛУ
              </Badge>
              <h2>
                Не просто ответы.
                <br />
                Направление для вашего бренда.
              </h2>
              <p>
                Находите повторяющиеся темы и проверяйте гипотезы вместе с AI.
              </p>
              <Link className="text-link" href="/company/insights">
                Открыть инсайты <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="banner-wave">
              <AudioLines size={130} strokeWidth={1} />
            </div>
          </div>
        </>
      )}
      <div className="section-heading">
        <h2>
          {mode === "overview"
            ? "Последние исследования"
            : mode === "assistant"
              ? "Контекст для разговора"
              : "Исследования"}
        </h2>
        <input
          aria-label="Поиск исследований"
          className="search"
          placeholder="Найти исследование…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="tabs">
        {[
          ["ALL", "Все"],
          ["ACTIVE", "Активные"],
          ["COMPLETED", "Завершённые"],
          ["DRAFT", "Черновики"],
          ["PAUSED", "На паузе"],
          ["ARCHIVED", "Архив"],
        ].map(([v, t]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={filter === v ? "active" : ""}
          >
            {t}
          </button>
        ))}
      </div>
      {!filtered.length ? (
        <Empty>
          Пока ничего нет. Создайте исследование или измените фильтр.
        </Empty>
      ) : (
        <div className="study-grid">
          {filtered.slice(0, mode === "overview" ? 6 : 100).map((r) => (
            <StudyCard
              key={r.id}
              study={r}
              href={`/company/research/${r.id}${mode === "assistant" ? "?tab=assistant" : mode === "insights" ? "?tab=insights" : ""}`}
            />
          ))}
        </div>
      )}
      {mode === "overview" && rows.some((r) => r.responses > 0) && (
        <RecentInsight />
      )}
    </>
  );
}
function RecentInsight() {
  const { data, error, loading } = useApi<{
    activity: { day: string; count: number }[];
    insights: (Insight & { researchId: string; research: { title: string } })[];
  }>("overview");
  if (loading) return <Loading />;
  return (
    <div className="two-grid overview-bottom">
      <section className="panel">
        <h3>Активность ответов</h3>
        <p>Все исследования · последние 30 дней с ответами</p>
        {data?.activity.length ? (
          <ActivityChart data={data.activity} />
        ) : (
          <Empty>Пока нет ответов</Empty>
        )}
      </section>
      <section className="panel">
        <h3>Последние инсайты</h3>
        <ErrorBox message={error} />
        {data?.insights.length ? (
          data.insights.map((a) => (
            <article className="recent-insight-item" key={a.id}>
              <small>
                {a.research.title}
                {a.model === "demo-editorial-example" ? " · Демо-пример" : ""}
              </small>
              <p>{a.result.executiveSummary}</p>
              <Link
                className="text-link"
                href={`/company/research/${a.researchId}?tab=insights`}
              >
                Посмотреть подтверждения ↗
              </Link>
            </article>
          ))
        ) : (
          <Empty>Запустите анализ исследования</Empty>
        )}
      </section>
    </div>
  );
}
