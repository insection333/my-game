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

| Level | XP | Level | XP | Level | XP | Level | XP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 | 26 | 650,000 | 51 | 21,459,000 | 76 | 52,935,000 |
| 2 | 50 | 27 | 790,000 | 52 | 22,688,000 | 77 | 54,227,000 |
| 3 | 150 | 28 | 951,000 | 53 | 23,920,000 | 78 | 55,522,000 |
| 4 | 310 | 29 | 1,140,000 | 54 | 25,154,000 | 79 | 56,819,000 |
| 5 | 520 | 30 | 1,360,000 | 55 | 26,391,000 | 80 | 58,119,000 |
| 6 | 890 | 31 | 1,650,000 | 56 | 27,630,000 | 81 | 59,421,000 |
| 7 | 1,490 | 32 | 2,000,000 | 57 | 28,871,000 | 82 | 60,726,000 |
| 8 | 2,500 | 33 | 2,430,000 | 58 | 30,115,000 | 83 | 62,034,000 |
| 9 | 4,170 | 34 | 2,920,000 | 59 | 31,361,000 | 84 | 63,344,000 |
| 10 | 6,790 | 35 | 3,500,000 | 60 | 32,610,000 | 85 | 64,657,000 |
| 11 | 10,400 | 36 | 4,170,000 | 61 | 33,861,000 | 86 | 65,973,000 |
| 12 | 15,900 | 37 | 4,950,000 | 62 | 35,115,000 | 87 | 67,291,000 |
| 13 | 23,800 | 38 | 5,850,000 | 63 | 36,371,000 | 88 | 68,612,000 |
| 14 | 34,000 | 39 | 6,900,000 | 64 | 37,630,000 | 89 | 69,935,000 |
| 15 | 46,800 | 40 | 8,100,000 | 65 | 38,891,000 | 90 | 71,261,000 |
| 16 | 62,100 | 41 | 9,302,000 | 66 | 40,155,000 | 91 | 72,590,000 |
| 17 | 79,900 | 42 | 10,507,000 | 67 | 41,422,000 | 92 | 73,921,000 |
| 18 | 101,000 | 43 | 11,714,000 | 68 | 42,691,000 | 93 | 75,255,000 |
| 19 | 126,000 | 44 | 12,924,000 | 69 | 43,963,000 | 94 | 76,592,000 |
| 20 | 155,000 | 45 | 14,136,000 | 70 | 45,237,000 | 95 | 77,931,000 |
| 21 | 202,000 | 46 | 15,350,000 | 71 | 46,514,000 | 96 | 79,273,000 |
| 22 | 265,000 | 47 | 16,567,000 | 72 | 47,793,000 | 97 | 80,618,000 |
| 23 | 340,000 | 48 | 17,786,000 | 73 | 49,075,000 | 98 | 81,965,000 |
| 24 | 428,000 | 49 | 19,008,000 | 74 | 50,359,000 | 99 | 83,315,000 |
| 25 | 531,000 | 50 | 20,232,000 | 75 | 51,646,000 |  |  |

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
| Perch shallows | Fishing | 1 | 7.5 | 11 | Perch ×1 | 1 each |
| Deep perch pool | Fishing | 5 | 11.25 | 14 | Perch ×2 | 1 each |
| Trout shallows | Fishing | 10 | 12.5 | 25 | Trout ×1 | 2 each |
| Deep trout pool | Fishing | 14 | 18.75 | 33 | Trout ×2 | 2 each |
| Pike shallows | Fishing | 20 | 20 | 52 | Pike ×1 | 6 each |
| Deep pike pool | Fishing | 24 | 30 | 68 | Pike ×2 | 6 each |
| Salmon shallows | Fishing | 30 | 26 | 87 | Salmon ×1 | 14 each |
| Deep salmon pool | Fishing | 34 | 39 | 113 | Salmon ×2 | 14 each |
| Moon carp shallows | Fishing | 40 | 30 | 142 | Moon carp ×1 | 28 each |
| Deep moon carp pool | Fishing | 44 | 45 | 185 | Moon carp ×2 | 28 each |
| Silver eel shallows | Fishing | 55 | 34 | 208 | Silver eel ×1 | 46 each |
| Deep silver eel pool | Fishing | 59 | 51 | 270 | Silver eel ×2 | 46 each |
| Ember char shallows | Fishing | 70 | 38 | 296 | Ember char ×1 | 72 each |
| Deep ember char pool | Fishing | 74 | 57 | 385 | Ember char ×2 | 72 each |
| Dawn sturgeon shallows | Fishing | 85 | 42 | 408 | Dawn sturgeon ×1 | 108 each |
| Deep dawn sturgeon pool | Fishing | 89 | 63 | 530 | Dawn sturgeon ×2 | 108 each |
| Spark stone | Runecraft | 1 | 7.5 | 11 | Spark rune ×8 | 0 each |
| Ancient spark stone | Runecraft | 5 | 11.25 | 14 | Spark rune ×16 | 0 each |
| Gale stone | Runecraft | 10 | 12.5 | 25 | Gale rune ×8 | 0 each |
| Ancient gale stone | Runecraft | 14 | 18.75 | 33 | Gale rune ×16 | 0 each |
| Tide stone | Runecraft | 20 | 20 | 52 | Tide rune ×8 | 2 each |
| Ancient tide stone | Runecraft | 24 | 30 | 68 | Tide rune ×16 | 2 each |
| Earth stone | Runecraft | 30 | 26 | 87 | Earth rune ×8 | 4 each |
| Ancient earth stone | Runecraft | 34 | 39 | 113 | Earth rune ×16 | 4 each |
| Moon stone | Runecraft | 40 | 30 | 142 | Moon rune ×8 | 8 each |
| Ancient moon stone | Runecraft | 44 | 45 | 185 | Moon rune ×16 | 8 each |
| Star stone | Runecraft | 55 | 34 | 208 | Star rune ×8 | 13 each |
| Ancient star stone | Runecraft | 59 | 51 | 270 | Star rune ×16 | 13 each |
| Ember stone | Runecraft | 70 | 38 | 296 | Ember rune ×8 | 20 each |
| Ancient ember stone | Runecraft | 74 | 57 | 385 | Ember rune ×16 | 20 each |
| Dawn stone | Runecraft | 85 | 42 | 408 | Dawn rune ×8 | 30 each |
| Ancient dawn stone | Runecraft | 89 | 63 | 530 | Dawn rune ×16 | 30 each |

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

### Cooking

Cooking is the Artisan lane's second skill. Each tier's fish is cooked two at a time over one of that tier's logs; from tier 3 a pie or a stew mixes the tier's fish with the one before (the older catch keeps its use), two at a time. Every recipe pays its tier's XP an hour, as Smithing's do.

Cooked food heals about half the health a fighter has at its tier: the most a meal, eaten below half health, never wastes. A dish heals a quarter more. It sells for what went into it, and for that worth it heals at least 1.2 times what the vendor's food heals for its price from tier 2 on, so feeding yourself is a real choice. One Gathering lane fishing, with the fire's second lane chopping about half the time, keeps the Artisan lane cooking.

*Generated:*

| Dish | Level | Takes | Makes | Seconds | XP | Heals | Sells for | Heals per gold of worth |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cooked perch | 1 | Perch ×2, Pine logs ×1 | 2 | 22.5 | 34 | 150 | 2 | 75.0 |
| Cooked trout | 10 | Trout ×2, Ash logs ×1 | 2 | 37.5 | 75 | 330 | 4 | 82.5 |
| Cooked pike | 20 | Pike ×2, Oak logs ×1 | 2 | 60 | 155 | 530 | 13 | 40.8 |
| Pike pie | 25 | Pike ×1, Trout ×1, Oak logs ×1 | 2 | 60 | 155 | 660 | 11 | 60.0 |
| Cooked salmon | 30 | Salmon ×2, Yew logs ×1 | 2 | 78 | 260 | 730 | 32 | 22.8 |
| Salmon stew | 35 | Salmon ×1, Pike ×1, Yew logs ×1 | 2 | 78 | 260 | 910 | 28 | 32.5 |
| Cooked moon carp | 40 | Moon carp ×2, Maple logs ×1 | 2 | 90 | 425 | 930 | 63 | 14.8 |
| Carp pie | 45 | Moon carp ×1, Salmon ×1, Maple logs ×1 | 2 | 90 | 425 | 1,160 | 56 | 20.7 |
| Cooked silver eel | 55 | Silver eel ×2, Silverbark logs ×1 | 2 | 102 | 623 | 1,230 | 104 | 11.8 |
| Eel stew | 60 | Silver eel ×1, Moon carp ×1, Silverbark logs ×1 | 2 | 102 | 623 | 1,540 | 95 | 16.2 |
| Cooked ember char | 70 | Ember char ×2, Elderwood logs ×1 | 2 | 114 | 887 | 1,530 | 162 | 9.4 |
| Char pie | 75 | Ember char ×1, Silver eel ×1, Elderwood logs ×1 | 2 | 114 | 887 | 1,910 | 149 | 12.8 |
| Cooked dawn sturgeon | 85 | Dawn sturgeon ×2, Ancient logs ×1 | 2 | 126 | 1225 | 1,830 | 243 | 7.5 |
| Sturgeon stew | 90 | Dawn sturgeon ×1, Ember char ×1, Ancient logs ×1 | 2 | 126 | 1225 | 2,290 | 225 | 10.2 |

### Supplies: whetstones, arrows and runes

Each style has a supply: Melee takes whetstones (Smithing, from a bar), Archery takes arrows (Fletching, the Artisan lane's third skill, from a bar and a log) and Magic takes runes (Runecraft). Whetstones and arrows come 25 at a time. A fighter uses the best supply of their style that their level allows, one per foe fought, without being asked, as they eat; with none carried they fight as before. A supply adds damage by its tier, from +5% to +20%, and every style has its supply at every tier, so the triangle holds (section 15). A supply pays for itself: the extra gold and the extra XP (counted at what an hour of the tier's gathering pays for its XP) are worth more than the supplies used. Supplies of the first two tiers sell for nothing; whetstones and keys open with their tier's bar, so Smithing's perks stay where they were.

*Generated:*

