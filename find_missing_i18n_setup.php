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

$missingSetup = [];

foreach ($files as $file) {
    $content = file_get_contents($file);
    
    // Check if file uses t. for translations
    if (preg_match('/\bt\.[a-zA-Z0-9_]+/', $content)) {
        // Check if it has the i18n setup
        if (!preg_match('/const\s*\{\s*t\s*\}\s*=\s*useTranslation/', $content)) {
            $relativePath = str_replace('\\', '/', $file);
            $relativePath = str_replace(getcwd() . '/', '', $relativePath);
            $missingSetup[] = $relativePath;
        }
    }
}

if (empty($missingSetup)) {
    echo "All files with translations have i18n setup!\n";
} else {
    echo "Files using t. but missing i18n setup:\n\n";
    foreach ($missingSetup as $file) {
        echo "  - $file\n";
    }
    echo "\nTotal: " . count($missingSetup) . " files\n";
}
