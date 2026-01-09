<?php

namespace App\Services;

use App\Models\CodeAdjustment;
use App\Models\CodeAdjustmentInsertion;
use App\Models\UserGitProvider;
use App\Services\GitProviderService;
use Illuminate\Support\Collection;

class CodeAdjustmentService
{
    /**
     * Apply all active adjustments to generated content
     *
     * @param string $content The generated code
     * @param string $filename The output filename (after %1, %2 replacement)
     * @param int $projectId The project ID
     * @param array $context Additional context (tablename, languagecode, etc.)
     * @return array ['content' => string, 'applied' => array, 'warnings' => array]
     */
    public function apply(
        string $content,
        string $filename,
        int $projectId,
        array $context = []
    ): array {
        $result = [
            'content' => $content,
            'applied' => [],
            'warnings' => [],
        ];

        // Get all active adjustments for this project
        $adjustments = CodeAdjustment::forProject($projectId)
            ->active()
            ->with('insertions')
            ->ordered()
            ->get();

        // Filter to only adjustments matching this filename
        $matchingAdjustments = $adjustments->filter(function ($adj) use ($filename) {
            return $adj->matchesFilename($filename);
        });

        foreach ($matchingAdjustments as $adjustment) {
            $applyResult = $this->applyAdjustment(
                $result['content'],
                $adjustment,
                $context
            );

            $result['content'] = $applyResult['content'];

            if ($applyResult['success']) {
                $result['applied'][] = [
                    'adjustment_id' => $adjustment->id,
                    'name' => $adjustment->name,
                    'insertions_applied' => $applyResult['insertions_applied'],
                ];
            } else {
                $result['warnings'][] = [
                    'adjustment_id' => $adjustment->id,
                    'name' => $adjustment->name,
                    'reason' => $applyResult['reason'],
                ];
            }
        }

        return $result;
    }

    /**
     * Analyze a modified file and extract adjustment insertions (Reverse Engineering)
     *
     * @param string $templateContent Original generated content
     * @param string $modifiedContent User-modified content
     * @param string $filename The filename for pattern matching
     * @return array ['insertions' => array, 'confidence' => float, 'analysis' => array]
     */
    public function analyze(
        string $templateContent,
        string $modifiedContent,
        string $filename
    ): array {
        // Normalize line endings
        $template = $this->normalizeLineEndings($templateContent);
        $modified = $this->normalizeLineEndings($modifiedContent);

        // Split into lines
        $templateLines = explode("\n", $template);
        $modifiedLines = explode("\n", $modified);

        // Find longest common subsequence and differences
        $diff = $this->computeDiff($templateLines, $modifiedLines);

        // Extract insertions from diff
        $insertions = $this->extractInsertions($diff, $templateLines, $modifiedLines);

        // Calculate overall confidence
        $confidence = $this->calculateConfidence($diff, $templateLines, $modifiedLines);

        return [
            'insertions' => $insertions,
            'confidence' => $confidence,
            'analysis' => [
                'template_lines' => count($templateLines),
                'modified_lines' => count($modifiedLines),
                'common_lines' => $diff['common_count'],
                'added_lines' => $diff['added_count'],
                'removed_lines' => $diff['removed_count'],
            ],
            'diff_operations' => $diff['operations'],
        ];
    }

    /**
     * Preview how adjustments would be applied to content
     */
    public function preview(
        string $content,
        string $filename,
        int $projectId,
        array $context = []
    ): array {
        $result = $this->apply($content, $filename, $projectId, $context);

        // Add diff visualization
        $originalLines = explode("\n", $this->normalizeLineEndings($content));
        $modifiedLines = explode("\n", $this->normalizeLineEndings($result['content']));

        $result['diff'] = $this->computeDiff($originalLines, $modifiedLines);
        $result['original_line_count'] = count($originalLines);
        $result['modified_line_count'] = count($modifiedLines);

        return $result;
    }

