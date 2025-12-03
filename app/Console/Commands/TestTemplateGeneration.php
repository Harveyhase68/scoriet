<?php

namespace App\Console\Commands;

use App\Models\Project;
use App\Models\Template;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class TestTemplateGeneration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'template:test-generate
                            {--project=1 : Project ID}
                            {--template=1 : Template ID}
                            {--table= : Table name (optional)}
                            {--language= : Language code (optional)}
                            {--times=2 : Number of times to run (for cache testing)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test template generation and measure cache performance';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $projectId = $this->option('project');
        $templateId = $this->option('template');
        $tableName = $this->option('table');
        $languageCode = $this->option('language');
        $times = (int) $this->option('times');

        // Validate project and template exist
        $project = Project::find($projectId);
        if (!$project) {
            $this->error("❌ Project {$projectId} not found!");
            return 1;
        }

        $template = Template::find($templateId);
        if (!$template) {
            $this->error("❌ Template {$templateId} not found!");
            return 1;
        }

        $this->info("🚀 Testing Template Generation");
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->info("📦 Project: {$project->name} (ID: {$projectId})");
        $this->info("📄 Template: {$template->name} (ID: {$templateId})");
        if ($tableName) $this->info("🗂️  Table: {$tableName}");
        if ($languageCode) $this->info("🌍 Language: {$languageCode}");
        $this->info("🔄 Iterations: {$times}");
        $this->newLine();

        $results = [];

        for ($i = 1; $i <= $times; $i++) {
            $this->info("═══ Run {$i}/{$times} " . ($i === 1 ? "(Cache Miss Expected)" : "(Cache Hit Expected)") . " ═══");

            $startTime = microtime(true);

            try {
                // Call the UltimateTemplateController API endpoint
                $url = sprintf(
                    '/api/ultimate-template/%d?project_id=%d',
                    $templateId,
                    $projectId
                );

                if ($tableName) {
                    $url .= "&table_name={$tableName}";
                }

                if ($languageCode) {
                    $url .= "&language_code={$languageCode}";
                }

                // Use internal HTTP call
                $response = $this->callController($templateId, $projectId, $tableName, $languageCode);

                $elapsed = microtime(true) - $startTime;
                $elapsedFormatted = number_format($elapsed, 2);

                if ($response['success']) {
                    $fileCount = count($response['data']['processed_files'] ?? []);
                    $this->info("✅ Success! Generated {$fileCount} files in {$elapsedFormatted}s");

                    $results[] = [
                        'run' => $i,
                        'elapsed' => $elapsed,
                        'files' => $fileCount,
                        'status' => 'Success',
                    ];
                } else {
                    $this->error("❌ Failed: " . ($response['error'] ?? 'Unknown error'));
                    $results[] = [
                        'run' => $i,
                        'elapsed' => $elapsed,
                        'files' => 0,
                        'status' => 'Failed',
                    ];
                }
            } catch (\Exception $e) {
                $elapsed = microtime(true) - $startTime;
                $this->error("❌ Exception: " . $e->getMessage());
                $results[] = [
                    'run' => $i,
                    'elapsed' => $elapsed,
                    'files' => 0,
                    'status' => 'Error',
                ];
            }

            $this->newLine();
        }

        // Summary
        $this->info("📊 Performance Summary");
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        $tableData = [];
        foreach ($results as $result) {
            $tableData[] = [
                $result['run'],
                $result['status'],
                number_format($result['elapsed'], 2) . 's',
                $result['files'],
            ];
        }

        $this->table(['Run', 'Status', 'Time', 'Files'], $tableData);

        // Calculate speedup
        if (count($results) >= 2) {
            $firstRun = $results[0]['elapsed'];
            $secondRun = $results[1]['elapsed'];

            if ($secondRun > 0 && $firstRun > 0) {
                $speedup = $firstRun / $secondRun;
                $percentFaster = (($firstRun - $secondRun) / $firstRun) * 100;

                $this->newLine();
                $this->info("🚀 Cache Performance:");
                $this->info("   First run (no cache):  " . number_format($firstRun, 2) . "s");
                $this->info("   Second run (cached):   " . number_format($secondRun, 2) . "s");
                $this->info("   Speedup:               " . number_format($speedup, 2) . "x faster");
                $this->info("   Improvement:           " . number_format($percentFaster, 1) . "% faster");
            }
        }

        $this->newLine();
        $this->info("💡 Tip: Check logs for cache hits/misses:");
        $this->info("   tail -f storage/logs/laravel.log | grep CACHE");

        return 0;
    }

    /**
     * Call the UltimateTemplateController directly
     */
    private function callController(int $templateId, int $projectId, ?string $tableName, ?string $languageCode): array
    {
        $controller = app(\App\Http\Controllers\Api\UltimateTemplateController::class);

        $request = new \Illuminate\Http\Request([
            'project_id' => $projectId,
            'table_name' => $tableName,
            'language_code' => $languageCode,
        ]);

        try {
            $response = $controller->processTemplate($request, $templateId);
            $data = json_decode($response->getContent(), true);

            return [
                'success' => $response->getStatusCode() === 200,
                'data' => $data,
                'error' => $data['error'] ?? null,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'data' => null,
                'error' => $e->getMessage(),
            ];
        }
    }
}
