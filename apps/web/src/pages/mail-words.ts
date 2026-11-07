// What a sender is told when a message is refused (session 45): each reason in words of its own, the
// longest a message may be named in the one that needs it.
import { MAIL, type MailRefusal } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';

const REASON: Record<MailRefusal, string> = {
  language: 'mail.reason.language',
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
