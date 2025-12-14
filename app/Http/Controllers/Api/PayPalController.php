<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CreditTransaction;
use App\Models\Settings;
use App\Models\User;
use App\Notifications\NewPatronSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Srmklive\PayPal\Services\PayPal as PayPalClient;

class PayPalController extends Controller
{
    /**
     * Create a PayPal order for credit purchases
     */
    public function createCreditOrder(Request $request)
    {
        $request->validate([
            'package' => 'required|in:credits_500,credits_1000,credits_2500',
        ]);

        $user = $request->user();
        $package = $request->package;
        $settings = Settings::get();

        // Get package details
        $packages = [
            'credits_500' => [
                'credits' => 500,
                'price' => $settings->price_credits_500,
                'name' => '500 Credits',
            ],
            'credits_1000' => [
                'credits' => 1000,
                'price' => $settings->price_credits_1000,
                'name' => '1000 Credits',
            ],
            'credits_2500' => [
                'credits' => 2500,
                'price' => $settings->price_credits_2500,
                'name' => '2500 Credits',
            ],
        ];

        $selectedPackage = $packages[$package];

        try {
            $provider = new PayPalClient;
            $provider->setApiCredentials(config('paypal'));
            $provider->getAccessToken();

            $order = $provider->createOrder([
                'intent' => 'CAPTURE',
                'purchase_units' => [
                    [
                        'reference_id' => $user->id . '_' . $package . '_' . time(),
                        'description' => 'Scoriet ' . $selectedPackage['name'],
                        'amount' => [
                            'currency_code' => 'EUR',
                            'value' => number_format($selectedPackage['price'], 2, '.', ''),
                        ],
                        'custom_id' => json_encode([
                            'user_id' => $user->id,
                            'package' => $package,
                            'credits' => $selectedPackage['credits'],
                            'price' => $selectedPackage['price'],
                            'type' => 'credits',
                        ]),
                    ],
                ],
                'application_context' => [
                    'return_url' => config('app.url') . '/payment/paypal/success',
                    'cancel_url' => config('app.url') . '/payment/cancel',
                    'brand_name' => 'Scoriet',
                    'user_action' => 'PAY_NOW',
                ],
            ]);

            if (isset($order['id']) && $order['status'] === 'CREATED') {
                // Find the approval link
                $approvalUrl = null;
                foreach ($order['links'] as $link) {
                    if ($link['rel'] === 'approve') {
                        $approvalUrl = $link['href'];
                        break;
                    }
                }

                return response()->json([
                    'success' => true,
                    'order_id' => $order['id'],
                    'url' => $approvalUrl,
                ]);
            }

            Log::error('PayPal Order Creation Failed', ['order' => $order]);
            return response()->json([
                'success' => false,
                'error' => 'Failed to create PayPal order',
            ], 500);

        } catch (\Exception $e) {
            Log::error('PayPal Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Payment initialization failed',
            ], 500);
        }
    }

    /**
     * Create a PayPal order for template purchase
     */
    public function createTemplateOrder(Request $request)
    {
        $request->validate([
            'template_id' => 'required|integer|exists:templates,id',
        ]);

        $user = $request->user();
        $template = \App\Models\Template::with('creator')->find($request->template_id);

        if (!$template) {
            return response()->json([
                'success' => false,
                'error' => 'Template not found',
            ], 404);
        }

        // Check if template is in store and accepts euros
        if (!$template->isStoreTemplate() || !$template->acceptsEuros()) {
            return response()->json([
                'success' => false,
                'error' => 'This template is not available for euro payment',
            ], 400);
        }

        // Check if user can purchase
        if (!$template->canBePurchasedBy($user)) {
            return response()->json([
                'success' => false,
                'error' => 'You cannot purchase this template (already owned or is your own)',
            ], 400);
        }

        $price = (float) $template->price_euros;

        try {
            $provider = new PayPalClient;
            $provider->setApiCredentials(config('paypal'));
            $provider->getAccessToken();

            $order = $provider->createOrder([
                'intent' => 'CAPTURE',
                'purchase_units' => [
                    [
                        'reference_id' => $user->id . '_template_' . $template->id . '_' . time(),
                        'description' => 'Template: ' . $template->name,
                        'amount' => [
                            'currency_code' => 'EUR',
                            'value' => number_format($price, 2, '.', ''),
                        ],
                        'custom_id' => json_encode([
                            'user_id' => $user->id,
                            'template_id' => $template->id,
                            'seller_id' => $template->creator_user_id,
                            'price_euros' => $price,
                            'type' => 'template',
                        ]),
                    ],
                ],
                'application_context' => [
                    'return_url' => config('app.url') . '/payment/paypal/success?type=template',
                    'cancel_url' => config('app.url') . '/payment/cancel?type=template',
                    'brand_name' => 'Scoriet',
                    'user_action' => 'PAY_NOW',
                ],
            ]);

            if (isset($order['id']) && $order['status'] === 'CREATED') {
                // Find the approval link
                $approvalUrl = null;
                foreach ($order['links'] as $link) {
                    if ($link['rel'] === 'approve') {
                        $approvalUrl = $link['href'];
                        break;
                    }
                }

                Log::info('PayPal Template order created', [
                    'user_id' => $user->id,
                    'template_id' => $template->id,
                    'price' => $price,
                    'order_id' => $order['id'],
                ]);

                return response()->json([
                    'success' => true,
                    'order_id' => $order['id'],
                    'url' => $approvalUrl,
                ]);
            }

            Log::error('PayPal Template Order Creation Failed', ['order' => $order]);
            return response()->json([
                'success' => false,
                'error' => 'Failed to create PayPal order',
            ], 500);

        } catch (\Exception $e) {
            Log::error('PayPal Template Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Payment initialization failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a PayPal subscription for Patron
     */
    public function createPatronSubscription(Request $request)
    {
        $request->validate([
            'plan' => 'required|in:patron_monthly,patron_annual',
        ]);

        $user = $request->user();
        $plan = $request->plan;

        // Get the billing plan ID from config
        $billingPlanId = config("paypal.billing_plans.{$plan}");

        Log::info('PayPal Subscription: Starting', [
            'plan' => $plan,
            'billing_plan_id' => $billingPlanId,
            'user_id' => $user->id,
        ]);

        if (!$billingPlanId) {
            Log::error('PayPal: Billing plan not configured for ' . $plan);
            return response()->json([
                'success' => false,
                'error' => 'Billing plan not configured',
            ], 500);
        }

        try {
            $provider = new PayPalClient;
            $provider->setApiCredentials(config('paypal'));
            $accessToken = $provider->getAccessToken();

            Log::info('PayPal Subscription: Got access token', [
                'has_token' => !empty($accessToken),
            ]);

            $subscriptionData = [
                'plan_id' => $billingPlanId,
                'application_context' => [
                    'brand_name' => 'Scoriet',
                    'locale' => 'de-DE',
                    'shipping_preference' => 'NO_SHIPPING',
                    'user_action' => 'SUBSCRIBE_NOW',
                    'return_url' => config('app.url') . '/payment/paypal/subscription-success?plan=' . $plan,
                    'cancel_url' => config('app.url') . '/payment/cancel',
                ],
                'custom_id' => json_encode([
                    'user_id' => $user->id,
                    'plan' => $plan,
                    'type' => 'patron',
                ]),
            ];

            Log::info('PayPal Subscription: Request data', $subscriptionData);

            // Create subscription using PayPal Subscriptions API
            $subscription = $provider->createSubscription($subscriptionData);

            Log::info('PayPal Subscription: Response', [
                'response' => $subscription,
            ]);

            if (isset($subscription['id']) && isset($subscription['status'])) {
                // Find the approval link
                $approvalUrl = null;
                if (isset($subscription['links'])) {
                    foreach ($subscription['links'] as $link) {
                        if ($link['rel'] === 'approve') {
                            $approvalUrl = $link['href'];
                            break;
                        }
                    }
                }

                Log::info('PayPal Subscription: Success', [
                    'subscription_id' => $subscription['id'],
                    'approval_url' => $approvalUrl,
                ]);

                return response()->json([
                    'success' => true,
                    'subscription_id' => $subscription['id'],
                    'url' => $approvalUrl,
                ]);
            }

            Log::error('PayPal Subscription Creation Failed', ['subscription' => $subscription]);
            return response()->json([
                'success' => false,
                'error' => $subscription['message'] ?? $subscription['error'] ?? 'Failed to create PayPal subscription',
            ], 500);

        } catch (\Exception $e) {
            Log::error('PayPal Subscription Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'error' => 'Subscription initialization failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Handle PayPal subscription success callback
     */
    public function handleSubscriptionSuccess(Request $request)
    {
        // PayPal returns subscription_id or ba_token depending on the flow
        $subscriptionId = $request->query('subscription_id') ?? $request->query('token');
        $plan = $request->query('plan', 'patron_monthly');

        Log::info('PayPal Subscription Success callback', [
            'all_params' => $request->all(),
            'subscription_id' => $subscriptionId,
            'plan' => $plan,
        ]);

        if (!$subscriptionId) {
            Log::error('PayPal Subscription Success: missing subscription_id', ['params' => $request->all()]);
            return redirect('/payment/cancel?error=missing_subscription_id');
        }

        try {
            $provider = new PayPalClient;
            $provider->setApiCredentials(config('paypal'));
            $provider->getAccessToken();

            // Get subscription details
            $subscription = $provider->showSubscriptionDetails($subscriptionId);

            if (isset($subscription['status']) && $subscription['status'] === 'ACTIVE') {
                // Extract user info from custom_id
                $customId = $subscription['custom_id'] ?? null;
                $metadata = $customId ? json_decode($customId, true) : null;

                if ($metadata && isset($metadata['user_id'])) {
                    $user = User::find($metadata['user_id']);

                    if ($user) {
                        $patronType = str_replace('patron_', '', $plan);

                        DB::transaction(function () use ($user, $patronType, $subscriptionId) {
                            $user->update([
                                'user_type' => 'patron',
                                'patron_type' => $patronType,
                                'paypal_subscription_id' => $subscriptionId,
                            ]);
                        });

                        Log::info("PayPal Subscription activated for user {$user->id}: {$patronType}");

                        // Send admin notification
                        try {
                            Notification::route('mail', 'office@predl.cc')
                                ->notify(new NewPatronSubscription($user, $patronType, 'paypal'));
                        } catch (\Exception $e) {
                            Log::error('Failed to send patron subscription notification: ' . $e->getMessage());
                        }
                    }
                }

                return redirect('/payment/success?type=subscription&provider=paypal');
            }

            Log::error('PayPal Subscription not active', ['subscription' => $subscription]);
            return redirect('/payment/cancel?error=subscription_not_active');

        } catch (\Exception $e) {
            Log::error('PayPal Subscription Success Error: ' . $e->getMessage());
            return redirect('/payment/cancel?error=' . urlencode($e->getMessage()));
        }
    }

    /**
     * Capture PayPal payment after approval
     */
    public function capturePayment(Request $request)
    {
        $request->validate([
            'order_id' => 'required|string',
        ]);

        $orderId = $request->order_id;

        try {
            $provider = new PayPalClient;
            $provider->setApiCredentials(config('paypal'));
            $provider->getAccessToken();

            $result = $provider->capturePaymentOrder($orderId);

            if (isset($result['status']) && $result['status'] === 'COMPLETED') {
                // Extract custom data
                $customId = $result['purchase_units'][0]['payments']['captures'][0]['custom_id'] ?? null;

                if ($customId) {
                    $metadata = json_decode($customId, true);
                    $this->processPayment($metadata, $result);
                }

                return response()->json([
                    'success' => true,
                    'status' => 'completed',
                    'order_id' => $orderId,
                ]);
            }

            Log::error('PayPal Capture Failed', ['result' => $result]);
            return response()->json([
                'success' => false,
                'error' => 'Payment capture failed',
            ], 400);

        } catch (\Exception $e) {
            Log::error('PayPal Capture Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Payment capture failed',
            ], 500);
        }
    }

    /**
     * Process the payment after capture
     */
    private function processPayment(array $metadata, array $result)
    {
        $userId = $metadata['user_id'] ?? null;
        $type = $metadata['type'] ?? null;

        if (!$userId) {
            Log::error('PayPal: No user_id in metadata');
            return;
        }

        $user = User::find($userId);
        if (!$user) {
            Log::error('PayPal: User not found: ' . $userId);
            return;
        }

        $paypalOrderId = $result['id'] ?? 'unknown';

        if ($type === 'credits') {
            $credits = (int) ($metadata['credits'] ?? 0);
            $package = $metadata['package'] ?? 'unknown';
            $pricePaid = (float) ($metadata['price'] ?? 0);

            if ($credits > 0) {
                DB::transaction(function () use ($user, $credits, $package, $paypalOrderId, $pricePaid) {
                    $user->increment('credits', $credits);

                    CreditTransaction::create([
                        'user_id' => $user->id,
                        'amount' => $credits,
                        'type' => 'purchase',
                        'description' => 'PayPal purchase: ' . $package,
                        'reference_type' => 'paypal',
                        'reference_id' => $paypalOrderId,
                        'price_paid' => $pricePaid > 0 ? $pricePaid : null,
                    ]);
                });

                Log::info("PayPal: Credits added: {$credits} to user {$userId}");
            }
        } elseif ($type === 'template') {
            $this->processTemplatePurchase($user, $metadata, $paypalOrderId);
        } elseif ($type === 'patron') {
            $plan = $metadata['plan'] ?? 'patron_monthly';
            // Extract 'monthly' or 'annual' from 'patron_monthly' or 'patron_annual'
            $patronType = str_replace('patron_', '', $plan);

            DB::transaction(function () use ($user, $patronType, $paypalOrderId) {
                $user->update([
                    'user_type' => 'patron',
                    'patron_type' => $patronType, // 'monthly' or 'annual'
                ]);

                // Give initial 100 credits for new patron
                $user->increment('credits', 100);

                CreditTransaction::create([
                    'user_id' => $user->id,
                    'amount' => 100,
                    'type' => 'patron_subscription',
                    'description' => 'PayPal Patron subscription: ' . $patronType,
                    'reference_type' => 'paypal',
                    'reference_id' => $paypalOrderId,
                ]);
            });

            Log::info("PayPal: Patron subscription activated for user {$user->id}: {$patronType}");
        }
    }

    /**
     * Process template purchase after PayPal capture
     */
    private function processTemplatePurchase(User $user, array $metadata, string $paypalOrderId)
    {
        $templateId = $metadata['template_id'] ?? null;
        $priceEuros = (float) ($metadata['price_euros'] ?? 0);

        if (!$templateId) {
            Log::error('PayPal Template Purchase: No template_id in metadata');
            return;
        }

        $template = \App\Models\Template::find($templateId);
        if (!$template) {
            Log::error('PayPal Template Purchase: Template not found: ' . $templateId);
            return;
        }

        // Use the TemplateStoreService to complete the purchase
        $result = \App\Services\TemplateStoreService::completeEuroPurchase(
            $user,
            $template,
            $paypalOrderId,
            'paypal'
        );

        if ($result['success']) {
            Log::info('Template purchased via PayPal', [
                'user_id' => $user->id,
                'template_id' => $templateId,
                'price_euros' => $priceEuros,
                'paypal_order_id' => $paypalOrderId,
            ]);
        } else {
            Log::error('Template purchase failed via PayPal', [
                'user_id' => $user->id,
                'template_id' => $templateId,
                'error' => $result['message'],
            ]);
        }
    }

    /**
     * Handle PayPal webhook (IPN)
     */
    public function handleWebhook(Request $request)
    {
        $payload = $request->all();

        Log::info('PayPal Webhook received', ['event_type' => $payload['event_type'] ?? 'unknown']);

        // Verify webhook signature (recommended for production)
        // For now, we process the event directly

        $eventType = $payload['event_type'] ?? null;
        $resource = $payload['resource'] ?? [];

        switch ($eventType) {
            case 'PAYMENT.CAPTURE.COMPLETED':
                // Payment was captured successfully (for one-time payments like credits)
                $customId = $resource['custom_id'] ?? null;

                if ($customId) {
                    $metadata = json_decode($customId, true);
                    if ($metadata) {
                        $this->processPayment($metadata, ['id' => $resource['id'] ?? 'webhook']);
                    }
                }
                break;

            case 'BILLING.SUBSCRIPTION.ACTIVATED':
                // Subscription activated - user already gets credits in the callback
                // This is a backup in case the callback doesn't work
                $this->handleSubscriptionActivated($resource);
                break;

            case 'BILLING.SUBSCRIPTION.RENEWED':
                // Subscription renewed - give monthly credits
                $this->handleSubscriptionRenewed($resource);
                break;

            case 'BILLING.SUBSCRIPTION.CANCELLED':
            case 'BILLING.SUBSCRIPTION.SUSPENDED':
            case 'BILLING.SUBSCRIPTION.EXPIRED':
                // Handle subscription cancellation
                $this->handleSubscriptionCancelled($resource);
                break;

            default:
                Log::info('Unhandled PayPal webhook event: ' . $eventType);
        }

        return response()->json(['received' => true]);
    }

    /**
     * Handle subscription activation via webhook (backup)
     */
    private function handleSubscriptionActivated($resource)
    {
        $subscriptionId = $resource['id'] ?? null;
        $customId = $resource['custom_id'] ?? null;

        if (!$customId) {
            Log::info('PayPal Subscription activated but no custom_id', ['subscription_id' => $subscriptionId]);
            return;
        }

        $metadata = json_decode($customId, true);
        if (!$metadata || !isset($metadata['user_id'])) {
            return;
        }

        $user = User::find($metadata['user_id']);
        if (!$user) {
            return;
        }

        // Only activate if not already a patron (callback may have already done this)
        if ($user->user_type !== 'patron') {
            $plan = $metadata['plan'] ?? 'patron_monthly';
            $patronType = str_replace('patron_', '', $plan);

            DB::transaction(function () use ($user, $patronType, $subscriptionId) {
                $user->update([
                    'user_type' => 'patron',
                    'patron_type' => $patronType,
                ]);

                $user->increment('credits', 100);

                CreditTransaction::create([
                    'user_id' => $user->id,
                    'amount' => 100,
                    'type' => 'patron_subscription',
                    'description' => 'PayPal Patron subscription (webhook): ' . $patronType,
                    'reference_type' => 'paypal_subscription',
                    'reference_id' => $subscriptionId,
                ]);
            });

            Log::info("PayPal Webhook: Subscription activated for user {$user->id}");
        }
    }

    /**
     * Handle subscription renewed - give monthly/yearly credits
     */
    private function handleSubscriptionRenewed($resource)
    {
        $subscriptionId = $resource['id'] ?? null;
        $customId = $resource['custom_id'] ?? null;

        Log::info('PayPal subscription renewed', [
            'subscription_id' => $subscriptionId,
            'custom_id' => $customId,
        ]);

        if (!$customId) {
            Log::warning('PayPal subscription renewed but no custom_id');
            return;
        }

        $metadata = json_decode($customId, true);
        if (!$metadata || !isset($metadata['user_id'])) {
            Log::warning('PayPal subscription renewed but invalid metadata');
            return;
        }

        $user = User::find($metadata['user_id']);
        if (!$user || $user->user_type !== 'patron') {
            Log::warning('PayPal subscription renewed but user not found or not patron');
            return;
        }

        // Add monthly credits (100 credits per renewal)
        DB::transaction(function () use ($user, $subscriptionId) {
            $user->increment('credits', 100);

            CreditTransaction::create([
                'user_id' => $user->id,
                'amount' => 100,
                'type' => 'patron_subscription',
                'description' => 'PayPal subscription renewed - monthly credits',
                'reference_type' => 'paypal_subscription',
                'reference_id' => $subscriptionId ?? 'unknown',
            ]);
        });

        Log::info("PayPal: Subscription renewed, credits added for patron user {$user->id}");
    }

    /**
     * Handle subscription cancellation
     */
    private function handleSubscriptionCancelled($resource)
    {
        $subscriptionId = $resource['id'] ?? null;
        $customId = $resource['custom_id'] ?? null;

        Log::info('PayPal Subscription cancelled/expired', [
            'subscription_id' => $subscriptionId,
            'custom_id' => $customId,
        ]);

        if (!$customId) {
            return;
        }

        $metadata = json_decode($customId, true);
        if (!$metadata || !isset($metadata['user_id'])) {
            return;
        }

        $user = User::find($metadata['user_id']);
        if (!$user) {
            return;
        }

        // Downgrade to free user
        $user->update([
            'user_type' => 'free',
            'patron_type' => null,
        ]);

        Log::info("PayPal: Patron subscription cancelled for user {$user->id}");
    }

    /**
     * Send a payout to a seller via PayPal
     *
     * @param string $receiverEmail PayPal email of the recipient
     * @param float $amount Amount to send in EUR
     * @param string $note Note/description for the payout
     * @param string $senderBatchId Unique batch ID for this payout
     * @return array ['success' => bool, 'payout_batch_id' => string|null, 'transaction_id' => string|null, 'error' => string|null]
     */
    public function sendPayout(string $receiverEmail, float $amount, string $note, string $senderBatchId): array
    {
        try {
            $provider = new PayPalClient;
            $provider->setApiCredentials(config('paypal'));
            $provider->getAccessToken();

            // PayPal Payouts API request
            $payoutData = [
                'sender_batch_header' => [
                    'sender_batch_id' => $senderBatchId,
                    'email_subject' => 'Scoriet - Auszahlung erhalten',
                    'email_message' => 'Sie haben eine Auszahlung von Scoriet für Ihre Template-Verkäufe erhalten.',
                ],
                'items' => [
                    [
                        'recipient_type' => 'EMAIL',
                        'amount' => [
                            'value' => number_format($amount, 2, '.', ''),
                            'currency' => 'EUR',
                        ],
                        'receiver' => $receiverEmail,
                        'note' => $note,
                        'sender_item_id' => $senderBatchId . '_item_1',
                    ],
                ],
            ];

            Log::info('PayPal Payout: Sending request', [
                'receiver' => $receiverEmail,
                'amount' => $amount,
                'batch_id' => $senderBatchId,
            ]);

            // Use the PayPal Payouts API
            $response = $provider->createBatchPayout($payoutData);

            Log::info('PayPal Payout: Response', ['response' => $response]);

            if (isset($response['batch_header']['payout_batch_id'])) {
                $batchId = $response['batch_header']['payout_batch_id'];
                $batchStatus = $response['batch_header']['batch_status'] ?? 'PENDING';

                return [
                    'success' => true,
                    'payout_batch_id' => $batchId,
                    'batch_status' => $batchStatus,
                    'transaction_id' => $batchId,
                    'error' => null,
                ];
            }

            // Check for error response
            $errorMessage = $response['message'] ?? $response['error_description'] ?? 'Unknown PayPal error';
            Log::error('PayPal Payout Failed', ['response' => $response]);

            return [
                'success' => false,
                'payout_batch_id' => null,
                'transaction_id' => null,
                'error' => $errorMessage,
            ];

        } catch (\Exception $e) {
            Log::error('PayPal Payout Exception: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'payout_batch_id' => null,
                'transaction_id' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Send multiple payouts in a single batch
     *
     * @param array $recipients Array of ['email' => string, 'amount' => float, 'note' => string, 'item_id' => string]
     * @param string $senderBatchId Unique batch ID for this payout
     * @return array
     */
    public function sendBatchPayout(array $recipients, string $senderBatchId): array
    {
        try {
            $provider = new PayPalClient;
            $provider->setApiCredentials(config('paypal'));
            $provider->getAccessToken();

            // Build payout items
            $items = [];
            foreach ($recipients as $index => $recipient) {
                $items[] = [
                    'recipient_type' => 'EMAIL',
                    'amount' => [
                        'value' => number_format($recipient['amount'], 2, '.', ''),
                        'currency' => 'EUR',
                    ],
                    'receiver' => $recipient['email'],
                    'note' => $recipient['note'] ?? 'Scoriet Template-Verkäufe Auszahlung',
                    'sender_item_id' => $recipient['item_id'] ?? $senderBatchId . '_item_' . ($index + 1),
                ];
            }

            $payoutData = [
                'sender_batch_header' => [
                    'sender_batch_id' => $senderBatchId,
                    'email_subject' => 'Scoriet - Auszahlung erhalten',
                    'email_message' => 'Sie haben eine Auszahlung von Scoriet für Ihre Template-Verkäufe erhalten.',
                ],
                'items' => $items,
            ];

            Log::info('PayPal Batch Payout: Sending request', [
                'recipient_count' => count($recipients),
                'batch_id' => $senderBatchId,
            ]);

            $response = $provider->createBatchPayout($payoutData);

            Log::info('PayPal Batch Payout: Response', ['response' => $response]);

            if (isset($response['batch_header']['payout_batch_id'])) {
                return [
                    'success' => true,
                    'payout_batch_id' => $response['batch_header']['payout_batch_id'],
                    'batch_status' => $response['batch_header']['batch_status'] ?? 'PENDING',
                    'error' => null,
                ];
            }

            $errorMessage = $response['message'] ?? $response['error_description'] ?? 'Unknown PayPal error';
            Log::error('PayPal Batch Payout Failed', ['response' => $response]);

            return [
                'success' => false,
                'payout_batch_id' => null,
                'error' => $errorMessage,
            ];

        } catch (\Exception $e) {
            Log::error('PayPal Batch Payout Exception: ' . $e->getMessage());

            return [
                'success' => false,
                'payout_batch_id' => null,
                'error' => $e->getMessage(),
            ];
        }
    }
}
