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
| `@idle-clash/kernel` | The state schema and its versions, time, randomness, `advance`, lanes and the Next queue, events, saves, one-at-a-time requests | nothing in the workspace | Session 2 |
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
advance(state: State, now: number, rng: Rng): { state: State; events: GameEvent[] }
```

- **Pure.** Time (`now`, milliseconds) and randomness (`rng`, seeded and stored in the state) are passed in, never read. The same inputs always give the same result.
- **Composable.** Advancing from a to b and then b to c gives exactly the state of advancing from a to c. Session 2 proves this with property tests.
- **Lanes.** Gathering (and a second Gathering lane while the fire burns), Artisan and Combat. Each runs one action and repeats it; a queued Next action starts when the current one stops, and the stop always carries a reason.
- **Time away.** Completions per lane are counted from elapsed time rather than stepped one by one; finds are rolled in batches; everything is capped at 24 hours after the player's last visit.
- **Events** are a typed union (`levelUp`, `find`, `masteryStep`, `goalDone`, `laneStopped`, and so on). Goals, the away recap, notices, telemetry and the live channel all read the same events.

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
- **One at a time per player.** Each player's requests run through a queue, so two never interleave.
- **Request ids.** Every action carries one; the server remembers recent results, so a double click or a retry does nothing twice.
- **The live channel.** One WebSocket per page, carrying the same typed events the engine produces.
- **Accounts.** Name and password (Argon2id); rate-limited sign-in and sign-up; secure session tokens. Email confirmation and recovery are built behind a switch that stays off until the owner turns it on; until then the admin page resets passwords.

## 6. Persistence

- SQLite in one file, in write-ahead mode, through Drizzle so it can move to Postgres later.
- One row per player holding a versioned document. Migrations live in files, and each version has a sample save that tests load against current content.
- A damaged save is mended where possible, with what was mended logged, rather than refused.

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
