import React, { useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { FileUpload, FileUploadHandlerEvent } from 'primereact/fileupload';
import { RadioButton } from 'primereact/radiobutton';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
// Divider reserved for future layout use
import { Divider as _Divider } from 'primereact/divider';
import { Badge } from 'primereact/badge';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

// Helper to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
};

// Helper for authenticated fetch
const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Accept', 'application/json');

  return fetch(url, { ...options, headers });
};

interface TabPanelProps {
  isActive: boolean;
  onOpenPanel?: (panelId: string, data?: any) => void;
}

interface SchemaConflict {
  name: string;
  description: string;
  database_type: string;
  versions_count: number;
  exists: boolean;
  existing_id: number | null;
  suggested_name: string;
}

interface TemplateConflict {
  name: string;
  full_name: string;
  description: string;
  category: string;
  files_count: number;
  exists: boolean;
  existing_id: number | null;
  suggested_name: string;
  usage_type: string;
}

interface FormSetConflict {
  name: string;
  description: string;
  windows_count: number;
  exists: boolean;
  existing_id: number | null;
  suggested_name: string;
}

interface ProjectConflict {
  name: string;
  description: string;
  exists: boolean;
  existing_id: number | null;
  suggested_name: string;
}

interface Analysis {
  export_info: {
    version: string;
    exported_at: string;
    scoriet_version: string;
  };
  project: ProjectConflict;
  schemas: SchemaConflict[];
  templates: TemplateConflict[];
  form_sets: FormSetConflict[];
  counts: {
    code_adjustments: number;
    attachments: number;
    translations: number;
    template_variable_values: number;
  };
  zip_path: string;
  temp_dir: string;
}

type ImportAction = 'create' | 'use_existing' | 'skip';

interface SchemaOption {
  action: ImportAction;
  name: string;
  existing_id?: number;
}

interface TemplateOption {
  action: ImportAction;
  name: string;
  existing_id?: number;
}

interface FormSetOption {
  action: ImportAction;
  name: string;
  existing_id?: number;
}

interface ProjectOption {
  action: 'create' | 'merge';
  name: string;
  existing_id?: number;
}

interface ImportOptions {
  project: ProjectOption;
  schemas: SchemaOption[];
  templates: TemplateOption[];
  form_sets: FormSetOption[];
  import_code_adjustments: boolean;
  import_attachments: boolean;
  import_translations: boolean;
}

