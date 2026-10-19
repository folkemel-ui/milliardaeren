# wisdom-motor.md — the engine's rules

Split out of `wisdom.md` on 15 October 2026. Read it before any change to the engine, the
balance, the saves or the speed. Per-system details (the club, the farms, art …) are in
`wisdom-systemer.md`.

---

## 1. Rules that must hold

- **The die is sacred.** The engine is seeded; old games must keep their future. New
  content gets its own randomness (a hash via `Hashkilde`, or its own die). See
  `ARKITEKTUR.md`. The newspaper couples things: anything that adds or removes a story
  shifts the die after the first day change — acceptable, but say so.
- **Golden master** (`gullmester.test.ts`): update the fasit only for intended changes,
  with `OPPDATER_FASIT=1`, and record before → after net worth in the commit message.
  A change in `frø` alone means the die shifted while the economy stayed the same.
- **`hashTekst` is signed.** `hashTekst(x) % n` can be negative and index nothing (the
  market players' positions came out undefined in the first run of the migration). Use
  `(hashTekst(x) >>> 0) % n`.
- **A game day is 300 s** (`DAG_SEK`), not 86 400. "Two days" of simulated play is 576
  game days.
- **The calendar starts Monday 4 January 2027**, not on a month boundary. A test that
  needs the month settlement must find the first day with `dato(d).dag === 1`. Weeks are
  settled on Sunday, so `ukestart.dag` is a Sunday and the running week's number is
  `ukenummer(start.dag + 1)`.
- **The day change runs in a fixed order** (`gisUtAvis`): settlements first
  (`dagsskifteOppgjor`, which also writes the daily `dagsoppgjor` for the statistics), then
  tax, club, harvest, landmarks, art. So the club round and Monday's harvest land in the
  *next* period. Consistent, but remember it when a test expects them in "today".
- **Net worth is computed before the day change in the same second** (`sekund`: formue, then
  `gisUtAvis`). Anything counted «so far today» from `dagnummer(s.sek) * DAG_SEK` therefore drops
  yesterday's last part at that one second — and the net-worth log can land on it. Pack 106 counts the
  animals' unpaid wool, meat, milk and eggs in net worth, so the tills now carry `dyrBokfort` (booked
  up to: a purchase or the last day change), and «not yet booked» starts there, not at the day's start.
  Old saves fall back to the old rule until their first day change.
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
- **Business income today = `dagensFaktor(s, type)`**: the calendar (Pack 49) times
  company news in the industry (Pack 53, `nyhetsfaktor`). Use it (or `bedriftInntektIDag`)
  everywhere income is shown.
- **Business income shown or paid = `bedriftsfaktor(s, b)`** since Pack 59: the day
  (calendar × news) times `filialfaktor` for branches. Exactly 1 without branches, so
  nothing else moved. `bedriftInntektIDag` uses it; the simulation multiplies
  `filialfaktor` in `sekund`.
- **Business income is computed in two places** (Pack 83): `bedriftsfaktor` in `formler.ts` (what the
  cards show) and its own line in `simulering.ts` (what is paid, written out for speed). A rule on the
  day's factor — premium's floor, `dagForBedrift` — must go in both, and a test should compare one
  simulated second's `tjent` with `bedriftInntektIDag` on a day where the rule bites.
- **Wages are fixed per employee**, so a business's income can be negative;
  `dekkUnderskudd` (bank.ts) moves a cash deficit to savings, then debt.
- **Loans are capped by income** (`laanetak`). Tests that need a big loan without income
  use `laanUtenTak` from `__tester__/hjelp.ts`.
- **Late-game numbers break loops that step one unit at a time.** `maksKjop` stepped
  down one share (or 1/10 000 coin) per iteration from an estimate; with trillions in
  cash the estimate was millions of units off and the trade box's "Maks" hung. It now
  bisects. Any loop whose iteration count grows with an amount of money needs the same.
- **`kanSlaasSammen` is a type guard** (`din is Bedrift`): `!kanSlaasSammen(b)` on a `Bedrift`
  narrows `b` to `never`. Compare `b.nivaa < FUSJON_FRA_NIVAA` for the negative case.
