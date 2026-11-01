# Castle Clash: how the plan maps onto Idle Clash

`SPEC.md` is the owner's plan, kept word for word ("The Sovereign's Bastion", V4). This file records Phase 0's discovery, how each part of the plan lands in this codebase, and the decisions taken where the plan is silent or contradicts itself. Every later phase follows it. Where this file and `SPEC.md` disagree, this file says why.

The owner's calls (2 November 2026): build it under the name **Castle Clash**, as a page in the menu **below the Storehouse and above Hiscores**, holistically with the rest of the game, keeping as close to the plan as possible.

## 1. Phase 0: what the codebase is

| The plan asks | What Idle Clash has |
| --- | --- |
| Backend language and framework | TypeScript on Node 22 (run directly), Fastify 5. Routes are declared in `@idle-clash/contracts` and mounted with `contractRoute`, every input a strict Zod schema |
| ORM and SQL driver | Drizzle over better-sqlite3: **one SQLite file, one connection**, in write-ahead mode. The kernel's `saves` and the server's tables share it. Server migrations live in `apps/server/migrations` (drizzle-kit) and apply at start |
| Users | `players` (text UUID `id`, name, Argon2id hash, `created_at`, `banned_at`, honours, hiscores listing). Sessions are a cookie whose SHA-256 is stored |
| Gold | Not a column: the item `gold` in each player's save (`state.items.gold`), a JSON document with a revision (`saves`). It changes only inside the owner's own request, through `handle()` (one request at a time per player, each request id acted on once) |
| Requests | `PlayerQueue` runs one player's requests in order; `handle()` reads the save, runs a pure handler, writes the save with the request id. Feature routes are `POST /api/f/<feature>/<route>`; 30 changing requests per 10 s per player |
| Game logic | Pure features on a pure kernel (`advance(state, now, rng)`). Offline time is caught up lazily on every read and write: the game already has no cron jobs |
| Frontend | React 19 and Vite. Pages in `apps/web/src/pages`, laid out by the shell; every control drawn by `@idle-clash/ui` (Button, Panel, Pill, ProgressBar, Tabs, ActionRow, Sheet, Field, ItemIcon, Medal…), each carrying `data-ui` so verify can prove one control is drawn one way. Tokens in `packages/ui/src/tokens.css`: birch and slate surfaces, moss for progress, woad for what you press, ember for the fire and for what is short, alert for what went wrong; Alegreya for names and headings, Alegreya Sans for the rest; light and dark |
| Modals and toasts | Sheets (`?panel=…`, a bottom sheet on phones, a side sheet on wide screens); moments (centre, banner, toast) for notable events; the notices tray |
| Tone | Plain, warm, a little old-fashioned, British spelling; short sentences; no exclamation marks; numbers always through `fmt`; every word in the strings file and every new term in the glossary. It is a bright march of moss and birch rather than a grim dark fantasy, so Castle Clash takes the same voice: dry, concrete, never grandiose |
| Checks | `pnpm verify` (nine steps) holds every page at 320, 390 and 1,440 px in three engines, axe, speed budgets, the hostile-input suite generated from contracts, and the year-long simulation on the real engine |

## 2. Where Castle Clash lives

- **The page**: `/castle`, the menu's sixth entry, between Storehouse and Hiscores (verify allows at most six). Its five tabs are the plan's five (`/castle`, `/castle/garrison`, `/castle/war-room`, `/castle/incursions`, `/castle/reliquary`), using the same `Tabs` the Combat and Hiscores pages use. The header strip of the plan is a panel at the top of every tab.
- **State**: the plan's single denormalized row per player, `player_bastions`, beside `bastion_global_state` (the one-row war chest) and `bastion_logs` (20 entries a player). They live in the server's tables, not in the save, because a siege reads and writes two players at once, and a save is only ever written by its owner's own request.
- **Code**:
  - `packages/content/src/castle/config.ts`: `bastionConfig`, the static content (Phase 1).
  - `packages/features/src/shared/castle/`: the pure engine (Phase 2): lazy sync, ratings, combat, espionage, sinks. Pure functions of a row and `now`, shared by the server (the authority) and the page (previews: costs, the flank warning, odds).
  - `apps/server/src/castle/`: the service and routes (Phase 3).
  - `apps/web/src/pages/castle/`: the five tabs (Phase 4).
- **Row creation**: a row is made the first time a player opens Castle Clash (`POST /api/castle/open`), once the page is open to them (section 6). Players who never open it cannot be found, spied on or sieged.

## 3. Transactions and locking (the plan's `SELECT … FOR UPDATE`)

