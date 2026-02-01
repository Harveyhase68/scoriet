<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    protected $fillable = [
        'slug',
        'locale',
        'title',
        'content',
        'is_active',
        'popup_on_landingpage',
        'popup_on_app',
        'popup_priority',
        'popup_version',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'popup_on_landingpage' => 'boolean',
        'popup_on_app' => 'boolean',
        'popup_priority' => 'integer',
        'popup_version' => 'integer',
    ];
}
