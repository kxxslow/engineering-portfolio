import type {
  HTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes
} from "react";

import { cn } from "@/lib/utils";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn("w-full border-collapse border-y border-slate-300 bg-white text-sm", className)}
      {...props}
    />
  );
}

export function Th({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "border-b border-r border-slate-300 bg-slate-100 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-600 last:border-r-0",
        className
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "border-b border-r border-slate-200 px-4 py-3 align-middle text-slate-700 last:border-r-0",
        className
      )}
      {...props}
    />
  );
}
