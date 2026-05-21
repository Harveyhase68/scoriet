// resources/js/Components/Panels/FormLivePreviewModal.tsx
// Live Preview Modal — renders a functional form preview with test data or real database data
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { apiClient } from '@/lib/api';

// ========== INTERFACES ==========

interface FormSet {
  id: number; name: string;
  default_background_color: string; default_window_color: string; default_text_color: string;
  default_button_color: string; default_button_text_color: string;
}

interface FormWindow {
  id: number; window_type: string; display_name?: string;
  default_width: number; default_height: number;
  background_color?: string; window_color?: string; text_color?: string;
  elements?: FormElement[];
}

interface FormElement {
  id?: number; element_type: string;
  x_position: number; y_position: number; width: number; height: number;
  container_columns?: number; container_gap?: number; default_control_height?: number;
  container_orientation?: string;
  tab_label?: string; parent_tab_container_id?: number;
  button_label?: string; button_icon?: string;
  button_background_color?: string; button_text_color?: string;
  anchor_right?: number | null; anchor_bottom?: number | null;
  anchor_width?: number | null; anchor_height?: number | null;
  sort_order: number; is_visible: boolean;
}

interface FieldPlacement {
  id?: number; schema_field_id: number; container_element_id: number;
  tab_panel_id?: number | null;
  x_position: number; y_position: number; width: number; height: number;
  caption_override?: string | null; caption_labels?: Record<string, string> | null;
  label_position?: string | null; label_width?: number | null;
  control_type?: string | null; sort_order: number; is_visible: boolean;
  schema_field?: SchemaField;
  style_config?: Record<string, unknown> | null;
}

interface ButtonPlacement {
  id?: number; button_type: string;
  button_label?: string | null; button_labels?: Record<string, string> | null;
  button_icon?: string | null;
  button_background_color?: string | null; button_text_color?: string | null;
  x_position: number; y_position: number; width: number; height: number;
  sort_order: number; is_visible: boolean;
}

interface MenuItem {
  id?: number; schema_table_id?: number | null;
  caption_override?: string | null; caption_labels?: Record<string, string> | null;
  menu_icon?: string | null; menu_action?: string | null; menu_role_required?: string | null;
  menu_depth: number; parent_placement_id?: number | string | null;
  sort_order: number; is_visible: boolean;
}

interface SchemaField {
  id: number; field_name: string; field_type: string;
  is_primary_key?: boolean; is_auto_increment?: boolean;
}

