// A table on wide screens; on narrow ones each row becomes a short labelled block, so nothing scrolls sideways.
import type { ReactNode } from 'react';
import s from './ResponsiveTable.module.css';

export interface Column<R> {
  key: string;
  label: string;
  align?: 'start' | 'end';
  cell: (row: R) => ReactNode;
}

export interface ResponsiveTableProps<R> {
  caption: string;
  columns: Column<R>[];
  rows: R[];
  rowKey: (row: R) => string;
  /** Marks a row (the player's own) so it stands out. */
  highlight?: (row: R) => boolean;
}

export function ResponsiveTable<R>({ caption, columns, rows, rowKey, highlight }: ResponsiveTableProps<R>) {
  return (
    <div data-ui="ResponsiveTable" className={s.wrap}>
      <table className={s.table}>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" data-align={c.align ?? 'start'}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} data-highlight={highlight?.(r) || undefined}>
              {columns.map((c) => (
                <td key={c.key} data-label={c.label} data-align={c.align ?? 'start'}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
