<?php

namespace App\Services;

use App\Models\TemplateFile;

/**
 * TemplateIncludeResolver - Resolves {:include: path/file.ext:} patterns in templates
 *
 * This service performs PRE-PROCESSING before the template engine runs.
 * It replaces all {:include:} tags with the actual content of the referenced files.
 *
 * Syntax: {:include: path/file.ext:}
 * - path is the output_path of the template file (e.g., "/includes/", "lib/")
 * - file.ext is the file_name
 *
 * Example:
 *   {:include: /includes/header.php:}
 *   {:include: lib/validation.php:}
 *   {:include: helper.php:} (root level file)
 */
class TemplateIncludeResolver
{
    /**
     * Maximum recursion depth to prevent infinite loops
     */
    private const MAX_DEPTH = 10;

    /**
     * All template files indexed by full path (output_path + file_name)
     * @var array<string, TemplateFile>
     */
    private array $templateFiles = [];

    /**
     * Track already included files to detect circular references
     * @var array<string>
     */
    private array $includedStack = [];

    /**
     * Collected errors during resolution
     * @var array
     */
    private array $errors = [];

    /**
     * Constructor
     *
     * @param array $templateFiles Array of TemplateFile objects or arrays
     */
    public function __construct(array $templateFiles)
    {
        $this->indexTemplateFiles($templateFiles);
    }

    /**
     * Index template files by their full path for quick lookup
     */
    private function indexTemplateFiles(array $files): void
    {
        foreach ($files as $file) {
            $outputPath = $file['output_path'] ?? $file->output_path ?? '/';
            $fileName = $file['file_name'] ?? $file->file_name ?? '';

            // Normalize path: ensure it ends with /
            if ($outputPath !== '/' && !str_ends_with($outputPath, '/')) {
                $outputPath .= '/';
            }

            // Build full path: output_path + file_name
            $fullPath = $outputPath . $fileName;

            // Also index without leading slash for flexible matching
            $this->templateFiles[$fullPath] = $file;

            // Index alternative forms
            if (str_starts_with($fullPath, '/')) {
                $this->templateFiles[substr($fullPath, 1)] = $file;
            } else {
                $this->templateFiles['/' . $fullPath] = $file;
            }
        }
    }

    /**
     * Resolve all includes in the given content
     *
     * @param string $content The template content with {:include:} tags
     * @param string $currentPath The path of the current file (for error messages)
     * @param int $depth Current recursion depth
     * @return string The content with all includes resolved
     */
    public function resolve(string $content, string $currentPath = '', int $depth = 0): string
    {
        // Check recursion limit
        if ($depth > self::MAX_DEPTH) {
            $this->errors[] = [
                'type' => 'recursion_limit',
                'file' => $currentPath,
                'message' => "Maximum include depth (" . self::MAX_DEPTH . ") exceeded",
            ];
            return $content;
        }

        // Find all {:include: path/file.ext:} patterns
        // Pattern: {:include: followed by path, then :}
        $pattern = '/\{:include:\s*([^:}]+)\s*:\}/';

        return preg_replace_callback($pattern, function ($matches) use ($currentPath, $depth) {
            $includePath = trim($matches[0]); // Full match for replacement
            $referencedPath = trim($matches[1]); // The path inside the tag

            return $this->resolveInclude($referencedPath, $currentPath, $depth);
        }, $content);
    }

    /**
     * Resolve a single include reference
     *
     * @param string $referencedPath The path to include (e.g., "/includes/header.php")
     * @param string $currentPath The path of the current file
     * @param int $depth Current recursion depth
     * @return string The included content or error comment
     */
    private function resolveInclude(string $referencedPath, string $currentPath, int $depth): string
    {
        // Check for circular reference
        if (in_array($referencedPath, $this->includedStack)) {
            $this->errors[] = [
                'type' => 'circular_reference',
                'file' => $currentPath,
                'referenced' => $referencedPath,
                'message' => "Circular include detected: $referencedPath",
                'stack' => $this->includedStack,
            ];
            return "/* CIRCULAR INCLUDE: $referencedPath */";
        }

        // Find the template file
        $templateFile = $this->findTemplateFile($referencedPath);

        if ($templateFile === null) {
            $this->errors[] = [
                'type' => 'not_found',
                'file' => $currentPath,
                'referenced' => $referencedPath,
                'message' => "Include file not found: $referencedPath",
            ];
            return "/* MISSING INCLUDE: $referencedPath */";
        }

        // Get the content
        $includeContent = $templateFile['file_content'] ?? $templateFile->file_content ?? '';

        // Push to stack for circular reference detection
        $this->includedStack[] = $referencedPath;

        // Recursively resolve includes in the included content
        $resolvedContent = $this->resolve($includeContent, $referencedPath, $depth + 1);

        // Pop from stack
        array_pop($this->includedStack);

        return $resolvedContent;
    }

