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
            $table->string('editmask', 255)->nullable()->after('link_order_direction')
                ->comment('Edit mask for input validation (framework-agnostic: e.g., "99.99.9999", "email", "phone", or JSON)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_fields', function (Blueprint $table) {
            $table->dropColumn('editmask');
        });
    }
};
