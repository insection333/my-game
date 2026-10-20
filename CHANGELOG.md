# Changelog

- Session 0: game design, page map and glossary, with a paper model that checks every target in the brief.
- Session 1: pnpm workspace with seven packages, CLAUDE.md, ARCHITECTURE.md, and pnpm verify (nine steps; four arrive in session 4) running on every push.
- Session 2: the kernel: state v1, counter-based randomness, time-ordered lanes with Next, the fire and the away cap, mending, SQLite saves with migrations and a v1 sample, one-at-a-time requests with request ids.
- Session 3: the feature framework: defineFeature and the registry, the content package (effects with handlers and formatters, strings, levels, mastery, glossary), manifest and content checks in verify, and Woodcutting's content and rules behind its flag.
- Session 4: the web shell (five pages, two sheets, phone to desktop layouts), the design system (tokens, twelve components), ART.md and twelve reference icons, and verify steps 6 to 9 (screenshots in three engines, axe, speed budgets, review sheets).
- Verify's first step now checks that pnpm-lock.yaml matches every package.json, so a stale lockfile fails locally instead of on GitHub.
- The owner approved the reference icons and the art style (20 October 2026).
- Session 5: the server shell: contracts for every route, accounts (name and password, 13 or older, Argon2id, 30-day sessions), rate limits, strict JSON and security headers, request ids, the live channel, flags from the server, telemetry and browser error reports; email built behind its switch, off. The page now plays through the server, with a welcome page to sign up or in and Sign out in Settings; verify runs against the real server and walks the account flows.
- Sweep after session 5: the page no longer lets an older server state undo a change still on its way, and keeps its last view while signing out, so nothing on screen reads an empty game.
- The shell is a fixed frame in 100dvh: only the page area scrolls, never under the lanes strip or the menu; rails and the lanes panel run full height; the ladder scrolls inside its own box; helper sentences and page leads cut. Verify now fails a page that breaks the frame.
