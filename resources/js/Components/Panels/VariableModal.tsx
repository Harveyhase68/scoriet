import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';

interface TemplateVariable {
    id?: number;
    variable_name: string;
    description: string | null;
    default_value: string | null;
    is_required: boolean;
}

interface VariableModalProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: any) => Promise<void>;
    editingVariable: TemplateVariable | null;
}

const VariableModal: React.FC<VariableModalProps> = ({
    visible,
    onCancel,
    onSubmit,
    editingVariable
}) => {
    const { control, handleSubmit: handleFormSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            variable_name: '',
            description: '',
            default_value: '',
            is_required: false
        }
    });

    useEffect(() => {
        if (visible && editingVariable) {
            reset({
                variable_name: editingVariable.variable_name,
                description: editingVariable.description || '',
                default_value: editingVariable.default_value || '',
                is_required: editingVariable.is_required
            });
        } else if (visible && !editingVariable) {
            reset({
                variable_name: '',
                description: '',
                default_value: '',
                is_required: false
            });
        }
    }, [visible, editingVariable, reset]);

    if (!visible) return null;

    const handleSubmit = handleFormSubmit(async (values) => {
        try {
            await onSubmit(values);
            reset();
        } catch {
            // Submit failed
        }
    });

    return (
        <Dialog
            header={editingVariable ? 'Variable bearbeiten' : 'Variable hinzufügen'}
            visible={visible}
            onHide={onCancel}
            style={{ width: '600px' }}
            modal
            closable
            draggable={true}
            resizable={true}
        >
            <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Variable Name */}
                <div>
                    <label htmlFor="variable_name" className="block text-sm font-medium mb-2">
                        Variable Name *
                    </label>
                    <Controller
                        name="variable_name"
                        control={control}
                        rules={{
                            required: 'Variable Name ist erforderlich',
                            pattern: {
                                value: /^[a-z_][a-z0-9_]*$/i,
                                message: 'Variable Name darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen (z.B. copyright, company_name)'
                            }
                        }}
                        render={({ field }) => (
                            <InputText
                                id="variable_name"
                                {...field}
                                placeholder="copyright"
                                className="w-full font-mono"
                                disabled={!!editingVariable} // Disable editing variable name for existing variables
                            />
                        )}
                    />
                    {errors.variable_name && (
                        <small className="text-red-400 mt-1 block">{errors.variable_name.message}</small>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                        Wird als Platzhalter verwendet: {'{variable_name}'}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-2">
                        {t.templatemanagementpanel859}
                    </label>
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <InputTextarea
                                id="description"
                                {...field}
                                rows={3}
                                placeholder="Z.B. 'Copyright-Hinweis für das Projekt'"
                                className="w-full"
                            />
                        )}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                        Hilft Benutzern zu verstehen, wofür diese Variable verwendet wird
                    </div>
                </div>

                {/* Default Value */}
                <div>
                    <label htmlFor="default_value" className="block text-sm font-medium mb-2">
                        Standard-Wert
                    </label>
                    <Controller
                        name="default_value"
                        control={control}
                        render={({ field }) => (
                            <InputText
                                id="default_value"
                                {...field}
                                placeholder="Z.B. '© 2024 My Company'"
                                className="w-full"
                            />
                        )}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                        Wird verwendet, wenn der Benutzer keinen Wert eingibt
                    </div>
                </div>

                {/* Is Required */}
                <div>
                    <Controller
                        name="is_required"
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    inputId="is_required"
                                    checked={field.value}
                                    onChange={(e) => field.onChange(e.checked)}
                                />
                                <label htmlFor="is_required" className="cursor-pointer text-gray-200">
                                    Variable ist erforderlich
                                </label>
                            </div>
                        )}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                        Wenn aktiviert, müssen Benutzer einen Wert für diese Variable angeben
                    </div>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button type="button" onClick={onCancel}>
                        Abbrechen
                    </Button>
                    <Button type="submit" className="p-button-primary">
                        {editingVariable ? 'Aktualisieren' : 'Erstellen'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
};

export default VariableModal;
