<!-- The owner's plan for Castle Clash, kept verbatim as received on 2 November 2026 (sessions 28 onward). DESIGN.md says how it maps onto Idle Clash and settles what it leaves open. -->

# Role & Objective
You are a Principal Game Systems Architect & Full-Stack Engineer implementing **"The Sovereign's Bastion" (V4)**—an idle castle attack/defense, espionage, PvP, and endless solo progression gold-sink expansion for my online fantasy text-based idle game.

You must deliver **complete, production-ready code with zero `TODO` placeholders**, adhering strictly to the mathematical formulas, anti-collusion guardrails, server-efficiency rules, and visual aesthetic requirements below.

---

## PHASE 0: Mandatory Codebase & Visual Aesthetic Discovery (DO THIS FIRST)
Before writing any code:
1. Inspect the existing project repository to identify:
   - Backend language, framework, ORM/SQL driver, authentication/session handling, and how `users` and `gold` are stored and updated.
   - Frontend architecture (templates/components), CSS variables, color tokens, panel/card borders, typography, tables, progress bars, buttons, and modal/toast patterns.
   - The dark-fantasy narrative tone used across existing game features.
2. **Strict Visual Consistency Rule:** Every panel, tab, badge, log entry, and button in The Sovereign's Bastion MUST use the exact CSS classes, design tokens, and layout structures of the existing game. Do NOT introduce external CSS libraries or clashing styles.

---

## 1. Server Efficiency & Database Architecture
To guarantee minimal CPU, RAM, and DB IOPS under heavy load:
1. **Zero Midnight Cron Jobs:** Never run batch jobs at 00:00 UTC. All Action Points (AP), streaks, treasury upkeep, passive healing, and weekly mutators are evaluated **lazily** on read/write.
2. **Single-Row Denormalized Player State (`player_bastions`):**
   - Store all Bastion state for a user in a single row (`PRIMARY KEY (user_id)`).
   - Store levels, XP, timestamps, and formation percentages as typed columns.
   - Store bounded collections (`active_debuffs`, `debuff_immunities`, `equipped_relics`, `pair_limits`) as compact JSON/JSONB columns with hard array caps (max 20 entries).
   - **2-Row Combat Reads:** Resolving any PvP siege or spy mission must lock and read **only 2 rows**:
     `SELECT * FROM player_bastions WHERE user_id IN ($1, $2) ORDER BY user_id ASC FOR UPDATE`
3. **Global Recycled Burn Pool (`bastion_global_state`):**
   - Single-row table (`id = 1`) holding `war_chest_reserve_gold BIGINT DEFAULT 0`.
   - Whenever Gold is burned across the Bastion (upgrades, upkeep, bribes, 35% raid tax), **95% is permanently destroyed** from the economy and **5% is added to `war_chest_reserve_gold`** to fund fallback NPC Mercenary bounties without ever minting new gold.
4. **Matchmaking Index & Ring-Buffer Logs:**
   - Index: `CREATE INDEX idx_bastion_matchmaking ON player_bastions (bastion_rating, shield_until_utc);`
   - Table `bastion_logs`: Indexed by `(user_id, created_at DESC)`. Automatically prune logs beyond the latest **20 entries per player** on insert.
5. **Deadlock-Free Transactions:**
   - Every mutation must run inside a DB transaction using `SELECT ... FOR UPDATE`.
   - Whenever locking two users (Attacker and Defender), ALWAYS lock rows in ascending `user_id` order (`Math.min(idA, idB)` then `Math.max(idA, idB)`).

---

## 2. Stateless Lazy Action Points (AP) & "Call to Action" (CTA) Engine
- **Constants:**
  - `BASE_AP_PER_HOUR = 10.0`
  - `BASE_ACTIVE_AP_CAP = 240.0` (expandable via Logistics Tech)
  - `MAX_STREAK = 14` (+1% AP speed per streak day, max +14%)
  - `DAILY_CTA_INSTANT_BONUS_AP = 5.0`
- **Columns on `player_bastions`:**
  - `active_ap` (float, default 60.0)
  - `last_ap_sync_at` (UTC timestamp)
  - `last_cta_date_utc` (`YYYY-MM-DD` string, nullable)
  - `streak_at_last_cta` (int, 0 to 14, default 0)

