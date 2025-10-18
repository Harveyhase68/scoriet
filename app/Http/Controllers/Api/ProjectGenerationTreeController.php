<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProjectGenerationTree;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProjectGenerationTreeController extends Controller
{
    /**
     * Get the latest generation tree for a project with version info
     */
    public function show(Request $request, $projectId): JsonResponse
    {
        try {
            $generationTree = ProjectGenerationTree::where('project_id', $projectId)->first();
            
            if (!$generationTree) {
                return response()->json([
                    'success' => false,
                    'message' => 'No generation tree found for this project',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $generationTree,
                'tree_items_count' => count($generationTree->tree_data ?? []),
                'is_fresh' => $generationTree->is_fresh,
                'updated_at' => $generationTree->updated_at->toISOString(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check for updates since a given timestamp
     */
    public function checkUpdates(Request $request, $projectId): JsonResponse
    {
        try {
            $since = $request->get('since');
            if (!$since) {
                return response()->json([
                    'success' => false,
                    'error' => 'Missing "since" parameter',
                ], 400);
            }

            $generationTree = ProjectGenerationTree::where('project_id', $projectId)->first();
            
            if (!$generationTree) {
                return response()->json([
                    'success' => false,
                    'message' => 'No generation tree found for this project',
                ], 404);
            }

            $lastUpdate = $generationTree->updated_at->toISOString();
            $hasUpdates = $generationTree->updated_at->greaterThan($since);

            return response()->json([
                'success' => true,
                'has_updates' => $hasUpdates,
                'last_update' => $lastUpdate,
                'tree_items_count' => count($generationTree->tree_data ?? []),
                'is_fresh' => $generationTree->is_fresh,
                // Only include tree data if there are updates to save bandwidth
                'tree_data' => $hasUpdates ? $generationTree->tree_data : null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}