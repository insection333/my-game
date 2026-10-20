// The moments region: the centre for big moments, a stack at the bottom for banners and toasts.
// Each goes by itself a few seconds after its last event; a centre moment can also be closed.
import { t } from '@idle-clash/content';
import { Button, ItemIcon, Moment } from '@idle-clash/ui';
import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../game/hooks.ts';
import { momentsFrom } from './moments.ts';
import s from './shell.module.css';

export function Moments() {
  const { events, now, features } = useGame();
  // Only what happens from here on: events already in the view when the page opened are not news.
  const [since] = useState(now);
  const [closed, setClosed] = useState<string[]>([]);
  const [clock, setClock] = useState(now);
  const all = useMemo(() => momentsFrom(events, since, features), [events, since, features]);
  const at = Math.max(now, clock);
  const showing = all.filter((m) => m.until > at && !closed.includes(m.key));

  // The game's clock stops when nothing is moving; this one runs only while a moment shows.
  useEffect(() => {
    if (!showing.length) return;
    const next = Math.min(...showing.map((m) => m.until));
    const id = setTimeout(() => setClock(next), Math.max(0, next - at));
    return () => clearTimeout(id);
  }, [showing, at]);

  const centre = showing.filter((m) => m.size === 'centre').at(-1);
  const stack = showing.filter((m) => m.size !== 'centre').slice(-3);
  return (
    <div data-slot="shell.moment" aria-live="polite" className={s.moments}>
      {centre && (
        <div className={s.centreMoment}>
          <Moment
            size="centre"
            title={centre.title}
            body={centre.body ?? undefined}
            icon={centre.icon ? <ItemIcon name={centre.icon} size={96} /> : undefined}
            action={
              <Button variant="quiet" onClick={() => setClosed((c) => [...c, centre.key])}>
                {t('moment.close')}
              </Button>
            }
          />
        </div>
      )}
      {stack.map((m) => (
        <Moment
          key={m.key}
          size={m.size}
          title={m.title}
          body={m.body ?? undefined}
          icon={m.icon ? <ItemIcon name={m.icon} size={m.size === 'toast' ? 32 : 48} /> : undefined}
        />
      ))}
    </div>
  );
}
