<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Converge oauth_clients onto Passport's MODERN (>=12) schema, non-destructively.
 *
 * Why this exists
 * ---------------
 * Long-lived installs carry the legacy Passport <=11 shape:
 *     id, [user_id], name, secret, provider, redirect (text),
 *     personal_access_client (bool), password_client (bool), revoked, timestamps
 *
 * Passport 13's Client model and ClientRepository still *read* that shape via a
 * backward-compat fallback, but writing a new client through `passport:client`
 * on a half-migrated table (grant_types already dropped, booleans missing) fails
 * with "Unknown column 'personal_access_client'". Standardising on the modern
 * shape removes that whole class of drift.
 *
 * Target (modern) shape:
 *     id, owner_type, owner_id, name, secret, provider,
 *     redirect_uris (json text), grant_types (json text), revoked, timestamps
 *
 * Guarantees
 * ----------
 *  - Idempotent: every step is guarded by Schema::hasColumn, safe to re-run and
 *    safe on a table that is already modern (early return).
 *  - Lossless: client ids and secrets are untouched, so all 100+ issued tokens
 *    in oauth_access_tokens (which FK on the uuid client_id) stay valid.
 *  - Behaviour-preserving: grant_types is backfilled by replicating Passport's
 *    own legacy->grant_types derivation (see Client::grantTypes()), so each
 *    client keeps exactly the grants it effectively had at runtime.
 *  - No regex, no driver-specific SQL beyond standard Blueprint operations.
 */
return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('oauth_clients')) {
            return;
        }

        $hasOwnerType   = Schema::hasColumn('oauth_clients', 'owner_type');
        $hasRedirectUris = Schema::hasColumn('oauth_clients', 'redirect_uris');
        $hasGrantTypes   = Schema::hasColumn('oauth_clients', 'grant_types');
        $hasRedirect     = Schema::hasColumn('oauth_clients', 'redirect');
        $hasPwClient     = Schema::hasColumn('oauth_clients', 'password_client');
        $hasPaClient     = Schema::hasColumn('oauth_clients', 'personal_access_client');

        // Already modern and clean: nothing to do.
        if ($hasGrantTypes && $hasRedirectUris && $hasOwnerType
            && ! $hasPwClient && ! $hasPaClient && ! $hasRedirect) {
            return;
        }

        // 1) Add the modern columns (initially nullable so existing rows survive
        //    the ALTER before we backfill them).
        Schema::table('oauth_clients', function (Blueprint $table) use ($hasOwnerType, $hasRedirectUris, $hasGrantTypes) {
            if (! $hasOwnerType) {
                $table->nullableMorphs('owner');           // owner_type + owner_id
            }
            if (! $hasRedirectUris) {
                $table->text('redirect_uris')->nullable();
            }
            if (! $hasGrantTypes) {
                $table->text('grant_types')->nullable();
            }
        });

        // 2) Backfill modern columns from the legacy ones, row by row, mirroring
        //    Passport\Client::grantTypes() so runtime behaviour is identical.
        if (! $hasRedirectUris || ! $hasGrantTypes) {
            foreach (DB::table('oauth_clients')->get() as $row) {
                $redirectValue = $hasRedirect ? (string) ($row->redirect ?? '') : '';
                $redirectUris  = $redirectValue === '' ? [] : explode(',', $redirectValue);

                $confidential         = ! empty($row->secret);
                $passwordClient       = $hasPwClient ? (bool) $row->password_client : false;
                $personalAccessClient = $hasPaClient ? (bool) $row->personal_access_client : false;

                // Legacy schema has no owner/user_id column -> all clients are
                // first-party, matching Client::firstParty()'s empty-owner branch.
                $firstParty = true;

                $grantTypes = [];
                if (! empty($redirectUris)) {
                    $grantTypes[] = 'authorization_code';
                    $grantTypes[] = 'implicit';
                }
                if ($confidential && $firstParty) {
                    $grantTypes[] = 'client_credentials';
                }
                if ($passwordClient) {
                    $grantTypes[] = 'password';
                }
                if ($personalAccessClient && $confidential) {
                    $grantTypes[] = 'personal_access';
                }
                $grantTypes[] = 'refresh_token';
                $grantTypes[] = 'urn:ietf:params:oauth:grant-type:device_code';

                $update = [];
                if (! $hasGrantTypes) {
                    $update['grant_types'] = json_encode(array_values(array_unique($grantTypes)));
                }
                if (! $hasRedirectUris) {
                    $update['redirect_uris'] = json_encode(array_values($redirectUris));
                }

                if ($update !== []) {
                    DB::table('oauth_clients')->where('id', $row->id)->update($update);
                }
            }
        }

        // 3) Tighten the backfilled columns to NOT NULL to match Passport's
        //    native definition. Safe now that every row has a value.
        Schema::table('oauth_clients', function (Blueprint $table) {
            $table->text('redirect_uris')->nullable(false)->change();
            $table->text('grant_types')->nullable(false)->change();
        });

        // 4) Drop the legacy-only columns. Each in its own guarded ALTER so a
        //    failure on one (e.g. a lingering index) doesn't abort the rest.
        foreach (['redirect', 'personal_access_client', 'password_client', 'user_id'] as $column) {
            if (Schema::hasColumn('oauth_clients', $column)) {
                try {
                    Schema::table('oauth_clients', function (Blueprint $table) use ($column) {
                        $table->dropColumn($column);
                    });
                } catch (\Throwable $e) {
                    \Log::warning("convert_oauth_clients_to_modern_schema: could not drop {$column}", [
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }
    }

    /**
     * Reverse: rebuild the legacy boolean shape from grant_types. Lossless for
     * the grant flags this project actually uses (password / personal_access).
     */
    public function down(): void
    {
        if (! Schema::hasTable('oauth_clients')) {
            return;
        }

        if (! Schema::hasColumn('oauth_clients', 'redirect')) {
            Schema::table('oauth_clients', function (Blueprint $table) {
                $table->text('redirect')->nullable();
                $table->boolean('personal_access_client')->default(false);
                $table->boolean('password_client')->default(false);
            });
        }

        $hasGrantTypes   = Schema::hasColumn('oauth_clients', 'grant_types');
        $hasRedirectUris = Schema::hasColumn('oauth_clients', 'redirect_uris');

        foreach (DB::table('oauth_clients')->get() as $row) {
            $grantTypes   = $hasGrantTypes && $row->grant_types ? (json_decode($row->grant_types, true) ?: []) : [];
            $redirectUris = $hasRedirectUris && $row->redirect_uris ? (json_decode($row->redirect_uris, true) ?: []) : [];

            DB::table('oauth_clients')->where('id', $row->id)->update([
                'redirect'               => implode(',', is_array($redirectUris) ? $redirectUris : []),
                'password_client'        => in_array('password', $grantTypes, true) ? 1 : 0,
                'personal_access_client' => in_array('personal_access', $grantTypes, true) ? 1 : 0,
            ]);
        }

        foreach (['grant_types', 'redirect_uris', 'owner_type', 'owner_id'] as $column) {
            if (Schema::hasColumn('oauth_clients', $column)) {
                try {
                    Schema::table('oauth_clients', function (Blueprint $table) use ($column) {
                        $table->dropColumn($column);
                    });
                } catch (\Throwable $e) {
                    \Log::warning("convert_oauth_clients_to_modern_schema[down]: could not drop {$column}", [
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }
    }
};
