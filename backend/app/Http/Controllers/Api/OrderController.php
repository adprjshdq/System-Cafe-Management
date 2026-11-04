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
use Illuminate\Validation\ValidationException;

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
        $user = $request->user();
        $isWaiter = $user?->role === 'waiter';

        // Pelayan hanya membuat pesanan dari meja dan tidak boleh memproses pembayaran.
        if ($isWaiter && $request->filled('payment')) {
            return response()->json([
                'success' => false,
                'message' => 'Pelayan tidak dapat memproses pembayaran. Pesanan akan dibayar di kasir.',
            ], 403);
        }

        $validated = $request->validate([
            'table_id' => $isWaiter ? 'required|exists:tables,id' : 'nullable|exists:tables,id',
            'customer_name' => 'nullable|string|max:100',
            'order_type' => $isWaiter ? 'required|in:dine_in' : 'required|in:dine_in,takeaway',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|exists:menus,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string|max:255',
            // Payment info (opsional saat checkout langsung di kasir)
            'payment' => 'nullable|array',
            'payment.method' => 'required_with:payment|in:cash,qris,transfer',
            'payment.amount_paid' => 'required_with:payment|numeric|min:0',
        ], $isWaiter ? [
            'table_id.required' => 'Pelayan harus memilih meja untuk pesanan.',
            'order_type.in' => 'Pelayan hanya dapat membuat pesanan dine-in dari meja.',
        ] : []);

        return DB::transaction(function () use ($validated, $request) {
            $datePrefix = date('Ymd');
            $randomSuffix = strtoupper(Str::random(4));
            $orderNumber = 'INV-'.$datePrefix.'-'.$randomSuffix;

            $subtotal = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                $menu = Menu::lockForUpdate()->findOrFail($item['menu_id']);

                if (! $menu->is_available) {
                    throw ValidationException::withMessages([
                        'items' => "Menu {$menu->name} sedang tidak tersedia.",
                    ]);
                }

                if ($menu->stock !== null && $menu->stock < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => "Stok {$menu->name} tidak mencukupi (tersisa {$menu->stock}).",
                    ]);
                }

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

                if ($menu->stock !== null) {
                    $menu->decrement('stock', $item['quantity']);
                }
            }

            $taxAmount = round($subtotal * 0.10, 2); // Pajak 10%
            $discountAmount = 0;
            $totalAmount = $subtotal + $taxAmount - $discountAmount;

            $order = Order::create([
                'order_number' => $orderNumber,
                'user_id' => $request->user()?->id,
                'table_id' => $validated['table_id'] ?? null,
                'customer_name' => ($validated['customer_name'] ?? null) ?: 'Pelanggan Walk-In',
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

    public function destroy(Order $order): JsonResponse
    {
        DB::transaction(function () use ($order) {
            $tableId = $order->table_id;

            // Stok sudah dikembalikan saat pesanan dibatalkan. Untuk pesanan
            // yang masih aktif, kembalikan stok karena pesanan tidak jadi.
            if (in_array($order->status, ['pending', 'processing', 'ready'], true)) {
                foreach ($order->items()->get() as $item) {
                    Menu::where('id', $item->menu_id)
                        ->whereNotNull('stock')
                        ->increment('stock', $item->quantity);
                }
            }

            // Item pesanan dan pembayaran terhapus otomatis lewat cascade.
            $order->delete();

            if ($tableId) {
                $otherActiveOrders = Order::where('table_id', $tableId)
                    ->whereIn('status', ['pending', 'processing', 'ready'])
                    ->exists();

                if (! $otherActiveOrders) {
                    CafeTable::where('id', $tableId)->update(['status' => 'available']);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Pesanan berhasil dihapus',
        ]);
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,processing,ready,completed,cancelled',
        ]);

        $previousStatus = $order->status;
        $order->update(['status' => $validated['status']]);

        // Kembalikan stok menu jika pesanan dibatalkan (hanya sekali).
        if ($validated['status'] === 'cancelled' && $previousStatus !== 'cancelled') {
            foreach ($order->items()->get() as $item) {
                Menu::where('id', $item->menu_id)
                    ->whereNotNull('stock')
                    ->increment('stock', $item->quantity);
            }
        }

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
