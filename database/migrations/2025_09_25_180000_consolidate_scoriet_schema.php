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
        // Laravel default tables
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('username')->unique()->nullable();
            $table->enum('user_type', ['free', 'premium', 'admin', 'system'])->default('free');
            $table->string('language', 5)->default('en');
            $table->timestamp('premium_expires_at')->nullable();
            // Foreign key will be added later after project_invitations table is created
            $table->unsignedBigInteger('pending_project_invitation_id')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });

        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        Schema::create('job_batches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->mediumText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });

        // Projects table
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_public')->default(true);
            $table->string('join_code', 20)->unique()->nullable();
            $table->boolean('allow_join_requests')->default(false);
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->index(['owner_id', 'is_active']);
            $table->index('name');
        });

        // Teams table
        Schema::create('teams', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('project_owner_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('project_id')->nullable()->constrained('projects')->onDelete('set null');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['project_owner_id', 'project_id']);
        });

        // Team members table
        Schema::create('team_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('role', ['owner', 'admin', 'member'])->default('member');
            $table->timestamp('joined_at')->nullable();
            $table->timestamps();

            $table->unique(['team_id', 'user_id']);
        });

        // Project members table
        Schema::create('project_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('role', ['owner', 'admin', 'member'])->default('member');
            $table->timestamp('joined_at')->useCurrent();
            $table->foreignId('invited_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['project_id', 'user_id']);
            $table->index(['project_id', 'role']);
        });

        // Project teams association table
        Schema::create('project_teams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('team_id')->constrained('teams')->onDelete('cascade');
            $table->timestamp('assigned_at')->useCurrent();
            $table->foreignId('assigned_by')->constrained('users');
            $table->timestamps();

            // Ensure unique project-team combinations
            $table->unique(['project_id', 'team_id']);

            // Indexes for better performance
            $table->index(['project_id', 'assigned_at']);
            $table->index(['team_id', 'assigned_at']);
        });

        // Project applications table
        Schema::create('project_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('join_code')->index();
            $table->text('message')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->timestamps();

            $table->unique(['project_id', 'user_id']);
        });

        // Project invitations table
        Schema::create('project_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('invited_by')->constrained('users');
            $table->foreignId('invited_user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->string('invited_email');
            $table->enum('role', ['member', 'admin'])->default('member');
            $table->enum('status', ['pending', 'accepted', 'declined', 'expired'])->default('pending');
            $table->text('message')->nullable();
            $table->string('token', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->index(['project_id', 'status']);
            $table->index(['invited_email', 'status']);
            $table->index(['token', 'expires_at']);
        });

        // Schemas table (floating schemas)
        Schema::create('schemas', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->enum('visibility', ['private', 'public'])->default('private');
            $table->boolean('is_template_schema')->default(false);
            $table->integer('current_version')->default(1);
            $table->integer('last_version')->default(1);
            $table->timestamps();

            $table->index(['owner_id', 'visibility']);
            $table->index('is_template_schema');
            $table->unique(['owner_id', 'name'], 'owner_schema_name_unique');
        });

        // Schema versions table
        Schema::create('schema_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schema_id')->constrained('schemas')->onDelete('cascade');
            $table->integer('version_number')->default(1);
            $table->string('version_name', 100);
            $table->text('description')->nullable();
            $table->boolean('has_unsaved_changes')->default(false);
            $table->timestamp('imported_at')->nullable();
            $table->timestamps();

            $table->index(['schema_id', 'version_number']);
            $table->index('version_name');
        });

        // Schema tables
        Schema::create('schema_tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schema_id')->constrained('schemas')->onDelete('cascade');
            $table->foreignId('schema_version_id')->constrained('schema_versions')->onDelete('cascade');
            $table->string('table_name');
            $table->timestamps();

            $table->unique(['schema_version_id', 'table_name']);
            $table->index('table_name');
            $table->index('schema_id');
        });

        // Schema fields
        Schema::create('schema_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('table_id')->constrained('schema_tables')->onDelete('cascade');
            $table->string('field_name');
            $table->string('field_type', 100);
            $table->boolean('is_unsigned')->default(false);
            $table->boolean('is_nullable')->default(true);
            $table->text('default_value')->nullable();
            $table->boolean('is_auto_increment')->default(false);
            $table->integer('field_order')->default(0);
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['table_id', 'field_name']);
            $table->index('field_name');
        });

        // Schema constraints
        Schema::create('schema_constraints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('table_id')->constrained('schema_tables')->onDelete('cascade');
            $table->string('constraint_name')->nullable();
            $table->enum('constraint_type', ['PRIMARY KEY', 'UNIQUE', 'KEY', 'FOREIGN KEY', 'INDEX']);
            $table->timestamps();

            $table->index('constraint_type');
            $table->index('constraint_name');
        });

        // Schema constraint columns
        Schema::create('schema_constraint_columns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('constraint_id')->constrained('schema_constraints')->onDelete('cascade');
            $table->foreignId('field_id')->constrained('schema_fields')->onDelete('cascade');
            $table->integer('column_order')->default(0);
            $table->timestamps();

            $table->unique(['constraint_id', 'field_id'], 'constraint_field_unique');
        });

        // Schema foreign key references
        Schema::create('schema_foreign_key_references', function (Blueprint $table) {
            $table->id();
            $table->foreignId('constraint_id')->constrained('schema_constraints')->onDelete('cascade');
            $table->foreignId('referenced_table_id')->constrained('schema_tables')->onDelete('cascade');
            $table->timestamps();

            $table->unique('constraint_id', 'fk_ref_constraint_unique');
        });

        // Schema foreign key reference columns
        Schema::create('schema_foreign_key_reference_columns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reference_id')->constrained('schema_foreign_key_references')->onDelete('cascade');
            $table->foreignId('referenced_field_id')->constrained('schema_fields')->onDelete('cascade');
            $table->integer('column_order')->default(0);
            $table->timestamps();

            $table->unique(['reference_id', 'referenced_field_id'], 'fk_ref_col_unique');
        });

        // Schema designer layouts
        Schema::create('schema_designer_layouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schema_id')->constrained('schemas')->onDelete('cascade');
            $table->integer('version_number');
            $table->json('layout_data');
            $table->timestamps();

            $table->unique(['schema_id', 'version_number']);
        });

        // Templates table
        Schema::create('templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('full_name', 500)->nullable();
            $table->text('description')->nullable();
            $table->enum('category', ['Web', 'Mobile', 'API', 'Desktop', 'Database', 'E-Commerce', 'CMS', 'Dashboard', 'Fullstack']);
            $table->string('language', 50);
            $table->boolean('is_active')->default(true);
            $table->json('tags')->nullable();
            $table->integer('file_count')->default(0);
            $table->foreignId('creator_user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->foreignId('project_id')->nullable()->constrained('projects')->onDelete('cascade');
            $table->enum('visibility', ['private', 'public'])->default('private');
            $table->boolean('is_system_template')->default(false);
            $table->foreignId('original_template_id')->nullable()->constrained('templates')->onDelete('set null');
            $table->json('template_files')->nullable();
            $table->timestamps();

            $table->index(['category', 'is_active']);
            $table->index('language');
            $table->index(['creator_user_id', 'visibility']);
            $table->index(['project_id', 'visibility']);
            $table->index(['is_system_template', 'visibility']);
            $table->index('full_name');
        });

        // Template files
        Schema::create('template_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained()->onDelete('cascade');
            $table->string('file_name');
            $table->string('file_path');
            $table->text('file_content');
            $table->string('file_type', 50)->default('template');
            $table->enum('content_type', ['text', 'zip'])->default('text');
            $table->string('zip_filename')->nullable();
            $table->string('output_path')->nullable();
            $table->integer('file_order')->default(0);
            $table->timestamps();

            $table->index(['template_id', 'file_type']);
        });

        // Template schema dependencies
        Schema::create('template_schema_dependencies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained()->onDelete('cascade');
            $table->foreignId('schema_id')->constrained()->onDelete('cascade');
            $table->boolean('is_required')->default(true);
            $table->string('alias')->nullable();
            $table->timestamps();

            $table->unique(['template_id', 'schema_id']);
        });

        // Project schemas associations
        Schema::create('project_schemas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('schema_id')->constrained()->onDelete('cascade');
            $table->enum('association_type', ['linked', 'cloned', 'imported'])->default('linked');
            $table->string('alias')->nullable();
            $table->timestamps();

            $table->unique(['project_id', 'schema_id']);
            $table->index('association_type');
        });

        // Project template usage
        Schema::create('project_template_usage', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('template_id')->constrained('templates')->onDelete('cascade');
            $table->enum('usage_type', ['linked', 'cloned']);
            $table->string('alias')->nullable();
            $table->json('config')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('used_at')->useCurrent();
            $table->timestamps();

            $table->index(['project_id', 'usage_type']);
            $table->index(['template_id', 'usage_type']);
            $table->unique(['project_id', 'template_id'], 'project_template_unique');
        });

        // Legacy project templates table (for backward compatibility)
        Schema::create('project_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schema_version_id')->constrained()->onDelete('cascade');
            $table->foreignId('template_id')->constrained()->onDelete('cascade');
            $table->boolean('is_enabled')->default(true);
            $table->json('template_config')->nullable();
            $table->timestamps();

            $table->unique(['schema_version_id', 'template_id'], 'project_template_unique_legacy');
            $table->index('is_enabled');
        });

        // Legacy table templates table (for backward compatibility)
        Schema::create('table_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schema_table_id')->constrained()->onDelete('cascade');
            $table->foreignId('template_id')->constrained()->onDelete('cascade');
            $table->boolean('is_enabled')->default(true);
            $table->json('template_config')->nullable();
            $table->timestamps();

            $table->unique(['schema_table_id', 'template_id'], 'table_template_unique');
            $table->index('is_enabled');
        });

        // Add foreign key constraints that depend on tables created later
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('pending_project_invitation_id')->references('id')->on('project_invitations')->onDelete('set null');
        });

        // Create system user and sample data
        $this->createSampleData();
    }

    /**
     * Create sample data for the application
     */
    private function createSampleData(): void
    {
        // Create system user
        DB::table('users')->insert([
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

        // Create sample schemas
        $schemas = [
            [
                'name' => 'E-Commerce Standard',
                'description' => 'Standard e-commerce database schema with users, products, orders, and payments',
                'owner_id' => $systemUser->id,
                'visibility' => 'public',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Blog CMS',
                'description' => 'Content management schema for blogs with posts, categories, tags, and comments',
                'owner_id' => $systemUser->id,
                'visibility' => 'public',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'User Authentication',
                'description' => 'Standard user authentication and profile management schema',
                'owner_id' => $systemUser->id,
                'visibility' => 'public',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Dashboard Analytics',
                'description' => 'Analytics and reporting schema with metrics, events, and dashboards',
                'owner_id' => $systemUser->id,
                'visibility' => 'public',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        foreach ($schemas as $schema) {
            DB::table('schemas')->insert($schema);
        }

        // Create sample templates
        $templates = [
            [
                'name' => 'react_ecommerce_starter',
                'full_name' => 'Global/react_ecommerce_starter',
                'description' => 'Complete React-based e-commerce application with TypeScript',
                'category' => 'E-Commerce',
                'creator_user_id' => $systemUser->id,
                'visibility' => 'public',
                'is_system_template' => true,
                'language' => 'typescript',
                'is_active' => true,
                'file_count' => 9,
                'template_files' => json_encode([
                    'components' => ['ProductList.tsx', 'Cart.tsx', 'Checkout.tsx'],
                    'pages' => ['Shop.tsx', 'Product.tsx', 'Profile.tsx'],
                    'api' => ['products.ts', 'orders.ts', 'auth.ts']
                ]),
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
                'language' => 'typescript',
                'is_active' => true,
                'file_count' => 9,
                'template_files' => json_encode([
                    'components' => ['PostList.tsx', 'PostEditor.tsx', 'CommentSystem.tsx'],
                    'pages' => ['Blog.tsx', 'Post.tsx', 'Admin.tsx'],
                    'api' => ['posts.ts', 'comments.ts', 'categories.ts']
                ]),
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
                'language' => 'typescript',
                'is_active' => true,
                'file_count' => 9,
                'template_files' => json_encode([
                    'components' => ['Charts.vue', 'DataTable.vue', 'Metrics.vue'],
                    'pages' => ['Dashboard.vue', 'Analytics.vue', 'Reports.vue'],
                    'api' => ['analytics.ts', 'metrics.ts', 'reports.ts']
                ]),
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        foreach ($templates as $template) {
            DB::table('templates')->insert($template);
        }

        // Create template-schema dependencies
        $ecommerceTemplate = DB::table('templates')->where('name', 'react_ecommerce_starter')->first();
        $blogTemplate = DB::table('templates')->where('name', 'nextjs_blog_platform')->first();
        $dashboardTemplate = DB::table('templates')->where('name', 'vuejs_dashboard')->first();

        $ecommerceSchema = DB::table('schemas')->where('name', 'E-Commerce Standard')->first();
        $blogSchema = DB::table('schemas')->where('name', 'Blog CMS')->first();
        $authSchema = DB::table('schemas')->where('name', 'User Authentication')->first();
        $analyticsSchema = DB::table('schemas')->where('name', 'Dashboard Analytics')->first();

        $dependencies = [
            ['template_id' => $ecommerceTemplate->id, 'schema_id' => $ecommerceSchema->id, 'is_required' => true, 'alias' => 'ecommerce'],
            ['template_id' => $ecommerceTemplate->id, 'schema_id' => $authSchema->id, 'is_required' => true, 'alias' => 'users'],
            ['template_id' => $blogTemplate->id, 'schema_id' => $blogSchema->id, 'is_required' => true, 'alias' => 'content'],
            ['template_id' => $blogTemplate->id, 'schema_id' => $authSchema->id, 'is_required' => true, 'alias' => 'users'],
            ['template_id' => $dashboardTemplate->id, 'schema_id' => $analyticsSchema->id, 'is_required' => true, 'alias' => 'analytics'],
            ['template_id' => $dashboardTemplate->id, 'schema_id' => $authSchema->id, 'is_required' => true, 'alias' => 'users'],
        ];

        foreach ($dependencies as $dependency) {
            DB::table('template_schema_dependencies')->insert(array_merge($dependency, [
                'created_at' => now(),
                'updated_at' => now()
            ]));
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop tables in reverse order to handle foreign key constraints
        $tables = [
            'table_templates',
            'project_templates',
            'project_template_usage',
            'project_schemas',
            'template_schema_dependencies',
            'template_files',
            'templates',
            'schema_designer_layouts',
            'schema_foreign_key_reference_columns',
            'schema_foreign_key_references',
            'schema_constraint_columns',
            'schema_constraints',
            'schema_fields',
            'schema_tables',
            'schema_versions',
            'schemas',
            'project_invitations',
            'project_applications',
            'project_members',
            'team_members',
            'teams',
            'projects',
            'failed_jobs',
            'job_batches',
            'jobs',
            'cache_locks',
            'cache',
            'sessions',
            'password_reset_tokens',
            'users'
        ];

        foreach ($tables as $table) {
            Schema::dropIfExists($table);
        }
    }
};