import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Panel } from 'primereact/panel';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
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

  // Load available schemas on mount
  useEffect(() => {
    if (isActive) {
      loadSchemas();
    }
  }, [isActive]);

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

  return (
    <div className="p-4 h-full overflow-auto bg-gray-900">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white mb-2">
          <i className="pi pi-code mr-2"></i>
          Query Builder - Schema Diff & Migration Generator
        </h2>
        <p className="text-gray-400">
          Compare two schema versions and generate SQL migration scripts
        </p>
      </div>

      {error && (
        <Message severity="error" text={error} className="mb-4 w-full" />
      )}

      {/* Schema & Version Selection */}
      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Schema Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
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
            <label className="block text-sm font-medium text-white mb-2">
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
            <label className="block text-sm font-medium text-white mb-2">
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
      </Card>

      {/* Results */}
      {comparing && (
        <div className="flex justify-center items-center py-8">
          <ProgressSpinner />
        </div>
      )}

      {diffResult && !comparing && (
        <>
          {/* Summary */}
          <Card className="mb-4">
            <h3 className="text-xl font-bold text-white mb-4">
              <i className="pi pi-chart-bar mr-2"></i>
              Migration Summary
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="bg-blue-900 p-3 rounded">
                <div className="text-3xl font-bold text-white">{diffResult.summary.total_changes}</div>
                <div className="text-sm text-blue-200">Total Changes</div>
              </div>

              {diffResult.summary.tables_created > 0 && (
                <div className="bg-green-900 p-3 rounded">
                  <div className="text-3xl font-bold text-white">{diffResult.summary.tables_created}</div>
                  <div className="text-sm text-green-200">Tables Created</div>
                </div>
              )}

              {diffResult.summary.tables_dropped > 0 && (
                <div className="bg-red-900 p-3 rounded">
                  <div className="text-3xl font-bold text-white">{diffResult.summary.tables_dropped}</div>
                  <div className="text-sm text-red-200">Tables Dropped</div>
                </div>
              )}

              {diffResult.summary.columns_added > 0 && (
                <div className="bg-green-800 p-3 rounded">
                  <div className="text-3xl font-bold text-white">{diffResult.summary.columns_added}</div>
                  <div className="text-sm text-green-200">Columns Added</div>
                </div>
              )}

              {diffResult.summary.columns_dropped > 0 && (
                <div className="bg-red-800 p-3 rounded">
                  <div className="text-3xl font-bold text-white">{diffResult.summary.columns_dropped}</div>
                  <div className="text-sm text-red-200">Columns Dropped</div>
                </div>
              )}

              {diffResult.summary.columns_modified > 0 && (
                <div className="bg-yellow-800 p-3 rounded">
                  <div className="text-3xl font-bold text-white">{diffResult.summary.columns_modified}</div>
                  <div className="text-sm text-yellow-200">Columns Modified</div>
                </div>
              )}

              {diffResult.summary.primary_keys_changed > 0 && (
                <div className="bg-purple-800 p-3 rounded">
                  <div className="text-3xl font-bold text-white">{diffResult.summary.primary_keys_changed}</div>
                  <div className="text-sm text-purple-200">PKs Changed</div>
                </div>
              )}

              {diffResult.summary.foreign_keys_added > 0 && (
                <div className="bg-indigo-800 p-3 rounded">
                  <div className="text-3xl font-bold text-white">{diffResult.summary.foreign_keys_added}</div>
                  <div className="text-sm text-indigo-200">FKs Added</div>
                </div>
              )}

              {diffResult.summary.foreign_keys_dropped > 0 && (
                <div className="bg-pink-800 p-3 rounded">
                  <div className="text-3xl font-bold text-white">{diffResult.summary.foreign_keys_dropped}</div>
                  <div className="text-sm text-pink-200">FKs Dropped</div>
                </div>
              )}
            </div>

            <div className="mt-4 text-sm text-gray-400">
              <div>
                <strong>From:</strong> {diffResult.from_version.schema_name} - Version {diffResult.from_version.version_number}
              </div>
              <div>
                <strong>To:</strong> {diffResult.to_version.schema_name} - Version {diffResult.to_version.version_number}
              </div>
            </div>
          </Card>

          {/* Changes List */}
          {diffResult.changes.length > 0 && (
            <Panel header="Detected Changes" toggleable className="mb-4">
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
          <Panel header="Generated Migration SQL Script" toggleable collapsed={false}>
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
              style={{ fontFamily: 'monospace' }}
            />

            <div className="mt-2 text-xs text-gray-400">
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
    </div>
  );
}