interface DbConnectionSettings {
  connection_type: 'mysql' | 'postgresql' | 'mssql';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

interface LiveDataRow {
  [key: string]: unknown;
}

interface ProjectDbSettings {
  database_type?: string;
  database_server?: string;
  database_port?: string;
  database_name?: string;
  database_username?: string;
  database_password?: string;
}

interface FormLivePreviewModalProps {
  visible: boolean; onHide: () => void;
  formSet: FormSet; window: FormWindow;
  placements: FieldPlacement[]; buttons: ButtonPlacement[]; menuItems: MenuItem[];
  schemaFields: SchemaField[];
  selectedLanguage: string | null;
  tableName?: string;
  projectId?: number;
  projectDbSettings?: ProjectDbSettings;
  enabledLanguages: Array<{ label: string; value: string }>;
}

// ========== TEST DATA GENERATOR ==========

const FIRST_NAMES = ['Max', 'Anna', 'Stefan', 'Maria', 'Thomas', 'Julia', 'Michael', 'Sarah', 'Andreas', 'Lisa'];
const LAST_NAMES = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker'];
const COMPANIES = ['TechCorp GmbH', 'Alpine Solutions', 'DataFlow AG', 'CloudNine Ltd', 'SmartBuild Inc'];
const PRODUCTS = ['Widget Pro', 'DataSync 3000', 'SmartHub', 'CloudBox', 'TurboEngine', 'MegaChip'];
const CITIES = ['Wien', 'Berlin', 'München', 'Zürich', 'Salzburg', 'Hamburg', 'Graz'];
const STATUSES = ['Active', 'Inactive', 'Pending', 'Approved'];
const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[rand(0, arr.length - 1)];

function randomDate(): Date {
  return new Date(2024, rand(0, 11), rand(1, 28), rand(8, 18), rand(0, 59));
}

function formatDate(val: unknown): string {
  if (val instanceof Date) {
    const d = val.getDate().toString().padStart(2, '0');
    const m = (val.getMonth() + 1).toString().padStart(2, '0');
    const y = val.getFullYear();
    return `${d}.${m}.${y}`;
  }
  return String(val || '');
}

function formatDateTime(val: unknown): string {
  if (val instanceof Date) {
    return `${formatDate(val)} ${val.getHours().toString().padStart(2, '0')}:${val.getMinutes().toString().padStart(2, '0')}`;
  }
  return String(val || '');
}

function generateFieldValue(field: SchemaField): unknown {
  const name = field.field_name.toLowerCase();
  const type = field.field_type.toLowerCase();
  if (name.includes('first_name') || name.includes('vorname')) return pick(FIRST_NAMES);
  if (name.includes('last_name') || name.includes('nachname') || name.includes('surname')) return pick(LAST_NAMES);
  if (name.includes('company') || name.includes('firma')) return pick(COMPANIES);
  if (name.includes('product') || name.includes('produkt') || name === 'name') return pick(PRODUCTS);
  if (name.includes('city') || name.includes('stadt')) return pick(CITIES);
  if (name.includes('email')) return `${pick(FIRST_NAMES).toLowerCase()}.${pick(LAST_NAMES).toLowerCase()}@gmail.com`;
  if (name.includes('phone') || name.includes('tel')) return `+43 ${rand(600, 699)} ${rand(1000000, 9999999)}`;
  if (name.includes('zip') || name.includes('plz')) return String(rand(1000, 9999));
  if (name.includes('street') || name.includes('strasse')) return `${pick(LAST_NAMES)}straße ${rand(1, 99)}`;
  if (name.includes('status')) return pick(STATUSES);
  if (name.includes('description') || name.includes('notes')) return LOREM.substring(0, rand(20, 60));
  if (name.includes('price') || name.includes('preis') || name.includes('amount')) return (rand(100, 9990) / 100).toFixed(2);
  if (name.includes('quantity') || name.includes('menge')) return rand(1, 500);
  if (field.is_auto_increment || field.is_primary_key) return rand(1, 999);
  if (type.includes('bool') || type === 'tinyint') return Math.random() > 0.5;
  if (type.includes('int') || type.includes('bigint')) return rand(1, 9999);
  if (type.includes('decimal') || type.includes('float') || type.includes('double')) return (rand(100, 9990) / 100).toFixed(2);
  if (type.includes('datetime') || type.includes('timestamp')) return randomDate();
  if (type.includes('date')) return randomDate();
  if (type.includes('time')) return `${String(rand(8, 18)).padStart(2, '0')}:${String(rand(0, 59)).padStart(2, '0')}`;
  if (type.includes('text') || type.includes('longtext') || type.includes('mediumtext')) return LOREM.substring(0, rand(20, 80));
  return `Test ${rand(1, 999)}`;
}

function generateTestData(fields: SchemaField[], count: number): Record<string, unknown>[] {
  return Array.from({ length: count }, (_, i) => {
    const row: Record<string, unknown> = {};
    for (const f of fields) row[f.field_name] = f.is_auto_increment ? i + 1 : generateFieldValue(f);
    return row;
  });
}

// ========== HELPERS ==========

const formatFieldName = (name: string): string => name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const getLabel = (p: FieldPlacement, lang: string | null): string =>
  (lang && p.caption_labels?.[lang]) || p.caption_override || (p.schema_field ? formatFieldName(p.schema_field.field_name) : 'Field');

const getBtnLabel = (b: ButtonPlacement, lang: string | null): string => {
  if (lang && b.button_labels?.[lang]) return b.button_labels[lang];
  if (b.button_label) return b.button_label;
  const d: Record<string, string> = {
    button_save: 'Save', button_cancel: 'Cancel', button_close: 'Close',
    button_new: 'New', button_delete: 'Delete', button_print: 'Print',
    button_nav_first: '⏮', button_nav_prev: '◀', button_nav_next: '▶', button_nav_last: '⏭',
  };
  return d[b.button_type] || b.button_type.replace('button_', '');
};

const getMenuLabel = (m: MenuItem, lang: string | null): string =>
  (lang && m.caption_labels?.[lang]) || m.caption_override || 'Menu Item';

const getControlType = (p: FieldPlacement): string => {
  if (p.control_type) return p.control_type.toUpperCase();
  if (!p.schema_field) return 'TEXT';
  const t = p.schema_field.field_type.toLowerCase();
  const n = p.schema_field.field_name.toLowerCase();
  if (n.endsWith('_id')) return 'COMBOBOX';
  if (t.includes('bool') || t === 'tinyint') return 'CHECKBOX';
  if (t.includes('longtext') || t === 'text' || t === 'mediumtext') return 'TEXTAREA';
  if (t.includes('datetime') || t.includes('timestamp')) return 'DATETIMEPICKER';
  if (t.includes('date')) return 'DATEPICKER';
  if (t.includes('time')) return 'TIMEPICKER';
  return 'TEXT';
};

const LANG_FLAGS: Record<string, string> = { de: '🇩🇪', en: '🇬🇧', fr: '🇫🇷', es: '🇪🇸', it: '🇮🇹', pt: '🇵🇹', nl: '🇳🇱', pl: '🇵🇱', cs: '🇨🇿', hu: '🇭🇺' };

// ========== LIVE DATA HOOK ==========
// Auth headers + 401-refresh handled inside apiClient.cliRequest; no need
// for a local getAuthHeaders() helper any more.

const CONN_STORAGE_KEY = 'scoriet_live_preview_connection';

function loadSavedConnection(): DbConnectionSettings | null {
  try {
    const saved = localStorage.getItem(CONN_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return null;
}

function saveConnection(conn: DbConnectionSettings): void {
  localStorage.setItem(CONN_STORAGE_KEY, JSON.stringify(conn));
}

async function createDataQueryTask(
  conn: DbConnectionSettings,
  tableName: string,
  columns: string[],
  queryType: 'single_record' | 'list',
  limit: number,
  offset: number,
  orderBy?: string,
  targetDeviceId?: string | null,
  projectId?: number | null,
): Promise<{ taskId: number } | { error: string }> {
  try {
    const data = await apiClient.cliRequest('/svc/tasks/data-query', {
      method: 'POST',
      body: JSON.stringify({
        target_device_id: targetDeviceId || null,
        project_id: projectId || null,
        payload: {
          connection_type: conn.connection_type,
          host: conn.host,
          port: conn.port,
          database: conn.database,
          username: conn.username,
          password: conn.password,
          table_name: tableName,
          columns,
          query_type: queryType,
          limit,
          offset: offset,
          order_by: orderBy || null,
        },
      }),
    });
    if (data.success) return { taskId: data.task_id };
    return { error: data.message || 'Failed to create data query task' };
  } catch (err: any) {
    // cliRequest throws on !response.ok; surface the message in the same
    // shape the caller already handles (so existing error UI stays intact).
    return { error: err?.response?.data?.message || err?.message || 'Failed to create data query task' };
  }
}

async function pollTaskResult(taskId: number, maxAttempts = 30, intervalMs = 1000): Promise<{
  success: boolean;
  columns?: string[];
  rows?: LiveDataRow[];
  totalCount?: number;
  columnTypes?: string[];
  error?: string;
}> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, intervalMs));
    let data: any;
    try {
      data = await apiClient.cliRequest(`/svc/tasks/${taskId}`);
    } catch {
      return { success: false, error: 'Failed to check task status' };
    }
    if (!data.success) return { success: false, error: 'Failed to check task status' };

    const task = data.task;
    if (task.status === 'completed') {
      const result = task.result || {};
      if (result.status === 'error') return { success: false, error: result.error || 'Query failed' };
      return {
        success: true,
        columns: result.columns || [],
        rows: result.rows || [],
        totalCount: result.total_count || 0,
        columnTypes: result.column_types || [],
      };
    }
    if (task.status === 'failed') {
      return { success: false, error: task.error_message || 'Task failed' };
    }
    // still pending/processing — continue polling
  }
  return { success: false, error: 'Timeout waiting for data query result' };
}

