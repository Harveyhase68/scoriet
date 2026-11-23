<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A project-wide named constant (SML `constants { const NAME = value }`).
 * No type field - SML constants carry none, unlike variables.
 */
class UiProjectConstant extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'value',
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
