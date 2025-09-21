import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import { Message } from 'primereact/message';
import { useProject } from '@/contexts/ProjectContext';

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
  const { currentProject, projects } = useProject();

  // Selection States
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(currentProject?.id || null);
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

  // Update selected project when current project changes
  useEffect(() => {
    if (currentProject) {
      setSelectedProject(currentProject.id);
    }
  }, [currentProject]);

  // Debug selectedTable changes
  useEffect(() => {
    console.log('selectedTable changed:', selectedTable, typeof selectedTable);

    const projectCondition = !(shouldShowProjectDropdown() && !selectedProject);
    // FIXED: 0 is a valid table index, don't treat it as falsy!
    const tableCondition = !shouldShowTableDropdown() || (selectedTable !== null && selectedTable !== undefined);

    console.log('Debug conditions:', {
      loading,
      selectedTemplate,
      selectedFile,
      shouldShowProject: shouldShowProjectDropdown(),
      shouldShowTable: shouldShowTableDropdown(),
      projectCondition,
      tableCondition,
      selectedTable,
      selectedTableIsValid: selectedTable !== null && selectedTable !== undefined
    });

    const result = Boolean(!loading && selectedTemplate && (selectedFile !== null && selectedFile !== undefined) && projectCondition && tableCondition);
    console.log('🔥 NEW VERSION - Button should be enabled now:', result);
    console.log('🔥 Version timestamp:', new Date().toISOString());
  }, [selectedTable, loading, selectedTemplate, selectedFile, selectedProject, shouldShowProjectDropdown, shouldShowTableDropdown]);

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
        console.log('No auth token found');
        return;
      }

      console.log('Loading templates...');
      const response = await fetch('/api/templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      console.log('Templates response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API Response for templates:', data);

        let templatesArray = [];
        if (Array.isArray(data.data)) {
          templatesArray = data.data;
        } else if (Array.isArray(data)) {
          templatesArray = data;
        } else if (data.templates && Array.isArray(data.templates)) {
          templatesArray = data.templates;
        }

        console.log('Setting templates to:', templatesArray);
        setTemplates(templatesArray);

        if (templatesArray.length === 0) {
          setError('Keine Templates gefunden. Bitte erstellen Sie zuerst Templates im Template Management.');
        }
      } else {
        const errorData = await response.text();
        console.error('Templates API error:', response.status, errorData);
        setError(`Fehler beim Laden der Templates: ${response.status}`);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Fehler beim Laden der Templates');
    }
  };

  const loadTemplateFiles = async (templateId: number) => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      console.log(`Loading template files for template ${templateId}...`);

      const response = await fetch(`/api/template-output/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      console.log(`Template files response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log('Template files API response:', data);

        let filesArray = [];
        if (data.files && Array.isArray(data.files)) {
          filesArray = data.files;
        } else if (Array.isArray(data)) {
          filesArray = data;
        } else if (data.template_files && Array.isArray(data.template_files)) {
          filesArray = data.template_files;
        }

        console.log('Files array before filtering:', filesArray);

        // Check first file structure
        if (filesArray.length > 0) {
          console.log('First file structure:', filesArray[0]);
          console.log('First file keys:', Object.keys(filesArray[0]));
        }

        // More lenient filtering - accept any object with some identifier
        const validFiles = filesArray.map((file, index) => {
          console.log('Processing file:', file);

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

          console.log('Normalized file:', normalizedFile);
          return normalizedFile;
        }).filter(file => file.id !== undefined);

        console.log('Valid template files:', validFiles);
        setTemplateFiles(validFiles);

        // Auto-select first valid file
        if (validFiles.length > 0) {
          setSelectedFile(validFiles[0].id);
        } else {
          setSelectedFile(null);
          setError(`Keine gültigen Template-Dateien für Template ${templateId} gefunden`);
        }
      } else {
        const errorText = await response.text();
        console.error('Template files API error:', response.status, errorText);
        setError(`Fehler beim Laden der Template-Dateien: ${response.status}`);
      }
    } catch (err) {
      console.error('Error loading template files:', err);
      setError('Fehler beim Laden der Template-Dateien');
    }
  };

  const loadSchemaTables = async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      console.log('Loading schema tables...');
      let allTables: SchemaTable[] = [];

      // Versuche verschiedene API-Endpunkte um die echten Datenbanken zu finden
      const apiEndpoints = [
        '/api/schemas',
        '/api/schema-versions',
        '/api/template-db-schema/schemas',
        '/api/sql-schemas',
        '/api/database-schemas'
      ];

      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            }
          });

          console.log(`${endpoint} response status:`, response.status);

          if (response.ok) {
            const data = await response.json();
            console.log(`${endpoint} response:`, data);

            // Parse different response formats
            let items = [];
            if (Array.isArray(data.data)) {
              items = data.data;
            } else if (Array.isArray(data)) {
              items = data;
            } else if (data.schemas && Array.isArray(data.schemas)) {
              items = data.schemas;
            } else if (data.databases && Array.isArray(data.databases)) {
              items = data.databases;
            }

            console.log(`Processing ${items.length} items from ${endpoint}:`, items);

            items.forEach((item: any, index: number) => {
              console.log(`Processing item ${index}:`, item);

              const dbName = item.name || item.database_name || item.schema_name || item.title || `Database ${item.id || index + 1}`;

              // Parse tables from different structures
              let tables = [];
              if (item.tables && Array.isArray(item.tables)) {
                tables = item.tables;
              } else if (item.parsed_tables && Array.isArray(item.parsed_tables)) {
                tables = item.parsed_tables;
              } else if (item.schema_tables && Array.isArray(item.schema_tables)) {
                tables = item.schema_tables;
              }

              console.log(`Found ${tables.length} tables in ${dbName}:`, tables);

              tables.forEach((table: any) => {
                const tableName = table.name || table.tablename || table.table_name || 'Unknown Table';
                const fieldCount = table.fields?.length || table.columns?.length || table.nmaxitems || 0;

                allTables.push({
                  tablename: tableName,
                  nmaxitems: fieldCount,
                  database_name: dbName,
                  schema_id: item.id,
                  items: table.fields || table.columns || table.items || []
                });
              });
            });

            if (allTables.length > 0) {
              console.log(`Successfully loaded ${allTables.length} tables from ${endpoint}`);
              break; // Stop trying other endpoints if we found tables
            }
          }
        } catch (apiErr) {
          console.log(`${endpoint} error:`, apiErr);
        }
      }

      // Fallback: gtree-test API falls keine anderen Tabellen gefunden
      if (allTables.length === 0) {
        console.log('No tables from schemas API, trying gtree-test...');

        const gtreeResponse = await fetch('/api/gtree-test/1', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });

        if (gtreeResponse.ok) {
          const gtreeData = await gtreeResponse.json();
          console.log('GTree API response:', gtreeData);

          if (gtreeData.gtree && gtreeData.gtree[0] && gtreeData.gtree[0].project[0]) {
            const tables = gtreeData.gtree[0].project[0].tables || [];
            allTables = tables.map((table: any) => ({
              ...table,
              database_name: 'Test Schema' // Besserer Default-Name
            }));
          }
        }
      }

      setSchemaTables(allTables);
      console.log('Final loaded schema tables:', allTables);
    } catch (err) {
      console.error('Error loading schema tables:', err);
    }
  };

  const fetchCode = async () => {
    if (!selectedTemplate || (selectedFile === null || selectedFile === undefined)) {
      setError('Bitte Template und Datei auswählen');
      return;
    }

    const fileGenerationType = getFileGenerationType();

    if (fileGenerationType === 'project_file' && !selectedProject) {
      setError('Bitte Projekt auswählen');
      return;
    }

    if (fileGenerationType === 'db_table_file' && (selectedTable === null || selectedTable === undefined)) {
      setError('Bitte Tabelle auswählen');
      console.log('DB table validation failed:', { fileGenerationType, selectedTable, type: typeof selectedTable });
      return;
    }

    console.log('Validation passed, proceeding with code fetch:', { fileGenerationType, selectedProject, selectedTable });

    if (!fileGenerationType || ['static_file', 'static_directory'].includes(fileGenerationType)) {
      setError('Diese Datei unterstützt keine Code-Generierung (Static File)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/template-process/${selectedTemplate}`, {
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
          // Generate gtree data for the selected context
          const gtreeData = generateGTreeData();

          const originalCode = targetFile.content; // Use content (with \\u000A) not content_clean

          // 🔍 DEBUG: Show raw content to see if INDENT placeholders exist
          console.log('🔍 Raw targetFile.content:', originalCode.substring(0, 500));
          console.log('🔍 §INDENT2§ found?', originalCode.includes('§INDENT2§'));
          console.log('🔍 §INDENT4§ found?', originalCode.includes('§INDENT4§'));

          // First: Convert JavaScript structure \n to real newlines
          let cleanedCode = originalCode.replace(/\\n/g, '\n');

          // Convert indent placeholders to Unicode spaces BEFORE Unicode conversion
          cleanedCode = cleanedCode.replace(/§INDENT2§/g, '\\u0020\\u0020');
          cleanedCode = cleanedCode.replace(/§INDENT4§/g, '\\u0020\\u0020\\u0020\\u0020');

          // 🔍 DEBUG: Show after INDENT replacement
          console.log('🔍 After INDENT replacement:', cleanedCode.substring(0, 500));

          // Convert Unicode newlines to \n text for template content
          cleanedCode = cleanedCode.replace(/\\u000A/g, '\\n');

          // Convert Unicode tabs to \t text for template content
          cleanedCode = cleanedCode.replace(/\\u0009/g, '\\t');

          // Convert Unicode spaces back to regular spaces for indentation
          cleanedCode = cleanedCode.replace(/\\u0020/g, ' ');

          // Add gtree with proper formatting (keep real newlines for readability)
          const gtreeCode = `// Generated GTree Data for Template Execution\nconst gtree = ${JSON.stringify(gtreeData, null, 2)};\n\n`;
          const codeWithGTree = gtreeCode + cleanedCode;

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
      console.error('Error fetching code:', err);
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

    try {
      // Parse the JavaScript function
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
        setExecutedResult(normalizedResult);
        setActiveTabIndex(1); // Switch to result tab
      } else {
        setExecutedResult('Fehler: Konnte JavaScript-Funktion nicht parsen\n\n' + preparedCode);
      }
    } catch (err) {
      setExecutedResult(`Ausführungsfehler: ${err}\n\nCode:\n${preparedCode}`);
    }
  };

  const getSelectedFileName = () => {
    const file = templateFiles.find(f => f.id === selectedFile);
    return file?.file_name || '';
  };

  // Functions moved up to avoid hoisting issues

  const generateGTreeData = () => {
    const fileType = getFileGenerationType();

    if (fileType === 'project_file' && selectedProject) {
      // Generate project-level gtree
      const project = projects.find(p => p.id === selectedProject);
      return [{
        project: [{
          projectname: project?.name || 'Unknown Project',
          nmaxfiles: 1,
          project_id: selectedProject,
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
  console.log('Templates before map:', templates, 'Type:', typeof templates, 'IsArray:', Array.isArray(templates));
  const templateOptions = Array.isArray(templates) ? templates.map(t => ({
    label: `${t.id}: ${t.name}`,
    value: t.id
  })) : [];

  const fileOptions = Array.isArray(templateFiles) ? templateFiles
    .filter(f => f && f.id !== undefined && f.id !== null) // Filter invalid entries first
    .map(f => {
      const fileName = f.file_name || f.name || f.filename || f.template_file_name || 'Unbenannt';
      const fileType = f.file_type || f.type || f.template_file_type || 'Unbekannt';

      console.log('Creating option for file:', { f, fileName, fileType });

      return {
        label: `${fileName} (${fileType})`,
        value: f.id
      };
    })
    .filter(f => f.label && !f.label.includes('undefined') && f.label !== 'Unbenannt (Unbekannt)') // Remove any remaining undefined labels
    : [];

  console.log('File options created:', fileOptions);

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
  const projectConditionResult = !(shouldShowProjectDropdown() && !selectedProject);
  // FIXED: 0 is a valid table index!
  const tableConditionResult = !shouldShowTableDropdown() || (selectedTable !== null && selectedTable !== undefined);

  const isButtonEnabled = Boolean(
    !loading &&
    selectedTemplate &&
    (selectedFile !== null && selectedFile !== undefined) &&
    projectConditionResult &&
    tableConditionResult
  );

  console.log('Button debug v2:', {
    selectedTemplate,
    selectedFile,
    fileType,
    shouldShowProject: shouldShowProjectDropdown(),
    shouldShowTable: shouldShowTableDropdown(),
    selectedProject,
    selectedTable,
    selectedTableType: typeof selectedTable,
    loading,
    isButtonEnabled,
    projectConditionResult,
    tableConditionResult,
    allConditions: {
      notLoading: !loading,
      hasTemplate: !!selectedTemplate,
      hasFile: !!selectedFile,
      hasFileExplicit: (selectedFile !== null && selectedFile !== undefined),
      projectOk: projectConditionResult,
      tableOk: tableConditionResult,
      finalResult: isButtonEnabled
    }
  });

  console.log('Schema tables loaded:', schemaTables);
  console.log('Table options:', tableOptions);

  return (
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
                  console.log('File dropdown onChange:', e.value);
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
                  value={selectedProject}
                  options={projectOptions}
                  onChange={(e) => setSelectedProject(e.value)}
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
                    console.log('Table dropdown onChange:', e.value, typeof e.value);
                    setSelectedTable(e.value);

                    // Force debug the button state immediately after setting
                    setTimeout(() => {
                      console.log('POST-UPDATE Button debug:', {
                        selectedTable: e.value,
                        loading,
                        selectedTemplate,
                        selectedFile,
                        shouldShowTable: shouldShowTableDropdown(),
                        isTableConditionMet: !(shouldShowTableDropdown() && (e.value === null || e.value === undefined)),
                        finalResult: !loading && selectedTemplate && selectedFile && (!shouldShowTableDropdown() || (e.value !== null && e.value !== undefined))
                      });
                    }, 0);
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
                {shouldShowProjectDropdown() && `Projekt: ${projectOptions.find(p => p.value === selectedProject)?.label || 'Nicht gewählt'}`}
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
                <div className="bg-gray-900 p-4 rounded border border-gray-600 max-h-96 overflow-auto">
                  <pre className="text-sm text-blue-400 whitespace-pre-wrap font-mono">
                    {preparedCode}
                  </pre>
                </div>
              </TabPanel>

              <TabPanel header="2. Ausgeführtes Ergebnis" className="text-gray-100">
                <div className="bg-gray-900 p-4 rounded border border-gray-600 max-h-96 overflow-auto">
                  <pre className="text-sm text-green-400 whitespace-pre-wrap font-mono">
                    {executedResult || 'Klicken Sie auf "Code ausführen" um das Ergebnis zu sehen...'}
                  </pre>
                </div>
              </TabPanel>
            </TabView>
          )}
        </div>
      </Card>
    </div>
  );
}