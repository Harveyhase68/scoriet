// resources/js/Components/Panels/PanelT3.tsx - Templates Panel
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { TabContentProps } from '@/types';
import { apiClient } from '@/lib/api';

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
  category: 'Web' | 'Mobile' | 'API' | 'Desktop' | 'Database';
  language: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  fileCount: number;
}

// Templates are now loaded from API

export default function PanelT3() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());
  const [assignedTemplates, setAssignedTemplates] = useState<Set<number>>(new Set());
  const [currentSchemaVersionId, setCurrentSchemaVersionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [draggedTemplate, setDraggedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  const getCurrentSchemaVersion = useCallback(async () => {
    try {
      // Try to get the first available schema version as current
      const versions = await apiClient.getAllSchemaVersions();
      if (versions.length > 0) {
        setCurrentSchemaVersionId(versions[0].id);
        await loadProjectTemplates(versions[0].id);
      }
    } catch {
      // Error loading schema versions
    }
  }, []);

  const loadProjectTemplates = async (schemaVersionId: number) => {
    try {
      const projectTemplates = await apiClient.getProjectTemplates(schemaVersionId);
      const assignedIds = new Set<number>(projectTemplates.map((pt: any) => pt.template_id));
      setAssignedTemplates(assignedIds);
      
      // Pre-select assigned templates
      setSelectedTemplates(assignedIds);
    } catch {
      // Error loading project templates
    }
  };

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getAllTemplates({
        category: filterCategory,
        search: searchQuery,
        active_only: false,
      });
      
      // Convert API data to our interface format
      const formattedTemplates = data.map((template: any) => ({
        id: template.id,
        name: template.name,
        description: template.description || '',
        category: template.category,
        language: template.language,
        tags: template.tags || [],
        isActive: template.is_active,
        createdAt: template.created_at,
        fileCount: template.file_count || 0,
      }));
      
      setTemplates(formattedTemplates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [filterCategory, searchQuery]);

  // Load templates and get current schema version on mount
  useEffect(() => {
    loadTemplates();
    getCurrentSchemaVersion();
  }, [getCurrentSchemaVersion, loadTemplates]);

  // Filter templates (now client-side since API filtering might be different)
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || (
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    const matchesCategory = filterCategory === 'All' || template.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleTemplateToggle = (templateId: number) => {
    const newSelected = new Set(selectedTemplates);
    if (newSelected.has(templateId)) {
      newSelected.delete(templateId);
    } else {
      newSelected.add(templateId);
    }
    setSelectedTemplates(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTemplates.size === filteredTemplates.length) {
      setSelectedTemplates(new Set());
    } else {
      setSelectedTemplates(new Set(filteredTemplates.map(t => t.id)));
    }
  };

  const handleDragStart = (e: React.DragEvent, template: Template) => {
    setDraggedTemplate(template);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', template.name);
  };

  const handleDragEnd = () => {
    setDraggedTemplate(null);
  };

  const categories = ['All', 'Web', 'Mobile', 'API', 'Desktop', 'Database'];

  const handleAssignToProject = async () => {
    if (!currentSchemaVersionId) {
      setError('No schema version selected');
      return;
    }
    
    
    try {
      setLoading(true);
      await apiClient.assignTemplatesToProject(
        currentSchemaVersionId, 
        Array.from(selectedTemplates)
      );
      
      
      // Update assigned templates
      setAssignedTemplates(selectedTemplates);
      
      // Show success message
      setError(null);
    } catch (err) {
      // Assignment error
      setError(err instanceof Error ? err.message : 'Failed to assign templates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TabContent style={{}}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gray-900 border-b border-gray-600 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-purple-400">📋 Templates Manager - NEW VERSION</h3>
            <p className="text-sm text-gray-400">
              {filteredTemplates.length} Templates | {selectedTemplates.size} Selected | {assignedTemplates.size} Assigned
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
            >
              {selectedTemplates.size === filteredTemplates.length ? '📋 Deselect All' : '☑️ Select All'}
            </button>
            <button
              onClick={handleAssignToProject}
              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
              disabled={selectedTemplates.size === 0 || loading}
            >
              ✅ Apply to Project ({selectedTemplates.size})
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="p-4 bg-gray-800 border-b border-gray-600 flex-shrink-0">
          <div className="flex gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates, tags, or descriptions..."
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            {/* Category Filter */}
            <div className="min-w-[120px]">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredTemplates.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold mb-2">No Templates Found</h3>
                <p className="text-sm">
                  {searchQuery || filterCategory !== 'All' 
                    ? 'Try adjusting your search or filter criteria' 
                    : 'No templates available yet'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, template)}
                  onDragEnd={handleDragEnd}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedTemplates.has(template.id)
                      ? 'border-purple-400 bg-purple-900/20'
                      : assignedTemplates.has(template.id)
                      ? 'border-blue-400 bg-blue-900/20'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  } ${draggedTemplate?.id === template.id ? 'opacity-50' : ''}`}
                  onClick={() => handleTemplateToggle(template.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedTemplates.has(template.id)}
                          onChange={() => handleTemplateToggle(template.id)}
                          className="w-4 h-4 text-purple-600 bg-gray-600 border-gray-500 rounded focus:ring-purple-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <h4 className="font-semibold text-white">{template.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          template.isActive 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-600 text-gray-300'
                        }`}>
                          {template.isActive ? '✅ Active' : '⏸️ Inactive'}
                        </span>
                        {assignedTemplates.has(template.id) && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-600 text-white">
                            🔗 Assigned
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-3">{template.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          📁 {template.category}
                        </span>
                        <span className="flex items-center gap-1">
                          💾 {template.language}
                        </span>
                        <span className="flex items-center gap-1">
                          📄 {template.fileCount} files
                        </span>
                        <span className="flex items-center gap-1">
                          📅 {new Date(template.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="ml-4 flex items-center text-gray-500">
                      <span className="text-xl cursor-move">⋮⋮</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {selectedTemplates.size > 0 && (
          <div className="p-4 bg-gray-900 border-t border-gray-600 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                {selectedTemplates.size} template{selectedTemplates.size !== 1 ? 's' : ''} selected
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedTemplates(new Set())}
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm transition-colors"
                >
                  Clear Selection
                </button>
                <button
                  onClick={handleAssignToProject}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  💾 Save Template Assignment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TabContent>
  );
}