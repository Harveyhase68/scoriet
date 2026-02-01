<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    protected $fillable = [
        'name',
        'display_name',
        'description',
        'category',
    ];

    /**
     * Get the roles that have this permission
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(TeamRole::class, 'team_role_permissions', 'permission_id', 'team_role_id')
            ->withTimestamps();
    }

    /**
     * Get all permissions grouped by category
     */
    public static function getGroupedByCategory(): array
    {
        return static::all()
            ->groupBy('category')
            ->map(function ($permissions) {
                return $permissions->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'display_name' => $permission->display_name,
                        'description' => $permission->description,
                    ];
                });
            })
            ->toArray();
    }
}
