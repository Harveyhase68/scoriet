
// GLOBAL GTREE CACHE - For client-side caching strategy
    try {
        $schemaTables = \App\Models\SchemaTable::where("schema_version_id", $schemaVersionId)
            ->with(["fields" => function($query) {
                $query->orderBy("field_order");
            }, "constraints"])
            ->get();

        $projectData = [
            "projectname" => "GlobalProject",
            "nmaxfiles" => $schemaTables->count(),
            "tables" => []
        ];

        foreach ($schemaTables as $table) {
            $fields = $table->fields;
            $constraints = $table->constraints;

            $mappedFields = $fields->map(function($field) {
                $controltype = match($field->field_type) {
                    "int", "integer", "bigint", "smallint", "tinyint" => 14,
                    "varchar", "char" => 24,
                    "string" => 25,
                    "text", "longtext", "mediumtext" => 26,
                    "decimal", "float", "double" => 27,
                    "date" => 28,
                    "datetime", "timestamp" => 29,
                    "boolean", "bool", "tinyint(1)" => 30,
                    default => 24
                };

                return [
                    "name" => $field->field_name,
                    "type" => $field->field_type,
                    "controltype" => $controltype,
                    "is_nullable" => $field->is_nullable,
                    "order" => $field->field_order
                ];
            })->toArray();

            $projectData["tables"][] = [
                "tablename" => $table->table_name,
                "nmaxitems" => $fields->count(),
                "items" => $mappedFields,
                "nmaxkeys" => $constraints->count(),
                "keys" => []
            ];
        }

        $gtree = [["project" => [$projectData]]];

        return response()->json([
            "schema_version_id" => $schemaVersionId,
            "gtree" => $gtree,
            "cache_info" => [
                "purpose" => "Global gtree[] for client-side caching",
                "usage" => "Store in localStorage for reuse",
                "cache_key" => "gtree_global_schema_{$schemaVersionId}"
            ],
            "timestamp" => now()
        ]);

    } catch (Exception $e) {
        return response()->json([
            "error" => "Exception occurred",
            "message" => $e->getMessage(),
            "schema_version_id" => $schemaVersionId
        ], 500);
    }
});


// GLOBAL GTREE CACHE - For client-side caching strategy
Route::get('/gtree-global/{schemaVersionId}', function ($schemaVersionId) {
    try {
        $schemaTables = \App\Models\SchemaTable::where("schema_version_id", $schemaVersionId)
            ->with(["fields" => function($query) {
                $query->orderBy("field_order");
            }, "constraints"])
            ->get();

        $projectData = [
            "projectname" => "GlobalProject", 
            "nmaxfiles" => $schemaTables->count(),
            "tables" => []
        ];

        foreach ($schemaTables as $table) {
            $fields = $table->fields;
            $constraints = $table->constraints;

            $mappedFields = $fields->map(function($field) {
                $controltype = match($field->field_type) {
                    "int", "integer", "bigint", "smallint", "tinyint" => 14,
                    "varchar", "char" => 24,
                    "string" => 25,
                    "text", "longtext", "mediumtext" => 26,
                    "decimal", "float", "double" => 27,
                    "date" => 28,
                    "datetime", "timestamp" => 29,
                    "boolean", "bool", "tinyint(1)" => 30,
                    default => 24
                };

                return [
                    "name" => $field->field_name,
                    "type" => $field->field_type,
                    "controltype" => $controltype,
                    "is_nullable" => $field->is_nullable,
                    "order" => $field->field_order
                ];
            })->toArray();

            $projectData["tables"][] = [
                "tablename" => $table->table_name,
                "nmaxitems" => $fields->count(),
                "items" => $mappedFields,
                "nmaxkeys" => $constraints->count(),
                "keys" => []
            ];
        }

        $gtree = [["project" => [$projectData]]];

        return response()->json([
            "schema_version_id" => $schemaVersionId,
            "gtree" => $gtree,
            "cache_info" => [
                "purpose" => "Global gtree[] for client-side caching",
                "usage" => "Store in localStorage for reuse",
                "cache_key" => "gtree_global_schema_{$schemaVersionId}"
            ],
            "timestamp" => now()
        ]);

    } catch (Exception $e) {
        return response()->json([
            "error" => "Exception occurred",
            "message" => $e->getMessage(),
            "schema_version_id" => $schemaVersionId
        ], 500);
    }
});
