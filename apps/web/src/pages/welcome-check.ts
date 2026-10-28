// The welcome form's checks, by the server's own rules, so a refusal is explained before sending.
import { t } from '@idle-clash/content';
import { nameOk, passwordOk } from '@idle-clash/contracts';

export type Errors = Partial<Record<'name' | 'password' | 'age' | 'form', string>>;

/** Checks the form by the server's own rules (the schemas are built from the same values). */
export function check(create: boolean, name: string, password: string, age: boolean): Errors {
  const errors: Errors = {};
  if (create) {
    if (!nameOk(name)) errors.name = t('error.name');
    if (!passwordOk(password)) errors.password = t('error.password');
    if (!age) errors.age = t('error.age');
  } else {
    if (!name.trim()) errors.name = t('error.name');
    if (!password) errors.password = t('error.password');
  }
  return errors;
}
