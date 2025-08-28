// resources/js/Components/Panels/PanelT3.tsx - Templates Panel
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { TabContentProps } from '@/types';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { useProject } from '@/contexts/ProjectContext';

const TabContent: React.FC<TabContentProps> = ({ children, style = {}, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);
  const setFocus = () => ref.current?.focus();

  return (
    <div 
      {...rest} 
      ref={ref}
      tabIndex={-1} 
      style={{ flex: 1, padding: '5px 10px', ...style }} 
      onMouseDownCapture={setFocus} 
      onTouchStartCapture={setFocus}
      className="bg-gray-800 text-gray-100"
    >
      {children}
    </div>
  );
};

// Template Interface
interface Template {
  id: number;
  name: string;
  description: string;
  category: string;
  language: string;
  is_active: boolean;
  created_at: string;
  owner?: {
    id: number;
    name: string;
  };
}


// Templates are now loaded from API

export default function PanelT3() {
  const { selectedProject } = useProject();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [assignedTemplates, setAssignedTemplates] = useState<Template[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<Template[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [assigningTemplates, setAssigningTemplates] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Load templates on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadAllTemplates(); // Load templates first
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // When templates are loaded and selectedProject changes, reload project templates
  useEffect(() => {
    if (templates.length > 0 && selectedProject) {
      loadProjectTemplates(selectedProject.id);
    } else if (templates.length > 0 && !selectedProject) {
      // If templates loaded but no project selected, show all as available
      setAvailableTemplates(templates);
      setAssignedTemplates([]);
      setSelectedTemplateIds([]); // Clear selections too
    }
  }, [templates, selectedProject, loadProjectTemplates]);


  const loadAllTemplates = async () => {
    try {
      setError('');
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load templates');
      }

      const data = await response.json();
      
      // Extract templates from the response object
      const templatesArray = data.templates || [];
      
      setTemplates(templatesArray);
      // Don't set availableTemplates here - will be set after loading project templates
      // setAvailableTemplates(templatesArray); // Initially all templates are available

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading templates');
    }
  };

  // Load templates assigned to a specific project
  const loadProjectTemplates = useCallback(async (projectId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        return;
      }

      const response = await fetch(`/api/schema-versions/${projectId}/templates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Extract project_templates array from response
        const projectTemplatesArray = data.project_templates || [];
        
        // Extract assigned template IDs
        const assignedTemplateIds = projectTemplatesArray.map((pt: any) => pt.template_id || pt.id);
        
        // Split templates into assigned and available
        const assigned = templates.filter(t => assignedTemplateIds.includes(t.id));
        const available = templates.filter(t => !assignedTemplateIds.includes(t.id));
        
        // Update state
        setAssignedTemplates(assigned);
        setAvailableTemplates(available);
        
        // Clear any selected template IDs when switching projects
        setSelectedTemplateIds([]);
      }
    } catch (err) {
      console.error('Error loading project templates:', err);
    }
  }, [templates]);

  // Handle template assignment
  const handleAssignTemplates = async () => {
    if (!selectedProject || selectedTemplateIds.length === 0) return;

    setAssigningTemplates(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Call the existing project-template assignment API
      const response = await fetch(`/api/schema-versions/${selectedProject.id}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          template_ids: selectedTemplateIds
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign templates');
      }

      // Move assigned templates from available to assigned
      const newlyAssigned = availableTemplates.filter(t => selectedTemplateIds.includes(t.id));
      setAssignedTemplates(prev => [...prev, ...newlyAssigned]);
      setAvailableTemplates(prev => prev.filter(t => !selectedTemplateIds.includes(t.id)));
      
      setSelectedTemplateIds([]);
      setSuccess(`${selectedTemplateIds.length} templates assigned to project successfully`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error assigning templates');
    } finally {
      setAssigningTemplates(false);
    }
  };

  // Handle template removal
  const handleRemoveTemplate = async (templateId: number) => {
    if (!selectedProject) return;

    try {
      setError('');
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Call API to remove template from project
      const response = await fetch(`/api/schema-versions/${selectedProject.id}/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      await response.json();

      // Move template from assigned to available
      const removedTemplate = assignedTemplates.find(t => t.id === templateId);
      if (removedTemplate) {
        setAssignedTemplates(prev => prev.filter(t => t.id !== templateId));
        setAvailableTemplates(prev => [...prev, removedTemplate]);
        setSuccess(`Template "${removedTemplate.name}" removed from project successfully`);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removing template');
    }
  };

  // Filter templates based on search and category - with safe array check
  const filteredAvailableTemplates = React.useMemo(() => {
    if (!Array.isArray(availableTemplates)) {
      return [];
    }
    
    return availableTemplates.filter(template => {
      const matchesSearch = !searchQuery || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = filterCategory === 'All' || template.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [availableTemplates, searchQuery, filterCategory]);

  const categories = React.useMemo(() => {
    return [
      { label: 'All Categories', value: 'All' },
      { label: 'Web', value: 'Web' },
      { label: 'Mobile', value: 'Mobile' },
      { label: 'API', value: 'API' },
      { label: 'Desktop', value: 'Desktop' },
      { label: 'Database', value: 'Database' }
    ];
  }, []);

  return (
    <TabContent style={{}}>
      <div className="h-full flex flex-col bg-gray-800 text-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <i className="pi pi-spinner pi-spin text-4xl text-blue-500 mb-4"></i>
              <p className="text-gray-300">Loading templates...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <Card title={selectedProject ? `Templates Assignment - ${selectedProject.name}` : "Templates Assignment"} className="m-4 mb-2">
          <div className="flex flex-col gap-4">
            {/* Project Info */}
            {selectedProject && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                <i className="pi pi-briefcase"></i>
                <span>Working on: <strong>{selectedProject.name}</strong> by {selectedProject.owner.name}</span>
              </div>
            )}
            
            {!selectedProject && (
              <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                <i className="pi pi-exclamation-triangle"></i>
                <span>Please select a project from the navigation to manage templates</span>
              </div>
            )}

            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <InputText
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full"
                />
              </div>
              <Dropdown
                value={filterCategory}
                options={categories || []}
                onChange={(e) => {
                  setFilterCategory(e.value);
                }}
                optionLabel="label"
                optionValue="value"
                placeholder="Filter by category"
                className="w-48"
              />
            </div>

            {/* Status Messages */}
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-500 text-sm">{success}</div>}
          </div>
        </Card>

        {/* Templates Table */}
        <div className="flex-1 mx-4 mb-4">
          <Card className="h-full">
            <div className="h-full flex flex-col">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <i className="pi pi-spinner pi-spin text-2xl text-blue-500"></i>
                </div>
              ) : (
                <>
                  <DataTable
                    key={`templates-table-${selectedProject?.id || 'no-project'}-${selectedTemplateIds.join('-')}-${assignedTemplates.length}-${filteredAvailableTemplates.length}`}
                    value={[...(assignedTemplates || []), ...filteredAvailableTemplates]}
                    className="p-datatable-sm"
                    emptyMessage="No templates found"
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 20]}
                    scrollable
                    scrollHeight="400px"
                    header={
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">
                          Templates ({(assignedTemplates || []).length + filteredAvailableTemplates.length})
                        </span>
                        <div className="text-sm text-gray-500">
                          {selectedTemplateIds.length > 0 && `${selectedTemplateIds.length} selected`}
                        </div>
                      </div>
                    }
                  >
                    <Column 
                      headerStyle={{ width: '3rem' }}
                      header={() => {
                        const availableTemplateIds = filteredAvailableTemplates.map(template => template.id);
                        const allSelected = availableTemplateIds.length > 0 && 
                          availableTemplateIds.every(id => selectedTemplateIds.includes(id));
                        const someSelected = availableTemplateIds.some(id => selectedTemplateIds.includes(id));
                        
                        return (
                          <Checkbox
                            checked={allSelected}
                            indeterminate={someSelected && !allSelected ? true : undefined}
                            onChange={(e) => {
                              if (e.checked) {
                                setSelectedTemplateIds(availableTemplateIds);
                              } else {
                                setSelectedTemplateIds([]);
                              }
                            }}
                          />
                        );
                      }}
                      body={(template) => {
                        const isAssigned = (assignedTemplates || []).some(t => t.id === template.id);
                        
                        if (isAssigned) {
                          return (
                            <Button
                              icon="pi pi-times"
                              className="p-button-rounded p-button-text p-button-sm p-button-danger"
                              tooltip="Remove from project"
                              onClick={() => handleRemoveTemplate(template.id)}
                            />
                          );
                        } else {
                          const isChecked = selectedTemplateIds.includes(template.id);
                          return (
                            <Checkbox
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.checked) {
                                  setSelectedTemplateIds(prev => [...prev, template.id]);
                                } else {
                                  setSelectedTemplateIds(prev => prev.filter(id => id !== template.id));
                                }
                              }}
                            />
                          );
                        }
                      }}
                    />
                    
                    <Column field="name" header="Template Name" sortable />
                    <Column field="description" header="Description" />
                    <Column 
                      field="category" 
                      header="Category" 
                      body={(template) => (
                        <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
                          {template.category}
                        </span>
                      )}
                    />
                    <Column field="language" header="Language" />
                    <Column 
                      field="is_active" 
                      header="Status"
                      body={(template) => (
                        <span className={`px-2 py-1 rounded text-xs ${
                          template.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                        }`}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    />
                    <Column 
                      field="created_at" 
                      header="Created"
                      body={(template) => new Date(template.created_at).toLocaleDateString('de-DE')}
                    />
                  </DataTable>

                  {/* Action Buttons */}
                  {selectedTemplateIds.length > 0 && (
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-4">
                      <div className="text-sm text-gray-500">
                        {selectedTemplateIds.length} template{selectedTemplateIds.length !== 1 ? 's' : ''} selected
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          label="Clear Selection"
                          icon="pi pi-times"
                          onClick={() => setSelectedTemplateIds([])}
                          className="p-button-text"
                        />
                        <Button
                          label={`Assign Templates (${selectedTemplateIds.length})`}
                          icon="pi pi-check"
                          onClick={handleAssignTemplates}
                          disabled={!selectedProject || assigningTemplates}
                          loading={assigningTemplates}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
          </>
        )}
      </div>
    </TabContent>
  );
}