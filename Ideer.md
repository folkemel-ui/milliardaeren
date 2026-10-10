# Ideer

The idea list for a business-empire game inspired by *Business Empire: RichMan*. Nothing is set in stone. We build in packs of 3–4 items at a time. When an item is done it is removed from this list and the list is renumbered; the git log holds the history. Refer to items by title, not number.

Stack: React + Vite + TypeScript, pure seeded engine (no `Math.random`/`Date.now` in the engine), Norwegian UI, NOK, no new dependencies.

## Pack plan

A suggested order, grouped so each pack feels complete when played. The order is a suggestion; packs can be swapped or reshuffled at any time. Items are referred to by title.

Version 1.0 was reached with Pack 43.

Order across the tracks: Pack 63 gave each track its own folder and branch and split the stylesheet by owner, so the two tracks run side by side. G12 put the property and luxury drawings, the maps and the gallery outside the start-up script, so new drawings land in pieces that load when shown.

**Next up on the game track: a new list.** Pack 66 built the last picked game items, so there is no game pack left to start. The next game pack begins the way Packs 55 and 61 did: a numbered list for Folke to pick from, with real numbers from the engine, then packs. Two things are already waiting and could go on that list if Folke wants them: the slower tick (rent, net worth and achievements less often than every second — the big speed lever Pack 64 left undecided; the heaviest save uses ~370 of its 400 ms) and the hiring fee, which still counts as private spending and isn't tax-deductible. The stadium drawing can now show what the club has built (see *Drawings for the v2.0 content*).

