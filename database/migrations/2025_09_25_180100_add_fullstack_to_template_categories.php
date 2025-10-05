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
        Schema::table('templates', function (Blueprint $table) {
            $table->enum('category', ['Web', 'Mobile', 'API', 'Desktop', 'Database', 'E-Commerce', 'CMS', 'Dashboard', 'Fullstack'])
                  ->default('Web')
                  ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // First, update any Fullstack templates to Web category
        DB::table('templates')->where('category', 'Fullstack')->update(['category' => 'Web']);

        Schema::table('templates', function (Blueprint $table) {
            $table->enum('category', ['Web', 'Mobile', 'API', 'Desktop', 'Database', 'E-Commerce', 'CMS', 'Dashboard'])
                  ->default('Web')
                  ->change();
        });
    }
};