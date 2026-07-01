<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchedulingConstraint extends Model
{
    protected $table = 'constraints';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'service_name',
        'duration_minutes',
        'buffer_minutes',
        'required_resource_type',
        'booking_window_start',
        'booking_window_end',
        'is_active',
        'mock_payment_policy',
        'notes',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * @return HasMany<Booking, $this>
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'constraint_id');
    }
}
