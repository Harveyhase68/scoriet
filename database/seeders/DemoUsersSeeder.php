<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\TeamRole;
use Illuminate\Support\Facades\Hash;

class DemoUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Creates demo environment for demo.scoriet.dev:
     * - System user (project/template/database owner)
     * - Demo user (standard user access)
     * - "Scoriet Demo" team connecting both users
     *
     * The system user creates projects, templates and databases.
     * The demo user accesses them via team membership (no cloning needed).
     * The demo user cannot delete system-owned resources.
     *
     * Note: System user is NOT available for login in demo mode.
     */
    public function run(): void
    {
        // Ensure permissions and system roles exist first
        // (needed for Team::boot() -> copyDefaultRoles() to work)
        $this->call(PermissionsAndRolesSeeder::class);

        // System user - owns demo projects, templates, databases
        $systemUser = User::updateOrCreate(
            ['email' => 'office@scoriet.dev'],
            [
                'name' => 'Scoriet System',
                'username' => 'scoriet-system',
                'email' => 'office@scoriet.dev',
                'password' => Hash::make('#System-1234#'), //DELETE SYSTEM USER OR UPDATE PASSWORD!!!
                'user_type' => 'system',
                'email_verified_at' => now(),
            ]
        );

        // Demo Standard User - login via username: demo-user / demo1234
        $demoUser = User::updateOrCreate(
            ['username' => 'demo-user'],
            [
                'name' => 'Demo User',
                'username' => 'demo-user',
                'email' => 'demo-user@scoriet.dev',
                'password' => Hash::make('demo1234'),
                'user_type' => 'free',
                'email_verified_at' => now(),
            ]
        );

        // Create "Scoriet Demo" team owned by system user
        // The demo user gets access to system projects through this team
        $team = Team::updateOrCreate(
            ['name' => 'Scoriet Demo'],
            [
                'name' => 'Scoriet Demo',
                'description' => __('demousersseederphp66'),
                'project_owner_id' => $systemUser->id,
                'is_active' => true,
            ]
        );

        // Get the "owner" and "member" roles for this team
        // (automatically created by Team::boot() -> copyDefaultRoles())
        $ownerRole = TeamRole::where('team_id', $team->id)
            ->where('slug', 'owner')
            ->first();

        $memberRole = TeamRole::where('team_id', $team->id)
            ->where('slug', 'member')
            ->first();

        // Add system user as team owner
        TeamMember::updateOrCreate(
            ['team_id' => $team->id, 'user_id' => $systemUser->id],
            [
                'role' => 'owner',
                'team_role_id' => $ownerRole?->id,
                'joined_at' => now(),
            ]
        );

        // Add demo user as team member
        // Member role: can view and use projects, but cannot delete or manage
        TeamMember::updateOrCreate(
            ['team_id' => $team->id, 'user_id' => $demoUser->id],
            [
                'role' => 'member',
                'team_role_id' => $memberRole?->id,
                'joined_at' => now(),
            ]
        );

        $this->command->info(__('demousersseederphp103'));
        $this->command->info(__('demousersseederphp104'));
        $this->command->info(__('demousersseederphp105'));
        $this->command->info('');
        $this->command->info(__('demousersseederphp107'));
        $this->command->info(__('demousersseederphp108'));
        $this->command->info(__('demousersseederphp109'));
        $this->command->info(__('demousersseederphp110'));
    }
}
