<!-- Generated from design/GAME_DESIGN.template.md by design/model/build-docs.ts. Edit the template. -->

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
- While it burns: **+15% XP** in every lane on average over an hour, and a **second Gathering lane**, so you can cut wood and mine at once (one skill never runs in both). When it goes out, the second lane stops with "The fire went out".
- **It burns hotter the longer it is kept going** (session 11): +8% XP in its first ten minutes, +14% from ten, +17% from twenty, so an hour of play averages exactly the +15% the model uses. Letting it go out starts the heat again. The badge glows brighter at each step and shows its bonus.
- Worked through the model, an hour with the fire earns **1.54 times** the XP of an hour away (target 1.5).

## 3. Skills, tiers and materials

Seven skills: Woodcutting, Mining (Gathering); Smithing (Artisan); Melee, Archery, Magic and Hitpoints (Combat). The top level is **99** (version 1 stopped at 40).

Eight tiers open at levels 1, 10, 20, 30, 40, 55, 70 and 85. The first four belong to the march; the next two to the Sunken Fen and the last two to the Ashen Peaks, so the later tiers come further apart and each is earned:

| Tier | Metal | Logs | Ore (Mining opens it) | Bar recipe |
| --- | --- | --- | --- | --- |
| 1 | Copper | Pine | Copper ore (1) | 1 copper ore |
| 2 | Bronze | Ash | Tin ore (10) | 1 copper ore + 1 tin ore |
| 3 | Iron | Oak | Iron ore (20) | 2 iron ore |
| 4 | Steel | Yew | Coal (30) | 1 iron ore + 2 coal |
| 5 | Moonsilver | Maple | Moonsilver ore (40) | 1 moonsilver ore + 1 coal |
| 6 | Star-iron | Silverbark | Star-iron ore (55) | 1 star-iron ore + 2 coal |
| 7 | Embersteel | Elderwood | Ember ore (70) | 1 ember ore + 2 coal |
| 8 | Dawnsteel | Ancient | Dawnstone (85) | 1 dawnstone + 1 moonsilver ore + 2 coal |

That is 24 resources: eight logs, eight ores, eight bars. Bronze, steel and the later metals are alloys, so earlier ores keep their use: coal goes into every bar from steel on, and dawnsteel needs moonsilver.

- **Weapons** need the style's level: a sword (Melee), a bow (Archery) or a staff (Magic) of a tier needs that style at the tier's level. Your style is your weapon's.
- **Armour** (helm, body, legs) is shared by all styles and needs Hitpoints at the tier's level.

## 4. The XP curve and pacing

One XP table serves every skill (total XP to reach each level, *generated*):

| Level | XP | Level | XP | Level | XP | Level | XP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 | 26 | 650,000 | 51 | 21,500,000 | 76 | 53,000,000 |
| 2 | 50 | 27 | 790,000 | 52 | 22,700,000 | 77 | 54,300,000 |
| 3 | 150 | 28 | 951,000 | 53 | 23,900,000 | 78 | 55,600,000 |
| 4 | 310 | 29 | 1,140,000 | 54 | 25,200,000 | 79 | 56,900,000 |
| 5 | 520 | 30 | 1,360,000 | 55 | 26,400,000 | 80 | 58,200,000 |
| 6 | 890 | 31 | 1,650,000 | 56 | 27,700,000 | 81 | 59,500,000 |
| 7 | 1,490 | 32 | 2,000,000 | 57 | 28,900,000 | 82 | 60,800,000 |
| 8 | 2,500 | 33 | 2,430,000 | 58 | 30,200,000 | 83 | 62,100,000 |
| 9 | 4,170 | 34 | 2,920,000 | 59 | 31,400,000 | 84 | 63,400,000 |
| 10 | 6,790 | 35 | 3,500,000 | 60 | 32,700,000 | 85 | 64,800,000 |
| 11 | 10,400 | 36 | 4,170,000 | 61 | 33,900,000 | 86 | 66,100,000 |
| 12 | 15,900 | 37 | 4,950,000 | 62 | 35,200,000 | 87 | 67,400,000 |
| 13 | 23,800 | 38 | 5,850,000 | 63 | 36,400,000 | 88 | 68,700,000 |
| 14 | 34,000 | 39 | 6,900,000 | 64 | 37,700,000 | 89 | 70,000,000 |
| 15 | 46,800 | 40 | 8,100,000 | 65 | 38,900,000 | 90 | 71,400,000 |
| 16 | 62,100 | 41 | 9,310,000 | 66 | 40,200,000 | 91 | 72,700,000 |
| 17 | 79,900 | 42 | 10,500,000 | 67 | 41,500,000 | 92 | 74,000,000 |
| 18 | 101,000 | 43 | 11,700,000 | 68 | 42,800,000 | 93 | 75,400,000 |
| 19 | 126,000 | 44 | 12,900,000 | 69 | 44,000,000 | 94 | 76,700,000 |
| 20 | 155,000 | 45 | 14,100,000 | 70 | 45,300,000 | 95 | 78,000,000 |
| 21 | 202,000 | 46 | 15,400,000 | 71 | 46,600,000 | 96 | 79,400,000 |
| 22 | 265,000 | 47 | 16,600,000 | 72 | 47,900,000 | 97 | 80,700,000 |
| 23 | 340,000 | 48 | 17,800,000 | 73 | 49,100,000 | 98 | 82,100,000 |
| 24 | 428,000 | 49 | 19,000,000 | 74 | 50,400,000 | 99 | 83,400,000 |
| 25 | 531,000 | 50 | 20,300,000 | 75 | 51,700,000 |  |  |

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
| Maple tree | Woodcutting | 40 | 30 | 142 | Maple logs ×1 | 70 each |
| Old maple | Woodcutting | 44 | 45 | 185 | Maple logs ×2 | 70 each |
| Silverbark tree | Woodcutting | 55 | 34 | 208 | Silverbark logs ×1 | 115 each |
| Old silverbark | Woodcutting | 59 | 51 | 270 | Silverbark logs ×2 | 115 each |
| Elderwood tree | Woodcutting | 70 | 38 | 296 | Elderwood logs ×1 | 180 each |
| Old elderwood | Woodcutting | 74 | 57 | 385 | Elderwood logs ×2 | 180 each |
| Ancient tree | Woodcutting | 85 | 42 | 408 | Ancient logs ×1 | 270 each |
| Old ancient | Woodcutting | 89 | 63 | 530 | Ancient logs ×2 | 270 each |
| Copper vein | Mining | 1 | 7.5 | 11 | Copper ore ×1 | 1 each |
| Deep copper seam | Mining | 5 | 11.25 | 14 | Copper ore ×2 | 1 each |
| Tin vein | Mining | 10 | 12.5 | 25 | Tin ore ×1 | 4 each |
| Deep tin seam | Mining | 14 | 18.75 | 33 | Tin ore ×2 | 4 each |
| Iron vein | Mining | 20 | 20 | 52 | Iron ore ×1 | 14 each |
| Deep iron seam | Mining | 24 | 30 | 68 | Iron ore ×2 | 14 each |
| Coal vein | Mining | 30 | 26 | 87 | Coal ×1 | 30 each |
| Deep coal seam | Mining | 34 | 39 | 113 | Coal ×2 | 30 each |
| Moonsilver vein | Mining | 40 | 30 | 142 | Moonsilver ore ×1 | 60 each |
| Deep moonsilver seam | Mining | 44 | 45 | 185 | Moonsilver ore ×2 | 60 each |
| Star-iron vein | Mining | 55 | 34 | 208 | Star-iron ore ×1 | 100 each |
| Deep star-iron seam | Mining | 59 | 51 | 270 | Star-iron ore ×2 | 100 each |
| Ember vein | Mining | 70 | 38 | 296 | Ember ore ×1 | 160 each |
| Deep ember seam | Mining | 74 | 57 | 385 | Ember ore ×2 | 160 each |
| Dawnstone vein | Mining | 85 | 42 | 408 | Dawnstone ×1 | 240 each |
| Deep dawnstone seam | Mining | 89 | 63 | 530 | Dawnstone ×2 | 240 each |

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
| Moonsilver bar | 40 | Moonsilver ore ×1, Coal ×1 | 60 | 283 | 117 |
| Moonsilver sword | 41 | Moonsilver bar ×3 | 90 | 425 | 491 |
| Moonsilver staff | 42 | Moonsilver bar ×2, Maple logs ×1 | 90 | 425 | 426 |
| Moonsilver bow | 43 | Moonsilver bar ×1, Maple logs ×2 | 90 | 425 | 360 |
| Moonsilver helm | 45 | Moonsilver bar ×2 | 60 | 283 | 328 |
| Moonsilver legs | 46 | Moonsilver bar ×3 | 90 | 425 | 491 |
| Moonsilver body | 48 | Moonsilver bar ×5 | 150 | 708 | 819 |
| Star-iron bar | 55 | Star-iron ore ×1, Coal ×2 | 102 | 623 | 208 |
| Star-iron sword | 56 | Star-iron bar ×3 | 102 | 623 | 874 |
| Star-iron staff | 57 | Star-iron bar ×2, Silverbark logs ×1 | 102 | 623 | 743 |
| Star-iron bow | 58 | Star-iron bar ×1, Silverbark logs ×2 | 102 | 623 | 613 |
| Star-iron helm | 60 | Star-iron bar ×2 | 68 | 416 | 582 |
| Star-iron legs | 61 | Star-iron bar ×3 | 102 | 623 | 874 |
| Star-iron body | 63 | Star-iron bar ×5 | 170 | 1039 | 1456 |
| Embersteel bar | 70 | Ember ore ×1, Coal ×2 | 114 | 887 | 286 |
| Embersteel sword | 71 | Embersteel bar ×3 | 114 | 887 | 1201 |
| Embersteel staff | 72 | Embersteel bar ×2, Elderwood logs ×1 | 114 | 887 | 1053 |
| Embersteel bow | 73 | Embersteel bar ×1, Elderwood logs ×2 | 114 | 887 | 904 |
| Embersteel helm | 75 | Embersteel bar ×2 | 76 | 591 | 801 |
| Embersteel legs | 76 | Embersteel bar ×3 | 114 | 887 | 1201 |
| Embersteel body | 78 | Embersteel bar ×5 | 190 | 1478 | 2002 |
| Dawnsteel bar | 85 | Dawnstone ×1, Moonsilver ore ×1, Coal ×2 | 168 | 1633 | 468 |
| Dawnsteel sword | 86 | Dawnsteel bar ×3 | 126 | 1225 | 1966 |
| Dawnsteel staff | 87 | Dawnsteel bar ×2, Ancient logs ×1 | 126 | 1225 | 1688 |
| Dawnsteel bow | 88 | Dawnsteel bar ×1, Ancient logs ×2 | 126 | 1225 | 1411 |
| Dawnsteel helm | 90 | Dawnsteel bar ×2 | 84 | 817 | 1310 |
| Dawnsteel legs | 91 | Dawnsteel bar ×3 | 126 | 1225 | 1966 |
| Dawnsteel body | 93 | Dawnsteel bar ×5 | 210 | 2042 | 3276 |

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
| Melee | Battle trophy · Raider's war-horn | Torn banner · Warlord's seal | Shard of a king's blade · Troll-chief's tooth |
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
- **Health:** 300 at Hitpoints 1, +40 a level (Health 300 at Hitpoints 1, 1860 at 40, 4220 at 99. Style XP per point of damage by foe tier: 0.3, 0.32, 0.34, 0.35, 0.34, 0.31, 0.3, 0.28.). It returns 10 every 6 seconds.
- **Food** is eaten automatically below half health (the best food you carry). Below 20% with no food left, you **retreat**: nothing is lost, and the lane stops with the reason ("Retreated from the hill troll: out of food").

