# Idle Clash

A free browser idle MMO in a medieval fantasy world. The plan is `docs/BRIEF.md`; the design is `GAME_DESIGN.md`, the page map `IA.md` and the player-facing words `GLOSSARY.md`.

Session 0's paper model lives in `design/model/` and runs on Node 22 with no installs:

```
node design/model/checks2.ts     # every target, worked through the model; exits 1 on a failure
node design/model/build-docs.ts  # rebuilds GAME_DESIGN.md from design/GAME_DESIGN.template.md
```
