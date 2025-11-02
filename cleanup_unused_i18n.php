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

$cleaned = 0;
foreach ($files as $file) {
    $content = file_get_contents($file);
    $originalContent = $content;
    
    // Check if file uses t. for translations
    $usesTranslations = preg_match('/\bt\.[a-zA-Z0-9_]+/', $content);
    
    if (!$usesTranslations) {
        // Remove i18n imports if translations are not used
        $content = preg_replace(
            "/import\s+\{[^}]*useTranslation[^}]*\}\s+from\s+['\"]@\/i18n['\"];\n/",
            "",
            $content
        );
        
        // Remove i18n setup
        $content = preg_replace(
            "/\s*\/\/\s*i18n\s+setup\n\s*const\s+\[currentLanguage\][^\n]*\n\s*const\s+\{\s*t\s*\}[^\n]*\n/",
            "",
            $content
        );
    }
    
    if ($content !== $originalContent) {
        file_put_contents($file, $content);
        $relativePath = str_replace('\\', '/', $file);
        echo "Cleaned: " . $relativePath . "\n";
        $cleaned++;
    }
}

echo "\nSummary: Cleaned " . $cleaned . " files\n";
