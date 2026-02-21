// resources/js/Components/Panels/PanelT1.tsx - Navigation Panel with Projects and Teams (Optimized)
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { TabContentProps, NavigationPanelProps } from '@/types';
import { apiClient } from '@/lib/api';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

const TabContent: React.FC<TabContentProps> = ({ children, style = {}, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);
  const setFocus = () => ref.current?.focus();

  return (
    <div
      {...rest}
      ref={ref}
      tabIndex={-1}
      style={{
        flex: 1,
        padding: '5px 10px',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: 'var(--theme-bg-secondary)',
        color: 'var(--theme-text-primary)',
        ...style
      }}
      onMouseDownCapture={setFocus}
      onTouchStartCapture={setFocus}
      className="h-screen"
    >
      {children}
    </div>
  );
};

// Tree Node Interface for Projects, Teams, Templates, Schemas, Tables, and Generated Files
interface TreeNode {
  id: string;
  name: string;
  type: 'project' | 'team' | 'member' | 'template' | 'databases-container' | 'schema' | 'table' |
        'generated-files-container' | 'template-group' | 'generated-file' | 'directory' |
        'standalone-teams-container' | 'standalone-templates-container' | 'standalone-databases-container' |
        'standalone-team' | 'standalone-template' | 'standalone-database';
  projectId?: number;
  projectName?: string;
  teamId?: number;
  templateId?: number;
  schemaId?: number;
  tableId?: number;
  tableName?: string;
  fileId?: number;
  languageId?: number;
  languageCode?: string;
  path?: string;
  fileType?: string;
  children?: TreeNode[];
  expanded?: boolean;
}

