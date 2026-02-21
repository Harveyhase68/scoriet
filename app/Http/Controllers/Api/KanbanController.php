<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KanbanBoard;
use App\Models\KanbanCard;
use App\Models\KanbanColumn;
use App\Models\KanbanLabel;
use App\Models\KanbanCardComment;
use App\Models\MessageThread;
use App\Models\Project;
use App\Models\ProjectKanbanRole;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Jobs\SendPushNotificationJob;

class KanbanController extends Controller
{
    // ========== ACCESS CONTROL ==========

    /**
     * Check if user has Kanban Board access
     * GET /api/kanban/access
     *
     * Checks three levels of access:
     * 1. User-level subscription (admin, patron, credits-based)
     * 2. Team-based access (user is a team member with kanban.use permission)
     */
    public function checkAccess(): JsonResponse
    {
        $user = Auth::user();
        $status = Subscription::getKanbanBoardAccessStatus($user->id);
        $status['user_credits'] = $user->credits ?? 0;

        // If user already has access via subscription, return immediately
        if (!empty($status['has_access'])) {
            return response()->json($status);
        }

        // Check team-based access: is the user a team member of any project
        // where their team role grants kanban.use permission?
        $hasTeamAccess = $this->userHasTeamKanbanAccess($user);

        if ($hasTeamAccess) {
            $status['has_access'] = true;
            $status['access_type'] = 'team';
        }

        return response()->json($status);
    }

