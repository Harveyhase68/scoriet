<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ProjectTemplateVariableValue Model
 *
 * Stores the actual values for template variables per project and language
 * (e.g. copyright="© 2025 Alexander Predl, Österreich" for language="de")
 */
class ProjectTemplateVariableValue extends Model
{
    protected $fillable = [
        'project_id',
        'template_id',
        'variable_name',
        'language',
        'value',
    ];

    /**
     * Relationship: Value belongs to Project
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Relationship: Value belongs to Template
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }
}