### Stateless Lazy Sync Algorithm (`syncPlayerBastion(state, nowUtc)`)
1. `todayStr = formatUtcDate(nowUtc)`, `midnightTodayUtc = startOfUtcDay(nowUtc)`.
2. **Step A — Credit Any Unclaimed Active Hours from the Player's Last CTA Day:**
   - If `last_cta_date_utc != null`:
     - Let `ctaActiveUntilUtc = endOfUtcDay(last_cta_date_utc)` (i.e. `00:00:00 UTC` of the day following `last_cta_date_utc`).
     - If `last_ap_sync_at < ctaActiveUntilUtc`:
       - `activeMult = 1.0 + (min(streak_at_last_cta, 14) * 0.01)`
       - `creditEndUtc = min(nowUtc, ctaActiveUntilUtc)`
       - `elapsedActiveHours = max(0.0, (creditEndUtc - last_ap_sync_at) / 3600.0)`
       - `active_ap = min(activeApCap, active_ap + (elapsedActiveHours * BASE_AP_PER_HOUR * activeMult))`
       - `last_ap_sync_at = creditEndUtc`
3. **Step B — Compute Current Effective Streak (Stateless & Idempotent):**
   - If `last_cta_date_utc == null`: `effectiveStreak = 0`
   - Else:
     - `missedFullDays = max(0, daysBetween(last_cta_date_utc, todayStr) - 1)`
     - `effectiveStreak = max(0, streak_at_last_cta - (3 * missedFullDays))`
4. **Step C — Compute Today's Pending Reserve AP (`pending_reserve_ap`):**
   - If `last_cta_date_utc == todayStr`:
     - `pending_reserve_ap = 0.0`
   - Else (`last_cta_date_utc != todayStr`):
     - `reserveMult = 1.0 + (min(effectiveStreak, 14) * 0.01)`
     - `hoursSinceMidnight = max(0.0, min(24.0, (nowUtc - midnightTodayUtc) / 3600.0))`
     - `pending_reserve_ap = hoursSinceMidnight * BASE_AP_PER_HOUR * reserveMult`

### Action `claimCallToAction(userId, nowUtc)`
1. Lock player row `FOR UPDATE` and run `syncPlayerBastion(state, nowUtc)`.
2. Assert `last_cta_date_utc != todayStr` (else throw `AlreadyClaimedTodayError`).
3. `newStreak = min(14, effectiveStreak + 1)`
4. `newMult = 1.0 + (newStreak * 0.01)`
5. Retroactively compute today's reserve from `midnightTodayUtc` at `newMult`:
   - `hoursSinceMidnight = max(0.0, (nowUtc - midnightTodayUtc) / 3600.0)`
   - `claimedReserve = hoursSinceMidnight * BASE_AP_PER_HOUR * newMult`
6. `active_ap = min(activeApCap + 25.0, active_ap + claimedReserve + DAILY_CTA_INSTANT_BONUS_AP)`
7. Update columns:
   - `streak_at_last_cta = newStreak`
   - `last_cta_date_utc = todayStr`
   - `last_ap_sync_at = nowUtc`

---

## 3. Strictly Deflationary Gold Sink Economy & Treasury Lockdown
**Economic Law:** The Bastion NEVER mints new Gold. Every gold sink permanently destroys **95%** of spent gold and routes **5%** to `bastion_global_state.war_chest_reserve_gold`.

1. **Exponential CapEx vs. Sub-Linear Combat Power:**
   - `upgradeGoldCost(baseCost, level) = round(baseCost * pow(1.18, level))`
   - `statPower(baseStat, level) = baseStat * pow(level, 1.05)`
2. **The Bastion Treasury & Scaling Sovereign Edicts (Prevents Zero-Gold Hiding):**
   - Players deposit Gold into `bastion_treasury` to power one active **Sovereign Edict** (*Edict of Harvest*: Idle Gold boost; *Edict of Vigor*: Idle XP boost; *Edict of Fortune*: Drop Rate boost).
   - **Minimum Treasury Requirement:** `requiredTreasury = round(1000 * pow(1.12, avgBastionLevel))`.
   - **Greed-Scaling Buffs:** At `bastion_treasury == requiredTreasury`, the Edict grants its base bonus (`+10%`). Holding more gold in `bastion_treasury` scales the bonus logarithmically up to **2x (`+20%`)** at `5 * requiredTreasury` (`bonus = baseBonus * min(2.0, 1.0 + 0.25 * log2(bastion_treasury / requiredTreasury))`). If `bastion_treasury < requiredTreasury`, the Edict deactivates and defending troops suffer `-20% Unpaid Garrison Morale`.
   - **Treasury Withdrawal Tax & Recon Lockdown:**
     - Spending `bastion_treasury` gold directly on Bastion upgrades/troops/excavations has **0% tax**.
     - Withdrawing gold from `bastion_treasury` back to personal wallet incurs a **20% Smuggling Burn Tax** and is **blocked if `recon_lockdown_until_utc > nowUtc`** (triggered for 30 minutes whenever the castle is scouted).
   - **2% Daily Upkeep Burn (With 48h Vacation Auto-Pause):**
     - Lazily burns `2%` of `bastion_treasury` per 24h while an Edict is enabled. Automatically pauses if more than 48 hours have elapsed since `last_cta_date_utc`.
   - **Deep Vault Protection Cap:** `deep_vault_level` protects a flat base + percentage of `bastion_treasury`, hard-capped at **75% maximum protection** so at least 25% of an active Treasury is always raidable.

