// Save versions. When the save format changes, SAVE_VERSION goes up, an upgrade from the old version
// is added here, and a sample save of the old version is kept in tests/saves/ for ever.
import { mend, type Mended } from './mend.ts';
import { SAVE_VERSION } from './schema.ts';

type Doc = Record<string, unknown>;

/** UPGRADES[n] turns a version n document into version n + 1. Version 1 is the first. */
export const UPGRADES: Record<number, (doc: Doc) => Doc> = {
  // Version 2 (session 6) adds luck for Uncommon finds and the dates of first finds.
  1: (doc) => {
    if (!isDoc(doc.state)) return doc;
    const clock = Number.isSafeInteger(doc.state.clock) ? (doc.state.clock as number) : 0;
    return { ...doc, state: { ...doc.state, luck: { misses: 0, lastMoment: clock }, found: {} } };
  },
};

export interface Loaded extends Mended {
  /** The version the document was stored in. */
  from: number;
}

const isDoc = (v: unknown): v is Doc => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Reads any stored document: upgrades it to the current version, then mends what is damaged. */
export function load(raw: unknown, now: number): Loaded {
  if (!isDoc(raw)) return { ...mend(raw, now), from: SAVE_VERSION };
  const from = Number.isInteger(raw.version) ? (raw.version as number) : SAVE_VERSION;
  if (from > SAVE_VERSION) throw new Error(`Save version ${from} is newer than this server (${SAVE_VERSION})`);
  let doc = raw;
  for (let v = from; v < SAVE_VERSION; v++) {
    const up = UPGRADES[v];
    if (!up) throw new Error(`No upgrade from save version ${v}`);
    doc = { ...up(doc), version: v + 1 };
  }
  return { ...mend(doc, now), from };
}
