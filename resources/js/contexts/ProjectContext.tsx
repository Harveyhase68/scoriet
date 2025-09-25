// resources/js/contexts/ProjectContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

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
  templates_count?: number;
  databases_count?: number;
  applications_count?: number;
  is_owner?: boolean;
  can_join?: boolean;
  owner: {
    id: number;
    name: string;
    email: string;
    username?: string;
  };
}

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  loadProjects: () => Promise<void>;
  loading: boolean;
  clearSavedProject: () => void;
  setPreferredProject: (project: Project) => void;
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
    console.log('🌍 ProjectContext: loadProjects called from:', new Error().stack?.split('\n')[2]);
    try {
      setLoading(true);
      // Check both localStorage and sessionStorage for the token
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        // No auth token found, skipping project load
        setProjects([]);
        setSelectedProject(null);
        return;
      }
      
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        const projectsArray = data.projects || [];
        setProjects(projectsArray);
        
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
        // But don't override if this is right after a project update
        const currentTime = Date.now();
        const isRecentUpdate = currentTime - ((window as any).lastProjectUpdate || 0) < 2000; // Within 2 seconds

        console.log('🌍 ProjectContext: Project selection decision:', {
          projectToSelect: projectToSelect ? { id: projectToSelect.id, name: projectToSelect.name } : null,
          isRecentUpdate,
          currentTime,
          lastProjectUpdate: (window as any).lastProjectUpdate,
          timeDiff: currentTime - ((window as any).lastProjectUpdate || 0),
          currentSelectedProject: selectedProject ? { id: selectedProject.id, name: selectedProject.name } : null
        });

        if (projectToSelect && !isRecentUpdate) {
          console.log('🌍 ProjectContext: Setting selected project to:', projectToSelect.name);
          setSelectedProject(projectToSelect);
        } else if (isRecentUpdate) {
          console.log('🌍 ProjectContext: Skipping project selection due to recent update');
        }
      }
    } catch (err) {
      // Error loading projects
    } finally {
      setLoading(false);
    }
  }, []);

  // Utility function to clear saved project
  const clearSavedProject = () => {
    localStorage.removeItem('scoriet_selected_project_id');
  };

  // Listen for authentication changes (login/logout events)
  const handleAuthChange = useCallback(() => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (token) {
      // User logged in - reload projects
      loadProjects();
    } else {
      // User logged out - clear projects
      setProjects([]);
      setSelectedProject(null);
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