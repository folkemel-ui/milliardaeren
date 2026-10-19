# wisdom.md — what the sessions have taught, for the next one

Written after Packs 25–32 of *Milliardær* (30 September 2026) and updated after almost every pack
since (last: Pack 117, 19 October 2026). On 15 October it was split in four, because the whole of it
had grown to 1 635 lines that every session read before starting. **Read this file every session**,
after `Ideer.md` and `ARKITEKTUR.md`; read the others when the work touches them:

| File | What it holds | Read it |
|---|---|---|
| `wisdom.md` (this) | How Folke works, the repo and delivering, the tools on this machine, the test runner and the speed budgets, verifying | Every session |
| `wisdom-motor.md` | The engine's rules: the die, the golden master, the bench and the bot, money and tax, saves and migrations, speed | Before any engine or balance change |
| `wisdom-systemer.md` | One heading per system: businesses, the market, rivals, Avisa, property, the farms, luxury and art, the club, racing, status | Before touching that system |
| `wisdom-skjerm.md` | The dev server and the browser pane, proving a UI change, the parts and the start script, drawings, UI conventions | Before screen or drawing work |
| `wisdom-grafikk.md` | The graphics track's own notes | In graphics sessions |

Old references by number (e.g. «`wisdom.md` §4» in `wisdom-grafikk.md`) mean the file before the
split: §1–3 are still here, §4 and §6 (screens) are in `wisdom-skjerm.md`, §5 (the engine) is in
`wisdom-motor.md` and `wisdom-systemer.md` — and the test runner's «Timeout calling
onTaskUpdate» is §4 here. Pack numbers are landmarks, not state — run `git log --oneline -10`
first. Update the right file at the end of a session; delete what stops being true. Each entry
lives in one place only.

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
  new money leaks (the six patterns under «How money leaked» in `wisdom-motor.md`), and the technical side. Give each the list of
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
  track rewrites only its own. **On 18 October Folke asked again** («Can you tell me what the next pack
  contains when suggesting the next pack?») after a push ended with only «Start Pack 112?»: every message or
  next-step box that offers the next pack must itself say what it contains — the items with real numbers
  and the start questions — even when an earlier report already did. Folke: «Nice! Always do this.»
  **And then asked for more** («Could you please elaborate what the pack contains, and continue to do so in
  the future?»): three lines per item is too thin. Per item say what the player sees today (real numbers from
  the code), what changes on screen, how it works underneath — read the code first: Pack 113's «weather as it
  happens» turned out to be fixed from Monday, which made «show the future or not» a real question — what
  stays the same (saves, golden master, other screens), and each start question with its options and which
  way I lean. Measure what a question depends on before asking it: «record and bad weeks» sounded rare, but the
  game's own Rekorduke and Elendig uke came out at 38 % of weeks, so the option Folke picked was a third one.
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
- **Folke's own idea comes as a description** (19 October 2026, the aerospace factory: «It will operate differently
  from the rest … You have to unlock new and better parts … through research»). Write it into `Ideer.md` as items in
  their words (quote the key sentence), split by what can be built and tested on its own, and ask only what it leaves
  open — the packing, how different from the rest, risk, and one thing the description is silent on. Folke answered
  one question with an option of their own (satellites last 30 days, longer with better parts, and can be taken
  down); write such an answer in as given. A one-line idea («setting amount of revenue per/s to the sparekonto») got
  its own item, placed in the pack whose files and purpose it shares, with the placement said in the reply.
- **«Is there anything more we could add?» (19 October 2026)**: by then *Parked* and the declined rounds held
  ~120 entries, and most obvious ideas (taking the group public, an ending, missions, short selling, mortgages,
  events, sound) were already there. Read the whole of *Parked* first, grep the code for each candidate (the Oslo
  home already had a wine cellar room; «oil price» was only a hot/cold-trade label), and say at the top which
  known ideas you left out. Each item says what the game has today in numbers. Folke picked 6 of 20 and asked
  to «reorganize the packs to fit the new points».
- **Reordering the pack plan means renumbering every mention**, not just the pack lines: the section intros
  («Packed as 102 and 116–118»), other packs' text («UI only, like 117 and 118»), and the other track's pack
  notes («fits after Pack 119» in G25). A grep for `Pack 1[0-9][0-9]` outside the plan lines after the script is
  the check. Put new content where its dependencies and the files it shares say (the wine after the pack that
  shortens Luksus), keep dependent packs in a row, and say why each landed where it did.
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
  really pick, and expect a subset. Pack 115: four groups of achievements, one marked — Folke took exactly
  that one; the other groups went to *Parked* as a «Not picked from …» list.
- **When both options in a list item measure badly, offer the combination** (Pack 105, the barn). The item
  said «store the vegetables, *or* cost ~5 %»; measured on a full farm they paid back in ~40 h either way.
  A third option doing both at a middle price (stores all crops, 15 %) came out at ~14 h — like the
  tractor — and Folke picked it. Measure the item's own options first and show their numbers next to it.
