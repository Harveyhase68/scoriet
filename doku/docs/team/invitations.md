---
sidebar_position: 3
title: "Inviting Team Members"
---

# Inviting Team Members

Adding new members to your Scoriet team is quick and easy. This guide walks you through all the ways to invite people to your team and manage those invitations.

## Prerequisites

To invite members to a team, you must have:
- **Owner** or **Admin** role in the team
- Active team in Scoriet
- Email addresses of people you want to invite

:::note
Team Viewers and Editors cannot send invitations. Only Owners and Admins can manage team membership.
:::

## Invitation Methods

Scoriet provides three methods to invite members:

1. **Email Invitation** — Invite specific people via email (most common)
2. **Invitation Link** — Generate a shareable link others can use to join
3. **Team Code** — Share a simple code people enter to join

Each method has different use cases.

---

## Method 1: Email Invitation

Email invitations allow you to invite specific people by their email address and set their initial role.

### How to Send an Email Invitation

1. **Go to Team Settings**
   - Click on your team name in the sidebar
   - Select **Settings** → **Members**

2. **Click "Invite Member"**
   - Button is in the top-right of the Members section

3. **Enter Email Address**
   - Type the person's email (e.g., `john@company.com`)
   - You can invite multiple people by separating with commas

4. **Select Initial Role**
   - **Viewer** — Read-only access (recommended for new members)
   - **Editor** — Can create and edit projects
   - **Admin** — Can manage team members

5. **Add Optional Message** (optional)
   - Include a personal note
   - Explain why you're inviting them
   - Set expectations for their role

6. **Click "Send Invitation"**
   - Email is sent immediately
   - You'll see the invitation in pending status

```
<div class="screenshot-placeholder">Screenshot: Email invitation form — <code>invite-email.png</code></div>
```

### Email Invitation Process

When someone receives an email invitation:

1. **Receive Email**
   - From: Scoriet <noreply@scoriet.com>
   - Subject: "You're invited to join [Team Name]"
   - Includes: your name, team name, role, optional message

2. **Click "Accept Invitation"**
   - Opens Scoriet in their browser
   - Creates/logs into their Scoriet account
   - Automatically joins the team

3. **Start Collaborating**
   - Immediately sees team projects
   - Has permissions based on assigned role
   - Can generate code and contribute

### Invitation Email Example

```
Hello [Member Name],

You're invited to join the team "Backend Development Team" on Scoriet!

Inviter: John Smith
Your Role: Editor
Team: Backend Development Team

Message from John:
"Welcome to the team! We're working on the API service refactor. 
You'll have editor access to create and modify projects. 
Feel free to reach out if you have questions."

Accept Invitation: [Link]

If you have any questions, contact us at support@scoriet.com

The Scoriet Team
```

### Managing Email Invitations

**View Pending Invitations**:
- Go to **Team Settings** → **Members**
- Pending invitations show "Invitation Sent" status
- Shows invitation date and recipient

**Resend Invitation**:
- Click **Resend** next to pending invitation
- Sends a fresh email to the recipient
- Updates invitation timestamp

**Cancel Invitation**:
- Click **Cancel** next to pending invitation
- Invitation expires immediately
- Can send a new invitation to the same email later

:::tip Invitation Validity
Email invitations are valid for **7 days** by default:
- Person must accept within 7 days
- After 7 days, invitation expires
- You can resend the invitation to extend it
- Enterprise plans may allow custom expiration periods
:::

---

## Method 2: Invitation Links

Invitation links are shareable URLs that anyone with the link can use to join your team. Useful for public teams or when you don't know exactly who will join.

### Creating an Invitation Link

1. **Go to Team Settings** → **Members**
2. **Click "Generate Invitation Link"**
3. **Configure the Link**:
   - **Default Role**: What role people get when they join
   - **Expiration**: When the link expires (1 week, 1 month, never)
   - **One-time Use**: Whether link can only be used once
   - **Custom Message**: Information shown before joining

