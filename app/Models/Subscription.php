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
    public const TYPE_GIT_INTEGRATION = 'git_integration';
    public const TYPE_CODE_ADJUSTMENTS = 'code_adjustments';
    public const TYPE_DATABASE_DESIGNER = 'database_designer';
    public const TYPE_SCHEMA_MIGRATION = 'schema_migration';
    public const TYPE_MESSAGE_ATTACHMENTS = 'message_attachments';
    public const TYPE_KANBAN_BOARD = 'kanban_board';

    // Feature unlock costs (in credits)
    public const FORM_DESIGNER_UNLOCK_COST = 50;
    public const KANBAN_BOARD_UNLOCK_COST = 50;
    public const GIT_INTEGRATION_UNLOCK_COST = 50;
    public const CODE_ADJUSTMENTS_UNLOCK_COST = 50;
    public const DATABASE_DESIGNER_UNLOCK_COST = 50;
    public const SCHEMA_MIGRATION_UNLOCK_COST = 50;
    public const MESSAGE_ATTACHMENTS_UNLOCK_COST = 50;
    public const CLI_UNLOCK_COST = 50;           // CLI tool only
    public const SERVICE_UNLOCK_COST = 50;       // Windows Service only
    public const BUNDLE_UNLOCK_COST = 90;        // CLI + Service bundle (saves 10 credits)

    // Notification timing constants (in days)
    public const EXPIRY_WARNING_DAYS = 14;    // First warning: 14 days before expiry
    public const EXPIRY_FINAL_DAYS = 3;       // Final warning: 3 days before expiry
    public const EARLY_RENEWAL_BONUS_DAYS = 31; // Bonus: 1 month for early renewal (within warning period)

    protected $fillable = [
        'user_id',
        'subscription_type',
        'entity_id',
        'is_free_tier',
        'is_active',
        'is_soft_locked',
        'expires_at',
        'expiry_warning_sent_at',
        'expiry_final_sent_at',
        'expired_notification_sent_at',
        'early_renewal_bonus_days',
    ];

    protected $casts = [
        'entity_id' => 'integer',
        'is_free_tier' => 'boolean',
        'is_active' => 'boolean',
        'is_soft_locked' => 'boolean',
        'expires_at' => 'datetime',
        'expiry_warning_sent_at' => 'datetime',
        'expiry_final_sent_at' => 'datetime',
        'expired_notification_sent_at' => 'datetime',
        'early_renewal_bonus_days' => 'integer',
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
        return $this->belongsTo(FloatingSchema::class, 'entity_id');
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
     * Renew subscription for 1 year (simple renewal)
     */
    public function renew(): void
    {
        $this->expires_at = Carbon::now()->addYear();
        $this->is_soft_locked = false;
        $this->is_active = true;
        $this->save();
    }

    /**
     * Renew subscription with early renewal bonus.
     * - Extension is calculated from the current expiry date (not from today)
     * - If renewed within the warning period (before expiry), add bonus days
     *
     * @param bool $applyBonus Whether to apply the early renewal bonus
     * @return array Details about the renewal
     */
    public function renewWithBonus(bool $applyBonus = true): array
    {
        $now = Carbon::now();
        $oldExpiresAt = $this->expires_at;

        // Base date for extension: use current expiry if still in future, otherwise use now
        $baseDate = ($oldExpiresAt && $oldExpiresAt->isFuture())
            ? $oldExpiresAt->copy()
            : $now->copy();

        // Calculate new expiry: base + 1 year
        $newExpiresAt = $baseDate->addYear();

        // Check if eligible for early renewal bonus (renewing before expiry)
        $bonusDays = 0;
        if ($applyBonus && $oldExpiresAt && $oldExpiresAt->isFuture()) {
            $daysUntilExpiry = $now->diffInDays($oldExpiresAt, false);

            // If renewing within the warning period (14 days before expiry), give bonus
            if ($daysUntilExpiry <= self::EXPIRY_WARNING_DAYS && $daysUntilExpiry > 0) {
                $bonusDays = self::EARLY_RENEWAL_BONUS_DAYS;
                $newExpiresAt->addDays($bonusDays);
            }
        }

        // Update subscription
        $this->expires_at = $newExpiresAt;
        $this->is_soft_locked = false;
        $this->is_active = true;
        $this->early_renewal_bonus_days = $bonusDays;

        // Reset notification flags for new cycle
        $this->expiry_warning_sent_at = null;
        $this->expiry_final_sent_at = null;
        $this->expired_notification_sent_at = null;

        $this->save();

        return [
            'old_expires_at' => $oldExpiresAt?->toDateTimeString(),
            'new_expires_at' => $newExpiresAt->toDateTimeString(),
            'bonus_days' => $bonusDays,
            'total_extension_days' => $oldExpiresAt
                ? $oldExpiresAt->diffInDays($newExpiresAt)
                : 365 + $bonusDays,
        ];
    }

    /**
     * Check if subscription is eligible for early renewal bonus
     */
    public function isEligibleForEarlyRenewalBonus(): bool
    {
        if (!$this->expires_at || !$this->expires_at->isFuture()) {
            return false;
        }

        $daysUntilExpiry = Carbon::now()->diffInDays($this->expires_at, false);
        return $daysUntilExpiry <= self::EXPIRY_WARNING_DAYS && $daysUntilExpiry > 0;
    }

    /**
     * Get days until expiry (negative if expired)
     */
    public function getDaysUntilExpiry(): ?int
    {
        if (!$this->expires_at) {
            return null; // No expiry (patron)
        }

        return (int) Carbon::now()->diffInDays($this->expires_at, false);
    }

    /**
     * Deactivate subscription
     */
    public function deactivate(): void
    {
        $this->is_active = false;
        $this->save();
    }

    /**
     * Get human-readable subscription type name
     */
    public function getTypeDisplayName(): string
    {
        return match ($this->subscription_type) {
            self::TYPE_PROJECT => __('subscriptionphp385'),
            self::TYPE_SCHEMA => __('subscriptionphp386'),
            self::TYPE_TEAM => __('subscriptionphp387'),
            self::TYPE_TEMPLATE => __('subscriptionphp388'),
            self::TYPE_CLI => __('subscriptionphp389'),
            self::TYPE_SERVICE => __('subscriptionphp390'),
            self::TYPE_BUNDLE => __('subscriptionphp391'),
            self::TYPE_FORM_DESIGNER => __('subscriptionphp392'),
            self::TYPE_GIT_INTEGRATION => __('subscriptionphp393'),
            self::TYPE_CODE_ADJUSTMENTS => __('subscriptionphp394'),
            self::TYPE_DATABASE_DESIGNER => __('subscriptionphp395'),
            self::TYPE_SCHEMA_MIGRATION => __('subscriptionphp396'),
            self::TYPE_MESSAGE_ATTACHMENTS => __('subscriptionphp397'),
            self::TYPE_KANBAN_BOARD => __('subscriptionphp398'),
            default => ucfirst($this->subscription_type),
        };
    }

    /**
     * Get the entity name if applicable
     */
    public function getEntityName(): ?string
    {
        if (!$this->entity_id) {
            return null;
        }

        return match ($this->subscription_type) {
            self::TYPE_PROJECT => $this->project?->name,
            self::TYPE_SCHEMA => $this->schema?->name,
            self::TYPE_TEAM => $this->team?->name,
            self::TYPE_TEMPLATE => $this->template?->name,
            default => null,
        };
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
        // System/Admin users always have access
        $user = User::find($userId);
        if ($user && $user->isAdmin()) {
            return true;
        }

        // Patrons always have access
        if ($user && $user->isPatron()) {
            return true;
        }

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
        $user = User::find($userId);
        $userCredits = $user ? $user->credits : 0;

        // System/Admin users always have access
        if ($user && $user->isAdmin()) {
            return [
                'has_access' => true,
                'access_type' => 'system',
                'is_system' => true,
                'is_patron' => false,
                'is_expired' => false,
                'can_renew' => false,
                'user_credits' => $userCredits,
            ];
        }

        // Patrons always have access
        if ($user && $user->isPatron()) {
            return [
                'has_access' => true,
                'access_type' => 'patron',
                'patron_level' => $user->patron_type,
                'is_patron' => true,
                'is_expired' => false,
                'can_renew' => false,
                'user_credits' => $userCredits,
            ];
        }

        $subscription = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_FORM_DESIGNER)
            ->first();

        if (!$subscription) {
            return [
                'has_access' => false,
                'access_type' => null,
                'unlock_cost' => self::FORM_DESIGNER_UNLOCK_COST,
                'user_credits' => $userCredits,
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
            'user_credits' => $userCredits,
        ];
    }

    // ========================================
    // Git Integration Specific Methods
    // ========================================

    /**
     * Scope for Git Integration subscriptions
     */
    public function scopeGitIntegration($query)
    {
        return $query->where('subscription_type', self::TYPE_GIT_INTEGRATION);
    }

    /**
     * Check if user has Git Integration access
     */
    public static function hasGitIntegrationAccess(int $userId): bool
    {
        return static::hasActiveSubscription($userId, self::TYPE_GIT_INTEGRATION);
    }

    /**
     * Unlock Git Integration with credits (1 year subscription)
     */
    public static function unlockGitIntegrationWithCredits(int $userId): ?self
    {
        // Check if user has enough credits
        $user = User::find($userId);
        if (!$user || $user->credits < self::GIT_INTEGRATION_UNLOCK_COST) {
            return null;
        }

        // Deduct credits
        $user->decrement('credits', self::GIT_INTEGRATION_UNLOCK_COST);

        // Check for existing subscription to extend
        $existing = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_GIT_INTEGRATION)
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
            'subscription_type' => self::TYPE_GIT_INTEGRATION,
            'entity_id' => null,
            'is_free_tier' => false,
            'is_active' => true,
            'is_soft_locked' => false,
            'expires_at' => Carbon::now()->addYear(),
        ]);
    }

    /**
     * Unlock Git Integration via Patron subscription
     */
    public static function unlockGitIntegrationWithPatron(int $userId): self
    {
        return static::updateOrCreate(
            [
                'user_id' => $userId,
                'subscription_type' => self::TYPE_GIT_INTEGRATION,
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
     * Get Git Integration access status for user
     */
    public static function getGitIntegrationAccessStatus(int $userId): array
    {
        $subscription = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_GIT_INTEGRATION)
            ->first();

        if (!$subscription) {
            return [
                'has_access' => false,
                'access_type' => null,
                'unlock_cost' => self::GIT_INTEGRATION_UNLOCK_COST,
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
            'credits_paid' => $subscription->is_free_tier ? 0 : self::GIT_INTEGRATION_UNLOCK_COST,
            'granted_at' => $subscription->created_at?->toISOString(),
            'expires_at' => $subscription->expires_at?->toISOString(),
            'days_remaining' => $daysRemaining,
            'is_patron' => $subscription->is_free_tier,
            'is_expired' => $subscription->isExpired(),
            'can_renew' => !$subscription->is_free_tier,
        ];
    }

    // ========================================
    // Code Adjustments Specific Methods
    // ========================================

    /**
     * Scope for Code Adjustments subscriptions
     */
    public function scopeCodeAdjustments($query)
    {
        return $query->where('subscription_type', self::TYPE_CODE_ADJUSTMENTS);
    }

    /**
     * Check if user has Code Adjustments access
     */
    public static function hasCodeAdjustmentsAccess(int $userId): bool
    {
        // System/Admin users always have access
        $user = User::find($userId);
        if ($user && $user->isAdmin()) {
            return true;
        }

        // Patrons always have access
        if ($user && $user->isPatron()) {
            return true;
        }

        return static::hasActiveSubscription($userId, self::TYPE_CODE_ADJUSTMENTS);
    }

    /**
     * Unlock Code Adjustments with credits (1 year subscription)
     */
    public static function unlockCodeAdjustmentsWithCredits(int $userId): ?self
    {
        // Check if user has enough credits
        $user = User::find($userId);
        if (!$user || $user->credits < self::CODE_ADJUSTMENTS_UNLOCK_COST) {
            return null;
        }

        // Deduct credits
        $user->decrement('credits', self::CODE_ADJUSTMENTS_UNLOCK_COST);

        // Check for existing subscription to extend
        $existing = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_CODE_ADJUSTMENTS)
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
            'subscription_type' => self::TYPE_CODE_ADJUSTMENTS,
            'entity_id' => null,
            'is_free_tier' => false,
            'is_active' => true,
            'is_soft_locked' => false,
            'expires_at' => Carbon::now()->addYear(),
        ]);
    }

    /**
     * Unlock Code Adjustments via Patron subscription
     */
    public static function unlockCodeAdjustmentsWithPatron(int $userId): self
    {
        return static::updateOrCreate(
            [
                'user_id' => $userId,
                'subscription_type' => self::TYPE_CODE_ADJUSTMENTS,
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
     * Get Code Adjustments access status for user
     */
    public static function getCodeAdjustmentsAccessStatus(int $userId): array
    {
        $user = User::find($userId);
        $userCredits = $user ? $user->credits : 0;

        // System/Admin users always have access
        if ($user && $user->isAdmin()) {
            return [
                'has_access' => true,
                'access_type' => 'system',
                'is_system' => true,
                'is_patron' => false,
                'is_expired' => false,
                'can_renew' => false,
                'user_credits' => $userCredits,
            ];
        }

        // Patrons always have access
        if ($user && $user->isPatron()) {
            return [
                'has_access' => true,
                'access_type' => 'patron',
                'patron_level' => $user->patron_type,
                'is_patron' => true,
                'is_expired' => false,
                'can_renew' => false,
                'user_credits' => $userCredits,
            ];
        }

        $subscription = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_CODE_ADJUSTMENTS)
            ->first();

        if (!$subscription) {
            return [
                'has_access' => false,
                'access_type' => null,
                'unlock_cost' => self::CODE_ADJUSTMENTS_UNLOCK_COST,
                'user_credits' => $userCredits,
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
            'credits_paid' => $subscription->is_free_tier ? 0 : self::CODE_ADJUSTMENTS_UNLOCK_COST,
            'granted_at' => $subscription->created_at?->toISOString(),
            'expires_at' => $subscription->expires_at?->toISOString(),
            'days_remaining' => $daysRemaining,
            'is_patron' => $subscription->is_free_tier,
            'is_expired' => $subscription->isExpired(),
            'can_renew' => !$subscription->is_free_tier,
            'user_credits' => $userCredits,
        ];
    }

    // ========================================
    // Database Designer Specific Methods
    // ========================================

    /**
     * Scope for Database Designer subscriptions
     */
    public function scopeDatabaseDesigner($query)
    {
        return $query->where('subscription_type', self::TYPE_DATABASE_DESIGNER);
    }

    /**
     * Check if user has Database Designer access
     */
    public static function hasDatabaseDesignerAccess(int $userId): bool
    {
        // System/Admin users always have access
        $user = User::find($userId);
        if ($user && $user->isAdmin()) {
            return true;
        }

        // Patrons always have access
        if ($user && $user->isPatron()) {
            return true;
        }

        return static::hasActiveSubscription($userId, self::TYPE_DATABASE_DESIGNER);
    }

    /**
     * Unlock Database Designer with credits (1 year subscription)
     */
    public static function unlockDatabaseDesignerWithCredits(int $userId): ?self
    {
        // Check if user has enough credits
        $user = User::find($userId);
        if (!$user || $user->credits < self::DATABASE_DESIGNER_UNLOCK_COST) {
            return null;
        }

        // Deduct credits
        $user->decrement('credits', self::DATABASE_DESIGNER_UNLOCK_COST);

        // Check for existing subscription to extend
        $existing = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_DATABASE_DESIGNER)
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
            'subscription_type' => self::TYPE_DATABASE_DESIGNER,
            'entity_id' => null,
            'is_free_tier' => false,
            'is_active' => true,
            'is_soft_locked' => false,
            'expires_at' => Carbon::now()->addYear(),
        ]);
    }

    /**
     * Unlock Database Designer via Patron subscription
     */
    public static function unlockDatabaseDesignerWithPatron(int $userId): self
    {
        return static::updateOrCreate(
            [
                'user_id' => $userId,
                'subscription_type' => self::TYPE_DATABASE_DESIGNER,
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
     * Get Database Designer access status for user
     */
    public static function getDatabaseDesignerAccessStatus(int $userId): array
    {
        $user = User::find($userId);
        $userCredits = $user ? $user->credits : 0;

        // System/Admin users always have access
        if ($user && $user->isAdmin()) {
            return [
                'has_access' => true,
                'access_type' => 'system',
                'is_system' => true,
                'is_patron' => false,
                'is_expired' => false,
                'can_renew' => false,
                'user_credits' => $userCredits,
            ];
        }

        // Patrons always have access
        if ($user && $user->isPatron()) {
            return [
                'has_access' => true,
                'access_type' => 'patron',
                'patron_level' => $user->patron_type,
                'is_patron' => true,
                'is_expired' => false,
                'can_renew' => false,
                'user_credits' => $userCredits,
            ];
        }

        $subscription = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_DATABASE_DESIGNER)
            ->first();

        if (!$subscription) {
            return [
                'has_access' => false,
                'access_type' => null,
                'unlock_cost' => self::DATABASE_DESIGNER_UNLOCK_COST,
                'user_credits' => $userCredits,
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
            'credits_paid' => $subscription->is_free_tier ? 0 : self::DATABASE_DESIGNER_UNLOCK_COST,
            'granted_at' => $subscription->created_at?->toISOString(),
            'expires_at' => $subscription->expires_at?->toISOString(),
            'days_remaining' => $daysRemaining,
            'is_patron' => $subscription->is_free_tier,
            'is_expired' => $subscription->isExpired(),
            'can_renew' => !$subscription->is_free_tier,
            'user_credits' => $userCredits,
        ];
    }

    // ========================================
    // Schema Migration Specific Methods
    // ========================================

    /**
     * Scope for Schema Migration subscriptions
     */
    public function scopeSchemaMigration($query)
    {
        return $query->where('subscription_type', self::TYPE_SCHEMA_MIGRATION);
    }

    /**
     * Check if user has Schema Migration access
     */
    public static function hasSchemaMigrationAccess(int $userId): bool
    {
        // System/Admin users always have access
        $user = User::find($userId);
        if ($user && $user->isAdmin()) {
            return true;
        }

        // Patrons always have access
        if ($user && $user->isPatron()) {
            return true;
        }

        return static::hasActiveSubscription($userId, self::TYPE_SCHEMA_MIGRATION);
    }

    /**
     * Unlock Schema Migration with credits (1 year subscription)
     */
    public static function unlockSchemaMigrationWithCredits(int $userId): ?self
    {
        // Check if user has enough credits
        $user = User::find($userId);
        if (!$user || $user->credits < self::SCHEMA_MIGRATION_UNLOCK_COST) {
            return null;
        }

        // Deduct credits
        $user->decrement('credits', self::SCHEMA_MIGRATION_UNLOCK_COST);

        // Check for existing subscription to extend
        $existing = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_SCHEMA_MIGRATION)
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
            'subscription_type' => self::TYPE_SCHEMA_MIGRATION,
            'entity_id' => null,
            'is_free_tier' => false,
            'is_active' => true,
            'is_soft_locked' => false,
            'expires_at' => Carbon::now()->addYear(),
        ]);
    }

    /**
     * Unlock Schema Migration via Patron subscription
     */
    public static function unlockSchemaMigrationWithPatron(int $userId): self
    {
        return static::updateOrCreate(
            [
                'user_id' => $userId,
                'subscription_type' => self::TYPE_SCHEMA_MIGRATION,
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
     * Get Schema Migration access status for user
     */
    public static function getSchemaMigrationAccessStatus(int $userId): array
    {
        $user = User::find($userId);
        $userCredits = $user ? $user->credits : 0;

        // System/Admin users always have access
        if ($user && $user->isAdmin()) {
            return [
                'has_access' => true,
                'access_type' => 'system',
                'is_system' => true,
                'is_patron' => false,
                'is_expired' => false,
                'can_renew' => false,
                'user_credits' => $userCredits,
            ];
        }

        // Patrons always have access
        if ($user && $user->isPatron()) {
            return [
                'has_access' => true,
                'access_type' => 'patron',
                'patron_level' => $user->patron_type,
                'is_patron' => true,
                'is_expired' => false,
                'can_renew' => false,
                'user_credits' => $userCredits,
            ];
        }

        $subscription = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_SCHEMA_MIGRATION)
            ->first();

        if (!$subscription) {
            return [
                'has_access' => false,
                'access_type' => null,
                'unlock_cost' => self::SCHEMA_MIGRATION_UNLOCK_COST,
                'user_credits' => $userCredits,
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
            'credits_paid' => $subscription->is_free_tier ? 0 : self::SCHEMA_MIGRATION_UNLOCK_COST,
            'granted_at' => $subscription->created_at?->toISOString(),
            'expires_at' => $subscription->expires_at?->toISOString(),
            'days_remaining' => $daysRemaining,
            'is_patron' => $subscription->is_free_tier,
            'is_expired' => $subscription->isExpired(),
            'can_renew' => !$subscription->is_free_tier,
            'user_credits' => $userCredits,
        ];
    }

    // ========================================
    // Message Attachments Specific Methods
    // ========================================

    /**
     * Scope for Message Attachments subscriptions
     */
    public function scopeMessageAttachments($query)
    {
        return $query->where('subscription_type', self::TYPE_MESSAGE_ATTACHMENTS);
    }

    /**
     * Check if user has Message Attachments access
     */
    public static function hasMessageAttachmentsAccess(int $userId): bool
    {
        return static::hasActiveSubscription($userId, self::TYPE_MESSAGE_ATTACHMENTS);
    }

    /**
     * Unlock Message Attachments with credits (1 year subscription)
     */
    public static function unlockMessageAttachmentsWithCredits(int $userId): ?self
    {
        // Check if user has enough credits
        $user = User::find($userId);
        if (!$user || $user->credits < self::MESSAGE_ATTACHMENTS_UNLOCK_COST) {
            return null;
        }

        // Deduct credits
        $user->decrement('credits', self::MESSAGE_ATTACHMENTS_UNLOCK_COST);

        // Check for existing subscription to extend
        $existing = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_MESSAGE_ATTACHMENTS)
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
            'subscription_type' => self::TYPE_MESSAGE_ATTACHMENTS,
            'entity_id' => null,
            'is_free_tier' => false,
            'is_active' => true,
            'is_soft_locked' => false,
            'expires_at' => Carbon::now()->addYear(),
        ]);
    }

    /**
     * Unlock Message Attachments via Patron subscription
     */
    public static function unlockMessageAttachmentsWithPatron(int $userId): self
    {
        return static::updateOrCreate(
            [
                'user_id' => $userId,
                'subscription_type' => self::TYPE_MESSAGE_ATTACHMENTS,
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
     * Get Message Attachments access status for user
     */
    public static function getMessageAttachmentsAccessStatus(int $userId): array
    {
        $user = \App\Models\User::find($userId);
        $userCredits = $user ? $user->credits : 0;

        $subscription = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_MESSAGE_ATTACHMENTS)
            ->first();

        if (!$subscription) {
            return [
                'has_access' => false,
                'access_type' => null,
                'unlock_cost' => self::MESSAGE_ATTACHMENTS_UNLOCK_COST,
                'user_credits' => $userCredits,
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
            'credits_paid' => $subscription->is_free_tier ? 0 : self::MESSAGE_ATTACHMENTS_UNLOCK_COST,
            'granted_at' => $subscription->created_at?->toISOString(),
            'expires_at' => $subscription->expires_at?->toISOString(),
            'days_remaining' => $daysRemaining,
            'is_patron' => $subscription->is_free_tier,
            'is_expired' => $subscription->isExpired(),
            'can_renew' => !$subscription->is_free_tier,
            'user_credits' => $userCredits,
        ];
    }

    // ========================================
    // Kanban Board Specific Methods
    // ========================================

    /**
     * Scope for Kanban Board subscriptions
     */
    public function scopeKanbanBoard($query)
    {
        return $query->where('subscription_type', self::TYPE_KANBAN_BOARD);
    }

    /**
     * Check if user has Kanban Board access
     */
    public static function hasKanbanBoardAccess(int $userId): bool
    {
        // System/Admin users always have access
        $user = User::find($userId);
        if ($user && $user->isAdmin()) {
            return true;
        }

        // Patrons always have access
        if ($user && $user->isPatron()) {
            return true;
        }

        return static::hasActiveSubscription($userId, self::TYPE_KANBAN_BOARD);
    }

    /**
     * Unlock Kanban Board with credits (1 year subscription)
     */
    public static function unlockKanbanBoardWithCredits(int $userId): ?self
    {
        // Check if user has enough credits
        $user = User::find($userId);
        if (!$user || $user->credits < self::KANBAN_BOARD_UNLOCK_COST) {
            return null;
        }

        // Deduct credits
        $user->decrement('credits', self::KANBAN_BOARD_UNLOCK_COST);

        // Check for existing subscription to extend
        $existing = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_KANBAN_BOARD)
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
            'subscription_type' => self::TYPE_KANBAN_BOARD,
            'entity_id' => null,
            'is_free_tier' => false,
            'is_active' => true,
            'is_soft_locked' => false,
            'expires_at' => Carbon::now()->addYear(),
        ]);
    }

    /**
     * Unlock Kanban Board via Patron subscription
     */
    public static function unlockKanbanBoardWithPatron(int $userId): self
    {
        return static::updateOrCreate(
            [
                'user_id' => $userId,
                'subscription_type' => self::TYPE_KANBAN_BOARD,
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
     * Get Kanban Board access status for user
     */
    public static function getKanbanBoardAccessStatus(int $userId): array
    {
        $user = User::find($userId);
        $userCredits = $user ? $user->credits : 0;

        // System/Admin users always have access
        if ($user && $user->isAdmin()) {
            return [
                'has_access' => true,
                'access_type' => 'system',
                'is_system' => true,
                'is_patron' => false,
                'is_expired' => false,
                'can_renew' => false,
                'user_credits' => $userCredits,
            ];
        }

        // Patrons always have access
        if ($user && $user->isPatron()) {
            return [
                'has_access' => true,
                'access_type' => 'patron',
                'patron_level' => $user->patron_type,
                'is_patron' => true,
                'is_expired' => false,
                'can_renew' => false,
                'user_credits' => $userCredits,
            ];
        }

        $subscription = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_KANBAN_BOARD)
            ->first();

        if (!$subscription) {
            return [
                'has_access' => false,
                'access_type' => null,
                'unlock_cost' => self::KANBAN_BOARD_UNLOCK_COST,
                'user_credits' => $userCredits,
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
            'credits_paid' => $subscription->is_free_tier ? 0 : self::KANBAN_BOARD_UNLOCK_COST,
            'granted_at' => $subscription->created_at?->toISOString(),
            'expires_at' => $subscription->expires_at?->toISOString(),
            'days_remaining' => $daysRemaining,
            'is_patron' => $subscription->is_free_tier,
            'is_expired' => $subscription->isExpired(),
            'can_renew' => !$subscription->is_free_tier,
            'user_credits' => $userCredits,
        ];
    }

    // ========================================
    // CLI / Service / Bundle Specific Methods
    // ========================================

    /**
     * Check if user has CLI access
     */
    public static function hasCliAccess(int $userId): bool
    {
        // System/Admin users always have access
        $user = User::find($userId);
        if ($user && $user->isAdmin()) {
            return true;
        }

        // Patrons always have access
        if ($user && $user->isPatron()) {
            return true;
        }

        // Check for CLI or Bundle subscription
        return static::where('user_id', $userId)
            ->whereIn('subscription_type', [self::TYPE_CLI, self::TYPE_BUNDLE])
            ->where('is_active', true)
            ->notExpired()
            ->exists();
    }

    /**
     * Check if user has Service access
     */
    public static function hasServiceAccess(int $userId): bool
    {
        // System/Admin users always have access
        $user = User::find($userId);
        if ($user && $user->isAdmin()) {
            return true;
        }

        // Patrons always have access
        if ($user && $user->isPatron()) {
            return true;
        }

        // Check for Service or Bundle subscription
        return static::where('user_id', $userId)
            ->whereIn('subscription_type', [self::TYPE_SERVICE, self::TYPE_BUNDLE])
            ->where('is_active', true)
            ->notExpired()
            ->exists();
    }

    /**
     * Check if user has Bundle access (both CLI and Service)
     */
    public static function hasBundleAccess(int $userId): bool
    {
        return static::hasCliAccess($userId) && static::hasServiceAccess($userId);
    }

    /**
     * Unlock CLI with credits (1 year subscription)
     */
    public static function unlockCliWithCredits(int $userId): ?self
    {
        $user = User::find($userId);
        if (!$user || $user->credits < self::CLI_UNLOCK_COST) {
            return null;
        }

        // Check if user already has bundle - don't downgrade
        if (static::hasActiveSubscription($userId, self::TYPE_BUNDLE)) {
            return static::where('user_id', $userId)
                ->where('subscription_type', self::TYPE_BUNDLE)
                ->first();
        }

        // Deduct credits
        $user->decrement('credits', self::CLI_UNLOCK_COST);

        // Log credit transaction
        CreditTransaction::create([
            'user_id' => $userId,
            'amount' => -self::CLI_UNLOCK_COST,
            'type' => 'cli_unlock',
            'description' => 'CLI Tool unlock (1 year)',
            'reference_type' => 'subscription',
            'reference_id' => null,
        ]);

        // Check for existing subscription to extend
        $existing = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_CLI)
            ->first();

        if ($existing) {
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

        return static::create([
            'user_id' => $userId,
            'subscription_type' => self::TYPE_CLI,
            'entity_id' => null,
            'is_free_tier' => false,
            'is_active' => true,
            'is_soft_locked' => false,
            'expires_at' => Carbon::now()->addYear(),
        ]);
    }

    /**
     * Unlock Service with credits (1 year subscription)
     */
    public static function unlockServiceWithCredits(int $userId): ?self
    {
        $user = User::find($userId);
        if (!$user || $user->credits < self::SERVICE_UNLOCK_COST) {
            return null;
        }

        // Check if user already has bundle - don't downgrade
        if (static::hasActiveSubscription($userId, self::TYPE_BUNDLE)) {
            return static::where('user_id', $userId)
                ->where('subscription_type', self::TYPE_BUNDLE)
                ->first();
        }

        // Deduct credits
        $user->decrement('credits', self::SERVICE_UNLOCK_COST);

        // Log credit transaction
        CreditTransaction::create([
            'user_id' => $userId,
            'amount' => -self::SERVICE_UNLOCK_COST,
            'type' => 'service_unlock',
            'description' => 'Windows Service unlock (1 year)',
            'reference_type' => 'subscription',
            'reference_id' => null,
        ]);

        // Check for existing subscription to extend
        $existing = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_SERVICE)
            ->first();

        if ($existing) {
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

        return static::create([
            'user_id' => $userId,
            'subscription_type' => self::TYPE_SERVICE,
            'entity_id' => null,
            'is_free_tier' => false,
            'is_active' => true,
            'is_soft_locked' => false,
            'expires_at' => Carbon::now()->addYear(),
        ]);
    }

    /**
     * Unlock Bundle (CLI + Service) with credits (1 year subscription)
     */
    public static function unlockBundleWithCredits(int $userId): ?self
    {
        $user = User::find($userId);
        if (!$user || $user->credits < self::BUNDLE_UNLOCK_COST) {
            return null;
        }

        // Deduct credits
        $user->decrement('credits', self::BUNDLE_UNLOCK_COST);

        // Log credit transaction
        CreditTransaction::create([
            'user_id' => $userId,
            'amount' => -self::BUNDLE_UNLOCK_COST,
            'type' => 'bundle_unlock',
            'description' => 'CLI + Service Bundle unlock (1 year)',
            'reference_type' => 'subscription',
            'reference_id' => null,
        ]);

        // Deactivate any existing CLI or Service only subscriptions
        static::where('user_id', $userId)
            ->whereIn('subscription_type', [self::TYPE_CLI, self::TYPE_SERVICE])
            ->update(['is_active' => false]);

        // Check for existing bundle subscription to extend
        $existing = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_BUNDLE)
            ->first();

        if ($existing) {
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

        return static::create([
            'user_id' => $userId,
            'subscription_type' => self::TYPE_BUNDLE,
            'entity_id' => null,
            'is_free_tier' => false,
            'is_active' => true,
            'is_soft_locked' => false,
            'expires_at' => Carbon::now()->addYear(),
        ]);
    }

    /**
     * Unlock CLI/Service via Patron subscription
     */
    public static function unlockCliServiceWithPatron(int $userId): self
    {
        // Patrons get the bundle for free
        return static::updateOrCreate(
            [
                'user_id' => $userId,
                'subscription_type' => self::TYPE_BUNDLE,
            ],
            [
                'entity_id' => null,
                'is_free_tier' => true,
                'is_active' => true,
                'is_soft_locked' => false,
                'expires_at' => null, // Permanent for Patrons
            ]
        );
    }

    /**
     * Get CLI access status for user
     */
    public static function getCliAccessStatus(int $userId): array
    {
        $user = User::find($userId);
        $userCredits = $user ? $user->credits : 0;

        // System/Admin users always have access
        if ($user && $user->isAdmin()) {
            return [
                'has_cli_access' => true,
                'has_service_access' => true,
                'access_type' => 'system',
                'is_system' => true,
                'is_patron' => false,
                'is_expired' => false,
                'can_renew' => false,
                'user_credits' => $userCredits,
                'cli_cost' => self::CLI_UNLOCK_COST,
                'service_cost' => self::SERVICE_UNLOCK_COST,
                'bundle_cost' => self::BUNDLE_UNLOCK_COST,
            ];
        }

        // Patrons always have access
        if ($user && $user->isPatron()) {
            return [
                'has_cli_access' => true,
                'has_service_access' => true,
                'access_type' => 'patron',
                'patron_level' => $user->patron_type,
                'is_patron' => true,
                'is_expired' => false,
                'can_renew' => false,
                'user_credits' => $userCredits,
                'cli_cost' => self::CLI_UNLOCK_COST,
                'service_cost' => self::SERVICE_UNLOCK_COST,
                'bundle_cost' => self::BUNDLE_UNLOCK_COST,
            ];
        }

        // Check for bundle subscription first
        $bundleSub = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_BUNDLE)
            ->first();

        if ($bundleSub && $bundleSub->isValid()) {
            $daysRemaining = $bundleSub->getDaysUntilExpiry();
            return [
                'has_cli_access' => true,
                'has_service_access' => true,
                'access_type' => 'bundle',
                'subscription_type' => 'bundle',
                'granted_at' => $bundleSub->created_at?->toISOString(),
                'expires_at' => $bundleSub->expires_at?->toISOString(),
                'days_remaining' => $daysRemaining,
                'is_patron' => false,
                'is_expired' => false,
                'can_renew' => true,
                'user_credits' => $userCredits,
                'cli_cost' => self::CLI_UNLOCK_COST,
                'service_cost' => self::SERVICE_UNLOCK_COST,
                'bundle_cost' => self::BUNDLE_UNLOCK_COST,
            ];
        }

        // Check for individual subscriptions
        $cliSub = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_CLI)
            ->where('is_active', true)
            ->first();

        $serviceSub = static::where('user_id', $userId)
            ->where('subscription_type', self::TYPE_SERVICE)
            ->where('is_active', true)
            ->first();

        $hasCliAccess = $cliSub && $cliSub->isValid();
        $hasServiceAccess = $serviceSub && $serviceSub->isValid();

        // Determine what they still need
        $needsCli = !$hasCliAccess;
        $needsService = !$hasServiceAccess;

        // Calculate best upgrade option
        $upgradeOption = null;
        $upgradeCost = null;
        if ($needsCli && $needsService) {
            $upgradeOption = 'bundle';
            $upgradeCost = self::BUNDLE_UNLOCK_COST;
        } elseif ($needsCli) {
            $upgradeOption = 'cli';
            $upgradeCost = self::CLI_UNLOCK_COST;
        } elseif ($needsService) {
            $upgradeOption = 'service';
            $upgradeCost = self::SERVICE_UNLOCK_COST;
        }

        return [
            'has_cli_access' => $hasCliAccess,
            'has_service_access' => $hasServiceAccess,
            'cli_subscription' => $cliSub ? [
                'expires_at' => $cliSub->expires_at?->toISOString(),
                'days_remaining' => $cliSub->getDaysUntilExpiry(),
                'is_expired' => $cliSub->isExpired(),
            ] : null,
            'service_subscription' => $serviceSub ? [
                'expires_at' => $serviceSub->expires_at?->toISOString(),
                'days_remaining' => $serviceSub->getDaysUntilExpiry(),
                'is_expired' => $serviceSub->isExpired(),
            ] : null,
            'access_type' => ($hasCliAccess || $hasServiceAccess) ? 'credits' : null,
            'is_patron' => false,
            'upgrade_option' => $upgradeOption,
            'upgrade_cost' => $upgradeCost,
            'user_credits' => $userCredits,
            'cli_cost' => self::CLI_UNLOCK_COST,
            'service_cost' => self::SERVICE_UNLOCK_COST,
            'bundle_cost' => self::BUNDLE_UNLOCK_COST,
        ];
    }
}
