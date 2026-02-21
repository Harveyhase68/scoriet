<?php

namespace App\Services;

use App\Models\Project;
use Illuminate\Support\Facades\Log;
use ZipArchive;

class FtpSshUploadService
{
    /**
     * Test FTP/SFTP connection
     */
    public function testConnection(Project $project): array
    {
        $type = $project->deployment_type;

        if ($type === 'sftp') {
            return $this->testSftpConnection($project);
        }

        return $this->testFtpConnection($project);
    }

    /**
     * Test FTP connection
     */
    private function testFtpConnection(Project $project): array
    {
        $host = $project->ftp_host;
        $port = $project->ftp_port ?? 21;
        $username = $project->ftp_username;
        $password = $project->ftp_password;
        $ssl = $project->ftp_ssl ?? false;

        try {
            // Check if FTP extension is available
            if (!function_exists('ftp_connect')) {
                return [
                    'success' => false,
                    'message' => __('ftpsshuploadservicephp41'),
                ];
            }

            // Connect to FTP server
            if ($ssl) {
                $connection = @\ftp_ssl_connect($host, $port, 30);
            } else {
                $connection = @\ftp_connect($host, $port, 30);
            }

            if (!$connection) {
                return [
                    'success' => false,
                    'message' => __('ftpsshuploadservicephp55')."{$host}:{$port}".__('ftpsshuploadservicephp55_2'),
                ];
            }

            // Login
            $loginResult = @\ftp_login($connection, $username, $password);

            if (!$loginResult) {
                \ftp_close($connection);
                return [
                    'success' => false,
                    'message' => __('ftpsshuploadservicephp66')."'{$username}'",
                ];
            }

            // Set passive mode if enabled
            if ($project->ftp_passive) {
                \ftp_pasv($connection, true);
            }

            // Try to get current directory
            $currentDir = \ftp_pwd($connection);

            // Check if target directory exists
            $targetDir = $project->ftp_directory ?: '/';
            $dirExists = @\ftp_chdir($connection, $targetDir);

            \ftp_close($connection);

            if (!$dirExists) {
                return [
                    'success' => true,
                    'message' => __('ftpsshuploadservicephp87')."'{$targetDir}'".__('ftpsshuploadservicephp87_2'),
                    'current_directory' => $currentDir,
                    'target_exists' => false,
                ];
            }

            return [
                'success' => true,
                'message' => __('ftpsshuploadservicephp95'),
                'current_directory' => $currentDir,
                'target_exists' => true,
            ];

        } catch (\Exception $e) {
            Log::error("FTP connection test failed: " . $e->getMessage());
            return [
                'success' => false,
                'message' => "Fehler: " . $e->getMessage(),
            ];
        }
    }

    /**
     * Test SFTP connection
     */
    private function testSftpConnection(Project $project): array
    {
        $host = $project->ftp_host;
        $port = $project->ftp_port ?? 22;
        $username = $project->ftp_username;
        $password = $project->ftp_password;

        try {
            // Check if SSH2 extension is available
            if (!function_exists('ssh2_connect')) {
                return [
                    'success' => false,
                    'message' => __('ftpsshuploadservicephp124'),
                ];
            }

            // Connect to SSH server
            $connection = @\ssh2_connect($host, $port);

            if (!$connection) {
                return [
                    'success' => false,
                    'message' => __('ftpsshuploadservicephp134')."{$host}:{$port}".__('ftpsshuploadservicephp134_2'),
                ];
            }

            // Authenticate
            $authResult = @\ssh2_auth_password($connection, $username, $password);

            if (!$authResult) {
                return [
                    'success' => false,
                    'message' => __('ftpsshuploadservicephp144')."'{$username}'",
                ];
            }

            // Initialize SFTP subsystem
            $sftp = @\ssh2_sftp($connection);

            if (!$sftp) {
                return [
                    'success' => false,
                    'message' => __('ftpsshuploadservicephp154'),
                ];
            }

            // Check if target directory exists
            $targetDir = $project->ftp_directory ?: '/';
            $sftpPath = "ssh2.sftp://" . intval($sftp) . $targetDir;
            $dirExists = is_dir($sftpPath);

            return [
                'success' => true,
                'message' => __('ftpsshuploadservicephp165'),
                'target_exists' => $dirExists,
            ];

        } catch (\Exception $e) {
            Log::error(__('ftpsshuploadservicephp170') . $e->getMessage());
            return [
                'success' => false,
                'message' => __('ftpsshuploadservicephp173') . $e->getMessage(),
            ];
        }
    }

    /**
     * Upload ZIP file via FTP/SFTP and extract it
     */
    public function uploadZip(Project $project, string $zipPath): array
    {
        $type = $project->deployment_type;

        if ($type === 'sftp') {
            return $this->uploadViaSftp($project, $zipPath);
        }

        return $this->uploadViaFtp($project, $zipPath);
    }

