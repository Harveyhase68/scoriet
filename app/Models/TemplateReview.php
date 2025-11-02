<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplateReview extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'template_reviews';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'template_id',
        'reviewer_user_id',
        'vote',
        'comment',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'vote' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the template that was reviewed.
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    /**
     * Get the user who made the review.
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_user_id');
    }
}
