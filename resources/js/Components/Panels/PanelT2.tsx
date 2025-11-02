// resources/js/Components/Panels/PanelT2.tsx - Database Schema Visualizer
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { confirmDialog } from 'primereact/confirmdialog';
import { ConfirmDialog } from 'primereact/confirmdialog';

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
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

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
  onCopy?: (table: SchemaTable) => void;
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
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

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
                title={t.panelt2139}
              >
                ✏️
              </button>
            )}
            {data.onCopy && data.table && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  data.onCopy!(data.table!);
                }}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                title="Copy Table"
              >
                📋
              </button>
            )}
            {data.onDelete && data.isLatestVersion && data.table && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  data.onDelete!(data.table!);
                }}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                title={t.panelt2151}
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
const convertSchemaToNodes = (tables: SchemaTable[], savedLayouts: Record<string, any> = {}, onDeleteTable?: (table: SchemaTable) => void, onEditTable?: (table: SchemaTable) => void, onCopyTable?: (table: SchemaTable) => void, isLatestVersion?: boolean): Node[] => {
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
      onCopy: onCopyTable,
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
            id: `fk-${constraint.id}`,
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
            data: {
              constraintId: constraint.id,
              constraintName: constraint.constraint_name,
              sourceTable: table.table_name,
              targetTable: targetTable.table_name,
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
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

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
  const [showFKActionMenu, setShowFKActionMenu] = useState(false);
  const [showDeleteFKModal, setShowDeleteFKModal] = useState(false);
  const [showEditFKModal, setShowEditFKModal] = useState(false);
  const [showCreateFKModal, setShowCreateFKModal] = useState(false);
  const [selectedFK, setSelectedFK] = useState<{
    constraintId: number;
    constraintName: string;
    sourceTable: string;
    targetTable: string;
  } | null>(null);
  const [editFKName, setEditFKName] = useState('');
  const [editFKOnDelete, setEditFKOnDelete] = useState('NO ACTION');
  const [editFKOnUpdate, setEditFKOnUpdate] = useState('NO ACTION');
  const [createFKSourceTableId, setCreateFKSourceTableId] = useState<number | null>(null);
  const [createFKSourceFieldId, setCreateFKSourceFieldId] = useState<number | null>(null);
  const [createFKTargetTableId, setCreateFKTargetTableId] = useState<number | null>(null);
  const [createFKTargetFieldId, setCreateFKTargetFieldId] = useState<number | null>(null);
  const [createFKName, setCreateFKName] = useState('');
  const [createFKOnDelete, setCreateFKOnDelete] = useState('NO ACTION');
  const [createFKOnUpdate, setCreateFKOnUpdate] = useState('NO ACTION');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteTableName, setPasteTableName] = useState('');
  const [pasteTableData, setPasteTableData] = useState<any>(null);
  // Track selected tables in order of selection for FK creation
  const [selectedTableIds, setSelectedTableIds] = useState<number[]>([]);

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
          throw new Error(t.panelt2405);
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
      const errorMessage = err instanceof Error ? err.message : t.databaseexportmodal71;
      setError(errorMessage);
      
      // If it's an auth error, clear the state
      if (errorMessage.includes(t.panelt2443)) {
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
      setError(err instanceof Error ? err.message : t.databaseexportmodal114);
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
        
        
        const newNodes = convertSchemaToNodes(tables, savedLayouts, handleDeleteTable, handleEditTable, handleCopyTable, isLatestVersion);
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
      setError(err instanceof Error ? err.message : t.panelt2602);
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

  const onEdgeDoubleClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    // Clear any text selection caused by double-click
    window.getSelection()?.removeAllRanges();

    // Only handle FK edges
    if (edge.data && edge.data.constraintId) {
      setSelectedFK({
        constraintId: edge.data.constraintId,
        constraintName: edge.data.constraintName,
        sourceTable: edge.data.sourceTable,
        targetTable: edge.data.targetTable,
      });
      setShowFKActionMenu(true);
    }
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

    // Case 1: No versions exist yet - create initial version first
    if (!selectedVersion) {
      confirmDialog({
        message: 'No version exists yet. Do you want to create the initial version 1?',
        header: 'Create Initial Version',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/floating-schemas/${selectedSchema!.id}/versions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
              },
              body: JSON.stringify({ description: 'Initial version' }),
            });

            if (!response.ok) throw new Error('Failed to create initial version');

            // Reload versions and then open create table modal
            await loadSchemaVersions(selectedSchema!);
            setTimeout(() => setShowCreateTableModal(true), 300);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create initial version');
          } finally {
            setLoading(false);
          }
        },
      });
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
  }, [selectedProject, selectedVersion, selectedSchema, loadSchemaVersions]);

  // Create a new table with modal data
  const handleCreateTable = useCallback(async (tableName: string, fileKeyName: string, fileNameRenamed: string, fileNameShort: string, fields: any[]) => {
    if (!selectedProject || !selectedVersion || !selectedVersion.id) {
      setError(t.panelt2704);
      return;
    }

    setLoading(true);
    try {
      const columns = fields.map(field => ({
        column_name: field.name,
        data_type: field.type,
        field_length: field.length || null,
        is_unsigned: field.unsigned || false,
        is_nullable: field.nullable,
        is_auto_increment: field.autoIncrement,
        is_primary_key: field.constraintType === 'primary',
        is_index: field.constraintType === 'index',
        is_unique: field.constraintType === 'unique',
        comment: field.comment || null,
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
        throw new Error(errorData.message || t.panelt2745);
      }

      // Close modal and refresh the schema to show the new table
      setShowCreateTableModal(false);
      if (selectedSchema) {
        await loadSchemaVersionWithSchema(selectedSchema, selectedVersion);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : t.panelt2745);
    } finally {
      setLoading(false);
    }
  }, [selectedVersion, selectedSchema, loadSchemaVersionWithSchema, selectedProject]);

  // Update an existing table with modal data
  const handleUpdateTable = useCallback(async (tableName: string, fields: any[], fileKeyName: string, fileNameRenamed: string, fileNameShort: string) => {
    if (!selectedProject || !selectedVersion || !selectedVersion.id || !pendingEditTable) {
      setError(t.panelt2764);
      return;
    }

    setLoading(true);
    try {
      const columns = fields.map(field => ({
        column_name: field.name,
        data_type: field.type,
        field_length: field.length || null,
        is_unsigned: field.unsigned || false,
        is_nullable: field.nullable,
        is_auto_increment: field.autoIncrement,
        is_primary_key: field.constraintType === 'primary',
        is_index: field.constraintType === 'index',
        is_unique: field.constraintType === 'unique',
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
        throw new Error(errorData.message || t.schemacontroller810);
      }

      // Close modal and refresh the schema to show the updated table
      setShowEditTableModal(false);
      setPendingEditTable(null);
      if (selectedSchema) {
        await loadSchemaVersionWithSchema(selectedSchema, selectedVersion);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : t.schemacontroller810);
    } finally {
      setLoading(false);
    }
  }, [selectedVersion, selectedSchema, loadSchemaVersionWithSchema, selectedProject, pendingEditTable]);

  // Edit a table in a new version
  const handleEditTableWithNewVersion = useCallback(async () => {
    if (!selectedSchema || !selectedSchema.id || !selectedVersion) {
      setError(t.panelt2826);
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
        throw new Error(t.panelt2841);
      }

      // Reload the schema and versions to get the new version
      await loadFloatingSchemas(selectedSchema.id);

      // Open the table edit modal
      setShowEditTableModal(true);

    } catch (err) {
      // Error creating new version
      setError(err instanceof Error ? err.message : t.panelt2841);
    } finally {
      setShowVersionModal(false);
      setPendingAction(null);
    }
  }, [selectedSchema, selectedVersion, loadFloatingSchemas]);

  // Create a new table in a new version
  const handleCreateTableWithNewVersion = useCallback(async () => {
    if (!selectedSchema || !selectedSchema.id || !selectedVersion) {
      setError(t.panelt2826);
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
        throw new Error(t.panelt2841);
      }

      // Reload the schema and versions to get the new version
      await loadFloatingSchemas(selectedSchema.id);

      // Open the table creation modal
      setShowCreateTableModal(true);

    } catch (err) {
      // Error creating new version
      setError(err instanceof Error ? err.message : t.panelt2841);
    } finally {
      setShowVersionModal(false);
      setPendingAction(null);
    }
  }, [selectedSchema, selectedVersion, loadFloatingSchemas]);

  // Continue editing table in current version
  const handleContinueWithEditTable = useCallback(async () => {
    if (!selectedVersion || !selectedVersion.id) {
      setError(t.panelt2898);
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
      setError(err instanceof Error ? err.message : t.panelt2920);
    } finally {
      setShowVersionModal(false);
      setPendingAction(null);
    }
  }, [selectedVersion]);

  // Continue creating table in current version
  const handleContinueWithCreateTable = useCallback(async () => {
    if (!selectedVersion || !selectedVersion.id) {
      setError(t.panelt2898);
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
      setError(err instanceof Error ? err.message : t.panelt2920);
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

  const handleCopyTable = useCallback(async (table: SchemaTable) => {
    try {
      // Prepare table data for clipboard (exclude Foreign Keys)
      const tableData = {
        _scoriet_table_copy: true, // Marker for validation
        table_name: table.table_name,
        comment: table.comment,
        fields: table.fields?.map(field => ({
          field_name: field.field_name,
          field_type: field.field_type,
          is_nullable: field.is_nullable,
          is_auto_increment: field.is_auto_increment,
          default_value: field.default_value,
          comment: field.comment,
        })) || [],
        constraints: table.constraints
          ?.filter(c => c.constraint_type !== 'FOREIGN KEY')
          ?.map(constraint => ({
            constraint_type: constraint.constraint_type,
            constraint_name: constraint.constraint_name,
            columns: constraint.columns?.map(col => col.field_name) || [],
          })) || [],
      };

      // Copy to clipboard as JSON
      await navigator.clipboard.writeText(JSON.stringify(tableData, null, 2));

      console.log('✅ Table copied to clipboard:', table.table_name);
      // Optional: Show toast notification here
    } catch (err) {
      console.error('Failed to copy table to clipboard:', err);
      setError('Failed to copy table to clipboard. Please check browser permissions.');
    }
  }, []);

  const handlePasteTable = useCallback(async () => {
    if (!pasteTableName.trim() || !selectedVersion || !pasteTableData) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      // Convert field names to match API expectations
      const columns = (pasteTableData.fields || []).map((field: any) => {
        // Check if this field is in primary key constraint
        const isPrimaryKey = pasteTableData.constraints?.some(
          (c: any) => c.constraint_type === 'PRIMARY KEY' && c.columns?.includes(field.field_name)
        ) || false;

        // Check if this field is in unique constraint
        const isUnique = pasteTableData.constraints?.some(
          (c: any) => c.constraint_type === 'UNIQUE' && c.columns?.includes(field.field_name)
        ) || false;

        // Check if this field is in index
        const isIndex = pasteTableData.constraints?.some(
          (c: any) => (c.constraint_type === 'KEY' || c.constraint_type === 'INDEX') && c.columns?.includes(field.field_name)
        ) || false;

        return {
          column_name: field.field_name,
          data_type: field.field_type,
          is_nullable: field.is_nullable,
          is_auto_increment: field.is_auto_increment,
          default_value: field.default_value,
          comment: field.comment,
          is_primary_key: isPrimaryKey,
          is_unique: isUnique,
          is_index: isIndex,
        };
      });

      const response = await fetch(`/api/schema-versions/${selectedVersion.id}/tables`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          table_name: pasteTableName.trim(),
          comment: pasteTableData.comment,
          columns: columns,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to paste table');
      }

      // Close modal and reset state
      setShowPasteModal(false);
      setPasteTableName('');
      setPasteTableData(null);

      // If a new version was created, reload and select it
      if (result.new_version) {
        await loadSchemaVersions(selectedSchema!);
        const newVersion = schemaVersions.find(v => v.version_number === result.new_version.version_number);
        if (newVersion && selectedSchema) {
          setTimeout(() => {
            loadSchemaVersionWithSchema(selectedSchema, newVersion);
          }, 200);
        }
      } else {
        // Just reload current version
        if (selectedSchema && selectedVersion) {
          await loadSchemaVersionWithSchema(selectedSchema, selectedVersion);
        }
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to paste table');
    } finally {
      setLoading(false);
    }
  }, [pasteTableName, pasteTableData, selectedVersion, selectedSchema, schemaVersions, loadSchemaVersions, loadSchemaVersionWithSchema, t.applicationsmodal66]);

  // Keyboard Shortcuts for Copy/Paste
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Only handle Ctrl+C and Ctrl+V (or Cmd on Mac)
      if (!(e.ctrlKey || e.metaKey)) return;

      // Ctrl+C - Copy selected table
      if (e.key === 'c' || e.key === 'C') {
        if (selectedNode && (selectedNode.data as any).table) {
          e.preventDefault();
          const table = (selectedNode.data as any).table;
          await handleCopyTable(table);
        }
      }

      // Ctrl+V - Paste table from clipboard
      if (e.key === 'v' || e.key === 'V') {
        // Don't interfere with normal paste in input fields
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }

        e.preventDefault();

        try {
          // Try to read from clipboard
          const clipboardText = await navigator.clipboard.readText();
          const tableData = JSON.parse(clipboardText);

          if (!tableData._scoriet_table_copy) {
            return; // Silently ignore if not a table
          }

          // Generate suggested name
          const baseName = tableData.table_name;
          const existingTables = nodes.map(n => (n.data as any).table?.table_name).filter(Boolean);
          let suggestedName = `${baseName}_copy`;
          let counter = 2;
          while (existingTables.includes(suggestedName)) {
            suggestedName = `${baseName}_copy_${counter}`;
            counter++;
          }
          setPasteTableName(suggestedName);
          setPasteTableData(tableData);
          setShowPasteModal(true);
        } catch (_err) {
          // Silently ignore errors (clipboard might contain non-JSON data)
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, nodes, handleCopyTable]);

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
        throw new Error(t.panelt21001);
      }

      // Reload the schema version to reflect changes
      if (selectedSchema && selectedVersion) {
        loadSchemaVersionWithSchema(selectedSchema, selectedVersion);
      }
    } catch (err) {
      // Error deleting table
      setError(err instanceof Error ? err.message : t.panelt21001);
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
        setError(t.panelt21030);
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
            throw new Error(t.panelt21054);
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
          setError(err instanceof Error ? err.message : t.panelt21075);
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
        setError(t.panelt21030);
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
        setError(err instanceof Error ? err.message : t.panelt21001);
      } finally {
        setShowVersionModal(false);
        setPendingDeleteTable(null);
        setPendingAction(null);
      }
    }
  }, [selectedVersion, pendingDeleteTable, performDeleteTable, handleContinueWithCreateTable, handleContinueWithEditTable, pendingAction]);

  const handleCreateNewVersion = useCallback(async () => {
    if (!selectedSchema) {
      setError(t.panelt21133);
      return;
    }

    // Calculate version numbers for confirmation
    const currentVersion = selectedSchema.last_version || 0;
    const newVersionNumber = currentVersion + 1;

    // Different message for initial version vs new version
    const message = currentVersion === 0
      ? `Do you want to create the initial version 1 for this schema?`
      : `Do you want to create a new version ${newVersionNumber} from version ${currentVersion}?`;

    // Show confirmation dialog
    confirmDialog({
      message: message,
      header: t.panelt21144,
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          setLoading(true);
          setError(null);

          const token = localStorage.getItem('access_token');
          if (!token) {
            throw new Error(t.applicationsmodal66);
          }

          const response = await fetch(`/api/floating-schemas/${selectedSchema.id}/versions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              description: `New version created manually`
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || errorData.error || t.panelt2841);
          }

          const newVersion = await response.json();

          // Reload schema versions
          await loadSchemaVersions(selectedSchema);

          // Select the newly created version
          setTimeout(() => {
            loadSchemaVersionWithSchema(selectedSchema, newVersion);
          }, 200);

          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : t.panelt2841);
        } finally {
          setLoading(false);
        }
      }
    });
  }, [selectedSchema, loadSchemaVersions, loadSchemaVersionWithSchema]);

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

  const handleDeleteFK = useCallback(async () => {
    if (!selectedFK) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch(`/api/constraints/${selectedFK.constraintId}/foreign-key`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || t.schemacontroller1328);
      }

      // Close modal
      setShowDeleteFKModal(false);
      setSelectedFK(null);

      // If a new version was created, reload and select it
      if (result.new_version) {
        await loadSchemaVersions(selectedSchema!);
        const newVersion = schemaVersions.find(v => v.version_number === result.new_version.version_number);
        if (newVersion && selectedSchema) {
          setTimeout(() => {
            loadSchemaVersionWithSchema(selectedSchema, newVersion);
          }, 200);
        }
      } else {
        // Just reload current version
        if (selectedSchema && selectedVersion) {
          await loadSchemaVersionWithSchema(selectedSchema, selectedVersion);
        }
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.schemacontroller1328);
    } finally {
      setLoading(false);
    }
  }, [selectedFK, selectedSchema, selectedVersion, loadSchemaVersions, loadSchemaVersionWithSchema, schemaVersions]);

  const handleEditFK = useCallback(async () => {
    if (!selectedFK || !editFKName.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch(`/api/constraints/${selectedFK.constraintId}/foreign-key`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          constraint_name: editFKName.trim(),
          on_delete: editFKOnDelete,
          on_update: editFKOnUpdate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to update foreign key');
      }

      // Close modal
      setShowEditFKModal(false);
      setSelectedFK(null);
      setEditFKName('');

      // If a new version was created, reload and select it
      if (result.new_version) {
        await loadSchemaVersions(selectedSchema!);
        const newVersion = schemaVersions.find(v => v.version_number === result.new_version.version_number);
        if (newVersion && selectedSchema) {
          setTimeout(() => {
            loadSchemaVersionWithSchema(selectedSchema, newVersion);
          }, 200);
        }
      } else {
        // Just reload current version
        if (selectedSchema && selectedVersion) {
          await loadSchemaVersionWithSchema(selectedSchema, selectedVersion);
        }
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update foreign key');
    } finally {
      setLoading(false);
    }
  }, [selectedFK, editFKName, selectedSchema, selectedVersion, loadSchemaVersions, loadSchemaVersionWithSchema, schemaVersions, t.applicationsmodal66, editFKOnDelete, editFKOnUpdate]);

  const handleCreateFK = useCallback(async () => {
    if (!createFKSourceFieldId || !createFKTargetFieldId) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      // Get the source table from the source field
      const sourceTable = nodes
        .map(n => (n.data as any).table as SchemaTable | undefined)
        .find(table =>
          table?.fields?.some(f => f.id === createFKSourceFieldId)
        );

      if (!sourceTable) {
        throw new Error('Source table not found');
      }

      const response = await fetch(`/api/tables/${sourceTable.id}/foreign-key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          source_field_id: createFKSourceFieldId,
          target_field_id: createFKTargetFieldId,
          constraint_name: createFKName.trim() || undefined,
          on_delete: createFKOnDelete,
          on_update: createFKOnUpdate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to create foreign key');
      }

      // Close modal and reset state
      setShowCreateFKModal(false);
      setCreateFKSourceTableId(null);
      setCreateFKSourceFieldId(null);
      setCreateFKTargetTableId(null);
      setCreateFKTargetFieldId(null);
      setCreateFKName('');
      setCreateFKOnDelete('NO ACTION');
      setCreateFKOnUpdate('NO ACTION');

      // If a new version was created, reload and select it
      if (result.new_version) {
        await loadSchemaVersions(selectedSchema!);
        const newVersion = schemaVersions.find(v => v.version_number === result.new_version.version_number);
        if (newVersion && selectedSchema) {
          setTimeout(() => {
            loadSchemaVersionWithSchema(selectedSchema, newVersion);
          }, 200);
        }
      } else {
        // Just reload current version
        if (selectedSchema && selectedVersion) {
          await loadSchemaVersionWithSchema(selectedSchema, selectedVersion);
        }
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create foreign key');
    } finally {
      setLoading(false);
    }
  }, [createFKSourceFieldId, createFKTargetFieldId, createFKName, createFKOnDelete, createFKOnUpdate, nodes, selectedSchema, selectedVersion, loadSchemaVersions, loadSchemaVersionWithSchema, schemaVersions, t.applicationsmodal66]);

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
                  ? t.panelt21289
                : selectedProject 
                  ? t.panelt21133
                  : t.databaseexportmodal344
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
              <option value="">{selectedProject ? 'Select Schema' : t.panelt21308}</option>
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
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm transition-colors"
              disabled={loading || !selectedProject}
            >
              🔄 Refresh
            </button>

            <button
              onClick={handleCreateNewVersion}
              className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1.5 rounded text-sm transition-colors"
              disabled={loading || !selectedSchema}
              title={t.panelt21358}
            >
              ➕ New Version
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-sm transition-colors"
              disabled={loading || !selectedProject}
            >
              📥 Import SQL
            </button>

            <button
              onClick={() => {
                // If exactly 2 tables are selected, pre-fill them as Source and Target
                if (selectedTableIds.length === 2) {
                  setCreateFKSourceTableId(selectedTableIds[0]);
                  setCreateFKTargetTableId(selectedTableIds[1]);
                }
                setShowCreateFKModal(true);
              }}
              className="bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded text-sm transition-colors"
              disabled={loading || !selectedSchema || !selectedVersion}
              title="Add Foreign Key relationship (Select 2 tables with Ctrl for auto-fill)"
            >
              🔗 Add FK
            </button>

            <button
              onClick={async () => {
                try {
                  // Try to read from clipboard
                  const clipboardText = await navigator.clipboard.readText();
                  const tableData = JSON.parse(clipboardText);

                  if (!tableData._scoriet_table_copy) {
                    setError('Clipboard does not contain a valid Scoriet table. Please copy a table first.');
                    return;
                  }

                  // If no version exists, create initial version first
                  if (!selectedVersion) {
                    confirmDialog({
                      message: 'No version exists yet. Do you want to create the initial version 1 and paste the table?',
                      header: 'Create Initial Version',
                      icon: 'pi pi-exclamation-triangle',
                      accept: async () => {
                        try {
                          setLoading(true);
                          const token = localStorage.getItem('access_token');
                          const response = await fetch(`/api/floating-schemas/${selectedSchema!.id}/versions`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`,
                              'Accept': 'application/json',
                            },
                            body: JSON.stringify({ description: 'Initial version' }),
                          });

                          if (!response.ok) throw new Error('Failed to create initial version');

                          // Reload versions
                          await loadSchemaVersions(selectedSchema!);

                          // Set paste data and open modal
                          const baseName = tableData.table_name;
                          const existingTables = nodes.map(n => (n.data as any).table?.table_name).filter(Boolean);
                          let suggestedName = `${baseName}_copy`;
                          let counter = 2;
                          while (existingTables.includes(suggestedName)) {
                            suggestedName = `${baseName}_copy_${counter}`;
                            counter++;
                          }
                          setPasteTableName(suggestedName);
                          setPasteTableData(tableData);
                          setTimeout(() => setShowPasteModal(true), 300);
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Failed to create initial version');
                        } finally {
                          setLoading(false);
                        }
                      },
                    });
                    return;
                  }

                  // Generate suggested name
                  const baseName = tableData.table_name;
                  const existingTables = nodes.map(n => (n.data as any).table?.table_name).filter(Boolean);
                  let suggestedName = `${baseName}_copy`;
                  let counter = 2;
                  while (existingTables.includes(suggestedName)) {
                    suggestedName = `${baseName}_copy_${counter}`;
                    counter++;
                  }
                  setPasteTableName(suggestedName);
                  setPasteTableData(tableData);
                  setShowPasteModal(true);
                } catch (_err) {
                  setError('No valid table found in clipboard. Please copy a table first.');
                }
              }}
              className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-sm transition-colors"
              disabled={loading || !selectedSchema}
              title="Paste table from clipboard"
            >
              📥 Paste Table
            </button>

            <button
              onClick={handleCreateNewTable}
              className="bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded text-sm transition-colors"
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
                        
                        if (positionChange && t.panelt21439 in positionChange && positionChange.positionAbsolute) {
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
              onEdgeDoubleClick={onEdgeDoubleClick}
              onSelectionChange={(params) => {
                // Track selected table IDs in order of selection
                const newlySelectedNodes = params.nodes;
                const newSelectedIds = newlySelectedNodes
                  .map(node => (node.data as any).table?.id)
                  .filter((id): id is number => id !== undefined);

                // Only update if selection actually changed (compare sets, not order)
                setSelectedTableIds(prevIds => {
                  // Check if sets are equal (same IDs, regardless of order)
                  if (prevIds.length === newSelectedIds.length &&
                      prevIds.every(id => newSelectedIds.includes(id))) {
                    return prevIds; // No change, return same reference to prevent re-render
                  }

                  // Preserve order: keep existing selections in their order, add new ones at the end
                  const updatedIds: number[] = [];

                  // First, keep previously selected IDs that are still selected (in their original order)
                  prevIds.forEach(id => {
                    if (newSelectedIds.includes(id)) {
                      updatedIds.push(id);
                    }
                  });

                  // Then add newly selected IDs (that weren't selected before)
                  newSelectedIds.forEach(id => {
                    if (!updatedIds.includes(id)) {
                      updatedIds.push(id);
                    }
                  });

                  return updatedIds;
                });
              }}
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
                        ? t.panelt21528
                        : floatingSchemas.length === 0
                          ? t.panelt21530
                          : t.panelt21531
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
            ? t.panelt21595
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

      {/* FK Action Menu */}
      {showFKActionMenu && selectedFK && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 999999, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 border border-gray-600">
            <h3 className="text-lg font-bold text-white mb-4">Foreign Key Actions</h3>

            <div className="mb-6">
              <div className="bg-gray-700 p-3 rounded border border-gray-600">
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-gray-400">From:</span>{' '}
                    <span className="text-blue-400 font-mono">{selectedFK.sourceTable}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">To:</span>{' '}
                    <span className="text-green-400 font-mono">{selectedFK.targetTable}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {selectedFK.constraintName}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowFKActionMenu(false);
                  setEditFKName(selectedFK.constraintName);
                  setShowEditFKModal(true);
                }}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center justify-center gap-2"
              >
                ✏️ Edit Foreign Key
              </button>

              <button
                onClick={() => {
                  setShowFKActionMenu(false);
                  setShowDeleteFKModal(true);
                }}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center justify-center gap-2"
              >
                🗑️ Delete Foreign Key
              </button>

              <button
                onClick={() => {
                  setShowFKActionMenu(false);
                  setSelectedFK(null);
                }}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete FK Modal */}
      {showDeleteFKModal && selectedFK && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 999999, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-600">
            <h3 className="text-xl font-bold text-white mb-4">Delete Foreign Key</h3>

            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                Are you sure you want to delete this foreign key constraint?
              </p>

              <div className="bg-gray-700 p-4 rounded border border-gray-600">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Constraint:</span>{' '}
                    <span className="text-white font-mono">{selectedFK.constraintName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">From:</span>{' '}
                    <span className="text-blue-400 font-mono">{selectedFK.sourceTable}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">To:</span>{' '}
                    <span className="text-green-400 font-mono">{selectedFK.targetTable}</span>
                  </div>
                </div>
              </div>

              {!selectedVersion || selectedVersion.version_number !== selectedSchema?.last_version ? (
                <div className="mt-4 p-3 bg-yellow-900 bg-opacity-50 border border-yellow-600 rounded text-yellow-200 text-sm">
                  ⚠️ A new version will be created for this change.
                </div>
              ) : null}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteFKModal(false);
                  setSelectedFK(null);
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFK}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? t.deleting : t.panelt21689}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit FK Modal */}
      {showEditFKModal && selectedFK && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 999999, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 border border-gray-600">
            <h3 className="text-xl font-bold text-white mb-4">Edit Foreign Key</h3>

            <div className="mb-6">
              {/* FK Info Display */}
              <div className="bg-gray-700 p-4 rounded border border-gray-600 mb-4">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">From Table:</span>{' '}
                    <span className="text-blue-400 font-mono">{selectedFK.sourceTable}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">To Table:</span>{' '}
                    <span className="text-green-400 font-mono">{selectedFK.targetTable}</span>
                  </div>
                </div>
              </div>

              {/* FK Name Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Constraint Name *
                </label>
                <input
                  type="text"
                  value={editFKName}
                  onChange={(e) => setEditFKName(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="fk_table1_table2"
                />
              </div>

              {/* Referential Actions */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ON DELETE
                  </label>
                  <select
                    value={editFKOnDelete}
                    onChange={(e) => setEditFKOnDelete(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="NO ACTION">NO ACTION</option>
                    <option value="CASCADE">CASCADE</option>
                    <option value="RESTRICT">RESTRICT</option>
                    <option value="SET NULL">SET NULL</option>
                    <option value="SET DEFAULT">SET DEFAULT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ON UPDATE
                  </label>
                  <select
                    value={editFKOnUpdate}
                    onChange={(e) => setEditFKOnUpdate(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="NO ACTION">NO ACTION</option>
                    <option value="CASCADE">CASCADE</option>
                    <option value="RESTRICT">RESTRICT</option>
                    <option value="SET NULL">SET NULL</option>
                    <option value="SET DEFAULT">SET DEFAULT</option>
                  </select>
                </div>
              </div>

              {!selectedVersion || selectedVersion.version_number !== selectedSchema?.last_version ? (
                <div className="mt-4 p-3 bg-yellow-900 bg-opacity-50 border border-yellow-600 rounded text-yellow-200 text-sm">
                  ⚠️ A new version will be created for this change.
                </div>
              ) : null}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditFKModal(false);
                  setSelectedFK(null);
                  setEditFKName('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleEditFK}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
                disabled={loading || !editFKName.trim()}
              >
                {loading ? t.saving : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create FK Modal */}
      {showCreateFKModal && (() => {
        // Extract tables from nodes
        const availableTables = nodes
          .map(n => (n.data as any).table as SchemaTable | undefined)
          .filter((t): t is SchemaTable => !!t);

        // Get fields for selected source table
        const sourceTableFields = createFKSourceTableId
          ? availableTables.find(t => t.id === createFKSourceTableId)?.fields || []
          : [];

        // Get fields for selected target table
        const targetTableFields = createFKTargetTableId
          ? availableTables.find(t => t.id === createFKTargetTableId)?.fields || []
          : [];

        return (
          <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 999999, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 border border-gray-600">
              <h3 className="text-xl font-bold text-white mb-4">Create Foreign Key</h3>

              <div className="space-y-4">
                {/* Source Table and Field */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Source Table
                    </label>
                    <select
                      value={createFKSourceTableId || ''}
                      onChange={(e) => {
                        setCreateFKSourceTableId(e.target.value ? parseInt(e.target.value) : null);
                        setCreateFKSourceFieldId(null); // Reset field when table changes
                      }}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select table...</option>
                      {availableTables.map(table => (
                        <option key={table.id} value={table.id}>{table.table_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Source Field
                    </label>
                    <select
                      value={createFKSourceFieldId || ''}
                      onChange={(e) => setCreateFKSourceFieldId(e.target.value ? parseInt(e.target.value) : null)}
                      disabled={loading || !createFKSourceTableId}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="">Select field...</option>
                      {sourceTableFields.map(field => (
                        <option key={field.id} value={field.id}>
                          {field.field_name} ({field.field_type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Target Table and Field */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Target Table (Referenced)
                    </label>
                    <select
                      value={createFKTargetTableId || ''}
                      onChange={(e) => {
                        setCreateFKTargetTableId(e.target.value ? parseInt(e.target.value) : null);
                        setCreateFKTargetFieldId(null); // Reset field when table changes
                      }}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select table...</option>
                      {availableTables.map(table => (
                        <option key={table.id} value={table.id}>{table.table_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Target Field (Referenced)
                    </label>
                    <select
                      value={createFKTargetFieldId || ''}
                      onChange={(e) => setCreateFKTargetFieldId(e.target.value ? parseInt(e.target.value) : null)}
                      disabled={loading || !createFKTargetTableId}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="">Select field...</option>
                      {targetTableFields.map(field => (
                        <option key={field.id} value={field.id}>
                          {field.field_name} ({field.field_type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Constraint Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Constraint Name (optional)
                  </label>
                  <input
                    type="text"
                    value={createFKName}
                    onChange={(e) => setCreateFKName(e.target.value)}
                    disabled={loading}
                    placeholder="Auto-generated if empty"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Referential Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      ON DELETE
                    </label>
                    <select
                      value={createFKOnDelete}
                      onChange={(e) => setCreateFKOnDelete(e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="NO ACTION">NO ACTION</option>
                      <option value="CASCADE">CASCADE</option>
                      <option value="RESTRICT">RESTRICT</option>
                      <option value="SET NULL">SET NULL</option>
                      <option value="SET DEFAULT">SET DEFAULT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      ON UPDATE
                    </label>
                    <select
                      value={createFKOnUpdate}
                      onChange={(e) => setCreateFKOnUpdate(e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="NO ACTION">NO ACTION</option>
                      <option value="CASCADE">CASCADE</option>
                      <option value="RESTRICT">RESTRICT</option>
                      <option value="SET NULL">SET NULL</option>
                      <option value="SET DEFAULT">SET DEFAULT</option>
                    </select>
                  </div>
                </div>

                {!selectedVersion || selectedVersion.version_number !== selectedSchema?.last_version ? (
                  <div className="mt-4 p-3 bg-yellow-900 bg-opacity-50 border border-yellow-600 rounded text-yellow-200 text-sm">
                    ⚠️ A new version will be created for this change.
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateFKModal(false);
                    setCreateFKSourceTableId(null);
                    setCreateFKSourceFieldId(null);
                    setCreateFKTargetTableId(null);
                    setCreateFKTargetFieldId(null);
                    setCreateFKName('');
                    setCreateFKOnDelete('NO ACTION');
                    setCreateFKOnUpdate('NO ACTION');
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFK}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors disabled:opacity-50"
                  disabled={loading || !createFKSourceFieldId || !createFKTargetFieldId}
                >
                  {loading ? t.saving : 'Create Foreign Key'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Paste Table Modal */}
      {showPasteModal && pasteTableData && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 999999, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 border border-gray-600">
            <h3 className="text-xl font-bold text-white mb-4">Paste Table: {pasteTableData.table_name}</h3>

            <div className="space-y-4">
              {/* New Table Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Table Name
                </label>
                <input
                  type="text"
                  value={pasteTableName}
                  onChange={(e) => setPasteTableName(e.target.value)}
                  disabled={loading}
                  placeholder="Enter new table name"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Preview of what will be copied */}
              <div className="p-4 bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-300 mb-2">What will be pasted:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>✅ {pasteTableData.fields?.length || 0} Fields</li>
                  <li>✅ Primary Key</li>
                  <li>✅ Unique Constraints</li>
                  <li>✅ Indexes</li>
                  <li>❌ Foreign Keys (add manually after)</li>
                </ul>
              </div>

              {!selectedVersion || selectedVersion.version_number !== selectedSchema?.last_version ? (
                <div className="mt-4 p-3 bg-yellow-900 bg-opacity-50 border border-yellow-600 rounded text-yellow-200 text-sm">
                  ⚠️ A new version will be created for this change.
                </div>
              ) : null}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPasteModal(false);
                  setPasteTableName('');
                  setPasteTableData(null);
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handlePasteTable}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                disabled={loading || !pasteTableName.trim()}
              >
                {loading ? t.saving : 'Paste Table'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PrimeReact ConfirmDialog for version creation confirmation */}
      <ConfirmDialog />
    </TabContent>
  );
}