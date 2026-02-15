# GUI Update: Template Category Dropdown

## Was wurde geändert?

### Backend (✅ Fertig)

1. **Migration:**
   - `templates.category` von ENUM zu VARCHAR(100)
   - Default: "Web"
   - Beliebige Werte erlaubt

2. **Config (`config/templates.php`):**
   ```php
   'categories' => [
       'Web', 'Mobile', 'API', 'Desktop', 'Database',
       'E-Commerce', 'CMS', 'Dashboard', 'Fullstack',
       'Backend', 'Frontend', 'DevOps', 'Testing',
       'Documentation', 'Authentication', 'Payment',
       'Admin Panel', 'Landing Page', 'Portfolio', 'Blog',
   ],

   'languages' => [
       'PHP', 'JavaScript', 'TypeScript', 'Python', 'Java',
       'C#', 'Go', 'Rust', 'Ruby', 'Swift', 'Kotlin', 'Dart',
       'SQL', 'HTML', 'CSS', 'SCSS', 'Vue', 'React', 'Angular',
       'Laravel', 'Django', 'Spring', 'ASP.NET',
   ],
   ```

---

## GUI Anpassung (TODO)

### Datei: `resources/js/Components/Panels/TemplateManagementPanel.tsx`

**Vorher (vermutlich):**
```tsx
<select name="category">
  <option value="Web">Web</option>
  <option value="Mobile">Mobile</option>
  {/* ... hardcoded options */}
</select>
```

**Nachher (empfohlen):**
```tsx
// 1. Config vom Backend holen (einmalig beim Mount oder in Inertia Props)
const categories = usePage().props.templateCategories || [];
const languages = usePage().props.templateLanguages || [];

// 2. Autocomplete/Combobox statt Select verwenden
<Autocomplete
  freeSolo  // Wichtig: Erlaubt custom Eingaben!
  options={categories}
  value={template.category}
  onChange={(e, newValue) => setTemplate({...template, category: newValue})}
  renderInput={(params) => (
    <TextField
      {...params}
      label="Category"
      placeholder="Select or type custom category"
    />
  )}
/>

// ODER mit Ant Design (falls verwendet):
<AutoComplete
  options={categories.map(cat => ({ value: cat }))}
  value={template.category}
  onChange={(value) => setTemplate({...template, category: value})}
  placeholder="Select or type custom category"
  allowClear
/>
```

---

## Backend Props bereitstellen

### Option 1: Global in `HandleInertiaRequests.php`

```php
// app/Http/Middleware/HandleInertiaRequests.php

public function share(Request $request): array
{
    return [
        ...parent::share($request),
        'templateCategories' => config('templates.categories'),
        'templateLanguages' => config('templates.languages'),
    ];
}
```

### Option 2: Lokal im Controller

```php
// app/Http/Controllers/TemplateController.php

public function create()
{
    return Inertia::render('TemplateManagement', [
        'categories' => config('templates.categories'),
        'languages' => config('templates.languages'),
    ]);
}
```

---

## UX Vorschläge

### Variante A: Autocomplete mit Vorschlägen (EMPFOHLEN)
✅ User sieht Vorschläge
✅ Kann aber auch eigene eingeben
✅ Schnelles Tippen möglich

### Variante B: Select + "Custom" Option
```tsx
<select>
  <option value="">-- Select Category --</option>
  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
  <option value="__custom__">-- Custom Category --</option>
</select>

{category === '__custom__' && (
  <input
    type="text"
    placeholder="Enter custom category"
    onChange={(e) => setCategory(e.target.value)}
  />
)}
```

⚠️ Mehr Klicks, aber klarer für User

### Variante C: Input mit Datalist (HTML5)
```tsx
<input
  list="categories"
  name="category"
  placeholder="Type or select category"
/>
<datalist id="categories">
  {categories.map(cat => <option key={cat} value={cat} />)}
</datalist>
```

✅ Einfachste Lösung
✅ Keine zusätzliche Library
⚠️ Weniger Kontrolle über Styling

---

## Sprache (Language) gleich behandeln

Auch `language` sollte flexibel sein:
- Vorschläge aus `config('templates.languages')`
- Custom Eingabe erlaubt
- Gleiche Autocomplete-Komponente verwenden

---

## Testing

Nach GUI-Update testen:
1. ✅ Vorschlag aus Dropdown auswählen → speichern → laden
2. ✅ Custom Category eintippen → speichern → laden
3. ✅ Emoji-Test: "🚀 Rocket App" als Category → sollte funktionieren
4. ✅ Leer lassen → Default "Web" sollte gespeichert werden

---

## Migration für bestehende Templates (optional)

Falls alte Templates noch ENUM-Werte haben und normalisiert werden sollen:

```sql
-- Alle Kategorien zu Title Case normalisieren
UPDATE templates SET category = 'E-Commerce' WHERE category = 'E-Commerce';
UPDATE templates SET category = 'Admin Panel' WHERE category = 'Admin Panel';
-- etc.
```

Aber NICHT notwendig - VARCHAR akzeptiert alle Werte!

---

## Zusammenfassung

✅ **Backend:** Fertig (VARCHAR + Config)
⏳ **GUI:** Autocomplete-Komponente mit `freeSolo` implementieren
📋 **Props:** Config-Werte in Inertia Props bereitstellen

**Vorteile:**
- ✅ Maximale Flexibilität für User
- ✅ Trotzdem gute UX mit Vorschlägen
- ✅ Keine Migrations bei neuen Kategorien
- ✅ Konsistent mit `projects.name` Ansatz
