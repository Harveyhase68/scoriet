<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Per-(FormWindow × SchemaTable) tab instance.
 *
 * Created by auto-place when a form template declares a tab_container element
 * whose max_fields is exceeded by the table's field count, or added manually
 * by the user from the Layout designer. tab_label / tab_labels are editable
 * in the designer per language.
 *
 * See the create_form_layout_tabs_table migration for the data-model rationale
 * (why tabs live here and not in form_elements).
 */
class FormLayoutTab extends Model
{
    protected $table = 'form_layout_tabs';

    protected $fillable = [
        'form_window_id',
        'schema_table_id',
        'tab_container_element_id',
        'sort_order',
        'tab_label',
        'tab_labels',
    ];

    protected $casts = [
        'form_window_id' => 'integer',
        'schema_table_id' => 'integer',
        'tab_container_element_id' => 'integer',
        'sort_order' => 'integer',
        'tab_labels' => 'array',
    ];

    public function formWindow(): BelongsTo
    {
        return $this->belongsTo(FormWindow::class);
    }

    public function schemaTable(): BelongsTo
    {
        return $this->belongsTo(SchemaTable::class);
    }

    public function tabContainerElement(): BelongsTo
    {
        return $this->belongsTo(FormElement::class, 'tab_container_element_id');
    }

    /**
     * Field placements assigned to this tab.
     */
    public function placements(): HasMany
    {
        return $this->hasMany(FormItemPlacement::class, 'tab_panel_id');
    }

    /**
     * Resolve the label for a given language, falling back to the default
     * tab_label string, then to "Tab {n}" if both are empty.
     */
    public function labelFor(string $language): string
    {
        $perLang = $this->tab_labels[$language] ?? null;
        if (is_string($perLang) && $perLang !== '') {
            return $perLang;
        }
        if (is_string($this->tab_label) && $this->tab_label !== '') {
            return $this->tab_label;
        }
        return 'Tab ' . ($this->sort_order + 1);
    }
}
