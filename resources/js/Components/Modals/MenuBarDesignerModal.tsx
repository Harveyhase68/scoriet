// resources/js/Components/Modals/MenuBarDesignerModal.tsx - Visual editor
// for a window's own menu bar (File, File > Exit, ...), imported from
// WinDev's recursive `menus` export or hand-built here. Every structural
// change (add/rename/reparent/delete) persists immediately as its own
// single-row REST call, the same immediate-persistence style
// ProcedureEditorModal.tsx already uses for ui_procedures - no "Apply" step.
// A bulk upsert would hit the same self-referencing-batch constraint
// saveElements() documents (a brand new child can't reference a sibling's
// not-yet-generated id in one multi-row INSERT), so a new item is always
// created one at a time against an already-existing parent, and drag/drop
// only ever moves rows that already have a real id on both ends.
// Tree + drag&drop mirrors WindowExplorerSidebar.tsx's own Tree usage;
// per-language Caption editing mirrors TableColumnDesignerModal.tsx.
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tree } from 'primereact/tree';
import { TreeNode } from 'primereact/treenode';
import { confirmDialog } from 'primereact/confirmdialog';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { apiClient } from '@/lib/api';
import { LanguageField } from '../Panels/LanguageField';
import WindowCodeEditorModal, { WindowCodeEditorTarget } from './WindowCodeEditorModal';

interface MenuRow {
    id: number;
    window_id: number;
    parent_menu_id: number | null;
    source_name: string | null;
    caption: string | null;
    caption_labels: Record<string, string> | null;
    sort_order: number;
}

interface MenuBarDesignerModalProps {
    visible: boolean;
    windowId: number;
    onHide: () => void;
    // Same shared language state/helpers WindowDesignerPanel already uses
    // everywhere else, passed down rather than duplicated here - see
    // TableColumnDesignerModal.tsx for the identical contract.
    selectedLanguage: string;
    enabledLanguages: { value: string; label: string }[];
    onSelectLanguage: (lang: string) => void;
    seedLanguageLabels: (existing: Record<string, string> | null | undefined, newValue: string) => Record<string, string>;
    copyToAllLanguages: (current: string) => Record<string, string>;
}

const buildTree = (menus: MenuRow[]): TreeNode[] => {
    const nodeMap = new Map<number, TreeNode>();
    menus.forEach((m) => {
        nodeMap.set(m.id, {
            key: `menu-${m.id}`,
            label: m.caption || m.source_name || `#${m.id}`,
            icon: 'pi pi-bars',
            data: { id: m.id },
            children: [],
        });
    });

    const roots: TreeNode[] = [];
    menus
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .forEach((m) => {
            const node = nodeMap.get(m.id)!;
            const parent = m.parent_menu_id != null ? nodeMap.get(m.parent_menu_id) : undefined;
            if (parent) {
                parent.children!.push(node);
            } else {
                roots.push(node);
            }
        });

    return roots;
};

