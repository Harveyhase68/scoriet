// resources/js/Components/Panels/WindowDesignerPanel.tsx - Visual designer for free, project-scoped Windows
import React, { useState, useEffect, useCallback, useMemo, useRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    BackgroundVariant,
    useNodesState,
    useEdgesState,
    useReactFlow,
    ReactFlowProvider,
    NodeResizer,
    SelectionMode,
    Node,
    Edge,
    NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { ProgressBar } from 'primereact/progressbar';
import TabOrderModal from '../Modals/TabOrderModal';
import TableColumnDesignerModal, { TableColumnDef } from '../Modals/TableColumnDesignerModal';
import { LanguageField } from './LanguageField';
import WindowCodeEditorModal, { WindowCodeEditorTarget } from '../Modals/WindowCodeEditorModal';
import ProcedureEditorModal from '../Modals/ProcedureEditorModal';
import GlobalVariablesModal from '../Modals/GlobalVariablesModal';
import MenuBarDesignerModal from '../Modals/MenuBarDesignerModal';
import AnchorSection from './AnchorSection';
import WindowExplorerSidebar from './WindowExplorerSidebar';
import { useToast } from '@/contexts/ToastContext';
import { useProject } from '@/contexts/ProjectContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SupportedLanguage, getStoredLanguage, Translations, tpl } from '@/i18n';
import { apiClient } from '@/lib/api';

// Stable reference for ReactFlow's multiSelectionKeyCode — must not be
// recreated each render, otherwise the internal store loops on updates.
const MULTI_SELECTION_KEYS = ['Control', 'Shift', 'Meta'];
const PAN_ON_DRAG_BUTTONS: number[] = [1, 2];

// WinDev's own coordinate system treats (0,0) as the top-left corner of the
// window's CLIENT area, immediately below the title bar - and canvas_width/
// canvas_height are that CLIENT area's size, not the outer window (verified
// 2026-08-17 against a real generated Flutter window: making Flutter's
// content area equal canvas_height exactly, with NO title-bar subtraction,
// is what produced a pixel-accurate match against the original WinDev
// window). So our frame box must GROW to canvas_height + this title bar, and
// every direct child of the window frame is shifted down by exactly this
// much within that taller box, or x=0/y=0 would land in the middle of the
// title bar instead of right under it. Nested children (inside a container/
// tab) don't need this — their container's own render position already
// carries the shift once.
const WINDOW_TITLEBAR_HEIGHT = 42;

// Matches SmlWindowContext.statusBarHeight in the Flutter runtime EXACTLY -
// the status bar ADDS this to the window's total height at runtime (the
// client area above it keeps its full canvas_height), so the design-time
// preview must grow the frame by the same amount, not shrink the existing
// content area, to show the real proportions the generated app will have.
const WINDOW_STATUSBAR_HEIGHT = 23;

// Matches the model's own toGTreeArray() fallback (`looper_row_height ?? 80`)
// and the import controller's minimum (max(20, ...)) - a freshly
// palette-dropped looper has no real content yet to size a row from, so it
// needs SOME starting value; imported loopers get their real height
// computed from their actual imported controls instead (see importWindev).
const LOOPER_DEFAULT_ROW_HEIGHT = 80;

// Caps how often [fn] actually runs: the first call in a burst fires
// immediately, later calls within [intervalMs] are coalesced into one
// trailing call once the interval elapses (so the LAST value in a burst is
// never dropped) - a native `<input type="color">` fires `onChange`
// continuously while being dragged, tens of times per second, and every
// call here feeds through a full canvas rebuild (buildNodes walks every
// element/control and replaces ReactFlow's entire node array via setNodes).
// A slow, deliberate color change never fires fast enough to matter; a fast
// drag can outpace React/ReactFlow's own reconciliation between one
// replace-the-whole-array setNodes and the next - and once that races,
// nothing else ever forces a fresh rebuild afterward, so the canvas stays
// broken until the window is reopened. Throttling the rebuild itself
// (rather than debouncing each individual color input) protects every
// caller of buildNodes centrally, present or future, not just this one
// reported symptom.
function useThrottledCallback<T extends (...args: any[]) => void>(fn: T, intervalMs: number): T {
    const fnRef = useRef(fn);
    fnRef.current = fn;
    const lastRunRef = useRef(0);
    const timerRef = useRef<number | null>(null);
    useEffect(() => () => { if (timerRef.current != null) window.clearTimeout(timerRef.current); }, []);
    return useCallback((...args: any[]) => {
        const now = Date.now();
        const remaining = intervalMs - (now - lastRunRef.current);
        if (timerRef.current != null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (remaining <= 0) {
            lastRunRef.current = now;
            fnRef.current(...args);
        } else {
            timerRef.current = window.setTimeout(() => {
                lastRunRef.current = Date.now();
                timerRef.current = null;
                fnRef.current(...args);
            }, remaining);
        }
    }, [intervalMs]) as T;
}

// ========== DATA TYPES ==========

interface WindowRow {
    id: number;
    project_id: number;
    category_id: number | null;
    name: string;
    display_name?: string | null;
    // Per-language translations of display_name (the window's own title-bar
    // caption) - same {lang_code: text} shape as UiWindowControl's
    // caption_labels/comment_labels/hint_labels. Added 2026-09-07 - the
    // window's own caption previously had NO per-language support at all,
    // unlike every control/tab caption.
    display_name_labels?: Record<string, string> | null;
    description?: string | null;
    schema_table_id?: number | null;
    canvas_width: number;
    canvas_height: number;
    background_color?: string | null;
    window_color?: string | null;
    text_color?: string | null;
    background_image?: string | null;
    // WinDev's Window.StatusBar property - `message(...)` writes text into
    // this bar at runtime (never a dialog - see sml_to_dart.js).
    has_status_bar?: boolean;
    is_active: boolean;
}

interface WindowElementRow {
    id: number;
    window_id: number;
    element_type: 'container' | 'group_box' | 'tab_container' | 'tab_panel' | 'looper' | 'looper_row';
    source_name?: string | null;
    parent_element_id?: number | null;
    x_position: number;
    y_position: number;
    width: number;
    height: number;
    anchor_right?: number | null;
    anchor_bottom?: number | null;
    anchor_width?: number | null;
    anchor_height?: number | null;
    container_orientation?: 'vertical' | 'horizontal' | null;
    container_columns?: number | null;
    container_gap?: number | null;
    tab_label?: string | null;
    tab_labels?: Record<string, string> | null;
    custom_style?: any;
    // tab_container-only styling - see the migration's comment for why this
    // stays scoped to the container instead of per tab_panel.
    background_color?: string | null;
    tab_active_background_color?: string | null;
    tab_inactive_background_color?: string | null;
    tab_active_text_color?: string | null;
    tab_inactive_text_color?: string | null;
    tab_font_family?: string | null;
    tab_font_size?: number | null;
    tab_font_bold?: boolean;
    tab_font_italic?: boolean;
    tab_font_underline?: boolean;
    tab_font_strikeout?: boolean;
    // Only meaningful for element_type = 'looper' - see the migration's
    // comment for why this lives on the looper itself, not its row.
    looper_row_height?: number | null;
    // Only meaningful for element_type = 'tab_container' - how tall the
    // tab strip itself renders in the Flutter template. Not exported by
    // WinDev, purely a Flutter-side visual knob.
    tab_strip_height?: number | null;
    sort_order: number;
    is_visible: boolean;
}

interface WindowMenuRow {
    id: number;
    window_id: number;
    parent_menu_id: number | null;
    source_name: string | null;
    caption: string | null;
    caption_labels: Record<string, string> | null;
    sort_order: number;
}

interface WindowControlRow {
    id?: number;
    _key: string; // stable client-side key, `ctrl-{id}` once saved or `ctrl-new-{n}` before
    window_id: number;
    container_element_id?: number | null;
    control_type: string;
    source_name?: string | null;
    schema_field_id?: number | null;
    x_position: number;
    y_position: number;
    width: number;
    height: number;
    anchor_right?: number | null;
    anchor_bottom?: number | null;
    anchor_width?: number | null;
    anchor_height?: number | null;
    caption_override?: string | null;
    caption_labels?: Record<string, string> | null;
    shortcut_enabled?: boolean;
    shortcut?: string | null;
    comment_override?: string | null;
    comment_labels?: Record<string, string> | null;
    hint_override?: string | null;
    hint_labels?: Record<string, string> | null;
    label_position?: 'top' | 'left' | 'right' | 'none' | null;
    label_width?: number | null;
    caption_position_horizontal?: 'left' | 'center' | 'right' | null;
    // 'inline_top'/'inline_bottom' (static_text only - see
    // static_text_border_style's own doc comment) make the caption break
    // through the control's own top/bottom border line (fieldset/legend
    // style) instead of sitting inside the box like 'top'/'middle'/'bottom'.
    caption_position_vertical?: 'top' | 'middle' | 'bottom' | 'inline_top' | 'inline_bottom' | null;
    caption_visible?: boolean;
    // static_text-only - Window Designer canvas preview only for now (not
    // yet read by the generated Flutter template).
    static_text_border_style?: 'none' | 'single' | 'double' | 'top' | 'bottom' | null;
    icon_position_horizontal?: 'left' | 'center' | 'right' | null;
    icon_position_vertical?: 'top' | 'middle' | 'bottom' | null;
    options?: { value: string; labels: Record<string, string> }[] | null;
    is_required?: boolean;
    control_state?: 'active' | 'display_only' | 'grayed' | null;
    data_binding?: string | null;
    browsed_file?: string | null;
    table_columns?: TableColumnDef[] | null;
    default_value?: string | null;
    min_value?: number | null;
    max_value?: number | null;
    step_value?: number | null;
    control_background_color?: string | null;
    control_text_color?: string | null;
    header_background_color?: string | null;
    header_text_color?: string | null;
    row_background_color_even?: string | null;
    row_height?: number | null;
    icon_class?: string | null;
    icon_data?: string | null;
    icon_state_count?: number | null;
    // Only meaningful for 'button' so far - whole-surface background image,
    // distinct from icon_data (the button's own icon/glyph). Takes
    // priority over control_background_color when set.
    background_image?: string | null;
    // Same WLangage ImageState concept icon_state_count already covers,
    // applied to background_image instead - see the migration's comment.
    background_image_states?: number | null;
    style_config?: any;
    font_family?: string | null;
    font_size?: number | null;
    font_bold?: boolean;
    font_italic?: boolean;
    font_underline?: boolean;
    font_strikeout?: boolean;
    sort_order: number;
    tab_order: number;
    is_visible: boolean;
}

interface SchemaFieldLite {
    id: number;
    field_name: string;
    field_type: string;
}

interface SchemaTableLite {
    id: number;
    table_name: string;
    fields?: SchemaFieldLite[];
}

// ========== CONTROL / ELEMENT CATALOG ==========
// Deliberately framework-agnostic (no per-language/framework gating yet, see
// project roadmap) — these are generic design-time widgets, not tied to any
// target stack (Flutter / C# / Spring Boot / Laravel / React etc.).

interface CatalogItem {
    type: string;
    icon: string;
    tKey: keyof Translations;
    fallback: string;
    w: number;
    h: number;
}

const ELEMENT_DEFS: CatalogItem[] = [
    { type: 'container', icon: 'pi-stop', tKey: 'windowdesignerpanel_container', fallback: 'Container', w: 260, h: 160 },
    { type: 'group_box', icon: 'pi-box', tKey: 'windowdesignerpanel_group_box', fallback: 'Group Box', w: 260, h: 160 },
    { type: 'tab_container', icon: 'pi-table', tKey: 'windowdesignerpanel_tab_container', fallback: 'Tab Container', w: 320, h: 220 },
    { type: 'looper', icon: 'pi-list', tKey: 'windowdesignerpanel_looper', fallback: 'Looper', w: 260, h: 260 },
];

// A freshly dropped element with no field name looks broken/unfinished, not
// "not yet named" — give it a sensible default immediately instead of
// leaving source_name null until the user thinks to set one.
const ELEMENT_NAME_PREFIXES: Record<string, string> = {
    container: 'CONTAINER',
    group_box: 'GROUPBOX',
    tab_container: 'TAB',
    looper: 'LOOPER',
};

const CONTROL_GROUPS: { tKey: keyof Translations; fallback: string; items: CatalogItem[] }[] = [
    {
        tKey: 'windowdesignerpanel_control_group_input', fallback: 'Input', items: [
            { type: 'text', icon: 'pi-pencil', tKey: 'windowdesignerpanel_control_text', fallback: 'Text', w: 200, h: 36 },
            { type: 'textarea', icon: 'pi-align-left', tKey: 'windowdesignerpanel_control_textarea', fallback: 'Multiline Text', w: 220, h: 80 },
            { type: 'password', icon: 'pi-lock', tKey: 'windowdesignerpanel_control_password', fallback: 'Password', w: 200, h: 36 },
            { type: 'number', icon: 'pi-hashtag', tKey: 'windowdesignerpanel_control_number', fallback: 'Number', w: 140, h: 36 },
            { type: 'decimal', icon: 'pi-percentage', tKey: 'windowdesignerpanel_control_decimal', fallback: 'Decimal', w: 140, h: 36 },
            { type: 'currency', icon: 'pi-dollar', tKey: 'windowdesignerpanel_control_currency', fallback: 'Currency', w: 160, h: 36 },
            { type: 'email', icon: 'pi-at', tKey: 'windowdesignerpanel_control_email', fallback: 'Email', w: 220, h: 36 },
            { type: 'phone', icon: 'pi-phone', tKey: 'windowdesignerpanel_control_phone', fallback: 'Phone', w: 180, h: 36 },
            { type: 'autocomplete', icon: 'pi-search', tKey: 'windowdesignerpanel_control_autocomplete', fallback: 'Autocomplete', w: 220, h: 36 },
        ],
    },
    {
        tKey: 'windowdesignerpanel_control_group_selection', fallback: 'Selection', items: [
            { type: 'dropdown', icon: 'pi-chevron-down', tKey: 'windowdesignerpanel_control_dropdown', fallback: 'Dropdown', w: 200, h: 36 },
            { type: 'multiselect', icon: 'pi-list', tKey: 'windowdesignerpanel_control_multiselect', fallback: 'Multi-Select', w: 220, h: 36 },
            { type: 'radio_group', icon: 'pi-circle', tKey: 'windowdesignerpanel_control_radio_group', fallback: 'Radio Group', w: 200, h: 90 },
            { type: 'radio_button', icon: 'pi-stop-circle', tKey: 'windowdesignerpanel_control_radio_button', fallback: 'Radio Button', w: 180, h: 28 },
            { type: 'checkbox', icon: 'pi-check-square', tKey: 'windowdesignerpanel_control_checkbox', fallback: 'Checkbox', w: 160, h: 32 },
            { type: 'checkbox_group', icon: 'pi-check-square', tKey: 'windowdesignerpanel_control_checkbox_group', fallback: 'Checkbox Group', w: 200, h: 90 },
            { type: 'switch', icon: 'pi-sliders-h', tKey: 'windowdesignerpanel_control_switch', fallback: 'Switch', w: 120, h: 32 },
            { type: 'slider', icon: 'pi-arrows-h', tKey: 'windowdesignerpanel_control_slider', fallback: 'Slider', w: 200, h: 36 },
            { type: 'rating', icon: 'pi-star', tKey: 'windowdesignerpanel_control_rating', fallback: 'Rating', w: 160, h: 32 },
        ],
    },
    {
        tKey: 'windowdesignerpanel_control_group_datetime', fallback: 'Date & Time', items: [
            { type: 'date', icon: 'pi-calendar', tKey: 'windowdesignerpanel_control_date', fallback: 'Date', w: 180, h: 36 },
            { type: 'time', icon: 'pi-clock', tKey: 'windowdesignerpanel_control_time', fallback: 'Time', w: 160, h: 36 },
            { type: 'datetime', icon: 'pi-calendar-plus', tKey: 'windowdesignerpanel_control_datetime', fallback: 'Date & Time', w: 200, h: 36 },
        ],
    },
    {
        tKey: 'windowdesignerpanel_control_group_media', fallback: 'File & Color', items: [
            { type: 'file_upload', icon: 'pi-upload', tKey: 'windowdesignerpanel_control_file_upload', fallback: 'File Upload', w: 220, h: 40 },
            { type: 'image_upload', icon: 'pi-image', tKey: 'windowdesignerpanel_control_image_upload', fallback: 'Image Upload', w: 160, h: 120 },
            { type: 'color_picker', icon: 'pi-palette', tKey: 'windowdesignerpanel_control_color_picker', fallback: 'Color Picker', w: 140, h: 36 },
        ],
    },
    {
        tKey: 'windowdesignerpanel_control_group_display', fallback: 'Display', items: [
            { type: 'static_text', icon: 'pi-align-left', tKey: 'windowdesignerpanel_control_static_text', fallback: 'Static Text', w: 180, h: 24 },
            { type: 'heading', icon: 'pi-bookmark', tKey: 'windowdesignerpanel_control_heading', fallback: 'Heading', w: 220, h: 32 },
            { type: 'image', icon: 'pi-image', tKey: 'windowdesignerpanel_control_image', fallback: 'Image', w: 160, h: 120 },
            { type: 'divider', icon: 'pi-minus', tKey: 'windowdesignerpanel_control_divider', fallback: 'Divider', w: 220, h: 8 },
            { type: 'spacer', icon: 'pi-arrows-v', tKey: 'windowdesignerpanel_control_spacer', fallback: 'Spacer', w: 100, h: 24 },
            { type: 'progress_bar', icon: 'pi-chart-bar', tKey: 'windowdesignerpanel_control_progress_bar', fallback: 'Progress Bar', w: 200, h: 16 },
            { type: 'badge', icon: 'pi-tag', tKey: 'windowdesignerpanel_control_badge', fallback: 'Badge', w: 80, h: 24 },
            { type: 'icon', icon: 'pi-star-fill', tKey: 'windowdesignerpanel_control_icon', fallback: 'Icon', w: 32, h: 32 },
            { type: 'table', icon: 'pi-table', tKey: 'windowdesignerpanel_control_table', fallback: 'Table', w: 320, h: 160 },
        ],
    },
    {
        tKey: 'windowdesignerpanel_control_group_action', fallback: 'Action', items: [
            { type: 'button', icon: 'pi-circle-fill', tKey: 'windowdesignerpanel_control_button', fallback: 'Button', w: 120, h: 36 },
            { type: 'link', icon: 'pi-link', tKey: 'windowdesignerpanel_control_link', fallback: 'Link', w: 120, h: 24 },
        ],
    },
];

// Same "never leave it looking broken/unnamed" reasoning as
// ELEMENT_NAME_PREFIXES above, one prefix per control type. WinDev itself
// only needs a handful of these (BTN/STC/EDT/...) because one WinDev "Edit"
// control covers text/number/date/etc. via a property, not a separate
// control type — we have far more distinct control types than WinDev does,
// so each gets its own short, distinct abbreviation instead of piling
// everything onto EDT.
const CONTROL_NAME_PREFIXES: Record<string, string> = {
    text: 'EDT',
    textarea: 'MEMO',
    password: 'PWD',
    number: 'NUM',
    decimal: 'DEC',
    currency: 'CUR',
    email: 'MAIL',
    phone: 'TEL',
    autocomplete: 'AC',
    dropdown: 'COMBO',
    multiselect: 'MULTI',
    radio_group: 'RADGRP',
    radio_button: 'RAD',
    checkbox: 'CHK',
    checkbox_group: 'CHKGRP',
    switch: 'SW',
    slider: 'SLD',
    rating: 'RATE',
    date: 'DATE',
    time: 'TIME',
    datetime: 'DTM',
    file_upload: 'FILE',
    image_upload: 'IMGUP',
    color_picker: 'COLOR',
    static_text: 'STC',
    heading: 'HEAD',
    image: 'IMG',
    divider: 'DIV',
    spacer: 'SPC',
    progress_bar: 'PROG',
    badge: 'BADGE',
    icon: 'ICO',
    table: 'TABLE',
    button: 'BTN',
    link: 'LNK',
};

// Auto-repairs any element/control that's missing its own source_name
// (2026-09-15 follow-up to the tab_panel-import fix) - a WinDev import
// used to leave every tab_panel/looper_row nameless (since fixed on the
// PHP side), and the user found that clearing one by hand directly in the
// database reproduces the exact same "Every control/element needs a name
// before saving" block with no way back into the Properties panel to fix
// it. Runs once right after loading a window, using the SAME naming
// conventions this designer already uses everywhere else: a plain
// container/group_box/tab_container/looper gets the next free
// ELEMENT_NAME_PREFIXES-based name (mirrors nextElementSourceName), a
// control gets the next free "{PREFIX}_NoNameN" (mirrors
// nextControlSourceName), and a tab_panel/looper_row - which has no
// meaningful name of its own in WinDev at all - gets
// "{parent's own name}.TABn"/"{parent's own name}.ROW", exactly matching
// createImportedTabPanel()/createImportedLooperRow()'s own PHP-side
// convention so a repaired name looks identical to a freshly-imported
// one. Returns null when nothing needed fixing (the overwhelmingly common
// case), so callers never trigger a state update / mark unsaved changes
// for no reason.
function fillMissingSourceNames(
    elements: WindowElementRow[],
    controls: WindowControlRow[],
): { elements: WindowElementRow[]; controls: WindowControlRow[] } | null {
    let changed = false;
    const usedElementNames = new Set(elements.map((e) => e.source_name).filter((n): n is string => !!n && n.trim() !== ''));

    const nextGenericElementName = (prefix: string): string => {
        if (!usedElementNames.has(prefix)) return prefix;
        let i = 1;
        while (usedElementNames.has(`${prefix}${i}`)) i++;
        return `${prefix}${i}`;
    };

    // Pass 1: every element type that does NOT derive its name from a
    // parent - must run first so pass 2's tab_panel/looper_row entries can
    // rely on their parent already having a real name by then, even if
    // THAT was also missing.
    const pass1 = elements.map((el) => {
        if ((el.source_name && el.source_name.trim()) || el.element_type === 'tab_panel' || el.element_type === 'looper_row') {
            return el;
        }
        const name = nextGenericElementName(ELEMENT_NAME_PREFIXES[el.element_type] || el.element_type.toUpperCase());
        usedElementNames.add(name);
        changed = true;
        return { ...el, source_name: name };
    });
    const byId = new Map(pass1.map((e) => [e.id, e]));

    // Pass 2: tab_panel/looper_row, named from their parent.
    const nextTabIndexByParent = new Map<number, number>();
    const finalElements = pass1.map((el) => {
        if (el.source_name && el.source_name.trim()) return el;
        const parentName = (el.parent_element_id != null ? byId.get(el.parent_element_id)?.source_name : null) || 'ELEMENT';
        let name: string;
        if (el.element_type === 'tab_panel') {
            let n = (nextTabIndexByParent.get(el.parent_element_id!) ?? 0) + 1;
            while (usedElementNames.has(`${parentName}.TAB${n}`)) n++;
            nextTabIndexByParent.set(el.parent_element_id!, n);
            name = `${parentName}.TAB${n}`;
        } else if (el.element_type === 'looper_row') {
            name = usedElementNames.has(`${parentName}.ROW`) ? nextGenericElementName(`${parentName}.ROW`) : `${parentName}.ROW`;
        } else {
            name = nextGenericElementName(ELEMENT_NAME_PREFIXES[el.element_type] || el.element_type.toUpperCase());
        }
        usedElementNames.add(name);
        changed = true;
        return { ...el, source_name: name };
    });

    const usedControlNames = new Set(controls.map((c) => c.source_name).filter((n): n is string => !!n && n.trim() !== ''));
    const finalControls = controls.map((c) => {
        if (c.source_name && c.source_name.trim()) return c;
        const prefix = CONTROL_NAME_PREFIXES[c.control_type] || c.control_type.toUpperCase();
        let i = 1;
        while (usedControlNames.has(`${prefix}_NoName${i}`)) i++;
        const name = `${prefix}_NoName${i}`;
        usedControlNames.add(name);
        changed = true;
        return { ...c, source_name: name };
    });

    return changed ? { elements: finalElements, controls: finalControls } : null;
}

const CONTROL_TYPES_WITH_OPTIONS = new Set(['dropdown', 'multiselect', 'radio_group', 'checkbox_group']);
const CONTROL_TYPES_WITH_MINMAX = new Set(['number', 'decimal', 'currency', 'slider', 'rating']);
const CONTROL_TYPES_WITH_ICON = new Set(['button', 'image', 'image_upload', 'icon']);
// Static-style controls render their own text directly and have no separate
// field label — they get caption alignment instead of a label position.
// Everything else with a caption falls back to label_position; purely
// visual/non-caption controls (divider, spacer, table, ...) get neither.
const CONTROL_TYPES_WITH_CAPTION_ALIGNMENT = new Set(['static_text', 'heading', 'button']);
const CONTROL_TYPES_WITH_LABEL_POSITION = new Set([
    'text', 'textarea', 'password', 'number', 'decimal', 'currency', 'email', 'phone', 'autocomplete',
    'dropdown', 'multiselect', 'radio_group', 'checkbox', 'checkbox_group', 'switch', 'slider', 'rating',
    'date', 'time', 'datetime', 'file_upload', 'image_upload', 'color_picker', 'table',
]);
const CAPTION_ALIGN_H_OPTIONS: { value: 'left' | 'center' | 'right'; labelKey: string; fallback: string }[] = [
    { value: 'left', labelKey: 'windowdesignerpanel_align_left', fallback: 'Left' },
    { value: 'center', labelKey: 'windowdesignerpanel_align_center', fallback: 'Center' },
    { value: 'right', labelKey: 'windowdesignerpanel_align_right', fallback: 'Right' },
];
const CAPTION_ALIGN_V_OPTIONS: { value: 'top' | 'middle' | 'bottom'; labelKey: string; fallback: string }[] = [
    { value: 'top', labelKey: 'windowdesignerpanel_align_top', fallback: 'Top' },
    { value: 'middle', labelKey: 'windowdesignerpanel_align_middle', fallback: 'Middle' },
    { value: 'bottom', labelKey: 'windowdesignerpanel_align_bottom', fallback: 'Bottom' },
];
// static_text-only additions to the Vertical Align dropdown - the caption
// breaks through the control's own top/bottom border line (fieldset/legend
// style) instead of sitting inside the box. Appended conditionally (never
// shown for button/heading, which share the same CAPTION_ALIGN_V_OPTIONS
// list above) - see WindowControlNode's own isInlineTop/isInlineBottom
// rendering.
const STATIC_TEXT_INLINE_V_OPTIONS: { value: 'inline_top' | 'inline_bottom'; labelKey: string; fallback: string }[] = [
    { value: 'inline_top', labelKey: 'windowdesignerpanel_align_inline_top', fallback: 'Inline (breaks top border)' },
    { value: 'inline_bottom', labelKey: 'windowdesignerpanel_align_inline_bottom', fallback: 'Inline (breaks bottom border)' },
];
// static_text-only border style - Window Designer canvas preview for now
// (not yet read by the generated Flutter template).
const STATIC_TEXT_BORDER_OPTIONS: { value: 'none' | 'single' | 'double' | 'top' | 'bottom'; labelKey: string; fallback: string }[] = [
    { value: 'none', labelKey: 'windowdesignerpanel_border_none', fallback: 'None' },
    { value: 'single', labelKey: 'windowdesignerpanel_border_single', fallback: 'Single Line' },
    { value: 'double', labelKey: 'windowdesignerpanel_border_double', fallback: 'Double Line' },
    { value: 'top', labelKey: 'windowdesignerpanel_border_top', fallback: 'Line (Top Only)' },
    { value: 'bottom', labelKey: 'windowdesignerpanel_border_bottom', fallback: 'Line (Bottom Only)' },
];

// Curated PrimeReact icon list (same set used for menu item icons elsewhere
// in the app, e.g. FormLayoutDesignerPanel's MENU_ICON_OPTIONS) — kept as a
// plain class suffix ("pi-print"), the `pi ` prefix is added at render time.
const ICON_CLASS_OPTIONS = [
    'pi-print', 'pi-table', 'pi-home', 'pi-cog', 'pi-users', 'pi-user', 'pi-folder', 'pi-file',
    'pi-chart-bar', 'pi-chart-line', 'pi-shopping-cart', 'pi-inbox', 'pi-envelope', 'pi-calendar',
    'pi-clock', 'pi-tag', 'pi-bookmark', 'pi-star', 'pi-heart', 'pi-globe', 'pi-database', 'pi-wrench',
    'pi-sliders-h', 'pi-list', 'pi-th-large', 'pi-minus', 'pi-arrows-alt', 'pi-check', 'pi-times',
    'pi-plus', 'pi-trash', 'pi-pencil', 'pi-search', 'pi-refresh', 'pi-save', 'pi-upload', 'pi-download',
    'pi-lock', 'pi-unlock', 'pi-eye', 'pi-eye-slash', 'pi-info-circle', 'pi-question-circle', 'pi-exclamation-triangle',
].map((v) => ({ label: v, value: v }));

const label = (t: Translations, key: keyof Translations, fallback: string): string => (t[key] as string) || fallback;

const readFileAsDataUri = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

// Extracts a WinDev-style keyboard accelerator out of a manually-typed
// button caption — a single "&" immediately before a letter marks that
// letter as the Alt-shortcut ("&Help" -> caption "Help", shortcut ALT+H).
// "&&" is WinDev's own escape for a literal ampersand and is left exactly
// as typed, never treated as a shortcut marker.
const AMPERSAND_PLACEHOLDER = '\u0000';
const extractAccessKey = (raw: string): { caption: string; shortcutEnabled: boolean; shortcut: string | null } => {
    const protectedText = raw.split('&&').join(AMPERSAND_PLACEHOLDER);
    const match = protectedText.match(/&([A-Za-z])/);
    const captionWithoutMarker = match ? protectedText.replace(/&([A-Za-z])/, '$1') : protectedText;
    const caption = captionWithoutMarker.split(AMPERSAND_PLACEHOLDER).join('&&');
    return match
        ? { caption, shortcutEnabled: true, shortcut: `ALT+${match[1].toUpperCase()}` }
        : { caption, shortcutEnabled: false, shortcut: null };
};

// ========== NODE COMPONENTS (defined outside for stable identity) ==========

interface ElementTabInfo {
    id: number;
    label: string;
}

interface ElementTabStyle {
    activeBg?: string | null;
    activeText?: string | null;
    inactiveBg?: string | null;
    inactiveText?: string | null;
    fontFamily?: string | null;
    fontSize?: number | null;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikeout?: boolean;
}

interface ElementNodeData {
    elementType: string;
    label: string;
    isVisible: boolean;
    tabs?: ElementTabInfo[];
    activeTabId?: number | null;
    onSelectTab?: (tabId: number) => void;
    onSelectContainer?: () => void;
    // Live-updates the currently visible tab_panel's own ReactFlow node size
    // in lockstep while the tab_container itself is being dragged bigger/
    // smaller (see NodeResizer's onResize below) - only meaningful for
    // elementType === 'tab_container'. A cheap, targeted single-node style
    // patch (not a full buildNodes() rebuild), so it stays flicker-free.
    onTabContainerResize?: (width: number, height: number) => void;
    // Live preview of the tab strip's own Active/Inactive Background/Font
    // Color/Font properties (Properties panel "Appearance" section) -
    // elementType === 'tab_container' only.
    tabStyle?: ElementTabStyle;
    // Live preview of the tab_container's own "Content Background" property
    // - meaningful for BOTH elementType === 'tab_container' (the box behind
    // the header strip) and elementType === 'tab_panel' (the page itself,
    // which resolves this from ITS OWN PARENT container - see the
    // migration's comment on why the field lives on the container).
    contentBackgroundColor?: string | null;
    // Only meaningful for elementType === 'looper' - drives the repeating
    // gray/divider background that visually previews "more rows continue
    // below" beneath the one real (white) row template on top of it.
    looperRowHeight?: number | null;
}

// Height of the tab-strip header drawn at the top of a tab_container's box —
// must match the backend's WindowDesignerController::TAB_HEADER_HEIGHT,
// which insets each synthesized tab_panel by exactly this much so the strip
// never overlaps the tab's own content. 34 matches WinDev's real tab header
// height (the exporter already subtracts it from every control's y).
const TAB_HEADER_HEIGHT = 34;

const WindowElementNode = React.memo(({ data, selected }: { data: ElementNodeData; selected?: boolean }) => {
    const showTabStrip = data.elementType === 'tab_container' && !!data.tabs && data.tabs.length > 0;
    // A tab page (or a looper's row template - same relationship, capped at
    // one child instead of N) is just the surface its controls sit on — it
    // isn't a separate "thing" the user needs reminding about (that's what
    // the tab strip / the looper's own floating label is for), so it gets
    // none of the other containers' editor chrome: no dashed placeholder
    // border/tint, no floating type label, and no resize handles (its size
    // is always dictated by its parent, never edited directly). Selecting
    // it still shows the normal blue outline. A tab_container that's
    // actually showing its strip gets the same plain treatment — the
    // container's own dashed/tinted "placeholder box" background sits
    // directly behind the page and would otherwise show right through it,
    // making a real, working tab look just as "under construction" as an
    // empty one. Only a genuinely empty tab_container (no pages yet) keeps
    // the dashed placeholder look. A solid (not literally transparent) grey
    // fill and a real border keep it visible against the window's own dark
    // canvas instead of disappearing into it.
    const isTabPanel = data.elementType === 'tab_panel';
    const isLooperRow = data.elementType === 'looper_row';
    const isLooper = data.elementType === 'looper';
    const isChildSurface = isTabPanel || isLooperRow;
    const isPlainSurface = isChildSurface || showTabStrip || isLooper;
    // A looper's own box previews the repeat: a real (white) row template
    // sits on top of this at (0,0) as its own separate node, so this only
    // needs to draw the GRAYED-OUT continuation underneath/around it - a
    // thin divider line every rowHeight px reads as "more rows like this
    // one continue below", not literally another editable row (nothing can
    // be placed there directly; see findContainerAt's redirect-to-row).
    const looperRowHeight = data.looperRowHeight || 80;
    const looperBackground = isLooper
        ? `repeating-linear-gradient(to bottom, rgba(107,114,128,0.22) 0px, rgba(107,114,128,0.22) ${looperRowHeight - 1}px, rgba(148,163,184,0.55) ${looperRowHeight - 1}px, rgba(148,163,184,0.55) ${looperRowHeight}px)`
        : undefined;
    // Live preview of the tab_container's own "Content Background" property
    // (see ElementNodeData.contentBackgroundColor's own doc comment) - a
    // tab_container/tab_panel with nothing set yet keeps the exact same
    // neutral placeholder tint every other container already had, so a
    // window with no custom colors looks unchanged.
    const contentBg = (showTabStrip || isTabPanel) ? data.contentBackgroundColor : null;
    const tabStyle = data.tabStyle;
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                border: selected ? '2px solid #3b82f6' : (isPlainSurface ? '1px solid rgba(148,163,184,0.35)' : '1px dashed rgba(148,163,184,0.6)'),
                borderRadius: isChildSurface ? 0 : 6,
                // The row template reads as the one real, editable surface -
                // distinctly lighter than every other container's neutral
                // gray tint, matching WinDev's own looper: row 1 white, the
                // rest a grayed-out preview.
                backgroundColor: contentBg || (isLooperRow ? 'rgba(255,255,255,0.92)' : (isPlainSurface && !isLooper ? 'rgba(148,163,184,0.08)' : 'rgba(59,130,246,0.06)')),
                backgroundImage: looperBackground,
                opacity: data.isVisible ? 1 : 0.4,
                position: 'relative',
            }}
        >
            {selected && !isChildSurface && (
                <NodeResizer
                    minWidth={80}
                    minHeight={40}
                    handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
                    lineStyle={{ borderWidth: 2 }}
                    onResize={(_event, params) => data.onTabContainerResize?.(params.width, params.height)}
                />
            )}
            {showTabStrip ? (
                <div
                    style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: TAB_HEADER_HEIGHT,
                        display: 'flex', alignItems: 'flex-end', gap: 2, padding: '4px 4px 0 4px',
                        backgroundColor: 'rgba(31,41,55,0.85)', borderBottom: '1px solid rgba(148,163,184,0.6)',
                        borderTopLeftRadius: 6, borderTopRightRadius: 6, boxSizing: 'border-box',
                    }}
                >
                    {/* Selects the tab_container itself (its own properties/anchor,
                        not any one page's) - every tab button below stopPropagation()s
                        so a tab click switches pages instead, and with enough/wide
                        tabs the scrollable strip can leave no empty space at all to
                        click otherwise. Pinned outside the scrollable tab list (not
                        just placed first) so it's always reachable regardless of how
                        many tabs there are. */}
                    <button
                        onClick={(e) => { e.stopPropagation(); data.onSelectContainer?.(); }}
                        title="Select tab container (its own properties/anchor)"
                        style={{
                            flexShrink: 0, padding: '3px 5px', marginBottom: 1, display: 'flex', alignItems: 'center',
                            color: '#9ca3af', backgroundColor: 'rgba(55,65,81,0.4)',
                            border: 'none', borderRadius: 3, cursor: 'pointer',
                        }}
                    >
                        <i className="pi pi-cog" style={{ fontSize: 10 }} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, overflowX: 'auto', minWidth: 0 }}>
                        {data.tabs!.map((tab) => {
                            const isActive = data.activeTabId === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={(e) => { e.stopPropagation(); data.onSelectTab?.(tab.id); }}
                                    style={{
                                        padding: '3px 8px', fontSize: tabStyle?.fontSize || 10, fontWeight: tabStyle?.bold ? 700 : (isActive ? 600 : 400),
                                        fontFamily: tabStyle?.fontFamily || undefined,
                                        fontStyle: tabStyle?.italic ? 'italic' : undefined,
                                        textDecoration: [tabStyle?.underline && 'underline', tabStyle?.strikeout && 'line-through'].filter(Boolean).join(' ') || undefined,
                                        color: (isActive ? tabStyle?.activeText : tabStyle?.inactiveText) || (isActive ? '#fff' : '#9ca3af'),
                                        backgroundColor: (isActive ? tabStyle?.activeBg : tabStyle?.inactiveBg) || (isActive ? 'rgba(59,130,246,0.6)' : 'rgba(55,65,81,0.4)'),
                                        border: 'none', borderTopLeftRadius: 3, borderTopRightRadius: 3,
                                        cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                                    }}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : !isChildSurface ? (
                <div
                    style={{
                        position: 'absolute', top: -9, left: 8, fontSize: 10, padding: '0 4px',
                        display: 'flex', alignItems: 'center', gap: 3,
                        backgroundColor: '#1f2937', color: '#93c5fd', borderRadius: 3, whiteSpace: 'nowrap',
                    }}
                >
                    {data.elementType === 'looper' && <i className="pi pi-list" style={{ fontSize: 9 }} />}
                    {data.label}
                </div>
            ) : null}
        </div>
    );
});
WindowElementNode.displayName = 'WindowElementNode';

