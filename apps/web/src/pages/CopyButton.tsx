// A button that copies text, says Copied, and where the browser refuses, shows the text selected in a
// box so it can be copied by hand.
import { t } from '@idle-clash/content';
import { Button } from '@idle-clash/ui';
import { useEffect, useRef, useState } from 'react';
import s from './admin.module.css';

export function CopyButton({ text, label }: { text: () => string; label: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle');
  const box = useRef<HTMLTextAreaElement>(null);
  const [held, setHeld] = useState('');
  useEffect(() => {
    if (state === 'manual') box.current?.select();
    if (state !== 'copied') return;
    const id = setTimeout(() => setState('idle'), 2500);
    return () => clearTimeout(id);
  }, [state]);
  const copy = () => {
    const words = text();
    setHeld(words);
    // The clipboard is written inside the click, as browsers ask.
    if (typeof navigator.clipboard?.writeText !== 'function') return setState('manual');
    navigator.clipboard.writeText(words).then(
      () => setState('copied'),
      () => setState('manual'),
    );
  };
  return (
    <span className={s.copy}>
      <Button variant="quiet" onClick={copy}>
        {label}
      </Button>
      <span role="status" className={s.muted}>
        {state === 'copied' ? t('admin.test.copied') : ''}
      </span>
      {state === 'manual' && (
        <span className={s.manual}>
          <span className={s.muted}>{t('admin.test.copyByHand')}</span>
          <textarea ref={box} readOnly value={held} rows={6} aria-label={label} onFocus={(e) => e.target.select()} />
        </span>
      )}
    </span>
  );
}
