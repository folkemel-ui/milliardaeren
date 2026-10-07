# wisdom-grafikk.md — the graphics track's own notes

For the session in charge of graphics and animation (packs G1–G11, commits
`Grafikkpakke GN: …`). Read it after `Ideer.md` and `wisdom.md`; this file holds what
only matters when you draw. `wisdom.md` stays the source for how Folke works, the
engine rules and the general tool quirks. It was started after G1 (6 October 2026).
Update it at the end of each G pack, and delete what stops being true. Updated after G8.
G9–G11 are planned in `Ideer.md`.

---

## 1. The job and its limits

- **What you own**: the drawings and how they render. That means `Illustrasjoner.tsx`,
  `Tegnestil.tsx`, `BedriftIkon.tsx`, portraits, crests, stadium, logos, the maps and
  their geometry and data (`Kartmerke.tsx`, `kartdata.ts`, `scripts/lag-kartdata.mjs`), the paintings (`Malerier.tsx`), the wordmarks (`ordmerker.ts`, `scripts/lag-ordmerker.mjs`), `Oppgjor.tsx`, the detail pages for things you own (`screens/Tingdetalj.tsx`, `ui/detaljvisning.ts`, G7), the logo files and `Galleri.tsx`. The full list is under
  *Working side by side* in `Ideer.md`. `styles.css`, the screens and `Ideer.md` are
  shared: touch only what the pack needs (G1 added two `utklipp` props in `Luksus.tsx`,
  nothing else).
- **A bug you find in the game track's code gets flagged, not fixed.** In G5 a test
  save crashed in `avis.ts`. I proved it wasn't the drawings (stack trace from
  `/ikon.svg`), offered it as a separate task with a self-contained description
  (`spawn_task`), mentioned it in the report and carried on. Folke started it at once.
- **Never change the engine's behaviour.** No dice, balance or save version. The golden
  master and the bench must be untouched. Run the full suite anyway, since drawing
  tests live next to engine tests.
- **The game track runs at the same time in another session.** Before committing, run
  `git status` and `git log --oneline -5`, then `git add <your paths>` only. Before
  editing `Ideer.md`, check for commits you didn't make. Remove only your own pack line
  and items, by title.
- **Your own server**: `milliardaer-grafikk` on port **5186** (`.claude/launch.json`).
  5184 belongs to the game track. In G7, `preview_start` refused because an earlier
  graphics session's server still held 5186. It serves this same folder with HMR, so
  `navigate` to `http://localhost:5186/` in the pane worked fine; don't change ports. A fresh port starts with an empty save, so build one
  from `/ikon.svg` (recipe in `wisdom.md` §4). `kjopLuksus('seilbaat')` fails without a
  harbour slot, and failures come back as `{ ok: false, feil }`, so log them.

## 2. Folke and the art

- **"What is your next task?" is a question, not a go.** Answer it and stop. In the G4
  session I sent the design questions straight away, and Folke stopped me: "I didn't
  tell you to start on it." Start a pack only when Folke says so.
- **Read the three files in full before you say you've read them**: `Ideer.md`
  (at least the plan and your sections), `wisdom.md` and this file. Folke asks
  "have you read the wisdom file?" at the start; skimming two sections didn't count.
- Folke finds the old art amateurish. The diagnosis that landed: toy-coloured flat
  clip-art on a 48×48 grid inside a grown-up dark-and-gold interface. The target is
  illustrations in a business paper, not a mobile game.
