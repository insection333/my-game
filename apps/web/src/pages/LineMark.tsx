// A line's picture in the recap, Today and the notices tray: its icon, else a deed's medallion (session 68),
// else a quiet dot.
import type { recap } from '@idle-clash/features';
import { hasIcon, ItemIcon, MedalSeal } from '@idle-clash/ui';
import s from './pages.module.css';

export function LineMark({ line }: { line: Pick<recap.RecapLine, 'icon' | 'medal'> }) {
  if (line.icon && hasIcon(line.icon)) return <ItemIcon name={line.icon} size={24} />;
  if (line.medal) return <MedalSeal tier={line.medal.tier} mark={line.medal.mark} />;
  return <span className={s.lineDot} aria-hidden="true" />;
}
