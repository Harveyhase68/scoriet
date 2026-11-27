<?php

/*
 * Contenido de la página de inicio pública (resources/views/public/home.blade.php).
 * Mantener los cinco idiomas estructuralmente idénticos (mismas claves, mismas longitudes de listas).
 */

return [
    'hero_eyebrow' => 'Open source · RAD basado en plantillas · Hecho para la era de la IA',
    'hero_points' => [
        'C#, Java, Laravel, PHP, Rust, Flutter y más',
        'Inicio de sesión con 2FA / MFA incluido',
        'Gratis y open source en GitHub',
    ],
    'pipeline' => ['Esquema de base de datos', 'Plantilla', 'App completa', 'La IA construye encima'],

    'problem_kicker' => 'El problema',
    'problem_title' => 'Cada nueva app empieza con las mismas semanas de trabajo básico',
    'problem_text' => 'Inicio de sesión, gestión de usuarios, tablas, formularios, listas, ventanas de búsqueda, informes: antes de escribir la primera línea de lógica de negocio ya han pasado días o semanas. Los asistentes de programación con IA también empiezan de cero: reinventan las mismas bases en cada sesión, gastan tokens y dinero y entregan cada vez una estructura distinta.',
    'problem_items' => [
        'Semanas dedicadas a los datos maestros antes del trabajo real',
        'La IA empieza de cero cada vez: caro e inconsistente',
        'Cada proyecto se construye de forma distinta y el mantenimiento se complica',
    ],

    'solution_kicker' => 'La solución',
    'solution_title' => 'Scoriet construye la base. La IA construye encima.',
    'solution_text' => 'Scoriet es un generador de aplicaciones basado en plantillas (RAD). A partir de tu esquema de base de datos genera una aplicación completa y funcional, con inicio de sesión, administración de la base de datos, tablas, formularios, informes y ventanas de búsqueda. Después, tu asistente de IA continúa sobre un código limpio y coherente en lugar de una carpeta vacía. Ahorras tiempo, tokens y dinero: un solo desarrollador termina una app completa en pocos días en lugar de semanas.',

    'compare_title' => 'IA desde cero vs. IA sobre una base de Scoriet',
    'compare_bad_title' => 'La IA empieza con una carpeta vacía',
    'compare_bad' => [
        'Vuelve a generar login, tablas y formularios, token a token',
        'La estructura cambia de una sesión a otra',
        'Días o semanas hasta que lo básico funciona',
        'Altos costes en tokens antes de tener lógica de negocio',
    ],
    'compare_good_title' => 'La IA construye sobre una app de Scoriet',
    'compare_good' => [
        'Login con 2FA, tablas, formularios e informes ya existen',
        'Arquitectura coherente a partir de plantillas probadas',
        'Lógica de negocio desde el primer día',
        'Los tokens se gastan donde aportan valor',
    ],

    'steps_kicker' => 'Cómo funciona',
    'steps_title' => 'Del esquema de base de datos a la aplicación terminada en cuatro pasos',
    'steps' => [
        ['title' => 'Diseña o importa tu base de datos', 'text' => 'Importa un esquema MySQL existente o modela tablas y campos en el diseñador de bases de datos integrado. Las etiquetas de los campos y el propio esquema se pueden traducir.'],
        ['title' => 'Elige una plantilla', 'text' => 'Elige una plantilla para C#, Java / Spring Boot, Laravel, PHP, Rust, Flutter y más, o escribe la tuya. Las plantillas definen exactamente qué código se genera.'],
        ['title' => 'Genera la app completa', 'text' => 'Scoriet genera una aplicación completa: inicio de sesión con 2FA / OTP / MFA y administración de la base de datos con tablas, formularios, informes y ventanas de búsqueda, multilingüe si lo deseas.'],
        ['title' => 'Continúa con IA o a mano', 'text' => 'Entrega el proyecto generado a tu asistente de IA o a tu equipo y céntrate en lo que hace única tu aplicación.'],
    ],

    'generated_kicker' => 'Incluido en cada app generada',
    'generated_title' => 'Lo que tu aplicación ya contiene después de la generación',
    'generated_items' => [
        'Inicio de sesión y gestión de usuarios con 2FA / OTP / MFA',
        'Administración de la base de datos para todas las tablas',
        'Formularios de entrada con validación',
        'Listas y tablas con ordenación y paginación',
        'Ventanas de búsqueda y filtros',
        'Informes',
        'Interfaz de usuario multilingüe',
        'Código fuente limpio y legible que te pertenece',
    ],

    'tech_kicker' => 'Un esquema, muchas plataformas',
    'tech_title' => 'Genera para el lenguaje y el framework que necesites',
    'tech_text' => 'El mismo esquema de base de datos se convierte en una aplicación web, de escritorio o móvil. Como Scoriet se basa por completo en plantillas, cualquier otro lenguaje o framework se puede añadir con tus propias plantillas.',
    'tech_more' => 'y tus propias plantillas',

    'lifecycle_kicker' => 'Después de la generación',
    'lifecycle_title' => 'No solo generar una vez: mantener y evolucionar',
    'lifecycle_text' => 'Los proyectos reales cambian. Scoriet acompaña todo el flujo de trabajo después de la primera generación.',
    'lifecycle' => [
        ['title' => 'Despliegue por FTP y CLI', 'text' => 'Sube los proyectos generados directamente a tu servidor o intégralos en tu build con el servicio CLI.'],
        ['title' => 'Comparar cambios', 'text' => 'Ve qué archivos generados se modificaron a mano y compáralos archivo por archivo.'],
        ['title' => 'Ingeniería inversa', 'text' => 'Los cambios manuales se reincorporan a la generación y sobreviven a la siguiente ejecución.'],
        ['title' => 'Migraciones de base de datos', 'text' => 'Scoriet genera el script SQL que actualiza tu base de datos de la versión 1 a la versión 2 del esquema.'],
    ],

    'features_kicker' => 'Todo en un solo estudio',
    'features_title' => 'Todas las herramientas que necesitas, en tu navegador',
    'features' => [
        ['title' => 'Diseñador de bases de datos', 'text' => 'Modela visualmente tablas, campos y relaciones o importa SQL existente.'],
        ['title' => 'Editor visual de formularios', 'text' => 'Organiza formularios arrastrando y soltando; el diseño se usa en la generación.'],
        ['title' => 'Editor de informes', 'text' => 'Diseña informes visualmente y genéralos junto con la app.'],
        ['title' => 'Editor de ventanas', 'text' => 'Diseña ventanas basadas en una sola tabla: la base para migrar aplicaciones WinDev a Scoriet.'],
        ['title' => 'Equipos', 'text' => 'Trabaja en proyectos en equipo, con roles e invitaciones.'],
        ['title' => 'Gestión de proyectos Kanban', 'text' => 'Planifica y sigue el trabajo del proyecto justo al lado del código.'],
        ['title' => 'Mensajería interna', 'text' => 'Habla con tu equipo sin salir del estudio.'],
        ['title' => 'Traducciones integradas', 'text' => 'Scoriet habla cinco idiomas y genera aplicaciones multilingües, incluido el esquema traducido.'],
        ['title' => 'Importar y exportar plantillas', 'text' => 'Comparte plantillas entre proyectos, equipos e instalaciones.'],
        ['title' => 'Tienda de plantillas', 'text' => 'Compra y vende plantillas, revisadas contra código malicioso antes de publicarse.'],
    ],

    'trust_kicker' => 'Open source',
    'trust_title' => 'Open source y seguro por diseño',
    'trust_text' => 'Scoriet es open source y está disponible libremente en GitHub. Las plantillas se pueden importar, exportar e incluso vender en la tienda de plantillas de Scoriet. Cada plantilla y cada cambio se analizan automáticamente en busca de código malicioso y la comunidad los revisa antes de publicarse, así nadie puede secuestrar tu aplicación ni tu entorno de desarrollo.',
    'trust_github' => 'Ver en GitHub',

    'faq_title' => 'Preguntas frecuentes',
    'faq' => [
        ['q' => '¿Qué es Scoriet?', 'a' => 'Scoriet es un generador de aplicaciones y código open source basado en plantillas (herramienta RAD). Convierte un esquema de base de datos en una aplicación completa con inicio de sesión, administración de la base de datos, formularios, informes y ventanas de búsqueda.'],
        ['q' => '¿Para qué lenguajes y frameworks puede generar Scoriet?', 'a' => 'Hay plantillas para C#, Java / Spring Boot, Laravel / PHP, Rust, Flutter, React y más. Como la generación se basa por completo en plantillas, cualquier lenguaje o framework se puede añadir con tus propias plantillas.'],
        ['q' => '¿Cómo trabaja Scoriet con los asistentes de programación con IA?', 'a' => 'Scoriet genera la base: inicio de sesión, modelo de datos, formularios, listas e informes. Tu asistente de IA construye la lógica de negocio encima en lugar de empezar con una carpeta vacía. Así ahorras tokens, tiempo y dinero y mantienes una arquitectura coherente.'],
        ['q' => '¿Puedo modificar el código generado?', 'a' => 'Sí, el código te pertenece. Scoriet muestra qué archivos has cambiado, permite compararlos y puede incorporar tus cambios a la siguiente generación mediante ingeniería inversa.'],
        ['q' => '¿Scoriet es gratis?', 'a' => 'Scoriet es open source y se puede descargar desde GitHub. La versión alojada en scoriet.dev tiene un plan gratuito para empezar.'],
        ['q' => '¿Son seguras las plantillas de la tienda?', 'a' => 'Las plantillas de la tienda se revisan automáticamente contra código malicioso y las examina la comunidad. Cada cambio debe aprobarse antes de publicarse.'],
    ],
];
