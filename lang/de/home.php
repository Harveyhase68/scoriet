<?php

/*
 * Inhalt der öffentlichen Startseite (resources/views/public/home.blade.php).
 * Listen werden in dieser Reihenfolge ausgegeben; Icons und Screenshots ordnet die View zu.
 * Alle fünf Sprachen strukturell identisch halten (gleiche Keys, gleiche Listenlängen).
 */

return [
    'hero_eyebrow' => 'Open Source · Template-gestütztes RAD · Gebaut für die KI-Ära',
    'hero_points' => [
        'C#, Java, Laravel, PHP, Rust, Flutter und mehr',
        'Login mit 2FA / MFA inklusive',
        'Kostenlos und Open Source auf GitHub',
    ],
    'pipeline' => ['Datenbankschema', 'Template', 'Komplette App', 'KI baut darauf auf'],

    'problem_kicker' => 'Das Problem',
    'problem_title' => 'Jede neue App beginnt mit denselben Wochen Grundlagenarbeit',
    'problem_text' => 'Login, Benutzerverwaltung, Datenbanktabellen, Formulare, Listen, Suchfenster, Reports – bevor die erste Zeile echter Geschäftslogik entsteht, sind Tage oder Wochen vergangen. Auch KI-Assistenten beginnen bei null: Sie erfinden in jeder Sitzung dieselben Grundlagen neu, verbrauchen Tokens und Geld und liefern jedes Mal eine andere Struktur.',
    'problem_items' => [
        'Wochen für Stammdaten, bevor die eigentliche Arbeit beginnt',
        'Die KI startet jedes Mal von vorne – teuer und uneinheitlich',
        'Jedes Projekt ist anders aufgebaut, die Wartung wird schwerer',
    ],

    'solution_kicker' => 'Die Lösung',
    'solution_title' => 'Scoriet legt das Fundament. Die KI baut darauf auf.',
    'solution_text' => 'Scoriet ist ein Template-gestützter Programmgenerator (RAD). Aus Ihrem Datenbankschema erzeugt Scoriet eine komplette, lauffähige Anwendung – mit Login, Datenbankverwaltung, Tabellen, Formularen, Reports und Suchfenstern. Ihr KI-Assistent setzt danach auf einer sauberen, einheitlichen Codebasis auf statt auf einem leeren Ordner. Das spart Zeit, Tokens und Geld: Ein einzelner Entwickler stellt eine komplette App in wenigen Tagen fertig statt in Wochen.',

    'compare_title' => 'KI ab null vs. KI auf einem Scoriet-Fundament',
    'compare_bad_title' => 'KI startet mit einem leeren Ordner',
    'compare_bad' => [
        'Erzeugt Login, Tabellen und Formulare erneut – Token für Token',
        'Die Struktur ändert sich von Sitzung zu Sitzung',
        'Tage bis Wochen, bis die Grundlagen funktionieren',
        'Hohe Token-Kosten, bevor es Geschäftslogik gibt',
    ],
    'compare_good_title' => 'KI baut auf einer Scoriet-App auf',
    'compare_good' => [
        'Login mit 2FA, Tabellen, Formulare und Reports sind schon da',
        'Einheitliche Architektur aus bewährten Templates',
        'Geschäftslogik ab dem ersten Tag',
        'Tokens werden dort eingesetzt, wo sie Wert schaffen',
    ],

    'steps_kicker' => 'So funktioniert es',
    'steps_title' => 'In vier Schritten vom Datenbankschema zur fertigen Anwendung',
    'steps' => [
        ['title' => 'Datenbank entwerfen oder importieren', 'text' => 'Importieren Sie ein bestehendes MySQL-Schema oder modellieren Sie Tabellen und Felder im eingebauten Datenbankdesigner. Feldbeschriftungen und das Schema selbst lassen sich übersetzen.'],
        ['title' => 'Template wählen', 'text' => 'Wählen Sie ein Template für C#, Java / Spring Boot, Laravel, PHP, Rust, Flutter und mehr – oder schreiben Sie Ihr eigenes. Templates legen genau fest, welcher Code entsteht.'],
        ['title' => 'Komplette App generieren', 'text' => 'Scoriet erzeugt eine vollständige Anwendung: Login mit 2FA / OTP / MFA und Datenbankverwaltung mit Tabellen, Formularen, Reports und Suchfenstern – auf Wunsch mehrsprachig.'],
        ['title' => 'Mit KI weitermachen – oder von Hand', 'text' => 'Übergeben Sie das generierte Projekt an Ihren KI-Assistenten oder Ihr Team und konzentrieren Sie sich auf das, was Ihre Anwendung einzigartig macht.'],
    ],

    'generated_kicker' => 'In jeder generierten App enthalten',
    'generated_title' => 'Was Ihre Anwendung nach der Generierung bereits enthält',
    'generated_items' => [
        'Login und Benutzerverwaltung mit 2FA / OTP / MFA',
        'Datenbankverwaltung für alle Tabellen',
        'Eingabeformulare mit Validierung',
        'Listen und Tabellen mit Sortierung und Blättern',
        'Suchfenster und Filter',
        'Reports',
        'Mehrsprachige Benutzeroberfläche',
        'Sauberer, lesbarer Quellcode, der Ihnen gehört',
    ],

    'tech_kicker' => 'Ein Schema, viele Plattformen',
    'tech_title' => 'Generieren Sie für die Sprache und das Framework, das Sie brauchen',
    'tech_text' => 'Aus demselben Datenbankschema wird eine Web-, Desktop- oder Mobile-Anwendung. Weil Scoriet vollständig Template-basiert arbeitet, lässt sich jede weitere Sprache und jedes Framework mit eigenen Templates ergänzen.',
    'tech_more' => 'und Ihre eigenen Templates',

    'lifecycle_kicker' => 'Nach der Generierung',
    'lifecycle_title' => 'Nicht nur einmal generieren – pflegen und weiterentwickeln',
    'lifecycle_text' => 'Echte Projekte verändern sich. Scoriet unterstützt den gesamten Workflow nach der ersten Generierung.',
    'lifecycle' => [
        ['title' => 'Deploy über FTP und CLI', 'text' => 'Laden Sie generierte Projekte direkt auf Ihren Server oder binden Sie sie mit dem CLI-Service in Ihren Build ein.'],
        ['title' => 'Änderungen vergleichen', 'text' => 'Sehen Sie, welche generierten Dateien von Hand geändert wurden, und vergleichen Sie sie Datei für Datei.'],
        ['title' => 'Reverse Engineering', 'text' => 'Manuelle Änderungen werden in die Generierung zurückgeführt und überstehen so den nächsten Lauf.'],
        ['title' => 'Datenbank-Migrationen', 'text' => 'Scoriet erzeugt das SQL-Skript, das Ihre Datenbank von Schema-Version 1 auf Version 2 aktualisiert.'],
    ],

    'features_kicker' => 'Alles in einem Studio',
    'features_title' => 'Alle Werkzeuge, die Sie brauchen – im Browser',
    'features' => [
        ['title' => 'Datenbankdesigner', 'text' => 'Tabellen, Felder und Beziehungen visuell modellieren oder bestehendes SQL importieren.'],
        ['title' => 'Visueller Formulareditor', 'text' => 'Eingabeformulare per Drag & Drop anordnen – das Layout fließt in die Generierung ein.'],
        ['title' => 'Report-Editor', 'text' => 'Reports visuell gestalten und zusammen mit der App generieren.'],
        ['title' => 'Fenster-Editor', 'text' => 'Fenster auf Basis einer einzelnen Tabelle gestalten – die Grundlage für die Migration von WinDev-Anwendungen zu Scoriet.'],
        ['title' => 'Teams', 'text' => 'Gemeinsam an Projekten arbeiten, mit Rollen und Einladungen.'],
        ['title' => 'Kanban-Projektmanagement', 'text' => 'Die Arbeit am Projekt direkt neben dem Code planen und verfolgen.'],
        ['title' => 'Internes Messaging', 'text' => 'Mit dem Team sprechen, ohne das Studio zu verlassen.'],
        ['title' => 'Übersetzungen eingebaut', 'text' => 'Scoriet selbst spricht fünf Sprachen und erzeugt mehrsprachige Anwendungen, inklusive übersetztem Schema.'],
        ['title' => 'Template-Import & -Export', 'text' => 'Templates zwischen Projekten, Teams und Installationen austauschen.'],
        ['title' => 'Template-Store', 'text' => 'Templates kaufen und verkaufen – vor der Freigabe auf Schadcode geprüft.'],
    ],

    'trust_kicker' => 'Open Source',
    'trust_title' => 'Open Source und sicher von Grund auf',
    'trust_text' => 'Scoriet ist Open Source und frei auf GitHub verfügbar. Templates lassen sich importieren, exportieren und im Scoriet Template-Store sogar verkaufen. Jedes Template und jede Änderung wird automatisch auf Schadcode geprüft und von der Community begutachtet, bevor es freigegeben wird – so kann niemand Ihre Anwendung oder Ihre Entwicklungsumgebung kapern.',
    'trust_github' => 'Auf GitHub ansehen',

    'faq_title' => 'Häufige Fragen',
    'faq' => [
        ['q' => 'Was ist Scoriet?', 'a' => 'Scoriet ist ein Open-Source, Template-gestützter Anwendungs- und Code-Generator (RAD-Tool). Er macht aus einem Datenbankschema eine komplette Anwendung mit Login, Datenbankverwaltung, Formularen, Reports und Suchfenstern.'],
        ['q' => 'Für welche Sprachen und Frameworks kann Scoriet generieren?', 'a' => 'Es gibt Templates für C#, Java / Spring Boot, Laravel / PHP, Rust, Flutter, React und mehr. Weil die Generierung vollständig Template-basiert ist, lässt sich jede Sprache und jedes Framework mit eigenen Templates ergänzen.'],
        ['q' => 'Wie arbeitet Scoriet mit KI-Assistenten zusammen?', 'a' => 'Scoriet erzeugt das Fundament – Login, Datenmodell, Formulare, Listen und Reports. Ihr KI-Assistent entwickelt darauf die Geschäftslogik, statt mit einem leeren Ordner zu beginnen. Das spart Tokens, Zeit und Geld und hält die Architektur einheitlich.'],
        ['q' => 'Kann ich den generierten Code ändern?', 'a' => 'Ja, der Code gehört Ihnen. Scoriet zeigt, welche Dateien Sie geändert haben, vergleicht sie und kann Ihre Änderungen per Reverse Engineering in die nächste Generierung übernehmen.'],
        ['q' => 'Ist Scoriet kostenlos?', 'a' => 'Scoriet ist Open Source und kann von GitHub heruntergeladen werden. Die gehostete Version auf scoriet.dev bietet einen kostenlosen Plan für den Einstieg.'],
        ['q' => 'Sind Templates aus dem Store sicher?', 'a' => 'Templates im Store werden automatisch auf Schadcode geprüft und von der Community begutachtet. Jede Änderung muss freigegeben werden, bevor sie veröffentlicht wird.'],
    ],
];
