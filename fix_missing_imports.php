<?php

$files = [];
$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator('resources/js', RecursiveDirectoryIterator::SKIP_DOTS)
);

foreach ($iterator as $file) {
    if ($file->isFile() && $file->getExtension() === 'tsx') {
        $files[] = $file->getPathname();
    }
}

$fixed = 0;
foreach ($files as $file) {
    $content = file_get_contents($file);
    $modified = false;

    // Check if file uses getStoredLanguage but doesn't import it
    $usesGetStoredLanguage = strpos($content, 'getStoredLanguage()') !== false;
    $importsGetStoredLanguage = preg_match("/import.*getStoredLanguage.*from\s+['\"]@\/i18n['\"]/", $content);

    // Check if file uses useTranslation but doesn't import it
    $usesUseTranslation = strpos($content, 'useTranslation(') !== false;
    $importsUseTranslation = preg_match("/import.*useTranslation.*from\s+['\"]@\/i18n['\"]/", $content);

    // Skip if imports are already present
    if ((!$usesGetStoredLanguage || $importsGetStoredLanguage) && (!$usesUseTranslation || $importsUseTranslation)) {
        continue;
    }
    
    // Check if there's an import from '@/i18n'
    if (preg_match("/^import\s+\{([^}]+)\}\s+from\s+['\"]@\/i18n['\"]/m", $content, $match)) {
        // Add missing imports to existing import
        $existingImports = array_map('trim', explode(',', $match[1]));
        $neededImports = [];

        if ($usesUseTranslation && !$importsUseTranslation) {
            $neededImports[] = 'useTranslation';
        }
        if ($usesGetStoredLanguage && !$importsGetStoredLanguage) {
            $neededImports[] = 'getStoredLanguage';
        }

        if (!empty($neededImports)) {
            $allImports = array_merge($existingImports, $neededImports);
            $newImportsStr = implode(', ', $allImports);
            $content = preg_replace(
                "/^(import\s+\{)[^}]+(}\s+from\s+['\"]@\/i18n['\"])/m",
                '$1' . $newImportsStr . '$2',
                $content
            );
            file_put_contents($file, $content);
            echo "✓ Fixed: $file (added " . implode(', ', $neededImports) . ")\n";
            $fixed++;
        }
    } else {
        // Add new import line
        // Find last import line
        $lines = explode("\n", $content);
        $lastImportLine = 0;
        foreach ($lines as $index => $line) {
            if (preg_match("/^import\s+/", trim($line))) {
                $lastImportLine = $index;
            }
        }
        
        // Insert new import
        $import = "import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';";
        array_splice($lines, $lastImportLine + 1, 0, $import);
        $content = implode("\n", $lines);
        file_put_contents($file, $content);
        echo "✓ Added import to: $file\n";
        $fixed++;
    }
}

echo "\n=== Summary ===\n";
echo "Fixed $fixed files\n";
