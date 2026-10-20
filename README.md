# Idle Clash

A free browser idle MMO in a medieval fantasy world. The plan is `docs/BRIEF.md`; the design is `GAME_DESIGN.md`, the page map `IA.md`, the player-facing words `GLOSSARY.md`, and how the code is arranged `ARCHITECTURE.md`.

```
pnpm install
pnpm verify      # decides whether a change is done; also runs on every push
```

To play locally: `pnpm --filter @idle-clash/web build`, then `WEB_DIST=../web/dist FEATURES=all pnpm --filter @idle-clash/server start` and open http://127.0.0.1:3000.

Needs Node 22.18 or newer and pnpm 10.
