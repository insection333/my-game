// What a sender is told when a message is refused (session 45): each reason in words of its own, the
// longest a message may be named in the one that needs it.
import { MAIL, type MailRefusal } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';

const REASON: Record<MailRefusal, string> = {
  language: 'mail.reason.language',
  noPlayer: 'mail.reason.noPlayer',
  blocked: 'mail.reason.blocked',
  muted: 'mail.reason.muted',
  cooldown: 'mail.reason.cooldown',
  tooManyPlayers: 'mail.reason.tooManyPlayers',
  self: 'mail.reason.self',
  empty: 'mail.reason.empty',
  tooLong: 'mail.reason.tooLong',
};

export const reasonText = (reason: MailRefusal): string =>
  reason === 'tooLong' ? t(REASON[reason], { max: fmt.int(MAIL.MAX_CHARS) }) : t(REASON[reason]);

/** The longest a reply's quote of the letter it answers runs, before it stops at a word's end. */
const QUOTE_CHARS = 80;

/** The opening words of a letter being answered (session 67), on one line: whole if short, else cut at
 *  the last word that fits and marked with an ellipsis. */
export function quoteOf(body: string): string {
  const line = body.replace(/\s+/g, ' ').trim();
  if (line.length <= QUOTE_CHARS) return line;
  const cut = line.slice(0, QUOTE_CHARS);
  const end = cut.lastIndexOf(' ');
  return `${end > 0 ? cut.slice(0, end) : cut}…`;
}
