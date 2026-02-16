import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useToast } from '@/contexts/ToastContext';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { FileUpload } from 'primereact/fileupload';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressBar } from 'primereact/progressbar';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

// Helper function to get auth token
const getAuthToken = (): string | null => {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
};
import { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { php } from '@codemirror/lang-php';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import { sql } from '@codemirror/lang-sql';
import { xml } from '@codemirror/lang-xml';
import { cpp } from '@codemirror/lang-cpp';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { rust } from '@codemirror/lang-rust';
import { markdown } from '@codemirror/lang-markdown';
import { yaml } from '@codemirror/lang-yaml';
import { oneDark } from '@codemirror/theme-one-dark';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import JSZip from 'jszip';

// Detect language based on file extension
const getLanguageExtension = (fileName: string): Extension => {
    if (!fileName) return php(); // Default to PHP

    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    const languageMap: { [key: string]: Extension } = {
        'php': php(),
        'js': javascript(),
        'jsx': javascript({ jsx: true }),
        'ts': javascript({ typescript: true }),
        'tsx': javascript({ jsx: true, typescript: true }),
        'css': css(),
        'scss': css(),
        'sass': css(),
        'html': html(),
        'htm': html(),
        'json': json(),
        'sql': sql(),
        'xml': xml(),
        'cpp': cpp(),
        'cc': cpp(),
        'cxx': cpp(),
        'c': cpp(),
        'h': cpp(),
        'hpp': cpp(),
        'hxx': cpp(),
        'py': python(),
        'pyw': python(),
        'java': java(),
        'rs': rust(),
        'md': markdown(),
        'markdown': markdown(),
        'yml': yaml(),
        'yaml': yaml(),
    };

    return languageMap[ext] || php(); // Default to PHP if unknown
};

// Get display name for language badge
const getLanguageDisplayName = (fileName: string): string => {
    if (!fileName) return 'PHP';

    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    const displayNames: { [key: string]: string } = {
        'php': 'PHP',
        'js': 'JavaScript',
        'jsx': 'JSX',
        'ts': 'TypeScript',
        'tsx': 'TSX',
        'css': 'CSS',
        'scss': 'SCSS',
        'sass': 'SASS',
        'html': 'HTML',
        'htm': 'HTML',
        'json': 'JSON',
        'sql': 'SQL',
        'xml': 'XML',
        'cpp': 'C++',
        'cc': 'C++',
        'cxx': 'C++',
        'c': 'C',
        'h': 'C/C++',
        'hpp': 'C++',
        'hxx': 'C++',
        'py': 'Python',
        'pyw': 'Python',
        'java': 'Java',
        'rs': 'Rust',
        'md': 'Markdown',
        'markdown': 'Markdown',
        'yml': 'YAML',
        'yaml': 'YAML',
    };

    return displayNames[ext] || 'PHP';
};

// Light theme for CodeMirror
const lightTheme = EditorView.theme({
    "&": {
        backgroundColor: "#ffffff",
        color: "#24292e"
    },
    ".cm-content": {
        caretColor: "#24292e"
    },
    ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "#24292e"
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
        backgroundColor: "#0366d625"
    },
    ".cm-panels": {
        backgroundColor: "#f6f8fa",
        color: "#24292e"
    },
    ".cm-panels.cm-panels-top": {
        borderBottom: "1px solid #e1e4e8"
    },
    ".cm-panels.cm-panels-bottom": {
        borderTop: "1px solid #e1e4e8"
    },
    ".cm-searchMatch": {
        backgroundColor: "#ffdf5d66",
        outline: "1px solid #ffdf5d"
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
        backgroundColor: "#ff9632"
    },
    ".cm-activeLine": {
        backgroundColor: "#f6f8fa"
    },
    ".cm-selectionMatch": {
        backgroundColor: "#ffdf5d66"
    },
    ".cm-matchingBracket, .cm-nonmatchingBracket": {
        backgroundColor: "#bad0f847",
        outline: "1px solid #c8e1ff"
    },
    ".cm-gutters": {
        backgroundColor: "#f6f8fa",
        color: "#6a737d",
        border: "none",
        borderRight: "1px solid #e1e4e8"
    },
    ".cm-activeLineGutter": {
        backgroundColor: "#e8eaed"
    },
    ".cm-foldPlaceholder": {
        backgroundColor: "transparent",
        border: "none",
        color: "#6a737d"
    },
    ".cm-tooltip": {
        border: "1px solid #e1e4e8",
        backgroundColor: "#ffffff"
    },
    ".cm-tooltip .cm-tooltip-arrow:before": {
        borderTopColor: "transparent",
        borderBottomColor: "transparent"
    },
    ".cm-tooltip .cm-tooltip-arrow:after": {
        borderTopColor: "#ffffff",
        borderBottomColor: "#ffffff"
    },
    ".cm-tooltip-autocomplete": {
        "& > ul > li[aria-selected]": {
            backgroundColor: "#0366d625",
            color: "#24292e"
        }
    }
}, { dark: false });