// ========== WINDOW HEADER HEIGHT ==========
const WIN_HEADER_H = 32;

// ========== MAIN COMPONENT ==========

const FormLivePreviewModal: React.FC<FormLivePreviewModalProps> = ({
  visible, onHide, formSet, window: formWindow, placements, buttons, menuItems,
  schemaFields, selectedLanguage: initialLang, enabledLanguages,
  tableName, projectId, projectDbSettings,
}) => {
  const toastRef = useRef<Toast>(null);
  const [lang, setLang] = useState<string | null>(initialLang);
  const [currentRecord, setCurrentRecord] = useState(0);

  // ========== DEVICES ==========
  const [devices, setDevices] = useState<Array<{ device_id: string; device_name: string; platform: string; is_online: boolean }>>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  // Load devices when dialog opens AND keep them fresh while it's open.
  //
  // The backend's isOnline() check (CliDevice.php) uses a 30-second sliding
  // window over last_seen_at, which scoriet-svc bumps on every queue poll
  // (~5s cadence). A one-shot fetch on open meant the green/red LED only
  // ever reflected the state AT mount — if scoriet-svc came online a second
  // after the modal opened, the user saw a red LED until they re-opened the
  // modal. A 10s poll is well inside the 30s offline threshold so transitions
  // (offline→online and back) show up within one cycle without hammering
  // the endpoint.
  //
  // Auto-select fires on the FIRST fetch only — re-running it on every poll
  // would yank the user's manual selection away the moment any other device
  // came online.
  const hasAutoSelectedRef = useRef(false);
  useEffect(() => {
    if (!visible) {
      hasAutoSelectedRef.current = false; // re-arm for next open
      return;
    }
    const loadDevices = async () => {
      try {
        const data = await apiClient.cliRequest('/svc/devices');
        if (data.success && data.devices) {
          setDevices(data.devices);
          // Only auto-select an ONLINE device on the first load. Auto-picking
          // the first row when nothing is online was a UX trap: a task
          // targeted at an offline device sits pending forever (queue filter
          // requires the polling scoriet-svc to identify itself with that
          // exact device_id). Leaving selectedDeviceId=null means the task
          // is untargeted and gets picked up by whichever service polls next.
          if (!hasAutoSelectedRef.current) {
            const online = data.devices.find((d: { is_online: boolean }) => d.is_online);
            if (online && !selectedDeviceId) setSelectedDeviceId(online.device_id);
            hasAutoSelectedRef.current = true;
          }
        }
      } catch { /* ignore */ }
    };
    loadDevices();
    const intervalId = window.setInterval(loadDevices, 10_000);
    return () => window.clearInterval(intervalId);
  }, [visible]);

  // ========== DATA SOURCE: test vs live ==========
  const [dataSource, setDataSource] = useState<'test' | 'live'>('test');
  const [liveData, setLiveData] = useState<LiveDataRow[]>([]);
  const [liveTotalCount, setLiveTotalCount] = useState(0);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [connSettings, setConnSettings] = useState<DbConnectionSettings>(() => {
    // Priority: 1) saved localStorage, 2) project DB settings, 3) defaults
    const saved = loadSavedConnection();
    if (saved && saved.database) return saved;
    if (projectDbSettings && projectDbSettings.database_name) {
      const dbType = (projectDbSettings.database_type || 'mysql').toLowerCase();
      return {
        connection_type: (dbType === 'postgresql' || dbType === 'postgres') ? 'postgresql' : dbType === 'mssql' ? 'mssql' : 'mysql',
        host: projectDbSettings.database_server || 'localhost',
        port: parseInt(projectDbSettings.database_port || '0') || (dbType === 'postgresql' || dbType === 'postgres' ? 5432 : 3306),
        database: projectDbSettings.database_name,
        username: projectDbSettings.database_username || 'root',
        password: projectDbSettings.database_password || '',
      };
    }
    return { connection_type: 'mysql', host: 'localhost', port: 3306, database: '', username: 'root', password: '' };
  });

  const testData = useMemo(() => generateTestData(schemaFields.length > 0 ? schemaFields : [], 50), [schemaFields]);

  // The active data set: either test or live data
  const activeData = dataSource === 'live' && liveData.length > 0 ? liveData : testData;
  const activeTotalCount = dataSource === 'live' && liveData.length > 0 ? liveTotalCount : testData.length;

  const [formValues, setFormValues] = useState<Record<string, unknown>>(() => activeData[0] || {});

  // Sync formValues when data source or data changes
  useEffect(() => {
    if (activeData.length > 0) {
      const idx = Math.min(currentRecord, activeData.length - 1);
      setCurrentRecord(idx);
      setFormValues({ ...activeData[idx] });
    }
  }, [dataSource, liveData]);

  const goToRecord = useCallback((idx: number) => {
    const c = Math.max(0, Math.min(idx, activeData.length - 1));
    setCurrentRecord(c);
    setFormValues({ ...activeData[c] });
  }, [activeData]);

  // ========== FETCH LIVE DATA ==========

  const fetchLiveData = useCallback(async (conn: DbConnectionSettings) => {
    if (!tableName) {
      setLiveError('No table selected for live data query');
      return;
    }

    const columns = schemaFields.map(f => f.field_name);
    if (columns.length === 0) {
      setLiveError('No columns available for query');
      return;
    }

    setLiveLoading(true);
    setLiveError(null);

    const queryType = formWindow.window_type === 'data_table' ? 'list' : 'single_record';
    const limit = queryType === 'list' ? 200 : 50;

    const taskResult = await createDataQueryTask(conn, tableName, columns, queryType, limit, 0, undefined, selectedDeviceId, projectId);

    if ('error' in taskResult) {
      setLiveError(taskResult.error);
      setLiveLoading(false);
      return;
    }

    const pollResult = await pollTaskResult(taskResult.taskId);

    if (pollResult.success && pollResult.rows) {
      setLiveData(pollResult.rows);
      setLiveTotalCount(pollResult.totalCount || pollResult.rows.length);
      setDataSource('live');
      saveConnection(conn);
      toastRef.current?.show({ severity: 'success', summary: 'Live Data', detail: `${pollResult.rows.length} records loaded from ${tableName}`, life: 3000 });
    } else {
      setLiveError(pollResult.error || 'Failed to fetch data');
      toastRef.current?.show({ severity: 'error', summary: 'Live Data Error', detail: pollResult.error || 'Failed to fetch data', life: 5000 });
    }

    setLiveLoading(false);
  }, [tableName, schemaFields, formWindow.window_type, selectedDeviceId]);

  const handleDataSourceToggle = useCallback(() => {
    if (dataSource === 'live') {
      // Switch back to test data
      setDataSource('test');
      return;
    }
    // Switch to live data — check if we have connection settings with a database
    if (connSettings.database) {
      fetchLiveData(connSettings);
    } else {
      setShowConnectionDialog(true);
    }
  }, [dataSource, connSettings, fetchLiveData]);

  const handleConnectAndFetch = useCallback(() => {
    setShowConnectionDialog(false);
    saveConnection(connSettings);
    fetchLiveData(connSettings);
  }, [connSettings, fetchLiveData]);

  const updateField = useCallback((fn: string, v: unknown) => setFormValues(p => ({ ...p, [fn]: v })), []);

  // Resizable window
  const [winSize, setWinSize] = useState({ w: formWindow.default_width || 800, h: formWindow.default_height || 600 });
  const resizeRef = React.useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const dw = e.clientX - resizeRef.current.startX;
      const dh = e.clientY - resizeRef.current.startY;
      setWinSize({
        w: Math.max(400, resizeRef.current.startW + dw),
        h: Math.max(300, resizeRef.current.startH + dh),
      });
    };
    const onUp = () => { resizeRef.current = null; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  // Colors from FormSet
  const bgColor = formWindow.background_color || formSet.default_background_color || '#1f2937';
  const winColor = formWindow.window_color || formSet.default_window_color || '#374151';
  // Text color: prefer FormSet default (user-defined), only use window override if explicitly set
  // Window text_color is often "#000000" as a DB default — use FormSet's value instead
  const textColor = formSet.default_text_color || formWindow.text_color || '#f3f4f6';
  const btnColor = formSet.default_button_color || '#3b82f6';
  const btnTextColor = formSet.default_button_text_color || '#ffffff';

  const elements = formWindow.elements || [];

  const sortedPlacements = useMemo(() => [...placements].filter(p => p.is_visible).sort((a, b) => a.sort_order - b.sort_order), [placements]);
  const sortedButtons = useMemo(() => [...buttons].filter(b => b.is_visible).sort((a, b) => a.sort_order - b.sort_order), [buttons]);

  // ========== RENDER CONTROL ==========

  const renderControl = useCallback((p: FieldPlacement) => {
    const fn = p.schema_field?.field_name || `f_${p.schema_field_id}`;
    const val = formValues[fn];
    const ct = getControlType(p);
    const h = p.height || 32;
    const ft = p.schema_field?.field_type?.toLowerCase() || '';
    const fnLower = fn.toLowerCase();

    // Image/Blob field — show real image (data URL) or sample placeholder
    if (ft.includes('blob') || ft.includes('binary') || fnLower.includes('image') || fnLower.includes('photo') || fnLower.includes('bild') || fnLower.includes('logo')) {
      // Subtract label height (16px for top label) and small gap to stay within placement bounds
      const labelOffset = (p.label_position === 'top' || !p.label_position) ? 18 : 0;
      const imgH = Math.max(32, h - labelOffset - 8);
      const imgVal = typeof val === 'string' ? val : '';
      const isDataUrl = imgVal.startsWith('data:image/');
      const isBinaryPlaceholder = imgVal.startsWith('[binary');
      const hasImage = isDataUrl && imgVal.length > 30;

      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: imgH }}>
          <div style={{
            width: imgH * 1.2, height: imgH, borderRadius: 6, flexShrink: 0,
            overflow: 'hidden', border: '1px solid rgba(107,114,128,0.3)',
            background: hasImage ? '#000' : 'linear-gradient(90deg, #2f3d99 0%, #5b3db8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            {hasImage ? (
              <img src={imgVal} alt={fn} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <>
                <svg viewBox="0 0 80 60" style={{ width: '80%', height: '80%', opacity: 0.8 }}>
                  <rect width="80" height="60" rx="4" fill="rgba(255,255,255,0.15)" />
                  <circle cx="25" cy="20" r="8" fill="rgba(255,255,255,0.6)" />
                  <polygon points="10,55 30,30 45,42 55,28 70,55" fill="rgba(255,255,255,0.4)" />
                  <polygon points="35,55 50,35 70,55" fill="rgba(255,255,255,0.25)" />
                </svg>
                <span style={{ position: 'absolute', bottom: 2, right: 4, fontSize: 7, color: 'rgba(255,255,255,0.5)' }}>
                  {isBinaryPlaceholder ? imgVal : 'no image'}
                </span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
            <button style={{
              backgroundColor: '#4b5563', color: '#fff', border: 'none', borderRadius: 3,
              padding: '4px 12px', fontSize: 11, cursor: 'pointer',
            }}>Browse...</button>
            <span style={{ fontSize: 9, color: '#9ca3af' }}>
              {hasImage ? `${fn} (${Math.round(imgVal.length * 0.75 / 1024)} KB)` : isBinaryPlaceholder ? imgVal : 'sample.jpg (245 KB)'}
            </span>
          </div>
        </div>
      );
    }
    // Approximate control height (subtract label if top-positioned)
    const ctrlH = (p.label_position === 'top' || !p.label_position) ? Math.max(24, h - 16) : h;

    switch (ct) {
      case 'TEXTAREA': return <InputTextarea value={String(val || '')} onChange={e => updateField(fn, e.target.value)} style={{ width: '100%', height: ctrlH, fontSize: 12, resize: 'none' }} />;
      case 'CHECKBOX': return <div style={{ height: ctrlH, display: 'flex', alignItems: 'center' }}><Checkbox checked={!!val} onChange={e => updateField(fn, e.checked)} /></div>;
      case 'COMBOBOX': return <Dropdown value={String(val || '')} options={[{ label: String(val || 'Option 1'), value: String(val || '') }, { label: 'Option 2', value: 'opt2' }]} onChange={e => updateField(fn, e.value)} style={{ width: '100%', height: Math.min(ctrlH, 34), fontSize: 12 }} />;
      case 'DATEPICKER': return <Calendar value={val instanceof Date ? val : new Date()} onChange={e => updateField(fn, e.value)} dateFormat="dd.mm.yy" style={{ width: '100%' }} inputStyle={{ height: Math.min(ctrlH, 34), fontSize: 12 }} />;
      case 'DATETIMEPICKER': return <Calendar value={val instanceof Date ? val : new Date()} onChange={e => updateField(fn, e.value)} showTime dateFormat="dd.mm.yy" style={{ width: '100%' }} inputStyle={{ height: Math.min(ctrlH, 34), fontSize: 12 }} />;
      case 'TIMEPICKER': return <Calendar value={val instanceof Date ? val : new Date()} onChange={e => updateField(fn, e.value)} timeOnly style={{ width: '100%' }} inputStyle={{ height: Math.min(ctrlH, 34), fontSize: 12 }} />;
      default: {
        const ft = p.schema_field?.field_type?.toLowerCase() || '';
        if (ft.includes('int') || ft.includes('decimal') || ft.includes('float') || ft.includes('double'))
          return <InputNumber value={Number(val) || 0} onValueChange={e => updateField(fn, e.value)} style={{ width: '100%' }} inputStyle={{ height: Math.min(ctrlH, 34), fontSize: 12 }} />;
        const displayVal = val instanceof Date ? formatDateTime(val) : String(val || '');
        return <InputText value={displayVal} onChange={e => updateField(fn, e.target.value)} style={{ width: '100%', height: Math.min(ctrlH, 34), fontSize: 12 }} />;
      }
    }
  }, [formValues, updateField]);

  // ========== RENDER FIELD ==========

  const renderField = useCallback((p: FieldPlacement) => {
    const label = getLabel(p, lang);
    const lp = p.label_position || 'left';
    const lw = p.label_width || 100;
    // Use placement height minus small gap (4px bottom margin like in designer)
    const fieldH = (p.height || 32) - 4;

    if (lp === 'left') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: p.width, height: fieldH }}>
          <span className="live-preview-label" style={{ width: lw, fontSize: 11, fontWeight: 600, flexShrink: 0, textAlign: 'left', lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
          <div style={{ flex: 1, height: fieldH }}>{renderControl(p)}</div>
        </div>
      );
    }
    return (
      <div style={{ width: p.width, height: fieldH }}>
        <span className="live-preview-label" style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 1, lineHeight: '1.2' }}>{label}</span>
        <div style={{ height: fieldH - 14 }}>{renderControl(p)}</div>
      </div>
    );
  }, [lang, textColor, renderControl]);

  // ========== RENDER BUTTON ==========

  const renderButton = useCallback((btn: ButtonPlacement) => {
    const label = getBtnLabel(btn, lang);
    const bg = btn.button_background_color || btnColor;
    const tc = btn.button_text_color || btnTextColor;
    const isNav = btn.button_type.startsWith('button_nav_');
    const handleClick = () => {
      if (btn.button_type === 'button_nav_first') goToRecord(0);
      else if (btn.button_type === 'button_nav_prev') goToRecord(currentRecord - 1);
      else if (btn.button_type === 'button_nav_next') goToRecord(currentRecord + 1);
      else if (btn.button_type === 'button_nav_last') goToRecord(activeData.length - 1);
      else if (btn.button_type === 'button_close') onHide();
    };
    // If button has an icon, show only icon (no duplicate text); otherwise show label
    const hasIcon = btn.button_icon && btn.button_icon.trim().length > 0;
    return (
      <button key={`btn-${btn.id || btn.sort_order}`} onClick={handleClick} style={{
        position: 'absolute', left: btn.x_position, top: btn.y_position,
        width: btn.width || 100, height: btn.height || 32,
        backgroundColor: bg, color: tc, border: 'none', borderRadius: 4,
        fontSize: 12, fontWeight: 500, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        {hasIcon && <i className={`pi ${btn.button_icon}`} style={{ fontSize: isNav ? 14 : 12 }} />}
        {!isNav && label}
      </button>
    );
  }, [lang, btnColor, btnTextColor, currentRecord, activeData.length, goToRecord, onHide]);

  // ========== ANCHOR CALCULATION ==========

  const origW = formWindow.default_width || 800;
  const origH = formWindow.default_height || 600;
  const deltaW = winSize.w - origW;
  const deltaH = winSize.h - origH;

  const applyAnchor = useCallback((x: number, y: number, w: number, h: number, item: any) => {
    let nx = x, ny = y, nw = w, nh = h;

    // Horizontal: anchor_right = 0 (left, no move), 50 (center), 100 (right, full move)
    // anchor_width = stretch percentage
    if (item.anchor_right != null) {
      nx = x + deltaW * (item.anchor_right / 100);
    }
    if (item.anchor_width != null && item.anchor_width > 0) {
      nw = w + deltaW * (item.anchor_width / 100);
    }

    // Vertical: anchor_bottom = 0 (top, no move), 50 (center), 100 (bottom, full move)
    // anchor_height = stretch percentage
    if (item.anchor_bottom != null) {
      ny = y + deltaH * (item.anchor_bottom / 100);
    }
    if (item.anchor_height != null && item.anchor_height > 0) {
      nh = h + deltaH * (item.anchor_height / 100);
    }
    return { x: Math.max(0, nx), y: Math.max(0, ny), w: Math.max(10, nw), h: Math.max(10, nh) };
  }, [deltaW, deltaH]);

  // ========== RENDER: create_edit ==========

  const renderCreateEdit = () => {
    const bodyH = winSize.h - WIN_HEADER_H;

    // Apply anchor to the main container first
    const mainContainer = elements.find(e => e.element_type === 'container');
    const rawCX = mainContainer?.x_position || 0;
    const rawCY = mainContainer?.y_position || 0;
    const rawCW = mainContainer?.width || winSize.w;
    const rawCH = mainContainer?.height || bodyH;
    const ca = applyAnchor(rawCX, rawCY, rawCW, rawCH, mainContainer || {});

    return (
      <div style={{ position: 'relative', width: winSize.w, height: bodyH, overflow: 'hidden' }}>
        {/* Fields positioned relative to the anchored container */}
        {sortedPlacements.map(p => {
          // Field position = container offset + field's own position, then apply field's own anchor
          const fieldX = ca.x + p.x_position;
          const fieldY = ca.y + p.y_position;
          const a = applyAnchor(fieldX, fieldY, p.width, p.height || 32, p);
          return (
            <div key={`f-${p.id || p.schema_field_id}`} style={{
              position: 'absolute', left: a.x, top: a.y,
            }}>
              {renderField({ ...p, width: a.w, height: a.h })}
            </div>
          );
        })}
        {/* Buttons with anchor */}
        {sortedButtons.map(b => {
          const a = applyAnchor(b.x_position, b.y_position, b.width || 100, b.height || 32, b);
          return renderButton({ ...b, x_position: a.x, y_position: a.y, width: a.w, height: a.h });
        })}
        {/* Record counter */}
        {sortedButtons.some(b => b.button_type.startsWith('button_nav_')) && (
          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', fontSize: 11, color: textColor, opacity: 0.6 }}>
            Record {currentRecord + 1} / {activeTotalCount}{dataSource === 'live' && ' (Live)'}
          </div>
        )}
      </div>
    );
  };

  // ========== RENDER: data_table ==========

  const renderDataTable = () => {
    const bodyH = winSize.h - WIN_HEADER_H;

    // Apply anchor to container
    const tableContainer = elements.find(e => e.element_type === 'container');
    const rawCX = tableContainer?.x_position || 0;
    const rawCY = tableContainer?.y_position || 0;
    const rawCW = tableContainer?.width || winSize.w - 20;
    const rawCH = tableContainer?.height || bodyH - 60;
    const ca = applyAnchor(rawCX, rawCY, rawCW, rawCH, tableContainer || {});

    const columns = sortedPlacements.map(p => {
      const fn = (p.schema_field?.field_name || '').toLowerCase();
      const ft = (p.schema_field?.field_type || '').toLowerCase();
      const isImage = ft.includes('blob') || ft.includes('binary') || fn.includes('image') || fn.includes('photo') || fn.includes('bild') || fn.includes('logo');
      return {
        field: p.schema_field?.field_name || `f_${p.schema_field_id}`,
        header: getLabel(p, lang),
        width: p.width || 100,
        isImage,
      };
    });

    return (
      <div style={{ position: 'relative', width: winSize.w, height: bodyH, overflow: 'hidden' }}>
        {/* Table in anchored container — flex layout so pagination sticks to bottom */}
        <div className="live-preview-table-container" style={{
          position: 'absolute', left: ca.x, top: ca.y, width: ca.w, height: ca.h,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <DataTable
            value={activeData}
            paginator rows={15} rowsPerPageOptions={[10, 15, 25, 50]}
            sortMode="multiple"
            stripedRows
            size="small"
            scrollable
            scrollHeight="flex"
            style={{ fontSize: 12, flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            {columns.map(c => (
              <Column key={c.field} field={c.field} header={c.header} sortable
                style={{ minWidth: c.width }}
                body={(row) => {
                  if (c.isImage) {
                    const imgVal = typeof row[c.field] === 'string' ? row[c.field] as string : '';
                    if (imgVal.startsWith('data:image/')) {
                      return <img src={imgVal} alt="" style={{ width: 28, height: 20, objectFit: 'contain', borderRadius: 2 }} />;
                    }
                    return (
                      <svg viewBox="0 0 32 24" style={{ width: 28, height: 20, opacity: 0.6 }}>
                        <rect width="32" height="24" rx="3" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
                        <circle cx="10" cy="9" r="4" fill="rgba(139,92,246,0.3)" />
                        <polygon points="4,21 12,12 18,16 22,10 28,21" fill="rgba(139,92,246,0.25)" />
                      </svg>
                    );
                  }
                  const v = row[c.field];
                  if (v instanceof Date) return formatDate(v);
                  if (typeof v === 'boolean') return v ? '✓' : '✗';
                  return String(v ?? '');
                }}
              />
            ))}
          </DataTable>
        </div>

        {/* Buttons with anchor (absolute position) */}
        {sortedButtons.map(b => {
          const a = applyAnchor(b.x_position, b.y_position, b.width || 100, b.height || 32, b);
          return renderButton({ ...b, x_position: a.x, y_position: a.y, width: a.w, height: a.h });
        })}
      </div>
    );
  };

  // ========== RENDER: main_menu ==========

  const [expandedMenuIds, setExpandedMenuIds] = useState<Set<number | string>>(new Set());
  const [activeMenuId, setActiveMenuId] = useState<number | string | null>(null);

  const renderMainMenu = () => {
    const sorted = [...menuItems].filter(m => m.is_visible).sort((a, b) => a.sort_order - b.sort_order);
    const roots = sorted.filter(m => !m.parent_placement_id || m.menu_depth === 0);

    // Find the menu container for orientation and anchor
    const menuContainer = elements.find(e => e.element_type === 'menu_container') || elements.find(e => e.element_type === 'container');
    const isHorizontal = menuContainer?.container_orientation === 'horizontal';

    // Apply anchor to the menu container
    const cX = menuContainer?.x_position || 0;
    const cY = menuContainer?.y_position || 0;
    const cW = menuContainer?.width || (winSize.w - 20);
    const cH = menuContainer?.height || (winSize.h - WIN_HEADER_H - 10);
    const ca = applyAnchor(cX, cY, cW, cH, menuContainer || {});

    const renderItem = (item: MenuItem, depth = 0): React.ReactNode => {
      const label = getMenuLabel(item, lang);
      const children = sorted.filter(m =>
        (m.parent_placement_id === item.id || m.parent_placement_id === String(item.id)) && m.menu_depth > depth
      );
      const hasChildren = children.length > 0;
      const itemKey = item.id || item.sort_order;
      const isExpanded = expandedMenuIds.has(itemKey);
      const isActive = activeMenuId === itemKey;

      // Check if this is a separator (menu_action === 'separator' or caption is '---')
      const isSeparator = item.menu_action === 'separator' || item.caption_override === '---';
      if (isSeparator) {
        return (
          <div key={`m-${itemKey}`} style={{
            margin: isHorizontal ? '0 4px' : '6px 12px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            width: isHorizontal ? 1 : 'auto',
            height: isHorizontal ? 20 : 1,
            alignSelf: 'center',
          }} />
        );
      }

      const handleClick = () => {
        if (hasChildren) {
          setExpandedMenuIds(prev => {
            const next = new Set(prev);
            if (next.has(itemKey)) next.delete(itemKey); else next.add(itemKey);
            return next;
          });
        }
        setActiveMenuId(itemKey);
      };

      return (
        <div key={`m-${itemKey}`}>
          <div
            onClick={handleClick}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: isHorizontal ? '6px 12px' : `7px ${12 + depth * 16}px`,
              cursor: 'pointer', borderRadius: 4, fontSize: 13, color: textColor,
              backgroundColor: isActive ? 'rgba(59,130,246,0.2)' : 'transparent',
              transition: 'background-color 0.1s',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {/* Expand/collapse icon for parent items */}
            {hasChildren && (
              <i className={`pi ${isExpanded ? 'pi-chevron-down' : 'pi-chevron-right'}`}
                style={{ fontSize: 10, width: 12, textAlign: 'center', opacity: 0.5 }} />
            )}
            {!hasChildren && depth > 0 && <span style={{ width: 12 }} />}
            {/* Menu icon */}
            <i className={`pi ${item.menu_icon || 'pi-file'}`}
              style={{ fontSize: 14, width: 20, textAlign: 'center', opacity: 0.8 }} />
            <span style={{ flex: 1 }}>{label}</span>
            {item.menu_role_required && (
              <span style={{ fontSize: 7, backgroundColor: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '1px 4px', borderRadius: 3 }}>
                {item.menu_role_required}
              </span>
            )}
          </div>
          {/* Children (collapsed by default) */}
          {hasChildren && isExpanded && (
            <div style={{ overflow: 'hidden' }}>
              {children.map(c => renderItem(c, depth + 1))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div style={{
        position: 'absolute', left: ca.x, top: ca.y,
        width: ca.w, height: ca.h,
        overflow: 'auto',
        display: isHorizontal ? 'flex' : 'block',
        flexDirection: isHorizontal ? 'row' : undefined,
        flexWrap: isHorizontal ? 'wrap' : undefined,
        alignItems: isHorizontal ? 'flex-start' : undefined,
      }}>
        {roots.length > 0 ? roots.map(i => renderItem(i)) : (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
            No menu items defined.
          </div>
        )}
      </div>
    );
  };

  // ========== MAIN RENDER ==========

  const winW = winSize.w;
  const winH = winSize.h;

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={null}
      closable={false}
      showHeader={false}
      draggable={false}
      resizable={false}
      style={{ width: winW + 2, padding: 0, boxShadow: 'none', background: 'transparent' }}
      contentStyle={{ padding: 0, overflow: 'visible', background: 'transparent', border: 'none' }}
      className="live-preview-dialog"
      modal
    >
      {/* Custom window frame — no extra border, the window IS the dialog */}
      <div style={{ width: winW, borderRadius: 8, overflow: 'hidden', boxShadow: '0 12px 48px rgba(0,0,0,0.5)' }}>
      <style>{`
        .live-preview-dialog .p-dialog-content { background: transparent !important; border: none !important; padding: 0 !important; overflow: visible !important; }
        .live-preview-dialog { background: transparent !important; border: none !important; box-shadow: none !important; }
        .live-preview-label { color: ${textColor} !important; }
        .live-preview-table-container .p-datatable { display: flex !important; flex-direction: column !important; flex: 1 !important; }
        .live-preview-table-container .p-datatable-wrapper { flex: 1 !important; }
        .live-preview-table-container .p-paginator { margin-top: auto !important; }
      `}</style>
        {/* Window titlebar */}
        <div style={{
          height: WIN_HEADER_H, backgroundColor: winColor, padding: '0 12px',
          display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none',
        }}>
          {/* Traffic lights */}
          <div style={{ display: 'flex', gap: 5 }}>
            <div onClick={onHide} style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5f57', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }} title="Close">
              <span style={{ opacity: 0, transition: 'opacity 0.15s' }} onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>✕</span>
            </div>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#febc2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#28c840' }} />
          </div>
          {/* Title */}
          <span style={{ flex: 1, color: textColor, fontSize: 13, fontWeight: 600 }}>
            {formWindow.display_name || formatFieldName(formWindow.window_type)}
          </span>
          {/* Data source toggle */}
          {tableName && formWindow.window_type !== 'main_menu' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {liveLoading && <ProgressSpinner style={{ width: 16, height: 16 }} strokeWidth="4" />}
              <button
                onClick={handleDataSourceToggle}
                disabled={liveLoading}
                title={dataSource === 'live' ? 'Switch to test data' : 'Load real data from database'}
                style={{
                  background: dataSource === 'live' ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${dataSource === 'live' ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.15)'}`,
                  color: dataSource === 'live' ? '#22c55e' : textColor,
                  borderRadius: 4, padding: '2px 8px', fontSize: 10, cursor: liveLoading ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4, opacity: liveLoading ? 0.6 : 1,
                }}
              >
                <i className={`pi ${dataSource === 'live' ? 'pi-database' : 'pi-play'}`} style={{ fontSize: 10 }} />
                {dataSource === 'live' ? 'Live' : 'Test'}
              </button>
              {dataSource === 'live' && (
                <button
                  onClick={() => fetchLiveData(connSettings)}
                  disabled={liveLoading}
                  title="Refresh live data"
                  style={{
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                    color: textColor, borderRadius: 4, padding: '2px 5px', fontSize: 10, cursor: 'pointer',
                  }}
                >
                  <i className="pi pi-refresh" style={{ fontSize: 10 }} />
                </button>
              )}
              <button
                onClick={() => setShowConnectionDialog(true)}
                title="Database connection settings"
                style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                  color: textColor, borderRadius: 4, padding: '2px 5px', fontSize: 10, cursor: 'pointer',
                }}
              >
                <i className="pi pi-cog" style={{ fontSize: 10 }} />
              </button>
            </div>
          )}
          {/* Language selector — just a flag, very subtle */}
          {enabledLanguages.length > 1 && (
            <select
              value={lang || ''}
              onChange={e => setLang(e.target.value)}
              style={{
                background: 'transparent', border: 'none', color: textColor,
                fontSize: 11, cursor: 'pointer', outline: 'none',
                padding: '2px 4px', borderRadius: 3,
              }}
            >
              {enabledLanguages.map(l => (
                <option key={l.value} value={l.value} style={{ backgroundColor: '#1f2937', color: '#fff' }}>
                  {LANG_FLAGS[l.value] || ''} {l.label}
                </option>
              ))}
            </select>
          )}
          {/* X close button (Windows style) */}
          <div onClick={onHide} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 4, color: textColor, fontSize: 14 }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,0,0,0.6)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            ✕
          </div>
        </div>

        {/* Window body */}
        <div style={{ backgroundColor: bgColor, height: winH - WIN_HEADER_H, overflow: 'hidden', position: 'relative' }}>
          {formWindow.window_type === 'main_menu' && renderMainMenu()}
          {formWindow.window_type === 'create_edit' && renderCreateEdit()}
          {formWindow.window_type === 'data_table' && renderDataTable()}

          {/* Resize handle (bottom-right corner) */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: winSize.w, startH: winSize.h };
            }}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 20, height: 20, cursor: 'nwse-resize', zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" style={{ opacity: 0.3 }}>
              <line x1="9" y1="1" x2="1" y2="9" stroke={textColor} strokeWidth="1" />
              <line x1="9" y1="4" x2="4" y2="9" stroke={textColor} strokeWidth="1" />
              <line x1="9" y1="7" x2="7" y2="9" stroke={textColor} strokeWidth="1" />
            </svg>
          </div>
        </div>
      </div>
      {/* Live Data Error Banner */}
      {liveError && dataSource === 'test' && (
        <div style={{
          position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(239,68,68,0.9)', color: '#fff', padding: '4px 12px', borderRadius: 4,
          fontSize: 11, maxWidth: '80%', textAlign: 'center', zIndex: 200,
        }}>
          {liveError}
        </div>
      )}

      {/* Connection Settings Dialog */}
      <Dialog
        visible={showConnectionDialog}
        onHide={() => setShowConnectionDialog(false)}
        header="Database Connection"
        modal
        style={{ width: 380 }}
        contentStyle={{ backgroundColor: '#1f2937', color: '#f3f4f6', padding: '16px' }}
        headerStyle={{ backgroundColor: '#374151', color: '#f3f4f6' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Device Selector */}
          {devices.length > 0 && (
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 2 }}>Target Device</label>
              <Dropdown
                value={selectedDeviceId}
                options={devices.map(d => ({
                  label: `${d.is_online ? '\u{1F7E2}' : '\u{1F534}'} ${d.device_name} (${d.platform})`,
                  value: d.device_id,
                }))}
                onChange={e => setSelectedDeviceId(e.value)}
                placeholder="Any device..."
                showClear
                style={{ width: '100%', fontSize: 12 }}
              />
              {selectedDeviceId && !devices.find(d => d.device_id === selectedDeviceId)?.is_online && (
                <span style={{ fontSize: 10, color: '#f59e0b', marginTop: 2, display: 'block' }}>
                  Device is offline - task will wait until it comes online
                </span>
              )}
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 2 }}>Database Type</label>
            <Dropdown
              value={connSettings.connection_type}
              options={[
                { label: 'MySQL / MariaDB', value: 'mysql' },
                { label: 'PostgreSQL', value: 'postgresql' },
              ]}
              onChange={e => setConnSettings(p => ({
                ...p,
                connection_type: e.value,
                port: e.value === 'postgresql' ? 5432 : 3306,
              }))}
              style={{ width: '100%', fontSize: 12 }}
            />
          </div>
          {/* Host + Port row.
            * minWidth: 0 on both flex children breaks out of the flex default
            * `min-width: auto`, which otherwise inherits the inner PrimeReact
            * input's min-width (~12rem in the arya theme). Without this the
            * Port column refused to shrink to its 80px slot and the row
            * overflowed the 380px dialog → horizontal scrollbar.
            *
            * useGrouping={false} drops the "3,306" thousands separator (we're
            * showing a TCP port, not a price) so the InputNumber renders
            * "3306" plain and fits the narrow slot. */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 2 }}>Host</label>
              <InputText value={connSettings.host} onChange={e => setConnSettings(p => ({ ...p, host: e.target.value }))} style={{ width: '100%', fontSize: 12, minWidth: 0 }} />
            </div>
            <div style={{ width: 80, minWidth: 0 }}>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 2 }}>Port</label>
              <InputNumber value={connSettings.port} onValueChange={e => setConnSettings(p => ({ ...p, port: e.value || 3306 }))} useGrouping={false} style={{ width: '100%' }} inputStyle={{ fontSize: 12, width: '100%', minWidth: 0 }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 2 }}>Database</label>
            <InputText value={connSettings.database} onChange={e => setConnSettings(p => ({ ...p, database: e.target.value }))} style={{ width: '100%', fontSize: 12 }} placeholder="database name" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 2 }}>Username</label>
              <InputText value={connSettings.username} onChange={e => setConnSettings(p => ({ ...p, username: e.target.value }))} style={{ width: '100%', fontSize: 12 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 2 }}>Password</label>
              <InputText type="password" value={connSettings.password} onChange={e => setConnSettings(p => ({ ...p, password: e.target.value }))} style={{ width: '100%', fontSize: 12 }} />
            </div>
          </div>
          {tableName && (
            <div style={{ fontSize: 11, color: '#9ca3af', padding: '4px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              Table: <strong style={{ color: '#60a5fa' }}>{tableName}</strong>
              {' · '}{schemaFields.length} columns
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button
              onClick={() => setShowConnectionDialog(false)}
              style={{ background: '#4b5563', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', fontSize: 12, cursor: 'pointer' }}
            >Cancel</button>
            <button
              onClick={handleConnectAndFetch}
              disabled={!connSettings.database || !connSettings.host}
              style={{
                background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', fontSize: 12, cursor: 'pointer',
                opacity: (!connSettings.database || !connSettings.host) ? 0.5 : 1,
              }}
            >Connect & Load Data</button>
          </div>
        </div>
      </Dialog>

      <Toast ref={toastRef} position="bottom-right" />
    </Dialog>
  );
};

export default FormLivePreviewModal;
