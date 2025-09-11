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
        // Remove the is_template_schema field and its index
        Schema::table('schemas', function (Blueprint $table) {
            $table->dropIndex(['is_template_schema']);
            $table->dropColumn('is_template_schema');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add back the is_template_schema field
        Schema::table('schemas', function (Blueprint $table) {
            $table->boolean('is_template_schema')->default(false)->after('visibility');
            $table->index('is_template_schema');
        });
    }
};
