<?php

namespace App\Services;

use App\Models\SchemaField;
use App\Models\SchemaTable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Single source of truth for the JSON-in-SQL-COMMENT round-trip.
 *
 * Every SchemaTable and SchemaField row carries Scoriet-specific metadata
 * (audit, version, lookup config) that has no SQL equivalent. To survive a
 * SQL export → import cycle we serialise that metadata as a compact JSON
 * object and put it INSIDE the SQL `COMMENT` clause. On import the JSON is
 * parsed back out and the keys are restored to their proper columns.
 *
 * The whole COMMENT clause IS the JSON object — no delimiter, no prose +
 * JSON mix. The user-visible comment text lives as the `comment` key inside
 * the JSON object. If a COMMENT is not valid JSON (or is JSON but lacks the
 * `v` marker key), it's treated as legacy/foreign — the raw string becomes
 * the comment, audit defaults are applied at the storage layer.
 *
 * Byte budgets: MySQL caps column COMMENT at 1024 bytes and table COMMENT
 * at 2048 bytes. PostgreSQL has no cap (we pass 64 KiB for parity).
 */
class CommentMetadataCodec
{
    /**
     * Key map — long Scoriet column names → short JSON keys. Kept short
     * because every byte counts inside MySQL's 1024-byte column-COMMENT cap.
     */
    private const KEYS = [
        'version'              => 'v',
        'created_at'           => 'created',
        'created_by_username'  => 'createdby',
        'updated_at'           => 'updated',
        'updated_by_username'  => 'updatedby',
        'comment'              => 'comment',
        'control_type'         => 'control',
        'link_table'           => 'linkt',
        'link_field'           => 'linkf',
        'link_display_field'   => 'linkd',
        'link_order_field'     => 'linko',
        'link_order_direction' => 'linkc',
        'display_state'        => 'ds',
        'generation_mode'      => 'gm',
        'editmask'             => 'em',
        // Table-only extensions — Scoriet UX state that has no SQL home.
        'singular_name'        => 'sing',
        'file_name_renamed'    => 'fnr',
        'file_name_short'      => 'fns',
        // Form/Report pivots are stored as NAMES (not ids) inside the JSON
        // — ids are local to the source DB. The decoder hands the name to
        // the storage layer which resolves it back to an id.
        'form_set_name'        => 'fs',
        'report_pattern_name'  => 'rp',
    ];

    /**
     * Reverse lookup for decode. Built once.
     */
    private const COLUMNS = [
        'v'         => 'version',
        'created'   => 'created_at',
        'createdby' => 'created_by_username',
        'updated'   => 'updated_at',
        'updatedby' => 'updated_by_username',
        'comment'   => 'comment',
        'control'   => 'control_type',
        'linkt'     => 'link_table',
        'linkf'     => 'link_field',
        'linkd'     => 'link_display_field',
        'linko'     => 'link_order_field',
        'linkc'     => 'link_order_direction',
        'ds'        => 'display_state',
        'gm'        => 'generation_mode',
        'em'        => 'editmask',
        'sing'      => 'singular_name',
        'fnr'       => 'file_name_renamed',
        'fns'       => 'file_name_short',
        'fs'        => 'form_set_name',
        'rp'        => 'report_pattern_name',
    ];

    private const JSON_FLAGS = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;

    /**
     * The single character we use to mark "yes this is our metadata".
     * Decode rejects anything that doesn't start with `{` and doesn't
     * contain the `"v":` marker once parsed.
     */
    private const MARKER_KEY = 'v';

    /**
     * Default values — when the column value equals the default, the key is
     * omitted from the encoded JSON to save bytes.
     */
    private const FIELD_DEFAULTS = [
        'control_type'         => 'TEXT',
        'link_order_direction' => 'ASC',
        'display_state'        => 'enabled',
        'generation_mode'      => 'full',
    ];

    private const TABLE_DEFAULTS = [
        'display_state'   => 'enabled',
        'generation_mode' => 'full',
    ];

