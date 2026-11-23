<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A project-wide structure type definition (WinDev/SML `struct "Name" {
 * var field: type }`) - `fields` is a JSON array of {name, type, default}
 * since a field has no independent existence of its own.
 */
class UiProjectStruct extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'fields',
        'sort_order',
    ];

    protected $casts = [
        'project_id' => 'integer',
        'fields' => 'array',
        'sort_order' => 'integer',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