4. **Click "Create Link"**
5. **Copy and Share**:
   - Copy the link from the modal
   - Share via email, Slack, or other channels
   - Anyone with the link can join

### Invitation Link Example

```
https://scoriet.com/join/team/abc123def456
```

### Using an Invitation Link

Someone with an invitation link:

1. **Clicks the Link**
   - Opens Scoriet invitation page
   - Shows team name, description, and member count

2. **Reviews Team Info**
   - Sees what role they'll have
   - Reads custom message from admin
   - Confirms they want to join

3. **Joins Team**
   - Creates or logs into Scoriet account
   - Automatically added to team
   - Gains access to team projects

### Managing Invitation Links

**View Active Links**:
- **Team Settings** → **Invitations**
- Lists all active invitation links
- Shows creation date, expiration, usage

**Disable a Link**:
- Click **Disable** next to the link
- Link immediately stops working
- Already-joined members remain on team

**View Link Statistics**:
- See how many people used each link
- Track join dates and joining members
- Identify popular links

:::tip Link Best Practices
- Create separate links for different groups
- Use descriptive names: "Frontend Team October" vs just "Team Link"
- Disable old links you no longer need
- Set reasonable expiration dates
:::

---

## Method 3: Team Code

A team code is a simple alphanumeric code that people can enter to join your team. Useful for in-person meetings or when you want a memorable code.

### Getting Your Team Code

1. **Go to Team Settings** → **General**
2. **Find "Team Code" section**
3. **Code appears automatically** (e.g., `BACKEND-2024`)
4. **Can regenerate** if you want a new code
   - Old code stops working immediately
   - Already-joined members remain

### How Someone Joins with Team Code

1. **Go to Scoriet** and log in
2. **Click "Join Team"** on dashboard
3. **Select "Join with Code"**
4. **Enter Team Code** (e.g., `BACKEND-2024`)
5. **Specify Role** (if admin allows):
   - May be limited to specific roles
   - Admin can restrict which roles are allowed
6. **Click "Join Team"**
7. **Access Granted** — Immediately joins team

### Customizing Team Code

In **Team Settings** → **General**:
- **Regenerate Code** — Get a new code
- **Set Default Role** — What role people get when using code
- **Restrict Roles** — Only allow specific roles to join via code
- **Enable/Disable Code** — Turn team code joining on/off

:::note Team Code Characteristics
- **Public-friendly** — Easy to share in meetings
- **Reusable** — Multiple people can use the same code
- **No expiration** — Code remains valid until you disable it
- **Permissions-based** — You control what role joiners get
:::

---

## Invitation Best Practices

### When to Use Each Method

| Method | Best For | Characteristics |
|--------|----------|-----------------|
| **Email** | Specific people | Targeted, personal, trackable |
| **Link** | Open groups | Shareable, flexible, trackable |
| **Code** | In-person meetings | Simple, memorable, informal |

### Email Invitations: Best For
- Bringing on specific developers
- Contractor or vendor onboarding
- Formal team expansion
- When you want to personally welcome someone

### Invitation Links: Best For
- Onboarding multiple people at once
- Sharing in Slack/Discord channels
- Public or semi-public teams
- Marketing or recruitment

### Team Code: Best For
- Conference booths or meetings
- Quick team joining during standups
- When direct email isn't available
- Casual or informal recruiting

### Invitation Management Tips

:::tip Use Descriptive Messages
When sending email invitations, include:
- What you're working on
- What role they'll have
- What they should do next
- When they can expect onboarding help
:::

:::info Set Clear Expectations
Make invitations informative:
- "You'll have Editor role and can create projects"
- "As a Viewer, you can see all projects but can't edit them"
- "Welcome to our backend team! We use daily standups at 9am"
:::

:::caution Monitor Pending Invitations
- Review pending invitations weekly
- Resend to people who haven't joined
- Cancel invitations for people who are no longer coming
- Keep your team membership clean and up-to-date

:::tip Batch Invitations
When adding multiple people:
1. Create email invitation first (most personal)
2. If they don't respond in 2 days, send invitation link
3. If still no response after 1 week, reach out directly

