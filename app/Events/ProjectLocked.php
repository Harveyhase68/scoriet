<?php

namespace App\Events;

use App\Models\Project;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectLocked implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Project $project,
        public int $lockedByUserId,
        public string $lockedByUserName
    ) {}

    public function broadcastOn(): array
    {
        $channels = [new PrivateChannel('project.' . $this->project->id)];

        if ($this->project->is_public) {
            $channels[] = new Channel('public-project.' . $this->project->id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'ProjectLocked';
    }

    public function broadcastWith(): array
    {
        return [
            'project_id' => $this->project->id,
            'locked_by_user_id' => $this->lockedByUserId,
            'locked_by_user_name' => $this->lockedByUserName,
            'locked_at' => now()->toISOString(),
        ];
    }
}
