# Idle Clash: the expansion before launch

26 October 2026 · decided by the owner, planned by the lead designer

The owner wants a game that can be played comfortably for a year without boredom, before launch. On 26 October 2026 the owner settled four things:

- **The climb:** level 99, over eight tiers.
- **New skills:** Fishing and Cooking, Fletching and Runecraft.
- **Endgame systems first:** Expeditions, Kindling (in place of Rekindling, see section 3), and Deeds and titles.
- **Testing:** build first, then test once with a handful of players before public launch.

This file turns those decisions into a plan. Version 1's rules all still hold:

- every level gives something;
- text is generated from numbers;
- a feature never imports another;
- no new menu entry;
- each step proves something and ends with verify green.

## 1. What a year of play looks like

| When | What the player is doing |
| --- | --- |
| First hour | Ten levels in a first skill, a first sword worn, a first rare find; the first steps lead the way |
| First week | Every skill opened; the second tier in most; the first foes of the march beaten with home-made gear and home-cooked fish |
| First month | Level 40 in a favourite skill; the march's last foe; the Fen opens (tier 5); the first deeds and a first title |
| Months 2 to 3 | The Fen and the Ashen Peaks; tier 6 and 7 gear; expeditions become the main reason to fight; the first 99 in one skill |
| Months 3 to 6 | Expedition bosses and their relics; the first Kindling of a maxed skill, and the Path it walks; deeds by the hundred |
| Months 6 to 12 | Every skill climbing to 99; second and third Kindlings; the rarest finds and deeds; a place on the ladders |
| After a year | Kindling never ends; seasons (built after launch with real players) give each eight weeks a fresh ladder |

## 2. Targets (added to the brief's; a result outside 25% is a design bug)

The first 40 levels keep their present pace, so everything already proven still holds.

| Target | Measured by |
| --- | --- |
| One skill kept in its lane: level 40 in about 3 weeks, 55 in about 7, 70 in about 10½, 85 in about 13, **99 in about 15 weeks** (a level past 40 takes about two days at first and about one near the top; set in session 12, when 40 at 3 weeks and an XP cost that never falls fixed the shape) | The model and the year-long simulation |
| **Every skill at 99 in about a year** of daily play (an active hour a day with the fire, the rest away) | The year-long simulation, all lanes busy |
| A notable event about every 2 minutes of active play **at every stage of the year**, never more than 5 minutes without one | The simulation, sampled at day 1, 7, 30, 90, 180 and 365 |
| Something new to aim for **every day of the year**: the day's own goal, and a first (a level, a tier, a mastery step, a deed, a title, a boss, a relic, a find, a Kindling) | The year's simulation: a daily goal set and done every day, and a first on all but about one day in fifty, never two days running without one (sharpened in step 18: a level costs about a day of a lane in mid-climb, so no achievement can promise one every single day; the daily goal does) |
| At every tier, at least two viable choices (recipe, style, target, route) within 20% of each other | Simulated strategies compared |
| Home-cooked food beats the vendor's from tier 2 on; ammunition pays for itself in faster kills | The simulation |
| An expedition of any length pays at least as well as the same time in the plain lanes, and better in rare rewards | The simulation |
| A Kindling takes about a quarter of the first climb's time at the top's pace, and each Path pays what it says | The model, and the real engine's tests |

## 3. The new content

### The climb to 99 over eight tiers

Tiers open at levels **1, 10, 20, 30, 40, 55, 70 and 85**. The gaps grow, so the late tiers feel earned. The XP table is refitted above 40 to the targets; the table below 40 is unchanged.

| Tier | Opens | Metal (bar) | Logs | Ore | Fish |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | Copper | Pine | Copper ore | Perch |
| 2 | 10 | Bronze | Ash | Tin ore | Trout |
| 3 | 20 | Iron | Oak | Iron ore | Pike |
| 4 | 30 | Steel | Yew | Coal | Salmon |
| 5 | 40 | Moonsilver | Maple | Moonsilver ore | Eel |
| 6 | 55 | Star-iron | Silverbark | Star-iron ore | Sturgeon |
| 7 | 70 | Embersteel | Elderwood | Ember ore | Glowfin |
| 8 | 85 | Dawnsteel | Ancient | Dawnstone | Sunscale |

- **Names:** new metals and woods are original, in the spirit of the world: no borrowed names.
- **Alloys:** later bars keep earlier ores in use. Coal stays in every bar from tier 4 up, in growing amounts.
- **Gear:** each tier has three weapons and three armour pieces, as now: 48 pieces in all.

### Regions and foes

Regions appear as tabs at the top of Combat, already the home given in the page map. Each region ends in a boss.

| Region | Tiers | Foes | Boss |
| --- | --- | --- | --- |
| The march (today) | 1 to 4 | 8 | The Troll-chief of the hill |
| The Sunken Fen | 5 to 6 | 6 | The Drowned Warden |
| The Ashen Peaks | 7 to 8 | 6 | The Ember Wyrm |

- **Foes:** every foe still has a style and a Your odds verdict.
- **Bosses:** fought once a day in the Combat lane, or at the end of an expedition. They drop relics (see Expeditions) and boss-only finds for the collection log.

