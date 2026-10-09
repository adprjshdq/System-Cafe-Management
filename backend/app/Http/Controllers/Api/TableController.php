<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CafeTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TableController extends Controller
{
    public function index(): JsonResponse
    {
        $tables = CafeTable::with(['orders' => function ($q) {
            $q->whereIn('status', ['pending', 'processing', 'ready'])->latest();
        }])->get();

        return response()->json([
            'success' => true,
            'data' => $tables,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'table_number' => 'required|string|max:20|unique:tables,table_number',
            'capacity' => 'required|integer|min:1',
            'status' => 'in:available,occupied,reserved',
        ]);

        $table = CafeTable::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Meja berhasil ditambahkan',
            'data' => $table,
        ], 201);
    }

    public function update(Request $request, CafeTable $table): JsonResponse
    {
        $validated = $request->validate([
            'table_number' => 'required|string|max:20|unique:tables,table_number,' . $table->id,
            'capacity' => 'required|integer|min:1',
            'status' => 'in:available,occupied,reserved',
        ]);

        $table->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data meja berhasil diperbarui',
            'data' => $table,
        ]);
    }

    public function updateStatus(Request $request, CafeTable $table): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:available,occupied,reserved',
        ]);

        $table->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Status meja diperbarui',
            'data' => $table,
        ]);
    }

    public function destroy(CafeTable $table): JsonResponse
    {
        $table->delete();

        return response()->json([
            'success' => true,
            'message' => 'Meja berhasil dihapus',
        ]);
    }
}
