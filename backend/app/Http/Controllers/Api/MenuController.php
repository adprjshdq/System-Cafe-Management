<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MenuController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Menu::with('category');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('available_only') && $request->boolean('available_only')) {
            $query->where('is_available', true);
        }

        $menus = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $menus,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'is_available' => 'nullable|boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);
        $validated['cost_price'] = $validated['cost_price'] ?? 0;
        $validated['is_available'] = $request->boolean('is_available', true);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('menus', 'public');
            $validated['image_path'] = '/storage/' . $path;
        }

        $menu = Menu::create($validated);
        $menu->load('category');

        return response()->json([
            'success' => true,
            'message' => 'Menu berhasil ditambahkan',
            'data' => $menu,
        ], 201);
    }

    public function show(Menu $menu): JsonResponse
    {
        $menu->load('category');

        return response()->json([
            'success' => true,
            'data' => $menu,
        ]);
    }

    public function update(Request $request, Menu $menu): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'is_available' => 'nullable|boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($menu->image_path && Storage::disk('public')->exists(str_replace('/storage/', '', $menu->image_path))) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $menu->image_path));
            }
            $path = $request->file('image')->store('menus', 'public');
            $validated['image_path'] = '/storage/' . $path;
        }

        $menu->update($validated);
        $menu->load('category');

        return response()->json([
            'success' => true,
            'message' => 'Menu berhasil diperbarui',
            'data' => $menu,
        ]);
    }

    public function toggleAvailability(Menu $menu): JsonResponse
    {
        $menu->update([
            'is_available' => ! $menu->is_available,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status ketersediaan menu berhasil diperbarui',
            'data' => $menu,
        ]);
    }

    public function destroy(Menu $menu): JsonResponse
    {
        if ($menu->image_path && Storage::disk('public')->exists(str_replace('/storage/', '', $menu->image_path))) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $menu->image_path));
        }

        $menu->delete();

        return response()->json([
            'success' => true,
            'message' => 'Menu berhasil dihapus',
        ]);
    }
}
