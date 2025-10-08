// resources/js/Components/Panels/PanelT2.tsx - Database Schema Visualizer
import React, { useRef, useState, useCallback, useEffect } from 'react';

// TypeScript declaration for window timeout
declare global {
  interface Window {
    layoutSaveTimeout?: NodeJS.Timeout;
  }
}
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
  NodeResizer,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TabContentProps } from '@/types';
import { SchemaTable } from '@/lib/api';
import SqlImportModal from '@/Components/SqlImportModal';
import VersionConfirmationModal from '@/Components/VersionConfirmationModal';
import CreateTableModal from '@/Components/Modals/CreateTableModal';
import EditTableModal from '@/Components/Modals/EditTableModal';
import { useProject } from '@/contexts/ProjectContext';

interface FloatingSchema {
  id: number;
  name: string;
  description?: string;
  last_version: number;
  association_type: 'linked' | 'cloned' | 'imported';
  alias?: string;
}

interface SchemaVersionExtended {
  id: number;
  schema_id?: number;
  version_name: string;
  version_number?: number;
  description?: string;
  imported_at?: string;
  display_name?: string;
  has_unsaved_changes?: boolean;
}

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
  table?: SchemaTable;
  onDelete?: (table: SchemaTable) => void;
  onEdit?: (table: SchemaTable) => void;
  isLatestVersion?: boolean;
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
    <div className={`shadow-lg rounded-lg border-2 w-full h-full flex flex-col ${
      selected 
        ? 'border-blue-400 bg-gray-700' 
        : 'border-gray-600 bg-gray-800'
    }`} style={{ minWidth: 250, minHeight: 150 }}>
      {/* Node Resizer - only show when selected */}
      {selected && (
        <NodeResizer
          color="#3b82f6"
          isVisible={selected}
          minWidth={250}
          minHeight={150}
          handleStyle={{
            width: '8px',
            height: '8px',
            borderRadius: '2px'
          }}
          lineStyle={{
            borderWidth: '2px'
          }}
        />
      )}
      {/* Table Header */}
      <div className="bg-blue-600 px-3 py-2 rounded-t-lg flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-lg mr-2">🗃️</div>
            <div className="text-sm font-bold text-white">{data.tableName}</div>
          </div>
          <div className="flex items-center gap-1">
            {data.onEdit && data.isLatestVersion && data.table && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  data.onEdit!(data.table!);
                }}
                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                title="Tabelle bearbeiten"
              >
                ✏️
              </button>
            )}
            {data.onDelete && data.isLatestVersion && data.table && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  data.onDelete!(data.table!);
                }}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                title="Tabelle löschen"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Fields - Scrollable List */}
      <div className="flex-1 p-3 overflow-hidden">
        {data.fields.length > 0 ? (
          <div className="h-full overflow-y-auto overflow-x-hidden space-y-1">
            {data.fields.map((field, index) => (
              <div key={index} className="flex justify-between items-center text-xs min-h-[20px]">
                <div className="flex items-center flex-shrink-0">
                  {field.isPrimary && <span className="text-yellow-400 mr-1">🔑</span>}
                  {field.isForeign && <span className="text-orange-400 mr-1">🔗</span>}
                  <span className="text-white font-mono truncate">{field.name}</span>
                </div>
                <div className="text-gray-400 text-right flex-shrink-0 ml-2">
                  <span className="truncate">{field.type}</span>
                  {!field.nullable && <span className="text-red-400"> NOT NULL</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-xs text-center">No fields</div>
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
const convertSchemaToNodes = (tables: SchemaTable[], savedLayouts: Record<string, any> = {}, onDeleteTable?: (table: SchemaTable) => void, onEditTable?: (table: SchemaTable) => void, isLatestVersion?: boolean): Node[] => {
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
      table: table,
      onDelete: onDeleteTable,
      onEdit: onEditTable,
      isLatestVersion: isLatestVersion,
    };

    // Check if we have saved layout for this table
    const savedLayout = savedLayouts[table.table_name];
    
    let position;
    let width = undefined;
    let height = undefined;
    
    if (savedLayout) {
      // Use saved position and dimensions
      position = {
        x: parseFloat(savedLayout.x_position) || 0,
        y: parseFloat(savedLayout.y_position) || 0
      };
      width = savedLayout.width ? parseFloat(savedLayout.width) : 280;
      height = savedLayout.height ? parseFloat(savedLayout.height) : undefined;
    } else {
      // Smart positioning: Find optimal position for new table
      if (index > 0) {
        // Find existing table positions (excluding current table)
        const existingTables = tables.slice(0, index);
        const existingPositions = existingTables.map((t, i) => {
          const savedPos = savedLayouts[t.table_name];
          if (savedPos) {
            return {
              x: parseFloat(savedPos.x_position) || 0,
              y: parseFloat(savedPos.y_position) || 0,
              width: parseFloat(savedPos.width) || 280
            };
          } else {
            // Calculate grid position for previous tables
            const cols = Math.ceil(Math.sqrt(tables.length));
            const row = Math.floor(i / cols);
            const col = i % cols;
            return {
              x: col * 350 + 50,
              y: row * 300 + 50,
              width: 280
            };
          }
        });

        if (existingPositions.length > 0) {
          // Find highest Y position (smallest Y value) and rightmost X position
          const minY = Math.min(...existingPositions.map(p => p.y));
          const maxX = Math.max(...existingPositions.map(p => p.x + p.width));

          position = {
            x: maxX + 50, // Rightmost position + gap
            y: minY       // Same height as highest table
          };
        } else {
          position = { x: 50, y: 50 }; // Fallback
        }
      } else {
        // First table - default position
        position = { x: 50, y: 50 };
      }
      width = 280; // Default width
    }

    return {
      id: `table-${table.id}`,
      type: 'database',
      position,
      width,
      height,
      data: nodeData,
      draggable: true,
      selectable: true,
      style: {
        width: width,
        height: height || 'auto',
      }
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

interface PanelT2Props {
  preSelectedSchemaId?: number;
}

export default function PanelT2({ preSelectedSchemaId }: PanelT2Props) {
  const { selectedProject } = useProject();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [floatingSchemas, setFloatingSchemas] = useState<FloatingSchema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<FloatingSchema | null>(null);
  const [schemaVersions, setSchemaVersions] = useState<SchemaVersionExtended[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<SchemaVersionExtended | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  const [showEditTableModal, setShowEditTableModal] = useState(false);
  const [pendingDeleteTable, setPendingDeleteTable] = useState<SchemaTable | null>(null);
  const [pendingEditTable, setPendingEditTable] = useState<SchemaTable | null>(null);
  const [pendingAction, setPendingAction] = useState<'delete' | 'create' | 'edit' | null>(null);

  const loadFloatingSchemas = useCallback(async (preserveSchemaId?: number) => {
    if (!selectedProject) {
      setFloatingSchemas([]);
      setSelectedSchema(null);
      setSchemaVersions([]);
      setSelectedVersion(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Load schemas associated with the current project
      const response = await fetch(`/api/projects/${selectedProject.id}/schemas`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`Failed to load schemas: ${response.statusText}`);
      }
      
      const schemas = await response.json();
      setFloatingSchemas(schemas);
      
      // If we're preserving a specific schema ID, find and select it
      if (preserveSchemaId) {
        const schemaToPreserve = schemas.find((s: FloatingSchema) => s.id === preserveSchemaId);
        if (schemaToPreserve) {
          setSelectedSchema(schemaToPreserve);
          return; // Exit early, don't do auto-selection
        }
      }
      
      // Auto-select first editable schema only if no schema is currently selected
      // and no preSelectedSchemaId is provided
      if (!preSelectedSchemaId && !selectedSchema) {
        const editableSchema = schemas.find((s: FloatingSchema) => s.association_type !== 'linked');
        if (editableSchema) {
          setSelectedSchema(editableSchema);
        }
      }
      
      // If preSelectedSchemaId is provided and schema exists, select it
      if (preSelectedSchemaId && !selectedSchema) {
        const preSelectedSchema = schemas.find((s: FloatingSchema) => s.id === preSelectedSchemaId);
        if (preSelectedSchema) {
          setSelectedSchema(preSelectedSchema);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load schemas';
      setError(errorMessage);
      
      // If it's an auth error, clear the state
      if (errorMessage.includes('Authentication')) {
        setNodes([]);
        setEdges([]);
        setFloatingSchemas([]);
        setSelectedSchema(null);
        setSchemaVersions([]);
        setSelectedVersion(null);
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject, preSelectedSchemaId]); // selectedSchema dependency would cause infinite loop

  // Save layout to backend
  const saveLayout = useCallback(async (nodes: Node[]) => {
    if (!selectedSchema || !selectedVersion) return;

    const layouts = nodes.map(node => ({
      table_name: node.data.tableName,
      x_position: node.position.x,
      y_position: node.position.y,
      width: node.width || null,
      height: node.height || null
    }));

    try {
      const response = await fetch(
        `/api/floating-schemas/${selectedSchema.id}/layouts/${selectedVersion.version_number}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ layouts })
        }
      );

      if (!response.ok) {
        // Failed to save layout
      }
    } catch {
      // Error saving layout
    }
  }, [selectedSchema, selectedVersion]);


  // Load layout for specific schema and version (bypasses state dependencies)
  const loadLayoutForVersion = useCallback(async (schema: FloatingSchema | null, version: SchemaVersionExtended): Promise<Record<string, any>> => {
    if (!schema || !version) return {};

    try {
      const response = await fetch(
        `/api/floating-schemas/${schema.id}/layouts/${version.version_number}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const layouts = await response.json();
        return layouts;
      }
    } catch {
      // Error loading layout
    }
    
    return {};
  }, []);

  const loadSchemaVersions = useCallback(async (schema: FloatingSchema) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/floating-schemas/${schema.id}/versions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load schema versions: ${response.statusText}`);
      }
      
      const versions = await response.json();
      setSchemaVersions(versions);
      
      // Auto-select latest version or clear if no versions
      if (versions.length > 0) {
        const latestVersion = versions.reduce((latest: SchemaVersionExtended, current: SchemaVersionExtended) => 
          (current.version_number || 0) > (latest.version_number || 0) ? current : latest
        );
        await loadSchemaVersionWithSchema(schema, latestVersion);
      } else {
        // No versions available - clear the diagram
        setSelectedVersion(null);
        setNodes([]);
        setEdges([]);
      }
      
      return versions;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schema versions');
      setSchemaVersions([]);
      return [];
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencies would cause circular dependency

  // Load schema version with explicit schema parameter (solves state timing issues)
  const loadSchemaVersionWithSchema = useCallback(async (schema: FloatingSchema, version: SchemaVersionExtended) => {
    try {
      setLoading(true);
      
      // FIRST: Set the selected version so it's available
      setSelectedVersion(version);
      
      const response = await fetch(`/api/schema-versions/${version.id}/tables`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load schema version tables: ${response.statusText}`);
      }
      
      const tables = await response.json();
      
      if (tables && tables.length > 0) {
        // Load saved layouts for this version with explicit schema parameter
        const savedLayouts = await loadLayoutForVersion(schema, version);
        
        // Check if this is the latest version - use the passed parameters, not state
        const isLatestVersion = schema && version && 
          version.version_number === schema.last_version;
        
        
        const newNodes = convertSchemaToNodes(tables, savedLayouts, handleDeleteTable, handleEditTable, isLatestVersion);
        const newEdges = convertSchemaToEdges(tables);
        
        setNodes(newNodes);
        setEdges(newEdges);
        setError(null);
      } else {
        setNodes([]);
        setEdges([]);
        setError(null); // Clear error, empty version is valid
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schema version');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencies would cause infinite re-renders


  // Load floating schemas when project changes
  useEffect(() => {
    loadFloatingSchemas();
  }, [loadFloatingSchemas]);

  // Auto-select schema when preSelectedSchemaId is provided
  useEffect(() => {
    if (preSelectedSchemaId && floatingSchemas.length > 0) {
      const preSelectedSchema = floatingSchemas.find(schema => schema.id === preSelectedSchemaId);
      if (preSelectedSchema && (!selectedSchema || selectedSchema.id !== preSelectedSchemaId)) {
        setSelectedSchema(preSelectedSchema);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preSelectedSchemaId, floatingSchemas]); // selectedSchema dependency would cause infinite loop

  // Load schema versions when selected schema changes
  useEffect(() => {
    // Always reset state when schema changes
    setSchemaVersions([]);
    setSelectedVersion(null);
    setNodes([]);
    setEdges([]);
    
    if (selectedSchema) {
      loadSchemaVersions(selectedSchema);
    }
  }, [selectedSchema, loadSchemaVersions, setNodes, setEdges]);

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

  const handleImportSuccess = () => {
    // Reload floating schemas to include the new one
    loadFloatingSchemas().then(() => {
      // The new schema should be auto-selected by loadFloatingSchemas
    });
  };

  // Handle creating a new table with smart version detection
  const handleCreateNewTable = useCallback(() => {
    if (!selectedProject) return;

    // Case 1: No versions exist yet - this shouldn't happen, but handle gracefully
    if (!selectedVersion) {
      setError('No version available. Please create a schema version first.');
      return;
    }

    // Case 2: Version exists but has unsaved changes - open modal directly
    if (selectedVersion.has_unsaved_changes === true) {
      setShowCreateTableModal(true);
      return;
    }

    // Case 3: Clean version exists - ask user about creating new version
    setPendingAction('create');
    setShowVersionModal(true);
    setPendingDeleteTable(null); // Clear any pending delete action
  }, [selectedProject, selectedVersion]);

  // Create a new table with modal data
  const handleCreateTable = useCallback(async (tableName: string, fileKeyName: string, fileNameRenamed: string, fileNameShort: string, fields: any[]) => {
    if (!selectedProject || !selectedVersion || !selectedVersion.id) {
      setError('No version selected or version ID missing. Please select a schema version first.');
      return;
    }

    setLoading(true);
    try {
      const columns = fields.map(field => ({
        column_name: field.name,
        data_type: field.type,
        is_nullable: field.nullable,
        is_auto_increment: field.autoIncrement,
        is_primary_key: field.constraintType === 'primary',
        is_index: field.constraintType === 'index',
        is_unique: field.constraintType === 'unique',
        // Control Type & Link fields for ComboBox, ListBox, etc.
        control_type: field.controlType || 'TEXT',
        link_table: field.linkTable || null,
        link_field: field.linkField || null,
        link_display_field: field.linkDisplayField || null,
        link_order_field: field.linkOrderField || null,
        link_order_direction: field.linkOrderDirection || 'ASC'
      }));

      const response = await fetch(`/api/schema-versions/${selectedVersion.id}/tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          table_name: tableName,
          filekeyname: fileKeyName,
          file_name_renamed: fileNameRenamed,
          file_name_short: fileNameShort,
          columns: columns
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create table');
      }

      // Close modal and refresh the schema to show the new table
      setShowCreateTableModal(false);
      if (selectedSchema) {
        await loadSchemaVersionWithSchema(selectedSchema, selectedVersion);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create table');
    } finally {
      setLoading(false);
    }
  }, [selectedVersion, selectedSchema, loadSchemaVersionWithSchema, selectedProject]);

  // Update an existing table with modal data
  const handleUpdateTable = useCallback(async (tableName: string, fields: any[], fileKeyName: string, fileNameRenamed: string, fileNameShort: string) => {
    if (!selectedProject || !selectedVersion || !selectedVersion.id || !pendingEditTable) {
      setError('No version selected or table to edit. Please select a schema version first.');
      return;
    }

    setLoading(true);
    try {
      const columns = fields.map(field => ({
        column_name: field.name,
        data_type: field.type,
        is_nullable: field.nullable,
        is_auto_increment: field.autoIncrement,
        is_primary_key: field.primaryKey,
        is_index: field.index,
        is_unique: field.unique,
        comment: field.comment || null,
        // Control Type & Link fields for ComboBox, ListBox, etc.
        control_type: field.controlType || 'TEXT',
        link_table: field.linkTable || null,
        link_field: field.linkField || null,
        link_display_field: field.linkDisplayField || null,
        link_order_field: field.linkOrderField || null,
        link_order_direction: field.linkOrderDirection || 'ASC'
      }));

      const response = await fetch(`/api/schema-versions/${selectedVersion.id}/tables/${pendingEditTable.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          table_name: tableName,
          filekeyname: fileKeyName,
          file_name_renamed: fileNameRenamed,
          file_name_short: fileNameShort,
          columns: columns
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update table');
      }

      // Close modal and refresh the schema to show the updated table
      setShowEditTableModal(false);
      setPendingEditTable(null);
      if (selectedSchema) {
        await loadSchemaVersionWithSchema(selectedSchema, selectedVersion);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update table');
    } finally {
      setLoading(false);
    }
  }, [selectedVersion, selectedSchema, loadSchemaVersionWithSchema, selectedProject, pendingEditTable]);

  // Edit a table in a new version
  const handleEditTableWithNewVersion = useCallback(async () => {
    if (!selectedSchema || !selectedSchema.id || !selectedVersion) {
      setError('No schema or version selected. Please select a schema first.');
      return;
    }

    try {
      // Create new version only
      const response = await fetch(`/api/floating-schemas/${selectedSchema.id}/versions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create new version');
      }

      // Reload the schema and versions to get the new version
      await loadFloatingSchemas(selectedSchema.id);

      // Open the table edit modal
      setShowEditTableModal(true);

    } catch (err) {
      // Error creating new version
      setError(err instanceof Error ? err.message : 'Failed to create new version');
    } finally {
      setShowVersionModal(false);
      setPendingAction(null);
    }
  }, [selectedSchema, selectedVersion, loadFloatingSchemas]);

  // Create a new table in a new version
  const handleCreateTableWithNewVersion = useCallback(async () => {
    if (!selectedSchema || !selectedSchema.id || !selectedVersion) {
      setError('No schema or version selected. Please select a schema first.');
      return;
    }

    try {
      // Create new version only
      const response = await fetch(`/api/floating-schemas/${selectedSchema.id}/versions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create new version');
      }

      // Reload the schema and versions to get the new version
      await loadFloatingSchemas(selectedSchema.id);

      // Open the table creation modal
      setShowCreateTableModal(true);

    } catch (err) {
      // Error creating new version
      setError(err instanceof Error ? err.message : 'Failed to create new version');
    } finally {
      setShowVersionModal(false);
      setPendingAction(null);
    }
  }, [selectedSchema, selectedVersion, loadFloatingSchemas]);

  // Continue editing table in current version
  const handleContinueWithEditTable = useCallback(async () => {
    if (!selectedVersion || !selectedVersion.id) {
      setError('No version selected. Please select a schema version first.');
      return;
    }

    try {
      // Mark version as having unsaved changes
      await fetch(`/api/schema-versions/${selectedVersion.id}/unsaved-changes`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      // Update local state
      setSelectedVersion(prev => prev ? { ...prev, has_unsaved_changes: true } : null);

      // Open the table edit modal
      setShowEditTableModal(true);

    } catch (err) {
      // Error marking unsaved changes
      setError(err instanceof Error ? err.message : 'Failed to update version');
    } finally {
      setShowVersionModal(false);
      setPendingAction(null);
    }
  }, [selectedVersion]);

  // Continue creating table in current version
  const handleContinueWithCreateTable = useCallback(async () => {
    if (!selectedVersion || !selectedVersion.id) {
      setError('No version selected. Please select a schema version first.');
      return;
    }

    try {
      // Mark version as having unsaved changes
      await fetch(`/api/schema-versions/${selectedVersion.id}/unsaved-changes`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      // Update local state
      setSelectedVersion(prev => prev ? { ...prev, has_unsaved_changes: true } : null);

      // Open the table creation modal
      setShowCreateTableModal(true);

    } catch (err) {
      // Error marking unsaved changes
      setError(err instanceof Error ? err.message : 'Failed to update version');
    } finally {
      setShowVersionModal(false);
      setPendingAction(null);
    }
  }, [selectedVersion]);

  const handleDeleteTable = useCallback((table: SchemaTable) => {

    setPendingDeleteTable(table);
    setPendingAction('delete');

    // Check if we should show version confirmation modal
    if (!selectedVersion?.has_unsaved_changes) {
      setShowVersionModal(true);
    } else {
      // Directly delete if already marked as having changes
      performDeleteTable(table);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencies would cause infinite re-renders

  const handleEditTable = useCallback((table: SchemaTable) => {
    setPendingEditTable(table);
    setPendingAction('edit');

    // Check if we should show version confirmation modal
    if (!selectedVersion?.has_unsaved_changes) {
      setShowVersionModal(true);
    } else {
      // Directly open edit modal if already marked as having changes
      setShowEditTableModal(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencies would cause infinite re-renders

  const performDeleteTable = useCallback(async (table: SchemaTable) => {
    if (!selectedVersion) return;

    try {
      const response = await fetch(`/api/schema-versions/${selectedVersion.id}/tables/${table.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete table');
      }

      // Reload the schema version to reflect changes
      if (selectedSchema && selectedVersion) {
        loadSchemaVersionWithSchema(selectedSchema, selectedVersion);
      }
    } catch (err) {
      // Error deleting table
      setError(err instanceof Error ? err.message : 'Failed to delete table');
    }
  }, [selectedVersion, selectedSchema, loadSchemaVersionWithSchema]);

  const handleVersionModalNewVersion = useCallback(async () => {
    if (!selectedSchema || !selectedVersion) return;

    // Handle different actions
    if (pendingAction === 'create') {
      await handleCreateTableWithNewVersion();
      return;
    }

    if (pendingAction === 'edit') {
      await handleEditTableWithNewVersion();
      return;
    }

    if (pendingAction === 'delete') {
      if (!pendingDeleteTable) {
        setError('No table selected for deletion');
        return;
      }

      // SAFETY CHECK: Double confirm which table we're about to delete
      const confirmMessage = `Sie sind dabei die Tabelle "${pendingDeleteTable.table_name}" (ID: ${pendingDeleteTable.id}) zu löschen. Ist das korrekt?`;
      if (!confirm(confirmMessage)) {
        return;
      }

        try {
          // Use the new API endpoint that creates version copy AND deletes table in one operation
          const response = await fetch(`/api/schema-versions/${selectedVersion.id}/tables/${pendingDeleteTable.id}/delete-with-copy`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              description: `Table deletion: ${pendingDeleteTable.table_name}`
            })
          });

          if (!response.ok) {
            throw new Error('Failed to create version and delete table');
          }

          const result = await response.json();

          if (result.success && result.new_version_number) {
            // Reload floating schemas to update last_version
            await loadFloatingSchemas();

            // Reload schema versions to get the new version
            const newVersions = await loadSchemaVersions(selectedSchema);
            const newVersion = newVersions?.find((v: SchemaVersionExtended) => v.version_number === result.new_version_number);

            if (newVersion) {
              setSelectedVersion(newVersion);
              // Refresh the table view for the new version
              loadSchemaVersionWithSchema(selectedSchema, newVersion);
            }
          }
        } catch (err) {
          // Error creating new version and deleting table
          setError(err instanceof Error ? err.message : 'Failed to create new version and delete table');
        } finally {
          setShowVersionModal(false);
          setPendingDeleteTable(null);
          setPendingAction(null);
        }
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchema, selectedVersion, pendingDeleteTable, pendingAction, handleCreateTableWithNewVersion]); // Other dependencies would cause infinite loop

  const handleVersionModalContinue = useCallback(async () => {
    if (!selectedVersion) return;

    // Handle different actions
    if (pendingAction === 'create') {
      await handleContinueWithCreateTable();
      return;
    }

    if (pendingAction === 'edit') {
      await handleContinueWithEditTable();
      return;
    }

    if (pendingAction === 'delete') {
      if (!pendingDeleteTable) {
        setError('No table selected for deletion');
        return;
      }

      try {
        // Mark version as having unsaved changes
        await fetch(`/api/schema-versions/${selectedVersion.id}/unsaved-changes`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        });

        // Update local state
        setSelectedVersion(prev => prev ? { ...prev, has_unsaved_changes: true } : null);

        // Delete the table
        await performDeleteTable(pendingDeleteTable);
      } catch (err) {
        // Error deleting table
        setError(err instanceof Error ? err.message : 'Failed to delete table');
      } finally {
        setShowVersionModal(false);
        setPendingDeleteTable(null);
        setPendingAction(null);
      }
    }
  }, [selectedVersion, pendingDeleteTable, performDeleteTable, handleContinueWithCreateTable, handleContinueWithEditTable, pendingAction]);

  const handleRefresh = useCallback(async () => {
    // Store current selections to preserve them
    const currentSchemaId = selectedSchema?.id;
    const currentVersion = selectedVersion;
    
    // Clear current diagram to prevent "ghost" tables
    setNodes([]);
    setEdges([]);
    
    // Reload schemas with preservation of current selection
    await loadFloatingSchemas(currentSchemaId);
    
    // If we had a schema and version selected, reload the version data
    if (currentSchemaId && currentVersion) {
      setTimeout(() => {
        // The schema should now be restored, reload its versions and current version data
        loadSchemaVersions(selectedSchema!);
        setTimeout(() => {
          loadSchemaVersionWithSchema(selectedSchema!, currentVersion);
        }, 100);
      }, 100);
    } else if (currentSchemaId) {
      // Just reload versions for the current schema
      setTimeout(() => {
        loadSchemaVersions(selectedSchema!);
      }, 100);
    }
  }, [selectedSchema, selectedVersion, loadFloatingSchemas, loadSchemaVersions, loadSchemaVersionWithSchema, setNodes, setEdges]);

  return (
    <TabContent style={{}}>
      <div className="h-full flex flex-col" style={{ height: '100%' }}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gray-900 border-b border-gray-600 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-blue-400">🗃️ Database Designer</h3>
            <p className="text-sm text-gray-400">
              {selectedSchema && selectedVersion 
                ? `${selectedSchema.name} (v${selectedVersion.version_number}) - ${nodes.length} tables`
                : selectedSchema && schemaVersions.length === 0
                  ? `${selectedSchema.name} (no versions) - empty schema`
                : selectedSchema
                  ? 'Loading schema versions...'
                : selectedProject 
                  ? 'No schema selected'
                  : 'No project selected'
              }
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Schema Selector */}
            <select
              value={selectedSchema?.id || ''}
              onChange={(e) => {
                const schemaId = parseInt(e.target.value);
                const schema = floatingSchemas.find(s => s.id === schemaId);
                setSelectedSchema(schema || null);
              }}
              className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600 focus:border-blue-500"
              disabled={!selectedProject}
            >
              <option value="">{selectedProject ? 'Select Schema' : 'No Project Selected'}</option>
              {floatingSchemas.map(schema => {
                const typeIcon = schema.association_type === 'linked' ? '🔗' : 
                               schema.association_type === 'cloned' ? '📋' : '📥';
                return (
                  <option key={schema.id} value={schema.id}>
                    {typeIcon} {schema.alias || schema.name} (v{schema.last_version || 'new'})
                  </option>
                );
              })}
            </select>
            
            {/* Version Selector (only show if schema selected) */}
            {selectedSchema && schemaVersions.length > 0 && (
              <select
                value={selectedVersion?.id || ''}
                onChange={(e) => {
                  const versionId = parseInt(e.target.value);
                  const version = schemaVersions.find(v => v.id === versionId);
                  if (version && selectedSchema) {
                    loadSchemaVersionWithSchema(selectedSchema, version);
                  }
                }}
                className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600 focus:border-blue-500"
              >
                {schemaVersions.map(version => {
                  const displayText = version.version_number && version.imported_at 
                    ? `v${version.version_number} - ${new Date(version.imported_at).toLocaleDateString('de-DE')}`
                    : version.version_name;
                  return (
                    <option key={version.id} value={version.id}>
                      {displayText}
                    </option>
                  );
                })}
              </select>
            )}
            
            <button 
              onClick={handleRefresh}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
              disabled={loading || !selectedProject}
            >
              🔄 Refresh
            </button>
            
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors"
              disabled={loading || !selectedProject}
            >
              📥 Import SQL
            </button>

            <button
              onClick={handleCreateNewTable}
              className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm transition-colors"
              disabled={loading || !selectedProject}
            >
              ✨ New Table
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
              onNodesChange={(changes) => {
                // First apply the changes normally
                onNodesChange(changes);
                
                // Check if we have position or dimension changes
                const relevantChanges = changes.filter(change => 
                  (change.type === 'position' && change.positionAbsolute) ||
                  (change.type === 'dimensions' && change.dimensions)
                );
                
                if (relevantChanges.length > 0) {
                  // Debounce the save operation - clear any existing timeout
                  if (window.layoutSaveTimeout) {
                    clearTimeout(window.layoutSaveTimeout);
                  }
                  
                  window.layoutSaveTimeout = setTimeout(() => {
                    // Get current nodes with applied changes
                    setNodes(currentNodes => {
                      // Apply the changes to get updated positions and dimensions
                      const updatedNodes = currentNodes.map(node => {
                        const positionChange = changes.find((c: any) => c.id === node.id && c.type === 'position');
                        const dimensionChange = changes.find((c: any) => c.id === node.id && c.type === 'dimensions');
                        
                        const updatedNode = { ...node };
                        
                        if (positionChange && 'positionAbsolute' in positionChange && positionChange.positionAbsolute) {
                          updatedNode.position = positionChange.positionAbsolute;
                        }
                        
                        if (dimensionChange && 'dimensions' in dimensionChange && dimensionChange.dimensions) {
                          updatedNode.width = dimensionChange.dimensions.width;
                          updatedNode.height = dimensionChange.dimensions.height;
                        }
                        
                        return updatedNode;
                      });
                      
                      // Save the layout with current node positions and sizes
                      const nodesToSave = updatedNodes.filter(node =>
                        node.data && (node.data as any).tableName
                      );
                      
                      if (nodesToSave.length > 0) {
                        saveLayout(nodesToSave);
                      }
                      
                      return currentNodes; // Return unchanged nodes (ReactFlow handles the state)
                    });
                  }, 1500);
                }
              }}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              nodesDraggable={true}
              nodesConnectable={false}
              elementsSelectable={true}
              selectNodesOnDrag={false}
              fitView
              minZoom={0.05}
              maxZoom={4}
              defaultViewport={{ zoom: 0.8, x: 0, y: 0 }}
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
                    <p className="text-sm mb-4">Your session has expired. Please login to access schema data.</p>
                    <p className="text-xs text-gray-500">
                      Use the navigation menu to log in again
                    </p>
                  </>
                ) : (
                  // No Data State
                  <>
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-bold mb-2">No Schema Data</h3>
                    <p className="text-sm">
                      {!selectedProject 
                        ? 'Select a project to view schemas'
                        : floatingSchemas.length === 0
                          ? 'No schemas associated with this project'
                          : 'Select a schema to visualize database structure'
                      }
                    </p>
                    {selectedProject && floatingSchemas.length === 0 && !loading && !error && (
                      <p className="text-xs mt-2 text-gray-500">
                        Import a SQL script or associate an existing schema
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
        preselectedSchemaId={selectedSchema?.id}
      />

      {/* Version Confirmation Modal */}
      <VersionConfirmationModal
        isOpen={showVersionModal}
        onClose={() => {
          setShowVersionModal(false);
          setPendingDeleteTable(null);
          setPendingEditTable(null);
          setPendingAction(null);
        }}
        onNewVersion={handleVersionModalNewVersion}
        onContinueEditing={handleVersionModalContinue}
        actionDescription={
          pendingAction === 'create'
            ? 'eine neue Tabelle erstellen'
            : pendingAction === 'edit'
              ? `die Tabelle "${pendingEditTable?.table_name}" bearbeiten`
              : `die Tabelle "${pendingDeleteTable?.table_name}" löschen`
        }
        currentVersion={selectedVersion?.version_name || 'Current'}
        tableName={pendingDeleteTable?.table_name}
      />

      {/* Create Table Modal */}
      <CreateTableModal
        isOpen={showCreateTableModal}
        onClose={() => setShowCreateTableModal(false)}
        onTableCreated={handleCreateTable}
        loading={loading}
        schemaVersionId={selectedVersion?.id}
      />

      {/* Edit Table Modal */}
      <EditTableModal
        isOpen={showEditTableModal}
        onClose={() => {
          setShowEditTableModal(false);
          setPendingEditTable(null);
        }}
        onTableUpdated={handleUpdateTable}
        table={pendingEditTable}
        loading={loading}
      />
    </TabContent>
  );
}