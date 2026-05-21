<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Reconcile legacy oauth_clients schema with Passport's current shape, WITHOUT
 * dropping any token tables.
 *
 * Old (Passport <11) shape we still have to handle on long-lived installs:
 *   - redirect_uris (text)          → renamed to redirect
 *   - grant_types   (text)          → no longer used, dropped if present
 *   - owner_type / owner_id morphs  → no longer used, dropped if present
 *   - user_id       (bigint)        → no longer used, dropped if present
 *
 * Earlier versions of this migration dropped oauth_refresh_tokens / oauth_access_tokens /
 * oauth_auth_codes / oauth_personal_access_clients / oauth_clients in one go when
 * `redirect_uris` was detected. That worked for fresh Docker installs but, applied
 * to a populated production database, would erase every issued token and force a
 * mass logout. We now do non-destructive ALTERs instead.
 *
 * If the legacy schema also uses a different primary-key type (e.g. integer auto
 * increment instead of UUID), this migration deliberately does NOT touch foreign
 * keys — that situation is rare on this codebase and migrating it automatically
 * is unsafe. Operators should run a manual data migration in that case.
 */
return new class extends Migration {
    public function up(): void
    {
        // Fresh install or already-modern schema: nothing to do.
        if (!Schema::hasTable('oauth_clients')) {
            return;
        }

        Schema::table('oauth_clients', function (Blueprint $table) {
            // redirect_uris → redirect (preserve data)
            if (Schema::hasColumn('oauth_clients', 'redirect_uris')
                && !Schema::hasColumn('oauth_clients', 'redirect')) {
                $table->renameColumn('redirect_uris', 'redirect');
            }
        });

        // Drop obsolete columns one-by-one; each in its own ALTER so failure
        // on one doesn't roll back the others.
        $obsoleteColumns = ['grant_types', 'owner_type', 'owner_id', 'user_id'];
        foreach ($obsoleteColumns as $column) {
            if (Schema::hasColumn('oauth_clients', $column)) {
                try {
                    Schema::table('oauth_clients', function (Blueprint $table) use ($column) {
                        $table->dropColumn($column);
                    });
                } catch (\Throwable $e) {
                    // Some columns carry indexes/FKs; if dropping fails, log and
                    // leave them in place — Passport ignores unknown columns.
                    \Log::warning("fix_oauth_clients_schema: could not drop {$column}", [
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        // If the primary-key column is not a UUID-shaped string, the rest of
        // Passport 11+ won't be able to link tokens correctly. Surface this
        // clearly instead of silently corrupting data.
        $idType = $this->columnType('oauth_clients', 'id');
        if ($idType && stripos($idType, 'int') !== false) {
            \Log::warning(
                'fix_oauth_clients_schema: oauth_clients.id is still an integer type ('
                . $idType . '). Passport 11+ expects a uuid/char(36). A manual data '
                . 'migration is required — this migration does not auto-convert PKs.'
            );
        }
    }

    public function down(): void
    {
        // No rollback: we cannot reliably reconstruct dropped legacy columns.
    }

    /**
     * Get the DATA_TYPE of a column from information_schema (DB-agnostic enough
     * for our supported drivers).
     */
    private function columnType(string $table, string $column): ?string
    {
        try {
            $row = DB::selectOne(
                'SELECT DATA_TYPE FROM information_schema.COLUMNS '
                . 'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
                [$table, $column]
            );
            return $row?->DATA_TYPE;
        } catch (\Throwable) {
            return null;
        }
    }
};
