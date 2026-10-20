// Melee: the sword's style. Beats Archery, loses to Magic. Trained by fighting with a sword worn.
import { defineFeature } from '../define.ts';
import { combatSkill } from '../shared/combat/skill.ts';

export const melee = defineFeature(combatSkill('melee'));
