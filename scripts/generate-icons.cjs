const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Write public/icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#4f46e5" />
    </linearGradient>
    <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#818cf8" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <!-- Background with smooth rounded edges -->
  <rect width="512" height="512" rx="108" fill="url(#bg)" />
  
  <!-- Outer glowing aperture ring -->
  <circle cx="256" cy="256" r="148" fill="none" stroke="url(#ring)" stroke-width="22" filter="url(#glow)" opacity="0.9" />
  
  <!-- Central camera / eye snapshot aperture -->
  <circle cx="256" cy="256" r="110" fill="#090d16" stroke="#38bdf8" stroke-width="8" />
  <circle cx="256" cy="256" r="64" fill="#0284c7" />
  <circle cx="256" cy="256" r="32" fill="#38bdf8" />
  <circle cx="236" cy="236" r="14" fill="#ffffff" opacity="0.9" />

  <!-- Shutter blades / eidetic matrix dots -->
  <circle cx="168" cy="180" r="10" fill="#38bdf8" />
  <circle cx="344" cy="180" r="10" fill="#38bdf8" />
  <circle cx="168" cy="332" r="10" fill="#818cf8" />
  <circle cx="344" cy="332" r="10" fill="#818cf8" />
  
  <rect x="238" y="90" width="36" height="12" rx="6" fill="#38bdf8" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');

// Helper to draw circle and patterns onto raw RGBA buffer
function createPngIcon(size, isMaskable = false) {
  const width = size;
  const height = size;
  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = size * (isMaskable ? 0.38 : 0.44);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0; // Filter none
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep dark slate background with cyan gradient
      const t = (x + y) / (width + height);
      let r = Math.round(15 * (1 - t) + 2 * t);
      let g = Math.round(23 * (1 - t) + 132 * t * 0.4);
      let b = Math.round(42 * (1 - t) + 199 * t * 0.6);
      let a = 255;

      // Draw rounded outer card if not maskable
      if (!isMaskable) {
        // Rounded box clip
        const cornerR = size * 0.22;
        const inCornerX = x < cornerR || x > width - cornerR;
        const inCornerY = y < cornerR || y > height - cornerR;
        if (inCornerX && inCornerY) {
          const cornerCx = x < cornerR ? cornerR : width - cornerR;
          const cornerCy = y < cornerR ? cornerR : height - cornerR;
          const cornerDist = Math.sqrt((x - cornerCx) ** 2 + (y - cornerCy) ** 2);
          if (cornerDist > cornerR) {
            a = 0; // Transparent outside corner
          }
        }
      }

      if (a > 0) {
        // Aperture outer ring
        const ringWidth = size * 0.04;
        if (Math.abs(dist - radius) < ringWidth) {
          r = 56;
          g = 189;
          b = 248; // cyan-400
        } else if (dist < radius && dist > radius * 0.55) {
          // Dark lens chamber
          r = 9;
          g = 13;
          b = 22;
        } else if (dist <= radius * 0.55 && dist > radius * 0.3) {
          // Iris
          r = 2;
          g = 132;
          b = 199; // cyan-600
        } else if (dist <= radius * 0.3) {
          // Pupil
          r = 56;
          g = 189;
          b = 248;
        }

        // Glint reflection
        const glintDx = x - (cx - radius * 0.2);
        const glintDy = y - (cy - radius * 0.2);
        if (Math.sqrt(glintDx * glintDx + glintDy * glintDy) < radius * 0.12) {
          r = 255;
          g = 255;
          b = 255;
        }
      }

      raw[pixelOffset] = r;
      raw[pixelOffset + 1] = g;
      raw[pixelOffset + 2] = b;
      raw[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(raw);

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crc ^ buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const body = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

console.log('Generating PWA icons in /public...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPngIcon(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPngIcon(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPngIcon(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPngIcon(180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPngIcon(64, false));
console.log('All PWA icons generated successfully!');
