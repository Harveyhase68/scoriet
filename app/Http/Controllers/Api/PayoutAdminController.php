<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payout;
use App\Models\PayoutItem;
use App\Models\TemplatePurchase;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PayoutAdminController extends Controller
{
    /**
     * Get pending payouts for a date range
     */
    public function getPendingPayouts(Request $request)
    {
        $request->validate([
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
        ]);

        $from = Carbon::parse($request->from)->startOfDay();
        $to = Carbon::parse($request->to)->endOfDay();

        // Get aggregated sales data per seller using raw query
        $sellerSales = DB::table('template_purchases')
            ->where('is_paid_out', false)
            ->whereBetween('created_at', [$from, $to])
            ->whereNotNull('seller_user_id')
            ->select(
                'seller_user_id',
                DB::raw('COUNT(*) as sales_count'),
                DB::raw('SUM(price_euros) as gross_amount')
            )
            ->groupBy('seller_user_id')
            ->get();

        // Calculate payout amounts for each seller
        $sellers = [];
        $summary = [
            'total_gross' => 0,
            'total_platform_fee' => 0,
            'total_vat' => 0,
            'total_net' => 0,
            'bank_transfer_count' => 0,
            'bank_transfer_total' => 0,
            'paypal_count' => 0,
            'paypal_total' => 0,
        ];

        foreach ($sellerSales as $sale) {
            // Load seller separately
            $seller = User::find($sale->seller_user_id);
            if (!$seller || !$seller->is_seller) continue;

            $grossAmount = (float) $sale->gross_amount;
            $amounts = Payout::calculatePayoutAmounts($grossAmount, $seller->seller_type);

            $sellerData = [
                'user_id' => $seller->id,
                'username' => $seller->username,
                'name' => $seller->name,
                'email' => $seller->email,
                'company_name' => $seller->company_name ?? $seller->name,
                'company_country' => $seller->company_country,
                'seller_type' => $seller->seller_type ?? 'eu_private',
                'payout_method' => $seller->payout_method,
                'payout_destination' => $seller->payout_method === 'paypal'
                    ? $seller->paypal_payout_email
                    : $seller->bank_iban,
                'sales_count' => $sale->sales_count,
                'gross_amount' => $grossAmount,
                'platform_fee' => $amounts['platform_fee'],
                'vat_amount' => $amounts['vat_amount'],
                'net_amount' => $amounts['net_amount'],
            ];

            $sellers[] = $sellerData;

            // Update summary
            $summary['total_gross'] += $grossAmount;
            $summary['total_platform_fee'] += $amounts['platform_fee'];
            $summary['total_vat'] += $amounts['vat_amount'];
            $summary['total_net'] += $amounts['net_amount'];

            if ($seller->payout_method === 'paypal') {
                $summary['paypal_count']++;
                $summary['paypal_total'] += $amounts['net_amount'];
            } else {
                $summary['bank_transfer_count']++;
                $summary['bank_transfer_total'] += $amounts['net_amount'];
            }
        }

        return response()->json([
            'sellers' => $sellers,
            'summary' => $summary,
            'period' => [
                'from' => $from->format('Y-m-d'),
                'to' => $to->format('Y-m-d'),
            ],
        ]);
    }

    /**
     * Process a single seller payout
     */
    public function processSinglePayout(Request $request, $userId)
    {
        $request->validate([
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
        ]);

        $from = Carbon::parse($request->from)->startOfDay();
        $to = Carbon::parse($request->to)->endOfDay();

        $seller = User::findOrFail($userId);

        if (!$seller->is_seller) {
            return response()->json(['error' => __('payoutadmincontrollerphp126')], 400);
        }

        // Get all unpaid purchases for this seller
        $purchases = TemplatePurchase::where('is_paid_out', false)
            ->where('seller_user_id', $userId)
            ->whereBetween('created_at', [$from, $to])
            ->get();

        if ($purchases->isEmpty()) {
            return response()->json(['error' => __('payoutadmincontrollerphp136')], 404);
        }

        $grossAmount = $purchases->sum('price_euros');
        $amounts = Payout::calculatePayoutAmounts($grossAmount, $seller->seller_type);

        DB::beginTransaction();
        try {
            // Create payout record
            $payout = Payout::create([
                'user_id' => $seller->id,
                'period_start' => $from,
                'period_end' => $to,
                'gross_amount' => $grossAmount,
                'platform_fee' => $amounts['platform_fee'],
                'vat_amount' => $amounts['vat_amount'],
                'net_amount' => $amounts['net_amount'],
                'seller_type' => $seller->seller_type,
                'payout_method' => $seller->payout_method,
                'payout_destination' => $seller->payout_method === 'paypal'
                    ? $seller->paypal_payout_email
                    : $seller->bank_iban,
                'status' => Payout::STATUS_PROCESSING,
            ]);

            // Create payout items for each purchase
            foreach ($purchases as $purchase) {
                $purchaseAmounts = Payout::calculatePayoutAmounts($purchase->price_euros, $seller->seller_type);

                PayoutItem::create([
                    'payout_id' => $payout->id,
                    'template_purchase_id' => $purchase->id,
                    'sale_amount' => $purchase->price_euros,
                    'platform_share' => $purchaseAmounts['platform_fee'],
                    'vat_deducted' => $purchaseAmounts['vat_amount'],
                    'seller_share' => $purchaseAmounts['net_amount'],
                ]);

                // Mark purchase as paid out
                $purchase->update([
                    'is_paid_out' => true,
                    'payout_id' => $payout->id,
                    'paid_out_at' => now(),
                    'seller_earnings' => $purchaseAmounts['net_amount'],
                    'platform_fee' => $purchaseAmounts['platform_fee'],
                ]);
            }

            // Update seller earnings
            $seller->increment('pending_earnings', -$amounts['net_amount']);
            $seller->increment('total_earnings', $amounts['net_amount']);

            // Process actual payout based on method
            if ($seller->payout_method === 'paypal') {
                // Send via PayPal Payouts API
                $paypalController = new PayPalController();
                $senderBatchId = 'PAYOUT-' . $payout->id . '-' . now()->format('YmdHis');

                $paypalResult = $paypalController->sendPayout(
                    $seller->paypal_payout_email,
                    $amounts['net_amount'],
                    "Scoriet Template-Verkäufe Auszahlung ({$from->format('d.m.Y')} - {$to->format('d.m.Y')})",
                    $senderBatchId
                );

                if ($paypalResult['success']) {
                    $payout->markAsCompleted($paypalResult['payout_batch_id'], [
                        'batch_status' => $paypalResult['batch_status'] ?? 'PENDING',
                        'sender_batch_id' => $senderBatchId,
                    ]);

                } else {
                    // PayPal failed - rollback everything
                    DB::rollBack();
                    return response()->json([
                        'error' => __('payoutadmincontrollerphp211_2') . ($paypalResult['error'] ?? __('payoutadmincontrollerphp211')),
                    ], 500);
                }
            } else {
                // Bank transfer - just mark as pending (manual processing required)
                $payout->update([
                    'status' => Payout::STATUS_PENDING,
                    'transaction_id' => 'BANK-PENDING-' . now()->format('YmdHis'),
                ]);

            }

            DB::commit();

            $methodText = $seller->payout_method === 'paypal' ? 'via PayPal gesendet' : 'für Banküberweisung vorgemerkt';

            return response()->json([
                'success' => true,
                'payout' => $payout->fresh(),
                'message' => "Auszahlung von {$amounts['net_amount']}€ an {$seller->name} {$methodText}",
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payout processing error', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => __('payoutadmincontrollerphp240') . $e->getMessage()], 500);
        }
    }

    /**
     * Process all PayPal payouts in batch
     */
    public function processPaypalBatch(Request $request)
    {
        $request->validate([
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
        ]);

        $from = Carbon::parse($request->from)->startOfDay();
        $to = Carbon::parse($request->to)->endOfDay();

        // Get all PayPal sellers with unpaid purchases
        $paypalSellers = User::where('is_seller', true)
            ->where('payout_method', 'paypal')
            ->whereHas('templateSales', function ($q) use ($from, $to) {
                $q->where('is_paid_out', false)
                    ->whereBetween('created_at', [$from, $to]);
            })
            ->get();

        if ($paypalSellers->isEmpty()) {
            return response()->json([
                'success' => false,
                'error' => 'Keine PayPal-Verkäufer mit ausstehenden Auszahlungen gefunden',
            ], 404);
        }

        // Prepare batch payout data
        $recipients = [];
        $payoutRecords = [];

        DB::beginTransaction();
        try {
            foreach ($paypalSellers as $seller) {
                $purchases = TemplatePurchase::where('is_paid_out', false)
                    ->where('seller_user_id', $seller->id)
                    ->whereBetween('created_at', [$from, $to])
                    ->get();

                if ($purchases->isEmpty()) continue;

                $grossAmount = $purchases->sum('price_euros');
                $amounts = Payout::calculatePayoutAmounts($grossAmount, $seller->seller_type);

                // Create payout record
                $payout = Payout::create([
                    'user_id' => $seller->id,
                    'period_start' => $from,
                    'period_end' => $to,
                    'gross_amount' => $grossAmount,
                    'platform_fee' => $amounts['platform_fee'],
                    'vat_amount' => $amounts['vat_amount'],
                    'net_amount' => $amounts['net_amount'],
                    'seller_type' => $seller->seller_type,
                    'payout_method' => 'paypal',
                    'payout_destination' => $seller->paypal_payout_email,
                    'status' => Payout::STATUS_PROCESSING,
                ]);

                // Create payout items
                foreach ($purchases as $purchase) {
                    $purchaseAmounts = Payout::calculatePayoutAmounts($purchase->price_euros, $seller->seller_type);

                    PayoutItem::create([
                        'payout_id' => $payout->id,
                        'template_purchase_id' => $purchase->id,
                        'sale_amount' => $purchase->price_euros,
                        'platform_share' => $purchaseAmounts['platform_fee'],
                        'vat_deducted' => $purchaseAmounts['vat_amount'],
                        'seller_share' => $purchaseAmounts['net_amount'],
                    ]);

                    $purchase->update([
                        'is_paid_out' => true,
                        'payout_id' => $payout->id,
                        'paid_out_at' => now(),
                        'seller_earnings' => $purchaseAmounts['net_amount'],
                        'platform_fee' => $purchaseAmounts['platform_fee'],
                    ]);
                }

                // Update seller earnings
                $seller->increment('pending_earnings', -$amounts['net_amount']);
                $seller->increment('total_earnings', $amounts['net_amount']);

                // Add to batch recipients
                $recipients[] = [
                    'email' => $seller->paypal_payout_email,
                    'amount' => $amounts['net_amount'],
                    'note' => "Scoriet Auszahlung ({$from->format('d.m.Y')} - {$to->format('d.m.Y')})",
                    'item_id' => 'PAYOUT-' . $payout->id,
                ];

                $payoutRecords[] = [
                    'payout' => $payout,
                    'seller' => $seller,
                    'amount' => $amounts['net_amount'],
                ];
            }

            if (empty($recipients)) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'error' => 'Keine gültigen Empfänger für Batch-Auszahlung',
                ], 400);
            }

            // Send batch payout via PayPal
            $paypalController = new PayPalController();
            $senderBatchId = 'BATCH-' . now()->format('YmdHis') . '-' . count($recipients);

            $paypalResult = $paypalController->sendBatchPayout($recipients, $senderBatchId);

            if ($paypalResult['success']) {
                // Mark all payouts as completed
                foreach ($payoutRecords as $record) {
                    $record['payout']->markAsCompleted($paypalResult['payout_batch_id'], [
                        'batch_status' => $paypalResult['batch_status'] ?? 'PENDING',
                        'sender_batch_id' => $senderBatchId,
                        'is_batch' => true,
                    ]);
                }

                DB::commit();

                $totalPaid = array_sum(array_column($payoutRecords, 'amount'));

                return response()->json([
                    'success' => true,
                    'processed' => count($payoutRecords),
                    'total_paid' => $totalPaid,
                    'batch_id' => $paypalResult['payout_batch_id'],
                    'errors' => [],
                    'message' => count($payoutRecords) . " PayPal-Auszahlungen verarbeitet (Gesamt: {$totalPaid}€)",
                ]);
            } else {
                // PayPal batch failed - rollback everything
                DB::rollBack();

                Log::error('PayPal Batch Payout failed', [
                    'error' => $paypalResult['error'],
                    'recipient_count' => count($recipients),
                ]);

                return response()->json([
                    'success' => false,
                    'error' => 'PayPal Batch-Auszahlung fehlgeschlagen: ' . ($paypalResult['error'] ?? __('payoutadmincontrollerphp393')),
                ], 500);
            }

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Batch payout processing error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'error' => __('payoutadmincontrollerphp405') . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get payout history
     */
    public function getPayoutHistory(Request $request)
    {
        $payouts = Payout::with(['user:id,name,email,company_name', 'items'])
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($payouts);
    }

    /**
     * Export pending bank transfer payouts as SEPA XML (pain.001.001.03)
     */
    public function exportSepaXml(Request $request)
    {
        $request->validate([
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
            'execution_date' => 'nullable|date',
        ]);

        $from = Carbon::parse($request->from)->startOfDay();
        $to = Carbon::parse($request->to)->endOfDay();
        $executionDate = $request->execution_date
            ? Carbon::parse($request->execution_date)->format('Y-m-d')
            : Carbon::tomorrow()->format('Y-m-d');

        // Get pending bank transfer sellers
        $bankTransferSellers = $this->getBankTransferSellers($from, $to);

        if (empty($bankTransferSellers)) {
            return response()->json([
                'error' => __('payoutadmincontrollerphp444'),
            ], 404);
        }

        // Company details from config/env
        $companyName = config('app.sepa_company_name', env('SEPA_COMPANY_NAME', 'Scoriet GmbH'));
        $companyIban = config('app.sepa_iban', env('SEPA_IBAN', ''));
        $companyBic = config('app.sepa_bic', env('SEPA_BIC', ''));

        if (empty($companyIban)) {
            return response()->json([
                'error' => __('payoutadmincontrollerphp455'),
            ], 500);
        }

        // Calculate totals
        $totalAmount = array_sum(array_column($bankTransferSellers, 'net_amount'));
        $transactionCount = count($bankTransferSellers);
        $messageId = 'SCORIET-' . now()->format('YmdHis');
        $paymentInfoId = 'PMT-' . now()->format('YmdHis');

        // Build SEPA XML
        $xml = $this->buildSepaXml(
            $bankTransferSellers,
            $companyName,
            $companyIban,
            $companyBic,
            $messageId,
            $paymentInfoId,
            $executionDate,
            $totalAmount,
            $transactionCount,
            $from,
            $to
        );

        return response($xml, 200, [
            'Content-Type' => 'application/xml',
            'Content-Disposition' => 'attachment; filename="sepa-payouts-' . now()->format('Y-m-d') . '.xml"',
        ]);
    }

    /**
     * Export pending bank transfer payouts as CSV
     */
    public function exportCsv(Request $request)
    {
        $request->validate([
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
        ]);

        $from = Carbon::parse($request->from)->startOfDay();
        $to = Carbon::parse($request->to)->endOfDay();

        // Get pending bank transfer sellers
        $bankTransferSellers = $this->getBankTransferSellers($from, $to);

        if (empty($bankTransferSellers)) {
            return response()->json([
                'error' => __('payoutadmincontrollerphp504'),
            ], 404);
        }

        // Build CSV
        $csv = "Empfänger;IBAN;BIC;Betrag;Währung;Verwendungszweck\n";

        foreach ($bankTransferSellers as $seller) {
            $name = $this->sanitizeForCsv($seller['bank_account_holder'] ?: $seller['name']);
            $iban = $seller['bank_iban'];
            $bic = $seller['bank_bic'] ?: '';
            $amount = number_format($seller['net_amount'], 2, ',', '');
            $reference = $this->sanitizeForCsv(__('payoutadmincontrollerphp516')."{$from->format('d.m.Y')}-{$to->format('d.m.Y')}");

            $csv .= "{$name};{$iban};{$bic};{$amount};EUR;{$reference}\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="sepa-payouts-' . now()->format('Y-m-d') . '.csv"',
        ]);
    }

    /**
     * Get bank transfer sellers with pending payouts
     */
    private function getBankTransferSellers(Carbon $from, Carbon $to): array
    {
        $sellerSales = DB::table('template_purchases')
            ->where('is_paid_out', false)
            ->whereBetween('created_at', [$from, $to])
            ->whereNotNull('seller_user_id')
            ->select(
                'seller_user_id',
                DB::raw('COUNT(*) as sales_count'),
                DB::raw('SUM(price_euros) as gross_amount')
            )
            ->groupBy('seller_user_id')
            ->get();

        $sellers = [];

        foreach ($sellerSales as $sale) {
            $seller = User::find($sale->seller_user_id);
            if (!$seller || !$seller->is_seller) continue;
            if ($seller->payout_method !== 'bank_transfer') continue;
            if (empty($seller->bank_iban)) continue;

            $grossAmount = (float) $sale->gross_amount;
            $amounts = Payout::calculatePayoutAmounts($grossAmount, $seller->seller_type);

            $sellers[] = [
                'user_id' => $seller->id,
                'name' => $seller->name,
                'company_name' => $seller->company_name,
                'bank_account_holder' => $seller->bank_account_holder,
                'bank_iban' => $seller->bank_iban,
                'bank_bic' => $seller->bank_bic,
                'sales_count' => $sale->sales_count,
                'gross_amount' => $grossAmount,
                'net_amount' => $amounts['net_amount'],
            ];
        }

        return $sellers;
    }

    /**
     * Build SEPA XML (pain.001.001.03) for ELBA Business / standard banking
     */
    private function buildSepaXml(
        array $sellers,
        string $companyName,
        string $companyIban,
        string $companyBic,
        string $messageId,
        string $paymentInfoId,
        string $executionDate,
        float $totalAmount,
        int $transactionCount,
        Carbon $from,
        Carbon $to
    ): string {
        $xml = new \SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03"></Document>');

        $cstmrCdtTrfInitn = $xml->addChild('CstmrCdtTrfInitn');

        // Group Header
        $grpHdr = $cstmrCdtTrfInitn->addChild('GrpHdr');
        $grpHdr->addChild('MsgId', $this->sanitizeSepa($messageId));
        $grpHdr->addChild('CreDtTm', now()->format('Y-m-d\TH:i:s'));
        $grpHdr->addChild('NbOfTxs', $transactionCount);
        $grpHdr->addChild('CtrlSum', number_format($totalAmount, 2, '.', ''));
        $initgPty = $grpHdr->addChild('InitgPty');
        $initgPty->addChild('Nm', $this->sanitizeSepa($companyName));

        // Payment Information
        $pmtInf = $cstmrCdtTrfInitn->addChild('PmtInf');
        $pmtInf->addChild('PmtInfId', $this->sanitizeSepa($paymentInfoId));
        $pmtInf->addChild('PmtMtd', 'TRF');
        $pmtInf->addChild('BtchBookg', 'true');
        $pmtInf->addChild('NbOfTxs', $transactionCount);
        $pmtInf->addChild('CtrlSum', number_format($totalAmount, 2, '.', ''));
        $pmtInf->addChild('ReqdExctnDt', $executionDate);

        // Debtor (Your company)
        $dbtr = $pmtInf->addChild('Dbtr');
        $dbtr->addChild('Nm', $this->sanitizeSepa($companyName));

        $dbtrAcct = $pmtInf->addChild('DbtrAcct');
        $dbtrAcctId = $dbtrAcct->addChild('Id');
        $dbtrAcctId->addChild('IBAN', $this->sanitizeSepa($companyIban));

        $dbtrAgt = $pmtInf->addChild('DbtrAgt');
        $finInstnId = $dbtrAgt->addChild('FinInstnId');
        if (!empty($companyBic)) {
            $finInstnId->addChild('BIC', $this->sanitizeSepa($companyBic));
        } else {
            $finInstnId->addChild('Othr')->addChild('Id', 'NOTPROVIDED');
        }

        $pmtInf->addChild('ChrgBr', 'SLEV');

        // Credit Transfer Transactions (individual payments)
        foreach ($sellers as $index => $seller) {
            $cdtTrfTxInf = $pmtInf->addChild('CdtTrfTxInf');

            // Payment ID
            $pmtId = $cdtTrfTxInf->addChild('PmtId');
            $pmtId->addChild('EndToEndId', 'PAYOUT-' . $seller['user_id'] . '-' . now()->format('Ymd'));

            // Amount
            $amt = $cdtTrfTxInf->addChild('Amt');
            $instdAmt = $amt->addChild('InstdAmt', number_format($seller['net_amount'], 2, '.', ''));
            $instdAmt->addAttribute('Ccy', 'EUR');

            // Creditor Bank (BIC)
            $cdtrAgt = $cdtTrfTxInf->addChild('CdtrAgt');
            $cdtrFinInstnId = $cdtrAgt->addChild('FinInstnId');
            if (!empty($seller['bank_bic'])) {
                $cdtrFinInstnId->addChild('BIC', $this->sanitizeSepa($seller['bank_bic']));
            } else {
                $cdtrFinInstnId->addChild('Othr')->addChild('Id', 'NOTPROVIDED');
            }

            // Creditor (Seller)
            $cdtr = $cdtTrfTxInf->addChild('Cdtr');
            $creditorName = $seller['bank_account_holder'] ?: $seller['company_name'] ?: $seller['name'];
            $cdtr->addChild('Nm', $this->sanitizeSepa($creditorName));

            // Creditor Account (IBAN)
            $cdtrAcct = $cdtTrfTxInf->addChild('CdtrAcct');
            $cdtrAcctId = $cdtrAcct->addChild('Id');
            $cdtrAcctId->addChild('IBAN', $this->sanitizeSepa($seller['bank_iban']));

            // Remittance Information (Verwendungszweck)
            $rmtInf = $cdtTrfTxInf->addChild('RmtInf');
            $reference = "Scoriet Auszahlung {$from->format('d.m.Y')}-{$to->format('d.m.Y')}";
            $rmtInf->addChild('Ustrd', $this->sanitizeSepa($reference));
        }

        // Format XML nicely
        $dom = new \DOMDocument('1.0', 'UTF-8');
        $dom->preserveWhiteSpace = false;
        $dom->formatOutput = true;
        $dom->loadXML($xml->asXML());

        return $dom->saveXML();
    }

    /**
     * Sanitize string for SEPA XML (remove special characters)
     */
    private function sanitizeSepa(string $input): string
    {
        // SEPA allows: a-z A-Z 0-9 / - ? : ( ) . , ' + space
        $input = str_replace(['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'], ['ae', 'oe', 'ue', 'ss', 'Ae', 'Oe', 'Ue'], $input);
        $sanitized = preg_replace('/[^a-zA-Z0-9\/\-\?\:\(\)\.\,\'\+\s]/', '', $input);
        return substr(trim($sanitized), 0, 70); // Max 70 chars for most SEPA fields
    }

    /**
     * Sanitize string for CSV
     */
    private function sanitizeForCsv(string $input): string
    {
        // Remove semicolons and newlines
        return str_replace([';', "\n", "\r"], [',', ' ', ' '], $input);
    }
}
