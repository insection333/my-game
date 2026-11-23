// Kindling's gifts (session 219): a seal's sixth Kindling sets an ornament at the foot of its rim; any skill's
// eighth opens the Kindled frame; each skill's tenth its own title ("Kindled Woodcutter").
import { t } from '@idle-clash/content';
import { FEATURES } from '@idle-clash/features';
import { deedList } from '../../../packages/features/src/deeds/list.ts';
import { ItemIcon } from '@idle-clash/ui';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import '../src/late-icons.ts';
import { HONOURS } from '../../../packages/features/src/deeds/honours.ts';

void FEATURES;
const seal = (kindlings: number) =>
  renderToStaticMarkup(createElement(ItemIcon, { name: 'woodcutting', seal: { tier: 8, top: true, kindlings } }));

describe("Kindling's gifts", () => {
  it('sets an ornament on a seal from its sixth Kindling', () => {
    expect(seal(5)).not.toContain('data-ornament');
    expect(seal(6)).toContain('data-ornament');
  });

  it('opens the Kindled frame at any eighth Kindling, and a title for each skill at its tenth', () => {
    const ids = new Set(deedList().map((d) => d.id));
    expect(ids.has('kindled-mining-8') && ids.has('kindled-mining-10')).toBe(true);
    const frame = HONOURS.find((h) => h.kind === 'frame' && h.id === 'kindled')!;
    expect(frame.unlock && 'anyOf' in frame.unlock && frame.unlock.anyOf()).toContain('kindled-cooking-8');
    const title = HONOURS.find((h) => h.kind === 'title' && h.id === 'kindled-woodcutting')!;
    expect(title.unlock).toEqual({ deed: 'kindled-woodcutting-10' });
    expect(t('honour.title.kindled-woodcutting')).toBe('Kindled Woodcutter');
  });
});
