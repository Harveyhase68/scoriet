// resources/js/Components/Panels/PanelT5.tsx - With Tree Control
import React, { useRef, useState } from 'react';
import { TabContentProps } from '@/types';

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

// Tree Node Interface
interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: TreeNode[];
  expanded?: boolean;
}

// Random test data
const generateTreeData = (): TreeNode[] => {
  return [
    {
      id: '1',
      name: 'Database',
      type: 'folder',
      expanded: true,
      children: [
        {
          id: '1-1',
          name: 'Website Redesign',
          type: 'folder',
          expanded: false,
          children: [
            { id: '1-1-1', name: 'index.html', type: 'file' },
            { id: '1-1-2', name: 'style.css', type: 'file' },
            { id: '1-1-3', name: 'app.js', type: 'file' },
          ]
        },
        {
          id: '1-2',
          name: 'Mobile App',
          type: 'folder',
          expanded: true,
          children: [
            { id: '1-2-1', name: 'MainActivity.java', type: 'file' },
            { id: '1-2-2', name: 'layout.xml', type: 'file' },
            {
              id: '1-2-3',
              name: 'components',
              type: 'folder',
              children: [
                { id: '1-2-3-1', name: 'Button.tsx', type: 'file' },
                { id: '1-2-3-2', name: 'Modal.tsx', type: 'file' },
              ]
            }
          ]
        },
        { id: '1-3', name: 'README.md', type: 'file' }
      ]
    },
    {
      id: '2',
      name: 'Documents',
      type: 'folder',
      expanded: false,
      children: [
        { id: '2-1', name: 'Proposal.pdf', type: 'file' },
        { id: '2-2', name: 'Contract.docx', type: 'file' },
        {
          id: '2-3',
          name: 'Reports',
          type: 'folder',
          children: [
            { id: '2-3-1', name: 'Q1-Report.xlsx', type: 'file' },
            { id: '2-3-2', name: 'Q2-Report.xlsx', type: 'file' },
          ]
        }
      ]
    },
    {
      id: '3',
      name: 'Assets',
      type: 'folder',
      expanded: false,
      children: [
        { id: '3-1', name: 'logo.png', type: 'file' },
        { id: '3-2', name: 'banner.jpg', type: 'file' },
        { id: '3-3', name: 'icon.svg', type: 'file' },
      ]
    }
  ];
};

// Tree Node Component
const TreeNodeComponent: React.FC<{
  node: TreeNode;
  level: number;
  onToggle: (nodeId: string) => void;
  onSelect: (node: TreeNode) => void;
  selectedId?: string;
}> = ({ node, level, onToggle, onSelect, selectedId }) => {
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  
  const getIcon = () => {
    if (node.type === 'folder') {
      return node.expanded ? '📂' : '📁';
    } else {
      // File icons based on extension
      const ext = node.name.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'html': return '🌐';
        case 'css': return '🎨';
        case 'js': case 'ts': case 'tsx': return '⚡';
        case 'java': return '☕';
        case 'xml': return '📄';
        case 'pdf': return '📕';
        case 'docx': return '📘';
        case 'xlsx': return '📊';
        case 'png': case 'jpg': case 'svg': return '🖼️';
        case 'md': return '📝';
        default: return '📄';
      }
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
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main Panel Component
export default function PanelT5() {
  const [treeData, setTreeData] = useState<TreeNode[]>(generateTreeData());
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

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
      <div className="p-4 h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-blue-400">📁 Database Explorer</h3>
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

        {/* Tree View */}
        <div className="flex-1 overflow-y-auto bg-gray-900 rounded border border-gray-600 p-2">
          {treeData.map((node) => (
            <TreeNodeComponent
              key={node.id}
              node={node}
              level={0}
              onToggle={toggleNode}
              onSelect={selectNode}
              selectedId={selectedNode?.id}
            />
          ))}
        </div>

        {/* Selected Item Info */}
        {selectedNode && (
          <div className="mt-4 p-3 bg-gray-700 rounded">
            <h5 className="font-medium text-green-400 mb-1">Selected:</h5>
            <div className="text-sm text-gray-300">
              <div><strong>Name:</strong> {selectedNode.name}</div>
              <div><strong>Type:</strong> {selectedNode.type}</div>
              <div><strong>ID:</strong> {selectedNode.id}</div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
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