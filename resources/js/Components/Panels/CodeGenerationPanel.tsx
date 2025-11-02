import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface Project {
  id: number;
  name: string;
  description?: string;
}

interface Template {
  id: number;
  name: string;
  description?: string;
  files?: TemplateFile[];
}

interface TemplateFile {
  id: number;
  file_name: string;
  file_type: string;
  file_path: string;
}

interface Schema {
  id: number;
  name: string;
  last_version?: number;
}

interface Language {
  code: string;
  name: string;
}

interface Warning {
  type: 'database' | 'language';
  message: string;
  templates: string[];
}

interface GenerationError {
  file: string;
  template: string;
  table?: string;
  language?: string;
  error: string;
}

export default function CodeGenerationPanel() {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t: _t } = useTranslation(currentLanguage); // Prefixed with _ to indicate intentionally unused

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<number>>(new Set());
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [selectedSchemaIds, setSelectedSchemaIds] = useState<Set<number>>(new Set());
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguageCodes, setSelectedLanguageCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generationErrors, setGenerationErrors] = useState<GenerationError[]>([]);
  const [generationStats, setGenerationStats] = useState<{ errors: number; files: number } | null>(null);

  // Load user projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load project data when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      loadProjectData();
    } else {
      // Reset when no project selected
      setTemplates([]);
      setSelectedTemplateIds(new Set());
      setSchemas([]);
      setSelectedSchemaIds(new Set());
      setLanguages([]);
      setSelectedLanguageCodes(new Set());
      setWarnings([]);
    }
  }, [selectedProjectId]);

  // Check warnings when selections change
  useEffect(() => {
    if (selectedProjectId && templates.length > 0) {
      checkWarnings();
    }
  }, [selectedTemplateIds, selectedSchemaIds, selectedLanguageCodes, templates]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/user/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load projects');
      }

      const data = await response.json();
      console.log('Projects API response:', data); // Debug log

      let projectsArray = data.data || data.projects || data;

      // Ensure it's an array
      if (!Array.isArray(projectsArray)) {
        projectsArray = [];
      }

      // Remove duplicates based on ID and filter out invalid projects
      const seenIds = new Set();
      const uniqueProjects = projectsArray.filter((project: Project) => {
        // Skip projects without valid ID
        if (!project.id || typeof project.id !== 'number') {
          console.warn('Skipping project without valid ID:', project);
          return false;
        }

        // Skip duplicates
        if (seenIds.has(project.id)) {
          console.warn('Skipping duplicate project:', project);
          return false;
        }

        seenIds.add(project.id);
        return true;
      });

      console.log('Unique projects:', uniqueProjects); // Debug log
      console.log('Project IDs:', uniqueProjects.map(p => ({ id: p.id, name: p.name }))); // Debug IDs
      setProjects(uniqueProjects);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectData = async () => {
    if (!selectedProjectId) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // First, load the project details to get enabled_languages
      const projectRes = await fetch(`/api/projects/${selectedProjectId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      });

      if (!projectRes.ok) {
        throw new Error('Failed to load project details');
      }

      const projectData = await projectRes.json();
      const project = projectData.data || projectData;

      // Load templates via template-usages, schemas, and languages in parallel
      const [templatesRes, schemasRes, allLanguagesRes] = await Promise.all([
        fetch(`/api/projects/${selectedProjectId}/template-usages`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        }),
        fetch(`/api/projects/${selectedProjectId}/schemas`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        }),
        fetch('/api/active-languages', {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        }),
      ]);

      if (!templatesRes.ok || !schemasRes.ok || !allLanguagesRes.ok) {
        throw new Error('Failed to load project data');
      }

      const [templatesData, schemasData, allLanguagesData] = await Promise.all([
        templatesRes.json(),
        schemasRes.json(),
        allLanguagesRes.json(),
      ]);

      console.log('Templates API response:', templatesData); // Debug log

      // Extract templates from usages array
      let templatesArray: Template[] = [];
      if (templatesData.usages && Array.isArray(templatesData.usages)) {
        // Each usage has a template property
        templatesArray = templatesData.usages.map((usage: any) => usage.template).filter(Boolean);
      }
      console.log('Templates array:', templatesArray); // Debug log
      const templatesWithFiles = await Promise.all(
        (Array.isArray(templatesArray) ? templatesArray : []).map(async (template: Template) => {
          try {
            const filesRes = await fetch(`/api/templates/${template.id}/files`, {
              headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
            });
            if (filesRes.ok) {
              const filesData = await filesRes.json();
              const filesArray = filesData.data || filesData;
              return { ...template, files: Array.isArray(filesArray) ? filesArray : [] };
            }
          } catch {
            // If files can't be loaded, continue without them
          }
          return template;
        })
      );

      const schemasArray = schemasData.data || schemasData;

      // Filter languages to only show project-enabled languages
      const allLanguagesArray = allLanguagesData.data || allLanguagesData;
      const enabledLanguageCodes = Array.isArray(project.enabled_languages)
        ? project.enabled_languages
        : (typeof project.enabled_languages === 'string'
          ? JSON.parse(project.enabled_languages)
          : []);

      const projectLanguages = (Array.isArray(allLanguagesArray) ? allLanguagesArray : [])
        .filter((lang: Language) => enabledLanguageCodes.includes(lang.code));

      setTemplates(Array.isArray(templatesWithFiles) ? templatesWithFiles : []);
      setSchemas(Array.isArray(schemasArray) ? schemasArray : []);
      setLanguages(projectLanguages);

      // Select all by default
      setSelectedTemplateIds(new Set(templatesWithFiles.map((t: Template) => t.id)));
      setSelectedSchemaIds(new Set((Array.isArray(schemasArray) ? schemasArray : []).map((s: Schema) => s.id)));
      setSelectedLanguageCodes(new Set(projectLanguages.map((l: Language) => l.code)));

    } catch (err: any) {
      setError(err.message || 'Failed to load project data');
      setTemplates([]);
      setSchemas([]);
      setLanguages([]);
      setSelectedTemplateIds(new Set());
      setSelectedSchemaIds(new Set());
      setSelectedLanguageCodes(new Set());
    } finally {
      setLoading(false);
    }
  };

  const checkWarnings = useCallback(() => {
    const newWarnings: Warning[] = [];
    const selectedTemplates = templates.filter(t => selectedTemplateIds.has(t.id));

    // Check for database warnings
    if (selectedSchemaIds.size === 0) {
      const templatesNeedingDB = selectedTemplates.filter(template =>
        template.files?.some(file =>
          file.file_type === 'db_table_file' || file.file_type === 'db_table_file_languages'
        )
      );

      if (templatesNeedingDB.length > 0) {
        newWarnings.push({
          type: 'database',
          message: 'Some templates contain DB Table files but no database is selected. These files will not be generated.',
          templates: templatesNeedingDB.map(t => t.name),
        });
      }
    }

    // Check for language warnings
    if (selectedLanguageCodes.size === 0) {
      const templatesNeedingLang = selectedTemplates.filter(template =>
        template.files?.some(file =>
          file.file_type === 'project_file_languages' || file.file_type === 'db_table_file_languages'
        )
      );

      if (templatesNeedingLang.length > 0) {
        newWarnings.push({
          type: 'language',
          message: 'Some templates contain Language files but no language is selected. These files will not be generated.',
          templates: templatesNeedingLang.map(t => t.name),
        });
      }
    }

    setWarnings(newWarnings);
  }, [templates, selectedTemplateIds, selectedSchemaIds, selectedLanguageCodes]);

  const toggleTemplate = (id: number) => {
    setSelectedTemplateIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAllTemplates = () => {
    if (selectedTemplateIds.size === templates.length) {
      setSelectedTemplateIds(new Set());
    } else {
      setSelectedTemplateIds(new Set(templates.map(t => t.id)));
    }
  };

  const toggleSchema = (id: number) => {
    setSelectedSchemaIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAllSchemas = () => {
    if (selectedSchemaIds.size === schemas.length) {
      setSelectedSchemaIds(new Set());
    } else {
      setSelectedSchemaIds(new Set(schemas.map(s => s.id)));
    }
  };

  const toggleLanguage = (code: string) => {
    setSelectedLanguageCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(code)) {
        newSet.delete(code);
      } else {
        newSet.add(code);
      }
      return newSet;
    });
  };

  const toggleAllLanguages = () => {
    if (selectedLanguageCodes.size === languages.length) {
      setSelectedLanguageCodes(new Set());
    } else {
      setSelectedLanguageCodes(new Set(languages.map(l => l.code)));
    }
  };

  const canGenerate = (): boolean => {
    return selectedProjectId !== null && selectedTemplateIds.size > 0;
  };

  const handleGenerateProject = async () => {
    if (!canGenerate()) {
      setError('Please select at least one template');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('🚀 Starting full project generation:', {
        projectId: selectedProjectId,
        templateIds: Array.from(selectedTemplateIds),
        schemaIds: Array.from(selectedSchemaIds),
        languageCodes: Array.from(selectedLanguageCodes),
      });

      // Call backend API to generate full project
      const response = await fetch(`/api/projects/${selectedProjectId}/generate-full-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/zip, application/json',
        },
        body: JSON.stringify({
          template_ids: Array.from(selectedTemplateIds),
          schema_ids: Array.from(selectedSchemaIds),
          language_codes: Array.from(selectedLanguageCodes),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate project');
      }

      // 🔍 Extract error information from headers
      const errorCount = parseInt(response.headers.get('X-Generation-Errors') || '0');
      const fileCount = parseInt(response.headers.get('X-Generation-Files') || '0');
      const errorDetailsEncoded = response.headers.get('X-Generation-Error-Details');
      const moreErrors = parseInt(response.headers.get('X-Generation-Error-More') || '0');

      // Parse error details
      let errors: GenerationError[] = [];
      if (errorDetailsEncoded) {
        try {
          const decoded = atob(errorDetailsEncoded);
          errors = JSON.parse(decoded);
        } catch (e) {
          console.error('Failed to parse error details:', e);
        }
      }

      // Update state with generation results
      setGenerationStats({ errors: errorCount, files: fileCount });
      setGenerationErrors(errors);

      // Get the ZIP file as a blob
      const blob = await response.blob();

      // Extract filename from Content-Disposition header or create default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'generated_project.zip';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Project generated and downloaded successfully', {
        files: fileCount,
        errors: errorCount,
        moreErrors: moreErrors,
      });

    } catch (err: any) {
      console.error('❌ Generation failed:', err);
      setError(err.message || 'Failed to generate project');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="h-full bg-gray-800 text-gray-100 p-4 overflow-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
          <h2 className="text-2xl font-bold text-white mb-6">Code Generation</h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900 border border-red-600 rounded text-red-200">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Project Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              Select Project *
            </label>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value ? parseInt(e.target.value) : null)}
              disabled={loading}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a project...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {loading && (
            <div className="text-center py-8 text-gray-400">
              Loading project data...
            </div>
          )}

          {selectedProjectId && !loading && (
            <>
              {/* Templates Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-white">
                    Templates * (at least 1 required)
                  </label>
                  <button
                    onClick={toggleAllTemplates}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {selectedTemplateIds.size === templates.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {templates.length === 0 ? (
                    <div className="text-gray-400 text-sm">No templates available</div>
                  ) : (
                    <div className="space-y-2">
                      {templates.map(template => (
                        <label
                          key={template.id}
                          className="flex items-start space-x-2 cursor-pointer hover:bg-gray-700 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTemplateIds.has(template.id)}
                            onChange={() => toggleTemplate(template.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="text-white">{template.name}</div>
                            {template.description && (
                              <div className="text-xs text-gray-400">{template.description}</div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {selectedTemplateIds.size} of {templates.length} selected
                </div>
              </div>

              {/* Schemas/Databases Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-white">
                    Databases (optional)
                  </label>
                  <button
                    onClick={toggleAllSchemas}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {selectedSchemaIds.size === schemas.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {schemas.length === 0 ? (
                    <div className="text-gray-400 text-sm">No databases available</div>
                  ) : (
                    <div className="space-y-2">
                      {schemas.map(schema => (
                        <label
                          key={schema.id}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-700 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSchemaIds.has(schema.id)}
                            onChange={() => toggleSchema(schema.id)}
                          />
                          <span className="text-white">{schema.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {selectedSchemaIds.size} of {schemas.length} selected
                </div>
              </div>

              {/* Languages Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-white">
                    Languages (optional)
                  </label>
                  <button
                    onClick={toggleAllLanguages}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {selectedLanguageCodes.size === languages.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {languages.length === 0 ? (
                    <div className="text-gray-400 text-sm">No languages available</div>
                  ) : (
                    <div className="space-y-2">
                      {languages.map(language => (
                        <label
                          key={language.code}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-700 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedLanguageCodes.has(language.code)}
                            onChange={() => toggleLanguage(language.code)}
                          />
                          <span className="text-white">{language.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {selectedLanguageCodes.size} of {languages.length} selected
                </div>
              </div>

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="mb-6 space-y-3">
                  {warnings.map((warning, index) => (
                    <div key={index} className="p-3 bg-yellow-900 bg-opacity-50 border border-yellow-600 rounded text-yellow-200">
                      <div className="flex items-start space-x-2">
                        <span className="text-xl">⚠️</span>
                        <div className="flex-1">
                          <div className="font-medium mb-1">{warning.message}</div>
                          <div className="text-xs">
                            Affected templates: {warning.templates.join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Generation Errors - Scrollable List */}
              {generationStats && generationStats.errors > 0 && (
                <div className="mb-6 p-4 bg-red-900 bg-opacity-30 border border-red-600 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-2xl">🚨</span>
                    <div>
                      <div className="font-bold text-red-300">
                        Syntax Errors Found During Generation
                      </div>
                      <div className="text-sm text-red-400">
                        {generationStats.errors} error{generationStats.errors !== 1 ? 's' : ''} | {generationStats.files} file{generationStats.files !== 1 ? 's' : ''} generated successfully
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Error List */}
                  <div className="max-h-96 overflow-y-auto bg-gray-900 bg-opacity-50 rounded p-3 space-y-2">
                    {generationErrors.map((err, index) => (
                      <div key={index} className="p-3 bg-gray-800 border border-red-800 rounded text-sm">
                        <div className="flex items-start space-x-2">
                          <span className="text-red-500 font-bold">#{index + 1}</span>
                          <div className="flex-1 space-y-1">
                            <div className="font-medium text-red-300">{err.file}</div>
                            <div className="text-xs text-gray-400">
                              Template: <span className="text-gray-300">{err.template}</span>
                              {err.table && <> | Table: <span className="text-gray-300">{err.table}</span></>}
                              {err.language && <> | Language: <span className="text-gray-300">{err.language}</span></>}
                            </div>
                            <div className="text-red-400 mt-1">{err.error}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {generationStats.errors > generationErrors.length && (
                      <div className="p-3 bg-gray-800 border border-yellow-800 rounded text-sm text-yellow-400">
                        ⚠️ {generationStats.errors - generationErrors.length} more error(s) - see ERRORS.txt in the ZIP file
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-xs text-red-400">
                    💡 Tip: All errors are also saved in <strong>ERRORS.txt</strong> inside the ZIP file
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleGenerateProject}
                  disabled={!canGenerate() || generating}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    canGenerate() && !generating
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {generating ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⚙️</span>
                      Generating...
                    </>
                  ) : (
                    '🚀 Generate Project & Download'
                  )}
                </button>
              </div>

              {/* Validation Message */}
              {selectedTemplateIds.size === 0 && (
                <div className="mt-2 text-xs text-red-400 text-right">
                  Please select at least one template
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