    /**
     * Apply a single adjustment to content
     */
    private function applyAdjustment(
        string $content,
        CodeAdjustment $adjustment,
        array $context
    ): array {
        $lines = explode("\n", $this->normalizeLineEndings($content));
        $insertionsApplied = 0;
        $failedInsertions = [];

        // Process insertions in order
        foreach ($adjustment->insertions as $insertion) {
            // Replace variables in insertion content
            $insertionContent = $this->replaceVariables(
                $insertion->getNormalizedInsertionContent(),
                $context
            );

            $anchorText = $insertion->getNormalizedAnchorText();

            $insertResult = $this->insertAtAnchor(
                $lines,
                $insertion->insertion_type,
                $anchorText,
                $insertionContent,
                $insertion->line_offset,
                (float) $adjustment->min_confidence
            );

            if ($insertResult['success']) {
                $lines = $insertResult['lines'];
                $insertionsApplied++;
            } else {
                $failedInsertions[] = [
                    'insertion_id' => $insertion->id,
                    'reason' => $insertResult['reason'],
                ];
            }
        }

        $totalInsertions = $adjustment->insertions->count();
        $success = $insertionsApplied > 0 || $totalInsertions === 0;

        return [
            'content' => implode("\n", $lines),
            'success' => $success,
            'insertions_applied' => $insertionsApplied,
            'failed_insertions' => $failedInsertions,
            'reason' => !$success ? 'No insertions could be applied. Failed: ' . count($failedInsertions) : null,
        ];
    }

    /**
     * Insert content at anchor position
     */
    private function insertAtAnchor(
        array $lines,
        string $insertionType,
        string $anchorText,
        string $insertionContent,
        int $lineOffset,
        float $minConfidence
    ): array {
        $anchorLines = explode("\n", $anchorText);
        $insertionLines = explode("\n", $insertionContent);

        // Find anchor position using line-by-line matching
        $anchorPosition = $this->findAnchorPosition(
            $lines,
            $anchorLines,
            $insertionType,
            $minConfidence
        );

        if ($anchorPosition === null) {
            return [
                'success' => false,
                'lines' => $lines,
                'reason' => 'Anchor text not found with sufficient confidence',
            ];
        }

        // Calculate insertion position based on type and offset
        $insertPosition = match ($insertionType) {
            'beginning' => $anchorPosition + $lineOffset,
            'end' => $anchorPosition + count($anchorLines) + $lineOffset,
            'middle' => $anchorPosition + count($anchorLines) + $lineOffset,
            default => $anchorPosition,
        };

        // Ensure position is within bounds
        $insertPosition = max(0, min($insertPosition, count($lines)));

        // Insert the new lines
        array_splice($lines, $insertPosition, 0, $insertionLines);

        return [
            'success' => true,
            'lines' => $lines,
            'reason' => null,
            'position' => $insertPosition,
        ];
    }

    /**
     * Find anchor position in lines
     */
    private function findAnchorPosition(
        array $lines,
        array $anchorLines,
        string $insertionType,
        float $minConfidence
    ): ?int {
        $anchorLength = count($anchorLines);
        $linesLength = count($lines);

        if ($anchorLength === 0 || $linesLength === 0) {
            return null;
        }

        // Handle empty anchor for beginning/end types
        if ($anchorLength === 1 && trim($anchorLines[0]) === '') {
            return $insertionType === 'beginning' ? 0 : $linesLength;
        }

        for ($i = 0; $i <= $linesLength - $anchorLength; $i++) {
            $confidence = $this->calculateLineMatchConfidence(
                array_slice($lines, $i, $anchorLength),
                $anchorLines
            );

            if ($confidence >= $minConfidence) {
                return $i;
            }
        }

        return null;
    }

    /**
     * Calculate confidence of line match (handling whitespace variations)
     */
    private function calculateLineMatchConfidence(array $contentLines, array $anchorLines): float
    {
        if (count($contentLines) !== count($anchorLines)) {
            return 0.0;
        }

        $matches = 0;
        foreach ($contentLines as $index => $line) {
            $normalizedContent = trim($line);
            $normalizedAnchor = trim($anchorLines[$index]);

            if ($normalizedContent === $normalizedAnchor) {
                $matches++;
            }
        }

        return $matches / count($anchorLines);
    }

