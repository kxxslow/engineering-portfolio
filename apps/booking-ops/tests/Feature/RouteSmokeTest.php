<?php

namespace Tests\Feature;

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RouteSmokeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();
    }

    /**
     * @return array<string, array{0: string}>
     */
    public static function routeProvider(): array
    {
        return [
            'dashboard' => ['/'],
            'schedule' => ['/schedule'],
            'staff' => ['/staff'],
            'settings' => ['/settings'],
            'customers' => ['/customers'],
            'new customer' => ['/customers/new'],
            'customer detail' => ['/customers/cust-mira'],
            'booking detail' => ['/bookings/bk-1001'],
        ];
    }

    #[DataProvider('routeProvider')]
    public function test_route_returns_success(string $route): void
    {
        $version = app(HandleInertiaRequests::class)->version(Request::create($route));

        $this->get($route, [
            'X-Inertia' => 'true',
            'X-Inertia-Version' => $version ?? '',
        ])->assertOk();
    }
}
