---
sidebar_position: 4
---

# Components Library

## Overview

Scoriet uses a combination of custom components and PrimeReact components to build the user interface. This document covers the key reusable components and patterns used throughout the application.

## UI Component Libraries

### PrimeReact Components

PrimeReact provides pre-built, styled components:

```typescript
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
// ... and many more
```

**Commonly Used Components:**

| Component | Purpose | Example |
|-----------|---------|---------|
| Button | Clickable button | `<Button label="Click" onClick={...} />` |
| InputText | Single-line text input | `<InputText value={val} onChange={...} />` |
| InputTextarea | Multi-line text | `<InputTextarea rows={5} />` |
| InputNumber | Numeric input | `<InputNumber value={num} />` |
| Dropdown | Select dropdown | `<Dropdown options={items} onChange={...} />` |
| Calendar | Date picker | `<Calendar value={date} onChange={...} />` |
| Checkbox | Checkbox control | `<Checkbox checked={val} onChange={...} />` |
| DataTable | Table display | `<DataTable value={data}><Column field="name" /></DataTable>` |
| Dialog | Modal dialog | `<Dialog visible={show} onHide={...}>content</Dialog>` |
| Toast | Notifications | `<Toast ref={toast} />` |
| Menu | Context/dropdown menu | `<Menu model={items} popup ref={menu} />` |
| Card | Content card | `<Card><p>Content</p></Card>` |
| Splitter | Resizable panels | `<Splitter><SplitterPanel>Left</SplitterPanel></Splitter>` |
| TabView | Tabbed content | `<TabView><TabPanel header="Tab 1">Content</TabPanel></TabView>` |
| Message | Alert message | `<Message severity="error">Error text</Message>` |
| ProgressSpinner | Loading spinner | `<ProgressSpinner />` |
| Tag | Badge/label | `<Tag value="status" />` |
| Badge | Numeric badge | `<Badge value="5" />` |

### Lucide Icons

```typescript
import { 
  Plus, Trash2, Edit, Settings, 
  ChevronDown, Search, Mail 
} from 'lucide-react';

<Plus size={20} />
<Trash2 size={20} className="text-red-500" />
```

### PrimeIcons

Built into PrimeReact:

```typescript
<i className="pi pi-home"></i>
<i className="pi pi-search" style={{ fontSize: '20px' }}></i>
```

## Custom Components

### TopBar
Top navigation and global controls.

```typescript
// Location: resources/js/Components/TopBar.tsx
<TopBar 
  onProjectChange={(project) => setProject(project)}
  onSettings={() => openSettingsPanel()}
/>
```

**Features:**
- Project selector
- User menu
- Settings access
- Help/documentation links

### ClassicTreeView
Hierarchical tree navigation component.

```typescript
// Location: resources/js/Components/ClassicTreeView.tsx
interface TreeNode {
  id: string | number;
  label: string;
  icon?: string;
  children?: TreeNode[];
  data?: any;
}

<ClassicTreeView
  nodes={projectTree}
  onNodeSelect={(node) => handleSelect(node)}
  expandedKeys={expanded}
  onToggle={(keys) => setExpanded(keys)}
/>
```

**Features:**
- Expand/collapse nodes
- Custom icons
- Selection handling
- Lazy loading support
- Search/filter

### AuthModalManager
Orchestrates authentication modals.

```typescript
// Location: resources/js/Components/AuthModals/AuthModalManager.tsx
<AuthModalManager 
  initialModal="login"
  onAuthSuccess={() => navigate('/app')}
/>
```

**Available Modals:**
- LoginModal
- RegisterModal
- ForgotPasswordModal
- ResetPasswordModal
- TwoFactorVerifyDialog
- ProfileModal
- PlanModal
- CreditPurchaseModal

### Modal Components

#### Dialog (PrimeReact)
```typescript
const [visible, setVisible] = useState(false);

<Dialog 
  visible={visible} 
  onHide={() => setVisible(false)}
  header="Dialog Title"
  modal
>
  Dialog content here
</Dialog>

<Button 
  label="Open" 
  onClick={() => setVisible(true)} 
/>
```

#### Confirm Dialog
```typescript
import { confirmDialog } from 'primereact/confirmdialog';
import { ConfirmDialog } from 'primereact/confirmdialog';

const confirm = () => {
  confirmDialog({
    message: 'Are you sure?',
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    accept: () => handleDelete(),
    reject: () => { }
  });
};

return (
  <>
    <ConfirmDialog />
    <Button onClick={confirm} label="Delete" />
  </>
);
```

