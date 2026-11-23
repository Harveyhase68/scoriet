<?php

use App\Models\User;

/**
 * Authentication surface regression tests
 *
 * Scoriet authenticates exclusively through Passport (/api/auth/*,
 * /api/oauth/token). Session-based auth routes from the Laravel starter kit
 * must stay removed: the web middleware group runs CreateFreshApiToken, so
 * any web session becomes a full API credential and would bypass invite-only
 * registration, email verification and 2FA.
 */
describe('Starter kit session auth routes are gone', function () {
    test('web registration cannot create accounts', function () {
        $response = $this->post('/register', [
            'name' => 'Pre-empt',
            'email' => 'victim@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        // Only the GET landing page remains on this path.
        $response->assertStatus(405);
        $this->assertGuest('web');
    });

    test('web login cannot open a session', function () {
        $this->post('/login', [
            'email' => 'someone@example.com',
            'password' => 'password123',
        ])->assertStatus(405);

        $this->assertGuest('web');
    });

    test('web password and profile endpoints do not exist', function (string $method, string $uri) {
        $this->call($method, $uri)->assertNotFound();
    })->with([
        ['POST', '/forgot-password'],
        ['POST', '/reset-password'],
        ['POST', '/confirm-password'],
        ['POST', '/email/verification-notification'],
        ['GET', '/settings/profile'],
        ['PATCH', '/settings/profile'],
        ['PUT', '/settings/password'],
    ]);

    test('password reset email link still renders the SPA', function () {
        $this->get('/reset-password/some-token?email=a@example.com')->assertOk();
    });
});

describe('Admin gate requires a Passport token', function () {
    test('a web session does not grant admin access', function () {
        $admin = new User;
        $admin->id = 999999;
        $admin->user_type = 'system';

        $this->actingAs($admin, 'web')
            ->getJson('/admin/pages')
            ->assertUnauthorized();
    });
});

describe('Auth endpoints are rate limited', function () {
    test('login is throttled per account', function () {
        $payload = ['email' => 'Throttle-Probe@example.invalid', 'password' => 'wrong-password'];

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', $payload)->assertStatus(401);
        }

        // Case variant of the same email shares the bucket.
        $this->postJson('/api/auth/login', [
            'email' => 'throttle-probe@example.invalid',
            'password' => 'wrong-password',
        ])->assertStatus(429);
    });

    test('2fa verification is throttled per ip', function () {
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/auth/login-2fa', [
                'two_factor_token' => 'unknown-'.$i,
                'code' => '000000',
            ])->assertStatus(401);
        }

        $this->postJson('/api/auth/login-2fa', [
            'two_factor_token' => 'unknown-x',
            'code' => '000000',
        ])->assertStatus(429);
    });
});
