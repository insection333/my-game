// Feedback as plain text to copy from the admin page and paste elsewhere (to the team, or to Claude to
// weigh): a line saying what it is, then each note with who sent it, where they stood, the page and the
// day, newest first.
import { fmt, t } from '@idle-clash/content';
import type { FeedbackView } from '@idle-clash/contracts';

/** One note: who sent it and where they stood, then their words as they wrote them. */
export function feedbackNote(f: FeedbackView): string {
  const who = t('admin.test.copyWho', {
    name: f.name ?? t('admin.test.someone'),
    level: fmt.int(f.totalLevel),
    days: f.daysPlayed === 1 ? t('admin.test.copyDayOne') : t('admin.test.copyDays', { days: fmt.int(f.daysPlayed) }),
    page: f.page,
    date: fmt.date(f.at),
  });
  return `${who}\n${f.text.trim()}`;
}

/** Every note, under a line saying what they are. */
export function feedbackNotes(list: readonly FeedbackView[]): string {
  const head =
    list.length === 1 ? t('admin.test.copyHeadOne') : t('admin.test.copyHead', { count: fmt.int(list.length) });
  return [head, ...list.map(feedbackNote)].join('\n\n');
}
