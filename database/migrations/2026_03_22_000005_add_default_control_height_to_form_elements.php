<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add default_control_height to form_elements.
     * Used by containers/tabs to define the default height for placed fields.
     */
    public function up(): void
    {
        Schema::table('form_elements', function (Blueprint $table) {
            $table->integer('default_control_height')->nullable()->default(56)->after('container_gap');
        });
    }

    public function down(): void
    {
        Schema::table('form_elements', function (Blueprint $table) {
            $table->dropColumn('default_control_height');
        });
    }
};