| Tier | Damage | Melee | Archery | Magic | Its stones need |
| --- | --- | --- | --- | --- | --- |
| 1 | +5% | Copper whetstones (0 each) | Copper arrows (0 each) | Spark rune (0 each) | nothing |
| 2 | +7% | Bronze whetstones (0 each) | Bronze arrows (0 each) | Gale rune (0 each) | Bronze key |
| 3 | +9% | Iron whetstones (1 each) | Iron arrows (2 each) | Tide rune (2 each) | Iron key |
| 4 | +11% | Steel whetstones (4 each) | Steel arrows (5 each) | Earth rune (4 each) | Steel key |
| 5 | +13% | Moonsilver whetstones (5 each) | Moonsilver arrows (7 each) | Moon rune (8 each) | Moonsilver key |
| 6 | +15% | Star-iron whetstones (8 each) | Star-iron arrows (13 each) | Star rune (13 each) | Star-iron key |
| 7 | +17% | Embersteel whetstones (11 each) | Embersteel arrows (19 each) | Ember rune (20 each) | Embersteel key |
| 8 | +20% | Dawnsteel whetstones (19 each) | Dawnsteel arrows (30 each) | Dawn rune (30 each) | Dawnsteel key |

| Recipe | Skill | Level | Takes | Makes | Seconds | XP | Sells for (each) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Copper whetstones | Smithing | 1 | Copper bar ×1 | 25 | 7.5 | 11 | 0 |
| Bronze whetstones | Smithing | 10 | Bronze bar ×1 | 25 | 12.5 | 25 | 0 |
| Bronze key | Smithing | 10 | Bronze bar ×2 | 1 | 25 | 50 | 20 |
| Iron whetstones | Smithing | 20 | Iron bar ×1 | 25 | 20 | 52 | 1 |
| Iron key | Smithing | 20 | Iron bar ×2 | 1 | 40 | 103 | 101 |
| Steel whetstones | Smithing | 30 | Steel bar ×1 | 25 | 26 | 87 | 4 |
| Steel key | Smithing | 30 | Steel bar ×2 | 1 | 52 | 173 | 269 |
| Moonsilver whetstones | Smithing | 40 | Moonsilver bar ×1 | 25 | 30 | 142 | 5 |
| Moonsilver key | Smithing | 40 | Moonsilver bar ×2 | 1 | 60 | 283 | 328 |
| Star-iron whetstones | Smithing | 55 | Star-iron bar ×1 | 25 | 34 | 208 | 8 |
| Star-iron key | Smithing | 55 | Star-iron bar ×2 | 1 | 68 | 416 | 582 |
| Embersteel whetstones | Smithing | 70 | Embersteel bar ×1 | 25 | 38 | 296 | 11 |
| Embersteel key | Smithing | 70 | Embersteel bar ×2 | 1 | 76 | 591 | 801 |
| Dawnsteel whetstones | Smithing | 85 | Dawnsteel bar ×1 | 25 | 42 | 408 | 19 |
| Dawnsteel key | Smithing | 85 | Dawnsteel bar ×2 | 1 | 84 | 817 | 1310 |
| Copper arrows | Fletching | 1 | Copper bar ×1, Pine logs ×1 | 25 | 15 | 23 | 0 |
| Bronze arrows | Fletching | 10 | Bronze bar ×1, Ash logs ×1 | 25 | 25 | 50 | 0 |
| Iron arrows | Fletching | 20 | Iron bar ×1, Oak logs ×1 | 25 | 40 | 103 | 2 |
| Steel arrows | Fletching | 30 | Steel bar ×1, Yew logs ×1 | 25 | 52 | 173 | 5 |
| Moonsilver arrows | Fletching | 40 | Moonsilver bar ×1, Maple logs ×1 | 25 | 60 | 283 | 7 |
| Star-iron arrows | Fletching | 55 | Star-iron bar ×1, Silverbark logs ×1 | 25 | 68 | 416 | 13 |
| Embersteel arrows | Fletching | 70 | Embersteel bar ×1, Elderwood logs ×1 | 25 | 76 | 591 | 19 |
| Dawnsteel arrows | Fletching | 85 | Dawnsteel bar ×1, Ancient logs ×1 | 25 | 84 | 817 | 30 |

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
| Fishing | Pearl mussel · River pearl | Message in a bottle · Drowned signet | Scale of the deep · Fen-king's crown |
| Cooking | Wild herbs · Saffron threads | Grandmother's recipe · Silver ladle | Ever-warm pot · Cauldron of plenty |
| Fletching | Heron quill · Hawk feather | Fletcher's knife · Waxed bowstring | Arrow of the first hunt · Quiver of the wild hunt |
| Runecraft | Chalk stub · Cracked rune | Seer's stone · Rubbing of a lost rune | Rune of the old kings · Star chart of the ancients |
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

Bought from the vendor, or cooked (section 6): better food is sold as Hitpoints rises, and the vendor keeps selling it whatever you cook, as a fallback. A fighter eats the most healing food carried first, cooked or bought. *Generated:*

| Food | Heals | Price | Sold from Hitpoints |
| --- | --- | --- | --- |
| Bread | 140 | 20 | 1 |
| Meat pie | 320 | 50 | 10 |
| Hearty stew | 600 | 110 | 20 |
| Roast fowl | 1,000 | 190 | 40 |
| Hunter's feast | 1,600 | 320 | 60 |
| Warden's feast | 2,300 | 480 | 80 |

### Expeditions and bosses (step 16)

An expedition is a run into a region for 1, 2, 4 or 8 hours in the Combat lane, played while you are here or away. Each hour holds six fight stages of ten minutes, each against one of the three strongest foes of the region your Hitpoints level has opened, drawn for that stage; a cache of the region's best logs, ore or fish after one stage and a camp that heals after another, at drawn places; one or two twists that hold for the whole run (a second twist two runs in five); and a fork halfway, whose two roads are drawn with the route and one chosen before setting out. The region's boss waits at the end. Retreating ends the run where it stands: what was won is kept, the boss is not reached.

Fight stages pay as the lane does, and each pays a mark; caches and the boss pay on top, so a run of any length pays at least as well as the same time against the region's best foe (section 15), and only runs and bosses give marks and boss finds. Each boss can also be fought once a day in the Combat lane. Marks buy relics, lasting boosts in ranks: +1% XP in one skill a rank (one relic for each skill), food heals 4% more a rank, finds 4% more likely a rank (five ranks each), and six more Storehouse spaces a rank (three ranks). *Generated:*

| Boss | Region | Style | Level | Hitpoints opens | Health | Max hit | Gold | Marks | Cache worth |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| The Troll-chief of the hill | The march | melee | 40 | 37 | 4,200 | 198 | 2,500 | 5 | 4,800 |
| The Drowned Warden | The Sunken Fen | archery | 70 | 68 | 8,800 | 468 | 12,000 | 10 | 7,200 |
| The Ember Wyrm | The Ashen Peaks | magic | 100 | 98 | 16,200 | 945 | 30,000 | 15 | 12,000 |

Each win: a Rare boss find 1 in 12, a Legendary 1 in 80. Relic ranks cost 10, 25, 50, 90, 150 marks.

| Twist | Changes |
| --- | --- |
| fog | hits land 90% as often; finds 2 times as likely |
| wolves | food heals 75%; drops ×1.5 |
| old-roads | 75% of the fight stages |
| warband | foes hit 115% as hard; marks ×1.5 |
| caravans | caches ×1.5; the boss's health ×1.25 |
| storm | camps heal 50%; XP ×1.1 |

| Road at the fork | Changes the second half |
| --- | --- |
| high-pass | foes hit 110% as hard; caches ×2 |
| low-road | foes hit 90% as hard; marks ×0.75 |
| old-shrine | finds 2 times as likely |
| hunters-trail | drops ×1.5 |
| wardens-gate | marks ×1.5; the boss's health ×1.2 |

## 10. Gold and the Storehouse

- **Sources:** selling logs, ores, bars, gear and Uncommon and Rare finds to the vendor; gold and drops from foes.
- **Sinks:** food, and Storehouse enlargements. Gear is made, never bought.
- **The Storehouse** holds stacks of any size; slots limit the number of different items. Starts with 24 slots; each enlargement adds 6. Costs: 40,000, 90,000, 100,000, 120,000, 180,000, 200,000, 230,000, 250,000, 280,000, 300,000, 340,000, 450,000, 460,000, 650,000, 700,000, 750,000, 800,000, 850,000, 900,000, 925,000, 950,000, 975,000, 1,000,000, 1,000,000, 1,000,000 gold. There are 171 kinds of item (32 resources, 24 supplies, 7 keys, 48 gear, 20 foods, 40 sellable finds), so the last enlargement (174 slots) fits them all.
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

### Deeds and honours (step 15)

Deeds are feats done in the course of play, made from the game's own content so that every skill, foe and find added later brings its deeds with it: each skill's levels from 10 to 99 and the ranks; work done and mastery in every skill with actions; fights won against each foe, every region cleared, a tier of gear worn in every slot; each Legendary find, each skill's page of the log and the log's totals; the fire kept burning, gold held, the Storehouse enlarged; and five hidden deeds whose words appear only once done. Each is easy, hard, elite or master, worth 5, 15, 40 or 100 deed points. A deed's words are its family's strings filled with its own numbers, so they can never disagree with what it asks, and the tests prove that a player who has done everything has done every deed.

Points open six titles from Wayfarer (100 points) to the Mythic (7,500 of the 8,000 or so there are), four frames for the Hearth's plaque, and one banner; particular deeds open the rest: a title for 99 in each skill and for the whole log, 100,000 fights won, the Ashen Peaks cleared and more, and a banner's colour for each region cleared. Your title shows beside your name on every ladder and on your plaque; your banner on both. A deed done has its moment, sized by its tier. How fast deeds come over a year is measured by the year-long simulation (step 18).

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

### Fishing

