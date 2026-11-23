// resources/js/Components/Modals/WindowCodeEditorModal.tsx - SML code-behind
// editor for Windows/elements/controls. Reuses FileModal's CodeMirror 6
// integration (MultiLanguageCodeEditor) instead of introducing a second
// editor component - the 'sml' extension is resolved via a fake ".sml"
// filename, same mechanism FileModal already uses for every other language.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import { confirmDialog } from 'primereact/confirmdialog';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { apiClient } from '@/lib/api';
import { MultiLanguageCodeEditor } from '../Panels/FileModal';
import { getEventCatalog, eventLabel } from '@/lib/smlEvents';

interface EventState {
    id: number | null;
    code: string;
    dirty: boolean;
}

export interface WindowCodeEditorTarget {
    // 'window', a control_type/element_type string (e.g. 'button',
    // 'tab_container'), or 'menu' for a window menu bar item.
    kind: string;
    controlId?: number | null;
    elementId?: number | null;
    menuId?: number | null;
    label: string;
}

interface WindowCodeEditorModalProps {
    visible: boolean;
    onHide: () => void;
    windowId: number;
    target: WindowCodeEditorTarget | null;
}

const WindowCodeEditorModal: React.FC<WindowCodeEditorModalProps> = ({ visible, onHide, windowId, target }) => {
    const [currentLanguage] = useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);
    const { colors } = useTheme();
    const toast = useToast();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [events, setEvents] = useState<Record<string, EventState>>({});
    const [visibleNames, setVisibleNames] = useState<string[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [eventToAdd, setEventToAdd] = useState<string | null>(null);
    // 2026-09-06 follow-up: closing this modal (X, ESC, backdrop, or the
    // Cancel button) with unsaved edits used to silently discard them - a
    // window/control/element can have SEVERAL event tabs, each with its
    // own `dirty` flag (see EventState), so "any changes at all" is true
    // whenever ANY tab is dirty, not just the currently active one.
    const [closeConfirmVisible, setCloseConfirmVisible] = useState(false);
    const hasUnsavedChanges = Object.values(events).some((ev) => ev.dirty);

    const catalog = useMemo(() => getEventCatalog(target?.kind || 'window'), [target?.kind]);

    const controlId = target?.controlId ?? null;
    const elementId = target?.elementId ?? null;
    const menuId = target?.menuId ?? null;

    useEffect(() => {
        if (!visible || !target) return;

        let cancelled = false;
        setLoading(true);

        const params = new URLSearchParams();
        if (controlId != null) params.set('control_id', String(controlId));
        if (elementId != null) params.set('element_id', String(elementId));
        if (menuId != null) params.set('menu_id', String(menuId));
        const qs = params.toString();

        apiClient.get(`/windows/${windowId}/events${qs ? `?${qs}` : ''}`)
            .then((res) => {
                if (cancelled) return;
                const rows: Array<{ id: number; event_name: string; code: string | null }> = res?.data || [];
                const map: Record<string, EventState> = {};
                for (const name of catalog.defaults) {
                    map[name] = { id: null, code: '', dirty: false };
                }
                for (const row of rows) {
                    map[row.event_name] = { id: row.id, code: row.code || '', dirty: false };
                }
                const names = [
                    ...catalog.defaults,
                    ...Object.keys(map).filter(n => !catalog.defaults.includes(n)),
                ];
                setEvents(map);
                setVisibleNames(names);
                setActiveIndex(0);
            })
            .catch((err) => {
                if (!cancelled) toast.showError(t.windowcodeeditor_load_error || 'Failed to load code events');
                console.error(err);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [visible, target, windowId]);

    const handleCodeChange = useCallback((name: string, value: string) => {
        setEvents(prev => ({ ...prev, [name]: { ...prev[name], code: value, dirty: true } }));
    }, []);

    const persistEvent = useCallback(async (name: string) => {
        const ev = events[name];
        if (!ev) return;

        setSaving(true);
        try {
            const res = await apiClient.put(`/windows/${windowId}/events`, {
                control_id: controlId,
                element_id: elementId,
                menu_id: menuId,
                event_name: name,
                code: ev.code,
            });
            setEvents(prev => ({ ...prev, [name]: { id: res?.data?.id ?? prev[name].id, code: prev[name].code, dirty: false } }));
            toast.showSuccess(t.windowcodeeditor_saved || 'Code saved');
        } catch (err) {
            console.error(err);
            toast.showError(t.windowcodeeditor_save_error || 'Failed to save code');
        } finally {
            setSaving(false);
        }
    }, [events, windowId, controlId, elementId, menuId, toast, t]);

    // Saves EVERY dirty event tab (not just the active one - the "Save"
    // choice in the unsaved-changes prompt below means "save everything I
    // changed", same as VS Code's own "Save" on a multi-tab close prompt),
    // then actually closes. One shared `saving` lock/toast for the whole
    // batch instead of looping persistEvent() itself (which would toggle
    // the lock and show a toast once PER tab).
    const saveAllDirtyAndClose = useCallback(async () => {
        setSaving(true);
        try {
            const dirtyNames = Object.keys(events).filter((n) => events[n]?.dirty);
            for (const name of dirtyNames) {
                const ev = events[name];
                const res = await apiClient.put(`/windows/${windowId}/events`, {
                    control_id: controlId,
                    element_id: elementId,
                    menu_id: menuId,
                    event_name: name,
                    code: ev.code,
                });
                setEvents((prev) => ({ ...prev, [name]: { id: res?.data?.id ?? prev[name].id, code: prev[name].code, dirty: false } }));
            }
            toast.showSuccess(t.windowcodeeditor_saved || 'Code saved');
            setCloseConfirmVisible(false);
            onHide();
        } catch (err) {
            console.error(err);
            toast.showError(t.windowcodeeditor_save_error || 'Failed to save code');
            // Deliberately stays open (both this modal AND the confirm
            // prompt) on failure - closing anyway would be exactly the
            // silent-data-loss this whole feature exists to prevent.
        } finally {
            setSaving(false);
        }
    }, [events, windowId, controlId, elementId, menuId, toast, t, onHide]);

    const discardAndClose = useCallback(() => {
        setCloseConfirmVisible(false);
        onHide();
    }, [onHide]);

    // The one real "close" entry point for every path that can close this
    // modal (X button, ESC, backdrop click, the Cancel button) - routes
    // through the unsaved-changes prompt whenever there's something to
    // lose, so none of those paths can bypass it.
    const requestClose = useCallback(() => {
        if (saving) return;
        if (hasUnsavedChanges) {
            setCloseConfirmVisible(true);
        } else {
            onHide();
        }
    }, [saving, hasUnsavedChanges, onHide]);

    // Ctrl+S/Cmd+S saves the currently active event's code, same as clicking
    // the Save button - `preventDefault()` also stops the browser's own
    // native "Save Page As..." dialog, which would otherwise fire instead.
    // Only wired while this modal is actually open, so it never steals the
    // shortcut from the Window Designer canvas underneath.
    useEffect(() => {
        if (!visible) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                const name = visibleNames[activeIndex];
                if (name) persistEvent(name);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [visible, visibleNames, activeIndex, persistEvent]);

    const handleAddEvent = useCallback(() => {
        if (!eventToAdd) return;
        setEvents(prev => ({ ...prev, [eventToAdd]: { id: null, code: '', dirty: false } }));
        setVisibleNames(prev => [...prev, eventToAdd]);
        setActiveIndex(visibleNames.length);
        setEventToAdd(null);
    }, [eventToAdd, visibleNames.length]);

    const handleRemoveEvent = useCallback((name: string) => {
        const ev = events[name];
        confirmDialog({
            message: t.windowcodeeditor_remove_event_confirm || `Remove the "${eventLabel(catalog, name)}" event and its code?`,
            header: t.windowcodeeditor_remove_event || 'Remove Event',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                if (ev?.id != null) {
                    try {
                        await apiClient.delete(`/window-events/${ev.id}`);
                    } catch (err) {
                        console.error(err);
                        toast.showError(t.windowcodeeditor_save_error || 'Failed to remove event');
                        return;
                    }
                }
                setVisibleNames(prev => prev.filter(n => n !== name));
                setEvents(prev => {
                    const next = { ...prev };
                    delete next[name];
                    return next;
                });
                setActiveIndex(0);
            },
        });
    }, [events, catalog, t, toast]);

    if (!target) return null;

    const addableEvents = catalog.all.filter(e => !visibleNames.includes(e.name));

    return (
        <>
        <Dialog
            header={`${t.windowcodeeditor_title || 'Code'} - ${target.label}`}
            visible={visible}
            // A save here is one single small PUT (one event's code, not the
            // whole window) - it only takes a moment, so unlike the Window
            // Designer's own big save-lock modal this just ignores an
            // attempt to close mid-save rather than needing its own
            // progress bar (see the 2026-09-06 follow-up on item i).
            // `requestClose` (not a raw `onHide()`) additionally routes
            // through the unsaved-changes prompt below when there's
            // anything to lose - this covers EVERY way PrimeReact's own
            // Dialog can trigger onHide (X button, ESC, backdrop click),
            // not just the explicit Cancel button.
            onHide={requestClose}
            style={{ width: '900px' }}
            contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
            headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
            modal
            closable={!saving}
            draggable
            resizable
            maximizable
        >
            {loading ? (
                <div className="flex items-center justify-center p-8" style={{ color: colors.textMuted }}>
                    <i className="pi pi-spin pi-spinner mr-2" />
                    {t.windowcodeeditor_loading || 'Loading...'}
                </div>
            ) : (
                <div style={{ position: 'relative' }}>
                    {saving && (
                        <div
                            style={{
                                position: 'absolute', inset: 0, zIndex: 5,
                                backgroundColor: colors.bgPrimary, opacity: 0.7,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'wait',
                            }}
                        >
                            <i className="pi pi-spin pi-spinner mr-2" />
                            <span className="text-sm">{t.windowcodeeditor_saving || 'Saving...'}</span>
                        </div>
                    )}
                    <TabView activeIndex={activeIndex} onTabChange={(e) => { if (!saving) setActiveIndex(e.index); }}>
                        {visibleNames.map((name) => {
                            const isDefault = catalog.defaults.includes(name);
                            return (
                                <TabPanel
                                    key={name}
                                    header={eventLabel(catalog, name)}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs" style={{ color: colors.textMuted }}>
                                            {events[name]?.dirty ? (t.windowcodeeditor_unsaved_hint || 'Unsaved changes') : ''}
                                        </span>
                                        {!isDefault && (
                                            <Button
                                                icon="pi pi-trash"
                                                label={t.windowcodeeditor_remove_event || 'Remove Event'}
                                                className="p-button-text p-button-danger p-button-sm"
                                                onClick={() => handleRemoveEvent(name)}
                                                disabled={saving}
                                            />
                                        )}
                                    </div>
                                    <MultiLanguageCodeEditor
                                        value={events[name]?.code ?? ''}
                                        onChange={(v) => handleCodeChange(name, v)}
                                        fileName={`${name}.sml`}
                                    />
                                </TabPanel>
                            );
                        })}
                    </TabView>

                    <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center gap-2">
                            <Dropdown
                                value={eventToAdd}
                                onChange={(e) => setEventToAdd(e.value)}
                                options={addableEvents.map(e => ({ label: e.label, value: e.name }))}
                                placeholder={t.windowcodeeditor_add_event_placeholder || 'Add event...'}
                                className="w-56"
                                disabled={saving || addableEvents.length === 0}
                            />
                            <Button
                                icon="pi pi-plus"
                                label={t.windowcodeeditor_add_event || 'Add Event'}
                                className="p-button-secondary p-button-sm"
                                onClick={handleAddEvent}
                                disabled={saving || !eventToAdd}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button label={t.applicationsmodal432 || 'Cancel'} severity="secondary" onClick={requestClose} disabled={saving} />
                            <Button
                                label={t.windowcodeeditor_save || 'Save'}
                                severity="success"
                                icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                                disabled={saving || !visibleNames[activeIndex]}
                                onClick={() => visibleNames[activeIndex] && persistEvent(visibleNames[activeIndex])}
                            />
                        </div>
                    </div>
                </div>
            )}
        </Dialog>

        {/* Unsaved-changes prompt - VS Code's own "Save/Don't Save/Cancel"
            idiom, mapped onto the 3 outcomes actually requested: Save
            (persist every dirty tab, then close), Discard (close, keeping
            nothing), Cancel (close THIS prompt only - stays in the code
            editor, exactly as if the close had never been requested). A
            dedicated small Dialog rather than PrimeReact's generic
            confirmDialog() (already used for "Remove Event" above) - that
            primitive only models a 2-way accept/reject choice, not 3
            independently meaningful outcomes. */}
        <Dialog
            header={t.windowcodeeditor_unsaved_title || 'Unsaved Changes'}
            visible={closeConfirmVisible}
            onHide={() => setCloseConfirmVisible(false)}
            style={{ width: 420 }}
            contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
            headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
            modal
            closable={!saving}
        >
            <div className="text-sm mb-4">
                {(t.windowcodeeditor_unsaved_message || '"{name}" has been modified. Do you want to save the changes now?').replace('{name}', target?.label || '')}
            </div>
            <div className="flex justify-end gap-2">
                <Button
                    label={t.windowcodeeditor_discard_changes || 'Discard Changes'}
                    severity="danger"
                    className="p-button-outlined"
                    onClick={discardAndClose}
                    disabled={saving}
                />
                <Button
                    label={t.applicationsmodal432 || 'Cancel'}
                    severity="secondary"
                    onClick={() => setCloseConfirmVisible(false)}
                    disabled={saving}
                />
                <Button
                    label={t.windowcodeeditor_save || 'Save'}
                    severity="success"
                    icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                    onClick={saveAllDirtyAndClose}
                    disabled={saving}
                />
            </div>
        </Dialog>
        </>
    );
};

export default WindowCodeEditorModal;
