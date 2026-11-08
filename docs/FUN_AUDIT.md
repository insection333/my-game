# The core loop's fun audit (session 42)

The owner's first phase of 3 November 2026: evaluate the pacing of combat and progression for flat or repetitive stretches, and give the moments that matter crisp feedback. This is what the year on the real engine (`.verify/year.md`), the simulation (`.verify/simulation.md`) and play at three widths showed, and what was done about each finding.

## What was found

| Where | What was flat | Evidence |
| --- | --- | --- |
| A fight | Combat, the lane players watch most, could not be seen at all. A fight was a bar filling over a foe's name; its hits, misses, meals and kill happened only in the engine. | Two minutes of a fight at the Sunken Fen showed nothing but a bar. |
| The active hour, late | Moments thin out as the year goes on: one every 0.5 minutes on day 1, every 2.1 minutes on day 365, and the longest gap reaches 5.0 minutes (the target's limit). | `.verify/year.md`, Moments in the steady player's active hour. |
| Deeds and titles, mid to late | Deeds fall from 211 in the first quarter to 36 in the last. Titles by points come on days 2, 7, 54, 134, 232 and 308, so the gaps run 80 to 98 days in the middle of the year. | `.verify/year.md`, Deeds over the year. |
| Castle Clash's record | A battle or spy's errand was one line in a list, and its account was mostly text. Nothing showed at a glance how a day's war had gone. | The War tab's report list. |
| Closing what opens | Banners and toasts could not be closed. A centre moment's Close sat at its foot, and the tour's Skip at its bottom left. | The owner's rule: every popup closes from its top right. |

## What was done

1. **The arena** (`combat.arena`). The fight in the Combat lane is played out at the top of the Foes panel, swing by swing.
   - It is the very fight the engine settles: same seed, same draws, same meals.
   - Both sides' health eases down as hits land. Each swing's number rises once over the side it lands on: a miss says Miss, a critical hit is larger and in gold, a meal is in moss.
   - Slain is stamped over a fallen foe as the next one steps in.
   - Watching the Combat lane is now an event every three seconds. That is what fills the late active hour, where the moment counter cannot.
   - Nothing about the fight changed. A critical hit names the top tenth of the rolls that were always there (`CRIT_SHARE`).
2. **Battle reports** (the Castle Clash Reports tab). Every siege, defence, stronghold, fortress and spy's errand is a card, under its day and filtered by kind.
   - A card shows both sides' arms, the outcome in a coloured word, the clash of strength on one bar, and what it moved with its icons.
   - The account is drawn as a report: the outcome over both sides' arms, strength meeting on one bar, the ratio on a scale with the breach and decisive lines, the formation in three shares, and the spoils.
3. **Every popup closes from its top right.** The cross (`CloseButton`) is on sheets, moments of every size and the tour's card. Verify fails a popup without one.
4. **Moments read cleanly.** A moment that names more than one thing ends each sentence ("Easy, 5 points. Also: …").

## What is left to the next phases

- **The thin middle of the year** (deeds and titles 80 to 98 days apart) belongs to phase 2: the veteran cosmetics are locked behind mid- and end-game milestones, placed into exactly those gaps.
- **Rank-ups on the ladders**: done in session 49. The server notices a listed player's place as their row is written, and a climb into a better band (the top 100, 50, 10 or 3, or first) is a moment at once and a notice in the tray. Each band is said once, kept with the row so a restart does not say it again; a first place is where a player starts, so it is not said.
