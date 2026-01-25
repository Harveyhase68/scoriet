import React, { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { AutoComplete } from 'primereact/autocomplete';
import { Chips } from 'primereact/chips';
import { Checkbox } from 'primereact/checkbox';
//import { TabView, TabPanel } from 'primereact/tabview';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { usePage } from '@inertiajs/react';
import { ProtectedFilesEditor } from '@/Components/ProtectedFilesEditor';
import { DeploymentScriptsEditor, ScriptStep } from '@/Components/DeploymentScriptsEditor';
import PlanModal from '@/Components/AuthModals/PlanModal';
import { useTheme } from '@/contexts/ThemeContext';

interface TemplateVariable {
    id?: number;
    variable_name: string;
    description: string | null;
    default_value: string | null;
    is_required: boolean;
}


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
    templateVariables?: TemplateVariable[];
    onLoadVariables?: () => void;
    onCreateVariable?: () => void;
    onEditVariable?: (variable: TemplateVariable) => void;
    onDeleteVariable?: (variableId: number) => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({
    visible,
    onCancel,
    onSubmit,
    onSave,
    editingTemplate,
    templateFiles,
    onCreateFile,
    onEditFile,
    onDeleteFile,
    fileTypes,
    userType,
    templateVariables = [],
    onLoadVariables,
    onCreateVariable,
    onEditVariable,
    onDeleteVariable
}) => {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();

  // Get template categories and languages from Inertia props
  const { props } = usePage<any>();
  const templateCategories = props.templateCategories || [];
  const templateLanguages = props.templateLanguages || [];

  // AutoComplete filtered suggestions
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
      const { control, handleSubmit: handleFormSubmit, reset, getValues, watch, formState: { errors } } = useForm({
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

    // Protected files and deployment scripts state
    const [protectedFiles, setProtectedFiles] = useState<string[]>([]);
    const [installScript, setInstallScript] = useState<ScriptStep[]>([]);
    const [updateScript, setUpdateScript] = useState<ScriptStep[]>([]);

    // Store original protected files and scripts for change detection
    const [originalProtectedFiles, setOriginalProtectedFiles] = React.useState<string[]>([]);
    const [originalInstallScript, setOriginalInstallScript] = React.useState<ScriptStep[]>([]);
    const [originalUpdateScript, setOriginalUpdateScript] = React.useState<ScriptStep[]>([]);

    // Check if private template needs unlock (for free users)
    const checkPrivateTemplateSubscription = useCallback(async () => {
        setCheckingSubscription(true);
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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
            console.error('Error checking private template subscription:', err);
        } finally {
            setCheckingSubscription(false);
        }
    }, []);

    // Refresh user credits
    const refreshCredits = useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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
            console.error('Error refreshing credits:', err);
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

            // Load protected files and scripts
            const loadedProtectedFiles = editingTemplate.protected_files || [];
            const loadedInstallScript = editingTemplate.install_script || [];
            const loadedUpdateScript = editingTemplate.update_script || [];

            setProtectedFiles(loadedProtectedFiles);
            setInstallScript(loadedInstallScript);
            setUpdateScript(loadedUpdateScript);

            // Store originals for change detection
            setOriginalProtectedFiles(loadedProtectedFiles);
            setOriginalInstallScript(loadedInstallScript);
            setOriginalUpdateScript(loadedUpdateScript);

            // Load template variables
            if (onLoadVariables) {
                onLoadVariables();
            }

            // Reset unlock states for editing
            setNeedsPrivateUnlock(false);
            setPrivateUnlockConfirmed(false);
            setHasCheckedSubscription(false);
            setAvailableSlots(0);
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

            // Reset protected files and scripts for new template
            setProtectedFiles([]);
            setInstallScript([]);
            setUpdateScript([]);

            // Reset originals
            setOriginalProtectedFiles([]);
            setOriginalInstallScript([]);
            setOriginalUpdateScript([]);

            // Reset unlock states for new template
            setNeedsPrivateUnlock(false);
            setPrivateUnlockConfirmed(false);
            setHasCheckedSubscription(false);
            setAvailableSlots(0);
        }

    }, [visible, editingTemplate, reset, userType]);

    // Effect to check for changes when protected files or scripts change
    useEffect(() => {
        if (editingTemplate) {
            checkFormChanges();
        }
    }, [protectedFiles, installScript, updateScript]);

    // Don't render anything if not visible - AFTER all hooks
    if (!visible) return null;

    // Check for form changes (including protected files and scripts)
    const checkFormChanges = () => {
        if (!originalFormValues) return;

        const currentValues = getValues();
        const fieldsToCheck: (keyof typeof currentValues)[] = ['name', 'description', 'category', 'language', 'tags', 'is_active', 'visibility', 'is_system_template'];

        const formFieldsChanged = fieldsToCheck.some(field => {
            const original = originalFormValues[field];
            const current = currentValues[field];

            // Handle arrays (tags) comparison
            if (Array.isArray(original) && Array.isArray(current)) {
                return JSON.stringify(original) !== JSON.stringify(current);
            }

            return original !== current;
        });

        // Check if protected files or scripts changed
        const protectedFilesChanged = JSON.stringify(protectedFiles) !== JSON.stringify(originalProtectedFiles);
        const installScriptChanged = JSON.stringify(installScript) !== JSON.stringify(originalInstallScript);
        const updateScriptChanged = JSON.stringify(updateScript) !== JSON.stringify(originalUpdateScript);

        const hasChanges = formFieldsChanged || protectedFilesChanged || installScriptChanged || updateScriptChanged;

        setHasFormChanges(hasChanges);
    };

    const handleSave = handleFormSubmit(async (values) => {
        try {
            setIsLoading(true);
            if (onSave) {
                // Include protected files and scripts in the save
                const saveData = {
                    ...values,
                    protected_files: protectedFiles,
                    install_script: installScript,
                    update_script: updateScript
                };
                await onSave(saveData);
                setIsSaved(true);
            }
        } catch {
            // Save failed
        } finally {
            setIsLoading(false);
        }
    });

    const handleSubmit = handleFormSubmit(async (values) => {
        // Include protected files and scripts in the submission
        const submissionData = {
            ...values,
            protected_files: protectedFiles,
            install_script: installScript,
            update_script: updateScript
        };
        await onSubmit(submissionData);
        reset();
        setIsSaved(false);
    });

    return (
        <>
        <Dialog
            header={editingTemplate ? t.templatemodal186 : t.templatemodal147}
            visible={visible}
            onHide={onCancel}
            style={{ width: '800px' }}
            contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
            headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
            modal
            closable
            draggable={true}
            resizable={true}
        >
            <form className="template-modal-form space-y-4">
                {/* Template Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                        {t.templatemodal199}
                    </label>
                    <Controller
                        name="name"
                        control={control}
                        rules={{
                            required: t.templatemodal166,
                            pattern: {
                                value: /^[a-z0-9]+(_[a-z0-9]+)*$/,
                                message: t.templatemodal208
                            }
                        }}
                        render={({ field }) => (
                            <InputText
                                id="name"
                                {...field}
                                placeholder="my_template_name"
                                className="w-full font-mono"
                                onChange={(e) => {
                                    // Sanitize: only allow lowercase letters, numbers, and underscores
                                    const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                                    field.onChange(sanitized);
                                    checkFormChanges();
                                }}
                            />
                        )}
                    />
                    {errors.name && (
                        <small className="text-red-400 mt-1 block">{errors.name.message}</small>
                    )}
                    <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                        {t.templatemodal228}
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
                                placeholder={t.templatemodal206}
                                className="w-full"
                                onChange={(e) => {
                                    field.onChange(e);
                                    checkFormChanges();
                                }}
                            />
                        )}
                    />
                </div>

                {/* Category - Full Width with AutoComplete */}
                <div>
                    <label htmlFor="category" className="block text-sm font-medium mb-2">
                        {t.templatemodal220}
                    </label>
                    <Controller
                        name="category"
                        control={control}
                        rules={{ required: t.templatemodal226 }}
                        render={({ field }) => (
                            <AutoComplete
                                id="category"
                                value={field.value}
                                suggestions={filteredCategories}
                                completeMethod={(e) => {
                                    const query = e.query.toLowerCase();
                                    const filtered = templateCategories.filter((cat: string) =>
                                        cat.toLowerCase().includes(query)
                                    );
                                    setFilteredCategories(filtered);
                                }}
                                onChange={(e) => {
                                    field.onChange(e.value);
                                    checkFormChanges();
                                }}
                                placeholder={t.templatemodal281}
                                className="w-full"
                                inputClassName="w-full"
                                panelClassName="template-modal-autocomplete-panel"
                                dropdown
                                forceSelection={false}
                            />
                        )}
                    />
                    {errors.category && (
                        <small className="text-red-400 mt-1 block">{errors.category.message}</small>
                    )}
                    <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                        {t.templatemodal293} {templateCategories.slice(0, 5).join(', ')}...
                    </div>
                </div>

                {/* Language - Full Width with AutoComplete */}
                <div>
                    <label htmlFor="language" className="block text-sm font-medium mb-2">
                        {t.templatemodal248}
                    </label>
                    <Controller
                        name="language"
                        control={control}
                        rules={{ required: t.templatemodal254 }}
                        render={({ field }) => (
                            <AutoComplete
                                id="language"
                                value={field.value}
                                suggestions={filteredLanguages}
                                completeMethod={(e) => {
                                    const query = e.query.toLowerCase();
                                    const filtered = templateLanguages.filter((lang: string) =>
                                        lang.toLowerCase().includes(query)
                                    );
                                    setFilteredLanguages(filtered);
                                }}
                                onChange={(e) => {
                                    field.onChange(e.value);
                                    checkFormChanges();
                                }}
                                placeholder={t.templatemodal322}
                                className="w-full"
                                inputClassName="w-full"
                                panelClassName="template-modal-autocomplete-panel"
                                dropdown
                                forceSelection={false}
                            />
                        )}
                    />
                    {errors.language && (
                        <small className="text-red-400 mt-1 block">{errors.language.message}</small>
                    )}
                    <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                        {t.templatemodal334} {templateLanguages.slice(0, 5).join(', ')}...
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
                                placeholder={t.templatemodal290}
                                className="w-full"
                                separator=","
                                pt={{
                                    container: { className: 'w-full' },
                                    input: { className: 'flex-1 w-full' }
                                }}
                            />
                        )}
                    />
                </div>

                <div className="flex gap-4">
                    {/* Visibility - Hidden if locked (cloned from store) */}
                    {editingTemplate?.visibility_locked ? (
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                {t.templatemodal366}
                            </label>
                            <div className="p-3 rounded-lg" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                                <div className="flex items-center gap-2">
                                    <i className="pi pi-lock text-yellow-500"></i>
                                    <span style={{ color: colors.textSecondary }}>Private (gesperrt)</span>
                                </div>
                                <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                    Von einem gekauften Template geklont - Sichtbarkeit kann nicht geändert werden
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1">
                            <label htmlFor="visibility" className="block text-sm font-medium mb-2">
                                {t.templatemodal366}
                            </label>
                            <Controller
                                name="visibility"
                                control={control}
                                rules={{ required: t.templatemodal307 }}
                                render={({ field }) => (
                                    <Dropdown
                                        id="visibility"
                                        value={field.value}
                                        onChange={(e) => {
                                            field.onChange(e.value);
                                            checkFormChanges();
                                            // Check if private template unlock is needed for new templates
                                            if (e.value === 'private' && !editingTemplate && !privateUnlockConfirmed) {
                                                checkPrivateTemplateSubscription();
                                            } else if (e.value === 'public' || e.value === 'store') {
                                                setNeedsPrivateUnlock(false);
                                                setHasCheckedSubscription(false);
                                                setAvailableSlots(0);
                                            }
                                        }}
                                        options={[
                                            { label: t.databasemanagementpanel772 + ' (FREE)', value: 'public' },
                                            { label: t.databasemanagementpanel771 + ' (50 Credits/Jahr)', value: 'private' },
                                            { label: 'Store (Approval required)', value: 'store' }
                                        ]}
                                        placeholder={t.templatemodal320}
                                        className="w-full"
                                        panelClassName="template-modal-dropdown-panel"
                                    />
                                )}
                            />
                            {errors.visibility && (
                                <small className="text-red-400 mt-1 block">{errors.visibility.message}</small>
                            )}
                        </div>
                    )}

                    {/* System Template (conditional) */}
                    {userType === 'system' && (
                        <div className="flex-1">
                            <label htmlFor="is_system_template" className="block text-sm font-medium mb-2">
                                {t.templatemodal399}
                            </label>
                            <Controller
                                name="is_system_template"
                                control={control}
                                render={({ field }) => (
                                    <div className="flex items-center gap-2 mt-2">
                                        <Checkbox
                                            inputId="is_system_template"
                                            checked={field.value}
                                            onChange={(e) => {
                                                field.onChange(e.checked);
                                                checkFormChanges();
                                            }}
                                        />
                                        <label htmlFor="is_system_template" className="cursor-pointer" style={{ color: colors.textSecondary }}>
                                            {t.templatemodal399}
                                        </label>
                                    </div>
                                )}
                            />
                        </div>
                    )}
                </div>

                {/* Private Template Unlock Section - Only for new templates with private visibility */}
                {!editingTemplate && getValues().visibility === 'private' && (
                    <div className="space-y-3 mt-4">
                        {checkingSubscription ? (
                            <div className="py-4 text-center bg-gray-800 rounded-lg border border-gray-700">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                <p className="text-gray-400 text-sm">Überprüfe Subscription...</p>
                            </div>
                        ) : needsPrivateUnlock ? (
                            <>
                                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                                    <p className="text-yellow-300 text-sm mb-1">
                                        <i className="pi pi-lock mr-2"></i>
                                        <strong>Private Template - Premium Feature</strong>
                                    </p>
                                    <p className="text-gray-300 text-xs">
                                        Private Templates kosten <strong>50 Credits pro Jahr</strong>. Öffentliche Templates sind kostenlos!
                                    </p>
                                </div>

                                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                                    <div className="flex justify-between items-center text-sm mb-1">
                                        <span className="text-gray-300">Ihre Credits:</span>
                                        <span className="text-white font-bold">{currentUser?.credits || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mb-1">
                                        <span className="text-gray-300">Benötigt:</span>
                                        <span className="text-yellow-400 font-bold">50</span>
                                    </div>
                                    <hr className="border-gray-700 my-1" />
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-300">Danach:</span>
                                        <span className={`font-bold ${(currentUser?.credits || 0) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                            {(currentUser?.credits || 0) >= 50 ? (currentUser?.credits || 0) - 50 : `${50 - (currentUser?.credits || 0)} fehlen`}
                                        </span>
                                    </div>
                                </div>

                                {(currentUser?.credits || 0) < 50 && (
                                    <div className="bg-red-900/20 border border-red-700 rounded-lg p-2">
                                        <p className="text-red-300 text-xs">
                                            Sie benötigen <strong>{50 - (currentUser?.credits || 0)} weitere Credits</strong>.
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {(currentUser?.credits || 0) >= 50 ? (
                                        <Button
                                            type="button"
                                            onClick={handlePrivateUnlockConfirm}
                                            className="flex-1 p-button-success p-button-sm"
                                            icon="pi pi-unlock"
                                            label="Freischalten (50 Credits)"
                                        />
                                    ) : (
                                        <Button
                                            type="button"
                                            onClick={handleBuyCredits}
                                            className="flex-1 p-button-warning p-button-sm"
                                            icon="pi pi-shopping-cart"
                                            label="Credits kaufen"
                                        />
                                    )}
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            reset({ ...getValues(), visibility: 'public' });
                                            setNeedsPrivateUnlock(false);
                                            setHasCheckedSubscription(false);
                                        }}
                                        className="p-button-secondary p-button-sm"
                                        icon="pi pi-globe"
                                        label="Öffentlich"
                                    />
                                </div>
                            </>
                        ) : privateUnlockConfirmed ? (
                            <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
                                <p className="text-green-300 text-sm flex items-center gap-2">
                                    <i className="pi pi-check-circle"></i>
                                    <strong>Freigeschaltet!</strong> 50 Credits werden beim Speichern abgezogen.
                                </p>
                            </div>
                        ) : hasCheckedSubscription && availableSlots > 0 ? (
                            <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
                                <p className="text-green-300 text-sm flex items-center gap-2">
                                    <i className="pi pi-check-circle"></i>
                                    <strong>Slot verfügbar!</strong> Sie haben noch {availableSlots} freie{availableSlots === 1 ? 'n' : ''} Private-Template-Slot{availableSlots === 1 ? '' : 's'}.
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                    Keine zusätzlichen Credits erforderlich.
                                </p>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* Store Template Info Section */}
                {watch('visibility') === 'store' && (
                    <div className="space-y-3 mt-4">
                        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-3">
                            <p className="text-purple-300 text-sm mb-2">
                                <i className="pi pi-shopping-cart mr-2"></i>
                                <strong>Store Template - Verkaufe dein Template!</strong>
                            </p>
                            <p className="text-gray-300 text-xs mb-2">
                                Dein Template wird im Store angezeigt, sobald es von einem Admin freigegeben wurde oder 5+ positive Reviews hat.
                            </p>
                            <p className="text-gray-400 text-xs">
                                <i className="pi pi-info-circle mr-1"></i>
                                Preiseinstellung und Media-Upload sind nach dem Speichern im <strong>Store-Tab</strong> des Template Managements verfügbar.
                            </p>
                        </div>
                    </div>
                )}

                {/* Template Files Section */}
                <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold" style={{ color: colors.textSecondary }}>{t.templatemodal362}</h3>
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
                            {t.templatemodal438}
                        </Button>
                    </div>

                   {!isSaved && !editingTemplate && (
                       <div className="mb-4 p-3 bg-blue-500 bg-opacity-20 border border-blue-500 rounded text-blue-300 text-sm">
                           {t.templatemodal444}
                       </div>
                   )}

                   {editingTemplate && (
                       <div className="mb-4 p-3 bg-blue-500 bg-opacity-20 border border-blue-500 rounded text-blue-300 text-sm">
                           {t.templatemodal450}
                       </div>
                   )}
                    
                    {templateFiles.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto rounded" style={{ border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
                            <table className="w-full text-sm" style={{ color: colors.textPrimary }}>
                                <thead style={{ backgroundColor: colors.bgTertiary, borderBottom: `1px solid ${colors.borderPrimary}` }}>
                                    <tr>
                                        <th className="px-3 py-2 text-left" style={{ color: colors.textPrimary }}>Name</th>
                                        <th className="px-3 py-2 text-left" style={{ color: colors.textPrimary }}>Typ</th>
                                        <th className="px-3 py-2 text-left" style={{ color: colors.textPrimary }}>Größe</th>
                                        <th className="px-3 py-2 text-left" style={{ color: colors.textPrimary }}>Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {templateFiles.map((file, index) => (
                                        <tr key={file.id || index} className="transition-colors" style={{ borderTop: `1px solid ${colors.borderPrimary}` }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgHover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center" style={{ color: colors.textPrimary }}>
                                                    <i className="pi pi-file mr-2" style={{ color: colors.textSecondary }}></i>
                                                    {file.file_name}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
                                                    {fileTypes.find(ft => ft.value === file.file_type)?.label || file.file_type}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2" style={{ color: colors.textPrimary }}>
                                                {file.file_content?.length || 0} {t.templatemodal480}
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
                        <div className="text-center py-8 rounded" style={{ color: colors.textSecondary, border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
                            {t.templatemodal513}
                        </div>
                    )}
                </div>

                {/* Custom Variables Section */}
                <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold" style={{ color: colors.textSecondary }}>{t.templatemodal521}</h3>
                        <Button
                            size="small"
                            icon="pi pi-plus"
                            disabled={!isSaved && !editingTemplate}
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (onCreateVariable) {
                                    onCreateVariable();
                                }
                            }}
                            className="p-button-primary"
                        >
                            {t.templatemodal535}
                        </Button>
                    </div>

                    {!isSaved && !editingTemplate && (
                        <div className="mb-4 p-3 bg-blue-500 bg-opacity-20 border border-blue-500 rounded text-blue-300 text-sm">
                            {t.templatemodal541}
                        </div>
                    )}

                    {editingTemplate && (
                        <div className="mb-4 p-3 bg-blue-500 bg-opacity-20 border border-blue-500 rounded text-blue-300 text-sm">
                            {t.templatemodal547}
                        </div>
                    )}

                    {templateVariables && templateVariables.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto rounded" style={{ border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
                            <table className="w-full text-sm" style={{ color: colors.textPrimary }}>
                                <thead style={{ backgroundColor: colors.bgTertiary, borderBottom: `1px solid ${colors.borderPrimary}` }}>
                                    <tr>
                                        <th className="px-3 py-2 text-left" style={{ color: colors.textPrimary }}>Variable Name</th>
                                        <th className="px-3 py-2 text-left" style={{ color: colors.textPrimary }}>Beschreibung</th>
                                        <th className="px-3 py-2 text-left" style={{ color: colors.textPrimary }}>Default</th>
                                        <th className="px-3 py-2 text-left" style={{ color: colors.textPrimary }}>Pflicht</th>
                                        <th className="px-3 py-2 text-left" style={{ color: colors.textPrimary }}>Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {templateVariables.map((variable, index) => (
                                        <tr key={variable.id || index} className="transition-colors" style={{ borderTop: `1px solid ${colors.borderPrimary}` }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgHover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center" style={{ color: colors.textPrimary }}>
                                                    <span className="font-mono text-yellow-300">{'{' + variable.variable_name + '}'}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2" style={{ color: colors.textPrimary }}>
                                                {variable.description || '-'}
                                            </td>
                                            <td className="px-3 py-2" style={{ color: colors.textPrimary }}>
                                                {variable.default_value || '-'}
                                            </td>
                                            <td className="px-3 py-2">
                                                {variable.is_required ? (
                                                    <span className="px-2 py-1 bg-red-500 text-white rounded text-xs">
                                                        {t.templatemodal580}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-gray-500 text-white rounded text-xs">
                                                        {t.templatemodal584}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="small"
                                                        icon="pi pi-pencil"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            if (onEditVariable) {
                                                                onEditVariable(variable);
                                                            }
                                                        }}
                                                        className="p-button-text p-button-sm text-blue-400 hover:text-blue-300"
                                                    />
                                                    <Button
                                                        size="small"
                                                        icon="pi pi-trash"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            if (variable.id && onDeleteVariable) {
                                                                if (window.confirm(`Variable "${variable.variable_name}" wirklich löschen?`)) {
                                                                    onDeleteVariable(variable.id);
                                                                }
                                                            }
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
                        <div className="text-center py-8 rounded" style={{ color: colors.textSecondary, border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
                            {t.templatemodal625}
                        </div>
                    )}
                </div>

                {/* Is Active */}
                <div className="mt-4">
                    <Controller
                        name="is_active"
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    inputId="is_active"
                                    checked={field.value}
                                    onChange={(e) => {
                                        field.onChange(e.checked);
                                        checkFormChanges();
                                    }}
                                />
                                <label htmlFor="is_active" className="cursor-pointer" style={{ color: colors.textSecondary }}>
                                    {t.templatemodal646}
                                </label>
                            </div>
                        )}
                    />
                </div>

                {/* Protected Files Section */}
                <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textSecondary }}>Protected Files</h3>
                    <ProtectedFilesEditor
                        files={protectedFiles}
                        onChange={setProtectedFiles}
                    />
                </div>

                {/* Deployment Scripts Section */}
                <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textSecondary }}>Deployment Scripts</h3>
                    <DeploymentScriptsEditor
                        installScript={installScript}
                        updateScript={updateScript}
                        onInstallScriptChange={setInstallScript}
                        onUpdateScriptChange={setUpdateScript}
                    />
                </div>

                <div className="flex gap-2 justify-end">
                    <Button type="button" onClick={onCancel}>
                        {t.templatemodal655}
                    </Button>

                    {/* Save button - only for new templates */}
                    {!editingTemplate && (
                        <Button
                            type="button"
                            onClick={handleSave}
                            loading={isLoading}
                            disabled={isSaved || (getValues().visibility === 'private' && needsPrivateUnlock && !privateUnlockConfirmed)}
                            className={(isSaved || (getValues().visibility === 'private' && needsPrivateUnlock && !privateUnlockConfirmed)) ? 'opacity-50' : ''}
                            tooltip={getValues().visibility === 'private' && needsPrivateUnlock && !privateUnlockConfirmed ? 'Bitte erst "Freischalten" klicken' : undefined}
                        >
                            {isSaved ? t.templatemodal667 : t.cmsadminpanel279}
                        </Button>
                    )}

                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={(editingTemplate && !hasFormChanges) || (!editingTemplate && getValues().visibility === 'private' && needsPrivateUnlock && !privateUnlockConfirmed)}
                        className={((editingTemplate && !hasFormChanges) || (!editingTemplate && getValues().visibility === 'private' && needsPrivateUnlock && !privateUnlockConfirmed)) ? 'opacity-50' : ''}
                        tooltip={!editingTemplate && getValues().visibility === 'private' && needsPrivateUnlock && !privateUnlockConfirmed ? 'Bitte erst "Freischalten" klicken' : undefined}
                    >
                        {editingTemplate ?
                            (hasFormChanges ? t.applicationsmodal313 : t.templatemodal502) :
                            t.teammodal240
                        }
                    </Button>
                </div>
            </form>

            {/* Theme-aware styles for PrimeReact components */}
            <style>{`
                .template-modal-form .p-inputtext {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-modal-form .p-inputtext:focus {
                    border-color: var(--theme-accent) !important;
                    box-shadow: 0 0 0 1px var(--theme-accent) !important;
                }
                .template-modal-form .p-inputtext::placeholder {
                    color: var(--theme-text-muted) !important;
                }
                .template-modal-form .p-inputtextarea {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-modal-form .p-inputtextarea:focus {
                    border-color: var(--theme-accent) !important;
                    box-shadow: 0 0 0 1px var(--theme-accent) !important;
                }
                .template-modal-form .p-autocomplete .p-autocomplete-input {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-modal-form .p-autocomplete .p-autocomplete-input:focus {
                    border-color: var(--theme-accent) !important;
                    box-shadow: 0 0 0 1px var(--theme-accent) !important;
                }
                /* AutoComplete Panel - rendered as portal outside dialog */
                .template-modal-autocomplete-panel {
                    background-color: var(--theme-bg-secondary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-modal-autocomplete-panel .p-autocomplete-items {
                    background-color: var(--theme-bg-secondary) !important;
                }
                .template-modal-autocomplete-panel .p-autocomplete-items .p-autocomplete-item {
                    color: var(--theme-text-primary) !important;
                    background-color: var(--theme-bg-secondary) !important;
                }
                .template-modal-autocomplete-panel .p-autocomplete-items .p-autocomplete-item:hover {
                    background-color: var(--theme-bg-tertiary) !important;
                }
                .template-modal-autocomplete-panel .p-autocomplete-items .p-autocomplete-item.p-highlight {
                    background-color: var(--theme-accent) !important;
                    color: white !important;
                }
                .template-modal-form .p-chips .p-chips-multiple-container {
                    background-color: var(--theme-bg-secondary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-modal-form .p-chips .p-chips-multiple-container:focus-within {
                    border-color: var(--theme-accent) !important;
                    box-shadow: 0 0 0 1px var(--theme-accent) !important;
                }
                .template-modal-form .p-chips .p-chips-multiple-container .p-chips-input-token input {
                    color: var(--theme-text-primary) !important;
                }
                .template-modal-form .p-chips .p-chips-multiple-container .p-chips-token {
                    background-color: var(--theme-accent) !important;
                    color: white !important;
                }
                .template-modal-form .p-dropdown {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-modal-form .p-dropdown:focus,
                .template-modal-form .p-dropdown.p-focus {
                    border-color: var(--theme-accent) !important;
                    box-shadow: 0 0 0 1px var(--theme-accent) !important;
                }
                .template-modal-form .p-dropdown .p-dropdown-label {
                    color: var(--theme-text-primary) !important;
                }
                /* Dropdown Panel - rendered as portal outside dialog */
                .template-modal-dropdown-panel {
                    background-color: var(--theme-bg-secondary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-modal-dropdown-panel .p-dropdown-items {
                    background-color: var(--theme-bg-secondary) !important;
                }
                .template-modal-dropdown-panel .p-dropdown-item {
                    color: var(--theme-text-primary) !important;
                    background-color: var(--theme-bg-secondary) !important;
                }
                .template-modal-dropdown-panel .p-dropdown-item:hover {
                    background-color: var(--theme-bg-tertiary) !important;
                }
                .template-modal-dropdown-panel .p-dropdown-item.p-highlight {
                    background-color: var(--theme-accent) !important;
                    color: white !important;
                }
                .template-modal-form .p-checkbox .p-checkbox-box {
                    background-color: var(--theme-bg-secondary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-modal-form .p-checkbox .p-checkbox-box.p-highlight {
                    background-color: var(--theme-accent) !important;
                    border-color: var(--theme-accent) !important;
                }
                .template-modal-form label {
                    color: var(--theme-text-secondary) !important;
                }
            `}</style>
        </Dialog>
        <PlanModal
            visible={showPlanModal}
            onHide={handlePlanModalClose}
            initialTab={1}
        />
        </>
    );
};

export default TemplateModal;