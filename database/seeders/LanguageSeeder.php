<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class LanguageSeeder extends Seeder
{
    /**
     * Führt die Datenbank-Seeds aus, um die Sprachen-Daten einzufügen.
     * Idempotent: löscht den bestehenden Inhalt und legt die Sprachen mit
     * fixen IDs neu an, damit Foreign-Key-Referenzen aus anderen Tabellen
     * (Translations, etc.) stabil bleiben.
     */
    public function run(): void
    {
        // FK-Checks deaktivieren, damit TRUNCATE nicht an Referenzen scheitert.
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::statement('TRUNCATE TABLE `scoriet`.`languages`;');
        DB::table('languages')->truncate();

        DB::table('languages')->insert([
            [
                'id' => 1,
                'code' => 'en',
                'name' => 'English',
                'native_name' => 'English',
                'flag' => '🇺🇸',
                'is_active' => true,
                'is_default' => true,
                'sort_order' => 1,
                'description' => 'English language for international users',
                'created_by' => null,
                'created_at' => '2025-09-28 16:33:11',
                'updated_at' => '2025-09-28 18:33:00',
            ],
            [
                'id' => 2,
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
                'id' => 3,
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
                'id' => 4,
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
                'id' => 5,
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

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }
}
