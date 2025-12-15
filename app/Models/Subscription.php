<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

/**
 * Unified Subscription Model
 *
 * Replaces: ProjectSubscription, SchemaSubscription, TeamSubscription,
 *           TemplateSubscription, CliSubscription
 *
 * @property int $id
 * @property int $user_id
 * @property string $subscription_type  (project|schema|team|template|cli|service|bundle)
 * @property int|null $entity_id
 * @property bool $is_free_tier
 * @property bool $is_active
 * @property bool $is_soft_locked
 * @property Carbon|null $expires_at
 */
class Subscription extends Model
{
    // Subscription type constants
    public const TYPE_PROJECT = 'project';
    public const TYPE_SCHEMA = 'schema';
    public const TYPE_TEAM = 'team';
    public const TYPE_TEMPLATE = 'template';
    public const TYPE_CLI = 'cli';
    public const TYPE_SERVICE = 'service';
    public const TYPE_BUNDLE = 'bundle';
    public const TYPE_FORM_DESIGNER = 'form_designer';

    // Feature unlock costs (in credits)
    public const FORM_DESIGNER_UNLOCK_COST = 50;

    protected $fillable = [
        'user_id',
        'subscription_type',
        'entity_id',
        'is_free_tier',
        'is_active',
        'is_soft_locked',
        'expires_at',
    ];

