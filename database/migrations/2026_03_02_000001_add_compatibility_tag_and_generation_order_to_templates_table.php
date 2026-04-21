<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->string('compatibility_tag', 500)->nullable()->index()->after('full_name');
            $table->integer('generation_order')->default(0)->after('compatibility_tag');
        });
    }

    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->dropColumn(['compatibility_tag', 'generation_order']);
        });
    }
};
