// resources/js/Components/Panels/ReportLivePreviewModal.tsx
// Live Preview Modal for Report Single and Report List with real database data
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';

// ========== INTERFACES ==========

interface ReportPatternForm {
  id: number;
  form_type: 'report_single' | 'report_list';
  paper_size: string;
  paper_orientation: string;
  paper_unit: string;
  paper_width?: number;
  paper_height?: number;
  margin_top: number;
  margin_right: number;
  margin_bottom: number;
  margin_left: number;
  row_height?: number;
  header_height?: number;
  footer_height?: number;
  list_style_config?: Record<string, unknown>;
}

interface ReportPatternElement {
  id: number;
  element_type: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  content?: string;
  content_labels?: Record<string, string>;
  font_family?: string;
  font_size?: number;
  font_weight?: string;
  font_style?: string;
  text_align?: string;
  text_color?: string;
  border_width?: number;
  border_color?: string;
  background_color?: string;
  label?: string;
}

interface ReportLayoutElement {
  id?: number;
  container_element_id?: number;
  element_type: string;
  schema_field_id?: number;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  content?: string;
  font_family: string;
  font_size: number;
  font_weight: string;
  font_style: string;
  text_decoration: string;
  text_align: string;
  text_color: string;
  border_width?: number;
  border_color?: string;
  background_color?: string;
  caption_override?: string;
  caption_labels?: Record<string, string>;
  label_position?: string;
  label_width?: number;
  control_type?: string;
  header_style?: Record<string, unknown>;
  sort_order: number;
  is_visible: boolean;
}

interface SchemaField {
  id: number;
  field_name: string;
  field_type: string;
  is_primary_key: boolean;
  is_auto_increment: boolean;
  link_table?: string;
  link_field?: string;
  link_display_field?: string;
  control_type?: string;
}

interface DbConnectionSettings {
  connection_type: 'mysql' | 'postgresql' | 'mssql';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

interface ProjectDbSettings {
  database_type?: string;
  database_server?: string;
  database_port?: string;
  database_name?: string;
  database_username?: string;
  database_password?: string;
}

interface LiveDataRow { [key: string]: unknown }

interface ReportLivePreviewModalProps {
  visible: boolean;
  onHide: () => void;
  form: ReportPatternForm;
  elements: ReportPatternElement[];
  layoutElements: ReportLayoutElement[];
  schemaFields: SchemaField[];
  tableName?: string;
  projectId?: number;
  projectDbSettings?: ProjectDbSettings;
  selectedLanguage: string | null;
  enabledLanguages: Array<{ label: string; value: string }>;
  patternName?: string;
  dateFormats?: Record<string, { date_format: string; time_format: string }>;
}

// ========== CONSTANTS ==========

const PAPER_SIZES: Record<string, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  A5: { width: 148, height: 210 },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
};

const MM_TO_PX = 96 / 25.4;

// ========== LIVE DATA HELPERS (same as FormLivePreviewModal) ==========

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  return { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
}

const CONN_STORAGE_KEY = 'scoriet_live_preview_connection';

function loadSavedConnection(): DbConnectionSettings | null {
  try { const s = localStorage.getItem(CONN_STORAGE_KEY); if (s) return JSON.parse(s); } catch { /* */ }
  return null;
}

function saveConnection(conn: DbConnectionSettings): void {
  localStorage.setItem(CONN_STORAGE_KEY, JSON.stringify(conn));
}

async function createDataQueryTask(
  conn: DbConnectionSettings, tableName: string, columns: string[], queryType: 'single_record' | 'list',
  limit: number, offset: number, orderBy?: string, targetDeviceId?: string | null, projectId?: number | null,
): Promise<{ taskId: number } | { error: string }> {
  const res = await fetch('/cli/svc/tasks/data-query', {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify({
      target_device_id: targetDeviceId || null, project_id: projectId || null,
      payload: { connection_type: conn.connection_type, host: conn.host, port: conn.port, database: conn.database,
        username: conn.username, password: conn.password, table_name: tableName, columns, query_type: queryType,
        limit, offset, order_by: orderBy || null },
    }),
  });
  const data = await res.json();
  if (data.success) return { taskId: data.task_id };
  return { error: data.message || 'Failed to create data query task' };
}

async function pollTaskResult(taskId: number, maxAttempts = 30, intervalMs = 1000): Promise<{
  success: boolean; columns?: string[]; rows?: LiveDataRow[]; totalCount?: number; error?: string;
}> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, intervalMs));
    const res = await fetch(`/cli/svc/tasks/${taskId}`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!data.success) return { success: false, error: 'Failed to check task status' };
    const task = data.task;
    if (task.status === 'completed') {
      const result = task.result || {};
      if (result.status === 'error') return { success: false, error: result.error || 'Query failed' };
      return { success: true, columns: result.columns || [], rows: result.rows || [], totalCount: result.total_count || 0 };
    }
    if (task.status === 'failed') return { success: false, error: task.error_message || 'Task failed' };
  }
  return { success: false, error: 'Timeout waiting for data query result' };
}

// ========== TEST DATA ==========

const FIRST_NAMES = ['Max', 'Anna', 'Stefan', 'Maria', 'Thomas', 'Julia', 'Michael', 'Sarah'];
const LAST_NAMES = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer'];
const COMPANIES = ['TechCorp GmbH', 'Alpine Solutions', 'DataFlow AG', 'CloudNine Ltd'];
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[rand(0, arr.length - 1)];

function generateTestData(fields: SchemaField[], count: number): LiveDataRow[] {
  return Array.from({ length: count }, (_, i) => {
    const row: LiveDataRow = {};
    for (const f of fields) {
      const n = f.field_name.toLowerCase();
      const t = f.field_type.toLowerCase();
      if (f.is_auto_increment) { row[f.field_name] = i + 1; continue; }
      if (n.includes('name') || n.includes('vorname')) { row[f.field_name] = pick(FIRST_NAMES); continue; }
      if (n.includes('company') || n.includes('firma')) { row[f.field_name] = pick(COMPANIES); continue; }
      if (n.includes('email')) { row[f.field_name] = `${pick(FIRST_NAMES).toLowerCase()}@test.com`; continue; }
      if (n.includes('price') || n.includes('amount')) { row[f.field_name] = (rand(100, 9990) / 100).toFixed(2); continue; }
      if (t.includes('int') || t.includes('bigint')) { row[f.field_name] = rand(1, 999); continue; }
      if (t.includes('decimal') || t.includes('float')) { row[f.field_name] = (rand(100, 9990) / 100).toFixed(2); continue; }
      if (t.includes('bool') || t === 'tinyint') { row[f.field_name] = Math.random() > 0.5; continue; }
      if (t.includes('date')) { row[f.field_name] = `2026-${String(rand(1, 12)).padStart(2, '0')}-${String(rand(1, 28)).padStart(2, '0')}`; continue; }
      row[f.field_name] = `${pick(LAST_NAMES)} ${rand(1, 99)}`;
    }
    return row;
  });
}

