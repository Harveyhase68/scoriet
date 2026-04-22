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
        Schema::table('project_attachments', function (Blueprint $table) {
            $table->foreign(['project_id'])->references(['id'])->on('projects')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['uploaded_by'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_attachments', function (Blueprint $table) {
            $table->dropForeign('project_attachments_project_id_foreign');
            $table->dropForeign('project_attachments_uploaded_by_foreign');
        });
    }
};
