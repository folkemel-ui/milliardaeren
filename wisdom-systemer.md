# wisdom-systemer.md — what each system needs

Split out of `wisdom.md` on 15 October 2026. One heading per system: read the one a pack touches,
after `wisdom-motor.md`. «A new X needs …» lists are here.

---

## Businesses

- **Adding a business type** needs: `BedriftstypeId` (types.ts), `BEDRIFTSTYPER` +
  `STIGEN` + `FORBEDRINGER` (innhold.ts), `FORMER` (fusjon.ts), a drawing with four growth
  stages and three improvement details plus entries in `ILLUSTRASJONER` and
  `BEDRIFTSTEGNINGER`. `pakke35.test.ts` checks the ladder rules: steps ≤ 16×, unlock at
  1.2–1.3 × price, first-upgrade share rising from 25 % (kiosk) to ≤ 80 %.
  **The full list, from the chip factory (Pack 117)** — `tsc` names the `Record`s, the tests the rest:
  `HJEMREGION` (filialer.ts), `TRENDTEKST` (verden.ts), `FORMER`, a stock (`PAPIRER` with `bransje`,
  `NYE_PAPIRER`, `PapirId`, `RAPPORTDAG` on a free day ≤ 24, a logo mark in `Papirlogo.tsx`, and a save
  version whose migration calls `leggTilNyePapirer`, as in Pack 104), an achievement with its `MERKER`
  row, and for the drawing `BEDRIFTER`, `NY_STIL`, `FULL_RAMME`, `BEDRIFTSTEGNINGER`, `NAERBILDER`,
  `TRINNUTSNITT` and the steps in `ved-behov/Trinnsteg.tsx`. Texts that count the ladder («tretten») and
  tests that count stocks (Pack 104: 20 → 21) or read the goal strip after the trillion (Pack 70: the
  new business became a goal at 2.25 bill) move with it.
- **Two income paths** (Pack 117): a factor on one business goes in `bedriftsfaktor` *and* in the
  per-second loop in `simulering.ts`, which repeats the product for speed (`filialfaktor(s, b) *
  synergifaktor(s, b)`). A factor on all of them (the headquarters) goes inside `statusfaktor`, which
  every income function multiplies by. `pakke117.test.ts` compares a simulated second with `bedriftInntektIDag`.
- **Staff live in `b.stab`** (Pack 48), with `ansatte` still the count. Old saves have no
  `stab`: `stab(b)` then makes everyone experienced with names from a hash, so no save
  version was needed. Never compute "one more hire" as `{ ...b, ansatte: b.ansatte + 1 }`
  — once `stab` exists that adds nobody. Use `medNyAnsatt(b, grad)`. With only
  experienced staff the formulas are bit-for-bit the old ones (zeros added last), which
  is why the golden master didn't move.

- **The aerospace factory (Pack 118) is not a business type.** It has no levels, so it lives outside
  `STIGEN` and `BedriftstypeId`: an optional `s.romfart` (no save version, like `s.racing`), its own die
  (`r.frø`), its launch in `gisUtAvis` next to racing (`romfartVedDagsskifte`, stories as `'deg'`), research
  that ends in its second (`romfartSekund`, behind a cheap `s.romfart?.forskning` check in `sekund`), its value
  in `eiendeler` and the Bedrifter group of `formuedeler`, its own goal in `alleMaal`, and three cards on
  Bedrifter (owned, for sale, locked) plus a page opened with `useTilbake`. Money was set like a business at
  its price (~30 000 s payback → ~180 mill/s at 5.4 bill) and *measured* over 2 000 simulated days before the
  constant was fixed: the board's contracts average below a full rocket, so the price per tonne went
  12.5 → 13.5 mrd to land on 178 mill/s. When no contract is chosen, the factory launches the best one it can
  lift — otherwise a player who is away would earn nothing from a once-a-day system.
  **The satellite network (Pack 119)** sits in the same object as optional fields (`satdeler`, `kull`, `nettPerSek`
  …), read through helpers with defaults (`satdeler(r)`), so a factory from Pack 118 needed no migration. The network
  pays every second like rent: its income is computed when the batches change (launch, take down, a batch running
  out at the day change) and stored in `nettPerSek`, so `romfartSekund` only adds a number — the per-second hook
  is now `if (s.romfart)`. Measured over 240 game days after a 120-day build-up (after tax): first parts,
  contracts only ~135 mill/s, satellites every 3–4 days ~375 mill/s (40–56 in orbit, 90–95 % coverage); fully
  researched ~2.35 → ~3.5 bill/s, and the 100-satellite licence is full with one launch a month.