export default function ProjectImportPanel({ isActive: _isActive, onOpenPanel }: TabPanelProps) {
  const [currentLanguage] = useState<SupportedLanguage>(getStoredLanguage());
  const { t: _t } = useTranslation(currentLanguage);
  const { colors } = useTheme();
  const toast = useRef<Toast>(null);
  const fileUploadRef = useRef<FileUpload>(null);

  // State
  const [step, setStep] = useState<'upload' | 'configure' | 'importing' | 'complete'>('upload');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [options, setOptions] = useState<ImportOptions | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  // Handle file upload
  const handleUpload = async (event: FileUploadHandlerEvent) => {
    const file = event.files[0];
    if (!file) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = getAuthToken();
      if (!token) {
        throw new Error('Nicht angemeldet');
      }

      const response = await fetch('/api/projects/import/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const analysisData = data.analysis as Analysis;
        setAnalysis(analysisData);

        // Initialize options based on analysis
        initializeOptions(analysisData);

        setStep('configure');
        toast.current?.show({
          severity: 'success',
          summary: 'Analyse erfolgreich',
          detail: 'ZIP-Datei wurde analysiert',
          life: 3000,
        });
      } else {
        throw new Error(data.error || 'Analyse fehlgeschlagen');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Fehler',
        detail: error.message || 'Upload fehlgeschlagen',
        life: 5000,
      });
    } finally {
      setLoading(false);
      fileUploadRef.current?.clear();
    }
  };

  // Initialize options based on analysis
  const initializeOptions = (analysisData: Analysis) => {
    const newOptions: ImportOptions = {
      project: {
        action: 'create',
        name: analysisData.project.exists
          ? analysisData.project.suggested_name
          : analysisData.project.name,
      },
      schemas: analysisData.schemas.map((schema) => ({
        action: schema.exists ? 'create' : 'create',
        name: schema.exists ? schema.suggested_name : schema.name,
        existing_id: schema.existing_id ?? undefined,
      })),
      templates: analysisData.templates.map((template) => ({
        action: template.exists ? 'create' : 'create',
        name: template.exists ? template.suggested_name : template.name,
        existing_id: template.existing_id ?? undefined,
      })),
      form_sets: analysisData.form_sets.map((formSet) => ({
        action: formSet.exists ? 'create' : 'create',
        name: formSet.exists ? formSet.suggested_name : formSet.name,
        existing_id: formSet.existing_id ?? undefined,
      })),
      import_code_adjustments: true,
      import_attachments: true,
      import_translations: true,
    };

    setOptions(newOptions);
  };

  // Execute import
  const handleImport = async () => {
    if (!analysis || !options) return;

    setStep('importing');
    setLoading(true);

    try {
      const response = await authFetch('/api/projects/import/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zip_path: analysis.zip_path,
          options: options,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setImportResult(data);
        setStep('complete');
        toast.current?.show({
          severity: 'success',
          summary: 'Import erfolgreich',
          detail: `Projekt "${data.project?.name}" wurde importiert`,
          life: 5000,
        });
      } else {
        throw new Error(data.error || 'Import fehlgeschlagen');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Fehler',
        detail: error.message || 'Import fehlgeschlagen',
        life: 5000,
      });
      setStep('configure');
    } finally {
      setLoading(false);
    }
  };

  // Cancel and cleanup
  const handleCancel = async () => {
    if (analysis) {
      try {
        await authFetch('/api/projects/import/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            zip_path: analysis.zip_path,
            temp_dir: analysis.temp_dir,
          }),
        });
      } catch (_error) {
        // Ignore cleanup errors
      }
    }

    setAnalysis(null);
    setOptions(null);
    setImportResult(null);
    setStep('upload');
  };

  // Open imported project
  const handleOpenProject = () => {
    if (importResult?.project && onOpenPanel) {
      onOpenPanel('project', { projectId: importResult.project.id });
    }
  };

  // Render upload step
  const renderUploadStep = () => (
    <Card className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
      <div className="text-center p-6">
        <i className="pi pi-upload text-6xl mb-4" style={{ color: colors.accent }} />
        <h3 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>Projekt importieren</h3>
        <p className="mb-6" style={{ color: colors.textMuted }}>
          Wählen Sie eine Scoriet-Export-Datei (.zip) aus, um ein Projekt zu importieren.
        </p>

        <FileUpload
          ref={fileUploadRef}
          mode="basic"
          accept=".zip"
          maxFileSize={104857600}
          customUpload
          uploadHandler={handleUpload}
          auto
          chooseLabel="ZIP-Datei auswählen"
          className="p-button-lg"
          disabled={loading}
        />

        {loading && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <ProgressSpinner style={{ width: '24px', height: '24px' }} />
            <span style={{ color: colors.textPrimary }}>Analysiere ZIP-Datei...</span>
          </div>
        )}
      </div>
    </Card>
  );

  // Render configuration step
  const renderConfigureStep = () => {
    if (!analysis || !options) return null;

    return (
      <div className="space-y-4">
        {/* Export Info */}
        <Card style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
          <div className="flex items-center gap-4">
            <i className="pi pi-info-circle text-2xl" style={{ color: colors.infoText }} />
            <div>
              <p className="font-semibold" style={{ color: colors.textPrimary }}>Export-Info</p>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Exportiert am:{' '}
                {new Date(analysis.export_info.exported_at).toLocaleString('de-DE')}
                {' | '}
                Scoriet Version: {analysis.export_info.scoriet_version}
              </p>
            </div>
          </div>
        </Card>

        <Accordion multiple activeIndex={[0, 1, 2, 3]}>
          {/* Project Configuration */}
          <AccordionTab
            header={
              <div className="flex items-center gap-2">
                <i className="pi pi-folder" style={{ color: colors.textPrimary }} />
                <span style={{ color: colors.textPrimary }}>Projekt</span>
                {analysis.project.exists && <Tag severity="warning" value="Existiert" />}
              </div>
            }
            pt={{
              headerAction: { style: { backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary } },
              content: { style: { backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary } }
            }}
          >
            <div className="space-y-4" style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}>
              <div className="flex items-center gap-4 mb-4">
                <span className="font-semibold min-w-32" style={{ color: colors.textPrimary }}>Original-Name:</span>
                <span style={{ color: colors.textSecondary }}>{analysis.project.name}</span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center">
                  <RadioButton
                    inputId="project_create"
                    name="project_action"
                    value="create"
                    checked={options.project.action === 'create'}
                    onChange={() =>
                      setOptions({
                        ...options,
                        project: {
                          ...options.project,
                          action: 'create',
                          name: analysis.project.exists
                            ? analysis.project.suggested_name
                            : analysis.project.name,
                        },
                      })
                    }
                  />
                  <label htmlFor="project_create" className="ml-2" style={{ color: colors.textPrimary }}>
                    Neues Projekt anlegen
                  </label>
                </div>

                {options.project.action === 'create' && (
                  <div className="ml-6 flex items-center gap-2">
                    <span style={{ color: colors.textPrimary }}>Name:</span>
                    <InputText
                      value={options.project.name}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          project: { ...options.project, name: e.target.value },
                        })
                      }
                      className="w-64"
                    />
                  </div>
                )}

                {analysis.project.exists && (
                  <div className="flex items-center">
                    <RadioButton
                      inputId="project_merge"
                      name="project_action"
                      value="merge"
                      checked={options.project.action === 'merge'}
                      onChange={() =>
                        setOptions({
                          ...options,
                          project: {
                            ...options.project,
                            action: 'merge',
                            existing_id: analysis.project.existing_id ?? undefined,
                          },
                        })
                      }
                    />
                    <label htmlFor="project_merge" className="ml-2" style={{ color: colors.textPrimary }}>
                      In bestehendes Projekt "{analysis.project.name}" importieren (Merge)
                    </label>
                  </div>
                )}
              </div>
            </div>
          </AccordionTab>

          {/* Schemas Configuration */}
          {analysis.schemas.length > 0 && (
            <AccordionTab
              header={
                <div className="flex items-center gap-2">
                  <i className="pi pi-database" style={{ color: colors.textPrimary }} />
                  <span style={{ color: colors.textPrimary }}>Datenbanken</span>
                  <Badge value={analysis.schemas.length} />
                  {analysis.schemas.some((s) => s.exists) && (
                    <Tag severity="warning" value="Konflikte" />
                  )}
                </div>
              }
              pt={{
                headerAction: { style: { backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary } },
                content: { style: { backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary } }
              }}
            >
              <div className="space-y-4" style={{ backgroundColor: colors.bgSecondary }}>
                {analysis.schemas.map((schema, index) => (
                  <div key={index} className="rounded-lg p-4" style={{ border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgTertiary }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-semibold" style={{ color: colors.textPrimary }}>{schema.name}</span>
                        <span className="ml-2" style={{ color: colors.textMuted }}>
                          ({schema.versions_count} Version(en), {schema.database_type})
                        </span>
                      </div>
                      {schema.exists && <Tag severity="warning" value="Existiert" />}
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center">
                        <RadioButton
                          inputId={`schema_${index}_create`}
                          name={`schema_${index}_action`}
                          value="create"
                          checked={options.schemas[index].action === 'create'}
                          onChange={() => {
                            const newSchemas = [...options.schemas];
                            newSchemas[index] = {
                              ...newSchemas[index],
                              action: 'create',
                              name: schema.exists ? schema.suggested_name : schema.name,
                            };
                            setOptions({ ...options, schemas: newSchemas });
                          }}
                        />
                        <label htmlFor={`schema_${index}_create`} className="ml-2" style={{ color: colors.textPrimary }}>
                          Neu anlegen
                        </label>
                      </div>

                      {options.schemas[index].action === 'create' && (
                        <div className="ml-6 flex items-center gap-2">
                          <span style={{ color: colors.textPrimary }}>Name:</span>
                          <InputText
                            value={options.schemas[index].name}
                            onChange={(e) => {
                              const newSchemas = [...options.schemas];
                              newSchemas[index] = { ...newSchemas[index], name: e.target.value };
                              setOptions({ ...options, schemas: newSchemas });
                            }}
                            className="w-48"
                          />
                        </div>
                      )}

                      {schema.exists && (
                        <div className="flex items-center">
                          <RadioButton
                            inputId={`schema_${index}_existing`}
                            name={`schema_${index}_action`}
                            value="use_existing"
                            checked={options.schemas[index].action === 'use_existing'}
                            onChange={() => {
                              const newSchemas = [...options.schemas];
                              newSchemas[index] = {
                                ...newSchemas[index],
                                action: 'use_existing',
                                existing_id: schema.existing_id ?? undefined,
                              };
                              setOptions({ ...options, schemas: newSchemas });
                            }}
                          />
                          <label htmlFor={`schema_${index}_existing`} className="ml-2" style={{ color: colors.textPrimary }}>
                            Existierende verwenden
                          </label>
                        </div>
                      )}

                      <div className="flex items-center">
                        <RadioButton
                          inputId={`schema_${index}_skip`}
                          name={`schema_${index}_action`}
                          value="skip"
                          checked={options.schemas[index].action === 'skip'}
                          onChange={() => {
                            const newSchemas = [...options.schemas];
                            newSchemas[index] = { ...newSchemas[index], action: 'skip' };
                            setOptions({ ...options, schemas: newSchemas });
                          }}
                        />
                        <label htmlFor={`schema_${index}_skip`} className="ml-2" style={{ color: colors.textPrimary }}>
                          Überspringen
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionTab>
          )}

          {/* Templates Configuration */}
          {analysis.templates.length > 0 && (
            <AccordionTab
              header={
                <div className="flex items-center gap-2">
                  <i className="pi pi-file" style={{ color: colors.textPrimary }} />
                  <span style={{ color: colors.textPrimary }}>Templates</span>
                  <Badge value={analysis.templates.length} />
                  {analysis.templates.some((t) => t.exists) && (
                    <Tag severity="warning" value="Konflikte" />
                  )}
                </div>
              }
              pt={{
                headerAction: { style: { backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary } },
                content: { style: { backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary } }
              }}
            >
              <div className="space-y-4" style={{ backgroundColor: colors.bgSecondary }}>
                {analysis.templates.map((template, index) => (
                  <div key={index} className="rounded-lg p-4" style={{ border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgTertiary }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-semibold" style={{ color: colors.textPrimary }}>{template.name}</span>
                        <span className="ml-2" style={{ color: colors.textMuted }}>
                          ({template.files_count} Dateien, {template.category || 'Allgemein'})
                        </span>
                      </div>
                      {template.exists && <Tag severity="warning" value="Existiert" />}
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center">
                        <RadioButton
                          inputId={`template_${index}_create`}
                          name={`template_${index}_action`}
                          value="create"
                          checked={options.templates[index].action === 'create'}
                          onChange={() => {
                            const newTemplates = [...options.templates];
                            newTemplates[index] = {
                              ...newTemplates[index],
                              action: 'create',
                              name: template.exists ? template.suggested_name : template.name,
                            };
                            setOptions({ ...options, templates: newTemplates });
                          }}
                        />
                        <label htmlFor={`template_${index}_create`} className="ml-2" style={{ color: colors.textPrimary }}>
                          Neu anlegen
                        </label>
                      </div>

                      {options.templates[index].action === 'create' && (
                        <div className="ml-6 flex items-center gap-2">
                          <span style={{ color: colors.textPrimary }}>Name:</span>
                          <InputText
                            value={options.templates[index].name}
                            onChange={(e) => {
                              const newTemplates = [...options.templates];
                              newTemplates[index] = { ...newTemplates[index], name: e.target.value };
                              setOptions({ ...options, templates: newTemplates });
                            }}
                            className="w-48"
                          />
                        </div>
                      )}

                      {template.exists && (
                        <div className="flex items-center">
                          <RadioButton
                            inputId={`template_${index}_existing`}
                            name={`template_${index}_action`}
                            value="use_existing"
                            checked={options.templates[index].action === 'use_existing'}
                            onChange={() => {
                              const newTemplates = [...options.templates];
                              newTemplates[index] = {
                                ...newTemplates[index],
                                action: 'use_existing',
                                existing_id: template.existing_id ?? undefined,
                              };
                              setOptions({ ...options, templates: newTemplates });
                            }}
                          />
                          <label htmlFor={`template_${index}_existing`} className="ml-2" style={{ color: colors.textPrimary }}>
                            Existierendes verwenden
                          </label>
                        </div>
                      )}

                      <div className="flex items-center">
                        <RadioButton
                          inputId={`template_${index}_skip`}
                          name={`template_${index}_action`}
                          value="skip"
                          checked={options.templates[index].action === 'skip'}
                          onChange={() => {
                            const newTemplates = [...options.templates];
                            newTemplates[index] = { ...newTemplates[index], action: 'skip' };
                            setOptions({ ...options, templates: newTemplates });
                          }}
                        />
                        <label htmlFor={`template_${index}_skip`} className="ml-2" style={{ color: colors.textPrimary }}>
                          Überspringen
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionTab>
          )}

          {/* FormSets Configuration */}
          {analysis.form_sets.length > 0 && (
            <AccordionTab
              header={
                <div className="flex items-center gap-2">
                  <i className="pi pi-window-maximize" style={{ color: colors.textPrimary }} />
                  <span style={{ color: colors.textPrimary }}>FormSets</span>
                  <Badge value={analysis.form_sets.length} />
                  {analysis.form_sets.some((f) => f.exists) && (
                    <Tag severity="warning" value="Konflikte" />
                  )}
                </div>
              }
              pt={{
                headerAction: { style: { backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary } },
                content: { style: { backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary } }
              }}
            >
              <div className="space-y-4" style={{ backgroundColor: colors.bgSecondary }}>
                {analysis.form_sets.map((formSet, index) => (
                  <div key={index} className="rounded-lg p-4" style={{ border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgTertiary }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-semibold" style={{ color: colors.textPrimary }}>{formSet.name}</span>
                        <span className="ml-2" style={{ color: colors.textMuted }}>
                          ({formSet.windows_count} Fenster)
                        </span>
                      </div>
                      {formSet.exists && <Tag severity="warning" value="Existiert" />}
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center">
                        <RadioButton
                          inputId={`formset_${index}_create`}
                          name={`formset_${index}_action`}
                          value="create"
                          checked={options.form_sets[index].action === 'create'}
                          onChange={() => {
                            const newFormSets = [...options.form_sets];
                            newFormSets[index] = {
                              ...newFormSets[index],
                              action: 'create',
                              name: formSet.exists ? formSet.suggested_name : formSet.name,
                            };
                            setOptions({ ...options, form_sets: newFormSets });
                          }}
                        />
                        <label htmlFor={`formset_${index}_create`} className="ml-2" style={{ color: colors.textPrimary }}>
                          Neu anlegen
                        </label>
                      </div>

                      {options.form_sets[index].action === 'create' && (
                        <div className="ml-6 flex items-center gap-2">
                          <span style={{ color: colors.textPrimary }}>Name:</span>
                          <InputText
                            value={options.form_sets[index].name}
                            onChange={(e) => {
                              const newFormSets = [...options.form_sets];
                              newFormSets[index] = { ...newFormSets[index], name: e.target.value };
                              setOptions({ ...options, form_sets: newFormSets });
                            }}
                            className="w-48"
                          />
                        </div>
                      )}

                      {formSet.exists && (
                        <div className="flex items-center">
                          <RadioButton
                            inputId={`formset_${index}_existing`}
                            name={`formset_${index}_action`}
                            value="use_existing"
                            checked={options.form_sets[index].action === 'use_existing'}
                            onChange={() => {
                              const newFormSets = [...options.form_sets];
                              newFormSets[index] = {
                                ...newFormSets[index],
                                action: 'use_existing',
                                existing_id: formSet.existing_id ?? undefined,
                              };
                              setOptions({ ...options, form_sets: newFormSets });
                            }}
                          />
                          <label htmlFor={`formset_${index}_existing`} className="ml-2" style={{ color: colors.textPrimary }}>
                            Existierendes verwenden
                          </label>
                        </div>
                      )}

                      <div className="flex items-center">
                        <RadioButton
                          inputId={`formset_${index}_skip`}
                          name={`formset_${index}_action`}
                          value="skip"
                          checked={options.form_sets[index].action === 'skip'}
                          onChange={() => {
                            const newFormSets = [...options.form_sets];
                            newFormSets[index] = { ...newFormSets[index], action: 'skip' };
                            setOptions({ ...options, form_sets: newFormSets });
                          }}
                        />
                        <label htmlFor={`formset_${index}_skip`} className="ml-2" style={{ color: colors.textPrimary }}>
                          Überspringen
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionTab>
          )}

          {/* Additional Options */}
          <AccordionTab
            header={
              <div className="flex items-center gap-2">
                <i className="pi pi-cog" style={{ color: colors.textPrimary }} />
                <span style={{ color: colors.textPrimary }}>Weitere Optionen</span>
              </div>
            }
            pt={{
              headerAction: { style: { backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary } },
              content: { style: { backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary } }
            }}
          >
            <div className="space-y-4" style={{ backgroundColor: colors.bgSecondary }}>
              <div className="flex items-center">
                <Checkbox
                  inputId="import_code_adjustments"
                  checked={options.import_code_adjustments}
                  onChange={(e) =>
                    setOptions({ ...options, import_code_adjustments: e.checked ?? false })
                  }
                />
                <label htmlFor="import_code_adjustments" className="ml-2" style={{ color: colors.textPrimary }}>
                  Code Adjustments importieren
                  <span className="ml-2" style={{ color: colors.textMuted }}>({analysis.counts.code_adjustments})</span>
                </label>
              </div>

              <div className="flex items-center">
                <Checkbox
                  inputId="import_attachments"
                  checked={options.import_attachments}
                  onChange={(e) =>
                    setOptions({ ...options, import_attachments: e.checked ?? false })
                  }
                />
                <label htmlFor="import_attachments" className="ml-2" style={{ color: colors.textPrimary }}>
                  Attachments importieren
                  <span className="ml-2" style={{ color: colors.textMuted }}>({analysis.counts.attachments})</span>
                </label>
              </div>

              <div className="flex items-center">
                <Checkbox
                  inputId="import_translations"
                  checked={options.import_translations}
                  onChange={(e) =>
                    setOptions({ ...options, import_translations: e.checked ?? false })
                  }
                />
                <label htmlFor="import_translations" className="ml-2" style={{ color: colors.textPrimary }}>
                  Übersetzungen importieren
                  <span className="ml-2" style={{ color: colors.textMuted }}>({analysis.counts.translations})</span>
                </label>
              </div>

              {analysis.counts.template_variable_values > 0 && (
                <Message
                  severity="info"
                  text={`${analysis.counts.template_variable_values} Template-Variablenwerte werden automatisch importiert`}
                />
              )}
            </div>
          </AccordionTab>
        </Accordion>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            label="Abbrechen"
            icon="pi pi-times"
            severity="secondary"
            onClick={handleCancel}
            disabled={loading}
          />
          <Button
            label="Importieren"
            icon="pi pi-download"
            onClick={handleImport}
            disabled={loading}
          />
        </div>
      </div>
    );
  };

  // Render importing step
  const renderImportingStep = () => (
    <Card className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
      <div className="text-center p-6">
        <ProgressSpinner style={{ width: '64px', height: '64px' }} />
        <h3 className="text-xl font-semibold mt-4 mb-2" style={{ color: colors.textPrimary }}>Import läuft...</h3>
        <p style={{ color: colors.textMuted }}>
          Bitte warten Sie, während das Projekt importiert wird.
        </p>
      </div>
    </Card>
  );

  // Render complete step
  const renderCompleteStep = () => {
    if (!importResult) return null;

    return (
      <Card className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
        <div className="text-center p-6">
          <i className="pi pi-check-circle text-6xl mb-4" style={{ color: colors.successText }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>Import erfolgreich!</h3>

          {importResult.project && (
            <p className="text-lg mb-4" style={{ color: colors.textPrimary }}>
              Projekt "<span className="font-semibold">{importResult.project.name}</span>" wurde
              erstellt.
            </p>
          )}

          {/* Import Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto mb-6">
            <div className="rounded-lg p-3" style={{ backgroundColor: colors.bgTertiary }}>
              <div className="text-2xl font-bold" style={{ color: colors.infoText }}>
                {importResult.imported.schemas}
              </div>
              <div className="text-sm" style={{ color: colors.textMuted }}>Datenbanken</div>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: colors.bgTertiary }}>
              <div className="text-2xl font-bold" style={{ color: colors.successText }}>
                {importResult.imported.templates}
              </div>
              <div className="text-sm" style={{ color: colors.textMuted }}>Templates</div>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: colors.bgTertiary }}>
              <div className="text-2xl font-bold" style={{ color: colors.accent }}>
                {importResult.imported.form_sets}
              </div>
              <div className="text-sm" style={{ color: colors.textMuted }}>FormSets</div>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: colors.bgTertiary }}>
              <div className="text-2xl font-bold" style={{ color: colors.warningText }}>
                {importResult.imported.code_adjustments}
              </div>
              <div className="text-sm" style={{ color: colors.textMuted }}>Code Adj.</div>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: colors.bgTertiary }}>
              <div className="text-2xl font-bold" style={{ color: colors.errorText }}>
                {importResult.imported.attachments}
              </div>
              <div className="text-sm" style={{ color: colors.textMuted }}>Anhänge</div>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: colors.bgTertiary }}>
              <div className="text-2xl font-bold" style={{ color: colors.infoText }}>
                {importResult.imported.translations}
              </div>
              <div className="text-sm" style={{ color: colors.textMuted }}>Übersetz.</div>
            </div>
          </div>

          {/* Warnings */}
          {importResult.warnings && importResult.warnings.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2" style={{ color: colors.warningText }}>Warnungen:</h4>
              <div className="text-left max-w-lg mx-auto">
                {importResult.warnings.map((warning: string, index: number) => (
                  <Message
                    key={index}
                    severity="warn"
                    text={warning}
                    className="mb-1 w-full"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {importResult.errors && importResult.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2" style={{ color: colors.errorText }}>Fehler:</h4>
              <div className="text-left max-w-lg mx-auto">
                {importResult.errors.map((error: string, index: number) => (
                  <Message key={index} severity="error" text={error} className="mb-1 w-full" />
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-3">
            <Button
              label="Neuer Import"
              icon="pi pi-plus"
              severity="secondary"
              onClick={handleCancel}
            />
            {importResult.project && (
              <Button
                label="Projekt öffnen"
                icon="pi pi-folder-open"
                onClick={handleOpenProject}
              />
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="h-full overflow-auto p-4" style={{ backgroundColor: colors.bgPrimary }}>
      <Toast ref={toast} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <i className="pi pi-download text-2xl" style={{ color: colors.accent }} />
        <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>Projekt importieren</h2>
      </div>

      {/* Steps */}
      {step === 'upload' && renderUploadStep()}
      {step === 'configure' && renderConfigureStep()}
      {step === 'importing' && renderImportingStep()}
      {step === 'complete' && renderCompleteStep()}
    </div>
  );
}
