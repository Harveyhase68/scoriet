<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$t = \App\Models\Template::where('creator_user_id', 8)->where('visibility', 'store')->first();
if($t) {
    echo "Template ID: {$t->id}\n";
    echo "Name: {$t->name}\n";
    echo "price_type: {$t->price_type}\n";
    echo "price_credits: {$t->price_credits}\n";
    echo "price_euros: {$t->price_euros}\n";
    echo "is_store_approved: " . ($t->is_store_approved ? 'yes' : 'no') . "\n";
    echo "review_status: {$t->review_status}\n";
} else {
    echo "No store template found for user 8\n";

    // Try any template with visibility=store
    $all = \App\Models\Template::where('visibility', 'store')->get();
    echo "\nAll store templates:\n";
    foreach($all as $tpl) {
        echo "- ID: {$tpl->id}, Creator: {$tpl->creator_user_id}, Name: {$tpl->name}, price_type: {$tpl->price_type}\n";
    }
}
