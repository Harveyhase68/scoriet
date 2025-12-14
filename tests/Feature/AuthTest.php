<?php

/**
 * Basic Application Tests
 *
 * These tests verify core functionality without requiring
 * complex database migrations (avoiding CI migration conflicts).
 */

describe('Basic Application', function () {
    test('homepage loads successfully', function () {
        $response = $this->get('/');

        $response->assertStatus(200);
    });

    test('api health check responds', function () {
        // Test that the API is reachable
        $response = $this->getJson('/api/user');

        // Should return 401 (unauthorized) not 500 (server error)
        $response->assertStatus(401);
    });

    test('registration validation works', function () {
        // Test validation without actually creating users
        $userData = [
            'name' => '',
            'email' => 'invalid-email',
            'password' => '123',
            'password_confirmation' => 'different'
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        // Should return validation error, not server error
        $response->assertStatus(422);
    });
});