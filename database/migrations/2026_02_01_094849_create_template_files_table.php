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
        Schema::create('template_files', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('template_id');
            $table->string('file_name');
            $table->string('file_path');
            $table->mediumText('file_content');
            $table->string('file_type', 50)->default('template');
            $table->enum('content_type', ['text', 'zip'])->default('text');
            $table->string('zip_filename')->nullable();
            $table->string('output_path')->nullable();
            $table->integer('file_order')->nullable();
            $table->tinyInteger('form_window_type')->nullable()->default(0)->comment('0=None, 1=MainMenu, 2=CreateEdit, 3=DataTable, 4=ReportSingle, 5=ReportList');
            $table->boolean('is_include_only')->default(false);
            $table->timestamps();

            $table->index(['template_id', 'file_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_files');
    }
};
