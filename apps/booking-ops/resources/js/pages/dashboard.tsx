import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

import { AppShell } from '@/components/app-shell';
import { AttemptForm } from '@/components/attempt-form';
import { AttemptRail, MetricsCards } from '@/components/booking-widgets';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type {
    BookingAttempt,
    BookingPageProps,
    Metrics,
    SchedulingConstraint,
} from '@/types/booking';

export default function Dashboard(props: BookingPageProps) {
    const [selectedCustomerId, setSelectedCustomerId] = useState(
        props.selectedCustomer?.id ?? props.customers[0]?.id ?? '',
    );
    const selectedCustomer =
        props.customers.find((customer) => customer.id === selectedCustomerId) ??
        props.selectedCustomer ??
        props.customers[0];

    return (
        <AppShell context="Operations overview">
            <Head title="Booking operations" />
            <div className="space-y-5">
                <MetricsCards metrics={props.metrics} />
                <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-5">
                    <div className="space-y-5">
                        <CurrentStatePanel
                            attempts={props.attempts}
                            constraints={props.constraints}
                            metrics={props.metrics}
                        />
                        <AttemptRail
                            attempts={props.attempts.slice(0, 5)}
                            title="Latest request outcomes"
                            description="Recent intake decisions, holds, and blocked requests stay visible without becoming the operations queue."
                        />
                    </div>
                    <div className="space-y-5">
                        <AttemptForm
                            customers={props.customers}
                            staffMembers={props.staffMembers}
                            resources={props.resources}
                            constraints={props.constraints}
                            selectedCustomerId={selectedCustomer?.id}
                            onCustomerChange={setSelectedCustomerId}
                        />
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="text-sm font-semibold text-slate-950">
                                    Customer context
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                    Matches the selected booking request.
                                </p>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="text-lg font-semibold text-slate-950">
                                    {selectedCustomer?.name}
                                </div>
                                <div className="mt-1 text-sm text-slate-500">
                                    {selectedCustomer?.email}
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-3">
                                    <Stat
                                        label="Visits"
                                        value={
                                            selectedCustomer?.visitCount ?? 0
                                        }
                                    />
                                    <Stat
                                        label="Recorded value"
                                        value={
                                            selectedCustomer?.lifetimeValue ??
                                            '$0.00'
                                        }
                                    />
                                </div>
                                <p className="mt-3 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-sm leading-5 text-sky-900">
                                    {selectedCustomer?.notes ??
                                        'No operations note recorded yet.'}
                                </p>
                                {selectedCustomer ? (
                                    <Link
                                        className="mt-3 inline-flex text-sm font-semibold text-sky-700 underline-offset-4 hover:underline"
                                        href={`/customers/${selectedCustomer.id}`}
                                    >
                                        Open customer record
                                    </Link>
                                ) : null}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

function CurrentStatePanel({
    attempts,
    constraints,
    metrics,
}: {
    attempts: BookingAttempt[];
    constraints: SchedulingConstraint[];
    metrics: Metrics;
}) {
    const activeRules = constraints.filter((constraint) => constraint.isActive);
    const followUps = attempts.filter((attempt) =>
        ['pending_review', 'payment_hold'].includes(attempt.status),
    );

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="text-sm font-semibold text-slate-950">
                    Current state
                </div>
                <p className="mt-1 text-xs text-slate-500">
                    Intake health, active rules, and boundary status for the
                    booking workspace.
                </p>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3 pt-0">
                <StateTile
                    label="Request intake"
                    value={`${attempts.length} checks`}
                    detail={`${followUps.length} need follow-up`}
                />
                <StateTile
                    label="Booking rules active"
                    value={`${activeRules.length} rules`}
                    detail={`${metrics.blockedAttempts} blocked requests`}
                />
                <StateTile
                    label="Reservation holds only"
                    value={`${metrics.activeBookings} active`}
                    detail={`${metrics.releasedByCancellation} released holds`}
                />
            </CardContent>
        </Card>
    );
}

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <div className="text-xs font-semibold tracking-[0.04em] text-slate-500 uppercase">
                {label}
            </div>
            <div className="mt-1 text-base font-semibold text-slate-950">
                {value}
            </div>
        </div>
    );
}

function StateTile({
    detail,
    label,
    value,
}: {
    detail: string;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] font-extrabold tracking-[0.04em] text-slate-500 uppercase">
                {label}
            </div>
            <div className="mt-2 text-lg font-extrabold text-slate-900">
                {value}
            </div>
            <div className="mt-1 text-xs leading-5 text-slate-500">
                {detail}
            </div>
        </div>
    );
}
