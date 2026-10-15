# wisdom-skjerm.md — screens, the browser pane and drawings

Split out of `wisdom.md` on 15 October 2026 (its old §4 and §6). Read it before screen or drawing
work; the graphics track's own notes are in `wisdom-grafikk.md`.

---

## 1. Dev server and browser pane

- Ports 5180–5182 are often held by other chats. `.claude/launch.json` has
  `milliardaer-test3` on **5184** with its own origin and save, and
  `milliardaer-grafikk` on **5186** for the graphics track (the two tracks run at the
  same time, so each has its own port and save). In Packs 55–60 another chat held 5184
  (`preview_start` refuses a server another chat started); `milliardaer-test2` on 5182
  was free, and still was in Packs 77–78 (5184 was again another chat's). Its storage was
  usually wiped between starts — expect to rebuild the save. Stop your server (`preview_stop`)
  before `lever.mjs`, and reset the viewport.
- **Test saves are not durable** (5184, 5182 …). On 1 October the pane's storage for that origin
  was wiped when the test server restarted (not by game code — nothing in `src` clears
  storage). Rebuild a rich test game when needed: open `/ikon.svg` (the game isn't
  running there), `import('/src/engine/start.ts')`, `handlinger.ts` and `simulering.ts`,
  build a state with `nyttSpill`, big `kontanter`/`hoyesteFormue`, `kjopBedrift`,
  `oppgraderFlere`, `kjopLuksus`, `kjopEiendom`, `kjopJord`, `kjopLandemerke`,
  `kjopKlubb`, `simuler(s, 900)`, then `localStorage.setItem('milliardaer.lagring', JSON.stringify(s))`
  and navigate to `/`. **Quickest late game**: on `/ikon.svg`,
  `(await import('/src/engine/__tester__/hjelp.ts')).fulltSpill()` gives a save that owns
  everything (13 businesses at level 121, all property, luxury, art, a club). `hjelp.ts`
  doesn't import Vitest, so it loads in the page. Then `simuler(s, 3000)`, set
  `kontanter`, save. A helper like `ok = (u, s) => u.ok ? u.tilstand : s` hides failed
  actions: upgrades failed quietly once, wages outran income and every chart went
  negative. Set `b.nivaa` directly, or log failures. Simulating 40 days takes < 1 s, so
  charts and stats can get weeks of history.
- **Hover readouts can be driven from the console**: dispatch
  `new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX, clientY })`
  on `.graf-flate`, wait ~300 ms, then read `.graf-boble` or take the screenshot.
- **Screenshots go stale** after SVG/CSS changes and scrolling. Resizing the viewport by
  1 px (375 ↔ 376) forces a fresh frame; for art, clone elements into a fixed overlay and
  screenshot that. `zoom` with a region works now (Pack 76), but it crops the screenshot, it does
  not magnify.
- **A card's drawing is a close-up** (`naerbilde`/`FLISUTSNITT`), so cloning the SVG from a card
  shows only part of it. To look at a whole drawing, open `?galleri` and clone the `<svg>` from the
  `<figure>` whose `<figcaption>` is the drawing's name, into a fixed overlay at 300–340 px.
- **Editing a source file while a pane script runs reloads the page** under it («the page
  navigated while this script was running»): Vite's full reload. Don't edit during a long script,
  and when it happens, check the page before running the script again.
- **A hidden browser pane pauses the game** (`document.hidden`), so «a live second» measures
  nothing while the pane is hidden and a catch-up runs when it shows again. Read numbers that
  depend on time passing with the pane visible.
- **Tabs slide in**: a screenshot right after switching tabs shows an empty screen. Wait
  about a second and take it again.
- **A hidden pane freezes CSS animations** (`document.visibilityState === 'hidden'`): the tab
  slide stays at its first frame, shifted 24 px, so every page looks 9 px too wide and
  overflow checks lie — even with reduced motion. Finish them first:
  `for (const a of document.getAnimations()) a.finish()`, then measure.
- **First page load after starting the server is slow**; the loading screen shows. Wait
  2–3 s before concluding anything. A welcome-back screen may appear — click «Fortsett».
- **HMR keeps old module instances.** After edits, the app loads modules as
  `…/varsler.ts?t=<timestamp>`; a plain `import('/src/ui/varsler.ts')` from the console
  then gives a *separate* copy and nothing shows. Find the real URL with
  `performance.getEntriesByType('resource')` and import that one, then call
  `visKjop`/`visFeiring`. Listeners registered in `App` also stay on the old module —
  reload before testing.
- **The 1-px resize doesn't always give a true frame**: in Pack 62 it produced a
  screenshot cut off on the right, and a theme switch via `data-theme` never showed in a
  screenshot at all. When that happens, check with DOM numbers (rects, `scrollWidth`,
  computed colours) and say in the report which checks were DOM-only.
- **«1 %» breaks over two lines at 375 px** if the space is a plain one (Pack 105, the store's text): write
  `1&nbsp;%` in JSX text. The helpers don't do it for you — `pst` in `forklaringer.ts` and the help texts
  use a plain space — so look at the end of each wrapped line in a screenshot of new text with a percent.
- **The right edge cut off in a screenshot is the pane, not the page, if the DOM says so** (Packs 106–107,
  twice, even after the 1-px resize): read the button's and the card's `getBoundingClientRect().right`
  against `clientWidth` and `scrollWidth`, and say in the report that the check was DOM-only.
- **In mobile emulation `innerWidth` grows** when content overflows. Measure against
  `document.documentElement.clientWidth`.
- **Safari wants the clipboard and the share sheet inside the tap** (Pack 95): an `await` before
  `navigator.clipboard.writeText` or `navigator.share` (a gzip of the save) uses up the user's gesture.
  Prepare the text when the panel or screen opens (`FlyttSpillet`, the crash report) and call the
  clipboard synchronously in the handler; `ClipboardItem` with a promise is the fallback Safari
  accepts. Desktop Chrome in the pane works either way, so it proves nothing about the iPhone.
- **A full storage is `QuotaExceededError`** (or code 22/1014); private mode and blocked storage
  throw other errors. Only the first should warn the player (`erFull` in `lager.ts`).
- **Testing the save store**: `state/__tester__/lager.test.ts`'s fake globals (a Map for
  localStorage, a fake document and window) plus a size limit in `setItem` make a full disk; note
  the stored form is much smaller than raw JSON (74 vs 138 kB for a fresh game), so write once
  before tightening the limit, and stub `removeEventListener` if the test stops the loop. A spy on
  `visVarsel` must be attached after `vi.resetModules()` and the store's import, or it watches a
  different copy of the module.
- **Never import `/src/state/lager.ts`** from the page — a second store claims ownership
  and pauses the game. Engine modules and `ui/varsler.ts` are safe.
- **Editing a running save: do it from `/ikon.svg`.** Navigate there (the game isn't
  running), edit `milliardaer.lagring`, set `milliardaer.sistAktiv` to `Date.now()`, then
  navigate to `/`. The old dummy-`eier` trick failed in Pack 58: removing the dummy
  handed ownership back, and the reload's `pagehide` saved the in-memory game over the edit.
- **To read crowded SVG (map labels, small art)**, clone the `<svg>` into a fixed overlay
  with a zoomed `viewBox` (`x y w h` around the area) at `100vw`. That beat both
  `resize_window` to 1280 px (scaled down to unreadable) and `zoom` on the narrow pane.
- **A browser tab that outlives its dev server** keeps logging `WebSocket connection …
  failed`. Those are old; reload and check that the count stops growing.
- Load-time catch-up grants achievements before the app starts watching, so they never
  reach the event stream. To test celebrations, call `visFeiring` directly.
- Check at phone width (`resize_window` preset mobile) and in both themes. Reset the
  viewport to desktop when done.
- **SVG elements have no `.click()`.** A selector that lands on an `<svg>` (or a child) throws
  `click is not a function`. Dispatch `new MouseEvent('click', { bubbles: true })` instead,
  and make a helper throw when the selector finds nothing: in Pack 61 a missed club-card
  selector let two `history.back()` calls walk out of the game to `/ikon.svg`. Likewise
  `[role=dialog]` also matches the map's city card (`.bykort`), not just pop-ups.

## 2. Proving a UI change

- **Scan every page a pack touches for overflow**, not just when a number looks odd:
  list the elements whose right edge passes `document.documentElement.clientWidth`. In
  Pack 62 it found an old bug (the achievements grid, `repeat(2, 1fr)` with long words, was
  1–2 px too wide). Two-column grids of text need `minmax(0, 1fr)`.
- **Prove a CSS refactor with computed styles** (Pack 63 split 6 622 lines into 13 files).
  On one fixed save with the game loop stopped (import the store module from the exact URL in
  `performance.getEntriesByType('resource')` and call `stoppSpillokke()`), notices and Avisa
  off, reduced motion, `sistAktiv` in the future: for every element on each screen, hash
  `getComputedStyle` (plus `::before`/`::after`), skipping properties set inline (the
  cascade can't touch them), with the size-dependent ones (width, margins, x/y, transform …)
  in a second hash. Key by DOM path, keep the «before» in IndexedDB (localStorage is too
  small), compare after. Both counts must be 0 — and a frozen save makes even geometry
  exact, so any geometry difference is real: it was the font, whose relative `url()` broke
  when the file moved. Await `document.fonts.ready`. 36 screens took ~5 min in chunks of
  ≤ 40 s per call (the tool gives up at 45 s); the gallery's 68 000 elements need 4 chunks.
- **Counting touch targets (Pack 74).** Run in the page at 375 × 812, per screen and part: every
  `button, [role=tab], a[href], input, select` that is visible; its target is its own rect, widened
  by an absolute `::after` if it has one (`getComputedStyle(el, '::after')`: `top`/`bottom`/`left`/`right`
  are the insets, so height = rect − top − bottom). Count the ones under 44 × 44 and group by
  class and size. Sweep **every** screen and part (12 here) **and every kind of detail page**:
  a first pass over six found three classes, the full sweep found a fourth (a text link in
  Innstillinger), and Pack 77 found the shared `.tilbake` at 36 px on all detail pages, which the
  Pack 74 sweep never opened. The same script with
  `fontSize < 12` on leaf nodes found the 11 px descriptions; group by class to see what they
  are before you decide what to enlarge. Layout can't be tested in happy-dom (no layout), so the
  tests guard the CSS rules and this script is the real check.
- **CSS-reading tests cannot share a file with a happy-dom click test.** `alleStiler()` builds a
  `file:` URL from `import.meta.url`, which happy-dom replaces with its own origin («The URL
  must be of scheme file»). Pack 74 split into `pakke74.test.ts` (node: CSS rules, pure
  functions) and `pakke74b.test.ts` (happy-dom, whole app, in `TUNGE`). For scroll in a click test,
  spy on `window.scrollTo` and define `scrollY` with `Object.defineProperty`.
- **A contrast sweep must parse every colour syntax.** Pack 97's light-theme sweep (every element
  with gold text on every tab and part, against the first opaque ancestor background) reported the
  tab bar at 3.96:1 — its background is `color(srgb 1 1 1 / 0.94)`, which a regex for `rgb()` read
  as black. Channels in `color(srgb …)` are 0–1. And test the exact ratio: `#8a6700` on `#eceef2` is
  4.496, which the list rounded to «4.50»; the test caught it and `#8a6600` (4.54) went in instead,
  flagged in the report.
- **Check computed styles, not just class names.** A new rule placed earlier in
  the stylesheet silently lost to an older rule with the same specificity (`.kjopskort`
  beat `.luksuskort`). `getComputedStyle(el).gridTemplateColumns` showed it. Animations:
  `getComputedStyle(el).animationName`.
- **Grep `src/styles/` for a class name before using it.** The stylesheets hold ~6 600 lines
  and short Norwegian names are often taken: `.statistikk` was already the three-column
  play-time card, and the new statistics card rendered squeezed into one column.
  It works the other way too: a bare class selector for a component (`.varsel`, the toast)
  also styled the badge modifier `.merke.varsel`, so «Børsen stengt» had toast padding and a
  shadow for weeks (found in Pack 66). Scope component rules to their container
  (`.varsler > .varsel`), and look at a new badge's computed height (20 px) once.
- **Measuring page heights (Pack 84)**: a `Seksjon` header carries `aria-expanded`, not the class
  `åpen` — clicking every `.seksjon-hode` without that check folds the open ones and halves the
  number. Measure before and after with the same script on the same frozen save (keep a copy in
  localStorage, e.g. `milliardaer.lagring.p84`, and restore it before each run), and `git stash` to get
  the «before» from the old code rather than trusting an earlier, differently-folded reading. The
  city chips (`.byvalg`) scroll sideways by design and always show up in an overflow scan.
- **Estimate a height with the 44 px rule in it** (Pack 91). I offered the Samling overview as
  «about 200 px»; with every silhouette a 44 × 44 target, seven fit a 315 px card row, the eight
  cars take two lines, and the card came out at 526 px (480 after showing only the unique things
  you own and dropping the 2 px column gap that wrapped the seven boats). Work it out before
  offering a number: rows × 44 + a label line per row + gaps, and say it in the question.
- **A one-row card at 375 px fits a picture, a name and a number, not a button too** (Pack 84): a
  175 px upgrade button left the name 63 px and «Gatekjøkken» ran under it. Two rows (picture over
  both, name and income on top, the button under) gave 113 px with no collisions; check collisions
  with rects (`h2.right > tall.left`), not by eye.
- **Seven 44 px buttons don't fit one phone row**: 7 × 44 + paddings and gaps ≈ 352 px against
  343. Adding «Milepæl» to the buy amounts sent the sort to a second row (Pack 75 had them on one);
  check the row count with rects when a segment grows, and say so if one row is impossible.
- **Plan a row of buttons with real text widths** (Pack 102): a canvas `measureText` with the
  button's computed font gave «Milepæl» 50 px and the rest ≤ 34 px at 600 13px Inter, so four 44 px
  amounts, «Milepæl» at 58 and a 60 px sort button fit 343 px — after Pack 99 had concluded seven
  equal 44 px buttons could not. `grid-auto-columns: minmax(44px, 1fr)` plus a `min-width` on the
  wide one does the rest.
- **«Same place on every card» means its own row** (Pack 102, the «Leder» badge): on the name line it
  dropped down for a long name, on the level line for a long level («Nivå 121 · 10 ansatte»). Only a
  row of its own is fixed; it costs 16 px per card that has a badge — say so in the report.
- **Two segments on one phone row (Pack 75).** A `.segment` is a grid with equal columns,
  so its width is (widest label + 2 × padding) × buttons: ×1/×10/×100/Maks at padding 10 was
  238 px and Kjøpt/Inntekt at 14 was 157 — 403 on a 343 px row, so they wrapped. Padding 4
  and 6 gave 190 + 125 and one row (`.bedrifter-kontroller`); the 44 px is height, the
  narrowest button is 42 wide as it was. Measure the two `getBoundingClientRect` widths
  before trusting a screenshot of the row: the pane's screenshot was stale twice.
- **A test that clicks buttons by text must not match the label they turn into** (Pack 93): after
  «Lagrer kornet» was tapped it read «Selger kornet», which `startsWith('Selg')` also matched, so
  the «Selg» click hit the switch again. Select by class (`.knapp-gull`) or the full text.
- **A click test must unfold a `Seksjon` first** when the save owns nothing in it — it starts
  folded, and its cards aren't rendered at all (Pack 65's property test saw 0 cards). Click
  its `.seksjon-hode` unless it already has the class `åpen`.
