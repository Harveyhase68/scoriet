import type { Config } from 'ziggy-js';
import type { ReactNode, CSSProperties } from 'react';

export interface Auth {
    user: User;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

// Component Props
export interface TabContentProps {
    children: ReactNode;
    style?: CSSProperties;
    [key: string]: unknown;
}

export interface NavigationPanelProps {
    onOpenPanel: (panelId: string) => void;
}

export interface TreeNodeData {
    key: string;
    title: string;
    children?: TreeNodeData[];
    icon?: ReactNode;
}

// Table related types
export interface TableColumn {
    field: string;
    header: string;
    sortable?: boolean;
    style?: CSSProperties;
}

export interface TableRowData {
    [key: string]: unknown;
}
