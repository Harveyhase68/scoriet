// resources/js/contexts/ProjectContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { getEcho, resetEcho } from '@/lib/echo';
import { apiClient } from '@/lib/api';

interface ProjectSubscription {
  id: number;
  expires_at: string | null;
  is_expired: boolean;
  is_soft_locked: boolean;
  days_remaining: number | null;
}

interface Project {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  is_active: boolean;
  is_public?: boolean;
  join_code?: string;
  allow_join_requests?: boolean;
  created_at: string;
  updated_at: string;
  teams_count?: number;
  members_count?: number;
  templates_count?: number;
  databases_count?: number;
  applications_count?: number;
  is_owner?: boolean;
  can_join?: boolean;
  default_language?: string;
  target_language?: string;
  enabled_languages?: string[];
  // Subscription / Lock status
  is_soft_locked?: boolean;
  subscription?: ProjectSubscription | null;
  // Diagram Settings
  diagram_max_tables_per_row?: number;
  diagram_table_width?: number;
  diagram_table_height?: number;
  diagram_horizontal_spacing?: number;
  diagram_vertical_spacing?: number;
  // Form Designer Settings
  form_designer_snap_to_grid?: boolean;
  form_designer_grid_size?: number;
  // Report Designer Settings
  report_designer_snap_to_grid?: boolean;
  report_designer_grid_unit?: string;
  report_designer_grid_size?: number;
  // Database Connection Settings
  database_type?: string;
  database_server?: string;
  database_port?: string;
  database_name?: string;
  database_username?: string;
  database_password?: string;
  owner: {
    id: number;
    name: string;
    email: string;
    username?: string;
  };
}

