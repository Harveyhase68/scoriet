// Event catalog for SML code-behind (see WindowCodeEditorModal.tsx).
//
// Source of truth: "WinDev to Scoriet Meta Language SML/progress/03_CONTROL_AND_EVENT_TYPES.md"
// Only Window (type_code 1) and Button (type_code 4) have a CONFIRMED event
// table there - every other control kind's event set is explicitly marked
// UNKNOWN and "will not be guessed". So only window/button get a curated
// default+full list; every other control type falls back to just the
// shared generic input events (no fabricated defaults).

export interface SmlEventDef {
    name: string;
    label: string;
}

// Shared across windows and controls (0x1.... family) - focus/mouse/keyboard/scroll.
export const GENERIC_INPUT_EVENTS: SmlEventDef[] = [
    { name: 'move', label: 'Move' },
    { name: 'resize', label: 'Resize' },
    { name: 'focus_gain', label: 'Focus Gain' },
    { name: 'focus_loss', label: 'Focus Loss' },
    { name: 'context_menu', label: 'Context Menu' },
    { name: 'key_down', label: 'Key Down' },
    { name: 'key_up', label: 'Key Up' },
    { name: 'key_press', label: 'Key Press' },
    { name: 'system_key_down', label: 'System Key Down' },
    { name: 'system_key_up', label: 'System Key Up' },
    { name: 'system_key_press', label: 'System Key Press' },
    { name: 'hscroll', label: 'Horizontal Scrollbar' },
    { name: 'vscroll', label: 'Vertical Scrollbar' },
    { name: 'mouse_hover', label: 'Mouse Hover' },
    { name: 'left_down', label: 'Left Button Down' },
    { name: 'left_up', label: 'Left Button Up' },
    { name: 'left_double_click', label: 'Left Double Click' },
    { name: 'right_down', label: 'Right Button Down' },
    { name: 'right_up', label: 'Right Button Up' },
    { name: 'right_double_click', label: 'Right Double Click' },
    { name: 'mouse_wheel', label: 'Mouse Wheel' },
    { name: 'file_drop', label: 'File Drop' },
];

const WINDOW_EVENTS: SmlEventDef[] = [
    { name: 'declarations', label: 'Global (Declarations)' },
    { name: 'init', label: 'End of Initialization' },
    { name: 'refresh_display', label: 'Refresh' },
    { name: 'close', label: 'Close' },
    { name: 'closing', label: 'Allow Closing' },
    { name: 'activate', label: 'Activate' },
    { name: 'deactivate', label: 'Deactivate' },
    { name: 'resize', label: 'Resize' },
    { name: 'modified', label: 'Whenever Modifying' },
    { name: 'child_closed', label: 'Close a Child Window' },
    { name: 'scrolling', label: 'While Scrolling' },
    { name: 'layout_changed', label: 'Change Layout' },
    { name: 'theme_changed', label: 'Light/Dark Theme Applied' },
    { name: 'scroll_start', label: 'Start Scrolling' },
    { name: 'scroll_stop', label: 'Stop Scrolling' },
    ...GENERIC_INPUT_EVENTS,
];
const WINDOW_DEFAULTS = ['declarations', 'init', 'refresh_display', 'close'];

const BUTTON_EVENTS: SmlEventDef[] = [
    { name: 'init', label: 'Initialization' },
    { name: 'click', label: 'Click' },
    { name: 'mouse_enter', label: 'Mouse Enter' },
    { name: 'mouse_leave', label: 'Mouse Leave' },
    ...GENERIC_INPUT_EVENTS,
];
const BUTTON_DEFAULTS = ['init', 'click'];

// Confirmed for real from a WinDev SML export (WIN_Menu.sml):
// `on control "Exit" select { ... }` - a menu item's click is exported as
// the SAME "on control NAME event" syntax a real control's event uses,
// just with "select" as the event keyword instead of "click". No other
// menu item event has been seen in a real export - not guessing beyond it.
const MENU_EVENTS: SmlEventDef[] = [
    { name: 'select', label: 'Select' },
];
const MENU_DEFAULTS = ['select'];

export interface SmlEventCatalog {
    all: SmlEventDef[];
    defaults: string[];
}

/**
 * `targetType` is 'window' or the control_type/element_type string.
 * Falls back to generic-input-only (no defaults) for anything without a
 * CONFIRMED event table.
 */
export function getEventCatalog(targetType: string): SmlEventCatalog {
    if (targetType === 'window') {
        return { all: WINDOW_EVENTS, defaults: WINDOW_DEFAULTS };
    }
    if (targetType === 'button') {
        return { all: BUTTON_EVENTS, defaults: BUTTON_DEFAULTS };
    }
    if (targetType === 'menu') {
        return { all: MENU_EVENTS, defaults: MENU_DEFAULTS };
    }
    return { all: GENERIC_INPUT_EVENTS, defaults: [] };
}

export function eventLabel(catalog: SmlEventCatalog, name: string): string {
    return catalog.all.find(e => e.name === name)?.label || name;
}
