"use client";
import { useEffect, useState, useCallback, cloneElement } from "react";
import { LoaderCircle, ArrowUpRight, AudioLines } from "lucide-react";
import Link from "next/link";
export async function api<T>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    });
  } catch {
    throw new Error("Нет соединения с сервером. Попробуйте снова.");
  }
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "Не удалось выполнить запрос");
  return result;
}
export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const refresh = useCallback(() => {
    setLoading(true);
    setError("");
    return api<T>(path)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [path]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api<T>(path)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path]);
  return { data, error, loading, refresh, setData };
}
export function Logo() {
  return (
    <Link href="/" className="logo">
      <span className="logo-mark">
        <AudioLines size={24} />
      </span>
      veyra<span className="logo-dot">®</span>
    </Link>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" /> Загружаем…
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}
export function ErrorBox({ message }: { message: string }) {
  return message ? (
    <div className="error" role="alert">
      {message}
    </div>
  ) : null;
}
export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}
export function Badge({
  children,
  tone = "",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {cloneElement(children as React.ReactElement<{ "aria-label"?: string }>, {
        "aria-label": label,
      })}
    </label>
  );
}
export function Submit({
  busy,
  children,
}: {
  busy: boolean;
  children: React.ReactNode;
}) {
  return (
    <button className="button primary" disabled={busy} type="submit">
      {busy ? <LoaderCircle className="spin" size={18} /> : null}
      {children}
    </button>
  );
}
export const statusLabels: Record<string, string> = {
  DRAFT: "Черновик",
  ACTIVE: "Активно",
  PAUSED: "На паузе",
  COMPLETED: "Завершено",
  ARCHIVED: "В архиве",
};
export function StudyCard({
  study,
  href,
}: {
  study: {
    title: string;
    category: string;
    description: string;
    status?: string;
    responses?: number;
    visibility?: string;
  };
  href: string;
}) {
  return (
    <Link className="study-card" href={href}>
      <div
        className={`study-art art-${study.category.toLowerCase().replace(/[^a-z]/g, "")}`}
      >
        <span>{study.category}</span>
        <div className="orbit" />
        <ArrowUpRight className="study-arrow" />
      </div>
      <div className="study-card-body">
        <div className="row">
          <Badge tone={study.status === "ACTIVE" ? "green" : ""}>
            {study.status ? statusLabels[study.status] : study.visibility}
          </Badge>
          <small>{study.responses ?? 0} ответов</small>
        </div>
        <h3>{study.title}</h3>
        <p>{study.description}</p>
      </div>
    </Link>
  );
}
