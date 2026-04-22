---
slug: /developer
sidebar_position: 1
title: Developer Introduction
---

# Developer Documentation

Scoriet is an **Enterprise SaaS Code Generator** that automates repetitive development tasks through intelligent templating and code generation. Built as a complete modern rewrite of a legacy WinDev application, it combines a powerful multi-database SQL parser with a flexible template engine to help development teams create consistent, high-quality code faster.

![Scoriet Landing Page](/img/screenshots/landing-page.png)
*The Scoriet landing page showcasing key features and call-to-action buttons*

## What is Scoriet?

Scoriet is a professional-grade code generation platform designed for enterprise development teams. Rather than writing boilerplate code manually, developers can:

- **Parse Database Schemas** - Automatically analyze MySQL, PostgreSQL, MSSQL, SQLite, and Firebird databases
- **Design Code Templates** - Create reusable template patterns with loops, conditionals, and JavaScript execution
- **Generate Code** - Transform database structures into complete, production-ready code artifacts
- **Collaborate in Teams** - Work together with team members using integrated team management
- **Manage Projects** - Organize generators, templates, and deployments across multiple projects
- **Deploy Seamlessly** - Push generated code directly via Git, FTP, or SSH integration

## Key Features

### Core Generation Engine
- **Multi-Database SQL Parser** - Support for MySQL, PostgreSQL, MSSQL, SQLite, and Firebird with intelligent schema analysis
- **Template System** - Powerful templating language with loops, conditionals, variable substitution, and JavaScript execution blocks
- **Client-Side Processing** - All template processing happens in the browser for security and performance
- **Form Designer** - Create custom forms for gathering generator parameters
- **Report Designer** - Build flexible report templates for documentation

### Team & Collaboration
- **Team Management** - Create teams, manage members, control access levels
- **Real-Time Messaging** - Integrated messaging system using WebSockets via Laravel Reverb
- **Version Control Integration** - Direct Git integration for deployment workflows
- **Kanban Boards** - Organize work and track project progress

### Enterprise Ready
- **Stripe & PayPal Integration** - Flexible payment options for SaaS billing
- **OAuth2 Authentication** - Secure user authentication via Laravel Passport
- **Internationalization (i18n)** - Multi-language support for global teams
- **Template Marketplace** - Share and discover templates in the community store
- **Deployment Options** - Deploy via Git, FTP, or SSH with one click

## Technology Stack

Scoriet is built on modern, proven technologies:

- **Backend**: Laravel 12 with PHP 8.2+
- **Frontend**: React 19 with TypeScript
- **Real-Time**: Laravel Reverb (WebSockets)
- **UI Framework**: rc-dock (MDI interface) + PrimeReact 10 + Ant Design Icons
- **Styling**: Tailwind CSS 4.0
- **Build Tool**: Vite 7.0
- **Code Editing**: CodeMirror
- **Database**: MySQL (with support for multiple database systems)
- **Testing**: Pest PHP
- **Package Manager**: npm + Composer

## Architecture Highlights

### Modern MDI Interface
Scoriet uses a **Multi-Document Interface (MDI)** built with rc-dock, providing an intuitive workspace where developers can organize multiple panels, windows, and tools simultaneously. All 57 panels are lazy-loaded using React.lazy() for optimal performance.

### OAuth2 Authentication
User authentication is powered by **Laravel Passport**, implementing the OAuth2 password grant flow. JWT tokens are securely stored in localStorage with automatic refresh capability.

### Modular Component Architecture
- Clean separation between backend (Laravel) and frontend (React)
- Inertia.js 2 bridges the gap with seamless monolithic development
- Components are organized by function: panels, modals, utilities, and common components
- Hotkey system (Alt+key combinations) for rapid panel navigation

### Scalable Deployment
- Multiple database backend support
- Environment-based configuration
- Containerization-ready structure
- Built-in payment processing for SaaS operations

## Who Should Use Scoriet?

Scoriet is ideal for:

- **Enterprise Development Teams** - Standardize code generation across large organizations
- **Software Agencies** - Accelerate project delivery through template reuse
- **SaaS Platforms** - Offer code generation as a value-added service
- **Legacy System Modernization** - Generate modern code from existing database schemas
- **Development Tool Vendors** - Integrate with custom workflows

## Getting Started

Choose your path:

- **New to Scoriet?** Start with the [Architecture Overview](./architecture/overview.md) to understand the system design
- **Want to develop?** Check the [Tech Stack](./architecture/tech-stack.md) and [Project Structure](./architecture/project-structure.md)
- **Need authentication details?** See the [Authentication Guide](./architecture/authentication.md)
- **Ready to install?** Head to the [Setup Guide](./development/setup.md)

## License

Scoriet is licensed under **AGPL-3.0-or-later**, ensuring that all modifications and enhancements remain open source and available to the community.

## Support & Community

Scoriet is an active project with continuous development and improvements. For questions, bug reports, or feature requests, please engage with the community or contact the development team.

---

**Let's build amazing code generators together!** 🚀
