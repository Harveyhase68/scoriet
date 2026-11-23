<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A project-wide global variable declaration (WinDev's `.wdp` "globals"
 * block) - name/type/default only, never code, so it renders as a typed
 * list editor rather than a code editor.
 */
class UiProjectGlobal extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'type',
        'default_value',
        'sort_order',
    ];

    protected $casts = [
        'project_id' => 'integer',
        'sort_order' => 'integer',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
