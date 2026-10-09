<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Kategori Menu
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('icon')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Meja Cafe
        Schema::create('tables', function (Blueprint $table) {
            $table->id();
            $table->string('table_number')->unique();
            $table->integer('capacity')->default(2);
            $table->enum('status', ['available', 'occupied', 'reserved'])->default('available');
            $table->timestamps();
        });

        // 3. Menu Makanan & Minuman
        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2);
            $table->decimal('cost_price', 12, 2)->default(0);
            $table->string('image_path')->nullable();
            $table->boolean('is_available')->default(true);
            $table->timestamps();
        });

        // 4. Pesanan (Orders)
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('table_id')->nullable()->constrained('tables')->nullOnDelete();
            $table->string('customer_name')->default('Guest');
            $table->enum('order_type', ['dine_in', 'takeaway'])->default('dine_in');
            $table->enum('status', ['pending', 'processing', 'ready', 'completed', 'cancelled'])->default('pending');
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 5. Rincian Item Pesanan (Order Items)
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('menu_id')->constrained('menus')->cascadeOnDelete();
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('subtotal', 12, 2);
            $table->string('notes')->nullable();
            $table->enum('item_status', ['pending', 'cooking', 'ready'])->default('pending');
            $table->timestamps();
        });

        // 6. Pembayaran (Payments)
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained('orders')->cascadeOnDelete();
            $table->decimal('amount_paid', 12, 2);
            $table->decimal('change_amount', 12, 2)->default(0);
            $table->enum('payment_method', ['cash', 'qris', 'transfer'])->default('cash');
            $table->enum('payment_status', ['pending', 'completed', 'failed'])->default('completed');
            $table->string('reference_no')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('menus');
        Schema::dropIfExists('tables');
        Schema::dropIfExists('categories');
    }
};
