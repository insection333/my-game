// The bounty board on the Combat page (session 175): the day's three bounties, each Take; or the one held,
// its count to go, what it pays, Claim once done or Let go. An elite bounty wears its pill.
import { t } from '@idle-clash/content';
import type { BountyView, Feature } from '@idle-clash/features';
import { ActionRow, Button, hasIcon, ItemIcon, Panel, Pill, ProgressBar } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { fillFor, Slot } from '../slots.tsx';
import s from './combat.module.css';

export function BountyBoard({ combat, now }: { combat: Feature; now: number }) {
  const { state } = useGame();
  const view = fillFor<BountyView>(combat, 'combat.bounty', state, now);
  if (!view) return null;
  const held = view.held;
  return (
    <Panel title={t('bounty.title')} flush>
      <Slot id="combat.bounty">
        {held ? (
          <ActionRow
            icon={hasIcon(held.foe) ? <ItemIcon name={held.foe} size={32} /> : undefined}
            name={held.text}
            facts={[held.pays]}
            status={held.elite ? <Pill tone="gold">{t('bounty.elite')}</Pill> : <Pill>{held.count}</Pill>}
            progress={<ProgressBar value={held.progress} label={held.text} />}
            actions={
              held.done ? (
                <Button variant="primary" onClick={() => game.act('combat', 'bountyClaim', {})}>
                  {t('bounty.claim')}
                </Button>
              ) : (
                <Button variant="quiet" onClick={() => game.act('combat', 'bountyLetGo', {})}>
                  {t('bounty.letGo')}
                </Button>
              )
            }
          />
        ) : (
          view.offers.map((o) => (
            <ActionRow
              key={o.foe}
              icon={hasIcon(o.foe) ? <ItemIcon name={o.foe} size={32} /> : undefined}
              name={o.text}
              facts={[o.pays]}
              status={o.elite ? <Pill tone="gold">{t('bounty.elite')}</Pill> : undefined}
              actions={
                <Button variant="secondary" onClick={() => game.act('combat', 'bounty', { foe: o.foe })}>
                  {t('bounty.take')}
                </Button>
              }
            />
          ))
        )}
        <p className={s.bountyNote}>{view.note}</p>
      </Slot>
    </Panel>
  );
}
