// resources/js/Components/Panels/PanelT2.tsx - Database Schema Visualizer
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { confirmDialog } from 'primereact/confirmdialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';

// TypeScript declaration for window timeout
declare global {
  interface Window {
    layoutSaveTimeout?: NodeJS.Timeout;
  }
}
import {
  ReactFlow,
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
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TabContentProps } from '@/types';
import { SchemaTable } from '@/lib/api';
import SqlImportModal from '@/Components/SqlImportModal';
import VersionConfirmationModal from '@/Components/VersionConfirmationModal';
import TableModal from '@/Components/Modals/TableModal';
import DeleteVersionDialog from '@/Components/Panels/DeleteVersionDialog';
import { useProject } from '@/contexts/ProjectContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface FloatingSchema {
  id: number;
  name: string;
  description?: string;
  last_version: number;
  association_type: 'linked' | 'cloned' | 'imported';
  alias?: string;
  owner_id?: number;
  is_system_schema?: boolean;
  visibility?: 'public' | 'private';
}

interface SchemaVersionExtended {
  id: number;
  schema_id?: number;
  version_name: string;
  version_number?: number;
  description?: string;
  imported_at?: string;
  created_at?: string;
  display_name?: string;
  has_unsaved_changes?: boolean;
  tables_count?: number;
  tables?: unknown[];
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
  isReadOnly?: boolean;
  [key: string]: unknown; // Index signature for xyflow v12 compatibility
}

// Custom node type for xyflow v12
type DatabaseNode = Node<DatabaseNodeData, 'database'>;

interface DatabaseNodeProps {
  data: DatabaseNodeData;
  selected: boolean;
}

