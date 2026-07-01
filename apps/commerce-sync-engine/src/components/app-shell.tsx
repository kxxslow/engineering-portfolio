import Link from "next/link";
import {
  Database,
  GitCompare,
  History,
  PackageCheck,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: PackageCheck },
  { href: "/diff", label: "Diff", icon: GitCompare },
  { href: "/records", label: "Records", icon: Database },
  { href: "/log", label: "Run log", icon: History },
];

export function AppShell({
  children,
  context,
  path,
}: {
  children: ReactNode;
  context: string;
  path: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="flex w-[238px] shrink-0 flex-col border-r border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600">
              commerce-sync
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
              SyncEngine
            </div>
          </div>
          <nav className="space-y-1 px-3 py-4">
            {nav.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/" ? path === "/" : path.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100",
                    active &&
                      "bg-violet-50 text-violet-700 shadow-[inset_3px_0_0_#7c3aed]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-8">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {context}
              </div>
              <div className="mt-1 text-sm font-medium text-slate-700">
                Channel adapter · dry-run planner · run history
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusChip>Dry-run mode</StatusChip>
              <StatusChip>Ledger active</StatusChip>
              <StatusChip>Protected writes</StatusChip>
            </div>
          </header>
          <div className="min-h-0 flex-1 p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

function StatusChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600">
      {children}
    </span>
  );
}
