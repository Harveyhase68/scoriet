<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplateFileFieldAssignment extends Model
{
    protected $table = 'template_file_field_assignments';

    protected $fillable = [
        'template_file_id',
        'schema_field_id',
        'visibility_state',
        'sort_order',
        'created_by',
    ];

    protected $casts = [
        'template_file_id' => 'integer',
        'schema_field_id' => 'integer',
        'sort_order' => 'integer',
    ];

    // Visibility state constants
    public const VISIBILITY_VISIBLE = 'visible';
    public const VISIBILITY_GRAYED = 'grayed';
    public const VISIBILITY_INACTIVE = 'inactive';
    public const VISIBILITY_INVISIBLE = 'invisible';
    public const VISIBILITY_NOT_AVAILABLE = 'not_available';

    public static function visibilityStates(): array
    {
        return [
            self::VISIBILITY_VISIBLE,
            self::VISIBILITY_GRAYED,
            self::VISIBILITY_INACTIVE,
            self::VISIBILITY_INVISIBLE,
            self::VISIBILITY_NOT_AVAILABLE,
        ];
    }

    public function templateFile(): BelongsTo
    {
        return $this->belongsTo(TemplateFile::class, 'template_file_id');
    }

    public function schemaField(): BelongsTo
    {
        return $this->belongsTo(SchemaField::class, 'schema_field_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
