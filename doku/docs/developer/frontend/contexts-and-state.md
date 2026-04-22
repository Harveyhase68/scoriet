---
sidebar_position: 5
---

# Contexts and State Management

## Overview

Scoriet uses React Context API for global state management, avoiding prop drilling and providing centralized access to application state. Three main contexts handle authentication, theming, projects, and notifications.

## Context Architecture

```
App
├── ThemeProvider
│   ├── colors
│   ├── isDarkMode
│   └── setIsDarkMode()
├── ToastProvider
│   ├── showSuccess()
│   ├── showError()
│   └── showInfo()
└── ProjectProvider
    ├── projects[]
    ├── selectedProject
    ├── setSelectedProject()
    ├── editLock
    ├── acquireLock()
    └── releaseLock()
```

## ThemeContext

Manages application theme and colors globally.

### Location
`resources/js/contexts/ThemeContext.tsx`

### Interface

```typescript
interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  border: string;
  text: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  [key: string]: string;
}

interface ThemeContextType {
  colors: ColorScheme;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  colorScheme: 'light' | 'dark';
  setColorScheme: (scheme: 'light' | 'dark') => void;
}
```

### Usage

```typescript
import { useTheme } from '@/contexts/ThemeContext';

export function MyComponent() {
  const { colors, isDarkMode, setIsDarkMode } = useTheme();

  return (
    <div style={{ backgroundColor: colors.background }}>
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        style={{ color: colors.text }}
      >
        Toggle Theme
      </button>
    </div>
  );
}
```

### Color Palette

The theme provides a complete color palette:

```typescript
const lightColors: ColorScheme = {
  primary: '#2563eb',      // Blue
  secondary: '#64748b',    // Gray
  background: '#ffffff',   // White
  surface: '#f8fafc',      // Light gray
  border: '#e2e8f0',       // Light border
  text: '#1e293b',         // Dark text
  error: '#ef4444',        // Red
  warning: '#f59e0b',      // Amber
  success: '#10b981',      // Green
  info: '#3b82f6',         // Blue
};

const darkColors: ColorScheme = {
  primary: '#60a5fa',      // Light blue
  secondary: '#cbd5e1',    // Light gray
  background: '#0f172a',   // Very dark
  surface: '#1e293b',      // Dark gray
  border: '#334155',       // Dark border
  text: '#f1f5f9',         // Light text
  error: '#f87171',        // Light red
  warning: '#fbbf24',      // Light amber
  success: '#34d399',      // Light green
  info: '#60a5fa',         // Light blue
};
```

### Storage

Theme preference is persisted to localStorage:

```typescript
const [isDarkMode, setIsDarkMode] = useState(() => {
  const stored = localStorage.getItem('theme_mode');
  return stored ? stored === 'dark' : false;
});

useEffect(() => {
  localStorage.setItem('theme_mode', isDarkMode ? 'dark' : 'light');
}, [isDarkMode]);
```

## ToastContext

Provides toast notification API for success, error, and info messages.

### Location
`resources/js/contexts/ToastContext.tsx`

### Interface

```typescript
interface ToastContextType {
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  clear: () => void;
}
```

### Usage

```typescript
import { useToast } from '@/contexts/ToastContext';

export function MyComponent() {
  const toast = useToast();

  const handleSave = async () => {
    try {
      await save();
      toast.showSuccess('Data saved successfully');
    } catch (error) {
      toast.showError('Failed to save data');
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### Toast Examples

```typescript
// Success toast (3000ms default)
toast.showSuccess('Operation completed');

// Error toast
toast.showError('An error occurred', 5000);

// Info toast
toast.showInfo('Please note this information');

// Warning toast
toast.showWarning('This action cannot be undone', 4000);
```

### Implementation

Toast uses PrimeReact's Toast component:

```typescript
import { Toast } from 'primereact/toast';

export function ToastProvider({ children }) {
  const toastRef = useRef(null);

  const value = {
    showSuccess: (message: string) => {
      toastRef.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: message,
        life: 3000,
      });
    },
    showError: (message: string) => {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000,
      });
    },
    // ... other methods
  };

  return (
    <ToastContext.Provider value={value}>
      <Toast ref={toastRef} />
      {children}
    </ToastContext.Provider>
  );
}
```

## ProjectContext

Manages selected project, project list, and collaborative edit locking.

### Location
`resources/js/contexts/ProjectContext.tsx`

### Interfaces

```typescript
interface Project {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  is_active: boolean;
  is_public?: boolean;
  join_code?: string;
  allow_join_requests?: boolean;
  created_at: string;
  updated_at: string;
  teams_count?: number;
  members_count?: number;
  templates_count?: number;
  databases_count?: number;
  applications_count?: number;
  is_owner?: boolean;
  can_join?: boolean;
  default_language?: string;
  target_language?: string;
  enabled_languages?: string[];
  is_soft_locked?: boolean;
  subscription?: ProjectSubscription | null;
  diagram_max_tables_per_row?: number;
  diagram_table_width?: number;
  form_designer_snap_to_grid?: boolean;
  form_designer_grid_size?: number;
  report_designer_snap_to_grid?: boolean;
  report_designer_grid_unit?: string;
  database_type?: string;
  database_server?: string;
  owner: {
    id: number;
    name: string;
    email: string;
  };
}