## Form Components

### InputField Pattern

```typescript
import { InputText } from 'primereact/inputtext';
import { useForm, Controller } from 'react-hook-form';

const { control, handleSubmit, formState: { errors } } = 
  useForm<FormData>({
    defaultValues: { name: '' }
  });

<Controller
  name="name"
  control={control}
  rules={{ 
    required: 'Name is required',
    minLength: { value: 3, message: 'Min 3 chars' }
  }}
  render={({ field }) => (
    <div>
      <label>Name</label>
      <InputText 
        {...field} 
        className={errors.name ? 'p-invalid' : ''}
      />
      {errors.name && (
        <small className="p-error">{errors.name.message}</small>
      )}
    </div>
  )}
/>
```

### Dropdown Field

```typescript
interface Option {
  label: string;
  value: any;
}

const options: Option[] = [
  { label: 'Option 1', value: 1 },
  { label: 'Option 2', value: 2 }
];

<Controller
  name="status"
  control={control}
  render={({ field }) => (
    <Dropdown
      {...field}
      options={options}
      placeholder="Select..."
      optionLabel="label"
      optionValue="value"
    />
  )}
/>
```

### Checkbox Field

```typescript
<Controller
  name="isActive"
  control={control}
  render={({ field }) => (
    <Checkbox
      {...field}
      inputId="active"
      label="Active"
    />
  )}
/>
```

## Data Display Components

### DataTable

```typescript
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const [data, setData] = useState([]);
const [selectedRows, setSelectedRows] = useState([]);

<DataTable
  value={data}
  selection={selectedRows}
  onSelectionChange={(e) => setSelectedRows(e.value)}
  selectionMode="checkbox"
  paginator
  rows={10}
  dataKey="id"
  sortMode="multiple"
>
  <Column 
    selectionMode="multiple" 
    headerStyle={{ width: '3rem' }} 
  />
  <Column field="name" header="Name" sortable />
  <Column field="email" header="Email" sortable />
  <Column 
    header="Actions"
    body={(row) => (
      <>
        <Button onClick={() => editRow(row)}>Edit</Button>
        <Button onClick={() => deleteRow(row)}>Delete</Button>
      </>
    )}
  />
</DataTable>
```

**Features:**
- Sorting (single/multiple)
- Pagination
- Selection (single/checkbox)
- Filtering
- Virtual scrolling
- Resizable columns
- Custom column templates
- Expandable rows

### Virtual Scrolling

```typescript
<DataTable
  value={largeDataset}
  scrollable
  scrollHeight="400px"
  virtualScroll
  rows={20}
>
  <Column field="name" header="Name" />
</DataTable>
```

## Navigation Components

### Menu

```typescript
import { Menu } from 'primereact/menu';

const menuItems = [
  { label: 'Save', icon: 'pi pi-save', command: () => save() },
  { label: 'Delete', icon: 'pi pi-trash', command: () => delete() },
  { separator: true },
  { label: 'Help', icon: 'pi pi-question', command: () => help() }
];

const menu = useRef(null);

<Menu model={menuItems} popup ref={menu} />
<Button 
  onClick={(e) => menu.current.toggle(e)}
  icon="pi pi-bars"
/>
```

### Toolbar

```typescript
import { Toolbar } from 'primereact/toolbar';

<Toolbar
  left={<Button label="New" icon="pi pi-plus" />}
  right={<Button label="Delete" icon="pi pi-trash" />}
/>
```

## Layout Components

### Splitter

```typescript
import { Splitter, SplitterPanel } from 'primereact/splitter';

<Splitter layout="horizontal" style={{ height: '400px' }}>
  <SplitterPanel size={30} minSize={20}>
    Left Panel
  </SplitterPanel>
  <SplitterPanel size={70} minSize={30}>
    Right Panel
  </SplitterPanel>
</Splitter>
```

### TabView

```typescript
import { TabView, TabPanel } from 'primereact/tabview';

const [activeIndex, setActiveIndex] = useState(0);

<TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
  <TabPanel header="General">
    General content
  </TabPanel>
  <TabPanel header="Advanced">
    Advanced content
  </TabPanel>
</TabView>
```

## Notification Components

### Toast

```typescript
import { Toast } from 'primereact/toast';

const toast = useRef(null);

const showSuccess = () => {
  toast.current?.show({
    severity: 'success',
    summary: 'Success',
    detail: 'Operation successful',
    life: 3000
  });
};

return (
  <>
    <Toast ref={toast} />
    <Button onClick={showSuccess} label="Show Success" />
  </>
);
```