    /**
     * Compute diff between two line arrays (LCS-based)
     * Uses dynamic programming - NO regex
     */
    private function computeDiff(array $templateLines, array $modifiedLines): array
    {
        $m = count($templateLines);
        $n = count($modifiedLines);

        // Build LCS matrix using dynamic programming
        $lcs = [];
        for ($i = 0; $i <= $m; $i++) {
            $lcs[$i] = array_fill(0, $n + 1, 0);
        }

        for ($i = 1; $i <= $m; $i++) {
            for ($j = 1; $j <= $n; $j++) {
                if (trim($templateLines[$i - 1]) === trim($modifiedLines[$j - 1])) {
                    $lcs[$i][$j] = $lcs[$i - 1][$j - 1] + 1;
                } else {
                    $lcs[$i][$j] = max($lcs[$i - 1][$j], $lcs[$i][$j - 1]);
                }
            }
        }

        // Backtrack to find operations
        $operations = [];
        $i = $m;
        $j = $n;

        while ($i > 0 || $j > 0) {
            if ($i > 0 && $j > 0 && trim($templateLines[$i - 1]) === trim($modifiedLines[$j - 1])) {
                $operations[] = [
                    'type' => 'keep',
                    'template_line' => $i - 1,
                    'modified_line' => $j - 1,
                    'content' => $templateLines[$i - 1],
                ];
                $i--;
                $j--;
            } elseif ($j > 0 && ($i === 0 || $lcs[$i][$j - 1] >= $lcs[$i - 1][$j])) {
                $operations[] = [
                    'type' => 'add',
                    'modified_line' => $j - 1,
                    'content' => $modifiedLines[$j - 1],
                ];
                $j--;
            } else {
                $operations[] = [
                    'type' => 'remove',
                    'template_line' => $i - 1,
                    'content' => $templateLines[$i - 1],
                ];
                $i--;
            }
        }

        $operations = array_reverse($operations);

        $commonCount = count(array_filter($operations, fn($op) => $op['type'] === 'keep'));
        $addedCount = count(array_filter($operations, fn($op) => $op['type'] === 'add'));
        $removedCount = count(array_filter($operations, fn($op) => $op['type'] === 'remove'));

        return [
            'common_count' => $commonCount,
            'added_count' => $addedCount,
            'removed_count' => $removedCount,
            'operations' => $operations,
        ];
    }

    /**
     * Extract insertions from diff operations
     */
    private function extractInsertions(array $diff, array $templateLines, array $modifiedLines): array
    {
        $insertions = [];
        $operations = $diff['operations'];

        $currentInsertion = null;
        $lastKeepTemplateLine = -1;
        $lastKeepContent = '';

        foreach ($operations as $index => $op) {
            if ($op['type'] === 'keep') {
                // If we have a pending insertion, finalize it
                if ($currentInsertion !== null) {
                    // Find the next keep line as anchor_after
                    $currentInsertion['anchor_after'] = $op['content'];
                    $insertions[] = $this->finalizeInsertion($currentInsertion, $templateLines);
                    $currentInsertion = null;
                }
                $lastKeepTemplateLine = $op['template_line'];
                $lastKeepContent = $op['content'];
            } elseif ($op['type'] === 'add') {
                if ($currentInsertion === null) {
                    $currentInsertion = [
                        'type' => $lastKeepTemplateLine === -1 ? 'beginning' : 'middle',
                        'anchor_before' => $lastKeepContent,
                        'anchor_before_line' => $lastKeepTemplateLine,
                        'anchor_after' => '',
                        'content_lines' => [],
                    ];
                }
                $currentInsertion['content_lines'][] = $op['content'];
            }
            // We ignore 'remove' operations for insertion extraction
        }

        // Handle insertion at end
        if ($currentInsertion !== null) {
            $currentInsertion['type'] = 'end';
            $insertions[] = $this->finalizeInsertion($currentInsertion, $templateLines);
        }

        return $insertions;
    }

