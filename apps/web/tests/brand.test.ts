// The site's icon: drawn from the game's mark at build time, and its PNG sizes made from it.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { markSvg } from '../brand.tsx';

const pngSize = (file: string) => {
  const b = readFileSync(join(import.meta.dirname, '..', 'public', file));
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

describe('the site icon', () => {
  it('is the fire on its seal, drawn as one SVG', () => {
    const svg = markSvg();
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 48 48">/);
    expect(svg).toContain('#d4511f');
    expect(svg).not.toContain('undefined');
  });

  it('has the PNG sizes phones ask for, as the manifest names them', () => {
    const manifest = JSON.parse(
      readFileSync(join(import.meta.dirname, '..', 'public', 'manifest.webmanifest'), 'utf8'),
    ) as {
      icons: { src: string; sizes: string }[];
    };
    for (const icon of manifest.icons.filter((i) => i.src.endsWith('.png')))
      expect(pngSize(icon.src.slice(1)).join('x')).toBe(icon.sizes);
    expect(pngSize('icon-180.png')).toEqual([180, 180]);
  });
});
