<?php

namespace Database\Seeders;

use App\Models\Page;
use Illuminate\Database\Seeder;

class PagesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pages = [
            [
                'slug' => 'impressum',
                'locale' => 'de',
                'title' => 'Impressum',
                'content' => '<h2>Angaben gemäß § 5 TMG</h2>
<p>Scoriet GmbH<br>
Musterstraße 123<br>
12345 Musterstadt<br>
Deutschland</p>

<h2>Kontakt</h2>
<p>Telefon: +49 (0) 123 456789<br>
E-Mail: info@scoriet.com</p>

<h2>Vertreten durch</h2>
<p>Geschäftsführer: Max Mustermann</p>

<h2>Registereintrag</h2>
<p>Eintragung im Handelsregister.<br>
Registergericht: Amtsgericht Musterstadt<br>
Registernummer: HRB 12345</p>

<h2>Umsatzsteuer-ID</h2>
<p>Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:<br>
DE 123456789</p>',
                'is_active' => true,
            ],
            [
                'slug' => 'help',
                'locale' => 'de',
                'title' => 'Hilfe',
                'content' => '<p>Willkommen bei Scoriet! Hier erfahren Sie, wie Sie mit unserem Enterprise Code Generator starten.</p>

<h2>Erste Schritte</h2>
<p>Willkommen bei Scoriet! Hier erfahren Sie, wie Sie mit unserem Enterprise Code Generator starten.</p>

<h3>Ihr erstes Projekt erstellen</h3>
<ol>
<li>Für ein Konto anmelden</li>
<li>Ein neues Projekt erstellen</li>
<li>Ihre Datenbankschema importieren</li>
<li>Ihren Code generieren</li>
</ol>

<h2>Features</h2>
<ul>
<li>SQL Parser für MySQL-Datenbanken</li>
<li>Template-System mit JavaScript-Ausführung</li>
<li>Multi-Sprachen Code-Generierung</li>
<li>Moderne dock-basierte Oberfläche</li>
</ul>

<h2>Support</h2>
<p>Bei Fragen wenden Sie sich bitte an unser Support-Team unter support@scoriet.com</p>',
                'is_active' => true,
            ],
            [
                'slug' => 'impressum',
                'locale' => 'en',
                'title' => 'Impressum',
                'content' => '<h2>Information pursuant to § 5 TMG</h2>
<p>Scoriet GmbH<br>
Sample Street 123<br>
12345 Sample City<br>
Germany</p>

<h2>Contact</h2>
<p>Phone: +49 (0) 123 456789<br>
Email: info@scoriet.com</p>

<h2>Represented by</h2>
<p>Managing Director: Max Mustermann</p>

<h2>Registry entry</h2>
<p>Entry in the commercial register.<br>
Registry court: Local court Sample City<br>
Registration number: HRB 12345</p>

<h2>VAT ID</h2>
<p>VAT identification number pursuant to §27 a Umsatzsteuergesetz:<br>
DE 123456789</p>',
                'is_active' => true,
            ],
            [
                'slug' => 'help',
                'locale' => 'en',
                'title' => 'Help',
                'content' => '<p>Welcome to Scoriet! Here\'s how to get started with our enterprise code generator.</p>

<h2>Getting Started</h2>
<p>Welcome to Scoriet! Here\'s how to get started with our enterprise code generator.</p>

<h3>Creating Your First Project</h3>
<ol>
<li>Sign up for an account</li>
<li>Create a new project</li>
<li>Import your database schema</li>
<li>Generate your code</li>
</ol>

<h2>Features</h2>
<ul>
<li>SQL Parser for MySQL databases</li>
<li>Template system with JavaScript execution</li>
<li>Multi-language code generation</li>
<li>Modern dock-based interface</li>
</ul>

<h2>Support</h2>
<p>If you need help, please contact our support team at support@scoriet.com</p>',
                'is_active' => true,
            ],
        ];

        foreach ($pages as $page) {
            Page::create($page);
        }
    }
}