// ========== HELPERS ==========

function getPaperDimensionsMm(form: ReportPatternForm): { w: number; h: number } {
  const base = PAPER_SIZES[form.paper_size] || { width: form.paper_width || 210, height: form.paper_height || 297 };
  const w = form.paper_unit === 'inch' ? (form.paper_width || base.width) * 25.4 : base.width;
  const h = form.paper_unit === 'inch' ? (form.paper_height || base.height) * 25.4 : base.height;
  return form.paper_orientation === 'landscape' ? { w: Math.max(w, h), h: Math.min(w, h) } : { w: Math.min(w, h), h: Math.max(w, h) };
}

const formatFieldName = (n: string) => n.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// Laravel JSON responses sometimes return IDs as strings (depends on the
// driver / payload), while local state typically holds them as numbers.
// Strict === comparisons would silently fail the .find() and return undefined,
// which cascaded into combobox lookups returning the raw FK ("1") instead of
// the joined display ("1 - Elektronik"). Number() casts both sides safely.
function getCaption(el: ReportLayoutElement, lang: string | null, fields: SchemaField[]): string {
  if (lang && el.caption_labels?.[lang]) return el.caption_labels[lang];
  if (el.caption_override) return el.caption_override;
  if (el.schema_field_id) {
    const f = fields.find(ff => Number(ff.id) === Number(el.schema_field_id));
    if (f) return formatFieldName(f.field_name);
  }
  return el.content || el.element_type;
}

function getFieldName(el: ReportLayoutElement, fields: SchemaField[]): string | null {
  if (el.schema_field_id) {
    const f = fields.find(ff => Number(ff.id) === Number(el.schema_field_id));
    if (f) return f.field_name;
  }
  return null;
}

