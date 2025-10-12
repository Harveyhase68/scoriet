<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectGenerationTree extends Model
{
    protected $fillable = [
        'project_id',
        'tree_data',
        'is_stale',
        'generated_at',
    ];

    protected $casts = [
        'tree_data' => 'array', // Auto JSON encode/decode
        'is_stale' => 'boolean',
        'generated_at' => 'datetime',
    ];

    /**
     * Get the project that owns this generation tree
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Mark the tree as stale (needs regeneration)
     */
    public function markAsStale(): void
    {
        $this->update(['is_stale' => true]);
    }

    /**
     * Mark the tree as fresh (just regenerated)
     */
    public function markAsFresh(): void
    {
        $this->update([
            'is_stale' => false,
            'generated_at' => now(),
        ]);
    }
}
