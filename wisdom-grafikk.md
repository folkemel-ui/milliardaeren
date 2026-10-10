# wisdom-grafikk.md — the graphics track's own notes

For the session in charge of graphics and animation (packs G1–G22, commits
`Grafikkpakke GN: …`). Read it after `Ideer.md` and `wisdom.md`; this file holds what
only matters when you draw. `wisdom.md` stays the source for how Folke works, the
engine rules and the general tool quirks. It was started after G1 (6 October 2026).
Update it at the end of each G pack, and delete what stops being true. Updated after G10,
the Saftbod and Pølsebod redraws (10 October 2026, outside any pack), G11 (11 October
2026), G12 and G13 (10 October 2026). G14–G22 are planned in `Ideer.md`: the full frame
in groups (G14–G15 businesses, G16 Scenes that grow, G17–G21 properties and luxury),
then the seasons (G22).

**Since Pack 63 (10 October 2026) the graphics track has its own folder:** start the session in
`Desktop\milliardaer-grafikk`, on branch `grafikk` (a git worktree of the same repo). Commit
there, deliver with `node scripts/lever.mjs` and, when Folke says push, `node scripts/lever.mjs
--push` — see *Working side by side* in `Ideer.md`. Your stylesheets are
`src/styles/tegninger.css`, `kart.css` and `oppgjor.css` (`styles.css` is gone); the dev
server config `milliardaer-grafikk` (port 5186) is *not* safe from the new folder: in G12 another chat's
server held 5186 and served the **old** folder (`New folder (3)`). Check which folder a server
serves by opening a file only your branch has (`/src/ui/vedBehov.ts`): a missing file comes
back as the game's `index.html`. `milliardaer-test2` (5182) started from this folder worked.

---

## 1. The job and its limits

- **What you own**: the drawings and how they render. That means `Illustrasjoner.tsx`,
  `Tegnestil.tsx`, `BedriftIkon.tsx`, portraits, crests, stadium, logos, the maps and
  their geometry and data (`Kartmerke.tsx`, `kartdata.ts`, `scripts/lag-kartdata.mjs`), the paintings (`Malerier.tsx`), the wordmarks (`ordmerker.ts`, `scripts/lag-ordmerker.mjs`), `Oppgjor.tsx`, the detail pages for things you own (`screens/Tingdetalj.tsx`, `ui/detaljvisning.ts`, G7), the logo files and `Galleri.tsx`. The full list is under
  *Working side by side* in `Ideer.md`. Your CSS is `src/styles/tegninger.css`, `kart.css`
  and `oppgjor.css`; the screens and `Ideer.md` are
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
  graphics session's server still held 5186. Before Pack 63 it served this same folder, so
  `navigate` to `http://localhost:5186/` worked; since the folders split it may serve the
  old one (see the top of this file), so check first and use 5182. A fresh port starts with an empty save, so build one
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
  For G9 Folke took all three recommendations: every foreign property drawn from its
  real place with the city's landmark in the haze, Marbella and Zermatt in their high
  season, and close-ups only in the two tiny places. Naming the landmark per city in
  the option (Stadshuset, Vor Frelsers Kirke, Fernsehturm, Big Ben, Empire State,
  Burj Al Arab, La Concha, Matterhorn) made it concrete.
  For G10 Folke took all three recommendations again: a real night (sky near black,
  the subject at about a third with a blue tint, warm windows with a halo), watches on
  the phone's real time, and night only on the big scene. Stating the game clock's
  rhythm in the question (a day is 5 minutes, so it's night about one visit in three)
  made the night option concrete.
  For G11 Folke took all three recommendations: an exhibition shows *your* dearest work
  by the artist, else the artist's dearest; every club story gets your crest (the title
  with a trophy); and only the six purchases the item named (homes wait for G12).
  Counting the real data first (4 artists, 9 paintings, 2–3 each) is what made the
  exhibition question answerable.
  For G12 (a technical pack) there were no design questions: the proposal was a numbered
  list of seven with the measured share of each part (React 110 kB, drawings 60, map data
  24, wordmarks 12 … gzipped) and a recommendation per item. Folke answered "Add 1-6", so
  the one marked *not recommended* (the wordmarks, since Avisa can open at start) stayed
  out. Measure the bundle per module *before* proposing, so every item carries a number.
  For G13 Folke took all three recommendations: a fixed 11:6 frame, the place continuing
  out to the sides (named per stage for each business), and a close-up out to the tile's
  corners. Measuring the scene box at three widths first (phone 314 × 172, tablet 417,
  desktop 937 — 1.8, 2.4 and 5.4 : 1) is what made the frame question answerable: no
  single drawing can fill 5.4 : 1, so the box had to take the drawing's shape.
- **"Too empty" means the place, not the subject.** Folke circled the Saftbod's vignette
  and said the scene was too empty. The fix that worked was more of the *place* at every
  stage (neighbours, the sea, café tables, a town in the haze), never a bigger stand: the
  scale rule still holds.
