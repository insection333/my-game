# Idle Clash: architecture

How the code is arranged and why. `docs/BRIEF.md` is the plan, `GAME_DESIGN.md` the rules of the game, `IA.md` the pages. Parts marked with a session number are not built yet; this file is updated as each one lands.

## 1. The shape

```
            ┌──────────────────────── apps ────────────────────────┐
            │  server (Fastify)                 web (React, Vite)  │
            │  routes, accounts, live channel   the shell: pages,  │
            │  admin            ◄── contracts ──► slots, the tour  │
            └───────┬──────────────────────────────────┬───────────┘
                    │ mounts                            │ renders
            ┌───────▼──────────── packages/features ────▼───────────┐
            │  woodcutting/  mining/  smithing/  combat/  goals/ …  │
            │  each: rules, content, effects, routes, slots, help   │
            └───────┬─────────────────────┬─────────────────┬───────┘
                    │                     │                 │
            ┌───────▼──────┐   ┌──────────▼─────────┐   ┌───▼────────────┐
            │   kernel     │   │  content           │   │  ui            │
            │ state, time, │◄──│ schemas, effects,  │   │ tokens, ten    │
            │ rng, advance │   │ formatters, strings│   │ components     │
            └──────────────┘   └────────────────────┘   └────────────────┘
```

All game logic lives in feature folders on a small kernel. The apps only host features: the server mounts their routes, and the web shell draws their slot data with shared components. The shell, never a feature, decides how a page looks.

## 2. Packages and what each may import

| Package | Holds | May import | Built in |
| --- | --- | --- | --- |
| `@idle-clash/kernel` | The state schema and its versions, time, randomness, `advance`, lanes and the Next queue, events, mending, one-at-a-time requests. Its subpath `@idle-clash/kernel/store` holds the SQLite store and is for the server only | nothing in the workspace | Session 2 (built) |
| `@idle-clash/content` | Content schemas (Zod), the effect kinds with their handlers and text formatters, levels and mastery, the number formatter, the strings file and the glossary | kernel | Session 3 (built) |
| `@idle-clash/ui` | Design tokens (`tokens.css`, `base.css`), thirteen components, and the item art (`icons/`, see `ART.md`) | nothing in the workspace | Session 4 (built) |
| `@idle-clash/contracts` | Every HTTP route's method, path, who may call it and its input schema (Zod), the response types, the field rules (names, passwords, plain text), and the live channel's messages. The server checks against them, the page is typed by them, and the hostile-input suite is generated from them | kernel | Session 5 (built) |
| `@idle-clash/features` | `defineFeature`, the registry, shared skill machinery (`shared/`), and one folder per feature: Woodcutting and goals (session 6), Mining and Smithing (session 7) | kernel, content, ui | Session 3 (built); features from session 6 |
| `@idle-clash/server` | Fastify: accounts, the game and feature routes, the live channel, telemetry, browser error reports, and serving the built page; admin from session 9 | kernel, content, contracts, features | Session 5 (built) |
| `@idle-clash/web` | The shell: the pages and slots from `IA.md`, and the welcome page | kernel (never `/store`), content, contracts, ui, features | Session 4 (built) |
| `@idle-clash/tools` | `pnpm verify`, the simulation, load test, review sheets | anything | Session 1 onward |

Two rules hold on top of the table: **a feature never imports another feature**, and **nothing imports an app**. Features cooperate through shared state read via the kernel, events they announce, and queries ("Used in" asks every feature about an item). Inside `packages/features/src`, a feature may import only `shared/` and `define.ts`, and `shared/` never imports a feature. Verify's manifest step checks every package's dependencies against this table and every import inside the features package.

`design/model/` is session 0's paper model. It stands outside the packages; verify runs it as the simulation step until the real simulation replaces it in session 6.

## 3. The engine

```ts
const engine = createEngine(registry);          // registry: every feature's action rules
engine.advance(state, now, rng)        → { state, events }
engine.command(state, now, cmd, rng)   → { state, events, result }
```

