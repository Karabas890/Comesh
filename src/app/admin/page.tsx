"use client";
import { useState } from "react";
import {
  api,
  useApi,
  Loading,
  ErrorBox,
  PageTitle,
  Stat,
  Badge,
} from "@/components/ui";
type Data = {
  users: { id: string; name: string; role: string }[];
  companies: { id: string; name: string; industry: string }[];
  research: { id: string; title: string; status: string; visibility: string }[];
  flags: {
    id: string;
    reason: string;
    resolved: boolean;
    research: { title: string };
  }[];
  responses: number;
};
export default function Page() {
  const { data, error, loading, refresh } = useApi<Data>("admin");
  const [failure, setFailure] = useState("");
  if (loading) return <Loading />;
  if (!data) return <ErrorBox message={error} />;
  return (
    <>
      <PageTitle eyebrow="PLATFORM ADMIN" title="Пульс платформы" />
      <div className="stats-grid">
        <Stat label="Пользователи (до 100)" value={data.users.length} />
        <Stat label="Компании" value={data.companies.length} />
        <Stat label="Исследования" value={data.research.length} />
        <Stat label="Ответы" value={data.responses} />
      </div>
      <ErrorBox message={failure} />
      <section className="panel">
        <h2>Жалобы</h2>
        {!data.flags.length && <p>Открытых жалоб нет.</p>}
        {data.flags.map((f) => (
          <div className="ledger-row" key={f.id}>
            <div>
              <strong>{f.research.title}</strong>
              <p>{f.reason}</p>
            </div>
            {f.resolved ? (
              <Badge>Рассмотрено</Badge>
            ) : (
              <button
                className="button"
                onClick={async () => {
                  try {
                    await api("admin/flags", "PATCH", { id: f.id });
                    await refresh();
                  } catch (e) {
                    setFailure((e as Error).message);
                  }
                }}
              >
                Отметить рассмотренной
              </button>
            )}
          </div>
        ))}
      </section>
      <div className="two-grid">
        <section className="panel">
          <h2>Пользователи</h2>
          {data.users.map((u) => (
            <div className="ledger-row" key={u.id}>
              <span>{u.name}</span>
              <Badge>{u.role}</Badge>
            </div>
          ))}
        </section>
        <section className="panel">
          <h2>Компании</h2>
          {data.companies.map((c) => (
            <div className="ledger-row" key={c.id}>
              <strong>{c.name}</strong>
              <span>{c.industry}</span>
            </div>
          ))}
          <h2>Исследования</h2>
          {data.research.map((r) => (
            <div className="ledger-row" key={r.id}>
              <span>{r.title}</span>
              <Badge>
                {r.status} · {r.visibility}
              </Badge>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
