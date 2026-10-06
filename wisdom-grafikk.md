# wisdom-grafikk.md — the graphics track's own notes

For the session in charge of graphics and animation (packs G1–G7, commits
`Grafikkpakke GN: …`). Read it after `Ideer.md` and `wisdom.md`; this file holds what
only matters when you draw. `wisdom.md` stays the source for how Folke works, the
engine rules and the general tool quirks. It was started after G1 (6 October 2026).
Update it at the end of each G pack, and delete what stops being true. Updated after G2.

---

## 1. The job and its limits

- **What you own**: the drawings and how they render. That means `Illustrasjoner.tsx`,
  `Tegnestil.tsx`, `BedriftIkon.tsx`, portraits, crests, stadium, logos, the maps and
  their geometry, `Oppgjor.tsx`, the logo files and `Galleri.tsx`. The full list is under
  *Working side by side* in `Ideer.md`. `styles.css`, the screens and `Ideer.md` are
  shared: touch only what the pack needs (G1 added two `utklipp` props in `Luksus.tsx`,
  nothing else).
- **Never change the engine's behaviour.** No dice, balance or save version. The golden
  master and the bench must be untouched. Run the full suite anyway, since drawing
  tests live next to engine tests.
- **The game track runs at the same time in another session.** Before committing, run
  `git status` and `git log --oneline -5`, then `git add <your paths>` only. Before
  editing `Ideer.md`, check for commits you didn't make. Remove only your own pack line
  and items, by title.
- **Your own server**: `milliardaer-grafikk` on port **5186** (`.claude/launch.json`).
  5184 belongs to the game track. A fresh port starts with an empty save, so build one
  from `/ikon.svg` (recipe in `wisdom.md` §4). `kjopLuksus('seilbaat')` fails without a
  harbour slot, and failures come back as `{ ok: false, feil }`, so log them.

## 2. Folke and the art

- Folke finds the old art amateurish. The diagnosis that landed: toy-coloured flat
  clip-art on a 48×48 grid inside a grown-up dark-and-gold interface. The target is
  illustrations in a business paper, not a mobile game.
- **Ask once, up front, with concrete options** (palette with hex values, scale with
  numbers). For G1 Folke took the recommended option on palette, scale and sky, but
  *not* on the transition: they chose to leave old drawings alone instead of
  recolouring them. So the recommended option isn't always taken. Make every option
  one you'd be happy to build.
- Report each item as what it looks like now. Say plainly what's still mixed or still
  small (the game looks mixed until G7; the kiosk is small because of the scale rule).

## 3. How the new style works (G1)

- The rules are in the header of `Illustrasjoner.tsx`, the tools in `Tegnestil.tsx`,
  and the visual reference is the style sheet at the top of `?galleri`. `NY_STIL`
  lists the ids drawn so far; add every new id there, including city twins that share
  a drawing. The test fails if a 96 drawing is missing from it.
- **Coordinates**: canvas 96, `GRUNNLINJE` = 84, ground band about y 68–96. Depth goes
  up and to the right (`DYBDE` 0.5, −0.3): the side face is `skygge`, the top `lys`, the
  front `flate`. `Kloss` takes `y` as the *bottom* of the box.
- **Scale** (`METER`): close 18, street 10, far 2.5 units per metre. At street distance a
  person is 17.5 and a door 21. A real kiosk (4.2 m) is only 42 wide, so small subjects
  stay small; fill the frame with street life and props, not by inflating the building.
  A skyscraper can't be literal even at far distance: stylise the floor count.
- **A material can be mixed** for one box: `{ lys: S.skifer.flate, flate: S.marine.flate,
  skygge: S.marine.skygge }` gave the kiosk a tar roof over a blue fascia.
- **Business drawings** are `B = (t, f) => <>…</>` wrapped with `bedriftNy(...)` in the
  registry. Stage 0–3 must look different, and each `f` must change the output
  (`pakke38.test.ts`). Place improvement details so they never collide at stage 3 + f3:
  the coffee sign first hung over the parcel locker.
