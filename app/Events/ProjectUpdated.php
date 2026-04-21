<?php

namespace App\Events;

use App\Models\Project;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectUpdated implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Project $project,
        public int $updatedByUserId
    ) {}

    public function broadcastOn(): array
    {
        $channels = [new PrivateChannel('project.' . $this->project->id)];

        // Also broadcast on a public channel if the project is public
        if ($this->project->is_public) {
            $channels[] = new Channel('public-project.' . $this->project->id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'ProjectUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'project_id' => $this->project->id,
            'updated_by' => $this->updatedByUserId,
            'updated_at' => $this->project->updated_at?->toISOString(),
        ];
    }
}
