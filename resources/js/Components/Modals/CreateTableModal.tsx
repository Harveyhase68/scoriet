import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

interface TableField {
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
}

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTableCreated: (tableName: string, fileKeyName: string, fileNameRenamed: string, fileNameShort: string, fields: TableField[]) => void;
  loading?: boolean;
  schemaVersionId?: number;
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

/**
 * Auto-detect control type based on field type and name
 */
function detectControlType(fieldType: string, fieldName: string, linkTable: string): string {
  // Explicit link? → COMBOBOX
  if (linkTable && linkTable.trim() !== '') return 'COMBOBOX';

  const lowerType = fieldType.toLowerCase();
  const lowerName = fieldName.toLowerCase();

  // By field type
  if (lowerType.includes('longtext')) return 'TEXTAREA';
  if (lowerType.includes('text') && !lowerType.includes('tinytext')) return 'TEXTAREA';
  if (lowerType === 'boolean' || lowerType === 'tinyint(1)') return 'CHECKBOX';
  if (lowerType.includes('datetime') || lowerType.includes('timestamp')) return 'DATETIMEPICKER';
  if (lowerType.includes('date')) return 'DATEPICKER';
  if (lowerType.includes('time') && !lowerType.includes('datetime')) return 'TIMEPICKER';

  // By field name pattern
  if (lowerName.endsWith('_id') && (lowerType === 'bigint' || lowerType === 'int')) return 'COMBOBOX';
  if (lowerName.includes('color') || lowerName.includes('colour')) return 'COLORPICKER';
  if (lowerName.includes('file') || lowerName.includes('upload') || lowerName.includes('attachment')) return 'FILEUPLOAD';

  // Default
  return 'TEXT';
}

