<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class UserGitProvider extends Model
{
    protected $fillable = [
        'user_id',
        'provider',
        'provider_user_id',
        'username',
        'email',
        'avatar_url',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'scopes',
        'connected_at',
    ];

    protected $casts = [
        'token_expires_at' => 'datetime',
        'connected_at' => 'datetime',
    ];

    protected $hidden = [
        'access_token',
        'refresh_token',
    ];

    /**
     * Get the user that owns this git provider connection.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Set the access token (encrypted).
     */
    public function setAccessTokenAttribute(string $value): void
    {
        $this->attributes['access_token'] = Crypt::encryptString($value);
    }

    /**
     * Get the access token (decrypted).
     */
    public function getAccessTokenAttribute(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Set the refresh token (encrypted).
     */
    public function setRefreshTokenAttribute(?string $value): void
    {
        $this->attributes['refresh_token'] = $value ? Crypt::encryptString($value) : null;
    }

    /**
     * Get the refresh token (decrypted).
     */
    public function getRefreshTokenAttribute(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Check if the token is expired.
     */
    public function isTokenExpired(): bool
    {
        if ($this->token_expires_at === null) {
            return false; // No expiration = never expires (e.g., GitHub PAT)
        }
        return $this->token_expires_at->isPast();
    }

    /**
     * Get provider display name.
     */
    public function getProviderDisplayName(): string
    {
        return match ($this->provider) {
            'github' => 'GitHub',
            'gitlab' => 'GitLab',
            'bitbucket' => 'Bitbucket',
            default => ucfirst($this->provider),
        };
    }

    /**
     * Get provider icon class (for PrimeReact icons).
     */
    public function getProviderIcon(): string
    {
        return match ($this->provider) {
            'github' => 'pi pi-github',
            'gitlab' => 'pi pi-gitlab',
            'bitbucket' => 'pi pi-bitbucket',
            default => 'pi pi-code',
        };
    }
}
