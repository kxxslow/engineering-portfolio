import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

import { AppShell } from '@/components/app-shell';
import { AttemptForm } from '@/components/attempt-form';
import {
    AttemptRail,
    BookingTable,
    MetricsCards,
} from '@/components/booking-widgets';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { BookingPageProps } from '@/types/booking';

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
                        <BookingTable bookings={props.bookings} />
                        <AttemptRail
                            attempts={props.attempts}
                            title="Latest request outcome"
                            description="The most recent availability check stays visible with its booking rule result."
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
