<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectFormSet extends Model
{
    use HasFactory;

    protected $table = 'project_form_set';

    protected $fillable = [
        'project_id',
        'form_set_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // ========== RELATIONSHIPS ==========

    /**
     * Projekt
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * FormSet
     */
    public function formSet(): BelongsTo
    {
        return $this->belongsTo(FormSet::class);
    }

    // ========== SCOPES ==========

    /**
     * Nur aktive Verknüpfungen
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Für ein bestimmtes Projekt
     */
    public function scopeForProject($query, int $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    // ========== STATIC METHODS ==========

    /**
     * Aktives FormSet für ein Projekt abrufen
     */
    public static function getActiveForProject(int $projectId): ?FormSet
    {
        $link = static::forProject($projectId)->active()->with('formSet.windows.elements')->first();
        return $link?->formSet;
    }

    /**
     * FormSet für Projekt aktivieren (andere deaktivieren)
     */
    public static function activateForProject(int $projectId, int $formSetId): ProjectFormSet
    {
        // Alle anderen deaktivieren
        static::forProject($projectId)->update(['is_active' => false]);

        // Neues aktivieren oder erstellen
        return static::updateOrCreate(
            ['project_id' => $projectId, 'form_set_id' => $formSetId],
            ['is_active' => true]
        );
    }
}