| Levels 1–25 | Levels 26–50 | Levels 51–75 | Levels 76–99 |
| --- | --- | --- | --- |
| **1** Perch shallows | **26** Practised hands V (mastery 6% faster) | **51** Quick cast XI (1.25% faster) | **76** Plenty XVI (+1.5% chance of an extra item) |
| **2** Quick cast I (2.5% faster) | **27** Quick cast VI (2.5% faster) | **52** Plenty XI (+1.5% chance of an extra item) | **77** Angler's eye XVI (Rare and Legendary finds 4% likelier) |
| **3** Plenty I (+3% chance of an extra item) | **28** Plenty VI (+3% chance of an extra item) | **53** Angler's eye XI (Rare and Legendary finds 4% likelier) | **78** Practised hands XVI (mastery 3% faster) |
| **4** Angler's eye I (Rare and Legendary finds 8% likelier) | **29** Angler's eye VI (Rare and Legendary finds 8% likelier) | **54** Practised hands XI (mastery 3% faster) | **79** Quick cast XVII (1.25% faster) |
| **5** Deep perch pool | **30** Salmon shallows | **55** Silver eel shallows | **80** Plenty XVII (+1.5% chance of an extra item) |
| **6** Practised hands I (mastery 6% faster) | **31** Practised hands VI (mastery 6% faster) | **56** Quick cast XII (1.25% faster) | **81** Angler's eye XVII (Rare and Legendary finds 4% likelier) |
| **7** Quick cast II (2.5% faster) | **32** Quick cast VII (2.5% faster) | **57** Plenty XII (+1.5% chance of an extra item) | **82** Practised hands XVII (mastery 3% faster) |
| **8** Plenty II (+3% chance of an extra item) | **33** Plenty VII (+3% chance of an extra item) | **58** Angler's eye XII (Rare and Legendary finds 4% likelier) | **83** Quick cast XVIII (1.25% faster) |
| **9** Angler's eye II (Rare and Legendary finds 8% likelier) | **34** Deep salmon pool | **59** Deep silver eel pool | **84** Plenty XVIII (+1.5% chance of an extra item) |
| **10** Trout shallows | **35** Angler's eye VII (Rare and Legendary finds 8% likelier) | **60** Practised hands XII (mastery 3% faster) | **85** Dawn sturgeon shallows |
| **11** Practised hands II (mastery 6% faster) | **36** Practised hands VII (mastery 6% faster) | **61** Quick cast XIII (1.25% faster) | **86** Angler's eye XVIII (Rare and Legendary finds 4% likelier) |
| **12** Quick cast III (2.5% faster) | **37** Quick cast VIII (2.5% faster) | **62** Plenty XIII (+1.5% chance of an extra item) | **87** Practised hands XVIII (mastery 3% faster) |
| **13** Plenty III (+3% chance of an extra item) | **38** Plenty VIII (+3% chance of an extra item) | **63** Angler's eye XIII (Rare and Legendary finds 4% likelier) | **88** Quick cast XIX (1.25% faster) |
| **14** Deep trout pool | **39** Angler's eye VIII (Rare and Legendary finds 8% likelier) | **64** Practised hands XIII (mastery 3% faster) | **89** Deep dawn sturgeon pool |
| **15** Angler's eye III (Rare and Legendary finds 8% likelier) | **40** Moon carp shallows; Master angler (+10% chance of an extra item) | **65** Quick cast XIV (1.25% faster) | **90** Plenty XIX (+1.5% chance of an extra item) |
| **16** Practised hands III (mastery 6% faster) | **41** Practised hands VIII (mastery 3% faster) | **66** Plenty XIV (+1.5% chance of an extra item) | **91** Angler's eye XIX (Rare and Legendary finds 4% likelier) |
| **17** Quick cast IV (2.5% faster) | **42** Quick cast IX (1.25% faster) | **67** Angler's eye XIV (Rare and Legendary finds 4% likelier) | **92** Practised hands XIX (mastery 3% faster) |
| **18** Plenty IV (+3% chance of an extra item) | **43** Plenty IX (+1.5% chance of an extra item) | **68** Practised hands XIV (mastery 3% faster) | **93** Quick cast XX (1.25% faster) |
| **19** Angler's eye IV (Rare and Legendary finds 8% likelier) | **44** Deep moon carp pool | **69** Quick cast XV (1.25% faster) | **94** Plenty XX (+1.5% chance of an extra item) |
| **20** Pike shallows | **45** Angler's eye IX (Rare and Legendary finds 4% likelier) | **70** Ember char shallows | **95** Angler's eye XX (Rare and Legendary finds 4% likelier) |
| **21** Practised hands IV (mastery 6% faster) | **46** Practised hands IX (mastery 3% faster) | **71** Plenty XV (+1.5% chance of an extra item) | **96** Practised hands XX (mastery 3% faster) |
| **22** Quick cast V (2.5% faster) | **47** Quick cast X (1.25% faster) | **72** Angler's eye XV (Rare and Legendary finds 4% likelier) | **97** Quick cast XXI (1.25% faster) |
| **23** Plenty V (+3% chance of an extra item) | **48** Plenty X (+1.5% chance of an extra item) | **73** Practised hands XV (mastery 3% faster) | **98** Plenty XXI (+1.5% chance of an extra item) |
| **24** Deep pike pool | **49** Angler's eye X (Rare and Legendary finds 4% likelier) | **74** Deep ember char pool | **99** Grandmaster angler (+15% chance of an extra item) |
| **25** Angler's eye V (Rare and Legendary finds 8% likelier) | **50** Practised hands X (mastery 3% faster) | **75** Quick cast XVI (1.25% faster) |  |

### Runecraft

| Levels 1–25 | Levels 26–50 | Levels 51–75 | Levels 76–99 |
| --- | --- | --- | --- |
| **1** Spark stone | **26** Practised hands V (mastery 6% faster) | **51** Quick draw XI (1.25% faster) | **76** Plenty XVI (+1.5% chance of an extra item) |
| **2** Quick draw I (2.5% faster) | **27** Quick draw VI (2.5% faster) | **52** Plenty XI (+1.5% chance of an extra item) | **77** Seer's eye XVI (Rare and Legendary finds 4% likelier) |
| **3** Plenty I (+3% chance of an extra item) | **28** Plenty VI (+3% chance of an extra item) | **53** Seer's eye XI (Rare and Legendary finds 4% likelier) | **78** Practised hands XVI (mastery 3% faster) |
| **4** Seer's eye I (Rare and Legendary finds 8% likelier) | **29** Seer's eye VI (Rare and Legendary finds 8% likelier) | **54** Practised hands XI (mastery 3% faster) | **79** Quick draw XVII (1.25% faster) |
| **5** Ancient spark stone | **30** Earth stone | **55** Star stone | **80** Plenty XVII (+1.5% chance of an extra item) |
| **6** Practised hands I (mastery 6% faster) | **31** Practised hands VI (mastery 6% faster) | **56** Quick draw XII (1.25% faster) | **81** Seer's eye XVII (Rare and Legendary finds 4% likelier) |
| **7** Quick draw II (2.5% faster) | **32** Quick draw VII (2.5% faster) | **57** Plenty XII (+1.5% chance of an extra item) | **82** Practised hands XVII (mastery 3% faster) |
| **8** Plenty II (+3% chance of an extra item) | **33** Plenty VII (+3% chance of an extra item) | **58** Seer's eye XII (Rare and Legendary finds 4% likelier) | **83** Quick draw XVIII (1.25% faster) |
| **9** Seer's eye II (Rare and Legendary finds 8% likelier) | **34** Ancient earth stone | **59** Ancient star stone | **84** Plenty XVIII (+1.5% chance of an extra item) |
| **10** Gale stone | **35** Seer's eye VII (Rare and Legendary finds 8% likelier) | **60** Practised hands XII (mastery 3% faster) | **85** Dawn stone |
| **11** Practised hands II (mastery 6% faster) | **36** Practised hands VII (mastery 6% faster) | **61** Quick draw XIII (1.25% faster) | **86** Seer's eye XVIII (Rare and Legendary finds 4% likelier) |
| **12** Quick draw III (2.5% faster) | **37** Quick draw VIII (2.5% faster) | **62** Plenty XIII (+1.5% chance of an extra item) | **87** Practised hands XVIII (mastery 3% faster) |
| **13** Plenty III (+3% chance of an extra item) | **38** Plenty VIII (+3% chance of an extra item) | **63** Seer's eye XIII (Rare and Legendary finds 4% likelier) | **88** Quick draw XIX (1.25% faster) |
| **14** Ancient gale stone | **39** Seer's eye VIII (Rare and Legendary finds 8% likelier) | **64** Practised hands XIII (mastery 3% faster) | **89** Ancient dawn stone |
| **15** Seer's eye III (Rare and Legendary finds 8% likelier) | **40** Moon stone; Master runecrafter (+10% chance of an extra item) | **65** Quick draw XIV (1.25% faster) | **90** Plenty XIX (+1.5% chance of an extra item) |
| **16** Practised hands III (mastery 6% faster) | **41** Practised hands VIII (mastery 3% faster) | **66** Plenty XIV (+1.5% chance of an extra item) | **91** Seer's eye XIX (Rare and Legendary finds 4% likelier) |
| **17** Quick draw IV (2.5% faster) | **42** Quick draw IX (1.25% faster) | **67** Seer's eye XIV (Rare and Legendary finds 4% likelier) | **92** Practised hands XIX (mastery 3% faster) |
| **18** Plenty IV (+3% chance of an extra item) | **43** Plenty IX (+1.5% chance of an extra item) | **68** Practised hands XIV (mastery 3% faster) | **93** Quick draw XX (1.25% faster) |
| **19** Seer's eye IV (Rare and Legendary finds 8% likelier) | **44** Ancient moon stone | **69** Quick draw XV (1.25% faster) | **94** Plenty XX (+1.5% chance of an extra item) |
| **20** Tide stone | **45** Seer's eye IX (Rare and Legendary finds 4% likelier) | **70** Ember stone | **95** Seer's eye XX (Rare and Legendary finds 4% likelier) |
| **21** Practised hands IV (mastery 6% faster) | **46** Practised hands IX (mastery 3% faster) | **71** Plenty XV (+1.5% chance of an extra item) | **96** Practised hands XX (mastery 3% faster) |
| **22** Quick draw V (2.5% faster) | **47** Quick draw X (1.25% faster) | **72** Seer's eye XV (Rare and Legendary finds 4% likelier) | **97** Quick draw XXI (1.25% faster) |
| **23** Plenty V (+3% chance of an extra item) | **48** Plenty X (+1.5% chance of an extra item) | **73** Practised hands XV (mastery 3% faster) | **98** Plenty XXI (+1.5% chance of an extra item) |
| **24** Ancient tide stone | **49** Seer's eye X (Rare and Legendary finds 4% likelier) | **74** Ancient ember stone | **99** Grandmaster runecrafter (+15% chance of an extra item) |
| **25** Seer's eye V (Rare and Legendary finds 8% likelier) | **50** Practised hands X (mastery 3% faster) | **75** Quick draw XVI (1.25% faster) |  |

### Smithing

