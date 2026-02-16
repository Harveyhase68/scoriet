<?php

namespace App\Services;

use App\Models\Template;
use App\Models\TemplateFile;
use App\Models\TemplateFingerprint;
use App\Models\TemplatePurchase;

class TemplateFingerprintService
{
    /**
     * Minimum content length to consider a file significant.
     */
    public const MIN_CONTENT_LENGTH = 100;

    /**
     * Similarity threshold for plagiarism detection (0-1).
     */
    public const SIMILARITY_THRESHOLD = 0.70;

    /**
     * Generate fingerprints for all files in a template.
     */
    public static function generateFingerprints(Template $template): int
    {
        $files = $template->files()->get();
        $count = 0;

        foreach ($files as $file) {
            $fingerprint = self::createFingerprint($template, $file);
            if ($fingerprint) {
                $count++;
            }
        }

        // Mark template as fingerprinted
        $template->update([
            'fingerprints_generated' => true,
            'fingerprints_generated_at' => now(),
        ]);

        return $count;
    }

    /**
     * Create a fingerprint for a single file.
     */
    public static function createFingerprint(Template $template, TemplateFile $file): ?TemplateFingerprint
    {
        $content = $file->file_content ?? '';

        // Skip empty or trivial files
        if (strlen($content) < self::MIN_CONTENT_LENGTH) {
            return null;
        }

        // Normalize content
        $normalized = self::normalizeContent($content);

        // Skip if normalized content is too short
        if (strlen($normalized) < self::MIN_CONTENT_LENGTH) {
            return null;
        }

        // Generate hash
        $hash = hash('sha256', $normalized);

        // Extract tokens
        $tokens = self::extractTokens($normalized);

        // Determine file type
        $fileType = self::detectFileType($file->file_name, $content);

        // Create or update fingerprint
        return TemplateFingerprint::updateOrCreate(
            [
                'template_id' => $template->id,
                'template_file_id' => $file->id,
            ],
            [
                'file_hash' => $hash,
                'normalized_content' => $normalized,
                'content_length' => strlen($normalized),
                'token_signature' => $tokens,
                'file_type' => $fileType,
                'is_significant' => true,
            ]
        );
    }

    /**
     * Normalize content by removing whitespace, comments, and formatting.
     */
    public static function normalizeContent(string $content): string
    {
        // Remove comments (single-line and multi-line)
        $content = preg_replace('/\/\/.*$/m', '', $content); // // comments
        $content = preg_replace('/\/\*.*?\*\//s', '', $content); // /* */ comments
        $content = preg_replace('/#.*$/m', '', $content); // # comments (Python, Shell)
        $content = preg_replace('/<!--.*?-->/s', '', $content); // HTML comments

        // Remove strings (to avoid false positives on translated text)
        // Keep placeholders like {variable} but remove actual string content
        $content = preg_replace('/"[^"]*"/', '""', $content);
        $content = preg_replace("/\'[^\']*\'/", "''", $content);

        // Remove all whitespace
        $content = preg_replace('/\s+/', '', $content);

        // Convert to lowercase
        $content = strtolower($content);

        return $content;
    }

    /**
     * Extract significant tokens/patterns from content.
     */
    public static function extractTokens(string $normalized): array
    {
        $tokens = [];

        // Extract function/method names
        preg_match_all('/function(\w+)/', $normalized, $functions);
        if (!empty($functions[1])) {
            $tokens['functions'] = array_unique($functions[1]);
        }

        // Extract class names
        preg_match_all('/class(\w+)/', $normalized, $classes);
        if (!empty($classes[1])) {
            $tokens['classes'] = array_unique($classes[1]);
        }

        // Extract variable patterns (common patterns)
        preg_match_all('/\$(\w+)/', $normalized, $variables);
        if (!empty($variables[1])) {
            $tokens['variables'] = array_slice(array_unique($variables[1]), 0, 20);
        }

        // Extract React component names
        preg_match_all('/const(\w+)=/', $normalized, $components);
        if (!empty($components[1])) {
            $tokens['components'] = array_unique($components[1]);
        }

        return $tokens;
    }

    /**
     * Detect file type from filename and content.
     */
    public static function detectFileType(string $filename, string $content): string
    {
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        $typeMap = [
            'php' => 'php',
            'js' => 'javascript',
            'jsx' => 'javascript',
            'ts' => 'typescript',
            'tsx' => 'typescript',
            'vue' => 'vue',
            'html' => 'html',
            'css' => 'css',
            'scss' => 'css',
            'sass' => 'css',
            'json' => 'json',
            'xml' => 'xml',
            'py' => 'python',
            'java' => 'java',
            'cs' => 'csharp',
            'go' => 'go',
            'rb' => 'ruby',
            'swift' => 'swift',
            'kt' => 'kotlin',
        ];

        return $typeMap[$extension] ?? 'unknown';
    }

