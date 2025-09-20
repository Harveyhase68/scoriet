<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create system user for global DB schemas and templates
        DB::table('users')->insertOrIgnore([
            'name' => 'Scoriet System',
            'username' => 'scoriet-system',
            'email' => 'system@scoriet.dev',
            'password' => Hash::make('system-user-no-login'),
            'user_type' => 'system',
            'language' => 'en',
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $systemUser = DB::table('users')->where('email', 'system@scoriet.dev')->first();

        // Create sample global DB schemas in schemas table
        $dbSchemas = [
            [
                'name' => 'E-Commerce Standard',
                'description' => 'Standard e-commerce database schema with users, products, orders, and payments',
                'owner_id' => $systemUser->id,
                'visibility' => 'public',
                'last_version' => 1,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Blog CMS',
                'description' => 'Content management schema for blogs with posts, categories, tags, and comments',
                'owner_id' => $systemUser->id,
                'visibility' => 'public',
                'last_version' => 1,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'User Authentication',
                'description' => 'Standard user authentication and profile management schema',
                'owner_id' => $systemUser->id,
                'visibility' => 'public',
                'last_version' => 1,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Dashboard Analytics',
                'description' => 'Analytics and reporting schema with metrics, events, and dashboards',
                'owner_id' => $systemUser->id,
                'visibility' => 'public',
                'last_version' => 1,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        foreach ($dbSchemas as $schema) {
            DB::table('schemas')->insertOrIgnore($schema);
        }

        // Create sample global templates
        $templates = [
            [
                'name' => 'react_ecommerce_starter',
                'full_name' => 'Global/react_ecommerce_starter',
                'description' => 'Complete React-based e-commerce application with TypeScript',
                'category' => 'E-Commerce',
                'creator_user_id' => $systemUser->id,
                'visibility' => 'public',
                'is_system_template' => true,
                'template_files' => json_encode([
                    'components' => ['ProductList.tsx', 'Cart.tsx', 'Checkout.tsx'],
                    'pages' => ['Shop.tsx', 'Product.tsx', 'Profile.tsx'],
                    'api' => ['products.ts', 'orders.ts', 'auth.ts']
                ]),
                'language' => 'typescript',
                'is_active' => true,
                'file_count' => 9,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'nextjs_blog_platform',
                'full_name' => 'Global/nextjs_blog_platform',
                'description' => 'Modern blog platform with SSR, markdown support, and admin panel',
                'category' => 'CMS',
                'creator_user_id' => $systemUser->id,
                'visibility' => 'public',
                'is_system_template' => true,
                'template_files' => json_encode([
                    'components' => ['PostList.tsx', 'PostEditor.tsx', 'CommentSystem.tsx'],
                    'pages' => ['Blog.tsx', 'Post.tsx', 'Admin.tsx'],
                    'api' => ['posts.ts', 'comments.ts', 'categories.ts']
                ]),
                'language' => 'typescript',
                'is_active' => true,
                'file_count' => 9,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'vuejs_dashboard',
                'full_name' => 'Global/vuejs_dashboard',
                'description' => 'Admin dashboard with charts, tables, and real-time data',
                'category' => 'Dashboard',
                'creator_user_id' => $systemUser->id,
                'visibility' => 'public',
                'is_system_template' => true,
                'template_files' => json_encode([
                    'components' => ['Charts.vue', 'DataTable.vue', 'Metrics.vue'],
                    'pages' => ['Dashboard.vue', 'Analytics.vue', 'Reports.vue'],
                    'api' => ['analytics.ts', 'metrics.ts', 'reports.ts']
                ]),
                'language' => 'typescript',
                'is_active' => true,
                'file_count' => 9,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        foreach ($templates as $template) {
            DB::table('templates')->insertOrIgnore($template);
        }

        // Create template-DB schema dependencies
        $ecommerceTemplate = DB::table('templates')->where('name', 'react_ecommerce_starter')->first();
        $blogTemplate = DB::table('templates')->where('name', 'nextjs_blog_platform')->first();
        $dashboardTemplate = DB::table('templates')->where('name', 'vuejs_dashboard')->first();

        $ecommerceSchema = DB::table('schemas')->where('name', 'E-Commerce Standard')->first();
        $blogSchema = DB::table('schemas')->where('name', 'Blog CMS')->first();
        $authSchema = DB::table('schemas')->where('name', 'User Authentication')->first();
        $analyticsSchema = DB::table('schemas')->where('name', 'Dashboard Analytics')->first();

        $dependencies = [
            // E-Commerce Template dependencies
            [
                'template_id' => $ecommerceTemplate->id,
                'schema_id' => $ecommerceSchema->id,
                'is_required' => true,
                'alias' => 'ecommerce',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'template_id' => $ecommerceTemplate->id,
                'schema_id' => $authSchema->id,
                'is_required' => true,
                'alias' => 'users',
                'created_at' => now(),
                'updated_at' => now()
            ],
            // Blog Template dependencies
            [
                'template_id' => $blogTemplate->id,
                'schema_id' => $blogSchema->id,
                'is_required' => true,
                'alias' => 'content',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'template_id' => $blogTemplate->id,
                'schema_id' => $authSchema->id,
                'is_required' => true,
                'alias' => 'users',
                'created_at' => now(),
                'updated_at' => now()
            ],
            // Dashboard Template dependencies
            [
                'template_id' => $dashboardTemplate->id,
                'schema_id' => $analyticsSchema->id,
                'is_required' => true,
                'alias' => 'analytics',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'template_id' => $dashboardTemplate->id,
                'schema_id' => $authSchema->id,
                'is_required' => true,
                'alias' => 'users',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        foreach ($dependencies as $dependency) {
            DB::table('template_schema_dependencies')->insertOrIgnore($dependency);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove sample data
        $systemUserId = DB::table('users')->where('email', 'system@scoriet.dev')->value('id');

        if ($systemUserId) {
            // Remove template dependencies
            DB::table('template_schema_dependencies')->whereIn('template_id',
                DB::table('templates')->where('creator_user_id', $systemUserId)->pluck('id')
            )->delete();

            // Remove templates
            DB::table('templates')->where('creator_user_id', $systemUserId)->delete();

            // Remove DB schemas
            DB::table('schemas')->where('owner_id', $systemUserId)->delete();

            // Remove system user
            DB::table('users')->where('email', 'system@scoriet.dev')->delete();
        }
    }
};