const MenuBarDesignerModal: React.FC<MenuBarDesignerModalProps> = ({
    visible,
    windowId,
    onHide,
    selectedLanguage,
    enabledLanguages,
    onSelectLanguage,
    seedLanguageLabels,
    copyToAllLanguages,
}) => {
    const [currentLanguage] = useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);
    const { colors } = useTheme();
    const toast = useToast();

    const [loading, setLoading] = useState(false);
    const [menus, setMenus] = useState<MenuRow[]>([]);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
    const [codeEditorVisible, setCodeEditorVisible] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/windows/${windowId}/menus`);
            setMenus(res.data || []);
        } catch (err) {
            console.error(err);
            toast.showError(t.menudesigner_load_error || 'Failed to load menu bar');
        } finally {
            setLoading(false);
        }
    }, [windowId, toast, t]);

    useEffect(() => {
        if (visible) {
            load();
            setSelectedKey(null);
        }
    }, [visible, load]);

    const selectedId = selectedKey ? parseInt(selectedKey.replace('menu-', ''), 10) : null;
    const selected = selectedId != null ? menus.find((m) => m.id === selectedId) || null : null;
    const treeData = buildTree(menus);

    const codeEditorTarget: WindowCodeEditorTarget | null = selected
        ? { kind: 'menu', menuId: selected.id, label: selected.caption || selected.source_name || `#${selected.id}` }
        : null;

    const addMenu = useCallback(async (parentMenuId: number | null) => {
        const defaultCaption = t.menudesigner_new_item || 'New Item';
        try {
            const res = await apiClient.post(`/windows/${windowId}/menus`, {
                parent_menu_id: parentMenuId,
                source_name: null,
                caption: defaultCaption,
                caption_labels: seedLanguageLabels(null, defaultCaption),
            });
            setMenus((prev) => [...prev, res.data]);
            setSelectedKey(`menu-${res.data.id}`);
            if (parentMenuId != null) {
                setExpandedKeys((prev) => ({ ...prev, [`menu-${parentMenuId}`]: true }));
            }
        } catch (err) {
            console.error(err);
            toast.showError(t.menudesigner_save_error || 'Failed to save menu item');
        }
    }, [windowId, seedLanguageLabels, toast, t]);

    const deleteMenu = useCallback((menu: MenuRow) => {
        confirmDialog({
            message: t.menudesigner_delete_confirm || 'Delete this menu item and everything under it?',
            header: t.menudesigner_delete_title || 'Delete Menu Item',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await apiClient.delete(`/window-menus/${menu.id}`);
                    // The backend recursively deletes the whole subtree -
                    // drop it locally too instead of a full re-fetch.
                    const removeIds = new Set<number>([menu.id]);
                    let grew = true;
                    while (grew) {
                        grew = false;
                        menus.forEach((m) => {
                            if (m.parent_menu_id != null && removeIds.has(m.parent_menu_id) && !removeIds.has(m.id)) {
                                removeIds.add(m.id);
                                grew = true;
                            }
                        });
                    }
                    setMenus((prev) => prev.filter((m) => !removeIds.has(m.id)));
                    setSelectedKey(null);
                } catch (err) {
                    console.error(err);
                    toast.showError(t.menudesigner_save_error || 'Failed to save menu item');
                }
            },
        });
    }, [menus, t, toast]);

    const updateMenuField = useCallback(async (id: number, patch: Partial<MenuRow>) => {
        setMenus((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
        try {
            await apiClient.put(`/window-menus/${id}`, patch);
        } catch (err) {
            console.error(err);
            toast.showError(t.menudesigner_save_error || 'Failed to save menu item');
        }
    }, [toast, t]);

    const handleDragDrop = useCallback(async (e: { originalEvent: React.SyntheticEvent; value: TreeNode[]; dragNode: TreeNode; dropNode: TreeNode; dropIndex: number }) => {
        type Update = { id: number; parentId: number | null; sortOrder: number };
        const updates: Update[] = [];

        const walk = (nodes: TreeNode[], parentId: number | null) => {
            nodes.forEach((node, index) => {
                const id = (node.data as { id: number }).id;
                updates.push({ id, parentId, sortOrder: index });
                walk(node.children || [], id);
            });
        };
        walk(e.value, null);

        const changed = updates.filter((u) => {
            const current = menus.find((m) => m.id === u.id);
            return !current || current.parent_menu_id !== u.parentId || current.sort_order !== u.sortOrder;
        });
        if (changed.length === 0) return;

        setMenus((prev) =>
            prev.map((m) => {
                const u = changed.find((x) => x.id === m.id);
                return u ? { ...m, parent_menu_id: u.parentId, sort_order: u.sortOrder } : m;
            })
        );

        try {
            await Promise.all(
                changed.map((u) => apiClient.put(`/window-menus/${u.id}`, { parent_menu_id: u.parentId, sort_order: u.sortOrder }))
            );
        } catch (err) {
            console.error(err);
            toast.showError(t.menudesigner_save_error || 'Failed to save menu item');
            load();
        }
    }, [menus, toast, t, load]);

    return (
        <>
        <Dialog
            header={t.menudesigner_header || 'Menu Bar'}
            visible={visible}
            onHide={onHide}
            style={{ width: '760px' }}
            contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
            headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
            modal
            closable
            draggable
            resizable
            footer={(
                <div className="flex justify-end">
                    <Button label={t.menudesigner_close || 'Close'} icon="pi pi-times" className="p-button-text" onClick={onHide} />
                </div>
            )}
        >
            {loading ? (
                <div className="flex items-center justify-center p-8" style={{ color: colors.textMuted }}>
                    <i className="pi pi-spin pi-spinner mr-2" />
                    {t.menudesigner_loading || 'Loading...'}
                </div>
            ) : (
                <div className="flex gap-3" style={{ minHeight: 420 }}>
                    <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                        <div className="border rounded overflow-y-auto flex-1" style={{ borderColor: colors.borderPrimary, maxHeight: 440 }}>
                            {treeData.length === 0 ? (
                                <div className="p-3 text-xs" style={{ color: colors.textMuted }}>
                                    {t.menudesigner_empty || 'No menu items yet'}
                                </div>
                            ) : (
                                <Tree
                                    value={treeData}
                                    className="bg-transparent window-tree-compact"
                                    expandedKeys={expandedKeys}
                                    onToggle={(e) => setExpandedKeys(e.value as Record<string, boolean>)}
                                    selectionMode="single"
                                    selectionKeys={selectedKey ? { [selectedKey]: true } : null}
                                    onSelectionChange={(e) => setSelectedKey(e.value as string)}
                                    dragdropScope="menu-tree"
                                    onDragDrop={handleDragDrop}
                                />
                            )}
                        </div>
                        <div className="flex gap-2 mt-2">
                            <Button
                                label={t.menudesigner_add_root || 'Add Root Item'}
                                icon="pi pi-plus"
                                className="p-button-text p-button-sm"
                                onClick={() => addMenu(null)}
                            />
                            <Button
                                label={t.menudesigner_add_submenu || 'Add Submenu'}
                                icon="pi pi-plus"
                                className="p-button-text p-button-sm"
                                disabled={!selected}
                                onClick={() => selected && addMenu(selected.id)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3" style={{ maxHeight: 460 }}>
                        {!selected ? (
                            <div className="text-sm" style={{ color: colors.textMuted }}>
                                {t.menudesigner_select_hint || 'Add or select a menu item to edit it.'}
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold truncate">
                                        {(selectedLanguage && selected.caption_labels?.[selectedLanguage]) || selected.caption || selected.source_name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {/* Drives the SAME selectedLanguage the toolbar/canvas
                                            use - matches TableColumnDesignerModal's own dropdown. */}
                                        <Dropdown
                                            className="p-inputtext-sm"
                                            style={{ width: 90 }}
                                            value={selectedLanguage}
                                            options={enabledLanguages}
                                            onChange={(e) => onSelectLanguage(e.value)}
                                        />
                                        <Button
                                            icon="pi pi-code"
                                            className="p-button-text p-button-sm"
                                            onClick={() => setCodeEditorVisible(true)}
                                            tooltip={t.menudesigner_code || 'Code'}
                                            tooltipOptions={{ position: 'bottom' }}
                                        />
                                        <Button
                                            icon="pi pi-trash"
                                            className="p-button-text p-button-danger p-button-sm"
                                            onClick={() => deleteMenu(selected)}
                                            tooltip={t.menudesigner_delete_title || 'Delete Menu Item'}
                                            tooltipOptions={{ position: 'bottom' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1">{t.menudesigner_source_name || 'Control Name'}</label>
                                    <InputText
                                        className="w-full p-inputtext-sm"
                                        value={selected.source_name || ''}
                                        onChange={(e) => setMenus((prev) => prev.map((m) => (m.id === selected.id ? { ...m, source_name: e.target.value } : m)))}
                                        onBlur={(e) => updateMenuField(selected.id, { source_name: e.target.value || null })}
                                    />
                                </div>

                                <LanguageField
                                    label={t.menudesigner_caption || 'Caption'}
                                    value={(selectedLanguage && selected.caption_labels?.[selectedLanguage]) || selected.caption || ''}
                                    onChange={(v) => updateMenuField(selected.id, { caption: v, caption_labels: seedLanguageLabels(selected.caption_labels, v) })}
                                    onCopyToAll={() => {
                                        const current = (selectedLanguage && selected.caption_labels?.[selectedLanguage]) || selected.caption || '';
                                        updateMenuField(selected.id, { caption_labels: copyToAllLanguages(current) });
                                    }}
                                    copyTooltip={t.windowdesignerpanel_copy_to_all_languages || 'Copy to all languages'}
                                />
                            </>
                        )}
                    </div>
                </div>
            )}
        </Dialog>
        <WindowCodeEditorModal
            visible={codeEditorVisible}
            onHide={() => setCodeEditorVisible(false)}
            windowId={windowId}
            target={codeEditorTarget}
        />
        </>
    );
};

export default MenuBarDesignerModal;
