<?php

// app/Models/SchemaTable.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchemaTable extends Model
{
    protected $fillable = [
        'schema_version_id',
        'table_name',
    ];

    public function schemaVersion(): BelongsTo
    {
        return $this->belongsTo(SchemaVersion::class);
    }

    public function fields(): HasMany
    {
        return $this->hasMany(SchemaField::class, 'table_id');
    }

    public function constraints(): HasMany
    {
        return $this->hasMany(SchemaConstraint::class, 'table_id');
    }
}
