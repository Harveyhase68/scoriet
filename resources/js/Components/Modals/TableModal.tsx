import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { SchemaTable, DisplayState, GenerationMode } from '@/lib/api';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

export interface TableField {
  id: string;
  name: string;
  type: string;
  length?: number | null;
  unsigned: boolean;
  nullable: boolean;
  autoIncrement: boolean;
  constraintType: 'none' | 'primary' | 'index' | 'unique';
  comment: string;
  // Control Type & Link Fields
  controlType: string;
  linkTable: string;
  linkField: string;
  linkDisplayField: string;
  linkOrderField: string;
  linkOrderDirection: 'ASC' | 'DESC';
  editmask: string;
  // Generation / display state (orthogonal: display is UI-hint only, generation controls emit)
  displayState: DisplayState;
  generationMode: GenerationMode;
}

interface TableModalProps {
  mode: 'create' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    tableName: string,
    fields: TableField[],
    fileKeyName: string,
    fileNameRenamed: string,
    fileNameShort: string,
    singularName: string,
    formSetId: number | null,
    reportPatternId: number | null,
    tableDisplayState: DisplayState,
    tableGenerationMode: GenerationMode,
  ) => void;
  table?: SchemaTable | null;
  loading?: boolean;
  schemaVersionId?: number;
}

interface FormSetOption {
  id: number;
  name: string;
}
interface ReportPatternOption {
  id: number;
  name: string;
}

const DATA_TYPES = [
  'bigint', 'int', 'smallint', 'tinyint',
  'varchar', 'char', 'text', 'longtext',
  'decimal', 'float', 'double',
  'date', 'datetime', 'timestamp', 'time',
  'boolean', 'json', 'enum'
];

const CONTROL_TYPES = [
  'TEXT',
  'TEXTAREA',
  'CHECKBOX',
  'COMBOBOX',
  'LISTBOX',
  'RADIOBUTTONS',
  'DATEPICKER',
  'DATETIMEPICKER',
  'TIMEPICKER',
  'COLORPICKER',
  'FILEUPLOAD'
];

const DISPLAY_STATE_OPTIONS: { value: DisplayState; label: string }[] = [
  { value: 'enabled',   label: 'Enabled' },
  { value: 'disabled',  label: 'Disabled' },
  { value: 'grayed',    label: 'Grayed' },
  { value: 'invisible', label: 'Invisible' },
  { value: 'excluded',  label: 'Excluded' },
];

const GENERATION_MODE_OPTIONS: { value: GenerationMode; label: string }[] = [
  { value: 'full',           label: 'Full (default)' },
  { value: 'code_only',      label: 'Code only' },
  { value: 'template_only',  label: 'Template only' },
  { value: 'reference_only', label: 'Reference only' },
  { value: 'excluded',       label: 'Excluded' },
];

/**
 * Parse field type to extract base type and length
 */
function parseFieldType(fieldType: string): { type: string; length: number | null } {
  const match = fieldType.match(/^([a-zA-Z]+)(?:\((\d+)\))?/i);
  if (match) {
    const type = match[1].toLowerCase();
    const length = match[2] ? parseInt(match[2], 10) : null;
    return { type, length };
  }
  return { type: fieldType.toLowerCase(), length: null };
}

/**
 * Auto-detect control type based on field type and name
 */
function detectControlType(fieldType: string, fieldName: string, linkTable: string): string {
  if (linkTable && linkTable.trim() !== '') return 'COMBOBOX';

  const lowerType = fieldType.toLowerCase();
  const lowerName = fieldName.toLowerCase();

  if (lowerType.includes('longtext')) return 'TEXTAREA';
  if (lowerType.includes('text') && !lowerType.includes('tinytext')) return 'TEXTAREA';
  if (lowerType === 'boolean' || lowerType === 'tinyint(1)') return 'CHECKBOX';
  if (lowerType.includes('datetime') || lowerType.includes('timestamp')) return 'DATETIMEPICKER';
  if (lowerType.includes('date')) return 'DATEPICKER';
  if (lowerType.includes('time') && !lowerType.includes('datetime')) return 'TIMEPICKER';

  if (lowerName.endsWith('_id') && (lowerType === 'bigint' || lowerType === 'int')) return 'COMBOBOX';
  if (lowerName.includes('color') || lowerName.includes('colour')) return 'COLORPICKER';
  if (lowerName.includes('file') || lowerName.includes('upload') || lowerName.includes('attachment')) return 'FILEUPLOAD';

  return 'TEXT';
}

