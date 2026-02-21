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
     * Also returns Git Integration access status.
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
            'git_integration_access' => $user->getGitIntegrationAccessStatus(),
        ]);
    }

    /**
     * Unlock Git Integration with credits.
     */
    public function unlockGitIntegration(Request $request): JsonResponse
    {
        $user = $request->user();

        // Check if already has access
        if ($user->hasGitIntegrationAccess()) {
            return response()->json([
                'message' => __('gitprovidercontrollerphp51'),
                'access_status' => $user->getGitIntegrationAccessStatus(),
            ]);
        }

        // Check if user has enough credits
        $cost = \App\Models\Subscription::GIT_INTEGRATION_UNLOCK_COST;
        if ($user->credits < $cost) {
            return response()->json([
                'message' => __('gitprovidercontrollerphp60')."{$cost}".__('gitprovidercontrollerphp60_2')."{$user->credits}",
                'required_credits' => $cost,
                'current_credits' => $user->credits,
            ], 400);
        }

        // Unlock with credits
        $subscription = \App\Models\Subscription::unlockGitIntegrationWithCredits($user->id);

        if (!$subscription) {
            return response()->json([
                'message' => __('gitprovidercontrollerphp71'),
            ], 500);
        }

        return response()->json([
            'message' => __('gitprovidercontrollerphp76'),
            'access_status' => $user->getGitIntegrationAccessStatus(),
            'credits_remaining' => $user->fresh()->credits,
        ]);
    }

    /**
     * Get OAuth authorization URL for a provider.
     */
    public function authorize(Request $request, string $provider): JsonResponse
    {
        $user = $request->user();

        // Check Git Integration access
        if (!$user->hasGitIntegrationAccess()) {
            return response()->json([
                'error' => __('gitprovidercontrollerphp92'),
                'requires_subscription' => true,
                'unlock_cost' => \App\Models\Subscription::GIT_INTEGRATION_UNLOCK_COST,
            ], 403);
        }

        $validProviders = ['github', 'gitlab', 'bitbucket'];

        if (!in_array($provider, $validProviders)) {
            return response()->json(['error' => __('gitprovidercontrollerphp101')], 400);
        }

        // Generate state and store in cache (since API routes don't use sessions)
        $state = Str::random(40);
        $cacheKey = "git_oauth_state_{$state}";

        // Store user ID with state for 15 minutes (to give user enough time to authorize)
        cache()->put($cacheKey, [
            'user_id' => $request->user()->id,
            'provider' => $provider,
            'created_at' => now()->toIso8601String(),
        ], now()->addMinutes(15));

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
            return response()->json(['error' => __('gitprovidercontrollerphp131')], 400);
        }

        $state = $request->input('state');
        $code = $request->input('code');

        if (!$state || !$code) {
            return response()->json(['error' => __('gitprovidercontrollerphp138')], 400);
        }

        // Verify state from cache
        $cacheKey = "git_oauth_state_{$state}";
        $storedData = cache()->get($cacheKey);

        if (!$storedData) {
            \Log::warning('Git OAuth state not found in cache', [
                'provider' => $provider,
                'state_prefix' => substr($state, 0, 10) . '...',
            ]);
            return response()->json(['error' => __('gitprovidercontrollerphp150')], 400);
        }

        if ($storedData['provider'] !== $provider) {
            \Log::warning('Git OAuth provider mismatch', [
                'expected' => $storedData['provider'],
                'received' => $provider,
            ]);
            return response()->json(['error' => __('gitprovidercontrollerphp158')], 400);
        }

        // Clear cache
        cache()->forget($cacheKey);

        try {
            $user = \App\Models\User::find($storedData['user_id']);
            if (!$user) {
                return response()->json(['error' => __('gitprovidercontrollerphp167')], 404);
            }

            $gitProvider = $this->gitProviderService->connectProvider($user, $provider, $code);

            return response()->json([
                'message' => __('gitprovidercontrollerphp173') . $gitProvider->getProviderDisplayName(),
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
            \Log::error(__('gitprovidercontrollerphp185'), [
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
            return response()->json(['message' => __('gitprovidercontrollerphp203')]);
        }

        return response()->json(['error' => __('gitprovidercontrollerphp206')], 404);
    }

    /**
     * Get repositories for a provider.
     */
    public function repositories(Request $request, string $provider): JsonResponse
    {
        $user = $request->user();
        $gitProvider = $user->getGitProvider($provider);

        if (!$gitProvider) {
            return response()->json(['error' => __('gitprovidercontrollerphp218')], 404);
        }

        try {
            // Automatically refresh token if expired
            $gitProvider = $this->gitProviderService->ensureValidToken($gitProvider);

            $page = $request->input('page', 1);
            $perPage = $request->input('per_page', 30);
            $repositories = $this->gitProviderService->getRepositories($gitProvider, $page, $perPage);

            return response()->json(['repositories' => $repositories]);
        } catch (\Exception $e) {
            // If token refresh failed, suggest reconnection
            if (str_contains($e->getMessage(), 'refresh') || str_contains($e->getMessage(), 'reconnect')) {
                return response()->json(['error' => $e->getMessage(), 'needs_reconnect' => true], 401);
            }
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
            return response()->json(['error' => __('gitprovidercontrollerphp248')], 404);
        }

        $repoFullName = $request->input('repo');
        if (!$repoFullName) {
            return response()->json(['error' => __('gitprovidercontrollerphp253')], 400);
        }

        try {
            // Automatically refresh token if expired
            $gitProvider = $this->gitProviderService->ensureValidToken($gitProvider);

            $branches = $this->gitProviderService->getBranches($gitProvider, $repoFullName);
            return response()->json(['branches' => $branches]);
        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), 'refresh') || str_contains($e->getMessage(), 'reconnect')) {
                return response()->json(['error' => $e->getMessage(), 'needs_reconnect' => true], 401);
            }
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get branches for a specific repository (path-based).
     */
    public function repositoryBranches(Request $request, string $provider, string $repository): JsonResponse
    {
        $user = $request->user();
        $gitProvider = $user->getGitProvider($provider);

        if (!$gitProvider) {
            return response()->json(['error' => __('gitprovidercontrollerphp279')], 404);
        }

        try {
            // Automatically refresh token if expired
            $gitProvider = $this->gitProviderService->ensureValidToken($gitProvider);

            $branches = $this->gitProviderService->getBranches($gitProvider, $repository);
            return response()->json(['branches' => $branches]);
        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), 'refresh') || str_contains($e->getMessage(), 'reconnect')) {
                return response()->json(['error' => $e->getMessage(), 'needs_reconnect' => true], 401);
            }
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
            return response()->json(['error' => __('gitprovidercontrollerphp311')], 404);
        }

        try {
            // Automatically refresh token if expired
            $gitProvider = $this->gitProviderService->ensureValidToken($gitProvider);

            $repository = $this->gitProviderService->createRepository(
                $gitProvider,
                $request->input('name'),
                $request->input('description', ''),
                $request->boolean('private', false)
            );

            return response()->json([
                'message' => __('gitprovidercontrollerphp326'),
                'repository' => $repository,
            ], 201);
        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), 'refresh') || str_contains($e->getMessage(), 'reconnect')) {
                return response()->json(['error' => $e->getMessage(), 'needs_reconnect' => true], 401);
            }
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
            return response()->json(['error' => __('gitprovidercontrollerphp360')], 404);
        }

        try {
            // Automatically refresh token if expired
            $gitProvider = $this->gitProviderService->ensureValidToken($gitProvider);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage(), 'needs_reconnect' => true], 401);
        }

        // Get the project and verify git settings
        $project = \App\Models\Project::find($request->input('project_id'));

        if (!$project || !$project->userCanAccess($user)) {
            return response()->json(['error' => __('gitprovidercontrollerphp374')], 403);
        }

        if (!$project->hasGitIntegration()) {
            return response()->json(['error' => __('gitprovidercontrollerphp378')], 400);
        }

        if ($project->git_provider_id !== $gitProvider->id) {
            return response()->json(['error' => __('gitprovidercontrollerphp382')], 400);
        }

        try {
            // Extract files from ZIP
            $zipFile = $request->file('archive');
            $targetDirectory = $request->input('target_directory', '') ?: '';

            $zip = new \ZipArchive();
            if ($zip->open($zipFile->getRealPath()) !== true) {
                return response()->json(['error' => __('gitprovidercontrollerphp392')], 400);
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
                return response()->json(['error' => __('gitprovidercontrollerphp417')], 400);
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

    /**
     * Push files directly to a repository (without project binding).
     * Used by CodeGenerationPanel for direct Git push.
     */
    public function pushDirect(Request $request, string $provider): JsonResponse
    {
        $request->validate([
            'repository' => 'required|string|max:255',
            'branch' => 'required|string|max:255',
            'commit_message' => 'required|string|max:1000',
            'files' => 'required|array',
            'files.*' => 'string',
            'base_branch' => 'nullable|string|max:100',
            // PR options
            'create_pr' => 'nullable|boolean',
            'pr_title' => 'nullable|string|max:255',
            'pr_description' => 'nullable|string|max:5000',
            'auto_merge' => 'nullable|boolean',
            'delete_branch_after_merge' => 'nullable|boolean',
        ]);

        $user = $request->user();

        // Check Git Integration access
        if (!$user->hasGitIntegrationAccess()) {
            return response()->json([
                'error' => __('gitprovidercontrollerphp511'),
                'requires_subscription' => true,
                'unlock_cost' => \App\Models\Subscription::GIT_INTEGRATION_UNLOCK_COST,
            ], 403);
        }

        $gitProvider = $user->getGitProvider($provider);

        if (!$gitProvider) {
            return response()->json(['error' => __('gitprovidercontrollerphp520')], 404);
        }

        try {
            // Automatically refresh token if expired
            $gitProvider = $this->gitProviderService->ensureValidToken($gitProvider);

            $files = $request->input('files');
            $baseBranch = $request->input('base_branch', 'main');
            $branch = $request->input('branch');
            $repository = $request->input('repository');

            if (empty($files)) {
                return response()->json(['error' => __('gitprovidercontrollerphp533')], 400);
            }

            // Push files to repository
            $pushResult = $this->gitProviderService->pushToRepository(
                $gitProvider,
                $repository,
                $branch,
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
                $prTitle = $request->input('pr_title', __('gitprovidercontrollerphp554'));
                $prDescription = $request->input('pr_description', '');

                // Replace placeholders in PR title and description
                $timestamp = now()->utc()->format('Y-m-d H:i:s') . ' UTC';
                $prTitle = str_replace('{timestamp}', $timestamp, $prTitle);
                $prDescription = str_replace('{timestamp}', $timestamp, $prDescription);

                $prResult = $this->gitProviderService->createPullRequest(
                    $gitProvider,
                    $repository,
                    $prTitle,
                    $prDescription,
                    $branch,
                    $baseBranch
                );

                $result['pr_number'] = $prResult['pr_number'];
                $result['pr_url'] = $prResult['pr_url'];

                // Auto-merge if requested
                if ($request->boolean('auto_merge', false)) {
                    try {
                        $mergeResult = $this->gitProviderService->mergePullRequest(
                            $gitProvider,
                            $repository,
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
            \Log::error(__('gitprovidercontrollerphp598'), [
                'provider' => $provider,
                'repository' => $request->input('repository'),
                'error' => $e->getMessage(),
            ]);
            if (str_contains($e->getMessage(), 'refresh') || str_contains($e->getMessage(), 'reconnect')) {
                return response()->json(['error' => $e->getMessage(), 'needs_reconnect' => true], 401);
            }
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
