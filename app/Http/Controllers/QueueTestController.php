<?php

namespace App\Http\Controllers;

use App\Models\FloatingSchema;
use App\Models\SchemaVersion;
use App\Models\Project;
use App\Jobs\RegenerateProjectGenerationTree;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class QueueTestController extends Controller
{
    /**
     * 🧪 Test-Endpunkt zum Überprüfen des Queue-Systems
     */
    public function testQueueSystem(Request $request)
    {
        $results = [];
        
        // 1. Queue-Status prüfen
        $results['queue_status'] = [
            'connection' => config('queue.default'),
            'driver' => config('queue.connections.' . config('queue.default') . '.driver'),
            'table' => config('queue.connections.' . config('queue.default') . '.table'),
            'jobs_count' => DB::table('jobs')->count(),
            'failed_jobs_count' => DB::table('failed_jobs')->count(),
        ];
        
        // 2. Projekt-Schema-Verbindungen prüfen
        $results['project_schema_connections'] = [
            'total_projects' => Project::count(),
            'total_schemas' => FloatingSchema::count(),
            'connections' => DB::table('project_schemas')->count(),
            'connections_details' => DB::table('project_schemas')
                ->join('projects', 'project_schemas.project_id', '=', 'projects.id')
                ->join('schemas', 'project_schemas.schema_id', '=', 'schemas.id')
                ->select('projects.name as project_name', 'schemas.name as schema_name')
                ->get(),
        ];
        
        // 3. Job-Dispatching testen
        $results['job_dispatch_test'] = $this->testJobDispatching();
        
        // 4. Schema-Version-Erstellung testen
        $results['schema_version_test'] = $this->testSchemaVersionCreation();
        
        return response()->json([
            'success' => true,
            'test_results' => $results,
            'timestamp' => now()->toISOString(),
        ]);
    }
    
    /**
     * Testet das Job-Dispatching direkt
     */
    private function testJobDispatching(): array
    {
        Log::info("🧪 [TEST] Starting job dispatch test");
        
        $project = Project::first();
        if (!$project) {
            return ['error' => 'No project found'];
        }
        
        $jobsBefore = DB::table('jobs')->count();
        Log::info("🧪 [TEST] Jobs before dispatch: {$jobsBefore}");
        
        try {
            // Job mit Verzögerung dispatchen, damit wir ihn sehen können
            $job = RegenerateProjectGenerationTree::dispatch($project->id)
                ->delay(now()->addMinutes(1));
                
            $jobsAfter = DB::table('jobs')->count();
            Log::info("🧪 [TEST] Jobs after dispatch: {$jobsAfter}");
            
            return [
                'success' => true,
                'project_id' => $project->id,
                'project_name' => $project->name,
                'jobs_before' => $jobsBefore,
                'jobs_after' => $jobsAfter,
                'job_dispatched' => $jobsAfter > $jobsBefore,
                'message' => $jobsAfter > $jobsBefore ? 'Job successfully dispatched' : 'Job dispatch failed',
            ];
        } catch (\Exception $e) {
            Log::error("🧪 [TEST] Job dispatch failed: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
    
    /**
     * Testet die Schema-Version-Erstellung mit Job-Dispatching
     */
    private function testSchemaVersionCreation(): array
    {
        Log::info("🧪 [TEST] Starting schema version creation test");
        
        $schema = FloatingSchema::first();
        if (!$schema) {
            return ['error' => 'No schema found'];
        }
        
        // Prüfen, ob das Schema mit Projekten verbunden ist
        $projectConnections = DB::table('project_schemas')
            ->where('schema_id', $schema->id)
            ->count();
            
        if ($projectConnections === 0) {
            return [
                'error' => 'Schema is not connected to any projects',
                'hint' => 'Connect the schema to a project first using project_schemas table',
            ];
        }
        
        $jobsBefore = DB::table('jobs')->count();
        Log::info("🧪 [TEST] Jobs before schema version creation: {$jobsBefore}");
        
        try {
            // Neue Schema-Version erstellen
            $version = SchemaVersion::createNewVersion($schema, 'Test version for queue testing');
            Log::info("🧪 [TEST] Created schema version: {$version->id}");
            
            $jobsAfter = DB::table('jobs')->count();
            Log::info("🧪 [TEST] Jobs after schema version creation: {$jobsAfter}");
            
            return [
                'success' => true,
                'schema_id' => $schema->id,
                'schema_name' => $schema->name,
                'version_id' => $version->id,
                'version_number' => $version->version_number,
                'project_connections' => $projectConnections,
                'jobs_before' => $jobsBefore,
                'jobs_after' => $jobsAfter,
                'jobs_dispatched' => $jobsAfter > $jobsBefore,
                'message' => $jobsAfter > $jobsBefore ? 'Jobs dispatched for schema version creation' : 'No jobs dispatched',
            ];
        } catch (\Exception $e) {
            Log::error("🧪 [TEST] Schema version creation failed: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
    
    /**
     * Manuelles Job-Dispatching für ein bestimmtes Projekt
     */
    public function dispatchJobForProject(Request $request, $projectId)
    {
        $project = Project::find($projectId);
        if (!$project) {
            return response()->json([
                'success' => false,
                'error' => 'Project not found',
            ], 404);
        }
        
        $jobsBefore = DB::table('jobs')->count();
        
        try {
            $job = RegenerateProjectGenerationTree::dispatch($projectId);
            
            $jobsAfter = DB::table('jobs')->count();
            
            Log::info("🧪 [MANUAL] Manually dispatched job for project {$projectId}");
            
            return response()->json([
                'success' => true,
                'project' => $project->name,
                'jobs_before' => $jobsBefore,
                'jobs_after' => $jobsAfter,
                'job_dispatched' => $jobsAfter > $jobsBefore,
                'message' => 'Job manually dispatched successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Zeigt die letzten Queue-Logs an
     */
    public function showQueueLogs(Request $request)
    {
        $logFile = storage_path('logs/laravel.log');
        
        if (!file_exists($logFile)) {
            return response()->json([
                'success' => false,
                'error' => 'Log file not found',
            ]);
        }
        
        // Letzte 50 Zeilen aus dem Log lesen
        $lines = file($logFile);
        $lastLines = array_slice($lines, -50);
        
        // Nur Zeilen mit 🧪 [QUEUE-TEST] oder 🧪 [TEST] filtern
        $filteredLines = array_filter($lastLines, function($line) {
            return strpos($line, '🧪 [QUEUE-TEST]') !== false || 
                   strpos($line, '🧪 [TEST]') !== false ||
                   strpos($line, '🧪 [MANUAL]') !== false;
        });
        
        return response()->json([
            'success' => true,
            'logs' => array_values($filteredLines),
            'total_lines' => count($filteredLines),
        ]);
    }
}