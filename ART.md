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
| Bosses | Foes, larger and marked out: a crown, a barnacled helm and lantern-light, horns and a jaw of fire; still a bust in left-facing profile with the eye the brightest point | The Troll-chief of the hill (session 16) |
| Relics | A keepsake hung from a leather cord, which marks the family; below it the thing itself, one object lit from the upper left. Castle Clash's nine war relics (session 41) are the objects alone, larger, with no cord: they are kept in the Reliquary, not carried, and drawn in grey until forged | Heartwood charm, Hearthstone (session 16) |
| Regions | A small landscape on a round shield of sky, the region's own land and colour: an expedition's icon | The march, the Sunken Fen, the Ashen Peaks (session 16) |
| Paths | The Path's emblem on a round ember seal with a fiery inner ring, which marks the family: a bound sheaf for Bounty, an open book for Lore, a starred gold coin for Fortune | Bounty, Lore, Fortune (session 17) |
| Fish | On a slant, head low on the left, tail up on the right, so it fills the square as a sword does; back lit, belly in shade, the eye the brightest point. Each kind has its own skin and marks; cooked, it turns golden brown with grill marks and a cloudy eye | Perch, Cooked perch, Salmon, Pike pie (approved 27 October 2026) |
| Pictures (session 43) | A player's display picture: a head and shoulders (or a beast's head) inside a round of its own colour, rimmed in the metal of the frame the player shows (bronze by default; silver, gold, dawn, royal purple, obsidian). Folk of the march seen from the front under a morning sky, told apart by headgear and what they carry (the forester's hood and axe, the delver's lamp, the smith's beard, the angler's brim, the ranger's feather, the mage's starred hat, the knight's plumed helm); beasts in the greenwood (stag, wolf, owl, boar, raven); foes overcome against dusk and the bosses against embers, drawn from their own busts. A glow, when shown, is a slow ring of light round the rim, drawn by the page | Forester, Stag, Hill troll (the owner asked for thirty pictures by name, 3 November 2026) |
| Badges (session 43) | A rare feat's mark beside a title: one bold emblem in gold (tower, skull, star, flame, wyrm, crown) on a dark lozenge rimmed in gold, read at 16 to 24 px | Crown |
| The castle (session 41) | Castle Clash's works and garrison, each one thing in its own materials: the buildings (a stretch of curtain wall with its gate, a round vault door with a gold lock, a crenellated watchtower with its beacon, a hood with two eyes for the spy guild), the War College's studies (a supply cart, a battering ram, a mason's square on a stone, a mask before a dagger), the three edicts as banners hung from a gilded bar in the colours they fly on the keep, what a battle report is drawn with (session 42: a spyglass, a vial, a lit charge and a sealed order for the four spy missions; a pile of coins, a red seal of war marks, a torn purse for gold lost), and each troop at its four evolutions, a step up in metal and finish each (wood and iron, iron, gold, dawnsteel, as gear's tiers step): the vanguard a shield before a polearm, the outriders a horse's head beside an upright lance, the siege train its engine (trebuchet, bombard, hellcannon, the crystal engine) | Walls, Levy spearmen, Border scouts, Timber trebuchets (awaiting the owner's approval) |
| Arms (session 41) | A heater shield, one per lord and stronghold, drawn from its id: one colour (red, blue, green, purple, black), divided with a metal (gold or silver; per pale, per fess, per bend, a chief, a chevron, quarterly) or plain, and a charge in the other metal (a star, a tower, a crescent, a roundel, a cross, a key). Metal on colour, as heralds have it, so each reads at 24 px; the ink line holds a charge where it crosses the division | The review sheet's eight samples (awaiting the owner's approval) |

## Readable at 24 px

- The silhouette alone should say what it is. Check it at 24 px before adding detail.
- At most three materials in one icon, and at most about five interior marks (grain, rivets, bands).
- Detail that vanishes at 24 px may stay if it helps at 96 px, but it must not muddy the small size.

## The mark