- **Pure.** Time (`now`, milliseconds) and randomness are passed in, never read. The input state is never changed; a new one is returned.
- **Randomness by counter.** `seeded(seed)` gives `rng(stream, counter)`: a number in [0, 1) that depends only on the seed, the stream (each lane is one) and that lane's draw count, which the state keeps. So a result never depends on how time was split between calls or on the order lanes are looked at.
- **Lanes run in time order.** `advance` repeatedly takes the earliest thing due on any lane (a completion, or the fire going out on the second Gathering lane); ties go to the earlier lane in `gathering, gathering2, artisan, combat`. One lane can therefore feed another exactly as it would in real time: a forge that smelts faster than the mine digs runs dry at the right moment. A day of three busy lanes catches up in milliseconds.
- **Composable.** Advancing a to b to c gives exactly a to c, with any commands in between. A property test checks this on random scenarios, and every state the engine produces is checked against the save format.
- **Actions** come from features as `ActionRules`: `check` (why it cannot start, or null), `duration` (may roll), `complete` (take inputs, give outputs, add XP, emit events). A completion counts towards the action's mastery unless `complete` returns `false` (it made nothing: a retreat, or an ingredient gone mid-action). An action with `seeded: true` draws a seed when each repetition starts and gets it in `ctx.seed` (with `ctx.startedAt`) in both `duration` and `complete`, so a fight lasts exactly as long as it plays out and ends as it began. An action repeats until `check` refuses it; then the lane stops with that reason and its queued Next action starts.
- **Time away.** Lanes run until 24 hours after the last input, then rest. The next command shifts resting actions forward, so they resume where they were, with no burst of instant completions.
- **The fire.** Every command lights it for 5 minutes (`fireUntil`). Actions read `ctx.fireBurning` for the XP bonus. The second Gathering lane runs only while it burns and stops with `fireOut` when it goes out. It is for a second skill: one feature never runs in both Gathering lanes (`skillInOtherLane`). `laneFor(state, now, action, kind)` picks the lane an action starts in: the first Gathering lane when it is free or runs that skill, the second while the fire burns and the first runs another skill.
- **Nothing fails silently.** A refused command is an event too (`refused`, with its reason), so the page can say why, as it does for a lane that stops.
- **XP is exact.** `addXp` takes fractions and carries thousandths in the save (`part`), so +15% and +2% bonuses are paid exactly over any length of time.
- **Commands:** `start`, `queueNext`, `clearNext`, `stop` and `stoke`, each validated by a Zod schema. Starting the action a lane is already doing keeps its progress.
- **Events** are a typed union that features extend by augmenting `EventMap`. The kernel emits `laneStopped` (with its reason) and `nextStarted`, never one event per completion. The notable moments every skill shares are named in the kernel too: `levelUp`, `masteryStep`, `find` and `goalDone` (`NOTABLE_EVENTS`). Emitting one notes the moment in the save (`luck.lastMoment`), which the luck guarantee for finds counts from.
- **Save version 2** (session 6) adds `luck` (Uncommon misses and the last moment) and `found` (each find's first-found date: the collection log). Version 1 saves are upgraded; both samples are loaded in tests.
- **Mending.** `load(raw, now)` upgrades an old save to the current version, then `mend` keeps every sound part and repairs or drops the rest. It reports each repair in plain words. Times ahead of the server's clock count as damage. A property test feeds it arbitrary junk at every level of a real save: the result is always a valid save the engine can advance.

## 4. Features

A feature declares itself in one place, `packages/features/src/<id>/index.ts`, and is added to the one list in `registry.ts`:

```ts
export const woodcutting = defineFeature({ id, flag, content, effects, stops, rules, routes, slots, help });
```

| Part | What it is |
| --- | --- |
| `content` | Items, actions (level, seconds, XP, output) and, for a skill, its unlock ladder: checked against the shared Zod schemas as the feature loads |
| `effects` | Every effect kind its content uses; each kind has a handler and a formatter in `@idle-clash/content`, or the build fails |
| `stops` | Stop codes its rules may give beyond the kernel's own; each needs a `stop.<code>` string |
| `rules` | The kernel's `ActionRules` for each of its actions |
| `routes` | One Zod schema per route; the server mounts them from session 5 (`{}` when the kernel's commands suffice) |
| `slots` | Data for named slots in `IA.md`, as pure functions of the state, already formatted for the screen |
| `help` | String keys of its entry in the in-game help |
| `flag` | On or off, with a note; off means its actions cannot start and its slots are hidden |

**Shared machinery.** `shared/skill.ts` turns a ladder and the state into modifiers (perks reached plus the action's mastery), unlock text and the next unlock. `shared/complete.ts` completes a skill action the same way in every skill: a find may turn up (Rare and Legendary by plain chance, raised by perks and rich actions; Uncommon by luck, certain after 4 minutes of active play without a moment; greater finds only from tier 3 and up), the outputs and their extra-item chance, XP with the fire and each Legendary mark, and the level and mastery moments. `shared/skill-slots.ts` fills the slots every skill has (the Skills list row, the skill page's header, actions, finds and ladder, the collection log's group, and the Hearth's Next up), so every skill page reads the same.

**Gathering skills** are built by `shared/gathering.ts` from their tiers (a standard and a rich action each), perks and finds, so Woodcutting and Mining read and play alike. **Smithing** adds ingredients: an action's `takes` are checked before every repetition (`outOfInputs`, naming the item, stops the lane and starts its Next action), used up on completion, and a saving perk may keep one.

**Combat** (session 8) is four skill features with no actions of their own (Melee, Archery, Magic and Hitpoints: their ladders, perks and finds) and the `combat` feature, whose actions are the eight foes, fought in the Combat lane. `shared/combat/` holds what they share: the foes, foods, the triangle and the ladders (`data.ts`); `fight()`, one pure function of fighter, foe, starting health, food and random numbers (`fight.ts`); and combat's part of the save, read through helpers (`state.ts`: what is worn, health as of a moment, the last retreat). A fight eats the best food below half health and retreats below 20% with none left: the lane stops with `retreated`, and nothing is lost but the food eaten. **Your odds** plays 1,000 fights with the same `fight()` and a fixed seed, so the verdict on the page is the engine's own; the simulation checks it against engine-run fights for every foe and style. Gear is worn and taken off through combat's `wear` and `remove` routes; `shared/catalog.ts` lets any feature read an item's gear or food data without importing the feature that defines it.

**Items** (`shared/items.ts`) answer what an item is, where it comes from (actions that give it, finds) and what uses it (actions that take it), by asking every feature's content; the Storehouse's item panel shows the answers. A feature that arrives later answers by declaring its content.

**Goals** (`goals/`) is the first feature that is not a skill: the Hearth's ladder, with first steps whose buttons start their action (or run another feature's route: wearing the sword) and a `claim` route that pays the reward once; a step's reward may come first, with the step before it (the first fight's bread). After First steps (session 9) the ladder holds three short goals, today's daily goal and the nearest milestone. Short goals are sized to 10 to 15 minutes of the player's own pace (`goals/pace.ts` reads every open action's seconds, gold and XP, foes through Your odds) and pay about 10 minutes of that lane's gold; each is drawn from the save's seed and a count, so the page and the server make the same one. A goal remembers where its count began (`base`), so progress is what was done since. A `refresh` route makes the goals the ladder lacks (a claimed short goal's successor, a new day's daily goal); the page sends it when the slot says the ladder needs one.

**The Storehouse** (`storehouse/`, session 9) counts slots (24, and 6 more for each of eight enlargements), sells to the vendor, buys its food and enlarges. Space is checked where items are made: every producing action asks `shared/storehouse.ts` before each repetition, and a lane that would bring a new kind of item into a full Storehouse stops with `storehouseFull`. Gold takes no slot; a find always lands. A route returns its own events (`goalDone`), which the server announces like any other. Goals name other features' actions as data and read shared state; they never import them.

**Words and numbers.** Every player-facing word is a key in `packages/content/src/strings/en.ts`, read through `t(key, params)`. Params are strings only, so every number passes through `fmt` (`fmt.int`, `fmt.pct`, `fmt.seconds`, `fmt.duration`, `fmt.roman`) first. Effect text comes from each kind's formatter, so "Quick swing IV (2.5% faster)" is built from the perk's numbers, never typed beside them.

**What verify holds a feature to** (steps 2 and 3):

- Every part declared; every action has rules and every rule an action; a skill fills its four page slots; every slot it fills is listed in `IA.md`; every slot fills from a new player, the sample saves, a player at the top, and that player after each feature's route examples run in turn (wearing a sword, taking it off), with plain JSON.
- Every feature folder is registered; imports keep to the boundaries above.
- No level of any skill is empty; every action is on its ladder at its level; every output item is defined; every effect it uses is declared and every one it declares is used.
- Every string a feature, an effect, a stop or a lane needs exists, no string goes unused, and none uses a term `GLOSSARY.md` says to avoid.
- Its ladder, read as the player reads it, and its actions' numbers match `GAME_DESIGN.md` exactly; the XP table matches the model's.
- `FEATURES.md` and `GLOSSARY.md` are regenerated from the registry and the glossary data.

## 5. Requests and the server

- **The server is the authority.** The page shows state and sends requests; the server resolves every action.
- **Routes come from contracts.** `contractRoute(app, ROUTES.x, handler)` mounts a route from its contract in `@idle-clash/contracts`: its method, path and Zod input schema. Every schema is strict (an unknown field is refused). A feature's own routes mount at `POST /api/f/<feature>/<route>`, each body `{ requestId, input }` with `input` checked by the feature's schema, and only while the feature's flag is on.
- **Hostile input.** Only `application/json` is parsed (anything else is 415), by a strict parser that refuses `__proto__`, `constructor` and `prototype` keys, repeated keys and nesting deeper than 32. Bodies are capped at 16 KB (413). Names, passwords and reports refuse control and text-direction characters. `apps/server/tests/hostile.test.ts` is generated from the contracts: for every route and field it sends missing, oversized, wrong-type, null, nested and control-character values, and expects exactly the answer the schema gives, never a 500.
- **One at a time per player.** `PlayerQueue` runs each player's requests in order, even when a handler awaits (password hashing, I/O). Different players run side by side.
- **Request ids.** `handle(queue, store, player, requestId, now, handler)` loads the save, returns the stored answer if this id was already handled, and otherwise writes the new state together with the id in one write. The save remembers its last 50 ids, so a double click or a retry does nothing twice. A changing request's answer is `{ result, duplicate, events, state, now }`.
- **Accounts.** Name (3 to 16 characters, unique in any case) and password (10 to 200 characters, stored as Argon2id, m=19456, t=2); players confirm they are 13 or older. A session is 32 random bytes in an `HttpOnly`, `SameSite=Lax` cookie (`Secure` on the live site), stored only as its SHA-256, lasting 30 days from last use. A wrong password and an unknown name get the same answer in the same time. Banned players are refused at every route. Only a proxy on the same machine may set the client's address (`X-Forwarded-For`); from anyone else it is ignored, so it cannot dodge the limits.
- **Limits** (a sliding window in memory, per address and per name or player; a refusal is 429 with `Retry-After`): sign-up 5 an hour per address; sign-in 20 per 15 minutes per address and 10 per name; commands and feature routes 30 per 10 seconds per player; browser error reports 30 a minute per address.
- **Origin and headers.** A changing request from another site is refused (403) by its `Origin` or `Sec-Fetch-Site`. Every answer carries a content security policy (scripts, styles, fonts and connections only from the site; no framing), `nosniff`, a same-origin referrer policy and a permissions policy.
- **Email** (`EMAIL_ENABLED`, off): setting and confirming an address, recovery and reset are built and tested, but their routes are not mounted until the owner switches email on. Recovery always answers alike, whether or not the name exists. Until then the admin page (session 9) resets passwords.
- **The live channel.** `GET /api/live` upgrades to a WebSocket for a signed-in page (others are closed with 4401). After a change is written, the server sends that player's pages `{ type: 'state' }`, and `{ type: 'events' }` when something happened.
- **Flags.** `FEATURES` in the environment lists the features switched on (`all` for every built one); otherwise each feature's own default applies. `GET /api/me` tells the page who is signed in, which features are on, and whether email is.
- **Telemetry and logs.** Notable events (sign-up, sign-in, and the game's notable moments and lane stops as `game.<type>`) are stored in `telemetry` by player id, with no names or addresses. Logs are JSON lines with a request id per request; cookies and authorization headers are redacted. The page reports its own errors to `POST /api/errors`, which logs them.
- **The recap and notices** (session 9). Reading the game (`GET /api/game`) after a quarter of an hour away also answers `away`: the time away, its notable events and lane stops, and what changed in the Storehouse and in XP (`summarizeAway` in the kernel); Uncommon finds the log already holds are counted, not listed. Every written change's notable events and lane stops are kept as notices (`notices`, the newest 100 per player) and listed by `GET /api/notices`; the live channel adds new ones.
- **Hiscores** (session 9). Every written change records the player's level and XP in each skill and in total, with milestones claimed (`hiscores`). `GET /api/hiscores` answers every ladder's top 25 and the asking player's own place, ranked by level then XP, ties to whoever got there first, banned players left out; and how many pages are open.
- **Deleting an account** (`POST /api/account/delete`, with the password and a confirmation) removes every row that names the player, in one transaction: the account, sessions, email tokens, save and damaged copies, notices, hiscores and telemetry. A test reads every table afterwards to prove it.
- **Names.** Offensive names and names that pass for the game (Admin, Moderator) are refused at sign-up (`auth/names.ts`): common profanity written plainly or with digits for letters, without refusing ordinary names that contain the letters (Scunthorpe, Dickens). The admin page renames what it misses.
- **The admin page's routes** (`/api/admin/*`, session 9) are for players named in `ADMIN_NAMES` only: find players, rename, ban and unban (which signs them out everywhere), read and mend a save, and set a new password (shown once to the admin, signing the player out). Each action is recorded in telemetry by player id.
- **Configuration** (environment): `PORT`, `HOST`, `DB_PATH`, `WEB_DIST` (serve the built page), `ORIGINS`, `SECURE_COOKIES`, `EMAIL_ENABLED`, `FEATURES`, `LOG`, `ADMIN_NAMES` (who may open the admin page, by player name).

## 6. Persistence

- **SQLite** in one file, in write-ahead mode, through Drizzle (`better-sqlite3`, which ships prebuilt binaries for every platform). Drizzle keeps a later move to Postgres open.
- **The `saves` table** has one row per player: the JSON save document, its format version, and a revision. A write succeeds only if the revision is still the one read (`SaveConflict` otherwise), and only if the document passes the schema.
- **Reads mend.** A damaged save is mended on read, its original is kept in `damaged_saves` with the list of repairs, and the mended save is written back.
- **Migrations** live in `packages/kernel/migrations`, generated by drizzle-kit from `src/store/schema.ts` (`pnpm --filter @idle-clash/kernel db:generate`), and are applied when the store opens. The server's own tables (`players`, `sessions`, `email_tokens`, `telemetry`, and since session 9 `notices` and `hiscores`) share the file, with migrations in `apps/server/migrations` (`pnpm --filter @idle-clash/server db:generate`) tracked in their own table.
- **Save versions.** `SAVE_VERSION` is 1. A format change adds an upgrade in `versions.ts` and keeps a sample of the old version in `packages/kernel/tests/saves/` for good; tests load every sample.

## 7. The web shell

- **React 19 and Vite 8.** `apps/web` owns the pages and their layout; features fill slots; `@idle-clash/ui` draws everything. A page asks every feature for a slot's data (`fills`) and marks where it drew it with `data-slot`, which is what the tour and verify point at.
- **The layout.** A fixed frame the height of the screen (`100dvh`), like an app: only the page area scrolls, so nothing runs under the bars, and a long list (the ladder) scrolls inside its own box. Verify fails a page that scrolls as a whole, a page area that runs under the bars, or a box taller than the page area. Phone first: header, page, a lanes strip and the menu at the bottom. From 768 px the menu becomes a glyph rail and the strip moves under the header; from 1,024 px a labelled rail on the left and the lanes panel on the right. Sections arrange themselves with container queries on the main column.
- **The design system.** Fourteen components: Button, IconButton, Panel, Pill, ProgressBar, Tabs, ActionRow, LaneCard, ResponsiveTable, ItemIcon, Sheet, Moment, Field, TextLink. Every control carries `data-ui`, so verify can confirm each control is drawn one way everywhere. Tokens: cool birch and slate, moss for progress, woad for what you press, ember for the fire alone, and alert for what went wrong; Alegreya for names and headings, Alegreya Sans for everything else, self-hosted and preloaded.
- **The page and the server.** `src/api.ts` has one function per route, using the contracts' paths and types (not their schemas, so the first page stays small). `src/game/session.ts` asks the server who is here and which features are on. The game itself (`src/game/store.ts`, the engine, the features and the shell in `Game.tsx`) is a second part of the page, loaded once a player is signed in, or while a visitor fills in the welcome form; it loads the save. Between answers the page runs the same engine to show time passing (on the server's clock), shows a command's effect at once, and sends it with a request id, retried with the same id if the connection drops; the server's answer, a live message, or a fresh read when the tab comes back replaces the guess. Its clock ticks only while something is moving, so a resting page uses no CPU. A lost session returns the player to the welcome page.
- **The welcome page** (`/welcome`, `/welcome/sign-in`) stands outside the shell. Anyone not signed in is sent there from any address and returned afterwards. The form checks fields with the server's own schemas before sending.
- **Long lists stay short.** A skill's actions show one tier at a time under tabs (`?tier=`), opening on the newest tier with something open. A lane that stopped by itself shows why in its phone chip, outlined in the alert colour.
- **Moments.** The shell shows notable events as they happen (`shell/moments.ts`): events within 5 seconds show together, best first; levels and Legendary finds take the centre, Rare finds and mastery steps a banner, Uncommon finds and goals a toast. A lane that stops by itself and a refused command each get a toast that says why.
- **The Storehouse** shows its space and what you hold, by kind; each item opens its panel (`?panel=item&item=…`) with Sell (one, ten, all but one), Wear for gear, Comes from and Used in.
- **The Hearth** (session 9) opens on the recap after time away (its five best good things, then any lane that stopped, and Collect, which counts as being back); otherwise today's moments as a short timeline, or a newcomer's welcome. Next up shows the three nearest unlocks. The notices tray lists notices by day, each linking to where to act, and the bell counts those that arrived since it was last opened on this device.
- **The tour** (`shell/Tour.tsx`): on a newcomer's first visit to the Hearth, four pointers at slots by name (the goals, the lanes, the fire, the notices). It blocks nothing, moves on by itself when the first step starts, waits while a sheet is open, and does not return once skipped or done.
- **Pages outside the menu** (session 9): Hiscores reads its ladders from the server; the privacy page and the terms (`/privacy`, `/terms`) read signed in or out; the admin page (`/admin`) is for admins only. A page that loads its own data holds the page's readiness until it arrives (`untilLoaded`), so verify measures it whole.
- **Words** come from the strings file through `t()`; numbers through `fmt`. Sheets (the notices tray, settings, the lanes on a phone) have their own addresses (`?panel=`), so they can be linked and checked.
- **Meaning is never carried by colour alone,** and the tour points at slot names, never at layout classes.

## 8. Tooling and conventions in the code

- **TypeScript 6.0, run directly.** Node 22.18+ strips types itself, so the server, tools and the model run from `.ts` files with no build step. The rules that keep this possible: `erasableSyntaxOnly` (no enums or namespaces), `verbatimModuleSyntax`, and relative imports written with their `.ts` extension. Workspace packages export their `src/index.ts` directly.
- **Why 6.0, not 7.** TypeScript 7 is out, but typescript-eslint (the type-aware lint) supports only versions below 6.1. Move to 7 when it does.
- **Lint** is type-aware (typescript-eslint's recommended-type-checked set), with files capped at 300 lines not counting blanks and comments. **Prettier** keeps formatting out of reviews (Markdown is left alone, so generated tables stay byte-stable).
- **Tests** run on Vitest and live in each package's `tests/` folder.
- **Versions are pinned exactly**, choosing releases at least two weeks old.

## 9. `pnpm verify`

The single command that decides whether a change is done. It prints one line per step and ends green or red.

| Step | Checks | Status |
| --- | --- | --- |
| 1 Typecheck and lint | `tsc` on every project; ESLint; Prettier | Built |
| 2 Manifest | `IA.md`'s menu (six entries at most), pages and slots; each feature's manifest, slots and imports; package dependencies; `FEATURES.md` regenerated | Built |
| 3 Content | `GAME_DESIGN.md` matches its template and the model; schemas, references, effects, no empty levels, strings complete and used, avoided terms, content matches the design; `GLOSSARY.md` regenerated | Built |
| 4 Tests | Every package's tests | Built |
| 5 Simulation | Simulated players on the real engine (`tools/sim/`) for every built skill: pacing to levels 10, 20, 30 and 40 against the brief and the paper model, the first level-up, moments never more than 5 minutes apart, a find in the first hour, three good things after 8 hours away, mastery that still pays 10 levels on, commands rarely refused. Skills that take ingredients are kept stocked, so their own pace is measured; the away recap is judged for a player with every lane that runs while away. A focused fighter for each style (session 8) is held to the same pacing; every foe is fought by each style to show the triangle and that Your odds agrees with the fights; a newcomer follows the Hearth's goals through the first hour (first level, gear worn, first find, a moment about every minute); the recap after 8 hours away is judged as the page shows it, best first; each day's gold covers a day of food and the next Storehouse enlargement; with four lanes, an hour with the fire earns about 1.5 times an hour away. The paper model covers what is not built yet | Real engine for Woodcutting, Mining, Smithing (sessions 6 and 7), combat (session 8), goals, the recap and gold (session 9); paper model for the rest |
| 6 Screenshots | Every view at 320, 390 and 1,440 px in Chromium, Firefox and WebKit: no sideways scroll, nothing off screen, taps 24 px or more, every control from the design system and drawn one way, at most six menu entries, no full-width section of one or two lines, no wide gaps, IA.md's slots visible without scrolling, and the frame (only the page area scrolls, never under the bars). Each page is opened as a newcomer and as a player three weeks in (levels, a full Storehouse, gear, all lanes at work, back after 8 hours away, with a dozen others on the hiscores); the privacy page and terms also as a visitor. Then the account flows and each session's proofs in the page | Built |
| 7 Accessibility | axe (WCAG 2.2 AA and best practice) on every view at every width, light and dark | Built |
| 8 Performance budgets | First page under 250 KB compressed; usable within 2 s with 4x CPU and network throttling; under 2% CPU at rest and with a lane at work | Built |
| 9 Review sheets | Every view beside its IA.md spec, and every icon at 24, 48 and 96 px on both themes, in `.verify/review/`; every item a built feature defines is drawn | Built |

Steps 6 to 9 share one build of the web app and the game's own server on a scratch database with every built feature switched on (`tools/verify/web/`). Every view is opened as a newcomer signed up for the run (the welcome views signed out), and step 6 also walks the account flows in the page: sent to the welcome page, refused with a reason, signed up, a lane kept across a reload, signed out, signed back in. It then proves sessions 6 and 7 in the page (`proofs.ts`, `proofs-lanes.ts`): a forge that runs out of ore says so in its lane and in a notice; a smith who queued a sword behind bars and left three hours ago comes back to swords and the forge stopped, saying why; and, from session 6,: a newcomer on a throttled phone, given a person's time to read, type and tap, has a lane working within 30 seconds; and a save set to turn up a Rare find on the next chop shows its banner and records it in the collection log. The speed budget's first page is the welcome page. A slot IA.md expects but no built feature fills yet is reported as awaiting its feature, and becomes required the moment a feature fills it. GitHub Actions installs the three browsers and runs verify on every push.
