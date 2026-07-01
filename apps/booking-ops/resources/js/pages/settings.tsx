import { Head } from '@inertiajs/react';
import { Banknote, Clock, DoorOpen, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/app-shell';
import { ProofRail } from '@/components/booking-widgets';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, Td, Th } from '@/components/ui/table';
import { formatPaymentPolicy } from '@/lib/format';
import type { BookingPageProps } from '@/types/booking';

export default function Settings(props: BookingPageProps) {
    return (
        <AppShell context="Constraints and safety settings">
            <Head title="Settings" />
            <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-5">
                <div className="space-y-5">
                    <Card className="overflow-hidden">
                        <CardHeader>
                            <div className="text-sm font-semibold text-slate-950">
                                Scheduling constraints
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                These service rules affect whether a request can
                                be accepted.
                            </p>
                        </CardHeader>
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Service</Th>
                                    <Th>Duration</Th>
                                    <Th>Resource</Th>
                                    <Th>Window</Th>
                                    <Th>Payment</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {props.constraints.map((constraint) => (
                                    <tr key={constraint.id}>
                                        <Td>
                                            <div className="font-semibold text-slate-900">
                                                {constraint.serviceName}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                {constraint.notes}
                                            </div>
                                        </Td>
                                        <Td>
                                            {constraint.durationMinutes}m +{' '}
                                            {constraint.bufferMinutes}m buffer
                                        </Td>
                                        <Td>
                                            <Badge tone="blue">
                                                {
                                                    constraint.requiredResourceType
                                                }
                                            </Badge>
                                        </Td>
                                        <Td>
                                            {constraint.bookingWindowStart}-
                                            {constraint.bookingWindowEnd}
                                        </Td>
                                        <Td>
                                            <Badge>
                                                {formatPaymentPolicy(
                                                    constraint.mockPaymentPolicy,
                                                )}
                                            </Badge>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card>
                    <Card>
                        <CardHeader>
                            <div className="text-sm font-semibold text-slate-950">
                                Resource inventory
                            </div>
                        </CardHeader>
                        <CardContent className="grid grid-cols-3 gap-3">
                            {props.resources.map((resource) => (
                                <div
                                    key={resource.id}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                >
                                    <DoorOpen className="h-5 w-5 text-sky-600" />
                                    <div className="mt-3 font-semibold text-slate-950">
                                        {resource.name}
                                    </div>
                                    <div className="mt-1 text-sm text-slate-500">
                                        {resource.type} · capacity{' '}
                                        {resource.capacity}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-5">
                    <SafetyCard
                        icon={<ShieldCheck className="h-4 w-4 text-sky-600" />}
                        title="Booking record safety"
                        body="Requests are recorded only after staff, room, service window, and cancellation rules are checked."
                    />
                    <SafetyCard
                        icon={<Banknote className="h-4 w-4 text-slate-500" />}
                        title="Payment boundary"
                        body="Payment status is tracked for operations review. Payment collection is outside this workspace."
                    />
                    <SafetyCard
                        icon={<Clock className="h-4 w-4 text-sky-600" />}
                        title="Cancelled release"
                        body="Cancelled bookings are excluded from capacity-holding overlap queries."
                    />
                    <ProofRail constraints={props.constraints} />
                </div>
            </div>
        </AppShell>
    );
}

function SafetyCard({
    icon,
    title,
    body,
}: {
    icon: ReactNode;
    title: string;
    body: string;
}) {
    return (
        <Card>
            <CardContent className="flex gap-3">
                <div className="mt-1">{icon}</div>
                <div>
                    <div className="text-sm font-semibold text-slate-950">
                        {title}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                        {body}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
