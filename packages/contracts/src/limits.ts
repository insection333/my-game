// The account rules as plain values, without the schema library: the welcome page checks a form with
// these, so it stays small; the schemas in fields.ts are built from the same values.

export const NAME_MIN = 3;
export const NAME_MAX = 16;
/** Letters, digits, single spaces, hyphens and underscores; a letter or digit at each end. */
export const NAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9_-]| (?! ))*[A-Za-z0-9]$/;
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 200;
/** Control characters and text-direction overrides: never part of a name, a password or a report. */
// eslint-disable-next-line no-control-regex -- matching control characters is the point
export const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f‪-‮⁦-⁩]/;

export const nameOk = (name: string): boolean =>
  name.length >= NAME_MIN && name.length <= NAME_MAX && NAME_PATTERN.test(name);
export const passwordOk = (password: string): boolean =>
  password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX && !CONTROL_CHARS.test(password);