interface ProjectSubscription {
  id: number;
  expires_at: string | null;
  is_expired: boolean;
  is_soft_locked: boolean;
  days_remaining: number | null;
}

interface EditLockState {
  isLocked: boolean;
  lockedByUserId: number | null;
  lockedByUserName: string | null;
  isLockedByMe: boolean;
}

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  loadProjects: () => Promise<void>;
  loading: boolean;
  clearSavedProject: () => void;
  setPreferredProject: (project: Project | null) => void;
  editLock: EditLockState | null;
  acquireLock: (projectId: number) => Promise<boolean>;
  releaseLock: (projectId: number) => Promise<void>;
}
```

### Usage

```typescript
import { useProject } from '@/contexts/ProjectContext';

export function MyComponent() {
  const {
    projects,
    selectedProject,
    setSelectedProject,
    loadProjects,
    editLock,
    acquireLock,
    releaseLock,
  } = useProject();

  useEffect(() => {
    loadProjects();
  }, []);

  const handleProjectChange = async (project: Project) => {
    setSelectedProject(project);
    
    // Acquire exclusive edit lock
    const locked = await acquireLock(project.id);
    if (locked) {
      console.log('Lock acquired, editing allowed');
    }
  };

  return (
    <>
      <select onChange={(e) => {
        const project = projects.find(p => p.id === parseInt(e.target.value));
        if (project) handleProjectChange(project);
      }}>
        {projects.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {selectedProject && (
        <>
          <h1>{selectedProject.name}</h1>
          {editLock?.isLockedByMe ? (
            <span>You have edit access</span>
          ) : editLock?.isLocked ? (
            <span>Locked by {editLock.lockedByUserName}</span>
          ) : null}
        </>
      )}
    </>
  );
}
```

### Project Loading

Projects are loaded from the API on provider initialization:

```typescript
const loadProjects = useCallback(async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      setProjects(data.projects);
    }
  } catch (error) {
    console.error('Failed to load projects:', error);
  } finally {
    setLoading(false);
  }
}, []);
```

### Edit Locking (Real-time Collaboration)

Edit locks prevent concurrent editing by multiple users:

```typescript
const acquireLock = useCallback(async (projectId: number) => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`/api/projects/${projectId}/lock`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const lockData = await response.json();
      setEditLock({
        isLocked: true,
        lockedByUserId: lockData.user_id,
        lockedByUserName: lockData.user_name,
        isLockedByMe: lockData.is_mine,
      });
      return lockData.is_mine;
    }
  } catch (error) {
    console.error('Failed to acquire lock:', error);
    return false;
  }
}, []);

const releaseLock = useCallback(async (projectId: number) => {
  try {
    const token = localStorage.getItem('access_token');
    await fetch(`/api/projects/${projectId}/lock`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    setEditLock(null);
  } catch (error) {
    console.error('Failed to release lock:', error);
  }
}, []);
```

### Lock Heartbeat

The lock is maintained with periodic heartbeat requests:

```typescript
useEffect(() => {
  if (selectedProject && editLock?.isLockedByMe) {
    // Send heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      fetch(`/api/projects/${selectedProject.id}/lock/heartbeat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }, 30000);

    return () => clearInterval(heartbeat);
  }
}, [selectedProject, editLock]);
```

### WebSocket Subscription

The context subscribes to real-time lock changes via Laravel Echo:

```typescript
useEffect(() => {
  if (selectedProject) {
    const channel = getEcho().channel(`project.${selectedProject.id}`);
    
    channel.listen('ProjectLockAcquired', (data) => {
      setEditLock({
        isLocked: true,
        lockedByUserId: data.user_id,
        lockedByUserName: data.user_name,
        isLockedByMe: false,
      });
    });

    channel.listen('ProjectLockReleased', () => {
      setEditLock(null);
    });

    return () => {
      channel.stopListening('ProjectLockAcquired');
      channel.stopListening('ProjectLockReleased');
      getEcho().leaveChannel(`project.${selectedProject.id}`);
    };
  }
}, [selectedProject]);
```

### Project Selection Persistence

Selected project is saved to localStorage:

```typescript
const setSelectedProject = (project: Project | null) => {
  setSelectedProjectState(project);
  if (project) {
    localStorage.setItem('selectedProjectId', project.id.toString());
  } else {
    localStorage.removeItem('selectedProjectId');
  }
};

// Restore on mount
useEffect(() => {
  const savedProjectId = localStorage.getItem('selectedProjectId');
  if (savedProjectId && projects.length > 0) {
    const project = projects.find(p => p.id === parseInt(savedProjectId));
    if (project) setSelectedProject(project);
  }
}, [projects]);
```

## Creating Custom Contexts

### Step 1: Define Interface

```typescript
interface MyContextType {
  value: string;
  setValue: (value: string) => void;
}
```

### Step 2: Create Context

```typescript
const MyContext = createContext<MyContextType | undefined>(undefined);
```

### Step 3: Create Provider Component

```typescript
export function MyProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState('');

  return (
    <MyContext.Provider value={{ value, setValue }}>
      {children}
    </MyContext.Provider>
  );
}
```

### Step 4: Create Hook

```typescript
export function useMyContext() {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
}
```

### Step 5: Use in App

```typescript
<MyProvider>
  <App />
