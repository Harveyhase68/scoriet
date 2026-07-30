<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS `{:filename:}` (
{:for nmaxitems:}
                `{:item.name:}` {:item.type:}{:if item.notnull:} NOT NULL{:else:} NULL{:endif:}{:if item.autoincrement} AUTO_INCREMENT{:endif:}{:if nmaxkeys>0 || i<nmaxitems:},{:endif:}
{:endfor:}
{:for nmaxkeys:}
{:switch keys.constrainttype:}
{:case "PRIMARY KEY":}
                PRIMARY KEY (`{:keys.name:}`){:if i < nmaxkeys:},{:endif:}
{:case "UNIQUE":}
                UNIQUE KEY `{:keys.constraintname:}` (`{:keys.name:}`){:if i < nmaxkeys:},{:endif:}
{:case "KEY":}
                KEY `{:keys.constraintname:}` (`{:keys.name:}`){:if i < nmaxkeys:},{:endif:}
{:endswitch:}
{:endfor:}
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        DB::statement("DROP TABLE IF EXISTS `{:filename:}`");
    }
};