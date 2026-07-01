<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\BookingAttempt;
use App\Models\Customer;
use App\Models\Resource;
use App\Models\SchedulingConstraint;
use App\Models\Staff;
use Carbon\CarbonImmutable;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class BookingAttemptService
{
    public function __construct(private readonly MockPaymentBoundary $paymentBoundary) {}

    /**
     * @param  array<string, mixed>  $input
     *
     * @throws Throwable
     */
    public function attempt(array $input): BookingAttempt
    {
        return DB::transaction(function () use ($input): BookingAttempt {
            $customerId = $this->stringInput($input, 'customer_id');
            $staffId = $this->stringInput($input, 'staff_id');
            $resourceId = $this->stringInput($input, 'resource_id');
            $constraintId = $this->stringInput($input, 'constraint_id');

            $customer = $customerId ? Customer::query()->whereKey($customerId)->first() : null;
            $staff = $staffId ? Staff::query()->whereKey($staffId)->first() : null;
            $resource = $resourceId ? Resource::query()->whereKey($resourceId)->first() : null;
            $constraint = $constraintId ? SchedulingConstraint::query()->whereKey($constraintId)->first() : null;
            $startAt = $this->parseStartAt(Arr::get($input, 'start_at'));
            $endAt = $startAt !== null && $constraint !== null
                ? $startAt->addMinutes($constraint->duration_minutes + $constraint->buffer_minutes)
                : null;

            if ($customer === null || $staff === null || $resource === null || $constraint === null || $startAt === null || $endAt === null) {
                return $this->persistAttempt($input, $startAt, $endAt, 'validation_failed', 'validation', 'Missing customer, staff, resource, service, or start time.');
            }

            if (! $constraint->is_active) {
                return $this->persistAttempt($input, $startAt, $endAt, 'validation_failed', 'inactive_constraint', 'The selected scheduling constraint is inactive.');
            }

            if ($constraint->required_resource_type && $constraint->required_resource_type !== $resource->type) {
                return $this->persistAttempt($input, $startAt, $endAt, 'validation_failed', 'resource_type', 'The selected resource does not satisfy the service constraint.');
            }

            if (! $this->insideBookingWindow($startAt, $endAt, $constraint)) {
                return $this->persistAttempt($input, $startAt, $endAt, 'validation_failed', 'booking_window', 'The requested time is outside the configured booking window.');
            }

            $staffConflict = $this->firstOverlap('staff_id', $staff->id, $startAt, $endAt);
            if ($staffConflict) {
                return $this->persistAttempt(
                    $input,
                    $startAt,
                    $endAt,
                    'blocked',
                    'staff_overlap',
                    'Staff member '.$staff->name.' is already assigned to '.$staffConflict->id.'.',
                    $staffConflict,
                );
            }

            $resourceConflict = $this->firstOverlap('resource_id', $resource->id, $startAt, $endAt);
            if ($resourceConflict) {
                return $this->persistAttempt(
                    $input,
                    $startAt,
                    $endAt,
                    'blocked',
                    'resource_overlap',
                    'Resource '.$resource->name.' is already reserved by '.$resourceConflict->id.'.',
                    $resourceConflict,
                );
            }

            $bookingId = 'bk-'.strtolower((string) Str::ulid());
            $payment = $this->paymentBoundary->authorize($bookingId);

            $booking = Booking::create([
                'id' => $bookingId,
                'customer_id' => $customer->id,
                'staff_id' => $staff->id,
                'resource_id' => $resource->id,
                'constraint_id' => $constraint->id,
                'start_at' => $startAt,
                'end_at' => $endAt,
                'status' => 'confirmed',
                'payment_status' => $payment['status'],
                'notes' => 'Created from booking request.',
            ]);

            return $this->persistAttempt(
                $input,
                $startAt,
                $endAt,
                'accepted',
                null,
                'Booking accepted. Staff and resource capacity were both clear.',
                null,
                $booking,
                ['payment' => $payment],
            );
        });
    }

    private function parseStartAt(mixed $value): ?CarbonImmutable
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        try {
            return CarbonImmutable::parse($value);
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * @param  array<string, mixed>  $input
     */
    private function stringInput(array $input, string $key): ?string
    {
        $value = Arr::get($input, $key);

        return is_string($value) && $value !== '' ? $value : null;
    }

    private function insideBookingWindow(CarbonImmutable $startAt, CarbonImmutable $endAt, SchedulingConstraint $constraint): bool
    {
        $windowStart = CarbonImmutable::parse($startAt->toDateString().' '.$constraint->booking_window_start);
        $windowEnd = CarbonImmutable::parse($startAt->toDateString().' '.$constraint->booking_window_end);

        return $startAt->greaterThanOrEqualTo($windowStart) && $endAt->lessThanOrEqualTo($windowEnd);
    }

    private function firstOverlap(string $column, string $id, CarbonImmutable $startAt, CarbonImmutable $endAt): ?Booking
    {
        return Booking::query()
            ->with(['customer', 'staff', 'resource'])
            ->capacityHolding()
            ->where($column, $id)
            ->where('start_at', '<', $endAt)
            ->where('end_at', '>', $startAt)
            ->orderBy('start_at')
            ->first();
    }

    /**
     * @param  array<string, mixed>  $input
     * @param  array<string, mixed>  $extraPayload
     */
    private function persistAttempt(
        array $input,
        ?CarbonImmutable $startAt,
        ?CarbonImmutable $endAt,
        string $status,
        ?string $conflictKind,
        string $reason,
        ?Booking $blockingBooking = null,
        ?Booking $acceptedBooking = null,
        array $extraPayload = [],
    ): BookingAttempt {
        return BookingAttempt::create([
            'id' => 'attempt-'.strtolower((string) Str::ulid()),
            'customer_id' => Arr::get($input, 'customer_id'),
            'staff_id' => Arr::get($input, 'staff_id'),
            'resource_id' => Arr::get($input, 'resource_id'),
            'constraint_id' => Arr::get($input, 'constraint_id'),
            'attempted_booking_id' => $acceptedBooking?->id,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'status' => $status,
            'conflict_kind' => $conflictKind,
            'blocking_booking_id' => $blockingBooking?->id,
            'reason' => $reason,
            'payment_boundary' => 'mock-only',
            'payload' => [
                'input' => $input,
                'blocking_booking' => $blockingBooking?->id,
                'accepted_booking' => $acceptedBooking?->id,
                ...$extraPayload,
            ],
        ]);
    }
}