- **Click tests (Pack 52)** use happy-dom (a dev-only package — Folke allowed it for
  test tools only). `src/ui/__tester__/klikk.ts` starts the whole app on a prepared save
  (`vi.resetModules` per test, so the store starts fresh) and clicks like a player;
  `klikk.test.ts` covers buy, upgrade, hire, borrow, Avisa, sell and every tab. Put
  `// @vitest-environment happy-dom` at the top of such a file. Amounts contain hard
  spaces («kr 1 200»): match them with `\s`, not a plain space. Investments and Profile
  have no `h1`.
- **A hook called before an early return still subscribes.** The measuring panel called
  `useMaalinger()` and then `return null` when hidden, so it listened all the same, and once the
  store notified every second, every Innstillinger click test got a redraw outside `act` — the
  suite stayed green and only the log said «not wrapped in act». Put the hook in a child that is
  only rendered when shown. Grep the `lever.mjs` log for «not wrapped in act» after a change that
  adds a timer or a store; a passing run doesn't show it.

## 3. React performance

- **Measure React render cost in a production build, not in dev.** The Profiler in dev mode
  read 161 ms for Selskaper's per-second redraw; production reads 5–10× less. For real
  numbers: a temporary `vite.profilering.config.ts` that aliases `react-dom/client` to
  `react-dom/profiling` and builds into `public/profbygg/`, so the dev server serves it on
  the same origin as the test save; wrap `App` in a temporary `<Profiler>` that pushes
  `actualDuration` to `window.__prof`, separate the one big commit per second from the ~50
  small ones (rolling numbers), and delete both afterwards (and unregister its service
  worker). After Pack 64 every screen redraws in ≤ 4.5 ms a second on this PC.
