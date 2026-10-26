# Idle Clash: rebuild brief (final)

Oct 20, 2026 · @Korky · decisions updated in session 0

## How to use this brief

This brief is the whole plan for building Idle Clash from scratch; paste it into a new chat and begin at the first session not yet finished. The repository is `insection333/my-game`; `GAME_DESIGN.md`, `IA.md` and `GLOSSARY.md` there hold session 0's design.

To the assistant reading this in a new chat:

- You are the lead engineer and game designer. The owner decides scope, money and taste; you decide everything technical within this brief, and say why.
- Follow the sessions in order. A session ends only when its "must prove" is shown, `pnpm verify` is green and the branch is pushed. A session may span several chats.
- Owner-level questions (anything changing scope, a pillar, a decision below, or what a player sees on a page) are asked, never assumed.
- Hold every screen and every visual to a professional standard from the first draft; the owner should never need to ask for higher quality.
- Start session 0 by restating the three pillars in your own words and listing anything in this brief you would challenge.

When the owner simply says "Continue":

1. **Finish what is outstanding first:** an unfinished session step, a failing check, a promised fix, an open question now answered.
2. **If nothing is outstanding, decide whether a bug and oversight sweep is due.** It is due after a feature lands, after a change touching two or more features or a page's layout, or when several changes have gone unswept. Sweep by feature: the changed folders, their slots, how they meet other features, and their pages at the three widths.
3. **If a sweep was recent enough, or can safely wait to save effort, skip it** and go on to the next session or the next improvement in this brief.
4. **Decide independently within this brief:** its pillars, scope, decisions and quality bar. Ask only owner-level questions.
5. **End each turn briefly:** what was done, verify's result, and what comes next.

## The game and its pillars

Idle Clash is a free browser idle MMO set in a medieval fantasy world in the spirit of Tolkien: old kingdoms, forges and wild lands. Your lanes keep working while you are away, and coming back to stoke the fire and push by hand always feels worth it. Three pillars decide every feature; a feature that serves none of them is not built.

**1. Longevity: progression is logical, never a waiting grind.**

- Every level of every skill gives something: a new action, a recipe, a perk or a tier. There are no empty levels.
- Progress comes from decisions as well as time: which recipe, which style, which target. The best choice changes as you grow.
- Skills interlock: each one's output is another's input (logs and ores make bars, bars and logs make gear, gear wins fights, fights drop materials).
- Mastery: repeating an action makes it faster and richer, so old actions keep paying.
- Nothing is gated by waiting alone; a goal opens a door, a timer never does.

**2. Fun: frequent, varied rewards, and play that feels good.**

- During active play, something worth noticing happens about every two minutes: a level, an unlock, a rare find, a goal done, a mastery step.
- Rewards vary: each action has rare finds at three rarities (about 1 in 50, 1 in 500, 1 in 5,000), and a find has its own moment on screen.
- A goals ladder is always in view: first steps, then three rolling short goals of 5 to 15 minutes, a daily goal and milestone goals.
- Every action has motion and numbers that count up; level-ups and rare finds have a moment; the return recap leads with the best thing that happened.
- The next goal is always visible: every skill shows its next unlock and how far away it is.

**3. Endgame replayability: the end of the climb opens new ways to play.**

- Reaching the top changes how you play rather than repeating the climb: seasons with a twist, a chosen restart with lasting rewards and modifiers, varied expeditions, collections to complete.
- Version 1 plants the seeds (mastery, a collection log of rare finds, hiscores); the long arc below sets the order of the rest.

## Version 1 scope

Version 1 is three trade skills, three combat styles, three lanes, four tiers and one region, with every pillar's core mechanic in place: small enough to finish in weeks and test with real players.

