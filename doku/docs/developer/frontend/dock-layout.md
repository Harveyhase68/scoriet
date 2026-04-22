---
sidebar_position: 2
---

# Dock Layout System

## Overview

The Scoriet application uses **rc-dock** to provide a professional multi-document interface (MDI), allowing users to manage multiple panels simultaneously through docking, floating, and tabbing.

![Dock Layout](/img/screenshots/mdi-interface.png)
*rc-dock based MDI layout with dockable and floating panels*

## What is RC Dock?

RC Dock is a React component library that provides:
- Dockable panels (top, bottom, left, right, center)
- Floatable windows
- Tab-based panel switching
- Resizable sections
- Customizable styling

## Layout Architecture

### Initial Layout State

The application starts with an empty layout defined in `Index.tsx`:

```typescript
const initialLayout: any = {
  "dockbox": {
    "id": "+1",
    "mode": "horizontal",
    "children": []
  },
  "floatbox": {
    "id": "+4",
    "size": 200,
    "mode": "float",
    "children": []
  }
};
```

**Layout Structure:**
- **dockbox** - Container for docked panels (top, left, right, bottom, center)
- **floatbox** - Container for floating/detached windows
- **mode** - "horizontal" or "vertical" for docked sections
- **children** - Array of panels in this container

### DockLayout Component

The main layout component from rc-dock:

```typescript
<DockLayout
  layout={layout}
  onLayoutChange={onLayoutChange}
  groups={groups}
  defaultGroup="tab"
/>
```

**Key Props:**
- `layout` - Current layout configuration
- `onLayoutChange` - Callback when user modifies layout
- `groups` - Panel group definitions (behavior configuration)
- `defaultGroup` - Default group for new panels

## Panel Groups

Panel groups define how panels behave in the dock:

```typescript
const groups: any = {
  "tab": {
    floatable: true,      // Can be dragged out as float
    newWindow: false,     // Cannot create new windows
    panelExtra: extra,    // Extra UI elements (buttons)
    onCloseAll: onCloseAllPanels,  // Close all in group
  },
  "float": {
    floatable: false,     // Stays floating
    newWindow: true,      // Can create new windows
  }
};
```

**Group Configuration Options:**
- **floatable** - Allow dragging to float/dock
- **newWindow** - Allow creating new windows
- **panelExtra** - Custom buttons in panel header
- **onCloseAll** - Handler for "Close All" action

## Panel Icons

RC Dock provides standard icons for panel controls:

```typescript
const icons = {
  maximize: <i className="pi pi-arrows-alt" />,
  restore: <i className="pi pi-minus" />,
  close: <i className="pi pi-times" />,
  more: <i className="pi pi-caret-down" />,
  closeAll: <i className="pi pi-trash" style={{ color: '#ff4d4f' }} />,
};
```

- **maximize** - Expand panel to full screen
- **restore** - Return from maximized state
- **close** - Close this panel tab
- **more** - Show panel options menu
- **closeAll** - Close all tabs in this group

## Panel Lifecycle

### Loading Panels

Panels are dynamically loaded through the `loadTab()` function:

```typescript
const loadTab = (panelId: string, data?: any): JSX.Element => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  if (!token) {
    return <div>Not authenticated</div>;
  }

  switch (panelId) {
    case 'formDesigner':
      return (
        <Suspense fallback={<ProgressSpinner />}>
          <FormDesignerPanel {...data} />
        </Suspense>
      );
    case 'kanban':
      return (
        <Suspense fallback={<ProgressSpinner />}>
          <KanbanBoardPanel {...data} />
        </Suspense>
      );
    // ... 55+ more panels
    default:
      return <div>Unknown panel: {panelId}</div>;
  }
};
```

**Process:**
1. Check authentication
2. Switch on panel ID
3. Lazy-load the component
4. Wrap in Suspense with loading fallback
5. Pass data props if provided

### Adding a New Panel

To add a new panel to the dock:

```typescript
// 1. Import or lazy-load the component
const MyNewPanel = lazy(() => import('@/Components/Panels/MyNewPanel'));

// 2. Add case to loadTab switch statement
case 'myNewPanel':
  return (
    <Suspense fallback={<ProgressSpinner />}>
      <MyNewPanel {...data} onOpenPanel={openPanelCallback} />
    </Suspense>
  );

// 3. Open the panel
openPanel('myNewPanel', { projectId: 123 });
```

### Panel Window Data

Global window object stores panel-specific data:

```typescript
declare global {
  interface Window {
    _tabData?: Record<string, {
      filterByProject?: boolean;
      forceProjectId?: number;
      tableId?: number;
      projectName?: string;
      teamId?: number;
      // ... more properties
    }>;
  }
}

// Usage
window._tabData = window._tabData || {};
window._tabData['myTabId'] = { projectId: 123 };
```

## Panel Properties

Each panel in the layout has properties:

```typescript
interface PanelConfig {
  id: string;           // Unique panel ID
  group: string;        // Group name ("tab" or "float")
  title?: string;       // Display title
  content: string;      // Panel type identifier
  closable?: boolean;   // Allow close button
  resizable?: boolean;  // Allow resizing
}
```

## Opening and Closing Panels

### Open a Panel

```typescript
const openPanel = (panelType: string, data?: any, options?: any) => {
  const newTabId = options?.tabId || `${panelType}_${Date.now()}`;
  const newLayout = DockLayout.update(layout, {
    dockbox: {
      children: [
        {
          id: newTabId,
          group: "tab",
          title: data?.title || panelType,
          content: panelType,
          closable: true,
        }
      ]
    }
  });
  setLayout(newLayout);
};
```

### Close a Panel

```typescript
const closePanel = (panelId: string) => {
  const newLayout = DockLayout.remove(layout, panelId);
  setLayout(newLayout);
};
```

### Close All Panels

```typescript
const onCloseAllPanels = () => {
  const newLayout = {
    dockbox: { id: "+1", mode: "horizontal", children: [] },
    floatbox: { id: "+4", size: 200, mode: "float", children: [] }
  };
  setLayout(newLayout);
};
```

## Layout Persistence

Layouts are automatically saved to localStorage for restoration on reload:

```typescript
const LayoutPersistenceService = {
  save: (layoutKey: string, layout: any) => {
    localStorage.setItem(layoutKey, JSON.stringify(layout));
  },
  
  load: (layoutKey: string): any => {
    const saved = localStorage.getItem(layoutKey);
    return saved ? JSON.parse(saved) : initialLayout;
  }
};

// In component
const [layout, setLayout] = useState(() => 
  LayoutPersistenceService.load('dockLayout')
);

useEffect(() => {
  LayoutPersistenceService.save('dockLayout', layout);
}, [layout]);
```

## Resize Handlers

The left sidebar supports custom resizing:

```typescript
const handleLeftSidebarResize = (event: React.MouseEvent) => {
  const startX = event.clientX;
  const startWidth = leftSidebarWidth;

  const handleMouseMove = (e: MouseEvent) => {
    const diff = e.clientX - startX;
    const newWidth = Math.max(200, startWidth + diff);
    setLeftSidebarWidth(newWidth);
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    localStorage.setItem('leftSidebarWidth', leftSidebarWidth.toString());
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};
```

## Hotkey System

Keyboard shortcuts for panel operations:

```typescript
// Alt+P - Update/refresh current panel
useHotkeys('alt+p', () => {
  if (activeTabId) {
    refreshPanel(activeTabId);
  }
});

// Alt+M - Maximize/restore current panel
useHotkeys('alt+m', () => {
  if (activeTabId) {
    toggleMaximize(activeTabId);
  }
});

// Alt+N - Open new panel
useHotkeys('alt+n', () => {
  openPanel('PanelT2');
});
```

## Tab Content Container

All panel content is wrapped in `TabContent`:

