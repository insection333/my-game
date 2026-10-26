# Idle Clash: art style guide

Every item, foe, food, find and skill icon is drawn in code, in `packages/ui/src/icons/`, to these rules. The rules themselves live in code too: `icons/style.tsx` holds the ink, the outline width, the material tones and the `Shape` every icon is built from, so an icon that uses `Shape` keeps most of these rules without trying. The twelve reference icons are the bar. A new icon is judged beside them at 24, 48 and 96 px on both themes (verify writes the sheet to `.verify/review/icons.png`). The owner approves the first icon of each new family; later icons in that family are held to the reference set. **The reference set and this style were approved by the owner on 20 October 2026.**

## The grid

- **48 × 48 units**, drawn on whole and half units. Nothing finer than 1 unit, which is half a pixel at 24 px.
- **The live area is 2 to 46.** Silhouettes fill most of it: a small icon reads as unimportant.
- **Weapons lie on the rising diagonal,** point or head to the upper right (swords at 45°, staves at 35°). Bows stand upright with the string on the right.

## Light and shape

- **One light, from the upper left.** Every shape has three tones: its base, a light region on its upper-left side and a shadow region on its lower right, both clipped inside the shape (`Shape` does the clipping).
- **Flat tones, no gradients.** Gradients blur at 24 px. The single exception is the fire's glyph in the header, which is interface, not item art.
- **One glint** (a small white dot) on metal, glass and glazed surfaces only, on the side facing the light.
- **The outline** is ink `#182024`, 2 units wide (1 px at 24 px), with round joins. Every separate part is outlined, so parts stay distinct at small sizes. The outline holds the silhouette on light surfaces; on dark surfaces the light tones carry it, so every material's light tone is light enough to read on `#1a262b`.

## Materials

Each material has exactly three tones: light, base and shadow.

| Material | Light | Base | Shadow | Used for |
| --- | --- | --- | --- | --- |
| Copper | `#f2a774` | `#c46a3a` | `#86411f` | Tier 1 metal |
| Bronze | `#ecc985` | `#b98a3e` | `#7a5822` | Tier 2 metal; skill seal rims |
| Iron | `#ccd3d7` | `#8f989e` | `#5a6268` | Tier 3 metal |
| Steel | `#f2f6f8` | `#b8c5cd` | `#768792` | Tier 4 metal |
| Ash, pine, oak | see `style.tsx` | | | Bows, staves, handles |
| Bark, heartwood | `#a2714a` / `#f4dcae` | `#6f4a2e` / `#ddb67a` | `#46301d` / `#b2864d` | Pine logs |
| Ash, oak, yew logs | see `style.tsx` (`ashWood`, `oakWood`, `yewWood` and their barks) | | | Logs step from pale to deep as tiers rise, as metals step from warm to cold |
| Amber, silverbark, leaf | see `style.tsx` | | | Finds |
| Stone | `#b3ada4` | `#7f786f` | `#504b45` | Ore rock |
| Fur, skin | see `style.tsx` | | | Beasts |
| Crust, crumb | see `style.tsx` | | | Food |
| Straw, eggshell | see `style.tsx` | | | Finds |
| Moonstone | `#f2fbff` | `#a9d0e6` | `#5f8fae` | Staff heads, glass |
| Seal | `#41545c` | `#2c3b41` | `#1b262b` | Skill seal centres |

**Metals step from warm to cold as tiers rise,** so a player reads a tier from its colour before its shape. Copper, bronze, iron and steel never share a tone. Ember (`#d4511f`) belongs to the fire alone and is never used in item art.

## Families

| Family | How it is drawn | Reference icons |
| --- | --- | --- |
| Weapons | On the diagonal; metal parts in the tier's metal; grips in leather or the tier's wood | Copper sword, Bronze bow, Iron staff |
| Armour | Front view, symmetric, in the tier's metal; plates divided by ink lines | Bronze helm, Steel body |
| Resources | One clear form seen from slightly above: a pile of logs with their cut ends towards you, a chunk of rock with ore, an ingot | Pine logs, Copper ore, Iron bar |
| Foes | A bust in left-facing profile, the eye the brightest point | Hollow rat |
| Food | One item, warm and lit | Bread |
| Finds | The object as it was found. Rarity is shown by a word and a pill beside it, never by colour or a frame alone | Bird's nest |
| Skills | The skill's tool on a slate seal with a bronze rim, which marks the family | Woodcutting |

## Readable at 24 px

- The silhouette alone should say what it is. Check it at 24 px before adding detail.
- At most three materials in one icon, and at most about five interior marks (grain, rivets, bands).
- Detail that vanishes at 24 px may stay if it helps at 96 px, but it must not muddy the small size.

## The mark

The game's own mark is the hearth fire on a dark round seal (`icons/mark.tsx`; chosen by the owner on 22 October 2026): a big flame with a bright core over two crossed logs. It is the site's icon in the browser tab and on a phone's home screen, so it is judged at 16 and 32 px first. The build draws `favicon.svg` from it; `node tools/brand.ts` makes the PNG sizes phones ask for (and `--review` a sheet of it at every size on both themes).

## The region's scene

The march, seen from the road (`packages/ui/src/art/MarchScene.tsx`; placed by the owner behind the welcome page and as a banner across the top of the Hearth): far mountains with snow, the near range, wooded hills, the old road winding up to a smoking forge, a waystone, and tall pines framing it. It is drawn by the icon rules at landscape scale:

- **Flat tones, light from the upper left,** with one exception: the sky is a gradient, since a sky this wide needs one and nothing here is seen at 24 px.
- **Distance is colour:** far layers are paler and cooler and have no outline; only what is near (the pines, the waystone, the forge) has the ink line.
- **Its colours are CSS variables,** so the light theme is a cool morning and the dark theme is night, with stars, the moon and the forge's glow.
- **What matters sits in the middle 960 of its 1,600 units,** so any crop (a phone's banner, a wide screen) keeps it; the edges add pines for wider screens.
- **A little moves** (the owner asked for "slightly more animated", 26 October 2026): smoke rises from the forge's chimney, two clouds take minutes to cross the sky, and now and then a few birds fly over, kept above the welcome page's words. What moves is drawn in a layer of its own over the still scene, so only those few shapes are repainted (verify's CPU budget holds); at night the clouds are faint and the birds stay away; with reduced motion nothing moves.

## Interface glyphs

The menu and header glyphs (Hearth, Skills, Combat, Storehouse, Hiscores, the bell, the account) are signs, not objects. They are drawn on a 24-unit grid as single lines 1.75 units wide in the text colour, in `apps/web/src/shell/glyphs.tsx`. They never use material tones.
