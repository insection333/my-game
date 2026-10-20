<!-- Generated from design/GAME_DESIGN.template.md by design/model/build-docs.ts. Edit the template. -->

# Idle Clash: game design (version 1)

Session 0 · October 2026. Every number here comes from the paper model in `design/model/`; the tables marked *generated* are written from its data, and the last section is its report. Change a number in the model, run the checks, then rebuild this file.

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
 Mining ─────ores──► bars ────────┴── staff (Magic), armour            │
     ▲                                                                  │
     └──────────── gold buys food and Storehouse space ◄────────────────┘
```

- **Gathering** (Woodcutting, Mining) turns time into logs and ores.
- **Artisan** (Smithing) turns ores into bars and bars and logs into gear. It stops, with the reason shown, when an ingredient runs out.
- **Combat** (Melee, Archery, Magic, with Hitpoints rising from every fight) turns gear and food into XP, gold and drops.
- **Gold** comes from selling to the vendor and from foes. It buys food and Storehouse space. Gear is always made, never bought.

### Lanes, the queue and time away

- Each lane runs one action and repeats it. Behind it you may queue one **Next** action, which starts when the current one stops (out of ingredients, Storehouse full, a retreat).
- When you leave, lanes keep going for **24 hours** from your last visit. The server counts completions from elapsed time, rolls finds in batches and credits everything when you return.
- **The away recap** opens on return and leads with the best thing that happened (order: Legendary find, new collection entry, level, Rare find, mastery step, goal, Uncommon finds as one line).

### The fire

- Any real input lights it: starting or changing an action, claiming a goal, or the **Stoke** button.
- It burns for **5 minutes** after your last input. In its last minute it dims and Stoke pulses. An idle open tab therefore falls back to the away rate.
- While it burns: **+15% XP** in every lane and a **second Gathering lane**, so you can cut wood and mine at once (one skill never runs in both). When it goes out, the second lane stops with "The fire went out".
- Worked through the model, an hour with the fire earns **1.54 times** the XP of an hour away (target 1.5).

## 3. Skills, tiers and materials

Seven skills: Woodcutting, Mining (Gathering); Smithing (Artisan); Melee, Archery, Magic and Hitpoints (Combat). The top level in version 1 is **40**.

Four tiers open at levels 1, 10, 20 and 30:

| Tier | Metal | Logs | Ore (Mining opens it) | Bar recipe |
| --- | --- | --- | --- | --- |
| 1 | Copper | Pine | Copper ore (1) | 1 copper ore |
| 2 | Bronze | Ash | Tin ore (10) | 1 copper ore + 1 tin ore |
| 3 | Iron | Oak | Iron ore (20) | 2 iron ore |
| 4 | Steel | Yew | Coal (30) | 1 iron ore + 2 coal |

That is exactly the twelve resources: four logs, four ores, four bars. Bronze and steel are alloys, so earlier ores keep their use.

- **Weapons** need the style's level: a sword (Melee), a bow (Archery) or a staff (Magic) of a tier needs that style at the tier's level. Your style is your weapon's.
- **Armour** (helm, body, legs) is shared by all styles and needs Hitpoints at the tier's level.

## 4. The XP curve and pacing

One XP table serves every skill (total XP to reach each level, *generated*):

| Level | XP | Level | XP | Level | XP | Level | XP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 | 11 | 10,400 | 21 | 202,000 | 31 | 1,650,000 |
| 2 | 50 | 12 | 15,900 | 22 | 265,000 | 32 | 2,000,000 |
| 3 | 150 | 13 | 23,800 | 23 | 340,000 | 33 | 2,430,000 |
| 4 | 310 | 14 | 34,000 | 24 | 428,000 | 34 | 2,920,000 |
| 5 | 520 | 15 | 46,800 | 25 | 531,000 | 35 | 3,500,000 |
| 6 | 890 | 16 | 62,100 | 26 | 650,000 | 36 | 4,170,000 |
| 7 | 1,490 | 17 | 79,900 | 27 | 790,000 | 37 | 4,950,000 |
| 8 | 2,500 | 18 | 101,000 | 28 | 951,000 | 38 | 5,850,000 |
| 9 | 4,170 | 19 | 126,000 | 29 | 1,140,000 | 39 | 6,900,000 |
| 10 | 6,790 | 20 | 155,000 | 30 | 1,360,000 | 40 | 8,100,000 |

The table is derived, not guessed. The model fits per-level times to the targets, then simulates a player keeping one skill in a lane: one active hour with the fire each day, the rest away, always choosing the best action while present. Every skill is then checked against the table (results in section 15).

- **Pacing is per skill kept in a lane.** Three styles share one Combat lane, so a player training all three moves each at about a third of the pace; the triangle makes switching worthwhile.
- **The first level-up** comes after under 40 seconds of chopping; the first worn sword after about 2 minutes.

## 5. Gathering

| | Standard | Rich (opens 4 levels later) | Mastered older action |
| --- | --- | --- | --- |
| XP an hour | best | about 87% | 80–95% |
| Materials an hour | 1 per action | about 133% | more with mastery |
| Rare and Legendary finds an hour | 1x | 1x | 1x |

Rich actions ("Old pine", "Deep copper seam") are slower and give two items each: the choice between XP and materials. Smithing needs more ore than one fresh vein supplies, so rich seams, mastery and the fire's second lane are how a smith keeps the forge fed.

*Generated:*

| Action | Skill | Level | Seconds | XP | Gives | Sells for |
| --- | --- | --- | --- | --- | --- | --- |
| Pine tree | Woodcutting | 1 | 7.5 | 11 | Pine logs ×1 | 1 each |
| Old pine | Woodcutting | 5 | 11.25 | 14 | Pine logs ×2 | 1 each |
| Ash tree | Woodcutting | 10 | 12.5 | 25 | Ash logs ×1 | 4 each |
| Old ash | Woodcutting | 14 | 18.75 | 33 | Ash logs ×2 | 4 each |
| Oak tree | Woodcutting | 20 | 20 | 52 | Oak logs ×1 | 14 each |
| Old oak | Woodcutting | 24 | 30 | 68 | Oak logs ×2 | 14 each |
| Yew tree | Woodcutting | 30 | 26 | 87 | Yew logs ×1 | 35 each |
| Old yew | Woodcutting | 34 | 39 | 113 | Yew logs ×2 | 35 each |
| Copper vein | Mining | 1 | 7.5 | 11 | Copper ore ×1 | 1 each |
| Deep copper seam | Mining | 5 | 11.25 | 14 | Copper ore ×2 | 1 each |
| Tin vein | Mining | 10 | 12.5 | 25 | Tin ore ×1 | 4 each |
| Deep tin seam | Mining | 14 | 18.75 | 33 | Tin ore ×2 | 4 each |
| Iron vein | Mining | 20 | 20 | 52 | Iron ore ×1 | 14 each |
| Deep iron seam | Mining | 24 | 30 | 68 | Iron ore ×2 | 14 each |
| Coal vein | Mining | 30 | 26 | 87 | Coal ×1 | 30 each |
| Deep coal seam | Mining | 34 | 39 | 113 | Coal ×2 | 30 each |

## 6. Smithing

Every recipe in a tier pays the same XP an hour, so the choice is about what you need: bars are quick to sell, gear is worth 40% more than its bars and is what you wear. Recipe seconds are the tier's pace times the number of ingredients; a bar takes its pace per ore.

*Generated:*

| Recipe | Level | Takes | Seconds | XP | Sells for |
| --- | --- | --- | --- | --- | --- |
| Copper bar | 1 | Copper ore ×1 | 7.5 | 11 | 2 |
| Copper sword | 2 | Copper bar ×3 | 22.5 | 34 | 8 |
| Copper staff | 3 | Copper bar ×2, Pine logs ×1 | 22.5 | 34 | 7 |
| Copper bow | 4 | Copper bar ×1, Pine logs ×2 | 22.5 | 34 | 6 |
| Copper helm | 6 | Copper bar ×2 | 15 | 23 | 6 |
| Copper legs | 7 | Copper bar ×3 | 22.5 | 34 | 8 |
| Copper body | 9 | Copper bar ×5 | 37.5 | 56 | 14 |
| Bronze bar | 10 | Copper ore ×1, Tin ore ×1 | 25 | 50 | 7 |
| Bronze sword | 11 | Bronze bar ×3 | 37.5 | 75 | 29 |
| Bronze staff | 12 | Bronze bar ×2, Ash logs ×1 | 37.5 | 75 | 25 |
| Bronze bow | 13 | Bronze bar ×1, Ash logs ×2 | 37.5 | 75 | 21 |
| Bronze helm | 15 | Bronze bar ×2 | 25 | 50 | 20 |
| Bronze legs | 16 | Bronze bar ×3 | 37.5 | 75 | 29 |
| Bronze body | 18 | Bronze bar ×5 | 62.5 | 125 | 49 |
| Iron bar | 20 | Iron ore ×2 | 40 | 103 | 36 |
| Iron sword | 21 | Iron bar ×3 | 60 | 155 | 151 |
| Iron staff | 22 | Iron bar ×2, Oak logs ×1 | 60 | 155 | 120 |
| Iron bow | 23 | Iron bar ×1, Oak logs ×2 | 60 | 155 | 90 |
| Iron helm | 25 | Iron bar ×2 | 40 | 103 | 101 |
| Iron legs | 26 | Iron bar ×3 | 60 | 155 | 151 |
| Iron body | 28 | Iron bar ×5 | 100 | 258 | 252 |
| Steel bar | 30 | Iron ore ×1, Coal ×2 | 78 | 260 | 96 |
| Steel sword | 31 | Steel bar ×3 | 78 | 260 | 403 |
| Steel staff | 32 | Steel bar ×2, Yew logs ×1 | 78 | 260 | 318 |
| Steel bow | 33 | Steel bar ×1, Yew logs ×2 | 78 | 260 | 232 |
| Steel helm | 35 | Steel bar ×2 | 52 | 173 | 269 |
| Steel legs | 36 | Steel bar ×3 | 78 | 260 | 403 |
| Steel body | 38 | Steel bar ×5 | 130 | 433 | 672 |

## 7. Mastery

Every action has its own mastery, counted in completions: chopping a pine, forging a bronze helm, defeating an orc raider. Ten steps; each makes the action **3% faster** and adds a **6% chance of an extra item** (for a foe: 3% more damage and 6% more drops). Mastery never raises XP per action; it raises how often you earn it.

| Step | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Completions | 30 | 90 | 210 | 450 | 900 | 1,800 | 3,600 | 7,200 | 14,400 | 28,800 |
| Faster by | 3% | 6% | 9% | 12% | 15% | 18% | 21% | 24% | 27% | 30% |
| Extra item chance | 6% | 12% | 18% | 24% | 30% | 36% | 42% | 48% | 54% | 60% |

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

| Skill | Uncommon (about 1 in 50) | Rare (1 in 500) | Legendary (1 in 5,000) |
| --- | --- | --- | --- |
| Woodcutting | Bird's nest · Amber nugget | Carved acorn · Heartwood knot | Silverbark seed · Crown of the old wood |
| Mining | Rough garnet · Rough sapphire | Ancient coin · Crystal geode | Star-iron shard · Heart of the mountain |
| Smithing | Lucky horseshoe · Masterwork rivets | Guild smith's seal · Quenching flask | Ember of the first forge · Old king's hammer |
| Melee | Battle trophy · Raider's war-horn | Torn banner · Warlord's seal | Shard of a king’s blade · Troll-chief's tooth |
| Archery | Goose fletchings · Hunter's charm | Silver arrowhead · Bowman's ring | Moonlit bowstring · Eagle-feather circlet |
| Magic | Glimmer stone · Wisp lantern | Rune-scratched tablet · Wight's ring | Star-glass orb · Sorcerer's eye |

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
- **Health:** 300 at Hitpoints 1, +40 a level (Health 300 at Hitpoints 1, 1860 at 40. Style XP per point of damage by foe tier: 0.3, 0.32, 0.34, 0.35.). It returns 10 every 6 seconds.
- **Food** is eaten automatically below half health (the best food you carry). Below 20% with no food left, you **retreat**: nothing is lost, and the lane stops with the reason ("Retreated from the hill troll: out of food").

### XP from combat

- **Style XP** is earned per point of damage dealt (overkill counts for nothing): 0.30, 0.32, 0.34 and 0.35 a point against tier 1 to 4 foes.
- **Easy foes teach less:** for each level a foe stands more than five below your style, 4% less XP, down to 40%. An outlevelled foe is never the best target for long.
- **Hitpoints XP** is 40% of the style XP from every fight, whatever the style.

### Foes and Your odds

A foe opens at a Hitpoints level, so every style can reach every foe. Each foe was calibrated against its intended matchup (the style that beats it, at its level, in that tier's gear) to about 10 food an hour.

*Generated:*

| Foe | Style | Level | Opens at Hitpoints | Health | Max hit | XP a defeat (style) | Gold a defeat | Drop |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Hollow rat | Melee | 2 | 1 | 100 | 20 | 30 | 5 | Copper ore |
| Goblin slinger | Archery | 4 | 2 | 100 | 30 | 30 | 4 | Pine logs |
| Marsh wisp | Magic | 6 | 3 | 100 | 30 | 30 | 4 | Copper bar |
| Orc raider | Melee | 15 | 14 | 130 | 55 | 42 | 8 | Tin ore |
| Orc bowman | Archery | 19 | 18 | 140 | 65 | 45 | 8 | Bronze bar |
| Grave wight | Magic | 24 | 22 | 220 | 80 | 75 | 22 | Iron ore |
| Hill troll | Melee | 29 | 27 | 270 | 95 | 92 | 22 | Oak logs |
| Fell huntsman | Archery | 37 | 34 | 420 | 110 | 147 | 49 | Steel bar |

**Your odds** is the engine's own verdict, from simulated fights with your current gear, levels and food: XP an hour, food an hour, gold an hour, and one of:

| Verdict | Means |
| --- | --- |
| Easy | Under 4 food an hour |
| Fair | Under 25 food an hour |
| Costly | 25 or more food an hour |
| Too strong | You would retreat in more than 1 fight in 50 |

### Food

Bought from the vendor; better food is sold as Hitpoints rises. *Generated:*

| Food | Heals | Price | Sold from Hitpoints |
| --- | --- | --- | --- |
| Bread | 140 | 20 | 1 |
| Meat pie | 320 | 50 | 10 |
| Hearty stew | 600 | 110 | 20 |

## 10. Gold and the Storehouse

- **Sources:** selling logs, ores, bars, gear and Uncommon and Rare finds to the vendor; gold and drops from foes.
- **Sinks:** food, and Storehouse enlargements. Gear is made, never bought.
- **The Storehouse** holds stacks of any size; slots limit the number of different items. Starts with 24 slots; each enlargement adds 6. Costs: 40,000, 90,000, 100,000, 120,000, 180,000, 200,000, 230,000, 250,000 gold. There are 63 kinds of item in version 1 (12 resources, 24 gear, 3 foods, 24 sellable finds), so the last enlargement fits them all.
- When a lane would produce an item with no free slot, it stops: "Storehouse full".
- Every item's panel shows **Comes from** and **Used in**, gathered by asking every feature.

Enlargement costs follow each day's net gold, so one is affordable roughly when it is wanted (days 1, 2, 3, 5, 7, 10, 14 and 18). After day 18 gold has no new sink in version 1; the player market (long arc 2) is its home.

## 11. Goals and notable moments

### The goals ladder (always in view on the Hearth)

1. **First steps:** six goals, each with a button that starts it and a reward of 25 gold (the sixth pays in bread instead).
   1. Chop a pine (Start chopping).
   2. Mine copper ore (Start mining: the fire's second Gathering lane).
   3. Smelt a copper bar (Start smelting).
   4. Forge a copper sword (needs Smithing 2).
   5. Wear your sword.
   6. Defeat a hollow rat (the step's reward, 10 bread, comes first).
2. **Three short goals**, rolling: each sized to 10–15 minutes of your current pace in one lane ("Cut 60 oak logs", "Reach mastery 4 on Iron vein", "Defeat 25 grave wights", "Forge 3 iron helms"). A new one appears as each is claimed. Reward: about 10 minutes of that lane's gold.
3. **A daily goal:** about 40 minutes of play or a day of lanes ("Earn 20,000 Smithing XP today"). Reward: about an hour of gold.
4. **Milestones:** total level 50, 100, 150, 200, 250 and 280; the first item of each tier; collection log 12, 24 and 36; the first mastery 10. Reward: gold, and the milestone is shown on your hiscore entry.

### Notable moments

A level, an unlock, a find, a goal or a mastery step. Moments within 5 seconds of each other show together. Levels and Legendary finds take the centre of the screen; Rare finds and mastery steps a banner; Uncommon finds and goals a toast in the lane card. Measured in the model: one moment every 1.6 to 2.0 minutes of active play from day 2 onward, never more than 4.3 minutes without one. The first hour runs faster on purpose, at about one a minute, while ten levels come in every skill.

## 12. The unlock ladder

Every level 1 to 40 of every skill unlocks something: an action, a recipe, a tier, a foe, a food or a perk. Perk text is generated from its numbers by one formatter. *Generated.*

### Woodcutting

| Levels 1–10 | Levels 11–20 | Levels 21–30 | Levels 31–40 |
| --- | --- | --- | --- |
| **1** Pine tree | **11** Practised hands II (mastery 6% faster) | **21** Practised hands IV (mastery 6% faster) | **31** Practised hands VI (mastery 6% faster) |
| **2** Quick swing I (2.5% faster) | **12** Quick swing III (2.5% faster) | **22** Quick swing V (2.5% faster) | **32** Quick swing VII (2.5% faster) |
| **3** Plenty I (+3% chance of an extra item) | **13** Plenty III (+3% chance of an extra item) | **23** Plenty V (+3% chance of an extra item) | **33** Plenty VII (+3% chance of an extra item) |
| **4** Woodsman's eye I (Rare and Legendary finds 8% likelier) | **14** Old ash | **24** Old oak | **34** Old yew |
| **5** Old pine | **15** Woodsman's eye III (Rare and Legendary finds 8% likelier) | **25** Woodsman's eye V (Rare and Legendary finds 8% likelier) | **35** Woodsman's eye VII (Rare and Legendary finds 8% likelier) |
| **6** Practised hands I (mastery 6% faster) | **16** Practised hands III (mastery 6% faster) | **26** Practised hands V (mastery 6% faster) | **36** Practised hands VII (mastery 6% faster) |
| **7** Quick swing II (2.5% faster) | **17** Quick swing IV (2.5% faster) | **27** Quick swing VI (2.5% faster) | **37** Quick swing VIII (2.5% faster) |
| **8** Plenty II (+3% chance of an extra item) | **18** Plenty IV (+3% chance of an extra item) | **28** Plenty VI (+3% chance of an extra item) | **38** Plenty VIII (+3% chance of an extra item) |
| **9** Woodsman's eye II (Rare and Legendary finds 8% likelier) | **19** Woodsman's eye IV (Rare and Legendary finds 8% likelier) | **29** Woodsman's eye VI (Rare and Legendary finds 8% likelier) | **39** Woodsman's eye VIII (Rare and Legendary finds 8% likelier) |
| **10** Ash tree | **20** Oak tree | **30** Yew tree | **40** Master woodcutter (+10% chance of an extra item) |

### Mining

| Levels 1–10 | Levels 11–20 | Levels 21–30 | Levels 31–40 |
| --- | --- | --- | --- |
| **1** Copper vein | **11** Practised hands II (mastery 6% faster) | **21** Practised hands IV (mastery 6% faster) | **31** Practised hands VI (mastery 6% faster) |
| **2** Quick strike I (2.5% faster) | **12** Quick strike III (2.5% faster) | **22** Quick strike V (2.5% faster) | **32** Quick strike VII (2.5% faster) |
| **3** Plenty I (+3% chance of an extra item) | **13** Plenty III (+3% chance of an extra item) | **23** Plenty V (+3% chance of an extra item) | **33** Plenty VII (+3% chance of an extra item) |
| **4** Prospector's eye I (Rare and Legendary finds 8% likelier) | **14** Deep tin seam | **24** Deep iron seam | **34** Deep coal seam |
| **5** Deep copper seam | **15** Prospector's eye III (Rare and Legendary finds 8% likelier) | **25** Prospector's eye V (Rare and Legendary finds 8% likelier) | **35** Prospector's eye VII (Rare and Legendary finds 8% likelier) |
| **6** Practised hands I (mastery 6% faster) | **16** Practised hands III (mastery 6% faster) | **26** Practised hands V (mastery 6% faster) | **36** Practised hands VII (mastery 6% faster) |
| **7** Quick strike II (2.5% faster) | **17** Quick strike IV (2.5% faster) | **27** Quick strike VI (2.5% faster) | **37** Quick strike VIII (2.5% faster) |
| **8** Plenty II (+3% chance of an extra item) | **18** Plenty IV (+3% chance of an extra item) | **28** Plenty VI (+3% chance of an extra item) | **38** Plenty VIII (+3% chance of an extra item) |
| **9** Prospector's eye II (Rare and Legendary finds 8% likelier) | **19** Prospector's eye IV (Rare and Legendary finds 8% likelier) | **29** Prospector's eye VI (Rare and Legendary finds 8% likelier) | **39** Prospector's eye VIII (Rare and Legendary finds 8% likelier) |
| **10** Tin vein | **20** Iron vein | **30** Coal vein | **40** Master miner (+10% chance of an extra item) |

### Smithing

| Levels 1–10 | Levels 11–20 | Levels 21–30 | Levels 31–40 |
| --- | --- | --- | --- |
| **1** Copper bar | **11** Bronze sword | **21** Iron sword | **31** Steel sword |
| **2** Copper sword | **12** Bronze staff | **22** Iron staff | **32** Steel staff |
| **3** Copper staff | **13** Bronze bow | **23** Iron bow | **33** Steel bow |
| **4** Copper bow | **14** Smith's eye I (Rare and Legendary finds 8% likelier) | **24** Thrifty II (4% chance to save an ingredient) | **34** Steady forge III (3% faster) |
| **5** Steady forge I (3% faster) | **15** Bronze helm | **25** Iron helm | **35** Steel helm |
| **6** Copper helm | **16** Bronze legs | **26** Iron legs | **36** Steel legs |
| **7** Copper legs | **17** Practised hands I (mastery 8% faster) | **27** Smith's eye II (Rare and Legendary finds 8% likelier) | **37** Thrifty III (4% chance to save an ingredient) |
| **8** Thrifty I (4% chance to save an ingredient) | **18** Bronze body | **28** Iron body | **38** Steel body |
| **9** Copper body | **19** Steady forge II (3% faster) | **29** Practised hands II (mastery 8% faster) | **39** Smith's eye III (Rare and Legendary finds 8% likelier) |
| **10** Bronze bar | **20** Iron bar | **30** Steel bar | **40** Master smith (8% chance to save an ingredient) |

### Melee

| Levels 1–10 | Levels 11–20 | Levels 21–30 | Levels 31–40 |
| --- | --- | --- | --- |
| **1** Wield Copper swords | **11** Heavy blows III (+3% damage) | **21** Sure strike V (+2% to hit) | **31** Parry VII (2.5% less damage taken) |
| **2** Heavy blows I (+3% damage) | **12** Sure strike III (+2% to hit) | **22** Parry V (2.5% less damage taken) | **32** Spoils of war VII (+6% gold and drops) |
| **3** Sure strike I (+2% to hit) | **13** Parry III (2.5% less damage taken) | **23** Spoils of war V (+6% gold and drops) | **33** Heavy blows VIII (+3% damage) |
| **4** Parry I (2.5% less damage taken) | **14** Spoils of war III (+6% gold and drops) | **24** Heavy blows VI (+3% damage) | **34** Sure strike VIII (+2% to hit) |
| **5** Spoils of war I (+6% gold and drops) | **15** Heavy blows IV (+3% damage) | **25** Sure strike VI (+2% to hit) | **35** Parry VIII (2.5% less damage taken) |
| **6** Heavy blows II (+3% damage) | **16** Sure strike IV (+2% to hit) | **26** Parry VI (2.5% less damage taken) | **36** Spoils of war VIII (+6% gold and drops) |
| **7** Sure strike II (+2% to hit) | **17** Parry IV (2.5% less damage taken) | **27** Spoils of war VI (+6% gold and drops) | **37** Heavy blows IX (+3% damage) |
| **8** Parry II (2.5% less damage taken) | **18** Spoils of war IV (+6% gold and drops) | **28** Heavy blows VII (+3% damage) | **38** Sure strike IX (+2% to hit) |
| **9** Spoils of war II (+6% gold and drops) | **19** Heavy blows V (+3% damage) | **29** Sure strike VII (+2% to hit) | **39** Parry IX (2.5% less damage taken) |
| **10** Wield Bronze swords | **20** Wield Iron swords | **30** Wield Steel swords | **40** Master of melee (+8% damage) |

### Archery

| Levels 1–10 | Levels 11–20 | Levels 21–30 | Levels 31–40 |
| --- | --- | --- | --- |
| **1** Wield Copper bows | **11** Drawn deep III (+3% damage) | **21** Steady aim V (+2% to hit) | **31** Light step VII (2.5% less damage taken) |
| **2** Drawn deep I (+3% damage) | **12** Steady aim III (+2% to hit) | **22** Light step V (2.5% less damage taken) | **32** Spoils of the hunt VII (+6% gold and drops) |
| **3** Steady aim I (+2% to hit) | **13** Light step III (2.5% less damage taken) | **23** Spoils of the hunt V (+6% gold and drops) | **33** Drawn deep VIII (+3% damage) |
| **4** Light step I (2.5% less damage taken) | **14** Spoils of the hunt III (+6% gold and drops) | **24** Drawn deep VI (+3% damage) | **34** Steady aim VIII (+2% to hit) |
| **5** Spoils of the hunt I (+6% gold and drops) | **15** Drawn deep IV (+3% damage) | **25** Steady aim VI (+2% to hit) | **35** Light step VIII (2.5% less damage taken) |
| **6** Drawn deep II (+3% damage) | **16** Steady aim IV (+2% to hit) | **26** Light step VI (2.5% less damage taken) | **36** Spoils of the hunt VIII (+6% gold and drops) |
| **7** Steady aim II (+2% to hit) | **17** Light step IV (2.5% less damage taken) | **27** Spoils of the hunt VI (+6% gold and drops) | **37** Drawn deep IX (+3% damage) |
| **8** Light step II (2.5% less damage taken) | **18** Spoils of the hunt IV (+6% gold and drops) | **28** Drawn deep VII (+3% damage) | **38** Steady aim IX (+2% to hit) |
| **9** Spoils of the hunt II (+6% gold and drops) | **19** Drawn deep V (+3% damage) | **29** Steady aim VII (+2% to hit) | **39** Light step IX (2.5% less damage taken) |
| **10** Wield Bronze bows | **20** Wield Iron bows | **30** Wield Steel bows | **40** Master of archery (+8% damage) |

### Magic

| Levels 1–10 | Levels 11–20 | Levels 21–30 | Levels 31–40 |
| --- | --- | --- | --- |
| **1** Wield Copper staves | **11** Kindled will III (+3% damage) | **21** Focus V (+2% to hit) | **31** Ward VII (2.5% less damage taken) |
| **2** Kindled will I (+3% damage) | **12** Focus III (+2% to hit) | **22** Ward V (2.5% less damage taken) | **32** Spoils of the wild VII (+6% gold and drops) |
| **3** Focus I (+2% to hit) | **13** Ward III (2.5% less damage taken) | **23** Spoils of the wild V (+6% gold and drops) | **33** Kindled will VIII (+3% damage) |
| **4** Ward I (2.5% less damage taken) | **14** Spoils of the wild III (+6% gold and drops) | **24** Kindled will VI (+3% damage) | **34** Focus VIII (+2% to hit) |
| **5** Spoils of the wild I (+6% gold and drops) | **15** Kindled will IV (+3% damage) | **25** Focus VI (+2% to hit) | **35** Ward VIII (2.5% less damage taken) |
| **6** Kindled will II (+3% damage) | **16** Focus IV (+2% to hit) | **26** Ward VI (2.5% less damage taken) | **36** Spoils of the wild VIII (+6% gold and drops) |
| **7** Focus II (+2% to hit) | **17** Ward IV (2.5% less damage taken) | **27** Spoils of the wild VI (+6% gold and drops) | **37** Kindled will IX (+3% damage) |
| **8** Ward II (2.5% less damage taken) | **18** Spoils of the wild IV (+6% gold and drops) | **28** Kindled will VII (+3% damage) | **38** Focus IX (+2% to hit) |
| **9** Spoils of the wild II (+6% gold and drops) | **19** Kindled will V (+3% damage) | **29** Focus VII (+2% to hit) | **39** Ward IX (2.5% less damage taken) |
| **10** Wield Bronze staves | **20** Wield Iron staves | **30** Wield Steel staves | **40** Master of magic (+8% damage) |

### Hitpoints

| Levels 1–10 | Levels 11–20 | Levels 21–30 | Levels 31–40 |
| --- | --- | --- | --- |
| **1** Wear Copper armour; Foe: Hollow rat | **11** Toughness (+40 health) | **21** Toughness (+40 health) | **31** Toughness (+40 health) |
| **2** Foe: Goblin slinger; Toughness (+40 health) | **12** Toughness (+40 health) | **22** Foe: Grave wight; Toughness (+40 health) | **32** Toughness (+40 health) |
| **3** Foe: Marsh wisp; Toughness (+40 health) | **13** Toughness (+40 health) | **23** Toughness (+40 health) | **33** Toughness (+40 health) |
| **4** Toughness (+40 health) | **14** Foe: Orc raider; Toughness (+40 health) | **24** Toughness (+40 health) | **34** Foe: Fell huntsman; Toughness (+40 health) |
| **5** Second wind (health returns 25% faster); Toughness (+40 health) | **15** Iron stomach (food heals 15% more); Toughness (+40 health) | **25** Field dressing (health returns 25% faster); Toughness (+40 health) | **35** Stubborn (retreat at 12% health instead of 20%); Toughness (+40 health) |
| **6** Toughness (+40 health) | **16** Toughness (+40 health) | **26** Toughness (+40 health) | **36** Toughness (+40 health) |
| **7** Toughness (+40 health) | **17** Toughness (+40 health) | **27** Foe: Hill troll; Toughness (+40 health) | **37** Toughness (+40 health) |
| **8** Toughness (+40 health) | **18** Foe: Orc bowman; Toughness (+40 health) | **28** Toughness (+40 health) | **38** Toughness (+40 health) |
| **9** Toughness (+40 health) | **19** Toughness (+40 health) | **29** Toughness (+40 health) | **39** Toughness (+40 health) |
| **10** Wear Bronze armour; The vendor sells Meat pie; Toughness (+40 health) | **20** Wear Iron armour; The vendor sells Hearty stew; Toughness (+40 health) | **30** Wear Steel armour; Toughness (+40 health) | **40** Unbowed (food heals 15% more); Toughness (+40 health) |

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
| Hitpoints | Kept as a skill: every level +40 health; perks at 5, 15, 25, 35 and 40 |
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

```text
XP table (total XP to reach each level)
1: 0 · 2: 50 · 3: 150 · 4: 310 · 5: 520 · 6: 890 · 7: 1,490 · 8: 2,500 · 9: 4,170 · 10: 6,790 · 11: 10,400 · 12: 15,900 · 13: 23,800 · 14: 34,000 · 15: 46,800 · 16: 62,100 · 17: 79,900 · 18: 101,000 · 19: 126,000 · 20: 155,000 · 21: 202,000 · 22: 265,000 · 23: 340,000 · 24: 428,000 · 25: 531,000 · 26: 650,000 · 27: 790,000 · 28: 951,000 · 29: 1,140,000 · 30: 1,360,000 · 31: 1,650,000 · 32: 2,000,000 · 33: 2,430,000 · 34: 2,920,000 · 35: 3,500,000 · 36: 4,170,000 · 37: 4,950,000 · 38: 5,850,000 · 39: 6,900,000 · 40: 8,100,000

