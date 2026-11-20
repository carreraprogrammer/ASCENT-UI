// TCW-5: rasteriza la marca de Ascent ("la esquina violeta", modo oscuro) a PNG sin dependencias.
// Uso: node scripts/make-icons.mjs   (determinista; escribe los PNG de public/icons, assets y resources)
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const BG = [0x11, 0x11, 0x13];
const INK = [0xf4, 0xf4, 0xf5];
const VIOLET = [0x8b, 0x7b, 0xff];
// Marca en coordenadas 0..100: dos triángulos (tinta) y un cuadrado (violeta).
const SHAPES = [
  { color: INK, pts: [[52, 48], [90, 10], [90, 48]] },
  { color: INK, pts: [[10, 90], [48, 52], [48, 90]] },
  { color: VIOLET, pts: [[52, 52], [90, 52], [90, 90], [52, 90]] },
];

const inside = (pts, x, y) => {
  let sign = 0;
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % pts.length];
    const c = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    if (c === 0) continue;
    const s = c > 0 ? 1 : -1;
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
};

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

const SS = 4; // supersampling 4x4

const render = (size, scale) => {
  const off = (size - 100 * scale) / 2;
  const raw = Buffer.alloc((size * 3 + 1) * size);
  const lo = Math.floor(off + 10 * scale) - 1;
  const hi = Math.ceil(off + 90 * scale) + 1;
  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      let rgb = BG;
      if (x >= lo && x <= hi && y >= lo && y <= hi) {
        const acc = [0, 0, 0];
        for (let sy = 0; sy < SS; sy++) {
          for (let sx = 0; sx < SS; sx++) {
            const u = (x + (sx + 0.5) / SS - off) / scale;
            const v = (y + (sy + 0.5) / SS - off) / scale;
            const hit = SHAPES.find((s) => inside(s.pts, u, v));
            const c = hit ? hit.color : BG;
            acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2];
          }
        }
        rgb = acc.map((a) => Math.round(a / (SS * SS)));
      }
      raw[row + 1 + x * 3] = rgb[0];
      raw[row + 2 + x * 3] = rgb[1];
      raw[row + 3 + x * 3] = rgb[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8 bits, RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

// Iconos: la marca ocupa 512/1024 del lado (cabe en la zona segura del 80 % de los maskable). Splash: marca de 640 px.
const ratio = 6.4 / 1024;
const TARGETS = [
  ['public/icons/icon-192.png', 192, 192 * ratio],
  ['public/icons/icon-512.png', 512, 512 * ratio],
  ['public/icons/maskable-512.png', 512, 512 * ratio],
  ['public/icons/apple-touch-icon.png', 180, 180 * ratio],
  ['assets/icon.png', 1024, 1024 * ratio],
  ['resources/icon.png', 1024, 1024 * ratio],
  ['assets/splash.png', 2732, 8],
  ['resources/splash.png', 2732, 8],
];

for (const [file, size, scale] of TARGETS) {
  writeFileSync(file, render(size, scale));
  console.log(`${file} ${size}x${size}`);
}