## The market: stocks, funds, bonds, startups

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
- **Index funds keep their original members**; **every stock needs a `RAPPORTDAG` ≤ 26**.
- **A new stock needs (Pack 104)**: the `PapirId`, a `PAPIRER` entry (with `bransje` if it belongs to a
  business type — `AKSJE_FOR` then routes weekly trends and company news to it), a place in `NYE_PAPIRER`
  (ticks from a hash, so the die and old prices stay; leave it out of the index funds), a save-version step
  calling `leggTilNyePapirer`, a `RAPPORTDAG` on the 24th or earlier (a later day slides past a weekend
  into the next month, and two tests catch it), a logo in `Papirlogo.tsx` with a unique colour at ≥ 3:1 on
  #181613, #ffffff and #ebe4d4 (check in `node -e` before drawing), and a word mark from
  `scripts/lag-ordmerker.mjs` — which needs Google Fonts files that are not on this machine, so ask, or
  leave it to the graphics track (`ORDMERKER` is partial since Pack 104). A version bump also needs
  `vN.json.gz` for the old version: add it to `NESTE_BUMP` in `scripts/lag-gamle-lagringer.mjs` with the
  last commit at that version and run `node scripts/lag-gamle-lagringer.mjs N` (about a minute).
- **The borrowing limit and the margin call were one constant until Pack 81.** `MAKS_BELAANING`
  was both how far you can borrow and how far a margin call sells down; lowering it to 0.2 would
  have made every forced sale harsher. Now `MARGIN_MAAL` (0.5) is the sell-down target and the
  Bank page's warning colour. Old fixtures that «borrow the most» and then crash a market no longer
  reach 75 %: `laanUtenTak()` now borrows to 50 % by default. The bench has a second run (only with
  BENK) with a bot that borrows the most before every move (`laanMaks` in `bot.ts`): 1 mrd 4 h 32,
  1 000 mrd 29 h 57 at 0.2 (3 h 28 and 27 h 02 at 0.5).
- **A clamp around an estimate turns the signal against it** (Pack 101): the quarterly result was
  `clamp(expected ± 0.4, 0, 1)`, so a strong estimate (expected 0.83) could surprise up by 0.17 but down
  by 0.4 — «Sterkt» in green meant a worse day on average. Look for clamps before trusting a signal;
  the fix was a lean on an unclamped spread (`ESTIMAT_SKJEVHET`), measured over 40 years × 12 stocks.
