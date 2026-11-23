<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An SML procedure, in one of two mutually exclusive scopes:
 * `project_id` set (window_id null) = a global procedure, callable from any
 * window's event code or from another global procedure.
 * `window_id` set (project_id null) = a local procedure, only callable from
 * within that one window's own event code.
 */
class UiProcedure extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'window_id',
        'name',
        'params',
        'return_type',
        'is_private',
        'code',
        'sort_order',
    ];

    protected $casts = [
        'project_id' => 'integer',
        'window_id' => 'integer',
        'is_private' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function window(): BelongsTo
    {
        return $this->belongsTo(UiWindow::class, 'window_id');
    }
}
