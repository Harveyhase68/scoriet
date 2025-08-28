// resources/js/contexts/ProjectContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Project {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner: {
    id: number;
    name: string;
    email: string;
  };
}

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  loadProjects: () => Promise<void>;
  loading: boolean;
  clearSavedProject: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

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

  const loadProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) return;

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
        
        // Try to restore saved project, otherwise auto-select first
        const savedProjectId = localStorage.getItem('scoriet_selected_project_id');
        let projectToSelect = null;
        
        if (savedProjectId) {
          // Find the saved project in the loaded projects
          const savedProject = projectsArray.find((p: Project) => p.id.toString() === savedProjectId);
          if (savedProject) {
            projectToSelect = savedProject;
          } else {
            localStorage.removeItem('scoriet_selected_project_id');
          }
        }
        
        // If no saved project or saved project not found, select first available
        if (!projectToSelect && projectsArray.length > 0) {
          projectToSelect = projectsArray[0];
        }
        
        // Always set the project if we have one to select (either restored or first)
        if (projectToSelect) {
          setSelectedProject(projectToSelect);
        }
      }
    } catch (err) {
      console.error('ProjectContext - Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  // Utility function to clear saved project
  const clearSavedProject = () => {
    localStorage.removeItem('scoriet_selected_project_id');
  };

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const value: ProjectContextType = {
    projects,
    selectedProject,
    setSelectedProject,
    loadProjects,
    loading,
    clearSavedProject,
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