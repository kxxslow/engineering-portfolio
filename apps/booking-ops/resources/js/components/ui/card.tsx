import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <section
            className={cn(
                'rounded-lg border border-slate-300 bg-white shadow-[0_18px_40px_-30px_rgba(13,23,41,0.3)]',
                className,
            )}
            {...props}
        />
    );
}

export function CardHeader({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
                className={cn('border-b border-slate-200 px-6 py-5', className)}
            {...props}
        />
    );
}

export function CardContent({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('p-6', className)} {...props} />;
}
