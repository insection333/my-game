// Archery: the bow's style. Beats Magic, loses to Melee. Trained by fighting with a bow worn.
import { defineFeature } from '../define.ts';
import { combatSkill } from '../shared/combat/skill.ts';

export const archery = defineFeature(combatSkill('archery'));
