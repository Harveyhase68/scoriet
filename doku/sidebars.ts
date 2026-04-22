import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  userGuideSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/registration',
        'getting-started/login',
        'getting-started/first-project',
        'getting-started/quick-tour',
      ],
    },
    {
      type: 'category',
      label: 'Workspace & Interface',
      collapsed: false,
      items: [
        'workspace/overview',
        'workspace/navigation',
        'workspace/dock-panels',
        'workspace/keyboard-shortcuts',
        'workspace/dark-mode',
      ],
    },
    {
      type: 'category',
      label: 'Project Management',
      collapsed: false,
      items: [
        'projects/overview',
        'projects/create-project',
        'projects/project-settings',
        'projects/git-integration',
        'projects/import-export',
      ],
    },
    {
      type: 'category',
      label: 'Database Management',
      collapsed: false,
      items: [
        'database/overview',
        'database/connect-database',
        'database/schema-explorer',
        'database/sql-import',
        'database/field-properties',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      items: [
        'features/form-designer',
        'features/report-designer',
        'features/kanban-board',
        'features/messaging',
        'features/template-store',
        'features/translations',
        'features/deployment',
      ],
    },
    {
      type: 'category',
      label: 'Team & Collaboration',
      items: [
        'team/overview',
        'team/roles-permissions',
        'team/invitations',
      ],
    },
    {
      type: 'category',
      label: 'CLI & Local Service',
      items: [
        'tools/cli-overview',
        'tools/local-service',
        'tools/automation',
      ],
    },
  ],

  templateRefSidebar: [
    {
      type: 'category',
      label: 'Template Management',
      collapsed: false,
      items: [
        'templates/overview',
        'templates/create-template',
        'templates/template-files',
        'templates/variables',
        'templates/versioning',
      ],
    },
    {
      type: 'category',
      label: 'Code Generator',
      collapsed: false,
      items: [
        'code-generator/overview',
        'code-generator/template-syntax',
        'code-generator/loops',
        'code-generator/conditionals',
        'code-generator/functions',
        'code-generator/javascript-code-blocks',
        'code-generator/includes',
        'code-generator/generation-workflow',
      ],
    },
    {
      type: 'category',
      label: 'Gtree Reference',
      collapsed: false,
      items: [
        'gtree/overview',
        'gtree/project-level',
        'gtree/table-level',
        'gtree/field-level',
        'gtree/constraint-level',
        'gtree/language-data',
        'gtree/practical-examples',
      ],
    },
  ],

  developerSidebar: [
    'developer/intro',
    {
      type: 'category',
      label: 'Architecture',
      collapsed: false,
      items: [
        'developer/architecture/overview',
        'developer/architecture/tech-stack',
        'developer/architecture/project-structure',
        'developer/architecture/authentication',
      ],
    },
    {
      type: 'category',
      label: 'Database',
      collapsed: false,
      items: [
        'developer/database/overview',
        'developer/database/erd',
        'developer/database/core-tables',
        'developer/database/schema-tables',
        'developer/database/template-tables',
        'developer/database/project-tables',
        'developer/database/feature-tables',
      ],
    },
    {
      type: 'category',
      label: 'Backend',
      collapsed: false,
      items: [
        'developer/backend/controllers',
        'developer/backend/api-controllers',
        'developer/backend/services',
        'developer/backend/models',
        'developer/backend/api-routes',
      ],
    },
    {
      type: 'category',
      label: 'Frontend',
      collapsed: false,
      items: [
        'developer/frontend/overview',
        'developer/frontend/dock-layout',
        'developer/frontend/panels',
        'developer/frontend/components',
        'developer/frontend/contexts-and-state',
      ],
    },
    {
      type: 'category',
      label: 'Code Generator',
      collapsed: false,
      items: [
        'developer/generator/template-engine',
        'developer/generator/sql-parser',
        'developer/generator/code-generation-flow',
        'developer/generator/template-syntax',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      collapsed: false,
      items: [
        'developer/features/form-designer',
        'developer/features/report-designer',
        'developer/features/kanban',
        'developer/features/messaging',
        'developer/features/template-store',
        'developer/features/deployment',
        'developer/features/translations',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      items: [
        'developer/development/setup',
        'developer/development/commands',
        'developer/development/conventions',
      ],
    },
  ],
};

export default sidebars;
