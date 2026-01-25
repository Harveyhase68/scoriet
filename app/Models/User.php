<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    // use HasFactory, Notifiable;
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'theme', // User's preferred theme (dark, light, green, auto)
        'password',
        'username', // GitHub-style unique username
        'user_type',
        'is_active', // Account active status (false = deactivated due to inactivity)
        'language', // User's preferred language
        'kanban_initials', // 2-3 letter initials for Kanban boards
        'kanban_color', // Hex color for Kanban avatar
        'credits',
        'patron_type',
        'pending_project_invitation_id',
        'last_monthly_credits_at',
        'last_login_at', // Last successful login timestamp
        'inactivity_warning_1_sent_at', // First inactivity warning (90 days)
        'inactivity_warning_2_sent_at', // Second inactivity warning (105 days)
        'inactivity_warning_final_sent_at', // Final inactivity warning (117 days)
        'stripe_customer_id',
        'stripe_subscription_id',
        'paypal_subscription_id',
        // Seller fields
        'is_seller',
        'company_name',
        'company_address',
        'company_country',
        'vat_id',
        'business_registration',
        'tax_id',
        'seller_type',
        'payout_method',
        'paypal_payout_email',
        'bank_iban',
        'bank_bic',
        'bank_account_holder',
        'seller_verified',
        'seller_verified_at',
        'pending_earnings',
        'total_earnings',
        // Email notification preferences
        'email_system_notifications',
        'email_user_notifications',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'credits' => 'integer',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
            'inactivity_warning_1_sent_at' => 'datetime',
            'inactivity_warning_2_sent_at' => 'datetime',
            'inactivity_warning_final_sent_at' => 'datetime',
            'is_seller' => 'boolean',
            'seller_verified' => 'boolean',
            'seller_verified_at' => 'datetime',
            'pending_earnings' => 'decimal:2',
            'total_earnings' => 'decimal:2',
            'email_system_notifications' => 'boolean',
            'email_user_notifications' => 'boolean',
        ];
    }

    // Team relationships
    public function ownedTeams(): HasMany
    {
        return $this->hasMany(Team::class, 'project_owner_id');
    }

    public function teamMemberships(): HasMany
    {
        return $this->hasMany(TeamMember::class);
    }

    public function teamInvitations(): HasMany
    {
        return $this->hasMany(TeamInvitation::class, 'invited_by');
    }

    public function receivedInvitations()
    {
        return TeamInvitation::where('invited_user_id', $this->username ?? $this->name)
                            ->where('status', 'pending');
    }

    public function teams()
    {
        return $this->belongsToMany(Team::class, 'team_members', 'user_id', 'team_id')
                    ->withPivot('role', 'joined_at')
                    ->withTimestamps();
    }

    public function isTeamOwner(Team $team): bool
    {
        return (string)$team->project_owner_id === (string)$this->id;
    }

    public function getTeamRole(Team $team): ?string
    {
        return $team->getUserRole($this);
    }

    // Projects owned by this user
    public function projects(): HasMany
    {
        return $this->hasMany(Project::class, 'owner_id');
    }

    // Project applications relationship
    public function projectApplications(): HasMany
    {
        return $this->hasMany(ProjectApplication::class);
    }

    // Project memberships relationship
    public function projectMemberships(): HasMany
    {
        return $this->hasMany(ProjectMember::class);
    }

    // Project invitations received
    public function projectInvitations(): HasMany
    {
        return $this->hasMany(ProjectInvitation::class, 'invited_user_id');
    }

    // Project invitations sent by this user
    public function sentProjectInvitations(): HasMany
    {
        return $this->hasMany(ProjectInvitation::class, 'invited_by');
    }

    // Get all projects this user is a member of (not owner)
    public function memberProjects()
    {
        return $this->belongsToMany(Project::class, 'project_members', 'user_id', 'project_id')
                   ->withPivot(['role', 'joined_at', 'invited_by'])
                   ->withTimestamps();
    }

    // Check if user is a member of a specific project
    public function isMemberOf(Project $project): bool
    {
        return $this->projectMemberships()->where('project_id', $project->id)->exists();
    }

    // Get user's role in a specific project
    public function getProjectRole(Project $project): ?string
    {
        $membership = $this->projectMemberships()->where('project_id', $project->id)->first();
        return $membership ? $membership->role : null;
    }

    // Check if user can manage a specific project
    public function canManageProject(Project $project): bool
    {
        // Project owner can always manage
        if ((string)$project->owner_id === (string)$this->id) {
            return true;
        }

        // Project admin members can manage
        $membership = $this->projectMemberships()->where('project_id', $project->id)->first();
        return $membership && $membership->isAdmin();
    }

    // Patron user methods
    public function isPatron(): bool
    {
        return $this->user_type === 'patron';
    }

    public function isPatronMonthly(): bool
    {
        return $this->user_type === 'patron' && $this->patron_type === 'monthly';
    }

    public function isPatronAnnual(): bool
    {
        return $this->user_type === 'patron' && $this->patron_type === 'annual';
    }

    /**
     * Find user for Passport authentication - supports both email and username
     * This method is called by Laravel Passport during authentication
     */
    public function findForPassport($username)
    {
        // Since our CustomTokenController already converts username to email,
        // this method should just find by email
        return static::where('email', $username)->first();
    }

    public function isAdmin(): bool
    {
        return $this->user_type === 'admin' || $this->user_type === 'system';
    }

    /**
     * All users can create private projects now.
     * The only restriction is the number of projects (1 free, then 50 credits each).
     * @deprecated This method always returns true now - kept for backward compatibility
     */
    public function canCreatePrivateProjects(): bool
    {
        return true;
    }

    public function canCreatePrivateSchemas(): bool
    {
        return $this->isPatron() || $this->isAdmin() || $this->user_type === 'system';
    }

    public function hasCredits(int $amount): bool
    {
        return $this->credits >= $amount;
    }

    /**
     * Check if user has Git Integration access (subscription or patron)
     */
    public function hasGitIntegrationAccess(): bool
    {
        // Patrons always have access
        if ($this->isPatron()) {
            return true;
        }

        // Check for active subscription
        return Subscription::hasGitIntegrationAccess($this->id);
    }

    /**
     * Get Git Integration access status
     */
    public function getGitIntegrationAccessStatus(): array
    {
        // Patrons always have access
        if ($this->isPatron()) {
            return [
                'has_access' => true,
                'access_type' => 'patron',
                'patron_level' => $this->patron_type,
                'is_patron' => true,
                'is_expired' => false,
                'can_renew' => false,
            ];
        }

        return Subscription::getGitIntegrationAccessStatus($this->id);
    }

    /**
     * Check if user has Code Adjustments access (subscription or patron)
     */
    public function hasCodeAdjustmentsAccess(): bool
    {
        // Patrons always have access
        if ($this->isPatron()) {
            return true;
        }

        // Check for active subscription
        return Subscription::hasCodeAdjustmentsAccess($this->id);
    }

    /**
     * Get Code Adjustments access status
     */
    public function getCodeAdjustmentsAccessStatus(): array
    {
        // Patrons always have access
        if ($this->isPatron()) {
            return [
                'has_access' => true,
                'access_type' => 'patron',
                'patron_level' => $this->patron_type,
                'is_patron' => true,
                'is_expired' => false,
                'can_renew' => false,
            ];
        }

        return Subscription::getCodeAdjustmentsAccessStatus($this->id);
    }

    /**
     * Check if user has Database Designer access (subscription or patron)
     */
    public function hasDatabaseDesignerAccess(): bool
    {
        // Patrons always have access
        if ($this->isPatron()) {
            return true;
        }

        // Check for active subscription
        return Subscription::hasDatabaseDesignerAccess($this->id);
    }

    /**
     * Get Database Designer access status
     */
    public function getDatabaseDesignerAccessStatus(): array
    {
        // Patrons always have access
        if ($this->isPatron()) {
            return [
                'has_access' => true,
                'access_type' => 'patron',
                'patron_level' => $this->patron_type,
                'is_patron' => true,
                'is_expired' => false,
                'can_renew' => false,
            ];
        }

        return Subscription::getDatabaseDesignerAccessStatus($this->id);
    }

    /**
     * Check if user has Schema Migration access (subscription or patron)
     */
    public function hasSchemaMigrationAccess(): bool
    {
        // Patrons always have access
        if ($this->isPatron()) {
            return true;
        }

        // Check for active subscription
        return Subscription::hasSchemaMigrationAccess($this->id);
    }

    /**
     * Get Schema Migration access status
     */
    public function getSchemaMigrationAccessStatus(): array
    {
        // Patrons always have access
        if ($this->isPatron()) {
            return [
                'has_access' => true,
                'access_type' => 'patron',
                'patron_level' => $this->patron_type,
                'is_patron' => true,
                'is_expired' => false,
                'can_renew' => false,
            ];
        }

        return Subscription::getSchemaMigrationAccessStatus($this->id);
    }

    /**
     * Check if user has Message Attachments access (subscription or patron or system/admin)
     */
    public function hasMessageAttachmentsAccess(): bool
    {
        // System/Admin users always have access
        if ($this->isAdmin()) {
            return true;
        }

        // Patrons always have access
        if ($this->isPatron()) {
            return true;
        }

        // Check for active subscription
        return Subscription::hasMessageAttachmentsAccess($this->id);
    }

    /**
     * Get Message Attachments access status
     */
    public function getMessageAttachmentsAccessStatus(): array
    {
        // System/Admin users always have access
        if ($this->isAdmin()) {
            return [
                'has_access' => true,
                'access_type' => 'system',
                'is_system' => true,
                'is_patron' => false,
                'is_expired' => false,
                'can_renew' => false,
                'user_credits' => $this->credits,
            ];
        }

        // Patrons always have access
        if ($this->isPatron()) {
            return [
                'has_access' => true,
                'access_type' => 'patron',
                'patron_level' => $this->patron_type,
                'is_patron' => true,
                'is_expired' => false,
                'can_renew' => false,
                'user_credits' => $this->credits,
            ];
        }

        return Subscription::getMessageAttachmentsAccessStatus($this->id);
    }

    public function deductCredits(int $amount): bool
    {
        if (!$this->hasCredits($amount)) {
            return false;
        }

        $this->credits -= $amount;
        $this->save();

        return true;
    }

    public function addCredits(int $amount): void
    {
        $this->credits += $amount;
        $this->save();
    }

    /**
     * Claim monthly credits (50 credits) if eligible
     * Only once per month, on login
     *
     * @return bool True if credits were claimed, false if not eligible
     */
    public function claimMonthlyCredits(): bool
    {
        // Check if user has already claimed this month
        if ($this->last_monthly_credits_at) {
            $lastClaim = \Carbon\Carbon::parse($this->last_monthly_credits_at);
            $now = \Carbon\Carbon::now();

            // If less than 30 days since last claim, not eligible yet
            if ($lastClaim->diffInDays($now) < 30) {
                return false;
            }
        }

        // Give 50 credits
        $this->credits += 50;
        $this->last_monthly_credits_at = now();
        $this->save();

        // Log the transaction
        CreditTransaction::create([
            'user_id' => $this->id,
            'amount' => 50,
            'type' => 'initial_credits', // We use this type for monthly bonuses too
            'description' => 'Monthly login bonus: 50 credits',
            'reference_type' => null,
            'reference_id' => null,
            'price_paid' => null
        ]);

        return true;
    }

    // Credit system relationships
    public function creditTransactions(): HasMany
    {
        return $this->hasMany(CreditTransaction::class);
    }

    /**
     * Get all subscriptions for this user
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Get project subscriptions (using unified table)
     */
    public function projectSubscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class)->where('subscription_type', Subscription::TYPE_PROJECT);
    }

    /**
     * Get schema subscriptions (using unified table)
     */
    public function schemaSubscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class)->where('subscription_type', Subscription::TYPE_SCHEMA);
    }

    /**
     * Get team subscriptions (using unified table)
     */
    public function teamSubscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class)->where('subscription_type', Subscription::TYPE_TEAM);
    }

    /**
     * Get template subscriptions (using unified table)
     */
    public function templateSubscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class)->where('subscription_type', Subscription::TYPE_TEMPLATE);
    }

    /**
     * Get CLI subscriptions (using unified table)
     */
    public function cliSubscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class)->whereIn('subscription_type', [
            Subscription::TYPE_CLI,
            Subscription::TYPE_SERVICE,
            Subscription::TYPE_BUNDLE,
        ]);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    /**
     * Get all Git provider connections for this user
     */
    public function gitProviders(): HasMany
    {
        return $this->hasMany(UserGitProvider::class);
    }

    /**
     * Get a specific Git provider connection
     */
    public function getGitProvider(string $provider): ?UserGitProvider
    {
        return $this->gitProviders()->where('provider', $provider)->first();
    }

    /**
     * Get the pending project invitation for this user
     */
    public function pendingProjectInvitation()
    {
        return $this->belongsTo(ProjectInvitation::class, 'pending_project_invitation_id');
    }

    /**
     * Check if user has a pending project invitation
     */
    public function hasPendingInvitation(): bool
    {
        return $this->pending_project_invitation_id !== null;
    }

    /**
     * Clear the pending project invitation
     */
    public function clearPendingInvitation(): void
    {
        $this->update(['pending_project_invitation_id' => null]);
    }

    // ==================== SELLER METHODS ====================

    /**
     * Get payouts for this user (as seller)
     */
    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class);
    }

    /**
     * Get template purchases where this user is the seller
     */
    public function templateSales(): HasMany
    {
        return $this->hasMany(TemplatePurchase::class, 'seller_user_id');
    }

    /**
     * Check if user can sell templates (has complete seller profile)
     */
    public function canSellTemplates(): bool
    {
        // Must have seller enabled
        if (!$this->is_seller) {
            return false;
        }

        // Must have company info
        if (empty($this->company_name) || empty($this->company_country)) {
            return false;
        }

        // Must have payout method configured
        if (empty($this->payout_method)) {
            return false;
        }

        // Must have payout destination
        if ($this->payout_method === 'paypal' && empty($this->paypal_payout_email)) {
            return false;
        }

        if ($this->payout_method === 'bank_transfer' && (empty($this->bank_iban) || empty($this->bank_account_holder))) {
            return false;
        }

        return true;
    }

    /**
     * Get missing seller profile fields
     */
    public function getMissingSellerFields(): array
    {
        $missing = [];

        if (!$this->is_seller) {
            $missing[] = 'is_seller';
        }
        if (empty($this->company_name)) {
            $missing[] = 'company_name';
        }
        if (empty($this->company_country)) {
            $missing[] = 'company_country';
        }
        if (empty($this->payout_method)) {
            $missing[] = 'payout_method';
        }
        if ($this->payout_method === 'paypal' && empty($this->paypal_payout_email)) {
            $missing[] = 'paypal_payout_email';
        }
        if ($this->payout_method === 'bank_transfer') {
            if (empty($this->bank_iban)) {
                $missing[] = 'bank_iban';
            }
            if (empty($this->bank_account_holder)) {
                $missing[] = 'bank_account_holder';
            }
        }

        return $missing;
    }

    /**
     * Determine seller type based on country and VAT ID
     */
    public function determineSellrType(): string
    {
        $country = strtoupper($this->company_country ?? '');

        // Austria
        if ($country === 'AT') {
            return Payout::SELLER_AT_BUSINESS;
        }

        // EU countries (simplified list)
        $euCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'PL', 'SE', 'DK', 'FI', 'IE', 'PT', 'GR', 'CZ', 'RO', 'HU', 'SK', 'BG', 'HR', 'SI', 'LT', 'LV', 'EE', 'CY', 'LU', 'MT'];

        if (in_array($country, $euCountries)) {
            // EU with VAT ID = reverse charge
            if (!empty($this->vat_id)) {
                return Payout::SELLER_EU_VAT;
            }
            // EU without VAT ID = private/small business
            return Payout::SELLER_EU_PRIVATE;
        }

        // Non-EU
        if (!empty($this->business_registration) || !empty($this->tax_id)) {
            return Payout::SELLER_NON_EU_BUSINESS;
        }

        return Payout::SELLER_NON_EU_PRIVATE;
    }

    /**
     * Update seller type based on current profile
     */
    public function updateSellerType(): void
    {
        $this->update(['seller_type' => $this->determineSellrType()]);
    }

    /**
     * Get unpaid sales for this seller
     */
    public function getUnpaidSales()
    {
        return $this->templateSales()
            ->where('is_paid_out', false)
            ->with(['template:id,name', 'buyer:id,username,name'])
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Get total unpaid earnings
     */
    public function getUnpaidEarnings(): float
    {
        return (float) $this->templateSales()
            ->where('is_paid_out', false)
            ->sum('seller_earnings');
    }

    /**
     * Check if user is from EU
     */
    public function isEuSeller(): bool
    {
        $euCountries = ['AT', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'PL', 'SE', 'DK', 'FI', 'IE', 'PT', 'GR', 'CZ', 'RO', 'HU', 'SK', 'BG', 'HR', 'SI', 'LT', 'LV', 'EE', 'CY', 'LU', 'MT'];
        return in_array(strtoupper($this->company_country ?? ''), $euCountries);
    }

    // ==================== INACTIVITY TRACKING ====================

    /**
     * Record successful login and reset inactivity warnings
     * Call this on every successful login
     */
    public function recordLogin(): void
    {
        $this->update([
            'last_login_at' => now(),
            'inactivity_warning_1_sent_at' => null,
            'inactivity_warning_2_sent_at' => null,
            'inactivity_warning_final_sent_at' => null,
        ]);
    }

    /**
     * Get days since last login
     * Returns null if never logged in
     */
    public function getDaysSinceLastLogin(): ?int
    {
        if (!$this->last_login_at) {
            return null;
        }
        return (int) $this->last_login_at->diffInDays(now());
    }

    /**
     * Check if user is subject to inactivity deactivation
     * Only free users can be deactivated - patrons are exempt
     */
    public function isSubjectToInactivityDeactivation(): bool
    {
        return !$this->isPatron() && $this->user_type !== 'admin' && $this->user_type !== 'system';
    }

    /**
     * Check if user account is deactivated due to inactivity
     */
    public function isDeactivated(): bool
    {
        return !$this->is_active;
    }

    /**
     * Reactivate a deactivated user account
     * Also records login and clears warnings
     */
    public function reactivate(): void
    {
        $this->update([
            'is_active' => true,
            'last_login_at' => now(),
            'inactivity_warning_1_sent_at' => null,
            'inactivity_warning_2_sent_at' => null,
            'inactivity_warning_final_sent_at' => null,
        ]);
    }

    /**
     * Deactivate user due to inactivity
     */
    public function deactivateDueToInactivity(): void
    {
        $this->update(['is_active' => false]);
    }

    // ==================== ATTACHMENT STORAGE ====================

    /**
     * Storage limits in bytes
     */
    const STORAGE_LIMIT_FREE = 209715200;      // 200 MB
    const STORAGE_LIMIT_PREMIUM = 2147483648;  // 2 GB
    const STORAGE_LIMIT_UNLIMITED = PHP_INT_MAX;

    /**
     * Get the user's attachment storage limit in bytes
     */
    public function getAttachmentStorageLimit(): int
    {
        // Admin/System users have unlimited storage
        if ($this->isAdmin()) {
            return self::STORAGE_LIMIT_UNLIMITED;
        }

        // Check for premium monthly subscription (message_attachments with active subscription)
        $hasMonthlyPremium = Subscription::where('user_id', $this->id)
            ->where('subscription_type', Subscription::TYPE_MESSAGE_ATTACHMENTS)
            ->where(function ($query) {
                $query->whereNull('expires_at')  // Permanent (e.g., Patron)
                      ->orWhere('expires_at', '>', now());  // Or not expired
            })
            ->exists();

        if ($hasMonthlyPremium) {
            return self::STORAGE_LIMIT_PREMIUM; // 2 GB
        }

        // Patron yearly and free users with unlocked attachments: 200 MB
        return self::STORAGE_LIMIT_FREE;
    }

    /**
     * Get the user's current attachment storage usage in bytes
     */
    public function getAttachmentStorageUsed(): int
    {
        return (int) MessageAttachment::whereHas('message', function ($query) {
            $query->where('sender_id', $this->id);
        })->sum('size');
    }

    /**
     * Get storage usage as percentage (0-100)
     */
    public function getAttachmentStoragePercentage(): float
    {
        $limit = $this->getAttachmentStorageLimit();
        if ($limit === self::STORAGE_LIMIT_UNLIMITED) {
            return 0;
        }

        $used = $this->getAttachmentStorageUsed();
        return min(100, round(($used / $limit) * 100, 1));
    }

    /**
     * Get remaining storage space in bytes
     */
    public function getAttachmentStorageRemaining(): int
    {
        $limit = $this->getAttachmentStorageLimit();
        if ($limit === self::STORAGE_LIMIT_UNLIMITED) {
            return self::STORAGE_LIMIT_UNLIMITED;
        }

        $used = $this->getAttachmentStorageUsed();
        return max(0, $limit - $used);
    }

    /**
     * Check if user has enough storage space for a file
     */
    public function hasEnoughStorageFor(int $fileSize): bool
    {
        return $this->getAttachmentStorageRemaining() >= $fileSize;
    }

    /**
     * Format bytes to human readable string
     */
    public static function formatBytes(int $bytes): string
    {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        }
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        }
        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        }
        return $bytes . ' Bytes';
    }

    /**
     * Get complete storage status for API/UI
     */
    public function getAttachmentStorageStatus(): array
    {
        $limit = $this->getAttachmentStorageLimit();
        $used = $this->getAttachmentStorageUsed();
        $isUnlimited = $limit === self::STORAGE_LIMIT_UNLIMITED;

        return [
            'used' => $used,
            'used_formatted' => self::formatBytes($used),
            'limit' => $limit,
            'limit_formatted' => $isUnlimited ? 'Unbegrenzt' : self::formatBytes($limit),
            'remaining' => $isUnlimited ? self::STORAGE_LIMIT_UNLIMITED : max(0, $limit - $used),
            'remaining_formatted' => $isUnlimited ? 'Unbegrenzt' : self::formatBytes(max(0, $limit - $used)),
            'percentage' => $isUnlimited ? 0 : min(100, round(($used / $limit) * 100, 1)),
            'is_unlimited' => $isUnlimited,
            'is_full' => !$isUnlimited && $used >= $limit,
            'is_warning' => !$isUnlimited && ($used / $limit) >= 0.8, // 80% warning threshold
        ];
    }

    // ==================== KANBAN INITIALS ====================

    /**
     * Default colors for auto-generated avatars
     */
    const KANBAN_COLORS = [
        '#3b82f6', // Blue
        '#8b5cf6', // Purple
        '#06b6d4', // Cyan
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#ef4444', // Red
        '#ec4899', // Pink
        '#6366f1', // Indigo
        '#84cc16', // Lime
        '#14b8a6', // Teal
    ];

    /**
     * Get user's Kanban initials (custom or auto-generated)
     */
    public function getKanbanInitials(): string
    {
        // Return custom initials if set
        if (!empty($this->kanban_initials)) {
            return strtoupper($this->kanban_initials);
        }

        // Auto-generate from username or name
        $source = $this->username ?: $this->name ?: 'U';

        // If username has underscore or dot, use first letters of each part
        if (preg_match('/[._]/', $source)) {
            $parts = preg_split('/[._]/', $source);
            $initials = '';
            foreach ($parts as $part) {
                if (!empty($part)) {
                    $initials .= strtoupper($part[0]);
                }
                if (strlen($initials) >= 2) break;
            }
            return $initials ?: strtoupper(substr($source, 0, 2));
        }

        // Otherwise just take first 2 characters
        return strtoupper(substr($source, 0, 2));
    }

    /**
     * Get user's Kanban avatar color (custom or auto-generated based on ID)
     */
    public function getKanbanColor(): string
    {
        // Return custom color if set
        if (!empty($this->kanban_color)) {
            return $this->kanban_color;
        }

        // Auto-generate based on user ID for consistency
        $colorIndex = $this->id % count(self::KANBAN_COLORS);
        return self::KANBAN_COLORS[$colorIndex];
    }

    /**
     * Get complete Kanban display info
     */
    public function getKanbanDisplayInfo(): array
    {
        return [
            'initials' => $this->getKanbanInitials(),
            'color' => $this->getKanbanColor(),
            'has_custom_initials' => !empty($this->kanban_initials),
            'has_custom_color' => !empty($this->kanban_color),
        ];
    }
}
