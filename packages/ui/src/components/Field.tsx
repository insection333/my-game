// The one text field: a label above, the input, then a hint or, when something is wrong, the
// reason in its place. The input is described by whichever is showing.
import { useId, type InputHTMLAttributes } from 'react';
import s from './Field.module.css';

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string | null;
}

export function Field({ label, hint, error, className, ...rest }: FieldProps) {
  const id = useId();
  const note = error ?? hint;
  return (
    <div className={[s.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={s.label}>
        {label}
      </label>
      <input
        id={id}
        data-ui="Field"
        className={s.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? `${id}-note` : undefined}
        {...rest}
      />
      {note && (
        <p id={`${id}-note`} className={error ? s.error : s.hint}>
          {note}
        </p>
      )}
    </div>
  );
}
