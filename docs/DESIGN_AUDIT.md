# Game design audit, 27 November 2026

The whole game read against its three pillars (`docs/BRIEF.md`): does every part feed one climb, does the climb stay
logical and rewarding from the first minute to two years in, and where are the blind spots? Measured, not guessed:
the two-year simulation at seeds 11 and 14 (81 checks), a new two-year run of a player who never raises a castle,
the paper model (386 checks), session 268's two-week play-through of seven players, and the code read system by
system. Fixes made in session 269 are marked **Fixed**; the rest are decisions or a watch list for the closed test.

## 1. The shape of the climb

| Stretch | What carries it | Measured |
| --- | --- | --- |
| First hour | First steps, the first levels, finds, the castle opening at total level 30 | A moment every 0.5 min on day 1; first level under a minute |
| Weeks 1 to 4 | Tiers 2 to 4, the steading's first raisings, bosses from day 6, troops' second evolution | 218 deeds in the first quarter; a moment every 1.1 min on day 7 |
| Months 2 to 8 | Tiers 5 to 8, lucky actions, the Fen and the Peaks, relics, the year's companions | 84 to 88 deeds a quarter; a first on every day but one |
| The 99s | Combat about day 237, Artisan about day 303, Gathering about day 336 | Every skill at 99 on day 334 to 344 (target 365) |
| Year two | Kindlings, the Deep, the steading's later stages, seasons, Castle Clash's legend, tiers and temperings | A first every week, the longest wait 6 days; every currency spent each quarter |

The climb holds every pacing target. Every level of every skill opens something (1,089 levels); each tier offers two
choices within 20% (the paper model); mastery still pays ten levels on.

## 2. How the parts feed each other

| Currency or store | Comes from | Goes to |
| --- | --- | --- |
| Gold | Sales, fights, caches, the pedlar, the quartermaster | Food, the Storehouse, the steading, the castle (levels and treasury), the realm's work |
| Materials | Gathering and Artisan lanes, fights' drops | Artisan recipes, the steading, the castle's buildings (a quarter of a level), the pedlar, the realm's work |
| Uncommon finds | Shared luck across every lane | The steading's sixth to tenth stages, feasts, the pedlar, Sell finds |
| Rare finds | Each skill's actions, bosses | Mastery (500 completions), tempering and heirlooms (bosses'), Sell finds once spent |
| Expedition marks | Runs, bosses, bounties, the realm's boss | Relics, the Deep's relics (no last rank), the quartermaster |
| War marks | Castle Clash | War relics, tempering, studies, charters (which lift skills and fights) |
| Deed points, favour, Kindlings, weeks kept | Deeds, the pedlar, XP past 99, the week's contract | Titles, banners, frames, the plaque |

Every store has a source and a sink, and the two-year run spends every currency in every quarter of year two.

## 3. Findings

### A blind spot: the steading's finds came from nowhere the player could see (Fixed)

The steading's sixth to tenth raisings ask for 60 to 360 of each of a work's two Uncommon finds ("Wild herbs ×240").
Uncommon finds come only from their own skill's actions (wild herbs from Cooking, goose fletchings from fights with
Archery), yet the work's sheet named the find and the count held, nothing of where it is found. A player at 99 who
had left Cooking would never meet another wild herb. The two-year player showed it: four of six works stalled for
good, the Smokehouse on 0 of 240 wild herbs. **Fixed:** a find still short says where it comes from, in the collection
log's words ("Any Cooking action", "Any foe fought with Archery", "…, tier 3 and up" for a greater find); the
simulation's player at 99 now goes back to the skills its works wait on, and all six works reach their height by
about day 450, four of them in year two, with every year target held.

### Castle Clash carries year two (decided: kept, and watched)

A player who never raises a castle was played for two years. Year one is barely changed. Year two is thin: something
new on 18 to 32 days of each quarter against 39 to 52 with a castle, with gaps of up to 15 days, carried by Kindlings
(about one every five days), seasons and the Deep; gold settles near 28M with the realm's work as its only sink. The
castle is built to be the endgame (session 36), opens twenty minutes in, is played solo (strongholds, the fortress,
the legend: no other lord is needed) and is asked for daily on the Hearth. Adding deeds to fill the gap would be the
filler session 180 rejected. Decided: Castle Clash stays the year-two engine; the closed test asks any tester who
leaves the castle unraised why, and the answer decides whether year two needs a path of its own.

### Active play counts little toward the climb (by design, watched)

The light player (fifteen minutes a day) reaches every 99 within five to ten days of the steady player (an hour a
day). An active hour pays about 1.5 times an hour away, which over a whole day is a few percent. Active play's worth
is elsewhere: the daily round (13 presses), Uncommon luck guaranteed only while the fire burns, bosses, the pedlar,
the castle's battles, the moments. This is the idle genre's bargain; the pillar asks that coming back "feels worth
it", which the round and the recap answer. Watched in the closed test.

### Rhythms against "a timer never gates"

The brief forbids gating progress by waiting alone. The climb never waits. The daily and weekly rhythms (boss fights,
the realm's strike, the pedlar, the week's contract, the legend's chambers) are rewards on a calendar, and the brief's
own Pull target asks for something to finish every day, week and season. Days missed bank boss fights and strikes
(session 253), so a friend who plays every other day is not left behind. The one place a goal waits on the
calendar is the legend's weekly chamber, chosen in session 222 to give year two a weekly first.

### The brief had fallen behind the game (Fixed)

It promised finds at 1 in 5,000 (Legendary has been 1 in 60,000 since session 24) and a realm's boss needing four
strikes for each player of the week before (three for each striker, four at least, since session 198). Both lines now
say what the game does and when it changed.

### Smaller observations, kept

- Combat reaches 99 about a hundred days before Gathering; its Kindlings, the Deep, elite bounties and the legend
  carry those months.
- A veteran's Next up can hold a dozen rows on a full day; it scrolls inside its panel and leads with rewards.
- Deeds fall to a handful a quarter in year two, while firsts hold weekly (Kindlings and the castle).
- Paths at 99 are free to change: a choice without a cost, kept because each Path acts continuously, so switching
  is a small optimisation, never an exploit.

## 4. Watch list for the closed test

1. Any tester who leaves the castle unraised after a week: why, and what they aim for instead.
2. Whether a tester at a work's sixth stage follows its source line back to the skill.
3. Whether the light pattern (a few minutes twice a day) feels it is keeping up.
4. Whether a veteran's Next up reads as a list of things to do or a wall.
