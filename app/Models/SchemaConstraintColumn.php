<?php
// app/Models/SchemaConstraintColumn.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchemaConstraintColumn extends Model
{
    protected $fillable = [
        'constraint_id',
        'field_id',
        'column_order'
    ];

    public function constraint(): BelongsTo
    {
        return $this->belongsTo(SchemaConstraint::class, 'constraint_id');
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(SchemaField::class, 'field_id');
    }
}