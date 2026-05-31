<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the missing field_length column to schema_fields.
 *
 * Several layers (Frontend TableField, SchemaController, SchemaStorageService)
 * had been referencing $field_length for months, but the column was never
 * actually created — earlier Eloquent writes silently dropped it because the
 * model had it in $fillable while the schema didn't. Length-bearing types
 * survived only because the parser left the literal in field_type
 * (e.g. "varchar(50)" as a string).
 *
 * After the May-2026 split-types migration moved enum/decimal payloads into
 * their own columns, varchar(N)/tinyint(N) etc. need the same treatment for
 * consistency. This migration creates field_length and backfills it from
 * existing field_type strings that still carry "(N)".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schema_fields', function (Blueprint $table) {
            $table->unsignedInteger('field_length')->nullable()->after('field_type');
        });

        // Backfill: pull "(N)" out of field_type into field_length, then strip
        // the suffix from field_type. Only touches types where the payload is
        // a single integer; enum/decimal payloads were already moved by the
        // previous migration.
        DB::table('schema_fields')->orderBy('id')->chunkById(500, function ($fields) {
            foreach ($fields as $field) {
                $type = (string) $field->field_type;
                $openParen = strpos($type, '(');
                if ($openParen === false) {
                    continue;
                }
                $closeParen = strrpos($type, ')');
                if ($closeParen === false || $closeParen <= $openParen) {
                    continue;
                }
                $inner = trim(substr($type, $openParen + 1, $closeParen - $openParen - 1));
                if ($inner === '' || !ctype_digit($inner)) {
                    continue; // not a single integer — leave for other migrations
                }
                $baseName = strtolower(substr($type, 0, $openParen));
                DB::table('schema_fields')->where('id', $field->id)->update([
                    'field_type' => $baseName,
                    'field_length' => (int) $inner,
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('schema_fields', function (Blueprint $table) {
            $table->dropColumn('field_length');
        });
    }
};
