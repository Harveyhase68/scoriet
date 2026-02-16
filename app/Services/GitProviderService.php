<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserGitProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class GitProviderService
{
    /**
     * Get OAuth authorization URL for a provider.
     */
    public function getAuthorizationUrl(string $provider, string $state): string
    {
        return match ($provider) {
            'github' => $this->getGitHubAuthUrl($state),
            'gitlab' => $this->getGitLabAuthUrl($state),
            default => throw new \InvalidArgumentException("Unknown provider: {$provider}"),
        };
    }

    /**
     * Get GitHub OAuth authorization URL.
     */
    private function getGitHubAuthUrl(string $state): string
    {
        $params = http_build_query([
            'client_id' => config('services.github.client_id'),
            'redirect_uri' => config('services.github.redirect'),
            'scope' => 'repo user:email',
            'state' => $state,
        ]);

        return "https://github.com/login/oauth/authorize?{$params}";
    }

    /**
     * Get GitLab OAuth authorization URL.
     */
    private function getGitLabAuthUrl(string $state): string
    {
        $baseUrl = config('services.gitlab.base_url', 'https://gitlab.com');
        $params = http_build_query([
            'client_id' => config('services.gitlab.client_id'),
            'redirect_uri' => config('services.gitlab.redirect'),
            'response_type' => 'code',
            'scope' => 'api read_user',
            'state' => $state,
        ]);

        return "{$baseUrl}/oauth/authorize?{$params}";
    }

    /**
     * Exchange authorization code for access token.
     */
    public function exchangeCodeForToken(string $provider, string $code): array
    {
        return match ($provider) {
            'github' => $this->exchangeGitHubCode($code),
            'gitlab' => $this->exchangeGitLabCode($code),
            default => throw new \InvalidArgumentException("Unknown provider: {$provider}"),
        };
    }

    /**
     * Exchange GitHub authorization code for access token.
     */
    private function exchangeGitHubCode(string $code): array
    {
        // Note: withoutVerifying() is for local development only!
        // In production, proper SSL certificates should be configured
        $response = Http::acceptJson()
            ->withoutVerifying()
            ->post('https://github.com/login/oauth/access_token', [
                'client_id' => config('services.github.client_id'),
                'client_secret' => config('services.github.client_secret'),
                'code' => $code,
                'redirect_uri' => config('services.github.redirect'),
            ]);

        if ($response->failed()) {
            throw new \Exception('Failed to exchange GitHub code for token');
        }

        $data = $response->json();

        if (isset($data['error'])) {
            throw new \Exception($data['error_description'] ?? $data['error']);
        }

        return [
            'access_token' => $data['access_token'],
            'token_type' => $data['token_type'] ?? 'bearer',
            'scope' => $data['scope'] ?? '',
            'refresh_token' => null, // GitHub doesn't use refresh tokens for OAuth apps
            'expires_at' => null, // GitHub tokens don't expire
        ];
    }

    /**
     * Exchange GitLab authorization code for access token.
     */
    private function exchangeGitLabCode(string $code): array
    {
        $baseUrl = config('services.gitlab.base_url', 'https://gitlab.com');

        // Note: withoutVerifying() is for local development only!
        // In production, proper SSL certificates should be configured
        $response = Http::withoutVerifying()
            ->post("{$baseUrl}/oauth/token", [
                'client_id' => config('services.gitlab.client_id'),
                'client_secret' => config('services.gitlab.client_secret'),
                'code' => $code,
                'grant_type' => 'authorization_code',
                'redirect_uri' => config('services.gitlab.redirect'),
            ]);

        if ($response->failed()) {
            throw new \Exception('Failed to exchange GitLab code for token');
        }

        $data = $response->json();

        if (isset($data['error'])) {
            throw new \Exception($data['error_description'] ?? $data['error']);
        }

        return [
            'access_token' => $data['access_token'],
            'token_type' => $data['token_type'] ?? 'bearer',
            'scope' => $data['scope'] ?? '',
            'refresh_token' => $data['refresh_token'] ?? null,
            'expires_at' => isset($data['expires_in'])
                ? now()->addSeconds($data['expires_in'])
                : null,
        ];
    }

    /**
     * Refresh GitLab access token using refresh token.
     */
    public function refreshGitLabToken(UserGitProvider $gitProvider): bool
    {
        if ($gitProvider->provider !== 'gitlab' || !$gitProvider->refresh_token) {
            return false;
        }

        $baseUrl = config('services.gitlab.base_url', 'https://gitlab.com');

        $response = Http::withoutVerifying()
            ->asForm()
            ->post("{$baseUrl}/oauth/token", [
                'client_id' => config('services.gitlab.client_id'),
                'client_secret' => config('services.gitlab.client_secret'),
                'refresh_token' => $gitProvider->refresh_token,
                'grant_type' => 'refresh_token',
                'redirect_uri' => config('services.gitlab.redirect'),
            ]);

        if ($response->failed()) {
            \Log::error('GitLab token refresh failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return false;
        }

        $data = $response->json();

        if (isset($data['error'])) {
            \Log::error('GitLab token refresh error', ['error' => $data]);
            return false;
        }

        // Update the token in database
        $gitProvider->access_token = $data['access_token'];
        if (isset($data['refresh_token'])) {
            $gitProvider->refresh_token = $data['refresh_token'];
        }
        $gitProvider->token_expires_at = isset($data['expires_in'])
            ? now()->addSeconds($data['expires_in'])
            : null;
        $gitProvider->save();

        return true;
    }

    /**
     * Ensure token is valid, refresh if needed.
     * Returns the git provider with a valid token, or throws an exception.
     */
    public function ensureValidToken(UserGitProvider $gitProvider): UserGitProvider
    {
        // GitHub tokens don't expire (unless revoked)
        if ($gitProvider->provider === 'github') {
            return $gitProvider;
        }

        // Check if GitLab token is expired or about to expire (within 5 minutes)
        if ($gitProvider->token_expires_at && $gitProvider->token_expires_at->subMinutes(5)->isPast()) {
            if (!$this->refreshGitLabToken($gitProvider)) {
                throw new \Exception('Failed to refresh GitLab token. Please reconnect your GitLab account.');
            }
            // Reload to get the new token
            $gitProvider->refresh();
        }

        return $gitProvider;
    }

    /**
     * Get user info from provider.
     */
    public function getUserInfo(string $provider, string $accessToken): array
    {
        return match ($provider) {
            'github' => $this->getGitHubUserInfo($accessToken),
            'gitlab' => $this->getGitLabUserInfo($accessToken),
            default => throw new \InvalidArgumentException("Unknown provider: {$provider}"),
        };
    }

    /**
     * Get GitHub user info.
     */
    private function getGitHubUserInfo(string $accessToken): array
    {
        $response = Http::withToken($accessToken)->withoutVerifying()->get('https://api.github.com/user');

        if ($response->failed()) {
            throw new \Exception('Failed to get GitHub user info');
        }

        $user = $response->json();

        // Get email if not public
        $email = $user['email'];
        if (!$email) {
            $emailResponse = Http::withToken($accessToken)->withoutVerifying()->get('https://api.github.com/user/emails');
            if ($emailResponse->successful()) {
                $emails = $emailResponse->json();
                $primaryEmail = collect($emails)->firstWhere('primary', true);
                $email = $primaryEmail['email'] ?? ($emails[0]['email'] ?? null);
            }
        }

        return [
            'provider_user_id' => (string) $user['id'],
            'username' => $user['login'],
            'email' => $email,
            'avatar_url' => $user['avatar_url'],
        ];
    }

    /**
     * Get GitLab user info.
     */
    private function getGitLabUserInfo(string $accessToken): array
    {
        $baseUrl = config('services.gitlab.base_url', 'https://gitlab.com');
        $response = Http::withToken($accessToken)->withoutVerifying()->get("{$baseUrl}/api/v4/user");

        if ($response->failed()) {
            throw new \Exception('Failed to get GitLab user info');
        }

        $user = $response->json();

        return [
            'provider_user_id' => (string) $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'avatar_url' => $user['avatar_url'],
        ];
    }

    /**
     * Connect a provider for a user.
     */
    public function connectProvider(User $user, string $provider, string $code): UserGitProvider
    {
        // Exchange code for token
        $tokenData = $this->exchangeCodeForToken($provider, $code);

        // Get user info
        $userInfo = $this->getUserInfo($provider, $tokenData['access_token']);

        // Create or update the provider connection
        $gitProvider = UserGitProvider::updateOrCreate(
            [
                'user_id' => $user->id,
                'provider' => $provider,
            ],
            [
                'provider_user_id' => $userInfo['provider_user_id'],
                'username' => $userInfo['username'],
                'email' => $userInfo['email'],
                'avatar_url' => $userInfo['avatar_url'],
                'access_token' => $tokenData['access_token'],
                'refresh_token' => $tokenData['refresh_token'],
                'token_expires_at' => $tokenData['expires_at'],
                'scopes' => $tokenData['scope'],
                'connected_at' => now(),
            ]
        );

        return $gitProvider;
    }

    /**
     * Disconnect a provider for a user.
     */
    public function disconnectProvider(User $user, string $provider): bool
    {
        return $user->gitProviders()->where('provider', $provider)->delete() > 0;
    }

    /**
     * Get user's repositories from a provider.
     */
    public function getRepositories(UserGitProvider $gitProvider, int $page = 1, int $perPage = 30): array
    {
        return match ($gitProvider->provider) {
            'github' => $this->getGitHubRepositories($gitProvider, $page, $perPage),
            'gitlab' => $this->getGitLabRepositories($gitProvider, $page, $perPage),
            default => [],
        };
    }

    /**
     * Get GitHub repositories.
     */
    private function getGitHubRepositories(UserGitProvider $gitProvider, int $page, int $perPage): array
    {
        $response = Http::withToken($gitProvider->access_token)
            ->withoutVerifying()
            ->get('https://api.github.com/user/repos', [
                'sort' => 'updated',
                'direction' => 'desc',
                'per_page' => $perPage,
                'page' => $page,
            ]);

        if ($response->failed()) {
            throw new \Exception('Failed to get GitHub repositories');
        }

        return collect($response->json())->map(fn($repo) => [
            'id' => $repo['id'],
            'name' => $repo['name'],
            'full_name' => $repo['full_name'],
            'private' => $repo['private'],
            'url' => $repo['html_url'],
            'default_branch' => $repo['default_branch'],
            'description' => $repo['description'],
            'updated_at' => $repo['updated_at'],
        ])->toArray();
    }

    /**
     * Get GitLab repositories (projects).
     */
    private function getGitLabRepositories(UserGitProvider $gitProvider, int $page, int $perPage): array
    {
        $baseUrl = config('services.gitlab.base_url', 'https://gitlab.com');

        $response = Http::withToken($gitProvider->access_token)
            ->withoutVerifying()
            ->get("{$baseUrl}/api/v4/projects", [
                'membership' => true,
                'order_by' => 'updated_at',
                'sort' => 'desc',
                'per_page' => $perPage,
                'page' => $page,
            ]);

        if ($response->failed()) {
            throw new \Exception('Failed to get GitLab repositories');
        }

        return collect($response->json())->map(fn($repo) => [
            'id' => $repo['id'],
            'name' => $repo['name'],
            'full_name' => $repo['path_with_namespace'],
            'private' => $repo['visibility'] !== 'public',
            'url' => $repo['web_url'],
            'default_branch' => $repo['default_branch'],
            'description' => $repo['description'],
            'updated_at' => $repo['last_activity_at'],
        ])->toArray();
    }

    /**
     * Create a new repository.
     */
    public function createRepository(UserGitProvider $gitProvider, string $name, string $description = '', bool $private = false): array
    {
        return match ($gitProvider->provider) {
            'github' => $this->createGitHubRepository($gitProvider, $name, $description, $private),
            'gitlab' => $this->createGitLabRepository($gitProvider, $name, $description, $private),
            default => throw new \InvalidArgumentException("Unknown provider: {$gitProvider->provider}"),
        };
    }

    /**
     * Create a GitHub repository.
     */
    private function createGitHubRepository(UserGitProvider $gitProvider, string $name, string $description, bool $private): array
    {
        $response = Http::withToken($gitProvider->access_token)
            ->withoutVerifying()
            ->post('https://api.github.com/user/repos', [
                'name' => $name,
                'description' => $description,
                'private' => $private,
                'auto_init' => true,
            ]);

        if ($response->failed()) {
            $error = $response->json();
            throw new \Exception($error['message'] ?? 'Failed to create GitHub repository');
        }

        $repo = $response->json();

        return [
            'id' => $repo['id'],
            'name' => $repo['name'],
            'full_name' => $repo['full_name'],
            'url' => $repo['html_url'],
            'clone_url' => $repo['clone_url'],
            'default_branch' => $repo['default_branch'],
        ];
    }

    /**
     * Create a GitLab repository (project).
     */
    private function createGitLabRepository(UserGitProvider $gitProvider, string $name, string $description, bool $private): array
    {
        $baseUrl = config('services.gitlab.base_url', 'https://gitlab.com');

        $response = Http::withToken($gitProvider->access_token)
            ->withoutVerifying()
            ->post("{$baseUrl}/api/v4/projects", [
                'name' => $name,
                'description' => $description,
                'visibility' => $private ? 'private' : 'public',
                'initialize_with_readme' => true,
            ]);

        if ($response->failed()) {
            $error = $response->json();
            throw new \Exception($error['message'] ?? 'Failed to create GitLab repository');
        }

        $repo = $response->json();

        return [
            'id' => $repo['id'],
            'name' => $repo['name'],
            'full_name' => $repo['path_with_namespace'],
            'url' => $repo['web_url'],
            'clone_url' => $repo['http_url_to_repo'],
            'default_branch' => $repo['default_branch'],
        ];
    }

    /**
     * Get branches for a repository.
     */
    public function getBranches(UserGitProvider $gitProvider, string $repoFullName): array
    {
        return match ($gitProvider->provider) {
            'github' => $this->getGitHubBranches($gitProvider, $repoFullName),
            'gitlab' => $this->getGitLabBranches($gitProvider, $repoFullName),
            default => [],
        };
    }

    /**
     * Get GitHub branches.
     */
    private function getGitHubBranches(UserGitProvider $gitProvider, string $repoFullName): array
    {
        $response = Http::withToken($gitProvider->access_token)
            ->withoutVerifying()
            ->get("https://api.github.com/repos/{$repoFullName}/branches");

        if ($response->failed()) {
            throw new \Exception('Failed to get GitHub branches');
        }

        return collect($response->json())->map(fn($branch) => [
            'name' => $branch['name'],
            'protected' => $branch['protected'] ?? false,
        ])->toArray();
    }

    /**
     * Get GitLab branches.
     */
    private function getGitLabBranches(UserGitProvider $gitProvider, string $repoFullName): array
    {
        $baseUrl = config('services.gitlab.base_url', 'https://gitlab.com');
        $encodedPath = urlencode($repoFullName);

        $response = Http::withToken($gitProvider->access_token)
            ->withoutVerifying()
            ->get("{$baseUrl}/api/v4/projects/{$encodedPath}/repository/branches");

        if ($response->failed()) {
            throw new \Exception('Failed to get GitLab branches');
        }

        return collect($response->json())->map(fn($branch) => [
            'name' => $branch['name'],
            'protected' => $branch['protected'] ?? false,
        ])->toArray();
    }

    /**
     * Push files to a repository.
     */
    public function pushToRepository(
        UserGitProvider $gitProvider,
        string $repoFullName,
        string $branch,
        string $commitMessage,
        array $files, // ['path' => 'content', ...]
        string $baseBranch = 'main'
    ): array {
        return match ($gitProvider->provider) {
            'github' => $this->pushToGitHub($gitProvider, $repoFullName, $branch, $commitMessage, $files, $baseBranch),
            'gitlab' => $this->pushToGitLab($gitProvider, $repoFullName, $branch, $commitMessage, $files, $baseBranch),
            default => throw new \InvalidArgumentException("Push not supported for provider: {$gitProvider->provider}"),
        };
    }

    /**
     * Push files to GitHub repository.
     */
    private function pushToGitHub(
        UserGitProvider $gitProvider,
        string $repoFullName,
        string $branch,
        string $commitMessage,
        array $files,
        string $baseBranch
    ): array {
        $baseUrl = 'https://api.github.com';

        // Step 1: Get the reference for the base branch
        $refResponse = Http::withToken($gitProvider->access_token)
            ->withoutVerifying()
            ->get("{$baseUrl}/repos/{$repoFullName}/git/ref/heads/{$baseBranch}");

        if ($refResponse->failed()) {
            throw new \Exception("Failed to get reference for branch {$baseBranch}");
        }

        $baseSha = $refResponse->json()['object']['sha'];

        // Step 2: Get the base tree
        $commitResponse = Http::withToken($gitProvider->access_token)
            ->withoutVerifying()
            ->get("{$baseUrl}/repos/{$repoFullName}/git/commits/{$baseSha}");

        if ($commitResponse->failed()) {
            throw new \Exception('Failed to get base commit');
        }

        $baseTreeSha = $commitResponse->json()['tree']['sha'];

        // Step 3: Create blobs for each file
        $treeItems = [];
        foreach ($files as $path => $content) {
            $blobResponse = Http::withToken($gitProvider->access_token)
                ->withoutVerifying()
                ->post("{$baseUrl}/repos/{$repoFullName}/git/blobs", [
                    'content' => base64_encode($content),
                    'encoding' => 'base64',
                ]);

            if ($blobResponse->failed()) {
                throw new \Exception("Failed to create blob for file: {$path}");
            }

            $treeItems[] = [
                'path' => $path,
                'mode' => '100644',
                'type' => 'blob',
                'sha' => $blobResponse->json()['sha'],
            ];
        }

        // Step 4: Create a new tree
        $treeResponse = Http::withToken($gitProvider->access_token)
            ->withoutVerifying()
            ->post("{$baseUrl}/repos/{$repoFullName}/git/trees", [
                'base_tree' => $baseTreeSha,
                'tree' => $treeItems,
            ]);

        if ($treeResponse->failed()) {
            throw new \Exception('Failed to create tree');
        }

        $newTreeSha = $treeResponse->json()['sha'];

        // Step 5: Create a new commit
        $newCommitResponse = Http::withToken($gitProvider->access_token)
            ->withoutVerifying()
            ->post("{$baseUrl}/repos/{$repoFullName}/git/commits", [
                'message' => $commitMessage,
                'tree' => $newTreeSha,
                'parents' => [$baseSha],
            ]);

        if ($newCommitResponse->failed()) {
            throw new \Exception('Failed to create commit');
        }

        $newCommitSha = $newCommitResponse->json()['sha'];

        // Step 6: Create or update the branch reference
        $branchExists = Http::withToken($gitProvider->access_token)
            ->withoutVerifying()
            ->get("{$baseUrl}/repos/{$repoFullName}/git/ref/heads/{$branch}")
            ->successful();

        if ($branchExists) {
            // Update existing branch
            $updateRefResponse = Http::withToken($gitProvider->access_token)
                ->withoutVerifying()
                ->patch("{$baseUrl}/repos/{$repoFullName}/git/refs/heads/{$branch}", [
                    'sha' => $newCommitSha,
                    'force' => true,
                ]);

            if ($updateRefResponse->failed()) {
                throw new \Exception('Failed to update branch reference');
            }
        } else {
            // Create new branch
            $createRefResponse = Http::withToken($gitProvider->access_token)
                ->withoutVerifying()
                ->post("{$baseUrl}/repos/{$repoFullName}/git/refs", [
                    'ref' => "refs/heads/{$branch}",
                    'sha' => $newCommitSha,
                ]);

            if ($createRefResponse->failed()) {
                throw new \Exception('Failed to create branch reference');
            }
        }

        return [
            'commit_sha' => $newCommitSha,
            'branch' => $branch,
            'files_count' => count($files),
        ];
    }

    /**
     * Push files to GitLab repository.
     */
    private function pushToGitLab(
        UserGitProvider $gitProvider,
        string $repoFullName,
        string $branch,
        string $commitMessage,
        array $files,
        string $baseBranch
    ): array {
        $baseUrl = config('services.gitlab.base_url', 'https://gitlab.com');
        $encodedPath = urlencode($repoFullName);
        // Branch names with slashes (e.g. feature/new-feature) must be URL encoded
        $encodedBranch = urlencode($branch);

        // Check if branch exists
        $branchCheck = Http::withToken($gitProvider->access_token)
            ->withoutVerifying()
            ->get("{$baseUrl}/api/v4/projects/{$encodedPath}/repository/branches/{$encodedBranch}");

        $branchExists = $branchCheck->successful();

        // GitLab uses commits API with actions
        // We need to check if each file exists to determine create vs update action
        $actions = [];
        foreach ($files as $path => $content) {
            // Check if file exists in the target branch (or base branch if new branch)
            $checkBranch = $branchExists ? $branch : $baseBranch;
            $fileCheck = Http::withToken($gitProvider->access_token)
                ->withoutVerifying()
                ->get("{$baseUrl}/api/v4/projects/{$encodedPath}/repository/files/" . urlencode($path), [
                    'ref' => $checkBranch,
                ]);

            $actions[] = [
                'action' => $fileCheck->successful() ? 'update' : 'create',
                'file_path' => $path,
                'content' => $content,
            ];
        }

        // Build commit payload
        $commitPayload = [
            'branch' => $branch,
            'commit_message' => $commitMessage,
            'actions' => $actions,
        ];

        // Only set start_branch if creating a new branch
        if (!$branchExists) {
            $commitPayload['start_branch'] = $baseBranch;
        }

        $response = Http::withToken($gitProvider->access_token)
            ->withoutVerifying()
            ->post("{$baseUrl}/api/v4/projects/{$encodedPath}/repository/commits", $commitPayload);

        if ($response->failed()) {
            $error = $response->json();
            throw new \Exception($error['message'] ?? 'Failed to push to GitLab');
        }

        $commit = $response->json();

        return [
            'commit_sha' => $commit['id'],
            'branch' => $branch,
            'files_count' => count($files),
        ];
    }

    /**
     * Create a pull request.
     */
    public function createPullRequest(
        UserGitProvider $gitProvider,
        string $repoFullName,
        string $title,
        string $description,
        string $headBranch,
        string $baseBranch
    ): array {
        return match ($gitProvider->provider) {
            'github' => $this->createGitHubPullRequest($gitProvider, $repoFullName, $title, $description, $headBranch, $baseBranch),
            'gitlab' => $this->createGitLabMergeRequest($gitProvider, $repoFullName, $title, $description, $headBranch, $baseBranch),
            default => throw new \InvalidArgumentException("Pull requests not supported for provider: {$gitProvider->provider}"),
        };
    }

    /**
     * Create a GitHub pull request.
     */
    private function createGitHubPullRequest(
        UserGitProvider $gitProvider,
        string $repoFullName,
        string $title,
        string $description,
        string $headBranch,
        string $baseBranch
    ): array {
        $response = Http::withToken($gitProvider->access_token)
            ->withoutVerifying()
            ->post("https://api.github.com/repos/{$repoFullName}/pulls", [
                'title' => $title,
                'body' => $description,
                'head' => $headBranch,
                'base' => $baseBranch,
            ]);

        if ($response->failed()) {
            $error = $response->json();
            throw new \Exception($error['message'] ?? 'Failed to create pull request');
        }

        $pr = $response->json();

        return [
            'pr_number' => $pr['number'],
            'pr_url' => $pr['html_url'],
            'state' => $pr['state'],
        ];
    }

    /**
     * Create a GitLab merge request.
     */
    private function createGitLabMergeRequest(
        UserGitProvider $gitProvider,
        string $repoFullName,
        string $title,
        string $description,
        string $headBranch,
        string $baseBranch
    ): array {
        $baseUrl = config('services.gitlab.base_url', 'https://gitlab.com');
        $encodedPath = urlencode($repoFullName);

        $response = Http::withToken($gitProvider->access_token)
            ->withoutVerifying()
            ->post("{$baseUrl}/api/v4/projects/{$encodedPath}/merge_requests", [
                'title' => $title,
                'description' => $description,
                'source_branch' => $headBranch,
                'target_branch' => $baseBranch,
            ]);

        if ($response->failed()) {
            $error = $response->json();
            throw new \Exception($error['message'] ?? 'Failed to create merge request');
        }

        $mr = $response->json();

        return [
            'pr_number' => $mr['iid'],
            'pr_url' => $mr['web_url'],
            'state' => $mr['state'],
        ];
    }

    /**
     * Merge a pull request.
     */
    public function mergePullRequest(
        UserGitProvider $gitProvider,
        string $repoFullName,
        int $prNumber,
        bool $deleteBranch = false
    ): array {
        return match ($gitProvider->provider) {
            'github' => $this->mergeGitHubPullRequest($gitProvider, $repoFullName, $prNumber, $deleteBranch),
            'gitlab' => $this->mergeGitLabMergeRequest($gitProvider, $repoFullName, $prNumber, $deleteBranch),
            default => throw new \InvalidArgumentException("Merge not supported for provider: {$gitProvider->provider}"),
        };
    }

    /**
     * Merge a GitHub pull request.
     */
    private function mergeGitHubPullRequest(
        UserGitProvider $gitProvider,
        string $repoFullName,
        int $prNumber,
        bool $deleteBranch
    ): array {
        // Merge the PR
        $response = Http::withToken($gitProvider->access_token)
            ->withoutVerifying()
            ->put("https://api.github.com/repos/{$repoFullName}/pulls/{$prNumber}/merge", [
                'merge_method' => 'merge',
            ]);

        if ($response->failed()) {
            $error = $response->json();
            throw new \Exception($error['message'] ?? 'Failed to merge pull request');
        }

        $result = ['merged' => true, 'sha' => $response->json()['sha'] ?? null];

        // Delete branch if requested
        if ($deleteBranch) {
            // Get the PR to find the head branch
            $prResponse = Http::withToken($gitProvider->access_token)
                ->withoutVerifying()
                ->get("https://api.github.com/repos/{$repoFullName}/pulls/{$prNumber}");

            if ($prResponse->successful()) {
                $headBranch = $prResponse->json()['head']['ref'];
                Http::withToken($gitProvider->access_token)
                    ->withoutVerifying()
                    ->delete("https://api.github.com/repos/{$repoFullName}/git/refs/heads/{$headBranch}");
            }
        }

        return $result;
    }

    /**
     * Merge a GitLab merge request.
     */
    private function mergeGitLabMergeRequest(
        UserGitProvider $gitProvider,
        string $repoFullName,
        int $mrIid,
        bool $deleteBranch
    ): array {
        $baseUrl = config('services.gitlab.base_url', 'https://gitlab.com');
        $encodedPath = urlencode($repoFullName);

        // Wait for MR to be ready to merge (GitLab needs time to check mergeability)
        $maxAttempts = 10;
        $waitSeconds = 2;
        $mr = null;
        $mergeStatus = 'unknown';

        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            $mrResponse = Http::withToken($gitProvider->access_token)
                ->withoutVerifying()
                ->get("{$baseUrl}/api/v4/projects/{$encodedPath}/merge_requests/{$mrIid}");

            if ($mrResponse->failed()) {
                throw new \Exception('Failed to get merge request status');
            }

            $mr = $mrResponse->json();
            $mergeStatus = $mr['merge_status'] ?? 'unknown';
            $detailedStatus = $mr['detailed_merge_status'] ?? null;
            $state = $mr['state'] ?? 'unknown';

            // Check if already merged
            if ($state === 'merged') {
                return [
                    'merged' => true,
                    'sha' => $mr['merge_commit_sha'] ?? null,
                ];
            }

            // Check if MR is closed or in error state
            if ($state !== 'opened') {
                throw new \Exception("Merge request is not open (state: {$state})");
            }

            // Check if ready to merge
            if ($mergeStatus === 'can_be_merged' || $detailedStatus === 'mergeable') {
                break;
            }

            // If there are conflicts or it cannot be merged, fail immediately
            if ($mergeStatus === 'cannot_be_merged' || $detailedStatus === 'not_open' ||
                $detailedStatus === 'conflict' || $detailedStatus === 'broken_status') {
                throw new \Exception("Cannot merge: {$detailedStatus} ({$mergeStatus})");
            }

            // If still checking/preparing, wait and retry
            if ($attempt < $maxAttempts && ($mergeStatus === 'checking' || $detailedStatus === 'preparing')) {
                sleep($waitSeconds);
            }
        }

        // Build query parameters for the merge
        $queryParams = [];
        if ($deleteBranch) {
            $queryParams['should_remove_source_branch'] = 'true';
        }

        $mergeUrl = "{$baseUrl}/api/v4/projects/{$encodedPath}/merge_requests/{$mrIid}/merge";
        if (!empty($queryParams)) {
            $mergeUrl .= '?' . http_build_query($queryParams);
        }

        // GitLab merge endpoint expects PUT without body (params in URL)
        $response = Http::withToken($gitProvider->access_token)
            ->withoutVerifying()
            ->put($mergeUrl);

        if ($response->failed()) {
            $error = $response->json();
            $statusCode = $response->status();
            $message = $error['message'] ?? "Failed to merge (HTTP {$statusCode})";

            \Log::error('GitLab merge failed', [
                'status' => $statusCode,
                'error' => $error,
                'merge_status' => $mergeStatus,
            ]);

            // Provide helpful error messages
            if ($statusCode === 405 || $statusCode === 406 || $statusCode === 422) {
                $message = "Cannot merge: {$mergeStatus}. The merge request may have conflicts or require pipeline to pass.";
            }

            throw new \Exception($message);
        }

        return [
            'merged' => true,
            'sha' => $response->json()['merge_commit_sha'] ?? null,
        ];
    }

    /**
     * Get repository file tree (list all files recursively).
     *
     * @param UserGitProvider $gitProvider
     * @param string $repoFullName e.g. "user/repo"
     * @param string $branch e.g. "main"
     * @param string $path Optional subdirectory path to filter
     * @return array List of file paths
     */
    public function getRepositoryTree(UserGitProvider $gitProvider, string $repoFullName, string $branch, string $path = ''): array
    {
        return match ($gitProvider->provider) {
            'github' => $this->getGitHubRepositoryTree($gitProvider, $repoFullName, $branch, $path),
            'gitlab' => $this->getGitLabRepositoryTree($gitProvider, $repoFullName, $branch, $path),
            default => [],
        };
    }

    /**
     * Get GitHub repository tree.
     */
    private function getGitHubRepositoryTree(UserGitProvider $gitProvider, string $repoFullName, string $branch, string $path = ''): array
    {
        $response = Http::withToken($gitProvider->access_token)
            ->withoutVerifying()
            ->get("https://api.github.com/repos/{$repoFullName}/git/trees/{$branch}", [
                'recursive' => '1',
            ]);

        if ($response->failed()) {
            throw new \Exception('Failed to get GitHub repository tree');
        }

        $tree = $response->json()['tree'] ?? [];

        // Filter to only files (not directories) and optionally by path prefix
        $files = [];
        foreach ($tree as $item) {
            if ($item['type'] !== 'blob') {
                continue;
            }

            $filePath = $item['path'];

            // Filter by path prefix if specified
            if ($path !== '' && !str_starts_with($filePath, $path)) {
                continue;
            }

            $files[] = [
                'path' => $filePath,
                'sha' => $item['sha'],
                'size' => $item['size'] ?? 0,
            ];
        }

        return $files;
    }

    /**
     * Get GitLab repository tree.
     */
    private function getGitLabRepositoryTree(UserGitProvider $gitProvider, string $repoFullName, string $branch, string $path = ''): array
    {
        $baseUrl = config('services.gitlab.base_url', 'https://gitlab.com');
        $encodedPath = urlencode($repoFullName);

        $params = [
            'ref' => $branch,
            'recursive' => 'true',
            'per_page' => 100,
        ];

        if ($path !== '') {
            $params['path'] = $path;
        }

        $files = [];
        $page = 1;

        // GitLab paginates results, so we need to fetch all pages
        do {
            $params['page'] = $page;

            $response = Http::withToken($gitProvider->access_token)
                ->withoutVerifying()
                ->get("{$baseUrl}/api/v4/projects/{$encodedPath}/repository/tree", $params);

            if ($response->failed()) {
                throw new \Exception('Failed to get GitLab repository tree');
            }

            $items = $response->json();

            foreach ($items as $item) {
                if ($item['type'] !== 'blob') {
                    continue;
                }

                $files[] = [
                    'path' => $item['path'],
                    'sha' => $item['id'],
                    'size' => 0, // GitLab tree API doesn't return size
                ];
            }

            $page++;
        } while (count($items) === $params['per_page']);

        return $files;
    }

    /**
     * Get content of a single file from repository.
     *
     * @param UserGitProvider $gitProvider
     * @param string $repoFullName e.g. "user/repo"
     * @param string $branch e.g. "main"
     * @param string $filePath Path to file in repository
     * @return string File content
     */
    public function getFileContent(UserGitProvider $gitProvider, string $repoFullName, string $branch, string $filePath): string
    {
        return match ($gitProvider->provider) {
            'github' => $this->getGitHubFileContent($gitProvider, $repoFullName, $branch, $filePath),
            'gitlab' => $this->getGitLabFileContent($gitProvider, $repoFullName, $branch, $filePath),
            default => '',
        };
    }

    /**
     * Get GitHub file content.
     */
    private function getGitHubFileContent(UserGitProvider $gitProvider, string $repoFullName, string $branch, string $filePath): string
    {
        $response = Http::withToken($gitProvider->access_token)
            ->withoutVerifying()
            ->get("https://api.github.com/repos/{$repoFullName}/contents/{$filePath}", [
                'ref' => $branch,
            ]);

        if ($response->failed()) {
            throw new \Exception("Failed to get file content: {$filePath}");
        }

        $data = $response->json();

        // GitHub returns base64 encoded content
        if (isset($data['content']) && $data['encoding'] === 'base64') {
            return base64_decode($data['content']);
        }

        // For large files, we need to fetch via blob API
        if (isset($data['sha'])) {
            $blobResponse = Http::withToken($gitProvider->access_token)
                ->withoutVerifying()
                ->get("https://api.github.com/repos/{$repoFullName}/git/blobs/{$data['sha']}");

            if ($blobResponse->successful()) {
                $blobData = $blobResponse->json();
                if ($blobData['encoding'] === 'base64') {
                    return base64_decode($blobData['content']);
                }
            }
        }

        throw new \Exception("Could not decode file content: {$filePath}");
    }

    /**
     * Get GitLab file content.
     */
    private function getGitLabFileContent(UserGitProvider $gitProvider, string $repoFullName, string $branch, string $filePath): string
    {
        $baseUrl = config('services.gitlab.base_url', 'https://gitlab.com');
        $encodedPath = urlencode($repoFullName);
        $encodedFilePath = urlencode($filePath);

        // GitLab raw file endpoint
        $response = Http::withToken($gitProvider->access_token)
            ->withoutVerifying()
            ->get("{$baseUrl}/api/v4/projects/{$encodedPath}/repository/files/{$encodedFilePath}/raw", [
                'ref' => $branch,
            ]);

        if ($response->failed()) {
            throw new \Exception("Failed to get file content: {$filePath}");
        }

        return $response->body();
    }

    /**
     * Get contents of multiple files from repository directory.
     * Returns an associative array of path => content.
     *
     * @param UserGitProvider $gitProvider
     * @param string $repoFullName e.g. "user/repo"
     * @param string $branch e.g. "main"
     * @param string $directory Optional directory prefix to filter
     * @param int $maxFiles Maximum number of files to fetch (for rate limiting)
     * @return array ['files' => ['path' => 'content', ...], 'truncated' => bool]
     */
    public function getDirectoryContents(
        UserGitProvider $gitProvider,
        string $repoFullName,
        string $branch,
        string $directory = '',
        int $maxFiles = 0 // 0 = no limit
    ): array {
        // First get the file tree
        $tree = $this->getRepositoryTree($gitProvider, $repoFullName, $branch, $directory);

        $files = [];
        $skippedLarge = 0;
        $count = 0;

        foreach ($tree as $file) {
            // Only apply limit if maxFiles > 0
            if ($maxFiles > 0 && $count >= $maxFiles) {
                break;
            }

            // Skip very large files (> 1MB) - these would timeout anyway
            if (isset($file['size']) && $file['size'] > 1024 * 1024) {
                $skippedLarge++;
                continue;
            }

            try {
                $content = $this->getFileContent($gitProvider, $repoFullName, $branch, $file['path']);

                // Remove directory prefix if specified (to match generation output structure)
                $relativePath = $file['path'];
                if ($directory !== '' && str_starts_with($relativePath, $directory)) {
                    $relativePath = ltrim(substr($relativePath, strlen($directory)), '/');
                }

                $files[$relativePath] = $content;
                $count++;
            } catch (\Exception $e) {
                // Re-throw rate limit errors so user sees them
                $message = $e->getMessage();
                if (str_contains($message, 'rate limit') || str_contains($message, '403') || str_contains($message, '429')) {
                    throw new \Exception("GitHub/GitLab API Rate Limit erreicht. Bitte warten Sie einige Minuten oder verwenden Sie ein kleineres Repository. (Fehler: {$message})");
                }
                \Log::warning("Failed to fetch file content: {$file['path']}", [
                    'error' => $message,
                ]);
            }
        }

        return [
            'files' => $files,
            'truncated' => $maxFiles > 0 && $count >= $maxFiles,
            'total_in_tree' => count($tree),
            'fetched' => $count,
            'skipped_large' => $skippedLarge,
        ];
    }
}