:::

---

## Invitation Scenarios

### Scenario 1: Onboarding a New Developer

1. **Send email invitation** with Editor role
2. **Personal message**: "Welcome! We're excited to have you. Here are the main projects you'll be working on..."
3. **Follow up** within 1 day to check if they joined
4. **Pair them** with an existing team member
5. **After 2 weeks** → Discuss promotion to Admin if needed

### Scenario 2: Adding External Consultant

1. **Send email invitation** with Viewer role initially
2. **Message**: "You can view all projects and see the code generated. Let us know if you need editing access."
3. **Approve access** to specific projects only
4. **After project ends** → Remove them from team

### Scenario 3: Growing Team

1. **Create invitation link** for "new hires 2024"
2. **Set expiration** to 3 months
3. **Default role** to Viewer (safe for onboarding)
4. **Share in company onboarding materials**
5. **Admins manually promote** as people prove competence

### Scenario 4: Public Community

1. **Generate public invitation link**
2. **No expiration** (permanent link)
3. **Default to Viewer role** (read-only safe)
4. **Share on website and social media**
5. **Team code** as easy fallback option

### Scenario 5: Departmental Expansion

1. **Send batch email** to department members
2. **Set default role** to Editor (they'll be active)
3. **Stagger invitations** over 2 weeks (don't overwhelm)
4. **Assign Admins** to manage daily operations

---

## Security and Invitations

### Invitation Security Features

Scoriet protects invitations with:

- **Email verification** — Invitations only sent to verified emails
- **Link expiration** — Invitations expire after 7 days
- **Role validation** — Only appropriate roles can be assigned
- **Activity logging** — All invitations logged for audit
- **Two-factor auth support** — Can require 2FA before joining

### Managing Invitations Safely

:::caution Double-Check Email Addresses
- Verify spelling before sending
- Watch for similar addresses (john.smith vs johnsmith)
- Especially important for external contractors

:::

:::info Remove Access When Needed
- Immediately remove people leaving the company
- Disable links if you accidentally shared the wrong one
- Cancel pending invitations for people who declined

:::tip Use Role Restrictions
- Don't default to Admin/Owner roles
- Require approval before promoting
- Regular audit of who has what role

:::

---

## Troubleshooting Invitations

### Invitation Not Received

**Check**:
1. Verify email address spelling
2. Check recipient's spam/junk folder
3. Ask recipient to whitelist Scoriet email

**Fix**:
1. Click **Resend** to send again
2. Send invitation link instead
3. Provide team code as backup

### Invitation Link Expired

**What Happened**: You created a link with limited expiration and didn't use it in time.

**Fix**:
1. Create a new invitation link
2. Copy new link and resend
3. Or use team code instead

### Wrong Role Assigned

**Can't Change After Sent**: Roles are locked in invitation.

**Fix**:
1. Invite member accepts with current role
2. Promote them manually after joining
3. For future invitations, check role before sending

### Can't Send Invitations

**Likely Cause**: You don't have Owner/Admin role.

**Fix**:
1. Ask team Owner/Admin to send invitation
2. Ask to be promoted to Admin role
3. Use public invitation link or team code instead

### Someone Joined with Wrong Role

1. Go to **Team Settings** → **Members**
2. Find the member
3. Click **Edit Role** or **Change Role**
4. Select correct role
5. Confirm change

---

## Invitation Limits

Different plans have different invitation limits:

| Plan | Email Invitations | Links | Team Code |
|------|-------------------|-------|-----------|
| Free | 5 per month | 1 | Yes |
| Pro | 50 per month | 5 | Yes |
| Enterprise | Unlimited | Unlimited | Yes |

:::note
Limits reset monthly. Contact support to adjust limits if needed.
:::

---

## Next Steps

- **[Roles and Permissions](./roles-permissions.md)** — Understanding team roles
- **[Team Overview](./overview.md)** — Full team collaboration guide
- **[User Guide Home](/docs)** — Main documentation

