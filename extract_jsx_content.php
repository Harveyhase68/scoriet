<?php

/**
 * JSX Content Extractor - Verbesserte Version
 *
 * Extrahiert ALLE übersetzbare Texte aus TSX-Dateien:
 * - String-Literale in Attributen
 * - Text zwischen Tags
 * - JSX-Expressions mit Strings
 * - Template-Literale
 * - Multi-line Texte
 */

class JSXContentExtractor
{
    private array $strings = [];
    private string $outputFile = 'jsx_content_strings.csv';
    private array $processedStrings = []; // Verhindert Duplikate

    // Attribute die übersetzt werden sollen
    private array $translatableAttributes = [
        'header', 'message', 'summary', 'detail', 'label', 'placeholder',
        'title', 'alt', 'text', 'content', 'description', 'tooltip',
        'emptyMessage', 'errorMessage', 'successMessage', 'warningMessage',
        'confirmMessage', 'cancelLabel', 'acceptLabel', 'rejectLabel'
    ];

    public function __construct(?string $outputFile = null)
    {
        if ($outputFile) {
            $this->outputFile = $outputFile;
        }
    }

    /**
     * Verarbeitet eine einzelne TSX-Datei
     */
    public function extractFromFile(string $filePath): void
    {
        echo "Extrahiere aus: {$filePath}\n";

        if (!file_exists($filePath)) {
            echo "Fehler: Datei {$filePath} nicht gefunden!\n";
            return;
        }

        $content = file_get_contents($filePath);
        if ($content === false) {
            echo "Fehler beim Lesen der Datei: {$filePath}\n";
            return;
        }

        $relativePath = str_replace(getcwd() . DIRECTORY_SEPARATOR, '', $filePath);
        $relativePath = str_replace('\\', '/', $relativePath);

        // Kommentare entfernen
        $content = $this->removeComments($content);

        // Imports entfernen (alles bis zur ersten Funktion/return)
        $content = $this->removeImports($content);

        // Verschiedene Extraktionsmethoden
        $this->extractStringLiterals($content, $relativePath);
        $this->extractAttributeStrings($content, $relativePath);
        $this->extractTextBetweenTags($content, $relativePath);
        $this->extractJSXExpressions($content, $relativePath);
    }

    /**
     * Durchsucht alle TSX-Dateien im Projekt
     */
    public function extractAllTSXFiles(): void
    {
        echo "Suche alle TSX/JSX-Dateien...\n\n";

        $directory = 'resources/js';
        $processedFiles = [];

        if (is_dir($directory)) {
            $iterator = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS)
            );

