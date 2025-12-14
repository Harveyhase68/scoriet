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
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import LanguageSelector from '@/Components/LanguageSelector';
import { useTranslation, SupportedLanguage, getStoredLanguage, setStoredLanguage } from '@/i18n';

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
  default_language: string | null;
  enabled_languages: string[] | null;
  decimal_separator: string | null;
  thousands_separator: string | null;
  date_format: string | null;
  time_format: string | null;
  currency_symbol: string | null;
  timezone: string | null;
  project_url: string | null;
  stats: {
    teams_count: number;
    templates_count: number;
    schemas_count: number;
  };
  teams: Array<{ id: number; name: string; description: string | null }>;
  templates: Array<{ id: number; name: string; description: string | null; is_system_template: boolean }>;
  schemas: Array<{ id: number; name: string; description: string | null }>;
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
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLanguage === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getLanguageName = (code: string) => {
    const languages: Record<string, string> = {
      'de': 'Deutsch',
      'en': 'English',
      'fr': 'Français',
      'es': 'Español',
      'it': 'Italiano',
    };
    return languages[code] || code.toUpperCase();
  };

  return (
    <>
      <Head title={`${project.name} - ${project.owner.name}`} />

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Header */}
        <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center cursor-pointer" onClick={handleGoToLanding}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <span className="text-xl font-bold text-white">Scoriet</span>
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-4">
                <LanguageSelector
                  currentLanguage={currentLanguage}
                  onLanguageChange={handleLanguageChange}
                />
                <Button
                  label={t.goToApp || 'Go to App'}
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
                <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
                <p className="text-gray-400 mb-3">
                  {t.publicProjectBy || 'by'} <span className="text-blue-400 font-medium">@{project.owner.username}</span>
                </p>
                {project.description && (
                  <p className="text-gray-300 text-lg">{project.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gray-800/50 border border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <UserGroupIcon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{project.stats.teams_count}</p>
                  <p className="text-gray-400">{t.teams || 'Teams'}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-gray-800/50 border border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <DocumentTextIcon className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{project.stats.templates_count}</p>
                  <p className="text-gray-400">{t.templates || 'Templates'}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-gray-800/50 border border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <CircleStackIcon className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{project.stats.schemas_count}</p>
                  <p className="text-gray-400">{t.databases || 'Databases'}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Project Settings */}
              <Card className="bg-gray-800/50 border border-gray-700" title={
                <div className="flex items-center gap-2 text-white">
                  <GlobeAltIcon className="w-5 h-5" />
                  <span>{t.projectSettings || 'Project Settings'}</span>
                </div>
              }>
                <div className="space-y-4">
                  {/* Languages */}
                  {project.enabled_languages && project.enabled_languages.length > 0 && (
                    <div>
                      <p className="text-gray-400 text-sm mb-2">{t.languages || 'Languages'}</p>
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

                  <Divider className="my-2" />

                  {/* Localization */}
                  <div className="grid grid-cols-2 gap-4">
                    {project.date_format && (
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400 text-sm">{t.dateFormat || 'Date'}:</span>
                        <span className="text-white text-sm">{project.date_format}</span>
                      </div>
                    )}
                    {project.time_format && (
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400 text-sm">{t.timeFormat || 'Time'}:</span>
                        <span className="text-white text-sm">{project.time_format}</span>
                      </div>
                    )}
                    {project.currency_symbol && (
                      <div className="flex items-center gap-2">
                        <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400 text-sm">{t.currency || 'Currency'}:</span>
                        <span className="text-white text-sm">{project.currency_symbol}</span>
                      </div>
                    )}
                    {project.timezone && (
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400 text-sm">{t.timezone || 'Timezone'}:</span>
                        <span className="text-white text-sm">{project.timezone}</span>
                      </div>
                    )}
                  </div>

                  {/* Project URL */}
                  {project.project_url && (
                    <>
                      <Divider className="my-2" />
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-gray-500" />
                        <a
                          href={project.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
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
                <Card className="bg-gray-800/50 border border-gray-700" title={
                  <div className="flex items-center gap-2 text-white">
                    <UserGroupIcon className="w-5 h-5" />
                    <span>{t.teams || 'Teams'}</span>
                    <Tag value={project.teams.length.toString()} severity="info" />
                  </div>
                }>
                  <div className="space-y-3">
                    {project.teams.map(team => (
                      <div key={team.id} className="p-3 bg-gray-700/50 rounded-lg">
                        <p className="text-white font-medium">{team.name}</p>
                        {team.description && (
                          <p className="text-gray-400 text-sm mt-1">{team.description}</p>
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
                <Card className="bg-gray-800/50 border border-gray-700" title={
                  <div className="flex items-center gap-2 text-white">
                    <DocumentTextIcon className="w-5 h-5" />
                    <span>{t.templates || 'Templates'}</span>
                    <Tag value={project.templates.length.toString()} severity="success" />
                  </div>
                }>
                  <div className="space-y-3">
                    {project.templates.map(template => (
                      <div key={template.id} className="p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{template.name}</p>
                          {template.is_system_template && (
                            <Tag value="System" severity="warning" className="text-xs" />
                          )}
                        </div>
                        {template.description && (
                          <p className="text-gray-400 text-sm mt-1">{template.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Databases/Schemas */}
              {project.schemas.length > 0 && (
                <Card className="bg-gray-800/50 border border-gray-700" title={
                  <div className="flex items-center gap-2 text-white">
                    <CircleStackIcon className="w-5 h-5" />
                    <span>{t.databases || 'Databases'}</span>
                    <Tag value={project.schemas.length.toString()} severity="help" />
                  </div>
                }>
                  <div className="space-y-3">
                    {project.schemas.map(schema => (
                      <div key={schema.id} className="p-3 bg-gray-700/50 rounded-lg">
                        <p className="text-white font-medium">{schema.name}</p>
                        {schema.description && (
                          <p className="text-gray-400 text-sm mt-1">{schema.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Meta Info */}
              <Card className="bg-gray-800/50 border border-gray-700">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t.created || 'Created'}:</span>
                    <span className="text-white">{formatDate(project.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t.lastUpdated || 'Last updated'}:</span>
                    <span className="text-white">{formatDate(project.updated_at)}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-16 py-8 border-t border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-gray-400 text-sm">
                {t.publicProjectPoweredBy || 'Powered by'}{' '}
                <a href="/" className="text-blue-400 hover:text-blue-300">Scoriet</a>
                {' '}- {t.publicProjectTagline || 'Enterprise Code Generator'}
              </div>
              <Button
                label={t.goToApp || 'Go to App'}
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
