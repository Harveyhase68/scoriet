<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GitProviderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GitProviderController extends Controller
{
    public function __construct(
        private GitProviderService $gitProviderService
    ) {}

    /**
     * Get all connected Git providers for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $providers = $user->gitProviders()->get();

        return response()->json([
            'providers' => $providers->map(fn($p) => [
                'id' => $p->id,
                'provider' => $p->provider,
                'provider_name' => $p->getProviderDisplayName(),
                'username' => $p->username,
                'email' => $p->email,
                'avatar_url' => $p->avatar_url,
                'connected_at' => $p->connected_at?->toIso8601String(),
                'is_expired' => $p->isTokenExpired(),
            ]),
        ]);
    }

    /**
     * Get OAuth authorization URL for a provider.
     */
    public function authorize(Request $request, string $provider): JsonResponse
    {
        $validProviders = ['github', 'gitlab', 'bitbucket'];

        if (!in_array($provider, $validProviders)) {
            return response()->json(['error' => 'Invalid provider'], 400);
        }

        // Generate state and store in cache (since API routes don't use sessions)
        $state = Str::random(40);
        $cacheKey = "git_oauth_state_{$state}";

        // Store user ID with state for 10 minutes
        cache()->put($cacheKey, [
            'user_id' => $request->user()->id,
            'provider' => $provider,
        ], now()->addMinutes(10));

        try {
            $url = $this->gitProviderService->getAuthorizationUrl($provider, $state);
            return response()->json(['url' => $url, 'state' => $state]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Handle OAuth callback from provider (called from frontend after popup).
     */
    public function callback(Request $request, string $provider): JsonResponse
    {
        $validProviders = ['github', 'gitlab', 'bitbucket'];

        if (!in_array($provider, $validProviders)) {
            return response()->json(['error' => 'Invalid provider'], 400);
        }

        $state = $request->input('state');
        $code = $request->input('code');

        if (!$state || !$code) {
            return response()->json(['error' => 'Missing state or code parameter'], 400);
        }

        // Verify state from cache
        $cacheKey = "git_oauth_state_{$state}";
        $storedData = cache()->get($cacheKey);

        if (!$storedData) {
            return response()->json(['error' => 'Invalid or expired state parameter'], 400);
        }

        if ($storedData['provider'] !== $provider) {
            return response()->json(['error' => 'Provider mismatch'], 400);
        }

        // Clear cache
        cache()->forget($cacheKey);

        try {
            $user = \App\Models\User::find($storedData['user_id']);
            if (!$user) {
                return response()->json(['error' => 'User not found'], 404);
            }

            $gitProvider = $this->gitProviderService->connectProvider($user, $provider, $code);

            return response()->json([
                'message' => 'Successfully connected to ' . $gitProvider->getProviderDisplayName(),
                'provider' => [
                    'id' => $gitProvider->id,
                    'provider' => $gitProvider->provider,
                    'provider_name' => $gitProvider->getProviderDisplayName(),
                    'username' => $gitProvider->username,
                    'email' => $gitProvider->email,
                    'avatar_url' => $gitProvider->avatar_url,
                    'connected_at' => $gitProvider->connected_at?->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Git OAuth callback error', [
                'provider' => $provider,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Disconnect a Git provider.
     */
    public function disconnect(Request $request, string $provider): JsonResponse
    {
        $user = $request->user();

        $deleted = $this->gitProviderService->disconnectProvider($user, $provider);

        if ($deleted) {
            return response()->json(['message' => 'Provider disconnected successfully']);
        }

        return response()->json(['error' => 'Provider not found'], 404);
    }

    /**
     * Get repositories for a provider.
     */
    public function repositories(Request $request, string $provider): JsonResponse
    {
        $user = $request->user();
        $gitProvider = $user->getGitProvider($provider);

        if (!$gitProvider) {
            return response()->json(['error' => 'Provider not connected'], 404);
        }

        if ($gitProvider->isTokenExpired()) {
            return response()->json(['error' => 'Token expired, please reconnect'], 401);
        }

        try {
            $page = $request->input('page', 1);
            $perPage = $request->input('per_page', 30);
            $repositories = $this->gitProviderService->getRepositories($gitProvider, $page, $perPage);

            return response()->json(['repositories' => $repositories]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get branches for a repository.
     */
    public function branches(Request $request, string $provider): JsonResponse
    {
        $user = $request->user();
        $gitProvider = $user->getGitProvider($provider);

        if (!$gitProvider) {
            return response()->json(['error' => 'Provider not connected'], 404);
        }

        $repoFullName = $request->input('repo');
        if (!$repoFullName) {
            return response()->json(['error' => 'Repository name required'], 400);
        }

        try {
            $branches = $this->gitProviderService->getBranches($gitProvider, $repoFullName);
            return response()->json(['branches' => $branches]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Create a new repository.
     */
    public function createRepository(Request $request, string $provider): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'private' => 'boolean',
        ]);

        $user = $request->user();
        $gitProvider = $user->getGitProvider($provider);

        if (!$gitProvider) {
            return response()->json(['error' => 'Provider not connected'], 404);
        }

        try {
            $repository = $this->gitProviderService->createRepository(
                $gitProvider,
                $request->input('name'),
                $request->input('description', ''),
                $request->boolean('private', false)
            );

            return response()->json([
                'message' => 'Repository created successfully',
                'repository' => $repository,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Push files to a repository.
     */
    public function push(Request $request, string $provider): JsonResponse
    {
        $request->validate([
            'project_id' => 'required|integer|exists:projects,id',
            'archive' => 'required|file|mimes:zip',
            'branch' => 'required|string|max:255',
            'commit_message' => 'required|string|max:1000',
            'target_directory' => 'nullable|string|max:500',
            'create_pr' => 'nullable|boolean',
            'pr_title' => 'nullable|string|max:255',
            'pr_description' => 'nullable|string|max:5000',
            'base_branch' => 'nullable|string|max:100',
            'auto_merge' => 'nullable|boolean',
            'delete_branch_after_merge' => 'nullable|boolean',
        ]);

        $user = $request->user();
        $gitProvider = $user->getGitProvider($provider);

        if (!$gitProvider) {
            return response()->json(['error' => 'Provider not connected'], 404);
        }

        if ($gitProvider->isTokenExpired()) {
            return response()->json(['error' => 'Token expired, please reconnect'], 401);
        }

        // Get the project and verify git settings
        $project = \App\Models\Project::find($request->input('project_id'));

        if (!$project || !$project->userCanAccess($user)) {
            return response()->json(['error' => 'Project not found or access denied'], 403);
        }

        if (!$project->hasGitIntegration()) {
            return response()->json(['error' => 'Git integration not configured for this project'], 400);
        }

        if ($project->git_provider_id !== $gitProvider->id) {
            return response()->json(['error' => 'Provider mismatch with project settings'], 400);
        }

        try {
            // Extract files from ZIP
            $zipFile = $request->file('archive');
            $targetDirectory = $request->input('target_directory', '') ?: '';

            $zip = new \ZipArchive();
            if ($zip->open($zipFile->getRealPath()) !== true) {
                return response()->json(['error' => 'Failed to open archive'], 400);
            }

            $files = [];
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $filename = $zip->getNameIndex($i);

                // Skip directories
                if (str_ends_with($filename, '/')) {
                    continue;
                }

                $content = $zip->getFromIndex($i);

                // Build the path including target directory
                $path = $targetDirectory
                    ? trim($targetDirectory, '/') . '/' . $filename
                    : $filename;

                $files[$path] = $content;
            }

            $zip->close();

            if (empty($files)) {
                return response()->json(['error' => 'Archive contains no files'], 400);
            }

            // Push files to repository
            $baseBranch = $request->input('base_branch', $project->git_main_branch ?? 'main');

            $pushResult = $this->gitProviderService->pushToRepository(
                $gitProvider,
                $project->git_repository,
                $request->input('branch'),
                $request->input('commit_message'),
                $files,
                $baseBranch
            );

            $result = [
                'commit_sha' => $pushResult['commit_sha'],
                'branch' => $pushResult['branch'],
                'files_count' => $pushResult['files_count'],
            ];

            // Create PR if requested
            if ($request->boolean('create_pr', false)) {
                $prResult = $this->gitProviderService->createPullRequest(
                    $gitProvider,
                    $project->git_repository,
                    $request->input('pr_title', 'Code Generation'),
                    $request->input('pr_description', ''),
                    $request->input('branch'),
                    $baseBranch
                );

                $result['pr_number'] = $prResult['pr_number'];
                $result['pr_url'] = $prResult['pr_url'];

                // Auto-merge if requested
                if ($request->boolean('auto_merge', false)) {
                    try {
                        $mergeResult = $this->gitProviderService->mergePullRequest(
                            $gitProvider,
                            $project->git_repository,
                            $prResult['pr_number'],
                            $request->boolean('delete_branch_after_merge', false)
                        );
                        $result['merged'] = $mergeResult['merged'];
                    } catch (\Exception $mergeError) {
                        // Log merge error but don't fail the entire request
                        \Log::warning('Auto-merge failed', [
                            'error' => $mergeError->getMessage(),
                            'pr_number' => $prResult['pr_number'],
                        ]);
                        $result['merge_error'] = $mergeError->getMessage();
                    }
                }
            }

            return response()->json($result);

        } catch (\Exception $e) {
            \Log::error('Git push failed', [
                'provider' => $provider,
                'project_id' => $project->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
