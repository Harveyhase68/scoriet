<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DemoUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Creates two demo users for demo.scoriet.dev:
     * - demo-admin (admin access)
     * - demo-user (standard user access)
     */
    public function run(): void
    {
        // Demo Admin User
        User::updateOrCreate(
            ['email' => 'demo-admin'],
            [
                'name' => 'Demo Administrator',
                'email' => 'demo-admin',
                'password' => Hash::make('demo123'),
                'user_type' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        // Demo Standard User
        User::updateOrCreate(
            ['email' => 'demo-user'],
            [
                'name' => 'Demo User',
                'email' => 'demo-user',
                'password' => Hash::make('demo123'),
                'user_type' => 'free',
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('✅ Demo users created successfully!');
        $this->command->info('   demo-admin / demo123 (Admin)');
        $this->command->info('   demo-user / demo123 (Free User)');
    }
}
