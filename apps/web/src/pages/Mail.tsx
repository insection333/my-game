// Messages (session 45), the second view behind the bell: write a message (to whom, what, and how many of
// its 250 characters are used), then the letters newest first, each with its sender's picture and name
// (which opens their card), when it came, Reply, Delete (with Undo) and Block (asked once); then the
// players blocked, each with Unblock. Opening the view marks the letters read; a letter arriving while it
// is open shows at once. The To field offers the names of those who have written. A reply shows the opening
// words of the letter it answers (session 67).
import { MAIL, NAME_MAX, type InboxResponse, type Letter } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';
import { Button, Field } from '@idle-clash/ui';
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { api, ApiError } from '../api.ts';
import { setUnreadMail, useUnreadMail } from '../game/mail.ts';
import { Slot } from '../slots.tsx';
import { quoteOf, reasonText } from './mail-words.ts';
import { Deleted, LetterRow } from './MailLetter.tsx';
import s from './mail.module.css';

type Note = { text: string; bad: boolean } | null;

const errorText = (err: unknown): string =>
  err instanceof ApiError && err.code === 'tooManyTries' ? t('mail.reason.cooldown') : t('error.other');

/** How long a deleted letter waits, with Undo, before it goes for good. */
const UNDO_MS = 5000;

