import React, { useState, useEffect, useCallback } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import { ErrorBoundary } from 'react-error-boundary';
import { useProject } from '@/contexts/ProjectContext';
import Editor from 'react-simple-code-editor';
import ErrorFallback from '@/Components/ErrorFallback';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers';

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
        fontFamily: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace',
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

  // Editable version - convert Unicode escapes for editing
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

  return (
    <Editor
      value={displayCodeForEdit}
      onValueChange={handleChange}
      highlight={highlightCode}
      padding={10}
      style={{
        fontFamily: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace',
        fontSize: 14,
        lineHeight: 1.4,
        minHeight: '400px',
        width: '100%',
        backgroundColor: '#1a1a1a',
        color: '#d4d4d4',
      }}
      className="code-editor"
      placeholder="Hier erscheint der generierte JavaScript-Code..."
    />
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
    alert('Clipboard-Zugriff nicht möglich. Bitte prüfen Sie Browser-Einstellungen.');
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
//  languageId: preSelectedLanguageId,
  languageCode: preSelectedLanguageCode
}: DebugManualGeneratorPanelProps = {}) {
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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        return;
      }

      // Build URL with project filter if we have a preSelectedProjectId
      let url = '/api/templates';
      if (preSelectedProjectId) {
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
          setError('Keine Templates gefunden. Bitte erstellen Sie zuerst Templates im Template Management.');
        }
      } else {
        setError(`Fehler beim Laden der Templates: ${response.status}`);
      }
    } catch {
      setError('Fehler beim Laden der Templates');
    }
  }, [preSelectedProjectId]);

  const loadTemplateFiles = useCallback(async (templateId: number) => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

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
          // Create a normalized file object
          const normalizedFile = {
            id: file.id || file.file_id || file.template_file_id || index,
            file_name: file.file_name || file.name || file.filename || file.template_file_name || `File ${index + 1}`,
            file_type: file.file_type || file.type || file.template_file_type || file.extension || 'unknown',
            file_order: file.file_order || file.order || index,
            generation_type: file.generation_type || file.type || file.file_type || null,
            // Copy all original properties
            ...file
          };

          return normalizedFile;
        }).filter((file: any) => file.id !== undefined);

        setTemplateFiles(validFiles);

        // Auto-select first valid file - NUR wenn KEIN preSelectedFileId vorhanden!
        // WICHTIG: preSelectedFileId wird aus dem Closure gelesen, NICHT aus dependencies!
        if (validFiles.length > 0 && !preSelectedFileId) {
          setSelectedFile(validFiles[0].id);
        } else if (validFiles.length === 0) {
          setSelectedFile(null);
          setError(`Keine gültigen Template-Dateien für Template ${templateId} gefunden`);
        }
        // Wenn preSelectedFileId vorhanden: NICHT auto-select, warte auf useEffect Pre-Selection!
      } else {
        setError(`Fehler beim Laden der Template-Dateien: ${response.status}`);
      }
    } catch {
      setError('Fehler beim Laden der Template-Dateien');
    }
  }, []); // WICHTIG: LEER lassen, preSelectedFileId aus Closure verwenden!

  const loadSchemaTables = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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
                          const tableName = table.table_name || table.name || table.tablename || 'Unknown Table';

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
                const tableName = table.table_name || table.name || table.tablename || 'Unknown Table';
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
              database_name: 'Demo Schema (Fallback)'
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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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

        // Filter to only show languages enabled for the selected project
        if (selectedProject?.enabled_languages && Array.isArray(selectedProject.enabled_languages)) {
          languages = languages.filter((lang: any) =>
            selectedProject.enabled_languages.includes(lang.code)
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
  }, [selectedLanguage, selectedProject]); // WICHTIG: preSelectedLanguageCode NICHT in dependencies (kommt aus Closure)!

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
    console.log('🔍 Template Pre-Selection useEffect:', {
      preSelectedTemplateId,
      templatesLength: templates.length,
      selectedTemplate,
      templates: templates.map(t => ({ id: t.id, name: t.name }))
    });

    if (preSelectedTemplateId && templates.length > 0 && !selectedTemplate) {
      // Check if the template exists in the loaded templates
      const templateExists = templates.some(t => t.id === preSelectedTemplateId);
      console.log('✅ Template exists?', templateExists);
      if (templateExists) {
        console.log('✅ Setting template to:', preSelectedTemplateId);
        setTimeout(() => {
          setSelectedTemplate(preSelectedTemplateId);
        }, 100);
      }
    }
  }, [preSelectedTemplateId, templates, selectedTemplate]);

  // Pre-select file when opened from File Preview
  useEffect(() => {
    console.log('🔍 File Pre-Selection useEffect:', {
      preSelectedFileId,
      templateFilesLength: templateFiles.length,
      selectedFile,
      templateFiles: templateFiles.map(f => ({ id: f.id, name: f.file_name }))
    });

    if (preSelectedFileId && templateFiles.length > 0 && selectedFile === null) {
      // Check if the file exists in the loaded template files
      const fileExists = templateFiles.some(f => f.id === preSelectedFileId);
      console.log('✅ File exists?', fileExists, 'Looking for ID:', preSelectedFileId);
      if (fileExists) {
        console.log('✅ Setting file to:', preSelectedFileId);
        // Slight delay after template files load
        setTimeout(() => {
          setSelectedFile(preSelectedFileId);
        }, 200);
      }
    }
  }, [preSelectedFileId, templateFiles, selectedFile]);

  // Pre-select language when opened from File Preview
  useEffect(() => {
    console.log('🔍 Language Pre-Selection useEffect:', {
      preSelectedLanguageCode,
      languageOptionsLength: languageOptions.length,
      selectedLanguage,
      languageOptions
    });

    if (preSelectedLanguageCode && languageOptions.length > 0 && !selectedLanguage) {
      // Check if the language exists in the loaded language options
      const languageExists = languageOptions.some(l => l.value === preSelectedLanguageCode);
      console.log('✅ Language exists?', languageExists, 'Looking for code:', preSelectedLanguageCode);
      if (languageExists) {
        console.log('✅ Setting language to:', preSelectedLanguageCode);
        setTimeout(() => {
          setSelectedLanguage(preSelectedLanguageCode);
        }, 100);
      }
    }
  }, [preSelectedLanguageCode, languageOptions, selectedLanguage]);

  const fetchCode = async () => {
    if (!selectedTemplate || (selectedFile === null || selectedFile === undefined)) {
      setError('Bitte Template und Datei auswählen');
      return;
    }

    const fileGenerationType = getFileGenerationType();

    if ((fileGenerationType === 'project_file' || fileGenerationType === 'project_file_languages') && !selectedProjectForGenerator) {
      setError('Bitte Projekt auswählen');
      return;
    }

    if ((fileGenerationType === 'db_table_file' || fileGenerationType === 'db_table_file_languages') && (selectedTable === null || selectedTable === undefined)) {
      setError('Bitte Tabelle auswählen');
      return;
    }

    if ((fileGenerationType === 'project_file_languages' || fileGenerationType === 'db_table_file_languages') && !selectedLanguage) {
      setError('Bitte Sprache auswählen');
      return;
    }

    if (!fileGenerationType || ['static_file', 'static_directory'].includes(fileGenerationType)) {
      setError('Diese Datei unterstützt keine Code-Generierung (Static File)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

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
            errorMsg += `  Tabelle: ${selectedTableData?.tablename || 'Unknown'}\\n`;
          }

          if (fileGenerationType === 'project_file_languages' || fileGenerationType === 'db_table_file_languages') {
            errorMsg += `  Sprache: ${selectedLanguage || 'Unknown'}\\n`;
          }

          errorMsg += `\\n📋 Verfügbare Dateien (${data.processed_files?.length || 0}):\\n`;
          if (data.processed_files?.length > 0) {
            data.processed_files.slice(0, 5).forEach((file: any, idx: number) => {
              errorMsg += `  ${idx + 1}. ${file.filename || file.generated_from_template || 'Unknown'} ${file.table_name ? `(${file.table_name})` : ''}\\n`;
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
        setError(errorData.message || 'Fehler beim Laden des Codes');
      }
    } catch {
      setError('Fehler beim Laden des Codes');
    } finally {
      setLoading(false);
    }
  };

  const executeCode = () => {
    if (!preparedCode) {
      setError('Kein Code zum Ausführen vorhanden');
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
          throw new Error('No function found in generated code');
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
      setExecutedResult(`❌ Ausführung fehlgeschlagen!\n\nBitte kontrollieren Sie den "Debug Helper" Tab für Details.\n\nFehler: ${(execError as Error).message || 'Unbekannter Fehler'}`);
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

      if (error.name === 'SyntaxError') {
        errorMessage = `❌ JavaScript-Syntax-Fehler im Template${lineNumber}:\n\n🔍 Problem: ${error.message}\n\n💡 Häufige Ursachen:\n• Fehlende oder extra Anführungszeichen\n• Unvollständige Variablen wie {item.\n• Falsche Klammern in Schleifen\n• Sonderzeichen die escapt werden müssen\n\n🛠️ Lösung: Prüfen Sie Template-Syntax und {variablename} Platzhalter.`;

      } else if (error.name === 'ReferenceError') {
        // Extract variable name if possible
        const variableMatch = error.message.match(/(\w+) is not defined/);
        const variable = variableMatch ? variableMatch[1] : 'unknown';

        errorMessage = `❌ Template-Variable nicht gefunden${lineNumber}:\n\n🔍 Problem: Variable "${variable}" ist nicht definiert\n📄 Details: ${error.message}\n\n💡 Mögliche Ursachen:\n• gtree wurde nicht geladen\n• Tabelle/Projekt nicht ausgewählt\n• Variable existiert nicht in der Datenstruktur\n• Tippfehler in Variablenname\n\n🛠️ Lösung: Prüfen Sie die {${variable}} Variable oder wählen Sie Tabelle/Projekt aus.`;

      } else if (error.name === 'TypeError') {
        errorMessage = `❌ Typ-Fehler im Template${lineNumber}:\n\n🔍 Problem: ${error.message}\n\n💡 Häufige Ursachen:\n• Zugriff auf undefined/null Werte\n• Falsche Array-Zugriffe wie tables[]\n• Fehlende lang-Arrays in gtree\n• Falsche selectedlanguageindex\n\n🛠️ Lösung: Prüfen Sie Datenstrukturen und Array-Zugriffe.`;

      } else {
        errorMessage = `❌ Template-Ausführungsfehler${lineNumber}:\n\n🔍 Problem: ${error.message || 'Unbekannter Fehler'}\n📝 Typ: ${error.name || 'Unknown'}\n\n💡 Debug-Tipps:\n• Öffnen Sie Browser Console (F12) für Details\n• Prüfen Sie das generierte JavaScript\n• Vereinfachen Sie das Template zum Testen\n\n🛠️ Bei wiederholten Problemen: Template-Syntax vereinfachen.`;
      }

      // Only try fallback for SyntaxError, not for runtime errors
      if (error.name === 'SyntaxError') {
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
          setExecutedResult(`${errorMessage}\n\n🔧 Fallback-Interpretation ebenfalls fehlgeschlagen:\n${fallbackError.message || 'Unbekannter Fallback-Fehler'}\n\nOriginal Code (erste 500 Zeichen):\n${preparedCode.substring(0, 500)}...`);
        }
      } else {
        // For non-SyntaxErrors (ReferenceError, TypeError, etc.), show error immediately without fallback
        setExecutedResult(`${errorMessage}\n\n🔍 Debug-Tipp: Verwenden Sie den Debug Helper Tab für detaillierte Analyse.`);
        setActiveTabIndex(1); // Switch to result tab
      }
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
      const fileType = f.file_type || (f as any).type || (f as any).template_file_type || 'Unbekannt';

      return {
        label: `${fileName} (${fileType})`,
        value: f.id
      };
    })
    .filter(f => f.label && !f.label.includes('undefined') && f.label !== 'Unbenannt (Unbekannt)') // Remove any remaining undefined labels
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
      database: table.database_name || 'Unknown'
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
      <div className="h-full bg-gray-800 text-gray-100 p-4">
        <Card className="h-full bg-gray-700 border-gray-600">
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
                placeholder="Datei wählen"
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
                placeholder={shouldShowTableDropdown() ? "Tabelle wählen" : "Nicht benötigt für diesen File-Typ"}
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
                placeholder={shouldShowProjectDropdown() ? "Projekt wählen" : "Nicht benötigt für diesen File-Typ"}
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
                placeholder={shouldShowLanguageDropdown() ? "Sprache wählen" : "Nicht benötigt für diesen File-Typ"}
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
                id="includeTemplateSource"
                checked={includeTemplateSource}
                onChange={(e) => setIncludeTemplateSource(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="includeTemplateSource" className="text-sm text-gray-300 cursor-pointer">
                Template-Quelle im Code einschließen
              </label>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex space-x-2">
            <Button
              label={loading ? "Code wird geholt..." : "Code holen"}
              icon={loading ? "pi pi-spinner pi-spin" : "pi pi-code"}
              onClick={fetchCode}
              disabled={!isButtonEnabled}
              className="bg-blue-600 hover:bg-blue-700"
            />

            <Button
              label="Code ausführen"
              icon="pi pi-play"
              onClick={executeCode}
              disabled={!preparedCode}
              className="bg-green-600 hover:bg-green-700"
            />

            <Button
              label="🔍 Debug Helper"
              icon="pi pi-search"
              onClick={() => {
                try {
                  let debugOutput = '';

                  debugOutput += `🔠🔠🔠 Scoriet Template Debug Analysis 🔠🔠🔠\n`;
                  debugOutput += `⏰ Analysis started at: ${new Date().toLocaleTimeString()}\n\n`;

                  debugOutput += `⚙️ CONFIGURATION ANALYSIS\n`;
                  debugOutput += `==============================\n`;
                  debugOutput += `Template: ${selectedTemplate || 'Not selected'}\n`;
                  debugOutput += `File: ${getSelectedFileName() || 'Not selected'}\n`;
                  debugOutput += `Type: ${getFileGenerationType() || 'Unknown'}\n`;
                  debugOutput += `Project: ${selectedProjectForGenerator || 'Not selected'}\n`;
                  debugOutput += `Table: ${selectedTable !== null ? selectedTable : 'Not selected'}\n`;
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
                    issues.push('🔴 No project selected for project_file template');
                  }
                  if ((selectedTable === null || selectedTable === undefined) && shouldShowTableDropdown()) {
                    issues.push('🔴 No table selected for db_table_file template');
                  }
                  if (!selectedLanguage && shouldShowLanguageDropdown()) {
                    issues.push('🟡 No language selected for language-enabled template');
                  }
                  if (preparedCode && preparedCode.includes('tables[]')) {
                    issues.push('🔴 Found tables[] - missing table index');
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

          {/* Debug Info */}
          {selectedTemplate && selectedFile && (
            <div className="bg-gray-800 p-3 rounded border border-gray-600">
              <div className="text-sm text-gray-300">
                <strong>Debug-Konfiguration:</strong><br/>
                Template: {selectedTemplate} |
                Datei: {getSelectedFileName()} |
                Typ: {getFileGenerationType()}<br/>
                {shouldShowProjectDropdown() && `Projekt: ${projectOptions.find(p => p.value === selectedProjectForGenerator)?.label || 'Nicht gewählt'}`}
                {shouldShowTableDropdown() && `Tabelle: ${selectedTable !== null ? tableOptions.find(t => t.value === selectedTable)?.label : 'Nicht gewählt'}`}
                {shouldShowTableDropdown() && <br/>}
                {shouldShowTableDropdown() && `Verfügbare Tabellen: ${tableOptions.length}`}
                {shouldShowLanguageDropdown() && <br/>}
                {shouldShowLanguageDropdown() && `Sprache: ${selectedLanguage ? languageOptions.find(l => l.value === selectedLanguage)?.label || selectedLanguage : 'Nicht gewählt'}`}
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
              <TabPanel header="1. Vorbereiteter Code" className="text-gray-100">
                <div className="bg-gray-900 p-4 rounded border border-gray-600">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Editierbarer JavaScript-Code</span>
                    <div className="flex gap-2">
                      <Button
                        label="GTree kopieren"
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
                        label="GTree downloaden"
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
                              alert('Download fehlgeschlagen. Bitte prüfen Sie die GTree-Daten.');
                            }
                          }
                        }}
                        disabled={!localStorage.getItem('scoriet_gtree')}
                        className="p-button-outlined p-button-sm p-button-success"
                      />
                      <Button
                        label="Code kopieren"
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
                        code={preparedCode || 'Klicken Sie auf "Code abrufen" um den Code zu sehen...'}
                        readOnly={false}
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
                    }
                    .code-editor pre {
                      background: transparent !important;
                      margin: 0;
                    }
                  `}</style>
                </div>
              </TabPanel>

              <TabPanel header="2. Ausgeführtes Ergebnis" className="text-gray-100">
                <div className="bg-gray-900 rounded border border-gray-600">
                  {/* Button Bar */}
                  <div className="flex justify-between items-center p-2 border-b border-gray-600 bg-gray-800">
                    <div className="text-sm text-gray-400">Generierter PHP-Code</div>
                    <div className="flex gap-2">
                      <Button
                        label="Code kopieren"
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
                              const blob = new Blob([executedResult], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = downloadFilename;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            } catch {
                              alert('Download fehlgeschlagen.');
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
                        fontFamily: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace',
                        color: '#d4d4d4',
                        lineHeight: 1.4
                      }}
                    >
                      {executedResult || 'Klicken Sie auf "Code ausführen" um das Ergebnis zu sehen...'}
                    </div>
                  </div>
                </div>
              </TabPanel>

              <TabPanel header="3. 🔍 Debug Helper" className="text-gray-100">
                <div className="bg-gray-900 p-4 rounded border border-gray-600 max-h-96 overflow-auto">
                  <div
                    className="text-sm whitespace-pre-wrap font-mono"
                    style={{
                      fontFamily: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace',
                      color: '#d4d4d4',
                      lineHeight: 1.4
                    }}
                  >
                    {debugInfo || 'Klicken Sie auf "🔍 Debug Helper" um die Debug-Informationen zu sehen...'}
                  </div>
                </div>
              </TabPanel>
              </TabView>
            </div>
          )}
          </div>
        </Card>
      </div>
    </ErrorBoundary>
  );
}