</MyProvider>
```

## State Management Best Practices

### 1. Use Context for Global State

```typescript
// Good: Global state in context
const { theme } = useTheme();

// Bad: Prop drilling
<Component theme={theme} />
<NestedComponent theme={theme} />
<DeeplyNestedComponent theme={theme} />
```

### 2. Keep Contexts Focused

```typescript
// Good: One context per concern
<ThemeProvider>
  <ToastProvider>
    <ProjectProvider>
      <App />
    </ProjectProvider>
  </ToastProvider>
</ThemeProvider>

// Bad: Monolithic mega-context
<AppProvider> // Everything
  <App />
</AppProvider>
```

### 3. Memoize Context Values

```typescript
// Good: Stable reference prevents re-renders
const value = useMemo(() => ({
  theme,
  setTheme,
  colors,
}), [theme, setTheme, colors]);

return (
  <MyContext.Provider value={value}>
    {children}
  </MyContext.Provider>
);

// Bad: New object each render triggers re-renders
return (
  <MyContext.Provider value={{ theme, setTheme, colors }}>
    {children}
  </MyContext.Provider>
);
```

### 4. Use localStorage for Persistence

```typescript
// Good: Persistent state
const [isDarkMode, setIsDarkMode] = useState(() => {
  return localStorage.getItem('theme') === 'dark';
});

useEffect(() => {
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}, [isDarkMode]);

// Bad: Lost on reload
const [isDarkMode, setIsDarkMode] = useState(false);
```

### 5. Handle Loading and Error States

```typescript
interface ProjectContextType {
  projects: Project[];
  loading: boolean;
  error: string | null;
  loadProjects: () => Promise<void>;
}

// Usage
const { projects, loading, error } = useProject();

if (loading) return <ProgressSpinner />;
if (error) return <Message severity="error">{error}</Message>;

return <div>{projects.map(p => p.name)}</div>;
```

## Debugging Contexts

### React DevTools Extension

Install React DevTools to inspect context values:

```
Chrome Web Store → React Developer Tools
```

### Manual Logging

```typescript
// Log when context value changes
useEffect(() => {
  console.log('ProjectContext changed:', { projects, selectedProject, editLock });
}, [projects, selectedProject, editLock]);
```

### Testing Contexts

```typescript
import { render, screen } from '@testing-library/react';

describe('ProjectContext', () => {
  it('should provide selected project', () => {
    const mockProject = { id: 1, name: 'Test' };
    
    render(
      <ProjectProvider initialProject={mockProject}>
        <TestComponent />
      </ProjectProvider>
    );

    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## Common Patterns

### Load Data on Project Change

```typescript
const { selectedProject } = useProject();

useEffect(() => {
  if (selectedProject) {
    loadDataForProject(selectedProject.id);
  }
}, [selectedProject?.id]);
```

### Show Loading State

```typescript
const { selectedProject, editLock } = useProject();

if (!selectedProject) {
  return <Message>No project selected</Message>;
}

if (!editLock?.isLockedByMe) {
  return <Message severity="warn">Project is locked</Message>;
}

return <EditorComponent />;
```

### Handle Errors

```typescript
const toast = useToast();
const { selectedProject } = useProject();

const handleSave = async () => {
  try {
    if (!selectedProject) {
      throw new Error('No project selected');
    }
    await save();
    toast.showSuccess('Saved');
  } catch (error) {
    toast.showError(error.message);
  }
};
```

## Next Steps

- [Components Library](components.md) - Reusable UI components
- [Panels Architecture](panels.md) - Panel system
- [Overview](overview.md) - Architecture overview