Pacing for a skill kept in a lane (one active hour with the fire each day)
Woodcutting  L10 1.0 h (+0%)  L20 22.6 h (-6%)  L30 4.9 days (-3%)  L40 20.8 days (-1%)
PASS  Woodcutting level 10 within 25% of target
PASS  Woodcutting level 20 within 25% of target
PASS  Woodcutting level 30 within 25% of target
PASS  Woodcutting level 40 within 25% of target
Mining       L10 1.0 h (+0%)  L20 22.6 h (-6%)  L30 4.9 days (-3%)  L40 20.8 days (-1%)
PASS  Mining level 10 within 25% of target
PASS  Mining level 20 within 25% of target
PASS  Mining level 30 within 25% of target
PASS  Mining level 40 within 25% of target
Smithing     L10 1.0 h (+1%)  L20 23.1 h (-4%)  L30 5.2 days (+5%)  L40 23.1 days (+10%)
PASS  Smithing level 10 within 25% of target
PASS  Smithing level 20 within 25% of target
PASS  Smithing level 30 within 25% of target
PASS  Smithing level 40 within 25% of target
Melee        L10 1.2 h (+17%)  L20 26.1 h (+9%)  L30 6.0 days (+19%)  L40 24.9 days (+19%)
PASS  Melee level 10 within 25% of target
PASS  Melee level 20 within 25% of target
PASS  Melee level 30 within 25% of target
PASS  Melee level 40 within 25% of target
Archery      L10 1.3 h (+25%)  L20 24.7 h (+3%)  L30 5.6 days (+12%)  L40 25.4 days (+21%)
PASS  Archery level 10 within 25% of target
PASS  Archery level 20 within 25% of target
PASS  Archery level 30 within 25% of target
PASS  Archery level 40 within 25% of target
Magic        L10 1.2 h (+20%)  L20 27.0 h (+12%)  L30 5.8 days (+16%)  L40 22.4 days (+6%)
PASS  Magic level 10 within 25% of target
PASS  Magic level 20 within 25% of target
PASS  Magic level 30 within 25% of target
PASS  Magic level 40 within 25% of target
PASS  First level-up after 37.5 s of chopping (target under 1 minute)

