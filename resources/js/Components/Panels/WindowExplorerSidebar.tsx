// resources/js/Components/Panels/WindowExplorerSidebar.tsx
// VS Code-style Explorer tree embedded directly in the Window Designer
// (categories + windows, drag & drop, CRUD). Selecting a window notifies the
// parent (WindowDesignerPanel) instead of opening a separate panel/tab —
// there is no more standalone "Window Management" panel.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tree } from 'primereact/tree';
import { TreeNode } from 'primereact/treenode';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';
import { Dialog } from 'primereact/dialog';
import { confirmDialog } from 'primereact/confirmdialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { useToast } from '@/contexts/ToastContext';
import { useProject } from '@/contexts/ProjectContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { apiClient } from '@/lib/api';

interface WindowCategory {
    id: number;
    project_id: number;
    parent_id: number | null;
    name: string;
    sort_order: number;
}

interface WindowRow {
    id: number;
    project_id: number;
    category_id: number | null;
    name: string;
    display_name?: string | null;
    sort_order: number;
    // The ONE window (at most, per project) a generated app launches
    // directly into instead of a menu/demo screen — see
    // WindowDesignerController::setFirstWindow().
    is_first_window?: boolean;
}

interface WindowExplorerSidebarProps {
    activeWindowId: number | null;
    onSelectWindow: (id: number) => void;
    // Lets the Designer refresh/clear its own state when the window it has
    // open is renamed or deleted from the tree (two independent copies of
    // the window's metadata otherwise: the tree's list vs. the Designer's
    // loaded row).
    onActiveWindowRenamed?: (id: number) => void;
    onActiveWindowDeleted?: (id: number) => void;
    isPinned: boolean;
    onTogglePinned: () => void;
}

// A window name becomes part of generated file paths, so it must be a
// machine-safe identifier: lowercase letters, digits and underscore only.
// Sanitised as the user types (auto-lowercasing instead of rejecting).
const sanitizeWindowName = (raw: string): string => {
    let out = '';
    for (const ch of raw.toLowerCase()) {
        const isLower = ch >= 'a' && ch <= 'z';
        const isDigit = ch >= '0' && ch <= '9';
        if (isLower || isDigit || ch === '_') {
            out += ch;
        }
    }
    return out;
};

// Reads a File as text, auto-detecting UTF-16 in addition to the UTF-8 that
// the browser's own File.text()/Blob.text() is hardcoded to (per spec it
// always runs the UTF-8 decode algorithm, with no encoding sniffing at all).
// WinDev export tooling on Windows commonly writes UTF-16LE - sometimes with
// a BOM, sometimes without one (PowerShell's default text encoding on many
// setups) - which File.text() would silently mis-decode into null-byte
// garbage that then fails JSON.parse with an unhelpful "not valid JSON",
// even though the file is perfectly valid JSON in its own encoding (exactly
// why external validators that DO sniff encoding disagreed with the import
// here). BOM-less UTF-16LE detection is a heuristic (no BOM to look at), but
// a safe one for JSON specifically: valid UTF-8 JSON can never contain a raw
// NUL byte, while ASCII-range UTF-16LE text has a NUL every other byte.
async function readFileTextWithEncodingDetection(file: File): Promise<string> {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
        return new TextDecoder('utf-8').decode(bytes.subarray(3));
    }
    if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
        return new TextDecoder('utf-16le').decode(bytes.subarray(2));
    }
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
        return new TextDecoder('utf-16be').decode(bytes.subarray(2));
    }
    if (bytes.length >= 4 && bytes[0] !== 0x00 && bytes[1] === 0x00 && bytes[3] === 0x00) {
        return new TextDecoder('utf-16le').decode(bytes);
    }
    return new TextDecoder('utf-8').decode(bytes);
}

type NodeData = { nodeType: 'category'; id: number } | { nodeType: 'window'; id: number };

interface ImportStats {
    windows_imported: number;
    windows_overwritten: number;
    windows_skipped: string[];
    elements_imported: number;
    controls_imported: number;
    menus_imported: number;
    unmapped_types: { window: string; control: string; type: number }[];
    unresolved_parents: { window: string; control: string; parent_control: string }[];
}

interface ImportConflict {
    rawName: string;
    caption: string;
    action: 'skip' | 'overwrite';
}

interface SmlImportStats {
    files_processed: number;
    windows_matched: number;
    events_imported: number;
    warnings: string[];
}

