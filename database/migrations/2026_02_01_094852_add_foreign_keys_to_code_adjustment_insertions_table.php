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
        Schema::table('code_adjustment_insertions', function (Blueprint $table) {
            $table->foreign(['code_adjustment_id'])->references(['id'])->on('code_adjustments')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('code_adjustment_insertions', function (Blueprint $table) {
            $table->dropForeign('code_adjustment_insertions_code_adjustment_id_foreign');
        });
    }
};