- **Pack 65's 300-line rule for `handlinger/*`** is a test (`pakke65`). When a file passes it, move
  an area to its own file in the barrel (`handlinger/gard.ts`: the farm-building actions) rather than
  raising the limit.
- **Per-type rules (Pack 80)**: `milepaelfaktor`, `milepaelboost` and `nesteMilepael` take an
  optional type; without it they give the shared milestones. Anything that shows or plans
  milestones for a business must pass `b.type` (or use `milepaelerFor`), or the hotel's level 35
  is invisible — the bot's «buy up to the next milestone» included. Likewise `filialFraNivaa(type)`
  and `retningNivaa(type)` instead of the two constants. Passing such a function straight to
  `.map` hands it the index as the type; `tsc` caught it in two old tests.

## 2. Money: where every krone goes

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
- **Savings move only through `settInnSparing`/`trekkFraSparing`** (Pack 58), so the
  cost basis follows; any new code that takes from the savings account must use them.
  Debt the bank adds when cash and savings run out (`dekkUnderskudd`, club wages, tax)
  goes through `meldBankenDekket` (one toast per game day) and doesn't count as a loan
  (`harLaant` is set only by `laan`).
- **Income that is rent in all but name can go in `totaltLeie`** (Pack 89, charter), as the
  harvest did with `totaltHost`: the accounts, the tax and the statistics need nothing new. A
  counter of its own touches nine files («Every krone in», under *Money* in this file). Keep a per-thing tally on the
  thing (`charter[id].tjent`) for its detail page, and add the per-second sum to `bruttoPerSek` and
  `nettoPerSek` last, so the sums stay bit-for-bit without it. Pay it in the rent block
  (`leieSek`), so time away pays the same.
- **A new kind of income inside an old one keeps tax and the accounts still** (Pack 98, racing money).
  `totaltRacing` is a part of `totaltKlubb`, as `totaltHost` is a part of `totaltLeie`: the engine
  adds to both, the tax and the monthly accounts read the whole as before, and only Statistikk
  subtracts (`klubb − racing`) to show the part as its own source. Tellerstander from before have
  no `racing`, and then the part stays in the whole — the `start.x === undefined ? 0` pattern.
- **Paying part of a bill is a new action, not a change to the old one** (Pack 103): the bots call
  `betalSkatt` and keep cash for upgrades when it fails; had it paid part, both bots would have spent
  every tick's cash on tax and the golden master and the bench would have moved. `betalDelAvSkatt` is
  for the player's button only.
- **`flyt` also counts bought and sold** (`handelTotalt`, Pack 60) for the Sunday paper's
  «Uka di». Every `flyt` with a positive amount is a purchase, a negative one a sale; the
  report leaves the savings account out. The weekly report stores its own curve, Forbes
  list, trades and best/worst investment, so old Sunday papers stay true.
- **A payback line on something that pays weekly is a snittuke, not today** (Pack 105, the farm). The
  harvest swings with the week's weather and prices, so «tilbake på T» uses `forventetUke` with and
  without the purchase (`gardGir`): the weather averaged over two years of the game's own hash
  (`snittvaer`, 0.981 bare, 1.303 with drainage, frost cover and sprayer — not 1) and the price
  average 1. A store's gain is the rule *played* over 312 weeks of the real price hash
  (`lagringsgevinst`: +13.4 % grain with a silo), not a constant — so the line follows the rule if
  the threshold is ever changed. Both are memoised; nothing runs per second.
- **Price an add-on on what it multiplies, not on what you own** (Pack 105). Farm machines cost a
  share of land + everything built, so every field and machine made the next one dearer, and a
  tractor paid back 5× slower on a full farm. Land × fields ÷ 3 makes the payback the same at any
  size (14.9 h for the tractor on 3 and 10 fields — `pakke105.test.ts` checks the equality). A
  store doesn't follow that rule: the silo only multiplies the grain, which is 3 of 3 fields on a
  small farm and 5 of 10 on a full one, so it pays back in 17 h small and 33 h full.