// Renders a control's icon from exactly one of its two mutually exclusive
// sources (uploaded image / PrimeIcon class). When the image is a WinDev
// multi-state sprite (icon_state_count > 1 — several state bitmaps
// concatenated side by side: Idle/Pressed/Grayed/Selected/Hovered), only the
// first (Idle) frame is shown, via a CSS background-position crop rather
// than an actual server-side image cut — background-size stretches the
// whole strip to `stateCount` times the box width, so exactly one frame's
// width lands inside the box.
const IconPreview: React.FC<{ iconData?: string | null; iconClass?: string | null; stateCount?: number | null; size?: number }> = ({ iconData, iconClass, stateCount, size = 16 }) => {
    if (iconData) {
        if (stateCount && stateCount > 1) {
            return (
                <div
                    style={{
                        width: size, height: size, flexShrink: 0,
                        backgroundImage: `url(${iconData})`,
                        backgroundSize: `${stateCount * 100}% 100%`,
                        backgroundPosition: '0 0',
                        backgroundRepeat: 'no-repeat',
                    }}
                />
            );
        }
        return <img src={iconData} alt="" style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />;
    }
    if (iconClass) {
        return <i className={`pi ${iconClass}`} style={{ fontSize: size - 2, flexShrink: 0 }} />;
    }
    return null;
};

interface ControlNodeData {
    controlType: string;
    caption: string;
    isVisible: boolean;
    iconClass?: string | null;
    iconData?: string | null;
    iconStateCount?: number | null;
    // Only meaningful for 'button' - whole-surface backdrop, distinct from
    // iconData (the button's own icon/glyph).
    backgroundImage?: string | null;
    backgroundImageStates?: number | null;
    captionAlignH?: 'left' | 'center' | 'right' | null;
    captionAlignV?: 'top' | 'middle' | 'bottom' | 'inline_top' | 'inline_bottom' | null;
    labelPosition?: 'top' | 'left' | 'right' | 'none' | null;
    labelWidth?: number | null;
    // static_text-only - see WindowControlRow.static_text_border_style's
    // own doc comment.
    staticTextBorderStyle?: 'none' | 'single' | 'double' | 'top' | 'bottom' | null;
    controlBackgroundColor?: string | null;
    controlTextColor?: string | null;
    fontFamily?: string | null;
    fontSize?: number | null;
    fontBold?: boolean;
    fontItalic?: boolean;
    fontUnderline?: boolean;
    fontStrikeout?: boolean;
    controlState?: 'active' | 'display_only' | 'grayed' | null;
    tableColumns?: TableColumnDef[] | null;
    captionVisible?: boolean;
    iconPositionH?: 'left' | 'center' | 'right' | null;
    iconPositionV?: 'top' | 'middle' | 'bottom' | null;
    headerBackgroundColor?: string | null;
    headerTextColor?: string | null;
    rowBackgroundColorEven?: string | null;
    rowHeight?: number | null;
    optionLabels?: string[] | null;
}

const FLEX_JUSTIFY_FOR_ALIGN_H: Record<string, string> = { left: 'flex-start', center: 'center', right: 'flex-end' };
const FLEX_ALIGN_FOR_ALIGN_V: Record<string, string> = { top: 'flex-start', middle: 'center', bottom: 'flex-end' };

// Field-style controls render as a separate label + a generic placeholder box
// (mirrors FormLayoutDesignerPanel's FieldPlacementNode) — the caption is
// shown once, as the external label, not repeated inside the input mockup.
// checkbox/switch/radio_button keep their own single-line "toggle + text"
// rendering; image_upload is a block-shaped preview, not a single-line
// input, so it doesn't get wrapped here. `table` DOES (2026-09-07, item b -
// it already had both a Caption and a Label Position property in the
// Properties panel, but the canvas never actually drew that external label
// anywhere once real columns existed - the grid's OWN header row shows the
// COLUMN captions instead, a completely different thing from the table
// control's own external field label every other field-style control
// already gets) - the grid's own internal rendering (column headers/rows)
// is untouched, this only adds the external label wrapper around it.
const CONTROL_TYPES_LABEL_WRAP_ON_CANVAS = new Set([
    'text', 'textarea', 'password', 'number', 'decimal', 'currency', 'email', 'phone', 'autocomplete',
    'dropdown', 'multiselect', 'radio_group', 'checkbox_group', 'slider', 'rating',
    'date', 'time', 'datetime', 'file_upload', 'color_picker', 'table',
]);
const CONTROL_PLACEHOLDER: Record<string, string> = {
    text: 'Text input...', password: '••••••••', number: '123', decimal: '12.34', currency: '0.00',
    email: 'name@example.com', phone: '+1 555 0100', date: 'DD.MM.YYYY', time: 'HH:MM', datetime: 'DD.MM.YYYY HH:MM',
    textarea: 'Multiline text...', file_upload: 'Choose file...', dropdown: 'Select...', multiselect: 'Select...', autocomplete: 'Type to search...',
};

const WindowControlNode = React.memo(({ data, selected }: { data: ControlNodeData; selected?: boolean }) => {
    const { controlType, caption, isVisible, iconClass, iconData, iconStateCount, backgroundImage, backgroundImageStates, captionAlignH, captionAlignV, labelPosition, labelWidth, staticTextBorderStyle, controlBackgroundColor, controlTextColor, fontFamily, fontSize, fontBold, fontItalic, fontUnderline, fontStrikeout, controlState, tableColumns, captionVisible, iconPositionH, iconPositionV, headerBackgroundColor, headerTextColor, rowBackgroundColorEven, rowHeight, optionLabels } = data;
    // display_only/grayed (WLangage's ..State) get a visibly different look
    // from a fully active control, layered on top of (not instead of) the
    // existing is_visible dimming.
    const stateOpacity = controlState === 'grayed' ? 0.5 : controlState === 'display_only' ? 0.85 : 1;
    const opacity = (isVisible ? 1 : 0.4) * stateOpacity;
    const iconElement = <IconPreview iconData={iconData} iconClass={iconClass} stateCount={iconStateCount} size={16} />;
    // fontFamily/fontSize are genuinely nullable, so they only override a
    // branch's own default styling when actually set. font_bold/italic/
    // underline/strikeout are non-nullable booleans - always a definitive
    // true or false - so they must be asserted unconditionally, otherwise a
    // branch's own non-400/non-normal baseline (e.g. a button's hardcoded
    // fontWeight: 600 caption) can never be overridden back to "off".
    const fontOverrideStyle: React.CSSProperties = {
        ...(fontFamily ? { fontFamily } : {}),
        ...(fontSize ? { fontSize } : {}),
        fontWeight: fontBold ? 700 : 400,
        fontStyle: fontItalic ? 'italic' : 'normal',
        textDecoration: [fontUnderline && 'underline', fontStrikeout && 'line-through'].filter(Boolean).join(' ') || 'none',
    };

    let inner: React.ReactNode;
    if (controlType === 'checkbox' || controlType === 'switch' || controlType === 'radio_button') {
        const hasOwnItemLabel = !!optionLabels && optionLabels.length > 0;
        const itemLabel = hasOwnItemLabel ? optionLabels[0] : caption;
        inner = (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: '100%', paddingLeft: 4, backgroundColor: controlBackgroundColor || undefined }}>
                <div style={{ width: 16, height: 16, borderRadius: controlType === 'checkbox' ? 3 : 8, border: '1px solid #94a3b8', backgroundColor: controlType === 'switch' ? '#3b82f6' : 'transparent', flexShrink: 0 }} />
                {/* A checkbox's own item text comes from its first imported
                    checkbox_options entry when there is one - WinDev's
                    per-checkbox "caption" is usually empty; the top-level
                    caption field is instead an optional heading ABOVE the
                    whole control (see isLabelWrapped below), a different
                    concept entirely. Falls back to the plain caption prop
                    for manually-authored controls with no options at all,
                    respecting label_position 'none' only in that fallback
                    case - an imported item's own text is never optional.
                    controlTextColor, not a hardcoded light gray, since the
                    old hardcoded '#e5e7eb' was nearly invisible on a
                    light-background control (a common WinDev export). */}
                {hasOwnItemLabel ? (
                    <span style={{ fontSize: 11, color: controlTextColor || '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...fontOverrideStyle }}>{itemLabel}</span>
                ) : (labelPosition || 'top') !== 'none' && (
                    <span style={{ fontSize: 11, color: controlTextColor || '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...fontOverrideStyle }}>{caption}</span>
                )}
            </div>
        );
    } else if (controlType === 'table') {
        // Real pixel widths (not proportionally squeezed to fit the box) so
        // the mockup actually matches the source grid's own column layout —
        // a horizontal scrollbar appears if the columns don't all fit,
        // exactly like the real grid would need one too.
        inner = (
            <div style={{ width: '100%', height: '100%', border: '1px solid rgba(107,114,128,0.6)', borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: controlBackgroundColor || undefined, color: controlTextColor || undefined }}>
                {tableColumns && tableColumns.length > 0 ? (
                    <div style={{ display: 'flex', height: 22, flexShrink: 0, backgroundColor: headerBackgroundColor || 'rgba(107,114,128,0.35)', borderBottom: '1px solid rgba(107,114,128,0.6)', overflowX: 'auto', overflowY: 'hidden' }}>
                        {tableColumns.map((col, idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: col.width,
                                    flexShrink: 0,
                                    display: 'flex', alignItems: 'center',
                                    padding: '0 6px',
                                    fontSize: 10,
                                    fontWeight: col.font_bold ? 700 : 400,
                                    color: col.font_color || headerTextColor || '#e5e7eb',
                                    borderRight: idx < tableColumns.length - 1 ? '1px solid rgba(107,114,128,0.4)' : 'none',
                                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                                }}
                                title={col.caption}
                            >
                                {col.caption}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ height: 20, flexShrink: 0, backgroundColor: headerBackgroundColor || 'rgba(107,114,128,0.35)', display: 'flex', alignItems: 'center', paddingLeft: 6, fontSize: 10, color: headerTextColor || '#e5e7eb', borderBottom: '1px solid rgba(107,114,128,0.6)' }}>
                        <i className="pi pi-table" style={{ fontSize: 10, marginRight: 4 }} />
                        {caption}
                    </div>
                )}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    // Odd rows (i=0,2,4) just show the control's own
                    // background (already set on the outer wrapper) -
                    // only even rows (i=1,3,5) need their own color painted
                    // on top. Fixed pixel height (WinDev's line_height, or a
                    // sensible default) instead of splitting the remaining
                    // space evenly, so the row count in the preview reflects
                    // the real row height — the box's own overflow:hidden
                    // clips whatever doesn't fit.
                    <div key={i} style={{ height: rowHeight || 20, flexShrink: 0, backgroundColor: i % 2 === 1 ? (rowBackgroundColorEven || undefined) : undefined, borderBottom: '1px solid rgba(107,114,128,0.25)' }} />
                ))}
            </div>
        );
    } else if (controlType === 'button') {
        // Icon and caption are positioned FULLY INDEPENDENTLY of each other
        // (2026-09-19 fix) - confirmed real from a WinDev export where a
        // single button carries BOTH `image_display`/`vertical_image_pos`/
        // `horizontal_image_pos` (-> iconPositionV/iconPositionH, "Icon
        // Vertical"/"Icon Horizontal" below) AND, completely separately,
        // `caption_display`/`vertical_display_pos`/`horizontal_display_pos`
        // (-> captionAlignV/captionAlignH, "Caption Vertical"/"Caption
        // Horizontal") with DIFFERENT values for each (icon centered, caption
        // top-center) - two independent WinDev positioning systems, not one
        // shared "icon rides along next to the caption" layout. The previous
        // version used ONE flex row/column for both, driven only by the
        // caption's own alignment (iconPositionH/V only decided which SIDE
        // of the caption the icon sat on) - so changing the caption's
        // alignment always dragged the icon along with it, and Icon Side/
        // Icon Row had no independent effect at all. Two same-size, stacked,
        // absolutely-positioned layers fixes this outright: each one only
        // ever centers ITS OWN content per ITS OWN alignment setting, with
        // zero interaction between them - exactly like the real WinDev
        // model, including a configuration where they visually overlap
        // (e.g. both centered) if that's genuinely what's configured.
        const showCaption = captionVisible !== false;
        inner = (
            <div
                style={{
                    position: 'relative',
                    height: '100%', borderRadius: 5, overflow: 'hidden',
                    // backgroundImage takes priority over backgroundColor,
                    // same rule as the Flutter template's own
                    // buildRudimentaryControl - only one of the two ever
                    // actually applies. State-cropping (only the first/
                    // Idle frame) is the exact same technique IconPreview
                    // uses for a button's own icon above, just applied to
                    // the whole button surface instead of one small glyph.
                    ...(backgroundImage
                        ? {
                            backgroundImage: `url(${backgroundImage})`,
                            backgroundSize: `${(backgroundImageStates && backgroundImageStates > 1 ? backgroundImageStates : 1) * 100}% 100%`,
                            backgroundPosition: '0 0',
                            backgroundRepeat: 'no-repeat',
                        }
                        : { backgroundColor: controlBackgroundColor || '#3b82f6' }),
                    color: controlTextColor || '#fff',
                    fontSize: 12, fontWeight: 600,
                    ...fontOverrideStyle,
                }}
            >
                <div
                    style={{
                        position: 'absolute', inset: 0, display: 'flex', padding: 4,
                        // 'left' (not 'center') matches this same field's own
                        // displayed default in the Properties panel's Icon
                        // Horizontal dropdown, and the previous "icon rides
                        // before the caption" default this replaces.
                        justifyContent: FLEX_JUSTIFY_FOR_ALIGN_H[iconPositionH || 'left'] || 'flex-start',
                        alignItems: FLEX_ALIGN_FOR_ALIGN_V[iconPositionV || 'middle'] || 'center',
                        pointerEvents: 'none',
                    }}
                >
                    {iconElement}
                </div>
                {showCaption && (
                    <div
                        style={{
                            position: 'absolute', inset: 0, display: 'flex', padding: '0 6px',
                            justifyContent: FLEX_JUSTIFY_FOR_ALIGN_H[captionAlignH || 'center'] || 'center',
                            alignItems: FLEX_ALIGN_FOR_ALIGN_V[captionAlignV || 'middle'] || 'center',
                            pointerEvents: 'none',
                        }}
                    >
                        {/* justifyContent/alignItems above only center this whole
                            text block as one flex item - once it's forced to wrap
                            (too long for the button), each wrapped LINE still
                            defaults to browser text-align:left within that block,
                            which left later lines looking left-justified under an
                            otherwise-centered first line. text-align here (same
                            captionAlignH the block-level centering already uses)
                            fixes the lines' own alignment inside the block. */}
                        <span style={{ textAlign: (captionAlignH as any) || 'center', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{caption}</span>
                    </div>
                )}
            </div>
        );
    } else if (controlType === 'static_text' || controlType === 'heading' || controlType === 'link') {
        const isAlignable = controlType === 'static_text' || controlType === 'heading';
        // static_text keeps its caption's own line breaks (CRLF/LF alike -
        // the browser's line-break handling treats \r\n as one break under
        // pre-wrap, same as a plain \n) instead of collapsing to one line -
        // WinDev static_text captions are routinely multi-line. Position
        // (above/inside the box, per label_position) is a later step; for
        // now this only fixes the line breaks within the box as it already
        // is. heading/link are unaffected - not part of this request, and
        // multi-line would need extra care for e.g. heading's larger font.
        const preservesLineBreaks = controlType === 'static_text';
        // Border + "Inline" caption (2026-09-06 follow-up, items c/d) -
        // static_text only, Window Designer canvas preview only (the
        // generated Flutter output doesn't read either field yet).
        const isStaticText = controlType === 'static_text';
        const borderStyle = isStaticText ? (staticTextBorderStyle || 'none') : 'none';
        const borderColor = controlTextColor || '#9ca3af';
        const isInlineTop = isStaticText && captionAlignV === 'inline_top';
        const isInlineBottom = isStaticText && captionAlignV === 'inline_bottom';
        const legendAlign: React.CSSProperties =
            captionAlignH === 'center' ? { marginLeft: 'auto', marginRight: 'auto' } :
            captionAlignH === 'right' ? { marginLeft: 'auto' } : {};

        if (isInlineTop) {
            // A real `<fieldset>`/`<legend>` gives exactly the requested
            // "line breaks before the caption, continues after it" effect
            // natively (the same rendering an HTML form's own fieldset
            // legend has always had) - including `text-align` on the
            // legend for left/center/right, so no hand-rolled "erase a gap
            // in the line" trick is needed for the TOP edge specifically.
            inner = (
                <fieldset
                    style={{
                        margin: 0, height: '100%', boxSizing: 'border-box', minWidth: 0,
                        padding: '2px 6px 4px',
                        border: borderStyle === 'double' ? `3px double ${borderColor}` : borderStyle === 'none' ? 'none' : `1px solid ${borderColor}`,
                        borderBottom: borderStyle === 'top' ? 'none' : undefined,
                        color: controlTextColor || '#e5e7eb',
                        overflow: 'hidden',
                    }}
                >
                    <legend style={{ padding: '0 4px', fontSize: 12, textAlign: (captionAlignH as any) || 'left', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...legendAlign, ...fontOverrideStyle }}>
                        {caption}
                    </legend>
                </fieldset>
            );
        } else if (isInlineBottom) {
            // No native HTML element breaks a BOTTOM border the way
            // `<legend>` breaks a top one - built by hand instead: the box's
            // own top/left/right edges (if any) draw normally, and the
            // bottom edge is one continuous line UNDER a caption `<span>`
            // painted with the box's own background color, which visually
            // "erases" the short line segment directly behind the text,
            // reading as the line breaking around the caption.
            inner = (
                <div
                    style={{
                        position: 'relative', height: '100%', boxSizing: 'border-box',
                        borderLeft: borderStyle === 'single' || borderStyle === 'double' ? (borderStyle === 'double' ? `3px double ${borderColor}` : `1px solid ${borderColor}`) : undefined,
                        borderRight: borderStyle === 'single' || borderStyle === 'double' ? (borderStyle === 'double' ? `3px double ${borderColor}` : `1px solid ${borderColor}`) : undefined,
                        borderTop: borderStyle === 'single' || borderStyle === 'double' ? (borderStyle === 'double' ? `3px double ${borderColor}` : `1px solid ${borderColor}`) : undefined,
                        color: controlTextColor || '#e5e7eb',
                        overflow: 'hidden',
                    }}
                >
                    {borderStyle !== 'none' && (
                        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 6, borderBottom: borderStyle === 'double' ? `3px double ${borderColor}` : `1px solid ${borderColor}` }} />
                    )}
                    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: FLEX_JUSTIFY_FOR_ALIGN_H[captionAlignH || 'left'] || 'flex-start', padding: '0 6px' }}>
                        <span style={{ padding: '0 4px', fontSize: 12, backgroundColor: controlBackgroundColor || '#1e1e2e', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...fontOverrideStyle }}>
                            {caption}
                        </span>
                    </div>
                </div>
            );
        } else {
            inner = (
                <div
                    style={{
                        display: 'flex',
                        alignItems: isAlignable ? (FLEX_ALIGN_FOR_ALIGN_V[captionAlignV || 'top'] || 'flex-start') : 'center',
                        justifyContent: isAlignable ? (FLEX_JUSTIFY_FOR_ALIGN_H[captionAlignH || 'left'] || 'flex-start') : 'flex-start',
                        // `justifyContent` above only centers/right-aligns the
                        // caption's own bounding BOX as one flex item - it says
                        // nothing about how the individual lines WITHIN that box
                        // align once the caption wraps to 2+ lines (a single
                        // short line looked centered only because the whole
                        // one-line box was centered, not because the text itself
                        // was). `textAlign` is what actually centers each
                        // wrapped line - matches the Flutter template, which
                        // already sets both.
                        textAlign: (isAlignable ? (captionAlignH as any) : undefined) || undefined,
                        height: '100%',
                        boxSizing: 'border-box',
                        backgroundColor: controlBackgroundColor || undefined,
                        fontSize: controlType === 'heading' ? 16 : 12,
                        fontWeight: controlType === 'heading' ? 700 : 400,
                        color: controlTextColor || (controlType === 'link' ? '#60a5fa' : '#e5e7eb'),
                        textDecoration: controlType === 'link' ? 'underline' : 'none',
                        overflow: 'hidden',
                        whiteSpace: preservesLineBreaks ? 'pre-wrap' : 'nowrap',
                        border: borderStyle === 'none' ? undefined
                            : borderStyle === 'single' ? `1px solid ${borderColor}`
                            : borderStyle === 'double' ? `3px double ${borderColor}`
                            : undefined,
                        borderTop: borderStyle === 'top' ? `1px solid ${borderColor}` : undefined,
                        borderBottom: borderStyle === 'bottom' ? `1px solid ${borderColor}` : undefined,
                        ...fontOverrideStyle,
                    }}
                >
                    {caption}
                </div>
            );
        }
    } else if (controlType === 'divider') {
        inner = <div style={{ width: '100%', height: 1, backgroundColor: '#6b7280', marginTop: '50%' }} />;
    } else if (controlType === 'spacer') {
        inner = <div style={{ width: '100%', height: '100%', border: '1px dashed rgba(148,163,184,0.3)', borderRadius: 4 }} />;
    } else if (controlType === 'image' || controlType === 'image_upload') {
        // `controlBackgroundColor` was previously never read here at all -
        // an Image control's own "Background Color" property (same generic
        // Appearance field every control type shares) silently had zero
        // visual effect on the canvas. A real `<img>` with `objectFit:
        // 'contain'` routinely leaves empty space around it (any aspect
        // ratio other than an exact fill, or a transparent PNG) - that
        // space is where the color actually shows.
        inner = iconData ? (
            iconStateCount && iconStateCount > 1 ? (
                <div style={{ width: '100%', height: '100%', backgroundColor: controlBackgroundColor || undefined, backgroundImage: `url(${iconData})`, backgroundSize: `${iconStateCount * 100}% 100%`, backgroundPosition: '0 0', backgroundRepeat: 'no-repeat' }} />
            ) : (
                <div style={{ width: '100%', height: '100%', backgroundColor: controlBackgroundColor || undefined, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={iconData} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
            )
        ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: controlBackgroundColor || 'rgba(107,114,128,0.15)', border: '1px dashed #6b7280', borderRadius: 4 }}>
                {iconClass ? <i className={`pi ${iconClass}`} style={{ fontSize: 20, color: '#6b7280' }} /> : <i className="pi pi-image" style={{ fontSize: 20, color: '#6b7280' }} />}
            </div>
        );
    } else if (controlType === 'progress_bar') {
        inner = (
            <div style={{ width: '100%', height: '100%', backgroundColor: 'rgba(107,114,128,0.3)', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ width: '60%', height: '100%', backgroundColor: '#3b82f6' }} />
            </div>
        );
    } else if (controlType === 'badge') {
        inner = (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 8px', borderRadius: 10, backgroundColor: '#3b82f6', color: '#fff', fontSize: 10 }}>
                {caption}
            </div>
        );
    } else if (controlType === 'icon') {
        inner = (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {iconData || iconClass ? <IconPreview iconData={iconData} iconClass={iconClass} stateCount={iconStateCount} size={18} /> : <i className="pi pi-star-fill" style={{ fontSize: 18, color: '#f59e0b' }} />}
            </div>
        );
    } else if (controlType === 'textarea') {
        inner = (
            <div style={{ width: '100%', height: '100%', borderRadius: 4, border: '1px solid rgba(107,114,128,0.5)', backgroundColor: controlBackgroundColor || 'rgba(17,24,39,0.4)', padding: '4px 6px' }}>
                <span style={{ fontSize: 10, color: controlTextColor || '#6b7280' }}>{CONTROL_PLACEHOLDER.textarea}</span>
            </div>
        );
    } else if (controlType === 'radio_group' || controlType === 'checkbox_group') {
        // Real imported option captions when present (e.g. WinDev's
        // radio_options on a type-6 control promoted to radio_group on
        // import), otherwise the generic "Option N" mockup.
        const displayOptions = optionLabels && optionLabels.length > 0 ? optionLabels : ['Option 1', 'Option 2', 'Option 3'];
        inner = (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '2px 4px' }}>
                {displayOptions.map((label, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 12, height: 12, flexShrink: 0, borderRadius: controlType === 'radio_group' ? 6 : 2, border: '1px solid #94a3b8' }} />
                        <span style={{ fontSize: 10, color: controlTextColor || '#9ca3af', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{label}</span>
                    </div>
                ))}
            </div>
        );
    } else if (controlType === 'slider') {
        inner = (
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <div style={{ width: '100%', height: 4, backgroundColor: '#4b5563', borderRadius: 2, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '40%', top: -5, width: 14, height: 14, borderRadius: 7, backgroundColor: '#3b82f6' }} />
                </div>
            </div>
        );
    } else if (controlType === 'rating') {
        inner = (
            <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: '100%' }}>
                {[0, 1, 2, 3, 4].map((i) => <i key={i} className={`pi ${i < 3 ? 'pi-star-fill' : 'pi-star'}`} style={{ fontSize: 12, color: '#f59e0b' }} />)}
            </div>
        );
    } else if (controlType === 'color_picker') {
        inner = (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 4 }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: '#3b82f6', border: '1px solid #1f2937' }} />
                <span style={{ fontSize: 10, color: '#9ca3af' }}>#3b82f6</span>
            </div>
        );
    } else if (controlType === 'file_upload') {
        inner = (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '0 6px', border: '1px dashed #6b7280', backgroundColor: controlBackgroundColor || undefined, borderRadius: 4 }}>
                <i className="pi pi-upload" style={{ fontSize: 12, color: controlTextColor || '#9ca3af' }} />
                <span style={{ fontSize: 10, color: controlTextColor || '#6b7280' }}>{CONTROL_PLACEHOLDER.file_upload}</span>
            </div>
        );
    } else if (controlType === 'dropdown' || controlType === 'multiselect' || controlType === 'autocomplete') {
        inner = (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px', borderRadius: 4, border: '1px solid rgba(107,114,128,0.5)', backgroundColor: controlBackgroundColor || 'rgba(17,24,39,0.4)' }}>
                <span style={{ fontSize: 10, color: controlTextColor || '#6b7280', overflow: 'hidden', whiteSpace: 'nowrap' }}>{CONTROL_PLACEHOLDER[controlType] || 'Select...'}</span>
                <span style={{ fontSize: 8, color: controlTextColor || '#9ca3af' }}>▼</span>
            </div>
        );
    } else {
        // Generic text-like input: text, password, number, decimal, currency, email, phone, date, time, datetime
        inner = (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: '0 6px', borderRadius: 4, border: '1px solid rgba(107,114,128,0.5)', backgroundColor: controlBackgroundColor || 'rgba(17,24,39,0.4)' }}>
                <span style={{ fontSize: 10, color: controlTextColor || '#6b7280', overflow: 'hidden', whiteSpace: 'nowrap' }}>{CONTROL_PLACEHOLDER[controlType] || 'Text input...'}</span>
            </div>
        );
    }

    // A plain checkbox isn't in CONTROL_TYPES_LABEL_WRAP_ON_CANVAS (its
    // own item text renders inline, next to the toggle, not as a separate
    // field-style label) - but an imported one can still carry an optional
    // top-level heading (WinDev's display_caption/caption) shown ABOVE the
    // checkbox row, which reuses the exact same wrap mechanism. Manually-
    // authored checkboxes (no options at all) never get this - there the
    // caption already IS the inline item text, wrapping it too would show
    // it twice.
    const checkboxHasHeading = controlType === 'checkbox' && !!optionLabels && optionLabels.length > 0;
    const isLabelWrapped = (CONTROL_TYPES_LABEL_WRAP_ON_CANVAS.has(controlType) || checkboxHasHeading) && (labelPosition || 'top') !== 'none';

    return (
        <div style={{ width: '100%', height: '100%', opacity, cursor: 'grab' }}>
            {selected && <NodeResizer minWidth={20} minHeight={16} handleStyle={{ width: 7, height: 7, borderRadius: 2 }} lineStyle={{ borderWidth: 2, borderColor: '#fbbf24' }} />}
            {isLabelWrapped ? (
                <div style={{ display: 'flex', flexDirection: labelPosition === 'top' ? 'column' : 'row', width: '100%', height: '100%', gap: 4 }}>
                    <div style={labelPosition === 'left' ? { width: labelWidth || 100, flexShrink: 0, display: 'flex', alignItems: 'center' } : {}}>
                        <span style={{ fontSize: 11, color: controlTextColor || '#e5e7eb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', ...fontOverrideStyle }}>{caption}</span>
                    </div>
                    {/* A field-style control's input fills the remaining
                        space below its label (flex: 1) - but a checkbox's
                        heading-wrap is different: the checkbox+item row is a
                        single fixed-height line that belongs right under the
                        heading, not stretched/vertically centered across
                        whatever's left of the control's own (often much
                        taller, WinDev-exported-as-a-group-box-sized)
                        bounding box. */}
                    <div style={checkboxHasHeading ? { flexShrink: 0, height: 20 } : { flex: 1, minWidth: 0, minHeight: 0 }}>{inner}</div>
                </div>
            ) : inner}
        </div>
    );
});
WindowControlNode.displayName = 'WindowControlNode';