- **Ask once, up front, with concrete options** (palette with hex values, scale with
  numbers). For G1 Folke took the recommended option on palette, scale and sky, but
  *not* on the transition: they chose to leave old drawings alone instead of
  recolouring them. So the recommended option isn't always taken. Make every option
  one you'd be happy to build. For G2 Folke took all three recommendations (growth,
  big ones from afar, level 100). Options that named examples per business ("the café
  takes over the shop next door, the oil field gets a second platform") were easy to
  answer. For G3 Folke took all four (atlas, south + north inset, trend arrow,
  Natural Earth). For G4 all four again (painted magazine cover, round in lists and
  cover in gallery/Avisa, open fonts → paths, stocks free shapes and crypto coins).
  Naming each rival's look in the option (age, hair, clothes, background) worked.
  For G5 Folke took three recommendations (showroom, watch case, the city's own
  building type) but *not* the bigger scope: "only the G5 list", so 17 old-style
  drawings stay (see §7). Make the smaller-scope option one you'd be happy with.
- **Check the data before you put places in a question.** For G5 I offered "Bergen:
  Bryggen, Trondheim: Bakklandet …" from memory. `sted` in `EIENDOMSTYPER` said
  otherwise: the Bergen ids are Møhlenpris, Nordnes and Fana, `hybel-oslo` is
  Blindern, `leilighet` is Grünerløkka, `kontorbygg-stavanger` is Forus (inland). I
  had to move and redraw half the batch, and Bryggen was dropped. Grep the data
  first and name the real places in the option. In G6 that paid off: there are 9
  paintings, not the 12 `Ideer.md` claimed, and Solheim spans 1911–1933 (romantic to
  expressionist); both went into the question. Folke took all four recommendations.
  For G7 Folke took three (detail page, bars + before→after, M draws itself) but
  again *not* the bigger scope: of the 17 old drawings only the 7 Norwegian ones were
  redrawn. Naming every place in the option (Kjøpesenter Trondheim, Aker Brygge,
  Ytterskjær …) and saying what the smaller option leaves (foreign scenes at 150 px
  in the old style) made the choice easy. Expect the smaller scope on art volume.
- **Ask only where there is a real choice.** G8 had four items; two were design
  (does anything of the goal strip stay; how does a card react to a press) and two were
  technical (lighter drawings, the unchecked views). Two questions, both
  recommendations taken. Nobody missed a question about how to slim down the defs.
- **Measure the share before you promise a number in `Ideer.md`.** I wrote that
  lighter drawings would remove "roughly half" of the page. It removed about half of
  the *hidden definitions*, but those were only 10–30 % of each page: Luksus went from
  5,200 to 3,700 drawing elements (−29 %), Bedrifter −23 %, Eiendom only −9 %. The
  drawings' own shapes are the bulk (a property drawing is about 190 elements). Say
  the real result in the report, and why the estimate was off.
- **Put outside sources in the question.** Fetching Natural Earth was an option in
  the G3 questions, so Folke's answer was the approval. Do the same for any download,
  font or dataset: name the source, the licence and that nothing loads at runtime.
- **After each pack, Folke asks what you learned.** Update this file before the pack
  commit, then re-read it once for anything missing. That's cheaper than a second round.
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
- **The oblique view has no perspective**: something further back is *not* smaller,
  just raised (`inn`). Show distance by raising it, by overlap (partly hidden behind the
  subject) and with `Dis`, as with the food truck, the second plane and the LNG tanker on
  the horizon. Don't shrink background objects; that breaks the scale rule.
- **Round things lying flat** (fish pens, pools, the helideck) are ellipses with
  ry ≈ 0.3 × rx, which matches `DYBDE`. Put a lighter top rail 1–2 units above the
  ring to give it height.
- **"Customers at 50" from afar is traffic**: a person at far distance is 4.4 units,
  invisible in a 44 px icon. Big businesses get boats, a taxi, a helicopter, a second
  plane, a baggage train or skiers instead, with a couple of tiny people as a bonus.
- **On the sea**: platform legs and anything standing in the water change to
  `S.sjo.skygge` below the waterline, with a pale ellipse where they meet the surface.
- **Helpers added in G2**: `Tre` (leafy or spruce), `Lampe`, `Vindusrad` (lit every
  n-th window), `Bakke` types `hav` (open sea with `HORISONT` = 56, faded at the
  sides and bottom) and `asfalt`, material `lov`. `Passasjerfly` (in Illustrasjoner)
  draws a plane side-on: propeller, jet or widebody.
- **The maps (G3)** are an atlas that follows the theme: all colours are `--kart-*`
  CSS vars in both theme blocks (sea, Norway in warm stone, neighbours flat grey,
  coast, border, relief, grid, sea/land label colours). Unlike the drawings, the maps
  follow the theme because they *are* UI. Coastlines, lakes and the mountain ranges
  come from Natural Earth via `scripts/lag-kartdata.mjs` → `src/ui/kartdata.ts`.
  Norway sits in the south view (`hovedpunkt`, 20 units per degree of longitude, 40
  per latitude) with a North Norway inset (`innfeltpunkt`, Lofoten). The world map is
  Mercator with one view per plane.
- **Markers (`Kartmerke.tsx`)**: a small dot (3.2 owned, 2.6 not, 2 land-only); the
  count in a pill badge on the side *opposite* the name (`merkeboks`,
  `merkeboksVerden`); gold dot, gold badge and a tiny crown only when you own the
  whole city. The price trend is a ▲/▼ `tspan` inside the name's text. Rent shows only
  on the selected city. The old coins and trend rings are gone.
- **Rival portraits (G4)** are one 80 × 100 drawing per rival in `Rivalportrett.tsx`,
  built from small helpers (`Oye`, `Nese`, `Munn`, `Ore`, `Hals`, `Toning`,
  `Hudtoning`) and split into `bakgrunn` + `figur`. `form="rund"` crops to the face
  (`utsnitt`: tighter at ≤ 32 px) inside a thin ring in `RIVALFARGE`; `form="omslag"`
  is the whole 4:5 cover with a thin frame (gallery, Avisa). `RIVALFARGE` is now the
  background colour of each portrait (palette `S`). The clothes sit in `<Kropp>`, which
  stretches up from the bottom edge, so the necks are short without moving the edge.
- **Company logos (G4)**: `Papirlogo.tsx`, a mark on a 24 grid in the company colour, no
  tile. Stocks have free shapes; crypto is a coin whose symbol is "embossed" (drawn
  once in a dark tone offset 0.8/0.9, then in a light tone). `ordmerke` adds the
  wordmark beside the mark (`LUFT` 5): used at the top of a stock's page and on Avisa's
  main story; lists show the mark alone. `bland()` mixes colours; `papirfarge(id)`
  gives the colour. Startups: `STARTUPMERKER` keyed by the idea's *name*, so a new
  idea in `STARTUP_IDEER` needs a mark (the test fails otherwise).
- **Things you own (G5)**: cars stand in `Utstilling` (showroom, reflection) built
  from `Bilhjul` (felg styles stal/eiker/aero/wire/racing/krom) and `Hjulbue`; watches
  sit in `Klokkeskrin` (case colour rises with price) with `Urkasse` (horn={false}
  for the pocket watch); houses use `Vindu`, `Kledning`, `Gavlhus` (gable to the
  front, draw left to right), `Langhus` (ridge along the front) and `Rekkerad`;
  `Sykkel` gives street-distance scale. `pkt` is now exported from Tegnestil.
- **The scale rule decides the distance for buildings**: at gate distance a storey is
  32 units, so two storeys is the most that fits. Blocks, bygårder, Bryggen-like rows,
  terraces and towers go fjern (8 per storey). Watches break the rule on purpose (a
  macro shot); vehicles without people beside them may be compressed in length, never
  height. This is now written in the header of `Illustrasjoner.tsx`.
- **The stadium (G6)** is its own 160 × 90 SVG in `Stadion.tsx`, seen as on TV. Only
  the pitch has perspective: `bane(u, v)` maps along/into the pitch onto a gentle
  trapezoid (near touchline y 82, far y 56), and players shrink with `v`. The crowd
  is `Publikum`: rows that get lower and narrower going up, blocks of a dark club
  colour with heads along the top, grey empty seats, a few scarves and white specks;
  `fylt` sets how full. `Endetribune` draws the stands behind the goals. Colours:
  palette `S` plus the club's colours from `drakt()`. Eliteserien has no masts (lights
  in the glass roof) — `grafikkG6.test.ts` checks that.
