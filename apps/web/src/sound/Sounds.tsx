// Plays the game's sounds for a player who switched them on in Settings: a soft cue for each moment
// as it happens (the best one when several land together), and, for "Also each action", a small
// knock as a lane's work lands, never more than one every second and a half. Nothing plays for what
// happened before the page opened, and browsers let sound start only after a press on the page.
import type { GameEvent } from '@idle-clash/kernel';
import { useEffect, useRef, useState } from 'react';
import { onGains } from '../game/gains.ts';
import { useGame } from '../game/hooks.ts';
import { bestCue, readSound, workCue } from './cues.ts';
import { play, playWork, unlockAudio } from './synth.ts';

const keyOf = (e: GameEvent) => `${e.type}:${e.at}:${JSON.stringify(e)}`;

export function Sounds() {
  const { events, now } = useGame();
  const [since] = useState(now);
  const heard = useRef(new Set<string>());

  useEffect(() => {
    if (readSound() === 'off') return;
    const fresh = events.filter((e) => e.at >= since && !heard.current.has(keyOf(e)));
    for (const e of fresh) heard.current.add(keyOf(e));
    if (heard.current.size > 300) heard.current = new Set([...heard.current].slice(-100));
    const cue = bestCue(fresh);
    if (cue) play(cue);
  }, [events, since]);

  useEffect(
    () =>
      onGains((gains) => {
        if (readSound() !== 'all') return;
        const xp = gains.find((g) => g.kind === 'xp');
        if (xp) playWork(workCue(xp.skill));
      }),
    [],
  );

  // The first press on the page lets sound start, for a player who has it on.
  useEffect(() => {
    const first = () => {
      if (readSound() !== 'off') unlockAudio();
    };
    window.addEventListener('pointerdown', first, { once: true });
    return () => window.removeEventListener('pointerdown', first);
  }, []);

  return null;
}
