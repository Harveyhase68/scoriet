// resources/js/Components/Panels/CodeAdjustmentsPanel.tsx
// Code Anpassungen - Manage custom code insertions for generated files
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { TabPanel } from 'primereact/tabview';
import TabViewSideMenu from '@/Components/TabViewSideMenu';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { InputSwitch } from 'primereact/inputswitch';
import { Tag } from 'primereact/tag';
import { useProject } from '@/contexts/ProjectContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SupportedLanguage, getStoredLanguage} from '@/i18n';
import { apiClient } from '@/lib/api';

// ========== INTERFACES ==========

interface CodeAdjustment {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  file_pattern: string;
  min_confidence: number;
  is_active: boolean;
  execution_order: number;
  created_by_user_id: number;
  insertions: CodeAdjustmentInsertion[];
  created_at: string;
  updated_at: string;
}

interface CodeAdjustmentInsertion {
  id: number;
  code_adjustment_id: number;
  insertion_type: 'beginning' | 'end' | 'middle';
  anchor_text: string;
  insertion_content: string;
  line_offset: number;
  insertion_order: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface AnalysisInsertion {
  insertion_type: 'beginning' | 'end' | 'middle';
  anchor_text: string;
  insertion_content: string;
  line_offset: number;
  line_count: number;
  description?: string;
}

interface AnalysisResult {
  insertions: AnalysisInsertion[];
  confidence: number;
  analysis: {
    template_lines: number;
    modified_lines: number;
    common_lines: number;
    added_lines: number;
    removed_lines: number;
  };
}

interface NewAdjustmentFromAnalysis {
  name: string;
  description: string;
  file_pattern: string;
  min_confidence: number;
  insertions: AnalysisInsertion[];
}

// ========== COMPONENT ==========

const CodeAdjustmentsPanel: React.FC = () => {
  const toast = useRef<Toast>(null);
  const templateFileInputRef = useRef<HTMLInputElement>(null);
  const modifiedFileInputRef = useRef<HTMLInputElement>(null);
  const { selectedProject } = useProject();
  const { colors } = useTheme();
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  // Code Adjustments Access State (Premium Feature)
  const [codeAdjustmentsAccess, setCodeAdjustmentsAccess] = useState<{
    has_access: boolean;
    access_type?: string;
    unlock_cost?: number;
    days_remaining?: number;
    expires_at?: string;
    is_patron?: boolean;
  } | null>(null);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [unlocking, setUnlocking] = useState(false);

  // State
  const [loading, setLoading] = useState(false);
  const [adjustments, setAdjustments] = useState<CodeAdjustment[]>([]);
  const [selectedAdjustment, setSelectedAdjustment] = useState<CodeAdjustment | null>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Dialog states
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [showInsertionDialog, setShowInsertionDialog] = useState(false);
  const [editingAdjustment, setEditingAdjustment] = useState<Partial<CodeAdjustment>>({});
  const [editingInsertion, setEditingInsertion] = useState<Partial<CodeAdjustmentInsertion>>({});

  // Reverse Engineering states
  const [templateContent, setTemplateContent] = useState('');
  const [modifiedContent, setModifiedContent] = useState('');
  const [analysisFilename, setAnalysisFilename] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Editable analysis insertions (user can modify before creating)
  const [editableInsertions, setEditableInsertions] = useState<AnalysisInsertion[]>([]);
  const [showCreateFromAnalysisDialog, setShowCreateFromAnalysisDialog] = useState(false);
  const [showAnalysisInsertionDialog, setShowAnalysisInsertionDialog] = useState(false);
  const [editingAnalysisInsertionIndex, setEditingAnalysisInsertionIndex] = useState<number | null>(null);
  const [editingAnalysisInsertion, setEditingAnalysisInsertion] = useState<AnalysisInsertion | null>(null);
  const [newAdjustmentData, setNewAdjustmentData] = useState<NewAdjustmentFromAnalysis>({
    name: '',
    description: '',
    file_pattern: '',
    min_confidence: 0.8,
    insertions: [],
  });

  // Available variables for insertions
  const [availableVariables, setAvailableVariables] = useState<Record<string, string>>({});

  // Project generations states
  const [generations, setGenerations] = useState<Array<{
    id: number;
    generation_number: number;
    filename: string;
    file_size_human: string;
    tables: string[];
    languages: string[];
    created_at: string;
    file_exists: boolean;
  }>>([]);
  const [selectedGenerationId, setSelectedGenerationId] = useState<number | null>(null);
  const [generationFiles, setGenerationFiles] = useState<Array<{ path: string; size: number }>>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [loadingGenerations, setLoadingGenerations] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [fetchingFile, setFetchingFile] = useState(false);

  // Directory comparison states
  const [directorySource, setDirectorySource] = useState<'upload' | 'service' | 'git'>('upload');
  const [uploadedArchive, setUploadedArchive] = useState<File | null>(null);
  const [selectedGenerationForCompare, setSelectedGenerationForCompare] = useState<number | null>(null);
  const [comparingDirectory, setComparingDirectory] = useState(false);

  // Git comparison states
  const [gitProviders, setGitProviders] = useState<Array<{ provider: string; username: string }>>([]);
  const [selectedGitProvider, setSelectedGitProvider] = useState<string | null>(null);
  const [gitRepositories, setGitRepositories] = useState<Array<{ full_name: string; name: string }>>([]);
  const [selectedRepository, setSelectedRepository] = useState<string | null>(null);
  const [gitBranches, setGitBranches] = useState<Array<{ name: string }>>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [gitDirectory, setGitDirectory] = useState<string>('');
  const [loadingGitProviders, setLoadingGitProviders] = useState(false);
  const [loadingRepositories, setLoadingRepositories] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [directoryCompareResult, setDirectoryCompareResult] = useState<{
    files: Array<{
      path: string;
      status: 'added' | 'modified' | 'deleted' | 'unchanged';
      template_content?: string;
      modified_content?: string;
    }>;
    summary: {
      added: number;
      modified: number;
      deleted: number;
      unchanged: number;
    };
  } | null>(null);
  const [selectedCompareFile, setSelectedCompareFile] = useState<string | null>(null);
  const directoryFileInputRef = useRef<HTMLInputElement>(null);

  // Batch adjustment creation states
  const [creatingBatchAdjustments, setCreatingBatchAdjustments] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentFile: string } | null>(null);