- **The paintings (G6)** live in `Malerier.tsx`: one `VERK` entry per painting with
  its canvas size, frame (`gull` Solheim, `tre` Aske, `svart` Lind, `hvit` Vik) and
  motif. Paintings use their own colours like real art, not palette `S`.
  `Maleribilde` fits a square box (`størrelse`) or a fixed height (`hoyde`, the wall);
  `maleriformat(id)` gives the framed size. The gallery wall (`Galleriveggen`,
  `.kunstvegg`) sits at the top of Kunst in `Kunst.tsx`; loaned paintings show as a
  dashed space with a "På museum" label. The engine's `farger` field is now unused
  by the UI (left alone: engine data).
- **Ground details go in `Kantfade`** (the windsock, the helipad's H, the red
  carpet): `utklipp` drops `Kantfade`, so they vanish in the hangar and harbour.
  `grafikkG5.test.ts` checks it. Wakes and rain are part of the drawing and stay.
- **The Norwegian landmarks and big buildings (G7)** are all at far distance.
  Things at sea (lighthouse, island, castle) stand on `Bakke type="hav"` on a rock or
  islet whose *front edge is irregular*: a straight front read as a concrete platform.
  The reflection under them is a trapezoid polygon at ~0.2 opacity; a `rect` read as a
  hard dark band. The lighthouse glow is two soft circles, not a beam. The ski hill
  fills the bottom of the canvas, so it sits in the new `Bunnfade` (Tegnestil: fades the
  bottom like the sea, and the sides like `Kantfade`); without it the snow ended in a hard
  white edge on the dark card. The twisted Oslo tower is floor slices whose front width
  is `s·cos v` and side width `s·sin v·0.7`, with `v` rising per floor: the lit face and
  the shaded face swap places going up, and the silhouette swells in the middle.