    /**
     * Find a template file by its path
     *
     * @param string $path The path to find (e.g., "/includes/header.php" or "lib/util.php")
     * @return array|TemplateFile|null
     */
    private function findTemplateFile(string $path)
    {
        // Try exact match first
        if (isset($this->templateFiles[$path])) {
            return $this->templateFiles[$path];
        }

        // Try with leading slash
        if (!str_starts_with($path, '/') && isset($this->templateFiles['/' . $path])) {
            return $this->templateFiles['/' . $path];
        }

        // Try without leading slash
        if (str_starts_with($path, '/') && isset($this->templateFiles[substr($path, 1)])) {
            return $this->templateFiles[substr($path, 1)];
        }

        return null;
    }

    /**
     * Get all errors collected during resolution
     *
     * @return array
     */
    public function getErrors(): array
    {
        return $this->errors;
    }

    /**
     * Check if there were any errors
     *
     * @return bool
     */
    public function hasErrors(): bool
    {
        return count($this->errors) > 0;
    }

    /**
     * Get errors formatted for ERRORS.TXT
     *
     * @return string
     */
    public function getErrorsAsText(): string
    {
        if (empty($this->errors)) {
            return '';
        }

        $lines = ["=== INCLUDE RESOLUTION ERRORS ===\n"];

        foreach ($this->errors as $error) {
            $type = strtoupper($error['type']);
            $file = $error['file'] ?? 'unknown';
            $message = $error['message'] ?? '';

            $lines[] = "[$type] in $file: $message";

            if (isset($error['referenced'])) {
                $lines[] = "  Referenced: {$error['referenced']}";
            }

            if (isset($error['stack']) && !empty($error['stack'])) {
                $lines[] = "  Include stack: " . implode(' -> ', $error['stack']);
            }
        }

        return implode("\n", $lines) . "\n";
    }

    /**
     * Static helper to resolve includes for a single file
     *
     * @param string $content The template content
     * @param array $allTemplateFiles All template files in the template
     * @param string $currentPath Current file path for error messages
     * @return array ['content' => string, 'errors' => array]
     */
    public static function resolveContent(string $content, array $allTemplateFiles, string $currentPath = ''): array
    {
        $resolver = new self($allTemplateFiles);
        $resolvedContent = $resolver->resolve($content, $currentPath);

        return [
            'content' => $resolvedContent,
            'errors' => $resolver->getErrors(),
            'errors_text' => $resolver->getErrorsAsText(),
        ];
    }

    /**
     * Resolve includes for all files in a template
     * Returns files with resolved content, excluding is_include_only files
     *
     * @param array $templateFiles All template files
     * @return array ['files' => resolved files, 'errors' => all errors]
     */
    public static function resolveAllFiles(array $templateFiles): array
    {
        $resolver = new self($templateFiles);
        $resolvedFiles = [];
        $allErrors = [];

        foreach ($templateFiles as $file) {
            $isIncludeOnly = $file['is_include_only'] ?? $file->is_include_only ?? false;

            // Skip include-only files from output
            if ($isIncludeOnly) {
                continue;
            }

            $outputPath = $file['output_path'] ?? $file->output_path ?? '/';
            $fileName = $file['file_name'] ?? $file->file_name ?? '';
            $content = $file['file_content'] ?? $file->file_content ?? '';
            $currentPath = $outputPath . $fileName;

            // Resolve includes
            $resolver->includedStack = []; // Reset stack for each file
            $resolver->errors = []; // Reset errors for each file

            $resolvedContent = $resolver->resolve($content, $currentPath);

            // Clone file data and update content
            if (is_array($file)) {
                $resolvedFile = $file;
                $resolvedFile['file_content'] = $resolvedContent;
            } else {
                $resolvedFile = clone $file;
                $resolvedFile->file_content = $resolvedContent;
            }

            $resolvedFiles[] = $resolvedFile;

            // Collect errors
            if ($resolver->hasErrors()) {
                $allErrors = array_merge($allErrors, $resolver->getErrors());
            }
        }

        return [
            'files' => $resolvedFiles,
            'errors' => $allErrors,
        ];
    }
}
