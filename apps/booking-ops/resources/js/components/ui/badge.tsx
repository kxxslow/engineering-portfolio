import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

type BadgeTone = 'neutral' | 'blue' | 'green' | 'amber' | 'red';

const tones: Record<BadgeTone, string> = {
    neutral: 'border-slate-200 bg-slate-50 text-slate-600',
    blue: 'border-sky-200 bg-sky-50 text-sky-800',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    red: 'border-rose-300 bg-rose-50 text-rose-700',
};

export function Badge({
    className,
    tone = 'neutral',
    ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
    return (
        <span
            className={cn(
                'inline-flex h-6 items-center rounded-full border px-3 text-[11px] font-bold tracking-normal',
                tones[tone],
                className,
            )}
            {...props}
        />
    );
}
