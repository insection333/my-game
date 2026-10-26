# Idle Clash: working notes for every session

The plan is `docs/BRIEF.md`: the pillars, scope, targets, sessions and the owner's decisions. Follow it; ask the owner only owner-level questions (scope, a pillar, a settled decision, or what a player sees on a page).

## Start here

1. Read `ARCHITECTURE.md`, `IA.md`, and the one feature folder being changed. Read nothing else unless needed.
2. Check **Progress** below for the current session and anything outstanding.
3. Run `pnpm install` and then `pnpm verify` to see where things stand.

## Commands

| Command | Does |
| --- | --- |
| `pnpm verify` | Decides whether a change is done (nine steps, one line each). `--only 1,4` runs chosen steps |
| `pnpm test` | The tests alone |
| `pnpm format` | Formats code with Prettier |
| `pnpm load` | The load test: 500 players online against the real server on one core (`PLAYERS`, `MINUTES` to change) |
| `pnpm design:check` | Runs the paper model against every target (writes `design/model/report.md`) |
| `pnpm design:build` | Rebuilds `GAME_DESIGN.md` from `design/GAME_DESIGN.template.md` and the model |

To add a feature: make `packages/features/src/<id>/` with `content.ts`, `rules.ts` and `index.ts` (`defineFeature`), add it to `registry.ts`, add its words to the strings files (`packages/content/src/strings/`: `en.ts`, `en-skills.ts`, `en-combat.ts`), and run `pnpm verify`; steps 2 and 3 list everything still missing. Woodcutting is the model to copy.

To change the game design: edit the model in `design/model/` or the template, run `pnpm design:check`, then `pnpm design:build`, and commit the results. Never edit `GAME_DESIGN.md`, `FEATURES.md` or `GLOSSARY.md` by hand; `GLOSSARY.md` comes from `packages/content/src/glossary.ts`.

## Conventions

- Plan first for any change touching two features or a page's layout; then make small diffs, never whole-file rewrites.
- A new test is run once against the bug it guards, to see it fail.
- One changelog line per change in `CHANGELOG.md`.
- A reported problem is reproduced, and its fix confirmed, at the reporter's screen size doing what they did.
- Pages are compact and held to their spec in `IA.md`: nothing full-width for a line or two, nothing a newcomer needs hidden. A changed page is seen on the review sheet at all three widths before it ships.
- Art follows `ART.md` and is held to the reference set, never "good enough": shaded forms, consistent light from the top left, readable at 24 px, no flat placeholders. Ask the owner only when a new family of art begins.
- Every number on screen comes from data through the shared formatter. Every player-facing word lives in the strings file, and new terms go into `GLOSSARY.md`.
- A feature never imports another feature; it reads shared state through the kernel and announces what happened as events.
- Files stay under 300 lines (lint enforces it).
- Each chat ends with verify green and the branch pushed.

## Done means

- [ ] Its feature's manifest is complete and the checks pass
- [ ] Every number on screen comes from data through the shared formatter
- [ ] A new test was seen to fail against what it guards
- [ ] Its pages pass their spec at 320, 390 and 1,440 px
- [ ] It serves a pillar, and the targets still hold
- [ ] Verify is green and the changelog has one line

## Git

- One branch per session (`session-N`), branched from `main`, merged into `main` when verify is green on GitHub.
- The repository is `insection333/my-game`. GitHub Actions runs `pnpm verify` on every push (`.github/workflows/verify.yml`).
- Commit messages end with the attribution lines the environment provides.

## Environment

