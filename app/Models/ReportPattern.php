<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportPattern extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'creator_user_id',
        'visibility',
        'cloned_from_id',
        'is_active',
    ];

    protected $casts = [
        // See note on Project::$casts re: BIGINT-as-string from MariaDB/PDO.
        'creator_user_id' => 'integer',
        'cloned_from_id' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Default-Container fuer neue Report Pattern Forms
     * Positionen in mm, basierend auf A4 (210x297) mit 15mm Raendern
     * Druckbereich: x=15, y=15, width=180, height=267
     */
    public const DEFAULT_FORM_ELEMENTS = [
        'report_single' => [
            ['element_type' => 'container', 'x_position' => 0, 'y_position' => 0, 'width' => 180, 'height' => 267, 'label' => 'Detail'],
        ],
        'report_list' => [
            ['element_type' => 'header_section', 'x_position' => 0, 'y_position' => 0, 'width' => 180, 'height' => 30, 'label' => 'Header'],
            ['element_type' => 'detail_section', 'x_position' => 0, 'y_position' => 30, 'width' => 180, 'height' => 207, 'label' => 'Detail'],
            ['element_type' => 'footer_section', 'x_position' => 0, 'y_position' => 237, 'width' => 180, 'height' => 30, 'label' => 'Footer'],
        ],
    ];

    // ========== RELATIONSHIPS ==========

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_user_id');
    }

    public function clonedFrom(): BelongsTo
    {
        return $this->belongsTo(ReportPattern::class, 'cloned_from_id');
    }

    public function forms(): HasMany
    {
        return $this->hasMany(ReportPatternForm::class)->orderBy('sort_order');
    }

    // ========== SCOPES ==========

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePublic($query)
    {
        return $query->where('visibility', 'public');
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('creator_user_id', $userId);
    }

    public function scopeAccessibleBy($query, int $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('creator_user_id', $userId)
              ->orWhere('visibility', 'public')
              ->orWhere('visibility', 'system');
        });
    }

    // ========== METHODS ==========

    public static function boot()
    {
        parent::boot();

        static::created(function (ReportPattern $pattern) {
            $pattern->createDefaultForms();
        });
    }

    /**
     * Erstellt 2 Standard-Forms (report_single + report_list) mit Default-Containern
     */
    public function createDefaultForms(): void
    {
        $formTypes = ['report_single', 'report_list'];

        foreach ($formTypes as $index => $type) {
            $formData = [
                'form_type' => $type,
                'paper_size' => 'A4',
                'paper_orientation' => 'portrait',
                'paper_unit' => 'mm',
                'margin_top' => 15.00,
                'margin_right' => 15.00,
                'margin_bottom' => 15.00,
                'margin_left' => 15.00,
                'sort_order' => $index,
            ];

            if ($type === 'report_list') {
                $formData['row_height'] = 8.00;
                $formData['max_columns'] = 5;
                $formData['header_height'] = 30.00;
                $formData['footer_height'] = 30.00;
            }

            $form = $this->forms()->create($formData);

            // Default-Elemente erstellen
            $elements = self::DEFAULT_FORM_ELEMENTS[$type] ?? [];
            $detailSectionId = null;
            foreach ($elements as $elementIndex => $element) {
                $created = $form->elements()->create(array_merge($element, [
                    'sort_order' => $elementIndex,
                    'container_columns' => 1,
                    'container_gap' => 2.00,
                    'is_visible' => true,
                ]));
                if ($element['element_type'] === 'detail_section') {
                    $detailSectionId = $created->id;
                }
            }

            // For report_list: auto-create table_header linked to detail_section
            if ($type === 'report_list' && $detailSectionId) {
                $form->elements()->create([
                    'element_type' => 'table_header',
                    'x_position' => 0,
                    'y_position' => 15, // Just above detail_section (at y=30), header is 15mm
                    'width' => 180,
                    'height' => 15,
                    'linked_element_id' => $detailSectionId,
                    'label' => 'Table Header',
                    'container_columns' => 1,
                    'container_gap' => 2.00,
                    'sort_order' => count($elements),
                    'is_visible' => true,
                ]);
            }
        }
    }

    /**
     * Report Pattern als Array fuer GTree Template Engine
     */
    public function toGTreeArray(): array
    {
        $forms = $this->forms->map(fn($f) => $f->toGTreeArray())->toArray();

        $result = [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'visibility' => $this->visibility,
            'forms' => $forms,
            'nmaxforms' => count($forms),
        ];

        // Direkter Zugriff nach Typ: report_pattern.report_single, report_pattern.report_list
        foreach ($forms as $form) {
            $type = $form['type'];
            if (!isset($result[$type])) {
                $result[$type] = $form;
            }
        }

        return $result;
    }

    /**
     * Deep-Clone fuer einen User
     */
    public function cloneForUser(int $userId, ?string $newName = null): ReportPattern
    {
        $clone = $this->replicate();
        $clone->name = $newName ?? $this->name . ' (Kopie)';
        $clone->creator_user_id = $userId;
        $clone->cloned_from_id = $this->id;
        $clone->visibility = 'private';

        // Boot-Event muss uebersprungen werden, da wir Forms manuell klonen
        $clone->saveQuietly();

        // Forms klonen
        foreach ($this->forms()->with('elements.layoutElements')->get() as $form) {
            $formClone = $form->replicate();
            $formClone->report_pattern_id = $clone->id;
            $formClone->save();

            // Pattern Elements klonen
            $elementIdMap = [];
            foreach ($form->elements as $element) {
                $elementClone = $element->replicate();
                $elementClone->report_pattern_form_id = $formClone->id;
                $elementClone->save();
                $elementIdMap[$element->id] = $elementClone->id;
            }

            // Layout Elements klonen
            foreach ($form->layoutElements as $layoutElement) {
                $layoutClone = $layoutElement->replicate();
                $layoutClone->report_pattern_form_id = $formClone->id;
                // Container-Referenz auf geklontes Element umbiegen
                if ($layoutElement->container_element_id && isset($elementIdMap[$layoutElement->container_element_id])) {
                    $layoutClone->container_element_id = $elementIdMap[$layoutElement->container_element_id];
                }
                $layoutClone->save();
            }
        }

        return $clone;
    }
}