The game's own mark is the hearth fire on a dark round seal (`icons/mark.tsx`; chosen by the owner on 22 October 2026): a big flame with a bright core over two crossed logs. It is the site's icon in the browser tab and on a phone's home screen, so it is judged at 16 and 32 px first. The build draws `favicon.svg` from it; `node tools/brand.ts` makes the PNG sizes phones ask for (and `--review` a sheet of it at every size on both themes).

## The climb's tiers and regions (session 12)

Tiers 5 to 8 keep the march's drawings (the log pile, the rock with its nuggets, the ingot, each weapon and armour piece) in new materials, and add two regions' foes as busts like the march's:

- **Metals:** moonsilver (pale, cool), star-iron (dark blue), embersteel (near-black with a hot edge; its bar's top glows), dawnsteel (white with gold shadow). The march's rule, warm to cold, gives way to light to dark to hot to bright, so each later tier still reads before its shape.
- **Woods:** maple (red-orange), silverbark (pale, grey bark), elderwood (plum), ancient (olive-gold, a fleck of light in each cut end).
- **Ores lie in their own rock:** moonsilver in blue-grey stone, star-iron's pale flecks in black rock, ember ore glowing out of volcanic glass; dawnstone is a cluster of pale gold crystals.
- **The Sunken Fen's foes** wear bog-green, reed-gold and drowned-grey, with weed and water about them; **the Ashen Peaks'** are ash, obsidian and fur, with ember cracks and glowing eyes.
- **The later foods:** roast fowl, a hunter's feast on a board, a warden's raised pie.

## Fishing and Cooking (session 13)

The fish family the owner approved on 27 October 2026 (`icons/fish.tsx`, `fish-late.tsx`, `dishes.tsx`, `finds-food.tsx`):

- **One body, many fish.** Every fish but the eel shares one drawn body, made slimmer or fuller per kind (a pike long and lean, a carp deep) and marked with its own skin: the perch's bars, the trout's pink stripe and spots, the pike's pale spots, the salmon's silver flank under a dark spotted back, the moon carp's big scales and whiskers, the ember char's glowing belly, the dawn sturgeon's row of bony plates and pointed snout. The silver eel is its own long S.
- **Cooked** fish keep their kind's shape and turn golden brown (the salmon and trout a pinker gold), with three grill marks and a cloudy eye, so raw and cooked read apart at 24 px.
- **Pies** are the vendor's pie dish with two of the tier's fish heads looking up out of the crust; **stews** are the hearty stew's wooden bowl, the tier's fish tail rising from a broth in the tier's colour.
- **Finds** come up from the water or out of a cook's keeping: a pearl mussel, a river pearl, a message in a bottle, a drowned signet ring, a great scale of the deep and a fen-king's crown hung with weed; wild herbs, saffron in a tied sack, a grandmother's sealed recipe, a silver ladle, an ever-warm pot and a cauldron of plenty spilling gold.
- **Seals:** Fishing's hook and line with a red float; Cooking's pot over a small flame.

## Supplies (session 14)

The owner approved the supplies family's references on 27 October 2026 (`icons/supplies.tsx`): a fanned bundle of three arrows (the tier's metal at the heads, its wood in the shafts), a rune (a flat stone with its carved mark glowing in the tier's light), a whetstone (a gritty stone bound in the tier's metal) and a standing-stone key (the tier's metal, a rune-stone set in its bow). Step 14 drew all eight tiers of each to it (`icons/supplies-index.tsx`): arrows in each tier's metal and wood; whetstones bound in its metal; each rune with its own carved mark in its own light (a spark's zigzag, a gale's streams, a tide's waves, the earth's hill, the moon's crescent, a star's rays, an ember's flame, the dawn's sun on the skyline); keys from bronze to dawnsteel, the tier's rune light in the stone of the bow. Fletching's finds are a fletcher's treasures (a heron's quill to the quiver of the wild hunt) and Runecraft's what turns up at the stones (a chalk stub to the ancients' star chart); its seal is a standing stone with a glowing mark, Fletching's an arrow.

## Seals that grow

