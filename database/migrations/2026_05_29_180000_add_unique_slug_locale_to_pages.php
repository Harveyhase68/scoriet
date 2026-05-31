<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * CMS pages are identified by (slug, locale) — same slug in different
 * locales is a translation pair, but two rows with the SAME (slug, locale)
 * are an error. Up to this point we relied on a runtime `where exists`
 * check in the controller; this migration enforces it at the storage layer
 * so concurrent inserts and any non-CMS caller can't slip duplicates in.
 *
 * Verified empty of duplicates before adding (see chat thread 2026-05-29).
 */
return new class extends Migration {
    public function up(): void
    {
        // Idempotent — earlier projects already shipped this index under
        // the same name. We don't want a fresh checkout to apply it twice
        // and crash the migrate pipeline, so check first.
        $exists = collect(\DB::select(
            "SHOW INDEX FROM pages WHERE Key_name = 'pages_slug_locale_unique'"
        ))->isNotEmpty();

        if (!$exists) {
            Schema::table('pages', function (Blueprint $table) {
                $table->unique(['slug', 'locale'], 'pages_slug_locale_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            $table->dropUnique('pages_slug_locale_unique');
        });
    }
};
