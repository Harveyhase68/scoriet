<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CliDevice;
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
     * Resolve target_device_id from request.
     * If a device_id is provided, verify it belongs to the user and is active.
     * Returns the device_id string or null (for untargeted/any-device tasks).
     */
    private function resolveTargetDevice(Request $request): ?string
    {
        $deviceId = $request->input('target_device_id');
        if (!$deviceId) return null;

        // Verify device belongs to user and is active
        $device = CliDevice::where('device_id', $deviceId)
            ->where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();

        return $device ? $deviceId : null;
    }

    /**
     * Get next pending task from queue
     * Called by scoriet-svc to poll for work
     *
     * GET /api/svc/queue
     */
    public function getQueue(Request $request): JsonResponse
    {
        $user = $request->user();
        $deviceId = $request->header('X-Device-Id');

        // Heartbeat: update device last_seen_at if device_id provided. We
        // additionally require the device to belong to this user, otherwise
        // a stolen/leaked device_id from another user could be used to
        // mark someone else's device as alive.
        if ($deviceId) {
            CliDevice::where('device_id', $deviceId)
                ->where('user_id', $user->id)
                ->update(['last_seen_at' => now()]);
        }

        // CRITICAL: Only return tasks that belong to the polling user. Without
        // this filter, every service ever logged in would see and pick up
        // every other user's untargeted tasks, mark them as processing, and
        // then fail them on the access check at the actual handler endpoint.
        // That is both a data leak (task payload is visible) AND a denial of
        // service vector (one malicious user can fail every other user's
        // queued work).
        $query = CliTask::where('status', CliTask::STATUS_PENDING)
            ->where('user_id', $user->id);

        // Stale-task filter: do not serve tasks that have been waiting in the
        // queue longer than their per-type pickup TTL. A task that has sat
        // here past its TTL means the service was offline when the user
        // queued it; the user has either given up or already retried, and
        // re-running it now (potentially much later) would surprise them.
        // The scheduled cleanup job (bootstrap/app.php) marks these as
        // failed; this filter is the immediate guard so the next poll never
        // hands one out, even between cleanup runs.
        $query->where(function ($q) {
            foreach (CliTask::PICKUP_TIMEOUT_MINUTES as $type => $minutes) {
                $q->orWhere(function ($inner) use ($type, $minutes) {
                    $inner->where('task_type', $type)
                          ->where('created_at', '>=', now()->subMinutes($minutes));
                });
            }
            // Fall-through for any task_type not in the map - use default TTL
            $knownTypes = array_keys(CliTask::PICKUP_TIMEOUT_MINUTES);
            $q->orWhere(function ($inner) use ($knownTypes) {
                $inner->whereNotIn('task_type', $knownTypes)
                      ->where('created_at', '>=', now()->subMinutes(CliTask::PICKUP_TIMEOUT_DEFAULT_MINUTES));
            });
        });

        if ($deviceId) {
            $query->where(function ($q) use ($deviceId) {
                $q->whereNull('target_device_id')
                  ->orWhere('target_device_id', $deviceId);
            });
        } else {
            // No device_id: only pick up untargeted tasks (backwards compatible)
            $query->whereNull('target_device_id');
        }

        $task = $query->orderBy('priority', 'desc')
            ->orderBy('created_at', 'asc')
            ->first();

        if (!$task) {
            return response()->json([
                'success' => true,
                'task' => null,
                'message' => __('svccontrollerphp36'),
            ]);
        }

        // Mark task as processing
        $task->markAsProcessing();

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
                'message' => __('svccontrollerphp70'),
            ], 404);
        }

        // A user must only be able to complete their own tasks. Without this
        // check any authenticated service could mark every other user's task
        // as completed and silently swallow their work.
        if ($task->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        $result = $request->input('result', []);
        $task->markAsCompleted($result);

        return response()->json([
            'success' => true,
            'message' => __('svccontrollerphp79'),
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
                'message' => __('svccontrollerphp96'),
            ], 404);
        }

        // Only the task owner may report it as failed. Without this check a
        // foreign service could mark another user's running task as failed
        // (and trigger the auto-retry path), repeatedly sabotaging it.
        if ($task->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        $errorMessage = $request->input('error_message', __('svccontrollerphp100'));
        $allowRetry = $request->input('allow_retry', true); // Default: allow retry

        $task->markAsFailed($errorMessage);

        Log::warning(__('svccontrollerphp105'), [
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
        }

        return response()->json([
            'success' => true,
            'message' => __('svccontrollerphp121'),
            'can_retry' => $allowRetry && $task->canRetry(),
        ]);
    }

    /**
     * Get task status
     * Allows checking status of a specific task
     *
     * GET /api/svc/tasks/{id}
     */
    public function getTaskStatus(int $id, Request $request): JsonResponse
    {
        $task = CliTask::find($id);

        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => __('svccontrollerphp139'),
            ], 404);
        }

        // Task payload can contain database credentials, generated code paths,
        // and other sensitive material. Only the owning user may read it.
        if ($task->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
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
                'message' => __('svccontrollerphp184'),
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
                'message' => __('svccontrollerphp218'),
            ], 404);
        }

        // Check if user owns this task
        $user = $request->user();
        if ($task->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => __('svccontrollerphp227'),
            ], 403);
        }

        // Only allow cancelling pending or processing tasks
        if ($task->status === CliTask::STATUS_COMPLETED) {
            return response()->json([
                'success' => false,
                'message' => __('svccontrollerphp235'),
            ], 400);
        }

        if ($task->status === CliTask::STATUS_FAILED) {
            return response()->json([
                'success' => false,
                'message' => __('svccontrollerphp242'),
            ], 400);
        }

        // Delete the task
        $task->delete();

        return response()->json([
            'success' => true,
            'message' => __('svccontrollerphp251'),
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
            'target_device_id' => $this->resolveTargetDevice($request),
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

        return response()->json([
            'success' => true,
            'task_id' => $task->id,
            'message' => __('svccontrollerphp294'),
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
                'message' => __('svccontrollerphp331'),
            ], 404);
        }

        // Get project from schema's first project relationship
        $project = $schema->projects()->first();
        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => __('svccontrollerphp340'),
            ], 400);
        }

        $task = CliTask::create([
            'task_type' => CliTask::TYPE_DATABASE_IMPORT,
            'user_id' => $user->id,
            'target_device_id' => $this->resolveTargetDevice($request),
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

        return response()->json([
            'success' => true,
            'task_id' => $task->id,
            'message' => __('svccontrollerphp365'),
        ], 201);
    }

    /**
     * Create a new database export task
     * Called from GUI when user wants to export schema to local database
     *
     * POST /cli/svc/tasks/database-export
     */
    public function createDatabaseExportTask(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payload.connection_type' => 'required|in:mysql,postgresql,mssql',
            'payload.host' => 'required|string',
            'payload.port' => 'nullable|integer',
            'payload.database' => 'required|string',
            'payload.username' => 'required|string',
            'payload.password' => 'nullable|string',
            'payload.schema_name' => 'nullable|string|max:100',
            'payload.sql_script' => 'required|string',
            'payload.drop_tables_first' => 'nullable|boolean',
        ]);

        $user = $request->user();
        $payload = $request->input('payload');

        $task = CliTask::create([
            'task_type' => CliTask::TYPE_DATABASE_EXPORT,
            'user_id' => $user->id,
            'target_device_id' => $this->resolveTargetDevice($request),
            'project_id' => null,
            'payload' => [
                'connection_type' => $payload['connection_type'],
                'host' => $payload['host'],
                'port' => $payload['port'] ?? ($payload['connection_type'] === 'postgresql' ? 5432 : ($payload['connection_type'] === 'mssql' ? 1433 : 3306)),
                'database' => $payload['database'],
                'username' => $payload['username'],
                'password' => $payload['password'] ?? '',
                'schema_name' => $payload['schema_name'] ?? null,
                'sql_script' => $payload['sql_script'],
                'drop_tables_first' => $payload['drop_tables_first'] ?? true,
            ],
            'priority' => 15, // High priority
            'max_retries' => 0, // No auto-retry for export
        ]);

        return response()->json([
            'success' => true,
            'task_id' => $task->id,
            'message' => __('svccontrollerphp414'),
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
            'target_device_id' => $this->resolveTargetDevice($request),
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

        return response()->json([
            'success' => true,
            'task_id' => $task->id,
            'message' => __('svccontrollerphp452'),
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

        // Schema imports write into the user's own schema_versions table — a
        // foreign service must never be able to inject tables/columns into
        // another user's schema.
        if ($task->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        $targetSchemaId = $task->payload['target_schema_id'] ?? null;
        $schemaName = $task->payload['schema_name'];
        $description = $task->payload['description'] ?? __('svccontrollerphp487');

        if (!$targetSchemaId) {
            return response()->json([
                'success' => false,
                'message' => __('svccontrollerphp492'),
            ], 400);
        }

        try {
            // Transform data from Rust service format to SchemaStorageService format
            $transformedTables = $this->transformSchemaData($tables);

            // Store schema using SchemaStorageService with target schema ID
            $schemaVersion = $schemaStorage->storeSchemaInExisting(
                $transformedTables,
                $targetSchemaId,
                $description
            );

            return response()->json([
                'success' => true,
                'message' => __('svccontrollerphp509'),
                'schema_version_id' => $schemaVersion->id,
                'schema_id' => $schemaVersion->schema_id,
                'tables_imported' => count($tables),
            ]);

        } catch (\Exception $e) {
            Log::error(__('svccontrollerphp516'), [
                'task_id' => $taskId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('svccontrollerphp524') . $e->getMessage(),
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
            // Note: Use 'KEY' instead of 'INDEX' for consistency with PHP SQLParser
            foreach ($table['indexes'] ?? [] as $index) {
                $type = 'KEY';
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
                'message' => __('svccontrollerphp610'),
            ], 404);
        }

        // Logs can leak details of generated code, file paths, error traces.
        // Only the task owner may write to (and therefore by extension read,
        // since cancelTask reuses the same row) the task log stream.
        if ($task->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
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

        // Mirror each log line into the deployment_logs table so the dedicated
        // Deployment Log panel sees the full service output. We split on \n
        // because a single appendLog call may legitimately deliver multiple
        // lines (e.g. multi-line install_script output captured at once).
        // type is derived from leading emoji to keep the existing color coding.
        if ($task->project_id) {
            $lines = explode("\n", str_replace("\r\n", "\n", $newLog));
            foreach ($lines as $line) {
                $trimmed = trim($line);
                if ($trimmed === '') {
                    continue;
                }
                \App\Models\DeploymentLog::log(
                    $task->project_id,
                    $task->user_id,
                    $this->classifyLogLine($trimmed),
                    $trimmed,
                    $task->id,
                    ['source' => 'scoriet_svc']
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => __('svccontrollerphp633'),
        ]);
    }

    /**
     * Map a raw service log line to a deployment log type by inspecting its
     * leading marker. Keeps the categorization identical to what the frontend
     * already infers from the same emoji vocabulary, so the panel's color
     * coding stays consistent between live (CLI) and persisted (DB) views.
     */
    private function classifyLogLine(string $line): string
    {
        $head = ltrim($line);
        $successMarkers = ['✅', '🎉', '🟢'];
        $errorMarkers = ['❌', '🛑', '🔥', '💥'];
        $warningMarkers = ['⚠️', '⏰', '🟡'];

        foreach ($successMarkers as $m) {
            if (str_starts_with($head, $m)) return 'success';
        }
        foreach ($errorMarkers as $m) {
            if (str_starts_with($head, $m)) return 'error';
        }
        foreach ($warningMarkers as $m) {
            if (str_starts_with($head, $m)) return 'warning';
        }
        return 'info';
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
            'target_device_id' => $this->resolveTargetDevice($request),
            'project_id' => null, // Templates are not project-specific
            'payload' => [
                'directory_path' => $validated['directory_path'],
                'session_id' => $sessionId,
            ],
            'priority' => 10, // High priority
        ]);

        return response()->json([
            'success' => true,
            'task_id' => $task->id,
            'session_id' => $sessionId,
            'message' => __('svccontrollerphp686'),
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
                'message' => __('svccontrollerphp715'),
            ], 400);
        }

        // Get task
        $task = CliTask::find($taskId);
        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => __('svccontrollerphp724'),
            ], 404);
        }

        // Template archives end up in the user's own template library —
        // a foreign service must never inject templates into another user's
        // account.
        if ($task->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        // Verify session
        $tempDir = storage_path("app/temp/import_{$sessionId}");
        if (!is_dir($tempDir)) {
            return response()->json([
                'success' => false,
                'message' => __('svccontrollerphp733'),
            ], 404);
        }

        $sessionData = json_decode(file_get_contents($tempDir . '/session.json'), true);
        if ($sessionData['user_id'] !== $task->user_id) {
            return response()->json([
                'success' => false,
                'message' => __('svccontrollerphp741'),
            ], 403);
        }

        try {
            // Store the archive
            $archivePath = $tempDir . '/archive.zip';
            $archiveFile->move($tempDir, 'archive.zip');

            // Extract archive
            $extractDir = $tempDir . '/extracted';
            mkdir($extractDir, 0755, true);

            $zip = new ZipArchive();
            if ($zip->open($archivePath) !== true) {
                throw new \Exception(__('svccontrollerphp756'));
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
                'message' => __('svccontrollerphp785'),
            ]);

        } catch (\Exception $e) {
            Log::error(__('svccontrollerphp789'), [
                'task_id' => $taskId,
                'session_id' => $sessionId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('svccontrollerphp797') . $e->getMessage(),
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
                'message' => __('svccontrollerphp848'),
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
            'target_device_id' => $this->resolveTargetDevice($request),
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

        return response()->json([
            'success' => true,
            'task_id' => $task->id,
            'session_id' => $sessionId,
            'message' => __('svccontrollerphp1018'),
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
            return response()->json(['success' => false, 'message' => __('svccontrollerphp1036')], 404);
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
            return response()->json(['success' => false, 'message' => __('svccontrollerphp1064')], 404);
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

        } else {
            Log::warning(__('svccontrollerphp1082'), [
                'session_id' => $sessionId,
                'template_id' => $sessionData['template_id'],
                'file_id' => $sessionData['file_id'],
            ]);
        }

        return response()->json(['success' => true, 'message' => __('svccontrollerphp1089')]);
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
            return response()->json(['success' => false, 'message' => __('svccontrollerphp1131')], 403);
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
            return response()->json(['success' => true, 'message' => __('svccontrollerphp1169')]);
        }

        $sessionData = json_decode(file_get_contents($tempDir . '/session.json'), true);

        if ($sessionData['user_id'] !== $user->id) {
            return response()->json(['success' => false, 'message' => __('svccontrollerphp1175')], 403);
        }

        // Signal service to stop
        $sessionData['should_stop'] = true;
        file_put_contents($tempDir . '/session.json', json_encode($sessionData));

        return response()->json(['success' => true, 'message' => __('svccontrollerphp1182')]);
    }

    /**
     * Create a data query task
     * Called from GUI when the live preview needs real data from the user's local database
     *
     * POST /cli/svc/tasks/data-query
     */
    public function createDataQueryTask(Request $request): JsonResponse
    {
        // Two accepted payload shapes:
        //   1. Legacy single-query — top-level table_name / columns / query_type
        //   2. Batch — `queries` array (one entry per sub-query, same fields).
        // The frontend live-preview modals now always send the batch shape so
        // they can bundle main data + lookup tables into one task; older
        // callers that still send the legacy shape keep working. The Rust
        // service handles both formats too.
        $request->validate([
            'payload.connection_type' => 'required|in:mysql,postgresql,sqlite,mssql',
            'payload.host' => 'required_unless:payload.connection_type,sqlite|string',
            'payload.port' => 'nullable|integer',
            'payload.database' => 'required|string',
            'payload.username' => 'required_unless:payload.connection_type,sqlite|string',
            'payload.password' => 'nullable|string',

            // Legacy single-query fields — required only when `queries` is absent.
            // limit max:1_000_001 lets the "−1 = no limit" sentinel from the
            // frontend through (it normalises to 1_000_000 client-side); the
            // old cap of 500 was rejecting any Live Preview that asked for
            // more than 500 rows in one shot.
            'payload.table_name' => 'required_without:payload.queries|string|max:255',
            'payload.columns' => 'required_without:payload.queries|array|min:1',
            'payload.columns.*' => 'nullable|string|max:255',
            'payload.query_type' => 'required_without:payload.queries|in:single_record,list',
            'payload.where_clause' => 'nullable|string|max:1000',
            'payload.order_by' => 'nullable|string|max:500',
            'payload.limit' => 'nullable|integer|min:1|max:1000001',
            'payload.offset' => 'nullable|integer|min:0',

            // Batch fields — required only when `queries` IS present. Each
            // sub-query mirrors the legacy single-query field set.
            'payload.queries' => 'required_without:payload.table_name|array|min:1',
            'payload.queries.*.table_name' => 'required|string|max:255',
            'payload.queries.*.columns' => 'required|array|min:1',
            'payload.queries.*.columns.*' => 'required|string|max:255',
            'payload.queries.*.query_type' => 'required|in:single_record,list',
            'payload.queries.*.where_clause' => 'nullable|string|max:1000',
            'payload.queries.*.order_by' => 'nullable|string|max:500',
            'payload.queries.*.limit' => 'nullable|integer|min:1|max:1000001',
            'payload.queries.*.offset' => 'nullable|integer|min:0',
        ]);

        $user = $request->user();
        $payload = $request->input('payload');
        $isBatch = isset($payload['queries']);

        $port = $payload['port'] ?? ($payload['connection_type'] === 'postgresql'
            ? 5432
            : ($payload['connection_type'] === 'mssql' ? 1433 : 3306));

        // Connection params are shared across the whole task in either shape.
        $taskPayload = [
            'connection_type' => $payload['connection_type'],
            'host' => $payload['host'] ?? 'localhost',
            'port' => $port,
            'database' => $payload['database'],
            'username' => $payload['username'] ?? '',
            'password' => $payload['password'] ?? '',
        ];

        if ($isBatch) {
            // Pass the queries array straight through to the service. Each
            // entry already validated as a complete sub-query above; we just
            // normalise the optional fields to their server-side defaults so
            // the Rust handler sees consistent input shapes.
            $taskPayload['queries'] = array_map(static function (array $q): array {
                $defaultLimit = ($q['query_type'] ?? 'list') === 'single_record' ? 1 : 50;
                return [
                    'table_name' => $q['table_name'],
                    'columns' => $q['columns'],
                    'query_type' => $q['query_type'],
                    'where_clause' => $q['where_clause'] ?? null,
                    'order_by' => $q['order_by'] ?? null,
                    'limit' => $q['limit'] ?? $defaultLimit,
                    'offset' => $q['offset'] ?? 0,
                ];
            }, $payload['queries']);
        } else {
            $defaultLimit = $payload['query_type'] === 'single_record' ? 1 : 50;
            $taskPayload['table_name'] = $payload['table_name'];
            $taskPayload['columns'] = $payload['columns'];
            $taskPayload['query_type'] = $payload['query_type'];
            $taskPayload['where_clause'] = $payload['where_clause'] ?? null;
            $taskPayload['order_by'] = $payload['order_by'] ?? null;
            $taskPayload['limit'] = $payload['limit'] ?? $defaultLimit;
            $taskPayload['offset'] = $payload['offset'] ?? 0;
        }

        $task = CliTask::create([
            'task_type' => CliTask::TYPE_DATA_QUERY,
            'user_id' => $user->id,
            'target_device_id' => $this->resolveTargetDevice($request),
            'project_id' => $request->input('project_id'),
            'payload' => $taskPayload,
            'priority' => 25, // Highest priority - interactive live preview
            'max_retries' => 0, // No retry for data queries
        ]);

        return response()->json([
            'success' => true,
            'task_id' => $task->id,
            'message' => 'Data query task created',
        ], 201);
    }

    /**
     * Receive data query results from scoriet-svc
     * Called by the Rust service after executing the query on the user's local database
     *
     * POST /cli/svc/data-query-result
     */
    public function submitDataQueryResult(Request $request): JsonResponse
    {
        $request->validate([
            'task_id' => 'required|integer|exists:cli_tasks,id',
            'columns' => 'required|array',
            'columns.*' => 'required|string',
            'rows' => 'required|array',
            'total_count' => 'required|integer|min:0',
            'column_types' => 'nullable|array',
        ]);

        $task = CliTask::find($request->input('task_id'));

        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => 'Task not found',
            ], 404);
        }

        // Data query results contain rows from the user's database (potentially
        // PII / business data). Only the task owner may submit them.
        if ($task->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        if ($task->task_type !== CliTask::TYPE_DATA_QUERY) {
            return response()->json([
                'success' => false,
                'message' => 'Task is not a data query task',
            ], 400);
        }

        $task->markAsCompleted([
            'columns' => $request->input('columns'),
            'rows' => $request->input('rows'),
            'total_count' => $request->input('total_count'),
            'column_types' => $request->input('column_types', []),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Data query results received',
        ]);
    }

    /**
     * Register or update a CLI device
     * Called by scoriet-svc on startup or by CLI on login
     *
     * POST /cli/svc/devices/register
     */
    public function registerDevice(Request $request): JsonResponse
    {
        $request->validate([
            'device_id' => 'required|uuid',
            'device_name' => 'required|string|max:100',
            'platform' => 'required|string|max:20',
            'hostname' => 'nullable|string|max:255',
        ]);

        $user = $request->user();

        $device = CliDevice::updateOrCreate(
            ['device_id' => $request->input('device_id')],
            [
                'user_id' => $user->id,
                'device_name' => $request->input('device_name'),
                'platform' => $request->input('platform'),
                'hostname' => $request->input('hostname'),
                'last_seen_at' => now(),
                'is_active' => true,
            ]
        );

        return response()->json([
            'success' => true,
            'device' => [
                'id' => $device->id,
                'device_id' => $device->device_id,
                'device_name' => $device->device_name,
                'platform' => $device->platform,
            ],
        ]);
    }

    /**
     * List all devices for the current user
     * Called by GUI to show device selector when creating tasks
     *
     * GET /cli/svc/devices
     */
    public function listDevices(Request $request): JsonResponse
    {
        $user = $request->user();

        $devices = CliDevice::where('user_id', $user->id)
            ->where('is_active', true)
            ->orderBy('last_seen_at', 'desc')
            ->get()
            ->map(function ($device) {
                return [
                    'id' => $device->id,
                    'device_id' => $device->device_id,
                    'device_name' => $device->device_name,
                    'platform' => $device->platform,
                    'hostname' => $device->hostname,
                    'is_online' => $device->isOnline(),
                    'last_seen_at' => $device->last_seen_at?->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'devices' => $devices,
        ]);
    }

    /**
     * Deactivate a device
     *
     * DELETE /cli/svc/devices/{deviceId}
     */
    public function removeDevice(string $deviceId, Request $request): JsonResponse
    {
        $user = $request->user();

        $device = CliDevice::where('device_id', $deviceId)
            ->where('user_id', $user->id)
            ->first();

        if (!$device) {
            return response()->json(['success' => false, 'message' => 'Device not found'], 404);
        }

        $device->is_active = false;
        $device->save();

        return response()->json(['success' => true, 'message' => 'Device removed']);
    }
}
