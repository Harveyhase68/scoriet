<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name')->index();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('owner_id');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_public')->default(true);
            $table->string('join_code', 20)->nullable()->unique();
            $table->boolean('allow_join_requests')->default(false);
            $table->json('settings')->nullable();
            $table->string('database_name')->nullable();
            $table->string('database_type')->default('MySQL');
            $table->string('database_server')->default('127.0.0.1');
            $table->string('database_port')->default('3306');
            $table->string('database_username')->nullable();
            $table->string('database_password')->nullable();
            $table->unsignedSmallInteger('diagram_max_tables_per_row')->default(20);
            $table->unsignedSmallInteger('diagram_table_width')->default(280);
            $table->unsignedSmallInteger('diagram_table_height')->default(450);
            $table->unsignedSmallInteger('diagram_horizontal_spacing')->default(600);
            $table->unsignedSmallInteger('diagram_vertical_spacing')->default(700);
            $table->string('project_directory')->nullable();
            $table->string('project_url')->nullable();
            $table->string('start_page')->nullable()->default('index.php');
            $table->string('default_language', 10)->nullable()->default('en');
            $table->unsignedTinyInteger('filename_short_length')->nullable()->default(2);
            $table->string('decimal_separator', 1)->nullable()->default(',');
            $table->string('thousands_separator', 1)->nullable()->default('.');
            $table->string('date_format', 20)->nullable()->default('d.m.Y');
            $table->string('time_format', 20)->nullable()->default('H:i:s');
            $table->string('currency_symbol', 5)->nullable()->default('€');
            $table->string('timezone', 50)->nullable()->default('Europe/Vienna');
            $table->json('enabled_languages')->nullable();
            $table->string('google_translate_api_key', 500)->nullable();
            $table->timestamps();

            $table->index(['owner_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
