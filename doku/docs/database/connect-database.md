---
sidebar_position: 2
title: Connecting a Database
---

# Connecting a Database

Connecting a database to Scoriet is the first step in setting up your schema for code generation. Whether you're working with MySQL, PostgreSQL, SQLite, or MS-SQL Server, the connection process is straightforward and secure.

## Adding a New Database Connection

To add a database connection to your Scoriet project:

1. **Navigate to the Database Panel** - Look for the database icon in the left sidebar or dock
2. **Click "Add Connection"** or the "+" button in the Database panel
3. **Select Your Database Type** - Choose from the supported databases
4. **Enter Connection Details** - Fill in the required information
5. **Test the Connection** - Verify your credentials work
6. **Save** - Store the connection for future use

<div class="screenshot-placeholder">Screenshot: Add database connection dialog with database type selector — <code>add-connection.png</code></div>

## Connection Settings by Database Type

### MySQL

```
Server/Host:     localhost (or your server IP/domain)
Port:            3306 (default)
Username:        root (or your MySQL user)
Password:        [your password]
Database:        [your database name]
SSL:             Optional (recommended for remote connections)
```

:::tip
For local development on Windows, use `localhost` or `127.0.0.1`. If connecting to a remote server, ensure firewall rules allow MySQL port access (port 3306 by default).
:::

### PostgreSQL

```
Server/Host:     localhost (or your server IP/domain)
Port:            5432 (default)
Username:        postgres (or your PostgreSQL user)
Password:        [your password]
Database:        [your database name]
SSL Mode:        prefer (or require for secure connections)
```

PostgreSQL is known for robust data integrity and advanced features. Scoriet fully supports PostgreSQL-specific syntax including array types, UUID columns, and advanced constraints.

### SQLite

```
File Path:       /path/to/your/database.db
```

SQLite is file-based and requires no server. Simply point to your `.db` file. This is ideal for development, testing, and embedded applications.

:::info
SQLite databases are stored as single files on your computer. Make sure to maintain backups!
:::

### MS-SQL Server

```
Server/Host:     servername (or IP address)
Port:            1433 (default)
Username:        sa (or your SQL Server user)
Password:        [your password]
Database:        [your database name]
Authentication:  SQL Server Authentication or Windows Authentication
Encrypt:         Optional (recommended)
Trust Server:    false (for production)
```

MS-SQL Server offers enterprise-level features. Scoriet supports T-SQL syntax and SQL Server-specific features.

## Testing Your Connection

After entering credentials, always test the connection:

1. **Click "Test Connection"** button
2. **Wait for confirmation** - Scoriet will attempt to connect
3. **Review any errors** - Common issues:
   - Wrong port number
   - Firewall blocking connection
   - Invalid credentials
   - Database server not running

A successful test will show a green checkmark and "Connection Successful" message.

:::caution
Never use `sa` (SQL Server admin) accounts in production. Create a dedicated user with only necessary permissions for code generation access.
:::

## Connection Security

Scoriet takes security seriously:

- **Encrypted Storage**: Credentials are encrypted before being stored
- **SSL Support**: Enable SSL/TLS encryption for remote connections
- **No Plaintext**: Passwords are never displayed in logs or exported data
- **Local Processing**: Your actual database data stays on your computer during schema analysis

:::info
For sensitive production databases, create a read-only database user specifically for schema inspection. This limits what could happen if credentials were compromised.
:::

## Managing Multiple Connections

You can maintain multiple database connections for different projects or environments:

- **Development**: Local MySQL instance
- **Staging**: Remote PostgreSQL server
- **Archive**: SQLite file from an old project

Each connection is independent and can be activated, edited, or deleted from the Database panel. Switch between connections when working on different projects.

<div class="screenshot-placeholder">Screenshot: Connection list showing multiple database connections — <code>connection-list.png</code></div>

### Editing Connections

To modify a connection:

1. **Right-click the connection** in the list
2. **Select "Edit"**
3. **Update the settings**
4. **Test again** before saving (optional but recommended)
5. **Click "Save"**

### Deleting Connections

To remove a connection you no longer need:

1. **Right-click the connection**
2. **Select "Delete"**
3. **Confirm the deletion**

:::caution
Deleting a connection is permanent and cannot be undone. Any templates or generators using this connection will need to be updated to use a different database.
:::

## Troubleshooting Connection Issues

### "Connection Refused"
- Verify the database server is running
- Check if the server is listening on the correct port
- Confirm firewall rules allow the connection

### "Authentication Failed"
- Double-check your username and password
- Ensure the user has appropriate permissions
- For MySQL, verify the user exists and has access from your host

### "Unknown Host"
- Check the server hostname or IP address is correct
- Verify DNS resolution (if using a domain name)
- For local connections, try `127.0.0.1` instead of `localhost`

### "Connection Timeout"
- The database server may be overloaded
- Network latency might be too high
- Firewall may be blocking the connection

## What's Next?

Once your connection is established and tested, explore your database structure using the [Schema Explorer](./schema-explorer.md), or import SQL schemas directly with [SQL Import](./sql-import.md).

