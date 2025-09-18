<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Template;

class SystemTemplatesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $systemTemplates = [
            [
                'name' => 'phpcrudtemplate',
                'full_name' => 'scoriet/phpcrudtemplate',
                'description' => 'PHP CRUD Template with Laravel backend and React frontend',
                'creator_user_id' => 3, // First existing user
                'project_id' => null,
                'visibility' => 'public',
                'is_system_template' => true,
                'category' => 'fullstack',
                'language' => 'php',
                'tags' => ['php', 'laravel', 'react', 'crud', 'api'],
                'template_files' => [
                    'models' => ['User.php', 'Product.php'],
                    'controllers' => ['UserController.php', 'ProductController.php'],
                    'migrations' => ['create_users_table.php', 'create_products_table.php'],
                    'components' => ['UserList.tsx', 'ProductForm.tsx']
                ],
                'file_count' => 6,
            ],
            [
                'name' => 'reactstarter',
                'full_name' => 'scoriet/reactstarter',
                'description' => 'React TypeScript starter template with modern tooling',
                'creator_user_id' => 3,
                'project_id' => null,
                'visibility' => 'public',
                'is_system_template' => true,
                'category' => 'frontend',
                'language' => 'typescript',
                'tags' => ['react', 'typescript', 'vite', 'tailwind'],
                'template_files' => [
                    'components' => ['App.tsx', 'Header.tsx', 'Footer.tsx'],
                    'hooks' => ['useApi.ts', 'useAuth.ts'],
                    'utils' => ['api.ts', 'helpers.ts'],
                    'config' => ['vite.config.ts', 'tailwind.config.js']
                ],
                'file_count' => 8,
            ],
            [
                'name' => 'laravelapi',
                'full_name' => 'scoriet/laravelapi',
                'description' => 'Laravel REST API template with authentication and documentation',
                'creator_user_id' => 3,
                'project_id' => null,
                'visibility' => 'public',
                'is_system_template' => true,
                'category' => 'backend',
                'language' => 'php',
                'tags' => ['laravel', 'api', 'rest', 'authentication', 'documentation'],
                'template_files' => [
                    'controllers' => ['AuthController.php', 'ApiController.php'],
                    'middleware' => ['AuthMiddleware.php', 'CorsMiddleware.php'],
                    'requests' => ['LoginRequest.php', 'RegisterRequest.php'],
                    'resources' => ['UserResource.php', 'ApiResource.php']
                ],
                'file_count' => 8,
            ],
            [
                'name' => 'docksystem',
                'full_name' => 'scoriet/docksystem',
                'description' => 'RC-Dock multi-panel interface template like Scoriet',
                'creator_user_id' => 3,
                'project_id' => null,
                'visibility' => 'public',
                'is_system_template' => true,
                'category' => 'ui',
                'language' => 'typescript',
                'tags' => ['react', 'rc-dock', 'panels', 'mdi', 'interface'],
                'template_files' => [
                    'panels' => ['NavigationPanel.tsx', 'SidebarPanel.tsx', 'ContentPanel.tsx'],
                    'hooks' => ['useDock.ts', 'usePanels.ts'],
                    'layouts' => ['DockLayout.tsx', 'PanelLayout.tsx'],
                    'config' => ['dockConfig.ts']
                ],
                'file_count' => 8,
            ]
        ];

        foreach ($systemTemplates as $templateData) {
            Template::create($templateData);
        }

        $this->command->info('System templates created successfully!');
    }
}
