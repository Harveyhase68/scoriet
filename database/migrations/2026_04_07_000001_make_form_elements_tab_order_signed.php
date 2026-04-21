<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Switch tab_order to a signed SMALLINT so -1 can be used to mean
        // "no tab stop / excluded from tab order".
        DB::statement('ALTER TABLE form_elements MODIFY tab_order SMALLINT NOT NULL DEFAULT 0');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE form_elements MODIFY tab_order SMALLINT UNSIGNED NOT NULL DEFAULT 0');
    }
};
