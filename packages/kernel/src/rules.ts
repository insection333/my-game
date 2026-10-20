// What a feature supplies for each of its actions. Session 3's defineFeature gathers these into the
// registry the engine is created with.
import type { GameEvent } from './events.ts';
import type { ActionRef, LaneId, LaneKind, State, StopReason } from './schema.ts';

export interface ActionContext {
  /** The state being advanced. Rules change it in place, through the helpers in state.ts. */
  readonly state: State;
  /** When this happens. */
  readonly at: number;
  readonly lane: LaneId;
  /** Whether the fire is burning at this moment. */
  readonly fireBurning: boolean;
  /** The lane's next random number in [0, 1). */
  roll(): number;
  emit(event: GameEvent): void;
}

export interface ActionRules {
  lane: LaneKind;
  /** Why the action cannot start (or repeat) right now, or null if it can. Must not change state. */
  check(ctx: ActionContext, action: ActionRef): StopReason | null;
  /** How long one repetition takes, in milliseconds. May roll; must not change state otherwise. */
  duration(ctx: ActionContext, action: ActionRef): number;
  /** One repetition finished: take inputs, give outputs, add XP, emit events. */
  complete(ctx: ActionContext, action: ActionRef): void;
}

/** Finds the rules for an action, or undefined if no feature (or no switched-on feature) has it. */
export type ActionRegistry = (action: ActionRef) => ActionRules | undefined;

export function registryOf(features: Record<string, Record<string, ActionRules>>): ActionRegistry {
  return (a) =>
    Object.hasOwn(features, a.feature) && Object.hasOwn(features[a.feature], a.id)
      ? features[a.feature][a.id]
      : undefined;
}
