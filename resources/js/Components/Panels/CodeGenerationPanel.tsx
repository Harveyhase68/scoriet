import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import JSZip from 'jszip';

interface Project {
  id: number;
  name: string;
  description?: string;
  archive_format?: 'zip' | 'tar.gz' | 'tar.xz';
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

interface FileConflict {
  filePath: string;
  templates: Array<{
    id: number;
    name: string;
  }>;
  type: 'inter-template' | 'intra-template'; // 🆕 Distinguish conflict types
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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
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
  const [archiveWarning, setArchiveWarning] = useState<string | null>(null);
  const [fileConflicts, setFileConflicts] = useState<FileConflict[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  // 📋 Deployment Log States
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [deploymentTaskId, setDeploymentTaskId] = useState<number | null>(null);
  const [deploymentPolling, setDeploymentPolling] = useState(false);
  const deploymentLogEndRef = useRef<HTMLDivElement>(null);
  const deploymentPollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 🎯 Progress tracking
  const [generationProgress, setGenerationProgress] = useState<{
    current: number;
    total: number;
    percentage: number;
    eta: string;
    currentTask: string;
  } | null>(null);

  // Auto-scroll deployment log to bottom
  useEffect(() => {
    if (deploymentLogEndRef.current) {
      deploymentLogEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [deploymentLogs]);

  // Cleanup deployment polling interval on unmount
  useEffect(() => {
    return () => {
      if (deploymentPollIntervalRef.current) {
        clearInterval(deploymentPollIntervalRef.current);
        deploymentPollIntervalRef.current = null;
      }
    };
  }, []);

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

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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
          return false;
        }

        // Skip duplicates
        if (seenIds.has(project.id)) {
          return false;
        }

        seenIds.add(project.id);
        return true;
      });

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

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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

      // Extract templates from usages array
      let templatesArray: Template[] = [];
      if (templatesData.usages && Array.isArray(templatesData.usages)) {
        // Each usage has a template property
        templatesArray = templatesData.usages.map((usage: any) => usage.template).filter(Boolean);
      }
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

      setSelectedProject(project); // 🎯 Store selected project (includes archive_format)
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

  // 🆕 Check for file conflicts between AND within templates
  const checkFileConflicts = async (): Promise<FileConflict[]> => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (!token) return [];

    const conflicts: FileConflict[] = [];

    // Map for inter-template conflicts: filePath → template IDs
    const interTemplateFileMap = new Map<string, Set<number>>();

    // Fetch all template files for selected templates
    for (const templateId of Array.from(selectedTemplateIds)) {
      try {
        const response = await fetch(`/api/templates/${templateId}/files`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) continue;

        const filesData = await response.json();
        const templateFiles = filesData.data || filesData || [];

        // Only check project_file and static_file (not db_table_file or language variants)
        const projectFiles = templateFiles.filter((f: any) =>
          f.file_type === 'project_file' ||
          f.file_type === 'static_file' ||
          f.file_type === 'static_directory'
        );

        // 🆕 CHECK 1: Intra-template conflicts (duplicate files WITHIN same template)
        const intraTemplateFileMap = new Map<string, number>();
        for (const file of projectFiles) {
          const outputPath = file.output_path || '/';
          const fileName = file.file_name;
          const fullPath = outputPath.endsWith('/')
            ? `${outputPath}${fileName}`
            : `${outputPath}/${fileName}`;

          if (intraTemplateFileMap.has(fullPath)) {
            // Duplicate found in same template!
            const template = templates.find(t => t.id === templateId);
            conflicts.push({
              filePath: fullPath,
              templates: [{
                id: templateId,
                name: template?.name || `Template ${templateId}`
              }],
              type: 'intra-template'
            });
          } else {
            intraTemplateFileMap.set(fullPath, 1);
          }

          // Also track for inter-template check
          if (!interTemplateFileMap.has(fullPath)) {
            interTemplateFileMap.set(fullPath, new Set());
          }
          interTemplateFileMap.get(fullPath)!.add(templateId);
        }
      } catch (err) {
        console.error(`Failed to fetch files for template ${templateId}:`, err);
      }
    }

    // 🆕 CHECK 2: Inter-template conflicts (files generated by MULTIPLE templates)
    interTemplateFileMap.forEach((templateIds, filePath) => {
      if (templateIds.size > 1) {
        const conflictingTemplates = Array.from(templateIds).map(id => {
          const template = templates.find(t => t.id === id);
          return {
            id,
            name: template?.name || `Template ${id}`
          };
        });

        conflicts.push({
          filePath,
          templates: conflictingTemplates,
          type: 'inter-template'
        });
      }
    });

    return conflicts;
  };

  const handleGenerateProject = async () => {
    if (!canGenerate()) {
      setError('Please select at least one template');
      return;
    }

    // 🆕 STEP 0: Check for file conflicts BEFORE starting generation
    const conflicts = await checkFileConflicts();
    if (conflicts.length > 0) {
      setFileConflicts(conflicts);
      setShowConflictDialog(true);
      return; // Stop here, wait for user decision
    }

    // No conflicts, proceed with generation
    await executeGeneration();
  };