| Levels 1–25 | Levels 26–50 | Levels 51–75 | Levels 76–99 |
| --- | --- | --- | --- |
| **1** Copper bar; Copper whetstones | **26** Iron legs | **51** Practised hands IV (mastery 4% faster) | **76** Embersteel legs |
| **2** Copper sword | **27** Smith's eye II (Rare and Legendary finds 8% likelier) | **52** Steady forge V (1.5% faster) | **77** Steady forge VIII (1.5% faster) |
| **3** Copper staff | **28** Iron body | **53** Thrifty V (2% chance to save an ingredient) | **78** Embersteel body |
| **4** Copper bow | **29** Practised hands II (mastery 8% faster) | **54** Smith's eye V (Rare and Legendary finds 4% likelier) | **79** Thrifty VIII (2% chance to save an ingredient) |
| **5** Steady forge I (3% faster) | **30** Steel bar; Steel whetstones; Steel key | **55** Star-iron bar; Star-iron whetstones; Star-iron key | **80** Smith's eye VIII (Rare and Legendary finds 4% likelier) |
| **6** Copper helm | **31** Steel sword | **56** Star-iron sword | **81** Practised hands VIII (mastery 4% faster) |
| **7** Copper legs | **32** Steel staff | **57** Star-iron staff | **82** Steady forge IX (1.5% faster) |
| **8** Thrifty I (4% chance to save an ingredient) | **33** Steel bow | **58** Star-iron bow | **83** Thrifty IX (2% chance to save an ingredient) |
| **9** Copper body | **34** Steady forge III (3% faster) | **59** Practised hands V (mastery 4% faster) | **84** Smith's eye IX (Rare and Legendary finds 4% likelier) |
| **10** Bronze bar; Bronze whetstones; Bronze key | **35** Steel helm | **60** Star-iron helm | **85** Dawnsteel bar; Dawnsteel whetstones; Dawnsteel key |
| **11** Bronze sword | **36** Steel legs | **61** Star-iron legs | **86** Dawnsteel sword |
| **12** Bronze staff | **37** Thrifty III (4% chance to save an ingredient) | **62** Steady forge VI (1.5% faster) | **87** Dawnsteel staff |
| **13** Bronze bow | **38** Steel body | **63** Star-iron body | **88** Dawnsteel bow |
| **14** Smith's eye I (Rare and Legendary finds 8% likelier) | **39** Smith's eye III (Rare and Legendary finds 8% likelier) | **64** Thrifty VI (2% chance to save an ingredient) | **89** Practised hands IX (mastery 4% faster) |
| **15** Bronze helm | **40** Moonsilver bar; Moonsilver whetstones; Moonsilver key; Master smith (8% chance to save an ingredient) | **65** Smith's eye VI (Rare and Legendary finds 4% likelier) | **90** Dawnsteel helm |
| **16** Bronze legs | **41** Moonsilver sword | **66** Practised hands VI (mastery 4% faster) | **91** Dawnsteel legs |
| **17** Practised hands I (mastery 8% faster) | **42** Moonsilver staff | **67** Steady forge VII (1.5% faster) | **92** Steady forge X (1.5% faster) |
| **18** Bronze body | **43** Moonsilver bow | **68** Thrifty VII (2% chance to save an ingredient) | **93** Dawnsteel body |
| **19** Steady forge II (3% faster) | **44** Practised hands III (mastery 4% faster) | **69** Smith's eye VII (Rare and Legendary finds 4% likelier) | **94** Thrifty X (2% chance to save an ingredient) |
| **20** Iron bar; Iron whetstones; Iron key | **45** Moonsilver helm | **70** Embersteel bar; Embersteel whetstones; Embersteel key | **95** Smith's eye X (Rare and Legendary finds 4% likelier) |
| **21** Iron sword | **46** Moonsilver legs | **71** Embersteel sword | **96** Practised hands X (mastery 4% faster) |
| **22** Iron staff | **47** Steady forge IV (1.5% faster) | **72** Embersteel staff | **97** Steady forge XI (1.5% faster) |
| **23** Iron bow | **48** Moonsilver body | **73** Embersteel bow | **98** Thrifty XI (2% chance to save an ingredient) |
| **24** Thrifty II (4% chance to save an ingredient) | **49** Thrifty IV (2% chance to save an ingredient) | **74** Practised hands VII (mastery 4% faster) | **99** Grandmaster smith (10% chance to save an ingredient) |
| **25** Iron helm | **50** Smith's eye IV (Rare and Legendary finds 4% likelier) | **75** Embersteel helm |  |

### Cooking

| Levels 1–25 | Levels 26–50 | Levels 51–75 | Levels 76–99 |
| --- | --- | --- | --- |
| **1** Cooked perch | **26** Thrifty VI (4% chance to save an ingredient) | **51** Cook's eye XI (Rare and Legendary finds 4% likelier) | **76** Practised hands XVI (mastery 4% faster) |
| **2** Steady flame I (3% faster) | **27** Cook's eye VI (Rare and Legendary finds 8% likelier) | **52** Practised hands XI (mastery 4% faster) | **77** Steady flame XVII (1.5% faster) |
| **3** Thrifty I (4% chance to save an ingredient) | **28** Practised hands VI (mastery 8% faster) | **53** Steady flame XII (1.5% faster) | **78** Thrifty XVII (2% chance to save an ingredient) |
| **4** Cook's eye I (Rare and Legendary finds 8% likelier) | **29** Steady flame VII (3% faster) | **54** Thrifty XII (2% chance to save an ingredient) | **79** Cook's eye XVII (Rare and Legendary finds 4% likelier) |
| **5** Practised hands I (mastery 8% faster) | **30** Cooked salmon | **55** Cooked silver eel | **80** Practised hands XVII (mastery 4% faster) |
| **6** Steady flame II (3% faster) | **31** Thrifty VII (4% chance to save an ingredient) | **56** Cook's eye XII (Rare and Legendary finds 4% likelier) | **81** Steady flame XVIII (1.5% faster) |
| **7** Thrifty II (4% chance to save an ingredient) | **32** Cook's eye VII (Rare and Legendary finds 8% likelier) | **57** Practised hands XII (mastery 4% faster) | **82** Thrifty XVIII (2% chance to save an ingredient) |
| **8** Cook's eye II (Rare and Legendary finds 8% likelier) | **33** Practised hands VII (mastery 8% faster) | **58** Steady flame XIII (1.5% faster) | **83** Cook's eye XVIII (Rare and Legendary finds 4% likelier) |
| **9** Practised hands II (mastery 8% faster) | **34** Steady flame VIII (3% faster) | **59** Thrifty XIII (2% chance to save an ingredient) | **84** Practised hands XVIII (mastery 4% faster) |
| **10** Cooked trout | **35** Salmon stew | **60** Eel stew | **85** Cooked dawn sturgeon |
| **11** Steady flame III (3% faster) | **36** Thrifty VIII (4% chance to save an ingredient) | **61** Cook's eye XIII (Rare and Legendary finds 4% likelier) | **86** Steady flame XIX (1.5% faster) |
| **12** Thrifty III (4% chance to save an ingredient) | **37** Cook's eye VIII (Rare and Legendary finds 8% likelier) | **62** Practised hands XIII (mastery 4% faster) | **87** Thrifty XIX (2% chance to save an ingredient) |
| **13** Cook's eye III (Rare and Legendary finds 8% likelier) | **38** Practised hands VIII (mastery 8% faster) | **63** Steady flame XIV (1.5% faster) | **88** Cook's eye XIX (Rare and Legendary finds 4% likelier) |
| **14** Practised hands III (mastery 8% faster) | **39** Steady flame IX (3% faster) | **64** Thrifty XIV (2% chance to save an ingredient) | **89** Practised hands XIX (mastery 4% faster) |
| **15** Steady flame IV (3% faster) | **40** Cooked moon carp; Master cook (8% chance to save an ingredient) | **65** Cook's eye XIV (Rare and Legendary finds 4% likelier) | **90** Sturgeon stew |
| **16** Thrifty IV (4% chance to save an ingredient) | **41** Thrifty IX (2% chance to save an ingredient) | **66** Practised hands XIV (mastery 4% faster) | **91** Steady flame XX (1.5% faster) |
| **17** Cook's eye IV (Rare and Legendary finds 8% likelier) | **42** Cook's eye IX (Rare and Legendary finds 4% likelier) | **67** Steady flame XV (1.5% faster) | **92** Thrifty XX (2% chance to save an ingredient) |
| **18** Practised hands IV (mastery 8% faster) | **43** Practised hands IX (mastery 4% faster) | **68** Thrifty XV (2% chance to save an ingredient) | **93** Cook's eye XX (Rare and Legendary finds 4% likelier) |
| **19** Steady flame V (3% faster) | **44** Steady flame X (1.5% faster) | **69** Cook's eye XV (Rare and Legendary finds 4% likelier) | **94** Practised hands XX (mastery 4% faster) |
| **20** Cooked pike | **45** Carp pie | **70** Cooked ember char | **95** Steady flame XXI (1.5% faster) |
| **21** Thrifty V (4% chance to save an ingredient) | **46** Thrifty X (2% chance to save an ingredient) | **71** Practised hands XV (mastery 4% faster) | **96** Thrifty XXI (2% chance to save an ingredient) |
| **22** Cook's eye V (Rare and Legendary finds 8% likelier) | **47** Cook's eye X (Rare and Legendary finds 4% likelier) | **72** Steady flame XVI (1.5% faster) | **97** Cook's eye XXI (Rare and Legendary finds 4% likelier) |
| **23** Practised hands V (mastery 8% faster) | **48** Practised hands X (mastery 4% faster) | **73** Thrifty XVI (2% chance to save an ingredient) | **98** Practised hands XXI (mastery 4% faster) |
| **24** Steady flame VI (3% faster) | **49** Steady flame XI (1.5% faster) | **74** Cook's eye XVI (Rare and Legendary finds 4% likelier) | **99** Grandmaster cook (10% chance to save an ingredient) |
| **25** Pike pie | **50** Thrifty XI (2% chance to save an ingredient) | **75** Char pie |  |

### Fletching

