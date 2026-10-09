<?php

namespace Database\Seeders;

use App\Models\CafeTable;
use App\Models\Category;
use App\Models\Menu;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Akun Pengguna berdasarkan Peran (RBAC)
        $users = [
            [
                'name' => 'Manager Admin',
                'email' => 'admin@cafe.com',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'is_active' => true,
            ],
            [
                'name' => 'Budi Kasir',
                'email' => 'kasir@cafe.com',
                'password' => Hash::make('password123'),
                'role' => 'cashier',
                'is_active' => true,
            ],
            [
                'name' => 'Chef Barista',
                'email' => 'dapur@cafe.com',
                'password' => Hash::make('password123'),
                'role' => 'kitchen',
                'is_active' => true,
            ],
            [
                'name' => 'Siti Waiter',
                'email' => 'pelayan@cafe.com',
                'password' => Hash::make('password123'),
                'role' => 'waiter',
                'is_active' => true,
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(['email' => $user['email']], $user);
        }

        // 2. Meja Cafe
        $tables = [
            ['table_number' => 'Meja 01', 'capacity' => 2, 'status' => 'available'],
            ['table_number' => 'Meja 02', 'capacity' => 2, 'status' => 'available'],
            ['table_number' => 'Meja 03', 'capacity' => 4, 'status' => 'available'],
            ['table_number' => 'Meja 04', 'capacity' => 4, 'status' => 'available'],
            ['table_number' => 'Meja 05', 'capacity' => 6, 'status' => 'available'],
            ['table_number' => 'Meja 06', 'capacity' => 6, 'status' => 'available'],
            ['table_number' => 'Meja VIP 1', 'capacity' => 8, 'status' => 'available'],
            ['table_number' => 'Outdoor 01', 'capacity' => 4, 'status' => 'available'],
        ];

        foreach ($tables as $t) {
            CafeTable::updateOrCreate(['table_number' => $t['table_number']], $t);
        }

        // 3. Kategori Menu
        $coffee = Category::updateOrCreate(
            ['slug' => 'coffee'],
            ['name' => 'Coffee Series', 'icon' => 'coffee', 'is_active' => true]
        );

        $nonCoffee = Category::updateOrCreate(
            ['slug' => 'non-coffee'],
            ['name' => 'Non-Coffee', 'icon' => 'cup-soda', 'is_active' => true]
        );

        $mainCourse = Category::updateOrCreate(
            ['slug' => 'main-course'],
            ['name' => 'Main Course', 'icon' => 'utensils', 'is_active' => true]
        );

        $snacks = Category::updateOrCreate(
            ['slug' => 'snacks'],
            ['name' => 'Snacks & Pastry', 'icon' => 'cookie', 'is_active' => true]
        );

        // 4. Menu Makanan & Minuman
        $menus = [
            // Kopi
            [
                'category_id' => $coffee->id,
                'name' => 'Espresso Single',
                'slug' => 'espresso-single',
                'description' => 'Single shot ekstrak biji kopi arabika pilihan dengan crema tebal.',
                'price' => 18000,
                'cost_price' => 7000,
                'is_available' => true,
            ],
            [
                'category_id' => $coffee->id,
                'name' => 'Iced Americano',
                'slug' => 'iced-americano',
                'description' => 'Espresso dipadu dengan air dingin dan es batu segar.',
                'price' => 22000,
                'cost_price' => 8000,
                'is_available' => true,
            ],
            [
                'category_id' => $coffee->id,
                'name' => 'Caramel Macchiato',
                'slug' => 'caramel-macchiato',
                'description' => 'Espresso, susu segar steamed, vanilla syrup dan saus karamel lezat.',
                'price' => 28000,
                'cost_price' => 12000,
                'is_available' => true,
            ],
            [
                'category_id' => $coffee->id,
                'name' => 'Kopi Susu Gula Aren',
                'slug' => 'kopi-susu-gula-aren',
                'description' => 'Signature kopi susu dengan gula aren organik dan creamy milk.',
                'price' => 24000,
                'cost_price' => 9000,
                'is_available' => true,
            ],
            // Non Coffee
            [
                'category_id' => $nonCoffee->id,
                'name' => 'Matcha Latte',
                'slug' => 'matcha-latte',
                'description' => 'Bubuk matcha murni dari Uji Jepang dipadukan dengan fresh milk.',
                'price' => 27000,
                'cost_price' => 11000,
                'is_available' => true,
            ],
            [
                'category_id' => $nonCoffee->id,
                'name' => 'Signature Chocolate',
                'slug' => 'signature-chocolate',
                'description' => 'Cokelat Belgia pekat dengan racikan susu lembut.',
                'price' => 26000,
                'cost_price' => 10000,
                'is_available' => true,
            ],
            // Main Course
            [
                'category_id' => $mainCourse->id,
                'name' => 'Nasi Goreng Kampung Spesial',
                'slug' => 'nasi-goreng-kampung-spesial',
                'description' => 'Nasi goreng bumbu rempah dengan suwiran ayam, telur mata sapi, dan kerupuk.',
                'price' => 32000,
                'cost_price' => 14000,
                'is_available' => true,
            ],
            [
                'category_id' => $mainCourse->id,
                'name' => 'Spaghetti Carbonara',
                'slug' => 'spaghetti-carbonara',
                'description' => 'Pasta spaghetti dengan saus krim gurih, smoked beef, dan keju parmesan.',
                'price' => 38000,
                'cost_price' => 17000,
                'is_available' => true,
            ],
            // Snacks
            [
                'category_id' => $snacks->id,
                'name' => 'Crispy French Fries',
                'slug' => 'crispy-french-fries',
                'description' => 'Kentang goreng renyah disajikan dengan saus sambal dan mayones.',
                'price' => 20000,
                'cost_price' => 8000,
                'is_available' => true,
            ],
            [
                'category_id' => $snacks->id,
                'name' => 'Butter Croissant',
                'slug' => 'butter-croissant',
                'description' => 'Pastry renyah berlapis dengan aroma mentega Perancis otentik.',
                'price' => 22000,
                'cost_price' => 9000,
                'is_available' => true,
            ],
        ];

        foreach ($menus as $menu) {
            Menu::updateOrCreate(['slug' => $menu['slug']], $menu);
        }
    }
}
