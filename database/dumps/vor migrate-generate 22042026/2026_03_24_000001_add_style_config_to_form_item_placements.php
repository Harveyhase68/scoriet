<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('form_item_placements', function (Blueprint $table) {
            $table->json('style_config')->nullable()->after('button_text_color');
        });
    }

    public function down(): void
    {
        Schema::table('form_item_placements', function (Blueprint $table) {
            $table->dropColumn('style_config');
        });
    }
};
