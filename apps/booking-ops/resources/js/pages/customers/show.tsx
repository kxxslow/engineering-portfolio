import { Head, Link } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    ShieldCheck,
    UserCircle,
} from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { BookingTable, ProofRail } from '@/components/booking-widgets';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatConflictKind, formatRange } from '@/lib/format';
import type { BookingPageProps } from '@/types/booking';

export default function CustomerDetail(props: BookingPageProps) {
    const customer = props.selectedCustomer;
    const nextBooking = customer?.bookings[0];

    return (
        <AppShell context="Customer detail">
            <Head title={customer?.name ?? 'Customer'} />
            <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-5">
                <div className="space-y-5">
                    {props.flash?.customerCreated ? (
                        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                            <CheckCircle2 className="h-4 w-4" />
                            {props.flash.customerCreated}
                        </div>
                    ) : null}
                    <Card>
                        <CardContent className="flex items-start justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                                    <UserCircle className="h-7 w-7" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                                            {customer?.name}
                                        </h1>
                                        <Badge tone="blue">
                                            {customer?.tier}
                                        </Badge>
                                    </div>
                                    <div className="mt-1 text-sm text-slate-500">
                                        {customer?.email}
                                        {customer?.phone
                                            ? ` · ${customer.phone}`
                                            : ''}
                                    </div>
                                    <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                                        {customer?.notes ??
                                            'No operations note recorded yet.'}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <MiniMetric
                                    label="Visits"
                                    value={customer?.visitCount ?? 0}
                                />
                                <MiniMetric
                                    label="Recorded value"
                                    value={customer?.lifetimeValue ?? '$0.00'}
                                />
                            </div>
                        </CardContent>
                    </Card>
                    <BookingTable
                        bookings={customer?.bookings ?? []}
                        description="Customer-linked reservations open their source booking records."
                        showDetailAction
                    />
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                                    <ClipboardList className="h-4 w-4 text-sky-600" />
                                    Request history
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                    Accepted and blocked booking requests stay
                                    attached to this customer.
                                </p>
                            </div>
                            <Badge tone="blue">
                                {customer?.attempts.length ?? 0} attempts
                            </Badge>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {customer && customer.attempts.length > 0 ? (
                                customer.attempts.map((attempt) => (
                                    <div
                                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                        key={attempt.id}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="font-semibold text-slate-950">
                                                    {attempt.serviceName ??
                                                        'Booking request'}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-500">
                                                    {formatRange(
                                                        attempt.startAt,
                                                        attempt.endAt,
                                                    )}{' '}
                                                    · {attempt.staffName} ·{' '}
                                                    {attempt.resourceName}
                                                </div>
                                            </div>
                                            <StatusBadge
                                                status={attempt.status}
                                            />
                                        </div>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            {attempt.reason}
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                                            <span>
                                                Check:{' '}
                                                {formatConflictKind(
                                                    attempt.conflictKind,
                                                )}
                                            </span>
                                            {attempt.attemptedBookingId ? (
                                                <Link
                                                    className="font-semibold text-sky-700 underline-offset-4 hover:underline"
                                                    href={`/bookings/${attempt.attemptedBookingId}`}
                                                >
                                                    Booking{' '}
                                                    {
                                                        attempt.attemptedBookingId
                                                    }
                                                </Link>
                                            ) : null}
                                            {attempt.blockingBookingId ? (
                                                <Link
                                                    className="font-semibold text-sky-700 underline-offset-4 hover:underline"
                                                    href={`/bookings/${attempt.blockingBookingId}`}
                                                >
                                                    Blocked by{' '}
                                                    {attempt.blockingBookingId}
                                                </Link>
                                            ) : null}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                                    No booking requests recorded for this
                                    customer yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-5">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                                <CalendarDays className="h-4 w-4 text-sky-600" />
                                Next booking
                            </div>
                        </CardHeader>
                        <CardContent>
                            {nextBooking ? (
                                <>
                                    <div className="text-lg font-semibold text-slate-950">
                                        {nextBooking.serviceName}
                                    </div>
                                    <div className="mt-2 text-sm text-slate-500">
                                        {nextBooking.staffName} ·{' '}
                                        {nextBooking.resourceName}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-sm leading-6 text-slate-600">
                                        No booking is scheduled yet. Use the
                                        Overview request form to check capacity
                                        and create the first reservation.
                                    </div>
                                    <Link
                                        className="mt-4 inline-flex text-sm font-semibold text-sky-700 underline-offset-4 hover:underline"
                                        href="/"
                                    >
                                        Open booking request
                                    </Link>
                                </>
                            )}
                            <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-3 text-sm leading-6 text-sky-900">
                                Staff and room assignment is checked before any
                                new booking is accepted.
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                                <ShieldCheck className="h-4 w-4 text-sky-600" />
                                Customer rules
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
                            <p>
                                Priority customer context is visible without
                                bypassing conflict policy.
                            </p>
                            <p>
                                Payment status stays visible for operations
                                review without overriding booking rules.
                            </p>
                        </CardContent>
                    </Card>
                    <ProofRail constraints={props.constraints} />
                </div>
            </div>
        </AppShell>
    );
}

function MiniMetric({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="min-w-32 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold tracking-[0.04em] text-slate-500 uppercase">
                {label}
            </div>
            <div className="mt-1 text-lg font-semibold text-slate-950">
                {value}
            </div>
        </div>
    );
}
