<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'amount_paid',
        'change_amount',
        'payment_method',
        'payment_status',
        'reference_no',
        'paid_at',
    ];

    protected $casts = [
        'amount_paid' => 'decimal:2',
        'change_amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
