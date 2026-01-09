<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CliTask;
use App\Models\TemplateFile;
use App\Services\SchemaStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use ZipArchive;

class SvcController extends Controller
{
    /**
     * Get next pending task from queue
     * Called by scoriet-svc to poll for work
     *
     * GET /api/svc/queue
     */
    public function getQueue(Request $request): JsonResponse
    {
        // Get next pending task (highest priority first, then oldest)
        $task = CliTask::where('status', CliTask::STATUS_PENDING)
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'asc')
            ->first();

        if (!$task) {
            return response()->json([
                'success' => true,
                'task' => null,
                'message' => 'No pending tasks',
            ]);
        }

        // Mark task as processing
        $task->markAsProcessing();

        Log::info('📤 [SVC] Task dispatched to service', [
            'task_id' => $task->id,
            'type' => $task->task_type,
            'user_id' => $task->user_id,
            'project_id' => $task->project_id,
        ]);

        return response()->json([
            'success' => true,
            'task' => [
                'id' => $task->id,
                'type' => $task->task_type,
                'user_id' => $task->user_id,
                'project_id' => $task->project_id,
                'payload' => $task->payload,
                'retry_count' => $task->retry_count,
                'created_at' => $task->created_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Report task completion
     * Called by scoriet-svc when task succeeds
     *
     * POST /api/svc/tasks/{id}/complete
     */
    public function completeTask(int $id, Request $request): JsonResponse
    {
        $task = CliTask::find($id);

        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => 'Task not found',
            ], 404);
        }

        $result = $request->input('result', []);
        $task->markAsCompleted($result);

        Log::info('✅ [SVC] Task completed', [
            'task_id' => $task->id,
            'type' => $task->task_type,
            'duration' => $task->completed_at->diffInSeconds($task->started_at),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Task marked as completed',
        ]);
    }

