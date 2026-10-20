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
| `pnpm design:check` | Runs the paper model against every target (writes `design/model/report.md`) |
| `pnpm design:build` | Rebuilds `GAME_DESIGN.md` from `design/GAME_DESIGN.template.md` and the model |

To change the game design: edit the model in `design/model/` or the template, run `pnpm design:check`, then `pnpm design:build`, and commit the results. Never edit `GAME_DESIGN.md` or `FEATURES.md` by hand.

## Conventions

- Plan first for any change touching two features or a page's layout; then make small diffs, never whole-file rewrites.
- A new test is run once against the bug it guards, to see it fail.
- One changelog line per change in `CHANGELOG.md`.
- A reported problem is reproduced, and its fix confirmed, at the reporter's screen size doing what they did.
- Pages are compact and held to their spec in `IA.md`: nothing full-width for a line or two, nothing a newcomer needs hidden. A changed page is seen on the review sheet at all three widths before it ships.
- Art is held to the reference set, never "good enough": shaded forms, consistent light from the top left, readable at 24 px, no flat placeholders. Ask the owner only when a new family of art begins.
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
- Playwright browsers for steps 6 and 7 (from session 4) download from `cdn.playwright.dev` and `playwright.download.prss.microsoft.com`; the owner has allowed both.
- The domain is idleclash.com; there is no server yet (session 10). Transactional email stays off until the owner says otherwise.

## Progress

| Session | State |
| --- | --- |
| 0 Design on paper | Done: `GAME_DESIGN.md`, `IA.md`, `GLOSSARY.md`; every target passes in the paper model |
| 1 Workspace and verify | Done when verify is green on GitHub |
| 2 The kernel | Next |

Outstanding: nothing beyond the next session.
