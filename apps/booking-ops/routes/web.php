<?php

use App\Http\Controllers\BookingOpsController;
use Illuminate\Support\Facades\Route;

Route::get('/', [BookingOpsController::class, 'dashboard'])->name('dashboard');
Route::get('/schedule', [BookingOpsController::class, 'schedule'])->name('schedule');
Route::get('/staff', [BookingOpsController::class, 'staff'])->name('staff');
Route::get('/settings', [BookingOpsController::class, 'settings'])->name('settings');
Route::get('/customers', [BookingOpsController::class, 'customers'])->name('customers.index');
Route::get('/customers/new', [BookingOpsController::class, 'createCustomer'])->name('customers.create');
Route::post('/customers', [BookingOpsController::class, 'storeCustomer'])->name('customers.store');
Route::get('/customers/{customer}', [BookingOpsController::class, 'customer'])->name('customers.show');
Route::get('/bookings/{booking}', [BookingOpsController::class, 'booking'])->name('bookings.show');
Route::post('/booking-attempts', [BookingOpsController::class, 'storeAttempt'])->name('booking-attempts.store');
