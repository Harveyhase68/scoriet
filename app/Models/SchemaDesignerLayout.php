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
        'layout_data'
    ];

    protected $casts = [
        'layout_data' => 'array'
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
        // Convert layout data to table_name => layout format
        $layouts = [];
        foreach ($layoutData as $tableLayout) {
            $layouts[$tableLayout['table_name']] = [
                'x_position' => $tableLayout['x_position'],
                'y_position' => $tableLayout['y_position'],
                'width' => $tableLayout['width'] ?? null,
                'height' => $tableLayout['height'] ?? null
            ];
        }

        static::updateOrCreate(
            [
                'schema_id' => $schemaId,
                'version_number' => $versionNumber
            ],
            [
                'layout_data' => $layouts
            ]
        );
    }

    /**
     * Get layout data for a specific schema version
     */
    public static function getLayoutForVersion(int $schemaId, int $versionNumber): array
    {
        $layout = static::where('schema_id', $schemaId)
            ->where('version_number', $versionNumber)
            ->first();

        return $layout ? $layout->layout_data : [];
    }
}
