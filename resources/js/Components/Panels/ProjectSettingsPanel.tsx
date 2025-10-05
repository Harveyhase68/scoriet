import React, { useState, useEffect } from 'react';
import { Input, Select, Checkbox, Button, message, Spin, Transfer, Tabs } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { useProject } from '@/contexts/ProjectContext';

const { TabPane } = Tabs;
const { TextArea, Password } = Input;
const { Option } = Select;

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

export default function ProjectSettingsPanel() {
    const { selectedProject, loadProjects } = useProject();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);

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
        currency_symbol: '€',
        timezone: 'Europe/Vienna',
        // API Keys
        google_translate_api_key: ''
    });

    useEffect(() => {
        loadLanguages();
        if (selectedProject) {
            loadProjectData();
            loadProjectMembers();
        }
    }, [selectedProject]);

    const loadLanguages = async () => {
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
        } catch (error) {
            console.error('Error loading languages:', error);
        }
    };

    const loadProjectData = async () => {
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
                    project_directory: project.project_directory || '',
                    project_url: project.project_url || '',
                    start_page: project.start_page || 'index.php',
                    default_language: project.default_language || 'en',
                    filename_short_length: project.filename_short_length || 2,
                    decimal_separator: project.decimal_separator || ',',
                    thousands_separator: project.thousands_separator || '.',
                    date_format: project.date_format || 'd.m.Y',
                    time_format: project.time_format || 'H:i:s',
                    currency_symbol: project.currency_symbol || '€',
                    timezone: project.timezone || 'Europe/Vienna',
                    google_translate_api_key: project.google_translate_api_key || ''
                });
            }
        } catch (error) {
            console.error('Error loading project data:', error);
            message.error('Fehler beim Laden der Projektdaten');
        } finally {
            setLoading(false);
        }
    };

    const loadProjectMembers = async () => {
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
        } catch (error) {
            console.error('Error loading project members:', error);
        }
    };

    const handleSave = async () => {
        if (!selectedProject) {
            message.error('Kein Projekt ausgewählt');
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
                message.error('Nicht authentifiziert');
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
                throw new Error('Failed to update project');
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
                throw new Error('Failed to save language settings');
            }

            message.success('Projekt-Einstellungen erfolgreich gespeichert');

            // Refresh projects to update the UI
            loadProjects();
        } catch (error) {
            console.error('Error saving project:', error);
            message.error('Fehler beim Speichern der Projekt-Einstellungen');
        } finally {
            setSaving(false);
        }
    };

    const generateJoinCode = () => {
        const code = 'PROJ-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        setFormData({ ...formData, join_code: code });
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
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-800">
                <Spin size="large" />
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
                    type="primary"
                    icon={<SaveOutlined />}
                    size="large"
                    onClick={handleSave}
                    loading={saving}
                >
                    Alle Änderungen speichern
                </Button>
            </div>

            <Tabs defaultActiveKey="1" className="flex-1">
                {/* Tab 1: General Settings */}
                <TabPane tab={<span><i className="pi pi-cog mr-2"></i>Allgemein</span>} key="1">
                    <div className="space-y-4 max-w-3xl">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Projektname *
                            </label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="my_project_name"
                                className="font-mono"
                            />
                            <div className="text-xs text-gray-400 mt-1">
                                Projekt-Namen werden später für URLs verwendet (username/project_name)
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Beschreibung
                            </label>
                            <TextArea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                placeholder="Projektbeschreibung eingeben"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Beitrittscode
                            </label>
                            <Input
                                value={formData.join_code}
                                onChange={(e) => setFormData({ ...formData, join_code: e.target.value })}
                                placeholder="Beitrittscode (optional)"
                                addonAfter={
                                    <Button
                                        type="text"
                                        icon={<ReloadOutlined />}
                                        onClick={generateJoinCode}
                                        size="small"
                                    />
                                }
                            />
                            <div className="text-xs text-gray-400 mt-1">
                                Benutzer können diesem Projekt mit diesem Code beitreten
                            </div>
                        </div>

                        <div>
                            <Checkbox
                                checked={formData.is_public}
                                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                            >
                                <span className="text-gray-300">Öffentliches Projekt</span>
                            </Checkbox>
                            <div className="text-xs text-gray-400 mt-1 ml-6">
                                Dieses Projekt für alle Benutzer sichtbar machen
                            </div>
                        </div>

                        {selectedProject.is_owner && projectMembers.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Eigentümerschaft übertragen
                                </label>
                                <Select
                                    value={formData.new_owner_id || undefined}
                                    onChange={(value) => setFormData({ ...formData, new_owner_id: value })}
                                    placeholder={`Aktueller Eigentümer: ${selectedProject.owner.name}`}
                                    className="w-full"
                                    allowClear
                                >
                                    {projectMembers.filter(m => m.user_id !== selectedProject.owner.id).map(member => (
                                        <Option key={member.user_id} value={member.user_id}>
                                            Übertragen an {member.user.name} ({member.user.email}) - {member.role}
                                        </Option>
                                    ))}
                                </Select>
                                <div className="text-xs text-yellow-500 mt-1">
                                    ⚠️ Warnung: Sie verlieren Ihre Eigentümerrechte nach der Übertragung!
                                </div>
                            </div>
                        )}
                    </div>
                </TabPane>

                {/* Tab 2: Database Connection */}
                <TabPane tab={<span><i className="pi pi-database mr-2"></i>Datenbank</span>} key="2">
                    <div className="space-y-4 max-w-3xl">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Datenbankname
                            </label>
                            <Input
                                value={formData.database_name}
                                onChange={(e) => setFormData({ ...formData, database_name: e.target.value })}
                                placeholder="project_database"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Datenbanktyp
                            </label>
                            <Select
                                value={formData.database_type}
                                onChange={(value) => setFormData({ ...formData, database_type: value })}
                                className="w-full"
                            >
                                <Option value="MySQL">MySQL</Option>
                                <Option value="PostgreSQL">PostgreSQL</Option>
                                <Option value="SQLite">SQLite</Option>
                                <Option value="MSSQL">SQL Server</Option>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Server
                                </label>
                                <Input
                                    value={formData.database_server}
                                    onChange={(e) => setFormData({ ...formData, database_server: e.target.value })}
                                    placeholder="127.0.0.1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Port
                                </label>
                                <Input
                                    value={formData.database_port}
                                    onChange={(e) => setFormData({ ...formData, database_port: e.target.value })}
                                    placeholder="3306"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Benutzername
                            </label>
                            <Input
                                value={formData.database_username}
                                onChange={(e) => setFormData({ ...formData, database_username: e.target.value })}
                                placeholder="database_user"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Passwort
                            </label>
                            <Password
                                value={formData.database_password}
                                onChange={(e) => setFormData({ ...formData, database_password: e.target.value })}
                                placeholder="database_password"
                            />
                        </div>
                    </div>
                </TabPane>

                {/* Tab 3: Project Properties */}
                <TabPane tab={<span><i className="pi pi-file mr-2"></i>Eigenschaften</span>} key="3">
                    <div className="space-y-4 max-w-3xl">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Projektverzeichnis
                            </label>
                            <Input
                                value={formData.project_directory}
                                onChange={(e) => setFormData({ ...formData, project_directory: e.target.value })}
                                placeholder="C:\Users\Public\Documents\my_project"
                            />
                            <div className="text-xs text-gray-400 mt-1">
                                Pfad wo generierte Dateien gespeichert werden sollen
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Projekt-URL
                            </label>
                            <Input
                                value={formData.project_url}
                                onChange={(e) => setFormData({ ...formData, project_url: e.target.value })}
                                placeholder="http://localhost/my_project"
                            />
                            <div className="text-xs text-gray-400 mt-1">
                                URL für den Zugriff auf das Projekt
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Startseite
                            </label>
                            <Input
                                value={formData.start_page}
                                onChange={(e) => setFormData({ ...formData, start_page: e.target.value })}
                                placeholder="index.php"
                            />
                            <div className="text-xs text-gray-400 mt-1">
                                Haupt-Einstiegsdatei (z.B. index.php, main.py, app.js)
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Standard-Sprache
                            </label>
                            <Select
                                value={formData.default_language}
                                onChange={(value) => setFormData({ ...formData, default_language: value })}
                                className="w-full"
                            >
                                <Option value="en">English</Option>
                                <Option value="de">Deutsch</Option>
                                <Option value="fr">Français</Option>
                                <Option value="es">Español</Option>
                                <Option value="it">Italiano</Option>
                            </Select>
                            <div className="text-xs text-gray-400 mt-1">
                                Standard-Sprache für Projekt-Generierung
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Dateiname Kurzlänge
                            </label>
                            <Select
                                value={formData.filename_short_length}
                                onChange={(value) => setFormData({ ...formData, filename_short_length: value })}
                                className="w-full"
                            >
                                <Option value={2}>2 Zeichen</Option>
                                <Option value={3}>3 Zeichen</Option>
                                <Option value={4}>4 Zeichen</Option>
                                <Option value={5}>5 Zeichen</Option>
                            </Select>
                            <div className="text-xs text-gray-400 mt-1">
                                Länge der kurzen Dateinamen im Database Designer (z.B. "us" für users)
                            </div>
                        </div>
                    </div>
                </TabPane>

                {/* Tab 4: Localization */}
                <TabPane tab={<span><i className="pi pi-globe mr-2"></i>Lokalisierung</span>} key="4">
                    <div className="space-y-4 max-w-3xl">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Dezimaltrennzeichen
                                </label>
                                <Input
                                    value={formData.decimal_separator}
                                    onChange={(e) => setFormData({ ...formData, decimal_separator: e.target.value })}
                                    placeholder=","
                                    maxLength={1}
                                />
                                <div className="text-xs text-gray-400 mt-1">
                                    z.B. "," für 1,23 oder "." für 1.23
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Tausendertrennzeichen
                                </label>
                                <Input
                                    value={formData.thousands_separator}
                                    onChange={(e) => setFormData({ ...formData, thousands_separator: e.target.value })}
                                    placeholder="."
                                    maxLength={1}
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
                                <Input
                                    value={formData.date_format}
                                    onChange={(e) => setFormData({ ...formData, date_format: e.target.value })}
                                    placeholder="d.m.Y"
                                />
                                <div className="text-xs text-gray-400 mt-1">
                                    PHP Format (z.B. "d.m.Y" für 31.12.2024)
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Zeitformat
                                </label>
                                <Input
                                    value={formData.time_format}
                                    onChange={(e) => setFormData({ ...formData, time_format: e.target.value })}
                                    placeholder="H:i:s"
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
                                <Input
                                    value={formData.currency_symbol}
                                    onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                                    placeholder="€"
                                    maxLength={5}
                                />
                                <div className="text-xs text-gray-400 mt-1">
                                    z.B. "€", "$", "£", "CHF"
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Zeitzone
                                </label>
                                <Select
                                    value={formData.timezone}
                                    onChange={(value) => setFormData({ ...formData, timezone: value })}
                                    className="w-full"
                                    showSearch
                                >
                                    <Option value="Europe/Vienna">Europe/Vienna</Option>
                                    <Option value="Europe/Berlin">Europe/Berlin</Option>
                                    <Option value="Europe/Zurich">Europe/Zurich</Option>
                                    <Option value="Europe/London">Europe/London</Option>
                                    <Option value="America/New_York">America/New_York</Option>
                                    <Option value="America/Chicago">America/Chicago</Option>
                                    <Option value="America/Los_Angeles">America/Los_Angeles</Option>
                                    <Option value="Asia/Tokyo">Asia/Tokyo</Option>
                                    <Option value="Asia/Dubai">Asia/Dubai</Option>
                                    <Option value="UTC">UTC</Option>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Google Translate API-Schlüssel
                            </label>
                            <Password
                                value={formData.google_translate_api_key}
                                onChange={(e) => setFormData({ ...formData, google_translate_api_key: e.target.value })}
                                placeholder="AIzaSy..."
                                className="font-mono"
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
                </TabPane>

                {/* Tab 5: Languages */}
                <TabPane tab={<span><i className="pi pi-comments mr-2"></i>Sprachen</span>} key="5">
                    <div className="max-w-4xl">
                        <div className="mb-4 p-3 bg-blue-900 border border-blue-700 rounded text-blue-100 text-sm">
                            <i className="pi pi-info-circle mr-2"></i>
                            Wählen Sie die Sprachen aus, die für die Code-Generierung in diesem Projekt verwendet werden sollen.
                            Verschieben Sie die gewünschten Sprachen nach rechts.
                        </div>

                        <Transfer
                            dataSource={transferData}
                            targetKeys={selectedLanguages}
                            onChange={(targetKeys) => setSelectedLanguages(targetKeys as string[])}
                            render={item => item.title}
                            titles={['Verfügbare Sprachen', 'Aktivierte Sprachen']}
                            listStyle={{
                                width: 300,
                                height: 400,
                            }}
                            locale={{
                                itemUnit: 'Sprache',
                                itemsUnit: 'Sprachen',
                                searchPlaceholder: 'Suchen...',
                                notFoundContent: 'Keine Daten',
                            }}
                            showSearch
                            filterOption={(inputValue, option) =>
                                option.title.toLowerCase().indexOf(inputValue.toLowerCase()) > -1
                            }
                        />

                        <div className="mt-6 text-gray-300 text-sm">
                            <p>
                                <strong>Ausgewählte Sprachen:</strong>{' '}
                                {selectedLanguages.length > 0
                                    ? selectedLanguages.join(', ')
                                    : 'Keine Sprachen ausgewählt'}
                            </p>
                        </div>
                    </div>
                </TabPane>
            </Tabs>

            <style>{`
                .project-settings-panel .ant-tabs {
                    color: #f3f4f6;
                }
                .project-settings-panel .ant-tabs-tab {
                    color: #9ca3af !important;
                }
                .project-settings-panel .ant-tabs-tab:hover {
                    color: #f3f4f6 !important;
                }
                .project-settings-panel .ant-tabs-tab-active {
                    color: #3b82f6 !important;
                }
                .project-settings-panel .ant-tabs-ink-bar {
                    background: #3b82f6 !important;
                }
                .project-settings-panel .ant-tabs-nav {
                    margin-bottom: 24px;
                }
                .project-settings-panel .ant-tabs-content {
                    color: #f3f4f6;
                }
                .project-settings-panel .ant-input,
                .project-settings-panel .ant-input-password,
                .project-settings-panel .ant-input-affix-wrapper {
                    background: #1f2937 !important;
                    border-color: #4b5563 !important;
                    color: #f3f4f6 !important;
                }
                .project-settings-panel .ant-input::placeholder,
                .project-settings-panel .ant-input-password input::placeholder {
                    color: #6b7280 !important;
                }
                .project-settings-panel .ant-input:hover,
                .project-settings-panel .ant-input-password:hover,
                .project-settings-panel .ant-input-affix-wrapper:hover {
                    border-color: #6b7280 !important;
                }
                .project-settings-panel .ant-input:focus,
                .project-settings-panel .ant-input-focused,
                .project-settings-panel .ant-input-password:focus,
                .project-settings-panel .ant-input-affix-wrapper-focused {
                    border-color: #3b82f6 !important;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
                }
                .project-settings-panel .ant-select-selector {
                    background: #1f2937 !important;
                    border-color: #4b5563 !important;
                    color: #f3f4f6 !important;
                }
                .project-settings-panel .ant-select-selector:hover {
                    border-color: #6b7280 !important;
                }
                .project-settings-panel .ant-select-focused .ant-select-selector {
                    border-color: #3b82f6 !important;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
                }
                .project-settings-panel .ant-select-arrow,
                .project-settings-panel .ant-select-clear {
                    color: #9ca3af !important;
                }
                .project-settings-panel .ant-select-dropdown {
                    background: #1f2937 !important;
                    border: 1px solid #4b5563 !important;
                }
                .project-settings-panel .ant-select-item {
                    color: #f3f4f6 !important;
                    background: #1f2937 !important;
                }
                .project-settings-panel .ant-select-item:hover {
                    background: #374151 !important;
                }
                .project-settings-panel .ant-select-item-option-selected {
                    background: #3b82f6 !important;
                    color: white !important;
                }
                .project-settings-panel .ant-checkbox-wrapper {
                    color: #f3f4f6 !important;
                }
                .project-settings-panel .ant-checkbox-inner {
                    background-color: #374151 !important;
                    border-color: #6b7280 !important;
                }
                .project-settings-panel .ant-checkbox-checked .ant-checkbox-inner {
                    background-color: #3b82f6 !important;
                    border-color: #3b82f6 !important;
                }
                .project-settings-panel .ant-input-number {
                    background: #1f2937 !important;
                    border-color: #4b5563 !important;
                }
                .project-settings-panel .ant-input-number-input {
                    color: #f3f4f6 !important;
                }
                .project-settings-panel .ant-btn-primary {
                    background: #3b82f6 !important;
                    border-color: #3b82f6 !important;
                }
                .project-settings-panel .ant-btn-primary:hover {
                    background: #2563eb !important;
                    border-color: #2563eb !important;
                }
                .project-settings-panel .ant-transfer {
                    color: #f3f4f6;
                }
                .project-settings-panel .ant-transfer-list {
                    background: #374151 !important;
                    border-color: #4b5563 !important;
                }
                .project-settings-panel .ant-transfer-list-header {
                    background: #4b5563 !important;
                    border-color: #6b7280 !important;
                    color: #f3f4f6 !important;
                }
                .project-settings-panel .ant-transfer-list-body {
                    background: #374151 !important;
                }
                .project-settings-panel .ant-transfer-list-content-item {
                    background: #374151 !important;
                    color: #f3f4f6 !important;
                    border-color: #4b5563 !important;
                }
                .project-settings-panel .ant-transfer-list-content-item:hover {
                    background: #4b5563 !important;
                }
                .project-settings-panel .ant-transfer-list-content-item-checked {
                    background: #3b82f6 !important;
                }
                .project-settings-panel .ant-transfer-list-search {
                    background: #1f2937 !important;
                }
                .project-settings-panel .ant-transfer-list-search .ant-input-affix-wrapper {
                    background: #1f2937 !important;
                    border-color: #4b5563 !important;
                }
                .project-settings-panel .ant-transfer-list-search .ant-input-affix-wrapper:hover {
                    border-color: #6b7280 !important;
                }
                .project-settings-panel .ant-transfer-list-search .ant-input-affix-wrapper-focused {
                    border-color: #3b82f6 !important;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
                }
                .project-settings-panel .ant-transfer-list-search .ant-input {
                    background: transparent !important;
                    border: none !important;
                    color: #f3f4f6 !important;
                }
                .project-settings-panel .ant-transfer-list-search .ant-input::placeholder {
                    color: #9ca3af !important;
                }
                .project-settings-panel .ant-input-suffix {
                    color: #9ca3af !important;
                }
                .project-settings-panel .ant-input-password-icon {
                    color: #9ca3af !important;
                }
            `}</style>
        </div>
    );
}