Unlocks
PASS  Woodcutting: every level 1-40 unlocks something
PASS  Mining: every level 1-40 unlocks something
PASS  Smithing: every level 1-40 unlocks something
PASS  Melee: every level 1-40 unlocks something
PASS  Archery: every level 1-40 unlocks something
PASS  Magic: every level 1-40 unlocks something
PASS  Hitpoints: every level 1-40 unlocks something

Choices at each tier (XP an hour, mid-tier, against the best)
woodcutting tier 1: Pine tree 6046 · Old pine 5130 (+100% materials)
PASS  woodcutting tier 1 offers two choices within 20%
woodcutting tier 2: Ash tree 8604 · Old ash 7572 (+100% materials) · Pine tree mastered 7102
PASS  woodcutting tier 2 offers two choices within 20%
woodcutting tier 3: Oak tree 11653 · Old oak 10159 (+100% materials) · Ash tree mastered 10044
PASS  woodcutting tier 3 offers two choices within 20%
woodcutting tier 4: Yew tree 15600 · Old yew 13508 (+100% materials) · Oak tree mastered 13525
PASS  woodcutting tier 4 offers two choices within 20%
mining tier 1: Copper vein 6046 · Deep copper seam 5130 (+100% materials)
PASS  mining tier 1 offers two choices within 20%
mining tier 2: Tin vein 8604 · Deep tin seam 7572 (+100% materials) · Copper vein mastered 7102
PASS  mining tier 2 offers two choices within 20%
mining tier 3: Iron vein 11653 · Deep iron seam 10159 (+100% materials) · Tin vein mastered 10044
PASS  mining tier 3 offers two choices within 20%
mining tier 4: Coal vein 15600 · Deep coal seam 13508 (+100% materials) · Iron vein mastered 13525
PASS  mining tier 4 offers two choices within 20%
PASS  Mastery pays: at woodcutting 11, Pine tree (mastery 8) earns 90% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 15, Old pine (mastery 8) earns 86% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 20, Ash tree (mastery 7) earns 92% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 24, Old ash (mastery 7) earns 92% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 30, Oak tree (mastery 9) earns 96% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 34, Old oak (mastery 6) earns 90% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 40, Yew tree (mastery 10) earns 125% of the best fresh action of its kind
PASS  Mastery pays: at mining 11, Copper vein (mastery 8) earns 90% of the best fresh action of its kind
PASS  Mastery pays: at mining 15, Deep copper seam (mastery 8) earns 86% of the best fresh action of its kind
PASS  Mastery pays: at mining 20, Tin vein (mastery 7) earns 92% of the best fresh action of its kind
PASS  Mastery pays: at mining 24, Deep tin seam (mastery 7) earns 92% of the best fresh action of its kind
PASS  Mastery pays: at mining 30, Iron vein (mastery 9) earns 96% of the best fresh action of its kind
PASS  Mastery pays: at mining 34, Deep iron seam (mastery 6) earns 90% of the best fresh action of its kind
PASS  Mastery pays: at mining 40, Coal vein (mastery 10) earns 125% of the best fresh action of its kind
Smithing: every recipe in a tier pays the same XP an hour; bars are quicker to sell, gear is worth 40% more than its bars.
PASS  Smithing recipes within 10% of their tier rate

