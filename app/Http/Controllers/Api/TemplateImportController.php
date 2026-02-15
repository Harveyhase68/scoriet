<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use ZipArchive;
use PharData;

class TemplateImportController extends Controller
{
    // Directories that are typically static dependencies
    private const STATIC_DIRECTORY_PATTERNS = [
        'vendor',
        'node_modules',
        '.git',
        '.svn',
        '.hg',
        'bower_components',
        '__pycache__',
        '.idea',
        '.vscode',
    ];

    // File extensions that are typically templates (code files)
    private const TEMPLATE_EXTENSIONS = [
        'php', 'js', 'ts', 'jsx', 'tsx', 'vue', 'svelte',
        'html', 'htm', 'twig', 'blade.php', 'phtml',
        'css', 'scss', 'sass', 'less',
        'py', 'rb', 'java', 'cs', 'go', 'rs',
        'sql', 'sh', 'bash', 'ps1', 'bat', 'cmd',
        'xml', 'yaml', 'yml', 'toml',
    ];

    // File extensions that are typically static (binary/minified)
    private const STATIC_EXTENSIONS = [
        'min.js', 'min.css', 'bundle.js', 'bundle.css',
        'png', 'jpg', 'jpeg', 'gif', 'ico', 'svg', 'webp',
        'woff', 'woff2', 'ttf', 'eot', 'otf',
        'pdf', 'doc', 'docx', 'xls', 'xlsx',
        'zip', 'tar', 'gz', 'rar', '7z',
        'mp3', 'mp4', 'avi', 'mov', 'webm',
    ];

    // Files to ignore completely
    private const IGNORE_PATTERNS = [
        '.DS_Store',
        'Thumbs.db',
        '.gitkeep',
        '.gitattributes',
    ];