- **Count before you quote.** `Ideer.md` said 39 of 68 drawings never moved; the real
  count was 35 (plus the bank below 100 and the street kitchen's first stage). Worse,
  that count was made with every improvement bought: the lemonade stand, the kiosk and
  the ski centre only move *because of* an improvement, so at level 1 with nothing
  bought they stood still. Count at f = 0 as well as f = 3. `grafikkG10.test.ts` now
  checks every stage at both.
- **Ask only where there is a real choice.** G8 had four items; two were design
  (does anything of the goal strip stay; how does a card react to a press) and two were
  technical (lighter drawings, the unchecked views). Two questions, both
  recommendations taken. Nobody missed a question about how to slim down the defs.
- **Measure the share before you promise a number in `Ideer.md`.** I wrote that
  lighter drawings would remove "roughly half" of the page. It removed about half of
  the *hidden definitions*, but those were only 10–30 % of each page: Luksus went from
  5,200 to 3,700 drawing elements (−29 %), Bedrifter −23 %, Eiendom only −9 %. The
  drawings' own shapes are the bulk (a property drawing is about 190 elements). Say
  the real result in the report, and why the estimate was off. In G12 I promised about
  230 kB gzipped and got 238. The parts that moved out weigh 68 kB gzipped together —
  close to the estimate — but the start script shrank by only 62: gzip packs one big
  file better than several small ones that share words. Promise the start script's
  size with that margin (about a tenth of what moves), not the sum of the parts.
- **"Can you start on G12 even when the other session is working?"** is a question about
  collisions, and Folke wants it answered *and* acted on. Check what the other session is
  doing (`git -C "../New folder (3)" status`), name the overlap (Pack 65 was splitting
  `Investeringer.tsx` and changing `Eiendom.tsx`, both of which import drawings) and how
  you avoid it (keep component names and props, so no screen changes). Then start.
- **Put outside sources in the question.** Fetching Natural Earth was an option in
  the G3 questions, so Folke's answer was the approval. Do the same for any download,
  font or dataset: name the source, the licence and that nothing loads at runtime.
- **"If you were to improve X, what would you change?"** gets a numbered list, grouped
  (what it is, where it stands, people, improvements, small sizes and night), each point
  with what is wrong *now* and a concrete fix. Look at the drawing first, at every stage
  with f = 0 and f = 3, big and at 44 px. Folke then answers **"Add 1, 2, 3 … to
  saftbod, and show me"**: that means *build it now*, not add it to `Ideer.md`.
- **When a picked number doesn't match its note, ask.** Folke wrote "7 (option to sort
  by income)", but sorting was item 6. One `AskUserQuestion` with the three readings
  settled it at once ("only 6").
- **Folke draws on screenshots of the browser pane** (a red ring around the problem) and
  asks "can you find more?". Take that as a request for a full sense check, not just
  the one fix; see §5 *Does it make sense?*.
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

- **The ten foreign properties (G9)** are all at far distance and reuse two patterns:
  a waterfront (quay strips in `Kantfade` over `Bakke type="hav"`, as Aker Brygge) for
  Östermalm and Nyhavn, and a street (`fortau`/`asfalt`) for Mitte and Mayfair. New
  helpers: `Palme` (curved trunk, seven leaf shapes), `LaConcha` and `Matterhorn`
  (landmarks in haze, as components so two drawings can frame them differently) and
  `Snogran` (spruce with snow). **A landmark in the haze must stay a hint**: Burj Al
  Arab first rose to the top of the frame and took over the villa; at a third of the
  height it reads as Dubai without competing.
- **Close-ups (G9)**: `NAERBILDER` in Illustrasjoner holds a crop box [x, y, w, h] per
  id; `Illustrasjon naerbilde={[maxW, maxH]}` fits that box into the size and sets
  the canvas `viewBox` through the `Naerbilde` context. Business boxes are square
  (rival list, 32 px); vehicle boxes follow the subject (wide cars, tall sailboats) and
  get 86 × 74 in a 96 × 84 storage slot, which keeps a few pixels of air between slots.
  Cars came out about 1.6× bigger, the snekke about 2.5×. A new business or a new
  thing for the garage, harbour or hangar needs a box (`grafikkG9.test.ts` checks).
- **The old style is gone (G9)**: `F`, `Svg` and `Grunn` are deleted, every id is in
  `NY_STIL`, `Scene` is always 172 px and the gallery no longer badges "Ny stil". The
  light-theme hairline rule *stays*: the paintings (white frames) and the stadium still
  need it; only the drawings on the canvas (`.lerret`) are exempt.

- **The big scene is special (G10).** `IScenen` (Tegnestil, a context) is true only
  inside `Scene` (BedriftIkon). Everything that costs extra or changes with time lives
  behind it: the night layer, the watch hands, the light over the car paint and the
  window that switches on and off. Lists, cards, Avisa, the gallery and the buy moment
  never see it, so they stay at midday, at ten past ten, and as light as G8 made them.
