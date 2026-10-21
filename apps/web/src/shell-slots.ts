// Slots the shell fills itself (no feature needed). Verify reads this list: a slot here, or one a
// built feature fills, must appear where IA.md says.
export const SHELL_SLOTS = [
  'shell.fire',
  'shell.gold',
  'shell.tray',
  'shell.lane',
  'shell.moment',
  'hearth.today',
  'hearth.lanes',
  'tray.list',
  'settings.account',
  'store.items',
  'item.panel',
  'welcome.intro',
  'welcome.form',
  'hiscores.online',
  'hiscores.ladder',
  'legal.text',
  'admin.players',
  'admin.player',
] as const;
