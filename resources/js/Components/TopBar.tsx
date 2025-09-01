// resources/js/Components/TopBar.tsx
import React from 'react';
import { Dropdown } from 'primereact/dropdown';
import { useProject } from '@/contexts/ProjectContext';

export default function TopBar() {
  const { projects, selectedProject, setSelectedProject, loading } = useProject();

  return (
    <div className="h-12 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4">
      {/* Left: Logo and Brand */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <img 
            src="/images/logos/scoriet-logo.png" 
            alt="Scoriet" 
            className="h-8 w-auto"
            style={{ maxHeight: '32px', width: 'auto' }}
          />
          <div className="text-xs text-gray-500">Enterprise Code Generator</div>
        </div>
      </div>

      {/* Right: Project Selector and other controls */}
      <div className="flex items-center space-x-4">
        {/* Project Selector */}
        <div className="flex items-center space-x-2">
          <i className="pi pi-briefcase text-gray-400 text-sm"></i>
          <Dropdown
            value={selectedProject}
            options={projects || []}
            onChange={(e) => setSelectedProject(e.value)}
            optionLabel="name"
            optionValue={null}
            placeholder="Select Project"
            className="w-48 custom-dropdown"
            disabled={loading || !projects || projects.length === 0}
            filter
            emptyMessage="No projects found"
          />
          {selectedProject && (
            <span className="text-xs text-gray-400">
              by {selectedProject.owner.name}
            </span>
          )}
        </div>

        {/* Future: Additional controls can go here */}
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <i className="pi pi-clock"></i>
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}