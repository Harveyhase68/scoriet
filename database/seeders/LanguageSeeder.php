<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class LanguageSeeder extends Seeder
{
    /**
     * Führt die Datenbank-Seeds aus, um die Sprachen-Daten einzufügen.
     */
    public function run(): void
    {
        // Die ID-Spalte wird weggelassen, um die Auto-Inkrementierung der Datenbank zu nutzen.
        // Die Daten aus dem MariaDB-Export wurden in ein Array-Format konvertiert.
        DB::table('languages')->insert([
            [
                'code' => 'en',
                'name' => 'English',
                'native_name' => 'English',
                'flag' => '🇺🇸',
                'is_active' => true,
                'is_default' => true,
                'sort_order' => 1,
                'description' => 'English language for international users',
                'created_by' => null,
                // Die fixen Zeitstempel aus dem Export werden übernommen
                'created_at' => '2025-09-28 16:33:11',
                'updated_at' => '2025-09-28 18:33:00',
            ],
            [
                'code' => 'de',
                'name' => 'German',
                'native_name' => 'Deutsch',
                'flag' => '🇩🇪',
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 2,
                'description' => 'German language for German-speaking users',
                'created_by' => null,
                'created_at' => '2025-09-28 16:33:11',
                'updated_at' => '2025-09-28 18:32:57',
            ],
            [
                'code' => 'fr',
                'name' => 'French',
                'native_name' => 'Français',
                'flag' => '🇫🇷',
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 3,
                'description' => 'French language for French-speaking users',
                'created_by' => null,
                'created_at' => '2025-09-28 16:33:11',
                'updated_at' => '2025-09-28 16:33:11',
            ],
            [
                'code' => 'es',
                'name' => 'Spanish',
                'native_name' => 'Español',
                'flag' => '🇪🇸',
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 4,
                'description' => 'Spanish language for Spanish-speaking users',
                'created_by' => null,
                'created_at' => '2025-09-28 16:33:11',
                'updated_at' => '2025-09-28 16:33:11',
            ],
            [
                'code' => 'it',
                'name' => 'Italian',
                'native_name' => 'Italiano',
                'flag' => '🇮🇹',
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 5,
                'description' => 'Italian language for Italian-speaking users',
                'created_by' => null,
                'created_at' => '2025-09-28 16:33:11',
                'updated_at' => '2025-09-28 16:33:11',
            ],
        ]);
    }
}
