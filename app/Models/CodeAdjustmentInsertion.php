<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CodeAdjustmentInsertion extends Model
{
    use HasFactory;

    protected $fillable = [
        'code_adjustment_id',
        'insertion_type',
        'anchor_text',
        'insertion_content',
        'line_offset',
        'insertion_order',
        'description',
    ];

    protected $casts = [
        'line_offset' => 'integer',
        'insertion_order' => 'integer',
    ];

    /**
     * Valid insertion types
     */
    public const INSERTION_TYPES = ['beginning', 'end', 'middle'];

    // ========== RELATIONSHIPS ==========

    /**
     * The code adjustment this insertion belongs to
     */
    public function codeAdjustment(): BelongsTo
    {
        return $this->belongsTo(CodeAdjustment::class);
    }

    // ========== METHODS ==========

    /**
     * Get the anchor text with normalized line endings
     */
    public function getNormalizedAnchorText(): string
    {
        return str_replace(["\r\n", "\r"], "\n", $this->anchor_text);
    }

    /**
     * Get the insertion content with normalized line endings
     */
    public function getNormalizedInsertionContent(): string
    {
        return str_replace(["\r\n", "\r"], "\n", $this->insertion_content);
    }

    /**
     * Convert to array for API response
     */
    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'code_adjustment_id' => $this->code_adjustment_id,
            'insertion_type' => $this->insertion_type,
            'anchor_text' => $this->anchor_text,
            'insertion_content' => $this->insertion_content,
            'line_offset' => $this->line_offset,
            'insertion_order' => $this->insertion_order,
            'description' => $this->description,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
