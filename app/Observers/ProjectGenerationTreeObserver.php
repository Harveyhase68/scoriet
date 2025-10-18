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
            Log::info("🌳 [GENERATION-TREE-OBSERVER] tree_data updated for project {$generationTree->project_id}");
            
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
        Log::info("🌳 [GENERATION-TREE-OBSERVER] saved event for project {$generationTree->project_id}");
        
        // Dispatch a real-time event to frontend clients
        $this->broadcastTreeUpdate($generationTree);
    }

    /**
     * Broadcast tree update event to frontend clients
     */
    protected function broadcastTreeUpdate(ProjectGenerationTree $generationTree): void
    {
        try {
            // In a real implementation, you would use WebSockets, Pusher, or similar
            // For now, we'll just log the event that would be broadcasted
            Log::info("🌳 [GENERATION-TREE-OBSERVER] Broadcasting update for project {$generationTree->project_id}", [
                'event' => 'project.generation_tree.updated',
                'project_id' => $generationTree->project_id,
                'is_fresh' => $generationTree->is_fresh,
                'tree_items_count' => count($generationTree->tree_data ?? []),
            ]);
            
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