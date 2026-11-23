<?php

namespace App\Services;

/**
 * flutter_sml_template's own files (both the "dependencies" runtime bundle
 * AND its plain template-structure text files - %1_page.dart,
 * window_modules.dart, global_procedures.dart, ...) are snapshots frozen at
 * whatever point they were last packaged/uploaded. Unlike sml_to_dart.js's
 * OWN {:code:}-block execution path (UltimateTemplateController::
 * attachDartTranslations(), which reads straight from disk every
 * generation), every OTHER file ships to the downloaded project exactly as
 * stored in `template_files`, so an edit on disk has NO effect until
 * someone re-packages and re-uploads the whole template - confirmed real
 * and genuinely confusing multiple times in one afternoon (a build error
 * naming a method that plainly existed on disk; a status-bar widget that
 * never rendered even though the method it calls was already fresh,
 * because %1_page.dart itself was still an older snapshot; and even after
 * fixing the LISTING endpoint, the ACTUAL generation endpoints - which
 * load `$template->files` completely independently - were still serving
 * the old snapshot, since they never went through that fix at all).
 *
 * `freshen()` is the ONE shared place both the template-files LISTING
 * endpoint (TemplateController::getTemplateFiles, used to assemble the
 * downloadable ZIP client-side) and every REAL GENERATION endpoint
 * (UltimateTemplateController::processTemplateBatch/generateFullProject/
 * generateForCli/buildUltimateGtree - each loads `$template->files`
 * independently, which is exactly why a fix in only ONE of them didn't
 * actually fix the real "Generate & Download" flow) need to call, so
 * disk always wins for every one of these files, everywhere, for this ONE
 * known, Claude-maintained template - scoped tightly by exact template
 * name plus an explicit output_path+file_name allow-list so no other
 * template, and no file this template's own disk copy doesn't actually
 * have a counterpart for, is ever touched by this.
 */
class FlutterSmlTemplateFreshener
{
    private const TEMPLATE_NAME = 'flutter_sml_template';

    /**
     * output_path+file_name -> path (relative to scripts/flutter_sml_template/)
     * for EVERY real file that template's own project structure has on
     * disk (confirmed 1:1 against a live `template_files` listing for it).
     */
    private const FILE_PATHS = [
        'lib/core/app_globals.dart' => 'lib/core/app_globals.dart',
        'lib/core/app_structs.dart' => 'lib/core/app_structs.dart',
        'lib/core/global_procedures.dart' => 'lib/core/global_procedures.dart',
        'lib/main.dart' => 'lib/main.dart',
        'lib/windows/window_modules.dart' => 'lib/windows/window_modules.dart',
        'pubspec.yaml' => 'pubspec.yaml',
        'windows/CMakeLists.txt' => 'windows/CMakeLists.txt',
        'windows/runner/main.cpp' => 'windows/runner/main.cpp',
        'windows/runner/Runner.rc' => 'windows/runner/Runner.rc',
        'lib/core/control_widgets.dart' => 'lib/core/control_widgets.dart',
        'lib/core/nav_module.dart' => 'lib/core/nav_module.dart',
        'lib/core/window_frame.dart' => 'lib/core/window_frame.dart',
        'windows/.gitignore' => 'windows/.gitignore',
        'windows/runner/CMakeLists.txt' => 'windows/runner/CMakeLists.txt',
        'lib/windows/%1_page.dart' => 'lib/windows/%1_page.dart',
    ];

    /**
     * $files is an array of either plain arrays or objects (both shapes are
     * used across the codebase's various `$template->files->toArray()` /
     * `->all()` call sites) - each one's `file_content` is overridden
     * in-place when a fresh disk counterpart exists. Never mutates the
     * original Eloquent collection/models - callers already work off a
     * transient copy (`toArray()`/similar) by the time this runs.
     */
    public static function freshen(string $templateName, array $files): array
    {
        if ($templateName !== self::TEMPLATE_NAME) {
            return $files;
        }

        foreach ($files as &$f) {
            $isArray = is_array($f);
            $outputPath = $isArray ? ($f['output_path'] ?? '') : ($f->output_path ?? '');
            $fileName = $isArray ? ($f['file_name'] ?? '') : ($f->file_name ?? '');
            $contentType = $isArray ? ($f['content_type'] ?? 'text') : ($f->content_type ?? 'text');

            $fresh = self::freshContent($outputPath ?? '', $fileName ?? '', $contentType ?? 'text');
            if ($fresh === null) {
                continue;
            }

            if ($isArray) {
                $f['file_content'] = $fresh;
            } else {
                $f->file_content = $fresh;
            }
        }
        unset($f);

        return $files;
    }

    /**
     * Returns null (meaning "leave the stored content alone") for anything
     * other than a file this template has a real disk counterpart for, or
     * if that counterpart isn't actually present on this machine - never
     * breaks the real stored content as a fallback.
     */
    private static function freshContent(string $outputPath, string $fileName, string $contentType): ?string
    {
        if ($contentType === 'zip') {
            return $fileName === 'dependencies' ? self::buildRuntimeZip() : null;
        }

        // Normalize e.g. "lib/core/" + "app_globals.dart" -> "lib/core/app_globals.dart",
        // and "/" + "pubspec.yaml" -> "pubspec.yaml" (a bare "/" root prefix
        // would otherwise leave a leading slash the allow-list keys don't have).
        $key = ltrim(rtrim($outputPath, '/') . '/' . $fileName, '/');
        $relativePath = self::FILE_PATHS[$key] ?? null;
        if ($relativePath === null) {
            return null;
        }

        $fullPath = base_path('scripts/flutter_sml_template/' . $relativePath);
        if (!is_file($fullPath)) {
            return null;
        }

        $content = file_get_contents($fullPath);
        return $content === false ? null : $content;
    }

    /**
     * flutter_sml_template's "dependencies" bundle (lib/generator/
     * sml_to_dart.js + lib/core/sml_runtime/*.dart), rebuilt fresh from disk.
     */
    private static function buildRuntimeZip(): ?string
    {
        $sourceDir = base_path('scripts/flutter_sml_template');
        $subDirs = ['lib/generator', 'lib/core/sml_runtime'];
        foreach ($subDirs as $subDir) {
            if (!is_dir($sourceDir . '/' . $subDir)) {
                return null;
            }
        }

        $tmpPath = tempnam(sys_get_temp_dir(), 'sml_deps_') . '.zip';
        $zip = new \ZipArchive();
        if ($zip->open($tmpPath, \ZipArchive::CREATE) !== true) {
            @unlink($tmpPath);
            return null;
        }

        foreach ($subDirs as $subDir) {
            $fullDir = $sourceDir . '/' . $subDir;
            $it = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($fullDir, \FilesystemIterator::SKIP_DOTS)
            );
            foreach ($it as $file) {
                $relativePath = $subDir . '/' . substr($file->getPathname(), strlen($fullDir) + 1);
                $zip->addFile($file->getPathname(), str_replace('\\', '/', $relativePath));
            }
        }
        $zip->close();

        $binary = file_get_contents($tmpPath);
        @unlink($tmpPath);
        return $binary === false ? null : base64_encode($binary);
    }
}
