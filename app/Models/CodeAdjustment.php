<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CodeAdjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'description',
        'file_pattern',
        'min_confidence',
        'is_active',
        'execution_order',
        'created_by_user_id',
    ];

    protected $casts = [
        'min_confidence' => 'decimal:2',
        'is_active' => 'boolean',
        'execution_order' => 'integer',
    ];

    // ========== RELATIONSHIPS ==========

    /**
     * Project this adjustment belongs to
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * User who created this adjustment
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * All insertions for this adjustment
     */
    public function insertions(): HasMany
    {
        return $this->hasMany(CodeAdjustmentInsertion::class)
                    ->orderBy('insertion_order');
    }

    // ========== SCOPES ==========

    /**
     * Only active adjustments
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Filter by project
     */
    public function scopeForProject($query, int $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    /**
     * Order by execution order
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('execution_order');
    }

    // ========== METHODS ==========

    /**
     * Check if this adjustment's file pattern matches a given filename
     * Handles %1, %2, etc. placeholders
     */
    public function matchesFilename(string $filename): bool
    {
        $pattern = $this->file_pattern;

        // Split pattern by %1, %2, etc. placeholders
        $parts = preg_split('/(%[1-9])/', $pattern, -1, PREG_SPLIT_DELIM_CAPTURE);

        $position = 0;
        foreach ($parts as $part) {
            // Skip placeholder parts - they match anything
            if (preg_match('/^%[1-9]$/', $part)) {
                continue;
            }

            if (empty($part)) {
                continue;
            }

            // Find this static part in the filename
            $found = strpos($filename, $part, $position);
            if ($found === false) {
                return false;
            }
            $position = $found + strlen($part);
        }

        return true;
    }

    /**
     * Convert to array for API response
     */
    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'name' => $this->name,
            'description' => $this->description,
            'file_pattern' => $this->file_pattern,
            'min_confidence' => (float) $this->min_confidence,
            'is_active' => $this->is_active,
            'execution_order' => $this->execution_order,
            'created_by_user_id' => $this->created_by_user_id,
            'insertions' => $this->insertions->map(fn($i) => $i->toApiArray())->toArray(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
