// Messages for the screenshots (session 45): the elder's inbox holds the keeper's letters (the newest
// unread, one flagged as written the day the keeper had a letter refused), the veteran's and a warning from
// the keepers of the realm, and the elder has blocked a player; so the tray's Messages and the admin's
// monitor are seen with letters in them.
import { t } from '@idle-clash/content';
import { REALM } from '../../../packages/contracts/src/mail.ts';
import { mail, mailBlocks, mailRefused } from '../../../apps/server/src/db/schema.ts';
import type { Ctx } from '../../../apps/server/src/context.ts';

const HOUR = 3_600_000;

export function letters(
  ctx: Ctx,
  ids: { elder: string; keeper: string; veteran: string; blocked: string },
  now: number,
) {
  const { elder, keeper, veteran, blocked } = ids;
  ctx.db
    .insert(mail)
    .values([
      { toId: elder, fromId: REALM, body: t('mail.warning'), at: now - 50 * HOUR, readAt: now - 49 * HOUR },
      {
        toId: elder,
        fromId: veteran,
        body: 'Saw your castle on the ladder. How did you get the walls so high so quickly?',
        at: now - 26 * HOUR,
        readAt: now - 25 * HOUR,
      },
      {
        toId: elder,
        fromId: keeper,
        body: 'Well fought at the walls last night. Your archers held longer than I thought they would.',
        at: now - 3 * HOUR,
        readAt: now - 2 * HOUR,
      },
      {
        toId: elder,
        fromId: keeper,
        body: 'I will be back for that gold before the week is out. Raise your watchtower while you can.',
        at: now - 40 * 60_000,
        flagged: 1,
      },
    ])
    .run();
  ctx.db
    .insert(mailRefused)
    .values({ fromId: keeper, toId: elder, body: 'Strike back if you dare, you sh1te lord.', at: now - HOUR })
    .run();
  ctx.db
    .insert(mailBlocks)
    .values({ blockerId: elder, blockedId: blocked, at: now - 5 * 24 * HOUR })
    .run();
}
