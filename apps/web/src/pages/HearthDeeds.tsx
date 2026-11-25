// The deeds followed on the Hearth (session 242): up to three chosen from a deed's sheet, each in Next up with
// its medallion (opening its sheet), how far it has come and a bar, so a deed being worked towards is in view
// on every return, where it stood only on the Deeds tab of Hiscores.
import type { DeedStep } from '@idle-clash/features';
import { ActionRow, ProgressBar } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { fills } from '../slots.tsx';
import { DeedMedal } from './Deeds.tsx';

export function useFollowed(): DeedStep[] {
  const { state, now, features } = useGame();
  const [view] = fills<DeedStep[]>(features, 'hearth.followed', state, now);
  return view?.data ?? [];
}

export function FollowedDeeds({ deeds }: { deeds: DeedStep[] }) {
  return (
    <>
      {deeds.map((d) => (
        <ActionRow
          key={d.id}
          icon={<DeedMedal step={d} />}
          name={d.name}
          facts={[d.text, ...(d.count ? [d.count] : [])]}
          progress={<ProgressBar value={d.progress} label={d.count ? `${d.name}: ${d.count}` : d.name} />}
        />
      ))}
    </>
  );
}
