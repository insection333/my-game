// The sheets verify opens over their pages, as a newcomer: the tray (its notices and its messages), an
// item, the honours, a deed, a work and settings, each with the slots that must show without scrolling.
import type { ViewSpec } from '../ia.ts';

export const SHEETS: ViewSpec[] = [
  { page: 'The notices tray (panel)', path: '/?panel=tray', phone: ['tray.list'], desktop: ['tray.list'] },
  {
    page: 'The notices tray (panel)',
    path: '/?panel=tray&tray=mail',
    phone: ['tray.mail'],
    desktop: ['tray.mail'],
  },
  {
    page: 'Storehouse',
    path: '/storehouse?panel=item&item=copper-bar',
    phone: ['item.panel'],
    desktop: ['item.panel'],
  },
  {
    page: 'Hiscores',
    path: '/hiscores/deeds?panel=honours',
    phone: ['hiscores.choose'],
    desktop: ['hiscores.choose'],
  },
  {
    page: 'Hiscores',
    path: '/hiscores/deeds?view=skills&panel=deed&deed=level-woodcutting-10',
    phone: ['hiscores.deed'],
    desktop: ['hiscores.deed'],
  },
  {
    page: 'Hearth',
    path: '/?panel=work&work=woodyard',
    phone: ['hearth.work'],
    desktop: ['hearth.work'],
  },
  {
    page: 'Settings (account menu)',
    path: '/?panel=settings',
    phone: ['settings.account'],
    desktop: ['settings.account'],
  },
];
