<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * TemplateVariable Model
 *
 * Defines custom variables that a template needs
 * (e.g. {copyright}, {company_name}, {contact_email})
 */
class TemplateVariable extends Model
{
    protected $fillable = [
        'template_id',
        'variable_name',
        'description',
        'default_value',
        'is_required',
    ];

    protected $casts = [
        'is_required' => 'boolean',
    ];

    /**
     * Relationship: Template Variable belongs to Template
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }
}
