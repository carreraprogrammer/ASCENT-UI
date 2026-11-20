// TCW-5 CA5-CA8: marca "la esquina violeta" de Ascent y de TCW; sin restos del logo viejo; favicon y PNG.
// Vive fuera de src/ porque src/test/brand.test.ts prohíbe hex literales en src/.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { BrandMark } from '../src/components/atoms/BrandMark/BrandMark';

const ASCENT_PATHS = ['M52 48 L90 10 L90 48 Z', 'M10 90 L48 52 L48 90 Z'];
const TCW_PATH = 'M89.95 48 A40 40 0 1 0 48 89.95 L48 48 Z';

const files = (dir: string): string[] => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? files(p) : [p];
});
const text = (p: string) => readFileSync(p, 'utf8');

describe('BrandMark (Ascent, la esquina violeta)', () => {
  it.each(['sm', 'md', 'lg'] as const)('TCW-5 CA5: size %s dibuja viewBox 0 0 100 100, dos paths exactos y un rect 38x38 en (52,52), sin circle', (size) => {
    const { container } = render(<BrandMark size={size} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
    expect([...svg.querySelectorAll('path')].map((p) => p.getAttribute('d'))).toEqual(ASCENT_PATHS);
    const rects = svg.querySelectorAll('rect');
    expect(rects).toHaveLength(1);
    expect(['x', 'y', 'width', 'height'].map((a) => rects[0].getAttribute(a))).toEqual(['52', '52', '38', '38']);
    expect(svg.querySelectorAll('circle')).toHaveLength(0);
  });

  it('TCW-5 CA5: con label expone role img y aria-label; sin label es aria-hidden', () => {
    const a = render(<BrandMark label="Ascent" />).container.querySelector('svg')!;
    expect(a.getAttribute('role')).toBe('img');
    expect(a.getAttribute('aria-label')).toBe('Ascent');
    const b = render(<BrandMark />).container.querySelector('svg')!;
    expect(b.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('TcwMark (a cromo by The Cyborg Way)', () => {
  it('TCW-5 CA6: un path de círculo recortado exacto y el rect violeta 38x38 en (52,52), sin circle', async () => {
    const modulePath = '../src/components/atoms/TcwMark/TcwMark';
    const { TcwMark } = await import(/* @vite-ignore */ modulePath);
    const svg = render(<TcwMark />).container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
    expect([...svg.querySelectorAll('path')].map((p) => p.getAttribute('d'))).toEqual([TCW_PATH]);
    const rects = svg.querySelectorAll('rect');
    expect(rects).toHaveLength(1);
    expect(['x', 'y', 'width', 'height'].map((a) => rects[0].getAttribute(a))).toEqual(['52', '52', '38', '38']);
    expect(svg.querySelectorAll('circle')).toHaveLength(0);
  });

  it('TCW-5 CA6: el pie del InstShell y CyborgWayButton usan TcwMark, no BrandMark', () => {
    expect(text('src/components/templates/AppLayout/InstShell.tsx')).toContain('TcwMark');
    expect(text('src/components/atoms/CyborgWayButton/CyborgWayButton.tsx')).toContain('TcwMark');
    expect(text('src/components/atoms/CyborgWayButton/CyborgWayButton.tsx')).not.toContain('BrandMark');
  });
});

describe('restos del logo viejo', () => {
  const OLD = /FCD34D|0B0F19/i;
  const targets = ['index.html', 'public/manifest.webmanifest', 'assets/icon.svg', ...files('public').filter((f) => /\.(svg|webmanifest|html|js)$/.test(f))];

  it.each([...new Set(targets)])('TCW-5 CA7: %s no contiene #FCD34D ni #0B0F19', (f) => {
    expect(text(f)).not.toMatch(OLD);
  });

  it('TCW-5 CA7: BrandMark.tsx y su CSS ya no tienen círculos, lente ni pupila', () => {
    expect(text('src/components/atoms/BrandMark/BrandMark.tsx')).not.toMatch(/<circle|two circles|pupil|lens/);
    expect(text('src/components/atoms/BrandMark/BrandMark.module.css')).not.toMatch(/pupil|lens|machine/);
  });

  it('TCW-5 CA7: theme-color de index.html y colores del manifest son #111113', () => {
    expect(text('index.html')).toMatch(/<meta name="theme-color" content="#111113"/i);
    const m = JSON.parse(text('public/manifest.webmanifest'));
    expect(m.theme_color).toBe('#111113');
    expect(m.background_color).toBe('#111113');
  });
});

describe('favicon e iconos', () => {
  const SVGS = ['public/icons/icon-192.svg', 'public/icons/icon-512.svg', 'public/icons/maskable-512.svg', 'public/icons/apple-touch-icon.svg', 'assets/icon.svg'];

  it.each(SVGS)('TCW-5 CA8: %s lleva la marca de Ascent exacta sobre fondo #111113', (f) => {
    const svg = text(f);
    for (const d of ASCENT_PATHS) expect(svg).toContain(`d="${d}"`);
    expect(svg).toMatch(/<rect[^>]*x="52"[^>]*y="52"[^>]*width="38"[^>]*height="38"|<rect[^>]*width="38"[^>]*height="38"[^>]*x="52"/);
    expect(svg).toMatch(/fill="#111113"/i);
    expect(svg).not.toContain('<circle');
  });

  it('TCW-5 CA8: el favicon de index.html es el SVG de la marca y apple-touch apunta a un archivo existente', () => {
    const html = text('index.html');
    expect(html).toMatch(/<link rel="icon" href="\/icons\/icon-192\.svg" type="image\/svg\+xml"/);
    const apple = html.match(/<link rel="apple-touch-icon" href="([^"]+)"/)![1];
    expect(existsSync(join('public', apple))).toBe(true);
  });

  const PNGS: [string, number][] = [
    ['public/icons/icon-192.png', 192],
    ['public/icons/icon-512.png', 512],
    ['public/icons/maskable-512.png', 512],
    ['public/icons/apple-touch-icon.png', 180],
  ];

  it.each(PNGS)('TCW-5 CA9: %s existe, es PNG válido de %ipx', (f, size) => {
    expect(existsSync(f)).toBe(true);
    const b = readFileSync(f);
    expect([...b.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(b.readUInt32BE(16)).toBe(size);
    expect(b.readUInt32BE(20)).toBe(size);
  });

  it('TCW-5 CA9: el manifest declara los PNG con sus tamaños y todos los iconos declarados existen', () => {
    const m = JSON.parse(text('public/manifest.webmanifest'));
    const pngs = m.icons.filter((i: { type: string }) => i.type === 'image/png').map((i: { src: string; sizes: string }) => `${i.src} ${i.sizes}`);
    expect(pngs).toEqual(expect.arrayContaining(['/icons/icon-192.png 192x192', '/icons/icon-512.png 512x512', '/icons/maskable-512.png 512x512']));
    for (const i of m.icons) expect(existsSync(join('public', i.src))).toBe(true);
  });

  it('TCW-5 CA9: los PNG de Capacitor existentes se conservan', () => {
    for (const f of ['assets/icon.png', 'assets/splash.png', 'resources/icon.png', 'resources/splash.png']) expect(existsSync(f)).toBe(true);
  });
});
