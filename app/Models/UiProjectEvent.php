<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * SML code-behind for a project-level event (`on project <event> { }`),
 * e.g. the startup/init code from a WinDev `.wdp` project file. Mirrors
 * UiWindowEvent's shape, simplified: a project has no controls/elements of
 * its own to attach an event to.
 */
class UiProjectEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'event_name',
        'code',
    ];

    protected $casts = [
        'project_id' => 'integer',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
