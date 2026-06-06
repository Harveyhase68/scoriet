<?php

use Illuminate\Database\Migrations\Migration;

/**
 * SUPERSEDED — intentionally a no-op.
 *
 * This migration used to reconcile a Passport <11 schema *towards* the legacy
 * boolean shape (renaming redirect_uris -> redirect, dropping grant_types /
 * owner_* / user_id). The project has since standardised on Passport's MODERN
 * schema (owner morph + redirect_uris + grant_types), so running the old logic
 * would now STRIP the modern columns again and break client creation
 * ("Unknown column 'personal_access_client'").
 *
 * It is kept as an empty migration rather than deleted so that databases which
 * already recorded it as "Ran" keep a matching file on disk (clean
 * `migrate:status`, reversible history). The legacy -> modern conversion lives
 * in 2026_06_04_120000_convert_oauth_clients_to_modern_schema and is the single
 * source of truth for the table's shape from now on.
 */
return new class extends Migration {
    public function up(): void
    {
        // No-op: see class docblock. Schema reconciliation moved to the
        // 2026_06_04 conversion migration.
    }

    public function down(): void
    {
        // No-op.
    }
};
