<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use ZipArchive;
use PharData;

class ArchiveController extends Controller
{
    /**
     * Create archive from generated files
     *
     * Receives JSON with:
     * - format: 'zip' | 'tar.gz' | 'tar.xz'
     * - files: [{path: string, content: string (base64)}]
     *
     * Returns: Archive file download
     */
    public function create(Request $request)
    {
        $validated = $request->validate([
            'format' => 'required|in:zip,tar.gz,tar.xz',
            'files' => 'required|array',
            'files.*.path' => 'required|string',
            'files.*.content' => 'required|string',
        ]);

        $format = $validated['format'];
        $files = $validated['files'];

        // Create temporary directory for files
        $tempDir = storage_path('app/temp/' . uniqid('archive_', true));
        $archiveName = 'generated_project_' . time();
        $archivePath = storage_path('app/temp/' . $archiveName);

        $warningMessage = null;
        $actualFormat = $format;

        try {
            // Create temp directory
            File::makeDirectory($tempDir, 0755, true);

            // Write all files to temp directory
            foreach ($files as $file) {
                $filePath = $tempDir . '/' . ltrim($file['path'], '/');
                $fileDir = dirname($filePath);

                // Create subdirectories if needed
                if (!File::exists($fileDir)) {
                    File::makeDirectory($fileDir, 0755, true);
                }

                // Decode base64 content and write file
                $content = base64_decode($file['content']);
                File::put($filePath, $content);
            }

            // Create archive based on format with fallback to ZIP
            switch ($format) {
                case 'zip':
                    $this->createZip($tempDir, $archivePath . '.zip');
                    $finalArchive = $archivePath . '.zip';
                    $mimeType = 'application/zip';
                    break;

                case 'tar.gz':
                    try {
                        $this->createTarGz($tempDir, $archivePath . '.tar.gz');
                        $finalArchive = $archivePath . '.tar.gz';
                        $mimeType = 'application/gzip';
                    } catch (\Exception $e) {
                        // Fallback to ZIP
                        \Log::warning('TAR.GZ creation failed, falling back to ZIP', [
                            'error' => $e->getMessage()
                        ]);
                        $this->createZip($tempDir, $archivePath . '.zip');
                        $finalArchive = $archivePath . '.zip';
                        $mimeType = 'application/zip';
                        $actualFormat = 'zip';
                        $warningMessage = 'TAR.GZ compression failed. Archive created as ZIP instead. Error: ' . $e->getMessage();
                    }
                    break;

                case 'tar.xz':
                    // Check if xz is available BEFORE attempting creation
                    $xzAvailable = shell_exec('which xz 2>/dev/null') || shell_exec('where xz 2>nul');

                    if ($xzAvailable) {
                        try {
                            $this->createTarXz($tempDir, $archivePath . '.tar.xz');
                            $finalArchive = $archivePath . '.tar.xz';
                            $mimeType = 'application/x-xz';
                        } catch (\Exception $e) {
                            // Fallback to ZIP if creation fails
                            \Log::warning('TAR.XZ creation failed, falling back to ZIP', [
                                'error' => $e->getMessage()
                            ]);
                            $this->createZip($tempDir, $archivePath . '.zip');
                            $finalArchive = $archivePath . '.zip';
                            $mimeType = 'application/zip';
                            $actualFormat = 'zip';
                            $warningMessage = 'TAR.XZ compression failed. Archive created as ZIP instead. Error: ' . $e->getMessage();
                        }
                    } else {
                        // XZ not available, fallback to ZIP immediately
                        \Log::warning('TAR.XZ not available, falling back to ZIP');
                        $this->createZip($tempDir, $archivePath . '.zip');
                        $finalArchive = $archivePath . '.zip';
                        $mimeType = 'application/zip';
                        $actualFormat = 'zip';
                        $warningMessage = 'TAR.XZ compression not available (requires xz command). Archive created as ZIP instead.';
                    }
                    break;

                default:
                    throw new \Exception('Unsupported format');
            }

            // Return file as download with warning header if fallback occurred
            $headers = [
                'Content-Type' => $mimeType,
            ];

            // Add warning headers if fallback occurred
            if ($warningMessage) {
                $headers['X-Archive-Warning'] = base64_encode($warningMessage);
                $headers['X-Archive-Actual-Format'] = $actualFormat;
            }

            return response()->download($finalArchive, $archiveName . '.' . $actualFormat, $headers)
                ->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            // Last-resort fallback: Try to create ZIP before giving up
            \Log::error('Archive creation failed, attempting last-resort ZIP fallback', [
                'error' => $e->getMessage(),
                'format' => $format,
            ]);

            try {
                // If temp dir doesn't exist yet, create it and write files
                if (!File::exists($tempDir)) {
                    File::makeDirectory($tempDir, 0755, true);

                    foreach ($files as $file) {
                        $filePath = $tempDir . '/' . ltrim($file['path'], '/');
                        $fileDir = dirname($filePath);

                        if (!File::exists($fileDir)) {
                            File::makeDirectory($fileDir, 0755, true);
                        }

                        $content = base64_decode($file['content']);
                        File::put($filePath, $content);
                    }
                }

                // Create ZIP as last resort
                $zipPath = $archivePath . '.zip';
                $this->createZip($tempDir, $zipPath);

                return response()->download($zipPath, $archiveName . '.zip', [
                    'Content-Type' => 'application/zip',
                    'X-Archive-Warning' => base64_encode(
                        'Original format (' . $format . ') failed. Archive created as ZIP fallback. Error: ' . $e->getMessage()
                    ),
                    'X-Archive-Actual-Format' => 'zip',
                ])->deleteFileAfterSend(true);

            } catch (\Exception $zipError) {
                // If even ZIP fails, return error
                \Log::error('Last-resort ZIP creation also failed', [
                    'original_error' => $e->getMessage(),
                    'zip_error' => $zipError->getMessage(),
                ]);

                return response()->json([
                    'error' => 'Failed to create archive: ' . $e->getMessage()
                ], 500);
            }

        } finally {
            // Clean up temp directory
            if (File::exists($tempDir)) {
                File::deleteDirectory($tempDir);
            }
        }
    }

