---
sidebar_position: 4
---

# Messaging System

## Overview

The Messaging System provides threaded, multi-recipient communication with broadcast support, file attachments, and activity tracking. Users can send direct messages, group messages to teams/projects, or broadcast to all users.

![Messaging](/img/screenshots/messages.png)
*The Messaging panel with threaded conversations, recipients, and message history*

## Key Features

- **Threaded Messaging** - Organize conversations by topic
- **Multiple Recipients** - Individual, team, project, or broadcast
- **File Attachments** - Share files in messages
- **Read Receipts** - Track message reading via last_read_at
- **Message Search** - Search across threads and content
- **Soft Delete** - Participants can leave conversations
- **Activity Tracking** - See who replied and when
- **Multi-language** - Support for message body translations

## Core Data Structures

```typescript
interface Thread {
  id: number;
  subject: string;
  is_broadcast: boolean;
  creator_id: number;
  created_at: string;
  updated_at: string;
  latest_message?: Message;
  other_participants?: User[];
  has_unread?: boolean;
  messages?: Message[];
  participants?: ThreadParticipant[];
}

interface Message {
  id: number;
  thread_id: number;
  sender_id: number;
  body: string;
  created_at: string;
  updated_at: string;
  sender: User;
  attachments?: Attachment[];
  is_edited?: boolean;
}

interface Attachment {
  id: number;
  message_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

interface ThreadParticipant {
  id: number;
  thread_id: number;
  user_id: number;
  last_read_at?: string;
  deleted_at?: string;  // Soft delete
  role: string;
}
```

## Recipient Types

### Individual Messaging

Direct message between two users:

```typescript
const thread = {
  subject: 'Project Discussion',
  is_broadcast: false,
  recipient_type: 'individual',
  recipient_id: targetUserId
};
```

### Project Messaging

Message to all project members:

```typescript
const thread = {
  subject: 'Project Update',
  recipient_type: 'project',
  project_id: projectId
};

// All project members receive
```

### Team Messaging

Message to specific team within project:

```typescript
const thread = {
  subject: 'Team Standup',
  recipient_type: 'team',
  team_id: teamId
};
```

### Broadcast Messaging

Message to all users (admin only):

```typescript
const thread = {
  subject: 'System Announcement',
  is_broadcast: true,
  recipient_type: 'broadcast'
};

// Permission check: requires broadcast capability
```

## Read Receipts

Track when participants read messages:

```typescript
interface ThreadParticipant {
  last_read_at: string | null;  // ISO timestamp
}

// Mark as read
const markAsRead = async (threadId: number) => {
  await fetch(`/api/threads/${threadId}/mark-read`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

// Unread count
const unreadCount = threads.filter(t => !t.last_read_at).length;

// Who has read
const hasRead = (thread: Thread, userId: number) => {
  const participant = thread.participants.find(p => p.user_id === userId);
  return participant?.last_read_at && 
    new Date(participant.last_read_at) > new Date(thread.updated_at);
};
```

## Message Features

### Reply to Thread

```typescript
const handleReply = async (threadId: number, body: string) => {
  const response = await fetch(`/api/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
};
```

### File Attachments

Attachments are a premium feature for patron users:

```typescript
interface AttachmentAccess {
  has_access: boolean;
  is_patron: boolean;
  is_system?: boolean;
  subscription_ends_at?: string;
  user_credits?: number;
}

