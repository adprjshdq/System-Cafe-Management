<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CafeTable;
use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['table', 'user', 'items.menu', 'payment'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('order_type')) {
            $query->where('order_type', $request->order_type);
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $orders = $query->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'table_id' => 'nullable|exists:tables,id',
            'customer_name' => 'nullable|string|max:100',
            'order_type' => 'required|in:dine_in,takeaway',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|exists:menus,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string|max:255',
            // Payment info (opsional saat checkout langsung di kasir)
            'payment' => 'nullable|array',
            'payment.method' => 'required_with:payment|in:cash,qris,transfer',
            'payment.amount_paid' => 'required_with:payment|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $datePrefix = date('Ymd');
            $randomSuffix = strtoupper(Str::random(4));
            $orderNumber = 'INV-' . $datePrefix . '-' . $randomSuffix;

            $subtotal = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                $menu = Menu::findOrFail($item['menu_id']);
                $itemSubtotal = $menu->price * $item['quantity'];
                $subtotal += $itemSubtotal;

                $itemsData[] = [
                    'menu_id' => $menu->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $menu->price,
                    'subtotal' => $itemSubtotal,
                    'notes' => $item['notes'] ?? null,
                    'item_status' => 'pending',
                ];
            }

            $taxAmount = round($subtotal * 0.10, 2); // Pajak 10%
            $discountAmount = 0;
            $totalAmount = $subtotal + $taxAmount - $discountAmount;

            $order = Order::create([
                'order_number' => $orderNumber,
                'user_id' => $request->user()?->id,
                'table_id' => $validated['table_id'] ?? null,
                'customer_name' => $validated['customer_name'] ?: 'Pelanggan Walk-In',
                'order_type' => $validated['order_type'],
                'status' => 'pending',
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'discount_amount' => $discountAmount,
                'total_amount' => $totalAmount,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($itemsData as $itemData) {
                $order->items()->create($itemData);
            }

            // Jika ada meja dan tipe pesanan dine in, ubah status meja ke occupied
            if (! empty($validated['table_id']) && $validated['order_type'] === 'dine_in') {
                CafeTable::where('id', $validated['table_id'])->update(['status' => 'occupied']);
            }

            // Jika langsung dibayar
            if (! empty($validated['payment'])) {
                $amountPaid = $validated['payment']['amount_paid'];
                $changeAmount = max(0, $amountPaid - $totalAmount);

                Payment::create([
                    'order_id' => $order->id,
                    'amount_paid' => $amountPaid,
                    'change_amount' => $changeAmount,
                    'payment_method' => $validated['payment']['method'],
                    'payment_status' => 'completed',
                    'paid_at' => now(),
                ]);
            }

            $order->load(['table', 'user', 'items.menu', 'payment']);

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibuat',
                'data' => $order,
            ], 201);
        });
    }

    public function show(Order $order): JsonResponse
    {
        $order->load(['table', 'user', 'items.menu', 'payment']);

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,processing,ready,completed,cancelled',
        ]);

        $order->update(['status' => $validated['status']]);

        // Jika pesanan selesai atau dibatalkan, bebaskan meja
        if (in_array($validated['status'], ['completed', 'cancelled']) && $order->table_id) {
            $otherActiveOrders = Order::where('table_id', $order->table_id)
                ->where('id', '!=', $order->id)
                ->whereIn('status', ['pending', 'processing', 'ready'])
                ->exists();

            if (! $otherActiveOrders) {
                CafeTable::where('id', $order->table_id)->update(['status' => 'available']);
            }
        }

        $order->load(['table', 'user', 'items.menu', 'payment']);

        return response()->json([
            'success' => true,
            'message' => 'Status pesanan berhasil diperbarui',
            'data' => $order,
        ]);
    }

    public function updateItemStatus(Request $request, OrderItem $item): JsonResponse
    {
        $validated = $request->validate([
            'item_status' => 'required|in:pending,cooking,ready',
        ]);

        $item->update(['item_status' => $validated['item_status']]);

        return response()->json([
            'success' => true,
            'message' => 'Status menu pesanan diperbarui',
            'data' => $item,
        ]);
    }
}
