<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Project;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Private channel: only project members/owners can listen
Broadcast::channel('project.{projectId}', function ($user, $projectId) {
    $project = Project::find($projectId);
    if (!$project) {
        return false;
    }
    return $project->userCanAccess($user);
});
