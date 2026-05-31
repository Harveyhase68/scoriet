<?php

namespace App\Observers;

use App\Models\SchemaField;
use App\Models\SchemaTable;

class SchemaFieldObserver
{
    /**
     * Columns that count as "audit metadata". A dirty change limited to
     * these alone is NOT a real field mutation (it's the observer itself,
     * or the storage layer cleaning up) — we skip the version bump.
     */
    private const AUDIT_COLUMNS = [
        'version',
        'updated_at',
        'updated_by_username',
    ];

    /**
     * Stamp version=1 + create/update audit on a brand-new field.
     */
    public function creating(SchemaField $field): void
    {
        if (SchemaField::$suppressAudit) {
            return;
        }
        if (empty($field->version)) {
            $field->version = 1;
        }
        $field->applyAuditOnCreate();
    }

    /**
     * ANY meaningful field mutation bumps the field's version. Per the
     * confirmed user decision, this is intentionally broad — any dirty
     * column outside the audit-self set increments.
     */
    public function updating(SchemaField $field): void
    {
        if (SchemaField::$suppressAudit) {
            return;
        }
        $dirtyKeys = array_keys($field->getDirty());
        $meaningful = array_diff($dirtyKeys, self::AUDIT_COLUMNS);
        if (empty($meaningful)) {
            return;
        }
        $field->bumpVersion();
        $field->applyAuditOnUpdate();
    }

    /**
     * Adding a field bumps the parent table's version (decision #2:
     * field add/remove is a table-level structural change). The field's
     * own version is set by `creating()` above; here we only touch the
     * parent table — and we use saveQuietly to avoid re-entering the
     * table observer's whole cache-invalidation cycle for a single audit
     * stamp.
     */
    public function created(SchemaField $field): void
    {
        $this->bumpParentTable($field);
    }

    public function deleted(SchemaField $field): void
    {
        $this->bumpParentTable($field);
    }

    /**
     * Pure field-content edits do NOT bump the parent table — that is the
     * entire point of having per-field versions. We deliberately leave
     * `updated()` empty (the table version stays put).
     */
    public function updated(SchemaField $field): void
    {
        // intentionally empty
    }

    private function bumpParentTable(SchemaField $field): void
    {
        if (SchemaField::$suppressAudit) {
            return;
        }
        $table = SchemaTable::find($field->table_id);
        if (!$table) {
            return;
        }
        $table->bumpVersion();
        $table->applyAuditOnUpdate();

        // saveQuietly bypasses the table observer entirely — the cache
        // invalidation triggered by field add/remove already runs through
        // other channels (template cache service is flushed by the
        // controllers that perform field CRUD).
        SchemaTable::withAuditSuppressed(fn () => $table->saveQuietly());
    }
}