## 3. Balance: the bench and the bot

- **Balance bench**: `BENK=1 npx vitest run src/engine/__tester__/balansebenken.test.ts`
  plays to kr 1 trillion (~2.5 min) and prints time to each milestone, time since the
  previous one and what the bot owned. Without BENK it stops at 1 mrd so `npm test`
  stays fast. Since Pack 47 the bench uses the **smart bot** (`botSpill(…, true)`),
  which buys straight up to the next income doubling when it can afford it, as players
  do. The **golden master keeps the simple bot**, so the fasit only moves when the engine
  does; new bot behaviour goes behind `smart` so the golden master can't see it. The simple
  bot never owns a hotel, so a rule that only touches the top businesses is invisible to the
  golden master — the bench is the only guard for those. Since Pack 70 the bench bot also buys
  status: `statuskandidat` in `bot.ts` bundles the cheapest luxury, rooms and landmarks per
  status point into one candidate that lifts the level, priced with the warehouse expansions it
  needs; it reaches level 5 at 1 mrd and stops at Monark (level 9, 705 points) from 100 mrd on.
  **Today (Pack 117, 19 October 2026): 1 mrd 5 h 03, 10 mrd 11 h 16, 100 mrd 21 h 49,
  1 000 mrd 32 h 43** (33 h 16 before Pack 117: the synergies, and the bot builds headquarters floors —
  `nesteEtasjepris` in `kandidater`, the first between 100 and 300 mrd, the second by 1 000 mrd).
  What the bot owns at 1 000 mrd: hotel, bank, oil and a rederi just bought — never a fish farm or an
  airline, so a rule for those (Pack 117's late synergy pairs) only shows past the bench. Its business
  income: 0.17 mill/s at 1 mrd, 0.92 at 10 mrd, 6.4 at 100 mrd, ~85–105 at 1 000 mrd. The golden master stands at kr 147.6 mill after 4 h (since Pack 104).
  The road there, for scale: 1 mrd in 7 h 20 after Pack 47 (Folke then picked «steady, ~15 h
  per tenfold» after 1 mrd), 6 h 33 after Pack 48 (volum +15 %, not +25 %, to move the pace
  less), 6 h 12 after Pack 59's branches, 5 h 11 after Pack 68's mergers, 5 h 07 after Pack 70,
  5 h 01 after Pack 100; 1 000 mrd went 37 h 58 (Pack 68) → 36 h 15 (70) → 34 h 05 (80) → 33 h 07
  (100). The old simple bot gave 8 h 38 to 1 mrd — the game didn't get faster, the bot got less
  clumsy; with the same bot, 7 h 42 was once rejected as too fast.
- To try a balance constant quickly: save the file content, swap the number, run the
  bench, restore — and confirm with `git diff --stat` that the restore happened. A
  scratchpad `prov.mjs <name> '<json [[file, from, to], …]>'` that swaps, runs the long
  bench and restores in a `finally` made five variants in a row cheap (Pack 47). Don't
  run other tests or edit that file while it runs.
- **Know what the bot doesn't do**, or the bench will fool you: it never borrows, never
  hires managers, never buys property, luxury, stocks or startups, and reaches 1 mrd
  before it ever buys the Bank. Changes to those systems don't show in the bench — reason
  about them with numbers instead, and say so.
- **Measure before changing balance**, and change entry price/unlock rather than
  long-term strength (cheaper upgrades compound through the whole game).
- **Think about existing saves when offering a balance option.** Lowering a business's
  income "to keep payback the same" cuts income for everyone who already owns it.
  Prefer changes where nobody loses what they have, or migrate.
- **Bench a list item's claim about the bot before building on it** (Pack 107). The review said «the
  smart bot stops buying status at Mytisk»; a runner that prints `statuspoeng`/`statusnivaa` per tenfold
  (scratchpad `p107/benk.ts` + `prov.mjs`, variants in parallel) showed it stops at Monark (705 points)
  from 100 mrd to 1 000 mrd — so new levels above Mytisk moved the bench by zero minutes. Say so in the
  question: levels up there are for collectors, not pace.
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
- **Measure variants in parallel from copies** (Pack 70): a scratchpad `prov.mjs` copies `src`
  per variant, replaces one string (throws on 0 or 2 hits), bundles a temporary
  `__tester__/zz-benk.ts` with esbuild and runs every variant at once; seven variants took
  ~3 min on a machine the other track was also testing on. Times are game time, so the load
  doesn't matter. The runner prints status level, luxury, rooms and landmarks per tenfold —
  the Vitest bench prints only businesses.
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
- **A greedy one-level bot never pushes to a milestone**: the step from 126 to 127 is
  worth almost nothing, so extra doublings at 150/200 changed nothing in the bench until
  the bot could see them. Check that the bot *can* use a change before trusting a
  "no effect" result.
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
- **Late-game pace comes from the top businesses' payback**, not from more milestones:
  upgrades cost ×1.1 per level while income grows linearly, so everything converges to
  the top businesses' payback. Pack 47 set olje → skisenter to pay back in ~30 000 s with
  upgrades at half the early ladder's share (`pakke35.test.ts` has a second rule for
  that), and compressed the top so skisenter unlocks at 750 mrd, before the finish line.
