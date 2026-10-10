# wisdom.md — what the sessions have taught, for the next one

Written after Packs 25–32 of *Milliardær* (30 September 2026), updated after Packs 33–38
(1 October 2026), Pack 39 (5 October 2026), Pack 47 (7 October 2026) and Packs 55–60
(the bug review and the last v10.0 game items, 8–9 October 2026). Read it after `Ideer.md` and `ARKITEKTUR.md`, before touching anything.
It holds what the code doesn't tell you: how Folke works, what the tools do on this machine,
the rules the engine depends on, and the mistakes that cost time. Pack numbers are
landmarks, not state — run `git log --oneline -10` first. Update it at the end of a
session; delete what stops being true.

---

## 1. How Folke works

- **Lists first, then packs.** Folke asks for a numbered list ("what could be improved?",
  "what doesn't make sense gameplay-wise?", "graphic upgrades, if any?"), answers with the
  numbers to keep ("Add 1, 3, 5 …"), and asks to fit them into packs. Never add an idea to
  `Ideer.md` that wasn't picked. Unpicked ideas stay in chat; picked ones go into a section,
  numbered, and into the pack plan when asked.
- **Folke thinks in versions.** Pack 38 was "v0.5"; Packs 39–43 were the road to v1.0,
  and the game shipped as 1.0.0 with Pack 43. A version goal gets its own section in
  `Ideer.md` while it's being built, and the section goes when it's done. When a picked
  item already sits under Parked, move it up — don't leave a copy behind. Folke picks by number and leaves things out on purpose: the
  unpicked v1.0 ideas (tutorial, sound, missions, events, playtesting …) stay out.
- **"Make the new packs" means do it**, not propose: write the plan into `Ideer.md`,
  commit it on its own (`Idéliste: …`), then report the grouping and why. A pack of two
  closely linked items is fine; say so.
- **Analysis lists need real numbers.** The gameplay review that Folke liked read the
  engine and quoted the actual figures (loan 3 %/h vs. rent 30 %/h, ladder steps 4.8×/33×/
  15×). Vague impressions are not worth listing.
- **One pack at a time.** "Start pack N" → build the whole pack, verify it, commit it
  (`Pakke N: …`), report, and stop. Folke then says "push please". Push only when asked,
  and push the idea-list commits along with the pack.
- **When a pack has real design choices, ask once, up front**, with `AskUserQuestion`:
  2–4 questions, each with concrete options and numbers, the recommended one first.
  Folke picked the recommended option every time — so make the recommendation good.
  Don't ask about things with an obvious answer.
- **If you build something different from the option you described, say so clearly** in
  the report, with the reason and the offer to switch back. (Pack 35: the described
  "payback-preserving" upgrade change would have halved income for existing bank/oil
  owners, so upgrades were made cheaper instead — flagged in the report.)
- **Report plainly.** Per item: what changed, what it looks like now, what you checked and
  how. Say what you did *not* see in the browser, and why. Say when a pack grew or shrank,
  and mention small fixes found while checking.
- **Folke wants it to look professional.** No emoji, a consistent visual language, a dry and
  slightly witty voice (like a business paper), Norwegian UI, NOK.
- **Check your own claims against the code.** Grep before you write a list item about
  what the game has or lacks — two list items in earlier sessions described things that
  already existed.
- **"Are there any bugs?"** worked as a parallel review (8 October): four agents, one per
  area (money and trading, businesses and simulation, property and assets, saving and
  UI), each told to *reproduce* every finding with a scratchpad script and report only
  confirmed ones with file:line, numbers and what was ruled out. Spot-check the worst
  findings in the code yourself before passing them on, then give Folke one ranked,
  numbered list (serious / medium / minor) with real numbers ("+113 % in 11 clicks"). The
  17 bugs became a *Bugs* section and Packs 55–58, grouped by the files they touch.
- **"Look at the navigation and how everything is organised"** (10 October) worked as:
  read `App.tsx`, the tab bar and each screen's parts, then measure in a late game at
  375 × 812. A script clicked every tab and every segment button and recorded the page
  height in screens, the headings and the button count. The list then quoted numbers:
  Eiendom 12 screens with 29 property types, Luksus 7.1 screens with the 16 vehicles
  shown twice, the first business card at 303 px of 812, the event log 3.3 screens down
  in Bank. Also grep for behaviour nobody sees on a PC: there was no
  `pushState`/`popstate` at all, so the phone's back button leaves the game. Folke
  picked nine of twelve; they became the *Navigation* section and Packs 61–63 on the
  game track (Pack 61 done on 10 October).
- **Always say what comes next** (asked 10 October). The pack plan in `Ideer.md` has a
  **«Next up»** paragraph: the next pack, what it contains in plain words and with real
  numbers, why it is next, and the questions you will ask when it starts. When a pack is
  done, rewrite that paragraph for the following pack in the same commit, and end the
  report to Folke with the same description. Since G12 there is one such paragraph per
  track («Next up» for the game track, «Next up on the graphics track» below it); each
  track rewrites only its own.
- **"What does the next pack contain?"** — answer from `Ideer.md` in a few lines, with the
  real numbers behind each item, and name the design choices you'll ask about when the
  pack starts. Don't start building.
