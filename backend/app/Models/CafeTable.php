<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CafeTable extends Model
{
    use HasFactory;

    protected $table = 'tables';

    protected $fillable = [
        'table_number',
        'capacity',
        'status',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'table_id');
    }
}
