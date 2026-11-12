# Idle Clash: the page map (IA)

Session 0 · October 2026. This file is the contract between the shell and the features. The shell owns pages and their layout; features fill named slots with data; shared components draw it. A feature never adds a page, and a new page or menu entry is the owner's decision. `pnpm verify` checks that every slot a feature fills is listed here.

## 1. The menu

Six entries, in this order (the sixth, Castle Clash, the owner's choice in session 28):

| Entry | Page | What it answers |
| --- | --- | --- |
| Hearth | Home | What is happening, what happened while I was away, and what do I aim for next? |
| Skills | The seven skills and each skill's page | What can I do, and what does the next level give? |
| Combat | Gear, foes, food | What should I fight, with what, and what are my odds? |
| Storehouse | Items, the vendor, the collection log | What do I have, where does it come from, and what is it for? |
| Castle Clash | A castle of your own: its edict, troops, sieges and spies (opens at total level 100) | What does my castle give me, and whom can I challenge? |
| Hiscores | Ladders and who is online | How do I compare? |

Outside the menu:

- **The notices tray**: a bell in the header with a count of new notices and unread messages. Two tabs: Notices (lane stops, goals claimed, the away recap) and Messages (session 45).
- **The account menu**: behind the account button. Settings, privacy, terms, sign out, and (session 9) delete account.
- **The tour**: a short overlay on first visit, pointing at slots by name, never at layout classes.
- **Closing what opens (session 42, the owner's rule):** every popup (a sheet, a moment of any size, the tour's card) closes from a cross in its top right; verify fails a popup without one.

## 2. The shell

Built at 320 px first. Three widths are specified and checked: 320, 390 and 1,440 px. Container queries decide each section's arrangement; the page never scrolls sideways.

### Phone (320–767 px)

```
┌──────────────────────────────────────┐
│ ▣ Idle Clash   🔥 4:12   ⚜ 12,400  🔔 ◯│  header, 48 px: fire, gold, tray, account
├──────────────────────────────────────┤
│                                      │
│              page content            │  scrolls
│                                      │
├──────────────────────────────────────┤
│ [🪓 Oak tree ▓▓░] [⚒ Iron bar ▓░░]   │  lanes strip, 44 px: one chip per running lane;
│ [⚔ Grave wight ▓▓▓] [⛏ Iron vein ▓░] │  wraps to two rows when four lanes run; tap opens the lane sheet
├──────────────────────────────────────┤
│ Hearth Skills Combat Store Castle Hiscores│  menu, 56 px, icons with short labels
└──────────────────────────────────────┘
```

### Desktop (1,024 px and wider)

```
┌────────┬────────────────────────────────────────────┬──────────────────┐
│ Idle   │ 🔥 The fire burns · 4:12      ⚜ 12,400   🔔 ◯ │                  │
│ Clash  ├────────────────────────────────────────────┤  Lanes           │
│        │                                            │  ┌─────────────┐ │
│ Hearth │                                            │  │ Gathering   │ │
│ Skills │               page content                 │  │ Oak tree ▓▓░│ │
│ Combat │                                            │  └─────────────┘ │
│ Store- │        max 880 px, centred in the column   │  ┌─────────────┐ │
│ house  │                                            │  │ Artisan …   │ │
│ Hiscor.│                                            │  └─────────────┘ │
│        │                                            │  (Combat, and the│
│        │                                            │  fire's lane)    │
└────────┴────────────────────────────────────────────┴──────────────────┘
  rail 200                                               lanes panel 320
```

Between 768 and 1,023 px the rail collapses to icons (64 px) and the lanes panel becomes the phone's lanes strip under the header.

### Slots the shell owns

| Slot | Where | Filled by | Drawn with |
| --- | --- | --- | --- |
| `shell.fire` | Header | the fire | FireBadge |
| `shell.gold` | Header | storehouse | Pill |
| `shell.tray` | Header | notices | TrayButton |
| `shell.lane` (×4) | Lanes strip or panel | each lane's current feature | LaneCard (compact on phones) |
| `shell.moment` | Over everything but the tour, an open sheet included (session 69), centred or as a banner | any feature, through events | Moment |
| `shell.deeds` | Not drawn: deeds done and not yet recorded, which the shell asks the server to record wherever the player is | deeds | Moment, through events |

## 3. Pages

Each page lists its sections in order, what must be visible without scrolling at 390 × 844 and at 1,440 × 900, and what a newcomer sees before anything unlocks. Verify opens every view as a newcomer, with every built feature switched on, and checks it at 320, 390 and 1,440 px. Density rules from the brief apply everywhere: no full-width section holding one or two lines, no scroll when the content would fit, one control drawn one way.

### Hearth

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 0 | `hearth.standing` | goals | Over the region's banner: your picture in its frame and glow (session 43), your rank with your badge and title, your total level, and a thin bar to the next rank ("Warden of the March at 200") |
| 0 | `hearth.plaque` | deeds | The standing's plaque wears your honours: your title after the rank, your banner's colour on its edge, your frame around it |
| 1 | `hearth.today` | the shell (welcome), recap | On return: the away recap, best thing first (five at most), then what the castle met meanwhile (a siege or a spy against it, up to three: session 66) and any lane that stopped, then "Collect". Otherwise: today's notable moments as a compact timeline |
| 2 | `hearth.goals` | goals | First steps while unfinished (six rows with buttons); afterwards three short goals (the lanes' own work, so play finishes them; a suggestion only when every lane's has one), the daily goal (a day's goal done while away waits here, ready, until claimed) and the next milestone, each with a progress bar and its reward |
| 3 | `hearth.lanes` | each lane | Full lane cards with their Next action; on desktop the lanes panel already shows them, so this section is omitted |
| 4 | `hearth.nextUp` | every skill | The three nearest unlocks across all skills: "Woodcutting 21: Practised hands IV, 3,400 XP away" |
| 5 | `hearth.steading` | steading | Shown once the player holds the first work's gold or has built one. The six works as tiles: each with what it gives in a few words ("+6% items"), five segments for its raisings, and "Ready to raise" when its next raising is held in full. A tile opens its sheet. Built works appear in the region's banner beside the forge |
| 6 | `hearth.work` | steading | A work's sheet (`?panel=work&work=…`): how far it is raised, what it gives now and what its next raising adds, each part of the cost beside how many are held (a part not held in ember), and Build or Raise; a raising is answered by a toast ("Woodyard raised: 4 of 5", what it now gives; fully raised, a banner: session 76) |

- **At 390:** the recap or Today (first 3 rows), then the goals ladder's first two rows. **At 1,440:** Today, the goals ladder and Next up side by side (two columns from 720 px of content width), and the steading below Next up, its works three to a row.

**Visible without scrolling** (checked by verify at 390 × 844 and 1,440 × 900; a slot no built feature fills yet is skipped):

| View | 390 × 844 | 1,440 × 900 |
| --- | --- | --- |
| / | `hearth.today`, `hearth.goals` | `hearth.today`, `hearth.goals`, `hearth.nextUp` |
- **Newcomer:** no recap; Today reads "Welcome to the march"; the goals ladder shows First steps with the first button highlighted by the tour.

### Skills

The list, then one page per skill (`/skills/woodcutting`).

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `skills.list` | every skill | One tile per skill (eleven since session 14): seal (with a flame for each Kindling, up to five), name, level, a progress bar to the next level (past 99, to the next Kindling), and the next unlock. Grouped by lane: Gathering (Woodcutting, Mining, Fishing, Runecraft), Artisan (Smithing, Cooking, Fletching), Combat; an odd lane's last tile takes the whole row |
| — | **A skill's page** | | |
| 1 | `skill.header` | that skill | Seal, level, XP to next, the next unlock and how far away it is; past 99, the bar runs on to the next Kindling and the seal wears its flames |
| 2 | `skill.actions` | that skill | ActionRow per action or recipe: name, level, seconds, XP an hour (what the lane pays now, every gain counted: the fire, marks, the relic, the steading, the edict, a Path; session 47), what it gives or takes (what a repetition pays on average where perks, the Woodyard or Bounty pay more than the base, "Ancient logs ×3.2 on average", or plainly when the extra is whole: session 70; and, for food, what each heals in your fights; session 50), mastery step and bar, Start and Queue next. One tier at a time, under tabs: every tier opened so far and the next one (Tier 1 to 8 over the climb), opening on the newest tier with something open; the next tier's locked actions show their level, never hidden. Each tier's tab carries its resource's icon; when "Tier 1 … Tier 8" will not fit, the tabs show the icons alone and share the width (the name kept for screen readers and on hover), never scrolling sideways |
| 3 | `skill.finds` | that skill | The six finds, found (with the date) or silhouetted (with where it comes from: "Any Mining action" or "Tier 3 and up" for a skill, "Any foe fought with Melee" or "Foes of tier 3 and up" for a combat style: session 83), with their rarity |
| 4 | `skill.ladder` | that skill | The unlock ladder 1–99, the current level marked, past unlocks muted; below 99, a line beneath it says what waits at the top (a Path, and Kindlings) |
| 5 | `skill.kindling` | kindling | From level 99, above the ladder: Kindling, with how many times the skill has been kindled, and the three Paths (Bounty, Lore, Fortune), each with its emblem and what it gives now, one marked Walking; Take this Path on the others and Leave the Path on it, free and changed whenever the player likes. Hitpoints takes no Path and says why |

- **At 390:** the header and the current tier's actions; the finds come before the long ladder. **At 1,440:** the header, the current tier's actions with the finds under them, and the ladder beside them.

**Visible without scrolling** (checked by verify at 390 × 844 and 1,440 × 900; a slot no built feature fills yet is skipped):

| View | 390 × 844 | 1,440 × 900 |
| --- | --- | --- |
| /skills | `skills.list` | `skills.list` |
| /skills/woodcutting | `skill.header`, `skill.actions` | `skill.header`, `skill.actions`, `skill.ladder` |
| /skills/mining | `skill.header`, `skill.actions` | `skill.header`, `skill.actions`, `skill.ladder` |
| /skills/smithing | `skill.header`, `skill.actions` | `skill.header`, `skill.actions`, `skill.ladder` |
- **Newcomer:** Woodcutting's page opens on Tier 1: Pine tree ready and Old pine with its level; the other tiers are a tap away, and the ladder opens at level 1.

### Combat

Two tabs under the title: **Fight** (`/combat`: the loadout, the foes and the food) and **Expeditions** (`/combat/expeditions`, session 16).

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `combat.loadout` | combat | The gear worn on a figure of a person: the helm on the head, the body on the chest, the legs on the legs, the weapon in the right hand and the style's supply in the left (each a tile with the piece's icon, named for screen readers and on hover; an empty one names its slot; the supply's leads to the skill that makes it). Beside the figure (below it on a narrow panel): your style with its seal, the triangle as it bears on you (slot 4), health, the food carried (session 52: a small tile of icon and count for each food, in the order a fight eats them, each naming what it heals and opening its item panel), and the supply in use with its damage. Each slot opens a sheet of the matching gear in the Storehouse to wear or take off, each piece saying what it does in a fight ("Melee: +30 max hit", a weapon naming the style wearing it changes to, session 80; "10% less damage taken"; session 51); an empty weapon slot with nothing to wear leads to Smithing |
| 1a | `combat.arena` | the page | In the Foes panel, above its foes, while the Combat lane fights (session 42): the fight played out swing by swing, the very one the engine settles (its seed): you with your weapon and health, the foe with theirs, each bar easing down as a hit lands; each swing's number rising once over the side it lands on (a miss says Miss; a critical hit, the top tenth of rolls, larger and in gold; a meal in moss); the swing in words beneath; Slain stamped over a fallen foe. In time with the lane (session 46): each exchange shows your swing half a swing before the foe's answer, the fight opens on the breather as the two square up, the felling blow lands half a swing before the lane ends and pays, and the loadout's health is the fight's own while it lasts. Shown over the foe's own region and tier (the page opens there when none is asked for); on another tab, one line says where the lane is fighting, with Watch the fight; a boss fought in the lane plays out over the bosses instead |
| 2 | `combat.foes` | combat | One region at a time, under tabs across the top of the page (the march, the Sunken Fen, the Ashen Peaks; every region shown, so the next is always in view), and in it one tier at a time under tabs (the newest with a foe open first). One row per foe: icon, name, style (as a word, never colour alone), level, the triangle against your style, Your odds verdict with XP, food and gold an hour (as the lane pays them now: XP with every gain the skill pages count, gold with a Path of Bounty and an Edict of Harvest; session 47), Fight and Next. Locked foes show the Hitpoints level that opens them; without a weapon each says to wear one. With no region or tier asked for, the page opens on the foe the lane is fighting (session 46) |
| 3 | `combat.food` | storehouse | The vendor's two best foods for your Hitpoints and the next to open, one short row each: icon, name with how many you carry, what it heals in your fights (Hitpoints' perks, the hearthstone and the Smokehouse counted; session 50) and costs, and Buy 10; an older food still carried stays listed |
| 4 | `combat.triangle` | combat | Inside the loadout, never a box of its own: what your style beats and loses to, each with its seal; without a weapon, the whole key (Melee beats Archery, Archery beats Magic, Magic beats Melee) |
| 5 | `combat.expedition` | expeditions | Expeditions: your marks; while no run is under way, the last run home (its boss, when, and its story: session 74); tabs for the region (each with its vista) and the length (1, 2, 4 or 8 h); the route that run would take (a line saying how long, how many fight stages and which boss; its twists, each with what it changes; the route as a ribbon, an hour a row: each stage's foe, any cache or camp, the fork, the boss); and the fork's two roads, each with what it changes and a button that sets out by it. Once set out: the run's region, length and road, its twists, a bar and "Stage 4 of 12", the ribbon with the stages done faded and the one under way ringed, the marks so far, and Carry on or Give up (which asks first) |
| 6 | `combat.bosses` | expeditions | Expeditions: each boss, one row: icon, name, region, style, how often beaten, and Your odds or why not now (opens at a Hitpoints level, or fought today), with Fight once a day. A boss fought in the lane is played out above them, as the arena plays a foe (session 46); its end is a moment and a notice ("The Troll-chief of the hill beaten", what it paid; the first fall in the centre), and Fight from the middle of another fight queues that fight next, so the lane goes back to it (session 72) |
| 7 | `combat.relics` | expeditions | Expeditions: your marks, and each relic, one row: icon, name, what it gives at its rank (or, at rank 0, what each rank gives: "+1% Woodcutting XP a rank"; session 85), its rank, and Raise for its next rank's marks; fourteen rows scroll inside their own box |

- **At 390:** the loadout (the figure with your style, triangle and health beside it) and the first foes. **At 1,440:** the loadout with the food under it, and every foe of the tier beside them.
- **Expeditions at 390:** the run (or the route to choose), then the bosses and the relics. **At 1,440:** the run beside the bosses and the relics.
- **A run's homecoming** has its moment (the boss beaten takes the centre, otherwise a banner) and its story in the away recap and the notices: "Home from the Sunken Fen: the Drowned Warden beaten. Took the high pass, beat the Drowned Warden, found a sunken locket. 18 marks."
- **Region and tier tabs** never scroll: on a narrow screen the regions shorten (March, Fen, Peaks) and the tiers show their first foe's icon, sharing the width.

**Visible without scrolling** (checked by verify at 390 × 844 and 1,440 × 900; a slot no built feature fills yet is skipped):

| View | 390 × 844 | 1,440 × 900 |
| --- | --- | --- |
| /combat | `combat.loadout`, `combat.foes` | `combat.loadout`, `combat.foes`, `combat.food`, `combat.triangle` |
| /combat/expeditions | `combat.expedition` | `combat.expedition`, `combat.bosses`, `combat.relics` |
- **Newcomer:** an empty weapon slot reading "Forge a weapon in Smithing" that leads there; the hollow rat says "Wear a weapon first", and shows "Fair" once the sword is worn with First steps' ten loaves.
- **Combat skills' pages** (Melee, Archery, Magic, Hitpoints) have no actions of their own: in place of the actions, "Trained by fighting on the Combat page" and Go to Combat; the ladder and finds as for any skill.

### Storehouse

Tabs: Items · Collection log.

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `store.capacity` | storehouse | Slots used of total, Enlarge with its price |
| 2 | `store.items` | the shell, asking every feature (the storehouse adds space and selling in session 9) | A grid of items with counts, grouped by kind (resources, gear, food, finds); tap opens the item panel |
| 3 | `item.panel` | the shell, and every feature through queries (its content) | Name, icon at 96 px, count, what a food heals in your fights (session 50) or what gear does in one (session 51), sale price, Sell (one, ten, all but one; all but one first asks, saying what the sale comes to and what a running lane uses it for: an artisan's ingredient, a fight's food or supply, session 71; and every sale says what it brought in), Wear for gear; for a Rare find, Use on one of its skill's actions (500 mastery completions), most used first; **Comes from** and **Used in**, each answered by asking every registered feature (a Rare find's Used in names its mastery use; session 53) |
| 4 | `collection.log` | every skill (its six finds) | 36 entries by skill, found or silhouetted, with first-find dates and progress per skill |

- **At 390:** capacity and four rows of the grid; the item panel opens as a sheet. **At 1,440:** capacity, the full grid, and the item panel docked at the right of the content.

**Visible without scrolling** (checked by verify at 390 × 844 and 1,440 × 900; a slot no built feature fills yet is skipped):

| View | 390 × 844 | 1,440 × 900 |
| --- | --- | --- |
| /storehouse | `store.capacity`, `store.items` | `store.capacity`, `store.items` |
| /storehouse/log | `collection.log` | `collection.log` |
- **Newcomer:** capacity 0 of 24 and an empty grid reading "Logs and ores you gather land here".

### Castle Clash

The owner's castle system (`docs/castle-clash/`), between Storehouse and Hiscores. It opens at total level 100; before that the page says how far there is to go and what a castle brings. At 100 a lord raises their castle here. Then five tabs under the title: **War** (`/castle`, first: every battle of the day, open from the first day; session 40), **Army** (`/castle/army`), **Citadel** (`/castle/citadel`), **Halls** (`/castle/halls`: the War College and the Reliquary, where war marks are spent, opening with the first war mark; until then the header says so) and **Reports** (`/castle/reports`, session 42: every battle and spy's errand as a report card, with filters). The tabs' addresses before session 40 (`/castle/garrison`, `/castle/war-room`, `/castle/incursions`) lead to the tab that holds what they held.

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `castle.lead` | the page | Before a castle: total level against 100 with its bar, what a castle brings in three lines, and Raise your castle at 100 |
| 1a | `castle.banner` | the page | Above the header on every tab (session 41): the lord's castle in the march, as raised: its walls' material by the walls' level (timber, rough stone, dressed stone, iron-capped, white stone and gold), the keep's storeys by the castle's average level, towers and from level 50 beacons by the watchtower's, the edict in force flying on the keep, cracks and breaches below full walls, and fires and a foe's camp for six hours after a siege; night in the dark theme. Cropped so the castle fills a phone's banner and the march shows on a wide one |
| 2 | `castle.header` | the page | Above every tab, in two short rows: AP of the cap with its bar, the Call to arms (with the AP it brings) or Answered today, and the streak; pills for the rating, war marks, this week's decree, a shield and vigilance; then `castle.orders`; why the last action was refused, or what opens the tab shown |
| 2a | `castle.orders` | the page | In the header (session 40): the orders of the day, how many of three are done (or all done), each order with how far along it is and ticked once done, and what they pay (war marks each, more for all three) |
| 3 | `castle.edict` | the page | Citadel: the three edicts, each with its banner,  what it lifts now, the one in force (or the treasury it needs) |
| 4 | `castle.treasury` | the page | Citadel: what the treasury holds and what of it is raidable, what an edict needs and costs, this week's decree, Top up (to half again what the edict needs) in one press, the amount with Deposit and Withdraw (a fifth lost; barred after a scouting), whether costs come from the purse or the treasury |
| 5 | `castle.buildings` | the page | Citadel: walls, deep vault, beacon tower and spy guild, each with its icon, its level, what it does and Raise for its gold; the walls' integrity and Repair |
| 6 | `castle.dig` | the page | Citadel: the deep foundations' depth, its multiplier on the edict and AP, and Dig |
| 7 | `castle.units` | the page | Army: the three troops by their evolution's name and drawing, level, drill and the next evolution, Drill (once or five times) and Raise; wounds and Heal |
| 8 | `castle.college` | the page | Halls: the War College's four studies, each with its icon, rank of ten, what a rank gives, Study for gold and war marks |
| 9 | `castle.offense` | the page | Army: the standing attack formation (used against a lord not scouted; against a known foe every attack is set against it), presets (Even, Shield wall, Lancers, Siege train), each share stepped by five, the flank warning past 60%, Save (free) |
| 10 | `castle.defense` | the page | Army: the garrison, as the attack's, Save for 1% of the required treasury, then two hours' rest (pinned after a scouting) |
| 11 | `castle.trap` | the page | Army: the three traps, the one set, Choose |
| 12 | `castle.castellan` | the page | Army: the three castellans and what each does, Choose |
| 13 | `castle.incursion` | the page | War, first: the fortress at your tier with its arms, its tier, the chance to win in the formation set against it, what taking it gives, its garrison and trap, and Assault; the battle's result lands on its row (`castle.fought`) |
| 14 | `castle.strongholds` | the page and the server | War: the day's five mercenary strongholds, easiest first, each with its arms, its rating, the chance to win in the formation set against it (or, where no roll can take it, "Beyond you for now: no roll takes it" with Siege closed: session 75), what taking it pays (the harder more) and Siege with its fee and AP, or Fallen and when once taken; how many of five have fallen, or Routed; a line saying a stronghold falls until tomorrow and five make a rout |
| 15 | `castle.targets` | the page and the server | War: lords to challenge, once the castle averages level 5 (until then a line saying so): up to five near your rating (a fresh five each day), then any lord who besieged you in the last day (Struck you, with Strike back). Each row: the lord's arms, their rating, the chance to win (about, once scouted, in the formation set against them), what a breach brings, how it stands today (sieged once, twice, shielded), Plan, and Siege (or Scout, before the first scouting) |
| 16 | `castle.fought` | the page | On the row a battle was fought from (session 40), until the next: your arms and theirs at either end of one bar, your attack pushing in from the left against their defence until they meet where the battle stood (session 41); then won or lost in a word, what it brought (Routed for the fifth stronghold), and The battle (its account) |
| 17 | `castle.reports` | the server | Reports (session 42): every siege, defence, stronghold, fortress and spy's errand as a card, newest first under its day (Today, Yesterday, the date), filtered by All, Sieges, Defences, Strongholds or Spies (`?show=…`). A card: the two sides' arms with the attacker on the left (a spy's mission icon between them, crossed blades for a battle), the outcome in a word (moss when it went your way, red when not), what happened in a line, attack against defence on one bar, what it moved with its icons (gold, war marks, gold lost), and when; it opens the account |
| 17a | `castle.latest` | the server | War: the latest three report cards, and All reports (the Reports tab) |
| 18 | `castle.target` | the page | A lord's sheet (`?panel=target&target=…`): their arms, their rating, Their profile (their card, session 44), a scouting's findings, the plan, what a breach brings, the siege with its fee and AP (or why it cannot go; sent, the sheet closes and its result lands on their row), the four spy missions, the last reports about them, and `player.report` at its foot |
| 19 | `castle.account` | the server | A battle's account (`?panel=report&report=…`), over any tab, drawn as a report (session 42): the two sides' arms face to face over the outcome in a large word, their names and when; then the battle: attack and defence meeting on one bar with their numbers, the day's fortune, the ratio on a scale with the breach and decisive lines marked, the formation as three shares on one bar (for a defender, the one that came at them); a spy's findings; what came of it with its icons, the fee and the walls; for a lord, Strike back or Plan another siege |
| 20 | `castle.missions` | the page | In a lord's sheet: the four spy missions, what each does, the chance, Send; a mission sent says how it went in a toast ("Scout the castle: Keeper", Done unseen or Caught: session 69) |
| 21 | `castle.plan` | the page | In a lord's sheet: the formation the attack goes in (set against the garrison known) and its chance to win (about: from their rating, the scouting and your own spies' sabotage) |
| 22 | `castle.relics` | the page | Halls: the nine war relics, each drawn (in grey until forged), level of five, what each gives, Forge or raise, Wear and Take off, worn of three; at the last level, its tempers and how much stronger they make it, and Temper with its chance and cost (a temper that does not take says so on its row) |