- Node 22.18 or newer (`.nvmrc` pins 22.22.0) runs TypeScript directly; pnpm 10.28 (`packageManager` in `package.json`).
- `better-sqlite3` loads its bundled prebuilt binary; its install-time rebuild is switched off in `pnpm-workspace.yaml` (it would download Node headers, which this workspace cannot reach).
- Browsers for steps 6 to 9: Firefox and WebKit are installed in `/opt/pw-browsers` (downloaded from `cdn.playwright.dev`, which the owner allowed). Playwright's own Chromium is hosted on Google storage, which this workspace cannot reach, so verify falls back to the preinstalled Chromium there. GitHub Actions installs all three itself.
- See the game yourself: `pnpm --filter @idle-clash/web build`, then `WEB_DIST=../web/dist FEATURES=all DB_PATH=/tmp/ic.db pnpm --filter @idle-clash/server start` and open `http://127.0.0.1:3000`. For live reloading, run the server without `WEB_DIST` and `pnpm --filter @idle-clash/web dev` beside it (Vite passes `/api` to port 3000).
- The domain is idleclash.com, served from a VentraIP VPS (`OPERATIONS.md`: setup, deploy, rollback, backups, restore). `main` deploys itself after verify passes, once the server's secrets are in GitHub. Transactional email stays off (`EMAIL_ENABLED`) until the owner says otherwise.
- The ops tests and step 1 need `sqlite3`, `rclone` and `shellcheck` (`apt-get install sqlite3 rclone shellcheck`; GitHub Actions installs them).
- Admins are named in `ADMIN_NAMES` (comma-separated player names; on the live server, the GitHub Actions variable of that name, written at each deploy). A listed name cannot be signed up for, so the account is made first and its name listed after. Verify's screenshot server lists its veteran player once signed up, so the admin page is checked with players on it.

## Progress

| Session | State |
| --- | --- |
| 0 Design on paper | Done: `GAME_DESIGN.md`, `IA.md`, `GLOSSARY.md`; every target passes in the paper model |
| 1 Workspace and verify | Done: seven packages; `pnpm verify` green locally and on GitHub Actions (steps 6–9 arrive in session 4) |
| 2 The kernel | Done: `advance` composes (property-tested), saves round-trip and mend, requests never interleave and act once |
| 3 The feature framework | Done: `defineFeature`, the manifest and content checks, effects with formatters, the strings file; Woodcutting's content and rules behind its flag |
| 4 The shell and the design system | Done: pages, twelve components (thirteen since session 5), steps 6 to 9 green in three engines; `ART.md` and twelve reference icons, approved by the owner on 20 October 2026 |
| 5 The server shell | Done: accounts, security, contracts, the live channel, flags, telemetry and error reports; the page plays through the server; the hostile-input suite (245 cases) and the account tests green, sign-up and sign-in rate-limited |
| 6 Woodcutting, end to end | Done: finds with luck and the collection log, mastery and level moments, the first first-steps goal, save version 2, eight new icons, the real simulation for Woodcutting; a newcomer chops within 30 s, 8 hours away is credited exactly, a Rare find has its moment |
| 7 Mining and Smithing | Done: both skills on the shared machinery, recipes with ingredients and the three weapon kinds, first steps 2 to 4, the fire's lane for a second skill, the Storehouse's items with Comes from and Used in, 43 new icons, the simulation for all three skills; every lane stop says why, a queued action starts while away |
| 8 Combat | Done: the three styles and Hitpoints, eight foes, the triangle, gear, food, retreat, Your odds from the engine's own fights, first steps 5 and 6, 27 new icons, fighters in the simulation; each style wins where the triangle says, Your odds agrees with engine-run fights, a retreat costs nothing |
| 9 Goals, the Storehouse and vendor, hiscores, admin | Done: the goals ladder (short goals by pace, a daily goal, milestones), the away recap and Today, the notices tray, the Storehouse's space with selling and the vendor's food, hiscores, account deletion, names refused, privacy and terms, the admin page, the tour, using a Rare find, six skill seals; a fresh player meets the first-hour targets, the recap leads with the best thing, every page passes its spec and budgets (as a newcomer and three weeks in), a deleted account leaves nothing, an admin resets a password |
| 10 Ship | Built and waiting on the owner: setup, deploy and rollback, backups with a rehearsed restore, the uptime health answer and the 500-player load test are built and tested; the owner holds launch until the game is near a AAA standard, so the quality pass is under way (motion, the site icon, the region's scene, sound, moments, Skills, Combat, Hiscores); waiting on the server |

| 11 to 18 The expansion | In progress (`docs/EXPANSION.md`): 11 feel, 12 the climb to 99, 13 Fishing and Cooking, 14 Fletching and Runecraft, 15 deeds and titles, 16 expeditions and bosses, 17 Rekindling, 18 the year and the closed test |

Outstanding: nothing beyond the current session. Forgotten passwords are reset from the admin page while email is off; the owner's account is made an admin by naming it in `ADMIN_NAMES` after signing up. The contact address is admin@idleclash.com.
