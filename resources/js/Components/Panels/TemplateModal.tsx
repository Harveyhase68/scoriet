import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Chips } from 'primereact/chips';
import { Checkbox } from 'primereact/checkbox';


interface TemplateModalProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: any) => Promise<void>;
    onSave?: (values: any) => Promise<any>;
    editingTemplate: any;
    categories: string[];
    templateFiles: any[];
    onCreateFile: () => void;
    onEditFile: (file: any) => void;
    onDeleteFile: (index: number) => void;
    fileTypes: any[];
    userType?: string;
}

const TemplateModal: React.FC<TemplateModalProps> = ({
    visible,
    onCancel,
    onSubmit,
    onSave,
    editingTemplate,
    categories,
    templateFiles,
    onCreateFile,
    onEditFile,
    onDeleteFile,
    fileTypes,
    userType
}) => {
    const { control, handleSubmit: handleFormSubmit, reset, getValues, formState: { errors } } = useForm({
        defaultValues: {
            name: '',
            description: '',
            category: '',
            language: '',
            tags: [],
            is_active: true,
            visibility: 'public',
            is_system_template: false
        }
    });

    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasFormChanges, setHasFormChanges] = useState(false);
    const [originalFormValues, setOriginalFormValues] = useState<any>(null);

    // All hooks must be called before any early returns
    useEffect(() => {
        if (visible && editingTemplate) {
            const initialValues = {
                name: editingTemplate.name,
                description: editingTemplate.description,
                category: editingTemplate.category,
                language: editingTemplate.language,
                tags: editingTemplate.tags || [],
                is_active: editingTemplate.is_active,
                visibility: editingTemplate.visibility || 'public',
                is_system_template: editingTemplate.is_system_template || false,
            };
            // Set form values when editing
            reset(initialValues);
            setOriginalFormValues(initialValues);
            setIsSaved(true); // Existing templates are considered "saved"
            setHasFormChanges(false); // Reset form changes
        } else if (visible && !editingTemplate) {
            // Reset form for new template
            const initialValues = {
                name: '',
                description: '',
                category: '',
                language: '',
                tags: [],
                is_active: true,
                visibility: 'public',
                is_system_template: userType === 'system' ? false : false
            };
            reset(initialValues);
            setOriginalFormValues(initialValues);
            setIsSaved(false); // New templates start as unsaved
            setHasFormChanges(false); // Reset form changes
        }
    }, [visible, editingTemplate, reset, userType]);

    // Don't render anything if not visible - AFTER all hooks
    if (!visible) return null;

    // Check for form changes (excluding files)
    const checkFormChanges = () => {
        if (!originalFormValues) return;

        const currentValues = getValues();
        const fieldsToCheck = ['name', 'description', 'category', 'language', 'tags', 'is_active', 'visibility', 'is_system_template'];

        const hasChanges = fieldsToCheck.some(field => {
            const original = originalFormValues[field];
            const current = currentValues[field];

            // Handle arrays (tags) comparison
            if (Array.isArray(original) && Array.isArray(current)) {
                return JSON.stringify(original) !== JSON.stringify(current);
            }

            return original !== current;
        });

        setHasFormChanges(hasChanges);
    };

    const handleSave = handleFormSubmit(async (values) => {
        try {
            setIsLoading(true);
            if (onSave) {
                await onSave(values);
                setIsSaved(true);
            }
        } catch {
            // Save failed
        } finally {
            setIsLoading(false);
        }
    });

    const handleSubmit = handleFormSubmit(async (values) => {
        try {
            await onSubmit(values);
            reset();
            setIsSaved(false);
        } catch {
            // Submit failed
        }
    });

    return (
        <Dialog
            header={editingTemplate ? 'Template bearbeiten' : 'Neues Template erstellen'}
            visible={visible}
            onHide={onCancel}
            style={{ width: '800px' }}
            modal
            closable
            draggable={true}
            resizable={true}
        >
            <form className="space-y-4">
                {/* Template Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Name *
                    </label>
                    <Controller
                        name="name"
                        control={control}
                        rules={{
                            required: 'Bitte Template-Name eingeben!',
                            pattern: {
                                value: /^[a-z0-9]+(_[a-z0-9]+)*$/,
                                message: 'Template-Name darf nur Kleinbuchstaben, Zahlen und Unterstriche enthalten (z.B. my_template_123)'
                            }
                        }}
                        render={({ field }) => (
                            <InputText
                                id="name"
                                {...field}
                                placeholder="my_template_name"
                                className="w-full font-mono"
                                onChange={(e) => {
                                    field.onChange(e);
                                    checkFormChanges();
                                }}
                            />
                        )}
                    />
                    {errors.name && (
                        <small className="text-red-400 mt-1 block">{errors.name.message}</small>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                        Template-Namen werden später für URLs verwendet (username/template_name)
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-2">
                        Beschreibung
                    </label>
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <InputTextarea
                                id="description"
                                {...field}
                                rows={3}
                                placeholder="Template Beschreibung (optional)"
                                className="w-full"
                                onChange={(e) => {
                                    field.onChange(e);
                                    checkFormChanges();
                                }}
                            />
                        )}
                    />
                </div>

                <div className="flex gap-4">
                    {/* Category */}
                    <div className="flex-1">
                        <label htmlFor="category" className="block text-sm font-medium mb-2">
                            Kategorie *
                        </label>
                        <Controller
                            name="category"
                            control={control}
                            rules={{ required: 'Bitte Kategorie auswählen!' }}
                            render={({ field }) => (
                                <Dropdown
                                    id="category"
                                    value={field.value}
                                    onChange={(e) => {
                                        field.onChange(e.value);
                                        checkFormChanges();
                                    }}
                                    options={categories.filter(cat => cat !== 'All').map(cat => ({ label: cat, value: cat }))}
                                    placeholder="Kategorie auswählen"
                                    className="w-full"
                                />
                            )}
                        />
                        {errors.category && (
                            <small className="text-red-400 mt-1 block">{errors.category.message}</small>
                        )}
                    </div>

                    {/* Language */}
                    <div className="flex-1">
                        <label htmlFor="language" className="block text-sm font-medium mb-2">
                            Sprache *
                        </label>
                        <Controller
                            name="language"
                            control={control}
                            rules={{ required: 'Bitte Sprache eingeben!' }}
                            render={({ field }) => (
                                <InputText
                                    id="language"
                                    {...field}
                                    placeholder="e.g., PHP, JavaScript, TypeScript"
                                    className="w-full"
                                    onChange={(e) => {
                                        field.onChange(e);
                                        checkFormChanges();
                                    }}
                                />
                            )}
                        />
                        {errors.language && (
                            <small className="text-red-400 mt-1 block">{errors.language.message}</small>
                        )}
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <label htmlFor="tags" className="block text-sm font-medium mb-2">
                        Tags
                    </label>
                    <Controller
                        name="tags"
                        control={control}
                        render={({ field }) => (
                            <Chips
                                id="tags"
                                value={field.value}
                                onChange={(e) => {
                                    field.onChange(e.value);
                                    checkFormChanges();
                                }}
                                placeholder="Tags hinzufügen (Enter drücken)"
                                className="w-full"
                                separator=","
                            />
                        )}
                    />
                </div>

                <div className="flex gap-4">
                    {/* Visibility */}
                    <div className="flex-1">
                        <label htmlFor="visibility" className="block text-sm font-medium mb-2">
                            Sichtbarkeit *
                        </label>
                        <Controller
                            name="visibility"
                            control={control}
                            rules={{ required: 'Bitte Sichtbarkeit auswählen!' }}
                            render={({ field }) => (
                                <Dropdown
                                    id="visibility"
                                    value={field.value}
                                    onChange={(e) => {
                                        field.onChange(e.value);
                                        checkFormChanges();
                                    }}
                                    options={[
                                        { label: 'Public', value: 'public' },
                                        { label: 'Private', value: 'private' }
                                    ]}
                                    placeholder="Sichtbarkeit wählen"
                                    className="w-full"
                                />
                            )}
                        />
                        {errors.visibility && (
                            <small className="text-red-400 mt-1 block">{errors.visibility.message}</small>
                        )}
                    </div>

                    {/* System Template (conditional) */}
                    {userType === 'system' && (
                        <div className="flex-1">
                            <label htmlFor="is_system_template" className="block text-sm font-medium mb-2">
                                System Template
                            </label>
                            <Controller
                                name="is_system_template"
                                control={control}
                                render={({ field }) => (
                                    <div className="flex items-center mt-2">
                                        <Checkbox
                                            inputId="is_system_template"
                                            checked={field.value}
                                            onChange={(e) => {
                                                field.onChange(e.checked);
                                                checkFormChanges();
                                            }}
                                        />
                                        <label htmlFor="is_system_template" className="ml-2">
                                            System Template
                                        </label>
                                    </div>
                                )}
                            />
                        </div>
                    )}
                </div>

                {/* Template Files Section */}
                <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-300">Template Dateien</h3>
                        <Button
                            size="small"
                            icon="pi pi-plus"
                            disabled={!isSaved && !editingTemplate}
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onCreateFile();
                            }}
                            className="p-button-primary"
                        >
                            Datei hinzufügen
                        </Button>
                    </div>

                   {!isSaved && !editingTemplate && (
                       <div className="mb-4 p-3 bg-blue-500 bg-opacity-20 border border-blue-500 rounded text-blue-300 text-sm">
                           Bitte speichern Sie das Template, erst dann können Sie Dateien zum Template hinzufügen
                       </div>
                   )}

                   {editingTemplate && (
                       <div className="mb-4 p-3 bg-blue-500 bg-opacity-20 border border-blue-500 rounded text-blue-300 text-sm">
                           Hinweis: Dateien werden sofort dem Template zugewiesen. Änderungen an Template-Details (Name, Beschreibung, etc.) müssen separat gespeichert werden.
                       </div>
                   )}
                    
                    {templateFiles.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto border border-gray-600 rounded bg-gray-700">
                            <table className="w-full text-sm text-gray-100">
                                <thead className="bg-gray-600 border-b border-gray-500">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-gray-100">Name</th>
                                        <th className="px-3 py-2 text-left text-gray-100">Typ</th>
                                        <th className="px-3 py-2 text-left text-gray-100">Größe</th>
                                        <th className="px-3 py-2 text-left text-gray-100">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {templateFiles.map((file, index) => (
                                        <tr key={file.id || index} className="border-t border-gray-600 hover:bg-gray-600 transition-colors">
                                            <td className="px-3 py-2">
                                                <div className="flex items-center text-gray-100">
                                                    <i className="pi pi-file mr-2 text-gray-300"></i>
                                                    {file.file_name}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
                                                    {fileTypes.find(ft => ft.value === file.file_type)?.label || file.file_type}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-gray-100">
                                                {file.file_content?.length || 0} Zeichen
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="small"
                                                        icon="pi pi-pencil"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            onEditFile(file);
                                                        }}
                                                        className="p-button-text p-button-sm text-blue-400 hover:text-blue-300"
                                                    />
                                                    <Button
                                                        size="small"
                                                        icon="pi pi-trash"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            onDeleteFile(index);
                                                        }}
                                                        className="p-button-text p-button-danger p-button-sm text-red-400 hover:text-red-300"
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-300 border border-gray-600 rounded bg-gray-700">
                            Keine Dateien hinzugefügt. Klicken Sie auf "Datei hinzufügen" um zu beginnen.
                        </div>
                    )}
                </div>

                {/* Is Active */}
                <div className="mt-4">
                    <Controller
                        name="is_active"
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center">
                                <Checkbox
                                    inputId="is_active"
                                    checked={field.value}
                                    onChange={(e) => {
                                        field.onChange(e.checked);
                                        checkFormChanges();
                                    }}
                                />
                                <label htmlFor="is_active" className="ml-2">
                                    Template ist aktiv
                                </label>
                            </div>
                        )}
                    />
                </div>

                <div className="flex gap-2 justify-end">
                    <Button type="button" onClick={onCancel}>
                        Abbrechen
                    </Button>

                    {/* Save button - only for new templates */}
                    {!editingTemplate && (
                        <Button
                            type="button"
                            onClick={handleSave}
                            loading={isLoading}
                            disabled={isSaved}
                            className={isSaved ? 'opacity-50' : ''}
                        >
                            {isSaved ? 'Gespeichert ✓' : 'Speichern'}
                        </Button>
                    )}

                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={editingTemplate && !hasFormChanges}
                        className={editingTemplate && !hasFormChanges ? 'opacity-50' : ''}
                    >
                        {editingTemplate ?
                            (hasFormChanges ? 'Aktualisieren' : 'Keine Änderungen') :
                            'Erstellen'
                        }
                    </Button>
                </div>
            </form>
        </Dialog>
    );
};

export default TemplateModal;