- **Detail pages for things you own (G7)**: `ui/detaljvisning.ts` is a tiny store
  (`aapneTing`, `useTing`, `aapenTing`), because the same cards live in the list, the
  city view, the street view, storage and the gallery wall. `FANE_FOR` says which
  screen shows the page (Eiendom or Luksus); each screen closes it on unmount, so a tab
  switch closes it. Every card (`Eiendomskort`, `Jordkort`, `Landemerkekort`,
  `Luksuskort`, `Malerikort`) takes `iDetalj`: in the list the picture is an
  `Apneknapp` and the whole card opens via `trykkApner` (ignores clicks on buttons,
  links and inputs); on the page the card shows `Scene` (or `Maleriscene`, the painting
  on the lit wall with a brass plate) instead of the picture. `useVoksUt` grows the page
  out of the tapped `.kort` by itself. The facts below come from `Tingdetalj.tsx`.
  Old-style drawings get `Scene`'s 150 px automatically.
- **The statement (G7)**: `OppgjorBlokk` puts a 6 px bar under each row from one zero
  line placed by the data (largest out ÷ (largest in + largest out)); in right, out left.
  Bar colours are CSS vars (`--oppgjor-inn/ut/for/etter`) so `.avis` sets darker inks
  on the cream paper. The row `Kurser, verdier og annet` = change in net worth − net
  cash flow, so the numbers add up; the net worth before/after bars share one scale and
  use `kortKroner` (full kroner squeezed the bars). Every value is written beside its
  bar, so the rows are the table view and need no hover layer.
- **The loading screen (G7)** lives in `index.html` (inline CSS). The M draws itself
  with `pathLength="1"`, and `stroke-dasharray`/`-dashoffset` set *only inside the
  keyframes* (with `both`), so with animation off the line is simply whole. The
  inline script also reads `milliardaer.bevegelse`, so the in-game reduced-motion
  setting holds from the first frame. The first view's fade is on `.app` with *no*
  fill mode: a filled opacity animation keeps a stacking context on the whole app.
- **Each drawing writes only the definitions it uses (G8).** `useUrl` in Tegnestil
  records every name it hands out in a set that `Lerret` creates per render, and
  `Definisjoner`, the *last* child of the canvas, writes out those (plus the gradient a
  mask needs, `TRENGER`). That works because React renders a component's whole subtree
  before its next sibling, and `url(#…)` may point forward in the document. A new shared
  effect goes into `definisjon()` with a name and is used through `useUrl`, never as a
  hand-written `<defs>`. `grafikkG8.test.ts` checks that every drawing defines exactly
  what it references. I did *not* move the constant ones into one global block: the
  sky reads `--himmel-*` where the gradient is defined (Avisa sets them on its own
  container), and a drawing rendered on its own (tests, a second root) would lose its
  shadows silently.
- **Cards that open a page (G8)**: business cards now open on a tap anywhere outside
  their buttons too (`vedKorttrykk` in `ui/detaljvisning.ts`, the same rule as
  `trykkApner`), and every `.kan-aapnes` card sinks to 98.5 % with a lighter
  background while pressed. The rule is `:active:not(:has(button:active, …))`, so
  pressing a buy button inside the card doesn't sink the card.
- **The goal strip (G8)** is `.maalfelt`, a sibling *after* the sticky `.toppfelt`, not
  inside it, so it scrolls with the page and slides under the header (z-index 10). In
  the wide layout it has its own grid row (`'meny maal'`). The fixed top on a phone is
  now 116 px instead of about 159 px.
- **The light theme needs its own backdrop where text floats over the page**: the buy
  moment's name sat on a 70 % black spot, fine for light text in the dark theme but
  dark-on-dark in the light one. The light theme now gets a white spot.
- **A sideways-scrolling row must show that it scrolls.** The street view's row had
  exactly three buildings in view and nothing peeking in, so it looked complete.
  `useRullekanter` (Gatebilde) sets `mer-venstre`/`mer-hoyre`, and CSS fades that edge
  with `mask-image`.