**Severity Levels:**
- success
- info
- warn
- error

### Message

```typescript
import { Message } from 'primereact/message';

<Message severity="error" text="An error occurred" />
<Message severity="info" text="Information message" />
<Message severity="success" text="Success message" />
<Message severity="warn" text="Warning message" />
```

## Diagram Components

### ReactFlow (XyFlow)

Used for visual designers (forms, reports, workflows):

```typescript
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant
} from '@xyflow/react';

const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
>
  <Background variant={BackgroundVariant.Dots} />
  <Controls />
  <MiniMap />
</ReactFlow>
```

**Features:**
- Node drag-and-drop
- Custom node types
- Edge connections
- Zoom and pan
- Mini map
- Grid background
- Selection

## Drag & Drop Components

### dnd-kit

Used for sortable lists and kanban boards:

```typescript
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';

const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor)
);

function SortableItem({ id }) {
  const { attributes, listeners, setNodeRef, transform } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform) }}
      {...attributes}
      {...listeners}
    >
      Item {id}
    </div>
  );
}

<DndContext
  sensors={sensors}
  collisionDetection={closestCorners}
  onDragEnd={handleDragEnd}
>
  <SortableContext items={items} strategy={verticalListSortingStrategy}>
    {items.map(id => <SortableItem key={id} id={id} />)}
  </SortableContext>
  <DragOverlay>
    {activeId ? <SortableItem id={activeId} /> : null}
  </DragOverlay>
</DndContext>
```

## Editor Components

### CodeMirror

For SQL, JavaScript, and code editing:

```typescript
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';

<CodeMirror
  value={code}
  onChange={setCode}
  extensions={[sql()]}
  height="400px"
/>
```

### Quill (Rich Text Editor)

For rich text editing:

```typescript
import Quill from 'quill';

// Initialized in component
const quillRef = useRef(null);
const [value, setValue] = useState('');

useEffect(() => {
  const quill = new Quill(quillRef.current, {
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ]
    },
    theme: 'snow'
  });

  quill.on('text-change', () => {
    setValue(quill.getContents());
  });
}, []);

return <div ref={quillRef} />;
```

## Icon Components

### FlagIcon, CountryFlag, CSSFlag

For language/country selection:

```typescript
import FlagIcon from '@/Components/FlagIcon';
import CountryFlag from '@/Components/CountryFlag';
import CSSFlag from '@/Components/CSSFlag';

<FlagIcon countryCode="US" />
<CountryFlag code="DE" />
<CSSFlag code="FR" />
```

### LanguageSelector

Pre-built language selection component:

```typescript
import LanguageSelector from '@/Components/LanguageSelector';

<LanguageSelector 
  onLanguageChange={(lang) => setLanguage(lang)}
/>
```

## Custom Patterns

### Loading State

```typescript
const [loading, setLoading] = useState(false);

return (
  <>
    {loading && <ProgressSpinner />}
    {!loading && <div>Content</div>}
  </>
);
```

### Error Boundary

```typescript
import ErrorFallback from '@/Components/ErrorFallback';
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <MyComponent />
</ErrorBoundary>
```

### useToast Hook

```typescript
import { useToast } from '@/contexts/ToastContext';

const toast = useToast();

const handleSave = async () => {
  try {
    await save();
    toast.showSuccess('Saved successfully');
  } catch (error) {
    toast.showError('Failed to save');
  }
};
```

### useTheme Hook

```typescript
import { useTheme } from '@/contexts/ThemeContext';

const { colors, isDarkMode, setIsDarkMode } = useTheme();

return (
  <div style={{ backgroundColor: colors.background }}>
    <button onClick={() => setIsDarkMode(!isDarkMode)}>
      Toggle Theme
    </button>
  </div>
);
```

## Component Best Practices

1. **Use TypeScript** - Define prop interfaces
2. **Prop Drilling Avoidance** - Use contexts for global state
3. **Memoization** - `React.memo()` for expensive components
4. **Error Handling** - ErrorBoundary + try/catch
5. **Loading States** - Always show progress during async ops
6. **Accessibility** - Use semantic HTML, ARIA labels
7. **Responsive Design** - Mobile-first approach
8. **Testing** - Unit tests for components

## Next Steps

- [Contexts and State](contexts-and-state.md) - State management
- [Panels Architecture](panels.md) - Panel components
- [Overview](overview.md) - Architecture overview
