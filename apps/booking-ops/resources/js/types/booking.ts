export type Customer = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    tier: string;
    visitCount: number;
    lifetimeValue: string;
    notes: string | null;
    bookings: Booking[];
    attempts: BookingAttempt[];
};

export type StaffMember = {
    id: string;
    name: string;
    role: string;
    skills: string[];
    shiftStart: string;
    shiftEnd: string;
    acceptsOverlap: boolean;
};

export type Resource = {
    id: string;
    name: string;
    type: string;
    capacity: number;
    zone: string | null;
};

export type SchedulingConstraint = {
    id: string;
    serviceName: string;
    durationMinutes: number;
    bufferMinutes: number;
    requiredResourceType: string | null;
    bookingWindowStart: string;
    bookingWindowEnd: string;
    isActive: boolean;
    mockPaymentPolicy: string;
    notes: string | null;
};

export type Booking = {
    id: string;
    customerId: string;
    customerName: string | null;
    staffId: string;
    staffName: string | null;
    resourceId: string;
    resourceName: string | null;
    constraintId: string;
    serviceName: string | null;
    startAt: string | null;
    endAt: string | null;
    status: string;
    paymentStatus: string;
    notes: string | null;
};

export type BookingAttempt = {
    id: string;
    customerName: string | null;
    staffName: string | null;
    resourceName: string | null;
    serviceName: string | null;
    startAt: string | null;
    endAt: string | null;
    status: string;
    conflictKind: string | null;
    blockingBookingId: string | null;
    attemptedBookingId: string | null;
    reason: string | null;
    paymentBoundary: string;
    payload: Record<string, unknown> | null;
};

export type ScheduleDay = {
    date: string;
    label: string;
    muted: boolean;
    active: boolean;
    tone: string | null;
    hints: string[];
    bookings: Booking[];
    blockedAttempts: BookingAttempt[];
};

export type Metrics = {
    activeBookings: number;
    blockedAttempts: number;
    releasedByCancellation: number;
    mockPaymentExternalCalls: number;
};

export type BookingPageProps = {
    customers: Customer[];
    staffMembers: StaffMember[];
    resources: Resource[];
    constraints: SchedulingConstraint[];
    bookings: Booking[];
    attempts: BookingAttempt[];
    scheduleDays: ScheduleDay[];
    metrics: Metrics;
    selectedCustomer?: Customer;
    selectedBooking?: Booking;
    flash?: {
        attemptResult?: BookingAttempt | null;
        customerCreated?: string | null;
    };
};
