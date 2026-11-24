// The views steps 6 to 9 open (split from session.ts, session 224): every row of IA.md's "Visible without
// scrolling" tables, the sheets, and the pages each player of the run is seen on.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../exec.ts';
import { readPageMap, type ViewSpec } from '../ia.ts';
import { SHEETS } from './sheets.ts';

/** Welcome views are opened signed out; every other view as the run's newcomer, or its veteran. */
export const signedOut = (path: string) => path.startsWith('/welcome');

export interface View extends ViewSpec {
  /** A short name for files and reports. */
  name: string;
}

/** Views to open: every row of IA.md's "Visible without scrolling" tables, and the sheets (the tray, an item, settings). */
export function views(): View[] {
  const map = readPageMap(readFileSync(join(ROOT, 'IA.md'), 'utf8'));
  const sheets = SHEETS;
  /** The page a path is on, for its spec on the review sheets. */
  const pageOf = (path: string, otherwise: string) =>
    map.views.find((v) => v.path === path)?.page ??
    ([
      ['/skills/', 'Skill'],
      ['/hiscores', 'Hiscores'],
      ['/combat', 'Combat'],
      ['/castle', 'Castle Clash'],
    ].find(([p]) => path.startsWith(p))?.[1] ||
      otherwise);
  // The same pages for a player three weeks in, whose rows carry odds, pills and long names.
  const veteran: ViewSpec[] = [
    ...map.views.filter((v) => !signedOut(v.path)).map((v) => ({ ...v, as: 'veteran' as const })),
    { page: 'Combat', path: '/combat?panel=gear&slot=weapon', phone: [], desktop: [], as: 'veteran' },
    // A region still ahead: its foes locked, each saying the Hitpoints level that opens it.
    { page: 'Combat', path: '/combat?region=peaks', phone: [], desktop: [], as: 'veteran' },
    { page: 'Skill', path: '/skills/melee', phone: [], desktop: [], as: 'veteran' },
    { page: 'Storehouse', path: '/storehouse?panel=item&item=carved-acorn', phone: [], desktop: [], as: 'veteran' },
  ];
  // Two months into the climb, in the Sunken Fen: the longest names and the largest numbers.
  const elders: ViewSpec[] = [
    '/',
    // A work half raised: its next raising, part of its cost held and part not.
    '/?panel=work&work=smokehouse',
    // The pedlar's wants of the day (session 217), from what two months of play have found, gathered and cooked.
    '/?panel=pedlar',
    '/skills',
    '/skills/mining',
    '/skills/fishing',
    '/skills/cooking',
    '/skills/runecraft',
    '/skills/fletching',
    '/combat',
    '/storehouse',
    // The Castles ladder, with the elder's castle and the keeper's on it.
    '/hiscores?skill=castle',
    // This season's ladder (session 165): goals done since it opened, a squire new this season beside veterans.
    '/hiscores?skill=season',
    // A player's sheet, with Report this player.
    '/hiscores?panel=player&name=Keeper',
    // Messages behind the bell: letters read and unread, Reply, Delete and Block, and a player blocked.
    '/?panel=tray&tray=mail',
    // Deeds two months in: honours open, families half done, a sheet of choices.
    '/hiscores/deeds',
    '/hiscores/deeds?view=skills',
    '/hiscores/deeds?view=combat',
    '/hiscores/deeds?panel=honours',
    // Expeditions two months in: the Fen's longest route, the bosses and the relics.
    '/combat/expeditions?region=fen&hours=8',
    // Castle Clash weeks after raising: every tab (the War first, the Reports last), and the account of a siege on the elder
    // (report 6: castles.ts).
    '/castle',
    '/castle/army',
    '/castle/citadel',
    '/castle?panel=report&report=6',
    '/castle/halls',
    // The Reports tab (session 42): every report as a card, and one filter.
    '/castle/reports',
    '/castle/reports?show=spies',
  ].map((path) => ({ page: pageOf(path, 'Hearth'), path, phone: [], desktop: [], as: 'elder' as const }));
  // A year in: skills at 99, kindled, walking their Paths; the ladder that counts Kindlings; and a castle a
  // year in (session 139): every troop at its fourth evolution, the Halls full; and every relic raised, the
  // quartermaster leading (session 191).
  const keepers: ViewSpec[] = [
    '/skills',
    '/skills/woodcutting',
    '/skills/hitpoints',
    '/hiscores?skill=woodcutting',
    // The Deep's ladder of the week (session 214), the keeper among those who went down.
    '/hiscores?skill=deep',
    '/hiscores?skill=kindlings',
    '/combat/expeditions',
    '/castle',
    '/castle/army',
    '/castle/halls',
  ].map((path) => ({ page: pageOf(path, 'Skills'), path, phone: [], desktop: [], as: 'keeper' as const }));
  // Two years in (session 224): every skill kindled, the Deep's relics, tempered dawnsteel, the legend under way.
  const sages: ViewSpec[] = [
    '/',
    '/skills',
    '/skills/woodcutting',
    '/combat?panel=gear&slot=weapon',
    '/combat/expeditions',
    '/castle',
    '/hiscores/deeds?panel=honours',
  ].map((path) => ({ page: pageOf(path, 'Hearth'), path, phone: [], desktop: [], as: 'sage' as const }));
  // A week in (session 139): a castle raised five days ago, its lords not yet open.
  const squires: ViewSpec[] = ['/castle', '/castle/army', '/castle/citadel'].map((path) => ({
    page: 'Castle Clash',
    path,
    phone: [],
    desktop: [],
    as: 'squire' as const,
  }));
  // The privacy page and the terms, as a visitor reads them from the welcome page.
  const visitor: ViewSpec[] = map.views
    .filter((v) => v.path === '/privacy' || v.path === '/terms')
    .map((v) => ({ ...v, as: 'visitor' as const }));
  // The admin console is the admins': a newcomer gets the page that does not exist. The console's own
  // account sees every section (session 227).
  const isConsole = (path: string) => path === '/admin' || path.startsWith('/admin/');
  const newcomer = map.views.filter((v) => !isConsole(v.path));
  const staff: ViewSpec[] = map.views.filter((v) => isConsole(v.path)).map((v) => ({ ...v, as: 'staff' as const }));
  const gate: ViewSpec = {
    page: 'Admin',
    path: '/admin',
    phone: ['console.signIn'],
    desktop: ['console.signIn'],
    as: 'visitor',
  };
  return [...newcomer, ...sheets, ...veteran, ...elders, ...keepers, ...sages, ...squires, ...visitor, ...staff].map(
    (v) => ({
      ...v,
      name: (v.as ? `${v.as}-` : '') + (v.path.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-') || 'hearth'),
    }),
  );
}
