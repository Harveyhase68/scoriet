import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import JoinCodeModal from '@/Components/Modals/JoinCodeModal';
import PlanModal from '@/Components/AuthModals/PlanModal';
import { useProject } from '@/contexts/ProjectContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

interface TabPanelProps {
  isActive: boolean;
}

interface PublicProject {
  id: number;
  name: string;
  description: string;
  owner: {
    id: number;
    name: string;
    username?: string;
  };
  is_public: boolean;
  teams_count: number;
  schemas_count: number;
  templates_count: number;
  can_join: boolean;
  created_at: string;
}

export default function PublicProjectsPanel({ isActive }: TabPanelProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();

  // Toast ref for notifications
  const toast = useRef<Toast>(null);

  const { loadProjects: loadGlobalProjects } = useProject();
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showJoinCodeModal, setShowJoinCodeModal] = useState(false);
  const [cloning, setCloning] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [projectToClone, setProjectToClone] = useState<PublicProject | null>(null);
  const [cloneForm, setCloneForm] = useState({
    name: '',
    description: '',
    is_public: false
  });
  const [cloneError, setCloneError] = useState<string>('');

  // Subscription/credits state
  const [currentUser, setCurrentUser] = useState<{ credits: number; user_type?: string } | null>(null);
  const [needsCredits, setNeedsCredits] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [_subscriptionInfo, setSubscriptionInfo] = useState<{
    owned_projects: number;
    max_allowed: number;
    needs_unlock: boolean;
  } | null>(null);

  useEffect(() => {
    if (isActive) {
      loadPublicProjects();
      loadCurrentUser();
    }
  }, [isActive]);

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUserId(userData.id);
        setCurrentUser(userData);
      }
    } catch {
      // Error loading current user
    }
  };

  // Check if user needs credits for cloning (free users with max projects)
  const checkSubscription = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      // Load user's projects to check subscription status
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.subscription_info) {
          setSubscriptionInfo(data.subscription_info);
          // Free users need credits if they're at their limit
          const isFreeUser = currentUser?.user_type === 'free' || !currentUser?.user_type;
          setNeedsCredits(isFreeUser && data.subscription_info.needs_unlock);
        }
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
    }
  }, [currentUser]);

  const loadPublicProjects = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError(t.applicationsmodal66);
        return;
      }

      const response = await fetch('/api/projects?public=1', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t.publicprojectspanel97);
      }

      const data = await response.json();
      setProjects(data.projects || []);

    } catch (error) {
      setError(error instanceof Error ? error.message : t.publicprojectspanel104);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const generateCloneName = (originalName: string) => {
    let baseName = `${originalName}_copy`;
    let counter = 1;

    // Check if base name exists in current projects
    while (projects.some(p => p.name.toLowerCase() === baseName.toLowerCase())) {
      counter++;
      baseName = `${originalName}_copy${counter}`;
    }

    return baseName;
  };

  const openCloneModal = async (project: PublicProject) => {
    const suggestedName = generateCloneName(project.name);
    setProjectToClone(project);
    setCloneForm({
      name: suggestedName,
      description: `Cloned from "${project.name}" by ${project.owner.name}`,
      is_public: false
    });
    setShowCloneModal(true);
    setCloneError('');

    // Check subscription status when opening modal
    await checkSubscription();
  };

  const handleCloneProject = async () => {
    if (!projectToClone) return;

    setCloning(projectToClone.id);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: cloneForm.name,
          description: cloneForm.description,
          original_project_id: projectToClone.id,
          creator_user_id: projectToClone.owner.id, // Credit to original creator
          is_clone: true,
          is_public: cloneForm.is_public,
        }),
      });

      if (response.ok) {
        await response.json(); // Consume response but don't use data
        setShowCloneModal(false);
        setProjectToClone(null);
        setCloneForm({ name: '', description: '', is_public: false });
        setCloneError('');

        // Refresh the projects list to show the new cloned project
        await loadPublicProjects();

        // Also refresh the global project dropdown
        await loadGlobalProjects();

        // Reload user to update credits
        await loadCurrentUser();

        // Dispatch event to notify other components (like navigation) about credit change
        if (needsCredits) {
          window.dispatchEvent(new CustomEvent('creditsChanged'));
        }

        alert(`Project "${cloneForm.name}" cloned successfully! You can find it in your Projects tab.`);
      } else {
        const errorData = await response.json();

        // Handle insufficient credits error
        if (errorData.error_code === 'INSUFFICIENT_CREDITS') {
          setCloneError(`Nicht genug Credits! Sie benötigen ${errorData.required_credits} Credits, haben aber nur ${errorData.current_credits}.`);
          setNeedsCredits(true);
        } else {
          setCloneError(errorData.message || t.publicprojectspanel183);
        }
      }
    } catch (error) {
      setCloneError(error instanceof Error ? error.message : t.publicprojectspanel183);
    } finally {
      setCloning(null);
    }
  };

  const handleCloneModalHide = () => {
    setShowCloneModal(false);
    setProjectToClone(null);
    setCloneForm({ name: '', description: '', is_public: false });
    setCloneError('');
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.owner.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: colors.bgPrimary }}>
        <Toast ref={toast} position="top-right" />
        <div className="text-center">
          <i className="pi pi-spinner pi-spin text-4xl mb-4" style={{ color: colors.accent }}></i>
          <p style={{ color: colors.textSecondary }}>Loading public projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <Toast ref={toast} position="top-right" />
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <i className="pi pi-globe text-2xl" style={{ color: colors.successText }}></i>
          <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>Public Projects</h1>
        </div>
        <div className="flex space-x-2">
          <Button
            icon="pi pi-sign-in"
            label={t.publicprojectspanel227}
            className="p-button-outlined"
            onClick={() => setShowJoinCodeModal(true)}
            disabled={loading}
          />
          <Button
            icon="pi pi-refresh"
            label={t.applicationsmodal313}
            className="p-button-outlined"
            onClick={loadPublicProjects}
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <Message severity="error" text={error} className="mb-4" />
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <i className="pi pi-search" style={{ color: colors.textMuted }}></i>
          <InputText
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.publicprojectspanel253}
            className="flex-1"
            disabled={loading}
            style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-8">
            <i className="pi pi-search text-6xl mb-4" style={{ color: colors.textMuted }}></i>
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.textPrimary }}>
              {searchTerm ? 'No matching projects' : t.publicprojectspanel266}
            </h3>
            <p className="mb-4" style={{ color: colors.textMuted }}>
              {searchTerm
                ? t.publicprojectspanel270
                : t.publicprojectspanel271
              }
            </p>
            {searchTerm && (
              <Button
                label={t.publicprojectspanel276}
                icon="pi pi-times"
                className="p-button-outlined"
                onClick={() => setSearchTerm('')}
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="h-fit hover:shadow-lg transition-shadow"
                style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary }}
                header={
                  <div className="p-4" style={{ borderBottom: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold truncate" style={{ color: colors.textPrimary }}>
                        {project.name}
                      </h3>
                      <Tag
                        value={t.databasemanagementpanel772}
                        severity="success"
                        icon="pi pi-globe"
                        className="ml-2"
                      />
                    </div>
                    <div className="flex items-center space-x-2 text-sm" style={{ color: colors.textSecondary }}>
                      <i className="pi pi-user"></i>
                      <span>{project.owner.name}</span>
                      {project.owner.username && (
                        <span style={{ color: colors.textMuted }}>@{project.owner.username}</span>
                      )}
                    </div>
                  </div>
                }
              >
                <div className="p-4 space-y-4" style={{ backgroundColor: colors.bgSecondary }}>
                  {/* Description */}
                  <div>
                    <p className="text-sm line-clamp-3 min-h-[3.5rem]" style={{ color: colors.textSecondary }}>
                      {project.description || t.publicprojectspanel316}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center space-x-1">
                      <i className="pi pi-users" style={{ color: colors.accent }}></i>
                      <span style={{ color: colors.textSecondary }}>{project.teams_count}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <i className="pi pi-database" style={{ color: '#a855f7' }}></i>
                      <span style={{ color: colors.textSecondary }}>{project.schemas_count || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <i className="pi pi-file" style={{ color: colors.successText }}></i>
                      <span style={{ color: colors.textSecondary }}>{project.templates_count || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <i className="pi pi-calendar" style={{ color: colors.textMuted }}></i>
                      <span style={{ color: colors.textMuted }}>{formatDate(project.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                    {currentUserId === project.owner.id ? (
                      <Button
                        label={t.publicprojectspanel338}
                        icon="pi pi-user"
                        className="w-full p-button-outlined"
                        disabled
                        tooltip={t.publicprojectspanel342}
                      />
                    ) : (
                      <Button
                        label={cloning === project.id ? "Cloning..." : t.publicprojectspanel346}
                        icon={cloning === project.id ? "pi pi-spinner pi-spin" : "pi pi-copy"}
                        className="w-full p-button-success"
                        onClick={() => openCloneModal(project)}
                        disabled={cloning === project.id}
                      />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold" style={{ color: colors.accent }}>{projects.length}</div>
            <div className="text-sm" style={{ color: colors.textMuted }}>Total Projects</div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: colors.successText }}>
              {projects.filter(p => p.can_join).length}
            </div>
            <div className="text-sm" style={{ color: colors.textMuted }}>Accepting Members</div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: '#a855f7' }}>
              {filteredProjects.length}
            </div>
            <div className="text-sm" style={{ color: colors.textMuted }}>Showing</div>
          </div>
        </div>
      </div>

      {/* Join Code Modal */}
      <JoinCodeModal
        visible={showJoinCodeModal}
        onHide={() => setShowJoinCodeModal(false)}
        onSuccess={() => {
          loadPublicProjects();
        }}
        onApplicationSent={(projectName, ownerName) => {
          toast.current?.show({
            severity: 'success',
            summary: t.joincodemodal117 || 'Bewerbung gesendet',
            detail: `${t.joincodemodal_toast_detail || 'Bitte warten Sie, bis'} ${ownerName} ${t.joincodemodal_toast_detail2 || 'die Bewerbung bearbeitet hat.'}`,
            life: 6000,
          });
        }}
      />

      {/* Clone Project Modal */}
      <Dialog
        header={`Clone Project - ${projectToClone?.name || ''}`}
        visible={showCloneModal}
        onHide={handleCloneModalHide}
        style={{ width: '500px' }}
        contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
        modal
        closable
        draggable={true}
        resizable={true}
        className="p-dialog-custom"
      >
        <div className="space-y-4">
          {cloneError && (
            <Message severity="error" text={cloneError} className="mb-4" />
          )}

          <div className="field">
            <label htmlFor="clone-name" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Project Name *
            </label>
            <InputText
              id="clone-name"
              value={cloneForm.name}
              onChange={(e) => setCloneForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t.publicprojectspanel418}
              className="w-full"
              disabled={cloning !== null}
              required
              style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
            />
          </div>

          <div className="field">
            <label htmlFor="clone-description" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Description
            </label>
            <InputTextarea
              id="clone-description"
              value={cloneForm.description}
              onChange={(e) => setCloneForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t.editprojectmodal260}
              className="w-full"
              rows={3}
              disabled={cloning !== null}
              style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
            />
          </div>

          <div className="field">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox
                id="clone-is-public"
                checked={cloneForm.is_public}
                onChange={(e) => setCloneForm(prev => ({ ...prev, is_public: e.checked || false }))}
                disabled={cloning !== null}
              />
              <label htmlFor="clone-is-public" className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                Public Project
              </label>
            </div>
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              Public projects are visible to all users and can be discovered in the project gallery.
              Private projects are only visible to you and your team members.
            </p>
          </div>

          {projectToClone && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
              <div className="text-sm">
                <div className="font-medium mb-1" style={{ color: colors.textSecondary }}>Original Project:</div>
                <div style={{ color: colors.textPrimary }}>{projectToClone.name}</div>
                <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                  by {projectToClone.owner.name}
                </div>
                <div className="flex gap-4 mt-2 text-xs">
                  <span style={{ color: colors.accent }}>
                    <i className="pi pi-database mr-1"></i>
                    {projectToClone.schemas_count || 0} Schemas
                  </span>
                  <span style={{ color: colors.successText }}>
                    <i className="pi pi-file mr-1"></i>
                    {projectToClone.templates_count || 0} Templates
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Credit warning for free users at limit */}
          {needsCredits && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningBorder}` }}>
              <div className="text-sm">
                <div className="font-medium mb-1" style={{ color: colors.warningText }}>
                  <i className="pi pi-exclamation-triangle mr-2"></i>
                  50 Credits erforderlich
                </div>
                <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                  Sie haben Ihr kostenloses Projekt-Limit erreicht. Das Clonen dieses Projekts kostet 50 Credits (1 Jahr gültig).
                </p>
                <div className="flex justify-between items-center text-xs">
                  <span style={{ color: colors.textMuted }}>Ihre Credits: <strong style={{ color: colors.textPrimary }}>{currentUser?.credits || 0}</strong></span>
                  {(currentUser?.credits || 0) < 50 && (
                    <Button
                      label="Credits kaufen"
                      icon="pi pi-shopping-cart"
                      className="p-button-sm p-button-warning"
                      onClick={() => setShowPlanModal(true)}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={handleCloneModalHide}
              className="p-button-text"
              disabled={cloning !== null}
            />
            <Button
              label={
                cloning !== null
                  ? "Cloning..."
                  : needsCredits
                    ? `Clone (50 Credits)`
                    : t.publicprojectspanel346
              }
              icon={cloning !== null ? "pi pi-spinner pi-spin" : "pi pi-copy"}
              onClick={handleCloneProject}
              disabled={cloning !== null || !cloneForm.name.trim() || (needsCredits && (currentUser?.credits || 0) < 50)}
            />
          </div>
        </div>
      </Dialog>

      {/* Plan/Credits Modal */}
      <PlanModal
        visible={showPlanModal}
        onHide={() => {
          setShowPlanModal(false);
          // Refresh user data after potential credit purchase
          loadCurrentUser();
          checkSubscription();
        }}
        initialTab={1}
      />
    </div>
  );
}