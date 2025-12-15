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
  members_count?: number;
  templates_count?: number;
  databases_count?: number;
  applications_count?: number;
  is_owner?: boolean;
  can_join?: boolean;
  default_language?: string;
  enabled_languages?: string[];
  // Diagram Settings
  diagram_max_tables_per_row?: number;
  diagram_table_width?: number;
  diagram_table_height?: number;
  diagram_horizontal_spacing?: number;
  diagram_vertical_spacing?: number;
  // Form Designer Settings
  form_designer_snap_to_grid?: boolean;
  form_designer_grid_size?: number;
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

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  loadProjects: () => Promise<void>;
  loading: boolean;
  clearSavedProject: () => void;
  setPreferredProject: (project: Project | null) => void;
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
      
      const response = await fetch('/api/user/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        const projectsArray = data.projects || [];

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
      }
    } catch {
      // Error loading projects
    } finally {
      setLoading(false);
    }
  }, [preferredProject]);

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