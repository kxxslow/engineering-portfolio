<?php

namespace Tests\Feature;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Booking;
use App\Services\BookingAttemptService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Tests\TestCase;

class BookingAttemptTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();
    }

    public function test_staff_overlap_is_blocked(): void
    {
        $attempt = app(BookingAttemptService::class)->attempt([
            'customer_id' => 'cust-dev',
            'staff_id' => 'staff-emi',
            'resource_id' => 'room-south',
            'constraint_id' => 'svc-consult',
            'start_at' => '2026-07-14 09:30:00',
        ]);

        $this->assertSame('blocked', $attempt->status);
        $this->assertSame('staff_overlap', $attempt->conflict_kind);
        $this->assertSame('bk-1001', $attempt->blocking_booking_id);
        $this->assertDatabaseMissing('bookings', ['id' => $attempt->attempted_booking_id]);
    }

    public function test_resource_overlap_is_blocked(): void
    {
        $attempt = app(BookingAttemptService::class)->attempt([
            'customer_id' => 'cust-dev',
            'staff_id' => 'staff-kai',
            'resource_id' => 'room-north',
            'constraint_id' => 'svc-consult',
            'start_at' => '2026-07-14 09:15:00',
        ]);

        $this->assertSame('blocked', $attempt->status);
        $this->assertSame('resource_overlap', $attempt->conflict_kind);
        $this->assertSame('bk-1001', $attempt->blocking_booking_id);
    }

    public function test_non_overlap_is_accepted_and_persisted(): void
    {
        $attempt = app(BookingAttemptService::class)->attempt([
            'customer_id' => 'cust-iris',
            'staff_id' => 'staff-nora',
            'resource_id' => 'room-south',
            'constraint_id' => 'svc-onboarding',
            'start_at' => '2026-07-14 14:30:00',
        ]);

        $this->assertSame('accepted', $attempt->status);
        $this->assertNotNull($attempt->attempted_booking_id);
        $this->assertDatabaseHas('bookings', [
            'id' => $attempt->attempted_booking_id,
            'status' => 'confirmed',
            'payment_status' => 'mock_authorized',
        ]);
    }

    public function test_accepted_booking_attempt_appears_in_schedule_data_after_creation(): void
    {
        $this->post('/booking-attempts', [
            'customer_id' => 'cust-iris',
            'staff_id' => 'staff-nora',
            'resource_id' => 'room-south',
            'constraint_id' => 'svc-onboarding',
            'start_at' => '2026-07-15 10:00:00',
        ])->assertRedirect();

        $booking = Booking::query()
            ->where('customer_id', 'cust-iris')
            ->where('staff_id', 'staff-nora')
            ->where('resource_id', 'room-south')
            ->where('start_at', '2026-07-15 10:00:00')
            ->firstOrFail();

        $day = $this->scheduleDay('2026-07-15');
        $scheduledBooking = collect($day['bookings'])->firstWhere('id', $booking->id);

        $this->assertNotNull($scheduledBooking);
        $this->assertSame('Iris Stone', $scheduledBooking['customerName']);
        $this->assertSame('Nora Patel', $scheduledBooking['staffName']);
        $this->assertSame('South consultation room', $scheduledBooking['resourceName']);
        $this->assertSame('Customer onboarding', $scheduledBooking['serviceName']);
        $this->assertSame('confirmed', $scheduledBooking['status']);
    }

    public function test_blocked_booking_attempt_does_not_appear_as_schedule_booking(): void
    {
        $attempt = app(BookingAttemptService::class)->attempt([
            'customer_id' => 'cust-dev',
            'staff_id' => 'staff-emi',
            'resource_id' => 'room-south',
            'constraint_id' => 'svc-consult',
            'start_at' => '2026-07-14 09:30:00',
        ]);

        $day = $this->scheduleDay('2026-07-14');
        $dayBookings = collect($day['bookings']);
        $dayBlockedAttempts = collect($day['blockedAttempts']);

        $this->assertSame('blocked', $attempt->status);
        $this->assertFalse($dayBookings->contains(
            fn (array $booking): bool => $booking['customerName'] === 'Dev Shah'
                && str_starts_with((string) $booking['startAt'], '2026-07-14T09:30'),
        ));
        $this->assertTrue($dayBlockedAttempts->contains(
            fn (array $blockedAttempt): bool => $blockedAttempt['id'] === $attempt->id,
        ));
    }

    public function test_cancelled_booking_releases_capacity(): void
    {
        $attempt = app(BookingAttemptService::class)->attempt([
            'customer_id' => 'cust-dev',
            'staff_id' => 'staff-emi',
            'resource_id' => 'room-north',
            'constraint_id' => 'svc-onboarding',
            'start_at' => '2026-07-14 13:00:00',
        ]);

        $this->assertSame('accepted', $attempt->status);
        $this->assertDatabaseHas('bookings', [
            'id' => 'bk-1003',
            'status' => 'cancelled',
        ]);
        $this->assertDatabaseCount('bookings', 11);
    }

    public function test_cancelled_booking_is_visible_as_cancelled_and_does_not_block_new_schedule_booking(): void
    {
        $attempt = app(BookingAttemptService::class)->attempt([
            'customer_id' => 'cust-dev',
            'staff_id' => 'staff-emi',
            'resource_id' => 'room-north',
            'constraint_id' => 'svc-onboarding',
            'start_at' => '2026-07-14 13:00:00',
        ]);

        $day = $this->scheduleDay('2026-07-14');
        $dayBookings = collect($day['bookings']);
        $cancelledBooking = $dayBookings->firstWhere('id', 'bk-1003');
        $acceptedBooking = $dayBookings->firstWhere('id', $attempt->attempted_booking_id);

        $this->assertSame('accepted', $attempt->status);
        $this->assertSame('cancelled', $cancelledBooking['status']);
        $this->assertNotNull($acceptedBooking);
        $this->assertSame('confirmed', $acceptedBooking['status']);
        $this->assertSame('Dev Shah', $acceptedBooking['customerName']);
    }

    public function test_validation_failure_is_persisted(): void
    {
        $attempt = app(BookingAttemptService::class)->attempt([
            'customer_id' => 'cust-mira',
            'staff_id' => 'staff-emi',
            'resource_id' => 'station-blue',
            'constraint_id' => 'svc-consult',
            'start_at' => '2026-07-14 11:00:00',
        ]);

        $this->assertSame('validation_failed', $attempt->status);
        $this->assertSame('resource_type', $attempt->conflict_kind);
        $this->assertDatabaseHas('booking_attempts', [
            'id' => $attempt->id,
            'status' => 'validation_failed',
        ]);
    }

    public function test_booking_attempt_post_persists_block_result(): void
    {
        $response = $this->post('/booking-attempts', [
            'customer_id' => 'cust-dev',
            'staff_id' => 'staff-emi',
            'resource_id' => 'room-south',
            'constraint_id' => 'svc-consult',
            'start_at' => '2026-07-14 09:45:00',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('booking_attempts', [
            'status' => 'blocked',
            'conflict_kind' => 'staff_overlap',
            'blocking_booking_id' => 'bk-1001',
        ]);
    }

    public function test_mock_payment_boundary_never_marks_external_call(): void
    {
        $attempt = app(BookingAttemptService::class)->attempt([
            'customer_id' => 'cust-iris',
            'staff_id' => 'staff-nora',
            'resource_id' => 'room-south',
            'constraint_id' => 'svc-onboarding',
            'start_at' => '2026-07-14 15:10:00',
        ]);

        $this->assertSame('accepted', $attempt->status);
        $this->assertSame('mock-only', $attempt->payment_boundary);
        $this->assertFalse($attempt->payload['payment']['external']);

        $booking = Booking::query()->findOrFail($attempt->attempted_booking_id);
        $this->assertSame('mock_authorized', $booking->payment_status);
    }

    /**
     * @return array<string, mixed>
     */
    private function scheduleDay(string $date): array
    {
        $version = app(HandleInertiaRequests::class)->version(Request::create('/schedule'));

        $response = $this->get('/schedule', [
            'X-Inertia' => 'true',
            'X-Inertia-Version' => $version ?? '',
        ]);

        $response->assertOk();

        /** @var array<int, array<string, mixed>> $scheduleDays */
        $scheduleDays = $response->json('props.scheduleDays');

        /** @var Collection<int, array<string, mixed>> $days */
        $days = collect($scheduleDays);
        $day = $days->firstWhere('date', $date);

        $this->assertIsArray($day, "Expected /schedule to include {$date}.");

        return $day;
    }
}
