<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('tier')->default('standard');
            $table->unsignedInteger('visit_count')->default(0);
            $table->unsignedInteger('lifetime_value_cents')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('staff', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('role');
            $table->json('skills')->nullable();
            $table->string('shift_start')->default('08:00');
            $table->string('shift_end')->default('17:00');
            $table->boolean('accepts_overlap')->default(false);
            $table->timestamps();
        });

        Schema::create('resources', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('type');
            $table->unsignedInteger('capacity')->default(1);
            $table->string('zone')->nullable();
            $table->timestamps();
        });

        Schema::create('constraints', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('service_name');
            $table->unsignedInteger('duration_minutes');
            $table->unsignedInteger('buffer_minutes')->default(0);
            $table->string('required_resource_type')->nullable();
            $table->string('booking_window_start')->default('08:00');
            $table->string('booking_window_end')->default('17:00');
            $table->boolean('is_active')->default(true);
            $table->string('mock_payment_policy')->default('authorize-only');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('bookings', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('customer_id');
            $table->string('staff_id');
            $table->string('resource_id');
            $table->string('constraint_id');
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->string('status')->default('confirmed');
            $table->string('payment_status')->default('mock_authorized');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers');
            $table->foreign('staff_id')->references('id')->on('staff');
            $table->foreign('resource_id')->references('id')->on('resources');
            $table->foreign('constraint_id')->references('id')->on('constraints');
        });

        Schema::create('booking_attempts', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('customer_id')->nullable();
            $table->string('staff_id')->nullable();
            $table->string('resource_id')->nullable();
            $table->string('constraint_id')->nullable();
            $table->string('attempted_booking_id')->nullable();
            $table->dateTime('start_at')->nullable();
            $table->dateTime('end_at')->nullable();
            $table->string('status');
            $table->string('conflict_kind')->nullable();
            $table->string('blocking_booking_id')->nullable();
            $table->text('reason')->nullable();
            $table->string('payment_boundary')->default('mock-only');
            $table->json('payload')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers');
            $table->foreign('staff_id')->references('id')->on('staff');
            $table->foreign('resource_id')->references('id')->on('resources');
            $table->foreign('constraint_id')->references('id')->on('constraints');
            $table->foreign('attempted_booking_id')->references('id')->on('bookings');
            $table->foreign('blocking_booking_id')->references('id')->on('bookings');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_attempts');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('constraints');
        Schema::dropIfExists('resources');
        Schema::dropIfExists('staff');
        Schema::dropIfExists('customers');
    }
};