A skill's seal is rimmed in the metal of the highest tier its skill has reached: copper, then bronze, iron and steel, then moonsilver, star-iron, embersteel and dawnsteel. At the top level a small amber star sits on the rim's foot. Each Kindling past 99 sets a small flame on the rim's crown, up to five, spread evenly about the top (session 17). The icon sheet shows one seal at each tier. Where no player's skill is meant (a ladder's tab, the icon sheet's own entry), the rim is bronze.

## The region's scene

The march, seen from the road (`packages/ui/src/art/MarchScene.tsx`; placed by the owner behind the welcome page and as a banner across the top of the Hearth): far mountains with snow, the near range, wooded hills, the old road winding up to a smoking forge, a waystone, and tall pines framing it. It is drawn by the icon rules at landscape scale:

- **Flat tones, light from the upper left,** with one exception: the sky is a gradient, since a sky this wide needs one and nothing here is seen at 24 px.
- **Distance is colour:** far layers are paler and cooler and have no outline; only what is near (the pines, the waystone, the forge) has the ink line.
- **Its colours are CSS variables,** so the light theme is a cool morning and the dark theme is night, with stars, the moon and the forge's glow.
- **What matters sits in the middle 960 of its 1,600 units,** so any crop (a phone's banner, a wide screen) keeps it; the edges add pines for wider screens.
- **A little moves** (the owner asked for "slightly more animated", 26 October 2026): smoke rises from the forge's chimney, two clouds take minutes to cross the sky, and now and then a few birds fly over, kept above the welcome page's words. What moves is drawn in a layer of its own over the still scene, so only those few shapes are repainted (verify's CPU budget holds); at night the clouds are faint and the birds stay away; with reduced motion nothing moves.

## The lord's castle

The Castle Clash banner (`packages/ui/src/art/CastleScene.tsx`, session 41; the parts in `castle-parts.tsx`): the lord's castle on its mound in the march, under the region's own sky, hills and pines (`landscape.tsx`, shared with the region's scene, with its day and night). The castle is drawn by the icon rules (flat tones, three to a material, the ink line), its ink thickened so it holds at a quarter size on a phone. It shows the castle as it is:

- **The walls' material by the walls' level:** a timber palisade with a timber keep below 5, rough fieldstone from 5, dressed stone from 15, merlons capped in iron from 30, white stone with gold from 60. Under 100% they show cracks; under 80% merlons are missing and stones lie at their foot.
- **The keep rises a storey** at an average level of 5, 15 and 30 (one to four). The edict in force flies on it in its colour (Harvest gold, Vigor green, Fortune blue); with none, plain cloth.
- **Towers by the watchtower's level:** two at the corners from 5, a third from 15, a fourth from 30, under slate cones; from 50 the corner towers are crenellated and burn beacons.
- **After a siege,** for six hours: fires on the walls with smoke rising, and two tents of the foe's red in the field.
- **Night in the dark theme:** the castle is dimmed and cooled by one filter; its windows and fires are drawn over it, still lit.
- **The crop follows the frame:** it keeps the castle's band (from the banner's tip to the walls' foot) and shows as much of the march either side as the frame's shape allows, so on a phone the castle fills the banner and on a wide screen the pines frame it.
- **What moves** is in its own layer, as the region's scene's: the clouds, the banner stirring, the beacons and siege fires flickering, the smoke. With reduced motion nothing moves and the smoke hangs still.

## The loadout's figure

A person seen front on (`packages/ui/src/art/Figure.tsx`, 144 by 200), the Combat page's loadout: the gear tiles sit on it where each piece is worn, the helm on the head, the body on the chest, the legs on the legs and the weapon in the right hand. It is a quiet outline in the surface's own tones (the panel's second surface, the strong line), lit from the upper left like everything else (a lighter shoulder, arm and crown), so the gear's icons on it stay the brightest things in the panel. It is never detailed into a character: it stands for the player, whoever they are.

## Interface glyphs

The menu and header glyphs (Hearth, Skills, Combat, Storehouse, Hiscores, the bell, the account) are signs, not objects. They are drawn on a 24-unit grid as single lines 1.75 units wide in the text colour, in `apps/web/src/shell/glyphs.tsx`. They never use material tones. The cross that closes every popup (`CloseButton`, session 42) and the crossed blades between two sides' arms on a battle report are signs of the same kind.