// Generate tree data from projects, teams, and team members (optimized version)
const generateProjectTreeData = async (t: any): Promise<TreeNode[]> => {
  try {
    // Fetch projects with their teams in a single query
    const projects = await apiClient.getProjectsWithTeams();

    const treeNodes: TreeNode[] = [];

    for (const project of projects) {
      if (!project.id) {
        continue;
      }
      const projectNode: TreeNode = {
        id: `project-${project.id}`,
        name: project.name,
        type: 'project',
        projectId: project.id,
        expanded: true, // Expand projects by default to show teams
        children: []
      };

      // Teams are already loaded with the project
      const teams = project.teams || [];

      if (teams.length > 0) {
        for (const team of teams) {
          const teamNode: TreeNode = {
            id: `team-${team.id}-project-${project.id}`, // Unique ID for each team-project combination
            name: team.name,
            type: 'team',
            teamId: team.id,
            projectId: project.id,
            expanded: true, // Expand teams by default to show members
            children: []
          };

          // Fetch members for this team (still individual calls, but much fewer)
          if (!team.id) {
            continue;
          }
          const members = await apiClient.getTeamMembers(team.id);

          if (members.length > 0) {
            teamNode.children = members.map((member: any) => {
              return {
                id: `member-${member.user_id}-team-${team.id}-project-${project.id}`, // Unique ID for each member-team-project combination
                name: member.user?.name || member.name || t.panelt1104,
                type: 'member',
                teamId: team.id,
                projectId: project.id,
                expanded: false,
                children: []
              };
            });
          }

          projectNode.children!.push(teamNode);
        }
      }

      // Load templates for this project
      const templateUsages = await apiClient.getProjectTemplateUsages(project.id);

      if (templateUsages.length > 0) {
        for (const usage of templateUsages) {
          // Only add templates that have valid template data (not deleted)
          if (usage.template && usage.template.id) {
            const templateNode: TreeNode = {
              id: `template-${usage.template.id}-project-${project.id}`,
              name: usage.template.name,
              type: 'template',
              templateId: usage.template.id,
              projectId: project.id,
              projectName: project.name, // Store project name for tab title
              expanded: false,
              children: []
            };

            projectNode.children!.push(templateNode);
          }
        }
      }

      // Load schemas (databases) for this project
      const schemas = await apiClient.getProjectSchemas(project.id);

      // ALWAYS create a "Databases" container node, even if no schemas exist yet
      // This allows users to open Database Management and assign databases to the project
      const databasesContainerNode: TreeNode = {
        id: `databases-${project.id}`,
        name: t.panelt1143,
        type: 'databases-container',
        projectId: project.id,
        projectName: project.name,
        expanded: false, // Collapsed by default
        children: []
      };

      // Add schemas only if they exist
      if (schemas.length > 0) {
        for (const schema of schemas) {
          if (schema && schema.id) {
            const schemaNode: TreeNode = {
              id: `schema-${schema.id}-project-${project.id}`,
              name: schema.name || `Schema ${schema.id}`,
              type: 'schema',
              schemaId: schema.id,
              projectId: project.id,
              projectName: project.name, // Store project name for tab title
              expanded: false, // Collapsed by default
              children: []
            };

            // Load tables for this schema (from latest version)
            try {
              const versions = await apiClient.getSchemaVersions(schema.id);
              if (versions && versions.length > 0) {
                // Get latest version (highest version_number)
                const latestVersion = versions.reduce((max, version) =>
                  version.version_number > max.version_number ? version : max
                , versions[0]);

                const tables = await apiClient.getVersionTables(latestVersion.id);

                if (tables && tables.length > 0) {
                  for (const table of tables) {
                    if (table && table.id) {
                      const tableNode: TreeNode = {
                        id: `table-${table.id}-schema-${schema.id}-project-${project.id}`,
                        name: table.table_name || `Table ${table.id}`,
                        type: 'table',
                        tableId: table.id,
                        tableName: table.table_name,
                        schemaId: schema.id,
                        projectId: project.id,
                        projectName: project.name,
                        expanded: false,
                        children: []
                      };

                      schemaNode.children!.push(tableNode);
                    }
                  }
                }
              }
            } catch {
              // Schema might not exist or have no versions - silently continue
            }

            databasesContainerNode.children!.push(schemaNode);
          }
        }
      }

      // ALWAYS add the databases container to the project (even if empty)
      projectNode.children!.push(databasesContainerNode);

      // Load generation tree for this project
      const generationTreeData = await apiClient.getProjectGenerationTree(project.id);

      if (generationTreeData && generationTreeData.tree_data && generationTreeData.tree_data.length > 0) {
        // Create "File Preview" container node
        const generatedFilesContainerNode: TreeNode = {
          id: `generated-files-${project.id}`,
          name: t.panelt1219,
          type: 'generated-files-container',
          projectId: project.id,
          projectName: project.name,
          expanded: false, // Collapsed by default
          children: []
        };

        // Convert the tree_data to TreeNode format
        const convertGenerationNode = (genNode: any): TreeNode => {
          const treeNode: TreeNode = {
            id: genNode.id,
            name: genNode.name,
            type: genNode.type as any,
            projectId: project.id,
            projectName: project.name,
            expanded: genNode.type === 'directory' ? true : false, // Auto-expand directories
            children: []
          };

          // Add additional properties based on type
          if (genNode.type === 'template-group') {
            treeNode.templateId = genNode.templateId;
          } else if (genNode.type === 'generated-file') {
            treeNode.path = genNode.path;
            treeNode.templateId = genNode.templateId;
            treeNode.fileId = genNode.fileId;
            treeNode.tableId = genNode.tableId;
            treeNode.tableName = genNode.tableName;
            treeNode.languageId = genNode.languageId;
            treeNode.languageCode = genNode.languageCode;
            treeNode.fileType = genNode.fileType;
          } else if (genNode.type === 'directory') {
            treeNode.path = genNode.path;
          }

          // Recursively convert children
          if (genNode.children && genNode.children.length > 0) {
            treeNode.children = genNode.children.map(convertGenerationNode);
          }

          return treeNode;
        };

        // Add all templates/directories/files from the generation tree
        generatedFilesContainerNode.children = generationTreeData.tree_data.map(convertGenerationNode);

        projectNode.children!.push(generatedFilesContainerNode);
      }

      treeNodes.push(projectNode);
    }

    // ========== Add User's Own Items (regardless of project links) ==========
    // Show all items owned by the user for easy access

    // 1. User's Teams (all teams the user owns)
    const allTeams = await apiClient.getAllUserTeams();

    if (allTeams.length > 0) {
      const teamsContainer: TreeNode = {
        id: 'my-teams',
        name: t.panelt1MyTeams || t.panelt1284,
        type: 'standalone-teams-container',
        expanded: false,
        children: allTeams.map((team: any) => ({
          id: `my-team-${team.id}`,
          name: team.name,
          type: 'standalone-team' as const,
          teamId: team.id,
          expanded: false,
          children: []
        }))
      };
      treeNodes.push(teamsContainer);
    }

    // 2. User's Templates (all templates the user created)
    const allTemplates = await apiClient.getMyTemplates();

    if (allTemplates.length > 0) {
      const templatesContainer: TreeNode = {
        id: 'my-templates',
        name: t.panelt1MyTemplates || t.panelt1305,
        type: 'standalone-templates-container',
        expanded: false,
        children: allTemplates.map((template: any) => ({
          id: `my-template-${template.id}`,
          name: template.name,
          type: 'standalone-template' as const,
          templateId: template.id,
          expanded: false,
          children: []
        }))
      };
      treeNodes.push(templatesContainer);
    }

    // 3. User's Databases (all schemas the user owns)
    const allSchemas = await apiClient.getAllUserSchemas();

    if (allSchemas.length > 0) {
      const databasesContainer: TreeNode = {
        id: 'my-databases',
        name: t.panelt1MyDatabases || t.panelt1326,
        type: 'standalone-databases-container',
        expanded: false,
        children: allSchemas.map((schema: any) => ({
          id: `my-database-${schema.id}`,
          name: schema.name || `Schema ${schema.id}`,
          type: 'standalone-database' as const,
          schemaId: schema.id,
          expanded: false,
          children: []
        }))
      };
      treeNodes.push(databasesContainer);
    }

    return treeNodes;
  } catch (error) {
    // Log the error for debugging
    console.error(t.panelt1344, error);
    // Return a fallback structure for debugging
    return [
      {
        id: 'error-project',
        name: t.panelt1281,
        type: 'project' as const,
        expanded: true,
        children: [
          {
            id: 'error-team',
            name: t.panelt1287,
            type: 'team' as const,
            expanded: true,
            children: [
              {
                id: 'error-member',
                name: t.panelt1293,
                type: 'member' as const,
                expanded: false,
                children: []
              }
            ]
          }
        ]
      }
    ];
  }
};

