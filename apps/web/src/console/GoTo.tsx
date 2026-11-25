// Go to (session 233): from anywhere in the console, Ctrl K (⌘ K) or / opens a sheet to go straight to a
// section or a player by name, where finding a player meant opening Players and searching there. The
// sections match as typed; players are asked of the directory once typing pauses, from two letters, at
// most eight, so the sheet adds a light read only when one is wanted. Enter opens the first.
import type { DirectoryRow } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';
import { Field, Sheet, TextLink } from '@idle-clash/ui';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../api.ts';
import { handled } from '../game/session.ts';
import { navigate } from '../router.ts';
import s from './pages.module.css';

export interface Place {
  href: string;
  label: string;
  /** A player's total level; a section has none. */
  note?: string;
}

/** How long typing pauses before players are asked for, and the most shown. */
const PAUSE_MS = 250;
const SHOWN = 8;

/** The key that opens Go to as this device writes it: ⌘ K on a Mac or an iPad, Ctrl K elsewhere. */
export const goToKey = (platform: string) =>
  /Mac|iPhone|iPad/.test(platform) ? t('console.goto.keyMac') : t('console.goto.key');

/** Whether a key press opens Go to: Ctrl K or ⌘ K anywhere, or / where nothing is being typed. */
export function opensGoTo(e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'target'>): boolean {
  if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') return true;
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return false;
  const el = e.target as HTMLElement | null;
  return !(el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)));
}

export function GoTo({ sections, onClose }: { sections: Place[]; onClose: () => void }) {
  const [typed, setTyped] = useState('');
  // The players found, with the words they were found for: those found for other words are not shown.
  const [found, setFound] = useState<{ words: string; rows: DirectoryRow[] }>({ words: '', rows: [] });
  const form = useRef<HTMLFormElement>(null);
  // The sheet takes the focus as it opens; the box takes it from the sheet.
  useEffect(() => void requestAnimationFrame(() => form.current?.querySelector('input')?.focus()), []);
  const words = typed.trim().toLowerCase();
  useEffect(() => {
    if (words.length < 2) return;
    const at = setTimeout(() => {
      api.admin.directory({ query: words, filter: 'all', sort: 'name', page: 0 }).then(
        (r) => setFound({ words, rows: r.rows.slice(0, SHOWN) }),
        (err: unknown) => void handled(err),
      );
    }, PAUSE_MS);
    return () => clearTimeout(at);
  }, [words]);
  const places: Place[] = [
    ...sections.filter((x) => !words || x.label.toLowerCase().includes(words)),
    ...(words.length < 2 || found.words !== words ? [] : found.rows).map((p) => ({
      href: `/admin/players/${encodeURIComponent(p.id)}`,
      label: p.name,
      note: t('console.goto.level', { level: fmt.int(p.totalLevel) }),
    })),
  ];
  const go = (href: string) => {
    onClose();
    navigate(href);
  };
  const first = (e: FormEvent) => {
    e.preventDefault();
    if (places[0]) go(places[0].href);
  };
  return (
    <Sheet title={t('console.goto')} closeLabel={t('console.goto.close')} onClose={onClose}>
      <form ref={form} className={`${s.stack} ${s.inSheet}`} onSubmit={first} role="search">
        <Field
          label={t('console.goto.field')}
          hint={t('console.goto.hint')}
          value={typed}
          maxLength={64}
          autoComplete="off"
          onChange={(e) => setTyped(e.target.value)}
        />
        {places.length ? (
          <ul className={s.places} aria-label={t('console.goto.found')}>
            {places.map((x) => (
              <li key={x.href}>
                <TextLink href={x.href} onNavigate={go}>
                  {x.label}
                </TextLink>
                {x.note && <span className={s.muted}>{x.note}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className={s.note}>{t('console.goto.none')}</p>
        )}
      </form>
    </Sheet>
  );
}
