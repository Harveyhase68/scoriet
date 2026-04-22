---
sidebar_position: 2
title: Technology Stack
---

# Technology Stack

Scoriet is built on a carefully curated selection of modern, production-ready technologies. Each component was chosen for reliability, performance, community support, and long-term viability.

## Backend Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Laravel** | 12.x | Full-stack PHP web framework, handles routing, middleware, database ORM |
| **PHP** | 8.2+ | Server-side language, strong typing, modern syntax features |
| **Composer** | Latest | PHP dependency management and package installation |

**Why Laravel 12?**
- Mature, battle-tested framework with excellent documentation
- Built-in authentication, authorization, and API scaffolding
- Eloquent ORM eliminates raw SQL complexity
- Artisan CLI provides powerful development tools
- Strong community and extensive package ecosystem

### Authentication & Security
| Technology | Version | Purpose |
|------------|---------|---------|
| **Laravel Passport** | Latest | OAuth2 server implementation, token management |
| **JWT (JSON Web Tokens)** | Via Passport | Stateless authentication, token-based API security |
| **bcrypt** | Built-in | Password hashing algorithm |
| **CORS Middleware** | Built-in | Cross-origin resource sharing protection |

**Authentication Flow:**
- Password Grant OAuth2 flow for desktop-style login
- JWT tokens issued on successful authentication
- Automatic token refresh mechanism
- API guard configuration for protected routes

### Database & ORM
| Technology | Version | Purpose |
|------------|---------|---------|
| **MySQL** | 5.7+ / 8.0 | Primary relational database |
| **Eloquent ORM** | Via Laravel | Object-relational mapping, query builder |
| **Database Migrations** | Via Laravel | Schema versioning and evolution |
| **Query Caching** | Optional | Performance optimization layer |

**Database Support:**
- **MySQL**: Full support (primary)
- **PostgreSQL**: Full parser support
- **MSSQL**: Enterprise SQL Server support
- **SQLite**: Development and testing
- **Firebird**: Legacy system compatibility

### Real-Time Communication
| Technology | Version | Purpose |
|------------|---------|---------|
| **Laravel Reverb** | Latest | WebSocket server for real-time features |
| **Broadcasting** | Via Laravel | Event broadcasting to connected clients |
| **Redis** | Optional | Message queue and broadcasting backend |
| **Pusher Protocol** | Compatible | Standard WebSocket protocol support |