- **Folke picked the recommended option on every question in Packs 56, 57, 59, 60 and 61–66.**
  Spend the effort on making the recommended option right, with numbers, and on saying
  plainly what the alternative costs (other track's files, existing saves, pace).

## 2. Repo workflow

- Commit messages are Norwegian: `Pakke N: kort tittel`, a blank line, bullets per item,
  then the attribution line. Intended balance changes and golden-master updates are
  explained in the message, with the before → after numbers.
- Pushing to `master` deploys GitHub Pages (live at folkemel-ui.github.io/milliardaeren).
- `Ideer.md`: when a pack is done, remove its line from the pack plan and its items by
  title, drop sections that became empty, and renumber. Keep a script for it in the
  scratchpad: `node ferdig.mjs Ideer.md <pack> "Title one" "Title two" …` — match items by
  `**Title.**`, renumber `N. **`, then remove `## X` headings followed only by blank lines
  (a separate small step; check with `grep -n "^## "` afterwards).
- `ARKITEKTUR.md` (repo root) documents the dice, the hashes, the newspaper's side effect
  and how to add content safely. Update it when randomness or migrations change.
- **Two folders, two branches** (Pack 63). The game track works in `Desktop\New folder (3)`
  on branch `spill`, the graphics track in `Desktop\milliardaer-grafikk` on branch `grafikk`
  (a `git worktree` of the same repo, with its own `node_modules` and its own Claude memory
  folder). Master is checked out nowhere. Before Pack 63 both sessions shared one folder and
  one index: a commit could take the other track's staged work, a push sent G11 live inside
  Pack 61, and keeping CSS hunks apart took a hand-built index — all gone now.
- **A dev server outlives the folder it was started in.** After Pack 63 the graphics
  session's server on port 5186 still ran from the game folder's `node_modules` — started
  there before the split — so its preview showed the game track's files, uncommitted work
  included. Each session should check where its server runs (the `node.exe` command line in
  `Get-CimInstance Win32_Process -Filter "Name = 'node.exe'"`), and stop and restart it from
  its own folder. Don't stop the other session's server; tell Folke.
- **Run `lever.mjs` before the report, not after.** In Pack 66 the graphics track had pushed
  G12 while the pack was being built; the rebase stopped on `Ideer.md` (both tracks removed
  items from the same section, which then had to go) and `vite.config.ts` (both added a
  heavy test). Finding that before reporting meant the report could say «tested on top of
  master». After a conflict in `Ideer.md`, reread your «Next up» — it may talk about the
  other track's pack as if it were still to come.
- **Delivering**: commit on your branch, run `node scripts/lever.mjs` (fetch, rebase onto
  `origin/master`, `tsc` and every test on the result, then the list of what would go to
  master), report, and on Folke's «push» run `node scripts/lever.mjs --push`. It refuses a
  commit that wasn't tested as it stands (a marker in the worktree's git dir), and GitHub
  refuses the push if the other track got there first — run it again. Show Folke the list
  before pushing; it now holds only your own branch's commits. A rebase conflict will
  almost always be `Ideer.md`: keep both tracks' edits. In G12 the game track pushed twice
  during one pack (Pack 65, then a wisdom commit), and the rebase stopped on two files:
  `Ideer.md`, where *both* tracks had removed their own item from the same section (keep
  neither item, renumber, and fix the section's «In Packs …» line), and `vite.config.ts`,
  where both had added a line to `TUNGE` (keep both). After `git add` and `git rebase
  --continue`, run `lever.mjs` again: it may rebase once more onto a newer push, and it
  must test the final result.
- **Touching the graphics track's files**: sometimes a game pack must (Pack 59 needed three
  unique drawings in `Illustrasjoner.tsx` and three `BYPLASS` entries plus a new label side
  in `verdenskartet.ts`/`Verdenskart.tsx`). Keep it minimal and list the touched files in
  the commit message. Art you leave for later becomes an item in the Graphics list (Pack
  60's home scenes), not a silent gap.

- **Splitting a big file (Pack 65: `handlinger.ts` 964 lines, `Investeringer.tsx` 1 056)**: cut
  it into top-level declarations (with their comments) by brace counting, assign each by
  *name* to a file, keep the original order inside each file, and give every new file the
  whole old import block. Then remove unused imports by scanning each file's body for the
  name — not with a `tsc` loop (each pass took over a minute; six passes ran past ten).
  Mind aliases (`antall as fmtAntall`: test the local name) and names that are also
  Norwegian words in comments (`tall`, `sum`, `kroner` survive the scan; `tsc` names the
  few left). Prove the move: strip imports, comments, `export` and whitespace from old and
  new, and the code must be equal to the character. A barrel (`handlinger.ts` re-exporting
  `handlinger/*`) keeps every importer unchanged; tests that read a moved file by path need
  the new path.

## 3. Tools on this machine

- **Write patch scripts as `.mjs` files with the Write tool** into the scratchpad and run
  them. Bash heredocs worked for some JSX patches but failed with "unexpected EOF" on a
  long one, and `node -e` breaks on regexes and nested quotes. A `patch(file, [[from, to]])`
  helper that throws when `from` isn't found is the pattern that works. If a script throws
  halfway, check `git status` — earlier `patch` calls in it have already written.
- **A replacement that doesn't check fails silently.** A `node -e` edit with `\d` inside a
  template string matched nothing, threw nothing, and the old test regex stayed. Every
  replace must throw when its `from` is missing; for a one-line change the Edit tool or
  `sed -i 's/…/…/'` is simpler.
- **Line endings vary**: many files are CRLF, some LF; `engine/marked.ts` and
  `engine/innhold.ts` start with a BOM. Patch scripts normalise to `\n`, patch, and write
  back in the original style. PowerShell `Set-Content -Encoding utf8` writes a BOM — only
  safe on files that already have one.
- **Regex mass-edits are dangerous.** A loose pattern once ate neighbouring commas. Use
  strict patterns, let `tsc` find the fallout, and recover with `git checkout -- <files>`.
- The PowerShell tool sometimes returns nothing for `npx vitest`; use Bash. For the bench
  with an env var, PowerShell works: `$env:BENK='1'; npx vitest run …balansebenken.test.ts`.
- To compare against old engine code without losing work: `git stash`,
  `git checkout <commit> -- src/engine`, measure, `git checkout HEAD -- src/engine`,
  `git stash pop`. (Untracked files survive a plain stash.)
- To try a balance constant quickly: save the file content, swap the number, run the
  bench, restore — and confirm with `git diff --stat` that the restore happened. A
  scratchpad `prov.mjs <name> '<json [[file, from, to], …]>'` that swaps, runs the long
  bench and restores in a `finally` made five variants in a row cheap (Pack 47). Don't
  run other tests or edit that file while it runs.
- **`execSync` on Windows runs through cmd.exe**, where `^` is the escape character:
  `git archive abc123^` silently became `abc123`. Use `abc123~1`. `tar -C "C:…"` reads
  the drive letter as a remote host — run `tar -x` with `cwd` set instead.
- **Vitest picks up other sessions' worktrees** in `.claude/worktrees/` (a stale one ran
  the whole suite twice). `vite.config.ts` now excludes `**/.claude/**` in both projects.
