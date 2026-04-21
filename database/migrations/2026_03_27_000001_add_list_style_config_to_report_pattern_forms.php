<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_pattern_forms', function (Blueprint $table) {
            $table->json('list_style_config')->nullable()->after('footer_height')
                ->comment('Table styling for report_list: header colors, alternating rows, borders');
        });
    }

    public function down(): void
    {
        Schema::table('report_pattern_forms', function (Blueprint $table) {
            $table->dropColumn('list_style_config');
        });
    }
};
