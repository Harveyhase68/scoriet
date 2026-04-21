// resources/js/Components/Panels/SchemaPrintModal.tsx
// Modal for printing/exporting database schema documentation as PDF
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useProject } from '@/contexts/ProjectContext';
import { useTheme } from '@/contexts/ThemeContext';

// ========== INTERFACES ==========

interface SchemaPrintModalProps {
  visible: boolean;
  onHide: () => void;
  initialSchemaId?: number | null;
}

interface SchemaInfo {
  id: number;
  name: string;
  description?: string;
  last_version?: number;
}

interface SchemaVersion {
  id: number;
  version_number: number;
  version_name?: string;
  created_at: string;
  tables_count?: number;
}

interface SchemaField {
  id: number;
  field_name: string;
  field_type: string;
  field_length: number | null;
  field_precision: number | null;
  field_scale: number | null;
  is_unsigned: boolean;
  is_nullable: boolean;
  is_primary_key: boolean;
  is_auto_increment: boolean;
  is_index: boolean;
  is_unique: boolean;
  default_value: string | null;
  field_order: number;
  control_type: string;
  link_table: string | null;
  link_field: string | null;
  link_display_field: string | null;
  comment: string | null;
}

interface SchemaConstraint {
  id: number;
  constraint_name: string | null;
  constraint_type: string;
  columns?: Array<{ field_name: string; field_id: number }>;
  constraint_columns?: Array<{ field: { field_name: string } }>;
  foreign_key_reference?: {
    referenced_table: { table_name: string };
    on_delete: string;
    on_update: string;
    reference_columns?: Array<{ referenced_field: { field_name: string } }>;
  };
}

interface SchemaTable {
  id: number;
  table_name: string;
  singular_name?: string;
  primarykeyfield?: string;
  fields: SchemaField[];
  constraints: SchemaConstraint[];
}

interface PrintOptions {
  showFieldTypes: boolean;
  showNullable: boolean;
  showDefaults: boolean;
  showIndexes: boolean;
  showForeignKeys: boolean;
  showControlTypes: boolean;
  showComments: boolean;
  showTableOfContents: boolean;
  pageBreakPerTable: boolean;
}

// ========== HELPERS ==========

function getToken(): string {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';
}

function getAuthHeaders(): Record<string, string> {
  return {
    'Accept': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  };
}

function formatFieldType(field: SchemaField): string {
  let t = field.field_type;
  if (field.field_length) t += `(${field.field_length})`;
  else if (field.field_precision != null && field.field_scale != null) t += `(${field.field_precision},${field.field_scale})`;
  if (field.is_unsigned) t += ' UNSIGNED';
  return t;
}

// ========== PRINT HTML GENERATION ==========

