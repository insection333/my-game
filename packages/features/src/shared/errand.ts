// The day's fights waiting, as rows of the Hearth's Next up (session 188, `hearth.errands`): each feature
// fills the slot with its own, and the Hearth puts them in order (the lowest first) under the Call to arms.

/** A row: its picture, its words, where it is done, and its place (rewards waiting first). */
export interface ErrandRow {
  icon: string;
  text: string;
  href: string;
  order: number;
}

/** Each errand's place among the others. */
export const ERRAND_ORDER = { share: 0, bountyDone: 1, realm: 2, bosses: 3, bounties: 4, deep: 5 } as const;

/** Whether an action is under way or next in a lane: an errand being done is not asked for. */
export const inHand = (
  lanes: Record<
    string,
    { current: { action: { feature: string; id: string } } | null; next: { feature: string; id: string } | null }
  >,
  feature: string,
  id?: string,
) =>
  Object.values(lanes).some((l) =>
    [l.current?.action, l.next].some((a) => a?.feature === feature && (id === undefined || a.id === id)),
  );
