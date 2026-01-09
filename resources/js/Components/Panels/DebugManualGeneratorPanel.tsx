import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import { Panel } from 'primereact/panel';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { ErrorBoundary } from 'react-error-boundary';
import { useProject } from '@/contexts/ProjectContext';
import Editor from 'react-simple-code-editor';
import ErrorFallback from '@/Components/ErrorFallback';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import type { Translations } from '@/i18n/types';

// Professional JavaScript syntax highlighter using Prism.js
const highlightCode = (code: string) => {
  try {
    return Prism.highlight(code, Prism.languages.javascript, 'javascript');
  } catch {
    // Fallback to plain text if highlighting fails
    return code;
  }
};

// Line Numbers Component for Syntax Highlighting
const LineNumbersCodeDisplay = ({ code, readOnly = false, onChange }: {
  code: string;
  readOnly?: boolean;
  onChange?: (newCode: string) => void;
}) => {
  const lines = code.split('\n');
  const maxLineNumberWidth = String(lines.length).length;

  if (readOnly) {
    // 🔧 SAUBERE LÖSUNG: Double-escaped Unicode für Display konvertieren
    // Replace \\uXXXX (2 backslashes in string) with readable \n\r\t (1 backslash)
    const displayCode = code
      .replace(/\\\\u000A/g, '\\n')   // \\u000A (2 BS) → \n (1 BS for display)
      .replace(/\\\\u000D/g, '\\r')   // \\u000D (2 BS) → \r (1 BS for display)
      .replace(/\\\\u0009/g, '\\t');  // \\u0009 (2 BS) → \t (1 BS for display)

    const highlightedCode = highlightCode(displayCode);
    const codeLines = highlightedCode.split('\n');

    return (
      <div className="line-numbers-container" style={{
        display: 'flex',
        backgroundColor: '#1a1a1a',
        color: '#d4d4d4',
        fontFamily: '"Courier New", "Consolas", "Monaco", "Lucida Console", monospace',
        fontSize: '14px',
        lineHeight: '20px', // Fixed line height in pixels
        minHeight: '100%', // Fill parent height
        width: '100%'
      }}>
        {/* Line Numbers */}
        <div className="line-numbers" style={{
          padding: '10px 8px 10px 4px',
          backgroundColor: '#0d1117',
          color: '#6e7681',
          borderRight: '1px solid #30363d',
          textAlign: 'right',
          userSelect: 'none',
          minWidth: `${maxLineNumberWidth * 0.8 + 1}em`,
          flexShrink: 0
        }}>
          {lines.map((_, index) => (
            <div key={index} style={{
              height: '20px', // Same as lineHeight
              lineHeight: '20px',
              fontSize: '14px'
            }}>
              {index + 1}
            </div>
          ))}
        </div>

        {/* Code Content */}
        <div className="code-content" style={{
          flex: 1,
          padding: '10px',
          overflow: 'visible',
          fontFamily: 'inherit'
        }}>
          {codeLines.map((line, index) => (
            <div key={index} style={{
              height: '20px', // Same as lineHeight
              lineHeight: '20px',
              fontSize: '14px',
              whiteSpace: 'pre',
              margin: 0
            }}>
              <span dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Editable version - with line numbers
  const displayCodeForEdit = code
    .replace(/\\u000A/g, '\\n')   // \u000A → \n (for display)
    .replace(/\\u000D/g, '\\r')   // \u000D → \r (for display)
    .replace(/\\u0009/g, '\\t');  // \u0009 → \t (for display)

  const handleChange = (newCode: string) => {
    // Convert back to Unicode escapes before saving
    const restoredCode = newCode
      .replace(/\\n/g, '\\u000A')   // \n → \u000A
      .replace(/\\r/g, '\\u000D')   // \r → \u000D
      .replace(/\\t/g, '\\u0009');  // \t → \u0009

    if (onChange) {
      onChange(restoredCode);
    }
  };

  const editLines = displayCodeForEdit.split('\n');

  return (
    <div className="line-numbers-container" style={{
      display: 'flex',
      backgroundColor: '#1a1a1a',
      color: '#d4d4d4',
      fontFamily: '"Courier New", "Consolas", "Monaco", "Lucida Console", monospace',
      fontSize: '14px',
      lineHeight: '20px',
      minHeight: '100%',
      width: '100%',
      position: 'relative'
    }}>
      {/* Line Numbers */}
      <div className="line-numbers" style={{
        padding: '10px 8px 10px 4px',
        backgroundColor: '#0d1117',
        color: '#6e7681',
        borderRight: '1px solid #30363d',
        textAlign: 'right',
        userSelect: 'none',
        minWidth: `${maxLineNumberWidth * 0.8 + 1}em`,
        flexShrink: 0,
        zIndex: 1,
        position: 'relative'
      }}>
        {editLines.map((_, index) => (
          <div key={index} style={{
            height: '20px',
            lineHeight: '20px',
            fontSize: '14px'
          }}>
            {index + 1}
          </div>
        ))}
      </div>

      {/* Editable Code Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        position: 'relative',
        minWidth: 0
      }}>
        <Editor
          value={displayCodeForEdit}
          onValueChange={handleChange}
          highlight={highlightCode}
          padding={10}
          style={{
            fontFamily: '"Courier New", "Consolas", "Monaco", "Lucida Console", monospace',
            fontSize: 14,
            lineHeight: '20px',
            minHeight: '400px',
            width: '100%',
            backgroundColor: '#1a1a1a',
            color: '#d4d4d4',
            outline: 'none'
          }}
          className="code-editor"
          placeholder="// Enter your JavaScript code here..."
          textareaClassName="code-editor-textarea"
        />
      </div>
    </div>
  );
};

// Fallback function for clipboard access in older browsers
const copyToClipboardFallback = (text: string, t: Translations) => {
  try {
    // Create temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    // Try to copy using execCommand
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (successful) {
      // Successfully copied
    } else {
      // Last resort: show alert with text to copy manually
      alert(t.debugmanualgeneratorpanel214+'\n\n' + text.substring(0, 500) + '...');
    }
  } catch {
    alert(t.debugmanualgeneratorpanel217);
  }
};

interface DebugManualGeneratorPanelProps {
  tableId?: number;
  tableName?: string;
  schemaId?: number;
  projectId?: number;
  projectName?: string;
  templateId?: number;
  fileId?: number;
  fileName?: string;
  languageId?: number;
  languageCode?: string;
}

interface Template {
  id: number;
  name: string;
  description: string;
}

interface TemplateFile {
  id: number;
  file_name: string;
  file_type: string;
  file_order: number;
  generation_type?: string; // 'static_file', 'static_directory', 'project_file', 'db_table_file'
}

// interface Project {
//   id: number;
//   name: string;
// }

interface SchemaTable {
  tablename: string;
  nmaxitems: number;
  database_name?: string;
  schema_id?: number;
  is_schema_locked?: boolean;
  items?: Array<{
    name: string;
    type: string;
    controltype: number;
  }>;
}

export default function DebugManualGeneratorPanel({
  tableId: preSelectedTableId,
  tableName: preSelectedTableName,
//  schemaId: preSelectedSchemaId,
  projectId: preSelectedProjectId,
  templateId: preSelectedTemplateId,
  fileId: preSelectedFileId,
  fileName: preSelectedFileName, // ADD: Accept fileName for matching
//  languageId: preSelectedLanguageId,
  languageCode: preSelectedLanguageCode
}: DebugManualGeneratorPanelProps = {}) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { selectedProject, projects } = useProject();

  // Selection States
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [selectedProjectForGenerator, setSelectedProjectForGenerator] = useState<number | null>(selectedProject?.id || null);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [migrationFromVersion, setMigrationFromVersion] = useState<number | null>(null);
  const [schemaVersions, setSchemaVersions] = useState<Array<{id: number, version_number: number}>>([]);
  // 🎯 NEU: Ausgewählte Schema-Version (für Project-Dateien)
  // Wenn null → automatisch die höchste Version verwenden
  const [selectedSchemaVersion, setSelectedSchemaVersion] = useState<number | null>(null);

  // Data States
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateFiles, setTemplateFiles] = useState<TemplateFile[]>([]);
  const [schemaTables, setSchemaTables] = useState<SchemaTable[]>([]);
  const [languageOptions, setLanguageOptions] = useState<Array<{label: string, value: string}>>([]);

  // Content States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [preparedCode, setPreparedCode] = useState<string>('');
  const [executedResult, setExecutedResult] = useState<string>('');
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [includeTemplateSource, setIncludeTemplateSource] = useState(false);
  const [downloadFilename, setDownloadFilename] = useState<string>('generated.php');

  // Validation States (3 categories)
  const [unknownVariables, setUnknownVariables] = useState<Array<{file: string, variable: string, line: number}>>([]);
  const [requiredMissing, setRequiredMissing] = useState<Array<{file: string, variable: string, line: number, description?: string}>>([]);
  const [optionalMissing, setOptionalMissing] = useState<Array<{file: string, variable: string, line: number, description?: string, default_value?: string}>>([]);
  const [_hasValidationWarnings, setHasValidationWarnings] = useState(false);

  // Syntax Validation States
  const [syntaxErrors, setSyntaxErrors] = useState<Array<{file: string, error: string}>>([]);
  const [syntaxWarnings, setSyntaxWarnings] = useState<Array<{file: string, warning: string}>>([]);
  const [_hasSyntaxErrors, setHasSyntaxErrors] = useState(false);

  // Manual Editor Mode
  const [editorUnlocked, setEditorUnlocked] = useState(false);

  // GTree Import Modal
  const [showGTreeImportModal, setShowGTreeImportModal] = useState(false);
  const [gtreeImportText, setGtreeImportText] = useState('');

  // Helper functions (defined early to avoid hoisting issues)
  const getFileGenerationType = useCallback((): 'project_file' | 'db_table_file' | 'project_file_languages' | 'db_table_file_languages' | 'static_file' | 'static_directory' | null => {
    if (!templateFiles || templateFiles.length === 0 || selectedFile === null || selectedFile === undefined) {
      return null;
    }

    const file = templateFiles.find(f => f.id === selectedFile);
    if (!file) return null;

    // Direkte Typen-Zuordnung (bevorzugt)
    if (file.generation_type) {
      return file.generation_type as 'project_file' | 'db_table_file' | 'project_file_languages' | 'db_table_file_languages' | 'static_file' | 'static_directory';
    }

    if (file.file_type) {
      // Datenbank-spezifische Template-Typen
      const dbFileTypes = ['template', 'db_table_file', 'db_table_file_languages', 'model', 'controller', 'view', 'migration'];
      // Projekt-spezifische Template-Typen
      const projectFileTypes = ['project_file', 'project_file_languages', 'config', 'helper', 'static_file', 'static_directory'];

      if (dbFileTypes.includes(file.file_type.toLowerCase())) {
        // Check if it's a language-enabled variant
        if (file.file_type.toLowerCase().includes('languages')) {
          return 'db_table_file_languages';
        }
        return 'db_table_file';
      } else if (projectFileTypes.includes(file.file_type.toLowerCase())) {
        // Check if it's a language-enabled variant
        if (file.file_type.toLowerCase().includes('languages')) {
          return 'project_file_languages';
        }
        return 'project_file';
      }
    }

    // Fallback anhand Dateiname
    const fileName = file.file_name.toLowerCase();
    if (fileName.includes('table') || fileName.includes('model') || fileName.includes('entity')) {
      return fileName.includes('language') ? 'db_table_file_languages' : 'db_table_file';
    } else if (fileName.includes('project') || fileName.includes('config') || fileName.includes('main')) {
      return fileName.includes('language') ? 'project_file_languages' : 'project_file';
    }

    return null; // Unbekannt/Static
  }, [templateFiles, selectedFile]);

  const shouldShowProjectDropdown = useCallback((): boolean => {
    const fileType = getFileGenerationType();
    return fileType === 'project_file' || fileType === 'project_file_languages';
  }, [getFileGenerationType]);

  const shouldShowTableDropdown = useCallback((): boolean => {
    const fileType = getFileGenerationType();
    return fileType === 'db_table_file' || fileType === 'db_table_file_languages';
  }, [getFileGenerationType]);

  const shouldShowLanguageDropdown = useCallback((): boolean => {
    const fileType = getFileGenerationType();
    return fileType === 'project_file_languages' || fileType === 'db_table_file_languages';
  }, [getFileGenerationType]);

  const getSelectedFileName = () => {
    const file = templateFiles.find(f => f.id === selectedFile);
    return file?.file_name || '';
  };

  const loadTemplates = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        return;
      }

      // IMPORTANT: If preSelectedTemplateId exists (from the TreeView), load ALL templates (without filters)
      // Otherwise: Only load templates for the current project
      let url = '/api/templates';
      if (!preSelectedTemplateId && preSelectedProjectId) {
        // Filter only if NO preselected template is selected (normal panel opening)
        url = `/api/templates?project_id=${preSelectedProjectId}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();

        let templatesArray = [];
        if (Array.isArray(data.data)) {
          templatesArray = data.data;
        } else if (Array.isArray(data)) {
          templatesArray = data;
        } else if (data.templates && Array.isArray(data.templates)) {
          templatesArray = data.templates;
        }

        // Filter out inactive templates (is_active = false means template has schadcode or is disabled)
        const activeTemplates = templatesArray.filter((t: Template) => t.is_active !== false);

        setTemplates(activeTemplates);

        if (activeTemplates.length === 0) {
          setError(t.debugmanualgeneratorpanel352);
        }
      } else {
        setError(`Fehler beim Laden der Templates: ${response.status}`);
      }
    } catch {
      setError(t.debugmanualgeneratorpanel358);
    }
  }, [preSelectedProjectId, preSelectedTemplateId]);

  const loadTemplateFiles = useCallback(async (templateId: number) => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');

      const response = await fetch(`/api/template-output/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();

        let filesArray = [];
        if (data.files && Array.isArray(data.files)) {
          filesArray = data.files;
        } else if (Array.isArray(data)) {
          filesArray = data;
        } else if (data.template_files && Array.isArray(data.template_files)) {
          filesArray = data.template_files;
        }

        // More lenient filtering - accept any object with some identifier
        const validFiles = filesArray.map((file: any, index: number) => {
          // Extract filename (API returns 'filename' not 'id')
          const extractedFilename = file.filename || file.file_name || file.name || file.template_file_name || `File ${index + 1}`;

          // Create a normalized file object - KEEP ORIGINAL ID IF AVAILABLE!
          const normalizedFile = {
            id: file.id || index, // Use original file ID if available, otherwise index
            file_name: extractedFilename,
            filename: extractedFilename, // Store original filename for matching
            file_type: file.file_type || file.type || file.template_file_type || file.extension || 'unknown',
            file_order: file.file_order || file.order || index,
            generation_type: file.generation_type || file.type || file.file_type || null,
            // Copy all original properties
            ...file
          };

          return normalizedFile;
        }).filter((file: any) => file.filename !== undefined);

        setTemplateFiles(validFiles);

        // Auto-select first valid file - ONLY if NO preSelectedFileName exists!
        // IMPORTANT: preSelectedFileName is read from the closure, NOT from dependencies!
        if (validFiles.length > 0 && !preSelectedFileName) {
          setSelectedFile(validFiles[0].id);
        } else if (validFiles.length === 0) {
          setSelectedFile(null);
          setError(t.debugmanualgeneratorpanel486+`${templateId}`+t.debugmanualgeneratorpanel486a);
        }
        // If preSelectedFileName exists: DO NOT auto-select, wait for useEffect Pre-Selection!
      } else {
        setError(t.debugmanualgeneratorpanel490+`${response.status}`);
      }
    } catch {
      setError(t.debugmanualgeneratorpanel420);
    }
  }, [preSelectedFileName]); // IMPORTANT: preSelectedFileName for auto-select logic

  const loadSchemaTables = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const allTables: SchemaTable[] = [];

      // Use preSelectedProjectId if available (from TreeView), otherwise use selectedProject from context
      const projectIdToUse = preSelectedProjectId || selectedProject?.id;

      // If we have a project (from TreeView or context), load its schemas
      if (projectIdToUse) {
        try {
          const response = await fetch(`/api/projects/${projectIdToUse}/schemas`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            }
          });

          if (!response.ok) {
            // API call failed - continue to fallback
          }

          if (response.ok) {
            const data = await response.json();

            // Parse schemas from project
            let schemas = [];
            if (Array.isArray(data.schemas)) {
              schemas = data.schemas;
            } else if (Array.isArray(data.data)) {
              schemas = data.data;
            } else if (Array.isArray(data)) {
              schemas = data;
            }

            // Process each schema to extract tables
            for (const schema of schemas) {

              const schemaName = schema.name || schema.schema_name || schema.title || `Schema ${schema.id}`;
              // Get schema versions to find latest one with tables
              if (schema.id) {
                try {
                  const versionsResponse = await fetch(`/api/floating-schemas/${schema.id}/versions`, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Accept': 'application/json',
                    }
                  });

                  if (versionsResponse.ok) {
                    const versionsData = await versionsResponse.json();

                    // Get the latest version - API returns array directly OR wrapped in object
                    const versions = Array.isArray(versionsData) ? versionsData : (versionsData.versions || versionsData.data || []);

                    if (versions.length > 0) {
                      const latestVersion = versions[versions.length - 1]; // Assume last is latest

                      // Get tables for this version
                      const tablesResponse = await fetch(`/api/schema-versions/${latestVersion.id}/tables`, {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Accept': 'application/json',
                        }
                      });

                      if (tablesResponse.ok) {
                        const tablesData = await tablesResponse.json();

                        // API returns tables directly as array OR wrapped in object
                        const tables = Array.isArray(tablesData) ? tablesData : (tablesData.tables || tablesData.data || []);

                        tables.forEach((table: any) => {
                          const tableName = table.table_name || table.name || table.tablename || t.debugmanualgeneratorpanel499;

                          // Get field count from table structure
                          let fieldCount = 0;
                          let tableFields = [];

                          if (table.fields && Array.isArray(table.fields)) {
                            fieldCount = table.fields.length;
                            tableFields = table.fields.map((field: any) => ({
                              name: field.field_name || field.name,
                              type: field.field_type || field.type,
                              controltype: field.controltype || 24,
                            }));
                          } else if (table.columns && Array.isArray(table.columns)) {
                            fieldCount = table.columns.length;
                            tableFields = table.columns.map((col: any) => ({
                              name: col.column_name || col.name,
                              type: col.data_type || col.type,
                              controltype: 24,
                            }));
                          }

                          allTables.push({
                            tablename: tableName,
                            nmaxitems: fieldCount,
                            database_name: schemaName,
                            schema_id: schema.id,
                            is_schema_locked: schema.is_soft_locked === true,
                            items: tableFields
                          });
                        });
                      }
                    }
                  }
                } catch {
                  // Error loading versions for this schema
                }
              }
            }
          }
        } catch {
          // Error loading project schemas
        }
      }

      // Only use fallback if we have no project selected or no project schemas found
      if (allTables.length === 0 && !projectIdToUse) {
        try {
          const globalResponse = await fetch('/api/template-db-schema/schemas', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            }
          });

          if (globalResponse.ok) {
            const globalData = await globalResponse.json();

            const globalSchemas = globalData.schemas || globalData.data || [];

            globalSchemas.forEach((schema: any) => {
              const schemaName = schema.name || schema.schema_name || `Demo Schema ${schema.id}`;
              const tables = schema.tables || schema.parsed_tables || [];

              tables.forEach((table: any) => {
                const tableName = table.table_name || table.name || table.tablename || t.debugmanualgeneratorpanel499;
                const fieldCount = table.fields?.length || table.columns?.length || 0;

                allTables.push({
                  tablename: tableName,
                  nmaxitems: fieldCount,
                  database_name: `${schemaName} (Demo)`,
                  schema_id: schema.id,
                  items: table.fields || table.columns || []
                });
              });
            });
          }
        } catch {
          // Error loading global schemas
        }
      } else if (projectIdToUse && allTables.length === 0) {
        // Project selected but no linked schemas found - this is acceptable
      }

      // Last fallback: gtree-test API (nur wenn gar kein Projekt ausgewählt)
      if (allTables.length === 0 && !projectIdToUse) {
        const gtreeResponse = await fetch('/api/gtree-test/1', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });

        if (gtreeResponse.ok) {
          const gtreeData = await gtreeResponse.json();

          if (gtreeData.gtree && gtreeData.gtree[0] && gtreeData.gtree[0].project[0]) {
            const tables = gtreeData.gtree[0].project[0].tables || [];

            const fallbackTables = tables.map((table: any) => ({
              ...table,
              database_name: t.debugmanualgeneratorpanel600
            }));

            allTables.push(...fallbackTables);
          }
        }
      }

      setSchemaTables(allTables);

      // Reset table selection when schemas change
      setSelectedTable(null);

    } catch {
      setSchemaTables([]);
    }
  }, [selectedProject, preSelectedProjectId]);

  const loadLanguages = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        return;
      }
      const response = await fetch('/api/active-languages', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        let languages = Array.isArray(data) ? data : (data.languages || data.data || []);

        // IMPORTANT: If preSelectedLanguageCode exists (from the TreeView), load ALL languages (without filter)
        // Otherwise: Load only languages for the current project
        if (!preSelectedLanguageCode && selectedProject?.enabled_languages && Array.isArray(selectedProject.enabled_languages)) {
          // Filter only if NO preselected language (normal panel opening)
          languages = languages.filter((lang: any) =>
            selectedProject.enabled_languages?.includes(lang.code)
          );
        }

        const languageOpts = languages.map((lang: any) => ({
          label: `${lang.flag} ${lang.name}`,
          value: lang.code
        }));

        setLanguageOptions(languageOpts);

        // Auto-select first language - ONLY if NO preSelectedLanguageCode is present!
        // IMPORTANT: preSelectedLanguageCode is read from the closure, NOT from dependencies!
        if (languageOpts.length > 0 && !selectedLanguage && !preSelectedLanguageCode) {
          setSelectedLanguage(languageOpts[0].value);
        }
        // If preSelectedLanguageCode exists: DO NOT auto-select, wait for useEffect Pre-Selection!
      }
    } catch {
      setLanguageOptions([]);
    }
  }, [selectedLanguage, selectedProject, preSelectedLanguageCode]);

  // Load data on component mount
  useEffect(() => {
    loadTemplates();
    loadLanguages();
  }, [loadTemplates, loadLanguages]);

  // Load template files when template changes
  useEffect(() => {
    if (selectedTemplate) {
      loadTemplateFiles(selectedTemplate);
    }
  }, [selectedTemplate, loadTemplateFiles]);

  // Load schema tables when project changes
  useEffect(() => {
    loadSchemaTables();
  }, [loadSchemaTables]);

  // Load schema versions when table is selected
  const loadSchemaVersions = useCallback(async (schemaId: number) => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`/api/floating-schemas/${schemaId}/versions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const versions = Array.isArray(data) ? data : (data.versions || data.data || []);
        setSchemaVersions(versions.map((v: any) => ({
          id: v.id,
          version_number: v.version_number
        })).sort((a: {version_number: number}, b: {version_number: number}) => b.version_number - a.version_number));
      } else {
        setSchemaVersions([]);
      }
    } catch {
      setSchemaVersions([]);
    }
  }, []);

  // Update schema versions when table selection changes OR when schemaTables are loaded
  // 🎯 WICHTIG: Auch für Project-Dateien (keine Tabelle ausgewählt) Schema-Versionen laden!
  useEffect(() => {
    if (selectedTable !== null && schemaTables[selectedTable]?.schema_id) {
      // Tabelle ausgewählt → Schema-ID von der Tabelle
      loadSchemaVersions(schemaTables[selectedTable].schema_id);
      setMigrationFromVersion(null); // Reset migration version on table change
    } else if (selectedTable === null && schemaTables.length > 0 && schemaTables[0]?.schema_id) {
      // 🎯 NEU: Keine Tabelle ausgewählt (Project-Datei), aber schemaTables vorhanden
      // → Schema-ID von der ERSTEN Tabelle nehmen (alle Tabellen gehören zum gleichen Schema)
      loadSchemaVersions(schemaTables[0].schema_id);
      // Migration-Version NICHT zurücksetzen bei Project-Dateien, da keine Tabelle gewählt wird
    } else {
      setSchemaVersions([]);
      setMigrationFromVersion(null);
    }
  }, [selectedTable, schemaTables, loadSchemaVersions]);

  // 🎯 NEU: Schema-Version Optionen für das Dropdown (alle verfügbaren Versionen)
  const schemaVersionOptions = useMemo(() => {
    if (schemaVersions.length === 0) return [];

    // Alle Versionen als Optionen (höchste zuerst)
    return schemaVersions
      .map(v => ({ label: `Version ${v.version_number}`, value: v.version_number }))
      .sort((a, b) => b.value - a.value);
  }, [schemaVersions]);

  // 🎯 NEU: Automatisch die höchste Version auswählen, wenn Schema-Versionen geladen werden
  useEffect(() => {
    if (schemaVersions.length > 0 && selectedSchemaVersion === null) {
      const maxVersion = Math.max(...schemaVersions.map(v => v.version_number));
      setSelectedSchemaVersion(maxVersion);
    }
  }, [schemaVersions, selectedSchemaVersion]);

  // 🎯 ANGEPASST: Migration-Optionen basierend auf selectedSchemaVersion filtern
  // Nur Versionen < selectedSchemaVersion anzeigen
  const migrationVersionOptions = useMemo(() => {
    if (schemaVersions.length === 0) return [];

    // Wenn keine Schema-Version ausgewählt, höchste verwenden
    const targetVersion = selectedSchemaVersion ?? Math.max(...schemaVersions.map(v => v.version_number));

    // Wenn nur Version 1 oder keine niedrigere Version existiert, keine Migration möglich
    if (targetVersion <= 1) return [];

    // Generate options from (targetVersion - 1) down to 1
    const options = [];
    for (let v = targetVersion - 1; v >= 1; v--) {
      options.push({ label: `Version ${v}`, value: v });
    }
    return options;
  }, [schemaVersions, selectedSchemaVersion]);

  // 🎯 NEU: Wenn selectedSchemaVersion geändert wird und migrationFromVersion >= selectedSchemaVersion,
  // dann migrationFromVersion zurücksetzen
  useEffect(() => {
    if (selectedSchemaVersion !== null && migrationFromVersion !== null) {
      if (migrationFromVersion >= selectedSchemaVersion) {
        setMigrationFromVersion(null);
      }
    }
  }, [selectedSchemaVersion, migrationFromVersion]);

  // Pre-select table when opened from TreeView
  useEffect(() => {
    // Only auto-select if:
    // 1. We have pre-selected table info from TreeView
    // 2. Tables are loaded
    // 3. No table has been selected yet (or manually changed by user)
    if (preSelectedTableId && preSelectedTableName && schemaTables.length > 0) {
      // Find the table by name in the loaded schema tables
      const tableIndex = schemaTables.findIndex(
        (table) => table.tablename === preSelectedTableName
      );

      // Only set if found and not already set (to avoid overwriting user selection)
      if (tableIndex !== -1 && selectedTable === null) {
        // Use setTimeout to ensure this runs after the component has fully mounted
        setTimeout(() => {
          setSelectedTable(tableIndex);
        }, 100);
      }
    }
  }, [preSelectedTableId, preSelectedTableName, schemaTables, selectedTable]);

  // Pre-select template when opened from File Preview
  useEffect(() => {
    if (preSelectedTemplateId && templates.length > 0 && !selectedTemplate) {
      // Check if the template exists in the loaded templates
      // Try both number and string comparison in case of type mismatch
      const templateExists = templates.some(t => t.id === preSelectedTemplateId || t.id == preSelectedTemplateId);
      if (templateExists) {
        setTimeout(() => {
          setSelectedTemplate(preSelectedTemplateId);
        }, 100);
      }
    }
  }, [preSelectedTemplateId, templates, selectedTemplate]);

  // Pre-select file when opened from File Preview
  useEffect(() => {
    if (preSelectedFileId && templateFiles.length > 0) {
      // Match by ID instead of filename
      const matchedFile = templateFiles.find(f => f.id === preSelectedFileId);
      if (matchedFile) {
        // Slight delay after template files load
        setTimeout(() => {
          setSelectedFile(matchedFile.id); // Use the normalized index-based ID
        }, 200);
      }
    }
  }, [preSelectedFileName, preSelectedFileId, templateFiles, selectedFile]);

  // Pre-select language when opened from File Preview
  useEffect(() => {
    if (preSelectedLanguageCode && languageOptions.length > 0 && !selectedLanguage) {
      // Check if the language exists in the loaded language options
      const languageExists = languageOptions.some(l => l.value === preSelectedLanguageCode);
      if (languageExists) {
        setTimeout(() => {
          setSelectedLanguage(preSelectedLanguageCode);
        }, 100);
      }
    }
  }, [preSelectedLanguageCode, languageOptions, selectedLanguage]);

  const fetchCode = async () => {
    if (!selectedTemplate || (selectedFile === null || selectedFile === undefined)) {
      setError(t.debugmanualgeneratorpanel746);
      return;
    }

    const fileGenerationType = getFileGenerationType();

    if ((fileGenerationType === 'project_file' || fileGenerationType === 'project_file_languages') && !selectedProjectForGenerator) {
      setError(t.debugmanualgeneratorpanel753);
      return;
    }

    if ((fileGenerationType === 'db_table_file' || fileGenerationType === 'db_table_file_languages') && (selectedTable === null || selectedTable === undefined)) {
      setError(t.debugmanualgeneratorpanel758);
      return;
    }

    if ((fileGenerationType === 'project_file_languages' || fileGenerationType === 'db_table_file_languages') && !selectedLanguage) {
      setError(t.debugmanualgeneratorpanel763);
      return;
    }

    if (!fileGenerationType || ['static_file', 'static_directory'].includes(fileGenerationType)) {
      setError(t.debugmanualgeneratorpanel768);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');

      // Build URL with project parameter to ensure backend uses only linked schemas
      const url = new URL(`/api/ultimate-template/${selectedTemplate}`, window.location.origin);
      if (selectedProject) {
        url.searchParams.set('project_id', selectedProject.id.toString());
      }

      // Add table parameter for db_table_file types
      if ((fileGenerationType === 'db_table_file' || fileGenerationType === 'db_table_file_languages') && selectedTable !== null) {
        const selectedTableData = schemaTables[selectedTable];
        if (selectedTableData) {
          url.searchParams.set('table_name', selectedTableData.tablename);
        }
      }

      // Add language parameter for language-enabled types
      if ((fileGenerationType === 'project_file_languages' || fileGenerationType === 'db_table_file_languages') && selectedLanguage) {
        url.searchParams.set('language_code', selectedLanguage);
      }

      // ✅ ALWAYS add language_code for validation (even for non-language files)
      // This ensures template variable validation uses the current language
      if (selectedLanguage && !url.searchParams.has('language_code')) {
        url.searchParams.set('language_code', selectedLanguage);
      }

      // Add include_source parameter if checkbox is enabled
      if (includeTemplateSource) {
        url.searchParams.set('include_source', '1');
      }

      // Add migration_from_version parameter if set
      if (migrationFromVersion !== null) {
        url.searchParams.set('migration_from_version', migrationFromVersion.toString());
      }

      // 🎯 NEU: Add schema_version parameter for Project-Dateien
      // Damit das Backend die richtige Schema-Version lädt (nicht automatisch die neueste)
      if (selectedSchemaVersion !== null && shouldShowProjectDropdown()) {
        url.searchParams.set('schema_version', selectedSchemaVersion.toString());
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();

        // ✅ Extract syntax validation errors/warnings
        if (data.validation) {
          setSyntaxErrors(data.validation.syntax_errors || []);
          setSyntaxWarnings(data.validation.syntax_warnings || []);
          setHasSyntaxErrors(data.validation.has_syntax_errors || false);
        } else {
          setSyntaxErrors([]);
          setSyntaxWarnings([]);
          setHasSyntaxErrors(false);
        }

        // ✅ Extract validation warnings (3 categories)
        if (data.validation) {
          setUnknownVariables(data.validation.unknown_variables || []);
          setRequiredMissing(data.validation.required_missing || []);
          setOptionalMissing(data.validation.optional_missing || []);

          const hasAnyWarnings = data.validation.has_unknown_variables ||
                                 data.validation.has_required_missing ||
                                 data.validation.has_optional_missing;
          setHasValidationWarnings(hasAnyWarnings);
        } else {
          setUnknownVariables([]);
          setRequiredMissing([]);
          setOptionalMissing([]);
          setHasValidationWarnings(false);
        }

        // Find the specific file for the selected table/project
        let targetFile = null;
        const fileGenerationType = getFileGenerationType();

        if ((fileGenerationType === 'db_table_file' || fileGenerationType === 'db_table_file_languages') && selectedTable !== null) {
          // Find file for specific table
          const selectedTableData = schemaTables[selectedTable];
          const expectedFileName = getSelectedFileName();

          // Try multiple matching strategies
          targetFile = data.processed_files?.find((file: any) => {
            const matchesTableName = file.table_name === selectedTableData?.tablename;
            const matchesFileName = file.generated_from_template === expectedFileName || file.filename === expectedFileName;
            const matchesOriginalTemplate = file.original_template === expectedFileName;

            const shouldMatch = matchesTableName && (matchesFileName || matchesOriginalTemplate);

            return shouldMatch;
          });

          // Fallback: try to find any file with matching template name
          if (!targetFile) {
            targetFile = data.processed_files?.find((file: any) => {
              const matchesFileName = file.generated_from_template === expectedFileName || file.filename === expectedFileName || file.original_template === expectedFileName;
              return matchesFileName;
            });
          }

        } else if ((fileGenerationType === 'project_file' || fileGenerationType === 'project_file_languages')) {
          // Find project-level file
          const expectedFileName = getSelectedFileName();

          targetFile = data.processed_files?.find((file: any) => {
            const matchesProjectFile = file.is_project_file;
            const matchesFileName = file.generated_from_template === expectedFileName || file.filename === expectedFileName || file.original_template === expectedFileName;
            const shouldMatch = matchesProjectFile && matchesFileName;

            return shouldMatch;
          });

          // Fallback: try to find any file with matching template name
          if (!targetFile) {
            targetFile = data.processed_files?.find((file: any) => {
              const matchesFileName = file.generated_from_template === expectedFileName || file.filename === expectedFileName || file.original_template === expectedFileName;
              return matchesFileName;
            });
          }
        }

        if (targetFile) {
          // Use backend gtree data (contains full database structure)
          const gtreeData = data.gtree || [];

          // Store gtree in localStorage for efficient access during execution
          localStorage.setItem('scoriet_gtree', JSON.stringify(gtreeData));

          // Store processed filename for download
          setDownloadFilename(targetFile.filename || 'generated.php');

          // Trigger re-render for button state
          setTimeout(() => {
            // Force component update to enable GTree copy button
          }, 100);

          const originalCode = targetFile.compiled_content; // Use compiled_content from new API

          // Check backend-generated template size before processing
          const originalSizeKB = Math.round(originalCode.length / 1024);
          const maxOriginalSizeKB = 150; // Conservative limit for backend content

          if (originalCode.length > maxOriginalSizeKB * 1024) {
            setError(t.debugmanualgeneratorpanel990+`(${originalSizeKB}KB`+t.debugmanualgeneratorpanel990a+`${maxOriginalSizeKB}KB).`+t.debugmanualgeneratorpanel990b);
            setLoading(false);
            return;
          }

          // 🔧 REMOVED: DO NOT convert \n to real newlines for display!
          // This was breaking the code display by converting escape sequences
          // let cleanedCode = originalCode.replace(/\\n/g, '\n');
          let cleanedCode = originalCode; // Keep \n as text for proper display

          // Convert indent placeholders to Unicode spaces BEFORE Unicode conversion
          cleanedCode = cleanedCode.replace(/§INDENT2§/g, '\\u0020\\u0020');
          cleanedCode = cleanedCode.replace(/§INDENT4§/g, '\\u0020\\u0020\\u0020\\u0020');


          // 🔧 DO NOT convert \\uXXXX here! Keep them as-is for preparedCode
          // They will be converted ONLY for display (not for execution)
          // This prevents JS from interpreting them as real tabs/newlines during eval

          // Convert Unicode spaces back to regular spaces for indentation
          cleanedCode = cleanedCode.replace(/\\u0020/g, ' ');

          // Add lightweight gtree loader instead of embedding huge JSON
          const gtreeCode = `// GTree Data loaded efficiently from localStorage
const gtree = JSON.parse(localStorage.getItem('scoriet_gtree') || '[]');

`;

          const codeWithGTree = gtreeCode + cleanedCode;

          // Check code size limit (200KB)
          const codeSizeKB = Math.round(codeWithGTree.length / 1024);
          const maxSizeKB = 200;

          if (codeWithGTree.length > maxSizeKB * 1024) {
            setError(`Template-Code zu groß (${codeSizeKB}KB von max. ${maxSizeKB}KB). Bitte Template vereinfachen oder weniger Tabellen verwenden.`);
            setLoading(false);
            return;
          }

          setPreparedCode(codeWithGTree);
          setActiveTabIndex(0); // Switch to prepared code tab
          setExecutedResult(''); // Clear previous result
        } else {
          // Enhanced error message with debug info
          let errorMsg = t.debugmanualgeneratorpanel1035+'\\n\\n';
          errorMsg += `  `+t.debugmanualgeneratorpanel1036+`\\n`;
          errorMsg += `  `+t.debugmanualgeneratorpanel1037+`${selectedTemplate}\\n`;
          errorMsg += `  `+t.debugmanualgeneratorpanel1038+`${getSelectedFileName()}\\n`;
          errorMsg += `  `+t.debugmanualgeneratorpanel1039+`${fileGenerationType}\\n`;

          if (fileGenerationType === 'db_table_file' || fileGenerationType === 'db_table_file_languages') {
            const selectedTableData = schemaTables[selectedTable!];
            errorMsg += `  Tabelle: ${selectedTableData?.tablename || t.testprojectschemas50}\\n`;
          }

          if (fileGenerationType === 'project_file_languages' || fileGenerationType === 'db_table_file_languages') {
            errorMsg += `  `+t.debugmanualgeneratorpanel1047+`${selectedLanguage || t.testprojectschemas50}\\n`;
          }

          errorMsg += `\\n`+t.debugmanualgeneratorpanel1050+`(${data.processed_files?.length || 0}):\\n`;
          if (data.processed_files?.length > 0) {
            data.processed_files.slice(0, 5).forEach((file: any, idx: number) => {
              errorMsg += `  ${idx + 1}. ${file.filename || file.generated_from_template || t.testprojectschemas50} ${file.table_name ? `(${file.table_name})` : ''}\\n`;
            });
            if (data.processed_files.length > 5) {
              errorMsg += `  ... ${data.processed_files.length - 5} `+t.debugmanualgeneratorpanel1056+`\\n`;
            }
          }

          errorMsg += '\\n'+t.debugmanualgeneratorpanel1060;

          setError(errorMsg);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || t.debugmanualgeneratorpanel959);
      }
    } catch {
      setError(t.debugmanualgeneratorpanel959);
    } finally {
      setLoading(false);
    }
  };

  // Check if selected project is locked
  const isProjectLocked = (): boolean => {
    return selectedProject?.is_soft_locked === true;
  };

  // Check if selected table's schema is locked
  const isSchemaLocked = (): boolean => {
    if (selectedTable === null || selectedTable === undefined) return false;
    const table = schemaTables[selectedTable];
    return table?.is_schema_locked === true;
  };

  const executeCode = () => {
    if (!preparedCode) {
      setError(t.debugmanualgeneratorpanel970);
      return;
    }

    // Block execution if project is locked
    if (isProjectLocked()) {
      setError('Das Projekt ist gesperrt. Bitte erneuern Sie das Abo in der Projektverwaltung.');
      return;
    }

    // Block execution if schema is locked
    if (isSchemaLocked()) {
      setError('Die Datenbank ist gesperrt. Bitte entsperren Sie sie im Database Manager.');
      return;
    }

    // Performance monitoring
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

    // Memory check before execution
    if ((performance as any).memory) {
      const availableMemory = (performance as any).memory.jsHeapSizeLimit || 0;
      const currentMemory = (performance as any).memory.usedJSHeapSize || 0;
      const memoryUsagePercent = Math.round((currentMemory / availableMemory) * 100);

      if (memoryUsagePercent > 80) {
        setError(t.debugmanualgeneratorpanel1092+`${memoryUsagePercent}`+t.debugmanualgeneratorpanel1092a);
        return;
      }
    }

    try {
      // Try to execute the JavaScript function directly using eval
      // This is safe since we control the code generation
      let result = '';
        // 🔧 Convert Unicode escapes - SIMPLE string replace (no regex!)
        let executableCode = preparedCode;

        // preparedCode has 4 backslashes in string content (shown as \\\\u0009 in console)
        // We need to match 4 backslashes + u0009: split('\\\\\\\\u0009')
        // (8 backslashes in code literal = 4 backslashes in string content)

        // 1. Convert \\\\u0009 to real Tab character (removes all backslashes, replaces with tab)
        executableCode = executableCode.split('\\\\\\\\u0009').join('\t');

        // 2. Convert \\\\u000D/A to \\r/n (4 BS → 2 BS, eval will parse 2 BS as 1 BS + r/n TEXT)
        executableCode = executableCode.split('\\\\\\\\u000D').join('\\\\r');
        executableCode = executableCode.split('\\\\\\\\u000A').join('\\\\n');

        const globalEval = eval;
        // Use indirect eval (not template literal) to avoid escape sequence interpretation
        globalEval(executableCode);

        // Try to find and call the generated function
        const functionMatch = executableCode.match(/function\s+(\w+)\s*\(/);
        if (functionMatch) {
          const functionName = functionMatch[1];

          // Get function from global scope and call it
          const generatedFunction = (window as any)[functionName];
          if (generatedFunction) {
            result = generatedFunction() || '';
          } else {
            throw new Error(t.debugmanualgeneratorpanel1129+`${functionName}`+t.debugmanualgeneratorpanel1129a);
          }
        } else {
          // No function found, try fallback interpretation
          throw new Error(t.debugmanualgeneratorpanel1026);
        }

      // Performance reporting
      const endTime = performance.now();
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const executionTime = Math.round(endTime - startTime);
      const memoryUsed = Math.round((endMemory - startMemory) / 1024); // KB

      // Warning for long execution times
      if (executionTime > 5000) {
        result += `\n\n`+t.debugmanualgeneratorpanel1144+`${executionTime}ms (>5s).`+t.debugmanualgeneratorpanel1144a;
      }

      // Performance stats
      result += `\n\n`+t.debugmanualgeneratorpanel1148+`${executionTime}ms,`+t.debugmanualgeneratorpanel1148a+`${memoryUsed}KB`;

      // Set the final result
      setExecutedResult(result);
      setActiveTabIndex(1); // Switch to result tab
    } catch (execError) {
      // Set error result when execution fails
      setExecutedResult(t.debugmanualgeneratorpanel1155+` `+t.debugmanualgeneratorpanel1048+` `+t.debugmanualgeneratorpanel1155a+`\n\n${(execError as Error).message || t.schematranslationpanel319}`);
      setActiveTabIndex(1); // Switch to result tab to show error

      // Enhanced error handling with line number detection
      let errorMessage = '';
      const error = execError as Error;

      // Try to extract line number from error stack and convert to template line number
      let lineNumber = '';
      if (error.stack) {
        const lineMatch = error.stack.match(/:(\d+):\d+/);
        if (lineMatch) {
          const jsLineNumber = parseInt(lineMatch[1]);

          // Debug: Show the actual code that was executed
          if (preparedCode) {
            const codeLines = preparedCode.split('\n');

            // Find where the function starts (gtree ends)
            let gtreeLines = 0;
            for (let i = 0; i < codeLines.length; i++) {
              const line = codeLines[i].trim();
              if (line.startsWith('function ') || line.includes('function ')) {
                gtreeLines = i;
                break;
              }
            }

            // Since the error line number seems unrelated to our small code,
            // let's try a different approach: find the error line in our actual code
            if (jsLineNumber > codeLines.length) {
              // Error line is beyond our code - probably from eval context
              lineNumber = ` (Error may be in line ~${jsLineNumber % codeLines.length || 1} of template)`;
            } else if (jsLineNumber > gtreeLines) {
              const templateLineNumber = jsLineNumber - gtreeLines;
              lineNumber = ` (Template Line ${templateLineNumber}, JS Line ${jsLineNumber})`;
            } else {
              lineNumber = ` (JS Line ${jsLineNumber} - in gtree setup)`;
            }
          } else {
            lineNumber = ` (JS Line ${jsLineNumber})`;
          }
        }
      }

      if (error.name === t.debugmanualgeneratorpanel1093) {
        errorMessage = t.debugmanualgeneratorpanel1201+`${lineNumber}:\n\n`+t.debugmanualgeneratorpanel1201a+`${error.message}\n\n`+t.debugmanualgeneratorpanel1201b;

      } else if (error.name === t.debugmanualgeneratorpanel1096) {
        // Extract variable name if possible
        const variableMatch = error.message.match(/(\w+) is not defined/);
        const variable = variableMatch ? variableMatch[1] : 'unknown';

        errorMessage = t.debugmanualgeneratorpanel1208+`${lineNumber}:\n\n`+t.debugmanualgeneratorpanel1208a+`"${variable}" `+t.debugmanualgeneratorpanel1208b+`${error.message}\n\n`+t.debugmanualgeneratorpanel1208c+`{${variable} `+t.debugmanualgeneratorpanel1208d;

      } else if (error.name === 'TypeError') {
        errorMessage = t.debugmanualgeneratorpanel1211+`${lineNumber}:\n\n`+t.debugmanualgeneratorpanel1211a+`${error.message}\n\n`+t.debugmanualgeneratorpanel1211b;

      } else {
        errorMessage = t.debugmanualgeneratorpanel1214+`${lineNumber}:\n\n`+t.debugmanualgeneratorpanel1214a+`${error.message || t.schematranslationpanel319}\n`+t.debugmanualgeneratorpanel1214b+`${error.name || t.testprojectschemas50}\n\n`+t.debugmanualgeneratorpanel1214c;
      }

      // Only try fallback for SyntaxError, not for runtime errors
      if (error.name === t.debugmanualgeneratorpanel1093) {
        try {
        let result = '';
        const functionMatch = preparedCode.match(/function\s+(\w+)\s*\([^)]*\)\s*\{([\s\S]*)\}/);
        if (functionMatch) {
            const [, , functionBody] = functionMatch;
            const lines = functionBody.split('\n');
            let sContentResult = '';

        // Get gtree data for execution (commented out as not used in simple interpretation)
        // const gtree = schemaTables.length > 0 ? [{
        //   project: [{
        //     projectname: currentProject?.name || 'TestProject',
        //     nmaxfiles: schemaTables.length,
        //     tables: schemaTables.map((table, index) => ({
        //       ...table,
        //       tableIndex: index
        //     }))
        //   }]
        // }] : [];

        // Simple JavaScript interpretation
        for (const line of lines) {
          const trimmed = line.trim();

          if (trimmed.startsWith('sContentResult +=')) {
            const stringMatch = trimmed.match(/sContentResult\s*\+=\s*'([^']*)';\s*$/);
            if (stringMatch) {
              let content = stringMatch[1];
              // Normalize line endings and handle Unicode newlines
              content = content
                .replace(/\\u000A/g, '\n')       // Convert Unicode newlines to actual newlines
                .replace(/\\n/g, '\n')           // Convert escaped \n to actual newlines (legacy)
                .replace(/\r\n/g, '\n')          // Convert Windows CRLF to LF
                .replace(/\{n\}/g, '\n')         // Convert {n} placeholder to newlines (legacy)
                .replace(/§/g, '\n');            // Convert § placeholder to newlines (legacy)
              sContentResult += content;
            }
          } else if (trimmed.includes('for (let i = 0; i < gtree[0].project[0].tables[')) {
            // Handle loops if we have table data
            const fileGenerationType = getFileGenerationType();
            if (fileGenerationType === 'db_table_file' && selectedTable !== null && schemaTables[selectedTable]) {
              const table = schemaTables[selectedTable];
              if (table.items) {
                // Simulate loop execution
                sContentResult += `\n// Loop executed for table: ${table.tablename}\n`;
                table.items.forEach((item: any, i: number) => {
                  sContentResult += `// Field ${i}: ${item.name} (${item.type})\n`;
                });
              }
            }
          }
        }

          // Normalize final output line endings and handle all placeholders
          const normalizedResult = sContentResult
            .replace(/\\u000A/g, '\n')       // Convert Unicode newlines to actual newlines
            .replace(/\r\n/g, '\n')          // Convert Windows CRLF to LF
            .replace(/\r/g, '\n')            // Convert standalone CR to LF
            .replace(/\{n\}/g, '\n')         // Convert {n} placeholder to newlines (legacy)
            .replace(/§/g, '\n');            // Convert § placeholder to newlines (legacy)
          result = normalizedResult;
        } else {
          result = 'Error: Could not parse JavaScript function\n\n' + preparedCode;
        }

          // Set the fallback result with a note about fallback
          setExecutedResult(`⚠️ Fallback interpretation enabled (SyntaxError):\n\n${result}\n\n🔧 Original Error:\n${errorMessage}`);
          setActiveTabIndex(1); // Switch to result tab
        } catch (fallbackErr) {
          // Use the enhanced error message from the main catch block
          const fallbackError = fallbackErr as Error;
          setExecutedResult(`${errorMessage}\n\n🔧 Fallback interpretation also failed:\n${fallbackError.message || t.debugmanualgeneratorpanel1183}\n\nOriginal code (first 500 characters):\n${preparedCode.substring(0, 500)}...`);
        }
      } else {
        // For non-SyntaxErrors (ReferenceError, TypeError, etc.), show error immediately without fallback
        setExecutedResult(`${errorMessage}\n\n🔍 Debug tip: Use the Debug Helper tab for detailed analysis.`);
        setActiveTabIndex(1); // Switch to result tab
      }
    }
  };

  // Handle GTree Import from Text
  const handleGTreeImportFromText = () => {
    try {
      let content = gtreeImportText.trim();

      if (!content) {
        alert('❌ Please insert GTree JSON');
        return;
      }

      // Remove "const gtree = " if present
      if (content.includes('const gtree =')) {
        content = content.replace(/const\s+gtree\s*=\s*/, '').replace(/;?\s*$/, '');
      }

      // Parse JSON to validate
      const gtreeData = JSON.parse(content);

      // Validate basic structure
      if (!Array.isArray(gtreeData) || gtreeData.length === 0) {
        alert('❌ Invalid GTree format: Must be an array');
        return;
      }

      if (!gtreeData[0]?.project || !Array.isArray(gtreeData[0].project)) {
        alert('❌ Invalid GTree format: project array missing');
        return;
      }

      // Save to localStorage
      localStorage.setItem('scoriet_gtree', JSON.stringify(gtreeData));

      alert(`✅ GTree successfully imported!\n\n📊 Projekt: ${gtreeData[0].project[0]?.projectname || 'Unbekannt'}\n📁 Tables:${gtreeData[0].project[0]?.tables?.length || 0}`);

      // Close modal and clear text
      setShowGTreeImportModal(false);
      setGtreeImportText('');

    } catch (error) {
      alert(`❌ Import error:\n\n${(error as Error).message}\n\nMake sure the text contains a valid GTree JSON.`);
    }
  };

  // Handle Unlock Editor for manual testing
  const handleUnlockEditor = () => {
    if (!editorUnlocked) {
      // Generate starter template code
      const selectedTableData = schemaTables.find(t => t.id === selectedTable);
      const tableName = selectedTableData?.tablename || 'table';
      const fileName = getSelectedFileName() || 'file';
      const languageCode = selectedLanguage || 'en';

      // Create function name from file name (sanitize)
      const functionName = `generate_${fileName.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_{2,}/g, '_')}`;

      const starterCode = `// GTree Data loaded efficiently from localStorage
const gtree = JSON.parse(localStorage.getItem('scoriet_gtree') || '[]');

function ${functionName}() {
  let sContentResult = '';

  // Your custom code here
  sContentResult += '// Generated by ${functionName}\\n';
  sContentResult += '// Table: ${tableName}\\n';
  sContentResult += '// Language: ${languageCode}\\n\\n';

  return sContentResult;
}`;

      setPreparedCode(starterCode);
      setEditorUnlocked(true);
      setActiveTabIndex(0); // Switch to code tab
    } else {
      // Lock editor again (reset)
      setEditorUnlocked(false);
      setPreparedCode('');
      setExecutedResult('');
    }
  };

  // Dropdown Options
  const templateOptions = Array.isArray(templates) ? templates.map(t => ({
    label: `${t.id}: ${t.name}`,
    value: t.id
  })) : [];

  const fileOptions = Array.isArray(templateFiles) ? templateFiles
    .filter(f => f && f.id !== undefined && f.id !== null) // Filter invalid entries first
    .map(f => {
      const fileName = f.file_name || (f as any).name || (f as any).filename || (f as any).template_file_name || 'Unbenannt';
      const fileType = f.file_type || (f as any).type || (f as any).template_file_type || t.testprojectschemas50;

      return {
        label: `${fileName} (${fileType})`,
        value: f.id
      };
    })
    .filter(f => f.label && !f.label.includes('undefined') && f.label !== t.debugmanualgeneratorpanel1210) // Remove any remaining undefined labels
    : [];


  // Debug button state
  // const shouldShowProject = shouldShowProjectDropdown();
  // const shouldShowTable = shouldShowTableDropdown();

  const projectOptions = Array.isArray(projects) ? projects.map(p => ({
    label: p.name,
    value: p.id
  })) : [];

  const tableOptions = Array.isArray(schemaTables) ? schemaTables
    .map((table, index) => ({
      label: table.database_name
        ? `${table.database_name} - ${table.tablename} (${table.nmaxitems} fields)`
        : `${table.tablename} (${table.nmaxitems} fields)`,
      value: index,
      database: table.database_name || t.testprojectschemas50,
      is_schema_locked: table.is_schema_locked === true
    }))
    .sort((a, b) => a.label.localeCompare(b.label)) // Alphabetisch sortiert
    : [];

  // Check if button should be enabled
  const projectConditionResult = !(shouldShowProjectDropdown() && !selectedProjectForGenerator);
  // FIXED: 0 is a valid table index!
  const tableConditionResult = !shouldShowTableDropdown() || (selectedTable !== null && selectedTable !== undefined);
  const languageConditionResult = !shouldShowLanguageDropdown() || (selectedLanguage !== null && selectedLanguage !== undefined);

  const isButtonEnabled = Boolean(
    !loading &&
    selectedTemplate &&
    (selectedFile !== null && selectedFile !== undefined) &&
    projectConditionResult &&
    tableConditionResult &&
    languageConditionResult
  );


  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => (
        <ErrorFallback error={error} resetError={() => {}} />
      )}
    >
      <div className="h-full bg-gray-800 text-gray-100 p-4 overflow-auto">
        <Card className="bg-gray-700 border-gray-600">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">🔧 Debug Manual Generator</h2>
          <p className="text-sm text-gray-300 mb-4">
            Template development and code debugging for individual files
          </p>

          {/* Selection Controls - FIXED ORDER: Template > File > Table > Project > Language */}
          {/* IMPORTANT: All fields are always visible, only disabled when not relevant! */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* 1. Template Dropdown - IMMER FIRST */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                📄 Template
              </label>
              <Dropdown
                value={selectedTemplate}
                options={templateOptions}
                onChange={(e) => setSelectedTemplate(e.value)}
                placeholder={t.debugmanualgeneratorpanel1277}
                className="w-full"
              />
            </div>

            {/* 2. File Dropdown - IMMER SECOND */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {t.debugmanualgeneratorpanel1284}
              </label>
              <Dropdown
                value={selectedFile}
                options={fileOptions}
                onChange={(e) => {
                  setSelectedFile(e.value);
                }}
                placeholder={t.debugmanualgeneratorpanel1293}
                className="w-full"
                disabled={!selectedTemplate}
              />
            </div>

            {/* 3. Table Dropdown ODER Schema-Version Dropdown (je nach Dateityp) */}
            <div>
              {shouldShowTableDropdown() ? (
                <>
                  {/* DB-Tabellen-Datei: Table-Dropdown anzeigen */}
                  <label className="block text-sm font-medium text-white mb-2">
                    {t.templatemanagementpanel118} <span className="text-xs text-green-400">{t.debugmanualgeneratorpanel1319}</span>
                  </label>
                  <Dropdown
                    value={selectedTable}
                    options={tableOptions}
                    onChange={(e) => {
                      // Prevent selecting locked tables
                      const selectedOption = tableOptions.find(opt => opt.value === e.value);
                      if (selectedOption?.is_schema_locked) {
                        return; // Don't allow selection
                      }
                      setSelectedTable(e.value);
                    }}
                    placeholder="Tabelle wählen"
                    className="w-full"
                    itemTemplate={(option) => (
                      <div className={`flex items-center justify-between w-full ${option.is_schema_locked ? 'opacity-60' : ''}`}>
                        <span className={option.is_schema_locked ? 'text-red-400' : ''}>
                          {option.label}
                        </span>
                        {option.is_schema_locked && (
                          <div className="flex items-center gap-2">
                            <i className="pi pi-lock text-red-500" title="Datenbank gesperrt" />
                            <span className="text-xs text-red-400">Gesperrt</span>
                          </div>
                        )}
                      </div>
                    )}
                    valueTemplate={(option) => option ? (
                      <div className="flex items-center">
                        {option.is_schema_locked && <i className="pi pi-lock text-red-500 mr-2" />}
                        <span className={option.is_schema_locked ? 'text-red-400' : ''}>
                          {option.label}
                        </span>
                      </div>
                    ) : 'Tabelle wählen'}
                  />
                </>
              ) : shouldShowProjectDropdown() ? (
                <>
                  {/* 🎯 NEU: Project-Datei: Schema-Version Dropdown anzeigen */}
                  <label className="block text-sm font-medium text-white mb-2">
                    📐 Schema Version {schemaVersionOptions.length > 0 ? <span className="text-xs text-green-400">(Ziel-Version)</span> : <span className="text-xs text-gray-500">(keine Versionen)</span>}
                  </label>
                  <Dropdown
                    value={selectedSchemaVersion}
                    options={schemaVersionOptions}
                    onChange={(e) => {
                      setSelectedSchemaVersion(e.value);
                      // Migration zurücksetzen, wenn neue Version ausgewählt
                      if (migrationFromVersion !== null && e.value !== null && migrationFromVersion >= e.value) {
                        setMigrationFromVersion(null);
                      }
                    }}
                    placeholder={schemaVersionOptions.length > 0 ? "Version wählen" : "Keine Versionen verfügbar"}
                    className="w-full"
                    disabled={schemaVersionOptions.length === 0}
                  />
                  {selectedSchemaVersion && (
                    <div className="mt-1 text-xs text-blue-400">
                      GTree wird mit Schema-Version {selectedSchemaVersion} generiert
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Weder Table noch Project: Deaktiviertes Dropdown */}
                  <label className="block text-sm font-medium text-white mb-2">
                    {t.templatemanagementpanel118} <span className="text-xs text-gray-500">{t.debugmanualgeneratorpanel1302}</span>
                  </label>
                  <Dropdown
                    value={null}
                    options={[]}
                    placeholder={t.debugmanualgeneratorpanel1310}
                    className="w-full"
                    disabled={true}
                  />
                </>
              )}
            </div>

            {/* 4. Project Dropdown - IMMER FOURTH (disabled wenn nicht project_file) */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {t.debugmanualgeneratorpanel1355} {shouldShowProjectDropdown() ? <span className="text-xs text-green-400">{t.debugmanualgeneratorpanel1334}</span> : <span className="text-xs text-gray-500">{t.debugmanualgeneratorpanel1302}</span>}
              </label>
              <Dropdown
                value={selectedProjectForGenerator}
                options={projectOptions}
                onChange={(e) => setSelectedProjectForGenerator(e.value)}
                placeholder={shouldShowProjectDropdown() ? "Projekt wählen" : t.debugmanualgeneratorpanel1310}
                className="w-full"
                disabled={!shouldShowProjectDropdown()}
              />
            </div>

            {/* 5. Language Dropdown - IMMER FIFTH (disabled wenn nicht language-enabled) */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {t.debugmanualgeneratorpanel1342} {shouldShowLanguageDropdown() ? <span className="text-xs text-green-400">{t.debugmanualgeneratorpanel1334}</span> : <span className="text-xs text-gray-500">{t.debugmanualgeneratorpanel1302}</span>}
              </label>
              <Dropdown
                value={selectedLanguage}
                options={languageOptions}
                onChange={(e) => {
                  setSelectedLanguage(e.value);
                }}
                placeholder={shouldShowLanguageDropdown() ? t.debugmanualgeneratorpanel1342 : t.debugmanualgeneratorpanel1310}
                className="w-full"
                disabled={!shouldShowLanguageDropdown()}
              />
            </div>

            {/* 6. Migration Version Dropdown - Optional: Migration von Version X */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                📊 Migration von Version {migrationVersionOptions.length > 0 ? <span className="text-xs text-blue-400">(Optional)</span> : <span className="text-xs text-gray-500">(nicht verfügbar)</span>}
              </label>
              <Dropdown
                value={migrationFromVersion}
                options={[
                  { label: 'Keine Migration', value: null },
                  ...migrationVersionOptions
                ]}
                onChange={(e) => setMigrationFromVersion(e.value)}
                placeholder="Keine Migration"
                className="w-full"
                disabled={migrationVersionOptions.length === 0}
              />
              {migrationFromVersion && (
                <div className="mt-1 text-xs text-blue-400">
                  Migration v{migrationFromVersion} → aktuell wird im GTree verfügbar sein
                </div>
              )}
            </div>

          </div>

          {/* Options */}
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="include-template-source"
                checked={includeTemplateSource}
                onChange={(e) => setIncludeTemplateSource(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="include-template-source" className="text-sm text-gray-300 cursor-pointer">
                {t.debugmanualgeneratorpanel1360}
              </label>
            </div>
          </div>

          {/* ⚠️ VALIDATION WARNING BANNERS */}

          {/* 🔴 SYNTAX ERRORS (Red - CRITICAL - highest priority) */}
          {syntaxErrors.length > 0 && (
            <div className="mt-4">
              <Panel
                header={
                  <div className="flex items-center gap-2">
                    <i className="pi pi-times-circle text-red-500"></i>
                    <span className="font-semibold text-red-300">
                      {t.debugmanualgeneratorpanel1325} ({syntaxErrors.length})
                    </span>
                  </div>
                }
                toggleable
                collapsed={false}
                className="bg-red-900 border-red-500"
                pt={{
                  header: { className: 'bg-red-800 border-red-500 text-red-200' },
                  content: { className: 'bg-red-900 border-red-500 text-red-100' },
                  togglerIcon: { className: 'text-red-300' }
                }}
              >
                <div className="space-y-2">
                  <p className="text-sm text-red-200">
                    <strong>CRITICAL:</strong> {t.debugmanualgeneratorpanel1397}
                  </p>

                  <div className="bg-red-950 p-3 rounded border border-red-600 max-h-64 overflow-auto">
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      {syntaxErrors.map((err, idx) => (
                        <li key={idx} className="text-red-200">
                          <span className="text-red-300 font-semibold">{err.file}</span>
                          <br />
                          <span className="text-red-100 ml-5">{err.error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-xs text-red-300 mt-2 italic">
                    {t.debugmanualgeneratorpanel1400}
                  </p>
                </div>
              </Panel>
            </div>
          )}

          {/* ⚠️ SYNTAX WARNINGS (Yellow - medium priority) */}
          {syntaxWarnings.length > 0 && (
            <div className="mt-4">
              <Panel
                header={
                  <div className="flex items-center gap-2">
                    <i className="pi pi-exclamation-triangle text-yellow-400"></i>
                    <span className="font-semibold text-yellow-300">
                      ⚠️ Template Syntax Warnings ({syntaxWarnings.length})
                    </span>
                  </div>
                }
                toggleable
                collapsed={true}
                className="bg-yellow-900 border-yellow-600"
                pt={{
                  header: { className: 'bg-yellow-800 border-yellow-600 text-yellow-200' },
                  content: { className: 'bg-yellow-900 border-yellow-600 text-yellow-100' },
                  togglerIcon: { className: 'text-yellow-300' }
                }}
              >
                <div className="space-y-2">
                  <p className="text-sm text-yellow-200">
                    {t.debugmanualgeneratorpanel1755}
                  </p>

                  <div className="bg-yellow-950 p-3 rounded border border-yellow-700 max-h-48 overflow-auto">
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      {syntaxWarnings.map((warn, idx) => (
                        <li key={idx} className="text-yellow-200">
                          <span className="text-yellow-300 font-semibold">{warn.file}</span>
                          <br />
                          <span className="text-yellow-100 ml-5">{warn.warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Panel>
            </div>
          )}

          {/* 1️⃣ UNKNOWN VARIABLES (Orange - variable warnings) */}
          {unknownVariables.length > 0 && (
            <div className="mt-4">
              <Panel
                header={
                  <div className="flex items-center gap-2">
                    <i className="pi pi-exclamation-triangle text-orange-400"></i>
                    <span className="font-semibold text-orange-300">
                      Unknown Variables ({unknownVariables.length})
                    </span>
                  </div>
                }
                toggleable
                collapsed={true}
                className="bg-orange-900 border-orange-600"
                pt={{
                  header: { className: 'bg-orange-800 border-orange-600 text-orange-200' },
                  content: { className: 'bg-orange-900 border-orange-600 text-orange-100' },
                  togglerIcon: { className: 'text-orange-300' }
                }}
              >
                <div className="space-y-2">
                  <p className="text-sm text-orange-200">
                    The following variables are <strong>not defined</strong> and will output <strong>"undefined"</strong>:
                  </p>

                  <div className="bg-orange-950 p-3 rounded border border-orange-700 max-h-48 overflow-auto">
                    <ul className="list-disc list-inside space-y-1 text-sm font-mono">
                      {unknownVariables.map((warning, idx) => (
                        <li key={idx} className="text-orange-200">
                          <span className="text-orange-300 font-semibold">{warning.file}</span>
                          <span className="text-orange-400">, line {warning.line}</span>
                          : <span className="text-yellow-300">{`{${warning.variable}}`}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-xs text-orange-300 mt-2 italic">
                    💡 Tip: Define custom template variables or use existing project fields.
                  </p>
                </div>
              </Panel>
            </div>
          )}

          {/* 2️⃣ REQUIRED BUT MISSING (Red - error level) */}
          {requiredMissing.length > 0 && (
            <div className="mt-4">
              <Panel
                header={
                  <div className="flex items-center gap-2">
                    <i className="pi pi-times-circle text-red-400"></i>
                    <span className="font-semibold text-red-300">
                      Required Variables Missing ({requiredMissing.length})
                    </span>
                  </div>
                }
                toggleable
                collapsed={true}
                className="bg-red-900 border-red-600"
                pt={{
                  header: { className: 'bg-red-800 border-red-600 text-red-200' },
                  content: { className: 'bg-red-900 border-red-600 text-red-100' },
                  togglerIcon: { className: 'text-red-300' }
                }}
              >
                <div className="space-y-2">
                  <p className="text-sm text-red-200">
                    These variables are <strong>required</strong> but not filled in the project. Output: <strong>"undefined"</strong>
                  </p>

                  <div className="bg-red-950 p-3 rounded border border-red-700 max-h-48 overflow-auto">
                    <ul className="list-disc list-inside space-y-1 text-sm font-mono">
                      {requiredMissing.map((warning, idx) => (
                        <li key={idx} className="text-red-200">
                          <span className="text-red-300 font-semibold">{warning.file}</span>
                          <span className="text-red-400">, line {warning.line}</span>
                          : <span className="text-yellow-300">{`{${warning.variable}}`}</span>
                          {warning.description && (
                            <span className="text-red-300 ml-2">- {warning.description}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-xs text-red-300 mt-2 italic">
                    ⚠️ Please fill these required variables in the project settings.
                  </p>
                </div>
              </Panel>
            </div>
          )}

          {/* 3️⃣ OPTIONAL BUT MISSING (Blue - info level) */}
          {optionalMissing.length > 0 && (
            <div className="mt-4">
              <Panel
                header={
                  <div className="flex items-center gap-2">
                    <i className="pi pi-info-circle text-blue-400"></i>
                    <span className="font-semibold text-blue-300">
                      Optional Variables ({optionalMissing.length})
                    </span>
                  </div>
                }
                toggleable
                collapsed={true}
                className="bg-blue-900 border-blue-600"
                pt={{
                  header: { className: 'bg-blue-800 border-blue-600 text-blue-200' },
                  content: { className: 'bg-blue-900 border-blue-600 text-blue-100' },
                  togglerIcon: { className: 'text-blue-300' }
                }}
              >
                <div className="space-y-2">
                  <p className="text-sm text-blue-200">
                    These optional variables are not filled. Default value or <strong>empty string ""</strong> will be used.
                  </p>

                  <div className="bg-blue-950 p-3 rounded border border-blue-700 max-h-48 overflow-auto">
                    <ul className="list-disc list-inside space-y-1 text-sm font-mono">
                      {optionalMissing.map((warning, idx) => (
                        <li key={idx} className="text-blue-200">
                          <span className="text-blue-300 font-semibold">{warning.file}</span>
                          <span className="text-blue-400">, line {warning.line}</span>
                          : <span className="text-yellow-300">{`{${warning.variable}}`}</span>
                          {warning.default_value && (
                            <span className="text-green-300 ml-2">→ default: "{warning.default_value}"</span>
                          )}
                          {!warning.default_value && (
                            <span className="text-gray-400 ml-2">→ ""</span>
                          )}
                          {warning.description && (
                            <div className="text-blue-300 ml-6 text-xs">└ {warning.description}</div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-xs text-blue-300 mt-2 italic">
                    ℹ️ Optional variables - you can fill them if needed.
                  </p>
                </div>
              </Panel>
            </div>
          )}

          {/* Project Locked Warning */}
          {isProjectLocked() && (
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 text-red-400">
                <i className="pi pi-lock text-lg"></i>
                <div>
                  <span className="font-semibold">Projekt gesperrt</span>
                  <span className="text-sm text-red-300 ml-2">
                    - Abo in der Projektverwaltung erneuern
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Schema Locked Warning */}
          {isSchemaLocked() && !isProjectLocked() && (
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 text-red-400">
                <i className="pi pi-lock text-lg"></i>
                <div>
                  <span className="font-semibold">Datenbank gesperrt</span>
                  <span className="text-sm text-red-300 ml-2">
                    - Im Database Manager entsperren
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex space-x-2">
            <Button
              label={loading ? "Retrieving code..." : t.debugmanualgeneratorpanel1369}
              icon={loading ? "pi pi-spinner pi-spin" : ((isProjectLocked() || isSchemaLocked()) ? "pi pi-lock" : "pi pi-code")}
              onClick={fetchCode}
              disabled={!isButtonEnabled || isProjectLocked() || isSchemaLocked()}
              className={(isProjectLocked() || isSchemaLocked()) ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
              tooltip={isProjectLocked() ? "Projekt gesperrt - Abo erneuern" : (isSchemaLocked() ? "Datenbank gesperrt - Im Database Manager entsperren" : undefined)}
            />

            <Button
              label={t.debugmanualgeneratorpanel1377}
              icon={(isProjectLocked() || isSchemaLocked()) ? "pi pi-lock" : "pi pi-play"}
              onClick={executeCode}
              disabled={!preparedCode || isProjectLocked() || isSchemaLocked()}
              className={(isProjectLocked() || isSchemaLocked()) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
              tooltip={isProjectLocked() ? "Projekt gesperrt - Abo erneuern" : (isSchemaLocked() ? "Datenbank gesperrt - Im Database Manager entsperren" : undefined)}
            />

            <Button
              label={t.debugmanualgeneratorpanel1385}
              icon="pi pi-search"
              onClick={() => {
                try {
                  let debugOutput = '';

                  debugOutput += `🔠🔠🔠 Scoriet Template Debug Analysis 🔠🔠🔠\n`;
                  debugOutput += `⏰ Analysis started at: ${new Date().toLocaleTimeString()}\n\n`;

                  debugOutput += `⚙️ CONFIGURATION ANALYSIS\n`;
                  debugOutput += `==============================\n`;
                  debugOutput += `Template: ${selectedTemplate || t.debugmanualgeneratorpanel1396}\n`;
                  debugOutput += `File: ${getSelectedFileName() || t.debugmanualgeneratorpanel1396}\n`;
                  debugOutput += `Type: ${getFileGenerationType() || t.testprojectschemas50}\n`;
                  debugOutput += `Project: ${selectedProjectForGenerator || t.debugmanualgeneratorpanel1396}\n`;
                  debugOutput += `Table: ${selectedTable !== null ? selectedTable : t.debugmanualgeneratorpanel1396}\n`;
                  debugOutput += `Available Tables: ${tableOptions.length}\n\n`;

                  if (preparedCode) {
                    const codeLines = preparedCode.split('\n');
                    debugOutput += `📄 GENERATED JAVASCRIPT ANALYSIS\n`;
                    debugOutput += `====================================\n`;
                    debugOutput += `Total Lines: ${codeLines.length}\n`;
                    debugOutput += `Code Size: ${(preparedCode.length / 1024).toFixed(2)} KB\n\n`;

                    // JavaScript Syntax Analysis (ESLint4B-style)
                    debugOutput += `🔍 JAVASCRIPT SYNTAX ANALYSIS\n`;
                    debugOutput += `==============================\n`;

                    const syntaxIssues: string[] = [];
                    codeLines.forEach((line, index) => {
                      const lineNum = index + 1;
                      const trimmed = line.trim();

                      if (trimmed) {
                        // Check for common syntax issues
                        if (trimmed.includes('tables[]')) {
                          syntaxIssues.push(`Line ${lineNum}: ❌ Empty array access 'tables[]' - missing index`);
                        }

                        if (trimmed.includes("'") && !trimmed.includes("\\\\'")) {
                          const singleQuotes = (trimmed.match(/'/g) || []).length;
                          if (singleQuotes % 2 !== 0) {
                            syntaxIssues.push(`Line ${lineNum}: ⚠️  Unmatched single quote - may cause string termination issues`);
                          }
                        }

                        if (trimmed.includes('undefined')) {
                          syntaxIssues.push(`Line ${lineNum}: 🟡 Contains 'undefined' - check variable initialization`);
                        }

                        if (trimmed.includes('gtree[0].project[0].tables[') && !trimmed.includes('gtree[0].project[0].tables[0]') && !trimmed.includes('gtree[0].project[0].tables[i]')) {
                          syntaxIssues.push(`Line ${lineNum}: 🔴 Dynamic table index may be problematic`);
                        }

                        if (trimmed.includes('sContentResult +=') && trimmed.includes('\\n') && !trimmed.includes('\\\\u000A')) {
                          syntaxIssues.push(`Line ${lineNum}: ⚠️  Raw \\n in string - should use \\\\u000A for consistency`);
                        }

                        // Check for bracket balance in the line
                        const openBrackets = (trimmed.match(/\{/g) || []).length;
                        const closeBrackets = (trimmed.match(/\}/g) || []).length;
                        const openParens = (trimmed.match(/\(/g) || []).length;
                        const closeParens = (trimmed.match(/\)/g) || []).length;

                        if (openBrackets !== closeBrackets && !trimmed.endsWith('{') && !trimmed.startsWith('}')) {
                          syntaxIssues.push(`Line ${lineNum}: 🔴 Unbalanced curly braces { } in line`);
                        }

                        if (openParens !== closeParens && !trimmed.includes('for (')) {
                          syntaxIssues.push(`Line ${lineNum}: 🔴 Unbalanced parentheses ( ) in line`);
                        }
                      }
                    });

                    if (syntaxIssues.length === 0) {
                      debugOutput += `✅ No syntax issues detected\n`;
                    } else {
                      debugOutput += `Found ${syntaxIssues.length} potential syntax issues:\n\n`;
                      syntaxIssues.forEach(issue => {
                        debugOutput += `${issue}\n`;
                      });
                    }
                    debugOutput += `\n`;
                  }

                  const issues = [];
                  if (!selectedProjectForGenerator && shouldShowProjectDropdown()) {
                    issues.push(t.debugmanualgeneratorpanel1473);
                  }
                  if ((selectedTable === null || selectedTable === undefined) && shouldShowTableDropdown()) {
                    issues.push(t.debugmanualgeneratorpanel1476);
                  }
                  if (!selectedLanguage && shouldShowLanguageDropdown()) {
                    issues.push(t.debugmanualgeneratorpanel1479);
                  }
                  if (preparedCode && preparedCode.includes('tables[]')) {
                    issues.push(t.debugmanualgeneratorpanel1482);
                  }

                  debugOutput += `⚠️ POTENTIAL ISSUES ANALYSIS\n`;
                  debugOutput += `==============================\n`;
                  if (issues.length === 0) {
                    debugOutput += `✅ No issues detected\n`;
                  } else {
                    issues.forEach(issue => debugOutput += `${issue}\n`);
                  }

                  debugOutput += `\n=== Debug Analysis Complete ===`;

                  setDebugInfo(debugOutput);
                  setActiveTabIndex(2); // Switch to debug tab

                } catch (debugError) {
                  setDebugInfo(`❌ Error in Debug Helper:${(debugError as Error).message}\n\nDetails: ${debugError}`);
                  setActiveTabIndex(2);
                }
              }}
              disabled={!preparedCode}
              className="bg-blue-600 hover:bg-blue-700"
            />

            <Button
              label={editorUnlocked ? "Lock Editor" : "Unlock Editor"}
              icon={editorUnlocked ? "pi pi-lock" : "pi pi-unlock"}
              onClick={handleUnlockEditor}
              className={editorUnlocked ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"}
              tooltip={editorUnlocked ? "Lock and reset editor" : "Enable editor for manual tests"}
              tooltipOptions={{ position: 'top' }}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-900 border-b border-red-600 text-red-200">
              <div className="flex items-center">
                <span className="mr-2">⚠️</span>
                <span>{error}</span>
                <button
                  onClick={() => setError('')}
                  className="ml-auto text-red-400 hover:text-red-200"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* 3-Tab System */}
          {preparedCode && (
            <div className="bg-gray-700">
              <TabView
                activeIndex={activeTabIndex}
                onTabChange={(e: any) => setActiveTabIndex(e.index)}
                className="bg-gray-700"
              >
              <TabPanel header={t.debugmanualgeneratorpanel1531} className="text-gray-100">
                <div className="bg-gray-900 p-4 rounded border border-gray-600">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Editable JavaScript code</span>
                    <div className="flex gap-2">
                      <Button
                        label={t.debugmanualgeneratorpanel1537}
                        icon="pi pi-database"
                        size="small"
                        onClick={() => {
                          const gtreeData = localStorage.getItem('scoriet_gtree');
                          if (gtreeData) {
                            const jsonData = JSON.stringify(JSON.parse(gtreeData), null, 2);
                            const formattedGTree = `const gtree = ${jsonData};`;

                            // Try modern clipboard API first
                            if (navigator.clipboard && window.isSecureContext) {
                              navigator.clipboard.writeText(formattedGTree).then(() => {
                                // Successfully copied
                              }).catch(() => {
                                // Fallback to legacy method
                                copyToClipboardFallback(formattedGTree, t);
                              });
                            } else {
                              // Fallback for older browsers or non-secure contexts
                              copyToClipboardFallback(formattedGTree, t);
                            }
                          }
                        }}
                        disabled={!localStorage.getItem('scoriet_gtree')}
                        className="p-button-outlined p-button-sm p-button-secondary"
                      />
                      <Button
                        label={t.debugmanualgeneratorpanel1564}
                        icon="pi pi-download"
                        size="small"
                        onClick={() => {
                          const gtreeData = localStorage.getItem('scoriet_gtree');
                          if (gtreeData) {
                            try {
                              const jsonData = JSON.stringify(JSON.parse(gtreeData), null, 2);
                              const formattedGTree = `const gtree = ${jsonData};`;
                              const blob = new Blob([formattedGTree], { type: 'application/javascript' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `gtree-${selectedProject?.name || 'export'}-${new Date().toISOString().split('T')[0]}.js`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            } catch {
                              alert(t.debugmanualgeneratorpanel1583);
                            }
                          }
                        }}
                        disabled={!localStorage.getItem('scoriet_gtree')}
                        className="p-button-outlined p-button-sm p-button-success"
                      />
                      <Button
                        label="Import GTree"
                        icon="pi pi-upload"
                        size="small"
                        onClick={() => {
                          // Create hidden file input
                          const fileInput = document.createElement('input');
                          fileInput.type = 'file';
                          fileInput.accept = '.js,.json';
                          fileInput.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                try {
                                  let content = event.target?.result as string;

                                  // Remove "const gtree = " if present
                                  if (content.includes('const gtree =')) {
                                    content = content.replace(/const\s+gtree\s*=\s*/, '').replace(/;?\s*$/, '');
                                  }

                                  // Parse JSON to validate
                                  const gtreeData = JSON.parse(content);

                                  // Validate basic structure
                                  if (!Array.isArray(gtreeData) || gtreeData.length === 0) {
                                    alert('❌ Invalid GTree format: Must be an array');
                                    return;
                                  }

                                  if (!gtreeData[0]?.project || !Array.isArray(gtreeData[0].project)) {
                                    alert('❌ Invalid GTree format: project array missing');
                                    return;
                                  }

                                  // Save to localStorage
                                  localStorage.setItem('scoriet_gtree', JSON.stringify(gtreeData));

                                  alert(`✅ GTree successfully imported!\n\n📊 Projekt: ${gtreeData[0].project[0]?.projectname || 'Unbekannt'}\n📁 Tabellen: ${gtreeData[0].project[0]?.tables?.length || 0}`);

                                } catch (error) {
                                  alert(`❌ Import error:\n\n${(error as Error).message}\n\nMake sure the file contains a valid GTree JSON.`);
                                }
                              };
                              reader.readAsText(file);
                            }
                          };
                          fileInput.click();
                        }}
                        className="p-button-outlined p-button-sm p-button-warning"
                        tooltip="GTree JSON oder JS Datei hochladen und in localStorage speichern"
                        tooltipOptions={{ position: 'top' }}
                      />
                      <Button
                        label="GTree aus Clipboard"
                        icon="pi pi-paste"
                        size="small"
                        onClick={() => setShowGTreeImportModal(true)}
                        className="p-button-outlined p-button-sm p-button-info"
                        tooltip="GTree JSON aus Zwischenablage einfügen (STRG+V)"
                        tooltipOptions={{ position: 'top' }}
                      />
                      <Button
                        label={t.debugmanualgeneratorpanel1591}
                        icon="pi pi-copy"
                        size="small"
                        onClick={() => {
                          const codeText = preparedCode || '';

                          // Try modern clipboard API first
                          if (navigator.clipboard && window.isSecureContext) {
                            navigator.clipboard.writeText(codeText).then(() => {
                              // Successfully copied
                            }).catch(() => {
                              copyToClipboardFallback(codeText, t);
                            });
                          } else {
                            copyToClipboardFallback(codeText, t);
                          }
                        }}
                        disabled={!preparedCode}
                        className="p-button-outlined p-button-sm"
                      />
                    </div>
                  </div>

                  {/* Code Editor with Line Numbers and Syntax Highlighting */}
                  <div className="w-full bg-gray-900 border border-gray-600 rounded code-editor-container" style={{height: '400px', overflow: 'auto'}}>
                    <ErrorBoundary
                      fallback={
                        <div className="h-full flex items-center justify-center bg-gray-800 text-gray-300">
                          <div className="text-center">
                            <div className="text-4xl mb-2">⚠️</div>
                            <p>Code Editor could not be loaded</p>
                            <p className="text-sm text-gray-400">Use a simple textarea as a fallback.</p>
                          </div>
                        </div>
                      }
                    >
                      <LineNumbersCodeDisplay
                        code={preparedCode || `Klicken Sie auf "${t.debugmanualgeneratorpanel1369}" um den Code zu sehen...`}
                        readOnly={!editorUnlocked}
                        onChange={(newCode) => setPreparedCode(newCode)}
                      />
                    </ErrorBoundary>
                  </div>

                  {/* Custom Syntax Highlighting Styles */}
                  <style>{`
                    .code-editor-container {
                      scrollbar-width: auto;
                      scrollbar-color: #555 #2d2d2d;
                    }
                    .code-editor-container::-webkit-scrollbar {
                      width: 20px;
                      height: 20px;
                      -webkit-appearance: none;
                    }
                    .code-editor-container::-webkit-scrollbar-track {
                      background: #2d2d2d;
                      border-radius: 4px;
                    }
                    .code-editor-container::-webkit-scrollbar-thumb {
                      background: #555;
                      border-radius: 6px;
                      border: 3px solid #2d2d2d;
                      min-height: 30px;
                    }
                    .code-editor-container::-webkit-scrollbar-thumb:hover {
                      background: #777;
                    }
                    .code-editor-container::-webkit-scrollbar-corner {
                      background: #2d2d2d;
                    }
                    .code-editor {
                      caret-color: #d4d4d4;
                      background-color: #1a1a1a !important;
                    }
                    .code-editor textarea {
                      color: #d4d4d4 !important;
                      background: transparent !important;
                      resize: none;
                      white-space: pre !important;
                      overflow-wrap: normal !important;
                      word-break: normal !important;
                      overflow-x: auto !important;
                    }
                    .code-editor pre {
                      background: transparent !important;
                      margin: 0;
                      white-space: pre !important;
                      overflow-wrap: normal !important;
                      word-break: normal !important;
                    }
                  `}</style>
                </div>
              </TabPanel>

              <TabPanel header={t.debugmanualgeneratorpanel1679} className="text-gray-100">
                <div className="bg-gray-900 rounded border border-gray-600">
                  {/* Button Bar */}
                  <div className="flex justify-between items-center p-2 border-b border-gray-600 bg-gray-800">
                    <div className="text-sm text-gray-400">Generated PHP code</div>
                    <div className="flex gap-2">
                      <Button
                        label={t.debugmanualgeneratorpanel1591}
                        icon="pi pi-copy"
                        size="small"
                        onClick={() => {
                          const codeText = executedResult || '';

                          // Try modern clipboard API first
                          if (navigator.clipboard && window.isSecureContext) {
                            navigator.clipboard.writeText(codeText).then(() => {
                              // Successfully copied
                            }).catch(() => {
                              copyToClipboardFallback(codeText, t);
                            });
                          } else {
                            copyToClipboardFallback(codeText, t);
                          }
                        }}
                        disabled={!executedResult}
                        className="p-button-outlined p-button-sm"
                      />
                      <Button
                        label="Code downloaden"
                        icon="pi pi-download"
                        size="small"
                        onClick={() => {
                          if (executedResult) {
                            try {
                              // Use the processed filename from backend (with %1-%9 replaced)
                              const blob = new Blob([executedResult], { type: t.codegenerationpanel300 });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = downloadFilename;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            } catch {
                              alert(t.debugmanualgeneratorpanel1724);
                            }
                          }
                        }}
                        disabled={!executedResult}
                        className="p-button-outlined p-button-sm p-button-success"
                      />
                    </div>
                  </div>

                  {/* Code Display */}
                  <div className="p-4 max-h-96 overflow-auto">
                    <div
                      className="text-sm whitespace-pre-wrap font-mono"
                      style={{
                        fontFamily: '"Courier New", "Consolas", "Monaco", "Lucida Console", monospace',
                        color: '#d4d4d4',
                        lineHeight: 1.4
                      }}
                    >
                      {executedResult || `Click on "${t.debugmanualgeneratorpanel1377}" to see the result...`}
                    </div>
                  </div>
                </div>
              </TabPanel>

              <TabPanel header={t.debugmanualgeneratorpanel1750} className="text-gray-100">
                <div className="bg-gray-900 p-4 rounded border border-gray-600 max-h-96 overflow-auto">
                  <div
                    className="text-sm whitespace-pre-wrap font-mono"
                    style={{
                      fontFamily: '"Courier New", "Consolas", "Monaco", "Lucida Console", monospace',
                      color: '#d4d4d4',
                      lineHeight: 1.4
                    }}
                  >
                    {debugInfo || `Click on "${t.debugmanualgeneratorpanel1385}" to see the result...`}
                  </div>
                </div>
              </TabPanel>
              </TabView>
            </div>
          )}
          </div>
        </Card>
      </div>

      {/* GTree Import Modal */}
      <Dialog
        header="GTree aus Clipboard importieren"
        visible={showGTreeImportModal}
        style={{ width: '50vw' }}
        onHide={() => {
          setShowGTreeImportModal(false);
          setGtreeImportText('');
        }}
        footer={
          <div>
            <Button
              label="Abbrechen"
              icon="pi pi-times"
              onClick={() => {
                setShowGTreeImportModal(false);
                setGtreeImportText('');
              }}
              className="p-button-text"
            />
            <Button
              label="Importieren"
              icon="pi pi-check"
              onClick={handleGTreeImportFromText}
              disabled={!gtreeImportText.trim()}
            />
          </div>
        }
      >
        <div className="mb-3">
          <p className="text-gray-300 mb-2">
            Fügen Sie das GTree JSON hier ein (STRG+V):
          </p>
          <InputTextarea
            value={gtreeImportText}
            onChange={(e) => setGtreeImportText(e.target.value)}
            rows={20}
            className="w-full font-mono text-sm"
            placeholder={`Beispiel:\n[\n  {\n    "project": [\n      {\n        "projectname": "MyProject",\n        "tables": [...]\n      }\n    ]\n  }\n]`}
            autoFocus
          />
          <p className="text-xs text-gray-400 mt-2">
            💡 Tip: You can leave "const gtree = " at the beginning - it will be removed automatically.
          </p>
        </div>
      </Dialog>
    </ErrorBoundary>
  );
}