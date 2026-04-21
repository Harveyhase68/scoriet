// resources/js/Components/Panels/TranslationPrintModal.tsx
// Modal for printing schema translations (table/field names in multiple languages)
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useProject } from '@/contexts/ProjectContext';
import { useTheme } from '@/contexts/ThemeContext';

// ========== INTERFACES ==========

interface TranslationPrintModalProps {
  visible: boolean;
  onHide: () => void;
}

interface Language {
  id: number;
  code: string;
  name: string;
  native_name: string;
  // Optional — see app/Models/Language.php for the full row shape. Declared
  // here because the filter at line ~257 checks `l.is_active`.
  is_active?: boolean;
}

interface SchemaField {
  field_name: string;
  field_type: string;
}

interface SchemaTable {
  table_name: string;
  schema_name?: string;
  fields: SchemaField[];
}

interface TranslationEntry {
  item_name: string;
  code: string;
  translated_text: string;
}

interface PrintOptions {
  orientation: 'portrait' | 'landscape';
  sortBy: 'schema' | 'table';
  showFieldType: boolean;
  showEmptyRows: boolean;
}

// ========== HELPERS ==========

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';
  return { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` };
}

const esc = (s: string | undefined | null) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ========== HTML GENERATION ==========

function generateTranslationPrintHtml(
  tables: SchemaTable[],
  translations: Map<string, Map<string, string>>,
  selectedLangs: string[],
  options: PrintOptions,
  projectName: string,
): string {
  const today = new Date().toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const now = new Date().toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });

  const langColWidth = Math.max(80, Math.floor(600 / Math.max(1, selectedLangs.length)));

  // Sort tables
  const sortedTables = [...tables].sort((a, b) => {
    if (options.sortBy === 'schema') {
      const schemaCmp = (a.schema_name || '').localeCompare(b.schema_name || '');
      if (schemaCmp !== 0) return schemaCmp;
    }
    return a.table_name.localeCompare(b.table_name);
  });

  // Build table HTML sections
  const tablesHtml = sortedTables.map((table) => {
    // Table header translation
    const tableTranslations = selectedLangs.map(lang => {
      const t = translations.get(table.table_name)?.get(lang);
      return t || '';
    });

    const hasTableTranslation = tableTranslations.some(t => t.length > 0);

    // Field translations
    const fieldRows = table.fields.map(field => {
      const itemName = `${table.table_name}.${field.field_name}`;
      const fieldTranslations = selectedLangs.map(lang => {
        return translations.get(itemName)?.get(lang) || '';
      });
      const hasTranslation = fieldTranslations.some(t => t.length > 0);

      if (!options.showEmptyRows && !hasTranslation) return '';

      return `<tr>
        <td class="field-name">${esc(field.field_name)}</td>
        ${options.showFieldType ? `<td class="field-type">${esc(field.field_type)}</td>` : ''}
        ${fieldTranslations.map(t => `<td class="translation">${esc(t)}</td>`).join('')}
      </tr>`;
    }).filter(r => r.length > 0);

    if (!options.showEmptyRows && !hasTableTranslation && fieldRows.length === 0) return '';

    return `
      <div class="table-section">
        <div class="table-header">
          <span class="table-name">${esc(table.table_name)}</span>
          ${table.schema_name ? `<span class="schema-badge">${esc(table.schema_name)}</span>` : ''}
        </div>
        <table class="trans-table">
          <thead>
            <tr>
              <th class="col-item">Field</th>
              ${options.showFieldType ? '<th class="col-type">Type</th>' : ''}
              ${selectedLangs.map(l => `<th class="col-lang" style="width:${langColWidth}px">${l.toUpperCase()}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${hasTableTranslation || options.showEmptyRows ? `<tr class="table-row">
              <td class="field-name"><strong>${esc(table.table_name)}</strong> <span class="row-type">TABLE</span></td>
              ${options.showFieldType ? '<td class="field-type"></td>' : ''}
              ${tableTranslations.map(t => `<td class="translation table-trans">${esc(t)}</td>`).join('')}
            </tr>` : ''}
            ${fieldRows.join('')}
          </tbody>
        </table>
      </div>
    `;
  }).filter(s => s.length > 0);

  const totalTranslations = Array.from(translations.values()).reduce((sum, langMap) =>
    sum + Array.from(langMap.values()).filter(v => v.length > 0).length, 0);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Schema Translations - ${esc(projectName)}</title>
  <style>
    @page { size: ${options.orientation}; margin: 10mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10px; color: #1e293b; line-height: 1.3; }

    .doc-header { border-bottom: 3px solid #3b82f6; padding-bottom: 8px; margin-bottom: 12px; }
    .doc-header h1 { font-size: 18px; color: #1e293b; margin-bottom: 2px; }
    .doc-header .subtitle { font-size: 11px; color: #64748b; }
    .doc-header .meta { font-size: 9px; color: #94a3b8; margin-top: 3px; }

    .summary { margin-bottom: 12px; display: flex; gap: 12px; flex-wrap: wrap; }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 12px; text-align: center; }
    .summary-num { font-size: 18px; font-weight: 700; color: #3b82f6; }
    .summary-label { font-size: 8px; color: #64748b; text-transform: uppercase; }

    .table-section { margin-bottom: 12px; break-inside: avoid; }
    .table-header { background: #1e40af; padding: 4px 8px; border-radius: 3px 3px 0 0; display: flex; align-items: center; gap: 8px; }
    .table-name { color: #fff; font-weight: 700; font-size: 11px; }
    .schema-badge { color: rgba(255,255,255,0.7); font-size: 9px; background: rgba(255,255,255,0.15); padding: 1px 6px; border-radius: 3px; }

    .trans-table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; font-size: 9px; }
    .trans-table th { background: #f8fafc; text-align: left; padding: 3px 5px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 8px; text-transform: uppercase; }
    .trans-table td { padding: 2px 5px; border: 1px solid #e2e8f0; }
    .trans-table tr:nth-child(even) { background: #fafbfc; }

    .col-item { min-width: 120px; }
    .col-type { width: 80px; }
    .col-lang { }

    .field-name { font-weight: 500; color: #334155; }
    .field-type { color: #6366f1; font-family: 'Consolas', monospace; font-size: 8px; }
    .translation { color: #1e293b; }
    .table-trans { font-weight: 600; background: #fffbeb !important; }
    .table-row { background: #fffbeb !important; }
    .row-type { font-size: 7px; color: #92400e; background: #fef3c7; padding: 0 3px; border-radius: 2px; margin-left: 4px; }

    .doc-footer { margin-top: 16px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 8px; color: #94a3b8; text-align: center; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .table-section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <h1>Schema Translations</h1>
    <div class="subtitle">${esc(projectName)} · ${selectedLangs.map(l => l.toUpperCase()).join(', ')}</div>
    <div class="meta">Generated: ${today} ${now} · ${sortedTables.length} tables · ${selectedLangs.length} languages · ${totalTranslations} translations</div>
  </div>

  <div class="summary">
    <div class="summary-card"><div class="summary-num">${sortedTables.length}</div><div class="summary-label">Tables</div></div>
    <div class="summary-card"><div class="summary-num">${selectedLangs.length}</div><div class="summary-label">Languages</div></div>
    <div class="summary-card"><div class="summary-num">${totalTranslations}</div><div class="summary-label">Translations</div></div>
  </div>

  ${tablesHtml.join('\n')}

  <div class="doc-footer">
    Generated by Scoriet · ${esc(projectName)} · ${today}
  </div>
</body>
</html>`;
}

// ========== MAIN COMPONENT ==========

const TranslationPrintModal: React.FC<TranslationPrintModalProps> = ({ visible, onHide }) => {
  const { colors } = useTheme();
  const { selectedProject } = useProject();
  const previewRef = useRef<HTMLIFrameElement>(null);

  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [translations, setTranslations] = useState<Map<string, Map<string, string>>>(new Map());
  const [loading, setLoading] = useState(false);

  const [options, setOptions] = useState<PrintOptions>({
    orientation: 'landscape',
    sortBy: 'table',
    showFieldType: true,
    showEmptyRows: false,
  });

  // Load languages + schema structure
  useEffect(() => {
    if (!visible || !selectedProject) {
      if (!visible) {
        setTables([]);
        setTranslations(new Map());
        setSelectedLangs([]);
      }
      return;
    }

    const headers = getAuthHeaders();
    setLoading(true);

    const fetchData = async () => {
      try {
        // Parallel: languages + schema items
        const [langRes, itemsRes] = await Promise.all([
          fetch('/api/active-languages', { headers }),
          fetch(`/api/schema-available-items?project_id=${selectedProject.id}`, { headers }),
        ]);

        let activeLangs: Language[] = [];
        if (langRes.ok) {
          const d = await langRes.json();
          activeLangs = (Array.isArray(d) ? d : d.data || []).filter((l: Language) => l.is_active);
          setLanguages(activeLangs);

          // Auto-select project languages or all active
          const projectLangs = selectedProject.enabled_languages || [];
          const defaultSelection = projectLangs.length > 0
            ? activeLangs.filter(l => projectLangs.includes(l.code)).map(l => l.code)
            : activeLangs.map(l => l.code);
          setSelectedLangs(defaultSelection);
        }

        let allTables: SchemaTable[] = [];
        if (itemsRes.ok) {
          const d = await itemsRes.json();
          allTables = d.tables || [];
          setTables(allTables);
        }

        // Now load all translations for these items
        if (allTables.length > 0) {
          const transRes = await fetch('/api/schema-translations', { headers });
          if (transRes.ok) {
            const d = await transRes.json();
            const allTrans: TranslationEntry[] = d.data || (Array.isArray(d) ? d : []);
            const transMap = new Map<string, Map<string, string>>();
            for (const t of allTrans) {
              if (!t.translated_text) continue;
              if (!transMap.has(t.item_name)) transMap.set(t.item_name, new Map());
              transMap.get(t.item_name)!.set(t.code, t.translated_text);
            }
            setTranslations(transMap);
          }
        }
      } catch { /* ignore */ }
      setLoading(false);
    };

    fetchData();
  }, [visible, selectedProject]);

  // Generate preview HTML
  const previewHtml = useMemo(() => {
    if (tables.length === 0 || selectedLangs.length === 0) return '';
    return generateTranslationPrintHtml(
      tables, translations, selectedLangs, options,
      selectedProject?.name || '',
    );
  }, [tables, translations, selectedLangs, options, selectedProject]);

  // Update iframe preview
  useEffect(() => {
    const updateIframe = () => {
      if (previewRef.current && previewHtml) {
        const doc = previewRef.current.contentDocument;
        if (doc) { doc.open(); doc.write(previewHtml); doc.close(); return true; }
      }
      return false;
    };
    if (!updateIframe()) {
      const timer = setTimeout(updateIframe, 100);
      return () => clearTimeout(timer);
    }
  }, [previewHtml]);

  // Print
  const handlePrint = useCallback(() => {
    if (!previewHtml) return;
    const w = window.open('', '_blank');
    if (w) { w.document.write(previewHtml); w.document.close(); w.onload = () => { w.print(); }; }
  }, [previewHtml]);

  const toggleLang = (code: string) => {
    setSelectedLangs(prev =>
      prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code]
    );
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Schema Translations"
      modal
      maximizable
      style={{ width: '90vw', maxWidth: 1300, height: '85vh' }}
      contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
    >
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: `1px solid ${colors.borderPrimary}`, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{selectedProject?.name || ''}</span>
        {tables.length > 0 && (
          <span style={{ fontSize: 11, color: colors.textMuted }}>{tables.length} tables · {selectedLangs.length} languages</span>
        )}
        <div style={{ flex: 1 }} />
        <Button icon="pi pi-print" label="Print / PDF" className="p-button-sm" onClick={handlePrint} disabled={!previewHtml || loading} style={{ backgroundColor: '#3b82f6', border: 'none' }} />
      </div>

      {/* Main: Options + Preview */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Options */}
        <div style={{ width: 220, flexShrink: 0, padding: '12px 14px', borderRight: `1px solid ${colors.borderPrimary}`, overflowY: 'auto', fontSize: 12 }}>

          {/* Orientation */}
          <div style={{ fontWeight: 600, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>Page</div>
          <Dropdown
            value={options.orientation}
            options={[{ label: 'Landscape', value: 'landscape' }, { label: 'Portrait', value: 'portrait' }]}
            onChange={e => setOptions(p => ({ ...p, orientation: e.value }))}
            style={{ width: '100%', fontSize: 12, marginBottom: 10 }}
          />

          {/* Sort */}
          <div style={{ fontWeight: 600, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>Sort</div>
          <Dropdown
            value={options.sortBy}
            options={[{ label: 'By Table Name', value: 'table' }, { label: 'By Schema, then Table', value: 'schema' }]}
            onChange={e => setOptions(p => ({ ...p, sortBy: e.value }))}
            style={{ width: '100%', fontSize: 12, marginBottom: 10 }}
          />

          {/* Options */}
          <div style={{ fontWeight: 600, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>Options</div>
          {([
            ['showFieldType', 'Show Field Types'],
            ['showEmptyRows', 'Show Untranslated'],
          ] as [keyof PrintOptions, string][]).map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', cursor: 'pointer' }} onClick={() => setOptions(p => ({ ...p, [key]: !p[key] }))}>
              <Checkbox checked={!!options[key]} onChange={() => setOptions(p => ({ ...p, [key]: !p[key] }))} />
              <span style={{ color: colors.textPrimary }}>{label}</span>
            </div>
          ))}

          {/* Languages */}
          <div style={{ fontWeight: 600, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', marginTop: 12, marginBottom: 6 }}>
            Languages ({selectedLangs.length}/{languages.length})
          </div>
          {languages.map(lang => (
            <div key={lang.code} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', cursor: 'pointer' }} onClick={() => toggleLang(lang.code)}>
              <Checkbox checked={selectedLangs.includes(lang.code)} onChange={() => toggleLang(lang.code)} />
              <span style={{ color: colors.textPrimary }}><strong>{lang.code.toUpperCase()}</strong> {lang.name}</span>
            </div>
          ))}
        </div>

        {/* Right: Preview */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10 }}>
              <ProgressSpinner style={{ width: 24, height: 24 }} strokeWidth="4" />
              <span style={{ color: colors.textMuted }}>Loading translations...</span>
            </div>
          ) : tables.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: colors.textMuted }}>
              No schema data available.
            </div>
          ) : selectedLangs.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: colors.textMuted }}>
              Select at least one language.
            </div>
          ) : (
            <iframe ref={previewRef} title="Translation Preview" style={{ flex: 1, border: 'none', backgroundColor: '#fff' }} />
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default TranslationPrintModal;
