<?php

namespace App\Services;

use App\Models\User;
use App\Models\CreditTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CreditService
{
    /**
     * Cost per code generation in credits
     */
    public const GENERATION_COST = 5;

    /**
     * Check if user can generate code (has credits or is patron monthly)
     *
     * @param User $user
     * @return array ['can_generate' => bool, 'reason' => string|null]
     */
    public static function canGenerate(User $user): array
    {
        // Patron Monthly users have unlimited generations
        if ($user->isPatronMonthly()) {
            return [
                'can_generate' => true,
                'reason' => null,
                'is_free' => true,
            ];
        }

        // Admin/System users have unlimited generations
        if ($user->isAdmin() || $user->user_type === 'system') {
            return [
                'can_generate' => true,
                'reason' => null,
                'is_free' => true,
            ];
        }

        // Check if user has enough credits
        if ($user->credits >= self::GENERATION_COST) {
            return [
                'can_generate' => true,
                'reason' => null,
                'is_free' => false,
            ];
        }

        return [
            'can_generate' => false,
            'reason' => 'Nicht genug Credits. Sie benötigen ' . self::GENERATION_COST . ' Credits für eine Generierung. Aktuell: ' . $user->credits . ' Credits.',
            'is_free' => false,
        ];
    }

    /**
     * Charge credits for a code generation
     *
     * @param User $user
     * @param int|null $projectId
     * @param int|null $templateId
     * @param string $source 'web', 'cli', 'service'
     * @return array ['success' => bool, 'message' => string, 'credits_charged' => int]
     */
    public static function chargeForGeneration(
        User $user,
        ?int $projectId = null,
        ?int $templateId = null,
        string $source = 'web'
    ): array {
        $canGenerate = self::canGenerate($user);

        if (!$canGenerate['can_generate']) {
            return [
                'success' => false,
                'message' => $canGenerate['reason'],
                'credits_charged' => 0,
            ];
        }

        // Free for Patron Monthly/Admin
        if ($canGenerate['is_free']) {
            Log::info("Generation free for user {$user->id} (patron/admin)", [
                'user_id' => $user->id,
                'source' => $source,
                'project_id' => $projectId,
                'template_id' => $templateId,
            ]);

            return [
                'success' => true,
                'message' => 'Generation free (Patron/Admin)',
                'credits_charged' => 0,
            ];
        }

        // Deduct credits
        try {
            DB::transaction(function () use ($user, $projectId, $templateId, $source) {
                // Refresh user to get latest credit balance
                $user->refresh();

                // Double-check credits (race condition protection)
                if ($user->credits < self::GENERATION_COST) {
                    throw new \Exception('Nicht genug Credits');
                }

                // Deduct credits
                $user->decrement('credits', self::GENERATION_COST);

                // Log transaction
                CreditTransaction::create([
                    'user_id' => $user->id,
                    'amount' => -self::GENERATION_COST,
                    'type' => 'generation',
                    'description' => "Code generation ({$source})" .
                        ($projectId ? " - Project #{$projectId}" : '') .
                        ($templateId ? " - Template #{$templateId}" : ''),
                    'reference_type' => 'generation',
                    'reference_id' => $projectId ?? $templateId ?? null,
                ]);
            });

            Log::info("Credits charged for generation", [
                'user_id' => $user->id,
                'credits_charged' => self::GENERATION_COST,
                'credits_remaining' => $user->fresh()->credits,
                'source' => $source,
                'project_id' => $projectId,
                'template_id' => $templateId,
            ]);

            return [
                'success' => true,
                'message' => self::GENERATION_COST . ' Credits abgezogen',
                'credits_charged' => self::GENERATION_COST,
            ];

        } catch (\Exception $e) {
            Log::error("Failed to charge credits for generation", [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
                'credits_charged' => 0,
            ];
        }
    }

    /**
     * Get the generation cost
     */
    public static function getGenerationCost(): int
    {
        return self::GENERATION_COST;
    }

    /**
     * Check how many generations a user can afford
     */
    public static function getAvailableGenerations(User $user): int
    {
        if ($user->isPatronMonthly() || $user->isAdmin() || $user->user_type === 'system') {
            return PHP_INT_MAX; // Unlimited
        }

        return (int) floor($user->credits / self::GENERATION_COST);
    }
}
