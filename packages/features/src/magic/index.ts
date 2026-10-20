// Magic: the staff's style. Beats Melee, loses to Archery. Trained by fighting with a staff worn.
import { defineFeature } from '../define.ts';
import { combatSkill } from '../shared/combat/skill.ts';

export const magic = defineFeature(combatSkill('magic'));
