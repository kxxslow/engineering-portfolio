import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    Banknote,
    Clock,
    DoorOpen,
    UserRoundCheck,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/app-shell';
import { AttemptRail, ProofRail } from '@/components/booking-widgets';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatDate, formatPaymentStatus, formatRange } from '@/lib/format';
import type { BookingPageProps } from '@/types/booking';

export default function BookingDetail(props: BookingPageProps) {
    const booking = props.selectedBooking;

    return (
        <AppShell context="Booking detail">
            <Head title={booking?.id ?? 'Booking'} />
            <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-5">
                <div className="space-y-5">
                    <Card>
                        <CardContent className="flex items-start justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                                        {booking?.id}
                                    </h1>
                                    {booking ? (
                                        <StatusBadge status={booking.status} />
                                    ) : null}
                                </div>
                                <div className="mt-2 text-sm text-slate-500">
                                    {booking?.customerName} ·{' '}
                                    {booking?.serviceName}
                                </div>
                                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                                    {booking?.notes}
                                </p>
                            </div>
                            <Badge tone="blue">Recorded</Badge>
                        </CardContent>
                    </Card>
                    <div className="grid grid-cols-4 gap-4">
                        <DetailCard
                            icon={<Clock className="h-4 w-4 text-sky-600" />}
                            label="Time"
                            value={formatRange(
                                booking?.startAt ?? null,
                                booking?.endAt ?? null,
                            )}
                            sub={formatDate(booking?.startAt ?? null)}
                        />
                        <DetailCard
                            icon={
                                <UserRoundCheck className="h-4 w-4 text-sky-600" />
                            }
                            label="Staff"
                            value={booking?.staffName ?? 'Unassigned'}
                            sub="Overlap checked"
                        />
                        <DetailCard
                            icon={<DoorOpen className="h-4 w-4 text-sky-600" />}
                            label="Resource"
                            value={booking?.resourceName ?? 'Unassigned'}
                            sub="Capacity one"
                        />
                        <DetailCard
                            icon={
                                <Banknote className="h-4 w-4 text-slate-500" />
                            }
                            label="Payment"
                            value={formatPaymentStatus(
                                booking?.paymentStatus ?? null,
                            )}
                            sub="Operational status"
                        />
                    </div>
                    <Card>
                        <CardHeader>
                            <div className="text-sm font-semibold text-slate-950">
                                Conflict check narrative
                            </div>
                        </CardHeader>
                        <CardContent className="grid grid-cols-3 gap-3">
                            <ProofPill
                                title="Staff clear"
                                body="No overlapping active booking for assigned staff."
                            />
                            <ProofPill
                                title="Room clear"
                                body="Resource holds ignore cancelled rows."
                            />
                            <ProofPill
                                title="Request history"
                                body="Blocked and accepted requests are tracked separately."
                            />
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-5">
                    {booking?.status === 'cancelled' ? (
                        <Card className="border-amber-200 bg-amber-50">
                            <CardContent className="flex gap-3">
                                <AlertTriangle className="mt-1 h-4 w-4 text-amber-700" />
                                <div>
                                    <div className="text-sm font-semibold text-amber-900">
                                        Capacity released
                                    </div>
                                    <p className="mt-1 text-sm leading-6 text-amber-800">
                                        Cancelled bookings are excluded from
                                        overlap checks, so this slot can be
                                        accepted again.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : null}
                    <AttemptRail attempts={props.attempts} />
                    <ProofRail constraints={props.constraints} />
                </div>
            </div>
        </AppShell>
    );
}

function DetailCard({
    icon,
    label,
    value,
    sub,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    sub: string;
}) {
    return (
        <Card>
            <CardContent>
                <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.04em] text-slate-500 uppercase">
                    {icon}
                    {label}
                </div>
                <div className="mt-3 text-base font-semibold text-slate-950">
                    {value}
                </div>
                <div className="mt-1 text-xs text-slate-500">{sub}</div>
            </CardContent>
        </Card>
    );
}

function ProofPill({ title, body }: { title: string; body: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-950">{title}</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
        </div>
    );
}
