---
sidebar_position: 4
title: Messaging
---

# Messaging

Scoriet's built-in Messaging system enables seamless team communication within the application. Instead of switching between multiple apps, your team can discuss projects, share ideas, ask questions, and collaborate—all without leaving Scoriet.

## Understanding the Messaging System

The messaging system provides multiple ways to communicate:

- **Direct Messages**: One-to-one conversations with team members
- **Channels**: Group discussions organized by topic or project
- **Threads**: Organized conversations within channels
- **Notifications**: Stay updated without checking constantly
- **Search**: Find past conversations instantly

## Opening Messaging

To access the Messaging panel:

1. **Click the Messaging icon** in the dock
2. **The Messaging panel opens** on the right or bottom
3. **View conversations list** on the left
4. **Chat area** on the right
5. **Start a new conversation**

<div class="screenshot-placeholder">Screenshot: Messaging panel showing conversations and chat area — <code>messaging-main.png</code></div>

## Direct Messages

Send private messages to individual team members.

### Starting a Direct Message

1. **Click "New Message"** or "+"
2. **Select team member** from list
3. **Type your message**
4. **Press Enter** to send

### Message Features

- **Text messages**: Plain text, emoji support
- **Mentions**: @mention team members to get their attention
- **Rich text**: Bold, italic, code formatting using markdown
- **File sharing**: Attach files (documents, images, screenshots)
- **Links**: Share URLs with preview cards
- **Reactions**: React with emoji to messages (thumbs up, celebrate, etc.)

### Example Direct Message

```
You: Hey John, can you review the user schema I created?

John: Sure! When did you push it?

You: Just now. It's in the database/schemas branch.
     I added the users table with all fields we discussed.

John: 👍 I'll check it out this afternoon.
```

## Channels

Organize group conversations by project, topic, or team.

### Creating Channels

