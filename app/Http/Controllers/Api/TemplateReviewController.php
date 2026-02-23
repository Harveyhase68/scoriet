<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\TemplateReview;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TemplateReviewController extends Controller
{
    /**
     * Get all templates pending review (only for Inner Core users)
     */
    public function getPendingReviews(Request $request)
    {
        $user = $request->user();

        // Check if user is Inner Core
        if (!$user->is_inner_core) {
            return response()->json([
                'message' => 'Unauthorized. Only Inner Core members can access pending reviews.',
            ], 403);
        }

        // Get templates with visibility = 'public' OR 'store'
        // Only show templates with review_status = 'pending_review' OR 'approved'
        // NEVER show 'draft' or 'rejected' templates!
        // Approved templates are shown so reviewers can give additional +1 votes
        $templates = Template::with(['creator', 'reviews.reviewer', 'project', 'files'])
            ->whereIn('visibility', ['public', 'store'])
            ->whereIn('review_status', ['pending_review', 'approved'])
            ->orderBy('review_score', 'asc') // Show templates needing most help first
            ->orderBy('created_at', 'desc')
            ->get();

        // Add additional info for each template
        $templates->each(function ($template) use ($user) {
            // Check if current user already reviewed this template
            $userReview = $template->reviews->firstWhere('reviewer_user_id', $user->id);
            $template->user_has_reviewed = $userReview !== null;
            $template->user_review = $userReview;
            $template->reviews_needed = max(0, 5 - $template->review_score);

            // Ensure file_count is accurate
            $template->file_count = $template->files->count();
        });

        return response()->json([
            'templates' => $templates,
        ], 200);
    }

    /**
     * Submit a review for a template
     */
    public function submitReview(Request $request, $templateId)
    {
        $user = $request->user();

        // Check if user is Inner Core
        if (!$user->is_inner_core) {
            return response()->json([
                'message' => 'Unauthorized. Only Inner Core members can review templates.',
            ], 403);
        }

        // Validate request
        $validated = $request->validate([
            'vote' => ['required', 'integer', Rule::in([1, -1])],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        // Find template
        $template = Template::find($templateId);
        if (!$template) {
            return response()->json([
                'message' => 'Template not found.',
            ], 404);
        }

        // Check if template is public or store and not yet fully approved
        if (!in_array($template->visibility, ['public', 'store'])) {
            return response()->json([
                'message' => 'Only public or store templates can be reviewed.',
            ], 400);
        }

        // Note: We allow voting on approved templates (score >= 5, is_store_approved = true)
        // so users can see "22 reviewers approved this template" - builds trust and credibility
        // Only 'draft' and 'rejected' templates are excluded from voting (handled in getPendingReviews)

        // Check if user is the template creator (cannot review own template)
        if ($template->creator_user_id == $user->id) {
            return response()->json([
                'message' => 'You cannot review your own template.',
            ], 403);
        }

        // Check if user already reviewed this template
        $existingReview = TemplateReview::where('template_id', $templateId)
            ->where('reviewer_user_id', $user->id)
            ->first();

        if ($existingReview) {
            return response()->json([
                'message' => 'You have already reviewed this template.',
            ], 400);
        }

        // Create the review
        DB::beginTransaction();
        try {
            $review = TemplateReview::create([
                'template_id' => $templateId,
                'reviewer_user_id' => $user->id,
                'vote' => $validated['vote'],
                'comment' => $validated['comment'] ?? null,
            ]);

            // Update template review_score
            $newScore = $template->reviews()->sum('vote');
            $template->review_score = $newScore;

            // Auto-approve if score >= 5
            if ($newScore >= 5) {
                $template->review_status = 'approved';

                // For store templates, also set is_store_approved
                if ($template->visibility === 'store') {
                    $template->is_store_approved = true;
                }

                // TODO: Send notification to template creator
                // Notification::send($template->creator, new TemplateApprovedNotification($template));
            }

            // Auto-reject if score <= -3
            if ($newScore <= -3) {
                $template->review_status = 'rejected';

                // For store templates, also set is_store_approved to false
                if ($template->visibility === 'store') {
                    $template->is_store_approved = false;
                }

                // TODO: Send notification to template creator
                // Notification::send($template->creator, new TemplateRejectedNotification($template));
            }

            $template->save();

            DB::commit();

            // Load review with reviewer data
            $review->load('reviewer');

            return response()->json([
                'message' => 'Review submitted successfully.',
                'review' => $review,
                'template' => $template->fresh(['reviews', 'creator']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to submit review.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all reviews for a specific template
     */
    public function getTemplateReviews(Request $request, $templateId)
    {
        $user = $request->user();

        // Find template
        $template = Template::with(['reviews.reviewer'])->find($templateId);
        if (!$template) {
            return response()->json([
                'message' => 'Template not found.',
            ], 404);
        }

        // Only Inner Core or template creator can see reviews
        if (!$user->is_inner_core && $template->creator_user_id != $user->id) {
            return response()->json([
                'message' => 'Unauthorized to view reviews.',
            ], 403);
        }

        return response()->json([
            'template' => $template,
            'reviews' => $template->reviews,
        ], 200);
    }

    /**
     * Update a review (change vote or comment)
     */
    public function updateReview(Request $request, $reviewId)
    {
        $user = $request->user();

        // Find review
        $review = TemplateReview::with('template')->find($reviewId);
        if (!$review) {
            return response()->json([
                'message' => 'Review not found.',
            ], 404);
        }

        // Check if user owns this review
        if ($review->reviewer_user_id != $user->id) {
            return response()->json([
                'message' => 'Unauthorized. You can only update your own reviews.',
            ], 403);
        }

        // Validate request
        $validated = $request->validate([
            'vote' => ['required', 'integer', Rule::in([1, -1])],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::beginTransaction();
        try {
            $oldVote = $review->vote;

            // Update review
            $review->update([
                'vote' => $validated['vote'],
                'comment' => $validated['comment'] ?? $review->comment,
            ]);

            // Recalculate template score
            $template = $review->template;
            $newScore = $template->reviews()->sum('vote');
            $oldReviewStatus = $template->review_status;
            $template->review_score = $newScore;

            // Check for status changes
            if ($newScore >= 5 && $template->review_status === 'pending_review') {
                $template->review_status = 'approved';
            } elseif ($newScore <= -3 && $template->review_status === 'pending_review') {
                $template->review_status = 'rejected';
            } elseif ($newScore < 5 && $newScore > -3 && $template->review_status !== 'pending_review') {
                // If status changed from approved/rejected back to pending due to review change
                $template->review_status = 'pending_review';
            }

            $template->save();

            DB::commit();

            return response()->json([
                'message' => 'Review updated successfully.',
                'review' => $review->fresh('reviewer'),
                'template' => $template->fresh(['reviews', 'creator']),
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update review.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a review
     */
    public function deleteReview(Request $request, $reviewId)
    {
        $user = $request->user();

        // Find review
        $review = TemplateReview::with('template')->find($reviewId);
        if (!$review) {
            return response()->json([
                'message' => 'Review not found.',
            ], 404);
        }

        // Check if user owns this review or is admin
        if ($review->reviewer_user_id != $user->id && $user->user_type !== 'system') {
            return response()->json([
                'message' => 'Unauthorized. You can only delete your own reviews.',
            ], 403);
        }

        DB::beginTransaction();
        try {
            $template = $review->template;

            // Delete review
            $review->delete();

            // Recalculate template score
            $newScore = $template->reviews()->sum('vote');
            $template->review_score = $newScore;

            // Update review status if necessary
            if ($newScore < 5 && $template->review_status === 'approved') {
                $template->review_status = 'pending_review';
            } elseif ($newScore > -3 && $template->review_status === 'rejected') {
                $template->review_status = 'pending_review';
            }

            $template->save();

            DB::commit();

            return response()->json([
                'message' => 'Review deleted successfully.',
                'template' => $template->fresh(['reviews', 'creator']),
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete review.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Admin Override - Approve template directly (sets score to minimum 5)
     */
    public function adminApprove(Request $request, $templateId)
    {
        $admin = $request->user();

        // Check if user is admin or system
        if ($admin->user_type !== 'system') {
            return response()->json([
                'message' => 'Unauthorized. System access required.',
            ], 403);
        }

        // Find template
        $template = Template::with('reviews')->find($templateId);
        if (!$template) {
            return response()->json([
                'message' => 'Template not found.',
            ], 404);
        }

        // Check if template is already approved
        if ($template->review_score >= 5) {
            return response()->json([
                'message' => 'This template is already approved.',
            ], 400);
        }

        // Check if store template is already approved
        if ($template->visibility === 'store' && $template->is_store_approved) {
            return response()->json([
                'message' => 'This store template is already approved for the store.',
            ], 400);
        }

        DB::beginTransaction();
        try {
            $currentScore = $template->review_score;
            $scoreIncrease = max(1, 5 - $currentScore); // At least +1, or whatever needed to reach 5

            // Check if admin already reviewed this template
            $existingReview = TemplateReview::where('template_id', $templateId)
                ->where('reviewer_user_id', $admin->id)
                ->first();

            if ($existingReview) {
                return response()->json([
                    'message' => 'You have already reviewed this template. Cannot use admin override.',
                ], 400);
            }

            // Create admin review with the score increase as vote
            $review = TemplateReview::create([
                'template_id' => $templateId,
                'reviewer_user_id' => $admin->id,
                'vote' => $scoreIncrease,
                'comment' => "Admin Override: Force approved to meet minimum score requirement.",
            ]);

            // Set score to minimum 5
            $template->review_score = max(5, $currentScore + $scoreIncrease);
            $template->review_status = 'approved';

            // For store templates, also set is_store_approved
            if ($template->visibility === 'store') {
                $template->is_store_approved = true;
            }

            $template->save();

            DB::commit();

            // Load fresh data
            $review->load('reviewer');
            $template->load(['reviews', 'creator']);

            return response()->json([
                'message' => "Template approved by admin! Score increased by +{$scoreIncrease}.",
                'review' => $review,
                'template' => $template,
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to approve template.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
