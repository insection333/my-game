// The tour (IA.md): on a newcomer's first visit to the Hearth, four short pointers, each at a slot by
// name, never at a layout class. It blocks nothing: the first points at the first step's button, and
// pressing that button moves the tour on as Next does. Skip ends it; it does not come back.
import { t } from '@idle-clash/content';
import { Button } from '@idle-clash/ui';
import { useEffect, useState } from 'react';
import { useGame } from '../game/hooks.ts';
import s from './tour.module.css';

const STEPS = [
  { slot: 'hearth.goals', key: 'tour.goals' },
  { slot: 'shell.lane', key: 'tour.lanes' },
  { slot: 'shell.fire', key: 'tour.fire' },
  { slot: 'shell.tray', key: 'tour.notices' },
] as const;

const DONE_KEY = 'tourDone';
const done = () => {
  try {
    return localStorage.getItem(DONE_KEY) === '1';
  } catch {
    return false;
  }
};
const finish = () => {
  try {
    localStorage.setItem(DONE_KEY, '1');
  } catch {
    /* It may show again next visit; it is short. */
  }
};

/** The first shown element filling a slot. */
function target(slot: string): DOMRect | null {
  for (const el of Array.from(document.querySelectorAll(`[data-slot="${slot}"]`))) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return r;
  }
  return null;
}

export function Tour() {
  const { state } = useGame();
  // Only a newcomer: nothing claimed and no XP yet.
  const fresh = Object.keys(state.skills).length === 0;
  const [asked, setStep] = useState<number | null>(() => (fresh && !done() ? 0 : null));
  const [box, setBox] = useState<DOMRect | null>(null);
  // Starting the first step is the tour's first answer: it moves on by itself.
  const step = asked === 0 && !fresh ? 1 : asked;
  useEffect(() => {
    if (step === null) return;
    const place = () => setBox(target(STEPS[step].slot));
    place();
    window.addEventListener('resize', place);
    const again = setInterval(place, 500);
    return () => {
      window.removeEventListener('resize', place);
      clearInterval(again);
    };
  }, [step]);
  if (step === null || !box) return null;
  const end = () => {
    finish();
    setStep(null);
  };
  const next = () => (step + 1 < STEPS.length ? setStep(step + 1) : end());
  const below = box.bottom + 160 < window.innerHeight;
  const left = Math.max(12, Math.min(window.innerWidth - 300 - 12, box.left));
  return (
    <>
      <div
        className={s.ring}
        aria-hidden="true"
        style={{ top: box.top - 4, left: box.left - 4, width: box.width + 8, height: box.height + 8 }}
      />
      <div
        className={s.card}
        role="dialog"
        aria-label={t('tour.title')}
        data-tour-step={step + 1}
        style={below ? { top: box.bottom + 10, left } : { bottom: window.innerHeight - box.top + 10, left }}
      >
        <p>{t(STEPS[step].key)}</p>
        <div className={s.buttons}>
          <Button variant="quiet" onClick={end}>
            {t('tour.skip')}
          </Button>
          <Button variant="primary" onClick={next}>
            {step + 1 < STEPS.length ? t('tour.next') : t('tour.done')}
          </Button>
        </div>
      </div>
    </>
  );
}
