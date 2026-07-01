export function formatTime(value: string | null) {
    if (!value) {
        return 'TBD';
    }

    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'UTC',
    }).format(new Date(value));
}

export function formatDate(value: string | null) {
    if (!value) {
        return 'Unscheduled';
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(value));
}

export function formatRange(start: string | null, end: string | null) {
    return `${formatTime(start)} - ${formatTime(end)}`;
}

export function formatPaymentStatus(value: string | null) {
    if (!value) {
        return 'Not set';
    }

    const labels: Record<string, string> = {
        mock_authorized: 'Authorization recorded',
        not_required: 'Not required',
    };

    return labels[value] ?? value.replaceAll('_', ' ');
}

export function formatPaymentPolicy(value: string | null) {
    if (!value || value === 'none') {
        return 'Not required';
    }

    if (value === 'authorize-only') {
        return 'Authorization only';
    }

    return value.replaceAll('-', ' ');
}

export function formatPaymentBoundary(value: string | null) {
    if (!value) {
        return 'Payment not connected';
    }

    if (value === 'mock-only') {
        return 'Payment not connected';
    }

    return value.replaceAll('-', ' ');
}

export function formatConflictKind(value: string | null) {
    if (!value) {
        return 'No conflict';
    }

    const labels: Record<string, string> = {
        staff_overlap: 'Staff overlap',
        resource_overlap: 'Resource overlap',
        validation: 'Incomplete request',
        inactive_constraint: 'Inactive service rule',
        resource_type: 'Resource mismatch',
        booking_window: 'Outside booking window',
        customer_follow_up: 'Customer follow-up',
        payment_hold: 'Reservation hold',
    };

    return labels[value] ?? value.replaceAll('_', ' ');
}
