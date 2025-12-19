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
            'scope' => 'api read_user read_repository write_repository',
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

        $response = Http::post("{$baseUrl}/oauth/token", [
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
        $response = Http::withToken($accessToken)->get("{$baseUrl}/api/v4/user");

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

        // GitLab uses a different approach - commits API with actions
        $actions = [];
        foreach ($files as $path => $content) {
            $actions[] = [
                'action' => 'create',
                'file_path' => $path,
                'content' => $content,
            ];
        }

        // Check if branch exists
        $branchCheck = Http::withToken($gitProvider->access_token)
            ->get("{$baseUrl}/api/v4/projects/{$encodedPath}/repository/branches/{$branch}");

        $startBranch = $branchCheck->successful() ? $branch : $baseBranch;

        $response = Http::withToken($gitProvider->access_token)
            ->post("{$baseUrl}/api/v4/projects/{$encodedPath}/repository/commits", [
                'branch' => $branch,
                'commit_message' => $commitMessage,
                'actions' => $actions,
                'start_branch' => $startBranch,
            ]);

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

        $response = Http::withToken($gitProvider->access_token)
            ->put("{$baseUrl}/api/v4/projects/{$encodedPath}/merge_requests/{$mrIid}/merge", [
                'should_remove_source_branch' => $deleteBranch,
            ]);

        if ($response->failed()) {
            $error = $response->json();
            throw new \Exception($error['message'] ?? 'Failed to merge merge request');
        }

        return [
            'merged' => true,
            'sha' => $response->json()['merge_commit_sha'] ?? null,
        ];
    }
}
