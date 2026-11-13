import Link from "next/link";
export default function NotFound() {
  return (
    <main className="legal">
      <h1>Здесь пока тихо.</h1>
      <p>Страница не найдена.</p>
      <Link className="button primary" href="/">
        На главную
      </Link>
    </main>
  );
}