---

## 4. Intrinsic Bastion Rating, Matrix Combat & Anti-Collusion Engine

### A. Intrinsic Military Bastion Rating (Monotonic & Matchmaking-Accurate)
- Compute `bastion_rating` purely from unlocked permanent military/fortification power (so peaceful Excavations do not inflate PvP brackets, and high-level players stay on the same $L^{1.05}$ scale as combat power):
bastion_rating = round(
statPower(100, castle_walls_level) +
statPower(80, watchtower_level) +
statPower(60, spy_guild_level) +
statPower(100, vanguard_level) * (1 + vanguard_mastery_bonus) +
statPower(100, outriders_level) * (1 + outriders_mastery_bonus) +
statPower(100, siege_level) * (1 + siege_mastery_bonus) +
top3OwnedRelicsCombatScore
)
- New players receive a **48-hour Novice Protection Shield** (`shield_until_utc = created_at + 48h`), which breaks early only if they initiate a PvP siege.

### B. Separate Offense & Defense Formations + Recon Pinning
- Store `offense_formation` (`off_v_pct`, `off_o_pct`, `off_s_pct`) separately from `defense_garrison` (`def_v_pct`, `def_o_pct`, `def_s_pct`).
- `offense_formation` can be adjusted freely per attack.
- Changing `defense_garrison`, `active_trap`, or `castellan_doctrine` costs `1%` of `requiredTreasury` in Gold, triggers a **2-hour cooldown**, and is **blocked while `recon_lockdown_until_utc > nowUtc`** (15 minutes after being successfully scouted by an enemy spy).

### C. Exact $3 \times 3$ Bilinear Matrix Combat Equation
Let unit indices be $0 = \text{Vanguard}$, $1 = \text{Outriders}$, $2 = \text{Siege}$.
1. **Combined Arms Penalty (Anti-100% Mono-Stacking):**
 - For any share $p_i \in [0, 1]$ (where $\sum p_i = 1.0$), if $p_i > 0.60$, apply flank penalty:
   $$\text{flankMult}(p_i) = 1.0 - 0.5 \times (p_i - 0.60)$$
2. **The $3 \times 3$ Tactical Counter Matrix ($M$):**
 $$M = \begin{pmatrix} 1.00 & 1.35 & 0.75 \\ 0.75 & 1.00 & 1.35 \\ 1.35 & 0.75 & 1.00 \end{pmatrix}$$
 - For Attacker shares $a = (a_0, a_1, a_2)$ and Defender shares $d = (d_0, d_1, d_2)$:
 - Attacker unit $i$'s tactical multiplier against Defender's formation is:
   $$\text{tacMult}_{A,i} = \sum_{j=0}^{2} d_j \cdot M_{i,j}$$
 - Defender unit $j$'s tactical multiplier against Attacker's formation is:
   $$\text{tacMult}_{D,j} = \sum_{i=0}^{2} a_i \cdot M_{j,i}$$
3. **Castle Traps & Wall Penetration:**
 - Defender's active trap (`BOILING_PITCH` vs $i=0$, `SPIKED_PALISADES` vs $i=1$, `COUNTER_BATTERY` vs $i=2$) reduces the targeted Attacker unit's effective power by $20\%$ (unless disabled by `SABOTAGE_GATEHOUSE`).
 - Attacker's Siege share ($a_2$) bypasses $0.25 \times a_2$ (plus Iron Marshal / Tech bonuses) of Defender's `castle_walls` defense multiplier.