// Small component that loads a report image with auth header
const ReportImageRenderer: React.FC<{ imageId: number; width: number; height: number }> = ({ imageId, width, height }) => {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/report-images/${imageId}/data`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || ''}` },
        });
        if (res.ok && !cancelled) {
          const blob = await res.blob();
          setSrc(URL.createObjectURL(blob));
        }
      } catch { /* */ }
    })();
    return () => { cancelled = true; };
  }, [imageId]);

  if (!src) return <div style={{ width, height, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#94a3b8' }}>Loading...</div>;
  return <img src={src} alt="" style={{ width, height, objectFit: 'contain' }} />;
};

// ========== MAIN COMPONENT ==========

const ReportLivePreviewModal: React.FC<ReportLivePreviewModalProps> = ({
  visible, onHide, form, elements, layoutElements, schemaFields,
  tableName, projectId, projectDbSettings, selectedLanguage: initialLang,
  enabledLanguages, patternName, dateFormats: dateFormatsProp,
}) => {
  const toastRef = useRef<Toast>(null);
  const [lang, setLang] = useState<string | null>(initialLang);
  const [zoom, setZoom] = useState(1);

  // ========== DEVICES ==========
  const [devices, setDevices] = useState<Array<{ device_id: string; device_name: string; platform: string; is_online: boolean }>>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        const res = await fetch('/cli/svc/devices', { headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success && data.devices) {
          setDevices(data.devices);
          const online = data.devices.find((d: { is_online: boolean }) => d.is_online);
          if (online && !selectedDeviceId) setSelectedDeviceId(online.device_id);
        }
      } catch { /* */ }
    })();
  }, [visible]);

  // Project date/time formats + table caption translations — load once synchronously
  const dateFormatsCache = useRef<Record<string, { date_format: string; time_format: string }> | null>(null);
  const tableCaptionCache = useRef<Record<string, string>>({}); // {lang: translated_caption}
  const lastProjectId = useRef<number | null>(null);
  const lastTableName = useRef<string | null>(null);

  // Load translations synchronously if not cached for this project/table
  const projectChanged = projectId && projectId !== lastProjectId.current;
  const tableChanged = tableName && tableName !== lastTableName.current;
  if (projectChanged || tableChanged) {
    lastProjectId.current = projectId || null;
    lastTableName.current = tableName || null;
    // Reload date formats if project changed
    if (projectChanged) {
      dateFormatsCache.current = null;
      if (dateFormatsProp && Object.keys(dateFormatsProp).length > 0) {
        dateFormatsCache.current = dateFormatsProp;
      } else {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', `/api/projects/${projectId}/translations`, false);
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || ''}`);
          xhr.send();
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            const fmts: Record<string, { date_format: string; time_format: string }> = {};
            if (Array.isArray(data)) {
              for (const t of data) {
                if (t.language_code) fmts[t.language_code] = { date_format: t.date_format || 'd.m.Y', time_format: t.time_format || 'H:i' };
              }
            } else if (typeof data === 'object' && data) {
              for (const [key, val] of Object.entries(data)) {
                const t = val as Record<string, string>;
                if (t.date_format || t.time_format) fmts[key] = { date_format: t.date_format || 'd.m.Y', time_format: t.time_format || 'H:i' };
              }
            }
            dateFormatsCache.current = fmts;
          }
        } catch { /* */ }
      }
    }

    // Reload table caption translation if table changed
    if (tableName) {
      try {
        const xhr2 = new XMLHttpRequest();
        xhr2.open('GET', `/api/schema-translations/item/${encodeURIComponent(tableName)}`, false);
        xhr2.setRequestHeader('Accept', 'application/json');
        xhr2.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || ''}`);
        xhr2.send();
        if (xhr2.status === 200) {
          const data = JSON.parse(xhr2.responseText);
          const captions: Record<string, string> = {};
          const translations = data.translations || data;
          if (typeof translations === 'object' && !Array.isArray(translations)) {
            for (const [langKey, val] of Object.entries(translations)) {
              const t = val as Record<string, string>;
              if (t.translated_text) captions[langKey] = t.translated_text;
            }
          }
          tableCaptionCache.current = captions;
        }
      } catch { /* */ }
    }
  }

  const dateFormats = dateFormatsCache.current || dateFormatsProp || {};

  // Format a date/datetime string according to project language format
  // Using a plain function (not useCallback) so it always reads the latest dateFormats state
  const formatDateForLang = (value: string, langCode: string | null): string => {
    if (!value) return '';
    const fmt = dateFormats[langCode || 'de'] || dateFormats[Object.keys(dateFormats)[0]] || { date_format: 'd.m.Y', time_format: 'H:i' };
    // Parse the input: "2026-03-15" or "2026-03-15 21:39:29"
    const parts = value.split(' ');
    const datePart = parts[0] || '';
    const timePart = parts[1] || '';
    const dp = datePart.split('-');
    if (dp.length !== 3) return value;
    const year = dp[0]; const month = dp[1]; const day = dp[2];
    const d = parseInt(day); const m = parseInt(month);

    // Apply date format
    let result = fmt.date_format
      .replace('d', String(d).padStart(2, '0'))
      .replace('j', String(d))
      .replace('m', String(m).padStart(2, '0'))
      .replace('n', String(m))
      .replace('Y', year)
      .replace('y', year.slice(-2));

    // Apply time format if time is present
    if (timePart) {
      const tp = timePart.split(':');
      const h24 = parseInt(tp[0] || '0');
      const min = tp[1] || '00';
      const sec = tp[2] || '00';
      const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
      const ampm = h24 >= 12 ? 'PM' : 'AM';

      const timeStr = fmt.time_format
        .replace('H', String(h24).padStart(2, '0'))
        .replace('G', String(h24))
        .replace('h', String(h12).padStart(2, '0'))
        .replace('g', String(h12))
        .replace('i', min)
        .replace('s', sec)
        .replace('A', ampm)
        .replace('a', ampm.toLowerCase());

      result += ' ' + timeStr;
    }
    return result;
  };

  // ========== DATA SOURCE ==========
  const [dataSource, setDataSource] = useState<'test' | 'live'>('test');
  const [liveData, setLiveData] = useState<LiveDataRow[]>([]);
  const [liveTotalCount, setLiveTotalCount] = useState(0);
  const [liveLoading, setLiveLoading] = useState(false);
  // Lookup cache: { "prod_groups.prodg_no.prodg_composite_no_name": { 1: "1 - Elektronik", 2: "2 - Hardware" } }
  const lookupCache = useRef<Record<string, Record<string, string>>>({});
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [connSettings, setConnSettings] = useState<DbConnectionSettings>(() => {
    const saved = loadSavedConnection();
    if (saved && saved.database) return saved;
    if (projectDbSettings && projectDbSettings.database_name) {
      const dbType = (projectDbSettings.database_type || 'mysql').toLowerCase();
      return {
        connection_type: (dbType === 'postgresql' || dbType === 'postgres') ? 'postgresql' : 'mysql',
        host: projectDbSettings.database_server || 'localhost',
        port: parseInt(projectDbSettings.database_port || '0') || (dbType === 'postgresql' ? 5432 : 3306),
        database: projectDbSettings.database_name,
        username: projectDbSettings.database_username || 'root',
        password: projectDbSettings.database_password || '',
      };
    }
    return { connection_type: 'mysql', host: 'localhost', port: 3306, database: '', username: 'root', password: '' };
  });

  const testData = useMemo(() => generateTestData(schemaFields, form.form_type === 'report_list' ? 30 : 10), [schemaFields, form.form_type]);
  const activeData = dataSource === 'live' && liveData.length > 0 ? liveData : testData;
  const [currentRecord, setCurrentRecord] = useState(0);

  // ========== FETCH LIVE DATA ==========
  // Load lookup data for combobox fields via Service
  const loadLookupData = async (conn: DbConnectionSettings) => {
    // Find all combobox fields that need lookup
    const comboFields = layoutElements.filter(el =>
      el.is_visible && el.element_type === 'field' && el.control_type === 'combobox'
    );
    if (comboFields.length === 0) return;

    for (const el of comboFields) {
      // Number() cast — see note on getCaption() re: Laravel string IDs.
      const field = schemaFields.find(f => Number(f.id) === Number(el.schema_field_id));
      if (!field || !field.link_table || !field.link_field || !field.link_display_field) continue;

      const cacheKey = `${field.link_table}.${field.link_field}.${field.link_display_field}`;
      if (lookupCache.current[cacheKey]) continue; // Already cached

      // Query the lookup table for key→display mapping
      const columns = [field.link_field, field.link_display_field];
      const taskResult = await createDataQueryTask(
        conn, field.link_table, columns, 'list', 500, 0,
        undefined, selectedDeviceId, projectId
      );
      if ('error' in taskResult) continue;

      const pollResult = await pollTaskResult(taskResult.taskId, 15, 500);
      if (pollResult.success && pollResult.rows) {
        const mapping: Record<string, string> = {};
        for (const row of pollResult.rows) {
          const key = String(row[field.link_field] ?? '');
          const display = String(row[field.link_display_field] ?? '');
          if (key) mapping[key] = display;
        }
        lookupCache.current[cacheKey] = mapping;
      }
    }
  };

  const fetchLiveData = useCallback(async (conn: DbConnectionSettings) => {
    if (!tableName) return;
    const columns = schemaFields.map(f => f.field_name);
    if (columns.length === 0) return;
    setLiveLoading(true);
    const queryType = form.form_type === 'report_list' ? 'list' : 'single_record';
    const limit = queryType === 'list' ? 200 : 50;
    const taskResult = await createDataQueryTask(conn, tableName, columns, queryType, limit, 0, undefined, selectedDeviceId, projectId);
    if ('error' in taskResult) { setLiveLoading(false); return; }
    const pollResult = await pollTaskResult(taskResult.taskId);
    if (pollResult.success && pollResult.rows) {
      setLiveData(pollResult.rows);
      setLiveTotalCount(pollResult.totalCount || pollResult.rows.length);
      setDataSource('live');
      saveConnection(conn);

      // Load lookup data for combobox fields
      await loadLookupData(conn);

      toastRef.current?.show({ severity: 'success', summary: 'Live Data', detail: `${pollResult.rows.length} records loaded`, life: 3000 });
    } else {
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: pollResult.error || 'Failed', life: 5000 });
    }
    setLiveLoading(false);
  }, [tableName, schemaFields, form.form_type, selectedDeviceId, projectId]);

  const handleToggleDataSource = useCallback(() => {
    if (dataSource === 'live') { setDataSource('test'); return; }
    if (connSettings.database) fetchLiveData(connSettings);
    else setShowConnectionDialog(true);
  }, [dataSource, connSettings, fetchLiveData]);

  // ========== PAPER CALC ==========
  const paper = useMemo(() => getPaperDimensionsMm(form), [form]);
  const paperPxW = paper.w * MM_TO_PX;
  const paperPxH = paper.h * MM_TO_PX;
  const marginPx = {
    top: form.margin_top * MM_TO_PX, right: form.margin_right * MM_TO_PX,
    bottom: form.margin_bottom * MM_TO_PX, left: form.margin_left * MM_TO_PX,
  };
  const printableW = paperPxW - marginPx.left - marginPx.right;
  const printableH = paperPxH - marginPx.top - marginPx.bottom;

  // ========== VISIBLE FIELDS (sorted) ==========
  const visibleFields = useMemo(() =>
    layoutElements.filter(el => el.is_visible && el.element_type === 'field').sort((a, b) => a.sort_order - b.sort_order),
    [layoutElements]
  );
  // Resolve combobox lookup value
  const resolveLookup = (el: ReportLayoutElement, rawValue: unknown): string => {
    if (el.control_type !== 'combobox' || rawValue == null) return formatCellValue(rawValue);
    // Number() cast — see note on getCaption() re: Laravel string IDs.
    const field = schemaFields.find(f => Number(f.id) === Number(el.schema_field_id));
    if (!field || !field.link_table || !field.link_field || !field.link_display_field) return formatCellValue(rawValue);
    const cacheKey = `${field.link_table}.${field.link_field}.${field.link_display_field}`;
    const mapping = lookupCache.current[cacheKey];
    if (mapping) {
      const display = mapping[String(rawValue)];
      if (display) return display;
    }
    return formatCellValue(rawValue);
  };

  const visibleControls = useMemo(() =>
    layoutElements.filter(el => el.is_visible && el.element_type !== 'field').sort((a, b) => a.sort_order - b.sort_order),
    [layoutElements]
  );

  // Format cell values - detect dates/datetimes and apply project language format
  const formatCellValue = (val: unknown): string => {
    if (val == null) return '';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    const s = String(val);
    // Detect ISO date: "2026-03-15" or datetime: "2026-03-15 21:39:29"
    if (s.length >= 10 && s.length <= 19 && s[4] === '-' && s[7] === '-') {
      return formatDateForLang(s, lang);
    }
    return s;
  };

  // ========== RENDER: report_single ==========
  const renderSingle = () => {
    const record = activeData[currentRecord] || activeData[0] || {};

    return (
      <div style={{ position: 'relative', width: printableW, height: printableH }}>
        {/* Pattern elements (containers, static content) */}
        {elements.filter(e => e.element_type !== 'container').map(el => {
          const x = el.x_position * MM_TO_PX;
          const y = el.y_position * MM_TO_PX;
          const w = el.width * MM_TO_PX;
          const h = el.height * MM_TO_PX;
          const content = (lang && el.content_labels?.[lang]) || el.content || '';

          if (el.element_type === 'line_horizontal') return <div key={`pe-${el.id}`} style={{ position: 'absolute', left: x, top: y, width: w, borderTop: `${el.border_width || 1}px solid ${el.border_color || '#000'}` }} />;
          if (el.element_type === 'line_vertical') return <div key={`pe-${el.id}`} style={{ position: 'absolute', left: x, top: y, height: h, borderLeft: `${el.border_width || 1}px solid ${el.border_color || '#000'}` }} />;
          if (el.element_type === 'box') return <div key={`pe-${el.id}`} style={{ position: 'absolute', left: x, top: y, width: w, height: h, border: `${el.border_width || 1}px solid ${el.border_color || '#000'}`, backgroundColor: el.background_color || 'transparent' }} />;

          if (el.element_type === 'static_text' || el.element_type === 'heading') {
            const elAlign = (el.text_align || 'left') as 'left' | 'center' | 'right';
            return <div key={`pe-${el.id}`} style={{ position: 'absolute', left: x, top: y, width: w, height: h, fontFamily: el.font_family || 'Arial', fontSize: (el.font_size || 10) * MM_TO_PX / 2.83, fontWeight: el.font_weight || 'normal', color: el.text_color || '#000', textAlign: elAlign, display: 'flex', alignItems: 'center', justifyContent: elAlign === 'center' ? 'center' : elAlign === 'right' ? 'flex-end' : 'flex-start' }}>{replacePlaceholders(content)}</div>;
          }
          return null;
        })}

        {/* Layout fields */}
        {visibleFields.map(el => {
          const x = el.x_position * MM_TO_PX;
          const y = el.y_position * MM_TO_PX;
          const w = el.width * MM_TO_PX;
          const h = el.height * MM_TO_PX;
          const fieldName = getFieldName(el, schemaFields);
          const caption = getCaption(el, lang, schemaFields);
          const rawValue = fieldName ? record[fieldName] : '';
          // Number() cast — see note on getCaption() re: Laravel string IDs.
          const field = schemaFields.find(f => Number(f.id) === Number(el.schema_field_id));
          const isCheckbox = el.control_type === 'checkbox' || (!el.control_type && field && (field.field_type.toLowerCase() === 'tinyint' || field.field_type.toLowerCase().includes('bool')));
          const isCombobox = el.control_type === 'combobox';
          const isImage = typeof rawValue === 'string' && String(rawValue).startsWith('data:image/');
          const value = isCheckbox ? '' : isCombobox ? resolveLookup(el, rawValue) : formatCellValue(rawValue);
          const checked = isCheckbox ? (rawValue === true || rawValue === 1 || rawValue === '1' || rawValue === 'Yes') : false;

          const labelPos = el.label_position || 'top';
          const labelW = labelPos === 'left' ? (el.label_width || 25) * MM_TO_PX : 0;
          const fs = (el.font_size || 10) * MM_TO_PX / 2.83;
          const labelFs = fs * 0.7;

          const valueStyle: React.CSSProperties = {
            fontFamily: el.font_family || 'Arial', fontSize: fs,
            fontWeight: el.font_weight || 'normal', fontStyle: el.font_style || 'normal',
            textAlign: (el.text_align as 'left' | 'center' | 'right') || 'left',
            color: el.text_color || '#000', textDecoration: el.text_decoration || 'none',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          };

          // Render based on label position
          if (labelPos === 'none') {
            return (
              <div key={`le-${el.id || el.sort_order}`} style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
                {isCheckbox ? <div style={{ ...valueStyle, display: 'flex', alignItems: 'center' }}>{checked ? '☑' : '☐'}</div>
                  : isImage ? <img src={String(rawValue)} alt="" style={{ maxWidth: w, maxHeight: h, objectFit: 'contain' }} />
                  : <div style={valueStyle}>{value}</div>}
              </div>
            );
          }

          if (labelPos === 'left') {
            return (
              <div key={`le-${el.id || el.sort_order}`} style={{ position: 'absolute', left: x, top: y, width: w, height: h, display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: labelW, flexShrink: 0, fontSize: labelFs, color: '#6b7280', fontWeight: 600, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{caption}</div>
                <div style={{ flex: 1 }}>
                  {isCheckbox ? <div style={{ ...valueStyle, display: 'flex', alignItems: 'center' }}>{checked ? '☑' : '☐'}</div>
                    : isImage ? <img src={String(rawValue)} alt="" style={{ maxHeight: h, objectFit: 'contain' }} />
                    : <div style={valueStyle}>{value}</div>}
                </div>
              </div>
            );
          }

          // Default: top
          return (
            <div key={`le-${el.id || el.sort_order}`} style={{ position: 'absolute', left: x, top: y, width: w }}>
              <div style={{ fontSize: labelFs, color: '#6b7280', marginBottom: 1 }}>{caption}</div>
              {isCheckbox ? <div style={{ ...valueStyle, display: 'flex', alignItems: 'center' }}>{checked ? '☑' : '☐'}</div>
                : isImage ? <img src={String(rawValue)} alt={caption} style={{ maxWidth: w, maxHeight: h - 12, objectFit: 'contain' }} />
                : <div style={valueStyle}>{value}</div>}
            </div>
          );
        })}

        {/* Page controls (page_number, page_date, static_text, etc.) — use shared renderControl */}
        {visibleControls.map((el, i) => renderControl(el, `ctrl-${i}`, 0))}
      </div>
    );
  };

  // ========== RENDER: report_list ==========

  // Replace template placeholders in content
  const replacePlaceholders = (text: string): string => {
    // Build today/now using project date format for current language
    const now = new Date();
    const isoDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isoTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const formattedDate = formatDateForLang(isoDate, lang);
    const formattedDateTime = formatDateForLang(`${isoDate} ${isoTime}`, lang);

    // {:caption:} = translated table name (from schema translations) or humanized fallback
    const translatedCaption = lang && tableCaptionCache.current[lang] ? tableCaptionCache.current[lang] : null;
    const humanizedTable = translatedCaption || (tableName || 'Table').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return text
      // Scoriet {:...:} style placeholders
      .replace(/\{:tablename:\}/gi, tableName || 'Table')
      .replace(/\{:caption:\}/gi, humanizedTable)
      .replace(/\{:projectname:\}/gi, patternName || 'Project')
      .replace(/\{:date:\}/gi, formattedDate)
      .replace(/\{:time:\}/gi, formattedDateTime.split(' ').slice(1).join(' ') || isoTime)
      .replace(/\{:n:\}/gi, '1')
      .replace(/\{:pages:\}/gi, '1')
      // Also support {date}, {n}, {pages} without colons (legacy)
      .replace(/\{date\}/gi, formattedDate)
      .replace(/\{time\}/gi, formattedDateTime.split(' ').slice(1).join(' ') || isoTime)
      .replace(/\{n\}/gi, '1')
      .replace(/\{pages\}/gi, '1');
  };

  // Render a generic control element (shared between sections)
  const renderControl = (el: ReportPatternElement | ReportLayoutElement, keyPrefix: string, offsetY = 0) => {
    const x = el.x_position * MM_TO_PX;
    const y = (el.y_position - offsetY) * MM_TO_PX;
    const w = el.width * MM_TO_PX;
    const h = el.height * MM_TO_PX;
    const eType = el.element_type;
    const fs = ((el as ReportLayoutElement).font_size || (el as ReportPatternElement).font_size || 10) * MM_TO_PX / 2.83;
    const ff = (el as ReportLayoutElement).font_family || (el as ReportPatternElement).font_family || 'Arial';
    const fw = (el as ReportLayoutElement).font_weight || (el as ReportPatternElement).font_weight || 'normal';
    const ta = ((el as ReportLayoutElement).text_align || (el as ReportPatternElement).text_align || 'left') as 'left' | 'center' | 'right';
    const tc = (el as ReportLayoutElement).text_color || (el as ReportPatternElement).text_color || '#000';
    // Content: check layout element captions per language, then pattern content_labels, then content
    let content = '';
    if ('caption_labels' in el && lang && el.caption_labels?.[lang]) content = el.caption_labels[lang];
    else if ('content_labels' in el && lang && (el as ReportPatternElement).content_labels?.[lang]) content = (el as ReportPatternElement).content_labels![lang];
    else if ('caption_override' in el && el.caption_override) content = el.caption_override;
    else if (el.content) content = el.content;

    // Always run through placeholder replacement (handles {:tablename:}, {:date:}, {:n:}, {:pages:} etc.)
    content = replacePlaceholders(content);

    if (eType === 'line_horizontal') return <div key={`${keyPrefix}-${(el as ReportPatternElement).id || (el as ReportLayoutElement).sort_order}`} style={{ position: 'absolute', left: x, top: y, width: w, borderTop: `${el.border_width || 1}px solid ${el.border_color || '#000'}` }} />;
    if (eType === 'line_vertical') return <div key={`${keyPrefix}-${(el as ReportPatternElement).id || (el as ReportLayoutElement).sort_order}`} style={{ position: 'absolute', left: x, top: y, height: h, borderLeft: `${el.border_width || 1}px solid ${el.border_color || '#000'}` }} />;
    if (eType === 'box') return <div key={`${keyPrefix}-${(el as ReportPatternElement).id || (el as ReportLayoutElement).sort_order}`} style={{ position: 'absolute', left: x, top: y, width: w, height: h, border: `${el.border_width || 1}px solid ${el.border_color || '#000'}`, backgroundColor: el.background_color || 'transparent' }} />;

    if (eType === 'image_placeholder') {
      let imgId: number | null = null;
      try {
        const ids = JSON.parse((el as ReportLayoutElement).content || (el as ReportPatternElement).content || '{}');
        imgId = (lang && ids[lang]) || ids['all'] || null;
      } catch { /* */ }
      // Also check pattern element content for images not in layout
      if (!imgId && 'label' in el) {
        try {
          const ids = JSON.parse(el.content || '{}');
          imgId = (lang && ids[lang]) || ids['all'] || null;
        } catch { /* */ }
      }
      return (
        <div key={`${keyPrefix}-${(el as ReportPatternElement).id || (el as ReportLayoutElement).sort_order}`} style={{ position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden' }}>
          {imgId ? <ReportImageRenderer imageId={imgId} width={w} height={h} /> :
            <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#94a3b8' }}>Image</div>}
        </div>
      );
    }

    return (
      <div key={`${keyPrefix}-${(el as ReportPatternElement).id || (el as ReportLayoutElement).sort_order}`} style={{
        position: 'absolute', left: x, top: y, width: w, height: h,
        fontFamily: ff, fontSize: fs, fontWeight: fw, textAlign: ta, color: tc,
        fontStyle: (el as ReportLayoutElement).font_style || 'normal',
        textDecoration: (el as ReportLayoutElement).text_decoration || 'none',
        display: 'flex', alignItems: eType === 'heading' ? 'flex-end' : 'center',
        justifyContent: ta === 'center' ? 'center' : ta === 'right' ? 'flex-end' : 'flex-start',
        overflow: 'hidden',
      }}>{content}</div>
    );
  };

  const renderList = () => {
    const ls = (form.list_style_config || {}) as Record<string, string>;
    const rowH = (form.row_height || 8) * MM_TO_PX;

    // Find sections
    const headerSection = elements.find(e => e.element_type === 'header_section');
    const _tableHeader = elements.find(e => e.element_type === 'table_header');
    const _detailSection = elements.find(e => e.element_type === 'detail_section');
    const footerSection = elements.find(e => e.element_type === 'footer_section');

    const headerH = headerSection ? headerSection.height * MM_TO_PX : 0;
    // Table header row height = one row height (not the full pattern element height)
    const tableHeaderH = visibleFields.length > 0 ? rowH : 0;
    const footerH = footerSection ? footerSection.height * MM_TO_PX : 0;
    const detailH = printableH - headerH - tableHeaderH - footerH;

    // Table X position and width from table_header or detail_section container
    const tableRef = _tableHeader || _detailSection;
    const tableLeftPx = tableRef ? Number(tableRef.x_position) * MM_TO_PX : 0;
    const tableWidthPx = tableRef ? Number(tableRef.width) * MM_TO_PX : printableW;

    // Non-field layout elements — assign to header/footer by Y-position
    const nonFieldLayoutElements = layoutElements.filter(el => el.is_visible && el.element_type !== 'field');

    // Section boundaries (in mm from printable area top) — force Number() since API returns strings
    const headerEndMm = headerSection ? Number(headerSection.y_position) + Number(headerSection.height) : 0;
    const footerStartMm = footerSection ? Number(footerSection.y_position) : 9999;

    // Also include Pattern-Designer controls that haven't been copied to layout yet
    // These are non-section pattern elements (static_text, heading, image_placeholder, etc.)
    const sectionTypesList = ['header_section', 'detail_section', 'footer_section', 'table_header', 'container'];
    const patternControls = elements.filter(e => !sectionTypesList.includes(e.element_type));

    // Check which pattern controls already have a layout copy (by matching Y-position and element type)
    const layoutControlPositions = new Set(
      nonFieldLayoutElements.map(el => `${el.element_type}_${Number(el.x_position).toFixed(1)}_${Number(el.y_position).toFixed(1)}`)
    );
    const uncopiedPatternControls = patternControls.filter(pe => {
      const key = `${pe.element_type}_${Number(pe.x_position).toFixed(1)}_${Number(pe.y_position).toFixed(1)}`;
      return !layoutControlPositions.has(key);
    });

    // Merge both sources into header/footer
    const allHeaderControls: (ReportLayoutElement | ReportPatternElement)[] = [];
    const allFooterControls: (ReportLayoutElement | ReportPatternElement)[] = [];

    for (const el of nonFieldLayoutElements) {
      const yMm = Number(el.y_position);
      if (headerSection && yMm < headerEndMm) allHeaderControls.push(el);
      else if (footerSection && yMm >= footerStartMm) allFooterControls.push(el);
    }
    for (const el of uncopiedPatternControls) {
      const yMm = Number(el.y_position);
      if (headerSection && yMm < headerEndMm) allHeaderControls.push(el);
      else if (footerSection && yMm >= footerStartMm) allFooterControls.push(el);
    }

    // Table header styling from list_style_config
    const hdrBg = ls.header_bg_color || '#e0e0e0';
    const hdrColor = ls.header_text_color || '#000';
    const hdrFw = ls.header_font_weight || 'bold';
    const hdrFs = Number(ls.header_font_size || 9) * MM_TO_PX / 2.83;
    // Border helper: show border if color OR width is set (default width=1 if only color/style set)
    const mkBorder = (w?: string | number, s?: string, c?: string) => {
      if (!w && !c && !s) return 'none';
      return `${w || 1}px ${s || 'solid'} ${c || '#000'}`;
    };
    const hdrBorderTop = mkBorder(ls.header_border_top_width, ls.header_border_top_style, ls.header_border_top_color);
    const hdrBorderBottom = mkBorder(ls.header_border_bottom_width, ls.header_border_bottom_style, ls.header_border_bottom_color);
    const hdrBorderLeft = mkBorder(ls.header_border_left_width, ls.header_border_left_style, ls.header_border_left_color);
    const hdrBorderRight = mkBorder(ls.header_border_right_width, ls.header_border_right_style, ls.header_border_right_color);

    // Row styling
    const evenBg = ls.row_even_bg_color || '#fff';
    const oddBg = ls.row_odd_bg_color || '#f8f8f8';
    const rowBorderBottom = mkBorder(ls.row_border_bottom_width || ls.row_border_bottom, ls.row_border_bottom_style, ls.row_border_bottom_color || ls.row_border_color);

    // Column separators — show if color or style is set (default width=1)
    const colSepColor = ls.column_separator_color || '';
    const colSepStyle = ls.column_separator_style || 'solid';
    const colSepW = Number(ls.column_separator_width || (colSepColor ? 1 : 0));

    // Detail area borders
    const detailBorderLeft = mkBorder(ls.detail_border_left_width, ls.detail_border_left_style, ls.detail_border_left_color);
    const detailBorderRight = mkBorder(ls.detail_border_right_width, ls.detail_border_right_style, ls.detail_border_right_color);
    const detailBorderBottom = mkBorder(ls.detail_border_bottom_width, ls.detail_border_bottom_style, ls.detail_border_bottom_color);

    const maxRows = Math.max(1, Math.floor(detailH / rowH));
    const displayData = activeData.slice(0, maxRows);

    // Detail area height = only as tall as actual data rows (not full remaining space)
    const actualDetailH = displayData.length * rowH;

    return (
      <div style={{ position: 'relative', width: printableW, height: printableH }}>
        {/* ===== HEADER SECTION ===== */}
        {headerSection && (
          <div style={{ position: 'absolute', left: 0, top: 0, width: printableW, height: headerH, overflow: 'hidden' }}>
            {allHeaderControls.map((el, i) => renderControl(el, `hc-${i}`, headerSection.y_position))}
          </div>
        )}

        {/* ===== TABLE HEADER (column titles) ===== */}
        {visibleFields.length > 0 && (
          <div style={{ position: 'absolute', left: tableLeftPx, top: headerH, width: tableWidthPx, height: tableHeaderH, display: 'flex', background: hdrBg, borderTop: hdrBorderTop, borderBottom: hdrBorderBottom, borderLeft: hdrBorderLeft, borderRight: hdrBorderRight }}>
            {visibleFields.map((el, ci) => {
              const w = el.width * MM_TO_PX;
              const caption = getCaption(el, lang, schemaFields);
              const hs = (el.header_style || {}) as Record<string, string>;
              return (
                <div key={`thdr-${el.id || el.sort_order}`} style={{
                  width: w, flexShrink: 0, padding: '1px 3px', display: 'flex', alignItems: 'center',
                  fontFamily: hs.font_family || ls.header_font_family || el.font_family || 'Arial',
                  fontSize: Number(hs.font_size || 0) * MM_TO_PX / 2.83 || hdrFs,
                  fontWeight: hs.font_weight || hdrFw,
                  color: hs.text_color || hdrColor,
                  textAlign: (hs.text_align as 'left' | 'center' | 'right') || 'left',
                  borderRight: ci < visibleFields.length - 1 && colSepW > 0 ? `${colSepW}px ${colSepStyle} ${colSepColor}` : 'none',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{caption}</div>
              );
            })}
          </div>
        )}

        {/* ===== DETAIL ROWS (only as tall as actual data) ===== */}
        <div style={{ position: 'absolute', left: tableLeftPx, top: headerH + tableHeaderH, width: tableWidthPx, height: actualDetailH, overflow: 'hidden', borderLeft: detailBorderLeft, borderRight: detailBorderRight, borderBottom: displayData.length > 0 ? detailBorderBottom : 'none' }}>
          {displayData.map((row, ri) => (
            <div key={`drow-${ri}`} style={{ display: 'flex', background: ri % 2 === 0 ? evenBg : oddBg, height: rowH, borderBottom: rowBorderBottom }}>
              {visibleFields.map((el, ci) => {
                const w = el.width * MM_TO_PX;
                const fieldName = getFieldName(el, schemaFields);
                const rawVal = fieldName ? row[fieldName] : '';
                const val = el.control_type === 'combobox' ? resolveLookup(el, rawVal) : formatCellValue(rawVal);
                const isImage = typeof val === 'string' && val.startsWith('data:image/');
                return (
                  <div key={`dcell-${ci}`} style={{
                    width: w, flexShrink: 0, padding: '0 3px', display: 'flex', alignItems: 'center',
                    fontFamily: el.font_family || 'Arial',
                    fontSize: (el.font_size || 9) * MM_TO_PX / 2.83,
                    color: el.text_color || '#000',
                    textAlign: (el.text_align as 'left' | 'center' | 'right') || 'left',
                    borderRight: ci < visibleFields.length - 1 && colSepW > 0 ? `${colSepW}px ${colSepStyle} ${colSepColor}` : 'none',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {isImage ? <img src={val} alt="" style={{ height: rowH - 2, objectFit: 'contain' }} /> : val}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* ===== FOOTER SECTION ===== */}
        {footerSection && (
          <div style={{ position: 'absolute', left: 0, bottom: 0, width: printableW, height: footerH, overflow: 'hidden' }}>
            {allFooterControls.map((el, i) => renderControl(el, `fc-${i}`, footerSection.y_position))}
          </div>
        )}
      </div>
    );
  };

  // ========== PRINT ==========
  const handlePrint = useCallback(() => {
    const paperMm = getPaperDimensionsMm(form);
    const content = document.getElementById('report-preview-paper');
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>${patternName || 'Report'}</title>
      <style>
        @page { size: ${paperMm.w}mm ${paperMm.h}mm; margin: ${form.margin_top}mm ${form.margin_right}mm ${form.margin_bottom}mm ${form.margin_left}mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    </head><body>${content.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); };
  }, [form, patternName]);

  // ========== ZOOM ==========
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(z => Math.max(0.25, Math.min(3, z + (e.deltaY < 0 ? 0.1 : -0.1))));
    }
  }, []);

  // ========== RENDER ==========
  return (
    <Dialog
      visible={visible} onHide={onHide} header={null} closable={false} showHeader={false}
      draggable={false} resizable={false} modal
      style={{ width: '95vw', maxWidth: 1400, height: '90vh', padding: 0, background: 'transparent', boxShadow: 'none' }}
      contentStyle={{ padding: 0, overflow: 'hidden', background: '#374151', border: 'none', display: 'flex', flexDirection: 'column' }}
      className="report-preview-dialog"
    >
      <style>{`.report-preview-dialog .p-dialog-content { background: #374151 !important; border: none !important; padding: 0 !important; }`}</style>

      {/* Titlebar */}
      <div style={{ height: 36, background: '#1f2937', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, flexShrink: 0 }}>
        <span style={{ color: '#f3f4f6', fontSize: 13, fontWeight: 600, flex: 1 }}>
          {patternName || 'Report'} — {form.form_type === 'report_list' ? 'List' : 'Single'} ({form.paper_size} {form.paper_orientation})
        </span>

        {/* Zoom */}
        <button onClick={() => setZoom(z => Math.max(0.25, z - 0.1))} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 3, padding: '2px 6px', cursor: 'pointer', fontSize: 11 }}>-</button>
        <span style={{ color: '#9ca3af', fontSize: 10, width: 40, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 3, padding: '2px 6px', cursor: 'pointer', fontSize: 11 }}>+</button>

        {/* Data source toggle */}
        {tableName && (
          <>
            {liveLoading && <ProgressSpinner style={{ width: 14, height: 14 }} strokeWidth="4" />}
            <button onClick={handleToggleDataSource} disabled={liveLoading} style={{
              background: dataSource === 'live' ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${dataSource === 'live' ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.15)'}`,
              color: dataSource === 'live' ? '#22c55e' : '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 10, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <i className={`pi ${dataSource === 'live' ? 'pi-database' : 'pi-play'}`} style={{ fontSize: 10 }} />
              {dataSource === 'live' ? 'Live' : 'Test'}
            </button>
            {dataSource === 'live' && <button onClick={() => fetchLiveData(connSettings)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: 4, padding: '2px 5px', fontSize: 10, cursor: 'pointer' }}><i className="pi pi-refresh" style={{ fontSize: 10 }} /></button>}
            <button onClick={() => setShowConnectionDialog(true)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: 4, padding: '2px 5px', fontSize: 10, cursor: 'pointer' }}><i className="pi pi-cog" style={{ fontSize: 10 }} /></button>
          </>
        )}

        {/* Language */}
        {enabledLanguages.length > 1 && (
          <select value={lang || ''} onChange={e => setLang(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer', outline: 'none' }}>
            {enabledLanguages.map(l => <option key={l.value} value={l.value} style={{ background: '#1f2937' }}>{l.label}</option>)}
          </select>
        )}

        {/* Print */}
        <button onClick={handlePrint} style={{ background: '#3b82f6', border: 'none', color: '#fff', borderRadius: 4, padding: '3px 10px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <i className="pi pi-print" style={{ fontSize: 11 }} /> Print
        </button>

        {/* Close */}
        <button onClick={onHide} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', padding: '0 4px' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')} onMouseLeave={e => (e.currentTarget.style.color = '#fff')}>✕</button>
      </div>

      {/* Paper area */}
      <div onWheel={handleWheel} style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 20, background: '#4b5563' }}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.1s' }}>
          <div id="report-preview-paper" style={{
            width: paperPxW, minHeight: paperPxH, background: '#fff',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            padding: `${marginPx.top}px ${marginPx.right}px ${marginPx.bottom}px ${marginPx.left}px`,
          }}>
            {form.form_type === 'report_list' ? renderList() : renderSingle()}
          </div>
        </div>
      </div>

      {/* Record nav for single */}
      {form.form_type === 'report_single' && activeData.length > 1 && (
        <div style={{ height: 28, background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={() => setCurrentRecord(0)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12 }}>⏮</button>
          <button onClick={() => setCurrentRecord(Math.max(0, currentRecord - 1))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12 }}>◀</button>
          <span style={{ color: '#9ca3af', fontSize: 11 }}>Record {currentRecord + 1} / {activeData.length}{dataSource === 'live' ? ` (${liveTotalCount} total)` : ''}</span>
          <button onClick={() => setCurrentRecord(Math.min(activeData.length - 1, currentRecord + 1))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12 }}>▶</button>
          <button onClick={() => setCurrentRecord(activeData.length - 1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12 }}>⏭</button>
        </div>
      )}

      {/* Connection Dialog */}
      <Dialog visible={showConnectionDialog} onHide={() => setShowConnectionDialog(false)} header="Database Connection" modal style={{ width: 380 }}
        contentStyle={{ backgroundColor: '#1f2937', color: '#f3f4f6', padding: '16px' }}
        headerStyle={{ backgroundColor: '#374151', color: '#f3f4f6' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {devices.length > 0 && (
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 2 }}>Target Device</label>
              <Dropdown value={selectedDeviceId} options={devices.map(d => ({ label: `${d.is_online ? '\u{1F7E2}' : '\u{1F534}'} ${d.device_name} (${d.platform})`, value: d.device_id }))}
                onChange={e => setSelectedDeviceId(e.value)} placeholder="Any device..." showClear style={{ width: '100%', fontSize: 12 }} />
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 2 }}>Database Type</label>
            <Dropdown value={connSettings.connection_type} options={[{ label: 'MySQL / MariaDB', value: 'mysql' }, { label: 'PostgreSQL', value: 'postgresql' }]}
              onChange={e => setConnSettings(p => ({ ...p, connection_type: e.value, port: e.value === 'postgresql' ? 5432 : 3306 }))} style={{ width: '100%', fontSize: 12 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 2 }}>Host</label>
              <InputText value={connSettings.host} onChange={e => setConnSettings(p => ({ ...p, host: e.target.value }))} style={{ width: '100%', fontSize: 12 }} />
            </div>
            <div style={{ width: 80 }}>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 2 }}>Port</label>
              <InputNumber value={connSettings.port} onValueChange={e => setConnSettings(p => ({ ...p, port: e.value || 3306 }))} style={{ width: '100%' }} inputStyle={{ fontSize: 12 }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 2 }}>Database</label>
            <InputText value={connSettings.database} onChange={e => setConnSettings(p => ({ ...p, database: e.target.value }))} style={{ width: '100%', fontSize: 12 }} />
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button onClick={() => setShowConnectionDialog(false)} style={{ background: '#4b5563', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => { setShowConnectionDialog(false); saveConnection(connSettings); fetchLiveData(connSettings); }}
              disabled={!connSettings.database || !connSettings.host}
              style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', fontSize: 12, cursor: 'pointer', opacity: (!connSettings.database || !connSettings.host) ? 0.5 : 1 }}>
              Connect & Load Data</button>
          </div>
        </div>
      </Dialog>

      <Toast ref={toastRef} position="bottom-right" />
    </Dialog>
  );
};

export default ReportLivePreviewModal;