    public function encodeForTable(SchemaTable $table, int $maxBytes = 2048): string
    {
        $payload = [
            'v'         => (int) ($table->version ?? 1),
            'created'   => $this->formatDate($table->created_at),
            'createdby' => $table->created_by_username ?: 'system',
            'updated'   => $this->formatDate($table->updated_at),
            'updatedby' => $table->updated_by_username ?: 'system',
        ];

        if (!empty($table->comment)) {
            $payload['comment'] = (string) $table->comment;
        }

        // Optional Scoriet-only state keys — only included when non-default
        // OR when set. The 2048-byte MySQL table-COMMENT cap is comfortable
        // for the full set, so we don't need to be stingy.
        $this->maybeAddOptional($payload, 'ds',   $table->display_state,     self::TABLE_DEFAULTS['display_state']);
        $this->maybeAddOptional($payload, 'gm',   $table->generation_mode,   self::TABLE_DEFAULTS['generation_mode']);
        $this->maybeAddOptional($payload, 'sing', $table->singular_name,     null);
        $this->maybeAddOptional($payload, 'fnr',  $table->file_name_renamed, null);
        $this->maybeAddOptional($payload, 'fns',  $table->file_name_short,   null);

        // Pivot relations stored by NAME — the importer resolves back to an
        // id. The relation accessor (`formSet`/`reportPattern`) only triggers
        // a query when the column is set, so cheap for tables with no link.
        if ($table->form_set_id) {
            $name = $table->formSet?->name;
            if ($name) {
                $payload['fs'] = $name;
            }
        }
        if ($table->report_pattern_id) {
            $name = $table->reportPattern?->name;
            if ($name) {
                $payload['rp'] = $name;
            }
        }

        return $this->encodeWithBudget($payload, $maxBytes);
    }

    public function encodeForField(SchemaField $field, int $maxBytes = 1024): string
    {
        $payload = [
            'v'         => (int) ($field->version ?? 1),
            'created'   => $this->formatDate($field->created_at),
            'createdby' => $field->created_by_username ?: 'system',
            'updated'   => $this->formatDate($field->updated_at),
            'updatedby' => $field->updated_by_username ?: 'system',
        ];

        if (!empty($field->comment)) {
            $payload['comment'] = (string) $field->comment;
        }

        // Lookup payload — only when non-default. Once any lookup key is
        // non-default we still keep that key alone (no "all or nothing").
        $this->maybeAddOptional($payload, 'control', $field->control_type, self::FIELD_DEFAULTS['control_type']);
        $this->maybeAddOptional($payload, 'linkt',   $field->link_table,            null);
        $this->maybeAddOptional($payload, 'linkf',   $field->link_field,            null);
        $this->maybeAddOptional($payload, 'linkd',   $field->link_display_field,    null);
        $this->maybeAddOptional($payload, 'linko',   $field->link_order_field,      null);
        $this->maybeAddOptional($payload, 'linkc',   $field->link_order_direction,  self::FIELD_DEFAULTS['link_order_direction']);

        $this->maybeAddOptional($payload, 'ds', $field->display_state,   self::FIELD_DEFAULTS['display_state']);
        $this->maybeAddOptional($payload, 'gm', $field->generation_mode, self::FIELD_DEFAULTS['generation_mode']);
        $this->maybeAddOptional($payload, 'em', $field->editmask,        null);

        return $this->encodeWithBudget($payload, $maxBytes);
    }

    /**
     * Decode a raw SQL COMMENT back into ['comment' => string|null, 'meta' => array|null].
     *
     * - `meta = null` signals "not our JSON" — the raw string is preserved
     *   verbatim as `comment` so legacy/foreign SQL imports flow unchanged.
     * - `meta` is keyed with FULL Scoriet column names (not the short JSON
     *   keys), so callers can map straight into model fillables without
     *   knowing the codec internals.
     */
    public function decode(?string $raw): array
    {
        if ($raw === null || $raw === '') {
            return ['comment' => null, 'meta' => null];
        }

        $trimmed = ltrim($raw);
        // Cheap rejection — anything not starting with `{` is definitely not our JSON.
        if (!str_starts_with($trimmed, '{')) {
            return ['comment' => $raw, 'meta' => null];
        }

        $decoded = json_decode($trimmed, true);
        if (!is_array($decoded) || !array_key_exists(self::MARKER_KEY, $decoded)) {
            return ['comment' => $raw, 'meta' => null];
        }

        // Build a full-column-name meta array. Unknown short keys are dropped.
        $meta = [];
        foreach ($decoded as $shortKey => $value) {
            if (isset(self::COLUMNS[$shortKey])) {
                $meta[self::COLUMNS[$shortKey]] = $value;
            }
        }

        $comment = $meta['comment'] ?? null;
        unset($meta['comment']); // comment is returned separately, not under meta

        return [
            'comment' => $comment === null ? null : (string) $comment,
            'meta'    => $meta,
        ];
    }