    /**
     * Create ZIP archive
     */
    private function createZip($sourceDir, $outputPath)
    {
        $zip = new ZipArchive();

        if ($zip->open($outputPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \Exception('Could not create ZIP file');
        }

        $this->addFilesToZip($zip, $sourceDir, '');
        $zip->close();
    }

    /**
     * Recursively add files to ZIP
     */
    private function addFilesToZip($zip, $sourceDir, $relativePath)
    {
        $files = File::files($sourceDir);
        $directories = File::directories($sourceDir);

        // Add files
        foreach ($files as $file) {
            $filename = $file->getFilename();
            $localPath = $relativePath ? $relativePath . '/' . $filename : $filename;
            $zip->addFile($file->getPathname(), $localPath);
        }

        // Add directories recursively
        foreach ($directories as $directory) {
            $dirname = basename($directory);
            $localPath = $relativePath ? $relativePath . '/' . $dirname : $dirname;
            $this->addFilesToZip($zip, $directory, $localPath);
        }
    }

    /**
     * Create TAR.GZ archive
     */
    private function createTarGz($sourceDir, $outputPath)
    {
        $tarPath = $outputPath . '.tmp.tar';

        try {
            // Create TAR first
            $phar = new PharData($tarPath);
            $phar->buildFromDirectory($sourceDir);

            // Compress to GZ
            $phar->compress(\Phar::GZ);

            // Rename .tar.gz to final name
            File::move($tarPath . '.gz', $outputPath);

        } finally {
            // Clean up temporary tar file
            if (File::exists($tarPath)) {
                File::delete($tarPath);
            }
        }
    }

    /**
     * Create TAR.XZ archive
     */
    private function createTarXz($sourceDir, $outputPath)
    {
        // XZ compression requires external command (not natively supported in PHP)
        // We create TAR first, then compress with xz command
        $tarPath = $outputPath . '.tmp.tar';

        try {
            // Create TAR first
            $phar = new PharData($tarPath);
            $phar->buildFromDirectory($sourceDir);

            // Use xz command
            $command = sprintf('xz -z -9 -c %s > %s', escapeshellarg($tarPath), escapeshellarg($outputPath));
            $result = shell_exec($command . ' 2>&1');

            // Check if the output file was created
            if (!File::exists($outputPath) || File::size($outputPath) === 0) {
                throw new \Exception('XZ compression failed: ' . ($result ?: 'Output file not created'));
            }

        } finally {
            // Clean up temporary tar file
            if (File::exists($tarPath)) {
                File::delete($tarPath);
            }
        }
    }
}
