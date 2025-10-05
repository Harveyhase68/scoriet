<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('languages', function (Blueprint $table) {
            $table->id();
            $table->string('code', 5)->unique(); // e.g., 'en', 'de', 'fr', 'es', 'it'
            $table->string('name', 100); // e.g., 'English', 'Deutsch', 'Français'
            $table->string('native_name', 100); // e.g., 'English', 'Deutsch', 'Français'
            $table->string('flag', 10)->nullable(); // Flag emoji or icon code
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->integer('sort_order')->default(0);
            $table->text('description')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
            $table->index('is_default');
        });

        // Insert default languages
        $defaultLanguages = [
            [
                'code' => 'en',
                'name' => 'English',
                'native_name' => 'English',
                'flag' => '🇺🇸',
                'is_active' => true,
                'is_default' => true,
                'sort_order' => 1,
                'description' => 'English language for international users',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'code' => 'de',
                'name' => 'German',
                'native_name' => 'Deutsch',
                'flag' => '🇩🇪',
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 2,
                'description' => 'German language for German-speaking users',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'code' => 'fr',
                'name' => 'French',
                'native_name' => 'Français',
                'flag' => '🇫🇷',
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 3,
                'description' => 'French language for French-speaking users',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'code' => 'es',
                'name' => 'Spanish',
                'native_name' => 'Español',
                'flag' => '🇪🇸',
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 4,
                'description' => 'Spanish language for Spanish-speaking users',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'code' => 'it',
                'name' => 'Italian',
                'native_name' => 'Italiano',
                'flag' => '🇮🇹',
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 5,
                'description' => 'Italian language for Italian-speaking users',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        DB::table('languages')->insert($defaultLanguages);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('languages');
    }
};
