// resources/js/Components/DatabaseExportModal.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useProject } from '@/contexts/ProjectContext';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism-tomorrow.css';

interface DatabaseExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DatabaseSchema {
  id: number;
  name: string;
  description?: string;
  current_version?: number;
  last_version?: number;
}

interface SchemaVersion {
  version_number: number;
  is_current: boolean;
  created_at: string;
}

// SQL syntax highlighter using Prism.js
const highlightSQL = (code: string) => {
  try {
    return Prism.highlight(code, Prism.languages.sql, 'sql');
  } catch {
    // SQL syntax highlighting failed
    return code;
  }
};

export default function DatabaseExportModal({ isOpen, onClose }: DatabaseExportModalProps) {
  const { selectedProject } = useProject();
  const [schemas, setSchemas] = useState<DatabaseSchema[]>([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [schemaVersions, setSchemaVersions] = useState<SchemaVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportedSQL, setExportedSQL] = useState<string>('');
  const [activeTab, setActiveTab] = useState<number>(0); // 0 = Download, 1 = View SQL
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const loadSchemas = useCallback(async () => {
    if (!selectedProject) return;

    setLoadingSchemas(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/projects/${selectedProject.id}/schemas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load schemas');
      }

      const data = await response.json();

      // Handle different possible response formats
      let schemasArray = [];
      if (data.schemas) {
        schemasArray = data.schemas;
      } else if (Array.isArray(data)) {
        schemasArray = data;
      } else if (data.data) {
        schemasArray = data.data;
      }
      setSchemas(schemasArray);

      // Auto-select first schema if available
      if (schemasArray && schemasArray.length > 0) {
        setSelectedSchemaId(schemasArray[0].id);
      }
    } catch (error) {
      // Error loading schemas
      setError(error instanceof Error ? error.message : 'Failed to load schemas');
      setSchemas([]);
    } finally {
      setLoadingSchemas(false);
    }
  }, [selectedProject]);

  const loadSchemaVersions = async (schemaId: number) => {
    setLoadingVersions(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/floating-schemas/${schemaId}/versions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load schema versions');
      }

      const data = await response.json();

      // Handle different possible response formats
      let versionsArray = [];
      if (data.versions) {
        versionsArray = data.versions;
      } else if (Array.isArray(data)) {
        versionsArray = data;
      } else if (data.data) {
        versionsArray = data.data;
      }
      setSchemaVersions(versionsArray);

      // Auto-select the highest version number (newest version)
      if (versionsArray && versionsArray.length > 0) {
        // Find the version with the highest version_number
        const highestVersion = versionsArray.reduce((max: SchemaVersion, current: SchemaVersion) => {
          return current.version_number > max.version_number ? current : max;
        });

        setSelectedVersion(highestVersion.version_number);
      }
    } catch (error) {
      // Error loading schema versions
      setError(error instanceof Error ? error.message : 'Failed to load schema versions');
      setSchemaVersions([]);
    } finally {
      setLoadingVersions(false);
    }
  };

  const resetModal = () => {
    setSelectedSchemaId(null);
    setSelectedVersion(null);
    setSchemaVersions([]);
    setExportedSQL('');
    setError(null);
    setActiveTab(0);
  };

  const handleClose = () => {
    if (!loading) {
      resetModal();
      onClose();
    }
  };

  // Load schemas when modal opens
  useEffect(() => {
    if (isOpen && selectedProject) {
      loadSchemas();
    } else if (isOpen && !selectedProject) {
      setError('No project selected. Please select a project first.');
    }
  }, [isOpen, selectedProject, loadSchemas]);

  // Load available versions when schema is selected
  useEffect(() => {
    if (selectedSchemaId) {
      loadSchemaVersions(selectedSchemaId);
    } else {
      setSelectedVersion(null);
      setSchemaVersions([]);
    }
  }, [selectedSchemaId]);

  const exportAndDownload = async () => {
    setActiveTab(0);
    await exportSchema(true); // true = download mode
  };

  const exportAndView = async () => {
    setActiveTab(1);
    await exportSchema(false); // false = view mode
  };

  const exportSchema = async (downloadMode: boolean = false) => {
    if (!selectedProject || !selectedSchemaId || selectedVersion === null) {
      setError('Please select a database and version to export');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the NEW SchemaExportController MySQL export API
      // NEW: Use FIXED export route with working constraints
      const response = await fetch(`/api/temp-mysql-export-fixed/${selectedSchemaId}?version=${selectedVersion}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No tables found in this schema. The schema might be empty or the version doesn\'t exist.');
        } else if (response.status === 403) {
          throw new Error('Access denied to this schema. Please check your permissions.');
        } else {
          throw new Error(`Export failed: HTTP ${response.status}`);
        }
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Export failed');
      }

      const sqlContent = data.sql || '-- No SQL generated';
      setExportedSQL(sqlContent);

      if (downloadMode) {
        // Download mode - trigger download immediately
        downloadSQL(sqlContent);
      }
      // View mode - just set the SQL content, user can see it below
    } catch (error) {
      // Export error
      setError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  };


  const downloadSQL = (sqlContent: string) => {
    const selectedSchema = schemas.find(s => s.id === selectedSchemaId);
    const filename = `${selectedSchema?.name || 'schema'}_v${selectedVersion}_export.sql`;

    const blob = new Blob([sqlContent], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);

    if (downloadLinkRef.current) {
      downloadLinkRef.current.href = url;
      downloadLinkRef.current.download = filename;
      downloadLinkRef.current.click();
    }

    // Clean up URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const getVersionOptions = () => {
    if (!schemaVersions || schemaVersions.length === 0) return [];

    // Sort versions by version_number in descending order (newest first)
    const sortedVersions = [...schemaVersions].sort((a, b) => b.version_number - a.version_number);

    return sortedVersions.map((version: SchemaVersion) => ({
      label: `Version ${version.version_number}${version.is_current ? ' (Current)' : ''}`,
      value: version.version_number
    }));
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportedSQL);
      // Could add toast notification here
    } catch {
      // Failed to copy to clipboard
    }
  };

  return (
    <Dialog
      header="📤 Export Database Schema"
      visible={isOpen}
      onHide={handleClose}
      style={{ width: '60vw', maxWidth: '900px' }}
      modal
      closable={!loading}
      draggable={true}
      resizable={true}
      className="database-export-modal"
      contentStyle={{
        padding: '0',
        backgroundColor: '#1f2937',
        color: 'white',
        maxHeight: '80vh',
        overflow: 'hidden'
      }}
      headerStyle={{
        backgroundColor: '#1f2937',
        color: 'white',
        borderBottom: '1px solid #374151'
      }}
    >
      <div className="bg-gray-800 h-full">
        <p className="text-sm text-gray-400 px-6 pt-4 pb-2">Export database schema as MySQL SQL script</p>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-900 border border-red-600 rounded text-red-200">
            <div className="flex items-center">
              <span className="mr-2">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Selection Controls */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Database Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Database Schema
              </label>
              {loadingSchemas ? (
                <div className="text-gray-400 text-sm">Loading schemas...</div>
              ) : schemas.length > 0 ? (
                <Dropdown
                  value={selectedSchemaId}
                  options={schemas.map(schema => ({
                    label: schema.name,
                    value: schema.id
                  }))}
                  onChange={(e) => setSelectedSchemaId(e.value)}
                  placeholder="Select database..."
                  className="w-full custom-dropdown"
                  panelClassName="custom-dropdown-panel"
                />
              ) : (
                <div className="text-gray-400 text-sm">
                  {selectedProject ? 'No databases found in project' : 'No project selected'}
                </div>
              )}
            </div>

            {/* Version Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Version
              </label>
              {!selectedSchemaId ? (
                <div className="text-gray-400 text-sm">Select database first</div>
              ) : loadingVersions ? (
                <div className="text-gray-400 text-sm">Loading versions...</div>
              ) : schemaVersions.length > 0 ? (
                <Dropdown
                  value={selectedVersion}
                  options={getVersionOptions()}
                  onChange={(e) => setSelectedVersion(e.value)}
                  placeholder="Select version..."
                  className="w-full custom-dropdown"
                  panelClassName="custom-dropdown-panel"
                />
              ) : (
                <div className="text-gray-400 text-sm">No versions found</div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-6">
            <div className="text-xs text-gray-400">
              Export format: MySQL SQL • Structure only
            </div>
            <div className="flex space-x-3">
              <Button
                label="📥 Download .sql"
                onClick={() => exportAndDownload()}
                disabled={loading || !selectedSchemaId || selectedVersion === null}
                className="p-button-outlined p-button-info"
                loading={loading && activeTab === 0}
                size="small"
              />
              <Button
                label="👁️ View SQL"
                onClick={() => exportAndView()}
                disabled={loading || !selectedSchemaId || selectedVersion === null}
                className="p-button-primary"
                loading={loading && activeTab === 1}
                size="small"
              />
            </div>
          </div>
        </div>

        {/* SQL Output Viewer */}
        {exportedSQL && (
          <div className="border-t border-gray-600 h-96">
            <div className="flex justify-between items-center p-4 bg-gray-700">
              <h3 className="text-sm font-medium text-white">Generated SQL Script</h3>
              <div className="flex space-x-2">
                <Button
                  label="📋 Copy"
                  onClick={copyToClipboard}
                  className="p-button-text p-button-sm"
                  size="small"
                />
                <Button
                  label="💾 Download"
                  onClick={() => downloadSQL(exportedSQL)}
                  className="p-button-text p-button-sm"
                  size="small"
                />
              </div>
            </div>
            <div className="h-80 overflow-auto bg-gray-900 border border-gray-600">
              <Editor
                value={exportedSQL}
                onValueChange={() => {}} // Read-only
                highlight={highlightSQL}
                padding={16}
                className="font-mono text-sm"
                style={{
                  backgroundColor: '#111827',
                  color: '#e5e7eb',
                  minHeight: '100%'
                }}
              />
            </div>
          </div>
        )}

        {/* Hidden download link */}
        <a ref={downloadLinkRef} style={{ display: 'none' }} />
      </div>
    </Dialog>
  );
}