- **How night works (G10).** The detail page (`Bedriftdetalj`, `Tingdetalj`) sets
  `style={nattstil(s.sek)}` (`--natt` 0–1 from `morke`, in `ui/dagognatt.ts`). Nothing
  re-renders: the CSS var does it all. In the scene, `Lerret` (only for `himmel="dag"`;
  indoor drawings stay lit) draws:
  1. the sky from the `hn` gradient: day colours `color-mix`ed toward `--himmel-natt-*`
     (dark theme defaults in `NATTHIMMEL`), and a few `Stjerner` whose opacity follows
     `--natt`;
  2. the subject inside the `natt` filter: every channel multiplied by a flood colour
     between white and `NATTFARGE` (`color-mix` with `--natt`);
  3. the subject **again**, in `.nattlag`: CSS paints every fill and stroke black except
     the window-light colours (`LYSFARGER` = `S.vinduLys`), `.nattvindu` and `.nattlys`;
     the layer has the `glod` blur filter and `mix-blend-mode: screen` at opacity
     `--natt`. Black adds nothing under screen, so only the lights shine, and something
     standing in front of a window is black in that layer too and hides the light.
  Classes for drawings: `nattvindu` (dark by day, lit at night; `Vindu` and `Vindusrad`
  pick about two in three with `tennesOmNatta`), `nattskjul` (hidden in the night layer,
  e.g. the glass sheen over a window), `nattlys` (a light in another colour, like the
  red `Blinklys`), `bare-natt` (only in the night layer). The scene box itself darkens
  with `--scene-natt` per theme; in the light theme it reads like a framed night photo.
- **Watches show real time (G10).** `Urkasse` reads `new Date()` only in the scene and
  draws each hand straight up inside a `Viser`: the inline style sets
  `transform: rotate(now)`, `transform-origin` at the dial centre (`transform-box:
  view-box`) and `animation-delay: -t`, and the animation turns from 0° to 360°. With
  reduced motion the animation never runs, so the inline rotation shows the time it was
  drawn — never 12 o'clock. The pocket watch's small seconds tick (`tikk`, `steps(60)`).
  All five have a seconds hand now (also in the lists, at 200°).
- **Light over the car paint (G10).** `Lakksveip` renders the car a third time inside a
  `<mask>` (CSS `.lakkmaske` makes every fill white, `.ikke-lakk` — the wheels — black)
  and moves a soft white band across it. The band is drawn left of the canvas, so with
  no animation it's simply not there. A car with its own wheels (the supercar) needs
  `className="ikke-lakk"` on them.
- **New motion classes (G10)**: `anim-dreie` (rotate, `--omlop` for speed), `anim-propell`
  (side-view propeller flips), `anim-rotor` (main rotor seen from the side), `anim-blink`
  (`Blinklys`), `anim-svai` (trees and palms, from the foot), `anim-vindu` (a window that
  lights for half of 18 s; `Vindu tennes` / `Vindusrad tennes={i}`), `anim-sveip`,
  `anim-viser`. **Decide the resting state**: with the in-game reduced motion the
  animation runs 0.01 ms once and the element falls back to its own style — the window
  stays lit, the beacon on, the band off-canvas.

- **The Saftbod (redrawn 10 October, outside any pack)** is the model for a small
  business that tells a story:
  - **Red saft** (`S.vin`) everywhere the product shows: dispensers, jug, stream, berries.
  - **The seller grows up**: a child (level 1), a teenager in a cap (25), the owner
    in an apron plus a helper (50, 100).
  - **The place grows**: a garden gate with a hedge, a picket fence and a house in the
    haze (1); outside a brick shop (25); a seaside boardwalk with a railing (50); a
    cobbled square with a street lamp (100). Two new `Bakke` types make that possible:
    `brostein` (rows of round-capped dashes) and `promenade` (sand strip plus boards).
  - **The product on the sign**: `Saftglass` (a red glass with a straw) and `Saftord`
    (SAFT as stroked paths, each letter on a 0–1 box, 0.66 × h wide with 0.28 × h
    between).
  - **People**: `Folk` (Tegnestil) is a `Person`-like figure for any distance
    (`avstand`) with `barn`, `caps`, `papirhatt`, `shorts`, `forkle` (a colour),
    `skjerf`, a right arm in `ARM` poses (`ned`, `frem`, `skjenk`, `opp`, `holde`,
    `grill`) and `ting` in the hand (`kopp`, `kort`, `polse`, `tang` — the tongs move
    with `anim-vend`). `Spiser` is the two-frame eater/drinker. `haand()` gives the hand
    in canvas units, so a jug, a stream or a pot is placed from the same numbers as the
    arm. Mirror a figure with `speil(x, …)` (Pølseboden) when it must reach left.
  - **Words on signs**: `Ord` + `ordbredde` (Illustrasjoner) draw any word from the
    `BOKSTAVER` table (S A F T E N P so far; add a glyph on a 0–1 box when needed).
- **The Pølsebod (redrawn 10 October, same approach)**: pølse i lompe at real size
  (1.9 units ≈ 19 cm at street distance), a pot with steam from level 1, a menu by the
  hatch; park (1), street corner with taxi and street lamp (25), football ground on
  match day with fans in scarves (50), ferry quay with the ferry in the haze and a gull
  (100). The owner hands out a hot dog (mirrored) to a customer paying at the hatch;
  guests stand *behind* the standing tables, drawn before them. The mustard improvement
  is a jar on the counter plus a chalkboard A-frame (`Krittavle`) with SENNEP. Its card
  uses the close-up too (`NAER_PAA_KORTET`). Found in its sense pass: a food truck
  above the ground (on the sea at stage 3), a street lamp and a sign on the same spot,
  guests hiding the tables, then a guest hidden by the stand's side wall.
