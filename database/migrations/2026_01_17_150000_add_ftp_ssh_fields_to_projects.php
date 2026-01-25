<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // FTP/SSH Deployment Settings
            $table->string('deployment_type', 10)->nullable()->after('git_auto_delete_branch');  // 'ftp', 'sftp', or null
            $table->string('ftp_host')->nullable()->after('deployment_type');
            $table->integer('ftp_port')->nullable()->default(21)->after('ftp_host');
            $table->string('ftp_username')->nullable()->after('ftp_port');
            $table->text('ftp_password')->nullable()->after('ftp_username');  // encrypted
            $table->string('ftp_directory')->nullable()->after('ftp_password');  // remote path e.g. /public_html/
            $table->boolean('ftp_passive')->default(true)->after('ftp_directory');  // passive mode for FTP
            $table->boolean('ftp_ssl')->default(false)->after('ftp_passive');  // FTPS (FTP over SSL)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn([
                'deployment_type',
                'ftp_host',
                'ftp_port',
                'ftp_username',
                'ftp_password',
                'ftp_directory',
                'ftp_passive',
                'ftp_ssl',
            ]);
        });
    }
};