```typescript
const TabContent: React.FC<TabContentProps> = ({ 
  children, 
  style = {}, 
  ...rest 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const setFocus = () => ref.current?.focus();

  return (
    <div
      {...rest}
      ref={ref}
      tabIndex={-1}
      style={{ flex: 1, padding: '5px 10px', ...style }}
      onMouseDownCapture={setFocus}
      onTouchStartCapture={setFocus}
    >
      {children}
    </div>
  );
};
```

## Layout Modes

### Docked Layout
Panels are attached to specific dock areas (top, left, right, bottom, center).

```typescript
{
  id: "panelT1",
  group: "tab",
  title: "Navigation",
  content: "panelT1"
  // Appears in dock area
}
```

### Floating Layout
Panels are independent floating windows.

```typescript
{
  id: "floatingDialog",
  group: "float",
  title: "Dialog",
  content: "dialog",
  // Floats independently
}
```

### Tab Layout
Multiple panels in same dock area as tabs.

```typescript
// Same parent node, multiple children
{
  id: "container",
  mode: "horizontal",
  children: [
    { id: "panel1", title: "Panel 1" },
    { id: "panel2", title: "Panel 2" },
    // User clicks tabs to switch
  ]
}
```

## Responsive Behavior

The dock layout adapts to screen size:

```typescript
const isMobile = window.innerWidth < 768;

// On mobile, hide sidebars by default
if (isMobile) {
  showLeftSidebar = false;
  showRightSidebar = false;
}
```

## Layout Change Callback

Called whenever user modifies layout:

```typescript
const onLayoutChange = (newLayout: any) => {
  setLayout(newLayout);
  
  // Persist to localStorage
  localStorage.setItem('dockLayout', JSON.stringify(newLayout));
  
  // Update active tab info
  const activeTabId = findActiveTabId(newLayout);
  setActiveTabId(activeTabId);
};
```

## Performance Considerations

1. **Lazy Loading** - Panels only load when opened
2. **Suspense** - Shows loading UI while panel loads
3. **Memoization** - Prevent unnecessary re-renders
4. **Layout Persistence** - Fast restore on reload
5. **ErrorBoundary** - Isolate panel errors

## Styling RC Dock

Custom styles override rc-dock defaults:

```css
/* resources/js/pages/rs-dock.css */
.rc-dock {
  /* Custom dock styling */
}

.rc-dock-box {
  /* Box styling */
}

.rc-dock-tab {
  /* Tab styling */
}

.rc-dock-panel {
  /* Panel styling */
}
```

## Common Patterns

### Open Panel from Another Panel

```typescript
// In a panel component
const openPanelCallback = (panelType: string, data?: any) => {
  window.dispatchEvent(new CustomEvent('openPanel', { 
    detail: { panelType, data } 
  }));
};

<FormDesignerPanel onOpenPanel={openPanelCallback} />
```

### Pass Data Between Panels

```typescript
// Using window._tabData
window._tabData = window._tabData || {};
window._tabData['formDesigner'] = {
  projectId: 123,
  formSetId: 456
};

// In receiving panel
const projectId = window._tabData?.['formDesigner']?.projectId;
```

### Focus Management

```typescript
// Ensure panel can receive keyboard input
<div
  ref={ref}
  tabIndex={-1}
  onMouseDownCapture={() => ref.current?.focus()}
>
  {children}
</div>
```

## Best Practices

1. **Always lazy-load large panels** - Reduces initial bundle
2. **Provide meaningful titles** - Help users identify panels
3. **Use Suspense** - Show loading UI during load
4. **Persist layout** - Save user preferences
5. **Handle errors gracefully** - Use ErrorBoundary
6. **Close unused panels** - Improve performance
7. **Test responsive behavior** - Works on all screen sizes

## Next Steps

- [Panels Architecture](panels.md) - Detailed panel structure
- [Components](components.md) - Reusable UI components
- [Contexts](contexts-and-state.md) - State management
