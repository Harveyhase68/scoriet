<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Template;

class TemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            [
                'name' => 'React CRUD Component',
                'description' => 'Vollständiges CRUD Interface mit React, TypeScript und REST API Integration',
                'category' => 'Web',
                'language' => 'TypeScript',
                'tags' => ['React', 'CRUD', 'REST', 'Form Validation'],
                'is_active' => true,
                'files' => [
                    [
                        'file_name' => 'CrudComponent.tsx',
                        'file_content' => '// React CRUD Component Template
import React, { useState, useEffect } from "react";

interface {projectname}Item {
  id: number;
  {for %}
  {field.name}: {field.type};
  {endfor}
}

export default function {projectname}Crud() {
  const [items, setItems] = useState<{projectname}Item[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/{tablename}");
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crud-container">
      <h2>{projectname} Management</h2>
      {/* CRUD Implementation */}
    </div>
  );
}',
                        'file_type' => 'template',
                        'file_order' => 0,
                    ],
                    [
                        'file_name' => 'api.ts',
                        'file_content' => '// API Helper for {projectname}
export const {tablename}Api = {
  getAll: () => fetch("/api/{tablename}").then(r => r.json()),
  getById: (id: number) => fetch(`/api/{tablename}/${id}`).then(r => r.json()),
  create: (data: any) => fetch("/api/{tablename}", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  update: (id: number, data: any) => fetch(`/api/{tablename}/${id}`, {
    method: "PUT", 
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  delete: (id: number) => fetch(`/api/{tablename}/${id}`, {
    method: "DELETE"
  }).then(r => r.json())
};',
                        'file_type' => 'helper',
                        'file_order' => 1,
                    ],
                ],
            ],
            [
                'name' => 'Laravel API Controller',
                'description' => 'RESTful API Controller mit Validation, Authentication und Response Formatting',
                'category' => 'API',
                'language' => 'PHP',
                'tags' => ['Laravel', 'API', 'REST', 'Validation', 'Auth'],
                'is_active' => true,
                'files' => [
                    [
                        'file_name' => '{Tablename}Controller.php',
                        'file_content' => '<?php

namespace App\Http\Controllers;

use App\Models\{Tablename};
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class {Tablename}Controller extends Controller
{
    public function __construct()
    {
        $this->middleware("auth:api");
    }

    public function index(): JsonResponse
    {
        try {
            ${tablename}s = {Tablename}::all();
            
            return response()->json([
                "success" => true,
                "data" => ${tablename}s
            ]);
        } catch (\Exception $e) {
            return response()->json([
                "success" => false,
                "error" => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                {for %}
                "{field.name}" => "required|{field.validation}",
                {endfor}
            ]);

            ${tablename} = {Tablename}::create($validated);

            return response()->json([
                "success" => true,
                "data" => ${tablename},
                "message" => "{Tablename} created successfully"
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                "success" => false,
                "error" => $e->getMessage()
            ], 400);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            ${tablename} = {Tablename}::findOrFail($id);
            
            return response()->json([
                "success" => true,
                "data" => ${tablename}
            ]);
        } catch (\Exception $e) {
            return response()->json([
                "success" => false,
                "error" => "{Tablename} not found"
            ], 404);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            ${tablename} = {Tablename}::findOrFail($id);
            
            $validated = $request->validate([
                {for %}
                "{field.name}" => "sometimes|required|{field.validation}",
                {endfor}
            ]);

            ${tablename}->update($validated);

            return response()->json([
                "success" => true,
                "data" => ${tablename},
                "message" => "{Tablename} updated successfully"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                "success" => false,
                "error" => $e->getMessage()
            ], 400);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            ${tablename} = {Tablename}::findOrFail($id);
            ${tablename}->delete();

            return response()->json([
                "success" => true,
                "message" => "{Tablename} deleted successfully"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                "success" => false,
                "error" => $e->getMessage()
            ], 400);
        }
    }
}',
                        'file_type' => 'template',
                        'file_order' => 0,
                    ],
                ],
            ],
            [
                'name' => 'Vue.js Dashboard',
                'description' => 'Admin Dashboard mit Charts, Tabellen und Real-time Updates',
                'category' => 'Web',
                'language' => 'JavaScript',
                'tags' => ['Vue.js', 'Dashboard', 'Charts', 'Admin'],
                'is_active' => false,
                'files' => [
                    [
                        'file_name' => 'Dashboard.vue',
                        'file_content' => '<template>
  <div class="dashboard">
    <h1>{projectname} Dashboard</h1>
    
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in stats" :key="stat.label">
        <h3>{{ stat.value }}</h3>
        <p>{{ stat.label }}</p>
      </div>
    </div>

    <div class="charts-section">
      <!-- Chart components here -->
    </div>

    <div class="recent-items">
      <h2>Recent {tablename} Items</h2>
      <table>
        <thead>
          <tr>
            {for %}
            <th>{{ "{field.name}" }}</th>
            {endfor}
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in recentItems" :key="item.id">
            {for %}
            <td>{{ item.{field.name} }}</td>
            {endfor}
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: "{projectname}Dashboard",
  data() {
    return {
      stats: [],
      recentItems: []
    };
  },
  async mounted() {
    await this.loadDashboardData();
  },
  methods: {
    async loadDashboardData() {
      try {
        const response = await fetch("/api/{tablename}/dashboard");
        const data = await response.json();
        this.stats = data.stats;
        this.recentItems = data.recent;
      } catch (error) {
        console.error("Error loading dashboard:", error);
      }
    }
  }
};
</script>',
                        'file_type' => 'template',
                        'file_order' => 0,
                    ],
                ],
            ],
            [
                'name' => 'MySQL Database Schema',
                'description' => 'Optimierte Datenbankstruktur mit Indizes, Foreign Keys und Constraints',
                'category' => 'Database',
                'language' => 'SQL',
                'tags' => ['MySQL', 'Schema', 'Optimization', 'Relations'],
                'is_active' => true,
                'files' => [
                    [
                        'file_name' => 'create_{tablename}_table.sql',
                        'file_content' => '-- {projectname} - {tablename} Table
CREATE TABLE `{tablename}` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  {for %}
  `{field.name}` {field.sql_type}{if field.nullable} NULL{else} NOT NULL{endif},
  {endfor}
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  {for constraints}
  {if constraint.type == "INDEX"}
  INDEX `idx_{tablename}_{constraint.name}` ({constraint.columns}),
  {endif}
  {if constraint.type == "UNIQUE"}
  UNIQUE KEY `uk_{tablename}_{constraint.name}` ({constraint.columns}),
  {endif}
  {endfor}
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key constraints
{for fks}
ALTER TABLE `{tablename}` 
ADD CONSTRAINT `fk_{tablename}_{fk.name}` 
FOREIGN KEY (`{fk.column}`) 
REFERENCES `{fk.ref_table}` (`{fk.ref_column}`) 
ON DELETE {fk.on_delete} ON UPDATE {fk.on_update};
{endfor}

-- Performance optimization indexes
{for indexes}
CREATE INDEX `idx_{tablename}_{index.name}` ON `{tablename}` ({index.columns});
{endfor}',
                        'file_type' => 'template',
                        'file_order' => 0,
                    ],
                ],
            ],
            [
                'name' => 'Flutter Mobile App',
                'description' => 'Cross-platform Mobile App mit Navigation, State Management und API Integration',
                'category' => 'Mobile',
                'language' => 'Dart',
                'tags' => ['Flutter', 'Mobile', 'Cross-platform', 'API'],
                'is_active' => false,
                'files' => [
                    [
                        'file_name' => '{tablename}_screen.dart',
                        'file_content' => 'import "package:flutter/material.dart";
import "package:http/http.dart" as http;
import "dart:convert";

class {Tablename}Screen extends StatefulWidget {
  @override
  _{Tablename}ScreenState createState() => _{Tablename}ScreenState();
}

class _{Tablename}ScreenState extends State<{Tablename}Screen> {
  List<Map<String, dynamic>> items = [];
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    loadItems();
  }

  Future<void> loadItems() async {
    setState(() {
      isLoading = true;
    });

    try {
      final response = await http.get(
        Uri.parse("https://your-api.com/api/{tablename}"),
        headers: {"Content-Type": "application/json"}
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          items = List<Map<String, dynamic>>.from(data["data"]);
        });
      }
    } catch (e) {
      print("Error loading {tablename}: $e");
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("{projectname} - {Tablename}"),
        backgroundColor: Colors.blue,
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                return Card(
                  margin: EdgeInsets.all(8.0),
                  child: ListTile(
                    {for %}
                    title: Text(item["{field.name}"]?.toString() ?? ""),
                    {endfor}
                    onTap: () {
                      // Navigate to detail screen
                    },
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Navigate to add/edit screen
        },
        child: Icon(Icons.add),
      ),
    );
  }
}',
                        'file_type' => 'template',
                        'file_order' => 0,
                    ],
                ],
            ],
        ];

        foreach ($templates as $templateData) {
            $files = $templateData['files'];
            unset($templateData['files']);
            
            $templateData['file_count'] = count($files);
            
            $template = Template::create($templateData);
            
            foreach ($files as $index => $fileData) {
                $template->files()->create([
                    'file_name' => $fileData['file_name'],
                    'file_path' => "templates/{$template->id}/{$fileData['file_name']}",
                    'file_content' => $fileData['file_content'],
                    'file_type' => $fileData['file_type'],
                    'file_order' => $fileData['file_order'],
                ]);
            }
        }

        $this->command->info('Templates seeded successfully!');
    }
}