interface EditLockState {
  isLocked: boolean;
  lockedByUserId: number | null;
  lockedByUserName: string | null;
  isLockedByMe: boolean;
}

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  loadProjects: () => Promise<void>;
  loading: boolean;
  clearSavedProject: () => void;
  setPreferredProject: (project: Project | null) => void;
  // Real-time edit locking
  editLock: EditLockState | null;
  acquireLock: (projectId: number) => Promise<boolean>;
  releaseLock: (projectId: number) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [preferredProject, setPreferredProject] = useState<Project | null>(null);
  const [editLock, setEditLock] = useState<EditLockState | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subscribedProjectIdRef = useRef<number | null>(null);

  // Load saved project from localStorage on mount
  useEffect(() => {
    const savedProjectId = localStorage.getItem('scoriet_selected_project_id');

    if (savedProjectId) {
      // We'll set the project after loading projects
    }
  }, []);

  // Save selected project to localStorage whenever it changes
  // But don't clear it immediately when it becomes null (e.g., during page refresh)
  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('scoriet_selected_project_id', selectedProject.id.toString());
    }
    // Don't automatically clear localStorage when selectedProject is null
    // This could happen during page refresh before projects are loaded
  }, [selectedProject]);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);

      // Skip silently if there's no token at all - we're not logged in.
      if (!localStorage.getItem('access_token') && !sessionStorage.getItem('access_token')) {
        setProjects([]);
        setSelectedProject(null);
        return;
      }

      // apiClient.request() transparently handles token refresh on 401 and
      // throws on a final auth failure (after refresh attempt). We use
      // apiClient.get() directly here instead of getUserProjects() because
      // the latter swallows all errors into an empty array, which would
      // hide auth failures from us.
      const response = await apiClient.get('/user/projects');
      const projectsArray = response.projects || [];

      // Filter out projects without an ID
      const validProjects = projectsArray.filter((p: Project) => p.id);
      setProjects(validProjects);

      // Try to restore saved project, use preferred project, or auto-select first
      const savedProjectId = localStorage.getItem('scoriet_selected_project_id');
      let projectToSelect = null;

      // Priority 1: Use preferred project (e.g., newly created project)
      if (preferredProject) {
        const foundPreferred = projectsArray.find((p: Project) => p.id === preferredProject.id);
        if (foundPreferred) {
          projectToSelect = foundPreferred;
          setPreferredProject(null); // Clear after using
        }
      }

      // Priority 2: Try to restore saved project
      if (!projectToSelect && savedProjectId) {
        const savedProject = projectsArray.find((p: Project) => p.id.toString() === savedProjectId);
        if (savedProject) {
          projectToSelect = savedProject;
        } else {
          localStorage.removeItem('scoriet_selected_project_id');
        }
      }

      // Priority 3: If no saved project or saved project not found, select first available
      if (!projectToSelect && projectsArray.length > 0) {
        projectToSelect = projectsArray[0];
      }

      // Always set the project if we have one to select (either restored or first)
      if (projectToSelect) {
        setSelectedProject(projectToSelect);
        localStorage.setItem('scoriet_selected_project_id', projectToSelect.id.toString());
      }
    } catch (err: any) {
      // apiClient threw: either auth failure after refresh failed (handled
      // internally - tokens cleared, sessionForciblyEnded dispatched), or a
      // transient network/server issue. In both cases clear local state.
      if (err?.response?.status === 401 || err?.message?.includes('Authentication')) {
        setProjects([]);
        setSelectedProject(null);
      }
      // For other errors keep the state as-is so a transient hiccup doesn't
      // wipe the UI.
    } finally {
      setLoading(false);
    }
  }, [preferredProject]);

  // Utility function to clear saved project
  const clearSavedProject = () => {
    localStorage.removeItem('scoriet_selected_project_id');
  };

  // ── Real-time WebSocket subscriptions ──────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (!selectedProject || !token) {
      // Leave previous channel if project deselected
      if (subscribedProjectIdRef.current !== null) {
        try { getEcho().leave(`project.${subscribedProjectIdRef.current}`); } catch { /* ignore */ }
        subscribedProjectIdRef.current = null;
      }
      setEditLock(null);
      return;
    }

    const projectId = selectedProject.id;

    // Don't re-subscribe if already on the same channel
    if (subscribedProjectIdRef.current === projectId) {
      return;
    }

    // Leave previous channel
    if (subscribedProjectIdRef.current !== null) {
      try { getEcho().leave(`project.${subscribedProjectIdRef.current}`); } catch { /* ignore */ }
    }

    subscribedProjectIdRef.current = projectId;
    const currentUserId = Number(localStorage.getItem('user_id'));

    try {
      const channel = getEcho().private(`project.${projectId}`);

      // Listen for project updates from other users
      channel.listen('.ProjectUpdated', (data: { project_id: number; updated_by: number }) => {
        if (Number(data.updated_by) !== currentUserId) {
          loadProjects();
          // Notify UI components (e.g., ProjectPanel) about the external update
          window.dispatchEvent(new CustomEvent('projectUpdatedByOther', {
            detail: { projectId: data.project_id, updatedBy: data.updated_by }
          }));
        }
      });

      // Listen for lock events
      channel.listen('.ProjectLocked', (data: { project_id: number; locked_by_user_id: number; locked_by_user_name: string }) => {
        setEditLock({
          isLocked: true,
          lockedByUserId: data.locked_by_user_id,
          lockedByUserName: data.locked_by_user_name,
          isLockedByMe: Number(data.locked_by_user_id) === currentUserId,
        });
      });

      channel.listen('.ProjectUnlocked', () => {
        setEditLock(null);
      });
    } catch {
      // Echo not available (e.g., Reverb not running) - graceful degradation
    }

    return () => {
      if (subscribedProjectIdRef.current === projectId) {
        try { getEcho().leave(`project.${projectId}`); } catch { /* ignore */ }
        subscribedProjectIdRef.current = null;
      }
    };
  }, [selectedProject?.id, loadProjects]);

  // ── Lock acquire / release ─────────────────────────────────────────────

  const acquireLock = useCallback(async (projectId: number): Promise<boolean> => {
    try {
      let data: any;
      try {
        data = await apiClient.post(`/projects/${projectId}/lock`);
      } catch (err: any) {
        if (err?.response?.status === 409) {
          // Already locked by someone else
          const errData = err.response.data || {};
          setEditLock({
            isLocked: true,
            lockedByUserId: errData.locked_by_user_id,
            lockedByUserName: errData.locked_by_user_name,
            isLockedByMe: false,
          });
          return false;
        }
        return false;
      }

      const currentUserId = Number(localStorage.getItem('user_id'));
      setEditLock({
        isLocked: true,
        lockedByUserId: data.locked_by_user_id,
        lockedByUserName: data.locked_by_user_name,
        isLockedByMe: Number(data.locked_by_user_id) === currentUserId,
      });

      // Start heartbeat to keep lock alive (every 5 minutes)
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = setInterval(async () => {
        try {
          await apiClient.post(`/projects/${projectId}/heartbeat`);
        } catch { /* heartbeat failed silently */ }
      }, 5 * 60 * 1000);

      return true;
    } catch {
      return false;
    }
  }, []);

  const releaseLock = useCallback(async (projectId: number): Promise<void> => {
    // Stop heartbeat
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    try {
      await apiClient.post(`/projects/${projectId}/unlock`);
      setEditLock(null);
    } catch { /* unlock failed silently */ }
  }, []);

  // Release lock on page unload (best-effort via sendBeacon)
  useEffect(() => {
    const handleUnload = () => {
      if (editLock?.isLockedByMe && selectedProject) {
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (token) {
          // sendBeacon doesn't support custom headers, so we use a small fetch with keepalive
          fetch(`/api/projects/${selectedProject.id}/unlock`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            keepalive: true,
          }).catch(() => { /* best effort */ });
        }
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [editLock, selectedProject]);

  // ── Auth change handling ───────────────────────────────────────────────

  // Listen for authentication changes (login/logout events)
  const handleAuthChange = useCallback(() => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (token) {
      // User logged in - reload projects and reset Echo with new token
      resetEcho();
      loadProjects();
    } else {
      // User logged out - clear projects and disconnect Echo
      resetEcho();
      setProjects([]);
      setSelectedProject(null);
      setEditLock(null);
    }
  }, [loadProjects]);

  // Load projects on mount and when auth status changes
  useEffect(() => {
    loadProjects();

    // Listen for storage events (triggered by login/logout)
    window.addEventListener('storage', handleAuthChange);

    // Listen for custom auth events
    window.addEventListener('auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [loadProjects, handleAuthChange]);

  const value: ProjectContextType = {
    projects,
    selectedProject,
    setSelectedProject,
    loadProjects,
    loading,
    clearSavedProject,
    setPreferredProject,
    editLock,
    acquireLock,
    releaseLock,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
