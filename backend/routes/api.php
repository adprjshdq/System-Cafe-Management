<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Health Check / Ping
Route::get('/ping', function () {
    return response()->json([
        'success' => true,
        'message' => 'Cafe Management System API is running smoothly',
        'timestamp' => now()->toIso8601String(),
    ]);
});

Route::prefix('v1')->group(function () {
    // Auth Public
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Public / Fallback Read for POS
    Route::get('/menus', [MenuController::class, 'index']);
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/tables', [TableController::class, 'index']);

    // Protected Routes (Sanctum)
    Route::middleware('auth:sanctum')->group(function () {
        // Auth Current User — semua role yang login
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // Dashboard Analytics — hanya admin
        Route::get('/dashboard/stats', [DashboardController::class, 'stats'])
            ->middleware('role:admin');

        // Master Data Kategori & Menu — hanya admin
        Route::middleware('role:admin')->group(function () {
            Route::post('/categories', [CategoryController::class, 'store']);
            Route::put('/categories/{category}', [CategoryController::class, 'update']);
            Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

            Route::post('/menus', [MenuController::class, 'store']);
            Route::get('/menus/{menu}', [MenuController::class, 'show']);
            Route::post('/menus/{menu}', [MenuController::class, 'update']); // Post dengan form-data untuk file upload
            Route::patch('/menus/{menu}/toggle-availability', [MenuController::class, 'toggleAvailability']);
            Route::delete('/menus/{menu}', [MenuController::class, 'destroy']);
        });

        // Master Data Meja — admin & kasir
        Route::middleware('role:cashier')->group(function () {
            Route::post('/tables', [TableController::class, 'store']);
            Route::put('/tables/{table}', [TableController::class, 'update']);
            Route::patch('/tables/{table}/status', [TableController::class, 'updateStatus']);
            Route::delete('/tables/{table}', [TableController::class, 'destroy']);
        });

        // Transaksi & Pesanan
        // Lihat riwayat: kasir & dapur (KDS membutuhkan daftar pesanan).
        Route::get('/orders', [OrderController::class, 'index'])
            ->middleware('role:cashier,kitchen');
        Route::get('/orders/{order}', [OrderController::class, 'show'])
            ->middleware('role:cashier,kitchen');

        // Buat pesanan: kasir & pelayan (POS dari meja).
        Route::post('/orders', [OrderController::class, 'store'])
            ->middleware('role:cashier,waiter');

        // Ubah status pesanan/item: kasir & dapur.
        Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus'])
            ->middleware('role:cashier,kitchen');
        Route::patch('/order-items/{item}/status', [OrderController::class, 'updateItemStatus'])
            ->middleware('role:cashier,kitchen');

        // Pembayaran & Struk Kasir — admin & kasir
        Route::middleware('role:cashier')->group(function () {
            Route::post('/orders/{order}/pay', [PaymentController::class, 'store']);
            Route::get('/orders/{order}/receipt', [PaymentController::class, 'receipt']);
        });

        // Kelola Pengguna — hanya admin
        Route::middleware('role:admin')->group(function () {
            Route::get('/users', [UserController::class, 'index']);
            Route::post('/users', [UserController::class, 'store']);
            Route::get('/users/{user}', [UserController::class, 'show']);
            Route::put('/users/{user}', [UserController::class, 'update']);
            Route::patch('/users/{user}/toggle-status', [UserController::class, 'toggleStatus']);
            Route::delete('/users/{user}', [UserController::class, 'destroy']);
        });
    });
});
