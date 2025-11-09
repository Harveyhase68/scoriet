import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useToast } from '@/contexts/ToastContext';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';
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
    const [contentMode, setContentMode] = useState<'text' | 'zip'>('text');
    const [uploadedFile, setUploadedFile] = useState<any>(null);

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
                    setContentMode('text');
                    setUploadedFile(null);
                } else {
                    // Creating new file
                    reset({
                        file_name: '',
                        output_path: '/',
                        file_content: '',
                        file_type: 'project_file',
                        file_order: templateFiles.length
                    });
                    setContentMode('text');
                    setUploadedFile(null);
                }
            }, 50);
        }
    }, [visible, editingFile, templateFiles.length, reset]);

    // Don't render anything if not visible - AFTER all hooks
    if (!visible) return null;

    const handleSubmit = handleFormSubmit(async (values) => {
        try {
            // If ZIP mode is selected, include the uploaded file
            if (contentMode === 'zip' && uploadedFile) {
                values.zip_file = uploadedFile;
                values.file_content = null; // Clear text content when using ZIP
            }

            await onSubmit(values);
            reset();
            setUploadedFile(null);
            setContentMode('text');
        } catch {
            // Submit failed
        }
    });

    const handleUpload = (file: any) => {
        const isZip = file.type === 'application/zip' || file.name.endsWith('.zip');
        if (!isZip) {
            toast.showError(t.filemodal95);
            return false;
        }

        setUploadedFile(file);
        toast.showSuccess(`${file.name} wurde geladen`);
        return false; // Prevent auto upload
    };

    const removeUploadedFile = () => {
        setUploadedFile(null);
        toast.showInfo(t.filemodal106);
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

                {/* Content Mode Toggle */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                        Inhaltstyp auswählen:
                    </label>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            label={t.filemodal208}
                            severity={contentMode === 'text' ? 'primary' : 'secondary'}
                            onClick={() => setContentMode('text')}
                            size="small"
                        />
                        <Button
                            type="button"
                            label={t.filemodal215}
                            severity={contentMode === 'zip' ? 'primary' : 'secondary'}
                            onClick={() => setContentMode('zip')}
                            size="small"
                        />
                    </div>
                </div>

                {/* Text Content Input with Syntax Highlighting */}
                {contentMode === 'text' && (
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

                {/* ZIP Upload */}
                {contentMode === 'zip' && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            ZIP-Datei hochladen
                        </label>
                        {!uploadedFile ? (
                            <FileUpload
                                name="zip_file"
                                accept=".zip"
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
                                        <p className="text-lg mb-2">ZIP-Datei hier ablegen oder klicken zum Auswählen</p>
                                        <p className="text-sm text-gray-400">
                                            Unterstützt werden .zip Dateien mit Template-Strukturen
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