<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TemplateFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'version',
        'file_name',
        'file_path',
        'output_path',
        'file_content',
        'file_type',
        'content_type',
        'zip_filename',
        'file_order',
        'is_include_only',
        'inject_target',
        'inject_tag',
        'language_override',
    ];

    protected $casts = [
        'template_id' => 'integer',
        'version' => 'integer',
        'file_order' => 'integer',
        'is_include_only' => 'boolean',
    ];

    /**
     * Normalize output_path on every write so the DB stores one canonical form:
     *  - null/empty -> '/'
     *  - collapse consecutive slashes (e.g. '//a///b/' -> '/a/b/')
     *  - always trailing slash (except the root '/' which already ends with one)
     *
     * Runs for Eloquent ->create(), ->update(), mass-assignment, and direct
     * $model->output_path = ... assignments. Keeps Import, FileModal, seeders
     * and future write sites consistent without each having to remember the
     * trailing slash. Code generation already tolerates either form (strips
     * slashes before joining), so existing rows stay compatible.
     */
    public function setOutputPathAttribute($value): void
    {
        if ($value === null || $value === '') {
            $this->attributes['output_path'] = '/';
            return;
        }

        // Collapse consecutive slashes without regex (project convention).
        while (str_contains($value, '//')) {
            $value = str_replace('//', '/', $value);
        }

        if ($value !== '/' && !str_ends_with($value, '/')) {
            $value .= '/';
        }

        $this->attributes['output_path'] = $value;
    }

    /**
     * Get the template that owns the file.
     */
    public function template()
    {
        return $this->belongsTo(Template::class);
    }

    /**
     * Scope a query to order files by their order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderByRaw('CASE WHEN file_order > 0 THEN 0 ELSE 1 END')->orderBy('file_order')->orderBy('file_name');
    }

    /**
     * Scope a query to filter by file type.
     */
    public function scopeType($query, $type)
    {
        return $query->where('file_type', $type);
    }

    /**
     * Get the per-field assignments for this template file.
     */
    public function fieldAssignments()
    {
        return $this->hasMany(TemplateFileFieldAssignment::class, 'template_file_id');
    }
}