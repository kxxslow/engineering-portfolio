<?php

namespace Tests\Feature;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Booking;
use App\Models\Customer;
use App\Services\BookingAttemptService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Tests\TestCase;

class CustomerIntakeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();
    }

    public function test_customer_creation_persists_customer(): void
    {
        $response = $this->post('/customers', [
            'name' => 'Lena Ortiz',
            'email' => 'lena.ortiz@example.com',
            'phone' => '+1 415 555 0201',
            'notes' => 'Prefers afternoon booking windows.',
        ]);

        $response
            ->assertRedirect('/customers/cust-lena-ortiz')
            ->assertSessionHas('customerCreated');

        $this->assertDatabaseHas('customers', [
            'id' => 'cust-lena-ortiz',
            'name' => 'Lena Ortiz',
            'email' => 'lena.ortiz@example.com',
            'tier' => 'new',
        ]);
    }

    public function test_customer_creation_validation_fails_for_missing_or_invalid_fields(): void
    {
        $this->post('/customers', [
            'name' => '',
            'email' => 'not-an-email',
            'phone' => '',
            'notes' => '',
        ])->assertSessionHasErrors(['name', 'email']);
    }

    public function test_customers_route_lists_persisted_customers(): void
    {
        Customer::create([
            'id' => 'cust-lena-ortiz',
            'name' => 'Lena Ortiz',
            'email' => 'lena.ortiz@example.com',
            'phone' => '+1 415 555 0201',
            'tier' => 'new',
            'notes' => 'Prefers afternoon booking windows.',
        ]);

        $props = $this->inertiaProps('/customers');

        /** @var Collection<int, array<string, mixed>> $customers */
        $customers = collect($props['customers']);

        $this->assertTrue($customers->contains(
            fn (array $customer): bool => $customer['id'] === 'cust-lena-ortiz'
                && $customer['name'] === 'Lena Ortiz',
        ));
    }

    public function test_customer_detail_works_for_new_customer(): void
    {
        Customer::create([
            'id' => 'cust-lena-ortiz',
            'name' => 'Lena Ortiz',
            'email' => 'lena.ortiz@example.com',
            'phone' => '+1 415 555 0201',
            'tier' => 'new',
            'notes' => 'Prefers afternoon booking windows.',
        ]);

        $props = $this->inertiaProps('/customers/cust-lena-ortiz');

        $this->assertSame('cust-lena-ortiz', $props['selectedCustomer']['id']);
        $this->assertSame('Lena Ortiz', $props['selectedCustomer']['name']);
        $this->assertSame([], $props['selectedCustomer']['bookings']);
    }

    public function test_booking_attempt_form_can_use_new_customer(): void
    {
        Customer::create([
            'id' => 'cust-lena-ortiz',
            'name' => 'Lena Ortiz',
            'email' => 'lena.ortiz@example.com',
            'phone' => '+1 415 555 0201',
            'tier' => 'new',
            'notes' => 'Prefers afternoon booking windows.',
        ]);

        $props = $this->inertiaProps('/');

        /** @var Collection<int, array<string, mixed>> $customers */
        $customers = collect($props['customers']);

        $this->assertTrue($customers->contains(
            fn (array $customer): bool => $customer['id'] === 'cust-lena-ortiz',
        ));
    }

    public function test_accepted_booking_for_new_customer_appears_in_customer_history(): void
    {
        Customer::create([
            'id' => 'cust-lena-ortiz',
            'name' => 'Lena Ortiz',
            'email' => 'lena.ortiz@example.com',
            'phone' => '+1 415 555 0201',
            'tier' => 'new',
            'notes' => 'Prefers afternoon booking windows.',
        ]);

        $attempt = app(BookingAttemptService::class)->attempt([
            'customer_id' => 'cust-lena-ortiz',
            'staff_id' => 'staff-nora',
            'resource_id' => 'room-south',
            'constraint_id' => 'svc-onboarding',
            'start_at' => '2026-07-15 10:00:00',
        ]);

        $this->assertSame('accepted', $attempt->status);

        $props = $this->inertiaProps('/customers/cust-lena-ortiz');
        $bookings = collect($props['selectedCustomer']['bookings']);
        $attempts = collect($props['selectedCustomer']['attempts']);

        $this->assertTrue($bookings->contains(
            fn (array $booking): bool => $booking['id'] === $attempt->attempted_booking_id
                && $booking['customerName'] === 'Lena Ortiz',
        ));
        $this->assertTrue($attempts->contains(
            fn (array $historyItem): bool => $historyItem['attemptedBookingId'] === $attempt->attempted_booking_id,
        ));
    }

    public function test_accepted_booking_for_new_customer_appears_in_schedule(): void
    {
        Customer::create([
            'id' => 'cust-lena-ortiz',
            'name' => 'Lena Ortiz',
            'email' => 'lena.ortiz@example.com',
            'phone' => '+1 415 555 0201',
            'tier' => 'new',
            'notes' => 'Prefers afternoon booking windows.',
        ]);

        $attempt = app(BookingAttemptService::class)->attempt([
            'customer_id' => 'cust-lena-ortiz',
            'staff_id' => 'staff-nora',
            'resource_id' => 'room-south',
            'constraint_id' => 'svc-onboarding',
            'start_at' => '2026-07-15 10:00:00',
        ]);

        $booking = Booking::query()->findOrFail($attempt->attempted_booking_id);
        $day = collect($this->inertiaProps('/schedule')['scheduleDays'])->firstWhere('date', '2026-07-15');

        $this->assertIsArray($day);
        $this->assertTrue(collect($day['bookings'])->contains(
            fn (array $scheduledBooking): bool => $scheduledBooking['id'] === $booking->id
                && $scheduledBooking['customerName'] === 'Lena Ortiz',
        ));
    }

    /**
     * @return array<string, mixed>
     */
    private function inertiaProps(string $route): array
    {
        $version = app(HandleInertiaRequests::class)->version(Request::create($route));

        $response = $this->get($route, [
            'X-Inertia' => 'true',
            'X-Inertia-Version' => $version ?? '',
        ]);

        $response->assertOk();

        /** @var array<string, mixed> $props */
        $props = $response->json('props');

        return $props;
    }
}
