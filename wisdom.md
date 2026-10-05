# wisdom.md — what the sessions have taught, for the next one

Written after Packs 25–32 of *Milliardær* (30 September 2026), updated after Packs 33–38
(1 October 2026) and Pack 39 (5 October 2026). Read it after `Ideer.md` and `ARKITEKTUR.md`, before touching anything.
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
- **Folke thinks in versions.** The game as of Pack 38 is "v0.5"; `Ideer.md` has a
  "Road to v1.0" section, and the pack plan marks which packs make v1.0 (39–43) and
  which come after. When a picked item already sits under Parked, move it up — don't
  leave a copy behind. Folke picks by number and leaves things out on purpose: the
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
  bench, restore — and confirm with `git diff --stat` that the restore happened.

## 4. Dev server and browser pane

- Ports 5180–5182 are often held by other chats. `.claude/launch.json` has
  `milliardaer-test3` on **5184** with its own origin and save.
- **The 5184 test save is not durable.** On 1 October the pane's storage for that origin
  was wiped when the test server restarted (not by game code — nothing in `src` clears
  storage). Rebuild a rich test game when needed: open `/ikon.svg` (the game isn't
  running there), `import('/src/engine/start.ts')`, `handlinger.ts` and `simulering.ts`,
  build a state with `nyttSpill`, big `kontanter`/`hoyesteFormue`, `kjopBedrift`,
  `oppgraderFlere`, `kjopLuksus`, `kjopEiendom`, `kjopJord`, `kjopLandemerke`,
  `kjopKlubb`, `simuler(s, 900)`, then `localStorage.setItem('milliardaer.lagring', JSON.stringify(s))`
  and navigate to `/`. A helper like `ok = (u, s) => u.ok ? u.tilstand : s` hides failed
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
- **First page load after starting the server is slow**; the loading screen shows. Wait
  2–3 s before concluding anything. A welcome-back screen may appear — click «Fortsett».
- **HMR keeps old module instances.** After edits, the app loads modules as
  `…/varsler.ts?t=<timestamp>`; a plain `import('/src/ui/varsler.ts')` from the console
  then gives a *separate* copy and nothing shows. Find the real URL with
  `performance.getEntriesByType('resource')` and import that one, then call
  `visKjop`/`visFeiring`. Listeners registered in `App` also stay on the old module —
  reload before testing.
- **In mobile emulation `innerWidth` grows** when content overflows. Measure against
  `document.documentElement.clientWidth`.
- **Never import `/src/state/lager.ts`** from the page — a second store claims ownership
  and pauses the game. Engine modules and `ui/varsler.ts` are safe.
- **Editing a running save**: set `localStorage['milliardaer.eier']` to a dummy value
  first, wait, write `milliardaer.lagring`, remove the dummy, reload. Or write it from
  `/ikon.svg`, where the game isn't running.
- Load-time catch-up grants achievements before the app starts watching, so they never
  reach the event stream. To test celebrations, call `visFeiring` directly.
- Check at phone width (`resize_window` preset mobile) and in both themes. Reset the
  viewport to desktop when done.
- **Check computed styles, not just class names.** A new rule placed earlier in
  `styles.css` silently lost to an older rule with the same specificity (`.kjopskort`
  beat `.luksuskort`). `getComputedStyle(el).gridTemplateColumns` showed it. Animations:
  `getComputedStyle(el).animationName`.
- **Grep `styles.css` for a class name before using it.** `styles.css` is ~4 700 lines
  and short Norwegian names are often taken: `.statistikk` was already the three-column
  play-time card, and the new statistics card rendered squeezed into one column.

## 5. The engine: rules that must hold

- **The die is sacred.** The engine is seeded; old games must keep their future. New
  content gets its own randomness (a hash via `Hashkilde`, or its own die). See
  `ARKITEKTUR.md`. The newspaper couples things: anything that adds or removes a story
  shifts the die after the first day change — acceptable, but say so.
- **Golden master** (`gullmester.test.ts`): update the fasit only for intended changes,
  with `OPPDATER_FASIT=1`, and record before → after net worth in the commit message.
  A change in `frø` alone means the die shifted while the economy stayed the same.
