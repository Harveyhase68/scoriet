import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Steps } from 'primereact/steps';
import { FileUpload, FileUploadHandlerEvent } from 'primereact/fileupload';
import { ProgressBar } from 'primereact/progressbar';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { AutoComplete } from 'primereact/autocomplete';
import { Chips } from 'primereact/chips';
import { Checkbox } from 'primereact/checkbox';
import { TreeTable } from 'primereact/treetable';
import { TreeNode } from 'primereact/treenode';
import { usePage } from '@inertiajs/react';
import PlanModal from '@/Components/AuthModals/PlanModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SupportedLanguage, getStoredLanguage, tpl } from '@/i18n';

interface FileInfo {
    path: string;
    name: string;
    is_dir: boolean;
    size: number;
    extension: string | null;
    file_type?: string;
}

interface ExtensionPreset {
    name: string;
    extensions: string[];
    excludeDirs?: string[];  // Directories to exclude from selection
}

interface TemplateImportWizardPanelProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: (template: any) => void;
}

// Selection type: Record for React compatibility
type SelectionMap = Record<string, boolean>;

// Helper function to get auth token
const getAuthToken = (): string | null => {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
};

// Default extension presets with exclude directories
const DEFAULT_PRESETS: ExtensionPreset[] = [
    {
        name: 'Laravel React',
        extensions: ['php', 'tsx', 'ts', 'js', 'jsx', 'blade.php', 'css', 'scss'],
        excludeDirs: ['vendor', 'node_modules', '.git', 'storage/framework', 'bootstrap/cache']
    },
    {
        name: 'Laravel Vue',
        extensions: ['php', 'vue', 'js', 'ts', 'blade.php', 'css', 'scss'],
        excludeDirs: ['vendor', 'node_modules', '.git', 'storage/framework', 'bootstrap/cache']
    },
    {
        name: 'PHP Only',
        extensions: ['php', 'phtml'],
        excludeDirs: ['vendor', '.git']
    },
    {
        name: 'JavaScript/TypeScript',
        extensions: ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'],
        excludeDirs: ['node_modules', '.git', 'dist', 'build']
    },
    {
        name: 'Frontend',
        extensions: ['html', 'css', 'scss', 'sass', 'less', 'js', 'ts'],
        excludeDirs: ['node_modules', '.git', 'dist', 'build']
    },
    {
        name: 'Python',
        extensions: ['py', 'pyw', 'pyi'],
        excludeDirs: ['venv', '.venv', '__pycache__', '.git', 'env', '.eggs', '*.egg-info']
    },
    {
        name: 'Rust',
        extensions: ['rs', 'toml'],
        excludeDirs: ['target', '.git']
    },
    {
        name: 'C#/.NET',
        extensions: ['cs', 'csproj', 'sln', 'razor'],
        excludeDirs: ['bin', 'obj', 'packages', '.git', '.vs']
    },
    {
        name: 'C/C++',
        extensions: ['c', 'cpp', 'cc', 'cxx', 'h', 'hpp', 'hxx'],
        excludeDirs: ['build', 'cmake-build-*', '.git', 'out']
    },
    {
        name: 'Java',
        extensions: ['java', 'xml', 'properties', 'gradle', 'kt'],
        excludeDirs: ['target', 'build', '.gradle', '.git', 'out', '.idea']
    },
    {
        name: 'Go',
        extensions: ['go', 'mod', 'sum'],
        excludeDirs: ['vendor', '.git']
    },
];

// Load presets from localStorage
const loadPresets = (): ExtensionPreset[] => {
    try {
        const saved = localStorage.getItem('scoriet_import_presets');
        if (saved) {
            return [...DEFAULT_PRESETS, ...JSON.parse(saved)];
        }
    } catch {
        // ignore
    }
    return DEFAULT_PRESETS;
};

// Save custom presets to localStorage
const saveCustomPresets = (presets: ExtensionPreset[]) => {
    const customPresets = presets.filter(p => !DEFAULT_PRESETS.some(dp => dp.name === p.name));
    localStorage.setItem('scoriet_import_presets', JSON.stringify(customPresets));
};