### XP from combat

- **Style XP** is earned per point of damage dealt (overkill counts for nothing): 0.30, 0.32, 0.34 and 0.35 a point against tier 1 to 4 foes, then 0.34, 0.31, 0.30 and 0.28 against tiers 5 to 8.
- **Easy foes teach less:** for each level a foe stands more than five below your style, 4% less XP, down to 40%. An outlevelled foe is never the best target for long.
- **Hitpoints XP** equals the style XP from every fight, whatever the style (40% until session 12; past 40 the levels would otherwise leave Hitpoints, and the armour and foes it opens, far behind a player who keeps to one style).

### Foes and Your odds

A foe opens at a Hitpoints level, so every style can reach every foe. Foes live in three regions, each a tab of the Combat page: the march (tiers 1 to 4), the Sunken Fen (5 and 6) and the Ashen Peaks (7 and 8), three foes a tier past the march, one of each style. Each foe was calibrated against its intended matchup (the style that beats it, at its level, in that tier's gear) to about 10 food an hour. Past tier 4, style XP per point of damage falls a little with each tier (hits grow faster than the levels they buy), so combat keeps the gathering skills' pace.

*Generated:*

| Foe | Region | Style | Level | Opens at Hitpoints | Health | Max hit | XP a defeat (style) | Gold a defeat | Drop |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Hollow rat | The march | Melee | 2 | 1 | 100 | 20 | 30 | 5 | Copper ore |
| Goblin slinger | The march | Archery | 4 | 2 | 100 | 30 | 30 | 4 | Pine logs |
| Marsh wisp | The march | Magic | 6 | 3 | 100 | 30 | 30 | 4 | Copper bar |
| Orc raider | The march | Melee | 15 | 14 | 130 | 55 | 42 | 8 | Tin ore |
| Orc bowman | The march | Archery | 19 | 18 | 140 | 65 | 45 | 8 | Bronze bar |
| Grave wight | The march | Magic | 24 | 22 | 220 | 80 | 75 | 22 | Iron ore |
| Hill troll | The march | Melee | 29 | 27 | 270 | 95 | 92 | 22 | Oak logs |
| Fell huntsman | The march | Archery | 37 | 34 | 420 | 110 | 147 | 49 | Steel bar |
| Bog lurker | The Sunken Fen | Melee | 42 | 40 | 560 | 150 | 190 | 61 | Maple logs |
| Reed stalker | The Sunken Fen | Archery | 46 | 44 | 560 | 160 | 190 | 60 | Moonsilver ore |
| Drowned acolyte | The Sunken Fen | Magic | 51 | 49 | 630 | 180 | 214 | 60 | Moonsilver bar |
| Mire hulk | The Sunken Fen | Melee | 57 | 55 | 790 | 220 | 245 | 98 | Silverbark logs |
| Fen reaver | The Sunken Fen | Archery | 62 | 60 | 860 | 235 | 267 | 97 | Star-iron ore |
| Bog witch | The Sunken Fen | Magic | 67 | 65 | 880 | 260 | 273 | 97 | Star-iron bar |
| Ash troll | The Ashen Peaks | Melee | 72 | 70 | 1050 | 315 | 315 | 147 | Elderwood logs |
| Peak slinger | The Ashen Peaks | Archery | 77 | 75 | 1160 | 340 | 348 | 147 | Ember ore |
| Ash shaman | The Ashen Peaks | Magic | 82 | 80 | 1190 | 360 | 357 | 147 | Embersteel bar |
| Obsidian golem | The Ashen Peaks | Melee | 87 | 85 | 1480 | 460 | 414 | 212 | Ancient logs |
| Sky reaver | The Ashen Peaks | Archery | 92 | 90 | 1520 | 485 | 426 | 212 | Dawnstone |
| Ember sorcerer | The Ashen Peaks | Magic | 97 | 95 | 1620 | 525 | 454 | 211 | Dawnsteel bar |

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
| Roast fowl | 1000 | 190 | 40 |
| Hunter's feast | 1600 | 320 | 60 |
| Warden's feast | 2300 | 480 | 80 |

## 10. Gold and the Storehouse

- **Sources:** selling logs, ores, bars, gear and Uncommon and Rare finds to the vendor; gold and drops from foes.
- **Sinks:** food, and Storehouse enlargements. Gear is made, never bought.
- **The Storehouse** holds stacks of any size; slots limit the number of different items. Starts with 24 slots; each enlargement adds 6. Costs: 40,000, 90,000, 100,000, 120,000, 180,000, 200,000, 230,000, 250,000, 280,000, 300,000, 340,000, 450,000, 460,000, 650,000 gold. There are 102 kinds of item (24 resources, 48 gear, 6 foods, 24 sellable finds), so the last enlargement (108 slots) fits them all.
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
4. **Milestones:** total level 50, 100, 150, 200, 250 and 280; the first item of each tier; collection log 12, 24 and 36; the first mastery 10. Reward: gold, and the milestone is shown on your hiscore entry.
5. **Supply caches** (session 11): half the goal's worth in gold is certain, and one draw adds more: a plain cache (half the time, +30%), a stocked one (3 in 10, +50% as the best food you are sold, for a fighter), a rich one (3 in 20, +100%) or a lucky one (1 in 20, +200%). On average a cache pays 1.05 times the goal's gold, so the economy holds, and opening one is a small moment of its own.

### Notable moments

A level, an unlock, a find, a goal or a mastery step. Moments within 5 seconds of each other show together. Levels and Legendary finds take the centre of the screen; Rare finds and mastery steps a banner; Uncommon finds and goals a toast in the lane card. Measured in the model: one moment every 1.6 to 2.0 minutes of active play from day 2 onward, never more than 4.3 minutes without one. The first hour runs faster on purpose, at about one a minute, while ten levels come in every skill.

## 12. The unlock ladder

Every level 1 to 99 of every skill unlocks something: an action, a recipe, a tier, a foe, a food or a perk. Past 40 a perk line's ranks give half as much (there are so many more of them), and each skill has a second capstone at 99. Perk text is generated from its numbers by one formatter. *Generated.*

### Woodcutting

| Levels 1–25 | Levels 26–50 | Levels 51–75 | Levels 76–99 |
| --- | --- | --- | --- |
| **1** Pine tree | **26** Practised hands V (mastery 6% faster) | **51** Quick swing XI (1.25% faster) | **76** Plenty XVI (+1.5% chance of an extra item) |
| **2** Quick swing I (2.5% faster) | **27** Quick swing VI (2.5% faster) | **52** Plenty XI (+1.5% chance of an extra item) | **77** Woodsman's eye XVI (Rare and Legendary finds 4% likelier) |
| **3** Plenty I (+3% chance of an extra item) | **28** Plenty VI (+3% chance of an extra item) | **53** Woodsman's eye XI (Rare and Legendary finds 4% likelier) | **78** Practised hands XVI (mastery 3% faster) |
| **4** Woodsman's eye I (Rare and Legendary finds 8% likelier) | **29** Woodsman's eye VI (Rare and Legendary finds 8% likelier) | **54** Practised hands XI (mastery 3% faster) | **79** Quick swing XVII (1.25% faster) |
| **5** Old pine | **30** Yew tree | **55** Silverbark tree | **80** Plenty XVII (+1.5% chance of an extra item) |
| **6** Practised hands I (mastery 6% faster) | **31** Practised hands VI (mastery 6% faster) | **56** Quick swing XII (1.25% faster) | **81** Woodsman's eye XVII (Rare and Legendary finds 4% likelier) |
| **7** Quick swing II (2.5% faster) | **32** Quick swing VII (2.5% faster) | **57** Plenty XII (+1.5% chance of an extra item) | **82** Practised hands XVII (mastery 3% faster) |
| **8** Plenty II (+3% chance of an extra item) | **33** Plenty VII (+3% chance of an extra item) | **58** Woodsman's eye XII (Rare and Legendary finds 4% likelier) | **83** Quick swing XVIII (1.25% faster) |
| **9** Woodsman's eye II (Rare and Legendary finds 8% likelier) | **34** Old yew | **59** Old silverbark | **84** Plenty XVIII (+1.5% chance of an extra item) |
| **10** Ash tree | **35** Woodsman's eye VII (Rare and Legendary finds 8% likelier) | **60** Practised hands XII (mastery 3% faster) | **85** Ancient tree |
| **11** Practised hands II (mastery 6% faster) | **36** Practised hands VII (mastery 6% faster) | **61** Quick swing XIII (1.25% faster) | **86** Woodsman's eye XVIII (Rare and Legendary finds 4% likelier) |
| **12** Quick swing III (2.5% faster) | **37** Quick swing VIII (2.5% faster) | **62** Plenty XIII (+1.5% chance of an extra item) | **87** Practised hands XVIII (mastery 3% faster) |
| **13** Plenty III (+3% chance of an extra item) | **38** Plenty VIII (+3% chance of an extra item) | **63** Woodsman's eye XIII (Rare and Legendary finds 4% likelier) | **88** Quick swing XIX (1.25% faster) |
| **14** Old ash | **39** Woodsman's eye VIII (Rare and Legendary finds 8% likelier) | **64** Practised hands XIII (mastery 3% faster) | **89** Old ancient |
| **15** Woodsman's eye III (Rare and Legendary finds 8% likelier) | **40** Maple tree; Master woodcutter (+10% chance of an extra item) | **65** Quick swing XIV (1.25% faster) | **90** Plenty XIX (+1.5% chance of an extra item) |
| **16** Practised hands III (mastery 6% faster) | **41** Practised hands VIII (mastery 3% faster) | **66** Plenty XIV (+1.5% chance of an extra item) | **91** Woodsman's eye XIX (Rare and Legendary finds 4% likelier) |
| **17** Quick swing IV (2.5% faster) | **42** Quick swing IX (1.25% faster) | **67** Woodsman's eye XIV (Rare and Legendary finds 4% likelier) | **92** Practised hands XIX (mastery 3% faster) |
| **18** Plenty IV (+3% chance of an extra item) | **43** Plenty IX (+1.5% chance of an extra item) | **68** Practised hands XIV (mastery 3% faster) | **93** Quick swing XX (1.25% faster) |
| **19** Woodsman's eye IV (Rare and Legendary finds 8% likelier) | **44** Old maple | **69** Quick swing XV (1.25% faster) | **94** Plenty XX (+1.5% chance of an extra item) |
| **20** Oak tree | **45** Woodsman's eye IX (Rare and Legendary finds 4% likelier) | **70** Elderwood tree | **95** Woodsman's eye XX (Rare and Legendary finds 4% likelier) |
| **21** Practised hands IV (mastery 6% faster) | **46** Practised hands IX (mastery 3% faster) | **71** Plenty XV (+1.5% chance of an extra item) | **96** Practised hands XX (mastery 3% faster) |
| **22** Quick swing V (2.5% faster) | **47** Quick swing X (1.25% faster) | **72** Woodsman's eye XV (Rare and Legendary finds 4% likelier) | **97** Quick swing XXI (1.25% faster) |
| **23** Plenty V (+3% chance of an extra item) | **48** Plenty X (+1.5% chance of an extra item) | **73** Practised hands XV (mastery 3% faster) | **98** Plenty XXI (+1.5% chance of an extra item) |
| **24** Old oak | **49** Woodsman's eye X (Rare and Legendary finds 4% likelier) | **74** Old elderwood | **99** Grandmaster woodcutter (+15% chance of an extra item) |
| **25** Woodsman's eye V (Rare and Legendary finds 8% likelier) | **50** Practised hands X (mastery 3% faster) | **75** Quick swing XVI (1.25% faster) |  |

### Mining

| Levels 1–25 | Levels 26–50 | Levels 51–75 | Levels 76–99 |
| --- | --- | --- | --- |
| **1** Copper vein | **26** Practised hands V (mastery 6% faster) | **51** Quick strike XI (1.25% faster) | **76** Plenty XVI (+1.5% chance of an extra item) |
| **2** Quick strike I (2.5% faster) | **27** Quick strike VI (2.5% faster) | **52** Plenty XI (+1.5% chance of an extra item) | **77** Prospector's eye XVI (Rare and Legendary finds 4% likelier) |
| **3** Plenty I (+3% chance of an extra item) | **28** Plenty VI (+3% chance of an extra item) | **53** Prospector's eye XI (Rare and Legendary finds 4% likelier) | **78** Practised hands XVI (mastery 3% faster) |
| **4** Prospector's eye I (Rare and Legendary finds 8% likelier) | **29** Prospector's eye VI (Rare and Legendary finds 8% likelier) | **54** Practised hands XI (mastery 3% faster) | **79** Quick strike XVII (1.25% faster) |
| **5** Deep copper seam | **30** Coal vein | **55** Star-iron vein | **80** Plenty XVII (+1.5% chance of an extra item) |
| **6** Practised hands I (mastery 6% faster) | **31** Practised hands VI (mastery 6% faster) | **56** Quick strike XII (1.25% faster) | **81** Prospector's eye XVII (Rare and Legendary finds 4% likelier) |
| **7** Quick strike II (2.5% faster) | **32** Quick strike VII (2.5% faster) | **57** Plenty XII (+1.5% chance of an extra item) | **82** Practised hands XVII (mastery 3% faster) |
| **8** Plenty II (+3% chance of an extra item) | **33** Plenty VII (+3% chance of an extra item) | **58** Prospector's eye XII (Rare and Legendary finds 4% likelier) | **83** Quick strike XVIII (1.25% faster) |
| **9** Prospector's eye II (Rare and Legendary finds 8% likelier) | **34** Deep coal seam | **59** Deep star-iron seam | **84** Plenty XVIII (+1.5% chance of an extra item) |
| **10** Tin vein | **35** Prospector's eye VII (Rare and Legendary finds 8% likelier) | **60** Practised hands XII (mastery 3% faster) | **85** Dawnstone vein |
| **11** Practised hands II (mastery 6% faster) | **36** Practised hands VII (mastery 6% faster) | **61** Quick strike XIII (1.25% faster) | **86** Prospector's eye XVIII (Rare and Legendary finds 4% likelier) |
| **12** Quick strike III (2.5% faster) | **37** Quick strike VIII (2.5% faster) | **62** Plenty XIII (+1.5% chance of an extra item) | **87** Practised hands XVIII (mastery 3% faster) |
| **13** Plenty III (+3% chance of an extra item) | **38** Plenty VIII (+3% chance of an extra item) | **63** Prospector's eye XIII (Rare and Legendary finds 4% likelier) | **88** Quick strike XIX (1.25% faster) |
| **14** Deep tin seam | **39** Prospector's eye VIII (Rare and Legendary finds 8% likelier) | **64** Practised hands XIII (mastery 3% faster) | **89** Deep dawnstone seam |
| **15** Prospector's eye III (Rare and Legendary finds 8% likelier) | **40** Moonsilver vein; Master miner (+10% chance of an extra item) | **65** Quick strike XIV (1.25% faster) | **90** Plenty XIX (+1.5% chance of an extra item) |
| **16** Practised hands III (mastery 6% faster) | **41** Practised hands VIII (mastery 3% faster) | **66** Plenty XIV (+1.5% chance of an extra item) | **91** Prospector's eye XIX (Rare and Legendary finds 4% likelier) |
| **17** Quick strike IV (2.5% faster) | **42** Quick strike IX (1.25% faster) | **67** Prospector's eye XIV (Rare and Legendary finds 4% likelier) | **92** Practised hands XIX (mastery 3% faster) |
| **18** Plenty IV (+3% chance of an extra item) | **43** Plenty IX (+1.5% chance of an extra item) | **68** Practised hands XIV (mastery 3% faster) | **93** Quick strike XX (1.25% faster) |
| **19** Prospector's eye IV (Rare and Legendary finds 8% likelier) | **44** Deep moonsilver seam | **69** Quick strike XV (1.25% faster) | **94** Plenty XX (+1.5% chance of an extra item) |
| **20** Iron vein | **45** Prospector's eye IX (Rare and Legendary finds 4% likelier) | **70** Ember vein | **95** Prospector's eye XX (Rare and Legendary finds 4% likelier) |
| **21** Practised hands IV (mastery 6% faster) | **46** Practised hands IX (mastery 3% faster) | **71** Plenty XV (+1.5% chance of an extra item) | **96** Practised hands XX (mastery 3% faster) |
| **22** Quick strike V (2.5% faster) | **47** Quick strike X (1.25% faster) | **72** Prospector's eye XV (Rare and Legendary finds 4% likelier) | **97** Quick strike XXI (1.25% faster) |
| **23** Plenty V (+3% chance of an extra item) | **48** Plenty X (+1.5% chance of an extra item) | **73** Practised hands XV (mastery 3% faster) | **98** Plenty XXI (+1.5% chance of an extra item) |
| **24** Deep iron seam | **49** Prospector's eye X (Rare and Legendary finds 4% likelier) | **74** Deep ember seam | **99** Grandmaster miner (+15% chance of an extra item) |
| **25** Prospector's eye V (Rare and Legendary finds 8% likelier) | **50** Practised hands X (mastery 3% faster) | **75** Quick strike XVI (1.25% faster) |  |

### Smithing

| Levels 1–25 | Levels 26–50 | Levels 51–75 | Levels 76–99 |
| --- | --- | --- | --- |
| **1** Copper bar | **26** Iron legs | **51** Practised hands IV (mastery 4% faster) | **76** Embersteel legs |
| **2** Copper sword | **27** Smith's eye II (Rare and Legendary finds 8% likelier) | **52** Steady forge V (1.5% faster) | **77** Steady forge VIII (1.5% faster) |
| **3** Copper staff | **28** Iron body | **53** Thrifty V (2% chance to save an ingredient) | **78** Embersteel body |
| **4** Copper bow | **29** Practised hands II (mastery 8% faster) | **54** Smith's eye V (Rare and Legendary finds 4% likelier) | **79** Thrifty VIII (2% chance to save an ingredient) |
| **5** Steady forge I (3% faster) | **30** Steel bar | **55** Star-iron bar | **80** Smith's eye VIII (Rare and Legendary finds 4% likelier) |
| **6** Copper helm | **31** Steel sword | **56** Star-iron sword | **81** Practised hands VIII (mastery 4% faster) |
| **7** Copper legs | **32** Steel staff | **57** Star-iron staff | **82** Steady forge IX (1.5% faster) |
| **8** Thrifty I (4% chance to save an ingredient) | **33** Steel bow | **58** Star-iron bow | **83** Thrifty IX (2% chance to save an ingredient) |
| **9** Copper body | **34** Steady forge III (3% faster) | **59** Practised hands V (mastery 4% faster) | **84** Smith's eye IX (Rare and Legendary finds 4% likelier) |
| **10** Bronze bar | **35** Steel helm | **60** Star-iron helm | **85** Dawnsteel bar |
| **11** Bronze sword | **36** Steel legs | **61** Star-iron legs | **86** Dawnsteel sword |
| **12** Bronze staff | **37** Thrifty III (4% chance to save an ingredient) | **62** Steady forge VI (1.5% faster) | **87** Dawnsteel staff |
| **13** Bronze bow | **38** Steel body | **63** Star-iron body | **88** Dawnsteel bow |
| **14** Smith's eye I (Rare and Legendary finds 8% likelier) | **39** Smith's eye III (Rare and Legendary finds 8% likelier) | **64** Thrifty VI (2% chance to save an ingredient) | **89** Practised hands IX (mastery 4% faster) |
| **15** Bronze helm | **40** Moonsilver bar; Master smith (8% chance to save an ingredient) | **65** Smith's eye VI (Rare and Legendary finds 4% likelier) | **90** Dawnsteel helm |
| **16** Bronze legs | **41** Moonsilver sword | **66** Practised hands VI (mastery 4% faster) | **91** Dawnsteel legs |
| **17** Practised hands I (mastery 8% faster) | **42** Moonsilver staff | **67** Steady forge VII (1.5% faster) | **92** Steady forge X (1.5% faster) |
| **18** Bronze body | **43** Moonsilver bow | **68** Thrifty VII (2% chance to save an ingredient) | **93** Dawnsteel body |
| **19** Steady forge II (3% faster) | **44** Practised hands III (mastery 4% faster) | **69** Smith's eye VII (Rare and Legendary finds 4% likelier) | **94** Thrifty X (2% chance to save an ingredient) |
| **20** Iron bar | **45** Moonsilver helm | **70** Embersteel bar | **95** Smith's eye X (Rare and Legendary finds 4% likelier) |
| **21** Iron sword | **46** Moonsilver legs | **71** Embersteel sword | **96** Practised hands X (mastery 4% faster) |
| **22** Iron staff | **47** Steady forge IV (1.5% faster) | **72** Embersteel staff | **97** Steady forge XI (1.5% faster) |
| **23** Iron bow | **48** Moonsilver body | **73** Embersteel bow | **98** Thrifty XI (2% chance to save an ingredient) |
| **24** Thrifty II (4% chance to save an ingredient) | **49** Thrifty IV (2% chance to save an ingredient) | **74** Practised hands VII (mastery 4% faster) | **99** Grandmaster smith (10% chance to save an ingredient) |
| **25** Iron helm | **50** Smith's eye IV (Rare and Legendary finds 4% likelier) | **75** Embersteel helm |  |

### Melee

| Levels 1–25 | Levels 26–50 | Levels 51–75 | Levels 76–99 |
| --- | --- | --- | --- |
| **1** Wield Copper swords | **26** Parry VI (2.5% less damage taken) | **51** Sure strike XII (+1% to hit) | **76** Heavy blows XVIII (+1.5% damage) |
| **2** Heavy blows I (+3% damage) | **27** Spoils of war VI (+6% gold and drops) | **52** Parry XII (1.25% less damage taken) | **77** Sure strike XVIII (+1% to hit) |
| **3** Sure strike I (+2% to hit) | **28** Heavy blows VII (+3% damage) | **53** Spoils of war XII (+3% gold and drops) | **78** Parry XVIII (1.25% less damage taken) |
| **4** Parry I (2.5% less damage taken) | **29** Sure strike VII (+2% to hit) | **54** Heavy blows XIII (+1.5% damage) | **79** Spoils of war XVIII (+3% gold and drops) |
| **5** Spoils of war I (+6% gold and drops) | **30** Wield Steel swords | **55** Wield Star-iron swords | **80** Heavy blows XIX (+1.5% damage) |
| **6** Heavy blows II (+3% damage) | **31** Parry VII (2.5% less damage taken) | **56** Sure strike XIII (+1% to hit) | **81** Sure strike XIX (+1% to hit) |
| **7** Sure strike II (+2% to hit) | **32** Spoils of war VII (+6% gold and drops) | **57** Parry XIII (1.25% less damage taken) | **82** Parry XIX (1.25% less damage taken) |
| **8** Parry II (2.5% less damage taken) | **33** Heavy blows VIII (+3% damage) | **58** Spoils of war XIII (+3% gold and drops) | **83** Spoils of war XIX (+3% gold and drops) |
| **9** Spoils of war II (+6% gold and drops) | **34** Sure strike VIII (+2% to hit) | **59** Heavy blows XIV (+1.5% damage) | **84** Heavy blows XX (+1.5% damage) |
| **10** Wield Bronze swords | **35** Parry VIII (2.5% less damage taken) | **60** Sure strike XIV (+1% to hit) | **85** Wield Dawnsteel swords |
| **11** Heavy blows III (+3% damage) | **36** Spoils of war VIII (+6% gold and drops) | **61** Parry XIV (1.25% less damage taken) | **86** Sure strike XX (+1% to hit) |
| **12** Sure strike III (+2% to hit) | **37** Heavy blows IX (+3% damage) | **62** Spoils of war XIV (+3% gold and drops) | **87** Parry XX (1.25% less damage taken) |
| **13** Parry III (2.5% less damage taken) | **38** Sure strike IX (+2% to hit) | **63** Heavy blows XV (+1.5% damage) | **88** Spoils of war XX (+3% gold and drops) |
| **14** Spoils of war III (+6% gold and drops) | **39** Parry IX (2.5% less damage taken) | **64** Sure strike XV (+1% to hit) | **89** Heavy blows XXI (+1.5% damage) |
| **15** Heavy blows IV (+3% damage) | **40** Wield Moonsilver swords; Master of melee (+8% damage) | **65** Parry XV (1.25% less damage taken) | **90** Sure strike XXI (+1% to hit) |
| **16** Sure strike IV (+2% to hit) | **41** Spoils of war IX (+3% gold and drops) | **66** Spoils of war XV (+3% gold and drops) | **91** Parry XXI (1.25% less damage taken) |
| **17** Parry IV (2.5% less damage taken) | **42** Heavy blows X (+1.5% damage) | **67** Heavy blows XVI (+1.5% damage) | **92** Spoils of war XXI (+3% gold and drops) |
| **18** Spoils of war IV (+6% gold and drops) | **43** Sure strike X (+1% to hit) | **68** Sure strike XVI (+1% to hit) | **93** Heavy blows XXII (+1.5% damage) |
| **19** Heavy blows V (+3% damage) | **44** Parry X (1.25% less damage taken) | **69** Parry XVI (1.25% less damage taken) | **94** Sure strike XXII (+1% to hit) |
| **20** Wield Iron swords | **45** Spoils of war X (+3% gold and drops) | **70** Wield Embersteel swords | **95** Parry XXII (1.25% less damage taken) |
| **21** Sure strike V (+2% to hit) | **46** Heavy blows XI (+1.5% damage) | **71** Spoils of war XVI (+3% gold and drops) | **96** Spoils of war XXII (+3% gold and drops) |
| **22** Parry V (2.5% less damage taken) | **47** Sure strike XI (+1% to hit) | **72** Heavy blows XVII (+1.5% damage) | **97** Heavy blows XXIII (+1.5% damage) |
| **23** Spoils of war V (+6% gold and drops) | **48** Parry XI (1.25% less damage taken) | **73** Sure strike XVII (+1% to hit) | **98** Sure strike XXIII (+1% to hit) |
| **24** Heavy blows VI (+3% damage) | **49** Spoils of war XI (+3% gold and drops) | **74** Parry XVII (1.25% less damage taken) | **99** Grandmaster of melee (+10% damage) |
| **25** Sure strike VI (+2% to hit) | **50** Heavy blows XII (+1.5% damage) | **75** Spoils of war XVII (+3% gold and drops) |  |

### Archery

| Levels 1–25 | Levels 26–50 | Levels 51–75 | Levels 76–99 |
| --- | --- | --- | --- |
| **1** Wield Copper bows | **26** Light step VI (2.5% less damage taken) | **51** Steady aim XII (+1% to hit) | **76** Drawn deep XVIII (+1.5% damage) |
| **2** Drawn deep I (+3% damage) | **27** Spoils of the hunt VI (+6% gold and drops) | **52** Light step XII (1.25% less damage taken) | **77** Steady aim XVIII (+1% to hit) |
| **3** Steady aim I (+2% to hit) | **28** Drawn deep VII (+3% damage) | **53** Spoils of the hunt XII (+3% gold and drops) | **78** Light step XVIII (1.25% less damage taken) |
| **4** Light step I (2.5% less damage taken) | **29** Steady aim VII (+2% to hit) | **54** Drawn deep XIII (+1.5% damage) | **79** Spoils of the hunt XVIII (+3% gold and drops) |
| **5** Spoils of the hunt I (+6% gold and drops) | **30** Wield Steel bows | **55** Wield Star-iron bows | **80** Drawn deep XIX (+1.5% damage) |
| **6** Drawn deep II (+3% damage) | **31** Light step VII (2.5% less damage taken) | **56** Steady aim XIII (+1% to hit) | **81** Steady aim XIX (+1% to hit) |
| **7** Steady aim II (+2% to hit) | **32** Spoils of the hunt VII (+6% gold and drops) | **57** Light step XIII (1.25% less damage taken) | **82** Light step XIX (1.25% less damage taken) |
| **8** Light step II (2.5% less damage taken) | **33** Drawn deep VIII (+3% damage) | **58** Spoils of the hunt XIII (+3% gold and drops) | **83** Spoils of the hunt XIX (+3% gold and drops) |
| **9** Spoils of the hunt II (+6% gold and drops) | **34** Steady aim VIII (+2% to hit) | **59** Drawn deep XIV (+1.5% damage) | **84** Drawn deep XX (+1.5% damage) |
| **10** Wield Bronze bows | **35** Light step VIII (2.5% less damage taken) | **60** Steady aim XIV (+1% to hit) | **85** Wield Dawnsteel bows |
| **11** Drawn deep III (+3% damage) | **36** Spoils of the hunt VIII (+6% gold and drops) | **61** Light step XIV (1.25% less damage taken) | **86** Steady aim XX (+1% to hit) |
| **12** Steady aim III (+2% to hit) | **37** Drawn deep IX (+3% damage) | **62** Spoils of the hunt XIV (+3% gold and drops) | **87** Light step XX (1.25% less damage taken) |
| **13** Light step III (2.5% less damage taken) | **38** Steady aim IX (+2% to hit) | **63** Drawn deep XV (+1.5% damage) | **88** Spoils of the hunt XX (+3% gold and drops) |
| **14** Spoils of the hunt III (+6% gold and drops) | **39** Light step IX (2.5% less damage taken) | **64** Steady aim XV (+1% to hit) | **89** Drawn deep XXI (+1.5% damage) |
| **15** Drawn deep IV (+3% damage) | **40** Wield Moonsilver bows; Master of archery (+8% damage) | **65** Light step XV (1.25% less damage taken) | **90** Steady aim XXI (+1% to hit) |
| **16** Steady aim IV (+2% to hit) | **41** Spoils of the hunt IX (+3% gold and drops) | **66** Spoils of the hunt XV (+3% gold and drops) | **91** Light step XXI (1.25% less damage taken) |
| **17** Light step IV (2.5% less damage taken) | **42** Drawn deep X (+1.5% damage) | **67** Drawn deep XVI (+1.5% damage) | **92** Spoils of the hunt XXI (+3% gold and drops) |
| **18** Spoils of the hunt IV (+6% gold and drops) | **43** Steady aim X (+1% to hit) | **68** Steady aim XVI (+1% to hit) | **93** Drawn deep XXII (+1.5% damage) |
| **19** Drawn deep V (+3% damage) | **44** Light step X (1.25% less damage taken) | **69** Light step XVI (1.25% less damage taken) | **94** Steady aim XXII (+1% to hit) |
| **20** Wield Iron bows | **45** Spoils of the hunt X (+3% gold and drops) | **70** Wield Embersteel bows | **95** Light step XXII (1.25% less damage taken) |
| **21** Steady aim V (+2% to hit) | **46** Drawn deep XI (+1.5% damage) | **71** Spoils of the hunt XVI (+3% gold and drops) | **96** Spoils of the hunt XXII (+3% gold and drops) |
| **22** Light step V (2.5% less damage taken) | **47** Steady aim XI (+1% to hit) | **72** Drawn deep XVII (+1.5% damage) | **97** Drawn deep XXIII (+1.5% damage) |
| **23** Spoils of the hunt V (+6% gold and drops) | **48** Light step XI (1.25% less damage taken) | **73** Steady aim XVII (+1% to hit) | **98** Steady aim XXIII (+1% to hit) |
| **24** Drawn deep VI (+3% damage) | **49** Spoils of the hunt XI (+3% gold and drops) | **74** Light step XVII (1.25% less damage taken) | **99** Grandmaster of archery (+10% damage) |
| **25** Steady aim VI (+2% to hit) | **50** Drawn deep XII (+1.5% damage) | **75** Spoils of the hunt XVII (+3% gold and drops) |  |

### Magic

| Levels 1–25 | Levels 26–50 | Levels 51–75 | Levels 76–99 |
| --- | --- | --- | --- |
| **1** Wield Copper staves | **26** Ward VI (2.5% less damage taken) | **51** Focus XII (+1% to hit) | **76** Kindled will XVIII (+1.5% damage) |
| **2** Kindled will I (+3% damage) | **27** Spoils of the wild VI (+6% gold and drops) | **52** Ward XII (1.25% less damage taken) | **77** Focus XVIII (+1% to hit) |
| **3** Focus I (+2% to hit) | **28** Kindled will VII (+3% damage) | **53** Spoils of the wild XII (+3% gold and drops) | **78** Ward XVIII (1.25% less damage taken) |
| **4** Ward I (2.5% less damage taken) | **29** Focus VII (+2% to hit) | **54** Kindled will XIII (+1.5% damage) | **79** Spoils of the wild XVIII (+3% gold and drops) |
| **5** Spoils of the wild I (+6% gold and drops) | **30** Wield Steel staves | **55** Wield Star-iron staves | **80** Kindled will XIX (+1.5% damage) |
| **6** Kindled will II (+3% damage) | **31** Ward VII (2.5% less damage taken) | **56** Focus XIII (+1% to hit) | **81** Focus XIX (+1% to hit) |
| **7** Focus II (+2% to hit) | **32** Spoils of the wild VII (+6% gold and drops) | **57** Ward XIII (1.25% less damage taken) | **82** Ward XIX (1.25% less damage taken) |
| **8** Ward II (2.5% less damage taken) | **33** Kindled will VIII (+3% damage) | **58** Spoils of the wild XIII (+3% gold and drops) | **83** Spoils of the wild XIX (+3% gold and drops) |
| **9** Spoils of the wild II (+6% gold and drops) | **34** Focus VIII (+2% to hit) | **59** Kindled will XIV (+1.5% damage) | **84** Kindled will XX (+1.5% damage) |
| **10** Wield Bronze staves | **35** Ward VIII (2.5% less damage taken) | **60** Focus XIV (+1% to hit) | **85** Wield Dawnsteel staves |
| **11** Kindled will III (+3% damage) | **36** Spoils of the wild VIII (+6% gold and drops) | **61** Ward XIV (1.25% less damage taken) | **86** Focus XX (+1% to hit) |
| **12** Focus III (+2% to hit) | **37** Kindled will IX (+3% damage) | **62** Spoils of the wild XIV (+3% gold and drops) | **87** Ward XX (1.25% less damage taken) |
| **13** Ward III (2.5% less damage taken) | **38** Focus IX (+2% to hit) | **63** Kindled will XV (+1.5% damage) | **88** Spoils of the wild XX (+3% gold and drops) |
| **14** Spoils of the wild III (+6% gold and drops) | **39** Ward IX (2.5% less damage taken) | **64** Focus XV (+1% to hit) | **89** Kindled will XXI (+1.5% damage) |
| **15** Kindled will IV (+3% damage) | **40** Wield Moonsilver staves; Master of magic (+8% damage) | **65** Ward XV (1.25% less damage taken) | **90** Focus XXI (+1% to hit) |
| **16** Focus IV (+2% to hit) | **41** Spoils of the wild IX (+3% gold and drops) | **66** Spoils of the wild XV (+3% gold and drops) | **91** Ward XXI (1.25% less damage taken) |
| **17** Ward IV (2.5% less damage taken) | **42** Kindled will X (+1.5% damage) | **67** Kindled will XVI (+1.5% damage) | **92** Spoils of the wild XXI (+3% gold and drops) |
| **18** Spoils of the wild IV (+6% gold and drops) | **43** Focus X (+1% to hit) | **68** Focus XVI (+1% to hit) | **93** Kindled will XXII (+1.5% damage) |
| **19** Kindled will V (+3% damage) | **44** Ward X (1.25% less damage taken) | **69** Ward XVI (1.25% less damage taken) | **94** Focus XXII (+1% to hit) |
| **20** Wield Iron staves | **45** Spoils of the wild X (+3% gold and drops) | **70** Wield Embersteel staves | **95** Ward XXII (1.25% less damage taken) |
| **21** Focus V (+2% to hit) | **46** Kindled will XI (+1.5% damage) | **71** Spoils of the wild XVI (+3% gold and drops) | **96** Spoils of the wild XXII (+3% gold and drops) |
| **22** Ward V (2.5% less damage taken) | **47** Focus XI (+1% to hit) | **72** Kindled will XVII (+1.5% damage) | **97** Kindled will XXIII (+1.5% damage) |
| **23** Spoils of the wild V (+6% gold and drops) | **48** Ward XI (1.25% less damage taken) | **73** Focus XVII (+1% to hit) | **98** Focus XXIII (+1% to hit) |
| **24** Kindled will VI (+3% damage) | **49** Spoils of the wild XI (+3% gold and drops) | **74** Ward XVII (1.25% less damage taken) | **99** Grandmaster of magic (+10% damage) |
| **25** Focus VI (+2% to hit) | **50** Kindled will XII (+1.5% damage) | **75** Spoils of the wild XVII (+3% gold and drops) |  |

### Hitpoints

| Levels 1–25 | Levels 26–50 | Levels 51–75 | Levels 76–99 |
| --- | --- | --- | --- |
| **1** Wear Copper armour; Foe: Hollow rat | **26** Toughness (+40 health) | **51** Toughness (+40 health) | **76** Toughness (+40 health) |
| **2** Foe: Goblin slinger; Toughness (+40 health) | **27** Foe: Hill troll; Toughness (+40 health) | **52** Toughness (+40 health) | **77** Toughness (+40 health) |
| **3** Foe: Marsh wisp; Toughness (+40 health) | **28** Toughness (+40 health) | **53** Toughness (+40 health) | **78** Toughness (+40 health) |
| **4** Toughness (+40 health) | **29** Toughness (+40 health) | **54** Toughness (+40 health) | **79** Toughness (+40 health) |
| **5** Second wind (health returns 25% faster); Toughness (+40 health) | **30** Wear Steel armour; Toughness (+40 health) | **55** Wear Star-iron armour; Foe: Mire hulk; Iron stomach II (food heals 7.5% more); Toughness (+40 health) | **80** Foe: Ash shaman; The vendor sells Warden's feast; Toughness (+40 health) |
| **6** Toughness (+40 health) | **31** Toughness (+40 health) | **56** Toughness (+40 health) | **81** Toughness (+40 health) |
| **7** Toughness (+40 health) | **32** Toughness (+40 health) | **57** Toughness (+40 health) | **82** Toughness (+40 health) |
| **8** Toughness (+40 health) | **33** Toughness (+40 health) | **58** Toughness (+40 health) | **83** Toughness (+40 health) |
| **9** Toughness (+40 health) | **34** Foe: Fell huntsman; Toughness (+40 health) | **59** Toughness (+40 health) | **84** Toughness (+40 health) |
| **10** Wear Bronze armour; The vendor sells Meat pie; Toughness (+40 health) | **35** Stubborn (retreat at 12% health instead of 20%); Toughness (+40 health) | **60** Foe: Fen reaver; The vendor sells Hunter's feast; Toughness (+40 health) | **85** Wear Dawnsteel armour; Foe: Obsidian golem; Second wind III (health returns 12.5% faster); Toughness (+40 health) |
| **11** Toughness (+40 health) | **36** Toughness (+40 health) | **61** Toughness (+40 health) | **86** Toughness (+40 health) |
| **12** Toughness (+40 health) | **37** Toughness (+40 health) | **62** Toughness (+40 health) | **87** Toughness (+40 health) |
| **13** Toughness (+40 health) | **38** Toughness (+40 health) | **63** Toughness (+40 health) | **88** Toughness (+40 health) |
| **14** Foe: Orc raider; Toughness (+40 health) | **39** Toughness (+40 health) | **64** Toughness (+40 health) | **89** Toughness (+40 health) |
| **15** Iron stomach (food heals 15% more); Toughness (+40 health) | **40** Wear Moonsilver armour; Foe: Bog lurker; The vendor sells Roast fowl; Unbowed (food heals 15% more); Toughness (+40 health) | **65** Foe: Bog witch; Field dressing II (health returns 12.5% faster); Toughness (+40 health) | **90** Foe: Sky reaver; Toughness (+40 health) |
| **16** Toughness (+40 health) | **41** Toughness (+40 health) | **66** Toughness (+40 health) | **91** Toughness (+40 health) |
| **17** Toughness (+40 health) | **42** Toughness (+40 health) | **67** Toughness (+40 health) | **92** Toughness (+40 health) |
| **18** Foe: Orc bowman; Toughness (+40 health) | **43** Toughness (+40 health) | **68** Toughness (+40 health) | **93** Toughness (+40 health) |
| **19** Toughness (+40 health) | **44** Foe: Reed stalker; Toughness (+40 health) | **69** Toughness (+40 health) | **94** Toughness (+40 health) |
| **20** Wear Iron armour; The vendor sells Hearty stew; Toughness (+40 health) | **45** Second wind II (health returns 12.5% faster); Toughness (+40 health) | **70** Wear Embersteel armour; Foe: Ash troll; Toughness (+40 health) | **95** Foe: Ember sorcerer; Field dressing III (health returns 12.5% faster); Toughness (+40 health) |
| **21** Toughness (+40 health) | **46** Toughness (+40 health) | **71** Toughness (+40 health) | **96** Toughness (+40 health) |
| **22** Foe: Grave wight; Toughness (+40 health) | **47** Toughness (+40 health) | **72** Toughness (+40 health) | **97** Toughness (+40 health) |
| **23** Toughness (+40 health) | **48** Toughness (+40 health) | **73** Toughness (+40 health) | **98** Toughness (+40 health) |
| **24** Toughness (+40 health) | **49** Foe: Drowned acolyte; Toughness (+40 health) | **74** Toughness (+40 health) | **99** Unbroken (food heals 20% more); Toughness (+40 health) |
| **25** Field dressing (health returns 25% faster); Toughness (+40 health) | **50** Toughness (+40 health) | **75** Foe: Peak slinger; Iron stomach III (food heals 7.5% more); Toughness (+40 health) |  |

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

```text
XP table (total XP to reach each level)
1: 0 · 2: 50 · 3: 150 · 4: 310 · 5: 520 · 6: 890 · 7: 1,490 · 8: 2,500 · 9: 4,170 · 10: 6,790 · 11: 10,400 · 12: 15,900 · 13: 23,800 · 14: 34,000 · 15: 46,800 · 16: 62,100 · 17: 79,900 · 18: 101,000 · 19: 126,000 · 20: 155,000 · 21: 202,000 · 22: 265,000 · 23: 340,000 · 24: 428,000 · 25: 531,000 · 26: 650,000 · 27: 790,000 · 28: 951,000 · 29: 1,140,000 · 30: 1,360,000 · 31: 1,650,000 · 32: 2,000,000 · 33: 2,430,000 · 34: 2,920,000 · 35: 3,500,000 · 36: 4,170,000 · 37: 4,950,000 · 38: 5,850,000 · 39: 6,900,000 · 40: 8,100,000 · 41: 9,310,000 · 42: 10,500,000 · 43: 11,700,000 · 44: 12,900,000 · 45: 14,100,000 · 46: 15,400,000 · 47: 16,600,000 · 48: 17,800,000 · 49: 19,000,000 · 50: 20,300,000 · 51: 21,500,000 · 52: 22,700,000 · 53: 23,900,000 · 54: 25,200,000 · 55: 26,400,000 · 56: 27,700,000 · 57: 28,900,000 · 58: 30,200,000 · 59: 31,400,000 · 60: 32,700,000 · 61: 33,900,000 · 62: 35,200,000 · 63: 36,400,000 · 64: 37,700,000 · 65: 38,900,000 · 66: 40,200,000 · 67: 41,500,000 · 68: 42,800,000 · 69: 44,000,000 · 70: 45,300,000 · 71: 46,600,000 · 72: 47,900,000 · 73: 49,100,000 · 74: 50,400,000 · 75: 51,700,000 · 76: 53,000,000 · 77: 54,300,000 · 78: 55,600,000 · 79: 56,900,000 · 80: 58,200,000 · 81: 59,500,000 · 82: 60,800,000 · 83: 62,100,000 · 84: 63,400,000 · 85: 64,800,000 · 86: 66,100,000 · 87: 67,400,000 · 88: 68,700,000 · 89: 70,000,000 · 90: 71,400,000 · 91: 72,700,000 · 92: 74,000,000 · 93: 75,400,000 · 94: 76,700,000 · 95: 78,000,000 · 96: 79,400,000 · 97: 80,700,000 · 98: 82,100,000 · 99: 83,400,000

Pacing for a skill kept in a lane (one active hour with the fire each day)
Woodcutting  L10 1.0 h (+0%)  L20 22.6 h (-6%)  L30 4.9 days (-3%)  L40 20.8 days (-1%)  L55 50.4 days (0%)  L70 73.6 days (+0%)  L85 91.9 days (+0%)  L99 105.7 days (0%)
PASS  Woodcutting level 10 within 25% of target
PASS  Woodcutting level 20 within 25% of target
PASS  Woodcutting level 30 within 25% of target
PASS  Woodcutting level 40 within 25% of target
PASS  Woodcutting level 55 within 25% of target
PASS  Woodcutting level 70 within 25% of target
PASS  Woodcutting level 85 within 25% of target
PASS  Woodcutting level 99 within 25% of target
Mining       L10 1.0 h (+0%)  L20 22.6 h (-6%)  L30 4.9 days (-3%)  L40 20.8 days (-1%)  L55 50.4 days (0%)  L70 73.6 days (+0%)  L85 91.9 days (+0%)  L99 105.7 days (0%)
PASS  Mining level 10 within 25% of target
PASS  Mining level 20 within 25% of target
PASS  Mining level 30 within 25% of target
PASS  Mining level 40 within 25% of target
PASS  Mining level 55 within 25% of target
PASS  Mining level 70 within 25% of target
PASS  Mining level 85 within 25% of target
PASS  Mining level 99 within 25% of target
Smithing     L10 1.0 h (+1%)  L20 23.1 h (-4%)  L30 5.2 days (+5%)  L40 23.1 days (+10%)  L55 55.9 days (+11%)  L70 81.9 days (+11%)  L85 102.6 days (+12%)  L99 118.5 days (+12%)
PASS  Smithing level 10 within 25% of target
PASS  Smithing level 20 within 25% of target
PASS  Smithing level 30 within 25% of target
PASS  Smithing level 40 within 25% of target
PASS  Smithing level 55 within 25% of target
PASS  Smithing level 70 within 25% of target
PASS  Smithing level 85 within 25% of target
PASS  Smithing level 99 within 25% of target
Melee        L10 1.2 h (+18%)  L20 25.7 h (+7%)  L30 5.5 days (+10%)  L40 20.3 days (-3%)  L55 47.9 days (-5%)  L70 72.7 days (-1%)  L85 93.7 days (+2%)  L99 111.2 days (+5%)
PASS  Melee level 10 within 25% of target
PASS  Melee level 20 within 25% of target
PASS  Melee level 30 within 25% of target
PASS  Melee level 40 within 25% of target
PASS  Melee level 55 within 25% of target
PASS  Melee level 70 within 25% of target
PASS  Melee level 85 within 25% of target
PASS  Melee level 99 within 25% of target
Archery      L10 1.2 h (+20%)  L20 24.8 h (+3%)  L30 5.0 days (-1%)  L40 21.5 days (+3%)  L55 52.2 days (+4%)  L70 76.6 days (+4%)  L85 97.6 days (+6%)  L99 115.0 days (+9%)
PASS  Archery level 10 within 25% of target
PASS  Archery level 20 within 25% of target
PASS  Archery level 30 within 25% of target
PASS  Archery level 40 within 25% of target
PASS  Archery level 55 within 25% of target
PASS  Archery level 70 within 25% of target
PASS  Archery level 85 within 25% of target
PASS  Archery level 99 within 25% of target
Magic        L10 1.2 h (+20%)  L20 26.9 h (+12%)  L30 5.3 days (+5%)  L40 21.3 days (+1%)  L55 50.0 days (-1%)  L70 74.6 days (+2%)  L85 95.8 days (+4%)  L99 113.2 days (+7%)
PASS  Magic level 10 within 25% of target
PASS  Magic level 20 within 25% of target
PASS  Magic level 30 within 25% of target
PASS  Magic level 40 within 25% of target
PASS  Magic level 55 within 25% of target
PASS  Magic level 70 within 25% of target
PASS  Magic level 85 within 25% of target
PASS  Magic level 99 within 25% of target
PASS  First level-up after 37.5 s of chopping (target under 1 minute)

Unlocks
PASS  Woodcutting: every level 1-99 unlocks something
PASS  Mining: every level 1-99 unlocks something
PASS  Smithing: every level 1-99 unlocks something
PASS  Melee: every level 1-99 unlocks something
PASS  Archery: every level 1-99 unlocks something
PASS  Magic: every level 1-99 unlocks something
PASS  Hitpoints: every level 1-99 unlocks something

Choices at each tier (XP an hour, mid-tier, against the best)
woodcutting tier 1: Pine tree 6046 · Old pine 5130 (+100% materials)
PASS  woodcutting tier 1 offers two choices within 20%
woodcutting tier 2: Ash tree 8604 · Old ash 7572 (+100% materials) · Pine tree mastered 7102
PASS  woodcutting tier 2 offers two choices within 20%
woodcutting tier 3: Oak tree 11653 · Old oak 10159 (+100% materials) · Ash tree mastered 10044
PASS  woodcutting tier 3 offers two choices within 20%
woodcutting tier 4: Yew tree 15600 · Old yew 13508 (+100% materials) · Oak tree mastered 13525
PASS  woodcutting tier 4 offers two choices within 20%
woodcutting tier 5: Maple tree 22919 · Old maple 19906 (+100% materials) · Yew tree mastered 18009
PASS  woodcutting tier 5 offers two choices within 20%
woodcutting tier 6: Silverbark tree 30448 · Old silverbark 26349 (+100% materials) · Maple tree mastered 26114
PASS  woodcutting tier 6 offers two choices within 20%
woodcutting tier 7: Elderwood tree 39820 · Old elderwood 34528 (+100% materials) · Silverbark tree mastered 34577
PASS  woodcutting tier 7 offers two choices within 20%
woodcutting tier 8: Ancient tree 50971 · Old ancient 44141 (+100% materials) · Elderwood tree mastered 45078
PASS  woodcutting tier 8 offers two choices within 20%
mining tier 1: Copper vein 6046 · Deep copper seam 5130 (+100% materials)
PASS  mining tier 1 offers two choices within 20%
mining tier 2: Tin vein 8604 · Deep tin seam 7572 (+100% materials) · Copper vein mastered 7102
PASS  mining tier 2 offers two choices within 20%
mining tier 3: Iron vein 11653 · Deep iron seam 10159 (+100% materials) · Tin vein mastered 10044
PASS  mining tier 3 offers two choices within 20%
mining tier 4: Coal vein 15600 · Deep coal seam 13508 (+100% materials) · Iron vein mastered 13525
PASS  mining tier 4 offers two choices within 20%
mining tier 5: Moonsilver vein 22919 · Deep moonsilver seam 19906 (+100% materials) · Coal vein mastered 18009
PASS  mining tier 5 offers two choices within 20%
mining tier 6: Star-iron vein 30448 · Deep star-iron seam 26349 (+100% materials) · Moonsilver vein mastered 26114
PASS  mining tier 6 offers two choices within 20%
mining tier 7: Ember vein 39820 · Deep ember seam 34528 (+100% materials) · Star-iron vein mastered 34577
PASS  mining tier 7 offers two choices within 20%
mining tier 8: Dawnstone vein 50971 · Deep dawnstone seam 44141 (+100% materials) · Ember vein mastered 45078
PASS  mining tier 8 offers two choices within 20%
PASS  Mastery pays: at woodcutting 11, Pine tree (mastery 8) earns 90% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 15, Old pine (mastery 8) earns 86% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 20, Ash tree (mastery 7) earns 92% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 24, Old ash (mastery 7) earns 92% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 30, Oak tree (mastery 9) earns 96% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 34, Old oak (mastery 6) earns 90% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 40, Yew tree (mastery 10) earns 88% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 44, Old yew (mastery 6) earns 81% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 50, Maple tree (mastery 10) earns 124% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 54, Old maple (mastery 6) earns 115% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 65, Silverbark tree (mastery 10) earns 124% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 69, Old silverbark (mastery 5) earns 112% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 80, Elderwood tree (mastery 10) earns 123% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 84, Old elderwood (mastery 5) earns 111% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 95, Ancient tree (mastery 10) earns 122% of the best fresh action of its kind
PASS  Mastery pays: at woodcutting 99, Old ancient (mastery 5) earns 111% of the best fresh action of its kind
PASS  Mastery pays: at mining 11, Copper vein (mastery 8) earns 90% of the best fresh action of its kind
PASS  Mastery pays: at mining 15, Deep copper seam (mastery 8) earns 86% of the best fresh action of its kind
PASS  Mastery pays: at mining 20, Tin vein (mastery 7) earns 92% of the best fresh action of its kind
PASS  Mastery pays: at mining 24, Deep tin seam (mastery 7) earns 92% of the best fresh action of its kind
PASS  Mastery pays: at mining 30, Iron vein (mastery 9) earns 96% of the best fresh action of its kind
PASS  Mastery pays: at mining 34, Deep iron seam (mastery 6) earns 90% of the best fresh action of its kind
PASS  Mastery pays: at mining 40, Coal vein (mastery 10) earns 88% of the best fresh action of its kind
PASS  Mastery pays: at mining 44, Deep coal seam (mastery 6) earns 81% of the best fresh action of its kind
PASS  Mastery pays: at mining 50, Moonsilver vein (mastery 10) earns 124% of the best fresh action of its kind
PASS  Mastery pays: at mining 54, Deep moonsilver seam (mastery 6) earns 115% of the best fresh action of its kind
PASS  Mastery pays: at mining 65, Star-iron vein (mastery 10) earns 124% of the best fresh action of its kind
PASS  Mastery pays: at mining 69, Deep star-iron seam (mastery 5) earns 112% of the best fresh action of its kind
PASS  Mastery pays: at mining 80, Ember vein (mastery 10) earns 123% of the best fresh action of its kind
PASS  Mastery pays: at mining 84, Deep ember seam (mastery 5) earns 111% of the best fresh action of its kind
PASS  Mastery pays: at mining 95, Dawnstone vein (mastery 10) earns 122% of the best fresh action of its kind
PASS  Mastery pays: at mining 99, Deep dawnstone seam (mastery 5) earns 111% of the best fresh action of its kind
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
Bog lurker      melee    melee eve 21443 xp 15 food Fair | archery dis 17609 xp 23 food Fair | magic adv 25309 xp 9 food Fair
PASS  Bog lurker: magic wins, archery loses
Reed stalker    archery  melee adv 25443 xp 10 food Fair | archery eve 21652 xp 15 food Fair | magic dis 17701 xp 22 food Fair
PASS  Reed stalker: melee wins, magic loses
Drowned acolyte magic    melee dis 20335 xp 23 food Fair | archery adv 29410 xp 10 food Fair | magic eve 24609 xp 17 food Fair
PASS  Drowned acolyte: archery wins, melee loses
Mire hulk       melee    melee eve 25488 xp 16 food Fair | archery dis 21089 xp 23 food Fair | magic adv 30984 xp 9 food Fair
PASS  Mire hulk: magic wins, archery loses
Fen reaver      archery  melee adv 33570 xp 9 food Fair | archery eve 27922 xp 15 food Fair | magic dis 22835 xp 22 food Fair
PASS  Fen reaver: melee wins, magic loses
Bog witch       magic    melee dis 24075 xp 21 food Fair | archery adv 34550 xp 10 food Fair | magic eve 28735 xp 16 food Fair
PASS  Bog witch: archery wins, melee loses
Ash troll       melee    melee eve 30763 xp 16 food Fair | archery dis 25091 xp 22 food Fair | magic adv 36390 xp 10 food Fair
PASS  Ash troll: magic wins, archery loses
Peak slinger    archery  melee adv 40662 xp 10 food Fair | archery eve 33882 xp 16 food Fair | magic dis 27784 xp 22 food Fair
PASS  Peak slinger: melee wins, magic loses
Ash shaman      magic    melee dis 28475 xp 21 food Fair | archery adv 42021 xp 10 food Fair | magic eve 34730 xp 16 food Fair
PASS  Ash shaman: archery wins, melee loses
Obsidian golem  melee    melee eve 37495 xp 16 food Fair | archery dis 30522 xp 22 food Fair | magic adv 45187 xp 10 food Fair
PASS  Obsidian golem: magic wins, archery loses
Sky reaver      archery  melee adv 47575 xp 10 food Fair | archery eve 38794 xp 16 food Fair | magic dis 32146 xp 21 food Fair
PASS  Sky reaver: melee wins, magic loses
Ember sorcerer  magic    melee dis 33714 xp 22 food Fair | archery adv 49551 xp 10 food Fair | magic eve 40880 xp 16 food Fair
PASS  Ember sorcerer: archery wins, melee loses
Combat level 7: magic vs Hollow rat 5377 · archery vs Marsh wisp 5182
PASS  Combat tier 1 offers two choices (style or target) within 20%
Combat level 16: magic vs Orc raider 8174 · melee vs Orc raider 7009
PASS  Combat tier 2 offers two choices (style or target) within 20%
Combat level 26: archery vs Grave wight 14003 · magic vs Grave wight 11857
PASS  Combat tier 3 offers two choices (style or target) within 20%
Combat level 36: melee vs Fell huntsman 21075 · magic vs Hill troll 18098
PASS  Combat tier 4 offers two choices (style or target) within 20%
Combat level 48: melee vs Reed stalker 29330 · magic vs Bog lurker 29314
PASS  Combat tier 5 offers two choices (style or target) within 20%
Combat level 63: melee vs Fen reaver 34859 · magic vs Mire hulk 34259
PASS  Combat tier 6 offers two choices (style or target) within 20%
Combat level 78: melee vs Peak slinger 42787 · magic vs Ash troll 40153
PASS  Combat tier 7 offers two choices (style or target) within 20%
Combat level 93: melee vs Sky reaver 47267 · magic vs Obsidian golem 45325
PASS  Combat tier 8 offers two choices (style or target) within 20%

Notable events in an hour of active play (four lanes with the fire, three short goals)
First hour  levels W1 M1 S1 magic1 HP1: one moment every 0.8 min on average; longest gap 3.2 min (worst of 60 runs 4.1)
            per hour: level 41.1, uncommon 29.3, mastery 13.0, rare 3.1, goal 16.4, legendary 0.3
PASS  First hour: never more than 5 minutes without one
PASS  First hour: a rare find in 100% of fresh players
Day 2       levels W20 M20 S20 magic19 HP19: one moment every 1.6 min on average; longest gap 4.1 min (worst of 60 runs 4.2)
            per hour: uncommon 15.2, mastery 9.0, rare 1.4, goal 14.2, legendary 0.2
PASS  Day 2: a notable moment about every 2 minutes
PASS  Day 2: never more than 5 minutes without one
Day 5       levels W28 M28 S28 magic27 HP27: one moment every 1.8 min on average; longest gap 4.1 min (worst of 60 runs 4.2)
            per hour: uncommon 16.6, mastery 2.0, rare 1.7, goal 14.2, legendary 0.2
PASS  Day 5: a notable moment about every 2 minutes
PASS  Day 5: never more than 5 minutes without one
Day 14      levels W36 M36 S35 magic36 HP36: one moment every 2.0 min on average; longest gap 4.1 min (worst of 60 runs 4.3)
            per hour: uncommon 15.1, rare 1.6, goal 14.2, legendary 0.2
PASS  Day 14: a notable moment about every 2 minutes
PASS  Day 14: never more than 5 minutes without one
Day 21      levels W39 M39 S38 magic39 HP39: one moment every 2.0 min on average; longest gap 4.1 min (worst of 60 runs 4.2)
            per hour: uncommon 15.4, rare 1.7, goal 14.2, legendary 0.2
PASS  Day 21: a notable moment about every 2 minutes
PASS  Day 21: never more than 5 minutes without one
Day 60      levels W60 M60 S56 magic60 HP60: one moment every 2.2 min on average; longest gap 4.2 min (worst of 60 runs 4.3)
            per hour: uncommon 12.3, rare 1.4, goal 14.2, legendary 0.1
PASS  Day 60: a notable moment about every 2 minutes
PASS  Day 60: never more than 5 minutes without one
Day 100     levels W92 M92 S82 magic87 HP87: one moment every 2.3 min on average; longest gap 4.2 min (worst of 60 runs 4.4)
            per hour: uncommon 11.3, rare 1.2, goal 14.2, legendary 0.1
PASS  Day 100: a notable moment about every 2 minutes
PASS  Day 100: never more than 5 minutes without one

The away recap after 8 hours (three lanes, no fire)
PASS  Day 2: the recap holds at least 24 good things (target 3)
PASS  Day 5: the recap holds at least 8 good things (target 3)
PASS  Day 14: the recap holds at least 6 good things (target 3)
PASS  Day 21: the recap holds at least 4 good things (target 3)
PASS  Day 60: the recap holds at least 3 good things (target 3)
PASS  Day 100: the recap holds at least 3 good things (target 3)

The fire
PASS  An hour with the fire earns 1.54x the XP of an hour away (target 1.5x; +15% XP and a second Gathering lane)

First crafted gear
PASS  A fresh player wears a Copper sword after about 2 minutes (target under 15)

Gold: does a day pay for a day of food and the next Storehouse enlargement?
Day 1   income 79,196 · food 4,716 (6%) · enlargement 1 costs 40,000
PASS  Day 1: a day's gold covers a day of food and enlargement 1
Day 2   income 140,940 · food 0 (0%) · enlargement 2 costs 90,000
PASS  Day 2: a day's gold covers a day of food and enlargement 2
Day 3   income 169,352 · food 36,119 (21%) · enlargement 3 costs 100,000
PASS  Day 3: a day's gold covers a day of food and enlargement 3
Day 5   income 175,705 · food 21,628 (12%) · enlargement 4 costs 120,000
PASS  Day 5: a day's gold covers a day of food and enlargement 4
Day 7   income 337,365 · food 9,611 (3%) · enlargement 5 costs 180,000
PASS  Day 7: a day's gold covers a day of food and enlargement 5
Day 10  income 343,946 · food 2,567 (1%) · enlargement 6 costs 200,000
PASS  Day 10: a day's gold covers a day of food and enlargement 6
Day 14  income 354,398 · food 1,414 (0%) · enlargement 7 costs 230,000
PASS  Day 14: a day's gold covers a day of food and enlargement 7
Day 18  income 361,255 · food 0 (0%) · enlargement 8 costs 250,000
PASS  Day 18: a day's gold covers a day of food and enlargement 8
Day 25  income 436,364 · food 39,367 (9%) · enlargement 9 costs 280,000
PASS  Day 25: a day's gold covers a day of food and enlargement 9
Day 35  income 453,328 · food 18,108 (4%) · enlargement 10 costs 300,000
PASS  Day 35: a day's gold covers a day of food and enlargement 10
Day 45  income 489,182 · food 3,851 (1%) · enlargement 11 costs 340,000
PASS  Day 45: a day's gold covers a day of food and enlargement 11
Day 60  income 687,887 · food 46,796 (7%) · enlargement 12 costs 450,000
PASS  Day 60: a day's gold covers a day of food and enlargement 12
Day 75  income 750,262 · food 91,904 (12%) · enlargement 13 costs 460,000
PASS  Day 75: a day's gold covers a day of food and enlargement 13
Day 90  income 964,805 · food 38,669 (4%) · enlargement 14 costs 650,000
PASS  Day 90: a day's gold covers a day of food and enlargement 14
Costs at 70% of each day's net gold would be: 50000, 100000, 95000, 110000, 230000, 240000, 245000, 255000, 280000, 305000, 340000, 450000, 460000, 650000

Supply: can mining keep the forge fed?
Tier 1: smelting without pause needs mining 69% of the time on a fresh vein, 42% on a mastered deep seam
Tier 2: smelting without pause needs mining 63% of the time on a fresh vein, 39% on a mastered deep seam
Tier 3: smelting without pause needs mining 58% of the time on a fresh vein, 36% on a mastered deep seam
Tier 4: smelting without pause needs mining 53% of the time on a fresh vein, 33% on a mastered deep seam
Tier 5: smelting without pause needs mining 47% of the time on a fresh vein, 30% on a mastered deep seam
Tier 6: smelting without pause needs mining 45% of the time on a fresh vein, 28% on a mastered deep seam
Tier 7: smelting without pause needs mining 42% of the time on a fresh vein, 27% on a mastered deep seam
Tier 8: smelting without pause needs mining 39% of the time on a fresh vein, 25% on a mastered deep seam
```
