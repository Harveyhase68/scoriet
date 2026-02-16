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
use Stripe\Stripe;
use Stripe\Checkout\Session;
use Stripe\Webhook;

class StripeController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Create a Checkout Session for credit purchases
     */
    public function createCreditCheckout(Request $request)
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
        $priceInCents = (int) round($selectedPackage['price'] * 100);

        try {
            $session = Session::create([
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'eur',
                        'product_data' => [
                            'name' => 'Scoriet ' . $selectedPackage['name'],
                            'description' => 'Credit package for Scoriet code generator',
                        ],
                        'unit_amount' => $priceInCents,
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'payment',
                'success_url' => config('app.url') . '/payment/success?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => config('app.url') . '/payment/cancel',
                'client_reference_id' => $user->id,
                'metadata' => [
                    'user_id' => $user->id,
                    'package' => $package,
                    'credits' => $selectedPackage['credits'],
                    'price' => $selectedPackage['price'],
                    'type' => 'credits',
                ],
            ]);

            return response()->json([
                'success' => true,
                'session_id' => $session->id,
                'url' => $session->url,
            ]);
        } catch (\Exception $e) {
            Log::error('Stripe Checkout Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Payment initialization failed',
            ], 500);
        }
    }

    /**
     * Create a Checkout Session for Patron subscription
     */
    public function createPatronCheckout(Request $request)
    {
        $request->validate([
            'plan' => 'required|in:patron_monthly,patron_annual',
        ]);

        $user = $request->user();
        $plan = $request->plan;
        $settings = Settings::get();

        // Get plan details
        $plans = [
            'patron_monthly' => [
                'price' => $settings->price_patron_monthly,
                'name' => 'Scoriet Patron Monthly',
                'interval' => 'month',
                'credits_monthly' => 100,
            ],
            'patron_annual' => [
                'price' => $settings->price_patron_annual,
                'name' => 'Scoriet Patron Yearly',
                'interval' => 'year',
                'credits_monthly' => 100,
            ],
        ];

        $selectedPlan = $plans[$plan];
        $priceInCents = (int) round($selectedPlan['price'] * 100);

        try {
            $session = Session::create([
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'eur',
                        'product_data' => [
                            'name' => $selectedPlan['name'],
                            'description' => 'Patron subscription with 100 credits/month',
                        ],
                        'unit_amount' => $priceInCents,
                        'recurring' => [
                            'interval' => $selectedPlan['interval'],
                        ],
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'subscription',
                'success_url' => config('app.url') . '/payment/success?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => config('app.url') . '/payment/cancel',
                'client_reference_id' => $user->id,
                'metadata' => [
                    'user_id' => $user->id,
                    'plan' => $plan,
                    'type' => 'patron',
                ],
            ]);

            return response()->json([
                'success' => true,
                'session_id' => $session->id,
                'url' => $session->url,
            ]);
        } catch (\Exception $e) {
            Log::error('Stripe Patron Checkout Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Payment initialization failed',
            ], 500);
        }
    }

    /**
     * Handle Stripe webhook events
     */
    public function handleWebhook(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret');

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
        } catch (\UnexpectedValueException $e) {
            Log::error('Stripe Webhook: Invalid payload');
            return response()->json(['error' => 'Invalid payload'], 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            Log::error('Stripe Webhook: Invalid signature');
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        switch ($event->type) {
            case 'checkout.session.completed':
                $this->handleCheckoutCompleted($event->data->object);
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                $this->handleSubscriptionUpdate($event->data->object);
                break;

            case 'customer.subscription.deleted':
                $this->handleSubscriptionCanceled($event->data->object);
                break;

            case 'invoice.paid':
                $this->handleInvoicePaid($event->data->object);
                break;

        }

        return response()->json(['received' => true]);
    }

    /**
     * Handle completed checkout session
     */
    private function handleCheckoutCompleted($session)
    {
        $metadata = $session->metadata;
        $userId = $metadata->user_id ?? null;
        $type = $metadata->type ?? null;

        if (!$userId) {
            Log::error('Stripe Webhook: No user_id in metadata');
            return;
        }

        $user = User::find($userId);
        if (!$user) {
            Log::error('Stripe Webhook: User not found: ' . $userId);
            return;
        }

        if ($type === 'credits') {
            $credits = (int) ($metadata->credits ?? 0);
            $package = $metadata->package ?? 'unknown';
            $pricePaid = (float) ($metadata->price ?? 0);

            if ($credits > 0) {
                DB::transaction(function () use ($user, $credits, $package, $session, $pricePaid) {
                    $user->increment('credits', $credits);

                    CreditTransaction::create([
                        'user_id' => $user->id,
                        'amount' => $credits,
                        'type' => 'purchase',
                        'description' => 'Stripe purchase: ' . $package,
                        'reference_type' => 'stripe',
                        'reference_id' => $session->id,
                        'price_paid' => $pricePaid > 0 ? $pricePaid : null,
                    ]);
                });

            }
        } elseif ($type === 'template') {
            $this->handleTemplatePurchase($session, $user, $metadata);
        } elseif ($type === 'patron') {
            $plan = $metadata->plan ?? 'patron_monthly';
            // Extract 'monthly' or 'annual' from 'patron_monthly' or 'patron_annual'
            $patronType = str_replace('patron_', '', $plan);

            DB::transaction(function () use ($user, $patronType, $session) {
                $user->update([
                    'user_type' => 'patron',
                    'patron_type' => $patronType, // 'monthly' or 'annual'
                    'stripe_subscription_id' => $session->subscription ?? null,
                    'stripe_customer_id' => $session->customer ?? null,
                ]);
            });

            // Send admin notification
            try {
                Notification::route('mail', 'office@predl.cc')
                    ->notify(new NewPatronSubscription($user, $patronType, 'stripe'));
            } catch (\Exception $e) {
                Log::error('Failed to send patron subscription notification: ' . $e->getMessage());
            }
        }
    }

    /**
     * Handle template purchase from Stripe webhook
     */
    private function handleTemplatePurchase($session, User $user, $metadata)
    {
        $templateId = $metadata->template_id ?? null;
        $priceEuros = (float) ($metadata->price_euros ?? 0);

        if (!$templateId) {
            Log::error('Stripe Template Purchase: No template_id in metadata');
            return;
        }

        $template = \App\Models\Template::find($templateId);
        if (!$template) {
            Log::error('Stripe Template Purchase: Template not found: ' . $templateId);
            return;
        }

        // Use the TemplateStoreService to complete the purchase
        $result = \App\Services\TemplateStoreService::completeEuroPurchase(
            $user,
            $template,
            $session->payment_intent ?? $session->id,
            'stripe'
        );

        if (!$result['success']) {
            Log::error('Template purchase failed via Stripe', [
                'user_id' => $user->id,
                'template_id' => $templateId,
                'error' => $result['message'],
            ]);
        }
    }

    /**
     * Handle subscription updates
     */
    private function handleSubscriptionUpdate($subscription)
    {
        $userId = $subscription->metadata->user_id ?? null;
        if (!$userId) {
            // Try to find by customer ID
            $stripeCustomerId = $subscription->customer;
            $user = User::where('stripe_customer_id', $stripeCustomerId)->first();
        } else {
            $user = User::find($userId);
        }

        if (!$user) {
            Log::error('Stripe Subscription Update: User not found');
            return;
        }

        $status = $subscription->status;
        $isActive = in_array($status, ['active', 'trialing']);

        if ($isActive) {
            // Keep patron status active
            $user->update([
                'user_type' => 'patron',
                'stripe_subscription_id' => $subscription->id,
            ]);
        } else {
            // Subscription is no longer active (past_due, canceled, etc.)
            $user->update([
                'user_type' => 'free',
                'patron_type' => null,
                'stripe_subscription_id' => $subscription->id,
            ]);
        }

    }

    /**
     * Handle subscription cancellation
     */
    private function handleSubscriptionCanceled($subscription)
    {
        $stripeCustomerId = $subscription->customer;
        $user = User::where('stripe_customer_id', $stripeCustomerId)
            ->orWhere('stripe_subscription_id', $subscription->id)
            ->first();

        if ($user) {
            $user->update([
                'user_type' => 'free',
                'patron_type' => null,
            ]);
        }
    }

    /**
     * Handle paid invoice (for recurring subscription payments)
     */
    private function handleInvoicePaid($invoice)
    {
        if ($invoice->billing_reason !== 'subscription_cycle') {
            return; // Only handle recurring payments
        }

        $stripeCustomerId = $invoice->customer;
        $user = User::where('stripe_customer_id', $stripeCustomerId)->first();

        if (!$user || $user->user_type !== 'patron') {
            return;
        }

        // Add monthly 100 credits for patron
        DB::transaction(function () use ($user, $invoice) {
            $user->increment('credits', 100);

            CreditTransaction::create([
                'user_id' => $user->id,
                'amount' => 100,
                'type' => 'patron_subscription',
                'description' => 'Monthly patron credits',
                'reference_type' => 'stripe',
                'reference_id' => $invoice->id,
            ]);
        });

    }

    /**
     * Create a Checkout Session for template purchase
     */
    public function createTemplateCheckout(Request $request)
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
        $priceInCents = (int) round($price * 100);

        try {
            $session = Session::create([
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'eur',
                        'product_data' => [
                            'name' => 'Template: ' . $template->name,
                            'description' => $template->description ?: 'Scoriet Template Purchase',
                        ],
                        'unit_amount' => $priceInCents,
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'payment',
                'success_url' => config('app.url') . '/payment/success?session_id={CHECKOUT_SESSION_ID}&type=template',
                'cancel_url' => config('app.url') . '/payment/cancel?type=template',
                'client_reference_id' => $user->id,
                'metadata' => [
                    'user_id' => $user->id,
                    'template_id' => $template->id,
                    'seller_id' => $template->creator_user_id,
                    'price_euros' => $price,
                    'type' => 'template',
                ],
            ]);

            return response()->json([
                'success' => true,
                'session_id' => $session->id,
                'url' => $session->url,
            ]);
        } catch (\Exception $e) {
            Log::error('Stripe Template Checkout Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Payment initialization failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get payment status
     */
    public function getPaymentStatus(Request $request)
    {
        $sessionId = $request->query('session_id');

        if (!$sessionId) {
            return response()->json([
                'success' => false,
                'error' => 'Session ID required',
            ], 400);
        }

        try {
            $session = Session::retrieve($sessionId);

            return response()->json([
                'success' => true,
                'status' => $session->payment_status,
                'customer_email' => $session->customer_details->email ?? null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Session not found',
            ], 404);
        }
    }
}
