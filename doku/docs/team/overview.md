---
sidebar_position: 1
title: "Team Collaboration"
---

# Team Collaboration

Scoriet's team collaboration features enable you to work seamlessly with colleagues, share projects, manage access, and maintain version control across your organization. Whether you're a solo developer or part of a large enterprise, Scoriet provides the tools to collaborate effectively.

## What is Team Collaboration?

Team collaboration in Scoriet refers to the ability to:

- **Share Projects** — Multiple users can work on the same Scoriet projects
- **Manage Access** — Fine-grained permissions control who can view, edit, or manage projects
- **Invite Members** — Add team members with specific roles and permissions
- **Track Changes** — See who made what changes and when
- **Organize Teams** — Create multiple teams for different departments or projects

```
<div class="screenshot-placeholder">Screenshot: Team collaboration dashboard — <code>team-dashboard.png</code></div>
```

## Core Concepts

### Teams

A **team** is a group of users with shared access to projects and resources. Teams provide organizational structure and boundary enforcement for who can access what.

**Team Structure**:
- Each team has **one owner** (the user who created it)
- Teams can have multiple **members** with different roles
- Teams own **projects** that members collaborate on
- Each user can be a member of multiple teams

:::note
Teams are separate from individual accounts. A user can have personal projects and also be part of multiple teams.
:::

### Projects and Team Ownership

Projects in Scoriet can be:
- **Personal** — Owned and accessed only by an individual user
- **Team-owned** — Owned by a team, accessible to team members based on their role

When you create a project within a team, all team members (with appropriate permissions) can access and contribute to it.

### Members and Roles

Each team member has a specific **role** that determines what they can do:

- **Owner** — Full control of team, members, projects, and settings
- **Admin** — Manage members and projects, but cannot delete the team
- **Editor** — Create, edit, and delete projects; manage collaborators
- **Viewer** — Read-only access to projects; cannot make changes

See the **[Roles and Permissions](./roles-permissions.md)** section for detailed permission matrices.

## Creating a Team

To create a new team:

1. Go to **Teams** section in Scoriet
2. Click **Create New Team**
3. Enter a team name (e.g., "Frontend Team", "API Development")
4. Add a description (optional)
5. Click **Create**

You automatically become the **owner** of the team you create.

:::tip Team Naming
Use clear, descriptive team names that reflect the team's purpose:
- ✓ "Backend API Team"
- ✓ "Mobile App Development"
- ✗ "Team 1"
- ✗ "Temp"
:::

## Joining a Team

You can join a team in several ways:

1. **Invitation Link** — Someone shares a team invitation link with you
2. **Invite Email** — You receive an email invitation from a team owner/admin
3. **Team Code** — You enter a team code from a team owner/admin

When you receive an invitation:
- You'll see a notification with team details
- Click **Accept** to join the team
- You'll immediately have access to team projects based on your role

:::info Default Team Role
When you're invited to a team, the inviter specifies your initial role (Viewer, Editor, Admin, or Owner). You cannot change your own role; an Owner or Admin must do that.
:::

## Team Settings

Once you create or are added to a team, you can (if you have sufficient permissions):

- **Change Team Name and Description** — Update team metadata
- **Manage Team Members** — Add, remove, or update member roles
- **Configure Team Privacy** — Control who can discover and join the team
- **Set Team Logo** — Add a team icon/logo for identification
- **Archive Team** — Disable a team without deleting it

## Project Access Through Teams

When you're a member of a team, you have access to all team projects based on your role:

### As a Viewer
- View all projects
- View project details and templates
- Generate code (read-only)
- Cannot make edits

### As an Editor
- View and edit projects
- Create new projects
- Modify templates
- Delete projects you created
- Manage project collaborators

### As an Admin
- All Editor permissions
- Manage all team projects
- Modify team settings
- Add/remove team members
- Cannot delete the team

### As an Owner
- All Admin permissions
- Delete the entire team
- Transfer team ownership to another member
- Full control of team resources

See **[Roles and Permissions](./roles-permissions.md)** for detailed permission tables.

## Inviting Team Members

:::info Prerequisite
You must be a team **Owner** or **Admin** to invite members.
:::

To invite someone to your team:

1. Go to **Team Settings** → **Members**
2. Click **Invite Member**
3. Enter the person's email address
4. Select their initial role (Viewer, Editor, Admin)
5. Add an optional message
6. Click **Send Invitation**

The invitee will receive an email with:
- Your name and the team name
- Their assigned role
- A link to accept the invitation
- Your optional message

**Invitation Links**:
After creating an invitation, you'll get a shareable invitation link that:
- Works for anyone with the link
- Has an expiration date (default: 7 days)
- Can be revoked at any time
- Specifies a default role for acceptors

## Managing Team Members

As an Owner or Admin, you can:

### Update Member Role
- Click on a member's name
- Select a new role
- Confirm the change
- The member's permissions update immediately

### Remove a Member
- Click **Remove** next to the member
- Confirm removal
- The member loses access to team projects
- Team-owned data remains intact

### View Member Activity
- See when each member last accessed Scoriet
- View what projects they've worked on
- Monitor template usage by member

:::caution Removing Members
When you remove a member from a team, they:
- Lose access to all team projects
- Cannot see team projects in their library
- Retain personal projects they created
- Cannot access shared data through the team
:::

## Team Notifications

Team members receive notifications for:

- **New Project** — When a team project is created
- **Project Update** — When a team project is modified
- **Member Invitation** — When added to a team
- **Role Changed** — When your team role is updated
- **Member Left** — When a team member is removed
- **Team Deleted** — When a team is archived or deleted

You can customize notification preferences in your **Settings** → **Notifications**.

## Team Limitations and Quotas

Different Scoriet plans have different team features:

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Teams Created | 1 | 5 | Unlimited |
| Members per Team | 5 | 25 | Unlimited |
| Projects per Team | 10 | 100 | Unlimited |
| Public Invites | No | Yes | Yes |
| Team Analytics | No | Basic | Advanced |
| Custom Roles | No | No | Yes |

:::note
Check your current plan's limits in **Settings** → **Plan & Billing**.
:::

## Best Practices

:::tip Organize by Purpose
Create teams based on logical divisions:
- By department: Frontend, Backend, DevOps
- By project: ProjectA, ProjectB
- By geography: Americas Team, EMEA Team
- By feature: Authentication, Payments, Admin
:::

:::info Use Descriptive Names
Team names should be clear and immediately understandable to new members. Avoid cryptic abbreviations or temporary-sounding names.
:::

:::tip Manage Invitations Wisely
- Review who you're inviting and their expected role
- Use public invites for growing teams
- Revoke old invitation links you no longer need
- Monitor unused invitations

:::caution Principle of Least Privilege
- Give members only the minimum role they need
- Start with Viewer role and promote as needed
- Regularly audit member roles and remove inactive members
- Only make people Owners if they truly need that power

:::

## Troubleshooting

### Team Member Can't See Projects
1. Check the member's role — Viewers have limited access
2. Verify the project is assigned to the team
3. Check project-level permissions (may be set more restrictively)
4. Ask a team Owner/Admin to verify member access

### Invitation Not Received
1. Check spam/junk email folder
2. Verify the email address is correct
3. Ask inviter to resend or generate a new link
4. Try joining with the invitation link instead

### Can't Delete a Team Member
You likely need Owner or Admin role. Contact the team Owner if you can't manage members.

## Next Steps

- **[Roles and Permissions](./roles-permissions.md)** — Detailed permission reference
- **[Inviting Team Members](./invitations.md)** — Complete guide to invitations
- **[User Guide Home](/docs)** — Back to main documentation

