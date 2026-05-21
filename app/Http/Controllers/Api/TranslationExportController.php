<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FloatingSchema;
use App\Models\SchemaTable;
use App\Models\SchemaField;
use App\Models\SchemaTranslation;
use App\Models\Language;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Font;

class TranslationExportController extends Controller
{
    /**
     * 📤 EXPORT TRANSLATIONS TO EXCEL
     */
    public function export(Request $request)
    {
        $projectId = $request->query('project_id');
        $languageCodes = $request->query('languages', []); // Array of language codes

        if (!$projectId) {
            return response()->json(['error' => 'Project ID required'], 400);
        }

        if (empty($languageCodes)) {
            return response()->json(['error' => 'At least one language required'], 400);
        }

        // Get languages
        $languages = Language::whereIn('code', $languageCodes)->get();

        // Get all schemas linked to this project
        $schemas = FloatingSchema::whereHas('projects', function ($query) use ($projectId) {
            $query->where('projects.id', $projectId);
        })->get();

        // Create Excel spreadsheet
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Translations');

        // Build header row
        $headers = ['Type', 'Database', 'Table', 'Field'];
        foreach ($languages as $language) {
            $headers[] = strtoupper($language->code);
        }

        // Write headers
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $sheet->getStyle($col . '1')->getFont()->setBold(true);
            $sheet->getStyle($col . '1')->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setRGB('4472C4');
            $sheet->getStyle($col . '1')->getFont()->getColor()->setRGB('FFFFFF');
            $col++;
        }

        $row = 2;

        // Process each schema
        foreach ($schemas as $schema) {
            $tables = SchemaTable::where('schema_id', $schema->id)
                ->with('fields')
                ->get();

            foreach ($tables as $table) {
                // Table translation row
                $sheet->setCellValue('A' . $row, 'Table');
                $sheet->setCellValue('B' . $row, $schema->name);
                $sheet->setCellValue('C' . $row, $table->table_name);
                $sheet->setCellValue('D' . $row, '');

                // Get existing table translations
                $col = 'E';
                foreach ($languages as $language) {
                    $translation = SchemaTranslation::where('item_name', $table->table_name)
                        ->where('code', $language->code)
                        ->first();

                    $sheet->setCellValue($col . $row, $translation ? $translation->translated_text : '');
                    $col++;
                }

                // Style table rows
                $sheet->getStyle('A' . $row . ':' . $col . $row)->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('E7E6E6');

                $row++;

                // Field translation rows
                foreach ($table->fields as $field) {
                    $sheet->setCellValue('A' . $row, 'Field');
                    $sheet->setCellValue('B' . $row, $schema->name);
                    $sheet->setCellValue('C' . $row, $table->table_name);
                    $sheet->setCellValue('D' . $row, $field->field_name);

                    // Get existing field translations
                    $col = 'E';
                    $fullFieldName = $table->table_name . '.' . $field->field_name;
                    foreach ($languages as $language) {
                        $translation = SchemaTranslation::where('item_name', $fullFieldName)
                            ->where('code', $language->code)
                            ->first();

                        $sheet->setCellValue($col . $row, $translation ? $translation->translated_text : '');
                        $col++;
                    }

                    $row++;
                }
            }
        }

        // Auto-size columns
        foreach (range('A', $col) as $columnID) {
            $sheet->getColumnDimension($columnID)->setAutoSize(true);
        }

        // Generate filename
        $filename = 'translations_export_' . date('Y-m-d_H-i-s') . '.xlsx';

