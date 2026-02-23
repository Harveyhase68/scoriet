import React, { useState } from 'react';

interface TreeNode {
  id: string;
  name: string;
  type?: string;
  memberRole?: string;
  children?: TreeNode[];
}

interface ClassicTreeViewProps {
  data: TreeNode[];
  onNodeClick?: (node: TreeNode) => void;
}

interface TreeNodeProps {
  node: TreeNode;
  level: number;
  isLast: boolean;
  parentLines: boolean[];
  onNodeClick?: (node: TreeNode) => void;
}

const TreeNodeComponent: React.FC<TreeNodeProps> = ({
  node,
  level,
  isLast,
  parentLines,
  onNodeClick
}) => {  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(node);
    }
  };

  const renderConnector = () => {
    if (level === 0) return null;

    const connectors = [];

    // Parent lines
    for (let i = 0; i < level - 1; i++) {
      connectors.push(
        <div
          key={`parent-${i}`}
          className="absolute w-px bg-gray-400"
          style={{
            left: `${20 * (i + 1)}px`,
            top: 0,
            bottom: 0,
            display: parentLines[i] ? 'block' : 'none'
          }}
        />
      );
    }

    // Current level connector
    const currentLeft = 20 * level;
    connectors.push(
      <div
        key="current-vertical"
        className="absolute w-px bg-gray-400"
        style={{
          left: `${currentLeft}px`,
          top: 0,
          bottom: isLast ? '50%' : 0
        }}
      />
    );

    connectors.push(
      <div
        key="current-horizontal"
        className="absolute h-px bg-gray-400"
        style={{
          left: `${currentLeft}px`,
          top: '50%',
          width: '20px'
        }}
      />
    );

    return <>{connectors}</>;
  };

  return (
    <>
      <div
        className="relative flex items-center py-1 cursor-pointer hover:bg-blue-500/20"
        style={{ paddingLeft: `${20 * level + 25}px` }}
        onClick={handleClick}
      >
        {renderConnector()}

        {hasChildren && (
          <div
            className="absolute w-4 h-4 bg-gray-600 border border-gray-400 flex items-center justify-center text-xs cursor-pointer z-10 text-white font-bold hover:bg-gray-500"
            style={{ left: `${20 * level + 12}px` }}
            onClick={handleToggle}
          >
            {isExpanded ? '−' : '+'}
          </div>
        )}

        <div className="flex items-center">
          {node.type === 'team' ? (
            <i className="pi pi-users text-blue-400 mr-2"></i>
          ) : node.type === 'schema' ? (
            <i className="pi pi-database text-green-400 mr-2"></i>
          ) : node.type === 'table' ? (
            <i className="pi pi-table text-green-300 mr-2"></i>
          ) : node.type === 'template' ? (
            <i className="pi pi-file-edit text-purple-500 mr-2"></i>
          ) : node.type === 'template_file' ? (
            <i className="pi pi-file text-purple-500 mr-2"></i>
          ) : (
            <i className={`mr-2 ${
              node.memberRole === 'owner' ? 'pi pi-crown text-yellow-400' :
              node.memberRole === 'admin' ? 'pi pi-shield text-blue-400' :
              'pi pi-user text-gray-300'
            }`}></i>
          )}

          <span className={`${
            node.memberRole === 'owner' ? 'text-yellow-300 font-medium' :
            node.memberRole === 'admin' ? 'text-blue-300' :
            node.type === 'team' ? 'text-blue-300 font-medium' :
            node.type === 'schema' ? 'text-green-300 font-medium' :
            node.type === 'table' ? 'text-green-200' :
            node.type === 'template' ? 'text-purple-500 font-medium' :
            node.type === 'template_file' ? 'text-purple-500' :
            'text-gray-200'
          }`}>
            {node.name}
          </span>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <>
          {node.children!.map((child, index) => {
            const childIsLast = index === node.children!.length - 1;
            const newParentLines = [...parentLines];
            if (level >= 0) {
              newParentLines[level] = !isLast;
            }

            return (
              <TreeNodeComponent
                key={child.id}
                node={child}
                level={level + 1}
                isLast={childIsLast}
                parentLines={newParentLines}
                onNodeClick={onNodeClick}
              />
            );
          })}
        </>
      )}
    </>
  );
};

const ClassicTreeView: React.FC<ClassicTreeViewProps> = ({ data, onNodeClick }) => {
  return (
    <div className="font-mono text-sm tree-view-container">
      {data.map((node, index) => (
        <TreeNodeComponent
          key={node.id}
          node={node}
          level={0}
          isLast={index === data.length - 1}
          parentLines={[]}
          onNodeClick={onNodeClick}
        />
      ))}
    </div>
  );
};

export default ClassicTreeView;