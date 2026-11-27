<?php
/**
 * PayPal Setting & API Credentials
 * Created by Raza Mehdi <srmk@outlook.com>.
 */

return [
    'mode'    => env('PAYPAL_MODE', 'sandbox'), // Can only be 'sandbox' Or 'live'. If empty or invalid, 'live' will be used.
    'sandbox' => [
        'client_id'         => env('PAYPAL_SANDBOX_CLIENT_ID', ''),
        'client_secret'     => env('PAYPAL_SANDBOX_CLIENT_SECRET', ''),
        'app_id'            => 'APP-80W284485P519543T',
    ],
    'live' => [
        'client_id'         => env('PAYPAL_LIVE_CLIENT_ID', ''),
        'client_secret'     => env('PAYPAL_LIVE_CLIENT_SECRET', ''),
        'app_id'            => env('PAYPAL_LIVE_APP_ID', ''),
    ],

    'payment_action' => env('PAYPAL_PAYMENT_ACTION', 'Sale'), // Can only be 'Sale', 'Authorization' or 'Order'
    'currency'       => env('PAYPAL_CURRENCY', 'EUR'),
    'notify_url'     => env('PAYPAL_NOTIFY_URL', ''), // Change this accordingly for your application.
    'locale'         => env('PAYPAL_LOCALE', 'de_DE'), // force gateway language  i.e. it_IT, es_ES, en_US ... (for express checkout only)
    'validate_ssl'   => env('PAYPAL_VALIDATE_SSL', false), // Disable for local dev, enable in production!

    // Billing Plan IDs per plan key and billing interval (created in the PayPal Dashboard,
    // see App\Support\PricingCatalog). Defaults are the SANDBOX plans for development.
    'billing_plans' => [
        'patron_annual' => [ // Team & Studio
            'month' => env('PAYPAL_PLAN_TEAM_STUDIO_MONTHLY'),
            'year'  => env('PAYPAL_PLAN_TEAM_STUDIO_YEARLY', 'P-3X956831L9482074BNE43KXI'),
        ],
        'patron_monthly' => [ // Pro Unlimited
            'month' => env('PAYPAL_PLAN_PRO_UNLIMITED_MONTHLY', 'P-34398099KE172002DNE43FPI'),
            'year'  => env('PAYPAL_PLAN_PRO_UNLIMITED_YEARLY'),
        ],
    ],
    // LIVE plans (production .env):
    // PAYPAL_PLAN_TEAM_STUDIO_MONTHLY=P-2RB966393N0522825NMEEWJI
    // PAYPAL_PLAN_TEAM_STUDIO_YEARLY=P-98C20566R49350626NMEEVIA
    // PAYPAL_PLAN_PRO_UNLIMITED_MONTHLY=P-0FL971178D189242JNMEEZQY
    // PAYPAL_PLAN_PRO_UNLIMITED_YEARLY=P-7BM36253563703339NMEEYWA
];
