<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectTemplateUsage extends Model
{
    protected $table = 'project_template_usage';

    protected $fillable = [
        'project_id',
        'template_id',
        'usage_type',
        'alias',
        'config',
        'is_active',
        'used_at',
    ];

    protected $casts = [
        'config' => 'array',
        'is_active' => 'boolean',
        'used_at' => 'datetime',
    ];

    /**
     * Get the project that uses this template
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the template being used
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    /**
     * Check if this is a linked usage (read-only)
     */
    public function isLinked(): bool
    {
        return $this->usage_type === 'linked';
    }

    /**
     * Check if this is a cloned usage (editable)
     */
    public function isCloned(): bool
    {
        return $this->usage_type === 'cloned';
    }

    /**
     * Scope for linked templates
     */
    public function scopeLinked($query)
    {
        return $query->where('usage_type', 'linked');
    }

    /**
     * Scope for cloned templates
     */
    public function scopeCloned($query)
    {
        return $query->where('usage_type', 'cloned');
    }

    /**
     * Scope for active usages
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
