<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Per-(FormWindow × SchemaTable) layout dimension override.
 *
 * The FormWindow carries the TEMPLATE default_width / default_height.
 * This row, when present, overrides those for one specific table's layout
 * so changing the size for `users` doesn't affect `user_groups` or any
 * other table using the same window template.
 */
class FormTableLayout extends Model
{
    protected $table = 'form_table_layouts';

    protected $fillable = [
        'form_window_id',
        'schema_table_id',
        'width',
        'height',
    ];

    protected $casts = [
        'form_window_id' => 'integer',
        'schema_table_id' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
    ];

    public function formWindow(): BelongsTo
    {
        return $this->belongsTo(FormWindow::class);
    }

    public function schemaTable(): BelongsTo
    {
        return $this->belongsTo(SchemaTable::class);
    }
}
