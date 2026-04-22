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
        Schema::create('generation_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('project_id')->nullable()->index();
            $table->unsignedBigInteger('template_id')->nullable()->index();
            $table->json('schema_ids')->nullable();
            $table->unsignedInteger('template_version');
            $table->unsignedInteger('files_version_sum');
            $table->unsignedInteger('schema_version');
            $table->unsignedBigInteger('hash_timestamp');
            $table->char('hash_full', 64)->index();
            $table->char('hash_short', 8)->index();
            $table->string('filename', 500);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('generation_logs');
    }
};
