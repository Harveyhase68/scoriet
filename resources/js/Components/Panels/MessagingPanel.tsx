import React, { useRef, useState, useEffect, useCallback } from 'react';
import { TabContentProps } from '@/types';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Badge } from 'primereact/badge';
import { Toolbar } from 'primereact/toolbar';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Toast } from 'primereact/toast';
// TabView and TabPanel are available but not currently used
// import { TabView, TabPanel } from 'primereact/tabview';
import { Dropdown } from 'primereact/dropdown';
import { AutoComplete } from 'primereact/autocomplete';
import { SelectButton } from 'primereact/selectbutton';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

const TabContent: React.FC<TabContentProps> = ({ children, style = {}, ...rest }) => {
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
      className="bg-gray-800 text-gray-100"
    >
      {children}
    </div>
  );
};

interface User {
  id: number;
  name: string;
  username?: string;
  email?: string;
  context?: string[];
  context_display?: string;
}

interface Message {
  id: number;
  sender_id: number;
  body: string;
  created_at: string;
  sender: User;
  attachments?: any[];
}

interface Thread {
  id: number;
  subject: string;
  is_broadcast: boolean;
  created_at: string;
  updated_at: string;
  latest_message?: Message;
  other_participants?: User[];
  has_unread?: boolean;
  messages?: Message[];
}

interface MessagingPanelProps {
  updateTabTitle?: (newTitle: string) => void;
  initialThreadId?: number;
}

