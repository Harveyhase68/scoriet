import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Scoriet Documentation',
  tagline: 'Schema-to-Stack Studio — Create, Generate, Deploy',
  favicon: 'img/scoriet-icon.svg',

  future: {
    v4: true,
  },

  url: 'https://scoriet.com',
  baseUrl: '/docs/',

  organizationName: 'scoriet',
  projectName: 'scoriet-user-docs',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
    format: 'md',
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/scoriet-social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Scoriet Documentation',
      logo: {
        alt: 'Scoriet Logo',
        src: 'img/scoriet-logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'userGuideSidebar',
          position: 'left',
          label: 'User Guide',
        },
        {
          type: 'docSidebar',
          sidebarId: 'templateRefSidebar',
          position: 'left',
          label: 'Templates',
        },
        {
          type: 'docSidebar',
          sidebarId: 'developerSidebar',
          position: 'left',
          label: 'Developer',
        },
        {
          href: 'https://scoriet.com/',
          label: '← Back to Homepage',
          position: 'right',
          className: 'navbar-back-homepage',
        },
        {
          type: 'search',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'User Guide',
          items: [
            { label: 'Welcome', to: '/' },
            { label: 'Registration', to: '/getting-started/registration' },
            { label: 'Your First Project', to: '/getting-started/first-project' },
            { label: 'Quick Tour', to: '/getting-started/quick-tour' },
          ],
        },
        {
          title: 'Templates',
          items: [
            { label: 'Template Management', to: '/templates/overview' },
            { label: 'Code Generation', to: '/code-generator/overview' },
            { label: 'Template Syntax', to: '/code-generator/template-syntax' },
            { label: 'Gtree Reference', to: '/gtree/overview' },
          ],
        },
        {
          title: 'Developer',
          items: [
            { label: 'Introduction', to: '/developer' },
            { label: 'Architecture', to: '/developer/architecture/overview' },
            { label: 'Backend', to: '/developer/backend/controllers' },
            { label: 'Frontend', to: '/developer/frontend/overview' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'Homepage', href: 'https://scoriet.com/' },
            { label: 'Community', href: 'https://scoriet.com/forum/' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Scoriet. All rights reserved.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['php', 'bash', 'json', 'sql', 'typescript', 'java', 'csharp', 'python'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
