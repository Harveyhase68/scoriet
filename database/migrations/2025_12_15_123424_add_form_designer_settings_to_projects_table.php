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
        Schema::table('projects', function (Blueprint $table) {
            $table->boolean('form_designer_snap_to_grid')->default(true)->after('diagram_vertical_spacing');
            $table->integer('form_designer_grid_size')->default(20)->after('form_designer_snap_to_grid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['form_designer_snap_to_grid', 'form_designer_grid_size']);
        });
    }
};
