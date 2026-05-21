import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { TabPanel } from 'primereact/tabview';
import TabViewSideMenu from '@/Components/TabViewSideMenu';
import { SchemaTable, DisplayState, GenerationMode, apiClient } from '@/lib/api';
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
  // Default value: null means the column has no default (or DEFAULT NULL when
  // the column is nullable); '' is a valid default (empty string). The NULL
  // checkbox in the UI toggles between null and '' so the user can distinguish
  // "no value at all" from "empty default".
  defaultValue: string | null;
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

/**
 * Normalise the `translations` payload from /api/schema-translations/item/{name}
 * into a flat { langCode: translated_text } map.
 *
 * The backend's getAllTranslationsForItem() returns a Laravel Collection
 * keyed by language code, which JSON-encodes as an OBJECT:
 *   {"de": {"code":"de","translated_text":"Email"}, "en": {...}}
 *
 * Our earlier code assumed an ARRAY (`forEach((t) => ...)`), which on an
 * object silently no-ops — leaving every caption field empty even when
 * translations existed in the DB. This helper accepts both shapes:
 *   - object (current backend): iterate values
 *   - array (defensive, in case wire format reverts): iterate entries
 */
function extractTranslationsToMap(raw: unknown, target: Record<string, string>): void {
  if (!raw || typeof raw !== 'object') return;
  if (Array.isArray(raw)) {
    raw.forEach((t: any) => {
      if (t && typeof t.code === 'string' && typeof t.translated_text === 'string') {
        target[t.code] = t.translated_text;
      }
    });
    return;
  }
  Object.entries(raw as Record<string, any>).forEach(([langCode, t]) => {
    if (t && typeof t.translated_text === 'string') {
      target[langCode] = t.translated_text;
    }
  });
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
    defaultValue: null,
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

  // ---- Caption translations (Fields tab) -----------------------------
  // Active languages (loaded once when the modal opens) and the language
  // currently being edited in the detail pane's caption row.
  const [availableLanguages, setAvailableLanguages] = useState<Array<{ code: string; name: string; native_name?: string }>>([]);
  const [captionLangCode, setCaptionLangCode] = useState<string>('en');
  // Captions per field per language. Lazy-loaded the first time a field is
  // selected (loadedCaptionFieldIdsRef ensures we hit /api once per field
  // per modal open). Saved via /api/schema-translations/bulk-update inside
  // handleSubmit, keyed by `tableName.fieldName`.
  const [captions, setCaptions] = useState<Record<string, Record<string, string>>>({});
  const loadedCaptionFieldIdsRef = React.useRef<Set<string>>(new Set());

  // Fields tab: which row in the left-side table is currently selected.
  // When null, the right-side detail pane is hidden and the list spans the
  // full panel width — keeps the screen tidy when the user is just scanning.
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const selectedField = React.useMemo(
    () => fields.find(f => f.id === selectedFieldId) || null,
    [fields, selectedFieldId]
  );
  const selectedFieldIndex = React.useMemo(
    () => fields.findIndex(f => f.id === selectedFieldId),
    [fields, selectedFieldId]
  );

  useEffect(() => {
    if (!isOpen) return;
    apiClient.get('/form-sets')
      .then(data => {
        if (data?.data) {
          setAvailableFormSets(data.data.map((fs: { id: number; name: string }) => ({ id: fs.id, name: fs.name })));
        }
      })
      .catch(() => {});
    apiClient.get('/report-patterns')
      .then(data => {
        if (data?.data) {
          setAvailableReportPatterns(data.data.map((rp: { id: number; name: string }) => ({ id: rp.id, name: rp.name })));
        }
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const targetLang = localStorage.getItem('scoriet_target_language') || 'html';
    apiClient.get(`/editmask-presets?language=${targetLang}`)
      .then(data => { if (data?.presets) setEditmaskPresets(data.presets); })
      .catch(() => {});
  }, [isOpen]);

  // Load active languages once per modal open, for the caption-translation
  // dropdown in the Fields tab. /api/active-languages returns the array
  // directly (not wrapped) — matches the existing pattern in
  // DatabaseManagementPanel + DebugManualGeneratorPanel.
  useEffect(() => {
    if (!isOpen) return;
    apiClient.get('/active-languages')
      .then((data: unknown) => {
        const arr = Array.isArray(data) ? (data as Array<{ code: string; name: string; native_name?: string }>) : [];
        setAvailableLanguages(arr);
        // Default to the user's UI language if it's in the list, otherwise
        // first entry, otherwise stay on 'en'. Keeps the user editing the
        // language they likely care about first.
        const ui = (localStorage.getItem('scoriet_language') || 'en').toLowerCase();
        if (arr.some(l => l.code === ui)) setCaptionLangCode(ui);
        else if (arr.length > 0) setCaptionLangCode(arr[0].code);
      })
      .catch(() => {});
    // Reset caption cache when modal closes (so next open starts fresh
    // and picks up any external edits made via the translations panel).
    return () => {
      setCaptions({});
      loadedCaptionFieldIdsRef.current = new Set();
    };
  }, [isOpen]);

  // Preload caption translations for EVERY field as soon as the modal opens
  // with a real table+field set. This means when the user clicks a row in
  // the field list, the caption input is already populated for every
  // language — no spinner, no lazy round-trip per click.
  //
  // Runs only ONCE per modal-open (per table) via the bulkPreloadedRef
  // guard. It also still serves as the loader for fields that already
  // exist when the modal opens. Newly-added fields (Add button) fall
  // through to the per-field lazy-load below.
  const bulkPreloadedRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!isOpen) {
      bulkPreloadedRef.current = null;
      return;
    }
    if (!tableName.trim() || fields.length === 0) return;
    // Re-preload when the table name changes (e.g., user retitled mid-edit)
    // because translations are keyed by the new name.
    if (bulkPreloadedRef.current === tableName) return;
    bulkPreloadedRef.current = tableName;

    // Fire all field fetches in parallel; merge results as they arrive.
    // Promise.allSettled so one 404 doesn't block the rest.
    const targets = fields.filter(f => f.name.trim());
    targets.forEach(f => loadedCaptionFieldIdsRef.current.add(f.id));

    Promise.allSettled(targets.map(f =>
      apiClient.get(`/schema-translations/item/${encodeURIComponent(`${tableName}.${f.name}`)}`)
        .then((data: unknown) => {
          const payload = data as { translations?: unknown } | null;
          const map: Record<string, string> = {};
          // Backend returns `translations` as a Collection keyed by language
          // code (so JSON-encoded as an object: {de: {...}, en: {...}}),
          // NOT as a plain array. Handle both shapes defensively in case the
          // wire format ever changes back to a list.
          extractTranslationsToMap(payload?.translations, map);
          return { fieldId: f.id, map };
        })
    )).then(results => {
      setCaptions(prev => {
        const next = { ...prev };
        results.forEach(r => {
          if (r.status === 'fulfilled') {
            next[r.value.fieldId] = { ...(next[r.value.fieldId] || {}), ...r.value.map };
          }
        });
        return next;
      });
    });
  }, [isOpen, tableName, fields]);

  // Lazy-load caption translations for the currently-selected field. This
  // handles two cases the bulk preload above can't: (1) the user clicks a
  // field that was added AFTER modal open via the "+ Add" button — bulk
  // preload already ran, but this field wasn't in `fields` at that point;
  // (2) the user renames a field — translations under the new name need
  // a fresh fetch since the bulk preload used the old name.
  useEffect(() => {
    if (!isOpen) return;
    if (!selectedFieldId) return;
    if (loadedCaptionFieldIdsRef.current.has(selectedFieldId)) return;
    const field = fields.find(f => f.id === selectedFieldId);
    if (!field || !field.name.trim() || !tableName.trim()) return;
    // Mark as "in flight" up-front so rapid clicks don't fire duplicate
    // requests for the same field while the first one is pending.
    loadedCaptionFieldIdsRef.current.add(selectedFieldId);
    const itemName = `${tableName}.${field.name}`;
    apiClient.get(`/schema-translations/item/${encodeURIComponent(itemName)}`)
      .then((data: unknown) => {
        const payload = data as { translations?: unknown } | null;
        const map: Record<string, string> = {};
        // Same object-vs-array dual handling as the bulk preload above.
        extractTranslationsToMap(payload?.translations, map);
        setCaptions(prev => ({ ...prev, [selectedFieldId]: { ...(prev[selectedFieldId] || {}), ...map } }));
      })
      .catch(() => {
        // Allow a retry on next select if the network call failed.
        loadedCaptionFieldIdsRef.current.delete(selectedFieldId);
      });
  }, [isOpen, selectedFieldId, fields, tableName]);

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
          // default_value is nullable on the backend; preserve null vs ''
          // so the UI's NULL checkbox can show the right state.
          defaultValue: field.default_value === undefined ? null : field.default_value,
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
      const data = await apiClient.get(`/schema-versions/${svId}`);
      const schemaVersion = data.schema_version || data;
      const tables = schemaVersion.tables?.map((tbl: { table_name: string }) => tbl.table_name) || [];
      setAvailableTables(tables);

      const fieldOpts: {[key: string]: string[]} = {};
      schemaVersion.tables?.forEach((tbl: { table_name: string; fields?: { field_name: string }[] }) => {
        fieldOpts[tbl.table_name] = tbl.fields?.map((f) => f.field_name) || [];
      });
      setLinkFieldOptions(fieldOpts);
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
      defaultValue: null,
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

  // Reorder helpers — operate on the currently-selected field. Because the
  // backend assigns `field_order` from the array index on save, swapping
  // positions in this array is all that's needed; no extra metadata to track.
  // The selection stays on the moved field (selectedFieldId is field-ID-
  // based, not index-based) so the highlight visually "follows" the row.
  const swapFields = (i: number, j: number) => {
    if (i < 0 || j < 0 || i >= fields.length || j >= fields.length || i === j) return;
    const next = [...fields];
    [next[i], next[j]] = [next[j], next[i]];
    setFields(next);
  };
  const moveFieldFirst = () => {
    if (selectedFieldIndex <= 0) return;
    const next = [...fields];
    const [moved] = next.splice(selectedFieldIndex, 1);
    next.unshift(moved);
    setFields(next);
  };
  const moveFieldLast = () => {
    if (selectedFieldIndex < 0 || selectedFieldIndex >= fields.length - 1) return;
    const next = [...fields];
    const [moved] = next.splice(selectedFieldIndex, 1);
    next.push(moved);
    setFields(next);
  };
  const moveFieldPrev = () => swapFields(selectedFieldIndex, selectedFieldIndex - 1);
  const moveFieldNext = () => swapFields(selectedFieldIndex, selectedFieldIndex + 1);
  const deleteSelectedField = () => {
    if (!selectedField || fields.length <= 1) return;
    const idx = selectedFieldIndex;
    setFields(fields.filter(f => f.id !== selectedField.id));
    // Move selection to the previous row (or first row if we deleted index 0)
    // so the user can keep clicking through without re-clicking the table.
    const nextIdx = Math.max(0, idx - 1);
    const newSelected = fields.filter(f => f.id !== selectedField.id)[nextIdx];
    setSelectedFieldId(newSelected ? newSelected.id : null);
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

    // Persist caption translations for every field whose dict has at least
    // one entry. The backend's bulk-update endpoint is upsert-by-(item_name,
    // code), so re-sending identical values is harmless idempotency, and we
    // don't have to track a "dirty" flag per language.
    //
    // Fire-and-forget on purpose: a translation save failure must not block
    // the table create/update. If the bulk-update fails, the user keeps an
    // unsaved caption in memory; they'll notice the missing translation in
    // the generated output and can retry. Blocking the modal would be worse
    // — they'd lose all their field edits with no way to recover.
    fields.forEach(f => {
      const fieldCaptions = captions[f.id];
      if (!fieldCaptions || !f.name.trim()) return;
      const translations = Object.entries(fieldCaptions)
        .filter(([, text]) => text && text.trim())
        .map(([code, translated_text]) => ({ code, translated_text }));
      if (translations.length === 0) return;
      apiClient.post('/schema-translations/bulk-update', {
        item_name: `${tableName}.${f.name}`,
        translations,
      }).catch(() => { /* best-effort */ });
    });

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
          {/* The i18n string now ends at the "Edit Table: " prefix; the actual
           * table name comes from the live `table` prop and is interpolated
           * here. (Earlier the placeholder "{table?.table_name}" sat inside
           * the translation string itself and was rendered as literal text.) */}
          {isEditMode ? <>{t.edittablemodal404}{table?.table_name}</> : t.createtablemodal302}
        </span>
      }
      visible={isOpen}
      onHide={handleClose}
      /* Fixed height (85vh / 95vh when maximized) so the inner flex layout
       * has a concrete height to distribute. `height: auto` would collapse
       * the TabViewSideMenu wrapper because flex-1 + min-h-0 only work
       * meaningfully inside a constrained container. */
      style={{ width: isMaximized ? '95vw' : '1400px', height: isMaximized ? '95vh' : '85vh' }}
      /* contentStyle is intentionally pared down — global .p-dialog styling
       * + the :has(.p-tabview-vertical-wrapper) override in styles.css set
       * background, padding, and overflow. headerStyle removed for the same
       * reason: the global purple-gradient header rule now handles it. */
      contentStyle={{ padding: '0' }}
      modal
      closable
      draggable
      resizable
      maximizable
      maximized={isMaximized}
      onMaximize={(e) => setIsMaximized(e.maximized)}
      className="p-dialog-custom table-modal"
    >
      {/* Outer flex-column container shares the dialog-content height across:
       *   [1] TabViewSideMenu region  – flex-1, fills available space
       *   [2] error banner            – flex-shrink-0, natural height when shown
       *   [3] footer buttons          – flex-shrink-0
       * Previously the form carried a hard `maxHeight: 75vh / 95vh` calc;
       * that's no longer needed once the dialog itself supplies a fixed
       * height and the panels region scrolls internally. */}
      <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
        <div className="flex-1 min-h-0">
        <TabViewSideMenu
          storageKey="tableModal"
          defaultWidth={200}
          activeIndex={activeTab}
          onTabChange={(e: { index: number }) => setActiveTab(e.index)}
        >
          {/* ------------------ TAB 1: Table Settings ------------------ */}
          <TabPanel header={<span><i className="pi pi-cog mr-2" />{i18nExtra.tablemodal_tab_settings || 'Table Settings'}</span>}>
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
          {/* contentClassName="panel-fill" — this tab pins the toolbar at
           * the top and runs an internal scroll on the split list/detail
           * area below. See the .panel-fill rule in Panels/styles.css.
           *
           * Layout (NEW): toolbar across the top, then a horizontal split:
           *   LEFT  — compact field table (name/type/length/key icon).
           *           Clicking a row selects that field.
           *   RIGHT — full detail editor for the selected field. Hidden
           *           when nothing is selected so the list spans the full
           *           panel width, which keeps the screen un-cluttered. */}
          <TabPanel
            header={<span><i className="pi pi-list mr-2" />{`${i18nExtra.tablemodal_tab_fields || 'Fields'} (${fields.length})`}</span>}
            contentClassName="panel-fill"
          >
            <div className="flex flex-col h-full min-h-0">
              {/* Toolbar: title + per-row actions. Reorder buttons (first/
               * prev/next/last) and delete operate on `selectedField`, so
               * they're disabled when no row is selected — saves a confusing
               * "click did nothing" state. */}
              <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <label className="block text-sm font-medium" style={{ color: colors.textSecondary }}>
                  {isEditMode ? t.edittablemodal505 : t.createtablemodal403} ({fields.length})
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={addField}
                    disabled={loading}
                    className="px-2 py-1 rounded text-white text-xs flex items-center gap-1 hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: colors.accent }}
                    title={isEditMode ? t.edittablemodal515 : t.createtablemodal413}
                  >
                    <i className="pi pi-plus" style={{ fontSize: '11px' }}></i>
                    <span>{isEditMode ? t.edittablemodal515 : t.createtablemodal413}</span>
                  </button>
                  <button
                    type="button"
                    onClick={deleteSelectedField}
                    disabled={loading || !selectedField || fields.length <= 1}
                    className="px-2 py-1 rounded text-xs flex items-center gap-1 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ backgroundColor: colors.errorBg, color: colors.errorText, border: `1px solid ${colors.errorBorder}` }}
                    title="Delete selected field"
                  >
                    <i className="pi pi-trash" style={{ fontSize: '11px' }}></i>
                  </button>
                  <div className="w-px h-5 mx-1" style={{ backgroundColor: colors.borderPrimary }}></div>
                  <button
                    type="button"
                    onClick={moveFieldFirst}
                    disabled={loading || !selectedField || selectedFieldIndex <= 0}
                    className="px-2 py-1 rounded text-xs hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}` }}
                    title="Move to first"
                  >
                    <i className="pi pi-angle-double-up" style={{ fontSize: '11px' }}></i>
                  </button>
                  <button
                    type="button"
                    onClick={moveFieldPrev}
                    disabled={loading || !selectedField || selectedFieldIndex <= 0}
                    className="px-2 py-1 rounded text-xs hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}` }}
                    title="Move up"
                  >
                    <i className="pi pi-angle-up" style={{ fontSize: '11px' }}></i>
                  </button>
                  <button
                    type="button"
                    onClick={moveFieldNext}
                    disabled={loading || !selectedField || selectedFieldIndex < 0 || selectedFieldIndex >= fields.length - 1}
                    className="px-2 py-1 rounded text-xs hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}` }}
                    title="Move down"
                  >
                    <i className="pi pi-angle-down" style={{ fontSize: '11px' }}></i>
                  </button>
                  <button
                    type="button"
                    onClick={moveFieldLast}
                    disabled={loading || !selectedField || selectedFieldIndex < 0 || selectedFieldIndex >= fields.length - 1}
                    className="px-2 py-1 rounded text-xs hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}` }}
                    title="Move to last"
                  >
                    <i className="pi pi-angle-double-down" style={{ fontSize: '11px' }}></i>
                  </button>
                </div>
              </div>

              {/* Split: list + detail. When no field is selected, the list
               * takes the full width. When a field is selected, list shrinks
               * to ~420px (enough for name+type+length+key columns) and the
               * detail pane fills the rest. */}
              <div className="flex-1 min-h-0 flex gap-3">
                {/* LEFT — Field list table. 11px font keeps it dense, fixed
                 * widths on type/length/key let the name column take the
                 * rest of the row. */}
                <div
                  className="flex flex-col overflow-y-auto rounded"
                  style={{
                    width: selectedField ? '420px' : '100%',
                    flexShrink: 0,
                    border: `1px solid ${colors.borderPrimary}`,
                    backgroundColor: colors.bgTertiary,
                    fontSize: '11px',
                  }}
                >
                  <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: colors.bgSecondary, zIndex: 1 }}>
                      <tr>
                        <th className="px-2 py-1 text-left font-medium" style={{ color: colors.textSecondary, borderBottom: `1px solid ${colors.borderPrimary}` }}>
                          {isEditMode ? t.edittablemodal526 : t.createtablemodal424}
                        </th>
                        <th className="px-2 py-1 text-left font-medium" style={{ color: colors.textSecondary, width: 90, borderBottom: `1px solid ${colors.borderPrimary}` }}>
                          {isEditMode ? t.edittablemodal540 : t.createtablemodal438}
                        </th>
                        <th className="px-2 py-1 text-right font-medium" style={{ color: colors.textSecondary, width: 60, borderBottom: `1px solid ${colors.borderPrimary}` }}>
                          {isEditMode ? 'Length' : t.createtablemodal463}
                        </th>
                        <th className="px-2 py-1 text-center font-medium" style={{ color: colors.textSecondary, width: 40, borderBottom: `1px solid ${colors.borderPrimary}` }}>
                          Key
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field) => {
                        const isSelected = field.id === selectedFieldId;
                        // Key symbol legend:
                        //   🗝  Primary key
                        //   ①  Unique constraint
                        //   ⧉  Non-unique index ("duplicates" allowed)
                        const keySymbol =
                          field.constraintType === 'primary' ? '🗝' :
                          field.constraintType === 'unique'  ? '①' :
                          field.constraintType === 'index'   ? '⧉' : '';
                        return (
                          <tr
                            key={field.id}
                            onClick={() => setSelectedFieldId(field.id)}
                            style={{
                              cursor: 'pointer',
                              backgroundColor: isSelected ? colors.accent : 'transparent',
                              color: isSelected ? '#fff' : colors.textPrimary,
                            }}
                          >
                            <td className="px-2 py-1" style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}>{field.name || <span style={{ opacity: 0.5 }}>(unnamed)</span>}</td>
                            <td className="px-2 py-1" style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}>{field.type}</td>
                            <td className="px-2 py-1 text-right" style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}>{field.length ?? '–'}</td>
                            <td className="px-2 py-1 text-center" style={{ borderBottom: `1px solid ${colors.borderPrimary}`, fontSize: '14px' }}>{keySymbol}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* RIGHT — Detail pane, only when a field is selected. Same
                 * inputs as the old in-row card, just vertically stacked so
                 * everything fits in the narrower column. */}
                {selectedField && (() => {
                  // Alias so the existing per-field input bindings below
                  // (carried over from the old in-row layout, hundreds of
                  // references to `field.X` / `updateField(field.id, ...)`)
                  // keep working without a rename pass.
                  const field = selectedField;
                  return (
                  <div
                    className="flex-1 min-w-0 overflow-y-auto rounded p-4"
                    style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}
                  >
                    {/* (a) Field name — wide, full width. */}
                    <div className="mb-3">
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

                    {/* (b) Language picker + caption for that language. The
                     * caption is persisted to schema_translations by
                     * `item_name = tableName.fieldName` on Save. Local state
                     * lives in `captions[fieldId][langCode]`. */}
                    <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: '140px 1fr' }}>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                          {i18nExtra.tablemodal_caption_language || 'Language'}
                        </label>
                        <select
                          value={captionLangCode}
                          onChange={(e) => setCaptionLangCode(e.target.value)}
                          disabled={loading || availableLanguages.length === 0}
                          className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                          style={fieldSelectStyle}
                        >
                          {availableLanguages.length === 0 ? (
                            <option value="">—</option>
                          ) : (
                            availableLanguages.map(l => (
                              <option key={l.code} value={l.code}>
                                {l.code.toUpperCase()} — {l.native_name || l.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                          {i18nExtra.tablemodal_caption || 'Caption'}
                        </label>
                        <input
                          type="text"
                          value={captions[field.id]?.[captionLangCode] || ''}
                          onChange={(e) => setCaptions(prev => ({
                            ...prev,
                            [field.id]: { ...(prev[field.id] || {}), [captionLangCode]: e.target.value },
                          }))}
                          disabled={loading || !captionLangCode || !field.name.trim() || !tableName.trim()}
                          className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                          style={fieldSelectStyle}
                          placeholder={
                            !tableName.trim() || !field.name.trim()
                              ? (i18nExtra.tablemodal_caption_needs_names || 'Set table + field name first')
                              : (i18nExtra.tablemodal_caption_placeholder || 'Translated caption shown in generated UI')
                          }
                        />
                      </div>
                    </div>

                    {/* (c) Comment — full width. */}
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

                    {/* (d) Type | Length | Constraint | [Auto-Inc | Null |
                     * Unsigned grouped]. Uses an explicit 12-col grid (no
                     * `lg:` responsive prefix) because at 1400px modal width
                     * the right pane is still under Tailwind's 1024px `lg`
                     * breakpoint and would otherwise collapse to a single
                     * column. Checkbox labels sit ABOVE the box so they
                     * don't read as "stuck to" the input. */}
                    <div className="grid grid-cols-12 gap-3 mb-3">
                      <div className="col-span-3">
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
                      <div className="col-span-2">
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
                      <div className="col-span-3">
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
                      {/* The three flag checkboxes share the remaining 4
                       * columns, laid out as 3 equal cells with label-above-
                       * checkbox stacks. text-center keeps the label and
                       * checkbox vertically aligned over the same axis. */}
                      <div className="col-span-4 grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                            {isEditMode ? t.edittablemodal682 : t.createtablemodal580}
                          </label>
                          <input
                            type="checkbox"
                            checked={field.autoIncrement}
                            onChange={(e) => updateField(field.id, { autoIncrement: e.target.checked })}
                            disabled={loading}
                          />
                        </div>
                        <div className="text-center">
                          <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                            {t.createtablemodal560}
                          </label>
                          <input
                            type="checkbox"
                            checked={field.nullable}
                            onChange={(e) => updateField(field.id, { nullable: e.target.checked })}
                            disabled={loading}
                          />
                        </div>
                        <div className="text-center">
                          <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                            {t.createtablemodal570}
                          </label>
                          <input
                            type="checkbox"
                            checked={field.unsigned}
                            onChange={(e) => updateField(field.id, { unsigned: e.target.checked })}
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>

                    {/* (e) Default Value group. The outer "Default Value"
                     * header makes it explicit that the NULL checkbox refers
                     * to THIS default value, not to the column's nullability
                     * (which is a separate flag a row above). NULL = no
                     * default at all (defaultValue=null); un-checking gives
                     * an empty-string default the user can then edit. */}
                    <div className="mb-3">
                      <div className="text-xs mb-1" style={{ color: colors.textMuted }}>
                        {i18nExtra.tablemodal_default_value || 'Default Value'}
                      </div>
                      <div className="grid gap-3" style={{ gridTemplateColumns: '90px 1fr' }}>
                        <div className="text-center">
                          <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>NULL</label>
                          <input
                            type="checkbox"
                            checked={field.defaultValue === null}
                            onChange={(e) => updateField(field.id, { defaultValue: e.target.checked ? null : '' })}
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                            {i18nExtra.tablemodal_default_value_label || 'Value'}
                          </label>
                          <input
                            type="text"
                            value={field.defaultValue ?? ''}
                            onChange={(e) => updateField(field.id, { defaultValue: e.target.value })}
                            disabled={loading || field.defaultValue === null}
                            className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                            style={{ ...fieldSelectStyle, opacity: field.defaultValue === null ? 0.5 : 1 }}
                            placeholder={field.defaultValue === null ? 'NULL' : (i18nExtra.tablemodal_default_value_placeholder || 'e.g., 0, ""')}
                          />
                        </div>
                      </div>
                    </div>

                    {/* (f) Display State | Generation Mode. */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                      <div>
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
                      <div>
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
                    </div>

                    {/* (g) Control Type + Edit Mask. */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
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
                          style={fieldSelectStyle}
                        />
                        <datalist id={`editmask-presets-${field.id}`}>
                          {(editmaskPresets || []).map((p) => (
                            <option key={p.key} value={p.mask}>{p.label}</option>
                          ))}
                        </datalist>
                      </div>
                    </div>

                    {/* (h) Link table — only for COMBOBOX / LISTBOX /
                     * RADIOBUTTONS. 5 fields: table, value (linkField),
                     * display, order, direction. */}
                    {(field.controlType === 'COMBOBOX' || field.controlType === 'LISTBOX' || field.controlType === 'RADIOBUTTONS') && (
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 pt-3" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
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
                  </div>
                  );
                })()}
              </div>
            </div>
          </TabPanel>
        </TabViewSideMenu>
        </div>

        {error && (
          <div className="rounded-lg p-3 mx-6 mt-3 flex-shrink-0" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}` }}>
            <p className="text-sm" style={{ color: colors.errorText }}>{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 p-6 pt-4 flex-shrink-0" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
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
        /* .table-modal .p-tabview-nav / .p-tabview-panels overrides removed —
         * the vertical TabView styling now lives centrally in
         * Components/Panels/styles.css under .p-tabview-vertical, so any
         * per-modal redeclaration would just fight the global rules. */
      `}</style>
    </Dialog>
  );
}
