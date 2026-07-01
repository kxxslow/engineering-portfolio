import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Banknote,
    CalendarCheck2,
    CheckCircle2,
    Clock,
    DoorOpen,
    ShieldCheck,
    Users,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, Td, Th } from '@/components/ui/table';
import {
    formatConflictKind,
    formatDate,
    formatPaymentBoundary,
    formatPaymentStatus,
    formatRange,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
    Booking,
    BookingAttempt,
    BookingPageProps,
    SchedulingConstraint,
} from '@/types/booking';

export function MetricsCards({ metrics }: Pick<BookingPageProps, 'metrics'>) {
    const cards = [
        {
            label: 'Active bookings',
            value: metrics.activeBookings,
            detail: 'Confirmed or checked-in capacity holds',
            icon: CalendarCheck2,
            tone: 'text-sky-600',
        },
        {
            label: 'Blocked requests',
            value: metrics.blockedAttempts,
            detail: 'Conflicts stopped before confirmation',
            icon: AlertTriangle,
            tone: 'text-rose-600',
        },
        {
            label: 'Released holds',
            value: metrics.releasedByCancellation,
            detail: 'Cancelled bookings do not block capacity',
            icon: CheckCircle2,
            tone: 'text-emerald-600',
        },
    ];

    return (
        <div className="grid grid-cols-3 gap-4">
            {cards.map((card) => {
                const Icon = card.icon;

                return (
                    <Card key={card.label}>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-xs font-bold tracking-[0.04em] text-slate-500 uppercase">
                                        {card.label}
                                    </div>
                                    <div className="mt-2 text-3xl leading-8 font-extrabold text-slate-700">
                                        {card.value}
                                    </div>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                                    <Icon className={`h-5 w-5 ${card.tone}`} />
                                </div>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-slate-600">
                                {card.detail}
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

export function BookingTable({
    bookings,
    compact = false,
    description = 'Active rows determine staff and room availability.',
    highlightBookingId = null,
    showDetailAction = false,
}: {
    bookings: Booking[];
    compact?: boolean;
    description?: string;
    highlightBookingId?: string | null;
    showDetailAction?: boolean;
}) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <div className="text-sm font-semibold text-slate-950">
                        Reservation ledger
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                        {description}
                    </p>
                </div>
                <Badge tone="blue">{bookings.length} rows</Badge>
            </CardHeader>
            <div className="overflow-x-auto">
                <Table>
                    <thead>
                        <tr>
                            <Th>Booking</Th>
                            <Th>Customer</Th>
                            <Th>Service</Th>
                            <Th>Time</Th>
                            <Th>Staff / resource</Th>
                            <Th>Status</Th>
                            {showDetailAction && <Th>Detail</Th>}
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.length > 0 ? (
                            bookings.map((booking) => (
                                <tr
                                    key={booking.id}
                                    className={
                                        booking.id === highlightBookingId
                                            ? '[&>td]:border-sky-300 [&>td]:bg-sky-50 [&>td:first-child]:border-l-4 [&>td:first-child]:border-l-[#0b4bb3]'
                                            : undefined
                                    }
                                >
                                    <Td>
                                        <Link
                                            className="font-semibold text-sky-700"
                                            href={`/bookings/${booking.id}`}
                                        >
                                            {booking.id}
                                        </Link>
                                        <div className="mt-1 text-xs text-slate-500">
                                            {formatDate(booking.startAt)}
                                        </div>
                                    </Td>
                                    <Td>
                                        <div className="font-medium text-slate-900">
                                            {booking.customerName}
                                        </div>
                                    </Td>
                                    <Td
                                        className={
                                            compact
                                                ? 'max-w-[180px]'
                                                : undefined
                                        }
                                    >
                                        <div className="font-medium text-slate-800">
                                            {booking.serviceName}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            {formatPaymentStatus(
                                                booking.paymentStatus,
                                            )}
                                        </div>
                                    </Td>
                                    <Td>
                                        <div className="font-medium text-slate-800">
                                            {formatRange(
                                                booking.startAt,
                                                booking.endAt,
                                            )}
                                        </div>
                                    </Td>
                                    <Td>
                                        <div className="font-medium text-slate-800">
                                            {booking.staffName}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            {booking.resourceName}
                                        </div>
                                    </Td>
                                    <Td>
                                        <StatusBadge status={booking.status} />
                                    </Td>
                                    {showDetailAction && (
                                        <Td>
                                            <Link
                                                className="text-xs font-semibold text-sky-700 underline-offset-4 hover:underline"
                                                href={`/bookings/${booking.id}`}
                                            >
                                                Open record
                                            </Link>
                                        </Td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <Td
                                    className="text-center text-sm text-slate-500"
                                    colSpan={showDetailAction ? 7 : 6}
                                >
                                    No reservation history recorded yet.
                                </Td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>
        </Card>
    );
}

export function AttemptRail({
    attempts,
    title = 'Request audit trail',
    description = 'Accepted, blocked, and incomplete requests stay visible for review.',
}: Pick<BookingPageProps, 'attempts'> & {
    title?: string;
    description?: string;
}) {
    return (
        <Card>
            <CardHeader>
                <div className="text-sm font-semibold text-slate-950">
                    {title}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                    {description}
                </p>
            </CardHeader>
            <CardContent className="space-y-3">
                {attempts.map((attempt) => (
                    <div
                        key={attempt.id}
                        className={cn(
                            'rounded-lg border bg-slate-50 p-3',
                            attempt.status === 'blocked'
                                ? 'border-l-4 border-rose-200 border-l-rose-500 bg-rose-50/60'
                                : attempt.status === 'accepted'
                                  ? 'border-l-4 border-emerald-200 border-l-emerald-500 bg-emerald-50/60'
                                  : 'border-slate-200',
                        )}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-slate-900">
                                {attempt.customerName}
                            </div>
                            <StatusBadge status={attempt.status} />
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-700">
                            {attempt.reason}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-slate-500">
                            <span>
                                {formatConflictKind(attempt.conflictKind)}
                            </span>
                            <span>
                                {attempt.blockingBookingId ?? 'no blocker'}
                            </span>
                            <span>
                                {formatPaymentBoundary(attempt.paymentBoundary)}
                            </span>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export function ProofRail({
    constraints,
}: {
    constraints: SchedulingConstraint[];
}) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <ShieldCheck className="h-4 w-4 text-sky-600" />
                    Booking rules
                </div>
                <p className="mt-1 text-xs text-slate-500">
                    These rules determine whether a request can be accepted.
                </p>
            </CardHeader>
            <CardContent className="space-y-3">
                <ProofItem
                    icon={<Users className="h-4 w-4 text-sky-600" />}
                    title="Staff overlap"
                    body="A confirmed or checked-in booking blocks the same staff member."
                />
                <ProofItem
                    icon={<DoorOpen className="h-4 w-4 text-sky-600" />}
                    title="Resource overlap"
                    body="Rooms and stations are capacity one. Cancelled rows release the hold."
                />
                <ProofItem
                    icon={<Clock className="h-4 w-4 text-sky-600" />}
                    title="Constraint window"
                    body={`${constraints[0]?.bookingWindowStart ?? '08:00'}-${constraints[0]?.bookingWindowEnd ?? '17:00'} with service-specific duration and buffer.`}
                />
                <ProofItem
                    icon={<Banknote className="h-4 w-4 text-slate-500" />}
                    title="Payment boundary"
                    body="Payment status is recorded for operations review; no payment collection happens here."
                />
            </CardContent>
        </Card>
    );
}

function ProofItem({
    icon,
    title,
    body,
}: {
    icon: ReactNode;
    title: string;
    body: string;
}) {
    return (
        <div className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <div className="mt-0.5">{icon}</div>
            <div>
                <div className="text-sm font-semibold text-slate-900">
                    {title}
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{body}</p>
            </div>
        </div>
    );
}