- **Measure each part of a pack alone** before tuning: switching one effect off at a
  time (Pack 48: volum off, stars off) showed that all the speed-up came from volum and
  that the bot never hired a star. Stars (4× price for 2.5× effect) only pay off when a
  business's ten slots are full — Folke kept it that way.
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
- **A growth rate on paper is not the simulation's** (Pack 81, as Pack 67): 0.16/h «gives 67 mrd at
  22 h» on paper, but the engine gave ~30 (the noise and the slow start pull down). Measure three seeds
  in the engine and pick the number that hits the promise (0.18), and say so in the report.
- **A system's «one right option» is measured as expected value per phase or per type, not overall**
  (Pack 83). Premium's «no bad days» is worth +15 % for the saftbod and +0.2 % for oil, so one flat
  number would have been right for some businesses and wrong for others; measure the calendar per type
  (`dagensFaktor` over 730 days) before choosing. Managers became a choice by giving each a phase and
  making a switch cheap (1 % of the city) — a pick-once choice is decided by the average alone.
- **Check an idea's premise on exact odds before building it** (Pack 85): «give opponents an attack
  and a defence so the tactic matters» would have changed the right tactic in 2–4 % of matches if the
  one number were just split, because the tactics multiply goals the same way whoever attacks. A
  30-line Poisson script showed it in a minute; independent attack and defence plus tactics that
  counter them gave ~26 %. Put such a finding in the question to Folke, with the alternatives' numbers.
- **Check a list item's «worth ~N points» with a small model** (Pack 103, startup research): uniform
  quality, the impression as quality ± noise in thirds, and Pack 83's measured return per true team gave
  +3.6 points at ±0.25 and +7.4 at ±0.5 — matching the review's claim — in a one-line `node -e`.

## 4. Saves and migrations

- **The save is written through `tilLagring`** (`state/lagringsformat.ts`): number
  histories with 7 significant digits, everything else exact. A new number history must
  be named `historikk`/`inntektHistorikk` (or `punkter`) to be rounded. Every list has a
  cap; the heaviest save levels off at ~178 kB after ~120 game days (`pakke52.test.ts`).
- **Time away (Pack 55)**: the store keeps `klokke`, the wall-clock time the in-memory
  game belongs to; saves stamp `sistAktiv` with it, not with "now". It stands still while
  the tab is hidden, so a later `pagehide` can't steal the hours; a migration on load
  writes the save *without* stamping, or every save-format bump erased the time away.
  Swaps (import, backup, start over) go through `byttSpill`, which bumps `spillnummer` so
  `App` doesn't celebrate the other game's history; `importer` refuses a second call
  while one runs. Tests that start the app must call `stoppSpillokke()` when done.
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
- **Old migration steps must not call engine functions whose input grows later.** The 17 → 18
  step valued the club with `klubbverdi`; once Pack 66 made it read `k.stadion`, every save
  from versions 13–17 failed to load (the stadium only arrives in step 22 → 23). Write the
  formula as it was in the step itself. `gamle-lagringer.test.ts` is what catches this.
