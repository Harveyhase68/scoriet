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
        Schema::create('project_kanban_roles', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('user_id')->index('project_kanban_roles_user_id_foreign');
            $table->enum('role', ['srm', 'sdm', 'flow_manager'])->comment('SRM=Service Request Manager, SDM=Service Delivery Manager, Flow Manager');
            $table->unsignedBigInteger('assigned_by')->nullable()->index('project_kanban_roles_assigned_by_foreign');
            $table->timestamps();

            $table->index(['project_id', 'role']);
            $table->unique(['project_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_kanban_roles');
    }
};
