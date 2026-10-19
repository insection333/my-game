# Idle Clash: the page map (IA)

Session 0 · October 2026. This file is the contract between the shell and the features. The shell owns pages and their layout; features fill named slots with data; shared components draw it. A feature never adds a page, and a new page or menu entry is the owner's decision. `pnpm verify` checks that every slot a feature fills is listed here.

## 1. The menu

Five entries, in this order, with one place left free for the owner to fill:

| Entry | Page | What it answers |
| --- | --- | --- |
| Hearth | Home | What is happening, what happened while I was away, and what do I aim for next? |
| Skills | The seven skills and each skill's page | What can I do, and what does the next level give? |
| Combat | Gear, foes, food | What should I fight, with what, and what are my odds? |
| Storehouse | Items, the vendor, the collection log | What do I have, where does it come from, and what is it for? |
| Hiscores | Ladders and who is online | How do I compare? |

Outside the menu:

- **The notices tray**: a bell in the header with a count. Lane stops, goals claimed, the away recap, and (later) letters.
- **The account menu**: behind the account button. Settings, privacy, terms, sign out, and (session 9) delete account.
- **The tour**: a short overlay on first visit, pointing at slots by name, never at layout classes.

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
│  Hearth  Skills  Combat  Store  Hiscores │  menu, 56 px, icons with labels
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
| `shell.moment` | Over everything, centred or as a banner | any feature, through events | Moment |

## 3. Pages

Each page lists its sections in order, what must be visible without scrolling at 390 × 844 and at 1,440 × 900, and what a newcomer sees before anything unlocks. Density rules from the brief apply everywhere: no full-width section holding one or two lines, no scroll when the content would fit, one control drawn one way.

### Hearth

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `hearth.today` | recap, goals | On return: the away recap, best thing first, then "Collect". Otherwise: today's notable moments as a compact timeline |
| 2 | `hearth.goals` | goals | First steps while unfinished (six rows with buttons); afterwards three short goals, the daily goal and the next milestone, each with a progress bar and its reward |
| 3 | `hearth.lanes` | each lane | Full lane cards with their Next action; on desktop the lanes panel already shows them, so this section is omitted |
| 4 | `hearth.nextUp` | every skill | The three nearest unlocks across all skills: "Woodcutting 21: Practised hands IV, 3,400 XP away" |

- **Above the fold at 390:** the recap or Today (first 3 rows), the goals ladder's first two rows.
- **Above the fold at 1,440:** Today, the full goals ladder and Next up side by side (two columns from 720 px of content width).
- **Newcomer:** no recap; Today reads "Welcome to the march"; the goals ladder shows First steps with the first button highlighted by the tour.

### Skills

The list, then one page per skill (`/skills/woodcutting`).

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `skills.list` | every skill | Seven rows: icon, name, level, a progress bar to the next level, and the next unlock. Grouped by lane |
| — | **A skill's page** | | |
| 1 | `skill.header` | that skill | Level, XP to next, the next unlock and how far away it is |
| 2 | `skill.actions` | that skill | ActionRow per action or recipe: name, level, seconds, XP an hour, what it gives or takes, mastery step and bar, Start and Queue next. Locked ones show their level, never hidden |
| 3 | `skill.ladder` | that skill | The unlock ladder 1–40, the current level marked, past unlocks muted |
| 4 | `skill.finds` | that skill | The six finds, found or silhouetted |

- **Above the fold at 390:** the header and the first four actions.
- **Above the fold at 1,440:** the header, every action of the current tier, and the ladder beside them.
- **Newcomer:** Woodcutting's page shows Pine tree ready, the next three actions with their levels, and the ladder's first ten levels.

### Combat

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `combat.loadout` | combat | Weapon (and so your style), helm, body, legs, health, food carried; each slot opens the matching items from the Storehouse |
| 2 | `combat.foes` | combat | One row per foe: icon, name, style badge (icon and word, never colour alone), level, the triangle against your style, Your odds verdict with XP, food and gold an hour, Fight and Queue next. Locked foes show the Hitpoints level that opens them |
| 3 | `combat.food` | storehouse | Food carried, the vendor's food with prices, Buy |
| 4 | `combat.triangle` | combat | A small permanent key: Melee beats Archery beats Magic beats Melee |

- **Above the fold at 390:** loadout (one compact row of four gear slots and health) and the first three foes.
- **Above the fold at 1,440:** loadout and food side by side, every foe, the triangle key.
- **Newcomer:** an empty weapon slot with "Forge a sword in Smithing" and a button there; the hollow rat shows "Fair" once a sword is worn.

### Storehouse

Tabs: Items · Collection log.

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `store.capacity` | storehouse | Slots used of total, Enlarge with its price |
| 2 | `store.items` | storehouse | A grid of items with counts, filterable by kind (resources, gear, food, finds); tap opens the item panel |
| 3 | `item.panel` | storehouse, and every feature through queries | Name, icon at 96 px, count, sale price, Sell (one, ten, all but one), Wear for gear; **Comes from** and **Used in**, each answered by asking every registered feature |
| 4 | `collection.log` | finds | 36 entries by skill, found or silhouetted, with first-find dates and progress per skill |

- **Above the fold at 390:** capacity and four rows of the grid; the item panel opens as a sheet.
- **Above the fold at 1,440:** capacity, the full grid, and the item panel docked at the right of the content.
- **Newcomer:** capacity 0 of 24 and an empty grid reading "Logs and ores you gather land here".

### Hiscores

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `hiscores.online` | server | How many are playing now |
| 2 | `hiscores.ladder` | hiscores | Tabs for Total and each skill; rank, name, level, XP; your own row pinned |

- **Above the fold at 390:** the online count and the first ten rows with your row pinned at the bottom.
- **Above the fold at 1,440:** twenty-five rows and the tab list beside them.
- **Newcomer:** your row at the bottom, and "Your rank appears after your first level".

### The notices tray (panel)

`tray.list`: the newest first, grouped by day. Each notice says what happened and links to where to act ("Smithing stopped: out of tin ore · Mine tin"). The away recap lands here too, after it is closed.

### Settings (account menu)

Account name, theme (light, dark, system), reduced motion, privacy, terms, sign out; delete account from session 9; email and recovery when the owner switches email on.

## 4. Shared components

The design system holds about ten: Card, ResponsiveTable, ActionRow, LaneCard, Tabs, Pill, ProgressBar, ItemIcon, Sheet (a bottom sheet on phones, a side panel on desktop), and Moment. A recipe row, an action row and a foe row are all ActionRow, so they look the same everywhere.

## 5. Homes for later systems

No later system adds a menu entry. The free sixth place stays free until the owner chooses otherwise.

| System | Home |
| --- | --- |
| New regions and tiers | Region tabs at the top of Combat |
| Fishing, Cooking, Fletching, Runecraft | New rows on Skills, new pages under it; ammunition in the loadout and the Storehouse |
| Guilds | A tab of Hiscores, which is renamed Realm when guilds arrive |
| Player market | A tab of the Storehouse |
| Letters | The notices tray |
| Expeditions | A tab of Combat |
| Seasons | A tab of Realm, with its own ladder |
| Rekindling | A section of the Hearth, opened by a milestone |
| The 48-hour upgrade, cosmetic donations | Settings |
