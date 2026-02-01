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
        Schema::create('schema_versions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('schema_id');
            $table->integer('version_number')->default(1);
            $table->string('version_name', 100)->index();
            $table->text('description')->nullable();
            $table->boolean('has_unsaved_changes')->default(false);
            $table->timestamp('imported_at')->nullable();
            $table->timestamps();

            $table->index(['schema_id', 'version_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schema_versions');
    }
};
