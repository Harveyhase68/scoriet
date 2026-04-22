<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->boolean('report_designer_snap_to_grid')->default(true)->after('form_designer_grid_size');
            $table->string('report_designer_grid_unit', 10)->default('mm')->after('report_designer_snap_to_grid');
            $table->decimal('report_designer_grid_size', 8, 2)->default(5.00)->after('report_designer_grid_unit');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['report_designer_snap_to_grid', 'report_designer_grid_unit', 'report_designer_grid_size']);
        });
    }
};
