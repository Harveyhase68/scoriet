import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TabView, TabViewProps } from 'primereact/tabview';

/**
 * Drop-in replacement for PrimeReact's <TabView> that renders the tabs as a
 * left-side menu instead of along the top, with a drag-resizable divider
 * between the menu and the panel area.
 *
 *   <TabViewSideMenu
 *     activeIndex={tab}
 *     onTabChange={(e) => setTab(e.index)}
 *     storageKey="profileModal"        // optional — persists user's width
 *   >
 *     <TabPanel header="Profile">...</TabPanel>
 *     <TabPanel header="Security">...</TabPanel>
 *   </TabViewSideMenu>
 *
 * All vertical-layout work happens in the .p-tabview-vertical CSS block in
 * Components/Panels/styles.css; this component is responsible only for:
 *   - applying the className
 *   - rendering the drag-handle as an absolutely-positioned sibling
 *   - driving the menu width via the --p-tabview-vertical-width CSS variable
 *   - persisting the chosen width to localStorage (per-storageKey)
 */

interface TabViewSideMenuProps extends TabViewProps {
  /**
   * Optional. If provided, the user's chosen menu width is persisted in
   * localStorage under `scoriet_tabview_vertical_width__<storageKey>` and
   * restored on next mount. Pick something stable per modal — e.g. the
   * modal's name. Omit to use the default width without persistence.
   */
  storageKey?: string;

  /** Initial menu width before the user has dragged. Default: 240px. */
  defaultWidth?: number;

  /** Lower bound for resize. Default: 160px (prevents unreadable labels). */
  minWidth?: number;

  /** Upper bound for resize. Default: 400px (prevents starving the panel). */
  maxWidth?: number;
}

const STORAGE_PREFIX = 'scoriet_tabview_vertical_width__';

