<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\TemplatePurchase;
use App\Services\TemplateStoreService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class TemplateStoreController extends Controller
{
    /**
     * Get all available store templates (paginated).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Template::query()
            ->store()
            ->storeApproved()
            ->where('is_active', true)
            ->with(['creator:id,username,name', 'logo', 'images']);

        // Filter by category
        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        // Filter by language
        if ($request->has('language') && $request->language) {
            $query->where('language', $request->language);
        }

        // Filter by price type
        if ($request->has('price_type') && in_array($request->price_type, ['credits', 'euros'])) {
            $query->where('price_type', $request->price_type);
        }

        // Filter by price range (credits)
        if ($request->has('min_credits')) {
            $query->where(function($q) use ($request) {
                $q->where('price_type', '!=', 'credits')
                  ->orWhere('price_credits', '>=', (int) $request->min_credits);
            });
        }
        if ($request->has('max_credits')) {
            $query->where(function($q) use ($request) {
                $q->where('price_type', '!=', 'credits')
                  ->orWhere('price_credits', '<=', (int) $request->max_credits);
            });
        }

        // Filter by price range (euros)
        if ($request->has('min_euros')) {
            $query->where(function($q) use ($request) {
                $q->where('price_type', '!=', 'euros')
                  ->orWhere('price_euros', '>=', (float) $request->min_euros);
            });
        }
        if ($request->has('max_euros')) {
            $query->where(function($q) use ($request) {
                $q->where('price_type', '!=', 'euros')
                  ->orWhere('price_euros', '<=', (float) $request->max_euros);
            });
        }

        // Search
        if ($request->has('search') && $request->search) {
            $query->search($request->search);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'sales_count');
        $sortDir = $request->get('sort_dir', 'desc');

        switch ($sortBy) {
            case 'price':
                $query->orderByRaw('COALESCE(price_credits, price_euros * 100) ' . ($sortDir === 'asc' ? 'ASC' : 'DESC'));
                break;
            case 'sales':
            case 'sales_count':
                $query->orderBy('sales_count', $sortDir);
                break;
            case 'rating':
            case 'review_score':
                $query->orderBy('review_score', $sortDir);
                break;
            case 'newest':
            case 'created_at':
                $query->orderBy('created_at', $sortDir);
                break;
            case 'name':
                $query->orderBy('name', $sortDir);
                break;
            default:
                $query->orderBy('sales_count', 'desc');
        }

        $perPage = min((int) $request->get('per_page', 20), 100);
        $templates = $query->paginate($perPage);

        // Add purchase status for authenticated user
        $user = Auth::user();
        if ($user) {
            $purchasedTemplateIds = TemplatePurchase::where('buyer_user_id', $user->id)
                ->pluck('template_id')
                ->toArray();

            $templates->getCollection()->transform(function ($template) use ($user, $purchasedTemplateIds) {
                $template->is_purchased = in_array($template->id, $purchasedTemplateIds);
                $template->is_own = $template->creator_user_id == $user->id;
                $template->can_purchase = $template->canBePurchasedBy($user);
                return $template;
            });
        }

        return response()->json($templates);
    }

    /**
     * Get a single store template with full details.
     */
    public function show(Template $template): JsonResponse
    {
        if (!$template->isStoreTemplate()) {
            return response()->json(['message' => __('templatestorecontrollerphp128')], 404);
        }

        $template->load([
            'creator:id,username,name',
            'media',
            'reviews' => function ($query) {
                $query->latest()->limit(10);
            },
            'reviews.reviewer:id,username,name',
        ]);

        $user = Auth::user();
        if ($user) {
            $template->is_purchased = TemplatePurchase::hasPurchased($user->id, $template->id);
            $template->is_own = $template->creator_user_id == $user->id;
            $template->can_purchase = $template->canBePurchasedBy($user);
        }

        return response()->json($template);
    }

    /**
     * Purchase a store template.
     */
    public function purchase(Request $request, Template $template): JsonResponse
    {
        $user = Auth::user();

        if (!$template->isStoreTemplate()) {
            return response()->json(['message' => __('templatestorecontrollerphp158')], 404);
        }

        if (!$template->canBePurchasedBy($user)) {
            return response()->json(['message' => __('templatestorecontrollerphp162')], 400);
        }

        // Handle credit payment
        if ($template->acceptsCredits()) {
            $result = TemplateStoreService::purchaseWithCredits($user, $template);

            if (!$result['success']) {
                return response()->json(['message' => $result['message']], 400);
            }

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'purchase' => $result['purchase'],
                'credits_remaining' => $user->fresh()->credits,
            ]);
        }

        // Handle euro payment - return payment info
        if ($template->acceptsEuros()) {
            $paymentMethod = $request->get('payment_method', 'stripe');

            $result = TemplateStoreService::initializeEuroPurchase($user, $template, $paymentMethod);

            if (!$result['success']) {
                return response()->json(['message' => $result['message']], 400);
            }

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'payment_info' => $result['payment_info'],
                'requires_payment' => true,
            ]);
        }

        return response()->json(['message' => __('templatestorecontrollerphp199')], 400);
    }

    /**
     * Get user's purchased templates.
     */
    public function myPurchases(Request $request): JsonResponse
    {
        $user = Auth::user();

        $purchases = TemplatePurchase::where('buyer_user_id', $user->id)
            ->with([
                'template:id,name,description,category,language,creator_user_id',
                'template.creator:id,username,name',
                'template.logo',
                'seller:id,username,name',
            ])
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($purchases);
    }

    /**
     * Get user's sales (as seller).
     */
    public function mySales(Request $request): JsonResponse
    {
        $user = Auth::user();

        $sales = TemplatePurchase::where('seller_user_id', $user->id)
            ->with([
                'template:id,name',
                'buyer:id,username,name',
            ])
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        // Get stats
        $stats = TemplateStoreService::getSellerStats($user);

        return response()->json([
            'sales' => $sales,
            'stats' => $stats,
        ]);
    }

    /**
     * Get store categories with counts.
     */
    public function categories(): JsonResponse
    {
        $categories = Template::store()
            ->storeApproved()
            ->where('is_active', true)
            ->whereNotNull('category')
            ->selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->orderBy('count', 'desc')
            ->get();

        return response()->json($categories);
    }

    /**
     * Get store languages with counts.
     */
    public function languages(): JsonResponse
    {
        $languages = Template::store()
            ->storeApproved()
            ->where('is_active', true)
            ->whereNotNull('language')
            ->selectRaw('language, COUNT(*) as count')
            ->groupBy('language')
            ->orderBy('count', 'desc')
            ->get();

        return response()->json($languages);
    }

    /**
     * Submit a template for store approval.
     */
    public function submitForApproval(Request $request, Template $template): JsonResponse
    {
        $user = Auth::user();

        // Only creator can submit
        if ($template->creator_user_id != $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validate store price
        $request->validate([
            'price_type' => 'required|in:credits,euros',
            'price_credits' => 'required_if:price_type,credits|nullable|integer|min:50',
            'price_euros' => 'required_if:price_type,euros|nullable|numeric|min:1',
        ]);

        $priceErrors = Template::validateStorePrice(
            $request->price_type,
            $request->price_credits,
            $request->price_euros
        );

        if (!empty($priceErrors)) {
            return response()->json(['message' => 'Invalid price', 'errors' => $priceErrors], 422);
        }

        // Check for plagiarism against purchased templates
        $plagiarismCheck = \App\Services\TemplateFingerprintService::checkForPlagiarism($template, $user->id);

        if ($plagiarismCheck['is_plagiarism']) {
            Log::warning('Plagiarism detected for template submission', [
                'user_id' => $user->id,
                'template_id' => $template->id,
                'template_name' => $template->name,
                'highest_similarity' => $plagiarismCheck['highest_similarity'],
                'matches_count' => count($plagiarismCheck['matches']),
                'checked_templates' => $plagiarismCheck['checked_templates'],
            ]);

            // Get details about the matched templates
            $matchedTemplateIds = array_unique(array_column($plagiarismCheck['matches'], 'purchased_template_id'));
            $matchedTemplates = Template::whereIn('id', $matchedTemplateIds)->pluck('name', 'id');

            return response()->json([
                'success' => false,
                'message' => __('templatestorecontrollerphp328'),
                'plagiarism_detected' => true,
                'highest_similarity' => round($plagiarismCheck['highest_similarity'] * 100, 1),
                'matched_templates' => $matchedTemplates,
                'help' => __('templatestorecontrollerphp332') .
                          __('templatestorecontrollerphp333'),
            ], 422);
        }

        // Generate fingerprints for this template (for future plagiarism checks by others)
        \App\Services\TemplateFingerprintService::generateFingerprints($template);

        // Update template
        $template->update([
            'visibility' => 'store',
            'price_type' => $request->price_type,
            'price_credits' => $request->price_type === 'credits' ? $request->price_credits : null,
            'price_euros' => $request->price_type === 'euros' ? $request->price_euros : null,
            // is_store_approved stays false until admin approves OR review_score >= 5
        ]);

        return response()->json([
            'success' => true,
            'message' => __('templatestorecontrollerphp351'),
            'template' => $template->fresh(),
        ]);
    }

    /**
     * Update store template price (only for creator).
     * Also works for initial price setup when visibility is already 'store'.
     */
    public function updatePrice(Request $request, Template $template): JsonResponse
    {
        $user = Auth::user();

        if ($template->creator_user_id != $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Allow both store templates and templates being set to store
        if (!$template->isStoreTemplate()) {
            return response()->json(['message' => __('templatestorecontrollerphp370')], 400);
        }

        $request->validate([
            'price_type' => 'required|in:credits,euros',
            'price_credits' => 'required_if:price_type,credits|nullable|integer|min:50',
            'price_euros' => 'required_if:price_type,euros|nullable|numeric|min:1',
        ]);

        $priceErrors = Template::validateStorePrice(
            $request->price_type,
            $request->price_credits,
            $request->price_euros
        );

        if (!empty($priceErrors)) {
            return response()->json(['message' => __('templatestorecontrollerphp386'), 'errors' => $priceErrors], 422);
        }

        $template->update([
            'price_type' => $request->price_type,
            'price_credits' => $request->price_type === 'credits' ? $request->price_credits : null,
            'price_euros' => $request->price_type === 'euros' ? $request->price_euros : null,
        ]);

        return response()->json([
            'success' => true,
            'message' => __('templatestorecontrollerphp397'),
            'template' => $template->fresh(),
        ]);
    }

    /**
     * Remove template from store.
     */
    public function removeFromStore(Template $template): JsonResponse
    {
        $user = Auth::user();

        if ($template->creator_user_id != $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $template->update([
            'visibility' => 'private',
            'price_type' => null,
            'price_credits' => null,
            'price_euros' => null,
            'is_store_approved' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => __('templatestorecontrollerphp423'),
        ]);
    }
}
