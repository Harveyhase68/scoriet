<?php

/*
 * Content of the public home page (resources/views/public/home.blade.php).
 * Lists are rendered in order; icons and screenshots are assigned in the view.
 * Keep the five languages structurally identical (same keys, same list lengths).
 */

return [
    'hero_eyebrow' => 'Open source · Template-driven RAD · Built for the AI era',
    'hero_points' => [
        'C#, Java, Laravel, PHP, Rust, Flutter and more',
        'Login with 2FA / MFA included',
        'Free and open source on GitHub',
    ],
    'pipeline' => ['Database schema', 'Template', 'Complete app', 'AI builds on it'],

    'problem_kicker' => 'The problem',
    'problem_title' => 'Every new app starts with the same weeks of groundwork',
    'problem_text' => 'Login, user management, database tables, forms, lists, search windows, reports – before a single line of real business logic is written, days or weeks are gone. AI coding assistants start from zero, too: they re-invent the same basics in every session, burn tokens and money, and deliver a different structure every time.',
    'problem_items' => [
        'Weeks spent on master data before the real work starts',
        'AI starts from scratch every time – expensive and inconsistent',
        'Every project is built differently, maintenance gets harder',
    ],

    'solution_kicker' => 'The solution',
    'solution_title' => 'Scoriet builds the foundation. AI builds on it.',
    'solution_text' => 'Scoriet is a template-driven application generator (RAD). From your database schema it generates a complete, working application – with login, database administration, tables, forms, reports and search windows. Your AI assistant then continues on a clean, consistent codebase instead of an empty folder. That saves time, tokens and money: a single developer can finish a complete app in days instead of weeks.',

    'compare_title' => 'AI from zero vs. AI on a Scoriet foundation',
    'compare_bad_title' => 'AI starting from an empty folder',
    'compare_bad' => [
        'Generates login, tables and forms again – token by token',
        'Structure changes from session to session',
        'Days to weeks until the basics work',
        'High token costs before any business logic exists',
    ],
    'compare_good_title' => 'AI building on a Scoriet app',
    'compare_good' => [
        'Login with 2FA, tables, forms and reports already exist',
        'Consistent architecture from proven templates',
        'Business logic from day one',
        'Tokens are spent where they create value',
    ],

    'steps_kicker' => 'How it works',
    'steps_title' => 'From database schema to finished application in four steps',
    'steps' => [
        ['title' => 'Design or import your database', 'text' => 'Import an existing MySQL schema or model tables and fields in the built-in database designer. Field captions and the schema itself can be translated.'],
        ['title' => 'Choose a template', 'text' => 'Pick a template for C#, Java / Spring Boot, Laravel, PHP, Rust, Flutter and more – or write your own. Templates define exactly which code is generated.'],
        ['title' => 'Generate the complete app', 'text' => 'Scoriet generates a full application: login with 2FA / OTP / MFA and database administration with tables, forms, reports and search windows – multilingual if you want.'],
        ['title' => 'Continue with AI – or by hand', 'text' => 'Hand the generated project to your AI assistant or your team and focus on what makes your application unique.'],
    ],

    'generated_kicker' => 'Included in every generated app',
    'generated_title' => 'What your application already contains after generation',
    'generated_items' => [
        'Login and user management with 2FA / OTP / MFA',
        'Database administration for all tables',
        'Input forms with validation',
        'Lists and tables with sorting and paging',
        'Search windows and filters',
        'Reports',
        'Multilingual user interface',
        'Clean, readable source code that belongs to you',
    ],

    'tech_kicker' => 'One schema, many platforms',
    'tech_title' => 'Generate for the language and framework you need',
    'tech_text' => 'The same database schema becomes a web, desktop or mobile application. Because Scoriet is completely template-based, any other language or framework can be added with your own templates.',
    'tech_more' => 'and your own templates',

    'lifecycle_kicker' => 'After generation',
    'lifecycle_title' => 'Not just generate once – maintain and evolve',
    'lifecycle_text' => 'Real projects change. Scoriet supports the whole workflow after the first generation.',
    'lifecycle' => [
        ['title' => 'Deploy via FTP and CLI', 'text' => 'Upload generated projects directly to your server or integrate them into your build with the CLI service.'],
        ['title' => 'Compare changes', 'text' => 'See which generated files were modified by hand and compare them file by file.'],
        ['title' => 'Reverse engineering', 'text' => 'Manual changes are taken back into the generation, so they survive the next run.'],
        ['title' => 'Database migrations', 'text' => 'Scoriet generates the SQL script that updates your database from schema version 1 to version 2.'],
    ],

    'features_kicker' => 'Everything in one studio',
    'features_title' => 'All the tools you need, in your browser',
    'features' => [
        ['title' => 'Database designer', 'text' => 'Model tables, fields and relations visually or import existing SQL.'],
        ['title' => 'Visual form editor', 'text' => 'Arrange input forms by drag & drop – the layout is used for generation.'],
        ['title' => 'Report editor', 'text' => 'Design reports visually and generate them together with the app.'],
        ['title' => 'Window editor', 'text' => 'Design windows based on a single table – the basis for migrating WinDev applications to Scoriet.'],
        ['title' => 'Teams', 'text' => 'Work on projects together, with roles and invitations.'],
        ['title' => 'Kanban project management', 'text' => 'Plan and track the work on your project right next to the code.'],
        ['title' => 'Internal messaging', 'text' => 'Talk to your team without leaving the studio.'],
        ['title' => 'Translations built in', 'text' => 'Scoriet itself speaks five languages and generates multilingual applications, including a translated schema.'],
        ['title' => 'Template import & export', 'text' => 'Share templates between projects, teams and installations.'],
        ['title' => 'Template store', 'text' => 'Buy and sell templates – checked for malicious code before they are released.'],
    ],

    'trust_kicker' => 'Open source',
    'trust_title' => 'Open source and safe by design',
    'trust_text' => 'Scoriet is open source and freely available on GitHub. Templates can be imported, exported and even sold in the Scoriet template store. Every template and every change is automatically scanned for malicious code and reviewed by the community before it is released – so nobody can hijack your application or your development environment.',
    'trust_github' => 'View on GitHub',

    'faq_title' => 'Frequently asked questions',
    'faq' => [
        ['q' => 'What is Scoriet?', 'a' => 'Scoriet is an open-source, template-driven application and code generator (RAD tool). It turns a database schema into a complete application with login, database administration, forms, reports and search windows.'],
        ['q' => 'Which languages and frameworks can Scoriet generate?', 'a' => 'Templates exist for C#, Java / Spring Boot, Laravel / PHP, Rust, Flutter, React and more. Because generation is completely template-based, any language or framework can be added with your own templates.'],
        ['q' => 'How does Scoriet work together with AI coding assistants?', 'a' => 'Scoriet generates the foundation – login, data model, forms, lists and reports. Your AI assistant then builds the business logic on top of it instead of starting from an empty folder. This saves tokens, time and money and keeps the architecture consistent.'],
        ['q' => 'Can I change the generated code?', 'a' => 'Yes, the code belongs to you. Scoriet shows which files you have changed, lets you compare them and can take your changes back into the next generation via reverse engineering.'],
        ['q' => 'Is Scoriet free?', 'a' => 'Scoriet is open source and can be downloaded from GitHub. The hosted version at scoriet.dev has a free plan to get started.'],
        ['q' => 'Are templates from the store safe?', 'a' => 'Templates in the store are automatically checked for malicious code and reviewed by the community. Every change has to be approved before it is released.'],
    ],
];
