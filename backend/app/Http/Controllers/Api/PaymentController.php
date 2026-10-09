<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function store(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'payment_method' => 'required|in:cash,qris,transfer',
            'amount_paid' => 'required|numeric|min:' . $order->total_amount,
            'reference_no' => 'nullable|string|max:100',
        ]);

        $amountPaid = (float) $validated['amount_paid'];
        $changeAmount = max(0, $amountPaid - (float) $order->total_amount);

        $payment = Payment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'amount_paid' => $amountPaid,
                'change_amount' => $changeAmount,
                'payment_method' => $validated['payment_method'],
                'payment_status' => 'completed',
                'reference_no' => $validated['reference_no'] ?? null,
                'paid_at' => now(),
            ]
        );

        $order->load(['table', 'user', 'items.menu', 'payment']);

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran berhasil diproses',
            'data' => [
                'order' => $order,
                'payment' => $payment,
            ],
        ]);
    }

    public function receipt(Order $order): JsonResponse
    {
        $order->load(['table', 'user', 'items.menu', 'payment']);

        return response()->json([
            'success' => true,
            'data' => [
                'cafe_name' => 'Aroma Kopi & Cafe',
                'cafe_address' => 'Jl. Grafika No. 1, Yogyakarta',
                'cafe_phone' => '+62 812-3456-7890',
                'order' => $order,
            ],
        ]);
    }
}