- In `Illustrasjoner.tsx` the new `Person` is imported as **`Figur`** (the old 48 style
  had its own `Person`; the name stuck).
- **How the businesses are built (G2)**: the place itself grows (Folke's choice). At 25
  it gets bigger, at 50 customers or traffic arrive, and at 100 come finer materials,
  warm light and `Plakett`. Small ones at street distance (lemonade stand close up). Big
  ones show the operation from afar on `hav`, `asfalt` or `sno`; the bank is the
  exception, at street distance, because its building *is* the business. Every
  improvement must show on every stage (`grafikkG2.test.ts` checks all 13 × 4 × 4).
  When geometry changes per stage, keep the improvement positions in variables
  (`disk`, `luke`, `x`, `b`) so they follow the building.
- **Helpers added in G2**: `Tre` (leafy or spruce), `Lampe`, `Vindusrad` (lit every
  n-th window), `Bakke` types `hav` (open sea with `HORISONT` = 56, faded at the
  sides and bottom) and `asfalt`, material `lov`. `Passasjerfly` (in Illustrasjoner)
  draws a plane side-on: propeller, jet or widebody.

## 4. SVG techniques that worked, and traps

- **Unique ids**: every gradient, mask and filter id comes from `useId` in `Lerret`,
  reached through context (`useUrl`). Shared ids break when the first copy sits in a
  hidden tab. Small helper components (`Slagskygge`, `Glans` …) read the context, so the
  drawings never deal with ids.
- **Haze**: overriding `fill` on a parent group does nothing, because children's own
  fills win. Use the `feColorMatrix` filter (mix 50 % towards `DISFARGE`) plus group
  opacity 0.7, so the sky also shows through. Without the opacity, hazed things turned
  pale and looked *nearer* against the dark card.
- **Sky**: a radial mask on a vertical gradient. A strong falloff reads as a spotlight
  disc in the wide `.scene` box. Current stops: 0.15→0.85, 0.5→0.5, 0.8→0.14, 1→0. Sky
  colours go through CSS vars (`style={{ stopColor: 'var(--himmel-dag-topp, #…)' }}`);
  presentation attributes can't take `var()`.
- **Ground**: an elliptical mask (`bm`), so the ground fades at the sides *and* the
  back. Hard full-width strips at the bottom (kerb, asphalt, soil) read as the old grey
  bar, so leave them out.
- **Reflection** (`Speiling`): mirror about the baseline, masked with a fading
  gradient in `userSpaceOnUse`.
- **Cutout** (`utklipp`): a place with its own scene (Luksus storage) must not get a
  second sky and floor. In the light theme the 'inne' glow became a white blob on the
  dark garage. Context drops `Bakke`, `Kantfade`, `Speiling` and the sky.
- **Animations**: keyframe px are in 48 units and multiplied by `--utslag` (2 on
  `.lerret`). `getComputedStyle(el).animationName` confirms one runs inside `.scene`.
- **Rounding**: `inn()` rounds to 2 decimals. Loops like `64.4 + i * 3.1` leak
  `56.60000000000001` into the markup, so wrap them in `+(…).toFixed(1)`.
- **Boats sit *in* the water**: end the hull at the waterline with a stripe, plus
  ripples underneath. A full hull on top of the water looked like it was floating.
- **Light cones** with hard edges that touch the frame look cheap. A soft radial glow
  behind the subject works better.
- **Trees**: one trunk and two or three circles is a lollipop. Use a tapered trunk,
  6+ overlapping circles in three tones, and a branch. (`Tre` does this now.)
- **Draw order for attached wings**: a wing that stands in the same front plane as the
  main building must be drawn *after* it, or the main building's shaded side face covers
  it (hotel wing, G2). A wing set back can come first.
- **Keep clear of the frame**: things past x ≈ 90 get cut. Remember that `Kloss`
  adds `d × 0.5` to the right. The bank wings, the hot dog terrace and a parasol all
  ran out in G2. Check the right edge at stage 3 with every improvement on.
- **Level 100 is the crowded stage**: the plaque collided with a helicopter, a crane boom,
  silos and customers. Place the plaque last, in the sky or on a quiet wall, and look at
  stage 3 with f = 3 for every business.
- **Snow on a light sky** disappears in the light theme: give white shapes against the
  sky a thin `fjell.lys` outline (the ski mountain).
- **The newspaper** (`.avisbilde`) is cream paper in both themes; it sets the
  `--himmel-*` vars to the light sky, so drawings print with a pale sky there.

## 5. Reviewing art

- Build a contact sheet: clone `.galleri-stor svg` from the gallery into a fixed
  overlay, set width/height (270–540), and use background `#211e1a` (dark tile) or
  `#eceef2` (light tile). Keep the helper on `window` (`ark(idx, px)`) and re-create it
  after each reload.
- **Stale frames**: after any DOM or CSS change, resize the viewport by 1 px before the
  screenshot. The pane scales wide viewports down a lot; 560×600 gives the most detail
  per drawing. `zoom` with a region isn't supported.
- Check every new drawing at 240+ px, 60 px and 44 px, in both themes, and in each
  place it appears: list card, `.scene` detail view, Luksus storage, city view, gallery.
  The gallery's stage row shows stage n with n improvements.
- Set the light theme with `document.documentElement.dataset.theme = 'light'`. CSS-var
  skies follow it at once; cloned SVGs do too.
- Console errors with an old `?t=` timestamp are leftovers from HMR between patches.
  Reload, wrap `console.error`, click all five tabs, and read the wrapped list.

## 6. Tools (what cost time in G1)

- **G2 workflow that paid off**: each drawing in its own snippet file, spliced in by
  `splice.mjs <id> <snippet>` (replaces `const <id>: B` up to the next drawing, switches
  the registry to `bedriftNy`, adds the id to `NY_STIL`). Small fixes go through
  `fiks.mjs <file> <p.json>`: a JSON list of `[from, to]` pairs that throws if `from` is
  missing. Writing JSON via a quoted heredoc (`<<'EOF'`) avoids Bash eating `${…}`.
  `flytt.mjs` moves a block (draw order). Rebuild these in the scratchpad if gone.
- Draw in batches of three or four, then look at all stages on a contact sheet. Every
  batch found two or three layout bugs that tests can't see.
- Patch with `.mjs` files written by the Write tool, using a `filPatch(fil, [[fra, til]])`
  helper that throws when `fra` is missing and keeps CRLF. **`styles.css` is CRLF**; the
  `.tsx` files are LF. Long drawings go in separate `.txt` snippet files that a script
  splices in between two markers.
- **Never put JSX template strings (`${…}` inside backticks) into `node -e` through
  Bash.** Bash ate them twice and left broken code. Use the Edit tool or a `.mjs` file.
  `sed` lost the escaping in a regex too (`\(\.lerret\)`), so prefer Edit for test regexes.
- When a script asserts a count, count by hand first: I expected 13 keyframe px values
  and there were 10. The script threw halfway after the first part had already written.
- Chroma (RGB max − min) is the "muted" measure, not HSL saturation, which calls pale
  colours "saturated". Old toy colours were 0.54–0.60; the new palette stays ≤ 0.48
  except gold (0.50).

## 7. Notes for the coming packs

- **G2 is done** (all 13 businesses). The old `Bedrift`, `Vekst`, `Kunder`, `Smabaat`,
  `Utmerkelse` and `PLAKETT` are gone. `F`, `Svg` and `Grunn` remain for properties and luxury.
- **The 32 px rival list** in Investeringer shows business drawings very small. The
  scale rule makes the kiosk and the lemonade stand tiny there; G7 could crop or zoom.
- **G5**: `hytte-trysil`, `hytte-lofoten` (shown as "Rorbu") and `kontorbygg-stavanger`
  share new drawings; each needs its own. Cars in the garage are shown as cutouts at
  64 px, so the body must read without a floor.
- Once every drawing is in `NY_STIL`, remove `F`, `Svg`, `Grunn`, the old hairline rule
  and the 48 branch of the test, and turn the "old style" note in the header into history.