        // Write to file
        $writer = new Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'translations');
        $writer->save($tempFile);

        return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
    }

    /**
     * 🔍 PREVIEW IMPORT - read headers only, no DB writes
     *
     * Used by the Import dialog so the user can see which languages the
     * uploaded Excel actually contains and untick the ones they don't want
     * before triggering the real import. Returns the detected language
     * codes (column E onwards in the export schema) and a row count for
     * an informational hint, without touching SchemaTranslation.
     */
    public function importPreview(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls',
        ]);

        try {
            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getPathname());
            $sheet = $spreadsheet->getActiveSheet();
            $highestRow = $sheet->getHighestRow();
            $highestColumn = $sheet->getHighestColumn();

            // Headers live in row 1. Columns A..D are fixed metadata
            // (Type / Database / Table / Field) and any column from E onwards
            // is a language code. We mirror the import() column convention so
            // both endpoints agree on what is and isn't a language.
            $languages = [];
            $col = 'E';
            while ($col <= $highestColumn) {
                $headerValue = $sheet->getCell($col . '1')->getValue();
                if ($headerValue !== null && $headerValue !== '') {
                    $code = strtolower(trim((string) $headerValue));
                    if ($code !== '') {
                        $languages[] = $code;
                    }
                }
                $col++;
            }

            return response()->json([
                'success' => true,
                'languages' => array_values(array_unique($languages)),
                'data_rows' => max(0, $highestRow - 1), // exclude header row
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Could not read Excel file: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * 📥 IMPORT TRANSLATIONS FROM EXCEL
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls',
            'project_id' => 'required|integer',
            'languages' => 'array', // Optional: specific languages to import
            'languages.*' => 'string|max:5',
        ]);

        $file = $request->file('file');
        $projectId = $request->input('project_id');
        $selectedLanguages = $request->input('languages', []); // Languages to import

        try {
            $spreadsheet = IOFactory::load($file->getPathname());
            $sheet = $spreadsheet->getActiveSheet();
            $highestRow = $sheet->getHighestRow();
            $highestColumn = $sheet->getHighestColumn();

            // Read header row to get languages
            $headers = [];
            $col = 'A';
            while ($col <= $highestColumn) {
                $cellValue = $sheet->getCell($col . '1')->getValue();
                if ($cellValue !== null) {
                    $headers[$col] = $cellValue;
                }
                $col++;
            }

            // Find language columns (after column D)
            // Only include selected languages if specified
            $languageColumns = [];
            foreach ($headers as $colLetter => $headerValue) {
                if ($colLetter >= 'E') {
                    $langCode = strtolower($headerValue);

                    // If languages are specified, only import those
                    if (!empty($selectedLanguages)) {
                        if (in_array($langCode, $selectedLanguages)) {
                            $languageColumns[$colLetter] = $langCode;
                        }
                    } else {
                        // Import all languages if none specified
                        $languageColumns[$colLetter] = $langCode;
                    }
                }
            }

            // Get all existing tables and fields for this project
            $existingTables = [];
            $existingFields = [];
            
            // Get schemas linked to this project
            $schemas = FloatingSchema::whereHas('projects', function ($query) use ($projectId) {
                $query->where('projects.id', $projectId);
            })->get();
            
            // Collect all tables and fields
            foreach ($schemas as $schema) {
                $tables = SchemaTable::where('schema_id', $schema->id)
                    ->with('fields')
                    ->get();
                
                foreach ($tables as $table) {
                    $existingTables[] = $table->table_name;
                    
                    foreach ($table->fields as $field) {
                        $existingFields[] = $table->table_name . '.' . $field->field_name;
                    }
                }
            }
            
            $imported = 0;
            $updated = 0;
            $skippedRows = 0;
            $processedRows = 0;
            $emptyTranslations = 0;
            $notFoundInDb = 0;

            // Process each row (skip header)
            for ($row = 2; $row <= $highestRow; $row++) {
                $processedRows++;
                
                $type = $sheet->getCell('A' . $row)->getValue();
                $database = $sheet->getCell('B' . $row)->getValue();
                $table = $sheet->getCell('C' . $row)->getValue();
                $field = $sheet->getCell('D' . $row)->getValue();

                // More flexible row validation - check if we have at least a table name
                if (empty($table)) {
                    $skippedRows++;
                    continue; // Skip empty rows
                }

                // Determine item name - be more flexible with type
                $itemType = strtolower($type);
                
                // Handle different type formats (Table/Field, table/field, T/F, etc.)
                if (in_array($itemType, ['table', 't', 'tab', 'tabelle'])) {
                    $itemName = $table;
                } elseif (in_array($itemType, ['field', 'f', 'col', 'column', 'spalte'])) {
                    $itemName = empty($field) ? $table : $table . '.' . $field;
                } else {
                    // If type is empty or unrecognized, try to determine from field presence
                    $itemName = empty($field) ? $table : $table . '.' . $field;
                }

                // Check if the item exists in the database
                $isTable = !str_contains($itemName, '.');
                $existsInDb = false;
                
                if ($isTable) {
                    $existsInDb = in_array($itemName, $existingTables);
                } else {
                    $existsInDb = in_array($itemName, $existingFields);
                }
                
                if (!$existsInDb) {
                    $notFoundInDb++;
                    continue;
                }

                // Process each language column
                foreach ($languageColumns as $colLetter => $languageCode) {
                    $translatedText = $sheet->getCell($colLetter . $row)->getValue();

                    if (empty($translatedText)) {
                        $emptyTranslations++;
                        continue; // Skip empty translations
                    }

                    // Update or create translation
                    $translation = SchemaTranslation::updateOrCreate(
                        [
                            'item_name' => $itemName,
                            'code' => $languageCode,
                        ],
                        [
                            'translated_text' => $translatedText,
                            'description' => '', // Optional: could add description column
                            'is_active' => true,
                        ]
                    );

                    if ($translation->wasRecentlyCreated) {
                        $imported++;
                    } else {
                        $updated++;
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Import erfolgreich! {$imported} neue Übersetzungen importiert, {$updated} aktualisiert.",
                'imported_count' => $imported + $updated,
                'created_count' => $imported,
                'updated_count' => $updated,
                'debug_info' => [
                    'total_rows' => $highestRow - 1, // Excluding header
                    'processed_rows' => $processedRows,
                    'skipped_rows' => $skippedRows,
                    'not_found_in_db' => $notFoundInDb,
                    'empty_translations' => $emptyTranslations,
                    'headers_found' => count($headers),
                    'language_columns' => count($languageColumns),
                    'selected_languages' => $selectedLanguages,
                    'existing_tables_count' => count($existingTables),
                    'existing_fields_count' => count($existingFields),
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Translation import error:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Import fehlgeschlagen: ' . $e->getMessage(),
                'debug_info' => [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]
            ], 500);
        }
    }
}
