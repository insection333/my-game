// Hitpoints: health, armour and the foes that open as it rises. Every fight trains it, whatever the style.
import { defineFeature } from '../define.ts';
import { combatSkill } from '../shared/combat/skill.ts';

export const hitpoints = defineFeature(combatSkill('hitpoints'));
