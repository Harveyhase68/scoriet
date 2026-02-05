/**
 * PWA Icon Generator
 * Generates all required PWA icons from the source logo
 */
import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const SOURCE_IMAGE = resolve(projectRoot, 'public/images/logos/scoriet-logo.png');
const OUTPUT_DIR = resolve(projectRoot, 'public/icons');

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
    console.log('Generating PWA icons...');
    console.log(`Source: ${SOURCE_IMAGE}`);
    console.log(`Output: ${OUTPUT_DIR}`);

    // Create output directory if it doesn't exist
    if (!existsSync(OUTPUT_DIR)) {
        await mkdir(OUTPUT_DIR, { recursive: true });
        console.log('Created icons directory');
    }

    // Generate regular icons
    for (const size of ICON_SIZES) {
        const outputPath = resolve(OUTPUT_DIR, `icon-${size}x${size}.png`);
        await sharp(SOURCE_IMAGE)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a - matches background_color
            })
            .png()
            .toFile(outputPath);
        console.log(`Generated: icon-${size}x${size}.png`);
    }

    // Generate maskable icons (with padding for safe zone)
    const maskableSizes = [192, 512];
    for (const size of maskableSizes) {
        const outputPath = resolve(OUTPUT_DIR, `icon-maskable-${size}x${size}.png`);
        const padding = Math.floor(size * 0.1); // 10% padding for safe zone
        const innerSize = size - (padding * 2);

        await sharp(SOURCE_IMAGE)
            .resize(innerSize, innerSize, {
                fit: 'contain',
                background: { r: 15, g: 23, b: 42, alpha: 1 }
            })
            .extend({
                top: padding,
                bottom: padding,
                left: padding,
                right: padding,
                background: { r: 15, g: 23, b: 42, alpha: 1 }
            })
            .png()
            .toFile(outputPath);
        console.log(`Generated: icon-maskable-${size}x${size}.png`);
    }

    console.log('\nPWA icons generated successfully!');
}

generateIcons().catch(console.error);