  // Export/Import states
  const [exporting, setExporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // ========== API CALLS ==========

  // Load Code Adjustments access status
  const loadCodeAdjustmentsAccess = useCallback(async () => {
    setLoadingAccess(true);
    try {
      const data = await apiClient.get('/subscriptions/code-adjustments/status');
      setCodeAdjustmentsAccess(data);
    } catch (error) {
      console.error(t.codeadjustmentspanel228, error);
    } finally {
      setLoadingAccess(false);
    }
  }, []);

  // Unlock Code Adjustments with credits
  const unlockCodeAdjustments = async () => {
    setUnlocking(true);
    try {
      const data = await apiClient.post('/subscriptions/unlock-code-adjustments');
      setCodeAdjustmentsAccess(data.access_status);
      toast.current?.show({
        severity: 'success',
        summary: t.codeadjustmentspanel248,
        detail: data.message || t.codeadjustmentspanel249,
      });
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message;
      if (errorMsg) {
        toast.current?.show({
          severity: 'error',
          summary: t.messageError,
          detail: errorMsg,
        });
      } else {
        console.error(t.codeadjustmentspanel260, err);
        toast.current?.show({
          severity: 'error',
          summary: t.messageError,
          detail: t.codeadjustmentspanel264,
        });
      }
    } finally {
      setUnlocking(false);
    }
  };

  const loadAdjustments = useCallback(async () => {
    if (!selectedProject?.id) return;

    setLoading(true);
    try {
      const data = await apiClient.get(`/projects/${selectedProject.id}/code-adjustments`);

      if (data.success) {
        setAdjustments(data.data);
      } else {
        toast.current?.show({
          severity: 'error',
          summary: t.codeadjustmentspanel286,
          detail: data.message || t.codeadjustmentspanel287,
        });
      }
    } catch (error) {
      console.error('Load adjustments error:', error);
      toast.current?.show({
        severity: 'error',
        summary: t.codeadjustmentspanel294,
        detail: t.codeadjustmentspanel295,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedProject?.id]);

  const loadVariables = useCallback(async () => {
    try {
      const data = await apiClient.get('/code-adjustments/variables');
      if (data.success) {
        setAvailableVariables(data.data);
      }
    } catch (error) {
      console.error(t.codeadjustmentspanel312, error);
    }
  }, []);

  const loadGenerations = useCallback(async () => {
    if (!selectedProject?.id) return;

    setLoadingGenerations(true);
    try {
      const data = await apiClient.get(`/projects/${selectedProject.id}/generations`);
      if (data.success) {
        setGenerations(data.data);
        // Auto-select the latest generation for both dropdowns
        if (data.data.length > 0) {
          if (!selectedGenerationId) {
            setSelectedGenerationId(data.data[0].id);
          }
          if (!selectedGenerationForCompare) {
            setSelectedGenerationForCompare(data.data[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Load generations error:', error);
    } finally {
      setLoadingGenerations(false);
    }
  }, [selectedProject?.id, selectedGenerationId, selectedGenerationForCompare]);

  const loadGenerationFiles = useCallback(async (generationId: number) => {
    if (!selectedProject?.id) return;

    setLoadingFiles(true);
    setGenerationFiles([]);
    try {
      const data = await apiClient.get(`/projects/${selectedProject.id}/generations/${generationId}/files`);
      if (data.success) {
        setGenerationFiles(data.data.files);
      }
    } catch (error) {
      console.error(t.codeadjustmentspanel359, error);
    } finally {
      setLoadingFiles(false);
    }
  }, [selectedProject?.id]);

  // ========== GIT FUNCTIONS ==========

  const loadGitProviders = useCallback(async () => {
    setLoadingGitProviders(true);
    try {
      const data = await apiClient.get('/git/providers');
      // API returns { providers: [...], git_integration_access: {...} }
      if (data.providers && data.providers.length > 0) {
        setGitProviders(data.providers.map((p: any) => ({
          provider: p.provider,
          username: p.username,
        })));
      }
    } catch (error) {
      console.error(t.codeadjustmentspanel382, error);
    } finally {
      setLoadingGitProviders(false);
    }
  }, []);

  const loadGitRepositories = useCallback(async (provider: string) => {
    setLoadingRepositories(true);
    setGitRepositories([]);
    setSelectedRepository(null);
    setGitBranches([]);
    setSelectedBranch(null);
    try {
      const data = await apiClient.get(`/git/${provider}/repositories`);
      if (data.repositories) {
        setGitRepositories(data.repositories.map((r: any) => ({
          full_name: r.full_name,
          name: r.name,
        })));
      }
    } catch (error) {
      console.error(t.codeadjustmentspanel406, error);
    } finally {
      setLoadingRepositories(false);
    }
  }, []);

  const loadGitBranches = useCallback(async (provider: string, repository: string) => {
    setLoadingBranches(true);
    setGitBranches([]);
    setSelectedBranch(null);
    try {
      // API expects 'repo' parameter, not 'repository'
      const data = await apiClient.get(`/git/${provider}/branches?repo=${encodeURIComponent(repository)}`);
      if (data.branches) {
        setGitBranches(data.branches);
        // Auto-select main/master branch
        const mainBranch = data.branches.find((b: any) => b.name === 'main' || b.name === 'master');
        if (mainBranch) {
          setSelectedBranch(mainBranch.name);
        }
      }
    } catch (error) {
      console.error(t.codeadjustmentspanel431, error);
    } finally {
      setLoadingBranches(false);
    }
  }, []);

  const fetchFileFromGeneration = useCallback(async () => {
    if (!selectedProject?.id || !selectedGenerationId || !selectedFilePath) return;

    setFetchingFile(true);
    try {
      const data = await apiClient.post(
        `/projects/${selectedProject.id}/generations/${selectedGenerationId}/fetch-file`,
        { file_path: selectedFilePath }
      );
      if (data.success) {
        setTemplateContent(data.data.content);
        setAnalysisFilename(data.data.file_path);
        toast.current?.show({
          severity: 'success',
          summary: t.codeadjustmentspanel456,
          detail: `"${data.data.file_path}"${t.codeadjustmentspanel457}`,
        });
      } else {
        toast.current?.show({
          severity: 'error',
          summary: t.messageError,
          detail: data.message || t.codeadjustmentspanel463,
        });
      }
    } catch (error: any) {
      console.error('Fetch file error:', error);
      toast.current?.show({
        severity: 'error',
        summary: t.messageError,
        detail: error?.response?.data?.message || t.codeadjustmentspanel471,
      });
    } finally {
      setFetchingFile(false);
    }
  }, [selectedProject?.id, selectedGenerationId, selectedFilePath]);

  // Load access status on mount
  useEffect(() => {
    loadCodeAdjustmentsAccess();
  }, [loadCodeAdjustmentsAccess]);

  // Load data only if user has access
  useEffect(() => {
    if (codeAdjustmentsAccess?.has_access) {
      loadAdjustments();
      loadVariables();
      loadGenerations();
    }
  }, [codeAdjustmentsAccess?.has_access, loadAdjustments, loadVariables, loadGenerations]);

  // Load files when generation is selected
  useEffect(() => {
    if (selectedGenerationId) {
      loadGenerationFiles(selectedGenerationId);
    }
  }, [selectedGenerationId, loadGenerationFiles]);

  // ========== CRUD OPERATIONS ==========

  const saveAdjustment = async () => {
    if (!selectedProject?.id) return;

    const isNew = !editingAdjustment.id;
    const endpoint = isNew
      ? `/projects/${selectedProject.id}/code-adjustments`
      : `/projects/${selectedProject.id}/code-adjustments/${editingAdjustment.id}`;

    try {
      const data = isNew
        ? await apiClient.post(endpoint, editingAdjustment)
        : await apiClient.put(endpoint, editingAdjustment);

      if (data.success) {
        toast.current?.show({
          severity: 'success',
          summary: t.codeadjustmentspanel520,
          detail: isNew ? t.codeadjustmentspanel521 : t.codeadjustmentspanel521_2,
        });
        setShowAdjustmentDialog(false);
        loadAdjustments();
      } else {
        toast.current?.show({
          severity: 'error',
          summary: t.codeadjustmentspanel528,
          detail: data.message || t.codeadjustmentspanel529,
        });
      }
    } catch (error: any) {
      console.error('Save adjustment error:', error);
      toast.current?.show({
        severity: 'error',
        summary: t.codeadjustmentspanel536,
        detail: error?.response?.data?.message || t.codeadjustmentspanel537,
      });
    }
  };

  const deleteAdjustment = async (adjustment: CodeAdjustment) => {
    confirmDialog({
      group: 'code-adjustments',
      message: `${t.codeadjustmentspanel544}"${adjustment.name}"?`,
      header: t.codeadjustmentspanel545,
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          const data = await apiClient.delete(
            `/projects/${selectedProject?.id}/code-adjustments/${adjustment.id}`
          );

          if (data.success) {
            toast.current?.show({
              severity: 'success',
              summary: t.codeadjustmentspanel559,
              detail: t.codeadjustmentspanel560,
            });
            if (selectedAdjustment?.id === adjustment.id) {
              setSelectedAdjustment(null);
            }
            loadAdjustments();
          }
        } catch (error) {
          console.error(t.codeadjustmentspanel568, error);
        }
      },
    });
  };

  const toggleActive = async (adjustment: CodeAdjustment) => {
    try {
      const data = await apiClient.patch(
        `/projects/${selectedProject?.id}/code-adjustments/${adjustment.id}/toggle`
      );

      if (data.success) {
        loadAdjustments();
      }
    } catch (error) {
      console.error(t.codeadjustmentspanel586, error);
    }
  };

  const duplicateAdjustment = async (adjustment: CodeAdjustment) => {
    try {
      const data = await apiClient.post(
        `/projects/${selectedProject?.id}/code-adjustments/${adjustment.id}/duplicate`
      );

      if (data.success) {
        toast.current?.show({
          severity: 'success',
          summary: t.codeadjustmentspanel601,
          detail: t.codeadjustmentspanel602,
        });
        loadAdjustments();
      }
    } catch (error) {
      console.error(t.codeadjustmentspanel607, error);
    }
  };

  // ========== INSERTION OPERATIONS ==========

  const saveInsertion = async () => {
    if (!selectedAdjustment?.id || !selectedProject?.id) return;

    const isNew = !editingInsertion.id;
    const endpoint = isNew
      ? `/projects/${selectedProject.id}/code-adjustments/${selectedAdjustment.id}/insertions`
      : `/projects/${selectedProject.id}/code-adjustments/${selectedAdjustment.id}/insertions/${editingInsertion.id}`;

    try {
      const data = isNew
        ? await apiClient.post(endpoint, editingInsertion)
        : await apiClient.put(endpoint, editingInsertion);

      if (data.success) {
        toast.current?.show({
          severity: 'success',
          summary: t.codeadjustmentspanel632,
          detail: isNew ? t.codeadjustmentspanel633 : t.codeadjustmentspanel633_2,
        });
        setShowInsertionDialog(false);
        // Reload adjustments and update selectedAdjustment with fresh data
        try {
          const adjData = await apiClient.get(`/projects/${selectedProject.id}/code-adjustments`);
          if (adjData.success) {
            setAdjustments(adjData.data);
            // Update selectedAdjustment to the fresh version with same ID
            const updatedAdjustment = adjData.data.find((a: CodeAdjustment) => a.id === selectedAdjustment.id);
            if (updatedAdjustment) {
              setSelectedAdjustment(updatedAdjustment);
            }
          }
        } catch {
          // Reload failed - non-fatal, save itself succeeded
        }
      }
    } catch (error) {
      console.error(t.codeadjustmentspanel651, error);
    }
  };

  const deleteInsertion = async (insertion: CodeAdjustmentInsertion) => {
    if (!selectedAdjustment?.id || !selectedProject?.id) return;

    confirmDialog({
      group: 'code-adjustments',
      message: t.codeadjustmentspanel659,
      header: t.codeadjustmentspanel660,
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          const data = await apiClient.delete(
            `/projects/${selectedProject.id}/code-adjustments/${selectedAdjustment.id}/insertions/${insertion.id}`
          );

          if (data.success) {
            toast.current?.show({
              severity: 'success',
              summary: t.codeadjustmentspanel674,
              detail: t.codeadjustmentspanel675,
            });
            loadAdjustments();
          }
        } catch (error) {
          console.error(t.codeadjustmentspanel680, error);
        }
      },
    });
  };

  // ========== REVERSE ENGINEERING ==========

  const analyzeCode = async () => {
    if (!templateContent || !modifiedContent || !analysisFilename) {
      toast.current?.show({
        severity: 'warn',
        summary: t.codeadjustmentspanel692,
        detail: t.codeadjustmentspanel693,
      });
      return;
    }

    setAnalyzing(true);
    try {
      const data = await apiClient.post('/code-adjustments/analyze', {
        template_content: templateContent,
        modified_content: modifiedContent,
        filename: analysisFilename,
      });

      if (data.success) {
        setAnalysisResult(data.data);
        toast.current?.show({
          severity: 'success',
          summary: t.codeadjustmentspanel715,
          detail: `${t.codeadjustmentspanel716}${data.data.insertions.length}${t.codeadjustmentspanel716_2}(${Math.round(data.data.confidence * 100)}${t.codeadjustmentspanel716_3})`,
        });
      }
    } catch (error) {
      console.error(t.codeadjustmentspanel720, error);
      toast.current?.show({
        severity: 'error',
        summary: t.codeadjustmentspanel723,
        detail: t.codeadjustmentspanel724,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // ========== FILE UPLOAD HANDLERS ==========

  const handleTemplateFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setTemplateContent(content);
      // Try to extract filename for pattern
      if (!analysisFilename) {
        setAnalysisFilename(file.name);
      }
      toast.current?.show({
        severity: 'success',
        summary: t.codeadjustmentspanel747,
        detail: `${t.codeadjustmentspanel748}"${file.name}"${t.codeadjustmentspanel748_2}`,
      });
    };
    reader.onerror = () => {
      toast.current?.show({
        severity: 'error',
        summary: t.messageError,
        detail: t.codeadjustmentspanel755,
      });
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  const handleModifiedFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setModifiedContent(content);
      toast.current?.show({
        severity: 'success',
        summary: t.codeadjustmentspanel773,
        detail: `${t.codeadjustmentspanel774}"${file.name}"${t.codeadjustmentspanel774_2}`,
      });
    };
    reader.onerror = () => {
      toast.current?.show({
        severity: 'error',
        summary: t.messageError,
        detail: t.codeadjustmentspanel781,
      });
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // ========== DIRECTORY COMPARISON HANDLERS ==========

  const handleDirectoryArchiveUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['.zip', '.tar.gz', '.tar.xz', '.tgz'];
    const isValid = validTypes.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isValid) {
      toast.current?.show({
        severity: 'error',
        summary: t.codeadjustmentspanel801,
        detail: t.codeadjustmentspanel802,
      });
      return;
    }

    setUploadedArchive(file);
    setDirectoryCompareResult(null);
    toast.current?.show({
      severity: 'success',
      summary: t.codeadjustmentspanel811,
      detail: `"${file.name}"${t.codeadjustmentspanel812}`,
    });
    event.target.value = '';
  };

  const startDirectoryComparison = async () => {
    if (!selectedProject?.id) return;

    if (directorySource === 'upload' && !uploadedArchive) {
      toast.current?.show({
        severity: 'warn',
        summary: t.codeadjustmentspanel823,
        detail: t.codeadjustmentspanel824,
      });
      return;
    }

    if (directorySource === 'git') {
      if (!selectedGitProvider || !selectedRepository || !selectedBranch) {
        toast.current?.show({
          severity: 'warn',
          summary: t.codeadjustmentspanel833,
          detail: t.codeadjustmentspanel834,
        });
        return;
      }
    }

    if (!selectedGenerationForCompare) {
      toast.current?.show({
        severity: 'warn',
        summary: t.codeadjustmentspanel843,
        detail: t.codeadjustmentspanel844,
      });
      return;
    }

    setComparingDirectory(true);
    setDirectoryCompareResult(null);

    try {
      let data: any;

      if (directorySource === 'git') {
        // Use the new Git comparison endpoint
        data = await apiClient.post('/code-adjustments/compare-git', {
          project_id: selectedProject.id,
          generation_id: selectedGenerationForCompare,
          provider: selectedGitProvider,
          repository: selectedRepository,
          branch: selectedBranch,
          directory: gitDirectory || '',
        });
      } else {
        // Use FormData for upload/service
        const formData = new FormData();
        formData.append('project_id', selectedProject.id.toString());
        formData.append('generation_id', selectedGenerationForCompare.toString());
        formData.append('source', directorySource);

        if (directorySource === 'upload' && uploadedArchive) {
          formData.append('archive', uploadedArchive);
        }

        data = await apiClient.uploadFile('/code-adjustments/compare-directory', formData);
      }

      if (data.success) {
        setDirectoryCompareResult(data.data);
        // Build info message for Git comparisons
        let infoMessage = '';
        if (data.data.git_info) {
          const gi = data.data.git_info;
          const parts = [];
          if (gi.skipped_large > 0) {
            parts.push(`${gi.skipped_large}${t.codeadjustmentspanel905}`);
          }
          parts.push(`${gi.fetched} Dateien aus ${gi.repository}:${gi.branch}`);
          infoMessage = ` (${parts.join(', ')})`;
        }
        toast.current?.show({
          severity: 'success',
          summary: t.codeadjustmentspanel912,
          detail: `${data.data.summary.modified}${t.codeadjustmentspanel913}${infoMessage}`,
        });
      } else {
        toast.current?.show({
          severity: 'error',
          summary: t.messageError,
          detail: data.message || t.codeadjustmentspanel919,
        });
      }
    } catch (error: any) {
      console.error(t.codeadjustmentspanel923, error);
      toast.current?.show({
        severity: 'error',
        summary: t.messageError,
        detail: error?.response?.data?.message || t.codeadjustmentspanel927,
      });
    } finally {
      setComparingDirectory(false);
    }
  };

  const loadFileForSingleComparison = (filePath: string) => {
    if (!directoryCompareResult) return;

    const file = directoryCompareResult.files.find(f => f.path === filePath);
    if (file && file.template_content && file.modified_content) {
      // Switch to Einzelcode Vergleich tab and load the content
      setTemplateContent(file.template_content);
      setModifiedContent(file.modified_content);
      setAnalysisFilename(filePath);
      setActiveTabIndex(1); // Switch to Einzelcode Vergleich tab
      toast.current?.show({
        severity: 'info',
        summary: t.codeadjustmentspanel946,
        detail: `"${filePath}"${t.codeadjustmentspanel948}`,
      });
    }
  };

  // ========== ANALYSIS INSERTION EDITING ==========

  // Open the create dialog with editable insertions
  const openCreateFromAnalysisDialog = () => {
    if (!analysisResult) return;

    // Extract just the filename (without path) for the name
    const filenameOnly = analysisFilename.split('/').pop() || analysisFilename;

    // Copy insertions to editable state
    setEditableInsertions([...analysisResult.insertions]);
    setNewAdjustmentData({
      name: filenameOnly, // Auto-populate with filename
      description: t.codeadjustmentspanel965,
      file_pattern: analysisFilename,
      min_confidence: 0.8,
      insertions: [...analysisResult.insertions],
    });
    setShowCreateFromAnalysisDialog(true);
  };

  // Edit a specific insertion from analysis
  const startEditAnalysisInsertion = (index: number) => {
    const insertion = editableInsertions[index];
    if (insertion) {
      setEditingAnalysisInsertionIndex(index);
      setEditingAnalysisInsertion({ ...insertion });
      setShowAnalysisInsertionDialog(true);
    }
  };

  // Save changes to an analysis insertion
  const saveAnalysisInsertion = () => {
    if (editingAnalysisInsertion === null || editingAnalysisInsertionIndex === null) return;

    const newInsertions = [...editableInsertions];
    newInsertions[editingAnalysisInsertionIndex] = editingAnalysisInsertion;
    setEditableInsertions(newInsertions);
    setNewAdjustmentData(prev => ({ ...prev, insertions: newInsertions }));
    setShowAnalysisInsertionDialog(false);
    setEditingAnalysisInsertion(null);
    setEditingAnalysisInsertionIndex(null);
  };

  // Delete an insertion from analysis
  const deleteAnalysisInsertion = (index: number) => {
    const newInsertions = editableInsertions.filter((_, i) => i !== index);
    setEditableInsertions(newInsertions);
    setNewAdjustmentData(prev => ({ ...prev, insertions: newInsertions }));
  };

  // Add a new blank insertion
  const addAnalysisInsertion = () => {
    const newInsertion: AnalysisInsertion = {
      insertion_type: 'middle',
      anchor_text: '',
      insertion_content: '',
      line_offset: 0,
      line_count: 0,
      description: '',
    };
    const newInsertions = [...editableInsertions, newInsertion];
    setEditableInsertions(newInsertions);
    setNewAdjustmentData(prev => ({ ...prev, insertions: newInsertions }));
    // Immediately open edit dialog for the new insertion
    setEditingAnalysisInsertionIndex(newInsertions.length - 1);
    setEditingAnalysisInsertion(newInsertion);
    setShowAnalysisInsertionDialog(true);
  };

  // Save the adjustment from analysis
  const saveFromAnalysis = async () => {
    if (!selectedProject?.id || editableInsertions.length === 0) return;

    if (!newAdjustmentData.name.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: t.messageError,
        detail: t.codeadjustmentspanel1030,
      });
      return;
    }

    try {
      const data = await apiClient.post(
        `/projects/${selectedProject.id}/code-adjustments/from-analysis`,
        {
          name: newAdjustmentData.name,
          description: newAdjustmentData.description,
          file_pattern: newAdjustmentData.file_pattern,
          insertions: editableInsertions.map(ins => ({
            insertion_type: ins.insertion_type,
            anchor_text: ins.anchor_text,
            insertion_content: ins.insertion_content,
            line_offset: ins.line_offset,
            description: ins.description || null,
          })),
        }
      );

      if (data.success) {
        toast.current?.show({
          severity: 'success',
          summary: t.codeadjustmentspanel1060,
          detail: t.codeadjustmentspanel1061,
        });
        setShowCreateFromAnalysisDialog(false);
        setActiveTabIndex(0); // Switch to management tab
        loadAdjustments();
        // Clear analysis
        setTemplateContent('');
        setModifiedContent('');
        setAnalysisFilename('');
        setAnalysisResult(null);
        setEditableInsertions([]);
      } else {
        toast.current?.show({
          severity: 'error',
          summary: t.messageError,
          detail: data.message || t.codeadjustmentspanel1076,
        });
      }
    } catch (error) {
      console.error(t.codeadjustmentspanel1080, error);
      toast.current?.show({
        severity: 'error',
        summary: t.messageError,
        detail: t.codeadjustmentspanel1084,
      });
    }
  };

  // ========== BATCH ADJUSTMENT CREATION ==========

  const createBatchAdjustments = async () => {
    if (!selectedProject?.id || !directoryCompareResult) return;

    // Get only modified files that have both template and modified content
    const modifiedFiles = directoryCompareResult.files.filter(
      f => f.status === 'modified' && f.template_content && f.modified_content
    );

    if (modifiedFiles.length === 0) {
      toast.current?.show({
        severity: 'warn',
        summary: t.codeadjustmentspanel1102,
        detail: t.codeadjustmentspanel1103,
      });
      return;
    }

    setCreatingBatchAdjustments(true);
    setBatchProgress({ current: 0, total: modifiedFiles.length, currentFile: '' });

    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < modifiedFiles.length; i++) {
        const file = modifiedFiles[i];
        setBatchProgress({ current: i + 1, total: modifiedFiles.length, currentFile: file.path });

        try {
          // Step 1: Analyze the file
          const analyzeData = await apiClient.post('/code-adjustments/analyze', {
            template_content: file.template_content,
            modified_content: file.modified_content,
            filename: file.path,
          });

          if (!analyzeData.success || !analyzeData.data.insertions || analyzeData.data.insertions.length === 0) {
            // No insertions found or analysis failed, skip
            continue;
          }

          // Step 2: Create the adjustment with insertions
          const insertions = analyzeData.data.insertions;
          const adjustmentName = file.path.split('/').pop() || file.path; // Use filename as name

          const createData = await apiClient.post(
            `/projects/${selectedProject.id}/code-adjustments/from-analysis`,
            {
              name: `Auto: ${adjustmentName}`,
              description: t.codeadjustmentspanel1148,
              file_pattern: file.path,
              insertions: insertions.map((ins: AnalysisInsertion) => ({
                insertion_type: ins.insertion_type,
                anchor_text: ins.anchor_text,
                insertion_content: ins.insertion_content,
                line_offset: ins.line_offset,
                description: `${ins.line_count}${t.codeadjustmentspanel1155}`,
              })),
            }
          );

          if (createData.success) {
            successCount++;
          } else {
            errorCount++;
            console.error(`${t.codeadjustmentspanel1166}${file.path}:`, createData.message);
          }
        } catch (fileError) {
          errorCount++;
          console.error(`${t.codeadjustmentspanel1170}${file.path}:`, fileError);
        }
      }

      // Show summary
      if (successCount > 0) {
        toast.current?.show({
          severity: 'success',
          summary: t.codeadjustmentspanel1178,
          detail: `${successCount}${t.codeadjustmentspanel1179}${errorCount > 0 ? `, ${errorCount}${t.codeadjustmentspanel1181}` : ''}`,
          life: 5000,
        });
        // Reload adjustments and switch to management tab
        loadAdjustments();
        setActiveTabIndex(0);
      } else if (errorCount > 0) {
        toast.current?.show({
          severity: 'error',
          summary: t.messageError,
          detail: `${t.codeadjustmentspanel1189}${errorCount}${t.codeadjustmentspanel1189_2}`,
          life: 5000,
        });
      } else {
        toast.current?.show({
          severity: 'info',
          summary: t.codeadjustmentspanel1195,
          detail: t.codeadjustmentspanel1196,
          life: 3000,
        });
      }
    } catch (error) {
      console.error(t.codeadjustmentspanel1201, error);
      toast.current?.show({
        severity: 'error',
        summary: t.messageError,
        detail: t.codeadjustmentspanel1205,
      });
    } finally {
      setCreatingBatchAdjustments(false);
      setBatchProgress(null);
    }
  };

  // ========== EXPORT / IMPORT ==========

  const exportAdjustments = async () => {
    if (!selectedProject?.id) return;

    setExporting(true);
    try {
      const data = await apiClient.get(`/projects/${selectedProject.id}/code-adjustments/export`);

      if (data.success) {
        // Create and download JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `code-adjustments-${selectedProject.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.current?.show({
          severity: 'success',
          summary: t.codeadjustmentspanel1239,
          detail: `${data.data.adjustments.length}${t.codeadjustmentspanel1240}`,
        });
      } else {
        toast.current?.show({
          severity: 'error',
          summary: t.messageError,
          detail: data.message || t.codeadjustmentspanel1246,
        });
      }
    } catch (error) {
      console.error(t.codeadjustmentspanel1250, error);
      toast.current?.show({
        severity: 'error',
        summary: t.messageError,
        detail: t.codeadjustmentspanel1254,
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImportFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.current?.show({
        severity: 'error',
        summary: t.codeadjustmentspanel1268,
        detail: t.codeadjustmentspanel1269,
      });
      return;
    }

    setImportFile(file);
    event.target.value = '';
  };

  const importAdjustments = async () => {
    if (!selectedProject?.id || !importFile) return;

    setImporting(true);
    try {
      // Read file content
      const fileContent = await importFile.text();
      let importData;

      try {
        importData = JSON.parse(fileContent);
      } catch {
        toast.current?.show({
          severity: 'error',
          summary: t.codeadjustmentspanel1292,
          detail: t.codeadjustmentspanel1293,
        });
        setImporting(false);
        return;
      }

      // Validate basic structure
      if (!importData.version || !importData.adjustments || !Array.isArray(importData.adjustments)) {
        toast.current?.show({
          severity: 'error',
          summary: t.codeadjustmentspanel1303,
          detail: t.codeadjustmentspanel1304,
        });
        setImporting(false);
        return;
      }

      const data = await apiClient.post(`/projects/${selectedProject.id}/code-adjustments/import`, {
        data: importData,
        mode: importMode,
      });

      if (data.success) {
        toast.current?.show({
          severity: 'success',
          summary: t.codeadjustmentspanel1323,
          detail: data.message,
          life: 5000,
        });
        setShowImportDialog(false);
        setImportFile(null);
        loadAdjustments();
      } else {
        toast.current?.show({
          severity: 'error',
          summary: t.messageError,
          detail: data.message || t.codeadjustmentspanel1334,
        });
      }
    } catch (error) {
      console.error(t.codeadjustmentspanel1338, error);
      toast.current?.show({
        severity: 'error',
        summary: t.messageError,
        detail: t.codeadjustmentspanel1342,
      });
    } finally {
      setImporting(false);
    }
  };

  // ========== RENDER HELPERS ==========

  const insertionTypeOptions = [
    { label: t.codeadjustmentspanel1352, value: 'beginning' },
    { label: t.codeadjustmentspanel1353, value: 'end' },
    { label: t.codeadjustmentspanel1354, value: 'middle' },
  ];

  const getInsertionTypeTag = (type: string) => {
    const severity = type === 'beginning' ? 'info' : type === 'end' ? 'success' : 'warning';
    return <Tag value={type} severity={severity} />;
  };

  // ========== NO PROJECT SELECTED ==========

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: colors.bgPrimary }}>
        <div className="text-center" style={{ color: colors.textMuted }}>
          <i className="pi pi-folder-open text-4xl mb-2" />
          <p>{t.codeadjustmentspanel1369}</p>
        </div>
      </div>
    );
  }

  // ========== LOADING ACCESS ==========

  if (loadingAccess) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: colors.bgPrimary }}>
        <ProgressSpinner />
      </div>
    );
  }

  // ========== NO ACCESS - SHOW PREMIUM BANNER ==========

  if (!codeAdjustmentsAccess?.has_access) {
    return (
      <div className="h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
        <Toast ref={toast} />

        {/* Header */}
        <div className="flex items-center justify-between p-3" style={{ borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: colors.borderPrimary }}>
          <div className="flex items-center gap-2">
            <i className="pi pi-sliders-h text-xl" style={{ color: colors.accent }} />
            <h2 className="text-lg font-semibold">{t.codeadjustmentspanel1396}</h2>
            <Tag value={selectedProject.name} severity="info" />
          </div>
        </div>

        {/* Premium Banner */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="rounded-lg p-6 text-center" style={{ backgroundColor: colors.infoBg, borderWidth: '2px', borderStyle: 'solid', borderColor: colors.accent }}>
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.infoText }}>
                {t.codeadjustmentspanel1407}
              </h3>
              <p className="mb-4" style={{ color: colors.textMuted }}>
                {t.codeadjustmentspanel1410}
              </p>

              <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: colors.bgTertiary }}>
                <div className="text-2xl font-bold mb-1" style={{ color: colors.accent }}>
                  {codeAdjustmentsAccess?.unlock_cost || 50}{t.codeadjustmentspanel1415}
                </div>
                <div className="text-sm" style={{ color: colors.textMuted }}>
                  {t.codeadjustmentspanel1418}
                </div>
              </div>

              <Button
                label={unlocking ? t.codeadjustmentspanel1423 : t.codeadjustmentspanel1423_2}
                icon="pi pi-unlock"
                className="p-button-lg"
                style={{
                  background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                  border: 'none',
                }}
                onClick={unlockCodeAdjustments}
                disabled={unlocking}
                loading={unlocking}
              />

              <div className="mt-4 text-sm" style={{ color: colors.textMuted }}>
                <p className="mb-2 font-medium" style={{ color: colors.textSecondary }}>Enthaltene Funktionen:</p>
                <ul className="text-left space-y-1">
                  <li className="flex items-center gap-2 opacity-60" style={{ color: colors.textSecondary }}>
                    <span>📝</span>{t.codeadjustmentspanel1439}
                  </li>
                  <li className="flex items-center gap-2 opacity-60" style={{ color: colors.textSecondary }}>
                    <span>📁</span>{t.codeadjustmentspanel1442}
                  </li>
                  <li className="flex items-center gap-2 opacity-60" style={{ color: colors.textSecondary }}>
                    <span>⚙️</span>{t.codeadjustmentspanel1445}
                  </li>
                  <li className="flex items-center gap-2 opacity-60" style={{ color: colors.textSecondary }}>
                    <span>🔄</span>{t.codeadjustmentspanel1448}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== MAIN RENDER (WITH ACCESS) ==========

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <Toast ref={toast} />
      <ConfirmDialog group="code-adjustments" />

      {/* Header */}
      <div className="flex items-center justify-between p-3 flex-shrink-0" style={{ borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: colors.borderPrimary }}>
        <div className="flex items-center gap-2">
          <i className="pi pi-sliders-h text-xl" style={{ color: colors.accent }} />
          <h2 className="text-lg font-semibold">{t.codeadjustmentspanel1470}</h2>
          <Tag value={selectedProject.name} severity="info" />
          {/* Access Status Badge */}
          {codeAdjustmentsAccess?.is_patron ? (
            <Tag value={t.codeadjustmentspanel1474} severity="warning" className="ml-2" />
          ) : codeAdjustmentsAccess?.days_remaining !== undefined ? (
            <Tag value={`${codeAdjustmentsAccess.days_remaining}${t.codeadjustmentspanel1476}`} severity="info" className="ml-2" />
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            icon={exporting ? 'pi pi-spin pi-spinner' : 'pi pi-download'}
            size="small"
            text
            tooltip={t.codeadjustmentspanel1484}
            tooltipOptions={{ position: 'bottom' }}
            onClick={exportAdjustments}
            disabled={exporting || adjustments.length === 0}
          />
          <Button
            icon="pi pi-upload"
            size="small"
            text
            tooltip={t.codeadjustmentspanel1493}
            tooltipOptions={{ position: 'bottom' }}
            onClick={() => setShowImportDialog(true)}
          />
          <Button
            label={t.codeadjustmentspanel1498}
            icon="pi pi-plus"
            size="small"
            onClick={() => {
              setEditingAdjustment({
                name: '',
                file_pattern: '',
                min_confidence: 0.8,
                execution_order: 0,
                is_active: true,
              });
              setShowAdjustmentDialog(true);
            }}
          />
        </div>
      </div>

      {/* Tabs — vertical side-menu layout via TabViewSideMenu. flex-1 min-h-0
       * on the wrapper lets the side menu claim the remaining panel height
       * while exposing the intrinsic minimum so internal scroll/splitter
       * children can size correctly. The previous inline --theme-* overrides
       * were dropped: those variables are already set on document root by
       * ThemeContext and inherit down to every TabView descendant. */}
      <div className="flex-1 min-h-0">
      <TabViewSideMenu
        storageKey="codeAdjustmentsPanel"
        defaultWidth={220}
        activeIndex={activeTabIndex}
        onTabChange={(e: { index: number }) => setActiveTabIndex(e.index)}
      >
        {/* Tab 1: Management */}
        <TabPanel header={<span><i className="pi pi-list mr-2" />{t.codeadjustmentspanel1532}</span>}>
          {loading ? (
            <div className="flex items-center justify-center h-64" style={{ backgroundColor: colors.bgPrimary }}>
              <ProgressSpinner />
            </div>
          ) : (
            <Splitter
              className="h-full themed-splitter"
              style={{
                minHeight: '400px',
                backgroundColor: colors.bgPrimary,
                border: 'none',
                ['--theme-bg-primary' as string]: colors.bgPrimary,
                ['--theme-bg-secondary' as string]: colors.bgSecondary,
                ['--theme-border-secondary' as string]: colors.borderSecondary,
              }}
            >
              {/* Left: Adjustments List */}
              <SplitterPanel size={35} minSize={20} style={{ backgroundColor: colors.bgPrimary, display: 'flex', flexDirection: 'column' }}>
                <div className="p-2 flex-1 overflow-auto" style={{ backgroundColor: colors.bgPrimary }}>
                  <DataTable
                    value={adjustments}
                    selection={selectedAdjustment}
                    selectionMode="single"
                    onSelectionChange={(e) => setSelectedAdjustment(e.value as CodeAdjustment)}
                    scrollable
                    scrollHeight="flex"
                    emptyMessage={t.codeadjustmentspanel1559}
                    size="small"
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25]}
                    className="text-sm themed-datatable"
                    style={{
                      backgroundColor: colors.bgSecondary,
                      ['--dt-bg' as string]: colors.bgSecondary,
                      ['--dt-header-bg' as string]: colors.bgTertiary,
                      ['--dt-border' as string]: colors.borderPrimary,
                      ['--dt-text' as string]: colors.textPrimary,
                      ['--dt-text-secondary' as string]: colors.textSecondary,
                    }}
                  >
                    <Column
                      field="is_active"
                      header=""
                      body={(row: CodeAdjustment) => (
                        <InputSwitch
                          checked={row.is_active}
                          onChange={() => toggleActive(row)}
                          className="p-inputswitch-sm"
                        />
                      )}
                      style={{ width: '50px' }}
                    />
                    <Column field="name" header="Name" sortable />
                    <Column
                      field="file_pattern"
                      header={t.codeadjustmentspanel1589}
                      style={{ maxWidth: '150px' }}
                      body={(row: CodeAdjustment) => (
                        <span className="text-xs font-mono" style={{ color: colors.textMuted }}>{row.file_pattern}</span>
                      )}
                    />
                    <Column
                      header=""
                      body={(row: CodeAdjustment) => (
                        <div className="flex gap-1">
                          <Button
                            icon="pi pi-pencil"
                            size="small"
                            text
                            onClick={() => {
                              setEditingAdjustment(row);
                              setShowAdjustmentDialog(true);
                            }}
                          />
                          <Button
                            icon="pi pi-copy"
                            size="small"
                            text
                            onClick={() => duplicateAdjustment(row)}
                          />
                          <Button
                            icon="pi pi-trash"
                            size="small"
                            text
                            severity="danger"
                            onClick={() => deleteAdjustment(row)}
                          />
                        </div>
                      )}
                      style={{ width: '120px' }}
                    />
                  </DataTable>
                </div>
              </SplitterPanel>

              {/* Right: Details */}
              <SplitterPanel size={65} minSize={30} style={{ backgroundColor: colors.bgPrimary, display: 'flex', flexDirection: 'column' }}>
                <div className="p-3 flex-1 overflow-auto" style={{ backgroundColor: colors.bgPrimary }}>
                  {selectedAdjustment ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>{selectedAdjustment.name}</h3>
                        <Button
                          label={t.codeadjustmentspanel1637}
                          icon="pi pi-plus"
                          size="small"
                          onClick={() => {
                            // Get next order: max existing order + 1, or 0 if no insertions
                            const maxOrder = selectedAdjustment.insertions && selectedAdjustment.insertions.length > 0
                              ? Math.max(...selectedAdjustment.insertions.map(ins => ins.insertion_order))
                              : -1;
                            setEditingInsertion({
                              insertion_type: 'middle',
                              anchor_text: '',
                              insertion_content: '',
                              line_offset: 0,
                              insertion_order: maxOrder + 1,
                            });
                            setShowInsertionDialog(true);
                          }}
                        />
                      </div>

                      {/* Meta info */}
                      <div className="grid grid-cols-3 gap-2 mb-4 text-sm" style={{ color: colors.textMuted }}>
                        <div>
                          <span className="font-medium">{t.codeadjustmentspanel1660}</span>{' '}
                          <code style={{ color: colors.accent }}>{selectedAdjustment.file_pattern}</code>
                        </div>
                        <div>
                          <span className="font-medium">{t.codeadjustmentspanel1664}</span>{' '}
                          {Math.round(selectedAdjustment.min_confidence * 100)}%
                        </div>
                        <div>
                          <span className="font-medium">{t.codeadjustmentspanel1668}</span>{' '}
                          {selectedAdjustment.execution_order}
                        </div>
                      </div>

                      {/* Insertions Table */}
                      <DataTable
                        value={selectedAdjustment.insertions || []}
                        emptyMessage={t.codeadjustmentspanel1676}
                        size="small"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="themed-datatable"
                        style={{
                          ['--dt-bg' as string]: colors.bgSecondary,
                          ['--dt-header-bg' as string]: colors.bgTertiary,
                          ['--dt-border' as string]: colors.borderPrimary,
                          ['--dt-text' as string]: colors.textPrimary,
                          ['--dt-text-secondary' as string]: colors.textSecondary,
                          ['--theme-accent' as string]: colors.accent,
                        }}
                      >
                        <Column
                          field="insertion_type"
                          header={t.codeadjustmentspanel1693}
                          body={(row: CodeAdjustmentInsertion) => getInsertionTypeTag(row.insertion_type)}
                          style={{ width: '100px' }}
                        />
                        <Column
                          field="anchor_text"
                          header={t.codeadjustmentspanel1699}
                          body={(row: CodeAdjustmentInsertion) => (
                            <pre className="text-xs p-1 rounded max-h-16 overflow-auto" style={{ backgroundColor: colors.bgTertiary }}>
                              {row.anchor_text.substring(0, 100)}
                              {row.anchor_text.length > 100 && '...'}
                            </pre>
                          )}
                        />
                        <Column
                          field="insertion_content"
                          header={t.codeadjustmentspanel1709}
                          body={(row: CodeAdjustmentInsertion) => (
                            <pre className="text-xs p-1 rounded max-h-16 overflow-auto" style={{ backgroundColor: colors.bgTertiary, color: colors.successText }}>
                              {row.insertion_content.substring(0, 100)}
                              {row.insertion_content.length > 100 && '...'}
                            </pre>
                          )}
                        />
                        <Column
                          header=""
                          body={(row: CodeAdjustmentInsertion) => (
                            <div className="flex gap-1">
                              <Button
                                icon="pi pi-pencil"
                                size="small"
                                text
                                onClick={() => {
                                  setEditingInsertion(row);
                                  setShowInsertionDialog(true);
                                }}
                              />
                              <Button
                                icon="pi pi-trash"
                                size="small"
                                text
                                severity="danger"
                                onClick={() => deleteInsertion(row)}
                              />
                            </div>
                          )}
                          style={{ width: '80px' }}
                        />
                      </DataTable>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64" style={{ color: colors.textMuted }}>
                      <div className="text-center">
                        <i className="pi pi-arrow-left text-3xl mb-2" />
                        <p>{t.codeadjustmentspanel1747}</p>
                      </div>
                    </div>
                  )}
                </div>
              </SplitterPanel>
            </Splitter>
          )}
        </TabPanel>

        {/* Tab 2: Einzelcode Vergleich */}
        <TabPanel header={<span><i className="pi pi-file mr-2" />{t.codeadjustmentspanel1758}</span>}>
          <div className="p-4">
            {/* Hidden file inputs */}
            <input
              type="file"
              ref={templateFileInputRef}
              onChange={handleTemplateFileUpload}
              accept=".php,.js,.ts,.tsx,.jsx,.html,.css,.json,.xml,.txt,.vue,.py,.java,.cs,.cpp,.c,.h,.sql,.md"
              style={{ display: 'none' }}
            />
            <input
              type="file"
              ref={modifiedFileInputRef}
              onChange={handleModifiedFileUpload}
              accept=".php,.js,.ts,.tsx,.jsx,.html,.css,.json,.xml,.txt,.vue,.py,.java,.cs,.cpp,.c,.h,.sql,.md"
              style={{ display: 'none' }}
            />

            {/* Quick File Selector from Generation */}
            {generations.length > 0 && (
              <div className="rounded p-3 mb-4" style={{ backgroundColor: colors.bgSecondary, borderWidth: '1px', borderStyle: 'solid', borderColor: colors.borderPrimary }}>
                <div className="flex items-center gap-2 mb-2">
                  <i className="pi pi-bolt" style={{ color: colors.warningText }} />
                  <span className="text-sm font-medium">{t.codeadjustmentspanel1781}</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>{t.codeadjustmentspanel1785}</label>
                    <Dropdown
                      value={selectedGenerationId}
                      options={generations.map(g => ({
                        label: `#${g.generation_number} - ${new Date(g.created_at).toLocaleDateString(currentLanguage)}`,
                        value: g.id,
                      }))}
                      onChange={(e) => {
                        setSelectedGenerationId(e.value);
                        setSelectedFilePath(null);
                      }}
                      placeholder={t.codeadjustmentspanel1796}
                      className="w-full text-sm"
                      loading={loadingGenerations}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>{t.codeadjustmentspanel1802}</label>
                    <Dropdown
                      value={selectedFilePath}
                      options={generationFiles.map(f => ({
                        label: f.path,
                        value: f.path,
                      }))}
                      onChange={(e) => setSelectedFilePath(e.value)}
                      placeholder={t.codeadjustmentspanel1810}
                      className="w-full text-sm font-mono"
                      filter
                      filterPlaceholder={t.codeadjustmentspanel1813}
                      loading={loadingFiles}
                      disabled={!selectedGenerationId}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      label={t.codeadjustmentspanel1820}
                      icon={fetchingFile ? 'pi pi-spin pi-spinner' : 'pi pi-download'}
                      size="small"
                      onClick={fetchFileFromGeneration}
                      disabled={!selectedFilePath || fetchingFile}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Pattern and Analyze */}
            <div className="flex items-end gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  {t.codeadjustmentspanel1836}
                  <span className="text-xs ml-2" style={{ color: colors.textMuted }}>{t.codeadjustmentspanel1837}</span>
                </label>
                <InputText
                  value={analysisFilename}
                  onChange={(e) => setAnalysisFilename(e.target.value)}
                  placeholder={t.codeadjustmentspanel1842}
                  className="w-full font-mono"
                />
              </div>
              <Button
                label={t.codeadjustmentspanel1847}
                icon={analyzing ? 'pi pi-spin pi-spinner' : 'pi pi-search'}
                onClick={analyzeCode}
                disabled={analyzing || !templateContent || !modifiedContent}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">{t.codeadjustmentspanel1857}</label>
                  <Button
                    icon="pi pi-upload"
                    size="small"
                    text
                    tooltip={t.codeadjustmentspanel1864}
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => templateFileInputRef.current?.click()}
                  />
                </div>
                <InputTextarea
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  rows={10}
                  className="w-full font-mono text-sm"
                  placeholder={t.codeadjustmentspanel1874}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">{t.codeadjustmentspanel1879}</label>
                  <Button
                    icon="pi pi-upload"
                    size="small"
                    text
                    tooltip={t.codeadjustmentspanel1884}
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => modifiedFileInputRef.current?.click()}
                  />
                </div>
                <InputTextarea
                  value={modifiedContent}
                  onChange={(e) => setModifiedContent(e.target.value)}
                  rows={10}
                  className="w-full font-mono text-sm"
                  placeholder={t.codeadjustmentspanel1894}
                />
              </div>
            </div>

            {/* Analysis Results */}
            {analysisResult && (
              <div className="rounded p-4" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: colors.borderPrimary }}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{t.codeadjustmentspanel1903}</h4>
                  <div className="flex items-center gap-4">
                    <Tag
                      value={`${Math.round(analysisResult.confidence * 100)}% Confidence`}
                      severity={analysisResult.confidence >= 0.8 ? 'success' : 'warning'}
                    />
                    <Button
                      label={t.codeadjustmentspanel1910}
                      icon="pi pi-plus"
                      size="small"
                      onClick={openCreateFromAnalysisDialog}
                      disabled={analysisResult.insertions.length === 0}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 mb-4 text-sm">
                  <div className="p-2 rounded text-center" style={{ backgroundColor: colors.bgTertiary }}>
                    <div style={{ color: colors.textMuted }}>{t.codeadjustmentspanel1921}</div>
                    <div className="text-lg">{analysisResult.analysis.template_lines}</div>
                  </div>
                  <div className="p-2 rounded text-center" style={{ backgroundColor: colors.bgTertiary }}>
                    <div style={{ color: colors.textMuted }}>{t.codeadjustmentspanel1925}</div>
                    <div className="text-lg">{analysisResult.analysis.modified_lines}</div>
                  </div>
                  <div className="p-2 rounded text-center" style={{ backgroundColor: colors.bgTertiary }}>
                    <div style={{ color: colors.textMuted }}>{t.codeadjustmentspanel1929}</div>
                    <div className="text-lg" style={{ color: colors.successText }}>{analysisResult.analysis.common_lines}</div>
                  </div>
                  <div className="p-2 rounded text-center" style={{ backgroundColor: colors.bgTertiary }}>
                    <div style={{ color: colors.textMuted }}>{t.codeadjustmentspanel1933}</div>
                    <div className="text-lg" style={{ color: colors.accent }}>{analysisResult.analysis.added_lines}</div>
                  </div>
                  <div className="p-2 rounded text-center" style={{ backgroundColor: colors.bgTertiary }}>
                    <div style={{ color: colors.textMuted }}>{t.codeadjustmentspanel1937}</div>
                    <div className="text-lg" style={{ color: colors.errorText }}>{analysisResult.analysis.removed_lines}</div>
                  </div>
                </div>

                {analysisResult.insertions.length > 0 ? (
                  <DataTable
                    value={analysisResult.insertions}
                    size="small"
                    className="themed-datatable"
                    style={{
                      ['--dt-bg' as string]: colors.bgSecondary,
                      ['--dt-header-bg' as string]: colors.bgTertiary,
                      ['--dt-border' as string]: colors.borderPrimary,
                      ['--dt-text' as string]: colors.textPrimary,
                      ['--dt-text-secondary' as string]: colors.textSecondary,
                      ['--theme-accent' as string]: colors.accent,
                    }}
                  >
                    <Column
                      field="insertion_type"
                      header={t.codeadjustmentspanel1958}
                      body={(row) => getInsertionTypeTag(row.insertion_type)}
                      style={{ width: '100px' }}
                    />
                    <Column
                      field="anchor_text"
                      header={t.codeadjustmentspanel1964}
                      body={(row) => (
                        <pre className="text-xs p-1 rounded max-h-12 overflow-auto" style={{ backgroundColor: colors.bgTertiary }}>
                          {row.anchor_text.substring(0, 80)}
                          {row.anchor_text.length > 80 && '...'}
                        </pre>
                      )}
                    />
                    <Column
                      field="insertion_content"
                      header={t.codeadjustmentspanel1974}
                      body={(row) => (
                        <pre className="text-xs p-1 rounded max-h-12 overflow-auto" style={{ backgroundColor: colors.bgTertiary, color: colors.successText }}>
                          {row.insertion_content.substring(0, 100)}
                          {row.insertion_content.length > 100 && '...'}
                        </pre>
                      )}
                    />
                    <Column field="line_count" header={t.codeadjustmentspanel1980} style={{ width: '70px' }} />
                  </DataTable>
                ) : (
                  <div className="text-center py-4" style={{ color: colors.textMuted }}>
                    {t.codeadjustmentspanel1986}
                  </div>
                )}
              </div>
            )}
          </div>
        </TabPanel>

        {/* Tab 3: Verzeichnis Vergleich */}
        <TabPanel header={<span><i className="pi pi-folder mr-2" />{t.codeadjustmentspanel1993}</span>}>
          <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {/* Hidden file input for archive */}
            <input
              type="file"
              ref={directoryFileInputRef}
              onChange={handleDirectoryArchiveUpload}
              accept=".zip,.tar.gz,.tar.xz,.tgz"
              style={{ display: 'none' }}
            />

            {/* Generation Selection */}
            <div className="rounded p-3 mb-4" style={{ backgroundColor: colors.bgSecondary, borderWidth: '1px', borderStyle: 'solid', borderColor: colors.borderPrimary }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="pi pi-database" style={{ color: colors.accent }} />
                  <span className="text-sm font-medium">{t.codeadjustmentspanel2011}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Dropdown
                    value={selectedGenerationForCompare}
                    options={generations.map(g => ({
                      label: `#${g.generation_number} - ${g.filename} (${g.file_size_human})`,
                      value: g.id,
                    }))}
                    onChange={(e) => setSelectedGenerationForCompare(e.value)}
                    placeholder={generations.length > 0 ? t.codeadjustmentspanel2021 : t.codeadjustmentspanel2021_2}
                    className="w-80 text-sm"
                    loading={loadingGenerations}
                    disabled={generations.length === 0}
                  />
                  {generations.length === 0 && !loadingGenerations && (
                    <span className="text-xs text-yellow-400">
                      <i className="pi pi-info-circle mr-1" />
                      {t.codeadjustmentspanel2029}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Source Selection */}
            <div className="rounded p-4 mb-4" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: colors.borderPrimary }}>
              <h5 className="font-semibold mb-3">{t.codeadjustmentspanel2038}</h5>
              <div className="flex gap-4">
                <div
                  className="flex-1 p-4 rounded border-2 cursor-pointer transition-all"
                  style={{
                    borderColor: directorySource === 'upload' ? colors.accent : colors.borderSecondary,
                    backgroundColor: directorySource === 'upload' ? `${colors.accent}15` : 'transparent'
                  }}
                  onClick={() => setDirectorySource('upload')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <i className="pi pi-upload text-xl" style={{ color: colors.accent }} />
                    <span className="font-medium">{t.codeadjustmentspanel2050}</span>
                  </div>
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    ZIP, tar.gz oder tar.xz
                  </p>
                  {directorySource === 'upload' && (
                    <div className="mt-3">
                      <Button
                        label={uploadedArchive ? uploadedArchive.name : 'Archiv wählen...'}
                        icon="pi pi-file-import"
                        onClick={() => directoryFileInputRef.current?.click()}
                        className="w-full"
                        outlined={!uploadedArchive}
                        size="small"
                      />
                    </div>
                  )}
                </div>

                <div
                  className="flex-1 p-4 rounded border-2 cursor-pointer transition-all"
                  style={{
                    borderColor: directorySource === 'service' ? colors.successText : colors.borderSecondary,
                    backgroundColor: directorySource === 'service' ? `${colors.successText}15` : 'transparent'
                  }}
                  onClick={() => setDirectorySource('service')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <i className="pi pi-server text-xl" style={{ color: colors.successText }} />
                    <span className="font-medium">{t.codeadjustmentspanel2077}</span>
                  </div>
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    {t.codeadjustmentspanel2080}
                  </p>
                  {directorySource === 'service' && (
                    <div className="mt-3 text-xs text-yellow-700">
                      <i className="pi pi-info-circle mr-1" />
                      {t.codeadjustmentspanel2087}
                    </div>
                  )}
                </div>

                <div
                  className="flex-1 p-4 rounded border-2 cursor-pointer transition-all"
                  style={{
                    borderColor: directorySource === 'git' ? '#9333ea' : colors.borderSecondary,
                    backgroundColor: directorySource === 'git' ? 'rgba(147, 51, 234, 0.1)' : 'transparent'
                  }}
                  onClick={() => {
                    setDirectorySource('git');
                    if (gitProviders.length === 0) {
                      loadGitProviders();
                    }
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <i className="pi pi-github text-xl" style={{ color: '#a855f7' }} />
                    <span className="font-medium">{t.codeadjustmentspanel2107}</span>
                  </div>
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    {t.codeadjustmentspanel2110}
                  </p>
                  {directorySource === 'git' && (
                    <div className="mt-3 space-y-2">
                      {loadingGitProviders ? (
                        <div className="flex items-center gap-2 text-xs" style={{ color: colors.textMuted }}>
                          <ProgressSpinner style={{ width: '16px', height: '16px' }} />
                          {t.codeadjustmentspanel2117}
                        </div>
                      ) : gitProviders.length === 0 ? (
                        <div className="text-xs text-yellow-400">
                          <i className="pi pi-info-circle mr-1" />
                          {t.codeadjustmentspanel2122}
                        </div>
                      ) : (
                        <>
                          <Dropdown
                            value={selectedGitProvider}
                            options={gitProviders.map(p => ({
                              label: `${p.provider === 'github' ? 'GitHub' : 'GitLab'} (${p.username})`,
                              value: p.provider
                            }))}
                            onChange={(e) => {
                              setSelectedGitProvider(e.value);
                              loadGitRepositories(e.value);
                            }}
                            placeholder={t.codeadjustmentspanel2136}
                            className="w-full text-xs p-inputtext-sm"
                          />
                          {selectedGitProvider && (
                            <Dropdown
                              value={selectedRepository}
                              options={gitRepositories.map(r => ({
                                label: r.name,
                                value: r.full_name
                              }))}
                              onChange={(e) => {
                                setSelectedRepository(e.value);
                                loadGitBranches(selectedGitProvider, e.value);
                              }}
                              placeholder={t.codeadjustmentspanel2150}
                              className="w-full text-xs p-inputtext-sm"
                              loading={loadingRepositories}
                              disabled={loadingRepositories}
                              filter
                            />
                          )}
                          {selectedRepository && (
                            <Dropdown
                              value={selectedBranch}
                              options={gitBranches.map(b => ({
                                label: b.name,
                                value: b.name
                              }))}
                              onChange={(e) => setSelectedBranch(e.value)}
                              placeholder={t.codeadjustmentspanel2165}
                              className="w-full text-xs p-inputtext-sm"
                              loading={loadingBranches}
                              disabled={loadingBranches}
                              filter
                            />
                          )}
                          {selectedBranch && (
                            <InputText
                              value={gitDirectory}
                              onChange={(e) => setGitDirectory(e.target.value)}
                              placeholder={t.codeadjustmentspanel2176}
                              className="w-full text-xs"
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  label={t.codeadjustmentspanel2189}
                  icon={comparingDirectory ? 'pi pi-spin pi-spinner' : 'pi pi-play'}
                  onClick={startDirectoryComparison}
                  disabled={
                    comparingDirectory ||
                    !selectedGenerationForCompare ||
                    (directorySource === 'upload' && !uploadedArchive) ||
                    (directorySource === 'git' && (!selectedGitProvider || !selectedRepository || !selectedBranch))
                  }
                />
              </div>
            </div>

            {/* Comparison Results */}
            {directoryCompareResult && (
              <div className="rounded p-4" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: colors.borderPrimary }}>
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-semibold">{t.codeadjustmentspanel2206}</h5>
                  <div className="flex gap-3 text-sm">
                    <Tag value={`${directoryCompareResult.summary.added}${t.codeadjustmentspanel2208}`} severity="success" />
                    <Tag value={`${directoryCompareResult.summary.modified}${t.codeadjustmentspanel2209}`} severity="warning" />
                    <Tag value={`${directoryCompareResult.summary.deleted}${t.codeadjustmentspanel2210}`} severity="danger" />
                    <Tag value={`${directoryCompareResult.summary.unchanged}${t.codeadjustmentspanel2211}`} severity="info" />
                  </div>
                </div>

                {directoryCompareResult.files.filter(f => f.status !== 'unchanged').length > 0 ? (
                  <DataTable
                    value={directoryCompareResult.files.filter(f => f.status !== 'unchanged')}
                    size="small"
                    scrollable
                    scrollHeight="300px"
                    selectionMode="single"
                    selection={directoryCompareResult.files.find(f => f.path === selectedCompareFile)}
                    onSelectionChange={(e) => setSelectedCompareFile((e.value as any)?.path || null)}
                    className="themed-datatable"
                    style={{
                      ['--dt-bg' as string]: colors.bgSecondary,
                      ['--dt-header-bg' as string]: colors.bgTertiary,
                      ['--dt-border' as string]: colors.borderPrimary,
                      ['--dt-text' as string]: colors.textPrimary,
                      ['--dt-text-secondary' as string]: colors.textSecondary,
                      ['--theme-accent' as string]: colors.accent,
                    }}
                  >
                    <Column
                      field="status"
                      header={t.codeadjustmentspanel2234}
                      body={(row) => {
                        const severity = row.status === 'added' ? 'success' : row.status === 'modified' ? 'warning' : 'danger';
                        const label = row.status === 'added' ? 'Neu' : row.status === 'modified' ? t.codeadjustmentspanel2239 : t.codeadjustmentspanel2239_2;
                        return <Tag value={label} severity={severity} />;
                      }}
                      style={{ width: '100px' }}
                    />
                    <Column
                      field="path"
                      header={t.codeadjustmentspanel2246}
                      body={(row) => (
                        <span className="font-mono text-sm">{row.path}</span>
                      )}
                    />
                    <Column
                      header=""
                      body={(row) => (
                        <Button
                          icon="pi pi-search"
                          size="small"
                          text
                          tooltip={t.codeadjustmentspanel2258}
                          tooltipOptions={{ position: 'left' }}
                          onClick={() => loadFileForSingleComparison(row.path)}
                          disabled={row.status === 'deleted' || !row.template_content || !row.modified_content}
                        />
                      )}
                      style={{ width: '60px' }}
                    />
                  </DataTable>
                ) : (
                  <div className="text-center py-8" style={{ color: colors.textMuted }}>
                    <i className="pi pi-check-circle text-4xl mb-2" style={{ color: colors.successText }} />
                    <p>{t.codeadjustmentspanel2270}</p>
                  </div>
                )}

                {/* Batch create adjustments button - only show when there are modified files */}
                {directoryCompareResult.files.filter(f => f.status === 'modified').length > 0 && (
                  <div className="mt-4 flex items-center justify-between pt-4" style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: colors.borderPrimary }}>
                    <div className="text-sm" style={{ color: colors.textMuted }}>
                      {batchProgress ? (
                        <span className="flex items-center gap-2">
                          <i className="pi pi-spin pi-spinner" />
                          {t.codeadjustmentspanel2281}{batchProgress.current}/{batchProgress.total}: {batchProgress.currentFile}
                        </span>
                      ) : (
                        <span>
                          {directoryCompareResult.files.filter(f => f.status === 'modified').length}{t.codeadjustmentspanel2285}
                        </span>
                      )}
                    </div>
                    <Button
                      label={t.codeadjustmentspanel2290}
                      icon={creatingBatchAdjustments ? 'pi pi-spin pi-spinner' : 'pi pi-plus-circle'}
                      severity="success"
                      onClick={createBatchAdjustments}
                      disabled={creatingBatchAdjustments}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Help text when no comparison done yet */}
            {!directoryCompareResult && !comparingDirectory && (
              <div className="text-center py-8 rounded" style={{ color: colors.textMuted, borderWidth: '1px', borderStyle: 'dashed', borderColor: colors.borderPrimary }}>
                <i className="pi pi-folder-open text-4xl mb-3" />
                <p className="mb-2">{t.codeadjustmentspanel2305}</p>
                <p className="text-sm">
                  {t.codeadjustmentspanel2307}
                </p>
              </div>
            )}
          </div>
        </TabPanel>
      </TabViewSideMenu>
      </div>

      {/* Adjustment Dialog */}
      <Dialog
        header={editingAdjustment.id ? t.codeadjustmentspanel2317 : t.codeadjustmentspanel2317_2}
        visible={showAdjustmentDialog}
        onHide={() => setShowAdjustmentDialog(false)}
        style={{ width: '500px' }}
        footer={
          <div className="flex justify-end gap-2">
            <Button label={t.codeadjustmentspanel2323} text onClick={() => setShowAdjustmentDialog(false)} />
            <Button label={t.codeadjustmentspanel2324} onClick={saveAdjustment} />
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t.codeadjustmentspanel2328}</label>
            <InputText
              value={editingAdjustment.name || ''}
              onChange={(e) => {
                // Sanitize: only allow lowercase letters, numbers, and underscores
                const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                setEditingAdjustment({ ...editingAdjustment, name: sanitized });
              }}
              className="w-full"
            />
            <small className="mt-1 block" style={{ color: colors.textMuted }}>
              {t.codeadjustmentspanel2341}
            </small>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Datei-Pattern
              <span className="text-xs ml-2" style={{ color: colors.textMuted }}>{t.codeadjustmentspanel2345}</span>
            </label>
            <InputText
              value={editingAdjustment.file_pattern || ''}
              onChange={(e) => setEditingAdjustment({ ...editingAdjustment, file_pattern: e.target.value })}
              className="w-full font-mono"
              placeholder={t.codeadjustmentspanel2353}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.codeadjustmentspanel2357}</label>
            <InputTextarea
              value={editingAdjustment.description || ''}
              onChange={(e) => setEditingAdjustment({ ...editingAdjustment, description: e.target.value })}
              rows={2}
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t.codeadjustmentspanel2367}</label>
              <InputNumber
                value={editingAdjustment.min_confidence || 0.8}
                onValueChange={(e) => setEditingAdjustment({ ...editingAdjustment, min_confidence: e.value || 0.8 })}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                max={1}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.codeadjustmentspanel2380}</label>
              <InputNumber
                value={editingAdjustment.execution_order || 0}
                onValueChange={(e) => setEditingAdjustment({ ...editingAdjustment, execution_order: e.value || 0 })}
                min={0}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Dialog>

      {/* Insertion Dialog */}
      <Dialog
        header={editingInsertion.id ? t.codeadjustmentspanel2394 : t.codeadjustmentspanel2394_2}
        visible={showInsertionDialog}
        onHide={() => setShowInsertionDialog(false)}
        style={{ width: '700px' }}
        footer={
          <div className="flex justify-end gap-2">
            <Button label={t.codeadjustmentspanel2400} text onClick={() => setShowInsertionDialog(false)} />
            <Button label={t.codeadjustmentspanel2401} onClick={saveInsertion} />
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t.codeadjustmentspanel2406}</label>
              <Dropdown
                value={editingInsertion.insertion_type}
                options={insertionTypeOptions}
                onChange={(e) => setEditingInsertion({
                  ...editingInsertion,
                  insertion_type: e.value,
                  // Clear anchor_text when switching to 'beginning' type
                  anchor_text: e.value === 'beginning' ? '' : editingInsertion.anchor_text
                })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.codeadjustmentspanel2420}</label>
              <InputNumber
                value={editingInsertion.line_offset || 0}
                onValueChange={(e) => setEditingInsertion({ ...editingInsertion, line_offset: e.value || 0 })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.codeadjustmentspanel2428}</label>
              <InputNumber
                value={editingInsertion.insertion_order || 0}
                onValueChange={(e) => setEditingInsertion({ ...editingInsertion, insertion_order: e.value || 0 })}
                min={0}
                className="w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t.codeadjustmentspanel2441}
              <span className="text-xs ml-2" style={{ color: colors.textMuted }}>
                {editingInsertion.insertion_type === 'beginning'
                  ? t.codeadjustmentspanel2444
                  : t.codeadjustmentspanel2445}
              </span>
            </label>
            <InputTextarea
              value={editingInsertion.anchor_text || ''}
              onChange={(e) => setEditingInsertion({ ...editingInsertion, anchor_text: e.target.value })}
              rows={4}
              className="w-full font-mono text-sm"
              placeholder={editingInsertion.insertion_type === 'beginning'
                ? t.codeadjustmentspanel2454
                : t.codeadjustmentspanel2455}
              disabled={editingInsertion.insertion_type === 'beginning'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t.codeadjustmentspanel2461}
              <span className="text-xs ml-2" style={{ color: colors.textMuted }}>
                (Variablen: {Object.keys(availableVariables).join(', ')})
              </span>
            </label>
            <InputTextarea
              value={editingInsertion.insertion_content || ''}
              onChange={(e) => setEditingInsertion({ ...editingInsertion, insertion_content: e.target.value })}
              rows={6}
              className="w-full font-mono text-sm"
              placeholder={t.codeadjustmentspanel2471}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.codeadjustmentspanel2475}</label>
            <InputText
              value={editingInsertion.description || ''}
              onChange={(e) => setEditingInsertion({ ...editingInsertion, description: e.target.value })}
              className="w-full"
            />
          </div>
        </div>
      </Dialog>

      {/* Create from Analysis Dialog - Full editor for adjustment + insertions */}
      <Dialog
        header={t.codeadjustmentspanel2487}
        visible={showCreateFromAnalysisDialog}
        onHide={() => setShowCreateFromAnalysisDialog(false)}
        style={{ width: '900px' }}
        maximizable
        footer={
          <div className="flex justify-end gap-2">
            <Button label={t.codeadjustmentspanel2494} text onClick={() => setShowCreateFromAnalysisDialog(false)} />
            <Button
              label={t.codeadjustmentspanel2496}
              icon="pi pi-check"
              onClick={saveFromAnalysis}
              disabled={editableInsertions.length === 0 || !newAdjustmentData.name.trim()}
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t.codeadjustmentspanel2506}</label>
              <InputText
                value={newAdjustmentData.name}
                onChange={(e) => {
                  // Sanitize: only allow lowercase letters, numbers, and underscores
                  const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  setNewAdjustmentData({ ...newAdjustmentData, name: sanitized });
                }}
                className="w-full"
                placeholder={t.codeadjustmentspanel2517}
              />
              <small className="mt-1 block" style={{ color: colors.textMuted }}>
                {t.codeadjustmentspanel2520}
              </small>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.codeadjustmentspanel2525}
                <span className="text-xs ml-2" style={{ color: colors.textMuted }}>{t.codeadjustmentspanel2524}</span>
              </label>
              <InputText
                value={newAdjustmentData.file_pattern}
                onChange={(e) => setNewAdjustmentData({ ...newAdjustmentData, file_pattern: e.target.value })}
                className="w-full font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t.codeadjustmentspanel2537}</label>
            <InputTextarea
              value={newAdjustmentData.description}
              onChange={(e) => setNewAdjustmentData({ ...newAdjustmentData, description: e.target.value })}
              rows={2}
              className="w-full"
            />
          </div>

          {/* Insertions List */}
          <div className="rounded p-3" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: colors.borderPrimary }}>
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-semibold">
                {t.codeadjustmentspanel2550}({editableInsertions.length})
              </h5>
              <Button
                label={t.codeadjustmentspanel2553}
                icon="pi pi-plus"
                size="small"
                text
                onClick={addAnalysisInsertion}
              />
            </div>

            {editableInsertions.length > 0 ? (
              <DataTable
                value={editableInsertions}
                size="small"
                className="themed-datatable"
                style={{
                  ['--dt-bg' as string]: colors.bgSecondary,
                  ['--dt-header-bg' as string]: colors.bgTertiary,
                  ['--dt-border' as string]: colors.borderPrimary,
                  ['--dt-text' as string]: colors.textPrimary,
                  ['--dt-text-secondary' as string]: colors.textSecondary,
                  ['--theme-accent' as string]: colors.accent,
                }}
              >
                <Column
                  field="insertion_type"
                  header={t.codeadjustmentspanel2577}
                  body={(row) => getInsertionTypeTag(row.insertion_type)}
                  style={{ width: '100px' }}
                />
                <Column
                  field="anchor_text"
                  header={t.codeadjustmentspanel2583}
                  body={(row) => (
                    <pre className="text-xs p-1 rounded max-h-10 overflow-auto" style={{ backgroundColor: colors.bgTertiary }}>
                      {row.anchor_text.substring(0, 60)}
                      {row.anchor_text.length > 60 && '...'}
                    </pre>
                  )}
                />
                <Column
                  field="insertion_content"
                  header={t.codeadjustmentspanel2593}
                  body={(row) => (
                    <pre className="text-xs p-1 rounded max-h-10 overflow-auto" style={{ backgroundColor: colors.bgTertiary, color: colors.successText }}>
                      {row.insertion_content.substring(0, 80)}
                      {row.insertion_content.length > 80 && '...'}
                    </pre>
                  )}
                />
                <Column
                  header=""
                  body={(_, options) => (
                    <div className="flex gap-1">
                      <Button
                        icon="pi pi-pencil"
                        size="small"
                        text
                        tooltip={t.codeadjustmentspanel2609}
                        onClick={() => startEditAnalysisInsertion(options.rowIndex)}
                      />
                      <Button
                        icon="pi pi-trash"
                        size="small"
                        text
                        severity="danger"
                        tooltip={t.codeadjustmentspanel2617}
                        onClick={() => deleteAnalysisInsertion(options.rowIndex)}
                      />
                    </div>
                  )}
                  style={{ width: '80px' }}
                />
              </DataTable>
            ) : (
              <div className="text-center py-4" style={{ color: colors.textMuted }}>
                {t.codeadjustmentspanel2627}
              </div>
            )}
          </div>
        </div>
      </Dialog>

      {/* Edit Analysis Insertion Dialog */}
      <Dialog
        header={editingAnalysisInsertionIndex !== null ? `${t.codeadjustmentspanel2636}${editingAnalysisInsertionIndex + 1}${t.codeadjustmentspanel2636_2}` : t.codeadjustmentspanel2636_3}
        visible={showAnalysisInsertionDialog}
        onHide={() => {
          setShowAnalysisInsertionDialog(false);
          setEditingAnalysisInsertion(null);
          setEditingAnalysisInsertionIndex(null);
        }}
        style={{ width: '700px' }}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label={t.codeadjustmentspanel2647}
              text
              onClick={() => {
                setShowAnalysisInsertionDialog(false);
                setEditingAnalysisInsertion(null);
                setEditingAnalysisInsertionIndex(null);
              }}
            />
            <Button label={t.codeadjustmentspanel2655} icon="pi pi-check" onClick={saveAnalysisInsertion} />
          </div>
        }
      >
        {editingAnalysisInsertion && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t.codeadjustmentspanel2663}</label>
                <Dropdown
                  value={editingAnalysisInsertion.insertion_type}
                  options={insertionTypeOptions}
                  onChange={(e) => setEditingAnalysisInsertion({ ...editingAnalysisInsertion, insertion_type: e.value })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.codeadjustmentspanel2672}</label>
                <InputNumber
                  value={editingAnalysisInsertion.line_offset}
                  onValueChange={(e) => setEditingAnalysisInsertion({ ...editingAnalysisInsertion, line_offset: e.value || 0 })}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t.codeadjustmentspanel2683}
                <span className="text-xs ml-2" style={{ color: colors.textMuted }}>{t.codeadjustmentspanel2682}</span>
              </label>
              <InputTextarea
                value={editingAnalysisInsertion.anchor_text}
                onChange={(e) => setEditingAnalysisInsertion({ ...editingAnalysisInsertion, anchor_text: e.target.value })}
                rows={4}
                className="w-full font-mono text-sm"
                placeholder={t.codeadjustmentspanel2691}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t.codeadjustmentspanel2697}
                <span className="text-xs ml-2" style={{ color: colors.textMuted }}>
                  ({t.codeadjustmentspanel2699}{Object.keys(availableVariables).join(', ')})
                </span>
              </label>
              <InputTextarea
                value={editingAnalysisInsertion.insertion_content}
                onChange={(e) => setEditingAnalysisInsertion({ ...editingAnalysisInsertion, insertion_content: e.target.value })}
                rows={6}
                className="w-full font-mono text-sm"
                placeholder={t.codeadjustmentspanel2707}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t.codeadjustmentspanel2712}</label>
              <InputText
                value={editingAnalysisInsertion.description || ''}
                onChange={(e) => setEditingAnalysisInsertion({ ...editingAnalysisInsertion, description: e.target.value })}
                className="w-full"
                placeholder={t.codeadjustmentspanel2717_2}
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        header={t.codeadjustmentspanel2726}
        visible={showImportDialog}
        onHide={() => {
          setShowImportDialog(false);
          setImportFile(null);
        }}
        style={{ width: '500px' }}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label={t.codeadjustmentspanel2736}
              text
              onClick={() => {
                setShowImportDialog(false);
                setImportFile(null);
              }}
            />
            <Button
              label={importing ? t.codeadjustmentspanel2744 : t.codeadjustmentspanel2744_2}
              icon={importing ? 'pi pi-spin pi-spinner' : 'pi pi-upload'}
              onClick={importAdjustments}
              disabled={!importFile || importing}
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Hidden file input */}
          <input
            type="file"
            ref={importFileInputRef}
            onChange={handleImportFileSelect}
            accept=".json"
            style={{ display: 'none' }}
          />

          {/* File selection */}
          <div>
            <label className="block text-sm font-medium mb-2">{t.codeadjustmentspanel2762}</label>
            <div className="flex items-center gap-2">
              <Button
                label={importFile ? importFile.name : t.codeadjustmentspanel2767}
                icon="pi pi-file"
                onClick={() => importFileInputRef.current?.click()}
                className="flex-1"
                outlined={!importFile}
              />
              {importFile && (
                <Button
                  icon="pi pi-times"
                  severity="danger"
                  text
                  onClick={() => setImportFile(null)}
                />
              )}
            </div>
          </div>

          {/* Import mode selection */}
          <div>
            <label className="block text-sm font-medium mb-2">{t.codeadjustmentspanel2784}</label>
            <div className="flex flex-col gap-2">
              <div
                className="p-3 rounded border-2 cursor-pointer transition-all"
                style={{
                  borderColor: importMode === 'merge' ? colors.accent : colors.borderSecondary,
                  backgroundColor: importMode === 'merge' ? `${colors.accent}15` : 'transparent'
                }}
                onClick={() => setImportMode('merge')}
              >
                <div className="flex items-center gap-2">
                  <i className={`pi ${importMode === 'merge' ? 'pi-check-circle' : 'pi-circle'}`} style={{ color: importMode === 'merge' ? colors.accent : colors.textMuted }} />
                  <span className="font-medium">{t.codeadjustmentspanel2796}</span>
                </div>
                <p className="text-sm mt-1 ml-6" style={{ color: colors.textMuted }}>
                  {t.codeadjustmentspanel2801}
                </p>
              </div>

              <div
                className="p-3 rounded border-2 cursor-pointer transition-all"
                style={{
                  borderColor: importMode === 'replace' ? colors.warningText : colors.borderSecondary,
                  backgroundColor: importMode === 'replace' ? `${colors.warningText}15` : 'transparent'
                }}
                onClick={() => setImportMode('replace')}
              >
                <div className="flex items-center gap-2">
                  <i className={`pi ${importMode === 'replace' ? 'pi-check-circle' : 'pi-circle'}`} style={{ color: importMode === 'replace' ? colors.warningText : colors.textMuted }} />
                  <span className="font-medium">{t.codeadjustmentspanel2815}</span>
                </div>
                <p className="text-sm mt-1 ml-6" style={{ color: colors.textMuted }}>
                  <span style={{ color: colors.warningText }}>{t.codeadjustmentspanel2818_2}</span>{t.codeadjustmentspanel2818}
                </p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="rounded p-3 text-sm" style={{ backgroundColor: colors.bgSecondary, color: colors.textMuted }}>
            <div className="flex items-start gap-2">
              <i className="pi pi-info-circle mt-0.5" style={{ color: colors.accent }} />
              <div>
                <p>{t.codeadjustmentspanel2829}</p>
                <p className="mt-1">{t.codeadjustmentspanel2830}</p>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default CodeAdjustmentsPanel;
