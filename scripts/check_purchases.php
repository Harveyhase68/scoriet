<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Recent Template Purchases ===\n\n";

$purchases = \App\Models\TemplatePurchase::orderBy('created_at', 'desc')->limit(5)->get();
foreach($purchases as $p) {
    echo "Purchase ID: {$p->id}\n";
    echo "  Buyer: {$p->buyer_user_id}\n";
    echo "  Seller: {$p->seller_user_id}\n";
    echo "  Template: {$p->template_id}\n";
    echo "  Price Euros: {$p->price_euros}\n";
    echo "  is_paid_out: " . ($p->is_paid_out ? 'yes' : 'no') . "\n";
    echo "  Created: {$p->created_at}\n";
    echo "\n";
}

echo "\n=== Seller User 8 Profile ===\n\n";
$seller = \App\Models\User::find(8);
if ($seller) {
    echo "Name: {$seller->name}\n";
    echo "is_seller: " . ($seller->is_seller ? 'yes' : 'no') . "\n";
    echo "seller_type: {$seller->seller_type}\n";
    echo "payout_method: {$seller->payout_method}\n";
    echo "company_name: {$seller->company_name}\n";
    echo "company_country: {$seller->company_country}\n";
} else {
    echo "User 8 not found\n";
}

echo "\n=== Unpaid Purchases with Seller Info ===\n\n";
$unpaid = \App\Models\TemplatePurchase::where('is_paid_out', false)
    ->whereNotNull('seller_user_id')
    ->with('seller')
    ->get();

foreach($unpaid as $p) {
    echo "Purchase {$p->id}: Seller {$p->seller_user_id}";
    if ($p->seller) {
        echo " (is_seller: " . ($p->seller->is_seller ? 'yes' : 'no') . ", payout_method: {$p->seller->payout_method})";
    }
    echo ", Amount: {$p->price_euros} EUR\n";
}
