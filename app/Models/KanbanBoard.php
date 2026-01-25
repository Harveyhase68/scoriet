<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KanbanBoard extends Model
{
    protected $fillable = [
        'project_id',
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Default columns for a new board
     */
    public const DEFAULT_COLUMNS = [
        ['name' => 'To Do', 'color' => '#6b7280', 'position' => 0],
        ['name' => 'In Progress', 'color' => '#3b82f6', 'position' => 1],
        ['name' => 'Review', 'color' => '#f59e0b', 'position' => 2],
        ['name' => 'Done', 'color' => '#22c55e', 'position' => 3, 'is_done_column' => true],
    ];

    /**
     * Default labels for a new board
     */
    public const DEFAULT_LABELS = [
        ['name' => 'Bug', 'color' => '#ef4444'],
        ['name' => 'Feature', 'color' => '#3b82f6'],
        ['name' => 'Enhancement', 'color' => '#8b5cf6'],
        ['name' => 'Documentation', 'color' => '#06b6d4'],
        ['name' => 'Urgent', 'color' => '#f97316'],
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function columns(): HasMany
    {
        return $this->hasMany(KanbanColumn::class, 'board_id')->orderBy('position');
    }

    public function labels(): HasMany
    {
        return $this->hasMany(KanbanLabel::class, 'board_id');
    }

    /**
     * Create a board with default columns and labels
     */
    public static function createWithDefaults(int $projectId, string $name = 'Project Board'): self
    {
        $board = self::create([
            'project_id' => $projectId,
            'name' => $name,
        ]);

        // Create default columns
        foreach (self::DEFAULT_COLUMNS as $columnData) {
            $board->columns()->create($columnData);
        }

        // Create default labels
        foreach (self::DEFAULT_LABELS as $labelData) {
            $board->labels()->create($labelData);
        }

        return $board;
    }

    /**
     * Get board with all relations for display
     */
    public function loadFullBoard(): self
    {
        return $this->load([
            'columns.cards' => function ($query) {
                $query->orderBy('position');
            },
            'columns.cards.assignee',
            'columns.cards.assignees', // Multiple assignees (new)
            'columns.cards.labels',
            'columns.cards.creator',
            'labels',
        ]);
    }
}
