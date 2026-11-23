<?php

use App\Models\User;
use App\Notifications\RegistrationAttemptForExistingAccount;
use App\Services\AuthFail2Ban;
use App\Services\RegistrationValidationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

/**
 * Auth fail2ban + account enumeration regression tests.
 *
 * Runs against scoriet_testing (phpunit.xml) with RefreshDatabase from
 * tests/Pest.php.
 */
function requestFromIp(string $ip): Request
{
    return Request::create('/api/oauth/token', 'POST', [], [], [], ['REMOTE_ADDR' => $ip]);
}

function passwordGrant(string $login, string $password, string $ip = '203.0.113.10'): array
{
    return [
        'payload' => [
            'grant_type' => 'password',
            'client_id' => '1',
            'client_secret' => 'irrelevant',
            'username' => $login,
            'password' => $password,
        ],
        'server' => ['REMOTE_ADDR' => $ip],
    ];
}

describe('AuthFail2Ban service', function () {
    test('bans after max_retry failures with escalating durations', function () {
        $fail2ban = app(AuthFail2Ban::class);
        $request = requestFromIp('198.51.100.1');

        $fail2ban->recordFailure($request, 'test');
        $fail2ban->recordFailure($request, 'test');
        expect($fail2ban->isBanned($request))->toBeFalse();

        $fail2ban->recordFailure($request, 'test');
        expect($fail2ban->isBanned($request))->toBeTrue();

        // Ban #1: 10s
        $this->travel(9)->seconds();
        expect($fail2ban->isBanned($request))->toBeTrue();
        $this->travel(2)->seconds();
        expect($fail2ban->isBanned($request))->toBeFalse();

        // Ban #2: 50s
        foreach (range(1, 3) as $i) {
            $fail2ban->recordFailure($request, 'test');
        }
        $this->travel(49)->seconds();
        expect($fail2ban->isBanned($request))->toBeTrue();
        $this->travel(2)->seconds();
        expect($fail2ban->isBanned($request))->toBeFalse();

        // Ban #3: 180s
        foreach (range(1, 3) as $i) {
            $fail2ban->recordFailure($request, 'test');
        }
        $this->travel(179)->seconds();
        expect($fail2ban->isBanned($request))->toBeTrue();
        $this->travel(2)->seconds();
        expect($fail2ban->isBanned($request))->toBeFalse();
    });

    test('attempts during a ban are dropped and do not extend it', function () {
        $fail2ban = app(AuthFail2Ban::class);
        $request = requestFromIp('198.51.100.2');

        foreach (range(1, 3) as $i) {
            $fail2ban->recordFailure($request, 'test');
        }
        foreach (range(1, 10) as $i) {
            $fail2ban->recordFailure($request, 'test');
        }

        expect($fail2ban->status('198.51.100.2')['level'])->toBe(1);
        $this->travel(11)->seconds();
        expect($fail2ban->isBanned($request))->toBeFalse();
    });

    test('failures outside the find_time window do not count', function () {
        $fail2ban = app(AuthFail2Ban::class);
        $request = requestFromIp('198.51.100.3');

        $fail2ban->recordFailure($request, 'test');
        $fail2ban->recordFailure($request, 'test');
        $this->travel(config('scoriet.auth_fail2ban.find_time') + 1)->seconds();
        $fail2ban->recordFailure($request, 'test');

        expect($fail2ban->isBanned($request))->toBeFalse();
    });

    test('ignored IPs and other IPs are never affected', function () {
        config(['scoriet.auth_fail2ban.ignore_ips' => ['198.51.100.4']]);
        $fail2ban = app(AuthFail2Ban::class);

        foreach (range(1, 5) as $i) {
            $fail2ban->recordFailure(requestFromIp('198.51.100.4'), 'test');
            $fail2ban->recordFailure(requestFromIp('198.51.100.5'), 'test');
        }

        expect($fail2ban->isBanned(requestFromIp('198.51.100.4')))->toBeFalse()
            ->and($fail2ban->isBanned(requestFromIp('198.51.100.5')))->toBeTrue()
            ->and($fail2ban->isBanned(requestFromIp('198.51.100.6')))->toBeFalse();
    });

    test('unban lifts the ban, reset clears the escalation level', function () {
        $fail2ban = app(AuthFail2Ban::class);
        $request = requestFromIp('198.51.100.7');

        foreach (range(1, 3) as $i) {
            $fail2ban->recordFailure($request, 'test');
        }
        $fail2ban->unban('198.51.100.7');
        expect($fail2ban->isBanned($request))->toBeFalse()
            ->and($fail2ban->status('198.51.100.7')['level'])->toBe(1);

        $fail2ban->unban('198.51.100.7', true);
        expect($fail2ban->status('198.51.100.7')['level'])->toBe(0);
    });
});