export default function TabViewSideMenu({
  storageKey,
  defaultWidth = 240,
  minWidth = 160,
  maxWidth = 400,
  className,
  style,
  children,
  ...tabViewProps
}: TabViewSideMenuProps) {
  // Initialise width from localStorage when available so the user's previous
  // choice survives modal-close → reopen. We compute the initial value during
  // useState's lazy initializer to avoid a flash of the default width on
  // first paint.
  const [width, setWidth] = useState<number>(() => {
    if (!storageKey) return defaultWidth;
    try {
      const raw = window.localStorage.getItem(STORAGE_PREFIX + storageKey);
      if (raw === null) return defaultWidth;
      const parsed = parseInt(raw, 10);
      if (Number.isFinite(parsed)) {
        return clamp(parsed, minWidth, maxWidth);
      }
    } catch {
      // localStorage might be unavailable (private mode etc.) — fall through.
    }
    return defaultWidth;
  });

  const [isDragging, setIsDragging] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // -------------------------------------------------------------------
  // Anchor the parent PrimeReact <Dialog> so the FIRST resize after open
  // behaves like every subsequent resize.
  //
  // Why this exists: PrimeReact positions a freshly-opened resizable+draggable
  // dialog with `transform: translate(-50%, -50%)` to centre it. If the user
  // then grabs a corner WITHOUT first dragging the dialog, the resize is
  // computed relative to the transformed centre — width/height changes cause
  // all four edges to move at once instead of just the grabbed corner. Once
  // the user has dragged the dialog (even a single pixel), PrimeReact replaces
  // the transform with absolute top/left and resize behaves normally.
  //
  // We force that "post-drag" state right at mount: read the dialog's current
  // bounding rect, write top/left as inline styles, and drop the transform.
  // Visually identical, but the resize now anchors to the dragged corner from
  // the very first interaction.
  // -------------------------------------------------------------------
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const dialog = wrapper.closest('.p-dialog') as HTMLElement | null;
    if (!dialog) return;

    // requestAnimationFrame lets PrimeReact finish its initial centering
    // pass before we freeze the position — otherwise we'd read a rect from
    // an intermediate state.
    const rafId = requestAnimationFrame(() => {
      const rect = dialog.getBoundingClientRect();
      // CRITICAL: switch to position:fixed before writing top/left.
      // PrimeReact's default .p-dialog uses position:relative — under that,
      // `top: 200px` means "shift 200px DOWN from the flex-centred flow
      // position", not "the dialog's top should be 200px in the viewport".
      // The previous version (without this line) made every modal slide
      // bottom-right by exactly its centred coordinates on open. With fixed
      // positioning, top/left are viewport-anchored — and getBoundingClientRect
      // is already in viewport space, so the rect values can be applied as-is.
      dialog.style.position = 'fixed';
      dialog.style.transform = 'none';
      dialog.style.top = `${rect.top}px`;
      dialog.style.left = `${rect.left}px`;
      // PrimeReact sometimes adds auto margins for centering; with explicit
      // top/left we want margin out of the way so it doesn't shift things.
      dialog.style.margin = '0';
    });

    return () => cancelAnimationFrame(rafId);
  }, []);

  // Persist whenever width changes, but only when we actually have a storageKey
  // and only AFTER the user has dragged at least once (a write triggered by
  // the initial read would be a no-op anyway, but skipping it keeps DevTools'
  // Storage tab clean).
  const hasUserDraggedRef = useRef(false);
  useEffect(() => {
    if (!storageKey || !hasUserDraggedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_PREFIX + storageKey, String(width));
    } catch {
      // ignore — persistence is best-effort
    }
  }, [storageKey, width]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const wrapperLeft = wrapper.getBoundingClientRect().left;
    // The wrapper now has CSS padding-left, so the actual nav-container left
    // edge sits at wrapperLeft + padLeft, not wrapperLeft. We compute the
    // candidate width relative to the inner content edge, otherwise drag
    // starts ~15px "off" from where the user clicked the handle.
    const padLeft = parseFloat(getComputedStyle(wrapper).paddingLeft) || 0;

    const handleMove = (ev: MouseEvent) => {
      hasUserDraggedRef.current = true;
      const candidate = ev.clientX - wrapperLeft - padLeft;
      setWidth(clamp(candidate, minWidth, maxWidth));
    };

    const handleUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [minWidth, maxWidth]);

  // Merge consumer className with our marker class so the CSS picks up the
  // vertical layout. We rely on the consumer NOT passing "p-tabview-vertical"
  // themselves — but if they do, dedupe via the Set so the className stays
  // tidy in the DOM.
  const mergedClassName = Array.from(
    new Set(['p-tabview-vertical', ...(className?.split(/\s+/).filter(Boolean) ?? [])])
  ).join(' ');

  // Inline CSS variable feeds both the nav-container width and the resizer's
  // left offset (which it reads via `left: var(--p-tabview-vertical-width)`).
  const wrapperStyle: React.CSSProperties = {
    ...(style ?? {}),
    ['--p-tabview-vertical-width' as any]: `${width}px`,
  };

  return (
    <div
      ref={wrapperRef}
      className="p-tabview-vertical-wrapper"
      style={wrapperStyle}
    >
      <TabView className={mergedClassName} {...tabViewProps}>
        {children}
      </TabView>
      <div
        className={`p-tabview-vertical-resizer${isDragging ? ' is-dragging' : ''}`}
        // The wrapper now carries left-padding (--p-tabview-vertical-pad-left)
        // so we have to add that offset onto the resizer's left position —
        // otherwise the handle lands inside the nav band instead of right on
        // the seam between nav and panels. Both variables live on the wrapper,
        // so calc() picks them up via inheritance.
        style={{
          left: `calc(var(--p-tabview-vertical-pad-left, 0px) + var(--p-tabview-vertical-width))`,
        }}
        onMouseDown={handleMouseDown}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize tab menu"
      />
    </div>
  );
}

function clamp(value: number, lo: number, hi: number): number {
  if (value < lo) return lo;
  if (value > hi) return hi;
  return value;
}
