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
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { InputSwitch } from 'primereact/inputswitch';
import { Tag } from 'primereact/tag';
import { TabContentProps } from '@/types';
import { useProject } from '@/contexts/ProjectContext';
import { useTranslation, getStoredLanguage } from '@/i18n';

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

const CodeAdjustmentsPanel: React.FC<TabContentProps> = () => {
  const toast = useRef<Toast>(null);
  const templateFileInputRef = useRef<HTMLInputElement>(null);
  const modifiedFileInputRef = useRef<HTMLInputElement>(null);
  const { selectedProject } = useProject();
  const t = useTranslation(getStoredLanguage());

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
  const [directorySource, setDirectorySource] = useState<'upload' | 'service'>('upload');
  const [uploadedArchive, setUploadedArchive] = useState<File | null>(null);
  const [selectedGenerationForCompare, setSelectedGenerationForCompare] = useState<number | null>(null);
  const [comparingDirectory, setComparingDirectory] = useState(false);
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

  // ========== API CALLS ==========

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }, []);

  const loadAdjustments = useCallback(async () => {
    if (!selectedProject?.id) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/code-adjustments`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        setAdjustments(data.data);
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: data.message || 'Failed to load adjustments',
        });
      }
    } catch (error) {
      console.error('Load adjustments error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Network error loading adjustments',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedProject?.id, getAuthHeaders]);

  const loadVariables = useCallback(async () => {
    try {
      const response = await fetch('/api/code-adjustments/variables', {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setAvailableVariables(data.data);
      }
    } catch (error) {
      console.error('Load variables error:', error);
    }
  }, [getAuthHeaders]);

  const loadGenerations = useCallback(async () => {
    if (!selectedProject?.id) return;

    setLoadingGenerations(true);
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/generations`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
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
  }, [selectedProject?.id, getAuthHeaders, selectedGenerationId, selectedGenerationForCompare]);

  const loadGenerationFiles = useCallback(async (generationId: number) => {
    if (!selectedProject?.id) return;

    setLoadingFiles(true);
    setGenerationFiles([]);
    try {
      const response = await fetch(
        `/api/projects/${selectedProject.id}/generations/${generationId}/files`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      if (data.success) {
        setGenerationFiles(data.data.files);
      }
    } catch (error) {
      console.error('Load generation files error:', error);
    } finally {
      setLoadingFiles(false);
    }
  }, [selectedProject?.id, getAuthHeaders]);

  const fetchFileFromGeneration = useCallback(async () => {
    if (!selectedProject?.id || !selectedGenerationId || !selectedFilePath) return;

    setFetchingFile(true);
    try {
      const response = await fetch(
        `/api/projects/${selectedProject.id}/generations/${selectedGenerationId}/fetch-file`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ file_path: selectedFilePath }),
        }
      );
      const data = await response.json();
      if (data.success) {
        setTemplateContent(data.data.content);
        setAnalysisFilename(data.data.file_path);
        toast.current?.show({
          severity: 'success',
          summary: 'Geladen',
          detail: `"${data.data.file_path}" aus Generierung geladen`,
        });
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Fehler',
          detail: data.message || 'Datei konnte nicht geladen werden',
        });
      }
    } catch (error) {
      console.error('Fetch file error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Fehler',
        detail: 'Netzwerkfehler beim Laden der Datei',
      });
    } finally {
      setFetchingFile(false);
    }
  }, [selectedProject?.id, selectedGenerationId, selectedFilePath, getAuthHeaders]);

  useEffect(() => {
    loadAdjustments();
    loadVariables();
    loadGenerations();
  }, [loadAdjustments, loadVariables, loadGenerations]);

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
    const url = isNew
      ? `/api/projects/${selectedProject.id}/code-adjustments`
      : `/api/projects/${selectedProject.id}/code-adjustments/${editingAdjustment.id}`;

    try {
      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editingAdjustment),
      });
      const data = await response.json();

      if (data.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: isNew ? 'Adjustment created' : 'Adjustment updated',
        });
        setShowAdjustmentDialog(false);
        loadAdjustments();
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: data.message || 'Failed to save adjustment',
        });
      }
    } catch (error) {
      console.error('Save adjustment error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Network error saving adjustment',
      });
    }
  };

  const deleteAdjustment = async (adjustment: CodeAdjustment) => {
    confirmDialog({
      message: `Delete adjustment "${adjustment.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          const response = await fetch(
            `/api/projects/${selectedProject?.id}/code-adjustments/${adjustment.id}`,
            { method: 'DELETE', headers: getAuthHeaders() }
          );
          const data = await response.json();

          if (data.success) {
            toast.current?.show({
              severity: 'success',
              summary: 'Deleted',
              detail: 'Adjustment deleted successfully',
            });
            if (selectedAdjustment?.id === adjustment.id) {
              setSelectedAdjustment(null);
            }
            loadAdjustments();
          }
        } catch (error) {
          console.error('Delete error:', error);
        }
      },
    });
  };

  const toggleActive = async (adjustment: CodeAdjustment) => {
    try {
      const response = await fetch(
        `/api/projects/${selectedProject?.id}/code-adjustments/${adjustment.id}/toggle`,
        { method: 'PATCH', headers: getAuthHeaders() }
      );
      const data = await response.json();

      if (data.success) {
        loadAdjustments();
      }
    } catch (error) {
      console.error('Toggle error:', error);
    }
  };

  const duplicateAdjustment = async (adjustment: CodeAdjustment) => {
    try {
      const response = await fetch(
        `/api/projects/${selectedProject?.id}/code-adjustments/${adjustment.id}/duplicate`,
        { method: 'POST', headers: getAuthHeaders() }
      );
      const data = await response.json();

      if (data.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Duplicated',
          detail: 'Adjustment duplicated successfully',
        });
        loadAdjustments();
      }
    } catch (error) {
      console.error('Duplicate error:', error);
    }
  };

  // ========== INSERTION OPERATIONS ==========

  const saveInsertion = async () => {
    if (!selectedAdjustment?.id || !selectedProject?.id) return;

    const isNew = !editingInsertion.id;
    const url = isNew
      ? `/api/projects/${selectedProject.id}/code-adjustments/${selectedAdjustment.id}/insertions`
      : `/api/projects/${selectedProject.id}/code-adjustments/${selectedAdjustment.id}/insertions/${editingInsertion.id}`;

    try {
      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editingInsertion),
      });
      const data = await response.json();

      if (data.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: isNew ? 'Insertion added' : 'Insertion updated',
        });
        setShowInsertionDialog(false);
        loadAdjustments();
      }
    } catch (error) {
      console.error('Save insertion error:', error);
    }
  };

  const deleteInsertion = async (insertion: CodeAdjustmentInsertion) => {
    if (!selectedAdjustment?.id || !selectedProject?.id) return;

    confirmDialog({
      message: 'Delete this insertion?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          const response = await fetch(
            `/api/projects/${selectedProject.id}/code-adjustments/${selectedAdjustment.id}/insertions/${insertion.id}`,
            { method: 'DELETE', headers: getAuthHeaders() }
          );
          const data = await response.json();

          if (data.success) {
            toast.current?.show({
              severity: 'success',
              summary: 'Deleted',
              detail: 'Insertion deleted',
            });
            loadAdjustments();
          }
        } catch (error) {
          console.error('Delete insertion error:', error);
        }
      },
    });
  };

  // ========== REVERSE ENGINEERING ==========

  const analyzeCode = async () => {
    if (!templateContent || !modifiedContent || !analysisFilename) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Missing Data',
        detail: 'Please provide template content, modified content, and filename',
      });
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/code-adjustments/analyze', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          template_content: templateContent,
          modified_content: modifiedContent,
          filename: analysisFilename,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data.data);
        toast.current?.show({
          severity: 'success',
          summary: 'Analysis Complete',
          detail: `Found ${data.data.insertions.length} insertions (${Math.round(data.data.confidence * 100)}% confidence)`,
        });
      }
    } catch (error) {
      console.error('Analyze error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Analysis failed',
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
        summary: 'Hochgeladen',
        detail: `Template "${file.name}" geladen`,
      });
    };
    reader.onerror = () => {
      toast.current?.show({
        severity: 'error',
        summary: 'Fehler',
        detail: 'Datei konnte nicht gelesen werden',
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
        summary: 'Hochgeladen',
        detail: `Modifizierte Datei "${file.name}" geladen`,
      });
    };
    reader.onerror = () => {
      toast.current?.show({
        severity: 'error',
        summary: 'Fehler',
        detail: 'Datei konnte nicht gelesen werden',
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
        summary: 'Ungültiges Format',
        detail: 'Bitte laden Sie eine ZIP, tar.gz oder tar.xz Datei hoch',
      });
      return;
    }

    setUploadedArchive(file);
    setDirectoryCompareResult(null);
    toast.current?.show({
      severity: 'success',
      summary: 'Archiv geladen',
      detail: `"${file.name}" bereit zum Vergleichen`,
    });
    event.target.value = '';
  };

  const startDirectoryComparison = async () => {
    if (!selectedProject?.id) return;

    if (directorySource === 'upload' && !uploadedArchive) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Kein Archiv',
        detail: 'Bitte laden Sie zuerst ein Archiv hoch',
      });
      return;
    }

    if (!selectedGenerationForCompare) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Keine Referenz',
        detail: 'Bitte wählen Sie eine Referenz-Generierung aus',
      });
      return;
    }

    setComparingDirectory(true);
    setDirectoryCompareResult(null);

    try {
      const formData = new FormData();
      formData.append('project_id', selectedProject.id.toString());
      formData.append('generation_id', selectedGenerationForCompare.toString());
      formData.append('source', directorySource);

      if (directorySource === 'upload' && uploadedArchive) {
        formData.append('archive', uploadedArchive);
      }

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch('/api/code-adjustments/compare-directory', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setDirectoryCompareResult(data.data);
        toast.current?.show({
          severity: 'success',
          summary: 'Vergleich abgeschlossen',
          detail: `${data.data.summary.modified} geänderte Dateien gefunden`,
        });
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Fehler',
          detail: data.message || 'Vergleich fehlgeschlagen',
        });
      }
    } catch (error) {
      console.error('Directory comparison error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Fehler',
        detail: 'Netzwerkfehler beim Vergleich',
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
        summary: 'Datei geladen',
        detail: `"${filePath}" in Einzelcode Vergleich geladen`,
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
      description: 'Erstellt aus Code-Vergleich',
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
        summary: 'Fehler',
        detail: 'Bitte einen Namen eingeben',
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${selectedProject.id}/code-adjustments/from-analysis`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
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
          }),
        }
      );
      const data = await response.json();

      if (data.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Erstellt',
          detail: 'Anpassung wurde erstellt',
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
          summary: 'Fehler',
          detail: data.message || 'Fehler beim Erstellen',
        });
      }
    } catch (error) {
      console.error('Create from analysis error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Fehler',
        detail: 'Netzwerkfehler',
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
        summary: 'Keine Dateien',
        detail: 'Keine geänderten Dateien mit Inhalt gefunden',
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
          const analyzeResponse = await fetch('/api/code-adjustments/analyze', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              template_content: file.template_content,
              modified_content: file.modified_content,
              filename: file.path,
            }),
          });
          const analyzeData = await analyzeResponse.json();

          if (!analyzeData.success || !analyzeData.data.insertions || analyzeData.data.insertions.length === 0) {
            // No insertions found or analysis failed, skip
            console.log(`[BATCH] No insertions for ${file.path}`);
            continue;
          }

          // Step 2: Create the adjustment with insertions
          const insertions = analyzeData.data.insertions;
          const adjustmentName = file.path.split('/').pop() || file.path; // Use filename as name

          const createResponse = await fetch(
            `/api/projects/${selectedProject.id}/code-adjustments/from-analysis`,
            {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify({
                name: `Auto: ${adjustmentName}`,
                description: `Automatisch erstellt aus Verzeichnis-Vergleich`,
                file_pattern: file.path,
                insertions: insertions.map((ins: AnalysisInsertion) => ({
                  insertion_type: ins.insertion_type,
                  anchor_text: ins.anchor_text,
                  insertion_content: ins.insertion_content,
                  line_offset: ins.line_offset,
                  description: `${ins.line_count} Zeile(n) hinzugefügt`,
                })),
              }),
            }
          );
          const createData = await createResponse.json();

          if (createData.success) {
            successCount++;
            console.log(`[BATCH] Created adjustment for ${file.path}`);
          } else {
            errorCount++;
            console.error(`[BATCH] Failed to create adjustment for ${file.path}:`, createData.message);
          }
        } catch (fileError) {
          errorCount++;
          console.error(`[BATCH] Error processing ${file.path}:`, fileError);
        }
      }

      // Show summary
      if (successCount > 0) {
        toast.current?.show({
          severity: 'success',
          summary: 'Batch abgeschlossen',
          detail: `${successCount} Anpassung(en) erstellt${errorCount > 0 ? `, ${errorCount} Fehler` : ''}`,
          life: 5000,
        });
        // Reload adjustments and switch to management tab
        loadAdjustments();
        setActiveTabIndex(0);
      } else if (errorCount > 0) {
        toast.current?.show({
          severity: 'error',
          summary: 'Fehler',
          detail: `Keine Anpassungen erstellt, ${errorCount} Fehler`,
          life: 5000,
        });
      } else {
        toast.current?.show({
          severity: 'info',
          summary: 'Keine Änderungen',
          detail: 'Keine Anpassungen erforderlich',
          life: 3000,
        });
      }
    } catch (error) {
      console.error('Batch creation error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Fehler',
        detail: 'Batch-Verarbeitung fehlgeschlagen',
      });
    } finally {
      setCreatingBatchAdjustments(false);
      setBatchProgress(null);
    }
  };

  // ========== RENDER HELPERS ==========

  const insertionTypeOptions = [
    { label: 'Beginning', value: 'beginning' },
    { label: 'End', value: 'end' },
    { label: 'Middle', value: 'middle' },
  ];

  const getInsertionTypeTag = (type: string) => {
    const severity = type === 'beginning' ? 'info' : type === 'end' ? 'success' : 'warning';
    return <Tag value={type} severity={severity} />;
  };

  // ========== NO PROJECT SELECTED ==========

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <i className="pi pi-folder-open text-4xl mb-2" />
          <p>Please select a project first</p>
        </div>
      </div>
    );
  }

  // ========== MAIN RENDER ==========

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <i className="pi pi-sliders-h text-xl text-blue-400" />
          <h2 className="text-lg font-semibold">Code Anpassungen</h2>
          <Tag value={selectedProject.name} severity="info" />
        </div>
        <Button
          label="Neue Anpassung"
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

      {/* Tabs */}
      <TabView
        activeIndex={activeTabIndex}
        onTabChange={(e) => setActiveTabIndex(e.index)}
        className="flex-1 flex flex-col"
      >
        {/* Tab 1: Management */}
        <TabPanel header="Verwaltung" leftIcon="pi pi-list mr-2">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <ProgressSpinner />
            </div>
          ) : (
            <Splitter className="h-full" style={{ minHeight: '400px' }}>
              {/* Left: Adjustments List */}
              <SplitterPanel size={35} minSize={20}>
                <div className="p-2">
                  <DataTable
                    value={adjustments}
                    selection={selectedAdjustment}
                    selectionMode="single"
                    onSelectionChange={(e) => setSelectedAdjustment(e.value as CodeAdjustment)}
                    scrollable
                    scrollHeight="flex"
                    emptyMessage="Keine Anpassungen vorhanden"
                    size="small"
                    className="text-sm"
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
                      header="Datei-Pattern"
                      style={{ maxWidth: '150px' }}
                      body={(row: CodeAdjustment) => (
                        <span className="text-xs font-mono text-gray-400">{row.file_pattern}</span>
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
              <SplitterPanel size={65} minSize={30}>
                <div className="p-3">
                  {selectedAdjustment ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold">{selectedAdjustment.name}</h3>
                        <Button
                          label="Insertion hinzufugen"
                          icon="pi pi-plus"
                          size="small"
                          onClick={() => {
                            setEditingInsertion({
                              insertion_type: 'middle',
                              anchor_text: '',
                              insertion_content: '',
                              line_offset: 0,
                              insertion_order: selectedAdjustment.insertions?.length || 0,
                            });
                            setShowInsertionDialog(true);
                          }}
                        />
                      </div>

                      {/* Meta info */}
                      <div className="grid grid-cols-3 gap-2 mb-4 text-sm text-gray-400">
                        <div>
                          <span className="font-medium">Pattern:</span>{' '}
                          <code className="text-blue-300">{selectedAdjustment.file_pattern}</code>
                        </div>
                        <div>
                          <span className="font-medium">Confidence:</span>{' '}
                          {Math.round(selectedAdjustment.min_confidence * 100)}%
                        </div>
                        <div>
                          <span className="font-medium">Order:</span>{' '}
                          {selectedAdjustment.execution_order}
                        </div>
                      </div>

                      {/* Insertions Table */}
                      <DataTable
                        value={selectedAdjustment.insertions || []}
                        emptyMessage="Keine Insertions"
                        size="small"
                      >
                        <Column
                          field="insertion_type"
                          header="Typ"
                          body={(row: CodeAdjustmentInsertion) => getInsertionTypeTag(row.insertion_type)}
                          style={{ width: '100px' }}
                        />
                        <Column
                          field="anchor_text"
                          header="Anker"
                          body={(row: CodeAdjustmentInsertion) => (
                            <pre className="text-xs bg-gray-800 p-1 rounded max-h-16 overflow-auto">
                              {row.anchor_text.substring(0, 100)}
                              {row.anchor_text.length > 100 && '...'}
                            </pre>
                          )}
                        />
                        <Column
                          field="insertion_content"
                          header="Code"
                          body={(row: CodeAdjustmentInsertion) => (
                            <pre className="text-xs bg-gray-800 p-1 rounded max-h-16 overflow-auto text-green-300">
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
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <i className="pi pi-arrow-left text-3xl mb-2" />
                        <p>Wahle eine Anpassung aus der Liste</p>
                      </div>
                    </div>
                  )}
                </div>
              </SplitterPanel>
            </Splitter>
          )}
        </TabPanel>

        {/* Tab 2: Einzelcode Vergleich */}
        <TabPanel header="Einzelcode Vergleich" leftIcon="pi pi-file mr-2">
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
              <div className="border border-gray-700 rounded p-3 mb-4 bg-gray-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <i className="pi pi-bolt text-yellow-400" />
                  <span className="text-sm font-medium">Schnellauswahl aus Generierung</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Generierung</label>
                    <Dropdown
                      value={selectedGenerationId}
                      options={generations.map(g => ({
                        label: `#${g.generation_number} - ${new Date(g.created_at).toLocaleDateString('de-DE')}`,
                        value: g.id,
                      }))}
                      onChange={(e) => {
                        setSelectedGenerationId(e.value);
                        setSelectedFilePath(null);
                      }}
                      placeholder="Generierung wählen..."
                      className="w-full text-sm"
                      loading={loadingGenerations}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Datei aus Archiv</label>
                    <Dropdown
                      value={selectedFilePath}
                      options={generationFiles.map(f => ({
                        label: f.path,
                        value: f.path,
                      }))}
                      onChange={(e) => setSelectedFilePath(e.value)}
                      placeholder="Datei wählen..."
                      className="w-full text-sm font-mono"
                      filter
                      filterPlaceholder="Suchen..."
                      loading={loadingFiles}
                      disabled={!selectedGenerationId}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      label="Laden"
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
                  Datei-Pattern
                  <span className="text-gray-400 text-xs ml-2">(%1 = Tabellenname, %2 = Sprache)</span>
                </label>
                <InputText
                  value={analysisFilename}
                  onChange={(e) => setAnalysisFilename(e.target.value)}
                  placeholder="z.B. table_%1.php oder index.php"
                  className="w-full font-mono"
                />
              </div>
              <Button
                label="Analysieren"
                icon={analyzing ? 'pi pi-spin pi-spinner' : 'pi pi-search'}
                onClick={analyzeCode}
                disabled={analyzing || !templateContent || !modifiedContent}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Original (Template-Output)</label>
                  <Button
                    icon="pi pi-upload"
                    size="small"
                    text
                    tooltip="Datei hochladen"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => templateFileInputRef.current?.click()}
                  />
                </div>
                <InputTextarea
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  rows={10}
                  className="w-full font-mono text-sm"
                  placeholder="Original generierten Code hier einfügen oder Datei hochladen..."
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Modifiziert (Ihre Änderungen)</label>
                  <Button
                    icon="pi pi-upload"
                    size="small"
                    text
                    tooltip="Datei hochladen"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => modifiedFileInputRef.current?.click()}
                  />
                </div>
                <InputTextarea
                  value={modifiedContent}
                  onChange={(e) => setModifiedContent(e.target.value)}
                  rows={10}
                  className="w-full font-mono text-sm"
                  placeholder="Modifizierten Code hier einfügen oder Datei hochladen..."
                />
              </div>
            </div>

            {/* Analysis Results */}
            {analysisResult && (
              <div className="border border-gray-700 rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Analyse-Ergebnis</h4>
                  <div className="flex items-center gap-4">
                    <Tag
                      value={`${Math.round(analysisResult.confidence * 100)}% Confidence`}
                      severity={analysisResult.confidence >= 0.8 ? 'success' : 'warning'}
                    />
                    <Button
                      label="Anpassung erstellen..."
                      icon="pi pi-plus"
                      size="small"
                      onClick={openCreateFromAnalysisDialog}
                      disabled={analysisResult.insertions.length === 0}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 mb-4 text-sm">
                  <div className="bg-gray-800 p-2 rounded text-center">
                    <div className="text-gray-400">Template</div>
                    <div className="text-lg">{analysisResult.analysis.template_lines}</div>
                  </div>
                  <div className="bg-gray-800 p-2 rounded text-center">
                    <div className="text-gray-400">Modified</div>
                    <div className="text-lg">{analysisResult.analysis.modified_lines}</div>
                  </div>
                  <div className="bg-gray-800 p-2 rounded text-center">
                    <div className="text-gray-400">Common</div>
                    <div className="text-lg text-green-400">{analysisResult.analysis.common_lines}</div>
                  </div>
                  <div className="bg-gray-800 p-2 rounded text-center">
                    <div className="text-gray-400">Added</div>
                    <div className="text-lg text-blue-400">{analysisResult.analysis.added_lines}</div>
                  </div>
                  <div className="bg-gray-800 p-2 rounded text-center">
                    <div className="text-gray-400">Removed</div>
                    <div className="text-lg text-red-400">{analysisResult.analysis.removed_lines}</div>
                  </div>
                </div>

                {analysisResult.insertions.length > 0 ? (
                  <DataTable value={analysisResult.insertions} size="small">
                    <Column
                      field="insertion_type"
                      header="Typ"
                      body={(row) => getInsertionTypeTag(row.insertion_type)}
                      style={{ width: '100px' }}
                    />
                    <Column
                      field="anchor_text"
                      header="Anker-Text"
                      body={(row) => (
                        <pre className="text-xs bg-gray-800 p-1 rounded max-h-12 overflow-auto">
                          {row.anchor_text.substring(0, 80)}
                          {row.anchor_text.length > 80 && '...'}
                        </pre>
                      )}
                    />
                    <Column
                      field="insertion_content"
                      header="Einzufügender Code"
                      body={(row) => (
                        <pre className="text-xs bg-gray-800 p-1 rounded max-h-12 overflow-auto text-green-300">
                          {row.insertion_content.substring(0, 100)}
                          {row.insertion_content.length > 100 && '...'}
                        </pre>
                      )}
                    />
                    <Column field="line_count" header="Zeilen" style={{ width: '70px' }} />
                  </DataTable>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    Keine Änderungen erkannt
                  </div>
                )}
              </div>
            )}
          </div>
        </TabPanel>

        {/* Tab 3: Verzeichnis Vergleich */}
        <TabPanel header="Verzeichnis Vergleich" leftIcon="pi pi-folder mr-2">
          <div className="p-4">
            {/* Hidden file input for archive */}
            <input
              type="file"
              ref={directoryFileInputRef}
              onChange={handleDirectoryArchiveUpload}
              accept=".zip,.tar.gz,.tar.xz,.tgz"
              style={{ display: 'none' }}
            />

            {/* Generation Selection */}
            <div className="border border-gray-700 rounded p-3 mb-4 bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="pi pi-database text-blue-400" />
                  <span className="text-sm font-medium">Referenz-Generierung (Original)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Dropdown
                    value={selectedGenerationForCompare}
                    options={generations.map(g => ({
                      label: `#${g.generation_number} - ${g.filename} (${g.file_size_human})`,
                      value: g.id,
                    }))}
                    onChange={(e) => setSelectedGenerationForCompare(e.value)}
                    placeholder={generations.length > 0 ? 'Generierung wählen...' : 'Keine Generierungen'}
                    className="w-80 text-sm"
                    loading={loadingGenerations}
                    disabled={generations.length === 0}
                  />
                  {generations.length === 0 && !loadingGenerations && (
                    <span className="text-xs text-yellow-400">
                      <i className="pi pi-info-circle mr-1" />
                      Generieren Sie zuerst ein Projekt
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Source Selection */}
            <div className="border border-gray-700 rounded p-4 mb-4">
              <h5 className="font-semibold mb-3">Quelle für modifizierte Dateien</h5>
              <div className="flex gap-6">
                <div
                  className={`flex-1 p-4 rounded border-2 cursor-pointer transition-all ${
                    directorySource === 'upload'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => setDirectorySource('upload')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <i className="pi pi-upload text-xl text-blue-400" />
                    <span className="font-medium">Archiv hochladen</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Laden Sie Ihr modifiziertes Projekt als ZIP, tar.gz oder tar.xz hoch
                  </p>
                  {directorySource === 'upload' && (
                    <div className="mt-3">
                      <Button
                        label={uploadedArchive ? uploadedArchive.name : 'Archiv wählen...'}
                        icon="pi pi-file-import"
                        onClick={() => directoryFileInputRef.current?.click()}
                        className="w-full"
                        outlined={!uploadedArchive}
                      />
                    </div>
                  )}
                </div>

                <div
                  className={`flex-1 p-4 rounded border-2 cursor-pointer transition-all ${
                    directorySource === 'service'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => setDirectorySource('service')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <i className="pi pi-server text-xl text-green-400" />
                    <span className="font-medium">Vom Service abrufen</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Der Scoriet-Service holt die Dateien direkt aus Ihrem Deploy-Verzeichnis
                  </p>
                  {directorySource === 'service' && (
                    <div className="mt-3 text-xs text-yellow-400">
                      <i className="pi pi-info-circle mr-1" />
                      Erfordert den laufenden Scoriet-Service auf dem Zielserver
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  label="Vergleich starten"
                  icon={comparingDirectory ? 'pi pi-spin pi-spinner' : 'pi pi-play'}
                  onClick={startDirectoryComparison}
                  disabled={
                    comparingDirectory ||
                    !selectedGenerationForCompare ||
                    (directorySource === 'upload' && !uploadedArchive)
                  }
                />
              </div>
            </div>

            {/* Comparison Results */}
            {directoryCompareResult && (
              <div className="border border-gray-700 rounded p-4">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-semibold">Vergleichsergebnis</h5>
                  <div className="flex gap-3 text-sm">
                    <Tag value={`${directoryCompareResult.summary.added} Neu`} severity="success" />
                    <Tag value={`${directoryCompareResult.summary.modified} Geändert`} severity="warning" />
                    <Tag value={`${directoryCompareResult.summary.deleted} Gelöscht`} severity="danger" />
                    <Tag value={`${directoryCompareResult.summary.unchanged} Unverändert`} severity="info" />
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
                  >
                    <Column
                      field="status"
                      header="Status"
                      body={(row) => {
                        const severity = row.status === 'added' ? 'success' : row.status === 'modified' ? 'warning' : 'danger';
                        const label = row.status === 'added' ? 'Neu' : row.status === 'modified' ? 'Geändert' : 'Gelöscht';
                        return <Tag value={label} severity={severity} />;
                      }}
                      style={{ width: '100px' }}
                    />
                    <Column
                      field="path"
                      header="Dateipfad"
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
                          tooltip="In Einzelcode Vergleich öffnen"
                          tooltipOptions={{ position: 'left' }}
                          onClick={() => loadFileForSingleComparison(row.path)}
                          disabled={row.status === 'deleted' || !row.template_content || !row.modified_content}
                        />
                      )}
                      style={{ width: '60px' }}
                    />
                  </DataTable>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <i className="pi pi-check-circle text-4xl text-green-500 mb-2" />
                    <p>Keine Änderungen gefunden - alle Dateien sind identisch</p>
                  </div>
                )}

                {/* Batch create adjustments button - only show when there are modified files */}
                {directoryCompareResult.files.filter(f => f.status === 'modified').length > 0 && (
                  <div className="mt-4 flex items-center justify-between border-t border-gray-700 pt-4">
                    <div className="text-sm text-gray-400">
                      {batchProgress ? (
                        <span className="flex items-center gap-2">
                          <i className="pi pi-spin pi-spinner" />
                          Verarbeite {batchProgress.current}/{batchProgress.total}: {batchProgress.currentFile}
                        </span>
                      ) : (
                        <span>
                          {directoryCompareResult.files.filter(f => f.status === 'modified').length} geänderte Datei(en) können als Anpassungen erstellt werden
                        </span>
                      )}
                    </div>
                    <Button
                      label="Code Anpassungen erstellen"
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
              <div className="text-center text-gray-500 py-8 border border-dashed border-gray-700 rounded">
                <i className="pi pi-folder-open text-4xl mb-3" />
                <p className="mb-2">Vergleichen Sie ein ganzes Projekt-Verzeichnis</p>
                <p className="text-sm">
                  Wählen Sie eine Quelle oben und klicken Sie auf "Vergleich starten"
                </p>
              </div>
            )}
          </div>
        </TabPanel>
      </TabView>

      {/* Adjustment Dialog */}
      <Dialog
        header={editingAdjustment.id ? 'Anpassung bearbeiten' : 'Neue Anpassung'}
        visible={showAdjustmentDialog}
        onHide={() => setShowAdjustmentDialog(false)}
        style={{ width: '500px' }}
        footer={
          <div className="flex justify-end gap-2">
            <Button label="Abbrechen" text onClick={() => setShowAdjustmentDialog(false)} />
            <Button label="Speichern" onClick={saveAdjustment} />
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <InputText
              value={editingAdjustment.name || ''}
              onChange={(e) => setEditingAdjustment({ ...editingAdjustment, name: e.target.value })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Datei-Pattern
              <span className="text-gray-400 text-xs ml-2">(%1 = Tabellenname, %2 = Sprache)</span>
            </label>
            <InputText
              value={editingAdjustment.file_pattern || ''}
              onChange={(e) => setEditingAdjustment({ ...editingAdjustment, file_pattern: e.target.value })}
              className="w-full font-mono"
              placeholder="z.B. table_%1.php oder index.php"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Beschreibung</label>
            <InputTextarea
              value={editingAdjustment.description || ''}
              onChange={(e) => setEditingAdjustment({ ...editingAdjustment, description: e.target.value })}
              rows={2}
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Min. Confidence</label>
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
              <label className="block text-sm font-medium mb-1">Reihenfolge</label>
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
        header={editingInsertion.id ? 'Insertion bearbeiten' : 'Neue Insertion'}
        visible={showInsertionDialog}
        onHide={() => setShowInsertionDialog(false)}
        style={{ width: '700px' }}
        footer={
          <div className="flex justify-end gap-2">
            <Button label="Abbrechen" text onClick={() => setShowInsertionDialog(false)} />
            <Button label="Speichern" onClick={saveInsertion} />
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Typ</label>
              <Dropdown
                value={editingInsertion.insertion_type}
                options={insertionTypeOptions}
                onChange={(e) => setEditingInsertion({ ...editingInsertion, insertion_type: e.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Zeilen-Offset</label>
              <InputNumber
                value={editingInsertion.line_offset || 0}
                onValueChange={(e) => setEditingInsertion({ ...editingInsertion, line_offset: e.value || 0 })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reihenfolge</label>
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
              Anker-Text
              <span className="text-gray-400 text-xs ml-2">(Code zum Finden der Position)</span>
            </label>
            <InputTextarea
              value={editingInsertion.anchor_text || ''}
              onChange={(e) => setEditingInsertion({ ...editingInsertion, anchor_text: e.target.value })}
              rows={4}
              className="w-full font-mono text-sm"
              placeholder="Der Code, nach dem eingefugt werden soll..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Einzufugender Code
              <span className="text-gray-400 text-xs ml-2">
                (Variablen: {Object.keys(availableVariables).join(', ')})
              </span>
            </label>
            <InputTextarea
              value={editingInsertion.insertion_content || ''}
              onChange={(e) => setEditingInsertion({ ...editingInsertion, insertion_content: e.target.value })}
              rows={6}
              className="w-full font-mono text-sm"
              placeholder="Der Code, der eingefugt werden soll..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Beschreibung</label>
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
        header="Anpassung aus Analyse erstellen"
        visible={showCreateFromAnalysisDialog}
        onHide={() => setShowCreateFromAnalysisDialog(false)}
        style={{ width: '900px' }}
        maximizable
        footer={
          <div className="flex justify-end gap-2">
            <Button label="Abbrechen" text onClick={() => setShowCreateFromAnalysisDialog(false)} />
            <Button
              label="Anpassung erstellen"
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
              <label className="block text-sm font-medium mb-1">Name *</label>
              <InputText
                value={newAdjustmentData.name}
                onChange={(e) => setNewAdjustmentData({ ...newAdjustmentData, name: e.target.value })}
                className="w-full"
                placeholder="z.B. User-Funktion in table_user.php"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Datei-Pattern
                <span className="text-gray-400 text-xs ml-2">(%1 = Tabellenname)</span>
              </label>
              <InputText
                value={newAdjustmentData.file_pattern}
                onChange={(e) => setNewAdjustmentData({ ...newAdjustmentData, file_pattern: e.target.value })}
                className="w-full font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Beschreibung</label>
            <InputTextarea
              value={newAdjustmentData.description}
              onChange={(e) => setNewAdjustmentData({ ...newAdjustmentData, description: e.target.value })}
              rows={2}
              className="w-full"
            />
          </div>

          {/* Insertions List */}
          <div className="border border-gray-700 rounded p-3">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-semibold">
                Einfügungen ({editableInsertions.length})
              </h5>
              <Button
                label="Neue Einfügung"
                icon="pi pi-plus"
                size="small"
                text
                onClick={addAnalysisInsertion}
              />
            </div>

            {editableInsertions.length > 0 ? (
              <DataTable value={editableInsertions} size="small">
                <Column
                  field="insertion_type"
                  header="Typ"
                  body={(row) => getInsertionTypeTag(row.insertion_type)}
                  style={{ width: '100px' }}
                />
                <Column
                  field="anchor_text"
                  header="Anker-Text"
                  body={(row) => (
                    <pre className="text-xs bg-gray-800 p-1 rounded max-h-10 overflow-auto">
                      {row.anchor_text.substring(0, 60)}
                      {row.anchor_text.length > 60 && '...'}
                    </pre>
                  )}
                />
                <Column
                  field="insertion_content"
                  header="Einzufügender Code"
                  body={(row) => (
                    <pre className="text-xs bg-gray-800 p-1 rounded max-h-10 overflow-auto text-green-300">
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
                        tooltip="Bearbeiten"
                        onClick={() => startEditAnalysisInsertion(options.rowIndex)}
                      />
                      <Button
                        icon="pi pi-trash"
                        size="small"
                        text
                        severity="danger"
                        tooltip="Löschen"
                        onClick={() => deleteAnalysisInsertion(options.rowIndex)}
                      />
                    </div>
                  )}
                  style={{ width: '80px' }}
                />
              </DataTable>
            ) : (
              <div className="text-center text-gray-500 py-4">
                Keine Einfügungen. Klicken Sie auf "Neue Einfügung" um eine hinzuzufügen.
              </div>
            )}
          </div>
        </div>
      </Dialog>

      {/* Edit Analysis Insertion Dialog */}
      <Dialog
        header={editingAnalysisInsertionIndex !== null ? `Einfügung ${editingAnalysisInsertionIndex + 1} bearbeiten` : 'Neue Einfügung'}
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
              label="Abbrechen"
              text
              onClick={() => {
                setShowAnalysisInsertionDialog(false);
                setEditingAnalysisInsertion(null);
                setEditingAnalysisInsertionIndex(null);
              }}
            />
            <Button label="Speichern" icon="pi pi-check" onClick={saveAnalysisInsertion} />
          </div>
        }
      >
        {editingAnalysisInsertion && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Einfüge-Typ *</label>
                <Dropdown
                  value={editingAnalysisInsertion.insertion_type}
                  options={insertionTypeOptions}
                  onChange={(e) => setEditingAnalysisInsertion({ ...editingAnalysisInsertion, insertion_type: e.value })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Zeilen-Offset</label>
                <InputNumber
                  value={editingAnalysisInsertion.line_offset}
                  onValueChange={(e) => setEditingAnalysisInsertion({ ...editingAnalysisInsertion, line_offset: e.value || 0 })}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Anker-Text *
                <span className="text-gray-400 text-xs ml-2">(Code zum Finden der Position)</span>
              </label>
              <InputTextarea
                value={editingAnalysisInsertion.anchor_text}
                onChange={(e) => setEditingAnalysisInsertion({ ...editingAnalysisInsertion, anchor_text: e.target.value })}
                rows={4}
                className="w-full font-mono text-sm"
                placeholder="Der Code, nach dem eingefügt werden soll..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Einzufügender Code *
                <span className="text-gray-400 text-xs ml-2">
                  (Variablen: {Object.keys(availableVariables).join(', ')})
                </span>
              </label>
              <InputTextarea
                value={editingAnalysisInsertion.insertion_content}
                onChange={(e) => setEditingAnalysisInsertion({ ...editingAnalysisInsertion, insertion_content: e.target.value })}
                rows={6}
                className="w-full font-mono text-sm"
                placeholder="Der Code, der eingefügt werden soll..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Beschreibung (optional)</label>
              <InputText
                value={editingAnalysisInsertion.description || ''}
                onChange={(e) => setEditingAnalysisInsertion({ ...editingAnalysisInsertion, description: e.target.value })}
                className="w-full"
                placeholder="z.B. Fügt Custom-Funktion nach Klassen-Definition ein"
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default CodeAdjustmentsPanel;