**Next up on the graphics track: Pack G14 – A full frame: the town businesses.** The second group of *Drawings that fill their frame*; the frame itself came with G13 (a scene 176 × 96 that fills its box, a tile with a close-up out to its corners, no vignette), so this pack is drawing. Kafé, Restaurant, Hotell and Bank go into `FULL_RAMME` and get 40 units of their place on each side, at every growth stage with no and all improvements, by day and by night: the café and the bistro in a row of town houses (the neighbours' ground floors, the street in front), the bank on its square with steps and side wings, and the grand hotel — the only one at far distance — with the town around it. Each gets a close-up per stage for the tile (`TRINNUTSNITT`), since the four grow most between level 1 and 25. Questions at the start: what the neighbours to the café and the bistro are (shops, a bakery, a bar), and whether the hotel stands on a square or by the water.

The work runs in **two tracks, each in its own session**. They are built side by side in the same repo, so they must not step on each other (see *Working side by side* below).

### Game track

No pack planned. Commits: `Pakke N: …`. Packs 55–58 fixed the bugs from the code review on 8 October, Pack 59 brought franchises and more countries, and Pack 60 the homes and the Sunday paper's «Uka di» — every picked v10.0 game item is done. Pack 61 made back go back, gave every set of parts the same memory and put the event log behind a bell in the top bar. Pack 62 split Luksus into Samling · Hjem · Kunst · Klubb and showed the whole net worth, split by kind, on Profil → Meg. Pack 63 gave each track its own folder and branch, split the stylesheet by owner and made the test suite run clean. Pack 64 measured the per-second work: two screens redrew every drawing each second (Selskaper 161 ms, Samling 72 ms in development) because of a new array prop — fixed — and the speed test now has a budget per system. Pack 65 made the Norge/Verden switch filter the property list, put the index funds in Børs, let the businesses be sorted by steady income, and split `Investeringer.tsx` and `handlinger.ts` by area. Pack 66 gave the club a stadium to build (seats, floodlights, a VIP lounge), a stadium requirement for promotion and a league of 50 fixed teams, and wrote down where new areas go (five tabs, at most four parts, then a detail page — in `ui/deler.ts`). The navigation packs belong here because they change the screens' logic (App, the tab parts).

### Graphics track (Packs G14–G22)

Items from *Graphics*. Commits: `Grafikkpakke GN: …`. G1–G13 are done (the foundation, the businesses, the maps, faces and names, things you own, stadium and gallery, the finish, lighter and quicker, the last drawings, a living scene, moments and pictures, a lighter start, a full frame for the street businesses); every drawing is now in the style G1 set, and moves and follows the clock on the big scene. Since G12 the start-up script holds only what the first screen needs (238 kB gzipped, down from 300); the rest loads when shown, or quietly just after start.

*Drawings that fill their frame* covers all 71 drawings, so it runs over eight packs, one group of four or five businesses or nine to thirteen other drawings at a time; the item stays in the list until the last group is done. The businesses come first, since they are what the game opens on; *Scenes that grow* follows them, so the new steps are drawn in the full frame and the homes are wide from the start.

- **Pack G14 – A full frame: the town businesses:** Drawings that fill their frame, with Kafé, Restaurant, Hotell and Bank.
- **Pack G15 – A full frame: the big businesses:** Drawings that fill their frame, with Oljeselskap, Rederi, Fiskeoppdrett, Flyselskap and Skisenter.
- **Pack G16 – Scenes that grow:** Upgrades you can see, Scenes for the homes. The steps are drawn in the full frame from G13–G15; the homes' scenes and detail page go in the *Hjem* part of Luksus (Pack 62).
- **Pack G17 – A full frame: homes and cabins:** Drawings that fill their frame, with the eleven Norwegian homes: the hybler at Møhlenpris, Moholt and Blindern, the flats on Grünerløkka, Nordnes and Bakklandet, the terraced houses at Madla and Fana, the cabins at Geilo and Trysilfjellet and the rorbu in Reine.
- **Pack G18 – A full frame: buildings, land and landmarks:** Drawings that fill their frame, with the office buildings in Bjørvika and at Forus, the shopping centre in Trondheim, Aker Brygge, the private island in Lofoten, the farms on Hedmarken and Lista, the forests in Trysil and Namdalen, Ytterskjær lighthouse, Kollen hoppbakke, Steinvik borg and Oslotårnet (13).
- **Pack G19 – A full frame: abroad:** Drawings that fill their frame, with Östermalm, Nyhavn, Jordaan, Mitte, Mayfair, Trastevere, Le Marais, Palm Jumeirah, Manhattan, and the flat and the beach hotel in Marbella and the ski flat and the alpine hotel in Zermatt (13).
- **Pack G20 – A full frame: cars and watches:** Drawings that fill their frame, with the seven cars (stasjonsvogn, elbil, superbil, hyperbil, veteranbil, limousin, Formel 1-bil) and the five watches (dykkerklokke, gullklokke, mesterverk, lommeur, diamantklokke) — the two kinds shown indoors (12).
- **Pack G21 – A full frame: boats and planes:** Drawings that fill their frame, with the five boats (snekke, motorbåt, seilbåt, havseiler, superyacht) and the four aircraft (helikopter, propellfly, forretningsjet, langdistansejet) (9). The last group, so the item goes when it is done.
- **Pack G22 – The living year:** Seasons in the drawings. Last, so every drawing gets its seasons in the full frame, the new upgrade steps and the home scenes too.

*Drawings for the v2.0 content* is not a pack: it runs alongside the game packs, as each one lands — Pack 59 drew Amsterdam, Roma and Paris itself (a rough Vespa in Roma could use a finer hand); the homes from Pack 60 are an item of their own (*Scenes for the homes*).

### Working side by side

- **Two folders, two branches** (Pack 63). The game track works in `Desktop\New folder (3)` on branch `spill`; the graphics track in `Desktop\milliardaer-grafikk` on branch `grafikk` — a git worktree of the same repo, with its own `node_modules`. Start each session in its own folder. Master is checked out nowhere: it is what is on GitHub.
- **Delivering a pack:** commit on your branch, then `node scripts/lever.mjs`. It fetches, rebases your branch onto `origin/master`, type-checks and runs every test on the result, and lists exactly what would go to master. When Folke says push: `node scripts/lever.mjs --push` (it refuses anything that wasn't tested as it stands). If the other track pushed in between, GitHub refuses the push — run the script again. Changes to `.md` files only skip the tests.
- **The stylesheet is one file per area** in `src/styles/`, imported in order by `index.css` (a later file wins over an equally specific rule in an earlier one, so `bred.css` comes last). Each file names its owner in its header: the graphics track owns `tegninger.css`, `kart.css` and `oppgjor.css`; the game track the rest. Tests read them all through `alleStiler()` in `src/ui/__tester__/stiler.ts`.
- **Who owns what.** The graphics track owns the drawings and how they render: `Illustrasjoner.tsx`, `Tegnestil.tsx`, `BedriftIkon.tsx`, `Rivalportrett.tsx`, `Stadion.tsx`, `Klubbvaapen.tsx`, `Papirlogo.tsx`, `StartupLogo.tsx`, the paintings in `Malerier.tsx` (and the gallery wall in `Kunst.tsx`), `Norgeskart.tsx` and `Verdenskart.tsx` (thin wrappers since G12), the pieces that load when needed in `komponenter/ved-behov/` and their loader `ui/vedBehov.ts`, `Kartmerke.tsx`, `Gatebilde.tsx`, the map geometry in `ui/norgeskartet.ts` and `ui/verdenskartet.ts`, the map data in `ui/kartdata.ts` (generated by `scripts/lag-kartdata.mjs`), the wordmarks in `ui/ordmerker.ts` (generated by `scripts/lag-ordmerker.mjs`), `Oppgjor.tsx`, the detail pages for things you own (`screens/Tingdetalj.tsx`, `ui/detaljvisning.ts`), the logo files (`Logo.tsx`, `public/ikon.svg`, `index.html`, `scripts/lag-ikoner.mjs`) and `Galleri.tsx`. The game track owns `src/engine`, `src/state` and the screens' logic. The screens and `Ideer.md` are shared: change only what your pack needs.
- **Commit only your own work.** Each track has its own folder now, so the other track's half-done work can't end up in your commit; still `git add <paths>` rather than `-A`, so nothing stray (test saves, scratch files) slips in.
- **The graphics track never changes the engine's behaviour.** No dice, no balance, no save version — the golden master and the bench stay unchanged by every G pack.
- **New content in the game track gets a drawing in the current style.** G1 has landed: new drawings follow the rules in the header of `Illustrasjoner.tsx` and are built with `Tegnestil.tsx`. If that is too much for the pack, leave the drawing to the graphics track and say so in the commit message. Since G12 a new property drawing goes in `ved-behov/Eiendomstegninger.tsx` and a new luxury drawing in `ved-behov/Luksustegninger.tsx`, with its id in `EIENDOMSIDER` or `LUKSUSIDER` in `Illustrasjoner.tsx`; a test that renders one must `await lastAlle()` (from `ui/vedBehov.ts`) first, and `startskript.test.ts` keeps the start-up script under 250 kB gzipped.
- **`Ideer.md`:** each track removes only its own finished items and pack line, by title. Pack numbers don't depend on item numbers, so renumbering is harmless.
- **Releases:** the game goes to the App Store at v10.0. Folke decides the version numbers on the way; the graphics track can ship with any game pack or after it.

## Graphics

Loose ends after G1–G7, and what was picked for v10.0.

1. **Drawings for the v2.0 content.** New businesses, cities or things to own from Packs 47–51 need drawings, detail pages and map labels in the current style, as each pack lands. Pack 66's stadium: `Stadion.tsx` still draws by division only; the club now has `k.stadion` (`trinn` 0–4 from 700 to 25 000 seats, `flomlys`, `vip`), which `Klubb.tsx` can pass once the drawing takes it.
2. **Seasons in the drawings.** Snow on roofs and ground in winter, green summers and autumn colours, following the date and Pack 49's weather. Builds on G10's night scenes (the clock and the night layer in `Tegnestil.tsx`). Picked from the v10.0 list.
3. **Upgrades you can see.** A business drawing changes only at the four growth stages (level 1, 25, 50 and 100) and with its three improvements; the levels in between look the same. Show the steps: more customers, a longer queue, extra tables, a bigger sign — so every few levels can be seen in the detail scene. Picked from the v10.0 list.
4. **Scenes for the homes.** Pack 60 brought three homes to furnish (Hjemmet in Oslo, Hytta at Geilo, Feriehuset in Marbella), three rooms each in three levels, shown as a list with level dots on the Luksus tab. Give each home a scene in the G1 style where the furnished rooms show as they are bought (kitchen, living room with the art wall, wine cellar; fireplace lounge, sauna, hot tub; terrace, pool, guest wing), and a detail page. Picked with Pack 60 (9 October 2026).
5. **Drawings that fill their frame.** Today every drawing is a square that fades out at its edges: the sky fades toward the corners and the ground toward the sides, and the frame around it adds a round glow. On a detail page the drawing is 172 × 172 px in the middle of a box that is 172 px tall and as wide as the card, so the sides of the box stand empty. On the cards the drawing is 44 px in a 52 px tile and fades out before the tile's edge (the Saftbod and Pølsebod close-ups through a round mask). Remove the vignette and let the subject fill the whole frame, edge to edge: the scene as wide as its box (wider sky, street, ground and background on each side, not a stretched drawing) and the card tile as a close-up out to its corners. For all 71 drawings — the 13 businesses, the 37 properties and the 21 cars, watches, boats and planes — on the detail pages and in the lists. Asked for on 10 October 2026 (with screenshots of the Saftbod). G13 built the frame (an 11:6 scene, as wide as the card up to 560 px; `FULL_RAMME` switches a drawing over) and did Saftbod, Pølsebod, Gatekjøkken and Kiosk; 67 drawings are left, in G14–G21.

## Parked (not chosen yet)

These ideas were suggested but not picked. They stay here so they can be moved up later. They are not part of any pack until they are chosen.

**Game ideas**
- **Take your group public.** List your own group on the exchange with its own ticker: sell shares to raise money, the price follows your quarterly results, and the shareholders can be unhappy.
- **A finish line.** Reaching #1 on the Forbes list or kr 1 trillion gives a proper ending: a closing screen and a front page in the paper. Then choose to keep playing or start over.
- **Start-over bonus.** Sell everything for "legacy points" that give a permanent bonus in the next game.
- **A real-phone check and an outside playtest.** Pack 47 measured two hours away on this PC (a fresh game ~95 ms, a late game that owns everything ~300 ms, built like the real game) and estimates a slow phone at 4–5× that. Check it on a real slow phone, and let someone outside play before 2.0 is called done.
- **Random events with choices.** Crashes, booms, strikes, scandals and inspections, each with two or three ways to respond. Drawn from a hash, not the die.
- **Rivals that fight back.** Today the rivals grow and can be taken over, but never come after you. Let them bid against you for landmarks, try a hostile takeover of one of your businesses, or poach your staff.
- **Daily and weekly missions.** Short goals with small rewards, so a five-minute visit has a point too.
- **Temporary boosts.** Marketing campaigns for ×2 income for a limited time, followed by a cooldown.
- **Offline income report.** A "while you were away" screen with a Claim button and an hour cap that managers can raise.
- **Auction house.** Rare cars and art sold at auctions with rising bids.
- **Sound.** Synthesized coin and level-up sounds using Web Audio.
- **Other sports clubs.** Hockey and basketball, in addition to football.

**Expansions of what exists**
- **Opening hours and rush hours.** The kiosk earns most in the evening, the café in the morning and the restaurant at dinner, using the game clock.
- **Managers with traits.** Careful (safe offline income), Aggressive (more income, risk of mistakes) or Night owl (longer offline cap).
- **Business history.** A graph per business of income over time, when it was started and total earned.
- **Selling businesses.** Sell to a buyer at a price based on income, with bids that vary.
- **Limit orders.** "Buy NLT if the price falls to 450"; a first step toward auto-trading.
- **Watchlist.** Star the stocks and coins you follow so they show at the top.
- **Crypto events.** Listing on a big exchange, hacked exchange, and "rug pull" for the smallest coins.
- **Short selling.** Bet against a stock; risky and requires a loan.
- **Credit rating.** AAA to C based on how you handle debt; affects interest and credit limit.
- **Mortgages.** Borrow against specific properties at a better rate.
- **Building your own.** Buy a plot and build over several in-game days: cheaper, but ties up money.
- **Holiday home effect.** The cabin and island give status, and weekend rental income.
- **Car value that changes.** Classic cars rise in value, new cars lose value.
- **Using your items.** A boat trip on Sunday for status that day, a jet to "a meeting".
- **Collection bonuses.** All the cars gives "Car collector", all the watches "Watch nerd", and so on.
- **Events you can attend.** Charity gala, yacht race, opera premiere: cost money, give status, appear in the paper.
- **Paper ads.** Offers in the paper, for example "Cabin for sale at 20 % discount, today only".
- **Rewards for achievements.** Small permanent bonuses or cash rewards.
- **Hidden achievements.** "Bought at the bottom", "Night owl" and so on.
- **Titles for your largest business.** "Lemonade king", "Sausage baron" and so on, shown on Profile.

**Map ideas**
- **Businesses on the map.** Your kiosks, cafés and so on appear as small icons in the cities, so the map shows your whole empire.
- **Rivals on the map.** Each rival has a color; cities where they own landmarks or businesses are marked.
- **Deals on the map.** Markers pop up now and then, like "Plot for sale in Trysil, 20 % off today", and disappear after a while.
- **Local events.** "Festival in Bergen this week, +30 % rent", shown as a flag on the city and mentioned in the paper.
- **Fog over what's locked.** Cities you can't buy in yet are hidden in fog that clears as your net worth grows.

**Layout ideas**
- **Colorful cartoon style.** Bright colors, rounded shapes and big icons.
- **Notification badges** on tabs when something needs attention.
- **Progress bar per business** that fills up and pays out when full.
- **Floating "+kr" numbers** on payouts.