- **An array or object written in a prop defeats `memo`.** `naerbilde={[32, 32]}` gave
  `Illustrasjon` new props every second, so every drawing in Selskaper and Samling was
  rebuilt each second (161 and 72 ms in dev). Hoist such values to a constant;
  `pakke64.test.ts` fails on the pattern for every memo drawing.
- **«Change in the order of Hooks called by Illustrasjon» is old** (seen in Pack 89 on Luksus and
  Eiendom, which the pack did not touch): `Illustrasjon` calls a drawing as a function, so while
  its part loads (`TOMT`, no hooks) and after (the real drawing, `useContext`) the hook count
  differs. Not a pack's bug; it was offered to Folke as a separate task on 11 October 2026.

## 4. Parts, the start script, the font and the service worker

- **Parts that load when needed (G12).** The property and luxury drawings, the two maps and
  the gallery are outside the start-up script (`ui/vedBehov.ts`, `komponenter/ved-behov/`).
  The components keep their names, so screens use them as before, but a test that renders
  a property or luxury drawing or a map must `await lastAlle()` first, or it sees the
  empty placeholder. `startskript.test.ts` (in the heavy group) fails if the start-up
  script passes 500 kB gzipped (250 until G17, when Folke doubled it; 249.9 then, 238 after G12): put a big new thing in a part instead.
  Pack 70 hit the old 250 the same evening (250.5 kB: Version 2.5's changelog entry plus
  the pack) and moved the changelog text to `ved-behov/Endringslogg.ts`, loaded by
  `Nyheter.tsx` through `vedBehov`/`useDel` — about 1.4 kB less in the start script.
  `startApp` in `klikk.ts` waits for parts still loading before `vi.resetModules()`;
  without that, a click test that ends mid-load made the *next* test hang (Pack 65's
  «Verden viser bare eiendom ute» timed out after G12 until this was added).
  Every release renames the parts, so a phone that kept the game open across a deploy
  asked for files that were gone; when a part fails, `vedBehov.ts` now reloads the page if
  `index.html` names a new start script. **Reports from Folke's phone come from the live
  site, often a tab opened before your last push**: first load the live site fresh in the
  browser pane — if it works there, suspect the stale tab, not the code.
