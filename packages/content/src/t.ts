// t(key, params): every player-facing word comes from the strings file through here. A missing key,
// a missing parameter or an unused one throws, so a broken string fails the content check.
import { en } from './strings/en.ts';

export type Params = Record<string, string>;

let used: Set<string> | null = null;

/** Records every key t() is asked for until stopped; the content check uses this to find unused strings. */
export function trackStrings(): { stop: () => Set<string> } {
  const set = new Set<string>();
  used = set;
  return {
    stop: () => {
      used = null;
      return set;
    },
  };
}

export const hasString = (key: string): boolean => Object.hasOwn(en, key);
export const templateOf = (key: string): string | undefined => (hasString(key) ? en[key] : undefined);
export const allStringKeys = (): string[] => Object.keys(en);

/** The placeholder names in a template, such as ["pct"] for "{pct} faster". */
export const placeholders = (template: string): string[] => [...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);

export function t(key: string, params: Params = {}): string {
  if (!hasString(key)) throw new Error(`Missing string "${key}"`);
  used?.add(key);
  const template = en[key];
  const wanted = placeholders(template);
  for (const p of Object.keys(params)) {
    if (!wanted.includes(p)) throw new Error(`String "${key}" has no {${p}}`);
  }
  return template.replace(/\{(\w+)\}/g, (_, p: string) => {
    if (!Object.hasOwn(params, p)) throw new Error(`String "${key}" needs {${p}}`);
    return params[p];
  });
}