interface WindowFrameNodeData {
    label: string;
    width: number;
    height: number;
    backgroundColor?: string | null;
    windowColor?: string | null;
    textColor?: string | null;
    backgroundImage?: string | null;
    hasStatusBar?: boolean;
    // WindowFrameNode is a module-level component (React Flow custom nodes
    // can't reach into WindowDesignerInner's own scope), so the current
    // translations have to travel in via `data` like everything else here -
    // same rule as every other custom node in this file.
    statusBarLabel?: string;
    // Read-only canvas preview of the window's own menu bar (see
    // MenuBarDesignerModal.tsx for actual editing) - flat list, the tree is
    // rebuilt locally via buildMenuPreviewTree().
    menus?: WindowMenuRow[];
    selectedLanguage?: string;
}

interface WindowMenuPreviewNode {
    id: number;
    label: string;
    children: WindowMenuPreviewNode[];
}

const buildMenuPreviewTree = (menus: WindowMenuRow[] | undefined, selectedLanguage?: string): WindowMenuPreviewNode[] => {
    if (!menus || menus.length === 0) return [];
    const nodeMap = new Map<number, WindowMenuPreviewNode>();
    menus.forEach((m) => {
        const label = (selectedLanguage && m.caption_labels?.[selectedLanguage]) || m.caption || m.source_name || `#${m.id}`;
        nodeMap.set(m.id, { id: m.id, label, children: [] });
    });

    const roots: WindowMenuPreviewNode[] = [];
    menus
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .forEach((m) => {
            const node = nodeMap.get(m.id)!;
            const parent = m.parent_menu_id != null ? nodeMap.get(m.parent_menu_id) : undefined;
            if (parent) {
                parent.children.push(node);
            } else {
                roots.push(node);
            }
        });

    return roots;
};

