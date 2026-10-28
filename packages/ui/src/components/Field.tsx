// The one text field: a label above, the input, then a hint or, when something is wrong, the
// reason in its place. The input is described by whichever is showing. With `rows`, it takes several
// lines (feedback), the same field grown taller.
import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import s from './Field.module.css';

interface Common {
  label: string;
  hint?: string;
  error?: string | null;
}
export type FieldProps = Common &
  (
    | (Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & { rows?: undefined })
    | (Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & { rows: number })
  );

export function Field({ label, hint, error, className, ...rest }: FieldProps) {
  const id = useId();
  const note = error ?? hint;
  const shared = {
    id,
    'data-ui': 'Field',
    'aria-invalid': error ? true : undefined,
    'aria-describedby': note ? `${id}-note` : undefined,
  } as const;
  return (
    <div className={[s.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={s.label}>
        {label}
      </label>
      {rest.rows !== undefined ? (
        <textarea {...shared} data-variant="lines" className={`${s.input} ${s.lines}`} {...rest} />
      ) : (
        <input {...shared} className={s.input} {...rest} />
      )}
      {note && (
        <p id={`${id}-note`} className={error ? s.error : s.hint}>
          {note}
        </p>
      )}
    </div>
  );
}
