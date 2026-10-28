// Every HTTP route's address, as plain values: the page calls these without loading the schemas.

export const PATHS = {
  health: '/api/health',
  me: '/api/me',
  signUp: '/api/auth/sign-up',
  signIn: '/api/auth/sign-in',
  signOut: '/api/auth/sign-out',
  game: '/api/game',
  notices: '/api/notices',
  hiscores: '/api/hiscores',
  command: '/api/game/command',
  errors: '/api/errors',
  setEmail: '/api/account/email',
  confirmEmail: '/api/account/email/confirm',
  recover: '/api/auth/recover',
  resetPassword: '/api/auth/reset',
  deleteAccount: '/api/account/delete',
  adminPlayers: '/api/admin/players',
  adminSave: '/api/admin/save',
  adminRename: '/api/admin/rename',
  adminBan: '/api/admin/ban',
  adminMend: '/api/admin/mend',
  adminResetPassword: '/api/admin/reset-password',
  feedback: '/api/feedback',
  adminTest: '/api/admin/test',
} as const;

/** A feature's own route. */
export const featurePath = (feature: string, route: string) => `/api/f/${feature}/${route}`;