    /**
     * Finalize an insertion with proper anchor text
     */
    private function finalizeInsertion(array $insertion, array $templateLines): array
    {
        // Build anchor text (up to 3 lines for context)
        $anchorLines = [];

        if ($insertion['type'] === 'beginning') {
            // For beginning, anchor is what comes after
            $anchorLines[] = $insertion['anchor_after'];
        } elseif ($insertion['type'] === 'end') {
            // For end, anchor is what comes before
            $anchorLines[] = $insertion['anchor_before'];
        } else {
            // For middle, use the line before as anchor
            $anchorLines[] = $insertion['anchor_before'];
        }

        return [
            'insertion_type' => $insertion['type'],
            'anchor_text' => implode("\n", $anchorLines),
            'insertion_content' => implode("\n", $insertion['content_lines']),
            'line_offset' => 0,
            'line_count' => count($insertion['content_lines']),
        ];
    }

    /**
     * Calculate overall confidence of the analysis
     */
    private function calculateConfidence(array $diff, array $templateLines, array $modifiedLines): float
    {
        $templateCount = count($templateLines);
        if ($templateCount === 0) {
            return 0.0;
        }

        // Confidence based on how much of the template was matched
        // Penalize removed lines heavily
        $matchRatio = $diff['common_count'] / $templateCount;
        $removePenalty = $diff['removed_count'] > 0 ? ($diff['removed_count'] / $templateCount) * 0.5 : 0;

        return max(0.0, min(1.0, $matchRatio - $removePenalty));
    }

    /**
     * Normalize line endings to LF and trim trailing whitespace
     * GitHub removes trailing newlines, so we normalize that too
     */
    private function normalizeLineEndings(string $content): string
    {
        // Convert all line endings to LF
        $content = str_replace(["\r\n", "\r"], "\n", $content);

        // Remove trailing whitespace from each line and trailing newlines at EOF
        // This prevents false-positives from GitHub's newline normalization
        $content = rtrim($content, "\n");

        return $content;
    }

    /**
     * Replace template variables in content
     * Only simple variables, NO control structures
     */
    private function replaceVariables(string $content, array $context): string
    {
        $replacements = [
            '{projectname}' => $context['projectname'] ?? '',
            '{tablename}' => $context['tablename'] ?? '',
            '{filename}' => $context['filename'] ?? '',
            '{filenameshort}' => $context['filenameshort'] ?? '',
            '{languagecode}' => $context['languagecode'] ?? '',
            '{datetime}' => date('Y-m-d H:i:s'),
            '{date}' => date('Y-m-d'),
            '{time}' => date('H:i:s'),
            '{year}' => date('Y'),
            '{month}' => date('m'),
            '{day}' => date('d'),
        ];

        return str_replace(
            array_keys($replacements),
            array_values($replacements),
            $content
        );
    }

    /**
     * Get available variables for insertions
     */
    public function getAvailableVariables(): array
    {
        return [
            '{projectname}' => 'Project name',
            '{tablename}' => 'Current table name (for db_table_file types)',
            '{filename}' => 'Output filename',
            '{filenameshort}' => 'Short filename (2-char abbreviation)',
            '{languagecode}' => 'Current language code (e.g., en, de)',
            '{datetime}' => 'Current date and time (Y-m-d H:i:s)',
            '{date}' => 'Current date (Y-m-d)',
            '{time}' => 'Current time (H:i:s)',
            '{year}' => 'Current year',
            '{month}' => 'Current month',
            '{day}' => 'Current day',
        ];
    }

    // ========== DIRECTORY COMPARISON ==========