// Tree Node Component
const TreeNodeComponent: React.FC<{
  node: TreeNode;
  level: number;
  onToggle: (nodeId: string) => void;
  onSelect: (node: TreeNode) => void;
  onOpenPanel: (node: TreeNode) => void;
  selectedId?: string;
}> = ({ node, level, onToggle, onSelect, onOpenPanel, selectedId }) => {
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  
  const getIcon = () => {
    switch (node.type) {
      case 'project':
        return '🏗️';
      case 'team':
      case 'standalone-team':
        return '👥';
      case 'member':
        return '👤';
      case 'template':
      case 'standalone-template':
        return '📄';
      case 'databases-container':
        return '📁';
      case 'schema':
      case 'standalone-database':
        return '💾';
      case 'table':
        return '📊';
      case 'generated-files-container':
        return '📦';
      case 'template-group':
        return '📋';
      case 'directory':
        return '📂';
      case 'generated-file':
        return '📝';
      case 'standalone-teams-container':
        return '👥';
      case 'standalone-templates-container':
        return '📋';
      case 'standalone-databases-container':
        return '💾';
      default:
        return '📁';
    }
  };

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 cursor-pointer nav-hover-btn rounded text-sm ${
          isSelected ? 'tree-node-selected' : 'tree-node-default'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px`, userSelect: 'none' }}
        onClick={() => onSelect(node)}
        onDoubleClick={() => onOpenPanel(node)}
      >
        {hasChildren && (
          <span
            className="mr-1 cursor-pointer select-none w-4 text-center"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
          >
            {node.expanded ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && <span className="w-4 mr-1"></span>}
        <span className="mr-2">{getIcon()}</span>
        <span className="truncate" style={{ userSelect: 'none' }}>{node.name}</span>
      </div>
      
      {node.expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              onToggle={onToggle}
              onSelect={onSelect}
              onOpenPanel={onOpenPanel}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main Panel Component
export default function PanelT1({ onOpenPanel }: NavigationPanelProps) {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Language state
  const [currentLanguage] = useState<SupportedLanguage>(() => getStoredLanguage());
  const { t, isLoading: translationsLoading } = useTranslation(currentLanguage);

  // Function to refresh only the File Preview for a specific project
  const refreshFilePreview = useCallback(async (projectId: number) => {
    try {
      const generationTreeData = await apiClient.getProjectGenerationTree(projectId);
      
      // Update function to replace only the File Preview node
      const updateFilePreviewInTree = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map(node => {
          if (node.id === `project-${projectId}`) {
            // Find and remove the existing File Preview node
            const updatedChildren = (node.children || []).filter(
              child => child.type !== 'generated-files-container'
            );
            
            // Add new File Preview node if data exists
            if (generationTreeData && generationTreeData.tree_data && generationTreeData.tree_data.length > 0) {
              const generatedFilesContainerNode: TreeNode = {
                id: `generated-files-${projectId}`,
                name: t.panelt1219,
                type: 'generated-files-container',
                projectId: projectId,
                projectName: node.projectName,
                expanded: false, // Keep current expanded state
                children: []
              };

              // Convert the tree_data to TreeNode format
              const convertGenerationNode = (genNode: any): TreeNode => {
                const treeNode: TreeNode = {
                  id: genNode.id,
                  name: genNode.name,
                  type: genNode.type as any,
                  projectId: projectId,
                  projectName: node.projectName,
                  expanded: genNode.type === 'directory' ? true : false,
                  children: []
                };

                // Add additional properties based on type
                if (genNode.type === 'template-group') {
                  treeNode.templateId = genNode.templateId;
                } else if (genNode.type === 'generated-file') {
                  treeNode.path = genNode.path;
                  treeNode.templateId = genNode.templateId;
                  treeNode.fileId = genNode.fileId;
                  treeNode.tableId = genNode.tableId;
                  treeNode.tableName = genNode.tableName;
                  treeNode.languageId = genNode.languageId;
                  treeNode.languageCode = genNode.languageCode;
                  treeNode.fileType = genNode.fileType;
                } else if (genNode.type === 'directory') {
                  treeNode.path = genNode.path;
                }

                // Recursively convert children
                if (genNode.children && genNode.children.length > 0) {
                  treeNode.children = genNode.children.map(convertGenerationNode);
                }

                return treeNode;
              };

              // Add all templates/directories/files from the generation tree
              generatedFilesContainerNode.children = generationTreeData.tree_data.map(convertGenerationNode);
              
              // Add the new File Preview node to children
              updatedChildren.push(generatedFilesContainerNode);
            }
            
            return { ...node, children: updatedChildren };
          }
          
          // Recursively update children
          if (node.children) {
            return { ...node, children: updateFilePreviewInTree(node.children) };
          }
          
          return node;
        });
      };

      setTreeData(updateFilePreviewInTree(treeData));
    } catch (error) {
      console.error(`Error refreshing File Preview for project ${projectId}:`, error);
    }
  }, [treeData]);

  // Load project data on component mount
  useEffect(() => {
    // Wait for translations to load before fetching project data
    if (translationsLoading) {
      return;
    }

    const loadProjectData = async () => {
      setLoading(true);
      try {
        const data = await generateProjectTreeData(t);
        setTreeData(data);
      } catch {
        // Error loading project data
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();

    // Listen for team changes
    const handleTeamChange = () => {
      loadProjectData();
    };

    // Listen for project changes (e.g., new project created via wizard)
    const handleProjectChange = () => {
      loadProjectData();
    };

    window.addEventListener('teamChanged', handleTeamChange);
    window.addEventListener('projectChanged', handleProjectChange);

    return () => {
      window.removeEventListener('teamChanged', handleTeamChange);
      window.removeEventListener('projectChanged', handleProjectChange);
    };
  }, [translationsLoading, t]);

  // Listen for File Preview updates
  useEffect(() => {
    const handleFilePreviewUpdate = (event: CustomEvent) => {
      const { projectId } = event.detail;
      refreshFilePreview(projectId);
    };

    // Add event listener
    window.addEventListener('filePreviewUpdate', handleFilePreviewUpdate as EventListener);

    return () => {
      window.removeEventListener('filePreviewUpdate', handleFilePreviewUpdate as EventListener);
    };
     
  }, [treeData]);

  // Store last known update timestamps for each project (for polling)
  const lastKnownTimestamps = useRef<Record<number, string>>({});

  // Auto-polling for File Preview updates (every 10 seconds)
  // Lightweight check for generation tree updates
  useEffect(() => {
    // Extract project IDs from tree data
    const projectIds = treeData
      .filter(node => node.type === 'project')
      .map(node => node.projectId)
      .filter(id => id !== undefined) as number[];

    if (projectIds.length === 0) return;

    // Set up polling interval
    const interval = setInterval(async () => {
      for (const projectId of projectIds) {
        try {
          const response = await apiClient.checkGenerationTreeUpdates(
            projectId,
            lastKnownTimestamps.current[projectId] || '1970-01-01T00:00:00.000Z'
          );

          if (response && response.has_updates) {
            // Update the timestamp
            if (response.last_update) {
              lastKnownTimestamps.current[projectId] = response.last_update;
            }

            // Refresh only the File Preview for this project
            refreshFilePreview(projectId);
          }
        } catch {
          // Silently ignore polling errors to avoid console spam
        }
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [treeData, refreshFilePreview]);

  const toggleNode = (nodeId: string) => {
    const updateNode = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };

    setTreeData(updateNode(treeData));
  };

  const expandNode = (nodeId: string) => {
    const updateNode = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, expanded: true };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };

    setTreeData(updateNode(treeData));
  };

  const selectNode = (node: TreeNode) => {
    setSelectedNode(node);
    // Single click only selects the node (for visual feedback)
  };

  const handleOpenPanel = (node: TreeNode) => {
    // Expand the node if it has children (better UX - user wants to work with it)
    if (node.children && node.children.length > 0) {
      expandNode(node.id);
    }

    // Double click opens the appropriate panel
    switch (node.type) {
      case 'project':
        if (onOpenPanel && node.projectId) {
          // Create unique panel ID for each project
          const uniqueProjectId = `project-${node.projectId}`;

          // Use the project name from the tree node (already loaded from API)
          const actualProjectName = node.name || `Project ${node.projectId}`;

          const panelData = {
            type: 'project',
            title: t.projectpanel615 + `: ${actualProjectName}`,
            projectId: node.projectId,
            projectName: actualProjectName,
            actualProjectName: actualProjectName,
            realProjectName: actualProjectName
          };

          onOpenPanel(uniqueProjectId, panelData);
        }
        break;
      case 'team':
        if (onOpenPanel) {
          // Create unique panel ID based on project to allow multiple team panels
          const uniqueTeamPanelId = `team-management-project-${node.projectId}`;

          onOpenPanel(uniqueTeamPanelId, {
            type: 'team-management',
            title: t.panelt1735, // Will be updated by the panel itself
            projectId: node.projectId,
            teamId: node.teamId,
            teamName: node.name,
            filterByProject: true,
            source: 'treeview',
            forceProjectId: node.projectId // Force the panel to use this project ID instead of the selected project
          });
        }
        break;
      case 'member':
        if (onOpenPanel && node.teamId) {
          // Open TeamManagementPanel with team context
          const uniqueMemberPanelId = `team-management-team-${node.teamId}`;
          onOpenPanel(uniqueMemberPanelId, {
            type: 'team-management',
            title: t.panelt1751,
            projectId: node.projectId,
            teamId: node.teamId,
            filterByProject: node.projectId ? true : false,
            source: 'treeview',
            forceProjectId: node.projectId
          });
        }
        break;
      case 'template':
        if (onOpenPanel && node.projectId) {
          // Create unique panel ID for template management filtered by project
          const uniqueTemplatePanelId = `template-management-project-${node.projectId}`;

          onOpenPanel(uniqueTemplatePanelId, {
            type: 'template-management',
            title: `${t.panelt1767}${node.projectName || t.panelt1767_2}`,
            projectId: node.projectId,
            projectName: node.projectName,
            templateId: node.templateId,
            filterByProject: true,
            forceProjectId: node.projectId // Force the panel to use this project ID
          });
        }
        break;
      case 'databases-container':
        if (onOpenPanel && node.projectId) {
          // Create unique panel ID for database management filtered by project
          const uniqueDatabasePanelId = `database-management-project-${node.projectId}`;

          onOpenPanel(uniqueDatabasePanelId, {
            type: 'database-management',
            title: `${t.panelt1783}${node.projectName || t.panelt1783_2}`,
            projectId: node.projectId,
            projectName: node.projectName,
            filterByProject: true,
            forceProjectId: node.projectId,
            forceProjectName: node.projectName // Force the project name in the title
          });
        }
        break;
      case 'schema':
        if (onOpenPanel && node.schemaId) {
          // Open Database Designer (PanelT2) with this schema pre-selected
          const uniqueDesignerPanelId = `designer_schema_${node.schemaId}`;

          onOpenPanel(uniqueDesignerPanelId, {
            type: 't2',
            title: `${t.panelt1799}${node.name}`,
            schemaName: node.name,
            preSelectedSchemaId: node.schemaId
          });
        }
        break;
      case 'table':
        if (onOpenPanel && node.tableId && node.schemaId) {
          // Open Template Tester & Debug with this table pre-selected
          const uniqueDebugPanelId = `debug-manual-generator-table-${node.tableId}`;

          onOpenPanel(uniqueDebugPanelId, {
            type: 'debug-manual-generator',
            title: `${t.panelt1812}${node.tableName || 'Table'}`,
            tableId: node.tableId,
            tableName: node.tableName,
            schemaId: node.schemaId,
            projectId: node.projectId,
            projectName: node.projectName
          });
        }
        break;
      case 'generated-file':
        if (onOpenPanel) {
          // Open Template Tester & Debug with ALL parameters pre-selected
          const uniqueDebugPanelId = `debug-manual-generator-gen-file-${node.fileId}-${node.tableId}-${node.languageId}`;

          onOpenPanel(uniqueDebugPanelId, {
            type: 'debug-manual-generator',
            title: `${t.panelt1828}${node.name}`,
            projectId: node.projectId,
            projectName: node.projectName,
            templateId: node.templateId,
            fileId: node.fileId,
            fileName: node.name, // ADD: Pass filename for matching since API doesn't return IDs
            tableId: node.tableId,
            tableName: node.tableName,
            languageId: node.languageId,
            languageCode: node.languageCode,
            preFilePath: node.path // The full generated path
          });
        }
        break;

      // ========== Standalone Item Handlers ==========
      case 'standalone-teams-container':
        // Open Team Management without project filter
        if (onOpenPanel) {
          onOpenPanel('team-management', {
            type: 'team-management',
            title: t.panelt1849,
            filterByProject: false
          });
        }
        break;
      case 'standalone-team':
        // Open Team Management with this team selected
        if (onOpenPanel && node.teamId) {
          onOpenPanel(`team-management-team-${node.teamId}`, {
            type: 'team-management',
            title: `${t.panelt1859}${node.name}`,
            teamId: node.teamId,
            teamName: node.name,
            filterByProject: false
          });
        }
        break;
      case 'standalone-templates-container':
        // Open Template Management without project filter
        if (onOpenPanel) {
          onOpenPanel('template-management', {
            type: 'template-management',
            title: t.panelt1871,
            filterByProject: false
          });
        }
        break;
      case 'standalone-template':
        // Open Template Management with this template selected
        if (onOpenPanel && node.templateId) {
          onOpenPanel(`template-management-template-${node.templateId}`, {
            type: 'template-management',
            title: `${t.panelt1881}${node.name}`,
            templateId: node.templateId,
            filterByProject: false
          });
        }
        break;
      case 'standalone-databases-container':
        // Open Database Management without project filter
        if (onOpenPanel) {
          onOpenPanel('database-management', {
            type: 'database-management',
            title:t.panelt1892,
            filterByProject: false
          });
        }
        break;
      case 'standalone-database':
        // Open Database Management with this schema pre-selected
        if (onOpenPanel && node.schemaId) {
          onOpenPanel(`database-management-schema-${node.schemaId}`, {
            type: 'database-management',
            title: `${t.panelt1902}${node.name}`,
            filterByProject: false,
            preSelectedSchemaId: node.schemaId
          });
        }
        break;
    }
  };

  const expandAll = () => {
    const expandNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => ({
        ...node,
        expanded: true,
        children: node.children ? expandNodes(node.children) : undefined
      }));
    };
    setTreeData(expandNodes(treeData));
  };

  const collapseAll = () => {
    const collapseNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => ({
        ...node,
        expanded: false,
        children: node.children ? collapseNodes(node.children) : undefined
      }));
    };
    setTreeData(collapseNodes(treeData));
  };

  return (
    <TabContent style={{}}>
      {/* Main container with fixed height and Flexbox layout */}
      <div className="h-full flex flex-col p-4">
        {/* Header - fixed height */}
        <div className="flex-shrink-0 flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold" style={{ color: 'var(--theme-accent)' }}>{t.panelt1939}</h3>
          <div className="flex space-x-2">
            <button
              onClick={expandAll}
              className="text-xs panel-btn px-2 py-1 rounded"
              title={t.panelt1791}
            >
              ⬇️
            </button>
            <button
              onClick={collapseAll}
              className="text-xs panel-btn px-2 py-1 rounded"
              title={t.panelt1798}
            >
              ⬆️
            </button>
          </div>
        </div>

        {/* Tree View - scrollable area */}
        <div className="flex-1 min-h-0 overflow-y-auto panel-tree-container rounded p-2">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div style={{ color: 'var(--theme-text-muted)' }}>{t.projectpanel601}</div>
            </div>
          ) : treeData.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div style={{ color: 'var(--theme-text-muted)' }}>{t.projectpanel854}</div>
            </div>
          ) : (
            treeData.map((node) => (
              <TreeNodeComponent
                key={node.id}
                node={node}
                level={0}
                onToggle={toggleNode}
                onSelect={selectNode}
                onOpenPanel={handleOpenPanel}
                selectedId={selectedNode?.id}
              />
            ))
          )}
        </div>

        {/* Selected Item Info - fixed height */}
        {selectedNode && (
          <div className="flex-shrink-0 mt-4 p-3 panel-info-box rounded">
            <h5 className="font-medium mb-1" style={{ color: 'var(--theme-success-text)' }}>{t.panelt1833}</h5>
            <div className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
              <div><strong>{t.panelt1988}</strong> {selectedNode.name}</div>
              <div><strong>{t.panelt1989}</strong> {selectedNode.type}</div>
              <div><strong>{t.panelt1990}</strong> {selectedNode.id}</div>
              {selectedNode.path && (
                <div><strong>{t.panelt1843}</strong> {selectedNode.path}</div>
              )}
              {selectedNode.projectId && (
                <div><strong>{t.panelt1842}</strong> {selectedNode.projectId}</div>
              )}
              {selectedNode.teamId && (
                <div><strong>{t.panelt1845}</strong> {selectedNode.teamId}</div>
              )}
              {selectedNode.type === 'member' && (
                <div><strong>{t.panelt1848}</strong>{t.panelt11001}</div>
              )}
              {selectedNode.type === 'generated-file' && (
                <>
                  {selectedNode.templateId && (
                    <div><strong>{t.panelt11006}</strong> {selectedNode.templateId}</div>
                  )}
                  {selectedNode.tableName && (
                    <div><strong>{t.panelt11009}</strong> {selectedNode.tableName}</div>
                  )}
                  {selectedNode.languageCode && (
                    <div><strong>{t.panelt11012}</strong> {selectedNode.languageCode}</div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats - fixed height */}
        <div className="flex-shrink-0 mt-4 grid grid-cols-2 gap-3">
          <div className="panel-stats-box p-2 rounded text-center">
            <div className="text-lg font-bold" style={{ color: 'var(--theme-success-text)' }}>
              {treeData.reduce((acc, node) => acc + (node.children?.length || 0), treeData.length)}
            </div>
            <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{t.panelt1873}</div>
          </div>
          <div className="panel-stats-box p-2 rounded text-center">
            <div className="text-lg font-bold" style={{ color: 'var(--theme-warning-text)' }}>
              {selectedNode ? '1' : '0'}
            </div>
            <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{t.panelt1879}</div>
          </div>
        </div>
      </div>
    </TabContent>
  );
}