| Levels 1–25 | Levels 26–50 | Levels 51–75 | Levels 76–99 |
| --- | --- | --- | --- |
| **1** Copper arrows | **26** Fletcher's eye VI (Rare and Legendary finds 8% likelier) | **51** Thrifty XII (2% chance to save an ingredient) | **76** Fine fletching XVIII (+1.5% chance of an extra item) |
| **2** Fine fletching I (+3% chance of an extra item) | **27** Practised hands VI (mastery 8% faster) | **52** Fletcher's eye XII (Rare and Legendary finds 4% likelier) | **77** Thrifty XVIII (2% chance to save an ingredient) |
| **3** Thrifty I (4% chance to save an ingredient) | **28** Fine fletching VII (+3% chance of an extra item) | **53** Practised hands XII (mastery 4% faster) | **78** Fletcher's eye XVIII (Rare and Legendary finds 4% likelier) |
| **4** Fletcher's eye I (Rare and Legendary finds 8% likelier) | **29** Thrifty VII (4% chance to save an ingredient) | **54** Fine fletching XIII (+1.5% chance of an extra item) | **79** Practised hands XVIII (mastery 4% faster) |
| **5** Practised hands I (mastery 8% faster) | **30** Steel arrows | **55** Star-iron arrows | **80** Fine fletching XIX (+1.5% chance of an extra item) |
| **6** Fine fletching II (+3% chance of an extra item) | **31** Fletcher's eye VII (Rare and Legendary finds 8% likelier) | **56** Thrifty XIII (2% chance to save an ingredient) | **81** Thrifty XIX (2% chance to save an ingredient) |
| **7** Thrifty II (4% chance to save an ingredient) | **32** Practised hands VII (mastery 8% faster) | **57** Fletcher's eye XIII (Rare and Legendary finds 4% likelier) | **82** Fletcher's eye XIX (Rare and Legendary finds 4% likelier) |
| **8** Fletcher's eye II (Rare and Legendary finds 8% likelier) | **33** Fine fletching VIII (+3% chance of an extra item) | **58** Practised hands XIII (mastery 4% faster) | **83** Practised hands XIX (mastery 4% faster) |
| **9** Practised hands II (mastery 8% faster) | **34** Thrifty VIII (4% chance to save an ingredient) | **59** Fine fletching XIV (+1.5% chance of an extra item) | **84** Fine fletching XX (+1.5% chance of an extra item) |
| **10** Bronze arrows | **35** Fletcher's eye VIII (Rare and Legendary finds 8% likelier) | **60** Thrifty XIV (2% chance to save an ingredient) | **85** Dawnsteel arrows |
| **11** Fine fletching III (+3% chance of an extra item) | **36** Practised hands VIII (mastery 8% faster) | **61** Fletcher's eye XIV (Rare and Legendary finds 4% likelier) | **86** Thrifty XX (2% chance to save an ingredient) |
| **12** Thrifty III (4% chance to save an ingredient) | **37** Fine fletching IX (+3% chance of an extra item) | **62** Practised hands XIV (mastery 4% faster) | **87** Fletcher's eye XX (Rare and Legendary finds 4% likelier) |
| **13** Fletcher's eye III (Rare and Legendary finds 8% likelier) | **38** Thrifty IX (4% chance to save an ingredient) | **63** Fine fletching XV (+1.5% chance of an extra item) | **88** Practised hands XX (mastery 4% faster) |
| **14** Practised hands III (mastery 8% faster) | **39** Fletcher's eye IX (Rare and Legendary finds 8% likelier) | **64** Thrifty XV (2% chance to save an ingredient) | **89** Fine fletching XXI (+1.5% chance of an extra item) |
| **15** Fine fletching IV (+3% chance of an extra item) | **40** Moonsilver arrows; Master fletcher (8% chance to save an ingredient) | **65** Fletcher's eye XV (Rare and Legendary finds 4% likelier) | **90** Thrifty XXI (2% chance to save an ingredient) |
| **16** Thrifty IV (4% chance to save an ingredient) | **41** Practised hands IX (mastery 4% faster) | **66** Practised hands XV (mastery 4% faster) | **91** Fletcher's eye XXI (Rare and Legendary finds 4% likelier) |
| **17** Fletcher's eye IV (Rare and Legendary finds 8% likelier) | **42** Fine fletching X (+1.5% chance of an extra item) | **67** Fine fletching XVI (+1.5% chance of an extra item) | **92** Practised hands XXI (mastery 4% faster) |
| **18** Practised hands IV (mastery 8% faster) | **43** Thrifty X (2% chance to save an ingredient) | **68** Thrifty XVI (2% chance to save an ingredient) | **93** Fine fletching XXII (+1.5% chance of an extra item) |
| **19** Fine fletching V (+3% chance of an extra item) | **44** Fletcher's eye X (Rare and Legendary finds 4% likelier) | **69** Fletcher's eye XVI (Rare and Legendary finds 4% likelier) | **94** Thrifty XXII (2% chance to save an ingredient) |
| **20** Iron arrows | **45** Practised hands X (mastery 4% faster) | **70** Embersteel arrows | **95** Fletcher's eye XXII (Rare and Legendary finds 4% likelier) |
| **21** Thrifty V (4% chance to save an ingredient) | **46** Fine fletching XI (+1.5% chance of an extra item) | **71** Practised hands XVI (mastery 4% faster) | **96** Practised hands XXII (mastery 4% faster) |
| **22** Fletcher's eye V (Rare and Legendary finds 8% likelier) | **47** Thrifty XI (2% chance to save an ingredient) | **72** Fine fletching XVII (+1.5% chance of an extra item) | **97** Fine fletching XXIII (+1.5% chance of an extra item) |
| **23** Practised hands V (mastery 8% faster) | **48** Fletcher's eye XI (Rare and Legendary finds 4% likelier) | **73** Thrifty XVII (2% chance to save an ingredient) | **98** Thrifty XXIII (2% chance to save an ingredient) |
| **24** Fine fletching VI (+3% chance of an extra item) | **49** Practised hands XI (mastery 4% faster) | **74** Fletcher's eye XVII (Rare and Legendary finds 4% likelier) | **99** Grandmaster fletcher (10% chance to save an ingredient) |
| **25** Thrifty VI (4% chance to save an ingredient) | **50** Fine fletching XII (+1.5% chance of an extra item) | **75** Practised hands XVII (mastery 4% faster) |  |

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
| **5** Second wind I (health returns 25% faster); Toughness (+40 health) | **30** Wear Steel armour; Toughness (+40 health) | **55** Wear Star-iron armour; Foe: Mire hulk; Iron stomach II (food heals 7.5% more); Toughness (+40 health) | **80** Foe: Ash shaman; The vendor sells Warden's feast; Toughness (+40 health) |
| **6** Toughness (+40 health) | **31** Toughness (+40 health) | **56** Toughness (+40 health) | **81** Toughness (+40 health) |
| **7** Toughness (+40 health) | **32** Toughness (+40 health) | **57** Toughness (+40 health) | **82** Toughness (+40 health) |
| **8** Toughness (+40 health) | **33** Toughness (+40 health) | **58** Toughness (+40 health) | **83** Toughness (+40 health) |
| **9** Toughness (+40 health) | **34** Foe: Fell huntsman; Toughness (+40 health) | **59** Toughness (+40 health) | **84** Toughness (+40 health) |
| **10** Wear Bronze armour; The vendor sells Meat pie; Toughness (+40 health) | **35** Stubborn (retreat at 12% health instead of 20%); Toughness (+40 health) | **60** Foe: Fen reaver; The vendor sells Hunter's feast; Toughness (+40 health) | **85** Wear Dawnsteel armour; Foe: Obsidian golem; Second wind III (health returns 12.5% faster); Toughness (+40 health) |
| **11** Toughness (+40 health) | **36** Toughness (+40 health) | **61** Toughness (+40 health) | **86** Toughness (+40 health) |
| **12** Toughness (+40 health) | **37** Toughness (+40 health) | **62** Toughness (+40 health) | **87** Toughness (+40 health) |
| **13** Toughness (+40 health) | **38** Toughness (+40 health) | **63** Toughness (+40 health) | **88** Toughness (+40 health) |
| **14** Foe: Orc raider; Toughness (+40 health) | **39** Toughness (+40 health) | **64** Toughness (+40 health) | **89** Toughness (+40 health) |
| **15** Iron stomach I (food heals 15% more); Toughness (+40 health) | **40** Wear Moonsilver armour; Foe: Bog lurker; The vendor sells Roast fowl; Unbowed (food heals 15% more); Toughness (+40 health) | **65** Foe: Bog witch; Field dressing II (health returns 12.5% faster); Toughness (+40 health) | **90** Foe: Sky reaver; Toughness (+40 health) |
| **16** Toughness (+40 health) | **41** Toughness (+40 health) | **66** Toughness (+40 health) | **91** Toughness (+40 health) |
| **17** Toughness (+40 health) | **42** Toughness (+40 health) | **67** Toughness (+40 health) | **92** Toughness (+40 health) |
| **18** Foe: Orc bowman; Toughness (+40 health) | **43** Toughness (+40 health) | **68** Toughness (+40 health) | **93** Toughness (+40 health) |
| **19** Toughness (+40 health) | **44** Foe: Reed stalker; Toughness (+40 health) | **69** Toughness (+40 health) | **94** Toughness (+40 health) |
| **20** Wear Iron armour; The vendor sells Hearty stew; Toughness (+40 health) | **45** Second wind II (health returns 12.5% faster); Toughness (+40 health) | **70** Wear Embersteel armour; Foe: Ash troll; Toughness (+40 health) | **95** Foe: Ember sorcerer; Field dressing III (health returns 12.5% faster); Toughness (+40 health) |
| **21** Toughness (+40 health) | **46** Toughness (+40 health) | **71** Toughness (+40 health) | **96** Toughness (+40 health) |
| **22** Foe: Grave wight; Toughness (+40 health) | **47** Toughness (+40 health) | **72** Toughness (+40 health) | **97** Toughness (+40 health) |
| **23** Toughness (+40 health) | **48** Toughness (+40 health) | **73** Toughness (+40 health) | **98** Toughness (+40 health) |
| **24** Toughness (+40 health) | **49** Foe: Drowned acolyte; Toughness (+40 health) | **74** Toughness (+40 health) | **99** Unbroken (food heals 20% more); Toughness (+40 health) |
| **25** Field dressing I (health returns 25% faster); Toughness (+40 health) | **50** Toughness (+40 health) | **75** Foe: Peak slinger; Iron stomach III (food heals 7.5% more); Toughness (+40 health) |  |

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
1: 0 · 2: 50 · 3: 150 · 4: 310 · 5: 520 · 6: 890 · 7: 1,490 · 8: 2,500 · 9: 4,170 · 10: 6,790 · 11: 10,400 · 12: 15,900 · 13: 23,800 · 14: 34,000 · 15: 46,800 · 16: 62,100 · 17: 79,900 · 18: 101,000 · 19: 126,000 · 20: 155,000 · 21: 202,000 · 22: 265,000 · 23: 340,000 · 24: 428,000 · 25: 531,000 · 26: 650,000 · 27: 790,000 · 28: 951,000 · 29: 1,140,000 · 30: 1,360,000 · 31: 1,650,000 · 32: 2,000,000 · 33: 2,430,000 · 34: 2,920,000 · 35: 3,500,000 · 36: 4,170,000 · 37: 4,950,000 · 38: 5,850,000 · 39: 6,900,000 · 40: 8,100,000 · 41: 9,302,000 · 42: 10,507,000 · 43: 11,714,000 · 44: 12,924,000 · 45: 14,136,000 · 46: 15,350,000 · 47: 16,567,000 · 48: 17,786,000 · 49: 19,008,000 · 50: 20,232,000 · 51: 21,459,000 · 52: 22,688,000 · 53: 23,920,000 · 54: 25,154,000 · 55: 26,391,000 · 56: 27,630,000 · 57: 28,871,000 · 58: 30,115,000 · 59: 31,361,000 · 60: 32,610,000 · 61: 33,861,000 · 62: 35,115,000 · 63: 36,371,000 · 64: 37,630,000 · 65: 38,891,000 · 66: 40,155,000 · 67: 41,422,000 · 68: 42,691,000 · 69: 43,963,000 · 70: 45,237,000 · 71: 46,514,000 · 72: 47,793,000 · 73: 49,075,000 · 74: 50,359,000 · 75: 51,646,000 · 76: 52,935,000 · 77: 54,227,000 · 78: 55,522,000 · 79: 56,819,000 · 80: 58,119,000 · 81: 59,421,000 · 82: 60,726,000 · 83: 62,034,000 · 84: 63,344,000 · 85: 64,657,000 · 86: 65,973,000 · 87: 67,291,000 · 88: 68,612,000 · 89: 69,935,000 · 90: 71,261,000 · 91: 72,590,000 · 92: 73,921,000 · 93: 75,255,000 · 94: 76,592,000 · 95: 77,931,000 · 96: 79,273,000 · 97: 80,618,000 · 98: 81,965,000 · 99: 83,315,000