    /**
     * Compare an uploaded archive against a reference archive
     *
     * @param \Illuminate\Http\UploadedFile $archive The uploaded modified archive
     * @param string $referenceArchivePath Path to the reference (original) archive
     * @return array
     */
    public function compareUploadedArchive($archive, string $referenceArchivePath): array
    {
        if (!file_exists($referenceArchivePath)) {
            throw new \Exception('Referenz-Archiv existiert nicht mehr: ' . basename($referenceArchivePath));
        }

        // Extract both archives to temp directories
        $tempDir = sys_get_temp_dir() . '/scoriet_compare_' . uniqid();
        $generatedDir = $tempDir . '/generated';
        $modifiedDir = $tempDir . '/modified';

        try {
            mkdir($tempDir, 0777, true);
            mkdir($generatedDir, 0777, true);
            mkdir($modifiedDir, 0777, true);

            // Extract reference archive (filename is already correct)
            $this->extractArchive($referenceArchivePath, $generatedDir);

            // Extract uploaded archive (pass original filename for extension detection)
            $uploadedPath = $archive->getRealPath();
            $originalFilename = $archive->getClientOriginalName();
            $this->extractArchive($uploadedPath, $modifiedDir, $originalFilename);

            // Compare the directories
            $result = $this->compareDirectories($generatedDir, $modifiedDir);

            return $result;
        } finally {
            // Clean up temp directories
            $this->recursiveDelete($tempDir);
        }
    }

    /**
     * Compare files from the Scoriet service
     *
     * @param \App\Models\Project $project
     * @param \App\Models\ProjectGeneration $generation
     * @return array
     */
    public function compareFromService($project, $generation): array
    {
        // TODO: Implement service communication
        // This will connect to the Rust service running on the deployment server
        throw new \Exception('Service-Vergleich ist noch nicht implementiert. Bitte laden Sie ein Archiv hoch.');
    }

    /**
     * Extract an archive (ZIP, tar.gz, tar.xz) to a directory
     *
     * @param string $archivePath Path to the archive file
     * @param string $targetDir Directory to extract to
     * @param string|null $originalFilename Original filename (for uploaded files with .tmp extension)
     */
    private function extractArchive(string $archivePath, string $targetDir, ?string $originalFilename = null): void
    {
        // Determine extension from original filename if provided, otherwise from path
        $extension = strtolower(pathinfo($originalFilename ?? $archivePath, PATHINFO_EXTENSION));

        // If still can't determine, try to detect from file contents (magic bytes)
        if ($extension === 'tmp' || empty($extension)) {
            $extension = $this->detectArchiveType($archivePath);
        }

        if ($extension === 'zip') {
            $zip = new \ZipArchive();
            if ($zip->open($archivePath) === true) {
                $zip->extractTo($targetDir);
                $zip->close();
            } else {
                throw new \Exception('ZIP-Archiv konnte nicht geöffnet werden');
            }
        } elseif (in_array($extension, ['gz', 'xz', 'tgz', 'tar'])) {
            // Use PharData for tar archives
            try {
                $phar = new \PharData($archivePath);
                $phar->extractTo($targetDir);
            } catch (\Exception $e) {
                throw new \Exception('TAR-Archiv konnte nicht extrahiert werden: ' . $e->getMessage());
            }
        } else {
            throw new \Exception('Unbekanntes Archiv-Format: ' . $extension);
        }
    }

    /**
     * Detect archive type from file contents (magic bytes)
     */
    private function detectArchiveType(string $filePath): string
    {
        $handle = fopen($filePath, 'rb');
        if (!$handle) {
            return 'unknown';
        }

        $header = fread($handle, 10);
        fclose($handle);

        // ZIP: starts with PK (0x50 0x4B)
        if (substr($header, 0, 2) === "PK") {
            return 'zip';
        }

        // GZIP: starts with 0x1F 0x8B
        if (substr($header, 0, 2) === "\x1f\x8b") {
            return 'gz';
        }

        // XZ: starts with 0xFD 0x37 0x7A 0x58 0x5A 0x00
        if (substr($header, 0, 6) === "\xfd7zXZ\x00") {
            return 'xz';
        }

        // TAR: check for "ustar" at offset 257 (but we only read 10 bytes, so skip this)
        // For now, return unknown
        return 'unknown';
    }

