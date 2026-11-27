// Answers applied only while theirs is the latest ask (session 278). A page that asks the server again as its
// address changes (the console's directory by filter and search, the audit log by search, a player's record and
// activity by player) took every answer as it came, so an older one landing after a newer showed what was asked
// before: the banned listed under Muted, or one player's record at another's address.

/** Makes a taker: each answer passed through it is applied only if no later one has been asked since. */
export function latest() {
  let asked = 0;
  return <T>(answer: Promise<T>, ok: (r: T) => void, no: (err: unknown) => void = () => undefined): Promise<void> => {
    const mine = ++asked;
    return answer.then(
      (r) => {
        if (mine === asked) ok(r);
      },
      (err: unknown) => {
        if (mine === asked) no(err);
      },
    );
  };
}

/** Numbers asks whose answers may cross (session 278: Castle Clash reads its castle each minute and after every
 *  press, and a read begun before a Level up but answered after it put back the castle as it stood before):
 *  `ask` gives an ask its number, and `fresh` says whether its answer is newer than the one shown, taking it if so. */
export function inOrder() {
  let asked = 0;
  let shown = 0;
  return {
    ask: () => ++asked,
    fresh: (mine: number) => {
      if (mine <= shown) return false;
      shown = mine;
      return true;
    },
  };
}

/** How far back by the server's clock an answer may stand and still be one that came late. */
export const LATE_MS = 60_000;

/** Whether a game state stamped `now` by the server came late (session 278): it was made before the one taken,
 *  `taken`, so a read begun before a press but answered after it put back the save as it was before the press.
 *  One stamped far earlier is the server's clock stepped back (session 273), and is taken. */
export const cameLate = (now: number, taken: number): boolean => now < taken && now > taken - LATE_MS;
