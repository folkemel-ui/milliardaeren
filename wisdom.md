# wisdom.md — what the sessions have taught, for the next one

Written after Packs 25–32 of *Milliardær* (30 September 2026), updated after Packs 33–38
(1 October 2026), Pack 39 (5 October 2026), Pack 47 (7 October 2026) and Packs 55–60
(the bug review and the last v10.0 game items, 8–9 October 2026), and since then after each pack
(last: Pack 101, 14 October 2026). Read it after `Ideer.md` and `ARKITEKTUR.md`, before touching anything.
It holds what the code doesn't tell you: how Folke works, what the tools do on this machine,
the rules the engine depends on, and the mistakes that cost time. Pack numbers are
landmarks, not state — run `git log --oneline -10` first. Update it at the end of a
session; delete what stops being true.

---

## 1. How Folke works

- **Lists first, then packs.** Folke asks for a numbered list ("what could be improved?",
  "what doesn't make sense gameplay-wise?", "graphic upgrades, if any?"), answers with the
  numbers to keep ("Add 1, 3, 5 …"), and asks to fit them into packs. Never add an idea to
  `Ideer.md` that wasn't picked. Picked ones go into a section, numbered, and into the pack
  plan when asked. **Since 11 October Folke wants the unpicked ones kept too:** each list's
  leftovers go under *Parked* as their own short list («Not picked from …», one line each,
  with the key number), and the older declined rounds are recorded there by name. Later
  Folke asks to "pick from the parked and declined lists" — then go through every entry,
  grep for the ones that already exist (selling businesses, the away screen, per-business
  history and the tab dot were all in *Parked* but already in the game), say which you
  left out and why, and move picked ones up with no copy left behind.
- **Folke picks a subset from lists, but the recommended option on design questions.** From
  the 18-item review Folke took 15, from the 31-item club list 10, from the 18 revisited
  parked ideas 5 — never just the ones I recommended. So a list should hold every
  defensible item with its real number, not only the favourites; the recommendation at the
  end is a help, not a filter.
- **"Like a football manager game"** (the club, 11 October): start the list with what the
  club *is* today in numbers (two numbers per player, best-eleven average, one decision per
  match, a final score), and say plainly what can't work — the club's money can never
  matter late (a full Eliteserien season ≈ 14 s of business income at 100 mrd), so it
  must matter through play, goals and glory. Group the list by area (squad, transfers,
  matches, running the club, art and graphics) and number it straight through.
- **Grouping into packs** ("reorganize the packs"): group by the files and the rule they
  touch, so the golden master moves once and the save version bumps once per area (all
  business prices in one pack; everything that changes what a player is in one pack).
  Put dependent packs in order (positions before the match report before cups). A pack the
  *other* track must draw goes at the end of its plan with a note on when it fits, so its
  numbering and its «Next up» don't shift under the other session. Count the items into
  the packs before reporting (26, not the 27 I first said).
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
- **"Make a new list for the game track"** (after Pack 66) worked as four background agents,
  each measuring with its own scratchpad scripts and the smart bot: returns per system at
  10 mill / 1 mrd / 100 mrd / 1 000 mrd, pace and waits between decisions, dead choices and
  new money leaks (the six patterns in §5), and the technical side. Give each the list of
  parked and declined ideas so they don't come back as new. Spot-check the biggest claims in
  the code before passing them on (art ~35 %/h, startups ×1.85 a round, takeovers without
  a floor all held). Folke picked 15 of 18 (not the index-fund return, offshore, juniors).
  An agent reported the suite «red» — it had run the tests while three bot runs loaded the
  machine; two full runs on a quiet machine the same day passed. Check before repeating it.
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
- **"Add the next pack" / "start the next pack" means build it** when the pack already sits in
  the plan (after Pack 77, Folke wrote «Add the next pack» and wanted Pack 78 built). Say in one
  line how you read it, then ask the pack's design questions as usual; the question round is
  also the chance for Folke to say otherwise. **When the questions were already answered with
  recommendations in the previous reply** («what is your next task?» → four questions with my
  picks → «Start next pack», Pack 89), the reply is the go-ahead for those picks: build with them,
  say so in one line at the start, and don't ask again.
- **A pack the size of a list section is fine as two packs on the same files.** The club page
  (19 items) became Pack 77 (the structure: a hub and four pages) and Pack 78 (the lists inside
  them). Building the structure first meant the second pack's measurements were per page, and
  an item the first pack had half-done (the form chips, the table around you) was rewritten in
  `Ideer.md` to say what was left, not removed or left as it was.
- **The first time Folke chose against my recommendation** was Pack 95: the home-screen card on the
  first visit, not «after 10 minutes». Build what was chosen, keep the sensible parts of the
  recommendation that don't conflict (here «Ikke nå» and «Skjul»), and say so in the report.
- **Pack 97: a multi-select with every option marked «Recommended» got one pick** (only the Bedrifter
  screenshot of four screens), and a question left with no answer (the native shell) went with the
  recommended option, said in one line before building. In a multi-select, mark only what you would
  really pick, and expect a subset.
- **Folke picked the recommended option on every question in Packs 56, 57, 59, 60, 61–78 and 96.**
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
- **One `plan()` per file in a patch script.** The helper reads every planned file, then writes
  them all; two `plan()` calls for the same file (Pack 96: the «Next up» text, then the done items)
  each start from the original text, so the second write silently undoes the first. Put every
  replacement for one file in one `plan()`, and check `git diff --stat` after the run.
- **Patch scripts: check every `from` before writing anything.** The pattern that worked in
  Packs 55–60: collect `plan(file, [[from, to], …])` calls, loop once to throw on any
  missing `from`, and only then write. A stale anchor (an import line changed two packs
  ago) then costs nothing instead of leaving half a patch behind. Use `t.replace(from, () => to)`
  so `$` in the replacement isn't read as a pattern. The check runs on the *original* text,
  so a step whose `from` is created by an earlier step fails it (it did, harmlessly, for
  the pack plan on 11 October): fold dependent steps into one replacement.
- **A quoted heredoc is not safe for a script with regexes either** (Pack 77): `\\s`
  inside a template literal in the script came out as `\s`, which a template reads as a
  plain `s`, so the `from` never matched; fixing it with `sed` made it worse. Write any
  patch script that holds a regex or a backslash with the Write tool, or skip the script
  and rewrite a short test file whole.
