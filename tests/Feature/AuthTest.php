<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Authentication System', function () {
    test('user can register with valid data', function () {
        $userData = [
            'name' => 'Test User',
            'username' => 'testuser',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(201)
                ->assertJson([
                    'message' => 'Benutzer erfolgreich registriert. Bitte überprüfen Sie Ihre E-Mail für den Bestätigungslink.'
                ]);

        $this->assertDatabaseHas('users', [
            'name' => 'Test User',
            'email' => 'test@example.com'
        ]);
    });

    test('registration fails with invalid data', function () {
        $userData = [
            'name' => '',
            'email' => 'invalid-email',
            'password' => '123', // too short
            'password_confirmation' => 'different'
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(422)
                ->assertJson([
                    'message' => 'Validierungsfehler'
                ]);
    });

    test('unauthenticated user cannot access protected routes', function () {
        $response = $this->getJson('/api/user');

        $response->assertStatus(401);
    });

    test('basic application routes work', function () {
        $response = $this->get('/');

        $response->assertStatus(200);
    });
});