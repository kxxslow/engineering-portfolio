import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    Settings,
    ShieldCheck,
    Users,
    UserRoundCog,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

const nav = [
    { href: '/', label: 'Overview', icon: ShieldCheck, segments: ['/'] },
    {
        href: '/schedule',
        label: 'Bookings',
        icon: CalendarDays,
        segments: ['/schedule', '/bookings'],
    },
    {
        href: '/customers',
        label: 'Customers',
        icon: Users,
        segments: ['/customers'],
    },
    {
        href: '/staff',
        label: 'Staff',
        icon: UserRoundCog,
        segments: ['/staff'],
    },
    {
        href: '/settings',
        label: 'Settings',
        icon: Settings,
        segments: ['/settings'],
    },
];

export function AppShell({
    children,
    context,
}: {
    children: ReactNode;
    context: string;
}) {
    const { url } = usePage();
    const pathname = url.split('?')[0] || '/';
    const statusLabel =
        pathname === '/schedule'
            ? 'Capacity view current'
            : 'Booking rules active';

    return (
        <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
            <div className="flex min-h-screen">
                <aside className="flex w-[248px] shrink-0 flex-col bg-[#0b4bb3] px-6 py-9 text-white">
                    <div>
                        <div className="text-[22px] leading-6 font-extrabold tracking-tight">
                            Bookingly
                        </div>
                        <div className="mt-2 text-sm leading-4 text-blue-100">
                            Operations workspace
                        </div>
                    </div>

                    <div className="mt-10 text-[11px] font-extrabold tracking-[0.08em] text-blue-100 uppercase">
                        Workspace
                    </div>
                    <nav className="mt-6 space-y-3">
                        {nav.map((item) => {
                            const Icon = item.icon;
                            const active =
                                item.segments[0] === '/'
                                    ? pathname === '/'
                                    : item.segments.some((segment) =>
                                          pathname.startsWith(segment),
                                      );

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    style={
                                        active
                                            ? { color: '#0b4bb3' }
                                            : undefined
                                    }
                                    className={cn(
                                        'flex h-[42px] items-center gap-3 rounded-lg px-3 text-sm font-medium text-blue-50 transition hover:bg-white/15 hover:text-white',
                                        active &&
                                            'bg-white shadow-none hover:bg-white',
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto border-t border-blue-300/35 pt-8">
                        <div className="text-sm font-extrabold text-white">
                            Booking rules
                        </div>
                        <p className="mt-3 text-sm leading-5 text-blue-50">
                            Staff and room capacity checks stay visible on every
                            operations path.
                        </p>
                        <div className="mt-5 rounded-lg bg-white/10 p-3 text-xs leading-5 text-blue-50">
                            Staff, room, cancellation, and payment status are
                            recorded with each booking decision.
                        </div>
                    </div>
                </aside>

                <main className="flex min-w-0 flex-1 flex-col bg-[#f4f7fb]">
                    <header className="flex h-[116px] items-start justify-between px-12 pt-8">
                        <div className="flex flex-wrap items-center gap-2">
                            <StatusChip>Staff + room checks</StatusChip>
                            <StatusChip>Accepted bookings recorded</StatusChip>
                            <StatusChip>Reservation holds only</StatusChip>
                        </div>
                        <div className="flex items-center gap-5">
                            <div className="flex h-11 min-w-[270px] items-center justify-center gap-3 rounded-full border border-sky-200 bg-sky-50 px-6 text-xs font-extrabold text-sky-800 shadow-sm">
                                <ShieldCheck className="h-4 w-4 text-sky-500" />
                                {statusLabel}
                            </div>
                        </div>
                    </header>

                    <div className="min-h-0 flex-1 px-12 pb-10">
                        <div className="mx-auto max-w-[1540px]">
                            <div className="sr-only">
                                <h1>{context}</h1>
                            </div>
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

function StatusChip({ children }: { children: ReactNode }) {
    return (
        <span className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white/80 px-4 text-xs font-extrabold text-slate-600 shadow-sm">
            {children}
        </span>
    );
}
