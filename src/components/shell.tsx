"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FlaskConical,
  Plus,
  Sparkles,
  MessageCircle,
  Library,
  Settings,
  LogOut,
  ArrowUpRight,
  Headphones,
  Coins,
  Home,
} from "lucide-react";
import { User } from "@/lib/types";
import { api, Logo } from "./ui";
import { RegistrationCelebration } from "./registration-celebration";
import { INFO_SITE_URL } from "@/lib/public-links";
const links = [
  ["/company", "Обзор", LayoutDashboard],
  ["/company/research", "Исследования", FlaskConical],
  ["/company/create", "Создать исследование", Plus],
  ["/company/insights", "Инсайты", Sparkles],
  ["/company/assistant", "AI-ассистент", MessageCircle],
  ["/company/library", "Библиотека", Library],
  ["/company/settings", "Настройки", Settings],
] as const;
export function Shell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const pathname = usePathname(),
    router = useRouter();
  async function logout() {
    await api("auth/logout", "POST", {});
    router.push("/login");
    router.refresh();
  }
  if (user.role === "RESPONDENT")
    return (
      <div className="youth-shell">
        <RegistrationCelebration />
        <header>
          <Logo />
          <a className="about-project-link" href={INFO_SITE_URL}>
            О проекте
          </a>
          <button className="icon-button" aria-label="Выйти" onClick={logout}>
            <LogOut size={20} />
          </button>
        </header>
        <main>{children}</main>
        {!pathname.startsWith("/youth/survey/") && (
          <nav className="youth-nav">
            {[
              ["/youth", "Открывать", Home],
              ["/youth/rewards", "Баллы", Coins],
              ["/youth/settings", "Профиль", Settings],
            ].map(([href, label, Icon]) => (
              <Link
                key={href as string}
                href={href as string}
                className={pathname === href ? "active" : ""}
              >
                <Icon size={21} />
                {label as string}
              </Link>
            ))}
          </nav>
        )}
      </div>
    );
  return (
    <div className="app-shell">
      <RegistrationCelebration />
      <aside className="sidebar">
        <Logo />
        <div className="workspace">
          <span className="org-icon">{user.organization?.name[0] || "V"}</span>
          <div>
            <strong>{user.organization?.name || "Veyra Admin"}</strong>
            <small>Рабочее пространство</small>
          </div>
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          {(user.role === "ADMIN"
            ? [["/admin", "Платформа", LayoutDashboard] as const]
            : links
          ).map(([href, label, Icon]) => (
            <Link
              className={
                pathname === href ||
                (href === "/company/research" &&
                  pathname.startsWith("/company/research/"))
                  ? "active"
                  : ""
              }
              href={href}
              key={href}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a className="about-project-link" href={INFO_SITE_URL}>
            О проекте и компании ↗
          </a>
          <div className="sidebar-note">
            <Headphones size={24} />
            <strong>Начните с вопроса</strong>
            <p>Новый взгляд может изменить всё.</p>
            <Link href="/company/create">
              Спросить аудиторию <ArrowUpRight size={14} />
            </Link>
          </div>
          <button className="user-button" onClick={logout}>
            <span className="user-avatar">{user.name[0]}</span>
            <span>
              <strong>{user.name}</strong>
              <small>Выйти из аккаунта</small>
            </span>
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <span>
            Workspace <span className="muted">/</span>{" "}
            {links.find(([href]) => href === pathname)?.[1] || "Исследование"}
          </span>
          <div>
            <span className="badge green">● Система готова</span>
            <Link className="button small" href="/company/create">
              <Plus size={16} /> Исследование
            </Link>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
