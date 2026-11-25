// Go to (session 233): opened by Ctrl K or ⌘ K anywhere in the console, or by / where nothing is typed.
import { describe, expect, it } from 'vitest';
import { goToKey, opensGoTo } from '../src/console/GoTo.tsx';

const key = (key: string, more: Partial<KeyboardEvent> = {}, tagName = 'BODY') =>
  ({
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    target: { tagName, isContentEditable: false },
    ...more,
  }) as Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'target'>;

describe('Go to', () => {
  it('opens by Ctrl K or ⌘ K anywhere, and by / where nothing is typed', () => {
    expect(opensGoTo(key('k', { ctrlKey: true }))).toBe(true);
    expect(opensGoTo(key('K', { metaKey: true }, 'INPUT'))).toBe(true);
    expect(opensGoTo(key('/'))).toBe(true);
    expect(opensGoTo(key('/', {}, 'INPUT'))).toBe(false);
    expect(opensGoTo(key('/', {}, 'TEXTAREA'))).toBe(false);
    expect(opensGoTo(key('k'))).toBe(false);
    expect(opensGoTo(key('k', { ctrlKey: true, altKey: true }))).toBe(false);
  });

  it('names its key as the device writes it', () => {
    expect(goToKey('MacIntel')).toBe('⌘ K');
    expect(goToKey('Win32')).toBe('Ctrl K');
  });
});
