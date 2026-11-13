"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, useApi, Loading, ErrorBox, Field, PageTitle, Submit } from "./ui";
import { User } from "@/lib/types";
export function Settings() {
  const { data, error, loading, refresh } = useApi<{ user: User }>("auth/me");
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [failure, setFailure] = useState("");
  const router = useRouter();
  if (loading) return <Loading />;
  if (!data) return <ErrorBox message={error} />;
  const u = data.user;
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setFailure("");
    try {
      await api("account", "PATCH", {
        name: f.get("name"),
        ...(u.profile
          ? {
              profile: {
                ...u.profile,
                age: Number(f.get("age")),
                gender: f.get("gender"),
                region: f.get("region"),
                interests: String(f.get("interests"))
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                categories: String(f.get("categories"))
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                brands: String(f.get("brands"))
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            }
          : {}),
      });
      setNotice("Изменения сохранены");
      await refresh();
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    const password = prompt(
      "Удаление необратимо: профиль, ответы и баллы будут удалены. Для компании удалятся её исследования, если вы последний участник. Введите пароль для подтверждения.",
    );
    if (!password) return;
    setBusy(true);
    try {
      await api("account", "DELETE", { password });
      router.push("/");
      router.refresh();
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="ЛИЧНОЕ ПРОСТРАНСТВО"
        title="Настройки"
        description="Ваш профиль и ваши данные — под вашим контролем."
      />
      <form className="panel settings-form" onSubmit={save}>
        <Field label="Имя / никнейм">
          <input name="name" required minLength={2} defaultValue={u.name} />
        </Field>
        <Field label="Email">
          <input disabled value={u.email} />
        </Field>
        {u.profile && (
          <>
            <div className="two-grid">
              <Field label="Возраст (12–99 лет)">
                <input
                  name="age"
                  type="number"
                  required
                  min={12}
                  max={99}
                  defaultValue={u.profile.age}
                />
              </Field>
              <Field label="Пол">
                <select name="gender" defaultValue={u.profile.gender}>
                  <option>Не указывать</option>
                  <option>Женский</option>
                  <option>Мужской</option>
                </select>
              </Field>
            </div>
            <Field label="Регион">
              <input name="region" required defaultValue={u.profile.region} />
            </Field>
            {(["interests", "categories", "brands"] as const).map((key, i) => (
              <Field
                key={key}
                label={
                  [
                    "Интересы через запятую",
                    "Категории через запятую",
                    "Бренды через запятую",
                  ][i]
                }
              >
                <input name={key} defaultValue={u.profile![key].join(", ")} />
              </Field>
            ))}
          </>
        )}
        <ErrorBox message={failure} />
        {notice && (
          <div className="notice" role="status">
            {notice}
          </div>
        )}
        <Submit busy={busy}>Сохранить изменения</Submit>
      </form>
      <section className="panel settings-form">
        <h2>Конфиденциальность</h2>
        <p>
          Прочитайте{" "}
          <Link className="text-link" href="/privacy">
            как мы обрабатываем данные
          </Link>
          .
        </p>
        <button className="button danger" disabled={busy} onClick={remove}>
          Удалить аккаунт и данные
        </button>
      </section>
    </>
  );
}
