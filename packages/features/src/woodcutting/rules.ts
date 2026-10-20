// Woodcutting's action rules: the shared gathering rules, completing through the shared completion.
import { gatheringRules } from '../shared/gathering.ts';
import { FINDS, LADDER, SKILL, TREES } from './content.ts';

export const RULES = gatheringRules({ feature: 'woodcutting', skill: SKILL, ladder: LADDER, finds: FINDS }, TREES);