- **Lamps are off by day.** A lantern or street lamp whose glass is `S.glass.skygge` with
  `className="nattvindu"` (plus a `nattskjul` sheen) is dark by day and glows at night
  through the night layer. A `Lampe` (always lit, with a glow circle) is only right for
  lights that really burn by day (the level-100 string of lights, by G2's "warm light"
  rule). Folke spotted nothing here, but a street lamp glowing at noon was one of the
  nine things that didn't make sense.
- **Card close-ups (`NAER_PAA_KORTET` in BedriftIkon)**: the Saftbod's card uses its
  `NAERBILDER` crop (now [12, 22, 64, 64], 1.5×) with class `naer`, and CSS
  `.bedrift-ikon.naer svg` masks it with a radial gradient. Without the mask the crop
  was a hard square tile among the soft vignettes of the other cards; the brick wall
  at level 25 made it a red block. Other businesses can join the set.

- **Buy moments for everything (G11).** `nytt()` in `ui/hendelsesstrom.ts` finds the
  purchase (a `Kjopsart` per kind: `jord`, `landemerke` — only when `eier` turns `'deg'`,
  so a rival's purchase is silent —, `maleri`, `klubb`, `startup` on the *first* stake
  only), and `Kjopsbilde` in `Kjopsglimt.tsx` picks the picture. App passes `art`/`id`/
  `navn` through untouched, so no game-track file changed. For the club and a startup the
  `id` is the *name* (the crest and the logo are keyed on it). App calls `merkNy(id)` for
  every purchase; the new kinds have no NY badge on their cards, so those keys just sit
  in the capped list (20) — harmless. `StartupLogo` takes `størrelse` now.
- **A painting needs a wall behind it.** On the dark buy-moment tile Maja Lind's black
  frame vanished (and Vik's white one would on the light tile). The tile behind a painting
  is the gallery wall in both themes (`.kjopsglimt-bilde.maleri`). Check every frame kind
  (gull, tre, svart, hvit) wherever a painting appears on a plain surface.
- **Avisa's pictures (G11)**: `avisbilde(sak, bakgrunn)` has new kinds `kamp` (both
  crests, home team left), `klubb` (crest, `pokal` for a title), `maleri` and `startup`
  (`konkurs` prints grey). They come from exact title patterns in `egenSak`, checked
  *before* the rivals' surnames: «Ola Lunde legger opp» used to print Ingrid Lunde's
  portrait. Only two pictures read today's state (`Avisbakgrunn`: the club you own, for a
  retiring player whose story doesn't name the club, and the paintings you own); the
  `Utgave` memo computes it once per issue. A new story kind in the engine with its own
  picture goes into `egenSak` with a test in `grafikkG11.test.ts`.
- **Mock Avisa in a test save** by replacing `s.avis.at(-1).saker` from `/ikon.svg` and
  setting `avisLest` below that day; reorder the stories and reload to see each kind as
  the main story (88 px) and in the column (44 px).

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
- **`feBlend multiply` is wrong for semi-transparent shapes (G10).** The first night
  filter flooded a dark colour, cut it to the subject (`in SourceAlpha`) and blended
  it. Where the subject was 70 % opaque (everything in `Dis`), the blend raised the
  alpha to ~87 % and darkened the colour only by half, so the hazy hills glowed grey
  against the night. `feComposite operator="arithmetic" k1="1"` with a full-opacity
  flood multiplies the channels and leaves alpha exactly as it was. The flood's
  colour can follow a CSS var (`flood-color` is a CSS property; `color-mix` works).
- **`Dis` adds a constant (G10).** Its colour matrix mixes toward `DISFARGE` with an
  offset, so black comes out light grey. In a layer meant to be black (the night
  layer), switch child filters off: `.nattlag [filter] { filter: none }`.
- **A CSS transform replaces the element's `transform` attribute.** The windswept trees
  at Lista sit in `<g transform="rotate(14 …)">`; putting `anim-svai` on that same `g`
  would have thrown the rotation away. Put the animation class on an inner `g`.
- **`.scene [class*='anim-']` sets `transform-box: fill-box; transform-origin: center`.**
  A rotor or a hand that must turn around a given point needs an inline
  `transformBox: 'view-box'` and `transformOrigin: 'Xpx Ypx'` (px = canvas units).
- **Keyframes with only `to` start from the element's own transform.** The hands carry
  an inline `rotate(now)`, so `tegning-dreie` needs an explicit `from { rotate(0) }` or
  they turn from "now" to 360° and jump.
- **A bent arm can't swing as one rigid piece.** Rotating the whole drinking arm around
  the shoulder pushed the elbow into the chest. Draw two poses instead (cup at the
  mouth, cup lowered) and cross-fade them with opacity keyframes (`anim-sipp`,
  `anim-sipp-ned`): a two-frame animation reads as movement at this size. The lowered
  pose carries `opacity="0"` as an attribute, so the resting state (lists, reduced
  motion) is the action itself: the customer drinking, the jug pouring.
