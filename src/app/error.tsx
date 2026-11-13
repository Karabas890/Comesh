"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="legal">
      <h1>Что-то пошло не так</h1>
      <p>Не удалось загрузить страницу. Попробуйте ещё раз.</p>
      <button className="button primary" onClick={reset}>
        Повторить
      </button>
    </main>
  );
}