    /**
     * Report task failure
     * Called by scoriet-svc when task fails
     *
     * POST /api/svc/tasks/{id}/fail
     */
    public function failTask(int $id, Request $request): JsonResponse
    {
        $task = CliTask::find($id);

        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => 'Task not found',
            ], 404);
        }

        $errorMessage = $request->input('error_message', 'Unknown error');
        $allowRetry = $request->input('allow_retry', true); // Default: allow retry

        $task->markAsFailed($errorMessage);

        Log::warning('❌ [SVC] Task failed', [
            'task_id' => $task->id,
            'type' => $task->task_type,
            'error' => $errorMessage,
            'retry_count' => $task->retry_count,
            'can_retry' => $task->canRetry(),
            'allow_retry' => $allowRetry,
        ]);

        // Auto-retry if possible AND allowed
        if ($allowRetry && $task->canRetry()) {
            $task->resetForRetry();
            Log::info('🔄 [SVC] Task reset for retry', [
                'task_id' => $task->id,
                'retry_count' => $task->retry_count,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Task marked as failed',
            'can_retry' => $allowRetry && $task->canRetry(),
        ]);
    }

    /**
     * Get task status
     * Allows checking status of a specific task
     *
     * GET /api/svc/tasks/{id}
     */
    public function getTaskStatus(int $id): JsonResponse
    {
        $task = CliTask::find($id);

        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => 'Task not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'task' => [
                'id' => $task->id,
                'type' => $task->task_type,
                'status' => $task->status,
                'user_id' => $task->user_id,
                'project_id' => $task->project_id,
                'payload' => $task->payload,
                'result' => $task->result,
                'logs' => $task->logs,
                'error_message' => $task->error_message,
                'retry_count' => $task->retry_count,
                'created_at' => $task->created_at->toIso8601String(),
                'started_at' => $task->started_at?->toIso8601String(),
                'completed_at' => $task->completed_at?->toIso8601String(),
                'failed_at' => $task->failed_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get active task for current user
     * Returns the first pending or processing database_import task
     *
     * GET /cli/svc/tasks/active
     */
    public function getActiveTask(Request $request): JsonResponse
    {
        $user = $request->user();

        $task = CliTask::where('user_id', $user->id)
            ->where('task_type', CliTask::TYPE_DATABASE_IMPORT)
            ->whereIn('status', [CliTask::STATUS_PENDING, CliTask::STATUS_PROCESSING])
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$task) {
            return response()->json([
                'success' => true,
                'task' => null,
                'message' => 'No active tasks found',
            ]);
        }

        return response()->json([
            'success' => true,
            'task' => [
                'id' => $task->id,
                'type' => $task->task_type,
                'status' => $task->status,
                'user_id' => $task->user_id,
                'project_id' => $task->project_id,
                'payload' => $task->payload,
                'logs' => $task->logs,
                'error_message' => $task->error_message,
                'created_at' => $task->created_at->toIso8601String(),
                'started_at' => $task->started_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Cancel a task
     * Allows user to cancel a pending or processing task
     *
     * POST /cli/svc/tasks/{id}/cancel
     */
    public function cancelTask(int $id, Request $request): JsonResponse
    {
        $task = CliTask::find($id);

        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => 'Task not found',
            ], 404);
        }

        // Check if user owns this task
        $user = $request->user();
        if ($task->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to cancel this task',
            ], 403);
        }

        // Only allow cancelling pending or processing tasks
        if ($task->status === CliTask::STATUS_COMPLETED) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot cancel a completed task',
            ], 400);
        }

        if ($task->status === CliTask::STATUS_FAILED) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot cancel a failed task',
            ], 400);
        }

        // Delete the task
        $task->delete();

        Log::info('🚫 [SVC] Task cancelled by user', [
            'task_id' => $task->id,
            'type' => $task->task_type,
            'user_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Task cancelled successfully',
        ]);
    }

    /**
     * Create a connection test task
     * Called from GUI when user wants to test database connection and list databases/schemas
     *
     * POST /cli/svc/tasks/connection-test
     */
    public function createConnectionTestTask(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payload.connection_type' => 'required|in:mysql,postgresql,sqlite,mssql',
            'payload.host' => 'required_unless:payload.connection_type,sqlite|string',
            'payload.port' => 'nullable|integer',
            'payload.database' => 'nullable|string',
            'payload.username' => 'required_unless:payload.connection_type,sqlite|string',
            'payload.password' => 'nullable|string',
        ]);

        $user = $request->user();
        $payload = $request->input('payload');

        $task = CliTask::create([
            'task_type' => CliTask::TYPE_CONNECTION_TEST,
            'user_id' => $user->id,
            'project_id' => null,
            'payload' => [
                'connection_type' => $payload['connection_type'],
                'host' => $payload['host'],
                'port' => $payload['port'],
                'database' => $payload['database'] ?? null,
                'username' => $payload['username'],
                'password' => $payload['password'],
            ],
            'priority' => 20, // High priority for quick feedback
            'max_retries' => 0, // No retry for connection tests
        ]);

        Log::info('📝 [SVC] Connection test task created', [
            'task_id' => $task->id,
            'user_id' => $user->id,
            'connection_type' => $payload['connection_type'],
            'host' => $payload['host'],
        ]);

        return response()->json([
            'success' => true,
            'task_id' => $task->id,
            'message' => 'Connection test task created.',
        ], 201);
    }

    /**
     * Create a new database import task
     * Called from GUI when user wants to import local database
     *
     * POST /api/svc/tasks/database-import
     */
    public function createDatabaseImportTask(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payload.connection_type' => 'required|in:mysql,postgresql,sqlite,mssql',
            'payload.host' => 'required_unless:payload.connection_type,sqlite|string',
            'payload.port' => 'nullable|integer',
            'payload.database' => 'required|string',
            'payload.username' => 'required_unless:payload.connection_type,sqlite|string',
            'payload.password' => 'nullable|string',
            'payload.schema_name' => 'nullable|string|max:100',
            'payload.target_schema_id' => 'required|exists:schemas,id',
            'payload.description' => 'nullable|string',
        ]);

        $user = $request->user();
        $payload = $request->input('payload');

        // Use database name as schema name if not provided
        if (empty($payload['schema_name'])) {
            $payload['schema_name'] = $payload['database'];
        }

        // Get the schema to find project_id
        $schema = \App\Models\FloatingSchema::find($payload['target_schema_id']);
        if (!$schema) {
            return response()->json([
                'success' => false,
                'message' => 'Target schema not found',
            ], 404);
        }

        // Get project from schema's first project relationship
        $project = $schema->projects()->first();
        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Schema is not associated with any project',
            ], 400);
        }

        $task = CliTask::create([
            'task_type' => CliTask::TYPE_DATABASE_IMPORT,
            'user_id' => $user->id,
            'project_id' => $project->id,
            'payload' => [
                'connection_type' => $payload['connection_type'],
                'host' => $payload['host'],
                'port' => $payload['port'],
                'database' => $payload['database'],
                'username' => $payload['username'],
                'password' => $payload['password'], // In production: encrypt this!
                'schema_name' => $payload['schema_name'],
                'target_schema_id' => $payload['target_schema_id'],
                'description' => $payload['description'] ?? null,
            ],
            'priority' => 10, // High priority
        ]);

        Log::info('📝 [SVC] Database import task created', [
            'task_id' => $task->id,
            'user_id' => $user->id,
            'project_id' => $task->project_id,
            'connection_type' => $payload['connection_type'],
            'schema_id' => $payload['target_schema_id'],
        ]);

        return response()->json([
            'success' => true,
            'task_id' => $task->id,
            'message' => 'Database import task created. The service will process it shortly.',
        ], 201);
    }

    /**
     * Create a new project download task
     * Called when user generates project and wants to download locally
     *
     * POST /api/svc/tasks/project-download
     */
    public function createProjectDownloadTask(Request $request): JsonResponse
    {
        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'archive_url' => 'required|url',
            'target_path' => 'required|string',
            'install_type' => 'required|in:initial,update',
        ]);

        $user = $request->user();

        $task = CliTask::create([
            'task_type' => CliTask::TYPE_PROJECT_DOWNLOAD,
            'user_id' => $user->id,
            'project_id' => $request->input('project_id'),
            'payload' => [
                'project_id' => $request->input('project_id'),
                'archive_url' => $request->input('archive_url'),
                'target_path' => $request->input('target_path'),
                'install_type' => $request->input('install_type'),
                'preserve_files' => $request->input('preserve_files', ['.env', '.git']),
            ],
            'priority' => 5,
        ]);

        Log::info('📝 [SVC] Project download task created', [
            'task_id' => $task->id,
            'user_id' => $user->id,
            'project_id' => $task->project_id,
            'install_type' => $request->input('install_type'),
        ]);

        return response()->json([
            'success' => true,
            'task_id' => $task->id,
            'message' => 'Project download task created. The service will process it shortly.',
        ], 201);
    }

    /**
     * Receive schema data from scoriet-svc after database import
     * Called by scoriet-svc to send imported database schema
     *
     * POST /api/svc/schema-import
     */
    public function importSchema(Request $request, SchemaStorageService $schemaStorage): JsonResponse
    {
        $request->validate([
            'task_id' => 'required|integer|exists:cli_tasks,id',
            'tables' => 'required|array',
            'tables.*.name' => 'required|string',
            'tables.*.fields' => 'required|array',
            'tables.*.indexes' => 'nullable|array',
            'tables.*.foreign_keys' => 'nullable|array',
        ]);

        $taskId = $request->input('task_id');
        $tables = $request->input('tables');

        // Get task to retrieve target_schema_id and description
        $task = CliTask::find($taskId);
        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => 'Task not found',
            ], 404);
        }

        $targetSchemaId = $task->payload['target_schema_id'] ?? null;
        $schemaName = $task->payload['schema_name'];
        $description = $task->payload['description'] ?? "Imported from local database via scoriet-svc";

        if (!$targetSchemaId) {
            return response()->json([
                'success' => false,
                'message' => 'Target schema ID not found in task payload',
            ], 400);
        }

        Log::info('📥 [SVC] Received schema data', [
            'task_id' => $taskId,
            'target_schema_id' => $targetSchemaId,
            'schema_name' => $schemaName,
            'table_count' => count($tables),
        ]);

        try {
            // Transform data from Rust service format to SchemaStorageService format
            $transformedTables = $this->transformSchemaData($tables);

            // Store schema using SchemaStorageService with target schema ID
            $schemaVersion = $schemaStorage->storeSchemaInExisting(
                $transformedTables,
                $targetSchemaId,
                $description
            );

            Log::info('✅ [SVC] Schema stored successfully', [
                'task_id' => $taskId,
                'schema_version_id' => $schemaVersion->id,
                'schema_id' => $schemaVersion->schema_id,
                'tables_imported' => count($tables),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Schema imported and stored successfully',
                'schema_version_id' => $schemaVersion->id,
                'schema_id' => $schemaVersion->schema_id,
                'tables_imported' => count($tables),
            ]);

        } catch (\Exception $e) {
            Log::error('❌ [SVC] Failed to store schema', [
                'task_id' => $taskId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to store schema: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Transform schema data from Rust service format to SchemaStorageService format
     */
    private function transformSchemaData(array $tables): array
    {
        $transformed = [];

        foreach ($tables as $table) {
            // Transform fields
            $fields = [];
            foreach ($table['fields'] as $field) {
                $fields[] = [
                    'name' => $field['name'],
                    'type' => $field['data_type'],
                    'length' => $field['max_length'] ?? $field['precision'] ?? null,
                    'nullable' => $field['nullable'] ?? true,
                    'default' => $field['default_value'] ?? null,
                    'auto_increment' => $field['auto_increment'] ?? false,
                    'unsigned' => false, // Not provided by Rust service yet
                    'comment' => null, // Not provided by Rust service yet
                ];
            }

            // Transform constraints (indexes + foreign keys)
            $constraints = [];

            // Add indexes as constraints
            foreach ($table['indexes'] ?? [] as $index) {
                $type = 'INDEX';
                if ($index['is_primary']) {
                    $type = 'PRIMARY KEY';
                } elseif ($index['is_unique']) {
                    $type = 'UNIQUE';
                }

                $constraints[] = [
                    'name' => $index['name'],
                    'type' => $type,
                    'columns' => $index['columns'],
                ];
            }

            // Add foreign keys as constraints
            foreach ($table['foreign_keys'] ?? [] as $fk) {
                $constraints[] = [
                    'name' => $fk['name'],
                    'type' => 'FOREIGN KEY',
                    'columns' => [$fk['column']],
                    'references' => [
                        'table' => $fk['referenced_table'],
                        'columns' => [$fk['referenced_column']],
                        'on_delete' => $fk['on_delete'] ?? 'RESTRICT',
                        'on_update' => $fk['on_update'] ?? 'RESTRICT',
                    ],
                ];
            }

            $transformed[] = [
                'table_name' => $table['name'],
                'fields' => $fields,
                'constraints' => $constraints,
            ];
        }

        return $transformed;
    }

    /**
     * Append log entry to task
     * Allows service to send live log updates
     *
     * POST /cli/svc/tasks/{id}/log
     */
    public function appendLog(int $id, Request $request): JsonResponse
    {
        $task = CliTask::find($id);

        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => 'Task not found',
            ], 404);
        }

        $validated = $request->validate([
            'log' => 'required|string',
        ]);

        // Append log line to existing logs
        $existingLogs = $task->logs ?? '';
        $newLog = $validated['log'];

        // Add newline if there are existing logs
        if (!empty($existingLogs)) {
            $task->logs = $existingLogs . "\n" . $newLog;
        } else {
            $task->logs = $newLog;
        }

        $task->save();

        return response()->json([
            'success' => true,
            'message' => 'Log appended successfully',
        ]);
    }

    /**
     * Create a new template upload task
     * Called from GUI when user wants to import from local directory via service
     *
     * POST /api/svc/tasks/template-upload
     */
    public function createTemplateUploadTask(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'directory_path' => 'required|string|min:3',
        ]);

        $user = $request->user();

        // Create a unique session ID for this import
        $sessionId = Str::uuid()->toString();

        // Create temp directory for this session
        $tempDir = storage_path("app/temp/import_{$sessionId}");
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        // Store session data
        $sessionData = [
            'user_id' => $user->id,
            'session_id' => $sessionId,
            'directory_path' => $validated['directory_path'],
            'created_at' => now()->toISOString(),
            'source' => 'service',
        ];
        file_put_contents($tempDir . '/session.json', json_encode($sessionData));

        // Create the task
        $task = CliTask::create([
            'task_type' => CliTask::TYPE_TEMPLATE_UPLOAD,
            'user_id' => $user->id,
            'project_id' => null, // Templates are not project-specific
            'payload' => [
                'directory_path' => $validated['directory_path'],
                'session_id' => $sessionId,
            ],
            'priority' => 10, // High priority
        ]);

        Log::info('📝 [SVC] Template upload task created', [
            'task_id' => $task->id,
            'user_id' => $user->id,
            'directory_path' => $validated['directory_path'],
            'session_id' => $sessionId,
        ]);

        return response()->json([
            'success' => true,
            'task_id' => $task->id,
            'session_id' => $sessionId,
            'message' => 'Template upload task created. The service will process it shortly.',
        ], 201);
    }

    /**
     * Receive template archive upload from scoriet-svc
     * Called by service after scanning and zipping local directory
     *
     * POST /api/svc/template-upload
     */
    public function receiveTemplateUpload(Request $request): JsonResponse
    {
        $request->validate([
            'task_id' => 'required|integer|exists:cli_tasks,id',
            'session_id' => 'required|string|uuid',
            'archive' => 'required|file|mimes:zip',
            'files' => 'required|string', // JSON array of file metadata
        ]);

        $taskId = $request->input('task_id');
        $sessionId = $request->input('session_id');
        $archiveFile = $request->file('archive');
        $filesJson = $request->input('files');

        // Parse files metadata
        $files = json_decode($filesJson, true);
        if (!is_array($files)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid files metadata',
            ], 400);
        }

        // Get task
        $task = CliTask::find($taskId);
        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => 'Task not found',
            ], 404);
        }

        // Verify session
        $tempDir = storage_path("app/temp/import_{$sessionId}");
        if (!is_dir($tempDir)) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found',
            ], 404);
        }

        $sessionData = json_decode(file_get_contents($tempDir . '/session.json'), true);
        if ($sessionData['user_id'] !== $task->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Session user mismatch',
            ], 403);
        }

        Log::info('📥 [SVC] Received template upload from service', [
            'task_id' => $taskId,
            'session_id' => $sessionId,
            'file_count' => count($files),
            'archive_size' => $archiveFile->getSize(),
        ]);

        try {
            // Store the archive
            $archivePath = $tempDir . '/archive.zip';
            $archiveFile->move($tempDir, 'archive.zip');

            // Extract archive
            $extractDir = $tempDir . '/extracted';
            mkdir($extractDir, 0755, true);

            $zip = new ZipArchive();
            if ($zip->open($archivePath) !== true) {
                throw new \Exception('Failed to open ZIP archive');
            }
            $zip->extractTo($extractDir);
            $zip->close();

            // Update session data with file list
            $sessionData['extract_dir'] = $extractDir;
            $sessionData['file_count'] = count($files);
            $sessionData['root_prefix'] = ''; // No prefix for service uploads
            file_put_contents($tempDir . '/session.json', json_encode($sessionData));

            // Format files for frontend (same format as TemplateImportController)
            $allFiles = [];
            foreach ($files as $file) {
                $allFiles[] = [
                    'path' => $file['path'],
                    'name' => $file['name'],
                    'is_dir' => false,
                    'size' => $file['size'],
                    'extension' => $file['extension'] ?? null,
                    'file_type' => $file['file_type'] ?? 'text',
                ];
            }

            return response()->json([
                'success' => true,
                'session_id' => $sessionId,
                'file_count' => count($allFiles),
                'all_files' => $allFiles,
                'message' => 'Template archive received and extracted',
            ]);

        } catch (\Exception $e) {
            Log::error('❌ [SVC] Failed to process template upload', [
                'task_id' => $taskId,
                'session_id' => $sessionId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process upload: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check template upload task status and get file list
     * Called by frontend to poll for service upload completion
     *
     * GET /api/svc/template-upload/{sessionId}/status
     */
    public function getTemplateUploadStatus(string $sessionId, Request $request): JsonResponse
    {
        $user = $request->user();
        $tempDir = storage_path("app/temp/import_{$sessionId}");

        if (!is_dir($tempDir)) {
            return response()->json([
                'success' => false,
                'status' => 'not_found',
                'message' => 'Session not found',
            ], 404);
        }

        $sessionData = json_decode(file_get_contents($tempDir . '/session.json'), true);

        if ($sessionData['user_id'] !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        // Check if extraction is complete
        if (!isset($sessionData['extract_dir']) || !is_dir($sessionData['extract_dir'])) {
            // Check task status
            $task = CliTask::where('user_id', $user->id)
                ->where('task_type', CliTask::TYPE_TEMPLATE_UPLOAD)
                ->where('payload->session_id', $sessionId)
                ->first();

            $taskStatus = $task ? $task->status : 'unknown';
            $taskLogs = $task ? $task->logs : null;
            $taskError = $task ? $task->error_message : null;

            return response()->json([
                'success' => true,
                'status' => 'pending',
                'task_status' => $taskStatus,
                'logs' => $taskLogs,
                'error' => $taskError,
                'message' => 'Waiting for service to upload files',
            ]);
        }

        // Files are ready - scan and return them
        $extractDir = $sessionData['extract_dir'];
        $allFiles = $this->scanUploadedDirectory($extractDir);

        return response()->json([
            'success' => true,
            'status' => 'ready',
            'session_id' => $sessionId,
            'directory_path' => $sessionData['directory_path'],
            'file_count' => count($allFiles),
            'all_files' => $allFiles,
        ]);
    }

    /**
     * Scan uploaded directory for files
     */
    private function scanUploadedDirectory(string $dir): array
    {
        $files = [];

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $file) {
            if ($file->isDir()) {
                continue;
            }

            $relativePath = str_replace($dir . DIRECTORY_SEPARATOR, '', $file->getPathname());
            $relativePath = str_replace('\\', '/', $relativePath);
            $basename = basename($relativePath);
            $extension = strtolower($file->getExtension());

            $files[] = [
                'path' => $relativePath,
                'name' => $basename,
                'is_dir' => false,
                'size' => $file->getSize(),
                'extension' => $extension ?: null,
                'file_type' => $this->detectFileType($basename, $extension),
            ];
        }

        // Sort by path
        usort($files, fn($a, $b) => strcasecmp($a['path'], $b['path']));

        return $files;
    }

    /**
     * Detect file type based on filename and extension
     */
    private function detectFileType(string $filename, ?string $extension): string
    {
        // Check for blade.php
        if (str_ends_with(strtolower($filename), '.blade.php')) {
            return 'blade';
        }

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
            'ico' => 'image',
            'webp' => 'image',
            'svg' => 'svg',
            'zip' => 'archive',
            'tar' => 'archive',
            'gz' => 'archive',
        ];

        return $typeMap[$extension ?? ''] ?? 'text';
    }

    // ========================================
    // File Edit via Service
    // ========================================

    /**
     * Create a file edit task
     * Called from GUI when user wants to edit file via service
     *
     * POST /cli/svc/tasks/file-edit
     */
    public function createFileEditTask(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'template_id' => 'required|integer|exists:templates,id',
            'file_id' => 'required|integer',
            'file_name' => 'required|string',
            'file_content' => 'required|string',
        ]);

        $user = $request->user();
        $sessionId = Str::uuid()->toString();

        // Create temp directory for this session
        $tempDir = storage_path("app/temp/file_edit_{$sessionId}");
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        // Store session data
        $sessionData = [
            'user_id' => $user->id,
            'session_id' => $sessionId,
            'template_id' => $validated['template_id'],
            'file_id' => $validated['file_id'],
            'file_name' => $validated['file_name'],
            'status' => 'pending',
            'should_stop' => false,
            'updated_content' => null,
            'created_at' => now()->toISOString(),
        ];
        file_put_contents($tempDir . '/session.json', json_encode($sessionData));

        // Create the task
        $task = CliTask::create([
            'task_type' => CliTask::TYPE_FILE_EDIT,
            'user_id' => $user->id,
            'project_id' => null,
            'payload' => [
                'template_id' => $validated['template_id'],
                'file_id' => $validated['file_id'],
                'file_name' => $validated['file_name'],
                'file_content' => $validated['file_content'],
                'session_id' => $sessionId,
            ],
            'priority' => 20, // High priority for interactive tasks
        ]);

        Log::info('📝 [SVC] File edit task created', [
            'task_id' => $task->id,
            'user_id' => $user->id,
            'template_id' => $validated['template_id'],
            'file_name' => $validated['file_name'],
            'session_id' => $sessionId,
        ]);

        return response()->json([
            'success' => true,
            'task_id' => $task->id,
            'session_id' => $sessionId,
            'message' => 'File edit task created',
        ], 201);
    }

    /**
     * Update file edit status from service
     *
     * POST /cli/svc/file-edit/{sessionId}/status
     */
    public function updateFileEditStatus(string $sessionId, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,watching,closed',
            'content' => 'nullable|string',
        ]);

        $tempDir = storage_path("app/temp/file_edit_{$sessionId}");
        if (!is_dir($tempDir)) {
            return response()->json(['success' => false, 'message' => 'Session not found'], 404);
        }

        $sessionData = json_decode(file_get_contents($tempDir . '/session.json'), true);
        $sessionData['status'] = $validated['status'];

        if (isset($validated['content'])) {
            $sessionData['updated_content'] = $validated['content'];
        }

        file_put_contents($tempDir . '/session.json', json_encode($sessionData));

        return response()->json(['success' => true]);
    }

    /**
     * Upload new file content from service
     *
     * POST /cli/svc/file-edit/{sessionId}/content
     */
    public function uploadFileContent(string $sessionId, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $tempDir = storage_path("app/temp/file_edit_{$sessionId}");
        if (!is_dir($tempDir)) {
            return response()->json(['success' => false, 'message' => 'Session not found'], 404);
        }

        $sessionData = json_decode(file_get_contents($tempDir . '/session.json'), true);
        $sessionData['updated_content'] = $validated['content'];
        $sessionData['last_update'] = now()->toISOString();
        file_put_contents($tempDir . '/session.json', json_encode($sessionData));

        // Save content directly to database
        $templateFile = TemplateFile::where('id', $sessionData['file_id'])
            ->where('template_id', $sessionData['template_id'])
            ->first();

        if ($templateFile) {
            $templateFile->file_content = $validated['content'];
            $templateFile->save();

            Log::info('📤 [SVC] File content saved to database', [
                'session_id' => $sessionId,
                'template_id' => $sessionData['template_id'],
                'file_id' => $sessionData['file_id'],
                'content_length' => strlen($validated['content']),
            ]);
        } else {
            Log::warning('📤 [SVC] TemplateFile not found for database save', [
                'session_id' => $sessionId,
                'template_id' => $sessionData['template_id'],
                'file_id' => $sessionData['file_id'],
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Content updated']);
    }

    /**
     * Check if service should stop editing
     *
     * GET /cli/svc/file-edit/{sessionId}/should-stop
     */
    public function checkFileEditShouldStop(string $sessionId): JsonResponse
    {
        $tempDir = storage_path("app/temp/file_edit_{$sessionId}");
        if (!is_dir($tempDir)) {
            return response()->json(['should_stop' => true]);
        }

        $sessionData = json_decode(file_get_contents($tempDir . '/session.json'), true);

        return response()->json([
            'should_stop' => $sessionData['should_stop'] ?? false,
        ]);
    }

    /**
     * Get file edit status (called from frontend)
     *
     * GET /cli/svc/file-edit/{sessionId}/status
     */
    public function getFileEditStatus(string $sessionId, Request $request): JsonResponse
    {
        $user = $request->user();
        $tempDir = storage_path("app/temp/file_edit_{$sessionId}");

        if (!is_dir($tempDir)) {
            return response()->json([
                'success' => false,
                'status' => 'not_found',
            ], 404);
        }

        $sessionData = json_decode(file_get_contents($tempDir . '/session.json'), true);

        if ($sessionData['user_id'] !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        // Check for task logs
        $task = CliTask::where('user_id', $user->id)
            ->where('task_type', CliTask::TYPE_FILE_EDIT)
            ->where('payload->session_id', $sessionId)
            ->first();

        $response = [
            'success' => true,
            'status' => $sessionData['status'] ?? 'pending',
            'logs' => $task?->logs,
        ];

        // If there's updated content, include it and clear it
        if (!empty($sessionData['updated_content'])) {
            $response['updated_content'] = $sessionData['updated_content'];

            // Clear the updated content so we don't send it again
            $sessionData['updated_content'] = null;
            file_put_contents($tempDir . '/session.json', json_encode($sessionData));
        }

        return response()->json($response);
    }

    /**
     * Stop file edit session
     *
     * POST /cli/svc/file-edit/{sessionId}/stop
     */
    public function stopFileEdit(string $sessionId, Request $request): JsonResponse
    {
        $user = $request->user();
        $tempDir = storage_path("app/temp/file_edit_{$sessionId}");

        if (!is_dir($tempDir)) {
            return response()->json(['success' => true, 'message' => 'Session not found']);
        }

        $sessionData = json_decode(file_get_contents($tempDir . '/session.json'), true);

        if ($sessionData['user_id'] !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        // Signal service to stop
        $sessionData['should_stop'] = true;
        file_put_contents($tempDir . '/session.json', json_encode($sessionData));

        Log::info('🛑 [SVC] File edit stop requested', [
            'session_id' => $sessionId,
            'user_id' => $user->id,
        ]);

        return response()->json(['success' => true, 'message' => 'Stop signal sent']);
    }
}