### D. Espionage & Pair-Scoped Anti-Collusion Rules
- **Interaction Cap:** Max **2 PvP sieges** and **3 spy missions** from `attacker_id` to the same `defender_id` per rolling 24h.
- **Spy Cost:** `AP + Gold Bribe` scaled to `max(attacker.bastion_rating, defender.bastion_rating)`.
- **Pair-Scoped Failure Penalty (Prevents Alt-Account Buff Farming):**
- If a spy fails, it NEVER gives the defender a global buff. Instead, it increments a `compromised_network` stack on the `(attacker_id -> defender_id)` pair (`-25%` spy stealth for that attacker against that defender for 12h, max 3 stacks) and awards the defender **Defensive War Marks**.
- **4 Spy Missions & Consumed-Only Immunity (Prevents Alt Pre-Immunization):**
1. `SCOUT_BASTION`: Reveals Defender's exact `defense_garrison` %, `active_trap`, Castellan, Relics, and raidable Gold. Sets `defender.recon_lockdown_until_utc = nowUtc + 15 minutes`.
2. `POISON_WELLS`: `-8%` defender combat power for 4h (max 2 stacks = `-16%`).
3. `SABOTAGE_GATEHOUSE`: Disables defender's `active_trap` for the next Genuine Siege within 2h (max 1 stack).
4. `FORGE_ORDERS`: Shifts defender's `defense_garrison` ratios by $15\%$ toward `33/33/34` for 2h (max 1 stack).
- **CRITICAL ANTI-COLLUSION RULE:** A **4-hour Sabotage Immunity** for `POISON_WELLS`, `SABOTAGE_GATEHOUSE`, or `FORGE_ORDERS` is granted **ONLY when that debuff is consumed in a Genuine Siege**. If a debuff simply expires by timer without a Genuine Siege occurring, it clears with **zero immunity cooldown**.

### E. Anti-Snowball Guardrails, Vigilance & Combat Brackets
1. **Supply Line Overextension:**
 - `brRatio = defender.bastion_rating / max(1, attacker.bastion_rating)`
 - If `brRatio < 0.80`: Attacker mobilization Gold cost multiplies by `pow(0.80 / brRatio, 2.5)` and max raidable gold / War Marks multiply by `pow(brRatio / 0.80, 2.0)`.
2. **Overextension Fatigue:**
 - First 3 PvP sieges per UTC day cost base AP/Gold. Each additional PvP siege that day costs `+35% Gold` and `+20% AP`.
3. **Genuine Siege Verification (Prevents Alt Shield Triggering):**
 - A battle only qualifies as a **Genuine Siege** if `brRatio <= 1.35` AND combat ratio `R >= 0.85`.
 - Each Genuine Siege received in a rolling 12h window grants the defender `+1 Vigilance Stack` (`+12%` Defense, `-25%` raidable gold, max 2 stacks) and consumes active sabotage debuffs (granting their 4h immunity).
 - On the **3rd Genuine Siege** received within 12h, Vigilance clears and activates a **6-hour Sovereign Truce Shield** (`shield_until_utc = nowUtc + 6h`).
4. **Combat Ratio (`R`) & Spoils Distribution:**
 - `R = (attackerTotalPower * randomUniform(0.96, 1.04)) / defenderTotalPower`
 - `R < 1.00` (**Repelled Siege**): Attacker loots `0` Gold (`100%` of mobilization fee burned: `95%` destroyed, `5%` to global `war_chest_reserve_gold`). Defender earns **Defensive War Marks**.
 - `1.00 <= R < 1.25` (**Grazing Breach**): `lootFactor = 0.20 + 0.80 * ((R - 1.00) / 0.25)`. Attacker raids `raidedGold = round(raidableGold * lootFactor)`.
 - `R >= 1.25` (**Decisive Breach**): Attacker raids `100%` of `raidableGold`.
 - **35% Spoils of War Burn:** Defender loses `100%` of `raidedGold` from `bastion_treasury`. Attacker receives `65%` of `raidedGold` (`30%` permanently destroyed, `5%` added to `war_chest_reserve_gold`) + **War Marks**.
5. **Matchmaking Fallback (Shadow Mercenary Contracts):**
 - When querying PvP targets, return up to 5 unshielded human players in `[0.75 * myBR, 1.35 * myBR]`. If fewer than 5 exist, pad the remaining slots with procedural **Rival Mercenary Strongholds** scaled around `myBR`. Winning against a Mercenary Stronghold awards full War Marks plus a Gold payout drawn strictly from `min(mercenaryBountyCap, war_chest_reserve_gold * 0.05)`.
6. **Non-Punishing Infirmary & Wall Integrity:**
 - Wall Integrity never drops below `50%`; wounded troops in `infirmary_pct` never exceed `30%`. Both recover passively at **+5% per hour for free** (lazily evaluated) or instantly via Gold + AP.

---

## 5. Content Systems, Endless Solo Sinks & 5-Tab UI Architecture