    /**
     * Upload via FTP
     */
    private function uploadViaFtp(Project $project, string $zipPath): array
    {
        $host = $project->ftp_host;
        $port = $project->ftp_port ?? 21;
        $username = $project->ftp_username;
        $password = $project->ftp_password;
        $ssl = $project->ftp_ssl ?? false;
        $targetDir = $project->ftp_directory ?: '/';

        $logs = [];
        $uploadedFiles = 0;

        try {
            // Check if FTP extension is available
            if (!function_exists('ftp_connect')) {
                return [
                    'success' => false,
                    'message' => __('ftpsshuploadservicephp212'),
                    'logs' => [__('ftpsshuploadservicephp213')],
                ];
            }

            $logs[] = "📡 Verbinde zu FTP-Server {$host}:{$port}...";

            // Connect
            if ($ssl) {
                $connection = @\ftp_ssl_connect($host, $port, 30);
            } else {
                $connection = @\ftp_connect($host, $port, 30);
            }

            if (!$connection) {
                return [
                    'success' => false,
                    'message' => __('ftpsshuploadservicephp229'),
                    'logs' => $logs,
                ];
            }

            $logs[] = "✅ Verbunden";

            // Login
            if (!@\ftp_login($connection, $username, $password)) {
                \ftp_close($connection);
                return [
                    'success' => false,
                    'message' => __('ftpsshuploadservicephp241'),
                    'logs' => $logs,
                ];
            }

            $logs[] = "✅ Angemeldet als {$username}";

            // Set passive mode
            if ($project->ftp_passive) {
                \ftp_pasv($connection, true);
                $logs[] = __('ftpsshuploadservicephp251');
            }

            // Extract ZIP locally first
            $logs[] = __('ftpsshuploadservicephp255');

            $tempDir = sys_get_temp_dir() . '/ftp_upload_' . uniqid();
            mkdir($tempDir, 0755, true);

            $zip = new ZipArchive();
            if ($zip->open($zipPath) !== true) {
                return [
                    'success' => false,
                    'message' => __('ftpsshuploadservicephp264'),
                    'logs' => $logs,
                ];
            }

            $zip->extractTo($tempDir);
            $zip->close();

            $logs[] = __('ftpsshuploadservicephp272');

            // Create target directory if needed
            $this->ftpMkdirRecursive($connection, $targetDir);
            @\ftp_chdir($connection, $targetDir);

            $logs[] = __('ftpsshuploadservicephp278')."{$targetDir}...";

            // Upload all files
            $uploadedFiles = $this->ftpUploadDirectory($connection, $tempDir, $targetDir, $logs);

            // Cleanup temp directory
            $this->deleteDirectory($tempDir);

            \ftp_close($connection);

            $logs[] = __('ftpsshuploadservicephp288')."{$uploadedFiles}".__('ftpsshuploadservicephp288_2');

            return [
                'success' => true,
                'message' => "Upload erfolgreich",
                'files_uploaded' => $uploadedFiles,
                'logs' => $logs,
            ];

        } catch (\Exception $e) {
            Log::error(__('ftpsshuploadservicephp298') . $e->getMessage());
            $logs[] = __('ftpsshuploadservicephp299') . $e->getMessage();

            return [
                'success' => false,
                'message' => $e->getMessage(),
                'logs' => $logs,
            ];
        }
    }

