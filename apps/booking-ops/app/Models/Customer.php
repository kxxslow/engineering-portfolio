<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'email',
        'phone',
        'tier',
        'visit_count',
        'lifetime_value_cents',
        'notes',
    ];

    /**
     * @return HasMany<Booking, $this>
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * @return HasMany<BookingAttempt, $this>
     */
    public function bookingAttempts(): HasMany
    {
        return $this->hasMany(BookingAttempt::class);
    }
}
