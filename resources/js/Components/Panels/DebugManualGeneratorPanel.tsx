import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import { Panel } from 'primereact/panel';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext';
import { Menu } from 'primereact/menu';
import { ErrorBoundary } from 'react-error-boundary';
import { useProject } from '@/contexts/ProjectContext';
import { useTheme } from '@/contexts/ThemeContext';
import Editor from 'react-simple-code-editor';
import ErrorFallback from '@/Components/ErrorFallback';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import { useTranslation, SupportedLanguage, getStoredLanguage} from '@/i18n';
import type { Translations } from '@/i18n/types';
import { apiClient } from '@/lib/api';

// Professional JavaScript syntax highlighter using Prism.js
const highlightCode = (code: string) => {
  try {
    return Prism.highlight(code, Prism.languages.javascript, 'javascript');
  } catch {
    // Fallback to plain text if highlighting fails
    return code;
  }
};

// Theme colors type for the LineNumbersCodeDisplay component
interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderPrimary: string;
}

// Line Numbers Component for Syntax Highlighting
const LineNumbersCodeDisplay = ({ code, readOnly = false, onChange, colors, t }: {
  code: string;
  readOnly?: boolean;
  onChange?: (newCode: string) => void;
  colors: ThemeColors;
  t: Translations;
}) => {
  const lines = code.split('\n');
  const maxLineNumberWidth = String(lines.length).length;

  if (readOnly) {
    // 🔧 SAUBERE LÖSUNG: Double-escaped Unicode für Display konvertieren
    // Replace \\uXXXX (2 backslashes in string) with readable \n\r\t (1 backslash)
    const displayCode = code
      .replace(/\\\\u000A/g, '\\n')   // \\u000A (2 BS) → \n (1 BS for display)
      .replace(/\\\\u000D/g, '\\r')   // \\u000D (2 BS) → \r (1 BS for display)
      .replace(/\\\\u0009/g, '\\t');  // \\u0009 (2 BS) → \t (1 BS for display)

    const highlightedCode = highlightCode(displayCode);
    const codeLines = highlightedCode.split('\n');

    return (
      <div className="line-numbers-container" style={{
        display: 'flex',
        backgroundColor: colors.bgSecondary,
        color: colors.textPrimary,
        fontFamily: '"Courier New", "Consolas", "Monaco", "Lucida Console", monospace',
        fontSize: '14px',
        lineHeight: '20px', // Fixed line height in pixels
        minHeight: '100%', // Fill parent height
        width: '100%'
      }}>
        {/* Line Numbers */}
        <div className="line-numbers" style={{
          padding: '10px 8px 10px 4px',
          backgroundColor: colors.bgTertiary,
          color: colors.textMuted,
          borderRight: `1px solid ${colors.borderPrimary}`,
          textAlign: 'right',
          userSelect: 'none',
          minWidth: `${maxLineNumberWidth * 0.8 + 1}em`,
          flexShrink: 0
        }}>
          {lines.map((_, index) => (
            <div key={index} style={{
              height: '20px', // Same as lineHeight
              lineHeight: '20px',
              fontSize: '14px'
            }}>
              {index + 1}
            </div>
          ))}
        </div>

        {/* Code Content */}
        <div className="code-content" style={{
          flex: 1,
          padding: '10px',
          overflow: 'visible',
          fontFamily: 'inherit'
        }}>
          {codeLines.map((line, index) => (
            <div key={index} style={{
              height: '20px', // Same as lineHeight
              lineHeight: '20px',
              fontSize: '14px',
              whiteSpace: 'pre',
              margin: 0
            }}>
              <span dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Editable version - with line numbers
  const displayCodeForEdit = code
    .replace(/\\u000A/g, '\\n')   // \u000A → \n (for display)
    .replace(/\\u000D/g, '\\r')   // \u000D → \r (for display)
    .replace(/\\u0009/g, '\\t');  // \u0009 → \t (for display)

  const handleChange = (newCode: string) => {
    // Convert back to Unicode escapes before saving
    const restoredCode = newCode
      .replace(/\\n/g, '\\u000A')   // \n → \u000A
      .replace(/\\r/g, '\\u000D')   // \r → \u000D
      .replace(/\\t/g, '\\u0009');  // \t → \u0009

    if (onChange) {
      onChange(restoredCode);
    }
  };

  const editLines = displayCodeForEdit.split('\n');

  return (
    <div className="line-numbers-container" style={{
      display: 'flex',
      backgroundColor: colors.bgSecondary,
      color: colors.textPrimary,
      fontFamily: '"Courier New", "Consolas", "Monaco", "Lucida Console", monospace',
      fontSize: '14px',
      lineHeight: '20px',
      minHeight: '100%',
      width: '100%',
      position: 'relative'
    }}>
      {/* Line Numbers */}
      <div className="line-numbers" style={{
        padding: '10px 8px 10px 4px',
        backgroundColor: colors.bgTertiary,
        color: colors.textMuted,
        borderRight: `1px solid ${colors.borderPrimary}`,
        textAlign: 'right',
        userSelect: 'none',
        minWidth: `${maxLineNumberWidth * 0.8 + 1}em`,
        flexShrink: 0,
        zIndex: 1,
        position: 'relative'
      }}>
        {editLines.map((_, index) => (
          <div key={index} style={{
            height: '20px',
            lineHeight: '20px',
            fontSize: '14px'
          }}>
            {index + 1}
          </div>
        ))}
      </div>

      {/* Editable Code Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        position: 'relative',
        minWidth: 0
      }}>
        <Editor
          value={displayCodeForEdit}
          onValueChange={handleChange}
          highlight={highlightCode}
          padding={10}
          style={{
            fontFamily: '"Courier New", "Consolas", "Monaco", "Lucida Console", monospace',
            fontSize: 14,
            lineHeight: '20px',
            minHeight: '400px',
            width: '100%',
            backgroundColor: colors.bgSecondary,
            color: colors.textPrimary,
            outline: 'none'
          }}
          className={t.debugmanualgeneratorpanel199_2}
          placeholder={t.debugmanualgeneratorpanel199}
          textareaClassName="code-editor-textarea"
        />
      </div>
    </div>
  );
};

// Fallback function for clipboard access in older browsers
const copyToClipboardFallback = (text: string, t: Translations) => {
  try {
    // Create temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    // Try to copy using execCommand
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (successful) {
      // Successfully copied
    } else {
      // Last resort: show alert with text to copy manually
      alert(t.debugmanualgeneratorpanel214+'\n\n' + text.substring(0, 500) + '...');
    }
  } catch {
    alert(t.debugmanualgeneratorpanel217);
  }
};

interface DebugManualGeneratorPanelProps {
  tableId?: number;
  tableName?: string;
  schemaId?: number;
  projectId?: number;
  projectName?: string;
  templateId?: number;
  fileId?: number;
  fileName?: string;
  languageId?: number;
  languageCode?: string;
}

interface Template {
  id: number;
  name: string;
  description: string;
  is_active?: boolean;
}

interface TemplateFile {
  id: number;
  file_name: string;
  file_type: string;
  file_order: number;
  generation_type?: string; // 'static_file', 'static_directory', 'project_file', 'db_table_file'
}

// interface Project {
//   id: number;
//   name: string;
// }

interface SchemaTable {
  tablename: string;
  nmaxitems: number;
  database_name?: string;
  schema_id?: number;
  is_schema_locked?: boolean;
  // Global schema-level generation mode. Tables with 'excluded' or
  // 'reference_only' / 'code_only' are hidden from the per-table-file
  // dropdown because the backend will skip them (see the 'skipped'
  // marker in UltimateTemplateController::processTemplateFile).
  generation_mode?: 'full' | 'code_only' | 'template_only' | 'reference_only' | 'excluded';
  items?: Array<{
    name: string;
    type: string;
    controltype: number;
  }>;
}

// ─── Persistence types ────────────────────────────────────────────────────
//
// What we store in localStorage. Goals:
//   1. Restore the user's last selections so they don't re-pick everything
//      on every panel open (the main pain point that triggered this refactor).
//   2. Power the "Profile" feature (named snapshots of all selections).
//
// We persist by ID where the ID is stable across reloads (templateId,
// schemaId, projectId) and by NAME where the underlying record can be
// re-imported with a new ID (fileName, tableName). Re-imports happen often
// during template development — IDs would silently invalidate, names won't.
//
// The version field is a bump-on-breaking-change escape hatch: if the shape
// changes incompatibly we'll just reset the store rather than try to migrate.
interface PersistedSelection {
  templateId: number | null;
  fileName: string | null;          // looked up by name in templateFiles
  tableName: string | null;         // looked up by name+databaseSchemaId
  databaseSchemaId: number | null;
  schemaVersion: number | null;
  migrationFromVersion: number | null;
  projectId: number | null;
  languageCode: string | null;
  includeTemplateSource: boolean;
  skipCache: boolean;
}

interface DebugPanelProfile {
  id: string;                       // local uuid, used as React key
  name: string;
  description?: string;
  createdAt: string;                // ISO timestamp
  lastUsed: string;                 // ISO timestamp, bumped on load
  selection: PersistedSelection;
}

// Workflow modes — three high-level user intents the panel supports.
// 'develop' = edit raw template + see if compile works
// 'debug'   = inspect the compiled JS / static analysis
// 'output'  = just generate and look at the final result
// Each mode reveals only the buttons relevant to it and lands on the
// corresponding tab. Persisted so returning users get their preferred mode.
type WorkflowMode = 'develop' | 'debug' | 'output';

interface DebugPanelStorage {
  version: number;                  // bump if PersistedSelection shape changes
  ui: {
    activeTab: number;              // last-viewed tab, restored on open
    workflowMode: WorkflowMode;     // last-used workflow mode
    activeProfileId: string | null; // last-loaded profile (for the ▾ marker)
  };
  selection: PersistedSelection;    // last-used selection (auto-restored)
  profiles: DebugPanelProfile[];
}

// Note: headerCollapsed is intentionally NOT persisted. By spec it's always
// derived from "does the restored selection have meaningful data?" — first-time
// users always see the form expanded, returning users see it collapsed.

const DEBUG_PANEL_STORAGE_KEY = 'scoriet_debug_panel_v1';
const DEBUG_PANEL_STORAGE_VERSION = 1;

const emptySelection = (): PersistedSelection => ({
  templateId: null,
  fileName: null,
  tableName: null,
  databaseSchemaId: null,
  schemaVersion: null,
  migrationFromVersion: null,
  projectId: null,
  languageCode: null,
  includeTemplateSource: false,
  skipCache: false,
});

// loadStorage: defensively read + parse + version-check. Any failure (corrupt
// JSON, missing fields, version mismatch) is treated as "no stored state" —
// we never throw at the user, we just fall back to defaults. The panel
// MUST keep working even if localStorage has been tampered with.
const loadStorage = (): DebugPanelStorage => {
  const empty: DebugPanelStorage = {
    version: DEBUG_PANEL_STORAGE_VERSION,
    ui: { activeTab: 0, workflowMode: 'develop', activeProfileId: null },
    selection: emptySelection(),
    profiles: [],
  };
  try {
    const raw = localStorage.getItem(DEBUG_PANEL_STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<DebugPanelStorage>;
    if (parsed.version !== DEBUG_PANEL_STORAGE_VERSION) return empty;
    const restoredMode = parsed.ui?.workflowMode;
    return {
      version: DEBUG_PANEL_STORAGE_VERSION,
      ui: {
        activeTab: parsed.ui?.activeTab ?? 0,
        workflowMode: (restoredMode === 'develop' || restoredMode === 'debug' || restoredMode === 'output')
          ? restoredMode
          : 'develop',
        activeProfileId: typeof parsed.ui?.activeProfileId === 'string' ? parsed.ui.activeProfileId : null,
      },
      selection: { ...emptySelection(), ...(parsed.selection ?? {}) },
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
    };
  } catch {
    return empty;
  }
};

const saveStorage = (storage: DebugPanelStorage): void => {
  try {
    localStorage.setItem(DEBUG_PANEL_STORAGE_KEY, JSON.stringify(storage));
  } catch {
    // localStorage can throw on quota exceeded or in private-browsing mode.
    // We silently swallow — losing the auto-save is annoying but not fatal,
    // and the panel must keep working.
  }
};

// Quick "does this look like a real saved state" check — used to decide
// whether to auto-collapse the header on mount. Empty defaults should NOT
// trigger auto-collapse (first-time users need to see the form).
const hasMeaningfulSelection = (sel: PersistedSelection): boolean => {
  return sel.templateId !== null && sel.fileName !== null;
};

// Crypto-quality UUIDs are overkill for a localStorage profile ID, but
// crypto.randomUUID is available in all modern browsers and produces no
// collisions in practice. Falls back to a Math.random hex string for ancient
// runtimes (won't happen here, but cheap insurance).
const newProfileId = (): string => {
  try {
    return crypto.randomUUID();
  } catch {
    return 'pr_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
};

export default function DebugManualGeneratorPanel({
  tableId: _preSelectedTableId,
  tableName: preSelectedTableName,
//  schemaId: preSelectedSchemaId,
  projectId: preSelectedProjectId,
  templateId: preSelectedTemplateId,
  fileId: preSelectedFileId,
  fileName: preSelectedFileName, // ADD: Accept fileName for matching
//  languageId: preSelectedLanguageId,
  languageCode: preSelectedLanguageCode
}: DebugManualGeneratorPanelProps = {}) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { selectedProject, projects } = useProject();
  const { colors } = useTheme();

  // ─── Persistence: read localStorage once on mount ───────────────────────
  // restoredRef holds the snapshot we read at component creation. We read it
  // ONCE and reuse — re-reading on every render would race with our own save
  // logic. All initial state values + auto-restore effects consult this.
  const restoredRef = useRef<DebugPanelStorage | null>(null);
  if (restoredRef.current === null) restoredRef.current = loadStorage();
  const restored = restoredRef.current;

  // "Effective preselect": explicit prop (from TreeView pre-selection) wins;
  // otherwise fall back to the value stored in LS. This is how the restored
  // selection gets picked up by the existing auto-select useEffects without
  // having to rewire all of them.
  const effPreTemplateId = preSelectedTemplateId ?? restored.selection.templateId ?? undefined;
  const effPreFileName = preSelectedFileName ?? restored.selection.fileName ?? undefined;
  const effPreTableName = preSelectedTableName ?? restored.selection.tableName ?? undefined;
  const effPreProjectId = preSelectedProjectId ?? restored.selection.projectId ?? undefined;
  const effPreLanguageCode = preSelectedLanguageCode ?? restored.selection.languageCode ?? undefined;

  // Selection States — initialized lazily from LS where applicable. For IDs
  // tied to async-loaded data (file, table) we leave the state null here and
  // let downstream useEffects resolve fileName→fileId once the data lands.
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(effPreTemplateId ?? null);
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [selectedProjectForGenerator, setSelectedProjectForGenerator] = useState<number | null>(
    effPreProjectId ?? selectedProject?.id ?? null
  );
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(effPreLanguageCode ?? null);
  const [migrationFromVersion, setMigrationFromVersion] = useState<number | null>(
    restored.selection.migrationFromVersion
  );
  const [schemaVersions, setSchemaVersions] = useState<Array<{id: number, version_number: number}>>([]);
  // 🎯 NEU: Ausgewählte Schema-Version (für Project-Dateien)
  // Wenn null → automatisch die höchste Version verwenden
  const [selectedSchemaVersion, setSelectedSchemaVersion] = useState<number | null>(
    restored.selection.schemaVersion
  );
  // Multi-DB support: the project can carry several schemas (e.g. main + neues_schema).
  // Before, the panel silently locked onto schemaTables[0].schema_id for project_file
  // generation, which made any 2nd+ schema invisible here. selectedDatabaseSchemaId is
  // the single source of truth for "which schema's versions / migrations are we looking
  // at right now". For db_table_file mode it is auto-synced from the picked table.
  const [selectedDatabaseSchemaId, setSelectedDatabaseSchemaId] = useState<number | null>(
    restored.selection.databaseSchemaId
  );

  // ─── Collapsible-header + Profile state ─────────────────────────────────
  // headerCollapsed defaults to TRUE when the restored selection has meaningful
  // data (returning user) and FALSE on first visit (so newcomers see the form).
  // It is intentionally NOT persisted — within a session the user can toggle
  // freely, but on each fresh mount the rule above re-applies.
  const [headerCollapsed, setHeaderCollapsed] = useState<boolean>(
    hasMeaningfulSelection(restored.selection)
  );
  // Profiles are stored together with the rest of the LS blob. activeProfileId
  // is restored from LS so the "currently loaded profile" marker survives a
  // page reload — without this the dropdown would always show "Profil laden…"
  // even though the user had just loaded one. We validate against the
  // currently-known profile list so a deleted id is silently cleared.
  const [profiles, setProfiles] = useState<DebugPanelProfile[]>(restored.profiles);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(() => {
    const sid = restored.ui.activeProfileId;
    if (sid && restored.profiles.some(p => p.id === sid)) return sid;
    return null;
  });
  // Dialog visibility + form-input state for "save as" and "manage profiles".
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [showManageProfilesDialog, setShowManageProfilesDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDescription, setNewProfileDescription] = useState('');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingProfileName, setEditingProfileName] = useState('');

  // Workflow mode — controls which buttons are visible + which tab is active.
  // Initial value comes from LS (defaults to 'develop' for first-time users).
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>(restored.ui.workflowMode);

  // ─── Smart "save before commit" prompt ───────────────────────────────────
  // Shown when the user clicks one of the "commit" buttons ("Code Template
  // holen" / "Code vorbereiten") and there's no active profile yet. The
  // idea: those clicks are natural "I'm happy with this config" moments,
  // so they're the right time to nudge the user to immortalize it as a
  // profile. The session-only ref lets the user opt out for the rest of
  // the session via the dialog's "nicht mehr fragen" button.
  //
  // pendingFetchAfterCommitFlow is the bridge: when we want to fire one of
  // the fetch functions but they're declared LATER in the file (use-before-
  // define), we set this state flag and a useEffect placed below the
  // fetches consumes it. pendingCommitActionRef tells the useEffect which
  // function to call ('raw' = fetchRawTemplate, 'compile' = fetchCode).
  const [showSaveBeforeCommitPrompt, setShowSaveBeforeCommitPrompt] = useState(false);
  const dontAskSaveBeforeCommitRef = useRef(false);
  const proceedAfterSaveAsRef = useRef(false);
  const [pendingFetchAfterCommitFlow, setPendingFetchAfterCommitFlow] = useState(false);
  // 'raw' = fetchRawTemplate, 'compile' = fetchCode only,
  // 'generate' = fetchCode + chained executeCode (mega-button workflow).
  const pendingCommitActionRef = useRef<'raw' | 'compile' | 'generate'>('raw');

  // Refs for the Tab 2 toolbar dropdown menus (Export ▾ / Import ▾).
  // The Menu's popup positions itself relative to the click event we
  // forward via .toggle(e) — these refs let the button trigger that.
  const exportMenuRef = useRef<Menu>(null);
  const importMenuRef = useRef<Menu>(null);

  // Data States
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateFiles, setTemplateFiles] = useState<TemplateFile[]>([]);
  const [schemaTables, setSchemaTables] = useState<SchemaTable[]>([]);
  const [languageOptions, setLanguageOptions] = useState<Array<{label: string, value: string}>>([]);

  // Content States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [preparedCode, setPreparedCode] = useState<string>('');
  const [executedResult, setExecutedResult] = useState<string>('');
  const [activeTabIndex, setActiveTabIndex] = useState<number>(restored.ui.activeTab);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Raw template editing state (Tab 0). rawTemplate is the live editor
  // content; rawTemplateOriginal is the snapshot from the last successful
  // load/save so we can drive a "dirty" indicator + only enable the Save
  // button when the user actually changed something. Backed by GET / PUT
  // against /templates/{templateId}/files/{fileId} — see fetchRawTemplate
  // and saveRawTemplate below.
  const [rawTemplate, setRawTemplate] = useState<string>('');
  const [rawTemplateOriginal, setRawTemplateOriginal] = useState<string>('');
  const [rawTemplateLoading, setRawTemplateLoading] = useState(false);
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);
  const [includeTemplateSource, setIncludeTemplateSource] = useState<boolean>(restored.selection.includeTemplateSource);
  const [skipCache, setSkipCache] = useState<boolean>(restored.selection.skipCache);
  const [downloadFilename, setDownloadFilename] = useState<string>('generated.php');

  // Validation States (3 categories)
  const [unknownVariables, setUnknownVariables] = useState<Array<{file: string, variable: string, line: number}>>([]);
  const [requiredMissing, setRequiredMissing] = useState<Array<{file: string, variable: string, line: number, description?: string}>>([]);
  const [optionalMissing, setOptionalMissing] = useState<Array<{file: string, variable: string, line: number, description?: string, default_value?: string}>>([]);
  const [_hasValidationWarnings, setHasValidationWarnings] = useState(false);

  // Syntax Validation States
  const [syntaxErrors, setSyntaxErrors] = useState<Array<{file: string, error: string}>>([]);
  const [syntaxWarnings, setSyntaxWarnings] = useState<Array<{file: string, warning: string}>>([]);
  const [_hasSyntaxErrors, setHasSyntaxErrors] = useState(false);

  // Manual Editor Mode
  const [editorUnlocked, setEditorUnlocked] = useState(false);

  // GTree Import Modal
  const [showGTreeImportModal, setShowGTreeImportModal] = useState(false);
  const [gtreeImportText, setGtreeImportText] = useState('');

  // Helper functions (defined early to avoid hoisting issues)
  const getFileGenerationType = useCallback((): 'project_file' | 'db_table_file' | 'project_file_languages' | 'db_table_file_languages' | 'static_file' | 'static_directory' | null => {
    if (!templateFiles || templateFiles.length === 0 || selectedFile === null || selectedFile === undefined) {
      return null;
    }

    const file = templateFiles.find(f => f.id === selectedFile);
    if (!file) return null;

    // Direkte Typen-Zuordnung (bevorzugt)
    if (file.generation_type) {
      return file.generation_type as 'project_file' | 'db_table_file' | 'project_file_languages' | 'db_table_file_languages' | 'static_file' | 'static_directory';
    }

    if (file.file_type) {
      // Datenbank-spezifische Template-Typen
      const dbFileTypes = ['template', 'db_table_file', 'db_table_file_languages', 'model', 'controller', 'view', 'migration'];
      // Projekt-spezifische Template-Typen
      const projectFileTypes = ['project_file', 'project_file_languages', 'config', 'helper', 'static_file', 'static_directory'];

      if (dbFileTypes.includes(file.file_type.toLowerCase())) {
        // Check if it's a language-enabled variant
        if (file.file_type.toLowerCase().includes('languages')) {
          return 'db_table_file_languages';
        }
        return 'db_table_file';
      } else if (projectFileTypes.includes(file.file_type.toLowerCase())) {
        // Check if it's a language-enabled variant
        if (file.file_type.toLowerCase().includes('languages')) {
          return 'project_file_languages';
        }
        return 'project_file';
      }
    }

    // Fallback anhand Dateiname
    const fileName = file.file_name.toLowerCase();
    if (fileName.includes('table') || fileName.includes('model') || fileName.includes('entity')) {
      return fileName.includes('language') ? 'db_table_file_languages' : 'db_table_file';
    } else if (fileName.includes('project') || fileName.includes('config') || fileName.includes('main')) {
      return fileName.includes('language') ? 'project_file_languages' : 'project_file';
    }

    return null; // Unbekannt/Static
  }, [templateFiles, selectedFile]);

  const shouldShowProjectDropdown = useCallback((): boolean => {
    const fileType = getFileGenerationType();
    return fileType === 'project_file' || fileType === 'project_file_languages';
  }, [getFileGenerationType]);

  const shouldShowTableDropdown = useCallback((): boolean => {
    const fileType = getFileGenerationType();
    return fileType === 'db_table_file' || fileType === 'db_table_file_languages';
  }, [getFileGenerationType]);

  const shouldShowLanguageDropdown = useCallback((): boolean => {
    const fileType = getFileGenerationType();
    return fileType === 'project_file_languages' || fileType === 'db_table_file_languages';
  }, [getFileGenerationType]);

  const getSelectedFileName = () => {
    const file = templateFiles.find(f => f.id === selectedFile);
    return file?.file_name || '';
  };

  const loadTemplates = useCallback(async () => {
    try {
      // IMPORTANT: If preSelectedTemplateId exists (from the TreeView), load ALL templates (without filters)
      // Otherwise: Only load templates for the current project
      let endpoint = '/templates';
      if (!preSelectedTemplateId && preSelectedProjectId) {
        // Filter only if NO preselected template is selected (normal panel opening)
        endpoint = `/templates?project_id=${preSelectedProjectId}`;
      }

      let data: any;
      try {
        data = await apiClient.get(endpoint);
      } catch (err: any) {
        setError(`${t.debugmanualgeneratorpanel454}${err?.response?.status || ''}`);
        return;
      }

      let templatesArray = [];
      if (Array.isArray(data.data)) {
        templatesArray = data.data;
      } else if (Array.isArray(data)) {
        templatesArray = data;
      } else if (data.templates && Array.isArray(data.templates)) {
        templatesArray = data.templates;
      }

      // Filter out inactive templates (is_active = false means template has schadcode or is disabled)
      const activeTemplates = templatesArray.filter((m: Template) => m.is_active !== false);

      setTemplates(activeTemplates);

      if (activeTemplates.length === 0) {
        setError(t.debugmanualgeneratorpanel352);
      }
    } catch {
      setError(t.debugmanualgeneratorpanel358);
    }
  }, [preSelectedProjectId, preSelectedTemplateId]);

  const loadTemplateFiles = useCallback(async (templateId: number) => {
    try {
      let data: any;
      try {
        data = await apiClient.get(`/template-output/${templateId}`);
      } catch (err: any) {
        setError(t.debugmanualgeneratorpanel490 + (err?.response?.status ?? ''));
        return;
      }

      let filesArray = [];
      if (data.files && Array.isArray(data.files)) {
        filesArray = data.files;
      } else if (Array.isArray(data)) {
        filesArray = data;
      } else if (data.template_files && Array.isArray(data.template_files)) {
        filesArray = data.template_files;
      }

      // More lenient filtering - accept any object with some identifier
      const validFiles = filesArray.map((file: any, index: number) => {
        // Extract filename (API returns 'filename' not 'id')
        const extractedFilename = file.filename || file.file_name || file.name || file.template_file_name || `File ${index + 1}`;

        // Create a normalized file object - KEEP ORIGINAL ID IF AVAILABLE!
        const normalizedFile = {
          id: file.id || index, // Use original file ID if available, otherwise index
          file_name: extractedFilename,
          filename: extractedFilename, // Store original filename for matching
          file_type: file.file_type || file.type || file.template_file_type || file.extension || 'unknown',
          file_order: file.file_order || file.order || index,
          generation_type: file.generation_type || file.type || file.file_type || null,
          // Copy all original properties
          ...file
        };

        return normalizedFile;
      }).filter((file: any) => file.filename !== undefined);

      setTemplateFiles(validFiles);

      // Auto-select first valid file. Only TreeView pre-selection blocks this;
      // LS restore deliberately does NOT — we'd rather flash "first file → restored
      // file" once on mount than have post-mount template changes silently fail to
      // auto-pick because LS still holds the original filename forever. The
      // override happens in the file pre-select useEffect a few hundred ms later.
      if (validFiles.length > 0 && !preSelectedFileName) {
        setSelectedFile(validFiles[0].id);
      } else if (validFiles.length === 0) {
        setSelectedFile(null);
        setError(t.debugmanualgeneratorpanel486+`${templateId}`+t.debugmanualgeneratorpanel486a);
      }
    } catch {
      setError(t.debugmanualgeneratorpanel420);
    }
  }, [preSelectedFileName]);

  const loadSchemaTables = useCallback(async () => {
    try {
      const allTables: SchemaTable[] = [];

      // Use preSelectedProjectId if available (from TreeView), otherwise use selectedProject from context
      const projectIdToUse = preSelectedProjectId || selectedProject?.id;

      // If we have a project (from TreeView or context), load its schemas
      if (projectIdToUse) {
        try {
          let data: any = null;
          try {
            data = await apiClient.get(`/projects/${projectIdToUse}/schemas`);
          } catch {
            data = null;
          }

          if (data) {
            // Parse schemas from project
            let schemas = [];
            if (Array.isArray(data.schemas)) {
              schemas = data.schemas;
            } else if (Array.isArray(data.data)) {
              schemas = data.data;
            } else if (Array.isArray(data)) {
              schemas = data;
            }

            // Process each schema to extract tables
            for (const schema of schemas) {

              const schemaName = schema.name || schema.schema_name || schema.title || `Schema ${schema.id}`;
              // Get schema versions to find latest one with tables
              if (schema.id) {
                try {
                  const versionsData = await apiClient.get(`/floating-schemas/${schema.id}/versions`);

                  // Get the latest version - API returns array directly OR wrapped in object
                  const versions = Array.isArray(versionsData) ? versionsData : (versionsData.versions || versionsData.data || []);

                  if (versions.length > 0) {
                    const latestVersion = versions[versions.length - 1]; // Assume last is latest

                    // Get tables for this version
                    try {
                      const tablesData = await apiClient.get(`/schema-versions/${latestVersion.id}/tables`);

                      // API returns tables directly as array OR wrapped in object
                      const tables = Array.isArray(tablesData) ? tablesData : (tablesData.tables || tablesData.data || []);

                      tables.forEach((table: any) => {
                        const tableName = table.table_name || table.name || table.tablename || t.debugmanualgeneratorpanel499;

                        // Get field count from table structure
                        let fieldCount = 0;
                        let tableFields = [];

                        if (table.fields && Array.isArray(table.fields)) {
                          fieldCount = table.fields.length;
                          tableFields = table.fields.map((field: any) => ({
                            name: field.field_name || field.name,
                            type: field.field_type || field.type,
                            controltype: field.controltype || 24,
                          }));
                        } else if (table.columns && Array.isArray(table.columns)) {
                          fieldCount = table.columns.length;
                          tableFields = table.columns.map((col: any) => ({
                            name: col.column_name || col.name,
                            type: col.data_type || col.type,
                            controltype: 24,
                          }));
                        }

                        allTables.push({
                          tablename: tableName,
                          nmaxitems: fieldCount,
                          database_name: schemaName,
                          schema_id: schema.id,
                          is_schema_locked: schema.is_soft_locked === true,
                          generation_mode: table.generation_mode,
                          items: tableFields
                        });
                      });
                    } catch {
                      // Error loading tables for this version
                    }
                  }
                } catch {
                  // Error loading versions for this schema
                }
              }
            }
          }
        } catch {
          // Error loading project schemas
        }
      }

      // Only use fallback if we have no project selected or no project schemas found
      if (allTables.length === 0 && !projectIdToUse) {
        try {
          const globalData = await apiClient.get('/template-db-schema/schemas');
          const globalSchemas = globalData.schemas || globalData.data || [];

          globalSchemas.forEach((schema: any) => {
            const schemaName = schema.name || schema.schema_name || `Demo Schema ${schema.id}`;
            const tables = schema.tables || schema.parsed_tables || [];

            tables.forEach((table: any) => {
              const tableName = table.table_name || table.name || table.tablename || t.debugmanualgeneratorpanel499;
              const fieldCount = table.fields?.length || table.columns?.length || 0;

              allTables.push({
                tablename: tableName,
                nmaxitems: fieldCount,
                database_name: `${schemaName} (Demo)`,
                schema_id: schema.id,
                items: table.fields || table.columns || []
              });
            });
          });
        } catch {
          // Error loading global schemas
        }
      } else if (projectIdToUse && allTables.length === 0) {
        // Project selected but no linked schemas found - this is acceptable
      }

      // Without a project selection we just leave the list empty. We used
      // to fall back to a hard-coded /gtree-test/1 demo schema here, but
      // that endpoint was an unauthenticated test route and has been
      // removed as part of the API hardening pass.

      setSchemaTables(allTables);

      // Reset table selection when schemas change
      setSelectedTable(null);

    } catch {
      setSchemaTables([]);
    }
  }, [selectedProject, preSelectedProjectId]);

  const loadLanguages = useCallback(async () => {
    try {
      const data = await apiClient.get('/active-languages');
      let languages = Array.isArray(data) ? data : (data.languages || data.data || []);

      // IMPORTANT: If preSelectedLanguageCode exists (from the TreeView), load ALL languages (without filter)
      // Otherwise: Load only languages for the current project
      if (!preSelectedLanguageCode && selectedProject?.enabled_languages && Array.isArray(selectedProject.enabled_languages)) {
        // Filter only if NO preselected language (normal panel opening)
        languages = languages.filter((lang: any) =>
          selectedProject.enabled_languages?.includes(lang.code)
        );
      }

      const languageOpts = languages.map((lang: any) => ({
        label: `${lang.flag} ${lang.name}`,
        value: lang.code
      }));

      setLanguageOptions(languageOpts);

      // Auto-select first language - ONLY if neither TreeView nor LS pre-selection exists.
      // effPreLanguageCode folds in both sources; we still check selectedLanguage so we
      // don't clobber a value the user has already changed manually mid-session.
      if (languageOpts.length > 0 && !selectedLanguage && !effPreLanguageCode) {
        setSelectedLanguage(languageOpts[0].value);
      }
    } catch {
      setLanguageOptions([]);
    }
  }, [selectedLanguage, selectedProject, effPreLanguageCode]);

  // Load data on component mount
  useEffect(() => {
    loadTemplates();
    loadLanguages();
  }, [loadTemplates, loadLanguages]);

  // Load template files when template changes
  useEffect(() => {
    if (selectedTemplate) {
      loadTemplateFiles(selectedTemplate);
    }
  }, [selectedTemplate, loadTemplateFiles]);

  // Load schema tables when project changes
  useEffect(() => {
    loadSchemaTables();
  }, [loadSchemaTables]);

  // Load schema versions when table is selected
  const loadSchemaVersions = useCallback(async (schemaId: number) => {
    try {
      const data = await apiClient.get(`/floating-schemas/${schemaId}/versions`);
      const versions = Array.isArray(data) ? data : (data.versions || data.data || []);
      setSchemaVersions(versions.map((v: any) => ({
        id: v.id,
        version_number: v.version_number
      })).sort((a: {version_number: number}, b: {version_number: number}) => b.version_number - a.version_number));
    } catch {
      setSchemaVersions([]);
    }
  }, []);

  // Unique database/schema options derived from schemaTables. A project can link
  // multiple floating schemas, each carrying many tables — we want one option per
  // schema, not per table. Order is alphabetical so the dropdown is stable across
  // reloads regardless of which table got fetched first.
  const databaseOptions = useMemo(() => {
    if (!Array.isArray(schemaTables) || schemaTables.length === 0) return [];
    const seen = new Set<number>();
    const opts: Array<{label: string, value: number, is_schema_locked: boolean}> = [];
    schemaTables.forEach((tbl) => {
      const sid = tbl.schema_id;
      if (typeof sid === 'number' && !seen.has(sid)) {
        seen.add(sid);
        opts.push({
          label: tbl.database_name || `Schema ${sid}`,
          value: sid,
          is_schema_locked: tbl.is_schema_locked === true,
        });
      }
    });
    return opts.sort((a, b) => a.label.localeCompare(b.label));
  }, [schemaTables]);

  // Sync DB from selected table — for db_table_file mode the table is the
  // anchor, so its schema_id wins. The user can't pick a "different" DB while a
  // table from another DB is selected; that would be incoherent.
  useEffect(() => {
    if (selectedTable !== null && schemaTables[selectedTable]?.schema_id !== undefined) {
      const sid = schemaTables[selectedTable].schema_id as number;
      if (sid !== selectedDatabaseSchemaId) {
        setSelectedDatabaseSchemaId(sid);
      }
    }
  }, [selectedTable, schemaTables, selectedDatabaseSchemaId]);

  // Auto-pick first DB when none is selected yet (or the previously-selected one
  // is no longer in the list, e.g. after the user switched projects). Without
  // this, the Schema-Version dropdown stays empty even though valid DBs exist.
  useEffect(() => {
    if (databaseOptions.length === 0) return;
    const stillValid = selectedDatabaseSchemaId !== null
      && databaseOptions.some(opt => opt.value === selectedDatabaseSchemaId);
    if (!stillValid) {
      setSelectedDatabaseSchemaId(databaseOptions[0].value);
    }
  }, [databaseOptions, selectedDatabaseSchemaId]);

  // Tracks whether the next "DB changed" effect run is the initial restore
  // (mount-time) or a real user-initiated switch. On the initial run we MUST
  // NOT clobber selectedSchemaVersion / migrationFromVersion — those were just
  // restored from LS and clearing them here defeats the whole purpose of the
  // persistence layer. On every subsequent run (user actually picked a
  // different DB) clearing is correct because the previous version may not
  // exist in the new schema.
  const dbChangeIsRestoreRef = useRef(true);

  // Load schema versions for the currently-selected DB. selectedDatabaseSchemaId
  // is the unified driver: it's set automatically from the table in db_table_file
  // mode, or directly by the user in project_file mode. Either way, versions
  // come from the right schema — fixing the old behavior where schemaTables[0]
  // was hardcoded.
  useEffect(() => {
    if (selectedDatabaseSchemaId !== null) {
      loadSchemaVersions(selectedDatabaseSchemaId);
      if (!dbChangeIsRestoreRef.current) {
        // User-initiated DB switch — invalidate stale version + migration source.
        setMigrationFromVersion(null);
        setSelectedSchemaVersion(null);
      }
      dbChangeIsRestoreRef.current = false;
    } else {
      setSchemaVersions([]);
      setMigrationFromVersion(null);
      setSelectedSchemaVersion(null);
    }
  }, [selectedDatabaseSchemaId, loadSchemaVersions]);

  // 🎯 NEU: Schema-Version Optionen für das Dropdown (alle verfügbaren Versionen)
  const schemaVersionOptions = useMemo(() => {
    if (schemaVersions.length === 0) return [];

    // Alle Versionen als Optionen (höchste zuerst)
    return schemaVersions
      .map(v => ({ label: `Version ${v.version_number}`, value: v.version_number }))
      .sort((a, b) => b.value - a.value);
  }, [schemaVersions]);

  // Validate + auto-pick max for selectedSchemaVersion. Two cases:
  //   (1) restored value isn't in this DB's available versions → clear → next
  //       render falls through to (2)
  //   (2) nothing selected → pick the max (= newest) version
  useEffect(() => {
    if (schemaVersions.length === 0) return;
    const validNumbers = schemaVersions.map(v => v.version_number);
    if (selectedSchemaVersion !== null && !validNumbers.includes(selectedSchemaVersion)) {
      setSelectedSchemaVersion(null);
      return;
    }
    if (selectedSchemaVersion === null) {
      setSelectedSchemaVersion(Math.max(...validNumbers));
    }
  }, [schemaVersions, selectedSchemaVersion]);

  // Validate migrationFromVersion against currently-available versions. Same
  // pattern as above — clear silently if the restored value isn't valid.
  useEffect(() => {
    if (schemaVersions.length === 0) return;
    const validNumbers = schemaVersions.map(v => v.version_number);
    if (migrationFromVersion !== null && !validNumbers.includes(migrationFromVersion)) {
      setMigrationFromVersion(null);
    }
  }, [schemaVersions, migrationFromVersion]);

  // 🎯 ANGEPASST: Migration-Optionen basierend auf selectedSchemaVersion filtern
  // Nur Versionen < selectedSchemaVersion anzeigen
  const migrationVersionOptions = useMemo(() => {
    if (schemaVersions.length === 0) return [];

    // Wenn keine Schema-Version ausgewählt, höchste verwenden
    const targetVersion = selectedSchemaVersion ?? Math.max(...schemaVersions.map(v => v.version_number));

    // Wenn nur Version 1 oder keine niedrigere Version existiert, keine Migration möglich
    if (targetVersion <= 1) return [];

    // Generate options from (targetVersion - 1) down to 1
    const options = [];
    for (let v = targetVersion - 1; v >= 1; v--) {
      options.push({ label: `Version ${v}`, value: v });
    }
    return options;
  }, [schemaVersions, selectedSchemaVersion]);

  // 🎯 NEU: Wenn selectedSchemaVersion geändert wird und migrationFromVersion >= selectedSchemaVersion,
  // dann migrationFromVersion zurücksetzen
  useEffect(() => {
    if (selectedSchemaVersion !== null && migrationFromVersion !== null) {
      if (migrationFromVersion >= selectedSchemaVersion) {
        setMigrationFromVersion(null);
      }
    }
  }, [selectedSchemaVersion, migrationFromVersion]);

  // Pre-select table when opened from TreeView or restored from LS.
  const lsTableRestoredRef = useRef(false);
  useEffect(() => {
    // Only auto-select if:
    // 1. We have pre-selected table info from TreeView
    // 2. Tables are loaded
    // 3. No table has been selected yet (or manually changed by user)
    // Restore by table name. Same one-shot guard pattern as the file restore —
    // we don't want the LS table name to permanently bias future db_table_file
    // selections after the user has manually changed things. Restored
    // databaseSchemaId narrows the lookup when the same tablename exists in
    // multiple schemas.
    if (!lsTableRestoredRef.current && effPreTableName && schemaTables.length > 0 && selectedTable === null) {
      lsTableRestoredRef.current = true;
      const wantSchemaId = restored.selection.databaseSchemaId;
      const tableIndex = schemaTables.findIndex(
        (table) => table.tablename === effPreTableName
          && (wantSchemaId == null || table.schema_id === wantSchemaId)
      );
      if (tableIndex !== -1) {
        setTimeout(() => setSelectedTable(tableIndex), 100);
      }
    }
  }, [effPreTableName, schemaTables, selectedTable]);

  // Pre-select / restore template. Validates first — if the stored/passed-in id
  // points to a template that no longer exists, we clear it silently rather
  // than leaving the dropdown in a "ghost" state showing nothing.
  useEffect(() => {
    if (templates.length === 0) return;
    if (selectedTemplate !== null) {
      // Validate the currently-set template (could be from LS, could be stale)
      const exists = templates.some(tpl => tpl.id === selectedTemplate);
      if (!exists) setSelectedTemplate(null);
      return;
    }
    if (effPreTemplateId !== undefined && effPreTemplateId !== null) {
      const exists = templates.some(tpl => tpl.id === effPreTemplateId);
      if (exists) setTimeout(() => setSelectedTemplate(effPreTemplateId), 100);
    }
  }, [effPreTemplateId, templates, selectedTemplate]);

  // Pre-select / restore file. Two paths:
  //   • TreeView pre-selection (preSelectedFileId): always honored if files have
  //     loaded and the id matches. Blocks loadTemplateFiles's auto-pick already,
  //     so we just resolve the id → setSelectedFile.
  //   • LS restore (effPreFileName): runs ONCE, as an override after the auto-pick.
  //     The ref guard prevents the LS name from sticking forever and silently
  //     hijacking every future template switch.
  const lsFileRestoredRef = useRef(false);
  useEffect(() => {
    if (templateFiles.length === 0) return;
    // TreeView ID path (existing behavior, preserved)
    if (preSelectedFileId && selectedFile === null) {
      const matched = templateFiles.find(f => f.id === preSelectedFileId);
      if (matched) {
        setTimeout(() => setSelectedFile(matched.id), 200);
        lsFileRestoredRef.current = true; // TreeView wins; LS skip on subsequent mounts (well, won't reach here)
        return;
      }
    }
    // LS restore path — one-shot
    if (!lsFileRestoredRef.current && effPreFileName) {
      lsFileRestoredRef.current = true;
      const matched = templateFiles.find(
        f => f.file_name === effPreFileName || (f as any).filename === effPreFileName
      );
      if (matched && matched.id !== selectedFile) {
        setSelectedFile(matched.id);
      }
    }
  }, [preSelectedFileId, effPreFileName, templateFiles, selectedFile]);

  // Pre-select / restore language.
  useEffect(() => {
    if (effPreLanguageCode && languageOptions.length > 0 && !selectedLanguage) {
      const exists = languageOptions.some(l => l.value === effPreLanguageCode);
      if (exists) setTimeout(() => setSelectedLanguage(effPreLanguageCode), 100);
    }
  }, [effPreLanguageCode, languageOptions, selectedLanguage]);

  // ─── Auto-persist selection to localStorage ─────────────────────────────
  // Gating: we only start saving after the first batch of data (templates)
  // has loaded. Without this gate, the initial render — where state is still
  // null/empty pending restore — would persist null values and overwrite the
  // user's actual saved state. Once templates load, restoration is either
  // done or actively happening; either way the saved state will converge to
  // what the user has on screen.
  const persistEnabledRef = useRef(false);
  useEffect(() => {
    if (templates.length > 0) persistEnabledRef.current = true;
  }, [templates]);

  useEffect(() => {
    if (!persistEnabledRef.current) return;

    // Resolve fileId → fileName (we persist by name for re-import stability).
    let fileName: string | null = null;
    if (selectedFile !== null) {
      const f = templateFiles.find(x => x.id === selectedFile);
      if (f) fileName = f.file_name || (f as any).filename || null;
    }
    // Resolve table-index → tablename (same reason).
    const tableName = selectedTable !== null && schemaTables[selectedTable]
      ? schemaTables[selectedTable].tablename
      : null;

    saveStorage({
      version: DEBUG_PANEL_STORAGE_VERSION,
      ui: { activeTab: activeTabIndex, workflowMode, activeProfileId },
      selection: {
        templateId: selectedTemplate,
        fileName,
        tableName,
        databaseSchemaId: selectedDatabaseSchemaId,
        schemaVersion: selectedSchemaVersion,
        migrationFromVersion,
        projectId: selectedProjectForGenerator,
        languageCode: selectedLanguage,
        includeTemplateSource,
        skipCache,
      },
      profiles,
    });
  }, [
    activeTabIndex, workflowMode, activeProfileId,
    selectedTemplate, selectedFile, selectedTable,
    templateFiles, schemaTables,
    selectedDatabaseSchemaId, selectedSchemaVersion, migrationFromVersion,
    selectedProjectForGenerator, selectedLanguage,
    includeTemplateSource, skipCache,
    profiles,
  ]);

  // ─── Profile system ─────────────────────────────────────────────────────
  // Build a PersistedSelection snapshot from current state. Used when the
  // user saves a profile. We resolve fileId→fileName and tableIndex→tableName
  // here (same as the auto-save effect) so the profile is portable across
  // template re-imports.
  const buildCurrentSelection = useCallback((): PersistedSelection => {
    let fileName: string | null = null;
    if (selectedFile !== null) {
      const f = templateFiles.find(x => x.id === selectedFile);
      if (f) fileName = f.file_name || (f as any).filename || null;
    }
    const tableName = selectedTable !== null && schemaTables[selectedTable]
      ? schemaTables[selectedTable].tablename
      : null;
    return {
      templateId: selectedTemplate,
      fileName,
      tableName,
      databaseSchemaId: selectedDatabaseSchemaId,
      schemaVersion: selectedSchemaVersion,
      migrationFromVersion,
      projectId: selectedProjectForGenerator,
      languageCode: selectedLanguage,
      includeTemplateSource,
      skipCache,
    };
  }, [
    selectedTemplate, selectedFile, selectedTable, templateFiles, schemaTables,
    selectedDatabaseSchemaId, selectedSchemaVersion, migrationFromVersion,
    selectedProjectForGenerator, selectedLanguage,
    includeTemplateSource, skipCache,
  ]);

  // Apply a PersistedSelection to the live state. Reverse of buildCurrentSelection.
  // fileName/tableName are resolved against the currently-loaded data; if a
  // referenced file/table no longer exists we silently skip that one — better
  // than dumping a half-applied profile and silently locking the user out of
  // a usable form.
  const applySelection = useCallback((sel: PersistedSelection) => {
    setSelectedTemplate(sel.templateId);
    // selectedFile + selectedTable are resolved by the existing pre-select
    // useEffects once the underlying data loads in response to the new template.
    // We can't set them directly here because templateFiles/schemaTables won't
    // be up to date yet. Instead we stash the name into the restored ref so
    // the effects pick it up — but that's a bit ugly. Simpler: clear them and
    // let the auto-select kick in. The user will see their named file once
    // templateFiles loads (see useEffect that matches by fileName).
    setSelectedFile(null);
    setSelectedTable(null);
    setSelectedDatabaseSchemaId(sel.databaseSchemaId);
    setSelectedSchemaVersion(sel.schemaVersion);
    setMigrationFromVersion(sel.migrationFromVersion);
    setSelectedProjectForGenerator(sel.projectId);
    setSelectedLanguage(sel.languageCode);
    setIncludeTemplateSource(sel.includeTemplateSource);
    setSkipCache(sel.skipCache);
    // Reset the DB-change "restore" flag — applying a profile is conceptually
    // similar to a fresh mount, so we want selectedSchemaVersion to survive
    // the loadSchemaVersions effect rather than getting cleared.
    dbChangeIsRestoreRef.current = true;
    // Stash the fileName/tableName into restoredRef so the existing pre-select
    // effects can find them when data reloads.
    if (restoredRef.current) {
      restoredRef.current = {
        ...restoredRef.current,
        selection: { ...restoredRef.current.selection, fileName: sel.fileName, tableName: sel.tableName },
      };
    }
  }, []);

  // Load a profile by id: apply its selection + auto-collapse the header
  // (matches user spec: "Profile load = fertig konfiguriert, jetzt arbeiten").
  // Also bumps lastUsed for the "Verwalten" dialog's sort order.
  const loadProfile = useCallback((profileId: string) => {
    const p = profiles.find(x => x.id === profileId);
    if (!p) return;
    applySelection(p.selection);
    setActiveProfileId(profileId);
    setHeaderCollapsed(true);
    // Bump lastUsed
    setProfiles(prev => prev.map(x =>
      x.id === profileId ? { ...x, lastUsed: new Date().toISOString() } : x
    ));
  }, [profiles, applySelection]);

  // Detect "would this save overwrite an existing profile" — name match is
  // case-insensitive + trimmed so "Test " and "test" collide. Used both to
  // change the save button label ("Speichern" → "Überschreiben") and to
  // decide which branch saveCurrentAsProfile takes.
  const existingProfileForCurrentName = useMemo(() => {
    const wanted = newProfileName.trim().toLowerCase();
    if (!wanted) return null;
    return profiles.find(p => p.name.trim().toLowerCase() === wanted) || null;
  }, [profiles, newProfileName]);

  // Save current state as a profile. If the name matches an existing one,
  // OVERWRITE it (update selection + bump lastUsed) rather than creating a
  // duplicate — matches the user's mental model of "naming a profile is the
  // primary key". The save-as dialog already telegraphs this via the button
  // label so there's no surprise.
  const saveCurrentAsProfile = useCallback(() => {
    const name = newProfileName.trim();
    if (!name) return; // dialog button should already be disabled
    const now = new Date().toISOString();
    const selection = buildCurrentSelection();
    const description = newProfileDescription.trim() || undefined;

    let savedId: string;
    if (existingProfileForCurrentName) {
      // Overwrite: preserve id + createdAt, replace everything else.
      savedId = existingProfileForCurrentName.id;
      setProfiles(prev => prev.map(p => p.id === savedId ? {
        ...p,
        name,
        description,
        lastUsed: now,
        selection,
      } : p));
    } else {
      // Create new.
      const newProfile: DebugPanelProfile = {
        id: newProfileId(),
        name,
        description,
        createdAt: now,
        lastUsed: now,
        selection,
      };
      savedId = newProfile.id;
      setProfiles(prev => [...prev, newProfile]);
    }
    setActiveProfileId(savedId);
    setNewProfileName('');
    setNewProfileDescription('');
    setShowSaveAsDialog(false);

    // If the save was invoked from the "save before commit" prompt flow,
    // collapse and queue the fetchCode call. The actual fetch happens in a
    // useEffect placed AFTER fetchCode is declared (see further down) to
    // avoid use-before-define errors.
    if (proceedAfterSaveAsRef.current) {
      proceedAfterSaveAsRef.current = false;
      setHeaderCollapsed(true);
      setPendingFetchAfterCommitFlow(true);
    }
  }, [newProfileName, newProfileDescription, buildCurrentSelection, existingProfileForCurrentName]);

  const deleteProfile = useCallback((profileId: string) => {
    setProfiles(prev => prev.filter(p => p.id !== profileId));
    if (activeProfileId === profileId) setActiveProfileId(null);
  }, [activeProfileId]);

  const renameProfile = useCallback((profileId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setProfiles(prev => prev.map(p =>
      p.id === profileId ? { ...p, name: trimmed } : p
    ));
  }, []);

  // ─── Raw Template (Tab 0) ─────────────────────────────────────────────────
  //
  // fetchRawTemplate: GET /templates/{id}/files returns the full file array;
  // we pick the one matching selectedFile and pull file_content out. We don't
  // route through /template-output (the existing loadTemplateFiles endpoint)
  // because that endpoint returns COMPILED metadata for code-prep, not the
  // raw source text the user wants to author. Two different concerns →
  // two different endpoints.
  const fetchRawTemplate = async () => {
    if (!selectedTemplate || selectedFile === null || selectedFile === undefined) {
      setError(t.debugmanualgeneratorpanel746);
      return;
    }
    setRawTemplateLoading(true);
    setError('');
    try {
      const data = await apiClient.get(`/templates/${selectedTemplate}/files`);
      const files: any[] = Array.isArray(data) ? data : (data.data || []);
      const file = files.find((f) => Number(f.id) === Number(selectedFile));
      if (!file) {
        setError(t.debugmanualgeneratorpanel_raw_not_found || 'Template file not found in API response.');
        setRawTemplateLoading(false);
        return;
      }
      const content = String(file.file_content ?? '');
      setRawTemplate(content);
      setRawTemplateOriginal(content);
      setActiveTabIndex(0); // jump to Raw Template tab
    } catch (err: any) {
      setError((err?.response?.data?.message as string) || t.debugmanualgeneratorpanel_raw_load_failed || 'Failed to load raw template.');
    } finally {
      setRawTemplateLoading(false);
    }
  };

  // saveRawTemplate: PUT the edited content back. Backend requires the full
  // file-metadata payload (file_name / file_path / file_content / file_type)
  // — we pull the existing metadata from templateFiles[] and override only
  // the content. Triggered AFTER the confirm dialog approves so the user
  // can't overwrite the DB with a fat-finger click.
  const saveRawTemplate = async () => {
    if (!selectedTemplate || selectedFile === null || selectedFile === undefined) return;
    const file: any = templateFiles.find((f) => f.id === selectedFile);
    if (!file) {
      setError(t.debugmanualgeneratorpanel_raw_not_found || 'Template file not found.');
      return;
    }
    setRawTemplateLoading(true);
    setError('');
    try {
      await apiClient.put(`/templates/${selectedTemplate}/files/${selectedFile}`, {
        file_name: file.file_name || file.filename,
        file_path: file.file_path || file.file_name || file.filename,
        file_content: rawTemplate,
        file_type: file.file_type || 'template',
        file_order: file.file_order ?? 0,
        output_path: file.output_path ?? '/',
        form_window_type: file.form_window_type ?? 0,
        language_override: file.language_override ?? null,
      });
      setRawTemplateOriginal(rawTemplate); // mark clean
    } catch (err: any) {
      setError((err?.response?.data?.message as string) || t.debugmanualgeneratorpanel_raw_save_failed || 'Failed to save raw template.');
    } finally {
      setRawTemplateLoading(false);
      setShowSaveConfirmDialog(false);
    }
  };

  // Loading or selection-change of the file invalidates any in-progress raw
  // template edit — reset the editor + dirty marker so the user doesn't see
  // stale content under the new file's header.
  useEffect(() => {
    setRawTemplate('');
    setRawTemplateOriginal('');
  }, [selectedTemplate, selectedFile]);

  const fetchCode = async () => {
    if (!selectedTemplate || (selectedFile === null || selectedFile === undefined)) {
      setError(t.debugmanualgeneratorpanel746);
      return;
    }

    const fileGenerationType = getFileGenerationType();

    if ((fileGenerationType === 'project_file' || fileGenerationType === 'project_file_languages') && !selectedProjectForGenerator) {
      setError(t.debugmanualgeneratorpanel753);
      return;
    }

    if ((fileGenerationType === 'db_table_file' || fileGenerationType === 'db_table_file_languages') && (selectedTable === null || selectedTable === undefined)) {
      setError(t.debugmanualgeneratorpanel758);
      return;
    }

    if ((fileGenerationType === 'project_file_languages' || fileGenerationType === 'db_table_file_languages') && !selectedLanguage) {
      setError(t.debugmanualgeneratorpanel763);
      return;
    }

    if (!fileGenerationType || ['static_file', 'static_directory'].includes(fileGenerationType)) {
      setError(t.debugmanualgeneratorpanel768);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Build query parameters to ensure backend uses only linked schemas
      const params = new URLSearchParams();
      if (selectedProject) {
        params.set('project_id', selectedProject.id.toString());
      }

      // Add table parameter for db_table_file types
      if ((fileGenerationType === 'db_table_file' || fileGenerationType === 'db_table_file_languages') && selectedTable !== null) {
        const selectedTableData = schemaTables[selectedTable];
        if (selectedTableData) {
          params.set('table_name', selectedTableData.tablename);
        }
      }

      // Add language parameter for language-enabled types
      if ((fileGenerationType === 'project_file_languages' || fileGenerationType === 'db_table_file_languages') && selectedLanguage) {
        params.set('language_code', selectedLanguage);
      }

      // ✅ ALWAYS add language_code for validation (even for non-language files)
      // This ensures template variable validation uses the current language
      if (selectedLanguage && !params.has('language_code')) {
        params.set('language_code', selectedLanguage);
      }

      // Add include_source parameter if checkbox is enabled
      if (includeTemplateSource) {
        params.set('include_source', '1');
      }

      // Skip Redis cache if checkbox is enabled (force fresh generation)
      if (skipCache) {
        params.set('skip_cache', '1');
      }

      // Add migration_from_versions parameter if set.
      // The backend (UltimateTemplateController::buildUltimateGtree) reads a
      // per-schema map: {"<schema_id>": <from_version_number>} as JSON. The old
      // singular `migration_from_version` param name + bare number was a no-op
      // here — same parameter shape as in CodeGenerationPanel must be used so
      // the backend's $request->query('migration_from_versions') resolves it.
      //
      // Source of the schema_id is selectedDatabaseSchemaId, which is the unified
      // driver (auto-synced from the selected table in db_table_file mode, or
      // explicitly picked by the user in project_file mode). The old code fell
      // back to schemaTables[0].schema_id when no table was selected, which made
      // the 2nd DB in a multi-schema project unreachable for migrations.
      if (migrationFromVersion !== null) {
        const migrationSchemaId = selectedDatabaseSchemaId
          ?? (selectedTable !== null ? schemaTables[selectedTable]?.schema_id : undefined);
        if (migrationSchemaId) {
          params.set('migration_from_versions', JSON.stringify({
            [migrationSchemaId]: migrationFromVersion,
          }));
        }
      }

      // 🎯 NEU: Add schema_version parameter for Project-Dateien
      // Damit das Backend die richtige Schema-Version lädt (nicht automatisch die neueste)
      if (selectedSchemaVersion !== null && shouldShowProjectDropdown()) {
        params.set('schema_version', selectedSchemaVersion.toString());
      }

      // 🎯 NEU: Schema-Filter mitsenden. Wenn das Projekt mehrere Schemas
      // verknüpft hat (z.B. ein "system_test_project_database" + "x_db" +
      // "y_db"), würde das Backend ohne diesen Filter ALLE laden, alle
      // Tabellen flach in eine Collection mergen und dann beim
      // `firstWhere('table_name', 'users')` zufällig die FALSCHE users-
      // Tabelle gewinnen (eine aus einem anderen Schema mit fs_id=NULL,
      // anderer Version, etc.). Mit dem schema_ids-Filter lädt der Builder
      // nur die für den aktuell ausgewählten DB sichtbaren Tabellen.
      if (selectedDatabaseSchemaId !== null) {
        params.append('schema_ids[]', selectedDatabaseSchemaId.toString());
      }

      let data: any = null;
      let errorMessage: string | null = null;
      try {
        // If the user has the raw template loaded/edited in Tab 0, send it
        // as an in-memory override so the compile reflects THEIR edits
        // instead of the stored DB version. Without this, "Code Template
        // holen" + edit + "Code vorbereiten" would silently compile the
        // old DB content — surprising and useless for iteration.
        //
        // We send the override whenever rawTemplate is non-empty (not just
        // dirty) — if the user loaded it once and clicks Prepare again,
        // they expect their loaded content to be compiled, not an
        // independent re-fetch from DB. Same content → same result either
        // way; the override path just skips the cache (see backend note).
        const hasOverride = rawTemplate.length > 0 && selectedFile !== null && selectedFile !== undefined;
        if (hasOverride) {
          data = await apiClient.post(`/ultimate-template/${selectedTemplate}?${params.toString()}`, {
            override_files: [{ id: selectedFile, file_content: rawTemplate }],
          });
        } else {
          data = await apiClient.get(`/ultimate-template/${selectedTemplate}?${params.toString()}`);
        }
      } catch (err: any) {
        errorMessage = err?.response?.data?.message || t.debugmanualgeneratorpanel959;
        data = null;
      }

      if (data) {

        // ✅ Extract syntax validation errors/warnings
        if (data.validation) {
          setSyntaxErrors(data.validation.syntax_errors || []);
          setSyntaxWarnings(data.validation.syntax_warnings || []);
          setHasSyntaxErrors(data.validation.has_syntax_errors || false);
        } else {
          setSyntaxErrors([]);
          setSyntaxWarnings([]);
          setHasSyntaxErrors(false);
        }

        // ✅ Extract validation warnings (3 categories)
        if (data.validation) {
          setUnknownVariables(data.validation.unknown_variables || []);
          setRequiredMissing(data.validation.required_missing || []);
          setOptionalMissing(data.validation.optional_missing || []);

          const hasAnyWarnings = data.validation.has_unknown_variables ||
                                 data.validation.has_required_missing ||
                                 data.validation.has_optional_missing;
          setHasValidationWarnings(hasAnyWarnings);
        } else {
          setUnknownVariables([]);
          setRequiredMissing([]);
          setOptionalMissing([]);
          setHasValidationWarnings(false);
        }

        // Find the specific file for the selected table/project
        let targetFile = null;
        const fileGenerationType = getFileGenerationType();

        if ((fileGenerationType === 'db_table_file' || fileGenerationType === 'db_table_file_languages') && selectedTable !== null) {
          // Find file for specific table
          const selectedTableData = schemaTables[selectedTable];
          const expectedFileName = getSelectedFileName();

          // Try multiple matching strategies
          targetFile = data.processed_files?.find((file: any) => {
            const matchesTableName = file.table_name === selectedTableData?.tablename;
            const matchesFileName = file.generated_from_template === expectedFileName || file.filename === expectedFileName;
            const matchesOriginalTemplate = file.original_template === expectedFileName;

            const shouldMatch = matchesTableName && (matchesFileName || matchesOriginalTemplate);

            return shouldMatch;
          });

          // Fallback: try to find any file with matching template name
          if (!targetFile) {
            targetFile = data.processed_files?.find((file: any) => {
              const matchesFileName = file.generated_from_template === expectedFileName || file.filename === expectedFileName || file.original_template === expectedFileName;
              return matchesFileName;
            });
          }

        } else if ((fileGenerationType === 'project_file' || fileGenerationType === 'project_file_languages')) {
          // Find project-level file
          const expectedFileName = getSelectedFileName();

          targetFile = data.processed_files?.find((file: any) => {
            const matchesProjectFile = file.is_project_file;
            const matchesFileName = file.generated_from_template === expectedFileName || file.filename === expectedFileName || file.original_template === expectedFileName;
            const shouldMatch = matchesProjectFile && matchesFileName;

            return shouldMatch;
          });

          // Fallback: try to find any file with matching template name
          if (!targetFile) {
            targetFile = data.processed_files?.find((file: any) => {
              const matchesFileName = file.generated_from_template === expectedFileName || file.filename === expectedFileName || file.original_template === expectedFileName;
              return matchesFileName;
            });
          }
        }

        if (targetFile) {
          // Use per-file overlaid GTree if available (contains assignment filtering)
          // Falls back to base GTree when no assignments exist for this file
          const gtreeData = targetFile.overlaid_gtree || data.gtree || [];

          // Store gtree in localStorage for efficient access during execution
          localStorage.setItem('scoriet_gtree', JSON.stringify(gtreeData));

          // Store processed filename for download
          setDownloadFilename(targetFile.filename || 'generated.php');

          // Trigger re-render for button state
          setTimeout(() => {
            // Force component update to enable GTree copy button
          }, 100);

          const originalCode = targetFile.compiled_content; // Use compiled_content from new API

          // Check backend-generated template size before processing
          const originalSizeKB = Math.round(originalCode.length / 1024);
          const maxOriginalSizeKB = 150; // Conservative limit for backend content

          if (originalCode.length > maxOriginalSizeKB * 1024) {
            setError(t.debugmanualgeneratorpanel990+`(${originalSizeKB}KB`+t.debugmanualgeneratorpanel990a+`${maxOriginalSizeKB}KB).`+t.debugmanualgeneratorpanel990b);
            setLoading(false);
            return;
          }

          // 🔧 REMOVED: DO NOT convert \n to real newlines for display!
          // This was breaking the code display by converting escape sequences
          // let cleanedCode = originalCode.replace(/\\n/g, '\n');
          let cleanedCode = originalCode; // Keep \n as text for proper display

          // Convert indent placeholders to Unicode spaces BEFORE Unicode conversion
          cleanedCode = cleanedCode.replace(/§INDENT2§/g, '\\u0020\\u0020');
          cleanedCode = cleanedCode.replace(/§INDENT4§/g, '\\u0020\\u0020\\u0020\\u0020');


          // 🔧 DO NOT convert \\uXXXX here! Keep them as-is for preparedCode
          // They will be converted ONLY for display (not for execution)
          // This prevents JS from interpreting them as real tabs/newlines during eval

          // Convert Unicode spaces back to regular spaces for indentation
          cleanedCode = cleanedCode.replace(/\\u0020/g, ' ');

          // Add lightweight gtree loader instead of embedding huge JSON
          const gtreeCode = `// GTree Data loaded efficiently from localStorage
const gtree = JSON.parse(localStorage.getItem('scoriet_gtree') || '[]');

`;

          const codeWithGTree = gtreeCode + cleanedCode;

          // Check code size limit (200KB)
          const codeSizeKB = Math.round(codeWithGTree.length / 1024);
          const maxSizeKB = 200;

          if (codeWithGTree.length > maxSizeKB * 1024) {
            setError(`${t.debugmanualgeneratorpanel1155_1}(${codeSizeKB}${t.debugmanualgeneratorpanel1155_2}${maxSizeKB}KB).${t.debugmanualgeneratorpanel1155_3}`);
            setLoading(false);
            return;
          }

          setPreparedCode(codeWithGTree);
          setActiveTabIndex(1); // Switch to Prepared Code tab (was 0 before Raw Template tab was inserted at index 0)
          setExecutedResult(''); // Clear previous result
        } else {
          // Enhanced error message with debug info
          let errorMsg = t.debugmanualgeneratorpanel1035+'\\n\\n';
          errorMsg += `  `+t.debugmanualgeneratorpanel1036+`\\n`;
          errorMsg += `  `+t.debugmanualgeneratorpanel1037+`${selectedTemplate}\\n`;
          errorMsg += `  `+t.debugmanualgeneratorpanel1038+`${getSelectedFileName()}\\n`;
          errorMsg += `  `+t.debugmanualgeneratorpanel1039+`${fileGenerationType}\\n`;

          if (fileGenerationType === 'db_table_file' || fileGenerationType === 'db_table_file_languages') {
            const selectedTableData = schemaTables[selectedTable!];
            errorMsg += `  Tabelle: ${selectedTableData?.tablename || t.testprojectschemas50}\\n`;
          }

          if (fileGenerationType === 'project_file_languages' || fileGenerationType === 'db_table_file_languages') {
            errorMsg += `  `+t.debugmanualgeneratorpanel1047+`${selectedLanguage || t.testprojectschemas50}\\n`;
          }

          errorMsg += `\\n`+t.debugmanualgeneratorpanel1050+`(${data.processed_files?.length || 0}):\\n`;
          if (data.processed_files?.length > 0) {
            data.processed_files.slice(0, 5).forEach((file: any, idx: number) => {
              errorMsg += `  ${idx + 1}. ${file.filename || file.generated_from_template || t.testprojectschemas50} ${file.table_name ? `(${file.table_name})` : ''}\\n`;
            });
            if (data.processed_files.length > 5) {
              errorMsg += `  ... ${data.processed_files.length - 5} `+t.debugmanualgeneratorpanel1056+`\\n`;
            }
          }

          errorMsg += '\\n'+t.debugmanualgeneratorpanel1060;

          setError(errorMsg);
        }
      } else {
        setError(errorMessage || t.debugmanualgeneratorpanel959);
      }
    } catch {
      setError(t.debugmanualgeneratorpanel959);
    } finally {
      setLoading(false);
    }
  };

  // requestCommit: entry point for BOTH commit-style buttons:
  //   • action='raw'      → "Code Template holen" → fetchRawTemplate
  //   • action='compile'  → "Code vorbereiten"    → fetchCode
  // Decides whether to first show the "save as profile?" nudge dialog, or
  // skip straight to the commit. Either way, the header auto-collapses to
  // give the code area more room.
  // Rules:
  //   • Active profile already loaded → skip prompt (nothing new to save).
  //   • User opted out this session → skip prompt.
  //   • Otherwise → show prompt; user decides via the dialog buttons.
  // The chosen action is stashed in a ref so the deferred consumer
  // useEffect below (and the post-save-as continuation in
  // saveCurrentAsProfile) can call the right fetch function regardless of
  // which button started the flow.
  const requestCommit = useCallback((action: 'raw' | 'compile' | 'generate') => {
    pendingCommitActionRef.current = action;
    const shouldPrompt = activeProfileId === null && !dontAskSaveBeforeCommitRef.current;
    if (shouldPrompt) {
      setShowSaveBeforeCommitPrompt(true);
      return;
    }
    setHeaderCollapsed(true);
    setPendingFetchAfterCommitFlow(true);
  }, [activeProfileId]);

  // Consumer for the deferred "fetch after save dialog closes" hand-off.
  // Sits below fetchRawTemplate/fetchCode so the closure captures them
  // correctly (use-before-define would break this if placed alongside
  // saveCurrentAsProfile up top). Reads pendingCommitActionRef to decide
  // which fetch function to call.
  //
  // 'generate' is the mega-button case → kicks off the FULL chain:
  //   • raw fetch (only if rawTemplate is empty — preserves user edits)
  //   • compile (chained via pendingCompileAfterRawFetch)
  //   • execute (chained via pendingExecuteAfterCompile)
  useEffect(() => {
    if (!pendingFetchAfterCommitFlow) return;
    setPendingFetchAfterCommitFlow(false);
    const action = pendingCommitActionRef.current;
    if (action === 'compile') {
      void fetchCode();
    } else if (action === 'generate') {
      if (rawTemplate.length === 0) {
        // Raw template not loaded yet → fetch it first, then chain compile + execute
        setPendingCompileAfterRawFetch(true);
        setPendingExecuteAfterCompile(true);
        void fetchRawTemplate();
      } else {
        // Raw already there (user may have edited it) — skip raw fetch, go
        // straight to compile + execute. This preserves edits.
        setPendingExecuteAfterCompile(true);
        void fetchCode();
      }
    } else {
      // action === 'raw' → only fetch raw, nothing chained
      void fetchRawTemplate();
    }
    // fetchRawTemplate/fetchCode are intentionally excluded from deps —
    // they're redefined every render but their behavior is determined by
    // the current state snapshot when invoked, which is what we want here.
     
  }, [pendingFetchAfterCommitFlow]);

  // Chain step 2: raw fetched → compile. Fires when rawTemplate gets populated
  // while pendingCompileAfterRawFetch is set (= mega-button started a full chain).
  const [pendingCompileAfterRawFetch, setPendingCompileAfterRawFetch] = useState(false);
  useEffect(() => {
    if (!pendingCompileAfterRawFetch) return;
    if (rawTemplateLoading) return;
    if (!rawTemplate) return;
    setPendingCompileAfterRawFetch(false);
    setTimeout(() => { void fetchCode(); }, 80);
     
  }, [pendingCompileAfterRawFetch, rawTemplateLoading, rawTemplate]);

  // Chain step 3: compile finished → execute. fetchCode updates preparedCode;
  // when that flips from empty to populated AND we're flagged, fire executeCode.
  // Used by both the mega-button chain and the output→GO action.
  const [pendingExecuteAfterCompile, setPendingExecuteAfterCompile] = useState(false);
  useEffect(() => {
    if (!pendingExecuteAfterCompile) return;
    if (loading) return;
    if (!preparedCode) return;
    setPendingExecuteAfterCompile(false);
    setTimeout(() => executeCode(), 120);
     
  }, [pendingExecuteAfterCompile, loading, preparedCode]);

  // Auto-switch to the tab that matches the chosen workflow mode. We use a ref
  // to track the "last applied" mode so this only fires on actual mode CHANGES,
  // not on every render — and not on initial mount either (we want to honor
  // whatever activeTabIndex was restored from LS, not override it).
  const lastAppliedWorkflowModeRef = useRef<WorkflowMode | null>(null);
  useEffect(() => {
    if (lastAppliedWorkflowModeRef.current === null) {
      // First render: just record, don't override the restored activeTabIndex.
      lastAppliedWorkflowModeRef.current = workflowMode;
      return;
    }
    if (lastAppliedWorkflowModeRef.current === workflowMode) return;
    lastAppliedWorkflowModeRef.current = workflowMode;
    // Mode → primary tab index:
    //   develop → 0 (Roh-Template)
    //   debug   → 1 (Vorbereiteter Code)
    //   output  → 2 (Ausgeführtes Ergebnis)
    const tabForMode: Record<WorkflowMode, number> = { develop: 0, debug: 1, output: 2 };
    setActiveTabIndex(tabForMode[workflowMode]);
  }, [workflowMode]);

  // Check if selected project is locked
  const isProjectLocked = (): boolean => {
    return selectedProject?.is_soft_locked === true;
  };

  // Check if selected table's schema is locked
  const isSchemaLocked = (): boolean => {
    if (selectedTable === null || selectedTable === undefined) return false;
    const table = schemaTables[selectedTable];
    return table?.is_schema_locked === true;
  };

  const executeCode = () => {
    if (!preparedCode) {
      setError(t.debugmanualgeneratorpanel970);
      return;
    }

    // Block execution if project is locked
    if (isProjectLocked()) {
      setError(t.debugmanualgeneratorpanel1225);
      return;
    }

    // Block execution if schema is locked
    if (isSchemaLocked()) {
      setError(t.debugmanualgeneratorpanel1232);
      return;
    }

    // Performance monitoring
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

    // Memory check before execution
    if ((performance as any).memory) {
      const availableMemory = (performance as any).memory.jsHeapSizeLimit || 0;
      const currentMemory = (performance as any).memory.usedJSHeapSize || 0;
      const memoryUsagePercent = Math.round((currentMemory / availableMemory) * 100);

      if (memoryUsagePercent > 80) {
        setError(t.debugmanualgeneratorpanel1092+`${memoryUsagePercent}`+t.debugmanualgeneratorpanel1092a);
        return;
      }
    }

    try {
      // Try to execute the JavaScript function directly using eval
      // This is safe since we control the code generation
      let result = '';
        // 🔧 Convert Unicode escapes - SIMPLE string replace (no regex!)
        let executableCode = preparedCode;

        // preparedCode has 4 backslashes in string content (shown as \\\\u0009 in console)
        // We need to match 4 backslashes + u0009: split('\\\\\\\\u0009')
        // (8 backslashes in code literal = 4 backslashes in string content)

        // 1. Convert \\\\u0009 to real Tab character (removes all backslashes, replaces with tab)
        executableCode = executableCode.split('\\\\\\\\u0009').join('\t');

        // 2. Convert \\\\u000D/A to \\r/n (4 BS → 2 BS, eval will parse 2 BS as 1 BS + r/n TEXT)
        executableCode = executableCode.split('\\\\\\\\u000D').join('\\\\r');
        executableCode = executableCode.split('\\\\\\\\u000A').join('\\\\n');

        const globalEval = eval;
        // Use indirect eval (not template literal) to avoid escape sequence interpretation
        globalEval(executableCode);

        // Try to find and call the generated function
        const functionMatch = executableCode.match(/function\s+(\w+)\s*\(/);
        if (functionMatch) {
          const functionName = functionMatch[1];

          // Get function from global scope and call it
          const generatedFunction = (window as any)[functionName];
          if (generatedFunction) {
            result = generatedFunction() || '';
          } else {
            throw new Error(t.debugmanualgeneratorpanel1129+`${functionName}`+t.debugmanualgeneratorpanel1129a);
          }
        } else {
          // No function found, try fallback interpretation
          throw new Error(t.debugmanualgeneratorpanel1026);
        }

      // Performance reporting
      const endTime = performance.now();
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const executionTime = Math.round(endTime - startTime);
      const memoryUsed = Math.round((endMemory - startMemory) / 1024); // KB

      // Warning for long execution times
      if (executionTime > 5000) {
        result += `\n\n`+t.debugmanualgeneratorpanel1144+`${executionTime}ms (>5s).`+t.debugmanualgeneratorpanel1144a;
      }

      // Performance stats
      result += `\n\n`+t.debugmanualgeneratorpanel1148+`${executionTime}ms,`+t.debugmanualgeneratorpanel1148a+`${memoryUsed}KB`;

      // Set the final result
      setExecutedResult(result);
      setActiveTabIndex(2); // Switch to Executed Result tab (was 1 before Raw Template tab)
    } catch (execError) {
      // Set error result when execution fails
      setExecutedResult(t.debugmanualgeneratorpanel1155+` `+t.debugmanualgeneratorpanel1048+` `+t.debugmanualgeneratorpanel1155a+`\n\n${(execError as Error).message || t.schematranslationpanel319}`);
      setActiveTabIndex(2); // Switch to Executed Result tab to show error

      // Enhanced error handling with line number detection
      let errorMessage = '';
      const error = execError as Error;

      // Try to extract line number from error stack and convert to template line number
      let lineNumber = '';
      if (error.stack) {
        const lineMatch = error.stack.match(/:(\d+):\d+/);
        if (lineMatch) {
          const jsLineNumber = parseInt(lineMatch[1]);

          // Debug: Show the actual code that was executed
          if (preparedCode) {
            const codeLines = preparedCode.split('\n');

            // Find where the function starts (gtree ends)
            let gtreeLines = 0;
            for (let i = 0; i < codeLines.length; i++) {
              const line = codeLines[i].trim();
              if (line.startsWith('function ') || line.includes('function ')) {
                gtreeLines = i;
                break;
              }
            }

            // Since the error line number seems unrelated to our small code,
            // let's try a different approach: find the error line in our actual code
            if (jsLineNumber > codeLines.length) {
              // Error line is beyond our code - probably from eval context
              lineNumber = ` (${t.debugmanualgeneratorpanel1349}~${jsLineNumber % codeLines.length || 1}${t.debugmanualgeneratorpanel1349_2})`;
            } else if (jsLineNumber > gtreeLines) {
              const templateLineNumber = jsLineNumber - gtreeLines;
              lineNumber = ` (${t.debugmanualgeneratorpanel1352}${templateLineNumber}, JS Line ${jsLineNumber})`;
            } else {
              lineNumber = ` (JS Line ${jsLineNumber} - ${t.debugmanualgeneratorpanel1354})`;
            }
          } else {
            lineNumber = ` (JS Line ${jsLineNumber})`;
          }
        }
      }

      if (error.name === t.debugmanualgeneratorpanel1093) {
        errorMessage = t.debugmanualgeneratorpanel1201+`${lineNumber}:\n\n`+t.debugmanualgeneratorpanel1201a+`${error.message}\n\n`+t.debugmanualgeneratorpanel1201b;

      } else if (error.name === t.debugmanualgeneratorpanel1096) {
        // Extract variable name if possible
        const variableMatch = error.message.match(/(\w+) is not defined/);
        const variable = variableMatch ? variableMatch[1] : 'unknown';

        errorMessage = t.debugmanualgeneratorpanel1208+`${lineNumber}:\n\n`+t.debugmanualgeneratorpanel1208a+`"${variable}" `+t.debugmanualgeneratorpanel1208b+`${error.message}\n\n`+t.debugmanualgeneratorpanel1208c+`{${variable} `+t.debugmanualgeneratorpanel1208d;

      } else if (error.name === 'TypeError') {
        errorMessage = t.debugmanualgeneratorpanel1211+`${lineNumber}:\n\n`+t.debugmanualgeneratorpanel1211a+`${error.message}\n\n`+t.debugmanualgeneratorpanel1211b;

      } else {
        errorMessage = t.debugmanualgeneratorpanel1214+`${lineNumber}:\n\n`+t.debugmanualgeneratorpanel1214a+`${error.message || t.schematranslationpanel319}\n`+t.debugmanualgeneratorpanel1214b+`${error.name || t.testprojectschemas50}\n\n`+t.debugmanualgeneratorpanel1214c;
      }

      // Only try fallback for SyntaxError, not for runtime errors
      if (error.name === t.debugmanualgeneratorpanel1093) {
        try {
        let result = '';
        const functionMatch = preparedCode.match(/function\s+(\w+)\s*\([^)]*\)\s*\{([\s\S]*)\}/);
        if (functionMatch) {
            const [, , functionBody] = functionMatch;
            const lines = functionBody.split('\n');
            let sContentResult = '';

        // Get gtree data for execution (commented out as not used in simple interpretation)
        // const gtree = schemaTables.length > 0 ? [{
        //   project: [{
        //     projectname: currentProject?.name || 'TestProject',
        //     nmaxfiles: schemaTables.length,
        //     tables: schemaTables.map((table, index) => ({
        //       ...table,
        //       tableIndex: index
        //     }))
        //   }]
        // }] : [];

        // Simple JavaScript interpretation
        for (const line of lines) {
          const trimmed = line.trim();

          if (trimmed.startsWith('sContentResult +=')) {
            const stringMatch = trimmed.match(/sContentResult\s*\+=\s*'([^']*)';\s*$/);
            if (stringMatch) {
              let content = stringMatch[1];
              // Normalize line endings and handle Unicode newlines
              content = content
                .replace(/\\u000A/g, '\n')       // Convert Unicode newlines to actual newlines
                .replace(/\\n/g, '\n')           // Convert escaped \n to actual newlines (legacy)
                .replace(/\r\n/g, '\n')          // Convert Windows CRLF to LF
                .replace(/\{n\}/g, '\n')         // Convert {n} placeholder to newlines (legacy)
                .replace(/§/g, '\n');            // Convert § placeholder to newlines (legacy)
              sContentResult += content;
            }
          } else if (trimmed.includes('for (let i = 0; i < gtree[0].project[0].tables[')) {
            // Handle loops if we have table data
            const fileGenerationType = getFileGenerationType();
            if (fileGenerationType === 'db_table_file' && selectedTable !== null && schemaTables[selectedTable]) {
              const table = schemaTables[selectedTable];
              if (table.items) {
                // Simulate loop execution
                sContentResult += `\n// Loop executed for table: ${table.tablename}\n`;
                table.items.forEach((item: any, i: number) => {
                  sContentResult += `// Field ${i}: ${item.name} (${item.type})\n`;
                });
              }
            }
          }
        }

          // Normalize final output line endings and handle all placeholders
          const normalizedResult = sContentResult
            .replace(/\\u000A/g, '\n')       // Convert Unicode newlines to actual newlines
            .replace(/\r\n/g, '\n')          // Convert Windows CRLF to LF
            .replace(/\r/g, '\n')            // Convert standalone CR to LF
            .replace(/\{n\}/g, '\n')         // Convert {n} placeholder to newlines (legacy)
            .replace(/§/g, '\n');            // Convert § placeholder to newlines (legacy)
          result = normalizedResult;
        } else {
          result = t.debugmanualgeneratorpanel1435+'\n\n' + preparedCode;
        }

          // Set the fallback result with a note about fallback
          setExecutedResult(`${t.debugmanualgeneratorpanel1439}\n\n${result}\n\n${t.debugmanualgeneratorpanel1439_2}\n${errorMessage}`);
          setActiveTabIndex(2); // Switch to Executed Result tab (was 1 before Raw Template tab)
        } catch (fallbackErr) {
          // Use the enhanced error message from the main catch block
          const fallbackError = fallbackErr as Error;
          setExecutedResult(`${errorMessage}\n\n${t.debugmanualgeneratorpanel1444}\n${fallbackError.message || t.debugmanualgeneratorpanel1183}\n\n${t.debugmanualgeneratorpanel1444_2}\n${preparedCode.substring(0, 500)}...`);
        }
      } else {
        // For non-SyntaxErrors (ReferenceError, TypeError, etc.), show error immediately without fallback
        setExecutedResult(`${errorMessage}\n\n${t.debugmanualgeneratorpanel1448_2}`);
        setActiveTabIndex(2); // Switch to Executed Result tab (was 1 before Raw Template tab)
      }
    }
  };

  // Handle GTree Import from Text
  const handleGTreeImportFromText = () => {
    try {
      let content = gtreeImportText.trim();

      if (!content) {
        alert(t.debugmanualgeneratorpanel1461);
        return;
      }

      // Remove "const gtree = " if present
      if (content.includes('const gtree =')) {
        content = content.replace(/const\s+gtree\s*=\s*/, '').replace(/;?\s*$/, '');
      }

      // Parse JSON to validate
      const gtreeData = JSON.parse(content);

      // Validate basic structure
      if (!Array.isArray(gtreeData) || gtreeData.length === 0) {
        alert(t.debugmanualgeneratorpanel1475);
        return;
      }

      if (!gtreeData[0]?.project || !Array.isArray(gtreeData[0].project)) {
        alert(t.debugmanualgeneratorpanel1480);
        return;
      }

      // Save to localStorage
      localStorage.setItem('scoriet_gtree', JSON.stringify(gtreeData));

      alert(`${t.debugmanualgeneratorpanel1487}\n\n${t.debugmanualgeneratorpanel1487_2}${gtreeData[0].project[0]?.projectname || t.debugmanualgeneratorpanel1487_3}\n${t.debugmanualgeneratorpanel1487_4}${gtreeData[0].project[0]?.tables?.length || 0}`);

      // Close modal and clear text
      setShowGTreeImportModal(false);
      setGtreeImportText('');

    } catch (error) {
      alert(`${t.debugmanualgeneratorpanel1494}\n\n${(error as Error).message}\n\n${t.debugmanualgeneratorpanel1494_2}`);
    }
  };

  // Handle Unlock Editor for manual testing
  const handleUnlockEditor = () => {
    if (!editorUnlocked) {
      // Only insert boilerplate if editor is empty (don't overwrite existing code e.g. from "Code holen")
      if (!preparedCode || preparedCode.trim() === '') {
        const selectedTableData = selectedTable !== null ? schemaTables[selectedTable] : undefined;
        const tableName = selectedTableData?.tablename || 'table';
        const fileName = getSelectedFileName() || 'file';
        const languageCode = selectedLanguage || 'en';

        // Create function name from file name (sanitize)
        const functionName = `generate_${fileName.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_{2,}/g, '_')}`;

        const starterCode = `// GTree Data loaded efficiently from localStorage
const gtree = JSON.parse(localStorage.getItem('scoriet_gtree') || '[]');

function ${functionName}() {
  let sContentResult = '';

  // Your custom code here
  sContentResult += '// Generated by ${functionName}\\n';
  sContentResult += '// Table: ${tableName}\\n';
  sContentResult += '// Language: ${languageCode}\\n\\n';

  return sContentResult;
}`;

        setPreparedCode(starterCode);
      }

      setEditorUnlocked(true);
      setActiveTabIndex(1); // Switch to Prepared Code tab (the editor that the unlock applies to; was index 0 before Raw Template tab was added)
    } else {
      // Lock editor again (reset)
      setEditorUnlocked(false);
      setPreparedCode('');
      setExecutedResult('');
    }
  };

  // Dropdown Options — alphabetical by name. We deliberately don't surface
  // the template id in the label; the id was only useful while debugging
  // and is meaningless to the user.
  const templateOptions = Array.isArray(templates) ? [...templates]
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
    .map(tpl => ({
      label: tpl.name,
      value: tpl.id
    })) : [];

  const fileOptions = Array.isArray(templateFiles) ? templateFiles
    .filter(f => f && f.id !== undefined && f.id !== null) // Filter invalid entries first
    .map(f => {
      const fileName = f.file_name || (f as any).name || (f as any).filename || (f as any).template_file_name || t.debugmanualgeneratorpanel1544;
      const fileType = f.file_type || (f as any).type || (f as any).template_file_type || t.testprojectschemas50;

      return {
        label: `${fileName} (${fileType})`,
        value: f.id
      };
    })
    .filter(f => f.label && !f.label.includes('undefined') && f.label !== t.debugmanualgeneratorpanel1210) // Remove any remaining undefined labels
    : [];


  // Debug button state
  // const shouldShowProject = shouldShowProjectDropdown();
  // const shouldShowTable = shouldShowTableDropdown();

  const projectOptions = Array.isArray(projects) ? projects.map(p => ({
    label: p.name,
    value: p.id
  })) : [];

  // Tables whose generation_mode excludes them from per-table file output are
  // hidden from this dropdown — the backend would reject them anyway with the
  // "file not found for selected configuration" fallback. Only 'full' and
  // 'template_only' tables produce per-table files; undefined (legacy/missing)
  // is treated as 'full' for backwards compatibility.
  const tableProducesFiles = (mode?: string) =>
    !mode || mode === 'full' || mode === 'template_only';

  const tableOptions = Array.isArray(schemaTables) ? schemaTables
    .map((table, index) => ({ table, index }))
    .filter(({ table }) => tableProducesFiles(table.generation_mode))
    .map(({ table, index }) => ({
      label: table.database_name
        ? `${table.database_name} - ${table.tablename} (${table.nmaxitems} fields)`
        : `${table.tablename} (${table.nmaxitems} fields)`,
      value: index,
      database: table.database_name || t.testprojectschemas50,
      is_schema_locked: table.is_schema_locked === true
    }))
    .sort((a, b) => a.label.localeCompare(b.label)) // Alphabetisch sortiert
    : [];

  // Check if button should be enabled
  const projectConditionResult = !(shouldShowProjectDropdown() && !selectedProjectForGenerator);
  // FIXED: 0 is a valid table index!
  const tableConditionResult = !shouldShowTableDropdown() || (selectedTable !== null && selectedTable !== undefined);
  const languageConditionResult = !shouldShowLanguageDropdown() || (selectedLanguage !== null && selectedLanguage !== undefined);

  const isButtonEnabled = Boolean(
    !loading &&
    selectedTemplate &&
    (selectedFile !== null && selectedFile !== undefined) &&
    projectConditionResult &&
    tableConditionResult &&
    languageConditionResult
  );


  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => (
        <ErrorFallback error={error} resetError={() => {}} />
      )}
    >
      {/* Root + Card chain is set up as a vertical flex column so the code
          editor at the bottom can claim flex-1 of whatever vertical space
          the dock pane gives us. Earlier this panel used vh-relative math
          (calc(100vh - …)) which broke whenever the panel wasn't full-height
          (Scoriet's app header steals ~150px from the viewport, so 100vh
          over-counted and the page overflowed). Flex sizing makes this
          self-correcting: the dock decides our height, we propagate flex-1
          all the way down to the code container, the math takes care of
          itself.
          Card got replaced with a plain styled div because PrimeReact's
          Card injects 3 wrapper divs (root → body → content) that don't
          carry flex through, and overriding all of them via pt was uglier
          than just doing it ourselves. */}
      <div className="debug-manual-generator-panel h-full p-4 flex flex-col overflow-hidden" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
        <div className="border rounded flex-1 min-h-0 flex flex-col" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary, padding: '1.25rem' }}>
        <div className="flex flex-col h-full gap-4">
          {/* ─── Header bar: title + Profile dropdown + collapse toggle ─── */}
          {/* Always visible. When the body is collapsed only this bar + the
              compact status line below remain — gives the code area roughly
              25-30% more vertical space, which is the main point of the
              refactor. */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
              {t.debugmanualgeneratorpanel1602}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Profile dropdown — power-user shortcut for switching between
                  named selection snapshots. Active profile gets a ✓ marker.
                  "Speichern als..." opens a dialog (Phase 3b). "Verwalten..."
                  opens a Rename/Delete dialog (Phase 3c). */}
              <Dropdown
                value={activeProfileId}
                options={[
                  ...profiles
                    .slice()
                    .sort((a, b) => (b.lastUsed || '').localeCompare(a.lastUsed || ''))
                    .map(p => ({ label: p.name, value: p.id })),
                ]}
                onChange={(e) => {
                  if (e.value) loadProfile(e.value);
                }}
                placeholder={profiles.length === 0 ? 'Keine Profile' : 'Profil laden…'}
                className="text-sm"
                style={{ minWidth: 180 }}
                disabled={profiles.length === 0}
                emptyMessage="Keine Profile vorhanden"
              />
              <Button
                icon="pi pi-save"
                label="Speichern als…"
                onClick={() => {
                  setNewProfileName('');
                  setNewProfileDescription('');
                  setShowSaveAsDialog(true);
                }}
                size="small"
                outlined
                style={{ borderColor: colors.borderPrimary, color: colors.textSecondary }}
                title="Aktuelle Auswahl als neues Profil speichern"
              />
              <Button
                icon="pi pi-cog"
                onClick={() => setShowManageProfilesDialog(true)}
                size="small"
                outlined
                disabled={profiles.length === 0}
                style={{ borderColor: colors.borderPrimary, color: colors.textSecondary }}
                title="Profile verwalten"
              />
              {/* Toggle button. Filled style when expanded (the "Einklappen"
                  action is what most users want after first config) so it
                  doesn't blend into the other outlined controls. When already
                  collapsed it stays outlined since the user also has the
                  clickable status line as a re-expand target.
                  No tooltip — PrimeReact stacks long tooltips vertically
                  against the right viewport edge and the result looked broken. */}
              <Button
                icon={headerCollapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'}
                label={headerCollapsed ? 'Erweitern' : 'Einklappen'}
                onClick={() => setHeaderCollapsed(c => !c)}
                size="small"
                outlined={headerCollapsed}
                style={headerCollapsed
                  ? { borderColor: colors.borderPrimary, color: colors.textSecondary }
                  : { backgroundColor: colors.infoText, borderColor: colors.infoText, color: colors.textInverse, fontWeight: 600 }
                }
              />
            </div>
          </div>

          {/* ─── Compact status line — visible only when collapsed ─── */}
          {/* The whole line is a click-target that re-expands the header
              (in addition to the explicit "Erweitern" button), so the user
              has two equally-valid ways to get back to the form. Pflichtfelder
              that aren't satisfied yet are rendered in the warning color so
              the user immediately sees what's missing without expanding. */}
          {headerCollapsed && (() => {
            const fileType = getFileGenerationType();
            const tplObj = templates.find(tpl => tpl.id === selectedTemplate);
            const fileObj = templateFiles.find(f => f.id === selectedFile);
            const dbObj = databaseOptions.find(d => d.value === selectedDatabaseSchemaId);
            const tblObj = selectedTable !== null ? schemaTables[selectedTable] : null;
            const langObj = languageOptions.find(l => l.value === selectedLanguage);
            const projObj = Array.isArray(projects)
              ? projects.find(p => p.id === selectedProjectForGenerator)
              : undefined;

            type Item = { icon: string; value: string; missing?: boolean };
            const items: Item[] = [];
            items.push({ icon: '📁', value: tplObj?.name || '—', missing: !tplObj });
            items.push({
              icon: '📄',
              value: fileObj?.file_name || (fileObj as any)?.filename || '—',
              missing: !fileObj,
            });
            if (fileType === 'db_table_file' || fileType === 'db_table_file_languages') {
              items.push({
                icon: '📊',
                value: tblObj ? `${tblObj.tablename}${tblObj.database_name ? ` (${tblObj.database_name})` : ''}` : '—',
                missing: !tblObj,
              });
            } else if (fileType === 'project_file' || fileType === 'project_file_languages') {
              items.push({ icon: '🗃', value: dbObj?.label || '—', missing: !dbObj });
              if (selectedSchemaVersion !== null) {
                const mig = migrationFromVersion !== null ? ` ← Migration v${migrationFromVersion}` : '';
                items.push({ icon: '📐', value: `V${selectedSchemaVersion}${mig}` });
              }
              items.push({
                icon: '⚙️',
                value: projObj?.name || '—',
                missing: !projObj,
              });
            }
            if (fileType === 'project_file_languages' || fileType === 'db_table_file_languages') {
              items.push({
                icon: '🌐',
                value: langObj?.label || '—',
                missing: !langObj,
              });
            }
            if (skipCache) items.push({ icon: '⚡', value: 'ohne Cache' });
            if (includeTemplateSource) items.push({ icon: '📜', value: 'Source-include' });

            return (
              <div
                className="cursor-pointer rounded p-3 text-sm transition"
                style={{
                  backgroundColor: colors.bgTertiary,
                  border: `1px solid ${colors.borderPrimary}`,
                }}
                onClick={() => setHeaderCollapsed(false)}
                title="Klicken zum Erweitern"
              >
                <div className="flex items-center gap-x-3 gap-y-1 flex-wrap" style={{ color: colors.textSecondary }}>
                  {items.map((it, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <span style={{ color: colors.textMuted }}>·</span>}
                      <span
                        style={{
                          color: it.missing ? colors.errorText : colors.textPrimary,
                          fontWeight: it.missing ? 600 : 400,
                        }}
                      >
                        {it.missing && <span className="mr-1">⚠️</span>}
                        <span className="mr-1">{it.icon}</span>
                        {it.value}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ─── Full form: description + combobox grid + options ─── */}
          {/* Hidden when collapsed. The fragment keeps the same DOM structure
              the previous version had, so existing CSS / grid behavior is
              unchanged. */}
          {!headerCollapsed && (
          <>
          <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
            {t.debugmanualgeneratorpanel1604}
          </p>

          {/* Selection Controls - FIXED ORDER: Template > File > Table > Project > Language */}
          {/* IMPORTANT: All fields are always visible, only disabled when not relevant! */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* 1. Template Dropdown - IMMER FIRST */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                📄 Template
              </label>
              <Dropdown
                value={selectedTemplate}
                options={templateOptions}
                onChange={(e) => setSelectedTemplate(e.value)}
                placeholder={t.debugmanualgeneratorpanel1277}
                className="w-full"
              />
            </div>

            {/* 2. File Dropdown - IMMER SECOND */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                {t.debugmanualgeneratorpanel1284}
              </label>
              <Dropdown
                value={selectedFile}
                options={fileOptions}
                onChange={(e) => {
                  setSelectedFile(e.value);
                }}
                placeholder={t.debugmanualgeneratorpanel1293}
                className="w-full"
                disabled={!selectedTemplate}
              />
            </div>

            {/* 3+4. Slot is conditional:
                   - db_table_file → ONE dropdown: Tabelle (DB is implied by the table)
                   - project_file  → TWO dropdowns: Datenbank + Schema-Version
                   - else          → ONE disabled placeholder
                 React fragments don't add DOM nodes, so the project_file branch
                 lays out as two siblings in the grid — that's why we wrap each
                 dropdown in its own <div> instead of one outer wrapper. */}
            {shouldShowTableDropdown() ? (
              <div>
                {/* DB-Tabellen-Datei: Table-Dropdown anzeigen */}
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  {t.templatemanagementpanel118} <span className="text-xs" style={{ color: colors.successText }}>{t.debugmanualgeneratorpanel1319}</span>
                </label>
                <Dropdown
                  value={selectedTable}
                  options={tableOptions}
                  onChange={(e) => {
                    // Prevent selecting locked tables
                    const selectedOption = tableOptions.find(opt => opt.value === e.value);
                    if (selectedOption?.is_schema_locked) {
                      return; // Don't allow selection
                    }
                    setSelectedTable(e.value);
                  }}
                  placeholder={t.debugmanualgeneratorpanel1661}
                  className="w-full"
                  itemTemplate={(option) => (
                    <div className={`flex items-center justify-between w-full ${option.is_schema_locked ? 'opacity-60' : ''}`}>
                      <span className={option.is_schema_locked ? 'text-red-400' : ''}>
                        {option.label}
                      </span>
                      {option.is_schema_locked && (
                        <div className="flex items-center gap-2">
                          <i className="pi pi-lock text-red-500" title={t.debugmanualgeneratorpanel1670} />
                          <span className="text-xs text-red-400">{t.debugmanualgeneratorpanel1671}</span>
                        </div>
                      )}
                    </div>
                  )}
                  valueTemplate={(option) => option ? (
                    <div className="flex items-center">
                      {option.is_schema_locked && <i className="pi pi-lock text-red-500 mr-2" />}
                      <span className={option.is_schema_locked ? 'text-red-400' : ''}>
                        {option.label}
                      </span>
                    </div>
                  ) : t.debugmanualgeneratorpanel1683}
                />
              </div>
            ) : shouldShowProjectDropdown() ? (
              <>
                {/* 3a. Datenbank-Dropdown — user picks WHICH schema to compile against.
                       Necessary for multi-schema projects: before, the panel silently
                       defaulted to schemaTables[0].schema_id, hiding any 2nd+ schema. */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                    🗄️ Datenbank {databaseOptions.length > 0 ? <span className="text-xs" style={{ color: colors.successText }}>(Pflichtfeld)</span> : <span className="text-xs" style={{ color: colors.textMuted }}>(keine verfügbar)</span>}
                  </label>
                  <Dropdown
                    value={selectedDatabaseSchemaId}
                    options={databaseOptions}
                    onChange={(e) => setSelectedDatabaseSchemaId(e.value)}
                    placeholder={databaseOptions.length > 0 ? 'Datenbank wählen' : 'keine DB verfügbar'}
                    className="w-full"
                    disabled={databaseOptions.length === 0}
                    itemTemplate={(option) => option ? (
                      <div className={`flex items-center justify-between w-full ${option.is_schema_locked ? 'opacity-60' : ''}`}>
                        <span className={option.is_schema_locked ? 'text-red-400' : ''}>
                          {option.label}
                        </span>
                        {option.is_schema_locked && (
                          <i className="pi pi-lock text-red-500" title={t.debugmanualgeneratorpanel1670} />
                        )}
                      </div>
                    ) : null}
                    valueTemplate={(option) => option ? (
                      <div className="flex items-center">
                        {option.is_schema_locked && <i className="pi pi-lock text-red-500 mr-2" />}
                        <span className={option.is_schema_locked ? 'text-red-400' : ''}>
                          {option.label}
                        </span>
                      </div>
                    ) : 'Datenbank wählen'}
                  />
                </div>
                {/* 3b. Schema-Version — versions of the DB picked above. */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                    {t.debugmanualgeneratorpanel1690}{schemaVersionOptions.length > 0 ? <span className="text-xs" style={{ color: colors.successText }}>{t.debugmanualgeneratorpanel1690_2}</span> : <span className="text-xs" style={{ color: colors.textMuted }}>{t.debugmanualgeneratorpanel1690_3}</span>}
                  </label>
                  <Dropdown
                    value={selectedSchemaVersion}
                    options={schemaVersionOptions}
                    onChange={(e) => {
                      setSelectedSchemaVersion(e.value);
                      // Migration zurücksetzen, wenn neue Version ausgewählt
                      if (migrationFromVersion !== null && e.value !== null && migrationFromVersion >= e.value) {
                        setMigrationFromVersion(null);
                      }
                    }}
                    placeholder={schemaVersionOptions.length > 0 ? t.debugmanualgeneratorpanel1702 : t.debugmanualgeneratorpanel1702_2}
                    className="w-full"
                    disabled={schemaVersionOptions.length === 0}
                  />
                  {selectedSchemaVersion && (
                    <div className="mt-1 text-xs" style={{ color: colors.infoText }}>
                      {t.debugmanualgeneratorpanel1708}{selectedSchemaVersion}{t.debugmanualgeneratorpanel1708_2}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div>
                {/* Weder Table noch Project: Deaktiviertes Dropdown */}
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  {t.templatemanagementpanel118} <span className="text-xs" style={{ color: colors.textMuted }}>{t.debugmanualgeneratorpanel1302}</span>
                </label>
                <Dropdown
                  value={null}
                  options={[]}
                  placeholder={t.debugmanualgeneratorpanel1310}
                  className="w-full"
                  disabled={true}
                />
              </div>
            )}

            {/* 4. Project Dropdown - IMMER FOURTH (disabled wenn nicht project_file) */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                {t.debugmanualgeneratorpanel1355} {shouldShowProjectDropdown() ? <span className="text-xs" style={{ color: colors.successText }}>{t.debugmanualgeneratorpanel1334}</span> : <span className="text-xs" style={{ color: colors.textMuted }}>{t.debugmanualgeneratorpanel1302}</span>}
              </label>
              <Dropdown
                value={selectedProjectForGenerator}
                options={projectOptions}
                onChange={(e) => setSelectedProjectForGenerator(e.value)}
                placeholder={shouldShowProjectDropdown() ? "Projekt wählen" : t.debugmanualgeneratorpanel1310}
                className="w-full"
                disabled={!shouldShowProjectDropdown()}
              />
            </div>

            {/* 5. Language Dropdown - IMMER FIFTH (disabled wenn nicht language-enabled) */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                {t.debugmanualgeneratorpanel1342} {shouldShowLanguageDropdown() ? <span className="text-xs" style={{ color: colors.successText }}>{t.debugmanualgeneratorpanel1334}</span> : <span className="text-xs" style={{ color: colors.textMuted }}>{t.debugmanualgeneratorpanel1302}</span>}
              </label>
              <Dropdown
                value={selectedLanguage}
                options={languageOptions}
                onChange={(e) => {
                  setSelectedLanguage(e.value);
                }}
                placeholder={shouldShowLanguageDropdown() ? t.debugmanualgeneratorpanel1342 : t.debugmanualgeneratorpanel1310}
                className="w-full"
                disabled={!shouldShowLanguageDropdown()}
              />
            </div>

            {/* 6. Migration Version Dropdown - Optional: Migration von Version X */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                {t.debugmanualgeneratorpanel1763}{migrationVersionOptions.length > 0 ? <span className="text-xs" style={{ color: colors.infoText }}>(Optional)</span> : <span className="text-xs" style={{ color: colors.textMuted }}>(nicht verfügbar)</span>}
              </label>
              <Dropdown
                value={migrationFromVersion}
                options={[
                  { label: t.debugmanualgeneratorpanel1768, value: null },
                  ...migrationVersionOptions
                ]}
                onChange={(e) => setMigrationFromVersion(e.value)}
                placeholder={t.debugmanualgeneratorpanel1772}
                className="w-full"
                disabled={migrationVersionOptions.length === 0}
              />
              {migrationFromVersion && (
                <div className="mt-1 text-xs" style={{ color: colors.infoText }}>
                  Migration v{migrationFromVersion} → aktuell wird im GTree verfügbar sein
                </div>
              )}
            </div>

          </div>

          {/* Options */}
          <div className="mt-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="include-template-source"
                  checked={includeTemplateSource}
                  onChange={(e) => setIncludeTemplateSource(e.target.checked)}
                  className="w-4 h-4"
                  style={{ accentColor: colors.accent }}
                />
                <label htmlFor="include-template-source" className="text-sm cursor-pointer" style={{ color: colors.textSecondary }}>
                  {t.debugmanualgeneratorpanel1360}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="skip-redis-cache"
                  checked={skipCache}
                  onChange={(e) => setSkipCache(e.target.checked)}
                  className="w-4 h-4"
                  style={{ accentColor: '#f59e0b' }}
                />
                <label htmlFor="skip-redis-cache" className="text-sm cursor-pointer" style={{ color: '#f59e0b' }}>
                  {t.debugmanualgeneratorpanel_skipcache}
                </label>
              </div>
            </div>
          </div>
          </>
          )}

          {/* ⚠️ VALIDATION WARNING BANNERS */}

          {/* 🔴 SYNTAX ERRORS (Red - CRITICAL - highest priority) */}
          {syntaxErrors.length > 0 && (
            <div className="mt-4">
              <Panel
                header={
                  <div className="flex items-center gap-2">
                    <i className="pi pi-times-circle" style={{ color: colors.errorText }}></i>
                    <span className="font-semibold" style={{ color: colors.errorText }}>
                      {t.debugmanualgeneratorpanel1325} ({syntaxErrors.length})
                    </span>
                  </div>
                }
                toggleable
                collapsed={false}
                pt={{
                  root: { style: { backgroundColor: colors.errorBg, border: `1px solid ${colors.errorText}` } },
                  header: { style: { backgroundColor: colors.errorBg, borderColor: colors.errorText, color: colors.errorText } },
                  content: { style: { backgroundColor: colors.errorBg, borderColor: colors.errorText, color: colors.textPrimary } },
                  togglerIcon: { style: { color: colors.errorText } }
                }}
              >
                <div className="space-y-2">
                  <p className="text-sm" style={{ color: colors.errorText }}>
                    <strong>{t.debugmanualgeneratorpanel1828}</strong> {t.debugmanualgeneratorpanel1397}
                  </p>

                  <div className="p-3 rounded border max-h-64 overflow-auto" style={{ backgroundColor: colors.bgTertiary, borderColor: colors.errorText }}>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      {syntaxErrors.map((err, idx) => (
                        <li key={idx} style={{ color: colors.textPrimary }}>
                          <span className="font-semibold" style={{ color: colors.errorText }}>{err.file}</span>
                          <br />
                          <span className="ml-5" style={{ color: colors.textPrimary }}>{err.error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-xs mt-2 italic" style={{ color: colors.errorText }}>
                    {t.debugmanualgeneratorpanel1400}
                  </p>
                </div>
              </Panel>
            </div>
          )}

          {/* ⚠️ SYNTAX WARNINGS (Yellow - medium priority) */}
          {syntaxWarnings.length > 0 && (
            <div className="mt-4">
              <Panel
                header={
                  <div className="flex items-center gap-2">
                    <i className="pi pi-exclamation-triangle" style={{ color: colors.warningText }}></i>
                    <span className="font-semibold" style={{ color: colors.warningText }}>
                      {t.debugmanualgeneratorpanel1859}({syntaxWarnings.length})
                    </span>
                  </div>
                }
                toggleable
                collapsed={true}
                pt={{
                  root: { style: { backgroundColor: colors.warningBg, border: `1px solid ${colors.warningText}` } },
                  header: { style: { backgroundColor: colors.warningBg, borderColor: colors.warningText, color: colors.warningText } },
                  content: { style: { backgroundColor: colors.warningBg, borderColor: colors.warningText, color: colors.textPrimary } },
                  togglerIcon: { style: { color: colors.warningText } }
                }}
              >
                <div className="space-y-2">
                  <p className="text-sm" style={{ color: colors.warningText }}>
                    {t.debugmanualgeneratorpanel1755}
                  </p>

                  <div className="p-3 rounded border max-h-48 overflow-auto" style={{ backgroundColor: colors.bgTertiary, borderColor: colors.warningText }}>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      {syntaxWarnings.map((warn, idx) => (
                        <li key={idx} style={{ color: colors.textPrimary }}>
                          <span className="font-semibold" style={{ color: colors.warningText }}>{warn.file}</span>
                          <br />
                          <span className="ml-5" style={{ color: colors.textPrimary }}>{warn.warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Panel>
            </div>
          )}

          {/* 1️⃣ UNKNOWN VARIABLES (Orange - variable warnings) */}
          {unknownVariables.length > 0 && (
            <div className="mt-4">
              <Panel
                header={
                  <div className="flex items-center gap-2">
                    <i className="pi pi-exclamation-triangle" style={{ color: colors.warningText }}></i>
                    <span className="font-semibold" style={{ color: colors.warningText }}>
                      {t.debugmanualgeneratorpanel1901}({unknownVariables.length})
                    </span>
                  </div>
                }
                toggleable
                collapsed={true}
                pt={{
                  root: { style: { backgroundColor: colors.warningBg, border: `1px solid ${colors.warningText}` } },
                  header: { style: { backgroundColor: colors.warningBg, borderColor: colors.warningText, color: colors.warningText } },
                  content: { style: { backgroundColor: colors.warningBg, borderColor: colors.warningText, color: colors.textPrimary } },
                  togglerIcon: { style: { color: colors.warningText } }
                }}
              >
                <div className="space-y-2">
                  <p className="text-sm" style={{ color: colors.warningText }}>
                    {t.debugmanualgeneratorpanel1916}<strong>{t.debugmanualgeneratorpanel1916_2}</strong>{t.debugmanualgeneratorpanel1916_3}<strong>"undefined"</strong>:
                  </p>

                  <div className="p-3 rounded border max-h-48 overflow-auto" style={{ backgroundColor: colors.bgTertiary, borderColor: colors.warningText }}>
                    <ul className="list-disc list-inside space-y-1 text-sm font-mono">
                      {unknownVariables.map((warning, idx) => (
                        <li key={idx} style={{ color: colors.textPrimary }}>
                          <span className="font-semibold" style={{ color: colors.warningText }}>{warning.file}</span>
                          <span style={{ color: colors.textSecondary }}>,t.debugmanualgeneratorpanel1924{warning.line}</span>
                          : <span style={{ color: colors.accent }}>{`{${warning.variable}}`}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-xs mt-2 italic" style={{ color: colors.warningText }}>
                    {t.debugmanualgeneratorpanel1932}
                  </p>
                </div>
              </Panel>
            </div>
          )}

          {/* 2️⃣ REQUIRED BUT MISSING (Red - error level) */}
          {requiredMissing.length > 0 && (
            <div className="mt-4">
              <Panel
                header={
                  <div className="flex items-center gap-2">
                    <i className="pi pi-times-circle" style={{ color: colors.errorText }}></i>
                    <span className="font-semibold" style={{ color: colors.errorText }}>
                      {t.debugmanualgeneratorpanel1947}({requiredMissing.length})
                    </span>
                  </div>
                }
                toggleable
                collapsed={true}
                pt={{
                  root: { style: { backgroundColor: colors.errorBg, border: `1px solid ${colors.errorText}` } },
                  header: { style: { backgroundColor: colors.errorBg, borderColor: colors.errorText, color: colors.errorText } },
                  content: { style: { backgroundColor: colors.errorBg, borderColor: colors.errorText, color: colors.textPrimary } },
                  togglerIcon: { style: { color: colors.errorText } }
                }}
              >
                <div className="space-y-2">
                  <p className="text-sm" style={{ color: colors.errorText }}>
                    {t.debugmanualgeneratorpanel1962}<strong>required</strong>{t.debugmanualgeneratorpanel1962_2}<strong>"undefined"</strong>
                  </p>

                  <div className="p-3 rounded border max-h-48 overflow-auto" style={{ backgroundColor: colors.bgTertiary, borderColor: colors.errorText }}>
                    <ul className="list-disc list-inside space-y-1 text-sm font-mono">
                      {requiredMissing.map((warning, idx) => (
                        <li key={idx} style={{ color: colors.textPrimary }}>
                          <span className="font-semibold" style={{ color: colors.errorText }}>{warning.file}</span>
                          <span style={{ color: colors.textSecondary }}>, line {warning.line}</span>
                          : <span style={{ color: colors.accent }}>{`{${warning.variable}}`}</span>
                          {warning.description && (
                            <span className="ml-2" style={{ color: colors.errorText }}>- {warning.description}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-xs mt-2 italic" style={{ color: colors.errorText }}>
                    {t.debugmanualgeneratorpanel1981}
                  </p>
                </div>
              </Panel>
            </div>
          )}

          {/* 3️⃣ OPTIONAL BUT MISSING (Blue - info level) */}
          {optionalMissing.length > 0 && (
            <div className="mt-4">
              <Panel
                header={
                  <div className="flex items-center gap-2">
                    <i className="pi pi-info-circle" style={{ color: colors.infoText }}></i>
                    <span className="font-semibold" style={{ color: colors.infoText }}>
                      {t.debugmanualgeneratorpanel1996}({optionalMissing.length})
                    </span>
                  </div>
                }
                toggleable
                collapsed={true}
                pt={{
                  root: { style: { backgroundColor: colors.infoBg, border: `1px solid ${colors.infoText}` } },
                  header: { style: { backgroundColor: colors.infoBg, borderColor: colors.infoText, color: colors.infoText } },
                  content: { style: { backgroundColor: colors.infoBg, borderColor: colors.infoText, color: colors.textPrimary } },
                  togglerIcon: { style: { color: colors.infoText } }
                }}
              >
                <div className="space-y-2">
                  <p className="text-sm" style={{ color: colors.infoText }}>
                    {t.debugmanualgeneratorpanel2011}<strong>{t.debugmanualgeneratorpanel2011_2}""</strong>{t.debugmanualgeneratorpanel2011_3}
                  </p>

                  <div className="p-3 rounded border max-h-48 overflow-auto" style={{ backgroundColor: colors.bgTertiary, borderColor: colors.infoText }}>
                    <ul className="list-disc list-inside space-y-1 text-sm font-mono">
                      {optionalMissing.map((warning, idx) => (
                        <li key={idx} style={{ color: colors.textPrimary }}>
                          <span className="font-semibold" style={{ color: colors.infoText }}>{warning.file}</span>
                          <span style={{ color: colors.textSecondary }}>, line {warning.line}</span>
                          : <span style={{ color: colors.accent }}>{`{${warning.variable}}`}</span>
                          {warning.default_value && (
                            <span className="ml-2" style={{ color: colors.successText }}>t.debugmanualgeneratorpanel2022"{warning.default_value}"</span>
                          )}
                          {!warning.default_value && (
                            <span className="ml-2" style={{ color: colors.textMuted }}>→ ""</span>
                          )}
                          {warning.description && (
                            <div className="ml-6 text-xs" style={{ color: colors.infoText }}>└ {warning.description}</div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-xs mt-2 italic" style={{ color: colors.infoText }}>
                    {t.debugmanualgeneratorpanel2036}
                  </p>
                </div>
              </Panel>
            </div>
          )}

          {/* Project Locked Warning */}
          {isProjectLocked() && (
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 text-red-400">
                <i className="pi pi-lock text-lg"></i>
                <div>
                  <span className="font-semibold">{t.debugmanualgeneratorpanel2049}</span>
                  <span className="text-sm text-red-300 ml-2">
                    {t.debugmanualgeneratorpanel2051}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Schema Locked Warning */}
          {isSchemaLocked() && !isProjectLocked() && (
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 text-red-400">
                <i className="pi pi-lock text-lg"></i>
                <div>
                  <span className="font-semibold">{t.debugmanualgeneratorpanel2064}</span>
                  <span className="text-sm text-red-300 ml-2">
                    {t.debugmanualgeneratorpanel2066}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ─── Top action toolbar (single bordered strip) ─────────────
              Replaces the loud blue mega-button + separate workflow controls
              with a single, visually-cohesive toolbar bar. All buttons use the
              same small size and outlined style so nothing screams; the only
              tonal emphasis is the green tint on the primary action and the
              blue tint on the GO button.
              Two non-overlapping actions:
                • Generieren & Anzeigen (left): FULL chain raw → compile → execute.
                • Workflow ▾ + GO (right): single step picked by the dropdown
                  (develop=raw fetch, debug=compile, output=execute). */}
          <div className="flex items-center gap-2 p-2 rounded border flex-wrap" style={{
            borderColor: colors.borderPrimary,
            backgroundColor: colors.bgTertiary,
          }}>
            {/* LEFT: Mega-button — full chain. Toolbar look: transparent at rest,
                hover highlight. Color comes from .tb-success modifier (CSS-based
                so the global !important rules don't override it). */}
            <Button
              label="Generieren & Anzeigen"
              icon={loading ? 'pi pi-spinner pi-spin' : ((isProjectLocked() || isSchemaLocked()) ? 'pi pi-lock' : 'pi pi-bolt')}
              size="small"
              text
              onClick={() => requestCommit('generate')}
              disabled={!isButtonEnabled || loading || isProjectLocked() || isSchemaLocked()}
              className="toolbar-btn tb-success"
              style={{ fontWeight: 600 }}
            />

            {/* Visual divider between the two action groups */}
            <div className="h-6 w-px mx-1" style={{ backgroundColor: colors.borderPrimary }} />

            {/* RIGHT (ml-auto pushes to far edge): Workflow chooser + GO */}
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <span className="text-sm" style={{ color: colors.textSecondary }}>Workflow:</span>
              <Dropdown
                value={workflowMode}
                options={[
                  { label: '✏️ Template entwickeln', value: 'develop' },
                  { label: '🐛 Code testen / debuggen', value: 'debug' },
                  { label: '👁 Output ansehen', value: 'output' },
                ]}
                onChange={(e) => { if (e.value) setWorkflowMode(e.value as WorkflowMode); }}
                className="text-sm"
                style={{ minWidth: 220 }}
              />
              {/* → GO. Action is mode-specific (no overlap with the mega-button):
                    develop → fetchRawTemplate    (load raw into Tab 1)
                    debug   → fetchCode           (compile into Tab 2)
                    output  → executeCode         (run existing compiled code) */}
              <Button
                icon="pi pi-arrow-right"
                label="GO"
                size="small"
                text
                onClick={() => {
                  if (workflowMode === 'develop') {
                    requestCommit('raw');
                  } else if (workflowMode === 'debug') {
                    requestCommit('compile');
                  } else {
                    executeCode();
                  }
                }}
                disabled={
                  workflowMode === 'output'
                    ? (!preparedCode || isProjectLocked() || isSchemaLocked())
                    : (!isButtonEnabled || loading || rawTemplateLoading || isProjectLocked() || isSchemaLocked())
                }
                className="toolbar-btn tb-info"
                style={{ fontWeight: 600 }}
              />
            </div>
          </div>

          {/* (no mode-specific extras row anymore — all per-tab actions
              live in their tab toolbars. Debug-Helfer trigger moved to
              Tab 2 since it operates on preparedCode and writes to Tab 4.) */}

          {error && (
            <div className="p-4 border-b" style={{ backgroundColor: colors.errorBg, borderColor: colors.errorText, color: colors.errorText }}>
              <div className="flex items-center">
                <span className="mr-2">⚠️</span>
                <span>{error}</span>
                <button
                  onClick={() => setError('')}
                  className="ml-auto hover:opacity-80"
                  style={{ color: colors.errorText }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* 4-Tab System — always visible once a file is selected.
              Tab order matters: Raw Template (Tab 0) is the AUTHOR view
              (source you type/edit), Prepared Code (Tab 1) is what the
              engine compiles your template down to, Executed Result (Tab 2)
              is the final output, Debug Helper (Tab 3) is static analysis.
              Workflow flows left → right: write → compile → execute → debug.

              Previously this TabView was gated on `preparedCode &&` —
              hidden entirely until the user pressed "Code holen". That made
              the raw template tab unreachable. Now we render as soon as
              there's a file context to talk about; the prepared/executed/
              debug tabs show empty-state placeholders when their respective
              buffer is empty. */}
          {(selectedFile !== null && selectedFile !== undefined) && (
            // flex-1 + min-h-0 → claim the remaining vertical space in the
            // panel column. themed-tabview-flex is a class we add CSS rules
            // for below to make TabView's internal containers (.p-tabview,
            // .p-tabview-panels, .p-tabview-panel) inherit the height, since
            // PrimeReact doesn't size them via flex by default.
            <div className="flex-1 min-h-0 flex flex-col" style={{ backgroundColor: colors.bgSecondary }}>
              <TabView
                activeIndex={activeTabIndex}
                onTabChange={(e: any) => setActiveTabIndex(e.index)}
                className="themed-tabview themed-tabview-flex"
              >
              {/* ── TAB 0: Raw Template ─────────────────────────────────── */}
              <TabPanel header={t.debugmanualgeneratorpanel_tab_raw_template || 'Raw Template'} style={{ color: colors.textPrimary }}>
                <div className="rounded border flex-1 min-h-0 flex flex-col" style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary }}>
                  {/* Toolbar: filename + dirty flag + Copy + Save buttons.
                      Save fires the confirm dialog (NOT the API) because
                      overwriting the stored template file is a destructive
                      operation; the dialog gives the user a 1-second
                      sanity check. */}
                  <div className="flex justify-between items-center p-2 border-b" style={{ borderColor: colors.borderPrimary, backgroundColor: colors.bgSecondary }}>
                    <div className="text-sm flex items-center gap-2" style={{ color: colors.textMuted }}>
                      {(() => {
                        const file: any = templateFiles.find((f) => f.id === selectedFile);
                        const name = file ? (file.file_name || file.filename || '?') : '—';
                        const dirty = rawTemplate !== rawTemplateOriginal;
                        return (
                          <>
                            <i className="pi pi-file-edit" />
                            <span>{name}</span>
                            {dirty && (
                              <span className="ml-2 px-2 py-0.5 rounded text-xs" style={{ backgroundColor: colors.warningText + '33', color: colors.warningText, fontWeight: 600 }}>
                                {t.debugmanualgeneratorpanel_dirty_indicator || 'unsaved'}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    {/* Tab 1 toolbar — all text-style for visual consistency
                        with the top toolbar. Tint encodes intent:
                          warning (orange) = own-tab fetch action
                          info (blue)      = forward navigation to next tab
                          muted            = passive utilities (copy)
                          success (green)  = persisted-state write (save) */}
                    <div className="flex gap-1 flex-wrap">
                      <Button
                        label={t.debugmanualgeneratorpanel_btn_get_template || 'Code Template (neu) laden'}
                        icon={rawTemplateLoading ? 'pi pi-spinner pi-spin' : 'pi pi-cloud-download'}
                        size="small"
                        text
                        onClick={() => requestCommit('raw')}
                        disabled={!isButtonEnabled || rawTemplateLoading || isProjectLocked() || isSchemaLocked()}
                        className="toolbar-btn tb-warning"
                      />
                      <Button
                        label="Javascript generieren →"
                        icon={loading ? 'pi pi-spinner pi-spin' : 'pi pi-code'}
                        size="small"
                        text
                        onClick={() => requestCommit('compile')}
                        disabled={!isButtonEnabled || loading || isProjectLocked() || isSchemaLocked()}
                        className="toolbar-btn tb-info"
                        style={{ fontWeight: 600 }}
                      />
                      <Button
                        label={t.debugmanualgeneratorpanel_btn_copy_template || 'Copy'}
                        icon="pi pi-copy"
                        size="small"
                        text
                        onClick={() => {
                          const text = rawTemplate || '';
                          if (navigator.clipboard && window.isSecureContext) {
                            navigator.clipboard.writeText(text).catch(() => copyToClipboardFallback(text, t));
                          } else {
                            copyToClipboardFallback(text, t);
                          }
                        }}
                        disabled={!rawTemplate}
                        className="toolbar-btn tb-neutral"
                      />
                      <Button
                        label={t.debugmanualgeneratorpanel_btn_save_template || 'Save to file'}
                        icon="pi pi-save"
                        size="small"
                        text
                        onClick={() => setShowSaveConfirmDialog(true)}
                        disabled={rawTemplateLoading || rawTemplate === rawTemplateOriginal || !selectedFile}
                        className="toolbar-btn tb-success"
                      />
                    </div>
                  </div>

                  {/* Editor — uses the existing LineNumbersCodeDisplay
                      (react-simple-code-editor + Prism) for consistency with
                      the Prepared Code tab. Template DSL with {:…:} markers
                      doesn't have a dedicated Prism mode; JS highlighting
                      is "close enough" and matches Tab 1 visually.
                      Height: flex-1 in the parent column so the editor takes
                      exactly the space the panel offers (driven by the dock
                      pane, not by viewport math). min-h-0 is required by
                      flexbox to let the child shrink past its content size. */}
                  <div className="flex-1 min-h-0 overflow-auto">
                    {rawTemplate || rawTemplateLoading ? (
                      <LineNumbersCodeDisplay
                        code={rawTemplate}
                        readOnly={false}
                        onChange={setRawTemplate}
                        colors={colors}
                        t={t}
                      />
                    ) : (
                      <div className="p-6 text-sm" style={{ color: colors.textMuted }}>
                        {t.debugmanualgeneratorpanel_no_template_loaded
                          || "Click 'Code Template holen' to load the raw template source, or start writing from scratch in this area once a template file is selected above."}
                      </div>
                    )}
                  </div>
                </div>
              </TabPanel>

              {/* ── TAB 1: Prepared Code ────────────────────────────────── */}
              <TabPanel header={t.debugmanualgeneratorpanel1531} style={{ color: colors.textPrimary }}>
                <div className="p-4 rounded border flex-1 min-h-0 flex flex-col" style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm" style={{ color: colors.textMuted }}>{t.debugmanualgeneratorpanel2253}</span>
                    <div className="flex gap-2 flex-wrap">
                      {/* Editor entsperren — affects THIS tab's editor. */}
                      <Button
                        label={editorUnlocked ? t.debugmanualgeneratorpanel2217 : t.debugmanualgeneratorpanel2217_2}
                        icon={editorUnlocked ? 'pi pi-lock' : 'pi pi-unlock'}
                        size="small"
                        text
                        onClick={handleUnlockEditor}
                        className={`toolbar-btn ${editorUnlocked ? 'tb-error' : 'tb-warning'}`}
                      />
                      {/* Forward step → Tab 3: run the compiled code we're
                          looking at. User principle: every tab → next tab. */}
                      <Button
                        label="Code ausführen →"
                        icon={(isProjectLocked() || isSchemaLocked()) ? 'pi pi-lock' : 'pi pi-play'}
                        size="small"
                        text
                        onClick={executeCode}
                        disabled={!preparedCode || isProjectLocked() || isSchemaLocked()}
                        className="toolbar-btn tb-success"
                        style={{ fontWeight: 600 }}
                      />
                      {/* Forward branch → Tab 4: static analysis of the JS.
                          Lives here because it operates on preparedCode (the
                          buffer this tab shows). Uses the inline analyzer
                          previously inside the top-toolbar Debug button. */}
                      <Button
                        label="Debug-Helfer →"
                        icon="pi pi-search"
                        size="small"
                        text
                        onClick={() => {
                          try {
                            let debugOutput = '';
                            debugOutput += `🔠🔠🔠 Scoriet Template Debug Analysis 🔠🔠🔠\n`;
                            debugOutput += `⏰ Analysis started at: ${new Date().toLocaleTimeString()}\n\n`;
                            debugOutput += `⚙️ CONFIGURATION ANALYSIS\n==============================\n`;
                            debugOutput += `Template: ${selectedTemplate || t.debugmanualgeneratorpanel1396}\n`;
                            debugOutput += `File: ${getSelectedFileName() || t.debugmanualgeneratorpanel1396}\n`;
                            debugOutput += `Type: ${getFileGenerationType() || t.testprojectschemas50}\n`;
                            debugOutput += `Project: ${selectedProjectForGenerator || t.debugmanualgeneratorpanel1396}\n`;
                            debugOutput += `Table: ${selectedTable !== null ? selectedTable : t.debugmanualgeneratorpanel1396}\n`;
                            debugOutput += `Available Tables: ${tableOptions.length}\n\n`;
                            if (preparedCode) {
                              const codeLines = preparedCode.split('\n');
                              debugOutput += `📄 GENERATED JAVASCRIPT ANALYSIS\n====================================\n`;
                              debugOutput += `Total Lines: ${codeLines.length}\n`;
                              debugOutput += `Code Size: ${(preparedCode.length / 1024).toFixed(2)} KB\n\n`;
                              debugOutput += `🔍 JAVASCRIPT SYNTAX ANALYSIS\n==============================\n`;
                              const syntaxIssues: string[] = [];
                              codeLines.forEach((line, index) => {
                                const lineNum = index + 1;
                                const trimmed = line.trim();
                                if (trimmed) {
                                  if (trimmed.includes('tables[]')) syntaxIssues.push(`Line ${lineNum}: ${t.debugmanualgeneratorpanel2131}`);
                                  if (trimmed.includes("'") && !trimmed.includes("\\\\'")) {
                                    const singleQuotes = (trimmed.match(/'/g) || []).length;
                                    if (singleQuotes % 2 !== 0) syntaxIssues.push(`Line ${lineNum}: ${t.debugmanualgeneratorpanel2137}`);
                                  }
                                  if (trimmed.includes('undefined')) syntaxIssues.push(`Line ${lineNum}: ${t.debugmanualgeneratorpanel2142}`);
                                }
                              });
                              if (syntaxIssues.length === 0) debugOutput += `${t.debugmanualgeneratorpanel2170}\n`;
                              else {
                                debugOutput += `${t.debugmanualgeneratorpanel2172}${syntaxIssues.length}${t.debugmanualgeneratorpanel2172_2}\n\n`;
                                syntaxIssues.forEach(issue => debugOutput += `${issue}\n`);
                              }
                              debugOutput += `\n`;
                            }
                            const issues: string[] = [];
                            if (!selectedProjectForGenerator && shouldShowProjectDropdown()) issues.push(t.debugmanualgeneratorpanel1473);
                            if ((selectedTable === null || selectedTable === undefined) && shouldShowTableDropdown()) issues.push(t.debugmanualgeneratorpanel1476);
                            if (!selectedLanguage && shouldShowLanguageDropdown()) issues.push(t.debugmanualgeneratorpanel1479);
                            if (preparedCode && preparedCode.includes('tables[]')) issues.push(t.debugmanualgeneratorpanel1482);
                            debugOutput += `⚠️ POTENTIAL ISSUES ANALYSIS\n==============================\n`;
                            if (issues.length === 0) debugOutput += `✅ No issues detected\n`;
                            else issues.forEach(issue => debugOutput += `${issue}\n`);
                            debugOutput += `\n=== Debug Analysis Complete ===`;
                            setDebugInfo(debugOutput);
                            setActiveTabIndex(3);
                          } catch (debugError) {
                            setDebugInfo(`❌ Error in Debug Helper:${(debugError as Error).message}\n\nDetails: ${debugError}`);
                            setActiveTabIndex(3);
                          }
                        }}
                        disabled={!preparedCode}
                        className="toolbar-btn tb-info"
                        style={{ fontWeight: 600 }}
                      />
                      {/* Export ▾ — collapses the three "send-stuff-out" actions
                          (GTree copy, GTree download, code copy) into a single
                          menu button. Cuts Tab 2's toolbar from 2 rows to 1. */}
                      <Button
                        label="Export"
                        icon="pi pi-share-alt"
                        size="small"
                        text
                        onClick={(e) => exportMenuRef.current?.toggle(e)}
                        aria-haspopup
                        aria-controls="tab2-export-menu"
                        className="toolbar-btn tb-neutral"
                      />
                      <Menu
                        id="tab2-export-menu"
                        ref={exportMenuRef}
                        popup
                        model={[
                          {
                            label: t.debugmanualgeneratorpanel1537 || 'GTree kopieren',
                            icon: 'pi pi-database',
                            disabled: !localStorage.getItem('scoriet_gtree'),
                            command: () => {
                              const gtreeData = localStorage.getItem('scoriet_gtree');
                              if (gtreeData) {
                                const jsonData = JSON.stringify(JSON.parse(gtreeData), null, 2);
                                const formattedGTree = `const gtree = ${jsonData};`;
                                if (navigator.clipboard && window.isSecureContext) {
                                  navigator.clipboard.writeText(formattedGTree).catch(() => copyToClipboardFallback(formattedGTree, t));
                                } else {
                                  copyToClipboardFallback(formattedGTree, t);
                                }
                              }
                            },
                          },
                          {
                            label: t.debugmanualgeneratorpanel1564 || 'GTree herunterladen',
                            icon: 'pi pi-download',
                            disabled: !localStorage.getItem('scoriet_gtree'),
                            command: () => {
                              const gtreeData = localStorage.getItem('scoriet_gtree');
                              if (gtreeData) {
                                try {
                                  const jsonData = JSON.stringify(JSON.parse(gtreeData), null, 2);
                                  const formattedGTree = `const gtree = ${jsonData};`;
                                  const blob = new Blob([formattedGTree], { type: 'application/javascript' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `gtree-${selectedProject?.name || 'export'}-${new Date().toISOString().split('T')[0]}.js`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                } catch {
                                  alert(t.debugmanualgeneratorpanel1583);
                                }
                              }
                            },
                          },
                          { separator: true },
                          {
                            label: t.debugmanualgeneratorpanel1591 || 'Code kopieren',
                            icon: 'pi pi-copy',
                            disabled: !preparedCode,
                            command: () => {
                              const codeText = preparedCode || '';
                              if (navigator.clipboard && window.isSecureContext) {
                                navigator.clipboard.writeText(codeText).catch(() => copyToClipboardFallback(codeText, t));
                              } else {
                                copyToClipboardFallback(codeText, t);
                              }
                            },
                          },
                        ]}
                      />

                      {/* Import ▾ — same idea for the two import paths. */}
                      <Button
                        label="Import"
                        icon="pi pi-cloud-upload"
                        size="small"
                        text
                        onClick={(e) => importMenuRef.current?.toggle(e)}
                        aria-haspopup
                        aria-controls="tab2-import-menu"
                        className="toolbar-btn tb-neutral"
                      />
                      <Menu
                        id="tab2-import-menu"
                        ref={importMenuRef}
                        popup
                        model={[
                          {
                            label: t.debugmanualgeneratorpanel2310 || 'GTree aus Datei',
                            icon: 'pi pi-upload',
                            command: () => {
                              const fileInput = document.createElement('input');
                              fileInput.type = 'file';
                              fileInput.accept = '.js,.json';
                              fileInput.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    try {
                                      let content = event.target?.result as string;
                                      if (content.includes('const gtree =')) {
                                        content = content.replace(/const\s+gtree\s*=\s*/, '').replace(/;?\s*$/, '');
                                      }
                                      const gtreeData = JSON.parse(content);
                                      if (!Array.isArray(gtreeData) || gtreeData.length === 0) {
                                        alert(t.debugmanualgeneratorpanel2336);
                                        return;
                                      }
                                      if (!gtreeData[0]?.project || !Array.isArray(gtreeData[0].project)) {
                                        alert(t.debugmanualgeneratorpanel2341);
                                        return;
                                      }
                                      localStorage.setItem('scoriet_gtree', JSON.stringify(gtreeData));
                                      alert(`${t.debugmanualgeneratorpanel2348}\n\n📊 Projekt: ${gtreeData[0].project[0]?.projectname || t.debugmanualgeneratorpanel2348_2}\n${t.debugmanualgeneratorpanel2348_3}${gtreeData[0].project[0]?.tables?.length || 0}`);
                                    } catch (error) {
                                      alert(`${t.debugmanualgeneratorpanel2351}\n\n${(error as Error).message}\n\n${t.debugmanualgeneratorpanel2351_2}`);
                                    }
                                  };
                                  reader.readAsText(file);
                                }
                              };
                              fileInput.click();
                            },
                          },
                          {
                            label: t.debugmanualgeneratorpanel2364 || 'GTree aus Zwischenablage',
                            icon: 'pi pi-paste',
                            command: () => setShowGTreeImportModal(true),
                          },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Code Editor with Line Numbers and Syntax Highlighting.
                      Height: flex-1 in the parent column (see Tab 0). */}
                  <div className="w-full border rounded code-editor-container flex-1 min-h-0" style={{overflow: 'auto', backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary}}>
                    <ErrorBoundary
                      fallback={
                        <div className="h-full flex items-center justify-center" style={{ backgroundColor: colors.bgSecondary, color: colors.textSecondary }}>
                          <div className="text-center">
                            <div className="text-4xl mb-2">⚠️</div>
                            <p>{t.debugmanualgeneratorpanel2402}</p>
                            <p className="text-sm" style={{ color: colors.textMuted }}>Use a simple textarea as a fallback.</p>
                          </div>
                        </div>
                      }
                    >
                      <LineNumbersCodeDisplay
                        code={preparedCode || `${t.debugmanualgeneratorpanel2410}"${t.debugmanualgeneratorpanel1369}"${t.debugmanualgeneratorpanel2410_2}`}
                        readOnly={!editorUnlocked}
                        onChange={(newCode) => setPreparedCode(newCode)}
                        colors={colors}
                        t={t}
                      />
                    </ErrorBoundary>
                  </div>

                  {/* Custom Syntax Highlighting Styles */}
                  <style>{`
                    .debug-manual-generator-panel .code-editor-container {
                      scrollbar-width: auto;
                      scrollbar-color: ${colors.borderPrimary} ${colors.bgSecondary};
                    }
                    .debug-manual-generator-panel .code-editor-container::-webkit-scrollbar {
                      width: 20px;
                      height: 20px;
                      -webkit-appearance: none;
                    }
                    .debug-manual-generator-panel .code-editor-container::-webkit-scrollbar-track {
                      background: ${colors.bgSecondary};
                      border-radius: 4px;
                    }
                    .debug-manual-generator-panel .code-editor-container::-webkit-scrollbar-thumb {
                      background: ${colors.borderPrimary};
                      border-radius: 6px;
                      border: 3px solid ${colors.bgSecondary};
                      min-height: 30px;
                    }
                    .debug-manual-generator-panel .code-editor-container::-webkit-scrollbar-thumb:hover {
                      background: ${colors.textMuted};
                    }
                    .debug-manual-generator-panel .code-editor-container::-webkit-scrollbar-corner {
                      background: ${colors.bgSecondary};
                    }
                    .debug-manual-generator-panel .code-editor {
                      caret-color: ${colors.textPrimary};
                      background-color: ${colors.bgSecondary} !important;
                    }
                    .debug-manual-generator-panel .code-editor textarea {
                      color: ${colors.textPrimary} !important;
                      background: transparent !important;
                      resize: none;
                      white-space: pre !important;
                      overflow-wrap: normal !important;
                      word-break: normal !important;
                      overflow-x: auto !important;
                    }
                    .debug-manual-generator-panel .code-editor pre {
                      background: transparent !important;
                      margin: 0;
                      white-space: pre !important;
                      overflow-wrap: normal !important;
                      word-break: normal !important;
                    }
                    /* Prism.js syntax highlighting for theme support */
                    .debug-manual-generator-panel .code-editor-container .token.comment,
                    .debug-manual-generator-panel .code-editor-container .token.prolog,
                    .debug-manual-generator-panel .code-editor-container .token.doctype,
                    .debug-manual-generator-panel .code-editor-container .token.cdata {
                      color: ${colors.textMuted} !important;
                    }
                    .debug-manual-generator-panel .code-editor-container .token.punctuation {
                      color: ${colors.textSecondary} !important;
                    }
                    .debug-manual-generator-panel .code-editor-container .token.property,
                    .debug-manual-generator-panel .code-editor-container .token.tag,
                    .debug-manual-generator-panel .code-editor-container .token.boolean,
                    .debug-manual-generator-panel .code-editor-container .token.number,
                    .debug-manual-generator-panel .code-editor-container .token.constant,
                    .debug-manual-generator-panel .code-editor-container .token.symbol,
                    .debug-manual-generator-panel .code-editor-container .token.deleted {
                      color: ${colors.errorText} !important;
                    }
                    .debug-manual-generator-panel .code-editor-container .token.selector,
                    .debug-manual-generator-panel .code-editor-container .token.attr-name,
                    .debug-manual-generator-panel .code-editor-container .token.string,
                    .debug-manual-generator-panel .code-editor-container .token.char,
                    .debug-manual-generator-panel .code-editor-container .token.builtin,
                    .debug-manual-generator-panel .code-editor-container .token.inserted {
                      color: ${colors.successText} !important;
                    }
                    .debug-manual-generator-panel .code-editor-container .token.operator,
                    .debug-manual-generator-panel .code-editor-container .token.entity,
                    .debug-manual-generator-panel .code-editor-container .token.url,
                    .debug-manual-generator-panel .code-editor-container .token.variable {
                      color: ${colors.warningText} !important;
                    }
                    .debug-manual-generator-panel .code-editor-container .token.atrule,
                    .debug-manual-generator-panel .code-editor-container .token.attr-value,
                    .debug-manual-generator-panel .code-editor-container .token.function,
                    .debug-manual-generator-panel .code-editor-container .token.class-name {
                      color: ${colors.infoText} !important;
                    }
                    .debug-manual-generator-panel .code-editor-container .token.keyword {
                      color: ${colors.accent} !important;
                    }
                    .debug-manual-generator-panel .code-editor-container .token.regex,
                    .debug-manual-generator-panel .code-editor-container .token.important {
                      color: ${colors.warningText} !important;
                    }
                    /* Line numbers styling */
                    .debug-manual-generator-panel .code-editor-container .line-numbers {
                      background-color: ${colors.bgTertiary} !important;
                      color: ${colors.textMuted} !important;
                      border-right: 1px solid ${colors.borderPrimary} !important;
                    }
                  `}</style>
                </div>
              </TabPanel>

              <TabPanel header={t.debugmanualgeneratorpanel1679} style={{ color: colors.textPrimary }}>
                <div className="rounded border flex-1 min-h-0 flex flex-col" style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary }}>
                  {/* Button Bar */}
                  <div className="flex justify-between items-center p-2 border-b" style={{ borderColor: colors.borderPrimary, backgroundColor: colors.bgSecondary }}>
                    <div className="text-sm" style={{ color: colors.textMuted }}>{t.debugmanualgeneratorpanel2526}</div>
                    {/* Tab 3 toolbar — text-style buttons for consistency with the
                        top toolbar and the other tabs' toolbars. (Code ausführen
                        lives in Tab 2's toolbar where the source JS is — Tab 3
                        only shows the result, no forward-action needed here.) */}
                    <div className="flex gap-1 flex-wrap">
                      <Button
                        label={t.debugmanualgeneratorpanel1591}
                        icon="pi pi-copy"
                        size="small"
                        text
                        onClick={() => {
                          const codeText = executedResult || '';
                          if (navigator.clipboard && window.isSecureContext) {
                            navigator.clipboard.writeText(codeText).catch(() => copyToClipboardFallback(codeText, t));
                          } else {
                            copyToClipboardFallback(codeText, t);
                          }
                        }}
                        disabled={!executedResult}
                        className="toolbar-btn tb-neutral"
                      />
                      <Button
                        label={t.debugmanualgeneratorpanel2550}
                        icon="pi pi-download"
                        size="small"
                        text
                        onClick={() => {
                          if (executedResult) {
                            try {
                              const blob = new Blob([executedResult], { type: t.codegenerationpanel300 });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = downloadFilename;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            } catch {
                              alert(t.debugmanualgeneratorpanel1724);
                            }
                          }
                        }}
                        disabled={!executedResult}
                        className="toolbar-btn tb-success"
                      />
                    </div>
                  </div>

                  {/* Code Display with Line Numbers — flex-1 fill of parent. */}
                  <div className="flex-1 min-h-0 overflow-auto">
                    {executedResult ? (
                      <table className="w-full border-collapse" style={{ fontFamily: '"Courier New", "Consolas", "Monaco", "Lucida Console", monospace', fontSize: '0.875rem', lineHeight: 1.4 }}>
                        <tbody>
                          {executedResult.split('\n').map((line, idx) => (
                            <tr key={idx} className="hover:opacity-80" style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : `${colors.bgSecondary}44` }}>
                              <td
                                className="select-none text-right px-3 py-0"
                                style={{
                                  color: colors.textMuted,
                                  borderRight: `1px solid ${colors.borderPrimary}`,
                                  minWidth: '3.5rem',
                                  userSelect: 'none',
                                  verticalAlign: 'top',
                                }}
                              >
                                {idx + 1}
                              </td>
                              <td
                                className="pl-3 pr-4 py-0 whitespace-pre-wrap"
                                style={{ color: colors.textPrimary, wordBreak: 'break-all' }}
                              >
                                {line || '\u00A0'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-4 text-sm font-mono" style={{ color: colors.textPrimary }}>
                        {`${t.debugmanualgeneratorpanel2587}"${t.debugmanualgeneratorpanel1377}"${t.debugmanualgeneratorpanel2587_2}`}
                      </div>
                    )}
                  </div>
                </div>
              </TabPanel>

              <TabPanel header={t.debugmanualgeneratorpanel1750} style={{ color: colors.textPrimary }}>
                <div className="p-4 rounded border flex-1 min-h-0 overflow-auto" style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary }}>
                  <div
                    className="text-sm whitespace-pre-wrap font-mono"
                    style={{
                      fontFamily: '"Courier New", "Consolas", "Monaco", "Lucida Console", monospace',
                      color: colors.textPrimary,
                      lineHeight: 1.4
                    }}
                  >
                    {debugInfo || `${t.debugmanualgeneratorpanel2603}"${t.debugmanualgeneratorpanel1385}"${t.debugmanualgeneratorpanel2603_2}`}
                  </div>
                </div>
              </TabPanel>
              </TabView>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Save Raw Template Confirm Dialog — a destructive write-back to the
          stored template file. The Save button on Tab 0 opens this rather
          than firing the PUT directly so a fat-finger click can't replace
          a production template with whatever happens to be in the editor. */}
      <Dialog
        header={t.debugmanualgeneratorpanel_save_confirm_title || 'Save to Template File'}
        visible={showSaveConfirmDialog}
        style={{ width: '480px' }}
        modal
        onHide={() => setShowSaveConfirmDialog(false)}
        pt={{
          root: { style: { backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary } },
          header: { style: { backgroundColor: colors.dialogHeader, color: colors.textPrimary, borderBottom: `1px solid ${colors.borderPrimary}` } },
          content: { style: { backgroundColor: colors.bgSecondary, color: colors.textPrimary } },
          footer: { style: { backgroundColor: colors.bgSecondary, borderTop: `1px solid ${colors.borderPrimary}` } },
        }}
        footer={
          <div>
            <Button
              label={t.debugmanualgeneratorpanel2632 /* "Cancel" */}
              icon="pi pi-times"
              onClick={() => setShowSaveConfirmDialog(false)}
              className="p-button-text"
              style={{ color: colors.textSecondary }}
              disabled={rawTemplateLoading}
            />
            <Button
              label={t.debugmanualgeneratorpanel_btn_save_template || 'Save'}
              icon={rawTemplateLoading ? 'pi pi-spinner pi-spin' : 'pi pi-save'}
              onClick={saveRawTemplate}
              style={{ backgroundColor: colors.successText, color: colors.textInverse }}
              disabled={rawTemplateLoading}
            />
          </div>
        }
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <i className="pi pi-exclamation-triangle text-2xl" style={{ color: colors.warningText }} />
            <div className="text-sm" style={{ color: colors.textPrimary }}>
              {t.debugmanualgeneratorpanel_save_confirm_msg
                || 'This will overwrite the stored template file in the database with the editor contents. Continue?'}
            </div>
          </div>
        </div>
      </Dialog>

      {/* ─── Profile "Save As..." Dialog ───────────────────────────────────
          Opens from the Save-as button in the header. Captures a snapshot of
          the current selection under a user-provided name. We don't enforce
          unique names — duplicates are the user's problem to manage. */}
      <Dialog
        header="Aktuelles Setup als Profil speichern"
        visible={showSaveAsDialog}
        style={{ width: '480px' }}
        modal
        onHide={() => setShowSaveAsDialog(false)}
        pt={{
          root: { style: { backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary } },
          header: { style: { backgroundColor: colors.dialogHeader, color: colors.textPrimary, borderBottom: `1px solid ${colors.borderPrimary}` } },
          content: { style: { backgroundColor: colors.bgSecondary, color: colors.textPrimary } },
          footer: { style: { backgroundColor: colors.bgSecondary, borderTop: `1px solid ${colors.borderPrimary}` } },
        }}
        footer={
          <div>
            <Button
              label="Abbrechen"
              icon="pi pi-times"
              onClick={() => {
                // If this dialog was opened from the save-before-commit prompt,
                // honor the original intent (collapse + fetch) even if the user
                // cancels the save. Otherwise they'd have to click "Code Template
                // holen" again, which is confusing UX.
                if (proceedAfterSaveAsRef.current) {
                  proceedAfterSaveAsRef.current = false;
                  setHeaderCollapsed(true);
                  setPendingFetchAfterCommitFlow(true);
                }
                setShowSaveAsDialog(false);
              }}
              className="p-button-text"
              style={{ color: colors.textSecondary }}
            />
            <Button
              label={existingProfileForCurrentName ? `"${existingProfileForCurrentName.name}" aktualisieren` : 'Speichern'}
              icon={existingProfileForCurrentName ? 'pi pi-refresh' : 'pi pi-save'}
              onClick={saveCurrentAsProfile}
              disabled={!newProfileName.trim()}
              style={{
                backgroundColor: existingProfileForCurrentName ? colors.warningText : colors.successText,
                color: colors.textInverse,
              }}
            />
          </div>
        }
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Profil-Name *
            </label>
            <InputText
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="z.B. Migration-Test, Model-Generierung..."
              className="w-full"
              autoFocus
            />
            {/* Same-name detection → overwrite hint. Color matches the
                "warning" tone of the action button so the link between this
                hint and that button is obvious. */}
            {existingProfileForCurrentName && (
              <div className="mt-2 text-xs flex items-start gap-2 p-2 rounded" style={{
                color: colors.warningText,
                backgroundColor: colors.warningText + '15',
                border: `1px solid ${colors.warningText}40`,
              }}>
                <i className="pi pi-exclamation-triangle mt-0.5" />
                <span>
                  Ein Profil mit diesem Namen existiert bereits. Beim Klick auf
                  „Aktualisieren" wird es mit deinem aktuellen Setup
                  überschrieben.
                </span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Beschreibung (optional)
            </label>
            <InputText
              value={newProfileDescription}
              onChange={(e) => setNewProfileDescription(e.target.value)}
              placeholder="Was speichert dieses Profil?"
              className="w-full"
            />
          </div>
          <div className="text-xs p-3 rounded" style={{
            color: colors.textSecondary,
            backgroundColor: colors.bgTertiary,
            border: `1px solid ${colors.borderPrimary}`,
          }}>
            <div className="font-medium mb-1" style={{ color: colors.textPrimary }}>Wird gespeichert:</div>
            <div>• Template + Datei + Tabelle/DB-Version + Migration</div>
            <div>• Projekt + Sprache</div>
            <div>• Optionen (Source-include, Cache-Skip)</div>
          </div>
        </div>
      </Dialog>

      {/* ─── Profile "Verwalten" Dialog ────────────────────────────────────
          Rename + delete existing profiles. Rename is in-place; delete is
          immediate (no second confirmation — accidentally deleted profiles
          can just be re-created, and the modal already implies destructive
          intent by being a "manage" screen). */}
      <Dialog
        header="Profile verwalten"
        visible={showManageProfilesDialog}
        style={{ width: '640px' }}
        modal
        onHide={() => {
          setShowManageProfilesDialog(false);
          setEditingProfileId(null);
          setEditingProfileName('');
        }}
        pt={{
          root: { style: { backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary } },
          header: { style: { backgroundColor: colors.dialogHeader, color: colors.textPrimary, borderBottom: `1px solid ${colors.borderPrimary}` } },
          content: { style: { backgroundColor: colors.bgSecondary, color: colors.textPrimary } },
          footer: { style: { backgroundColor: colors.bgSecondary, borderTop: `1px solid ${colors.borderPrimary}` } },
        }}
        footer={
          <div>
            <Button
              label="Schließen"
              icon="pi pi-times"
              onClick={() => {
                setShowManageProfilesDialog(false);
                setEditingProfileId(null);
                setEditingProfileName('');
              }}
              className="p-button-text"
              style={{ color: colors.textSecondary }}
            />
          </div>
        }
      >
        <div className="p-4">
          {profiles.length === 0 ? (
            <div className="text-sm text-center py-8" style={{ color: colors.textMuted }}>
              Keine Profile vorhanden.<br />
              Speichere zuerst ein Profil über „Speichern als…".
            </div>
          ) : (
            <div className="space-y-2">
              {profiles
                .slice()
                .sort((a, b) => (b.lastUsed || '').localeCompare(a.lastUsed || ''))
                .map(p => {
                  const isEditing = editingProfileId === p.id;
                  const lastUsedDate = p.lastUsed ? new Date(p.lastUsed) : null;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 p-2 rounded"
                      style={{
                        backgroundColor: colors.bgTertiary,
                        border: `1px solid ${colors.borderPrimary}`,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <InputText
                            value={editingProfileName}
                            onChange={(e) => setEditingProfileName(e.target.value)}
                            className="w-full"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                renameProfile(p.id, editingProfileName);
                                setEditingProfileId(null);
                                setEditingProfileName('');
                              } else if (e.key === 'Escape') {
                                setEditingProfileId(null);
                                setEditingProfileName('');
                              }
                            }}
                          />
                        ) : (
                          <>
                            <div className="font-medium truncate" style={{ color: colors.textPrimary }}>
                              {p.name}
                              {activeProfileId === p.id && (
                                <span className="ml-2 text-xs" style={{ color: colors.successText }}>● aktiv</span>
                              )}
                            </div>
                            {p.description && (
                              <div className="text-xs truncate" style={{ color: colors.textSecondary }}>
                                {p.description}
                              </div>
                            )}
                            <div className="text-xs" style={{ color: colors.textMuted }}>
                              Zuletzt: {lastUsedDate ? lastUsedDate.toLocaleString() : '—'}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isEditing ? (
                          <>
                            <Button
                              icon="pi pi-check"
                              size="small"
                              onClick={() => {
                                renameProfile(p.id, editingProfileName);
                                setEditingProfileId(null);
                                setEditingProfileName('');
                              }}
                              style={{ backgroundColor: colors.successText, color: colors.textInverse }}
                            />
                            <Button
                              icon="pi pi-times"
                              size="small"
                              outlined
                              onClick={() => {
                                setEditingProfileId(null);
                                setEditingProfileName('');
                              }}
                              style={{ borderColor: colors.borderPrimary, color: colors.textSecondary }}
                            />
                          </>
                        ) : (
                          <>
                            <Button
                              icon="pi pi-pencil"
                              size="small"
                              outlined
                              onClick={() => {
                                setEditingProfileId(p.id);
                                setEditingProfileName(p.name);
                              }}
                              title="Umbenennen"
                              style={{ borderColor: colors.borderPrimary, color: colors.textSecondary }}
                            />
                            <Button
                              icon="pi pi-trash"
                              size="small"
                              outlined
                              onClick={() => deleteProfile(p.id)}
                              title="Löschen"
                              style={{ borderColor: colors.errorText, color: colors.errorText }}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </Dialog>

      {/* ─── "Save before commit" prompt dialog ─────────────────────────
          Fires from requestCommit when no profile is loaded and the user
          hasn't opted out for this session. Three exit paths:
            • "Speichern als…" → opens save-as dialog, sets the proceed-after
              ref so we continue with collapse + fetch once save completes
              (handled in saveCurrentAsProfile).
            • "Nein, weiter" → collapse + fetch immediately, no save.
            • "Nicht mehr fragen" → same as Nein but flips the session ref so
              future commits skip the prompt entirely.
          All three paths result in the same end state (header collapsed,
          fetchRawTemplate called) — only the side-effect on profiles +
          dontAsk ref differs. */}
      <Dialog
        header="Konfiguration als Profil speichern?"
        visible={showSaveBeforeCommitPrompt}
        style={{ width: '520px' }}
        modal
        onHide={() => setShowSaveBeforeCommitPrompt(false)}
        pt={{
          root: { style: { backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary } },
          header: { style: { backgroundColor: colors.dialogHeader, color: colors.textPrimary, borderBottom: `1px solid ${colors.borderPrimary}` } },
          content: { style: { backgroundColor: colors.bgSecondary, color: colors.textPrimary } },
          footer: { style: { backgroundColor: colors.bgSecondary, borderTop: `1px solid ${colors.borderPrimary}` } },
        }}
      >
        <div className="p-4 space-y-4">
          <div className="text-sm" style={{ color: colors.textPrimary }}>
            Du holst gleich das Template ab. Möchtest du diese Konfiguration
            (Template, DB, Version, Sprache …) zuerst als Profil speichern?
          </div>
          <div className="text-xs p-3 rounded" style={{
            color: colors.textSecondary,
            backgroundColor: colors.bgTertiary,
            border: `1px solid ${colors.borderPrimary}`,
          }}>
            💡 Tipp: Mit einem Profil kannst du dieses Setup später jederzeit
            mit einem Klick wiederherstellen.
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              label="Ja, als Profil speichern…"
              icon="pi pi-save"
              onClick={() => {
                setShowSaveBeforeCommitPrompt(false);
                proceedAfterSaveAsRef.current = true;
                setNewProfileName('');
                setNewProfileDescription('');
                setShowSaveAsDialog(true);
              }}
              style={{ backgroundColor: colors.successText, color: colors.textInverse }}
            />
            <Button
              label="Nein, jetzt nicht"
              icon="pi pi-arrow-right"
              onClick={() => {
                setShowSaveBeforeCommitPrompt(false);
                setHeaderCollapsed(true);
                setPendingFetchAfterCommitFlow(true);
              }}
              outlined
              style={{ borderColor: colors.borderPrimary, color: colors.textSecondary }}
            />
            <Button
              label="Diese Sitzung nicht mehr fragen"
              icon="pi pi-eye-slash"
              onClick={() => {
                dontAskSaveBeforeCommitRef.current = true;
                setShowSaveBeforeCommitPrompt(false);
                setHeaderCollapsed(true);
                setPendingFetchAfterCommitFlow(true);
              }}
              text
              size="small"
              style={{ color: colors.textMuted }}
            />
          </div>
        </div>
      </Dialog>

      {/* GTree Import Modal */}
      <Dialog
        header={t.debugmanualgeneratorpanel2616}
        visible={showGTreeImportModal}
        style={{ width: '50vw' }}
        onHide={() => {
          setShowGTreeImportModal(false);
          setGtreeImportText('');
        }}
        pt={{
          root: { style: { backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary } },
          header: { style: { backgroundColor: colors.dialogHeader, color: colors.textPrimary, borderBottom: `1px solid ${colors.borderPrimary}` } },
          content: { style: { backgroundColor: colors.bgSecondary, color: colors.textPrimary } },
          footer: { style: { backgroundColor: colors.bgSecondary, borderTop: `1px solid ${colors.borderPrimary}` } }
        }}
        footer={
          <div>
            <Button
              label={t.debugmanualgeneratorpanel2632}
              icon="pi pi-times"
              onClick={() => {
                setShowGTreeImportModal(false);
                setGtreeImportText('');
              }}
              className="p-button-text"
              style={{ color: colors.textSecondary }}
            />
            <Button
              label={t.debugmanualgeneratorpanel2642}
              icon="pi pi-check"
              onClick={handleGTreeImportFromText}
              disabled={!gtreeImportText.trim()}
              style={{ backgroundColor: colors.buttonPrimary, color: colors.textInverse }}
            />
          </div>
        }
      >
        <div className="mb-3">
          <p className="mb-2" style={{ color: colors.textSecondary }}>
            {t.debugmanualgeneratorpanel2653}
          </p>
          <InputTextarea
            value={gtreeImportText}
            onChange={(e) => setGtreeImportText(e.target.value)}
            rows={20}
            className="w-full font-mono text-sm"
            placeholder={`Beispiel:\n[\n  {\n    "project": [\n      {\n        "projectname": "MyProject",\n        "tables": [...]\n      }\n    ]\n  }\n]`}
            autoFocus
            style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
          />
          <p className="text-xs mt-2" style={{ color: colors.textMuted }}>
            {t.debugmanualgeneratorpanel2665}"const gtree = "{t.debugmanualgeneratorpanel2665_2}
          </p>
        </div>
      </Dialog>

      {/* Theme CSS for PrimeReact Components */}
      <style>{`
        /* Dropdown Styling */
        .debug-manual-generator-panel .p-dropdown {
          background-color: ${colors.bgTertiary} !important;
          border-color: ${colors.borderPrimary} !important;
          color: ${colors.textPrimary} !important;
        }
        .debug-manual-generator-panel .p-dropdown:not(.p-disabled):hover {
          border-color: ${colors.accent} !important;
        }
        .debug-manual-generator-panel .p-dropdown .p-dropdown-label {
          color: ${colors.textPrimary} !important;
        }
        .debug-manual-generator-panel .p-dropdown .p-dropdown-trigger {
          color: ${colors.textSecondary} !important;
        }
        .debug-manual-generator-panel .p-dropdown-panel {
          background-color: ${colors.bgSecondary} !important;
          border-color: ${colors.borderPrimary} !important;
        }
        .debug-manual-generator-panel .p-dropdown-items .p-dropdown-item {
          color: ${colors.textPrimary} !important;
        }
        .debug-manual-generator-panel .p-dropdown-items .p-dropdown-item:hover {
          background-color: ${colors.bgTertiary} !important;
        }
        .debug-manual-generator-panel .p-dropdown-items .p-dropdown-item.p-highlight {
          background-color: ${colors.accent} !important;
          color: ${colors.textInverse} !important;
        }
        .debug-manual-generator-panel .p-dropdown .p-dropdown-label.p-placeholder {
          color: ${colors.textMuted} !important;
        }

        /* Card Styling */
        .debug-manual-generator-panel .p-card {
          background-color: ${colors.bgSecondary} !important;
          border-color: ${colors.borderPrimary} !important;
        }
        .debug-manual-generator-panel .p-card .p-card-content {
          color: ${colors.textPrimary} !important;
        }

        /* TabView Styling */
        .debug-manual-generator-panel .themed-tabview .p-tabview-nav {
          background-color: ${colors.bgSecondary} !important;
          border-color: ${colors.borderPrimary} !important;
        }
        .debug-manual-generator-panel .themed-tabview .p-tabview-nav li .p-tabview-nav-link {
          background-color: transparent !important;
          color: ${colors.textSecondary} !important;
          border-color: transparent !important;
        }
        .debug-manual-generator-panel .themed-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link {
          background-color: ${colors.bgTertiary} !important;
          color: ${colors.accent} !important;
          border-color: ${colors.accent} !important;
        }
        .debug-manual-generator-panel .themed-tabview .p-tabview-nav li:not(.p-highlight):not(.p-disabled):hover .p-tabview-nav-link {
          background-color: ${colors.bgTertiary} !important;
          color: ${colors.textPrimary} !important;
        }
        .debug-manual-generator-panel .themed-tabview .p-tabview-panels {
          background-color: ${colors.bgSecondary} !important;
          color: ${colors.textPrimary} !important;
        }

        /* TabView flex-fill: PrimeReact renders three nested wrappers
           (.p-tabview → contains .p-tabview-nav-container + .p-tabview-panels).
           To let the active tab panel grow to fill the parent we need:
           - the root .p-tabview to be a flex column filling parent
           - .p-tabview-panels to take the remaining space after the nav header
           - .p-tabview-panel (the active panel content) to fill that space
           Without this the panels collapse to their content height and the
           code editor at the bottom can't claim flex-1 of anything. */
        .debug-manual-generator-panel .themed-tabview-flex {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
        }
        .debug-manual-generator-panel .themed-tabview-flex .p-tabview-panels {
          flex: 1 1 auto;
          min-height: 0;
          display: flex;
          flex-direction: column;
          padding: 0.75rem !important;
        }
        .debug-manual-generator-panel .themed-tabview-flex .p-tabview-panel {
          flex: 1 1 auto;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        /* Button Styling */
        .debug-manual-generator-panel .p-button.p-button-outlined {
          color: ${colors.textSecondary} !important;
          border-color: ${colors.borderPrimary} !important;
        }
        .debug-manual-generator-panel .p-button.p-button-outlined:hover {
          background-color: ${colors.bgTertiary} !important;
          color: ${colors.textPrimary} !important;
        }

        /* Toolbar-button look. Two competing rules from elsewhere in the app
           force a blue background on .p-button-text — we have to out-specify
           BOTH to win:
             (1) app.css:364: .p-button { background: ... !important; }     [0,1,0]
             (2) styles.css:1573: .p-button.p-button-text:not(.landing-lang-selector):not(.landing-header-btn):not(.landing-social-btn) {
                   background: ... !important;
                 }                                                          [0,5,0]
           Rule 2 is the killer. To beat it we match the same :not chain
           PLUS add our own classes, giving us [0,7,0]. The :not arguments
           are dummy classes that no button ever has — purely a specificity
           hack, but it is the cleanest way without resorting to IDs. */
        .debug-manual-generator-panel .p-button.toolbar-btn:not(.landing-lang-selector):not(.landing-header-btn):not(.landing-social-btn),
        .debug-manual-generator-panel .p-button.p-button-text.toolbar-btn:not(.landing-lang-selector):not(.landing-header-btn):not(.landing-social-btn) {
          background: transparent !important;
          background-color: transparent !important;
          border: 1px solid transparent !important;
          padding: 0.35rem 0.7rem !important;
          font-size: 0.875rem !important;
          transition: background-color 120ms ease, border-color 120ms ease;
        }
        .debug-manual-generator-panel .p-button.toolbar-btn:not(.landing-lang-selector):not(.landing-header-btn):not(.landing-social-btn):not(:disabled):hover,
        .debug-manual-generator-panel .p-button.p-button-text.toolbar-btn:not(.landing-lang-selector):not(.landing-header-btn):not(.landing-social-btn):not(:disabled):hover {
          background: ${colors.bgPrimary} !important;
          background-color: ${colors.bgPrimary} !important;
          border-color: ${colors.borderPrimary} !important;
        }
        .debug-manual-generator-panel .p-button.toolbar-btn:disabled,
        .debug-manual-generator-panel .p-button.p-button-text.toolbar-btn:disabled {
          opacity: 0.4 !important;
        }
        /* Color modifiers — only the text/icon color, no background. Higher
           specificity than the global .p-button.p-button-text rule so our
           color wins regardless of inline style. */
        .debug-manual-generator-panel .p-button.toolbar-btn.tb-warning,
        .debug-manual-generator-panel .p-button.toolbar-btn.tb-warning .p-button-icon,
        .debug-manual-generator-panel .p-button.toolbar-btn.tb-warning .p-button-label {
          color: ${colors.warningText} !important;
        }
        .debug-manual-generator-panel .p-button.toolbar-btn.tb-info,
        .debug-manual-generator-panel .p-button.toolbar-btn.tb-info .p-button-icon,
        .debug-manual-generator-panel .p-button.toolbar-btn.tb-info .p-button-label {
          color: ${colors.infoText} !important;
        }
        .debug-manual-generator-panel .p-button.toolbar-btn.tb-success,
        .debug-manual-generator-panel .p-button.toolbar-btn.tb-success .p-button-icon,
        .debug-manual-generator-panel .p-button.toolbar-btn.tb-success .p-button-label {
          color: ${colors.successText} !important;
        }
        .debug-manual-generator-panel .p-button.toolbar-btn.tb-error,
        .debug-manual-generator-panel .p-button.toolbar-btn.tb-error .p-button-icon,
        .debug-manual-generator-panel .p-button.toolbar-btn.tb-error .p-button-label {
          color: ${colors.errorText} !important;
        }
        .debug-manual-generator-panel .p-button.toolbar-btn.tb-neutral,
        .debug-manual-generator-panel .p-button.toolbar-btn.tb-neutral .p-button-icon,
        .debug-manual-generator-panel .p-button.toolbar-btn.tb-neutral .p-button-label {
          color: ${colors.textPrimary} !important;
        }

        /* InputTextarea in Dialog */
        .p-dialog .p-inputtextarea {
          background-color: ${colors.bgTertiary} !important;
          color: ${colors.textPrimary} !important;
          border-color: ${colors.borderPrimary} !important;
        }
        .p-dialog .p-inputtextarea:focus {
          border-color: ${colors.accent} !important;
          box-shadow: 0 0 0 1px ${colors.accent} !important;
        }
        .p-dialog .p-inputtextarea::placeholder {
          color: ${colors.textMuted} !important;
          opacity: 0.7;
        }

        /* Code Editor Theme Styling */
        .debug-manual-generator-panel .code-editor-container .line-numbers-container {
          background-color: ${colors.bgTertiary} !important;
          color: ${colors.textPrimary} !important;
        }
        .debug-manual-generator-panel .code-editor-container .line-numbers {
          background-color: ${colors.bgSecondary} !important;
          color: ${colors.textMuted} !important;
          border-right: 1px solid ${colors.borderPrimary} !important;
        }
        .debug-manual-generator-panel .code-editor-container .code-editor {
          background-color: ${colors.bgTertiary} !important;
          color: ${colors.textPrimary} !important;
        }
        .debug-manual-generator-panel .code-editor-container .code-editor textarea {
          color: ${colors.textPrimary} !important;
          caret-color: ${colors.textPrimary} !important;
        }
        .debug-manual-generator-panel .code-editor-container .code-editor pre {
          color: ${colors.textPrimary} !important;
        }
        /* Prism.js syntax highlighting overrides for light theme */
        .debug-manual-generator-panel .code-editor-container .token.comment,
        .debug-manual-generator-panel .code-editor-container .token.prolog,
        .debug-manual-generator-panel .code-editor-container .token.doctype,
        .debug-manual-generator-panel .code-editor-container .token.cdata {
          color: ${colors.textMuted} !important;
        }
        .debug-manual-generator-panel .code-editor-container .token.punctuation {
          color: ${colors.textSecondary} !important;
        }
        .debug-manual-generator-panel .code-editor-container .token.property,
        .debug-manual-generator-panel .code-editor-container .token.tag,
        .debug-manual-generator-panel .code-editor-container .token.boolean,
        .debug-manual-generator-panel .code-editor-container .token.number,
        .debug-manual-generator-panel .code-editor-container .token.constant,
        .debug-manual-generator-panel .code-editor-container .token.symbol {
          color: ${colors.errorText} !important;
        }
        .debug-manual-generator-panel .code-editor-container .token.selector,
        .debug-manual-generator-panel .code-editor-container .token.attr-name,
        .debug-manual-generator-panel .code-editor-container .token.string,
        .debug-manual-generator-panel .code-editor-container .token.char,
        .debug-manual-generator-panel .code-editor-container .token.builtin {
          color: ${colors.successText} !important;
        }
        .debug-manual-generator-panel .code-editor-container .token.operator,
        .debug-manual-generator-panel .code-editor-container .token.entity,
        .debug-manual-generator-panel .code-editor-container .token.url,
        .debug-manual-generator-panel .code-editor-container .token.variable {
          color: ${colors.warningText} !important;
        }
        .debug-manual-generator-panel .code-editor-container .token.atrule,
        .debug-manual-generator-panel .code-editor-container .token.attr-value,
        .debug-manual-generator-panel .code-editor-container .token.keyword {
          color: ${colors.infoText} !important;
        }
        .debug-manual-generator-panel .code-editor-container .token.function {
          color: ${colors.accent} !important;
        }
        .debug-manual-generator-panel .code-editor-container .token.regex,
        .debug-manual-generator-panel .code-editor-container .token.important {
          color: ${colors.warningText} !important;
        }
      `}</style>
    </ErrorBoundary>
  );
}