    /**
     * Upload and extract an archive, return file list for wizard
     */
    public function upload(Request $request): JsonResponse
    {
        // Ensure enough time and memory for large archive extraction
        set_time_limit(300);
        ini_set('memory_limit', '512M');

        $request->validate([
            'archive' => 'required|file|max:102400', // Max 100MB
        ]);

        $user = Auth::user();
        $file = $request->file('archive');
        $originalName = $file->getClientOriginalName();
        $extension = strtolower($file->getClientOriginalExtension());

        // Validate extension
        $allowedExtensions = ['zip', 'gz', 'xz', 'tar'];
        $fullExtension = $this->getFullExtension($originalName);

        if (!in_array($extension, $allowedExtensions) && !in_array($fullExtension, ['tar.gz', 'tar.xz', 'tgz'])) {
            return response()->json([
                'message' => 'Ungültiges Archivformat. Erlaubt: .zip, .tar.gz, .tar.xz',
                'error_code' => 'INVALID_FORMAT',
            ], 422);
        }

        // Create temporary session ID for this import
        $sessionId = Str::uuid()->toString();
        $tempDir = storage_path("app/temp/import_{$sessionId}");

        try {
            // Create temp directory
            if (!is_dir($tempDir)) {
                mkdir($tempDir, 0755, true);
            }

            // Store the uploaded file temporarily
            $archivePath = $tempDir . '/archive.' . $extension;
            $file->move($tempDir, 'archive.' . $extension);

            // Handle compound extensions
            if ($fullExtension === 'tar.gz' || $fullExtension === 'tgz') {
                rename($archivePath, $tempDir . '/archive.tar.gz');
                $archivePath = $tempDir . '/archive.tar.gz';
            } elseif ($fullExtension === 'tar.xz') {
                rename($archivePath, $tempDir . '/archive.tar.xz');
                $archivePath = $tempDir . '/archive.tar.xz';
            }

            // Extract archive
            $extractDir = $tempDir . '/extracted';
            mkdir($extractDir, 0755, true);

            $this->extractArchive($archivePath, $extractDir);

            // Detect root prefix (single root directory that should be stripped from paths)
            $rootPrefix = $this->detectRootPrefix($extractDir);

            // Scan extracted files (with prefix stripped from paths)
            $files = $this->scanDirectory($extractDir, $extractDir);

            // Return ALL files (no filtering) - frontend handles categorization
            $allFiles = [];
            foreach ($files as $file) {
                // Skip directories - we only want files
                if ($file['is_dir']) {
                    continue;
                }
                $file['file_type'] = $this->detectFileType($file['name']);
                $allFiles[] = $file;
            }

            // Store session data including root prefix for file access
            $sessionData = [
                'user_id' => $user->id,
                'session_id' => $sessionId,
                'original_name' => $originalName,
                'extract_dir' => $extractDir,
                'temp_dir' => $tempDir,
                'root_prefix' => $rootPrefix,
                'created_at' => now()->toISOString(),
                'file_count' => count($allFiles),
            ];

            file_put_contents($tempDir . '/session.json', json_encode($sessionData));

            return response()->json([
                'success' => true,
                'session_id' => $sessionId,
                'original_name' => $originalName,
                'file_count' => count($allFiles),
                'all_files' => $allFiles,
            ]);

        } catch (\Exception $e) {
            // Cleanup on error
            $this->cleanupTempDir($tempDir);

            \Log::error('Template import upload failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Fehler beim Extrahieren des Archivs: ' . $e->getMessage(),
                'error_code' => 'EXTRACTION_FAILED',
            ], 500);
        }
    }

    /**
     * Get file list for an existing import session
     */
    public function getFiles(Request $request, string $sessionId): JsonResponse
    {
        $user = Auth::user();
        $tempDir = storage_path("app/temp/import_{$sessionId}");

        if (!is_dir($tempDir)) {
            return response()->json([
                'message' => 'Import-Session nicht gefunden oder abgelaufen',
                'error_code' => 'SESSION_NOT_FOUND',
            ], 404);
        }

        $sessionData = json_decode(file_get_contents($tempDir . '/session.json'), true);

        if ($sessionData['user_id'] !== $user->id) {
            return response()->json([
                'message' => 'Keine Berechtigung für diese Import-Session',
                'error_code' => 'UNAUTHORIZED',
            ], 403);
        }

        $extractDir = $sessionData['extract_dir'];
        $files = $this->scanDirectory($extractDir, $extractDir);

        // Return ALL files (no filtering) - frontend handles categorization
        $allFiles = [];
        foreach ($files as $file) {
            if ($file['is_dir']) {
                continue;
            }
            $file['file_type'] = $this->detectFileType($file['name']);
            $allFiles[] = $file;
        }

        return response()->json([
            'success' => true,
            'session_id' => $sessionId,
            'original_name' => $sessionData['original_name'],
            'file_count' => count($allFiles),
            'all_files' => $allFiles,
        ]);
    }

    /**
     * Preview a file's content
     */
    public function previewFile(Request $request, string $sessionId): JsonResponse
    {
        $request->validate([
            'path' => 'required|string',
        ]);

        $user = Auth::user();
        $tempDir = storage_path("app/temp/import_{$sessionId}");

        if (!is_dir($tempDir)) {
            return response()->json([
                'message' => 'Import-Session nicht gefunden',
                'error_code' => 'SESSION_NOT_FOUND',
            ], 404);
        }

        $sessionData = json_decode(file_get_contents($tempDir . '/session.json'), true);

        if ($sessionData['user_id'] !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Resolve actual file path using root prefix if exists
        $filePath = $this->resolveFilePath($sessionData, $request->path);

        // Security check - ensure path is within extract dir
        $realPath = realpath($filePath);
        $realExtractDir = realpath($sessionData['extract_dir']);

        if (!$realPath || strpos($realPath, $realExtractDir) !== 0) {
            return response()->json([
                'message' => 'Ungültiger Dateipfad',
                'error_code' => 'INVALID_PATH',
            ], 400);
        }

        if (!is_file($realPath)) {
            return response()->json([
                'message' => 'Datei nicht gefunden',
                'error_code' => 'FILE_NOT_FOUND',
            ], 404);
        }

        // Check if binary
        $mimeType = mime_content_type($realPath);
        $isBinary = !str_starts_with($mimeType, 'text/') && $mimeType !== 'application/json';

        if ($isBinary) {
            return response()->json([
                'success' => true,
                'path' => $request->path,
                'is_binary' => true,
                'mime_type' => $mimeType,
                'size' => filesize($realPath),
                'content' => null,
            ]);
        }

        // Read text file (limit to 100KB for preview)
        $content = file_get_contents($realPath, false, null, 0, 102400);
        $truncated = filesize($realPath) > 102400;

        return response()->json([
            'success' => true,
            'path' => $request->path,
            'is_binary' => false,
            'mime_type' => $mimeType,
            'size' => filesize($realPath),
            'content' => $content,
            'truncated' => $truncated,
        ]);
    }

    /**
     * Create template from wizard selections
     */
    public function createTemplate(Request $request, string $sessionId): JsonResponse
    {
        // Ensure enough time and memory for large template creation (ZIP packing etc.)
        set_time_limit(300);
        ini_set('memory_limit', '512M');

        $validated = $request->validate([
            'name' => 'required|string|max:255|regex:/^[a-z0-9]+(_[a-z0-9]+)*$/',
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'language' => 'required|string|max:50',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'visibility' => 'required|in:public,private,store',
            'is_system' => 'nullable|boolean',
            'unlock_private' => 'nullable|boolean',
            'import_mode' => 'nullable|in:new,overwrite,merge',
            'template_files' => 'required|array',
            'template_files.*' => 'string',
            'static_files' => 'nullable|array',
            'static_files.*' => 'string',
            'static_directory_files' => 'nullable|array',
            'static_directory_files.*' => 'string',
            'static_directory_name' => 'nullable|string|max:100',
        ]);

        $user = Auth::user();
        $tempDir = storage_path("app/temp/import_{$sessionId}");

        if (!is_dir($tempDir)) {
            return response()->json([
                'message' => 'Import-Session nicht gefunden oder abgelaufen',
                'error_code' => 'SESSION_NOT_FOUND',
            ], 404);
        }

        $sessionData = json_decode(file_get_contents($tempDir . '/session.json'), true);

        if ($sessionData['user_id'] !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check for duplicate template name
        $importMode = $validated['import_mode'] ?? 'new';
        $existingTemplate = Template::where('creator_user_id', $user->id)
            ->where('name', $validated['name'])
            ->first();

        if ($existingTemplate && $importMode === 'new') {
            return response()->json([
                'message' => 'Ein Template mit diesem Namen existiert bereits',
                'error_code' => 'DUPLICATE_NAME',
                'existing_template_id' => $existingTemplate->id,
                'existing_file_count' => $existingTemplate->files()->count(),
            ], 409);
        }

        // Overwrite: delete all files and the template, then recreate
        if ($existingTemplate && $importMode === 'overwrite') {
            $existingTemplate->files()->delete();
            $existingTemplate->delete();
            $existingTemplate = null; // Force new creation
        }

        // Merge: we'll reuse the existing template (handled below)
        $isMerge = $existingTemplate && $importMode === 'merge';

        // Check credit requirements for private template
        $wantsPrivate = $validated['visibility'] === 'private';
        $isFreeUser = $user->user_type === 'free' || !$user->user_type;
        $needsPayment = false;
        $requiredCredits = 50;

        if ($wantsPrivate && $isFreeUser) {
            $activeSubscriptionsCount = Subscription::where('user_id', $user->id)
                ->where('subscription_type', Subscription::TYPE_TEMPLATE)
                ->where('is_active', true)
                ->where('expires_at', '>', now())
                ->count();

            $ownedPrivateTemplatesCount = Template::where('creator_user_id', $user->id)
                ->where('visibility', 'private')
                ->count();

            if ($ownedPrivateTemplatesCount >= $activeSubscriptionsCount) {
                if ($user->credits < $requiredCredits) {
                    return response()->json([
                        'message' => "Nicht genug Credits für privates Template",
                        'error_code' => 'INSUFFICIENT_CREDITS',
                        'required_credits' => $requiredCredits,
                        'current_credits' => $user->credits,
                    ], 402);
                }
                $needsPayment = true;
            }
        }

        $extractDir = $sessionData['extract_dir'];

        try {
            $template = \DB::transaction(function () use ($user, $validated, $extractDir, $needsPayment, $requiredCredits, $isMerge, $existingTemplate) {
                // Merge: reuse existing template, update metadata
                if ($isMerge && $existingTemplate) {
                    $existingTemplate->update([
                        'description' => $validated['description'] ?? $existingTemplate->description,
                        'category' => $validated['category'],
                        'language' => $validated['language'],
                        'tags' => $validated['tags'] ?? $existingTemplate->tags,
                    ]);
                    return $existingTemplate;
                }

                // Create new template
                $isSystemTemplate = false;
                if (($validated['is_system'] ?? false) && $user->isAdmin()) {
                    $isSystemTemplate = true;
                }

                $template = Template::create([
                    'name' => $validated['name'],
                    'description' => $validated['description'] ?? null,
                    'category' => $validated['category'],
                    'language' => $validated['language'],
                    'tags' => $validated['tags'] ?? [],
                    'creator_user_id' => $user->id,
                    'is_active' => true,
                    'visibility' => $validated['visibility'],
                    'is_system_template' => $isSystemTemplate,
                ]);

                // Handle payment (only for new templates, not merge)
                if ($needsPayment) {
                    Subscription::create([
                        'user_id' => $user->id,
                        'subscription_type' => Subscription::TYPE_TEMPLATE,
                        'entity_id' => null,
                        'is_free_tier' => false,
                        'expires_at' => now()->addYear(),
                        'is_active' => true,
                    ]);

                    $user->credits -= $requiredCredits;
                    $user->save();

                    \App\Models\CreditTransaction::create([
                        'user_id' => $user->id,
                        'amount' => -$requiredCredits,
                        'type' => 'templates_unlock',
                        'description' => "Private template slot (1 year) - imported: {$validated['name']}",
                    ]);
                }

                return $template;
            });

            // For merge mode: get the highest existing file_order so new files go after
            $fileOrder = $isMerge ? ($template->files()->max('file_order') + 1) : 0;
            $errors = [];
            $filesUpdated = 0;
            $filesAdded = 0;

            // Debug logging
            \Log::info('Template import: Starting file processing', [
                'session_id' => $sessionId,
                'extract_dir' => $extractDir,
                'root_prefix' => $sessionData['root_prefix'] ?? '',
                'import_mode' => $isMerge ? 'merge' : 'new/overwrite',
                'template_files_count' => count($validated['template_files']),
                'static_files_count' => count($validated['static_files'] ?? []),
                'static_directory_files_count' => count($validated['static_directory_files'] ?? []),
            ]);

            // Add template files
            foreach ($validated['template_files'] as $filePath) {
                $fullPath = $this->resolveFilePath($sessionData, $filePath);

                if (is_file($fullPath)) {
                    $content = file_get_contents($fullPath);
                    $fileName = basename($filePath);

                    // Merge: update existing file or add new
                    if ($isMerge) {
                        $existingFile = $template->files()->where('file_path', $filePath)->first();
                        if ($existingFile) {
                            $existingFile->update([
                                'file_content' => $content,
                                'file_name' => $fileName,
                            ]);
                            $filesUpdated++;
                            continue;
                        }
                    }

                    $template->files()->create([
                        'file_name' => $fileName,
                        'file_path' => $filePath,
                        'file_content' => $content,
                        'file_type' => 'db_table_file',
                        'file_order' => $fileOrder++,
                        'output_path' => ($dir = dirname($filePath)) === '.' ? '/' : $dir,
                        'content_type' => 'text',
                    ]);
                    $filesAdded++;
                } else {
                    $errors[] = "Template file not found: {$filePath} (resolved to: {$fullPath})";
                    \Log::warning('Template import: File not found', [
                        'relative_path' => $filePath,
                        'full_path' => $fullPath,
                    ]);
                }
            }

            // Add static files
            if (!empty($validated['static_files'])) {
                foreach ($validated['static_files'] as $filePath) {
                    $fullPath = $this->resolveFilePath($sessionData, $filePath);

                    if (is_file($fullPath)) {
                        $content = file_get_contents($fullPath);
                        $fileName = basename($filePath);

                        // Check if binary - encode as base64
                        $mimeType = mime_content_type($fullPath);
                        $isBinary = !str_starts_with($mimeType, 'text/') && $mimeType !== 'application/json';
                        $encodedContent = $isBinary ? base64_encode($content) : $content;

                        // Merge: update existing file or add new
                        if ($isMerge) {
                            $existingFile = $template->files()->where('file_path', $filePath)->first();
                            if ($existingFile) {
                                $existingFile->update([
                                    'file_content' => $encodedContent,
                                    'file_name' => $fileName,
                                ]);
                                $filesUpdated++;
                                continue;
                            }
                        }

                        $template->files()->create([
                            'file_name' => $fileName,
                            'file_path' => $filePath,
                            'file_content' => $encodedContent,
                            'file_type' => 'static_file',
                            'file_order' => $fileOrder++,
                            'output_path' => ($dir = dirname($filePath)) === '.' ? '/' : $dir,
                            'content_type' => 'text',
                        ]);
                        $filesAdded++;
                    } else {
                        $errors[] = "Static file not found: {$filePath} (resolved to: {$fullPath})";
                        \Log::warning('Template import: Static file not found', [
                            'relative_path' => $filePath,
                            'full_path' => $fullPath,
                        ]);
                    }
                }
            }

            // Create static directory archive
            if (!empty($validated['static_directory_files'])) {
                $staticDirName = $validated['static_directory_name'] ?? 'dependencies';
                $zipContent = $this->createZipFromPaths($sessionData, $validated['static_directory_files']);

                // Merge: update existing static directory or add new
                if ($isMerge) {
                    $existingStaticDir = $template->files()->where('file_type', 'static_directory')->first();
                    if ($existingStaticDir) {
                        $existingStaticDir->update([
                            'file_name' => $staticDirName,
                            'file_path' => $staticDirName . '.zip',
                            'file_content' => base64_encode($zipContent),
                            'zip_filename' => $staticDirName . '.zip',
                        ]);
                        $filesUpdated++;
                    } else {
                        $template->files()->create([
                            'file_name' => $staticDirName,
                            'file_path' => $staticDirName . '.zip',
                            'file_content' => base64_encode($zipContent),
                            'file_type' => 'static_directory',
                            'file_order' => $fileOrder++,
                            'output_path' => '/',
                            'content_type' => 'zip',
                            'zip_filename' => $staticDirName . '.zip',
                        ]);
                        $filesAdded++;
                    }
                } else {
                    $template->files()->create([
                        'file_name' => $staticDirName,
                        'file_path' => $staticDirName . '.zip',
                        'file_content' => base64_encode($zipContent),
                        'file_type' => 'static_directory',
                        'file_order' => $fileOrder++,
                        'output_path' => '/',
                        'content_type' => 'zip',
                        'zip_filename' => $staticDirName . '.zip',
                    ]);
                    $filesAdded++;
                }
            }

            // Update file count
            $template->update(['file_count' => $template->files()->count()]);

            // Log any errors that occurred
            if (!empty($errors)) {
                \Log::warning('Template import completed with errors', [
                    'template_id' => $template->id,
                    'errors' => $errors,
                ]);
            }

            // Cleanup temp directory
            $this->cleanupTempDir($tempDir);

            return response()->json([
                'success' => true,
                'template' => $template->load('files'),
                'import_mode' => $isMerge ? 'merge' : ($importMode === 'overwrite' ? 'overwrite' : 'new'),
                'credits_deducted' => $needsPayment ? $requiredCredits : 0,
                'new_credits_balance' => $user->fresh()->credits,
                'stats' => [
                    'template_files' => count($validated['template_files']),
                    'static_files' => count($validated['static_files'] ?? []),
                    'static_directory_files' => count($validated['static_directory_files'] ?? []),
                    'files_total' => $template->files()->count(),
                    'files_added' => $filesAdded,
                    'files_updated' => $filesUpdated,
                ],
                'warnings' => $errors,
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Template import creation failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'session_id' => $sessionId,
            ]);

            return response()->json([
                'message' => 'Fehler beim Erstellen des Templates: ' . $e->getMessage(),
                'error_code' => 'CREATION_FAILED',
            ], 500);
        }
    }

    /**
     * Cancel and cleanup an import session
     */
    public function cancel(string $sessionId): JsonResponse
    {
        $user = Auth::user();
        $tempDir = storage_path("app/temp/import_{$sessionId}");

        if (is_dir($tempDir)) {
            $sessionFile = $tempDir . '/session.json';
            if (file_exists($sessionFile)) {
                $sessionData = json_decode(file_get_contents($sessionFile), true);
                if ($sessionData['user_id'] === $user->id) {
                    $this->cleanupTempDir($tempDir);
                }
            }
        }

        return response()->json(['success' => true]);
    }

    // ==================== HELPER METHODS ====================

    private function getFullExtension(string $filename): string
    {
        if (preg_match('/\.(tar\.gz|tar\.xz|tar\.bz2)$/i', $filename, $matches)) {
            return strtolower($matches[1]);
        }
        if (str_ends_with(strtolower($filename), '.tgz')) {
            return 'tar.gz';
        }
        return strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    }

    /**
     * Detect if there's a single root directory that should be stripped from paths
     */
    private function detectRootPrefix(string $extractDir): string
    {
        $items = array_diff(scandir($extractDir), ['.', '..']);
        if (count($items) === 1) {
            $singleItem = reset($items);
            if (is_dir($extractDir . '/' . $singleItem)) {
                return $singleItem;
            }
        }
        return '';
    }

    /**
     * Resolve a stripped file path back to its actual location on disk
     */
    private function resolveFilePath(array $sessionData, string $relativePath): string
    {
        $extractDir = $sessionData['extract_dir'];
        $rootPrefix = $sessionData['root_prefix'] ?? '';

        // If there's a root prefix, prepend it to the path
        if ($rootPrefix) {
            return $extractDir . '/' . $rootPrefix . '/' . ltrim($relativePath, '/');
        }

        return $extractDir . '/' . ltrim($relativePath, '/');
    }

    private function extractArchive(string $archivePath, string $extractDir): void
    {
        $extension = $this->getFullExtension($archivePath);

        if ($extension === 'zip') {
            $zip = new ZipArchive();
            if ($zip->open($archivePath) === true) {
                $zip->extractTo($extractDir);
                $zip->close();
            } else {
                throw new \Exception('Konnte ZIP-Archiv nicht öffnen');
            }
        } elseif (in_array($extension, ['tar.gz', 'tar.xz', 'gz', 'xz'])) {
            // Handle tar.gz and tar.xz
            try {
                if ($extension === 'tar.gz' || $extension === 'gz') {
                    $phar = new PharData($archivePath);
                    // Decompress to tar
                    $tarPath = str_replace(['.tar.gz', '.tgz', '.gz'], '.tar', $archivePath);
                    if (!file_exists($tarPath)) {
                        $phar->decompress();
                    }
                    // Extract tar
                    $tar = new PharData($tarPath);
                    $tar->extractTo($extractDir);
                } elseif ($extension === 'tar.xz' || $extension === 'xz') {
                    // For tar.xz we need to use command line on Windows
                    // or a PHP extension
                    $tarPath = str_replace(['.tar.xz', '.xz'], '.tar', $archivePath);

                    // Try using 7-zip if available, otherwise use xz command
                    if (PHP_OS_FAMILY === 'Windows') {
                        // Use PHP's built-in if available, or shell command
                        exec("tar -xf \"{$archivePath}\" -C \"{$extractDir}\" 2>&1", $output, $returnCode);
                        if ($returnCode !== 0) {
                            throw new \Exception('tar.xz extraction failed. Please use .zip or .tar.gz format.');
                        }
                    } else {
                        exec("tar -xJf \"{$archivePath}\" -C \"{$extractDir}\" 2>&1", $output, $returnCode);
                        if ($returnCode !== 0) {
                            throw new \Exception('Failed to extract tar.xz archive');
                        }
                    }
                }
            } catch (\Exception $e) {
                throw new \Exception('Fehler beim Extrahieren: ' . $e->getMessage());
            }
        } else {
            throw new \Exception('Unbekanntes Archivformat');
        }

        // Check if there's a single root directory - we'll handle the prefix in scanDirectory
        // Note: We don't flatten here because rename() can fail on Windows with permission errors
    }

    private function scanDirectory(string $dir, string $baseDir): array
    {
        $files = [];

        // Check if there's a single root directory that we should strip from paths
        $rootPrefix = $this->detectRootPrefix($baseDir);
        if ($rootPrefix) {
            $rootPrefix .= '/';
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $file) {
            $relativePath = str_replace($baseDir . DIRECTORY_SEPARATOR, '', $file->getPathname());
            $relativePath = str_replace('\\', '/', $relativePath);

            // Strip root prefix if exists (e.g., "ScoopInstaller-Scoop-ebd8c03/")
            if ($rootPrefix && strpos($relativePath, $rootPrefix) === 0) {
                $relativePath = substr($relativePath, strlen($rootPrefix));
                // Skip empty paths (the root directory itself)
                if (empty($relativePath)) {
                    continue;
                }
            }

            // Skip ignored files
            $basename = basename($relativePath);
            if (in_array($basename, self::IGNORE_PATTERNS)) {
                continue;
            }

            $files[] = [
                'path' => $relativePath,
                'name' => $basename,
                'is_dir' => $file->isDir(),
                'size' => $file->isDir() ? 0 : $file->getSize(),
                'extension' => $file->isDir() ? null : strtolower($file->getExtension()),
            ];
        }

        // Sort: directories first, then files alphabetically
        usort($files, function ($a, $b) {
            if ($a['is_dir'] !== $b['is_dir']) {
                return $b['is_dir'] - $a['is_dir'];
            }
            return strcasecmp($a['path'], $b['path']);
        });

        return $files;
    }

    private function categorizeFiles(array $files): array
    {
        $result = [
            'template_candidates' => [],
            'static_candidates' => [],
            'static_directory_candidates' => [],
            'ignored' => [],
        ];

        $processedDirs = [];

        foreach ($files as $file) {
            $path = $file['path'];
            $pathParts = explode('/', $path);
            $topLevelDir = $pathParts[0];

            // Check if top-level dir is a known static directory
            if (in_array($topLevelDir, self::STATIC_DIRECTORY_PATTERNS)) {
                if (!in_array($topLevelDir, $processedDirs)) {
                    $processedDirs[] = $topLevelDir;
                    // Add just the directory entry
                    $dirFiles = array_filter($files, fn($f) => str_starts_with($f['path'], $topLevelDir . '/') || $f['path'] === $topLevelDir);
                    $fileCount = count(array_filter($dirFiles, fn($f) => !$f['is_dir']));

                    $result['static_directory_candidates'][] = [
                        'path' => $topLevelDir,
                        'name' => $topLevelDir,
                        'is_dir' => true,
                        'file_count' => $fileCount,
                        'size' => array_sum(array_column($dirFiles, 'size')),
                        'reason' => 'known_dependency_dir',
                    ];
                }
                continue;
            }

            // Skip files inside static directories
            $insideStaticDir = false;
            foreach (self::STATIC_DIRECTORY_PATTERNS as $pattern) {
                if (str_starts_with($path, $pattern . '/')) {
                    $insideStaticDir = true;
                    break;
                }
            }
            if ($insideStaticDir) {
                continue;
            }

            // Skip directories for now (we only care about files for template/static)
            if ($file['is_dir']) {
                continue;
            }

            $extension = $file['extension'];
            $fullExtension = $this->getFileFullExtension($file['name']);

            // Check if static file
            if (in_array($fullExtension, self::STATIC_EXTENSIONS) || in_array($extension, self::STATIC_EXTENSIONS)) {
                $file['file_type'] = $this->detectFileType($file['name']);
                $file['reason'] = 'static_extension';
                $result['static_candidates'][] = $file;
            }
            // Check if template file
            elseif (in_array($extension, self::TEMPLATE_EXTENSIONS) || in_array($fullExtension, self::TEMPLATE_EXTENSIONS)) {
                $file['file_type'] = $this->detectFileType($file['name']);
                $file['reason'] = 'code_file';
                $result['template_candidates'][] = $file;
            }
            // Everything else goes to static
            else {
                $file['file_type'] = $this->detectFileType($file['name']);
                $file['reason'] = 'unknown';
                $result['static_candidates'][] = $file;
            }
        }

        return $result;
    }

    private function getFileFullExtension(string $filename): string
    {
        // Check for compound extensions like .min.js, .blade.php
        $patterns = ['/\.(min\.js)$/i', '/\.(min\.css)$/i', '/\.(blade\.php)$/i', '/\.(bundle\.js)$/i'];
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $filename, $matches)) {
                return strtolower($matches[1]);
            }
        }
        return strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    }

    private function detectFileType(string $filename): string
    {
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        $typeMap = [
            'php' => 'php',
            'js' => 'javascript',
            'ts' => 'typescript',
            'jsx' => 'javascript',
            'tsx' => 'typescript',
            'vue' => 'vue',
            'svelte' => 'svelte',
            'html' => 'html',
            'htm' => 'html',
            'css' => 'css',
            'scss' => 'scss',
            'sass' => 'sass',
            'less' => 'less',
            'json' => 'json',
            'xml' => 'xml',
            'yaml' => 'yaml',
            'yml' => 'yaml',
            'md' => 'markdown',
            'sql' => 'sql',
            'sh' => 'shell',
            'bash' => 'shell',
            'py' => 'python',
            'rb' => 'ruby',
            'java' => 'java',
            'cs' => 'csharp',
            'go' => 'go',
            'rs' => 'rust',
            'png' => 'image',
            'jpg' => 'image',
            'jpeg' => 'image',
            'gif' => 'image',
            'svg' => 'svg',
            'ico' => 'image',
            'webp' => 'image',
            'zip' => 'archive',
            'tar' => 'archive',
            'gz' => 'archive',
        ];

        // Check for blade.php
        if (str_ends_with(strtolower($filename), '.blade.php')) {
            return 'blade';
        }

        return $typeMap[$extension] ?? 'text';
    }

    private function generateSuggestions(array $categorizedFiles): array
    {
        return [
            'template_count' => count($categorizedFiles['template_candidates']),
            'static_count' => count($categorizedFiles['static_candidates']),
            'static_directory_count' => count($categorizedFiles['static_directory_candidates']),
            'has_vendor' => collect($categorizedFiles['static_directory_candidates'])->contains('path', 'vendor'),
            'has_node_modules' => collect($categorizedFiles['static_directory_candidates'])->contains('path', 'node_modules'),
            'recommended_template_extensions' => ['php', 'js', 'html', 'css', 'vue'],
        ];
    }

    private function createZipFromPaths(array $sessionData, array $paths): string
    {
        $tempZip = tempnam(sys_get_temp_dir(), 'static_dir_') . '.zip';
        $zip = new ZipArchive();

        if ($zip->open($tempZip, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \Exception('Konnte ZIP-Archiv nicht erstellen');
        }

        foreach ($paths as $relativePath) {
            $fullPath = $this->resolveFilePath($sessionData, $relativePath);

            if (is_file($fullPath)) {
                $zip->addFile($fullPath, $relativePath);
            } elseif (is_dir($fullPath)) {
                // Add directory recursively
                $this->addDirToZip($zip, $fullPath, $relativePath);
            }
        }

        $zip->close();

        $content = file_get_contents($tempZip);
        unlink($tempZip);

        return $content;
    }

    private function addDirToZip(ZipArchive $zip, string $dir, string $zipPath): void
    {
        $zip->addEmptyDir($zipPath);

        $items = array_diff(scandir($dir), ['.', '..']);
        foreach ($items as $item) {
            $fullPath = $dir . '/' . $item;
            $itemZipPath = $zipPath . '/' . $item;

            if (is_dir($fullPath)) {
                $this->addDirToZip($zip, $fullPath, $itemZipPath);
            } else {
                $zip->addFile($fullPath, $itemZipPath);
            }
        }
    }

    private function cleanupTempDir(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }

        $items = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($items as $item) {
            if ($item->isDir()) {
                rmdir($item->getPathname());
            } else {
                unlink($item->getPathname());
            }
        }

        rmdir($dir);
    }
}
