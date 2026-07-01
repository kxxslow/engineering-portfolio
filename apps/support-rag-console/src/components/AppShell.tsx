"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  FileText,
  MessageSquare,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { usePathname } from "next/navigation";

const navItems: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
}> = [
  {
    href: "/library",
    label: "Source Library",
    icon: FileText,
    isActive: (pathname: string) => pathname === "/library",
  },
  {
    href: "/assistant",
    label: "Answer Review",
    icon: BookOpen,
    isActive: (pathname: string) =>
      pathname === "/assistant" || pathname.startsWith("/answers"),
  },
  {
    href: "/review",
    label: "Decision Log",
    icon: UserCheck,
    isActive: (pathname: string) =>
      pathname === "/review" || pathname.startsWith("/tickets"),
  },
  {
    href: "/evaluations",
    label: "Evaluations",
    icon: ShieldCheck,
    isActive: (pathname: string) => pathname === "/evaluations",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: MessageSquare,
    isActive: (pathname: string) => pathname === "/settings",
  },
];

export function AppShell({
  children,
  eyebrow,
  title,
  meta,
  topbarItems,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  meta?: string;
  topbarItems?: Array<{
    label: string;
    tone?: "blue" | "green" | "amber" | "red" | "muted";
  }>;
}) {
  const pathname = usePathname();
  const statusItems = topbarItems ?? statusForPath(pathname);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brandMark">SR</span>
          <span className="brandName">KnowBase</span>
          <span className="brandMeta">Review workspace</span>
        </div>
        <nav className="nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const isActive = item.isActive(pathname);
            const Icon = item.icon;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={isActive ? "active" : undefined}
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden="true" className="navIcon" size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="main">
        <div className="topbar" aria-label="Workspace controls">
          <div className="topbarContext" aria-label="Review context">
            {statusItems.map((item) => (
              <span
                className={`topbarChip topbarChip-${item.tone ?? "blue"}`}
                key={item.label}
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>
        <header className="pageHeader">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
          </div>
          {meta ? <p className="subtle">{meta}</p> : null}
        </header>
        {children}
      </main>
    </div>
  );
}

function statusForPath(
  pathname: string,
): Array<{ label: string; tone?: "blue" | "green" | "amber" | "red" | "muted" }> {
  if (pathname === "/library") {
    return [
      { label: "Sources ready", tone: "green" },
      { label: "Evidence gaps visible", tone: "amber" },
    ];
  }

  if (pathname === "/assistant" || pathname.startsWith("/answers")) {
    return [
      { label: "Answer review", tone: "blue" },
      { label: "Citation coverage tracked", tone: "green" },
    ];
  }

  if (pathname === "/review" || pathname.startsWith("/tickets")) {
    return [
      { label: "Decision history", tone: "blue" },
      { label: "Audit ready", tone: "green" },
    ];
  }

  if (pathname === "/evaluations") {
    return [
      { label: "Evaluation history", tone: "blue" },
      { label: "Risk visible", tone: "amber" },
    ];
  }

  return [
    { label: "Policy active", tone: "green" },
    { label: "Source rules", tone: "blue" },
  ];
}
