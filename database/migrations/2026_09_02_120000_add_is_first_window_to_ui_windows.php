<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ui_windows', function (Blueprint $table) {
            // Which ONE window a generated app launches directly into
            // instead of a menu/demo screen (see window_modules.dart's
            // startupWindowId and main.dart's own launch logic) - at most
            // one true per project_id, enforced in
            // WindowDesignerController::setFirstWindow(), not at the DB
            // level (a partial unique index needs DB-specific SQL this
            // project avoids for portability across MySQL/PostgreSQL/etc).
            $table->boolean('is_first_window')->default(false)->after('has_status_bar');
        });
    }

    public function down(): void
    {
        Schema::table('ui_windows', function (Blueprint $table) {
            $table->dropColumn('is_first_window');
        });
    }
};
