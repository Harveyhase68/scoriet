<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DiagramLayoutController extends Controller
{
    /**
     * HTTP Endpoint für Layout-Generierung
     */
    public function generate(Request $request)
    {
        // Eingabe aus JSON-Body
        $tables = $request->input('tables', []);
        $foreignKeys = $request->input('foreignKeys', []);
        $projectId = $request->input('project_id');

        // Plausibilitätscheck
        if (empty($tables)) {
            return response()->json([
                'error' => 'Missing required data: tables is required.'
            ], 400);
        }

        // Diagram-Einstellungen aus Projekt laden
        $settings = null;
        if ($projectId) {
            $project = \App\Models\Project::find($projectId);
            if ($project) {
                $settings = [
                    'maxNodesPerLevel' => $project->diagram_max_tables_per_row ?? 20,
                    'xStep' => $project->diagram_horizontal_spacing ?? 600,
                    'yStep' => $project->diagram_vertical_spacing ?? 700,
                ];
            }
        }

        // Interne Methode aufrufen
        try {
            $positions = $this->generateLayoutInternal($tables, $foreignKeys, $settings);
            return response()->json(['nodes' => $positions]);
        } catch (\Exception $e) {
            \Log::error("🎯 [LAYOUT-ERROR] " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Interne Methode für Layout-Generierung
     * Kann direkt von anderen Controllern aufgerufen werden
     *
     * @param array $tables Array von Tabellennamen
     * @param array $foreignKeys Array von [from, to] Paaren
     * @param array|null $settings Optional: ['maxNodesPerLevel' => 20, 'xStep' => 600, 'yStep' => 700]
     * @return array Positionen der Tabellen ['tablename' => ['x' => 100, 'y' => 200]]
     */
    public function generateLayoutInternal(array $tables, array $foreignKeys = [], ?array $settings = null)
    {
        // Plausibilitätscheck
        if (empty($tables)) {
            throw new \Exception('No tables provided for layout generation');
        }

        // ---------------------------
        // Parameter (mit Defaults oder aus Settings)
        // ---------------------------
        $maxNodesPerLevel = $settings['maxNodesPerLevel'] ?? 20;
        $iterations = 10;
        $xStep = $settings['xStep'] ?? 600;
        $yStep = $settings['yStep'] ?? 700;

        // ---------------------------
        // Graph-Struktur
        // ---------------------------
        $graph = [];
        $inDegree = [];
        foreach ($tables as $t) {
            $graph[$t] = [];
            $inDegree[$t] = 0;
        }
        foreach ($foreignKeys as [$from, $to]) {
            $graph[$to][] = $from;
            $inDegree[$from]++;
        }

        // ---------------------------
        // 1. Topologische Sortierung (mit Max-Breite)
        // ---------------------------
        $queue = [];
        foreach ($inDegree as $node => $deg) {
            if ($deg == 0) $queue[] = $node;
        }

        $levels = [];
        $levelIndex = 0;
        $placed = [];

        while (count($placed) < count($tables)) {
            // Collect all nodes with in-degree 0 that haven't been placed yet
            if (empty($queue)) {
                // No nodes with in-degree 0 — we have a cycle.
                // Break the cycle by collecting ALL unplaced nodes with the lowest in-degree
                // and placing them together on the same level.
                $minDeg = PHP_INT_MAX;
                foreach ($inDegree as $node => $deg) {
                    if (!isset($placed[$node]) && $deg < $minDeg) {
                        $minDeg = $deg;
                    }
                }
                if ($minDeg === PHP_INT_MAX) break; // Safety: should not happen
                foreach ($inDegree as $node => $deg) {
                    if (!isset($placed[$node]) && $deg === $minDeg) {
                        $queue[] = $node;
                        $inDegree[$node] = 0;
                    }
                }
            }

            sort($queue);
            $currentLevelQueue = $queue;
            $queue = [];
            $nextLevelQueue = [];
            $levels[$levelIndex] = [];
            $placedNodes = 0;

            while (!empty($currentLevelQueue)) {
                $node = array_shift($currentLevelQueue);

                if (isset($placed[$node])) continue; // Skip already placed

                if ($placedNodes < $maxNodesPerLevel) {
                    $levels[$levelIndex][] = $node;
                    $placed[$node] = true;
                    $placedNodes++;

                    foreach ($graph[$node] as $neighbor) {
                        $inDegree[$neighbor]--;
                        if ($inDegree[$neighbor] == 0 && !isset($placed[$neighbor])) {
                            $queue[] = $neighbor;
                        }
                    }
                } else {
                    $nextLevelQueue[] = $node;
                }
            }

            $queue = array_merge($queue, $nextLevelQueue);
            $levelIndex++;
        }

        // Remove empty trailing levels
        $levels = array_filter($levels, fn($level) => !empty($level));
        $levels = array_values($levels);

        // ---------------------------
        // 2. Kantenkreuzungsreduzierung (Barycenter Heuristik)
        // ---------------------------
        for ($i = 0; $i < $iterations; $i++) {
            $startLevel = ($i % 2 == 0) ? 1 : count($levels) - 2;
            $endLevel = ($i % 2 == 0) ? count($levels) : -1;
            $step = ($i % 2 == 0) ? 1 : -1;

            for ($levelIndex = $startLevel; $levelIndex !== $endLevel; $levelIndex += $step) {
                $currentLevel = $levels[$levelIndex];
                $targetLevelIndex = $levelIndex - $step;

                $barycenters = [];
                $nodePositions = [];
                $targetLevel = $levels[$targetLevelIndex] ?? [];

                foreach ($targetLevel as $index => $node) {
                    $nodePositions[$node] = $index;
                }

                foreach ($currentLevel as $node) {
                    $connectedNodeIndices = [];
                    foreach ($foreignKeys as [$from, $to]) {
                        if ($from === $node && isset($nodePositions[$to])) {
                            $connectedNodeIndices[] = $nodePositions[$to];
                        } elseif ($to === $node && isset($nodePositions[$from])) {
                            $connectedNodeIndices[] = $nodePositions[$from];
                        }
                    }

                    if (empty($connectedNodeIndices)) {
                        $barycenters[$node] = PHP_INT_MAX;
                    } else {
                        $barycenters[$node] = array_sum($connectedNodeIndices) / count($connectedNodeIndices);
                    }
                }

                usort($currentLevel, function ($a, $b) use ($barycenters) {
                    return ($barycenters[$a] ?? 0) <=> ($barycenters[$b] ?? 0);
                });

                $levels[$levelIndex] = array_values($currentLevel);
            }
        }

        // ---------------------------
        // 3. Positionen berechnen
        // ---------------------------
        $positions = [];
        $maxWidth = $maxNodesPerLevel;
        $totalDiagramWidth = $maxWidth * $xStep;
        $y = 0;

        foreach ($levels as $level) {
            $levelWidth = count($level) * $xStep;
            $padding = ($totalDiagramWidth - $levelWidth) / 2;

            $x = $padding;
            foreach ($level as $node) {
                $positions[$node] = ['x' => $x, 'y' => $y];
                $x += $xStep;
            }
            $y += $yStep;
        }

        return $positions;
    }
}
