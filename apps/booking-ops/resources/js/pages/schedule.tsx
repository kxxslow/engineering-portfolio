import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, CalendarDays, Clock } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AppShell } from '@/components/app-shell';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    formatConflictKind,
    formatPaymentBoundary,
    formatRange,
    formatTime,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
    Booking,
    BookingAttempt,
    BookingPageProps,
    ScheduleDay,
} from '@/types/booking';

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Schedule(props: BookingPageProps) {
    const capacityHolds = props.bookings.filter((booking) =>
        ['confirmed', 'checked_in'].includes(booking.status),
    );
    const blockedAttempts = props.attempts.filter(
        (attempt) => attempt.status === 'blocked',
    );
    const defaultSelectedDate = getDefaultSelectedDate(props.scheduleDays);
    const [selectedDate, setSelectedDate] = useState(defaultSelectedDate);
    const selectedDay = useMemo(
        () =>
            props.scheduleDays.find((day) => day.date === selectedDate) ??
            props.scheduleDays.find((day) => day.date === defaultSelectedDate) ??
            props.scheduleDays[0],
        [defaultSelectedDate, props.scheduleDays, selectedDate],
    );

    return (
        <AppShell context="Schedule board">
            <Head title="Schedule" />
            <div className="grid grid-cols-[minmax(0,1fr)_440px] gap-5">
                <Card className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
                                <CalendarDays className="h-5 w-5 text-[#0b4bb3]" />
                                July 2026 availability
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                                Live capacity, holds, and rejected overlaps for
                                the booking operations queue.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge tone="blue">
                                {capacityHolds.length} capacity holds
                            </Badge>
                            <Badge tone="red" className="gap-1">
                                <span>{blockedAttempts.length}</span>
                                <span>
                                    {blockedAttempts.length === 1
                                        ? 'conflict blocked'
                                        : 'conflicts blocked'}
                                </span>
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-300">
                            <div className="grid grid-cols-7 gap-px bg-slate-300 text-xs font-extrabold tracking-[0.04em] text-slate-500 uppercase">
                                {weekdayLabels.map((label) => (
                                    <div
                                        className="bg-slate-50 px-3 py-2"
                                        key={label}
                                    >
                                        {label}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 auto-rows-[132px] gap-px bg-slate-300">
                                {props.scheduleDays.map((day) => (
                                    <CalendarCell
                                        key={day.date}
                                        day={day}
                                        isSelected={selectedDay?.date === day.date}
                                        onSelect={() => setSelectedDate(day.date)}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-slate-700">
                            <span>
                                <span className="font-extrabold text-slate-900">
                                    Booking rules applied:
                                </span>{' '}
                                staff, room, and cancellation state are checked
                                before a reservation is recorded.
                            </span>
                            <Link
                                className="shrink-0 text-xs font-extrabold text-sky-700 underline-offset-4 hover:underline"
                                href="/settings"
                            >
                                View Settings
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <aside className="space-y-5">
                    <SelectedDayPanel day={selectedDay} />
                </aside>
            </div>
        </AppShell>
    );
}

function CalendarCell({
    day,
    isSelected,
    onSelect,
}: {
    day: ScheduleDay;
    isSelected: boolean;
    onSelect: () => void;
}) {
    const visibleBookings = day.bookings.slice(0, 2);
    const overflowCount = Math.max(day.bookings.length - visibleBookings.length, 0);
    const quietHint =
        day.bookings.length === 0 ? ((day.hints ?? [])[0] ?? null) : null;
    const hasFooter =
        overflowCount > 0 || day.blockedAttempts.length > 0 || quietHint !== null;

    return (
        <button
            type="button"
            aria-pressed={isSelected}
            onClick={onSelect}
            className={cn(
                'grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-1.5 overflow-hidden bg-white p-2.5 text-left transition hover:bg-sky-50/40',
                day.muted && 'bg-slate-50 text-slate-400 hover:bg-slate-50',
                day.active && !isSelected && 'bg-sky-50/40',
                day.bookings.length > 0 &&
                    !day.active &&
                    !isSelected &&
                    'bg-white',
                isSelected && 'bg-sky-50 shadow-[inset_0_0_0_2px_#0b4bb3]',
            )}
        >
            <div className="flex min-w-0 items-center justify-between gap-2">
                <div
                    className={cn(
                        'min-w-0 truncate text-sm font-extrabold text-slate-800',
                        day.muted && 'text-slate-400',
                    )}
                >
                    {day.label}
                </div>
                {day.bookings.length > 0 ? (
                    <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-sky-700">
                        {day.bookings.length}
                    </span>
                ) : null}
            </div>
            <div className="min-h-0 space-y-1 overflow-hidden">
                {visibleBookings.map((booking) => (
                    <BookingSummaryChip key={booking.id} booking={booking} />
                ))}
            </div>
            <div className="min-h-[22px] overflow-hidden">
                {hasFooter ? (
                    <div className="flex min-w-0 items-center gap-1 overflow-hidden">
                        {quietHint !== null ? (
                            <span
                                className={cn(
                                    'min-w-0 truncate rounded-sm border px-1.5 py-0.5 text-left text-[11px] font-semibold leading-4',
                                    chipTone(day.tone),
                                )}
                            >
                                {quietHint}
                            </span>
                        ) : null}
                        {overflowCount > 0 ? (
                            <span className="inline-flex shrink-0 items-center rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-extrabold leading-4 whitespace-nowrap text-slate-600">
                                +{overflowCount}
                            </span>
                        ) : null}
                        {day.blockedAttempts.length > 0 ? (
                            <span className="inline-flex min-w-0 shrink items-center rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-extrabold leading-4 whitespace-nowrap text-rose-700">
                                {day.blockedAttempts.length} blocked
                            </span>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </button>
    );
}

function BookingSummaryChip({ booking }: { booking: Booking }) {
    return (
        <span
            className={cn(
                'block w-full truncate rounded-md border px-2 py-0.5 text-[11px] font-extrabold leading-4 whitespace-nowrap',
                booking.status === 'cancelled'
                    ? 'border-slate-200 bg-slate-100 text-slate-500'
                    : booking.status === 'checked_in'
                      ? 'border-sky-300 bg-sky-100 text-sky-900'
                      : 'border-sky-200 bg-blue-50 text-[#0b3b8f]',
            )}
            title={`${booking.serviceName ?? 'Booking'} · ${booking.staffName ?? 'Unassigned staff'} · ${booking.resourceName ?? 'Unassigned room'}`}
        >
            {compactTime(booking.startAt)} {compactServiceName(booking.serviceName)}
        </span>
    );
}

function SelectedDayPanel({ day }: { day?: ScheduleDay }) {
    if (!day) {
        return null;
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-xs font-extrabold tracking-[0.04em] text-slate-500 uppercase">
                            Selected day
                        </div>
                        <div className="mt-1 text-xl font-extrabold text-slate-900">
                            {formatDayHeading(day.date)}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                            Reservations and blocked requests for this date.
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Badge tone="blue" className="whitespace-nowrap">
                            {day.bookings.length}{' '}
                            {day.bookings.length === 1 ? 'booking' : 'bookings'}
                        </Badge>
                        {day.blockedAttempts.length > 0 ? (
                            <Badge tone="red" className="whitespace-nowrap">
                                {day.blockedAttempts.length} blocked
                            </Badge>
                        ) : null}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <section>
                    <div className="mb-2 flex items-center justify-between">
                        <div className="text-sm font-extrabold text-slate-900">
                            Reservations
                        </div>
                        <span className="text-xs font-semibold text-slate-500">
                            {day.bookings.length} records
                        </span>
                    </div>
                    <div className="space-y-3">
                        {day.bookings.length > 0 ? (
                            day.bookings.map((booking) => (
                                <SelectedBooking
                                    key={booking.id}
                                    booking={booking}
                                />
                            ))
                        ) : (
                            <EmptyDayMessage>
                                No reservations are recorded for this day.
                            </EmptyDayMessage>
                        )}
                    </div>
                </section>

                <section>
                    <div className="mb-2 flex items-center justify-between">
                        <div className="text-sm font-extrabold text-slate-900">
                            Blocked requests
                        </div>
                        <span className="text-xs font-semibold text-slate-500">
                            {day.blockedAttempts.length} stopped
                        </span>
                    </div>
                    <div className="space-y-3">
                        {day.blockedAttempts.length > 0 ? (
                            day.blockedAttempts.map((attempt) => (
                                <SelectedBlockedAttempt
                                    key={attempt.id}
                                    attempt={attempt}
                                />
                            ))
                        ) : (
                            <EmptyDayMessage>
                                No blocked requests for this day.
                            </EmptyDayMessage>
                        )}
                    </div>
                </section>
            </CardContent>
        </Card>
    );
}

function SelectedBooking({ booking }: { booking: Booking }) {
    return (
        <div
            className={cn(
                'rounded-lg border bg-white p-3',
                booking.status === 'cancelled'
                    ? 'border-slate-200 bg-slate-50'
                    : 'border-sky-100',
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                        <Clock className="h-4 w-4 text-sky-600" />
                        {formatRange(booking.startAt, booking.endAt)}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">
                        {booking.serviceName}
                    </div>
                </div>
                <StatusBadge status={booking.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs leading-5 text-slate-600">
                <div>
                    <span className="font-semibold text-slate-500">
                        Customer
                    </span>
                    <div className="font-semibold text-slate-900">
                        {booking.customerName}
                    </div>
                </div>
                <div>
                    <span className="font-semibold text-slate-500">Staff</span>
                    <div className="font-semibold text-slate-900">
                        {booking.staffName}
                    </div>
                </div>
                <div className="col-span-2">
                    <span className="font-semibold text-slate-500">
                        Resource
                    </span>
                    <div className="font-semibold text-slate-900">
                        {booking.resourceName}
                    </div>
                </div>
            </div>
            <Link
                className="mt-3 inline-flex text-xs font-semibold text-sky-700 underline-offset-4 hover:underline"
                href={`/bookings/${booking.id}`}
            >
                Open record
            </Link>
        </div>
    );
}

function SelectedBlockedAttempt({ attempt }: { attempt: BookingAttempt }) {
    return (
        <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-3">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                        {attempt.customerName}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-600">
                        {formatRange(attempt.startAt, attempt.endAt)} ·{' '}
                        {attempt.serviceName}
                    </div>
                </div>
                <StatusBadge status={attempt.status} />
            </div>
            <p className="mt-2 text-sm leading-5 text-slate-700">
                {attempt.reason}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                <span>{formatConflictKind(attempt.conflictKind)}</span>
                {attempt.blockingBookingId ? (
                    <Link
                        className="text-sky-700 underline-offset-4 hover:underline"
                        href={`/bookings/${attempt.blockingBookingId}`}
                    >
                        {attempt.blockingBookingId}
                    </Link>
                ) : (
                    <span>No related booking</span>
                )}
                <span>{formatPaymentBoundary(attempt.paymentBoundary)}</span>
            </div>
        </div>
    );
}

function EmptyDayMessage({ children }: { children: string }) {
    return (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm leading-5 text-slate-500">
            {children}
        </div>
    );
}

function chipTone(tone?: string | null) {
    if (tone === 'red') {
        return 'border-rose-200 bg-rose-50 text-rose-700';
    }

    if (tone === 'amber') {
        return 'border-amber-200 bg-amber-50 text-amber-800';
    }

    if (tone === 'green') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    }

    if (tone === 'aqua') {
        return 'border-sky-200 bg-sky-50 text-sky-800';
    }

    return 'border-transparent bg-transparent text-slate-500';
}

function getDefaultSelectedDate(days: ScheduleDay[]) {
    const today = localIsoDate();

    return (
        days.find((day) => day.bookings.length > 0)?.date ??
        days.find((day) => day.blockedAttempts.length > 0)?.date ??
        days.find((day) => day.date === today)?.date ??
        days.find(
            (day) => day.bookings.length > 0 || day.blockedAttempts.length > 0,
        )?.date ??
        days[0]?.date ??
        ''
    );
}

function localIsoDate() {
    const date = new Date();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;
}

function formatDayHeading(date: string) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`));
}

function compactServiceName(serviceName: string | null) {
    if (!serviceName) {
        return 'Booking';
    }

    const labels: Record<string, string> = {
        'Planning consultation': 'Planning',
        'Planning consult': 'Planning',
        'Service setup': 'Setup',
        'Service setup block': 'Setup',
        'Customer onboarding': 'Onboarding',
    };

    return labels[serviceName] ?? serviceName.split(' ').slice(0, 2).join(' ');
}

function compactTime(value: string | null) {
    return formatTime(value).replace(/\s?(AM|PM)$/, '');
}
