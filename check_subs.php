<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Subscription;

$subs = Subscription::where('user_id', 4)->get();
foreach ($subs as $sub) {
    echo $sub->subscription_type . ' | active: ' . ($sub->is_active ? 'yes' : 'no') . ' | expires: ' . $sub->expires_at . PHP_EOL;
}
echo 'Total: ' . $subs->count() . PHP_EOL;
