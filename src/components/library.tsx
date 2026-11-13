"use client";
import { useApi, Loading, ErrorBox, PageTitle, StudyCard, Empty } from "./ui";
import { AnalyticsView } from "./research-detail";
import { Study, Analytics } from "@/lib/types";
export function Library({ id }: { id?: string }) {
  const { data, error, loading } =
    useApi<(Study & { _count: { participants: number } })[]>("library");
  const report = useApi<{ research: Study; analytics: Analytics }>(
    id ? `library/${id}` : "auth/me",
  );
  if (id)
    return (
      <>
        <PageTitle
          eyebrow="ОТКРЫТЫЙ ОТЧЁТ"
          title={report.data?.research?.title || "Исследование"}
          description="Агрегированные результаты. Без индивидуальных ответов."
        />
        <ErrorBox message={report.error} />
        {report.loading ? (
          <Loading />
        ) : (
          report.data?.analytics && (
            <AnalyticsView data={report.data.analytics} />
          )
        )}
      </>
    );
  return (
    <>
      <PageTitle
        eyebrow="OPEN INSIGHTS"
        title="Больше точек зрения"
        description="Открытые исследования и отчёты, которыми поделились другие команды."
      />
      <ErrorBox message={error} />
      {loading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty>В библиотеке пока нет опубликованных отчётов.</Empty>
      ) : (
        <div className="study-grid">
          {data.map((s) => (
            <StudyCard
              key={s.id}
              study={{ ...s, responses: s._count.participants }}
              href={`/company/library/${s.id}`}
            />
          ))}
        </div>
      )}
    </>
  );
}
