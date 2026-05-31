<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schema_fields', function (Blueprint $table) {
            $table->boolean('is_generated')->default(false)->after('is_auto_increment');
            $table->text('generation_expression')->nullable()->after('is_generated');
            $table->enum('generation_storage', ['stored', 'virtual'])->nullable()->after('generation_expression');
        });
    }

    public function down(): void
    {
        Schema::table('schema_fields', function (Blueprint $table) {
            $table->dropColumn(['is_generated', 'generation_expression', 'generation_storage']);
        });
    }
};
