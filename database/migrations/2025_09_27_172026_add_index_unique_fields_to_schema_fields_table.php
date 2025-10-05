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
        Schema::table('schema_fields', function (Blueprint $table) {
            $table->boolean('is_index')->default(false)->after('is_primary_key');
            $table->boolean('is_unique')->default(false)->after('is_index');

            $table->index('is_index');
            $table->index('is_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_fields', function (Blueprint $table) {
            $table->dropIndex(['is_index']);
            $table->dropIndex(['is_unique']);
            $table->dropColumn(['is_index', 'is_unique']);
        });
    }
};