- **New startup ideas need logos** (`STARTUPMERKER` in `StartupLogo.tsx`, the graphics track's file):
  `grafikkG4.test.ts` wants one per idea in a unique colour with contrast ≥ 3 on both dark (#181613)
  and white. Check colours with a scratch script first (relative luminance ~0.12–0.30 passes both).

## Rivals

- **Changing a rival without a save version (Pack 81).** A rival's `tak` and `vekst` are copied into
  the save, and a takeover shrinks `tak` (`fusjon.ts`). So the lift sits in code: `RIVALLOFT` gives
  Marit Aas her own growth and a cap ×20 of whatever her saved cap is, read through `rivalvekst(r)`.
  The golden master did not move: it records your state, and the simple bot never trades with her.
- **Tame a rival's luck without moving the die** (Pack 103): `rivaltikk` draws the same two numbers
  per tick whatever the swing, so a smaller swing for one rival (`RIVALLOFT[id].svingning`) changes her
  path but not anyone else's draws — the golden master stayed. Measure such a change with a plain-Node
  Monte Carlo of the formula (400 seeds, quantiles at 11.5, 22 and 34 h against the bench), then pin it
  with an engine test over 40 seeds.

## Avisa

- **Avisa takes five stories**: where a new kind of story goes in `gisUtAvis` decides
  what it pushes off the front page. The world's market stories sit after the rivals,
  because a merger test caught them pushing out the player's own merger. **It happened again
  in Pack 89**: I put the auction stories high so «Under hammeren» would be seen, and
  `pakke11`'s merger test failed the same way (its fixture has 1 mrd, so an auction opens at
  its first day change). Now your own purchase stands with the `deg` stories and the opening
  and the rival's purchase right after `omRivalene`; the toast and the event log carry the
  opening on a busy day. Any test fixture with a lot of cash now gets an auction on its
  first day change — remember it when a front-page test fails.
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
- **A floor tied to net worth silences late saves** (Pack 101, «your biggest post»): 0.1 % of kr 329
  bill is kr 329 mill, so `fulltSpill` with kr 100 mill in papers got no own stories at all — right by
  the rule, but useless as a measurement. Measure such a rule on a mid-game save (~1 mrd) as well.

## Property, cities and maps

- **Rent (Pack 54)** = price × index × yield × standard × city factor × season × weather
  ÷ 3600, where the city factor (`byfaktorLeie`) holds the whole-city bonus, vacancy and
  the manager's trait, and the weather factor comes from `dagsbilde(s).eiendom[id]`. Tests
  of base rent mechanics mock vacancy with `__tester__/utenUtleie.ts` (like
  `utenKalender`). The bot owns no property, so the golden master and the bench can't
  see any of this — `pakke54.test.ts` and reasoning are the guard.
- **Foreign property is in its own currency** (Pack 59, `valuta.ts`): `eiendomskurs`
  multiplies foreign cities by `valutafaktor`, so price, value, rent and renovation all
  follow. Rates are smooth hash waves, the same in every game, anchored per save.
- **A new foreign city** needs: the `Utenlandsby` and `EiendomId` types, an
  `EIENDOMSTYPER` entry in price order with a yield between its neighbours
  (`pakke11`'s ladder test), `VALUTA_FOR`, a `BYPLASS` entry whose label doesn't hit its
  neighbours (`'over'` exists since Pack 59; check with the overlay clone), a *unique*
  drawing in `ILLUSTRASJONER` and `NY_STIL` (`grafikkG5.test.ts` rejects shared drawings),
  and the foreign-city count in `pakke11.test.ts` (Verdensborger needs them all).
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
- **Map geometry** lives in `ui/norgeskartet.ts`; a test checks label overlaps.
- Shared cards (`Eiendomskort`, `Jordkort`, `Landemerkekort`) are used in the lists, the
  street view and the city view — change the card once.

## The farms and forests

- **One weather**: Norway's daily weather (`vaerPaaDag(dag)`) keeps Pack 49's hash key,
  so adding places (`'alpene'`, `'syden'`) changed nothing at home. The farms' weekly
  harvest (`jord.vaer`) is now the mean of that week's seven days, amplified ×3.
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
- **An upgrade against a smoothed effect must keep the smoothing's average** (Pack 93). Weather
  effects are divided by the season's average (`jevnetVaer`), so each season gives ×1. Feeding
  drainage in as a better rain value would have raised that average too and taken most of the
  gain back. `ukefaktor` multiplies the day's smoothed value by new/old for that weather instead,
  and returns `vaer(dag).faktor` untouched without the upgrades. Measure such an upgrade over two
  years of the game's weather (104 weeks) before offering its number.
- **«Best to fell» is the best average, not the fastest growth** (Pack 106). Timber grows fastest at
  day 18 (the peak of f′), but a whole rotation gives most per day where f(d)/d peaks: day 36, and
  28–46 is within 2 %. A test comparing growth on two days must stand well apart from the peak: land
  rises 0.3 % a day, more than f′ changes between day 15 and 21.
- **«Silo full» is said once per overflow** (Pack 112): `jordVedDagsskifte` collects what was sold because a
  store had no room (more than 0.1 % of a group's harvest), writes one log line when `j.lagerFullt` isn't set,
  sets it, and deletes it on a Monday with no overflow — so the next filling is announced again. `jord.ts`
  pushes to `s.hendelser` itself with `MAKS_HENDELSER` from `innhold.ts`, as `racing.ts` does (bank.ts can't be
  imported there). A new log title needs a line in `HENDELSE_FANE` in `App.tsx`, or its notice opens the log
  instead of the tab. Building anything on a farm (`bokforOpptjent`) moves the week's start to now, so a
  test that builds and then expects Monday's harvest must set `plantetSek` back a week.
- **«So far this week» and the countdown** (Pack 112): `hostSaLangt` is `gardHost` from the week's start to
  `s.sek` plus `opptjent`; `tidTilHost` is the seconds to the next multiple of seven days, the week `ukensGardHost`
  already uses. A game week is 35 real minutes, so `varighet` reads «om 24 min».
- **The week's weather is fixed from Monday** (Pack 113): `vaer(dag)` hashes all seven days at once and the harvest
  uses the whole week's factor from the first second. The day chips show only the days that have passed and
  `ukefaktorSaLangt` averages those, but the «Ukas vær» fact and the «Jord og skog» line still name the week from
  Monday, as they did before — the week was never a full surprise. Weeks are blocks of seven game days starting on
  a Monday (`ukeFor`), the same blocks `ukensGardHost` and `tidTilHost` use.
- **The farm in the paper** (Pack 113): `jordVedDagsskifte` pays every Monday but returns a story only when the
  harvested week is the best or worst of the last eight (`ukeAvAtte`, ~11 % each over 520 weeks; weeks before day 0
  are skipped). The game's own extremes (Rekorduke ≥ ×1.35, Elendig < ×0.65) are 38 % of weeks — far from rare.
  The quiet weeks show in the Sunday paper: `ukaDi` sums each farm's `regnskap` row (host + korn) for the weeks
  harvested inside the settlement (`o.gardene`). Fewer stories don't move Avisa's die: every story source is still
  called; only the slice to `MAKS_SAKER` changes.
- **The farm's base vs. its value** (Pack 114): the harvest, the next field, the machines, the buildings and
  the greenhouse are counted on `gardsgrunnlag` (own land × 3^neighbours); the farm's value, the sale, the
  animals and the subsidy still use `landverdi`. A neighbour's price goes into `investert` like a field, so
  net worth doesn't drop on purchase and the sale takes it along — tripling `landverdi` itself would have
  added two land values of net worth for free. Payback is scale-free (price and harvest both follow the land),
  so a neighbour at 15 × land pays back in ~7.6 h at any point in the game.
- **Machine steps without a save version** (Pack 114): `maskintrinn(j, m)` reads `j.maskintrinn ?? (maskiner ? 1 : 0)`,
  the Pack 105 silo trick again, so old saves need no migration; `kjopMaskin` writes both fields. The plan said
  «the save version bumps once» — check before building one (as in Pack 109). The sprayer's damping is per step
  (`SPROYTE_DEMPING` 30/45/60 %), so `snittvaer` takes a number, not a boolean.
- **Odel needs a start day the old saves don't have** (Pack 114): `kjopJord` stamps `eidFra`; `odelVedDagsskifte`
  runs every day change (not only Mondays, unlike the harvest) and gives an old farm `eidFra` the first time it sees
  it, so old farms count from the update — said in the question, and shown as «Odel: Om N dager» on the farm page.
- **Power from the land (Pack 115) is paid like rent**: `betalKraft` runs in the rent block of `sekund`
  (per second, away time in one go), so there is no payday to buy just before — the leak the farm rules warn
  about. Each plant's income is its price today (`kraftpris`, on `utbyggingsgrunnlag`, so neighbours and land
  growth carry it) over 10 hours, times the week's factor: the week's smoothed weather with the plant's own table,
  amplified ×3 and clamped like the harvest, divided by its two-year mean (`kraftsnitt`) so it averages exactly
  ×1. A daily ×3 with a clamp halved the swing (wind ×1,27 instead of ×1,40 in Elendig weeks) — weekly matched
  what the question promised. Payouts go to `totaltHost`/`totaltLeie` and onto the plant (`j.kraftverk[v]`).
- **The sun moves with the harvest, not against it** (correlation +0,92 over 520 weeks): the item said all three
  plants would take the edge off a bad week, but only wind (−0,77) and water (−0,43) do. Measured before the
  question, said in it, and the panels' text says so.
- **A harvest test computed before Monday is ~2 % short** (Pack 105): `gardHostDeler` uses the land
  value of `s.sek`, which rises 0.3 % a day, and `jordVedDagsskifte` runs on Monday. Set `s.sek` to
  the Monday first (`avlingFor` in `pakke105.test.ts`), then compare.

- **A forest is stands (Pack 120).** `j.bestand` is an optional list of planting times, read through `bestand(j)`,
  which gives three stands planted at `plantetSek` when it is missing — so a forest from before keeps its timber
  and net worth to the krone and no migration was needed. Each of the first three stands is a third of the land
  (`landverdi / START_BESTAND`); a bought 4th and 5th add a third each, counted at their price in `j.investert`
  like the farm's fields, while their timber follows the rising land value. `skogalder` is now the *oldest*
  stand (what the cards and the Pack 106 old-save adjustment read), `tommerverdi` and `tommervekst` sum the
  stands, and `hoggSkog` still fells them all (old tests and a «fell everything» button), `hoggBestand` one.
  Every felling goes to `j.hogster` (last eight) and `j.tommerTotalt`.

## Luxury, Samling, homes and art

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
- **Round prices a player reads as a bid** (Pack 89): `rundBud` keeps three significant digits
  (kr 66,4 mill, not kr 66 393 633), and a test can then compare the price exactly.
- **A fourth room step** meant the room code (`ui/romkode.ts`) needed 3 bits per room instead of 2
  (`romkode(3,3,3)` was 63, now 219); the saves store step counts, not codes, so nothing migrates.
  A drawing that picks a colour by step from a list (`[...][n]` in the wine cellar) must clamp `n`,
  and `n === 3` checks become `n >= 3`.
- **A new painting must not draw from the art die** (Pack 107). `kunstVedDagsskifte` draws two numbers
  per painting in `MALERILISTE` order; the three late works draw their noise from
  `hashNormal(hashTekst('maleri:id:dag'))` (`SENE_MALERIER`), so the nine old paintings get exactly the
  same prices with or without them (`pakke107.test.ts` runs 300 days both ways). Old saves lack the new
  ids in `kurser`: `k.kurser[id] ??= startpris` at the next day change. A test fixture without `sek`
  gives `dagnummer` NaN — give art fixtures a clock.
- **A shuffle that keeps the first period as it was** (Pack 107, the art trends): `trendrekkefolge(0)` is
  the old fixed order, so for the first 120 days `kunstnertrend` returns `KUNSTNERE[k].trend` bit for bit,
  and a period's order comes from a hash per period (Fisher–Yates with `tilfeldig(hashTekst(…))`).
- **A new thing the gallery tests count needs a picture of its own.** `grafikkG6` wants one unique
  painting per `MaleriId` with the artist's frame colour, so «use the nearest painting» was not possible;
  the game track drew three simple first versions in `Malerier.tsx` and left finishing them to G24.
  Likewise an «X's priciest work» test (G11's Avisa picture) moves when a dearer work arrives.

## The club

- **Harder Europe without touching the die** (Pack 108): `nyEuropa(k, sesong, titler)` draws the seven
  clubs and their strengths exactly as before and adds `EUROPA_TITTELLOFT` (2) per Europe title in
  `s.trofeer` afterwards, capped at `EUROPA_TAK` (99) — same names, same order, same `frø`. The cap
  matters: a club with 10 titles would otherwise meet 98–112.
- **A trophy can carry its own status** (Pack 108): `Trofe.status` is optional, and `klubbstatus` reads
  `t.status ?? (Europe ? 5 : 3)`. New Super Cups get 1; the ones already won have no field and stay
  at 3, so nobody drops a status level and no save version was needed. Use the same pattern for any
  later change to what a trophy is worth.
- **«What does this upgrade give right now?» can be zero** (Pack 108, floodlights): +20 % crowd means
  nothing when `tilskuere` is already capped by the seats — at the top, demand reaches 42 000 against
  25 000 seats. The row now compares `tilskuere` with and without (`flomlyseffekt` in `Klubb.tsx`),
  says when the stadium is already full, and adds when the division above still requires them.

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
- **New matches get a die of their own** (Pack 87): the playoffs (`${navn}:${sesong}:kvalik`) and the
  Super Cup (`…:supercup`) draw from hashes, so adding them moved none of the club's existing dice — the
  other divisions' strength-and-luck ranking still draws from the club's die in the same order as before.
  Do the same for any new match or tournament. A playoff place is «the next two eligible», not a fixed
  table position: a club whose stadium is too small for the division above is skipped, so the table's
  gold rows must ask the same question the engine does (`oppfyllerKrav`), or they disagree.
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
- **A match is decided at the day change, so its day is `dagnummer(s.sek) − 1`** in the engine, while
  the screen («Neste kamp») shows `dagnummer(s.sek)` — the same day. Anything tied to the match day
  (weather, wind) must use those two, or the card and the result disagree.
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
- **A player's own cost price (Pack 79).** Selling a player used to lower the club's cost price by the
  whole sale, so the gain waited for the club sale, which most players never make. Now a player bought
  gets `kostpris` (the price paid) and an academy junior 0, and `utforSpillersalg` in `handel.ts` books
  sale − cost; a player without it (older saves, the squad that came with the club) is sold as before.
  An optional field with the old behaviour as the fallback needs no save version and taxes nothing
  backwards. Club trades were never in `flyt` (that is for the investment classes), so the weekly
  report needed nothing.
- **A fresh 4. divisjon club loses its first cup round every time** (five seeds of five):
  a test that needs the cup running sets the squad to `styrke = angrep = forsvar = 95`
  before simulating day 1.

## Racing

- **The live race (Pack 110) copies the club's live match**: the race is still decided at the day
  change; `ui/racinglive.ts` plays it over the next game day (50 laps, one every 6 s) from the whole
  field stored on the race (`Racinglop.felt`, kept on the last two races only), and everything shown
  beyond the result — the laps, the pit stops, the gaps, the fastest lap, the causes — comes from hashes
  of the race. `visRacing(s, r)` gives the page the team as it was before the race (points subtracted
  from `felt`, «Siste løp» the race before; after a season's last race the old table from
  `r.sisteTabell`), and Avisa's stories and the log line wait in `r.ventendeSaker`/`ventendeHendelser`
  until the next day change. Tests that read a race story or log line right after
  `racingVedDagsskifte` need one more day change (three old tests did).
- **Noise that moves every frame looks wrong** (Pack 110): a fresh hash per lap swapped the lead three
  times in three laps. Interpolating between a hash every fifth lap made places change one at a time.
  Anything animated from hashes should glide between keyframes.
- **`<br />` between two `display: block` children adds an empty line** in a table cell: the report's
  rows were 67 px instead of 49 until the `<br />` went.

- **The race model since Pack 109**: a car's pace in a condition is `bilfartI(r, 'kval' | 'tort' | 'regn')`,
  the steps weighted by `DELVEKT`. Every row sums to 4, so a car with even steps is equally fast
  everywhere and exactly as fast as `bilfart` — that is what kept old teams where they were. Rivals have
  no parts, only a car number (`rivaltrinn` splits it evenly for the bars). Qualifying, the weather
  (`regnILop`) and a driver's wet skill (`vaatferdighet`) come from hashes, so the team's die still
  draws three numbers per car (normal = 2, crash = 1; ten teams = 20 cars) — `pakke109.test.ts` checks the
  count. Anything new in a race (a pit stop, a lap time) should come from a hash too, or every later race
  of every old save changes.
- **Recalibrate the luck when you add a term** (Pack 109): the grid bonus made the fast cars faster, so
  the race's σ went 5 → 4.6. A scratch script that plays 300 seasons per car level with the old and new
  model side by side (scratchpad `p109/maal.ts`) showed every level within ±0.2 places and the title rate
  unchanged; Pack 90's `snittplass` assertions passed untouched. Pole then wins ~41 % (46 % at Monaco).
- **A save version was not needed after all** (Pack 109): the plan said «the save version bumps once»,
  but the new race fields (`regn`, `start`, `pole`) are optional on each race, and the weather and wet
  skills are hashes. Check that before building a migration the plan assumed.

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
- **The team off the track (Pack 111) is all hashes**: a junior (`racing:junior:<team>:<season>`), a
  driver's growth (`racing:vekst:<name>:<id>:<season>`), a market driver's age and ceiling and the
  sponsor's name come from hashes, so the team's die draws the same numbers and old saves' races don't move.
  `pakke111.test.ts` checks that facilities and the academy give no pace (same places with and without).
  Drivers from before have no `alder`/`potensial`; `medAlder` gives them both from the name at the next
  season's end — no migration and no save version. Every new team field is optional for the same reason.
- **Racing money in one line**: sponsor money goes through `racingpenger` like the prizes (`totaltKlubb`
  and `totaltRacing`), so Pack 90's test comparing `totaltKlubb` with `premier − lonn` needed
  `sponsorpenger` added. A junior sale is a gain (`bokforGevinst`, cost 0) like a club junior, not racing
  income, so `utforJuniorsalg` lives in `handel.ts` (racing can't import it: handel → racing). Facilities
  and the academy go into `investert`, so they count in the team's value and in the 85 % sale.
- **What a season earns, measured over 300 seasons per car level (Pack 111, scratchpad `p111/maal.ts`)**:
  before sponsors every level below the top lost 7–17 mill a season (wages outran prizes); all parts at 5
  made +6 mill with two 95-skill drivers and +65 mill with 90s (they still win 88 % of titles). The
  results deal (50/36/26/20/15/11/8/5/3/2 mill by place) puts a 4th-place team at about +4, 2nd–3rd at
  +13 and a dominant one at +56. Re-run it before changing prizes, wages or the sponsor table.
- **Three buttons in a `personale-rad` squeeze the text** to one word a line at 375 px (the junior row:
  Sete 1, Sete 2, Selg). Put the buttons on their own row under the text (`.racing-junior`).
- **`racing.ts` cannot import `bank.ts`**: bank → eiendom → racing makes a ring, so racing trims the
  event log itself with `MAKS_HENDELSER` from `innhold.ts` (which imports only types). Before Pack 98
  racing pushed to `s.hendelser` with no trim at all; grep `hendelser.push` when adding a system.

## Status, achievements and goals

- **Hidden achievements (Pack 70)**: `skjult: true` on a `Prestasjon`; `synligePrestasjoner(s)`
  gives the list the Profile shows (open ones plus hidden ones earned), with a line counting the
  hidden ones still waiting; the toast says «Skjult prestasjon». The *count* is another thing: since
  Pack 116 every screen (the strip, the Profil goal, the Prestasjoner card) reads `prestasjonstall(s)`
  in `ui/progresjon.ts` — all of them, hidden too — so the total never jumps when one is found. A hidden one should depend on
  what the player does, not on the clock — a game day is 300 s, so «at night» happens every five
  minutes. «Kontrær» is stamped in `kjopPapir` (`kontraerKjop`, optional field, no version
  bump) when the price is ≤ 80 % of the two-hour high; `fulltSpill()` earns it at once, since
  it buys 1 000 of every paper, so test it on a fresh game.
- **The goal strip after the last amount (Pack 70)**: `nesteMaal` falls back to the
  achievements left (`art: 'prestasjon'`, `visning` «37 / 53» in place of the amount) and is
  null only when every achievement is earned. The late goals in `alleMaal` (landmarks, the
  long-range jet, New York) use base prices; the strip is static per game.
- **A new achievement needs a medal** in `ui/merker.ts` (`ikoner.test.ts` checks).
  Achievements are checked every second: return early when the player can't have it yet.
- **Net worth by kind (Pack 62)**: `ui/formuedeler.ts` on Profil → Meg. A new kind of
  thing you own needs a row there (and in `eiendeler`), or the rows stop summing to net
  worth — `pakke62.test.ts` checks the sum on `fulltSpill`. The Investments overview
  leaves property out on purpose.