const TabContent: React.FC<TabContentProps> = ({ children, style = {} }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { colors } = useTheme();
  const setFocus = () => ref.current?.focus();

  return (
    <div
      ref={ref}
      tabIndex={-1}
      style={{
        flex: 1,
        padding: '0',
        height: '100%',
        backgroundColor: colors.bgPrimary,
        color: colors.textPrimary,
        '--theme-bg-primary': colors.bgPrimary,
        '--theme-bg-secondary': colors.bgSecondary,
        '--theme-bg-tertiary': colors.bgTertiary,
        '--theme-text-primary': colors.textPrimary,
        '--theme-text-muted': colors.textMuted,
        '--theme-border-primary': colors.borderPrimary,
        '--theme-accent': colors.accent,
        ...style
      } as React.CSSProperties}
      onMouseDownCapture={setFocus}
      onTouchStartCapture={setFocus}
      className="panelt2-container"
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
  const { colors } = useTheme();

  return (
    <div
      className="shadow-lg rounded-lg border-2 w-full h-full flex flex-col"
      style={{
        minWidth: 250,
        minHeight: 150,
        backgroundColor: selected ? colors.bgTertiary : colors.bgSecondary,
        borderColor: selected ? colors.accent : colors.borderPrimary
      }}
    >
      {/* Node Resizer - only show when selected AND not read-only */}
      {selected && !data.isReadOnly && (
        <NodeResizer
          color={colors.accent}
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
      <div className="px-3 py-2 rounded-t-lg flex-shrink-0" style={{ backgroundColor: colors.accent }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-lg mr-2">🗃️</div>
            <div className="text-sm font-bold text-white">{data.tableName}</div>
          </div>
          <div className="flex items-center gap-1">
            {data.onEdit && data.isLatestVersion && data.table && !data.isReadOnly && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  data.onEdit!(data.table!);
                }}
                className="px-2 py-1 text-white text-xs rounded transition-colors hover:opacity-80"
                style={{ backgroundColor: colors.accent }}
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
                className="px-2 py-1 text-white text-xs rounded transition-colors hover:opacity-80"
                style={{ backgroundColor: colors.accent }}
                title={t.panelt2194}
              >
                📋
              </button>
            )}
            {data.onDelete && data.isLatestVersion && data.table && !data.isReadOnly && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  data.onDelete!(data.table!);
                }}
                className="px-2 py-1 text-white text-xs rounded transition-colors hover:opacity-80"
                style={{ backgroundColor: colors.accent }}
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
                  <span className="font-mono truncate" style={{ color: colors.textPrimary }}>{field.name}</span>
                </div>
                <div className="text-right flex-shrink-0 ml-2" style={{ color: colors.textMuted }}>
                  <span className="truncate">{field.type}</span>
                  {!field.nullable && <span style={{ color: colors.errorText }}> NOT NULL</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-center" style={{ color: colors.textMuted }}>{t.panelt2235}</div>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: colors.accent, width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: colors.accent, width: 8, height: 8 }}
      />
    </div>
  );
};

// Node Types
const nodeTypes = {
  database: DatabaseNode,
};

// Helper functions
const convertSchemaToNodes = (tables: SchemaTable[], savedLayouts: Record<string, any> = {}, onDeleteTable?: (table: SchemaTable) => void, onEditTable?: (table: SchemaTable) => void, onCopyTable?: (table: SchemaTable) => void, isLatestVersion?: boolean, isReadOnly?: boolean): DatabaseNode[] => {
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
      isReadOnly: isReadOnly,
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
      draggable: !isReadOnly,
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
  isReadOnly?: boolean;
}

export default function PanelT2({ preSelectedSchemaId, isReadOnly = false }: PanelT2Props) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();

  // Toast ref for success/info messages
  const toast = useRef<Toast>(null);

  // ReactFlow instance ref for programmatic control (fitView after sort, etc.)
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // Database Designer Access State (Premium Feature)
  const [databaseDesignerAccess, setDatabaseDesignerAccess] = useState<{
    has_access: boolean;
    access_type?: string;
    unlock_cost?: number;
    days_remaining?: number;
    is_patron?: boolean;
  } | null>(null);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [unlocking, setUnlocking] = useState(false);

  const { selectedProject } = useProject();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [floatingSchemas, setFloatingSchemas] = useState<FloatingSchema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<FloatingSchema | null>(null);

  // Compute read-only mode: Simple rule - only owner can edit
  const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
  const effectiveReadOnly = React.useMemo(() => {
    // If explicitly set via prop, use that
    if (isReadOnly) return true;

    // If no schema selected, not read-only
    if (!selectedSchema) return false;

    // Only the owner can edit their schema - explicit string conversion like PHP
    const isOwner = String(selectedSchema.owner_id) === String(currentUserId);
    return !isOwner;
  }, [isReadOnly, selectedSchema, currentUserId]);
  const [schemaVersions, setSchemaVersions] = useState<SchemaVersionExtended[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<SchemaVersionExtended | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showDeleteVersionDialog, setShowDeleteVersionDialog] = useState(false);
  const [tableModalMode, setTableModalMode] = useState<'create' | 'edit' | null>(null);
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
  // FK Suggestions
  const [showFKSuggestionsModal, setShowFKSuggestionsModal] = useState(false);
  const [fkSuggestions, setFkSuggestions] = useState<Array<{
    source_table_id: number;
    source_table_name: string;
    source_field_id: number;
    source_field_name: string;
    source_field_type: string;
    target_table_id: number;
    target_table_name: string;
    target_field_id: number;
    target_field_name: string;
    target_field_type: string;
    match_score: number;
    is_compatible: boolean;
    compatibility_warning: string | null;
  }>>([]);
  const [loadingFKSuggestions, setLoadingFKSuggestions] = useState(false);
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
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      // Load schemas associated with the current project
      const response = await fetch(`/api/projects/${selectedProject.id}/schemas`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(t.panelt2405);
        }
        throw new Error(`${t.panelt2538}${response.statusText}`);
      }

      const schemas = await response.json();
      setFloatingSchemas(schemas);

      // If we're preserving a specific schema ID, find and select it
      if (preserveSchemaId) {
        const schemaToPreserve = schemas.find((s: FloatingSchema) => s.id === preserveSchemaId);
        if (schemaToPreserve) {
          setSelectedSchema(schemaToPreserve);
          return schemas; // Return schemas array
        }
      }

      // Auto-select schema based on priority:
      // 1. preSelectedSchemaId (from props)
      // 2. Last selected schema from localStorage
      // 3. First schema in the list
      if (!selectedSchema) {
        let schemaToSelect: FloatingSchema | undefined;

        // Priority 1: preSelectedSchemaId from props
        if (preSelectedSchemaId) {
          schemaToSelect = schemas.find((s: FloatingSchema) => s.id === preSelectedSchemaId);
        }

        // Priority 2: Last selected schema from localStorage
        if (!schemaToSelect) {
          const lastSelectedSchemaId = localStorage.getItem('last_selected_schema_id');
          if (lastSelectedSchemaId) {
            schemaToSelect = schemas.find((s: FloatingSchema) => s.id === parseInt(lastSelectedSchemaId));
          }
        }

        // Priority 3: First schema in the list
        if (!schemaToSelect && schemas.length > 0) {
          schemaToSelect = schemas[0];
        }

        if (schemaToSelect) {
          setSelectedSchema(schemaToSelect);
        }
      }

      return schemas;
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
      return [];
    } finally {
      setLoading(false);
    }

  }, [selectedProject, preSelectedSchemaId]); // selectedSchema dependency would cause infinite loop

  // Save layout to backend
  const saveLayout = useCallback(async (nodes: Node[]) => {
    if (!selectedSchema || !selectedVersion) return;

    const layouts = nodes.map(node => ({
      table_name: node.data.tableName,
      x_position: node.position.x,
      y_position: node.position.y,
      width: node.measured?.width ?? node.width ?? null,
      height: node.measured?.height ?? node.height ?? null
    }));

    try {
      const response = await fetch(
        `/api/floating-schemas/${selectedSchema.id}/layouts/${selectedVersion.version_number}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
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
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
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
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`${t.panelt2677}${response.statusText}`);
      }

      const versions: SchemaVersionExtended[] = await response.json();
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

  }, []); // Dependencies would cause circular dependency

  // Load schema version with explicit schema parameter (solves state timing issues)
  const loadSchemaVersionWithSchema = useCallback(async (schema: FloatingSchema, version: SchemaVersionExtended) => {
    try {
      setLoading(true);

      // FIRST: Set the selected version so it's available
      setSelectedVersion(version);

      const response = await fetch(`/api/schema-versions/${version.id}/tables`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`${t.panelt2723}${response.statusText}`);
      }

      const tables = await response.json();

      if (tables && tables.length > 0) {
        // Load saved layouts for this version with explicit schema parameter
        const savedLayouts = await loadLayoutForVersion(schema, version);

        // Check if this is the latest version - use the passed parameters, not state
        // Use Number() to handle MariaDB string/number type mismatch
        const isLatestVersion = schema && version &&
          Number(version.version_number) === Number(schema.last_version);

        // Calculate read-only mode based on schema ownership
        const userId = parseInt(localStorage.getItem('user_id') || '0');
        const isReadOnlyMode = String(schema.owner_id) !== String(userId); // Explicit string conversion like PHP

        const newNodes = convertSchemaToNodes(tables, savedLayouts, handleDeleteTable, handleEditTable, handleCopyTable, isLatestVersion, isReadOnlyMode);
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

  }, []); // Dependencies would cause infinite re-renders


  // Load Database Designer access status on mount
  useEffect(() => {
    const loadDatabaseDesignerAccess = async () => {
      setLoadingAccess(true);
      try {
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (!token) {
          setLoadingAccess(false);
          return;
        }

        const response = await fetch('/api/subscriptions/database-designer/status', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setDatabaseDesignerAccess(data);
        }
      } catch (error) {
        console.error(t.panelt2783, error);
      } finally {
        setLoadingAccess(false);
      }
    };

    loadDatabaseDesignerAccess();
  }, []);

  // Unlock Database Designer with credits
  const unlockDatabaseDesigner = async () => {
    setUnlocking(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/subscriptions/unlock-database-designer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDatabaseDesignerAccess(data.access_status);
      } else {
        const errorData = await response.json();
        alert(errorData.message || t.panelt2813);
      }
    } catch (err) {
      console.error(t.panelt2816, err);
      alert(t.panelt2817);
    } finally {
      setUnlocking(false);
    }
  };

  // Load floating schemas when project changes
  useEffect(() => {
    if (databaseDesignerAccess?.has_access) {
      loadFloatingSchemas();
    }
  }, [loadFloatingSchemas, databaseDesignerAccess?.has_access]);

  // Auto-select schema when preSelectedSchemaId is provided
  useEffect(() => {
    if (preSelectedSchemaId && floatingSchemas.length > 0) {
      const preSelectedSchema = floatingSchemas.find(schema => Number(schema.id) === Number(preSelectedSchemaId));
      if (preSelectedSchema && (!selectedSchema || Number(selectedSchema.id) !== Number(preSelectedSchemaId))) {
        setSelectedSchema(preSelectedSchema);
      }
    }

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

  // Save selected schema ID to localStorage when it changes
  useEffect(() => {
    if (selectedSchema) {
      localStorage.setItem('last_selected_schema_id', selectedSchema.id.toString());
    }
  }, [selectedSchema]);

  // Update nodes when effectiveReadOnly changes
  useEffect(() => {
    // Only update if we have nodes and a selected version
    setNodes(currentNodes => {
      if (currentNodes.length === 0 || !selectedVersion || !selectedSchema) {
        return currentNodes;
      }

      // Update each node's data.isReadOnly property
      return currentNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          isReadOnly: effectiveReadOnly
        },
        draggable: !effectiveReadOnly
      }));
    });
  }, [effectiveReadOnly, selectedVersion, selectedSchema]);

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
      const edgeData = edge.data as { constraintId: number; constraintName: string; sourceTable: string; targetTable: string };
      setSelectedFK({
        constraintId: edgeData.constraintId,
        constraintName: edgeData.constraintName,
        sourceTable: edgeData.sourceTable,
        targetTable: edgeData.targetTable,
      });
      setShowFKActionMenu(true);
    }
  }, []);

  const handleImportSuccess = async (result: any) => {
    // Reload floating schemas to include the new one
    const schemas = await loadFloatingSchemas();

    // Automatically load the imported schema with the new version (including generated layout)
    if (result.schema_id && result.version_number) {
      const importedSchema = schemas.find((s: FloatingSchema) => s.id === result.schema_id);
      if (importedSchema) {
        setSelectedSchema(importedSchema);

        // Load versions for this schema
        const versions = await loadSchemaVersions(importedSchema);

        // Find and load the newly created version
        const newVersion = versions.find(v => Number(v.version_number) === Number(result.version_number));
        if (newVersion) {
          await loadSchemaVersionWithSchema(importedSchema, newVersion);
        }
      }
    }
  };

  // Handle creating a new table with smart version detection
  const handleCreateNewTable = useCallback(() => {
    if (!selectedProject) return;

    // Case 1: No versions exist yet - create initial version first
    if (!selectedVersion) {
      confirmDialog({
        group: 'panelt2',
        message: t.panelt2947,
        header: t.panelt2948,
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          try {
            setLoading(true);
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            const response = await fetch(`/api/floating-schemas/${selectedSchema!.id}/versions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
              },
              body: JSON.stringify({ description: 'Initial version' }),
            });

            if (!response.ok) throw new Error(t.panelt2964);

            // Reload versions and then open create table modal
            await loadSchemaVersions(selectedSchema!);
            setTimeout(() => setTableModalMode('create'), 300);
          } catch (err) {
            setError(err instanceof Error ? err.message : t.panelt2970);
          } finally {
            setLoading(false);
          }
        },
      });
      return;
    }

    // Case 2: Version exists but has unsaved changes - open modal directly
    if (selectedVersion.has_unsaved_changes === true) {
      setTableModalMode('create');
      return;
    }

    // Case 3: Clean version exists - ask user about creating new version
    setPendingAction('create');
    setShowVersionModal(true);
    setPendingDeleteTable(null); // Clear any pending delete action
  }, [selectedProject, selectedVersion, selectedSchema, loadSchemaVersions]);

  // Create a new table with modal data
  const handleCreateTable = useCallback(async (tableName: string, fields: any[], fileKeyName: string, fileNameRenamed: string, fileNameShort: string) => {
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
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
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
      setTableModalMode(null);
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
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
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
      setTableModalMode(null);
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
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(t.panelt2841);
      }

      // Reload the schema and versions to get the new version
      await loadFloatingSchemas(selectedSchema.id);

      // Open the table edit modal
      setTableModalMode('edit');

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
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(t.panelt2841);
      }

      // Reload the schema and versions to get the new version
      await loadFloatingSchemas(selectedSchema.id);

      // Open the table creation modal
      setTableModalMode('create');

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
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      // Update local state
      setSelectedVersion(prev => prev ? { ...prev, has_unsaved_changes: true } : null);

      // Open the table edit modal
      setTableModalMode('edit');

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
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      // Update local state
      setSelectedVersion(prev => prev ? { ...prev, has_unsaved_changes: true } : null);

      // Open the table creation modal
      setTableModalMode('create');

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

  }, []); // Dependencies would cause infinite re-renders

  const handleEditTable = useCallback((table: SchemaTable) => {
    setPendingEditTable(table);
    setPendingAction('edit');

    // Check if we should show version confirmation modal
    if (!selectedVersion?.has_unsaved_changes) {
      setShowVersionModal(true);
    } else {
      // Directly open edit modal if already marked as having changes
      setTableModalMode('edit');
    }

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

      // Table copied successfully
    } catch (err) {
      console.error(t.panelt21312, err);
      setError(t.panelt21313);
    }
  }, []);

  const handlePasteTable = useCallback(async () => {
    if (!pasteTableName.trim() || !selectedVersion || !pasteTableData) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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
        throw new Error(result.message || result.error || t.panelt21376);
      }

      // Close modal and reset state
      setShowPasteModal(false);
      setPasteTableName('');
      setPasteTableData(null);

      // If a new version was created, reload and select it
      if (result.new_version) {
        await loadSchemaVersions(selectedSchema!);
        const newVersion = schemaVersions.find(v => Number(v.version_number) === Number(result.new_version.version_number));
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
      setError(err instanceof Error ? err.message : t.panelt21402);
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
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(t.panelt21001);
      }

      const result = await response.json();

      // Show info message if FK constraints were deleted
      if (result.deleted_fks && result.deleted_fks > 0) {
        toast.current?.show({
          severity: 'info',
          summary: t.panelt21485,
          detail: `${result.deleted_fks}${t.panelt21486}"${table.table_name}"${t.panelt21486_2}`,
          life: 5000,
        });
      } else {
        // Success message for normal deletion
        toast.current?.show({
          severity: 'success',
          summary: t.panelt21493,
          detail: `${t.panelt21494}"${table.table_name}"${t.panelt21494_2}`,
          life: 3000,
        });
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
      const confirmMessage = `${t.panelt21530}"${pendingDeleteTable.table_name}" (ID: ${pendingDeleteTable.id})${t.panelt21530_2}`;
      if (!confirm(confirmMessage)) {
        return;
      }

      try {
        // Use the new API endpoint that creates version copy AND deletes table in one operation
        const response = await fetch(`/api/schema-versions/${selectedVersion.id}/tables/${pendingDeleteTable.id}/delete-with-copy`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
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
          // Show info message if FK constraints were deleted
          if (result.deleted_fks && result.deleted_fks > 0) {
            toast.current?.show({
              severity: 'info',
              summary: t.panelt21559,
              detail: `${result.deleted_fks}${t.panelt21560}"${pendingDeleteTable.table_name}"${t.panelt21560_2}`,
              life: 5000,
            });
          } else {
            // Success message for normal deletion
            toast.current?.show({
              severity: 'success',
              summary: t.panelt21567,
              detail: `${t.panelt21568}"${pendingDeleteTable.table_name}"${t.panelt21568_2}`,
              life: 3000,
            });
          }

          // Reload floating schemas to update last_version
          await loadFloatingSchemas();

          // Reload schema versions to get the new version
          const newVersions = await loadSchemaVersions(selectedSchema);
          const newVersion = newVersions?.find((v: SchemaVersionExtended) => Number(v.version_number) === Number(result.new_version_number));

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
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
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
      ? `${t.panelt21656}`
      : `${t.panelt21657}${newVersionNumber}${t.panelt21657_2}${currentVersion}?`;

    // Show confirmation dialog
    confirmDialog({
      group: 'panelt2',
      message: message,
      header: t.panelt21144,
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          setLoading(true);
          setError(null);

          const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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
              description: `${t.panelt21682}`
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

  const handleDeleteVersion = useCallback(async (versionId: number) => {
    if (!selectedSchema) {
      setError(t.panelt21740);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.panelt21752);
      }

      const response = await fetch(`/api/floating-schemas/${selectedSchema.id}/versions/${versionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || t.panelt21765);
      }

      const result = await response.json();

      // Reload floating schemas to update last_version in the schema
      await loadFloatingSchemas(selectedSchema.id);

      // Reload schema versions
      await loadSchemaVersions(selectedSchema);

      // If we deleted the currently selected version, select the latest remaining version
      if (selectedVersion?.id === versionId) {
        const remainingVersions = schemaVersions.filter(v => v.id !== versionId);
        if (remainingVersions.length > 0) {
          // Use the new_last_version from backend response if available
          const newLastVersionNumber = result.new_last_version;
          const latestVersion = newLastVersionNumber
            ? remainingVersions.find(v => Number(v.version_number) === Number(newLastVersionNumber))
            : remainingVersions.reduce((latest, current) =>
                (current.version_number || 0) > (latest.version_number || 0) ? current : latest
              );
          if (latestVersion) {
            setTimeout(() => {
              loadSchemaVersionWithSchema(selectedSchema, latestVersion);
            }, 200);
          }
        } else {
          // No versions left, clear diagram
          setNodes([]);
          setEdges([]);
          setSelectedVersion(null);
        }
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.panelt21802);
    } finally {
      setLoading(false);
    }
  }, [selectedSchema, selectedVersion, schemaVersions, loadFloatingSchemas, loadSchemaVersions, loadSchemaVersionWithSchema, setNodes, setEdges]);

  const handleDeleteFK = useCallback(async () => {
    if (!selectedFK) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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
        const newVersion = schemaVersions.find(v => Number(v.version_number) === Number(result.new_version.version_number));
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

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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
        throw new Error(result.message || result.error || t.panelt21891);
      }

      // Close modal
      setShowEditFKModal(false);
      setSelectedFK(null);
      setEditFKName('');

      // If a new version was created, reload and select it
      if (result.new_version) {
        await loadSchemaVersions(selectedSchema!);
        const newVersion = schemaVersions.find(v => Number(v.version_number) === Number(result.new_version.version_number));
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
      setError(err instanceof Error ? err.message : t.panelt21917);
    } finally {
      setLoading(false);
    }
  }, [selectedFK, editFKName, selectedSchema, selectedVersion, loadSchemaVersions, loadSchemaVersionWithSchema, schemaVersions, t.applicationsmodal66, editFKOnDelete, editFKOnUpdate]);

  const handleCreateFK = useCallback(async () => {
    if (!createFKSourceFieldId || !createFKTargetFieldId) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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
        throw new Error(t.panelt21943);
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
        // Show more specific error for incompatible types or SET NULL on NOT NULL
        if (result.error_type === 'incompatible_types' || result.error_type === 'set_null_on_not_null') {
          throw new Error(result.message);
        }
        throw new Error(result.message || result.error || t.panelt21969);
      }

      // Show warnings if any (after successful creation)
      if (result.warnings && result.warnings.length > 0) {
        // Show index/performance recommendations after successful creation
        const warningText = result.warnings.join('\n\n');
        setTimeout(() => {
          alert(t.panelt21977 + '\n\n' + t.panelt21977_2 + '\n\n' + warningText);
        }, 100);
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
        const newVersion = schemaVersions.find(v => Number(v.version_number) === Number(result.new_version.version_number));
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
      setError(err instanceof Error ? err.message : t.panelt22009);
    } finally {
      setLoading(false);
    }
  }, [createFKSourceFieldId, createFKTargetFieldId, createFKName, createFKOnDelete, createFKOnUpdate, nodes, selectedSchema, selectedVersion, loadSchemaVersions, loadSchemaVersionWithSchema, schemaVersions, t.applicationsmodal66]);


  const handleCreateFKClick = () => {
    // Wenn genau 2 Tabellen ausgewählt sind, als Quelle und Ziel vorbelegen
    if (selectedTableIds.length === 2) {
      setCreateFKSourceTableId(selectedTableIds[0]);
      setCreateFKTargetTableId(selectedTableIds[1]);
    }
    setShowCreateFKModal(true);
  };

  // Load and show FK suggestions
  const handleShowFKSuggestions = useCallback(async () => {
    if (!selectedVersion) return;

    try {
      setLoadingFKSuggestions(true);
      setError(null);

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch(`/api/schema-versions/${selectedVersion.id}/fk-suggestions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || t.panelt22048);
      }

      setFkSuggestions(result.suggestions || []);
      setShowFKSuggestionsModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.panelt22054);
    } finally {
      setLoadingFKSuggestions(false);
    }
  }, [selectedVersion, t.applicationsmodal66]);

  // Create FK from suggestion
  const handleCreateFKFromSuggestion = useCallback((suggestion: typeof fkSuggestions[0]) => {
    setCreateFKSourceTableId(suggestion.source_table_id);
    setCreateFKSourceFieldId(suggestion.source_field_id);
    setCreateFKTargetTableId(suggestion.target_table_id);
    setCreateFKTargetFieldId(suggestion.target_field_id);
    setCreateFKName('');
    setCreateFKOnDelete('NO ACTION');
    setCreateFKOnUpdate('NO ACTION');
    setShowFKSuggestionsModal(false);
    setShowCreateFKModal(true);
  }, []);

  const handleClipboardPaste = async () => {

    try {
      // Try to read from clipboard
      const clipboardText = await navigator.clipboard.readText();
      const tableData = JSON.parse(clipboardText);

      if (!tableData._scoriet_table_copy) {
        setError(t.panelt22081);
        return;
      }

      // If no version exists, create initial version first
      if (!selectedVersion) {
        confirmDialog({
          group: 'panelt2',
          message: t.panelt22088,
          header: t.panelt22089,
          icon: 'pi pi-exclamation-triangle',
          accept: async () => {
            try {
              setLoading(true);
              const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
              const response = await fetch(`/api/floating-schemas/${selectedSchema!.id}/versions`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json',
                },
                body: JSON.stringify({ description: t.panelt22102 }),
              });

              if (!response.ok) throw new Error(t.panelt22105);

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
              setError(err instanceof Error ? err.message : t.panelt22123);
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
    } catch {
      setError(t.panelt22145);
    }
  }
  const handleShowImportModal = () => {
    setShowImportModal(true);
  }

  const handleSortDiagram = useCallback(async () => {
    if (!selectedSchema || !selectedVersion || nodes.length === 0) {
      setError(t.panelt22154);
      return;
    }

    if (!selectedProject) {
      setError(t.panelt22159);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Diagram-Einstellungen vom Projekt holen (mit Defaults)
      const tableWidth = selectedProject.diagram_table_width || 280;
      const tableHeight = selectedProject.diagram_table_height || 450;

      // Tabellennamen und Fremdschlüssel aus aktuellen Nodes extrahieren
      const tables = nodes.map(node => (node.data as any).tableName);
      const foreignKeys: string[][] = [];

      // Fremdschlüssel-Beziehungen aus den aktuellen Edges extrahieren
      edges.forEach(edge => {
        if (edge.data && (edge.data as any).sourceTable && (edge.data as any).targetTable) {
          foreignKeys.push([(edge.data as any).sourceTable, (edge.data as any).targetTable]);
        }
      });

      const response = await fetch('/api/diagram/layout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tables: tables,
          foreignKeys: foreignKeys,
          project_id: selectedProject.id
        })
      });

      const layoutData = await response.json();

      if (!response.ok) {
        throw new Error(`${t.panelt22198}${response.statusText}`);
      }

      if (layoutData && layoutData.nodes) {
        // Neue Positionen auf die aktuellen Nodes anwenden
        const updatedNodes = nodes.map(node => {
          const tableName = (node.data as any).tableName;
          const newPosition = layoutData.nodes[tableName];

          if (newPosition) {
            return {
              ...node,
              position: {
                x: newPosition.x,
                y: newPosition.y
              },
              height: tableHeight,
              width: tableWidth,
              measured: {
                width: tableWidth,
                height: tableHeight
              }
            };
          }

          return node;
        });

        // Layout automatisch speichern
        await saveLayout(updatedNodes);

        // Diagramm komplett aus DB neu laden (wie Refresh-Button)
        // Dadurch werden die gespeicherten Positionen korrekt angezeigt
        await loadSchemaVersionWithSchema(selectedSchema!, selectedVersion);

        // Nach dem Neuladen: Viewport auf die sortierten Nodes zentrieren
        // Kleine Verzögerung damit React die Nodes rendern kann
        setTimeout(() => {
          if (reactFlowInstance.current) {
            reactFlowInstance.current.fitView({
              padding: 0.2,
              duration: 300, // Sanfte Animation
            });
          }
        }, 100);
      } else if (layoutData && layoutData.error) {
        // Fehler vom Backend anzeigen
        setError(layoutData.error);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : t.panelt22249);
    } finally {
      setLoading(false);
    }
  }, [selectedSchema, selectedVersion, selectedProject, nodes, edges, saveLayout, loadSchemaVersionWithSchema]);

  // ========== LOADING ACCESS ==========
  if (loadingAccess) {
    return (
      <TabContent style={{}}>
        <div className="flex items-center justify-center h-full" style={{ backgroundColor: colors.bgPrimary }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.accent }}></div>
            <p style={{ color: colors.textMuted }}>Lade...</p>
          </div>
        </div>
      </TabContent>
    );
  }

  // ========== NO ACCESS - SHOW PREMIUM BANNER ==========
  if (!databaseDesignerAccess?.has_access) {
    return (
      <TabContent style={{}}>
        <div className="h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
          {/* Header */}
          <div className="flex justify-between items-center p-4 flex-shrink-0" style={{ backgroundColor: colors.bgPrimary, borderBottom: `1px solid ${colors.borderPrimary}` }}>
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-lg font-bold" style={{ color: colors.accent }}>{t.panelt21282}</h3>
                <p className="text-sm" style={{ color: colors.textMuted }}>{t.panelt22279}</p>
              </div>
            </div>
          </div>

          {/* Premium Banner */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md w-full">
              <div className="rounded-lg p-6 text-center" style={{ backgroundColor: 'rgba(147, 51, 234, 0.15)', border: '2px solid rgb(147, 51, 234)' }}>
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'rgb(216, 180, 254)' }}>
                  {t.panelt22290}
                </h3>
                <p className="mb-4" style={{ color: colors.textMuted }}>
                  {t.panelt22293}
                </p>

                <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: colors.bgSecondary }}>
                  <div className="text-2xl font-bold mb-1" style={{ color: 'rgb(196, 181, 253)' }}>
                    {databaseDesignerAccess?.unlock_cost || 50}{t.panelt22298}
                  </div>
                  <div className="text-sm" style={{ color: colors.textMuted }}>
                    {t.panelt22301_2}
                  </div>
                </div>

                <button
                  onClick={unlockDatabaseDesigner}
                  disabled={unlocking}
                  className="px-6 py-3 text-lg font-semibold text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-wait"
                  style={{
                    background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                  }}
                >
                  {unlocking ? t.panelt22313 : t.panelt22313_2}
                </button>

                <div className="mt-4 text-sm" style={{ color: colors.textMuted }}>
                  <p className="mb-2 font-medium" style={{ color: colors.textSecondary }}>Enthaltene Funktionen:</p>
                  <ul className="text-left space-y-1">
                    <li className="flex items-center gap-2 opacity-60" style={{ color: colors.textMuted }}>
                      <span>📊</span>{t.panelt22320}
                    </li>
                    <li className="flex items-center gap-2 opacity-60" style={{ color: colors.textMuted }}>
                      <span>➕</span>{t.panelt22323}
                    </li>
                    <li className="flex items-center gap-2 opacity-60" style={{ color: colors.textMuted }}>
                      <span>✏️</span>{t.panelt22326}
                    </li>
                    <li className="flex items-center gap-2 opacity-60" style={{ color: colors.textMuted }}>
                      <span>🔗</span>{t.panelt22329}
                    </li>
                    <li className="flex items-center gap-2 opacity-60" style={{ color: colors.textMuted }}>
                      <span>📥</span>{t.panelt22332}
                    </li>
                  </ul>
                </div>

                <p className="mt-4 text-xs" style={{ color: colors.textMuted, opacity: 0.7 }}>
                  {t.panelt22338}
                </p>
              </div>
            </div>
          </div>
        </div>
      </TabContent>
    );
  }

  // ========== MAIN RENDER (WITH ACCESS) ==========
  return (
    <TabContent style={{}}>
      <Toast ref={toast} />
      <div className="h-full flex flex-col" style={{ height: '100%' }}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 flex-shrink-0" style={{ backgroundColor: colors.bgSecondary, borderBottom: `1px solid ${colors.borderPrimary}` }}>
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-lg font-bold" style={{ color: colors.accent }}>{t.panelt21282}</h3>
              <p className="text-sm" style={{ color: colors.textMuted }}>
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
            {effectiveReadOnly && (
              <span className="px-3 py-1 text-xs font-semibold rounded" style={{ color: colors.warningText, backgroundColor: colors.warningBg, border: `1px solid ${colors.warningBorder}` }}>
                READ-ONLY
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Schema Selector */}
            <select
              value={selectedSchema?.id || ''}
              onChange={(e) => {
                const schemaId = Number(e.target.value);
                const schema = floatingSchemas.find(s => Number(s.id) === schemaId);
                setSelectedSchema(schema || null);
              }}
              className="px-3 py-1 rounded text-sm focus:outline-none"
              style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}` }}
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
                className="px-3 py-1 rounded text-sm focus:outline-none"
                style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}` }}
              >
                {schemaVersions.map(version => {
                  const displayText = version.version_number && version.imported_at
                    ? `v${version.version_number} - ${new Date(version.imported_at).toLocaleDateString(currentLanguage)}`
                    : version.version_name;
                  return (
                    <option key={version.id} value={version.id}>
                      {displayText}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        </div>

        {/* Compact Toolbar with Icons Only */}
        <div className="px-3 py-2 flex items-center justify-end" style={{ backgroundColor: colors.bgTertiary, borderBottom: `1px solid ${colors.borderPrimary}` }}>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading || !selectedProject}
              className="panelt2-toolbar-btn text-xs px-3 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: colors.textPrimary }}
              title={t.panelt22439}
            >
              <i className="pi pi-refresh"></i>
            </button>

            <button
              onClick={handleCreateNewVersion}
              disabled={loading || !selectedSchema || effectiveReadOnly}
              className="panelt2-toolbar-btn text-xs px-3 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: colors.textPrimary }}
              title={effectiveReadOnly ? t.panelt22449 : (t.panelt21358)}
            >
              <i className="pi pi-plus"></i>
            </button>

            <button
              onClick={() => setShowDeleteVersionDialog(true)}
              disabled={loading || !selectedSchema || schemaVersions.length <= 1 || effectiveReadOnly}
              className="panelt2-toolbar-btn text-xs px-3 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: colors.errorText }}
              title={effectiveReadOnly ? t.panelt22459 : t.panelt22459_2}
            >
              <i className="pi pi-times"></i>
            </button>

            <button
              onClick={handleShowImportModal}
              disabled={loading || !selectedProject || effectiveReadOnly}
              className="panelt2-toolbar-btn text-xs px-3 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: colors.textPrimary }}
              title={effectiveReadOnly ? t.panelt22469 : t.panelt22469_2}
            >
              <i className="pi pi-upload"></i>
            </button>

            <button
              onClick={handleCreateFKClick}
              disabled={loading || !selectedSchema || !selectedVersion || effectiveReadOnly}
              className="panelt2-toolbar-btn text-xs px-3 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: colors.textPrimary }}
              title={effectiveReadOnly ? t.panelt22479 : t.panelt22479_2}
            >
              <i className="pi pi-link"></i>
            </button>

            <button
              onClick={handleShowFKSuggestions}
              disabled={loading || loadingFKSuggestions || !selectedSchema || !selectedVersion}
              className="panelt2-toolbar-btn text-xs px-3 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: colors.textPrimary }}
              title={t.panelt22489}
            >
              {loadingFKSuggestions ? <i className="pi pi-spin pi-spinner"></i> : <i className="pi pi-lightbulb"></i>}
            </button>

            <button
              onClick={handleClipboardPaste}
              disabled={loading || !selectedSchema || effectiveReadOnly}
              className="panelt2-toolbar-btn text-xs px-3 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: colors.textPrimary }}
              title={effectiveReadOnly ? t.panelt22499 : t.panelt22499_2}
            >
              <i className="pi pi-clipboard"></i>
            </button>

            <button
              onClick={handleCreateNewTable}
              disabled={loading || !selectedProject || effectiveReadOnly}
              className="panelt2-toolbar-btn text-xs px-3 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: colors.textPrimary }}
              title={effectiveReadOnly ? t.panelt22509 : t.panelt22509_2}
            >
              <i className="pi pi-table"></i>
            </button>

            <button
              onClick={handleSortDiagram}
              disabled={loading || !selectedSchema || !selectedVersion || nodes.length === 0 || effectiveReadOnly}
              className="panelt2-toolbar-btn text-xs px-3 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: colors.textPrimary }}
              title={effectiveReadOnly ? t.panelt22519 : t.panelt22519_2}
            >
              <i className="pi pi-sync"></i>
            </button>

          </div>
        </div>

        {/* Error Display */}
        {error ? (
          <div className="p-4 flex-shrink-0" style={{ backgroundColor: colors.errorBg, borderBottom: `1px solid ${colors.errorBorder}`, color: colors.errorText }}>
            <div className="flex items-center">
              <span className="mr-2">⚠️</span>
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto hover:opacity-70"
                style={{ color: colors.errorText }}
              >
                ✕
              </button>
            </div>
          </div>
        ) : null}

        {/* Loading State */}
        {loading && (
          <div className="p-4 flex-shrink-0" style={{ backgroundColor: colors.bgSecondary, borderBottom: `1px solid ${colors.borderPrimary}`, color: colors.textMuted }}>
            <div className="flex items-center">
              <div className="animate-spin mr-2">⚪</div>
              <span>{t.panelt22549}</span>
            </div>
          </div>
        )}

        {/* React Flow Container */}
        <div className="flex-1" style={{ height: 'calc(100% - 200px)' }}>
          {nodes.length > 0 ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onInit={(instance) => {
                reactFlowInstance.current = instance;
              }}
              onNodesChange={(changes) => {
                // Block position/dimension changes in read-only mode
                if (effectiveReadOnly) {
                  // Filter out position and dimension changes, but allow selection changes
                  const filteredChanges = changes.filter(change =>
                    change.type !== 'position' && change.type !== 'dimensions'
                  );
                  if (filteredChanges.length > 0) {
                    onNodesChange(filteredChanges);
                  }
                  return;
                }

                // Apply the changes normally
                onNodesChange(changes);

                // Check if we have position or dimension changes
                const relevantChanges = changes.filter(change =>
                  (change.type === 'position' && change.position) ||
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

                        if (
                          positionChange &&
                          'position' in positionChange &&
                          positionChange.position
                        ) {
                          updatedNode.position = positionChange.position;
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
              nodesDraggable={!effectiveReadOnly}
              nodesConnectable={false}
              elementsSelectable={true}
              selectNodesOnDrag={false}
              fitView
              minZoom={0.05}
              maxZoom={4}
              defaultViewport={{ zoom: 0.8, x: 0, y: 0 }}
              className="panelt2-reactflow"
              proOptions={{ hideAttribution: true }}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: colors.bgPrimary
              }}
            >
              <Controls
                className="panelt2-controls"
                style={{ background: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}
              />
              <MiniMap
                className="panelt2-minimap"
                style={{
                  background: colors.bgSecondary,
                  border: `1px solid ${colors.borderPrimary}`
                }}
                nodeColor={colors.textMuted}
                maskColor="rgba(0, 0, 0, 0.6)"
              />
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1}
                color={colors.borderPrimary}
                style={{ backgroundColor: colors.bgPrimary }}
              />
            </ReactFlow>
          ) : (
            <div className="flex items-center justify-center h-full" style={{ color: colors.textMuted }}>
              <div className="text-center">
                {error && error.includes('Authentication') ? (
                  // Authentication Error State
                  <>
                    <div className="text-6xl mb-4">🔐</div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: colors.warningText }}>{t.panelt22716}</h3>
                    <p className="text-sm mb-4" style={{ color: colors.textPrimary }}>{t.panelt22717}</p>
                    <p className="text-xs" style={{ color: colors.textMuted }}>
                      {t.panelt22719}
                    </p>
                  </>
                ) : (
                  // No Data State
                  <>
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>{t.panelt22726}</h3>
                    <p className="text-sm" style={{ color: colors.textMuted }}>
                      {!selectedProject
                        ? t.panelt21528
                        : floatingSchemas.length === 0
                          ? t.panelt21530
                          : t.panelt21531
                      }
                    </p>
                    {selectedProject && floatingSchemas.length === 0 && !loading && !error && (
                      <p className="text-xs mt-2" style={{ color: colors.textMuted }}>
                        {t.panelt22737}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Table Info Panel */}
        {selectedNode && (selectedNode.data as { tableName?: string }).tableName ? (() => {
          const nodeData = selectedNode.data as { tableName: string; fields?: { isPrimary: boolean }[]; constraints?: unknown[] };
          return (
          <div className="p-4 flex-shrink-0" style={{ backgroundColor: colors.bgTertiary, borderTop: `1px solid ${colors.borderPrimary}` }}>
            <h5 className="font-medium mb-2" style={{ color: colors.accent }}>{t.panelt22752}</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span style={{ color: colors.textMuted }}>{t.panelt22755}</span>
                <span className="ml-2 font-mono" style={{ color: colors.textPrimary }}>{nodeData.tableName}</span>
              </div>
              <div>
                <span style={{ color: colors.textMuted }}>{t.panelt22759}</span>
                <span className="ml-2" style={{ color: colors.textPrimary }}>{nodeData.fields?.length || 0}</span>
              </div>
              <div>
                <span style={{ color: colors.textMuted }}>{t.panelt22763}</span>
                <span className="ml-2" style={{ color: colors.textPrimary }}>{nodeData.constraints?.length || 0}</span>
              </div>
              <div>
                <span style={{ color: colors.textMuted }}>{t.panelt22767}</span>
                <span className="ml-2" style={{ color: colors.warningText }}>
                  {nodeData.fields?.filter((f) => f.isPrimary).length || 0}
                </span>
              </div>
            </div>
          </div>
          );
        })() : null}
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
              ? `${t.panelt22801}"${pendingEditTable?.table_name}"${t.panelt22801_2}`
              : `${t.panelt22802}"${pendingDeleteTable?.table_name}"${t.panelt22802_2}`
        }
        currentVersion={selectedVersion?.version_name || t.panelt22804}
        tableName={pendingDeleteTable?.table_name}
      />

      {/* Create / Edit Table Modal */}
      <TableModal
        mode={tableModalMode || 'create'}
        isOpen={tableModalMode !== null}
        onClose={() => {
          setTableModalMode(null);
          setPendingEditTable(null);
        }}
        onSave={tableModalMode === 'edit' ? handleUpdateTable : handleCreateTable}
        table={tableModalMode === 'edit' ? pendingEditTable : undefined}
        loading={loading}
        schemaVersionId={selectedVersion?.id}
      />

      {/* FK Action Menu */}
      {showFKActionMenu && selectedFK && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 999999, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="rounded-lg p-6 max-w-sm w-full mx-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>{t.panelt22833}</h3>

            <div className="mb-6">
              <div className="p-3 rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
                <div className="text-sm space-y-1">
                  <div>
                    <span style={{ color: colors.textMuted }}>{t.panelt22839}</span>{' '}
                    <span className="font-mono" style={{ color: colors.accent }}>{selectedFK.sourceTable}</span>
                  </div>
                  <div>
                    <span style={{ color: colors.textMuted }}>{t.panelt22843}</span>{' '}
                    <span className="font-mono" style={{ color: colors.successText }}>{selectedFK.targetTable}</span>
                  </div>
                  <div className="text-xs mt-2" style={{ color: colors.textMuted }}>
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
                className="w-full px-4 py-2 text-white rounded transition-colors flex items-center justify-center gap-2 hover:opacity-90"
                style={{ backgroundColor: colors.accent }}
              >
                {t.panelt22863}
              </button>

              <button
                onClick={() => {
                  setShowFKActionMenu(false);
                  setShowDeleteFKModal(true);
                }}
                className="w-full px-4 py-2 text-white rounded transition-colors flex items-center justify-center gap-2 hover:opacity-90"
                style={{ backgroundColor: colors.errorText }}
              >
                {t.panelt22874}
              </button>

              <button
                onClick={() => {
                  setShowFKActionMenu(false);
                  setSelectedFK(null);
                }}
                className="w-full px-4 py-2 rounded transition-colors hover:opacity-90"
                style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
              >
                {t.panelt22885}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete FK Modal */}
      {showDeleteFKModal && selectedFK && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 999999, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="rounded-lg p-6 max-w-md w-full mx-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>{t.panelt22896}</h3>

            <div className="mb-6">
              <p className="mb-4" style={{ color: colors.textSecondary }}>
                {t.panelt22900}
              </p>

              <div className="p-4 rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
                <div className="space-y-2 text-sm">
                  <div>
                    <span style={{ color: colors.textMuted }}>{t.panelt22906}</span>{' '}
                    <span className="font-mono" style={{ color: colors.textPrimary }}>{selectedFK.constraintName}</span>
                  </div>
                  <div>
                    <span style={{ color: colors.textMuted }}>{t.panelt22910}</span>{' '}
                    <span className="font-mono" style={{ color: colors.accent }}>{selectedFK.sourceTable}</span>
                  </div>
                  <div>
                    <span style={{ color: colors.textMuted }}>{t.panelt22914}</span>{' '}
                    <span className="font-mono" style={{ color: colors.successText }}>{selectedFK.targetTable}</span>
                  </div>
                </div>
              </div>

              {!selectedVersion || Number(selectedVersion.version_number) !== Number(selectedSchema?.last_version) ? (
                <div className="mt-4 p-3 rounded text-sm" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningBorder}`, color: colors.warningText }}>
                  {t.panelt22922}
                </div>
              ) : null}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteFKModal(false);
                  setSelectedFK(null);
                }}
                className="px-4 py-2 rounded transition-colors hover:opacity-90"
                style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
                disabled={loading}
              >
                {t.panelt22937}
              </button>
              <button
                onClick={handleDeleteFK}
                className="px-4 py-2 text-white rounded transition-colors disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: colors.errorText }}
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
          <div className="rounded-lg p-6 max-w-lg w-full mx-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>{t.panelt22956}</h3>

            <div className="mb-6">
              {/* FK Info Display */}
              <div className="p-4 rounded mb-4" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
                <div className="space-y-2 text-sm">
                  <div>
                    <span style={{ color: colors.textMuted }}>{t.panelt22963}</span>{' '}
                    <span className="font-mono" style={{ color: colors.accent }}>{selectedFK.sourceTable}</span>
                  </div>
                  <div>
                    <span style={{ color: colors.textMuted }}>{t.panelt22967}</span>{' '}
                    <span className="font-mono" style={{ color: colors.successText }}>{selectedFK.targetTable}</span>
                  </div>
                </div>
              </div>

              {/* FK Name Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  {t.panelt22976}
                </label>
                <input
                  type="text"
                  value={editFKName}
                  onChange={(e) => setEditFKName(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                  placeholder="fk_table1_table2"
                />
              </div>

              {/* Referential Actions */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    ON DELETE
                  </label>
                  <select
                    value={editFKOnDelete}
                    onChange={(e) => setEditFKOnDelete(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                  >
                    <option value="NO ACTION">NO ACTION</option>
                    <option value="CASCADE">CASCADE</option>
                    <option value="RESTRICT">RESTRICT</option>
                    <option value="SET NULL">SET NULL</option>
                    <option value="SET DEFAULT">SET DEFAULT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    ON UPDATE
                  </label>
                  <select
                    value={editFKOnUpdate}
                    onChange={(e) => setEditFKOnUpdate(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                  >
                    <option value="NO ACTION">NO ACTION</option>
                    <option value="CASCADE">CASCADE</option>
                    <option value="RESTRICT">RESTRICT</option>
                    <option value="SET NULL">SET NULL</option>
                    <option value="SET DEFAULT">SET DEFAULT</option>
                  </select>
                </div>
              </div>

              {!selectedVersion || Number(selectedVersion.version_number) !== Number(selectedSchema?.last_version) ? (
                <div className="mt-4 p-3 rounded text-sm" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningBorder}`, color: colors.warningText }}>
                  {t.panelt23032}
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
                className="px-4 py-2 rounded transition-colors hover:opacity-90"
                style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
                disabled={loading}
              >
                {t.panelt23048}
              </button>
              <button
                onClick={handleEditFK}
                className="px-4 py-2 text-white rounded transition-colors disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: colors.accent }}
                disabled={loading || !editFKName.trim()}
              >
                {loading ? t.saving : t.panelt23056}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FK Suggestions Modal */}
      {showFKSuggestionsModal && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 999999, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                <i className="pi pi-lightbulb mr-2" style={{ color: colors.warningText }}></i>
                {t.panelt23067}({fkSuggestions.length})
              </h3>
              <button
                onClick={() => setShowFKSuggestionsModal(false)}
                className="p-2 rounded hover:opacity-80"
                style={{ color: colors.textSecondary }}
              >
                <i className="pi pi-times"></i>
              </button>
            </div>

            {fkSuggestions.length === 0 ? (
              <div className="text-center py-8" style={{ color: colors.textMuted }}>
                <i className="pi pi-check-circle text-4xl mb-4" style={{ color: colors.successText }}></i>
                <p>{t.panelt23084}</p>
                <p className="text-sm mt-2">{t.panelt23085}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: colors.bgTertiary }}>
                      <th className="px-3 py-2 text-left text-sm font-medium" style={{ color: colors.textSecondary }}>{t.panelt23083}</th>
                      <th className="px-3 py-2 text-center text-sm font-medium" style={{ color: colors.textSecondary }}></th>
                      <th className="px-3 py-2 text-left text-sm font-medium" style={{ color: colors.textSecondary }}>{t.panelt23085}</th>
                      <th className="px-3 py-2 text-center text-sm font-medium" style={{ color: colors.textSecondary }}>{t.panelt23086_2}</th>
                      <th className="px-3 py-2 text-center text-sm font-medium" style={{ color: colors.textSecondary }}>{t.panelt23087}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fkSuggestions.map((suggestion, index) => (
                      <tr
                        key={index}
                        className="border-b hover:opacity-90"
                        style={{
                          borderColor: colors.borderPrimary,
                          backgroundColor: index % 2 === 0 ? 'transparent' : colors.bgTertiary,
                          opacity: suggestion.is_compatible ? 1 : 0.6,
                        }}
                      >
                        <td className="px-3 py-2">
                          <div style={{ color: colors.textPrimary }}>
                            <span className="font-medium">{suggestion.source_table_name}</span>
                            <span style={{ color: colors.textMuted }}>.{suggestion.source_field_name}</span>
                          </div>
                          <div className="text-xs" style={{ color: colors.textMuted }}>
                            {suggestion.source_field_type}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <i className="pi pi-arrow-right" style={{ color: colors.accent }}></i>
                        </td>
                        <td className="px-3 py-2">
                          <div style={{ color: colors.textPrimary }}>
                            <span className="font-medium">{suggestion.target_table_name}</span>
                            <span style={{ color: colors.textMuted }}>.{suggestion.target_field_name}</span>
                          </div>
                          <div className="text-xs" style={{ color: colors.textMuted }}>
                            {suggestion.target_field_type}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{
                              backgroundColor: suggestion.match_score >= 80 ? colors.successBg :
                                             suggestion.match_score >= 50 ? colors.warningBg : colors.bgTertiary,
                              color: suggestion.match_score >= 80 ? colors.successText :
                                     suggestion.match_score >= 50 ? colors.warningText : colors.textSecondary,
                            }}
                          >
                            {suggestion.match_score}%
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {suggestion.is_compatible ? (
                            <button
                              onClick={() => handleCreateFKFromSuggestion(suggestion)}
                              className="px-3 py-1 rounded text-xs font-medium hover:opacity-80"
                              style={{ backgroundColor: colors.accent, color: '#fff' }}
                              title={suggestion.compatibility_warning || 'FK erstellen'}
                            >
                              <i className="pi pi-plus mr-1"></i>
                              {t.panelt23153}
                            </button>
                          ) : (
                            <span className="text-xs" style={{ color: colors.errorText }}>
                              <i className="pi pi-times-circle mr-1"></i>
                              {t.panelt23158}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end mt-4 pt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
              <button
                onClick={() => setShowFKSuggestionsModal(false)}
                className="px-4 py-2 rounded hover:opacity-80"
                style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
              >
                {t.panelt23175}
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

        // Check if source field is NOT NULL - if so, SET NULL is not allowed
        const selectedSourceField = createFKSourceFieldId
          ? sourceTableFields.find(f => f.id === createFKSourceFieldId)
          : null;
        const sourceFieldIsNotNull = !!(selectedSourceField && !selectedSourceField.is_nullable);

        return (
          <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 999999, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="rounded-lg p-6 max-w-2xl w-full mx-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>{t.panelt23199}</h3>

              <div className="space-y-4">
                {/* Source Table and Field */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                      {t.panelt23215}
                    </label>
                    <select
                      value={createFKSourceTableId || ''}
                      onChange={(e) => {
                        setCreateFKSourceTableId(e.target.value ? parseInt(e.target.value) : null);
                        setCreateFKSourceFieldId(null); // Reset field when table changes
                      }}
                      disabled={loading}
                      className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                      style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                    >
                      <option value="">{t.panelt23227}</option>
                      {availableTables.map(table => (
                        <option key={table.id} value={table.id}>{table.table_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                      {t.panelt23236}
                    </label>
                    <select
                      value={createFKSourceFieldId || ''}
                      onChange={(e) => {
                        const newFieldId = e.target.value ? parseInt(e.target.value) : null;
                        setCreateFKSourceFieldId(newFieldId);
                        // Reset SET NULL actions if new field is NOT NULL
                        if (newFieldId) {
                          const newField = sourceTableFields.find(f => f.id === newFieldId);
                          if (newField && !newField.is_nullable) {
                            if (createFKOnDelete === 'SET NULL') setCreateFKOnDelete('NO ACTION');
                            if (createFKOnUpdate === 'SET NULL') setCreateFKOnUpdate('NO ACTION');
                          }
                        }
                      }}
                      disabled={loading || !createFKSourceTableId}
                      className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50"
                      style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                    >
                      <option value="">{t.panelt23256}</option>
                      {sourceTableFields.map(field => (
                        <option key={field.id} value={field.id}>
                          {field.field_name} ({field.field_type}) {!field.is_nullable ? '[NOT NULL]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Target Table and Field */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                      {t.panelt23270}
                    </label>
                    <select
                      value={createFKTargetTableId || ''}
                      onChange={(e) => {
                        setCreateFKTargetTableId(e.target.value ? parseInt(e.target.value) : null);
                        setCreateFKTargetFieldId(null); // Reset field when table changes
                      }}
                      disabled={loading}
                      className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                      style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                    >
                      <option value="">{t.panelt23282}</option>
                      {availableTables.map(table => (
                        <option key={table.id} value={table.id}>{table.table_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                      {t.panelt23291}
                    </label>
                    <select
                      value={createFKTargetFieldId || ''}
                      onChange={(e) => setCreateFKTargetFieldId(e.target.value ? parseInt(e.target.value) : null)}
                      disabled={loading || !createFKTargetTableId}
                      className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50"
                      style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                    >
                      <option value="">{t.panelt23291}</option>
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
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    {t.panelt23313}
                  </label>
                  <input
                    type="text"
                    value={createFKName}
                    onChange={(e) => setCreateFKName(e.target.value)}
                    disabled={loading}
                    placeholder={t.panelt23311}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                  />
                </div>

                {/* Referential Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                      ON DELETE
                    </label>
                    <select
                      value={createFKOnDelete}
                      onChange={(e) => setCreateFKOnDelete(e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                      style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                    >
                      <option value="NO ACTION">NO ACTION</option>
                      <option value="CASCADE">CASCADE</option>
                      <option value="RESTRICT">RESTRICT</option>
                      <option value="SET NULL" disabled={sourceFieldIsNotNull}>
                        SET NULL {sourceFieldIsNotNull ? '(' + t.panelt23334 + 'NOT NULL)' : ''}
                      </option>
                      <option value="SET DEFAULT">SET DEFAULT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                      ON UPDATE
                    </label>
                    <select
                      value={createFKOnUpdate}
                      onChange={(e) => setCreateFKOnUpdate(e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                      style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                    >
                      <option value="NO ACTION">NO ACTION</option>
                      <option value="CASCADE">CASCADE</option>
                      <option value="RESTRICT">RESTRICT</option>
                      <option value="SET NULL" disabled={sourceFieldIsNotNull}>
                        SET NULL {sourceFieldIsNotNull ? t.panelt23358 : ''}
                      </option>
                      <option value="SET DEFAULT">SET DEFAULT</option>
                    </select>
                  </div>
                </div>

                {/* Warning if source field is NOT NULL */}
                {sourceFieldIsNotNull && (
                  <div className="p-3 rounded text-sm" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}`, color: colors.infoText }}>
                    {t.panelt23374}"{selectedSourceField?.field_name}"{t.panelt23374_2}NOT NULL. SET NULL{t.panelt23365}
                  </div>
                )}

                {!selectedVersion || Number(selectedVersion.version_number) !== Number(selectedSchema?.last_version) ? (
                  <div className="mt-4 p-3 rounded text-sm" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningBorder}`, color: colors.warningText }}>
                    {t.panelt23380}
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
                  className="px-4 py-2 rounded transition-colors hover:opacity-90"
                  style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
                  disabled={loading}
                >
                  {t.panelt23401}
                </button>
                <button
                  onClick={handleCreateFK}
                  className="px-4 py-2 text-white rounded transition-colors disabled:opacity-50 hover:opacity-90"
                  style={{ backgroundColor: colors.accent }}
                  disabled={loading || !createFKSourceFieldId || !createFKTargetFieldId}
                >
                  {loading ? t.saving : t.panelt23409}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Paste Table Modal */}
      {showPasteModal && pasteTableData && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 999999, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="rounded-lg p-6 max-w-2xl w-full mx-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>Paste Table: {pasteTableData.table_name}</h3>

            <div className="space-y-4">
              {/* New Table Name */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  {t.panelt23427}
                </label>
                <input
                  type="text"
                  value={pasteTableName}
                  onChange={(e) => setPasteTableName(e.target.value)}
                  disabled={loading}
                  placeholder={t.panelt23425}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                />
              </div>

              {/* Preview of what will be copied */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgTertiary }}>
                <h4 className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>{t.panelt23442}</h4>
                <ul className="text-sm space-y-1" style={{ color: colors.textMuted }}>
                  <li>✅ {pasteTableData.fields?.length || 0} Fields</li>
                  <li>{t.panelt23445}</li>
                  <li>{t.panelt23446}</li>
                  <li>{t.panelt23447}</li>
                  <li>{t.panelt23448}</li>
                </ul>
              </div>

              {!selectedVersion || Number(selectedVersion.version_number) !== Number(selectedSchema?.last_version) ? (
                <div className="mt-4 p-3 rounded text-sm" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningBorder}`, color: colors.warningText }}>
                  {t.panelt23454}
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
                className="px-4 py-2 rounded transition-colors hover:opacity-90"
                style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
                disabled={loading}
              >
                {t.panelt23470}
              </button>
              <button
                onClick={handlePasteTable}
                className="px-4 py-2 text-white rounded transition-colors disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: colors.successBg }}
                disabled={loading || !pasteTableName.trim()}
              >
                {loading ? t.saving : t.panelt23478}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Version Dialog */}
      <DeleteVersionDialog
        visible={showDeleteVersionDialog}
        onHide={() => setShowDeleteVersionDialog(false)}
        onConfirm={handleDeleteVersion}
        schemaName={selectedSchema?.name || ''}
        versions={schemaVersions.map(v => ({
          id: v.id,
          version_number: v.version_number || 0,
          description: v.description,
          tables_count: v.tables_count ?? v.tables?.length ?? 0,
          imported_at: v.imported_at,
          created_at: v.created_at
        }))}
        currentVersionId={selectedVersion?.id}
      />

      {/* PrimeReact ConfirmDialog for version creation confirmation */}
      <ConfirmDialog group="panelt2" />

      {/* Theme-aware CSS styles */}
      <style>{`
        .panelt2-container {
          --theme-bg-primary: ${colors.bgPrimary};
          --theme-bg-secondary: ${colors.bgSecondary};
          --theme-bg-tertiary: ${colors.bgTertiary};
          --theme-text-primary: ${colors.textPrimary};
          --theme-text-muted: ${colors.textMuted};
          --theme-border-primary: ${colors.borderPrimary};
          --theme-accent: ${colors.accent};
        }

        .panelt2-toolbar-btn {
          transition: all 0.2s ease;
        }

        .panelt2-toolbar-btn:hover:not(:disabled) {
          opacity: 0.85;
          transform: translateY(-1px);
        }

        .panelt2-toolbar-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .panelt2-controls {
          background: var(--theme-bg-secondary) !important;
          border: 1px solid var(--theme-border-primary) !important;
          border-radius: 8px !important;
        }

        .panelt2-controls button {
          background: var(--theme-bg-tertiary) !important;
          border: 1px solid var(--theme-border-primary) !important;
          color: var(--theme-text-primary) !important;
        }

        .panelt2-controls button:hover {
          background: var(--theme-accent) !important;
        }

        .panelt2-controls button svg {
          fill: var(--theme-text-primary) !important;
        }

        .panelt2-minimap {
          background: var(--theme-bg-secondary) !important;
          border: 1px solid var(--theme-border-primary) !important;
          border-radius: 8px !important;
        }

        /* ReactFlow node hover effects */
        .react-flow__node:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        /* Edge selection and hover */
        .react-flow__edge:hover .react-flow__edge-path {
          stroke-width: 3px;
        }

        /* Select dropdown styling */
        .panelt2-container select option {
          background-color: var(--theme-bg-tertiary);
          color: var(--theme-text-primary);
        }

        /* Input placeholder styling */
        .panelt2-container input::placeholder {
          color: var(--theme-text-muted);
        }
      `}</style>
    </TabContent>
  );
}