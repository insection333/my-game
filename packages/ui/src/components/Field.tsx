// The one text field: a label above, the input, then a hint or, when something is wrong, the
// reason in its place. The input is described by whichever is showing. With `rows`, it takes several
// lines (feedback), the same field grown taller.
import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import s from './Field.module.css';

interface Common {
  label: string;
  /** The label for screen readers alone, where the field says what it is by its place and placeholder
   *  (the Storehouse's search, session 186). */
  labelHidden?: boolean;
  hint?: string;
  error?: string | null;
}
export type FieldProps = Common &
  (
    | (Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & { rows?: undefined })
    | (Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & { rows: number })
  );

export function Field({ label, labelHidden, hint, error, className, ...rest }: FieldProps) {
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
      <label htmlFor={id} className={labelHidden ? 'visually-hidden' : s.label}>
        {label}
      </label>
      {rest.rows !== undefined ? (
        <textarea {...shared} data-variant="lines" className={`${s.input} ${s.lines}`} {...rest} />
      ) : (
        <input {...shared} className={s.input} {...rest} />
      )}
      {note && (
        // A reason for refusing is said aloud as it appears (session 300, the page's `data-said`), where it
        // was only seen: the field it describes keeps the focus, and nothing read it out.
        <p id={`${id}-note`} className={error ? s.error : s.hint} data-said={error ? '' : undefined}>
          {note}
        </p>
      )}
    </div>
  );
}