- **At 390:** the banner, the header, then each tab's panels in one column (the War: the fortress, the strongholds, the lords, then the latest reports). **At 1,440:** the banner and the header across, the tab's panels in two columns (the War's latest reports on the right; the Reports tab in one).
- **Elsewhere:** until the day's Call to arms is answered, the Hearth's Next up leads with it, linking here. The edict in force shows as a gold pill beside a skill's level on its page (Vigor's XP, Fortune's finds) and under Combat's tabs (any edict, Harvest's fight gold too). Castle Clash's deeds are on the Combat tab of Deeds.

**Visible without scrolling** (checked by verify at 390 × 844 and 1,440 × 900; a slot no built feature fills yet is skipped):

| View | 390 × 844 | 1,440 × 900 |
| --- | --- | --- |
| /castle | `castle.lead` | `castle.lead` |
- **Newcomer:** total level against 100 and what a castle brings. **Three weeks in:** Raise your castle. **Two months in:** every tab of a raised castle, with a rival lord who struck it, the day's strongholds (one fallen), the orders of the day, reports, relics and a battle's account.

### Hiscores

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
Two tabs under the title: **Ladders** (`/hiscores`) and **Deeds** (`/hiscores/deeds`, session 15).

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `hiscores.online` | server | Ladders: how many are playing now |
| 2 | `hiscores.ladder` | hiscores | Ladders: tabs for Total, each skill and Castles (session 38: castles by rating, which only rises, with each castle's level; Castle Clash's glyph; where the tabs are icons alone, under 720 px, the ladder shown is named above its table: session 82), each with its seal (on a phone, when the names will not fit, the seals alone, sharing the width; beside the ladder on wide screens); rank, name, level, XP; each name with its picture (session 43), its banner's pennant and its title beneath with its badge (on a skill's ladder, how many times it is kindled); your own row pinned. A player joins the ladders once one of their actions comes half an hour or more after their first: until then they see their own place pinned beneath, as any row below the top is, and no page states the rule. A climb into a better band of places (the top 100, 50, 10 or 3, or first; session 49) is a moment, and a notice that leads to that ladder |
| 3 | `hiscores.honours` | deeds | Deeds: your honours. Deed points and title on your banner's colour in your frame, deeds done by tier, the bar to the next title by points, and Choose honours |
| 4 | `hiscores.deeds` | deeds | Deeds: tabs Next up, Skills, Work, Combat, Finds, Home (short labels on a phone). Next up lists the six deeds nearest to done (by what the player has done towards each, what every new save starts with counting as nothing: session 73) and the six done last; each other tab, its families (Levels, Foes, the fire…) as panels of rows, each row a skill or a foe with a medallion for each deed, ringed in its tier's colour and filled when done |
| 5 | `hiscores.deed` | deeds | A deed's sheet (`?panel=deed&deed=…`): its medallion, tier and points, its text, its progress or the day it was done, and what it unlocks. A hidden deed shows only that it is hidden |
| 6 | `hiscores.choose` | deeds | Choose honours (`?panel=honours`): the thirty pictures first, as a grid (the one shown ringed in woad; those not open in grey, how they open said beneath, and a foe's with how many are slain, "47 of 100": session 77), then every title, badge, frame, glow, banner and scene (session 43), each with its look beside its name, those open first with Show, the rest saying how they open |
| 7 | `player.profile` | the server | A player's profile card (`?panel=player&name=…`, session 44), over any page: opened from a name on any ladder, a lord's name in a battle's account, and Their profile on a lord's sheet. The scene they show (the march by day or night, or their castle drawn from its level) edged in their banner's colour, their picture in its frame and glow over its foot; their badge and title (or No title shown) and how long they have played; their career as figures (total level, deed points, deeds done of all, titles earned, Kindlings, foes slain, bosses beaten, expeditions home); once they are listed, their places on the hiscores (session 54: Total, then their three best skills, the best first); once they have a castle, its level, rating, fortresses and routs, and their war record for all time as won against lost on one bar each (sieges, defences, strongholds, spies' errands) with the enemy spies they caught; for someone else, `player.report` |
| 8 | `player.report` | the page | Report this player, in a player's sheet and a lord's sheet in the War room: Offensive name and Cheating or abuse, no words of one's own; once sent, Reported, and an admin will look into it. Never for one's own name |

- **At 390:** the online count and the first ten rows with your row pinned at the bottom. **At 1,440:** twenty-five rows and the tab list beside them.
- **Deeds at 390:** your honours, then the tabs and Next up. **At 1,440:** your honours in a column at the left, the deeds beside them.

**Visible without scrolling** (checked by verify at 390 × 844 and 1,440 × 900; a slot no built feature fills yet is skipped):

| View | 390 × 844 | 1,440 × 900 |
| --- | --- | --- |
| /hiscores | `hiscores.online`, `hiscores.ladder` | `hiscores.online`, `hiscores.ladder` |
| /hiscores/deeds | `hiscores.honours`, `hiscores.deeds` | `hiscores.honours`, `hiscores.deeds` |
- **Newcomer:** your row at the bottom, and "Your rank appears after your first level". On Deeds, no points yet and "Deeds you do appear here".
- **A deed done** anywhere in the game has its moment, sized by its tier (easy a toast, hard a banner, elite and master the centre), naming any honour it unlocked.

### Welcome (signed out)

Anyone not signed in sees this page instead of the shell, at any address; afterwards they land where they were going. `/welcome` opens on Create account, `/welcome/sign-in` on Sign in. No menu, no lanes: what the game is, and the form.

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `welcome.intro` | the shell | The name, one sentence on what the game is, and the loop it is built on drawn as four icons (ore, bar, sword, foe) |
| 2 | `welcome.form` | the shell | Tabs for Create account and Sign in. Create: name, password, "I am 13 or older", one button. Sign in: name, password, one button, and how a forgotten password is reset. Each field says what it needs; a refusal says why, in place |

- **At 390:** the intro, then the form, both whole. **At 1,440:** the intro and the form side by side. Verify opens these views signed out.

**Visible without scrolling** (checked by verify at 390 × 844 and 1,440 × 900; a slot no built feature fills yet is skipped):

| View | 390 × 844 | 1,440 × 900 |
| --- | --- | --- |
| /welcome | `welcome.intro`, `welcome.form` | `welcome.intro`, `welcome.form` |
| /welcome/sign-in | `welcome.intro`, `welcome.form` | `welcome.intro`, `welcome.form` |

### The notices tray (panel)

Opened from the header's bell; its address is `/?panel=tray`, and `/?panel=tray&tray=mail` for Messages (`&to=Name` begins a message to that player, from their profile card's Send a message). The bell opens on Messages when only messages are new. Two tabs at the top: Notices and Messages (with the unread count).

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `tray.list` | the shell, from events | Newest first, grouped by day. Each notice says what happened and links to where to act ("Smithing stopped: out of tin ore · Mine tin"). The away recap lands here too, after it is closed. Deeds done within a minute of each other read as one line (session 46). Each line carries a picture: an icon where the thing has one, else a deed's medallion in its tier's colour with its mark (a line of deeds wears its best one's), a milestone the gold it paid (session 68); a siege or a spy against you offers the lord's Profile beside it |
| 2 | `tray.mail` | the shell | Messages (session 45). Write a message (one button, folded until wanted; opened by Reply or from a card): To (offering the names of those who have written), under it on a Reply the letter being answered ("Replying to Keeper" and its opening words, cut at a word near 80 characters: session 67), the message with how many of its 250 characters are used, Cancel and Send (Ctrl or Cmd with Enter sends), and the reason when one is refused (no such player, foul language, blocked, a cooldown, ten players a day, muted). Then the letters newest first, an unread one barred in gold with New: the sender's picture and name (which opens their card), when, the words, Reply, Delete (leaving a line with Undo for five seconds) and Block (asked once, in the row, since it clears their letters). The game's own letters (an admin's warning) come from the keepers of the realm under the game's mark, with Delete only. The inbox keeps 20; read letters go after a week, unread after two. Then Blocked players, each with Unblock. Blocking stops only messages. Opening the view marks the letters read |

### Settings (account menu)

Opened from the account button; its address is `/?panel=settings`.

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `settings.account` | the shell | Account name, sign out, links to Privacy and Terms (and Admin, for admins), theme (light, dark, system), sound (off until chosen; levels, finds and goals; or also each action, softly), Send feedback (a line that opens a short form: what they write goes to the team with the page they were on, and the form says it arrived), and Delete account at the foot: asked for twice, the second time with the password; email and recovery when the owner switches email on |
| 2 | `settings.extras` | later systems | Empty in version 1; the 48-hour upgrade and cosmetic donations arrive here |

### Privacy and terms

Two pages of short sections in plain words, at `/privacy` and `/terms`: inside the shell for a player (linked from Settings), and on their own for a visitor (linked from the welcome form), with Back to the welcome page. No menu entry.

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `legal.text` | the shell | The title, when it last changed, then each section: a heading and one paragraph, a reading column wide |

**Visible without scrolling** (checked by verify at 390 × 844 and 1,440 × 900; a slot no built feature fills yet is skipped):

| View | 390 × 844 | 1,440 × 900 |
| --- | --- | --- |
| /privacy | `legal.text` | `legal.text` |
| /terms | `legal.text` | `legal.text` |

### Admin

At `/admin`, for players named in the server's admin list only (anyone else sees the page that does not exist); linked from their Settings. No menu entry.

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `admin.players` | the shell | Find a player by name: name, when they joined (a day as the game says it, "12 Nov" this year: session 83, as are every day on this page), total level, Banned; Open |
| 2 | `admin.player` | the shell | The player opened: rename, ban or unban, check and mend the save, set a new password (shown once, to pass on), what was repaired, and the save itself in a scrolling box |
| 3 | `admin.moderation` | the shell | Bad actors (session 39), under the player search: the players reported (Reports, with a count), those reported by players who have played a while first, each with how many reports for the name and for cheating, by how many players and how many of them playing a while, the last day, Dismiss and Open (renaming or banning settles their reports); then Sieges between lords: pairs with four or more sieges in 30 days, most gold first, each with its sieges, breaches, gold taken and sieges the other way, and Open. Each list scrolls in its own box |
| 4 | `admin.mail` | the shell | The mail monitor (session 45), under the bad actors: search by player, by the player they wrote with and by words; then one list at a time, by tabs (`?mail=`): Sent (newest 200), Flagged (sent the day their sender had one refused), Refused, and Refused today (players with messages the filter stopped, most first, with Muted, Warn, and Mute for a week or Unmute). Each letter shows sender to recipient (each name a search), when (as the game says times, "14:22" today: session 78), the words, and for a player's letter Warn the sender and Mute for a week (the realm's own warnings have no sender to act on). A warning goes as the game's own letter and names no admin. The list scrolls in its own box |
| 5 | `admin.test` | the shell | The players (sessions 18 and 19), under the player search: each player with when they joined, the days they played, Back on day 2 and day 3, total level, what the Hearth's goals ask of them, and Not on the hiscores yet for a player not yet listed; the feedback sent from Settings, newest first, each note with Copy and the panel with Copy all (plain text that says who sent it, their total level and days played, the page and the day; where the browser refuses, the text is shown selected to copy by hand). Each list scrolls in its own box |

**Visible without scrolling** (checked by verify at 390 × 844 and 1,440 × 900; a slot no built feature fills yet is skipped):

| View | 390 × 844 | 1,440 × 900 |
| --- | --- | --- |
| /admin | `admin.players` | `admin.players` |

## 4. Shared components

The design system holds about ten: Card, ResponsiveTable, ActionRow, LaneCard, Tabs, Pill, ProgressBar, ItemIcon, Sheet (a bottom sheet on phones, a side panel on desktop), Moment, and the CloseButton (the cross in every popup's corner). A recipe row, an action row and a foe row are all ActionRow, so they look the same everywhere.

## 5. Homes for later systems

No later system adds a menu entry. The sixth place went to Castle Clash (the owner's choice, session 28), so the menu is full.

| System | Home |
| --- | --- |
| New regions and tiers | Region tabs at the top of Combat (built in session 12: the march, the Sunken Fen, the Ashen Peaks) |
| Fishing, Cooking, Fletching, Runecraft | New rows on Skills, new pages under it; ammunition in the loadout and the Storehouse |
| Guilds | A tab of Hiscores, which is renamed Realm when guilds arrive |
| Player market | A tab of the Storehouse |
| Letters | The notices tray (built in session 45: its Messages tab) |
| Expeditions | A tab of Combat (built in session 16: runs, bosses and relics) |
| Seasons | A tab of Realm, with its own ladder |
| Kindling (in place of Rekindling) | The skill's own page from level 99 (built in session 17), and flames on its seal wherever it is shown |
| The 48-hour upgrade, cosmetic donations | Settings |
