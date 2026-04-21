<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportPatternFieldAssignment extends Model
{
    protected $table = 'report_pattern_field_assignments';

    protected $fillable = [
        'report_pattern_id',
        'schema_field_id',
        'visibility_state',
        'sort_order',
        'created_by',
    ];

    protected $casts = [
        'report_pattern_id' => 'integer',
        'schema_field_id' => 'integer',
        'sort_order' => 'integer',
    ];

    // Same visibility enum as TemplateFileFieldAssignment for consistency.
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

    public function reportPattern(): BelongsTo
    {
        return $this->belongsTo(ReportPattern::class, 'report_pattern_id');
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
