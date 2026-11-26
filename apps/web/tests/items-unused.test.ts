// What an item used nowhere says under Used in (session 111): "Nothing yet." promised a use to twenty
// Uncommon finds (a bird's nest, a raider's war-horn) that are kept to be sold, and have none to come. Since
// session 244 every Uncommon find raises the steading's later stages, so none is used nowhere today.
import { t } from '@idle-clash/content';
import { FEATURES, items } from '@idle-clash/features';
import { describe, expect, it } from 'vitest';

describe('an item used nowhere', () => {
  it('is a find kept to sell, and its panel says so without promising a use', () => {
    const unused = items.catalog(FEATURES).filter((i) => items.usedIn(FEATURES, i.id).length === 0);
    for (const i of unused) expect(i).toMatchObject({ kind: 'find', value: expect.any(Number) as number });
    expect(unused.every((i) => i.value > 0)).toBe(true);
    expect(t('item.panel.unused')).toBe('Nothing; it is kept to sell.');
    expect(t('item.panel.nothing')).not.toMatch(/yet/);
  });
});