function generatePrintHtml(
  schemaName: string,
  versionNumber: number,
  tables: SchemaTable[],
  options: PrintOptions,
  projectName: string,
): string {
  const today = new Date().toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const now = new Date().toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });

  const tocHtml = options.showTableOfContents ? `
    <div class="toc">
      <h2>Table of Contents</h2>
      <div class="toc-list">
        ${tables.map((t, i) => `<div class="toc-item"><span class="toc-num">${i + 1}.</span> <a href="#table-${t.id}">${t.table_name}</a> <span class="toc-fields">(${t.fields.length} fields)</span></div>`).join('')}
      </div>
    </div>
    ${options.pageBreakPerTable ? '<div class="page-break"></div>' : ''}
  ` : '';

  const tablesHtml = tables.map((table, idx) => {
    const pk = table.fields.filter(f => f.is_primary_key);
    const fks = table.constraints.filter(c => c.constraint_type === 'FOREIGN KEY');
    const indexes = table.constraints.filter(c =>
      c.constraint_type === 'KEY' || c.constraint_type === 'INDEX' || c.constraint_type === 'UNIQUE'
    );

    const fieldsHtml = table.fields.map(f => {
      const badges: string[] = [];
      if (f.is_primary_key) badges.push('<span class="badge pk">PK</span>');
      if (f.is_auto_increment) badges.push('<span class="badge ai">AI</span>');
      if (f.is_unique) badges.push('<span class="badge uq">UQ</span>');
      if (f.is_index) badges.push('<span class="badge ix">IX</span>');
      if (f.link_table) badges.push(`<span class="badge fk">FK→${f.link_table}</span>`);

      return `<tr>
        <td class="fn">${f.field_name} ${badges.join(' ')}</td>
        ${options.showFieldTypes ? `<td class="ft">${formatFieldType(f)}</td>` : ''}
        ${options.showNullable ? `<td class="center">${f.is_nullable ? 'YES' : 'NO'}</td>` : ''}
        ${options.showDefaults ? `<td class="dv">${f.default_value != null ? f.default_value : ''}</td>` : ''}
        ${options.showControlTypes ? `<td class="ct">${f.control_type || ''}</td>` : ''}
        ${options.showComments ? `<td class="cm">${f.comment || ''}</td>` : ''}
      </tr>`;
    }).join('');

    const fkSection = (options.showForeignKeys && fks.length > 0) ? `
      <div class="fk-section">
        <div class="fk-title">Foreign Keys</div>
        ${fks.map(fk => {
          const cols = (fk.columns || fk.constraint_columns?.map(cc => ({ field_name: cc.field?.field_name || '?' })) || [])
            .map(c => c.field_name).join(', ');
          const ref = fk.foreign_key_reference;
          const refTable = ref?.referenced_table?.table_name || '?';
          const refCols = ref?.reference_columns?.map(rc => rc.referenced_field?.field_name || '?').join(', ') || '?';
          const onDel = ref?.on_delete || 'NO ACTION';
          const onUpd = ref?.on_update || 'NO ACTION';
          return `<div class="fk-item">${fk.constraint_name || 'FK'}: <strong>${cols}</strong> → ${refTable}(${refCols}) <span class="fk-actions">ON DELETE ${onDel} · ON UPDATE ${onUpd}</span></div>`;
        }).join('')}
      </div>
    ` : '';

    const ixSection = (options.showIndexes && indexes.length > 0) ? `
      <div class="ix-section">
        <div class="ix-title">Indexes</div>
        ${indexes.map(ix => {
          const cols = (ix.columns || ix.constraint_columns?.map(cc => ({ field_name: cc.field?.field_name || '?' })) || [])
            .map(c => c.field_name).join(', ');
          return `<div class="ix-item">${ix.constraint_name || ix.constraint_type}: <strong>${cols}</strong> <span class="ix-type">${ix.constraint_type}</span></div>`;
        }).join('')}
      </div>
    ` : '';

    return `
      <div class="table-section${options.pageBreakPerTable && idx > 0 ? ' page-break-before' : ''}" id="table-${table.id}">
        <div class="table-header">
          <span class="table-num">${idx + 1}.</span>
          <span class="table-name">${table.table_name}</span>
          ${table.singular_name ? `<span class="table-singular">(${table.singular_name})</span>` : ''}
          <span class="table-meta">${table.fields.length} fields${pk.length > 0 ? ` · PK: ${pk.map(f => f.field_name).join(', ')}` : ''}</span>
        </div>
        <table class="fields-table">
          <thead>
            <tr>
              <th>Field Name</th>
              ${options.showFieldTypes ? '<th>Type</th>' : ''}
              ${options.showNullable ? '<th>Null</th>' : ''}
              ${options.showDefaults ? '<th>Default</th>' : ''}
              ${options.showControlTypes ? '<th>Control</th>' : ''}
              ${options.showComments ? '<th>Comment</th>' : ''}
            </tr>
          </thead>
          <tbody>${fieldsHtml}</tbody>
        </table>
        ${fkSection}
        ${ixSection}
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Schema Documentation - ${schemaName} v${versionNumber}</title>
  <style>
    @page { size: portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 11px; color: #1e293b; line-height: 1.4; }

    .doc-header { border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-bottom: 16px; }
    .doc-header h1 { font-size: 20px; color: #1e293b; margin-bottom: 2px; }
    .doc-header .subtitle { font-size: 12px; color: #64748b; }
    .doc-header .meta { font-size: 10px; color: #94a3b8; margin-top: 4px; }

    .toc { margin-bottom: 20px; }
    .toc h2 { font-size: 14px; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; }
    .toc-list { column-count: 2; column-gap: 20px; }
    .toc-item { font-size: 11px; padding: 2px 0; break-inside: avoid; }
    .toc-num { color: #94a3b8; display: inline-block; width: 24px; }
    .toc-item a { color: #3b82f6; text-decoration: none; }
    .toc-fields { color: #94a3b8; font-size: 10px; }

    .page-break { break-after: page; page-break-after: always; height: 0; display: block; }
    .page-break-before { break-before: page; page-break-before: always; margin-top: 30px; padding-top: 16px; border-top: 2px dashed #cbd5e1; }

    .table-section { margin-bottom: 18px; break-inside: avoid; }

    @media print {
      .page-break-before { margin-top: 0; padding-top: 0; border-top: none; }
    }
    .table-header { background: #f1f5f9; padding: 6px 10px; border-radius: 4px 4px 0 0; border: 1px solid #e2e8f0; border-bottom: 2px solid #3b82f6; }
    .table-num { color: #94a3b8; font-size: 10px; margin-right: 4px; }
    .table-name { font-weight: 700; font-size: 13px; color: #1e293b; }
    .table-singular { color: #64748b; font-size: 11px; margin-left: 6px; }
    .table-meta { float: right; font-size: 10px; color: #94a3b8; padding-top: 2px; }

    .fields-table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; font-size: 10px; }
    .fields-table th { background: #f8fafc; text-align: left; padding: 4px 6px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 9px; text-transform: uppercase; }
    .fields-table td { padding: 3px 6px; border: 1px solid #e2e8f0; }
    .fields-table tr:nth-child(even) { background: #fafbfc; }
    .fn { font-weight: 500; }
    .ft { color: #6366f1; font-family: 'Consolas', 'Courier New', monospace; font-size: 10px; }
    .center { text-align: center; }
    .dv { color: #64748b; font-family: 'Consolas', monospace; font-size: 10px; }
    .ct { color: #059669; font-size: 9px; }
    .cm { color: #94a3b8; font-size: 9px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .badge { display: inline-block; font-size: 8px; padding: 1px 4px; border-radius: 3px; margin-left: 3px; font-weight: 600; vertical-align: middle; }
    .badge.pk { background: #fef3c7; color: #92400e; }
    .badge.ai { background: #dbeafe; color: #1d4ed8; }
    .badge.fk { background: #f0fdf4; color: #166534; }
    .badge.uq { background: #fae8ff; color: #86198f; }
    .badge.ix { background: #f1f5f9; color: #475569; }

    .fk-section, .ix-section { padding: 4px 10px; border: 1px solid #e2e8f0; border-top: none; font-size: 10px; background: #fefce8; }
    .ix-section { background: #f0f9ff; }
    .fk-title, .ix-title { font-weight: 600; font-size: 9px; text-transform: uppercase; color: #92400e; margin-bottom: 2px; }
    .ix-title { color: #1d4ed8; }
    .fk-item, .ix-item { padding: 1px 0; }
    .fk-actions { color: #94a3b8; font-size: 9px; }
    .ix-type { color: #94a3b8; font-size: 9px; margin-left: 4px; }

    .doc-footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center; }

    .summary { margin-bottom: 16px; display: flex; gap: 16px; flex-wrap: wrap; }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px 14px; text-align: center; }
    .summary-num { font-size: 20px; font-weight: 700; color: #3b82f6; }
    .summary-label { font-size: 9px; color: #64748b; text-transform: uppercase; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .table-section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <h1>${schemaName}</h1>
    <div class="subtitle">Database Schema Documentation · Version ${versionNumber}</div>
    <div class="meta">${projectName ? `Project: ${projectName} · ` : ''}Generated: ${today} ${now} · ${tables.length} tables · ${tables.reduce((s, t) => s + t.fields.length, 0)} fields</div>
  </div>

  <div class="summary">
    <div class="summary-card"><div class="summary-num">${tables.length}</div><div class="summary-label">Tables</div></div>
    <div class="summary-card"><div class="summary-num">${tables.reduce((s, t) => s + t.fields.length, 0)}</div><div class="summary-label">Fields</div></div>
    <div class="summary-card"><div class="summary-num">${tables.reduce((s, t) => s + t.constraints.filter(c => c.constraint_type === 'FOREIGN KEY').length, 0)}</div><div class="summary-label">Foreign Keys</div></div>
    <div class="summary-card"><div class="summary-num">${tables.reduce((s, t) => s + t.constraints.filter(c => c.constraint_type === 'UNIQUE' || c.constraint_type === 'INDEX' || c.constraint_type === 'KEY').length, 0)}</div><div class="summary-label">Indexes</div></div>
  </div>

  ${tocHtml}
  ${tablesHtml}

  <div class="doc-footer">
    Generated by Scoriet · ${schemaName} v${versionNumber} · ${today}
  </div>
</body>
</html>`;
}

// ========== MAIN COMPONENT ==========

const SchemaPrintModal: React.FC<SchemaPrintModalProps> = ({ visible, onHide, initialSchemaId }) => {
  const { colors } = useTheme();
  const { selectedProject } = useProject();
  const previewRef = useRef<HTMLIFrameElement>(null);

  // Selection state
  const [schemas, setSchemas] = useState<SchemaInfo[]>([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState<number | null>(null);
  const [versions, setVersions] = useState<SchemaVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);

  // Print options
  const [options, setOptions] = useState<PrintOptions>({
    showFieldTypes: true,
    showNullable: true,
    showDefaults: true,
    showIndexes: true,
    showForeignKeys: true,
    showControlTypes: false,
    showComments: true,
    showTableOfContents: true,
    pageBreakPerTable: false,
  });

  // Load schemas
  useEffect(() => {
    if (!visible || !selectedProject) return;
    const loadSchemas = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${selectedProject.id}/schemas`, { headers: getAuthHeaders() });
        const data = await res.json();
        const arr = data.schemas || data.data || (Array.isArray(data) ? data : []);
        setSchemas(arr);
        // Use initialSchemaId if provided, otherwise first schema
        const targetId = initialSchemaId && arr.some((s: SchemaInfo) => s.id === initialSchemaId) ? initialSchemaId : (arr.length > 0 ? arr[0].id : null);
        if (targetId) setSelectedSchemaId(targetId);
      } catch { setSchemas([]); }
      setLoading(false);
    };
    loadSchemas();
  }, [visible, selectedProject]);

  // Load versions when schema changes
  useEffect(() => {
    if (!selectedSchemaId) { setVersions([]); return; }
    const loadVersions = async () => {
      try {
        const res = await fetch(`/api/floating-schemas/${selectedSchemaId}/versions`, { headers: getAuthHeaders() });
        const data = await res.json();
        const arr = data.versions || data.data || (Array.isArray(data) ? data : []);
        setVersions(arr);
        if (arr.length > 0) {
          const highest = arr.reduce((max: SchemaVersion, cur: SchemaVersion) =>
            cur.version_number > max.version_number ? cur : max, arr[0]);
          setSelectedVersionId(highest.id);
        }
      } catch { setVersions([]); }
    };
    loadVersions();
  }, [selectedSchemaId]);

  // Load tables when version changes
  useEffect(() => {
    if (!selectedVersionId) { setTables([]); return; }
    const loadTables = async () => {
      setLoadingTables(true);
      try {
        const res = await fetch(`/api/schema-versions/${selectedVersionId}/tables`, { headers: getAuthHeaders() });
        const data = await res.json();
        const arr = Array.isArray(data) ? data : data.data || [];
        setTables(arr);
      } catch { setTables([]); }
      setLoadingTables(false);
    };
    loadTables();
  }, [selectedVersionId]);

  // Generate preview HTML
  const selectedSchema = schemas.find(s => s.id === selectedSchemaId);
  const selectedVersion = versions.find(v => v.id === selectedVersionId);
  const previewHtml = useMemo(() => {
    if (!selectedSchema || !selectedVersion || tables.length === 0) return '';
    return generatePrintHtml(
      selectedSchema.name,
      selectedVersion.version_number,
      tables,
      options,
      selectedProject?.name || '',
    );
  }, [selectedSchema, selectedVersion, tables, options, selectedProject]);

  // Update iframe preview
  useEffect(() => {
    if (previewRef.current && previewHtml) {
      const doc = previewRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(previewHtml);
        doc.close();
      }
    }
  }, [previewHtml]);

  // Print action
  const handlePrint = useCallback(() => {
    if (!previewHtml) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(previewHtml);
      printWindow.document.close();
      printWindow.onload = () => { printWindow.print(); };
    }
  }, [previewHtml]);

  const toggleOption = (key: keyof PrintOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const schemaOptions = schemas.map(s => ({ label: s.name, value: s.id }));
  const versionOptions = versions.map(v => ({ label: `v${v.version_number}`, value: v.id }));

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Schema Documentation"
      modal
      maximizable
      style={{ width: '90vw', maxWidth: 1200, height: '85vh' }}
      contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
    >
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: `1px solid ${colors.borderPrimary}`, flexShrink: 0, flexWrap: 'wrap' }}>
        {/* Schema Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 11, color: colors.textMuted, whiteSpace: 'nowrap' }}>Schema:</label>
          <Dropdown
            value={selectedSchemaId}
            options={schemaOptions}
            onChange={e => { setSelectedSchemaId(e.value); setSelectedVersionId(null); }}
            placeholder="Select schema..."
            style={{ width: 200, fontSize: 12 }}
            loading={loading}
          />
        </div>

        {/* Version Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 11, color: colors.textMuted, whiteSpace: 'nowrap' }}>Version:</label>
          <Dropdown
            value={selectedVersionId}
            options={versionOptions}
            onChange={e => setSelectedVersionId(e.value)}
            placeholder="Select version..."
            style={{ width: 100, fontSize: 12 }}
            disabled={versions.length === 0}
          />
        </div>

        {/* Stats */}
        {tables.length > 0 && (
          <span style={{ fontSize: 11, color: colors.textMuted }}>
            {tables.length} tables · {tables.reduce((s, t) => s + t.fields.length, 0)} fields
          </span>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Print Button */}
        <Button
          icon="pi pi-print"
          label="Print / PDF"
          className="p-button-sm"
          onClick={handlePrint}
          disabled={!previewHtml || loadingTables}
          style={{ backgroundColor: '#3b82f6', border: 'none' }}
        />
      </div>

      {/* Main Content: Options + Preview */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left: Options Panel */}
        <div style={{
          width: 220, flexShrink: 0, padding: '12px 14px', borderRight: `1px solid ${colors.borderPrimary}`,
          overflowY: 'auto', fontSize: 12,
        }}>
          <div style={{ fontWeight: 600, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 10 }}>
            Display Options
          </div>

          {([
            ['showTableOfContents', 'Table of Contents'],
            ['showFieldTypes', 'Field Types'],
            ['showNullable', 'Nullable'],
            ['showDefaults', 'Default Values'],
            ['showIndexes', 'Indexes'],
            ['showForeignKeys', 'Foreign Keys'],
            ['showControlTypes', 'Control Types'],
            ['showComments', 'Comments'],
            ['pageBreakPerTable', 'Page Break per Table'],
          ] as [keyof PrintOptions, string][]).map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }} onClick={() => toggleOption(key)}>
              <Checkbox checked={options[key]} onChange={() => toggleOption(key)} />
              <span style={{ color: colors.textPrimary }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Right: Preview */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loadingTables ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10 }}>
              <ProgressSpinner style={{ width: 24, height: 24 }} strokeWidth="4" />
              <span style={{ color: colors.textMuted }}>Loading schema...</span>
            </div>
          ) : tables.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: colors.textMuted, fontSize: 13 }}>
              {selectedSchemaId ? 'No tables found in this version.' : 'Select a schema to preview.'}
            </div>
          ) : (
            <iframe
              ref={previewRef}
              title="Schema Preview"
              style={{ flex: 1, border: 'none', backgroundColor: '#fff' }}
            />
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default SchemaPrintModal;
