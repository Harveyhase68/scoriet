import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useToast } from '@/contexts/ToastContext';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
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

// CodeMirror 6 Editor Component - Multi-Language Support
const MultiLanguageCodeEditor = ({ value, onChange, fileName, _placeholder }: {
    value: string;
    onChange: (value: string) => void;
    fileName: string;
    _placeholder?: string;
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    useEffect(() => {
        if (!editorRef.current) return;

        const languageExtension = getLanguageExtension(fileName);

        // Create CodeMirror 6 editor
        const startState = EditorState.create({
            doc: value || '',
            extensions: [
                lineNumbers(),
                languageExtension,
                oneDark,
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
                        height: "500px",
                        maxHeight: "60vh"
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
    }, [fileName]); // Recreate editor when language changes

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
                backgroundColor: '#30363d',
                color: '#8b949e',
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
                    border: '1px solid #30363d',
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
}

const FileModal: React.FC<FileModalProps> = ({
    visible,
    onCancel,
    onSubmit,
    editingFile,
    templateFiles,
    fileTypes
}) => {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
    const toast = useToast();
    const { control, handleSubmit: handleFormSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            file_name: '',
            output_path: '/',
            file_content: '',
            file_type: 'project_file',
            file_order: 0
        }
    });
    const [uploadedFile, setUploadedFile] = useState<any>(null);
    const [zipFileList, setZipFileList] = useState<Array<{ name: string; size: number }>>([]);
    const [isLoadingZipList, setIsLoadingZipList] = useState(false);

    // Watch file_type to conditionally show Archive button
    const currentFileType = useWatch({ control, name: 'file_type' });

    // Automatically determine content mode based on file type
    const contentMode = currentFileType === 'static_directory' ? 'zip' : 'text';

    // 🆕 Upload mode for static_directory: 'archive' (ZIP/TAR.GZ/TAR.XZ) or 'file_manager' (individual files)
    const [uploadMode, setUploadMode] = useState<'archive' | 'file_manager'>('archive');

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
                        file_order: templateFiles.length
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
                // Decode Base64 ZIP content
                const base64Content = editingFile.file_content;
                const binaryString = atob(base64Content);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
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
                console.error('Failed to extract archive file list:', error);
                toast.showError(`Fehler beim Lesen des Archivs: ${error.message}`);
                setZipFileList([]);
            } finally {
                setIsLoadingZipList(false);
            }
        };

        if (visible && editingFile) {
            extractZipFileList();
        }
    }, [visible, editingFile, toast]);

    // Don't render anything if not visible - AFTER all hooks
    if (!visible) return null;

    const handleSubmit = handleFormSubmit(async (values) => {
        try {
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
            toast.showError('Bitte wählen Sie eine ZIP, TAR.GZ oder TAR.XZ Datei aus.');
            return false;
        }

        // 🎯 Check 10MB size limit
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            toast.showError(`Die Datei ist zu groß (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximale Größe: 10MB`);
            return false;
        }

        setUploadedFile(file);
        toast.showSuccess(`${file.name} wurde geladen (${(file.size / 1024).toFixed(1)} KB)`);
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
            toast.showSuccess(`${newFiles.length} ${newFiles.length === 1 ? 'Datei' : 'Dateien'} hinzugefügt`);
        });
    };

    const handleRemoveManagedFile = (id: string) => {
        setManagedFiles(prev => prev.filter(f => f.id !== id));
        toast.showInfo('Datei entfernt');
    };

    const handleUpdateManagedFilePath = (id: string, newPath: string) => {
        setManagedFiles(prev => prev.map(f =>
            f.id === id ? { ...f, relativePath: newPath } : f
        ));
    };

    // 🆕 Extract ZIP content to managed files list (for editing)
    const extractZipToManagedFiles = async (base64Content: string) => {
        try {
            // Decode Base64 ZIP content
            const binaryString = atob(base64Content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
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
            console.error('Failed to extract ZIP to managed files:', error);
            toast.showError(`Fehler beim Entpacken des Archivs: ${error.message}`);
            setManagedFiles([]);
        }
    };

    return (
        <Dialog
            header={editingFile ? 'Datei bearbeiten' : t.filemodal111}
            visible={visible}
            onHide={onCancel}
            style={{ width: '700px' }}
            modal
            closable
            draggable
            resizable
        >
            <form className="space-y-4">
                <div className="flex gap-4">
                    {/* File Name */}
                    <div className="flex-1">
                        <label htmlFor="file_name" className="block text-sm font-medium mb-2">
                            Dateiname *
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
                        <label htmlFor="file_type" className="block text-sm font-medium mb-2">
                            Template-Typ *
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
                                    placeholder="Typ auswählen"
                                    className="w-full"
                                />
                            )}
                        />
                        {errors.file_type && (
                            <small className="text-red-400 mt-1 block">{errors.file_type.message}</small>
                        )}
                    </div>
                </div>

                {/* Output Path */}
                <div>
                    <label htmlFor="output_path" className="block text-sm font-medium mb-2">
                        Zielverzeichnis *
                        <span className="text-xs text-gray-400 ml-2">
                            (e.g., /components/, /services/, /data/)
                        </span>
                    </label>
                    <Controller
                        name="output_path"
                        control={control}
                        rules={{ required: t.filemodal182 }}
                        render={({ field }) => (
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">Pfad:</span>
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
                        <label className="block text-sm font-medium mb-2">
                            Upload-Modus:
                        </label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                label="Archiv hochladen"
                                icon="pi pi-upload"
                                severity={uploadMode === 'archive' ? undefined : 'secondary'}
                                onClick={() => setUploadMode('archive')}
                                size="small"
                            />
                            <Button
                                type="button"
                                label="Dateien verwalten"
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
                                <label className="block text-sm font-medium mb-2">
                                    Archiv-Inhalt ({editingFile.zip_filename || editingFile.file_name})
                                </label>
                                <div className="border-2 border-gray-600 bg-gray-800 rounded-lg p-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {isLoadingZipList ? (
                                        <div className="flex items-center justify-center p-8 text-gray-400">
                                            <i className="pi pi-spin pi-spinner mr-2"></i>
                                            Lade Archiv-Inhalt...
                                        </div>
                                    ) : zipFileList.length > 0 ? (
                                        <div className="space-y-0.5">
                                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-600">
                                                <span className="text-gray-400 text-sm font-semibold">
                                                    {zipFileList.length} {zipFileList.length === 1 ? 'Datei' : 'Dateien'}
                                                </span>
                                                <span className="text-gray-400 text-sm">
                                                    Gesamtgröße: {(zipFileList.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(1)} KB
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
                                            <p>Keine Dateien gefunden</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 bg-blue-900 border border-blue-700 rounded-lg p-3">
                                    <div className="flex items-start">
                                        <i className="pi pi-info-circle text-blue-400 mr-2 mt-0.5"></i>
                                        <div className="text-sm text-blue-200">
                                            <strong>Hinweis:</strong> Um den Archiv-Inhalt zu ändern, wechseln Sie zu "Archive" und laden Sie ein neues Archiv hoch.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Show code editor for text files
                            <div>
                                <label htmlFor="file_content" className="block text-sm font-medium mb-2">
                                    Dateiinhalt {contentMode === 'text' && '*'}
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
                                            placeholder={`Template-Code hier eingeben...

Platzhalter-Beispiele:
- {projectname} - Name des Projekts
- {tablename} - Name der Datenbank-Tabelle
- {item.name} - Name eines Datenbankfelds
- {item.type} - Typ des Datenbankfelds
- {item.typecast} - Typecast für das Feld

Schleifen und Logik:
{for {nmaxitemsnokey}}
  {if {item.typecast}=="(int)"}
    $p_{item.name} = {item.typecast}0;
  {else}
    $p_{item.name} = {item.typecast}"";
  {endif}
{endfor}`}
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
                            Archiv hochladen (ZIP, TAR.GZ, TAR.XZ)
                        </label>
                        {!uploadedFile ? (
                            <FileUpload
                                name="zip_file"
                                accept=".zip,.tar.gz,.tar.xz,.gz,.xz"
                                maxFileSize={10000000}
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
                                        <p className="text-lg mb-2">Archiv hier ablegen oder klicken zum Auswählen</p>
                                        <p className="text-sm text-gray-400">
                                            Unterstützt werden ZIP, TAR.GZ und TAR.XZ Archive mit Template-Strukturen
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
                                Dateien verwalten ({managedFiles.length} {managedFiles.length === 1 ? 'Datei' : 'Dateien'})
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
                                label="Dateien hinzufügen"
                                icon="pi pi-plus"
                                size="small"
                                onClick={() => document.getElementById('managed-files-upload')?.click()}
                            />
                        </div>

                        {managedFiles.length === 0 ? (
                            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center text-gray-400">
                                <i className="pi pi-folder-open" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
                                <p className="text-lg mb-2">Noch keine Dateien hinzugefügt</p>
                                <p className="text-sm">Klicken Sie auf "Dateien hinzufügen" oder ziehen Sie Dateien hierher</p>
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
                                    header="Dateiname"
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
                                    header="Relatives Verzeichnis"
                                    style={{ width: '40%' }}
                                    body={(rowData) => (
                                        <InputText
                                            value={rowData.relativePath}
                                            onChange={(e) => handleUpdateManagedFilePath(rowData.id, e.target.value)}
                                            placeholder="z.B. css/ oder images/icons/"
                                            className="w-full"
                                            style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                                        />
                                    )}
                                />
                                <Column
                                    field="size"
                                    header="Größe"
                                    style={{ width: '15%' }}
                                    body={(rowData) => (
                                        <span className="text-sm text-gray-400">
                                            {(rowData.size / 1024).toFixed(1)} KB
                                        </span>
                                    )}
                                />
                                <Column
                                    header="Aktionen"
                                    style={{ width: '10%' }}
                                    body={(rowData) => (
                                        <Button
                                            icon="pi pi-trash"
                                            severity="danger"
                                            text
                                            size="small"
                                            onClick={() => handleRemoveManagedFile(rowData.id)}
                                            tooltip="Datei entfernen"
                                        />
                                    )}
                                />
                            </DataTable>
                        )}

                        <div className="mt-3 bg-blue-900 border border-blue-700 rounded-lg p-3">
                            <div className="flex items-start">
                                <i className="pi pi-info-circle text-blue-400 mr-2 mt-0.5"></i>
                                <div className="text-sm text-blue-200">
                                    <strong>Hinweis:</strong> Geben Sie für jede Datei das relative Zielverzeichnis an (z.B. "css/" oder "images/icons/").
                                    Lassen Sie das Feld leer für das Root-Verzeichnis. Beim Speichern wird automatisch ein ZIP-Archiv erstellt.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-gray-600 p-3 rounded mb-4 text-gray-100">
                    <strong className="text-gray-100">Template-Typen:</strong>
                    <ul className="mt-2 text-sm text-gray-200">
                        {fileTypes.map(type => (
                            <li key={type.value} className="mb-1">
                                <strong className="text-gray-100">{type.label}:</strong> {type.description}
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

        </Dialog>
    );
};

export default FileModal;