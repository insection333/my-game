// The welcome form's checks, by the server's own rules, so a refusal is explained before sending.
import { t } from '@idle-clash/content';
import { inviteOk, nameOk, passwordOk } from '@idle-clash/contracts';

export type Errors = Partial<Record<'name' | 'password' | 'age' | 'invite' | 'form', string>>;

/** Checks the form by the server's own rules (the schemas are built from the same values). `invite` is
 *  null when signing up takes none. */
export function check(
  create: boolean,
  name: string,
  password: string,
  age: boolean,
  invite: string | null = null,
): Errors {
  const errors: Errors = {};
  if (create) {
    if (invite !== null && !inviteOk(invite)) errors.invite = t('error.invite');
    if (!nameOk(name)) errors.name = t('error.name');
    if (!passwordOk(password)) errors.password = t('error.password');
    if (!age) errors.age = t('error.age');
  } else {
    if (!name.trim()) errors.name = t('error.name');
    if (!password) errors.password = t('error.password');
  }
  return errors;
}
