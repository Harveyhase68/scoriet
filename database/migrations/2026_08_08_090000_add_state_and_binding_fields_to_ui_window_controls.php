<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            // WLangage's ..State: Active(0)/DisplayOnly(1)/Grayed(4) - kept
            // as a small string enum (not the raw WinDev int) so a
            // hand-built control can set it just as easily as an imported
            // one, matching every other enum-ish column on this table.
            $table->string('control_state', 20)->nullable()->default('active')->after('is_required');

            // Free-form pass-through metadata for a data-bound control
            // (combo/table column bound to another WinDev "file") - not yet
            // resolved into a real schema_field_id FK (that's generator
            // territory, roadmap Step 2); stored now so the information
            // survives import instead of being discarded.
            $table->string('data_binding', 255)->nullable()->after('control_state');
            $table->string('browsed_file', 150)->nullable()->after('data_binding');

            // Table/grid columns ("Table" control, type 9) - WinDev doesn't
            // export a column as its own control object, just a "tabs"
            // array (yes, the same key name tab_container pages use) of
            // column definitions nested on the table control itself. A
            // JSON column here is far simpler than a whole child table for
            // what is fundamentally per-table display configuration.
            $table->json('table_columns')->nullable()->after('browsed_file');
        });
    }

    public function down(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            $table->dropColumn(['control_state', 'data_binding', 'browsed_file', 'table_columns']);
        });
    }
};