- **Logo colours are mid-tones**: luminance 0.126–0.30 gives ≥ 3:1 on the dark card
  (#181613), the light card (#ffffff) *and* the newspaper's cream (#ebe4d4).
  `grafikkG4.test.ts` checks all three. The cream was the strictest: five colours that
  passed both cards failed there and had to go a step darker.

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
- **Map units are about screen pixels**: the maps are ~320 px wide for ~300 units, so
  1 unit ≈ 1 px on a phone. Text below ~7 units is unreadable; the first count badge
  (5.4) had to grow to 6.8 in a 9-unit pill. Judge map sizes at phone width, not in an
  enlarged overlay.
- **Labels over both land and sea** get a halo: `paint-order: stroke` with a
  half-transparent stroke in the surface colour (`.kart-navn`). That's readable
  everywhere without a box behind the text.
- **Text widths can't be estimated well**: real label width varies 0.45–0.62 × font size per
  character (Inter), so an arrow positioned after an estimated width floated loose.
  Put trailing glyphs *in the same text* (`tspan`) and keep the estimate (0.6, generous)
  only for collision boxes. Measure with `getComputedTextLength()` if you must.
- **Relief without elevation data**: soft blobs read as dirt. A real outline (Natural
  Earth "Range/mtn" polygons), drawn twice with `feGaussianBlur` — light offset to the
  northwest, shadow to the southeast — and clipped to the land, reads as mountains.
- **Maps re-render every second** (they take the game state). Wrap the static base
  (coastlines, relief, inset) in `memo`, and build the path strings in `useMemo`.
- **A malformed path fails silently**: the browser draws up to the first bad command
  and only logs "Expected number" in the console. A long hand-written `C` chain got
  two extra numbers (Lunde's hair). `grafikkG4.test.ts` counts the numbers after
  every command in every portrait and logo path; reuse that check for new drawings.
- **Ids from `useId` must be cleaned, not escaped**: `CSS.escape` doesn't exist in
  the tests' Node environment, so `renderToStaticMarkup` crashed. Do as `Lerret`
  does: `'r' + useId().replace(/[^a-zA-Z0-9]/g, '')`, then `url(#…)` directly.
- **An industry symbol alone looks like a UI icon**: the first startup marks read as
  "download" (cloud with arrow), "home" (house) and "chat" (speech bubble). A brand
  mark needs a specific silhouette instead of the generic one: an A-frame cabin, not
  a house; a bird, not a bubble; a plane's tail with windows, not a fin that reads as a
  sail. Look at all of them on one contact sheet and redraw the ones that look generic.
- **Faces: check proportions at cover size first.** The first portraits had long necks
  and low shoulders, so the heads floated; the hair sat like a helmet until it got
  volume over the ears, an uneven hairline and a few light and dark strands.
- **Logo knockouts use `fillRule="evenodd"`**, not masks: the hole shows the card
  in any theme and needs no id.
- **Collision tests must cover the worst case**: `norgeskartet.test.ts` checks every
  name (with room for the arrow), the longest rent and a two-digit badge with crown for
  all cities at once. That caught Oslo's badge and rent reaching into the inset.

## 5. Reviewing art

- Build a contact sheet: clone `.galleri-stor svg` from the gallery into a fixed
  overlay, set width/height (270–540), and use background `#211e1a` (dark tile) or
  `#eceef2` (light tile). Keep the helper on `window` (`ark(idx, px)`) and re-create it
  after each reload.
- **Stale frames**: after any DOM or CSS change, resize the viewport by 1 px before the
  screenshot. The pane scales wide viewports down a lot; 560×600 gives the most detail
  per drawing. `zoom` with a region isn't supported.
- Check every new drawing at 240+ px, 60 px and 44 px, in both themes, and in each
  place it appears: list card, `.scene` detail view, Luksus storage, city view, gallery,
  the newspaper (`.avisbilde`), the buy moment (`Kjopsglimt`, 96/132 px) and the
  rival list (32 px).
- For logos and portraits, the `ark` helper should take a selector *or* an array of
  SVGs and keep each one's aspect ratio (`width / height`), since lockups and covers
  aren't square. Rival stories rarely come up in Avisa; mock a cream `div` with
  `figure.avisbilde.rival` holding cloned covers on the gallery page.
- After a test save jumps a day, Avisa opens by itself and covers the screen. Close
  it with the button `aria-label="Lukk avisa"` before looking for anything.
- A club and paintings for testing: `kjopKlubb(s, KLUBBNAVN[1])`, then set
  `s.klubb.divisjon` (0–4) to see each stadium; `kjopMaleri` and `museum(s, id)`
  give the gallery wall an owned and a loaned painting.
- Startups only appear after a few game days: build the test save, then
  `simuler(s, DAG_SEK * 7)`. The Selskaper sections are folded until you own
  something there; click their headings open.
- The gallery's stage row shows only stage n with n improvements (`trinnark(navn, px)`
  clones that row). An improvement at another stage (f3 at stage 0) is only checked
  by `grafikkG2.test.ts` unless you build that state in the game.
- **Test save for businesses**: set `b.nivaa` *before* `kjopForbedring`, because
  improvements have level requirements (online banking needs level 10, the offshore pen
  40). Keep `kontanter` huge and log every failed action.
- The game reopens on the last tab used. Click the tab before querying
  `.bedrift-ikon`, or the query returns 0. In a detail view, the way back is the button
  with the tab's name inside `main`.
- The newspaper only shows a drawing when a story is about one, and the issue you open
  may have none. Mock it with a `figure.avisbilde.tegning` holding a cloned SVG on the
  gallery page.
- Set the light theme with `document.documentElement.dataset.theme = 'light'`. CSS-var
  skies follow it at once; cloned SVGs do too.
- **White on a white card** (Vik's white frames) needs the light-theme hairline: give
  the SVG the class `illustrasjon` (as `Maleribilde` does) and the existing CSS adds
  the 0.6 px edge. `.stadion` has its own rule.
- **Gallery captions end in "Ny stil"** for new drawings, so match them with
  `startsWith`. Run the `ark` helper in a *separate* call after `location.reload()`:
  in the same call the page wasn't ready and every drawing came back "mangler".
- **A page-console script whose line starts with `(`** joins the line before it
  (no semicolon), e.g. `const sec = …` then `({ … })` became a call. End lines with `;`.
- **The loading screen**: editing `index.html` makes the pane open it as a static file
  in a new tab. That is the perfect test bed: no game replaces it. Pause every
  animation at a chosen time with
  `el.getAnimations({ subtree: true }).forEach(a => { a.pause(); a.currentTime = t })`
  and screenshot each stage. Close that tab afterwards.
- **A game where the goal strip shows** needs a modest save: the rich test save has
  passed every goal. Stash the rich one in `milliardaer.test.original` from
  `/ikon.svg`, build a fresh game there (`nyttSpill`, kr 3 mill, a few businesses,
  `simuler(s, 600)`), test, then restore it from `/ikon.svg` and remove the stash key.
- **`:active` can't be triggered from a script.** Synthetic clicks never show the
  pressed state; check that the rule loads (`document.styleSheets`) and that
  `CSS.supports('selector(:has(a))')`, and say in the report that the look itself was
  not seen.
- **A report in Avisa** only shows when the open issue carries one. Mock it by cloning
  the open `.regnskap .oppgjor` into the open `.avis` (`avis.prepend(clone)`).
- Console errors with an old `?t=` timestamp are leftovers from HMR between patches.
  Reload, wrap `console.error`, click all five tabs, and read the wrapped list.

## 6. Tools (what cost time in G1 and G2)

- **G2 workflow that paid off**: each drawing in its own snippet file, spliced in by
  `splice.mjs <id> <snippet>` (replaces `const <id>: B` up to the next drawing, switches
  the registry to `bedriftNy`, adds the id to `NY_STIL`). Small fixes go through
  `fiks.mjs <file> <p.json>`: a JSON list of `[from, to]` pairs that throws if `from` is
  missing. Writing JSON via a quoted heredoc (`<<'EOF'`) avoids Bash eating `${…}`.
  `flytt.mjs` moves a block (draw order). Rebuild these in the scratchpad if gone.
  `splice.mjs` carries the old drawing's doc comment away with it. A helper used by
  only one drawing (`Passasjerfly`) goes in the same snippet, above the drawing.
- After your own scripts have written a file, the Edit tool warns "modified on disk".
  That's expected; re-read the file before an edit that depends on nearby lines.
- `grafikkG2.test.ts` finds the plaque by its exact markup (`fill` mork.skygge, `stroke`
  gull.flate, `stroke-width="1"`). If `Plakett` changes, update the test with it.
- `tsc` reports only the first level of dead code: after the last old business went,
  only `Bedrift` and `bedrift` were flagged, but `Vekst`, `Kunder`, `Smabaat`,
  `Utmerkelse`, `PLAKETT` and the old `Person` went with them. Grep the names before
  deleting.
- **Outside data (G3)**: Folke approved Natural Earth (public domain). The raw GeoJSON
  is downloaded into the scratchpad (`ne/`) with curl from
  `raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/…`.
  Only the generated, simplified `kartdata.ts` goes in the repo. To regenerate:
  `node scripts/lag-kartdata.mjs <folder>`.
- **Simplify at the scale it's shown**: measure the view first. I assumed 7.3 units per
  degree for the world map, but the Europe view is 2.9, so the data was far finer than
  visible. Coordinates are stored as hundredths with deltas from the previous point.
  That took the file from 39 KB to 23 KB gzipped (the bundle is about 222 KB gzipped
  after G3).
- **Fonts as paths (G4)**: Folke approved Google Fonts (SIL Open Font License).
  `curl -s "https://fonts.googleapis.com/css2?family=Oswald:wght@600"` with curl's
  *default* user agent returns a `.ttf` url, a static instance at any weight (and
  width, e.g. `Archivo:wdth,wght@125,800`). An old IE user agent returns EOT instead:
  check that the file starts with `00 01 00 00`. The fonts live in the scratchpad
  (`fonter/`); `node scripts/lag-ordmerker.mjs <folder>` writes `src/ui/ordmerker.ts`.
  The script's own TrueType reader handles composite glyphs (Ø, Å) and GPOS kerning.
  Relative commands in tenths took the file from 89 KB to 48 KB (12 KB gzipped).
- **`Ideer.md`'s Art direction uses bold subheadings** (`**People**`, `**Stadium**`),
  not `##`. When the last item under one goes, the subheading must go too; the
  scratchpad `ferdig.mjs` from G4 removes empty bold subheadings as well as the pack
  line and items, and renumbers. Check the diff afterwards.
- **`splice.mjs` (G5)**: `//@@ bytt Navn` replaces `function Navn(` and the doc
  comment right above it, `//@@ før <line start>` inserts, `//@@ nystil ids` adds to
  `NY_STIL`. An empty `bytt` block deletes a function (old helpers like `Hjul`,
  `Klokke`, `Understell`). The first version's regex matched from the *first* `/**`
  in the file and silently kept old comments; find the last `\n/**` before the
  function and check only whitespace follows its `*/`.
- **`cat > fil` without a heredoc waits for stdin** and hung Bash for two minutes.
  Write temporary files with the Write tool.
- **A buy-everything test save crashed the game** in G5 (`avis.ts` had 8 titles for
  12 status levels). Fixed in ff11ff2 by the task I flagged; test saves may own
  everything again. The task pushed to `origin` while my commits were local, so the
  next push was rejected: `git pull --rebase` (only my unpushed commits move), rerun
  the tests, then push.
- **A spawned task's worktree (`.claude/worktrees/…`) doubles the test count**:
  vitest picks it up. Both copies pass, so it's harmless; just don't be surprised.
- **Long decimals in markup**: G7 rounded the shared helpers that leaked (`Tre`,
  `Slagskygge`, the `fortau` lines in `Bakke`) with `r2` (exported from Tegnestil), and
  `grafikkG7.test.ts` fails on 8+ decimals in the seven G7 drawings. Use `r2` for any
  sum in a coordinate (`y - 1.3`, `g - 52.2` gave `31.799999999999997`). The test's
  match shows only the tail (`1.79…`); find the full value with a throwaway test that
  logs the surrounding markup. `Figur`'s exact 0.21875 scale is fine (5 decimals).
- **`useSyncExternalStore` hooks need the third argument** (server snapshot) or a
  `renderToStaticMarkup` test of any card that uses them crashes. `useNy` in
  `ui/nymerker.ts` lacked it; G7 added `() => false`.
- **The gallery doesn't always re-render after a splice**: reload before the
  contact sheet, and select figures by caption, not index (the order isn't the
  registry order).
- **Douglas–Peucker on a closed ring**: first and last point are the same, so the
  line distance divides by zero. Use point distance for a degenerate segment. The
  first run returned zero points everywhere.
- **The Write tool refuses a file changed since it was last read**, such as a patch
  JSON reused across steps. The old patch then runs by mistake. Give each patch its own
  file name (`g3-fjell.json`).
- **Heredocs aren't reliable for backslashes either**: `\\d` in a regex came out as `\d`
  through Bash. Write scripts with regexes using the Write tool. That includes the
  JSON patch files for `fiks.mjs`: in G6 a heredoc JSON with `\.\d` in a test regex
  failed to parse. Anything with a backslash goes through Write or Edit.
- **An error screen during edits** ("Noe gikk galt", e.g. "reading 'x'") is usually HMR
  catching a half-applied multi-file change. Reload before you debug.
- **Gallery maps run at midnight**: `?galleri` builds new games (`sek` 0), so the maps
  show the night tint there. Judge map colours in the game by day.
- Draw in batches of three or four, then look at all stages on a contact sheet. Every
  batch found two or three layout bugs that tests can't see.
- Patch with `.mjs` files written by the Write tool, using a `filPatch(fil, [[fra, til]])`
  helper that throws when `fra` is missing and keeps CRLF. **`styles.css` is CRLF**; the
  `.tsx` files are LF. Long drawings go in separate `.txt` snippet files that a script
  splices in between two markers.
- **Never run Prettier on a file here.** There is no config, so it uses its defaults
  (double quotes, semicolons) and rewrote all of `Toppfelt.tsx` (G8). Restore with
  `git checkout -- <file>` and re-apply with a patch script; re-indent by hand. Some
  files (`Toppfelt.tsx`) have a BOM *and* CRLF; the patch scripts keep both.
- **Git Bash `sed -i` turns `styles.css` into LF** (G3, and again in G7 for a
  one-word change). Never `sed` that file; use `fiks.mjs` or Edit. If it happens, check
  `file src/styles.css` and restore CRLF with a node one-liner. The repo is safe: Git
  normalises line endings (`core.autocrlf`), so `git show --stat` showed only the real
  changes. The "LF will be replaced by CRLF" warnings on commit are normal. To check
  for churn, look at the line counts in `--stat`, not the warnings. Restore CRLF with
  a small node script if you want the working copy to match a fresh checkout.
- **Never put backticks into `node -e` through Bash** — not JSX template strings, and
  not Markdown with inline code either (in G7 Bash ran every inline-code name in this
  file's §7 as a command and left blanks). Bash ate them three times. Use the Edit tool or a `.mjs` file.
  `sed` lost the escaping in a regex too (`\(\.lerret\)`), so prefer Edit for test regexes.
- When a script asserts a count, count by hand first: I expected 13 keyframe px values
  and there were 10. The script threw halfway after the first part had already written.
- Chroma (RGB max − min) is the "muted" measure, not HSL saturation, which calls pale
  colours "saturated". Old toy colours were 0.54–0.60; the new palette stays ≤ 0.48
  except gold (0.50).

## 7. Notes for later (G1–G8 done; G9–G11 planned in `Ideer.md`)

- **Still old style, in no pack** (Folke chose this in G5 and again in G7): the ten
  foreign properties `stockholm`, `kobenhavn`, `berlin`, `london`, `dubai`,
  `newyork` and the four Marbella/Zermatt ones. `grafikkG7.test.ts` lists them exactly,
  so redrawing one means taking it off that list. `pakke42.test.ts` uses `stockholm`
  as its old-style example. Read each one's `sted` before drawing.
- Once every drawing is in `NY_STIL`, remove `F`, `Svg`, `Grunn`, the old hairline rule
  and the 48 branch of the test, and turn the "old style" note in the header into history.
- **New content from the game track** gets a drawing in the current style. A new
  Norwegian city needs a `BYPLAN` side (`norgeskartet.test.ts`, `grafikkG3.test.ts`), a
  new foreign city a `BYPLASS` side, a new startup idea a mark in `STARTUPMERKER`, a new
  owned thing a card with `iDetalj` and a case in `Tingdetalj.tsx`.
- **Shared tests describe the art**: when you redraw something, grep the tests for its
  markup and update the counting, not the intent (`pakke42.test.ts` counted the old
  dot crowd; `pakke43.test.ts` matches the wide-layout selector).
- **Not done, ask first** (shared files):
  - Avisa shows a generic icon for startup stories and art exhibitions
    (`ui/avisbilde.ts` has no startup or art kind); `StartupLogo` and `Maleribilde`
    could go there.
  - Small subjects stay small at small sizes because of the scale rule: the kiosk and
    lemonade stand in the 32 px rival list, the snekke and station wagon in the 64 px
    storage slots. A crop or zoom for those places is open.
  - The map data costs ~23 KB gzipped at startup; `Norgeskart`/`Verdenskart` could
    be lazy-loaded in Eiendom (a screen change).
