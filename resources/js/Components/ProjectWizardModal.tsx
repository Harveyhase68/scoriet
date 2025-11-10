import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { PickList } from 'primereact/picklist';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface ProjectWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdProjectId: number) => void;
}

interface Language {
  code: string;
  name: string;
  native_name: string;
  is_active: boolean;
}

interface FloatingSchema {
  id: number;
  name: string;
  description?: string;
  visibility: string;
}

interface Template {
  id: number;
  name: string;
  description?: string;
  visibility: string;
  creator_user_id?: number;
}

export default function ProjectWizardModal({ isOpen, onClose, onSuccess }: ProjectWizardModalProps) {
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t: _t } = useTranslation(currentLanguage);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Project Creation
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [allowJoinRequests, setAllowJoinRequests] = useState(false);
  const [projectNameExists, setProjectNameExists] = useState(false);
  const [checkingProjectName, setCheckingProjectName] = useState(false);

  // Step 2: Project Properties
  const [projectDirectory, setProjectDirectory] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [startPage, setStartPage] = useState('index.php');
  const [defaultLanguage, _setDefaultLanguage] = useState('en');
  const [filenameShortLength, setFilenameShortLength] = useState(2);

  // Step 3: Database Connection
  const [databaseServer, setDatabaseServer] = useState('127.0.0.1');
  const [databasePort, setDatabasePort] = useState('3306');
  const [databaseUsername, setDatabaseUsername] = useState('');
  const [databasePassword, setDatabasePassword] = useState('');
  const [databaseType, setDatabaseType] = useState('MySQL');

  // Step 4: Languages
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);

  // Step 5: Database Selection (existing or new)
  const [databaseOption, setDatabaseOption] = useState<'existing' | 'new'>('new');
  const [existingSchemas, setExistingSchemas] = useState<FloatingSchema[]>([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState<number | null>(null);

  // Step 6: New Database Creation
  const [schemaName, setSchemaName] = useState('');
  const [schemaDescription, setSchemaDescription] = useState('');
  const [schemaVisibility, setSchemaVisibility] = useState<'public' | 'private'>('public');

  // Step 7: SQL Import
  const [sqlScript, setSqlScript] = useState('');
  const [importDescription, setImportDescription] = useState('');
  const [skipSqlImport, setSkipSqlImport] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Step 8: Team (optional)
  const [createTeam, setCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');

  // Step 9: Template Selection
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);
  const [templateFilter, setTemplateFilter] = useState<'all' | 'private' | 'public' | 'system'>('all');

  // Wizard preferences
  const [showWizardOnStart, setShowWizardOnStart] = useState<boolean>(() => {
    const saved = localStorage.getItem('scoriet_show_wizard_on_start');
    return saved !== 'false';
  });

  const totalSteps = 9;

  // Load languages
  const loadLanguages = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/active-languages', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableLanguages(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error loading languages:', err);
    }
  }, []);

  // Load existing schemas
  const loadExistingSchemas = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/schemas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExistingSchemas(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error loading schemas:', err);
    }
  }, []);

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadLanguages();
      loadExistingSchemas();
      loadTemplates();
    }
  }, [isOpen, loadLanguages, loadExistingSchemas, loadTemplates]);

  // Check if project name already exists (with debounce)
  useEffect(() => {
    if (!projectName.trim()) {
      setProjectNameExists(false);
      return;
    }

    // Debounce the check
    const timeoutId = setTimeout(async () => {
      setCheckingProjectName(true);
      try {
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (!token) return;

        const response = await fetch('/api/projects', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // API returns { projects: [...], current_project: ..., total_projects: ... }
          const projects = data.projects || data;
          const exists = Array.isArray(projects) && projects.some((p: any) => p.name.toLowerCase() === projectName.toLowerCase());
          setProjectNameExists(exists);
        }
      } catch (err) {
        console.error('Error checking project name:', err);
      } finally {
        setCheckingProjectName(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [projectName]);

  const handleNext = () => {
    setError(null);

    // Validation for each step
    if (currentStep === 1) {
      if (!projectName.trim()) {
        setError('Project name is required');
        return;
      }
      // Check snake_case format
      if (!/^[a-z0-9]+(_[a-z0-9]+)*$/.test(projectName)) {
        setError('Project name must be in snake_case format (lowercase letters, numbers, underscores)');
        return;
      }
      // Check if name already exists
      if (projectNameExists) {
        setError('Project name already exists. Please choose a different name.');
        return;
      }
    }

    if (currentStep === 5 && databaseOption === 'existing' && !selectedSchemaId) {
      setError('Please select an existing database');
      return;
    }

    if (currentStep === 6 && databaseOption === 'new' && !schemaName.trim()) {
      setError('Schema name is required');
      return;
    }

    if (currentStep === 7 && databaseOption === 'new' && !skipSqlImport && sqlScript.trim()) {
      // Basic SQL validation - check if it contains CREATE TABLE statements
      const sqlUpper = sqlScript.toUpperCase();
      if (!sqlUpper.includes('CREATE TABLE')) {
        setError('SQL script must contain at least one CREATE TABLE statement');
        return;
      }
    }

    if (currentStep === 8 && createTeam && !teamName.trim()) {
      setError('Team name is required');
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSqlScript(content);
      };
      reader.readAsText(file);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Step 1: Create Project
      const projectPayload = {
        name: projectName,
        description: projectDescription,
        is_public: isPublic,
        allow_join_requests: allowJoinRequests,
        project_directory: projectDirectory,
        project_url: projectUrl,
        start_page: startPage,
        default_language: defaultLanguage,
        filename_short_length: filenameShortLength,
        database_server: databaseServer,
        database_port: databasePort,
        database_username: databaseUsername,
        database_password: databasePassword,
        database_type: databaseType,
      };

      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(projectPayload),
      });

      if (!projectResponse.ok) {
        throw new Error('Failed to create project');
      }

      const project = await projectResponse.json();
      const projectId = project.id;

      // Step 2: Update language settings
      await fetch(`/api/projects/${projectId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          enabled_languages: selectedLanguages,
          default_language: defaultLanguage,
        }),
      });

      // Step 3: Handle Database/Schema
      let schemaId = selectedSchemaId;

      if (databaseOption === 'new') {
        // Create new schema
        const schemaResponse = await fetch('/api/schemas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            name: schemaName,
            description: schemaDescription,
            visibility: schemaVisibility,
          }),
        });

        if (!schemaResponse.ok) {
          const errorData = await schemaResponse.json().catch(() => ({}));
          const errorMessage = errorData.message || errorData.error || 'Unknown error';
          console.error('Schema creation failed:', errorData);
          throw new Error(`Failed to create schema: ${errorMessage}`);
        }

        const schema = await schemaResponse.json();
        schemaId = schema.id;

        console.log('✓ Schema created successfully:', schema);
      }

      // Step 4: Associate schema with project (BEFORE SQL import!)
      if (schemaId) {
        const associateResponse = await fetch(`/api/projects/${projectId}/schemas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            schema_id: schemaId,
            association_type: 'linked',
            alias: null,
          }),
        });

        if (!associateResponse.ok) {
          const errorData = await associateResponse.json().catch(() => ({}));
          console.error('Schema association failed:', errorData);
          throw new Error(`Failed to link schema to project: ${errorData.message || errorData.error || 'Unknown error'}`);
        } else {
          console.log('✓ Schema associated with project successfully');
        }
      }

      // Step 5: Create and assign team (optional)
      if (createTeam && teamName.trim()) {
        const teamResponse = await fetch('/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            name: teamName,
            description: teamDescription,
            project_owner_id: projectId,
          }),
        });

        if (teamResponse.ok) {
          const team = await teamResponse.json();

          // Assign team to project
          await fetch(`/api/projects/${projectId}/assign-teams`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              team_ids: [team.id],
            }),
          });
        }
      }

      // Step 6: Assign templates
      for (const templateId of selectedTemplates) {
        await fetch(`/api/projects/${projectId}/link-template`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            template_id: templateId,
          }),
        });
      }

      // Step 7: Import SQL (LAST STEP - after everything else is set up)
      if (databaseOption === 'new' && !skipSqlImport && sqlScript.trim() && schemaId) {
        try {
          const importResponse = await fetch('/api/sql-parse-and-store', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              sql_script: sqlScript,
              schema_id: schemaId,
              description: importDescription || 'Initial import from wizard',
            }),
          });

          if (!importResponse.ok) {
            const errorData = await importResponse.json();
            console.error('SQL Import failed:', errorData);

            // Show warning but don't fail the entire wizard
            alert(`⚠️ Warning: SQL import failed\n\n${errorData.error || 'Unknown error'}\n\nYour project and schema have been created successfully and linked together. You can import your SQL later using the Database Designer.`);
          } else {
            console.log('✓ SQL imported successfully');
          }
        } catch (importError) {
          console.error('SQL Import error:', importError);
          // Continue anyway - project is already set up
          alert('⚠️ Warning: SQL import failed due to an error.\n\nYour project and schema have been created successfully and linked together. You can import your SQL later using the Database Designer.');
        }
      }

      // Success!
      if (onSuccess) {
        onSuccess(projectId);
      }
      handleClose();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete wizard');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Reset all state
      setCurrentStep(1);
      setError(null);
      setProjectName('');
      setProjectDescription('');
      setSqlScript('');
      onClose();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Project Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Name *
              </label>
              <InputText
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="my_awesome_project"
                className={`w-full ${projectNameExists ? 'border-red-500' : ''}`}
              />
              <div className="flex items-center gap-2 mt-1">
                {checkingProjectName && projectName.trim() && (
                  <small className="text-blue-400 flex items-center gap-1">
                    <i className="pi pi-spin pi-spinner"></i>
                    Checking availability...
                  </small>
                )}
                {!checkingProjectName && projectName.trim() && projectNameExists && (
                  <small className="text-red-400 flex items-center gap-1">
                    <i className="pi pi-times-circle"></i>
                    Project name already exists
                  </small>
                )}
                {!checkingProjectName && projectName.trim() && !projectNameExists && /^[a-z0-9]+(_[a-z0-9]+)*$/.test(projectName) && (
                  <small className="text-green-400 flex items-center gap-1">
                    <i className="pi pi-check-circle"></i>
                    Available
                  </small>
                )}
              </div>
              <small className="text-gray-400 block mt-1">Use snake_case format (lowercase, underscores)</small>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <InputTextarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={3}
                placeholder="Project description..."
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Checkbox
                  inputId="is_public"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.checked || false)}
                />
                <label htmlFor="is_public" className="ml-2 text-gray-300">Public Project</label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  inputId="allow_join"
                  checked={allowJoinRequests}
                  onChange={(e) => setAllowJoinRequests(e.checked || false)}
                />
                <label htmlFor="allow_join" className="ml-2 text-gray-300">Allow Join Requests</label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Project Properties</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Directory
              </label>
              <InputText
                value={projectDirectory}
                onChange={(e) => setProjectDirectory(e.target.value)}
                placeholder="C:\Users\Public\Documents\my_project"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project URL
              </label>
              <InputText
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="http://localhost/my_project"
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Page
                </label>
                <InputText
                  value={startPage}
                  onChange={(e) => setStartPage(e.target.value)}
                  placeholder="index.php"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Filename Short Length
                </label>
                <Dropdown
                  value={filenameShortLength}
                  onChange={(e) => setFilenameShortLength(e.value)}
                  options={[
                    { label: '2 characters', value: 2 },
                    { label: '3 characters', value: 3 },
                    { label: '4 characters', value: 4 },
                    { label: '5 characters', value: 5 },
                  ]}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Database Connection</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Database Type
              </label>
              <Dropdown
                value={databaseType}
                onChange={(e) => setDatabaseType(e.value)}
                options={[
                  { label: 'MySQL', value: 'MySQL' },
                  { label: 'PostgreSQL', value: 'PostgreSQL' },
                  { label: 'SQLite', value: 'SQLite' },
                  { label: 'SQL Server', value: 'MSSQL' },
                ]}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Server
                </label>
                <InputText
                  value={databaseServer}
                  onChange={(e) => setDatabaseServer(e.target.value)}
                  placeholder="127.0.0.1"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Port
                </label>
                <InputText
                  value={databasePort}
                  onChange={(e) => setDatabasePort(e.target.value)}
                  placeholder="3306"
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <InputText
                value={databaseUsername}
                onChange={(e) => setDatabaseUsername(e.target.value)}
                placeholder="database_user"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <InputText
                type="password"
                value={databasePassword}
                onChange={(e) => setDatabasePassword(e.target.value)}
                placeholder="••••••••"
                className="w-full"
              />
            </div>
          </div>
        );

      case 4: {
        // Build source and target arrays with proper ordering
        const sourceLanguages = availableLanguages.filter(lang => !selectedLanguages.includes(lang.code));
        const targetLanguages = selectedLanguages
          .map(code => availableLanguages.find(lang => lang.code === code))
          .filter(lang => lang !== undefined) as Language[];

        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Language Selection</h3>
            <p className="text-sm text-gray-400">
              Select the languages you want to use for code generation in this project.
            </p>
            <p className="text-xs text-gray-400">
              Use the arrow buttons to move languages between lists, and the up/down buttons to reorder selected languages.
            </p>
            <PickList
              source={sourceLanguages}
              target={targetLanguages}
              onChange={(e) => {
                // Maintain the order of target languages
                const targetCodes = e.target.map((item: Language) => item.code);
                setSelectedLanguages(targetCodes);
              }}
              itemTemplate={(item: Language) => `${item.native_name} (${item.name})`}
              sourceHeader="Available Languages"
              targetHeader="Selected Languages (ordered)"
              sourceStyle={{ height: '300px' }}
              targetStyle={{ height: '300px' }}
              showSourceControls={false}
              showTargetControls={true}
            />
          </div>
        );
      }

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Database/Schema Selection</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="new_db"
                  checked={databaseOption === 'new'}
                  onChange={() => setDatabaseOption('new')}
                  className="mr-2"
                />
                <label htmlFor="new_db" className="text-gray-300">Create new database</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="existing_db"
                  checked={databaseOption === 'existing'}
                  onChange={() => setDatabaseOption('existing')}
                  className="mr-2"
                />
                <label htmlFor="existing_db" className="text-gray-300">Use existing database</label>
              </div>
            </div>

            {databaseOption === 'existing' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Database
                </label>
                <Dropdown
                  value={selectedSchemaId}
                  onChange={(e) => setSelectedSchemaId(e.value)}
                  options={existingSchemas.map(s => ({ label: s.name, value: s.id }))}
                  placeholder="Select a database..."
                  className="w-full"
                />
              </div>
            )}
          </div>
        );

      case 6:
        if (databaseOption === 'existing') {
          // Skip this step
          setCurrentStep(7);
          return null;
        }
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">New Database Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Database Name *
              </label>
              <InputText
                value={schemaName}
                onChange={(e) => setSchemaName(e.target.value)}
                placeholder="my_database"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <InputTextarea
                value={schemaDescription}
                onChange={(e) => setSchemaDescription(e.target.value)}
                rows={3}
                placeholder="Database description..."
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Visibility
              </label>
              <Dropdown
                value={schemaVisibility}
                onChange={(e) => setSchemaVisibility(e.value)}
                options={[
                  { label: 'Public', value: 'public' },
                  { label: 'Private', value: 'private' },
                ]}
                className="w-full"
              />
            </div>
          </div>
        );

      case 7:
        if (databaseOption === 'existing') {
          // Skip this step
          setCurrentStep(8);
          return null;
        }
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Import SQL (Optional)</h3>
            <p className="text-sm text-gray-400">
              You can import your SQL script now or skip and import later from the Database Designer.
            </p>

            {/* Skip SQL Import Checkbox */}
            <div className="flex items-center p-3 bg-gray-700 rounded">
              <Checkbox
                inputId="skip_sql_import"
                checked={skipSqlImport}
                onChange={(e) => {
                  setSkipSqlImport(e.checked || false);
                  if (e.checked) {
                    setSqlScript('');
                  }
                }}
              />
              <label htmlFor="skip_sql_import" className="ml-2 text-gray-300">
                Skip SQL import (I'll import later)
              </label>
            </div>

            {!skipSqlImport && (
              <>
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload SQL File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".sql,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-2"
                    >
                      <i className="pi pi-upload"></i>
                      <span>Choose SQL File</span>
                    </button>
                    {sqlScript && (
                      <button
                        type="button"
                        onClick={() => {
                          setSqlScript('');
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {sqlScript && (
                    <p className="text-sm text-green-400 mt-2">
                      ✓ SQL loaded ({sqlScript.length} characters)
                    </p>
                  )}
                </div>

                {/* Paste SQL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Or Paste SQL Script
                  </label>
                  <textarea
                    value={sqlScript}
                    onChange={(e) => setSqlScript(e.target.value)}
                    rows={12}
                    placeholder="CREATE TABLE users (...);"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                  />
                  <small className="text-gray-400">
                    The SQL script should contain at least one CREATE TABLE statement
                  </small>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Import Description (optional)
                  </label>
                  <InputText
                    value={importDescription}
                    onChange={(e) => setImportDescription(e.target.value)}
                    placeholder="Initial database structure"
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Team Creation (Optional)</h3>
            <div className="flex items-center">
              <Checkbox
                inputId="create_team"
                checked={createTeam}
                onChange={(e) => setCreateTeam(e.checked || false)}
              />
              <label htmlFor="create_team" className="ml-2 text-gray-300">Create a team for this project</label>
            </div>

            {createTeam && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Team Name *
                  </label>
                  <InputText
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="My Team"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Team Description
                  </label>
                  <InputTextarea
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    rows={3}
                    placeholder="Team description..."
                    className="w-full"
                  />
                </div>
              </>
            )}
            <p className="text-xs text-gray-400">
              You can skip this step and create teams later from the Teams panel.
            </p>
          </div>
        );

      case 9: {
        const filteredTemplates = templates.filter(t => {
          if (templateFilter === 'all') return true;
          if (templateFilter === 'private') return t.visibility === 'private';
          if (templateFilter === 'public') return t.visibility === 'public' && t.creator_user_id !== null;
          if (templateFilter === 'system') return t.visibility === 'public' && t.creator_user_id === null;
          return true;
        });

        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Template Selection (Optional)</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Filter Templates
              </label>
              <Dropdown
                value={templateFilter}
                onChange={(e) => setTemplateFilter(e.value)}
                options={[
                  { label: 'All Templates', value: 'all' },
                  { label: 'Private (My Templates)', value: 'private' },
                  { label: 'Public (User Templates)', value: 'public' },
                  { label: 'System (Scoriet Templates)', value: 'system' },
                ]}
                className="w-full"
              />
            </div>

            <div className="border border-gray-600 rounded p-4 max-h-96 overflow-y-auto">
              {filteredTemplates.length === 0 ? (
                <p className="text-gray-400 text-center">No templates available</p>
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map(template => (
                    <div key={template.id} className="flex items-start gap-3 p-2 hover:bg-gray-700 rounded">
                      <Checkbox
                        inputId={`template_${template.id}`}
                        checked={selectedTemplates.includes(template.id)}
                        onChange={(e) => {
                          if (e.checked) {
                            setSelectedTemplates([...selectedTemplates, template.id]);
                          } else {
                            setSelectedTemplates(selectedTemplates.filter(id => id !== template.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <label htmlFor={`template_${template.id}`} className="text-gray-200 cursor-pointer">
                          {template.name}
                        </label>
                        {template.description && (
                          <p className="text-xs text-gray-400 mt-1">{template.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400">
              Selected templates will be linked to your project. You can add more templates later.
            </p>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <Dialog
      header={`Project Setup Wizard - Step ${currentStep} of ${totalSteps}`}
      visible={isOpen}
      onHide={handleClose}
      style={{ width: '60vw', maxWidth: '900px' }}
      modal
      closable={!loading}
      draggable={false}
      className="project-wizard-modal"
      contentStyle={{
        padding: '1.5rem',
        backgroundColor: '#1f2937',
        color: 'white',
        minHeight: '500px',
      }}
      headerStyle={{
        backgroundColor: '#1f2937',
        color: 'white',
        borderBottom: '1px solid #374151',
      }}
    >
      <div className="flex flex-col h-full">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-400'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-900 border border-red-600 rounded text-red-200">
            <div className="flex items-center">
              <span className="mr-2">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto mb-6">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-600">
          <Button
            label="Back"
            icon="pi pi-arrow-left"
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
            severity="secondary"
          />

          {/* Show wizard on start checkbox */}
          <div className="flex items-center">
            <Checkbox
              inputId="show_wizard_on_start"
              checked={showWizardOnStart}
              onChange={(e) => {
                const newValue = e.checked || false;
                setShowWizardOnStart(newValue);
                localStorage.setItem('scoriet_show_wizard_on_start', newValue ? 'true' : 'false');
              }}
            />
            <label htmlFor="show_wizard_on_start" className="ml-2 text-sm text-gray-300">
              Open this wizard on app start
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              label="Cancel"
              onClick={handleClose}
              disabled={loading}
              severity="secondary"
              outlined
            />
            {currentStep < totalSteps ? (
              <Button
                label="Next"
                icon="pi pi-arrow-right"
                iconPos="right"
                onClick={handleNext}
                disabled={
                  loading ||
                  (currentStep === 1 && (!projectName.trim() || projectNameExists || checkingProjectName))
                }
              />
            ) : (
              <Button
                label="Create Project"
                icon="pi pi-check"
                onClick={handleFinish}
                loading={loading}
                severity="success"
              />
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