| Feature | In version 1 |
| --- | --- |
| Accounts | Name and password; players 13 and over; an account and its data can be deleted. Email (confirmation and recovery) is built behind a switch and stays off until the owner turns it on; until then the admin page resets forgotten passwords |
| Lanes | Gathering, Artisan, Combat; each runs one action and keeps going offline for up to 24 hours; a Next action can be queued behind the current one |
| Skills | Woodcutting and Mining (gathering), Smithing (artisan); Melee, Archery and Magic (combat), plus Hitpoints |
| Unlocks | Every level of every skill unlocks something (an action, a recipe, a perk, a tier) |
| Mastery | Each action has its own mastery: repeating it makes it faster and raises its yield |
| Rare finds | Each action rolls finds at three rarities from its skill's table of six (a lesser and a greater at each rarity); each found one is entered in a collection log of 36 |
| Goals | First steps (six goals with buttons), then three rolling short goals, a daily goal and milestone goals, each with a small reward |
| The combat triangle | Melee beats Archery, Archery beats Magic, Magic beats Melee; your style is your weapon's; every foe has a style, shown before you fight |
| Weapons | Smithing makes all three kinds from bars and logs: a sword, a bow (a log with metal fittings), a staff (a log with a metal head). No arrows or runes in version 1 |
| Defeat | At low health you retreat: nothing is lost, and the lane stops with the reason shown |
| Gold | Earned from vendor sales and foes' drops; spent on food and Storehouse space. Gear is made, never bought |
| The fire | Lit and kept burning by real input (starting or changing an action, claiming a goal, the Stoke button); goes out 5 minutes after the last input; while it burns, more XP and a second Gathering lane |
| Items | Logs, ores, bars; three weapons and three armour pieces (helm, body, legs) per tier; food from the vendor; four tiers: Copper, Bronze, Iron, Steel |
| Combat | One region, eight foes across the three styles, drops, and a "Your odds" verdict from the fight engine |
| Storehouse and vendor | A capped bag that gold can enlarge, selling to the vendor, gear worn from the bag, and for each item where it comes from and what uses it |
| Other players | Hiscores for each skill and in total, and how many are online |
| Onboarding and notices | A short tour; a recap of what happened while away; one notices tray |
| Art | About 86 icons (24 weapons and armour pieces, 12 resources, 8 foes, 3 foods, 36 finds), 7 skill icons and the region's scene |

Not in version 1: PvP, guilds, a player market, raids, dungeons, seasons, any restart system, more regions or trade skills, a native app, a bot, and anything paid.

**The expansion before launch (owner, 26 October 2026).** Before launch the game grows to a year of play: level 99 over eight tiers, two more regions with bosses, Fishing and Cooking, Fletching and Runecraft, and three endgame systems: Expeditions, Rekindling, and Deeds and titles. The plan, its targets and its order of work are in `docs/EXPANSION.md` (sessions 11 to 18). Guilds, the market, letters and seasons still wait for real players.

## Targets

Every pillar has numbers the simulation and real players are measured against; a result outside 25% of a target is a design bug.

| Pillar | Target | Measured by |
| --- | --- | --- |
| Pacing | First level-up under 1 minute; first crafted gear worn under 15 minutes | A fresh simulated player and a fresh real one |
| Pacing | Level 10 in the first session (about 1 hour); level 20, day 2; level 30, about day 5; level 40 (the top of version 1), about 3 weeks of daily play | The 28-day simulation |
| Pacing | An hour with the fire earns about 1.5 times the XP of an hour away | The simulation |
| Pacing | A day's gold buys a day of food and the next Storehouse enlargement | The simulation |
| Longevity | No empty levels: every level 1 to 40 of every skill unlocks something | The content check |
| Longevity | At each tier, at least two viable choices (recipe, style or target), within 20% of each other in reward | Simulated strategies compared |
| Longevity | Mastery still pays on an action 10 levels below your level | The simulation |
| Fun | A notable event (level, unlock, rare find, goal, mastery step) about every 2 minutes of active play, and never more than 5 minutes without one | Telemetry and the simulation |
| Fun | After 8 hours away, the recap holds at least three good things, the best one first | The simulation |
| Fun | The first rare find within the first hour | A fresh simulated player |
| All | All five test players return on days 2 and 3, and each can say what they are aiming for next | The five-player test |

## The long arc

After version 1, systems arrive one at a time in this order, each tested with players before the next; session 0 gives each one a home in the page map now, so nothing needs redesigning later.

| Order | System | Serves |
| --- | --- | --- |
| 1 | More world: new regions and tiers, Fishing and Cooking (a food loop), Fletching and Runecraft (ammunition for Archery and Magic) | Longevity |
| 2 | Social: guilds with shared goals, a player market, letters | Longevity, fun |
| 3 | Expeditions: varied runs with routes, modifiers and a boss, different each time | Replayability |
| 4 | Seasons: every eight weeks or so, a fresh ladder with a twist (a modifier that changes how the season plays) and cosmetic rewards | Replayability |
| 5 | Rekindling: an optional restart that keeps lasting marks and lets you choose a world modifier for the run, so a second climb plays differently | Replayability |
| 6 | The very end: the 48-hour offline upgrade, and cosmetic donations | Longevity |

Before any of these is built, it must pass three tests: it serves at least one pillar, a newcomer can understand it in one sentence, and it fits the page map without a new top-level menu entry.

## Architecture

All game logic lives in feature folders on a small kernel; the apps only host them, and the shell, not the features, decides how the screen looks.