Pacing for a skill kept in a lane (one active hour with the fire each day)
Woodcutting  L10 1.0 h (+0%)  L20 22.6 h (-6%)  L30 4.9 days (-3%)  L40 20.8 days (-1%)  L55 50.3 days (0%)  L70 73.5 days (0%)  L85 91.8 days (+0%)  L99 105.6 days (0%)
PASS  Woodcutting level 10 within 25% of target
PASS  Woodcutting level 20 within 25% of target
PASS  Woodcutting level 30 within 25% of target
PASS  Woodcutting level 40 within 25% of target
PASS  Woodcutting level 55 within 25% of target
PASS  Woodcutting level 70 within 25% of target
PASS  Woodcutting level 85 within 25% of target
PASS  Woodcutting level 99 within 25% of target
Mining       L10 1.0 h (+0%)  L20 22.6 h (-6%)  L30 4.9 days (-3%)  L40 20.8 days (-1%)  L55 50.3 days (0%)  L70 73.5 days (0%)  L85 91.8 days (+0%)  L99 105.6 days (0%)
PASS  Mining level 10 within 25% of target
PASS  Mining level 20 within 25% of target
PASS  Mining level 30 within 25% of target
PASS  Mining level 40 within 25% of target
PASS  Mining level 55 within 25% of target
PASS  Mining level 70 within 25% of target
PASS  Mining level 85 within 25% of target
PASS  Mining level 99 within 25% of target
Smithing     L10 1.0 h (+1%)  L20 23.1 h (-4%)  L30 5.2 days (+5%)  L40 23.1 days (+10%)  L55 55.9 days (+11%)  L70 81.8 days (+11%)  L85 102.5 days (+12%)  L99 118.5 days (+12%)
PASS  Smithing level 10 within 25% of target
PASS  Smithing level 20 within 25% of target
PASS  Smithing level 30 within 25% of target
PASS  Smithing level 40 within 25% of target
PASS  Smithing level 55 within 25% of target
PASS  Smithing level 70 within 25% of target
PASS  Smithing level 85 within 25% of target
PASS  Smithing level 99 within 25% of target
Melee        L10 1.2 h (+18%)  L20 25.7 h (+7%)  L30 5.5 days (+10%)  L40 20.3 days (-3%)  L55 47.9 days (-5%)  L70 72.6 days (-1%)  L85 93.5 days (+2%)  L99 111.1 days (+5%)
PASS  Melee level 10 within 25% of target
PASS  Melee level 20 within 25% of target
PASS  Melee level 30 within 25% of target
PASS  Melee level 40 within 25% of target
PASS  Melee level 55 within 25% of target
PASS  Melee level 70 within 25% of target
PASS  Melee level 85 within 25% of target
PASS  Melee level 99 within 25% of target
Archery      L10 1.2 h (+20%)  L20 24.8 h (+3%)  L30 5.0 days (-1%)  L40 21.5 days (+3%)  L55 52.2 days (+3%)  L70 76.5 days (+4%)  L85 97.3 days (+6%)  L99 114.8 days (+8%)
PASS  Archery level 10 within 25% of target
PASS  Archery level 20 within 25% of target
PASS  Archery level 30 within 25% of target
PASS  Archery level 40 within 25% of target
PASS  Archery level 55 within 25% of target
PASS  Archery level 70 within 25% of target
PASS  Archery level 85 within 25% of target
PASS  Archery level 99 within 25% of target
Magic        L10 1.2 h (+20%)  L20 26.9 h (+12%)  L30 5.3 days (+5%)  L40 21.3 days (+1%)  L55 50.0 days (-1%)  L70 74.5 days (+1%)  L85 95.6 days (+4%)  L99 113.1 days (+7%)
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
PASS  Fishing: every level 1-99 unlocks something
PASS  Runecraft: every level 1-99 unlocks something
PASS  Smithing: every level 1-99 unlocks something
PASS  Cooking: every level 1-99 unlocks something
PASS  Fletching: every level 1-99 unlocks something
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
fishing tier 1: Perch shallows 6046 · Deep perch pool 5130 (+100% materials)
PASS  fishing tier 1 offers two choices within 20%
fishing tier 2: Trout shallows 8604 · Deep trout pool 7572 (+100% materials) · Perch shallows mastered 7102
PASS  fishing tier 2 offers two choices within 20%
fishing tier 3: Pike shallows 11653 · Deep pike pool 10159 (+100% materials) · Trout shallows mastered 10044
PASS  fishing tier 3 offers two choices within 20%
fishing tier 4: Salmon shallows 15600 · Deep salmon pool 13508 (+100% materials) · Pike shallows mastered 13525
PASS  fishing tier 4 offers two choices within 20%
fishing tier 5: Moon carp shallows 22919 · Deep moon carp pool 19906 (+100% materials) · Salmon shallows mastered 18009
PASS  fishing tier 5 offers two choices within 20%
fishing tier 6: Silver eel shallows 30448 · Deep silver eel pool 26349 (+100% materials) · Moon carp shallows mastered 26114
PASS  fishing tier 6 offers two choices within 20%
fishing tier 7: Ember char shallows 39820 · Deep ember char pool 34528 (+100% materials) · Silver eel shallows mastered 34577
PASS  fishing tier 7 offers two choices within 20%
fishing tier 8: Dawn sturgeon shallows 50971 · Deep dawn sturgeon pool 44141 (+100% materials) · Ember char shallows mastered 45078
PASS  fishing tier 8 offers two choices within 20%
runecraft tier 1: Spark stone 6046 · Ancient spark stone 5130 (+100% materials)
PASS  runecraft tier 1 offers two choices within 20%
runecraft tier 2: Gale stone 8604 · Ancient gale stone 7572 (+100% materials) · Spark stone mastered 7102
PASS  runecraft tier 2 offers two choices within 20%
runecraft tier 3: Tide stone 11653 · Ancient tide stone 10159 (+100% materials) · Gale stone mastered 10044
PASS  runecraft tier 3 offers two choices within 20%
runecraft tier 4: Earth stone 15600 · Ancient earth stone 13508 (+100% materials) · Tide stone mastered 13525
PASS  runecraft tier 4 offers two choices within 20%
runecraft tier 5: Moon stone 22919 · Ancient moon stone 19906 (+100% materials) · Earth stone mastered 18009
PASS  runecraft tier 5 offers two choices within 20%
runecraft tier 6: Star stone 30448 · Ancient star stone 26349 (+100% materials) · Moon stone mastered 26114
PASS  runecraft tier 6 offers two choices within 20%
runecraft tier 7: Ember stone 39820 · Ancient ember stone 34528 (+100% materials) · Star stone mastered 34577
PASS  runecraft tier 7 offers two choices within 20%
runecraft tier 8: Dawn stone 50971 · Ancient dawn stone 44141 (+100% materials) · Ember stone mastered 45078
PASS  runecraft tier 8 offers two choices within 20%
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
PASS  Mastery pays: at fishing 11, Perch shallows (mastery 8) earns 90% of the best fresh action of its kind
PASS  Mastery pays: at fishing 15, Deep perch pool (mastery 8) earns 86% of the best fresh action of its kind
PASS  Mastery pays: at fishing 20, Trout shallows (mastery 7) earns 92% of the best fresh action of its kind
PASS  Mastery pays: at fishing 24, Deep trout pool (mastery 7) earns 92% of the best fresh action of its kind
PASS  Mastery pays: at fishing 30, Pike shallows (mastery 9) earns 96% of the best fresh action of its kind
PASS  Mastery pays: at fishing 34, Deep pike pool (mastery 6) earns 90% of the best fresh action of its kind
PASS  Mastery pays: at fishing 40, Salmon shallows (mastery 10) earns 88% of the best fresh action of its kind
PASS  Mastery pays: at fishing 44, Deep salmon pool (mastery 6) earns 81% of the best fresh action of its kind
PASS  Mastery pays: at fishing 50, Moon carp shallows (mastery 10) earns 124% of the best fresh action of its kind
PASS  Mastery pays: at fishing 54, Deep moon carp pool (mastery 6) earns 115% of the best fresh action of its kind
PASS  Mastery pays: at fishing 65, Silver eel shallows (mastery 10) earns 124% of the best fresh action of its kind
PASS  Mastery pays: at fishing 69, Deep silver eel pool (mastery 5) earns 112% of the best fresh action of its kind
PASS  Mastery pays: at fishing 80, Ember char shallows (mastery 10) earns 123% of the best fresh action of its kind
PASS  Mastery pays: at fishing 84, Deep ember char pool (mastery 5) earns 111% of the best fresh action of its kind
PASS  Mastery pays: at fishing 95, Dawn sturgeon shallows (mastery 10) earns 122% of the best fresh action of its kind
PASS  Mastery pays: at fishing 99, Deep dawn sturgeon pool (mastery 5) earns 111% of the best fresh action of its kind
PASS  Mastery pays: at runecraft 11, Spark stone (mastery 8) earns 90% of the best fresh action of its kind
PASS  Mastery pays: at runecraft 15, Ancient spark stone (mastery 8) earns 86% of the best fresh action of its kind
PASS  Mastery pays: at runecraft 20, Gale stone (mastery 7) earns 92% of the best fresh action of its kind
PASS  Mastery pays: at runecraft 24, Ancient gale stone (mastery 7) earns 92% of the best fresh action of its kind
PASS  Mastery pays: at runecraft 30, Tide stone (mastery 9) earns 96% of the best fresh action of its kind
PASS  Mastery pays: at runecraft 34, Ancient tide stone (mastery 6) earns 90% of the best fresh action of its kind
PASS  Mastery pays: at runecraft 40, Earth stone (mastery 10) earns 88% of the best fresh action of its kind
PASS  Mastery pays: at runecraft 44, Ancient earth stone (mastery 6) earns 81% of the best fresh action of its kind
PASS  Mastery pays: at runecraft 50, Moon stone (mastery 10) earns 124% of the best fresh action of its kind
PASS  Mastery pays: at runecraft 54, Ancient moon stone (mastery 6) earns 115% of the best fresh action of its kind
PASS  Mastery pays: at runecraft 65, Star stone (mastery 10) earns 124% of the best fresh action of its kind
PASS  Mastery pays: at runecraft 69, Ancient star stone (mastery 5) earns 112% of the best fresh action of its kind
PASS  Mastery pays: at runecraft 80, Ember stone (mastery 10) earns 123% of the best fresh action of its kind
PASS  Mastery pays: at runecraft 84, Ancient ember stone (mastery 5) earns 111% of the best fresh action of its kind
PASS  Mastery pays: at runecraft 95, Dawn stone (mastery 10) earns 122% of the best fresh action of its kind
PASS  Mastery pays: at runecraft 99, Ancient dawn stone (mastery 5) earns 111% of the best fresh action of its kind
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
Day 105 income 1,243,058 · food 68,533 (6%) · enlargement 15 costs 700,000
PASS  Day 105: a day's gold covers a day of food and enlargement 15
Day 120 income 1,151,011 · food 137,772 (12%) · enlargement 16 costs 750,000
PASS  Day 120: a day's gold covers a day of food and enlargement 16
Day 140 income 1,151,011 · food 137,772 (12%) · enlargement 17 costs 800,000
PASS  Day 140: a day's gold covers a day of food and enlargement 17
Day 160 income 1,151,011 · food 137,772 (12%) · enlargement 18 costs 850,000
PASS  Day 160: a day's gold covers a day of food and enlargement 18
Day 180 income 1,151,011 · food 137,772 (12%) · enlargement 19 costs 900,000
PASS  Day 180: a day's gold covers a day of food and enlargement 19
Day 200 income 1,151,011 · food 137,772 (12%) · enlargement 20 costs 925,000
PASS  Day 200: a day's gold covers a day of food and enlargement 20
Day 220 income 1,151,011 · food 137,772 (12%) · enlargement 21 costs 950,000
PASS  Day 220: a day's gold covers a day of food and enlargement 21
Day 240 income 1,151,011 · food 137,772 (12%) · enlargement 22 costs 975,000
PASS  Day 240: a day's gold covers a day of food and enlargement 22
Day 260 income 1,151,011 · food 137,772 (12%) · enlargement 23 costs 1,000,000
PASS  Day 260: a day's gold covers a day of food and enlargement 23
Day 280 income 1,151,011 · food 137,772 (12%) · enlargement 24 costs 1,000,000
PASS  Day 280: a day's gold covers a day of food and enlargement 24
Day 300 income 1,151,011 · food 137,772 (12%) · enlargement 25 costs 1,000,000
PASS  Day 300: a day's gold covers a day of food and enlargement 25
Costs at 70% of each day's net gold would be: 50000, 100000, 95000, 110000, 230000, 240000, 245000, 255000, 280000, 305000, 340000, 450000, 460000, 650000, 820000, 710000, 710000, 710000, 710000, 710000, 710000, 710000, 710000, 710000, 710000

