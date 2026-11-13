"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  Coins,
  Sparkles,
  Flag,
} from "lucide-react";
import { api, useApi, Loading, ErrorBox, Empty, Badge, PageTitle } from "./ui";
import { Study, Question } from "@/lib/types";
export function YouthHome() {
  const { data, error, loading } = useApi<{
    balance: number;
    research: Study[];
  }>("youth/feed");
  const [category, setCategory] = useState("Все");
  if (loading) return <Loading />;
  const available =
    data?.research.filter((s) => ["available", "started"].includes(s.state!)) ||
    [];
  const complete = data?.research.filter((s) => s.state === "completed") || [];
  return (
    <>
      <div className="youth-greeting">
        <span className="eyebrow">ТВОЯ ТОЧКА ЗРЕНИЯ ВАЖНА</span>
        <h1>
          Что думаешь
          <br />
          об этом?
        </h1>
        <p>Пара минут. Твоё мнение. Что-то новое.</p>
      </div>
      <Link href="/youth/rewards" className="balance-card">
        <div>
          <span>ТВОИ БАЛЛЫ</span>
          <strong>
            {data?.balance || 0} <small>✦</small>
          </strong>
          <p>За идеи, которыми ты делишься</p>
        </div>
        <Coins size={62} strokeWidth={1} />
      </Link>
      <ErrorBox message={error} />
      <div className="section-heading">
        <h2>Тебе подойдёт</h2>
        <Badge>{available.length} исследований</Badge>
      </div>
      <div className="chips youth-categories">
        {["Все", ...new Set(available.map((s) => s.category))].map((c) => (
          <button
            key={c}
            className={category === c ? "selected" : ""}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="youth-feed">
        {available
          .filter((s) => category === "Все" || s.category === category)
          .map((s) => (
            <Link
              className="youth-study"
              key={s.id}
              href={`/youth/survey/${s.id}`}
            >
              <div className={`study-art art-${s.category.toLowerCase()}`}>
                <Badge>{s.brand}</Badge>
                <div className="orbit" />
                <span className="reward-pill">+{s.reward} ✦</span>
              </div>
              <div className="youth-study-body">
                <small>{s.category}</small>
                <h2>{s.title}</h2>
                <p>{s.description}</p>
                <div className="row">
                  <span>
                    <Clock size={14} /> {s.minutes} мин
                  </span>
                  <strong>
                    {s.state === "started" ? "Продолжить" : "Поехали"}{" "}
                    <ArrowRight size={18} />
                  </strong>
                </div>
              </div>
            </Link>
          ))}
      </div>
      {!available.length && (
        <Empty>
          Ты всё посмотрел! Новые исследования появятся здесь, когда подойдут
          твоему профилю.
        </Empty>
      )}
      {!!complete.length && (
        <section>
          <h2>Уже поделился мнением</h2>
          {complete.map((s) => (
            <div className="completed-study" key={s.id}>
              <span className="completed-icon">
                <Check size={17} />
              </span>
              <div>
                <strong>{s.title}</strong>
                <small>Ответы сохранены</small>
              </div>
              <Badge>+{s.reward} ✦</Badge>
            </div>
          ))}
        </section>
      )}
      {data?.research
        .filter((s) => ["closed", "unavailable"].includes(s.state!))
        .map((s) => (
          <div className="completed-study" key={s.id}>
            <strong>{s.title}</strong>
            <Badge>{s.state === "closed" ? "Закрыто" : "Недоступно"}</Badge>
          </div>
        ))}
    </>
  );
}
type Value = { text?: string; number?: number; optionIds?: string[] };
function answerText(question: Question, value: Value = {}) {
  if (question.type === "TEXT") return value.text?.trim() || "Пропущено";
  if (question.type === "YESNO")
    return value.number === undefined
      ? "Пропущено"
      : value.number
        ? "Да"
        : "Нет";
  if (question.type === "RATING")
    return value.number === undefined
      ? "Пропущено"
      : value.number + " из " + question.scale;
  return (
    question.options
      .filter((o) => value.optionIds?.includes(o.id))
      .map((o) => o.text)
      .join(", ") || "Пропущено"
  );
}
export function Survey({ id }: { id: string }) {
  const { data, error, loading } = useApi<Study>(`youth/survey/${id}`);
  const [index, setIndex] = useState(0),
    [values, setValues] = useState<Record<string, Value>>({}),
    [busy, setBusy] = useState(false),
    [failure, setFailure] = useState(""),
    [reward, setReward] = useState<number | null>(null),
    [started, setStarted] = useState(false);
  const q = data?.questions[index];
  const activeQuestion = useRef<HTMLHeadingElement>(null);
  const completion = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reward !== null) {
      completion.current?.focus();
      return;
    }
    if (started) activeQuestion.current?.focus({ preventScroll: true });
    if (started)
      activeQuestion.current?.scrollIntoView({
        block: "nearest",
        behavior: "instant",
      });
  }, [index, started, reward]);
  async function begin() {
    if (busy) return;
    setBusy(true);
    setFailure("");
    try {
      await api(`youth/survey/${id}/start`, "POST", {});
      setStarted(true);
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function next() {
    if (!q || !data || busy) return;
    setFailure("");
    const v = values[q.id];
    const answered =
      q.type === "TEXT"
        ? !!v?.text?.trim()
        : ["SINGLE", "MULTIPLE"].includes(q.type)
          ? !!v?.optionIds?.length
          : v?.number !== undefined;
    if (q.required && !answered) {
      setFailure("Выбери или напиши ответ, чтобы продолжить");
      return;
    }
    if (index < data.questions.length - 1) {
      setIndex(index + 1);
      return;
    }
    setBusy(true);
    try {
      const r = await api<{ reward: number }>(
        `youth/survey/${id}/complete`,
        "POST",
        {
          answers: Object.entries(values).map(([questionId, v]) => ({
            questionId,
            ...v,
          })),
        },
      );
      setReward(r.reward);
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  if (!data || !q) return null;
  const value = values[q.id] || {};
  const set = (v: Value) => setValues({ ...values, [q.id]: v });
  return (
    <div className="survey survey-chat">
      <Link className="back" href="/youth">
        <ArrowLeft size={16} /> К исследованиям
      </Link>
      <div className="survey-head">
        <Badge>{data.brand}</Badge>
        <span>
          +{data.reward} ✦ · {data.minutes} мин
        </span>
      </div>
      <header className="survey-chat-title">
        <span className="bubble-icon">
          <Sparkles size={21} />
        </span>
        <div>
          <h1>{data.title}</h1>
          <p>Veyra · Чат-опрос</p>
        </div>
      </header>
      <div
        className="progress"
        aria-label="Прогресс опроса"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={data.questions.length}
        aria-valuenow={reward !== null ? data.questions.length : index}
      >
        <div
          style={{
            width: `${((reward !== null ? data.questions.length : index) / data.questions.length) * 100}%`,
          }}
        />
      </div>
      <section className="survey-conversation" aria-label="Переписка опроса">
        <div className="survey-message survey-message-bot">
          <small>VEYRA</small>
          <p>
            {data.description ||
              `Поговорим о продукте «${data.brand}» и твоём опыте.`}
          </p>
          <p>
            Поделись своим мнением — это поможет команде {data.brand} лучше
            понять, что важно для тебя.
          </p>
        </div>
        {!started && (
          <div className="survey-intro">
            <p>
              {data.questions.length} вопросов · около {data.minutes} мин · +
              {data.reward} баллов
            </p>
            <button className="button primary" onClick={begin} disabled={busy}>
              {busy ? "Открываем чат…" : "Начать опрос"}{" "}
              <ArrowRight size={17} />
            </button>
            <p className="muted">
              Ответы отправятся после завершения. До этого их можно изменить.
            </p>
            <ErrorBox message={failure} />
          </div>
        )}
        {started &&
          data.questions
            .slice(0, reward !== null ? data.questions.length : index)
            .map((question, position) => (
              <div className="survey-exchange" key={question.id}>
                <div className="survey-message survey-message-bot">
                  <small>Вопрос {position + 1}</small>
                  <p>{question.text}</p>
                </div>
                <div className="survey-message survey-message-user">
                  <small>Ты</small>
                  <p>{answerText(question, values[question.id])}</p>
                  {reward === null && (
                    <button
                      className="survey-edit"
                      onClick={() => {
                        setIndex(position);
                        setFailure("");
                      }}
                      disabled={busy}
                      aria-label={`Изменить ответ на вопрос ${position + 1}`}
                    >
                      Изменить
                    </button>
                  )}
                </div>
              </div>
            ))}
        {started && reward === null && (
          <>
            <div className="question-bubble" key={q.id}>
              <div className="survey-message survey-message-bot">
                <small>
                  Вопрос {index + 1} из {data.questions.length} ·{" "}
                  {q.required ? "Обязательный" : "Можно пропустить"}
                </small>
                <h2 ref={activeQuestion} tabIndex={-1}>
                  {q.text}
                </h2>
              </div>
              <fieldset
                className="survey-composer"
                disabled={busy}
                aria-label="Твой ответ на текущий вопрос"
              >
                {["SINGLE", "MULTIPLE"].includes(q.type) && (
                  <div className="answer-options">
                    {q.options.map((o, i) => (
                      <button
                        key={o.id}
                        className={
                          value.optionIds?.includes(o.id) ? "selected" : ""
                        }
                        aria-pressed={value.optionIds?.includes(o.id) || false}
                        onClick={() =>
                          set({
                            optionIds:
                              q.type === "SINGLE"
                                ? [o.id]
                                : value.optionIds?.includes(o.id)
                                  ? value.optionIds.filter((x) => x !== o.id)
                                  : [...(value.optionIds || []), o.id],
                          })
                        }
                      >
                        <span>{String.fromCharCode(65 + i)}</span>
                        {o.text}
                        {value.optionIds?.includes(o.id) && <Check size={18} />}
                      </button>
                    ))}
                  </div>
                )}
                {q.type === "TEXT" && (
                  <>
                    <textarea
                      aria-label="Твой ответ"
                      maxLength={2000}
                      placeholder="Расскажи своими словами…"
                      value={value.text || ""}
                      onChange={(e) => set({ text: e.target.value })}
                    />
                    <small>
                      Не указывай имена, контакты и другие личные данные.
                    </small>
                  </>
                )}
                {q.type === "RATING" && (
                  <div className="rating-options">
                    {Array.from({ length: q.scale }, (_, i) => (
                      <button
                        key={i}
                        aria-pressed={value.number === i + 1}
                        className={value.number === i + 1 ? "selected" : ""}
                        onClick={() => set({ number: i + 1 })}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
                {q.type === "YESNO" && (
                  <div className="answer-options">
                    {[
                      [1, "Да"],
                      [0, "Нет"],
                    ].map(([n, t]) => (
                      <button
                        key={n}
                        aria-pressed={value.number === n}
                        className={value.number === n ? "selected" : ""}
                        onClick={() => set({ number: n as number })}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </fieldset>
            </div>
            <ErrorBox message={failure} />
            <div className="survey-controls">
              <button
                className="button"
                disabled={!index || busy}
                onClick={() => {
                  setIndex(index - 1);
                  setFailure("");
                }}
              >
                Назад
              </button>
              <button
                className="button primary"
                disabled={busy || !started}
                onClick={next}
              >
                {busy
                  ? "Сохраняем…"
                  : index === data.questions.length - 1
                    ? "Завершить"
                    : "Отправить"}
                <ArrowRight size={17} />
              </button>
            </div>
          </>
        )}
        {reward !== null && (
          <div className="survey-success" ref={completion} tabIndex={-1}>
            <div className="success-orb">
              <Check size={48} />
            </div>
            <span className="eyebrow">ТЫ ПОМОГ СТАТЬ ЛУЧШЕ</span>
            <h1>Вот это вклад.</h1>
            <p>Спасибо! Ответы сохранены.</p>
            <strong>+{reward} ✦</strong>
            <p>Баллы уже на твоём счёте.</p>
            <Link className="button primary" href="/youth/rewards">
              Посмотреть баллы <ArrowRight size={18} />
            </Link>
            <Link className="text-link" href="/youth">
              Вернуться к исследованиям
            </Link>
          </div>
        )}
      </section>
      <button
        className="report-button"
        onClick={async () => {
          const reason = prompt(
            "Что не так с исследованием? Минимум 5 символов.",
          );
          if (!reason) return;
          try {
            await api(`youth/survey/${id}/flag`, "POST", { reason });
            setFailure("Жалоба отправлена модератору.");
          } catch (e) {
            setFailure((e as Error).message);
          }
        }}
      >
        <Flag size={13} /> Сообщить о проблеме
      </button>
    </div>
  );
}
export function Rewards() {
  const { data, error, loading } =
    useApi<
      { id: string; amount: number; description: string; createdAt: string }[]
    >("youth/rewards");
  const feed = useApi<{ balance: number }>("youth/feed");
  return (
    <>
      <PageTitle
        eyebrow="ТВОЙ ВКЛАД"
        title="Мнения ценятся."
        description="Каждое завершённое исследование — новые баллы."
      />
      <div className="balance-card">
        <div>
          <span>ТВОЙ БАЛАНС</span>
          <strong>{feed.data?.balance || 0} ✦</strong>
          <p>Внутренние баллы Veyra</p>
        </div>
        <Coins size={58} />
      </div>
      <h2>История начислений</h2>
      <ErrorBox message={error} />
      {loading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty>Первое начисление ждёт тебя после исследования.</Empty>
      ) : (
        data.map((t) => (
          <div key={t.id} className="ledger-row">
            <div>
              <strong>{t.description}</strong>
              <small>{new Date(t.createdAt).toLocaleString("ru")}</small>
            </div>
            <b>+{t.amount} ✦</b>
          </div>
        ))
      )}
      <p className="muted">
        Баллы не являются деньгами. Обмен на подарки и выплаты пока недоступен.
      </p>
    </>
  );
}
