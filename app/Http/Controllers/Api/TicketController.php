<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\CreditTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class TicketController extends Controller
{
    /**
     * Get all tickets for the authenticated user
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();

        $tickets = Ticket::where('user_id', $user->id)
            ->with(['assignedTo'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'tickets' => $tickets
        ]);
    }

    /**
     * Create a new ticket
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'type' => ['required', Rule::in(['bug_report', 'support', 'consulting'])],
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => ['sometimes', Rule::in(['low', 'normal', 'high', 'urgent'])],
        ]);

        // Calculate credit cost
        $creditsCost = Ticket::calculateCreditCost($validated['type'], $user);

        // Check if user has enough credits for paid tickets
        if ($creditsCost > 0 && !$user->hasCredits($creditsCost)) {
            return response()->json([
                'success' => false,
                'message' => "Nicht genug Credits. Du brauchst {$creditsCost} Credits für dieses Ticket.",
                'required_credits' => $creditsCost,
                'current_credits' => $user->credits
            ], 403);
        }

        // Deduct credits if needed
        if ($creditsCost > 0) {
            $user->deductCredits($creditsCost);
        }

        // Create ticket
        $ticket = Ticket::create([
            'user_id' => $user->id,
            'type' => $validated['type'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'priority' => $validated['priority'] ?? 'normal',
            'status' => 'open',
            'credits_cost' => $creditsCost,
        ]);

        // Log credit transaction if credits were spent
        if ($creditsCost > 0) {
            CreditTransaction::createAndUpdateCredits(
                $user->id,
                -$creditsCost,
                'ticket',
                "Ticket erstellt: {$ticket->title}",
                'Ticket',
                $ticket->id
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Ticket erfolgreich erstellt',
            'ticket' => $ticket->load('assignedTo'),
            'credits_spent' => $creditsCost,
            'remaining_credits' => $user->credits
        ], 201);
    }

    /**
     * Get a specific ticket
     */
    public function show($id): JsonResponse
    {
        $user = Auth::user();

        $ticket = Ticket::where('id', $id)
            ->where('user_id', $user->id)
            ->with(['assignedTo'])
            ->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket nicht gefunden'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'ticket' => $ticket
        ]);
    }

    /**
     * Get ticket statistics for user
     */
    public function stats(): JsonResponse
    {
        $user = Auth::user();

        $stats = [
            'total' => Ticket::where('user_id', $user->id)->count(),
            'open' => Ticket::where('user_id', $user->id)->where('status', 'open')->count(),
            'in_progress' => Ticket::where('user_id', $user->id)->where('status', 'in_progress')->count(),
            'resolved' => Ticket::where('user_id', $user->id)->where('status', 'resolved')->count(),
            'bug_reports' => Ticket::where('user_id', $user->id)->where('type', 'bug_report')->count(),
            'support_tickets' => Ticket::where('user_id', $user->id)->whereIn('type', ['support', 'consulting'])->count(),
        ];

        // Free tickets remaining this month for patron users
        if ($user->isPatron()) {
            $currentMonth = now()->startOfMonth();
            $usedFreeTickets = Ticket::where('user_id', $user->id)
                ->where('type', '!=', 'bug_report')
                ->where('credits_cost', 0)
                ->where('created_at', '>=', $currentMonth)
                ->count();

            $stats['free_tickets_remaining'] = max(0, 5 - $usedFreeTickets);
        }

        return response()->json([
            'success' => true,
            'stats' => $stats
        ]);
    }
}