```
idle-clash/
  CLAUDE.md, ARCHITECTURE.md, IA.md, GAME_DESIGN.md, FEATURES.md (generated)
  packages/
    kernel/      state schema, time, randomness, advance(), lanes, events, saves, one-at-a-time requests
    features/    one folder per feature: woodcutting/, mining/, smithing/, combat/, goals/, storehouse/ ...
                 each: rules.ts, content.ts, effects.ts, routes.ts (schemas), slots.tsx, help.ts, tests/
    content/     shared content schemas, the effect formatter registry, the strings file and glossary
    ui/          design tokens and about ten components (Card, ResponsiveTable, ActionRow, Tabs, Pill, ...)
  apps/
    server/      Fastify: mounts each feature's routes; accounts, live channel, admin
    web/         the shell: the fixed pages and their slots from IA.md
  tools/         verify, the simulation, load test, review sheets
```

A feature declares itself in one place: `defineFeature({ id, flag, content, effects, rules, routes, slots, help })`, added to one registry. A feature never imports another; it reads shared state through the kernel and announces what happened as events.

How the screen stays one product:

- **A fixed map of pages.** `IA.md` lists the pages: five menu entries (Hearth, Skills, Combat, Storehouse, Hiscores), the notices tray in the header, Settings behind the account button, and the home of every later system. A feature never adds a page; a new page or menu entry is the owner's decision.
- **Slots, not screens.** Each page has named slots (a skill's action list, the lane card, the item panel's "Comes from" and "Used in", the Hearth's "Today", the goals ladder, the notices tray). Features fill slots with data; shared components draw it, so a recipe row looks the same in every skill.
- **Views across features are queries.** "Used in" asks every registered feature about an item; no feature reaches into another's page.
- **Each page has a layout spec:** its sections in order, what must be visible without scrolling at 390 and 1,440 px, and what a newcomer sees before anything unlocks.
- **Density is measured.** The screenshot step fails on a full-width section holding one or two lines, a page that scrolls when its content would fit, more than six menu entries, or one control drawn two ways.
- **One glossary, one voice.** Every player-facing word lives in the strings file; new terms enter the glossary visibly.
- **Meaning never by colour alone**, and the tour and pointers target slot names, never layout classes.

## Technical choices

Each choice removes a known failure by construction rather than by later sweeps.

| Area | Choice |
| --- | --- |
| Repository | TypeScript everywhere, one pnpm workspace; files under about 300 lines; one branch per session, merged when verify is green |
| Engine | Pure functions: `advance(state, now, rng) → {state, events}`; time and randomness passed in, never read |
| Authority | The server resolves every action; the page shows state and sends requests. Each player's requests run one at a time; every action carries a request id, so a double click or retry does nothing twice |
| Offline catch-up | Completions per lane counted from elapsed time, rolls batched, capped at 24 hours; queued Next actions start when a lane stops |
| Effects | A typed union of effect kinds; every kind has a handler and a text formatter, or the build fails; descriptions are generated from numbers, never written beside them |
| Content | Data files checked by Zod schemas at build: references resolve, values in range, every effect handled, no empty levels. An id is never reused; a removed item is mapped to its replacement |
| Contracts | One Zod schema per route: validates input, types the client, generates its tests; no raw `req.query` |
| Persistence | SQLite in one file (write-ahead mode) through Drizzle, which can later move to Postgres; one row per player holding a versioned document; migrations in files; a sample save of every version loaded in tests |
| Security | Argon2id passwords; rate-limited sign-in and sign-up; secure session tokens; HTTPS through Caddy; secrets only in the server's environment |
| Email | One transactional email service with the domain's SPF and DKIM records set, behind a small interface and a switch that stays off until the owner turns it on; used only to confirm and recover accounts |
| Privacy and terms | A privacy page and terms of use; players 13 and over; deleting an account deletes its data; telemetry holds no personal details |
| Operations | GitHub Actions runs verify on every push; one-command deploy with a health check and rollback; nightly off-server backups with a monthly rehearsed restore; structured logs; browser errors reported; an outside uptime check that emails the owner |
| Admin | A small admin page: offensive names refused and renamed, bans, a player's save inspected and mended, a forgotten password reset |
| Capacity and speed | 500 players online on the 2-core server, load-tested before launch; the first page under 250 KB compressed, usable within 2 seconds on a mid-range phone, near-zero CPU while idle |
| Live updates | One WebSocket channel carrying typed events |
| Web | React and Vite; the shell owns the pages, features fill slots; one design-system package; container queries; built at 320 px first |
| Art | Icons and scenes drawn in code from one style guide (shaded forms, light from the top left, readable at 24 px), rendered and reviewed at their real sizes |
| Telemetry and flags | An events table (sessions, notable events, gold by source, stop reasons); a flag per feature, read on the server and passed to the page |

## Quality and conventions

One command, `pnpm verify`, decides whether a change is done, for the owner, for you and for every later session.

`pnpm verify` runs, printing one line per step:

1. Typecheck and lint
2. The manifest check: every feature has its rules, routes, slot contributions and Help entry; every slot it fills exists in `IA.md`; `FEATURES.md` regenerated
3. The content check: schemas, references, every effect kind handled and formatted, no empty levels, every player-facing word in the strings file
4. Unit tests per feature; contract tests from the route schemas with hostile input (`__proto__`, repeated names, very long strings, the same request twice); every past save version loaded against current content
5. The simulation: strategy bots for 28 simulated days, each asserting it progresses and is rarely refused, compared with every target, including the pillar targets
6. Screenshots of every page at 320, 390 and 1,440 px in Chromium, WebKit and Firefox, measured for tap sizes (24 px at least), overflow and density against each page's layout spec
7. The accessibility audit (axe) on every page at those widths
8. Performance budgets: page weight, time to usable on a throttled phone, idle CPU
9. The review sheets: every page beside its layout spec, and every icon at 24, 48 and 96 px beside the reference set, in light and dark

Conventions, kept in `CLAUDE.md` so every session starts with them:

- Read `ARCHITECTURE.md`, `IA.md` and the one feature folder being changed; nothing else unless needed
- Plan first for any change touching two features or a page's layout; then small diffs, never whole-file rewrites
- A new test is run once against the bug it guards, to see it fail
- One changelog line per change; owner-level questions are asked, never assumed
- A reported problem is reproduced and its fix confirmed at the reporter's screen size, doing what they did
- Pages are compact and held to their spec: nothing full-width for a line or two, nothing a newcomer needs hidden; a changed page is seen on the review sheet at all three widths before it ships
- Art is held to the reference set, never "good enough": shaded forms, consistent light, readable at 24 px, no flat placeholders; the owner is asked only when a new family begins
- Each chat ends with verify green and the branch pushed

A change is done when:

- [ ] Its feature's manifest is complete and the checks pass
- [ ] Every number on screen comes from data through the shared formatter
- [ ] A new test was seen to fail against what it guards
- [ ] Its pages pass their spec at 320, 390 and 1,440 px
- [ ] It serves a pillar, and the targets still hold
- [ ] Verify is green and the changelog has one line

## Sessions

Eleven sessions take the project from an empty folder to five real players; each ends only when it proves something specific.

| # | Session | Must prove |
| --- | --- | --- |
| 0 | Design on paper: `GAME_DESIGN.md` (the loop; the XP curve and gold flows; the unlock table for levels 1 to 40 of each skill; mastery; rare-find tables; the goals ladder; the triangle's numbers; the weapon recipes; the long arc), `IA.md` (pages, slots, layout specs, the menu, a home for each later system), the glossary | Worked by hand, the curve lands on each target, no level is empty, and a notable event falls about every 2 minutes of active play |
| 1 | Workspace skeleton, `CLAUDE.md`, `ARCHITECTURE.md`, an empty `pnpm verify` running on every push | Verify is green on an empty project, locally and on push |
| 2 | The kernel: state schema v1, time, randomness, `advance`, lanes and the Next queue, events, one-at-a-time requests, saves in SQLite with migrations and a first sample save | a to b to c equals a to c; a save round-trips; a damaged save is mended; two requests never interleave |
| 3 | The feature framework: `defineFeature`, slots, the manifest and content checks (including no empty levels), effect handlers and formatters, the strings file, the generated `FEATURES.md` | Removing a slot contribution, a formatter or a level's unlock fails verify |
| 4 | The shell and the design system: the pages and slots from `IA.md`, tokens, about ten components, the review sheets and density checks; the art style guide with twelve reference icons covering every family | Every empty page passes its spec at all widths in all three engines; the owner approves the reference icons |
| 5 | The server shell: accounts (name and password; email built behind its switch, off); security; schema-checked routes and contract tests; request ids; the live channel; flags; telemetry of notable events; logs and browser errors | The hostile-input suite is green; sign-up, sign-in and sign-out work and are rate-limited |
| 6 | Woodcutting, end to end, with the pillar mechanics every skill reuses: unlocks, mastery, rare finds and the collection log, a first-steps goal | A newcomer starts within 30 seconds; 8 hours away is credited exactly; a rare find has its moment |
| 7 | Mining and Smithing: inputs, "out of ingredients", the three weapon kinds, Comes from and Used in | Every lane stop says why; a queued action starts while away |
| 8 | Combat: Melee, Archery, Magic, the triangle, eight foes, gear, food, retreat, "Your odds" from the engine | Each style wins where the triangle says; verdicts match simulated fights; a retreat costs nothing |
| 9 | The goals ladder, the tour, notices and the away recap, Storehouse and vendor, gold sinks, hiscores, privacy and terms, account deletion, the admin page | A fresh player meets the first-hour targets; the recap leads with the best thing; every page passes its spec and budgets; a deleted account leaves nothing; an admin can reset a password |
| 10 | Deployment: the server, HTTPS, deploy and rollback, backups with a rehearsed restore, uptime check, a 500-player load test (the email domain when the owner switches email on) | The game is live and restorable; then five real players play for three days and the pillar targets are read from telemetry |

## Decisions

These are settled by the owner and are not reopened without asking.

| Decision | Settled as |
| --- | --- |
| Name and world | Idle Clash; medieval fantasy in the spirit of Tolkien |
| Pillars | Longevity (logical progression, not a waiting grind); fun (frequent, varied rewards); endgame replayability |
| Offline cap | 24 hours; raised to 48 hours by an upgrade at the very end of the game |
| Combat | Melee, Archery and Magic in the classic triangle, plus Hitpoints |
| Pacing | As in Targets; the assistant tunes within 25% |
| Database | SQLite in one file, through Drizzle so it can move to Postgres |
| Hosting | One small server (2 cores, 2 GB) at idleclash.com: a VentraIP VPS; backups to Cloudflare R2; UptimeRobot watches the site (session 10) |
| Accounts | Name and password. Email confirmation and recovery are built but switched off until the owner says so; then players are asked to add and confirm an email |
| Money | None in version 1; cosmetic donations later |
| Automation | No bot; offline lanes are the idle play |
| Art | Drawn in code to one style guide, at the highest quality, reviewed at real sizes; about 86 icons |
| Hiscores in version 1 | Yes (confirmed in session 0) |
| Minimum age | 13 (confirmed in session 0); revisited before guilds and letters arrive |
| The menu | Five entries: Hearth, Skills, Combat, Storehouse, Hiscores; Notices is a header tray; Settings is behind the account button (session 0) |
| The fire | Renewed by real input, out after 5 minutes idle; its extra lane is a second Gathering lane (session 0) |
| Hitpoints | A skill: every level adds health; named perks every fifth level (session 0) |
| Rare finds | Six per skill, two at each rarity; 36 in the collection log (session 0) |
| Session order | Account deletion and the admin page are built in session 9, not 5 (session 0) |
| Launch | Not until the owner is satisfied: the game is held as close to a AAA standard as possible first (session 10) |
| The region's scene | Behind the welcome page, and as a banner across the top of the Hearth (session 10) |
| Site icon | The fire, drawn in the icon style on a dark round seal (session 10) |
| Sound | Made in code; off until each player switches it on in Settings; never intrusive (no wearing sounds for repeated actions or notices) (session 10) |
| Contact address | admin@idleclash.com, shown on the welcome page, the privacy page and the terms (session 10) |
| The scene's motion | Approved, "slightly more animated": smoke, drifting clouds, birds now and then (session 10) |
| The expansion | Before launch, as above: level 99 over eight tiers; Fishing, Cooking, Fletching, Runecraft; Expeditions, Rekindling, Deeds and titles first; built first, then one closed test with a handful of players before public launch; the server waits (26 October 2026) |

## Lessons from the first attempt

A first version reached 1,426 items, 26 skills and some 195 releases, but most of its late work was repairing seams; each rule in this brief exists because of one of these.

| What went wrong | The rule that prevents it |
| --- | --- |
| Dozens of systems were built before any real player tested the loop, and newcomers met unexplained terms | Version 1 first, real players at a gate; the one-sentence test; one glossary |
| Files of thousands of lines, patched by search and replace | Feature folders, files under about 300 lines |
| Descriptions written apart from their numbers drifted (a building said 4% and gave 20%) | Text generated from data by one formatter |
| Features half built: in the engine but no button, described but never coded | The feature manifest and its check |
| One system silently broke another (a link into a page that had changed its layout) | Slots, queries and events; no feature imports another |
| Pages became stacks of full-width boxes holding a line each | A fixed page map, layout specs and measured density |
| Checks passed while the real problem stood (simulated bots were broken; audits measured overflow, not readability) | Tests seen to fail first; bots that assert their own progress; review sheets |
| Owner decisions made on the fly, and visuals that needed asking twice | Decisions settled here; the art reference set and its review |
