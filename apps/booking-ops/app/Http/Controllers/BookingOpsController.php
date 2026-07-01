<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BookingAttempt;
use App\Models\Customer;
use App\Models\Resource;
use App\Models\SchedulingConstraint;
use App\Models\Staff;
use App\Services\BookingAttemptService;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class BookingOpsController extends Controller
{
    public function dashboard(): Response
    {
        return Inertia::render('dashboard', [
            ...$this->portfolioData(),
            'selectedCustomer' => $this->customerPayload(Customer::query()->whereKey('cust-mira')->firstOrFail()),
        ]);
    }

    public function schedule(): Response
    {
        return Inertia::render('schedule', [
            ...$this->portfolioData(),
        ]);
    }

    public function staff(): Response
    {
        return Inertia::render('staff', [
            ...$this->portfolioData(),
        ]);
    }

    public function settings(): Response
    {
        return Inertia::render('settings', [
            ...$this->portfolioData(),
        ]);
    }

    public function customers(): Response
    {
        return Inertia::render('customers/index', [
            ...$this->portfolioData(),
        ]);
    }

    public function createCustomer(): Response
    {
        return Inertia::render('customers/new', [
            ...$this->portfolioData(),
        ]);
    }

    public function customer(Customer $customer): Response
    {
        return Inertia::render('customers/show', [
            ...$this->portfolioData(),
            'selectedCustomer' => $this->customerPayload($customer),
        ]);
    }

    public function booking(Booking $booking): Response
    {
        $booking->load(['customer', 'staff', 'resource', 'constraint']);

        return Inertia::render('bookings/show', [
            ...$this->portfolioData(),
            'selectedBooking' => $this->bookingPayload($booking),
        ]);
    }

    /**
     * @throws Throwable
     */
    public function storeAttempt(Request $request, BookingAttemptService $service): RedirectResponse
    {
        $data = $request->validate([
            'customer_id' => ['required', 'string'],
            'staff_id' => ['required', 'string'],
            'resource_id' => ['required', 'string'],
            'constraint_id' => ['required', 'string'],
            'start_at' => ['required', 'string'],
        ]);

        $attempt = $service->attempt($data)->load(['customer', 'staff', 'resource', 'constraint', 'blockingBooking', 'attemptedBooking']);

        return back()->with('attemptResult', $this->attemptPayload($attempt));
    }

    public function storeCustomer(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => [
                'required',
                'email',
                'max:160',
                Rule::unique('customers', 'email'),
            ],
            'phone' => ['nullable', 'string', 'max:40'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $customer = Customer::create([
            'id' => $this->newCustomerId((string) $data['name']),
            'name' => trim((string) $data['name']),
            'email' => strtolower(trim((string) $data['email'])),
            'phone' => isset($data['phone']) ? trim((string) $data['phone']) : null,
            'tier' => 'new',
            'visit_count' => 0,
            'lifetime_value_cents' => 0,
            'notes' => isset($data['notes']) ? trim((string) $data['notes']) : null,
        ]);

        return redirect()
            ->route('customers.show', $customer)
            ->with('customerCreated', $customer->name.' is ready for booking requests.');
    }

    /**
     * @return array<string, mixed>
     */
    private function portfolioData(): array
    {
        $bookings = Booking::query()
            ->with(['customer', 'staff', 'resource', 'constraint'])
            ->orderBy('start_at')
            ->get();

        $attempts = BookingAttempt::query()
            ->with(['customer', 'staff', 'resource', 'constraint', 'blockingBooking', 'attemptedBooking'])
            ->latest()
            ->take(12)
            ->get();

        return [
            'customers' => Customer::query()->orderBy('name')->get()->map(fn (Customer $customer): array => $this->customerPayload($customer))->values(),
            'staffMembers' => Staff::query()->orderBy('name')->get()->map(fn (Staff $staff): array => $this->staffPayload($staff))->values(),
            'resources' => Resource::query()->orderBy('name')->get()->map(fn (Resource $resource): array => $this->resourcePayload($resource))->values(),
            'constraints' => SchedulingConstraint::query()->orderBy('service_name')->get()->map(fn (SchedulingConstraint $constraint): array => $this->constraintPayload($constraint))->values(),
            'bookings' => $bookings->map(fn (Booking $booking): array => $this->bookingPayload($booking))->values(),
            'attempts' => $attempts->map(fn (BookingAttempt $attempt): array => $this->attemptPayload($attempt))->values(),
            'scheduleDays' => $this->scheduleDaysPayload($bookings, $attempts),
            'metrics' => [
                'activeBookings' => $bookings->whereIn('status', ['confirmed', 'checked_in'])->count(),
                'blockedAttempts' => BookingAttempt::query()->where('status', 'blocked')->count(),
                'releasedByCancellation' => $bookings->where('status', 'cancelled')->count(),
                'mockPaymentExternalCalls' => 0,
            ],
        ];
    }

    /**
     * @param  Collection<int, Booking>  $bookings
     * @param  Collection<int, BookingAttempt>  $attempts
     * @return array<int, array<string, mixed>>
     */
    private function scheduleDaysPayload(Collection $bookings, Collection $attempts): array
    {
        $calendarMeta = collect([
            ['date' => '2026-06-29', 'muted' => true, 'hints' => ['deposit due']],
            ['date' => '2026-06-30', 'muted' => true, 'hints' => ['open 4']],
            ['date' => '2026-07-01', 'hints' => ['staff 4/6']],
            ['date' => '2026-07-02', 'hints' => ['open 3']],
            ['date' => '2026-07-03', 'hints' => ['waitlist 1']],
            ['date' => '2026-07-04', 'hints' => ['hold']],
            ['date' => '2026-07-05', 'hints' => ['training']],
            ['date' => '2026-07-06', 'hints' => ['open 1']],
            ['date' => '2026-07-07', 'hints' => ['open 2']],
            ['date' => '2026-07-08', 'hints' => ['blocked'], 'tone' => 'red'],
            ['date' => '2026-07-09', 'hints' => ['Aqua 2'], 'tone' => 'aqua'],
            ['date' => '2026-07-10', 'hints' => ['open 5']],
            ['date' => '2026-07-11', 'hints' => ['hold 2']],
            ['date' => '2026-07-12', 'hints' => ['cleaning']],
            ['date' => '2026-07-13', 'hints' => ['staff full'], 'tone' => 'amber'],
            ['date' => '2026-07-14', 'active' => true],
            ['date' => '2026-07-15', 'hints' => ['open 5']],
            ['date' => '2026-07-16', 'hints' => ['blocked'], 'tone' => 'red'],
            ['date' => '2026-07-17', 'hints' => ['open 3']],
            ['date' => '2026-07-18', 'hints' => ['hold']],
            ['date' => '2026-07-19', 'hints' => ['VIP confirm'], 'tone' => 'green'],
            ['date' => '2026-07-20', 'hints' => ['open 2']],
            ['date' => '2026-07-21', 'hints' => ['waitlist']],
            ['date' => '2026-07-22', 'hints' => ['open 1']],
            ['date' => '2026-07-23', 'hints' => ['blocked'], 'tone' => 'red'],
            ['date' => '2026-07-24', 'hints' => ['staff 5/6']],
            ['date' => '2026-07-25', 'hints' => ['open 4']],
            ['date' => '2026-07-26', 'hints' => ['deposit ok'], 'tone' => 'green'],
            ['date' => '2026-07-27', 'hints' => ['hold']],
            ['date' => '2026-07-28', 'hints' => ['open 6']],
            ['date' => '2026-07-29', 'hints' => ['room held']],
            ['date' => '2026-07-30', 'hints' => ['open 4']],
            ['date' => '2026-07-31', 'hints' => ['staff 5/6']],
            ['date' => '2026-08-01', 'muted' => true, 'hints' => ['open 2']],
            ['date' => '2026-08-02', 'muted' => true],
        ])->keyBy('date');

        $start = CarbonImmutable::create(2026, 6, 29);

        return collect(range(0, 34))->map(function (int $offset) use ($start, $calendarMeta, $bookings, $attempts): array {
            $day = $start->addDays($offset);
            $date = $day->toDateString();
            $meta = $calendarMeta->get($date, []);
            $dayBookings = $bookings
                ->filter(fn (Booking $booking): bool => $booking->start_at->toDateString() === $date)
                ->values();
            $blockedAttempts = $attempts
                ->filter(fn (BookingAttempt $attempt): bool => $attempt->status === 'blocked' && $attempt->start_at?->toDateString() === $date)
                ->values();

            return [
                'date' => $date,
                'label' => $day->format('M j'),
                'muted' => (bool) ($meta['muted'] ?? false),
                'active' => (bool) ($meta['active'] ?? false),
                'tone' => $meta['tone'] ?? null,
                'hints' => $meta['hints'] ?? [],
                'bookings' => $dayBookings->map(fn (Booking $booking): array => $this->bookingPayload($booking))->values(),
                'blockedAttempts' => $blockedAttempts->map(fn (BookingAttempt $attempt): array => $this->attemptPayload($attempt))->values(),
            ];
        })->values()->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function customerPayload(Customer $customer): array
    {
        $customer->loadMissing([
            'bookings.staff',
            'bookings.resource',
            'bookings.constraint',
            'bookingAttempts.staff',
            'bookingAttempts.resource',
            'bookingAttempts.constraint',
            'bookingAttempts.blockingBooking',
            'bookingAttempts.attemptedBooking',
        ]);

        return [
            'id' => $customer->id,
            'name' => $customer->name,
            'email' => $customer->email,
            'phone' => $customer->phone,
            'tier' => $customer->tier,
            'visitCount' => $customer->visit_count,
            'lifetimeValue' => '$'.number_format($customer->lifetime_value_cents / 100, 2),
            'notes' => $customer->notes,
            'bookings' => $customer->bookings->sortBy('start_at')->map(fn (Booking $booking): array => $this->bookingPayload($booking))->values(),
            'attempts' => $customer->bookingAttempts->sortByDesc('created_at')->map(fn (BookingAttempt $attempt): array => $this->attemptPayload($attempt))->values(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function staffPayload(Staff $staff): array
    {
        return [
            'id' => $staff->id,
            'name' => $staff->name,
            'role' => $staff->role,
            'skills' => $staff->skills ?? [],
            'shiftStart' => $staff->shift_start,
            'shiftEnd' => $staff->shift_end,
            'acceptsOverlap' => $staff->accepts_overlap,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function resourcePayload(Resource $resource): array
    {
        return [
            'id' => $resource->id,
            'name' => $resource->name,
            'type' => $resource->type,
            'capacity' => $resource->capacity,
            'zone' => $resource->zone,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function constraintPayload(SchedulingConstraint $constraint): array
    {
        return [
            'id' => $constraint->id,
            'serviceName' => $constraint->service_name,
            'durationMinutes' => $constraint->duration_minutes,
            'bufferMinutes' => $constraint->buffer_minutes,
            'requiredResourceType' => $constraint->required_resource_type,
            'bookingWindowStart' => $constraint->booking_window_start,
            'bookingWindowEnd' => $constraint->booking_window_end,
            'isActive' => $constraint->is_active,
            'mockPaymentPolicy' => $constraint->mock_payment_policy,
            'notes' => $constraint->notes,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function bookingPayload(Booking $booking): array
    {
        $booking->loadMissing(['customer', 'staff', 'resource', 'constraint']);

        return [
            'id' => $booking->id,
            'customerId' => $booking->customer_id,
            'customerName' => $booking->customer?->name,
            'staffId' => $booking->staff_id,
            'staffName' => $booking->staff?->name,
            'resourceId' => $booking->resource_id,
            'resourceName' => $booking->resource?->name,
            'constraintId' => $booking->constraint_id,
            'serviceName' => $booking->constraint?->service_name,
            'startAt' => $booking->start_at->toIso8601String(),
            'endAt' => $booking->end_at->toIso8601String(),
            'status' => $booking->status,
            'paymentStatus' => $booking->payment_status,
            'notes' => $booking->notes,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function attemptPayload(BookingAttempt $attempt): array
    {
        $attempt->loadMissing(['customer', 'staff', 'resource', 'constraint', 'blockingBooking', 'attemptedBooking']);

        return [
            'id' => $attempt->id,
            'customerName' => $attempt->customer?->name,
            'staffName' => $attempt->staff?->name,
            'resourceName' => $attempt->resource?->name,
            'serviceName' => $attempt->constraint?->service_name,
            'startAt' => $attempt->start_at?->toIso8601String(),
            'endAt' => $attempt->end_at?->toIso8601String(),
            'status' => $attempt->status,
            'conflictKind' => $attempt->conflict_kind,
            'blockingBookingId' => $attempt->blocking_booking_id,
            'attemptedBookingId' => $attempt->attempted_booking_id,
            'reason' => $attempt->reason,
            'paymentBoundary' => $attempt->payment_boundary,
            'payload' => $attempt->payload,
        ];
    }

    private function newCustomerId(string $name): string
    {
        $base = 'cust-'.Str::slug($name);
        $base = $base === 'cust-' ? 'cust-customer' : $base;

        if (! Customer::query()->whereKey($base)->exists()) {
            return $base;
        }

        do {
            $id = $base.'-'.Str::lower(Str::random(5));
        } while (Customer::query()->whereKey($id)->exists());

        return $id;
    }
}