const WindowExplorerSidebar: React.FC<WindowExplorerSidebarProps> = ({
    activeWindowId,
    onSelectWindow,
    onActiveWindowRenamed,
    onActiveWindowDeleted,
    isPinned,
    onTogglePinned,
}) => {
    const { selectedProject } = useProject();
    const toast = useToast();
    const { colors } = useTheme();
    const [currentLanguage] = useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);

    const [categories, setCategories] = useState<WindowCategory[]>([]);
    const [windows, setWindows] = useState<WindowRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

    const contextMenuRef = useRef<Menu>(null);
    const [contextNode, setContextNode] = useState<NodeData | null>(null);

    const [categoryDialogVisible, setCategoryDialogVisible] = useState(false);
    const [categoryDialogParentId, setCategoryDialogParentId] = useState<number | null>(null);
    const [categoryDialogEditId, setCategoryDialogEditId] = useState<number | null>(null);
    const [categoryNameInput, setCategoryNameInput] = useState('');

    const [windowDialogVisible, setWindowDialogVisible] = useState(false);
    const [windowDialogCategoryId, setWindowDialogCategoryId] = useState<number | null>(null);
    const [windowDialogEditId, setWindowDialogEditId] = useState<number | null>(null);
    const [windowNameInput, setWindowNameInput] = useState('');
    const [windowDisplayNameInput, setWindowDisplayNameInput] = useState('');
    const [windowNameError, setWindowNameError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // ===== WinDev import =====
    const importInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const [importStats, setImportStats] = useState<ImportStats | null>(null);
    const [importSummaryVisible, setImportSummaryVisible] = useState(false);
    const [pendingImportWindows, setPendingImportWindows] = useState<any[]>([]);
    const [importConflicts, setImportConflicts] = useState<ImportConflict[]>([]);
    const [importConflictDialogVisible, setImportConflictDialogVisible] = useState(false);

    // ===== SML code-behind import =====
    const smlImportInputRef = useRef<HTMLInputElement>(null);
    const [smlImporting, setSmlImporting] = useState(false);
    const [smlImportStats, setSmlImportStats] = useState<SmlImportStats | null>(null);
    const [smlImportSummaryVisible, setSmlImportSummaryVisible] = useState(false);

    const loadData = useCallback(async () => {
        if (!selectedProject) {
            setCategories([]);
            setWindows([]);
            return;
        }
        setLoading(true);
        try {
            const [catRes, winRes] = await Promise.all([
                apiClient.get(`/projects/${selectedProject.id}/window-categories`),
                apiClient.get(`/projects/${selectedProject.id}/windows`),
            ]);
            setCategories(catRes.data || []);
            setWindows(winRes.data || []);
        } catch (error) {
            console.error(error);
            toast.showError(t.windowmanagementpanel_load_error || 'Failed to load windows');
        } finally {
            setLoading(false);
        }
    }, [selectedProject?.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Cross-component refresh: the Designer's own top-bar "Delete Window"
    // action removes a window without going through this sidebar's local
    // state, so it announces the change instead (same pattern used
    // elsewhere in the app, e.g. FormSetManagementPanel's 'formSetsChanged').
    useEffect(() => {
        const handler = () => loadData();
        window.addEventListener('windowsChanged', handler);
        return () => window.removeEventListener('windowsChanged', handler);
    }, [loadData]);

    const runImport = async (windowsArray: any[], decisions: Record<string, 'overwrite' | 'skip'>) => {
        if (!selectedProject) return;
        setImporting(true);
        try {
            const res = await apiClient.post(`/projects/${selectedProject.id}/windows/import-windev`, { windows: windowsArray, decisions });
            setImportStats(res.data);
            setImportSummaryVisible(true);
            toast.showSuccess(t.windowmanagementpanel_import_success || 'Import complete');
            window.dispatchEvent(new CustomEvent('windowsChanged'));
            await loadData();
            // The window currently open in the Designer may be one of the
            // ones this import just overwrote - without this it keeps
            // showing whatever was loaded before the import, silently
            // stale until the user closes and reopens it. Reuses the same
            // reload path already wired up for a rename (loadData() only
            // actually re-fetches when the id matches the open window).
            if (activeWindowId != null) {
                onActiveWindowRenamed?.(activeWindowId);
            }
        } catch (error) {
            console.error(error);
            toast.showError(t.windowmanagementpanel_import_error || 'Import failed');
        } finally {
            setImporting(false);
        }
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow re-selecting the same file for a retry
        if (!file || !selectedProject) return;

        const text = await readFileTextWithEncodingDetection(file);
        let parsed: any;
        try {
            parsed = JSON.parse(text);
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            toast.showError(`${t.windowmanagementpanel_import_invalid_file || 'This file is not valid JSON'}: ${detail}`);
            return;
        }
        // The WinDev export is a plain array of windows; also accept a
        // { windows: [...] } wrapper in case the export format grows a
        // metadata envelope later.
        const windowsArray = Array.isArray(parsed) ? parsed : parsed?.windows;
        if (!Array.isArray(windowsArray)) {
            toast.showError(t.windowmanagementpanel_import_invalid_file || 'This file is not valid JSON');
            return;
        }

        // Detect name conflicts against the tree already loaded here — no
        // extra request needed, `windows` already mirrors the DB.
        const existingNames = new Set(windows.map((w) => w.name));
        const conflicts: ImportConflict[] = [];
        windowsArray.forEach((w) => {
            const rawName = typeof w?.name === 'string' ? w.name : null;
            if (!rawName) return;
            if (existingNames.has(sanitizeWindowName(rawName))) {
                conflicts.push({ rawName, caption: typeof w.caption === 'string' ? w.caption : rawName, action: 'skip' });
            }
        });

        if (conflicts.length === 0) {
            await runImport(windowsArray, {});
            return;
        }

        setPendingImportWindows(windowsArray);
        setImportConflicts(conflicts);
        setImportConflictDialogVisible(true);
    };

    const confirmImportConflicts = async () => {
        const decisions: Record<string, 'overwrite' | 'skip'> = {};
        importConflicts.forEach((c) => { decisions[c.rawName] = c.action; });
        setImportConflictDialogVisible(false);
        await runImport(pendingImportWindows, decisions);
    };

    // A ZIP of many .sml files (one per WinDev unit), matched against
    // already-imported windows/controls by source_name - unlike the WinDev
    // JSON import above there's no conflict/overwrite decision to make,
    // matching is exact and updateOrCreate never blanks existing code.
    const handleImportSmlFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !selectedProject) return;

        setSmlImporting(true);
        try {
            const formData = new FormData();
            formData.append('sml_zip', file);
            const res = await apiClient.uploadFile(`/projects/${selectedProject.id}/windows/import-sml`, formData);
            setSmlImportStats(res.data);
            setSmlImportSummaryVisible(true);
            toast.showSuccess(t.windowmanagementpanel_sml_import_success || 'Code import complete');
        } catch (error) {
            console.error(error);
            toast.showError(t.windowmanagementpanel_sml_import_error || 'Code import failed');
        } finally {
            setSmlImporting(false);
        }
    };

    const buildTree = (): TreeNode[] => {
        const catNodes = new Map<number, TreeNode>();
        categories.forEach((c) => {
            catNodes.set(c.id, {
                key: `cat-${c.id}`,
                label: c.name,
                icon: 'pi pi-folder',
                leaf: false,
                droppable: true,
                children: [],
                data: { nodeType: 'category', id: c.id } as NodeData,
            });
        });

        const roots: TreeNode[] = [];
        categories
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .forEach((c) => {
                const node = catNodes.get(c.id)!;
                const parent = c.parent_id != null ? catNodes.get(c.parent_id) : undefined;
                if (parent) {
                    parent.children!.push(node);
                } else {
                    roots.push(node);
                }
            });

        windows
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .forEach((w) => {
                const node: TreeNode = {
                    key: `win-${w.id}`,
                    // WinDev users expect to see the window's file/machine
                    // name here, not its display caption — don't second-guess it.
                    // The star marks the project's one "first window" (see
                    // the "1" toolbar button above) - launched directly
                    // instead of a menu/demo screen.
                    label: w.is_first_window ? `⭐ ${w.name}` : w.name,
                    icon: 'pi pi-desktop',
                    leaf: true,
                    droppable: false,
                    data: { nodeType: 'window', id: w.id } as NodeData,
                };
                const parent = w.category_id != null ? catNodes.get(w.category_id) : undefined;
                if (parent) {
                    parent.children!.push(node);
                } else {
                    roots.push(node);
                }
            });

        return roots;
    };

    // ===== Drag & drop reorder / reparent =====
    const handleDragDrop = async (e: { originalEvent: React.SyntheticEvent; value: TreeNode[]; dragNode: TreeNode; dropNode: TreeNode; dropIndex: number }) => {
        type Update = { type: 'category' | 'window'; id: number; parentId: number | null; sortOrder: number };
        const updates: Update[] = [];

        const walk = (nodes: TreeNode[], parentCategoryId: number | null) => {
            let catOrder = 0;
            let winOrder = 0;
            nodes.forEach((node) => {
                const data = node.data as NodeData;
                if (data.nodeType === 'category') {
                    updates.push({ type: 'category', id: data.id, parentId: parentCategoryId, sortOrder: catOrder++ });
                    walk(node.children || [], data.id);
                } else {
                    updates.push({ type: 'window', id: data.id, parentId: parentCategoryId, sortOrder: winOrder++ });
                }
            });
        };
        walk(e.value as TreeNode[], null);

        const categoryUpdates = updates.filter((u) => {
            if (u.type !== 'category') return false;
            const current = categories.find((c) => c.id === u.id);
            return !current || current.parent_id !== u.parentId || current.sort_order !== u.sortOrder;
        });
        const windowUpdates = updates.filter((u) => {
            if (u.type !== 'window') return false;
            const current = windows.find((w) => w.id === u.id);
            return !current || current.category_id !== u.parentId || current.sort_order !== u.sortOrder;
        });

        if (categoryUpdates.length === 0 && windowUpdates.length === 0) return;

        setCategories((prev) =>
            prev.map((c) => {
                const u = categoryUpdates.find((x) => x.id === c.id);
                return u ? { ...c, parent_id: u.parentId, sort_order: u.sortOrder } : c;
            })
        );
        setWindows((prev) =>
            prev.map((w) => {
                const u = windowUpdates.find((x) => x.id === w.id);
                return u ? { ...w, category_id: u.parentId, sort_order: u.sortOrder } : w;
            })
        );

        try {
            await Promise.all([
                ...categoryUpdates.map((u) =>
                    apiClient.put(`/window-categories/${u.id}`, { parent_id: u.parentId, sort_order: u.sortOrder })
                ),
                ...windowUpdates.map((u) =>
                    apiClient.put(`/windows/${u.id}`, { category_id: u.parentId, sort_order: u.sortOrder })
                ),
            ]);
        } catch (error) {
            console.error(error);
            toast.showError(t.windowmanagementpanel_load_error || 'Failed to load windows');
            loadData();
        }
    };

    // ===== Category create/rename/delete =====
    const openNewCategoryDialog = (parentId: number | null) => {
        setCategoryDialogEditId(null);
        setCategoryDialogParentId(parentId);
        setCategoryNameInput('');
        setCategoryDialogVisible(true);
    };

    const openRenameCategoryDialog = (id: number) => {
        const cat = categories.find((c) => c.id === id);
        if (!cat) return;
        setCategoryDialogEditId(id);
        setCategoryDialogParentId(cat.parent_id);
        setCategoryNameInput(cat.name);
        setCategoryDialogVisible(true);
    };

    const submitCategoryDialog = async () => {
        if (!categoryNameInput.trim() || !selectedProject) return;
        setSaving(true);
        try {
            if (categoryDialogEditId != null) {
                const res = await apiClient.put(`/window-categories/${categoryDialogEditId}`, { name: categoryNameInput.trim() });
                setCategories((prev) => prev.map((c) => (c.id === categoryDialogEditId ? res.data : c)));
            } else {
                const res = await apiClient.post('/window-categories', {
                    project_id: selectedProject.id,
                    parent_id: categoryDialogParentId,
                    name: categoryNameInput.trim(),
                });
                setCategories((prev) => [...prev, res.data]);
                if (categoryDialogParentId != null) {
                    setExpandedKeys((prev) => ({ ...prev, [`cat-${categoryDialogParentId}`]: true }));
                }
            }
            setCategoryDialogVisible(false);
        } catch (error) {
            console.error(error);
            toast.showError(t.windowmanagementpanel_load_error || 'Failed to load windows');
        } finally {
            setSaving(false);
        }
    };

    const deleteCategory = (id: number) => {
        confirmDialog({
            message: t.windowmanagementpanel_delete_category_confirm || 'Delete this category? Windows and subcategories inside it will not be deleted, they will move to the root level.',
            header: t.windowmanagementpanel_delete || 'Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await apiClient.delete(`/window-categories/${id}`);
                    await loadData();
                } catch (error) {
                    console.error(error);
                    toast.showError(t.windowmanagementpanel_load_error || 'Failed to load windows');
                }
            },
        });
    };

    // ===== Window create/rename/delete =====
    const openNewWindowDialog = (categoryId: number | null) => {
        setWindowDialogEditId(null);
        setWindowDialogCategoryId(categoryId);
        setWindowNameInput('');
        setWindowDisplayNameInput('');
        setWindowNameError(null);
        setWindowDialogVisible(true);
    };

    const openRenameWindowDialog = (id: number) => {
        const win = windows.find((w) => w.id === id);
        if (!win) return;
        setWindowDialogEditId(id);
        setWindowDialogCategoryId(win.category_id);
        setWindowNameInput(win.name);
        setWindowDisplayNameInput(win.display_name || '');
        setWindowNameError(null);
        setWindowDialogVisible(true);
    };

    const submitWindowDialog = async () => {
        if (!windowNameInput.trim() || !selectedProject) {
            setWindowNameError(t.windowmanagementpanel_name_required || 'Name is required');
            return;
        }
        setSaving(true);
        setWindowNameError(null);
        try {
            if (windowDialogEditId != null) {
                const res = await apiClient.put(`/windows/${windowDialogEditId}`, {
                    name: windowNameInput.trim(),
                    display_name: windowDisplayNameInput.trim() || null,
                });
                setWindows((prev) => prev.map((w) => (w.id === windowDialogEditId ? res.data : w)));
                if (windowDialogEditId === activeWindowId) {
                    onActiveWindowRenamed?.(windowDialogEditId);
                }
            } else {
                const res = await apiClient.post('/windows', {
                    project_id: selectedProject.id,
                    category_id: windowDialogCategoryId,
                    name: windowNameInput.trim(),
                    display_name: windowDisplayNameInput.trim() || null,
                });
                setWindows((prev) => [...prev, res.data]);
                onSelectWindow(res.data.id);
            }
            setWindowDialogVisible(false);
        } catch (error: any) {
            const message = error?.message || (t.windowmanagementpanel_name_exists || 'A window with this name already exists in this project');
            setWindowNameError(message);
        } finally {
            setSaving(false);
        }
    };

    // Marks `id` as the ONE window the generated app launches directly into
    // (see WindowDesignerController::setFirstWindow, which clears the flag
    // on every other window in this project first) — optimistic local
    // update (mirroring the endpoint's own exclusivity) rather than a full
    // loadData() round-trip.
    const setAsFirstWindow = async (id: number) => {
        try {
            await apiClient.put(`/windows/${id}/set-first-window`);
            setWindows((prev) => prev.map((w) => ({ ...w, is_first_window: w.id === id })));
            toast.showSuccess(t.windowmanagementpanel_set_first_window_success || 'Set as the project\'s first window');
        } catch (error) {
            console.error(error);
            toast.showError(t.windowmanagementpanel_load_error || 'Failed to load windows');
        }
    };

    const deleteWindow = (id: number) => {
        confirmDialog({
            message: t.windowmanagementpanel_delete_window_confirm || 'Delete this window? This cannot be undone.',
            header: t.windowmanagementpanel_delete || 'Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await apiClient.delete(`/windows/${id}`);
                    setWindows((prev) => prev.filter((w) => w.id !== id));
                    if (id === activeWindowId) {
                        onActiveWindowDeleted?.(id);
                    }
                } catch (error) {
                    console.error(error);
                    toast.showError(t.windowmanagementpanel_load_error || 'Failed to load windows');
                }
            },
        });
    };

    // ===== Context menu =====
    const getContextMenuModel = (): MenuItem[] => {
        if (!contextNode) {
            return [
                { label: t.windowmanagementpanel_new_category || 'New Category', icon: 'pi pi-folder-plus', command: () => openNewCategoryDialog(null) },
                { label: t.windowmanagementpanel_new_window || 'New Window', icon: 'pi pi-plus', command: () => openNewWindowDialog(null) },
            ];
        }
        if (contextNode.nodeType === 'category') {
            return [
                { label: t.windowmanagementpanel_new_category || 'New Category', icon: 'pi pi-folder-plus', command: () => openNewCategoryDialog(contextNode.id) },
                { label: t.windowmanagementpanel_new_window || 'New Window', icon: 'pi pi-plus', command: () => openNewWindowDialog(contextNode.id) },
                { separator: true },
                { label: t.windowmanagementpanel_rename || 'Rename', icon: 'pi pi-pencil', command: () => openRenameCategoryDialog(contextNode.id) },
                { label: t.windowmanagementpanel_delete || 'Delete', icon: 'pi pi-trash', command: () => deleteCategory(contextNode.id) },
            ];
        }
        return [
            { label: t.windowmanagementpanel_open_designer || 'Open', icon: 'pi pi-external-link', command: () => onSelectWindow(contextNode.id) },
            { separator: true },
            { label: t.windowmanagementpanel_rename || 'Rename', icon: 'pi pi-pencil', command: () => openRenameWindowDialog(contextNode.id) },
            { label: t.windowmanagementpanel_delete || 'Delete', icon: 'pi pi-trash', command: () => deleteWindow(contextNode.id) },
        ];
    };

    const treeData = buildTree();
    const activeKey = activeWindowId != null ? `win-${activeWindowId}` : null;

    return (
        <div className="window-explorer-sidebar h-full flex flex-col" style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}>
            <Menu model={getContextMenuModel()} popup ref={contextMenuRef} />

            <div className="flex justify-between items-center px-2 py-1.5" style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}>
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textSecondary }}>
                    {t.windowmanagementpanel_title || 'Windows'}
                </span>
                <div className="flex items-center gap-1">
                    <Button icon="pi pi-folder-plus" className="p-button-text p-button-sm" style={{ width: 24, height: 24 }}
                        onClick={() => openNewCategoryDialog(null)} tooltip={t.windowmanagementpanel_new_category || 'New Category'} tooltipOptions={{ position: 'bottom' }} />
                    <Button icon="pi pi-plus" className="p-button-text p-button-sm" style={{ width: 24, height: 24 }}
                        onClick={() => openNewWindowDialog(null)} tooltip={t.windowmanagementpanel_new_window || 'New Window'} tooltipOptions={{ position: 'bottom' }} />
                    <input ref={importInputRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={handleImportFile} />
                    <Button icon="pi pi-upload" className="p-button-text p-button-sm" style={{ width: 24, height: 24 }}
                        onClick={() => importInputRef.current?.click()} loading={importing}
                        tooltip={t.windowmanagementpanel_import || 'Import'} tooltipOptions={{ position: 'bottom' }} />
                    <input ref={smlImportInputRef} type="file" accept="application/zip,.zip" style={{ display: 'none' }} onChange={handleImportSmlFile} />
                    <Button icon="pi pi-code" className="p-button-text p-button-sm" style={{ width: 24, height: 24 }}
                        onClick={() => smlImportInputRef.current?.click()} loading={smlImporting}
                        tooltip={t.windowmanagementpanel_sml_import || 'Import Code (SML)'} tooltipOptions={{ position: 'bottom' }} />
                    <Button
                        label="1"
                        className="p-button-text p-button-sm"
                        style={{ width: 24, height: 24, fontSize: '0.75rem', fontWeight: 700, padding: 0 }}
                        onClick={() => activeWindowId != null && setAsFirstWindow(activeWindowId)}
                        disabled={activeWindowId == null}
                        tooltip={t.windowmanagementpanel_set_first_window || 'Set first project window'}
                        tooltipOptions={{ position: 'bottom' }}
                    />
                    <Button
                        icon="pi pi-thumbtack"
                        className={`p-button-text p-button-sm ${isPinned ? 'p-button-info' : ''}`}
                        style={{ width: 24, height: 24, opacity: isPinned ? 1 : 0.5 }}
                        onClick={onTogglePinned}
                        tooltip={isPinned ? (t.windowdesignerpanel_unpin_sidebar || 'Unpin sidebar') : (t.windowdesignerpanel_pin_sidebar || 'Pin sidebar')}
                        tooltipOptions={{ position: 'bottom' }}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto p-1">
                {loading ? (
                    <div className="text-center mt-8 text-xs" style={{ color: colors.textMuted }}>{t.windowmanagementpanel_loading || 'Loading windows...'}</div>
                ) : !selectedProject ? (
                    <div className="text-center mt-8 text-xs px-2" style={{ color: colors.textMuted }}>{t.windowmanagementpanel_no_project_selected || 'Select a project to manage its windows.'}</div>
                ) : treeData.length === 0 ? (
                    <div className="text-center mt-8 text-xs px-2" style={{ color: colors.textMuted }}>{t.windowmanagementpanel_empty_tree || 'No windows yet. Right-click to create a category or window.'}</div>
                ) : (
                    <Tree
                        value={treeData}
                        className="bg-transparent window-tree-compact"
                        expandedKeys={expandedKeys}
                        onToggle={(e) => setExpandedKeys(e.value as Record<string, boolean>)}
                        selectionMode="single"
                        selectionKeys={activeKey ? { [activeKey]: true } : null}
                        onSelectionChange={(e) => {
                            const key = e.value as string;
                            if (key && key.startsWith('win-')) {
                                onSelectWindow(parseInt(key.replace('win-', ''), 10));
                            }
                        }}
                        dragdropScope="window-tree"
                        onDragDrop={handleDragDrop}
                        onContextMenu={(e) => {
                            setContextNode((e.node.data as NodeData) || null);
                            contextMenuRef.current?.show(e.originalEvent as unknown as React.SyntheticEvent);
                        }}
                    />
                )}
            </div>

            {/* CREATE / RENAME CATEGORY */}
            <Dialog
                visible={categoryDialogVisible}
                onHide={() => { if (!saving) setCategoryDialogVisible(false); }}
                header={categoryDialogEditId != null ? (t.windowmanagementpanel_rename || 'Rename') : (t.windowmanagementpanel_new_category || 'New Category')}
                style={{ width: '400px' }}
                modal
                closable={!saving}
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
            >
                <div className="space-y-4">
                    <InputText
                        value={categoryNameInput}
                        onChange={(e) => setCategoryNameInput(e.target.value)}
                        className="w-full"
                        placeholder={t.windowmanagementpanel_category_name_placeholder || 'Category name'}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') submitCategoryDialog(); }}
                    />
                    <div className="flex justify-end gap-2 pt-2" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                        <Button label={t.windowmanagementpanel_cancel || 'Cancel'} className="p-button-secondary" onClick={() => setCategoryDialogVisible(false)} disabled={saving} />
                        <Button label={t.windowmanagementpanel_create || 'Create'} onClick={submitCategoryDialog} loading={saving} disabled={!categoryNameInput.trim()} />
                    </div>
                </div>
            </Dialog>

            {/* CREATE / RENAME WINDOW */}
            <Dialog
                visible={windowDialogVisible}
                onHide={() => { if (!saving) setWindowDialogVisible(false); }}
                header={windowDialogEditId != null ? (t.windowmanagementpanel_rename || 'Rename') : (t.windowmanagementpanel_new_window || 'New Window')}
                style={{ width: '450px' }}
                modal
                closable={!saving}
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
            >
                <div className="space-y-4">
                    <div>
                        <InputText
                            value={windowNameInput}
                            onChange={(e) => setWindowNameInput(sanitizeWindowName(e.target.value))}
                            className="w-full"
                            placeholder={t.windowmanagementpanel_window_name_placeholder || 'Window name (e.g. customer_search)'}
                            autoFocus
                        />
                        {windowNameError && <div className="text-xs mt-1" style={{ color: colors.errorText }}>{windowNameError}</div>}
                    </div>
                    <InputText
                        value={windowDisplayNameInput}
                        onChange={(e) => setWindowDisplayNameInput(e.target.value)}
                        className="w-full"
                        placeholder={t.windowmanagementpanel_window_display_name_placeholder || 'Display name'}
                        onKeyDown={(e) => { if (e.key === 'Enter') submitWindowDialog(); }}
                    />
                    <div className="flex justify-end gap-2 pt-2" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                        <Button label={t.windowmanagementpanel_cancel || 'Cancel'} className="p-button-secondary" onClick={() => setWindowDialogVisible(false)} disabled={saving} />
                        <Button label={t.windowmanagementpanel_create || 'Create'} onClick={submitWindowDialog} loading={saving} disabled={!windowNameInput.trim()} />
                    </div>
                </div>
            </Dialog>

            {/* WINDEV IMPORT SUMMARY */}
            <Dialog
                visible={importSummaryVisible}
                onHide={() => setImportSummaryVisible(false)}
                header={t.windowmanagementpanel_import_title || 'Import Windows from WinDev'}
                style={{ width: '440px' }}
                modal
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
            >
                {importStats && (
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <i className="pi pi-check-circle" style={{ color: '#22c55e' }} />
                            {importStats.windows_imported} {t.windowmanagementpanel_import_summary_windows || 'windows imported'}
                        </div>
                        <div className="flex items-center gap-2">
                            <i className="pi pi-check-circle" style={{ color: '#22c55e' }} />
                            {importStats.controls_imported + importStats.elements_imported} {t.windowmanagementpanel_import_summary_controls || 'controls imported'}
                        </div>
                        {importStats.menus_imported > 0 && (
                            <div className="flex items-center gap-2">
                                <i className="pi pi-check-circle" style={{ color: '#22c55e' }} />
                                {importStats.menus_imported} {t.windowmanagementpanel_import_summary_menus || 'menu items imported'}
                            </div>
                        )}
                        {importStats.windows_overwritten > 0 && (
                            <div className="flex items-center gap-2">
                                <i className="pi pi-refresh" style={{ color: '#3b82f6' }} />
                                {importStats.windows_overwritten} {t.windowmanagementpanel_import_summary_overwritten || 'windows overwritten'}
                            </div>
                        )}
                        {importStats.windows_skipped.length > 0 && (
                            <div className="flex items-start gap-2">
                                <i className="pi pi-exclamation-triangle mt-0.5" style={{ color: '#f59e0b' }} />
                                <span>{importStats.windows_skipped.length} {t.windowmanagementpanel_import_summary_skipped || 'windows skipped (already exist)'}: {importStats.windows_skipped.join(', ')}</span>
                            </div>
                        )}
                        {importStats.unmapped_types.length > 0 && (
                            <div className="flex items-start gap-2">
                                <i className="pi pi-exclamation-triangle mt-0.5" style={{ color: '#f59e0b' }} />
                                <span>{importStats.unmapped_types.length} {t.windowmanagementpanel_import_summary_warnings || 'controls had an unrecognized type and were imported as static text'}</span>
                            </div>
                        )}
                        {importStats.unresolved_parents.length > 0 && (
                            <div className="flex items-start gap-2">
                                <i className="pi pi-exclamation-triangle mt-0.5" style={{ color: '#f59e0b' }} />
                                <div>
                                    <div>{importStats.unresolved_parents.length} {t.windowmanagementpanel_import_summary_unresolved_parents || 'controls referenced a parent container that could not be found and were placed at the window root instead'}:</div>
                                    <ul className="mt-1" style={{ paddingLeft: 16, listStyleType: 'disc', maxHeight: 120, overflowY: 'auto' }}>
                                        {importStats.unresolved_parents.map((u, i) => (
                                            <li key={i}>{u.window} → {u.control} (parent_control: "{u.parent_control}")</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <div className="flex justify-end pt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}`, marginTop: 12 }}>
                    <Button label={t.windowmanagementpanel_import_close || 'Close'} onClick={() => setImportSummaryVisible(false)} />
                </div>
            </Dialog>

            {/* SML CODE IMPORT SUMMARY */}
            <Dialog
                visible={smlImportSummaryVisible}
                onHide={() => setSmlImportSummaryVisible(false)}
                header={t.windowmanagementpanel_sml_import_title || 'Import Code (SML)'}
                style={{ width: '520px' }}
                modal
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
            >
                {smlImportStats && (
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <i className="pi pi-check-circle" style={{ color: '#22c55e' }} />
                            {smlImportStats.files_processed} {t.windowmanagementpanel_sml_import_summary_files || 'files processed'}
                        </div>
                        <div className="flex items-center gap-2">
                            <i className="pi pi-check-circle" style={{ color: '#22c55e' }} />
                            {smlImportStats.windows_matched} {t.windowmanagementpanel_sml_import_summary_windows || 'windows matched'}
                        </div>
                        <div className="flex items-center gap-2">
                            <i className="pi pi-check-circle" style={{ color: '#22c55e' }} />
                            {smlImportStats.events_imported} {t.windowmanagementpanel_sml_import_summary_events || 'events imported'}
                        </div>
                        {smlImportStats.warnings.length > 0 && (
                            <div className="flex items-start gap-2">
                                <i className="pi pi-exclamation-triangle mt-0.5" style={{ color: '#f59e0b' }} />
                                <div>
                                    <div>{smlImportStats.warnings.length} {t.windowmanagementpanel_sml_import_summary_warnings || 'warning(s)'}:</div>
                                    <ul className="mt-1" style={{ paddingLeft: 16, listStyleType: 'disc', maxHeight: 200, overflowY: 'auto' }}>
                                        {smlImportStats.warnings.map((w, i) => (<li key={i}>{w}</li>))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <div className="flex justify-end pt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}`, marginTop: 12 }}>
                    <Button label={t.windowmanagementpanel_import_close || 'Close'} onClick={() => setSmlImportSummaryVisible(false)} />
                </div>
            </Dialog>

            {/* WINDEV IMPORT CONFLICTS — resolve per window before committing */}
            <Dialog
                visible={importConflictDialogVisible}
                onHide={() => setImportConflictDialogVisible(false)}
                header={t.windowmanagementpanel_import_conflict_title || 'Windows already exist'}
                style={{ width: '520px' }}
                modal
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
            >
                <p className="text-sm mb-3" style={{ color: colors.textMuted }}>
                    {t.windowmanagementpanel_import_conflict_description || 'These windows already exist in this project. Choose whether to skip or overwrite each one — overwriting replaces its controls but keeps its category and position.'}
                </p>
                <div className="flex gap-2 mb-3">
                    <Button
                        label={t.windowmanagementpanel_import_conflict_skip_all || 'Skip All'}
                        className="p-button-secondary p-button-sm"
                        onClick={() => setImportConflicts((prev) => prev.map((c) => ({ ...c, action: 'skip' })))}
                    />
                    <Button
                        label={t.windowmanagementpanel_import_conflict_overwrite_all || 'Overwrite All'}
                        className="p-button-warning p-button-sm"
                        onClick={() => setImportConflicts((prev) => prev.map((c) => ({ ...c, action: 'overwrite' })))}
                    />
                </div>
                <div className="space-y-1 overflow-y-auto" style={{ maxHeight: 320 }}>
                    {importConflicts.map((c, idx) => (
                        <div key={c.rawName} className="flex items-center justify-between gap-2 px-2 py-1 rounded" style={{ backgroundColor: colors.bgTertiary }}>
                            <span className="text-sm truncate" title={c.caption || c.rawName}>{c.caption || c.rawName}</span>
                            <Dropdown
                                value={c.action}
                                options={[
                                    { label: t.windowmanagementpanel_import_conflict_skip || 'Skip', value: 'skip' },
                                    { label: t.windowmanagementpanel_import_conflict_overwrite || 'Overwrite', value: 'overwrite' },
                                ]}
                                onChange={(e) => setImportConflicts((prev) => prev.map((item, i) => (i === idx ? { ...item, action: e.value } : item)))}
                                className="p-inputtext-sm"
                                style={{ width: 130 }}
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-2 pt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}`, marginTop: 12 }}>
                    <Button label={t.windowmanagementpanel_cancel || 'Cancel'} className="p-button-secondary" onClick={() => setImportConflictDialogVisible(false)} />
                    <Button label={t.windowmanagementpanel_import_conflict_continue || 'Continue Import'} onClick={confirmImportConflicts} loading={importing} />
                </div>
            </Dialog>

            {/* Compact tree styling — deliberately tighter than SchemaTranslationPanel's
                schema-tree-compact (1.5rem) since Windows projects can have many entries. */}
            <style>{`
                .window-tree-compact {
                    width: 100% !important;
                    height: auto !important;
                    background: transparent !important;
                }
                .window-tree-compact .p-tree-container {
                    width: 100% !important;
                    overflow: visible !important;
                    background: transparent !important;
                }
                .window-tree-compact .p-treenode {
                    padding: 0 !important;
                }
                .window-tree-compact .p-treenode-content {
                    display: flex !important;
                    align-items: center !important;
                    padding: 0.0625rem 0.5rem !important;
                    min-height: 1.25rem !important;
                    background: transparent !important;
                }
                .window-tree-compact .p-treenode-content:hover {
                    background: var(--theme-bg-tertiary) !important;
                }
                .window-tree-compact .p-tree-toggler {
                    width: 1.1rem !important;
                    height: 1.1rem !important;
                    flex-shrink: 0 !important;
                    color: var(--theme-text-secondary) !important;
                }
                .window-tree-compact .p-treenode-icon {
                    flex-shrink: 0 !important;
                }
                .window-tree-compact .p-treenode-label {
                    display: block !important;
                    flex: 1 1 auto !important;
                    min-width: 0 !important;
                    overflow: hidden !important;
                    white-space: nowrap !important;
                    text-overflow: ellipsis !important;
                    font-size: 0.8125rem !important;
                    color: var(--theme-text-primary) !important;
                }
                .window-tree-compact .p-highlight > .p-treenode-content {
                    background: var(--theme-bg-tertiary) !important;
                }
            `}</style>
        </div>
    );
};

export default WindowExplorerSidebar;
