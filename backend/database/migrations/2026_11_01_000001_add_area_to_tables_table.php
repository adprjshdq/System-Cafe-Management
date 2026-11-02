<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambahkan area meja (indoor/outdoor) agar denah bisa dipisahkan.
     */
    public function up(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->enum('area', ['indoor', 'outdoor'])->default('indoor')->after('capacity');
        });

        // Data lama: meja dengan nama berawalan "Outdoor" otomatis masuk area outdoor.
        DB::table('tables')
            ->whereRaw('LOWER(table_number) LIKE ?', ['outdoor%'])
            ->update(['area' => 'outdoor']);
    }

    public function down(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->dropColumn('area');
        });
    }
};
