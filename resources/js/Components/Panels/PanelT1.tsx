// resources/js/Components/Panels/PanelT1.tsx - Navigation Panel with Projects and Teams (Optimized)
import React, { useRef, useState, useEffect } from 'react';
import { TabContentProps, NavigationPanelProps } from '@/types';
import { apiClient } from '@/lib/api';

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
        // Various options for height - choose the appropriate one:
        height: '100%',        // Adapts to parent
        // height: '100vh',    // Full viewport height
        // height: 'calc(100vh - 100px)', // Viewport minus fixed pixels
        // maxHeight: '100vh', // Maximum viewport height
        overflow: 'hidden',
        ...style 
      }} 
      onMouseDownCapture={setFocus} 
      onTouchStartCapture={setFocus}
      className="bg-gray-800 text-gray-100 h-screen" // Alternative: Tailwind class
    >
      {children}
    </div>
  );
};

// Tree Node Interface for Projects and Teams
interface TreeNode {
  id: string;
  name: string;
  type: 'project' | 'team' | 'member';
  projectId?: number;
  teamId?: number;
  children?: TreeNode[];
  expanded?: boolean;
}

// Generate tree data from projects, teams, and team members (optimized version)
const generateProjectTreeData = async (): Promise<TreeNode[]> => {
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
                name: member.user?.name || member.name || 'Unknown User',
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

      treeNodes.push(projectNode);
    }

    return treeNodes;
  } catch {
    // Return a fallback structure for debugging
    return [
      {
        id: 'error-project',
        name: 'Error Loading Projects',
        type: 'project' as const,
        expanded: true,
        children: [
          {
            id: 'error-team',
            name: 'Check Console for Errors',
            type: 'team' as const,
            expanded: true,
            children: [
              {
                id: 'error-member',
                name: 'See browser console for details',
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
        return '👥';
      case 'member':
        return '👤';
      default:
        return '📄';
    }
  };

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-700 rounded text-sm ${
          isSelected ? 'bg-blue-600 text-white' : 'text-gray-300'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
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
        <span className="truncate">{node.name}</span>
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

  // Load project data on component mount
  useEffect(() => {
    const loadProjectData = async () => {
      setLoading(true);
      try {
        const data = await generateProjectTreeData();
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

    window.addEventListener('teamChanged', handleTeamChange);

    return () => {
      window.removeEventListener('teamChanged', handleTeamChange);
    };
  }, []);

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

  const selectNode = (node: TreeNode) => {
    setSelectedNode(node);
    // Single click only selects the node (for visual feedback)
  };

  const handleOpenPanel = (node: TreeNode) => {
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
            title: `Project Management: ${actualProjectName}`,
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
            title: `Team Management`, // Will be updated by the panel itself
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
        if (onOpenPanel) {
          onOpenPanel('teams-filtered', {
            type: 'teams-filtered',
            title: `Team Members: ${node.name}`,
            projectId: node.projectId,
            teamId: node.teamId,
            memberName: node.name,
            filterByProject: true
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
          <h3 className="text-lg font-bold text-blue-400">📁 Navigation</h3>
          <div className="flex space-x-2">
            <button
              onClick={expandAll}
              className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
              title="Expand All"
            >
              ⬇️
            </button>
            <button
              onClick={collapseAll}
              className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
              title="Collapse All"
            >
              ⬆️
            </button>
          </div>
        </div>

        {/* Tree View - scrollable area */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-900 rounded border border-gray-600 p-2">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-400">Loading projects...</div>
            </div>
          ) : treeData.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-400">No projects found</div>
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
          <div className="flex-shrink-0 mt-4 p-3 bg-gray-700 rounded">
            <h5 className="font-medium text-green-400 mb-1">Selected:</h5>
            <div className="text-sm text-gray-300">
              <div><strong>Name:</strong> {selectedNode.name}</div>
              <div><strong>Type:</strong> {selectedNode.type}</div>
              <div><strong>ID:</strong> {selectedNode.id}</div>
              {selectedNode.projectId && (
                <div><strong>Project ID:</strong> {selectedNode.projectId}</div>
              )}
              {selectedNode.teamId && (
                <div><strong>Team ID:</strong> {selectedNode.teamId}</div>
              )}
              {selectedNode.type === 'member' && (
                <div><strong>Role:</strong> Team Member</div>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats - fixed height */}
        <div className="flex-shrink-0 mt-4 grid grid-cols-2 gap-3">
          <div className="bg-gray-700 p-2 rounded text-center">
            <div className="text-lg font-bold text-green-400">
              {treeData.reduce((acc, node) => acc + (node.children?.length || 0), treeData.length)}
            </div>
            <div className="text-xs text-gray-400">Total Items</div>
          </div>
          <div className="bg-gray-700 p-2 rounded text-center">
            <div className="text-lg font-bold text-yellow-400">
              {selectedNode ? '1' : '0'}
            </div>
            <div className="text-xs text-gray-400">Selected</div>
          </div>
        </div>
      </div>
    </TabContent>
  );
}