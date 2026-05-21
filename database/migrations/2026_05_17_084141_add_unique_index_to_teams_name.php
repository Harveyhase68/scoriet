<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Team names are global identifiers (used by invitations, public discovery,
     * etc.), so we enforce uniqueness at the DB level as a safety net behind
     * the validation rule. Aborts early if duplicates exist so the operator
     * resolves them manually instead of MySQL throwing a cryptic 1062.
     */
    public function up(): void
    {
        $duplicates = DB::table('teams')
            ->select('name', DB::raw('COUNT(*) as cnt'))
            ->groupBy('name')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        if ($duplicates->isNotEmpty()) {
            $list = $duplicates->map(fn ($d) => "{$d->name} ({$d->cnt}x)")->implode(', ');
            throw new \RuntimeException(
                "Cannot add unique index on teams.name — duplicate names found: {$list}. "
                . "Rename or remove conflicting teams before running this migration."
            );
        }

        Schema::table('teams', function (Blueprint $table) {
            $table->unique('name', 'teams_name_unique');
        });
    }

    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->dropUnique('teams_name_unique');
        });
    }
};
