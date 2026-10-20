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
| `@idle-clash/content` | Content schemas (Zod), the effect kinds with their handlers and text formatters, the strings file and glossary | kernel | Session 3 |
| `@idle-clash/ui` | Design tokens and about ten components | nothing in the workspace | Session 4 |
| `@idle-clash/features` | The registry and one folder per feature | kernel, content, ui | From session 3 |
| `@idle-clash/server` | Fastify: feature routes, accounts, the live channel, admin | kernel, content, features | Session 5 |
| `@idle-clash/web` | The shell: the pages and slots from `IA.md` | content, ui, features | Session 4 |
| `@idle-clash/tools` | `pnpm verify`, the simulation, load test, review sheets | anything | Session 1 onward |

Two rules hold on top of the table: **a feature never imports another feature**, and **nothing imports an app**. Features cooperate through shared state read via the kernel, events they announce, and queries ("Used in" asks every feature about an item). From session 3, verify's manifest step reads every import and fails on an edge the table does not allow.

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

A feature declares itself in one place and is added to one registry:

```ts
defineFeature({ id, flag, content, effects, rules, routes, slots, help })
```

| Part | What it is |
| --- | --- |
| `content` | Data checked by Zod at build time: references resolve, values are in range, no level is empty |
| `effects` | Effect kinds the feature uses; each has a handler and a text formatter, or the build fails |
| `rules` | Pure functions the kernel calls for this feature's actions |
| `routes` | One Zod schema per route: it validates input, types the client and generates contract tests |
| `slots` | Data for named slots in `IA.md`; a slot not listed there fails verify |
| `help` | The feature's entry in the in-game help |
| `flag` | Read on the server and passed to the page, so a feature can be switched off |

Descriptions are generated from numbers by the shared formatter and are never written beside them. That one rule prevents the first attempt's worst drift ("a building said 4% and gave 20%").

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

- React and Vite. The shell owns the pages and their layout; features fill slots; one design-system package draws everything.
- Built at 320 px first, with container queries. Checked at 320, 390 and 1,440 px.
- Meaning is never carried by colour alone, and the tour points at slot names, never at layout classes.

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
| 2 Manifest | `IA.md`'s menu (six entries at most), pages and slots; `FEATURES.md` regenerated; each feature's manifest from session 3 | Page map built; features from session 3 |
| 3 Content | `GAME_DESIGN.md` matches its template and the model; content schemas from session 3 | Design doc built; schemas from session 3 |
| 4 Tests | Every package's tests | Built |
| 5 Simulation | The paper model against every target in the brief | Paper model; the real simulation from session 6 |
| 6–9 | Screenshots, accessibility, performance budgets, review sheets | Session 4 |

A step that is not built yet reports "skip" and names its session. Once the thing it would check exists (any page under `apps/web/src/pages`, any feature folder), an unbuilt step fails instead, so nothing ships unchecked because a check was missing. GitHub Actions runs verify on every push.
