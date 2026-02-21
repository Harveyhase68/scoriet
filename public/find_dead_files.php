<?php
// Verzeichnisse, die wir scannen wollen
//$scanDirs = ['app', 'resources/js'];
// Wir gehen eine Ebene höher, um die Ordner zu finden
$scanDirs = [__DIR__ . '/../app', __DIR__ . '/../resources/js'];
// Dateien, die wir ignorieren (da sie oft dynamisch geladen werden)
$excludeFiles = ['app.php', 'bootstrap.php', 'tailwind.config.js', 'vite.config.js'];

$allFiles = [];
foreach ($scanDirs as $dir) {
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
    foreach ($iterator as $file) {
        if ($file->isDir()) continue;
        $allFiles[] = $file->getPathname();
    }
}

echo "Scanne " . count($allFiles) . " Dateien auf Referenzen...\n";

$unusedFiles = [];
foreach ($allFiles as $targetFile) {
    $fileName = basename($targetFile);
    $pureName = pathinfo($fileName, PATHINFO_FILENAME); // z.B. "UserMapper" statt "UserMapper.php"
    
    if (in_array($fileName, $excludeFiles)) continue;

    $isUsed = false;
    foreach ($allFiles as $searchInFile) {
        if ($targetFile === $searchInFile) continue;

        $content = file_get_contents($searchInFile);
        // Wir suchen nach dem Dateinamen ohne Endung (für Imports/Namespaces) 
        // oder mit Endung (für require/include)
        if (str_contains($content, $pureName)) {
            $isUsed = true;
            break;
        }
    }

    if (!$isUsed) {
        $unusedFiles[] = $targetFile;
    }
}

echo "\n--- GEFUNDENE VERWAISTE DATEIEN ---\n";
print_r($unusedFiles);
echo "\nGesamtanzahl potenziell verwaist: " . count($unusedFiles) . "\n";