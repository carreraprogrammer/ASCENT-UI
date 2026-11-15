// TCW-1 fase 5: Ascent wears the brand of The Cyborg Way. The tokens of the design system are the only source of
// colour (no hex outside src/theme/tcw.css, which is generated), the type is the brand's and served by the app,
// and every text colour pair passes WCAG AA (4.5:1) in both themes.
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const tokens = JSON.parse(readFileSync('src/theme/tcw-tokens.json', 'utf8'));
const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

const files = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? files(path) : [path];
});

const theme = (mode: 'dark' | 'light') => Object.fromEntries(
  [...tokens.color.tokens, ...tokens.categorical.tokens].map((t: { name: string; value: Record<string, string> }) => [t.name, t.value[mode]]),
);

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('brand of The Cyborg Way', () => {
  it('has no hex colour outside the generated tokens', () => {
    const found = files('src')
      .filter((f) => /\.(css|ts|tsx)$/.test(f) && !f.endsWith('tcw.css') && !f.endsWith('brand.test.ts'))
      .flatMap((f) => (readFileSync(f, 'utf8').match(HEX) ?? []).map((h) => `${f}: ${h}`));
    expect(found).toEqual([]);
  });

  it('generates tcw.css from tcw-tokens.json', () => {
    expect(() => execSync('node scripts/build-tokens.mjs --check', { stdio: 'pipe' })).not.toThrow();
  });

  it('serves its own fonts: Inter Tight and Geist Mono, no Google Fonts', () => {
    const fonts = readFileSync('src/theme/fonts.css', 'utf8');
    expect(fonts).toContain("font-family: 'Inter Tight'");
    expect(fonts).toContain("font-family: 'Geist Mono'");
    const everything = [readFileSync('index.html', 'utf8'), ...files('src').filter((f) => /\.(css|tsx?)$/.test(f)).map((f) => readFileSync(f, 'utf8'))].join('\n');
    expect(everything).not.toMatch(/fonts\.googleapis|fonts\.gstatic/);
  });

  it.each(['dark', 'light'] as const)('passes AA for every text pair in the %s theme', (mode) => {
    const c = theme(mode);
    const pairs: [string, string][] = [];
    for (const ground of ['bg', 'surface', 'surface-raised']) {
      for (const text of ['ink', 'ink-muted', 'violet', 'data-lexical', 'data-semantic', 'data-both', 'danger',
                          'cat-rose', 'cat-gold', 'cat-lime', 'cat-sky', 'cat-sand', 'cat-sage', 'cat-slate', 'cat-coral']) {
        pairs.push([text, ground]);
      }
    }
    pairs.push(['on-violet', 'violet'], ['ink', 'violet-soft']);
    const failing = pairs.filter(([text, ground]) => contrast(c[text], c[ground]) < 4.5)
      .map(([text, ground]) => `${text} on ${ground}: ${contrast(c[text], c[ground]).toFixed(2)}`);
    expect(failing).toEqual([]);
  });
});