    protected $casts = [
        'entity_id' => 'integer',
        'is_free_tier' => 'boolean',
        'is_active' => 'boolean',
        'is_soft_locked' => 'boolean',
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ========================================
    // Relationships
    // ========================================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the related entity based on subscription_type
     */
    public function entity(): ?BelongsTo
    {
        return match ($this->subscription_type) {
            self::TYPE_PROJECT => $this->belongsTo(Project::class, 'entity_id'),
            self::TYPE_SCHEMA => $this->belongsTo(Schema::class, 'entity_id'),
            self::TYPE_TEAM => $this->belongsTo(Team::class, 'entity_id'),
            self::TYPE_TEMPLATE => $this->belongsTo(Template::class, 'entity_id'),
            default => null,
        };
    }

    // Convenience relationships for direct access
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'entity_id');
    }

    public function schema(): BelongsTo
    {
        return $this->belongsTo(Schema::class, 'entity_id');
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'entity_id');
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class, 'entity_id');
    }

    // ========================================
    // Scopes
    // ========================================

    /**
     * Scope to filter by subscription type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('subscription_type', $type);
    }

    /**
     * Scope for project subscriptions
     */
    public function scopeProjects($query)
    {
        return $query->where('subscription_type', self::TYPE_PROJECT);
    }

    /**
     * Scope for schema subscriptions
     */
    public function scopeSchemas($query)
    {
        return $query->where('subscription_type', self::TYPE_SCHEMA);
    }

    /**
     * Scope for team subscriptions
     */
    public function scopeTeams($query)
    {
        return $query->where('subscription_type', self::TYPE_TEAM);
    }

    /**
     * Scope for template subscriptions
     */
    public function scopeTemplates($query)
    {
        return $query->where('subscription_type', self::TYPE_TEMPLATE);
    }

    /**
     * Scope for CLI subscriptions
     */
    public function scopeCli($query)
    {
        return $query->whereIn('subscription_type', [self::TYPE_CLI, self::TYPE_SERVICE, self::TYPE_BUNDLE]);
    }

    /**
     * Scope for Form Designer subscriptions
     */
    public function scopeFormDesigner($query)
    {
        return $query->where('subscription_type', self::TYPE_FORM_DESIGNER);
    }

    /**
     * Scope for active subscriptions
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for non-expired subscriptions
     */
    public function scopeNotExpired($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', now());
        });
    }

    /**
     * Scope for expired subscriptions
     */
    public function scopeExpired($query)
    {
        return $query->whereNotNull('expires_at')
                     ->where('expires_at', '<=', now());
    }

    /**
     * Scope for a specific entity
     */
    public function scopeForEntity($query, string $type, int $entityId)
    {
        return $query->where('subscription_type', $type)
                     ->where('entity_id', $entityId);
    }

    // ========================================
    // Status Methods
    // ========================================

    /**
     * Check if subscription is expired
     */
    public function isExpired(): bool
    {
        if (!$this->expires_at) {
            return false; // No expiration = unlimited (patron monthly)
        }

        return Carbon::now()->isAfter($this->expires_at);
    }

    /**
     * Check if subscription should be soft-locked
     */
    public function shouldBeSoftLocked(): bool
    {
        return $this->isExpired() && $this->is_active;
    }

    /**
     * Check if subscription is valid (active and not expired)
     */
    public function isValid(): bool
    {
        return $this->is_active && !$this->isExpired();
    }

    // ========================================
    // Actions
    // ========================================

    /**
     * Apply soft-lock if expired
     */
    public function checkAndApplySoftLock(): bool
    {
        if ($this->shouldBeSoftLocked() && !$this->is_soft_locked) {
            $this->is_soft_locked = true;
            $this->save();
            return true;
        }

        return false;
    }

    /**
     * Renew subscription for 1 year
     */
    public function renew(): void
    {
        $this->expires_at = Carbon::now()->addYear();
        $this->is_soft_locked = false;
        $this->is_active = true;
        $this->save();
    }

    /**
     * Deactivate subscription
     */
    public function deactivate(): void
    {
        $this->is_active = false;
        $this->save();
    }

    // ========================================
    // Static Helper Methods
    // ========================================

    /**
     * Find or create subscription for an entity
     */
    public static function findOrCreateForEntity(
        int $userId,
        string $type,
        ?int $entityId = null,
        array $attributes = []
    ): self {
        return static::firstOrCreate(
            [
                'user_id' => $userId,
                'subscription_type' => $type,
                'entity_id' => $entityId,
            ],
            array_merge([
                'is_free_tier' => false,
                'is_active' => true,
                'is_soft_locked' => false,
                'expires_at' => null,
            ], $attributes)
        );
    }

    /**
     * Get all active subscriptions for a user by type
     */
    public static function getActiveForUser(int $userId, ?string $type = null)
    {
        $query = static::where('user_id', $userId)
                       ->where('is_active', true)
                       ->notExpired();

        if ($type) {
            $query->where('subscription_type', $type);
        }

        return $query->get();
    }

    /**
     * Check if user has active subscription for an entity
     */
    public static function hasActiveSubscription(int $userId, string $type, ?int $entityId = null): bool
    {
        $query = static::where('user_id', $userId)
                       ->where('subscription_type', $type)
                       ->where('is_active', true)
                       ->notExpired();

        if ($entityId !== null) {
            $query->where('entity_id', $entityId);
        }

        return $query->exists();
    }

    /**
     * Count active subscriptions for a user by type
     */
    public static function countActiveForUser(int $userId, string $type): int
    {
        return static::where('user_id', $userId)
                     ->where('subscription_type', $type)
                     ->where('is_active', true)
                     ->notExpired()
                     ->count();
    }

    // ========================================
    // Form Designer Specific Methods
    // ========================================

    /**
     * Check if user has Form Designer access
     */
    public static function hasFormDesignerAccess(int $userId): bool
    {
        return static::hasActiveSubscription($userId, self::TYPE_FORM_DESIGNER);
    }

    /**
     * Unlock Form Designer with credits (1 year subscription)
     */
    public static function unlockFormDesignerWithCredits(int $userId): ?self
    {
        // Check if user has enough credits
        $user = User::find($userId);
        if (!$user || $user->credits < self::FORM_DESIGNER_UNLOCK_COST) {
            return null;
        }

        // Deduct credits
        $user->decrement('credits', self::FORM_DESIGNER_UNLOCK_COST);

        // Check for existing subscription to extend
        $existing = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_FORM_DESIGNER)
            ->first();

        if ($existing) {
            // Extend existing subscription by 1 year from current expiry or now
            $baseDate = $existing->expires_at && $existing->expires_at->isFuture()
                ? $existing->expires_at
                : Carbon::now();
            $existing->update([
                'is_active' => true,
                'is_soft_locked' => false,
                'expires_at' => $baseDate->copy()->addYear(),
            ]);
            return $existing;
        }

        // Create new subscription (1 year)
        return static::create([
            'user_id' => $userId,
            'subscription_type' => self::TYPE_FORM_DESIGNER,
            'entity_id' => null,
            'is_free_tier' => false,
            'is_active' => true,
            'is_soft_locked' => false,
            'expires_at' => Carbon::now()->addYear(),
        ]);
    }

    /**
     * Unlock Form Designer via Patron subscription
     */
    public static function unlockFormDesignerWithPatron(int $userId): self
    {
        return static::updateOrCreate(
            [
                'user_id' => $userId,
                'subscription_type' => self::TYPE_FORM_DESIGNER,
            ],
            [
                'entity_id' => null,
                'is_free_tier' => true, // Free for Patrons
                'is_active' => true,
                'is_soft_locked' => false,
                'expires_at' => null, // Permanent for Patrons
            ]
        );
    }

    /**
     * Get Form Designer access status for user
     */
    public static function getFormDesignerAccessStatus(int $userId): array
    {
        $subscription = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_FORM_DESIGNER)
            ->first();

        if (!$subscription) {
            return [
                'has_access' => false,
                'access_type' => null,
                'unlock_cost' => self::FORM_DESIGNER_UNLOCK_COST,
            ];
        }

        $daysRemaining = null;
        if ($subscription->expires_at) {
            $daysRemaining = max(0, (int) Carbon::now()->diffInDays($subscription->expires_at, false));
        }

        return [
            'has_access' => $subscription->isValid(),
            'access_type' => $subscription->is_free_tier ? 'patron' : 'credits',
            'patron_level' => $subscription->is_free_tier ? 'monthly' : null,
            'credits_paid' => $subscription->is_free_tier ? 0 : self::FORM_DESIGNER_UNLOCK_COST,
            'granted_at' => $subscription->created_at?->toISOString(),
            'expires_at' => $subscription->expires_at?->toISOString(),
            'days_remaining' => $daysRemaining,
            'is_patron' => $subscription->is_free_tier,
            'is_expired' => $subscription->isExpired(),
            'can_renew' => !$subscription->is_free_tier, // Only credit subscriptions can be renewed
        ];
    }
}
