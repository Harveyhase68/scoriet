<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectReportPattern extends Model
{
    use HasFactory;

    protected $table = 'project_report_patterns';

    protected $fillable = [
        'project_id',
        'report_pattern_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function reportPattern(): BelongsTo
    {
        return $this->belongsTo(ReportPattern::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForProject($query, int $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    /**
     * Returns the project's currently active ReportPattern, eager-loaded with
     * its forms and elements so the code generator can use it without further
     * queries.
     */
    public static function getActiveForProject(int $projectId): ?ReportPattern
    {
        $link = static::forProject($projectId)
            ->active()
            ->with('reportPattern.forms.elements')
            ->first();
        return $link?->reportPattern;
    }

    /**
     * Activate a ReportPattern as the project's default. Deactivates any
     * previously active link first, then upserts.
     */
    public static function activateForProject(int $projectId, int $reportPatternId): ProjectReportPattern
    {
        static::forProject($projectId)->update(['is_active' => false]);

        return static::updateOrCreate(
            ['project_id' => $projectId, 'report_pattern_id' => $reportPatternId],
            ['is_active' => true]
        );
    }

    /**
     * Deactivate any active ReportPattern for the project (= "no default").
     */
    public static function deactivateForProject(int $projectId): int
    {
        return static::forProject($projectId)->update(['is_active' => false]);
    }
}
