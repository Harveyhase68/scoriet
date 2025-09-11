<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchemaDesignerLayout extends Model
{
    use HasFactory;

    protected $fillable = [
        'schema_id',
        'version_number', 
        'table_name',
        'x_position',
        'y_position',
        'width',
        'height'
    ];

    protected $casts = [
        'x_position' => 'float',
        'y_position' => 'float', 
        'width' => 'float',
        'height' => 'float'
    ];

    /**
     * Get the floating schema that owns this layout
     */
    public function floatingSchema(): BelongsTo
    {
        return $this->belongsTo(FloatingSchema::class, 'schema_id');
    }

    /**
     * Save layout data for a specific schema version
     */
    public static function saveLayoutForVersion(int $schemaId, int $versionNumber, array $layoutData): void
    {
        foreach ($layoutData as $tableLayout) {
            static::updateOrCreate(
                [
                    'schema_id' => $schemaId,
                    'version_number' => $versionNumber,
                    'table_name' => $tableLayout['table_name']
                ],
                [
                    'x_position' => $tableLayout['x_position'],
                    'y_position' => $tableLayout['y_position'],
                    'width' => $tableLayout['width'] ?? null,
                    'height' => $tableLayout['height'] ?? null
                ]
            );
        }
    }

    /**
     * Get layout data for a specific schema version
     */
    public static function getLayoutForVersion(int $schemaId, int $versionNumber): array
    {
        return static::where('schema_id', $schemaId)
            ->where('version_number', $versionNumber)
            ->get()
            ->keyBy('table_name')
            ->toArray();
    }
}
