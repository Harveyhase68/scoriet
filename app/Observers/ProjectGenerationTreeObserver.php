<?php

namespace App\Observers;

use App\Models\ProjectGenerationTree;
use Illuminate\Support\Facades\Log;

class ProjectGenerationTreeObserver
{
    /**
     * Handle the ProjectGenerationTree "updated" event.
     */
    public function updated(ProjectGenerationTree $generationTree): void
    {
        // Only trigger if tree_data was actually updated
        if ($generationTree->isDirty('tree_data')) {
            // Dispatch a real-time event to frontend clients
            $this->broadcastTreeUpdate($generationTree);
        }
    }

    /**
     * Handle the ProjectGenerationTree "saved" event.
     */
    public function saved(ProjectGenerationTree $generationTree): void
    {
        // This will be triggered after both create and update operations
        // Dispatch a real-time event to frontend clients
        $this->broadcastTreeUpdate($generationTree);
    }

    /**
     * Broadcast tree update event to frontend clients
     */
    protected function broadcastTreeUpdate(ProjectGenerationTree $generationTree): void
    {
        try {
            // For WebSocket implementation (uncomment when you have WebSocket setup):
            /*
            broadcast(new \App\Events\ProjectGenerationTreeUpdated(
                $generationTree->project_id,
                $generationTree->tree_data,
                $generationTree->is_fresh
            ));
            */
        } catch (\Exception $e) {
            Log::error("🌳 [GENERATION-TREE-OBSERVER] Failed to broadcast tree update: " . $e->getMessage());
        }
    }
}