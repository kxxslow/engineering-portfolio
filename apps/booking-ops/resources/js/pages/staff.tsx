import { Head, Link } from '@inertiajs/react';
import {
    CalendarClock,
    Link2,
    ShieldCheck,
    UserRoundCog,
} from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { BookingTable, ProofRail } from '@/components/booking-widgets';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { BookingPageProps } from '@/types/booking';

export default function StaffPage(props: BookingPageProps) {
    const activeBookings = props.bookings.filter(
        (booking) => booking.status !== 'cancelled',
    );
    const staffOverlapStops = props.attempts.filter(
        (attempt) =>
            attempt.status === 'blocked' &&
            attempt.conflictKind === 'staff_overlap',
    );

    return (
        <AppShell context="Staff and room assignment">
            <Head title="Staff" />
            <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-5">
                <div className="space-y-5">
                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <div className="text-sm font-semibold text-slate-950">
                                    Capacity inspector
                                </div>
                                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                                    Read-only staff capacity view. Active
                                    bookings below are the same records used by
                                    overlap checks.
                                </p>
                            </div>
                            <Badge tone="blue">
                                {staffOverlapStops.length === 1
                                    ? '1 overlap block'
                                    : `${staffOverlapStops.length} overlap blocks`}
                            </Badge>
                        </CardHeader>
                    </Card>
                    <div className="grid grid-cols-3 gap-4">
                        {props.staffMembers.map((member) => {
                            const assignments = activeBookings.filter(
                                (booking) =>
                                    booking.staffId === member.id,
                            );

                            return (
                                <Card
                                    className="cursor-default border-slate-200"
                                    key={member.id}
                                >
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <UserRoundCog className="h-5 w-5 text-sky-600" />
                                            <Badge tone="green">
                                                {assignments.length} active
                                            </Badge>
                                        </div>
                                        <div className="mt-3 text-base font-semibold text-slate-950">
                                            {member.name}
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            {member.role}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <CalendarClock className="h-4 w-4" />
                                            {member.shiftStart}-
                                            {member.shiftEnd}
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {member.skills.map((skill) => (
                                                <Badge key={skill}>
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                                            <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                                                Active assignments
                                            </div>
                                            {assignments.length > 0 ? (
                                                assignments.map((booking) => (
                                                    <Link
                                                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 transition hover:border-sky-200 hover:bg-sky-50"
                                                        href={`/bookings/${booking.id}`}
                                                        key={booking.id}
                                                    >
                                                        <span>
                                                            <span className="font-semibold text-slate-900">
                                                                {booking.id}
                                                            </span>
                                                            <span className="ml-2">
                                                                {
                                                                    booking.resourceName
                                                                }
                                                            </span>
                                                        </span>
                                                        <Link2 className="h-3.5 w-3.5 text-sky-600" />
                                                    </Link>
                                                ))
                                            ) : (
                                                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                                    No active capacity holds in
                                                    the current ledger.
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                    <BookingTable
                        bookings={props.bookings}
                        description="Booking IDs and record actions open the source booking detail pages."
                        highlightBookingId={null}
                        showDetailAction
                    />
                </div>
                <div className="space-y-5">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                                <ShieldCheck className="h-4 w-4 text-sky-600" />
                                Overlap policy
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
                            <p>
                                Staff cannot be assigned to overlapping
                                confirmed or checked-in bookings.
                            </p>
                            <p>
                                The same rule is applied when a new booking
                                request is checked from Overview.
                            </p>
                        </CardContent>
                    </Card>
                    <ProofRail constraints={props.constraints} />
                </div>
            </div>
        </AppShell>
    );
}
