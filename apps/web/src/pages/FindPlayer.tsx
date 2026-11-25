// Find a player by name on Hiscores (session 242): their card opens over the page, as a name on a ladder opens
// it, where a friend outside the rows shown could be reached only from a notice or a castle's War. A name with no
// player says so on the card (session 159).
import { t } from '@idle-clash/content';
import { Button, Field } from '@idle-clash/ui';
import { useState } from 'react';
import { navigate } from '../router.ts';
import { profileHref } from './ProfileSheet.tsx';
import s from './hiscores.module.css';

export function FindPlayer() {
  const [name, setName] = useState('');
  return (
    <form
      className={s.find}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const wanted = name.trim();
        if (wanted) navigate(profileHref(wanted));
      }}
    >
      <Field
        label={t('hiscores.find')}
        labelHidden
        placeholder={t('hiscores.find')}
        value={name}
        maxLength={32}
        autoComplete="off"
        onChange={(e) => setName(e.target.value)}
      />
      <Button type="submit" variant="secondary">
        {t('hiscores.findGo')}
      </Button>
    </form>
  );
}