// Light syntax highlighting
const lightHighlightStyle = HighlightStyle.define([
    { tag: t.keyword, color: "#d73a49" },
    { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: "#6f42c1" },
    { tag: [t.function(t.variableName), t.labelName], color: "#6f42c1" },
    { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: "#005cc5" },
    { tag: [t.definition(t.name), t.separator], color: "#24292e" },
    { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: "#e36209" },
    { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: "#032f62" },
    { tag: [t.meta, t.comment], color: "#6a737d" },
    { tag: t.strong, fontWeight: "bold" },
    { tag: t.emphasis, fontStyle: "italic" },
    { tag: t.strikethrough, textDecoration: "line-through" },
    { tag: t.link, color: "#032f62", textDecoration: "underline" },
    { tag: t.heading, fontWeight: "bold", color: "#005cc5" },
    { tag: [t.atom, t.bool, t.special(t.variableName)], color: "#005cc5" },
    { tag: [t.processingInstruction, t.string, t.inserted], color: "#22863a" },
    { tag: t.invalid, color: "#cb2431" },
]);

// CodeMirror 6 Editor Component - Multi-Language Support
const MultiLanguageCodeEditor = ({ value, onChange, fileName, _placeholder, isMaximized }: {
    value: string;
    onChange: (value: string) => void;
    fileName: string;
    _placeholder?: string;
    isMaximized?: boolean;
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const { colors, isDark } = useTheme();

    useEffect(() => {
        if (!editorRef.current) return;

        const languageExtension = getLanguageExtension(fileName);

        // Choose theme based on current theme setting
        const themeExtensions = isDark
            ? [oneDark]
            : [lightTheme, syntaxHighlighting(lightHighlightStyle)];

        // Create CodeMirror 6 editor
        const startState = EditorState.create({
            doc: value || '',
            extensions: [
                lineNumbers(),
                languageExtension,
                ...themeExtensions,
                keymap.of(defaultKeymap),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        const newValue = update.state.doc.toString();
                        onChange(newValue);
                    }
                }),
                EditorView.theme({
                    "&": {
                        fontSize: "14px",
                        fontFamily: '"Courier New", "Consolas", "Monaco", "Lucida Console", monospace',
                        height: isMaximized ? "calc(95vh - 350px)" : "500px",
                        maxHeight: isMaximized ? "none" : "60vh"
                    },
                    ".cm-scroller": {
                        overflow: "auto"
                    }
                })
            ]
        });

        const view = new EditorView({
            state: startState,
            parent: editorRef.current
        });

        viewRef.current = view;

        return () => {
            view.destroy();
        };
    }, [fileName, isMaximized, isDark]); // Recreate editor when language, size, or theme changes

    // Update editor when value changes externally
    useEffect(() => {
        if (viewRef.current) {
            const currentValue = viewRef.current.state.doc.toString();
            if (currentValue !== value) {
                viewRef.current.dispatch({
                    changes: {
                        from: 0,
                        to: currentValue.length,
                        insert: value || ''
                    }
                });
            }
        }
    }, [value]);

    const languageLabel = getLanguageDisplayName(fileName);

    return (
        <div style={{ position: 'relative' }}>
            {/* Language Badge */}
            <div style={{
                position: 'absolute',
                top: '8px',
                right: '24px',
                backgroundColor: colors.bgTertiary,
                color: colors.textMuted,
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                zIndex: 10,
                userSelect: 'none',
                pointerEvents: 'none'
            }}>
                {languageLabel}
            </div>

            {/* CodeMirror Editor */}
            <div
                ref={editorRef}
                style={{
                    border: `1px solid ${colors.borderPrimary}`,
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}
            />
        </div>
    );
};

interface FileModalProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: any) => Promise<void>;
    editingFile: any;
    templateFiles: any[];
    fileTypes: any[];
    templateId?: number; // For external editing features
}