function createDefaultField(): TableField {
  return {
    id: '1',
    name: 'id',
    type: 'bigint',
    length: null,
    unsigned: false,
    nullable: false,
    autoIncrement: true,
    constraintType: 'primary',
    comment: '',
    controlType: 'TEXT',
    linkTable: '',
    linkField: '',
    linkDisplayField: '',
    linkOrderField: '',
    linkOrderDirection: 'ASC',
    editmask: '',
    displayState: 'enabled',
    generationMode: 'full',
  };
}

function guessEnglishSingular(tableName: string): string {
  if (!tableName.trim()) return '';
  const parts = tableName.split('_');
  let last = parts.pop() || '';
  if (last.endsWith('ies') && last.length > 4) last = last.slice(0, -3) + 'y';
  else if (last.endsWith('sses')) last = last.slice(0, -2);
  else if (last.endsWith('shes') || last.endsWith('ches')) last = last.slice(0, -2);
  else if (last.endsWith('ses') || last.endsWith('xes') || last.endsWith('zes')) last = last.slice(0, -2);
  else if (last.endsWith('ves')) last = last.slice(0, -3) + 'f';
  else if (last.endsWith('s') && !last.endsWith('ss') && !last.endsWith('us') && !last.endsWith('is') && last.length > 2) last = last.slice(0, -1);
  parts.push(last);
  return parts.join('_');
}

function generateFileNameShort(tableName: string): string {
  if (!tableName.trim()) return '';
  const cleanName = tableName.replace(/[0-9_]/g, ' ').trim();
  const words = cleanName.split(/\s+/).filter(word => word.length > 0);
  if (words.length === 0) return '';
  if (words.length === 1) {
    return words[0].substring(0, 3).toLowerCase();
  }
  return words.slice(0, 3).map(word => word.charAt(0).toLowerCase()).join('');
}

