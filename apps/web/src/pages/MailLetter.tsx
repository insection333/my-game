// One letter in the inbox (session 45): the sender's picture and name (which opens their card), New while
// unread, when it came, and the words; then Reply, Delete and Block. Block asks once, in the row, since it
// also clears their letters; a letter just deleted leaves a line with Undo for a few seconds. The game's
// own letters (an admin's warning) come from the keepers of the realm under the game's mark, and are
// neither answered nor blocked.
import type { Letter } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';
import { Button, GameMark, Picture, Pill } from '@idle-clash/ui';
import { useState } from 'react';
import { NameLink } from './ProfileSheet.tsx';
import s from './mail.module.css';

/** When a letter came: the time today, the day and time before that (the year only from another). */
const when = (at: number): string => fmt.when(at, Date.now());

export function LetterRow({
  letter: l,
  canWrite,
  reply,
  remove,
  block,
}: {
  letter: Letter;
  /** False while muted: there is no answering then. */
  canWrite: boolean;
  reply: (name: string) => void;
  remove: (id: number) => void;
  block: (name: string) => void;
}) {
  const [asking, setAsking] = useState(false);
  return (
    <li className={s.letter} data-unread={l.read ? undefined : ''} data-realm={l.realm ? '' : undefined}>
      {l.realm ? (
        <span className={s.seal}>
          <GameMark size={32} />
        </span>
      ) : (
        <Picture picture={l.look?.picture ?? 'forester'} frame={l.look?.frame} glow={l.look?.glow} size={48} />
      )}
      <div className={s.main}>
        <p className={s.head}>
          <span className={s.from}>{l.realm ? t('mail.realm') : <NameLink name={l.from} />}</span>
          {!l.read && <Pill tone="gold">{t('mail.new')}</Pill>}
          <time className={s.at} dateTime={new Date(l.at).toISOString()}>
            {when(l.at)}
          </time>
        </p>
        <p className={s.body}>{l.body}</p>
        {asking ? (
          <div className={s.ask} role="group" aria-label={t('mail.block')}>
            <p>{t('mail.blockAsk', { name: l.from })}</p>
            <div className={s.actions}>
              <Button variant="primary" onClick={() => block(l.from)}>
                {t('mail.block')}
              </Button>
              <Button variant="quiet" onClick={() => setAsking(false)}>
                {t('mail.keep')}
              </Button>
            </div>
          </div>
        ) : (
          <div className={s.actions}>
            {!l.realm && canWrite && (
              <Button variant="quiet" onClick={() => reply(l.from)}>
                {t('mail.reply')}
              </Button>
            )}
            <Button variant="quiet" onClick={() => remove(l.id)}>
              {t('mail.delete')}
            </Button>
            {!l.realm && (
              <Button variant="quiet" onClick={() => setAsking(true)}>
                {t('mail.block')}
              </Button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/** Where a letter was, just deleted: Undo for a few seconds before it goes for good. */
export function Deleted({ from, undo }: { from: string; undo: () => void }) {
  return (
    <li className={s.deleted}>
      <span>{from ? t('mail.deleted', { name: from }) : t('mail.deletedRealm')}</span>
      <Button variant="quiet" onClick={undo}>
        {t('mail.undo')}
      </Button>
    </li>
  );
}
