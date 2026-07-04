import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    Clock,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { AppShell } from '@/components/app-shell';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    formatConflictKind,
    formatPaymentBoundary,
    formatPaymentStatus,
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

type OperationItem =
    | {
          id: string;
          kind: 'booking';
          booking: Booking;
          date: string;
          startAt: string | null;
          endAt: string | null;
          customerName: string | null;
          requestLabel: string | null;
          resourceName: string | null;
          staffName: string | null;
          status: string;
          signal: string;
          tone: 'blue' | 'green' | 'amber' | 'red' | 'neutral';
      }
    | {
          id: string;
          kind: 'attempt';
          attempt: BookingAttempt;
          date: string;
          startAt: string | null;
          endAt: string | null;
          customerName: string | null;
          requestLabel: string | null;
          resourceName: string | null;
          staffName: string | null;
          status: string;
          signal: string;
          tone: 'blue' | 'green' | 'amber' | 'red' | 'neutral';
      };

export default function Schedule(props: BookingPageProps) {
    const operations = useMemo(() => buildOperations(props), [props]);
    const defaultSelectedId = operations[0]?.id ?? '';
    const [selectedOperationId, setSelectedOperationId] =
        useState(defaultSelectedId);
    const selectedOperation =
        operations.find((item) => item.id === selectedOperationId) ??
        operations[0];

    const [selectedDate, setSelectedDate] = useState(
        selectedOperation?.date ?? getDefaultSelectedDate(props.scheduleDays),
    );
    const selectedDay = useMemo(
        () =>
            props.scheduleDays.find((day) => day.date === selectedDate) ??
            props.scheduleDays[0],
        [props.scheduleDays, selectedDate],
    );

    const capacityHolds = props.bookings.filter((booking) =>
        ['confirmed', 'checked_in'].includes(booking.status),
    );
    const blockedAttempts = props.attempts.filter(
        (attempt) => attempt.status === 'blocked',
    );
    const followUps = operations.filter((item) =>
        ['pending_review', 'payment_hold'].includes(item.status),
    );

    return (
        <AppShell context="Booking operations">
            <Head title="Schedule" />
            <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-5">
                <section className="space-y-5">
                    <Card className="overflow-hidden">
                        <CardHeader className="flex flex-row items-start justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
                                    <CalendarDays className="h-5 w-5 text-[#0b4bb3]" />
                                    Booking operations
                                </div>
                                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                                    Current reservation queue with customer,
                                    staff, resource, and outcome signals in one
                                    scan.
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                                <Badge tone="blue">
                                    {capacityHolds.length} active holds
                                </Badge>
                                <Badge tone="red">
                                    {blockedAttempts.length} blocked
                                </Badge>
                                <Badge tone="amber">
                                    {followUps.length} needs review
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-[1.05fr_1fr_1.22fr_0.7fr_1.35fr] border-b border-slate-300 bg-slate-100 px-5 py-3 text-[11px] font-extrabold tracking-[0.04em] text-slate-500 uppercase">
                                <span>Time / customer</span>
                                <span>Request</span>
                                <span>Staff / resource</span>
                                <span>Status</span>
                                <span>Signal</span>
                            </div>
                            <div className="divide-y divide-slate-300">
                                {operations.slice(0, 8).map((item) => (
                                    <button
                                        type="button"
                                        key={item.id}
                                        onClick={() => {
                                            setSelectedOperationId(item.id);
                                            setSelectedDate(item.date);
                                        }}
                                        className={cn(
                                            'grid min-h-16 w-full grid-cols-[1.05fr_1fr_1.22fr_0.7fr_1.35fr] items-center gap-4 px-5 py-2.5 text-left transition hover:bg-sky-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500',
                                            selectedOperation?.id === item.id &&
                                                'bg-sky-50 shadow-[inset_4px_0_0_#0b4bb3]',
                                            item.tone === 'red' &&
                                                selectedOperation?.id !==
                                                    item.id &&
                                                'bg-rose-50/35',
                                            item.tone === 'amber' &&
                                                selectedOperation?.id !==
                                                    item.id &&
                                                'bg-amber-50/35',
                                        )}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                                                <Clock className="h-4 w-4 shrink-0 text-sky-600" />
                                                <span>
                                                    {formatShortDate(item.date)}{' '}
                                                    {formatTime(item.startAt)}
                                                </span>
                                            </div>
                                            <div className="mt-1 truncate text-sm font-semibold text-slate-700">
                                                {item.customerName ??
                                                    'Unassigned customer'}
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-extrabold text-slate-900">
                                                {item.requestLabel ??
                                                    'Booking request'}
                                            </div>
                                            <div className="mt-1 text-xs font-semibold text-slate-500">
                                                {formatRange(
                                                    item.startAt,
                                                    item.endAt,
                                                )}
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-extrabold text-slate-900">
                                                {item.staffName ??
                                                    'Staff pending'}
                                            </div>
                                            <div className="mt-1 truncate text-xs font-semibold text-slate-500">
                                                {item.resourceName ??
                                                    'Resource pending'}
                                            </div>
                                        </div>
                                        <StatusBadge status={item.status} />
                                        <div className="min-w-0 text-sm leading-5 text-slate-700">
                                            <span className="line-clamp-2">
                                                {item.signal}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <div className="text-base font-extrabold text-slate-900">
                                    Availability overview
                                </div>
                                <p className="mt-1 text-sm text-slate-500">
                                    Compact month view for capacity holds and
                                    stopped conflicts.
                                </p>
                            </div>
                            <Badge tone="blue">July 2026</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-hidden rounded-lg border border-slate-300 bg-slate-300">
                                <div className="grid grid-cols-7 gap-px bg-slate-300 text-[10px] font-extrabold tracking-[0.04em] text-slate-500 uppercase">
                                    {weekdayLabels.map((label) => (
                                        <div
                                            className="bg-slate-50 px-2 py-1.5"
                                            key={label}
                                        >
                                            {label}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-px bg-slate-300">
                                    {props.scheduleDays.map((day) => (
                                        <CalendarCell
                                            key={day.date}
                                            day={day}
                                            isSelected={
                                                selectedDay?.date === day.date
                                            }
                                            onSelect={() => {
                                                setSelectedDate(day.date);
                                                const dayItem =
                                                    operations.find(
                                                        (item) =>
                                                            item.date ===
                                                            day.date,
                                                    );
                                                if (dayItem) {
                                                    setSelectedOperationId(
                                                        dayItem.id,
                                                    );
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <aside>
                    <SelectedOperationPanel
                        item={selectedOperation}
                        day={selectedDay}
                    />
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
    const hasActivity = day.bookings.length > 0 || day.blockedAttempts.length > 0;
    const summary = calendarSummary(day);

    return (
        <button
            type="button"
            aria-pressed={isSelected}
            onClick={onSelect}
            className={cn(
                'h-[54px] overflow-hidden bg-white px-2 py-1.5 text-left transition hover:bg-sky-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500',
                day.muted && 'bg-slate-50 text-slate-400 hover:bg-slate-50',
                isSelected &&
                    'bg-sky-50 shadow-[inset_0_0_0_2px_#0b4bb3]',
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <span
                    className={cn(
                        'text-xs font-extrabold text-slate-800',
                        day.muted && 'text-slate-400',
                    )}
                >
                    {day.label.replace(/^[A-Za-z]+ /, '')}
                </span>
                {hasActivity ? (
                    <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-sky-700">
                        {day.bookings.length + day.blockedAttempts.length}
                    </span>
                ) : null}
            </div>
            <div
                className={cn(
                    'mt-1 truncate text-[11px] font-bold',
                    day.blockedAttempts.length > 0
                        ? 'text-rose-700'
                        : day.bookings.length > 0
                          ? 'text-sky-700'
                          : 'text-slate-500',
                )}
            >
                {summary}
            </div>
        </button>
    );
}

function SelectedOperationPanel({
    item,
    day,
}: {
    item?: OperationItem;
    day?: ScheduleDay;
}) {
    if (!item) {
        return null;
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-xs font-extrabold tracking-[0.04em] text-slate-500 uppercase">
                            Selected operation
                        </div>
                        <div className="mt-1 text-xl font-extrabold text-slate-900">
                            {item.customerName ?? 'Customer pending'}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                            {formatShortDate(item.date)} ·{' '}
                            {formatRange(item.startAt, item.endAt)}
                        </p>
                    </div>
                    <StatusBadge status={item.status} />
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                <DetailRows
                    rows={[
                        {
                            label: 'Request',
                            value: item.requestLabel ?? 'Booking request',
                        },
                        {
                            label: 'Resource',
                            value: item.resourceName ?? 'Resource pending',
                        },
                        {
                            label: 'Staff',
                            value: item.staffName ?? 'Staff pending',
                        },
                        {
                            label: 'Signal',
                            value: item.signal,
                        },
                    ]}
                />

                {item.kind === 'booking' ? (
                    <BookingRecordDetail booking={item.booking} />
                ) : (
                    <AttemptRecordDetail attempt={item.attempt} />
                )}

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                        <CalendarDays className="h-4 w-4 text-sky-600" />
                        {day ? formatDayHeading(day.date) : 'Selected date'}
                    </div>
                    <p className="mt-2 text-sm leading-5 text-slate-600">
                        {day
                            ? `${day.bookings.length} bookings and ${day.blockedAttempts.length} blocked requests are visible in the availability overview.`
                            : 'Select an operation to review date capacity.'}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function BookingRecordDetail({ booking }: { booking: Booking }) {
    return (
        <div className="rounded-lg border border-sky-100 bg-sky-50/40 p-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Booking record
            </div>
            <p className="mt-2 text-sm leading-5 text-slate-700">
                Reservation is recorded with staff/resource assignment and a
                payment status boundary.
            </p>
            <div className="mt-3 text-xs font-semibold text-slate-600">
                Payment status: {formatPaymentStatus(booking.paymentStatus)}
            </div>
            <Link
                className="mt-3 inline-flex text-sm font-extrabold text-sky-700 underline-offset-4 hover:underline"
                href={`/bookings/${booking.id}`}
            >
                Open booking record
            </Link>
        </div>
    );
}

function AttemptRecordDetail({ attempt }: { attempt: BookingAttempt }) {
    return (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Request outcome
            </div>
            <p className="mt-2 text-sm leading-5 text-slate-700">
                {attempt.reason ?? 'Request is waiting for operations review.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                <span>{formatConflictKind(attempt.conflictKind)}</span>
                <span>{formatPaymentBoundary(attempt.paymentBoundary)}</span>
                {attempt.blockingBookingId ? (
                    <Link
                        className="text-sky-700 underline-offset-4 hover:underline"
                        href={`/bookings/${attempt.blockingBookingId}`}
                    >
                        Blocking record
                    </Link>
                ) : null}
            </div>
        </div>
    );
}

function DetailRows({
    rows,
}: {
    rows: Array<{ label: string; value: string }>;
}) {
    return (
        <dl className="grid overflow-hidden rounded-lg border border-slate-300">
            {rows.map((row) => (
                <div
                    className="grid grid-cols-[128px_minmax(0,1fr)] border-b border-slate-200 last:border-b-0"
                    key={row.label}
                >
                    <dt className="bg-slate-50 px-4 py-3 text-xs font-extrabold text-slate-500">
                        {row.label}
                    </dt>
                    <dd className="px-4 py-3 text-sm font-semibold text-slate-800">
                        {row.value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

function buildOperations(props: BookingPageProps): OperationItem[] {
    const bookingItems: OperationItem[] = props.bookings.map((booking) => ({
        id: `booking:${booking.id}`,
        kind: 'booking',
        booking,
        date: isoDate(booking.startAt),
        startAt: booking.startAt,
        endAt: booking.endAt,
        customerName: booking.customerName,
        requestLabel: booking.serviceName,
        resourceName: booking.resourceName,
        staffName: booking.staffName,
        status: booking.status,
        signal:
            booking.status === 'cancelled'
                ? 'Released hold; no longer blocks capacity.'
                : booking.status === 'checked_in'
                  ? 'Customer arrived and capacity remains held.'
                  : 'Confirmed reservation with assignment recorded.',
        tone:
            booking.status === 'cancelled'
                ? 'neutral'
                : booking.status === 'checked_in'
                  ? 'blue'
                  : 'green',
    }));

    const attemptItems: OperationItem[] = props.attempts
        .filter((attempt) => attempt.status !== 'accepted')
        .map((attempt) => ({
            id: `attempt:${attempt.id}`,
            kind: 'attempt',
            attempt,
            date: isoDate(attempt.startAt),
            startAt: attempt.startAt,
            endAt: attempt.endAt,
            customerName: attempt.customerName,
            requestLabel: attempt.serviceName,
            resourceName: attempt.resourceName,
            staffName: attempt.staffName,
            status: attempt.status,
            signal: attempt.reason ?? formatConflictKind(attempt.conflictKind),
            tone:
                attempt.status === 'blocked'
                    ? 'red'
                    : attempt.status === 'pending_review'
                      ? 'amber'
                      : 'neutral',
        }));

    return [...bookingItems, ...attemptItems].sort((a, b) => {
        const dateA = a.startAt ? new Date(a.startAt).getTime() : 0;
        const dateB = b.startAt ? new Date(b.startAt).getTime() : 0;

        return dateA - dateB;
    });
}

function calendarSummary(day: ScheduleDay) {
    if (day.blockedAttempts.length > 0) {
        return `${day.blockedAttempts.length} blocked`;
    }

    if (day.bookings.length > 0) {
        return `${day.bookings.length} holds`;
    }

    return (day.hints ?? [])[0] ?? 'open';
}

function getDefaultSelectedDate(days: ScheduleDay[]) {
    const today = localIsoDate();

    return (
        days.find((day) => day.bookings.length > 0)?.date ??
        days.find((day) => day.blockedAttempts.length > 0)?.date ??
        days.find((day) => day.date === today)?.date ??
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

function isoDate(value: string | null) {
    if (!value) {
        return '';
    }

    return value.slice(0, 10);
}

function formatDayHeading(date: string) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`));
}

function formatShortDate(date: string) {
    if (!date) {
        return 'Unscheduled';
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`));
}