- **Turning something held in a scaled figure**: put the moving part in its own wrapper
  `g` *outside* the figure's `translate … scale` group, with no transform attribute of its
  own, `transformBox: 'view-box'` and `transformOrigin` at the hand in canvas px. Inside
  it, the same `translate scale` plus the static tilt (`rotate(35)`). The keyframes undo
  the tilt (`rotate(-35deg)` = upright), so with no animation the jug pours. The stream
  is a separate rect with matching opacity keyframes, placed at the spout computed from
  the same angle.
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
- **Read crop boxes off a grid, don't measure them.** In G9 I tried to compute each
  subject's box from `getBoundingClientRect` of the drawing's parts. It failed: some
  drawings wrap everything in one masked group (bank, limousine, Formula 1 car came
  back empty), and the cars measured only their showroom floor. A 10-unit grid
  (`rutenett(names, px)`: lines every 10 units, red at 50) over each 132 px drawing,
  read by eye, was quick and right. Then check every crop on a contact sheet: the first
  round cut the bank's sign, the ship's bow and the snekke's bow.
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
- **Render real scenes into an overlay (G10).** Cloning gallery SVGs can't show the
  scene: night and the watch hands live only inside `Scene`. Import React, ReactDOM
  and `BedriftIkon.tsx` from the page by their real URLs
  (`performance.getEntriesByType('resource')`, e.g. `deps/react.js?v=…`; take
  `.default` of the module), then `createRoot` a grid of `<div class="detalj"
  style="--natt: 0|0.5|1"><Scene …/></div>`. Keep the helper's source in
  `sessionStorage` and `await eval(sessionStorage.sc)` after each reload, in a
  separate call. `getAnimations({ subtree: true })` + `pause()` + `currentTime` freezes
  every motion at a chosen moment for the screenshot. A `px` option smaller than 172
  overflows: `Scene` is always 172 px.
- **The game stops while the pane is hidden** (`document.visibilityState` is
  `hidden`), so the clock doesn't move then. To see dusk arrive in the real game,
  keep the pane visible (a `resize_window` shows it) and wait: a game hour is 12.5 s.
  Editing `sek` in the save while the game runs is overwritten on reload (as
  `wisdom.md` says) — and wasn't needed.
- **Does it make sense? Do this pass before you show anything.** The first Saftbod I
  showed had nine things that didn't make sense, and the tests caught none of them. Folke
  circled one (SAFT ran off its sign); a deliberate pass found eight more. Check each:
  - **Real size, from `METER`.** At near distance 18 units are a metre: the dispensers
    were 13 units (72 cm), the cups 4–4.6 (22–25 cm), the berries 2.2 (12 cm). Write the
    real size next to each prop before drawing it (dispenser 9.5 ≈ 50 cm, cup 2.6 ≈
    14 cm, berry basket 2.2 ≈ 12 cm).
  - **Text fits its surface.** Compute the word's width (4 letters × 0.66h + 3 × 0.28h)
    against the sign, don't eyeball it.
  - **Everything hangs on or stands on something**: a card on a table edge needs tape or
    string.
  - **Hidden props show up where you don't expect.** A crate hidden behind the table lifted
    the child, so their legs showed above the tabletop, as if standing on it.
  - **Paths lead somewhere**: a drive up to an open gate needs something behind the gate,
    not a hedge.
  - **Lights match the time of day** (see §3).
  - **Hands that act hold something** (a bank card to pay, a cup to drink).
- **Zoom into one drawing**: render it in the overlay, then set the root `svg`'s
  `viewBox` to the area (`'14 38 70 50'`) and its width/height to ~740 px; resize the pane
  by 1 px for a fresh frame. **A stale frame fooled me once**: the screenshot still
  showed the previous zoomed drawing, and I "saw" the stream 2 units off the spout. To
  check a position, measure: `getBoundingClientRect` of both parts, divided by the
  rendered width / 96, gives canvas units (58.0 vs 58.4: it was fine).
- **Freeze motion to check a pivot**: two `Scene`s side by side, each with
  `getAnimations({ subtree: true })` paused at a different `currentTime` (1.0 s: jug
  upright, cup lowered; 2.9 s: pouring, drinking). One look proves both poses and the
  pivot.
- **Leave the result in the pane for Folke**: a labelled contact sheet (stage × f = 0/3,
  plus the card pictures) in two columns of 340 px, at the pane's own size (preset
  desktop). Four columns overflowed the pane.
- **A contact sheet of buy moments (G11)**: import the real `varsler.ts` (its `?t=` URL
  from `performance.getEntriesByType('resource')`), call `visKjop({ art, id, navn })` for
  each kind, wait ~300 ms and clone `.kjopsglimt-bilde`, the heading and the name into a
  fixed grid. Clones restart their animations (the moment fades out and the sheen
  covers the picture), so add `#ark * { animation: none !important }` and hide
  `.kjopsglimt-skjaer`. End with `avsluttKjop(9999)`-style cleanup so no moment is left
  on screen. Three columns fit the pane at preset desktop.
- **"Push please" when the other track already pushed**: `git push` said "Everything
  up-to-date" because the game track's push carried G11 along. Fetch and show
  `git log origin/master` so the answer says where the commit is, not just that nothing
  happened.
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
  function and check only whitespace follows its `*/`. **`før` strands a doc comment**:
  inserting a helper before `function Dubai(` put it *between* the old Dubai's comment
  and its function, so the old one-liner was left above the helper (G9). Put a new
  helper inside the same `bytt` block as the first drawing that uses it instead.