export default function TemplateImportWizardPanel({ visible, onClose, onSuccess }: TemplateImportWizardPanelProps) {
    const { props } = usePage<any>();
    const templateCategories = props.templateCategories || [];
    const templateLanguages = props.templateLanguages || [];
    const { colors } = useTheme();
    const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);

    // Wizard state
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Session data
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [originalName, setOriginalName] = useState<string>('');
    const [allFiles, setAllFiles] = useState<FileInfo[]>([]);

    // File selections - use Record<string, boolean> for React compatibility
    const [selectedTemplateFiles, setSelectedTemplateFiles] = useState<SelectionMap>({});
    const [selectedStaticFiles, setSelectedStaticFiles] = useState<SelectionMap>({});
    // TreeTable selection uses a special format: { 'node-key': { checked: boolean, partialChecked: boolean } }
    const [selectedStaticDirKeys, setSelectedStaticDirKeys] = useState<Record<string, { checked: boolean; partialChecked: boolean }>>({});
    const [staticDirectoryName, setStaticDirectoryName] = useState('dependencies');

    // Extension presets
    const [presets, setPresets] = useState<ExtensionPreset[]>(loadPresets);
    const [showExtensionPanel, setShowExtensionPanel] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const [lastSelectedPreset, setLastSelectedPreset] = useState<string | null>(null);
    const [customExtensions, setCustomExtensions] = useState<string[]>([]);
    const [customExcludeDirs, setCustomExcludeDirs] = useState<string[]>([]);
    const [newPresetName, setNewPresetName] = useState('');
    const [showNewPresetInput, setShowNewPresetInput] = useState(false);
    const [hasModifiedPreset, setHasModifiedPreset] = useState(false);

    // Template metadata
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [templateCategory, setTemplateCategory] = useState('');
    const [templateLanguage, setTemplateLanguage] = useState('');
    const [templateTags, setTemplateTags] = useState<string[]>([]);
    const [templateVisibility, setTemplateVisibility] = useState<'public' | 'private' | 'store'>('public');
    const [isSystemTemplate, setIsSystemTemplate] = useState(false);
    const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
    const [filteredLanguages, setFilteredLanguages] = useState<string[]>([]);

    // Private template unlock state
    const [currentUser, setCurrentUser] = useState<{ credits: number; user_type?: string } | null>(null);
    const [needsPrivateUnlock, setNeedsPrivateUnlock] = useState(false);
    const [privateUnlockConfirmed, setPrivateUnlockConfirmed] = useState(false);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [checkingSubscription, setCheckingSubscription] = useState(false);
    const [availableSlots, setAvailableSlots] = useState<number>(0);
    const [hasCheckedSubscription, setHasCheckedSubscription] = useState(false);

    // File preview
    const [previewFile, setPreviewFile] = useState<{ path: string; content: string | null; is_binary: boolean } | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Duplicate template detection
    const [duplicateTemplateId, setDuplicateTemplateId] = useState<number | null>(null);

    // Service import state
    const [importMode, setImportMode] = useState<'upload' | 'service'>('upload');
    const [serviceDirectoryPath, setServiceDirectoryPath] = useState('');
    const [_serviceTaskId, setServiceTaskId] = useState<number | null>(null);
    const [serviceStatus, setServiceStatus] = useState<string>('');
    const [serviceLogs, setServiceLogs] = useState<string>('');
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const fileUploadRef = useRef<FileUpload>(null);

    // Steps configuration
    const steps = [
        { label: t.templateimportwizardpanel200 },
        { label: t.templateimportwizardpanel204 },
        { label: t.templateimportwizardpanel205 },
        { label: t.templateimportwizardpanel206 },
        { label: t.templateimportwizardpanel207 }
    ];

    // Calculate files available for Step 2 (Static files) - exclude files already selected in Step 1
    const filesForStaticSelection = useMemo(() => {
        return allFiles.filter(f => !selectedTemplateFiles[f.path]);
    }, [allFiles, selectedTemplateFiles]);

    // Calculate remaining files (not selected in Step 1 or Step 2)
    const remainingFiles = useMemo(() => {
        return allFiles.filter(f => !selectedTemplateFiles[f.path] && !selectedStaticFiles[f.path]);
    }, [allFiles, selectedTemplateFiles, selectedStaticFiles]);

    // Build tree structure from remaining files
    const remainingFilesTree = useMemo((): TreeNode[] => {
        const tree: TreeNode[] = [];
        const dirMap: Record<string, TreeNode> = {};

        // Sort files by path for consistent ordering
        const sortedFiles = [...remainingFiles].sort((a, b) => a.path.localeCompare(b.path));

        for (const file of sortedFiles) {
            const pathParts = file.path.split('/');

            if (pathParts.length === 1) {
                // Root level file
                tree.push({
                    key: file.path,
                    data: {
                        name: file.name,
                        path: file.path,
                        size: file.size,
                        file_type: file.file_type,
                        is_dir: false,
                    },
                });
            } else {
                // File in a directory - create directory nodes as needed
                let currentPath = '';
                let parentChildren = tree;

                for (let i = 0; i < pathParts.length - 1; i++) {
                    const part = pathParts[i];
                    currentPath = currentPath ? `${currentPath}/${part}` : part;

                    if (!dirMap[currentPath]) {
                        const dirNode: TreeNode = {
                            key: currentPath,
                            data: {
                                name: part,
                                path: currentPath,
                                size: 0,
                                is_dir: true,
                            },
                            children: [],
                        };
                        dirMap[currentPath] = dirNode;
                        parentChildren.push(dirNode);
                    }
                    parentChildren = dirMap[currentPath].children!;
                }

                // Add the file to the deepest directory
                parentChildren.push({
                    key: file.path,
                    data: {
                        name: file.name,
                        path: file.path,
                        size: file.size,
                        file_type: file.file_type,
                        is_dir: false,
                    },
                });
            }
        }

        // Calculate directory sizes
        const calculateDirSize = (node: TreeNode): number => {
            if (!node.children || node.children.length === 0) {
                return node.data.size || 0;
            }
            let totalSize = 0;
            for (const child of node.children) {
                totalSize += calculateDirSize(child);
            }
            node.data.size = totalSize;
            return totalSize;
        };

        tree.forEach(node => {
            if (node.data.is_dir) {
                calculateDirSize(node);
            }
        });

        return tree;
    }, [remainingFiles]);

    // Get selected file paths from tree selection
    const getSelectedStaticDirPaths = (): string[] => {
        const paths: string[] = [];

        const collectPaths = (nodes: TreeNode[]) => {
            for (const node of nodes) {
                const keyStr = String(node.key);
                const selectionState = selectedStaticDirKeys[keyStr];

                if (selectionState?.checked && !node.data.is_dir) {
                    // Only add file paths, not directory paths
                    paths.push(node.data.path);
                }

                if (node.children) {
                    collectPaths(node.children);
                }
            }
        };

        collectPaths(remainingFilesTree);
        return paths;
    };

    // Count selected files in tree
    const countSelectedInTree = (): number => {
        let count = 0;
        const countNodes = (nodes: TreeNode[]) => {
            for (const node of nodes) {
                const keyStr = String(node.key);
                const selectionState = selectedStaticDirKeys[keyStr];
                if (selectionState?.checked && !node.data.is_dir) {
                    count++;
                }
                if (node.children) {
                    countNodes(node.children);
                }
            }
        };
        countNodes(remainingFilesTree);
        return count;
    };

    // Helper: count selected files
    const countSelected = (selection: SelectionMap): number => {
        return Object.values(selection).filter(Boolean).length;
    };

    // Helper: get selected paths
    const getSelectedPaths = (selection: SelectionMap): string[] => {
        return Object.entries(selection).filter(([_, selected]) => selected).map(([path]) => path);
    };

    // Check if private template needs unlock (for free users)
    const checkPrivateTemplateSubscription = useCallback(async () => {
        setCheckingSubscription(true);
        try {
            const token = getAuthToken();
            if (!token) {
                setCheckingSubscription(false);
                return;
            }

            // Load user data
            const userResponse = await fetch('/api/user', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                setCurrentUser(userData);

                const isFreeUser = userData.user_type === 'free' || !userData.user_type;

                // If not a free user, they can create unlimited private templates
                if (!isFreeUser) {
                    setNeedsPrivateUnlock(false);
                    setCheckingSubscription(false);
                    return;
                }

                // Check subscription_info from templates endpoint (slot-based system)
                const templatesResponse = await fetch('/api/templates', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                if (templatesResponse.ok) {
                    const templatesData = await templatesResponse.json();
                    const subscriptionInfo = templatesData.subscription_info;

                    // Store available slots for display
                    setAvailableSlots(subscriptionInfo?.available_slots || 0);
                    setHasCheckedSubscription(true);

                    // Use backend's needs_unlock flag (accounts for subscription slots)
                    if (subscriptionInfo && subscriptionInfo.needs_unlock) {
                        setNeedsPrivateUnlock(true);
                    } else {
                        setNeedsPrivateUnlock(false);
                    }
                } else {
                    // Fallback: assume needs unlock for safety
                    setNeedsPrivateUnlock(true);
                    setHasCheckedSubscription(true);
                }
            }
        } catch (err) {
            console.error(t.templateimportwizardpanel418, err);
        } finally {
            setCheckingSubscription(false);
        }
    }, []);

    // Refresh user credits
    const refreshCredits = useCallback(async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await fetch('/api/user', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setCurrentUser(userData);
            }
        } catch (err) {
            console.error(t.templateimportwizardpanel442, err);
        }
    }, []);

    // Handle unlock confirmation
    const handlePrivateUnlockConfirm = () => {
        setPrivateUnlockConfirmed(true);
        setNeedsPrivateUnlock(false);
    };

    // Handle buy credits
    const handleBuyCredits = () => {
        setShowPlanModal(true);
    };

    // Handle plan modal close
    const handlePlanModalClose = () => {
        setShowPlanModal(false);
        refreshCredits();
    };

    // Stop polling
    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    // Cleanup on close
    const handleClose = useCallback(async () => {
        stopPolling();
        if (sessionId) {
            try {
                await fetch(`/api/template-import/${sessionId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${getAuthToken()}`,
                    }
                });
            } catch {
                // Ignore cleanup errors
            }
        }
        // Reset state
        setCurrentStep(0);
        setSessionId(null);
        setOriginalName('');
        setAllFiles([]);
        setSelectedTemplateFiles({});
        setSelectedStaticFiles({});
        setSelectedStaticDirKeys({});
        setTemplateName('');
        setTemplateDescription('');
        setTemplateCategory('');
        setTemplateLanguage('');
        setTemplateTags([]);
        setTemplateVisibility('public');
        setIsSystemTemplate(false);
        setError(null);
        setShowExtensionPanel(false);
        setSelectedPreset(null);
        setLastSelectedPreset(null);
        setCustomExtensions([]);
        setCustomExcludeDirs([]);
        setHasModifiedPreset(false);
        // Service state
        setImportMode('upload');
        setServiceDirectoryPath('');
        setServiceTaskId(null);
        setServiceStatus('');
        setServiceLogs('');
        // Private template unlock state
        setNeedsPrivateUnlock(false);
        setPrivateUnlockConfirmed(false);
        setHasCheckedSubscription(false);
        setAvailableSlots(0);
        // Duplicate state
        setDuplicateTemplateId(null);
        onClose();
    }, [sessionId, onClose, stopPolling]);

    // Upload handler
    const handleUpload = async (event: FileUploadHandlerEvent) => {
        const file = event.files[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('archive', file);

        try {
            const response = await fetch('/api/template-import/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || t.templateimportwizardpanel545);
            }

            setSessionId(data.session_id);
            setOriginalName(data.original_name);
            setAllFiles(data.all_files || []);

            // Initialize all files as DESELECTED (empty objects)
            setSelectedTemplateFiles({});
            setSelectedStaticFiles({});
            setSelectedStaticDirKeys({});

            // Generate template name from archive name
            const baseName = data.original_name.replace(/\.(zip|tar\.gz|tar\.xz|tgz)$/i, '');
            const safeName = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
            setTemplateName(safeName);

            setCurrentStep(1);
        } catch (err: any) {
            setError(err.message || t.templateimportwizardpanel564);
        } finally {
            setLoading(false);
            fileUploadRef.current?.clear();
        }
    };

    // Service import - create task and start polling
    const handleServiceImport = async () => {
        if (!serviceDirectoryPath.trim()) {
            setError(t.templateimportwizardpanel574);
            return;
        }

        setLoading(true);
        setError(null);
        setServiceStatus(t.templateimportwizardpanel585);
        setServiceLogs('');

        try {
            // Create the service task
            const response = await fetch('/cli/svc/tasks/template-upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    directory_path: serviceDirectoryPath.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || t.templateimportwizardpanel599);
            }

            setServiceTaskId(data.task_id);
            setSessionId(data.session_id);
            setServiceStatus(t.templateimportwizardpanel604);

            // Start polling for status
            startPolling(data.session_id);
        } catch (err: any) {
            setError(err.message || t.templateimportwizardpanel609);
            setLoading(false);
        }
    };

    // Start polling for service status
    const startPolling = (pollingSessionId: string) => {
        stopPolling();

        pollingRef.current = setInterval(async () => {
            try {
                const response = await fetch(`/cli/svc/template-upload/${pollingSessionId}/status`, {
                    headers: {
                        'Authorization': `Bearer ${getAuthToken()}`,
                    }
                });

                const data = await response.json();

                if (!response.ok) {
                    if (data.status === 'not_found') {
                        setError(t.templateimportwizardpanel630);
                        stopPolling();
                        setLoading(false);
                    }
                    return;
                }

                // Update logs if available
                if (data.logs) {
                    setServiceLogs(data.logs);
                }

                // Check status
                if (data.status === 'ready') {
                    // Files are ready!
                    stopPolling();
                    setAllFiles(data.all_files || []);
                    setOriginalName(data.directory_path || t.templateimportwizardpanel647);

                    // Initialize as deselected
                    setSelectedTemplateFiles({});
                    setSelectedStaticFiles({});
                    setSelectedStaticDirKeys({});

                    // Generate template name from directory
                    const dirName = data.directory_path.split(/[\\/]/).pop() || 'template';
                    const safeName = dirName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
                    setTemplateName(safeName);

                    setLoading(false);
                    setCurrentStep(1);
                } else if (data.task_status === 'failed') {
                    stopPolling();
                    setError(data.error || t.templateimportwizardpanel663);
                    setLoading(false);
                } else {
                    // Still pending/processing
                    setServiceStatus(data.task_status === 'processing' ? t.templateimportwizardpanel667 : t.templateimportwizardpanel667_2);
                }
            } catch (err: any) {
                console.error(t.templateimportwizardpanel670, err);
                // Don't stop polling on transient errors
            }
        }, 2000); // Poll every 2 seconds
    };

    // Preview file content
    const handlePreviewFile = async (path: string) => {
        if (!sessionId) return;

        setLoadingPreview(true);
        try {
            const response = await fetch(`/api/template-import/${sessionId}/preview`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path })
            });

            const data = await response.json();
            if (response.ok) {
                setPreviewFile({
                    path,
                    content: data.content,
                    is_binary: data.is_binary
                });
            }
        } catch {
            // Ignore preview errors
        } finally {
            setLoadingPreview(false);
        }
    };

    // Create template with import mode: 'new' (default), 'overwrite' (replace all), 'merge' (add to existing)
    const handleCreateTemplate = async (importMode: 'new' | 'overwrite' | 'merge' = 'new') => {
        if (!sessionId) return;

        const templateFilePaths = getSelectedPaths(selectedTemplateFiles);
        const staticFilePaths = getSelectedPaths(selectedStaticFiles);
        const staticDirPaths = getSelectedStaticDirPaths();

        // Validate
        if (!templateName) {
            setError(t.templateimportwizardpanel716);
            return;
        }
        if (!templateCategory) {
            setError(t.templateimportwizardpanel720);
            return;
        }
        if (!templateLanguage) {
            setError(t.templateimportwizardpanel724);
            return;
        }
        if (templateFilePaths.length === 0) {
            setError(t.templateimportwizardpanel728);
            return;
        }

        setLoading(true);
        setError(null);
        setDuplicateTemplateId(null);

        try {
            const response = await fetch(`/api/template-import/${sessionId}/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: templateName,
                    description: templateDescription,
                    category: templateCategory,
                    language: templateLanguage,
                    tags: templateTags,
                    visibility: templateVisibility,
                    is_system: isSystemTemplate,
                    unlock_private: privateUnlockConfirmed,
                    import_mode: importMode,
                    template_files: templateFilePaths,
                    static_files: staticFilePaths,
                    static_directory_files: staticDirPaths,
                    static_directory_name: staticDirectoryName
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle duplicate name - offer overwrite/merge options
                if (response.status === 409 && data.error_code === 'DUPLICATE_NAME') {
                    setDuplicateTemplateId(data.existing_template_id);
                    setError(t.templateimportwizardpanelDuplicateName);
                    setLoading(false);
                    return;
                }
                throw new Error(data.message || t.templateimportwizardpanel761);
            }

            onSuccess?.(data.template);
            handleClose();
        } catch (err: any) {
            setError(err.message || t.templateimportwizardpanel767);
        } finally {
            setLoading(false);
        }
    };

    // Format file size
    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // File type badge
    const fileTypeBadge = (fileType: string | undefined) => {
        if (!fileType) return null;
        const typeColors: Record<string, 'success' | 'info' | 'warning' | 'danger' | undefined> = {
            'php': 'info',
            'javascript': 'warning',
            'typescript': 'info',
            'html': 'success',
            'css': 'success',
            'vue': 'success',
            'blade': 'info',
            'image': 'warning',
            'archive': 'danger',
        };
        return <Tag value={fileType} severity={typeColors[fileType] || undefined} />;
    };

    // Get file extension from path
    const getExtension = (path: string): string => {
        // Handle compound extensions like .blade.php
        if (path.endsWith('.blade.php')) return 'blade.php';
        const parts = path.split('.');
        return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
    };

    // Select all files
    const selectAll = (
        fileList: FileInfo[],
        setSelection: React.Dispatch<React.SetStateAction<SelectionMap>>
    ) => {
        const newSelection: SelectionMap = {};
        fileList.forEach(f => {
            if (!f.is_dir) {
                newSelection[f.path] = true;
            }
        });
        setSelection(newSelection);
    };

    // Deselect all files
    const deselectAll = (
        setSelection: React.Dispatch<React.SetStateAction<SelectionMap>>
    ) => {
        setSelection({});
    };

    // Check if a file path is inside an excluded directory
    const isInExcludedDir = (filePath: string, excludeDirs: string[]): boolean => {
        const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/');
        return excludeDirs.some(dir => {
            const normalizedDir = dir.toLowerCase().replace(/\\/g, '/');
            // Support wildcard patterns like "cmake-build-*"
            if (normalizedDir.includes('*')) {
                const pattern = normalizedDir.replace(/\*/g, '.*');
                const regex = new RegExp(`(^|/)${pattern}(/|$)`);
                return regex.test(normalizedPath);
            }
            // Check if path starts with or contains the excluded directory
            return normalizedPath.startsWith(normalizedDir + '/') ||
                   normalizedPath.includes('/' + normalizedDir + '/') ||
                   normalizedPath === normalizedDir;
        });
    };

    // Select/deselect by extensions (with exclude directories support)
    const selectByExtensions = (
        fileList: FileInfo[],
        extensions: string[],
        excludeDirs: string[],
        selection: SelectionMap,
        setSelection: React.Dispatch<React.SetStateAction<SelectionMap>>,
        add: boolean
    ) => {
        const extSet = new Set(extensions.map(e => e.toLowerCase().replace(/^\*\./, '')));
        const newSelection = { ...selection };

        fileList.forEach(f => {
            if (!f.is_dir) {
                const ext = getExtension(f.path);
                const isExcluded = excludeDirs.length > 0 && isInExcludedDir(f.path, excludeDirs);

                if (extSet.has(ext) && !isExcluded) {
                    if (add) {
                        newSelection[f.path] = true;
                    } else {
                        delete newSelection[f.path];
                    }
                }
            }
        });

        setSelection(newSelection);
    };

    // Get current extensions and exclude dirs for selection
    const getCurrentExtensions = (): string[] => {
        if (selectedPreset) {
            const preset = presets.find(p => p.name === selectedPreset);
            return preset?.extensions || [];
        }
        return customExtensions;
    };

    const getCurrentExcludeDirs = (): string[] => {
        if (selectedPreset) {
            const preset = presets.find(p => p.name === selectedPreset);
            return preset?.excludeDirs || [];
        }
        return customExcludeDirs;
    };

    // Save new preset
    const handleSavePreset = () => {
        if (!newPresetName.trim() || customExtensions.length === 0) return;

        const newPreset: ExtensionPreset = {
            name: newPresetName.trim(),
            extensions: [...customExtensions],
            excludeDirs: [...customExcludeDirs]
        };

        const newPresets = [...presets, newPreset];
        setPresets(newPresets);
        saveCustomPresets(newPresets);
        setNewPresetName('');
        setShowNewPresetInput(false);
        setSelectedPreset(newPreset.name);
    };

    // Delete custom preset
    const handleDeletePreset = (presetName: string) => {
        const newPresets = presets.filter(p => p.name !== presetName);
        setPresets(newPresets);
        saveCustomPresets(newPresets);
        if (selectedPreset === presetName) {
            setSelectedPreset(null);
        }
    };

    // Reset all presets to defaults (removes all custom presets)
    const handleResetPresets = () => {
        localStorage.removeItem('scoriet_import_presets');
        setPresets(DEFAULT_PRESETS);
        setSelectedPreset(null);
        setLastSelectedPreset(null);
        setCustomExtensions([]);
        setCustomExcludeDirs([]);
        setHasModifiedPreset(false);
    };

    // Check if there are any custom presets
    const hasCustomPresets = presets.some(p => !DEFAULT_PRESETS.some(dp => dp.name === p.name));

    // Filter for autocomplete
    const searchCategories = (event: { query: string }) => {
        setFilteredCategories(
            templateCategories.filter((cat: string) =>
                cat.toLowerCase().includes(event.query.toLowerCase())
            )
        );
    };

    const searchLanguages = (event: { query: string }) => {
        setFilteredLanguages(
            templateLanguages.filter((lang: string) =>
                lang.toLowerCase().includes(event.query.toLowerCase())
            )
        );
    };

    // Render extension panel
    const renderExtensionPanel = (
        fileList: FileInfo[],
        selection: SelectionMap,
        setSelection: React.Dispatch<React.SetStateAction<SelectionMap>>
    ) => {
        if (!showExtensionPanel) return null;

        const currentExtensions = getCurrentExtensions();
        const currentExcludeDirs = getCurrentExcludeDirs();

        return (
            <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium" style={{ color: colors.textSecondary }}>{t.templateimportwizardpanel964}</h4>
                    <Button
                        icon="pi pi-times"
                        size="small"
                        text
                        onClick={() => setShowExtensionPanel(false)}
                    />
                </div>

                {/* Preset selection */}
                <div className="mb-3">
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>{t.templateimportwizardpanel975}</label>
                    <div className="flex gap-2 flex-wrap">
                        {presets.map(preset => (
                            <div key={preset.name} className="flex items-center">
                                <Button
                                    label={preset.name}
                                    size="small"
                                    outlined={selectedPreset !== preset.name}
                                    severity={selectedPreset === preset.name ? 'info' : 'secondary'}
                                    onClick={() => {
                                        setSelectedPreset(preset.name);
                                        setLastSelectedPreset(preset.name);
                                        setCustomExtensions(preset.extensions);
                                        setCustomExcludeDirs(preset.excludeDirs || []);
                                        setHasModifiedPreset(false);
                                    }}
                                    className="mr-1"
                                    tooltip={preset.excludeDirs?.length ? tpl(t.templateimportwizardpanel992, { excludedirs: preset.excludeDirs.join(', ')}) : undefined}
                                    tooltipOptions={{ position: 'top' }}
                                />
                                {!DEFAULT_PRESETS.some(p => p.name === preset.name) && (
                                    <Button
                                        icon="pi pi-trash"
                                        size="small"
                                        text
                                        severity="danger"
                                        onClick={() => handleDeletePreset(preset.name)}
                                        tooltip={t.templateimportwizardpanel1002}
                                    />
                                )}
                            </div>
                        ))}
                        <Button
                            icon="pi pi-plus"
                            label={t.templateimportwizardpanel1023}
                            size="small"
                            text
                            onClick={() => setShowNewPresetInput(true)}
                        />
                        {hasCustomPresets && (
                            <Button
                                icon="pi pi-refresh"
                                label={t.templateimportwizardpanel1017}
                                size="small"
                                text
                                severity="secondary"
                                onClick={handleResetPresets}
                                tooltip={t.templateimportwizardpanel1022}
                                tooltipOptions={{ position: 'top' }}
                            />
                        )}
                    </div>
                </div>

                {/* New preset input */}
                {showNewPresetInput && (
                    <div className="mb-3 p-3 bg-white rounded border">
                        <div className="flex gap-2 items-center">
                            <InputText
                                value={newPresetName}
                                onChange={(e) => setNewPresetName(e.target.value)}
                                placeholder={t.templateimportwizardpanel1036}
                                className="flex-1"
                            />
                            <Button
                                icon="pi pi-check"
                                size="small"
                                onClick={handleSavePreset}
                                disabled={!newPresetName.trim() || customExtensions.length === 0}
                                tooltip={t.templateimportwizardpanel1044}
                            />
                            <Button
                                icon="pi pi-times"
                                size="small"
                                severity="secondary"
                                onClick={() => {
                                    setShowNewPresetInput(false);
                                    setNewPresetName('');
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Extension chips */}
                <div className="mb-3">
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                        {t.templateimportwizardpanel1062}
                    </label>
                    <Chips
                        value={customExtensions}
                        onChange={(e) => {
                            setCustomExtensions(e.value || []);
                            setSelectedPreset(null);
                            setHasModifiedPreset(true);
                        }}
                        placeholder={t.templateimportwizardpanel1071}
                        className="w-full"
                        itemTemplate={(item) => <span>*.{item}</span>}
                        pt={{
                            container: { className: 'w-full' },
                            input: { className: 'flex-1 w-full' }
                        }}
                    />
                </div>

                {/* Exclude directories chips */}
                <div className="mb-3">
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                        <i className="pi pi-ban text-red-500 mr-1" />
                        {t.templateimportwizardpanel1085}
                    </label>
                    <Chips
                        value={customExcludeDirs}
                        onChange={(e) => {
                            setCustomExcludeDirs(e.value || []);
                            setSelectedPreset(null);
                            setHasModifiedPreset(true);
                        }}
                        placeholder={t.templateimportwizardpanel1094}
                        className="w-full"
                        itemTemplate={(item) => <span className="text-red-600"><i className="pi pi-folder mr-1" />{item}/</span>}
                        pt={{
                            container: { className: 'w-full' },
                            input: { className: 'flex-1 w-full' }
                        }}
                    />
                    <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                        {t.templateimportwizardpanel1103}
                    </p>
                </div>

                {/* Save modified preset prompt */}
                {hasModifiedPreset && lastSelectedPreset && customExtensions.length > 0 && (() => {
                    const isDefaultPreset = DEFAULT_PRESETS.some(p => p.name === lastSelectedPreset);

                    return (
                        <div className={`mb-3 p-3 rounded-lg border ${isDefaultPreset ? 'bg-yellow-50 border-yellow-300' : 'bg-blue-50 border-blue-300'}`}>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className={`text-sm ${isDefaultPreset ? 'text-yellow-700' : 'text-blue-700'}`}>
                                    <i className={`pi ${isDefaultPreset ? 'pi-exclamation-triangle' : 'pi-pencil'} mr-2`} />
                                    {isDefaultPreset
                                        ? tpl(t.templateimportwizardpanel1117, { lastselectedpreset: lastSelectedPreset })
                                        : tpl(t.templateimportwizardpanel1118, { lastselectedpreset: lastSelectedPreset })
                                    }
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {isDefaultPreset ? (
                                        /* Default preset: Save as custom copy */
                                        <Button
                                            icon="pi pi-save"
                                            label={`${t.templateimportwizardpanel1140}"${lastSelectedPreset} (Custom)"${t.templateimportwizardpanel1140_2}`}
                                            size="small"
                                            severity="warning"
                                            onClick={() => {
                                                const customName = `${lastSelectedPreset} (Custom)`;
                                                const existingIndex = presets.findIndex(p => p.name === customName);
                                                const newPreset: ExtensionPreset = {
                                                    name: customName,
                                                    extensions: [...customExtensions],
                                                    excludeDirs: [...customExcludeDirs]
                                                };
                                                let newPresets: ExtensionPreset[];
                                                if (existingIndex >= 0) {
                                                    newPresets = [...presets];
                                                    newPresets[existingIndex] = newPreset;
                                                } else {
                                                    newPresets = [...presets, newPreset];
                                                }
                                                setPresets(newPresets);
                                                saveCustomPresets(newPresets);
                                                setSelectedPreset(customName);
                                                setLastSelectedPreset(customName);
                                                setHasModifiedPreset(false);
                                            }}
                                        />
                                    ) : (
                                        /* Custom preset: Update in place */
                                        <Button
                                            icon="pi pi-save"
                                            label={t.templateimportwizardpanel1155}
                                            size="small"
                                            severity="info"
                                            onClick={() => {
                                                const existingIndex = presets.findIndex(p => p.name === lastSelectedPreset);
                                                if (existingIndex >= 0) {
                                                    const updatedPreset: ExtensionPreset = {
                                                        name: lastSelectedPreset,
                                                        extensions: [...customExtensions],
                                                        excludeDirs: [...customExcludeDirs]
                                                    };
                                                    const newPresets = [...presets];
                                                    newPresets[existingIndex] = updatedPreset;
                                                    setPresets(newPresets);
                                                    saveCustomPresets(newPresets);
                                                    setSelectedPreset(lastSelectedPreset);
                                                    setHasModifiedPreset(false);
                                                }
                                            }}
                                        />
                                    )}
                                    <Button
                                        icon="pi pi-undo"
                                        size="small"
                                        text
                                        severity="secondary"
                                        onClick={() => {
                                            // Restore original values from preset
                                            const originalPreset = presets.find(p => p.name === lastSelectedPreset);
                                            if (originalPreset) {
                                                setCustomExtensions(originalPreset.extensions);
                                                setCustomExcludeDirs(originalPreset.excludeDirs || []);
                                                setSelectedPreset(lastSelectedPreset);
                                            }
                                            setHasModifiedPreset(false);
                                        }}
                                        tooltip={t.templateimportwizardpanel1191}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Action buttons */}
                <div className="flex gap-2">
                    <Button
                        icon="pi pi-check-square"
                        label={t.templateimportwizardpanel1217}
                        size="small"
                        onClick={() => selectByExtensions(fileList, currentExtensions, currentExcludeDirs, selection, setSelection, true)}
                        disabled={currentExtensions.length === 0}
                    />
                    <Button
                        icon="pi pi-stop"
                        label={t.templateimportwizardpanel1224}
                        size="small"
                        severity="secondary"
                        onClick={() => selectByExtensions(fileList, currentExtensions, currentExcludeDirs, selection, setSelection, false)}
                        disabled={currentExtensions.length === 0}
                    />
                </div>

                {/* Filter summary */}
                <div className="mt-3 text-sm text-gray-500 space-y-1">
                    {currentExtensions.length > 0 && (
                        <div>
                            <i className="pi pi-check text-green-500 mr-1" />
                            {t.templateimportwizardpanel1237}{currentExtensions.map(e => `*.${e}`).join(', ')}
                        </div>
                    )}
                    {currentExcludeDirs.length > 0 && (
                        <div className="text-red-500">
                            <i className="pi pi-ban mr-1" />
                            {t.templateimportwizardpanel1243}{currentExcludeDirs.map(d => `${d}/`).join(', ')}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Convert SelectionMap to array of selected FileInfo objects
    const getSelectedFiles = (fileList: FileInfo[], selection: SelectionMap): FileInfo[] => {
        return fileList.filter(f => selection[f.path]);
    };

    // Handle DataTable selection change
    const handleSelectionChange = (
        selectedFiles: FileInfo[],
        setSelection: React.Dispatch<React.SetStateAction<SelectionMap>>
    ) => {
        const newSelection: SelectionMap = {};
        selectedFiles.forEach(f => {
            newSelection[f.path] = true;
        });
        setSelection(newSelection);
    };

    // Render file table for step 1 (Template files) and step 2 (Static files)
    const renderFileTable = (
        fileList: FileInfo[],
        selection: SelectionMap,
        setSelection: React.Dispatch<React.SetStateAction<SelectionMap>>,
        stepTitle: string,
        stepDescription: string,
        showFilter: boolean = true,
        tableKey: string = 'default'
    ) => {
        const filesOnly = fileList.filter(f => !f.is_dir);
        const selectedCount = countSelected(selection);
        const selectedFiles = getSelectedFiles(filesOnly, selection);

        return (
            <div className="p-4" key={`table-container-${tableKey}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">{stepTitle}</h3>
                    <div className="flex gap-2">
                        {showFilter && (
                            <Button
                                icon={showExtensionPanel ? "pi pi-eye-slash" : "pi pi-filter"}
                                label={t.templateimportwizardpanel1290}
                                size="small"
                                outlined
                                severity={showExtensionPanel ? "info" : "secondary"}
                                onClick={() => setShowExtensionPanel(!showExtensionPanel)}
                                tooltip={t.templateimportwizardpanel1295}
                            />
                        )}
                        <Button
                            label={t.templateimportwizardpanel1285}
                            size="small"
                            outlined
                            onClick={() => selectAll(filesOnly, setSelection)}
                        />
                        <Button
                            label={t.templateimportwizardpanel1291}
                            size="small"
                            outlined
                            severity="secondary"
                            onClick={() => deselectAll(setSelection)}
                        />
                    </div>
                </div>

                <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>{stepDescription}</p>

                {/* Extension panel */}
                {showFilter && renderExtensionPanel(filesOnly, selection, setSelection)}

                <Message
                    severity="info"
                    className="mb-4"
                    text={tpl(t.templateimportwizardpanel1308,{ count: selectedCount, filesonly: filesOnly.length})}
                />

                <DataTable
                    key={`datatable-${tableKey}`}
                    value={filesOnly}
                    selection={selectedFiles}
                    onSelectionChange={(e) => handleSelectionChange(e.value as FileInfo[], setSelection)}
                    selectionMode="multiple"
                    scrollable
                    scrollHeight="400px"
                    size="small"
                    className="text-sm"
                    dataKey="path"
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                    <Column
                        field="path"
                        header={t.templateimportwizardpanel1326}
                        body={(row: FileInfo) => (
                            <span className="font-mono text-xs">{row.path}</span>
                        )}
                    />
                    <Column
                        field="extension"
                        header={t.templateimportwizardpanel1333}
                        body={(row: FileInfo) => (
                            <Tag value={getExtension(row.path) || '-'} severity="secondary" />
                        )}
                        style={{ width: '80px' }}
                    />
                    <Column
                        field="file_type"
                        header={t.templateimportwizardpanel1341}
                        body={(row: FileInfo) => fileTypeBadge(row.file_type)}
                        style={{ width: '100px' }}
                    />
                    <Column
                        field="size"
                        header={t.templateimportwizardpanel1347}
                        body={(row: FileInfo) => formatSize(row.size)}
                        style={{ width: '100px' }}
                    />
                    <Column
                        body={(row: FileInfo) => (
                            <Button
                                icon="pi pi-eye"
                                size="small"
                                text
                                onClick={() => handlePreviewFile(row.path)}
                            />
                        )}
                        style={{ width: '60px' }}
                    />
                </DataTable>
            </div>
        );
    };

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Upload
                return (
                    <div className="flex flex-col items-center justify-center p-8">
                        <div className="w-full max-w-xl">
                            {/* Import mode tabs */}
                            <div className="flex justify-center mb-6">
                                <div className="inline-flex rounded-lg p-1" style={{ border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
                                    <button
                                        className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                        style={{
                                            backgroundColor: importMode === 'upload' ? colors.bgPrimary : 'transparent',
                                            color: importMode === 'upload' ? colors.accent : colors.textSecondary,
                                            boxShadow: importMode === 'upload' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                        }}
                                        onClick={() => setImportMode('upload')}
                                        disabled={loading}
                                    >
                                        <i className="pi pi-cloud-upload mr-2" />
                                        {t.templateimportwizardpanel1388}
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                        style={{
                                            backgroundColor: importMode === 'service' ? colors.bgPrimary : 'transparent',
                                            color: importMode === 'service' ? colors.accent : colors.textSecondary,
                                            boxShadow: importMode === 'service' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                        }}
                                        onClick={() => setImportMode('service')}
                                        disabled={loading}
                                    >
                                        <i className="pi pi-desktop mr-2" />
                                        {t.templateimportwizardpanel1401}
                                    </button>
                                </div>
                            </div>

                            {importMode === 'upload' ? (
                                <>
                                    <h3 className="text-lg font-medium mb-4 text-center" style={{ color: colors.textPrimary }}>
                                        {t.templateimportwizardpanel1409}
                                    </h3>
                                    <p className="text-sm mb-6 text-center" style={{ color: colors.textMuted }}>
                                        {t.templateimportwizardpanel1412}
                                    </p>

                                    <FileUpload
                                        ref={fileUploadRef}
                                        name="archive"
                                        accept=".zip,.tar.gz,.tar.xz,.tgz"
                                        maxFileSize={104857600} // 100MB
                                        customUpload
                                        uploadHandler={handleUpload}
                                        auto
                                        chooseLabel={t.templateimportwizardpanel1423}
                                        className="w-full"
                                        disabled={loading}
                                        emptyTemplate={
                                            <div className="flex flex-col items-center py-8">
                                                <i className="pi pi-cloud-upload text-4xl mb-4" style={{ color: colors.textMuted }} />
                                                <p style={{ color: colors.textMuted }}>
                                                    {t.templateimportwizardpanel1430}
                                                </p>
                                                <p className="text-sm mt-2" style={{ color: colors.textMuted }}>
                                                    {t.templateimportwizardpanel1447}
                                                </p>
                                            </div>
                                        }
                                    />

                                    {loading && (
                                        <div className="mt-4">
                                            <ProgressBar mode="indeterminate" style={{ height: '6px' }} />
                                            <p className="text-sm mt-2 text-center" style={{ color: colors.textMuted }}>
                                                {t.templateimportwizardpanel1443}
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <h3 className="text-lg font-medium mb-4 text-center" style={{ color: colors.textPrimary }}>
                                        {t.templateimportwizardpanel1451}
                                    </h3>
                                    <p className="text-sm mb-6 text-center" style={{ color: colors.textMuted }}>
                                        {t.templateimportwizardpanel1454}
                                    </p>

                                    <Message
                                        severity="info"
                                        className="mb-4"
                                        text={t.templateimportwizardpanel1460}
                                    />

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                                {t.templateimportwizardpanel1466}
                                            </label>
                                            <InputText
                                                value={serviceDirectoryPath}
                                                onChange={(e) => setServiceDirectoryPath(e.target.value)}
                                                className="w-full"
                                                placeholder={t.templateimportwizardpanel1472}
                                                disabled={loading}
                                            />
                                            <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                                {t.templateimportwizardpanel1476}
                                            </p>
                                        </div>

                                        <Button
                                            label={t.templateimportwizardpanel1495}
                                            icon="pi pi-play"
                                            className="w-full"
                                            onClick={handleServiceImport}
                                            loading={loading}
                                            disabled={!serviceDirectoryPath.trim()}
                                        />
                                    </div>

                                    {loading && (
                                        <div className="mt-4">
                                            <ProgressBar mode="indeterminate" style={{ height: '6px' }} />
                                            <p className="text-sm mt-2 text-center" style={{ color: colors.textMuted }}>
                                                {serviceStatus}
                                            </p>
                                            {serviceLogs && (
                                                <pre className="mt-3 p-3 rounded text-xs font-mono max-h-40 overflow-auto" style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}>
                                                    {serviceLogs}
                                                </pre>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                );

            case 1: // Template files
                return renderFileTable(
                    allFiles,
                    selectedTemplateFiles,
                    setSelectedTemplateFiles,
                    t.templateimportwizardpanel1514,
                    t.templateimportwizardpanel1515,
                    true,
                    'template-files'
                );

            case 2: // Static files - only show files NOT selected in Step 1
                return renderFileTable(
                    filesForStaticSelection,
                    selectedStaticFiles,
                    setSelectedStaticFiles,
                    t.templateimportwizardpanel1525,
                    t.templateimportwizardpanel1526 + (countSelected(selectedTemplateFiles) > 0 ? ' ' + tpl(t.templateimportwizardpanel1526_2, { count: countSelected(selectedTemplateFiles) }) : ''),
                    false,
                    'static-files'
                );

            case 3: { // Static directory - shows remaining files not selected in step 1 or 2
                const selectedTreeFileCount = countSelectedInTree();
                const remainingFileCount = remainingFiles.length;

                return (
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">
                                {t.templateimportwizardpanel1539}
                            </h3>
                            <div className="flex gap-2">
                                <Button
                                    label={t.templateimportwizardpanel1543}
                                    size="small"
                                    outlined
                                    onClick={() => {
                                        // Select all nodes
                                        const newSelection: Record<string, { checked: boolean; partialChecked: boolean }> = {};
                                        const selectAll = (nodes: TreeNode[]) => {
                                            for (const node of nodes) {
                                                newSelection[String(node.key)] = { checked: true, partialChecked: false };
                                                if (node.children) {
                                                    selectAll(node.children);
                                                }
                                            }
                                        };
                                        selectAll(remainingFilesTree);
                                        setSelectedStaticDirKeys(newSelection);
                                    }}
                                />
                                <Button
                                    label={t.templateimportwizardpanel1562}
                                    size="small"
                                    outlined
                                    severity="secondary"
                                    onClick={() => setSelectedStaticDirKeys({})}
                                />
                            </div>
                        </div>
                        <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
                            {t.templateimportwizardpanel1571}
                        </p>

                        {remainingFilesTree.length > 0 ? (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                        {t.templateimportwizardpanel1578}
                                    </label>
                                    <InputText
                                        value={staticDirectoryName}
                                        onChange={(e) => setStaticDirectoryName(e.target.value)}
                                        className="w-full max-w-xs"
                                        placeholder="dependencies"
                                    />
                                </div>

                                <Message
                                    severity="info"
                                    className="mb-4"
                                    text={tpl(t.templateimportwizardpanel1591, { filecount: selectedTreeFileCount, remaining: remainingFileCount})}
                                />

                                <TreeTable
                                    value={remainingFilesTree}
                                    selectionMode="checkbox"
                                    selectionKeys={selectedStaticDirKeys}
                                    onSelectionChange={(e) => setSelectedStaticDirKeys(e.value as Record<string, { checked: boolean; partialChecked: boolean }>)}
                                    scrollable
                                    scrollHeight="400px"
                                    className="text-sm"
                                >
                                    <Column
                                        field="name"
                                        header={t.templateimportwizardpanel1605}
                                        expander
                                        body={(node) => (
                                            <div className="flex items-center gap-2">
                                                <i className={`pi ${node.data.is_dir ? 'pi-folder text-yellow-500' : 'pi-file text-gray-500'}`} />
                                                <span className="font-mono text-xs">{node.data.name}</span>
                                            </div>
                                        )}
                                    />
                                    <Column
                                        field="path"
                                        header={t.templateimportwizardpanel1616}
                                        body={(node) => (
                                            <span className="font-mono text-xs" style={{ color: colors.textMuted }}>{node.data.path}</span>
                                        )}
                                    />
                                    <Column
                                        header={t.templateimportwizardpanel1622}
                                        body={(node) => {
                                            if (node.data.is_dir) {
                                                return <Tag value={t.templateimportwizardpanel1639} severity="warning" />;
                                            }
                                            return node.data.file_type ? fileTypeBadge(node.data.file_type) : <Tag value="-" severity="secondary" />;
                                        }}
                                        style={{ width: '100px' }}
                                    />
                                    <Column
                                        header={t.templateimportwizardpanel1632}
                                        body={(node) => formatSize(node.data.size)}
                                        style={{ width: '100px' }}
                                    />
                                </TreeTable>
                            </>
                        ) : (
                            <Message severity="success" text={t.templateimportwizardpanel1639} />
                        )}
                    </div>
                );
            }

            case 4: { // Metadata and create
                const templateFileCount = countSelected(selectedTemplateFiles);
                const staticFileCount = countSelected(selectedStaticFiles);
                const staticDirFileCount = countSelectedInTree();

                return (
                    <div className="p-4">
                        <h3 className="text-lg font-medium mb-4">
                            {t.templateimportwizardpanel1653}
                        </h3>

                        {/* Summary */}
                        <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: colors.bgSecondary }}>
                            <h4 className="font-medium mb-2" style={{ color: colors.textPrimary }}>{t.templateimportwizardpanel1672}</h4>
                            <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                                <li><i className="pi pi-file mr-2" />{templateFileCount}{t.templateimportwizardpanel1674}</li>
                                <li><i className="pi pi-image mr-2" />{staticFileCount}{t.templateimportwizardpanel1675}</li>
                                <li><i className="pi pi-folder mr-2" />{staticDirFileCount}{t.templateimportwizardpanel1676}({staticDirectoryName}.zip)</li>
                            </ul>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                                    {t.templateimportwizardpanel1669}
                                </label>
                                <InputText
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                    className="w-full"
                                    placeholder="mein_template"
                                />
                                <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                    {t.templateimportwizardpanel1678}
                                </p>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                                    {t.templateimportwizardpanel1684}
                                </label>
                                <InputTextarea
                                    value={templateDescription}
                                    onChange={(e) => setTemplateDescription(e.target.value)}
                                    className="w-full"
                                    rows={3}
                                    placeholder={t.templateimportwizardpanel1691}
                                />
                            </div>

                            {/* Category with dropdown and manual input */}
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                                    {t.templateimportwizardpanel1698}
                                </label>
                                <AutoComplete
                                    value={templateCategory}
                                    suggestions={filteredCategories}
                                    completeMethod={searchCategories}
                                    onChange={(e) => setTemplateCategory(e.value)}
                                    className="w-full"
                                    inputClassName="w-full"
                                    placeholder={t.templateimportwizardpanel1707}
                                    dropdown
                                    forceSelection={false}
                                />
                                <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                    {t.templateimportwizardpanel1726}{templateCategories.slice(0, 5).join(', ')}...
                                </p>
                            </div>

                            {/* Language with dropdown and manual input */}
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                                    {t.templateimportwizardpanel1719}
                                </label>
                                <AutoComplete
                                    value={templateLanguage}
                                    suggestions={filteredLanguages}
                                    completeMethod={searchLanguages}
                                    onChange={(e) => setTemplateLanguage(e.value)}
                                    className="w-full"
                                    inputClassName="w-full"
                                    placeholder={t.templateimportwizardpanel1728}
                                    dropdown
                                    forceSelection={false}
                                />
                                <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                    {t.templateimportwizardpanel1747}{templateLanguages.slice(0, 5).join(', ')}...
                                </p>
                            </div>

                            {/* Tags */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                                    {t.templateimportwizardpanel1740}
                                </label>
                                <Chips
                                    value={templateTags}
                                    onChange={(e) => setTemplateTags(e.value || [])}
                                    placeholder={t.templateimportwizardpanel1745}
                                    className="w-full"
                                    separator=","
                                    pt={{
                                        container: { className: 'w-full' },
                                        input: { className: 'flex-1 w-full' }
                                    }}
                                />
                                <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                    {t.templateimportwizardpanel1754}
                                </p>
                            </div>

                            {/* Visibility */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                                    {t.templateimportwizardpanel1761}
                                </label>
                                <Dropdown
                                    value={templateVisibility}
                                    options={[
                                        { label: t.templateimportwizardpanel1766, value: 'public' },
                                        { label: t.templateimportwizardpanel1767, value: 'private' },
                                        { label: t.templateimportwizardpanel1768, value: 'store' }
                                    ]}
                                    onChange={(e) => {
                                        setTemplateVisibility(e.value);
                                        // Check if private template unlock is needed
                                        if (e.value === 'private' && !privateUnlockConfirmed) {
                                            checkPrivateTemplateSubscription();
                                        } else if (e.value === 'public' || e.value === 'store') {
                                            setNeedsPrivateUnlock(false);
                                            setHasCheckedSubscription(false);
                                            setAvailableSlots(0);
                                        }
                                    }}
                                    className="w-full max-w-xs"
                                />
                            </div>

                            {/* System Template Checkbox - only for admins */}
                            {currentUser?.user_type === 'system' ? (
                                <div className="col-span-2">
                                    <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-300 rounded-lg">
                                        <Checkbox
                                            inputId="isSystemTemplate"
                                            checked={isSystemTemplate}
                                            onChange={(e) => setIsSystemTemplate(e.checked ?? false)}
                                        />
                                        <label htmlFor="isSystemTemplate" className="text-sm font-medium text-purple-700 cursor-pointer">
                                            <i className="pi pi-star-fill mr-2 text-purple-500" />
                                            {t.templateimportwizardpanel1796}
                                        </label>
                                        <span className="text-xs text-purple-500 ml-2">
                                            {t.templateimportwizardpanel1799}
                                        </span>
                                    </div>
                                </div>
                            ) : null}

                            {/* Private Template Unlock Section */}
                            {templateVisibility === 'private' && (
                                <div className="col-span-2 space-y-3">
                                    {checkingSubscription ? (
                                        <div className="py-4 text-center rounded-lg" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                            <p className="text-sm" style={{ color: colors.textMuted }}>Überprüfe Subscription...</p>
                                        </div>
                                    ) : needsPrivateUnlock ? (
                                        <>
                                            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                                                <p className="text-yellow-300 text-sm mb-1">
                                                    <i className="pi pi-lock mr-2"></i>
                                                    <strong>{t.templateimportwizardpanel1818}</strong>
                                                </p>
                                                <p className="text-xs" style={{ color: colors.textSecondary }}>
                                                    {t.templateimportwizardpanel1821}<strong>{t.templateimportwizardpanel1821_2}</strong>{t.templateimportwizardpanel1821_3}
                                                </p>
                                            </div>

                                            <div className="rounded-lg p-3" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                                                <div className="flex justify-between items-center text-sm mb-1">
                                                    <span style={{ color: colors.textSecondary }}>{t.templateimportwizardpanel1827}</span>
                                                    <span className="font-bold" style={{ color: colors.textPrimary }}>{currentUser?.credits || 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm mb-1">
                                                    <span style={{ color: colors.textSecondary }}>{t.templateimportwizardpanel1831}</span>
                                                    <span className="text-yellow-400 font-bold">50</span>
                                                </div>
                                                <hr className="my-1" style={{ borderColor: colors.borderPrimary }} />
                                                <div className="flex justify-between items-center text-sm">
                                                    <span style={{ color: colors.textSecondary }}>{t.templateimportwizardpanel1836}</span>
                                                    <span className={`font-bold ${(currentUser?.credits || 0) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {(currentUser?.credits || 0) >= 50 ? (currentUser?.credits || 0) - 50 : `${50 - (currentUser?.credits || 0)} fehlen`}
                                                    </span>
                                                </div>
                                            </div>

                                            {(currentUser?.credits || 0) < 50 && (
                                                <div className="bg-red-900/20 border border-red-700 rounded-lg p-2">
                                                    <p className="text-red-300 text-xs">
                                                        {t.templateimportwizardpanel1860}<strong>{50 - (currentUser?.credits || 0)}{t.templateimportwizardpanel1860_2}</strong>.
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                {(currentUser?.credits || 0) >= 50 ? (
                                                    <Button
                                                        type="button"
                                                        onClick={handlePrivateUnlockConfirm}
                                                        className="flex-1"
                                                        severity="success"
                                                        size="small"
                                                        icon="pi pi-unlock"
                                                        label={t.templateimportwizardpanel1860}
                                                    />
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        onClick={handleBuyCredits}
                                                        className="flex-1"
                                                        severity="warning"
                                                        size="small"
                                                        icon="pi pi-shopping-cart"
                                                        label={t.templateimportwizardpanel1870}
                                                    />
                                                )}
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        setTemplateVisibility('public');
                                                        setNeedsPrivateUnlock(false);
                                                        setHasCheckedSubscription(false);
                                                    }}
                                                    severity="secondary"
                                                    size="small"
                                                    icon="pi pi-globe"
                                                    label={t.templateimportwizardpanel1883}
                                                />
                                            </div>
                                        </>
                                    ) : privateUnlockConfirmed ? (
                                        <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
                                            <p className="text-green-300 text-sm flex items-center gap-2">
                                                <i className="pi pi-check-circle"></i>
                                                <strong>{t.templateimportwizardpanel1891}</strong>{t.templateimportwizardpanel1891_2}
                                            </p>
                                        </div>
                                    ) : hasCheckedSubscription && availableSlots > 0 ? (
                                        <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
                                            <p className="text-green-300 text-sm flex items-center gap-2">
                                                <i className="pi pi-check-circle"></i>
                                                <strong>{t.templateimportwizardpanel1898}</strong>{t.templateimportwizardpanel1912}{availableSlots}{t.templateimportwizardpanel1912_2}{availableSlots === 1 ? 'n' : ''}{t.templateimportwizardpanel1912_3}{availableSlots === 1 ? '' : 's'}.
                                            </p>
                                            <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                                {t.templateimportwizardpanel1901}
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            {/* Store Template Info */}
                            {templateVisibility === 'store' && (
                                <div className="col-span-2">
                                    <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-3">
                                        <p className="text-purple-300 text-sm mb-2">
                                            <i className="pi pi-shopping-cart mr-2"></i>
                                            <strong>{t.templateimportwizardpanel1914}</strong>
                                        </p>
                                        <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                                            {t.templateimportwizardpanel1917}
                                        </p>
                                        <p className="text-xs" style={{ color: colors.textMuted }}>
                                            <i className="pi pi-info-circle mr-1"></i>
                                            {t.templateimportwizardpanel1921}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            default:
                return null;
        }
    };

    // Footer with navigation
    const renderFooter = () => (
        <div className="flex justify-between items-center">
            <div>
                {currentStep > 0 && (
                    <Button
                        label={t.templateimportwizardpanel1942}
                        icon="pi pi-arrow-left"
                        outlined
                        onClick={() => setCurrentStep(currentStep - 1)}
                        disabled={loading}
                    />
                )}
            </div>
            <div className="flex gap-2">
                <Button
                    label={t.templateimportwizardpanel1952}
                    severity="secondary"
                    text
                    onClick={handleClose}
                    disabled={loading}
                />
                {currentStep < 4 ? (
                    <Button
                        label={t.templateimportwizardpanel1960}
                        icon="pi pi-arrow-right"
                        iconPos="right"
                        onClick={() => setCurrentStep(currentStep + 1)}
                        disabled={loading || currentStep === 0}
                    />
                ) : (
                    <>
                        {duplicateTemplateId && (
                            <>
                                <Button
                                    label={t.templateimportwizardpanelMerge}
                                    icon="pi pi-plus-circle"
                                    severity="info"
                                    onClick={() => handleCreateTemplate('merge')}
                                    loading={loading}
                                    tooltip={t.templateimportwizardpanelMergeTooltip}
                                    tooltipOptions={{ position: 'top' }}
                                />
                                <Button
                                    label={t.templateimportwizardpanelOverwrite}
                                    icon="pi pi-refresh"
                                    severity="warning"
                                    onClick={() => handleCreateTemplate('overwrite')}
                                    loading={loading}
                                    tooltip={t.templateimportwizardpanelOverwriteTooltip}
                                    tooltipOptions={{ position: 'top' }}
                                />
                            </>
                        )}
                        <Button
                            label={t.templateimportwizardpanel1968}
                            icon="pi pi-check"
                            onClick={() => handleCreateTemplate('new')}
                            loading={loading}
                            disabled={templateVisibility === 'private' && needsPrivateUnlock && !privateUnlockConfirmed}
                            tooltip={templateVisibility === 'private' && needsPrivateUnlock && !privateUnlockConfirmed
                                ? t.templateimportwizardpanel1974
                                : undefined}
                            tooltipOptions={{ position: 'top' }}
                        />
                    </>
                )}
            </div>
        </div>
    );

    return (
        <>
            <Dialog
                visible={visible}
                onHide={handleClose}
                header={
                    <div>
                        <span>{t.templateimportwizardpanel1990}</span>
                        {originalName && (
                            <span className="text-sm ml-2" style={{ color: colors.textMuted }}>— {originalName}</span>
                        )}
                    </div>
                }
                style={{ width: '90vw', maxWidth: '1200px' }}
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
                maximizable
                modal
                footer={renderFooter}
                className="template-import-wizard"
            >
                {error && (
                    <Message severity="error" text={error} className="w-full mb-4" />
                )}

                <Steps
                    model={steps}
                    activeIndex={currentStep}
                    readOnly
                    className="mb-6"
                />

                <div className="min-h-[400px]">
                    {renderStepContent()}
                </div>
            </Dialog>

            {/* File Preview Dialog */}
            <Dialog
                visible={!!previewFile}
                onHide={() => setPreviewFile(null)}
                header={previewFile?.path}
                style={{ width: '80vw', maxWidth: '900px' }}
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
                maximizable
            >
                {loadingPreview ? (
                    <div className="flex justify-center p-8">
                        <i className="pi pi-spin pi-spinner text-2xl" />
                    </div>
                ) : previewFile?.is_binary ? (
                    <Message severity="warn" text={t.templateimportwizardpanel2035} />
                ) : (
                    <pre className="p-4 rounded overflow-auto max-h-[60vh] text-sm font-mono whitespace-pre-wrap" style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}>
                        {previewFile?.content}
                    </pre>
                )}
            </Dialog>

            {/* Plan Modal for buying credits */}
            <PlanModal
                visible={showPlanModal}
                onHide={handlePlanModalClose}
                initialTab={1}
            />

            {/* Theme-aware styles for PrimeReact components */}
            <style>{`
                .template-import-wizard .p-treetable .p-treetable-scrollable-header, .p-treetable .p-treetable-scrollable-footer {
                    background-color: var(--theme-bg-secondary) !important;
                }
                .template-import-wizard .p-treetable {
                    background-color: var(--theme-bg-secondary) !important;
                }
                .template-import-wizard .p-treetable .p-treetable-thead > tr > th {
                    background-color: var(--theme-bg-tertiary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-import-wizard .p-treetable .p-treetable-tbody > tr {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                }
                .template-import-wizard .p-treetable .p-treetable-tbody > tr > td {
                    border-color: var(--theme-border-primary) !important;
                }
                .template-import-wizard .p-treetable .p-treetable-tbody > tr:hover {
                    background-color: var(--theme-bg-hover) !important;
                }
                .template-import-wizard .p-steps .p-steps-item .p-menuitem-link {
                    background-color: transparent !important;
                }
                .template-import-wizard .p-steps .p-steps-item .p-steps-number {
                    background-color: var(--theme-bg-tertiary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-import-wizard .p-steps .p-steps-item.p-highlight .p-steps-number {
                    background-color: var(--theme-accent) !important;
                    color: white !important;
                }
                .template-import-wizard .p-steps .p-steps-item .p-steps-title {
                    color: var(--theme-text-secondary) !important;
                }
                .template-import-wizard .p-datatable {
                    background-color: var(--theme-bg-secondary) !important;
                }
                .template-import-wizard .p-datatable .p-datatable-header {
                    background-color: var(--theme-bg-tertiary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-import-wizard .p-datatable .p-datatable-thead > tr > th {
                    background-color: var(--theme-bg-tertiary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-import-wizard .p-datatable .p-datatable-tbody > tr {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                }
                .template-import-wizard .p-datatable .p-datatable-tbody > tr > td {
                    border-color: var(--theme-border-primary) !important;
                }
                .template-import-wizard .p-datatable .p-datatable-tbody > tr:hover {
                    background-color: var(--theme-bg-hover) !important;
                }
                .template-import-wizard .p-inputtext {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-import-wizard .p-inputtext:focus {
                    border-color: var(--theme-accent) !important;
                    box-shadow: 0 0 0 1px var(--theme-accent) !important;
                }
                .template-import-wizard .p-inputtextarea {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-import-wizard .p-dropdown {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-import-wizard .p-dropdown .p-dropdown-label {
                    color: var(--theme-text-primary) !important;
                }
                .template-import-wizard .p-dropdown-panel {
                    background-color: var(--theme-bg-secondary) !important;
                }
                .template-import-wizard .p-dropdown-panel .p-dropdown-items .p-dropdown-item {
                    color: var(--theme-text-primary) !important;
                }
                .template-import-wizard .p-dropdown-panel .p-dropdown-items .p-dropdown-item:hover {
                    background-color: var(--theme-bg-hover) !important;
                }
                .template-import-wizard .p-autocomplete .p-autocomplete-input {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-import-wizard .p-autocomplete-panel {
                    background-color: var(--theme-bg-secondary) !important;
                }
                .template-import-wizard .p-autocomplete-panel .p-autocomplete-items .p-autocomplete-item {
                    color: var(--theme-text-primary) !important;
                }
                .template-import-wizard .p-autocomplete-panel .p-autocomplete-items .p-autocomplete-item:hover {
                    background-color: var(--theme-bg-hover) !important;
                }
                .template-import-wizard .p-chips .p-chips-multiple-container {
                    background-color: var(--theme-bg-secondary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-import-wizard .p-chips .p-chips-multiple-container .p-chips-input-token input {
                    color: var(--theme-text-primary) !important;
                }
                .template-import-wizard .p-chips .p-chips-multiple-container .p-chips-token {
                    background-color: var(--theme-accent) !important;
                    color: white !important;
                }
                .template-import-wizard .p-fileupload .p-fileupload-content {
                    background-color: var(--theme-bg-secondary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-import-wizard .p-fileupload .p-fileupload-buttonbar {
                    background-color: var(--theme-bg-tertiary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-import-wizard .p-checkbox .p-checkbox-box {
                    background-color: var(--theme-bg-secondary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-import-wizard .p-checkbox .p-checkbox-box.p-highlight {
                    background-color: var(--theme-accent) !important;
                    border-color: var(--theme-accent) !important;
                }
            `}</style>
        </>
    );
}