- **A migration that needs dice uses its own**: Pack 66 drew the other divisions for old
  clubs with `new Terning(hashTekst(name + season))`, so the club's own `frø` — and its
  future matches — stayed exactly as they were.
- **A boolean that grows a third choice: read the old field through a function** (Pack 105, the
  silo). `lagre: boolean` became `lagring: 'selg' | 'lagre' | 'smart'`, and `lagringsvalg(j)` reads
  `lagring ?? (lagre ? 'smart' : 'selg')` — so «move the old default to the new setting» needed no
  migration and no save version. Grep every reader of the old field (`j.lagre` had three).
- **A value change on purpose moves the old-save test, which must say so** (Pack 106). Land following
  its region moved every old test save's net worth by the same 57 mill. `gamle-lagringer.test.ts` now
  adds `pakke106(s)` (land × (region factor − 1), with the timber, plus the animals' unpaid yield) to
  the old engine's figure and still checks to 2 kr — don't loosen the tolerance instead.
- **Testing a migration on a real save**: park the browser tab on `/ikon.svg` while changing
  the engine (stopping the server can wipe that port's storage), then load the game. The game
  always copies the pre-migration save to `milliardaer.lagring.formigrering` (since Pack 55;
  `.korrupt` is only for saves that failed to load). That's the safety
  copy, not a failure.

## 5. Speed

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
- **The copy shares the market's histories (after Pack 105).** Pack 104's eight stocks took a live
  second to 5.6 ms; the price, property-index and region histories were 2.2 of the copy's 5.4 ms.
  `kopierSpill` (simulering.ts) clones everything else and hands the new state the *same* history
  arrays, marked in a `WeakSet` (`delteLister.ts`); `medPunkt` copies a marked array once before
  adding a point, then pushes into its own copy. Copy 5.3 → 2.8 ms, live second ~3 ms (budget 6.5 →
  4.5). **Never `push` into a market history** — go through `medPunkt` and write the result back, or
  the previous state changes under the screen. The first version copied the array at *every* point
  (`[...liste, x]`): the live second was as fast, but two hours away got 15 ms slower (240 copies
  of 37 lists of 240) — compare away time as well, interleaved, before calling a speed-up done.
  `kopi.test.ts` checks that an old state stays byte-identical across day changes.
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

## 6. Testing the engine

- **A price on an existing payout moves every old test that wrote the formula out** (Pack 93: the
  crop prices). Packs 13, 57 and 92 each spelled out «land value × 8 % × weather»; each needed
  «× this week's grain price» (the first three fields are grain). Grep the tests for the constant
  (`HOST_ANDEL`) before running the suite.
- **Calendar days pile up in tests** (Pack 94): 1 May (shearing), 1 February and day 56 (= 1 March,
  slaughter) are also month changes, so the support came on top and three tests looked wrong. Before
  trusting a payout test on a special day, list what else happens that day. And a daily yield priced
  on the land value (+0.3 % a day) summed over 55 days is not 55 × the last day's — sum it day by day.
- **A test fixture bought one second into the week** made «a whole week» one second short and four
  tests disagree in the fourth decimal (Pack 92). Start fixtures on a day boundary when the rule
  counts seconds of the week.
- **A test that plays to just before an event must not predict the event from that
  moment** when one more round can change it: the top three after eight rounds weren't
  the top three after nine. Check the outcome afterwards (who is now in the division above).
- **A model with a level and a pull-back: say the measured swing, not the noise's.** Art's
  noise alone gives ±11 % around the value; exhibitions (upward jumps) make it ±16 % and
  keep prices ~9 % above the value on average. I told Folke ±11 % before measuring.
- **A percent bar on a moved price needs a tolerance**: `kurs *= 0.95` then `kurs / før − 1` gave
  0.0499999…, so «at least 5 %» failed depending on the price. `>= terskel − 1e-9`.
