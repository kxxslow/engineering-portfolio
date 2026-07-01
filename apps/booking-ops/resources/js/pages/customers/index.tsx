import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CalendarDays, Mail, Phone, UserPlus } from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { Table, Td, Th } from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import type { Booking, BookingPageProps, Customer } from '@/types/booking';

export default function CustomersIndex(props: BookingPageProps) {
    return (
        <AppShell context="Customers">
            <Head title="Customers" />
            <div className="space-y-5">
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-6">
                        <div>
                            <div className="text-sm font-semibold text-slate-950">
                                Customer intake
                            </div>
                            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                                Persisted customers become available in new
                                booking requests and carry their reservation
                                history forward.
                            </p>
                        </div>
                        <Link
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#0b4bb3] bg-[#0b4bb3] px-3 text-sm font-semibold !text-white shadow-sm transition visited:!text-white hover:bg-[#093f9a] hover:!text-white focus-visible:!text-white [&_svg]:!text-white"
                            href="/customers/new"
                        >
                            <UserPlus className="h-4 w-4" />
                            Add customer
                        </Link>
                    </CardHeader>
                </Card>

                <Card className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <div className="text-sm font-semibold text-slate-950">
                                Customer list
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                Contact details and booking state used by
                                operations.
                            </p>
                        </div>
                        <Badge tone="blue">{props.customers.length} rows</Badge>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Customer</Th>
                                    <Th>Contact</Th>
                                    <Th>Bookings</Th>
                                    <Th>Latest booking</Th>
                                    <Th>Detail</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {props.customers.map((customer) => {
                                    const latestBooking =
                                        latestCustomerBooking(customer);

                                    return (
                                        <tr key={customer.id}>
                                            <Td>
                                                <div className="font-semibold text-slate-950">
                                                    {customer.name}
                                                </div>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <Badge tone="neutral">
                                                        {customer.tier}
                                                    </Badge>
                                                    <span className="text-xs text-slate-500">
                                                        {customer.visitCount}{' '}
                                                        visits
                                                    </span>
                                                </div>
                                            </Td>
                                            <Td>
                                                <ContactLine
                                                    icon={Mail}
                                                    value={customer.email}
                                                />
                                                {customer.phone ? (
                                                    <ContactLine
                                                        icon={Phone}
                                                        value={customer.phone}
                                                    />
                                                ) : null}
                                            </Td>
                                            <Td>
                                                <div className="font-semibold text-slate-900">
                                                    {customer.bookings.length}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-500">
                                                    {customer.lifetimeValue}{' '}
                                                    recorded
                                                </div>
                                            </Td>
                                            <Td>
                                                {latestBooking ? (
                                                    <div>
                                                        <div className="font-medium text-slate-900">
                                                            {
                                                                latestBooking.serviceName
                                                            }
                                                        </div>
                                                        <div className="mt-1 flex items-center gap-2">
                                                            <StatusBadge
                                                                status={
                                                                    latestBooking.status
                                                                }
                                                            />
                                                            <span className="text-xs text-slate-500">
                                                                {formatDate(
                                                                    latestBooking.startAt,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-slate-500">
                                                        No reservations yet
                                                    </span>
                                                )}
                                            </Td>
                                            <Td>
                                                <Link
                                                    className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 underline-offset-4 hover:underline"
                                                    href={`/customers/${customer.id}`}
                                                >
                                                    Open customer
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            </Td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                                <CalendarDays className="h-4 w-4 text-sky-600" />
                                Booking workflow
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                New customers appear in the Overview booking
                                request form after intake.
                            </p>
                        </div>
                        <Badge tone="green">recorded customers</Badge>
                    </CardHeader>
                </Card>
            </div>
        </AppShell>
    );
}

function latestCustomerBooking(customer: Customer): Booking | undefined {
    return customer.bookings[customer.bookings.length - 1];
}

function ContactLine({
    icon: Icon,
    value,
}: {
    icon: typeof Mail;
    value: string;
}) {
    return (
        <div className="flex items-center gap-2 text-sm text-slate-600">
            <Icon className="h-4 w-4 text-sky-600" />
            {value}
        </div>
    );
}