- **`cat > fil` without a heredoc waits for stdin** and hung Bash for two minutes.
  Write temporary files with the Write tool. It happened again in G10 (a stray
  `cat > "$TMP/x";` in front of a `node -e`): the command went to the background
  and had to be stopped with `TaskStop`.
- **`Illustrasjoner.tsx` and `Tegnestil.tsx` are CRLF in the working copy** (HEAD
  stores LF; `core.autocrlf`). Multi-line `from` strings with `\n` don't match the raw
  file, so patch with the scratchpad `fiks.mjs` (normalises, patches, writes back with
  the file's own line endings and BOM) — rebuild it if it's gone.
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
- **Mixed hunks in a shared file (G11)**: the game track was mid-pack in `styles.css`,
  `varsler.ts` and `Ideer.md` at the same time. Stage only your part by building the
  index version yourself: `git show HEAD:<file>` into the scratchpad, apply your own
  `fiks.mjs` patch to that copy, then `git update-index --cacheinfo 100644,$(git
  hash-object -w <copy>),<file>`. Check with `git diff --cached <file>` that only your
  hunks are staged, and that their working-copy changes are untouched.
- **The index is shared too.** Both sessions stage into the same `.git/index`. In G11 the
  game track staged all of Pack 61 a minute before I staged G11, so a plain `git commit`
  by either of us would have taken the other's work, and my `update-index` overwrote
  their staged version of the three shared files. **Before staging, run `git diff
  --cached --name-only`: if it isn't empty, the other track is committing — wait** (a
  background loop that exits when `git rev-parse HEAD` changes), then stage and commit.
  I undid my staging by giving them back "working copy minus my patches" for the shared
  files. Reversing a patch whose `to` is empty doesn't work: `''` matches at position 0,
  so the removed line came back at the top of the file. Re-insert it before an anchor.
- **Heredocs aren't reliable for backslashes either**: `\\d` in a regex came out as `\d`
  through Bash. In G11 it went further: `node - <<'EOF'` with `\\d` in a template string
  wrote a bare `d` (`/(d+)–(d+)/`); tsc can't see that, only a test can. Write scripts with regexes using the Write tool. That includes the
  JSON patch files for `fiks.mjs`: in G6 a heredoc JSON with `\.\d` in a test regex
  failed to parse. Anything with a backslash goes through Write or Edit.
- **An error screen during edits** ("Noe gikk galt", e.g. "reading 'x'") is usually HMR
  catching a half-applied multi-file change. Reload before you debug.
- **Gallery maps run at midnight**: `?galleri` builds new games (`sek` 0), so the maps
  show the night tint there. Judge map colours in the game by day.
- Draw in batches of three or four, then look at all stages on a contact sheet. Every
  batch found two or three layout bugs that tests can't see.
- Patch with `.mjs` files written by the Write tool, using a `filPatch(fil, [[fra, til]])`
  helper that throws when `fra` is missing and keeps CRLF. **`styles.css` is CRLF**, and
  so are `Illustrasjoner.tsx` and `Tegnestil.tsx` in the working copy (G10); other
  `.tsx` files vary — check with `file`. Long drawings go in separate `.txt` snippet files that a script
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
- **A splice must start at the first helper.** `splice-saft.mjs` replaced from the
  drawing's doc comment to the next drawing, but the new helpers (`Saftord`, `Lykt`,
  `Saftfolk` …) sat *above* that comment, so the second run left a duplicate of every
  helper. `tsc` caught it ("Duplicate function implementation"). Start at the first
  helper's comment when it exists, and keep the whole block (helpers + drawing) in one
  snippet file that the script owns.
- **Patch the snippet, then re-splice**: small fixes went into the snippet with
  `fiks.mjs` (JSON `[from, to]` pairs, all checked before writing) and the snippet was
  spliced again, so the snippet stays the source of truth. The Edit tool on the snippet
  works too, after a Read (the scripts change it on disk).
- **The full test suite logs "Timeout calling onTaskUpdate"** under load while every
  test passes; `wisdom.md` §5 explains it. Report it as that, with the pass count.
- Chroma (RGB max − min) is the "muted" measure, not HSL saturation, which calls pale
  colours "saturated". Old toy colours were 0.54–0.60; the new palette stays ≤ 0.48
  except gold (0.50).

## 6b. Loading when needed (G12)

- **How it works**: `ui/vedBehov.ts` makes a *part* from a dynamic `import()`
  (`vedBehov(navn, hent)`), and `useDel(del)` reads it with `useSyncExternalStore`; the
  subscribe starts the fetch. No `React.lazy`/`Suspense`, on purpose: the components keep
  their names and props (`Illustrasjon`, `Norgeskart`, `Verdenskart`), the screens didn't
  change (so Pack 65's split of `Investeringer.tsx` can't conflict), and
  `renderToStaticMarkup` tests still render synchronously — they just `await lastAlle()`
  first. Until a part arrives, a same-size empty `Lerret` (`himmel="ingen"`) or the map's
  frame with only the sea holds the place. `forvarm()` in `main.tsx` fetches every part
  one by one on `requestIdleCallback` (timeout 2 s; Safari has none, so `setTimeout`),
  which also puts them in the service worker's cache for offline play.