    /**
     * Compare two directories and return file differences
     */
    private function compareDirectories(string $generatedDir, string $modifiedDir): array
    {
        $files = [];
        $summary = [
            'added' => 0,
            'modified' => 0,
            'deleted' => 0,
            'unchanged' => 0,
        ];

        // Get all files from both directories
        $generatedFiles = $this->getFilesRecursive($generatedDir);
        $modifiedFiles = $this->getFilesRecursive($modifiedDir);

        // Normalize paths (remove base directory)
        $generatedMap = [];
        foreach ($generatedFiles as $file) {
            $relativePath = str_replace($generatedDir . DIRECTORY_SEPARATOR, '', $file);
            $relativePath = str_replace('\\', '/', $relativePath);
            $generatedMap[$relativePath] = $file;
        }

        $modifiedMap = [];
        foreach ($modifiedFiles as $file) {
            $relativePath = str_replace($modifiedDir . DIRECTORY_SEPARATOR, '', $file);
            $relativePath = str_replace('\\', '/', $relativePath);
            $modifiedMap[$relativePath] = $file;
        }

        // Check files in generated directory
        foreach ($generatedMap as $relativePath => $generatedFile) {
            if (isset($modifiedMap[$relativePath])) {
                // File exists in both - check if modified
                $generatedContent = file_get_contents($generatedFile);
                $modifiedContent = file_get_contents($modifiedMap[$relativePath]);

                // Normalize line endings for comparison
                $generatedNorm = $this->normalizeLineEndings($generatedContent);
                $modifiedNorm = $this->normalizeLineEndings($modifiedContent);

                if ($generatedNorm === $modifiedNorm) {
                    $files[] = [
                        'path' => $relativePath,
                        'status' => 'unchanged',
                    ];
                    $summary['unchanged']++;
                } else {
                    $files[] = [
                        'path' => $relativePath,
                        'status' => 'modified',
                        'template_content' => $generatedContent,
                        'modified_content' => $modifiedContent,
                    ];
                    $summary['modified']++;
                }
            } else {
                // File only in generated - deleted by user
                $files[] = [
                    'path' => $relativePath,
                    'status' => 'deleted',
                    'template_content' => file_get_contents($generatedFile),
                ];
                $summary['deleted']++;
            }
        }

        // Check for new files in modified directory
        foreach ($modifiedMap as $relativePath => $modifiedFile) {
            if (!isset($generatedMap[$relativePath])) {
                $files[] = [
                    'path' => $relativePath,
                    'status' => 'added',
                    'modified_content' => file_get_contents($modifiedFile),
                ];
                $summary['added']++;
            }
        }

        // Sort files by status (modified first) then by path
        usort($files, function ($a, $b) {
            $statusOrder = ['modified' => 0, 'added' => 1, 'deleted' => 2, 'unchanged' => 3];
            $statusDiff = $statusOrder[$a['status']] - $statusOrder[$b['status']];
            if ($statusDiff !== 0) {
                return $statusDiff;
            }
            return strcmp($a['path'], $b['path']);
        });

        return [
            'files' => $files,
            'summary' => $summary,
        ];
    }

    /**
     * Get all files recursively from a directory
     */
    private function getFilesRecursive(string $dir): array
    {
        $files = [];

        if (!is_dir($dir)) {
            return $files;
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $item) {
            if ($item->isFile()) {
                $files[] = $item->getPathname();
            }
        }

        return $files;
    }

    /**
     * Recursively delete a directory
     */
    private function recursiveDelete(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }

        $files = array_diff(scandir($dir), ['.', '..']);

        foreach ($files as $file) {
            $path = $dir . DIRECTORY_SEPARATOR . $file;
            if (is_dir($path)) {
                $this->recursiveDelete($path);
            } else {
                unlink($path);
            }
        }