- **A short reply can hold three orders** («Yes, please raise the speed-test limit. Push and start the next
  pack»): do them in that order, each as its own step (a small commit, `lever.mjs`, `--push`, then the pack's
  questions), and say in one line at the start of the pack that the other two are done.
- **Folke picked the recommended option on every question in Packs 56, 57, 59, 60, 61–78, 96 and 105–117.**
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
- **Fetch before you start a pack, not only before you deliver** (Pack 103). Folke can reshuffle the
  pack plan in another session: on 14 October «Bedrifter from the top» was moved up as Pack 102 and the
  tax pack became 103 while this session was building the tax pack as «Pakke 102». `lever.mjs` caught it
  as an `Ideer.md` conflict at the end. Resolve to the plan on master (their «Next up», their numbering),
  rename your pack (commit message, comments, test file) to the number it has there, and say so. Better:
  `git fetch` and read `origin/master:Ideer.md`'s «Next up» before asking the pack's questions.
- **`lever.mjs` refuses uncommitted work**, so run `npx vitest run` (the whole suite, ~5 min, into a log)
  before the pack's commit when old tests are likely to move — Pack 107 found two (a level list and the
  Avisa picture of each artist's priciest work) that way and folded the fixes into the pack's one commit.
- **Run `lever.mjs` before the report, not after.** In Pack 66 the graphics track had pushed
  G12 while the pack was being built; the rebase stopped on `Ideer.md` (both tracks removed
  items from the same section, which then had to go) and `vite.config.ts` (both added a
  heavy test). Finding that before reporting meant the report could say «tested on top of
  master». After a conflict in `Ideer.md`, reread your «Next up» — it may talk about the
  other track's pack as if it were still to come.
- **Always tell Folke when a push has gone live** (asked 18 October 2026: «Always give me a notice when a
  push has gone live»). A push only starts the release: `.github/workflows/pages.yml` runs the tests, builds and
  publishes, ~2–3 minutes, and a red test stops it. Right after `node scripts/lever.mjs --push`, start
  `node scripts/live.mjs` in the background (it reads GitHub's open API for the pushed commit's run; exit 0 live,
  1 failed, 2 not done in 15 min). When it ends, send a `PushNotification` («Pakke 114 er live på
  folkemel-ui.github.io/milliardaeren») and say it in the chat too — or, if it failed, say so with the link.
  The push being accepted is not the notice; the finished release is. `gh` isn't installed on this machine.
- **A side session proposed from here works in this same folder** (18 October 2026): a proposal card
  (`own_initiative`) can't name another folder, and without a worktree it shares the checkout and the branch. The
  hooks-fix session added an untracked test while I wanted to run `lever.mjs` — which rebases and tests the
  working tree. Check `git status` before `lever.mjs`; if another session's files are there, message it (by its
  session id) to commit or stop, and wait for it to go idle. It committed on spill and the fix went out with the
  version bump. For work that belongs to the graphics track's files, the brief should say so.
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
- **`${…}` inside a double-quoted `node -e` is Bash's, not JavaScript's** (Pack 108): a help-text edit that
  inserted `${SUPERCUP_STATUS}` came out as two spaces — Bash expanded the empty variable. `tsc` only
  noticed because the import went unused. Anything with `${` goes in a script file via the Write tool.
- **Don't fix a scratch script with `node -e` from Bash.** Nested quotes and `\n` escapes
  inside a Bash string inside JS broke twice in a row; the Edit tool on the script file
  fixed it in one go.
- **Never sed backticks or `${`.** A `sed 's/\\`/`/g'` meant to unescape a test file put a
  backtick at the start of every line. And when you write a `.ts` file directly with the
  Write tool, don't carry over the `\`` and `\${` escapes from a JS patch script. A backslash
  fares no better (Pack 116): `sed` turned a test's `/[^,\d]/` into `/[^,d]/` with no error, and the
  test failed for the wrong reason. A line holding a regex goes through the Edit tool.
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
- **`process.exit()` right after a `fetch` crashes Node on Windows** (libuv: «Assertion failed: !(handle->flags &
  UV_HANDLE_CLOSING)», exit 127 instead of 0). Set `process.exitCode` and leave the loop instead
  (`scripts/live.mjs`). And `gh` isn't installed: GitHub's open API (`api.github.com/repos/…/actions/runs`) works
  without logging in for a public repo, 60 calls an hour.
- **There is no Python on this machine** (`python` opens the Microsoft Store stub and does
  nothing). Write edit scripts in Node.

## 4. The test runner and the speed budgets

Every `lever.mjs` runs all of it, so these bite every delivery. In short: a run that ends with «Timeout calling onTaskUpdate» and every test green is a blocked or starved worker, not a failure (`src/testoppsett.ts` yields after each test, `maxWorkers: 3`); read the file count first; a 1 ms miss on a speed budget under a full run is load — prove it on the previous commit, rerun, and ask before raising a budget.

