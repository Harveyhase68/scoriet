<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchemaTranslation extends Model
{
    protected $fillable = [
        'item_name',
        'code',
        'translated_text',
        'description',
        'is_active',
        'created_by'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class, 'code', 'code');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForLanguage($query, string $languageCode)
    {
        return $query->where('code', $languageCode);
    }

    public function scopeForItem($query, string $itemName)
    {
        return $query->where('item_name', $itemName);
    }

    // Helper methods for common queries
    public static function getTranslation(string $itemName, string $languageCode): ?string
    {
        $translation = static::where('item_name', $itemName)
            ->where('code', $languageCode)
            ->where('is_active', true)
            ->first();

        return $translation?->translated_text;
    }

    public static function setTranslation(string $itemName, string $languageCode, string $translatedText, ?string $description = null): static
    {
        return static::updateOrCreate(
            [
                'item_name' => $itemName,
                'code' => $languageCode
            ],
            [
                'translated_text' => $translatedText,
                'description' => $description,
                'is_active' => true,
                'created_by' => auth()->id()
            ]
        );
    }

    // Get all translations for a specific item across all languages
    public static function getAllTranslationsForItem(string $itemName)
    {
        return static::with('language')
            ->where('item_name', $itemName)
            ->where('is_active', true)
            ->get()
            ->keyBy('code');
    }

    // Check if item is a table or field
    public function isTable(): bool
    {
        return !str_contains($this->item_name, '.');
    }

    public function isField(): bool
    {
        return str_contains($this->item_name, '.');
    }

    public function getTableName(): string
    {
        if ($this->isTable()) {
            return $this->item_name;
        }

        return explode('.', $this->item_name)[0];
    }

    public function getFieldName(): ?string
    {
        if ($this->isField()) {
            return explode('.', $this->item_name)[1];
        }

        return null;
    }
}