Supply: can mining keep the forge fed?
Tier 1: smelting without pause needs mining 69% of the time on a fresh vein, 42% on a mastered deep seam
Tier 2: smelting without pause needs mining 63% of the time on a fresh vein, 39% on a mastered deep seam
Tier 3: smelting without pause needs mining 58% of the time on a fresh vein, 36% on a mastered deep seam
Tier 4: smelting without pause needs mining 53% of the time on a fresh vein, 33% on a mastered deep seam
Tier 5: smelting without pause needs mining 47% of the time on a fresh vein, 30% on a mastered deep seam
Tier 6: smelting without pause needs mining 45% of the time on a fresh vein, 28% on a mastered deep seam
Tier 7: smelting without pause needs mining 42% of the time on a fresh vein, 27% on a mastered deep seam
Tier 8: smelting without pause needs mining 39% of the time on a fresh vein, 25% on a mastered deep seam

The food loop (session 13)
Tier 1: Cooked perch heals 150 for 2 gold of worth (75.0 a gold); Bread 140 for 20 (7.0)
PASS  Tier 1: Cooked perch heals no more than half the health at Hitpoints 1
Tier 2: Cooked trout heals 330 for 4 gold of worth (82.5 a gold); Meat pie 320 for 50 (6.4)
PASS  Tier 2: home-cooked food heals at least 1.2 times the vendor's for its worth
PASS  Tier 2: Cooked trout heals no more than half the health at Hitpoints 10
Tier 3: Cooked pike heals 530 for 13 gold of worth (40.8 a gold); Hearty stew 600 for 110 (5.5); Pike pie heals 660 for 11
PASS  Tier 3: home-cooked food heals at least 1.2 times the vendor's for its worth
PASS  Tier 3: Cooked pike heals no more than half the health at Hitpoints 20
PASS  Tier 3: Pike pie wastes little of its healing
Tier 4: Cooked salmon heals 730 for 32 gold of worth (22.8 a gold); Hearty stew 600 for 110 (5.5); Salmon stew heals 910 for 28
PASS  Tier 4: home-cooked food heals at least 1.2 times the vendor's for its worth
PASS  Tier 4: Cooked salmon heals no more than half the health at Hitpoints 30
PASS  Tier 4: Salmon stew wastes little of its healing
Tier 5: Cooked moon carp heals 930 for 63 gold of worth (14.8 a gold); Roast fowl 1000 for 190 (5.3); Carp pie heals 1160 for 56
PASS  Tier 5: home-cooked food heals at least 1.2 times the vendor's for its worth
PASS  Tier 5: Cooked moon carp heals no more than half the health at Hitpoints 40
PASS  Tier 5: Carp pie wastes little of its healing
Tier 6: Cooked silver eel heals 1230 for 104 gold of worth (11.8 a gold); Roast fowl 1000 for 190 (5.3); Eel stew heals 1540 for 95
PASS  Tier 6: home-cooked food heals at least 1.2 times the vendor's for its worth
PASS  Tier 6: Cooked silver eel heals no more than half the health at Hitpoints 55
PASS  Tier 6: Eel stew wastes little of its healing
Tier 7: Cooked ember char heals 1530 for 162 gold of worth (9.4 a gold); Hunter's feast 1600 for 320 (5.0); Char pie heals 1910 for 149
PASS  Tier 7: home-cooked food heals at least 1.2 times the vendor's for its worth
PASS  Tier 7: Cooked ember char heals no more than half the health at Hitpoints 70
PASS  Tier 7: Char pie wastes little of its healing
Tier 8: Cooked dawn sturgeon heals 1830 for 243 gold of worth (7.5 a gold); Warden's feast 2300 for 480 (4.8); Sturgeon stew heals 2290 for 225
PASS  Tier 8: home-cooked food heals at least 1.2 times the vendor's for its worth
PASS  Tier 8: Cooked dawn sturgeon heals no more than half the health at Hitpoints 85
PASS  Tier 8: Sturgeon stew wastes little of its healing
PASS  Cooking recipes within 10% of their tier rate
Tier 1: an hour of Woodcutting sells for 698; an hour of Fishing, cooked and eaten, saves 14608 at the vendor
PASS  Tier 1: Fishing pays at least 80% of Woodcutting
Tier 2: an hour of Woodcutting sells for 1831; an hour of Fishing, cooked and eaten, saves 22686 at the vendor
PASS  Tier 2: Fishing pays at least 80% of Woodcutting
Tier 3: an hour of Woodcutting sells for 4361; an hour of Fishing, cooked and eaten, saves 28087 at the vendor
PASS  Tier 3: Fishing pays at least 80% of Woodcutting
Tier 4: an hour of Woodcutting sells for 9100; an hour of Fishing, cooked and eaten, saves 30246 at the vendor
PASS  Tier 4: Fishing pays at least 80% of Woodcutting
Tier 5: an hour of Woodcutting sells for 17853; an hour of Fishing, cooked and eaten, saves 36139 at the vendor
PASS  Tier 5: Fishing pays at least 80% of Woodcutting
Tier 6: an hour of Woodcutting sells for 27358; an hour of Fishing, cooked and eaten, saves 41917 at the vendor
PASS  Tier 6: Fishing pays at least 80% of Woodcutting
Tier 7: an hour of Woodcutting sells for 40802; an hour of Fishing, cooked and eaten, saves 48962 at the vendor
PASS  Tier 7: Fishing pays at least 80% of Woodcutting
Tier 8: an hour of Woodcutting sells for 58860; an hour of Fishing, cooked and eaten, saves 53827 at the vendor
PASS  Tier 8: Fishing pays at least 80% of Woodcutting
Supply: cooking without pause takes two fish and one log every three of the tier's units, so one Gathering lane fishing and the fire's second lane chopping half the time keep the Artisan lane cooking.

