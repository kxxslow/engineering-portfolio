<?php

namespace App\Services;

class MockPaymentBoundary
{
    /**
     * @return array{status: string, external: bool, reference: string}
     */
    public function authorize(string $bookingId): array
    {
        return [
            'status' => 'mock_authorized',
            'external' => false,
            'reference' => 'mock-payment:'.$bookingId,
        ];
    }
}
