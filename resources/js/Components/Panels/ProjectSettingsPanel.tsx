import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useProject } from '@/contexts/ProjectContext';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Password as PrimePassword } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { TabView, TabPanel } from 'primereact/tabview';
import { PickList } from 'primereact/picklist';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface Language {
    code: string;
    name: string;
    native_name: string;
    is_active: boolean;
}

interface ProjectMember {
    id: number;
    user_id: number;
    user: {
        id: number;
        name: string;
        email: string;
    };
    role: string;
}

interface TemplateVariable {
    id: number;
    template_id: number;
    variable_name: string;
    description: string | null;
    default_value: string | null;
    is_required: boolean;
}

interface Template {
    id: number;
    name: string;
    description: string | null;
}

interface TemplateWithVariables extends Template {
    variables: TemplateVariable[];
}

// Future use: Template variable values
interface _VariableValue {
    variable_name: string;
    language: string;
    value: string;
}

export default function ProjectSettingsPanel() {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
    const toast = useToast();
    const { selectedProject, loadProjects } = useProject();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);

    // Template Variables State
    const [templatesWithVariables, setTemplatesWithVariables] = useState<TemplateWithVariables[]>([]);
    const [variableValues, setVariableValues] = useState<Record<string, Record<string, string>>>({});
    const [selectedVariableLanguage, setSelectedVariableLanguage] = useState<string>('en');
    const [loadingVariables, setLoadingVariables] = useState(false);
    const [_savingVariables, setSavingVariables] = useState(false); // Future use

    const [formData, setFormData] = useState({
        // Project Settings
        name: '',
        description: '',
        join_code: '',
        is_public: false,
        new_owner_id: null as number | null,
        // Database Connection
        database_name: '',
        database_type: 'MySQL',
        database_server: '127.0.0.1',
        database_port: '3306',
        database_username: '',
        database_password: '',
        // Diagram Settings
        diagram_max_tables_per_row: 20,
        diagram_table_width: 280,
        diagram_table_height: 450,
        diagram_horizontal_spacing: 600,
        diagram_vertical_spacing: 700,
        // Project Properties
        project_directory: '',
        project_url: '',
        start_page: 'index.php',
        default_language: 'en',
        filename_short_length: 2,
        // Localization Settings
        decimal_separator: ',',
        thousands_separator: '.',
        date_format: 'd.m.Y',
        time_format: 'H:i:s',
        currency_symbol: t.editprojectmodal602,
        timezone: 'Europe/Vienna',
        // API Keys
        google_translate_api_key: ''
    });

    const loadLanguages = useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch('/api/active-languages', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setAvailableLanguages(Array.isArray(data) ? data : []);
            }
        } catch {
            // Error loading languages
        }
    }, []);

    const loadProjectData = useCallback(async () => {
        if (!selectedProject) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) return;

            // Load project settings including enabled_languages
            const settingsResponse = await fetch(`/api/projects/${selectedProject.id}/settings`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (settingsResponse.ok) {
                const settings = await settingsResponse.json();
                setSelectedLanguages(settings.enabled_languages || []);
            }

            // Load full project data
            const projectResponse = await fetch(`/api/projects/${selectedProject.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (projectResponse.ok) {
                const project = await projectResponse.json();
                setFormData({
                    name: project.name || '',
                    description: project.description || '',
                    join_code: project.join_code || '',
                    is_public: project.is_public || false,
                    new_owner_id: null,
                    database_name: project.database_name || '',
                    database_type: project.database_type || 'MySQL',
                    database_server: project.database_server || '127.0.0.1',
                    database_port: project.database_port || '3306',
                    database_username: project.database_username || '',
                    database_password: project.database_password || '',
                    diagram_max_tables_per_row: project.diagram_max_tables_per_row || 20,
                    diagram_table_width: project.diagram_table_width || 280,
                    diagram_table_height: project.diagram_table_height || 450,
                    diagram_horizontal_spacing: project.diagram_horizontal_spacing || 600,
                    diagram_vertical_spacing: project.diagram_vertical_spacing || 700,
                    project_directory: project.project_directory || '',
                    project_url: project.project_url || '',
                    start_page: project.start_page || 'index.php',
                    default_language: project.default_language || 'en',
                    filename_short_length: project.filename_short_length || 2,
                    decimal_separator: project.decimal_separator || ',',
                    thousands_separator: project.thousands_separator || '.',
                    date_format: project.date_format || 'd.m.Y',
                    time_format: project.time_format || 'H:i:s',
                    currency_symbol: project.currency_symbol || t.editprojectmodal602,
                    timezone: project.timezone || 'Europe/Vienna',
                    google_translate_api_key: project.google_translate_api_key || ''
                });
            }
        } catch {
            toast.showError(t.projectsettingspanel151);
        } finally {
            setLoading(false);
        }
    }, [selectedProject, toast]);

    const loadProjectMembers = useCallback(async () => {
        if (!selectedProject) return;

        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`/api/projects/${selectedProject.id}/members`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setProjectMembers(data || []);
            }
        } catch {
            // Error loading project members
        }
    }, [selectedProject]);

    const loadTemplateVariables = useCallback(async () => {
        if (!selectedProject) return;

        setLoadingVariables(true);
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) return;

            // Load all templates (or could be filtered by templates used in project)
            const templatesResponse = await fetch('/api/templates', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!templatesResponse.ok) return;

            const templatesData = await templatesResponse.json();
            const templates = templatesData.templates || [];

            // Load variables for each template
            const templatesWithVars: TemplateWithVariables[] = [];

            for (const template of templates) {
                const varsResponse = await fetch(`/api/templates/${template.id}/variables`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                });

                if (varsResponse.ok) {
                    const varsData = await varsResponse.json();
                    const variables = varsData.variables || [];

                    // Only include templates that have variables
                    if (variables.length > 0) {
                        templatesWithVars.push({
                            id: template.id,
                            name: template.name,
                            description: template.description,
                            variables: variables,
                        });
                    }
                }
            }

            setTemplatesWithVariables(templatesWithVars);

            // Load current project values for all variables
            const valuesMap: Record<string, Record<string, string>> = {};

            for (const template of templatesWithVars) {
                const valuesResponse = await fetch(
                    `/api/projects/${selectedProject.id}/templates/${template.id}/variable-values`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                        },
                    }
                );

                if (valuesResponse.ok) {
                    const valuesData = await valuesResponse.json();
                    const variables = valuesData.variables || [];

                    // Build map: variable_name -> { language -> value }
                    for (const variable of variables) {
                        const key = `${template.id}_${variable.variable_name}`;
                        valuesMap[key] = {};

                        // variable.values is an object keyed by language
                        if (variable.values) {
                            for (const [language, valueObj] of Object.entries(variable.values)) {
                                valuesMap[key][language] = (valueObj as any).value || '';
                            }
                        }
                    }
                }
            }

            setVariableValues(valuesMap);
        } catch (error) {
            console.error('Error loading template variables:', error);
            toast.showError('Fehler beim Laden der Template-Variablen');
        } finally {
            setLoadingVariables(false);
        }
    }, [selectedProject, toast]);

    useEffect(() => {
        loadLanguages();
        if (selectedProject) {
            loadProjectData();
            loadProjectMembers();
            loadTemplateVariables();
        }
    }, [selectedProject, loadProjectData, loadProjectMembers, loadLanguages, loadTemplateVariables]);

    const handleSave = async () => {
        if (!selectedProject) {
            toast.showError(t.databaseexportmodal344);
            return;
        }

        // Confirm ownership transfer if requested
        if (formData.new_owner_id) {
            const newOwner = projectMembers.find(m => m.user_id === formData.new_owner_id);
            if (newOwner) {
                const confirmed = window.confirm(
                    `Möchten Sie die Eigentümerschaft wirklich an ${newOwner.user.name} (${newOwner.user.email}) übertragen?\n\nDiese Aktion kann nicht rückgängig gemacht werden und Sie verlieren Ihre Eigentümerrechte!`
                );
                if (!confirmed) return;
            }
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) {
                toast.showError(t.applicationsmodal66);
                return;
            }

            // Save project data
            const projectResponse = await fetch(`/api/projects/${selectedProject.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!projectResponse.ok) {
                throw new Error(t.editprojectmodal183);
            }

            // Save language settings
            const settingsResponse = await fetch(`/api/projects/${selectedProject.id}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    enabled_languages: selectedLanguages,
                    default_language: formData.default_language,
                }),
            });

            if (!settingsResponse.ok) {
                throw new Error(t.projectsettingspanel243);
            }

            // ✅ Also save template variables
            await saveTemplateVariablesInternal(token);

            // Success message includes template variables if they exist
            const hasTemplateVars = templatesWithVariables.length > 0;
            const successMsg = hasTemplateVars
                ? 'Projekt-Einstellungen und Template-Variablen erfolgreich gespeichert'
                : t.projectsettingspanel246;
            toast.showSuccess(successMsg);

            // Refresh projects to update the UI
            loadProjects();
        } catch (error) {
            toast.showError(error instanceof Error ? error.message : t.projectsettingspanel251);
        } finally {
            setSaving(false);
        }
    };

    const generateJoinCode = () => {
        const code = 'PROJ-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        setFormData({ ...formData, join_code: code });
    };

    // Internal function to save template variables (called by both save buttons)
    const saveTemplateVariablesInternal = async (token: string) => {
        if (!selectedProject || templatesWithVariables.length === 0) {
            return; // Nothing to save
        }

        // Build bulk update payload for each template
        for (const template of templatesWithVariables) {
            const valuesToSave: Array<{
                variable_name: string;
                language: string;
                value: string;
            }> = [];

            // Get all active languages
            const activeLangs = availableLanguages.filter(lang => lang.is_active);

            for (const variable of template.variables) {
                const key = `${template.id}_${variable.variable_name}`;

                for (const lang of activeLangs) {
                    const value = variableValues[key]?.[lang.code] || '';

                    // Only save non-empty values (trimmed)
                    if (value.trim() !== '') {
                        valuesToSave.push({
                            variable_name: variable.variable_name,
                            language: lang.code,
                            value: value.trim(),
                        });
                    }
                }
            }

            // Bulk update via API
            if (valuesToSave.length > 0) {
                const response = await fetch(
                    `/api/projects/${selectedProject.id}/templates/${template.id}/variable-values/bulk`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                        },
                        body: JSON.stringify({ values: valuesToSave }),
                    }
                );

                if (!response.ok) {
                    throw new Error(`Fehler beim Speichern der Variablen für Template "${template.name}"`);
                }
            }
        }
    };

    // Future use: Save template variables
    const _handleSaveTemplateVariables = async () => {
        if (!selectedProject) {
            toast.showError('Kein Projekt ausgewählt');
            return;
        }

        setSavingVariables(true);
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) {
                toast.showError('Nicht authentifiziert');
                setSavingVariables(false);
                return;
            }

            await saveTemplateVariablesInternal(token);

            toast.showSuccess('Template-Variablen erfolgreich gespeichert');
        } catch (error) {
            console.error('Error saving template variables:', error);
            toast.showError(error instanceof Error ? error.message : 'Fehler beim Speichern der Template-Variablen');
        } finally {
            setSavingVariables(false);
        }
    };

    const handleVariableValueChange = (templateId: number, variableName: string, language: string, value: string) => {
        const key = `${templateId}_${variableName}`;
        setVariableValues(prev => ({
            ...prev,
            [key]: {
                ...(prev[key] || {}),
                [language]: value,
            },
        }));
    };

    const transferData = availableLanguages
        .filter(lang => lang.is_active)
        .map(lang => ({
            key: lang.code,
            title: `${lang.native_name} (${lang.name})`,
            description: lang.code.toUpperCase(),
        }));

    if (!selectedProject) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-800 text-gray-300">
                <div className="text-center">
                    <i className="pi pi-info-circle text-4xl mb-4"></i>
                    <p>Bitte wählen Sie ein Projekt aus</p>
                    <p className="text-sm mt-2">selectedProject is null</p>
                    <p className="text-xs mt-2 text-yellow-400">🔍 ProjectSettingsPanel loaded but no project selected</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-800">
                <ProgressSpinner />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-800 text-gray-100 p-6 overflow-auto project-settings-panel">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-100">
                        Projekt-Einstellungen
                    </h2>
                    <p className="text-gray-400 mt-2">
                        Projekt: <span className="font-semibold text-gray-200">{selectedProject.name}</span>
                    </p>
                </div>
                <Button
                    icon="pi pi-save"
                    label={t.projectsettingspanel304}
                    onClick={handleSave}
                    loading={saving}
                    severity="success"
                    size="large"
                />
            </div>

            <TabView className="flex-1">
                <TabPanel header={<span><i className="pi pi-cog mr-2"></i>Allgemein</span>}>
                            <div className="space-y-4 max-w-3xl">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Projektname *
                                    </label>
                                    <InputText
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder={t.editprojectmodal240}
                                        className="w-full font-mono"
                                    />
                                    <div className="text-xs text-gray-400 mt-1">
                                        {t.editprojectmodal569}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Beschreibung
                                    </label>
                                    <InputTextarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        placeholder={t.editprojectmodal260}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Beitrittscode
                                    </label>
                                    <div className="p-inputgroup">
                                        <InputText
                                            value={formData.join_code}
                                            onChange={(e) => setFormData({ ...formData, join_code: e.target.value })}
                                            placeholder={t.projectsettingspanel351}
                                        />
                                        <Button
                                            icon="pi pi-refresh"
                                            onClick={generateJoinCode}
                                            severity="secondary"
                                        />
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Benutzer können diesem Projekt mit diesem Code beitreten
                                    </div>
                                </div>

                                <div>
                                    <div className="flex align-items-center">
                                        <Checkbox
                                            inputId="is_public"
                                            checked={formData.is_public}
                                            onChange={(e) => setFormData({ ...formData, is_public: e.checked || false })}
                                        />
                                        <label htmlFor="is_public" className="ml-2 text-gray-300">
                                            Öffentliches Projekt
                                        </label>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1 ml-6">
                                        Dieses Projekt für alle Benutzer sichtbar machen
                                    </div>
                                </div>

                                {selectedProject.is_owner && projectMembers.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Eigentümerschaft übertragen
                                        </label>
                                        <Dropdown
                                            value={formData.new_owner_id || null}
                                            onChange={(e) => setFormData({ ...formData, new_owner_id: e.value })}
                                            options={projectMembers
                                                .filter(m => m.user_id !== selectedProject.owner.id)
                                                .map(member => ({
                                                    label: `Übertragen an ${member.user.name} (${member.user.email}) - ${member.role}`,
                                                    value: member.user_id
                                                }))}
                                            placeholder={`Aktueller Eigentümer: ${selectedProject.owner.name}`}
                                            className="w-full"
                                            showClear
                                        />
                                        <div className="text-xs text-yellow-500 mt-1">
                                            ⚠️ Warnung: Sie verlieren Ihre Eigentümerrechte nach der Übertragung!
                                        </div>
                                    </div>
                                )}
                            </div>
                </TabPanel>
                <TabPanel header={<span><i className="pi pi-database mr-2"></i>Datenbank</span>}>
                            <div className="space-y-4 max-w-3xl">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Datenbankname
                                    </label>
                                    <InputText
                                        value={formData.database_name}
                                        onChange={(e) => setFormData({ ...formData, database_name: e.target.value })}
                                        placeholder="project_database"
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Datenbanktyp
                                    </label>
                                    <Dropdown
                                        value={formData.database_type}
                                        onChange={(e) => setFormData({ ...formData, database_type: e.value })}
                                        options={[
                                            { label: 'MySQL', value: 'MySQL' },
                                            { label: 'PostgreSQL', value: 'PostgreSQL' },
                                            { label: 'SQLite', value: 'SQLite' },
                                            { label: 'SQL Server', value: 'MSSQL' }
                                        ]}
                                        className="w-full"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Server
                                        </label>
                                        <InputText
                                            value={formData.database_server}
                                            onChange={(e) => setFormData({ ...formData, database_server: e.target.value })}
                                            placeholder="127.0.0.1"
                                            className="w-full"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Port
                                        </label>
                                        <InputText
                                            value={formData.database_port}
                                            onChange={(e) => setFormData({ ...formData, database_port: e.target.value })}
                                            placeholder="3306"
                                            className="w-full"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Benutzername
                                    </label>
                                    <InputText
                                        value={formData.database_username}
                                        onChange={(e) => setFormData({ ...formData, database_username: e.target.value })}
                                        placeholder="database_user"
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Passwort
                                    </label>
                                    <PrimePassword
                                        value={formData.database_password}
                                        onChange={(e) => setFormData({ ...formData, database_password: e.target.value })}
                                        placeholder="database_password"
                                        className="w-full"
                                        feedback={false}
                                        toggleMask
                                    />
                                </div>
                            </div>
                </TabPanel>
                <TabPanel header={<span><i className="pi pi-sitemap mr-2"></i>Diagram Settings</span>}>
                            <div className="space-y-4 max-w-3xl">
                                <div className="mb-4 p-3 bg-blue-900 border border-blue-700 rounded text-blue-100 text-sm">
                                    <i className="pi pi-info-circle mr-2"></i>
                                    Konfigurieren Sie die Standard-Einstellungen für automatisches Diagram-Layout.
                                    Diese Werte werden beim "Sort the Diagram" Button verwendet.
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Max. Tabellen pro Zeile
                                        </label>
                                        <InputText
                                            type="number"
                                            value={formData.diagram_max_tables_per_row.toString()}
                                            onChange={(e) => setFormData({ ...formData, diagram_max_tables_per_row: parseInt(e.target.value) || 20 })}
                                            placeholder="20"
                                            className="w-full"
                                        />
                                        <small className="text-gray-400">Maximale Anzahl der Tabellen in einer Zeile</small>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Tabellen Breite (px)
                                        </label>
                                        <InputText
                                            type="number"
                                            value={formData.diagram_table_width.toString()}
                                            onChange={(e) => setFormData({ ...formData, diagram_table_width: parseInt(e.target.value) || 280 })}
                                            placeholder="280"
                                            className="w-full"
                                        />
                                        <small className="text-gray-400">Breite der Tabellen-Boxen im Diagramm</small>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Tabellen Höhe (px)
                                        </label>
                                        <InputText
                                            type="number"
                                            value={formData.diagram_table_height.toString()}
                                            onChange={(e) => setFormData({ ...formData, diagram_table_height: parseInt(e.target.value) || 450 })}
                                            placeholder="450"
                                            className="w-full"
                                        />
                                        <small className="text-gray-400">Maximale Höhe der Tabellen-Boxen</small>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Horizontaler Abstand (px)
                                        </label>
                                        <InputText
                                            type="number"
                                            value={formData.diagram_horizontal_spacing.toString()}
                                            onChange={(e) => setFormData({ ...formData, diagram_horizontal_spacing: parseInt(e.target.value) || 600 })}
                                            placeholder="600"
                                            className="w-full"
                                        />
                                        <small className="text-gray-400">Horizontaler Abstand zwischen Tabellen</small>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Vertikaler Abstand (px)
                                        </label>
                                        <InputText
                                            type="number"
                                            value={formData.diagram_vertical_spacing.toString()}
                                            onChange={(e) => setFormData({ ...formData, diagram_vertical_spacing: parseInt(e.target.value) || 700 })}
                                            placeholder="700"
                                            className="w-full"
                                        />
                                        <small className="text-gray-400">Vertikaler Abstand zwischen Zeilen</small>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-gray-700 rounded">
                                    <h4 className="font-semibold mb-2 text-gray-200">Vorschau Werte:</h4>
                                    <div className="text-sm text-gray-300 space-y-1">
                                        <div>• Max Tabellen pro Zeile: <span className="text-blue-400">{formData.diagram_max_tables_per_row}</span></div>
                                        <div>• Tabellen Größe: <span className="text-blue-400">{formData.diagram_table_width}px × {formData.diagram_table_height}px</span></div>
                                        <div>• Abstände: <span className="text-blue-400">{formData.diagram_horizontal_spacing}px horizontal, {formData.diagram_vertical_spacing}px vertikal</span></div>
                                    </div>
                                </div>
                            </div>
                </TabPanel>
                <TabPanel header={<span><i className="pi pi-file mr-2"></i>Eigenschaften</span>}>
                            <div className="space-y-4 max-w-3xl">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Projektverzeichnis
                                    </label>
                                    <InputText
                                        value={formData.project_directory}
                                        onChange={(e) => setFormData({ ...formData, project_directory: e.target.value })}
                                        placeholder="C:\Users\Public\Documents\my_project"
                                        className="w-full"
                                    />
                                    <div className="text-xs text-gray-400 mt-1">
                                        Pfad wo generierte Dateien gespeichert werden sollen
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Projekt-URL
                                    </label>
                                    <InputText
                                        value={formData.project_url}
                                        onChange={(e) => setFormData({ ...formData, project_url: e.target.value })}
                                        placeholder="http://localhost/my_project"
                                        className="w-full"
                                    />
                                    <div className="text-xs text-gray-400 mt-1">
                                        URL für den Zugriff auf das Projekt
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Startseite
                                    </label>
                                    <InputText
                                        value={formData.start_page}
                                        onChange={(e) => setFormData({ ...formData, start_page: e.target.value })}
                                        placeholder="index.php"
                                        className="w-full"
                                    />
                                    <div className="text-xs text-gray-400 mt-1">
                                        Haupt-Einstiegsdatei (z.B. index.php, main.py, app.js)
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Standard-Sprache
                                    </label>
                                    <Dropdown
                                        value={formData.default_language}
                                        onChange={(e) => setFormData({ ...formData, default_language: e.value })}
                                        options={[
                                            { label: t.editprojectmodal484, value: 'en' },
                                            { label: t.editprojectmodal485, value: 'de' },
                                            { label: t.editprojectmodal486, value: 'fr' },
                                            { label: t.editprojectmodal487, value: 'es' },
                                            { label: t.editprojectmodal488, value: 'it' }
                                        ]}
                                        className="w-full"
                                    />
                                    <div className="text-xs text-gray-400 mt-1">
                                        Standard-Sprache für Projekt-Generierung
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Dateiname Kurzlänge
                                    </label>
                                    <Dropdown
                                        value={formData.filename_short_length}
                                        onChange={(e) => setFormData({ ...formData, filename_short_length: e.value })}
                                        options={[
                                            { label: t.editprojectmodal506, value: 2 },
                                            { label: t.editprojectmodal507, value: 3 },
                                            { label: t.editprojectmodal508, value: 4 },
                                            { label: t.editprojectmodal509, value: 5 }
                                        ]}
                                        className="w-full"
                                    />
                                    <div className="text-xs text-gray-400 mt-1">
                                        Länge der kurzen Dateinamen im Database Designer (z.B. "us" für users)
                                    </div>
                                </div>
                            </div>
                </TabPanel>
                <TabPanel header={<span><i className="pi pi-globe mr-2"></i>Lokalisierung</span>}>
                            <div className="space-y-4 max-w-3xl">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Dezimaltrennzeichen
                                        </label>
                                        <InputText
                                            value={formData.decimal_separator}
                                            onChange={(e) => setFormData({ ...formData, decimal_separator: e.target.value })}
                                            placeholder=","
                                            maxLength={1}
                                            className="w-full"
                                        />
                                        <div className="text-xs text-gray-400 mt-1">
                                            z.B. "," für 1,23 oder "." für 1.23
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Tausendertrennzeichen
                                        </label>
                                        <InputText
                                            value={formData.thousands_separator}
                                            onChange={(e) => setFormData({ ...formData, thousands_separator: e.target.value })}
                                            placeholder="."
                                            maxLength={1}
                                            className="w-full"
                                        />
                                        <div className="text-xs text-gray-400 mt-1">
                                            z.B. "." für 1.234 oder "," für 1,234
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Datumsformat
                                        </label>
                                        <InputText
                                            value={formData.date_format}
                                            onChange={(e) => setFormData({ ...formData, date_format: e.target.value })}
                                            placeholder="d.m.Y"
                                            className="w-full"
                                        />
                                        <div className="text-xs text-gray-400 mt-1">
                                            PHP Format (z.B. "d.m.Y" für 31.12.2024)
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Zeitformat
                                        </label>
                                        <InputText
                                            value={formData.time_format}
                                            onChange={(e) => setFormData({ ...formData, time_format: e.target.value })}
                                            placeholder="H:i:s"
                                            className="w-full"
                                        />
                                        <div className="text-xs text-gray-400 mt-1">
                                            PHP Format (z.B. "H:i:s" für 14:30:00)
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Währungssymbol
                                        </label>
                                        <InputText
                                            value={formData.currency_symbol}
                                            onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                                            placeholder={t.editprojectmodal602}
                                            maxLength={5}
                                            className="w-full"
                                        />
                                        <div className="text-xs text-gray-400 mt-1">
                                            z.B. t.editprojectmodal602, "$", "£", t.editprojectmodal608
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Zeitzone
                                        </label>
                                        <Dropdown
                                            value={formData.timezone}
                                            onChange={(e) => setFormData({ ...formData, timezone: e.value })}
                                            options={[
                                                { label: 'Europe/Vienna', value: 'Europe/Vienna' },
                                                { label: 'Europe/Berlin', value: 'Europe/Berlin' },
                                                { label: 'Europe/Zurich', value: 'Europe/Zurich' },
                                                { label: 'Europe/London', value: 'Europe/London' },
                                                { label: 'America/New_York', value: 'America/New_York' },
                                                { label: 'America/Chicago', value: 'America/Chicago' },
                                                { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
                                                { label: 'Asia/Tokyo', value: 'Asia/Tokyo' },
                                                { label: 'Asia/Dubai', value: 'Asia/Dubai' },
                                                { label: 'UTC', value: 'UTC' }
                                            ]}
                                            className="w-full"
                                            filter
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Google Translate API-Schlüssel
                                    </label>
                                    <PrimePassword
                                        value={formData.google_translate_api_key}
                                        onChange={(e) => setFormData({ ...formData, google_translate_api_key: e.target.value })}
                                        placeholder="AIzaSy..."
                                        className="w-full font-mono"
                                        feedback={false}
                                        toggleMask
                                    />
                                    <div className="text-xs text-gray-400 mt-1">
                                        API-Schlüssel für automatische Übersetzungen via Google Translate
                                    </div>
                                    <div className="text-xs text-blue-400 mt-1">
                                        🔗 <a href="https://cloud.google.com/translate/docs/setup" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">
                                            Google Cloud Console - API Key erstellen
                                        </a>
                                    </div>
                                </div>
                            </div>
                </TabPanel>
                <TabPanel header={<span><i className="pi pi-comments mr-2"></i>Sprachen</span>}>
                            <div className="max-w-4xl">
                                <div className="mb-4 p-3 bg-blue-900 border border-blue-700 rounded text-blue-100 text-sm">
                                    <i className="pi pi-info-circle mr-2"></i>
                                    Wählen Sie die Sprachen aus, die für die Code-Generierung in diesem Projekt verwendet werden sollen.
                                    Verschieben Sie die gewünschten Sprachen nach rechts und nutzen Sie die Pfeiltasten um die Reihenfolge zu ändern.
                                </div>

                                <PickList
                                    source={transferData.filter(lang => !selectedLanguages.includes(lang.key))}
                                    target={selectedLanguages
                                        .map(key => transferData.find(lang => lang.key === key))
                                        .filter(lang => lang !== undefined)}
                                    onChange={(e) => {
                                        const targetKeys = e.target.map((item: any) => item.key);
                                        setSelectedLanguages(targetKeys as string[]);
                                    }}
                                    itemTemplate={(item) => `${item.title}`}
                                    sourceHeader={t.projectsettingspanel727}
                                    targetHeader={t.projectsettingspanel728}
                                    sourceStyle={{ height: '400px' }}
                                    targetStyle={{ height: '400px' }}
                                    filter
                                    filterBy="title"
                                    sourceFilterPlaceholder={t.projectsettingspanel733}
                                    targetFilterPlaceholder={t.projectsettingspanel733}
                                    showSourceControls={false}
                                    showTargetControls={true}
                                />

                                <div className="mt-6 text-gray-300 text-sm">
                                    <p>
                                        <strong>Ausgewählte Sprachen:</strong>{' '}
                                        {selectedLanguages.length > 0
                                            ? selectedLanguages.join(', ')
                                            : t.projectsettingspanel742}
                                    </p>
                                </div>
                            </div>
                </TabPanel>

                {/* Template Variables Tab */}
                <TabPanel header={<span><i className="pi pi-code mr-2"></i>Template Variablen</span>}>
                    <div className="max-w-6xl">
                        <div className="mb-4 p-3 bg-blue-900 border border-blue-700 rounded text-blue-100 text-sm">
                            <i className="pi pi-info-circle mr-2"></i>
                            Hier können Sie die Werte für benutzerdefinierte Template-Variablen eintragen.
                            Diese Variablen wurden vom Template-Entwickler definiert und können pro Sprache unterschiedlich sein.
                        </div>

                        {loadingVariables ? (
                            <div className="flex justify-center py-8">
                                <ProgressSpinner />
                            </div>
                        ) : templatesWithVariables.length === 0 ? (
                            <div className="p-4 bg-gray-800 border border-gray-700 rounded text-gray-300 text-center">
                                <i className="pi pi-info-circle mr-2"></i>
                                Keine Template-Variablen gefunden. Template-Entwickler können benutzerdefinierte Variablen in ihren Templates definieren.
                            </div>
                        ) : (
                            <>
                                {/* Language Selector */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        <i className="pi pi-globe mr-2"></i>Sprache für Variablen
                                    </label>
                                    <Dropdown
                                        value={selectedVariableLanguage}
                                        onChange={(e) => setSelectedVariableLanguage(e.value)}
                                        options={availableLanguages
                                            .filter(lang => lang.is_active)
                                            .map(lang => ({
                                                label: `${lang.native_name} (${lang.name})`,
                                                value: lang.code,
                                            }))}
                                        placeholder="Sprache auswählen"
                                        className="w-full max-w-md"
                                    />
                                </div>

                                {/* Templates with Variables */}
                                {templatesWithVariables.map((template) => (
                                    <div key={template.id} className="mb-6 p-4 bg-gray-800 border border-gray-700 rounded">
                                        <h3 className="text-lg font-semibold text-blue-400 mb-1">
                                            <i className="pi pi-file-code mr-2"></i>
                                            {template.name}
                                        </h3>
                                        {template.description && (
                                            <p className="text-sm text-gray-400 mb-4">{template.description}</p>
                                        )}

                                        <div className="space-y-3">
                                            {template.variables.map((variable) => {
                                                const key = `${template.id}_${variable.variable_name}`;
                                                const currentValue = variableValues[key]?.[selectedVariableLanguage] || '';

                                                return (
                                                    <div key={variable.id} className="p-3 bg-gray-900 border border-gray-600 rounded">
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="font-mono text-green-400 font-semibold">
                                                                        {`{${variable.variable_name}}`}
                                                                    </span>
                                                                    {variable.is_required && (
                                                                        <span className="text-xs bg-red-900 text-red-200 px-2 py-1 rounded">
                                                                            Erforderlich
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {variable.description && (
                                                                    <p className="text-sm text-gray-400 mb-2">
                                                                        {variable.description}
                                                                    </p>
                                                                )}

                                                                {variable.default_value && (
                                                                    <p className="text-xs text-gray-500 mb-2">
                                                                        Standard: <span className="text-blue-300">{variable.default_value}</span>
                                                                    </p>
                                                                )}

                                                                <InputText
                                                                    value={currentValue}
                                                                    onChange={(e) => handleVariableValueChange(
                                                                        template.id,
                                                                        variable.variable_name,
                                                                        selectedVariableLanguage,
                                                                        e.target.value
                                                                    )}
                                                                    placeholder={variable.default_value || `Wert für {${variable.variable_name}} eingeben`}
                                                                    className="w-full"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {/* Info: Variables are saved by main "Save All" button */}
                                <div className="mt-6 p-3 bg-green-900 border border-green-700 rounded text-green-100 text-sm">
                                    <i className="pi pi-info-circle mr-2"></i>
                                    Template-Variablen werden automatisch mit dem Button "Alle Änderungen speichern" oben gespeichert.
                                </div>
                            </>
                        )}
                    </div>
                </TabPanel>
            </TabView>
        </div>
    );
}
