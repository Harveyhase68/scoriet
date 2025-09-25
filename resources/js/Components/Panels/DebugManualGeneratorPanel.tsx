import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import { Message } from 'primereact/message';
import { ErrorBoundary } from 'react-error-boundary';
import { useProject } from '@/contexts/ProjectContext';
import Editor from 'react-simple-code-editor';
import ErrorFallback from '@/Components/ErrorFallback';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css';

// Professional JavaScript syntax highlighter using Prism.js
const highlightCode = (code: string) => {
  try {
    return Prism.highlight(code, Prism.languages.javascript, 'javascript');
  } catch (error) {
    // Fallback to plain text if highlighting fails
    console.warn('Syntax highlighting failed:', error);
    return code;
  }
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
  } catch (err) {
    alert('Clipboard-Zugriff nicht möglich. Bitte prüfen Sie Browser-Einstellungen.');
  }
};

// interface TabPanelProps {
//   isActive: boolean;
// }

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

export default function DebugManualGeneratorPanel() {
  const { selectedProject, projects } = useProject();

  // Selection States
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [selectedProjectForGenerator, setSelectedProjectForGenerator] = useState<number | null>(selectedProject?.id || null);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  // Data States
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateFiles, setTemplateFiles] = useState<TemplateFile[]>([]);
  const [schemaTables, setSchemaTables] = useState<SchemaTable[]>([]);

  // Content States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [preparedCode, setPreparedCode] = useState<string>('');
  const [executedResult, setExecutedResult] = useState<string>('');
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Helper functions (defined early to avoid hoisting issues)
  const getFileGenerationType = (): 'project_file' | 'db_table_file' | 'static_file' | 'static_directory' | null => {
    if (!templateFiles || templateFiles.length === 0 || selectedFile === null || selectedFile === undefined) {
      return null;
    }

    const file = templateFiles.find(f => f.id === selectedFile);
    if (!file) return null;

    // Direkte Typen-Zuordnung (bevorzugt)
    if (file.generation_type) {
      return file.generation_type as 'project_file' | 'db_table_file' | 'static_file' | 'static_directory';
    }

    if (file.file_type) {
      // Datenbank-spezifische Template-Typen
      const dbFileTypes = ['template', 'db_table_file', 'model', 'controller', 'view', 'migration'];
      // Projekt-spezifische Template-Typen
      const projectFileTypes = ['project_file', 'config', 'helper', 'static_file', 'static_directory'];

      if (dbFileTypes.includes(file.file_type.toLowerCase())) {
        return 'db_table_file';
      } else if (projectFileTypes.includes(file.file_type.toLowerCase())) {
        return 'project_file';
      }
    }

    // Fallback anhand Dateiname
    const fileName = file.file_name.toLowerCase();
    if (fileName.includes('table') || fileName.includes('model') || fileName.includes('entity')) {
      return 'db_table_file';
    } else if (fileName.includes('project') || fileName.includes('config') || fileName.includes('main')) {
      return 'project_file';
    }

    return null; // Unbekannt/Static
  };

  const shouldShowProjectDropdown = (): boolean => {
    const fileType = getFileGenerationType();
    return fileType === 'project_file';
  };

  const shouldShowTableDropdown = (): boolean => {
    const fileType = getFileGenerationType();
    return fileType === 'db_table_file';
  };

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
    loadSchemaTables();
  }, []);

  // Update selected project when global project changes
  useEffect(() => {
    if (selectedProject) {
      setSelectedProjectForGenerator(selectedProject.id);
      // Reload schema tables when project changes
      loadSchemaTables();
    }
  }, [selectedProject]);

  // Update button state when dependencies change
  useEffect(() => {
    const projectCondition = !(shouldShowProjectDropdown() && !selectedProjectForGenerator);
    // FIXED: 0 is a valid table index, don't treat it as falsy!
    const tableCondition = !shouldShowTableDropdown() || (selectedTable !== null && selectedTable !== undefined);

    Boolean(!loading && selectedTemplate && (selectedFile !== null && selectedFile !== undefined) && projectCondition && tableCondition);
  }, [selectedTable, loading, selectedTemplate, selectedFile, selectedProjectForGenerator, shouldShowProjectDropdown, shouldShowTableDropdown]);

  // Load template files when template changes
  useEffect(() => {
    if (selectedTemplate) {
      loadTemplateFiles(selectedTemplate);
    }
  }, [selectedTemplate]);

  const loadTemplates = async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        return;
      }
      const response = await fetch('/api/templates', {
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
    } catch (err) {
      setError('Fehler beim Laden der Templates');
    }
  };

  const loadTemplateFiles = async (templateId: number) => {
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

        // Auto-select first valid file
        if (validFiles.length > 0) {
          setSelectedFile(validFiles[0].id);
        } else {
          setSelectedFile(null);
          setError(`Keine gültigen Template-Dateien für Template ${templateId} gefunden`);
        }
      } else {
        setError(`Fehler beim Laden der Template-Dateien: ${response.status}`);
      }
    } catch (err) {
      setError('Fehler beim Laden der Template-Dateien');
    }
  };

  const loadSchemaTables = async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      let allTables: SchemaTable[] = [];

      // If we have a selected project, load its schemas
      if (selectedProject) {
        try {
          const response = await fetch(`/api/projects/${selectedProject.id}/schemas`, {
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

                      if (!tablesResponse.ok) {
                        // Tables API failed for this version
                      }

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
                } catch (versionErr) {
                  // Error loading versions for this schema
                }
              }
            }
          }
        } catch (projectErr) {
          // Error loading project schemas
        }
      }

      // Only use fallback if we have no project selected or no project schemas found

      // WICHTIG: Nur Fallback verwenden wenn kein Projekt ausgewählt ist
      // Wenn ein Projekt ausgewählt ist, aber keine Schemas hat, dann ist das okay (leere Liste)
      if (allTables.length === 0 && !selectedProject) {

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
        } catch (globalErr) {
          // Error loading global schemas
        }
      } else if (selectedProject && allTables.length === 0) {
        // Project selected but no linked schemas found - this is acceptable
      }

      // Last fallback: gtree-test API (nur wenn gar kein Projekt ausgewählt)
      if (allTables.length === 0 && !selectedProject) {

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

    } catch (err) {
      setSchemaTables([]);
    }
  };

  const fetchCode = async () => {
    if (!selectedTemplate || (selectedFile === null || selectedFile === undefined)) {
      setError('Bitte Template und Datei auswählen');
      return;
    }

    const fileGenerationType = getFileGenerationType();

    if (fileGenerationType === 'project_file' && !selectedProjectForGenerator) {
      setError('Bitte Projekt auswählen');
      return;
    }

    if (fileGenerationType === 'db_table_file' && (selectedTable === null || selectedTable === undefined)) {
      setError('Bitte Tabelle auswählen');
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
      const url = new URL(`/api/template-process/${selectedTemplate}`, window.location.origin);
      if (selectedProject) {
        url.searchParams.set('project_id', selectedProject.id.toString());
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

        if (fileGenerationType === 'db_table_file' && selectedTable !== null) {
          // Find file for specific table
          targetFile = data.generated_files.find((file: any) =>
            file.table_index === selectedTable &&
            file.generated_from_template === getSelectedFileName()
          );
        } else if (fileGenerationType === 'project_file') {
          // Find project-level file
          targetFile = data.generated_files.find((file: any) =>
            file.is_project_file &&
            file.generated_from_template === getSelectedFileName()
          );
        }

        if (targetFile) {
          // Use backend gtree data (contains full database structure)
          const gtreeData = data.gtree || [];

          // Store gtree in localStorage for efficient access during execution
          localStorage.setItem('scoriet_gtree', JSON.stringify(gtreeData));

          // Trigger re-render for button state
          setTimeout(() => {
            // Force component update to enable GTree copy button
          }, 100);

          const originalCode = targetFile.content; // Use content (with \\u000A) not content_clean

          // Check backend-generated template size before processing
          const originalSizeKB = Math.round(originalCode.length / 1024);
          const maxOriginalSizeKB = 150; // Conservative limit for backend content

          if (originalCode.length > maxOriginalSizeKB * 1024) {
            setError(`Backend-Template zu umfangreich (${originalSizeKB}KB von max. ${maxOriginalSizeKB}KB). Template enthält zu viele Tabellen oder komplexe Strukturen.`);
            setLoading(false);
            return;
          }


          // First: Convert JavaScript structure \n to real newlines
          let cleanedCode = originalCode.replace(/\\n/g, '\n');

          // Convert indent placeholders to Unicode spaces BEFORE Unicode conversion
          cleanedCode = cleanedCode.replace(/§INDENT2§/g, '\\u0020\\u0020');
          cleanedCode = cleanedCode.replace(/§INDENT4§/g, '\\u0020\\u0020\\u0020\\u0020');


          // Convert Unicode newlines to \n text for template content
          cleanedCode = cleanedCode.replace(/\\u000A/g, '\\n');

          // Convert Unicode tabs to \t text for template content
          cleanedCode = cleanedCode.replace(/\\u0009/g, '\\t');

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
          setError('Datei für ausgewählte Konfiguration nicht gefunden');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Fehler beim Laden des Codes');
      }
    } catch (err) {
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
        // Execute the prepared code which includes gtree definition and function
        // Make function available in global scope
        const globalEval = eval;
        globalEval(`
          ${preparedCode}
          // Make function globally available
          window.currentGeneratorFunction = ${preparedCode.match(/function\s+(\w+)\s*\(/)?.[1] || 'generate_project_template'};
        `);

        // Try to find and call the generated function
        const functionMatch = preparedCode.match(/function\s+(\w+)\s*\([^)]*\)\s*\{/);
        if (functionMatch) {
          const functionName = functionMatch[1];

          // Call the function from global scope
          const execResult = (window as any).currentGeneratorFunction();
          result = execResult || '';
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
    } catch (err) {

      // Enhanced error handling based on error type
      let errorMessage = '';
      const error = err as Error;
      if (error.name === 'SyntaxError') {
        errorMessage = `❌ JavaScript-Syntax-Fehler im Template:\n${error.message}\n\nBitte prüfen Sie Template-Syntax und Sonderzeichen.`;
      } else if (error.name === 'ReferenceError') {
        errorMessage = `❌ Template-Variable nicht gefunden:\n${error.message}\n\nBitte prüfen Sie {variablename} Platzhalter.`;
      } else if (error.name === 'TypeError') {
        errorMessage = `❌ Typ-Fehler im Template:\n${error.message}\n\nBitte prüfen Sie Datenstrukturen und Zugriffe.`;
      } else {
        errorMessage = `❌ Template-Ausführungsfehler:\n${error.message || 'Unbekannter Fehler'}`;
      }

      // Try fallback interpretation before giving up

      // Fallback to simple interpretation
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

        // Set the fallback result
        setExecutedResult(result);
        setActiveTabIndex(1); // Switch to result tab
      } catch (fallbackErr) {
        // Use the enhanced error message from the main catch block
        const fallbackError = fallbackErr as Error;
        setExecutedResult(`${errorMessage}\n\n🔧 Fallback-Interpretation ebenfalls fehlgeschlagen:\n${fallbackError.message || 'Unbekannter Fallback-Fehler'}\n\nOriginal Code (erste 500 Zeichen):\n${preparedCode.substring(0, 500)}...`);
      }
    }
  };

  const getSelectedFileName = () => {
    const file = templateFiles.find(f => f.id === selectedFile);
    return file?.file_name || '';
  };

  // Functions moved up to avoid hoisting issues

  const generateGTreeData = () => {
    const fileType = getFileGenerationType();

    if (fileType === 'project_file' && selectedProjectForGenerator) {
      // Generate project-level gtree
      const project = projects.find(p => p.id === selectedProjectForGenerator);
      return [{
        project: [{
          projectname: project?.name || 'Unknown Project',
          nmaxfiles: 1,
          project_id: selectedProjectForGenerator,
          tables: [] // Könnte erweitert werden wenn das Projekt Tabellen hat
        }]
      }];
    } else if (fileType === 'db_table_file' && selectedTable !== null) {
      // Generate table-specific gtree
      const table = schemaTables[selectedTable];
      if (table) {
        return [{
          project: [{
            projectname: table.database_name || 'Unknown Database',
            nmaxfiles: 1,
            tables: [{
              tablename: table.tablename,
              nmaxitems: table.nmaxitems,
              tableIndex: selectedTable,
              items: table.items || []
            }]
          }]
        }];
      }
    }

    // Fallback: empty gtree
    return [{
      project: [{
        projectname: 'Debug Session',
        nmaxfiles: 0,
        tables: []
      }]
    }];
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
  const fileType = getFileGenerationType();
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

  const isButtonEnabled = Boolean(
    !loading &&
    selectedTemplate &&
    (selectedFile !== null && selectedFile !== undefined) &&
    projectConditionResult &&
    tableConditionResult
  );


  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('DebugManualGenerator Error:', error, errorInfo);
      }}
    >
      <div className="h-full bg-gray-800 text-gray-100 p-4">
        <Card className="h-full bg-gray-700 border-gray-600">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">🔧 Debug Manual Generator</h2>
          <p className="text-sm text-gray-300 mb-4">
            Template-Entwicklung und Code-Debugging für einzelne Dateien
          </p>

          {/* Selection Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Template
              </label>
              <Dropdown
                value={selectedTemplate}
                options={templateOptions}
                onChange={(e) => setSelectedTemplate(e.value)}
                placeholder="Template wählen"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Datei
              </label>
              <Dropdown
                value={selectedFile}
                options={fileOptions}
                onChange={(e) => {
                  setSelectedFile(e.value);
                  // Reset table selection when changing file type
                  setSelectedTable(null);
                }}
                placeholder="Datei wählen"
                className="w-full"
                disabled={!selectedTemplate}
              />
            </div>

            {/* Project Dropdown - nur sichtbar bei project_file */}
            {shouldShowProjectDropdown() && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Projekt
                </label>
                <Dropdown
                  value={selectedProjectForGenerator}
                  options={projectOptions}
                  onChange={(e) => setSelectedProjectForGenerator(e.value)}
                  placeholder="Projekt wählen"
                  className="w-full"
                />
              </div>
            )}

            {/* Table Dropdown - nur sichtbar bei db_table_file */}
            {shouldShowTableDropdown() && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  DB Tabelle
                </label>
                <Dropdown
                  value={selectedTable}
                  options={tableOptions}
                  onChange={(e) => {
                    setSelectedTable(e.value);
                  }}
                  placeholder="Tabelle wählen"
                  className="w-full"
                />
              </div>
            )}

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
          </div>

          {error && (
            <Message severity="error" text={error} className="w-full" />
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
              </div>
            </div>
          )}

          {/* 2-Tab System */}
          {preparedCode && (
            <TabView
              activeIndex={activeTabIndex}
              onTabChange={(e) => setActiveTabIndex(e.index)}
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
                            } catch (error) {
                              console.error('GTree Download failed:', error);
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

                  {/* Code Editor with Syntax Highlighting */}
                  <div className="w-full bg-gray-900 border border-gray-600 rounded code-editor-container" style={{height: '400px', overflowY: 'scroll', overflowX: 'auto'}}>
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
                      onError={(error) => console.error('Code Editor Error:', error)}
                    >
                      <Editor
                        value={preparedCode || 'Klicken Sie auf "Code abrufen" um den Code zu sehen...'}
                        onValueChange={(code) => setPreparedCode(code)}
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
                <div className="bg-gray-900 p-4 rounded border border-gray-600 max-h-96 overflow-auto">
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
              </TabPanel>
            </TabView>
          )}
          </div>
        </Card>
      </div>
    </ErrorBoundary>
  );
}