export default function TableModal({ mode, isOpen, onClose, onSave, table, loading = false, schemaVersionId }: TableModalProps) {
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();

  const isEditMode = mode === 'edit';

  const [tableName, setTableName] = useState('');
  const [singularName, setSingularName] = useState('');
  const [fileKeyName, setFileKeyName] = useState('');
  const [fileNameRenamed, setFileNameRenamed] = useState('');
  const [fileNameShort, setFileNameShort] = useState('');
  const [formSetId, setFormSetId] = useState<number | null>(null);
  const [reportPatternId, setReportPatternId] = useState<number | null>(null);
  const [tableDisplayState, setTableDisplayState] = useState<DisplayState>('enabled');
  const [tableGenerationMode, setTableGenerationMode] = useState<GenerationMode>('full');
  const [availableFormSets, setAvailableFormSets] = useState<FormSetOption[]>([]);
  const [availableReportPatterns, setAvailableReportPatterns] = useState<ReportPatternOption[]>([]);
  const [fields, setFields] = useState<TableField[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editmaskPresets, setEditmaskPresets] = useState<Array<{ key: string; label: string; mask: string }>>([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';
    const headers = { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` };
    fetch('/api/form-sets', { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.data) {
          setAvailableFormSets(data.data.map((fs: { id: number; name: string }) => ({ id: fs.id, name: fs.name })));
        }
      })
      .catch(() => {});
    fetch('/api/report-patterns', { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.data) {
          setAvailableReportPatterns(data.data.map((rp: { id: number; name: string }) => ({ id: rp.id, name: rp.name })));
        }
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';
    const targetLang = localStorage.getItem('scoriet_target_language') || 'html';
    fetch(`/api/editmask-presets?language=${targetLang}`, {
      headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.presets) setEditmaskPresets(data.presets); })
      .catch(() => {});
  }, [isOpen]);

  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [linkFieldOptions, setLinkFieldOptions] = useState<{[key: string]: string[]}>({});

  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && table) {
      setTableName(table.table_name);
      setSingularName(table.singular_name || '');
      setFileKeyName(table.filekeyname || table.primarykeyfield || '');
      setFileNameRenamed(table.file_name_renamed || '');
      setFileNameShort(table.file_name_short || '');

      setFormSetId(((table as unknown as Record<string, unknown>).form_set_id ?? null) as number | null);
      setReportPatternId(((table as unknown as Record<string, unknown>).report_pattern_id ?? null) as number | null);
      setTableDisplayState((table.display_state as DisplayState) || 'enabled');
      setTableGenerationMode((table.generation_mode as GenerationMode) || 'full');

      const formFields: TableField[] = table.fields?.map((field, index) => {
        let isPrimaryKey = false;
        if (field.is_primary_key !== undefined && field.is_primary_key !== null) {
          isPrimaryKey = field.is_primary_key;
        } else {
          isPrimaryKey = table.constraints?.some(constraint =>
            constraint.constraint_type === 'PRIMARY KEY' &&
            constraint.columns?.some(col => col.field_name === field.field_name)
          ) || false;

          if (!isPrimaryKey) {
            isPrimaryKey = (field.field_name.toLowerCase() === 'id') ||
                          (field.field_name.toLowerCase().endsWith('_id')) ||
                          (table.primarykeyfield === field.field_name);
          }
        }

        let isAutoIncrement = false;
        if (field.is_auto_increment !== undefined && field.is_auto_increment !== null) {
          isAutoIncrement = field.is_auto_increment;
        } else {
          isAutoIncrement = field.extra?.includes('auto_increment') ||
                           (isPrimaryKey && (field.field_name.toLowerCase() === 'id' || field.field_name.toLowerCase().endsWith('_id')));
        }

        let isIndex = false;
        if (field.is_index !== undefined && field.is_index !== null) {
          isIndex = field.is_index;
        } else {
          isIndex = table.constraints?.some(constraint =>
            (constraint.constraint_type === 'INDEX' || constraint.constraint_type === 'KEY') &&
            constraint.columns?.some(col => col.field_name === field.field_name)
          ) || false;
        }

        let isUnique = false;
        if (field.is_unique !== undefined && field.is_unique !== null) {
          isUnique = field.is_unique;
        } else {
          isUnique = table.constraints?.some(constraint =>
            constraint.constraint_type === 'UNIQUE' &&
            constraint.columns?.some(col => col.field_name === field.field_name)
          ) || false;
        }

        const linkTable = field.link_table || '';
        const linkField = field.link_field || '';
        const linkDisplayField = field.link_display_field || '';
        const linkOrderField = field.link_order_field || '';
        const linkOrderDirection = (field.link_order_direction || 'ASC') as 'ASC' | 'DESC';
        const editmask = field.editmask || '';

        const controlType = field.control_type || detectControlType(field.field_type, field.field_name, linkTable);
        const { type, length } = parseFieldType(field.field_type);

        let constraintType: 'none' | 'primary' | 'index' | 'unique' = 'none';
        if (isPrimaryKey) constraintType = 'primary';
        else if (isUnique) constraintType = 'unique';
        else if (isIndex) constraintType = 'index';

        return {
          id: field.id?.toString() || index.toString(),
          name: field.field_name,
          type,
          length: field.field_length || length,
          unsigned: field.is_unsigned || false,
          nullable: field.is_nullable,
          autoIncrement: isAutoIncrement,
          constraintType,
          comment: field.comment || '',
          controlType,
          linkTable,
          linkField,
          linkDisplayField,
          linkOrderField,
          linkOrderDirection,
          editmask,
          displayState: (field.display_state as DisplayState) || 'enabled',
          generationMode: (field.generation_mode as GenerationMode) || 'full',
        };
      }) || [];

      setFields(formFields);

      if (table.schema_version_id) {
        fetchAvailableTables(table.schema_version_id);
      }
    } else if (!isEditMode) {
      resetForm();
      if (schemaVersionId) {
        fetchAvailableTables(schemaVersionId);
      }
    }
  }, [isOpen, table, mode]);

  useEffect(() => {
    if (!fileKeyName && fields.length > 0) {
      const primaryKeyField = fields.find(field => field.constraintType === 'primary');
      const autoIncField = fields.find(field => field.autoIncrement);
      const idField = fields.find(field => field.name.toLowerCase().endsWith('_id') || field.name.toLowerCase() === 'id');

      if (primaryKeyField) setFileKeyName(primaryKeyField.name);
      else if (autoIncField) setFileKeyName(autoIncField.name);
      else if (idField) setFileKeyName(idField.name);
      else setFileKeyName(fields[0].name);
    }
  }, [fields, fileKeyName]);

  const fetchAvailableTables = async (svId: number) => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/schema-versions/${svId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const schemaVersion = data.schema_version || data;
        const tables = schemaVersion.tables?.map((tbl: { table_name: string }) => tbl.table_name) || [];
        setAvailableTables(tables);

        const fieldOpts: {[key: string]: string[]} = {};
        schemaVersion.tables?.forEach((tbl: { table_name: string; fields?: { field_name: string }[] }) => {
          fieldOpts[tbl.table_name] = tbl.fields?.map((f) => f.field_name) || [];
        });
        setLinkFieldOptions(fieldOpts);
      }
    } catch {
      // Error fetching tables
    }
  };

  const getSuitableFileKeyFields = (): TableField[] => {
    const suitableFields = fields.filter(field => field.constraintType && field.constraintType !== 'none');
    return suitableFields.length > 0 ? suitableFields : fields;
  };

  const getAvailableKeys = () => {
    const keyFields = fields
      .filter(field => field.name.trim().length > 0 && field.constraintType !== 'none')
      .map(field => field.name.trim());
    return [...new Set(keyFields)].sort();
  };

  const addField = () => {
    const newField: TableField = {
      id: Date.now().toString(),
      name: '',
      type: 'varchar',
      length: null,
      unsigned: false,
      nullable: true,
      autoIncrement: false,
      constraintType: 'none',
      comment: '',
      controlType: 'TEXT',
      linkTable: '',
      linkField: '',
      linkDisplayField: '',
      linkOrderField: '',
      linkOrderDirection: 'ASC',
      editmask: '',
      displayState: 'enabled',
      generationMode: 'full',
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    if (fields.length > 1) {
      setFields(fields.filter(field => field.id !== id));
    }
  };

  const updateField = (id: string, updates: Partial<TableField>) => {
    setFields(fields.map(field =>
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const handleTableNameChange = (value: string) => {
    setTableName(value);
    if (!isEditMode) {
      setFileNameShort(generateFileNameShort(value));
      setSingularName(guessEnglishSingular(value));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tableName.trim()) {
      setError(t.createtablemodal189);
      setActiveTab(0);
      return;
    }

    if (fields.some(field => !field.name.trim())) {
      setError(t.createtablemodal194);
      setActiveTab(1);
      return;
    }

    const fieldNames = fields.map(f => f.name.toLowerCase());
    if (fieldNames.length !== new Set(fieldNames).size) {
      setError(t.createtablemodal201);
      setActiveTab(1);
      return;
    }

    if (isEditMode) {
      if (!fileKeyName.trim()) {
        setError(t.edittablemodal335);
        setActiveTab(0);
        return;
      }

      const suitableFields = getSuitableFileKeyFields();
      if (!suitableFields.some(field => field.name === fileKeyName)) {
        setError(t.edittablemodal342);
        setActiveTab(0);
        return;
      }
    }

    onSave(
      tableName,
      fields,
      fileKeyName,
      fileNameRenamed,
      fileNameShort,
      singularName,
      formSetId,
      reportPatternId,
      tableDisplayState,
      tableGenerationMode,
    );
  };

  const resetForm = () => {
    setTableName('');
    setSingularName('');
    setFileKeyName('');
    setFileNameRenamed('');
    setFileNameShort('');
    setFormSetId(null);
    setReportPatternId(null);
    setTableDisplayState('enabled');
    setTableGenerationMode('full');
    setFields([createDefaultField()]);
    setError(null);
    setActiveTab(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const i18nExtra = t as unknown as Record<string, string>;

  // Shared select styling
  const selectStyle = {
    backgroundColor: colors.bgTertiary,
    border: `1px solid ${colors.borderPrimary}`,
    color: colors.textPrimary,
  };
  const fieldSelectStyle = {
    backgroundColor: colors.bgSecondary,
    border: `1px solid ${colors.borderPrimary}`,
    color: colors.textPrimary,
  };

  return (
    <Dialog
      header={
        <span>
          <i className={isEditMode ? 'pi pi-pencil mr-2' : 'pi pi-table mr-2'}></i>
          {isEditMode ? t.edittablemodal404 : t.createtablemodal302}
        </span>
      }
      visible={isOpen}
      onHide={handleClose}
      style={{ width: isMaximized ? '95vw' : '1000px', height: isMaximized ? '95vh' : 'auto' }}
      contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
      headerStyle={{ backgroundColor: colors.dialogHeader || colors.bgSecondary, color: colors.textPrimary }}
      modal
      closable
      draggable
      resizable
      maximizable
      maximized={isMaximized}
      onMaximize={(e) => setIsMaximized(e.maximized)}
      className="table-modal"
    >
      <form onSubmit={handleSubmit} className="flex flex-col" style={{ maxHeight: isMaximized ? 'calc(95vh - 200px)' : '75vh' }}>
        <TabView
          activeIndex={activeTab}
          onTabChange={(e) => setActiveTab(e.index)}
          className="flex-1 overflow-hidden"
          panelContainerStyle={{ backgroundColor: colors.bgSecondary, padding: '1rem 0 0 0' }}
        >
          {/* ------------------ TAB 1: Table Settings ------------------ */}
          <TabPanel header={i18nExtra.tablemodal_tab_settings || 'Table Settings'} leftIcon="pi pi-cog mr-2">
            <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: isMaximized ? 'calc(95vh - 320px)' : '55vh' }}>

              {/* Table Name (full width) */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  {isEditMode ? t.edittablemodal422 : t.createtablemodal319}
                </label>
                <input
                  type="text"
                  required
                  value={tableName}
                  onChange={(e) => handleTableNameChange(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={selectStyle}
                  placeholder={t.createtablemodal300}
                  maxLength={64}
                />
              </div>

              {/* Row: File Key Name | Display State | Generation Mode */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    {isEditMode ? t.edittablemodal439 : t.tablemodal463}
                  </label>
                  {isEditMode ? (
                    <>
                      <select
                        value={fileKeyName}
                        onChange={(e) => setFileKeyName(e.target.value)}
                        disabled={loading}
                        className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                        style={selectStyle}
                      >
                        <option value="">{t.tablemodal474}</option>
                        {getSuitableFileKeyFields().map(field => (
                          <option key={field.id} value={field.name}>
                            {field.name} ({field.type}){field.constraintType === 'primary' ? t.tablemodal477 : ''}{field.autoIncrement ? t.tablemodal477_2 : ''}
                          </option>
                        ))}
                      </select>
                      <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                        {t.edittablemodal456}{'{:fileprimarykey:}'}{t.edittablemodal456_2}
                      </div>
                    </>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={fileKeyName}
                        onChange={(e) => setFileKeyName(e.target.value)}
                        disabled={loading}
                        className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                        style={selectStyle}
                        placeholder={t.createtablemodal316}
                        maxLength={64}
                        list="keynames"
                      />
                      <datalist id="keynames">
                        {getAvailableKeys().map((key, index) => (
                          <option key={index} value={key} />
                        ))}
                      </datalist>
                    </div>
                  )}
                </div>

                {/* Display State (table) */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    {i18nExtra.tablemodal_display_state || 'Display State'}
                  </label>
                  <select
                    value={tableDisplayState}
                    onChange={(e) => setTableDisplayState(e.target.value as DisplayState)}
                    disabled={loading}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={selectStyle}
                  >
                    {DISPLAY_STATE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                    {i18nExtra.tablemodal_display_state_hint || 'Passed to gtree as metadata — does not filter generation.'}
                  </div>
                </div>

                {/* Generation Mode (table) */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    {i18nExtra.tablemodal_generation_mode || 'Generation Mode'}
                  </label>
                  <select
                    value={tableGenerationMode}
                    onChange={(e) => setTableGenerationMode(e.target.value as GenerationMode)}
                    disabled={loading}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={selectStyle}
                  >
                    {GENERATION_MODE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                    {i18nExtra.tablemodal_generation_mode_hint || 'Controls nmaxtables iteration and per-table file generation.'}
                  </div>
                </div>
              </div>

              {/* Row: Singular | Renamed | Short */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    {i18nExtra.tablemodal_singular_name || 'Singular Name'}
                  </label>
                  <input
                    type="text"
                    value={singularName}
                    onChange={(e) => setSingularName(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={selectStyle}
                    placeholder={i18nExtra.tablemodal_singular_placeholder || 'e.g., product, address'}
                    maxLength={100}
                  />
                  <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                    {i18nExtra.tablemodal_singular_help || 'Singular form for templates'} {'{:filesingular:}'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    {isEditMode ? t.edittablemodal463 : t.createtablemodal361}
                  </label>
                  <input
                    type="text"
                    value={fileNameRenamed}
                    onChange={(e) => setFileNameRenamed(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={selectStyle}
                    placeholder={t.createtablemodal339}
                    maxLength={100}
                  />
                  <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                    {isEditMode ? t.edittablemodal476 : t.createtablemodal374}{'{:filenamerenamed:}'}{isEditMode ? t.edittablemodal476_2 : t.createtablemodal374_2}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    {isEditMode ? t.edittablemodal482 : t.createtablemodal380}
                  </label>
                  <input
                    type="text"
                    value={fileNameShort}
                    onChange={(e) => setFileNameShort(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={selectStyle}
                    placeholder={isEditMode ? t.edittablemodal491 : 'e.g., usr, prod'}
                    maxLength={50}
                  />
                  <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                    {isEditMode ? t.edittablemodal495 : t.createtablemodal393}{'{:filenameshort:}'}{isEditMode ? t.edittablemodal495_2 : t.createtablemodal393_2}
                  </div>
                </div>
              </div>

              {/* Row: FormSet | ReportPattern */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    {i18nExtra.tablemodal_form_set || 'Form Set'}
                  </label>
                  <select
                    value={formSetId ?? ''}
                    onChange={(e) => setFormSetId(e.target.value === '' ? null : Number(e.target.value))}
                    disabled={loading}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={selectStyle}
                  >
                    <option value="">{i18nExtra.tablemodal_use_project_default || '— Project default —'}</option>
                    {availableFormSets.map(fs => (
                      <option key={fs.id} value={fs.id}>{fs.name}</option>
                    ))}
                  </select>
                  <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                    {i18nExtra.tablemodal_form_set_hint || 'Override the project-wide FormSet for this table.'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    {i18nExtra.tablemodal_report_pattern || 'Report Pattern'}
                  </label>
                  <select
                    value={reportPatternId ?? ''}
                    onChange={(e) => setReportPatternId(e.target.value === '' ? null : Number(e.target.value))}
                    disabled={loading}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={selectStyle}
                  >
                    <option value="">{i18nExtra.tablemodal_no_report_pattern || '— No report —'}</option>
                    {availableReportPatterns.map(rp => (
                      <option key={rp.id} value={rp.id}>{rp.name}</option>
                    ))}
                  </select>
                  <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                    {i18nExtra.tablemodal_report_pattern_hint || 'Optional: which Report Pattern this table should use.'}
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          {/* ------------------ TAB 2: Fields ------------------ */}
          <TabPanel header={`${i18nExtra.tablemodal_tab_fields || 'Fields'} (${fields.length})`} leftIcon="pi pi-list mr-2">
            <div className="flex flex-col" style={{ maxHeight: isMaximized ? 'calc(95vh - 320px)' : '55vh' }}>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium" style={{ color: colors.textSecondary }}>
                  {isEditMode ? t.edittablemodal505 : t.createtablemodal403}
                </label>
                <button
                  type="button"
                  onClick={addField}
                  disabled={loading}
                  className="px-3 py-1 rounded text-white text-sm flex items-center space-x-1 hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: colors.accent }}
                >
                  <i className="pi pi-plus"></i>
                  <span>{isEditMode ? t.edittablemodal515 : t.createtablemodal413}</span>
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto pr-2 flex-1">
                {fields.map((field) => (
                  <div key={field.id} className="rounded-lg p-4" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
                    {/* Row 1: Main field properties */}
                    <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 mb-3">
                      <div className="lg:col-span-2">
                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                          {isEditMode ? t.edittablemodal526 : t.createtablemodal424}
                        </label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateField(field.id, { name: e.target.value })}
                          disabled={loading}
                          className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                          style={fieldSelectStyle}
                          placeholder={t.createtablemodal398}
                        />
                      </div>

                      <div>
                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                          {isEditMode ? t.edittablemodal540 : t.createtablemodal438}
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => {
                            const newType = e.target.value;
                            if (!field.linkTable || field.linkTable.trim() === '') {
                              const newControlType = detectControlType(newType, field.name, '');
                              updateField(field.id, { type: newType, controlType: newControlType });
                            } else {
                              updateField(field.id, { type: newType });
                            }
                          }}
                          disabled={loading}
                          className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                          style={fieldSelectStyle}
                        >
                          {DATA_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                          {isEditMode ? 'Length' : t.createtablemodal463}
                        </label>
                        <input
                          type="number"
                          value={field.length || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateField(field.id, { length: value ? parseInt(value, 10) : null });
                          }}
                          disabled={loading}
                          placeholder={isEditMode ? t.edittablemodal574 : 'e.g., 50'}
                          className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                          style={fieldSelectStyle}
                        />
                      </div>

                      <div>
                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                          {isEditMode ? t.edittablemodal582 : 'Control'}
                        </label>
                        <select
                          value={field.controlType}
                          onChange={(e) => {
                            const newControlType = e.target.value;
                            if (newControlType !== 'COMBOBOX' && newControlType !== 'LISTBOX' && newControlType !== 'RADIOBUTTONS') {
                              updateField(field.id, { controlType: newControlType, linkTable: '', linkField: '', linkDisplayField: '', linkOrderField: '', linkOrderDirection: 'ASC' });
                            } else {
                              updateField(field.id, { controlType: newControlType });
                            }
                          }}
                          disabled={loading}
                          className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                          style={fieldSelectStyle}
                        >
                          {CONTROL_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                          {isEditMode ? t.edittablemodal606 : t.createtablemodal504}
                        </label>
                        <select
                          value={field.constraintType}
                          onChange={(e) => updateField(field.id, { constraintType: e.target.value as 'none' | 'primary' | 'index' | 'unique' })}
                          disabled={loading}
                          className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                          style={fieldSelectStyle}
                        >
                          <option value="none">None</option>
                          <option value="primary">Primary Key</option>
                          <option value="index">Index</option>
                          <option value="unique">Unique</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeField(field.id)}
                          disabled={loading || fields.length <= 1}
                          className="disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
                          style={{ color: colors.errorText }}
                          title={t.createtablemodal497}
                        >
                          <i className="pi pi-trash"></i>
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Display State | Generation Mode | Comment */}
                    <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 mb-3">
                      <div className="lg:col-span-2">
                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                          {i18nExtra.tablemodal_field_display_state || 'Display State'}
                        </label>
                        <select
                          value={field.displayState}
                          onChange={(e) => updateField(field.id, { displayState: e.target.value as DisplayState })}
                          disabled={loading}
                          className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                          style={fieldSelectStyle}
                        >
                          {DISPLAY_STATE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="lg:col-span-2">
                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                          {i18nExtra.tablemodal_field_generation_mode || 'Generation Mode'}
                        </label>
                        <select
                          value={field.generationMode}
                          onChange={(e) => updateField(field.id, { generationMode: e.target.value as GenerationMode })}
                          disabled={loading}
                          className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                          style={fieldSelectStyle}
                        >
                          {GENERATION_MODE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="lg:col-span-3 flex items-end gap-4">
                        <label className="flex items-center text-xs" style={{ color: colors.textMuted }}>
                          <input
                            type="checkbox"
                            checked={field.nullable}
                            onChange={(e) => updateField(field.id, { nullable: e.target.checked })}
                            disabled={loading}
                            className="mr-1"
                          />
                          {t.createtablemodal560}
                        </label>
                        <label className="flex items-center text-xs" style={{ color: colors.textMuted }}>
                          <input
                            type="checkbox"
                            checked={field.unsigned}
                            onChange={(e) => updateField(field.id, { unsigned: e.target.checked })}
                            disabled={loading}
                            className="mr-1"
                          />
                          {t.createtablemodal570}
                        </label>
                        <label className="flex items-center text-xs" style={{ color: colors.textMuted }}>
                          <input
                            type="checkbox"
                            checked={field.autoIncrement}
                            onChange={(e) => updateField(field.id, { autoIncrement: e.target.checked })}
                            disabled={loading}
                            className="mr-1"
                          />
                          {isEditMode ? t.edittablemodal682 : t.createtablemodal580}
                        </label>
                      </div>
                    </div>

                    {/* Row 3: Comment (full width) */}
                    <div className="mb-3">
                      <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                        {isEditMode ? t.edittablemodal640 : t.createtablemodal538}
                      </label>
                      <input
                        type="text"
                        value={field.comment}
                        onChange={(e) => updateField(field.id, { comment: e.target.value })}
                        disabled={loading}
                        className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                        style={fieldSelectStyle}
                        placeholder={isEditMode ? t.edittablemodal621 : t.createtablemodal546}
                      />
                    </div>

                    {/* Row 4: Link fields - only for COMBOBOX/LISTBOX/RADIOBUTTONS */}
                    {(field.controlType === 'COMBOBOX' || field.controlType === 'LISTBOX' || field.controlType === 'RADIOBUTTONS') && (
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mt-2 pt-2" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                        <div>
                          <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                            {isEditMode ? t.edittablemodal692 : t.createtablemodal590}
                          </label>
                          <select
                            value={field.linkTable}
                            onChange={(e) => updateField(field.id, { linkTable: e.target.value, linkField: '', linkDisplayField: '', linkOrderField: '' })}
                            disabled={loading}
                            className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                            style={fieldSelectStyle}
                          >
                            <option value="">{isEditMode ? t.edittablemodal700 : t.createtablemodal598}</option>
                            {availableTables.map(tblName => (
                              <option key={tblName} value={tblName}>{tblName}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                            {isEditMode ? t.edittablemodal709 : t.createtablemodal607}
                          </label>
                          <select
                            value={field.linkField}
                            onChange={(e) => updateField(field.id, { linkField: e.target.value })}
                            disabled={loading || !field.linkTable}
                            className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                            style={fieldSelectStyle}
                          >
                            <option value="">{isEditMode ? t.edittablemodal717 : t.createtablemodal615}</option>
                            {(linkFieldOptions[field.linkTable] || []).map(fieldName => (
                              <option key={fieldName} value={fieldName}>{fieldName}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                            {isEditMode ? t.edittablemodal726 : t.createtablemodal624}
                          </label>
                          <select
                            value={field.linkDisplayField}
                            onChange={(e) => updateField(field.id, { linkDisplayField: e.target.value })}
                            disabled={loading || !field.linkTable}
                            className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                            style={fieldSelectStyle}
                          >
                            <option value="">{isEditMode ? t.edittablemodal734 : t.createtablemodal632}</option>
                            {(linkFieldOptions[field.linkTable] || []).map(fieldName => (
                              <option key={fieldName} value={fieldName}>{fieldName}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                            {isEditMode ? t.edittablemodal743 : t.createtablemodal641}
                          </label>
                          <select
                            value={field.linkOrderField}
                            onChange={(e) => updateField(field.id, { linkOrderField: e.target.value })}
                            disabled={loading || !field.linkTable}
                            className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                            style={fieldSelectStyle}
                          >
                            <option value="">{isEditMode ? t.edittablemodal751 : t.createtablemodal649}</option>
                            {(linkFieldOptions[field.linkTable] || []).map(fieldName => (
                              <option key={fieldName} value={fieldName}>{fieldName}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                            {isEditMode ? t.edittablemodal760 : t.createtablemodal658}
                          </label>
                          <select
                            value={field.linkOrderDirection}
                            onChange={(e) => updateField(field.id, { linkOrderDirection: e.target.value as 'ASC' | 'DESC' })}
                            disabled={loading}
                            className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                            style={fieldSelectStyle}
                          >
                            <option value="ASC">ASC</option>
                            <option value="DESC">DESC</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Row 5: Edit Mask */}
                    <div className="mt-2" style={{ borderTop: `1px solid ${colors.borderPrimary}`, paddingTop: 6 }}>
                      <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                        Edit Mask
                      </label>
                      <input
                        type="text"
                        list={`editmask-presets-${field.id}`}
                        value={field.editmask || ''}
                        onChange={(e) => updateField(field.id, { editmask: e.target.value })}
                        placeholder="Select preset or type custom mask..."
                        disabled={loading}
                        className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                        style={{ ...fieldSelectStyle, fontSize: 11 }}
                      />
                      <datalist id={`editmask-presets-${field.id}`}>
                        {(editmaskPresets || []).map((p) => (
                          <option key={p.key} value={p.mask}>{p.label}</option>
                        ))}
                      </datalist>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabPanel>
        </TabView>

        {error && (
          <div className="rounded-lg p-3 mt-3" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}` }}>
            <p className="text-sm" style={{ color: colors.errorText }}>{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 mt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 rounded transition-colors hover:opacity-90"
            style={{ backgroundColor: isEditMode ? colors.bgTertiary : colors.buttonPrimary, color: isEditMode ? colors.textPrimary : colors.textInverse }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !tableName.trim()}
            className="px-4 py-2 text-white rounded transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{ backgroundColor: colors.accent }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{isEditMode ? t.edittablemodal805 : t.createtablemodal702}</span>
              </>
            ) : (
              <>
                <i className="pi pi-check"></i>
                <span>{isEditMode ? t.edittablemodal810 : t.createtablemodal707}</span>
              </>
            )}
          </button>
        </div>
      </form>

      <style>{`
        .table-modal input::placeholder,
        .table-modal textarea::placeholder {
          color: var(--theme-text-muted);
          opacity: 0.7;
        }
        .table-modal select option {
          background-color: var(--theme-bg-secondary);
          color: var(--theme-text-primary);
        }
        .table-modal .p-tabview-nav {
          background-color: var(--theme-bg-secondary) !important;
          border-color: var(--theme-border-primary) !important;
        }
        .table-modal .p-tabview-panels {
          background-color: var(--theme-bg-secondary) !important;
          padding-top: 1rem !important;
        }
      `}</style>
    </Dialog>
  );
}
