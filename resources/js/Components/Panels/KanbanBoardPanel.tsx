import React, { useState, useEffect, useCallback } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
// Tag is used via JSX in column headers
import { Tag as _Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ProgressSpinner } from 'primereact/progressspinner';
// Tooltip reserved for future use
import { Tooltip as _Tooltip } from 'primereact/tooltip';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent as _DragOverEvent,
    useDroppable,
} from '@dnd-kit/core';
import {
    arrayMove as _arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '@/contexts/ToastContext';
import { useProject } from '@/contexts/ProjectContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import type { Translations } from '@/i18n/types';
import { useTheme } from '@/contexts/ThemeContext';

// Helper function to get auth token
const getAuthToken = (): string | null => {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
};

interface TabPanelProps {
    isActive: boolean;
    onOpenPanel?: (panelId: string, data?: any) => void;
    projectId?: number;
}

interface User {
    id: number;
    name: string;
    username?: string;
    email?: string;
    avatar_url?: string | null;
    initials?: string;
}

interface Assignee {
    id: number;
    username?: string;
    name?: string;
    email?: string;
    avatar_url?: string | null;
    initials?: string;
    color?: string;
    kanban_role?: string | null;
    kanban_role_short?: string | null;
    kanban_role_color?: string | null;
    pivot?: {
        assigned_by: number;
        assigned_at: string;
    };
}

interface KanbanRole {
    value: string;
    label: string;
    short: string;
    description: string;
    color: string;
}

interface TeamMember {
    id: number;
    username: string;
    email: string;
    avatar_url?: string | null;
    initials: string;
    color: string;
    has_custom_initials: boolean;
    kanban_role?: string | null;
    kanban_role_short?: string | null;
    kanban_role_name?: string | null;
    kanban_role_color?: string | null;
}

interface KanbanLabel {
    id: number;
    board_id: number;
    name: string;
    color: string;
}

interface KanbanCard {
    id: number;
    column_id: number;
    created_by: number;
    assigned_to: number | null;
    title: string;
    description: string | null;
    color: string | null;
    position: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date: string | null;
    estimated_hours: number | null;
    actual_hours: number | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
    assignee: User | null;
    assignees: Assignee[]; // Multiple assignees (new)
    creator: User;
    labels: KanbanLabel[];
}

interface KanbanColumn {
    id: number;
    board_id: number;
    name: string;
    color: string;
    position: number;
    wip_limit: number | null;
    is_done_column: boolean;
    cards: KanbanCard[];
}

interface KanbanBoard {
    id: number;
    project_id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    columns: KanbanColumn[];
    labels: KanbanLabel[];
}

const PRIORITY_COLORS: Record<string, string> = {
    low: '#6b7280',
    medium: '#3b82f6',
    high: '#f59e0b',
    urgent: '#ef4444',
};

// Helper function to darken/lighten a hex color
const adjustColor = (hex: string, amount: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

// Helper function to get contrasting text color (black or white) based on background
const getContrastTextColor = (hexColor: string): string => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Calculate relative luminance using sRGB formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    // Return dark color for light backgrounds, white for dark backgrounds
    return luminance > 0.5 ? '#1e293b' : '#ffffff';
};

// Sortable Card Component
interface SortableCardProps {
    card: KanbanCard;
    onEdit: () => void;
    onDelete: () => void;
    onAssignMe: () => void;
    onUnassignMe: () => void;
    isAssigned: boolean;
    t: Translations;
    currentLanguage: SupportedLanguage;
}

function SortableCard({ card, onEdit, onDelete, onAssignMe, onUnassignMe, isAssigned, t, currentLanguage }: SortableCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `card-${card.id}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isOverdue = card.due_date && !card.completed_at && new Date(card.due_date) < new Date();
    const isDueSoon = card.due_date && !card.completed_at && !isOverdue &&
        Math.ceil((new Date(card.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 2;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="kanban-card"
        >
            {/* Priority indicator */}
            <div
                className="kanban-card-priority"
                style={{ backgroundColor: PRIORITY_COLORS[card.priority] }}
            />

            {/* Card header with labels */}
            {card.labels && card.labels.length > 0 && (
                <div className="kanban-card-labels">
                    {card.labels.map(label => (
                        <span
                            key={label.id}
                            className="kanban-label"
                            style={{ backgroundColor: label.color }}
                        >
                            {label.name}
                        </span>
                    ))}
                </div>
            )}

            {/* Card title */}
            <div className="kanban-card-title">{card.title}</div>

            {/* Card meta */}
            <div className="kanban-card-meta">
                {card.due_date && (
                    <span className={`kanban-card-due ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : ''}`}>
                        <i className="pi pi-calendar" />
                        {new Date(card.due_date).toLocaleDateString(currentLanguage)}
                    </span>
                )}
                {/* Multiple assignees display */}
                {card.assignees && card.assignees.length > 0 && (
                    <div className="kanban-card-assignees">
                        {card.assignees.slice(0, 3).map((assignee) => (
                            <span
                                key={assignee.id}
                                className="kanban-assignee-avatar"
                                style={{
                                    background: assignee.color ? `linear-gradient(135deg, ${assignee.color}, ${adjustColor(assignee.color, -30)})` : undefined,
                                    color: assignee.color ? getContrastTextColor(assignee.color) : undefined,
                                }}
                                title={`${assignee.username || assignee.name || assignee.email}${assignee.kanban_role_short ? ` (${assignee.kanban_role_short})` : ''}`}
                            >
                                {assignee.initials || (assignee.username || assignee.name || '?').substring(0, 2).toUpperCase()}
                                {assignee.kanban_role_short && (
                                    <span
                                        className="kanban-role-badge"
                                        style={{ backgroundColor: assignee.kanban_role_color || '#6b7280' }}
                                    >
                                        {assignee.kanban_role_short}
                                    </span>
                                )}
                            </span>
                        ))}
                        {card.assignees.length > 3 && (
                            <span className="kanban-assignee-more">+{card.assignees.length - 3}</span>
                        )}
                    </div>
                )}
                {/* Fallback to old single assignee if no multiple assignees */}
                {(!card.assignees || card.assignees.length === 0) && card.assignee && (
                    <span className="kanban-card-assignee" title={card.assignee.name}>
                        <i className="pi pi-user" />
                        {card.assignee.name.split(' ')[0]}
                    </span>
                )}
            </div>

            {/* Card actions */}
            <div className="kanban-card-actions">
                {/* Assign/Unassign button */}
                {isAssigned ? (
                    <button
                        className="kanban-card-action unassign"
                        onClick={(e) => { e.stopPropagation(); onUnassignMe(); }}
                        title={t.kanbanboardpanel299_2}
                    >
                        <i className="pi pi-user-minus" />
                    </button>
                ) : (
                    <button
                        className="kanban-card-action assign"
                        onClick={(e) => { e.stopPropagation(); onAssignMe(); }}
                        title={t.kanbanboardpanel307}
                    >
                        <i className="pi pi-user-plus" />
                    </button>
                )}
                <button className="kanban-card-action" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                    <i className="pi pi-pencil" />
                </button>
                <button className="kanban-card-action delete" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                    <i className="pi pi-trash" />
                </button>
            </div>
        </div>
    );
}

// Card placeholder for drag overlay
function CardOverlay({ card }: { card: KanbanCard }) {
    return (
        <div className="kanban-card dragging">
            <div
                className="kanban-card-priority"
                style={{ backgroundColor: PRIORITY_COLORS[card.priority] }}
            />
            <div className="kanban-card-title">{card.title}</div>
        </div>
    );
}

// Droppable Column Container - makes the entire column area droppable
function DroppableColumn({ column, children }: { column: KanbanColumn; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `column-${column.id}`,
        data: {
            type: 'column',
            column,
        },
    });

    return (
        <div
            ref={setNodeRef}
            className={`kanban-column-cards ${isOver ? 'drag-over' : ''}`}
        >
            {children}
        </div>
    );
}

interface AccessStatus {
    has_access: boolean;
    access_type?: 'credits' | 'patron' | 'system';
    patron_level?: string;
    credits_paid?: number;
    granted_at?: string;
    expires_at?: string;
    days_remaining?: number;
    is_patron?: boolean;
    is_system?: boolean;
    is_expired?: boolean;
    can_renew?: boolean;
    unlock_cost?: number;
    user_credits?: number;
}

export default function KanbanBoardPanel({ isActive, projectId }: TabPanelProps) {
    const [currentLanguage] = useState<SupportedLanguage>(getStoredLanguage());
    const { t: t } = useTranslation(currentLanguage);
    const toast = useToast();
    const { selectedProject } = useProject();
    const { colors } = useTheme();
    const effectiveProjectId = projectId || selectedProject?.id;

    // Access Control State
    const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
    const [checkingAccess, setCheckingAccess] = useState(true);
    const [unlocking, setUnlocking] = useState(false);
    const [_unlockModalVisible, setUnlockModalVisible] = useState(false);

    // State
    const [board, setBoard] = useState<KanbanBoard | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);

    // Card Dialog State
    const [cardDialogVisible, setCardDialogVisible] = useState(false);
    const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
    const [cardForm, setCardForm] = useState({
        title: '',
        description: '',
        priority: 'medium',
        due_date: null as Date | null,
        assigned_to: null as number | null,
        label_ids: [] as number[],
    });
    const PRIORITY_OPTIONS = [
        { label: t.kanbanboardpanel158, value: 'low' },
        { label: t.kanbanboardpanel159, value: 'medium' },
        { label: t.kanbanboardpanel160, value: 'high' },
        { label: t.kanbanboardpanel161, value: 'urgent' },
    ];
    const [targetColumnId, setTargetColumnId] = useState<number | null>(null);

    // Column Dialog State
    const [columnDialogVisible, setColumnDialogVisible] = useState(false);
    const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
    const [columnForm, setColumnForm] = useState({
        name: '',
        color: '#3b82f6',
        wip_limit: null as number | null,
    });

    // Initials conflicts state
    const [initialsConflicts, setInitialsConflicts] = useState<Array<{ initials: string; users: string[] }>>([]);

    // Team members and roles state
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [availableRoles, setAvailableRoles] = useState<KanbanRole[]>([]);
    const [rolesDialogVisible, setRolesDialogVisible] = useState(false);
    const [projectOwnerId, setProjectOwnerId] = useState<number | null>(null);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Load board
    const loadBoard = useCallback(async () => {
        if (!effectiveProjectId) return;

        setLoading(true);
        try {
            const token = getAuthToken();
            const response = await fetch(`/api/kanban/project/${effectiveProjectId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setBoard(data.board);
                setProjectOwnerId(data.project?.owner_id || null);

                // Load team members to check for initials conflicts and get roles
                if (data.board?.id) {
                    const membersResponse = await fetch(`/api/kanban/board/${data.board.id}/team-members`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                        },
                    });
                    if (membersResponse.ok) {
                        const membersData = await membersResponse.json();
                        setInitialsConflicts(membersData.initials_conflicts || []);
                        setTeamMembers(membersData.members || []);
                        setAvailableRoles(membersData.available_roles || []);
                    }
                }
            } else {
                toast.showError(t.kanbanboardpanel469);
            }
        } catch (error) {
            console.error(t.kanbanboardpanel472, error);
            toast.showError(t.kanbanboardpanel473);
        } finally {
            setLoading(false);
        }
    }, [effectiveProjectId, toast]);

    // Check access
    const checkAccess = useCallback(async () => {
        try {
            setCheckingAccess(true);
            const token = getAuthToken();
            const response = await fetch('/api/kanban/access', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });
            if (response.ok) {
                const data = await response.json();
                setAccessStatus(data);
            } else {
                toast.showError(t.kanbanboardpanel494);
            }
        } catch (error) {
            console.error(t.kanbanboardpanel497, error);
            toast.showError(t.kanbanboardpanel498);
        } finally {
            setCheckingAccess(false);
        }
    }, [toast]);

    // Unlock feature with credits
    const unlockFeature = useCallback(async () => {
        try {
            setUnlocking(true);
            const token = getAuthToken();
            const response = await fetch('/api/kanban/unlock', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });
            const data = await response.json();
            if (data.success) {
                toast.showSuccess(data.message);
                setUnlockModalVisible(false);
                await checkAccess();
            } else {
                toast.showError(data.error || t.kanbanboardpanel523);
            }
        } catch (error) {
            console.error(t.kanbanboardpanel526, error);
            toast.showError(t.kanbanboardpanel527);
        } finally {
            setUnlocking(false);
        }
    }, [checkAccess, toast]);

    // Check access on mount
    useEffect(() => {
        if (isActive) {
            checkAccess();
        }
    }, [isActive, checkAccess]);

    // Load board when access granted
    useEffect(() => {
        if (isActive && effectiveProjectId && accessStatus?.has_access) {
            loadBoard();
        }
    }, [isActive, effectiveProjectId, accessStatus?.has_access, loadBoard]);

    // Drag handlers
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const cardId = parseInt(String(active.id).replace('card-', ''));
        const card = board?.columns.flatMap(c => c.cards).find(c => c.id === cardId);
        if (card) {
            setActiveCard(card);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveCard(null);

        if (!over || !board) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        if (!activeId.startsWith('card-')) return;

        const cardId = parseInt(activeId.replace('card-', ''));
        const card = board.columns.flatMap(c => c.cards).find(c => c.id === cardId);
        if (!card) return;

        let targetColumnId: number;
        let targetPosition: number;

        if (overId.startsWith('column-')) {
            // Dropped on empty column
            targetColumnId = parseInt(overId.replace('column-', ''));
            targetPosition = 0;
        } else if (overId.startsWith('card-')) {
            // Dropped on another card
            const overCardId = parseInt(overId.replace('card-', ''));
            const overCard = board.columns.flatMap(c => c.cards).find(c => c.id === overCardId);
            if (!overCard) return;
            targetColumnId = overCard.column_id;
            targetPosition = overCard.position;
        } else {
            return;
        }

        // Optimistic update
        const newBoard = { ...board };
        const sourceColumn = newBoard.columns.find(c => c.id === card.column_id);
        const targetColumn = newBoard.columns.find(c => c.id === targetColumnId);

        if (!sourceColumn || !targetColumn) return;

        // Remove from source
        sourceColumn.cards = sourceColumn.cards.filter(c => c.id !== cardId);

        // Add to target
        const updatedCard = { ...card, column_id: targetColumnId, position: targetPosition };
        targetColumn.cards.splice(targetPosition, 0, updatedCard);

        // Update positions
        targetColumn.cards.forEach((c, i) => c.position = i);
        if (sourceColumn.id !== targetColumnId) {
            sourceColumn.cards.forEach((c, i) => c.position = i);
        }

        setBoard(newBoard);

        // API call
        try {
            const token = getAuthToken();
            const response = await fetch(`/api/kanban/cards/${cardId}/move`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    column_id: targetColumnId,
                    position: targetPosition,
                }),
            });

            if (!response.ok) {
                // Revert on error
                loadBoard();
                toast.showError(t.kanbanboardpanel631);
            }
        } catch (_error) {
            loadBoard();
            toast.showError(t.kanbanboardpanel635);
        }
    };

    // Card CRUD
    const openNewCardDialog = (columnId: number) => {
        setEditingCard(null);
        setTargetColumnId(columnId);
        setCardForm({
            title: '',
            description: '',
            priority: 'medium',
            due_date: null,
            assigned_to: null,
            label_ids: [],
        });
        setCardDialogVisible(true);
    };

    const openEditCardDialog = (card: KanbanCard) => {
        setEditingCard(card);
        setTargetColumnId(card.column_id);
        setCardForm({
            title: card.title,
            description: card.description || '',
            priority: card.priority,
            due_date: card.due_date ? new Date(card.due_date) : null,
            assigned_to: card.assigned_to,
            label_ids: card.labels.map(l => l.id),
        });
        setCardDialogVisible(true);
    };

    const saveCard = async () => {
        if (!cardForm.title.trim()) {
            toast.showWarn(t.kanbanboardpanel670);
            return;
        }

        try {
            const token = getAuthToken();
            const url = editingCard
                ? `/api/kanban/cards/${editingCard.id}`
                : `/api/kanban/columns/${targetColumnId}/cards`;

            const response = await fetch(url, {
                method: editingCard ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    title: cardForm.title,
                    description: cardForm.description || null,
                    priority: cardForm.priority,
                    // Use local date format to avoid timezone shift (toISOString converts to UTC which can shift the date)
                    due_date: cardForm.due_date ? `${cardForm.due_date.getFullYear()}-${String(cardForm.due_date.getMonth() + 1).padStart(2, '0')}-${String(cardForm.due_date.getDate()).padStart(2, '0')}` : null,
                    assigned_to: cardForm.assigned_to,
                    label_ids: cardForm.label_ids,
                }),
            });

            if (response.ok) {
                toast.showSuccess(editingCard ? t.kanbanboardpanel699 : t.kanbanboardpanel699_2);
                setCardDialogVisible(false);
                loadBoard();
            } else {
                const data = await response.json();
                toast.showError(data.message || t.kanbanboardpanel704);
            }
        } catch (_error) {
            toast.showError(t.kanbanboardpanel707);
        }
    };

    const deleteCard = async (cardId: number) => {
        confirmDialog({
            group: 'kanban',
            message: t.kanbanboardpanel714,
            header: t.kanbanboardpanel715,
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    const token = getAuthToken();
                    const response = await fetch(`/api/kanban/cards/${cardId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                        },
                    });

                    if (response.ok) {
                        toast.showSuccess(t.kanbanboardpanel730);
                        loadBoard();
                    } else {
                        toast.showError(t.kanbanboardpanel733);
                    }
                } catch (_error) {
                    toast.showError(t.kanbanboardpanel736);
                }
            },
        });
    };

    // Get current user ID
    const getCurrentUserId = (): number | null => {
        // Try user_id first (from LoginPanel/LoginModal)
        const userId = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
        if (userId) {
            return parseInt(userId, 10);
        }

        // Fallback to user JSON object (from EmailVerification)
        const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userDataStr) {
            try {
                const userData = JSON.parse(userDataStr);
                return userData.id;
            } catch {
                return null;
            }
        }

        return null;
    };

    // Helper function to update card assignees in board state
    const updateCardInBoard = (cardId: number, newAssignees: Assignee[]) => {
        if (!board) return;

        setBoard(prevBoard => {
            if (!prevBoard) return prevBoard;

            return {
                ...prevBoard,
                columns: prevBoard.columns.map(column => ({
                    ...column,
                    cards: column.cards.map(card =>
                        card.id === cardId
                            ? { ...card, assignees: newAssignees }
                            : card
                    ),
                })),
            };
        });
    };

    // Assignee functions
    const assignMeToCard = async (cardId: number) => {
        const userId = getCurrentUserId();
        if (!userId) {
            toast.showError(t.kanbanboardpanel789);
            return;
        }

        try {
            const token = getAuthToken();
            const response = await fetch(`/api/kanban/cards/${cardId}/assign-me`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                toast.showSuccess(t.kanbanboardpanel806);
                // Update local state with returned card data
                if (data.card) {
                    updateCardInBoard(cardId, data.card.assignees || []);
                }
            } else {
                toast.showError(data.message || t.kanbanboardpanel812);
            }
        } catch (_error) {
            toast.showError(t.kanbanboardpanel815);
        }
    };

    const unassignMeFromCard = async (cardId: number) => {
        const userId = getCurrentUserId();
        if (!userId) {
            toast.showError(t.kanbanboardpanel822);
            return;
        }

        try {
            const token = getAuthToken();
            const response = await fetch(`/api/kanban/cards/${cardId}/unassign-me`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                toast.showSuccess(t.kanbanboardpanel839);
                // Update local state with returned card data
                if (data.card) {
                    updateCardInBoard(cardId, data.card.assignees || []);
                }
            } else {
                toast.showError(data.message || t.kanbanboardpanel845);
            }
        } catch (_error) {
            toast.showError(t.kanbanboardpanel848);
        }
    };

    // Check if current user is assigned to a card
    const isCurrentUserAssigned = (card: KanbanCard): boolean => {
        const userId = getCurrentUserId();
        if (!userId) {
            return false;
        }
        const assignees = card.assignees || [];
        // Use Number() for comparison to handle both string and number IDs
        const isAssigned = assignees.some(a => Number(a.id) === Number(userId));
        return isAssigned;
    };

    // Export board as PDF (opens print dialog)
    const exportAsPDF = () => {
        if (!board) return;

        const projectName = selectedProject?.name || 'Projekt';
        const today = new Date().toLocaleDateString(currentLanguage);

        // Build HTML content for print
        const columnsHtml = board.columns.map(column => {
            const cardsHtml = column.cards.map(card => {
                const priorityColor = PRIORITY_COLORS[card.priority] || '#6b7280';
                const labelsHtml = card.labels?.map(label =>
                    `<span style="background-color: ${label.color}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-right: 4px;">${label.name}</span>`
                ).join('') || '';

                const assigneesHtml = card.assignees?.map(a => {
                    const bgColor = a.color || '#3b82f6';
                    const textColor = getContrastTextColor(bgColor);
                    const initials = a.initials || (a.username || a.name || '?').substring(0, 2).toUpperCase();
                    const roleBadge = a.kanban_role_short
                        ? `<span style="background: ${a.kanban_role_color || '#6b7280'}; color: white; padding: 0 2px; border-radius: 2px; font-size: 7px; margin-left: 2px;">${a.kanban_role_short}</span>`
                        : '';
                    return `<span style="background: ${bgColor}; color: ${textColor}; padding: 1px 5px; border-radius: 10px; font-size: 9px; margin-right: 2px;">${initials}${roleBadge}</span>`;
                }).join('') || '';

                const dueDate = card.due_date ? new Date(card.due_date).toLocaleDateString(currentLanguage) : '';

                return `
                    <div style="background: white; border: 1px solid #e2e8f0; border-left: 4px solid ${priorityColor}; border-radius: 4px; padding: 8px; margin-bottom: 8px;">
                        ${labelsHtml ? `<div style="margin-bottom: 4px;">${labelsHtml}</div>` : ''}
                        <div style="font-weight: 500; font-size: 12px; margin-bottom: 4px;">${card.title}</div>
                        <div style="display: flex; gap: 8px; font-size: 10px; color: #64748b;">
                            ${dueDate ? `<span>📅 ${dueDate}</span>` : ''}
                            ${assigneesHtml ? `<span>${assigneesHtml}</span>` : ''}
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div style="flex: 0 0 200px; background: #f8fafc; border-radius: 6px; padding: 8px;">
                    <div style="font-weight: 600; font-size: 13px; padding: 6px; border-bottom: 3px solid ${column.color}; margin-bottom: 8px;">
                        ${column.name} <span style="color: #94a3b8; font-weight: normal;">(${column.cards.length})</span>
                    </div>
                    <div>${cardsHtml}</div>
                </div>
            `;
        }).join('');

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${t.kanbanboardpanel920}${projectName}</title>
                <style>
                    @page {
                        size: landscape;
                        margin: 15mm;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background: white;
                        color: #1e293b;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                        border-bottom: 2px solid #e2e8f0;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 20px;
                        color: #1e293b;
                    }
                    .header .meta {
                        font-size: 12px;
                        color: #64748b;
                    }
                    .board {
                        display: flex;
                        gap: 12px;
                        overflow-x: auto;
                    }
                    .legend {
                        margin-top: 20px;
                        padding-top: 10px;
                        border-top: 1px solid #e2e8f0;
                        font-size: 10px;
                        color: #64748b;
                    }
                    .legend-item {
                        display: inline-flex;
                        align-items: center;
                        margin-right: 15px;
                    }
                    .legend-color {
                        width: 12px;
                        height: 12px;
                        border-radius: 2px;
                        margin-right: 4px;
                    }
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📋 ${board.name} - ${projectName}</h1>
                    <div class="meta">${t.kanbanboardpanel981}${today}</div>
                </div>
                <div class="board">
                    ${columnsHtml}
                </div>
                <div class="legend">
                    <strong>${t.kanbanboardpanel987}</strong>
                    <span class="legend-item"><span class="legend-color" style="background: #6b7280;"></span>${t.kanbanboardpanel988}</span>
                    <span class="legend-item"><span class="legend-color" style="background: #3b82f6;"></span>${t.kanbanboardpanel989}</span>
                    <span class="legend-item"><span class="legend-color" style="background: #f59e0b;"></span>${t.kanbanboardpanel990}</span>
                    <span class="legend-item"><span class="legend-color" style="background: #ef4444;"></span>${t.kanbanboardpanel991}</span>
                </div>
            </body>
            </html>
        `;

        // Open print window
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            // Wait for content to load, then trigger print
            printWindow.onload = () => {
                printWindow.print();
            };
        } else {
            toast.showError(t.kanbanboardpanel1005);
        }
    };

    // Role Management
    const setUserRole = async (userId: number, role: string | null) => {
        if (!board) return;

        try {
            const token = getAuthToken();
            const response = await fetch(`/api/kanban/board/${board.id}/roles`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: userId, role }),
            });

            if (response.ok) {
                toast.showSuccess(role ? t.kanbanboardpanel1026 : t.kanbanboardpanel1026_2);
                // Reload board to get updated roles
                loadBoard();
            } else {
                const data = await response.json();
                toast.showError(data.message || t.kanbanboardpanel1031);
            }
        } catch (_error) {
            toast.showError(t.kanbanboardpanel1034);
        }
    };

    const isProjectOwner = (): boolean => {
        const userId = getCurrentUserId();
        return userId !== null && userId === projectOwnerId;
    };

    // Column CRUD
    const openNewColumnDialog = () => {
        setEditingColumn(null);
        setColumnForm({
            name: '',
            color: '#3b82f6',
            wip_limit: null,
        });
        setColumnDialogVisible(true);
    };

    const openEditColumnDialog = (column: KanbanColumn) => {
        setEditingColumn(column);
        setColumnForm({
            name: column.name,
            color: column.color,
            wip_limit: column.wip_limit,
        });
        setColumnDialogVisible(true);
    };

    const saveColumn = async () => {
        if (!columnForm.name.trim()) {
            toast.showWarn(t.kanbanboardpanel1066);
            return;
        }

        try {
            const token = getAuthToken();
            const url = editingColumn
                ? `/api/kanban/columns/${editingColumn.id}`
                : `/api/kanban/board/${board?.id}/columns`;

            const response = await fetch(url, {
                method: editingColumn ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(columnForm),
            });

            if (response.ok) {
                toast.showSuccess(editingColumn ? t.kanbanboardpanel1087 : t.kanbanboardpanel1087_2);
                setColumnDialogVisible(false);
                loadBoard();
            } else {
                const data = await response.json();
                toast.showError(data.message || t.kanbanboardpanel1092);
            }
        } catch (_error) {
            toast.showError(t.kanbanboardpanel1095);
        }
    };

    const deleteColumn = async (columnId: number) => {
        const column = board?.columns.find(c => c.id === columnId);
        if (column && column.cards.length > 0) {
            toast.showWarn(t.kanbanboardpanel1102);
            return;
        }

        confirmDialog({
            group: 'kanban',
            message: t.kanbanboardpanel1108,
            header: t.kanbanboardpanel1109,
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    const token = getAuthToken();
                    const response = await fetch(`/api/kanban/columns/${columnId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                        },
                    });

                    if (response.ok) {
                        toast.showSuccess(t.kanbanboardpanel1124);
                        loadBoard();
                    } else {
                        toast.showError(t.kanbanboardpanel1127);
                    }
                } catch (_error) {
                    toast.showError(t.kanbanboardpanel1130);
                }
            },
        });
    };

    // Toggle label selection
    const toggleLabel = (labelId: number) => {
        setCardForm(prev => ({
            ...prev,
            label_ids: prev.label_ids.includes(labelId)
                ? prev.label_ids.filter(id => id !== labelId)
                : [...prev.label_ids, labelId],
        }));
    };

    // Access check loading
    if (checkingAccess) {
        return (
            <div className="kanban-panel-loading" style={{ color: colors.textSecondary }}>
                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                <p>{t.kanbanboardpanel1152}</p>
            </div>
        );
    }

    // No access - show unlock screen
    if (!accessStatus?.has_access) {
        return (
            <div className="kanban-panel" style={{ backgroundColor: colors.bgPrimary }}>
                <div className="kanban-unlock-screen" style={{ background: `linear-gradient(180deg, ${colors.bgSecondary} 0%, ${colors.bgPrimary} 100%)` }}>
                    <div className="kanban-unlock-content">
                        <div className="kanban-unlock-icon">
                            <i className="pi pi-lock" style={{ fontSize: '4rem', color: colors.textMuted }} />
                        </div>
                        <h2 style={{ color: colors.textPrimary }}>{t.kanbanboardpanel1166}</h2>
                        <p className="kanban-unlock-description" style={{ color: colors.textSecondary }}>
                            {t.kanbanboardpanel1168}
                            {t.kanbanboardpanel1169}
                        </p>

                        <div className="kanban-unlock-features">
                            <div className="kanban-feature" style={{ color: colors.textSecondary }}>
                                <i className="pi pi-th-large" style={{ color: colors.accent }} />
                                <span>{t.kanbanboardpanel1175}</span>
                            </div>
                            <div className="kanban-feature" style={{ color: colors.textSecondary }}>
                                <i className="pi pi-tags" style={{ color: colors.accent }} />
                                <span>{t.kanbanboardpanel1179}</span>
                            </div>
                            <div className="kanban-feature" style={{ color: colors.textSecondary }}>
                                <i className="pi pi-calendar" style={{ color: colors.accent }} />
                                <span>{t.kanbanboardpanel1183}</span>
                            </div>
                            <div className="kanban-feature" style={{ color: colors.textSecondary }}>
                                <i className="pi pi-users" style={{ color: colors.accent }} />
                                <span>{t.kanbanboardpanel1187}</span>
                            </div>
                        </div>

                        <div className="kanban-unlock-price">
                            <span className="price-amount" style={{ color: colors.accent }}>{accessStatus?.unlock_cost || 50}</span>
                            <span className="price-label" style={{ color: colors.textSecondary }}>{t.kanbanboardpanel1193}</span>
                            <span className="price-duration" style={{ color: colors.textMuted }}>{t.kanbanboardpanel1194}</span>
                        </div>

                        <div className="kanban-unlock-credits" style={{ color: colors.textSecondary }}>
                            <span>{t.kanbanboardpanel1198}</span>
                            <strong style={{ color: colors.textPrimary }}>{accessStatus?.user_credits || 0}{t.kanbanboardpanel1199}</strong>
                        </div>

                        <Button
                            label={unlocking ? t.kanbanboardpanel1203 : t.kanbanboardpanel1203_2}
                            icon={unlocking ? 'pi pi-spin pi-spinner' : 'pi pi-unlock'}
                            className="p-button-lg kanban-unlock-button"
                            onClick={unlockFeature}
                            disabled={unlocking || (accessStatus?.user_credits || 0) < (accessStatus?.unlock_cost || 50)}
                        />

                        {(accessStatus?.user_credits || 0) < (accessStatus?.unlock_cost || 50) && (
                            <p className="kanban-unlock-notice" style={{ color: colors.warningText }}>
                                <i className="pi pi-info-circle" />
                                {t.kanbanboardpanel1213}{accessStatus?.unlock_cost || 50} Credits
                            </p>
                        )}
                    </div>
                </div>

                <style>{`
                    .kanban-unlock-screen {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100%;
                        padding: 2rem;
                    }
                    .kanban-unlock-content {
                        text-align: center;
                        max-width: 500px;
                    }
                    .kanban-unlock-icon {
                        margin-bottom: 1.5rem;
                    }
                    .kanban-unlock-content h2 {
                        font-size: 1.75rem;
                        margin-bottom: 1rem;
                    }
                    .kanban-unlock-description {
                        line-height: 1.6;
                        margin-bottom: 2rem;
                    }
                    .kanban-unlock-features {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 1rem;
                        margin-bottom: 2rem;
                    }
                    .kanban-feature {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        font-size: 0.9rem;
                    }
                    .kanban-unlock-price {
                        display: flex;
                        align-items: baseline;
                        justify-content: center;
                        gap: 0.25rem;
                        margin-bottom: 0.5rem;
                    }
                    .price-amount {
                        font-size: 3rem;
                        font-weight: 700;
                    }
                    .price-label {
                        font-size: 1.25rem;
                    }
                    .price-duration {
                        font-size: 1rem;
                    }
                    .kanban-unlock-credits {
                        margin-bottom: 1.5rem;
                    }
                    .kanban-unlock-button {
                        width: 100%;
                        margin-bottom: 1rem;
                    }
                    .kanban-unlock-notice {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                        font-size: 0.875rem;
                    }
                `}</style>
            </div>
        );
    }

    if (!effectiveProjectId) {
        return (
            <div className="kanban-panel-empty" style={{ backgroundColor: colors.bgPrimary, color: colors.textMuted }}>
                <i className="pi pi-inbox" style={{ fontSize: '3rem', color: colors.textMuted }} />
                <p>{t.kanbanboardpanel1294}</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="kanban-panel-loading" style={{ backgroundColor: colors.bgPrimary, color: colors.textSecondary }}>
                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                <p>{t.kanbanboardpanel1303}</p>
            </div>
        );
    }

    return (
        <div className="kanban-panel" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
            <ConfirmDialog group="kanban" />

            {/* Initials Conflict Warning */}
            {initialsConflicts.length > 0 && (
                <div className="kanban-conflict-warning" style={{ backgroundColor: colors.warningBg, borderColor: colors.warningBorder, color: colors.warningText }}>
                    <i className="pi pi-exclamation-triangle" />
                    <span>
                        <strong>{t.kanbanboardpanel1317}</strong>{t.kanbanboardpanel1317_2}{' '}
                        {initialsConflicts.map((c, i) => (
                            <span key={c.initials}>
                                {i > 0 && ', '}
                                <strong>{c.initials}</strong> ({c.users.join(', ')})
                            </span>
                        ))}
                        {t.kanbanboardpanel1324}
                    </span>
                </div>
            )}

            {/* Header */}
            <div className="kanban-header" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary }}>
                <div className="kanban-header-left">
                    <h2 style={{ color: colors.textPrimary }}>{board?.name || t.kanbanboardpanel1332}</h2>
                </div>
                <div className="kanban-header-right">
                    {isProjectOwner() && (
                        <Button
                            icon="pi pi-users"
                            label={t.kanbanboardpanel1338}
                            className="p-button-outlined p-button-sm p-button-help"
                            onClick={() => setRolesDialogVisible(true)}
                            tooltip={t.kanbanboardpanel1341}
                        />
                    )}
                    <Button
                        icon="pi pi-file-pdf"
                        label={t.kanbanboardpanel1346}
                        className="p-button-outlined p-button-sm p-button-secondary"
                        onClick={exportAsPDF}
                        tooltip={t.kanbanboardpanel1349}
                    />
                    <Button
                        icon="pi pi-plus"
                        label={t.kanbanboardpanel1353}
                        className="p-button-outlined p-button-sm"
                        onClick={openNewColumnDialog}
                    />
                    <Button
                        icon="pi pi-refresh"
                        className="p-button-text p-button-sm"
                        onClick={loadBoard}
                        tooltip={t.kanbanboardpanel1361}
                    />
                </div>
            </div>

            {/* Board */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="kanban-board">
                    {board?.columns.map(column => (
                        <div key={column.id} className="kanban-column">
                            {/* Column Header */}
                            <div
                                className="kanban-column-header"
                                style={{ borderTopColor: column.color }}
                            >
                                <div className="kanban-column-title">
                                    <span>{column.name}</span>
                                    <span className="kanban-column-count">{column.cards.length}</span>
                                    {column.wip_limit && (
                                        <span className={`kanban-column-wip ${column.cards.length >= column.wip_limit ? t.kanbanboardpanel1385 : ''}`}>
                                            / {column.wip_limit}
                                        </span>
                                    )}
                                </div>
                                <div className="kanban-column-actions">
                                    <button
                                        className="kanban-column-action"
                                        onClick={() => openNewCardDialog(column.id)}
                                        title={t.kanbanboardpanel1394}
                                    >
                                        <i className="pi pi-plus" />
                                    </button>
                                    <button
                                        className="kanban-column-action"
                                        onClick={() => openEditColumnDialog(column)}
                                        title={t.kanbanboardpanel1401}
                                    >
                                        <i className="pi pi-cog" />
                                    </button>
                                    <button
                                        className="kanban-column-action delete"
                                        onClick={() => deleteColumn(column.id)}
                                        title={t.kanbanboardpanel1408}
                                    >
                                        <i className="pi pi-trash" />
                                    </button>
                                </div>
                            </div>

                            {/* Column Cards */}
                            <DroppableColumn column={column}>
                                <SortableContext
                                    items={column.cards.map(c => `card-${c.id}`)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {column.cards.map(card => (
                                        <SortableCard
                                            key={card.id}
                                            card={card}
                                            onEdit={() => openEditCardDialog(card)}
                                            onDelete={() => deleteCard(card.id)}
                                            onAssignMe={() => assignMeToCard(card.id)}
                                            onUnassignMe={() => unassignMeFromCard(card.id)}
                                            isAssigned={isCurrentUserAssigned(card)}
                                            t={t}
                                            currentLanguage={currentLanguage}
                                        />
                                    ))}
                                </SortableContext>

                                {column.cards.length === 0 && (
                                    <div className="kanban-column-empty">
                                        {t.kanbanboardpanel1436}
                                    </div>
                                )}
                            </DroppableColumn>
                        </div>
                    ))}
                </div>

                <DragOverlay>
                    {activeCard ? <CardOverlay card={activeCard} /> : null}
                </DragOverlay>
            </DndContext>

            {/* Card Dialog */}
            <Dialog
                header={editingCard ? t.kanbanboardpanel1451 : t.kanbanboardpanel1451_2}
                visible={cardDialogVisible}
                onHide={() => setCardDialogVisible(false)}
                style={{ width: '500px' }}
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
                footer={
                    <div>
                        <Button
                            label={t.kanbanboardpanel1460}
                            icon="pi pi-times"
                            className="p-button-text"
                            onClick={() => setCardDialogVisible(false)}
                        />
                        <Button
                            label={t.kanbanboardpanel1466}
                            icon="pi pi-check"
                            onClick={saveCard}
                        />
                    </div>
                }
            >
                <div className="p-fluid">
                    <div className="field">
                        <label htmlFor="card-title">{t.kanbanboardpanel1476}</label>
                        <InputText
                            id="card-title"
                            value={cardForm.title}
                            onChange={(e) => setCardForm({ ...cardForm, title: e.target.value })}
                            placeholder={t.kanbanboardpanel1480}
                            autoFocus
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="card-description">{t.kanbanboardpanel1487}</label>
                        <InputTextarea
                            id="card-description"
                            value={cardForm.description}
                            onChange={(e) => setCardForm({ ...cardForm, description: e.target.value })}
                            rows={3}
                            placeholder={t.kanbanboardpanel1492}
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="card-priority">{t.kanbanboardpanel1498}</label>
                        <Dropdown
                            id="card-priority"
                            value={cardForm.priority}
                            options={PRIORITY_OPTIONS}
                            onChange={(e) => setCardForm({ ...cardForm, priority: e.value })}
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="card-due-date">{t.kanbanboardpanel1508}</label>
                        <Calendar
                            id="card-due-date"
                            value={cardForm.due_date}
                            onChange={(e) => {
                                // Handle PrimeReact Calendar value which can be Date, Date[], null, or undefined
                                const newDate = e.value instanceof Date ? e.value : (Array.isArray(e.value) ? e.value[0] : null);
                                setCardForm(prev => ({ ...prev, due_date: newDate || null }));
                            }}
                            dateFormat="dd.mm.yy"
                            showIcon
                            showButtonBar
                            readOnlyInput={false}
                        />
                    </div>

                    {board?.labels && board.labels.length > 0 && (
                        <div className="field">
                            <label>{t.kanbanboardpanel1525}</label>
                            <div className="kanban-label-picker">
                                {board.labels.map(label => (
                                    <button
                                        key={label.id}
                                        type="button"
                                        className={`kanban-label-option ${cardForm.label_ids.includes(label.id) ? t.kanbanboardpanel1534 : ''}`}
                                        style={{ backgroundColor: label.color }}
                                        onClick={() => toggleLabel(label.id)}
                                    >
                                        {label.name}
                                        {cardForm.label_ids.includes(label.id) && (
                                            <i className="pi pi-check" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>

            {/* Column Dialog */}
            <Dialog
                header={editingColumn ? t.kanbanboardpanel1550 : t.kanbanboardpanel1550_2}
                visible={columnDialogVisible}
                onHide={() => setColumnDialogVisible(false)}
                style={{ width: '400px' }}
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
                footer={
                    <div>
                        <Button
                            label={t.kanbanboardpanel1558}
                            icon="pi pi-times"
                            className="p-button-text"
                            onClick={() => setColumnDialogVisible(false)}
                        />
                        <Button
                            label={t.kanbanboardpanel1564}
                            icon="pi pi-check"
                            onClick={saveColumn}
                        />
                    </div>
                }
            >
                <div className="p-fluid">
                    <div className="field">
                        <label htmlFor="column-name">{t.kanbanboardpanel1574}</label>
                        <InputText
                            id="column-name"
                            value={columnForm.name}
                            onChange={(e) => setColumnForm({ ...columnForm, name: e.target.value })}
                            placeholder={t.kanbanboardpanel1578}
                            autoFocus
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="column-color">{t.kanbanboardpanel1585}</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                                type="color"
                                id="column-color"
                                value={columnForm.color}
                                onChange={(e) => setColumnForm({ ...columnForm, color: e.target.value })}
                                style={{ width: '50px', height: '35px', cursor: 'pointer' }}
                            />
                            <InputText
                                value={columnForm.color}
                                onChange={(e) => setColumnForm({ ...columnForm, color: e.target.value })}
                                style={{ width: '100px' }}
                            />
                        </div>
                    </div>

                    <div className="field">
                        <label htmlFor="column-wip">{t.kanbanboardpanel1602}</label>
                        <InputText
                            id="column-wip"
                            type="number"
                            value={columnForm.wip_limit?.toString() || ''}
                            onChange={(e) => setColumnForm({
                                ...columnForm,
                                wip_limit: e.target.value ? parseInt(e.target.value) : null
                            })}
                            placeholder={t.kanbanboardpanel1611}
                            min={1}
                        />
                        <small className="p-text-muted">{t.kanbanboardpanel1614}</small>
                    </div>
                </div>
            </Dialog>

            {/* Roles Management Dialog */}
            <Dialog
                header={t.kanbanboardpanel1621}
                visible={rolesDialogVisible}
                onHide={() => setRolesDialogVisible(false)}
                style={{ width: '550px' }}
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
                className="kanban-roles-dialog"
            >
                <div className="kanban-roles-info">
                    <p style={{ color: colors.textSecondary, marginBottom: '1rem', fontSize: '0.875rem' }}>
                        {t.kanbanboardpanel1631}
                    </p>
                </div>
                <div className="kanban-roles-list">
                    {teamMembers.map((member) => (
                        <div key={member.id} className="kanban-role-item" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary }}>
                            <div className="kanban-role-user">
                                <span
                                    className="kanban-role-avatar"
                                    style={{
                                        background: `linear-gradient(135deg, ${member.color}, ${adjustColor(member.color, -30)})`,
                                        color: getContrastTextColor(member.color),
                                    }}
                                >
                                    {member.initials}
                                </span>
                                <div className="kanban-role-user-info">
                                    <span className="kanban-role-username" style={{ color: colors.textPrimary }}>{member.username}</span>
                                    <span className="kanban-role-email" style={{ color: colors.textMuted }}>{member.email}</span>
                                </div>
                            </div>
                            <div className="kanban-role-select">
                                <Dropdown
                                    value={member.kanban_role || 'none'}
                                    options={[
                                        { label: t.kanbanboardpanel1656, value: 'none' },
                                        ...availableRoles.map(r => ({
                                            label: `${r.short} - ${r.label}`,
                                            value: r.value,
                                        })),
                                    ]}
                                    optionLabel="label"
                                    optionValue="value"
                                    onChange={(e) => {
                                        // Convert 'none' back to null for API
                                        const roleValue = e.value === 'none' ? null : e.value;
                                        setUserRole(member.id, roleValue);
                                    }}
                                    placeholder={t.kanbanboardpanel1669}
                                    style={{ width: '180px' }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="kanban-roles-legend" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: `1px solid ${colors.borderPrimary}` }}>
                    <p style={{ color: colors.textMuted, fontSize: '0.75rem', marginBottom: '0.5rem' }}>{t.kanbanboardpanel1677}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {availableRoles.map((role) => (
                            <div
                                key={role.value}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.25rem 0.5rem',
                                    backgroundColor: colors.bgSecondary,
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                }}
                            >
                                <span
                                    style={{
                                        backgroundColor: role.color,
                                        color: 'white',
                                        padding: '0 4px',
                                        borderRadius: '3px',
                                        fontWeight: 'bold',
                                        fontSize: '0.65rem',
                                    }}
                                >
                                    {role.short}
                                </span>
                                <span style={{ color: colors.textSecondary }}>{role.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Dialog>

            <style>{`
                .kanban-panel {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background-color: var(--theme-bg-primary);
                    color: var(--theme-text-primary);
                }

                .kanban-panel-empty,
                .kanban-panel-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    gap: 1rem;
                    color: var(--theme-text-muted);
                }

                .kanban-conflict-warning {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    background-color: var(--theme-warning-bg);
                    border-bottom: 1px solid var(--theme-warning-border);
                    color: var(--theme-warning-text);
                    font-size: 0.875rem;
                }

                .kanban-conflict-warning i {
                    font-size: 1.25rem;
                }

                .kanban-conflict-warning strong {
                    color: var(--theme-warning-text);
                }

                .kanban-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    border-bottom: 1px solid var(--theme-border-primary);
                    background-color: var(--theme-bg-secondary);
                }

                .kanban-header h2 {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--theme-text-primary);
                }

                .kanban-header-right {
                    display: flex;
                    gap: 0.5rem;
                }

                .kanban-board {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem;
                    overflow-x: auto;
                    flex: 1;
                    align-items: flex-start;
                }

                .kanban-column {
                    flex: 0 0 280px;
                    min-width: 280px;
                    background-color: var(--theme-bg-secondary);
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    max-height: calc(100vh - 200px);
                }

                .kanban-column-header {
                    padding: 0.75rem 1rem;
                    border-top: 3px solid var(--theme-accent);
                    border-radius: 8px 8px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background-color: var(--theme-bg-tertiary);
                }

                .kanban-column-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                    color: var(--theme-text-primary);
                }

                .kanban-column-count {
                    background-color: var(--theme-bg-hover);
                    color: var(--theme-text-muted);
                    padding: 0.125rem 0.5rem;
                    border-radius: 10px;
                    font-size: 0.75rem;
                }

                .kanban-column-wip {
                    color: var(--theme-text-muted);
                    font-size: 0.75rem;
                }

                .kanban-column-wip.limit-reached {
                    color: var(--theme-error-text);
                }

                .kanban-column-actions {
                    display: flex;
                    gap: 0.25rem;
                }

                .kanban-column-action {
                    background: none;
                    border: none;
                    color: var(--theme-text-muted);
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 4px;
                    transition: all 0.2s;
                }

                .kanban-column-action:hover {
                    background-color: var(--theme-bg-hover);
                    color: var(--theme-text-primary);
                }

                .kanban-column-action.delete:hover {
                    background-color: var(--theme-button-danger);
                    color: white;
                }

                .kanban-column-cards {
                    padding: 0.5rem;
                    overflow-y: auto;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    min-height: 100px;
                    transition: all 0.2s ease;
                }

                .kanban-column-cards.drag-over {
                    background-color: var(--theme-accent-transparent);
                    border: 2px dashed var(--theme-accent);
                    border-radius: 8px;
                }

                .kanban-column-empty {
                    padding: 2rem 1rem;
                    text-align: center;
                    color: var(--theme-text-muted);
                    border: 2px dashed var(--theme-border-primary);
                    border-radius: 8px;
                    font-size: 0.875rem;
                }

                .kanban-card {
                    background-color: var(--theme-bg-primary);
                    border: 1px solid var(--theme-border-primary);
                    border-radius: 6px;
                    padding: 0.75rem;
                    cursor: grab;
                    position: relative;
                    transition: all 0.2s;
                }

                .kanban-card:hover {
                    border-color: var(--theme-accent);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }

                .kanban-card.dragging {
                    opacity: 0.9;
                    transform: rotate(3deg);
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
                }

                .kanban-card-priority {
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    border-radius: 6px 0 0 6px;
                }

                .kanban-card-labels {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.25rem;
                    margin-bottom: 0.5rem;
                    padding-left: 0.5rem;
                }

                .kanban-label {
                    padding: 0.125rem 0.5rem;
                    border-radius: 3px;
                    font-size: 0.625rem;
                    font-weight: 600;
                    color: white;
                    text-transform: uppercase;
                }

                .kanban-card-title {
                    font-size: 0.875rem;
                    font-weight: 500;
                    padding-left: 0.5rem;
                    margin-bottom: 0.5rem;
                    word-break: break-word;
                }

                .kanban-card-title {
                    color: var(--theme-text-primary);
                }

                .kanban-card-meta {
                    display: flex;
                    gap: 0.75rem;
                    padding-left: 0.5rem;
                    font-size: 0.75rem;
                    color: var(--theme-text-muted);
                }

                .kanban-card-meta i {
                    margin-right: 0.25rem;
                }

                .kanban-card-due.overdue {
                    color: var(--theme-error-text);
                }

                .kanban-card-due.due-soon {
                    color: var(--theme-warning-text);
                }

                .kanban-card-actions {
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    display: none;
                    gap: 0.25rem;
                }

                .kanban-card:hover .kanban-card-actions {
                    display: flex;
                }

                .kanban-card-action {
                    background: none;
                    border: none;
                    color: var(--theme-text-muted);
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    transition: all 0.2s;
                }

                .kanban-card-action:hover {
                    background-color: var(--theme-bg-hover);
                    color: var(--theme-text-primary);
                }

                .kanban-card-action.delete:hover {
                    background-color: var(--theme-button-danger);
                    color: white;
                }

                .kanban-card-action.assign {
                    color: var(--theme-success-text);
                }

                .kanban-card-action.assign:hover {
                    background-color: var(--theme-button-success);
                    color: white;
                }

                .kanban-card-action.unassign {
                    color: var(--theme-warning-text);
                }

                .kanban-card-action.unassign:hover {
                    background-color: var(--theme-warning-border);
                    color: white;
                }

                /* Multiple assignees display */
                .kanban-card-assignees {
                    display: flex;
                    align-items: center;
                    gap: -4px;
                }

                .kanban-assignee-avatar {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--theme-accent), #8b5cf6);
                    color: white;
                    font-size: 0.5rem;
                    font-weight: 700;
                    border: 2px solid var(--theme-bg-secondary);
                    margin-left: -6px;
                    cursor: default;
                }

                .kanban-assignee-avatar:first-child {
                    margin-left: 0;
                }

                .kanban-assignee-more {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background-color: var(--theme-bg-hover);
                    color: white;
                    font-size: 0.5rem;
                    font-weight: 700;
                    border: 2px solid var(--theme-bg-secondary);
                    margin-left: -6px;
                }

                .kanban-label-picker {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .kanban-label-option {
                    padding: 0.375rem 0.75rem;
                    border-radius: 4px;
                    border: 2px solid transparent;
                    color: white;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.2s;
                }

                .kanban-label-option:hover {
                    opacity: 0.9;
                }

                .kanban-label-option.selected {
                    border-color: white;
                }

                .kanban-label-option i {
                    font-size: 0.625rem;
                }

                /* Dialog styling */
                .field {
                    margin-bottom: 1rem;
                }

                .field label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    color: var(--theme-text-secondary);
                }

                .p-text-muted {
                    color: var(--theme-text-muted);
                    font-size: 0.75rem;
                }

                /* Roles Dialog */
                .kanban-roles-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .kanban-role-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.75rem;
                    background-color: var(--theme-bg-secondary);
                    border-radius: 6px;
                    border: 1px solid var(--theme-border-primary);
                }

                .kanban-role-user {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .kanban-role-avatar {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    font-size: 0.75rem;
                    font-weight: 700;
                }

                .kanban-role-user-info {
                    display: flex;
                    flex-direction: column;
                }

                .kanban-role-username {
                    font-weight: 500;
                    color: var(--theme-text-primary);
                }

                .kanban-role-email {
                    font-size: 0.75rem;
                    color: var(--theme-text-muted);
                }

                /* Role badge on assignee avatar */
                .kanban-assignee-avatar {
                    position: relative;
                }

                .kanban-role-badge {
                    position: absolute;
                    bottom: -2px;
                    right: -2px;
                    padding: 0 3px;
                    font-size: 0.45rem;
                    font-weight: 700;
                    border-radius: 2px;
                    color: white;
                    line-height: 1.2;
                    border: 1px solid var(--theme-bg-secondary);
                }
            `}</style>
        </div>
    );
}
