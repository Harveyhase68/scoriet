/**
 * Generates icon.png (128x128) for the extension.
 * Run once: node generate-icon.js
 */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// CRC32 lookup table
var crcTable = [];
for (var n = 0; n < 256; n++) {
    var c = n;
    for (var k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
}

function crc32(buf) {
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i++) {
        crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
    var typeBuf = Buffer.from(type, 'ascii');
    var lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    var crcInput = Buffer.concat([typeBuf, data]);
    var crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(crcInput), 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

var W = 128, H = 128;
var raw = Buffer.alloc((W * 4 + 1) * H);

for (var y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0; // filter: none
    for (var x = 0; x < W; x++) {
        var off = y * (W * 4 + 1) + 1 + x * 4;
        var dx = x - 64, dy = y - 64;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var r, g, b, a = 255;

        if (dist <= 50) {
            // Globe with sphere shading
            var nz = Math.sqrt(Math.max(0, 1 - (dist / 50) * (dist / 50)));
            var shade = 0.35 + 0.65 * nz;

            // Lat/lon for grid
            var lat = Math.asin(Math.max(-1, Math.min(1, dy / 50)));
            var lon = Math.atan2(dx / 50, nz);
            var step = Math.PI / 6; // 30 degree grid
            var thick = 0.045;

            var latM = Math.abs(lat % step);
            var lonM = Math.abs(lon % step);
            var isGrid = (latM < thick || latM > step - thick) ||
                         (lonM < thick || lonM > step - thick);
            var isMain = Math.abs(lat) < thick * 1.6 || Math.abs(lon) < thick * 1.6;

            if (isMain) {
                r = 210 * shade; g = 230 * shade; b = 255 * shade;
            } else if (isGrid) {
                r = 120 * shade; g = 170 * shade; b = 240 * shade;
            } else {
                r = 45 * shade; g = 120 * shade; b = 210 * shade;
            }
        } else if (dist <= 53) {
            // Soft glow border
            var fade = 1 - (dist - 50) / 3;
            r = 80 * fade; g = 150 * fade; b = 255 * fade;
        } else {
            // Dark background
            r = 30; g = 30; b = 46;
        }

        raw[off]     = Math.min(255, Math.max(0, Math.round(r)));
        raw[off + 1] = Math.min(255, Math.max(0, Math.round(g)));
        raw[off + 2] = Math.min(255, Math.max(0, Math.round(b)));
        raw[off + 3] = a;
    }
}

// Build PNG
var sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
var ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

var png = Buffer.concat([
    sig,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', zlib.deflateSync(raw)),
    createChunk('IEND', Buffer.alloc(0))
]);

fs.writeFileSync(path.join(__dirname, 'icon.png'), png);
console.log('Generated icon.png (' + png.length + ' bytes)');
