<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Template;
use App\Models\TemplateFile;
use App\Models\SchemaVersion;
use App\Models\SchemaTable;
use App\Models\ProjectTemplateUsage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TestObservers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'observers:test {project_id?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test observer functionality by triggering various model events';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $projectId = $this->argument('project_id');
        
        $this->info('🧪 Testing Observer Functionality');
        $this->info('---------------------------------');

        // Check queue status before
        $jobsBefore = DB::table('jobs')->count();
        $this->info("Jobs in queue before test: {$jobsBefore}");

        // Test 1: Template Observer
        $this->testTemplateObserver();

        // Test 2: TemplateFile Observer
        $this->testTemplateFileObserver();

        // Test 3: SchemaVersion Observer (if project_id provided)
        if ($projectId) {
            $this->testSchemaVersionObserver($projectId);
        }

        // Test 4: SchemaTable Observer (if project_id provided)
        if ($projectId) {
            $this->testSchemaTableObserver($projectId);
        }

        // Test 5: ProjectTemplateUsage Observer (if project_id provided)
        if ($projectId) {
            $this->testProjectTemplateUsageObserver($projectId);
        }

        // Check queue status after
        $jobsAfter = DB::table('jobs')->count();
        $newJobs = $jobsAfter - $jobsBefore;
        $this->info("Jobs in queue after test: {$jobsAfter}");
        $this->info("New jobs dispatched: {$newJobs}");

        $this->info('✅ Observer test completed!');
        $this->info('Check the logs for detailed observer activity.');
    }

    private function testTemplateObserver()
    {
        $this->info("\n📋 Testing Template Observer...");

        try {
            // Create a test template
            $template = Template::create([
                'name' => 'test_observer_template_' . time(),
                'description' => 'Test template for observer functionality',
                'category' => 'Web',
                'language' => 'PHP',
                'creator_user_id' => 1, // Assuming user 1 exists
                'visibility' => 'public',
                'is_active' => true,
                'file_count' => 1,
            ]);

            $this->info("✅ Created template: {$template->id}");

            // Add a file to trigger TemplateFile observer
            $template->files()->create([
                'file_name' => 'test_file.php',
                'file_path' => 'test/test_file.php',
                'file_content' => '<?php echo "Hello World"; ?>',
                'file_type' => 'project_file',
                'file_order' => 0,
            ]);

            $this->info("✅ Added file to template");

            // Update the template
            $template->update(['description' => 'Updated description']);
            $this->info("✅ Updated template");

            // Clean up
            $template->delete();
            $this->info("✅ Deleted template");

        } catch (\Exception $e) {
            $this->error("❌ Template observer test failed: " . $e->getMessage());
        }
    }

    private function testTemplateFileObserver()
    {
        $this->info("\n📄 Testing TemplateFile Observer...");

        try {
            // Create a test template first
            $template = Template::create([
                'name' => 'test_file_observer_template_' . time(),
                'description' => 'Test template for file observer',
                'category' => 'Web',
                'language' => 'PHP',
                'creator_user_id' => 1,
                'visibility' => 'public',
                'is_active' => true,
                'file_count' => 0,
            ]);

            // Create a file
            $file = $template->files()->create([
                'file_name' => 'test_observer_file.php',
                'file_path' => 'test/test_observer_file.php',
                'file_content' => '<?php echo "Test File"; ?>',
                'file_type' => 'project_file',
                'file_order' => 0,
            ]);

            $this->info("✅ Created template file: {$file->id}");

            // Update the file
            $file->update(['file_content' => '<?php echo "Updated Content"; ?>']);
            $this->info("✅ Updated template file");

            // Delete the file
            $file->delete();
            $this->info("✅ Deleted template file");

            // Clean up template
            $template->delete();

        } catch (\Exception $e) {
            $this->error("❌ TemplateFile observer test failed: " . $e->getMessage());
        }
    }

    private function testSchemaVersionObserver($projectId)
    {
        $this->info("\n🗄️ Testing SchemaVersion Observer...");

        try {
            // Find a schema version for the project
            $schemaVersion = DB::table('project_schemas')
                ->join('schema_versions', 'project_schemas.schema_id', '=', 'schema_versions.schema_id')
                ->where('project_schemas.project_id', $projectId)
                ->first();

            if (!$schemaVersion) {
                $this->warn("⚠️ No schema version found for project {$projectId}");
                return;
            }

            // Create a new version to trigger observer
            $newVersion = SchemaVersion::create([
                'schema_id' => $schemaVersion->schema_id,
                'version_name' => 'test_observer_version_' . time(),
                'version_number' => $schemaVersion->version_number + 1,
                'description' => 'Test version for observer',
                'imported_at' => now(),
            ]);

            $this->info("✅ Created schema version: {$newVersion->id}");

            // Clean up
            $newVersion->delete();
            $this->info("✅ Deleted schema version");

        } catch (\Exception $e) {
            $this->error("❌ SchemaVersion observer test failed: " . $e->getMessage());
        }
    }

    private function testSchemaTableObserver($projectId)
    {
        $this->info("\n📋 Testing SchemaTable Observer...");

        try {
            // Find a schema version for the project
            $schemaVersion = DB::table('project_schemas')
                ->join('schema_versions', 'project_schemas.schema_id', '=', 'schema_versions.schema_id')
                ->where('project_schemas.project_id', $projectId)
                ->first();

            if (!$schemaVersion) {
                $this->warn("⚠️ No schema version found for project {$projectId}");
                return;
            }

            // Create a test table
            $table = SchemaTable::create([
                'schema_version_id' => $schemaVersion->id,
                'table_name' => 'test_observer_table_' . time(),
                'table_comment' => 'Test table for observer',
                'engine' => 'InnoDB',
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
            ]);

            $this->info("✅ Created schema table: {$table->id}");

            // Update the table
            $table->update(['table_comment' => 'Updated comment']);
            $this->info("✅ Updated schema table");

            // Clean up
            $table->delete();
            $this->info("✅ Deleted schema table");

        } catch (\Exception $e) {
            $this->error("❌ SchemaTable observer test failed: " . $e->getMessage());
        }
    }

    private function testProjectTemplateUsageObserver($projectId)
    {
        $this->info("\n🔗 Testing ProjectTemplateUsage Observer...");

        try {
            // Find a template
            $template = Template::first();
            if (!$template) {
                $this->warn("⚠️ No template found");
                return;
            }

            // Create project template usage
            $usage = ProjectTemplateUsage::create([
                'project_id' => $projectId,
                'template_id' => $template->id,
                'usage_type' => 'linked',
                'is_active' => true,
                'alias' => 'test_observer_usage',
            ]);

            $this->info("✅ Created project template usage: {$usage->id}");

            // Update the usage
            $usage->update(['alias' => 'updated_test_observer_usage']);
            $this->info("✅ Updated project template usage");

            // Deactivate the usage
            $usage->update(['is_active' => false]);
            $this->info("✅ Deactivated project template usage");

            // Clean up
            $usage->delete();
            $this->info("✅ Deleted project template usage");

        } catch (\Exception $e) {
            $this->error("❌ ProjectTemplateUsage observer test failed: " . $e->getMessage());
        }
    }
}