The triangle (each foe at its intended level: XP an hour, food an hour, verdict)
Hollow rat      melee    melee eve 3748 xp 4 food Fair | archery dis 3133 xp 15 food Fair | magic adv 4402 xp 0 food Easy
PASS  Hollow rat: magic wins, archery loses
Goblin slinger  archery  melee adv 4465 xp 9 food Fair | archery eve 3885 xp 25 food Fair | magic dis 3256 xp 42 food Costly
PASS  Goblin slinger: melee wins, magic loses
Marsh wisp      magic    melee dis 3294 xp 44 food Costly | archery adv 4669 xp 7 food Fair | magic eve 3926 xp 24 food Fair
PASS  Marsh wisp: archery wins, melee loses
Orc raider      melee    melee eve 6560 xp 17 food Fair | archery dis 5487 xp 30 food Costly | magic adv 7806 xp 6 food Fair
PASS  Orc raider: magic wins, archery loses
Orc bowman      archery  melee adv 8393 xp 8 food Fair | archery eve 7250 xp 20 food Fair | magic dis 6092 xp 33 food Costly
PASS  Orc bowman: melee wins, magic loses
Grave wight     magic    melee dis 8279 xp 25 food Costly | archery adv 11604 xp 9 food Fair | magic eve 9709 xp 17 food Fair
PASS  Grave wight: archery wins, melee loses
Hill troll      melee    melee eve 12398 xp 17 food Fair | archery dis 10392 xp 25 food Costly | magic adv 14703 xp 9 food Fair
PASS  Hill troll: magic wins, archery loses
Fell huntsman   archery  melee adv 20938 xp 9 food Fair | archery eve 17328 xp 17 food Fair | magic dis 14409 xp 26 food Costly
PASS  Fell huntsman: melee wins, magic loses
Combat level 6: magic vs Hollow rat 5054 · melee vs Goblin slinger 4957
PASS  Combat tier 1 offers two choices (style or target) within 20%
Combat level 16: magic vs Orc raider 8174 · melee vs Orc raider 7009
PASS  Combat tier 2 offers two choices (style or target) within 20%
Combat level 26: archery vs Grave wight 14003 · magic vs Grave wight 11857
PASS  Combat tier 3 offers two choices (style or target) within 20%
Combat level 36: melee vs Fell huntsman 21075 · magic vs Hill troll 18098
PASS  Combat tier 4 offers two choices (style or target) within 20%

