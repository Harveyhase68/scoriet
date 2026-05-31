import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Tree } from 'primereact/tree';
import { api } from '@/lib/api';
import { useProject } from '@/contexts/ProjectContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface SchemaTable {
  id: number;
  table_name: string;
  comment?: string;
  schema_name?: string;
  fields: SchemaField[];
}

interface SchemaField {
  id: number;
  field_name: string;
  field_type: string;
  field_order: number;
  control_type?: string;
  is_primary_key?: boolean;
}

interface ReportPatternInfo {
  id: number;
  name: string;
  description?: string;
}

interface FieldInfo {
  id: number;
  field_name: string;
  field_type: string;
  field_order: number;
  control_type?: string;
  is_primary_key?: boolean;
  is_nullable?: boolean;
  schema_display_state?: string;
  schema_generation_mode?: string;
}

interface TableInfo {
  id: number;
  table_name: string;
  comment?: string;
  filekeyname?: string;
}

interface Assignment {
  visibility_state: string;
  sort_order: number | null;
}

export default function ReportFieldAssignmentPanel() {
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const toast = useToast();
  const { colors } = useTheme();
  const { selectedProject } = useProject();

  const [schemaStructure, setSchemaStructure] = useState<SchemaTable[]>([]);
  const [selectedSchemaName, setSelectedSchemaName] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  const [reportPatterns, setReportPatterns] = useState<ReportPatternInfo[]>([]);
  const [fields, setFields] = useState<FieldInfo[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveTimeoutId, setSaveTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  const visibilityOptions = [
    { label: t.fieldassignmentpanel_vis_visible, value: 'visible' },
    { label: t.fieldassignmentpanel_vis_grayed, value: 'grayed' },
    { label: t.fieldassignmentpanel_vis_inactive, value: 'inactive' },
    { label: t.fieldassignmentpanel_vis_invisible, value: 'invisible' },
    { label: t.fieldassignmentpanel_vis_not_available, value: 'not_available' },
  ];

  const getVisibilityColor = (state: string): string => {
    switch (state) {
      case 'visible': return colors.successText;
      case 'grayed': return colors.textMuted;
      case 'inactive': return colors.warningText;
      case 'invisible': return colors.textSecondary;
      case 'not_available': return colors.errorText;
      default: return colors.textPrimary;
    }
  };

  const schemaOptions = useMemo(() => {
    const names = [...new Set(schemaStructure.map(st => st.schema_name || 'Unknown'))];
    return names.map(name => ({ label: name, value: name }));
  }, [schemaStructure]);

  const filteredTables = useMemo(() => {
    if (!selectedSchemaName) return [];
    return schemaStructure.filter(st => (st.schema_name || 'Unknown') === selectedSchemaName);
  }, [schemaStructure, selectedSchemaName]);

  const fetchSchemaStructure = React.useCallback(async () => {
    if (!selectedProject) {
      setSchemaStructure([]);
      setExpandedKeys({});
      return;
    }
    try {
      setLoading(true);
      const response = await api.request(`/schema-available-items?project_id=${selectedProject.id}`);
      if (response.tables && Array.isArray(response.tables)) {
        const tables: SchemaTable[] = response.tables;
        setSchemaStructure(tables);

        const names = [...new Set(tables.map(tb => tb.schema_name || 'Unknown'))];
        if (names.length > 0) {
          setSelectedSchemaName(prev => (prev && names.includes(prev)) ? prev : names[0]);
        } else {
          setSelectedSchemaName(null);
        }
      } else {
        setSchemaStructure([]);
        setSelectedSchemaName(null);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.showError(t.fieldassignmentpanel_error_load + (err.response?.data?.message || err.message || ''));
      setSchemaStructure([]);
      setSelectedSchemaName(null);
    } finally {
      setLoading(false);
    }
  }, [selectedProject, toast, t]);

  const fetchMatrixData = React.useCallback(async (tableId: number) => {
    if (!selectedProject) return;
    try {
      setLoading(true);
      const response = await api.request(
        `/report-pattern-field-assignments/matrix?project_id=${selectedProject.id}&table_id=${tableId}`
      );
      setTableInfo(response.table || null);
      setReportPatterns(response.report_patterns || []);
      setFields(response.fields || []);
      setAssignments(response.assignments || {});
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.showError(t.fieldassignmentpanel_error_load + (err.response?.data?.message || err.message || ''));
      setTableInfo(null);
      setReportPatterns([]);
      setFields([]);
      setAssignments({});
    } finally {
      setLoading(false);
    }
  }, [selectedProject, toast, t]);

  useEffect(() => {
    fetchSchemaStructure();
    setSelectedTableId(null);
    setSelectedSchemaName(null);
    setTableInfo(null);
    setReportPatterns([]);
    setFields([]);
    setAssignments({});
  }, [selectedProject, fetchSchemaStructure]);

  useEffect(() => {
    if (selectedTableId !== null) {
      fetchMatrixData(selectedTableId);
    }
  }, [selectedTableId, fetchMatrixData]);

  useEffect(() => {
    setSelectedTableId(null);
    setTableInfo(null);
    setReportPatterns([]);
    setFields([]);
    setAssignments({});
  }, [selectedSchemaName]);

  const buildTreeData = () => {
    return filteredTables.map(table => ({
      key: String(table.id),
      label: (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm" style={{ color: colors.textPrimary }}>{table.table_name}</span>
        </div>
      ),
      leaf: true,
    }));
  };

  const handleAssignmentChange = (
    reportPatternId: number,
    fieldId: number,
    prop: 'visibility_state' | 'sort_order',
    value: string | number | null
  ) => {
    const key = `${reportPatternId}_${fieldId}`;
    const current = assignments[key] || { visibility_state: 'visible', sort_order: null };
    const updated = { ...current, [prop]: value };

    setAssignments(prev => ({ ...prev, [key]: updated }));

    if (saveTimeoutId) clearTimeout(saveTimeoutId);
    const newId = setTimeout(async () => {
      setSaving(true);
      try {
        // Send only the ONE assignment that just changed. The backend reads
        // "visible + no sort_order" as a reset and deletes the row, so a
        // toggle back to Visible reaches the DB even though it looks like
        // the default state (no need to filter it out client-side).
        const [rpid, sid] = key.split('_').map(Number);
        const toSave = [{
          report_pattern_id: rpid,
          schema_field_id:   sid,
          visibility_state:  updated.visibility_state,
          sort_order:        updated.sort_order,
        }];

        await api.request('/report-pattern-field-assignments/bulk-update', {
          method: 'POST',
          body: JSON.stringify({ assignments: toSave }),
        });
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        toast.showError(t.fieldassignmentpanel_error_save + (err.response?.data?.message || err.message || ''));
      } finally {
        setSaving(false);
      }
    }, 1000);
    setSaveTimeoutId(newId);
  };

  const getAssignment = (reportPatternId: number, fieldId: number): Assignment => {
    const key = `${reportPatternId}_${fieldId}`;
    return assignments[key] || { visibility_state: 'visible', sort_order: null };
  };

  const fileKeyFieldNames = useMemo(() => {
    const fk = tableInfo?.filekeyname;
    if (!fk) return [];
    const fieldNames = fields.map(f => f.field_name);
    if (fieldNames.includes(fk)) return [fk];
    const separators = [',', '+', '|', ';', ' '];
    for (const sep of separators) {
      if (fk.includes(sep)) {
        const parts = fk.split(sep).map(p => p.trim()).filter(p => fieldNames.includes(p));
        if (parts.length > 1) return parts;
      }
    }
    return [fk];
  }, [tableInfo, fields]);

  const handleCopyToAll = (fieldId: number) => {
    if (reportPatterns.length < 2) return;
    const firstRpId = reportPatterns[0].id;
    const source = getAssignment(firstRpId, fieldId);

    const newAssignments = { ...assignments };
    const changedKeys: string[] = [];
    for (let i = 1; i < reportPatterns.length; i++) {
      const key = `${reportPatterns[i].id}_${fieldId}`;
      newAssignments[key] = { ...source };
      changedKeys.push(key);
    }
    setAssignments(newAssignments);

    if (saveTimeoutId) clearTimeout(saveTimeoutId);
    const newId = setTimeout(async () => {
      setSaving(true);
      try {
        // Send only the keys we touched. No filter on "visible default":
        // the backend treats visible+no-sort_order as reset → DELETE row,
        // so a copy-to-all can propagate a reset just as well as an override.
        const toSave = changedKeys.map(k => {
          const a = newAssignments[k];
          const [rpid, sid] = k.split('_').map(Number);
          return {
            report_pattern_id: rpid,
            schema_field_id:   sid,
            visibility_state:  a.visibility_state,
            sort_order:        a.sort_order,
          };
        });
        if (toSave.length > 0) {
          await api.request('/report-pattern-field-assignments/bulk-update', {
            method: 'POST',
            body: JSON.stringify({ assignments: toSave }),
          });
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        toast.showError(t.fieldassignmentpanel_error_save + (err.response?.data?.message || err.message || ''));
      } finally {
        setSaving(false);
      }
    }, 300);
    setSaveTimeoutId(newId);
  };

  return (
    <div className="field-assignment-panel h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      {/* Header */}
      <div className="flex-shrink-0 p-4" style={{ borderBottom: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
              {t.reportfieldassignmentpanel_title}
            </h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {t.reportfieldassignmentpanel_subtitle}
            </p>
          </div>
          {saving && (
            <div className="flex items-center gap-2" style={{ color: colors.textMuted }}>
              <i className="pi pi-spin pi-spinner text-sm"></i>
              <span className="text-sm">{t.fieldassignmentpanel_saving}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel - Schema Selector + Table Tree */}
        <div
          className="flex-shrink-0 flex flex-col relative h-full"
          style={{ width: `${sidebarWidth}px`, borderRight: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}
        >
          <div className="p-3 flex-shrink-0" style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}>
            <p className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>
              {t.fieldassignmentpanel_database || 'Database'}
            </p>
            <Dropdown
              value={selectedSchemaName}
              options={schemaOptions}
              onChange={(e) => setSelectedSchemaName(e.value)}
              placeholder={t.fieldassignmentpanel_select_database || 'Select database...'}
              className="w-full"
              style={{ fontSize: '13px' }}
              disabled={schemaOptions.length === 0}
            />
            <p className="text-xs mt-2 font-medium" style={{ color: colors.textSecondary }}>
              {t.fieldassignmentpanel_select_table}
              {selectedSchemaName && filteredTables.length > 0 && (
                <span style={{ color: colors.textMuted }}> ({filteredTables.length})</span>
              )}
            </p>
          </div>

          <div className="flex-1 p-3 overflow-y-auto overflow-x-auto min-h-0">
            {!selectedProject ? (
              <div className="text-center mt-8" style={{ color: colors.textMuted }}>
                <div className="text-2xl mb-2">📋</div>
                <p className="text-sm">{t.fieldassignmentpanel_no_project}</p>
              </div>
            ) : loading && schemaStructure.length === 0 ? (
              <div className="text-center" style={{ color: colors.textMuted }}>{t.fieldassignmentpanel_loading}</div>
            ) : schemaStructure.length === 0 ? (
              <div className="text-center mt-8" style={{ color: colors.textMuted }}>
                <div className="text-2xl mb-2">📭</div>
                <p className="text-sm">{t.fieldassignmentpanel_no_tables}</p>
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="text-center mt-8" style={{ color: colors.textMuted }}>
                <div className="text-2xl mb-2">📭</div>
                <p className="text-sm">{t.fieldassignmentpanel_no_tables}</p>
              </div>
            ) : (
              <Tree
                value={buildTreeData() as never}
                selectionMode="single"
                selectionKeys={selectedTableId ? { [String(selectedTableId)]: true } : {}}
                onSelectionChange={(e) => {
                  if (typeof e.value === 'string' && e.value) {
                    setSelectedTableId(Number(e.value));
                  } else if (typeof e.value === 'object' && e.value !== null) {
                    const keys = Object.keys(e.value);
                    if (keys.length > 0) setSelectedTableId(Number(keys[0]));
                  }
                }}
                expandedKeys={expandedKeys}
                onToggle={(e) => setExpandedKeys(e.value)}
                className="bg-transparent field-assignment-tree-compact"
              />
            )}
          </div>

          {/* Resize Handle */}
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
            style={{ backgroundColor: isResizing ? colors.accent : 'transparent' }}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
              const startX = e.clientX;
              const startWidth = sidebarWidth;
              const handleMouseMove = (ev: MouseEvent) => {
                const newWidth = Math.max(200, Math.min(600, startWidth + (ev.clientX - startX)));
                setSidebarWidth(newWidth);
              };
              const handleMouseUp = () => {
                setIsResizing(false);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />
        </div>

        {/* Right Panel - Matrix */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {!selectedTableId ? (
            <div className="flex-1 flex items-center justify-center" style={{ color: colors.textMuted }}>
              <div className="text-center">
                <div className="text-4xl mb-3">🔲</div>
                <p>{t.fieldassignmentpanel_select_table}</p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex-1 flex items-center justify-center" style={{ color: colors.textMuted }}>
              <i className="pi pi-spin pi-spinner mr-2"></i>{t.fieldassignmentpanel_loading}
            </div>
          ) : reportPatterns.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8" style={{ color: colors.textMuted }}>
              <div className="text-center">
                <div className="text-4xl mb-3">📄</div>
                <p className="font-medium mb-2">{t.reportfieldassignmentpanel_no_patterns}</p>
                <p className="text-sm">{t.reportfieldassignmentpanel_no_patterns_hint}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm border-collapse" style={{ minWidth: `${200 + reportPatterns.length * 200}px` }}>
                <thead>
                  <tr style={{ backgroundColor: colors.bgSecondary, borderBottom: `2px solid ${colors.borderPrimary}` }}>
                    <th
                      className="text-left p-3 font-semibold sticky left-0 z-10"
                      style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary, minWidth: '200px', borderRight: `1px solid ${colors.borderPrimary}` }}
                    >
                      {t.fieldassignmentpanel_field}
                    </th>
                    {reportPatterns.map(rp => (
                      <th
                        key={rp.id}
                        className="p-2 text-center font-medium"
                        style={{ color: colors.textPrimary, minWidth: '200px', borderRight: `1px solid ${colors.borderPrimary}` }}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono text-xs truncate max-w-full" title={rp.description || rp.name}>{rp.name}</span>
                          <Tag value="Report" severity="info" />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, idx) => (
                    <tr
                      key={field.id}
                      style={{ backgroundColor: idx % 2 === 0 ? colors.bgPrimary : colors.bgSecondary, borderBottom: `1px solid ${colors.borderPrimary}` }}
                    >
                      <td
                        className="p-3 sticky left-0 z-10"
                        style={{ backgroundColor: idx % 2 === 0 ? colors.bgPrimary : colors.bgSecondary, borderRight: `1px solid ${colors.borderPrimary}` }}
                      >
                        <div className="flex items-center gap-2">
                          {field.is_primary_key && (
                            <i className="pi pi-key text-xs" title="Primary Key" style={{ color: colors.warningText }}></i>
                          )}
                          {!field.is_primary_key && fileKeyFieldNames.includes(field.field_name) && (
                            <i className="pi pi-search text-xs" title={`File Key (${tableInfo?.filekeyname})`} style={{ color: colors.accent }}></i>
                          )}
                          <span className="font-mono text-sm" style={{ color: colors.textPrimary }}>{field.field_name}</span>
                          <Tag value={field.field_type} severity="success" />
                          {field.control_type && field.control_type.toUpperCase() === 'COMBOBOX' && (
                            <Tag value="CB" severity="warning" />
                          )}
                          {field.schema_display_state && field.schema_display_state !== 'enabled' && (
                            <Tag
                              value={`display: ${field.schema_display_state}`}
                              severity="info"
                              title={t.fieldassignmentpanel_schema_display_hint}
                            />
                          )}
                          {field.schema_generation_mode && field.schema_generation_mode !== 'full' && (
                            <Tag
                              value={`gen: ${field.schema_generation_mode}`}
                              severity="danger"
                              title={t.fieldassignmentpanel_schema_gen_hint}
                            />
                          )}
                          {reportPatterns.length >= 2 && (
                            <button
                              onClick={() => handleCopyToAll(field.id)}
                              title={t.fieldassignmentpanel_copy_to_all || 'Copy State & Sort Order from column 1 to all other columns'}
                              className="ml-auto flex-shrink-0 p-0 border-0 bg-transparent cursor-pointer opacity-40 hover:opacity-100 transition-opacity"
                              style={{ color: colors.textSecondary, lineHeight: 1 }}
                            >
                              <i className="pi pi-angle-double-right text-sm"></i>
                            </button>
                          )}
                        </div>
                      </td>
                      {reportPatterns.map(rp => {
                        const assignment = getAssignment(rp.id, field.id);
                        return (
                          <td
                            key={rp.id}
                            className="p-2"
                            style={{ borderRight: `1px solid ${colors.borderPrimary}`, verticalAlign: 'top' }}
                          >
                            <div className="flex flex-col gap-1">
                              <Dropdown
                                value={assignment.visibility_state}
                                options={visibilityOptions}
                                onChange={(e) => handleAssignmentChange(rp.id, field.id, 'visibility_state', e.value)}
                                className="w-full text-xs"
                                style={{
                                  fontSize: '12px',
                                  borderColor: getVisibilityColor(assignment.visibility_state),
                                }}
                              />
                              <InputNumber
                                value={assignment.sort_order}
                                onValueChange={(e) => handleAssignmentChange(rp.id, field.id, 'sort_order', e.value ?? null)}
                                placeholder={t.fieldassignmentpanel_sort_order}
                                className="w-full"
                                inputStyle={{ fontSize: '12px', padding: '4px 8px' }}
                                min={0}
                                max={9999}
                                showButtons={false}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reuse same compact tree styling as FieldAssignmentPanel */}
      <style>{`
        .field-assignment-tree-compact {
          width: 100% !important;
          height: auto !important;
          background: ${colors.bgSecondary} !important;
        }
        .field-assignment-tree-compact .p-tree-container {
          width: 100% !important;
          overflow: visible !important;
          background: ${colors.bgSecondary} !important;
        }
        .field-assignment-tree-compact .p-treenode {
          padding: 0.125rem 0 !important;
        }
        .field-assignment-tree-compact .p-treenode-content {
          padding: 0.25rem 0.5rem !important;
          min-height: 1.75rem !important;
          background: transparent !important;
        }
        .field-assignment-tree-compact .p-treenode-content:hover {
          background: ${colors.bgTertiary} !important;
        }
        .field-assignment-tree-compact .p-tree-toggler {
          width: 1.25rem !important;
          height: 1.25rem !important;
          color: ${colors.textSecondary} !important;
        }
        .field-assignment-tree-compact .p-treenode-label {
          font-size: 0.875rem !important;
          color: ${colors.textPrimary} !important;
        }
        .field-assignment-tree-compact .p-tag {
          font-size: 0.75rem !important;
          padding: 0.125rem 0.375rem !important;
          height: 1.25rem !important;
        }
        .field-assignment-tree-compact .p-highlight > .p-treenode-content {
          background: ${colors.bgTertiary} !important;
        }
      `}</style>
    </div>
  );
}