        rmdir($dir);
    }

    // ========== ARCHIVE FILE OPERATIONS ==========

    /**
     * List all files in an archive
     */
    public function listArchiveFiles(string $archivePath): array
    {
        $extension = strtolower(pathinfo($archivePath, PATHINFO_EXTENSION));
        $files = [];

        if ($extension === 'zip') {
            $zip = new \ZipArchive();
            if ($zip->open($archivePath) === true) {
                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $stat = $zip->statIndex($i);
                    $name = $stat['name'];
                    // Skip directories
                    if (substr($name, -1) !== '/') {
                        $files[] = [
                            'path' => str_replace('\\', '/', $name),
                            'size' => $stat['size'],
                        ];
                    }
                }
                $zip->close();
            } else {
                throw new \Exception('ZIP-Archiv konnte nicht geöffnet werden');
            }
        } elseif (in_array($extension, ['gz', 'xz', 'tgz'])) {
            try {
                $phar = new \PharData($archivePath);
                $iterator = new \RecursiveIteratorIterator($phar);
                foreach ($iterator as $file) {
                    if (!$file->isDir()) {
                        $path = str_replace('\\', '/', $file->getPathname());
                        // Remove the phar:// prefix and archive path
                        $path = preg_replace('/^phar:\/\/.*?\.tar[^\/]*\//', '', $path);
                        $files[] = [
                            'path' => $path,
                            'size' => $file->getSize(),
                        ];
                    }
                }
            } catch (\Exception $e) {
                throw new \Exception('TAR-Archiv konnte nicht gelesen werden: ' . $e->getMessage());
            }
        } else {
            throw new \Exception('Unbekanntes Archiv-Format: ' . $extension);
        }

        // Sort by path
        usort($files, fn($a, $b) => strcmp($a['path'], $b['path']));

        return $files;
    }

    /**
     * Extract a single file's content from an archive
     */
    public function extractFileFromArchive(string $archivePath, string $filePath): string
    {
        $extension = strtolower(pathinfo($archivePath, PATHINFO_EXTENSION));

        // Normalize the file path
        $filePath = str_replace('\\', '/', $filePath);

        if ($extension === 'zip') {
            $zip = new \ZipArchive();
            if ($zip->open($archivePath) === true) {
                // Try exact path first
                $content = $zip->getFromName($filePath);

                if ($content === false) {
                    // Try with backslashes
                    $content = $zip->getFromName(str_replace('/', '\\', $filePath));
                }

                $zip->close();

                if ($content === false) {
                    throw new \Exception("Datei '{$filePath}' nicht im Archiv gefunden");
                }

                return $content;
            } else {
                throw new \Exception('ZIP-Archiv konnte nicht geöffnet werden');
            }
        } elseif (in_array($extension, ['gz', 'xz', 'tgz'])) {
            try {
                $phar = new \PharData($archivePath);
                $iterator = new \RecursiveIteratorIterator($phar);

                foreach ($iterator as $file) {
                    $path = str_replace('\\', '/', $file->getPathname());
                    $path = preg_replace('/^phar:\/\/.*?\.tar[^\/]*\//', '', $path);

                    if ($path === $filePath) {
                        return file_get_contents($file->getPathname());
                    }
                }

                throw new \Exception("Datei '{$filePath}' nicht im Archiv gefunden");
            } catch (\Exception $e) {
                if (strpos($e->getMessage(), 'nicht im Archiv') !== false) {
                    throw $e;
                }
                throw new \Exception('TAR-Archiv konnte nicht gelesen werden: ' . $e->getMessage());
            }
        } else {
            throw new \Exception('Unbekanntes Archiv-Format: ' . $extension);
        }
    }

    // ========== GIT COMPARISON ==========

    /**
     * Compare files from a Git repository against a reference generation
     *
     * @param UserGitProvider $gitProvider The connected Git provider
     * @param string $repoFullName Repository full name (e.g. "user/repo")
     * @param string $branch Branch name
     * @param string $directory Optional subdirectory to compare
     * @param string $referenceArchivePath Path to the reference generation archive
     * @return array
     */
    public function compareFromGit(
        UserGitProvider $gitProvider,
        string $repoFullName,
        string $branch,
        string $directory,
        string $referenceArchivePath
    ): array {
        if (!file_exists($referenceArchivePath)) {
            throw new \Exception('Referenz-Archiv existiert nicht mehr: ' . basename($referenceArchivePath));
        }

        $gitService = new GitProviderService();

        // Ensure token is valid (refresh if needed for GitLab)
        $gitProvider = $gitService->ensureValidToken($gitProvider);

        // Fetch files from Git repository (no artificial limit - let GitHub/GitLab API handle rate limits)
        $gitResult = $gitService->getDirectoryContents(
            $gitProvider,
            $repoFullName,
            $branch,
            $directory,
            0 // No limit - user sees actual API errors if rate limited
        );

        $modifiedFiles = $gitResult['files'];

        if (empty($modifiedFiles)) {
            throw new \Exception('Keine Dateien im Git-Verzeichnis gefunden: ' . ($directory ?: '/'));
        }

        // Extract reference archive to temp directory
        $tempDir = sys_get_temp_dir() . '/scoriet_git_compare_' . uniqid();
        $generatedDir = $tempDir . '/generated';

        try {
            mkdir($tempDir, 0777, true);
            mkdir($generatedDir, 0777, true);

            // Extract reference archive
            $this->extractArchive($referenceArchivePath, $generatedDir);

            // Get files from generated directory
            $generatedFiles = $this->getFilesRecursive($generatedDir);

            // Build map of generated files
            $generatedMap = [];
            foreach ($generatedFiles as $file) {
                $relativePath = str_replace($generatedDir . DIRECTORY_SEPARATOR, '', $file);
                $relativePath = str_replace('\\', '/', $relativePath);
                $generatedMap[$relativePath] = file_get_contents($file);
            }

            // Compare files
            $files = [];
            $summary = [
                'added' => 0,
                'modified' => 0,
                'deleted' => 0,
                'unchanged' => 0,
            ];

            // Check files from Git against generated
            foreach ($modifiedFiles as $relativePath => $modifiedContent) {
                if (isset($generatedMap[$relativePath])) {
                    // File exists in both - check if modified
                    $generatedNorm = $this->normalizeLineEndings($generatedMap[$relativePath]);
                    $modifiedNorm = $this->normalizeLineEndings($modifiedContent);

                    if ($generatedNorm === $modifiedNorm) {
                        $files[] = [
                            'path' => $relativePath,
                            'status' => 'unchanged',
                        ];
                        $summary['unchanged']++;
                    } else {
                        $files[] = [
                            'path' => $relativePath,
                            'status' => 'modified',
                            'template_content' => $generatedMap[$relativePath],
                            'modified_content' => $modifiedContent,
                        ];
                        $summary['modified']++;
                    }
                    // Remove from map to track deleted files later
                    unset($generatedMap[$relativePath]);
                } else {
                    // File only in Git - added by user
                    $files[] = [
                        'path' => $relativePath,
                        'status' => 'added',
                        'modified_content' => $modifiedContent,
                    ];
                    $summary['added']++;
                }
            }

            // Remaining files in generatedMap are deleted
            foreach ($generatedMap as $relativePath => $generatedContent) {
                $files[] = [
                    'path' => $relativePath,
                    'status' => 'deleted',
                    'template_content' => $generatedContent,
                ];
                $summary['deleted']++;
            }

            // Sort files by status (modified first) then by path
            usort($files, function ($a, $b) {
                $statusOrder = ['modified' => 0, 'added' => 1, 'deleted' => 2, 'unchanged' => 3];
                $statusDiff = $statusOrder[$a['status']] - $statusOrder[$b['status']];
                if ($statusDiff !== 0) {
                    return $statusDiff;
                }
                return strcmp($a['path'], $b['path']);
            });

            return [
                'files' => $files,
                'summary' => $summary,
                'git_info' => [
                    'provider' => $gitProvider->provider,
                    'repository' => $repoFullName,
                    'branch' => $branch,
                    'directory' => $directory,
                    'files_fetched' => $gitResult['fetched'],
                    'files_total' => $gitResult['total_in_tree'],
                    'truncated' => $gitResult['truncated'],
                ],
            ];
        } finally {
            // Clean up temp directory
            $this->recursiveDelete($tempDir);
        }
    }
}
