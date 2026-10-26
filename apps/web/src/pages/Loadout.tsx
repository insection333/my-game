// Combat's loadout: the gear worn on a figure (the helm on the head, the weapon in the hand), and beside
// it your style with the triangle as it bears on you, your health and the food you carry.
import { t } from '@idle-clash/content';
import type { LoadoutSlot, LoadoutView, TrianglePart } from '@idle-clash/features';
import { Figure, ItemIcon, Panel, ProgressBar, TextLink } from '@idle-clash/ui';
import { navigate } from '../router.ts';
import { Slot } from '../slots.tsx';
import s from './loadout.module.css';

export function Loadout({ loadout, triangle }: { loadout: LoadoutView; triangle: TrianglePart[] }) {
  const weapon = loadout.slots.find((g) => g.slot === 'weapon');
  return (
    <Panel title={t('combat.loadout')}>
      <Slot id="combat.loadout" className={s.loadout}>
        <div className={s.doll}>
          <Figure className={s.figure} />
          {loadout.slots.map((g) => (
            <GearButton key={g.slot} gear={g} />
          ))}
        </div>
        <div className={s.info}>
          {loadout.styleId ? (
            <div className={s.style}>
              <ItemIcon name={loadout.styleId} size={24} />
              <span>{loadout.style}</span>
            </div>
          ) : (
            weapon && (
              <div>
                <TextLink href={gearHref(weapon)} onNavigate={navigate}>
                  {weapon.name}
                </TextLink>
              </div>
            )
          )}
          <Slot id="combat.triangle">
            <ul className={s.triangle}>
              {triangle.map((p) => (
                <li key={p.seal}>
                  <ItemIcon name={p.seal} size={24} />
                  <span>{p.text}</span>
                </li>
              ))}
            </ul>
          </Slot>
          <div className={s.health}>
            <ProgressBar value={loadout.health} label={loadout.healthText} />
            <span>{loadout.healthText}</span>
            <span>{loadout.food}</span>
          </div>
        </div>
      </Slot>
    </Panel>
  );
}

/** A slot opens its sheet of gear; with no weapon to wear, the weapon slot leads to Smithing. */
function gearHref(gear: LoadoutSlot) {
  const forge = gear.slot === 'weapon' && !gear.item && !gear.choices.length;
  return forge ? '/skills/smithing' : `${location.pathname}?panel=gear&slot=${gear.slot}`;
}

function GearButton({ gear }: { gear: LoadoutSlot }) {
  const href = gearHref(gear);
  const name = `${gear.label}: ${gear.name}`;
  return (
    <a
      href={href}
      data-ui={gear.slot === 'weapon' ? 'WeaponSlot' : 'GearSlot'}
      data-state={gear.item ? undefined : 'empty'}
      className={s.slot}
      data-slot-name={gear.slot}
      aria-label={name}
      title={name}
      onClick={(e) => (e.preventDefault(), navigate(href))}
    >
      {gear.item ? <ItemIcon name={gear.item} size={32} /> : <span className={s.slotLabel}>{gear.label}</span>}
    </a>
  );
}