// Check before uploading
const checkAttachmentAccess = async () => {
  const response = await fetch('/api/messages/attachment-access', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};

// Upload with message
const sendWithAttachments = async (threadId: number, body: string, files: File[]) => {
  const formData = new FormData();
  formData.append('body', body);
  files.forEach((file, i) => {
    formData.append(`attachments[${i}]`, file);
  });
  
  await fetch(`/api/threads/${threadId}/messages`, {
    method: 'POST',
    body: formData,
    headers: { 'Authorization': `Bearer ${token}` }
  });
};
```

### Edit Message

```typescript
const handleEditMessage = async (messageId: number, newBody: string) => {
  await fetch(`/api/messages/${messageId}`, {
    method: 'PUT',
    body: JSON.stringify({ body: newBody }),
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};
```

### Delete Message

Soft delete removes message from participant's view:

```typescript
const handleDeleteMessage = async (messageId: number) => {
  await fetch(`/api/messages/${messageId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};
```

## Thread Management

### Create Thread

```typescript
const createThread = async (subject: string, recipientType: string, recipientId?: number) => {
  const response = await fetch('/api/threads', {
    method: 'POST',
    body: JSON.stringify({
      subject,
      recipient_type: recipientType,
      recipient_id: recipientId
    }),
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
};
```

### Leave Thread

Soft delete participant from thread (thread remains for others):

```typescript
const leaveThread = async (threadId: number) => {
  await fetch(`/api/threads/${threadId}/leave`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};
```

### Archive Thread

Mark thread as archived for organization:

```typescript
const archiveThread = async (threadId: number) => {
  await fetch(`/api/threads/${threadId}`, {
    method: 'PUT',
    body: JSON.stringify({ is_archived: true }),
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};
```

## Search & Filtering

### Search Threads

```typescript
const searchThreads = async (query: string) => {
  const response = await fetch(`/api/threads/search?q=${encodeURIComponent(query)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return await response.json();
};

// Searches: subject, message body, sender name
```

### Filter Options

```typescript
// Unread only
threads.filter(t => t.has_unread);

// From specific user
threads.filter(t => t.latest_message?.sender_id === userId);

// Broadcast messages
threads.filter(t => t.is_broadcast);

// Recent threads (last 7 days)
threads.filter(t => 
  new Date(t.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
);
```

## User Suggestions

### Autocomplete Recipients

```typescript
const searchUsers = async (query: string) => {
  const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return await response.json();
};

// Show matching users
const userSuggestions = await searchUsers('john');
// Returns: [ { id: 1, name: 'John Doe', username: 'john.doe' }, ... ]
```

## Real-time Updates

### WebSocket Subscriptions

```typescript
// Subscribe to thread
const channel = getEcho().channel(`thread.${threadId}`);

channel.listen('MessageSent', (data) => {
  addMessage(data.message);
  markAsRead(threadId);
});

channel.listen('UserTyping', (data) => {
  showTypingIndicator(data.user.name);
});

channel.listen('MessageDeleted', (data) => {
  removeMessage(data.message_id);
});
```

## API Endpoints

```
# Threads
GET    /api/threads                      # List user threads
POST   /api/threads                      # Create thread
GET    /api/threads/{id}                 # Get thread
PUT    /api/threads/{id}                 # Update thread
POST   /api/threads/{id}/leave           # Leave thread
POST   /api/threads/{id}/mark-read       # Mark as read

# Messages
GET    /api/threads/{id}/messages        # Get messages (paginated)
POST   /api/threads/{id}/messages        # Send message
PUT    /api/messages/{id}                # Edit message
DELETE /api/messages/{id}                # Delete message

# Attachments
GET    /api/messages/attachment-access   # Check attachment permission
DELETE /api/attachments/{id}             # Delete attachment

# Search
GET    /api/threads/search?q=...         # Search threads
GET    /api/users/search?q=...           # Search users
```

## Permission Model

### Message Creator
- Edit own messages
- View all messages in thread
- Delete message (soft delete)

### Thread Participants
- Read messages
- Reply to thread
- See participant list
- Mark as read
- Leave thread

### Non-Participants
- Cannot see thread
- Cannot join unless invited

### Broadcast Recipient
- Read-only access
- No reply option (may change)

## Best Practices

1. **Use Clear Subjects** - Help find conversations later
2. **Keep Threads Focused** - One topic per thread
3. **Search Before Creating** - Avoid duplicate threads
4. **Check Attachments** - Know feature limitations
5. **Archive Old Threads** - Keep inbox organized
6. **Use Appropriate Recipients** - Don't over-broadcast
7. **Respond Promptly** - Don't leave colleagues waiting
8. **Reference Messages** - Quote when necessary

## Common Use Cases

### Project Update
Recipients: Project
Subject: "Weekly Progress Report"
Message: Summary of accomplishments and blockers

### Team Decision
Recipients: Team
Subject: "Technology Stack Recommendation"
Attachments: Comparison document

### One-on-One
Recipients: Individual User
Subject: Discussion topic
Private conversation with colleague

### System Announcement
Recipients: Broadcast (admin only)
Subject: "Scheduled Maintenance Notice"
Inform all users of important updates

## Troubleshooting

### Messages Not Appearing
- Check WebSocket connection
- Verify participant status
- Refresh page

### Attachments Not Uploading
- Check patron/credit status
- Verify file size limits
- Confirm file type allowed

### Unread Status Not Updating
- Check read receipt sync
- Verify last_read_at timestamp
- Refresh thread

## Next Steps

- [Kanban Board](kanban.md) - Task management
- [Team Management](../frontend/panels.md#teammanagementpanel) - Manage users
- [Project Settings](../frontend/panels.md#projectsettingspanel) - Configure communication