Notable events in an hour of active play (four lanes with the fire, three short goals)
First hour  levels W1 M1 S1 magic1 HP1: one moment every 0.8 min on average; longest gap 3.3 min (worst of 60 runs 4.0)
            per hour: level 39.3, uncommon 29.4, mastery 13.0, rare 3.1, goal 16.4, legendary 0.3
PASS  First hour: never more than 5 minutes without one
PASS  First hour: a rare find in 100% of fresh players
Day 2       levels W20 M20 S20 magic19 HP15: one moment every 1.6 min on average; longest gap 4.1 min (worst of 60 runs 4.2)
            per hour: uncommon 15.3, mastery 8.6, rare 1.4, goal 14.2, legendary 0.1
PASS  Day 2: a notable moment about every 2 minutes
PASS  Day 2: never more than 5 minutes without one
Day 5       levels W28 M28 S28 magic27 HP22: one moment every 1.8 min on average; longest gap 4.1 min (worst of 60 runs 4.2)
            per hour: uncommon 16.7, mastery 2.0, rare 1.8, goal 14.2, legendary 0.2
PASS  Day 5: a notable moment about every 2 minutes
PASS  Day 5: never more than 5 minutes without one
Day 14      levels W36 M36 S35 magic35 HP31: one moment every 2.0 min on average; longest gap 4.1 min (worst of 60 runs 4.3)
            per hour: uncommon 14.8, rare 1.5, goal 14.2, legendary 0.2
