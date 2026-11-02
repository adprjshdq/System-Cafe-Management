<?php

namespace Tests\Feature;

use App\Models\CafeTable;
use App\Models\Category;
use App\Models\Menu;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        return User::factory()->create([
            'role' => $role,
            'is_active' => true,
        ]);
    }

    private function makeMenu(): Menu
    {
        $category = Category::create([
            'name' => 'QA Category',
            'slug' => 'qa-category-' . uniqid(),
            'is_active' => true,
        ]);

        return Menu::create([
            'category_id' => $category->id,
            'name' => 'QA Coffee',
            'slug' => 'qa-coffee-' . uniqid(),
            'price' => 20000,
            'cost_price' => 5000,
            'is_available' => true,
            'stock' => 10,
        ]);
    }

    private function makeOrder(): Order
    {
        return Order::create([
            'order_number' => 'QA-' . uniqid(),
            'customer_name' => 'Tamu QA',
            'order_type' => 'dine_in',
            'status' => 'pending',
            'subtotal' => 20000,
            'tax_amount' => 2000,
            'total_amount' => 22000,
        ]);
    }

    public function test_guest_cannot_access_protected_endpoints(): void
    {
        $this->getJson('/api/v1/users')->assertUnauthorized();
        $this->postJson('/api/v1/tables', [
            'table_number' => 'Meja Guest',
            'capacity' => 2,
        ])->assertUnauthorized();
    }

    public function test_dashboard_stats_is_admin_only(): void
    {
        $this->actingAs($this->userWithRole('admin'), 'sanctum')
            ->getJson('/api/v1/dashboard/stats')
            ->assertOk();

        foreach (['cashier', 'kitchen', 'waiter'] as $role) {
            $this->actingAs($this->userWithRole($role), 'sanctum')
                ->getJson('/api/v1/dashboard/stats')
                ->assertForbidden();
        }
    }

    public function test_only_admin_can_manage_users(): void
    {
        $this->actingAs($this->userWithRole('admin'), 'sanctum')
            ->getJson('/api/v1/users')
            ->assertOk();

        foreach (['cashier', 'kitchen', 'waiter'] as $role) {
            $this->actingAs($this->userWithRole($role), 'sanctum')
                ->getJson('/api/v1/users')
                ->assertForbidden();
        }
    }

    public function test_admin_and_cashier_can_manage_tables_but_waiter_cannot(): void
    {
        $this->actingAs($this->userWithRole('cashier'), 'sanctum')
            ->postJson('/api/v1/tables', [
                'table_number' => 'Meja Kasir',
                'capacity' => 4,
                'area' => 'indoor',
            ])
            ->assertCreated();

        $this->actingAs($this->userWithRole('admin'), 'sanctum')
            ->postJson('/api/v1/tables', [
                'table_number' => 'Meja Admin',
                'capacity' => 2,
            ])
            ->assertCreated();

        foreach (['waiter', 'kitchen'] as $role) {
            $this->actingAs($this->userWithRole($role), 'sanctum')
                ->postJson('/api/v1/tables', [
                    'table_number' => 'Meja ' . $role,
                    'capacity' => 2,
                ])
                ->assertForbidden();
        }
    }

    public function test_only_admin_can_manage_menu_catalog(): void
    {
        $this->actingAs($this->userWithRole('admin'), 'sanctum')
            ->postJson('/api/v1/categories', ['name' => 'QA Admin Category'])
            ->assertCreated();

        foreach (['cashier', 'kitchen', 'waiter'] as $role) {
            $this->actingAs($this->userWithRole($role), 'sanctum')
                ->postJson('/api/v1/categories', ['name' => 'QA ' . $role])
                ->assertForbidden();
        }
    }

    public function test_kitchen_can_read_orders_but_cannot_create_them(): void
    {
        $kitchen = $this->userWithRole('kitchen');
        $menu = $this->makeMenu();

        $this->actingAs($kitchen, 'sanctum')
            ->getJson('/api/v1/orders')
            ->assertOk();

        $this->actingAs($kitchen, 'sanctum')
            ->postJson('/api/v1/orders', [
                'order_type' => 'takeaway',
                'items' => [['menu_id' => $menu->id, 'quantity' => 1]],
            ])
            ->assertForbidden();
    }

    public function test_waiter_can_create_dine_in_order_but_cannot_view_order_history(): void
    {
        $menu = $this->makeMenu();
        $table = CafeTable::create([
            'table_number' => 'Meja Waiter',
            'capacity' => 4,
            'area' => 'indoor',
            'status' => 'available',
        ]);

        $this->actingAs($this->userWithRole('waiter'), 'sanctum')
            ->postJson('/api/v1/orders', [
                'table_id' => $table->id,
                'customer_name' => 'Tamu Waiter',
                'order_type' => 'dine_in',
                'items' => [['menu_id' => $menu->id, 'quantity' => 1]],
            ])
            ->assertCreated();

        $this->assertDatabaseHas('tables', [
            'id' => $table->id,
            'status' => 'occupied',
        ]);

        $this->actingAs($this->userWithRole('waiter'), 'sanctum')
            ->getJson('/api/v1/orders')
            ->assertForbidden();
    }

    public function test_waiter_must_choose_a_table_and_use_dine_in(): void
    {
        $waiter = $this->userWithRole('waiter');
        $menu = $this->makeMenu();
        $table = CafeTable::create([
            'table_number' => 'Meja Waiter 2',
            'capacity' => 2,
            'area' => 'indoor',
            'status' => 'available',
        ]);

        $this->actingAs($waiter, 'sanctum')
            ->postJson('/api/v1/orders', [
                'order_type' => 'dine_in',
                'items' => [['menu_id' => $menu->id, 'quantity' => 1]],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('table_id');

        $this->actingAs($waiter, 'sanctum')
            ->postJson('/api/v1/orders', [
                'table_id' => $table->id,
                'order_type' => 'takeaway',
                'items' => [['menu_id' => $menu->id, 'quantity' => 1]],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('order_type');
    }

    public function test_waiter_cannot_attach_payment_to_order(): void
    {
        $menu = $this->makeMenu();
        $table = CafeTable::create([
            'table_number' => 'Meja Waiter 3',
            'capacity' => 2,
            'area' => 'indoor',
            'status' => 'available',
        ]);

        $this->actingAs($this->userWithRole('waiter'), 'sanctum')
            ->postJson('/api/v1/orders', [
                'table_id' => $table->id,
                'order_type' => 'dine_in',
                'items' => [['menu_id' => $menu->id, 'quantity' => 1]],
                'payment' => [
                    'method' => 'cash',
                    'amount_paid' => 50000,
                ],
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('payments', 0);
    }

    public function test_cashier_can_still_create_paid_order(): void
    {
        $menu = $this->makeMenu();

        $response = $this->actingAs($this->userWithRole('cashier'), 'sanctum')
            ->postJson('/api/v1/orders', [
                'order_type' => 'takeaway',
                'items' => [['menu_id' => $menu->id, 'quantity' => 1]],
                'payment' => [
                    'method' => 'cash',
                    'amount_paid' => 50000,
                ],
            ])
            ->assertCreated();

        $this->assertDatabaseHas('payments', [
            'order_id' => $response->json('data.id'),
        ]);
    }

    public function test_kitchen_can_update_order_status_but_cannot_process_payment(): void
    {
        $kitchen = $this->userWithRole('kitchen');
        $order = $this->makeOrder();

        $this->actingAs($kitchen, 'sanctum')
            ->patchJson("/api/v1/orders/{$order->id}/status", ['status' => 'processing'])
            ->assertOk();

        $this->actingAs($kitchen, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/pay", [
                'payment_method' => 'cash',
                'amount_paid' => 22000,
            ])
            ->assertForbidden();
    }

    public function test_waiter_cannot_process_payment_or_read_receipt(): void
    {
        $waiter = $this->userWithRole('waiter');
        $order = $this->makeOrder();

        $this->actingAs($waiter, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/pay", [
                'payment_method' => 'cash',
                'amount_paid' => 22000,
            ])
            ->assertForbidden();

        $this->actingAs($waiter, 'sanctum')
            ->getJson("/api/v1/orders/{$order->id}/receipt")
            ->assertForbidden();
    }

    public function test_cashier_can_process_payment(): void
    {
        $order = $this->makeOrder();

        $this->actingAs($this->userWithRole('cashier'), 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/pay", [
                'payment_method' => 'cash',
                'amount_paid' => 25000,
            ])
            ->assertOk();
    }
}