    /**
     * Check a template for plagiarism against user's purchased templates.
     *
     * @param Template $template The template being submitted to store
     * @param int $userId The user submitting the template
     * @return array ['is_plagiarism' => bool, 'matches' => array, 'highest_similarity' => float]
     */
    public static function checkForPlagiarism(Template $template, int $userId): array
    {
        $result = [
            'is_plagiarism' => false,
            'matches' => [],
            'highest_similarity' => 0.0,
            'checked_templates' => 0,
        ];

        // Get all templates the user has purchased
        $purchasedTemplateIds = TemplatePurchase::where('buyer_user_id', $userId)
            ->pluck('template_id')
            ->toArray();

        if (empty($purchasedTemplateIds)) {
            return $result; // User hasn't purchased any templates
        }

        $result['checked_templates'] = count($purchasedTemplateIds);

        // Generate fingerprints for the new template if not already done
        if (!$template->fingerprints_generated) {
            self::generateFingerprints($template);
        }

        // Get fingerprints of the new template
        $newFingerprints = TemplateFingerprint::where('template_id', $template->id)
            ->where('is_significant', true)
            ->get();

        if ($newFingerprints->isEmpty()) {
            return $result; // No significant files to check
        }

        // Check against each purchased template
        foreach ($purchasedTemplateIds as $purchasedTemplateId) {
            // Get fingerprints of purchased template
            $purchasedFingerprints = TemplateFingerprint::where('template_id', $purchasedTemplateId)
                ->where('is_significant', true)
                ->get();

            if ($purchasedFingerprints->isEmpty()) {
                continue;
            }

            // Compare fingerprints
            foreach ($newFingerprints as $newFp) {
                foreach ($purchasedFingerprints as $purchasedFp) {
                    // Quick hash comparison first
                    if ($newFp->file_hash === $purchasedFp->file_hash) {
                        // Exact match!
                        $result['matches'][] = [
                            'new_file_id' => $newFp->template_file_id,
                            'purchased_template_id' => $purchasedTemplateId,
                            'purchased_file_id' => $purchasedFp->template_file_id,
                            'similarity' => 1.0,
                            'match_type' => 'exact',
                        ];
                        $result['highest_similarity'] = 1.0;
                        $result['is_plagiarism'] = true;
                        continue;
                    }

                    // Only do expensive Levenshtein check if same file type
                    if ($newFp->file_type !== $purchasedFp->file_type) {
                        continue;
                    }

                    // Only check if content lengths are within 50% of each other
                    $lengthRatio = min($newFp->content_length, $purchasedFp->content_length) /
                                   max($newFp->content_length, $purchasedFp->content_length);
                    if ($lengthRatio < 0.5) {
                        continue;
                    }

                    // Levenshtein similarity check
                    $similarity = self::calculateSimilarity(
                        $newFp->normalized_content,
                        $purchasedFp->normalized_content
                    );

                    if ($similarity >= self::SIMILARITY_THRESHOLD) {
                        $result['matches'][] = [
                            'new_file_id' => $newFp->template_file_id,
                            'purchased_template_id' => $purchasedTemplateId,
                            'purchased_file_id' => $purchasedFp->template_file_id,
                            'similarity' => $similarity,
                            'match_type' => 'similar',
                        ];

                        if ($similarity > $result['highest_similarity']) {
                            $result['highest_similarity'] = $similarity;
                        }

                        if ($similarity >= self::SIMILARITY_THRESHOLD) {
                            $result['is_plagiarism'] = true;
                        }
                    }
                }
            }
        }

        return $result;
    }

    /**
     * Calculate similarity between two normalized strings.
     * Uses a combination of approaches for efficiency.
     */
    public static function calculateSimilarity(string $a, string $b): float
    {
        // For very long strings, use sampling
        if (strlen($a) > 5000 || strlen($b) > 5000) {
            return self::calculateSampledSimilarity($a, $b);
        }

        // For shorter strings, use similar_text (faster than levenshtein for medium strings)
        $maxLen = max(strlen($a), strlen($b));
        if ($maxLen === 0) {
            return 1.0;
        }

        similar_text($a, $b, $percent);
        return $percent / 100;
    }

    /**
     * Calculate similarity using sampling for long strings.
     */
    private static function calculateSampledSimilarity(string $a, string $b): float
    {
        $sampleSize = 500;
        $numSamples = 5;
        $similarities = [];

        $lenA = strlen($a);
        $lenB = strlen($b);

        for ($i = 0; $i < $numSamples; $i++) {
            // Take samples from different positions
            $posA = (int)(($lenA - $sampleSize) * ($i / ($numSamples - 1)));
            $posB = (int)(($lenB - $sampleSize) * ($i / ($numSamples - 1)));

            $sampleA = substr($a, max(0, $posA), $sampleSize);
            $sampleB = substr($b, max(0, $posB), $sampleSize);

            similar_text($sampleA, $sampleB, $percent);
            $similarities[] = $percent / 100;
        }

        return array_sum($similarities) / count($similarities);
    }

    /**
     * Delete all fingerprints for a template.
     */
    public static function deleteFingerprints(Template $template): void
    {
        TemplateFingerprint::where('template_id', $template->id)->delete();

        $template->update([
            'fingerprints_generated' => false,
            'fingerprints_generated_at' => null,
        ]);
    }

    /**
     * Regenerate fingerprints for a template (e.g., after files changed).
     */
    public static function regenerateFingerprints(Template $template): int
    {
        self::deleteFingerprints($template);
        return self::generateFingerprints($template);
    }
}
