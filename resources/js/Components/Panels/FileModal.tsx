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
import { apiClient } from '@/lib/api';

// Auth headers + 401-refresh handled inside apiClient.cliRequest; the
// local getAuthToken() helper this file used to ship is no longer needed.
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
    projectLanguages?: Array<{ code: string; name: string }>; // Available project languages for language_override
}

const FileModal: React.FC<FileModalProps> = ({
    visible,
    onCancel,
    onSubmit,
    editingFile,
    templateFiles,
    fileTypes,
    templateId,
    projectLanguages = []
}) => {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors, isDark } = useTheme();
    const toast = useToast();
    const { control, handleSubmit: handleFormSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            file_name: '',
            output_path: '/',
            file_content: '',
            file_type: 'project_file',
            file_order: 0,
            form_window_type: 0,
            is_include_only: false,
            inject_target: '',
            inject_tag: '',
            language_override: null as string | null,
        }
    });

    // Form Window Type Options
    // Values 4 (report_single) and 5 (report_list) are legacy and have been
    // removed — reports are now handled by ReportPattern, not FormWindow.
    const formWindowTypeOptions = [
        { label: t.filemodal369, value: 0 },
        { label: t.filemodal370, value: 1 },
        { label: t.filemodal371, value: 2 },
        { label: t.filemodal372, value: 3 },
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
    const watchIsIncludeOnly = useWatch({ control, name: 'is_include_only' });
    const watchInjectTarget = useWatch({ control, name: 'inject_target' });
    const watchInjectTag = useWatch({ control, name: 'inject_tag' });
    const isInjectMode = !!watchInjectTarget && !!watchInjectTag;

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
                        inject_target: editingFile.inject_target || '',
                        inject_tag: editingFile.inject_tag || '',
                        language_override: editingFile.language_override || null,
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
                        is_include_only: false,
                        inject_target: '',
                        inject_tag: '',
                        language_override: null,
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
                const rawContent = editingFile.file_content;
                if (!rawContent || rawContent.length === 0) {
                    throw new Error('Empty file_content for ZIP file');
                }

                // Integrity check: verify content wasn't truncated during API response delivery
                if (editingFile.file_content_length && rawContent.length !== editingFile.file_content_length) {
                    throw new Error(`ZIP data truncated during transfer (expected ${editingFile.file_content_length} chars, got ${rawContent.length})`);
                }

                // Strip any whitespace/newlines (can be introduced by Nginx buffering, PHP output encoding, etc.)
                let base64Content = rawContent.replace(/[\s\r\n]+/g, '');

                // Validate Base64 padding
                const paddingNeeded = (4 - (base64Content.length % 4)) % 4;
                if (paddingNeeded > 0) {
                    base64Content += '='.repeat(paddingNeeded);
                }

                // Decode Base64 to binary using fetch API (more robust than atob for large content)
                const response = await fetch(`data:application/octet-stream;base64,${base64Content}`);
                if (!response.ok) {
                    throw new Error(`Base64 decode failed (status ${response.status}) — data may be corrupted or truncated`);
                }
                const bytes = new Uint8Array(await response.arrayBuffer());

                if (bytes.length < 22) {
                    throw new Error(`Decoded ZIP is too small (${bytes.length} bytes) — data may be truncated`);
                }

                // Verify ZIP magic number (PK\x03\x04 = 50 4B 03 04)
                if (bytes[0] !== 0x50 || bytes[1] !== 0x4B) {
                    throw new Error(`Not a valid ZIP file — starts with 0x${bytes[0].toString(16)}${bytes[1].toString(16)} instead of 0x504B (PK). Content may be corrupted during API transfer.`);
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
                // cliRequest throws on !response.ok; the old version silently
                // skipped that case via the early `return`, which we preserve
                // here by catching and returning.
                let data: any;
                try {
                    data = await apiClient.cliRequest(`/svc/file-edit/${sessionId}/status`);
                } catch {
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
            // Auth handled by apiClient.cliRequest; throws on !response.ok
            // so the explicit status check the raw-fetch version did has
            // moved into the catch below.
            let data: any;
            try {
                data = await apiClient.cliRequest('/svc/tasks/file-edit', {
                    method: 'POST',
                    body: JSON.stringify({
                        template_id: templateId,
                        file_id: editingFile.id,
                        file_name: editingFile.file_name,
                        file_content: editingFile.file_content,
                    })
                });
            } catch (err: any) {
                throw new Error(err?.response?.data?.message || t.filemodal641);
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
                await apiClient.cliRequest(`/svc/file-edit/${serviceEditSessionId}/stop`, { method: 'POST' });
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
            toast.showError(`${t.filemodal729}(${(file.size / 1024 / 1024).toFixed(1)}MB)${t.filemodal729_2}`);
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
                throw new Error(`Base64 decode failed (status ${response.status}) — data may be corrupted or truncated`);
            }
            const bytes = new Uint8Array(await response.arrayBuffer());

            if (bytes.length < 22) {
                throw new Error(`Decoded ZIP is too small (${bytes.length} bytes) — data may be truncated`);
            }

            // Verify ZIP magic number
            if (bytes[0] !== 0x50 || bytes[1] !== 0x4B) {
                throw new Error(`Not a valid ZIP file — starts with 0x${bytes[0].toString(16)}${bytes[1].toString(16)} instead of 0x504B (PK). Content may be corrupted during API transfer.`);
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
            toast.showSuccess(`${extractedFiles.length} ${extractedFiles.length === 1 ? t.filemodal876 : t.filemodal876_2}${t.filemodal876_3}`);
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
                                label={t.filemodal911}
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
                                    label={t.filemodal922}
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
                                        disabled={isInjectMode}
                                    />
                                    <label htmlFor="is_include_only" className="text-sm cursor-pointer" style={{ color: colors.textSecondary }}>
                                        {t.filemodal1047}{'{:include:}'}
                                    </label>
                                </div>
                            )}
                        />
                    </div>
                    <div style={{ minWidth: '100px' }}>
                        <label htmlFor="file_order" className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                            {t.filemodal_file_order || 'Gen. Order'}
                        </label>
                        <Controller
                            name="file_order"
                            control={control}
                            render={({ field }) => (
                                <InputText
                                    id="file_order"
                                    type="number"
                                    value={String(field.value ?? 0)}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    className="w-full"
                                    min={0}
                                />
                            )}
                        />
                        <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                            {t.filemodal_file_order_help || 'Controls %13 counter position'}
                        </div>
                    </div>
                </div>
                <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                    <strong>{t.filemodal1055}</strong>{t.filemodal1055_2}|
                    <strong>{t.filemodal1056}</strong>{t.filemodal1056_2}<code>{'{:include: path/file.php:}'}</code>{t.filemodal1056_3}
                </div>

                {/* Language Override */}
                {projectLanguages && projectLanguages.length > 0 && (
                    <div className="flex gap-4 mt-3">
                        <div style={{ minWidth: '250px' }}>
                            <label htmlFor="language_override" className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                {t.filemodal_language_override || 'Language Override'}
                                <span className="text-xs ml-2" style={{ color: colors.textMuted }}>
                                    {t.filemodal_language_override_hint || '(optional)'}
                                </span>
                            </label>
                            <Controller
                                name="language_override"
                                control={control}
                                render={({ field }) => (
                                    <Dropdown
                                        id="language_override"
                                        value={field.value}
                                        onChange={(e) => field.onChange(e.value)}
                                        options={[
                                            { label: t.filemodal_language_default || 'Use Project Default Language', value: null },
                                            ...projectLanguages.map(lang => ({
                                                label: `${lang.name} (${lang.code})`,
                                                value: lang.code
                                            }))
                                        ]}
                                        placeholder={t.filemodal_language_default || 'Use Project Default Language'}
                                        className="w-full"
                                    />
                                )}
                            />
                            <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                {t.filemodal_language_override_help || 'Overrides the language for {:caption:} and {:description:} placeholders in this file'}
                            </div>
                        </div>
                    </div>
                )}

                {/* Smart Injection Fields */}
                <div className="flex gap-4 mt-3">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-2" style={{ color: isInjectMode ? colors.accent : colors.textSecondary }}>
                            <i className="pi pi-bolt mr-1" style={{ fontSize: '0.75rem' }} />
                            {t.filemodal_si_target}
                            <span className="text-xs ml-2 font-normal" style={{ color: colors.textMuted }}>
                                ({t.filemodal_si_target_hint})
                            </span>
                        </label>
                        <Controller
                            name="inject_target"
                            control={control}
                            render={({ field }) => (
                                <InputText
                                    id="inject_target"
                                    {...field}
                                    placeholder="routes/web.php"
                                    className="w-full"
                                    disabled={watchIsIncludeOnly || false}
                                />
                            )}
                        />
                    </div>
                    <div style={{ minWidth: '200px' }}>
                        <label className="block text-sm font-medium mb-2" style={{ color: isInjectMode ? colors.accent : colors.textSecondary }}>
                            {t.filemodal_si_tag}
                            <span className="text-xs ml-2 font-normal" style={{ color: colors.textMuted }}>
                                ({t.filemodal_si_tag_hint})
                            </span>
                        </label>
                        <Controller
                            name="inject_tag"
                            control={control}
                            render={({ field }) => (
                                <InputText
                                    id="inject_tag"
                                    {...field}
                                    placeholder="routes"
                                    className="w-full"
                                    disabled={watchIsIncludeOnly || false}
                                />
                            )}
                        />
                    </div>
                </div>
                {isInjectMode ? (
                    <div className="text-xs mt-1 p-2 rounded" style={{ color: isDark ? 'rgba(147, 197, 253, 0.9)' : 'rgba(30, 64, 175, 0.85)', backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.06)', border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.2)'}` }}>
                        <strong><i className="pi pi-bolt mr-1" />{t.filemodal_si_active}</strong> {t.filemodal_si_active_desc1}<code>{watchInjectTarget}</code>{t.filemodal_si_active_desc2}<code>{'{:inject ' + watchInjectTag + ':}'}</code>{t.filemodal_si_active_desc3}
                    </div>
                ) : (
                    <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                        <strong>Smart Injection:</strong> {t.filemodal_si_help}
                        {t.filemodal_si_syntax} <code>{'// {:inject tagname:}'}</code> {t.filemodal_si_syntax2}
                    </div>
                )}

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
                                <div className="rounded-lg p-4" style={{ maxHeight: '400px', overflowY: 'auto', border: `2px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
                                    {isLoadingZipList ? (
                                        <div className="flex items-center justify-center p-8" style={{ color: colors.textMuted }}>
                                            <i className="pi pi-spin pi-spinner mr-2"></i>
                                            {t.filemodal1128}
                                        </div>
                                    ) : zipFileList.length > 0 ? (
                                        <div className="space-y-0.5">
                                            <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}>
                                                <span className="text-sm font-semibold" style={{ color: colors.textMuted }}>
                                                    {zipFileList.length} {zipFileList.length === 1 ? t.filemodal1180 : t.filemodal1180_2}
                                                </span>
                                                <span className="text-sm" style={{ color: colors.textMuted }}>
                                                    {t.filemodal1137}{(zipFileList.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(1)} KB
                                                </span>
                                            </div>
                                            {zipFileList.map((file, index) => {
                                                const lastSlash = file.name.lastIndexOf('/');
                                                const directory = lastSlash > -1 ? file.name.substring(0, lastSlash + 1) : '';
                                                const filename = lastSlash > -1 ? file.name.substring(lastSlash + 1) : file.name;

                                                return (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between p-2 rounded"
                                                        style={{ cursor: 'default' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgTertiary}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <div className="flex items-center min-w-0 flex-1">
                                                            <i className="pi pi-file mr-2 flex-shrink-0" style={{ color: colors.accent }}></i>
                                                            <span className="font-mono text-sm truncate" style={{ color: colors.textPrimary }}>
                                                                {directory && (
                                                                    <span style={{ color: colors.textMuted }}>{directory}</span>
                                                                )}
                                                                <span style={{ color: colors.textPrimary }}>{filename}</span>
                                                            </span>
                                                        </div>
                                                        <span className="text-xs ml-3 flex-shrink-0" style={{ color: colors.textMuted }}>
                                                            {(file.size / 1024).toFixed(1)} KB
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center p-8" style={{ color: colors.textMuted }}>
                                            <i className="pi pi-inbox text-4xl mb-2"></i>
                                            <p>{t.filemodal1170}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 rounded-lg p-3" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)', border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.25)'}` }}>
                                    <div className="flex items-start">
                                        <i className="pi pi-info-circle mr-2 mt-0.5" style={{ color: colors.accent }}></i>
                                        <div className="text-sm" style={{ color: isDark ? 'rgba(147, 197, 253, 0.9)' : 'rgba(30, 64, 175, 0.85)' }}>
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
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
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
                                    <div className="flex flex-col items-center justify-center p-8" style={{ color: colors.textSecondary }}>
                                        <i className="pi pi-upload" style={{ fontSize: '48px', color: colors.textMuted, marginBottom: '16px' }}></i>
                                        <p className="text-lg mb-2" style={{ color: colors.textSecondary }}>{t.filemodal1232}</p>
                                        <p className="text-sm" style={{ color: colors.textMuted }}>
                                            {t.filemodal1234}
                                        </p>
                                    </div>
                                }
                                className="w-full"
                                pt={{
                                    buttonbar: { style: { backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary } },
                                    content: { style: { backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary } },
                                }}
                            />
                        ) : (
                            <div className="rounded-lg p-4" style={{ border: `2px solid ${isDark ? 'rgba(34, 197, 94, 0.5)' : 'rgba(22, 163, 74, 0.4)'}`, backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(22, 163, 74, 0.06)' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <i className="pi pi-check-circle mr-2" style={{ color: isDark ? '#4ade80' : '#16a34a' }}></i>
                                        <span style={{ color: colors.textPrimary }}>{uploadedFile.name}</span>
                                        <span className="ml-2" style={{ color: colors.textSecondary }}>
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