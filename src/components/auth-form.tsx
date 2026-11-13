"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, AudioLines } from "lucide-react";
import { api, ErrorBox, Field, Logo, Submit } from "./ui";
import { categories } from "@/lib/domain";
export function AuthForm({
  register = false,
  initialRole = "COMPANY",
}: {
  register?: boolean;
  initialRole?: string;
}) {
  const router = useRouter();
  const [role, setRole] = useState(initialRole),
    [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    age: 20,
    gender: "Не указывать",
    region: "Москва",
    interests: "",
    brands: "",
    company: "",
    industry: "",
    size: "1–10",
    title: "",
    website: "",
  });
  const [selected, setSelected] = useState<string[]>(["Technology"]);
  const update = (key: string, value: string | number) =>
    setForm({ ...form, [key]: value });
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (register && step === 0) {
      setStep(1);
      return;
    }
    setBusy(true);
    try {
      const result = await api<{ role: string }>(
        register ? "auth/register" : "auth/login",
        "POST",
        register
          ? {
              email: form.email,
              password: form.password,
              name: form.name,
              role,
              consent: true,
              ...(role === "COMPANY"
                ? {
                    organization: {
                      name: form.company,
                      industry: form.industry,
                      size: form.size,
                      title: form.title,
                      website: form.website,
                    },
                  }
                : {
                    profile: {
                      age: form.age,
                      gender: form.gender,
                      region: form.region,
                      interests: form.interests
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                      brands: form.brands
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                      categories: selected,
                    },
                  }),
            }
          : { email: form.email, password: form.password },
      );
      if (register) {
        try {
          sessionStorage.setItem("veyra:registered", "1");
        } catch {
          /* Registration still works when storage is unavailable. */
        }
      }
      router.push(
        result.role === "COMPANY"
          ? "/company"
          : result.role === "ADMIN"
            ? "/admin"
            : "/youth",
      );
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-layout">
      <aside className="auth-aside">
        <Logo />
        <div>
          <span className="eyebrow">ГОЛОСА, КОТОРЫЕ МЕНЯЮТ БУДУЩЕЕ</span>
          <h1>
            Ближе к людям.
            <br />
            Точнее в решениях.
          </h1>
          <AudioLines size={180} strokeWidth={0.8} />
          <p>
            Исследования с человеческим лицом.
            <br />
            От первого вопроса до нового открытия.
          </p>
        </div>
        <small>© 2026 Veyra</small>
      </aside>
      <section className="auth-content">
        <Link href="/" className="back">
          <ArrowLeft size={16} /> На главную
        </Link>
        <div className="auth-form">
          <span className="eyebrow">
            {register ? `ШАГ ${step + 1} ИЗ 2` : "С ВОЗВРАЩЕНИЕМ"}
          </span>
          <h1>
            {register
              ? step
                ? "Познакомимся ближе"
                : "Начните с любопытства"
              : "Рады снова видеть"}
          </h1>
          <p>
            {register
              ? "Пара деталей — и можно начинать."
              : "Войдите, чтобы продолжить исследование."}
          </p>
          <form onSubmit={submit}>
            {register && step === 0 && (
              <div className="role-picker">
                <button
                  type="button"
                  className={role === "COMPANY" ? "selected" : ""}
                  onClick={() => setRole("COMPANY")}
                >
                  Я представляю компанию
                </button>
                <button
                  type="button"
                  className={role === "RESPONDENT" ? "selected" : ""}
                  onClick={() => setRole("RESPONDENT")}
                >
                  Хочу проходить исследования
                </button>
              </div>
            )}
            {(!register || step === 0) && (
              <>
                <Field label="Email">
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </Field>
                <Field label="Пароль">
                  <input
                    type="password"
                    autoComplete={
                      register ? "new-password" : "current-password"
                    }
                    minLength={10}
                    maxLength={72}
                    required
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                  />
                </Field>
                {register && <small>Не менее 10 символов.</small>}
              </>
            )}
            {register && step === 1 && (
              <>
                <Field label={role === "COMPANY" ? "Ваше имя" : "Никнейм"}>
                  <input
                    required
                    minLength={2}
                    maxLength={60}
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                  />
                </Field>
                {role === "COMPANY" ? (
                  <>
                    <Field label="Название компании">
                      <input
                        required
                        value={form.company}
                        onChange={(e) => update("company", e.target.value)}
                      />
                    </Field>
                    <div className="two-grid">
                      <Field label="Отрасль">
                        <input
                          required
                          value={form.industry}
                          onChange={(e) => update("industry", e.target.value)}
                        />
                      </Field>
                      <Field label="Размер компании">
                        <select
                          value={form.size}
                          onChange={(e) => update("size", e.target.value)}
                        >
                          {["1–10", "11–50", "51–200", "201+"].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <Field label="Ваша должность">
                      <input
                        required
                        value={form.title}
                        onChange={(e) => update("title", e.target.value)}
                      />
                    </Field>
                    <Field label="Сайт (необязательно)">
                      <input
                        type="url"
                        value={form.website}
                        onChange={(e) => update("website", e.target.value)}
                        placeholder="https://"
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <div className="two-grid">
                      <Field label="Возраст (12–99 лет)">
                        <input
                          type="number"
                          min={12}
                          max={99}
                          required
                          value={form.age}
                          onChange={(e) =>
                            update("age", Number(e.target.value))
                          }
                        />
                      </Field>
                      <Field label="Пол">
                        <select
                          value={form.gender}
                          onChange={(e) => update("gender", e.target.value)}
                        >
                          {["Не указывать", "Женский", "Мужской"].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <Field label="Регион">
                      <input
                        required
                        value={form.region}
                        onChange={(e) => update("region", e.target.value)}
                      />
                    </Field>
                    <fieldset>
                      <legend>Что вам интересно?</legend>
                      <div className="chips">
                        {categories.map((c) => (
                          <button
                            type="button"
                            key={c}
                            aria-pressed={selected.includes(c)}
                            className={selected.includes(c) ? "selected" : ""}
                            onClick={() =>
                              setSelected(
                                selected.includes(c)
                                  ? selected.filter((s) => s !== c)
                                  : [...selected, c],
                              )
                            }
                          >
                            {selected.includes(c) && <Check size={12} />} {c}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <Field label="Интересы через запятую">
                      <input
                        value={form.interests}
                        onChange={(e) => update("interests", e.target.value)}
                        placeholder="Дизайн, путешествия"
                      />
                    </Field>
                    <Field label="Любимые бренды через запятую">
                      <input
                        value={form.brands}
                        onChange={(e) => update("brands", e.target.value)}
                      />
                    </Field>
                  </>
                )}
                <label className="checkbox">
                  <input type="checkbox" required />{" "}
                  <span>
                    Я принимаю{" "}
                    <Link href="/privacy" target="_blank">
                      условия обработки данных
                    </Link>
                    , включая AI-анализ ответов.
                  </span>
                </label>
              </>
            )}
            <ErrorBox message={error} />
            <div className="form-actions">
              {register && step === 1 && (
                <button
                  type="button"
                  className="button"
                  onClick={() => setStep(0)}
                >
                  Назад
                </button>
              )}
              <Submit busy={busy}>
                {register ? (step ? "Создать аккаунт" : "Продолжить") : "Войти"}
              </Submit>
            </div>
          </form>
          <p>
            {register ? "Уже есть аккаунт?" : "Впервые здесь?"}{" "}
            <Link
              className="text-link"
              href={register ? "/login" : "/register"}
            >
              {register ? "Войти" : "Зарегистрироваться"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
