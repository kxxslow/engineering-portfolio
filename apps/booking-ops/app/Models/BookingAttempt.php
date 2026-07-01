<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingAttempt extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'customer_id',
        'staff_id',
        'resource_id',
        'constraint_id',
        'attempted_booking_id',
        'start_at',
        'end_at',
        'status',
        'conflict_kind',
        'blocking_booking_id',
        'reason',
        'payment_boundary',
        'payload',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'payload' => 'array',
    ];

    /**
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * @return BelongsTo<Staff, $this>
     */
    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    /**
     * @return BelongsTo<\App\Models\Resource, $this>
     */
    public function resource(): BelongsTo
    {
        return $this->belongsTo(Resource::class);
    }

    /**
     * @return BelongsTo<SchedulingConstraint, $this>
     */
    public function constraint(): BelongsTo
    {
        return $this->belongsTo(SchedulingConstraint::class, 'constraint_id');
    }

    /**
     * @return BelongsTo<Booking, $this>
     */
    public function attemptedBooking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'attempted_booking_id');
    }

    /**
     * @return BelongsTo<Booking, $this>
     */
    public function blockingBooking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'blocking_booking_id');
    }
}
