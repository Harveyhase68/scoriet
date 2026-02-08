<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VisitorLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VisitorController extends Controller
{
    /**
     * Get visitor statistics for the admin dashboard.
     */
    public function stats(Request $request): JsonResponse
    {
        $today = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();
        $weekAgo = now()->subDays(7)->toDateString();
        $monthAgo = now()->subDays(30)->toDateString();

        // Summary counts (unique IPs per period)
        $todayCount = VisitorLog::where('visited_date', $today)->count();
        $yesterdayCount = VisitorLog::where('visited_date', $yesterday)->count();
        $weekCount = VisitorLog::where('visited_date', '>=', $weekAgo)->count();
        $monthCount = VisitorLog::where('visited_date', '>=', $monthAgo)->count();
        $overallCount = VisitorLog::count();

        // Authenticated vs anonymous breakdown (today)
        $todayAuthenticated = VisitorLog::where('visited_date', $today)
            ->where('is_authenticated', true)->count();
        $todayAnonymous = $todayCount - $todayAuthenticated;

        // Daily chart data (last 30 days)
        $dailyData = VisitorLog::select(
                'visited_date',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN is_authenticated = 1 THEN 1 ELSE 0 END) as authenticated'),
                DB::raw('SUM(CASE WHEN is_authenticated = 0 THEN 1 ELSE 0 END) as anonymous')
            )
            ->where('visited_date', '>=', $monthAgo)
            ->groupBy('visited_date')
            ->orderBy('visited_date')
            ->get();

        // Fill in missing days with zero values
        $chartData = [];
        $currentDate = now()->subDays(29)->startOfDay();
        $endDate = now()->startOfDay();

        while ($currentDate <= $endDate) {
            $dateStr = $currentDate->toDateString();
            $dayData = $dailyData->firstWhere('visited_date', $dateStr);

            $chartData[] = [
                'date' => $dateStr,
                'label' => $currentDate->format('d.m.'),
                'total' => $dayData ? (int) $dayData->total : 0,
                'authenticated' => $dayData ? (int) $dayData->authenticated : 0,
                'anonymous' => $dayData ? (int) $dayData->anonymous : 0,
            ];

            $currentDate->addDay();
        }

        // Top referrers (last 30 days)
        $topReferrers = VisitorLog::select('referrer', DB::raw('COUNT(*) as count'))
            ->where('visited_date', '>=', $monthAgo)
            ->whereNotNull('referrer')
            ->where('referrer', '!=', '')
            ->groupBy('referrer')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        return response()->json([
            'summary' => [
                'today' => $todayCount,
                'yesterday' => $yesterdayCount,
                'this_week' => $weekCount,
                'this_month' => $monthCount,
                'overall' => $overallCount,
                'today_authenticated' => $todayAuthenticated,
                'today_anonymous' => $todayAnonymous,
            ],
            'chart' => $chartData,
            'top_referrers' => $topReferrers,
        ]);
    }
}