  /**
   * Core generation logic that creates the ZIP blob
   * This is shared between "Generate & Download" and "Generate & Deploy"
   *
   * @param onZipReady - Callback that receives the generated ZIP blob
   * @param forceZip - Always generate ZIP regardless of project archive_format (needed for deployment)
   */
  const performGeneration = async (
    onZipReady: (zipBlob: Blob, zip: JSZip) => Promise<void>,
    forceZip: boolean = false
  ) => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication required');
    }

      // Starting hybrid browser-based project generation

      // ==========================================================================
      // STEP 1: Fetch schema data (gtree) ONCE to get tables list
      // ==========================================================================
      setGenerationProgress({
        current: 0,
        total: 100,
        percentage: 5,
        eta: 'Berechne...',
        currentTask: 'Lade Datenbank-Schema...'
      });

      const gtreeDataPromises = Array.from(selectedSchemaIds).map(async (schemaId) => {
        const response = await fetch(`/api/schemas/${schemaId}/gtree`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to load schema ${schemaId}: ${errorText}`);
        }
        return response.json();
      });

      const gtreeDataArray = await Promise.all(gtreeDataPromises);

      // Extract all tables from all schemas
      const allTables: any[] = [];
      gtreeDataArray.forEach(gtreeResponse => {
        const tables = gtreeResponse.gtree?.[0]?.project?.[0]?.tables || [];
        allTables.push(...tables);
      });

      // 🚀 PERFORMANCE OPTIMIZATION: Store the base gtree that we'll clone and modify
      const baseGtree = gtreeDataArray.length > 0 ? gtreeDataArray[0].gtree : [];

      // 🎯 Calculate total operations for accurate progress
      const selectedLangs = Array.from(selectedLanguageCodes);
      let totalOperations = 0;
      let completedOperations = 0;

      // Count operations per template (TABLES, for intuitive progress: 137/137!)
      for (const templateId of Array.from(selectedTemplateIds)) {
        const template = templates.find(t => t.id === templateId);
        if (!template) continue;

        const templateFiles = template.files || [];
        const projectFiles = templateFiles.filter(f =>
          f.file_type === 'project_file' || f.file_type === 'static_file' || f.file_type === 'static_directory'
        );
        const projectLangFiles = templateFiles.filter(f => f.file_type === 'project_file_languages');
        const tableFiles = templateFiles.filter(f => f.file_type === 'db_table_file');
        const tableLangFiles = templateFiles.filter(f => f.file_type === 'db_table_file_languages');

        // 🎯 Count TABLES (much more intuitive: 137/137 instead of 47/47!)
        if (projectFiles.length > 0) totalOperations += 1; // 1 update for project files
        if (projectLangFiles.length > 0 && selectedLangs.length > 0) totalOperations += 1; // 1 update for lang files

        // Count individual tables (user sees "Table 5/137" - much better UX!)
        if (tableFiles.length > 0 && allTables.length > 0) {
          totalOperations += allTables.length; // 1 update per table
        }
        if (tableLangFiles.length > 0 && allTables.length > 0 && selectedLangs.length > 0) {
          totalOperations += allTables.length; // 1 update per table
        }
      }

      // 🎯 Track operation timestamps for accurate ETA (using MEDIAN to eliminate outliers)
      const operationTimestamps: number[] = [];
      const generationStartTime = Date.now(); // Track start time for debug logging
      const MAX_SAMPLES = 15; // Use last 15 operations for stable ETA calculation
      // 🎯 Fixed warmup: Skip first operation only (ETA appears at operation 2)
      const WARMUP_OPERATIONS = 1;
      // 🎯 Pessimism factor: Based on logs: Median 22s is accurate, only 1.3x needed for batches slowing down
      const ETA_PESSIMISM_FACTOR = 1.3;

      // Helper function to update progress (increments counter)
      const updateProgress = async (taskDescription: string) => {
        completedOperations++;
        const now = Date.now();
        operationTimestamps.push(now);

        const percentage = Math.min(95, Math.floor((completedOperations / totalOperations) * 100));

        // Calculate ETA based on recent operations (not all operations)
        let etaText = 'Berechne...';
        let medianTimePerOp = 0;
        let cappedTimePerOp = 0;

        // ✅ WARMUP: Skip first N operations (they're slower due to setup)
        if (operationTimestamps.length > WARMUP_OPERATIONS) {
          // Use ONLY recent operations (after warmup) for ETA calculation
          const relevantTimestamps = operationTimestamps.slice(WARMUP_OPERATIONS); // Skip warmup
          const recentTimestamps = relevantTimestamps.slice(-MAX_SAMPLES); // Take last N

          if (recentTimestamps.length >= 2) {
            // Calculate time differences between operations
            const timeDiffs: number[] = [];
            for (let i = 1; i < recentTimestamps.length; i++) {
              timeDiffs.push(recentTimestamps[i] - recentTimestamps[i - 1]);
            }

            // 🎯 Use MEDIAN instead of average (eliminates outliers!)
            timeDiffs.sort((a, b) => a - b);
            const medianIndex = Math.floor(timeDiffs.length / 2);
            medianTimePerOp = timeDiffs.length % 2 === 0
              ? (timeDiffs[medianIndex - 1] + timeDiffs[medianIndex]) / 2
              : timeDiffs[medianIndex];

            // Cap the time per operation (sanity check - allow up to 30s for large batches)
            cappedTimePerOp = Math.min(medianTimePerOp, 30000); // Max 30 seconds per operation

            const remainingOps = totalOperations - completedOperations;
            // 🎯 Apply pessimism factor (batches get slower over time)
            const etaMs = remainingOps * cappedTimePerOp * ETA_PESSIMISM_FACTOR;

            const etaMinutes = Math.floor(etaMs / 60000);
            const etaSeconds = Math.floor((etaMs % 60000) / 1000);

            if (etaMinutes > 0) {
              etaText = `~${etaMinutes}min ${etaSeconds}s verbleibend`;
            } else if (etaSeconds > 5) {
              etaText = `~${etaSeconds}s verbleibend`;
            } else {
              etaText = 'Fast fertig...';
            }
          }
        }

        setGenerationProgress({
          current: completedOperations,
          total: totalOperations,
          percentage,
          eta: etaText,
          currentTask: taskDescription
        });

        // 🎯 DEBUG: Console output for ETA calibration
        const elapsedSeconds = Math.floor((now - generationStartTime) / 1000);
        const elapsedMinutes = Math.floor(elapsedSeconds / 60);
        const elapsedSecondsRemainder = elapsedSeconds % 60;
        const elapsedFormatted = `${elapsedMinutes}:${elapsedSecondsRemainder.toString().padStart(2, '0')}`;

        console.log(`[Progress] ${percentage}% | Op ${completedOperations}/${totalOperations} | Elapsed: ${elapsedFormatted} | ETA: ${etaText} | Median/Op: ${Math.round(medianTimePerOp/1000)}s | Capped/Op: ${Math.round(cappedTimePerOp/1000)}s | Factor: ${ETA_PESSIMISM_FACTOR}x`);

        // 🎯 Allow React to re-render the progress bar
        await new Promise(resolve => setTimeout(resolve, 0));
      };

      // 🆕 Helper function to update ONLY the message (without incrementing counter)
      // Used for intermediate progress updates (e.g., "Processing table 5/137")
      const _updateProgressMessage = (taskDescription: string) => {
        // Keep existing counter and percentage, only update the message
        const percentage = Math.min(95, Math.floor((completedOperations / totalOperations) * 100));

        // Recalculate ETA with current data
        let etaText = 'Berechne...';
        const _now = Date.now();

        if (operationTimestamps.length > WARMUP_OPERATIONS) {
          const relevantTimestamps = operationTimestamps.slice(WARMUP_OPERATIONS);
          const recentTimestamps = relevantTimestamps.slice(-MAX_SAMPLES);

          if (recentTimestamps.length >= 2) {
            const timeDiffs: number[] = [];
            for (let i = 1; i < recentTimestamps.length; i++) {
              timeDiffs.push(recentTimestamps[i] - recentTimestamps[i - 1]);
            }

            timeDiffs.sort((a, b) => a - b);
            const medianIndex = Math.floor(timeDiffs.length / 2);
            const medianTimePerOp = timeDiffs.length % 2 === 0
              ? (timeDiffs[medianIndex - 1] + timeDiffs[medianIndex]) / 2
              : timeDiffs[medianIndex];

            const cappedTimePerOp = Math.min(medianTimePerOp, 30000);
            const remainingOps = totalOperations - completedOperations;
            const etaMs = remainingOps * cappedTimePerOp * ETA_PESSIMISM_FACTOR;

            const etaMinutes = Math.floor(etaMs / 60000);
            const etaSeconds = Math.floor((etaMs % 60000) / 1000);

            if (etaMinutes > 0) {
              etaText = `~${etaMinutes}min ${etaSeconds}s verbleibend`;
            } else if (etaSeconds > 5) {
              etaText = `~${etaSeconds}s verbleibend`;
            } else {
              etaText = 'Fast fertig...';
            }
          }
        }

        setGenerationProgress({
          current: completedOperations,
          total: totalOperations,
          percentage,
          eta: etaText,
          currentTask: taskDescription
        });
      };

      // ==========================================================================
      // STEP 2: Generate code using OPTIMIZED HYBRID approach
      // - Fetch compiled templates ONCE per template (no table/language params)
      // - Clone gtree in browser and modify selectedlanguage/selectedtable
      // - Execute compiled JavaScript with modified gtree
      // ==========================================================================
      const zip = new JSZip();
      const errors: GenerationError[] = [];
      let fileCount = 0;

      // Track which files have been added to prevent duplicates
      const addedFiles = new Set<string>();

      // For each template
      for (const templateId of Array.from(selectedTemplateIds)) {
        const template = templates.find(t => t.id === templateId);
        if (!template) continue;

        // Fetch template files to determine what API calls we need
        let templateFiles: any[] = [];
        try {
          const filesResponse = await fetch(`/api/templates/${templateId}/files`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (filesResponse.ok) {
            const filesData = await filesResponse.json();
            templateFiles = filesData.data || filesData || [];
          }
        } catch {
          continue;
        }

        // Group files by type to determine API calls needed
        const projectFiles = templateFiles.filter(f =>
          f.file_type === 'project_file' ||
          f.file_type === 'static_file' ||
          f.file_type === 'static_directory' // 🎯 Include ZIP static directories
        );
        const projectLangFiles = templateFiles.filter(f => f.file_type === 'project_file_languages');
        const tableFiles = templateFiles.filter(f => f.file_type === 'db_table_file');
        const tableLangFiles = templateFiles.filter(f => f.file_type === 'db_table_file_languages');

        // 🚀 OPTIMIZED: Cache compiled templates AND gtree per table
        // API calls: once per table (not per table×language)
        // Cache key: templateId + tableName (or "project" for project files)
        const compiledCache = new Map<string, { compiled: any[], gtree: any }>();

        // Helper to fetch and cache compiled templates with their gtree
        const fetchCompiledTemplates = async (tableName: string | null, langCode: string | null): Promise<{ compiled: any[], gtree: any }> => {
          const cacheKey = `${templateId}_${tableName || 'project'}`;

          if (compiledCache.has(cacheKey)) {
            return compiledCache.get(cacheKey)!;
          }

          try {
            const url = new URL(`/api/ultimate-template/${templateId}`, window.location.origin);
            url.searchParams.set('project_id', selectedProjectId!.toString());

            if (tableName) {
              url.searchParams.set('table_name', tableName);
            }

            // ✅ OPTIMIZATION: Only pass language on first call (for compilation)
            // We'll modify selectedlanguage in browser for other languages
            if (langCode) {
              url.searchParams.set('language_code', langCode);
            }

            const response = await fetch(url.toString(), {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
              }
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`API returned ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            // Check for syntax errors from backend
            if (data.validation?.has_syntax_errors) {
              const syntaxErrors = data.validation.syntax_errors || [];
              syntaxErrors.forEach((e: any) => {
                errors.push({
                  file: e.file,
                  template: template.name,
                  table: tableName || undefined,
                  error: e.error
                });
              });
              return { compiled: [], gtree: null };
            }

            const compiled = data.processed_files || [];
            const gtree = data.gtree || baseGtree; // Use gtree from API response!

            const result = { compiled, gtree };
            compiledCache.set(cacheKey, result);
            return result;

          } catch (error: any) {
            errors.push({
              file: 'Template compilation',
              template: template.name,
              table: tableName || undefined,
              error: error.message || 'Unknown error'
            });
            return { compiled: [], gtree: null };
          }
        };

        // 🚀 NEW: Batch fetch for multiple tables in a single request
        const fetchCompiledTemplatesBatch = async (
          tables: string[],
          langCode: string | null,
          includeGtree: boolean = false,
          sharedGtreeRef: { current: any } = { current: null }
        ): Promise<void> => {
          try {
            // Don't call updateProgress here - progress is tracked per table in processing loops!

            const response = await fetch(`/api/ultimate-template/${templateId}/batch`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                tables: tables,
                project_id: selectedProjectId!,
                language_code: langCode,
                compile: true,
                include_source: false,
                include_gtree: includeGtree, // 🚀 OPTIMIZATION: Only fetch gtree once!
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Batch API returned ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            if (!data.success) {
              throw new Error(data.error || 'Batch request failed');
            }

            // Store all results in cache
            const results = data.results || {};

            // 🚀 OPTIMIZATION: Use cached gtree if not sent (saves 6 GB network traffic!)
            const sharedGtree = data.gtree || sharedGtreeRef.current || baseGtree;

            // Save gtree to cache if this is the first batch
            if (data.gtree && !sharedGtreeRef.current) {
              sharedGtreeRef.current = data.gtree;
            }

            for (const [_tableKey, tableResult] of Object.entries(results)) {
              const typedResult = tableResult as any;

              if (typedResult.error) {
                errors.push({
                  file: 'Batch compilation',
                  template: template.name,
                  table: typedResult.table_name,
                  error: typedResult.error
                });
                continue;
              }

              const cacheKey = `${templateId}_${typedResult.table_name || 'project'}`;
              compiledCache.set(cacheKey, {
                compiled: typedResult.compiled_templates || [],
                gtree: sharedGtree, // Use shared gtree for all tables
              });
            }

            // Log performance
            const perf = data.performance;
            if (perf) {
              console.log(`⚡ [BATCH] ${perf.tables_count} tables in ${perf.execution_time_ms}ms (avg: ${perf.avg_time_per_table_ms}ms/table)`);
            }

          } catch (error: any) {
            errors.push({
              file: 'Batch Template compilation',
              template: template.name,
              error: error.message || 'Unknown batch error'
            });
          }
        };

        // Helper function to execute compiled template with modified gtree
        const executeCompiledTemplate = (
          compiledFile: any,
          tableName: string | null,
          langCode: string | null,
          sourceGtree: any  // 🎯 NEW: Pass the gtree from the API response
        ) => {
          try {
            const fileName = compiledFile.filename || compiledFile.original_template || 'unknown.php';
            const compiledJS = compiledFile.compiled_content;

            if (!compiledJS || !sourceGtree) {
              return;
            }

            // 🚀 CLONE GTREE and modify ONLY language settings (tableIdx already compiled by backend)
            // Use structuredClone (2-3x faster than JSON.parse/stringify), fallback to JSON for old browsers
            const clonedGtree = typeof structuredClone !== 'undefined'
              ? structuredClone(sourceGtree)
              : JSON.parse(JSON.stringify(sourceGtree));

            // Set selectedlanguage and selectedlanguageindex
            if (langCode && clonedGtree[0]?.project?.[0]) {
              const languages = clonedGtree[0].project[0].lang || [];
              const langIndex = languages.findIndex((l: any) => l.code === langCode);

              if (langIndex >= 0) {
                clonedGtree[0].project[0].selectedlanguage = langCode;
                clonedGtree[0].project[0].selectedlanguageindex = langIndex;
              }
            }

            // Execute compiled JavaScript IN BROWSER with cloned gtree
            let generatedCode = '';
            try {
              // ✅ SET CLONED GTREE AS GLOBAL VARIABLE (tableIdx already in compiled function)
              (window as any).gtree = clonedGtree;

              // Execute the compiled function
              const globalEval = eval;
              globalEval(compiledJS);

              // The function name is provided by the API
              const functionName = compiledFile.function_name || 'generate_' + fileName.replace(/[^a-zA-Z0-9]/g, '_');
              const generatedFunction = (window as any)[functionName];

              if (!generatedFunction) {
                throw new Error(`Function ${functionName} not found after eval`);
              }

              // Execute function (gtree is available as global variable)
              generatedCode = generatedFunction() || '';

              // ✅ FIX DOUBLE-ESCAPED UNICODE SEQUENCES
              generatedCode = generatedCode
                .replace(/\\\\u0009/g, '\t')   // \\u0009 → Tab
                .replace(/\\\\u000A/g, '\n')   // \\u000A → Line Feed
                .replace(/\\\\u000D/g, '\r');  // \\u000D → Carriage Return

              // Clean up global scope
              delete (window as any)[functionName];
              delete (window as any).gtree;

            } catch (execError: any) {
              // Clean up on error
              delete (window as any).gtree;
              throw new Error(`JavaScript execution failed: ${execError.message}`);
            }

            // Build file path for ZIP - USE OUTPUT_PATH FROM TEMPLATE!
            const generationType = compiledFile.generation_type || 'project_file';
            let outputPath = compiledFile.output_path || '/';

            // ✅ REPLACE PLACEHOLDERS in output_path
            // %1 = table name, %2 = language code
            outputPath = outputPath
              .replace(/%1/g, tableName || '')
              .replace(/%2/g, langCode || '');

            // Start with output_path from template (remove leading /)
            let folderPath = outputPath.replace(/^\/+/, '');

            // Add language folder if needed (ONLY if not already in output_path)
            if ((generationType === 'project_file_languages' || generationType === 'db_table_file_languages')
                && langCode
                && !outputPath.includes(langCode)) {
              folderPath = folderPath ? `${langCode}/${folderPath}` : langCode;
            }

            // Add table folder if needed (ONLY if not already in output_path)
            if ((generationType === 'db_table_file' || generationType === 'db_table_file_languages')
                && tableName
                && !outputPath.includes(tableName)) {
              folderPath = folderPath ? `${folderPath}/${tableName}` : tableName;
            }

            // Remove trailing slashes and clean up double slashes
            folderPath = folderPath.replace(/\/+$/, '').replace(/\/+/g, '/');

            // Build full path
            const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;

            // ✅ CHECK FOR DUPLICATES - Skip if already added
            if (addedFiles.has(fullPath)) {
              return;
            }

            // Add to ZIP
            zip.file(fullPath, generatedCode);
            addedFiles.add(fullPath);
            fileCount++;

          } catch (fileError: any) {
            // Log error for this specific file
            errors.push({
              file: compiledFile.filename || compiledFile.original_template || 'unknown',
              template: template.name,
              table: tableName || undefined,
              language: langCode || undefined,
              error: fileError.message || 'Unknown error'
            });
          }
        };

        // 🎯 0. Process ZIP static directories FIRST
        const zipFiles = projectFiles.filter(f => f.content_type === 'zip');

        for (const zipFile of zipFiles) {
          try {
            // Decode Base64 ZIP content
            const base64Content = zipFile.file_content;
            const binaryString = atob(base64Content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            // Load ZIP with JSZip
            const staticZip = await JSZip.loadAsync(bytes);

            // Extract all files from the ZIP
            const outputPath = (zipFile.output_path || '/').replace(/^\/+/, '').replace(/\/+$/, '');

            await Promise.all(Object.keys(staticZip.files).map(async (filename) => {
              const zipEntry = staticZip.files[filename];

              // Skip directories
              if (zipEntry.dir) return;

              // Get file content
              const content = await zipEntry.async('blob');

              // Build full path: output_path + filename from ZIP
              const fullPath = outputPath ? `${outputPath}/${filename}` : filename;

              // Check for duplicates
              if (addedFiles.has(fullPath)) {
                return;
              }

              // Add to final ZIP
              zip.file(fullPath, content);
              addedFiles.add(fullPath);
              fileCount++;
            }));

          } catch (error: any) {
            errors.push({
              file: zipFile.file_name || zipFile.zip_filename || 'Unknown ZIP',
              error: `ZIP extraction failed: ${error.message}`,
              template: template.name
            });
          }
        }

        // 🚀 Step B: Execute compiled templates with caching
        // - Project files: Fetch once, execute once
        // - Project language files: Fetch once, execute per language
        // - Table files: Fetch per table, execute per table
        // - Table language files: Fetch per table (first lang), execute per table×language

        // 1. Process project_file and static_file (fetch once, execute once)
        const nonZipProjectFiles = projectFiles.filter(f => f.content_type !== 'zip');
        if (nonZipProjectFiles.length > 0) {
          await updateProgress(`[${template.name}] Generiere Projekt-Dateien...`);
          const { compiled, gtree } = await fetchCompiledTemplates(null, null);
          const projectFileTemplates = compiled.filter(t =>
            t.generation_type === 'project_file' || t.generation_type === 'static_file'
          );
          for (const compiledFile of projectFileTemplates) {
            executeCompiledTemplate(compiledFile, null, null, gtree);
          }
        }

        // 2. Process project_file_languages (fetch once with first lang, execute per language)
        if (projectLangFiles.length > 0 && selectedLangs.length > 0) {
          await updateProgress(`[${template.name}] Generiere Sprach-Dateien...`);
          const firstLang = selectedLangs[0];
          const { compiled, gtree } = await fetchCompiledTemplates(null, firstLang);
          const projectLangTemplates = compiled.filter(t =>
            t.generation_type === 'project_file_languages'
          );

          for (const lang of selectedLangs) {
            for (const compiledFile of projectLangTemplates) {
              executeCompiledTemplate(compiledFile, null, lang, gtree);
            }
          }
        }

        // 3. Process db_table_file (🚀 BATCH API: fetch tables in optimized batches)
        if (tableFiles.length > 0 && allTables.length > 0) {
          const BATCH_SIZE = 2; // Memory-safe: PHP worker persistence causes memory accumulation
          const tableNames = allTables.map(t => t.filename || t.tablename);

          // 🚀 OPTIMIZATION: Fetch gtree ONLY ONCE (instead of 60+ times, saves ~6 GB network traffic!)
          const gtreeCache = { current: null };

          // Fetch in batches to avoid timeout (progress updated per table, not per batch!)
          for (let i = 0; i < tableNames.length; i += BATCH_SIZE) {
            const batchTableNames = tableNames.slice(i, i + BATCH_SIZE);
            const _batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const _totalBatches = Math.ceil(tableNames.length / BATCH_SIZE);
            const isFirstBatch = (i === 0);

            // Don't call updateProgress here - we update per table in processing loop below!
            await fetchCompiledTemplatesBatch(batchTableNames, null, isFirstBatch, gtreeCache);
          }

          // Now process all tables from cache (already loaded!)
          let processedCount = 0;
          for (const table of allTables) {
            const tableName = table.filename || table.tablename;
            const cacheKey = `${templateId}_${tableName}`;
            const cached = compiledCache.get(cacheKey);

            if (cached) {
              const { compiled, gtree } = cached;
              const tableFileTemplates = compiled.filter(t =>
                t.generation_type === 'db_table_file'
              );

              for (const compiledFile of tableFileTemplates) {
                executeCompiledTemplate(compiledFile, tableName, null, gtree);
              }
            }

            processedCount++;
            // 🎯 Update progress for EVERY table (not just every 5)
            await updateProgress(`[${template.name}] Tabelle ${processedCount}/${allTables.length}: ${tableName}`);
          }
        }

        // 4. Process db_table_file_languages (🚀 BATCH API: fetch tables in optimized batches)
        if (tableLangFiles.length > 0 && allTables.length > 0 && selectedLangs.length > 0) {
          const firstLang = selectedLangs[0];
          const BATCH_SIZE = 2; // Memory-safe: PHP worker persistence causes memory accumulation
          const tableNames = allTables.map(t => t.filename || t.tablename);

          // 🚀 OPTIMIZATION: Fetch gtree ONLY ONCE (instead of 60+ times, saves ~6 GB network traffic!)
          const gtreeCache = { current: null };

          // Fetch in batches to avoid timeout (progress updated per table, not per batch!)
          for (let i = 0; i < tableNames.length; i += BATCH_SIZE) {
            const batchTableNames = tableNames.slice(i, i + BATCH_SIZE);
            const _batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const _totalBatches = Math.ceil(tableNames.length / BATCH_SIZE);
            const isFirstBatch = (i === 0);

            // Don't call updateProgress here - we update per table in processing loop below!
            await fetchCompiledTemplatesBatch(batchTableNames, firstLang, isFirstBatch, gtreeCache);
          }

          // Now process all tables from cache (already loaded!)
          let processedCount = 0;
          for (const table of allTables) {
            const tableName = table.filename || table.tablename;
            const cacheKey = `${templateId}_${tableName}`;
            const cached = compiledCache.get(cacheKey);

            if (cached) {
              const { compiled, gtree } = cached;
              const tableLangTemplates = compiled.filter(t =>
                t.generation_type === 'db_table_file_languages'
              );

              // Execute for all languages (gtree language modified in browser)
              for (const lang of selectedLangs) {
                for (const compiledFile of tableLangTemplates) {
                  executeCompiledTemplate(compiledFile, tableName, lang, gtree);
                }
              }
            }

            processedCount++;
            // 🎯 Update progress for EVERY table (not just every 5)
            await updateProgress(`[${template.name}] Multi-Lang ${processedCount}/${allTables.length}: ${tableName}`);
          }
        }
      }

      // ==========================================================================
      // STEP 4: Add ERRORS.txt if there are errors
      // ==========================================================================
      if (errors.length > 0) {
        let errorsContent = '='.repeat(80) + '\n';
        errorsContent += 'GENERATION ERRORS REPORT\n';
        errorsContent += '='.repeat(80) + '\n\n';
        errorsContent += `Total Errors: ${errors.length}\n`;
        errorsContent += `Total Files Generated: ${fileCount}\n`;
        errorsContent += `Generated: ${new Date().toISOString()}\n\n`;
        errorsContent += '='.repeat(80) + '\n\n';

        errors.forEach((err, index) => {
          errorsContent += `ERROR #${index + 1}\n`;
          errorsContent += `Template: ${err.template}\n`;
          errorsContent += `File: ${err.file}\n`;
          if (err.table) errorsContent += `Table: ${err.table}\n`;
          if (err.language) errorsContent += `Language: ${err.language}\n`;
          errorsContent += `Error: ${err.error}\n`;
          errorsContent += '-'.repeat(80) + '\n\n';
        });

        zip.file('ERRORS.txt', errorsContent);
      }

      // ==========================================================================
      // STEP 5: Generate and download archive (browser-based for large projects)
      // ==========================================================================
      // Use ZIP format if forced (for deployment) or if project format is ZIP
      const archiveFormat = forceZip ? 'zip' : (selectedProject?.archive_format || 'zip');

      // 🚀 OPTIMIZATION: For ZIP format, generate directly in browser
      // This avoids sending large payloads to backend (which can fail with "Content Too Large")
      if (archiveFormat === 'zip') {
        // Final progress: Creating ZIP
        setGenerationProgress({
          current: totalOperations,
          total: totalOperations,
          percentage: 98,
          eta: 'Fast fertig...',
          currentTask: 'Erstelle ZIP-Archiv...'
        });

        // Generate ZIP blob directly in browser
        const zipBlob = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 }
        });

        // 100% - Ready!
        setGenerationProgress({
          current: totalOperations,
          total: totalOperations,
          percentage: 100,
          eta: 'Fertig!',
          currentTask: 'Verarbeite ZIP...'
        });

        setArchiveWarning(null);

        // Call the callback with the generated ZIP (callback handles download/upload)
        await onZipReady(zipBlob, zip);

        return; // Stop here, callback handles everything
      } else {
        // For tar.gz/tar.xz, we need backend support
        // Extract all files from JSZip as {path, content (base64)}
        const filesForBackend: Array<{ path: string; content: string }> = [];

        for (const [path, zipEntry] of Object.entries(zip.files)) {
          if (!zipEntry.dir) {
            // Get file content as base64
            const content = await zipEntry.async('base64');
            filesForBackend.push({ path, content });
          }
        }

        // Send to backend for archive creation
        const archiveResponse = await fetch('/api/archives/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            format: archiveFormat,
            files: filesForBackend,
          }),
        });

        if (!archiveResponse.ok) {
          throw new Error(`Archive creation failed: ${archiveResponse.statusText}`);
        }

        // Check for fallback warning in headers
        const warningHeader = archiveResponse.headers.get('X-Archive-Warning');
        //const actualFormat = archiveResponse.headers.get('X-Archive-Actual-Format') || archiveFormat;

        if (warningHeader) {
          try {
            const warningMessage = atob(warningHeader);
            setArchiveWarning(warningMessage);
          } catch {
            setArchiveWarning('Archive format fallback occurred. Archive created as ZIP.');
          }
        } else {
          setArchiveWarning(null);
        }

        // Get the archive blob
        const archiveBlob = await archiveResponse.blob();

        // Call the callback with the archive blob (callback handles download/upload)
        await onZipReady(archiveBlob, zip);

        return; // Stop here, callback handles everything
      }

      // Update state
      setGenerationStats({ errors: errors.length, files: fileCount });
      setGenerationErrors(errors);
  };

  // 🆕 Separated generation logic so it can be called after conflict confirmation
  const executeGeneration = async () => {
    try {
      console.log('[DOWNLOAD] Starting executeGeneration');
      setGenerating(true);
      setError(null);
      setShowConflictDialog(false);
      setGenerationProgress(null);

      // Perform generation with download callback
      await performGeneration(async (zipBlob) => {
        console.log('[DOWNLOAD] Download callback called, zipBlob size:', zipBlob.size);
        // Download the ZIP
        const url = window.URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `generated_project_${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log('[DOWNLOAD] Download triggered');
      });

    } catch (err: any) {
      setError(err.message || 'Failed to generate project');
    } finally {
      setGenerating(false);
      setTimeout(() => {
        setGenerationProgress(null);
      }, 2000);
    }
  };

  /**
   * Generate project in browser, upload to server, and send download task to scoriet-svc
   * This reuses the browser-based generation logic to ensure correct output
   */
  const handleGenerateAndDeploy = async () => {
    if (!canGenerate()) {
      setError('Please select at least one template');
      return;
    }

    // Check for conflicts first
    const conflicts = await checkFileConflicts();
    if (conflicts.length > 0) {
      setFileConflicts(conflicts);
      setShowConflictDialog(true);
      return;
    }

    // Execute the same generation as executeGeneration(), but upload instead of download
    await executeGenerationForDeploy();
  };

  /**
   * Poll deployment task status and update live log
   */
  const startDeploymentPolling = (taskId: number, token: string) => {
    // Clear any existing polling interval
    if (deploymentPollIntervalRef.current) {
      clearInterval(deploymentPollIntervalRef.current);
      deploymentPollIntervalRef.current = null;
    }

    let pollCount = 0;
    const maxPolls = 300; // 10 minutes max (300 * 2 seconds)

    const pollInterval = setInterval(async () => {
      pollCount++;

      try {
        const response = await fetch(`/cli/svc/tasks/${taskId}`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch task status');
        }

        const taskData = result.task;

        // Update logs from backend (live streaming from service)
        if (taskData.logs) {
          const backendLogs = taskData.logs.split('\n').filter((line: string) => line.trim() !== '');

          // Append backend logs to existing frontend logs
          setDeploymentLogs(prev => {
            // Find where frontend logs end (last frontend log is "⏳ Waiting for scoriet-svc...")
            const frontendLogsEndIndex = prev.findIndex(log => log.includes('⏳ Waiting for scoriet-svc'));

            if (frontendLogsEndIndex >= 0) {
              // Keep frontend logs up to and including the "waiting" message
              const frontendLogs = prev.slice(0, frontendLogsEndIndex + 1);

              // Add separator and backend logs
              return [...frontendLogs, '', '📡 Service logs:', '', ...backendLogs];
            } else {
              // Fallback: just append backend logs
              return [...prev, '', '📡 Service logs:', '', ...backendLogs];
            }
          });
        }

        // Stop polling when task is finished
        if (taskData.status === 'completed') {
          setDeploymentPolling(false);
          if (deploymentPollIntervalRef.current) {
            clearInterval(deploymentPollIntervalRef.current);
            deploymentPollIntervalRef.current = null;
          }
        } else if (taskData.status === 'failed') {
          const errorMsg = taskData.error_message || 'Unknown error occurred';
          setDeploymentLogs(prev => [...prev, '', `❌ Deployment failed: ${errorMsg}`]);
          setDeploymentPolling(false);
          if (deploymentPollIntervalRef.current) {
            clearInterval(deploymentPollIntervalRef.current);
            deploymentPollIntervalRef.current = null;
          }
        }

        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          setDeploymentLogs(prev => [...prev, '', '⏰ Polling timeout - please check service status manually']);
          setDeploymentPolling(false);
          if (deploymentPollIntervalRef.current) {
            clearInterval(deploymentPollIntervalRef.current);
            deploymentPollIntervalRef.current = null;
          }
        }
      } catch (err: any) {
        console.error('Polling error:', err);
      }
    }, 2000); // Poll every 2 seconds

    deploymentPollIntervalRef.current = pollInterval;
  };

  /**
   * Execute generation for deployment (generates in browser, uploads to server)
   * Reuses performGeneration() with upload callback instead of download
   */
  const executeGenerationForDeploy = async () => {
    try {
      console.log('[DEPLOY] Starting executeGenerationForDeploy');
      setGenerating(true);
      setError(null);
      setShowConflictDialog(false);
      setGenerationProgress(null);
      setDeploymentLogs([]); // Clear previous logs
      setDeploymentTaskId(null);
      setDeploymentPolling(false);

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const projectName = selectedProject?.name || 'project';

      // Add initial log entry
      setDeploymentLogs(['🚀 Starting deployment...', `📦 Project: ${projectName}`, '']);

      console.log('[DEPLOY] Calling performGeneration with upload callback');
      // Perform generation with upload callback (force ZIP format for deployment)
      await performGeneration(async (zipBlob) => {
        console.log('[DEPLOY] Upload callback called, zipBlob size:', zipBlob.size);

        // Add log: Generation complete
        setDeploymentLogs(prev => [...prev, '✅ Code generation completed', `📊 Archive size: ${(zipBlob.size / 1024).toFixed(2)} KB`, '']);

        // Upload ZIP to server
        setGenerationProgress({
          current: 0,
          total: 100,
          percentage: 95,
          eta: 'Fast fertig...',
          currentTask: 'Lade Archiv zum Server hoch...'
        });

        setDeploymentLogs(prev => [...prev, '📤 Uploading archive to server...']);

        const formData = new FormData();
        formData.append('project_id', selectedProjectId!.toString());
        formData.append('archive', zipBlob, `${projectName}.zip`);

        const uploadResponse = await fetch('/api/generated-projects/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Failed to upload archive: ${errorText}`);
        }

        const uploadResult = await uploadResponse.json();
        const downloadUrl = uploadResult.download_url;

        setDeploymentLogs(prev => [...prev, '✅ Upload successful', `🔗 Download URL: ${downloadUrl}`, '']);

        // Create download task for scoriet-svc
        setGenerationProgress({
          current: 0,
          total: 100,
          percentage: 98,
          eta: 'Fast fertig...',
          currentTask: 'Erstelle Download-Task für scoriet-svc...'
        });

        setDeploymentLogs(prev => [...prev, '📋 Creating deployment task for scoriet-svc...']);

        const taskPayload = {
          project_id: selectedProjectId,
          archive_url: downloadUrl,
          target_path: `C:\\deployed_projects\\${projectName}`,
          install_type: 'initial',
        };

        const taskResponse = await fetch('/cli/svc/tasks/project-download', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(taskPayload)
        });

        if (!taskResponse.ok) {
          const errorText = await taskResponse.text();
          throw new Error(`Failed to create download task: ${errorText}`);
        }

        const taskResult = await taskResponse.json();
        const taskId = taskResult.task?.id || taskResult.task_id;

        setDeploymentTaskId(taskId);
        setDeploymentLogs(prev => [...prev, `✅ Task created: #${taskId}`, `📂 Target: C:\\deployed_projects\\${projectName}`, '', '⏳ Waiting for scoriet-svc to pick up task...']);

        // Start polling for task status
        setDeploymentPolling(true);
        startDeploymentPolling(taskId, token);

        setGenerationProgress({
          current: 100,
          total: 100,
          percentage: 100,
          eta: 'Fertig!',
          currentTask: `✅ Task ${taskId} an scoriet-svc gesendet!`
        });
      }, true); // forceZip = true for deployment

      // Show success for 5 seconds
      setTimeout(() => {
        setGenerationProgress(null);
      }, 5000);

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create deployment task';
      setError(errorMessage);

      // Add error to deployment log
      setDeploymentLogs(prev => [...prev, '', `❌ Deployment failed: ${errorMessage}`, '', '💡 You can try deploying again.']);
      setDeploymentPolling(false);
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

          {/* Archive Format Fallback Warning */}
          {archiveWarning && (
            <div className="mb-4 p-3 bg-yellow-900 bg-opacity-50 border border-yellow-600 rounded">
              <div className="flex items-start space-x-2">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">
                  <div className="font-medium text-yellow-200 mb-1">Archive Format Warning</div>
                  <div className="text-sm text-yellow-300">{archiveWarning}</div>
                </div>
              </div>
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

              {/* Generate Buttons */}
              <div className="flex justify-end gap-3">
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
                    '🚀 Generate & Download'
                  )}
                </button>

                <button
                  onClick={handleGenerateAndDeploy}
                  disabled={!canGenerate() || generating}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    canGenerate() && !generating
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {generating ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⚙️</span>
                      Deploying...
                    </>
                  ) : (
                    '📦 Generate & Deploy'
                  )}
                </button>
              </div>

              {/* 🎯 Progress Bar */}
              {generationProgress && (
                <div className="mt-6 bg-gray-800 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-white">
                      {generationProgress.currentTask}
                    </div>
                    <div className="text-sm text-gray-400">
                      {generationProgress.percentage}%
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-700 rounded-full h-4 mb-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-300 ease-out flex items-center justify-end px-2"
                      style={{ width: `${generationProgress.percentage}%` }}
                    >
                      {generationProgress.percentage > 10 && (
                        <span className="text-xs font-bold text-white drop-shadow">
                          {generationProgress.percentage}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ETA and progress info */}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div>
                      {generationProgress.current} / {generationProgress.total} Operationen
                    </div>
                    <div className="font-medium text-blue-400">
                      {generationProgress.eta}
                    </div>
                  </div>
                </div>
              )}

              {/* 📋 Deployment Log */}
              {deploymentLogs.length > 0 && (
                <div className="mt-6 bg-gray-900 border border-gray-600 rounded-lg overflow-hidden">
                  <div className="bg-gray-800 px-4 py-3 border-b border-gray-600 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">📋 Deployment Log</h3>
                      {deploymentPolling && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-900 text-blue-200 rounded text-xs">
                          <span className="inline-block animate-spin">🔄</span>
                          Monitoring...
                        </span>
                      )}
                      {deploymentTaskId && (
                        <span className="text-xs text-gray-400">Task #{deploymentTaskId}</span>
                      )}
                    </div>
                    <button
                      onClick={() => setDeploymentLogs([])}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="p-4 font-mono text-xs max-h-96 overflow-y-auto bg-black">
                    {deploymentLogs.map((log, index) => (
                      <div
                        key={index}
                        className={`${
                          log.startsWith('✅') ? 'text-green-400' :
                          log.startsWith('❌') ? 'text-red-400' :
                          log.startsWith('⚠️') || log.startsWith('💡') ? 'text-yellow-400' :
                          log.startsWith('📦') || log.startsWith('🚀') || log.startsWith('📋') ? 'text-blue-400' :
                          'text-gray-300'
                        }`}
                      >
                        {log || '\u00A0'}
                      </div>
                    ))}
                    <div ref={deploymentLogEndRef} />
                  </div>
                </div>
              )}

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

      {/* 🆕 File Conflict Warning Dialog */}
      {showConflictDialog && fileConflicts.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-2xl p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">⚠️</div>
              <div>
                <h2 className="text-2xl font-bold text-yellow-400">ACHTUNG: Datei-Konflikte erkannt!</h2>
                <p className="text-gray-300 text-sm mt-1">
                  Die folgenden Dateien werden von mehreren Templates generiert und überschreiben sich gegenseitig:
                </p>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 mb-6 max-h-96 overflow-y-auto">
              {fileConflicts.map((conflict, index) => (
                <div key={index} className="mb-4 pb-4 border-b border-gray-700 last:border-0">
                  <div className="flex items-start gap-2">
                    <span className="text-red-400 font-bold text-lg">❌</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-mono text-yellow-300 font-semibold">
                          {conflict.filePath}
                        </div>
                        {conflict.type === 'intra-template' && (
                          <span className="text-xs bg-red-900 text-red-200 px-2 py-1 rounded">
                            DUPLIKAT IM TEMPLATE
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 ml-4">
                        {conflict.type === 'intra-template' ? (
                          <>
                            <strong className="text-red-300">⚠️ Achtung:</strong> Diese Datei existiert <strong>mehrfach im gleichen Template</strong>:
                            <ul className="mt-1 space-y-1">
                              <li className="flex items-center gap-2">
                                <span className="text-red-400">•</span>
                                <span className="text-gray-200">{conflict.templates[0].name}</span>
                                <span className="text-red-300 text-xs">(enthält {conflict.filePath} mehrfach)</span>
                              </li>
                            </ul>
                          </>
                        ) : (
                          <>
                            Wird generiert von <strong>mehreren Templates</strong>:
                            <ul className="mt-1 space-y-1">
                              {conflict.templates.map((template, tIdx) => (
                                <li key={tIdx} className="flex items-center gap-2">
                                  <span className="text-blue-400">•</span>
                                  <span className="text-gray-200">{template.name}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 text-xl">💡</span>
                <div className="text-sm text-blue-200">
                  <strong>Hinweis:</strong> Wenn Sie fortfahren, wird die <strong>zuletzt generierte</strong> Datei die vorherigen überschreiben.
                  Dies kann zu unerwartetem Verhalten führen.
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConflictDialog(false);
                  setFileConflicts([]);
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  executeGeneration();
                }}
                className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <span>⚠️</span>
                Trotzdem generieren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
