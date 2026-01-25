import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Panel } from 'primereact/panel';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/lib/api';

interface TabPanelProps {
  isActive: boolean;
}

interface FloatingSchema {
  id: number;
  name: string;
  description?: string;
}

interface SchemaVersion {
  id: number;
  schema_id: number;
  version_number: number;
  created_at: string;
  has_unsaved_changes: boolean;
}

interface DiffChange {
  type: string;
  table: string;
  field?: string;
  priority: number;
  columns?: string[];
  constraint_name?: string;
}

interface DiffSummary {
  total_changes: number;
  tables_created: number;
  tables_dropped: number;
  columns_added: number;
  columns_dropped: number;
  columns_modified: number;
  primary_keys_changed: number;
  foreign_keys_added: number;
  foreign_keys_dropped: number;
}

interface DiffResult {
  sql: string;
  changes: DiffChange[];
  summary: DiffSummary;
  from_version: {
    id: number;
    version_number: number;
    schema_name: string;
  };
  to_version: {
    id: number;
    version_number: number;
    schema_name: string;
  };
}

export default function QueryBuilderPanel({ isActive }: TabPanelProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t: _t } = useTranslation(currentLanguage); // Future use for i18n
  const { colors } = useTheme();
  const toast = useRef<Toast>(null);

  // Schema Migration Access State (Premium Feature)
  const [schemaMigrationAccess, setSchemaMigrationAccess] = useState<{
    has_access: boolean;
    access_type?: string;
    unlock_cost?: number;
    days_remaining?: number;
    expires_at?: string;
    is_patron?: boolean;
  } | null>(null);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [unlocking, setUnlocking] = useState(false);

  // State
  const [schemas, setSchemas] = useState<FloatingSchema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<FloatingSchema | null>(null);
  const [versions, setVersions] = useState<SchemaVersion[]>([]);
  const [fromVersion, setFromVersion] = useState<SchemaVersion | null>(null);
  const [toVersion, setToVersion] = useState<SchemaVersion | null>(null);
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string>('');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [selectedDialect, setSelectedDialect] = useState<string>('mysql');

  // Database dialect options
  const dialectOptions = [
    { label: 'MySQL', value: 'mysql' },
    { label: 'PostgreSQL', value: 'pgsql' },
    { label: 'SQLite', value: 'sqlite' },
    { label: 'SQL Server', value: 'sqlsrv' },
  ];

  // API helpers
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }, []);

  // Load Schema Migration access status
  const loadSchemaMigrationAccess = useCallback(async () => {
    setLoadingAccess(true);
    try {
      const response = await fetch('/api/subscriptions/schema-migration/status', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setSchemaMigrationAccess(data);
      }
    } catch (error) {
      console.error('Failed to load schema migration access:', error);
    } finally {
      setLoadingAccess(false);
    }
  }, [getAuthHeaders]);

  // Unlock Schema Migration with credits
  const unlockSchemaMigration = async () => {
    setUnlocking(true);
    try {
      const response = await fetch('/api/subscriptions/unlock-schema-migration', {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setSchemaMigrationAccess(data.access_status);
        toast.current?.show({
          severity: 'success',
          summary: 'Erfolg',
          detail: data.message || 'Schema Migration freigeschaltet!',
        });
        // Trigger credits update event
        window.dispatchEvent(new Event('creditsChanged'));
      } else {
        const error = await response.json();
        toast.current?.show({
          severity: 'error',
          summary: 'Fehler',
          detail: error.message || 'Freischaltung fehlgeschlagen',
        });
      }
    } catch (err) {
      console.error('Error unlocking schema migration:', err);
      toast.current?.show({
        severity: 'error',
        summary: 'Fehler',
        detail: 'Freischaltung fehlgeschlagen',
      });
    } finally {
      setUnlocking(false);
    }
  };

  // Load access status on mount
  useEffect(() => {
    loadSchemaMigrationAccess();
  }, [loadSchemaMigrationAccess]);

  // Load available schemas on mount - only if user has access
  useEffect(() => {
    if (isActive && schemaMigrationAccess?.has_access) {
      loadSchemas();
    }
  }, [isActive, schemaMigrationAccess?.has_access]);

  // Load versions when schema selected
  useEffect(() => {
    if (selectedSchema) {
      loadVersions(selectedSchema.id);
    } else {
      setVersions([]);
      setFromVersion(null);
      setToVersion(null);
    }
  }, [selectedSchema]);

  const loadSchemas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/schemas');
      setSchemas(response.schemas || []);
    } catch (err: any) {
      setError('Failed to load schemas: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async (schemaId: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/floating-schemas/${schemaId}/versions`);
      const versionsData = response || [];
      setVersions(versionsData);

      // Auto-select last two versions if available
      // Versions are sorted DESC (newest first), so:
      // FROM = older version (last in array), TO = newer version (second to last in array)
      if (versionsData.length >= 2) {
        setFromVersion(versionsData[versionsData.length - 1]); // Ältere Version
        setToVersion(versionsData[versionsData.length - 2]);   // Neuere Version
      } else if (versionsData.length === 1) {
        setFromVersion(versionsData[0]);
        setToVersion(versionsData[0]);
      }
    } catch (err: any) {
      setError('Failed to load versions: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const compareVersions = async () => {
    if (!fromVersion || !toVersion) {
      setError('Please select both FROM and TO versions');
      return;
    }

    if (fromVersion.id === toVersion.id) {
      setError('FROM and TO versions must be different');
      return;
    }

    try {
      setComparing(true);
      setError('');
      setDiffResult(null);

      const response = await api.post('/schema-diff/compare', {
        from_version_id: fromVersion.id,
        to_version_id: toVersion.id,
        dialect: selectedDialect,
      });

      if (response.success) {
        setDiffResult(response.data);
      } else {
        setError('Comparison failed: ' + response.message);
      }
    } catch (err: any) {
      setError('Failed to compare versions: ' + (err.response?.data?.message || err.message));
    } finally {
      setComparing(false);
    }
  };

  const downloadSQL = () => {
    if (!diffResult) return;

    const blob = new Blob([diffResult.sql], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration_v${diffResult.from_version.version_number}_to_v${diffResult.to_version.version_number}.sql`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const copyToClipboard = () => {
    if (!diffResult) return;

    navigator.clipboard.writeText(diffResult.sql).then(() => {
      alert('SQL copied to clipboard!');
    });
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'CREATE_TABLE':
        return 'pi pi-plus-circle';
      case 'DROP_TABLE':
        return 'pi pi-trash';
      case 'ADD_COLUMN':
        return 'pi pi-plus';
      case 'DROP_COLUMN':
        return 'pi pi-minus';
      case 'MODIFY_COLUMN':
        return 'pi pi-pencil';
      case 'ADD_PRIMARY_KEY':
      case 'DROP_PRIMARY_KEY':
        return 'pi pi-key';
      case 'ADD_FOREIGN_KEY':
      case 'DROP_FOREIGN_KEY':
        return 'pi pi-link';
      default:
        return 'pi pi-circle';
    }
  };

  const getChangeTypeSeverity = (type: string): 'success' | 'info' | 'warning' | 'danger' => {
    if (type.startsWith('CREATE') || type.startsWith('ADD')) return 'success';
    if (type.startsWith('DROP')) return 'danger';
    if (type.startsWith('MODIFY')) return 'warning';
    return 'info';
  };

  const renderChangeType = (rowData: DiffChange) => {
    return (
      <Tag
        severity={getChangeTypeSeverity(rowData.type)}
        icon={getChangeTypeIcon(rowData.type)}
        value={rowData.type.replace(/_/g, ' ')}
      />
    );
  };

  const renderChangeDetails = (rowData: DiffChange) => {
    let details = `Table: ${rowData.table}`;
    if (rowData.field) {
      details += ` | Field: ${rowData.field}`;
    }
    if (rowData.columns) {
      details += ` | Columns: ${rowData.columns.join(', ')}`;
    }
    if (rowData.constraint_name) {
      details += ` | Constraint: ${rowData.constraint_name}`;
    }
    return <span className="text-sm">{details}</span>;
  };

  // ========== LOADING STATE ==========
  if (loadingAccess) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: colors.bgPrimary }}>
        <ProgressSpinner />
      </div>
    );
  }

  // ========== NO ACCESS - SHOW PREMIUM BANNER ==========
  if (!schemaMigrationAccess?.has_access) {
    return (
      <div className="h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
        <Toast ref={toast} />

        {/* Header */}
        <div className="flex items-center justify-between p-3" style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}>
          <div className="flex items-center gap-2">
            <i className="pi pi-database text-xl" style={{ color: colors.accent }} />
            <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Schema Migration</h2>
          </div>
        </div>

        {/* Premium Banner */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="rounded-lg p-6 text-center" style={{ backgroundColor: colors.warningBg, border: `2px solid ${colors.warningText}` }}>
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.warningText }}>
                Schema Migration ist ein Premium-Feature
              </h3>
              <p className="mb-4" style={{ color: colors.textMuted }}>
                Mit Schema Migration können Sie Datenbankversionen vergleichen und automatisch SQL-Migrationsskripte generieren.
              </p>

              <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: colors.bgTertiary }}>
                <div className="text-2xl font-bold mb-1" style={{ color: colors.warningText }}>
                  {schemaMigrationAccess?.unlock_cost || 50} Credits / Jahr
                </div>
                <div className="text-sm" style={{ color: colors.textMuted }}>
                  Einmalige Freischaltung für 12 Monate
                </div>
              </div>

              <Button
                label={unlocking ? 'Wird freigeschaltet...' : 'Freischalten'}
                icon="pi pi-unlock"
                className="p-button-lg"
                style={{
                  background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                  border: 'none',
                }}
                onClick={unlockSchemaMigration}
                disabled={unlocking}
                loading={unlocking}
              />

              <div className="mt-4 text-sm" style={{ color: colors.textMuted }}>
                <p className="mb-2 font-medium" style={{ color: colors.textSecondary }}>Enthaltene Funktionen:</p>
                <ul className="text-left space-y-1">
                  <li className="flex items-center gap-2 opacity-80" style={{ color: colors.textSecondary }}>
                    <span>🔄</span> Versionsvergleich
                  </li>
                  <li className="flex items-center gap-2 opacity-80" style={{ color: colors.textSecondary }}>
                    <span>📝</span> SQL-Migration Generierung
                  </li>
                  <li className="flex items-center gap-2 opacity-80" style={{ color: colors.textSecondary }}>
                    <span>📊</span> Detaillierte Änderungsübersicht
                  </li>
                  <li className="flex items-center gap-2 opacity-80" style={{ color: colors.textSecondary }}>
                    <span>⬇️</span> SQL-Export & Download
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== MAIN RENDER (WITH ACCESS) ==========
  return (
    <div className="query-builder-panel p-4 h-full overflow-auto" style={{ backgroundColor: colors.bgPrimary }}>
      <Toast ref={toast} />
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
            <i className="pi pi-database mr-2" style={{ color: colors.accent }}></i>
            Schema Migration
          </h2>
          {/* Access Status Badge */}
          {schemaMigrationAccess?.is_patron ? (
            <Tag value="Patron" severity="warning" />
          ) : schemaMigrationAccess?.days_remaining !== undefined ? (
            <Tag value={`${schemaMigrationAccess.days_remaining} Tage`} severity="info" />
          ) : null}
        </div>
        <p style={{ color: colors.textMuted }}>
          Compare two schema versions and generate SQL migration scripts
        </p>
      </div>

      {error && (
        <Message severity="error" text={error} className="mb-4 w-full" />
      )}

      {/* Schema & Version Selection */}
      <div className="mb-4 p-4 rounded" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Schema Selection */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Select Schema
            </label>
            <Dropdown
              value={selectedSchema}
              options={schemas}
              onChange={(e) => setSelectedSchema(e.value)}
              optionLabel="name"
              placeholder="Select a schema..."
              className="w-full"
              filter
              disabled={loading}
            />
          </div>

          {/* FROM Version */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              FROM Version (Old)
            </label>
            <Dropdown
              value={fromVersion}
              options={versions}
              onChange={(e) => setFromVersion(e.value)}
              optionLabel="version_number"
              placeholder="Select FROM version..."
              className="w-full"
              disabled={!selectedSchema || loading}
            />
          </div>

          {/* TO Version */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              TO Version (New)
            </label>
            <Dropdown
              value={toVersion}
              options={versions}
              onChange={(e) => setToVersion(e.value)}
              optionLabel="version_number"
              placeholder="Select TO version..."
              className="w-full"
              disabled={!selectedSchema || loading}
            />
          </div>

          {/* Database Dialect */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Target Database
            </label>
            <Dropdown
              value={selectedDialect}
              options={dialectOptions}
              onChange={(e) => setSelectedDialect(e.value)}
              placeholder="Select dialect..."
              className="w-full"
              disabled={loading || comparing}
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            label="Compare Versions"
            icon="pi pi-sync"
            onClick={compareVersions}
            disabled={!fromVersion || !toVersion || comparing || fromVersion.id === toVersion.id}
            loading={comparing}
            severity="info"
          />

          {diffResult && (
            <>
              <Button
                label="Download SQL"
                icon="pi pi-download"
                onClick={downloadSQL}
                severity="success"
                outlined
              />
              <Button
                label="Copy to Clipboard"
                icon="pi pi-copy"
                onClick={copyToClipboard}
                severity="info"
                outlined
              />
            </>
          )}
        </div>
      </div>

      {/* Results */}
      {comparing && (
        <div className="flex justify-center items-center py-8">
          <ProgressSpinner />
        </div>
      )}

      {diffResult && !comparing && (
        <>
          {/* Summary */}
          <div className="mb-4 p-4 rounded" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              <i className="pi pi-chart-bar mr-2" style={{ color: colors.accent }}></i>
              Migration Summary
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="p-3 rounded" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoText}` }}>
                <div className="text-3xl font-bold" style={{ color: colors.infoText }}>{diffResult.summary.total_changes}</div>
                <div className="text-sm" style={{ color: colors.infoText, opacity: 0.8 }}>Total Changes</div>
              </div>

              {diffResult.summary.tables_created > 0 && (
                <div className="p-3 rounded" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successText}` }}>
                  <div className="text-3xl font-bold" style={{ color: colors.successText }}>{diffResult.summary.tables_created}</div>
                  <div className="text-sm" style={{ color: colors.successText, opacity: 0.8 }}>Tables Created</div>
                </div>
              )}

              {diffResult.summary.tables_dropped > 0 && (
                <div className="p-3 rounded" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorText}` }}>
                  <div className="text-3xl font-bold" style={{ color: colors.errorText }}>{diffResult.summary.tables_dropped}</div>
                  <div className="text-sm" style={{ color: colors.errorText, opacity: 0.8 }}>Tables Dropped</div>
                </div>
              )}

              {diffResult.summary.columns_added > 0 && (
                <div className="p-3 rounded" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successText}` }}>
                  <div className="text-3xl font-bold" style={{ color: colors.successText }}>{diffResult.summary.columns_added}</div>
                  <div className="text-sm" style={{ color: colors.successText, opacity: 0.8 }}>Columns Added</div>
                </div>
              )}

              {diffResult.summary.columns_dropped > 0 && (
                <div className="p-3 rounded" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorText}` }}>
                  <div className="text-3xl font-bold" style={{ color: colors.errorText }}>{diffResult.summary.columns_dropped}</div>
                  <div className="text-sm" style={{ color: colors.errorText, opacity: 0.8 }}>Columns Dropped</div>
                </div>
              )}

              {diffResult.summary.columns_modified > 0 && (
                <div className="p-3 rounded" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningText}` }}>
                  <div className="text-3xl font-bold" style={{ color: colors.warningText }}>{diffResult.summary.columns_modified}</div>
                  <div className="text-sm" style={{ color: colors.warningText, opacity: 0.8 }}>Columns Modified</div>
                </div>
              )}

              {diffResult.summary.primary_keys_changed > 0 && (
                <div className="p-3 rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.accent}` }}>
                  <div className="text-3xl font-bold" style={{ color: colors.accent }}>{diffResult.summary.primary_keys_changed}</div>
                  <div className="text-sm" style={{ color: colors.accent, opacity: 0.8 }}>PKs Changed</div>
                </div>
              )}

              {diffResult.summary.foreign_keys_added > 0 && (
                <div className="p-3 rounded" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoText}` }}>
                  <div className="text-3xl font-bold" style={{ color: colors.infoText }}>{diffResult.summary.foreign_keys_added}</div>
                  <div className="text-sm" style={{ color: colors.infoText, opacity: 0.8 }}>FKs Added</div>
                </div>
              )}

              {diffResult.summary.foreign_keys_dropped > 0 && (
                <div className="p-3 rounded" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorText}` }}>
                  <div className="text-3xl font-bold" style={{ color: colors.errorText }}>{diffResult.summary.foreign_keys_dropped}</div>
                  <div className="text-sm" style={{ color: colors.errorText, opacity: 0.8 }}>FKs Dropped</div>
                </div>
              )}
            </div>

            <div className="mt-4 text-sm" style={{ color: colors.textMuted }}>
              <div>
                <strong style={{ color: colors.textSecondary }}>From:</strong> {diffResult.from_version.schema_name} - Version {diffResult.from_version.version_number}
              </div>
              <div>
                <strong style={{ color: colors.textSecondary }}>To:</strong> {diffResult.to_version.schema_name} - Version {diffResult.to_version.version_number}
              </div>
            </div>
          </div>

          {/* Changes List */}
          {diffResult.changes.length > 0 && (
            <Panel header="Detected Changes" toggleable className="mb-4 query-builder-panel-section">
              <DataTable
                value={diffResult.changes}
                paginator
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
                className="p-datatable-sm"
                emptyMessage="No changes detected"
              >
                <Column
                  field="priority"
                  header="Order"
                  body={(rowData) => <Tag value={rowData.priority} severity="info" />}
                  style={{ width: '80px' }}
                  sortable
                />
                <Column
                  header="Change Type"
                  body={renderChangeType}
                  style={{ width: '200px' }}
                />
                <Column
                  header="Details"
                  body={renderChangeDetails}
                />
              </DataTable>
            </Panel>
          )}

          {/* SQL Script */}
          <Panel header="Generated Migration SQL Script" toggleable collapsed={false} className="query-builder-panel-section">
            <div className="mb-2 flex gap-2">
              <Button
                label="Copy SQL"
                icon="pi pi-copy"
                size="small"
                onClick={copyToClipboard}
                outlined
              />
              <Button
                label="Download SQL"
                icon="pi pi-download"
                size="small"
                onClick={downloadSQL}
                severity="success"
                outlined
              />
            </div>

            <InputTextarea
              value={diffResult.sql}
              rows={20}
              className="w-full font-mono text-sm"
              readOnly
              style={{ fontFamily: 'monospace', backgroundColor: colors.bgTertiary, color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}` }}
            />

            <div className="mt-2 text-xs" style={{ color: colors.textMuted }}>
              💡 Tip: Review the SQL carefully before executing it on your database!
            </div>
          </Panel>

          {/* Warning Message */}
          {diffResult.summary.total_changes === 0 && (
            <Message
              severity="info"
              text="No changes detected between the selected versions. The schemas are identical."
              className="w-full"
            />
          )}
        </>
      )}

      {/* Theme-aware CSS for PrimeReact components */}
      <style>{`
        .query-builder-panel .p-dropdown,
        .query-builder-panel .p-inputtextarea {
          background: ${colors.bgTertiary} !important;
          border: 1px solid ${colors.borderPrimary} !important;
          color: ${colors.textPrimary} !important;
        }
        .query-builder-panel .p-dropdown-label {
          color: ${colors.textPrimary} !important;
        }
        .query-builder-panel .p-dropdown-trigger {
          color: ${colors.textMuted} !important;
        }
        .query-builder-panel .p-dropdown-panel {
          background: ${colors.bgSecondary} !important;
          border: 1px solid ${colors.borderPrimary} !important;
        }
        .query-builder-panel .p-dropdown-items {
          background: ${colors.bgSecondary} !important;
        }
        .query-builder-panel .p-dropdown-item {
          color: ${colors.textPrimary} !important;
          background: transparent !important;
        }
        .query-builder-panel .p-dropdown-item:hover {
          background: ${colors.bgTertiary} !important;
        }
        .query-builder-panel .p-dropdown-item.p-highlight {
          background: ${colors.accent} !important;
          color: white !important;
        }
        .query-builder-panel .p-dropdown-filter {
          background: ${colors.bgTertiary} !important;
          border: 1px solid ${colors.borderPrimary} !important;
          color: ${colors.textPrimary} !important;
        }
        .query-builder-panel-section .p-panel-header {
          background: ${colors.bgSecondary} !important;
          border: 1px solid ${colors.borderPrimary} !important;
          color: ${colors.textPrimary} !important;
        }
        .query-builder-panel-section .p-panel-content {
          background: ${colors.bgSecondary} !important;
          border: 1px solid ${colors.borderPrimary} !important;
          border-top: none !important;
          color: ${colors.textPrimary} !important;
        }
        .query-builder-panel .p-datatable .p-datatable-header,
        .query-builder-panel .p-datatable .p-datatable-thead > tr > th {
          background: ${colors.bgTertiary} !important;
          color: ${colors.textPrimary} !important;
          border-color: ${colors.borderPrimary} !important;
        }
        .query-builder-panel .p-datatable .p-datatable-tbody > tr {
          background: ${colors.bgSecondary} !important;
          color: ${colors.textPrimary} !important;
        }
        .query-builder-panel .p-datatable .p-datatable-tbody > tr > td {
          border-color: ${colors.borderPrimary} !important;
        }
        .query-builder-panel .p-datatable .p-datatable-tbody > tr:hover {
          background: ${colors.bgTertiary} !important;
        }
        .query-builder-panel .p-paginator {
          background: ${colors.bgSecondary} !important;
          border-color: ${colors.borderPrimary} !important;
        }
        .query-builder-panel .p-paginator .p-paginator-element {
          color: ${colors.textPrimary} !important;
        }
      `}</style>
    </div>
  );
}