**Use Cases:**
- Live notifications and alerts
- Real-time team messaging
- Collaborative feature updates
- Presence awareness (who's online)

### Code Generation & Parsing
| Technology | Version | Purpose |
|------------|---------|---------|
| **Custom SQL Parser** | Native | Database schema analysis and extraction |
| **Tokenizer** | Native | SQL statement tokenization |
| **AST (Abstract Syntax Tree)** | Native | Structured code representation |
| **Code Generator Service** | Native | Template-based code generation |

**Parser Capabilities:**
- Table, column, constraint extraction
- Index and key relationship mapping
- Data type normalization across databases
- Comment and documentation preservation

### Utilities & Services
| Technology | Version | Purpose |
|------------|---------|---------|
| **Stripe SDK** | Latest | Payment processing integration |
| **PayPal SDK** | Latest | Alternative payment gateway |
| **Git API** | Via GitPHP | Git repository interaction |
| **SSH/FTP Libraries** | Latest | Deployment automation |

## Frontend Stack

### Core Framework & Language
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.x | UI component library and state management |
| **TypeScript** | 5.x+ | Type-safe JavaScript superset |
| **Inertia.js** | 2.0 | Server-driven React application bridge |
| **Vite** | 7.0 | Modern build tool and dev server |

**Why This Combination?**
- React 19: Latest hooks API, concurrent rendering, automatic batching
- TypeScript: Catch errors at compile-time, improved IDE support
- Inertia.js: Single codebase with Laravel, shared state, no JSON API overhead
- Vite: Extremely fast HMR (Hot Module Replacement), near-instant builds

### UI Component Libraries
| Technology | Version | Purpose |
|------------|---------|---------|
| **PrimeReact** | 10.x | Professional component library (tables, forms, dialogs) |
| **rc-dock** | Latest | Multi-Document Interface (MDI) workspace layout |
| **Ant Design Icons** | Latest | Icon library (comprehensive icon set) |
| **Tailwind CSS** | 4.0 | Utility-first CSS framework for styling |

**Component Strategy:**
- **rc-dock**: Main workspace container with floating/docking panels
- **PrimeReact**: Data-heavy components (DataTable, Form, Dialog, etc.)
- **Custom Components**: Specialized domain-specific UI elements
- **Tailwind**: Consistent styling across all components

### Code Editing & Visualization
| Technology | Version | Purpose |
|------------|---------|---------|
| **CodeMirror** | Latest | Syntax highlighting, code editing |
| **@xyflow/react** | Latest | Diagram and flowchart editor |
| **Quill** | Latest | Rich text editor for documentation |
| **Chart.js** | Latest | Data visualization and graphing |

**Use Cases:**
- SQL query editor with syntax highlighting
- Template code editing with preview
- Database diagram visualization
- Report generation and charting

### State Management & Utilities
| Technology | Version | Purpose |
|------------|---------|---------|
| **React Context API** | Built-in | Global state management |
| **useReducer Hook** | Built-in | Complex state logic |
| **localStorage API** | Browser | Client-side persistence (tokens, settings) |
| **react-hotkeys-hook** | Latest | Keyboard shortcut handling |

**State Management Pattern:**
- Inertia.js shared props for server state
- React Context for global UI state
- localStorage for client preferences and tokens
- No external Redux/Zustand (kept simple)

### Internationalization & Localization
| Technology | Version | Purpose |
|------------|---------|---------|
| **i18next** | Latest | Multi-language support |
| **i18next-browser-languagedetector** | Latest | Automatic language detection |
| **react-i18next** | Latest | React integration for i18n |

**Supported Languages:**
- English (primary)
- German (Deutsch)
- Extensible for additional languages

### Data & File Processing
| Technology | Version | Purpose |
|------------|---------|---------|
| **JSZip** | Latest | ZIP file generation and manipulation |
| **csv-parser** | Latest | CSV import and parsing |
| **FileSaver.js** | Latest | Client-side file download |
| **FormData API** | Browser | Multipart file uploads |

## Development Tools

### Build & Bundling
| Technology | Version | Purpose |
|------------|---------|---------|
| **Vite** | 7.0 | Build tool, dev server, module bundler |
| **Esbuild** | Via Vite | Ultra-fast JavaScript bundler |
| **Rollup** | Via Vite | Code splitting and optimization |

**Build Features:**
- HMR (Hot Module Replacement) for instant feedback
- Source maps for debugging production code
- Code splitting by route and component
- Minification and tree-shaking

### Code Quality
| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | Latest | JavaScript/TypeScript linting |
| **Prettier** | Latest | Code formatting (consistency) |
| **TypeScript** | 5.x+ | Type checking and validation |

**Commands:**
```bash
npm run lint      # Run ESLint with auto-fix
npm run format    # Run Prettier formatting
npm run types     # TypeScript type checking
```

### Testing Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Pest PHP** | Latest | Modern PHP testing framework |
| **PHPUnit** | Via Pest | Test runner and assertions |
| **Jest** | Available | JavaScript/React testing (optional) |
| **React Testing Library** | Available | Component testing (optional) |

## Infrastructure & Deployment

### Server Requirements
```
PHP:        8.2 or higher
MySQL:      5.7+ or 8.0+
Node.js:    18.x or higher (for npm)
Composer:   Latest version
npm:        9.x or higher
```

### Web Server Options
| Server | Status | Notes |
|--------|--------|-------|
| **Apache** | Recommended | Requires mod_rewrite enabled |
| **Nginx** | Recommended | Simpler config, better performance |
| **Laravel Herd** | Excellent | Local development (macOS/Linux) |
| **Laravel Sail** | Excellent | Docker-based development |

### Caching & Sessions
| Technology | Version | Purpose |
|------------|---------|---------|
| **Redis** | Optional | Session storage, cache backend, broadcasting |
| **File Cache** | Default | Development caching (file-based) |
| **Database Sessions** | Default | Fallback session storage |

### Environment Configuration
```
.env                    # Environment variables
.env.example            # Template for required variables
config/                 # Configuration files
database/               # Migrations and seeders
storage/                # File storage (logs, uploads)
```

## Key Dependencies Overview

### Backend Dependencies
```json
{
  "laravel/framework": "^12.0",
  "laravel/passport": "*",
  "laravel/reverb": "*",
  "stripe/stripe-php": "*",
  "paypal/checkout-sdk-php": "*",
  "githubalicesmith/php-git": "*"
}
```

### Frontend Dependencies
```json
{
  "react": "^19.0",
  "typescript": "^5.0",
  "@inertiajs/react": "^2.0",
  "primereact": "^10.0",
  "rc-dock": "latest",
  "codemirror": "^6.0",
  "@xyflow/react": "^12.0",
  "quill": "^2.0",
  "chart.js": "^4.0",
  "tailwindcss": "^4.0",
  "i18next": "^23.0"
}
```

## Version Management & Updates

### Deprecation Policy
- Major version updates: Announced 6 months in advance
- Security updates: Deployed within 24 hours
- Bug fixes: Released continuously
- Compatibility notes: Detailed in CHANGELOG.md

### Upgrade Path
- Semantic versioning (MAJOR.MINOR.PATCH)
- Changelog documents breaking changes
- Migration guides for major updates
- Backward compatibility maintained when possible

## Technology Justification Matrix

| Component | Alternative | Why Scoriet Chose It |
|-----------|-------------|---------------------|
| Laravel | Symfony, Django | Ecosystem, Passport, built-in features |
| React | Vue, Angular | Flexibility, component ecosystem, job market |
| Inertia.js | REST API | Monolithic simplicity, shared state |
| Vite | Webpack, Parcel | Speed, modern architecture, better DX |
| rc-dock | Custom MDI | Production-ready, feature-complete |
| PrimeReact | Material-UI, Chakra | Comprehensive, professional appearance |
| TypeScript | JavaScript | Type safety, refactoring confidence, IDE support |
| Tailwind | CSS Modules, SCSS | Consistency, rapid styling, small bundle size |

## Performance Benchmarks

### Frontend Performance Targets
- **Initial Load**: < 2 seconds (LCP)
- **Interaction Ready**: < 3 seconds (TTI)
- **Code Paint**: < 1.5 seconds (FCP)
- **Core Web Vitals**: All Green

### Backend Performance Targets
- **API Response Time**: < 200ms (p95)
- **Database Query Time**: < 50ms (median)
- **WebSocket Message Latency**: < 100ms

## Monitoring & Logging

### Application Monitoring
- **Laravel Telescope**: Development debugging (optional)
- **Sentry**: Error tracking and reporting
- **New Relic/DataDog**: APM and infrastructure monitoring

### Logging
- **Application Logs**: `storage/logs/laravel.log`
- **Web Server Logs**: Standard Apache/Nginx access logs
- **Database Logs**: Slow query logging (MySQL)

## Conclusion

Scoriet's technology stack represents a deliberate choice of modern, proven technologies that prioritize:

1. **Developer Experience**: Fast feedback loops, clear abstractions, strong typing
2. **Performance**: Optimized for speed at every layer
3. **Maintainability**: Well-documented, large community, long-term support
4. **Scalability**: Can grow from small to enterprise deployments
5. **Security**: Built-in protections against common vulnerabilities

This stack enables Scoriet to deliver professional-grade code generation tooling while remaining maintainable and extensible for years to come.

---

**Ready to dive deeper?** Check the [Project Structure](./project-structure.md) to understand how these technologies are organized in the codebase.
