import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Tone = "neutral" | "purple" | "green" | "amber" | "red" | "blue";

const tones: Record<Tone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
  purple: "border-violet-200 bg-violet-50 text-violet-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-rose-200 bg-rose-50 text-rose-700",
  blue: "border-sky-200 bg-sky-50 text-sky-700"
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold uppercase tracking-[0.02em]",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
