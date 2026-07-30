import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { AutoComplete } from 'primereact/autocomplete';
import { Chips } from 'primereact/chips';
import { Checkbox } from 'primereact/checkbox';
import { MultiSelect } from 'primereact/multiselect';
import { TabPanel } from 'primereact/tabview';
import TabViewSideMenu from '@/Components/TabViewSideMenu';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { usePage } from '@inertiajs/react';
import { ProtectedFilesEditor } from '@/Components/ProtectedFilesEditor';
import { DeploymentScriptsEditor, ScriptStep } from '@/Components/DeploymentScriptsEditor';
import PlanModal from '@/Components/AuthModals/PlanModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient as api } from '@/lib/api';

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
    onFilesChange?: (files: any[]) => void;
    fileTypes: any[];
    userType?: string;
    templateVariables?: TemplateVariable[];
    onLoadVariables?: () => void;
    onCreateVariable?: () => void;
    onEditVariable?: (variable: TemplateVariable) => void;
    onDeleteVariable?: (variableId: number) => void;
    // Project assignment: parent provides the project list and the current
    // template's linked IDs; the modal returns the chosen IDs in onSave/
    // onSubmit values as `linked_project_ids` so the parent can persist them.
    availableProjects?: Array<{ id: number; name: string }>;
    // For a brand-new template, the project assignment is pre-selected with
    // these IDs (typically the currently active project) as a convenience
    // default. Ignored when editing an existing template (which loads its own
    // linked projects). The user can always deselect — never a hard dependency.
    defaultProjectIds?: number[];
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
    onDeleteVariable,
    availableProjects = [],
    defaultProjectIds = []
}) => {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();
  const toast = useToast();

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
            is_system_template: false,
            compatibility_tag: '',
            generation_order: 0
        }
    });

    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasFormChanges, setHasFormChanges] = useState(false);
    const [originalFormValues, setOriginalFormValues] = useState<any>(null);

    // Template files table sorting and search
    const [fileSortField, setFileSortField] = useState<string>('file_order');
    const [fileSortDirection, setFileSortDirection] = useState<'asc' | 'desc'>('asc');
    const [fileSearchTerm, setFileSearchTerm] = useState('');

    const sortedTemplateFiles = React.useMemo(() => {
        const searchInput = fileSearchTerm.replace(/%/g, '*').toLowerCase().trim();
        const hasWildcard = searchInput.includes('*');
        const searchParts = hasWildcard ? searchInput.split('*').filter(Boolean) : [];

        const matchesSearch = (value: string): boolean => {
            const val = value.toLowerCase();
            if (!hasWildcard) return val.includes(searchInput);
            // Wildcard: all parts must appear in order
            let pos = 0;
            for (const part of searchParts) {
                const idx = val.indexOf(part, pos);
                if (idx === -1) return false;
                pos = idx + part.length;
            }
            return true;
        };

        const filtered = searchInput
            ? templateFiles.filter(file =>
                matchesSearch(file.file_name || '') ||
                matchesSearch(file.file_type || '') ||
                matchesSearch(file.output_path || '')
            )
            : templateFiles;
        const sorted = [...filtered];
        sorted.sort((a, b) => {
            let valA: string | number = '';
            let valB: string | number = '';
            switch (fileSortField) {
                case 'file_order': {
                    // Files with explicit order (>0) come first, then 0/null sorted by name
                    const aOrder = a.file_order ?? 0;
                    const bOrder = b.file_order ?? 0;
                    const aHasOrder = aOrder > 0 ? 0 : 1;
                    const bHasOrder = bOrder > 0 ? 0 : 1;
                    if (aHasOrder !== bHasOrder) return aHasOrder - bHasOrder;
                    if (aHasOrder === 0 && bHasOrder === 0) { valA = aOrder; valB = bOrder; }
                    else { valA = (a.file_name || '').toLowerCase(); valB = (b.file_name || '').toLowerCase(); }
                    break;
                }
                case 'file_name':
                    valA = (a.file_name || '').toLowerCase();
                    valB = (b.file_name || '').toLowerCase();
                    break;
                case 'file_type':
                    valA = (a.file_type || '').toLowerCase();
                    valB = (b.file_type || '').toLowerCase();
                    break;
                case 'output_path':
                    valA = (a.output_path || '/').toLowerCase();
                    valB = (b.output_path || '/').toLowerCase();
                    break;
                case 'size':
                    valA = a.file_content?.length || 0;
                    valB = b.file_content?.length || 0;
                    break;
            }
            if (valA < valB) return fileSortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return fileSortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [templateFiles, fileSortField, fileSortDirection, fileSearchTerm]);

    const handleFileSort = (field: string) => {
        if (fileSortField === field) {
            setFileSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setFileSortField(field);
            setFileSortDirection('asc');
        }
    };

    const renderFileSortIcon = (field: string) => {
        if (fileSortField !== field) return <i className="pi pi-sort-alt ml-1" style={{ fontSize: '0.7rem', opacity: 0.4 }}></i>;
        return fileSortDirection === 'asc'
            ? <i className="pi pi-sort-amount-up ml-1" style={{ fontSize: '0.7rem' }}></i>
            : <i className="pi pi-sort-amount-down ml-1" style={{ fontSize: '0.7rem' }}></i>;
    };

    // Protected files and deployment scripts state
    const [protectedFiles, setProtectedFiles] = useState<string[]>([]);
    const [installScript, setInstallScript] = useState<ScriptStep[]>([]);
    const [updateScript, setUpdateScript] = useState<ScriptStep[]>([]);

    // Store original protected files and scripts for change detection
    const [originalProtectedFiles, setOriginalProtectedFiles] = React.useState<string[]>([]);
    const [originalInstallScript, setOriginalInstallScript] = React.useState<ScriptStep[]>([]);
    const [originalUpdateScript, setOriginalUpdateScript] = React.useState<ScriptStep[]>([]);

    // Project assignment — which projects this template is linked to. The
    // parent panel loads the projects list once and passes it in via props;
    // we only own the current selection here. Persistence happens through
    // values.linked_project_ids in onSave/onSubmit so the parent can call
    // the linked-projects API once the template ID exists.
    const [linkedProjectIds, setLinkedProjectIds] = useState<number[]>([]);
    const [originalLinkedProjectIds, setOriginalLinkedProjectIds] = useState<number[]>([]);
    // One-shot guard: the parent derives `defaultProjectIds` from an
    // asynchronously-loaded project list, so it can still be empty at the moment
    // the modal opens. This ref lets a dedicated effect apply the default as
    // soon as it arrives — exactly once per fresh "new template" open — without
    // ever clobbering a selection the user has already started editing.
    const defaultProjectsAppliedRef = useRef(false);

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
            console.error(t.templatemodal176, err);
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
            console.error(t.templatemodal200, err);
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
                compatibility_tag: editingTemplate.compatibility_tag || '',
                generation_order: editingTemplate.generation_order ?? 0,
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

            // Linked projects come pre-loaded on the template payload (see
            // TemplateManagementPanel.loadMyTemplates) — no extra round-trip
            // needed.
            const loadedLinkedIds: number[] = (editingTemplate.linked_project_ids || []).map((n: any) => Number(n));
            setLinkedProjectIds(loadedLinkedIds);
            setOriginalLinkedProjectIds(loadedLinkedIds);

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
                is_system_template: userType === 'system' ? false : false,
                compatibility_tag: '',
                generation_order: 0
            };
            reset(initialValues);
            setOriginalFormValues(initialValues);
            setIsSaved(false); // New templates start as unsaved
            setHasFormChanges(false); // Reset form changes

            // Reset protected files and scripts for new template
            setProtectedFiles([]);
            setInstallScript([]);
            setUpdateScript([]);
            // Pre-select the parent-supplied default projects (e.g. the
            // currently active project) for a brand-new template. If the parent
            // hasn't resolved its async project list yet, this is empty here and
            // the dedicated effect below fills it in once it arrives.
            setLinkedProjectIds(defaultProjectIds);
            setOriginalLinkedProjectIds(defaultProjectIds);
            defaultProjectsAppliedRef.current = defaultProjectIds.length > 0;

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

    // Apply the default project pre-selection for a NEW template as soon as the
    // parent's (asynchronously derived) `defaultProjectIds` becomes available.
    // The main open-effect above runs only when `visible`/`editingTemplate`
    // flip, so without this a default that resolves a beat later would never be
    // applied. One-shot per open via the ref, and only while the selection is
    // still untouched, so it never overwrites the user's own choice.
    useEffect(() => {
        if (!visible || editingTemplate) return;
        if (defaultProjectsAppliedRef.current) return;
        if (defaultProjectIds.length === 0) return;
        setLinkedProjectIds(defaultProjectIds);
        setOriginalLinkedProjectIds(defaultProjectIds);
        defaultProjectsAppliedRef.current = true;
    }, [visible, editingTemplate, defaultProjectIds]);

    // Effect to check for changes when protected files, scripts, or linked
    // project assignments change.
    useEffect(() => {
        if (editingTemplate) {
            checkFormChanges();
        }
    }, [protectedFiles, installScript, updateScript, linkedProjectIds]);

    // Don't render anything if not visible - AFTER all hooks
    if (!visible) return null;

    // Check for form changes (including protected files and scripts)
    const checkFormChanges = () => {
        if (!originalFormValues) return;

        const currentValues = getValues();
        const fieldsToCheck: (keyof typeof currentValues)[] = ['name', 'description', 'category', 'language', 'tags', 'is_active', 'visibility', 'is_system_template', 'compatibility_tag', 'generation_order'];

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
        // Compare sorted copies — order in the multiselect is irrelevant for
        // a "did anything change" check.
        const linkedProjectsChanged =
            JSON.stringify([...linkedProjectIds].sort()) !== JSON.stringify([...originalLinkedProjectIds].sort());

        const hasChanges = formFieldsChanged || protectedFilesChanged || installScriptChanged || updateScriptChanged || linkedProjectsChanged;

        setHasFormChanges(hasChanges);
    };

    const handleSave = handleFormSubmit(async (values) => {
        try {
            setIsLoading(true);
            if (onSave) {
                // Include protected files, scripts and project assignments
                const saveData = {
                    ...values,
                    protected_files: protectedFiles,
                    install_script: installScript,
                    update_script: updateScript,
                    linked_project_ids: linkedProjectIds
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
        // Pre-flight name uniqueness check — we'd rather catch the duplicate
        // here than after the user has wrestled with the modal, because
        // backend rejection used to clobber the form state (see catch below).
        // exclude_id makes sure the check ignores the row we're editing.
        try {
            const nameChanged = !editingTemplate || editingTemplate.name !== values.name;
            if (nameChanged) {
                const check = await api.checkTemplateName(values.name, editingTemplate?.id);
                if (check.exists) {
                    toast.showError(t.templatemodal_name_taken);
                    return; // KEEP modal open, KEEP edits, no reset
                }
            }
        } catch {
            // Network blip on the pre-check shouldn't block submit — fall
            // through and let the backend be the authority. The catch below
            // handles a real rejection cleanly.
        }

        // Include protected files, scripts and project assignments
        const submissionData = {
            ...values,
            protected_files: protectedFiles,
            install_script: installScript,
            update_script: updateScript,
            linked_project_ids: linkedProjectIds
        };

        try {
            await onSubmit(submissionData);
            // Only reset on confirmed success. The parent re-throws on
            // failure (after showing its own specific toast), so without
            // this try/catch a backend rejection would still hit reset()
            // and wipe the user's edits.
            reset();
            setIsSaved(false);
        } catch {
            // Intentionally silent — the parent already toasted the
            // backend-specific reason (e.g. "name has already been taken").
            // We just swallow here to STOP the reset() flow and keep every
            // field exactly as the user left it. The modal stays open.
        }
    });

    return (
        <>
        <Dialog
            header={editingTemplate ? t.templatemodal186 : t.templatemodal147}
            visible={visible}
            onHide={onCancel}
            style={{ width: '1400px', height: '85vh' }}
            contentClassName="template-modal-dialog-content"
            contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
            headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
            modal
            closable
            draggable={true}
            resizable={true}
        >
            <form className="template-modal-form flex flex-col h-full px-6 py-5">
                <div className="flex-1 min-h-0">
                <TabViewSideMenu
                  storageKey="templateModal"
                  defaultWidth={220}
                  /* The form already supplies px-6/py-5 padding; the side-menu's
                     default 15px/22px inset would double it and push the menu
                     too far down-right. Zero both so the form padding is the
                     single source of spacing (same as ProjectSettingsPanel). */
                  style={{
                    ['--p-tabview-vertical-pad-left' as string]: '0px',
                    ['--p-tabview-vertical-pad-top' as string]: '0px',
                  } as React.CSSProperties}
                >
                <TabPanel header={<span><i className="pi pi-cog mr-2" />{t.templatemodal_tab_general}</span>}>
                <div className="space-y-4">
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

                {/* Category + Language — side by side, AutoComplete each */}
                <div className="grid grid-cols-2 gap-4">
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
                </div>

                {/* Tags + Compatibility Tag + Generation Order — one row.
                  * Grid columns (6/4/2 of 12) so Tags get the most breathing
                  * room for chips, Generation Order shrinks to just its
                  * spinner. */}
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-6">
                        <label htmlFor="tags" className="block text-sm font-medium mb-2">
                            {t.templatemodal537}
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

                    <div className="col-span-4">
                        <label htmlFor="compatibility_tag" className="block text-sm font-medium mb-2">
                            {t.templatemodal_compatibility_tag}
                        </label>
                        <Controller
                            name="compatibility_tag"
                            control={control}
                            render={({ field }) => (
                                <InputText
                                    id="compatibility_tag"
                                    value={field.value}
                                    onChange={(e) => {
                                        field.onChange(e.target.value);
                                        checkFormChanges();
                                    }}
                                    placeholder="username/template_slug"
                                    className="w-full"
                                />
                            )}
                        />
                        <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                            {t.templatemodal_compatibility_tag_help}
                        </div>
                    </div>

                    <div className="col-span-2">
                        <label htmlFor="generation_order" className="block text-sm font-medium mb-2">
                            {t.templatemodal_generation_order}
                        </label>
                        <Controller
                            name="generation_order"
                            control={control}
                            render={({ field }) => (
                                <InputText
                                    id="generation_order"
                                    type="number"
                                    value={String(field.value ?? 0)}
                                    onChange={(e) => {
                                        field.onChange(parseInt(e.target.value) || 0);
                                        checkFormChanges();
                                    }}
                                    className="w-full"
                                    min={0}
                                />
                            )}
                        />
                        <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                            {t.templatemodal_generation_order_help}
                        </div>
                    </div>
                </div>

                {/* Project Assignment + Visibility — one row. Project
                  * assignment is saved through linked_project_ids in the
                  * form payload; the parent panel calls /templates/{id}/
                  * linked-projects after the template itself is persisted. */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label htmlFor="linked_projects" className="block text-sm font-medium mb-2">
                            {t.templatemodal_project_assignment}
                        </label>
                        {availableProjects.length > 0 ? (
                            <MultiSelect
                                inputId="linked_projects"
                                value={linkedProjectIds}
                                options={availableProjects}
                                optionLabel="name"
                                optionValue="id"
                                onChange={(e) => {
                                    // User took control of the selection — stop
                                    // any late-arriving default from overwriting it.
                                    defaultProjectsAppliedRef.current = true;
                                    setLinkedProjectIds((e.value as number[]) || []);
                                }}
                                placeholder={t.templatemodal_project_assignment_placeholder}
                                className="w-full"
                                display="chip"
                                filter
                                panelClassName="template-modal-multiselect-panel"
                            />
                        ) : (
                            <div className="text-sm italic" style={{ color: colors.textMuted }}>
                                {t.templatemodal_project_assignment_empty}
                            </div>
                        )}
                        <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                            {t.templatemodal_project_assignment_help}
                        </div>
                    </div>

                    {/* Visibility - Hidden if locked (cloned from store) */}
                    {editingTemplate?.visibility_locked ? (
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                {t.templatemodal366}
                            </label>
                            <div className="p-3 rounded-lg" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                                <div className="flex items-center gap-2">
                                    <i className="pi pi-lock text-yellow-500"></i>
                                    <span style={{ color: colors.textSecondary }}>{t.templatemodal572}</span>
                                </div>
                                <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                    {t.templatemodal575}
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
                                            { label: t.databasemanagementpanel772 + t.templatemodal605, value: 'public' },
                                            { label: t.databasemanagementpanel771 + t.templatemodal606, value: 'private' },
                                            { label: t.templatemodal607, value: 'store' }
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

                </div>

                {/* Private Template Unlock Section - Only for new templates with private visibility */}
                {!editingTemplate && getValues().visibility === 'private' && (
                    <div className="space-y-3 mt-4">
                        {checkingSubscription ? (
                            <div className="py-4 text-center bg-gray-800 rounded-lg border border-gray-700">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                <p className="text-gray-400 text-sm">{t.templatemodal656}</p>
                            </div>
                        ) : needsPrivateUnlock ? (
                            <>
                                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                                    <p className="text-yellow-300 text-sm mb-1">
                                        <i className="pi pi-lock mr-2"></i>
                                        <strong>{t.templatemodal663}</strong>
                                    </p>
                                    <p className="text-gray-300 text-xs">
                                        {t.templatemodal666}<strong>{t.templatemodal666_2}</strong>{t.templatemodal666_3}
                                    </p>
                                </div>

                                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                                    <div className="flex justify-between items-center text-sm mb-1">
                                        <span className="text-gray-300">{t.templatemodal672}</span>
                                        <span className="text-white font-bold">{currentUser?.credits || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mb-1">
                                        <span className="text-gray-300">{t.templatemodal676}</span>
                                        <span className="text-yellow-400 font-bold">50</span>
                                    </div>
                                    <hr className="border-gray-700 my-1" />
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-300">{t.templatemodal681}</span>
                                        <span className={`font-bold ${(currentUser?.credits || 0) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                            {(currentUser?.credits || 0) >= 50 ? (currentUser?.credits || 0) - 50 : `${50 - (currentUser?.credits || 0)} fehlen`}
                                        </span>
                                    </div>
                                </div>

                                {(currentUser?.credits || 0) < 50 && (
                                    <div className="bg-red-900/20 border border-red-700 rounded-lg p-2">
                                        <p className="text-red-300 text-xs">
                                            {t.templatemodal691}<strong>{50 - (currentUser?.credits || 0)}{t.templatemodal691_2}</strong>.
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
                                            label={t.templatemodal703}
                                        />
                                    ) : (
                                        <Button
                                            type="button"
                                            onClick={handleBuyCredits}
                                            className="flex-1 p-button-warning p-button-sm"
                                            icon="pi pi-shopping-cart"
                                            label={t.templatemodal711}
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
                                        label={t.templatemodal723}
                                    />
                                </div>
                            </>
                        ) : privateUnlockConfirmed ? (
                            <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
                                <p className="text-green-300 text-sm flex items-center gap-2">
                                    <i className="pi pi-check-circle"></i>
                                    <strong>{t.templatemodal731}</strong>{t.templatemodal731_2}
                                </p>
                            </div>
                        ) : hasCheckedSubscription && availableSlots > 0 ? (
                            <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
                                <p className="text-green-300 text-sm flex items-center gap-2">
                                    <i className="pi pi-check-circle"></i>
                                    <strong>{t.templatemodal738}</strong>{t.templatemodal738_2}{availableSlots} freie{availableSlots === 1 ? 'n' : ''}{t.templatemodal738_3}{availableSlots === 1 ? '' : 's'}.
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                    {t.templatemodal741}
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
                                <strong>{t.templatemodal754}</strong>
                            </p>
                            <p className="text-gray-300 text-xs mb-2">
                                {t.templatemodal757}
                            </p>
                            <p className="text-gray-400 text-xs">
                                <i className="pi pi-info-circle mr-1"></i>
                                {t.templatemodal761}<strong>{t.templatemodal761_2}</strong>{t.templatemodal761_3}
                            </p>
                        </div>
                    </div>
                )}

                </div>
                </TabPanel>

                <TabPanel header={<span><i className="pi pi-file mr-2" />{t.templatemodal_tab_files}</span>}>
                <div className="space-y-4">
                {/* Template Files Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold" style={{ color: colors.textSecondary }}>{t.templatemodal362}</h3>
                            {templateFiles.length > 0 && (
                                <span className="relative">
                                    <i className="pi pi-search" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: colors.textSecondary }}></i>
                                    <InputText
                                        value={fileSearchTerm}
                                        onChange={(e) => setFileSearchTerm(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                        placeholder={t.templatemodal808}
                                        style={{ paddingLeft: '28px', height: '28px', fontSize: '0.8rem', width: '200px', backgroundColor: colors.bgSecondary, color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}` }}
                                    />
                                    {fileSearchTerm && (
                                        <i className="pi pi-times" onClick={() => setFileSearchTerm('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: colors.textSecondary, cursor: 'pointer' }}></i>
                                    )}
                                </span>
                            )}
                        </div>
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
                       <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}`, color: colors.infoText }}>
                           {t.templatemodal444}
                       </div>
                   )}

                   {editingTemplate && (
                       <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}`, color: colors.infoText }}>
                           {t.templatemodal450}
                       </div>
                   )}
                    
                    {templateFiles.length > 0 ? (
                        <div className="overflow-y-auto rounded" style={{ maxHeight: 'calc(85vh - 380px)', border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
                            <table className="w-full text-sm" style={{ color: colors.textPrimary }}>
                                <thead style={{ backgroundColor: colors.bgTertiary, borderBottom: `1px solid ${colors.borderPrimary}`, position: 'sticky', top: 0, zIndex: 1 }}>
                                    <tr>
                                        <th className="px-3 py-2 text-left cursor-pointer select-none" style={{ color: colors.textPrimary }} onClick={() => handleFileSort('file_name')}>
                                            {t.templatemodal803}{renderFileSortIcon('file_name')}
                                        </th>
                                        <th className="px-3 py-2 text-left cursor-pointer select-none" style={{ color: colors.textPrimary }} onClick={() => handleFileSort('file_type')}>
                                            {t.templatemodal804}{renderFileSortIcon('file_type')}
                                        </th>
                                        <th className="px-3 py-2 text-left cursor-pointer select-none" style={{ color: colors.textPrimary }} onClick={() => handleFileSort('output_path')}>
                                            {t.templatemodal805}{renderFileSortIcon('output_path')}
                                        </th>
                                        <th className="px-3 py-2 text-left cursor-pointer select-none" style={{ color: colors.textPrimary }} onClick={() => handleFileSort('size')}>
                                            {t.templatemodal807}{renderFileSortIcon('size')}
                                        </th>
                                        <th className="px-3 py-2 text-left" style={{ color: colors.textPrimary }}>{t.templatemodal806}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedTemplateFiles.map((file) => {
                                        const originalIndex = templateFiles.indexOf(file);
                                        return (
                                        <tr key={file.id || originalIndex} className="transition-colors" style={{ borderTop: `1px solid ${colors.borderPrimary}` }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgHover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
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
                                            <td className="px-3 py-2" style={{ color: colors.textSecondary, fontSize: '0.8rem' }}>
                                                <i className="pi pi-folder mr-1" style={{ fontSize: '0.7rem' }}></i>
                                                {file.output_path || '/'}
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
                                                            onDeleteFile(originalIndex);
                                                        }}
                                                        className="p-button-text p-button-danger p-button-sm text-red-400 hover:text-red-300"
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 rounded" style={{ color: colors.textSecondary, border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
                            {t.templatemodal513}
                        </div>
                    )}
                </div>

                </div>
                </TabPanel>

                <TabPanel header={<span><i className="pi pi-list mr-2" />{t.templatemodal_tab_variables}</span>}>
                <div className="space-y-4">
                {/* Custom Variables Section */}
                <div>
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
                        <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}`, color: colors.infoText }}>
                            {t.templatemodal541}
                        </div>
                    )}

                    {editingTemplate && (
                        <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}`, color: colors.infoText }}>
                            {t.templatemodal547}
                        </div>
                    )}

                    {templateVariables && templateVariables.length > 0 ? (
                        <div className="overflow-y-auto rounded" style={{ maxHeight: 'calc(85vh - 380px)', border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
                            <table className="w-full text-sm" style={{ color: colors.textPrimary }}>
                                <thead style={{ backgroundColor: colors.bgTertiary, borderBottom: `1px solid ${colors.borderPrimary}` }}>
                                    <tr>
                                        <th className="px-3 py-2 text-left" style={{ color: colors.textPrimary }}>{t.templatemodal900}</th>
                                        <th className="px-3 py-2 text-left" style={{ color: colors.textPrimary }}>{t.templatemodal901}</th>
                                        <th className="px-3 py-2 text-left" style={{ color: colors.textPrimary }}>{t.templatemodal902}</th>
                                        <th className="px-3 py-2 text-left" style={{ color: colors.textPrimary }}>{t.templatemodal903}</th>
                                        <th className="px-3 py-2 text-left" style={{ color: colors.textPrimary }}>{t.templatemodal904}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {templateVariables.map((variable, index) => (
                                        <tr key={variable.id || index} className="transition-colors" style={{ borderTop: `1px solid ${colors.borderPrimary}` }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgHover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center" style={{ color: colors.textPrimary }}>
                                                    <span className="font-mono text-yellow-300">{'{:' + variable.variable_name + ':}'}</span>
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
                                                                if (window.confirm(`${t.templatemodal953}"${variable.variable_name}"${t.templatemodal953_2}`)) {
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

                </div>
                </TabPanel>

                <TabPanel header={<span><i className="pi pi-server mr-2" />{t.templatemodal_tab_deploy}</span>}>
                <div className="space-y-4">
                    <DeploymentScriptsEditor
                        installScript={installScript}
                        updateScript={updateScript}
                        onInstallScriptChange={setInstallScript}
                        onUpdateScriptChange={setUpdateScript}
                    />
                </div>
                </TabPanel>

                <TabPanel header={<span><i className="pi pi-shield mr-2" />{t.templatemodal_tab_protected}</span>}>
                <div className="space-y-4">
                    <ProtectedFilesEditor
                        files={protectedFiles}
                        onChange={setProtectedFiles}
                    />
                </div>
                </TabPanel>
                </TabViewSideMenu>
                </div>

                {/* Is Active + System Template — global toggles outside the
                  * tabs so they're always visible right above the save
                  * buttons. System Template is only available for system
                  * users. */}
                <div className="mt-4 flex items-center gap-6">
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
                    {userType === 'system' && (
                        <Controller
                            name="is_system_template"
                            control={control}
                            render={({ field }) => (
                                <div className="flex items-center gap-2">
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
                    )}
                </div>

                <div className="flex gap-2 justify-end pt-4 mt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
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
                            tooltip={getValues().visibility === 'private' && needsPrivateUnlock && !privateUnlockConfirmed ? t.templatemodal1030 : undefined}
                        >
                            {isSaved ? t.templatemodal667 : t.cmsadminpanel279}
                        </Button>
                    )}

                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={(editingTemplate && !hasFormChanges) || (!editingTemplate && getValues().visibility === 'private' && needsPrivateUnlock && !privateUnlockConfirmed)}
                        className={((editingTemplate && !hasFormChanges) || (!editingTemplate && getValues().visibility === 'private' && needsPrivateUnlock && !privateUnlockConfirmed)) ? 'opacity-50' : ''}
                        tooltip={!editingTemplate && getValues().visibility === 'private' && needsPrivateUnlock && !privateUnlockConfirmed ? t.templatemodal1041 : undefined}
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
                /* Dialog content is just the layout shell — padding lives on
                 * the inner <form> via Tailwind (px-6 py-5) so we don't have
                 * to fight PrimeReact's stylesheet load order. Without
                 * padding:0 here, PrimeReact's default .p-dialog-content
                 * padding would stack on top of the form padding. */
                .p-dialog .p-dialog-content.template-modal-dialog-content {
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    padding: 0;
                }
                .template-modal-dialog-content .template-modal-form {
                    flex: 1;
                    min-height: 0;
                }
                /* MultiSelect dropdown (project assignment) — match the
                 * AutoComplete panel styling so it reads as part of the
                 * same form. */
                .template-modal-multiselect-panel {
                    background-color: var(--theme-bg-secondary) !important;
                    border: 1px solid var(--theme-border-primary) !important;
                }
                .template-modal-multiselect-panel .p-multiselect-items .p-multiselect-item {
                    color: var(--theme-text-primary) !important;
                }
                .template-modal-multiselect-panel .p-multiselect-items .p-multiselect-item:hover {
                    background-color: var(--theme-bg-tertiary) !important;
                }
                .template-modal-multiselect-panel .p-multiselect-items .p-multiselect-item.p-highlight {
                    background-color: var(--theme-accent) !important;
                    color: #fff !important;
                }
                .template-modal-form .p-multiselect {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-modal-form .p-multiselect .p-multiselect-label {
                    color: var(--theme-text-primary) !important;
                }
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