# Idle Clash: game design

Session 0 · October 2026; the long climb (level 99, eight tiers, three regions) added in session 12 (`docs/EXPANSION.md`). Every number here comes from the paper model in `design/model/`; the tables marked *generated* are written from its data, and the last section is its report. Change a number in the model, run the checks, then rebuild this file.

## 1. The game in one breath

You run three lanes, Gathering, Artisan and Combat, in an old northern march of forests, mines and barrow-hills. Each lane does one thing at a time and keeps doing it while you are away, for up to a day. Playing in person lights the fire: XP rises, a second Gathering lane opens, and every few minutes something worth noticing happens. Logs and ores become bars, bars and logs become swords, bows, staves and armour, gear wins fights, and fights bring back gold and materials.

The three pillars decide everything below:

- **Longevity.** Every level of every skill unlocks something; choices beat waiting; old actions keep paying through mastery.
- **Fun.** A notable moment about every two minutes of active play, never five without one; finds at three rarities; a goal always in view.
- **Endgame replayability.** Version 1 plants mastery, the collection log and hiscores; seasons, expeditions and rekindling build on them later.

## 2. The loop

```
 Woodcutting ──logs──┐            ┌── sword (Melee)
                     ├─► Smithing ┼── bow (Archery)  ──► wear ──► Combat ──► gold, drops, finds
 Mining ─────ores──► bars ────────┴── staff (Magic), armour  ▲         │
 Fishing ────fish──► Cooking ──── cooked food ───────────────┤         │
 Runecraft ──runes─► supplies ◄── Fletching, Smithing ───────┘         │
     ▲                                                                  │
     └──────────── gold buys food and Storehouse space ◄────────────────┘
```

- **Gathering** (Woodcutting, Mining, Fishing, Runecraft) turns time into logs, ores, fish and runes.
- **Artisan** (Smithing, Cooking, Fletching) turns ores into bars and bars and logs into gear, fish and logs into food, and bars and logs into arrows. It stops, with the reason shown, when an ingredient runs out.
- **Combat** (Melee, Archery, Magic, with Hitpoints rising from every fight) turns gear and food into XP, gold and drops.
- **Gold** comes from selling to the vendor and from foes. It buys food (or a fighter cooks their own) and Storehouse space. Gear is always made, never bought.

### Lanes, the queue and time away

- Each lane runs one action and repeats it. Behind it you may queue one **Next** action, which starts when the current one stops (out of ingredients, Storehouse full, a retreat).
- When you leave, lanes keep going for **24 hours** from your last visit. The server counts completions from elapsed time, rolls finds in batches and credits everything when you return.
- **The away recap** opens on return and leads with the best thing that happened (order: Legendary find, new collection entry, level, Rare find, mastery step, goal, Uncommon finds as one line).

### The fire

- Any real input lights it: starting or changing an action, claiming a goal, or the **Stoke** button.
- It burns for **5 minutes** after your last input. In its last minute it dims and Stoke pulses. An idle open tab therefore falls back to the away rate.
- While it burns: **+15% XP** in every lane on average over an hour, and a **second Gathering lane**, so you can cut wood and mine at once (one skill never runs in both). When it goes out, the second lane stops with "The fire went out".
- **It burns hotter the longer it is kept going** (session 11): +8% XP in its first ten minutes, +14% from ten, +17% from twenty, so an hour of play averages exactly the +15% the model uses. Letting it go out starts the heat again. The badge glows brighter at each step and shows its bonus.
- Worked through the model, an hour with the fire earns **1.54 times** the XP of an hour away (target 1.5).

## 3. Skills, tiers and materials

Eleven skills: Woodcutting, Mining, Fishing and Runecraft (Gathering); Smithing, Cooking and Fletching (Artisan); Melee, Archery, Magic and Hitpoints (Combat). The top level is **99** (version 1 stopped at 40). Fishing and Cooking came with the expansion in session 13, Fletching and Runecraft in session 14.

Eight tiers open at levels 1, 10, 20, 30, 40, 55, 70 and 85. The first four belong to the march; the next two to the Sunken Fen and the last two to the Ashen Peaks, so the later tiers come further apart and each is earned:

| Tier | Metal | Logs | Ore (Mining opens it) | Bar recipe | Fish | Rune |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Copper | Pine | Copper ore (1) | 1 copper ore | Perch | Spark |
| 2 | Bronze | Ash | Tin ore (10) | 1 copper ore + 1 tin ore | Trout | Gale |
| 3 | Iron | Oak | Iron ore (20) | 2 iron ore | Pike | Tide |
| 4 | Steel | Yew | Coal (30) | 1 iron ore + 2 coal | Salmon | Earth |
| 5 | Moonsilver | Maple | Moonsilver ore (40) | 1 moonsilver ore + 1 coal | Moon carp | Moon |
| 6 | Star-iron | Silverbark | Star-iron ore (55) | 1 star-iron ore + 2 coal | Silver eel | Star |
| 7 | Embersteel | Elderwood | Ember ore (70) | 1 ember ore + 2 coal | Ember char | Ember |
| 8 | Dawnsteel | Ancient | Dawnstone (85) | 1 dawnstone + 1 moonsilver ore + 2 coal | Dawn sturgeon | Dawn |

That is 32 resources: eight logs, eight ores, eight bars and eight fish; and 24 supplies (each tier's arrows, runes and whetstones) and seven keys (section 6). Bronze, steel and the later metals are alloys, so earlier ores keep their use: coal goes into every bar from steel on, and dawnsteel needs moonsilver.

- **Weapons** need the style's level: a sword (Melee), a bow (Archery) or a staff (Magic) of a tier needs that style at the tier's level. Your style is your weapon's.
- **Armour** (helm, body, legs) is shared by all styles and needs Hitpoints at the tier's level.

## 4. The XP curve and pacing

One XP table serves every skill (total XP to reach each level, *generated*):

{{XP_TABLE}}

The table is derived, not guessed. To level 40 the model fits per-level times to the brief's targets, then simulates a player keeping one skill in a lane: one active hour with the fire each day, the rest away, always choosing the best action while present. Past 40 the table is continued, each level costing a little more XP than the last (0.2% more), never less; the later tiers' faster rates set the pace. Every skill is then checked against the table (results in section 15).

- **The long climb.** A skill kept in its lane reaches 40 in about 3 weeks, 55 in about 7, 70 in about 10½, 85 in about 13 and **99 in about 15 weeks**. A level past 40 takes about two days at first and about one near the top, so the last stretch speeds up. With every lane busy, every skill reaches 99 in about a year.

- **Pacing is per skill kept in a lane.** Three styles share one Combat lane, so a player training all three moves each at about a third of the pace; the triangle makes switching worthwhile.
- **The first level-up** comes after under 40 seconds of chopping; the first worn sword after about 2 minutes.

## 5. Gathering

| | Standard | Rich (opens 4 levels later) | Mastered older action |
| --- | --- | --- | --- |
| XP an hour | best | about 87% | 80–95% |
| Materials an hour | 1 per action | about 133% | more with mastery |
| Rare and Legendary finds an hour | 1x | 1x | 1x |

Fishing is built the same way: each tier's shallows, and its deep pool four levels later ("Perch shallows", "Deep perch pool"). Fish sell for 40% of what the tier's logs fetch, because Fishing pays mostly in the food it saves (section 9).

Runecraft is built the same way too: each tier's standing stone, and its ancient stone four levels later ("Spark stone", "Ancient spark stone"). A draw gives eight of the tier's runes (sixteen at an ancient stone), each worth an eighth of the tier's ore, so Runecraft pays as Mining does. Every stone past the first needs that tier's key, which Smithing binds from two bars and which is kept, never used up.

Rich actions ("Old pine", "Deep copper seam") are slower and give two items each: the choice between XP and materials. Smithing needs more ore than one fresh vein supplies, so rich seams, mastery and the fire's second lane are how a smith keeps the forge fed.

*Generated:*

{{GATHER}}

## 6. Smithing

Every recipe in a tier pays the same XP an hour, so the choice is about what you need: bars are quick to sell, gear is worth 40% more than its bars and is what you wear. Recipe seconds are the tier's pace times the number of ingredients; a bar takes its pace per ore.

*Generated:*

{{RECIPES}}

### Cooking

Cooking is the Artisan lane's second skill. Each tier's fish is cooked two at a time over one of that tier's logs; from tier 3 a pie or a stew mixes the tier's fish with the one before (the older catch keeps its use), two at a time. Every recipe pays its tier's XP an hour, as Smithing's do.

Cooked food heals about half the health a fighter has at its tier: the most a meal, eaten below half health, never wastes. A dish heals a quarter more. It sells for what went into it, and for that worth it heals at least 1.2 times what the vendor's food heals for its price from tier 2 on, so feeding yourself is a real choice. One Gathering lane fishing, with the fire's second lane chopping about half the time, keeps the Artisan lane cooking.

*Generated:*

{{COOKING_TABLE}}

### Supplies: whetstones, arrows and runes

Each style has a supply: Melee takes whetstones (Smithing, from a bar), Archery takes arrows (Fletching, the Artisan lane's third skill, from a bar and a log) and Magic takes runes (Runecraft). Whetstones and arrows come 25 at a time. A fighter uses the best supply of their style that their level allows, one per foe fought, without being asked, as they eat; with none carried they fight as before. A supply adds damage by its tier, from +5% to +20%, and every style has its supply at every tier, so the triangle holds (section 15). A supply pays for itself: the extra gold and the extra XP (counted at what an hour of the tier's gathering pays for its XP) are worth more than the supplies used. Supplies of the first two tiers sell for nothing; whetstones and keys open with their tier's bar, so Smithing's perks stay where they were.

*Generated:*

{{SUPPLY_TABLE}}

{{SUPPLY_RECIPES}}

## 7. Mastery

Every action has its own mastery, counted in completions: chopping a pine, forging a bronze helm, defeating an orc raider. Ten steps; each makes the action **3% faster** and adds a **6% chance of an extra item** (for a foe: 3% more damage and 6% more drops). Mastery never raises XP per action; it raises how often you earn it.

{{MASTERY_TABLE}}

A mastered older action earns 80–96% of the newest one's XP and more materials, so going back is a real choice (section 15 checks every action 10 levels on).

## 8. Finds and the collection log

Every completion rolls for a find at three rarities. Each skill has six finds, a lesser and a greater at each rarity; greater finds come only from tier 3 and 4 actions.

| Rarity | Chance | What it does |
| --- | --- | --- |
| Uncommon | about 1 in 50 actions | Sells for about 50 actions' worth of that tier's material |
| Rare | 1 in 500 | Use it for 500 mastery completions on an action of that skill, or sell it |
| Legendary | 1 in 5,000 | Kept as a trophy; its first find grants a lasting mark: +2% XP in that skill |

- **Luck.** Uncommon finds use one luck counter shared by all lanes: each action that finds nothing raises the next chance slightly (by 0.062 percentage points), so finds still average 1 in 50 but arrive evenly. After **4 minutes of active play** with no notable moment, the next action's Uncommon find is certain. This makes "never 5 minutes without a moment" true by construction.
- **Perks** ("Woodsman's eye" and the like) raise only Rare and Legendary chances, so the Uncommon rhythm stays steady. Rich actions roll their Rare and Legendary chances at 1.5 times per action (the same per hour).
- **The collection log** holds all 36 finds, shows the unfound as silhouettes and records the date of each first find. Each first find has its own moment on screen.

*Generated:*

{{FIND_TABLE}}

## 9. Combat

### The triangle

Melee beats Archery, Archery beats Magic, Magic beats Melee. Every foe's style is shown before you fight.

| Your style against the foe's | Your damage | Damage you take |
| --- | --- | --- |
| Advantage | ×1.25 | ×0.75 |
| Even | ×1 | ×1 |
| Disadvantage | ×0.8 | ×1.25 |

### How a fight resolves

Health and damage are on a ×10 scale so hits read as satisfying numbers.

- Both sides swing every 3 seconds; the next foe arrives 3 seconds after a defeat.
- **Your hit chance:** 66%, +1.2% for each of your style levels above the foe's level (−1.2% below), plus accuracy perks; between 20% and 95%.
- **Your max hit:** 10 × (3 + style level ÷ 12, rounded down, + weapon tier); a hit rolls 1 to max, then the triangle, damage perks and mastery (+3% a step) apply.
- **The foe's hit chance:** 62%, +2% for each level it stands above your Hitpoints; between 20% and 95%.
- **The foe's hits** roll 1 to its max, less 2.5% per armour tier per piece worn (a full steel set takes 30% off), less guard perks, then the triangle.
- **Health:** 300 at Hitpoints 1, +40 a level ({{HEALTH}}). It returns 10 every 6 seconds.
- **Food** is eaten automatically below half health (the best food you carry). Below 20% with no food left, you **retreat**: nothing is lost, and the lane stops with the reason ("Retreated from the hill troll: out of food").

### XP from combat

- **Style XP** is earned per point of damage dealt (overkill counts for nothing): 0.30, 0.32, 0.34 and 0.35 a point against tier 1 to 4 foes, then 0.34, 0.31, 0.30 and 0.28 against tiers 5 to 8.
- **Easy foes teach less:** for each level a foe stands more than five below your style, 4% less XP, down to 40%. An outlevelled foe is never the best target for long.
- **Hitpoints XP** equals the style XP from every fight, whatever the style (40% until session 12; past 40 the levels would otherwise leave Hitpoints, and the armour and foes it opens, far behind a player who keeps to one style).

### Foes and Your odds

A foe opens at a Hitpoints level, so every style can reach every foe. Foes live in three regions, each a tab of the Combat page: the march (tiers 1 to 4), the Sunken Fen (5 and 6) and the Ashen Peaks (7 and 8), three foes a tier past the march, one of each style. Each foe was calibrated against its intended matchup (the style that beats it, at its level, in that tier's gear) to about 10 food an hour. Past tier 4, style XP per point of damage falls a little with each tier (hits grow faster than the levels they buy), so combat keeps the gathering skills' pace.

*Generated:*

{{FOE_TABLE}}

**Your odds** is the engine's own verdict, from simulated fights with your current gear, levels and food: XP an hour, food an hour, gold an hour, and one of:

| Verdict | Means |
| --- | --- |
| Easy | Under 4 food an hour |
| Fair | Under 25 food an hour |
| Costly | 25 or more food an hour |
| Too strong | You would retreat in more than 1 fight in 50 |

### Food

Bought from the vendor, or cooked (section 6): better food is sold as Hitpoints rises, and the vendor keeps selling it whatever you cook, as a fallback. A fighter eats the most healing food carried first, cooked or bought. *Generated:*

{{FOOD_TABLE}}

## 10. Gold and the Storehouse

- **Sources:** selling logs, ores, bars, gear and Uncommon and Rare finds to the vendor; gold and drops from foes.
- **Sinks:** food, and Storehouse enlargements. Gear is made, never bought.
- **The Storehouse** holds stacks of any size; slots limit the number of different items. {{STORE}} There are 171 kinds of item (32 resources, 24 supplies, 7 keys, 48 gear, 20 foods, 40 sellable finds), so the last enlargement (174 slots) fits them all.
- When a lane would produce an item with no free slot, it stops: "Storehouse full".
- Every item's panel shows **Comes from** and **Used in**, gathered by asking every feature.

Enlargement costs follow each day's net gold, so one is affordable roughly when it is wanted (days 1, 2, 3, 5, 7, 10, 14 and 18, then 25, 35, 45, 60, 75 and 90 as the climb brings more kinds of item). Later sinks (relics, Rekindling) come with the expansion's endgame.

## 11. Goals and notable moments

### The goals ladder (always in view on the Hearth)

1. **First steps:** six goals, each with a button that starts it and a reward of 25 gold (the sixth pays in bread instead).
   1. Chop a pine (Start chopping).
   2. Mine copper ore (Start mining: the fire's second Gathering lane).
   3. Smelt a copper bar (Start smelting).
   4. Forge a copper sword (needs Smithing 2).
   5. Wear your sword.
   6. Defeat a hollow rat (the step's reward, 10 bread, comes first).
2. **Three short goals**, rolling: each sized to 10–15 minutes of your current pace in one lane ("Cut 60 oak logs", "Reach mastery 4 on Iron vein", "Defeat 25 grave wights", "Forge 3 iron helms"). A new one appears as each is claimed. Reward: a supply cache worth about 10 minutes of that lane's gold.
3. **A daily goal:** about 40 minutes of play or a day of lanes ("Earn 20,000 Smithing XP today"). Reward: a supply cache worth about an hour of gold.
4. **Milestones:** total level 50, 100, 150, 200, 250 and 280, then 350, 450, 550, 650, 693 (the first seven skills at 99), 800, 891 (nine at 99), 1,000 and 1,089 (all eleven at 99); the first item of each of the eight tiers; collection log 12, 24, 36, 48 and 60; the first mastery 10. Reward: gold, and the milestone is shown on your hiscore entry.
5. **Supply caches** (session 11): half the goal's worth in gold is certain, and one draw adds more: a plain cache (half the time, +30%), a stocked one (3 in 10, +50% as the best food you are sold, for a fighter), a rich one (3 in 20, +100%) or a lucky one (1 in 20, +200%). On average a cache pays 1.05 times the goal's gold, so the economy holds, and opening one is a small moment of its own.

### Notable moments

A level, an unlock, a find, a goal or a mastery step. Moments within 5 seconds of each other show together. Levels and Legendary finds take the centre of the screen; Rare finds and mastery steps a banner; Uncommon finds and goals a toast in the lane card. Measured in the model: one moment every 1.6 to 2.0 minutes of active play from day 2 onward, never more than 4.3 minutes without one. The first hour runs faster on purpose, at about one a minute, while ten levels come in every skill.

## 12. The unlock ladder

Every level 1 to 99 of every skill unlocks something: an action, a recipe, a tier, a foe, a food or a perk. Past 40 a perk line's ranks give half as much (there are so many more of them), and each skill has a second capstone at 99. Perk text is generated from its numbers by one formatter. *Generated.*

{{UNLOCK_TABLES}}

## 13. The long arc and where it lives

| Order | System | Home (see IA.md) |
| --- | --- | --- |
| 1 | More world: regions, tiers, Fishing, Cooking, Fletching, Runecraft | New skills join the Skills page; new regions become tabs on Combat; ammunition joins the Storehouse |
| 2 | Social: guilds, player market, letters | Guild and seasons on the Realm page (today's Hiscores); the market is a tab of the Storehouse; letters arrive in the notices tray |
| 3 | Expeditions | A tab of Combat |
| 4 | Seasons | A tab of the Realm page, with its own ladder |
| 5 | Rekindling | A section of the Hearth, opened by a milestone |
| 6 | The 48-hour upgrade; cosmetic donations | Settings (account) |

Each must still pass the three tests: it serves a pillar, a newcomer understands it in one sentence, and it fits the page map without a new menu entry.

## 14. Decisions settled in session 0

| Decision | Settled as |
| --- | --- |
| The menu | Five entries: Hearth, Skills, Combat, Storehouse, Hiscores. Notices is a tray in the header; Settings sits behind the account button |
| The fire | Renews on real input, fades after 5 minutes idle; its extra lane is a second Gathering lane |
| Hitpoints | Kept as a skill: every level +40 health; perks at 5, 15, 25, 35 and 40, then every ten levels to 95, and 99 |
| Finds | Six per skill (36 in all); art grows to about 86 icons (24 gear, 12 resources, 8 foes, 3 foods, 36 finds, plus 7 skill icons and the region's scene) |
| Session order | Account deletion and the admin page move from session 5 to session 9 |
| Hiscores | In version 1 |
| Minimum age | 13, revisited before guilds and letters |
| Email | Off until the owner switches it on: sign-up is name and password; a forgotten password is reset from the admin page; when email is switched on, players are asked to add and confirm one |
| Foes open by Hitpoints level | So every style can reach every foe (the assistant's call) |
| Luck and the 4-minute guarantee | Uncommon finds average 1 in 50 but arrive evenly (the assistant's call) |
| Easy foes teach less | Keeps the best target changing as you grow (the assistant's call) |

## 15. The model's report

The paper model's own output, from `node design/model/checks2.ts`. The real simulation (from session 6) replaces it, and must agree with it within 25%.

{{REPORT}}
