<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('form_elements', function (Blueprint $table) {
            $table->unsignedSmallInteger('tab_order')->default(0)->after('sort_order');
            $table->index(['form_window_id', 'tab_order']);
        });
    }

    public function down(): void
    {
        Schema::table('form_elements', function (Blueprint $table) {
            $table->dropIndex(['form_window_id', 'tab_order']);
            $table->dropColumn('tab_order');
        });
    }
};