            foreach ($iterator as $file) {
                if ($file->isFile() && in_array($file->getExtension(), ['tsx', 'jsx'])) {
                    $filePath = $file->getPathname();
                    $this->extractFromFile($filePath);
                    $processedFiles[] = $filePath;
                }
            }
        }

        $this->writeToCsv();

        echo "\n=== FERTIG ===\n";
        echo "Gefundene Strings: " . count($this->strings) . "\n";
        echo "Verarbeitete Dateien: " . count($processedFiles) . "\n";
        echo "Ausgabe: {$this->outputFile}\n";
    }

    /**
     * Entfernt Kommentare aus dem Code
     */
    private function removeComments(string $content): string
    {
        // Single-line Kommentare entfernen
        $content = preg_replace('/\/\/.*$/m', '', $content);

        // Multi-line Kommentare entfernen
        $content = preg_replace('/\/\*.*?\*\//s', '', $content);

        return $content;
    }

    /**
     * Entfernt Imports aus dem Code
     */
    private function removeImports(string $content): string
    {
        // Entferne alle import-Zeilen
        $content = preg_replace('/^import\s+.*?;/m', '', $content);

        // Entferne export-Zeilen am Anfang
        $content = preg_replace('/^export\s+\{[^}]+\}\s+from.*;/m', '', $content);

        return $content;
    }

    /**
     * Extrahiert alle String-Literale (einfache und doppelte Anführungszeichen)
     */
    private function extractStringLiterals(string $content, string $fileName): void
    {
        // Einfache Anführungszeichen
        preg_match_all("/'([^'\\\\]*(\\\\.[^'\\\\]*)*)'/", $content, $singleQuotes, PREG_OFFSET_CAPTURE);
        foreach ($singleQuotes[1] as $match) {
            $text = $match[0];
            $offset = $match[1];
            $lineNumber = $this->getLineNumber($content, $offset);

            if ($this->shouldTranslate($text)) {
                $this->addString($text, $lineNumber, $fileName, 'string_literal');
            }
        }

        // Doppelte Anführungszeichen
        preg_match_all('/"([^"\\\\]*(\\\\.[^"\\\\]*)*)"/', $content, $doubleQuotes, PREG_OFFSET_CAPTURE);
        foreach ($doubleQuotes[1] as $match) {
            $text = $match[0];
            $offset = $match[1];
            $lineNumber = $this->getLineNumber($content, $offset);

            if ($this->shouldTranslate($text)) {
                $this->addString($text, $lineNumber, $fileName, 'string_literal');
            }
        }
    }

    /**
     * Extrahiert Strings aus Attributen
     */
    private function extractAttributeStrings(string $content, string $fileName): void
    {
        foreach ($this->translatableAttributes as $attr) {
            // Einfache Anführungszeichen
            $pattern = "/{$attr}='([^']+)'/";
            if (preg_match_all($pattern, $content, $matches, PREG_OFFSET_CAPTURE)) {
                foreach ($matches[1] as $match) {
                    $text = $match[0];
                    $offset = $match[1];
                    $lineNumber = $this->getLineNumber($content, $offset);
                    $this->addString($text, $lineNumber, $fileName, "attr_{$attr}");
                }
            }

            // Doppelte Anführungszeichen
            $pattern = "/{$attr}=\"([^\"]+)\"/";
            if (preg_match_all($pattern, $content, $matches, PREG_OFFSET_CAPTURE)) {
                foreach ($matches[1] as $match) {
                    $text = $match[0];
                    $offset = $match[1];
                    $lineNumber = $this->getLineNumber($content, $offset);
                    $this->addString($text, $lineNumber, $fileName, "attr_{$attr}");
                }
            }

            // JSX-Expressions: header={"Text"} oder header={'Text'}
            $pattern = "/{$attr}=\{['\"]([^'\"]+)['\"]\}/";
            if (preg_match_all($pattern, $content, $matches, PREG_OFFSET_CAPTURE)) {
                foreach ($matches[1] as $match) {
                    $text = $match[0];
                    $offset = $match[1];
                    $lineNumber = $this->getLineNumber($content, $offset);
                    $this->addString($text, $lineNumber, $fileName, "attr_{$attr}_jsx");
                }
            }
        }
    }

    /**
     * Extrahiert Text zwischen Tags
     */
    private function extractTextBetweenTags(string $content, string $fileName): void
    {
        // Vereinfachtes Pattern für Text zwischen Tags
        // Erfasst: >Text< aber nicht >{variable}< oder >  <
        $pattern = '/>([^<>{}\s][^<>{}]*[^<>{}\s])</';

        if (preg_match_all($pattern, $content, $matches, PREG_OFFSET_CAPTURE)) {
            foreach ($matches[1] as $match) {
                $text = trim($match[0]);
                $offset = $match[1];
                $lineNumber = $this->getLineNumber($content, $offset);

                if ($this->shouldTranslate($text)) {
                    $this->addString($text, $lineNumber, $fileName, 'tag_content');
                }
            }
        }

        // Spezielle Tags mit mehr Inhalt
        $tags = ['p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'td', 'th', 'label', 'button', 'a'];
        foreach ($tags as $tag) {
            $pattern = "/<{$tag}[^>]*>([^<]+)<\/{$tag}>/s";
            if (preg_match_all($pattern, $content, $matches, PREG_OFFSET_CAPTURE)) {
                foreach ($matches[1] as $match) {
                    $text = trim($match[0]);
                    $offset = $match[1];
                    $lineNumber = $this->getLineNumber($content, $offset);

                    if ($this->shouldTranslate($text) && !$this->containsJSXExpression($text)) {
                        $this->addString($text, $lineNumber, $fileName, "tag_{$tag}");
                    }
                }
            }
        }
    }

    /**
     * Extrahiert JSX-Expressions mit Strings: {"Text"} oder {'Text'}
     */
    private function extractJSXExpressions(string $content, string $fileName): void
    {
        // Pattern für {" text "} oder {' text '}
        $pattern = '/\{["\']([^"\'{}]+)["\']\}/';

        if (preg_match_all($pattern, $content, $matches, PREG_OFFSET_CAPTURE)) {
            foreach ($matches[1] as $match) {
                $text = trim($match[0]);
                $offset = $match[1];
                $lineNumber = $this->getLineNumber($content, $offset);

                if ($this->shouldTranslate($text)) {
                    $this->addString($text, $lineNumber, $fileName, 'jsx_expression');
                }
            }
        }
    }

    /**
     * Prüft ob ein Text JSX-Expressions enthält
     */
    private function containsJSXExpression(string $text): bool
    {
        return preg_match('/\{[^}]+\}/', $text) === 1;
    }

    /**
     * Ermittelt die Zeilennummer anhand des Offsets
     */
    private function getLineNumber(string $content, int $offset): int
    {
        $beforeOffset = substr($content, 0, $offset);
        return substr_count($beforeOffset, "\n") + 1;
    }

    /**
     * Prüft, ob ein String übersetzt werden soll
     */
    private function shouldTranslate(string $text): bool
    {
        $text = trim($text);

        // Zu kurz
        if (strlen($text) < 2) {
            return false;
        }

        // Muss mindestens einen Buchstaben enthalten
        if (!preg_match('/[a-zA-ZäöüÄÖÜß]/', $text)) {
            return false;
        }

        // Technische Strings ausschließen
        if ($this->isTechnicalString($text)) {
            return false;
        }

        // Variablen/Code ausschließen
        if ($this->looksLikeCode($text)) {
            return false;
        }

        return true;
    }

    /**
     * Prüft, ob ein String technisch ist
     */
    private function isTechnicalString(string $text): bool
    {
        $text = trim($text);
        $textLower = strtolower($text);

        // Technische Keywords
        $technicalKeywords = [
            'true', 'false', 'null', 'undefined', 'loading',
            'pi-', 'pi ', // PrimeReact Icons
            'p-', // PrimeReact CSS classes
            'className', 'style', 'onClick', 'onChange', 'onSubmit',
            'const', 'let', 'var', 'function', 'return', 'import', 'export',
            'type', 'interface', 'enum', 'class', 'application/',
            'content-type', 'accept', 'authorization', 'bearer', 'x-'
        ];

        // HTTP-Methoden
        $httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
        if (in_array(strtoupper($text), $httpMethods)) {
            return true;
        }

        foreach ($technicalKeywords as $keyword) {
            if (str_starts_with($textLower, $keyword)) {
                return true;
            }
        }

        // CSS-Klassen (Tailwind, etc.) - mehrere Wörter mit Bindestrichen
        if (preg_match('/(text-|bg-|flex|items-|justify-|mr-|ml-|mt-|mb-|p-\d|m-\d|w-\d|h-\d)/', $textLower)) {
            return true;
        }

        // CSS-Werte (rem, px, em, etc.)
        if (preg_match('/^\d+(\.\d+)?(rem|px|em|%|vh|vw)/', $text)) {
            return true;
        }

        // Nur Kleinbuchstaben und Bindestriche (CSS-Klassen, etc.)
        if (preg_match('/^[a-z0-9\-_]+$/', $text) && !preg_match('/\s/', $text)) {
            return true;
        }

        // Pfade (mit @ oder / oder .)
        if (preg_match('/^[@\.\/]/', $text)) {
            return true;
        }

        // Font-Namen (mit Quotes drin)
        if (preg_match('/(Segoe|Arial|Helvetica|Sans|Serif|Mono|Emoji)/i', $text)) {
            return true;
        }

        // URLs
        if (preg_match('/^https?:\/\//', $text)) {
            return true;
        }

        // Dateierweiterungen
        if (preg_match('/\.(tsx?|jsx?|css|scss|json|png|jpg|svg)$/', $textLower)) {
            return true;
        }

        return false;
    }

    /**
     * Prüft, ob ein String wie Code aussieht
     */
    private function looksLikeCode(string $text): bool
    {
        // Enthält Klammern, Operatoren, etc.
        if (preg_match('/[\(\)\[\]\{\}=><=!&|]/', $text)) {
            return true;
        }

        // Camel-Case Variablen (z.B. userName, isLoading)
        if (preg_match('/^[a-z]+[A-Z]/', $text)) {
            return true;
        }

        // Dot-Notation (z.B. user.name)
        if (preg_match('/^[a-z]+\.[a-z]/', $text)) {
            return true;
        }

        return false;
    }

    /**
     * Fügt einen String hinzu
     */
    private function addString(string $text, int $lineNumber, string $fileName, string $type): void
    {
        $text = trim($text);

        // Duplikat-Check (gleicher Text in gleicher Datei)
        $key = md5($text . '|' . $fileName);

        if (!isset($this->processedStrings[$key])) {
            $this->processedStrings[$key] = true;
            $this->strings[] = [
                'file' => $fileName,
                'line' => $lineNumber,
                'text' => $text,
                'type' => $type
            ];
        }
    }

    /**
     * Schreibt die Ergebnisse in eine CSV-Datei
     */
    public function writeToCsv(): void
    {
        $file = fopen($this->outputFile, 'w');
        if ($file === false) {
            echo "Fehler beim Erstellen der CSV-Datei: {$this->outputFile}\n";
            return;
        }

        // UTF-8 BOM für Excel
        fwrite($file, "\xEF\xBB\xBF");

        // CSV-Header
        fputcsv($file, ['Datei', 'Zeile', 'Typ', 'Text'], ';', '"', '');

        // Strings sortieren: erst nach Datei, dann nach Zeile
        usort($this->strings, function ($a, $b) {
            $fileCompare = strcmp($a['file'], $b['file']);
            if ($fileCompare !== 0) {
                return $fileCompare;
            }
            return $a['line'] - $b['line'];
        });

        // Daten schreiben
        foreach ($this->strings as $string) {
            fputcsv($file, [
                $string['file'],
                $string['line'],
                $string['type'],
                $string['text']
            ], ';', '"', '');
        }

        fclose($file);
    }

    /**
     * Zeigt die gefundenen Strings an
     */
    public function showResults(): void
    {
        echo "\n=== Gefundene Strings ===\n";

        $byFile = [];
        foreach ($this->strings as $string) {
            $file = $string['file'];
            if (!isset($byFile[$file])) {
                $byFile[$file] = [];
            }
            $byFile[$file][] = $string;
        }

        foreach ($byFile as $file => $strings) {
            echo "\n{$file} ({" . count($strings) . " Strings):\n";
            foreach ($strings as $string) {
                echo "  Zeile {$string['line']} [{$string['type']}]: \"{$string['text']}\"\n";
            }
        }
    }
}

// Hauptprogramm
if (php_sapi_name() === 'cli') {
    echo "=== JSX Content Extractor ===\n\n";

    if (isset($argv[1]) && $argv[1] === 'all') {
        // Alle Dateien verarbeiten
        $outputFile = $argv[2] ?? 'jsx_content_strings.csv';
        $extractor = new JSXContentExtractor($outputFile);
        $extractor->extractAllTSXFiles();
    } else {
        // Einzelne Datei verarbeiten
        $filePath = $argv[1] ?? 'resources/js/Components/AuthModals/RegisterModal.tsx';
        $outputFile = $argv[2] ?? 'jsx_content_strings.csv';

        $extractor = new JSXContentExtractor($outputFile);
        $extractor->extractFromFile($filePath);
        $extractor->showResults();
        $extractor->writeToCsv();

        echo "\nAusgabe: {$outputFile}\n";
    }
} else {
    echo "Dieses Skript muss über die Kommandozeile ausgeführt werden.\n\n";
    echo "Verwendung:\n";
    echo "  Einzelne Datei: php extract_jsx_content.php <datei> [output.csv]\n";
    echo "  Alle Dateien:   php extract_jsx_content.php all [output.csv]\n";
}
