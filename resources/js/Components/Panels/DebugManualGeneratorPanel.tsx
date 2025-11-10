import React, { useState, useEffect, useCallback } from 'react';
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
const copyToClipboardFallback = (text: string) => {
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
      alert('Clipboard-API nicht verfügbar. Bitte manuell kopieren:\n\n' + text.substring(0, 500) + '...');
    }
  } catch {
    alert('Fehler beim Kopieren in die Zwischenablage');
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

      // WICHTIG: Wenn preSelectedTemplateId vorhanden (vom TreeView), lade ALLE Templates (ohne Filter)
      // Sonst: Lade nur Templates für das aktuelle Projekt
      let url = '/api/templates';
      if (!preSelectedTemplateId && preSelectedProjectId) {
        // Nur filtern wenn KEIN preSelected Template (normales Öffnen des Panels)
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

        setTemplates(templatesArray);

        if (templatesArray.length === 0) {
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

        // Auto-select first valid file - NUR wenn KEIN preSelectedFileName vorhanden!
        // WICHTIG: preSelectedFileName wird aus dem Closure gelesen, NICHT aus dependencies!
        if (validFiles.length > 0 && !preSelectedFileName) {
          setSelectedFile(validFiles[0].id);
        } else if (validFiles.length === 0) {
          setSelectedFile(null);
          setError(`Keine gültigen Template-Dateien für Template ${templateId} gefunden`);
        }
        // Wenn preSelectedFileName vorhanden: NICHT auto-select, warte auf useEffect Pre-Selection!
      } else {
        setError(`Fehler beim Laden der Template-Dateien: ${response.status}`);
      }
    } catch {
      setError(t.debugmanualgeneratorpanel420);
    }
  }, [preSelectedFileName]); // WICHTIG: preSelectedFileName für auto-select Logik

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

        // WICHTIG: Wenn preSelectedLanguageCode vorhanden (vom TreeView), lade ALLE Sprachen (ohne Filter)
        // Sonst: Lade nur Sprachen für das aktuelle Projekt
        if (!preSelectedLanguageCode && selectedProject?.enabled_languages && Array.isArray(selectedProject.enabled_languages)) {
          // Nur filtern wenn KEINE preSelected Language (normales Öffnen des Panels)
          languages = languages.filter((lang: any) =>
            selectedProject.enabled_languages?.includes(lang.code)
          );
        }

        const languageOpts = languages.map((lang: any) => ({
          label: `${lang.flag} ${lang.name}`,
          value: lang.code
        }));

        setLanguageOptions(languageOpts);

        // Auto-select first language - NUR wenn KEIN preSelectedLanguageCode vorhanden!
        // WICHTIG: preSelectedLanguageCode wird aus dem Closure gelesen, NICHT aus dependencies!
        if (languageOpts.length > 0 && !selectedLanguage && !preSelectedLanguageCode) {
          setSelectedLanguage(languageOpts[0].value);
        }
        // Wenn preSelectedLanguageCode vorhanden: NICHT auto-select, warte auf useEffect Pre-Selection!
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
            setError(`Backend-Template zu umfangreich (${originalSizeKB}KB von max. ${maxOriginalSizeKB}KB). Template enthält zu viele Tabellen oder komplexe Strukturen.`);
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
          let errorMsg = '❌ Datei für ausgewählte Konfiguration nicht gefunden\\n\\n';
          errorMsg += `🔍 Gesuchte Konfiguration:\\n`;
          errorMsg += `  Template: ${selectedTemplate}\\n`;
          errorMsg += `  Datei: ${getSelectedFileName()}\\n`;
          errorMsg += `  Typ: ${fileGenerationType}\\n`;

          if (fileGenerationType === 'db_table_file' || fileGenerationType === 'db_table_file_languages') {
            const selectedTableData = schemaTables[selectedTable!];
            errorMsg += `  Tabelle: ${selectedTableData?.tablename || t.testprojectschemas50}\\n`;
          }

          if (fileGenerationType === 'project_file_languages' || fileGenerationType === 'db_table_file_languages') {
            errorMsg += `  Sprache: ${selectedLanguage || t.testprojectschemas50}\\n`;
          }

          errorMsg += `\\n📋 Verfügbare Dateien (${data.processed_files?.length || 0}):\\n`;
          if (data.processed_files?.length > 0) {
            data.processed_files.slice(0, 5).forEach((file: any, idx: number) => {
              errorMsg += `  ${idx + 1}. ${file.filename || file.generated_from_template || t.testprojectschemas50} ${file.table_name ? `(${file.table_name})` : ''}\\n`;
            });
            if (data.processed_files.length > 5) {
              errorMsg += `  ... und ${data.processed_files.length - 5} weitere\\n`;
            }
          }

          errorMsg += '\\n💡 Lösung: Prüfen Sie Template-Konfiguration und Backend-Response.';

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

  const executeCode = () => {
    if (!preparedCode) {
      setError(t.debugmanualgeneratorpanel970);
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
        setError(`⚠️ Speicher-Warnung: ${memoryUsagePercent}% Speicher belegt. Template könnte zu komplex für sicheren Betrieb sein.`);
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
            throw new Error(`Function ${functionName} not found in global scope`);
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
        result += `\n\n⚠️ WARNUNG: Template-Ausführung dauerte ${executionTime}ms (>5s). Erwägen Sie Template-Vereinfachung.`;
      }

      // Performance stats
      result += `\n\n📊 Performance: ${executionTime}ms, Speicher: ${memoryUsed}KB`;

      // Set the final result
      setExecutedResult(result);
      setActiveTabIndex(1); // Switch to result tab
    } catch (execError) {
      // Set error result when execution fails
      setExecutedResult(`❌ Ausführung fehlgeschlagen!\n\nBitte kontrollieren Sie den t.debugmanualgeneratorpanel1048 Tab für Details.\n\nFehler: ${(execError as Error).message || t.schematranslationpanel319}`);
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
        errorMessage = `❌ JavaScript-Syntax-Fehler im Template${lineNumber}:\n\n🔍 Problem: ${error.message}\n\n💡 Häufige Ursachen:\n• Fehlende oder extra Anführungszeichen\n• Unvollständige Variablen wie {item.\n• Falsche Klammern in Schleifen\n• Sonderzeichen die escapt werden müssen\n\n🛠️ Lösung: Prüfen Sie Template-Syntax und {variablename} Platzhalter.`;

      } else if (error.name === t.debugmanualgeneratorpanel1096) {
        // Extract variable name if possible
        const variableMatch = error.message.match(/(\w+) is not defined/);
        const variable = variableMatch ? variableMatch[1] : 'unknown';

        errorMessage = `❌ Template-Variable nicht gefunden${lineNumber}:\n\n🔍 Problem: Variable "${variable}" ist nicht definiert\n📄 Details: ${error.message}\n\n💡 Mögliche Ursachen:\n• gtree wurde nicht geladen\n• Tabelle/Projekt nicht ausgewählt\n• Variable existiert nicht in der Datenstruktur\n• Tippfehler in Variablenname\n\n🛠️ Lösung: Prüfen Sie die {${variable}} Variable oder wählen Sie Tabelle/Projekt aus.`;

      } else if (error.name === 'TypeError') {
        errorMessage = `❌ Typ-Fehler im Template${lineNumber}:\n\n🔍 Problem: ${error.message}\n\n💡 Häufige Ursachen:\n• Zugriff auf undefined/null Werte\n• Falsche Array-Zugriffe wie tables[]\n• Fehlende lang-Arrays in gtree\n• Falsche selectedlanguageindex\n\n🛠️ Lösung: Prüfen Sie Datenstrukturen und Array-Zugriffe.`;

      } else {
        errorMessage = `❌ Template-Ausführungsfehler${lineNumber}:\n\n🔍 Problem: ${error.message || t.schematranslationpanel319}\n📝 Typ: ${error.name || t.testprojectschemas50}\n\n💡 Debug-Tipps:\n• Öffnen Sie Browser Console (F12) für Details\n• Prüfen Sie das generierte JavaScript\n• Vereinfachen Sie das Template zum Testen\n\n🛠️ Bei wiederholten Problemen: Template-Syntax vereinfachen.`;
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
          result = 'Fehler: Konnte JavaScript-Funktion nicht parsen\n\n' + preparedCode;
        }

          // Set the fallback result with a note about fallback
          setExecutedResult(`⚠️ Fallback-Interpretation aktiviert (SyntaxError):\n\n${result}\n\n🔧 Original Fehler:\n${errorMessage}`);
          setActiveTabIndex(1); // Switch to result tab
        } catch (fallbackErr) {
          // Use the enhanced error message from the main catch block
          const fallbackError = fallbackErr as Error;
          setExecutedResult(`${errorMessage}\n\n🔧 Fallback-Interpretation ebenfalls fehlgeschlagen:\n${fallbackError.message || t.debugmanualgeneratorpanel1183}\n\nOriginal Code (erste 500 Zeichen):\n${preparedCode.substring(0, 500)}...`);
        }
      } else {
        // For non-SyntaxErrors (ReferenceError, TypeError, etc.), show error immediately without fallback
        setExecutedResult(`${errorMessage}\n\n🔍 Debug-Tipp: Verwenden Sie den Debug Helper Tab für detaillierte Analyse.`);
        setActiveTabIndex(1); // Switch to result tab
      }
    }
  };

  // Handle GTree Import from Text
  const handleGTreeImportFromText = () => {
    try {
      let content = gtreeImportText.trim();

      if (!content) {
        alert('❌ Bitte fügen Sie GTree JSON ein');
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
        alert('❌ Ungültiges GTree Format: Muss ein Array sein');
        return;
      }

      if (!gtreeData[0]?.project || !Array.isArray(gtreeData[0].project)) {
        alert('❌ Ungültiges GTree Format: project array fehlt');
        return;
      }

      // Save to localStorage
      localStorage.setItem('scoriet_gtree', JSON.stringify(gtreeData));

      alert(`✅ GTree erfolgreich importiert!\n\n📊 Projekt: ${gtreeData[0].project[0]?.projectname || 'Unbekannt'}\n📁 Tabellen: ${gtreeData[0].project[0]?.tables?.length || 0}`);

      // Close modal and clear text
      setShowGTreeImportModal(false);
      setGtreeImportText('');

    } catch (error) {
      alert(`❌ Fehler beim Importieren:\n\n${(error as Error).message}\n\nStellen Sie sicher, dass der Text ein gültiges GTree JSON enthält.`);
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
      database: table.database_name || t.testprojectschemas50
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
          {/* WICHTIG: Alle Felder immer sichtbar, nur disabled wenn nicht relevant! */}
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
                placeholder="Template wählen"
                className="w-full"
              />
            </div>

            {/* 2. File Dropdown - IMMER SECOND */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                📝 Template Datei
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

            {/* 3. Table Dropdown - IMMER THIRD (disabled wenn nicht db_table_file) */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                📊 DB Tabelle {shouldShowTableDropdown() ? <span className="text-xs text-green-400">(benötigt)</span> : <span className="text-xs text-gray-500">(nicht benötigt)</span>}
              </label>
              <Dropdown
                value={selectedTable}
                options={tableOptions}
                onChange={(e) => {
                  setSelectedTable(e.value);
                }}
                placeholder={shouldShowTableDropdown() ? "Tabelle wählen" : t.debugmanualgeneratorpanel1310}
                className="w-full"
                disabled={!shouldShowTableDropdown()}
              />
            </div>

            {/* 4. Project Dropdown - IMMER FOURTH (disabled wenn nicht project_file) */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                🏗️ Projekt {shouldShowProjectDropdown() ? <span className="text-xs text-green-400">(benötigt)</span> : <span className="text-xs text-gray-500">(nicht benötigt)</span>}
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
                🌐 Sprache {shouldShowLanguageDropdown() ? <span className="text-xs text-green-400">(benötigt)</span> : <span className="text-xs text-gray-500">(nicht benötigt)</span>}
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
                Template-Quelle im Code einschließen
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
                      ❌ Template Syntax Errors ({syntaxErrors.length})
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
                    <strong>CRITICAL:</strong> Fix these syntax errors before generating code. The template will not work correctly!
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
                    ⚠️ Generated code may contain errors or invalid JavaScript!
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
                    These warnings won't break your code, but consider fixing them for better template quality.
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

          {/* Action Button */}
          <div className="flex space-x-2">
            <Button
              label={loading ? "Code wird geholt..." : t.debugmanualgeneratorpanel1369}
              icon={loading ? "pi pi-spinner pi-spin" : "pi pi-code"}
              onClick={fetchCode}
              disabled={!isButtonEnabled}
              className="bg-blue-600 hover:bg-blue-700"
            />

            <Button
              label={t.debugmanualgeneratorpanel1377}
              icon="pi pi-play"
              onClick={executeCode}
              disabled={!preparedCode}
              className="bg-green-600 hover:bg-green-700"
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
                  setDebugInfo(`❌ Fehler beim Debug Helper: ${(debugError as Error).message}\n\nDetails: ${debugError}`);
                  setActiveTabIndex(2);
                }
              }}
              disabled={!preparedCode}
              className="bg-blue-600 hover:bg-blue-700"
            />

            <Button
              label={editorUnlocked ? "Editor sperren" : "Editor freischalten"}
              icon={editorUnlocked ? "pi pi-lock" : "pi pi-unlock"}
              onClick={handleUnlockEditor}
              className={editorUnlocked ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"}
              tooltip={editorUnlocked ? "Editor sperren und zurücksetzen" : "Editor für manuelle Tests freischalten"}
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
                    <span className="text-sm text-gray-400">Editierbarer JavaScript-Code</span>
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
                                copyToClipboardFallback(formattedGTree);
                              });
                            } else {
                              // Fallback for older browsers or non-secure contexts
                              copyToClipboardFallback(formattedGTree);
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
                        label="GTree importieren"
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
                                    alert('❌ Ungültiges GTree Format: Muss ein Array sein');
                                    return;
                                  }

                                  if (!gtreeData[0]?.project || !Array.isArray(gtreeData[0].project)) {
                                    alert('❌ Ungültiges GTree Format: project array fehlt');
                                    return;
                                  }

                                  // Save to localStorage
                                  localStorage.setItem('scoriet_gtree', JSON.stringify(gtreeData));

                                  alert(`✅ GTree erfolgreich importiert!\n\n📊 Projekt: ${gtreeData[0].project[0]?.projectname || 'Unbekannt'}\n📁 Tabellen: ${gtreeData[0].project[0]?.tables?.length || 0}`);

                                } catch (error) {
                                  alert(`❌ Fehler beim Importieren:\n\n${(error as Error).message}\n\nStellen Sie sicher, dass die Datei ein gültiges GTree JSON enthält.`);
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
                              copyToClipboardFallback(codeText);
                            });
                          } else {
                            copyToClipboardFallback(codeText);
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
                            <p>Code Editor konnte nicht geladen werden</p>
                            <p className="text-sm text-gray-400">Verwenden Sie eine einfache Textarea als Fallback</p>
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
                    <div className="text-sm text-gray-400">Generierter PHP-Code</div>
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
                              copyToClipboardFallback(codeText);
                            });
                          } else {
                            copyToClipboardFallback(codeText);
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
                      {executedResult || `Klicken Sie auf "${t.debugmanualgeneratorpanel1377}" um das Ergebnis zu sehen...`}
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
                    {debugInfo || `Klicken Sie auf "${t.debugmanualgeneratorpanel1385}" um die Debug-Informationen zu sehen...`}
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
            💡 Tipp: Sie können "const gtree = " am Anfang lassen - wird automatisch entfernt
          </p>
        </div>
      </Dialog>
    </ErrorBoundary>
  );
}