{:if hasforeignkeys:}
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('{:filename:}', function (Blueprint $table) {
{:for nmaxforeignkeys:}
            $table->foreign('{:foreign.name:}')->references('{:foreign.referencedcolumn:}')->on('{:foreign.referencedtable:}')->onUpdate('{:foreign.onupdate:}')->onDelete('{:foreign.ondelete:}');
{:endfor:}
        });
    }

    public function down(): void
    {
        Schema::table('{:filename:}', function (Blueprint $table) {
{:for nmaxforeignkeys:}
            $table->dropForeign('{:filename:}_{:foreign.name:}_foreign');
{:endfor:}
        });
    }
};
{:endif:}