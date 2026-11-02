<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Batasi akses endpoint berdasarkan role staf.
     *
     * Admin selalu memiliki akses penuh. Role lain harus cocok dengan
     * salah satu role yang didaftarkan pada middleware, misalnya:
     * `->middleware('role:cashier')` atau `->middleware('role:cashier,kitchen')`.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if ($user && ($user->role === 'admin' || in_array($user->role, $roles, true))) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'Anda tidak memiliki akses ke fitur ini.',
        ], 403);
    }
}
