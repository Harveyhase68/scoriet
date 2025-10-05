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
        // Find the system user
        $systemUser = \App\Models\User::where('user_type', 'system')->first();
        if (!$systemUser) {
            $this->command->error('System user not found! Please run the consolidated migration first.');
            return;
        }

        $systemTemplates = [
            [
                'name' => 'phpcrudtemplate',
                'full_name' => 'scoriet/phpcrudtemplate',
                'description' => 'PHP CRUD Template with Laravel backend and React frontend',
                'creator_user_id' => $systemUser->id,
                'project_id' => null,
                'visibility' => 'public',
                'is_system_template' => true,
                'category' => 'Fullstack',
                'language' => 'php',
                'tags' => ['php', 'laravel', 'react', 'crud', 'api'],
                'file_count' => 6,
                'files' => [
                    ['file_name' => 'User.php', 'file_path' => 'app/Models/User.php', 'file_content' => '<?php namespace App\Models; class User { public $name; }', 'file_type' => 'model', 'file_order' => 1],
                    ['file_name' => 'Product.php', 'file_path' => 'app/Models/Product.php', 'file_content' => '<?php namespace App\Models; class Product { public $name; public $price; }', 'file_type' => 'model', 'file_order' => 2],
                    ['file_name' => 'UserController.php', 'file_path' => 'app/Http/Controllers/UserController.php', 'file_content' => '<?php namespace App\Http\Controllers; class UserController { }', 'file_type' => 'controller', 'file_order' => 3],
                    ['file_name' => 'ProductController.php', 'file_path' => 'app/Http/Controllers/ProductController.php', 'file_content' => '<?php namespace App\Http\Controllers; class ProductController { }', 'file_type' => 'controller', 'file_order' => 4],
                    ['file_name' => 'UserList.tsx', 'file_path' => 'resources/js/components/UserList.tsx', 'file_content' => 'export const UserList = () => <div>Users</div>;', 'file_type' => 'component', 'file_order' => 5],
                    ['file_name' => 'ProductForm.tsx', 'file_path' => 'resources/js/components/ProductForm.tsx', 'file_content' => 'export const ProductForm = () => <div>Product Form</div>;', 'file_type' => 'component', 'file_order' => 6],
                ]
            ],
            [
                'name' => 'reactstarter',
                'full_name' => 'scoriet/reactstarter',
                'description' => 'React TypeScript starter template with modern tooling',
                'creator_user_id' => $systemUser->id,
                'project_id' => null,
                'visibility' => 'public',
                'is_system_template' => true,
                'category' => 'Web',
                'language' => 'typescript',
                'tags' => ['react', 'typescript', 'vite', 'tailwind'],
                'file_count' => 4,
                'files' => [
                    ['file_name' => 'App.tsx', 'file_path' => 'src/App.tsx', 'file_content' => 'export const App = () => <div>Hello React</div>;', 'file_type' => 'component', 'file_order' => 1],
                    ['file_name' => 'useApi.ts', 'file_path' => 'src/hooks/useApi.ts', 'file_content' => 'export const useApi = () => {};', 'file_type' => 'hook', 'file_order' => 2],
                    ['file_name' => 'api.ts', 'file_path' => 'src/utils/api.ts', 'file_content' => 'export const api = {};', 'file_type' => 'util', 'file_order' => 3],
                    ['file_name' => 'vite.config.ts', 'file_path' => 'vite.config.ts', 'file_content' => 'export default {};', 'file_type' => 'config', 'file_order' => 4],
                ]
            ],
            [
                'name' => 'laravelapi',
                'full_name' => 'scoriet/laravelapi',
                'description' => 'Laravel REST API template with authentication and documentation',
                'creator_user_id' => $systemUser->id,
                'project_id' => null,
                'visibility' => 'public',
                'is_system_template' => true,
                'category' => 'API',
                'language' => 'php',
                'tags' => ['laravel', 'api', 'rest', 'authentication', 'documentation'],
                'file_count' => 4,
                'files' => [
                    ['file_name' => 'AuthController.php', 'file_path' => 'app/Http/Controllers/AuthController.php', 'file_content' => '<?php namespace App\Http\Controllers; class AuthController { }', 'file_type' => 'controller', 'file_order' => 1],
                    ['file_name' => 'ApiController.php', 'file_path' => 'app/Http/Controllers/ApiController.php', 'file_content' => '<?php namespace App\Http\Controllers; class ApiController { }', 'file_type' => 'controller', 'file_order' => 2],
                    ['file_name' => 'AuthMiddleware.php', 'file_path' => 'app/Http/Middleware/AuthMiddleware.php', 'file_content' => '<?php namespace App\Http\Middleware; class AuthMiddleware { }', 'file_type' => 'middleware', 'file_order' => 3],
                    ['file_name' => 'UserResource.php', 'file_path' => 'app/Http/Resources/UserResource.php', 'file_content' => '<?php namespace App\Http\Resources; class UserResource { }', 'file_type' => 'resource', 'file_order' => 4],
                ]
            ],
            [
                'name' => 'docksystem',
                'full_name' => 'scoriet/docksystem',
                'description' => 'RC-Dock multi-panel interface template like Scoriet',
                'creator_user_id' => $systemUser->id,
                'project_id' => null,
                'visibility' => 'public',
                'is_system_template' => true,
                'category' => 'Web',
                'language' => 'typescript',
                'tags' => ['react', 'rc-dock', 'panels', 'mdi', 'interface'],
                'file_count' => 4,
                'files' => [
                    ['file_name' => 'NavigationPanel.tsx', 'file_path' => 'src/components/NavigationPanel.tsx', 'file_content' => 'export const NavigationPanel = () => <div>Navigation</div>;', 'file_type' => 'panel', 'file_order' => 1],
                    ['file_name' => 'useDock.ts', 'file_path' => 'src/hooks/useDock.ts', 'file_content' => 'export const useDock = () => {};', 'file_type' => 'hook', 'file_order' => 2],
                    ['file_name' => 'DockLayout.tsx', 'file_path' => 'src/layouts/DockLayout.tsx', 'file_content' => 'export const DockLayout = () => <div>Dock</div>;', 'file_type' => 'layout', 'file_order' => 3],
                    ['file_name' => 'dockConfig.ts', 'file_path' => 'src/config/dockConfig.ts', 'file_content' => 'export const dockConfig = {};', 'file_type' => 'config', 'file_order' => 4],
                ]
            ]
        ];

        foreach ($systemTemplates as $templateData) {
            $files = $templateData['files'] ?? [];
            unset($templateData['files']);

            $template = Template::create($templateData);

            // Create actual template files
            foreach ($files as $fileData) {
                $template->files()->create($fileData);
            }
        }

        $this->command->info('System templates created successfully!');
    }
}
