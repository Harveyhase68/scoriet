<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $table = '{:filename:}';
    protected $primaryKey = '{:fileprimarykey:}';
    public $timestamps = false;
{:if hasblob:}
    protected $hidden = [
{:for nmaxitems:}
{:if item.isbinaryblob:}
        '{:item.name:}',
{:endif:}
{:endfor:}        
    ];{:endif:}

    protected $fillable = [
{:for nmaxitems:}
        '{:item.name:}',
{:endfor:}
    ];

    protected function casts(): array
    {
        return [
{:for nmaxitems:}
{:switch item.laraveltype:}
{:case 'integer':}
            '{:item.name:}' => 'integer',
{:case 'boolean':}
            '{:item.name:}' => 'boolean',
{:case 'datetime':}
            '{:item.name:}' => 'datetime',
{:case 'date':}
            '{:item.name:}' => 'date',
{:endswitch:}
{:endfor:}
        ];
    }

{:for nmaxforeignkeys:}
    public function {:foreign.referencedtablecamelcase:}(): BelongsTo
    {
        return $this->belongsTo({:foreign.referencedtablepascalcase:}::class, '{:foreign.name:}', '{:foreign.referencedcolumn:}');
    }
{:endfor:}

    public function scopeOrdered($query)
    {
        return $query->orderBy('{:fileprimarykey:}');
    }
}