<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GenerationLog extends Model
{
    protected $fillable = [
        'project_id',
        'template_id',
        'schema_ids',
        'template_version',
        'files_version_sum',
        'schema_version',
        'hash_timestamp',
        'hash_full',
        'hash_short',
        'filename',
    ];

    protected $casts = [
        'schema_ids'        => 'array',
        'template_version'  => 'integer',
        'files_version_sum' => 'integer',
        'schema_version'    => 'integer',
        'hash_timestamp'    => 'integer',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function template()
    {
        return $this->belongsTo(Template::class);
    }
}