- **Don't fix a scratch script with `node -e` from Bash.** Nested quotes and `\n` escapes
  inside a Bash string inside JS broke twice in a row; the Edit tool on the script file
  fixed it in one go.
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
- **Run engine TypeScript from a Node script with Vite**: `createServer({ server: { middlewareMode: true },
  appType: 'custom' })` and `ssrLoadModule('/scripts/x.ts')` (Pack 97's store-screenshot save). No
  esbuild bundle step, and `scripts/*.ts` stays outside `tsc`'s `src`.
- **Screenshots from headless Chrome: drive it over the DevTools protocol.** `chrome --headless
  --screenshot` on a page that sets localStorage and redirects failed with `ERR_ABORTED` after four
  minutes of virtual time. Starting Chrome with `--remote-debugging-port`, reading
  `/json/list` and talking to the page with Node's own `WebSocket` (`Runtime.evaluate`,
  `Emulation.setDeviceMetricsOverride` with `deviceScaleFactor`, `Page.captureScreenshot`) took
  seconds: write the save from `/ikon.svg`, open `/`, wait for `.bedriftskort` and
  `document.fonts.ready`, finish the animations, capture (`scripts/lag-skjermbilder.mjs`).
- **There is no Python on this machine** (`python` opens the Microsoft Store stub and does
  nothing). Write edit scripts in Node.
- **Absurd durations mean the machine slept** (one test "took" 3 815 s). Rerun; don't debug.

## 4. Dev server and browser pane

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
- **Two segments on one phone row (Pack 75).** A `.segment` is a grid with equal columns,
  so its width is (widest label + 2 × padding) × buttons: ×1/×10/×100/Maks at padding 10 was
  238 px and Kjøpt/Inntekt at 14 was 157 — 403 on a 343 px row, so they wrapped. Padding 4
  and 6 gave 190 + 125 and one row (`.bedrifter-kontroller`); the 44 px is height, the
  narrowest button is 42 wide as it was. Measure the two `getBoundingClientRect` widths
  before trusting a screenshot of the row: the pane's screenshot was stale twice.
- **«Markedet i dag» counts what is special, and that is almost every day** (Pack 75): a hot
  or cold trade most weeks and a cycle that is rarely «normal» give a count on ~100 of 120
  days, so the badge is a number, not a rare alarm. `ui/markedet.ts` is the pure list; the
  sheet (`Markedsark` in `Dagen.tsx`) reuses the `avis-bakgrunn`/`velkomst` dialog with
  `useFokusfelle`, like «Nytt i».
- **A sort key must come from the catalogue** (Pack 75, as Pack 65): the property list sorts on
  `EIENDOMSTYPER` price and yield (`sorterEiendom`), never on `leieHverPerSek`, which moves with
  weather, vacancy and the index. The choice is a `lagDelvalg` (`eiendomsrekkefolge`) and sits
  in `ALLE_DELVALG`.
- **A contrast sweep must parse every colour syntax.** Pack 97's light-theme sweep (every element
  with gold text on every tab and part, against the first opaque ancestor background) reported the
  tab bar at 3.96:1 — its background is `color(srgb 1 1 1 / 0.94)`, which a regex for `rgb()` read
  as black. Channels in `color(srgb …)` are 0–1. And test the exact ratio: `#8a6700` on `#eceef2` is
  4.496, which the list rounded to «4.50»; the test caught it and `#8a6600` (4.54) went in instead,
  flagged in the report.
