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

    // Billing Plan IDs for Patron Subscriptions (created in PayPal Dashboard)
    // SANDBOX Plans (for development/testing):
    'billing_plans' => [
        'patron_monthly' => env('PAYPAL_PLAN_MONTHLY', 'P-34398099KE172002DNE43FPI'),
        'patron_annual'  => env('PAYPAL_PLAN_ANNUAL', 'P-3X956831L9482074BNE43KXI'),
    ],
    // LIVE Plans (for production - set in .env):
    // PAYPAL_PLAN_MONTHLY=P-9JX306986G0884828NE373YY
    // PAYPAL_PLAN_ANNUAL=P-9XV43565L93580047NE37ZPA
];
