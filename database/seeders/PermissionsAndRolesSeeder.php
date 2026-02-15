<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\TeamRole;

class PermissionsAndRolesSeeder extends Seeder
{
    /**
     * Seed the permissions and system default team roles.
     *
     * Creates all permissions used throughout the application
     * and 4 system roles (Owner, Admin, Member, Viewer) with
     * appropriate permission assignments.
     *
     * System roles have team_id = NULL and is_system = true.
     * When a new team is created, Team::boot() automatically
     * copies these system roles to the team via copyDefaultRoles().
     */
    public function run(): void
    {
        // All permissions used in the application
        $permissions = [
            // Project permissions
            ['name' => 'project.view',       'display_name' => 'View Project',         'description' => 'View project details and settings',          'category' => 'project'],
            ['name' => 'project.edit',       'display_name' => 'Edit Project',         'description' => 'Edit project settings and configuration',    'category' => 'project'],
            ['name' => 'project.delete',     'display_name' => 'Delete Project',       'description' => 'Delete project permanently',                 'category' => 'project'],

            // Schema/Database permissions
            ['name' => 'schema.view',        'display_name' => 'View Schemas',         'description' => 'View database schemas and tables',           'category' => 'schema'],
            ['name' => 'schema.edit',        'display_name' => 'Edit Schemas',         'description' => 'Edit database schemas, tables and fields',   'category' => 'schema'],

            // Template permissions
            ['name' => 'template.view',      'display_name' => 'View Templates',       'description' => 'View templates and template files',          'category' => 'template'],
            ['name' => 'template.edit',      'display_name' => 'Edit Templates',       'description' => 'Edit templates and template files',          'category' => 'template'],

            // Code generation permissions
            ['name' => 'generation.run',     'display_name' => 'Run Generation',       'description' => 'Execute code generation from templates',     'category' => 'generation'],
            ['name' => 'generation.deploy',  'display_name' => 'Deploy Code',          'description' => 'Deploy generated code via FTP/SSH',          'category' => 'generation'],

            // Team management permissions
            ['name' => 'manage_team',        'display_name' => 'Manage Team',          'description' => 'Manage team members and invitations',        'category' => 'team'],
            ['name' => 'manage_roles',       'display_name' => 'Manage Roles',         'description' => 'Create, edit and delete team roles',         'category' => 'team'],

            // Feature-specific permissions
            ['name' => 'forms.manage',       'display_name' => 'Manage Forms',         'description' => 'Create and edit form definitions',           'category' => 'features'],
            ['name' => 'kanban.use',         'display_name' => 'Use Kanban Board',     'description' => 'Access and manage kanban board',             'category' => 'features'],
            ['name' => 'messaging.send',     'display_name' => 'Send Messages',        'description' => 'Send messages within the project',           'category' => 'features'],
        ];

        // Create all permissions (updateOrCreate to be idempotent)
        $permissionModels = [];
        foreach ($permissions as $permData) {
            $permissionModels[$permData['name']] = Permission::updateOrCreate(
                ['name' => $permData['name']],
                $permData
            );
        }

        $this->command->info('Permissions created: ' . count($permissionModels));

        // System default roles (team_id = NULL, is_system = true)
        // These get copied to each new team automatically
        $systemRoles = [
            [
                'slug' => 'owner',
                'name' => 'Owner',
                'description' => 'Team owner with full access to all features',
                'sort_order' => 1,
                // Owner has ALL permissions (enforced by code, but we assign them anyway for display)
                'permissions' => array_keys($permissionModels),
            ],
            [
                'slug' => 'admin',
                'name' => 'Admin',
                'description' => 'Team administrator with broad access',
                'sort_order' => 2,
                'permissions' => [
                    'project.view', 'project.edit',
                    'schema.view', 'schema.edit',
                    'template.view', 'template.edit',
                    'generation.run', 'generation.deploy',
                    'manage_team',
                    'forms.manage', 'kanban.use', 'messaging.send',
                ],
            ],
            [
                'slug' => 'member',
                'name' => 'Member',
                'description' => 'Team member with standard access',
                'sort_order' => 3,
                'permissions' => [
                    'project.view',
                    'schema.view', 'schema.edit',
                    'template.view', 'template.edit',
                    'generation.run',
                    'forms.manage', 'kanban.use', 'messaging.send',
                ],
            ],
            [
                'slug' => 'viewer',
                'name' => 'Viewer',
                'description' => 'Read-only access to project resources',
                'sort_order' => 4,
                'permissions' => [
                    'project.view',
                    'schema.view',
                    'template.view',
                ],
            ],
        ];

        foreach ($systemRoles as $roleData) {
            $permissionNames = $roleData['permissions'];
            unset($roleData['permissions']);

            $role = TeamRole::updateOrCreate(
                ['team_id' => null, 'slug' => $roleData['slug']],
                array_merge($roleData, ['is_system' => true])
            );

            // Sync permissions for this role
            $permissionIds = [];
            foreach ($permissionNames as $permName) {
                if (isset($permissionModels[$permName])) {
                    $permissionIds[] = $permissionModels[$permName]->id;
                }
            }
            $role->syncPermissions($permissionIds);

            $this->command->info('  Role "' . $role->name . '" with ' . count($permissionIds) . ' permissions');
        }

        $this->command->info('System roles created: ' . count($systemRoles));
    }
}