// A real OS menu's dropdown/flyout is meant to escape its own window's
// bounds entirely - rendering it as a plain absolutely-positioned child
// would get clipped by the frame's own `overflow: hidden` (needed for its
// rounded corners/background image) AND, one level up, `position: fixed`
// does NOT escape a React Flow node's pan/zoom `transform` wrapper per the
// CSS spec (a transformed ancestor becomes the containing block for fixed
// descendants). So only the OUTERMOST list is portaled straight to
// `document.body` and positioned from the trigger's real viewport rect;
// every nested flyout after that is a perfectly ordinary CSS
// position:absolute child of its own row, since by then it's already
// outside the transformed canvas entirely.
const MenuFlyoutList: React.FC<{ items: WindowMenuPreviewNode[]; onLeafClick: () => void; root?: boolean }> = ({ items, onLeafClick, root }) => {
    const [openChildId, setOpenChildId] = useState<number | null>(null);

    return (
        <div
            style={{
                ...(root ? {} : { position: 'absolute' as const, top: 0, left: '100%' }),
                minWidth: 180,
                backgroundColor: '#2a2a3a',
                border: '1px solid #4b5563',
                borderRadius: 4,
                boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
                padding: '4px 0',
            }}
            onMouseLeave={() => setOpenChildId(null)}
        >
            {items.map((item) => (
                <div key={item.id} style={{ position: 'relative' }}>
                    <div
                        onMouseEnter={() => setOpenChildId(item.children.length > 0 ? item.id : null)}
                        onClick={(e) => { e.stopPropagation(); if (item.children.length === 0) onLeafClick(); }}
                        style={{
                            padding: '6px 14px',
                            fontSize: 12,
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 16,
                            whiteSpace: 'nowrap',
                            backgroundColor: openChildId === item.id ? 'rgba(255,255,255,0.12)' : 'transparent',
                        }}
                    >
                        <span>{item.label}</span>
                        {item.children.length > 0 && <span style={{ opacity: 0.6, fontSize: 10 }}>&#9656;</span>}
                    </div>
                    {openChildId === item.id && item.children.length > 0 && (
                        <MenuFlyoutList items={item.children} onLeafClick={onLeafClick} />
                    )}
                </div>
            ))}
        </div>
    );
};

// Same "fake OS window" chrome as FormLayoutDesignerPanel's WindowFrameNode
// (macOS-style traffic-light dots + title bar) so Forms and Windows read as
// the same design language instead of Windows getting a bare dashed outline.
const WindowFrameNode = React.memo(({ data }: { data: WindowFrameNodeData }) => {
    const menuTree = useMemo(() => buildMenuPreviewTree(data.menus, data.selectedLanguage), [data.menus, data.selectedLanguage]);
    const [openTopId, setOpenTopId] = useState<number | null>(null);
    const [portalPos, setPortalPos] = useState<{ left: number; top: number } | null>(null);
    const portalRef = useRef<HTMLDivElement | null>(null);

    const closeMenu = useCallback(() => {
        setOpenTopId(null);
        setPortalPos(null);
    }, []);

    // Closes on any click outside the (portaled) dropdown - a leaf item's
    // own onClick already calls closeMenu() itself, and that handler
    // stops propagation, so this only ever fires for a genuinely outside
    // click (a different top-level button, or the canvas itself).
    useEffect(() => {
        if (openTopId == null) return;
        const handleOutside = (e: MouseEvent) => {
            if (portalRef.current && portalRef.current.contains(e.target as globalThis.Node)) return;
            closeMenu();
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [openTopId, closeMenu]);

    const openTopMenu = (item: WindowMenuPreviewNode, e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (item.children.length === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setPortalPos({ left: rect.left, top: rect.bottom });
        setOpenTopId(item.id);
    };

    const openItem = openTopId != null ? menuTree.find((m) => m.id === openTopId) : null;

    return (
    <div
        style={{
            width: data.width,
            // data.height is already canvas_height + the title bar (grown by
            // buildNodes, see WINDOW_TITLEBAR_HEIGHT above) - children get
            // shifted down within it, see buildNodes/applyGeometry.
            height: data.height,
            backgroundColor: data.backgroundColor || '#1e1e2e',
            backgroundImage: data.backgroundImage ? `url(${data.backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: `2px solid ${data.windowColor || '#3b82f6'}`,
            borderRadius: 8,
            overflow: 'hidden',
            pointerEvents: 'none',
            position: 'relative',
            boxSizing: 'border-box',
        }}
    >
        <div
            style={{
                height: WINDOW_TITLEBAR_HEIGHT,
                backgroundColor: data.windowColor || '#3b82f6',
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxSizing: 'border-box',
            }}
        >
            <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#febc2e' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#28c840' }} />
            </div>
            <span style={{ color: data.textColor || '#ffffff', fontSize: 13, fontWeight: 600 }}>
                {data.label}
            </span>
        </div>
        {/* Menu bar preview - read-only here (see MenuBarDesignerModal for
            actual editing), just so an imported/designed menu bar is
            visible and clickable on the canvas, not invisible until
            generation. An absolute overlay on top of the content's own
            top edge, not in-flow: reserving real space for it would mean
            shifting every direct child's y-offset throughout buildNodes/
            findContainerAt/the drop handler, which risks the pixel-exact
            WinDev import match documented on WINDOW_TITLEBAR_HEIGHT above -
            not worth the risk for a design-time-only affordance. */}
        {menuTree.length > 0 && (
            <div
                style={{
                    position: 'absolute',
                    top: WINDOW_TITLEBAR_HEIGHT,
                    left: 0,
                    right: 0,
                    height: 22,
                    backgroundColor: '#e8e8ea',
                    borderBottom: '1px solid #b0b0b8',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'auto',
                }}
            >
                {menuTree.map((item) => (
                    <div
                        key={item.id}
                        onClick={(e) => openTopMenu(item, e)}
                        style={{
                            height: '100%',
                            padding: '0 10px',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: 11,
                            color: '#1f1f1f',
                            cursor: item.children.length > 0 ? 'pointer' : 'default',
                            backgroundColor: openTopId === item.id ? 'rgba(0,0,0,0.12)' : 'transparent',
                        }}
                    >
                        {item.label}
                    </div>
                ))}
            </div>
        )}
        {openItem && portalPos && createPortal(
            <div
                ref={portalRef}
                style={{ position: 'fixed', left: portalPos.left, top: portalPos.top, zIndex: 10000 }}
            >
                <MenuFlyoutList items={openItem.children} onLeafClick={closeMenu} root />
            </div>,
            document.body
        )}
        {/* Size badge as an overlay, not in-flow — it must never eat into
            the content area's height or it would re-break the y=0 alignment
            it sits next to. */}
        <div
            style={{
                position: 'absolute',
                bottom: data.hasStatusBar ? 4 + WINDOW_STATUSBAR_HEIGHT : 4,
                right: 8,
                fontSize: 10,
                color: data.textColor || '#ffffff',
                opacity: 0.4,
            }}
        >
            {data.width} x {data.height}
        </div>
        {/* Status bar preview - absolutely positioned (not in-flow, same
            reasoning as the size badge above) so it never shifts anything
            else; buildNodes() already grew the frame's OWN height by
            WINDOW_STATUSBAR_HEIGHT to make room for it, exactly mirroring
            how the Flutter runtime grows the real OS window instead of
            overlapping existing controls (see SmlWindowContext.
            statusBarHeight's own doc comment). The 1px top border is the
            same separating line the runtime renders. */}
        {data.hasStatusBar && (
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: WINDOW_STATUSBAR_HEIGHT,
                    backgroundColor: '#e0e0e0',
                    borderTop: '1px solid #b0b0b0',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 6px',
                    boxSizing: 'border-box',
                }}
            >
                <span style={{ fontSize: 10, color: '#00000099' }}>
                    {data.statusBarLabel || 'Status Bar'}
                </span>
            </div>
        )}
    </div>
    );
});
WindowFrameNode.displayName = 'WindowFrameNode';

// A single-language text field for a per-language property (caption/comment/
// hint/tab label), with a "copy to all languages" action. Defined at module
// level (not inside WindowDesignerInner) so its identity stays stable across
// renders — an inline component here would remount the underlying <input>
// on every keystroke-triggered re-render and drop focus.
// Numeric X/Y/Width/Height editing, shared between the control and element
// property sections. Canvas drag/resize already writes these fields — this
// is the direct-entry counterpart for precise placement (e.g. matching a
// WinDev source's exact coordinates).
const PositionSizeFields: React.FC<{
    t: Translations;
    x: number;
    y: number;
    width: number;
    height: number;
    onChange: (patch: { x_position?: number; y_position?: number; width?: number; height?: number }) => void;
}> = ({ t, x, y, width, height, onChange }) => (
    <div className="grid grid-cols-2 gap-2">
        <div>
            <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_pos_x || 'X'}</label>
            <InputNumber className="w-full" inputClassName="p-inputtext-sm" value={x} onValueChange={(e) => onChange({ x_position: e.value ?? 0 })} />
        </div>
        <div>
            <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_pos_y || 'Y'}</label>
            <InputNumber className="w-full" inputClassName="p-inputtext-sm" value={y} onValueChange={(e) => onChange({ y_position: e.value ?? 0 })} />
        </div>
        <div>
            <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_pos_width || 'Width'}</label>
            <InputNumber className="w-full" inputClassName="p-inputtext-sm" value={width} min={1} onValueChange={(e) => onChange({ width: e.value ?? 1 })} />
        </div>
        <div>
            <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_pos_height || 'Height'}</label>
            <InputNumber className="w-full" inputClassName="p-inputtext-sm" value={height} min={1} onValueChange={(e) => onChange({ height: e.value ?? 1 })} />
        </div>
    </div>
);

const nodeTypes = {
    windowFrame: WindowFrameNode,
    windowElement: WindowElementNode,
    windowControl: WindowControlNode,
};

// ========== PROPS ==========

interface WindowDesignerPanelProps {
    // Initial window to load, if the panel was opened from a specific window
    // (e.g. a future deep-link). With the Explorer sidebar embedded directly,
    // most of the time this is left undefined and the user just picks a
    // window from the tree.
    windowId?: number;
    onOpenPanel?: (panelId: string, data?: Record<string, unknown>) => void;
}

// Imperative API exposed to the MDI shell (Index.tsx) - 2026-09-07, item c.
// There's only ever ONE Window Designer tab (window-switching happens
// INSIDE this panel via its own Explorer sidebar, never by opening a
// second tab - see activeWindowId's own doc comment), so rc-dock's own
// "close this tab" action is the one and only place the shell needs to ask
// "is it safe to close you right now?" before actually removing the tab
// from its layout - see Index.tsx's own onLayoutChange for how the answer
// is used to veto/defer that removal.
export interface WindowDesignerPanelHandle {
    hasUnsavedChanges: () => boolean;
    // Shows the same 3-way Save/Cancel/Discard prompt already used for
    // switching windows (see pendingAction's own doc comment) when there's
    // something to lose; calls `onConfirmed` immediately if there isn't.
    // Never calls `onConfirmed` on its own if the user picks Cancel, or if
    // they pick Save and the save itself fails - both cases leave the tab
    // open exactly as if the close had never been requested.
    requestClose: (onConfirmed: () => void) => void;
}

// ========== INNER COMPONENT (needs ReactFlowProvider) ==========

const WindowDesignerInner = React.forwardRef<WindowDesignerPanelHandle, WindowDesignerPanelProps>(({ windowId: initialWindowId }, ref) => {
    const [currentLanguage] = useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);
    const { colors } = useTheme();
    const { selectedProject } = useProject();
    const toast = useToast();
    const reactFlowInstance = useReactFlow();

    // The window currently open in the canvas — changed by picking a
    // different window in the embedded Explorer sidebar, not by reopening
    // the panel (there is only ever one Window Designer tab). Falls back to
    // whichever window was last open in this project so a full page reload
    // (F5) doesn't dump the user back to "No window selected" — scoped per
    // project since window ids aren't unique across projects.
    const [activeWindowId, setActiveWindowId] = useState<number | null>(() => {
        if (initialWindowId != null) return initialWindowId;
        if (!selectedProject) return null;
        const stored = localStorage.getItem(`window_designer_last_window_${selectedProject.id}`);
        return stored ? Number(stored) : null;
    });
    useEffect(() => {
        if (!selectedProject) return;
        const storageKey = `window_designer_last_window_${selectedProject.id}`;
        if (activeWindowId != null) {
            localStorage.setItem(storageKey, String(activeWindowId));
        } else {
            localStorage.removeItem(storageKey);
        }
    }, [activeWindowId, selectedProject]);

    // Explorer sidebar pin/collapse (VS Code-style "unpinned" auto-hide).
    const [sidebarPinned, setSidebarPinned] = useState<boolean>(() => localStorage.getItem('window_designer_sidebar_pinned') !== 'false');
    const [sidebarHovering, setSidebarHovering] = useState(false);
    const sidebarCollapseTimerRef = useRef<number | null>(null);
    useEffect(() => {
        localStorage.setItem('window_designer_sidebar_pinned', String(sidebarPinned));
    }, [sidebarPinned]);
    useEffect(() => () => {
        if (sidebarCollapseTimerRef.current) window.clearTimeout(sidebarCollapseTimerRef.current);
    }, []);
    const handleSidebarMouseEnter = () => {
        if (sidebarCollapseTimerRef.current) {
            window.clearTimeout(sidebarCollapseTimerRef.current);
            sidebarCollapseTimerRef.current = null;
        }
        setSidebarHovering(true);
    };
    const handleSidebarMouseLeave = () => {
        if (sidebarPinned) return;
        sidebarCollapseTimerRef.current = window.setTimeout(() => setSidebarHovering(false), 600);
    };
    const sidebarExpanded = sidebarPinned || sidebarHovering;

    // Drag-to-resize sidebar width (same pattern as SchemaTranslationPanel's
    // resize handle) — only meaningful while pinned, since the unpinned
    // hover-overlay is meant to be a transient peek, not a resized layout.
    const [sidebarWidth, setSidebarWidth] = useState<number>(() => Number(localStorage.getItem('window_designer_sidebar_width')) || 260);
    const [isResizingSidebar, setIsResizingSidebar] = useState(false);
    useEffect(() => {
        localStorage.setItem('window_designer_sidebar_width', String(sidebarWidth));
    }, [sidebarWidth]);
    const handleSidebarResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizingSidebar(true);
        const startX = e.clientX;
        const startWidth = sidebarWidth;
        const handleMouseMove = (moveEvent: MouseEvent) => {
            const delta = moveEvent.clientX - startX;
            setSidebarWidth(Math.max(180, Math.min(500, startWidth + delta)));
        };
        const handleMouseUp = () => {
            setIsResizingSidebar(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const [windowRow, setWindowRow] = useState<WindowRow | null>(null);
    const [elements, setElements] = useState<WindowElementRow[]>([]);
    const [controls, setControls] = useState<WindowControlRow[]>([]);
    // Canvas-preview-only (see the Menu Bar Designer modal for actual
    // editing) - loaded/refreshed alongside elements/controls, never part
    // of the canvas's own unsaved-changes tracking since every menu edit
    // already persists immediately through its own endpoints.
    const [menus, setMenus] = useState<WindowMenuRow[]>([]);
    const [schemaTables, setSchemaTables] = useState<SchemaTableLite[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    // Real step-based progress for the save-in-progress modal (see
    // handleSave's own doc comment) - 0/33/66/100, one third per request
    // actually completed.
    const [saveProgress, setSaveProgress] = useState(0);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const enabledLanguages = useMemo(
        () => (selectedProject?.enabled_languages || ['en']).map((l: string) => ({ value: l, label: l.toUpperCase() })),
        [selectedProject]
    );
    useEffect(() => {
        if (!selectedLanguage && enabledLanguages.length > 0) setSelectedLanguage(enabledLanguages[0].value);
    }, [enabledLanguages, selectedLanguage]);

    const [tabOrderModalVisible, setTabOrderModalVisible] = useState(false);
    const [columnDesignerVisible, setColumnDesignerVisible] = useState(false);
    // Which tab_panel is currently showing for each tab_container (keyed by
    // the tab_container's element id) — editor-only UI state, never saved.
    const [activeTabByContainer, setActiveTabByContainer] = useState<Record<number, number>>({});
    const tabOrderMenuRef = useRef<Menu>(null);
    const alignMenuRef = useRef<Menu>(null);
    const controlCounterRef = useRef(0);
    const iconUploadInputRef = useRef<HTMLInputElement>(null);
    const windowBackgroundImageInputRef = useRef<HTMLInputElement>(null);
    const controlBackgroundImageInputRef = useRef<HTMLInputElement>(null);

    const [nodes, setNodes, onNodesChangeInternal] = useNodesState<Node>([]);
    const [edges] = useEdgesState<Edge>([]);

    // Selection is derived straight from the controlled `nodes` array (kept
    // in sync by handleNodesChange below) instead of a separate state var.
    // Deriving it any other way — e.g. via ReactFlow's `onSelectionChange`
    // feeding back into a `selectedKeys` state that `buildNodes` depends on —
    // creates a render loop: selection change -> setState -> buildNodes
    // identity changes -> setNodes -> ReactFlow recomputes selection -> fires
    // onSelectionChange again, ad infinitum ("Maximum update depth exceeded").
    const selectedKeys = useMemo(() => nodes.filter((n) => n.selected).map((n) => n.id), [nodes]);

    // Selection ORDER, for the Align toolbar's "always align to the FIRST
    // control the user actually selected" rule (2026-09-06 follow-up, item
    // e) - `selectedKeys` above (and `nodes` itself) has no such notion, it
    // just reflects array order in `nodes`, which comes from DB/creation
    // order, not click order. This is a separate state fed BY `selectedKeys`
    // (never the other way around, and never read by buildNodes) so it
    // can't reintroduce the render loop `selectedKeys` itself was designed
    // to avoid (see its own doc comment) - a still-selected key keeps its
    // existing position, a newly-selected one is appended at the end. For a
    // single click/ctrl-click sequence this is exactly true click order;
    // for a lasso/rectangle selection every newly-netted node arrives in
    // ONE update, so within that batch this instead falls back to
    // `selectedKeys`'s own (array/creation) order - a disclosed, reasonable
    // compromise given a lasso drag has no click sequence to derive from at
    // all.
    const [orderedSelection, setOrderedSelection] = useState<string[]>([]);
    useEffect(() => {
        setOrderedSelection((prev) => {
            const stillSelected = prev.filter((k) => selectedKeys.includes(k));
            const newlySelected = selectedKeys.filter((k) => !prev.includes(k));
            const next = [...stillSelected, ...newlySelected];
            // Avoid an infinite-loop-shaped (though harmless) setState when
            // nothing actually changed order-wise.
            if (next.length === prev.length && next.every((k, i) => k === prev[i])) return prev;
            return next;
        });
    }, [selectedKeys]);

    // Snapshot of the current nodes, read (not depended upon) by buildNodes so
    // a data-driven rebuild (e.g. after a geometry change) can carry the
    // existing selection forward without making `nodes` a dependency of the
    // very callback that produces `nodes` — that self-reference is what
    // caused the loop above.
    const nodesRef = useRef<Node[]>([]);
    useEffect(() => { nodesRef.current = nodes; }, [nodes]);
    // A node key to force-select on the very next rebuild — set right after
    // creating a control from the palette so it's immediately selected
    // (Properties panel opens for it) without the user having to click it.
    const pendingSelectKeyRef = useRef<string | null>(null);

    const controlKey = (c: WindowControlRow) => c._key;

    // ===== Load =====
    const loadData = useCallback(async () => {
        if (activeWindowId == null) {
            setWindowRow(null);
            setElements([]);
            setControls([]);
            setMenus([]);
            return;
        }
        setLoading(true);
        try {
            const [winRes, elRes, ctrlRes, menuRes] = await Promise.all([
                apiClient.get(`/windows/${activeWindowId}`),
                apiClient.get(`/windows/${activeWindowId}/elements`),
                apiClient.get(`/windows/${activeWindowId}/controls`),
                apiClient.get(`/windows/${activeWindowId}/menus`),
            ]);
            setWindowRow(winRes.data);
            const loadedElements: WindowElementRow[] = elRes.data || [];
            const loadedControls: WindowControlRow[] = (ctrlRes.data || []).map((c: any) => ({ ...c, _key: `ctrl-${c.id}` }));
            setMenus(menuRes.data || []);
            // Auto-repair (2026-09-15) - see fillMissingSourceNames' own doc
            // comment. Marks unsaved changes when it actually fixed
            // something, so the repair doesn't just silently exist in this
            // one browser tab until the user happens to edit something else
            // that triggers a save anyway.
            const repaired = fillMissingSourceNames(loadedElements, loadedControls);
            setElements(repaired ? repaired.elements : loadedElements);
            setControls(repaired ? repaired.controls : loadedControls);
            setHasUnsavedChanges(repaired != null);
        } catch (error) {
            console.error(error);
            toast.showError(t.windowdesignerpanel_save_error || 'Failed to save window');
            // Most likely the window id restored from a previous session
            // (see the localStorage fallback above) no longer exists —
            // without this, `windowRow` never gets set and the designer is
            // stuck showing "Loading windows..." forever instead of
            // falling back to "No window selected".
            setActiveWindowId(null);
        } finally {
            setLoading(false);
        }
    }, [activeWindowId]);

    useEffect(() => { loadData(); }, [loadData]);

    // A lighter-weight re-sync used after deleting an element/tab (whose
    // FK cascades can re-home other rows server-side, e.g. orphaned
    // controls landing back at the window root) — unlike loadData(), this
    // never touches `loading`/`windowRow`, so it doesn't blank the whole
    // designer out to a "Loading windows..." screen for what the user
    // experiences as a small, local edit.
    const refreshElementsAndControls = useCallback(async () => {
        if (!windowRow) return;
        try {
            const [elRes, ctrlRes] = await Promise.all([
                apiClient.get(`/windows/${windowRow.id}/elements`),
                apiClient.get(`/windows/${windowRow.id}/controls`),
            ]);
            setElements(elRes.data || []);
            setControls((ctrlRes.data || []).map((c: any) => ({ ...c, _key: `ctrl-${c.id}` })));
        } catch (error) {
            console.error(error);
            toast.showError(t.windowdesignerpanel_save_error || 'Failed to save window');
        }
    }, [windowRow, t, toast]);

    // Same lighter-weight re-sync, scoped to the menu bar - every edit made
    // in MenuBarDesignerModal already persisted itself, this just refreshes
    // the read-only canvas preview to match, without touching elements/
    // controls (and any unsaved edits pending there).
    const refreshMenus = useCallback(async () => {
        if (!windowRow) return;
        try {
            const res = await apiClient.get(`/windows/${windowRow.id}/menus`);
            setMenus(res.data || []);
        } catch (error) {
            console.error(error);
        }
    }, [windowRow]);

    // Unsaved-changes prompt shared by "switch to a different window" AND
    // "close the whole panel" (2026-09-07, items c/d) - previously
    // switching windows used PrimeReact's generic confirmDialog(), a plain
    // 2-way accept/reject choice with NO way to save first (confirmed
    // confusing/risky by the user: nothing distinguished "I looked at the
    // code behind OK but didn't mean to change anything" from "I actually
    // edited something and want it kept"). Now the SAME 3-way Save/Cancel/
    // Discard prompt as WindowCodeEditorModal's own unsaved-changes dialog:
    // Save persists everything then proceeds, Discard proceeds without
    // saving, Cancel does nothing (stays on the current window/tab).
    const [pendingAction, setPendingAction] = useState<
        { kind: 'switch'; windowId: number } | { kind: 'close'; onConfirmed: () => void } | null
    >(null);

    // Picking a different window in the Explorer sidebar while there are
    // unsaved changes would silently discard them — confirm first.
    const handleSelectWindow = useCallback((id: number) => {
        if (id === activeWindowId) return;
        if (hasUnsavedChanges) {
            setPendingAction({ kind: 'switch', windowId: id });
        } else {
            setActiveWindowId(id);
        }
    }, [activeWindowId, hasUnsavedChanges]);

    const handleActiveWindowRenamed = useCallback((id: number) => {
        if (id === activeWindowId) loadData();
    }, [activeWindowId, loadData]);

    const handleActiveWindowDeleted = useCallback((id: number) => {
        if (id === activeWindowId) {
            setActiveWindowId(null);
            // The window itself (and whatever local edits were pending for
            // it) is gone — an "unsaved changes" flag left over from before
            // the delete would otherwise trigger handleSelectWindow's
            // confirm dialog on the very next, completely unrelated window.
            setHasUnsavedChanges(false);
        }
    }, [activeWindowId]);

    // ===== Load schema tables (for the optional "Linked Table" / "Linked Field" properties) =====
    const loadSchemaTables = useCallback(async () => {
        if (!selectedProject) return;
        try {
            const schemasData = await apiClient.get(`/projects/${selectedProject.id}/schemas`);
            const schemas = Array.isArray(schemasData) ? schemasData : (schemasData.data || []);
            const allTables: SchemaTableLite[] = [];
            for (const schema of schemas) {
                try {
                    const versionsData = await apiClient.get(`/floating-schemas/${schema.id}/versions`);
                    const versions = Array.isArray(versionsData) ? versionsData : (versionsData.data || versionsData.versions || []);
                    if (versions.length === 0) continue;
                    const latest = versions.reduce((a: any, b: any) => (Number(a.version_number) > Number(b.version_number) ? a : b), versions[0]);
                    const tablesData = await apiClient.get(`/schema-versions/${latest.id}/tables`);
                    const tablesArr = Array.isArray(tablesData) ? tablesData : (tablesData.data || []);
                    allTables.push(...tablesArr);
                } catch {
                    // skip schema on error, non-critical property lookup
                }
            }
            setSchemaTables(allTables);
        } catch {
            setSchemaTables([]);
        }
    }, [selectedProject]);

    useEffect(() => { loadSchemaTables(); }, [loadSchemaTables]);

    const linkedTableFields = useMemo(() => {
        if (!windowRow?.schema_table_id) return [] as SchemaFieldLite[];
        return schemaTables.find((tb) => tb.id === windowRow.schema_table_id)?.fields || [];
    }, [schemaTables, windowRow?.schema_table_id]);

    // ===== Geometry helpers (container-relative coordinates) =====
    const absolutePosition = useCallback((elementId: number): { x: number; y: number } => {
        const el = elements.find((e) => e.id === elementId);
        if (!el) return { x: 0, y: 0 };
        if (!el.parent_element_id) return { x: el.x_position, y: el.y_position };
        const parentAbs = absolutePosition(el.parent_element_id);
        return { x: parentAbs.x + el.x_position, y: parentAbs.y + el.y_position };
    }, [elements]);

    // Every tab_container's pages, and which one of them is currently being
    // shown/edited — shared by buildNodes (what to render) and
    // findContainerAt (what a click/drop can actually land on). Sibling
    // tab_panels occupy the exact same rectangle by design (only one is
    // ever visible), so without this, hit-testing would always find
    // whichever page happens to come first regardless of which one the
    // user is actually looking at.
    const tabPanelsByContainer = useMemo(() => {
        const byContainer = new Map<number, WindowElementRow[]>();
        elements.forEach((el) => {
            if (el.element_type === 'tab_panel' && el.parent_element_id != null) {
                const list = byContainer.get(el.parent_element_id) || [];
                list.push(el);
                byContainer.set(el.parent_element_id, list);
            }
        });
        byContainer.forEach((list) => list.sort((a, b) => a.sort_order - b.sort_order));
        return byContainer;
    }, [elements]);

    const activeTabPanelByContainer = useMemo(() => {
        const result: Record<number, number> = {};
        tabPanelsByContainer.forEach((list, containerId) => {
            if (list.length === 0) return;
            const stored = activeTabByContainer[containerId];
            result[containerId] = list.some((tp) => tp.id === stored) ? stored : list[0].id;
        });
        return result;
    }, [tabPanelsByContainer, activeTabByContainer]);

    const findContainerAt = useCallback((x: number, y: number): WindowElementRow | null => {
        let best: WindowElementRow | null = null;
        let bestArea = Infinity;
        for (const el of elements) {
            // A tab_panel that isn't the currently active page of its
            // container is invisible in the editor — it must never win a
            // hit-test, or dropped/dragged items would land on whichever
            // page happens to be first instead of the one the user sees.
            if (el.element_type === 'tab_panel' && el.parent_element_id != null && activeTabPanelByContainer[el.parent_element_id] !== el.id) {
                continue;
            }
            // A tab_panel's hit-test box is its tab_container's CURRENT
            // size, not its own stale width/height columns - see buildNodes'
            // identical substitution and its own doc comment.
            const parent = el.element_type === 'tab_panel'
                ? elements.find((p) => p.id === el.parent_element_id)
                : undefined;
            const elWidth = parent ? parent.width : el.width;
            const elHeight = parent ? Math.max(20, parent.height - TAB_HEADER_HEIGHT) : el.height;
            const abs = absolutePosition(el.id);
            if (x >= abs.x && x <= abs.x + elWidth && y >= abs.y && y <= abs.y + elHeight) {
                const area = elWidth * elHeight;
                if (area < bestArea) { bestArea = area; best = el; }
            }
        }
        // A looper is never a valid container itself (only its row template
        // is - see parentContainerOptions) - this only matters below the
        // row's own (now genuinely small) box, in the grayed-out "repeated
        // rows" preview area a real drop could otherwise land in if the
        // row's box doesn't happen to cover the exact point clicked. Rather
        // than reject the drop there, redirect it to the SAME row template
        // every other drop on this looper already goes to - there's only
        // ever one real place for controls to attach on a looper, the user
        // shouldn't have to aim precisely for the white band to hit it.
        if (best?.element_type === 'looper') {
            const row = elements.find((e) => e.parent_element_id === best!.id && e.element_type === 'looper_row');
            return row ?? best;
        }
        return best;
    }, [elements, absolutePosition, activeTabPanelByContainer]);

    // ===== Caption / comment / hint resolution (per selected language) =====
    const effectiveCaption = useCallback((c: WindowControlRow): string => {
        if (selectedLanguage && c.caption_labels && c.caption_labels[selectedLanguage]) return c.caption_labels[selectedLanguage];
        if (c.caption_override) return c.caption_override;
        // A control with an icon and no caption is icon-only by design (most
        // WinDev buttons are exactly this) — the generic type name ("Button")
        // would just sit awkwardly next to the icon, so leave it blank
        // instead. Controls with neither icon nor caption still fall back to
        // the type name so a freshly-dragged, unconfigured control isn't an
        // unlabeled empty box.
        if (c.icon_data || c.icon_class) return '';
        // static_text with a genuinely empty caption stays blank rather than
        // falling back to the type name ("Static Text") - WinDev imports
        // regularly have empty static_text controls (pure spacers), and
        // showing placeholder text there makes it impossible to visually
        // diff the canvas against the original WinDev window.
        if (c.control_type === 'static_text') return '';
        const def = CONTROL_GROUPS.flatMap((g) => g.items).find((i) => i.type === c.control_type);
        return def ? label(t, def.tKey, def.fallback) : c.control_type;
    }, [selectedLanguage, t]);

    // The window's OWN title-bar caption, same per-language resolution
    // pattern as effectiveCaption above (2026-09-07 - previously always
    // showed the raw, untranslated display_name regardless of
    // selectedLanguage, since display_name_labels didn't exist yet).
    const effectiveWindowDisplayName = useCallback((w: WindowRow | null): string => {
        if (!w) return '';
        if (selectedLanguage && w.display_name_labels && w.display_name_labels[selectedLanguage]) return w.display_name_labels[selectedLanguage];
        return w.display_name || w.name;
    }, [selectedLanguage]);

    const elementLabel = useCallback((el: WindowElementRow): string => {
        // A tab page's own identity is its caption, shown right on the tab
        // strip — repeating the internal "tab_panel" type name next to it
        // (in the properties header, or floating on the canvas) is just
        // noise, so it gets its caption alone with no type prefix.
        if (el.element_type === 'tab_panel') {
            const caption = (selectedLanguage && el.tab_labels?.[selectedLanguage]) || el.tab_label || `Tab ${el.sort_order + 1}`;
            return `${t.windowdesignerpanel_tab_page_prefix || 'Tab Page'}: ${caption}`;
        }
        if (el.element_type === 'looper_row') {
            return t.windowdesignerpanel_looper_row || 'Row Template';
        }
        const def = ELEMENT_DEFS.find((d) => d.type === el.element_type);
        const base = def ? label(t, def.tKey, def.fallback) : el.element_type;
        if (el.element_type === 'tab_container') {
            const tabLabel = (selectedLanguage && el.tab_labels?.[selectedLanguage]) || el.tab_label;
            return tabLabel ? `${base}: ${tabLabel}` : base;
        }
        return base;
    }, [t, selectedLanguage]);

    // Every valid drop target a control can be reassigned to — plain
    // containers/group boxes directly, tab_containers only indirectly via
    // one of their tab_panel pages (a control can never sit on the tab
    // strip itself, only on one specific page).
    const parentContainerOptions = useMemo(() => {
        const opts: { label: string; value: number | null }[] = [
            { label: t.windowdesignerpanel_parent_container_none || 'None (Window Root)', value: null },
        ];
        elements.forEach((el) => {
            if (el.element_type === 'tab_container' || el.element_type === 'looper') return;
            if (el.element_type === 'tab_panel') {
                const parentContainer = elements.find((p) => p.id === el.parent_element_id);
                const containerLabel = parentContainer ? elementLabel(parentContainer) : '?';
                const tabLabel = (selectedLanguage && el.tab_labels?.[selectedLanguage]) || el.tab_label || `Tab ${el.sort_order + 1}`;
                opts.push({ label: `${containerLabel} → ${tabLabel}`, value: el.id });
            } else if (el.element_type === 'looper_row') {
                const parentContainer = elements.find((p) => p.id === el.parent_element_id);
                const containerLabel = parentContainer ? elementLabel(parentContainer) : '?';
                opts.push({ label: `${containerLabel} → ${t.windowdesignerpanel_looper_row || 'Row Template'}`, value: el.id });
            } else {
                opts.push({ label: elementLabel(el), value: el.id });
            }
        });
        return opts;
    }, [elements, elementLabel, selectedLanguage, t]);

    // ===== Build ReactFlow nodes from elements + controls =====
    const buildNodes = useCallback((): Node[] => {
        // Read (not depend on) the previous selection so a data-driven
        // rebuild carries it forward — see the comment on `nodesRef` above.
        const prevSelected = new Set(nodesRef.current.filter((n) => n.selected).map((n) => n.id));
        // A pending force-select (freshly dropped control) replaces the
        // previous selection entirely, like a fresh click would.
        const forceSelectKey = pendingSelectKeyRef.current;
        const width = windowRow?.canvas_width || 1024;
        // canvas_height is the CLIENT area only (see WINDOW_TITLEBAR_HEIGHT
        // above) - the frame node itself must be taller by the title bar so
        // a child at y=canvas_height (the bottom edge of the client area)
        // still lands inside the frame instead of past its bottom edge.
        // Status bar ADDS to this the same way (WINDOW_STATUSBAR_HEIGHT's
        // own doc comment) - it never eats into the client area, so no
        // existing child's y-position needs any adjustment for it, only the
        // frame's own total height grows to show it.
        const height = (windowRow?.canvas_height || 768) + WINDOW_TITLEBAR_HEIGHT
            + (windowRow?.has_status_bar ? WINDOW_STATUSBAR_HEIGHT : 0);
        const out: Node[] = [{
            id: 'window-frame',
            type: 'windowFrame',
            position: { x: 0, y: 0 },
            style: { width, height, zIndex: -1 },
            draggable: false,
            selectable: false,
            data: {
                label: effectiveWindowDisplayName(windowRow),
                width,
                height,
                backgroundColor: windowRow?.background_color,
                windowColor: windowRow?.window_color,
                textColor: windowRow?.text_color,
                backgroundImage: windowRow?.background_image,
                hasStatusBar: windowRow?.has_status_bar,
                statusBarLabel: t.windowdesignerpanel_status_bar || 'Status Bar',
                menus,
                selectedLanguage,
            } as unknown as Record<string, unknown>,
        }];

        const depthOf = (el: WindowElementRow, seen: Set<number> = new Set()): number => {
            if (!el.parent_element_id || seen.has(el.id)) return 0;
            const parent = elements.find((e) => e.id === el.parent_element_id);
            if (!parent) return 0;
            seen.add(el.id);
            return 1 + depthOf(parent, seen);
        };

        // Tab pages: hide every non-active tab_panel (plus whatever lives
        // inside it) so sibling tab pages never render on top of each
        // other. A tab_panel is inset by TAB_HEADER_HEIGHT at
        // import/creation time (see backend TAB_HEADER_HEIGHT), so no extra
        // y-shift is needed here — only the show/hide decision. Which page
        // is "active" is shared with findContainerAt (see
        // activeTabPanelByContainer above) so drops/hit-tests agree with
        // what's actually rendered.
        const getActiveTabId = (containerId: number): number | null => activeTabPanelByContainer[containerId] ?? null;

        const hiddenElementIds = new Set<number>();
        elements.forEach((el) => {
            if (el.element_type === 'tab_panel' && el.parent_element_id != null && getActiveTabId(el.parent_element_id) !== el.id) {
                hiddenElementIds.add(el.id);
            }
        });
        const isHiddenElement = (el: WindowElementRow): boolean => {
            let cur: WindowElementRow | undefined = el;
            const seen = new Set<number>();
            while (cur) {
                if (hiddenElementIds.has(cur.id)) return true;
                if (!cur.parent_element_id || seen.has(cur.id)) return false;
                seen.add(cur.id);
                cur = elements.find((e) => e.id === cur!.parent_element_id);
            }
            return false;
        };
        const resolveTabLabel = (el: WindowElementRow): string =>
            (selectedLanguage && el.tab_labels?.[selectedLanguage]) || el.tab_label || `Tab ${el.sort_order + 1}`;

        [...elements].sort((a, b) => depthOf(a) - depthOf(b)).forEach((el) => {
            if (isHiddenElement(el)) return;
            const parentId = el.parent_element_id ? `elem-${el.parent_element_id}` : 'window-frame';
            const yOffset = parentId === 'window-frame' ? WINDOW_TITLEBAR_HEIGHT : 0;
            const tabs = el.element_type === 'tab_container'
                ? (tabPanelsByContainer.get(el.id) || []).map((tp) => ({ id: tp.id, label: resolveTabLabel(tp) }))
                : undefined;
            // A tab_panel's own width/height columns are never the source of
            // truth for rendering - it always fills its tab_container
            // exactly (minus the header strip), so resizing the container
            // must never require writing N child rows to keep them in sync
            // (error-prone, and only ever a snapshot of "container size at
            // creation time" otherwise - see item (b) of the 2026-09-05
            // Window Designer bug list). Deriving it live from the parent
            // here means it's always correct by construction.
            const tabPanelParent = el.element_type === 'tab_panel'
                ? elements.find((p) => p.id === el.parent_element_id)
                : undefined;
            const elWidth = tabPanelParent ? tabPanelParent.width : el.width;
            const elHeight = tabPanelParent ? Math.max(20, tabPanelParent.height - TAB_HEADER_HEIGHT) : el.height;
            out.push({
                id: `elem-${el.id}`,
                type: 'windowElement',
                position: { x: el.x_position, y: el.y_position + yOffset },
                style: { width: elWidth, height: elHeight, zIndex: 0 },
                parentId,
                // A tab page's position/size is entirely dictated by its
                // tab_container (always (0, TAB_HEADER_HEIGHT), full width,
                // container height minus the header) — dragging it would
                // just visually detach it from its own tab strip. A
                // looper's row template is the same story, minus the
                // header inset (always (0,0), full container size).
                draggable: el.element_type !== 'tab_panel' && el.element_type !== 'looper_row',
                selected: forceSelectKey ? forceSelectKey === `elem-${el.id}` : prevSelected.has(`elem-${el.id}`),
                data: {
                    elementType: el.element_type,
                    label: elementLabel(el),
                    isVisible: el.is_visible,
                    looperRowHeight: el.element_type === 'looper' ? (el.looper_row_height ?? 80) : undefined,
                    tabs,
                    activeTabId: tabs ? getActiveTabId(el.id) : undefined,
                    // Clicking a tab must both switch the visible page AND
                    // select/highlight that page's own element (so its
                    // Properties panel opens immediately) - previously this
                    // only flipped the visible page, leaving the user to
                    // click the page's body a second time just to select it.
                    // Reuses the same pendingSelectKeyRef mechanism a freshly
                    // dropped control already relies on (see its own doc
                    // comment) rather than inventing a second "select this"
                    // path - the target tab_panel node may not even exist in
                    // `nodes` yet at click time (its own page was hidden a
                    // moment ago), so a direct setNodes() patch here (like
                    // onSelectContainer below) could silently no-op.
                    onSelectTab: tabs ? (tabId: number) => {
                        pendingSelectKeyRef.current = `elem-${tabId}`;
                        setActiveTabByContainer((prev) => ({ ...prev, [el.id]: tabId }));
                    } : undefined,
                    // A tab_container's own header strip is almost entirely
                    // tab buttons (each stopPropagation()-ing so a tab click
                    // switches pages instead of selecting the container) -
                    // with many/wide tabs there can be effectively NO empty
                    // strip space left to click for selecting the container
                    // itself (e.g. to set ITS OWN anchor, not a page's). This
                    // gives a guaranteed, always-clickable way in regardless
                    // of tab count/width.
                    onSelectContainer: tabs
                        ? () => setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === `elem-${el.id}` })))
                        : undefined,
                    // Live-patches the currently visible tab page's own node
                    // size while THIS container is being dragged bigger/
                    // smaller (see NodeResizer's onResize in WindowElementNode)
                    // - a targeted single-node style patch, never a full
                    // buildNodes() rebuild, so it stays flicker-free. The
                    // final size is committed to real state by handleNodesChange's
                    // own resize-end handling (same path every element/control
                    // resize already commits through) - buildNodes' own tab_panel
                    // sizing below then re-derives from the committed container
                    // size, so nothing here needs to persist anything itself.
                    onTabContainerResize: tabs ? (width: number, height: number) => {
                        const activeId = getActiveTabId(el.id);
                        if (activeId == null) return;
                        const nodeId = `elem-${activeId}`;
                        setNodes((nds) => nds.map((n) => n.id === nodeId
                            ? { ...n, style: { ...n.style, width, height: Math.max(20, height - TAB_HEADER_HEIGHT) } }
                            : n));
                    } : undefined,
                    tabStyle: tabs ? {
                        activeBg: el.tab_active_background_color,
                        activeText: el.tab_active_text_color,
                        inactiveBg: el.tab_inactive_background_color,
                        inactiveText: el.tab_inactive_text_color,
                        fontFamily: el.tab_font_family,
                        fontSize: el.tab_font_size,
                        bold: el.tab_font_bold,
                        italic: el.tab_font_italic,
                        underline: el.tab_font_underline,
                        strikeout: el.tab_font_strikeout,
                    } : undefined,
                    // A tab_panel has no "Content Background" of its own (see
                    // the migration's comment - the field lives on the
                    // tab_container itself) so it resolves this from its own
                    // parent instead of `el`.
                    contentBackgroundColor: el.element_type === 'tab_container'
                        ? el.background_color
                        : (el.element_type === 'tab_panel'
                            ? elements.find((p) => p.id === el.parent_element_id)?.background_color
                            : undefined),
                } as unknown as Record<string, unknown>,
            });
        });

        controls.forEach((c) => {
            if (c.container_element_id) {
                const containerEl = elements.find((e) => e.id === c.container_element_id);
                if (containerEl && isHiddenElement(containerEl)) return;
            }
            const key = controlKey(c);
            const parentId = c.container_element_id ? `elem-${c.container_element_id}` : 'window-frame';
            const yOffset = parentId === 'window-frame' ? WINDOW_TITLEBAR_HEIGHT : 0;
            out.push({
                id: key,
                type: 'windowControl',
                position: { x: c.x_position, y: c.y_position + yOffset },
                // sort_order doubles as WinDev's own zorder (paint/stacking
                // order) when the import provided one - offset by 1 so
                // controls always stay above container elements (zIndex 0/-1
                // above), not because of DOM/array order.
                style: { width: c.width, height: c.height, zIndex: 1 + (c.sort_order || 0) },
                parentId,
                selected: forceSelectKey ? key === forceSelectKey : prevSelected.has(key),
                data: {
                    controlType: c.control_type,
                    caption: effectiveCaption(c),
                    isVisible: c.is_visible,
                    iconClass: c.icon_class,
                    iconData: c.icon_data,
                    iconStateCount: c.icon_state_count,
                    backgroundImage: c.background_image,
                    backgroundImageStates: c.background_image_states,
                    captionAlignH: c.caption_position_horizontal,
                    captionAlignV: c.caption_position_vertical,
                    labelPosition: c.label_position,
                    labelWidth: c.label_width,
                    staticTextBorderStyle: c.static_text_border_style,
                    controlBackgroundColor: c.control_background_color,
                    controlTextColor: c.control_text_color,
                    fontFamily: c.font_family,
                    fontSize: c.font_size,
                    fontBold: c.font_bold,
                    fontItalic: c.font_italic,
                    fontUnderline: c.font_underline,
                    fontStrikeout: c.font_strikeout,
                    controlState: c.control_state,
                    // Each column's own caption resolved for the currently
                    // selected language (2026-09-07, item a) - same
                    // resolve-once-in-buildNodes pattern effectiveCaption()
                    // already uses for the control's own caption, rather
                    // than passing the raw caption_labels map down into the
                    // module-level WindowControlNode and resolving there.
                    tableColumns: c.table_columns
                        ? c.table_columns.map((col) => ({
                            ...col,
                            caption: (selectedLanguage && col.caption_labels?.[selectedLanguage]) || col.caption,
                        }))
                        : c.table_columns,
                    captionVisible: c.caption_visible,
                    iconPositionH: c.icon_position_horizontal,
                    iconPositionV: c.icon_position_vertical,
                    headerBackgroundColor: c.header_background_color,
                    headerTextColor: c.header_text_color,
                    rowBackgroundColorEven: c.row_background_color_even,
                    rowHeight: c.row_height,
                    optionLabels: (c.options || []).map((o) => (selectedLanguage && o.labels?.[selectedLanguage]) || o.value),
                } as unknown as Record<string, unknown>,
            });
        });

        return out;
    }, [elements, controls, menus, windowRow, elementLabel, effectiveCaption, effectiveWindowDisplayName, selectedLanguage, tabPanelsByContainer, activeTabPanelByContainer, t]);

    const rebuildNodesThrottled = useThrottledCallback(() => {
        setNodes(buildNodes());
        pendingSelectKeyRef.current = null;
    }, 80);

    useEffect(() => {
        rebuildNodesThrottled();
    }, [buildNodes, rebuildNodesThrottled]);

    // Center the viewport on the window frame whenever a (different) window
    // is opened, instead of always starting pinned to the top-left corner.
    // A short delay lets ReactFlow finish measuring its container after the
    // canvas/sidebar just mounted or resized — calling setCenter before that
    // measurement lands is a no-op.
    useEffect(() => {
        if (!windowRow) return;
        const timer = window.setTimeout(() => {
            reactFlowInstance.setCenter(
                windowRow.canvas_width / 2,
                (windowRow.canvas_height + WINDOW_TITLEBAR_HEIGHT) / 2,
                { zoom: 1, duration: 300 },
            );
        }, 50);
        return () => window.clearTimeout(timer);
    }, [windowRow?.id]);

    // ===== Geometry sync (drag/resize end -> local state) =====
    const applyGeometry = useCallback((nodeId: string, patch: Partial<{ x: number; y: number; width: number; height: number }>) => {
        if (nodeId === 'window-frame') return;
        if (nodeId.startsWith('elem-')) {
            const id = Number(nodeId.replace('elem-', ''));
            setElements((prev) => prev.map((e) => {
                if (e.id !== id) return e;
                // ReactFlow reports drag position relative to the parent
                // node's own box — for a direct child of window-frame that
                // box includes the title bar, so subtract it back out
                // before storing the logical (WinDev-native) y. Nested
                // children are already relative to their container, no
                // title bar involved.
                const yOffset = e.parent_element_id == null ? WINDOW_TITLEBAR_HEIGHT : 0;
                return {
                    ...e,
                    x_position: patch.x ?? e.x_position,
                    y_position: patch.y != null ? patch.y - yOffset : e.y_position,
                    width: patch.width ?? e.width,
                    height: patch.height ?? e.height,
                };
            }));
        } else {
            setControls((prev) => prev.map((c) => {
                if (controlKey(c) !== nodeId) return c;
                const yOffset = c.container_element_id == null ? WINDOW_TITLEBAR_HEIGHT : 0;
                return {
                    ...c,
                    x_position: patch.x ?? c.x_position,
                    y_position: patch.y != null ? patch.y - yOffset : c.y_position,
                    width: patch.width ?? c.width,
                    height: patch.height ?? c.height,
                };
            }));
        }
        setHasUnsavedChanges(true);
    }, []);

    const handleNodesChange = useCallback((changes: NodeChange[]) => {
        onNodesChangeInternal(changes);
        for (const change of changes) {
            if (change.type === 'position' && change.position && change.dragging === false) {
                applyGeometry(change.id, { x: Math.max(0, Math.round(change.position.x)), y: Math.max(0, Math.round(change.position.y)) });
            }
            // `resizing` is true on every intermediate tick while the user
            // is actively dragging a resize handle and only turns false on
            // the FINAL change once the pointer is released (mirrors
            // `dragging === false` above for a plain move) - a previous
            // version of this check fired on `resizing` being truthy
            // instead, committing a full `setElements`/`buildNodes` rebuild
            // roughly once per animation frame throughout the entire drag.
            // ReactFlow's own internal node state (updated unconditionally
            // by `onNodesChangeInternal` above) already renders the live
            // resize smoothly on its own; committing on every tick besides
            // was pure redundant churn and the actual root cause of the
            // window "blinking" while resizing a container (worst on a Tab
            // Control, whose tab pages are separate child nodes torn down
            // and recreated by every one of those rebuilds).
            if (change.type === 'dimensions' && change.dimensions && (change as any).resizing === false) {
                applyGeometry(change.id, { width: Math.round(change.dimensions.width), height: Math.round(change.dimensions.height) });
            }
        }
    }, [onNodesChangeInternal, applyGeometry]);

    // ===== Drag & drop from the top palette =====
    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }, []);

    // First tries the bare prefix ("TAB"), then TAB1, TAB2, ... — mirrors
    // how the WinDev exports name their own tab containers, so imported and
    // hand-built windows end up with names that look the same.
    const nextElementSourceName = useCallback((prefix: string): string => {
        const existing = new Set(elements.map((e) => e.source_name).filter((n): n is string => !!n));
        if (!existing.has(prefix)) return prefix;
        let i = 1;
        while (existing.has(`${prefix}${i}`)) i++;
        return `${prefix}${i}`;
    }, [elements]);

    // Same idea, for controls (see CONTROL_NAME_PREFIXES) — WinDev names a
    // freshly dropped control "BTN_NoName1"/"STC_NoName1"/... immediately,
    // never leaving one unnamed on the canvas; this mirrors that instead of
    // requiring the user to notice and type a name in before Save.
    const nextControlSourceName = useCallback((prefix: string): string => {
        const existing = new Set(controls.map((c) => c.source_name).filter((n): n is string => !!n));
        let i = 1;
        while (existing.has(`${prefix}_NoName${i}`)) i++;
        return `${prefix}_NoName${i}`;
    }, [controls]);

    const handleDrop = useCallback(async (event: React.DragEvent) => {
        event.preventDefault();
        const raw = event.dataTransfer.getData('application/window-item');
        if (!raw || !windowRow) return;
        let payload: { kind: 'element' | 'control'; type: string };
        try { payload = JSON.parse(raw); } catch { return; }

        const flowPos = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
        // Convert once to logical (WinDev-native, title-bar-free) space so it
        // lines up with absolutePosition()'s output, which is built purely
        // from stored x/y values and knows nothing about the title bar.
        const logicalPos = { x: flowPos.x, y: flowPos.y - WINDOW_TITLEBAR_HEIGHT };
        const target = findContainerAt(logicalPos.x, logicalPos.y);
        const targetAbs = target ? absolutePosition(target.id) : { x: 0, y: 0 };
        const relX = Math.max(0, Math.round(logicalPos.x - targetAbs.x));
        const relY = Math.max(0, Math.round(logicalPos.y - targetAbs.y));

        if (payload.kind === 'element') {
            const def = ELEMENT_DEFS.find((d) => d.type === payload.type);
            const width = def?.w || 240;
            const height = def?.h || 160;
            const sourceName = nextElementSourceName(ELEMENT_NAME_PREFIXES[payload.type] || payload.type.toUpperCase());
            try {
                const res = await apiClient.post(`/windows/${windowRow.id}/elements`, {
                    element_type: payload.type,
                    source_name: sourceName,
                    parent_element_id: target?.id ?? null,
                    x_position: relX,
                    y_position: relY,
                    width,
                    height,
                    looper_row_height: payload.type === 'looper' ? LOOPER_DEFAULT_ROW_HEIGHT : undefined,
                });
                const newElements = [res.data];
                // A tab_container with zero pages has nothing to show or put
                // controls into — give it one real tab immediately instead
                // of leaving it in that dead "flat, no tab strip" state
                // until the user finds the (separate) "Add Tab" button.
                if (payload.type === 'tab_container') {
                    const tabRes = await apiClient.post(`/windows/${windowRow.id}/elements`, {
                        element_type: 'tab_panel',
                        source_name: `${sourceName}.TAB1`,
                        parent_element_id: res.data.id,
                        x_position: 0,
                        y_position: TAB_HEADER_HEIGHT,
                        width,
                        height: Math.max(20, height - TAB_HEADER_HEIGHT),
                        tab_label: 'Tab 1',
                        sort_order: 1,
                    });
                    newElements.push(tabRes.data);
                }
                // A looper with no row template has nowhere for controls to
                // attach - unlike a tab_container's pages (genuinely
                // optional, added one at a time via "Add Tab"), a looper's
                // one row is mandatory, so it's created in the same breath
                // as the looper itself rather than left for a separate step.
                // The row is sized to LOOPER_DEFAULT_ROW_HEIGHT, not the
                // looper's own full height - a row that fills the whole
                // looper would show as entirely white/editable on the
                // canvas instead of one real row on top of the repeated-
                // rows preview below it (WinDev's own row-height concept).
                if (payload.type === 'looper') {
                    const rowRes = await apiClient.post(`/windows/${windowRow.id}/elements`, {
                        element_type: 'looper_row',
                        source_name: `${sourceName}.ROW`,
                        parent_element_id: res.data.id,
                        x_position: 0,
                        y_position: 0,
                        width,
                        height: LOOPER_DEFAULT_ROW_HEIGHT,
                    });
                    newElements.push(rowRes.data);
                }
                setElements((prev) => [...prev, ...newElements]);
                // Containers/tabs persist immediately (controls dropped
                // into them the same second need a real id to attach to),
                // but the user still expects the Save button to light up
                // as visual proof that *something* changed.
                setHasUnsavedChanges(true);
            } catch (error) {
                console.error(error);
                toast.showError(t.windowdesignerpanel_save_error || 'Failed to save window');
            }
            return;
        }

        const def = CONTROL_GROUPS.flatMap((g) => g.items).find((d) => d.type === payload.type);
        const newControl: WindowControlRow = {
            _key: `ctrl-new-${controlCounterRef.current++}`,
            window_id: windowRow.id,
            container_element_id: target?.id ?? null,
            control_type: payload.type,
            source_name: nextControlSourceName(CONTROL_NAME_PREFIXES[payload.type] || payload.type.toUpperCase()),
            x_position: relX,
            y_position: relY,
            width: def?.w || 200,
            height: def?.h || 36,
            label_position: 'top',
            is_visible: true,
            sort_order: controls.length,
            tab_order: 0,
        };
        setControls((prev) => [...prev, newControl]);
        pendingSelectKeyRef.current = newControl._key;
        setHasUnsavedChanges(true);
    }, [windowRow, controls.length, reactFlowInstance, findContainerAt, absolutePosition, t, nextElementSourceName, nextControlSourceName]);

    // ===== Selection =====
    const selectedSingleKey = selectedKeys.length === 1 ? selectedKeys[0] : null;
    const selectedElement = selectedSingleKey?.startsWith('elem-') ? elements.find((e) => `elem-${e.id}` === selectedSingleKey) || null : null;
    const selectedControl = selectedSingleKey?.startsWith('ctrl-') ? controls.find((c) => controlKey(c) === selectedSingleKey) || null : null;

    const updateSelectedElement = (patch: Partial<WindowElementRow>) => {
        if (!selectedElement) return;
        setElements((prev) => prev.map((e) => (e.id === selectedElement.id ? { ...e, ...patch } : e)));
        setHasUnsavedChanges(true);
    };
    const updateSelectedControl = (patch: Partial<WindowControlRow>) => {
        if (!selectedControl) return;
        setControls((prev) => prev.map((c) => (controlKey(c) === controlKey(selectedControl) ? { ...c, ...patch } : c)));
        setHasUnsavedChanges(true);
    };
    // Shared by the inline single-line Caption field AND the static_text
    // multi-line editor Dialog below (both ultimately write the same
    // caption_override/caption_labels pair) - a button's own access-key
    // extraction ("&Save" -> caption "Save" + Alt+S) only makes sense for a
    // button, never for a static_text caption (which is exactly the one
    // control type the multiline editor is offered for), so this one
    // function already covers both callers correctly as-is.
    const applyCaptionChange = (v: string) => {
        if (!selectedControl) return;
        if (selectedControl.control_type === 'button') {
            const { caption, shortcutEnabled, shortcut } = extractAccessKey(v);
            updateSelectedControl({
                caption_override: caption,
                caption_labels: seedLanguageLabels(selectedControl.caption_labels, caption),
                shortcut_enabled: shortcutEnabled,
                shortcut,
            });
        } else {
            updateSelectedControl({ caption_override: v, caption_labels: seedLanguageLabels(selectedControl.caption_labels, v) });
        }
    };
    // Patches an element by id regardless of selection — used to edit a
    // tab_panel's caption from its tab_container's own "Tabs" list, without
    // requiring the user to individually select that (mostly hidden) page
    // node on the canvas first.
    const updateElementById = (id: number, patch: Partial<WindowElementRow>) => {
        setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
        setHasUnsavedChanges(true);
    };

    // Multi-line Caption editor popup (currently only offered for
    // static_text - see LanguageField's onOpenMultilineEditor doc comment).
    // A real line break needs a `<textarea>`; the shared Caption field
    // everywhere else stays a plain single-line `InputText` on purpose.
    const [multilineCaptionEditorOpen, setMultilineCaptionEditorOpen] = useState(false);
    const [multilineCaptionDraft, setMultilineCaptionDraft] = useState('');

    // Translation modal (2026-09-07) - a dedicated popup for going through
    // every project language one at a time for whichever translatable
    // field the user is currently editing (the window's own Display Name,
    // a control's Caption, or a tab page's Caption - see LanguageField's
    // own onOpenTranslate doc comment). Deliberately just a boolean - the
    // modal always describes whatever field the REST of the properties
    // panel is already showing (via translateModalTarget below, derived
    // fresh every render from the same selection state everything else
    // here already reads), never a frozen snapshot captured at the moment
    // the button was clicked - that would go stale the instant the modal's
    // own language dropdown changes selectedLanguage.
    const [translateModalOpen, setTranslateModalOpen] = useState(false);
    // A plain per-render derivation (not useMemo'd) - this component
    // already re-renders on every keystroke elsewhere, so there's no
    // meaningful cost to recomputing this small object each time, and it
    // sidesteps needing every one of applyCaptionChange/seedLanguageLabels/
    // updateSelectedElement/setWindowRow (themselves plain, non-memoized
    // functions redefined every render) in a dependency array.
    const translateModalTarget: { title: string; value: string; onChange: (v: string) => void } | null =
        selectedKeys.length === 0 && windowRow
            ? {
                title: t.windowdesignerpanel_display_name || 'Display Name',
                value: (selectedLanguage && windowRow.display_name_labels?.[selectedLanguage]) || windowRow.display_name || '',
                onChange: (v: string) => {
                    setWindowRow({ ...windowRow, display_name: v, display_name_labels: seedLanguageLabels(windowRow.display_name_labels, v) });
                    setHasUnsavedChanges(true);
                },
            }
            : selectedControl
                ? {
                    title: t.windowdesignerpanel_caption || 'Caption',
                    value: (selectedLanguage && selectedControl.caption_labels?.[selectedLanguage]) || selectedControl.caption_override || '',
                    onChange: applyCaptionChange,
                }
                : selectedElement?.element_type === 'tab_panel'
                    ? {
                        title: t.windowdesignerpanel_caption || 'Caption',
                        value: (selectedLanguage && selectedElement.tab_labels?.[selectedLanguage]) || selectedElement.tab_label || '',
                        onChange: (v: string) => updateSelectedElement({ tab_label: v, tab_labels: seedLanguageLabels(selectedElement.tab_labels, v) }),
                    }
                    : null;

    // ===== Code-behind (SML) =====
    const [codeEditorTarget, setCodeEditorTarget] = useState<WindowCodeEditorTarget | null>(null);
    const [codeEditorVisible, setCodeEditorVisible] = useState(false);
    const [localProceduresVisible, setLocalProceduresVisible] = useState(false);
    const [globalProceduresVisible, setGlobalProceduresVisible] = useState(false);
    const [globalVariablesVisible, setGlobalVariablesVisible] = useState(false);
    const [menuBarDesignerVisible, setMenuBarDesignerVisible] = useState(false);

    // Code-behind needs a real, saved id to attach to - an unsaved
    // control/element (still using its client-side `ctrl-new-*`/negative-id
    // placeholder) has nothing on the server for the events table to point
    // its FK at yet.
    const openCodeEditorForControl = useCallback((c: WindowControlRow) => {
        if (!c.id) {
            toast.showWarn(t.windowdesignerpanel_save_first || 'Save the window first');
            return;
        }
        setCodeEditorTarget({ kind: c.control_type, controlId: c.id, label: effectiveCaption(c) });
        setCodeEditorVisible(true);
    }, [toast, t, effectiveCaption]);

    const openCodeEditorForElement = useCallback((e: WindowElementRow) => {
        if (!e.id) {
            toast.showWarn(t.windowdesignerpanel_save_first || 'Save the window first');
            return;
        }
        setCodeEditorTarget({ kind: e.element_type, elementId: e.id, label: elementLabel(e) });
        setCodeEditorVisible(true);
    }, [toast, t]);

    const openCodeEditorForWindow = useCallback(() => {
        if (!windowRow?.id) return;
        setCodeEditorTarget({ kind: 'window', label: windowRow.display_name || windowRow.name });
        setCodeEditorVisible(true);
    }, [windowRow]);

    const tabsForSelectedContainer = useMemo(() => {
        if (!selectedElement || selectedElement.element_type !== 'tab_container') return [];
        return elements
            .filter((e) => e.element_type === 'tab_panel' && e.parent_element_id === selectedElement.id)
            .sort((a, b) => a.sort_order - b.sort_order);
    }, [elements, selectedElement]);

    const [addingTab, setAddingTab] = useState(false);
    const addTab = async () => {
        // Guards against a double-click firing two overlapping requests
        // before the first one's response (and the resulting new element in
        // `elements`) lands — without this, both requests compute the same
        // "next" index/name and two identical "Tab N" pages get created.
        if (!selectedElement || selectedElement.element_type !== 'tab_container' || !windowRow || addingTab) return;
        setAddingTab(true);
        const nextIndex = tabsForSelectedContainer.length + 1;
        const containerPrefix = selectedElement.source_name || 'TAB';
        const existingTabNames = new Set(tabsForSelectedContainer.map((tp) => tp.source_name).filter(Boolean));
        let n = nextIndex;
        while (existingTabNames.has(`${containerPrefix}.TAB${n}`)) n++;
        try {
            const res = await apiClient.post(`/windows/${windowRow.id}/elements`, {
                element_type: 'tab_panel',
                source_name: `${containerPrefix}.TAB${n}`,
                parent_element_id: selectedElement.id,
                x_position: 0,
                y_position: TAB_HEADER_HEIGHT,
                width: selectedElement.width,
                height: Math.max(20, selectedElement.height - TAB_HEADER_HEIGHT),
                tab_label: `Tab ${nextIndex}`,
                sort_order: nextIndex,
            });
            setElements((prev) => [...prev, res.data]);
            setHasUnsavedChanges(true);
        } catch (error) {
            console.error(error);
            toast.showError(t.windowdesignerpanel_save_error || 'Failed to save window');
        } finally {
            setAddingTab(false);
        }
    };

    // Deleting a tab deletes only that page — its FK is ON DELETE SET NULL
    // (matches every other element/control parent relationship in this
    // designer), so anything that was placed on it lands back at the
    // window root instead of being destroyed.
    const deleteTab = async (tabId: number) => {
        try {
            await apiClient.delete(`/window-elements/${tabId}`);
            await refreshElementsAndControls();
        } catch (error) {
            console.error(error);
            toast.showError(t.windowdesignerpanel_save_error || 'Failed to save window');
        }
    };

    // ===== Multi-selection bulk edit (controls only — a lasso over a mix of
    // controls and containers, or over containers alone, falls back to the
    // plain "multiple selected" message below) =====
    const multiSelectedControls = useMemo(() => {
        if (selectedKeys.length < 2 || !selectedKeys.every((k) => k.startsWith('ctrl-'))) return [];
        return controls.filter((c) => selectedKeys.includes(controlKey(c)));
    }, [selectedKeys, controls]);

    const updateMultipleControls = useCallback((keys: string[], patch: Partial<WindowControlRow>) => {
        const keySet = new Set(keys);
        setControls((prev) => prev.map((c) => (keySet.has(controlKey(c)) ? { ...c, ...patch } : c)));
        setHasUnsavedChanges(true);
    }, []);

    // Returns the common value across all items for a field, or undefined if
    // they differ — feeds a Dropdown's `value` so it shows its placeholder
    // ("Mixed") instead of silently picking the first item's value.
    const sharedControlValue = <K extends keyof WindowControlRow>(items: WindowControlRow[], key: K): WindowControlRow[K] | undefined => {
        if (items.length === 0) return undefined;
        const first = items[0][key];
        return items.every((it) => it[key] === first) ? first : undefined;
    };

    // ===== Align / Distribute toolbar (2026-09-06 follow-up, item e) =====
    // Every "align to X" operation below moves every OTHER selected control
    // to match the reference control - which is always the FIRST one the
    // user selected (see orderedSelection's own doc comment), never an
    // internal array/sort order.
    type AlignKind = 'left' | 'right' | 'top' | 'bottom' | 'same_width' | 'same_height' | 'same_label_width'
        | 'distribute_h' | 'distribute_v' | 'center_h_window' | 'center_v_window';

    const alignControls = (kind: AlignKind) => {
        if (kind === 'center_h_window' || kind === 'center_v_window') {
            if (!selectedControl || !windowRow) return;
            if (kind === 'center_h_window') {
                updateSelectedControl({ x_position: Math.max(0, Math.round((windowRow.canvas_width - selectedControl.width) / 2)) });
            } else {
                updateSelectedControl({ y_position: Math.max(0, Math.round((windowRow.canvas_height - selectedControl.height) / 2)) });
            }
            return;
        }
        if (multiSelectedControls.length < 2) return;

        if (kind === 'distribute_h' || kind === 'distribute_v') {
            // Equal-gap distribution needs at least 3 controls to have a
            // meaningful "gap" at all (2 controls only ever have the one
            // gap between them, nothing to equalize) - always geometric
            // (leftmost/topmost first), unlike align below, since
            // "distribute evenly across the span" has no sensible
            // "relative to whichever I clicked first" reading.
            if (multiSelectedControls.length < 3) return;
            const axisPos = kind === 'distribute_h' ? 'x_position' as const : 'y_position' as const;
            const axisSize = kind === 'distribute_h' ? 'width' as const : 'height' as const;
            const sorted = [...multiSelectedControls].sort((a, b) => a[axisPos] - b[axisPos]);
            const first = sorted[0];
            const last = sorted[sorted.length - 1];
            const totalSpan = (last[axisPos] + last[axisSize]) - first[axisPos];
            const totalSize = sorted.reduce((sum, c) => sum + c[axisSize], 0);
            const gap = (totalSpan - totalSize) / (sorted.length - 1);
            const updates = new Map<string, number>();
            let cursor = first[axisPos];
            sorted.forEach((c) => {
                updates.set(controlKey(c), Math.round(cursor));
                cursor += c[axisSize] + gap;
            });
            setControls((prev) => prev.map((c) => (updates.has(controlKey(c)) ? { ...c, [axisPos]: updates.get(controlKey(c))! } : c)));
            setHasUnsavedChanges(true);
            return;
        }

        // The first surviving entry in orderedSelection that's actually one
        // of the currently multi-selected CONTROLS (orderedSelection can
        // also carry element keys from an earlier selection that's since
        // been narrowed down) - falls back to array order only if selection
        // tracking somehow never caught up (defensive, should not normally
        // happen).
        const referenceKey = orderedSelection.find((k) => multiSelectedControls.some((c) => controlKey(c) === k));
        const reference = multiSelectedControls.find((c) => controlKey(c) === referenceKey) || multiSelectedControls[0];
        const targetKeys = new Set(multiSelectedControls.filter((c) => controlKey(c) !== controlKey(reference)).map((c) => controlKey(c)));
        setControls((prev) => prev.map((c) => {
            if (!targetKeys.has(controlKey(c))) return c;
            switch (kind) {
                case 'left': return { ...c, x_position: reference.x_position };
                case 'right': return { ...c, x_position: reference.x_position + reference.width - c.width };
                case 'top': return { ...c, y_position: reference.y_position };
                case 'bottom': return { ...c, y_position: reference.y_position + reference.height - c.height };
                case 'same_width': return { ...c, width: reference.width };
                case 'same_height': return { ...c, height: reference.height };
                case 'same_label_width': return { ...c, label_width: reference.label_width };
                default: return c;
            }
        }));
        setHasUnsavedChanges(true);
    };

    const alignMenuModel: MenuItem[] = [
        { label: t.windowdesignerpanel_align_left_edge || 'Align Left', icon: 'pi pi-align-left', command: () => alignControls('left'), disabled: multiSelectedControls.length < 2 },
        { label: t.windowdesignerpanel_align_right_edge || 'Align Right', icon: 'pi pi-align-right', command: () => alignControls('right'), disabled: multiSelectedControls.length < 2 },
        { label: t.windowdesignerpanel_align_top_edge || 'Align Top', icon: 'pi pi-arrow-up', command: () => alignControls('top'), disabled: multiSelectedControls.length < 2 },
        { label: t.windowdesignerpanel_align_bottom_edge || 'Align Bottom', icon: 'pi pi-arrow-down', command: () => alignControls('bottom'), disabled: multiSelectedControls.length < 2 },
        { separator: true },
        { label: t.windowdesignerpanel_align_same_width || 'Same Width', icon: 'pi pi-arrows-h', command: () => alignControls('same_width'), disabled: multiSelectedControls.length < 2 },
        { label: t.windowdesignerpanel_align_same_height || 'Same Height', icon: 'pi pi-arrows-v', command: () => alignControls('same_height'), disabled: multiSelectedControls.length < 2 },
        { label: t.windowdesignerpanel_align_same_label_width || 'Same Label Width', icon: 'pi pi-arrows-h', command: () => alignControls('same_label_width'), disabled: multiSelectedControls.length < 2 },
        { separator: true },
        { label: t.windowdesignerpanel_distribute_h || 'Distribute Horizontally', icon: 'pi pi-arrows-h', command: () => alignControls('distribute_h'), disabled: multiSelectedControls.length < 3 },
        { label: t.windowdesignerpanel_distribute_v || 'Distribute Vertically', icon: 'pi pi-arrows-v', command: () => alignControls('distribute_v'), disabled: multiSelectedControls.length < 3 },
        { separator: true },
        { label: t.windowdesignerpanel_center_h_window || 'Center Horizontally in Window', icon: 'pi pi-align-center', command: () => alignControls('center_h_window'), disabled: !selectedControl },
        { label: t.windowdesignerpanel_center_v_window || 'Center Vertically in Window', icon: 'pi pi-align-center', command: () => alignControls('center_v_window'), disabled: !selectedControl },
    ];

    // On the very first edit of a per-language field, seed every enabled
    // language with the same text so switching the language dropdown shows
    // a starting point instead of a blank field — otherwise there is no
    // visible sign that translation is even possible until each language
    // has been touched individually. Subsequent edits only touch the
    // currently selected language.
    const seedLanguageLabels = useCallback((existing: Record<string, string> | null | undefined, newValue: string): Record<string, string> => {
        const labelsMap = { ...(existing || {}) };
        if (Object.keys(labelsMap).length === 0) {
            enabledLanguages.forEach((l) => { labelsMap[l.value] = newValue; });
        }
        if (selectedLanguage) labelsMap[selectedLanguage] = newValue;
        return labelsMap;
    }, [enabledLanguages, selectedLanguage]);

    const copyToAllLanguages = useCallback((current: string): Record<string, string> => {
        const labelsMap: Record<string, string> = {};
        enabledLanguages.forEach((l) => { labelsMap[l.value] = current; });
        return labelsMap;
    }, [enabledLanguages]);

    // ===== Delete =====
    const deleteSelectedElement = async () => {
        if (!selectedElement) return;
        try {
            await apiClient.delete(`/window-elements/${selectedElement.id}`);
            await refreshElementsAndControls();
        } catch (error) {
            console.error(error);
            toast.showError(t.windowdesignerpanel_save_error || 'Failed to save window');
        }
    };
    const deleteSelectedControl = async () => {
        if (!selectedControl) return;
        if (selectedControl.id) {
            try { await apiClient.delete(`/window-controls/${selectedControl.id}`); } catch (error) { console.error(error); }
        }
        setControls((prev) => prev.filter((c) => controlKey(c) !== controlKey(selectedControl)));
        setHasUnsavedChanges(true);
    };

    // ===== Delete the whole window (top-bar action — the Explorer sidebar's
    // right-click "Delete" does the same thing, this just makes it
    // discoverable without needing to know that context menus exist) =====
    const handleDeleteWindow = () => {
        if (!windowRow) return;
        confirmDialog({
            message: t.windowmanagementpanel_delete_window_confirm || 'Delete this window? This cannot be undone.',
            header: t.windowmanagementpanel_delete || 'Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await apiClient.delete(`/windows/${windowRow.id}`);
                    window.dispatchEvent(new CustomEvent('windowsChanged'));
                    setActiveWindowId(null);
                    // The window (and any pending local edits for it) is
                    // gone — a leftover "unsaved changes" flag would
                    // otherwise trigger handleSelectWindow's confirm dialog
                    // on the very next, unrelated window.
                    setHasUnsavedChanges(false);
                } catch (error) {
                    console.error(error);
                    toast.showError(t.windowdesignerpanel_save_error || 'Failed to save window');
                }
            },
        });
    };

    // ===== Tab order =====
    const tabOrderElements = useMemo(() => controls
        .filter((c) => typeof c.id === 'number')
        .map((c) => ({
            id: c.id as number,
            element_type: c.control_type,
            x_position: c.x_position,
            y_position: c.y_position,
            button_label: effectiveCaption(c),
            tab_order: c.tab_order,
        })), [controls, effectiveCaption]);

    const applyTabOrder = (activeIds: number[], excludedIds: number[]) => {
        setControls((prev) => prev.map((c) => {
            const activeIdx = activeIds.indexOf(c.id as number);
            if (activeIdx >= 0) return { ...c, tab_order: activeIdx + 1 };
            if (excludedIds.includes(c.id as number)) return { ...c, tab_order: -1 };
            return c;
        }));
        setHasUnsavedChanges(true);
    };

    const applyAutoTabOrder = () => {
        const rows = new Map<number, WindowControlRow[]>();
        controls.forEach((c) => {
            const bucket = Math.round(c.y_position / 20);
            if (!rows.has(bucket)) rows.set(bucket, []);
            rows.get(bucket)!.push(c);
        });
        const sortedBuckets = [...rows.keys()].sort((a, b) => a - b);
        let order = 1;
        const nextOrder = new Map<string, number>();
        sortedBuckets.forEach((b) => {
            rows.get(b)!.sort((a, c) => a.x_position - c.x_position).forEach((c) => nextOrder.set(controlKey(c), order++));
        });
        setControls((prev) => prev.map((c) => ({ ...c, tab_order: nextOrder.get(controlKey(c)) ?? c.tab_order })));
        setHasUnsavedChanges(true);
    };

    const tabOrderMenuModel: MenuItem[] = [
        { label: t.windowdesignerpanel_tab_order_auto || 'Auto', icon: 'pi pi-sort-amount-down', command: applyAutoTabOrder },
        { label: t.windowdesignerpanel_tab_order_edit || 'Edit...', icon: 'pi pi-pencil', command: () => setTabOrderModalVisible(true) },
    ];

    // ===== Save =====
    // Returns whether the save actually succeeded (2026-09-07, items c/d) -
    // the unsaved-changes prompts for closing the whole panel/switching
    // windows need to know this before deciding whether it's safe to
    // proceed with the close/switch, the same way they'd never want to
    // silently proceed past a FAILED save.
    const handleSave = async (): Promise<boolean> => {
        if (!windowRow) return false;
        // A control/element with no source_name compiles into nothing
        // usable (no SML/template can ever address it) - dropping one now
        // always assigns a default name immediately (see
        // nextControlSourceName/nextElementSourceName above), but a user
        // can still clear it by hand in the sidebar's own name field, so
        // this is the last line of defense before that reaches the DB.
        const unnamedControl = controls.find((c) => !c.source_name || !c.source_name.trim());
        const unnamedElement = elements.find((el) => !el.source_name || !el.source_name.trim());
        if (unnamedControl || unnamedElement) {
            toast.showError(t.windowdesignerpanel_unnamed_control_error || 'Every control/element needs a name before saving');
            // Select the actual offending control/element instead of just
            // naming the problem and leaving the user to hunt through
            // every control by hand (2026-09-15 follow-up) - the same
            // force-select mechanism a freshly-dropped control already
            // uses (see pendingSelectKeyRef's own doc comment), triggered
            // directly here since NOTHING about `elements`/`controls`
            // itself changes on its own to naturally re-run buildNodes().
            pendingSelectKeyRef.current = unnamedControl ? controlKey(unnamedControl) : `elem-${unnamedElement!.id}`;
            setNodes(buildNodes());
            return false;
        }
        setSaving(true);
        // A real, step-based progress readout (0/33/66/100 - one third per
        // request actually completed), not a fake bar animating toward a
        // number that means nothing - see item (i) of the 2026-09-05 bug
        // list. The whole point of showing it is to make the (still
        // sequential, still occasionally slow for a huge window) save
        // visibly move, not to claim precision it doesn't have.
        setSaveProgress(0);
        try {
            const winRes = await apiClient.put(`/windows/${windowRow.id}`, {
                name: windowRow.name,
                display_name: windowRow.display_name,
                display_name_labels: windowRow.display_name_labels,
                description: windowRow.description,
                schema_table_id: windowRow.schema_table_id,
                canvas_width: windowRow.canvas_width,
                canvas_height: windowRow.canvas_height,
                background_color: windowRow.background_color,
                window_color: windowRow.window_color,
                text_color: windowRow.text_color,
                background_image: windowRow.background_image,
                has_status_bar: windowRow.has_status_bar ?? false,
            });
            setSaveProgress(33);
            const elRes = await apiClient.put(`/windows/${windowRow.id}/elements`, { elements });
            setSaveProgress(66);
            const ctrlRes = await apiClient.put(`/windows/${windowRow.id}/controls`, {
                controls: controls.map((c) => ({ ...c, id: c.id })),
            });
            setSaveProgress(100);
            // Re-sync all three from what the backend actually persisted -
            // previously only `controls` did this (via ctrlRes below);
            // `windowRow`/`elements` kept whatever the LOCAL pre-save state
            // happened to be, which is usually identical but silently
            // drifts from the real DB row the moment a value gets rejected/
            // coerced server-side (e.g. a validation rule trimming/nulling
            // a field) - the canvas would then keep rendering the client's
            // optimistic guess instead of what Save actually wrote.
            if (winRes?.data) {
                setWindowRow(winRes.data);
            }
            setElements(elRes.data || []);
            setControls((ctrlRes.data || []).map((c: any) => ({ ...c, _key: `ctrl-${c.id}` })));
            setHasUnsavedChanges(false);
            toast.showSuccess(t.windowdesignerpanel_saved || 'Window saved');
            return true;
        } catch (error) {
            console.error(error);
            toast.showError(t.windowdesignerpanel_save_error || 'Failed to save window');
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Resolves whatever `pendingAction` is currently showing the 3-way
    // prompt for - shared by both the "switch window" and "close panel"
    // triggers (see pendingAction's own doc comment) since both just need
    // "proceed" vs "stay" once the user has answered.
    const proceedPendingAction = () => {
        if (!pendingAction) return;
        if (pendingAction.kind === 'switch') setActiveWindowId(pendingAction.windowId);
        else pendingAction.onConfirmed();
        setPendingAction(null);
    };
    const handlePendingActionSave = async () => {
        const ok = await handleSave();
        // A failed save leaves the prompt open exactly as it was - the
        // toast from handleSave() itself already explains what went wrong,
        // and proceeding anyway (switching away/closing) would be exactly
        // the silent data loss this whole feature exists to prevent.
        if (ok) proceedPendingAction();
    };
    const handlePendingActionDiscard = () => proceedPendingAction();
    const handlePendingActionCancel = () => setPendingAction(null);

    // Exposes this panel's unsaved-changes state/close-guard to the MDI
    // shell (Index.tsx) - see WindowDesignerPanelHandle's own doc comment.
    // There is only ever one Window Designer tab, so this is the ONE place
    // rc-dock's own tab-close action needs to check before actually
    // removing the tab from its layout.
    useImperativeHandle(ref, () => ({
        hasUnsavedChanges: () => hasUnsavedChanges,
        requestClose: (onConfirmed: () => void) => {
            if (hasUnsavedChanges) {
                setPendingAction({ kind: 'close', onConfirmed });
            } else {
                onConfirmed();
            }
        },
    }), [hasUnsavedChanges]);

    // ===== Global keyboard shortcuts: Delete/Backspace (remove the selected
    // control/element) and Ctrl+S/Cmd+S (save the window) =====
    // A document-level listener (same established pattern as
    // FormDesignerPanel/ReportPatternDesignerPanel/ReportLayoutDesignerPanel)
    // rather than an onKeyDown scoped to the ReactFlow canvas div - a node
    // selected PROGRAMMATICALLY (pendingSelectKeyRef, e.g. right after
    // dropping a new control or clicking a tab) never actually receives real
    // DOM focus, so a listener scoped to "whatever has focus" could silently
    // never fire for exactly the selection the user is looking at.
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // The Code modal (Project Init/Window/Control event editor) owns
            // Ctrl+S and Delete/Backspace entirely while it's open - it used
            // to fall through to here too (both listeners are document-
            // level, so both fired), meaning every Ctrl+S while just editing
            // ONE event's code ALSO triggered a full window save (window +
            // ALL elements + ALL controls) underneath it, which is slower
            // and pointless when only the code changed. See
            // WindowCodeEditorModal's own Ctrl+S handler.
            if (codeEditorVisible || multilineCaptionEditorOpen || pendingAction) return;
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                if (!saving) handleSave();
                return;
            }
            if (event.key !== 'Delete' && event.key !== 'Backspace') return;
            // Nothing may change while a save is in flight - see the
            // save-lock modal below (item i of the 2026-09-05 bug list).
            if (saving) return;
            // Don't hijack Delete/Backspace while the user is actually
            // typing (a caption, a field name, a color hex value, ...) -
            // matches every other panel's identical guard.
            const target = event.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
            event.preventDefault();
            if (multiSelectedControls.length > 1) {
                const keys = new Set(multiSelectedControls.map((c) => controlKey(c)));
                const ids = multiSelectedControls.map((c) => c.id).filter((cid): cid is number => !!cid);
                setControls((prev) => prev.filter((c) => !keys.has(controlKey(c))));
                setHasUnsavedChanges(true);
                ids.forEach((cid) => { apiClient.delete(`/window-controls/${cid}`).catch((err) => console.error(err)); });
            } else if (selectedControl) {
                deleteSelectedControl();
            } else if (selectedElement) {
                deleteSelectedElement();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [saving, handleSave, multiSelectedControls, selectedControl, selectedElement, codeEditorVisible, multilineCaptionEditorOpen, pendingAction]);

    const SIDEBAR_COLLAPSED_WIDTH = 36;

    return (
        <div className="window-designer-panel h-full flex" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
            <ConfirmDialog />

            {/* Save-in-progress lock (item i of the 2026-09-05 bug list) -
                the save round trip is 3 sequential requests (window, then
                elements, then controls - see handleSave), and it used to
                stay fully editable throughout: any control moved/renamed
                while it was in flight got silently discarded the moment
                handleSave's own responses came back and re-synced local
                state from what the server actually persisted. A PrimeReact
                `modal` Dialog's own backdrop already blocks pointer/keyboard
                interaction with EVERYTHING behind it (the canvas, the
                properties panel, AND the Explorer sidebar's own "switch
                window" clicks) for free - no separate per-control
                "disabled" plumbing needed, and no risk of missing a spot. */}
            <Dialog
                visible={saving}
                // No real way to hide this early (there's no cancel for a
                // save already in flight) - PrimeReact's Dialog still
                // requires the prop, it's just never actually reachable
                // with closable/dismissableMask both off.
                onHide={() => {}}
                closable={false}
                showHeader={false}
                modal
                dismissableMask={false}
                style={{ width: 360 }}
                contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary, padding: '24px 20px', borderRadius: 8 }}
            >
                <div className="flex flex-col items-center gap-3">
                    <i className="pi pi-spin pi-spinner" style={{ fontSize: 24, color: colors.textSecondary }} />
                    <div className="text-sm font-medium">{t.windowdesignerpanel_saving_wait || 'Saving, please wait...'}</div>
                    <ProgressBar value={saveProgress} showValue={false} style={{ width: '100%', height: 8 }} />
                </div>
            </Dialog>

            {/* Multi-line Caption editor (static_text only) - see
                LanguageField's onOpenMultilineEditor doc comment. A plain
                `<textarea>` is the only reliable way to let the user type
                real line breaks; copy/pasting multi-line text into the
                single-line Caption field above silently collapses them
                (an HTML `<input>` fundamentally can't hold a newline). */}
            <Dialog
                header={t.windowdesignerpanel_multiline_caption_title || 'Edit Caption'}
                visible={multilineCaptionEditorOpen}
                onHide={() => setMultilineCaptionEditorOpen(false)}
                style={{ width: 480 }}
                contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
                modal
            >
                <div className="text-xs mb-2" style={{ color: colors.textMuted }}>
                    {t.windowdesignerpanel_multiline_caption_hint || 'You can type real line breaks here (press Enter for a new line).'}
                </div>
                <InputTextarea
                    className="w-full p-inputtext-sm"
                    rows={6}
                    autoFocus
                    value={multilineCaptionDraft}
                    onChange={(e) => setMultilineCaptionDraft(e.target.value)}
                />
                <div className="flex justify-end gap-2 mt-3">
                    <Button label={t.applicationsmodal432 || 'Cancel'} severity="secondary" onClick={() => setMultilineCaptionEditorOpen(false)} />
                    <Button
                        label={t.windowdesignerpanel_apply || 'Apply'}
                        severity="success"
                        onClick={() => {
                            applyCaptionChange(multilineCaptionDraft);
                            setMultilineCaptionEditorOpen(false);
                        }}
                    />
                </div>
            </Dialog>

            {/* Translation modal (2026-09-07) - see LanguageField's
                onOpenTranslate doc comment. Deliberately `modal={false}`
                (a floating, draggable panel with NO backdrop) instead of a
                normal blocking Dialog - the entire point is watching the
                canvas behind it (the window's own title bar, or whichever
                control/tab is selected) update live as the language
                dropdown below changes selectedLanguage, exactly like
                switching the toolbar's own language dropdown already does
                everywhere else - this is only a focused, dedicated place
                to do that same switch language-by-language for ONE field
                without also needing to manage the rest of the properties
                panel at the same time. */}
            {translateModalTarget && (
                <Dialog
                    header={`${t.windowdesignerpanel_translate || 'Translate'} - ${translateModalTarget.title}`}
                    visible={translateModalOpen}
                    onHide={() => setTranslateModalOpen(false)}
                    style={{ width: 380 }}
                    contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
                    headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
                    modal={false}
                    draggable
                    closable
                >
                    <div className="mb-3">
                        <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_language || 'Language'}</label>
                        <Dropdown
                            className="w-full p-inputtext-sm"
                            value={selectedLanguage}
                            options={enabledLanguages}
                            onChange={(e) => setSelectedLanguage(e.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">{translateModalTarget.title}</label>
                        <InputText
                            className="w-full p-inputtext-sm"
                            autoFocus
                            value={translateModalTarget.value}
                            onChange={(e) => translateModalTarget.onChange(e.target.value)}
                        />
                    </div>
                </Dialog>
            )}

            {/* Unsaved-changes prompt (2026-09-07, items c/d) - shared by
                "switch to a different window" and "close the whole panel"
                (see pendingAction's own doc comment), same 3-way Save/
                Cancel/Discard wording as WindowCodeEditorModal's own
                unsaved-changes dialog rather than PrimeReact's generic
                2-way confirmDialog() the window-switch case used to rely
                on (no way to save from there at all, and "Discard" was
                worded as the ONLY accept action - confirmed confusing/
                risky by the user). */}
            <Dialog
                header={t.windowcodeeditor_unsaved_title || 'Unsaved Changes'}
                visible={pendingAction != null}
                onHide={() => setPendingAction(null)}
                style={{ width: 420 }}
                contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
                modal
                closable={!saving}
            >
                <div className="text-sm mb-4">
                    {(t.windowcodeeditor_unsaved_message || '"{name}" has been modified. Do you want to save the changes now?').replace('{name}', windowRow ? effectiveWindowDisplayName(windowRow) : '')}
                </div>
                <div className="flex justify-end gap-2">
                    <Button
                        label={t.windowcodeeditor_discard_changes || 'Discard Changes'}
                        severity="danger"
                        className="p-button-outlined"
                        onClick={handlePendingActionDiscard}
                        disabled={saving}
                    />
                    <Button
                        label={t.applicationsmodal432 || 'Cancel'}
                        severity="secondary"
                        onClick={handlePendingActionCancel}
                        disabled={saving}
                    />
                    <Button
                        label={t.windowdesignerpanel_save || 'Save'}
                        severity="success"
                        icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                        onClick={handlePendingActionSave}
                        disabled={saving}
                    />
                </div>
            </Dialog>

            {/* EXPLORER SIDEBAR — pinned: takes real layout space; unpinned:
                collapses to a thin rail and pops open as a floating overlay
                on hover (VS Code "unpinned tool window" behavior). */}
            <div
                style={{ width: sidebarPinned ? sidebarWidth : SIDEBAR_COLLAPSED_WIDTH, flexShrink: 0, position: 'relative', height: '100%' }}
                onMouseEnter={handleSidebarMouseEnter}
                onMouseLeave={handleSidebarMouseLeave}
            >
                {!sidebarPinned && (
                    <div
                        className="h-full flex flex-col items-center pt-3 cursor-pointer"
                        style={{ width: SIDEBAR_COLLAPSED_WIDTH, borderRight: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}
                        onClick={() => setSidebarHovering(true)}
                    >
                        <i className="pi pi-desktop" style={{ color: colors.textSecondary }} title={t.windowmanagementpanel_title || 'Windows'} />
                    </div>
                )}
                {/* Always mounted (never conditionally rendered) once first
                    shown, so the Explorer's own window/category list stays
                    in memory across pin/unpin hover cycles — unmounting it
                    every time was forcing a full reload (and its several
                    seconds of "Loading windows...") on every single hover,
                    even though nothing had changed. Only `display` toggles. */}
                <div
                    style={{
                        display: sidebarExpanded ? 'block' : 'none',
                        position: sidebarPinned ? 'relative' : 'absolute',
                        top: 0, left: 0,
                        height: '100%',
                        width: sidebarWidth,
                        zIndex: sidebarPinned ? 'auto' : 40,
                        boxShadow: sidebarPinned ? 'none' : '4px 0 20px rgba(0,0,0,0.45)',
                        borderRight: `1px solid ${colors.borderPrimary}`,
                    }}
                >
                    <WindowExplorerSidebar
                        activeWindowId={activeWindowId}
                        onSelectWindow={handleSelectWindow}
                        onActiveWindowRenamed={handleActiveWindowRenamed}
                        onActiveWindowDeleted={handleActiveWindowDeleted}
                        isPinned={sidebarPinned}
                        onTogglePinned={() => setSidebarPinned((p) => !p)}
                    />
                    {sidebarPinned && (
                        <div
                            className="absolute top-0 right-0 cursor-col-resize transition-colors"
                            style={{ width: 4, height: '100%', marginRight: -2, backgroundColor: isResizingSidebar ? colors.accent : 'transparent' }}
                            onMouseDown={handleSidebarResizeStart}
                        />
                    )}
                </div>
            </div>

            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {activeWindowId == null ? (
                    <div className="h-full flex items-center justify-center" style={{ color: colors.textMuted }}>
                        {t.windowdesignerpanel_no_windows_selected || 'No window selected'}
                    </div>
                ) : loading || !windowRow ? (
                    <div className="h-full flex items-center justify-center" style={{ color: colors.textMuted }}>
                        {t.windowmanagementpanel_loading || 'Loading windows...'}
                    </div>
                ) : (
                    <>
            {/* TOP BAR */}
            <div className="flex items-center justify-between gap-3 px-3 py-2" style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}>
                <div className="font-semibold text-sm">{effectiveWindowDisplayName(windowRow)}</div>
                <div className="flex items-center gap-2">
                    <Dropdown
                        value={selectedLanguage}
                        options={enabledLanguages}
                        onChange={(e) => setSelectedLanguage(e.value)}
                        className="w-24"
                        placeholder={t.windowdesignerpanel_language || 'Language'}
                    />
                    <Button
                        label={t.windowdesignerpanel_global_procedures || 'Global Procedures'}
                        icon="pi pi-globe"
                        className="p-button-secondary p-button-sm"
                        onClick={() => setGlobalProceduresVisible(true)}
                    />
                    <Button
                        label={t.windowdesignerpanel_project_declarations || 'Project Declarations'}
                        icon="pi pi-database"
                        className="p-button-secondary p-button-sm"
                        onClick={() => setGlobalVariablesVisible(true)}
                    />
                    <Button
                        label={t.windowdesignerpanel_menu_bar || 'Menu Bar'}
                        icon="pi pi-bars"
                        className="p-button-secondary p-button-sm"
                        onClick={() => setMenuBarDesignerVisible(true)}
                    />
                    <Button
                        label={t.windowdesignerpanel_align || 'Align'}
                        icon="pi pi-th-large"
                        className="p-button-secondary p-button-sm"
                        onClick={(e) => alignMenuRef.current?.toggle(e)}
                    />
                    <Menu model={alignMenuModel} popup ref={alignMenuRef} />
                    <Button
                        label={t.windowdesignerpanel_tab_order || 'Tab Order'}
                        icon="pi pi-sort-numeric-down"
                        className="p-button-secondary p-button-sm"
                        onClick={(e) => tabOrderMenuRef.current?.toggle(e)}
                    />
                    <Menu model={tabOrderMenuModel} popup ref={tabOrderMenuRef} />
                    <Button
                        icon="pi pi-trash"
                        className="p-button-text p-button-danger p-button-sm"
                        onClick={handleDeleteWindow}
                        tooltip={t.windowmanagementpanel_delete || 'Delete'}
                        tooltipOptions={{ position: 'bottom' }}
                    />
                    <Button
                        label={t.windowdesignerpanel_save || 'Save'}
                        icon="pi pi-save"
                        className="p-button-success p-button-sm"
                        onClick={handleSave}
                        loading={saving}
                        // Disabled for the whole time the Code modal is open
                        // (not just while its own save is in flight) - Ctrl+S
                        // in there now only saves that one event's code (see
                        // the global keydown handler's own doc comment), so
                        // this button saving the ENTIRE window underneath it
                        // would be a confusing second, much slower path to
                        // the same "did my code get saved" question.
                        disabled={!hasUnsavedChanges || codeEditorVisible}
                        tooltip={codeEditorVisible ? (t.windowdesignerpanel_save_disabled_code_open || 'Close the Code window first') : undefined}
                        tooltipOptions={{ position: 'bottom' }}
                    />
                </div>
            </div>

            {/* PALETTE BAR — horizontal, scrollable */}
            <div className="flex items-stretch gap-4 px-3 py-2 overflow-x-auto" style={{ borderBottom: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
                <div className="flex items-center gap-1 pr-3" style={{ borderRight: `1px solid ${colors.borderPrimary}` }}>
                    {ELEMENT_DEFS.map((item) => (
                        <div
                            key={item.type}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData('application/window-item', JSON.stringify({ kind: 'element', type: item.type }))}
                            title={label(t, item.tKey, item.fallback)}
                            className="flex flex-col items-center justify-center px-2 py-1 rounded cursor-grab"
                            style={{ minWidth: 56, border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgTertiary }}
                        >
                            <i className={`pi ${item.icon}`} style={{ fontSize: 16 }} />
                            <span style={{ fontSize: 9, marginTop: 2, whiteSpace: 'nowrap' }}>{label(t, item.tKey, item.fallback)}</span>
                        </div>
                    ))}
                </div>
                {CONTROL_GROUPS.map((group) => (
                    <div key={group.tKey} className="flex items-center gap-1 pr-3" style={{ borderRight: `1px solid ${colors.borderPrimary}` }}>
                        {group.items.map((item) => (
                            <div
                                key={item.type}
                                draggable
                                onDragStart={(e) => e.dataTransfer.setData('application/window-item', JSON.stringify({ kind: 'control', type: item.type }))}
                                title={label(t, item.tKey, item.fallback)}
                                className="flex flex-col items-center justify-center px-2 py-1 rounded cursor-grab"
                                style={{ minWidth: 56, border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgTertiary }}
                            >
                                <i className={`pi ${item.icon}`} style={{ fontSize: 16 }} />
                                <span style={{ fontSize: 9, marginTop: 2, whiteSpace: 'nowrap' }}>{label(t, item.tKey, item.fallback)}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* MAIN AREA: canvas + properties */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1" onDrop={handleDrop} onDragOver={handleDragOver}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        onNodesChange={handleNodesChange}
                        multiSelectionKeyCode={MULTI_SELECTION_KEYS}
                        selectionOnDrag
                        selectionMode={SelectionMode.Partial}
                        panOnDrag={PAN_ON_DRAG_BUTTONS}
                        // Defense-in-depth alongside the save-lock Dialog's
                        // own modal backdrop (which already blocks pointer/
                        // keyboard input to the whole page) - belt and
                        // braces in case some other floating panel's own
                        // z-index ever fights the Dialog's for the pointer.
                        nodesDraggable={!saving}
                        nodesConnectable={!saving}
                        elementsSelectable={!saving}
                        minZoom={0.25}
                        maxZoom={2}
                        proOptions={{ hideAttribution: true }}
                        // ReactFlow's own built-in delete-key handling only
                        // removes nodes from its internal render state, not
                        // from our controls/elements — the node would just
                        // reappear on the next data-driven rebuild. Disable
                        // it and delete through the same functions the
                        // trash-icon buttons use instead.
                        deleteKeyCode={null}
                        onNodeDoubleClick={(_event, node) => {
                            if (node.id.startsWith('ctrl-')) {
                                const c = controls.find((c) => controlKey(c) === node.id);
                                if (c) openCodeEditorForControl(c);
                            } else if (node.id.startsWith('elem-')) {
                                const el = elements.find((e) => `elem-${e.id}` === node.id);
                                if (el) openCodeEditorForElement(el);
                            }
                        }}
                    >
                        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
                        <Controls />
                        <MiniMap pannable zoomable style={{ width: 120, height: 90 }} />
                    </ReactFlow>
                </div>

                {/* PROPERTIES PANEL */}
                <div className="properties-panel overflow-y-auto p-3" style={{ width: 300, borderLeft: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
                    <div className="font-semibold text-sm mb-3">{t.windowdesignerpanel_properties || 'Properties'}</div>

                    {selectedKeys.length > 1 && (
                        multiSelectedControls.length > 1 ? (
                            <div className="space-y-3">
                                <div className="text-xs font-semibold" style={{ color: colors.textMuted }}>
                                    {tpl(t.windowdesignerpanel_multi_edit_count || '{count} controls selected', { count: String(multiSelectedControls.length) })}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_label_position || 'Label Position'}</label>
                                    <Dropdown
                                        className="w-full p-inputtext-sm"
                                        value={sharedControlValue(multiSelectedControls, 'label_position') ?? null}
                                        placeholder={t.windowdesignerpanel_multi_mixed || '— Mixed —'}
                                        options={[
                                            { label: t.windowdesignerpanel_label_position_top || 'Top', value: 'top' },
                                            { label: t.windowdesignerpanel_label_position_left || 'Left', value: 'left' },
                                            { label: t.windowdesignerpanel_label_position_right || 'Right', value: 'right' },
                                            { label: t.windowdesignerpanel_label_position_none || 'None', value: 'none' },
                                        ]}
                                        onChange={(e) => updateMultipleControls(selectedKeys, { label_position: e.value })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium">{t.windowdesignerpanel_visible || 'Visible'}</label>
                                    <InputSwitch
                                        checked={multiSelectedControls.every((c) => c.is_visible)}
                                        onChange={(e) => updateMultipleControls(selectedKeys, { is_visible: e.value })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium">{t.windowdesignerpanel_required || 'Required'}</label>
                                    <InputSwitch
                                        checked={multiSelectedControls.every((c) => !!c.is_required)}
                                        onChange={(e) => updateMultipleControls(selectedKeys, { is_required: e.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_state || 'State'}</label>
                                    <Dropdown
                                        className="w-full p-inputtext-sm"
                                        value={sharedControlValue(multiSelectedControls, 'control_state') ?? null}
                                        placeholder={t.windowdesignerpanel_multi_mixed || '— Mixed —'}
                                        options={[
                                            { label: t.windowdesignerpanel_state_active || 'Active', value: 'active' },
                                            { label: t.windowdesignerpanel_state_display_only || 'Display Only', value: 'display_only' },
                                            { label: t.windowdesignerpanel_state_grayed || 'Grayed', value: 'grayed' },
                                        ]}
                                        onChange={(e) => updateMultipleControls(selectedKeys, { control_state: e.value })}
                                    />
                                </div>

                                <div className="pt-2" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                                    <div className="text-xs font-semibold mb-2">{t.windowdesignerpanel_appearance || 'Appearance'}</div>

                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-medium">{t.windowdesignerpanel_background_color || 'Background Color'}</label>
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={sharedControlValue(multiSelectedControls, 'control_background_color') || '#1e1e2e'}
                                                onChange={(e) => updateMultipleControls(selectedKeys, { control_background_color: e.target.value })}
                                                className="w-6 h-6 rounded border border-gray-600 cursor-pointer bg-transparent" style={{ padding: 0 }} />
                                            <InputText className="w-20 p-inputtext-sm" value={sharedControlValue(multiSelectedControls, 'control_background_color') || ''}
                                                onChange={(e) => updateMultipleControls(selectedKeys, { control_background_color: e.target.value || null })}
                                                placeholder={sharedControlValue(multiSelectedControls, 'control_background_color') === undefined ? (t.windowdesignerpanel_multi_mixed || '— Mixed —') : '#1e1e2e'} />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-medium">{t.windowdesignerpanel_text_color || 'Font Color'}</label>
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={sharedControlValue(multiSelectedControls, 'control_text_color') || '#e5e7eb'}
                                                onChange={(e) => updateMultipleControls(selectedKeys, { control_text_color: e.target.value })}
                                                className="w-6 h-6 rounded border border-gray-600 cursor-pointer bg-transparent" style={{ padding: 0 }} />
                                            <InputText className="w-20 p-inputtext-sm" value={sharedControlValue(multiSelectedControls, 'control_text_color') || ''}
                                                onChange={(e) => updateMultipleControls(selectedKeys, { control_text_color: e.target.value || null })}
                                                placeholder={sharedControlValue(multiSelectedControls, 'control_text_color') === undefined ? (t.windowdesignerpanel_multi_mixed || '— Mixed —') : '#e5e7eb'} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_font || 'Font'}</label>
                                    <div className="flex gap-2 mb-2">
                                        <InputText
                                            className="flex-1 p-inputtext-sm"
                                            placeholder={sharedControlValue(multiSelectedControls, 'font_family') === undefined ? (t.windowdesignerpanel_multi_mixed || '— Mixed —') : (t.windowdesignerpanel_font_family || 'Font Family')}
                                            value={sharedControlValue(multiSelectedControls, 'font_family') || ''}
                                            onChange={(e) => updateMultipleControls(selectedKeys, { font_family: e.target.value || null })}
                                        />
                                        <InputNumber
                                            className="w-24"
                                            inputClassName="p-inputtext-sm"
                                            value={sharedControlValue(multiSelectedControls, 'font_size') ?? null}
                                            min={1}
                                            max={200}
                                            step={0.25}
                                            minFractionDigits={0}
                                            maxFractionDigits={2}
                                            placeholder={t.windowdesignerpanel_font_size || 'Size'}
                                            onValueChange={(e) => updateMultipleControls(selectedKeys, { font_size: e.value ?? null })}
                                        />
                                    </div>
                                    <div className="flex gap-1">
                                        {([
                                            { key: 'font_bold' as const, label: 'B', extraStyle: { fontWeight: 'bold' as const }, tooltipKey: 'windowdesignerpanel_font_bold', fallback: 'Bold' },
                                            { key: 'font_italic' as const, label: 'I', extraStyle: { fontStyle: 'italic' as const }, tooltipKey: 'windowdesignerpanel_font_italic', fallback: 'Italic' },
                                            { key: 'font_underline' as const, label: 'U', extraStyle: { textDecoration: 'underline' as const }, tooltipKey: 'windowdesignerpanel_font_underline', fallback: 'Underline' },
                                            { key: 'font_strikeout' as const, label: 'S', extraStyle: { textDecoration: 'line-through' as const }, tooltipKey: 'windowdesignerpanel_font_strikeout', fallback: 'Strikeout' },
                                        ]).map(({ key, label, extraStyle, tooltipKey, fallback }) => {
                                            // "On" reflects the shared/majority state across the whole
                                            // selection (same rule as the Visible/Required InputSwitches
                                            // above) - clicking flips ALL selected controls to the
                                            // opposite of that, rather than needing every one already
                                            // agreeing before the button does anything.
                                            const isOn = multiSelectedControls.every((c) => !!c[key]);
                                            return (
                                                // Plain native <button>, not PrimeReact's Button - same fix
                                                // as FormLayoutDesignerPanel's own B/I/U/S toggles use for
                                                // this exact problem: PrimeReact's Button renders its
                                                // colored surface on an element the `style` prop doesn't
                                                // reach, so on/off never visibly changed no matter what
                                                // was passed in (confirmed - this is the second attempt at
                                                // this exact toggle after the first, ToggleButton-avoiding
                                                // ELEVATED-highlight approach also failed the same way).
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => updateMultipleControls(selectedKeys, { [key]: !isOn } as Partial<WindowControlRow>)}
                                                    title={t[tooltipKey as keyof Translations] || fallback}
                                                    style={{
                                                        width: 32,
                                                        height: 28,
                                                        borderRadius: 4,
                                                        cursor: 'pointer',
                                                        ...extraStyle,
                                                        backgroundColor: isOn ? '#3b82f6' : 'rgba(107,114,128,0.2)',
                                                        border: isOn ? '1px solid #3b82f6' : '1px solid rgba(107,114,128,0.5)',
                                                        color: isOn ? '#ffffff' : '#9ca3af',
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {multiSelectedControls.some((c) => !!c.icon_data) && (
                                    <div>
                                        <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_icon_states || 'Icon States'}</label>
                                        <InputNumber
                                            className="w-full"
                                            inputClassName="p-inputtext-sm w-full"
                                            value={sharedControlValue(multiSelectedControls.filter((c) => c.icon_data), 'icon_state_count') ?? 1}
                                            min={1}
                                            max={10}
                                            showButtons
                                            onValueChange={(e) => updateMultipleControls(
                                                multiSelectedControls.filter((c) => c.icon_data).map((c) => controlKey(c)),
                                                { icon_state_count: e.value ?? 1 }
                                            )}
                                        />
                                        <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                            {t.windowdesignerpanel_multi_icon_states_hint || 'Only applied to the selected controls that have a custom image.'}
                                        </div>
                                    </div>
                                )}

                                <AnchorSection
                                    colors={colors}
                                    values={{
                                        anchor_right: sharedControlValue(multiSelectedControls, 'anchor_right') ?? null,
                                        anchor_bottom: sharedControlValue(multiSelectedControls, 'anchor_bottom') ?? null,
                                        anchor_width: sharedControlValue(multiSelectedControls, 'anchor_width') ?? null,
                                        anchor_height: sharedControlValue(multiSelectedControls, 'anchor_height') ?? null,
                                    }}
                                    onChange={(updates) => updateMultipleControls(selectedKeys, updates as Partial<WindowControlRow>)}
                                />
                            </div>
                        ) : (
                            <div style={{ color: colors.textMuted, fontSize: 12 }}>{t.windowdesignerpanel_multi_selection || 'Multiple controls selected'}</div>
                        )
                    )}

                    {selectedKeys.length === 0 && (
                        <div className="space-y-3">
                            <div className="flex justify-end gap-1">
                                <Button icon="pi pi-list" label={t.windowdesignerpanel_local_procedures || 'Local Procedures'} className="p-button-text p-button-sm" onClick={() => setLocalProceduresVisible(true)} tooltip={t.windowdesignerpanel_local_procedures || 'Local Procedures'} tooltipOptions={{ position: 'bottom' }} />
                                <Button icon="pi pi-code" label={t.windowdesignerpanel_code || 'Code'} className="p-button-text p-button-sm" onClick={openCodeEditorForWindow} tooltip={t.windowdesignerpanel_code || 'Code'} tooltipOptions={{ position: 'bottom' }} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_name || 'Name'}</label>
                                <InputText className="w-full p-inputtext-sm" value={windowRow.name}
                                    onChange={(e) => { setWindowRow({ ...windowRow, name: e.target.value }); setHasUnsavedChanges(true); }} />
                            </div>
                            <LanguageField
                                label={t.windowdesignerpanel_display_name || 'Display Name'}
                                value={(selectedLanguage && windowRow.display_name_labels?.[selectedLanguage]) || windowRow.display_name || ''}
                                onChange={(v) => { setWindowRow({ ...windowRow, display_name: v, display_name_labels: seedLanguageLabels(windowRow.display_name_labels, v) }); setHasUnsavedChanges(true); }}
                                onCopyToAll={() => {
                                    const current = (selectedLanguage && windowRow.display_name_labels?.[selectedLanguage]) || windowRow.display_name || '';
                                    setWindowRow({ ...windowRow, display_name_labels: copyToAllLanguages(current) });
                                    setHasUnsavedChanges(true);
                                }}
                                copyTooltip={t.windowdesignerpanel_copy_to_all_languages || 'Copy to all languages'}
                                onOpenTranslate={() => setTranslateModalOpen(true)}
                                translateTooltip={t.windowdesignerpanel_translate || 'Translate...'}
                            />
                            <div>
                                <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_description || 'Description'}</label>
                                <InputTextarea className="w-full p-inputtext-sm" rows={2} value={windowRow.description || ''}
                                    onChange={(e) => { setWindowRow({ ...windowRow, description: e.target.value }); setHasUnsavedChanges(true); }} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_linked_table || 'Linked Table'}</label>
                                <Dropdown
                                    className="w-full p-inputtext-sm"
                                    value={windowRow.schema_table_id ?? null}
                                    options={[{ label: t.windowdesignerpanel_linked_table_none || 'None (project-level window)', value: null }, ...schemaTables.map((tb) => ({ label: tb.table_name, value: tb.id }))]}
                                    onChange={(e) => { setWindowRow({ ...windowRow, schema_table_id: e.value }); setHasUnsavedChanges(true); }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_canvas_width || 'Canvas Width'}</label>
                                    <InputNumber className="w-full" inputClassName="p-inputtext-sm" value={windowRow.canvas_width}
                                        onValueChange={(e) => { setWindowRow({ ...windowRow, canvas_width: e.value || 1024 }); setHasUnsavedChanges(true); }} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_canvas_height || 'Canvas Height'}</label>
                                    <InputNumber className="w-full" inputClassName="p-inputtext-sm" value={windowRow.canvas_height}
                                        onValueChange={(e) => { setWindowRow({ ...windowRow, canvas_height: e.value || 768 }); setHasUnsavedChanges(true); }} />
                                </div>
                            </div>

                            <div className="pt-2" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                                <div className="text-xs font-semibold mb-2">{t.windowdesignerpanel_appearance || 'Appearance'}</div>

                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-medium">{t.windowdesignerpanel_background_color || 'Background Color'}</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={windowRow.background_color || '#1e1e2e'}
                                            onChange={(e) => { setWindowRow({ ...windowRow, background_color: e.target.value }); setHasUnsavedChanges(true); }}
                                            className="w-6 h-6 rounded border border-gray-600 cursor-pointer bg-transparent" style={{ padding: 0 }} />
                                        <InputText className="w-20 p-inputtext-sm" value={windowRow.background_color || ''}
                                            onChange={(e) => { setWindowRow({ ...windowRow, background_color: e.target.value || null }); setHasUnsavedChanges(true); }} placeholder="#1e1e2e" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_background_image || 'Background Image'}</label>
                                    <div className="flex items-center gap-2 mb-2">
                                        {windowRow.background_image ? (
                                            <img src={windowRow.background_image} alt="" style={{ width: 32, height: 24, objectFit: 'cover', borderRadius: 3 }} />
                                        ) : (
                                            <span className="text-xs" style={{ color: colors.textMuted }}>{t.windowdesignerpanel_icon_none || 'None'}</span>
                                        )}
                                        {windowRow.background_image && (
                                            <Button icon="pi pi-times" className="p-button-text p-button-danger p-button-sm" style={{ width: 22, height: 22 }}
                                                onClick={() => { setWindowRow({ ...windowRow, background_image: null }); setHasUnsavedChanges(true); }} />
                                        )}
                                    </div>
                                    <input
                                        ref={windowBackgroundImageInputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            e.target.value = '';
                                            if (!file) return;
                                            const dataUri = await readFileAsDataUri(file);
                                            setWindowRow({ ...windowRow, background_image: dataUri });
                                            setHasUnsavedChanges(true);
                                        }}
                                    />
                                    <Button
                                        label={t.windowdesignerpanel_icon_upload || 'Upload Custom Image'}
                                        icon="pi pi-upload"
                                        className="p-button-secondary p-button-sm w-full"
                                        onClick={() => windowBackgroundImageInputRef.current?.click()}
                                    />
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                    <label className="text-xs font-medium">{t.windowdesignerpanel_status_bar || 'Status Bar'}</label>
                                    <InputSwitch checked={!!windowRow.has_status_bar}
                                        onChange={(e) => { setWindowRow({ ...windowRow, has_status_bar: e.value }); setHasUnsavedChanges(true); }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedElement && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold">{elementLabel(selectedElement)}</span>
                                <div className="flex items-center gap-1">
                                    <Button icon="pi pi-code" className="p-button-text p-button-sm" onClick={() => openCodeEditorForElement(selectedElement)} tooltip={t.windowdesignerpanel_code || 'Code'} tooltipOptions={{ position: 'bottom' }} />
                                    <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={deleteSelectedElement} tooltip={t.windowdesignerpanel_delete_element || 'Delete Container'} tooltipOptions={{ position: 'bottom' }} />
                                </div>
                            </div>
                            {/* A tab_panel's own Field Name (2026-09-15 follow-up) - this
                                was previously hidden for tab_panel entirely (unlike every
                                other element type), which made an imported page with no
                                name (a real, since-fixed import bug - see
                                createImportedTabPanel's own doc comment) invisible/
                                unfixable from the Properties panel: the ONLY way to see or
                                repair it used to be going into the database directly. */}
                            <div>
                                <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_field_name || 'Field Name'}</label>
                                <InputText className="w-full p-inputtext-sm" value={selectedElement.source_name || ''} onChange={(e) => updateSelectedElement({ source_name: e.target.value })} />
                            </div>
                            {/* A tab page always fills its tab_container exactly (see
                                buildNodes'/findContainerAt's own doc comments on why its
                                own x/y/width/height columns are never the source of
                                truth for rendering anymore) - showing editable
                                position/size fields for it would just be misleading, so
                                only the Tab Container itself gets them. */}
                            {selectedElement.element_type !== 'tab_panel' && (
                                <PositionSizeFields
                                    t={t}
                                    x={selectedElement.x_position}
                                    y={selectedElement.y_position}
                                    width={selectedElement.width}
                                    height={selectedElement.height}
                                    onChange={(patch) => updateSelectedElement(patch)}
                                />
                            )}
                            {selectedElement.element_type === 'tab_panel' && (
                                <LanguageField
                                    label={t.windowdesignerpanel_caption || 'Caption'}
                                    value={(selectedLanguage && selectedElement.tab_labels?.[selectedLanguage]) || selectedElement.tab_label || ''}
                                    onChange={(v) => updateSelectedElement({ tab_label: v, tab_labels: seedLanguageLabels(selectedElement.tab_labels, v) })}
                                    onCopyToAll={() => {
                                        const current = (selectedLanguage && selectedElement.tab_labels?.[selectedLanguage]) || selectedElement.tab_label || '';
                                        updateSelectedElement({ tab_labels: copyToAllLanguages(current) });
                                    }}
                                    copyTooltip={t.windowdesignerpanel_copy_to_all_languages || 'Copy to all languages'}
                                    onOpenTranslate={() => setTranslateModalOpen(true)}
                                    translateTooltip={t.windowdesignerpanel_translate || 'Translate...'}
                                />
                            )}
                            {selectedElement.element_type === 'tab_container' && (
                                <div>
                                    <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_tabs || 'Tabs'}</label>
                                    <div className="space-y-1">
                                        {tabsForSelectedContainer.map((tab, idx) => (
                                            <div key={tab.id} className="flex items-center gap-1">
                                                <span className="text-xs w-4 text-right" style={{ color: colors.textMuted }}>{idx + 1}</span>
                                                <InputText
                                                    className="flex-1 p-inputtext-sm"
                                                    value={(selectedLanguage && tab.tab_labels?.[selectedLanguage]) || tab.tab_label || ''}
                                                    onChange={(e) => {
                                                        const v = e.target.value;
                                                        updateElementById(tab.id, { tab_label: v, tab_labels: seedLanguageLabels(tab.tab_labels, v) });
                                                    }}
                                                />
                                                <Button
                                                    icon="pi pi-trash"
                                                    className="p-button-text p-button-danger p-button-sm"
                                                    style={{ width: 24, height: 24 }}
                                                    onClick={() => deleteTab(tab.id)}
                                                    tooltip={t.windowdesignerpanel_delete_tab || 'Delete Tab'}
                                                    tooltipOptions={{ position: 'bottom' }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        label={t.windowdesignerpanel_add_tab || 'Add Tab'}
                                        icon="pi pi-plus"
                                        className="p-button-text p-button-sm mt-2"
                                        onClick={addTab}
                                        disabled={addingTab}
                                    />

                                    {/* Deliberately scoped to the tab_container itself, not each
                                        tab_panel page - see the migration's comment for why. */}
                                    <div className="pt-2 mt-2" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                                        <div className="text-xs font-semibold mb-2">{t.windowdesignerpanel_appearance || 'Appearance'}</div>

                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-medium">{t.windowdesignerpanel_tab_content_background || 'Content Background'}</label>
                                            <div className="flex items-center gap-2">
                                                <input type="color" value={selectedElement.background_color || '#1e1e2e'}
                                                    onChange={(e) => updateSelectedElement({ background_color: e.target.value })}
                                                    className="w-6 h-6 rounded border border-gray-600 cursor-pointer bg-transparent" style={{ padding: 0 }} />
                                                <InputText className="w-20 p-inputtext-sm" value={selectedElement.background_color || ''}
                                                    onChange={(e) => updateSelectedElement({ background_color: e.target.value || null })} placeholder="#1e1e2e" />
                                            </div>
                                        </div>

                                        <div className="text-xs font-semibold mt-3 mb-2">{t.windowdesignerpanel_tab_strip || 'Tab Strip'}</div>

                                        <div className="mb-2">
                                            <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_tab_strip_height || 'Tab Height'}</label>
                                            <InputNumber
                                                className="w-full"
                                                inputClassName="p-inputtext-sm w-full"
                                                value={selectedElement.tab_strip_height ?? 28}
                                                min={1}
                                                onValueChange={(e) => updateSelectedElement({ tab_strip_height: e.value ?? 28 })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-medium">{t.windowdesignerpanel_tab_active_background || 'Active Background'}</label>
                                            <div className="flex items-center gap-2">
                                                <input type="color" value={selectedElement.tab_active_background_color || '#1e1e2e'}
                                                    onChange={(e) => updateSelectedElement({ tab_active_background_color: e.target.value })}
                                                    className="w-6 h-6 rounded border border-gray-600 cursor-pointer bg-transparent" style={{ padding: 0 }} />
                                                <InputText className="w-20 p-inputtext-sm" value={selectedElement.tab_active_background_color || ''}
                                                    onChange={(e) => updateSelectedElement({ tab_active_background_color: e.target.value || null })} placeholder="#1e1e2e" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-medium">{t.windowdesignerpanel_tab_active_text || 'Active Font Color'}</label>
                                            <div className="flex items-center gap-2">
                                                <input type="color" value={selectedElement.tab_active_text_color || '#e5e7eb'}
                                                    onChange={(e) => updateSelectedElement({ tab_active_text_color: e.target.value })}
                                                    className="w-6 h-6 rounded border border-gray-600 cursor-pointer bg-transparent" style={{ padding: 0 }} />
                                                <InputText className="w-20 p-inputtext-sm" value={selectedElement.tab_active_text_color || ''}
                                                    onChange={(e) => updateSelectedElement({ tab_active_text_color: e.target.value || null })} placeholder="#e5e7eb" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-medium">{t.windowdesignerpanel_tab_inactive_background || 'Inactive Background'}</label>
                                            <div className="flex items-center gap-2">
                                                <input type="color" value={selectedElement.tab_inactive_background_color || '#1e1e2e'}
                                                    onChange={(e) => updateSelectedElement({ tab_inactive_background_color: e.target.value })}
                                                    className="w-6 h-6 rounded border border-gray-600 cursor-pointer bg-transparent" style={{ padding: 0 }} />
                                                <InputText className="w-20 p-inputtext-sm" value={selectedElement.tab_inactive_background_color || ''}
                                                    onChange={(e) => updateSelectedElement({ tab_inactive_background_color: e.target.value || null })} placeholder="#1e1e2e" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-medium">{t.windowdesignerpanel_tab_inactive_text || 'Inactive Font Color'}</label>
                                            <div className="flex items-center gap-2">
                                                <input type="color" value={selectedElement.tab_inactive_text_color || '#e5e7eb'}
                                                    onChange={(e) => updateSelectedElement({ tab_inactive_text_color: e.target.value })}
                                                    className="w-6 h-6 rounded border border-gray-600 cursor-pointer bg-transparent" style={{ padding: 0 }} />
                                                <InputText className="w-20 p-inputtext-sm" value={selectedElement.tab_inactive_text_color || ''}
                                                    onChange={(e) => updateSelectedElement({ tab_inactive_text_color: e.target.value || null })} placeholder="#e5e7eb" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_font || 'Font'}</label>
                                            <div className="flex gap-2 mb-2">
                                                <InputText
                                                    className="flex-1 p-inputtext-sm"
                                                    placeholder={t.windowdesignerpanel_font_family || 'Font Family'}
                                                    value={selectedElement.tab_font_family || ''}
                                                    onChange={(e) => updateSelectedElement({ tab_font_family: e.target.value || null })}
                                                />
                                                <InputNumber
                                                    className="w-24"
                                                    inputClassName="p-inputtext-sm"
                                                    value={selectedElement.tab_font_size ?? null}
                                                    min={1}
                                                    max={200}
                                                    step={0.25}
                                                    minFractionDigits={0}
                                                    maxFractionDigits={2}
                                                    placeholder={t.windowdesignerpanel_font_size || 'Size'}
                                                    onValueChange={(e) => updateSelectedElement({ tab_font_size: e.value ?? null })}
                                                />
                                            </div>
                                            <div className="flex gap-1">
                                                {([
                                                    { key: 'tab_font_bold' as const, label: 'B', extraStyle: { fontWeight: 'bold' as const }, tooltipKey: 'windowdesignerpanel_font_bold', fallback: 'Bold' },
                                                    { key: 'tab_font_italic' as const, label: 'I', extraStyle: { fontStyle: 'italic' as const }, tooltipKey: 'windowdesignerpanel_font_italic', fallback: 'Italic' },
                                                    { key: 'tab_font_underline' as const, label: 'U', extraStyle: { textDecoration: 'underline' as const }, tooltipKey: 'windowdesignerpanel_font_underline', fallback: 'Underline' },
                                                    { key: 'tab_font_strikeout' as const, label: 'S', extraStyle: { textDecoration: 'line-through' as const }, tooltipKey: 'windowdesignerpanel_font_strikeout', fallback: 'Strikeout' },
                                                ]).map(({ key, label, extraStyle, tooltipKey, fallback }) => {
                                                    const isOn = !!selectedElement[key];
                                                    return (
                                                        // Plain native <button> - see the multi-select block's
                                                        // identical comment for why (PrimeReact's Button never
                                                        // shows the on/off style, plain <button> does).
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            onClick={() => updateSelectedElement({ [key]: !isOn } as Partial<WindowElementRow>)}
                                                            title={t[tooltipKey as keyof Translations] || fallback}
                                                            style={{
                                                                width: 32,
                                                                height: 28,
                                                                borderRadius: 4,
                                                                cursor: 'pointer',
                                                                ...extraStyle,
                                                                backgroundColor: isOn ? '#3b82f6' : 'rgba(107,114,128,0.2)',
                                                                border: isOn ? '1px solid #3b82f6' : '1px solid rgba(107,114,128,0.5)',
                                                                color: isOn ? '#ffffff' : '#9ca3af',
                                                                fontSize: 13,
                                                            }}
                                                        >
                                                            {label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {selectedElement.element_type === 'looper' && (
                                <div>
                                    <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_looper_row_height || 'Row Height'}</label>
                                    <InputNumber
                                        className="w-full"
                                        inputClassName="p-inputtext-sm w-full"
                                        value={selectedElement.looper_row_height ?? 80}
                                        min={1}
                                        onValueChange={(e) => {
                                            const newHeight = e.value ?? 80;
                                            updateSelectedElement({ looper_row_height: newHeight });
                                            // looper_row_height lives on the looper (the single
                                            // source of truth), but the canvas positions/sizes
                                            // every element - including the row template - from
                                            // its OWN width/height, so the row's actual box has
                                            // to be kept in sync or the white/gray split on
                                            // canvas would silently disagree with this field.
                                            const row = elements.find((e2) => e2.parent_element_id === selectedElement.id && e2.element_type === 'looper_row');
                                            if (row) {
                                                updateElementById(row.id, { height: newHeight });
                                            }
                                        }}
                                    />
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium">{t.windowdesignerpanel_visible || 'Visible'}</label>
                                <InputSwitch checked={selectedElement.is_visible} onChange={(e) => updateSelectedElement({ is_visible: e.value })} />
                            </div>
                            {selectedElement.element_type !== 'tab_panel' && selectedElement.element_type !== 'looper_row' && (
                                <AnchorSection
                                    colors={colors}
                                    values={{
                                        anchor_right: selectedElement.anchor_right ?? null,
                                        anchor_bottom: selectedElement.anchor_bottom ?? null,
                                        anchor_width: selectedElement.anchor_width ?? null,
                                        anchor_height: selectedElement.anchor_height ?? null,
                                    }}
                                    onChange={(updates) => updateSelectedElement(updates as Partial<WindowElementRow>)}
                                />
                            )}
                            {selectedElement.element_type === 'tab_panel' && (
                                <div style={{ fontSize: 10, color: colors.textMuted, borderTop: `1px solid ${colors.borderPrimary}`, marginTop: 6, paddingTop: 6 }}>
                                    {t.windowdesignerpanel_tab_page_anchor_hint || 'A tab page always fills its container. To stretch the whole tab area, select the Tab Container itself (gear icon) and set its Anchor.'}
                                </div>
                            )}
                        </div>
                    )}

                    {selectedControl && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold">
                                    {label(t, CONTROL_GROUPS.flatMap((g) => g.items).find((i) => i.type === selectedControl.control_type)?.tKey || 'windowdesignerpanel_control_text', selectedControl.control_type)}
                                </span>
                                <div className="flex items-center gap-1">
                                    <Button icon="pi pi-code" className="p-button-text p-button-sm" onClick={() => openCodeEditorForControl(selectedControl)} tooltip={t.windowdesignerpanel_code || 'Code'} tooltipOptions={{ position: 'bottom' }} />
                                    <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={deleteSelectedControl} tooltip={t.windowdesignerpanel_delete_control || 'Delete Control'} tooltipOptions={{ position: 'bottom' }} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_field_name || 'Field Name'}</label>
                                <InputText className="w-full p-inputtext-sm" value={selectedControl.source_name || ''} onChange={(e) => updateSelectedControl({ source_name: e.target.value })} />
                            </div>
                            <PositionSizeFields
                                t={t}
                                x={selectedControl.x_position}
                                y={selectedControl.y_position}
                                width={selectedControl.width}
                                height={selectedControl.height}
                                onChange={(patch) => updateSelectedControl(patch)}
                            />

                            <div>
                                <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_parent_container || 'Parent Container'}</label>
                                <Dropdown
                                    className="w-full p-inputtext-sm"
                                    value={selectedControl.container_element_id ?? null}
                                    options={parentContainerOptions}
                                    onChange={(e) => updateSelectedControl({ container_element_id: e.value })}
                                />
                            </div>

                            <LanguageField
                                label={t.windowdesignerpanel_caption || 'Caption'}
                                value={(selectedLanguage && selectedControl.caption_labels?.[selectedLanguage]) || selectedControl.caption_override || ''}
                                onChange={applyCaptionChange}
                                onCopyToAll={() => {
                                    const current = (selectedLanguage && selectedControl.caption_labels?.[selectedLanguage]) || selectedControl.caption_override || '';
                                    updateSelectedControl({ caption_labels: copyToAllLanguages(current) });
                                }}
                                copyTooltip={t.windowdesignerpanel_copy_to_all_languages || 'Copy to all languages'}
                                onOpenMultilineEditor={selectedControl.control_type === 'static_text' ? () => {
                                    setMultilineCaptionDraft((selectedLanguage && selectedControl.caption_labels?.[selectedLanguage]) || selectedControl.caption_override || '');
                                    setMultilineCaptionEditorOpen(true);
                                } : undefined}
                                multilineEditorTooltip={t.windowdesignerpanel_edit_multiline_caption || 'Edit caption with line breaks...'}
                                onOpenTranslate={() => setTranslateModalOpen(true)}
                                translateTooltip={t.windowdesignerpanel_translate || 'Translate...'}
                            />

                            {selectedControl.control_type === 'checkbox' && (
                                // A single checkbox's own displayed text lives in
                                // options[0] (WinDev's checkbox_options), not in
                                // Caption above - Caption is instead this
                                // control's optional heading shown above the
                                // whole thing (see Label Position). Without this
                                // field there was no way to edit what's actually
                                // shown next to the checkbox itself.
                                <LanguageField
                                    label={t.windowdesignerpanel_checkbox_label || 'Checkbox Label'}
                                    value={(selectedLanguage && selectedControl.options?.[0]?.labels?.[selectedLanguage]) || selectedControl.options?.[0]?.value || ''}
                                    onChange={(v) => {
                                        const opts = selectedControl.options && selectedControl.options.length > 0 ? [...selectedControl.options] : [{ value: '1', labels: {} }];
                                        opts[0] = { ...opts[0], labels: seedLanguageLabels(opts[0].labels, v) };
                                        updateSelectedControl({ options: opts });
                                    }}
                                    onCopyToAll={() => {
                                        const current = (selectedLanguage && selectedControl.options?.[0]?.labels?.[selectedLanguage]) || '';
                                        const opts = selectedControl.options && selectedControl.options.length > 0 ? [...selectedControl.options] : [{ value: '1', labels: {} }];
                                        opts[0] = { ...opts[0], labels: copyToAllLanguages(current) };
                                        updateSelectedControl({ options: opts });
                                    }}
                                    copyTooltip={t.windowdesignerpanel_copy_to_all_languages || 'Copy to all languages'}
                                />
                            )}

                            {selectedControl.control_type === 'button' && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-medium">{t.windowdesignerpanel_shortcut || 'Keyboard Shortcut'}</label>
                                        <InputSwitch
                                            checked={!!selectedControl.shortcut_enabled}
                                            onChange={(e) => updateSelectedControl({ shortcut_enabled: e.value, shortcut: e.value ? (selectedControl.shortcut || '') : selectedControl.shortcut })}
                                        />
                                    </div>
                                    {selectedControl.shortcut_enabled && (
                                        <InputText
                                            className="w-full p-inputtext-sm"
                                            value={selectedControl.shortcut || ''}
                                            placeholder="ALT+H"
                                            onChange={(e) => updateSelectedControl({ shortcut: e.target.value.toUpperCase() })}
                                        />
                                    )}
                                    <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                        {t.windowdesignerpanel_shortcut_hint || 'Tip: type "&" before a letter in the caption above to set this automatically (e.g. "&Help" becomes caption "Help" + ALT+H). Use "&&" for a literal ampersand.'}
                                    </div>
                                </div>
                            )}

                            <LanguageField
                                label={t.windowdesignerpanel_comment || 'Comment'}
                                value={(selectedLanguage && selectedControl.comment_labels?.[selectedLanguage]) || selectedControl.comment_override || ''}
                                onChange={(v) => updateSelectedControl({ comment_override: v, comment_labels: seedLanguageLabels(selectedControl.comment_labels, v) })}
                                onCopyToAll={() => {
                                    const current = (selectedLanguage && selectedControl.comment_labels?.[selectedLanguage]) || selectedControl.comment_override || '';
                                    updateSelectedControl({ comment_labels: copyToAllLanguages(current) });
                                }}
                                copyTooltip={t.windowdesignerpanel_copy_to_all_languages || 'Copy to all languages'}
                            />
                            <LanguageField
                                label={t.windowdesignerpanel_hint || 'Input Hint'}
                                value={(selectedLanguage && selectedControl.hint_labels?.[selectedLanguage]) || selectedControl.hint_override || ''}
                                onChange={(v) => updateSelectedControl({ hint_override: v, hint_labels: seedLanguageLabels(selectedControl.hint_labels, v) })}
                                onCopyToAll={() => {
                                    const current = (selectedLanguage && selectedControl.hint_labels?.[selectedLanguage]) || selectedControl.hint_override || '';
                                    updateSelectedControl({ hint_labels: copyToAllLanguages(current) });
                                }}
                                copyTooltip={t.windowdesignerpanel_copy_to_all_languages || 'Copy to all languages'}
                            />

                            {CONTROL_TYPES_WITH_LABEL_POSITION.has(selectedControl.control_type) && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_label_position || 'Label Position'}</label>
                                        <Dropdown
                                            className="w-full p-inputtext-sm"
                                            value={selectedControl.label_position || 'top'}
                                            options={[
                                                { label: t.windowdesignerpanel_label_position_top || 'Top', value: 'top' },
                                                { label: t.windowdesignerpanel_label_position_left || 'Left', value: 'left' },
                                                { label: t.windowdesignerpanel_label_position_right || 'Right', value: 'right' },
                                                { label: t.windowdesignerpanel_label_position_none || 'None', value: 'none' },
                                            ]}
                                            onChange={(e) => updateSelectedControl({ label_position: e.value })}
                                        />
                                    </div>
                                    {selectedControl.label_position === 'left' && (
                                        <div>
                                            <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_label_width || 'Label Width'}</label>
                                            <InputNumber
                                                className="w-full"
                                                inputClassName="p-inputtext-sm"
                                                value={selectedControl.label_width ?? 100}
                                                min={20}
                                                max={selectedControl.width}
                                                onValueChange={(e) => updateSelectedControl({ label_width: e.value ?? 100 })}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {CONTROL_TYPES_WITH_CAPTION_ALIGNMENT.has(selectedControl.control_type) && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_caption_align_h || 'Caption Horizontal'}</label>
                                        <Dropdown
                                            className="w-full p-inputtext-sm"
                                            value={selectedControl.caption_position_horizontal || (selectedControl.control_type === 'button' ? 'center' : 'left')}
                                            options={CAPTION_ALIGN_H_OPTIONS.map((o) => ({ label: t[o.labelKey as keyof Translations] || o.fallback, value: o.value }))}
                                            onChange={(e) => updateSelectedControl({ caption_position_horizontal: e.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_caption_align_v || 'Caption Vertical'}</label>
                                        <Dropdown
                                            className="w-full p-inputtext-sm"
                                            value={selectedControl.caption_position_vertical || (selectedControl.control_type === 'button' ? 'middle' : 'top')}
                                            options={[
                                                ...CAPTION_ALIGN_V_OPTIONS,
                                                ...(selectedControl.control_type === 'static_text' ? STATIC_TEXT_INLINE_V_OPTIONS : []),
                                            ].map((o) => ({ label: t[o.labelKey as keyof Translations] || o.fallback, value: o.value }))}
                                            onChange={(e) => updateSelectedControl({ caption_position_vertical: e.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedControl.control_type === 'static_text' && (
                                <div>
                                    <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_border || 'Border'}</label>
                                    <Dropdown
                                        className="w-full p-inputtext-sm"
                                        value={selectedControl.static_text_border_style || 'none'}
                                        options={STATIC_TEXT_BORDER_OPTIONS.map((o) => ({ label: t[o.labelKey as keyof Translations] || o.fallback, value: o.value }))}
                                        onChange={(e) => updateSelectedControl({ static_text_border_style: e.value })}
                                    />
                                    {(selectedControl.caption_position_vertical === 'inline_top' || selectedControl.caption_position_vertical === 'inline_bottom') && (
                                        <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                            {t.windowdesignerpanel_border_inline_hint || 'Inline only visibly breaks a border on the matching edge (Single, Double, Top Only, or Bottom Only).'}
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedControl.control_type === 'button' && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium">{t.windowdesignerpanel_caption_visible || 'Show Caption'}</label>
                                        <InputSwitch checked={selectedControl.caption_visible !== false} onChange={(e) => updateSelectedControl({ caption_visible: e.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_icon_position_h || 'Icon Horizontal'}</label>
                                            <Dropdown
                                                className="w-full p-inputtext-sm"
                                                value={selectedControl.icon_position_horizontal || 'left'}
                                                options={CAPTION_ALIGN_H_OPTIONS.map((o) => ({ label: t[o.labelKey as keyof Translations] || o.fallback, value: o.value }))}
                                                onChange={(e) => updateSelectedControl({ icon_position_horizontal: e.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_icon_position_v || 'Icon Vertical'}</label>
                                            <Dropdown
                                                className="w-full p-inputtext-sm"
                                                value={selectedControl.icon_position_vertical || 'middle'}
                                                options={CAPTION_ALIGN_V_OPTIONS.map((o) => ({ label: t[o.labelKey as keyof Translations] || o.fallback, value: o.value }))}
                                                onChange={(e) => updateSelectedControl({ icon_position_vertical: e.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_linked_field || 'Linked Field'}</label>
                                <Dropdown
                                    className="w-full p-inputtext-sm"
                                    value={selectedControl.schema_field_id ?? null}
                                    options={[{ label: t.windowdesignerpanel_linked_field_none || 'None (static)', value: null }, ...linkedTableFields.map((f) => ({ label: f.field_name, value: f.id }))]}
                                    onChange={(e) => updateSelectedControl({ schema_field_id: e.value })}
                                    disabled={!windowRow.schema_table_id}
                                />
                            </div>

                            {CONTROL_TYPES_WITH_ICON.has(selectedControl.control_type) && (
                                <div>
                                    <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_icon || 'Icon'}</label>
                                    <div className="flex items-center gap-2 mb-2">
                                        {selectedControl.icon_data || selectedControl.icon_class ? (
                                            <IconPreview iconData={selectedControl.icon_data} iconClass={selectedControl.icon_class} stateCount={selectedControl.icon_state_count} size={24} />
                                        ) : (
                                            <span className="text-xs" style={{ color: colors.textMuted }}>{t.windowdesignerpanel_icon_none || 'None'}</span>
                                        )}
                                        {selectedControl.icon_state_count && selectedControl.icon_state_count > 1 && (
                                            <span className="text-xs" style={{ color: colors.textMuted }}>
                                                {tpl(t.windowdesignerpanel_icon_states_detected || '{count}-state icon (showing Idle)', { count: String(selectedControl.icon_state_count) })}
                                            </span>
                                        )}
                                        {(selectedControl.icon_data || selectedControl.icon_class) && (
                                            <Button
                                                icon="pi pi-times"
                                                className="p-button-text p-button-danger p-button-sm"
                                                style={{ width: 22, height: 22 }}
                                                onClick={() => updateSelectedControl({ icon_class: null, icon_data: null })}
                                            />
                                        )}
                                    </div>
                                    <Dropdown
                                        className="w-full p-inputtext-sm mb-2"
                                        value={selectedControl.icon_class || null}
                                        options={ICON_CLASS_OPTIONS}
                                        placeholder={t.windowdesignerpanel_icon_prime_placeholder || 'Choose PrimeIcon...'}
                                        filter
                                        showClear
                                        itemTemplate={(opt: { label: string; value: string }) => (
                                            <div className="flex items-center gap-2">
                                                <i className={`pi ${opt.value}`} />
                                                <span>{opt.label}</span>
                                            </div>
                                        )}
                                        onChange={(e) => updateSelectedControl({ icon_class: e.value, icon_data: e.value ? null : selectedControl.icon_data })}
                                    />
                                    <input
                                        ref={iconUploadInputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            e.target.value = '';
                                            if (!file) return;
                                            const dataUri = await readFileAsDataUri(file);
                                            // A freshly uploaded image is a single icon until the
                                            // user says otherwise — don't inherit a stale state
                                            // count left over from whatever icon was there before.
                                            updateSelectedControl({ icon_data: dataUri, icon_class: null, icon_state_count: 1 });
                                        }}
                                    />
                                    <Button
                                        label={t.windowdesignerpanel_icon_upload || 'Upload Custom Image'}
                                        icon="pi pi-upload"
                                        className="p-button-secondary p-button-sm w-full"
                                        onClick={() => iconUploadInputRef.current?.click()}
                                    />
                                    {selectedControl.icon_data && (
                                        <div className="mt-2">
                                            <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_icon_states || 'Icon States'}</label>
                                            <InputNumber
                                                className="w-full"
                                                inputClassName="p-inputtext-sm w-full"
                                                value={selectedControl.icon_state_count ?? 1}
                                                min={1}
                                                max={10}
                                                showButtons
                                                onValueChange={(e) => updateSelectedControl({ icon_state_count: e.value ?? 1 })}
                                            />
                                            <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                                {t.windowdesignerpanel_icon_states_hint || 'Number of state frames (Idle, Pressed, Grayed out, Selected, Hovered, ...) concatenated side by side in this image. Use 1 for a plain single icon.'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedControl.control_type === 'button' && (
                                <div>
                                    <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_background_image || 'Background Image'}</label>
                                    <div className="flex items-center gap-2 mb-2">
                                        {selectedControl.background_image ? (
                                            <img src={selectedControl.background_image} alt="" style={{ width: 32, height: 24, objectFit: 'cover', borderRadius: 3 }} />
                                        ) : (
                                            <span className="text-xs" style={{ color: colors.textMuted }}>{t.windowdesignerpanel_icon_none || 'None'}</span>
                                        )}
                                        {selectedControl.background_image && (
                                            <Button icon="pi pi-times" className="p-button-text p-button-danger p-button-sm" style={{ width: 22, height: 22 }}
                                                onClick={() => updateSelectedControl({ background_image: null })} />
                                        )}
                                    </div>
                                    <input
                                        ref={controlBackgroundImageInputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            e.target.value = '';
                                            if (!file) return;
                                            const dataUri = await readFileAsDataUri(file);
                                            updateSelectedControl({ background_image: dataUri });
                                        }}
                                    />
                                    <Button
                                        label={t.windowdesignerpanel_icon_upload || 'Upload Custom Image'}
                                        icon="pi pi-upload"
                                        className="p-button-secondary p-button-sm w-full"
                                        onClick={() => controlBackgroundImageInputRef.current?.click()}
                                    />
                                    <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                        {t.windowdesignerpanel_control_background_image_hint || 'Takes priority over Background Color below when set.'}
                                    </div>
                                    {selectedControl.background_image && (
                                        <div className="mt-2">
                                            <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_icon_states || 'Icon States'}</label>
                                            <InputNumber
                                                className="w-full"
                                                inputClassName="p-inputtext-sm w-full"
                                                value={selectedControl.background_image_states ?? 1}
                                                min={1}
                                                max={5}
                                                showButtons
                                                onValueChange={(e) => updateSelectedControl({ background_image_states: e.value ?? 1 })}
                                            />
                                            <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                                {t.windowdesignerpanel_icon_states_hint || 'Number of state frames (Idle, Pressed, Grayed out, Selected, Hovered, ...) concatenated side by side in this image. Use 1 for a plain single icon.'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {CONTROL_TYPES_WITH_OPTIONS.has(selectedControl.control_type) && (
                                <div>
                                    <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_options || 'Options'}</label>
                                    {(selectedControl.options || []).map((opt, idx) => (
                                        <div key={idx} className="flex gap-1 mb-1">
                                            <InputText
                                                className="p-inputtext-sm flex-1"
                                                placeholder={t.windowdesignerpanel_options_value || 'Value'}
                                                value={opt.value}
                                                onChange={(e) => {
                                                    const next = [...(selectedControl.options || [])];
                                                    next[idx] = { ...next[idx], value: e.target.value };
                                                    updateSelectedControl({ options: next });
                                                }}
                                            />
                                            <InputText
                                                className="p-inputtext-sm flex-1"
                                                placeholder={t.windowdesignerpanel_options_label || 'Label'}
                                                value={(selectedLanguage && opt.labels?.[selectedLanguage]) || ''}
                                                onChange={(e) => {
                                                    const next = [...(selectedControl.options || [])];
                                                    const labels = { ...(next[idx].labels || {}) };
                                                    if (selectedLanguage) labels[selectedLanguage] = e.target.value;
                                                    next[idx] = { ...next[idx], labels };
                                                    updateSelectedControl({ options: next });
                                                }}
                                            />
                                            <Button
                                                icon="pi pi-times"
                                                className="p-button-text p-button-danger p-button-sm"
                                                onClick={() => updateSelectedControl({ options: (selectedControl.options || []).filter((_, i) => i !== idx) })}
                                            />
                                        </div>
                                    ))}
                                    <Button
                                        label={t.windowdesignerpanel_options_add || 'Add Option'}
                                        icon="pi pi-plus"
                                        className="p-button-text p-button-sm"
                                        onClick={() => updateSelectedControl({ options: [...(selectedControl.options || []), { value: '', labels: {} }] })}
                                    />
                                </div>
                            )}

                            {CONTROL_TYPES_WITH_MINMAX.has(selectedControl.control_type) && (
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_min_value || 'Min Value'}</label>
                                        <InputNumber className="w-full" inputClassName="p-inputtext-sm" value={selectedControl.min_value ?? null} onValueChange={(e) => updateSelectedControl({ min_value: e.value ?? null })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_max_value || 'Max Value'}</label>
                                        <InputNumber className="w-full" inputClassName="p-inputtext-sm" value={selectedControl.max_value ?? null} onValueChange={(e) => updateSelectedControl({ max_value: e.value ?? null })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_step_value || 'Step'}</label>
                                        <InputNumber className="w-full" inputClassName="p-inputtext-sm" value={selectedControl.step_value ?? null} onValueChange={(e) => updateSelectedControl({ step_value: e.value ?? null })} />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_default_value || 'Default Value'}</label>
                                <InputText className="w-full p-inputtext-sm" value={selectedControl.default_value || ''} onChange={(e) => updateSelectedControl({ default_value: e.target.value })} />
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium">{t.windowdesignerpanel_required || 'Required'}</label>
                                <InputSwitch checked={!!selectedControl.is_required} onChange={(e) => updateSelectedControl({ is_required: e.value })} />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium">{t.windowdesignerpanel_visible || 'Visible'}</label>
                                <InputSwitch checked={selectedControl.is_visible} onChange={(e) => updateSelectedControl({ is_visible: e.value })} />
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_state || 'State'}</label>
                                <Dropdown
                                    className="w-full p-inputtext-sm"
                                    value={selectedControl.control_state || 'active'}
                                    options={[
                                        { label: t.windowdesignerpanel_state_active || 'Active', value: 'active' },
                                        { label: t.windowdesignerpanel_state_display_only || 'Display Only', value: 'display_only' },
                                        { label: t.windowdesignerpanel_state_grayed || 'Grayed', value: 'grayed' },
                                    ]}
                                    onChange={(e) => updateSelectedControl({ control_state: e.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_data_binding || 'Data Binding'}</label>
                                <InputText
                                    className="w-full p-inputtext-sm"
                                    value={selectedControl.data_binding || ''}
                                    placeholder="Table.key\tTable.field"
                                    onChange={(e) => updateSelectedControl({ data_binding: e.target.value || null })}
                                />
                                <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                    {t.windowdesignerpanel_data_binding_hint || 'Tab-separated "key field\\tdisplay field" from the linked table — not yet resolved to a live schema link, kept as reference for now.'}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_browsed_file || 'Browsed File'}</label>
                                <InputText
                                    className="w-full p-inputtext-sm"
                                    value={selectedControl.browsed_file || ''}
                                    onChange={(e) => updateSelectedControl({ browsed_file: e.target.value || null })}
                                />
                            </div>

                            {selectedControl.control_type === 'table' && (
                                <div>
                                    <label className="block text-xs font-medium mb-1">
                                        {selectedControl.table_columns && selectedControl.table_columns.length > 0
                                            ? tpl(t.windowdesignerpanel_table_columns || '{count} Columns', { count: String(selectedControl.table_columns.length) })
                                            : (t.windowdesignerpanel_table_columns_none || 'No columns yet')}
                                    </label>
                                    {selectedControl.table_columns && selectedControl.table_columns.length > 0 && (
                                        <div className="space-y-1 mb-2" style={{ maxHeight: 160, overflowY: 'auto' }}>
                                            {selectedControl.table_columns.map((col, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(107,114,128,0.15)' }}>
                                                    <span>{col.caption || col.name}</span>
                                                    <span style={{ color: colors.textMuted }}>{col.control_type} · {col.width}px</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Button
                                        label={t.windowdesignerpanel_column_designer || 'Column Designer...'}
                                        icon="pi pi-table"
                                        className="p-button-secondary p-button-sm w-full"
                                        onClick={() => setColumnDesignerVisible(true)}
                                    />
                                </div>
                            )}

                            <div className="pt-2" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                                <div className="text-xs font-semibold mb-2">{t.windowdesignerpanel_appearance || 'Appearance'}</div>

                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-medium">{t.windowdesignerpanel_background_color || 'Background Color'}</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={selectedControl.control_background_color || '#1e1e2e'}
                                            onChange={(e) => updateSelectedControl({ control_background_color: e.target.value })}
                                            className="w-6 h-6 rounded border border-gray-600 cursor-pointer bg-transparent" style={{ padding: 0 }} />
                                        <InputText className="w-20 p-inputtext-sm" value={selectedControl.control_background_color || ''}
                                            onChange={(e) => updateSelectedControl({ control_background_color: e.target.value || null })} placeholder="#1e1e2e" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-medium">{t.windowdesignerpanel_text_color || 'Font Color'}</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={selectedControl.control_text_color || '#e5e7eb'}
                                            onChange={(e) => updateSelectedControl({ control_text_color: e.target.value })}
                                            className="w-6 h-6 rounded border border-gray-600 cursor-pointer bg-transparent" style={{ padding: 0 }} />
                                        <InputText className="w-20 p-inputtext-sm" value={selectedControl.control_text_color || ''}
                                            onChange={(e) => updateSelectedControl({ control_text_color: e.target.value || null })} placeholder="#e5e7eb" />
                                    </div>
                                </div>

                                {selectedControl.control_type === 'table' && (
                                    <>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-medium">{t.windowdesignerpanel_header_background_color || 'Header Background'}</label>
                                            <div className="flex items-center gap-2">
                                                <input type="color" value={selectedControl.header_background_color || '#6b7280'}
                                                    onChange={(e) => updateSelectedControl({ header_background_color: e.target.value })}
                                                    className="w-6 h-6 rounded border border-gray-600 cursor-pointer bg-transparent" style={{ padding: 0 }} />
                                                <InputText className="w-20 p-inputtext-sm" value={selectedControl.header_background_color || ''}
                                                    onChange={(e) => updateSelectedControl({ header_background_color: e.target.value || null })} placeholder="#6b7280" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-medium">{t.windowdesignerpanel_header_text_color || 'Header Font Color'}</label>
                                            <div className="flex items-center gap-2">
                                                <input type="color" value={selectedControl.header_text_color || '#e5e7eb'}
                                                    onChange={(e) => updateSelectedControl({ header_text_color: e.target.value })}
                                                    className="w-6 h-6 rounded border border-gray-600 cursor-pointer bg-transparent" style={{ padding: 0 }} />
                                                <InputText className="w-20 p-inputtext-sm" value={selectedControl.header_text_color || ''}
                                                    onChange={(e) => updateSelectedControl({ header_text_color: e.target.value || null })} placeholder="#e5e7eb" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-medium">{t.windowdesignerpanel_row_background_color_even || 'Even Row Background'}</label>
                                            <div className="flex items-center gap-2">
                                                <input type="color" value={selectedControl.row_background_color_even || '#1e1e2e'}
                                                    onChange={(e) => updateSelectedControl({ row_background_color_even: e.target.value })}
                                                    className="w-6 h-6 rounded border border-gray-600 cursor-pointer bg-transparent" style={{ padding: 0 }} />
                                                <InputText className="w-20 p-inputtext-sm" value={selectedControl.row_background_color_even || ''}
                                                    onChange={(e) => updateSelectedControl({ row_background_color_even: e.target.value || null })} placeholder="#1e1e2e" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-medium">{t.windowdesignerpanel_row_height || 'Row Height'}</label>
                                            <InputNumber className="w-24" inputClassName="p-inputtext-sm" value={selectedControl.row_height ?? null} min={1}
                                                onValueChange={(e) => updateSelectedControl({ row_height: e.value ?? null })} />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_font || 'Font'}</label>
                                <div className="flex gap-2 mb-2">
                                    <InputText
                                        className="flex-1 p-inputtext-sm"
                                        placeholder={t.windowdesignerpanel_font_family || 'Font Family'}
                                        value={selectedControl.font_family || ''}
                                        onChange={(e) => updateSelectedControl({ font_family: e.target.value || null })}
                                    />
                                    <InputNumber
                                        className="w-24"
                                        inputClassName="p-inputtext-sm"
                                        value={selectedControl.font_size ?? null}
                                        min={1}
                                        max={200}
                                        step={0.25}
                                        minFractionDigits={0}
                                        maxFractionDigits={2}
                                        placeholder={t.windowdesignerpanel_font_size || 'Size'}
                                        onValueChange={(e) => updateSelectedControl({ font_size: e.value ?? null })}
                                    />
                                </div>
                                <div className="flex gap-1">
                                    {([
                                        { key: 'font_bold' as const, label: 'B', extraStyle: { fontWeight: 'bold' as const }, tooltipKey: 'windowdesignerpanel_font_bold', fallback: 'Bold' },
                                        { key: 'font_italic' as const, label: 'I', extraStyle: { fontStyle: 'italic' as const }, tooltipKey: 'windowdesignerpanel_font_italic', fallback: 'Italic' },
                                        { key: 'font_underline' as const, label: 'U', extraStyle: { textDecoration: 'underline' as const }, tooltipKey: 'windowdesignerpanel_font_underline', fallback: 'Underline' },
                                        { key: 'font_strikeout' as const, label: 'S', extraStyle: { textDecoration: 'line-through' as const }, tooltipKey: 'windowdesignerpanel_font_strikeout', fallback: 'Strikeout' },
                                    ]).map(({ key, label, extraStyle, tooltipKey, fallback }) => {
                                        const isOn = !!selectedControl[key];
                                        return (
                                            // Plain native <button>, not PrimeReact's Button - a
                                            // PrimeReact Button was tried here first (with manual
                                            // on/off inline style, reasoning that ToggleButton's
                                            // built-in .p-highlight checked-state CSS would win over
                                            // inline overrides) but the SAME thing happened anyway:
                                            // PrimeReact's Button renders its actual colored surface
                                            // on an element the `style` prop doesn't reach, so on/off
                                            // never visibly changed either way. A plain <button> has
                                            // no PrimeReact CSS competing with it at all - confirmed
                                            // working, this exact pattern is already used for the
                                            // same B/I/U/S toggle in FormLayoutDesignerPanel.
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => updateSelectedControl({ [key]: !isOn } as Partial<WindowControlRow>)}
                                                title={t[tooltipKey as keyof Translations] || fallback}
                                                style={{
                                                    width: 32,
                                                    height: 28,
                                                    borderRadius: 4,
                                                    cursor: 'pointer',
                                                    ...extraStyle,
                                                    backgroundColor: isOn ? '#3b82f6' : 'rgba(107,114,128,0.2)',
                                                    border: isOn ? '1px solid #3b82f6' : '1px solid rgba(107,114,128,0.5)',
                                                    color: isOn ? '#ffffff' : '#9ca3af',
                                                    fontSize: 13,
                                                }}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <AnchorSection
                                colors={colors}
                                values={{
                                    anchor_right: selectedControl.anchor_right ?? null,
                                    anchor_bottom: selectedControl.anchor_bottom ?? null,
                                    anchor_width: selectedControl.anchor_width ?? null,
                                    anchor_height: selectedControl.anchor_height ?? null,
                                }}
                                onChange={(updates) => updateSelectedControl(updates as Partial<WindowControlRow>)}
                            />
                        </div>
                    )}
                </div>
            </div>

            <TabOrderModal
                visible={tabOrderModalVisible}
                elements={tabOrderElements}
                onCancel={() => setTabOrderModalVisible(false)}
                onApply={(activeIds, excludedIds) => { applyTabOrder(activeIds, excludedIds); setTabOrderModalVisible(false); }}
            />

            <TableColumnDesignerModal
                visible={columnDesignerVisible}
                columns={selectedControl?.table_columns || []}
                onCancel={() => setColumnDesignerVisible(false)}
                onApply={(cols: TableColumnDef[]) => { updateSelectedControl({ table_columns: cols }); setColumnDesignerVisible(false); }}
                selectedLanguage={selectedLanguage}
                enabledLanguages={enabledLanguages}
                onSelectLanguage={setSelectedLanguage}
                seedLanguageLabels={seedLanguageLabels}
                copyToAllLanguages={copyToAllLanguages}
            />

            {windowRow?.id && (
                <WindowCodeEditorModal
                    visible={codeEditorVisible}
                    onHide={() => setCodeEditorVisible(false)}
                    windowId={windowRow.id}
                    target={codeEditorTarget}
                />
            )}

            {windowRow?.id && (
                <ProcedureEditorModal
                    visible={localProceduresVisible}
                    onHide={() => setLocalProceduresVisible(false)}
                    scope={{ type: 'window', windowId: windowRow.id }}
                    title={t.windowdesignerpanel_local_procedures || 'Local Procedures'}
                />
            )}

            {selectedProject && (
                <ProcedureEditorModal
                    visible={globalProceduresVisible}
                    onHide={() => setGlobalProceduresVisible(false)}
                    scope={{ type: 'project', projectId: selectedProject.id }}
                    title={t.windowdesignerpanel_global_procedures || 'Global Procedures'}
                />
            )}

            {selectedProject && (
                <GlobalVariablesModal
                    visible={globalVariablesVisible}
                    onHide={() => setGlobalVariablesVisible(false)}
                    projectId={selectedProject.id}
                />
            )}

            {windowRow?.id && (
                <MenuBarDesignerModal
                    visible={menuBarDesignerVisible}
                    windowId={windowRow.id}
                    // Every edit in this modal already persisted itself -
                    // refreshMenus() just re-syncs the canvas's read-only
                    // preview to match once the user closes it, without
                    // touching elements/controls (and any unsaved edits
                    // pending there), same reasoning as
                    // refreshElementsAndControls().
                    onHide={() => { setMenuBarDesignerVisible(false); refreshMenus(); }}
                    selectedLanguage={selectedLanguage}
                    enabledLanguages={enabledLanguages}
                    onSelectLanguage={setSelectedLanguage}
                    seedLanguageLabels={seedLanguageLabels}
                    copyToAllLanguages={copyToAllLanguages}
                />
            )}
                    </>
                )}
            </div>
        </div>
    );
});
WindowDesignerInner.displayName = 'WindowDesignerInner';

// ========== MAIN EXPORT (with ReactFlowProvider) ==========

const WindowDesignerPanel = React.forwardRef<WindowDesignerPanelHandle, WindowDesignerPanelProps>((props, ref) => (
    <ReactFlowProvider>
        <WindowDesignerInner {...props} ref={ref} />
    </ReactFlowProvider>
));
WindowDesignerPanel.displayName = 'WindowDesignerPanel';

export default WindowDesignerPanel;
