<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CafeTable;
use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth();

        // Total omzet hari ini & bulan ini
        $revenueToday = Order::whereDate('created_at', $today)
            ->whereHas('payment', fn ($q) => $q->where('payment_status', 'completed'))
            ->sum('total_amount');

        $revenueMonth = Order::where('created_at', '>=', $thisMonth)
            ->whereHas('payment', fn ($q) => $q->where('payment_status', 'completed'))
            ->sum('total_amount');

        // Jumlah pesanan hari ini
        $ordersTodayCount = Order::whereDate('created_at', $today)->count();

        // Pesanan aktif saat ini
        $activeOrdersCount = Order::whereIn('status', ['pending', 'processing', 'ready'])->count();

        // Statistik meja
        $totalTables = CafeTable::count();
        $occupiedTables = CafeTable::where('status', 'occupied')->count();

        // Best seller menus (Top 5)
        $topMenus = OrderItem::select('menu_id', DB::raw('SUM(quantity) as total_sold'), DB::raw('SUM(subtotal) as total_revenue'))
            ->groupBy('menu_id')
            ->orderByDesc('total_sold')
            ->with('menu:id,name,price,category_id')
            ->take(5)
            ->get();

        // Trend penjualan 7 hari terakhir
        $sevenDaysAgo = Carbon::today()->subDays(6);
        $dailySales = Order::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(id) as total_orders'),
            DB::raw('SUM(total_amount) as total_amount')
        )
            ->where('created_at', '>=', $sevenDaysAgo)
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'revenue_today' => (float) $revenueToday,
                    'revenue_month' => (float) $revenueMonth,
                    'orders_today' => $ordersTodayCount,
                    'active_orders' => $activeOrdersCount,
                    'total_tables' => $totalTables,
                    'occupied_tables' => $occupiedTables,
                ],
                'top_menus' => $topMenus,
                'daily_sales' => $dailySales,
            ],
        ]);
    }
}
