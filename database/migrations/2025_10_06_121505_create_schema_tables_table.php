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
        Schema::create('schema_tables', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('schema_id')->index();
            $table->unsignedBigInteger('schema_version_id');
            $table->string('table_name')->index();
            $table->string('primarykeyfield', 100)->nullable()->index();
            $table->string('filekeyname', 100)->nullable()->index();
            $table->string('file_name_renamed', 100)->nullable()->index();
            $table->string('file_name_short', 50)->nullable()->index();
            $table->timestamps();

            $table->unique(['schema_version_id', 'table_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schema_tables');
    }
};
