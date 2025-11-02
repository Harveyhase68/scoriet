<?php

$filesToFix = [
    'resources/js/Components/Panels/DatabaseManagementPanel.tsx',
    'resources/js/Components/Panels/ForgotPasswordPanel.tsx',
    'resources/js/Components/Panels/LoginPanel.tsx',
    'resources/js/Components/Panels/MyApplicationsPanel.tsx',
    'resources/js/Components/Panels/ProjectPanel.tsx',
    'resources/js/Components/Panels/PublicProjectsPanel.tsx',
    'resources/js/Components/Panels/RegisterPanel.tsx',
    'resources/js/Components/Panels/TeamsPanel_Old.tsx'
];

$fixed = 0;

foreach ($filesToFix as $file) {
    if (!file_exists($file)) {
        echo "Skip: $file (not found)\n";
        continue;
    }

    $content = file_get_contents($file);
    
    // Check if already has i18n setup
    if (strpos($content, 'const { t } = useTranslation') !== false) {
        echo "Skip: $file (already has setup)\n";
        continue;
    }

    // Find the function definition
    if (!preg_match('/(export default function \w+\([^)]*\)\s*\{)/', $content, $match, PREG_OFFSET_CAPTURE)) {
        echo "Skip: $file (no function found)\n";
        continue;
    }

    $insertPos = $match[0][1] + strlen($match[0][0]);
    
    // Insert i18n setup
    $i18nSetup = "\n  // i18n setup\n  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());\n  const { t } = useTranslation(currentLanguage);\n";
    
    $newContent = substr($content, 0, $insertPos) . $i18nSetup . substr($content, $insertPos);
    
    file_put_contents($file, $newContent);
    echo "Fixed: $file\n";
    $fixed++;
}

echo "\nTotal fixed: $fixed files\n";
