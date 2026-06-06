<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drop the legacy `form_window_type` column from `template_files`.
 *
 * `form_window_type` was a per-file marker (0=none,1=main_menu,2=create_edit,
 * 3=data_table) that did two unrelated jobs:
 *   1) gated which files appeared in the (Form) Field-Assignment matrix —
 *      already decoupled to gate on file_type instead;
 *   2) indexed a GLOBAL formset (formset.windows[type-1]) for the {:form.*:}
 *      template construct.
 *
 * Job 2 was the legacy outlier: reports already resolve per-table
 * ({:reportsingle.*:}/{:reportlist.*:} → tables[i]....), driven by the table's
 * report_pattern_id. Forms now mirror that — {:formmenu.*:}/{:formedit.*:}/
 * {:formtable.*:} resolve per-table from the table's effective FormSet
 * (tables[i].formmenu/formedit/formtable, emitted in
 * UltimateTemplateController::buildUltimateGtree()). The file-level marker is
 * therefore obsolete and removed.
 *
 * Idempotent: guarded by hasColumn so re-running / fresh installs are safe.
 */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasColumn('template_files', 'form_window_type')) {
            Schema::table('template_files', function (Blueprint $table) {
                $table->dropColumn('form_window_type');
            });
        }
    }

    public function down(): void
    {
        // Restore the column shape for rollback. Data is not reconstructed
        // (the value was a transient UI marker, default 0).
        if (!Schema::hasColumn('template_files', 'form_window_type')) {
            Schema::table('template_files', function (Blueprint $table) {
                $table->tinyInteger('form_window_type')->nullable()->default(0)
                    ->comment('Legacy Form-Blueprint window marker (superseded by per-table {:formmenu/formedit/formtable.*:} constructs)');
            });
        }
    }
};