### Content Depth (Defined in Static In-Memory Configs)
1. **3 High Castellan Doctrines:** *The Iron Marshal* (Siege/Repair focus), *The Whisper Weaver* (Espionage/Outrider focus), *The Golden Archon* (Vault/PvE/Excavation focus).
2. **Unit Evolutions (Levels 1, 10, 25, 50):** Named fantasy evolutions with milestone passives for Vanguard (*Levy Spearmen -> Ironclad Halberdiers -> Sunforged Phalanx -> Immortal Aegis*), Outriders (*Border Scouts -> Lancer Dragoons -> Shadowmane Cavaliers -> Stormhoof Cataphracts*), and Siege (*Timber Trebuchets -> Dwarven Bombardiers -> Alchemical Hellcannons -> Arcane Conflux Engines*).
3. **Weekly Rotating "Realm Decrees":** Deterministic mutator (`floor(nowUtcSeconds / 604800) % 5`) cycling through 5 realm-wide rules with zero cron jobs.
4. **3 Endless Solo AP & Gold Sinks:**
 - **Phantom Incursions (PvE):** Assault 6 rotating named boss fortresses (*The Ashen Redoubt*, *Citadel of the Blind Wyrm*, *The Sunken Reliquary*, etc.) scaled to `incursion_tier` for War Marks and Mastery XP.
 - **Imperial Drilling:** Spend AP on any troop archetype for permanent asymptotic Mastery (`bonusPct = 50.0 * (1.0 - exp(-mastery_xp / 10000.0))`).
 - **Deep Foundation Excavation:** Spend AP + Gold to permanently increase `excavation_depth`, expanding Vault protection and granting an uncapped global idle multiplier (`1.0 + 0.02 * sqrt(excavation_depth)`).
5. **The War Marks Reliquary:** 9 unlockable/upgradable fantasy Relics purchased with `war_marks` + `Gold` (3 active socket slots).

### Clean 5-Tab UI Layout (With Progressive Unlock Gates)
Organize the frontend into 5 clean sub-tabs matching the game's existing aesthetic:
- **Persistent Top Header:** Displays Active AP, Pending Reserve AP, the **"Call to Action"** button + Streak Flame counter (`0/14`), Active Weekly Realm Decree badge, Treasury Gold (Protected vs. Raidable), and Truce Shield / Vigilance status.
- **Tab 1: Citadel & Treasury** — Sovereign Edicts, Deposit/Withdraw Treasury, Castle Buildings (`Walls`, `Deep Vault`, `Watchtower`, `Spy Guild`), Instant Wall Repair, and Deep Foundation Excavation.
- **Tab 2: Garrison & War College** — Vanguard/Outriders/Siege upgrades & evolution badges, Offense vs. Defense Formation sliders (with live >60% Flank Penalty warning), Active Castle Trap selector, Castellan Doctrine, Imperial Drilling, Infirmary healing, and 4 War College Tech trees.
- **Tab 3: War Room & Espionage (PvP)** — Matchmaking target list (Human Lords + Fallback Mercenary Strongholds), Spy Mission dispatcher, Siege launcher, and the 20-entry Interactive Battle/Espionage Report log.
- **Tab 4: Phantom Incursions (Solo PvE)** — Current `Incursion Tier` boss fortress card, Scout Citadel button, and Launch Incursion button.
- **Tab 5: The Reliquary** — 3 Active Relic Sockets and the 9 Relic Forge cards.

---

## Staged Implementation Plan (Execute Without Truncation)
To ensure zero truncated code or `TODO` placeholders, execute this build in **4 sequential phases**:
- **Phase 1:** Perform **Phase 0 Codebase & Aesthetic Discovery**, summarize findings, and generate the complete SQL migrations (`player_bastions`, `bastion_global_state`, `bastion_logs`) plus the static configuration file (`bastionConfig`).
- **Phase 2:** Implement the pure-function Math & Lazy Sync Engine (AP/Streak sync, Intrinsic BR, $3 \times 3$ Matrix Combat, Espionage, Solo Sinks) and run unit tests verifying multi-day offline AP credit and anti-collusion rules.
- **Phase 3:** Implement the transactional Backend Service and REST/RPC API controllers with `SELECT ... FOR UPDATE` row locking.
- **Phase 4:** Implement the complete 5-Tab Frontend UI using the game's exact native CSS styles and components.
- **Phase 5:** Conduct a thorough bug and oversight sweep on every aspect of Castle Clash and ensure that it doesn't introduce bugs or oversights with the rest of the game.
- **Phase 6:** Simulate testing castle clash and fix all issues identified after the simulation. Make any other improvements that you seem fit.

Start now with **Phase 1**.