<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class PushSubscriptionController extends Controller
{
    /**
     * Return the public VAPID key for frontend subscription
     */
    public function vapidKey(): JsonResponse
    {
        return response()->json([
            'public_key' => config('services.webpush.public_key'),
        ]);
    }

    /**
     * Store a new push subscription
     */
    public function subscribe(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'endpoint' => 'required|string',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();
        $endpoint = $request->input('endpoint');
        $endpointHash = hash('sha256', $endpoint);

        // Update existing or create new subscription
        PushSubscription::updateOrCreate(
            [
                'user_id' => $user->id,
                'endpoint_hash' => $endpointHash,
            ],
            [
                'endpoint' => $endpoint,
                'p256dh_key' => $request->input('keys.p256dh'),
                'auth_token' => $request->input('keys.auth'),
                'user_agent' => $request->header('User-Agent'),
            ]
        );

        return response()->json([
            'message' => __('pushsubscriptioncontroller.subscribed'),
        ]);
    }

    /**
     * Remove a push subscription
     */
    public function unsubscribe(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'endpoint' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();
        $endpointHash = hash('sha256', $request->input('endpoint'));

        $deleted = PushSubscription::where('user_id', $user->id)
            ->where('endpoint_hash', $endpointHash)
            ->delete();

        return response()->json([
            'message' => $deleted
                ? __('pushsubscriptioncontroller.unsubscribed')
                : __('pushsubscriptioncontroller.not_found'),
        ]);
    }
}