- **When Vitest prints nothing and hangs**, bundle the script with esbuild
  (`npx esbuild x.ts --bundle --platform=node --format=esm --outfile=…`) and run it in
  plain Node: output streams line by line, so you see where it stops.
- **Patch scripts: check every `from` before writing anything.** The pattern that worked in
  Packs 55–60: collect `plan(file, [[from, to], …])` calls, loop once to throw on any
  missing `from`, and only then write. A stale anchor (an import line changed two packs
  ago) then costs nothing instead of leaving half a patch behind. Use `t.replace(from, () => to)`
  so `$` in the replacement isn't read as a pattern.
- **Never sed backticks or `${`.** A `sed 's/\\`/`/g'` meant to unescape a test file put a
  backtick at the start of every line. And when you write a `.ts` file directly with the
  Write tool, don't carry over the `\`` and `\${` escapes from a JS patch script.
- **Bash heredocs still break** on long scripts with backticks (Pack 56: "unexpected EOF
  while looking for matching `''"). Anything longer than a few lines goes in a scratchpad
  file via the Write tool.
- **Run the committed code side by side** without stashing: `git worktree add <scratch>/wt HEAD`,
  link `node_modules` with `cmd //c mklink //J "<wt>\node_modules" "<repo>\node_modules"`,
  run there. Clean up in that order — `cmd //c rmdir "<wt>\node_modules"` first, *then*
  `git worktree remove --force` — or the removal deletes the real `node_modules`. For
  engine-only comparisons, `git archive HEAD src | tar -x -C <scratch>/base` and bundle
  from there.
- **Profile with `node --cpu-prof`** on a bundled script, sum the self time per function
  name from the `.cpuprofile`, and compare old and new side by side. Time old and new
  *interleaved*, best of five or more: the machine's load swings 30 % within minutes.
- **To read Vitest's «Unhandled Error»**, write the run to a scratchpad log and strip the
  colour codes (`sed 's/\x1b\[[0-9;]*m//g'`) before grepping — grep on the coloured output
  found nothing and cost two extra runs of the suite.
- **There is no Python on this machine** (`python` opens the Microsoft Store stub and does
  nothing). Write edit scripts in Node.
- **Absurd durations mean the machine slept** (one test "took" 3 815 s). Rerun; don't debug.

## 4. Dev server and browser pane

- Ports 5180–5182 are often held by other chats. `.claude/launch.json` has
  `milliardaer-test3` on **5184** with its own origin and save, and
  `milliardaer-grafikk` on **5186** for the graphics track (the two tracks run at the
  same time, so each has its own port and save). In Packs 55–60 another chat held 5184
  (`preview_start` refuses a server another chat started); `milliardaer-test2` on 5182
  was free. Its storage was usually wiped between starts — expect to rebuild the save.
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
  screenshot that. `zoom` with a region isn't supported.
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
- **Scan every page a pack touches for overflow**, not just when a number looks odd:
  list the elements whose right edge passes `document.documentElement.clientWidth`. In
  Pack 62 it found an old bug (the achievements grid, `repeat(2, 1fr)` with long words, was
  1–2 px too wide). Two-column grids of text need `minmax(0, 1fr)`.
- **The 1-px resize doesn't always give a true frame**: in Pack 62 it produced a
  screenshot cut off on the right, and a theme switch via `data-theme` never showed in a
  screenshot at all. When that happens, check with DOM numbers (rects, `scrollWidth`,
  computed colours) and say in the report which checks were DOM-only.
- **In mobile emulation `innerWidth` grows** when content overflows. Measure against
  `document.documentElement.clientWidth`.
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
- **Parts that load when needed (G12).** The property and luxury drawings, the two maps and
  the gallery are outside the start-up script (`ui/vedBehov.ts`, `komponenter/ved-behov/`).
  The components keep their names, so screens use them as before, but a test that renders
  a property or luxury drawing or a map must `await lastAlle()` first, or it sees the
  empty placeholder. `startskript.test.ts` (in the heavy group) fails if the start-up
  script passes 250 kB gzipped (238 after G12): put a big new thing in a part instead.
  `startApp` in `klikk.ts` waits for parts still loading before `vi.resetModules()`;
  without that, a click test that ends mid-load made the *next* test hang (Pack 65's
  «Verden viser bare eiendom ute» timed out after G12 until this was added).
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

## 5. The engine: rules that must hold

- **The die is sacred.** The engine is seeded; old games must keep their future. New
  content gets its own randomness (a hash via `Hashkilde`, or its own die). See
  `ARKITEKTUR.md`. The newspaper couples things: anything that adds or removes a story
  shifts the die after the first day change — acceptable, but say so.
- **Golden master** (`gullmester.test.ts`): update the fasit only for intended changes,
  with `OPPDATER_FASIT=1`, and record before → after net worth in the commit message.
  A change in `frø` alone means the die shifted while the economy stayed the same.
- **Balance bench**: `BENK=1 npx vitest run src/engine/__tester__/balansebenken.test.ts`
  plays to kr 1 trillion (~2.5 min) and prints time to each milestone, time since the
  previous one and what the bot owned. Without BENK it stops at 1 mrd so `npm test`
  stays fast. Since Pack 47 the bench uses the **smart bot** (`botSpill(…, true)`),
  which buys straight up to the next income doubling when it can afford it, as players
  do. After Pack 47: 1 mrd ≈ 7 h 20 min, 1 trillion ≈ 1 d 23 h (Folke picked "steady,
  ~15 h per tenfold" after 1 mrd). **After Pack 48, with the smart bot picking volum at
  level 50: 1 mrd ≈ 6 h 33 min, 10 mrd ≈ 15 h 29 min, 1 trillion ≈ 1 d 20 h.** Volum was
  first +25 % (6 h 17 min); Folke chose +15 % to move the pace less. The old simple bot gave
  8 h 38 min to 1 mrd — the game didn't get faster, the bot got less clumsy; with the
  same bot, 7 h 42 min was once rejected as too fast. The **golden master keeps the
  simple bot**, so the fasit only moves when the engine does. **After Pack 59 (branches):
  1 mrd ≈ 6 h 12 min, 10 mrd ≈ 13 h 47 min** (6 h 36 / 15 h 28 without branches, same
  machine). New bot behaviour goes behind `smart` so the golden master can't see it.
- **Tune on the bench with a plain-Node script**, not Vitest: a temporary
  `src/engine/__tester__/zz-benk.ts` (bot to 1 mrd and 10 mrd, prints the times), bundled
  once per variant with the constant swapped by `sed` and restored from a backup copy.
  Six variants ran in ten minutes. Delete the `zz-` files before committing.
- **A greedy bot gives cliffs, not curves.** Branch price ×3.7 made 1 mrd 12 % faster, ×4
  made it *slower* than no branches at all — the bot bought branches for the smallest
  businesses early and either ran away or wasted the money. A gate (branches from level
  50) made the result stable; tune with a rule like that rather than on a knife-edge price.
- **A greedy one-level bot never pushes to a milestone**: the step from 126 to 127 is
  worth almost nothing, so extra doublings at 150/200 changed nothing in the bench until
  the bot could see them. Check that the bot *can* use a change before trusting a
  "no effect" result.
- **Late-game pace comes from the top businesses' payback**, not from more milestones:
  upgrades cost ×1.1 per level while income grows linearly, so everything converges to
  the top businesses' payback. Pack 47 set olje → skisenter to pay back in ~30 000 s with
  upgrades at half the early ladder's share (`pakke35.test.ts` has a second rule for
  that), and compressed the top so skisenter unlocks at 750 mrd, before the finish line.
- **Measure each part of a pack alone** before tuning: switching one effect off at a
  time (Pack 48: volum off, stars off) showed that all the speed-up came from volum and
  that the bot never hired a star. Stars (4× price for 2.5× effect) only pay off when a
  business's ten slots are full — Folke kept it that way.
- **Staff live in `b.stab`** (Pack 48), with `ansatte` still the count. Old saves have no
  `stab`: `stab(b)` then makes everyone experienced with names from a hash, so no save
  version was needed. Never compute "one more hire" as `{ ...b, ansatte: b.ansatte + 1 }`
  — once `stab` exists that adds nobody. Use `medNyAnsatt(b, grad)`. With only
  experienced staff the formulas are bit-for-bit the old ones (zeros added last), which
  is why the golden master didn't move.
- **The world (Pack 49) lives in `engine/verden.ts`**: cycle phases, policy rate, daily
  weather, weekly trends, holidays and weekdays, all from hashes, the same in every game.
  `dagsbilde(s)` gives a day's factor per business type and is cached; income is
  `bedriftInntektPerSek(b, dagsfaktor)`. In the UI use `bedriftInntektIDag(s, b)`, never
  `bedriftInntektPerSek(b) * statusfaktor(s)`, or the card and the cash disagree.
  Weekdays, weather and trends average to ×1 (`pakke49.test.ts` checks two years);
  holidays are bonuses. The bench barely moved (1 mrd 6 h 37 min).
- **Tests of base mechanics mock the calendar**: `vi.mock('../verden', async (ekte) =>
  (await import('./utenKalender')).utenKalender(ekte))`. vi.mock is hoisted above the
  imports, so a helper imported at the top is not ready yet ("Cannot access before
  initialization") — import it inside the factory.
- **Avisa takes five stories**: where a new kind of story goes in `gisUtAvis` decides
  what it pushes off the front page. The world's market stories sit after the rivals,
  because a merger test caught them pushing out the player's own merger.
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
- **Speed is measured on the built engine** (`ytelse.test.ts` bundles with esbuild and
  runs a child Node process): a fresh game ≤ 100 ms, the heaviest save (`fulltSpill`)
  ≤ 400 ms for two hours away — about 0.5 s and 2 s on a slow phone. Windows counts CPU
  time in 15.6 ms steps, so one 95 ms run shows as 94, 109 or 125: the test times four
  runs per sample and takes the best of five. On GitHub (`CI`) the limits get double
  room so a slow runner can't block a deploy. After Pack 52: ~82 ms and ~290–330 ms.
  After Pack 59 the heaviest save is ~10 % heavier (more property, the exchange rates)
  and sits near 400 ms when the machine is busy — but the committed code measured 454 ms
  in the same hour, so compare interleaved before blaming a change. Pack 59's first
  currency version cost +120 ms: a template string and `hashTekst` per call, every
  second. Cache per-second values once per second for *all* keys, keep knot values
  until time passes them, and use a `Map` for city → currency.
- **Both tracks' test suites at once bring the runner error back** (Pack 65): the graphics
  session ran its full suite in its own folder while ours ran, and «Timeout calling
  onTaskUpdate» returned. Before blaming a change, list the Node processes
  (`Get-CimInstance Win32_Process -Filter "Name = 'node.exe'"`) and rerun on a quiet machine.
- **"Timeout calling onTaskUpdate"** (gone since Pack 63; if it comes back, look for a test that
  blocks for many seconds without yielding — the golden master ran 20 s in one call) at the end of a passing run is the runner starving
  under load, not a test failure. It appeared when Pack 59 made the suite ~10 % heavier
  and the machine was busy, never when the heavy files ran alone. Long synchronous tests
  should yield (`await new Promise((r) => setTimeout(r, 0))` between chunks, like the
  bench); `simuler(s, n)` equals n single seconds, so chunking changes nothing.
- **The save is written through `tilLagring`** (`state/lagringsformat.ts`): number
  histories with 7 significant digits, everything else exact. A new number history must
  be named `historikk`/`inntektHistorikk` (or `punkter`) to be rounded. Every list has a
  cap; the heaviest save levels off at ~178 kB after ~120 game days (`pakke52.test.ts`).
- **A new asset class (Pack 53, bonds)** touches: `Aktivaklasse` (types.ts), `KLASSER`,
  `nullPerKlasse`, `klasseverdier` and `kostpris` (portefolje.ts), `eiendeler` (formler.ts, append
  at the end so sums stay exact), the margin call (bank.ts), a `utfor*salg` in handel.ts
  with `bokforGevinst`, `KLASSENAVN` and `TIL_UNDERFANE` (Investeringer.tsx), and two tests
  that list the classes by hand (portefolje, migrering). Old saves miss the class in
  `dagensFlyt`/`forrigeDag.verdier`: both are read with `?? 0`, so no migration.
  Coupons count as dividends (`totaltUtbytte`) — not savings interest, because the
  savings account's cost price is computed from `totaltSparerente`.
- **Business income today = `dagensFaktor(s, type)`**: the calendar (Pack 49) times
  company news in the industry (Pack 53, `nyhetsfaktor`). Use it (or `bedriftInntektIDag`)
  everywhere income is shown.
- **Rent (Pack 54)** = price × index × yield × standard × city factor × season × weather
  ÷ 3600, where the city factor (`byfaktorLeie`) holds the whole-city bonus, vacancy and
  the manager's trait, and the weather factor comes from `dagsbilde(s).eiendom[id]`. Tests
  of base rent mechanics mock vacancy with `__tester__/utenUtleie.ts` (like
  `utenKalender`). The bot owns no property, so the golden master and the bench can't
  see any of this — `pakke54.test.ts` and reasoning are the guard.
- **One weather**: Norway's daily weather (`vaerPaaDag(dag)`) keeps Pack 49's hash key,
  so adding places (`'alpene'`, `'syden'`) changed nothing at home. The farms' weekly
  harvest (`jord.vaer`) is now the mean of that week's seven days, amplified ×3.
- **Know what the bot doesn't do**, or the bench will fool you: it never borrows, never
  hires managers, never buys property, luxury, stocks or startups, and reaches 1 mrd
  before it ever buys the Bank. Changes to those systems don't show in the bench — reason
  about them with numbers instead, and say so.
- **Measure before changing balance**, and change entry price/unlock rather than
  long-term strength (cheaper upgrades compound through the whole game).
- **Think about existing saves when offering a balance option.** Lowering a business's
  income "to keep payback the same" cuts income for everyone who already owns it.
  Prefer changes where nobody loses what they have, or migrate.
- **How money leaked (the 8 October review)** — check every new mechanic against these:
  - *A cap per action is a discount.* The stock price-impact cap applied per order, so ten
    capped buys and one capped sale made +113 %. Pricing must be path-independent (Pack 56:
    1/p falls by quantity/depth, cost = depth · ln(p₁/p₀)); a cap may only *limit the
    order size*, never the price paid.
  - *A predictable switch is free money.* Bonds priced on today's policy rate could only
    rise when a boom (rate at its top) ended: +9 % expected per switch. Anything priced
    on a known, mean-reverting state must price the *expectation* (Pack 56's market rate:
    today's rate for the rest of the phase, the long-run 3,875 % after).
  - *Paying whoever owns it at the moment* — the farm harvest went to the Monday-morning
    owner, so a Sunday-to-Monday flip paid a week. Pay for time owned, and pay the part
    so far on a sale (Pack 57, `gardHost`).
  - *A fee fixed at the start* — the manager's 5 % was taken once, on what you owned that
    day, and covered everything bought later. Fees must follow what they cover.
  - *Price = value when value < cost* — new units in a renovated building cost their value
    (×1,35) but renovating cost ×1,65, so renovate one and buy the rest. Buying must cost
    what the cheapest way to the same state costs (`kjopsprisEiendom` vs `eiendomspris`).
  - *Derived prices that the player can push* — fund prices followed member prices the
    player could pump. Keep the player's own impact separate (`Kurs.trykk`) and let
    derived prices ignore it (`markedskurs`).
  The test for each: a round trip with no time passing must lose the fees, and the
  expected value of a predictable event must be about zero. Reproduce the exploit in the
  pack's test, and show it fails on the old code (stash the engine files, run that test).
- **Time away (Pack 55)**: the store keeps `klokke`, the wall-clock time the in-memory
  game belongs to; saves stamp `sistAktiv` with it, not with "now". It stands still while
  the tab is hidden, so a later `pagehide` can't steal the hours; a migration on load
  writes the save *without* stamping, or every save-format bump erased the time away.
  Swaps (import, backup, start over) go through `byttSpill`, which bumps `spillnummer` so
  `App` doesn't celebrate the other game's history; `importer` refuses a second call
  while one runs. Tests that start the app must call `stoppSpillokke()` when done.
- **Savings move only through `settInnSparing`/`trekkFraSparing`** (Pack 58), so the
  cost basis follows; any new code that takes from the savings account must use them.
  Debt the bank adds when cash and savings run out (`dekkUnderskudd`, club wages, tax)
  goes through `meldBankenDekket` (one toast per game day) and doesn't count as a loan
  (`harLaant` is set only by `laan`).
- **Business income shown or paid = `bedriftsfaktor(s, b)`** since Pack 59: the day
  (calendar × news) times `filialfaktor` for branches. Exactly 1 without branches, so
  nothing else moved. `bedriftInntektIDag` uses it; the simulation multiplies
  `filialfaktor` in `sekund`.
- **Foreign property is in its own currency** (Pack 59, `valuta.ts`): `eiendomskurs`
  multiplies foreign cities by `valutafaktor`, so price, value, rent and renovation all
  follow. Rates are smooth hash waves, the same in every game, anchored per save.
- **`flyt` also counts bought and sold** (`handelTotalt`, Pack 60) for the Sunday paper's
  «Uka di». Every `flyt` with a positive amount is a purchase, a negative one a sale; the
  report leaves the savings account out. The weekly report stores its own curve, Forbes
  list, trades and best/worst investment, so old Sunday papers stay true.
- **A new foreign city** needs: the `Utenlandsby` and `EiendomId` types, an
  `EIENDOMSTYPER` entry in price order with a yield between its neighbours
  (`pakke11`'s ladder test), `VALUTA_FOR`, a `BYPLASS` entry whose label doesn't hit its
  neighbours (`'over'` exists since Pack 59; check with the overlay clone), a *unique*
  drawing in `ILLUSTRASJONER` and `NY_STIL` (`grafikkG5.test.ts` rejects shared drawings),
  and the foreign-city count in `pakke11.test.ts` (Verdensborger needs them all).
- **A new achievement needs a medal** in `ui/merker.ts` (`ikoner.test.ts` checks).
  Achievements are checked every second: return early when the player can't have it yet.
- **Real old saves** (Pack 47): `scripts/lag-gamle-lagringer.mjs` pulls the source of
  every save version from git, bundles that old engine with esbuild, plays a game with it
  (bot, then a bit of everything that version knew, then 576 game days) and writes
  `src/state/__tester__/gamle-lagringer/vN.json.gz`. `gamle-lagringer.test.ts` migrates
  each, checks the load check, that everything owned survives, that net worth matches
  the old engine **to the krone** (minus manager prices before v19), and plays a month on.
  Versions 6 and 11 never existed in a commit. **When you bump the save version**, give
  the version you leave behind a real save *before* committing: add
  `N: { fra: '<the last commit with version N>' }` to `NESTE_BUMP` (usually `HEAD`'s hash)
  and run `node scripts/lag-gamle-lagringer.mjs N` — the argument builds only that
  version, so the others stay byte-identical. (The older entries name the *bumping*
  commit and build from its parent; `{ fra }` exists because that hash isn't known yet.)
  The program buys a bit of everything the version had; add a `prov('kjop…')` line when
  a new kind of thing appears (Pack 56 added a bond).
- **A game day is 300 s** (`DAG_SEK`), not 86 400. "Two days" of simulated play is 576
  game days.
- **Save versions** (now 23 — 21 for the bonds' anchor in Pack 56, 22 for the currency
  anchor in Pack 59, 23 for the club's stadium and league in Pack 66): write the migration before bumping `SPILLVERSJON`; never
  skip a step. A migration that changes how something is *priced* must keep today's
  value exactly: Pack 56 gave each bond post an `anker` that reproduces its old price,
  Pack 59 anchored every currency where the save was (`valutaanker`), and both have a
  test that a real old save keeps its value. Optional new fields can be read with `?? 0` without a version bump.
  `state/__tester__/migrering.test.ts` migrates old saves all the way to the latest and
  checks net worth, so a migration that changes value (v19 removed manager costs) means
  updating those expectations on purpose.
- **Every sale goes through `handel.ts` (`utfor*`)**, which records the realized gain with
  `bokforGevinst` for the monthly tax. A new way to sell something must do the same —
  including forced sales (the margin call's business sale missed it until Pack 39).
- **Every krone in must land in a `totalt*` counter**, or it escapes tax and the
  accounts. To audit: `grep -n "kontanter +=" src/engine/*.ts` and follow each one (club
  tickets and sponsor money escaped this way until Pack 39). A new income counter
  touches: `Spilltilstand`, `Periodestart` and `Oppgjor` (types.ts, optional), `periodestart` +
  `lagOppgjor` (oppgjor.ts), `skattegrunnlag` (skatt.ts), `nettoInn` + a row in
  `OppgjorBlokk` (Oppgjor.tsx), `KILDER` + `paagaende` (ui/statistikk.ts), `SidenStart`
  (Statistikk.tsx), and the tax text in `forklaringer.ts`. When an old tellerstand lacks the
  field, count the period from zero (`start.x === undefined ? 0 : …`) — subtracting
  nothing would dump the whole history into one month's tax.
- **Open question for Folke:** the one-off hiring fee sits in `totaltForbruk` with luxury
  and is not tax-deductible. Left alone in Pack 39 because changing it moves the golden master.
- **The day change runs in a fixed order** (`gisUtAvis`): settlements first
  (`dagsskifteOppgjor`, which also writes the daily `dagsoppgjor` for the statistics), then
  tax, club, harvest, landmarks, art. So the club round and Monday's harvest land in the
  *next* period. Consistent, but remember it when a test expects them in "today".
- **The calendar starts Monday 4 January 2027**, not on a month boundary. A test that
  needs the month settlement must find the first day with `dato(d).dag === 1`. Weeks are
  settled on Sunday, so `ukestart.dag` is a Sunday and the running week's number is
  `ukenummer(start.dag + 1)`.
- **Wages are fixed per employee**, so a business's income can be negative;
  `dekkUnderskudd` (bank.ts) moves a cash deficit to savings, then debt.
- **Loans are capped by income** (`laanetak`). Tests that need a big loan without income
  use `laanUtenTak` from `__tester__/hjelp.ts`.
- **Adding a business type** needs: `BedriftstypeId` (types.ts), `BEDRIFTSTYPER` +
  `STIGEN` + `FORBEDRINGER` (innhold.ts), `FORMER` (fusjon.ts), a drawing with four growth
  stages and three improvement details plus entries in `ILLUSTRASJONER` and
  `BEDRIFTSTEGNINGER`. `pakke35.test.ts` checks the ladder rules: steps ≤ 16×, unlock at
  1.2–1.3 × price, first-upgrade share rising from 25 % (kiosk) to ≤ 80 %.
- **Index funds keep their original members**; **every stock needs a `RAPPORTDAG` ≤ 26**.
- **Late-game numbers break loops that step one unit at a time.** `maksKjop` stepped
  down one share (or 1/10 000 coin) per iteration from an estimate; with trillions in
  cash the estimate was millions of units off and the trade box's "Maks" hung. It now
  bisects. Any loop whose iteration count grows with an amount of money needs the same.
- **Vitest runs the engine 3–4× slower than the built game.** A fresh game's two hours
  away: ~350 ms under Vitest, ~95 ms bundled with esbuild in Node. Measure real cost
  with a bundled script, best of seven (the machine is shared with the other track).
  `fulltSpill()` in `__tester__/hjelp.ts` builds the heaviest possible save (everything
  owned); before Pack 47 it cost ~610 ms bundled, now ~300 ms. The second case in
  `ytelse.test.ts` guards it at 850 ms under Vitest.
- **Speed-ups must keep every number identical.** Pack 47 kept the same arithmetic in
  the same order and only stopped repeating it: region lookup and `Math.exp` of the
  region index cached (by the avvik value), the month cached per day, city factors
  computed once per call into reused Maps, income and status computed once per second
  in `sekund`, no `filter`/`slice` in per-second helpers. Summation order matters for
  floats — don't regroup sums. The golden master can't see property or stocks (the bot
  owns none), so argue exactness for those by reading, and test helpers against the old
  formula (`pakke47.test.ts`).
- **`ytelse.test.ts` runs last, alone**: `vite.config.ts` has three test projects run one
  after the other with `sequence.groupOrder` — `enhet` (the quick ones, in parallel), `tung`
  (the long simulations, old saves and full-app click tests, listed in `TUNGE`; Pack 63) and
  `ytelse` — so a plain `npx vitest run` finishes everything else
  before timing. It measures the process's CPU time (`process.cpuUsage`), not wall-clock
  time. Two hours away costs ~370 ms CPU against the 400 ms limit for the heaviest save (Pack 64), with a budget per part. If it creeps up,
  profile from `/ikon.svg` in the browser by timing engine functions 7 200 times each;
  the per-second checks (achievements, net worth, rent) are where the time goes.
  `sjekkPrestasjoner` computes income, status level and foreign cities once per check via
  `Felles`; give a new achievement that needs an expensive value a field there.
- **Per-system cost (Pack 64)**: `sekund` measures itself when the speed test calls
  `maalDeler({})` — a `runde(m, 'del', t)` after each part. After Pack 64 the heaviest save,
  two hours away: formue ~115 ms, leie ~100, prestasjoner ~64 (36 of it the income record's
  `inntektPerSek`), inntekt ~39, marked ~30, the rest ≤ 12; total ~367 ms of the 400 ms
  limit. Each part has a line in `__tester__/budsjett.ts` (~40 % over the measurement), and a
  new part without a line fails. **A new per-second system adds a `runde` and a budget line.**
- **Trust the stopwatch, not the sampling profiler's callers.** In Pack 64 a `--cpu-prof` run
  showed `eiendeler` under both `sekund` and `nettoformue`, and I told Folke net worth was
  computed twice a second. It wasn't: V8 inlines `nettoformue` into `sekund` some of the
  time, so one call site shows up under two callers. Self time of small helpers is smeared
  the same way (a day-change function showed 34 ms of "per-second" text formatting).
  Confirm with `maalDeler` or a direct timing before saying where time goes.
- **What made the engine faster, exactly**: only removing repeated work with real cost — the
  vacancy per city and week built a text key and a Map lookup every second (rent 112 → 100 ms).
  Rewriting `reduce`/`every` as plain loops changed nothing measurable; V8 already does it.
  The exact path left little: ~9 % (406 → ~370 ms). Ticking rent, net worth or achievements
  less often would cut far more, but moves the golden master — Folke chose exact for now.
- **The club (Pack 66)** keeps the whole league: `k.lag` is your division with the table
  (you at index 0), `k.serier[d]` the other four divisions as name + strength (your own
  entry empty). Only your division plays match by match; at season end `skiftSerier`
  moves two up and two down everywhere, ranking the other divisions by strength plus
  ±10 luck, and replaces the two that drop out of 4. divisjon with new names — never the
  ones that just left (a test that counted who stayed caught that). Promotion needs the
  stadium requirement for the division above (`oppfyllerKrav`); a blocked top-two finish
  sends the next team up. What the stadium cost counts in `klubbverdi` and `kostpris`, so
  building moves money only. The bot never buys a club, so the golden master and the
  bench can't see any of it.
- **Old migration steps must not call engine functions whose input grows later.** The 17 → 18
  step valued the club with `klubbverdi`; once Pack 66 made it read `k.stadion`, every save
  from versions 13–17 failed to load (the stadium only arrives in step 22 → 23). Write the
  formula as it was in the step itself. `gamle-lagringer.test.ts` is what catches this.
- **A migration that needs dice uses its own**: Pack 66 drew the other divisions for old
  clubs with `new Terning(hashTekst(name + season))`, so the club's own `frø` — and its
  future matches — stayed exactly as they were.
- **A test that plays to just before an event must not predict the event from that
  moment** when one more round can change it: the top three after eight rounds weren't
  the top three after nine. Check the outcome afterwards (who is now in the division above).
- **Slow tests are slow on their own**: `formue.test.ts` takes ~19 s alone and ~33 s in
  the full suite. Before blaming your change for a slowdown, time it alone on both sides
  of `git stash` (Pack 39's daily settlement cost ~7 %, which is fine).

## 6. Conventions that now exist

- **No emoji anywhere** (`ikoner.test.ts`). Use `<Ikon navn="…" />` from `Ikoner.tsx`.
- **Type scale**: six sizes `--skrift-1…6` (11/13/15/18/22/34 px) and four weights
  `--vekt-normal/halvfet/fet/tung`. `pakke36.test.ts` fails on any other `font-size` or
  `font-weight` in the stylesheets, except graphics listed in its `GRAFIKK` array.
- **Badges**: `.merke` (status word; `gull` new/best, `kant` a role, `ok`, `varsel`,
  `fare`, `info`), `.etikett` (category, grey capitals), `.brikke` (a number). Don't
  invent new pill styles.
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
- **Versions** (Pack 43): the game is 1.0.0. `VERSJON` in `ui/versjon.ts` must equal
  `version` in `package.json` (a test checks). A new release bumps both
  (`npm version X --no-git-tag-version`) and adds an entry at the top of `ENDRINGER`. Players
  who've played ≥ 10 minutes then see "Nytt i X" once; brand-new players never do. The full
  log opens from "Hva er nytt" at the bottom of Innstillinger. Ask Folke before bumping.
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
- **Light theme** (Pack 42): every drawing SVG has class `illustrasjon`, and the light theme gives
  it (and `.stadion`) a 0.6 px drop-shadow hairline so white and cream shapes stay visible on
  white. A new drawing component outside `Illustrasjoner.tsx` needs the same class or selector.
  Medal symbols use `--ring-mork` in the light theme. `?galleri`'s light swatch is pure white,
  like light cards. Check contrast with a script (text colour against the first opaque
  background up the tree) on every tab and sub-page in both themes, rather than by eye.
- **Pictures**: `BedriftIkon` (`stor` for cards where the picture matters) and `Scene`
  (large drawing at the top of a detail view). Club crests: `Klubbvaapen.tsx`, colours and
  pattern from a hash of the name; text goes as HTML over the SVG, never `<text>`.
- **Celebrations are calm and gold**: small milestones get a shine between thin gold
  lines and no confetti, the million a little thin gold confetti, and only 1 mrd the full
  show. Buy and merge moments use `Kjopsglimt`.
- **Screens**: Profil is split into four parts — Meg, Regnskap, Statistikk, Innstillinger —
  via `ui/deler.ts` (remembered, settable from outside — the tax badge opens
  Regnskap; the tab row uses `.segment-fem` so four fit at phone width;
  `pakke37.test.ts` lists the parts). Property has a city view
  (`Byvisning.tsx`, city buttons under the map). The top bar shows progress
  (`formuetrinn`, status title, gold edge by status level).
- **The logo exists in four places** that must match: `Logo.tsx`, `public/ikon.svg`,
  the loading screen in `index.html`, and `scripts/lag-ikoner.mjs`.
- **Text**: amounts are `kr X` via `engine/tall.ts`; short forms go mill → mrd → bill
  (`kr 2,00 bill` from 999,5 mrd, Pack 47); feminine nouns in a-form (Avisa, uka,
  gata, lista); plural «ordrer»; no «papir» in player text.
- **Explanations** live in `ui/forklaringer.ts` and take numbers from engine constants.
  When a rule changes (tax on gains, loan cap, wages, dilution), update the text there.
- **Map geometry** lives in `ui/norgeskartet.ts`; a test checks label overlaps.
- **Cities and regions** (Pack 44): every Norwegian city has a region (six now), and abroad
  follows the national index. Building types exist in several cities as separate ids
  (`hybel-trondheim` …), listed in price order. Owning every unit in a city (`eierHeleByen`)
  gives a crown on the map and +10 % rent there, applied inside `leieHverPerSek`. How to
  add a region or a building in a new city is in `ARKITEKTUR.md`.
- **World map** (Pack 45): geometry in pure `ui/verdenskartet.ts`, with simplified coastlines as
  lon/lat, Mercator, one view per plane (`UTSNITT`) and two insets (`INNFELT`) for New York and
  Dubai. A new foreign city needs a `BYPLASS` entry, and `pakke45.test.ts` checks it shows
  inside the edge at the level its plane opens. `?galleri` shows all four map stages.
  Seasonal properties (`sesong`) multiply rent by `SESONGER[...][month]` inside `leieHverPerSek`.
- **Living maps** (Pack 46): day and night uses `morke(s.sek)` from `ui/dagognatt.ts` as a CSS var `--natt` on the map. Planes and the coastal ship are `<Reisende>` (`Bevegelse.tsx`), which moves via requestAnimationFrame and renders nothing with reduced motion. The buy ring is CSS (`.kart-puls`, `usePuls`). The city card (`Bykort.tsx`) is HTML over the SVG inside `.kart-ramme`. Hooks using `useSyncExternalStore` need a third argument (server snapshot), or `renderToStaticMarkup` tests fail.
- **Testing a migration on a real save**: park the browser tab on `/ikon.svg` while changing
  the engine (stopping the server can wipe that port's storage), then load the game. The game
  always copies the pre-migration save to `milliardaer.lagring.formigrering` (since Pack 55;
  `.korrupt` is only for saves that failed to load). That's the safety
  copy, not a failure.
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
- Shared cards (`Eiendomskort`, `Jordkort`, `Landemerkekort`) are used in the lists, the
  street view and the city view — change the card once.

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
  Luksus → Klubb; the stadium is a card right under the club's top card.
- **Parts (Pack 61)**: every set of parts is a `lagDelvalg(key, parts)` in `ui/deler.ts`
  (remembered in localStorage, first part by default, settable from outside). A new set
  of parts goes there too, not in a `useState`.
  Luksus (Pack 62) is Samling · Hjem · Kunst · Klubb with the status card above the
  parts. **A part must not open on a folded `Seksjon`** (a new player sees only a header):
  use `Delhode` from `Seksjon.tsx` for a part's own heading. The club lives in its part
  (`Klubbdel`), so notices about it use `mål: 'klubb'`.
- **Net worth by kind (Pack 62)**: `ui/formuedeler.ts` on Profil → Meg. A new kind of
  thing you own needs a row there (and in `eiendeler`), or the rows stop summing to net
  worth — `pakke62.test.ts` checks the sum on `fulltSpill`. The Investments overview
  leaves property out on purpose.
- **Event log (Pack 61)**: `Hendelseslogg.tsx` behind the bell in the date line; what's
  been seen is a `sek` in localStorage (`ui/hendelsessett.ts`). A notice can point at it
  with `mål: 'hendelser'` (`Mål` in `ui/varsler.ts`).

## 7. Verifying well

- Type-check (`npx tsc --noEmit -p .`), run all tests, then look in the browser at phone
  width. DOM queries via `javascript_tool` are more reliable than screenshots for content,
  positions and styles.
- Check every instance (all crests, all 13 businesses at all four stages, every tab), not
  just the one you happen to see.
- Each pack gets a `pakkeNN.test.ts` that locks in its rules (ladder ratios, type scale,
  gains tax, migration). Make tests typed, and before "fixing" a failing test, ask whether
  it found a real gap — or whether your test's assumption was wrong (twice this session a
  test fixture simply used the wrong threshold).
- After visual work, click through all five tabs with `console.error` captured to catch
  render errors; old HMR errors stay in the console buffer and can be ignored once a fresh
  load is clean.