- **The tabs are parts too (Pack 96).** Investeringer, Eiendom, Luksus (with Klubb and racing),
  Profil and Avisa load through `vedBehov` (`ui/skjermer.tsx`, `<Skjerm del={…} p={…} />` in
  `App.tsx`); only Bedrifter, the top bar, the menu and the pop-ups that open at start stay in the
  start script. The start script had grown ~5 kB a pack, 249.8 kB gzipped after Pack 74 to 290.7
  after Pack 95; the split took it to 230.7. So anything new that is only seen inside one of those
  tabs is outside the start script already; a new thing in Bedrifter, the top bar or a start pop-up
  is not. `startApp` in `klikk.ts` awaits `lastSkjermer()`, so click tests change tab and read
  the screen at once; a test that renders `App` some other way must do the same. Rollup put
  Luksus in the chunk named `Tingdetalj` (the two import each other), so `startskript.test.ts`
  checks *modules* (in no chunk but the start one), never chunk names. G12's test asserted the
  Norway map's shell was in the start script; it came with Eiendom and left with it.
- **The font is a subset (Pack 96).** `InterLatin.woff2` (92.7 kB, from the 352 kB
  `InterVariable.woff2`, which stays in the repo as the source) holds Latin-1 and the 44 signs in
  `ui/skrifttegn.ts`, every OpenType feature (tabular numbers) and the weight axis.
  `pakke96.test.ts` reads the woff2's `cmap` itself (brotli from `node:zlib`, ~60 lines) and scans
  `src` for every character above ASCII: a new sign (an arrow, a symbol) fails it — add it to
  `skrifttegn.ts` and run `node scripts/lag-skrift.mjs <folder>` after `npm install --prefix
  <folder> subset-font@2.4.0` into a scratch folder (not a project dependency; there is no Python
  for pyftsubset). The output is deterministic (same list, same bytes).
