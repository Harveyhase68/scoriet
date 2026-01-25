<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectKanbanRole extends Model
{
    protected $fillable = [
        'project_id',
        'user_id',
        'role',
        'assigned_by',
    ];

    /**
     * Available Kanban roles
     */
    public const ROLES = [
        'srm' => [
            'name' => 'Service Request Manager',
            'short' => 'SRM',
            'description' => 'Nimmt Anfragen entgegen und priorisiert sie',
            'color' => '#8b5cf6', // Purple
        ],
        'sdm' => [
            'name' => 'Service Delivery Manager',
            'short' => 'SDM',
            'description' => 'Sorgt für den Durchfluss und löst Blocker',
            'color' => '#06b6d4', // Cyan
        ],
        'flow_manager' => [
            'name' => 'Flow Manager',
            'short' => 'FM',
            'description' => 'Überwacht WIP-Limits und optimiert den Workflow',
            'color' => '#f59e0b', // Amber
        ],
    ];

    /**
     * Get the project this role belongs to
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the user who has this role
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user who assigned this role
     */
    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    /**
     * Get role display info
     */
    public function getRoleInfo(): array
    {
        return self::ROLES[$this->role] ?? [
            'name' => $this->role,
            'short' => strtoupper(substr($this->role, 0, 2)),
            'description' => '',
            'color' => '#6b7280',
        ];
    }

    /**
     * Get role short name (SRM, SDM, FM)
     */
    public function getRoleShort(): string
    {
        return self::ROLES[$this->role]['short'] ?? strtoupper(substr($this->role, 0, 2));
    }

    /**
     * Get role color
     */
    public function getRoleColor(): string
    {
        return self::ROLES[$this->role]['color'] ?? '#6b7280';
    }

    /**
     * Static: Get all available roles for dropdown
     */
    public static function getAvailableRoles(): array
    {
        $roles = [];
        foreach (self::ROLES as $key => $info) {
            $roles[] = [
                'value' => $key,
                'label' => $info['name'],
                'short' => $info['short'],
                'description' => $info['description'],
                'color' => $info['color'],
            ];
        }
        return $roles;
    }

    /**
     * Static: Get user's role for a specific project
     */
    public static function getUserRoleForProject(int $userId, int $projectId): ?self
    {
        return self::where('user_id', $userId)
            ->where('project_id', $projectId)
            ->first();
    }

    /**
     * Static: Set user's role for a project (creates or updates)
     */
    public static function setUserRole(int $projectId, int $userId, ?string $role, ?int $assignedBy = null): ?self
    {
        // If role is null, remove the role
        if ($role === null) {
            self::where('project_id', $projectId)
                ->where('user_id', $userId)
                ->delete();
            return null;
        }

        // Validate role
        if (!array_key_exists($role, self::ROLES)) {
            throw new \InvalidArgumentException("Invalid role: {$role}");
        }

        return self::updateOrCreate(
            ['project_id' => $projectId, 'user_id' => $userId],
            ['role' => $role, 'assigned_by' => $assignedBy]
        );
    }

    /**
     * Static: Get all roles for a project
     */
    public static function getProjectRoles(int $projectId): \Illuminate\Database\Eloquent\Collection
    {
        return self::where('project_id', $projectId)
            ->with('user')
            ->get();
    }
}
