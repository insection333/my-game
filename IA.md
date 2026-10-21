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

Each page lists its sections in order, what must be visible without scrolling at 390 × 844 and at 1,440 × 900, and what a newcomer sees before anything unlocks. Verify opens every view as a newcomer, with every built feature switched on, and checks it at 320, 390 and 1,440 px. Density rules from the brief apply everywhere: no full-width section holding one or two lines, no scroll when the content would fit, one control drawn one way.

### Hearth

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `hearth.today` | the shell (welcome), recap | On return: the away recap, best thing first, then "Collect". Otherwise: today's notable moments as a compact timeline |
| 2 | `hearth.goals` | goals | First steps while unfinished (six rows with buttons); afterwards three short goals, the daily goal and the next milestone, each with a progress bar and its reward |
| 3 | `hearth.lanes` | each lane | Full lane cards with their Next action; on desktop the lanes panel already shows them, so this section is omitted |
| 4 | `hearth.nextUp` | every skill | The three nearest unlocks across all skills: "Woodcutting 21: Practised hands IV, 3,400 XP away" |

- **At 390:** the recap or Today (first 3 rows), then the goals ladder's first two rows. **At 1,440:** Today, the goals ladder and Next up side by side (two columns from 720 px of content width).

**Visible without scrolling** (checked by verify at 390 × 844 and 1,440 × 900; a slot no built feature fills yet is skipped):

| View | 390 × 844 | 1,440 × 900 |
| --- | --- | --- |
| / | `hearth.today`, `hearth.goals` | `hearth.today`, `hearth.goals`, `hearth.nextUp` |
- **Newcomer:** no recap; Today reads "Welcome to the march"; the goals ladder shows First steps with the first button highlighted by the tour.

### Skills

The list, then one page per skill (`/skills/woodcutting`).

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `skills.list` | every skill | Seven rows: icon, name, level, a progress bar to the next level, and the next unlock. Grouped by lane |
| — | **A skill's page** | | |
| 1 | `skill.header` | that skill | Level, XP to next, the next unlock and how far away it is |
| 2 | `skill.actions` | that skill | ActionRow per action or recipe: name, level, seconds, XP an hour, what it gives or takes, mastery step and bar, Start and Queue next. One tier at a time, under tabs (Tier 1 to 4), opening on the newest tier with something open; locked ones show their level, never hidden |
| 3 | `skill.finds` | that skill | The six finds, found (with the date) or silhouetted (with where it comes from), with their rarity |
| 4 | `skill.ladder` | that skill | The unlock ladder 1–40, the current level marked, past unlocks muted |

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

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `combat.loadout` | combat | Weapon (and so your style) across the top, then helm, body and legs as small tiles; health and food carried on one line. Each slot opens a sheet of the matching gear in the Storehouse to wear or take off; an empty weapon slot with nothing to wear leads to Smithing |
| 2 | `combat.foes` | combat | One tier at a time under tabs (the newest with a foe open first). One row per foe: icon, name, style (as a word, never colour alone), level, the triangle against your style, Your odds verdict with XP, food and gold an hour, Fight and Next. Locked foes show the Hitpoints level that opens them; without a weapon each says to wear one |
| 3 | `combat.food` | storehouse | Food carried, the vendor's food with prices, Buy |
| 4 | `combat.triangle` | combat | A small permanent key: Melee beats Archery beats Magic beats Melee |

- **At 390:** loadout (one compact row of four gear slots and health) and the first three foes. **At 1,440:** loadout and food side by side, every foe, the triangle key.

**Visible without scrolling** (checked by verify at 390 × 844 and 1,440 × 900; a slot no built feature fills yet is skipped):

| View | 390 × 844 | 1,440 × 900 |
| --- | --- | --- |
| /combat | `combat.loadout`, `combat.foes` | `combat.loadout`, `combat.foes`, `combat.food`, `combat.triangle` |
- **Newcomer:** an empty weapon slot reading "Forge a weapon in Smithing" that leads there; the hollow rat says "Wear a weapon first", and shows "Fair" once the sword is worn with First steps' ten loaves.
- **Combat skills' pages** (Melee, Archery, Magic, Hitpoints) have no actions of their own: in place of the actions, "Trained by fighting on the Combat page" and Go to Combat; the ladder and finds as for any skill.

### Storehouse

Tabs: Items · Collection log.

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `store.capacity` | storehouse | Slots used of total, Enlarge with its price |
| 2 | `store.items` | the shell, asking every feature (the storehouse adds space and selling in session 9) | A grid of items with counts, grouped by kind (resources, gear, food, finds); tap opens the item panel |
| 3 | `item.panel` | the shell, and every feature through queries (its content) | Name, icon at 96 px, count, sale price, Sell (one, ten, all but one), Wear for gear; for a Rare find, Use on one of its skill's actions (500 mastery completions), most used first; **Comes from** and **Used in**, each answered by asking every registered feature |
| 4 | `collection.log` | every skill (its six finds) | 36 entries by skill, found or silhouetted, with first-find dates and progress per skill |

- **At 390:** capacity and four rows of the grid; the item panel opens as a sheet. **At 1,440:** capacity, the full grid, and the item panel docked at the right of the content.

**Visible without scrolling** (checked by verify at 390 × 844 and 1,440 × 900; a slot no built feature fills yet is skipped):

| View | 390 × 844 | 1,440 × 900 |
| --- | --- | --- |
| /storehouse | `store.capacity`, `store.items` | `store.capacity`, `store.items` |
| /storehouse/log | `collection.log` | `collection.log` |
- **Newcomer:** capacity 0 of 24 and an empty grid reading "Logs and ores you gather land here".

### Hiscores

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `hiscores.online` | server | How many are playing now |
| 2 | `hiscores.ladder` | hiscores | Tabs for Total and each skill; rank, name, level, XP; your own row pinned |

- **At 390:** the online count and the first ten rows with your row pinned at the bottom. **At 1,440:** twenty-five rows and the tab list beside them.

**Visible without scrolling** (checked by verify at 390 × 844 and 1,440 × 900; a slot no built feature fills yet is skipped):

| View | 390 × 844 | 1,440 × 900 |
| --- | --- | --- |
| /hiscores | `hiscores.online`, `hiscores.ladder` | `hiscores.online`, `hiscores.ladder` |
- **Newcomer:** your row at the bottom, and "Your rank appears after your first level".

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

Opened from the header's bell; its address is `/?panel=tray`.

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `tray.list` | the shell, from events | Newest first, grouped by day. Each notice says what happened and links to where to act ("Smithing stopped: out of tin ore · Mine tin"). The away recap lands here too, after it is closed |

### Settings (account menu)

Opened from the account button; its address is `/?panel=settings`.

| # | Section (slot) | Filled by | Notes |
| --- | --- | --- | --- |
| 1 | `settings.account` | the shell | Account name, sign out, links to Privacy and Terms (and Admin, for admins), theme (light, dark, system), and Delete account at the foot: asked for twice, the second time with the password; email and recovery when the owner switches email on |
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
| 1 | `admin.players` | the shell | Find a player by name: name, when they joined, total level, Banned; Open |
| 2 | `admin.player` | the shell | The player opened: rename, ban or unban, check and mend the save, set a new password (shown once, to pass on), what was repaired, and the save itself in a scrolling box |

**Visible without scrolling** (checked by verify at 390 × 844 and 1,440 × 900; a slot no built feature fills yet is skipped):

| View | 390 × 844 | 1,440 × 900 |
| --- | --- | --- |
| /admin | `admin.players` | `admin.players` |

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
