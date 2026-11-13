import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Veyra — следующее поколение, без догадок",
  description:
    "Исследования молодёжной аудитории. Живые ответы. Понятные инсайты.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