- **Balance bench**: `BENK=1 npx vitest run src/engine/__tester__/balansebenken.test.ts`
  prints the bot's time to each milestone. **Now 1 mrd ≈ 8 h 38 min** (after Pack 35;
  it was 9 h 13 min before Packs 34–35). Folke has accepted this; earlier, 7 h 42 min was
  rejected as too fast.
- **Know what the bot doesn't do**, or the bench will fool you: it never borrows, never
  hires managers, never buys property, luxury, stocks or startups, and reaches 1 mrd
  before it ever buys the Bank. Changes to those systems don't show in the bench — reason
  about them with numbers instead, and say so.
- **Measure before changing balance**, and change entry price/unlock rather than
  long-term strength (cheaper upgrades compound through the whole game).
- **Think about existing saves when offering a balance option.** Lowering a business's
  income "to keep payback the same" cuts income for everyone who already owns it.
  Prefer changes where nobody loses what they have, or migrate.
- **Save versions** (now 19): write the migration before bumping `SPILLVERSJON`; never
  skip a step. Optional new fields can be read with `?? 0` without a version bump.
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
- `ytelse.test.ts` can fail when the whole suite runs in parallel; run it alone first.
- **Slow tests are slow on their own**: `formue.test.ts` takes ~19 s alone and ~33 s in
  the full suite. Before blaming your change for a slowdown, time it alone on both sides
  of `git stash` (Pack 39's daily settlement cost ~7 %, which is fine).

## 6. Conventions that now exist

- **No emoji anywhere** (`ikoner.test.ts`). Use `<Ikon navn="…" />` from `Ikoner.tsx`.
- **Type scale**: six sizes `--skrift-1…6` (11/13/15/18/22/34 px) and four weights
  `--vekt-normal/halvfet/fet/tung`. `pakke36.test.ts` fails on any other `font-size` or
  `font-weight` in `styles.css`, except graphics listed in its `GRAFIKK` array.
- **Badges**: `.merke` (status word; `gull` new/best, `kant` a role, `ok`, `varsel`,
  `fare`, `info`), `.etikett` (category, grey capitals), `.brikke` (a number). Don't
  invent new pill styles.
- **Drawings** follow the rules at the top of `Illustrasjoner.tsx`: palette `F`, one
  `Grunn` per drawing on baseline y = 43, nothing outside or touching the 48×48 frame,
  side view, flat shapes, product on the sign. Businesses are `B = (trinn, f)`: growth
  stage 0–3 (level 1/25/50/100) and `f` improvements, each with its own detail. Level 100
  shows a gold plaque (`Utmerkelse`), not neon. Moving parts get an `anim-*` class and
  only move inside `.scene` (detail views), never with reduced motion. Review art on
  `?galleri` (stage n is shown with n improvements) via a cloned overlay contact sheet.
- **Pictures**: `BedriftIkon` (`stor` for cards where the picture matters) and `Scene`
  (large drawing at the top of a detail view). Club crests: `Klubbvaapen.tsx`, colours and
  pattern from a hash of the name; text goes as HTML over the SVG, never `<text>`.
- **Celebrations are calm and gold**: small milestones get a shine between thin gold
  lines and no confetti, the million a little thin gold confetti, and only 1 mrd the full
  show. Buy and merge moments use `Kjopsglimt`.
- **Screens**: Profil is split into four parts — Meg, Regnskap, Statistikk, Innstillinger —
  via `ui/profilfane.ts` (remembered, settable from outside — the tax badge opens
  Regnskap; the tab row uses `.segment-fem` so four fit at phone width;
  `pakke37.test.ts` lists the parts). Property has a city view
  (`Byvisning.tsx`, city buttons under the map). The top bar shows progress
  (`formuetrinn`, status title, gold edge by status level).
- **The logo exists in four places** that must match: `Logo.tsx`, `public/ikon.svg`,
  the loading screen in `index.html`, and `scripts/lag-ikoner.mjs`.
- **Text**: amounts are `kr X` via `engine/tall.ts`; feminine nouns in a-form (Avisa, uka,
  gata, lista); plural «ordrer»; no «papir» in player text.
- **Explanations** live in `ui/forklaringer.ts` and take numbers from engine constants.
  When a rule changes (tax on gains, loan cap, wages, dilution), update the text there.
- **Map geometry** lives in `ui/norgeskartet.ts`; a test checks label overlaps.
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
