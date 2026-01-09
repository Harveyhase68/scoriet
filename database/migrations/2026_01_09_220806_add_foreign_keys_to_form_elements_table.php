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
        Schema::table('form_elements', function (Blueprint $table) {
            $table->foreign(['form_window_id'])->references(['id'])->on('form_windows')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['parent_tab_container_id'])->references(['id'])->on('form_elements')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('form_elements', function (Blueprint $table) {
            $table->dropForeign('form_elements_form_window_id_foreign');
            $table->dropForeign('form_elements_parent_tab_container_id_foreign');
        });
    }
};