- **What is where**: the business drawings stay in `Illustrasjoner.tsx` (the start tab shows
  them); properties in `ved-behov/Eiendomstegninger.tsx`, vehicles/watches/boats/planes in
  `ved-behov/Luksustegninger.tsx`, the real maps in `ved-behov/Norgeskart.tsx` and
  `Verdenskart.tsx`. The id lists `EIENDOMSIDER`/`LUKSUSIDER` in `Illustrasjoner.tsx`
  must match the registries; `grafikkG12.test.ts` checks it. A helper shared across
  parts lives in the start file and is exported (`Passasjerfly`: airline, property scenes,
  jets) — never import one part from another, or loading one drags in the other.
- **The service worker keeps only the newest `MAKS_RESSURSER` asset files** (`public/sw.js`),
  and caches a part only once it has been fetched. A release went from 3 files to about 9
  in G12, so the cap went from 20 to 40; `forvarm` fetches every part within seconds of
  start, so an open tab has usually fetched them all before a new release removes them —
  and if a fetch fails, the loader forgets it and tries again the next time it's shown.
- **Rollup names a shared chunk after one of its modules**: the map data, `verdenskartet.ts`
  and `Kartmerke.tsx` became `Kartmerke-….js` (26 kB gzipped). Harmless.
- **Measure per module** with a scratchpad Vite config whose plugin logs
  `renderedLength` per module in `generateBundle`. The scratchpad has no `node_modules`:
  import `@vitejs/plugin-react` by `file:///…/node_modules/@vitejs/plugin-react/dist/index.js`
  and drop `defineConfig`. Vite's "kB" is 1 000 bytes; `/1024` gave 232 for its 238.
- **`vite build` inside Vitest builds React's development version**: Vitest sets
  `NODE_ENV=test`, and `mode: 'production'` alone isn't enough (321 → 262 kB): the React
  plugin reads `process.env.NODE_ENV` too. Set it to `production` around the build and
  restore it (delete it if it was unset — assigning `undefined` stores the string).
  `startskript.test.ts` does this; it takes 7–10 s, so it is in `TUNGE` in `vite.config.ts`.
- **Checking the real split in the browser**: the dev server serves every module on its own,
  so it proves only that everything still draws (and `performance.getEntriesByType('resource')`
  shows the parts fetched as `/src/…/ved-behov/…`). For the real chunks, build into
  `public/g12bygg/` so the dev server serves it on the same origin as the test save, open
  `/g12bygg/index.html`, and read the `assets/` entries with their `startTime` (start
  script at ~50 ms, parts at ~1 s on idle; opening on Eiendom fetched its two parts at
  ~120 ms). Afterwards unregister the service worker (scope `/g12bygg/`), clear
  `caches`, and delete the folder.