1. **Click "Create Channel"**
2. **Enter channel name** (e.g., #backend, #design, #q1-planning)
3. **Add description** (what the channel is for)
4. **Set privacy**:
   - **Public**: Anyone can see and join
   - **Private**: Invite-only, hidden from directory
5. **Click Create**

### Channel Types

**Project Channels**: Dedicated to a specific project
```
#scoriet-dev - Development discussions for Scoriet project
#scoriet-design - Design decisions and mockups
#scoriet-marketing - Marketing campaign planning
```

**Topic Channels**: Organized by subject
```
#backend - Backend development discussion
#frontend - Frontend and UI/UX
#database - Database design and SQL
#security - Security concerns and best practices
```

**Team Channels**: Specific to departments
```
#engineering - Engineering team announcements
#marketing - Marketing department discussions
#sales - Sales team updates
```

**Social Channels**: Non-work related
```
#random - Off-topic conversations
#wins - Celebrate team victories
#wellness - Health and work-life balance
```

### Joining Channels

1. **Click "Browse Channels"**
2. **See available public channels**
3. **Click channel** to view details
4. **Click "Join"** to participate
5. **Conversations appear** in your list

### Channel Settings

As a channel creator, configure:

- **Channel name**: Topic/purpose
- **Description**: What the channel is about
- **Privacy**: Public/Private
- **Notifications**: Mute, all messages, mentions only
- **Members**: See who's in the channel
- **Pinned messages**: Keep important info visible

<div class="screenshot-placeholder">Screenshot: Channel creation dialog with privacy and topic settings — <code>channel-creation.png</code></div>

## Threads

Keep conversations organized within channels using threads.

### Creating a Thread

1. **Hover over a message** in a channel
2. **Click "Reply in thread"**
3. **A thread panel opens**
4. **Type your response**
5. **Send** - response appears in thread, not main channel

### Why Use Threads?

Threads prevent channel clutter:

```
Main Channel (What people see):
├─ Alice: "Should we add a cache layer?"
│  └─ 5 replies in thread
├─ Bob: "The API response time is too slow"
│  └─ 12 replies in thread
└─ Carol: "New deployment schedule posted"
   └─ 3 replies in thread
```

Without threads, 20 messages would clutter the channel. With threads, it's clean and organized.

### Thread Example

```
Main message:
Bob: The API response time is too slow

Thread responses:
├─ Alice: Have you profiled it? Where's the bottleneck?
├─ Bob: Yeah, it's the database queries. N+1 problem.
├─ Carol: Easy fix. Let me review your code.
├─ Bob: Here's the PR: github.com/...
└─ Alice: Looks good, merged! 🚀
```

## Message Formatting

Write expressive, clear messages using formatting:

### Markdown Support

```
**bold text** → bold text
*italic text* → italic text
`code snippet` → code snippet
```code
multi-line code
```
→ formatted code block

> quoted text → indented quote

# Heading → larger text
## Subheading → medium text
```

### Mentions

Get specific people's attention:

- **@username** - Notify individual person
- **@channel** - Notify all channel members (use sparingly!)
- **@here** - Notify active users (don't use in threads)

### Emoji

Add personality and quick reactions:

```
:tada: → 🎉
:thumbsup: → 👍
:heart: → ❤️
:thinking: → 🤔
:fire: → 🔥
:rocket: → 🚀
```

## Sharing and Media

### Sharing Files

1. **Click attachment icon** 📎
2. **Select file** from computer
3. **File uploads** and appears in chat
4. **Team can download** or preview (if supported)

Supported file types:
- Documents: PDF, Word, Excel
- Images: PNG, JPG, GIF
- Code: Any code file type
- Archives: ZIP, RAR

### Sharing Links

Paste a URL and it shows a preview:

```
You: Check out this article about databases
      https://example.com/database-design

[Preview Card]
Database Design Best Practices
Author: Jane Smith | 5 min read
Learn how to design databases that scale...
[Visit Article →]
```

### Sharing Code Snippets

Paste code and it highlights syntax:

````
```sql
SELECT users.name, COUNT(posts.id) as post_count
FROM users
LEFT JOIN posts ON users.id = posts.user_id
GROUP BY users.id;
```
````

## Notifications

Stay updated without constant checking:

### Notification Preferences

1. **Click your profile** → Settings
2. **Go to Notifications**
3. **For each channel, set**:
   - **All**: Every message
   - **Mentions**: Only @mentions
   - **Mute**: No notifications

### Notification Styles

- **Desktop**: Pop-up notifications
- **Badge**: Unread count indicator
- **Sound**: Optional alert sound
- **Email**: Digest of important messages (optional)

### Do Not Disturb

Temporarily silence notifications:

1. **Click status** (online/away indicator)
2. **Select "Do Not Disturb"**
3. **Choose duration**: 1 hour, until tomorrow, custom
4. **Notifications muted** temporarily

## Search and Archives

### Finding Messages

1. **Click search icon** 🔍
2. **Type keywords** or member name
3. **Results show**:
   - Matching messages
   - From which conversation
   - When posted
4. **Click result** to jump to message

### Advanced Search

```
from:john                    // Messages from John
in:backend                   // Messages in #backend channel
after:2026-04-01            // Sent after April 1
before:2026-04-15           // Sent before April 15
has:file                    // Messages with attachments
has:link                    // Messages with URLs

Example: from:john in:backend has:file
→ Shows files John shared in #backend channel
```

### Archiving Conversations

1. **Right-click conversation**
2. **Select "Archive"**
3. **Conversation hidden** from main list
4. **Still searchable** in archives
5. **Can restore** from archives if needed

## Collaboration Features

### Reactions

React to messages with emoji instead of lengthy replies:

```
Message: "The new design is ready!"

Reactions:
👍 5 people   🎉 3 people   ❤️ 2 people   🚀 1 person
```

Click reaction count to see who reacted.

### Message Editing

Fix typos after sending:

1. **Hover over your message**
2. **Click "Edit"**
3. **Change text**
4. **Click "Save"** (shows "(edited)" label)

### Message Deletion

Remove a message:

1. **Hover over your message**
2. **Click "Delete"**
3. **Confirm deletion**
4. **Message removed** (shows "(deleted)" for others)

### Pinned Messages

Keep important info visible in a channel:

1. **Hover over message**
2. **Click "Pin"**
3. **Message pinned** to channel top
4. **Click pin icon** to view pinned messages

Example pinned messages:
```
#backend channel pins:
├─ Database migration schedule
├─ API documentation link
├─ Security checklist
└─ Deployment instructions
```

## Integration with Projects

Messaging integrates with your Scoriet projects:

### Linking to Items

Reference database records, forms, or tasks:

```
Message: "Check out the user form we designed"
→ Creates link to Form Designer: User Form
```

Click link to jump directly to the item.

### Project Notifications

Get notified about project events in messaging:

```
#scoriet-dev channel:
🤖 System: John pushed code to backend
🤖 System: Jane created new form "User Registration"
🤖 System: Bob completed task in Kanban board
```

## Tips and Best Practices

:::tip
**Use channels wisely**: Create channels for ongoing topics, use DMs for one-off questions.
:::

:::tip
**Threads keep channels clean**: Use threads to keep long conversations organized.
:::

:::tip
**Search before asking**: Use search to see if your question was already answered.
:::

:::tip
**Respect @channel/@here**: Only use these for truly urgent, team-wide messages.
:::

:::tip
**Archive old conversations**: Regular cleanup keeps your message list manageable.
:::

:::tip
**Share context**: When asking questions, provide background so teammates understand the context.
:::

## Accessibility

Messaging is designed to be accessible:

- **Keyboard navigation**: Tab through conversations, Enter to send
- **Screen reader support**: Messages clearly labeled
- **High contrast**: Text readable with reduced vision
- **Emoji alternatives**: Text descriptions for emojis

## What's Next?

- Learn about [Template Store](./template-store.md) to share messaging features
- Explore [Deployment](./deployment.md) to make messaging available in your app
- Set up [Translations](./translations.md) for multi-language teams
