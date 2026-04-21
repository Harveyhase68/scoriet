import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import {
  FolderIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CircleStackIcon,
  GlobeAltIcon,
  LinkIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';
import LanguageSelector from '@/Components/LanguageSelector';
import { useTranslation, SupportedLanguage, getStoredLanguage, setStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

interface ProjectData {
  id: number;
  name: string;
  description: string | null;
  owner: {
    name: string;
    username: string;
  };
  created_at: string;
  updated_at: string;
  caption: string | null;
  default_language: string | null;
  enabled_languages: string[] | null;
  project_url: string | null;
  stats: {
    teams_count: number;
    templates_count: number;
    schemas_count: number;
  };
  teams: Array<{ id: number; name: string; description: string | null }>;
  templates: Array<{ id: number; name: string; description: string | null; is_system_template: boolean }>;
  schemas: Array<{ id: number; name: string; description: string | null }>;
  attachments: Array<{
    id: number;
    original_filename: string;
    mime_type: string;
    category_label: string;
    formatted_size: string;
    is_pinned: boolean;
  }>;
}

interface Props {
  project: ProjectData;
  username: string;
  projectname: string;
}

export default function PublicProjectPage({ project, username: _username, projectname: _projectname }: Props) {
  // Translation hooks
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    return getStoredLanguage() as SupportedLanguage || 'de';
  });
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    setStoredLanguage(lang);
  };

  const handleGoToApp = () => {
    router.visit('/app');
  };

  const handleGoToLanding = () => {
    router.visit('/');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(currentLanguage, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getLanguageName = (code: string) => {
    const languages: Record<string, string> = {
      'de': t.publicprojectpage97,
      'en': t.publicprojectpage98,
      'fr': t.publicprojectpage99,
      'es': t.publicprojectpage100,
      'it': t.publicprojectpage101,
    };
    return languages[code] || code.toUpperCase();
  };

  return (
    <>
      <Head title={`${project.name} - ${project.owner.name}`} />

      <div className="min-h-screen" style={{ backgroundColor: colors.bgPrimary }}>
        {/* Header */}
        <header className="backdrop-blur-sm sticky top-0 z-50" style={{ backgroundColor: `${colors.bgSecondary}cc`, borderBottom: `1px solid ${colors.borderPrimary}` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center cursor-pointer" onClick={handleGoToLanding}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <span className="text-xl font-bold" style={{ color: colors.textPrimary }}>Scoriet</span>
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-4">
                <LanguageSelector
                  currentLanguage={currentLanguage}
                  onLanguageChange={handleLanguageChange}
                />
                <Button
                  label={t.goToApp}
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  onClick={handleGoToApp}
                  className="p-button-sm"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Project Header */}
          <div className="mb-8">
            <div className="flex items-start gap-6">
              {/* Project Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <FolderIcon className="w-10 h-10 text-white" />
              </div>

              {/* Project Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>{project.caption || project.name}</h1>
                <p className="mb-3" style={{ color: colors.textMuted }}>
                  {t.publicProjectBy} <span className="font-medium" style={{ color: colors.accent }}>@{project.owner.username}</span>
                </p>
                {project.description && (
                  <p className="text-lg" style={{ color: colors.textSecondary }}>{project.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="border" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.accent}20` }}>
                  <UserGroupIcon className="w-6 h-6" style={{ color: colors.accent }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{project.stats.teams_count}</p>
                  <p style={{ color: colors.textMuted }}>{t.teams}</p>
                </div>
              </div>
            </Card>

            <Card className="border" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.successText}20` }}>
                  <DocumentTextIcon className="w-6 h-6" style={{ color: colors.successText }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{project.stats.templates_count}</p>
                  <p style={{ color: colors.textMuted }}>{t.templates}</p>
                </div>
              </div>
            </Card>

            <Card className="border" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#a855f720' }}>
                  <CircleStackIcon className="w-6 h-6" style={{ color: '#a855f7' }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{project.stats.schemas_count}</p>
                  <p style={{ color: colors.textMuted }}>{t.databases}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Project Settings */}
              <Card className="border" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary }} title={
                <div className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                  <GlobeAltIcon className="w-5 h-5" />
                  <span>{t.projectSettings}</span>
                </div>
              }>
                <div className="space-y-4">
                  {/* Languages */}
                  {project.enabled_languages && project.enabled_languages.length > 0 && (
                    <div>
                      <p className="text-sm mb-2" style={{ color: colors.textMuted }}>{t.languages}</p>
                      <div className="flex flex-wrap gap-2">
                        {project.enabled_languages.map(lang => (
                          <Tag
                            key={lang}
                            value={getLanguageName(lang)}
                            severity={lang === project.default_language ? 'info' : 'secondary'}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Project URL */}
                  {project.project_url && (
                    <>
                      <Divider className="my-2" />
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" style={{ color: colors.textMuted }} />
                        <a
                          href={project.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                          style={{ color: colors.accent }}
                        >
                          {project.project_url}
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Teams */}
              {project.teams.length > 0 && (
                <Card className="border" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary }} title={
                  <div className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                    <UserGroupIcon className="w-5 h-5" />
                    <span>{t.teams}</span>
                    <Tag value={project.teams.length.toString()} severity="info" />
                  </div>
                }>
                  <div className="space-y-3">
                    {project.teams.map(team => (
                      <div key={team.id} className="p-3 rounded-lg" style={{ backgroundColor: colors.bgTertiary }}>
                        <p className="font-medium" style={{ color: colors.textPrimary }}>{team.name}</p>
                        {team.description && (
                          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>{team.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Templates */}
              {project.templates.length > 0 && (
                <Card className="border" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary }} title={
                  <div className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                    <DocumentTextIcon className="w-5 h-5" />
                    <span>{t.templates}</span>
                    <Tag value={project.templates.length.toString()} severity="success" />
                  </div>
                }>
                  <div className="space-y-3">
                    {project.templates.map(template => (
                      <div key={template.id} className="p-3 rounded-lg" style={{ backgroundColor: colors.bgTertiary }}>
                        <div className="flex items-center gap-2">
                          <p className="font-medium" style={{ color: colors.textPrimary }}>{template.name}</p>
                          {template.is_system_template && (
                            <Tag value={t.publicprojectpage326} severity="warning" className="text-xs" />
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>{template.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Databases/Schemas */}
              {project.schemas.length > 0 && (
                <Card className="border" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary }} title={
                  <div className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                    <CircleStackIcon className="w-5 h-5" />
                    <span>{t.databases}</span>
                    <Tag value={project.schemas.length.toString()} severity="secondary" />
                  </div>
                }>
                  <div className="space-y-3">
                    {project.schemas.map(schema => (
                      <div key={schema.id} className="p-3 rounded-lg" style={{ backgroundColor: colors.bgTertiary }}>
                        <p className="font-medium" style={{ color: colors.textPrimary }}>{schema.name}</p>
                        {schema.description && (
                          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>{schema.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Attachments */}
              {project.attachments && project.attachments.length > 0 && (
                <Card className="border" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary }} title={
                  <div className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                    <PaperClipIcon className="w-5 h-5" />
                    <span>{t.projectpanelAttachments}</span>
                    <Tag value={project.attachments.length.toString()} severity="warning" />
                  </div>
                }>
                  <div className="space-y-3">
                    {project.attachments.map(attachment => (
                      <div key={attachment.id} className="p-3 rounded-lg" style={{ backgroundColor: colors.bgTertiary }}>
                        <div className="flex items-center gap-3">
                          <i className={`text-lg ${
                            attachment.mime_type?.startsWith('image/') ? 'pi pi-image text-blue-400' :
                            attachment.mime_type === 'application/pdf' ? 'pi pi-file-pdf text-red-400' :
                            attachment.mime_type?.includes('word') ? 'pi pi-file-word text-blue-400' :
                            attachment.mime_type?.includes('excel') || attachment.mime_type?.includes('spreadsheet') ? 'pi pi-file-excel text-green-400' :
                            'pi pi-file'
                          }`} style={!(attachment.mime_type?.startsWith('image/') || attachment.mime_type === 'application/pdf' || attachment.mime_type?.includes('word') || attachment.mime_type?.includes('excel') || attachment.mime_type?.includes('spreadsheet')) ? { color: colors.textMuted } : undefined}></i>
                          <div className="flex-1">
                            <p className="font-medium flex items-center gap-2" style={{ color: colors.textPrimary }}>
                              {attachment.original_filename}
                              {attachment.is_pinned && (
                                <i className="pi pi-bookmark-fill text-yellow-400 text-sm"></i>
                              )}
                            </p>
                            <p className="text-sm" style={{ color: colors.textMuted }}>
                              {attachment.category_label} • {attachment.formatted_size}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Meta Info */}
              <Card className="border" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary }}>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: colors.textMuted }}>{t.created}:</span>
                    <span style={{ color: colors.textPrimary }}>{formatDate(project.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: colors.textMuted }}>{t.lastUpdated}:</span>
                    <span style={{ color: colors.textPrimary }}>{formatDate(project.updated_at)}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-16 py-8" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm" style={{ color: colors.textMuted }}>
                {t.publicProjectPoweredBy}{' '}
                <a href="/" style={{ color: colors.accent }}>Scoriet</a>
                {' '}- {t.publicProjectTagline}
              </div>
              <Button
                label={t.goToApp}
                icon="pi pi-external-link"
                iconPos="right"
                onClick={handleGoToApp}
                className="p-button-outlined p-button-sm"
              />
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
