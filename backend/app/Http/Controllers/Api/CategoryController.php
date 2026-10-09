<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::withCount('menus')->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(4);

        $category = Category::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil ditambahkan',
            'data' => $category,
        ], 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $category->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil diperbarui',
            'data' => $category,
        ]);
    }

    public function destroy(Category $category): JsonResponse
    {
        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil dihapus',
        ]);
    }
}
