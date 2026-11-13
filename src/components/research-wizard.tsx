"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  ArrowRight,
} from "lucide-react";
import { api, ErrorBox, Field, PageTitle, Submit, Badge } from "./ui";
import { categories, researchSchema, ResearchInput } from "@/lib/domain";
const steps = [
  "Основное",
  "Аудитория",
  "Вопросы",
  "Видимость",
  "Награда",
  "Проверка",
  "Публикация",
];
const freshQuestion = () => ({
  text: "",
  type: "SINGLE" as const,
  required: true,
  scale: 5,
  options: ["", ""],
});
export function ResearchWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [audience, setAudience] = useState<number | null>(null),
    [savedId, setSavedId] = useState("");
  const [form, setForm] = useState<ResearchInput>({
    title: "",
    description: "",
    brand: "",
    objective: "Product feedback",
    category: "Technology",
    target: {
      minAge: 12,
      maxAge: 30,
      gender: "",
      region: "",
      interests: [],
      categories: [],
    },
    questions: [freshQuestion()],
    visibility: "PRIVATE",
    reward: 120,
    minutes: 4,
  });
  const set = (data: Partial<ResearchInput>) => setForm({ ...form, ...data });
  const target = (data: Partial<ResearchInput["target"]>) =>
    set({ target: { ...form.target, ...data } });
  const question = (
    i: number,
    data: Partial<ResearchInput["questions"][number]>,
  ) =>
    set({
      questions: form.questions.map((q, n) =>
        i === n ? { ...q, ...data } : q,
      ),
    });
  async function next(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (step === 2) {
      const result = researchSchema.shape.questions.safeParse(form.questions);
      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }
    }
    if (step === 1) {
      setBusy(true);
      try {
        const r = await api<{ count: number }>(
          "research/audience",
          "POST",
          form.target,
        );
        setAudience(r.count);
      } catch (e) {
        setError((e as Error).message);
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    setStep(step + 1);
  }
  async function save(publish: boolean) {
    setError("");
    const parsed = researchSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      const id =
        savedId || (await api<{ id: string }>("research", "POST", form)).id;
      setSavedId(id);
      if (publish)
        await api(`research/${id}/status`, "POST", { status: "ACTIVE" });
      router.push(`/company/research/${id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="НОВОЕ ИССЛЕДОВАНИЕ"
        title="Любопытство — первый шаг"
        description="Соберите вопросы, которые помогут принять следующее решение."
      />
      <div className="wizard">
        <aside className="wizard-steps">
          {steps.map((s, i) => (
            <div
              key={s}
              className={i === step ? "current" : i < step ? "done" : ""}
            >
              <span>{i < step ? <Check size={14} /> : i + 1}</span>
              {s}
            </div>
          ))}
          <p>
            Ответы анонимизированы.
            <br />
            Баллы начисляются автоматически.
          </p>
        </aside>
        <form className="panel wizard-body" onSubmit={next}>
          <div className="row">
            <Badge>ШАГ {step + 1} / 7</Badge>
            <small>Сохраняется при завершении</small>
          </div>
          <h2>{steps[step]}</h2>
          {step === 0 && (
            <>
              <Field label="Название исследования">
                <input
                  required
                  minLength={3}
                  maxLength={120}
                  placeholder="Например, Наушники для твоего ритма"
                  value={form.title}
                  onChange={(e) => set({ title: e.target.value })}
                />
              </Field>
              <Field label="Описание">
                <textarea
                  required
                  minLength={5}
                  maxLength={2000}
                  placeholder="О чём поговорим и почему это важно?"
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                />
              </Field>
              <div className="two-grid">
                <Field label="Бренд / продукт">
                  <input
                    required
                    value={form.brand}
                    onChange={(e) => set({ brand: e.target.value })}
                  />
                </Field>
                <Field label="Категория">
                  <select
                    value={form.category}
                    onChange={(e) => set({ category: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Цель исследования">
                <select
                  value={form.objective}
                  onChange={(e) => set({ objective: e.target.value })}
                >
                  {[
                    "Concept testing",
                    "Brand perception",
                    "Campaign testing",
                    "Product feedback",
                    "Trend discovery",
                    "Competitor analysis",
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </>
          )}
          {step === 1 && (
            <>
              <p>
                Оставьте необязательные фильтры пустыми, чтобы охватить больше
                людей.
              </p>
              <div className="two-grid">
                <Field label="Возраст от">
                  <input
                    required
                    type="number"
                    min={12}
                    max={99}
                    value={form.target.minAge}
                    onChange={(e) => target({ minAge: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Возраст до">
                  <input
                    required
                    type="number"
                    min={form.target.minAge}
                    max={99}
                    value={form.target.maxAge}
                    onChange={(e) => target({ maxAge: Number(e.target.value) })}
                  />
                </Field>
              </div>
              <div className="two-grid">
                <Field label="Пол">
                  <select
                    value={form.target.gender}
                    onChange={(e) => target({ gender: e.target.value })}
                  >
                    <option value="">Любой</option>
                    <option>Женский</option>
                    <option>Мужской</option>
                    <option>Не указывать</option>
                  </select>
                </Field>
                <Field label="Регион">
                  <input
                    value={form.target.region}
                    onChange={(e) => target({ region: e.target.value })}
                    placeholder="Любой"
                  />
                </Field>
              </div>
              <Field label="Интересы (через запятую)">
                <input
                  value={form.target.interests.join(",")}
                  onChange={(e) =>
                    target({
                      interests: e.target.value.split(",").filter(Boolean),
                    })
                  }
                />
              </Field>
              <fieldset>
                <legend>Категории аудитории</legend>
                <div className="chips">
                  {categories.map((c) => (
                    <button
                      type="button"
                      key={c}
                      aria-pressed={form.target.categories.includes(c)}
                      className={
                        form.target.categories.includes(c) ? "selected" : ""
                      }
                      onClick={() =>
                        target({
                          categories: form.target.categories.includes(c)
                            ? form.target.categories.filter((x) => x !== c)
                            : [...form.target.categories, c],
                        })
                      }
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}
          {step === 2 && (
            <>
              <p>До 25 вопросов. Один вопрос за раз в приложении участника.</p>
              {form.questions.map((q, i) => (
                <section className="question-editor" key={i}>
                  <div className="row">
                    <strong>Вопрос {i + 1}</strong>
                    <div className="row compact">
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Поднять вопрос ${i + 1}`}
                        disabled={!i}
                        onClick={() => {
                          const qs = [...form.questions];
                          [qs[i - 1], qs[i]] = [qs[i], qs[i - 1]];
                          set({ questions: qs });
                        }}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Опустить вопрос ${i + 1}`}
                        disabled={i === form.questions.length - 1}
                        onClick={() => {
                          const qs = [...form.questions];
                          [qs[i + 1], qs[i]] = [qs[i], qs[i + 1]];
                          set({ questions: qs });
                        }}
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Удалить вопрос ${i + 1}`}
                        disabled={form.questions.length === 1}
                        onClick={() =>
                          set({
                            questions: form.questions.filter((_, n) => n !== i),
                          })
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <Field label="Текст вопроса">
                    <input
                      required
                      minLength={3}
                      value={q.text}
                      onChange={(e) => question(i, { text: e.target.value })}
                    />
                  </Field>
                  <Field label="Тип вопроса">
                    <select
                      value={q.type}
                      onChange={(e) =>
                        question(i, {
                          type: e.target.value as typeof q.type,
                          options: ["SINGLE", "MULTIPLE"].includes(
                            e.target.value,
                          )
                            ? q.options.length
                              ? q.options
                              : ["", ""]
                            : [],
                        })
                      }
                    >
                      <option value="SINGLE">Один вариант</option>
                      <option value="MULTIPLE">Несколько вариантов</option>
                      <option value="RATING">Оценка</option>
                      <option value="TEXT">Свободный ответ</option>
                      <option value="YESNO">Да / Нет</option>
                    </select>
                  </Field>
                  {["SINGLE", "MULTIPLE"].includes(q.type) && (
                    <div className="options-editor">
                      {q.options.map((o, j) => (
                        <div className="row" key={j}>
                          <input
                            aria-label={`Вариант ${j + 1}`}
                            required
                            value={o}
                            onChange={(e) =>
                              question(i, {
                                options: q.options.map((v, k) =>
                                  k === j ? e.target.value : v,
                                ),
                              })
                            }
                          />
                          <button
                            type="button"
                            className="icon-button"
                            aria-label={`Удалить вариант ${j + 1}`}
                            disabled={q.options.length <= 2}
                            onClick={() =>
                              question(i, {
                                options: q.options.filter((_, k) => k !== j),
                              })
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="text-link"
                        disabled={q.options.length >= 12}
                        onClick={() =>
                          question(i, { options: [...q.options, ""] })
                        }
                      >
                        + Добавить вариант
                      </button>
                    </div>
                  )}
                  {q.type === "RATING" && (
                    <Field label="Максимальная оценка">
                      <input
                        type="number"
                        min={2}
                        max={10}
                        value={q.scale}
                        onChange={(e) =>
                          question(i, { scale: Number(e.target.value) })
                        }
                      />
                    </Field>
                  )}
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) =>
                        question(i, { required: e.target.checked })
                      }
                    />{" "}
                    Обязательный вопрос
                  </label>
                </section>
              ))}
              <button
                type="button"
                className="button"
                disabled={form.questions.length >= 25}
                onClick={() =>
                  set({ questions: [...form.questions, freshQuestion()] })
                }
              >
                <Plus size={16} /> Добавить вопрос
              </button>
            </>
          )}
          {step === 3 && (
            <div className="visibility-options">
              {[
                [
                  "PRIVATE",
                  "Только ваша команда",
                  "Ответы и отчёты доступны только вашей организации.",
                ],
                [
                  "SHARED",
                  "С возможностью поделиться",
                  "Вы отдельно разрешаете публикацию агрегированного отчёта.",
                ],
                [
                  "OPEN",
                  "Открытое исследование",
                  "Агрегированный отчёт доступен компаниям в библиотеке.",
                ],
              ].map(([v, t, d]) => (
                <label
                  className={form.visibility === v ? "selected" : ""}
                  key={v}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={v}
                    checked={form.visibility === v}
                    onChange={() =>
                      set({ visibility: v as ResearchInput["visibility"] })
                    }
                  />
                  <div>
                    <strong>{t}</strong>
                    <p>{d}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          {step === 4 && (
            <>
              <div className="reward-preview">
                ✦ <strong>{form.reward}</strong>
                <span>баллов за участие</span>
              </div>
              <div className="two-grid">
                <Field label="Награда в баллах">
                  <input
                    type="number"
                    required
                    min={1}
                    max={1000}
                    value={form.reward}
                    onChange={(e) => set({ reward: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Время прохождения, мин">
                  <input
                    type="number"
                    required
                    min={1}
                    max={60}
                    value={form.minutes}
                    onChange={(e) => set({ minutes: Number(e.target.value) })}
                  />
                </Field>
              </div>
              <p>
                Внутренние баллы начислятся один раз после сохранения всех
                ответов.
              </p>
            </>
          )}
          {step >= 5 && (
            <>
              <h3>{form.title}</h3>
              <p>{form.description}</p>
              <div className="review-summary">
                <span>
                  {form.brand} · {form.category}
                </span>
                <span>
                  {form.target.minAge}–{form.target.maxAge} лет ·{" "}
                  {form.target.region || "Все регионы"}
                </span>
                <span>
                  {form.visibility} · {form.questions.length} вопросов ·{" "}
                  {form.minutes} мин · +{form.reward} баллов
                </span>
                <span>Подходящих профилей: {audience ?? "—"}</span>
              </div>
              {form.questions.map((q, i) => (
                <div className="review-question" key={i}>
                  <strong>
                    {i + 1}. {q.text}
                  </strong>
                  <small>
                    {q.type}
                    {q.required ? " · Обязательный" : ""}
                  </small>
                  {q.options.length > 0 &&
                    ["SINGLE", "MULTIPLE"].includes(q.type) && (
                      <p>{q.options.join(" / ")}</p>
                    )}
                </div>
              ))}
            </>
          )}
          <ErrorBox message={error} />
          <div className="wizard-actions">
            <button
              type="button"
              className="button"
              disabled={busy || step === 0 || !!savedId}
              onClick={() => setStep(step - 1)}
            >
              Назад
            </button>
            {step < 6 ? (
              <Submit busy={busy}>
                Продолжить <ArrowRight size={16} />
              </Submit>
            ) : (
              <div className="row">
                <button
                  type="button"
                  className="button"
                  disabled={busy}
                  onClick={() => save(false)}
                >
                  Сохранить черновик
                </button>
                <button
                  type="button"
                  className="button primary"
                  disabled={busy}
                  onClick={() => save(true)}
                >
                  {busy ? "Сохраняем…" : "Опубликовать"}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
