<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Optional per-template scoping for Code Adjustments.
 *
 * A code_adjustment is always bound to a project (project_id, NOT NULL). This
 * adds an OPTIONAL template_id so the user can narrow an adjustment further to
 * a single template within that project — useful when a project has two similar
 * templates and an adjustment should only touch one of them.
 *
 * Semantics (enforced in CodeAdjustmentService::apply):
 *   template_id IS NULL  → applies to ALL templates in the project (default)
 *   template_id = <id>   → applies ONLY when generating that template
 *
 * onDelete('set null'): deleting a template must NOT delete the adjustment —
 * it just falls back to project-wide scope, which is the safe default.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('code_adjustments', function (Blueprint $table) {
            $table->unsignedBigInteger('template_id')->nullable()->after('project_id');
            $table->foreign('template_id')->references('id')->on('templates')->onUpdate('no action')->onDelete('set null');
            $table->index('template_id');
        });
    }

    public function down(): void
    {
        Schema::table('code_adjustments', function (Blueprint $table) {
            $table->dropForeign('code_adjustments_template_id_foreign');
            $table->dropIndex('code_adjustments_template_id_index');
            $table->dropColumn('template_id');
        });
    }
};
