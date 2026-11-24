// The console's audit log says every action the server records in words (session 228), and the directory
// keeps its search, kind, order and page in the address, so a view can be kept or passed on.
import { describe, expect, it } from 'vitest';
import { actionWords, detailWords } from '../src/console/Audit.tsx';
import { hrefOf } from '../src/console/Directory.tsx';

describe("the console's words and addresses", () => {
  it('says every action the server records, and a rename by its names', () => {
    for (const a of ['rename', 'ban', 'unban', 'mend', 'resetPassword', 'dismissReports', 'warn', 'mute', 'unmute'])
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
