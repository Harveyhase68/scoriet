<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ProjectSchema - Pivot Model für project_schemas Tabelle
 *
 * Verknüpft Projects mit Schemas (Many-to-Many Beziehung)
 *
 * @property int $id
 * @property int $project_id
 * @property int $schema_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class ProjectSchema extends Model
{
    use HasFactory;

    protected $table = 'project_schemas';

    protected $fillable = [
        'project_id',
        'schema_id',
    ];

    protected $casts = [
        'project_id' => 'integer',
        'schema_id' => 'integer',
    ];

    /**
     * Relationship: Gehört zu einem Project
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Relationship: Gehört zu einem Schema (FloatingSchema)
     */
    public function schema(): BelongsTo
    {
        return $this->belongsTo(FloatingSchema::class, 'schema_id');
    }
}
