import Link from "next/link";
import { ArrowRight, AudioLines, Sparkles, MoveUpRight } from "lucide-react";
import { Logo } from "@/components/ui";
import { INFO_SITE_URL } from "@/lib/public-links";
export default function Landing() {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <Logo />
        <div>
          <a href={INFO_SITE_URL}>О проекте</a>
          <a href="#how">Как это работает</a>
          <Link href="/login">Войти</Link>
          <Link className="button dark" href="/register?role=COMPANY">
            Для бизнеса <ArrowRight size={16} />
          </Link>
        </div>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="live-dot" /> НОВОЕ ПОКОЛЕНИЕ. НАСТОЯЩИЕ ОТВЕТЫ.
          </span>
          <h1>
            Меньше догадок.
            <br />
            Больше <em>живых</em>
            <br />
            инсайтов.
          </h1>
          <p>
            Узнайте, что выбирает, чувствует и меняет молодая аудитория.
            Спросите напрямую — Veyra поможет услышать главное.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/register?role=COMPANY">
              Создать исследование <ArrowRight size={18} />
            </Link>
            <Link className="text-link" href="/register?role=RESPONDENT">
              Хочу делиться мнением ↗
            </Link>
          </div>
          <div className="hero-note">
            <span className="avatar-stack">
              <b>А</b>
              <b>М</b>
              <b>К</b>
            </span>
            Реальные голоса. Новые точки зрения.
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-label">THE NEXT GENERATION IS SPEAKING.</div>
          <div className="big-orbit">
            <AudioLines size={126} strokeWidth={1} />
          </div>
          <div className="floating-quote">
            <span>ГОЛОС АУДИТОРИИ</span>
            <p>
              «Хочу, чтобы бренд
              <br />
              понимал мой ритм.»
            </p>
            <small>Пример ответа • исследование стиля</small>
          </div>
          <div className="floating-insight">
            <Sparkles size={20} />
            <div>
              <strong>От ответов к решениям</strong>
              <small>Статистика + AI-интерпретация</small>
            </div>
          </div>
          <div className="visual-bottom">
            ASK. LISTEN. UNDERSTAND. <MoveUpRight />
          </div>
        </div>
      </section>
      <div className="landing-strip">
        <span>Для тех, кто создаёт будущее</span>
        <b>BRANDS</b>
        <b>AGENCIES</b>
        <b>PRODUCT TEAMS</b>
        <b>CURIOUS MINDS</b>
      </div>
      <section id="how" className="how">
        <div className="eyebrow">ИССЛЕДОВАНИЯ БЕЗ ЛИШНЕЙ СЛОЖНОСТИ</div>
        <h2>
          Хорошие решения
          <br />
          начинаются с разговора.
        </h2>
        <div className="three-grid">
          {[
            [
              "01",
              "Спросите нужных людей",
              "Выберите аудиторию, добавьте вопросы и опубликуйте исследование.",
            ],
            [
              "02",
              "Дайте каждому голос",
              "Короткий диалог вместо длинной анкеты. Участники получают баллы за своё время.",
            ],
            [
              "03",
              "Увидьте смысл в ответах",
              "Распределения, темы и проверяемые цитаты. Задавайте уточняющие вопросы AI.",
            ],
          ].map(([n, t, d]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="join-band">
        <div>
          <span className="eyebrow">ТВОЁ МНЕНИЕ ИМЕЕТ ЗНАЧЕНИЕ</span>
          <h2>
            Ты выбираешь.
            <br />
            Бренды слушают.
          </h2>
          <p>
            Рассказывай о том, что тебе близко, и собирай баллы. Для участников
            от 12 до 99 лет.
          </p>
        </div>
        <Link href="/register?role=RESPONDENT" className="button dark">
          Присоединиться <ArrowRight size={18} />
        </Link>
      </section>
      <footer>
        <Logo />
        <span>© 2026 Veyra</span>
        <Link href="/privacy">Конфиденциальность</Link>
      </footer>
    </main>
  );
}