Supplies (session 14)
PASS  Hollow rat: with supplies, magic still wins
Hollow rat (magic, level 1): +3% XP an hour; supplies worth 0 an hour bring 32
PASS  Hollow rat: magic's supply pays for itself
PASS  Goblin slinger: with supplies, melee still wins
Goblin slinger (melee, level 3): +3% XP an hour; supplies worth 0 an hour bring 32
PASS  Goblin slinger: melee's supply pays for itself
PASS  Marsh wisp: with supplies, archery still wins
Marsh wisp (archery, level 5): +5% XP an hour; supplies worth 0 an hour bring 56
PASS  Marsh wisp: archery's supply pays for itself
PASS  Orc raider: with supplies, magic still wins
Orc raider (magic, level 14): +6% XP an hour; supplies worth 0 an hour bring 189
PASS  Orc raider: magic's supply pays for itself
PASS  Orc bowman: with supplies, melee still wins
Orc bowman (melee, level 18): +6% XP an hour; supplies worth 0 an hour bring 242
PASS  Orc bowman: melee's supply pays for itself
PASS  Grave wight: with supplies, archery still wins
Grave wight (archery, level 23): +8% XP an hour; supplies worth 333 an hour bring 554
PASS  Grave wight: archery's supply pays for itself
PASS  Hill troll: with supplies, magic still wins
Hill troll (magic, level 28): +4% XP an hour; supplies worth 330 an hour bring 381
PASS  Hill troll: magic's supply pays for itself
PASS  Fell huntsman: with supplies, melee still wins
Fell huntsman (melee, level 36): +6% XP an hour; supplies worth 616 an hour bring 1035
PASS  Fell huntsman: melee's supply pays for itself
PASS  Bog lurker: with supplies, magic still wins
Bog lurker (magic, level 41): +7% XP an hour; supplies worth 1156 an hour bring 1679
PASS  Bog lurker: magic's supply pays for itself
PASS  Reed stalker: with supplies, melee still wins
Reed stalker (melee, level 45): +10% XP an hour; supplies worth 733 an hour bring 2152
PASS  Reed stalker: melee's supply pays for itself
PASS  Drowned acolyte: with supplies, archery still wins
Drowned acolyte (archery, level 50): +5% XP an hour; supplies worth 987 an hour bring 1171
PASS  Drowned acolyte: archery's supply pays for itself
PASS  Mire hulk: with supplies, magic still wins
Mire hulk (magic, level 56): +7% XP an hour; supplies worth 1725 an hour bring 2071
PASS  Mire hulk: magic's supply pays for itself
PASS  Fen reaver: with supplies, melee still wins
Fen reaver (melee, level 61): +8% XP an hour; supplies worth 1092 an hour bring 2452
PASS  Fen reaver: melee's supply pays for itself
PASS  Bog witch: with supplies, archery still wins
Bog witch (archery, level 66): +7% XP an hour; supplies worth 1741 an hour bring 2294
PASS  Bog witch: archery's supply pays for itself
PASS  Ash troll: with supplies, magic still wins
Ash troll (magic, level 71): +11% XP an hour; supplies worth 2559 an hour bring 4587
PASS  Ash troll: magic's supply pays for itself
PASS  Peak slinger: with supplies, melee still wins
Peak slinger (melee, level 76): +8% XP an hour; supplies worth 1438 an hour bring 3333
PASS  Peak slinger: melee's supply pays for itself
PASS  Ash shaman: with supplies, archery still wins
Ash shaman (archery, level 81): +8% XP an hour; supplies worth 2466 an hour bring 3725
PASS  Ash shaman: archery's supply pays for itself
PASS  Obsidian golem: with supplies, magic still wins
Obsidian golem (magic, level 86): +11% XP an hour; supplies worth 3691 an hour bring 6412
PASS  Obsidian golem: magic's supply pays for itself
PASS  Sky reaver: with supplies, melee still wins
Sky reaver (melee, level 91): +12% XP an hour; supplies worth 2300 an hour bring 6443
PASS  Sky reaver: melee's supply pays for itself
PASS  Ember sorcerer: with supplies, archery still wins
Ember sorcerer (archery, level 96): +10% XP an hour; supplies worth 3654 an hour bring 5632
PASS  Ember sorcerer: archery's supply pays for itself
PASS  Fletching and Smithing supply recipes within 10% of their tier rate
PASS  Tier 3: a draw of runes sells for about what a vein's ore does (16 and 14)
PASS  Tier 4: a draw of runes sells for about what a vein's ore does (32 and 30)
PASS  Tier 5: a draw of runes sells for about what a vein's ore does (64 and 60)
PASS  Tier 6: a draw of runes sells for about what a vein's ore does (104 and 100)
PASS  Tier 7: a draw of runes sells for about what a vein's ore does (160 and 160)
PASS  Tier 8: a draw of runes sells for about what a vein's ore does (240 and 240)
Supply: an hour of Fletching makes arrows for two to three hours of fights at the same tier; an hour of Runecraft draws runes for three or more.

Expeditions and bosses (step 16)
PASS  the march, 1 h: 1,000 routes drawn, 1000 different
PASS  the march, 2 h: 1,000 routes drawn, 1000 different
PASS  the march, 4 h: 1,000 routes drawn, 1000 different
PASS  the march, 8 h: 1,000 routes drawn, 1000 different
PASS  the Sunken Fen, 1 h: 1,000 routes drawn, 1000 different
PASS  the Sunken Fen, 2 h: 1,000 routes drawn, 1000 different
PASS  the Sunken Fen, 4 h: 1,000 routes drawn, 1000 different
PASS  the Sunken Fen, 8 h: 1,000 routes drawn, 1000 different
PASS  the Ashen Peaks, 1 h: 1,000 routes drawn, 1000 different
PASS  the Ashen Peaks, 2 h: 1,000 routes drawn, 1000 different
PASS  the Ashen Peaks, 4 h: 1,000 routes drawn, 1000 different
PASS  the Ashen Peaks, 8 h: 1,000 routes drawn, 1000 different
the march, melee at 39: the lane's best 16281 an hour; runs 1 h 23753 (boss 100%), 2 h 22951 (boss 100%), 4 h 22727 (boss 100%), 8 h 23082 (boss 100%)
PASS  the march, melee, 1 h: a run pays at least the lane's best
PASS  the march, melee, 2 h: a run pays at least the lane's best
PASS  the march, melee, 4 h: a run pays at least the lane's best
PASS  the march, melee, 8 h: a run pays at least the lane's best
the march, archery at 39: the lane's best 12682 an hour; runs 1 h 22009 (boss 100%), 2 h 21676 (boss 100%), 4 h 21402 (boss 100%), 8 h 21313 (boss 100%)
PASS  the march, archery, 1 h: a run pays at least the lane's best
PASS  the march, archery, 2 h: a run pays at least the lane's best
PASS  the march, archery, 4 h: a run pays at least the lane's best
PASS  the march, archery, 8 h: a run pays at least the lane's best
the march, magic at 39: the lane's best 11638 an hour; runs 1 h 22584 (boss 100%), 2 h 21646 (boss 100%), 4 h 21177 (boss 100%), 8 h 20781 (boss 100%)
PASS  the march, magic, 1 h: a run pays at least the lane's best
PASS  the march, magic, 2 h: a run pays at least the lane's best
PASS  the march, magic, 4 h: a run pays at least the lane's best
PASS  the march, magic, 8 h: a run pays at least the lane's best
The Troll-chief of the hill: magic at 39 with food wins 100% (0.9 meals a fight); archery without food 0%
PASS  The Troll-chief of the hill falls to magic at the region's top, nine fights in ten
PASS  The Troll-chief of the hill beats archery without food more often than not
the Sunken Fen, melee at 69: the lane's best 30167 an hour; runs 1 h 52572 (boss 100%), 2 h 48647 (boss 100%), 4 h 47014 (boss 100%), 8 h 45222 (boss 100%)
PASS  the Sunken Fen, melee, 1 h: a run pays at least the lane's best
PASS  the Sunken Fen, melee, 2 h: a run pays at least the lane's best
PASS  the Sunken Fen, melee, 4 h: a run pays at least the lane's best
PASS  the Sunken Fen, melee, 8 h: a run pays at least the lane's best
the Sunken Fen, archery at 69: the lane's best 31128 an hour; runs 1 h 53584 (boss 100%), 2 h 49380 (boss 100%), 4 h 46881 (boss 100%), 8 h 46068 (boss 100%)
PASS  the Sunken Fen, archery, 1 h: a run pays at least the lane's best
PASS  the Sunken Fen, archery, 2 h: a run pays at least the lane's best
PASS  the Sunken Fen, archery, 4 h: a run pays at least the lane's best
PASS  the Sunken Fen, archery, 8 h: a run pays at least the lane's best
the Sunken Fen, magic at 69: the lane's best 27934 an hour; runs 1 h 50108 (boss 100%), 2 h 47956 (boss 100%), 4 h 45210 (boss 100%), 8 h 44975 (boss 100%)
PASS  the Sunken Fen, magic, 1 h: a run pays at least the lane's best
PASS  the Sunken Fen, magic, 2 h: a run pays at least the lane's best
PASS  the Sunken Fen, magic, 4 h: a run pays at least the lane's best
PASS  the Sunken Fen, magic, 8 h: a run pays at least the lane's best
The Drowned Warden: melee at 69 with food wins 100% (1.1 meals a fight); magic without food 0%
PASS  The Drowned Warden falls to melee at the region's top, nine fights in ten
PASS  The Drowned Warden beats magic without food more often than not
the Ashen Peaks, melee at 99: the lane's best 55187 an hour; runs 1 h 97081 (boss 100%), 2 h 88511 (boss 100%), 4 h 83597 (boss 100%), 8 h 81134 (boss 100%)
PASS  the Ashen Peaks, melee, 1 h: a run pays at least the lane's best
PASS  the Ashen Peaks, melee, 2 h: a run pays at least the lane's best
PASS  the Ashen Peaks, melee, 4 h: a run pays at least the lane's best
PASS  the Ashen Peaks, melee, 8 h: a run pays at least the lane's best
the Ashen Peaks, archery at 99: the lane's best 55702 an hour; runs 1 h 104102 (boss 100%), 2 h 95134 (boss 100%), 4 h 86261 (boss 100%), 8 h 83164 (boss 100%)
PASS  the Ashen Peaks, archery, 1 h: a run pays at least the lane's best
PASS  the Ashen Peaks, archery, 2 h: a run pays at least the lane's best
PASS  the Ashen Peaks, archery, 4 h: a run pays at least the lane's best
PASS  the Ashen Peaks, archery, 8 h: a run pays at least the lane's best
the Ashen Peaks, magic at 99: the lane's best 50248 an hour; runs 1 h 98638 (boss 100%), 2 h 89290 (boss 100%), 4 h 82610 (boss 100%), 8 h 80143 (boss 100%)
PASS  the Ashen Peaks, magic, 1 h: a run pays at least the lane's best
PASS  the Ashen Peaks, magic, 2 h: a run pays at least the lane's best
PASS  the Ashen Peaks, magic, 4 h: a run pays at least the lane's best
PASS  the Ashen Peaks, magic, 8 h: a run pays at least the lane's best
The Ember Wyrm: archery at 99 with food wins 100% (1.2 meals a fight); melee without food 0%
PASS  The Ember Wyrm falls to archery at the region's top, nine fights in ten
PASS  The Ember Wyrm beats melee without food more often than not
Relics: 4310 marks for every rank of every relic; 78 marks a day at the top; 55 days
PASS  Every relic at full rank takes two to four months of daily runs at the top
```