PASS  Day 14: a notable moment about every 2 minutes
PASS  Day 14: never more than 5 minutes without one
Day 21      levels W39 M39 S38 magic39 HP33: one moment every 2.0 min on average; longest gap 4.1 min (worst of 60 runs 4.2)
            per hour: uncommon 15.4, rare 1.6, goal 14.2, legendary 0.2
PASS  Day 21: a notable moment about every 2 minutes
PASS  Day 21: never more than 5 minutes without one

The away recap after 8 hours (three lanes, no fire)
PASS  Day 2: the recap holds at least 25 good things (target 3)
PASS  Day 5: the recap holds at least 8 good things (target 3)
PASS  Day 14: the recap holds at least 6 good things (target 3)
PASS  Day 21: the recap holds at least 7 good things (target 3)

The fire
PASS  An hour with the fire earns 1.56x the XP of an hour away (target 1.5x; +15% XP and a second Gathering lane)

First crafted gear
PASS  A fresh player wears a Copper sword after about 2 minutes (target under 15)

Gold: does a day pay for a day of food and the next Storehouse enlargement?
Day 1   income 64,250 · food 0 (0%) · enlargement 1 costs 40,000
PASS  Day 1: a day's gold covers a day of food and enlargement 1
Day 2   income 140,213 · food 2,931 (2%) · enlargement 2 costs 90,000
PASS  Day 2: a day's gold covers a day of food and enlargement 2
Day 3   income 147,974 · food 0 (0%) · enlargement 3 costs 100,000
PASS  Day 3: a day's gold covers a day of food and enlargement 3
Day 5   income 180,856 · food 36,112 (20%) · enlargement 4 costs 120,000
PASS  Day 5: a day's gold covers a day of food and enlargement 4
Day 7   income 340,878 · food 23,660 (7%) · enlargement 5 costs 180,000
PASS  Day 7: a day's gold covers a day of food and enlargement 5
Day 10  income 340,217 · food 17,318 (5%) · enlargement 6 costs 200,000
PASS  Day 10: a day's gold covers a day of food and enlargement 6
Day 14  income 356,823 · food 2,889 (1%) · enlargement 7 costs 230,000
PASS  Day 14: a day's gold covers a day of food and enlargement 7
Day 18  income 362,926 · food 3,042 (1%) · enlargement 8 costs 250,000
PASS  Day 18: a day's gold covers a day of food and enlargement 8
Costs at 70% of each day's net gold would be: 45000, 95000, 105000, 100000, 220000, 225000, 250000, 250000

Supply: can mining keep the forge fed?
Tier 1: smelting without pause needs mining 69% of the time on a fresh vein, 42% on a mastered deep seam
Tier 2: smelting without pause needs mining 63% of the time on a fresh vein, 39% on a mastered deep seam
Tier 3: smelting without pause needs mining 58% of the time on a fresh vein, 36% on a mastered deep seam
Tier 4: smelting without pause needs mining 53% of the time on a fresh vein, 33% on a mastered deep seam
```
