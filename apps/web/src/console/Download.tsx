// Download as CSV (session 234): one press reads every row the view holds, a thousand at a time so no one
// read holds the server long (up to 20,000), and hands the browser the file. One press at a time; a refusal
// is said beside it.
import { t } from '@idle-clash/content';
import { Button } from '@idle-clash/ui';
import { useState } from 'react';
import { handled } from '../game/session.ts';
import { refused } from '../refused.ts';
import { save } from './csv.ts';
import s from './more.module.css';

export function DownloadCsv({ make }: { make: () => Promise<{ name: string; text: string }> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const press = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const file = await make();
      save(file.name, file.text);
    } catch (err) {
      if (!handled(err)) setError(refused(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <span className={s.download}>
      <Button onClick={() => void press()} disabled={busy}>
        {busy ? t('console.csv.making') : t('console.csv')}
      </Button>
      {error && (
        <span className={s.bad} role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