export function Messages() {
  const [box, setBox] = useState<InboxResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [to, setTo] = useState(() => new URLSearchParams(location.search).get('to') ?? '');
  const [body, setBody] = useState('');
  const [note, setNote] = useState<Note>(null);
  const [busy, setBusy] = useState(false);
  // The message being written stays folded behind one button until wanted (or begun from a card or a reply).
  const [writing, setWriting] = useState(() => to !== '');
  // The letter a reply answers, shown while the message is still to its sender.
  const [answering, setAnswering] = useState<Letter | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const unread = useUnreadMail();
  const names = useId();
  // Letters deleted and still within their Undo: deleted for good when the time runs out or the view closes.
  const [doomed, setDoomed] = useState<number[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const [id, timer] of pending) {
        clearTimeout(timer);
        void api.mail.remove(id).catch(() => undefined);
      }
    };
  }, []);

  const load = () =>
    api.mail.inbox().then(
      (r) => {
        setBox(r);
        setFailed(false);
        // Seen here, so read: the bell clears; the letters keep their New until the view closes.
        if (r.unread > 0)
          void api.mail.read().then(
            () => setUnreadMail(0),
            () => undefined,
          );
      },
      () => setFailed(true),
    );
  // On opening, and whenever a letter arrives while the view is open.
  useEffect(() => {
    if (!box || unread > 0) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread]);
  // Opened to write: the cursor where the words go next (the message once a name is in).
  useEffect(() => {
    if (writing) form.current?.querySelector<HTMLElement>(to ? 'textarea' : 'input')?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writing]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.mail.send(to.trim(), body);
      if (r.ok) {
        setNote({ text: t('mail.sent', { name: to.trim() }), bad: false });
        setBody('');
        setWriting(false);
        setAnswering(null);
      } else setNote({ text: reasonText(r.reason), bad: true });
    } catch (err) {
      setNote({ text: errorText(err), bad: true });
    }
    setBusy(false);
  };
  const reply = (letter: Letter) => {
    setTo(letter.from);
    setAnswering(letter);
    setNote(null);
    if (writing) form.current?.querySelector('textarea')?.focus();
    else setWriting(true);
    form.current?.scrollIntoView({ block: 'nearest' });
  };
  const remove = (id: number) => {
    setDoomed((d) => [...d, id]);
    timers.current.set(
      id,
      setTimeout(() => {
        timers.current.delete(id);
        setBox((b) => b && { ...b, letters: b.letters.filter((l) => l.id !== id) });
        setDoomed((d) => d.filter((x) => x !== id));
        api.mail.remove(id).catch(() => void load());
      }, UNDO_MS),
    );
  };
  const undo = (id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setDoomed((d) => d.filter((x) => x !== id));
  };
  // Ctrl or Cmd with Enter sends, as in any mail.
  const sendKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      form.current?.requestSubmit();
    }
  };
  const writers = [...new Set(box?.letters.filter((l) => !l.realm).map((l) => l.from) ?? [])];
  const block = (name: string, blocked: boolean) =>
    api.mail.block(name, blocked).then(
      (r) => {
        setBox(r);
        setNote({ text: t(blocked ? 'mail.blockedDone' : 'mail.unblockedDone', { name }), bad: false });
      },
      (err: unknown) => setNote({ text: errorText(err), bad: true }),
    );

  const muted = box?.mutedUntil ?? null;
  return (
    <Slot id="tray.mail" className={s.mail}>
      {muted ? (
        <p className={s.muted}>{t('mail.muted', { date: fmt.date(muted) })}</p>
      ) : !writing ? (
        <div className={s.bar}>
          <Button
            variant="primary"
            onClick={() => {
              setNote(null);
              setWriting(true);
            }}
          >
            {t('mail.write')}
          </Button>
        </div>
      ) : (
        <form
          ref={form}
          className={s.write}
          onSubmit={(e) => void submit(e)}
          onKeyDown={sendKey}
          aria-label={t('mail.write')}
        >
          <Field
            label={t('mail.to')}
            value={to}
            maxLength={NAME_MAX}
            autoComplete="off"
            list={names}
            onChange={(e) => setTo(e.target.value)}
            required
          />
          <datalist id={names}>
            {writers.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          {answering && answering.from === to.trim() && (
            <blockquote className={s.quote} data-part="answering">
              <span className={s.quoteWho}>{t('mail.replyingTo', { name: answering.from })}</span>
              <span className={s.quoteText}>{quoteOf(answering.body)}</span>
            </blockquote>
          )}
          <Field
            label={t('mail.body')}
            rows={3}
            value={body}
            maxLength={MAIL.MAX_CHARS}
            hint={t('mail.counter', { n: fmt.int(body.length), max: fmt.int(MAIL.MAX_CHARS) })}
            onChange={(e) => setBody(e.target.value)}
            required
          />
          <div className={s.send}>
            <Button
              variant="quiet"
              onClick={() => {
                setWriting(false);
                setAnswering(null);
              }}
            >
              {t('mail.cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={busy || !to.trim() || !body.trim()}>
              {busy ? t('mail.sending') : t('mail.send')}
            </Button>
          </div>
        </form>
      )}
      <p className={note?.bad ? s.bad : s.good} role="status" aria-live="polite">
        {note?.text}
      </p>
      {!box ? (
        <p className={s.note}>{failed ? t('error.other') : t('mail.reading')}</p>
      ) : box.letters.length === 0 ? (
        <p className={s.note}>{t('mail.empty')}</p>
      ) : (
        <ul className={s.letters}>
          {box.letters.map((l) =>
            doomed.includes(l.id) ? (
              <Deleted key={l.id} from={l.from} undo={() => undo(l.id)} />
            ) : (
              <LetterRow
                key={l.id}
                letter={l}
                canWrite={!muted}
                reply={reply}
                remove={remove}
                block={(n) => void block(n, true)}
              />
            ),
          )}
        </ul>
      )}
      {box && box.letters.length > 0 && <p className={s.kept}>{t('mail.kept', { n: fmt.int(MAIL.INBOX) })}</p>}
      {box && box.blocked.length > 0 && (
        <section className={s.blocked} aria-label={t('mail.blocked')}>
          <h3>{t('mail.blocked')}</h3>
          <p className={s.kept}>{t('mail.blocked.note')}</p>
          <ul>
            {box.blocked.map((name) => (
              <li key={name}>
                <span>{name}</span>
                <Button variant="quiet" onClick={() => void block(name, false)}>
                  {t('mail.unblock')}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Slot>
  );
}