const FileModal: React.FC<FileModalProps> = ({
    visible,
    onCancel,
    onSubmit,
    editingFile,
    templateFiles,
    fileTypes,
    templateId
}) => {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();
    const toast = useToast();
    const { control, handleSubmit: handleFormSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            file_name: '',
            output_path: '/',
            file_content: '',
            file_type: 'project_file',
            file_order: 0,
            form_window_type: 0,
            is_include_only: false
        }
    });

    // Form Window Type Options
    const formWindowTypeOptions = [
        { label: t.filemodal369, value: 0 },
        { label: t.filemodal370, value: 1 },
        { label: t.filemodal371, value: 2 },
        { label: t.filemodal372, value: 3 },
        { label: t.filemodal373, value: 4 },
        { label: t.filemodal374, value: 5 },
    ];
    const [uploadedFile, setUploadedFile] = useState<any>(null);
    const [zipFileList, setZipFileList] = useState<Array<{ name: string; size: number }>>([]);
    const [isLoadingZipList, setIsLoadingZipList] = useState(false);

    // Watch file_type to conditionally show Archive button
    const currentFileType = useWatch({ control, name: 'file_type' });

    // Automatically determine content mode based on file type
    const contentMode = currentFileType === 'static_directory' ? 'zip' : 'text';

    // 🆕 Upload mode for static_directory: 'archive' (ZIP/TAR.GZ/TAR.XZ) or 'file_manager' (individual files)
    const [uploadMode, setUploadMode] = useState<'archive' | 'file_manager'>('archive');

    // External editing states
    const [isMaximized, setIsMaximized] = useState(false);
    const [serviceEditActive, setServiceEditActive] = useState(false);
    const [serviceEditSessionId, setServiceEditSessionId] = useState<string | null>(null);
    const [serviceEditStatus, setServiceEditStatus] = useState<string>('');
    const [serviceEditLogs, setServiceEditLogs] = useState<string>('');
    const servicePollingRef = useRef<NodeJS.Timeout | null>(null);

    // 🆕 File manager state: List of individual files with relative paths
    const [managedFiles, setManagedFiles] = useState<Array<{
        id: string;
        name: string;
        relativePath: string;
        content: string; // Base64
        size: number;
    }>>([]);

    // Watch file_name for language detection
    const fileName = useWatch({ control, name: 'file_name' }) || '';

    // All hooks must be called before any early returns
    React.useEffect(() => {
        if (visible) {
            setTimeout(() => {
                if (editingFile) {
                    // Editing existing file
                    reset({
                        file_name: editingFile.file_name,
                        output_path: editingFile.output_path || '/',
                        file_content: editingFile.file_content,
                        file_type: editingFile.file_type,
                        file_order: editingFile.file_order,
                        form_window_type: editingFile.form_window_type || 0,
                        is_include_only: editingFile.is_include_only || false,
                    });
                    setUploadedFile(null);

                    // 🆕 If editing a ZIP file and file_type is static_directory, extract files to managed list
                    if (editingFile.content_type === 'zip' && editingFile.file_type === 'static_directory') {
                        extractZipToManagedFiles(editingFile.file_content);
                    } else {
                        setManagedFiles([]); // Clear managed files for non-archive types
                    }

                    // 🎯 Don't reset zipFileList here - it will be handled by the ZIP extraction useEffect
                    // setZipFileList([]);
                } else {
                    // Creating new file
                    reset({
                        file_name: '',
                        output_path: '/',
                        file_content: '',
                        file_type: 'project_file',
                        file_order: templateFiles.length,
                        form_window_type: 0,
                        is_include_only: false
                    });
                    setUploadedFile(null);
                    setManagedFiles([]); // Clear managed files
                    setZipFileList([]);
                }
            }, 50);
        }
    }, [visible, editingFile, templateFiles.length, reset]);

    // 🎯 Extract ZIP file list when editing a ZIP file
    React.useEffect(() => {
        const extractZipFileList = async () => {
            if (!editingFile || editingFile.content_type !== 'zip' || !editingFile.file_content) {
                setZipFileList([]);
                return;
            }

            setIsLoadingZipList(true);
            try {
                // Decode Base64 ZIP content — clean whitespace that may be introduced by server transport
                let base64Content = editingFile.file_content;
                if (!base64Content || base64Content.length === 0) {
                    throw new Error('Empty file_content for ZIP file');
                }

                // Strip any whitespace/newlines (can be introduced by Nginx buffering, PHP output encoding, etc.)
                base64Content = base64Content.replace(/[\s\r\n]+/g, '');

                // Validate Base64 padding
                const paddingNeeded = (4 - (base64Content.length % 4)) % 4;
                if (paddingNeeded > 0) {
                    base64Content += '='.repeat(paddingNeeded);
                }

                // Decode Base64 to binary using fetch API (more robust than atob for large content)
                const response = await fetch(`data:application/octet-stream;base64,${base64Content}`);
                if (!response.ok) {
                    throw new Error('Base64 decode failed — data may be corrupted or truncated');
                }
                const bytes = new Uint8Array(await response.arrayBuffer());

                if (bytes.length < 22) {
                    throw new Error(`Decoded ZIP is too small (${bytes.length} bytes) — data may be truncated`);
                }

                // Load ZIP with JSZip
                const zip = await JSZip.loadAsync(bytes);

                // Extract file list
                const fileList: Array<{ name: string; size: number }> = [];
                await Promise.all(Object.keys(zip.files).map(async (filename) => {
                    const zipEntry = zip.files[filename];

                    // Skip directories
                    if (zipEntry.dir) return;

                    // Get uncompressed size
                    const content = await zipEntry.async('arraybuffer');
                    fileList.push({
                        name: filename,
                        size: content.byteLength
                    });
                }));

                // Sort by path (directories first, then files)
                fileList.sort((a, b) => a.name.localeCompare(b.name));
                setZipFileList(fileList);
            } catch (error: any) {
                console.error(t.filemodal495, error);
                toast.showError(`${t.filemodal496}${error.message}`);
                setZipFileList([]);
            } finally {
                setIsLoadingZipList(false);
            }
        };

        if (visible && editingFile) {
            extractZipFileList();
        }
    }, [visible, editingFile, toast]);

    // Stop service polling callback
    const stopServicePolling = useCallback(() => {
        if (servicePollingRef.current) {
            clearInterval(servicePollingRef.current);
            servicePollingRef.current = null;
        }
    }, []);

    // Cleanup on unmount or close
    useEffect(() => {
        return () => {
            stopServicePolling();
        };
    }, [stopServicePolling]);

    // Download file for VS Code callback
    const handleDownloadForVSCode = useCallback(() => {
        if (!editingFile || !editingFile.file_content) {
            toast.showError(t.filemodal526);
            return;
        }

        try {
            const blob = new Blob([editingFile.file_content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = editingFile.file_name || 'template_file.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.showSuccess(`Datei "${editingFile.file_name}"${t.filemodal540}`);
        } catch (error: any) {
            toast.showError(`${t.filemodal542}${error.message}`);
        }
    }, [editingFile, toast]);

    // Re-upload file from local callback
    const handleReuploadFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            reset({
                ...control._formValues,
                file_content: content
            });
            toast.showSuccess(`${t.filemodal558}"${file.name}"${t.filemodal558_2}`);
        };
        reader.onerror = () => {
            toast.showError(t.filemodal561);
        };
        reader.readAsText(file);
        event.target.value = '';
    }, [reset, control, toast]);

    // Poll for service edit updates callback
    const startServicePolling = useCallback((sessionId: string) => {
        stopServicePolling();

        servicePollingRef.current = setInterval(async () => {
            try {
                const response = await fetch(`/cli/svc/file-edit/${sessionId}/status`, {
                    headers: {
                        'Authorization': `Bearer ${getAuthToken()}`,
                    }
                });

                const data = await response.json();

                if (!response.ok) {
                    return;
                }

                if (data.logs) {
                    setServiceEditLogs(data.logs);
                }

                if (data.updated_content) {
                    reset({
                        ...control._formValues,
                        file_content: data.updated_content
                    });
                    setServiceEditStatus(t.filemodal594);
                    toast.showSuccess(t.filemodal595);
                }

                if (data.status === 'watching') {
                    setServiceEditStatus(t.filemodal599);
                } else if (data.status === 'closed') {
                    stopServicePolling();
                    setServiceEditActive(false);
                    setServiceEditStatus('');
                    toast.showInfo(t.filemodal604);
                }
            } catch (err) {
                console.error(t.filemodal607, err);
            }
        }, 1500);
    }, [stopServicePolling, reset, control, toast]);

    // Start editing via service callback
    const handleStartServiceEdit = useCallback(async () => {
        if (!editingFile || !templateId) {
            toast.showError(t.filemodal615);
            return;
        }

        setServiceEditActive(true);
        setServiceEditStatus(t.filemodal620);
        setServiceEditLogs('');

        try {
            const response = await fetch('/cli/svc/tasks/file-edit', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    template_id: templateId,
                    file_id: editingFile.id,
                    file_name: editingFile.file_name,
                    file_content: editingFile.file_content,
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || t.filemodal641);
            }

            setServiceEditSessionId(data.session_id);
            setServiceEditStatus(t.filemodal645_2);
            startServicePolling(data.session_id);
            toast.showSuccess(t.filemodal647);
        } catch (error: any) {
            setServiceEditActive(false);
            setServiceEditStatus('');
            toast.showError(error.message || t.filemodal651);
        }
    }, [editingFile, templateId, toast, startServicePolling]);

    // Stop service edit callback
    const handleStopServiceEdit = useCallback(async () => {
        if (serviceEditSessionId) {
            try {
                await fetch(`/cli/svc/file-edit/${serviceEditSessionId}/stop`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${getAuthToken()}`,
                    }
                });
            } catch {
                // Ignore errors
            }
        }
        stopServicePolling();
        setServiceEditActive(false);
        setServiceEditSessionId(null);
        setServiceEditStatus('');
        setServiceEditLogs('');
    }, [serviceEditSessionId, stopServicePolling]);

    // Don't render anything if not visible - AFTER all hooks
    if (!visible) return null;

    const handleSubmit = handleFormSubmit(async (values) => {
        try {
            // Normalize output_path: ensure trailing slash for directories
            // Allowed: "/" (root), "path/", "/path/", "../../path/"
            // Not allowed: "path" (missing trailing slash) - auto-fix it
            if (values.output_path && values.output_path !== '/' && !values.output_path.endsWith('/')) {
                values.output_path = values.output_path + '/';
            }

            // If ZIP mode with Archive upload
            if (contentMode === 'zip' && uploadMode === 'archive' && uploadedFile) {
                (values as any).zip_file = uploadedFile;
                values.file_content = ''; // Clear text content when using ZIP
            }

            // If ZIP mode with File Manager
            if (contentMode === 'zip' && uploadMode === 'file_manager' && managedFiles.length > 0) {
                (values as any).managed_files = managedFiles;
                values.file_content = ''; // Clear text content
            }

            await onSubmit(values);
            reset();
            setUploadedFile(null);
            setManagedFiles([]); // Clear managed files after submit
        } catch {
            // Submit failed
        }
    });

    const handleUpload = (file: any) => {
        // Accept ZIP, TAR.GZ, TAR.XZ archives
        const isArchive =
            file.type === 'application/zip' ||
            file.type === 'application/x-gzip' ||
            file.type === 'application/x-tar' ||
            file.type === 'application/gzip' ||
            file.type === 'application/x-xz' ||
            file.name.endsWith('.zip') ||
            file.name.endsWith('.tar.gz') ||
            file.name.endsWith('.tar.xz');

        if (!isArchive) {
            toast.showError(t.filemodal722);
            return false;
        }

        // 🎯 Check 100MB size limit
        const maxSize = 100 * 1024 * 1024; // 100MB in bytes
        if (file.size > maxSize) {
            toast.showError(`${t.filemodal729}(${(file.size / 1024 / 1024).toFixed(1)}MB){t.filemodal729_2}`);
            return false;
        }

        setUploadedFile(file);
        toast.showSuccess(`${file.name}${t.filemodal734}(${(file.size / 1024).toFixed(1)} KB)`);
        return false; // Prevent auto upload
    };

    const removeUploadedFile = () => {
        setUploadedFile(null);
        toast.showInfo(t.filemodal106);
    };

    // 🆕 File Manager Handlers
    const handleAddManagedFiles = (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const newFilesPromises: Promise<any>[] = [];

        // Read all files and collect promises
        fileArray.forEach(file => {
            const promise = new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target?.result as string;
                    const newFile = {
                        id: `${Date.now()}_${Math.random()}`,
                        name: file.name,
                        relativePath: '', // User can edit this
                        content: content.split(',')[1] || content, // Extract base64 part
                        size: file.size,
                    };
                    resolve(newFile);
                };
                reader.readAsDataURL(file);
            });
            newFilesPromises.push(promise);
        });

        // Wait for all files to be read, then update state ONCE
        Promise.all(newFilesPromises).then((newFiles) => {
            setManagedFiles(prev => [...prev, ...newFiles]);
            toast.showSuccess(`${newFiles.length} ${newFiles.length === 1 ? t.filemodal771 : t.filemodal771_2}${t.filemodal771_3}`);
        });
    };

    const handleRemoveManagedFile = (id: string) => {
        setManagedFiles(prev => prev.filter(f => f.id !== id));
        toast.showInfo(t.filemodal777);
    };

    const handleUpdateManagedFilePath = (id: string, newPath: string) => {
        setManagedFiles(prev => prev.map(f =>
            f.id === id ? { ...f, relativePath: newPath } : f
        ));
    };

    // 🆕 Extract ZIP content to managed files list (for editing)
    const extractZipToManagedFiles = async (base64Content: string) => {
        try {
            // Clean whitespace that may be introduced by server transport
            let cleanedBase64 = base64Content.replace(/[\s\r\n]+/g, '');

            // Validate Base64 padding
            const paddingNeeded = (4 - (cleanedBase64.length % 4)) % 4;
            if (paddingNeeded > 0) {
                cleanedBase64 += '='.repeat(paddingNeeded);
            }

            // Decode Base64 to binary using fetch API (more robust than atob for large content)
            const response = await fetch(`data:application/octet-stream;base64,${cleanedBase64}`);
            if (!response.ok) {
                throw new Error('Base64 decode failed — data may be corrupted or truncated');
            }
            const bytes = new Uint8Array(await response.arrayBuffer());

            if (bytes.length < 22) {
                throw new Error(`Decoded ZIP is too small (${bytes.length} bytes) — data may be truncated`);
            }

            // Load ZIP with JSZip
            const zip = await JSZip.loadAsync(bytes);
            const extractedFiles: Array<{
                id: string;
                name: string;
                relativePath: string;
                content: string;
                size: number;
            }> = [];

            // Extract all files from ZIP
            await Promise.all(Object.keys(zip.files).map(async (fullPath) => {
                const zipEntry = zip.files[fullPath];
                if (zipEntry.dir) return; // Skip directories

                // Split path into directory and filename
                const pathParts = fullPath.split('/');
                const fileName = pathParts.pop() || '';
                const relativePath = pathParts.join('/');

                // Get file content as base64
                const content = await zipEntry.async('base64');
                const size = (zipEntry as any)._data?.uncompressedSize || 0;

                extractedFiles.push({
                    id: `${Date.now()}_${Math.random()}`,
                    name: fileName,
                    relativePath: relativePath,
                    content: content,
                    size: size,
                });
            }));

            setManagedFiles(extractedFiles);
            toast.showSuccess(`${extractedFiles.length} ${extractedFiles.length === 1 ? 'Datei' : 'Dateien'} aus Archiv geladen`);
        } catch (error: any) {
            console.error(t.filemodal832, error);
            toast.showError(`${t.filemodal833}${error.message}`);
            setManagedFiles([]);
        }
    };

    return (
        <Dialog
            header={
                <div className="flex items-center justify-between w-full pr-8">
                    <span>{editingFile ? t.filemodal842 : t.filemodal111}</span>
                    {editingFile && contentMode === 'text' && (
                        <div className="flex items-center gap-2 ml-4">
                            {/* VS Code / External Edit Buttons */}
                            <Button
                                icon="pi pi-download"
                                label={t.filemodal848}
                                size="small"
                                severity="secondary"
                                text
                                onClick={handleDownloadForVSCode}
                                tooltip={t.filemodal853}
                                tooltipOptions={{ position: 'bottom' }}
                            />
                            <input
                                type="file"
                                id="reupload-file-input"
                                accept=".php,.js,.jsx,.ts,.tsx,.html,.css,.scss,.json,.sql,.xml,.yaml,.yml,.md,.txt,.vue,.py,.java,.rs,.c,.cpp,.h,.hpp"
                                style={{ display: 'none' }}
                                onChange={handleReuploadFile}
                            />
                            <Button
                                icon="pi pi-upload"
                                label="Re-Upload"
                                size="small"
                                severity="secondary"
                                text
                                onClick={() => document.getElementById('reupload-file-input')?.click()}
                                tooltip={t.filemodal870}
                                tooltipOptions={{ position: 'bottom' }}
                            />
                            {templateId && !serviceEditActive && (
                                <Button
                                    icon="pi pi-desktop"
                                    label="Via Service"
                                    size="small"
                                    severity="info"
                                    text
                                    onClick={handleStartServiceEdit}
                                    tooltip={t.filemodal881}
                                    tooltipOptions={{ position: 'bottom' }}
                                />
                            )}
                            {/* VS Code Direct Link - opens temp file if service is active */}
                            {serviceEditActive && editingFile?.file_name && (
                                <a
                                    href={`vscode://file/C:/WINDOWS/SystemTemp/scoriet-edit/${editingFile.file_name}`}
                                    className="p-button p-button-text p-button-sm p-button-help"
                                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                                    title="${t.filemodal891}(vscode:// Link)"
                                >
                                    <i className="pi pi-external-link" />
                                    <span>{t.filemodal894}</span>
                                </a>
                            )}
                            {serviceEditActive && (
                                <Button
                                    icon="pi pi-stop"
                                    label={t.filemodal900}
                                    size="small"
                                    severity="danger"
                                    text
                                    onClick={handleStopServiceEdit}
                                    tooltip={t.filemodal905}
                                    tooltipOptions={{ position: 'bottom' }}
                                />
                            )}
                        </div>
                    )}
                </div>
            }
            visible={visible}
            onHide={() => {
                handleStopServiceEdit();
                onCancel();
            }}
            style={{ width: isMaximized ? '95vw' : '800px', height: isMaximized ? '95vh' : 'auto' }}
            contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
            headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
            modal
            closable
            draggable
            resizable
            maximizable
            maximized={isMaximized}
            onMaximize={(e) => setIsMaximized(e.maximized)}
        >
            {/* Service Edit Status Banner */}
            {serviceEditActive && (
                <div className="mb-4 bg-blue-900 border border-blue-600 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <i className="pi pi-sync pi-spin text-blue-400 mr-3" />
                            <div>
                                <div className="text-blue-100 font-medium">{serviceEditStatus}</div>
                                {serviceEditLogs && (
                                    <div className="text-blue-300 text-xs mt-1 font-mono">{serviceEditLogs}</div>
                                )}
                            </div>
                        </div>
                        <Button
                            icon="pi pi-times"
                            size="small"
                            severity="danger"
                            text
                            onClick={handleStopServiceEdit}
                        />
                    </div>
                    <ProgressBar mode="indeterminate" style={{ height: '4px', marginTop: '8px' }} />
                </div>
            )}

            <form className="space-y-4" style={{ maxHeight: isMaximized ? 'calc(95vh - 200px)' : 'auto', overflowY: isMaximized ? 'auto' : 'visible' }}>
                <div className="flex gap-4">
                    {/* File Name */}
                    <div className="flex-1">
                        <label htmlFor="file_name" className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                            {t.filemodal959}
                        </label>
                        <Controller
                            name="file_name"
                            control={control}
                            rules={{ required: t.filemodal130 }}
                            render={({ field }) => (
                                <InputText
                                    id="file_name"
                                    {...field}
                                    placeholder={t.filemodal135}
                                    className="w-full"
                                />
                            )}
                        />
                        {errors.file_name && (
                            <small className="text-red-400 mt-1 block">{errors.file_name.message}</small>
                        )}
                    </div>

                    {/* File Type */}
                    <div className="w-48">
                        <label htmlFor="file_type" className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                            {t.filemodal982}
                        </label>
                        <Controller
                            name="file_type"
                            control={control}
                            rules={{ required: t.filemodal153 }}
                            render={({ field }) => (
                                <Dropdown
                                    id="file_type"
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    options={fileTypes.map(type => ({ label: type.label, value: type.value }))}
                                    placeholder={t.filemodal994}
                                    className="w-full"
                                />
                            )}
                        />
                        {errors.file_type && (
                            <small className="text-red-400 mt-1 block">{errors.file_type.message}</small>
                        )}
                    </div>
                </div>

                {/* Form Window Type + Include-Only */}
                <div className="flex gap-4">
                    {/* Form Window Type */}
                    <div className="flex-1">
                        <label htmlFor="form_window_type" className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                            {t.filemodal1010}
                            <span className="text-xs ml-2" style={{ color: colors.textMuted }}>
                                {t.filemodal1012}
                            </span>
                        </label>
                        <Controller
                            name="form_window_type"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    id="form_window_type"
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    options={formWindowTypeOptions}
                                    placeholder={t.filemodal1024}
                                    className="w-full"
                                />
                            )}
                        />
                    </div>

                    {/* Include-Only Checkbox */}
                    <div className="flex-shrink-0" style={{ minWidth: '200px' }}>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                            {t.filemodal1034}
                        </label>
                        <Controller
                            name="is_include_only"
                            control={control}
                            render={({ field }) => (
                                <div className="flex items-center gap-2 h-[42px]">
                                    <Checkbox
                                        inputId="is_include_only"
                                        checked={field.value || false}
                                        onChange={(e) => field.onChange(e.checked)}
                                    />
                                    <label htmlFor="is_include_only" className="text-sm cursor-pointer" style={{ color: colors.textSecondary }}>
                                        {t.filemodal1047}{'{:include:}'}
                                    </label>
                                </div>
                            )}
                        />
                    </div>
                </div>
                <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                    <strong>{t.filemodal1055}</strong>{t.filemodal1055_2}|
                    <strong>{t.filemodal1056}</strong>{t.filemodal1056_2}<code>{'{:include: path/file.php:}'}</code>{t.filemodal1056_3}
                </div>

                {/* Output Path */}
                <div>
                    <label htmlFor="output_path" className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                        {t.filemodal1062}
                        <span className="text-xs ml-2" style={{ color: colors.textMuted }}>
                            ({t.filemodal1064}/components/, /services/, /data/)
                        </span>
                    </label>
                    <Controller
                        name="output_path"
                        control={control}
                        rules={{ required: t.filemodal182 }}
                        render={({ field }) => (
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">{t.filemodal1073}</span>
                                <InputText
                                    id="output_path"
                                    {...field}
                                    placeholder={t.filemodal189}
                                    className="w-full"
                                />
                            </div>
                        )}
                    />
                    {errors.output_path && (
                        <small className="text-red-400 mt-1 block">{errors.output_path.message}</small>
                    )}
                </div>

                {/* 🆕 Upload Mode Toggle for static_directory */}
                {currentFileType === 'static_directory' && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                            {t.filemodal1092}
                        </label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                label={t.filemodal1097}
                                icon="pi pi-upload"
                                severity={uploadMode === 'archive' ? undefined : 'secondary'}
                                onClick={() => setUploadMode('archive')}
                                size="small"
                            />
                            <Button
                                type="button"
                                label={t.filemodal1105}
                                icon="pi pi-folder-open"
                                severity={uploadMode === 'file_manager' ? undefined : 'secondary'}
                                onClick={() => setUploadMode('file_manager')}
                                size="small"
                            />
                        </div>
                    </div>
                )}

                {/* 🎯 Conditional: Show Code Editor OR Archive Upload based on file_type */}
                {contentMode === 'text' && (
                    <>
                        {/* Show Archive file list if editing an Archive file */}
                        {editingFile && editingFile.content_type === 'zip' ? (
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                    {t.filemodal1122}({editingFile.zip_filename || editingFile.file_name})
                                </label>
                                <div className="border-2 border-gray-600 bg-gray-800 rounded-lg p-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {isLoadingZipList ? (
                                        <div className="flex items-center justify-center p-8 text-gray-400">
                                            <i className="pi pi-spin pi-spinner mr-2"></i>
                                            {t.filemodal1128}
                                        </div>
                                    ) : zipFileList.length > 0 ? (
                                        <div className="space-y-0.5">
                                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-600">
                                                <span className="text-gray-400 text-sm font-semibold">
                                                    {zipFileList.length} {zipFileList.length === 1 ? 'Datei' : 'Dateien'}
                                                </span>
                                                <span className="text-gray-400 text-sm">
                                                    {t.filemodal1137}{(zipFileList.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(1)} KB
                                                </span>
                                            </div>
                                            {zipFileList.map((file, index) => {
                                                // 🎯 Split path into directory and filename
                                                const lastSlash = file.name.lastIndexOf('/');
                                                const directory = lastSlash > -1 ? file.name.substring(0, lastSlash + 1) : '';
                                                const filename = lastSlash > -1 ? file.name.substring(lastSlash + 1) : file.name;

                                                return (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between p-2 hover:bg-gray-700 rounded"
                                                    >
                                                        <div className="flex items-center min-w-0 flex-1">
                                                            <i className="pi pi-file text-blue-400 mr-2 flex-shrink-0"></i>
                                                            <span className="text-gray-200 font-mono text-sm truncate">
                                                                {directory && (
                                                                    <span className="text-gray-500">{directory}</span>
                                                                )}
                                                                <span className="text-gray-200">{filename}</span>
                                                            </span>
                                                        </div>
                                                        <span className="text-gray-400 text-xs ml-3 flex-shrink-0">
                                                            {(file.size / 1024).toFixed(1)} KB
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-400 p-8">
                                            <i className="pi pi-inbox text-4xl mb-2"></i>
                                            <p>{t.filemodal1170}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 bg-blue-900 border border-blue-700 rounded-lg p-3">
                                    <div className="flex items-start">
                                        <i className="pi pi-info-circle text-blue-400 mr-2 mt-0.5"></i>
                                        <div className="text-sm text-blue-200">
                                            <strong>{t.filemodal1178}</strong>{t.filemodal1178_2}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Show code editor for text files
                            <div>
                                <label htmlFor="file_content" className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                    {t.filemodal1187}{contentMode === 'text' && '*'}
                                </label>
                                <Controller
                                    name="file_content"
                                    control={control}
                                    rules={{ required: contentMode === 'text' ? t.filemodal232 : false }}
                                    render={({ field }) => (
                                        <MultiLanguageCodeEditor
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            fileName={fileName}
                                            isMaximized={isMaximized}                                           
                                        />
                                    )}
                                />
                                {errors.file_content && (
                                    <small className="text-red-400 mt-1 block">{errors.file_content.message}</small>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Archive Upload - Mode 1 */}
                {contentMode === 'zip' && uploadMode === 'archive' && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            {t.filemodal1214}(ZIP, TAR.GZ, TAR.XZ)
                        </label>
                        {!uploadedFile ? (
                            <FileUpload
                                name="zip_file"
                                accept=".zip,.tar.gz,.tar.xz,.gz,.xz"
                                maxFileSize={104857600}
                                customUpload
                                auto
                                chooseLabel={t.filemodal278}
                                uploadHandler={(e) => {
                                    if (e.files && e.files.length > 0) {
                                        handleUpload(e.files[0]);
                                    }
                                }}
                                emptyTemplate={
                                    <div className="flex flex-col items-center justify-center p-8 text-gray-300">
                                        <i className="pi pi-upload" style={{ fontSize: '48px', color: '#6b7280', marginBottom: '16px' }}></i>
                                        <p className="text-lg mb-2">{t.filemodal1232}</p>
                                        <p className="text-sm text-gray-400">
                                            {t.filemodal1234}
                                        </p>
                                    </div>
                                }
                                className="w-full"
                            />
                        ) : (
                            <div className="border-2 border-green-500 bg-green-900 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <i className="pi pi-check-circle text-green-400 mr-2"></i>
                                        <span className="text-green-100">{uploadedFile.name}</span>
                                        <span className="text-green-300 ml-2">
                                            ({(uploadedFile.size / 1024).toFixed(1)} KB)
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        label={t.filemodal307}
                                        icon="pi pi-times"
                                        severity="danger"
                                        text
                                        onClick={removeUploadedFile}
                                        size="small"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* File Manager - Mode 2 */}
                {contentMode === 'zip' && uploadMode === 'file_manager' && (
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-sm font-medium">
                                {t.filemodal1270}({managedFiles.length} {managedFiles.length === 1 ? t.filemodal1270_2 : t.filemodal1270_3})
                            </label>
                            <input
                                type="file"
                                multiple
                                id="managed-files-upload"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        handleAddManagedFiles(e.target.files);
                                        e.target.value = ''; // Reset input
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                label={t.filemodal1286}
                                icon="pi pi-plus"
                                size="small"
                                onClick={() => document.getElementById('managed-files-upload')?.click()}
                            />
                        </div>

                        {managedFiles.length === 0 ? (
                            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center text-gray-400">
                                <i className="pi pi-folder-open" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
                                <p className="text-lg mb-2">{t.filemodal1296}</p>
                                <p className="text-sm">{t.filemodal1297}</p>
                            </div>
                        ) : (
                            <DataTable
                                value={managedFiles}
                                className="p-datatable-sm"
                                showGridlines
                                size="small"
                            >
                                <Column
                                    field="name"
                                    header={t.filemodal1308}
                                    style={{ width: '35%' }}
                                    body={(rowData) => (
                                        <div className="flex items-center">
                                            <i className="pi pi-file mr-2 text-blue-400"></i>
                                            <span className="font-mono text-sm">{rowData.name}</span>
                                        </div>
                                    )}
                                />
                                <Column
                                    field="relativePath"
                                    header={t.filemodal1319}
                                    style={{ width: '40%' }}
                                    body={(rowData) => (
                                        <InputText
                                            value={rowData.relativePath}
                                            onChange={(e) => handleUpdateManagedFilePath(rowData.id, e.target.value)}
                                            placeholder={t.filemodal1325}
                                            className="w-full"
                                            style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                                        />
                                    )}
                                />
                                <Column
                                    field="size"
                                    header={t.filemodal1333}
                                    style={{ width: '15%' }}
                                    body={(rowData) => (
                                        <span className="text-sm text-gray-400">
                                            {(rowData.size / 1024).toFixed(1)} KB
                                        </span>
                                    )}
                                />
                                <Column
                                    header={t.filemodal1342}
                                    style={{ width: '10%' }}
                                    body={(rowData) => (
                                        <Button
                                            icon="pi pi-trash"
                                            severity="danger"
                                            text
                                            size="small"
                                            onClick={() => handleRemoveManagedFile(rowData.id)}
                                            tooltip={t.filemodal1351}
                                        />
                                    )}
                                />
                            </DataTable>
                        )}

                        <div className="mt-3 bg-blue-900 border border-blue-700 rounded-lg p-3">
                            <div className="flex items-start">
                                <i className="pi pi-info-circle text-blue-400 mr-2 mt-0.5"></i>
                                <div className="text-sm text-blue-200">
                                    <strong>{t.filemodal1362}</strong>{t.filemodal1362_2}
                                    {t.filemodal1363}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-3 rounded mb-4" style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}>
                    <strong style={{ color: colors.textPrimary }}>{t.filemodal1371}</strong>
                    <ul className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
                        {fileTypes.map(type => (
                            <li key={type.value} className="mb-1">
                                <strong style={{ color: colors.textPrimary }}>{type.label}:</strong> {type.description}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex gap-2 justify-end mt-4">
                    <Button
                        type="button"
                        label={t.applicationsmodal432}
                        severity="secondary"
                        onClick={onCancel}
                    />
                    <Button
                        type="button"
                        label={editingFile ? t.applicationsmodal313 : t.filemodal340}
                        severity="success"
                        onClick={handleSubmit}
                    />
                </div>
            </form>

            {/* Theme-aware styles for PrimeReact components */}
            <style>{`
                .p-dialog .p-inputtext {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .p-dialog .p-inputtext:focus {
                    border-color: var(--theme-accent) !important;
                    box-shadow: 0 0 0 1px var(--theme-accent) !important;
                }
                .p-dialog .p-inputtext::placeholder {
                    color: var(--theme-text-muted) !important;
                }
                .p-dialog .p-dropdown {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .p-dialog .p-dropdown:focus,
                .p-dialog .p-dropdown.p-focus {
                    border-color: var(--theme-accent) !important;
                    box-shadow: 0 0 0 1px var(--theme-accent) !important;
                }
                .p-dialog .p-dropdown .p-dropdown-label {
                    color: var(--theme-text-primary) !important;
                }
                .p-dialog .p-inputgroup-addon {
                    background-color: var(--theme-bg-tertiary) !important;
                    color: var(--theme-text-secondary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
            `}</style>
        </Dialog>
    );
};

export default FileModal;