<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_translations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->string('language_code', 10);
            $table->string('caption', 255)->nullable();
            $table->text('description')->nullable();
            $table->string('decimal_separator', 1)->nullable();
            $table->string('thousands_separator', 1)->nullable();
            $table->string('date_format', 20)->nullable();
            $table->string('time_format', 20)->nullable();
            $table->string('currency_symbol', 5)->nullable();
            $table->string('timezone', 50)->nullable();
            $table->timestamps();

            $table->unique(['project_id', 'language_code']);
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });

        // Migrate existing locale data from projects table to project_translations
        // for each project's default_language
        $projects = DB::table('projects')->get();
        foreach ($projects as $project) {
            $defaultLang = $project->default_language ?? 'en';
            DB::table('project_translations')->insert([
                'project_id' => $project->id,
                'language_code' => $defaultLang,
                'caption' => self::formatCaption($project->name),
                'description' => $project->description ?? '',
                'decimal_separator' => $project->decimal_separator ?? ',',
                'thousands_separator' => $project->thousands_separator ?? '.',
                'date_format' => $project->date_format ?? 'd.m.Y',
                'time_format' => $project->time_format ?? 'H:i:s',
                'currency_symbol' => $project->currency_symbol ?? '€',
                'timezone' => $project->timezone ?? 'Europe/Vienna',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('project_translations');
    }

    private static function formatCaption(string $name): string
    {
        return ucwords(str_replace('_', ' ', $name));
    }
};