export default function MessagingPanel({ updateTabTitle: _updateTabTitle, initialThreadId }: MessagingPanelProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t: _t } = useTranslation(currentLanguage);

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [_activeTabIndex, _setActiveTabIndex] = useState(0);

  // Compose modal states
  const [composeVisible, setComposeVisible] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeRecipient, setComposeRecipient] = useState<User | null>(null);
  const [userSuggestions, setUserSuggestions] = useState<User[]>([]);
  const [sending, setSending] = useState(false);

  // Recipient type: 'individual' | 'project' | 'team' | 'broadcast'
  const [recipientType, setRecipientType] = useState<'individual' | 'project' | 'team' | 'broadcast'>('individual');
  const [recipientOptions, setRecipientOptions] = useState<{
    projects: Array<{ id: number; name: string; member_count: number; is_owner: boolean }>;
    teams: Array<{ id: number; name: string; project_name?: string; member_count: number; is_owner: boolean }>;
    can_broadcast: boolean;
  }>({ projects: [], teams: [], can_broadcast: false });
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

  // Reply state
  const [replyBody, setReplyBody] = useState('');
  const [replying, setReplying] = useState(false);

  // Attachment state (for replies)
  const [hasAttachmentAccess, setHasAttachmentAccess] = useState(false);
  const [attachmentAccessStatus, setAttachmentAccessStatus] = useState<{
    has_access: boolean;
    is_patron: boolean;
    is_system?: boolean;
    subscription_ends_at?: string;
    user_credits?: number;
  } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [_showAttachmentDialog, _setShowAttachmentDialog] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compose attachment state (for new messages)
  const [composeFiles, setComposeFiles] = useState<File[]>([]);
  const composeFileInputRef = useRef<HTMLInputElement>(null);

  // Pagination state for messages
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [oldestLoadedId, setOldestLoadedId] = useState<number | null>(null);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);

  // Track if initial load has happened (to prevent auto-selecting thread on every refresh)
  const hasInitiallyLoaded = useRef(false);

  // Ref for messages container (for auto-scroll)
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const _shouldScrollToBottom = useRef(true);
  const isUserAtBottom = useRef(true); // Track if user is at the bottom of the messages

  const toast = useRef<Toast>(null);

  const loadThreads = useCallback(async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Nicht authentifiziert');
      }

      const response = await fetch('/api/messages/threads', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Nachrichten');
      }

      const data = await response.json();
      setThreads(data.threads || []);

      // Only select initial thread on FIRST load (not on refreshes)
      if (!hasInitiallyLoaded.current && initialThreadId && data.threads) {
        const thread = data.threads.find((t: Thread) => t.id === initialThreadId);
        if (thread) {
          setSelectedThread(thread);
          loadThreadDetails(thread.id);
        }
        hasInitiallyLoaded.current = true;
      } else if (!hasInitiallyLoaded.current) {
        hasInitiallyLoaded.current = true;
      }
    } catch (err: any) {
      if (!silent) {
        toast.current?.show({
          severity: 'error',
          summary: 'Fehler',
          detail: err.message || 'Fehler beim Laden',
          life: 3000,
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [initialThreadId]);

  // Load thread details - defined as useCallback so it can be used in effects
  const loadThreadDetails = useCallback(async (threadId: number, isRefresh: boolean = false) => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`/api/messages/threads/${threadId}?limit=15`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedThread(data.thread);
        setHasMoreOlder(data.has_more_older || false);
        setOldestLoadedId(data.oldest_loaded_id || null);
        setTotalMessages(data.total_messages || 0);

        // Auto-scroll to bottom:
        // - Always when opening a new thread (not refresh)
        // - On refresh: only if user was already at the bottom (so new messages are visible)
        const shouldScroll = !isRefresh || isUserAtBottom.current;
        if (shouldScroll) {
          setTimeout(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
          }, 100);
        }

        // Trigger unread count refresh
        window.dispatchEvent(new CustomEvent('messagesUpdated'));
      }
    } catch {
      // Error loading thread details
    }
  }, []);

  // Load more older messages (infinite scroll up)
  const loadMoreMessages = useCallback(async () => {
    if (!selectedThread || !hasMoreOlder || loadingMoreMessages || !oldestLoadedId) return;

    try {
      setLoadingMoreMessages(true);
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      // Remember scroll position before loading
      const container = messagesContainerRef.current;
      const scrollHeightBefore = container?.scrollHeight || 0;

      const response = await fetch(`/api/messages/threads/${selectedThread.id}?limit=10&before_id=${oldestLoadedId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const olderMessages = data.thread.messages || [];

        if (olderMessages.length > 0) {
          // Prepend older messages to existing messages
          setSelectedThread(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: [...olderMessages, ...(prev.messages || [])],
            };
          });
          setHasMoreOlder(data.has_more_older || false);
          setOldestLoadedId(data.oldest_loaded_id || null);

          // Maintain scroll position after loading older messages
          setTimeout(() => {
            if (container) {
              const scrollHeightAfter = container.scrollHeight;
              container.scrollTop = scrollHeightAfter - scrollHeightBefore;
            }
          }, 50);
        }
      }
    } catch {
      // Error loading more messages
    } finally {
      setLoadingMoreMessages(false);
    }
  }, [selectedThread, hasMoreOlder, loadingMoreMessages, oldestLoadedId]);

  // Handle scroll event for infinite scroll up and tracking if user is at bottom
  const handleMessagesScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;

    // Load more when scrolled near the top (within 50px)
    if (target.scrollTop < 50 && hasMoreOlder && !loadingMoreMessages) {
      loadMoreMessages();
    }

    // Track if user is at the bottom (within 30px of bottom)
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 30;
    isUserAtBottom.current = isAtBottom;
  }, [hasMoreOlder, loadingMoreMessages, loadMoreMessages]);

  useEffect(() => {
    loadThreads();
    loadAttachmentAccess(); // Load attachment access status on mount
  }, [loadThreads]);

  // Auto-refresh threads every 5 seconds while panel is open (silent mode - no loading spinner)
  // Only refreshes the thread LIST - does NOT change the selected thread (non-intrusive)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      loadThreads(true); // silent refresh thread list only
      // Also refresh the currently selected thread to show new messages in the conversation
      if (selectedThread) {
        loadThreadDetails(selectedThread.id, true); // isRefresh = true, don't scroll
      }
    }, 5000);

    return () => clearInterval(refreshInterval);
  }, [loadThreads, selectedThread, loadThreadDetails]);

  // Listen for openMessaging event - when user clicks notification, jump to the unread thread
  useEffect(() => {
    const handleOpenMessaging = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const threadId = customEvent.detail?.threadId;

      // Refresh the thread list first
      await loadThreads(true);

      // If a specific thread ID was provided (from notification click), select that thread
      if (threadId) {
        // This will load the thread details AND set it as selectedThread
        loadThreadDetails(threadId);
      }
      // Note: If no threadId provided and panel was already open, we just refresh the list
      // The user stays in their current conversation (non-intrusive)
    };

    window.addEventListener('openMessaging', handleOpenMessaging);
    return () => window.removeEventListener('openMessaging', handleOpenMessaging);
  }, [loadThreads, loadThreadDetails]);

  const handleThreadSelect = (thread: Thread) => {
    setSelectedThread(thread);
    loadThreadDetails(thread.id);
  };

  const handleDeleteThread = async (thread: Thread) => {
    confirmDialog({
      message: 'Möchten Sie diese Konversation wirklich löschen?',
      header: 'Konversation löschen',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
          if (!token) return;

          const response = await fetch(`/api/messages/threads/${thread.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            toast.current?.show({
              severity: 'success',
              summary: 'Erfolg',
              detail: 'Konversation gelöscht',
              life: 3000,
            });
            if (selectedThread?.id === thread.id) {
              setSelectedThread(null);
            }
            loadThreads();
            window.dispatchEvent(new CustomEvent('messagesUpdated'));
          }
        } catch {
          toast.current?.show({
            severity: 'error',
            summary: 'Fehler',
            detail: 'Konversation konnte nicht gelöscht werden',
            life: 3000,
          });
        }
      },
    });
  };

  const loadRecipientOptions = async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/messages/recipient-options', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecipientOptions({
          projects: data.projects || [],
          teams: data.teams || [],
          can_broadcast: data.can_broadcast || false,
        });
      }
    } catch {
      // Error loading recipient options
    }
  };

  // Load attachment access status
  const loadAttachmentAccess = async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/messages/attachments/access', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAttachmentAccessStatus(data.status);
        setHasAttachmentAccess(data.status?.has_access || false);
      }
    } catch {
      // Error loading attachment access
    }
  };

  // Unlock attachments with credits
  const handleUnlockAttachments = async () => {
    try {
      setUnlocking(true);
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/messages/attachments/unlock', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setHasAttachmentAccess(true);
        setAttachmentAccessStatus(data.status);
        setShowUnlockDialog(false);
        setShowAttachmentDialog(true);
        toast.current?.show({
          severity: 'success',
          summary: 'Freigeschaltet!',
          detail: 'Nachrichten-Anhänge wurden freigeschaltet',
          life: 3000,
        });
        // Trigger credits refresh
        window.dispatchEvent(new CustomEvent('creditsUpdated'));
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Fehler',
          detail: data.message || 'Freischaltung fehlgeschlagen',
          life: 3000,
        });
      }
    } catch (_err) {
      toast.current?.show({
        severity: 'error',
        summary: 'Fehler',
        detail: 'Freischaltung fehlgeschlagen',
        life: 3000,
      });
    } finally {
      setUnlocking(false);
    }
  };

  // Handle attachment button click
  const handleAttachmentClick = () => {
    if (hasAttachmentAccess) {
      // User has access - show file picker
      fileInputRef.current?.click();
    } else {
      // User needs to unlock - show unlock dialog
      setShowUnlockDialog(true);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove selected file
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Download attachment with authentication
  const handleDownloadAttachment = async (attachmentId: number, filename: string) => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        toast.current?.show({
          severity: 'error',
          summary: 'Fehler',
          detail: 'Nicht authentifiziert',
          life: 3000,
        });
        return;
      }

      const response = await fetch(`/api/messages/attachments/${attachmentId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Download fehlgeschlagen');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Fehler',
        detail: err.message || 'Download fehlgeschlagen',
        life: 3000,
      });
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUserSuggestions([]);
      return;
    }

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`/api/messages/users?search=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserSuggestions(data.users || []);
      }
    } catch {
      // Error searching users
    }
  };

  const openComposeModal = () => {
    setComposeVisible(true);
    setRecipientType('individual');
    setComposeSubject('');
    setComposeBody('');
    setComposeRecipient(null);
    setSelectedProject(null);
    setSelectedTeam(null);
    setComposeFiles([]); // Reset compose attachments
    loadRecipientOptions();
  };

  // Handle compose attachment button click
  const handleComposeAttachmentClick = () => {
    if (hasAttachmentAccess) {
      composeFileInputRef.current?.click();
    } else {
      setShowUnlockDialog(true);
    }
  };

  // Handle compose file selection
  const handleComposeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setComposeFiles(prev => [...prev, ...newFiles]);
    }
    if (composeFileInputRef.current) {
      composeFileInputRef.current.value = '';
    }
  };

  // Remove compose file
  const removeComposeFile = (index: number) => {
    setComposeFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    // Validate based on recipient type
    if (recipientType === 'individual' && !composeRecipient) {
      toast.current?.show({ severity: 'warn', summary: 'Hinweis', detail: 'Bitte wählen Sie einen Empfänger', life: 3000 });
      return;
    }
    if (recipientType === 'project' && !selectedProject) {
      toast.current?.show({ severity: 'warn', summary: 'Hinweis', detail: 'Bitte wählen Sie ein Projekt', life: 3000 });
      return;
    }
    if (recipientType === 'team' && !selectedTeam) {
      toast.current?.show({ severity: 'warn', summary: 'Hinweis', detail: 'Bitte wählen Sie ein Team', life: 3000 });
      return;
    }
    if (!composeSubject.trim() || !composeBody.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Hinweis', detail: 'Bitte füllen Sie alle Felder aus', life: 3000 });
      return;
    }

    try {
      setSending(true);
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      let endpoint = '/api/messages/threads';
      let response;

      // Use FormData if there are attachments and user has access
      if (composeFiles.length > 0 && hasAttachmentAccess) {
        const formData = new FormData();
        formData.append('subject', composeSubject);
        formData.append('body', composeBody);

        if (recipientType === 'individual') {
          formData.append('recipient_ids[0]', composeRecipient!.id.toString());
        } else if (recipientType === 'project') {
          endpoint = '/api/messages/send-to-project';
          formData.append('project_id', selectedProject!.toString());
        } else if (recipientType === 'team') {
          endpoint = '/api/messages/send-to-team';
          formData.append('team_id', selectedTeam!.toString());
        } else if (recipientType === 'broadcast') {
          endpoint = '/api/messages/broadcast';
        }

        composeFiles.forEach((file, index) => {
          formData.append(`attachments[${index}]`, file);
        });

        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: formData,
        });
      } else {
        // Standard JSON request without attachments
        const body: any = { subject: composeSubject, body: composeBody };

        if (recipientType === 'individual') {
          body.recipient_ids = [composeRecipient!.id];
        } else if (recipientType === 'project') {
          endpoint = '/api/messages/send-to-project';
          body.project_id = selectedProject;
        } else if (recipientType === 'team') {
          endpoint = '/api/messages/send-to-team';
          body.team_id = selectedTeam;
        } else if (recipientType === 'broadcast') {
          endpoint = '/api/messages/broadcast';
        }

        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      }

      if (response.ok) {
        const data = await response.json();
        toast.current?.show({
          severity: 'success',
          summary: 'Erfolg',
          detail: data.message || 'Nachricht gesendet',
          life: 3000,
        });
        setComposeVisible(false);
        setComposeSubject('');
        setComposeBody('');
        setComposeRecipient(null);
        setSelectedProject(null);
        setSelectedTeam(null);
        setComposeFiles([]); // Clear compose attachments
        loadThreads();
        if (data.thread) {
          setSelectedThread(data.thread);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Senden');
      }
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Fehler',
        detail: err.message || 'Nachricht konnte nicht gesendet werden',
        life: 3000,
      });
    } finally {
      setSending(false);
    }
  };

  const handleReply = async () => {
    if (!selectedThread || !replyBody.trim()) {
      return;
    }

    try {
      setReplying(true);
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      // Use FormData if there are attachments
      let response;
      if (selectedFiles.length > 0 && hasAttachmentAccess) {
        const formData = new FormData();
        formData.append('body', replyBody);
        selectedFiles.forEach((file, index) => {
          formData.append(`attachments[${index}]`, file);
        });

        response = await fetch(`/api/messages/threads/${selectedThread.id}/reply`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: formData,
        });
      } else {
        response = await fetch(`/api/messages/threads/${selectedThread.id}/reply`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            body: replyBody,
          }),
        });
      }

      if (response.ok) {
        setReplyBody('');
        setSelectedFiles([]); // Clear selected files
        loadThreadDetails(selectedThread.id); // Will auto-scroll to bottom
        loadThreads(true);
      } else {
        throw new Error('Fehler beim Senden der Antwort');
      }
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Fehler',
        detail: err.message || 'Antwort konnte nicht gesendet werden',
        life: 3000,
      });
    } finally {
      setReplying(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Gestern';
    } else if (days < 7) {
      return date.toLocaleDateString('de-DE', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
  };

  // Column templates
  const subjectTemplate = (rowData: Thread) => {
    return (
      <div className="flex items-center gap-2">
        {rowData.is_broadcast && (
          <Badge value="System" severity="danger" className="text-xs" />
        )}
        {rowData.has_unread && (
          <i className="pi pi-circle-fill text-blue-400 text-xs" />
        )}
        <span className={rowData.has_unread ? 'font-bold' : ''}>{rowData.subject}</span>
      </div>
    );
  };

  const participantsTemplate = (rowData: Thread) => {
    const participants = rowData.other_participants || [];
    if (participants.length === 0) return '-';
    if (participants.length === 1) {
      return participants[0].name || participants[0].username || '-';
    }
    return `${participants[0].name || participants[0].username} +${participants.length - 1}`;
  };

  const dateTemplate = (rowData: Thread) => {
    const date = rowData.latest_message?.created_at || rowData.updated_at;
    return formatDate(date);
  };

  const actionsTemplate = (rowData: Thread) => {
    return (
      <div className="flex gap-1">
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-sm p-button-danger"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteThread(rowData);
          }}
          tooltip="Löschen"
        />
      </div>
    );
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Suchen..."
            className="w-full"
          />
        </span>
      </div>
    );
  };

  const leftToolbarTemplate = () => {
    return (
      <div className="flex gap-2">
        <Button
          label="Neue Nachricht"
          icon="pi pi-plus"
          className="p-button-sm p-button-success"
          onClick={openComposeModal}
        />
        <Button
          label="Aktualisieren"
          icon="pi pi-refresh"
          className="p-button-sm p-button-secondary"
          onClick={() => loadThreads()}
        />
      </div>
    );
  };

  return (
    <TabContent>
      <Toast ref={toast} />
      <ConfirmDialog />

      <Card className="h-full overflow-hidden">
        <Toolbar className="mb-3" left={leftToolbarTemplate} />

        <Splitter style={{ height: 'calc(100vh - 250px)' }} className="mb-3">
          {/* Thread List */}
          <SplitterPanel size={40} minSize={30}>
            <DataTable
              value={threads}
              loading={loading}
              selectionMode="single"
              selection={selectedThread}
              onSelectionChange={(e) => handleThreadSelect(e.value as Thread)}
              dataKey="id"
              globalFilter={globalFilter}
              header={renderHeader()}
              emptyMessage="Keine Nachrichten"
              scrollable
              scrollHeight="flex"
              className="text-sm"
              rowClassName={(data) => data.has_unread ? 'bg-blue-900/20' : ''}
            >
              <Column field="subject" header="Betreff" body={subjectTemplate} sortable style={{ minWidth: '200px' }} />
              <Column header="Von/An" body={participantsTemplate} style={{ minWidth: '120px' }} />
              <Column header="Datum" body={dateTemplate} sortable style={{ width: '80px' }} />
              <Column body={actionsTemplate} style={{ width: '60px' }} />
            </DataTable>
          </SplitterPanel>

          {/* Message View */}
          <SplitterPanel size={60} minSize={40}>
            {selectedThread ? (
              <div className="flex flex-col h-full p-3">
                {/* Thread Header */}
                <div className="border-b border-gray-600 pb-3 mb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {selectedThread.is_broadcast && (
                      <Badge value="System" severity="danger" />
                    )}
                    {selectedThread.subject}
                  </h3>
                  <div className="text-sm text-gray-400">
                    Mit: {selectedThread.other_participants?.map(p => p.name || p.username).join(', ') || '-'}
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleMessagesScroll}
                  className="flex-1 overflow-auto mb-3 space-y-3"
                >
                  {/* Load more indicator */}
                  {hasMoreOlder && (
                    <div className="text-center py-2">
                      {loadingMoreMessages ? (
                        <span className="text-gray-400 text-sm">
                          <i className="pi pi-spin pi-spinner mr-2" />
                          Lade ältere Nachrichten...
                        </span>
                      ) : (
                        <button
                          onClick={loadMoreMessages}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          <i className="pi pi-arrow-up mr-1" />
                          Ältere Nachrichten laden ({totalMessages - (selectedThread.messages?.length || 0)} weitere)
                        </button>
                      )}
                    </div>
                  )}
                  {selectedThread.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.sender_id === parseInt(localStorage.getItem('user_id') || '0')
                          ? 'bg-blue-900/30 ml-8'
                          : 'bg-gray-700/50 mr-8'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm">
                          {msg.sender?.name || msg.sender?.username || 'Unbekannt'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{msg.body}</div>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {msg.attachments.map((att: any) => (
                            <button
                              key={att.id}
                              onClick={() => handleDownloadAttachment(att.id, att.original_filename)}
                              className="flex items-center gap-1 text-xs bg-gray-600 px-2 py-1 rounded hover:bg-gray-500 cursor-pointer"
                            >
                              <i className="pi pi-download" />
                              {att.original_filename}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Reply Box */}
                <div className="border-t border-gray-600 pt-3">
                  {/* Selected files display */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded text-sm"
                        >
                          <i className="pi pi-paperclip text-xs" />
                          <span className="max-w-[150px] truncate">{file.name}</span>
                          <button
                            onClick={() => removeSelectedFile(index)}
                            className="text-red-400 hover:text-red-300 ml-1"
                          >
                            <i className="pi pi-times text-xs" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <InputTextarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Antwort schreiben..."
                      rows={2}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          handleReply();
                        }
                      }}
                    />
                    <div className="flex flex-col gap-1">
                      <Button
                        icon="pi pi-send"
                        className="p-button-primary"
                        onClick={handleReply}
                        loading={replying}
                        disabled={!replyBody.trim()}
                        tooltip="Senden (Ctrl+Enter)"
                      />
                      <Button
                        className={`p-button-sm ${hasAttachmentAccess ? 'p-button-secondary' : 'p-button-warning'}`}
                        onClick={handleAttachmentClick}
                        tooltip={hasAttachmentAccess ? 'Datei anhängen' : 'Anhänge freischalten (50 Credits)'}
                      >
                        <span className="flex items-center gap-1 text-xs">
                          <i className="pi pi-paperclip" />
                          {!hasAttachmentAccess && '💰'}
                        </span>
                      </Button>
                    </div>
                  </div>
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip,.txt"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <i className="pi pi-envelope text-4xl mb-3" />
                  <p>Wählen Sie eine Konversation aus</p>
                </div>
              </div>
            )}
          </SplitterPanel>
        </Splitter>
      </Card>

      {/* Compose Modal */}
      <Dialog
        visible={composeVisible}
        onHide={() => setComposeVisible(false)}
        header="Neue Nachricht"
        style={{ width: '550px' }}
        modal
        className="p-fluid"
      >
        <div className="space-y-4">
          {/* Recipient Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Empfänger-Typ</label>
            <SelectButton
              value={recipientType}
              onChange={(e) => {
                setRecipientType(e.value);
                setComposeRecipient(null);
                setSelectedProject(null);
                setSelectedTeam(null);
              }}
              options={[
                { label: 'Einzelperson', value: 'individual', icon: 'pi pi-user' },
                { label: 'Projekt', value: 'project', icon: 'pi pi-briefcase' },
                { label: 'Team', value: 'team', icon: 'pi pi-users' },
                ...(recipientOptions.can_broadcast ? [{ label: 'Alle (Broadcast)', value: 'broadcast', icon: 'pi pi-globe' }] : []),
              ]}
              itemTemplate={(option) => (
                <span className="flex items-center gap-1 text-sm">
                  <i className={option.icon} />
                  {option.label}
                </span>
              )}
              className="w-full"
            />
          </div>

          {/* Individual Recipient */}
          {recipientType === 'individual' && (
            <div>
              <label className="block text-sm font-medium mb-1">Empfänger suchen</label>
              <AutoComplete
                value={composeRecipient}
                suggestions={userSuggestions}
                completeMethod={(e) => searchUsers(e.query)}
                field="name"
                onChange={(e) => setComposeRecipient(e.value)}
                placeholder="Mind. 2 Zeichen eingeben..."
                className="w-full"
                minLength={2}
                itemTemplate={(item: User | null) => item && (
                  <div className="flex flex-col py-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      {item.username && <span className="text-gray-400 text-sm">@{item.username}</span>}
                    </div>
                    {item.context_display && (
                      <span className="text-xs text-blue-400">{item.context_display}</span>
                    )}
                  </div>
                )}
              />
              <small className="text-gray-400">Suche in: Projekt-/Team-Mitglieder, frühere Kontakte</small>
            </div>
          )}

          {/* Project Selection */}
          {recipientType === 'project' && (
            <div>
              <label className="block text-sm font-medium mb-1">Projekt auswählen</label>
              <Dropdown
                value={selectedProject}
                options={recipientOptions.projects}
                onChange={(e) => setSelectedProject(e.value)}
                optionLabel="name"
                optionValue="id"
                placeholder="Projekt wählen..."
                className="w-full"
                itemTemplate={(option) => (
                  <div className="flex justify-between items-center w-full">
                    <span>{option.name}</span>
                    <Badge value={`${option.member_count} Mitglieder`} severity="info" />
                  </div>
                )}
                emptyMessage="Keine Projekte verfügbar"
              />
              <small className="text-gray-400">Nachricht wird an alle Projekt-Mitglieder gesendet</small>
            </div>
          )}

          {/* Team Selection */}
          {recipientType === 'team' && (
            <div>
              <label className="block text-sm font-medium mb-1">Team auswählen</label>
              <Dropdown
                value={selectedTeam}
                options={recipientOptions.teams}
                onChange={(e) => setSelectedTeam(e.value)}
                optionLabel="name"
                optionValue="id"
                placeholder="Team wählen..."
                className="w-full"
                itemTemplate={(option) => (
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <span>{option.name}</span>
                      {option.project_name && <span className="text-gray-400 text-sm ml-2">({option.project_name})</span>}
                    </div>
                    <Badge value={`${option.member_count} Mitglieder`} severity="info" />
                  </div>
                )}
                emptyMessage="Keine Teams verfügbar"
              />
              <small className="text-gray-400">Nachricht wird an alle Team-Mitglieder gesendet</small>
            </div>
          )}

          {/* Broadcast Info */}
          {recipientType === 'broadcast' && (
            <div className="bg-yellow-900/30 border border-yellow-600 rounded p-3">
              <div className="flex items-center gap-2 text-yellow-400">
                <i className="pi pi-exclamation-triangle" />
                <span className="font-medium">System-Broadcast</span>
              </div>
              <p className="text-sm text-gray-300 mt-1">
                Diese Nachricht wird an alle registrierten Benutzer gesendet.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Betreff</label>
            <InputText
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              placeholder="Betreff eingeben..."
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nachricht</label>
            <InputTextarea
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              placeholder="Ihre Nachricht..."
              rows={6}
              className="w-full"
            />
          </div>

          {/* Attachments Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium">Anhänge</label>
              <Button
                className={`p-button-sm ${hasAttachmentAccess ? 'p-button-secondary' : 'p-button-warning'}`}
                onClick={handleComposeAttachmentClick}
                tooltip={hasAttachmentAccess ? 'Datei anhängen' : 'Anhänge freischalten (50 Credits)'}
              >
                <span className="flex items-center gap-1 text-xs">
                  <i className="pi pi-paperclip" />
                  {hasAttachmentAccess ? 'Datei hinzufügen' : '💰 Freischalten'}
                </span>
              </Button>
            </div>
            {composeFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 bg-gray-700/30 rounded">
                {composeFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-gray-600 px-2 py-1 rounded text-sm"
                  >
                    <i className="pi pi-paperclip text-xs" />
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <button
                      onClick={() => removeComposeFile(index)}
                      className="text-red-400 hover:text-red-300 ml-1"
                    >
                      <i className="pi pi-times text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* Hidden file input for compose */}
            <input
              type="file"
              ref={composeFileInputRef}
              onChange={handleComposeFileSelect}
              multiple
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip,.txt"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              label="Abbrechen"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setComposeVisible(false)}
            />
            <Button
              label={composeFiles.length > 0 ? `Senden (${composeFiles.length} Anhang${composeFiles.length > 1 ? 'e' : ''})` : 'Senden'}
              icon="pi pi-send"
              className="p-button-primary"
              onClick={handleSendMessage}
              loading={sending}
              disabled={
                (recipientType === 'individual' && !composeRecipient) ||
                (recipientType === 'project' && !selectedProject) ||
                (recipientType === 'team' && !selectedTeam) ||
                !composeSubject.trim() ||
                !composeBody.trim()
              }
            />
          </div>
        </div>
      </Dialog>

      {/* Unlock Attachments Dialog */}
      <Dialog
        visible={showUnlockDialog}
        onHide={() => setShowUnlockDialog(false)}
        header="Anhänge freischalten"
        style={{ width: '400px' }}
        modal
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Abbrechen"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setShowUnlockDialog(false)}
            />
            <Button
              label="Freischalten (50 Credits)"
              icon="pi pi-unlock"
              className="p-button-success"
              onClick={handleUnlockAttachments}
              loading={unlocking}
              disabled={(attachmentAccessStatus?.user_credits || 0) < 50}
            />
          </div>
        }
      >
        <div className="space-y-4">
          <div className="text-center mb-4">
            <i className="pi pi-paperclip text-4xl text-blue-400 mb-2" />
            <h3 className="text-lg font-semibold">Nachrichten-Anhänge</h3>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-300">Ihre Credits:</span>
              <span className={`font-bold ${(attachmentAccessStatus?.user_credits || 0) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                {attachmentAccessStatus?.user_credits || 0} Credits
              </span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-300">Kosten:</span>
              <span className="font-bold text-yellow-400">50 Credits</span>
            </div>
            <hr className="border-gray-600 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Verbleibend:</span>
              <span className={`font-bold ${(attachmentAccessStatus?.user_credits || 0) - 50 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {Math.max(0, (attachmentAccessStatus?.user_credits || 0) - 50)} Credits
              </span>
            </div>
          </div>

          {(attachmentAccessStatus?.user_credits || 0) < 50 && (
            <div className="bg-red-900/30 border border-red-600 rounded p-3">
              <div className="flex items-center gap-2 text-red-400">
                <i className="pi pi-exclamation-triangle" />
                <span>Nicht genügend Credits!</span>
              </div>
              <p className="text-sm text-gray-300 mt-1">
                Sie benötigen mindestens 50 Credits zum Freischalten.
              </p>
            </div>
          )}

          <div className="bg-blue-900/30 border border-blue-600 rounded p-3">
            <div className="flex items-start gap-2">
              <i className="pi pi-info-circle text-blue-400 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="mb-1">Mit Nachrichten-Anhängen können Sie:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Dateien an Nachrichten anhängen</li>
                  <li>Bilder, PDFs, Dokumente teilen</li>
                  <li>ZIP-Archive versenden</li>
                </ul>
                <p className="mt-2 text-yellow-400">
                  <i className="pi pi-star mr-1" />
                  Gültig für 1 Jahr nach Freischaltung
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-900/30 border border-purple-600 rounded p-3 text-center">
            <span className="text-purple-300 text-sm">
              <i className="pi pi-crown mr-1" />
              Patron-Mitglieder erhalten dieses Feature kostenlos!
            </span>
          </div>
        </div>
      </Dialog>
    </TabContent>
  );
}
