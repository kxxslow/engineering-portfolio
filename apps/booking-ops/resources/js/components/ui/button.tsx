import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const variants: Record<ButtonVariant, string> = {
    primary:
        'border-[#0b4bb3] bg-[#0b4bb3] text-white shadow-sm hover:bg-[#093f9a]',
    secondary:
        'border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50',
    ghost: 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100',
};

export function Button({
    className,
    variant = 'primary',
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
    return (
        <button
            className={cn(
                'inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
                variants[variant],
                className,
            )}
            {...props}
        />
    );
}
