<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schema_tables', function (Blueprint $table) {
            $table->unsignedBigInteger('form_set_id')->nullable()->after('file_name_short');
            $table->unsignedBigInteger('report_pattern_id')->nullable()->after('form_set_id');
            // No FK constraints — we want to actively block deletes (controllers)
            // instead of silently nulling out user choices via ON DELETE SET NULL.
            $table->index('form_set_id');
            $table->index('report_pattern_id');
        });
    }

    public function down(): void
    {
        Schema::table('schema_tables', function (Blueprint $table) {
            $table->dropIndex(['form_set_id']);
            $table->dropIndex(['report_pattern_id']);
            $table->dropColumn(['form_set_id', 'report_pattern_id']);
        });
    }
};
