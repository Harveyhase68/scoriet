<?php
// Generate all PWA icon sizes from source PNG
$source = 'I:/My Projects/28/scoriet/code1.png';
$outputDir = __DIR__ . '/public/icons/';

$sourceImg = imagecreatefrompng($source);
if (!$sourceImg) {
    die("Could not load source image: $source\n");
}

$srcWidth = imagesx($sourceImg);
$srcHeight = imagesy($sourceImg);
echo "Source image: {$srcWidth}x{$srcHeight}\n";

$sizes = [72, 96, 128, 144, 152, 192, 384, 512];

foreach ($sizes as $size) {
    $dest = imagecreatetruecolor($size, $size);

    // Preserve transparency
    imagealphablending($dest, false);
    imagesavealpha($dest, true);
    $transparent = imagecolorallocatealpha($dest, 0, 0, 0, 127);
    imagefilledrectangle($dest, 0, 0, $size, $size, $transparent);
    imagealphablending($dest, true);

    imagecopyresampled($dest, $sourceImg, 0, 0, 0, 0, $size, $size, $srcWidth, $srcHeight);

    // Regular icon
    $filename = $outputDir . "icon-{$size}x{$size}.png";
    imagepng($dest, $filename, 9);
    echo "Created: icon-{$size}x{$size}.png\n";

    // Maskable versions (192 and 512 only) - add 10% padding with background
    if ($size === 192 || $size === 512) {
        $maskable = imagecreatetruecolor($size, $size);
        // Blue background matching the icon
        $bgColor = imagecolorallocate($maskable, 75, 130, 195);
        imagefilledrectangle($maskable, 0, 0, $size, $size, $bgColor);

        $padding = (int)($size * 0.1);
        $innerSize = $size - (2 * $padding);
        imagecopyresampled($maskable, $sourceImg, $padding, $padding, 0, 0, $innerSize, $innerSize, $srcWidth, $srcHeight);

        $maskFilename = $outputDir . "icon-maskable-{$size}x{$size}.png";
        imagepng($maskable, $maskFilename, 9);
        echo "Created: icon-maskable-{$size}x{$size}.png\n";
        imagedestroy($maskable);
    }

    imagedestroy($dest);
}

// Apple Touch Icon (180x180)
$apple = imagecreatetruecolor(180, 180);
imagealphablending($apple, false);
imagesavealpha($apple, true);
$transparent = imagecolorallocatealpha($apple, 0, 0, 0, 127);
imagefilledrectangle($apple, 0, 0, 180, 180, $transparent);
imagealphablending($apple, true);
imagecopyresampled($apple, $sourceImg, 0, 0, 0, 0, 180, 180, $srcWidth, $srcHeight);
imagepng($apple, __DIR__ . '/public/apple-touch-icon.png', 9);
echo "Created: apple-touch-icon.png (180x180)\n";
imagedestroy($apple);

imagedestroy($sourceImg);

// Copy .ico as favicon
copy('I:/My Projects/28/scoriet/code.ico', __DIR__ . '/public/favicon.ico');
echo "Copied: favicon.ico\n";

echo "\nDone! All icons generated.\n";
