<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_layout_elements', function (Blueprint $table) {
            $table->string('label_position', 10)->nullable()->default('top')->after('caption_labels');
            $table->decimal('label_width', 5, 2)->nullable()->after('label_position');
            $table->string('control_type', 20)->nullable()->after('label_width');
        });
    }

    public function down(): void
    {
        Schema::table('report_layout_elements', function (Blueprint $table) {
            $table->dropColumn(['label_position', 'label_width', 'control_type']);
        });
    }
};
