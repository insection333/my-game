// The console's audit log says every action the server records in words (session 228), the directory
// keeps its search, kind, order and page in the address, and Give and take reads names and amounts as a
// person writes them (session 229).
import { describe, expect, it } from 'vitest';
import { actionWords, detailWords } from '../src/console/Audit.tsx';
import { hrefOf } from '../src/console/Directory.tsx';
import { amountOf, idByName } from '../src/console/RecordGrants.tsx';

describe("the console's words and addresses", () => {
  it('says every action the server records, and a rename by its names', () => {
    for (const a of [
      'rename',
      'ban',
      'unban',
      'mend',
      'resetPassword',
      'dismissReports',
      'warn',
      'mute',
      'unmute',
      'give',
      'take',
      'xp',
      'signOut',
      'delete',
    ])
      expect(actionWords(a)).not.toBe(a);
    expect(detailWords({ action: 'rename', detail: { from: 'Rowan', to: 'Rowanberry' } })).toBe(
      'From Rowan to Rowanberry',
    );
    expect(detailWords({ action: 'ban', detail: null })).toBe('');
  });

  it('keeps the directory in its address, and leaves out what is as it starts', () => {
    expect(hrefOf({ query: '', filter: 'all', sort: 'joined', page: 0 })).toBe('/admin/players');
    expect(hrefOf({ query: 'haz el', filter: 'banned', sort: 'level', page: 2 })).toBe(
      '/admin/players?q=haz+el&show=banned&sort=level&page=2',
    );
  });
});

describe("the record's Give and take", () => {
  it('takes an item by its name in any case, and an amount written as a person would', () => {
    const list = [
      { id: 'gold', name: 'Gold' },
      { id: 'oak-logs', name: 'Oak logs' },
    ];
    expect(idByName(list, ' oak LOGS ')).toBe('oak-logs');
    expect(idByName(list, 'oak')).toBeNull();
    expect([amountOf('1,000'), amountOf('250'), amountOf('0'), amountOf('-5'), amountOf('1.5'), amountOf('x')]).toEqual(
      [1000, 250, null, null, null, null],
    );
    expect(amountOf('2000000000')).toBeNull();
  });
});