    /**
     * Format a date column for embedding. Accepts Carbon, DateTime, string, null.
     * Always returns `Y-m-d` per the user's example payload (saves ~9 bytes vs
     * full datetime — relevant at the 1024-byte cap).
     */
    private function formatDate($value): string
    {
        if ($value === null || $value === '') {
            return Carbon::now()->format('Y-m-d');
        }
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }
        try {
            return Carbon::parse((string) $value)->format('Y-m-d');
        } catch (\Throwable $e) {
            return Carbon::now()->format('Y-m-d');
        }
    }

    private function maybeAddOptional(array &$payload, string $shortKey, $value, $default): void
    {
        if ($value === null || $value === '') {
            return;
        }
        if ($default !== null && (string) $value === (string) $default) {
            return;
        }
        $payload[$shortKey] = $value;
    }

    /**
     * Encode the payload to JSON, honouring the byte budget.
     *
     * Strategy (in order, only escalating if previous step doesn't fit):
     *  1. Encode full payload — if ≤ budget, ship it.
     *  2. Truncate the `comment` value until it fits (Unicode ellipsis marker).
     *  3. Drop optional Scoriet-only keys: em → gm → ds (in that order).
     *  4. Drop `comment` entirely. Log warning — never expected with sane inputs.
     *
     * The audit + version + lookup keys are sacred — they are never dropped.
     */
    private function encodeWithBudget(array $payload, int $maxBytes): string
    {
        $encoded = json_encode($payload, self::JSON_FLAGS);
        if (strlen($encoded) <= $maxBytes) {
            return $encoded;
        }

        // Step 2 — truncate the user comment if present.
        if (isset($payload['comment']) && is_string($payload['comment']) && $payload['comment'] !== '') {
            $payload['comment'] = $this->truncateCommentToFit($payload, $maxBytes);
            $encoded = json_encode($payload, self::JSON_FLAGS);
            if (strlen($encoded) <= $maxBytes) {
                return $encoded;
            }
        }

        // Step 3 — drop optional Scoriet-only keys in order of least
        // operational impact. File-name conveniences (fnr/fns/sing) go
        // first, then generation/display state. Form-Set / Report-Pattern
        // links (fs/rp) are KEPT — losing them silently re-defaults the
        // table's editor UI on the next round-trip, which is surprising.
        foreach (['em', 'fnr', 'fns', 'sing', 'gm', 'ds'] as $optional) {
            if (isset($payload[$optional])) {
                unset($payload[$optional]);
                $encoded = json_encode($payload, self::JSON_FLAGS);
                if (strlen($encoded) <= $maxBytes) {
                    return $encoded;
                }
            }
        }

        // Step 4 — last resort: drop comment entirely, warn loudly.
        if (isset($payload['comment'])) {
            unset($payload['comment']);
            $encoded = json_encode($payload, self::JSON_FLAGS);
            Log::warning('CommentMetadataCodec: payload exceeded budget even after stripping comment', [
                'payload_keys' => array_keys($payload),
                'final_bytes'  => strlen($encoded),
                'budget'       => $maxBytes,
            ]);
        }

        return $encoded;
    }

    /**
     * Binary-shrink the comment value until the whole encoded payload fits.
     * The ellipsis itself costs 3 bytes (one Unicode char). We assume audit
     * and lookup keys alone are well under the budget (verified by encoded
     * tests).
     */
    private function truncateCommentToFit(array $payload, int $maxBytes): string
    {
        $original = $payload['comment'];
        $ellipsis = '…';

        // Headroom is bytes available for the comment value's CONTENT only.
        // We compute it by measuring the payload with an empty comment first.
        $payload['comment'] = '';
        $base = strlen(json_encode($payload, self::JSON_FLAGS));
        $headroom = $maxBytes - $base - strlen($ellipsis);
        if ($headroom <= 0) {
            return $ellipsis;
        }

        // Trim by bytes (mb_strcut respects UTF-8 boundaries).
        return mb_strcut($original, 0, $headroom, 'UTF-8') . $ellipsis;
    }
}