    /**
     * Upload via SFTP
     */
    private function uploadViaSftp(Project $project, string $zipPath): array
    {
        $host = $project->ftp_host;
        $port = $project->ftp_port ?? 22;
        $username = $project->ftp_username;
        $password = $project->ftp_password;
        $targetDir = $project->ftp_directory ?: '/';

        $logs = [];
        $uploadedFiles = 0;

        try {
            $logs[] = __('ftpsshuploadservicephp324')."{$host}:{$port}...";

            // Check SSH2 extension
            if (!function_exists('ssh2_connect')) {
                return [
                    'success' => false,
                    'message' => __('ftpsshuploadservicephp330'),
                    'logs' => [__('ftpsshuploadservicephp331')],
                ];
            }

            // Connect
            $connection = @\ssh2_connect($host, $port);

            if (!$connection) {
                return [
                    'success' => false,
                    'message' => __('ftpsshuploadservicephp341'),
                    'logs' => $logs,
                ];
            }

            $logs[] = "✅ Verbunden";

            // Authenticate
            if (!@\ssh2_auth_password($connection, $username, $password)) {
                return [
                    'success' => false,
                    'message' => __('ftpsshuploadservicephp352'),
                    'logs' => $logs,
                ];
            }

            $logs[] = __('ftpsshuploadservicephp357')."{$username}";

            // Initialize SFTP
            $sftp = @\ssh2_sftp($connection);

            if (!$sftp) {
                return [
                    'success' => false,
                    'message' => __('ftpsshuploadservicephp365'),
                    'logs' => $logs,
                ];
            }

            $logs[] = __('ftpsshuploadservicephp370');

            // Extract ZIP locally
            $logs[] = __('ftpsshuploadservicephp373');

            $tempDir = sys_get_temp_dir() . '/sftp_upload_' . uniqid();
            mkdir($tempDir, 0755, true);

            $zip = new ZipArchive();
            if ($zip->open($zipPath) !== true) {
                return [
                    'success' => false,
                    'message' => __('ftpsshuploadservicephp382'),
                    'logs' => $logs,
                ];
            }

            $zip->extractTo($tempDir);
            $zip->close();

            $logs[] = __('ftpsshuploadservicephp390');

            // Create target directory if needed
            $sftpIntval = intval($sftp);
            $this->sftpMkdirRecursive($sftpIntval, $targetDir);

            $logs[] = __('ftpsshuploadservicephp396')."{$targetDir}...";

            // Upload all files
            $uploadedFiles = $this->sftpUploadDirectory($sftpIntval, $tempDir, $targetDir, $logs);

            // Cleanup temp directory
            $this->deleteDirectory($tempDir);

            $logs[] = __('ftpsshuploadservicephp404_3')."{$uploadedFiles}".__('ftpsshuploadservicephp404_2');

            return [
                'success' => true,
                'message' => __('ftpsshuploadservicephp408'),
                'files_uploaded' => $uploadedFiles,
                'logs' => $logs,
            ];

        } catch (\Exception $e) {
            Log::error(__('ftpsshuploadservicephp414') . $e->getMessage());
            $logs[] = __('ftpsshuploadservicephp415') . $e->getMessage();

            return [
                'success' => false,
                'message' => $e->getMessage(),
                'logs' => $logs,
            ];
        }
    }

    /**
     * Create directory recursively via FTP
     */
    private function ftpMkdirRecursive($connection, string $directory): bool
    {
        $parts = explode('/', trim($directory, '/'));
        $currentPath = '';

        foreach ($parts as $part) {
            if (empty($part)) continue;

            $currentPath .= '/' . $part;

            if (!@\ftp_chdir($connection, $currentPath)) {
                if (!@\ftp_mkdir($connection, $currentPath)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Upload directory recursively via FTP
     */
    private function ftpUploadDirectory($connection, string $localDir, string $remoteDir, array &$logs): int
    {
        $count = 0;
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($localDir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($files as $file) {
            $localPath = $file->getPathname();
            $relativePath = substr($localPath, strlen($localDir) + 1);
            $remotePath = rtrim($remoteDir, '/') . '/' . str_replace('\\', '/', $relativePath);

            if ($file->isDir()) {
                @\ftp_mkdir($connection, $remotePath);
            } else {
                $remoteParent = dirname($remotePath);
                $this->ftpMkdirRecursive($connection, $remoteParent);

                if (@\ftp_put($connection, $remotePath, $localPath, FTP_BINARY)) {
                    $count++;
                } else {
                    $logs[] = __('ftpsshuploadservicephp473')."{$relativePath}";
                }
            }
        }

        return $count;
    }

    /**
     * Create directory recursively via SFTP
     */
    private function sftpMkdirRecursive(int $sftp, string $directory): bool
    {
        $parts = explode('/', trim($directory, '/'));
        $currentPath = '';

        foreach ($parts as $part) {
            if (empty($part)) continue;

            $currentPath .= '/' . $part;
            $sftpPath = "ssh2.sftp://{$sftp}{$currentPath}";

            if (!is_dir($sftpPath)) {
                if (!@mkdir($sftpPath, 0755, true)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Upload directory recursively via SFTP
     */
    private function sftpUploadDirectory(int $sftp, string $localDir, string $remoteDir, array &$logs): int
    {
        $count = 0;
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($localDir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($files as $file) {
            $localPath = $file->getPathname();
            $relativePath = substr($localPath, strlen($localDir) + 1);
            $remotePath = rtrim($remoteDir, '/') . '/' . str_replace('\\', '/', $relativePath);
            $sftpPath = "ssh2.sftp://{$sftp}{$remotePath}";

            if ($file->isDir()) {
                @mkdir($sftpPath, 0755, true);
            } else {
                $remoteParent = dirname($remotePath);
                $this->sftpMkdirRecursive($sftp, $remoteParent);

                $content = file_get_contents($localPath);
                if (@file_put_contents($sftpPath, $content) !== false) {
                    $count++;
                } else {
                    $logs[] = __('ftpsshuploadservicephp532')."{$relativePath}";
                }
            }
        }

        return $count;
    }

    /**
     * Delete a directory recursively
     */
    private function deleteDirectory(string $dir): bool
    {
        if (!is_dir($dir)) {
            return false;
        }

        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($files as $file) {
            if ($file->isDir()) {
                rmdir($file->getPathname());
            } else {
                unlink($file->getPathname());
            }
        }

        return rmdir($dir);
    }
}