- **`vi.resetModules()` during a pending `import()` hangs the next import.** After the
  rebase onto Pack 65, its second Eiendom click test timed out (20 s, and 60 s with a
  longer limit) while it passed alone in 4.7 s. Step logs showed the hang inside
  `startApp`: the first test ended right after unfolding the property list, the property
  part was still loading, and the next `startApp` reset the modules and imported `App`,
  which never resolved. `startApp` in `klikk.ts` now awaits `ventPaaHenting()` (from the
  previous test's `vedBehov` instance) before `vi.resetModules()`. A test that passes
  alone and hangs after another is this; log each step with `Date.now()` to find it.
- **`cd` in a Bash call moves the session's directory** for the next calls too; use
  absolute paths or `git -C`.

## 6c. The full frame (G13)

- **How it works**: `FULL_RAMME` (Illustrasjoner) lists the drawings switched over, and
  `Illustrasjon` sets the `Fullramme` context for them. In `Tegnestil`, a full-frame
  drawing has no vignette anywhere: the sky has no `vm` mask, `Bakke` runs edge to edge
  with no `bm`/`km`/`nm` mask (and reaches y 96 — `gress`, `sno` and `gulv` stopped
  2 units short, which showed as a pale strip), and `Kantfade`/`Bunnfade` are plain
  groups. Where the place says so (`Bredt`: only `Scene` and the gallery's big picture),
  the canvas is **176 × 96, x from −40 to 136**, with the old 96 square untouched in the
  middle — so a drawing only gains sides; nothing inside moves. The night filters and
  the stars follow the wide frame (`Lerretinfo` carries `x` and `b`). On square places
  (tile, buy moment, Avisa) the same drawing is the middle 96, edge to edge.
- **A full-frame drawing must reach the edges itself.** Everything that used to fade out
  (hedges, fences, railings, the sea, a stadium stand, a brick wall) ends hard at x 0
  and 96 in the wide frame. Extend every such shape to −40 and 136 — a list of x values
  needs its new entries at both ends — and then fill the 40 units on each side with
  more of the place. Look at all four stages with f = 0 and f = 3 on a contact sheet
  first; the hard ends are obvious there.
- **The scene box takes the drawing's shape**: `.scene.full` is `aspect-ratio: 11 / 6`,
  as wide as the card up to 560 px (314 × 171 on a phone, as tall as before).
- **The tile is a close-up out to the corners**: `BedriftIkon` gives a full-frame
  business class `fylt`, size 52 (68 `stor`) and its crop, with `overflow: hidden` in
  the tile's rounded corners. **A crop measured at stage 0 cuts the later stages**: the
  Saftbod's SAFT sign touched the top, the Gatekjøkken lost its roof and burger sign. A
  per-stage crop (`TRINNUTSNITT`) fixed it; check every stage's tile at 2.6× zoom.
- **A silhouette of a full-frame drawing was a black square** (`brightness(0)` on sky
  and ground too). Full-frame sky, ground and background now carry `lerret-himmel`,
  `lerret-bakke` and `lerret-bakgrunn`, and `.silhuett .bedrift-ikon.fylt` hides them.
  Matters from G15, when locked big businesses join.
- **The buy moment** gives a full-frame drawing the whole tile (174 px of 176).
- **New helpers in the start file** (they must live there; a helper in a lazy part
  can't be used by a business): `Byrekke` (a hazy row of town houses at far distance,
  windows lit at night; `start` shifts the pattern), `Bil` (the Pølsebod's taxi as a
  side-view car, `taxi` for the roof light), `Busskur`, `Kafebord` (near distance) and
  `Sykkel`, moved back from the property part and imported there.
- **The contact-sheet helper must import the newest module URL**: after an edit HMR
  loads `BedriftIkon.tsx?t=…`; take `.filter(…).at(-1)` of the resource list, or the
  sheet shows the old code. React DOM's client module needs `.default` (`createRoot`
  wasn't on the namespace).
- **A buy moment lasts 1.8 s**: call `visKjop`, pause its animations and take the
  screenshot in the *same* `browser_batch`; a separate call saw an empty screen.
- **`useContext` behind `&&` breaks the rules of hooks** and `tsc` doesn't say so
  (`full && useContext(Bredt)`). Read every context first, then combine.
- **`sed -i` turned `Illustrasjoner.tsx` into LF again** (a one-word import change).
  Use `fiks.mjs` for every edit to the drawing files, even one word; restore CRLF with
  a node one-liner if it happens. And `node -e` through Bash ate the backslashes of a
  test regex once more — test regexes go through the Edit tool.

## 7. Notes for later (G1–G13 done; G14–G22 planned in `Ideer.md`)

- **New content from the game track** gets a drawing in the current style. A new
  Norwegian city needs a `BYPLAN` side (`norgeskartet.test.ts`, `grafikkG3.test.ts`), a
  new foreign city a `BYPLASS` side, a new startup idea a mark in `STARTUPMERKER`, a new
  owned thing a card with `iDetalj` and a case in `Tingdetalj.tsx`, and a new business or
  vehicle a close-up box in `NAERBILDER`. Since G10 it also needs **something that
  moves in the scene at every stage, with no improvements bought**, and warm windows in
  `S.vinduLys` (or `nattvindu`) so it lights up at night (`grafikkG10.test.ts`). A new
  detail page must set `style={nattstil(s.sek)}`.
- **Next groups for the full frame (G14–G21)**: add the ids to `FULL_RAMME`, extend
  everything that ends at 0 and 96, fill the sides, and give the tile a per-stage crop
  where the subject grows. Properties and luxury live in the lazy parts, so their helpers
  for the sides go there (or in the start file if a business needs them too). Cars use
  `Speiling`, `Lakksveip` and the `rm` mask, which are still 96 wide: widen them with the
  cars (G20).
- **New property or luxury drawings go in the parts** (`ved-behov/`), with the id in
  `EIENDOMSIDER`/`LUKSUSIDER`. New business drawings and steps grow the start script,
  which is at 238 of 250 kB gzipped after G12 (`startskript.test.ts`): G16's upgrade steps
  may need a part of their own, and the home scenes should be one from the start.
- **G22 (seasons) builds on G10**: the clock reaches the scene through `--natt` on the
  page, and the night layer shows how to change a drawing in CSS without re-rendering
  it. Snow could follow the same pattern (a `--vinter` var and a snow layer), but the
  date changes only once a game day, so re-rendering with a prop is also cheap.
- **Shared tests describe the art**: when you redraw something, grep the tests for its
  markup and update the counting, not the intent (`pakke42.test.ts` counted the old
  dot crowd; `pakke43.test.ts` matches the wide-layout selector).
- **What the Saftbod taught that the other small businesses lack**: red-for-the-product,
  a readable sign, customers in a queue beside the counter (not on top of the product),
  a place that grows, and a light that keeps the scene alive at night. The Pølsebod,
  Gatekjøkken and Kiosk could get the same treatment. Offer it as a list; don't start
  unasked. Left in the Saftbod on purpose: the empty sign band over the shop window
  (25), the string of lights burning by day (100), and white cup stacks (Folke didn't
  pick "cups you can recognise").
- **Not done, ask first** (shared files):
  - The homes (Pack 60) are still bought in silence; give them a buy moment with their
    scene when G16 draws them.
  - The business cards' own 44 px pictures keep the full scene, except the Saftbod
    (`NAER_PAA_KORTET`, Folke picked it on 10 October); the kiosk is still small there.