describe('OAuth password grant', function () {
    test('unknown email, unknown username and wrong password are indistinguishable', function () {
        User::factory()->create(['email' => 'known@example.com', 'username' => 'known_user']);

        $responses = [];
        foreach ([['nobody@example.com', 'whatever1'], ['nobody_here', 'whatever1'], ['known@example.com', 'wrong-pass']] as $i => [$login, $password]) {
            // Separate IPs so fail2ban does not interfere with this comparison.
            $grant = passwordGrant($login, $password, '203.0.113.'.(20 + $i));
            $response = $this->withServerVariables($grant['server'])->postJson('/api/oauth/token', $grant['payload']);
            $responses[] = [$response->status(), $response->json()];
        }

        expect($responses[0])->toBe($responses[1])
            ->and($responses[1])->toBe($responses[2])
            ->and($responses[0][0])->toBe(401);
    });

    test('a banned IP gets the wrong-password response even with the correct password', function () {
        User::factory()->create(['email' => 'victim@example.com', 'password' => 'correct-horse']);

        $wrong = passwordGrant('victim@example.com', 'wrong-pass', '203.0.113.30');
        foreach (range(1, 3) as $i) {
            $failure = $this->withServerVariables($wrong['server'])->postJson('/api/oauth/token', $wrong['payload']);
        }

        $right = passwordGrant('victim@example.com', 'correct-horse', '203.0.113.30');
        $banned = $this->withServerVariables($right['server'])->postJson('/api/oauth/token', $right['payload']);

        expect([$banned->status(), $banned->json()])->toBe([$failure->status(), $failure->json()]);

        // After the 10s ban the credentials are evaluated again (the request
        // then proceeds to Passport, which rejects the fake test client).
        $this->travel(11)->seconds();
        $after = $this->withServerVariables($right['server'])->postJson('/api/oauth/token', $right['payload']);
        expect($after->json('error'))->not->toBe('invalid_credentials');
    });

    test('unverified email is only revealed after the correct password', function () {
        User::factory()->unverified()->create(['email' => 'pending@example.com', 'password' => 'correct-horse']);

        $wrong = passwordGrant('pending@example.com', 'wrong-pass', '203.0.113.40');
        $this->withServerVariables($wrong['server'])->postJson('/api/oauth/token', $wrong['payload'])
            ->assertStatus(401)
            ->assertJsonMissing(['email_verification_required' => true]);

        $right = passwordGrant('pending@example.com', 'correct-horse', '203.0.113.40');
        $this->withServerVariables($right['server'])->postJson('/api/oauth/token', $right['payload'])
            ->assertStatus(403)
            ->assertJson(['email_verification_required' => true]);
    });
});

describe('Registration does not reveal existing emails', function () {
    beforeEach(function () {
        config(['app.registration_open' => true]);
        Notification::fake();
        $this->mock(RegistrationValidationService::class)
            ->shouldReceive('validate')->andReturn(['valid' => true, 'errors' => []]);
    });

    test('registering an existing email answers like a new registration and mails the owner', function () {
        $owner = User::factory()->create(['email' => 'taken@example.com']);

        $fresh = $this->postJson('/api/auth/register', [
            'name' => 'Fresh', 'username' => 'fresh_user', 'email' => 'fresh@example.com',
            'password' => 'password123', 'password_confirmation' => 'password123',
        ]);

        $taken = $this->postJson('/api/auth/register', [
            'name' => 'Attacker', 'username' => 'attacker_user', 'email' => 'taken@example.com',
            'password' => 'password123', 'password_confirmation' => 'password123',
        ]);

        expect([$taken->status(), $taken->json()])->toBe([$fresh->status(), $fresh->json()])
            ->and($fresh->status())->toBe(201);

        expect(User::where('email', 'taken@example.com')->count())->toBe(1)
            ->and(User::where('username', 'attacker_user')->exists())->toBeFalse();

        Notification::assertSentTo($owner, RegistrationAttemptForExistingAccount::class);
    });

    test('the owner is mailed at most once per hour', function () {
        $owner = User::factory()->create(['email' => 'taken2@example.com']);

        foreach (['a_user', 'b_user'] as $username) {
            $this->postJson('/api/auth/register', [
                'name' => 'X', 'username' => $username, 'email' => 'taken2@example.com',
                'password' => 'password123', 'password_confirmation' => 'password123',
            ])->assertStatus(201);
        }

        Notification::assertSentToTimes($owner, RegistrationAttemptForExistingAccount::class, 1);
    });
});

describe('Password reset does not reveal existing emails', function () {
    test('forgot-password answers identically for known and unknown emails', function () {
        Notification::fake();
        User::factory()->create(['email' => 'known-reset@example.com']);

        $known = $this->postJson('/api/auth/forgot-password', ['email' => 'known-reset@example.com']);
        $unknown = $this->postJson('/api/auth/forgot-password', ['email' => 'unknown-reset@example.com']);

        expect([$unknown->status(), $unknown->json()])->toBe([$known->status(), $known->json()])
            ->and($known->status())->toBe(200);
    });

    test('validate-reset-token answers identically for unknown emails and bad tokens', function () {
        User::factory()->create(['email' => 'known-token@example.com']);

        $known = $this->postJson('/api/auth/validate-reset-token', ['email' => 'known-token@example.com', 'token' => 'bad']);
        $unknown = $this->postJson('/api/auth/validate-reset-token', ['email' => 'unknown-token@example.com', 'token' => 'bad']);

        expect([$unknown->status(), $unknown->json()])->toBe([$known->status(), $known->json()])
            ->and($known->status())->toBe(400);
    });
});
