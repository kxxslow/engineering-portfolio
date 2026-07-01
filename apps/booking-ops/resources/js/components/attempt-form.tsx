import { useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, CalendarPlus, CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
import { formatConflictKind, formatPaymentBoundary } from '@/lib/format';
import type { BookingPageProps } from '@/types/booking';

type AttemptFormData = {
    customer_id: string;
    staff_id: string;
    resource_id: string;
    constraint_id: string;
    start_at: string;
};

export function AttemptForm({
    customers,
    staffMembers,
    resources,
    constraints,
    selectedCustomerId,
    onCustomerChange,
}: Pick<
    BookingPageProps,
    'customers' | 'staffMembers' | 'resources' | 'constraints'
> & {
    selectedCustomerId?: string;
    onCustomerChange?: (customerId: string) => void;
}) {
    const { props } = usePage<BookingPageProps>();
    const result = props.flash?.attemptResult;
    const { data, setData, post, processing, errors } =
        useForm<AttemptFormData>({
            customer_id: selectedCustomerId ?? customers[0]?.id ?? '',
            staff_id: 'staff-emi',
            resource_id: 'room-south',
            constraint_id: 'svc-consult',
            start_at: '2026-07-14T09:30',
        });

    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <div className="text-sm font-semibold text-slate-950">
                        New booking request
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                        Check staff, room, and service rules before the booking
                        is accepted.
                    </p>
                </div>
                <CalendarPlus className="h-5 w-5 text-sky-600" />
            </CardHeader>
            <CardContent>
                <form
                    className="grid grid-cols-2 gap-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        post('/booking-attempts', {
                            preserveScroll: true,
                        });
                    }}
                >
                    <Field label="Customer" error={errors.customer_id}>
                        <Select
                            value={data.customer_id}
                            onChange={(event) => {
                                setData('customer_id', event.target.value);
                                onCustomerChange?.(event.target.value);
                            }}
                        >
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Service" error={errors.constraint_id}>
                        <Select
                            value={data.constraint_id}
                            onChange={(event) =>
                                setData('constraint_id', event.target.value)
                            }
                        >
                            {constraints.map((constraint) => (
                                <option
                                    key={constraint.id}
                                    value={constraint.id}
                                >
                                    {constraint.serviceName}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Staff" error={errors.staff_id}>
                        <Select
                            value={data.staff_id}
                            onChange={(event) =>
                                setData('staff_id', event.target.value)
                            }
                        >
                            {staffMembers.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.name}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Resource" error={errors.resource_id}>
                        <Select
                            value={data.resource_id}
                            onChange={(event) =>
                                setData('resource_id', event.target.value)
                            }
                        >
                            {resources.map((resource) => (
                                <option key={resource.id} value={resource.id}>
                                    {resource.name}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <div className="col-span-2">
                        <Field label="Start time" error={errors.start_at}>
                            <Input
                                type="datetime-local"
                                value={data.start_at}
                                onChange={(event) =>
                                    setData('start_at', event.target.value)
                                }
                            />
                        </Field>
                    </div>
                    <div className="col-span-2 flex items-end">
                        <Button className="w-full" disabled={processing}>
                            Check availability
                        </Button>
                    </div>
                </form>

                {result ? (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                {result.status === 'accepted' ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                                )}
                                Latest request
                            </div>
                            <StatusBadge status={result.status} />
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            {result.reason}
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                            <span>
                                Conflict:{' '}
                                {formatConflictKind(result.conflictKind)}
                            </span>
                            <span>
                                Booking:{' '}
                                {result.attemptedBookingId ?? 'not created'}
                            </span>
                            <span>
                                Blocks: {result.blockingBookingId ?? 'none'}
                            </span>
                            <span>
                                Payment:{' '}
                                {formatPaymentBoundary(result.paymentBoundary)}
                            </span>
                        </div>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-600">
                {label}
            </span>
            {children}
            {error ? (
                <span className="text-xs text-rose-600">{error}</span>
            ) : null}
        </label>
    );
}