    /**
     * Check if user has Kanban access via team membership on any project.
     * Returns true if the user is a team member with kanban.use permission.
     */
    private function userHasTeamKanbanAccess($user): bool
    {
        // Find all teams the user is a member of
        $teamMemberships = \App\Models\TeamMember::where('user_id', $user->id)->get();

        foreach ($teamMemberships as $membership) {
            // Team owner always has all permissions
            $team = \App\Models\Team::find($membership->team_id);
            if ($team && (string)$team->project_owner_id === (string)$user->id) {
                return true;
            }

            // Check if team member's role has kanban.use permission
            if ($membership->hasPermission('kanban.use')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Unlock Kanban Board with credits
     * POST /api/kanban/unlock
     */
    public function unlockFeature(): JsonResponse
    {
        $user = Auth::user();

        // Check if already unlocked
        if (Subscription::hasKanbanBoardAccess($user->id)) {
            return response()->json([
                'success' => true,
                'message' => __('kanbancontrollerphp92'),
            ]);
        }

        // Check if enough credits
        $cost = Subscription::KANBAN_BOARD_UNLOCK_COST;
        if (($user->credits ?? 0) < $cost) {
            return response()->json([
                'success' => false,
                'error' => __('kanbancontrollerphp101'),
                'required' => $cost,
                'available' => $user->credits ?? 0,
            ], 400);
        }

        // Unlock
        $subscription = Subscription::unlockKanbanBoardWithCredits($user->id);
        if (!$subscription) {
            return response()->json([
                'success' => false,
                'error' => __('kanbancontrollerphp112'),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => __('kanbancontrollerphp118'),
            'credits_spent' => $cost,
            'credits_remaining' => $user->fresh()->credits ?? 0,
        ]);
    }

    // ========== BOARD OPERATIONS ==========

    /**
     * Get board for a project (create if not exists)
     */
    public function getBoard(int $projectId): JsonResponse
    {
        $user = auth()->user();

        // Check project access - use the Project model's permission methods
        $project = Project::find($projectId);

        if (!$project) {
            return response()->json(['message' => __('kanbancontrollerphp137')], 404);
        }

        if (!$project->userCanUseKanban($user)) {
            return response()->json(['message' => __('kanbancontrollerphp141')], 403);
        }

        // Get or create board
        $board = KanbanBoard::where('project_id', $projectId)->first();

        if (!$board) {
            $board = KanbanBoard::createWithDefaults($projectId, $project->name . __('kanbancontrollerphp148'));
        }

        $board->loadFullBoard();

        // Get roles for this project
        $projectRoles = ProjectKanbanRole::getProjectRoles($projectId)->keyBy('user_id');

        // Transform board data to include Kanban display info for assignees
        $boardData = $board->toArray();
        foreach ($boardData['columns'] as &$column) {
            foreach ($column['cards'] as &$card) {
                // Transform assignees to include initials, color, and role
                if (isset($card['assignees'])) {
                    $card['assignees'] = collect($card['assignees'])->map(function ($assignee) use ($projectRoles) {
                        $user = \App\Models\User::find($assignee['id']);
                        $userRole = $projectRoles->get($assignee['id']);
                        $roleInfo = $userRole ? $userRole->getRoleInfo() : null;

                        return [
                            'id' => $assignee['id'],
                            'username' => $assignee['username'] ?? null,
                            'name' => $assignee['name'] ?? null,
                            'initials' => $user ? $user->getKanbanInitials() : strtoupper(substr($assignee['username'] ?? 'U', 0, 2)),
                            'color' => $user ? $user->getKanbanColor() : '#3b82f6',
                            'kanban_role' => $userRole ? $userRole->role : null,
                            'kanban_role_short' => $roleInfo ? $roleInfo['short'] : null,
                            'kanban_role_color' => $roleInfo ? $roleInfo['color'] : null,
                        ];
                    })->toArray();
                }
            }
        }

        return response()->json([
            'board' => $boardData,
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'owner_id' => $project->owner_id,
            ],
        ]);
    }

    /**
     * Update board settings
     */
    public function updateBoard(Request $request, int $boardId): JsonResponse
    {
        $board = $this->getBoardWithAccess($boardId);
        if (!$board) {
            return response()->json(['message' => __('kanbancontrollerphp199')], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'description' => 'nullable|string',
        ]);

        $board->update($validated);

        return response()->json(['board' => $board]);
    }

    /**
     * Create a new column
     */
    public function createColumn(Request $request, int $boardId): JsonResponse
    {
        $board = $this->getBoardWithAccess($boardId);
        if (!$board) {
            return response()->json(['message' => __('kanbancontrollerphp219')], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'color' => 'sometimes|string|max:7',
            'wip_limit' => 'nullable|integer|min:1',
            'is_done_column' => 'sometimes|boolean',
        ]);

        // Get max position
        $maxPosition = $board->columns()->max('position') ?? -1;
        $validated['position'] = $maxPosition + 1;

        $column = $board->columns()->create($validated);

        return response()->json(['column' => $column], 201);
    }

    /**
     * Update a column
     */
    public function updateColumn(Request $request, int $columnId): JsonResponse
    {
        $column = KanbanColumn::find($columnId);
        if (!$column || !$this->hasAccessToBoard($column->board_id)) {
            return response()->json(['message' => __('kanbancontrollerphp245')], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'color' => 'sometimes|string|max:7',
            'wip_limit' => 'nullable|integer|min:1',
            'is_done_column' => 'sometimes|boolean',
        ]);

        $column->update($validated);

        return response()->json(['column' => $column]);
    }

    /**
     * Delete a column
     */
    public function deleteColumn(int $columnId): JsonResponse
    {
        $column = KanbanColumn::find($columnId);
        if (!$column || !$this->hasAccessToBoard($column->board_id)) {
            return response()->json(['message' => __('kanbancontrollerphp267')], 404);
        }

        // Check if column has cards
        if ($column->cards()->count() > 0) {
            return response()->json(['message' => __('kanbancontrollerphp272')], 422);
        }

        $column->delete();

        return response()->json(['message' => 'Column deleted']);
    }

    /**
     * Reorder columns
     */
    public function reorderColumns(Request $request, int $boardId): JsonResponse
    {
        $board = $this->getBoardWithAccess($boardId);
        if (!$board) {
            return response()->json(['message' => __('kanbancontrollerphp287')], 404);
        }

        $validated = $request->validate([
            'columns' => 'required|array',
            'columns.*.id' => 'required|integer',
            'columns.*.position' => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['columns'] as $columnData) {
                KanbanColumn::where('id', $columnData['id'])
                    ->update(['position' => $columnData['position']]);
            }
        });

        return response()->json(['message' => __('kanbancontrollerphp303')]);
    }

    /**
     * Create a new card
     */
    public function createCard(Request $request, int $columnId): JsonResponse
    {
        $column = KanbanColumn::find($columnId);
        if (!$column || !$this->hasAccessToBoard($column->board_id)) {
            return response()->json(['message' => __('kanbancontrollerphp313')], 404);
        }

        // Check WIP limit
        if ($column->isWipLimitReached()) {
            return response()->json(['message' => __('kanbancontrollerphp318')], 422);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'due_date' => 'nullable|date',
            'assigned_to' => 'nullable|integer|exists:users,id',
            'estimated_hours' => 'nullable|integer|min:0',
            'label_ids' => 'sometimes|array',
            'label_ids.*' => 'integer|exists:kanban_labels,id',
        ]);

        $user = auth()->user();

        // Get max position in column
        $maxPosition = $column->cards()->max('position') ?? -1;

        $card = $column->cards()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'color' => $validated['color'] ?? null,
            'priority' => $validated['priority'] ?? 'medium',
            'due_date' => $validated['due_date'] ?? null,
            'assigned_to' => $validated['assigned_to'] ?? null,
            'estimated_hours' => $validated['estimated_hours'] ?? null,
            'created_by' => $user->id,
            'position' => $maxPosition + 1,
        ]);

