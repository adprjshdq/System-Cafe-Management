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
            'image_base64' => 'nullable|string',
        ]);

        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);
        $validated['cost_price'] = $validated['cost_price'] ?? 0;
        $validated['is_available'] = $request->boolean('is_available', true);

        if ($request->filled('image_base64')) {
            $imagePath = $this->storeBase64Image((string) $validated['image_base64']);

            if (! $imagePath) {
                return $this->invalidImageResponse();
            }

            $validated['image_path'] = $imagePath;
        } elseif ($request->hasFile('image')) {
            $path = $request->file('image')->store('menus', 'public');
            $validated['image_path'] = '/storage/' . $path;
        }

        unset($validated['image'], $validated['image_base64']);

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
            'image_base64' => 'nullable|string',
        ]);

        if ($request->filled('image_base64')) {
            $imagePath = $this->storeBase64Image((string) $validated['image_base64']);

            if (! $imagePath) {
                return $this->invalidImageResponse();
            }

            $this->deleteStoredImage($menu);
            $validated['image_path'] = $imagePath;
        } elseif ($request->hasFile('image')) {
            $this->deleteStoredImage($menu);
            $path = $request->file('image')->store('menus', 'public');
            $validated['image_path'] = '/storage/' . $path;
        }

        unset($validated['image'], $validated['image_base64']);

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
        $this->deleteStoredImage($menu);

        $menu->delete();

        return response()->json([
            'success' => true,
            'message' => 'Menu berhasil dihapus',
        ]);
    }

    private function storeBase64Image(string $dataUrl): ?string
    {
        if (! preg_match('/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s', $dataUrl, $matches)) {
            return null;
        }

        $binary = base64_decode($matches[2], true);

        if ($binary === false || $binary === '' || strlen($binary) > 2048 * 1024) {
            return null;
        }

        $info = @getimagesizefromstring($binary);
        $mime = $info['mime'] ?? null;
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];

        if (! $mime || ! isset($extensions[$mime])) {
            return null;
        }

        $path = 'menus/' . Str::uuid() . '.' . $extensions[$mime];

        if (! Storage::disk('public')->put($path, $binary)) {
            return null;
        }

        return '/storage/' . $path;
    }

    private function deleteStoredImage(Menu $menu): void
    {
        if (! $menu->image_path) {
            return;
        }

        $path = str_replace('/storage/', '', $menu->image_path);

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    private function invalidImageResponse(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Foto tidak valid. Gunakan JPG, PNG, atau WEBP maksimal 2MB.',
            'errors' => [
                'image' => ['Foto tidak valid. Gunakan JPG, PNG, atau WEBP maksimal 2MB.'],
            ],
        ], 422);
    }
}