- **The service worker (Pack 96).** `src/sw.js` (no longer in `public/`) is written into the build
  by `serviceWorker()` in `vite.config.ts`: the list of every `assets/` file and a hash of it,
  so each release is a new `sw.js` that stores the whole release at install (all or nothing),
  keeps this release and the one before (`./__utgaver.json` in the cache remembers which), lets a
  navigation wait 3 s for the network, and never stores a request with a query string.
  `pakke96.test.ts` runs `sw.js` against a fake `caches`/`fetch` with fake timers.
  **Test offline for real in the browser pane**: `npx vite build` into `dist`, `preview_start`
  `milliardaer-bygg` (vite preview on 5183), unregister the worker and delete the caches from the
  page, navigate once, wait ~3 s, then `preview_stop` and navigate again — the server is gone, so
  only the worker can answer. That found the bug the fake did not have: the stored files carry
  `Vary: Origin` (vite preview sends it; GitHub Pages may too), a module script and a preloaded
  font ask *with* an Origin and the install's `addAll` without, so `caches.match` found nothing
  and the coin breathed forever. Lookups use `{ ignoreVary: true }` now, and the fake cache honours
  Vary so the test fails without it. To see the «Kunne ikke starte» line, delete the start script
  from the cache while offline and reload; it comes after 10 s.
