<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TemplateFile extends Model
{
    use HasFactory;

    /**
     * Form Window Type constants
     * 0 = Kein Formular (Standard) - für Controller, Services, etc.
     * 1 = Main Menu
     * 2 = Create/Edit Form
     * 3 = Data Table
     * 4 = Report Single
     * 5 = Report List
     */
    public const FORM_WINDOW_NONE = 0;
    public const FORM_WINDOW_MAIN_MENU = 1;
    public const FORM_WINDOW_CREATE_EDIT = 2;
    public const FORM_WINDOW_DATA_TABLE = 3;
    public const FORM_WINDOW_REPORT_SINGLE = 4;
    public const FORM_WINDOW_REPORT_LIST = 5;

    public static function formWindowTypes(): array
    {
        return [
            self::FORM_WINDOW_NONE => __('templatefilephp29'),
            self::FORM_WINDOW_MAIN_MENU => __('templatefilephp30'),
            self::FORM_WINDOW_CREATE_EDIT => __('templatefilephp31'),
            self::FORM_WINDOW_DATA_TABLE => __('templatefilephp32'),
            self::FORM_WINDOW_REPORT_SINGLE => __('templatefilephp33'),
            self::FORM_WINDOW_REPORT_LIST => __('templatefilephp34'),
        ];
    }
    
    protected $fillable = [
        'template_id',
        'file_name',
        'file_path',
        'output_path',
        'file_content',
        'file_type',
        'content_type',
        'zip_filename',
        'file_order',
        'form_window_type',
        'is_include_only',
    ];

    protected $casts = [
        'template_id' => 'integer',
        'file_order' => 'integer',
        'form_window_type' => 'integer',
        'is_include_only' => 'boolean',
    ];

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
        return $query->orderBy('file_order');
    }

    /**
     * Scope a query to filter by file type.
     */
    public function scopeType($query, $type)
    {
        return $query->where('file_type', $type);
    }
}