export default function CreateTableModal({ isOpen, onClose, onTableCreated, loading = false, schemaVersionId }: CreateTableModalProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();

  const [tableName, setTableName] = useState('');
  const [fileKeyName, setFileKeyName] = useState('');
  const [fileNameRenamed, setFileNameRenamed] = useState('');
  const [fileNameShort, setFileNameShort] = useState('');
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [linkFieldOptions, setLinkFieldOptions] = useState<{[key: string]: string[]}>({});
  const [fields, setFields] = useState<TableField[]>([
    {
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
      linkOrderDirection: 'ASC'
    }
  ]);
  const [error, setError] = useState<string | null>(null);

  // Fetch available tables when modal opens
  React.useEffect(() => {
    if (isOpen && schemaVersionId) {
      fetchAvailableTables(schemaVersionId);
    }
  }, [isOpen, schemaVersionId]);

  // Fetch available tables from schema version
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
        const tables = schemaVersion.tables?.map((t: any) => t.table_name) || [];
        setAvailableTables(tables);

        // Build field options for each table
        const fieldOpts: {[key: string]: string[]} = {};
        schemaVersion.tables?.forEach((t: any) => {
          fieldOpts[t.table_name] = t.fields?.map((f: any) => f.field_name) || [];
        });
        setLinkFieldOptions(fieldOpts);
      }
    } catch {
      // Error fetching tables
    }
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
      linkOrderDirection: 'ASC'
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

  const handleFileKeyNameChange = (value: string) => {
    setFileKeyName(value);
  };

  // Generate available keys from fields that are actually keys (Primary Key, Index, Unique)
  const getAvailableKeys = () => {
    const keyFields = fields
      .filter(field =>
        field.name.trim().length > 0 &&
        field.constraintType !== 'none'
      )
      .map(field => field.name.trim());

    // Return only fields that are actual keys, remove duplicates and sort
    return [...new Set(keyFields)].sort();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!tableName.trim()) {
      setError(t.createtablemodal189);
      return;
    }

    if (fields.some(field => !field.name.trim())) {
      setError(t.createtablemodal194);
      return;
    }

    // Check for duplicate field names
    const fieldNames = fields.map(f => f.name.toLowerCase());
    if (fieldNames.length !== new Set(fieldNames).size) {
      setError(t.createtablemodal201);
      return;
    }

    onTableCreated(tableName, fileKeyName, fileNameRenamed, fileNameShort, fields);
  };

  // Generate short file name from table name
  const generateFileNameShort = (tableName: string): string => {
    if (!tableName.trim()) return '';

    // Remove numbers and underscores, split by underscore
    const cleanName = tableName.replace(/[0-9_]/g, ' ').trim();
    const words = cleanName.split(/\s+/).filter(word => word.length > 0);

    if (words.length === 0) return '';

    if (words.length === 1) {
      // Single word: take first 3 characters
      return words[0].substring(0, 3).toLowerCase();
    } else {
      // Multiple words: take first letter of each word, max 3
      return words.slice(0, 3).map(word => word.charAt(0).toLowerCase()).join('');
    }
  };

  const handleTableNameChange = (value: string) => {
    setTableName(value);
    // Auto-generate file name short
    const autoShort = generateFileNameShort(value);
    setFileNameShort(autoShort);
  };

  const resetForm = () => {
    setTableName('');
    setFileKeyName('');
    setFileNameRenamed('');
    setFileNameShort('');
    setFields([
      {
        id: '1',
        name: 'id',
        type: 'bigint',
        nullable: false,
        autoIncrement: true,
        constraintType: 'primary'
      }
    ]);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 999999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
      onClick={handleClose}
    >
      <div
        className="create-table-modal rounded-lg p-6 w-full max-w-4xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center" style={{ color: colors.textPrimary }}>
            <i className="pi pi-table mr-2"></i>
            Create New Table
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="transition-colors hover:opacity-80"
            style={{ color: colors.textMuted }}
          >
            <i className="pi pi-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Table Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                Table Name *
              </label>
              <input
                type="text"
                required
                value={tableName}
                onChange={(e) => handleTableNameChange(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                placeholder={t.createtablemodal300}
                maxLength={64}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                File Key Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fileKeyName}
                  onChange={(e) => handleFileKeyNameChange(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  File Name Renamed
                </label>
                <input
                  type="text"
                  value={fileNameRenamed}
                  onChange={(e) => setFileNameRenamed(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                  placeholder={t.createtablemodal339}
                  maxLength={100}
                />
                <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                  Used for template {'{file_name_renamed}'} variable
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  File Name Short
                </label>
                <input
                  type="text"
                  value={fileNameShort}
                  onChange={(e) => setFileNameShort(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                  placeholder="e.g., usr, prod"
                  maxLength={50}
                />
                <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                  Used for template {'{file_name_short}'} variable
                </div>
              </div>
            </div>
          </div>

          {/* Fields Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium" style={{ color: colors.textSecondary }}>
                Fields *
              </label>
              <button
                type="button"
                onClick={addField}
                disabled={loading}
                className="px-3 py-1 rounded text-white text-sm flex items-center space-x-1 hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: colors.accent }}
              >
                <i className="pi pi-plus"></i>
                <span>Add Field</span>
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {fields.map((field) => (
                <div key={field.id} className="rounded-lg p-4" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
                  {/* Row 1: Main field properties */}
                  <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 mb-3">
                    {/* Field Name - 2x größer */}
                    <div className="lg:col-span-2">
                      <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Name</label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                        disabled={loading}
                        className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                        style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                        placeholder={t.createtablemodal398}
                      />
                    </div>

                    {/* Data Type */}
                    <div>
                      <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Type</label>
                      <select
                        value={field.type}
                        onChange={(e) => {
                          const newType = e.target.value;
                          // Only auto-detect control type if no link table is set
                          if (!field.linkTable || field.linkTable.trim() === '') {
                            const newControlType = detectControlType(newType, field.name, '');
                            updateField(field.id, { type: newType, controlType: newControlType });
                          } else {
                            updateField(field.id, { type: newType });
                          }
                        }}
                        disabled={loading}
                        className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                        style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                      >
                        {DATA_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Length (for VARCHAR, CHAR, etc.) */}
                    <div>
                      <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Length</label>
                      <input
                        type="number"
                        value={field.length || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateField(field.id, { length: value ? parseInt(value, 10) : null });
                        }}
                        disabled={loading}
                        placeholder="e.g., 50"
                        className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                        style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                      />
                    </div>

                    {/* Control Type */}
                    <div>
                      <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Control</label>
                      <select
                        value={field.controlType}
                        onChange={(e) => {
                          const newControlType = e.target.value;
                          // Clear link fields when switching away from COMBOBOX/LISTBOX/RADIOBUTTONS
                          if (newControlType !== 'COMBOBOX' && newControlType !== 'LISTBOX' && newControlType !== 'RADIOBUTTONS') {
                            updateField(field.id, { controlType: newControlType, linkTable: '', linkField: '', linkDisplayField: '', linkOrderField: '', linkOrderDirection: 'ASC' });
                          } else {
                            updateField(field.id, { controlType: newControlType });
                          }
                        }}
                        disabled={loading}
                        className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                        style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                      >
                        {CONTROL_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Constraint Type */}
                    <div>
                      <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Constraint</label>
                      <select
                        value={field.constraintType}
                        onChange={(e) => updateField(field.id, { constraintType: e.target.value as 'none' | 'primary' | 'index' | 'unique' })}
                        disabled={loading}
                        className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                        style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                      >
                        <option value="none">None</option>
                        <option value="primary">Primary Key</option>
                        <option value="index">Index</option>
                        <option value="unique">Unique</option>
                      </select>
                    </div>

                    {/* Remove Button */}
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

                  {/* Row 2: Comment & Checkboxes */}
                  <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 mb-3">
                    {/* Comment - nimmt 4 Spalten */}
                    <div className="lg:col-span-4">
                      <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Comment</label>
                      <input
                        type="text"
                        value={field.comment}
                        onChange={(e) => updateField(field.id, { comment: e.target.value })}
                        disabled={loading}
                        className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                        style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                        placeholder="Field description..."
                      />
                    </div>

                    {/* Checkboxes - zusammen in den restlichen 3 Spalten */}
                    <div className="lg:col-span-3 flex items-end gap-4">
                      <label className="flex items-center text-xs" style={{ color: colors.textMuted }}>
                        <input
                          type="checkbox"
                          checked={field.nullable}
                          onChange={(e) => updateField(field.id, { nullable: e.target.checked })}
                          disabled={loading}
                          className="mr-1"
                        />
                        Nullable
                      </label>
                      <label className="flex items-center text-xs" style={{ color: colors.textMuted }}>
                        <input
                          type="checkbox"
                          checked={field.unsigned}
                          onChange={(e) => updateField(field.id, { unsigned: e.target.checked })}
                          disabled={loading}
                          className="mr-1"
                        />
                        Unsigned
                      </label>
                      <label className="flex items-center text-xs" style={{ color: colors.textMuted }}>
                        <input
                          type="checkbox"
                          checked={field.autoIncrement}
                          onChange={(e) => updateField(field.id, { autoIncrement: e.target.checked })}
                          disabled={loading}
                          className="mr-1"
                        />
                        Auto Inc.
                      </label>
                    </div>
                  </div>

                  {/* Row 3: Link fields - only visible for COMBOBOX, LISTBOX, RADIOBUTTONS */}
                  {(field.controlType === 'COMBOBOX' || field.controlType === 'LISTBOX' || field.controlType === 'RADIOBUTTONS') && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mt-2 pt-2" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                      {/* Link Table */}
                      <div>
                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Link Table</label>
                        <select
                          value={field.linkTable}
                          onChange={(e) => updateField(field.id, { linkTable: e.target.value, linkField: '', linkDisplayField: '', linkOrderField: '' })}
                          disabled={loading}
                          className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                          style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                        >
                          <option value="">-- Select Table --</option>
                          {availableTables.map(tblName => (
                            <option key={tblName} value={tblName}>{tblName}</option>
                          ))}
                        </select>
                      </div>

                      {/* Link Field (Value) */}
                      <div>
                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Value Field</label>
                        <select
                          value={field.linkField}
                          onChange={(e) => updateField(field.id, { linkField: e.target.value })}
                          disabled={loading || !field.linkTable}
                          className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                          style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                        >
                          <option value="">-- Value Field --</option>
                          {(linkFieldOptions[field.linkTable] || []).map(fieldName => (
                            <option key={fieldName} value={fieldName}>{fieldName}</option>
                          ))}
                        </select>
                      </div>

                      {/* Link Display Field */}
                      <div>
                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Display Field</label>
                        <select
                          value={field.linkDisplayField}
                          onChange={(e) => updateField(field.id, { linkDisplayField: e.target.value })}
                          disabled={loading || !field.linkTable}
                          className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                          style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                        >
                          <option value="">-- Display Field --</option>
                          {(linkFieldOptions[field.linkTable] || []).map(fieldName => (
                            <option key={fieldName} value={fieldName}>{fieldName}</option>
                          ))}
                        </select>
                      </div>

                      {/* Link Order Field */}
                      <div>
                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Order Field</label>
                        <select
                          value={field.linkOrderField}
                          onChange={(e) => updateField(field.id, { linkOrderField: e.target.value })}
                          disabled={loading || !field.linkTable}
                          className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                          style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                        >
                          <option value="">-- Order Field --</option>
                          {(linkFieldOptions[field.linkTable] || []).map(fieldName => (
                            <option key={fieldName} value={fieldName}>{fieldName}</option>
                          ))}
                        </select>
                      </div>

                      {/* Link Order Direction */}
                      <div>
                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Direction</label>
                        <select
                          value={field.linkOrderDirection}
                          onChange={(e) => updateField(field.id, { linkOrderDirection: e.target.value as 'ASC' | 'DESC' })}
                          disabled={loading}
                          className="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1"
                          style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                        >
                          <option value="ASC">ASC</option>
                          <option value="DESC">DESC</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg p-3" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}` }}>
              <p className="text-sm" style={{ color: colors.errorText }}>{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded transition-colors hover:opacity-90"
              style={{ backgroundColor: colors.buttonPrimary, color: colors.textInverse }}
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
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <i className="pi pi-check"></i>
                  <span>Create Table</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Theme-aware styles for placeholder text */}
      <style>{`
        .create-table-modal input::placeholder,
        .create-table-modal textarea::placeholder {
          color: var(--theme-text-muted);
          opacity: 0.7;
        }
        .create-table-modal select option {
          background-color: var(--theme-bg-secondary);
          color: var(--theme-text-primary);
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
}