- **The native save mirror (Pack 97).** `state/speil.ts` writes every save to a file when
  `window.Capacitor.isNativePlatform()` and its Filesystem plugin exist (no dependency here), and
  `lager.ts` brings a save back from the file when the game started empty. Writes are blocked from
  the moment the read starts (before `startSpillokke`'s first `lagre()`), so a new empty game never
  overwrites the file. In tests, stub `window`/`document` with `removeEventListener` too
  (`stoppSpillokke` calls it), and `vi.advanceTimersByTimeAsync(0)` lets the file's promises settle.
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
  **After Pack 68 (mergers from level 100 at floor 1.0, fixed branch price, Hotell 4 500):
  1 mrd 5 h 11 min, 10 mrd 11 h 46, 100 mrd 23 h 40, 1 000 mrd 37 h 58** (before: 6 h 12,
  13 h 48, 26 h 43, 42 h 19). **After Pack 70 (the smart bot buys status; first upgrades from
  the hotel up cost more): 1 mrd 5 h 07, 10 mrd 11 h 27, 100 mrd 22 h 13, 1 000 mrd 36 h 15** —
  6 h 20, 10 h 46 and 14 h 01 per tenfold. With status alone it was 6 h 09, 10 h 10 and 12 h 30
  (1 000 mrd at 33 h 57); switching status off gave Pack 68's numbers to the minute, so the
  new milestones changed nothing for the bot (see below). Since Pack 70 the bench bot also buys
  status: `statuskandidat` in `bot.ts` bundles the cheapest luxury, rooms and landmarks per
  status point into one candidate that lifts the level, priced with the warehouse expansions
  it needs; it reaches level 5 at 1 mrd and 9 at 1 000 mrd, like a player would.
  **After Pack 80 (from the hotel up: branches and direction at 25, a ×2 milestone at 35):
  1 mrd 5 h 07, 10 mrd 11 h 28, 100 mrd 22 h 09, 1 000 mrd 34 h 05** (×1.5 at 35 gave 35 h 03).
  The golden master did not move: its simple bot never owns a hotel, so it cannot see any rule
  that only touches the top businesses — the bench is the only guard for those.
  **After Pack 100 (improvements at 10/24/48 upgrades, bank upgrade kr 270 mill): 1 mrd 5 h 01,
  10 mrd 11 h 16, 100 mrd 22 h 05, 1 000 mrd 33 h 07.** The golden master moved (its simple bot
  buys improvements): kr 113.6 → 146.5 mill after 4 h.
- **«Make X worth buying» is a pace change when X competes with something per krone** (Pack 100,
  stars). The bot hires by payback, so a star is either never hired (price 2.5, 2.75, 3 and 4 gave
  identical benches — a cliff) or beats the experienced hire, and then hiring as a whole gets
  better: 2.25 made the game 12 % faster. There is no price where stars are «sometimes right» for
  a payback buyer. Show the cliff in the question with the bench numbers on both sides; Folke chose
  to keep the price and say plainly on the card when an experienced hire gives more per krone.
- **Bench several variants in one go** (Pack 100: `scratchpad/benk100/prov.mjs`): copy `src` per
  variant, swap strings (throw unless exactly one hit), bundle `zz-benk.ts` with esbuild, spawn all
  and print one line per tenfold with what the bot owned (stars hired, improvements bought, the
  bank's level and share of income). Seven variants to 1 000 mrd took 2.5 min; the `base` variant
  reproduced the Vitest bench to the minute (34 h 03 against 34 h 04).
- **The borrowing limit and the margin call were one constant until Pack 81.** `MAKS_BELAANING`
  was both how far you can borrow and how far a margin call sells down; lowering it to 0.2 would
  have made every forced sale harsher. Now `MARGIN_MAAL` (0.5) is the sell-down target and the
  Bank page's warning colour. Old fixtures that «borrow the most» and then crash a market no longer
  reach 75 %: `laanUtenTak()` now borrows to 50 % by default. The bench has a second run (only with
  BENK) with a bot that borrows the most before every move (`laanMaks` in `bot.ts`): 1 mrd 4 h 32,
  1 000 mrd 29 h 57 at 0.2 (3 h 28 and 27 h 02 at 0.5).
- **Changing a rival without a save version (Pack 81).** A rival's `tak` and `vekst` are copied into
  the save, and a takeover shrinks `tak` (`fusjon.ts`). So the lift sits in code: `RIVALLOFT` gives
  Marit Aas her own growth and a cap ×20 of whatever her saved cap is, read through `rivalvekst(r)`.
  The golden master did not move: it records your state, and the simple bot never trades with her.
- **A growth rate on paper is not the simulation's** (Pack 81, as Pack 67): 0.16/h «gives 67 mrd at
  22 h» on paper, but the engine gave ~30 (the noise and the slow start pull down). Measure three seeds
  in the engine and pick the number that hits the promise (0.18), and say so in the report.
- **A new luxury thing needs (Pack 88)**: the `LuksusId`, a `LUKSUS` entry whose status beats every
  cheaper thing in its kind (`pakke28.test.ts` — offer status figures that already obey it), a drawing
  in `ved-behov/Luksustegninger.tsx` added at the end of `LUKSUSTEGNINGER`, its id at the end of
  `LUKSUSIDER` and in `NY_STIL` (both lines in `Illustrasjoner.tsx`; `'manhattan-skyskraper']` ends two
  lists, so edit by the line's name), a close-up in `NAERBILDER` if it stands in a place
  (`grafikkG9`), and the drawing count in `grafikkG12`. Cloning a gallery `<svg>` into an overlay grid
  crops it; one drawing at a time in a fixed 420 px box shows it whole.
- **A thing that is not a `LuksusId` but stands in Samling (Pack 89, the unique things)** needs:
  a space (`brukteplasser` counts `unikeI` by `KATEGORI_I`, which now lives in `eiendom.ts`), status
  (`statuspoeng` adds `unikstatus` last), value (`luksusverdi` adds `unikverdi`, so `eiendeler`,
  Profil → Meg's Samling row and the margin call follow), a place in the scene (`Lagerkort` lists
  them after the bought ones; `grafikkG9` counts the `naerbilde={NAER_PLASS}` uses — 3 now), a
  buy moment (`hendelsesstrom` gives `art: 'luksus'` with the drawing's id) and a step in the
  margin call. The catalogue sits in `unike.ts`, which imports only types: `eiendom.ts`,
  `bank.ts` and `handel.ts` all need it, and the auction logic (`auksjon.ts`) imports `bank` and
  `formler`, so anything those three need must not live in `auksjon.ts` (cycles).
- **Income that is rent in all but name can go in `totaltLeie`** (Pack 89, charter), as the
  harvest did with `totaltHost`: the accounts, the tax and the statistics need nothing new. A
  counter of its own touches nine files (§5, «Every krone in»). Keep a per-thing tally on the
  thing (`charter[id].tjent`) for its detail page, and add the per-second sum to `bruttoPerSek` and
  `nettoPerSek` last, so the sums stay bit-for-bit without it. Pay it in the rent block
  (`leieSek`), so time away pays the same.
- **A new competition: measure the ladder before the screen** (Pack 90, the racing team). The first
  numbers (rivals' cars 52–92, your car +3 a step to 100, luck σ 3.5) gave no points at all until
  ~1 mrd of upgrades and a title every time at the top; a 30-line Vitest script that plays 60–200
  seasons per car level and strategy showed it in seconds. Wider field at the bottom (40–88), +2.5 a
  step (top 90), σ 5 gave points from the first kr 40 mill and ~90 % titles at 25 mrd. The same run
  showed «Aggressiv» better than «Normal» at every level until it was made slower and riskier. And
  check the money: wages first outran prizes five times over — a top team should about break even.
  Keep the measuring script in the pack's test as a few snapshot assertions (`snittplass`).
- **A system that lives on a page, not a part** (Pack 90): Luksus has four parts, so the team is a
  row in Samling (`Racingrad`) and a page with back (`ui/racingside.ts`, rendered by `Luksus` in place
  of the screen like the club pages, `useTilbake` before the early returns). Selling closes the page
  itself, or it would reopen with the next team. Its money goes through `totaltKlubb`, so the
  accounts and the tax needed nothing; its trophies sit in `racingtrofeer` at the top level, not in
  `s.trofeer` — the club's live view slices that list by a count (`synligeTrofeer`), and a trophy
  pushed in by another system would hide a club trophy for a day.
- **Anything that grows a weekly payout must book the week so far first** (Pack 92, the farm's
  fields and machines). The harvest is paid on Monday for the days owned; a field that simply raised
  the size would have paid a whole week for a field bought on Sunday night — Pakke 57's leak again.
  `bokforOpptjent` adds the part so far at the old size to `opptjent` and moves the start
  (`plantetSek`, which a farm otherwise never resets) to now; Monday and a sale pay `opptjent` too.
  It uses that day's land value, so such a week pays ~0.1 % less, never more — a test that compares
  harvests must use the same day, since the land value rises 0.3 % a day.
- **A lump payout must be earned per second and held until its day** (Pack 94, wool and slaughter).
  A sheep that paid half a year's wool on shearing day would have doubled its price for anyone
  buying the day before. `dyr.ts` accrues every animal's yield into `dyrKasse` from the purchase
  (`dyrSek`, booked first by `bokforDyr` like the farm's `bokforOpptjent`), pays the daily part at
  each day change and the wool and meat on their days, and a farm sale pays what has accrued.
- **Calendar days pile up in tests** (Pack 94): 1 May (shearing), 1 February and day 56 (= 1 March,
  slaughter) are also month changes, so the support came on top and three tests looked wrong. Before
  trusting a payout test on a special day, list what else happens that day. And a daily yield priced
  on the land value (+0.3 % a day) summed over 55 days is not 55 × the last day's — sum it day by day.
- **Pack 65's 300-line rule for `handlinger/*`** is a test (`pakke65`). When a file passes it, move
  an area to its own file in the barrel (`handlinger/gard.ts`: the farm-building actions) rather than
  raising the limit.
- **An upgrade against a smoothed effect must keep the smoothing's average** (Pack 93). Weather
  effects are divided by the season's average (`jevnetVaer`), so each season gives ×1. Feeding
  drainage in as a better rain value would have raised that average too and taken most of the
  gain back. `ukefaktor` multiplies the day's smoothed value by new/old for that weather instead,
  and returns `vaer(dag).faktor` untouched without the upgrades. Measure such an upgrade over two
  years of the game's weather (104 weeks) before offering its number.
- **A price on an existing payout moves every old test that wrote the formula out** (Pack 93: the
  crop prices). Packs 13, 57 and 92 each spelled out «land value × 8 % × weather»; each needed
  «× this week's grain price» (the first three fields are grain). Grep the tests for the constant
  (`HOST_ANDEL`) before running the suite.
- **A test that clicks buttons by text must not match the label they turn into** (Pack 93): after
  «Lagrer kornet» was tapped it read «Selger kornet», which `startsWith('Selg')` also matched, so
  the «Selg» click hit the switch again. Select by class (`.knapp-gull`) or the full text.
- **A test fixture bought one second into the week** made «a whole week» one second short and four
  tests disagree in the fourth decimal (Pack 92). Start fixtures on a day boundary when the rule
  counts seconds of the week.
- **Check an idea's premise against the model before offering it** (Pack 92's «Next up»): «irrigation
  takes the loss in a dry, sunny week» — but in the game's weather sun is the farm's *best* week.
  Say so in the next pack's description and offer alternatives in its questions.
- **Estimate a height with the 44 px rule in it** (Pack 91). I offered the Samling overview as
  «about 200 px»; with every silhouette a 44 × 44 target, seven fit a 315 px card row, the eight
  cars take two lines, and the card came out at 526 px (480 after showing only the unique things
  you own and dropping the 2 px column gap that wrapped the seven boats). Work it out before
  offering a number: rows × 44 + a label line per row + gaps, and say it in the question.
- **A close-up box is the drawing's size in pixels, not a scale** (`naerbilde` in `Illustrasjon`).
  Doubling it with the tile (86 × 74 → 172 × 148) overran the 153 px tile at 375 px; measure the
  tile first and keep the old ratio (~0.9 of the width): 138 × 119. Check with rects (svg vs.
  `.plass-bilde`), not by eye.
- **Round prices a player reads as a bid** (Pack 89): `rundBud` keeps three significant digits
  (kr 66,4 mill, not kr 66 393 633), and a test can then compare the price exactly.
- **New matches get a die of their own** (Pack 87): the playoffs (`${navn}:${sesong}:kvalik`) and the
  Super Cup (`…:supercup`) draw from hashes, so adding them moved none of the club's existing dice — the
  other divisions' strength-and-luck ranking still draws from the club's die in the same order as before.
  Do the same for any new match or tournament. A playoff place is «the next two eligible», not a fixed
  table position: a club whose stadium is too small for the division above is skipped, so the table's
  gold rows must ask the same question the engine does (`oppfyllerKrav`), or they disagree.
- **Check a test's premise against the constants** (Pack 87): «without a stadium you can't go up from
  4. divisjon» was false — `STADIONKRAV` asks nothing for 3. divisjon. The engine was right; the test
  moved one division up.
- **The live match (Pack 86) is a display rule, not an engine change.** A match is still decided at
  the day change (`kamp.dag` = the new day); `ui/klubblive.ts` shows it over that day and `visKlubb(s, k)`
  gives the club pages a copy without it — the table undone from `k.sisteRunde`, players' numbers,
  `seire`, opponents' scorers, and at a season's last round the old season with `tabellVenter`. Both
  entry points (`Klubbdel`, Luksus → `Klubbdetalj`) pass the copy; actions still use the real `s`.
  **Anything new that shows a result must go through it**, and anything the engine announces must
  wait: the club's Avisa stories go to `k.ventendeSaker`, result events (`Trofé`, `Opprykk`, `Nedrykk`,
  `Nektet opprykk`) to `k.ventendeHendelser`, and club achievements read `k.synlig` (a snapshot taken
  at the start of each day change; `synligeTrofeer(s)` for the trophy list). There is a league match
  every game day, so «nothing while a match is live» would mean never — snapshot per day instead.
  Tests that read a club story, event or achievement right after `klubbVedDagsskifte` need one more.
- **A match is known by competition, season and round** (Pack 98: `kampnokkel` in `ui/velkomst.ts`).
  The cup, Europe, the Super Cup and the playoffs number their own rounds from 1, so «season:round»
  let a cup match hide behind the league match with the same number. A season holds up to ~20
  matches and two hours away plays ~27, so the club keeps 40 (`KAMPER_HUSKET`) and only the last 10
  keep the report (`maal`, `vurderinger`): every new match goes through `leggTilKamp`, never a bare
  `push`. Anything that reads a report must read one of the last ten (the live match, the form chips,
  the report card all do).
- **A new kind of income inside an old one keeps tax and the accounts still** (Pack 98, racing money).
  `totaltRacing` is a part of `totaltKlubb`, as `totaltHost` is a part of `totaltLeie`: the engine
  adds to both, the tax and the monthly accounts read the whole as before, and only Statistikk
  subtracts (`klubb − racing`) to show the part as its own source. Tellerstander from before have
  no `racing`, and then the part stays in the whole — the `start.x === undefined ? 0` pattern.
- **`racing.ts` cannot import `bank.ts`**: bank → eiendom → racing makes a ring, so racing trims the
  event log itself with `MAKS_HENDELSER` from `innhold.ts` (which imports only types). Before Pack 98
  racing pushed to `s.hendelser` with no trim at all; grep `hendelser.push` when adding a system.
- **Check an idea's premise on exact odds before building it** (Pack 85): «give opponents an attack
  and a defence so the tactic matters» would have changed the right tactic in 2–4 % of matches if the
  one number were just split, because the tactics multiply goals the same way whoever attacks. A
  30-line Poisson script showed it in a minute; independent attack and defence plus tactics that
  counter them gave ~26 %. Put such a finding in the question to Folke, with the alternatives' numbers.
- **A match is decided at the day change, so its day is `dagnummer(s.sek) − 1`** in the engine, while
  the screen («Neste kamp») shows `dagnummer(s.sek)` — the same day. Anything tied to the match day
  (weather, wind) must use those two, or the card and the result disagree.
- **Measuring page heights (Pack 84)**: a `Seksjon` header carries `aria-expanded`, not the class
  `åpen` — clicking every `.seksjon-hode` without that check folds the open ones and halves the
  number. Measure before and after with the same script on the same frozen save (keep a copy in
  localStorage, e.g. `milliardaer.lagring.p84`, and restore it before each run), and `git stash` to get
  the «before» from the old code rather than trusting an earlier, differently-folded reading. The
  city chips (`.byvalg`) scroll sideways by design and always show up in an overflow scan.
- **A one-row card at 375 px fits a picture, a name and a number, not a button too** (Pack 84): a
  175 px upgrade button left the name 63 px and «Gatekjøkken» ran under it. Two rows (picture over
  both, name and income on top, the button under) gave 113 px with no collisions; check collisions
  with rects (`h2.right > tall.left`), not by eye.
- **Business income is computed in two places** (Pack 83): `bedriftsfaktor` in `formler.ts` (what the
  cards show) and its own line in `simulering.ts` (what is paid, written out for speed). A rule on the
  day's factor — premium's floor, `dagForBedrift` — must go in both, and a test should compare one
  simulated second's `tjent` with `bedriftInntektIDag` on a day where the rule bites.
- **A system's «one right option» is measured as expected value per phase or per type, not overall**
  (Pack 83). Premium's «no bad days» is worth +15 % for the saftbod and +0.2 % for oil, so one flat
  number would have been right for some businesses and wrong for others; measure the calendar per type
  (`dagensFaktor` over 730 days) before choosing. Managers became a choice by giving each a phase and
  making a switch cheap (1 % of the city) — a pick-once choice is decided by the average alone.
- **New startup ideas need logos** (`STARTUPMERKER` in `StartupLogo.tsx`, the graphics track's file):
  `grafikkG4.test.ts` wants one per idea in a unique colour with contrast ≥ 3 on both dark (#181613)
  and white. Check colours with a scratch script first (relative luminance ~0.12–0.30 passes both).
- **The front page holds five stories, and a fresh game's first day fills them** (Pack 82): company
  news, quarterly notices and the week's trends took all five, so a test that bumped a stock and
  looked for the market story on the front page found nothing. Test a story's own function
  (`omMarkedet` is exported for that) and keep one front-page test for the order. Count stories per
  issue as they are printed (`s.avis` keeps only the last seven).
- **A threshold story needs a buffer** (Pack 82): «print when the mood crosses 0.6» still printed every
  few days, because the mood hovers at the line. A zone that turns at 0.6 and calms only inside 0.4
  (`stemningssone`, kept as `stemningssone` on the day's `Dagsbilde`) cut it from 50 to 23. A new
  optional `Dagsbilde` field needs no save version; a save without it gets the story once.
- **A story that must always print needs a fixed slot, not a high place in the list** (Pack 101). Late
  in the game your own stories (tax, club, racing, farm, auction) fill all five, so the rate meeting was
  printed 1 of 8 times even though it sat high. `gisUtAvis` now cuts the list to four on its day and
  splices it in second. Measure the paper on a late save day by day (`simuler(s, DAG_SEK, true)` × 360,
  compare `verdenssaker(s)` with `s.avis.at(-1)`), in a throwaway `zz-` test.
- **A clamp around an estimate turns the signal against it** (Pack 101): the quarterly result was
  `clamp(expected ± 0.4, 0, 1)`, so a strong estimate (expected 0.83) could surprise up by 0.17 but down
  by 0.4 — «Sterkt» in green meant a worse day on average. Look for clamps before trusting a signal;
  the fix was a lean on an unclamped spread (`ESTIMAT_SKJEVHET`), measured over 40 years × 12 stocks.
- **A floor tied to net worth silences late saves** (Pack 101, «your biggest post»): 0.1 % of kr 329
  bill is kr 329 mill, so `fulltSpill` with kr 100 mill in papers got no own stories at all — right by
  the rule, but useless as a measurement. Measure such a rule on a mid-game save (~1 mrd) as well.
- **A percent bar on a moved price needs a tolerance**: `kurs *= 0.95` then `kurs / før − 1` gave
  0.0499999…, so «at least 5 %» failed depending on the price. `>= terskel − 1e-9`.
- **Per-type rules (Pack 80)**: `milepaelfaktor`, `milepaelboost` and `nesteMilepael` take an
  optional type; without it they give the shared milestones. Anything that shows or plans
  milestones for a business must pass `b.type` (or use `milepaelerFor`), or the hotel's level 35
  is invisible — the bot's «buy up to the next milestone» included. Likewise `filialFraNivaa(type)`
  and `retningNivaa(type)` instead of the two constants. Passing such a function straight to
  `.map` hands it the index as the type; `tsc` caught it in two old tests.
- **Read the UI before trusting a list item about it**: «the card only shows +10 % · lønn» (Pack 80)
  missed that the hire option had shown a net «Gir kr X/s» since Pack 48. What was really
  missing: the net left out branches, nothing said a hire loses money, and there was no payback.
  Say in the report how the item turned out, not just that it is done.
- **The fast bench is the review's pace runner**: `scratchpad/tempo/runner.ts` (session of
  11 October) takes the smart bot to 1 000 mrd in about a minute bundled and prints a
  `TIER` line per tenfold. Swap a constant with `sed`, bundle one copy per variant, run them
  in parallel (`node a.mjs & node b.mjs & wait`), restore the constant and check `git diff`.
  Times are game time, so parallel runs don't disturb each other.
- **Tune on the bench with a plain-Node script**, not Vitest: a temporary
  `src/engine/__tester__/zz-benk.ts` (bot to 1 mrd and 10 mrd, prints the times), bundled
  once per variant with the constant swapped by `sed` and restored from a backup copy.
  Six variants ran in ten minutes. Delete the `zz-` files before committing.
- **A greedy bot gives cliffs, not curves.** Branch price ×3.7 made 1 mrd 12 % faster, ×4
  made it *slower* than no branches at all — the bot bought branches for the smallest
  businesses early and either ran away or wasted the money. A gate (branches from level
  50) made the result stable; tune with a rule like that rather than on a knife-edge price.
- **Milestones after 100 can't pay, whoever plays** (Pack 70): upgrades cost ×1.1 per level
  while income is linear in the level, so the push from 120 to 150 costs about 117 level-100
  upgrades — kr 1.4 mrd for +50 % of a saftbod that earns a few thousand a second (payback ~40 h).
  The smart bot sees the milestone (it buys up to the next one when it can afford it) and still
  never buys it; the bench moved by zero minutes. They exist for players who push for the sake
  of it. Anything meant to keep old businesses relevant has to change the cost curve, not add a
  boost at the top of it.
- **The late pace is the entry payback and the first upgrades, not the upgrade curve** (Pack 70).
  Every business from the hotel up pays back in ~30 000 s at purchase, and its first upgrade in
  ~0.25–0.4 of that; after ~12 levels an upgrade is back at 30 000 s and the bot buys the next
  business instead. So raising the upgrade growth to 1.12 from the restaurant up changed the
  bench by minutes, raising the first-upgrade price (the `oppgraderingspris` share, within the
  rules in `pakke35.test.ts`) moved it by hours, and the 1 → 10 mrd stage stayed at ~6 h in
  every variant (the gatekjøkken/kiosk doublings at level 100 and the hotel and bank entries).
  Folke's «steady ~15 h per tenfold» is therefore not reachable with one constant; Pack 70 took
  the variant that gives the late tenfolds back without slowing the first billion. Greedy cliffs
  again: removing mergers made 1 → 10 mrd *faster* (the bot spent the moves elsewhere), and a
  bigger hotel/bank price (0.6/0.7) came out faster than a smaller one (0.5/0.5) at the end.
- **Measure variants in parallel from copies** (Pack 70): a scratchpad `prov.mjs` copies `src`
  per variant, replaces one string (throws on 0 or 2 hits), bundles a temporary
  `__tester__/zz-benk.ts` with esbuild and runs every variant at once; seven variants took
  ~3 min on a machine the other track was also testing on. Times are game time, so the load
  doesn't matter. The runner prints status level, luxury, rooms and landmarks per tenfold —
  the Vitest bench prints only businesses.
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
  because a merger test caught them pushing out the player's own merger. **It happened again
  in Pack 89**: I put the auction stories high so «Under hammeren» would be seen, and
  `pakke11`'s merger test failed the same way (its fixture has 1 mrd, so an auction opens at
  its first day change). Now your own purchase stands with the `deg` stories and the opening
  and the rival's purchase right after `omRivalene`; the toast and the event log carry the
  opening on a busy day. Any test fixture with a lot of cash now gets an auction on its
  first day change — remember it when a front-page test fails.
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
  **Proved on purpose in G17** (11 October 2026): five runs in a row failed while the other track
  was testing or compiling — on the commit *before* G17 too — and three full runs on a quiet
  machine passed (88 files, 1 026 tests, ~2 min); two full runs started at the same moment both
  failed. The tell-tale is `Test Files 73 passed (73)` instead of 88: the error aborts the run when
  the fast group ends, so the heavy group and the speed test never ran. The count says whether the
  run was complete; a green 73 is not a pass. Wait for the other track's `vitest` to leave the
  process list (a background loop on `Get-CimInstance … | Where-Object CommandLine -match
  'vitest'`), then run `lever.mjs`; the tests themselves are fine.
- **Too many heavy files at once bring it back too** (Pack 78): with 16 files in `TUNGE` on
  this 8-core machine, every full run on a quiet machine ended with the error and 94 of 95
  files (the speed test never ran); 15 heavy files passed, whichever one was left out, and
  no single test was long, so splitting `simuler` into chunks did not help. The fix is
  `maxWorkers: 4` at the root of `test` in `vite.config.ts` (full run ~120 → ~141 s).
  Vitest 3.2 ignores `maxWorkers` and `poolOptions` set inside one project; only the root
  setting or the `--maxWorkers` flag works.
  **Since Pack 79 it is 3.** On a slower night (the full run 154 → 177 s) four workers failed three
  full runs in a row at 96 of 97; three gave 97 of 97 (~213 s). Read the file count before
  anything else. The fast group can trip it too: `grafikkG16` renders for 3–5 s per test, 13 in a
  row (71 s); a pause before each render in its loop fixed that group. Tests that draw many scenes
  in a loop should pause too.
- **An animated page in the browser pane brings it back too** (G14): a contact sheet of
  animated scenes left open made «Timeout calling onTaskUpdate» fail `lever.mjs` three
  times running; closing it and stopping the dev server gave a clean run at once. Leave
  the pane on a still page (or `about:blank`) while the full suite runs.
- **"Timeout calling onTaskUpdate"** (held off by `maxWorkers: 3` since Pack 79, see above; before
  that, look for a test that blocks for many seconds without yielding — the golden master ran 20 s
  in one call) at the end of a passing run is the runner starving
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
  **And a colour**: `--klasse-<id>` in both theme blocks of `grunnlag.css` plus a
  `.fordeling-del.<id>, .klasse-prikk.<id>` rule in `investeringer.css`. Bonds got none in
  Pack 53, so their dot and bar segment were transparent — unseen on the dark theme for
  weeks, found by Folke on the light one (10 October). `grafikkG12.test.ts` checks bonds;
  a new class needs the same.
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
- **Save versions** (now 25 — 21 for the bonds' anchor in Pack 56, 22 for the currency
  anchor in Pack 59, 23 for the club's stadium and league in Pack 66, 24 for the art value
  in Pack 67, 25 for positions, attack/defence, formation and academy in Pack 71): write the migration before bumping `SPILLVERSJON`; never
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
- **Hiring fee (closed 11 October 2026):** the one-off hiring fee sits in `totaltForbruk` with
  luxury and is not tax-deductible. Measured as 0.06 % of the tax paid; Folke chose to leave it,
  since changing it moves the golden master for nothing.
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
- **Time away ticks every 10 s for rent, net worth and achievements (Pack 69).** `simuler`
  passes `sekund` a `leieSek`: 1 in live play (bit-for-bit as before, so the golden master
  and the bench don't move), and while away 0 for nine seconds and the block's count on the
  tenth — blocks sit on whole tens of game time (`(n.sek + 1) % BORTE_TAKT`), so they line up
  with day changes and the net-worth log, and the last second of a call pays what is left.
  After it, two hours away on the heaviest save: formue ~17 ms, leie ~15, prestasjoner ~9,
  inntekt ~38, marked ~26 — ~125 ms total (a fresh game ~50). A new per-second system that
  only needs to be roughly on time while away can follow `leieSek > 0`. Rent can step
  (+0.23 % between two seconds when a rate or vacancy changes), so a lump differs from
  second-by-second by up to ~0.2 % over a few seconds but 1e-5 over ten minutes — test the
  long window for equality and the short one only for «nothing lost».
- **The speed test also guards a live second** (`LEVENDE_SEKUND_MS` in `budsjett.ts`):
  `simuler(s, 1)` on the heaviest save, ~3.7 ms, almost all `structuredClone` (Folke chose to
  keep the copy: removing it touches how every screen redraws). I first set the limit from
  the review agent's 1.7 ms, measured on a lighter save, and it failed — measure on the exact
  save the test uses before writing a limit.
- **Saving (Pack 69)**: every 15 s while playing, in `requestIdleCallback` (2 s deadline)
  where it exists — Safari has none, so it saves at once there; `stoppSpillokke` cancels a
  pending one. Hiding the page and actions still save as before. To watch it in the pane,
  wrap `Storage.prototype.setItem` and log the times of `milliardaer.lagring` writes.
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
- **The squad (Pack 71).** A player is `posisjon`, `angrep`, `forsvar` and a stored
  `styrke` (the overall, `styrkeAv` = attack and defence weighted by position; it is
  recomputed only when attack or defence change, so a migrated player keeps the exact
  value the old save had — `gamle-lagringer.test.ts` checks net worth to the krone). The
  eleven come from `startellever(k)`: slot by slot (keeper first) the best player left by
  `styrke × plassfaktor` (1 in position, 0.7 out, 0.4 for an outfielder in goal). Never
  set `p.styrke` alone in a test fixture — the match reads `lagprofil`, which reads attack
  and defence; the Pack 12/66 fixtures became `p.styrke = p.angrep = p.forsvar = N`.
  `forventetMaal` takes a number (attack = defence) or a `Lagprofil`; opponents are still
  one number. Juniors carry `potensial`; `potensialspenn` shows a 14-wide window placed by
  a hash. New club fields: `formasjon`, `akademi` (`investert` counts in `klubbverdi`).
- **A second competition beside the league (Pack 73).** The league plays every game day with
  no rest days, nine days a season, so «a round a week» would have stretched the cup over
  five seasons — the cup runs on fixed days inside the season (`CUPDAGER`), Europe on the
  even days, both as extra matches in `klubbVedDagsskifte` after the league round and before
  the wages. Each tournament is an `Utslag` with its own die (`frø` kept on it, seeded from
  club:season:cup), so the league's die and every old test stand; the other 48 matches of a
  round are decided by strength on that die, yours by `spillUtslagskamp` (same formula and
  report as a league match, draws on penalties — `straffer: 'deg' | 'dem'`). The 14 seeds sit
  at the *end* of the list so round one plays the first 36 straight off; `nesteUtslagskamp`
  knows that. A knocked-out club's tournament keeps playing to the end, so `naadd` (the round
  reached) is what the summary reads, not `runde`. A tournament match goes into `k.kamper`
  with `turnering`, so tests that count matches or trophies must filter (Pack 12's did not).
  Money: `inntekt(s, k, 'tv' | 'premier', …)` adds to cash, `totaltKlubb` and the club's
  season counter in one place; TV money is paid with the sponsor at season start, so a test
  that expects «buying the club adds only the sponsor» now adds TV too.
- **Details after the dice (Pack 72).** The match report (minutes, scorers, assists, ratings,
  man of the match) is drawn *after* the goal counts with its own `Terning` seeded from
  `hashTekst(club:season:round:rapport)`, so the table, `k.frø` and every old test stand,
  and the same match reads the same every time (`pakke72.test.ts` plays a season twice).
  Anything cosmetic that needs dice should follow this pattern rather than take numbers from
  the club's die. Statistics live on the player (`sesong`, `karriere`, optional) and are
  reset per season in `sesongslutt`; the opponents' scorers are a name → goals map on the
  club (`toppscorere`), cleared with the season. Names repeat in a squad (two lists of ~24),
  so match a player by id, not name — a test that looked a player up by name found the wrong
  one.
- **Tune tactics on exact odds, not samples** (Pack 71). Expected points per tactic for
  strength gaps −30..30, home and away, from the truncated Poisson (≤ 9 goals like the
  engine) — a 30-line script, no dice. A grid search over the four factors gave 54/58
  «right» gaps at 0.55/0.6 and 1.15/1.2; the review's 0.7/0.75 and 1.3/1.4 gave 52 and were
  kept for being readable. The home advantage shifts the bands by about six strength
  points, so «Balansert is best when even» means −8..+2 at home and 0..+8 away.
- **`hashTekst` is signed.** `hashTekst(x) % n` can be negative and index nothing (the
  market players' positions came out undefined in the first run of the migration). Use
  `(hashTekst(x) >>> 0) % n`.
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
- **Tune a balance number on the engine's own simulation, not on a formula** (Pack 67). The
  startup rounds were first solved on paper for +1 % a day; the engine then returned 0.80×
  per krone. Two causes: a bug (the new per-round growth was read *after* `st.runde += 1`, so
  every round used the next one's growth) and a wrong model (most money goes into the late,
  short rounds where the room is biggest, so the formula's 1 %/day came out as 30 %/h on
  capital). Calibrate the simulation script on the old code first — it must reproduce the
  known figure (3.20× here) — then try variants and keep the one that hits the target.
  The review agents' scratch scripts (`scratchpad/avkastning/`) were reusable as they were.
  (Writing this note with `node -e` inside Bash lost both backticked snippets — Bash ran
  them as commands. Text with backticks goes through the Write or Edit tool.)
- **A recommended option can break its own premise — measure before building past it**
  (Pack 68). I recommended a merger floor of 1.0 «if it isn't the cheapest buy»; the
  golden master then showed +129 % after 4 h, and the bench 1 mrd in 3 h 26 min instead of
  6 h 12. A merger at 1.0 pays back in twice the business's *average* payback, while the next
  level's payback grows ×1.1 a level — so it beats upgrading by far early on. I stopped,
  measured four variants on the bench and asked again with a table of times; Folke picked a
  gate (mergers only from level 100). A gate worked again, as for branches at level 50.
- **Find which change moved the golden master by reverting one at a time.** With the old
  merger floor and everything else new, the fasit matched exactly — so all of the move came
  from the floor. After the gate, it moved +13 % for a subtler reason: the simple bot used to
  spend moves on merger bids that were turned down; with the gate it no longer tries, and
  spends those moves on upgrades. An action that never succeeds can still change the bot.
- **A rule change can break old tests' fixtures, not their point.** The merger tests in Packs
  11, 21 and 33 used a kiosk at level 10; the gate made them fail. Lift the fixture to meet
  the new rule (level 100) and keep what the test checks; test the new rule in its own pack.
- **A model with a level and a pull-back: say the measured swing, not the noise's.** Art's
  noise alone gives ±11 % around the value; exhibitions (upward jumps) make it ±16 % and
  keep prices ~9 % above the value on average. I told Folke ±11 % before measuring.
- **Slow tests are slow on their own**: `formue.test.ts` takes ~19 s alone and ~33 s in
  the full suite. Before blaming your change for a slowdown, time it alone on both sides
  of `git stash` (Pack 39's daily settlement cost ~7 %, which is fine).

## 6. Conventions that now exist

- **Hidden achievements (Pack 70)**: `skjult: true` on a `Prestasjon`; `synligePrestasjoner(s)`
  gives the list the Profile shows (open ones plus hidden ones earned), with a line counting the
  hidden ones still waiting; the toast says «Skjult prestasjon». A hidden one should depend on
  what the player does, not on the clock — a game day is 300 s, so «at night» happens every five
  minutes. «Kontrær» is stamped in `kjopPapir` (`kontraerKjop`, optional field, no version
  bump) when the price is ≤ 80 % of the two-hour high; `fulltSpill()` earns it at once, since
  it buys 1 000 of every paper, so test it on a fresh game.
- **The goal strip after the last amount (Pack 70)**: `nesteMaal` falls back to the
  achievements left (`art: 'prestasjon'`, `visning` «37 / 53» in place of the amount) and is
  null only when every achievement is earned. The late goals in `alleMaal` (landmarks, the
  long-range jet, New York) use base prices; the strip is static per game.

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
  The bump as done for 2.6 and 2.7: `git log <last version commit>..origin/master` to see what is
  live since (both tracks), `npm version X --no-git-tag-version` (it updates the lock file too),
  `VERSJON`, an entry at the top of `ENDRINGER` in `ved-behov/Endringslogg.ts` (the text lives in a
  part since Pack 70), the «Releases» sentence in `Ideer.md` (what this version covered, «the next
  entry should start from there»), one commit `Versjon X: endringsloggen`, `lever.mjs`, and push
  only on Folke's word. Draft the points in the recommendation itself, so «yes» approves the text
  as well as the number; if the entry gets anything the draft didn't have (the ingress line in
  2.7), say so.
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
  Luksus → Klubb.
- **The club is a hub (Pack 77)**: the Klubb part shows the top, the next match, the form
  chips, five table rows and four rows to pages (`ui/klubbsider.ts`: Troppen og marked,
  Kamper og tabell, Anlegg og økonomi, Sesongene). A page is a small shared store like
  `detaljvisning.ts`; `Luksus` renders `Klubbdetalj` in place of the screen and calls
  `useTilbake`, the page uses `useVoksUt` (scroll to top, back to where you were) and
  has class `detalj`, so `rullehusk` stores 0. **A new club card goes on a page, not on
  the hub**; give the hub row a one-line preview instead. Selling the club closes the
  page itself (`aapneKlubbside(null)`), or the store would reopen it on the next buy.
  Click tests reach a page with `a.knapp('Anlegg og økonomi', rot.querySelector('.klubbsider'))`.
- **«Ny» in the club is one mark per page (Pack 78)**, `ui/klubbsett.ts`: per club name, the
  market ids, the last match key and the last season as they were when you last opened
  Troppen og marked, Kamper og tabell and Sesongene. A club never seen before takes what it
  shows now as its baseline (`startMerker`), so it doesn't open with «Ny» everywhere. The
  market is replaced every game day, so «6 nye» on the hub is normal, not a bug. The page
  snapshots the old marks when it opens (`useState`) so its «Ny» tags stay while you are
  there, and writes the new ones on open and on close. `startApp` in `klikk.ts` clears
  localStorage, so a test that needs marks across two app starts passes them in its new
  second argument (`startApp(s, { 'milliardaer.klubbSett': … })`).
- **The last stretch (Pack 76).** A new property needs: the `EiendomId` type, an `EIENDOMSTYPER`
  entry in price order with falling yield (`pakke35.test.ts`), a drawing in
  `ved-behov/Eiendomstegninger.tsx` added at the *end* of `EIENDOMSTEGNINGER` and of `EIENDOMSIDER`
  (`grafikkG12.test.ts` compares the two lists in order and counts them, 75 now), and its id in
  `NY_STIL`. In a city that already has a currency and a `BYPLASS` nothing else is needed.
  `fulltSpill()` owns every unit, so a big new property moves the tests built on it: the away-tick
  rent test (`pakke69`) went from 1e-5 to 1.4e-4 because the skyscrapers carry most of the rent and
  it steps at a day change inside a 10 s block (cash still matched to 1e-8). Find the cause by
  zeroing one property at a time before widening a tolerance. A scene that stands at a distance
  needs half-size cars (`Smaabil`): a `Bil` is drawn at street size and covered the mall's entrance.
- **A new building in an old city changes «the whole city» (Pack 79).** `eierHeleByen` counted every
  building in the city, so Pack 76's late buildings took the +10 % away from saves that owned all of
  Oslo, London, Dubai or New York — against the rule that nobody loses what they have. Now a type can
  carry `utenforByen`, and `byggForHeleByen(by)` is what the bonus and the «x av y» count use; rent,
  the city's value and the street view still use `byggI(by)`. Anything else that asks «do you own
  anything here» must ask `byggI` (the manager leaving the city did, via `enheterI`, and would have
  left while you still owned the skyscraper). Before adding a building to an existing city, check
  every caller of `byggI` and `enheterI`.
- **A player's own cost price (Pack 79).** Selling a player used to lower the club's cost price by the
  whole sale, so the gain waited for the club sale, which most players never make. Now a player bought
  gets `kostpris` (the price paid) and an academy junior 0, and `utforSpillersalg` in `handel.ts` books
  sale − cost; a player without it (older saves, the squad that came with the club) is sold as before.
  An optional field with the old behaviour as the fallback needs no save version and taxes nothing
  backwards. Club trades were never in `flyt` (that is for the investment classes), so the weekly
  report needed nothing.
- **A fourth room step** meant the room code (`ui/romkode.ts`) needed 3 bits per room instead of 2
  (`romkode(3,3,3)` was 63, now 219); the saves store step counts, not codes, so nothing migrates.
  A drawing that picks a colour by step from a list (`[...][n]` in the wine cellar) must clamp `n`,
  and `n === 3` checks become `n >= 3`.
- **A hook called before an early return still subscribes.** The measuring panel called
  `useMaalinger()` and then `return null` when hidden, so it listened all the same, and once the
  store notified every second, every Innstillinger click test got a redraw outside `act` — the
  suite stayed green and only the log said «not wrapped in act». Put the hook in a child that is
  only rendered when shown. Grep the `lever.mjs` log for «not wrapped in act» after a change that
  adds a timer or a store; a passing run doesn't show it.
- **Numbers from the phone (Pack 76)**: `state/maaling.ts` times the catch-up after time away, each
  live step, each save and the start-up; the panel (`Maalepanel.tsx`) shows them in Innstillinger
  when the game was opened with `?maal` (read at start-up in `App`, remembered in localStorage).
  Keep the *longest* catch-up of the visit: in the browser pane a hidden pane pauses the game, and a
  21 s catch-up overwrote the two-hour one. A store that only one optional panel listens to may
  notify every second; in the pane the panel then showed 4.4 ms a live second on the heaviest save
  in development.
- **A fresh 4. divisjon club loses its first cup round every time** (five seeds of five):
  a test that needs the cup running sets the squad to `styrke = angrep = forsvar = 95`
  before simulating day 1.
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
- **Seven 44 px buttons don't fit one phone row**: 7 × 44 + paddings and gaps ≈ 352 px against
  343. Adding «Milepæl» to the buy amounts sent the sort to a second row (Pack 75 had them on one);
  check the row count with rects when a segment grows, and say so if one row is impossible.
- **`kanSlaasSammen` is a type guard** (`din is Bedrift`): `!kanSlaasSammen(b)` on a `Bedrift`
  narrows `b` to `never`. Compare `b.nivaa < FUSJON_FRA_NIVAA` for the negative case.

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