        // Attach labels
        if (!empty($validated['label_ids'])) {
            $card->labels()->attach($validated['label_ids']);
        }

        // Log activity
        $card->logActivity($user->id, 'created');

        $card->load(['assignee', 'labels', 'creator']);

        return response()->json(['card' => $card], 201);
    }

    /**
     * Update a card
     */
    public function updateCard(Request $request, int $cardId): JsonResponse
    {
        $card = KanbanCard::find($cardId);
        if (!$card || !$this->hasAccessToBoard($card->column->board_id)) {
            return response()->json(['message' => __('kanbancontrollerphp370')], 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'due_date' => 'nullable|date',
            'assigned_to' => 'nullable|integer|exists:users,id',
            'estimated_hours' => 'nullable|integer|min:0',
            'actual_hours' => 'nullable|integer|min:0',
            'label_ids' => 'sometimes|array',
            'label_ids.*' => 'integer|exists:kanban_labels,id',
        ]);

        $user = auth()->user();
        $oldValues = $card->only(['title', 'description', 'priority', 'due_date', 'assigned_to']);

        // Handle assigned_to change
        if (isset($validated['assigned_to']) && $validated['assigned_to'] !== $card->assigned_to) {
            $action = $validated['assigned_to'] ? 'assigned' : 'unassigned';
            $card->logActivity($user->id, $action,
                ['assigned_to' => $card->assigned_to],
                ['assigned_to' => $validated['assigned_to']]
            );
        }

        // Update card (excluding label_ids)
        $cardData = collect($validated)->except(['label_ids'])->toArray();
        $card->update($cardData);

        // Sync labels if provided
        if (isset($validated['label_ids'])) {
            $card->labels()->sync($validated['label_ids']);
        }

        // Log general update
        $card->logActivity($user->id, 'updated', $oldValues, $card->only(['title', 'description', 'priority', 'due_date', 'assigned_to']));

        $card->load(['assignee', 'labels', 'creator']);

        return response()->json(['card' => $card]);
    }

    /**
     * Move a card to another column or reorder
     */
    public function moveCard(Request $request, int $cardId): JsonResponse
    {
        $card = KanbanCard::find($cardId);
        if (!$card || !$this->hasAccessToBoard($card->column->board_id)) {
            return response()->json(['message' => __('kanbancontrollerphp422')], 404);
        }

        $validated = $request->validate([
            'column_id' => 'required|integer|exists:kanban_columns,id',
            'position' => 'required|integer|min:0',
        ]);

        $newColumn = KanbanColumn::find($validated['column_id']);

        // Check WIP limit on target column (if moving to different column)
        if ($newColumn->id !== $card->column_id && $newColumn->isWipLimitReached()) {
            return response()->json(['message' => __('kanbancontrollerphp434')], 422);
        }

        $user = auth()->user();

        // Store old column info for notification
        $oldColumnId = $card->column_id;
        $oldColumn = KanbanColumn::find($oldColumnId);
        $oldColumnName = $oldColumn ? $oldColumn->name : __('kanbancontrollerphp442');

        // Update positions of other cards in the target column
        DB::transaction(function () use ($card, $validated, $user, $oldColumnId) {
            $oldPosition = $card->position;

            // If moving within same column
            if ($oldColumnId == $validated['column_id']) {
                if ($oldPosition < $validated['position']) {
                    // Moving down - decrease position of cards in between
                    KanbanCard::where('column_id', $oldColumnId)
                        ->where('position', '>', $oldPosition)
                        ->where('position', '<=', $validated['position'])
                        ->decrement('position');
                } else {
                    // Moving up - increase position of cards in between
                    KanbanCard::where('column_id', $oldColumnId)
                        ->where('position', '>=', $validated['position'])
                        ->where('position', '<', $oldPosition)
                        ->increment('position');
                }
            } else {
                // Moving to different column
                // Decrease positions in old column
                KanbanCard::where('column_id', $oldColumnId)
                    ->where('position', '>', $oldPosition)
                    ->decrement('position');

                // Increase positions in new column
                KanbanCard::where('column_id', $validated['column_id'])
                    ->where('position', '>=', $validated['position'])
                    ->increment('position');
            }

            // Move the card
            $card->moveToColumn($validated['column_id'], $validated['position'], $user->id);
        });

        $card->load(['assignee', 'assignees', 'labels', 'creator', 'column']);

        // Send notification to assignees if card was moved to a different column
        if ($oldColumnId != $validated['column_id']) {
            $this->notifyAssigneesOfCardMove($card, $user, $oldColumnName, $newColumn->name);
        }

        return response()->json(['card' => $card]);
    }

    /**
     * Notify assignees when their card is moved by another user
     */
    private function notifyAssigneesOfCardMove(KanbanCard $card, $mover, string $fromColumn, string $toColumn): void
    {
        // Get all assignees except the user who moved the card
        $assigneesToNotify = $card->assignees->filter(function ($assignee) use ($mover) {
            return $assignee->id !== $mover->id;
        });

        if ($assigneesToNotify->isEmpty()) {
            return;
        }

        // Get project name for context
        $board = $card->column->board;
        $project = Project::find($board->project_id);
        $projectName = $project ? $project->name : 'Projekt';

        // Create message for each assignee
        foreach ($assigneesToNotify as $assignee) {
            $subject = __('kanbancontrollerphp511')."\"{$card->title}\"".__('kanbancontrollerphp511_2');

            $body = "Hallo {$assignee->username},\n\n" .
                __('kanbancontrollerphp514_3')."**\"{$card->title}\"".__('kanbancontrollerphp514')."{$projectName}".__('kanbancontrollerphp514_2')."\n\n" .
                __('kanbancontrollerphp515')."{$fromColumn}\n" .
                __('kanbancontrollerphp516')."{$toColumn}\n\n" .
                __('kanbancontrollerphp517')."\n\n" .
                __('kanbancontrollerphp518')."\n" . 
                "{$mover->username}";

            // Create a direct message thread from the mover to the assignee
            MessageThread::createWithMessage(
                $subject,
                $mover->id,
                [$assignee->id],
                $body
            );
        }

        // Send push notification to all assignees
        $assigneeIds = $assigneesToNotify->pluck('id')->toArray();
        SendPushNotificationJob::dispatch(
            $assigneeIds,
            __('push.kanban_card_moved'),
            $card->title,
            '/',
            'kanban'
        );
    }

    /**
     * Delete a card
     */
    public function deleteCard(int $cardId): JsonResponse
    {
        $card = KanbanCard::find($cardId);
        if (!$card || !$this->hasAccessToBoard($card->column->board_id)) {
            return response()->json(['message' => __('kanbancontrollerphp538')], 404);
        }

        $columnId = $card->column_id;
        $position = $card->position;

        $card->delete();

        // Update positions of remaining cards
        KanbanCard::where('column_id', $columnId)
            ->where('position', '>', $position)
            ->decrement('position');

        return response()->json(['message' => __('kanbancontrollerphp551')]);
    }

    /**
     * Add comment to card
     */
    public function addComment(Request $request, int $cardId): JsonResponse
    {
        $card = KanbanCard::find($cardId);
        if (!$card || !$this->hasAccessToBoard($card->column->board_id)) {
            return response()->json(['message' => __('kanbancontrollerphp561')], 404);
        }

        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $user = auth()->user();

        $comment = $card->comments()->create([
            'user_id' => $user->id,
            'content' => $validated['content'],
        ]);

        $card->logActivity($user->id, 'commented');

        $comment->load('user');

        return response()->json(['comment' => $comment], 201);
    }

    /**
     * Get card details with comments and activities
     */
    public function getCard(int $cardId): JsonResponse
    {
        $card = KanbanCard::find($cardId);
        if (!$card || !$this->hasAccessToBoard($card->column->board_id)) {
            return response()->json(['message' => __('kanbancontrollerphp589')], 404);
        }

        $card->load([
            'assignee',
            'creator',
            'labels',
            'column',
            'comments.user',
            'activities.user',
        ]);

        return response()->json(['card' => $card]);
    }

    /**
     * Create a label
     */
    public function createLabel(Request $request, int $boardId): JsonResponse
    {
        $board = $this->getBoardWithAccess($boardId);
        if (!$board) {
            return response()->json(['message' => __('kanbancontrollerphp611')], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'color' => 'sometimes|string|max:7',
        ]);

        $label = $board->labels()->create($validated);

        return response()->json(['label' => $label], 201);
    }

    /**
     * Update a label
     */
    public function updateLabel(Request $request, int $labelId): JsonResponse
    {
        $label = KanbanLabel::find($labelId);
        if (!$label || !$this->hasAccessToBoard($label->board_id)) {
            return response()->json(['message' => __('kanbancontrollerphp631')], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:50',
            'color' => 'sometimes|string|max:7',
        ]);

        $label->update($validated);

        return response()->json(['label' => $label]);
    }

    /**
     * Delete a label
     */
    public function deleteLabel(int $labelId): JsonResponse
    {
        $label = KanbanLabel::find($labelId);
        if (!$label || !$this->hasAccessToBoard($label->board_id)) {
            return response()->json(['message' => __('kanbancontrollerphp651')], 404);
        }

        $label->delete();

        return response()->json(['message' => __('kanbancontrollerphp656')]);
    }

    // ========== ASSIGNEE OPERATIONS ==========

    /**
     * Assign current user to a card (self-assign)
     * POST /api/kanban/cards/{cardId}/assign-me
     */
    public function assignMe(int $cardId): JsonResponse
    {
        $card = KanbanCard::find($cardId);
        if (!$card || !$this->hasAccessToBoard($card->column->board_id)) {
            return response()->json(['message' => __('kanbancontrollerphp669')], 404);
        }

        $user = auth()->user();

        // Check if already assigned
        if ($card->isAssignedTo($user->id)) {
            return response()->json(['message' => __('kanbancontrollerphp676')], 422);
        }

        $card->assignUser($user->id, $user->id);

        $card->load(['assignees', 'labels', 'creator']);

        return response()->json([
            'message' => __('kanbancontrollerphp684'),
            'card' => $this->transformCardWithKanbanInfo($card),
        ]);
    }

    /**
     * Remove current user from a card (self-unassign)
     * DELETE /api/kanban/cards/{cardId}/unassign-me
     */
    public function unassignMe(int $cardId): JsonResponse
    {
        $card = KanbanCard::find($cardId);
        if (!$card || !$this->hasAccessToBoard($card->column->board_id)) {
            return response()->json(['message' => __('kanbancontrollerphp697')], 404);
        }

        $user = auth()->user();

        // Check if assigned
        if (!$card->isAssignedTo($user->id)) {
            return response()->json(['message' => __('kanbancontrollerphp704')], 422);
        }

        $card->unassignUser($user->id, $user->id);

        $card->load(['assignees', 'labels', 'creator']);

        return response()->json([
            'message' => __('kanbancontrollerphp712'),
            'card' => $this->transformCardWithKanbanInfo($card),
        ]);
    }

    /**
     * Transform card to include Kanban display info for assignees
     */
    private function transformCardWithKanbanInfo(KanbanCard $card): array
    {
        $cardData = $card->toArray();

        // Get project ID from card's column's board
        $projectId = $card->column->board->project_id;
        $projectRoles = ProjectKanbanRole::getProjectRoles($projectId)->keyBy('user_id');

        if (isset($cardData['assignees'])) {
            $cardData['assignees'] = collect($cardData['assignees'])->map(function ($assignee) use ($projectRoles) {
                $user = \App\Models\User::find($assignee['id']);
                $userRole = $projectRoles->get($assignee['id']);
                $roleInfo = $userRole ? $userRole->getRoleInfo() : null;

                return [
                    'id' => $assignee['id'],
                    'username' => $assignee['username'] ?? null,
                    'name' => $assignee['name'] ?? null,
                    'initials' => $user ? $user->getKanbanInitials() : strtoupper(substr($assignee['username'] ?? 'U', 0, 2)),
                    'color' => $user ? $user->getKanbanColor() : '#3b82f6',
                    'kanban_role' => $userRole ? $userRole->role : null,
                    'kanban_role_short' => $roleInfo ? $roleInfo['short'] : null,
                    'kanban_role_color' => $roleInfo ? $roleInfo['color'] : null,
                ];
            })->toArray();
        }

        return $cardData;
    }

    /**
     * Assign a user to a card
     * POST /api/kanban/cards/{cardId}/assignees
     */
    public function addAssignee(Request $request, int $cardId): JsonResponse
    {
        $card = KanbanCard::find($cardId);
        if (!$card || !$this->hasAccessToBoard($card->column->board_id)) {
            return response()->json(['message' => __('kanbancontrollerphp758')], 404);
        }

        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        $currentUser = auth()->user();

        // Verify the user being assigned has access to the project
        $board = $card->column->board;
        $project = Project::find($board->project_id);
        $targetUser = \App\Models\User::find($validated['user_id']);

        if (!$project->userCanAccess($targetUser)) {
            return response()->json(['message' => __('kanbancontrollerphp773')], 403);
        }

        // Check if already assigned
        if ($card->isAssignedTo($validated['user_id'])) {
            return response()->json(['message' => __('kanbancontrollerphp778')], 422);
        }

        $card->assignUser($validated['user_id'], $currentUser->id);

        $card->load(['assignees', 'labels', 'creator']);

        return response()->json([
            'message' => 'User assigned successfully',
            'card' => $card,
        ]);
    }

    /**
     * Remove a user from a card
     * DELETE /api/kanban/cards/{cardId}/assignees/{userId}
     */
    public function removeAssignee(int $cardId, int $userId): JsonResponse
    {
        $card = KanbanCard::find($cardId);
        if (!$card || !$this->hasAccessToBoard($card->column->board_id)) {
            return response()->json(['message' => __('kanbancontrollerphp799')], 404);
        }

        $currentUser = auth()->user();

        // Users can always remove themselves
        // Project owner can remove anyone
        $board = $card->column->board;
        $project = Project::find($board->project_id);

        if ($userId !== $currentUser->id && $project->owner_id !== $currentUser->id) {
            return response()->json(['message' => __('kanbancontrollerphp810')], 403);
        }

        // Check if assigned
        if (!$card->isAssignedTo($userId)) {
            return response()->json(['message' => __('kanbancontrollerphp815')], 422);
        }

        $card->unassignUser($userId, $currentUser->id);

        $card->load(['assignees', 'labels', 'creator']);

        return response()->json([
            'message' => __('kanbancontrollerphp823'),
            'card' => $card,
        ]);
    }

    /**
     * Get available team members for assignment
     * GET /api/kanban/boards/{boardId}/team-members
     */
    public function getTeamMembers(int $boardId): JsonResponse
    {
        $board = $this->getBoardWithAccess($boardId);
        if (!$board) {
            return response()->json(['message' => __('kanbancontrollerphp836')], 404);
        }

        $project = Project::find($board->project_id);
        if (!$project) {
            return response()->json(['message' => __('kanbancontrollerphp841')], 404);
        }

        // Get all users who have access to this project
        $members = collect();

        // Owner
        if ($project->owner) {
            $members->push($project->owner);
        }

        // Team members (if project has team)
        if ($project->team) {
            foreach ($project->team->members as $member) {
                if (!$members->contains('id', $member->id)) {
                    $members->push($member);
                }
            }
        }

        // Direct project members (if any)
        foreach ($project->members as $projectMember) {
            // ProjectMember is a pivot model, get the actual User
            $user = $projectMember->user;
            if ($user && !$members->contains('id', $user->id)) {
                $members->push($user);
            }
        }

        // Get roles for this project
        $projectRoles = ProjectKanbanRole::getProjectRoles($project->id)
            ->keyBy('user_id');

        $memberData = $members->map(function ($user) use ($projectRoles) {
            $userRole = $projectRoles->get($user->id);
            $roleInfo = $userRole ? $userRole->getRoleInfo() : null;

            return [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'avatar_url' => $user->avatar_url ?? null,
                'initials' => $user->getKanbanInitials(),
                'color' => $user->getKanbanColor(),
                'has_custom_initials' => !empty($user->kanban_initials),
                'kanban_role' => $userRole ? $userRole->role : null,
                'kanban_role_short' => $roleInfo ? $roleInfo['short'] : null,
                'kanban_role_name' => $roleInfo ? $roleInfo['name'] : null,
                'kanban_role_color' => $roleInfo ? $roleInfo['color'] : null,
            ];
        });

        // Check for duplicate initials within the team
        $initialsConflicts = $this->findInitialsConflicts($memberData);

        return response()->json([
            'members' => $memberData,
            'initials_conflicts' => $initialsConflicts,
            'available_roles' => ProjectKanbanRole::getAvailableRoles(),
        ]);
    }

    /**
     * Find users with duplicate initials within the team
     */
    private function findInitialsConflicts($members): array
    {
        $initialsMap = [];
        $conflicts = [];

        foreach ($members as $member) {
            $initials = $member['initials'];
            if (!isset($initialsMap[$initials])) {
                $initialsMap[$initials] = [];
            }
            $initialsMap[$initials][] = $member['username'];
        }

        foreach ($initialsMap as $initials => $usernames) {
            if (count($usernames) > 1) {
                $conflicts[] = [
                    'initials' => $initials,
                    'users' => $usernames,
                ];
            }
        }

        return $conflicts;
    }

    /**
     * Helper: Get board with access check
     */
    private function getBoardWithAccess(int $boardId): ?KanbanBoard
    {
        $board = KanbanBoard::find($boardId);
        if (!$board) {
            return null;
        }

        if (!$this->hasAccessToBoard($boardId)) {
            return null;
        }

        return $board;
    }

    // ==================== KANBAN ROLES ====================

    /**
     * Get available Kanban roles
     * GET /api/kanban/roles
     */
    public function getAvailableRoles(): JsonResponse
    {
        return response()->json([
            'roles' => ProjectKanbanRole::getAvailableRoles(),
        ]);
    }

    /**
     * Get roles for a project's board
     * GET /api/kanban/board/{boardId}/roles
     */
    public function getProjectRoles(int $boardId): JsonResponse
    {
        $board = KanbanBoard::find($boardId);
        if (!$board || !$this->hasAccessToBoard($boardId)) {
            return response()->json(['message' => __('kanbancontrollerphp969')], 404);
        }

        $roles = ProjectKanbanRole::getProjectRoles($board->project_id);

        $rolesData = $roles->map(function ($role) {
            $roleInfo = $role->getRoleInfo();
            return [
                'id' => $role->id,
                'user_id' => $role->user_id,
                'username' => $role->user->username,
                'role' => $role->role,
                'role_name' => $roleInfo['name'],
                'role_short' => $roleInfo['short'],
                'role_color' => $roleInfo['color'],
            ];
        });

        return response()->json([
            'roles' => $rolesData,
            'available_roles' => ProjectKanbanRole::getAvailableRoles(),
        ]);
    }

    /**
     * Set a user's Kanban role for this project
     * POST /api/kanban/board/{boardId}/roles
     */
    public function setUserRole(Request $request, int $boardId): JsonResponse
    {
        $board = KanbanBoard::find($boardId);
        if (!$board || !$this->hasAccessToBoard($boardId)) {
            return response()->json(['message' => __('kanbancontrollerphp1001')], 404);
        }

        $project = Project::find($board->project_id);
        $currentUser = auth()->user();

        // Only project owner can assign roles
        if ($project->owner_id !== $currentUser->id) {
            return response()->json(['message' => __('kanbancontrollerphp1009')], 403);
        }

        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        $userId = $request->input('user_id');
        $role = $request->input('role'); // Can be null, srm, sdm, or flow_manager

        // Handle case where role might be sent as an array (PrimeReact Dropdown quirk)
        if (is_array($role)) {
            // Use array_values to re-index, then get first element or null
            $values = array_values($role);
            $role = isset($values[0]) ? $values[0] : null;
        }

        // Normalize empty/null values - handle all possible representations of "no role"
        // Frontend sends 'none' for "Keine Rolle", also handle null, empty string, etc.
        if ($role === 'none' || $role === '' || $role === 'null' || $role === null) {
            $role = null;
        }

        // Validate role if provided (not null)
        $validRoles = ['srm', 'sdm', 'flow_manager'];
        if ($role !== null && !in_array($role, $validRoles, true)) {
            return response()->json(['message' => __('kanbancontrollerphp1035') . $role], 422);
        }

        try {
            $savedRole = ProjectKanbanRole::setUserRole(
                $board->project_id,
                $userId,
                $role,
                $currentUser->id
            );

            if ($savedRole) {
                $roleInfo = $savedRole->getRoleInfo();
                return response()->json([
                    'message' => 'Role assigned successfully',
                    'role' => [
                        'id' => $savedRole->id,
                        'user_id' => $savedRole->user_id,
                        'role' => $savedRole->role,
                        'role_name' => $roleInfo['name'],
                        'role_short' => $roleInfo['short'],
                        'role_color' => $roleInfo['color'],
                    ],
                ]);
            } else {
                return response()->json([
                    'message' => __('kanbancontrollerphp1061'),
                    'role' => null,
                ]);
            }
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Remove a user's Kanban role for this project
     * DELETE /api/kanban/board/{boardId}/roles/{userId}
     */
    public function removeUserRole(int $boardId, int $userId): JsonResponse
    {
        $board = KanbanBoard::find($boardId);
        if (!$board || !$this->hasAccessToBoard($boardId)) {
            return response()->json(['message' => __('kanbancontrollerphp1078')], 404);
        }

        $project = Project::find($board->project_id);
        $currentUser = auth()->user();

        // Only project owner can remove roles
        if ($project->owner_id !== $currentUser->id) {
            return response()->json(['message' => __('kanbancontrollerphp1086')], 403);
        }

        ProjectKanbanRole::setUserRole($board->project_id, $userId, null);

        return response()->json([
            'message' => __('kanbancontrollerphp1092'),
        ]);
    }

    /**
     * Helper: Check if user has access to board (requires kanban.use permission)
     */
    private function hasAccessToBoard(int $boardId): bool
    {
        $user = auth()->user();
        $board = KanbanBoard::find($boardId);

        if (!$board) {
            return false;
        }

        $project = Project::find($board->project_id);
        if (!$project) {
            return false;
        }

        // Check if user has kanban.use permission for this project
        return $project->userCanUseKanban($user);
    }
}
