<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\FtpSshUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class FtpSshUploadController extends Controller
{
    private FtpSshUploadService $uploadService;

    public function __construct(FtpSshUploadService $uploadService)
    {
        $this->uploadService = $uploadService;
    }

    /**
     * Check if user has access to the project
     */
    private function userCanAccessProject(Project $project, $user): bool
    {
        if (!$user) {
            return false;
        }

        // Check if user is owner
        if ((int) $project->owner_id === (int) $user->id) {
            return true;
        }

        // Check if user is a direct member
        if ($project->members()->where('user_id', $user->id)->exists()) {
            return true;
        }

        // Check if user is a team member of a project team
        $teamMember = $project->teams()
            ->whereHas('members', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->where(function ($q) {
                $q->whereDoesntHave('subscription')
                  ->orWhereHas('subscription', function ($sq) {
                      $sq->where('is_soft_locked', false);
                  });
            })
            ->exists();

        return $teamMember;
    }

    /**
     * Get FTP/SSH settings for a project
     */
    public function getSettings(Project $project): JsonResponse
    {
        $user = Auth::user();

        if (!$this->userCanAccessProject($project, $user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'deployment_type' => $project->deployment_type,
                'ftp_host' => $project->ftp_host,
                'ftp_port' => $project->ftp_port ?? ($project->deployment_type === 'sftp' ? 22 : 21),
                'ftp_username' => $project->ftp_username,
                'ftp_password' => $project->ftp_password ? '********' : null, // Mask password
                'ftp_directory' => $project->ftp_directory,
                'ftp_passive' => $project->ftp_passive ?? true,
                'ftp_ssl' => $project->ftp_ssl ?? false,
                'has_credentials' => $project->hasFtpDeployment(),
            ],
        ]);
    }

    /**
     * Update FTP/SSH settings for a project
     */
    public function updateSettings(Request $request, Project $project): JsonResponse
    {
        $user = Auth::user();

        if (!$this->userCanAccessProject($project, $user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'deployment_type' => 'nullable|string|in:ftp,sftp',
            'ftp_host' => 'nullable|string|max:255',
            'ftp_port' => 'nullable|integer|min:1|max:65535',
            'ftp_username' => 'nullable|string|max:255',
            'ftp_password' => 'nullable|string|max:500',
            'ftp_directory' => 'nullable|string|max:500',
            'ftp_passive' => 'nullable|boolean',
            'ftp_ssl' => 'nullable|boolean',
        ]);

        // If password is masked placeholder, don't update it
        if (isset($validated['ftp_password']) && $validated['ftp_password'] === '********') {
            unset($validated['ftp_password']);
        }

        // Set default port based on type if not provided
        if (!isset($validated['ftp_port']) || empty($validated['ftp_port'])) {
            $validated['ftp_port'] = ($validated['deployment_type'] ?? 'ftp') === 'sftp' ? 22 : 21;
        }

        $project->update($validated);

        Log::info("FTP/SSH settings updated for project {$project->id}", [
            'user_id' => $user->id,
            'deployment_type' => $validated['deployment_type'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'FTP/SSH-Einstellungen gespeichert',
        ]);
    }

    /**
     * Test FTP/SSH connection
     */
    public function testConnection(Request $request, Project $project): JsonResponse
    {
        $user = Auth::user();

        if (!$this->userCanAccessProject($project, $user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Allow testing with provided credentials (not yet saved)
        $testCredentials = $request->only([
            'deployment_type', 'ftp_host', 'ftp_port', 'ftp_username',
            'ftp_password', 'ftp_directory', 'ftp_passive', 'ftp_ssl'
        ]);

        // If testing with form data, create a temporary project object
        if (!empty($testCredentials['ftp_host'])) {
            $tempProject = new Project();
            $tempProject->deployment_type = $testCredentials['deployment_type'] ?? 'ftp';
            $tempProject->ftp_host = $testCredentials['ftp_host'];
            $tempProject->ftp_port = $testCredentials['ftp_port'] ?? ($tempProject->deployment_type === 'sftp' ? 22 : 21);
            $tempProject->ftp_username = $testCredentials['ftp_username'];
            // For password, use the provided one if not masked, otherwise use saved one
            if (isset($testCredentials['ftp_password']) && $testCredentials['ftp_password'] !== '********') {
                $tempProject->ftp_password = $testCredentials['ftp_password'];
            } else {
                $tempProject->ftp_password = $project->ftp_password;
            }
            $tempProject->ftp_directory = $testCredentials['ftp_directory'] ?? '/';
            $tempProject->ftp_passive = $testCredentials['ftp_passive'] ?? true;
            $tempProject->ftp_ssl = $testCredentials['ftp_ssl'] ?? false;

            $result = $this->uploadService->testConnection($tempProject);
        } else {
            // Test with saved credentials
            if (!$project->hasFtpDeployment()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Keine FTP/SSH-Verbindungsdaten konfiguriert',
                ]);
            }

            $result = $this->uploadService->testConnection($project);
        }

        return response()->json($result);
    }

    /**
     * Upload generated ZIP via FTP/SSH
     */
    public function upload(Request $request, Project $project): JsonResponse
    {
        $user = Auth::user();

        if (!$this->userCanAccessProject($project, $user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!$project->hasFtpDeployment()) {
            return response()->json([
                'success' => false,
                'message' => 'Keine FTP/SSH-Verbindungsdaten konfiguriert. Bitte konfigurieren Sie diese in den Projekt-Einstellungen.',
            ], 400);
        }

        $validated = $request->validate([
            'filename' => 'required|string',
        ]);

        // Find the ZIP file in storage
        $zipPath = storage_path('app/generated-projects/' . $validated['filename']);

        if (!file_exists($zipPath)) {
            return response()->json([
                'success' => false,
                'message' => 'ZIP-Datei nicht gefunden: ' . $validated['filename'],
            ], 404);
        }

        Log::info("Starting FTP/SSH upload for project {$project->id}", [
            'user_id' => $user->id,
            'filename' => $validated['filename'],
            'deployment_type' => $project->deployment_type,
        ]);

        $result = $this->uploadService->uploadZip($project, $zipPath);

        if ($result['success']) {
            Log::info("FTP/SSH upload completed for project {$project->id}", [
                'files_uploaded' => $result['files_uploaded'] ?? 0,
            ]);
        } else {
            Log::error("FTP/SSH upload failed for project {$project->id}", [
                'error' => $result['message'] ?? 'Unknown error',
            ]);
        }

        return response()->json($result);
    }

    /**
     * Remove FTP/SSH settings from a project
     */
    public function removeSettings(Project $project): JsonResponse
    {
        $user = Auth::user();

        if (!$this->userCanAccessProject($project, $user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $project->update([
            'deployment_type' => null,
            'ftp_host' => null,
            'ftp_port' => null,
            'ftp_username' => null,
            'ftp_password' => null,
            'ftp_directory' => null,
            'ftp_passive' => true,
            'ftp_ssl' => false,
        ]);

        Log::info("FTP/SSH settings removed for project {$project->id}", [
            'user_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'FTP/SSH-Einstellungen entfernt',
        ]);
    }
}