- **The native save mirror (Pack 97).** `state/speil.ts` writes every save to a file when
  `window.Capacitor.isNativePlatform()` and its Filesystem plugin exist (no dependency here), and
  `lager.ts` brings a save back from the file when the game started empty. Writes are blocked from
  the moment the read starts (before `startSpillokke`'s first `lagre()`), so a new empty game never
  overwrites the file. In tests, stub `window`/`document` with `removeEventListener` too
  (`stoppSpillokke` calls it), and `vi.advanceTimersByTimeAsync(0)` lets the file's promises settle.

## 5. Drawings and the full frame

- **Drawings — the art direction (G1).** The rules are in the header of
  `Illustrasjoner.tsx`, the tools in `Tegnestil.tsx`, and `?galleri` opens with a style
  sheet (palette, grounds, the three distances). New drawings use a 96×96 `Lerret`, only
  palette `S` (three tones per material: `lys`/`flate`/`skygge`, light from top left),
  `Kloss`/`Saltak` for oblique depth (`DYBDE`, the side faces right), a `Slagskygge`,
  a `Bakke` fitted to the subject on `GRUNNLINJE` (84), and one of three distances
  (`METER`: nær 18, gate 10, fjern 2,5 units per metre; `Figur`/`Person` and `maal`
  keep people, doors and floors the same size). `NY_STIL` lists the ids drawn so far;
  the rest still use the old 48×48 style (`F`, `Grunn`, y = 43) until their G pack —
  Folke chose to leave them alone rather than recolour them. `grafikkG1.test.ts` checks
  the palette (every tone ordered by luminance, chroma ≤ 0.48 except gold), viewBox, loose
  colours and unique gradient ids. Businesses are still `B = (trinn, f)`: stage 0–3 at
  level 1/25/50/100, `f` improvements with their own detail; level 100 gets `Plakett`.
- **The canvas has details that bite.** Gradients, masks and the haze filter get ids from
  `useId` (two identical drawings on a page must not share ids). The sky is backdrop, not
  subject, so it follows the theme via `--himmel-*` CSS vars; the subject's colours are
  fixed. The light-theme hairline applies only to `.illustrasjon:not(.lerret)`. A place
  with its own scene (garage, harbour, hangar in Luksus) passes `utklipp` to
  `Illustrasjon`, which drops sky, ground, background and reflection via context. Moving
  parts get an `anim-*` class and move only inside `.scene`; the keyframes multiply their
  px by `--utslag` (2 on `.lerret`), so the same classes work on both canvases. `Scene`
  shows new-style drawings at 172 px (they carry their own margin of sky).
- **Reviewing art**: clone the gallery's big SVGs into a fixed overlay at 270–540 px and
  screenshot that; resize the viewport by 1 px if the frame is stale. Check each drawing at
  44 and 60 px in both themes too — the scale rule makes small subjects (the kiosk) small.
- **Light theme** (Pack 42): every drawing SVG has class `illustrasjon`, and the light theme gives
  it (and `.stadion`) a 0.6 px drop-shadow hairline so white and cream shapes stay visible on
  white. A new drawing component outside `Illustrasjoner.tsx` needs the same class or selector.
  Medal symbols use `--ring-mork` in the light theme. `?galleri`'s light swatch is pure white,
  like light cards. Check contrast with a script (text colour against the first opaque
  background up the tree) on every tab and sub-page in both themes, rather than by eye.
- **Pictures**: `BedriftIkon` (`stor` for cards where the picture matters) and `Scene`
  (large drawing at the top of a detail view). Club crests: `Klubbvaapen.tsx`, colours and
  pattern from a hash of the name; text goes as HTML over the SVG, never `<text>`.
- **The logo exists in four places** that must match: `Logo.tsx`, `public/ikon.svg`,
  the loading screen in `index.html`, and `scripts/lag-ikoner.mjs`.
- **The full frame (G13).** Drawings in `FULL_RAMME` (the four street businesses so far)
  have no vignette and are 176 × 96 in the detail scene (x −40 to 136). A new business,
  property or vehicle drawn by the game track can stay out of the list (it then looks as
  before); if it goes in, it must reach the frame's edges itself — see `wisdom-grafikk.md`
  §6c.
- **Scenes that grow and the homes (G16).** A business scene shows one extra thing for every
  five levels inside a growth stage (`stegFor` in `Illustrasjoner.tsx`, up to level 150):
  an overlay from `ved-behov/Trinnsteg.tsx`, drawn only in the detail scene. The three homes
  have their own scene (`ved-behov/Hjemtegninger.tsx`, shell in `Hjemscene.tsx`), a card that
  opens a detail page (`Tingslag` `hjem`) and a buy moment per furnished room (`art: 'hjem'` in
  `nytt()`). Both are parts, so the start script is 248.7 of 250 kB. A new room or a fourth
  step in `engine/hjemmene.ts` needs its state drawn in `Hjemtegninger.tsx`; a new business
  needs a `Steg` in `Trinnsteg.tsx` (`grafikkG16.test.ts` fails otherwise). Details in
  `wisdom-grafikk.md` §6d.
- **A full frame for the homes (G17).** The eleven Norwegian homes (hybler, flats, terraces, cabins,
  the rorbu) are in `FULL_RAMME`, wide in the scene and a square crop on the card
  (`FLISUTSNITT` in `Illustrasjoner.tsx`; a business uses `NAERBILDER`/`TRINNUTSNITT`). A drawing
  in `FULL_RAMME` must reach x −40 and 136 itself, and a test that renders one must `await
  lastAlle()`. **The start script was 249.9 kB gzipped after G17** (249.78 after Pack 74), against a budget of
  250 that Folke doubled to 500 for the sake of growth (`BUDSJETT_GZIP` in `startskript.test.ts`,
  with the reason written there). The game can grow, but a phone still reads the whole script
  before the first screen, so new screens' code that is not on the first screen still belongs in a
  part (`ui/vedBehov.ts`). Details in `wisdom-grafikk.md` §6f.
- **A full frame for buildings, land and landmarks (G18).** The office buildings, the shopping centre,
  Aker Brygge, the island, both farms, both forests, the four landmarks and Pack 76's shopping-centre
  chain are in `FULL_RAMME` too, each with a tile crop in `FLISUTSNITT`. A game pack that changes what
  the farms or forests show (fields, machines, buildings) changes a wide drawing: anything it adds must
  stay inside x −40…136 and leave the centre square readable on its own. Details in
  `wisdom-grafikk.md` §6g. **Since G19 every property is in `FULL_RAMME`** (the foreign ones and Pack
  76's towers too; `grafikkG19.test.ts` fails if one is missing), so a new property drawing from the
  game track must be drawn wide from the start, with a tile crop in `FLISUTSNITT` (§6h).
- **A close-up box is the drawing's size in pixels, not a scale** (`naerbilde` in `Illustrasjon`).
  Doubling it with the tile (86 × 74 → 172 × 148) overran the 153 px tile at 375 px; measure the
  tile first and keep the old ratio (~0.9 of the width): 138 × 119. Check with rects (svg vs.
  `.plass-bilde`), not by eye.

## 6. UI conventions

- **No emoji anywhere** (`ikoner.test.ts`). Use `<Ikon navn="…" />` from `Ikoner.tsx`.
- **Type scale**: six sizes `--skrift-1…6` (11/13/15/18/22/34 px) and four weights
  `--vekt-normal/halvfet/fet/tung`. `pakke36.test.ts` fails on any other `font-size` or
  `font-weight` in the stylesheets, except graphics listed in its `GRAFIKK` array.
- **Badges**: `.merke` (status word; `gull` new/best, `kant` a role, `ok`, `varsel`,
  `fare`, `info`), `.etikett` (category, grey capitals), `.brikke` (a number). Don't
  invent new pill styles.
- **Text**: amounts are `kr X` via `engine/tall.ts`; short forms go mill → mrd → bill
  (`kr 2,00 bill` from 999,5 mrd, Pack 47); feminine nouns in a-form (Avisa, uka,
  gata, lista); plural «ordrer»; no «papir» in player text.
- **Explanations** live in `ui/forklaringer.ts` and take numbers from engine constants.
  When a rule changes (tax on gains, loan cap, wages, dilution), update the text there.
- **Celebrations are calm and gold**: small milestones get a shine between thin gold
  lines and no confetti, the million a little thin gold confetti, and only 1 mrd the full
  show. Buy and merge moments use `Kjopsglimt`.
- **Sort lists by values that change only when the player acts** (Pack 65). Sorting the
  businesses by today's income would reorder cards as the weather and the market move, under
  the player's finger. `ui/sortering.ts` uses steady income instead: no calendar, no news,
  and branches without the regional index (`fastFilialfaktor`). Status is left out because
  it scales everyone alike. Ties keep buy order (`Array.sort` is stable).
- **Settings** live in one card (`Innstillingskort` in Profil.tsx), each a `Valg` row. Browser
  settings (theme, newspaper, notifications, motion) go in localStorage, never the save.
  `ui/innstillinger.ts`: `vises(funn)` decides which toasts show (Alle / Viktige / Av); motion
  uses `data-bevegelse="redusert"` (a CSS rule stops every animation) and `redusertBevegelse()`
  in JS. New animations get both for free; new JS motion must call `redusertBevegelse()`.
- **Wide layout** (Pack 43, ≥ 1024 px): `.app` becomes a grid with the tab bar as a sticky
  sidebar (`--sidemeny` 224 px), and `.innhold .kortliste` turns into two columns. Lists inside
  pop-ups must be excluded in that selector (`.gate-kort`, `.lager-valgt`). The screenshot
  pane scales wide viewports down; check layouts with DOM numbers (grid columns, scrollWidth).
- **Screens**: Profil is split into four parts — Meg, Regnskap, Statistikk, Innstillinger —
  via `ui/deler.ts` (remembered, settable from outside — the tax badge opens
  Regnskap; the tab row uses `.segment-fem` so four fit at phone width;
  `pakke37.test.ts` lists the parts). Property has a city view
  (`Byvisning.tsx`, city buttons under the map). The top bar shows progress
  (`formuetrinn`, status title, gold edge by status level).
- **Charts**: load the `dataviz` skill before any chart work. Axis maths lives in pure
  `ui/grafakser.ts` (`verdimerker` = round gridline values, at least three; `tidsmerker` =
  clock times for ≤ 1 day, dates, or month + year for multi-year spans) and is tested in
  `ui/__tester__/pakke39.test.ts`. `Linjegraf` shows gridlines, axis dates and start/now
  labels; the y labels share one grid cell so the column fits the widest. Bar charts are
  HTML divs, not SVG: `preserveAspectRatio="none"` would distort rounded corners. Series
  colours are `--kilde-1…7` (the dataviz reference palette, validated with its script on
  `--flate` in both themes); in the light theme three are below 3:1, so a chart with
  them always has a table with the values written out. Keep x labels from colliding by
  capping their count per period (`maksNavn`), and check with bounding rects at 375 px.
- **Back (Pack 61)**: `ui/tilbake.ts` keeps a stack of open layers mirrored in the
  browser history; each entry carries only its depth (`{ milliardaer: n }`), so
  `popstate` closes layers until the stack is that deep, and a layer closed by a button
  removes its step with one batched `history.go(-n)`. **A new detail page or view
  must call `useTilbake(open, close)`** before any early return; a pop-up that uses
  `useFokusfelle` gets it for free. A tab other than Bedrifter is one layer, however
  many tabs you visit. happy-dom supports `pushState`/`go`/`popstate`, so click tests
  can press back with `history.back()` (`pakke61.test.ts`). In the browser pane,
  one back too many leaves the game for the page you came from (`/ikon.svg`) — that's
  correct, not a bug.
- **Where new areas go (Pack 66)**: five tabs, never six; at most four parts in a tab; a new
  area becomes a part in the tab whose question it answers; when it outgrows its part it
  gets a detail page (a layer with back), never a fifth part. The rule is in the header of
  `ui/deler.ts`, and `ui/__tester__/pakke66.test.ts` checks the counts. The club stays in
  Luksus → Klubb.
- **Parts (Pack 61)**: every set of parts is a `lagDelvalg(key, parts)` in `ui/deler.ts`
  (remembered in localStorage, first part by default, settable from outside). A new set
  of parts goes there too, not in a `useState`.
  Luksus (Pack 62) is Samling · Hjem · Kunst · Klubb with the status card above the
  parts. **A part must not open on a folded `Seksjon`** (a new player sees only a header):
  use `Delhode` from `Seksjon.tsx` for a part's own heading. The club lives in its part
  (`Klubbdel`), so notices about it use `mål: 'klubb'`.
- **Event log (Pack 61)**: `Hendelseslogg.tsx` behind the bell in the date line; what's
  been seen is a `sek` in localStorage (`ui/hendelsessett.ts`). A notice can point at it
  with `mål: 'hendelser'` (`Mål` in `ui/varsler.ts`).
- **Payback on a buy (Pack 99)**: `ui/inntjening.ts` — what the buy adds to today's income
  (`bedriftInntektIDag` on a copy with the change: `{ ...b, nivaa: b.nivaa + n }`) against the
  price, worded «Tilbake på T» like the hires since Pack 80. A new buy button in a business gets
  the same line, not its own wording.
- **Jumping to a thing on another tab (Pack 99, merger row → a rival in Selskaper)**: a one-shot
  module value (`ui/rivalvalg.ts`, read once with `ta()` in a `useState` initialiser), the folded
  section opened first (`apneSeksjon(id)` from `Seksjon.tsx`), the part set (`investeringsdel.sett`),
  then the tab (`velg` in `App`). Scroll with `rullTil`, not `scrollIntoView`: the top bar
  (`.toppfelt`) is sticky and 121 px tall at 375 × 812, so `block: 'start'` hid the target under it.
  Aim at the row you act on (the kiosk among the rival's businesses), not the card's top.
- **Fits the phone (Pack 74).** Four rules now hold on every screen. (1) A phone on its side
  (`orientation: landscape`, `max-height: 500px`, `max-width: 1023px`, last in `bred.css`) gets the
  sidebar layout: one top line (53 px), a 92 px column of tabs, two columns of cards;
  `--meny-høyde` is 0 there, which also moves the padding and the toasts. (2) `ui/rullehusk.ts`
  remembers the scroll position per tab for the visit; `delnokkel(fane)` in `deler.ts` says which
  part the tab shows (and, for Eiendom, which city chip is on, read from the DOM because it is a
  `useState`), and a different part starts at the top; an open detail page stores 0. Tapping the tab you
  are in scrolls to the top. (3) Every control has a 44 × 44 px target: real `min-height: 44px` on
  `.knapp*`, `.segment button`, `.mengdevalg`, `.seksjon-hode`, `.forbedring-knapp`,
  `.formuerad-knapp`; an invisible `::after` (`inset: -13px` on the 18 px «?», and so on) on the small
  ones. An `::after` is clipped by an `overflow` ancestor — `.byvalg` (the city chips, `overflow-x:
  auto`) got padding for it — and it must not overlap a neighbour (the ×1/×10/×100 row has real
  height). (4) Text you read is 13 px (`--skrift-2`): achievement descriptions and the slot names, which
  wrap to two lines; badges and captions stay 11. Measured before → after at 375 px: controls under
  44 px per screen 17/32/28 (Bedrifter/Eiendom/Bank) → 0, on all twelve screens and parts. `pakke74.test.ts` and `pakke74b.test.ts`
  (heavy group) guard it; a new button should use `.knapp`/`.segment` or get an `::after`.
- **«Markedet i dag» counts what is special, and that is almost every day** (Pack 75): a hot
  or cold trade most weeks and a cycle that is rarely «normal» give a count on ~100 of 120
  days, so the badge is a number, not a rare alarm. `ui/markedet.ts` is the pure list; the
  sheet (`Markedsark` in `Dagen.tsx`) reuses the `avis-bakgrunn`/`velkomst` dialog with
  `useFokusfelle`, like «Nytt i».
- **A sort key must come from the catalogue** (Pack 75, as Pack 65): the property list sorts on
  `EIENDOMSTYPER` price and yield (`sorterEiendom`), never on `leieHverPerSek`, which moves with
  weather, vacancy and the index. The choice is a `lagDelvalg` (`eiendomsrekkefolge`) and sits
  in `ALLE_DELVALG`.
- **Numbers from the phone (Pack 76)**: `state/maaling.ts` times the catch-up after time away, each
  live step, each save and the start-up; the panel (`Maalepanel.tsx`) shows them in Innstillinger
  when the game was opened with `?maal` (read at start-up in `App`, remembered in localStorage).
  Keep the *longest* catch-up of the visit: in the browser pane a hidden pane pauses the game, and a
  21 s catch-up overwrote the two-hour one. A store that only one optional panel listens to may
  notify every second; in the pane the panel then showed 4.4 ms a live second on the heaviest save
  in development.
