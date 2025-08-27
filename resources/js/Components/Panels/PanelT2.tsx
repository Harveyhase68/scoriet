// resources/js/Components/Panels/PanelT2.tsx - Database Schema Visualizer
import React, { useRef, useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TabContentProps } from '@/types';
import { apiClient, SchemaVersion, SchemaTable } from '@/lib/api';
import SqlImportModal from '@/Components/SqlImportModal';

interface DatabaseNodeData {
  tableName: string;
  fields: Array<{
    name: string;
    type: string;
    nullable: boolean;
    isPrimary: boolean;
    isForeign: boolean;
  }>;
  constraints: Array<{
    type: string;
    name?: string;
  }>;
}

interface DatabaseNodeProps {
  data: DatabaseNodeData;
  selected: boolean;
}

const TabContent: React.FC<TabContentProps> = ({ children, style = {}, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);
  const setFocus = () => ref.current?.focus();

  return (
    <div 
      {...rest} 
      ref={ref}
      tabIndex={-1} 
      style={{ flex: 1, padding: '0', height: '100%', ...style }} 
      onMouseDownCapture={setFocus} 
      onTouchStartCapture={setFocus}
      className="bg-gray-800 text-gray-100"
    >
      {children}
    </div>
  );
};

// Database Table Node
const DatabaseNode: React.FC<DatabaseNodeProps> = ({ data, selected }) => {
  return (
    <div className={`shadow-lg rounded-lg border-2 min-w-64 max-w-80 ${
      selected 
        ? 'border-blue-400 bg-gray-700' 
        : 'border-gray-600 bg-gray-800'
    }`}>
      {/* Table Header */}
      <div className="bg-blue-600 px-3 py-2 rounded-t-lg">
        <div className="flex items-center">
          <div className="text-lg mr-2">🗃️</div>
          <div className="text-sm font-bold text-white">{data.tableName}</div>
        </div>
      </div>
      
      {/* Fields */}
      <div className="p-3">
        {data.fields.length > 0 && (
          <div className="space-y-1">
            {data.fields.map((field, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <div className="flex items-center">
                  {field.isPrimary && <span className="text-yellow-400 mr-1">🔑</span>}
                  {field.isForeign && <span className="text-orange-400 mr-1">🔗</span>}
                  <span className="text-white font-mono">{field.name}</span>
                </div>
                <div className="text-gray-400">
                  {field.type}{!field.nullable && <span className="text-red-400"> NOT NULL</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Constraints */}
        {data.constraints.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-600">
            <div className="text-xs text-gray-400 mb-1">Constraints:</div>
            {data.constraints.map((constraint, index) => (
              <div key={index} className="text-xs text-gray-300">
                {constraint.type} {constraint.name && `(${constraint.name})`}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#3b82f6', width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#3b82f6', width: 8, height: 8 }}
      />
    </div>
  );
};

// Node Types
const nodeTypes = {
  database: DatabaseNode,
};

// Helper functions
const convertSchemaToNodes = (tables: SchemaTable[]): Node[] => {
  return tables.map((table, index) => {
    // Primary Keys finden
    const primaryKeyFields = table.constraints
      ?.filter(c => c.constraint_type === 'PRIMARY KEY')
      ?.flatMap(c => c.columns?.map(col => col.field_name) || []) || [];

    // Foreign Keys finden
    const foreignKeyFields = table.constraints
      ?.filter(c => c.constraint_type === 'FOREIGN KEY')
      ?.flatMap(c => c.columns?.map(col => col.field_name) || []) || [];

    const nodeData: DatabaseNodeData = {
      tableName: table.table_name,
      fields: table.fields?.map(field => ({
        name: field.field_name,
        type: field.field_type,
        nullable: field.is_nullable,
        isPrimary: primaryKeyFields.includes(field.field_name),
        isForeign: foreignKeyFields.includes(field.field_name),
      })) || [],
      constraints: table.constraints?.map(constraint => ({
        type: constraint.constraint_type,
        name: constraint.constraint_name,
      })) || [],
    };

    // Position berechnen (Grid Layout)
    const cols = Math.ceil(Math.sqrt(tables.length));
    const row = Math.floor(index / cols);
    const col = index % cols;

    return {
      id: `table-${table.id}`,
      type: 'database',
      position: { 
        x: col * 350 + 50, 
        y: row * 300 + 50 
      },
      data: nodeData,
    };
  });
};

const convertSchemaToEdges = (tables: SchemaTable[]): Edge[] => {
  const edges: Edge[] = [];
  
  tables.forEach(table => {
    table.constraints?.forEach(constraint => {
      if (constraint.constraint_type === 'FOREIGN KEY' && constraint.foreign_key_reference) {
        const targetTable = constraint.foreign_key_reference.referenced_table;
        if (targetTable) {
          edges.push({
            id: `fk-${table.id}-${targetTable.id}`,
            source: `table-${table.id}`,
            target: `table-${targetTable.id}`,
            type: 'smoothstep',
            style: { 
              stroke: '#f59e0b', 
              strokeWidth: 2,
              strokeDasharray: '5,5'
            },
            label: 'FK',
            labelStyle: { 
              fontSize: '10px', 
              fontWeight: 'bold',
              fill: '#f59e0b'
            },
          });
        }
      }
    });
  });
  
  return edges;
};

export default function PanelT2() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [schemaVersions, setSchemaVersions] = useState<SchemaVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<SchemaVersion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const loadSchemaVersions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const versions = await apiClient.getAllSchemaVersions();
      setSchemaVersions(versions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load schema versions';
      setError(errorMessage);
      
      // If it's an auth error, clear the nodes/edges to show login prompt
      if (errorMessage.includes('Authentication')) {
        setNodes([]);
        setEdges([]);
        setSchemaVersions([]);
        setSelectedVersion(null);
      }
    } finally {
      setLoading(false);
    }
  }, [setEdges, setNodes]);

  const loadSchemaVersion = useCallback(async (versionId: number) => {
    try {
      setLoading(true);
      const version = await apiClient.getSchemaVersion(versionId);
      
      if (version && version.tables) {
        setSelectedVersion(version);
        const newNodes = convertSchemaToNodes(version.tables);
        const newEdges = convertSchemaToEdges(version.tables);
        
        setNodes(newNodes);
        setEdges(newEdges);
        setError(null);
      } else {
        setError('No tables found in this schema version');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schema version');
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  // Load schema versions on mount
  useEffect(() => {
    loadSchemaVersions();
  }, [loadSchemaVersions]);

  // Auto-select first version when versions are loaded
  useEffect(() => {
    if (schemaVersions.length > 0 && !selectedVersion) {
      loadSchemaVersion(schemaVersions[0].id);
    }
  }, [schemaVersions, selectedVersion, loadSchemaVersion]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({
          ...params,
          type: 'smoothstep',
          style: { stroke: '#3b82f6', strokeWidth: 2 },
        }, eds)
      ),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleImportSuccess = (result: any) => {
    // Reload schema versions to include the new one
    loadSchemaVersions().then(() => {
      // Try to select the newly imported version
      if (result.schema_version_id) {
        loadSchemaVersion(result.schema_version_id);
      }
    });
    
    // Show success message (you could add a toast notification here)
  };

  return (
    <TabContent style={{}}>
      <div className="h-full flex flex-col" style={{ height: '100%' }}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gray-900 border-b border-gray-600 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-blue-400">🗃️ Database Designer</h3>
            <p className="text-sm text-gray-400">
              {selectedVersion ? `${selectedVersion.version_name} - ${selectedVersion.tables?.length || 0} tables` : 'No schema loaded'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Schema Version Selector */}
            <select
              value={selectedVersion?.id || ''}
              onChange={(e) => {
                const versionId = parseInt(e.target.value);
                if (versionId) loadSchemaVersion(versionId);
              }}
              className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600 focus:border-blue-500"
            >
              <option value="">Select Schema Version</option>
              {schemaVersions.map(version => (
                <option key={version.id} value={version.id}>
                  {version.version_name}
                </option>
              ))}
            </select>
            
            <button 
              onClick={loadSchemaVersions}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
              disabled={loading}
            >
              🔄 Refresh
            </button>
            
            <button 
              onClick={() => setShowImportModal(true)}
              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors"
              disabled={loading}
            >
              📥 Import SQL
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-900 border-b border-red-600 text-red-200 flex-shrink-0">
            <div className="flex items-center">
              <span className="mr-2">⚠️</span>
              <span>{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="p-4 bg-gray-800 border-b border-gray-600 text-gray-300 flex-shrink-0">
            <div className="flex items-center">
              <div className="animate-spin mr-2">⚪</div>
              <span>Loading schema...</span>
            </div>
          </div>
        )}

        {/* React Flow Container */}
        <div className="flex-1" style={{ height: 'calc(100% - 200px)' }}>
          {nodes.length > 0 ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              fitView
              className="bg-gray-800"
              proOptions={{ hideAttribution: true }}
              style={{ 
                width: '100%',
                height: '100%',
                backgroundColor: '#1f2937'
              }}
            >
              <Controls 
                className="react-flow-controls-dark"
                style={{ background: '#374151', border: '1px solid #4b5563' }}
              />
              <MiniMap 
                className="react-flow-minimap-dark"
                style={{ 
                  background: '#374151', 
                  border: '1px solid #4b5563' 
                }}
                nodeColor="#6b7280"
                maskColor="rgba(0, 0, 0, 0.6)"
              />
              <Background 
                variant={BackgroundVariant.Dots} 
                gap={20} 
                size={1}
                color="#4b5563"
                style={{ backgroundColor: '#1f2937' }}
              />
            </ReactFlow>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                {error && error.includes('Authentication') ? (
                  // Authentication Error State
                  <>
                    <div className="text-6xl mb-4">🔐</div>
                    <h3 className="text-xl font-bold mb-2 text-yellow-400">Authentication Required</h3>
                    <p className="text-sm mb-4">Your session has expired. Please log in to access schema data.</p>
                    <p className="text-xs text-gray-500">
                      Use the navigation menu to log in again
                    </p>
                  </>
                ) : (
                  // No Data State
                  <>
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-bold mb-2">No Schema Data</h3>
                    <p className="text-sm">Select a schema version to visualize database structure</p>
                    {schemaVersions.length === 0 && !loading && !error && (
                      <p className="text-xs mt-2 text-gray-500">
                        Import a SQL script first to create schema data
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Table Info Panel */}
        {selectedNode && selectedNode.data.tableName && (
          <div className="p-4 bg-gray-900 border-t border-gray-600 flex-shrink-0">
            <h5 className="font-medium text-blue-400 mb-2">🔍 Table Details</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Table:</span>
                <span className="ml-2 text-white font-mono">{selectedNode.data.tableName}</span>
              </div>
              <div>
                <span className="text-gray-400">Fields:</span>
                <span className="ml-2 text-white">{selectedNode.data.fields?.length || 0}</span>
              </div>
              <div>
                <span className="text-gray-400">Constraints:</span>
                <span className="ml-2 text-white">{selectedNode.data.constraints?.length || 0}</span>
              </div>
              <div>
                <span className="text-gray-400">Primary Keys:</span>
                <span className="ml-2 text-yellow-400">
                  {selectedNode.data.fields?.filter((f: { isPrimary: boolean }) => f.isPrimary).length || 0}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SQL Import Modal */}
      <SqlImportModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />
    </TabContent>
  );
}