<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * form_window_type values:
     * 0 = Kein Formular (Standard) - für Controller, Services, etc.
     * 1 = Main Menu
     * 2 = Create/Edit Form
     * 3 = Data Table
     * 4 = Report Single
     * 5 = Report List
     */
    public function up(): void
    {
        Schema::table('template_files', function (Blueprint $table) {
            $table->tinyInteger('form_window_type')->default(0)->after('file_order')
                ->comment('0=None, 1=MainMenu, 2=CreateEdit, 3=DataTable, 4=ReportSingle, 5=ReportList');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('template_files', function (Blueprint $table) {
            $table->dropColumn('form_window_type');
        });
    }
};
