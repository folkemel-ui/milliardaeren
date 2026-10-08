# wisdom.md — what the sessions have taught, for the next one

Written after Packs 25–32 of *Milliardær* (30 September 2026), updated after Packs 33–38
(1 October 2026), Pack 39 (5 October 2026) and Pack 47 (7 October 2026). Read it after `Ideer.md` and `ARKITEKTUR.md`, before touching anything.
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

## 4. Dev server and browser pane

- Ports 5180–5182 are often held by other chats. `.claude/launch.json` has
  `milliardaer-test3` on **5184** with its own origin and save, and
  `milliardaer-grafikk` on **5186** for the graphics track (the two tracks run at the
  same time, so each has its own port and save).
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
  simple bot**, so the fasit only moves when the engine does.
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
- **Know what the bot doesn't do**, or the bench will fool you: it never borrows, never
  hires managers, never buys property, luxury, stocks or startups, and reaches 1 mrd
  before it ever buys the Bank. Changes to those systems don't show in the bench — reason
  about them with numbers instead, and say so.
- **Measure before changing balance**, and change entry price/unlock rather than
  long-term strength (cheaper upgrades compound through the whole game).
- **Think about existing saves when offering a balance option.** Lowering a business's
  income "to keep payback the same" cuts income for everyone who already owns it.
  Prefer changes where nobody loses what they have, or migrate.
- **Real old saves** (Pack 47): `scripts/lag-gamle-lagringer.mjs` pulls the source of
  every save version from git, bundles that old engine with esbuild, plays a game with it
  (bot, then a bit of everything that version knew, then 576 game days) and writes
  `src/state/__tester__/gamle-lagringer/vN.json.gz`. `gamle-lagringer.test.ts` migrates
  each, checks the load check, that everything owned survives, that net worth matches
  the old engine **to the krone** (minus manager prices before v19), and plays a month on.
  Versions 6 and 11 never existed in a commit. **When you bump the save version**, add
  the bumping commit to `NESTE_BUMP` in the script and run it, so the version you leave
  behind gets a real save too.
- **A game day is 300 s** (`DAG_SEK`), not 86 400. "Two days" of simulated play is 576
  game days.
- **Save versions** (now 20): write the migration before bumping `SPILLVERSJON`; never
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
- **`ytelse.test.ts` runs last, alone**: `vite.config.ts` has two test projects, `enhet` and
  `ytelse`, with `sequence.groupOrder`, so a plain `npx vitest run` finishes everything else
  before timing. It measures the process's CPU time (`process.cpuUsage`), not wall-clock
  time. Two hours away costs ~300–390 ms CPU against a 500 ms limit. If it creeps up,
  profile from `/ikon.svg` in the browser by timing engine functions 7 200 times each;
  the per-second checks (achievements, net worth, rent) are where the time goes.
  `sjekkPrestasjoner` computes income, status level and foreign cities once per check via
  `Felles`; give a new achievement that needs an expensive value a field there.
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
  via `ui/profilfane.ts` (remembered, settable from outside — the tax badge opens
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
  gives a crown on the map and +10 % rent there, applied inside `leieHverPerSek`. Save
  version is now 20. How to add a region or a building in a new city is in `ARKITEKTUR.md`.
- **World map** (Pack 45): geometry in pure `ui/verdenskartet.ts`, with simplified coastlines as
  lon/lat, Mercator, one view per plane (`UTSNITT`) and two insets (`INNFELT`) for New York and
  Dubai. A new foreign city needs a `BYPLASS` entry, and `pakke45.test.ts` checks it shows
  inside the edge at the level its plane opens. `?galleri` shows all four map stages.
  Seasonal properties (`sesong`) multiply rent by `SESONGER[...][month]` inside `leieHverPerSek`.
- **Living maps** (Pack 46): day and night uses `morke(s.sek)` from `ui/dagognatt.ts` as a CSS var `--natt` on the map. Planes and the coastal ship are `<Reisende>` (`Bevegelse.tsx`), which moves via requestAnimationFrame and renders nothing with reduced motion. The buy ring is CSS (`.kart-puls`, `usePuls`). The city card (`Bykort.tsx`) is HTML over the SVG inside `.kart-ramme`. Hooks using `useSyncExternalStore` need a third argument (server snapshot), or `renderToStaticMarkup` tests fail.
- **Testing a migration on a real save**: park the browser tab on `/ikon.svg` while changing
  the engine (stopping the server can wipe that port's storage), then load the game. The game
  always copies the pre-migration save to `milliardaer.lagring.korrupt`. That's the safety
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
