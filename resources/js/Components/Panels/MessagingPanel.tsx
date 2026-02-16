import React, { useRef, useState, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
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
import { useTheme } from '@/contexts/ThemeContext';
import '@/Components/Panels/styles.css';

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
  const { t: t } = useTranslation(currentLanguage);

  // Theme
  const { colors } = useTheme();

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
        throw new Error(t.messagingpanel133);
      }

      const response = await fetch('/api/messages/threads', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t.messagingpanel144);
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
          summary: t.messageError,
          detail: err.message || t.messagingpanel166,
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
      group: 'messaging',
      message: t.messagingpanel330,
      header: t.messagingpanel331,
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
              detail: t.messagingpanel351,
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
            summary: t.messagingpanel363,
            detail: t.messagingpanel364,
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
        // Attachment dialog not needed - user can now use the file picker directly
        toast.current?.show({
          severity: 'success',
          summary: t.messagingpanel445,
          detail: t.messagingpanel446,
          life: 3000,
        });
        // Trigger credits refresh
        window.dispatchEvent(new CustomEvent('creditsUpdated'));
      } else {
        toast.current?.show({
          severity: 'error',
          summary: t.messagingpanel454,
          detail: data.message || t.messagingpanel455,
          life: 3000,
        });
      }
    } catch (_err) {
      toast.current?.show({
        severity: 'error',
        summary: t.messagingpanel462,
        detail: t.messagingpanel463,
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
          summary: t.messageError,
          detail: t.messagingpanel508,
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
        throw new Error(errorData.message || t.messagingpanel522);
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
        summary: t.messageError,
        detail: err.message || t.messagingpanel539,
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
      toast.current?.show({ severity: 'warn', summary: t.messagingpanel612, detail: t.messagingpanel612_2, life: 3000 });
      return;
    }
    if (recipientType === 'project' && !selectedProject) {
      toast.current?.show({ severity: 'warn', summary: t.messagingpanel612, detail: t.messagingpanel616, life: 3000 });
      return;
    }
    if (recipientType === 'team' && !selectedTeam) {
      toast.current?.show({ severity: 'warn', summary: t.messagingpanel612, detail: t.messagingpanel620, life: 3000 });
      return;
    }
    if (!composeSubject.trim() || !composeBody.trim()) {
      toast.current?.show({ severity: 'warn', summary: t.messagingpanel612, detail: t.messagingpanel624, life: 3000 });
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
          summary: t.messagingpanel697,
          detail: data.message || t.messagingpanel698,
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
        throw new Error(errorData.message || t.messagingpanel714);
      }
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: t.messageError,
        detail: err.message || t.messagingpanel720,
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
        throw new Error(t.messagingpanel775);
      }
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: t.messageError,
        detail: err.message || t.messagingpanel781,
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
          tooltip={t.messagingpanel845}
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
            placeholder={t.messagingpanel859}
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
          label={t.messagingpanel871}
          icon="pi pi-plus"
          className="p-button-sm p-button-success"
          onClick={openComposeModal}
        />
        <Button
          label={t.messagingpanel877}
          icon="pi pi-refresh"
          className="p-button-sm p-button-secondary"
          onClick={() => loadThreads()}
        />
      </div>
    );
  };

  return (
    <div
      className="h-full overflow-hidden"
      style={{
        flex: 1,
        padding: '5px 10px',
        backgroundColor: colors.bgPrimary,
        color: colors.textPrimary,
      }}
    >
      <Toast ref={toast} />
      <ConfirmDialog group="messaging" />

      <div
        className="h-full overflow-hidden rounded-lg"
        style={{
          backgroundColor: colors.bgSecondary,
          border: `1px solid ${colors.borderPrimary}`,
          padding: '1rem',
        }}
      >
        <Toolbar
          className="mb-3"
          left={leftToolbarTemplate}
          style={{ backgroundColor: colors.bgSecondary, border: 'none' }}
        />

        <Splitter
          style={{
            height: 'calc(100vh - 250px)',
            backgroundColor: colors.bgPrimary,
            ['--theme-bg-primary' as string]: colors.bgPrimary,
            ['--theme-bg-secondary' as string]: colors.bgSecondary,
            ['--theme-border-primary' as string]: colors.borderPrimary,
          }}
          className="mb-3 themed-splitter"
        >
          {/* Thread List */}
          <SplitterPanel
            size={40}
            minSize={15}
            style={{
              backgroundColor: colors.bgPrimary,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <DataTable
              value={threads}
              loading={loading}
              selectionMode="single"
              selection={selectedThread}
              onSelectionChange={(e) => handleThreadSelect(e.value as Thread)}
              dataKey="id"
              globalFilter={globalFilter}
              header={renderHeader()}
              emptyMessage={t.messagingpanel943}
              scrollable
              scrollHeight="flex"
              className="text-sm themed-datatable flex-1"
              style={{
                height: '100%',
                ['--dt-bg' as string]: colors.bgSecondary,
                ['--dt-header-bg' as string]: colors.bgTertiary,
                ['--dt-border' as string]: colors.borderPrimary,
                ['--dt-text' as string]: colors.textPrimary,
                ['--dt-text-secondary' as string]: colors.textSecondary,
              }}
              rowClassName={(data) => data.has_unread ? 'bg-blue-900/20' : ''}
            >
              <Column field="subject" header={t.messagingpanel957_2} body={subjectTemplate} sortable style={{ minWidth: '200px' }} />
              <Column header={t.messagingpanel958} body={participantsTemplate} style={{ minWidth: '120px' }} />
              <Column header={t.messagingpanel959} body={dateTemplate} sortable style={{ width: '80px' }} />
              <Column body={actionsTemplate} style={{ width: '60px' }} />
            </DataTable>
          </SplitterPanel>

          {/* Message View */}
          <SplitterPanel
            size={60}
            minSize={20}
            style={{
              backgroundColor: colors.bgPrimary,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {selectedThread ? (
              <div className="flex flex-col h-full p-3 overflow-hidden" style={{ backgroundColor: colors.bgPrimary }}>
                {/* Thread Header */}
                <div className="pb-3 mb-3" style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}>
                  <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: colors.textPrimary }}>
                    {selectedThread.is_broadcast && (
                      <Badge value="System" severity="danger" />
                    )}
                    {selectedThread.subject}
                  </h3>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>
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
                        <span className="text-sm" style={{ color: colors.textMuted }}>
                          <i className="pi pi-spin pi-spinner mr-2" />
                          {t.messagingpanel1002}
                        </span>
                      ) : (
                        <button
                          onClick={loadMoreMessages}
                          className="text-sm"
                          style={{ color: colors.accent }}
                        >
                          <i className="pi pi-arrow-up mr-1" />
                          {t.messagingpanel1011}({totalMessages - (selectedThread.messages?.length || 0)}{t.messagingpanel1011_2}
                        </button>
                      )}
                    </div>
                  )}
                  {selectedThread.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3 rounded-lg"
                      style={{
                        backgroundColor: Number(msg.sender_id) === parseInt(localStorage.getItem('user_id') || '0')
                          ? `${colors.accent}30`
                          : colors.bgTertiary,
                        marginLeft: Number(msg.sender_id) === parseInt(localStorage.getItem('user_id') || '0') ? '2rem' : 0,
                        marginRight: Number(msg.sender_id) === parseInt(localStorage.getItem('user_id') || '0') ? 0 : '2rem',
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                          {msg.sender?.name || msg.sender?.username || t.messagingpanel1030}
                        </span>
                        <span className="text-xs" style={{ color: colors.textMuted }}>
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      <div className="text-sm whitespace-pre-wrap" style={{ color: colors.textPrimary }}>{msg.body}</div>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {msg.attachments.map((att: any) => (
                            <button
                              key={att.id}
                              onClick={() => handleDownloadAttachment(att.id, att.original_filename)}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer"
                              style={{ backgroundColor: colors.bgSecondary, color: colors.textSecondary }}
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
                <div className="pt-3" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                  {/* Selected files display */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 px-2 py-1 rounded text-sm"
                          style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
                        >
                          <i className="pi pi-paperclip text-xs" />
                          <span className="max-w-[150px] truncate">{file.name}</span>
                          <button
                            onClick={() => removeSelectedFile(index)}
                            className="ml-1"
                            style={{ color: colors.errorText }}
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
                      placeholder={t.messagingpanel1084}
                      rows={2}
                      className="flex-1"
                      style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
                      onKeyDown={(e) => {
                        if (e.key === t.messagingpanel1089 && e.ctrlKey) {
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
                        tooltip={hasAttachmentAccess ? t.messagingpanel1106 : t.messagingpanel1106_2}
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
              <div className="flex items-center justify-center h-full" style={{ color: colors.textMuted, backgroundColor: colors.bgPrimary }}>
                <div className="text-center">
                  <i className="pi pi-envelope text-4xl mb-3" />
                  <p>{t.messagingpanel1130}</p>
                </div>
              </div>
            )}
          </SplitterPanel>
        </Splitter>
      </div>

      {/* Compose Modal */}
      <Dialog
        visible={composeVisible}
        onHide={() => setComposeVisible(false)}
        header={t.messagingpanel1142}
        style={{ width: '550px' }}
        modal
        className="p-fluid themed-dialog"
        contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
      >
        <div className="space-y-4">
          {/* Recipient Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">{t.messagingpanel1152}</label>
            <SelectButton
              value={recipientType}
              onChange={(e) => {
                setRecipientType(e.value);
                setComposeRecipient(null);
                setSelectedProject(null);
                setSelectedTeam(null);
              }}
              options={[
                { label: t.messagingpanel1162, value: 'individual', icon: 'pi pi-user' },
                { label: t.messagingpanel1163, value: 'project', icon: 'pi pi-briefcase' },
                { label: t.messagingpanel1164, value: 'team', icon: 'pi pi-users' },
                ...(recipientOptions.can_broadcast ? [{ label: t.messagingpanel1165, value: 'broadcast', icon: 'pi pi-globe' }] : []),
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
              <label className="block text-sm font-medium mb-1">{t.messagingpanel1180}</label>
              <AutoComplete
                value={composeRecipient}
                suggestions={userSuggestions}
                completeMethod={(e) => searchUsers(e.query)}
                field="name"
                onChange={(e) => setComposeRecipient(e.value)}
                placeholder={t.messagingpanel1187}
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
              <small style={{ color: colors.textMuted }}>{t.messagingpanel1202}</small>
            </div>
          )}

          {/* Project Selection */}
          {recipientType === 'project' && (
            <div>
              <label className="block text-sm font-medium mb-1">{t.messagingpanel1209}</label>
              <Dropdown
                value={selectedProject}
                options={recipientOptions.projects}
                onChange={(e) => setSelectedProject(e.value)}
                optionLabel="name"
                optionValue="id"
                placeholder={t.messagingpanel1216}
                className="w-full"
                itemTemplate={(option) => (
                  <div className="flex justify-between items-center w-full">
                    <span>{option.name}</span>
                    <Badge value={`${option.member_count} Mitglieder`} severity="info" />
                  </div>
                )}
                emptyMessage={t.messagingpanel1224}
              />
              <small style={{ color: colors.textMuted }}>{t.messagingpanel1226}</small>
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
                placeholder={t.messagingpanel1240}
                className="w-full"
                itemTemplate={(option) => (
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <span>{option.name}</span>
                      {option.project_name && <span className="text-gray-400 text-sm ml-2">({option.project_name})</span>}
                    </div>
                    <Badge value={`${option.member_count}${t.messagingpanel1248}`} severity="info" />
                  </div>
                )}
                emptyMessage={t.messagingpanel1251}
              />
              <small style={{ color: colors.textMuted }}>{t.messagingpanel1253}</small>
            </div>
          )}

          {/* Broadcast Info */}
          {recipientType === 'broadcast' && (
            <div className="rounded p-3" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningBorder}` }}>
              <div className="flex items-center gap-2" style={{ color: colors.warningText }}>
                <i className="pi pi-exclamation-triangle" />
                <span className="font-medium">{t.messagingpanel1262}</span>
              </div>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                {t.messagingpanel1265}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">{t.messagingpanel1271}</label>
            <InputText
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              placeholder={t.messagingpanel1275}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nachricht</label>
            <InputTextarea
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              placeholder={t.messagingpanel1285}
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
                tooltip={hasAttachmentAccess ? t.messagingpanel1298 : t.messagingpanel1298_2}
              >
                <span className="flex items-center gap-1 text-xs">
                  <i className="pi pi-paperclip" />
                  {hasAttachmentAccess ? t.messagingpanel1302 : t.messagingpanel1302_2}
                </span>
              </Button>
            </div>
            {composeFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 rounded" style={{ backgroundColor: colors.bgTertiary }}>
                {composeFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 px-2 py-1 rounded text-sm"
                    style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
                  >
                    <i className="pi pi-paperclip text-xs" />
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <button
                      onClick={() => removeComposeFile(index)}
                      className="ml-1"
                      style={{ color: colors.errorText }}
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
              label={t.messagingpanel1340}
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setComposeVisible(false)}
            />
            <Button
              label={composeFiles.length > 0 ? `${t.messagingpanel1346}(${composeFiles.length}${t.messagingpanel1346_2}${composeFiles.length > 1 ? 'e' : ''})` : t.messagingpanel1346_3}
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
        header={t.messagingpanel1367}
        style={{ width: '400px' }}
        modal
        className="themed-dialog"
        contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label={t.messagingpanel1376}
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setShowUnlockDialog(false)}
            />
            <Button
              label={t.messagingpanel1382}
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
            <i className="pi pi-paperclip text-4xl mb-2" style={{ color: colors.accent }} />
            <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>{t.messagingpanel1395}</h3>
          </div>

          <div className="rounded-lg p-4" style={{ backgroundColor: colors.bgTertiary }}>
            <div className="flex justify-between items-center mb-3">
              <span style={{ color: colors.textSecondary }}>{t.messagingpanel1400}</span>
              <span className="font-bold" style={{ color: (attachmentAccessStatus?.user_credits || 0) >= 50 ? colors.successText : colors.errorText }}>
                {attachmentAccessStatus?.user_credits || 0}{t.messagingpanel1402}
              </span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span style={{ color: colors.textSecondary }}>{t.messagingpanel1406}</span>
              <span className="font-bold" style={{ color: colors.warningText }}>{t.messagingpanel1407}</span>
            </div>
            <hr className="my-2" style={{ borderColor: colors.borderPrimary }} />
            <div className="flex justify-between items-center">
              <span style={{ color: colors.textSecondary }}>{t.messagingpanel1411}</span>
              <span className="font-bold" style={{ color: (attachmentAccessStatus?.user_credits || 0) - 50 >= 0 ? colors.successText : colors.errorText }}>
                {Math.max(0, (attachmentAccessStatus?.user_credits || 0) - 50)}{t.messagingpanel1413}
              </span>
            </div>
          </div>

          {(attachmentAccessStatus?.user_credits || 0) < 50 && (
            <div className="rounded p-3" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}` }}>
              <div className="flex items-center gap-2" style={{ color: colors.errorText }}>
                <i className="pi pi-exclamation-triangle" />
                <span>{t.messagingpanel1422}</span>
              </div>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                {t.messagingpanel1425}
              </p>
            </div>
          )}

          <div className="rounded p-3" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}` }}>
            <div className="flex items-start gap-2">
              <i className="pi pi-info-circle mt-0.5" style={{ color: colors.infoText }} />
              <div className="text-sm" style={{ color: colors.textSecondary }}>
                <p className="mb-1">{t.messagingpanel1434}</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>{t.messagingpanel1436}</li>
                  <li>{t.messagingpanel1437}</li>
                  <li>{t.messagingpanel1438}</li>
                </ul>
                <p className="mt-2" style={{ color: colors.warningText }}>
                  <i className="pi pi-star mr-1" />
                  {t.messagingpanel1442}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded p-3 text-center" style={{ backgroundColor: `${colors.accent}20`, border: `1px solid ${colors.accent}` }}>
            <span className="text-sm" style={{ color: colors.accent }}>
              <i className="pi pi-crown mr-1" />
              {t.messagingpanel1451}
            </span>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
