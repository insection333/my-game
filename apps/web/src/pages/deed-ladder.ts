// Two steps of one ladder of deeds done together are said as the higher (session 163: "Fortresses taken: 10,
// Fortresses taken: 25"). A ladder's deeds share an id but for the number at its end ("fortresses-10").

const ladderOf = (id: string): string | null => (/-\d+$/.test(id) ? id.replace(/-\d+$/, '') : null);
const stepOf = (id: string): number => Number(/-(\d+)$/.exec(id)?.[1] ?? 0);

/** Whether a deed is passed by a higher step of its ladder among these ids. */
export const superseded = (id: string, ids: readonly string[]): boolean => {
  const l = ladderOf(id);
  return l !== null && ids.some((o) => o !== id && ladderOf(o) === l && stepOf(o) > stepOf(id));
};