### Four new skills

| Skill | Lane | What it does | What it feeds |
| --- | --- | --- | --- |
| Fishing | Gathering | Eight waters, a standard catch and a rich one per tier, as for trees and veins | Cooking |
| Cooking | Artisan | Raw fish cooked over logs; from tier 3, pies and stews that mix fish with other catches | Food for every fight |
| Fletching | Artisan | Arrows from logs and bars, each tier's arrows stronger | Archery |
| Runecraft | Gathering | Runes drawn at the old standing stones; higher stones need a key bound from bars | Magic |

- **Food:** the vendor keeps selling bread, meat pie and stew as a fallback. From tier 2, home-cooked food heals more for its cost, so feeding yourself is a real choice.
- **Supplies, one slot per style:** Archery takes arrows and Magic takes runes. Melee takes whetstones, which Smithing makes, so the triangle stays fair. Supplies are optional, add damage by tier, and are used one per foe fought (settled in session 14: a swing every 3 seconds would use about 1,200 an hour, more than any lane could make, so a supply covers a whole fight, and arrows and whetstones come 25 at a time, runes eight).
- **Finds:** each new skill has six finds. With boss finds, the collection log grows from 36 to 66 entries.
- **Skill count:** eleven skills in all. Gathering holds four (the fire's second lane matters more), Artisan three, and Combat three styles plus Hitpoints.

### Deeds and titles

- **Deeds:** about 300 achievements, in tiers of easy, hard, elite and master:
  - levels and tiers in every skill;
  - mastery;
  - finds and the whole log;
  - foes defeated, with counts;
  - each boss;
  - expedition routes and twists;
  - Kindlings;
  - the fire kept burning;
  - and a few hidden ones.
- **Rewards:** each deed gives deed points. Points and particular deeds unlock **titles** (shown beside your name on the hiscores), **banner colours** and **seal frames**.
- **Home:** a Deeds tab on Hiscores. A deed done has its moment, like a find.
- **Built in step 15:** 272 deeds (bosses, expeditions and Kindlings add theirs in steps 16 and 17), worth about 8,000 points; step 18 found them done by about day 90 and spread them over the year (levels every five to fifteen past 40, work to 300,000 actions, a million fights, forty actions mastered, 250 runs, each boss a hundred times): about 400, worth about 13,700, the titles by points spaced from day 2 to day 335. Titles show beside your name on every ladder and on the Hearth's plaque, which also wears your banner's colour and frame. Deeds are recorded by the page asking the server whenever one is done, wherever the player is; each has its moment (easy a toast, hard a banner, elite and master the centre). Their pace over the year is measured in step 18.

### Expeditions

- **What it is:** a run into a region for 1, 2, 4 or 8 hours, in the Combat lane, while you are away or present.
- **Route:** each run is a route of stages drawn fresh each time: fights, a gathering cache, a camp that heals, a fork you choose at the start, and the region's boss at the end.
- **Twists:** a run carries one or two, for example:
  - "Fog: −20% accuracy, finds twice as likely";
  - "Hungry wolves: food heals less, foes drop more";
  - "Old roads: the run is shorter".
- **Rewards:**
  - expedition marks, spent on relics: lasting small boosts such as "+3% Fishing XP", "food heals 5% more" or "a seventh Storehouse row". Each relic has ranks;
  - boss finds;
  - deeds.
- **Recap:** the run's story arrives in the away recap: "Took the high fork, beat the Drowned Warden, found a sunken locket."
- **Home:** a tab of Combat, as the page map already says.
- **Built in step 16:** stages are ten minutes of fighting, six an hour, against the three foes of the region the fighter fares best against (the best half the time), so a run keeps pace with the lane; its fights pay a quarter more XP and gold than the lane's, and a cache an hour and the boss pay on top, so every length pays at least the lane's best (the model and the real engine both measure it). Caches and camps come after a stage rather than taking time of their own. Twists: fog, hungry wolves, old roads, a warband, laden caravans and storm; roads: the high pass, the low road, the old shrine, the hunters' trail and the warden's gate. Relics: one for each skill (+1% XP a rank), the hearthstone (food), the four-leaf charm (finds) and the builder's cord (Storehouse rows); every relic at full rank takes about two months of daily runs at the top. Each boss's Legendary find makes its wins pay half again as many marks.

### Kindling (in place of Rekindling)

- **First planned as Rekindling:** a maxed skill back to level 1, keeping a lasting mark and its mastery and finds, with a twist chosen for the new climb ("Lean years: half the materials, double the finds").
- **Set aside (28 October 2026):** the owner asked for it to be weighed against immersion and the game as a whole. A reset takes away a skill's tools, unlocks and its materials' place in every other skill, so one choice ripples through the Storehouse, Combat and the goals; twists that change how a skill works break rules the rest of the world keeps. It was replaced by Kindling, which keeps Rekindling's purpose and takes nothing away.
- **Kindling:** past 99 a skill's XP keeps counting, and each Kindling's worth (about a quarter of the first climb at the top's pace) is a Kindling:
  - a flame on the skill's seal (up to five drawn), and a count on its hiscore row;
  - deeds for each skill's first and fifth, and ten across every skill, with two titles;
  - for the first five, a stronger Path.
- **Paths:** at 99 each skill with work of its own, and each style, takes one: Bounty (more of what it makes; in combat, drops and gold), Lore (more XP) or Fortune (more finds). It is free and changed whenever the player likes, so it is a way to play, never a choice to regret.
- **Home:** the skill's own page, above its ladder; every Kindling has its moment and its line in the away recap.
- **Built in step 17:** Kindlings of 37 million XP; Bounty and Lore +15%, Fortune +50% at 99, rising by a fifth of that with each of the first five Kindlings (the model's numbers are in GAME_DESIGN.md section 4).

## 4. Feel: progress that is seen and heard

This step comes first, because it makes every later step land harder.

- **Seals that grow:** each skill's seal is framed in the metal of the highest tier reached, from copper to dawnsteel, with a small star at 99 and a flame for each Kindling past it. Seals are seen on Skills, on each skill's page and on the hiscores.
- **Total level and a rank:** your total level, and a rank title that rises with it ("Wanderer" to "Warden of the March"), in the header on wide screens and on the Hearth.
- **Every completion lands:**
  - the XP earned rises from the lane, "+52 XP" (already in the gains feed, now also on the lane card);
  - mastery shows as ten pips that fill on each action row;
  - the next unlock's bar fills on the skill's page.
- **Combat you can see:** hits on both sides appear as numbers on the combat lane, a foe's health bar drains, and a kill counts up.
- **Rewards that are opened:** goals pay in a supply cache you open with a short reveal, guaranteed gold plus a chance at food, supplies or a find. On average a cache is worth what the goal paid before.
- **The fire burns hotter:** the longer you keep the fire burning, the hotter it gets. In three steps over 20 minutes, its XP bonus climbs to the top of today's range, shown on the badge. The target "an hour with the fire earns about 1.5 times an hour away" still holds.
- **Level-ups:** each says what opened and how far the next tier is: "Level 54: Silverbark opens at 55, one level away".

## 5. The order of work

Each step ends only when its proof is shown, verify is green on GitHub and the work is merged. The design model is changed and checked before any content is written.

| # | Step | Must prove |
| --- | --- | --- |
| 11 | **Feel:** seals that grow, total level and rank, pips, hit numbers, caches, the fire's heat; the contact address and the scene's motion | Every completion shows its gain on the lane; a cache's reveal plays and pays as its odds say; the fire's targets still hold |
| 12 | **The climb:** the curve to 99, tiers 5 to 8 for Woodcutting, Mining and Smithing, the Fen and the Ashen Peaks with twelve foes, a save version that carries every player forward | The model meets the year's targets; a player of today's game loses nothing; every level 1 to 99 unlocks something |
| 13 | **Fishing and Cooking:** the food loop | Home-cooked food beats the vendor's from tier 2; the Gathering lane's four skills each pay |
| 14 | **Fletching and Runecraft:** supplies for all three styles | Each style still wins where the triangle says; supplies pay for themselves |
| 15 | **Deeds and titles** | Every deed can be done, and its text comes from its numbers; titles show on the hiscores |
| 16 | **Expeditions and bosses** | No two runs alike in 1,000 draws; any length pays at least as well as the lanes |
| 17 | **Kindling** (in place of Rekindling) | A Kindling takes about a quarter of the first climb; each Path pays what it says; nothing is taken away |
| 18 | **The year:** a 365-day simulation of several kinds of player, balance across every skill, the closed test made ready | Every year target holds; then the closed test with a handful of players. **Built:** the steady and light players' year on the real engine in verify (`.verify/year.md`, GAME_DESIGN.md section 4); goals that follow the lanes; a day's goal paid the next morning; deeds and titles over the whole year; an expedition's record that can no longer cost a player their marks and relics; feedback and the closed test's panel (`docs/CLOSED_TEST.md`); invites were built and then taken out in session 19, as the game is shared only with friends until launch |

## 6. Art

- **Count:** the expansion needs about 190 new icons:
  - tiers 5 to 8 of today's items (8 resources, 24 gear pieces);
  - fish raw and cooked (16);
  - pies and stews (6);
  - arrows, runes, whetstones and keys (32);
  - 24 skill finds and 6 boss finds;
  - 12 foes and 3 bosses;
  - 4 skill seals, relics, and deed and title badges;
  - two region scenes (the Fen, the Ashen Peaks).
- **Style:** everything follows `ART.md` and the reference set.
- **New families need the owner's approval first** (`ART.md`): fish, arrows and runes, and the two new scenes. Each new family's first few icons go to the owner before the rest are drawn.

## 7. What it costs

- **Time:** this is about as much work again as version 1. Steps 11 to 18 are each about the size of one version 1 session.
- **Launch:** waits for the owner, as decided. The server work is finished and waiting.
- **Risk:** the first attempt's lesson was that systems built without players drift apart. The guard against that is the year-long simulation in verify, and the one closed test before launch that the owner chose.
