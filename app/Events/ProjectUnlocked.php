<?php

namespace App\Events;

use App\Models\Project;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectUnlocked implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Project $project
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
        return 'ProjectUnlocked';
    }

    public function broadcastWith(): array
    {
        return [
            'project_id' => $this->project->id,
        ];
    }
}
