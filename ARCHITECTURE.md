# Idle Clash: architecture

How the code is arranged and why. `docs/BRIEF.md` is the plan, `GAME_DESIGN.md` the rules of the game, `IA.md` the pages. Parts marked with a session number are not built yet; this file is updated as each one lands.

## 1. The shape

```
            ┌──────────────────────── apps ────────────────────────┐
            │  server (Fastify)                 web (React, Vite)  │
            │  routes, accounts, live channel   the shell: pages,  │
            │  admin                            slots, the tour    │
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
| `@idle-clash/ui` | Design tokens (`tokens.css`, `base.css`), twelve components, and the item art (`icons/`, see `ART.md`) | nothing in the workspace | Session 4 (built) |
| `@idle-clash/features` | `defineFeature`, the registry, shared skill machinery (`shared/`), and one folder per feature | kernel, content, ui | Session 3 (built); features from session 6 |
| `@idle-clash/server` | Fastify: feature routes, accounts, the live channel, admin | kernel, content, features | Session 5 |
| `@idle-clash/web` | The shell: the pages and slots from `IA.md` | kernel (never `/store`), content, ui, features | Session 4 (built) |
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
- **Actions** come from features as `ActionRules`: `check` (why it cannot start, or null), `duration` (may roll), `complete` (take inputs, give outputs, add XP, emit events). A completion counts towards the action's mastery. An action repeats until `check` refuses it; then the lane stops with that reason and its queued Next action starts.
- **Time away.** Lanes run until 24 hours after the last input, then rest. The next command shifts resting actions forward, so they resume where they were, with no burst of instant completions.
- **The fire.** Every command lights it for 5 minutes (`fireUntil`). Actions read `ctx.fireBurning` for the XP bonus. The second Gathering lane runs only while it burns and stops with `fireOut` when it goes out.
- **Commands:** `start`, `queueNext`, `clearNext`, `stop` and `stoke`, each validated by a Zod schema. Starting the action a lane is already doing keeps its progress.
- **Events** are a typed union that features extend by augmenting `EventMap`. The kernel itself emits only `laneStopped` (with its reason) and `nextStarted`, never one event per completion: the away recap compares states before and after.
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

**Shared machinery.** `shared/skill.ts` turns a ladder and the state into modifiers (perks reached plus the action's mastery), unlock text and the next unlock. `shared/skill-slots.ts` fills the slots every skill has (the Skills list row, the skill page's header, actions and ladder, and the Hearth's Next up), so every skill page reads the same.

**Words and numbers.** Every player-facing word is a key in `packages/content/src/strings/en.ts`, read through `t(key, params)`. Params are strings only, so every number passes through `fmt` (`fmt.int`, `fmt.pct`, `fmt.seconds`, `fmt.duration`, `fmt.roman`) first. Effect text comes from each kind's formatter, so "Quick swing IV (2.5% faster)" is built from the perk's numbers, never typed beside them.

**What verify holds a feature to** (steps 2 and 3):

- Every part declared; every action has rules and every rule an action; a skill fills its four page slots; every slot it fills is listed in `IA.md`; every slot fills from a new player, the sample save and a player at the top, with plain JSON.
- Every feature folder is registered; imports keep to the boundaries above.
- No level of any skill is empty; every action is on its ladder at its level; every output item is defined; every effect it uses is declared and every one it declares is used.
- Every string a feature, an effect, a stop or a lane needs exists, no string goes unused, and none uses a term `GLOSSARY.md` says to avoid.
- Its ladder, read as the player reads it, and its actions' numbers match `GAME_DESIGN.md` exactly; the XP table matches the model's.
- `FEATURES.md` and `GLOSSARY.md` are regenerated from the registry and the glossary data.

## 5. Requests and the server

- **The server is the authority.** The page shows state and sends requests; the server resolves every action.
- **One at a time per player.** `PlayerQueue` runs each player's requests in order, even when a handler awaits (password hashing, I/O). Different players run side by side.
- **Request ids.** `handle(queue, store, player, requestId, now, handler)` loads the save, returns the stored answer if this id was already handled, and otherwise writes the new state together with the id in one write. The save remembers its last 50 ids, so a double click or a retry does nothing twice.
- **The live channel** (session 5): one WebSocket per page, carrying the same typed events the engine produces.
- **Accounts** (session 5): name and password (Argon2id); rate-limited sign-in and sign-up; secure session tokens. Email confirmation and recovery are built behind a switch that stays off until the owner turns it on; until then the admin page resets passwords.

## 6. Persistence

- **SQLite** in one file, in write-ahead mode, through Drizzle (`better-sqlite3`, which ships prebuilt binaries for every platform). Drizzle keeps a later move to Postgres open.
- **The `saves` table** has one row per player: the JSON save document, its format version, and a revision. A write succeeds only if the revision is still the one read (`SaveConflict` otherwise), and only if the document passes the schema.
- **Reads mend.** A damaged save is mended on read, its original is kept in `damaged_saves` with the list of repairs, and the mended save is written back.
- **Migrations** live in `packages/kernel/migrations`, generated by drizzle-kit from `src/store/schema.ts` (`pnpm --filter @idle-clash/kernel db:generate`), and are applied when the store opens.
- **Save versions.** `SAVE_VERSION` is 1. A format change adds an upgrade in `versions.ts` and keeps a sample of the old version in `packages/kernel/tests/saves/` for good; tests load every sample.

## 7. The web shell

- **React 19 and Vite 8.** `apps/web` owns the pages and their layout; features fill slots; `@idle-clash/ui` draws everything. A page asks every feature for a slot's data (`fills`) and marks where it drew it with `data-slot`, which is what the tour and verify point at.
- **The layout.** Phone first: header, page, a lanes strip and the menu held at the bottom. From 768 px the menu becomes a glyph rail and the strip moves under the header; from 1,024 px a labelled rail on the left and the lanes panel on the right. Sections arrange themselves with container queries on the main column.
- **The design system.** Twelve components: Button, IconButton, Panel, Pill, ProgressBar, Tabs, ActionRow, LaneCard, ResponsiveTable, ItemIcon, Sheet, Moment. Every control carries `data-ui`, so verify can confirm each control is drawn one way everywhere. Tokens: cool birch and slate, moss for progress, woad for what you press, and ember for the fire alone; Alegreya for names and headings, Alegreya Sans for everything else, self-hosted.
- **Until the server (session 5),** the page runs the kernel engine itself (`src/game/store.ts`), so every screen is live. Its clock ticks only while something is moving, so a resting page uses no CPU. `?features=all` switches on every built feature for previews and verify.
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
| 5 Simulation | The paper model against every target in the brief | Paper model; the real simulation from session 6 |
| 6 Screenshots | Every view at 320, 390 and 1,440 px in Chromium, Firefox and WebKit: no sideways scroll, nothing off screen, taps 24 px or more, every control from the design system and drawn one way, at most six menu entries, no full-width section of one or two lines, no wide gaps, and IA.md's slots visible without scrolling | Built |
| 7 Accessibility | axe (WCAG 2.2 AA and best practice) on every view at every width, light and dark | Built |
| 8 Performance budgets | First page under 250 KB compressed; usable within 2 s with 4x CPU and network throttling; under 2% CPU at rest and with a lane at work | Built |
| 9 Review sheets | Every view beside its IA.md spec, and every icon at 24, 48 and 96 px on both themes, in `.verify/review/` | Built |

Steps 6 to 9 share one build of the web app and one local server (`tools/verify/web/`). Every view is opened as a newcomer with every built feature switched on; a slot IA.md expects but no built feature fills yet is reported as awaiting its feature, and becomes required the moment a feature fills it. GitHub Actions installs the three browsers and runs verify on every push.