- **«Timeout calling onTaskUpdate» with every test green is a blocked worker, not a slow machine**
  (Pack 104). The runner's messages have a 60 s deadline whose timer runs in the worker, and between
  tests Vitest awaits only promises, never a macrotask — so a file of synchronous tests (G13, G16 and
  the old saves, 49–55 s alone) holds its worker; past 60 s the timer fires before the waiting reply is
  read. Every file passes alone, master fails too, and 2 workers fail like 3 — all signs of it.
  `src/testoppsett.ts` (in `setupFiles`) now yields with `setTimeout(0)` after every test. Work done in
  a `describe` body (collection) is not covered: keep it short, or move it into a `beforeAll`.
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
- **"Timeout calling onTaskUpdate"** (held off by `maxWorkers: 3` since Pack 79, see the entry before; before
  that, look for a test that blocks for many seconds without yielding — the golden master ran 20 s
  in one call) at the end of a passing run is the runner starving
  under load, not a test failure. It appeared when Pack 59 made the suite ~10 % heavier
  and the machine was busy, never when the heavy files ran alone. Long synchronous tests
  should yield (`await new Promise((r) => setTimeout(r, 0))` between chunks, like the
  bench); `simuler(s, n)` equals n single seconds, so chunking changes nothing.
- **Absurd durations mean the machine slept** (one test "took" 3 815 s). Rerun; don't debug.
- **A `lever.mjs` that never ends: look at the runner's CPU** (19 October 2026). After the machine slept, a run sat
  for 86 minutes with no test workers left and the vitest process at 16 s of CPU in total. List the node processes
  with their start times (`Get-CimInstance Win32_Process -Filter "Name = 'node.exe'"`, in the PowerShell tool —
  `$_` in a Bash-quoted PowerShell line gets eaten), compare with the clock, stop `lever.mjs` and both vitest
  processes, and run it again; the rerun passed in normal time. On a slow evening a full run took ~450 s, so run
  `lever.mjs` in the background, never as a foreground call with the 10-minute limit.
- **The speed test's `leie` part (budget 22 ms) fails under full-suite load** — 23 ms in Packs 93 and 95,
  25 ms in Pack 103 — and passes alone. Rerun `ytelse.test.ts` alone before suspecting the change;
  `lever.mjs` has passed it every time so far.
- **Several speed budgets sit at their edge, and a 1 ms miss is load, not the pack** (15 October). In one
  day `lever.mjs` failed three times on a part the pack never touched: «dagsskifte og kø» 21/20 twice and
  `bank` 21/20 once; each passed on the next run. The proof that it's old: check out the previous commit's
  engine files (`git checkout <commit> -- src/engine/…`), run `ytelse.test.ts` alone twice, and read the
  same part — it was 19–20 there too. Then rerun `lever.mjs`, report it, and ask before raising a budget:
  Folke had «dagsskifte og kø» and `bank` raised to 25 after their second misses, and
  `inntekt` (55, measures 48–54) and a fresh game (100, measures 66–90) are next in line.

## 5. Verifying well

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
- **Read the UI before trusting a list item about it**: «the card only shows +10 % · lønn» (Pack 80)
  missed that the hire option had shown a net «Gir kr X/s» since Pack 48. What was really
  missing: the net left out branches, nothing said a hire loses money, and there was no payback.
  Say in the report how the item turned out, not just that it is done.
- **Three plan premises were wrong in one evening** (18 October 2026): Pack 113's «weather as it happens» was fixed
  from Monday, Pack 114's «the save version bumps» wasn't needed, and Pack 115's «all three plants take the edge off a
  bad week» was false for the sun (+0.92 with the harvest). Each was found by reading or measuring before the
  questions, and each became a question or a line in the report. Treat every «Next up» claim about the model as a
  hypothesis until the code or a measurement says so. Pack 117 again: the plan said the bench bot owns all six
  synergy businesses before 1 000 mrd; a measuring run showed it never owns the fish farm or the airline, so the
  synergy question offered two earlier pairs — the option Folke picked.
- **Check an idea's premise against the model before offering it** (Pack 92's «Next up»): «irrigation
  takes the loss in a dry, sunny week» — but in the game's weather sun is the farm's *best* week.
  Say so in the next pack's description and offer alternatives in its questions.
- **Check a test's premise against the constants** (Pack 87): «without a stadium you can't go up from
  4. divisjon» was false — `STADIONKRAV` asks nothing for 3. divisjon. The engine was right; the test
  moved one division up.
- **A rule change can break old tests' fixtures, not their point.** The merger tests in Packs
  11, 21 and 33 used a kiosk at level 10; the gate made them fail. Lift the fixture to meet
  the new rule (level 100) and keep what the test checks; test the new rule in its own pack.
  The same when a screen folds rows away (Pack 116: kinds at kr 0 behind «Ikke i bruk»): two old
  tests clicked an Indeksfond row their save didn't own. They now open the fold first, if it's there.
- **Counts in a «Next up» go stale between packs** (Pack 116): it said 61 achievements, written before Pack
  115 added the farm ones; the game had 63. Quote the constant's name in the plan (`PRESTASJONER.length`)
  and read the number from the screen when the pack starts.
- **Slow tests are slow on their own**: `formue.test.ts` takes ~19 s alone and ~33 s in
  the full suite. Before blaming your change for a slowdown, time it alone on both sides
  of `git stash` (Pack 39's daily settlement cost ~7 %, which is fine).
