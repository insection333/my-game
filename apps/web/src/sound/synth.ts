// The game's sounds, made in code with the Web Audio API: nothing to download, nothing licensed.
// Everything is soft: a quiet master level, gentle attacks, and bells that ring down rather than
// stop. The audio context is made only once a player switches sound on (a press, as browsers ask).
import type { Cue, WorkCue } from './cues.ts';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (typeof AudioContext === 'undefined') return null;
  if (!ctx || !master) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.22;
    // A gentle low-pass takes the edge off every cue.
    const soften = ctx.createBiquadFilter();
    soften.type = 'lowpass';
    soften.frequency.value = 5200;
    master.connect(soften).connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return { ctx, out: master };
}

/** Called from the press that switches sound on, so the browser lets it start. */
export function unlockAudio(): void {
  audio();
}

/** A bell: a sine and quieter overtones, struck softly and ringing down. */
function bell(freq: number, at: number, ring: number, level: number) {
  const a = audio();
  if (!a) return;
  const t0 = a.ctx.currentTime + at;
  for (const [mult, share] of [
    [1, 1],
    [2, 0.28],
    [3.01, 0.08],
  ]) {
    const osc = a.ctx.createOscillator();
    const g = a.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq * mult;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(level * share, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + ring);
    osc.connect(g).connect(a.out);
    osc.start(t0);
    osc.stop(t0 + ring + 0.05);
  }
}

/** A short knock: filtered noise for wood, a damped high tone for metal, a low thump for a blow. */
function knock(kind: WorkCue) {
  const a = audio();
  if (!a) return;
  const vary = 0.94 + Math.random() * 0.12;
  if (kind === 'strike') {
    bell(1320 * vary, 0, 0.18, 0.05);
    return;
  }
  const len = Math.floor(a.ctx.sampleRate * 0.09);
  const buf = a.ctx.createBuffer(1, len, a.ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const src = a.ctx.createBufferSource();
  src.buffer = buf;
  const band = a.ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = (kind === 'chop' ? 420 : 160) * vary;
  band.Q.value = kind === 'chop' ? 4 : 2;
  const g = a.ctx.createGain();
  g.gain.value = kind === 'chop' ? 0.55 : 0.7;
  src.connect(band).connect(g).connect(a.out);
  src.start(a.ctx.currentTime);
}

// A pentatonic scale on D: whatever plays together stays in tune.
const D = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99, 880];

export function play(cue: Cue): void {
  switch (cue) {
    case 'legendary':
      [0, 2, 4, 5, 8].forEach((n, i) => bell(D[n], i * 0.11, 2.2, 0.16));
      break;
    case 'level':
      [3, 5, 8].forEach((n, i) => bell(D[n], i * 0.12, 1.6, 0.14));
      break;
    case 'rare':
      bell(D[6], 0, 1.4, 0.12);
      bell(D[8], 0.09, 1.6, 0.1);
      break;
    case 'newFind':
      bell(D[5], 0, 1.1, 0.1);
      bell(D[7], 0.08, 1.2, 0.08);
      break;
    case 'mastery':
      bell(D[4], 0, 1, 0.09);
      break;
    case 'goal':
      bell(D[3], 0, 0.8, 0.09);
      bell(D[5], 0.1, 1, 0.09);
      break;
    case 'stopped':
      bell(D[3], 0, 0.7, 0.07);
      bell(D[1], 0.14, 0.9, 0.07);
      break;
  }
}

let lastWork = 0;
/** At most one work sound every second and a half, however many lanes land. */
export function playWork(kind: WorkCue): void {
  const now = performance.now();
  if (now - lastWork < 1500) return;
  lastWork = now;
  knock(kind);
}