SQLite has no row locks; the plan's guarantees are kept this way:

- better-sqlite3 runs every transaction synchronously on the one connection, and the server is one process, so **no two transactions ever interleave**: a transaction holding two rows is exactly as isolated as `FOR UPDATE` on both, and a deadlock cannot occur.
- Each mutation is one `sqlite.transaction(...)` that reads the rows it needs, computes, and writes them back, together with the acting player's save when gold moves. The save's revision check still applies.
- The two rows of a siege or a spy mission are read with `WHERE user_id IN (?, ?) ORDER BY user_id ASC`, the plan's query and ordering.
- The one lock that can interleave is `PlayerQueue` (requests wait on it across `await`s). A siege runs inside the attacker's queue; it never writes the defender's save, so it never needs the defender's queue. The defender's side of the game (their Sovereign Edict's bonus) is read from their row when their own requests run (section 7), so nothing waits on two queues and the plan's ascending-order rule is kept by construction.

## 4. Words: the plan's terms in this game

Every player-facing name comes from the strings file in Phase 4; ids below are the code's. Where the plan's word already means something else in Idle Clash, the game's word wins and the plan's id stays in code:

| Plan | In the game | Why |
| --- | --- | --- |
| The Sovereign's Bastion | **Castle Clash** (the page), your **castle** (the thing) | The owner's name |
| AP, Active AP, Pending Reserve AP | **AP** ("action points" in the glossary), **AP ready** and **AP in reserve** | Short enough for the header strip |
| Call to Action, Streak Flame | **Call to arms** (the daily button), its **streak** of days (0 to 14) | "Call to Action" reads as marketing; the fire is already the Hearth's |
| War Marks | **War marks** | Expeditions already pay **marks**; the two never mix, and their names say so |
| Relics, the Reliquary | **War relics**, in **the Reliquary** | Expeditions already have fourteen **relics** |
| Watchtower | **Beacon tower** (id `watchtower`) | The steading already has a Watchtower |
| Mastery, Imperial Drilling | **Drill** (a unit's drilling, 0% to 50%), **Drilling** | Actions already have mastery |
| Phantom Incursions, incursion tier | **Incursions**, **tier** | |
| Castellan doctrine | **Castellan** | |
| Bastion rating (BR) | **Castle rating** | |
| Treasury, Deep Vault | **Treasury** (beside your **purse**: the gold in your save), **Deep vault** | "Wallet" is not the game's word |

## 5. What the plan leaves open, and how it is settled

1. **Two recon lockdowns.** Section 3 blocks withdrawals for 30 minutes after a scouting; section 4B blocks garrison, trap and castellan changes for 15. Both are kept: `recon_lockdown_until_utc` (15 min) and `withdraw_lockdown_until_utc` (30 min).
2. **AP over the cap.** The Call to arms may lift AP to `cap + 25`. Step A of the sync as written (`min(cap, ap + credit)`) would then cut AP back to the cap. AP is never lowered by a sync: `ap = max(ap, min(cap, ap + credit))`.
3. **Which levels make `avgBastionLevel`.** The mean of the seven levels: walls, deep vault, beacon tower, spy guild, vanguard, outriders, siege.
4. **Levels start at 1** (`statPower` of level 0 is 0). Every level is capped at 100: past that, `1.18^level` costs pass any gold a player can hold, and the cap keeps every number exact in a double.
5. **What the morale penalty covers.** A treasury below `requiredTreasury` switches the edict off and gives the garrison −20% morale whether or not an edict is chosen. It is the plan's "prevents zero-gold hiding".
6. **Upkeep's vacation pause.** Upkeep burns 2% a day, compounding (`× 0.98^days`), from the last upkeep time to the earlier of now and `startOfUtcDay(last Call to arms) + 48 h`. Burned gold splits 95% destroyed and 5% to the war chest, as every burn does.
7. **The Deep vault.** It protects `min(75% of treasury, flat(level, depth) + pct(level) × treasury)`. Vigilance then takes 25% per stack off what is raidable, and overextension scales it again for a weaker defender.
8. **Spy success,** which the plan does not give: `chance = clamp(0.5 + 0.35 × ln(stealth ÷ detection), 0.10, 0.90)`.
   - Stealth: the spy guild's power, Espionage tech, outriders' drill and the Whisper Weaver, × 0.75 per compromised-network stack.
   - Detection: the beacon tower's power and the defender's Espionage tech.
   - A mission that cannot take (the target is shielded, or immune to that debuff, or already at its stack cap) is refused before anything is spent.
9. **Shields.** A shielded castle can be neither sieged nor spied on. Launching a siege ends your own shield; a spy mission does not.
10. **The mobilization fee** (gold, scaled to the attacker's rating, times overextension and fatigue) is spent on every siege, won or lost. The plan names its fate only for a repelled siege ("100% burned"), but refunding it on a breach would let a stronger player raid for free. All of it is burned (95/5).
11. **Where looted gold lands:** the attacker's 65% goes to their purse (the save's gold), written in the same transaction as both rows.
12. **Combat power.** Section 4C fixes the shares, the flank penalty, the matrix, traps and penetration. The rest of the totals is settled as follows:
    - A unit's power is `statPower(100, level) × (1 + drill%) × evolution × tech × relics × castellan`. Both sides use every unit, weighted by their formation's shares.
    - The defender also multiplies in the walls: `1 + 0.6 × L ÷ (L + 25) × integrity`, with the attacker's penetration taken off that bonus only. The other defender factors are vigilance (+12% a stack), morale (0.8 when unpaid), Poison wells (−8% a stack) and the infirmary.
    - The infirmary multiplies either side by `1 − wounded`.
    - Phase 2 writes these as one pure function with tests; the plan's own numbers are never changed.
13. **Genuine sieges.** The defender keeps the times of genuine sieges received. Vigilance is their count in the last 12 hours (at most 2); the third in 12 hours clears them and raises a 6-hour truce shield.
14. **Pair limits** (2 sieges and 3 spy missions from one attacker to one defender per rolling 24 hours, and the compromised-network stacks) live in the attacker's `pair_limits` JSON, at most 20 pairs, the stalest dropped first.
15. **Mercenary strongholds** are drawn from the attacker's id and the UTC day, so the list holds still through a day. They sit at 0.85 to 1.2 of the attacker's rating, and their bounty is paid strictly from the war chest. No gold is ever minted.
16. **Logs name players by id,** resolved to names when read. When an account is deleted, its id in other castles' reports and pair limits becomes `departed` (read as "a lord no longer of the realm"), so nothing of it remains (section 9).
17. **Paying for things.** Costs are paid from the purse unless the player sets "pay from the treasury" (`pay_from_treasury`). Treasury spending carries the plan's 0% tax, and a purchase that would take the treasury below `requiredTreasury` asks first, since it would switch the edict off.

## 6. Unlocks

- **Castle Clash opens at total level 100** (late on a steady player's first day). Before that the page shows what it is and when it opens. Newcomers are never raided: they have no castle yet, then a 48-hour novice shield from the moment they open it (the plan's `created_at + 48h`, counted from the castle, not the account).
- **Progressive tabs** (the plan's "progressive unlock gates"):
  - Citadel and Garrison are open from the start.
  - Incursions opens once any unit reaches level 3.
  - The War Room opens at an average castle level of 5, with its novice shield noted.
  - The Reliquary opens with the first war mark earned.

## 7. How Castle Clash touches the rest of the game

The plan's Sovereign Edicts and Deep Foundation Excavation reach into the main game ("idle gold", "idle XP", "drop rate", a "global idle multiplier"). They land like this:

| Plan | Effect in Idle Clash |
| --- | --- |
| Edict of Harvest (idle gold) | +10% to +20% gold from fights (a foe's gold drop) |
| Edict of Vigor (idle XP) | +10% to +20% XP in every skill |
| Edict of Fortune (drop rate) | Rare and Legendary finds +10% to +20% likelier (the same effect as `findChance` perks) |
| Excavation's idle multiplier `1 + 0.02 × √depth` | Multiplies the active edict's bonus and the castle's own idle AP. Never raw XP, so it cannot run away with the year's pacing |

- The engine is pure and plays offline time from the save alone, so the castle's effect is mirrored into the save: `features.castle = { edict, pct }`. It is refreshed in every request of the owner's, inside the same transaction that reads their row; a raid that drops a defender's treasury below the requirement takes effect from their next request.
- The year's simulation (Phase 6) checks every year target with an edict running.
- Gold spent in Castle Clash is the same gold as everywhere else. Castle Clash never makes gold: its only payouts are other players' raided gold (65% of it) and mercenary bounties from the war chest, which is fed only by burns.
- The steading, Storehouse, goals and deeds are unchanged by Phase 1. Deeds for Castle Clash (first siege won, a castle level, the Reliquary full) are a Phase 6 improvement.

## 8. Gold on this game's scale

The plan's gold figures assume a small economy (`requiredTreasury` starts at 1,120). A steady player here holds about 16 million gold by day 30 and earns about 1.5 million a day all year (`.verify/year.md`). All castle gold is scaled by one constant, `GOLD_SCALE = 100`, applied to the plan's formulas without changing their shape:

- **Required treasury:** `requiredTreasury = round(GOLD_SCALE × 1000 × 1.12^avgLevel)`. That is 112,000 at level 1, 3.3 million at 30 and 32 million at 50.
- **Upgrades:** `upgradeGoldCost(base, level)` uses the plan's `1.18^level` from per-track bases of 2,000 to 5,000 gold. Every track to level 50 costs about 600 million in all, a year of a steady player's gold, and the climb goes on past it.
- Phase 6 replays a castle alongside the year's simulation and tunes the constants, never the formulas.

## 9. What must keep working

- **Account deletion:** removes the player's castle row and reports, and replaces their id in other castles' reports and pair limits with `departed` (built in Phase 1). The deletion test reads every table.
- **Banned players:** neither found in matchmaking nor able to act.
- **Rate limits:** castle routes share the 30-per-10-seconds limit of every changing request; reads share the 120-a-minute read limit.
- **Contracts:** every castle route is a contract with a strict schema, so the hostile-input suite covers it.
- **Notices and moments:** a defender hears of each siege and failed spy mission in their notices tray, and on their open pages through the live channel.

## 10. The content (`bastionConfig`)

`packages/content/src/castle/` holds every number and every piece of content, by id. Names reach the page through the strings file in Phase 4.

- **Units** and their evolutions (levels 1, 10, 25, 50). Each later evolution adds a passive:
  - Vanguard (Levy Spearmen → Ironclad Halberdiers → Sunforged Phalanx → Immortal Aegis): +10% in defence; −20% wounds; immune to traps.
  - Outriders (Border Scouts → Lancer Dragoons → Shadowmane Cavaliers → Stormhoof Cataphracts): +10% spy stealth; +10% loot; +10% in attack.
  - Siege (Timber Trebuchets → Dwarven Bombardiers → Alchemical Hellcannons → Arcane Conflux Engines): +5% wall penetration; +25% damage to walls; +10% more penetration.
- **Buildings**: Walls, Deep vault (adds nothing to the rating), Beacon tower, Spy guild.
- **Traps**: Boiling pitch, Spiked palisades and Counter-battery, against vanguard, outriders and siege.
- **Castellans**:
  - The Iron Marshal: +10% penetration, +10% siege, half-price repairs.
  - The Whisper Weaver: +25% stealth, +10% outriders, −20% bribes.
  - The Golden Archon: +10% vault protection, +20% war marks, −15% excavation.
- **Realm decrees**, weekly, each kept inside Castle Clash: Iron ramparts (+15% defence), Long shadows (+15% stealth), Open coffers (half upkeep), War banners (+25% war marks), Forge fires (−10% upgrade costs).
- **Incursion fortresses**, in turn by tier: The Ashen Redoubt, Citadel of the Blind Wyrm, The Sunken Reliquary (the plan's three), Thornwall Keep, The Gloaming Spire, Hollow Crown Hold. Each has its own garrison and trap, which scouting reveals.
- **The War College**, four trees of ten ranks: Logistics (+12 AP cap a rank, the plan's "expandable via Logistics Tech"), Siegecraft (+2% penetration and +2% attack), Fortification (+2% defence), Espionage (+5% stealth and detection).
- **War relics**, nine of five levels each, three worn at once:
  - Banner of the First King (+3% attack); Aegis Shard (+3% defence).
  - Wyrmglass Lens (+6% stealth); Sentinel's Eye (+6% detection).
  - Oathbound Horn (+5% war marks); Gilded Ledger (+2% vault protection).
  - Ember of Sieges (+3% penetration); Mender's Mortar (+10% recovery); Tidings Stone (+3% AP).
  - Each level's figure counts again. The three best by combat score count towards the castle rating, worn or not, so the rating only rises.

## 11. Phases

| Phase | Session | Delivers |
| --- | --- | --- |
| 1 | 28 | This file and `SPEC.md`; the three tables and their migration; `bastionConfig` with tests |
| 2 | 29 | The pure engine and its tests (multi-day offline AP, streaks, ratings, the matrix, espionage and anti-collusion rules, sinks) |
| 3 | 30 | The service and routes: transactions, the castle mirror into the save, notices, deletion |
| 4 | 31 | The page: the header strip and five tabs, strings and glossary, the menu entry, IA.md |
| 5 | 32 | The sweep across Castle Clash and its seams with the rest of the game |
| 6 | 33 | Simulated play: many castles over weeks, the year with an edict, tuning, improvements |
