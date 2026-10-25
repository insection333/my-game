// A quiet line under the header while the page cannot reach the server, shown only after a few
// seconds so a blip never flashes it. It says what matters: the lanes keep working regardless.
import { t } from '@idle-clash/content';
import { useEffect, useState } from 'react';
import { useConnected } from '../game/connection.ts';
import s from './shell.module.css';

const AFTER_MS = 4000;

export function Connection() {
  const connected = useConnected();
  const [late, setLate] = useState(false);
  useEffect(() => {
    if (connected) return;
    const id = setTimeout(() => setLate(true), AFTER_MS);
    return () => {
      clearTimeout(id);
      setLate(false);
    };
  }, [connected]);
  if (connected || !late) return null;
  return (
    <div className={s.connection} role="status" data-shell="connection">
      {t('shell.reconnecting')}
    </div>
  );
}
