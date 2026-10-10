# Ideer

The idea list for a business-empire game inspired by *Business Empire: RichMan*. Nothing is set in stone. We build in packs of 3–4 items at a time. When an item is done it is removed from this list and the list is renumbered; the git log holds the history. Refer to items by title, not number.

Stack: React + Vite + TypeScript, pure seeded engine (no `Math.random`/`Date.now` in the engine), Norwegian UI, NOK, no new dependencies.

## Pack plan

A suggested order, grouped so each pack feels complete when played. The order is a suggestion; packs can be swapped or reshuffled at any time. Items are referred to by title.

Version 1.0 was reached with Pack 43.

Order across the tracks: Pack 63 gave each track its own folder and branch and split the stylesheet by owner, so the two tracks run side by side. G12 put the property and luxury drawings, the maps and the gallery outside the start-up script, so new drawings land in pieces that load when shown.

**Next up on the game track: Pack 67 – Money that holds.** The three biggest leaks from the game review, each in its own system. (1) **Art that pulls back:** prices move 12 times an hour, and Ragnhild Vik's paintings gain about 2.5 % a day (1.2 % trend plus exhibitions worth +1.2 %), so about 35 % an hour without a ceiling — kr 50 mill at 1 mrd became kr 2.76 bill in 42 hours. Each artist gets a slowly rising value and a price that pulls back toward it, like the stocks, and an exhibition becomes a bump that fades. Paintings people own keep today's price: the save gets an anchor per artist (a save-version bump and a migration, tested on a real old save). (2) **Startups that are a gamble:** each round about 73 % survive and grow ×1.5–3.2, so money put in grows about ×1.85 a round; lower the growth to about ×1.1–1.6. (3) **A loan cap of one hour:** `LAANETAK_TIMER` from 2 to 1 hour of income — a bot that borrows to the cap reaches 1 mrd 34 % sooner today. Art and startups have their own dice and the bot never buys either, and the loan cap doesn't touch the bot, so the golden master and the bench shouldn't move. Questions at the start: how fast art pulls back and how much an artist's value rises (in %/h, as for the stocks), how big and how long an exhibition is, whether open startups keep their terms, and whether a loan above the new cap may stay (no forced repayment, just no new borrowing).

**Next up on the graphics track: Pack G16 – Scenes that grow.** All 13 businesses now fill their frame (G13–G15), so the new steps are drawn wide from the start. (1) **Upgrades you can see:** a business drawing changes only at the four growth stages (level 1, 25, 50 and 100) and with its three improvements, so level 26 and level 49 look the same; steps in between (more customers, a longer queue, extra tables, a bigger sign, a second plane) show the climb. (2) **Scenes for the homes:** Hjemmet (Frogner, Oslo), Hytta (Geilo) and Feriehuset (Marbella) get a scene each where the nine rooms show as they are furnished (three levels each, from «Nye fronter og benkeplate» to «Samling i verdensklasse»), and a detail page, in the *Hjem* part of Luksus. **The budget comes first:** the business drawings live in the start-up script, which is at 247 of its 250 kB gzipped after G15 (238 after G12), so the steps can't go there; the likely answer is to keep the tile's close-up in the start script and move the wide scene — sides and steps — into a part that loads with the detail page. Questions at the start: how often a step shows (every 5 or every 10 levels), one scene per home or one per room, and whether the homes get a buy moment with their scene (they are bought in silence today).

The work runs in **two tracks, each in its own session**. They are built side by side in the same repo, so they must not step on each other (see *Working side by side* below).

### Game track (Packs 67–74)

Items from *Money that comes too easily*, *Pace and choices*, *Speed and tests* and *Football manager*. Commits: `Pakke N: …`. Packs 55–58 fixed the bugs from the code review on 8 October, Pack 59 brought franchises and more countries, and Pack 60 the homes and the Sunday paper's «Uka di» — every picked v10.0 game item is done. Pack 61 made back go back, gave every set of parts the same memory and put the event log behind a bell in the top bar. Pack 62 split Luksus into Samling · Hjem · Kunst · Klubb and showed the whole net worth, split by kind, on Profil → Meg. Pack 63 gave each track its own folder and branch, split the stylesheet by owner and made the test suite run clean. Pack 64 measured the per-second work: two screens redrew every drawing each second (Selskaper 161 ms, Samling 72 ms in development) because of a new array prop — fixed — and the speed test now has a budget per system. Pack 65 made the Norge/Verden switch filter the property list, put the index funds in Børs, let the businesses be sorted by steady income, and split `Investeringer.tsx` and `handlinger.ts` by area. Pack 66 gave the club a stadium to build (seats, floodlights, a VIP lounge), a stadium requirement for promotion and a league of 50 fixed teams, and wrote down where new areas go (five tabs, at most four parts, then a detail page — in `ui/deler.ts`). The navigation packs belong here because they change the screens' logic (App, the tab parts).

- **Pack 67 – Money that holds:** Art that pulls back, Startups that are a gamble, A loan cap of one hour. The three biggest leaks first; each sits in its own system (`kunst.ts`, `startups.ts`, the loan cap in `innhold.ts`), and none touches what the bot does.
- **Pack 68 – Fair deals:** A price floor on takeovers, Mergers that can pay, Branches at a fixed price, A Hotell worth buying. The business ladder's prices in one go (`fusjon.ts`, `filialer.ts`, `innhold.ts`). The golden master moves (the simple bot bids on mergers), so it is updated once, here.
- **Pack 69 – Lighter on the phone:** A slower tick while away, Lighter saving, Test housekeeping. Before the bigger systems, so the speed test gets its margin back first.
- **Pack 70 – A longer climb:** Milestones after level 100, Status in the bench, Goals after the last unlock, Hidden achievements. The bench is retuned once, for both the new milestones and a bot that buys status; the goals and the hidden achievements fill the empty stretches it shows.
- **Pack 71 – The squad:** Positions and formations, Attack and defence instead of one strength, Club tactics that each fit a match, A youth academy. Everything that changes what a player is, under one save-version bump; the tactics are redone on top of attack and defence, and the juniors come with positions from the start.
- **Pack 72 – Match day:** A match report, Player statistics and season awards, A season summary. Builds on the positions (a scorer is mostly a striker); the summary shows the awards.
- **Pack 73 – Cups and Europe:** A cup, Europe, The club's accounts. The new competitions bring prize money and TV money, so the accounts come with them.
- **Pack 74 – The last stretch:** Property for the late game, A real-phone check and an outside playtest. Last: the new property needs drawings from the graphics track, and the playtest should see the finished game.

### Graphics track (Packs G16–G23)

Items from *Graphics*. Commits: `Grafikkpakke GN: …`. G1–G15 are done (the foundation, the businesses, the maps, faces and names, things you own, stadium and gallery, the finish, lighter and quicker, the last drawings, a living scene, moments and pictures, a lighter start, a full frame for every business); every drawing is now in the style G1 set, and moves and follows the clock on the big scene. Since G12 the start-up script holds only what the first screen needs (238 kB gzipped, down from 300); the rest loads when shown, or quietly just after start.

*Drawings that fill their frame* covers all 71 drawings, so it runs over eight packs, one group of four or five businesses or nine to thirteen other drawings at a time; the item stays in the list until the last group is done. The businesses come first, since they are what the game opens on; *Scenes that grow* follows them, so the new steps are drawn in the full frame and the homes are wide from the start.

- **Pack G16 – Scenes that grow:** Upgrades you can see, Scenes for the homes. The steps are drawn in the full frame from G13–G15; the homes' scenes and detail page go in the *Hjem* part of Luksus (Pack 62).
- **Pack G17 – A full frame: homes and cabins:** Drawings that fill their frame, with the eleven Norwegian homes: the hybler at Møhlenpris, Moholt and Blindern, the flats on Grünerløkka, Nordnes and Bakklandet, the terraced houses at Madla and Fana, the cabins at Geilo and Trysilfjellet and the rorbu in Reine.
- **Pack G18 – A full frame: buildings, land and landmarks:** Drawings that fill their frame, with the office buildings in Bjørvika and at Forus, the shopping centre in Trondheim, Aker Brygge, the private island in Lofoten, the farms on Hedmarken and Lista, the forests in Trysil and Namdalen, Ytterskjær lighthouse, Kollen hoppbakke, Steinvik borg and Oslotårnet (13).
- **Pack G19 – A full frame: abroad:** Drawings that fill their frame, with Östermalm, Nyhavn, Jordaan, Mitte, Mayfair, Trastevere, Le Marais, Palm Jumeirah, Manhattan, and the flat and the beach hotel in Marbella and the ski flat and the alpine hotel in Zermatt (13).
- **Pack G20 – A full frame: cars and watches:** Drawings that fill their frame, with the seven cars (stasjonsvogn, elbil, superbil, hyperbil, veteranbil, limousin, Formel 1-bil) and the five watches (dykkerklokke, gullklokke, mesterverk, lommeur, diamantklokke) — the two kinds shown indoors (12).
- **Pack G21 – A full frame: boats and planes:** Drawings that fill their frame, with the five boats (snekke, motorbåt, seilbåt, havseiler, superyacht) and the four aircraft (helikopter, propellfly, forretningsjet, langdistansejet) (9). The last group, so the item goes when it is done.
- **Pack G22 – The living year:** Seasons in the drawings. Last, so every drawing gets its seasons in the full frame, the new upgrade steps and the home scenes too.
- **Pack G23 – The club in pictures:** The stadium shows what you have built, Faces for the players, Kits, The match on the stadium. The stadium can be drawn any time; the faces and kits fit after Pack 71 (players with positions) and the match on the stadium after Pack 72 (it shows the match report's goals). It can move up between the full-frame packs as the football packs land.

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

1. **Drawings for the v2.0 content.** New businesses, cities or things to own from Packs 47–51 need drawings, detail pages and map labels in the current style, as each pack lands. The stadium from Pack 66 has its own item, *The stadium shows what you have built*.
2. **Seasons in the drawings.** Snow on roofs and ground in winter, green summers and autumn colours, following the date and Pack 49's weather. Builds on G10's night scenes (the clock and the night layer in `Tegnestil.tsx`). Picked from the v10.0 list.
3. **Upgrades you can see.** A business drawing changes only at the four growth stages (level 1, 25, 50 and 100) and with its three improvements; the levels in between look the same. Show the steps: more customers, a longer queue, extra tables, a bigger sign — so every few levels can be seen in the detail scene. Picked from the v10.0 list.
4. **Scenes for the homes.** Pack 60 brought three homes to furnish (Hjemmet in Oslo, Hytta at Geilo, Feriehuset in Marbella), three rooms each in three levels, shown as a list with level dots on the Luksus tab. Give each home a scene in the G1 style where the furnished rooms show as they are bought (kitchen, living room with the art wall, wine cellar; fireplace lounge, sauna, hot tub; terrace, pool, guest wing), and a detail page. Picked with Pack 60 (9 October 2026).
5. **Drawings that fill their frame.** Today every drawing is a square that fades out at its edges: the sky fades toward the corners and the ground toward the sides, and the frame around it adds a round glow. On a detail page the drawing is 172 × 172 px in the middle of a box that is 172 px tall and as wide as the card, so the sides of the box stand empty. On the cards the drawing is 44 px in a 52 px tile and fades out before the tile's edge (the Saftbod and Pølsebod close-ups through a round mask). Remove the vignette and let the subject fill the whole frame, edge to edge: the scene as wide as its box (wider sky, street, ground and background on each side, not a stretched drawing) and the card tile as a close-up out to its corners. For all 71 drawings — the 13 businesses, the 37 properties and the 21 cars, watches, boats and planes — on the detail pages and in the lists. Asked for on 10 October 2026 (with screenshots of the Saftbod). G13 built the frame (an 11:6 scene, as wide as the card up to 560 px; `FULL_RAMME` switches a drawing over) and did Saftbod, Pølsebod, Gatekjøkken and Kiosk; G14 did Kafé, Restaurant, Hotell and Bank; G15 did Oljeselskap, Rederi, Fiskeoppdrett, Flyselskap and Skisenter. All 13 businesses are done; the 58 left (37 properties and 21 luxury items) are in G17–G21.
6. **The stadium shows what you have built.** Pack 66 gave the club a stadium to build: seats in five steps (700, 2 000, 5 000, 10 000 and 25 000), floodlights and a VIP lounge. `Stadion.tsx` still draws by division only; let it show the stands, the floodlight masts and the VIP boxes as they are built. The club has `k.stadion` (`trinn`, `flomlys`, `vip`), which `Klubb.tsx` can pass once the drawing takes it. From *Football manager*.
7. **Faces for the players.** Portraits for the club's players in the style the rivals got in G4 (`Rivalportrett.tsx`), from a hash of the name, in the squad list, the match report and the season awards. Not the owner's portrait that was declined earlier. From *Football manager*.
8. **The match on the stadium.** The players already drawn on the pitch in `Stadion.tsx` move while a round is played, and a goal gets a short moment with the crowd in the club's colours. Calm, like the other celebrations; nothing with reduced motion. From *Football manager*.
9. **Kits.** Home and away kits drawn in the club's colours — `drakt()` in `Klubbvaapen.tsx` already gives each club two colours and a pattern — on the club page, the match card and the players' portraits, and your own choice of colours and crest pattern. From *Football manager*.

## Money that comes too easily

From the game review after Pack 66 (four measurements with the smart bot to kr 1 000 mrd, every figure checked in the code). These break the money so badly that most other choices stop mattering. Old saves keep what they own today; the fixes change what happens from now on.

1. **Art that pulls back.** Prices move once per game day (12 times an hour), and Ragnhild Vik's paintings gain about 2.5 % a day on average — 1.2 % trend plus a 4 % daily chance of +30 % from an exhibition — so about 35 % an hour, with no ceiling. Kr 50 mill of art bought at 1 mrd was worth kr 2.76 bill after 42 hours, 2.8 times the bot's whole net worth; even Tor Aske, who "goes out of fashion", rises once the exhibitions count. Give each artist a value that rises slowly and a price that pulls back toward it, like the stocks, and make an exhibition a bump that fades. Paintings people own keep today's price.
2. **Startups that are a gamble.** Each round about 73 % of startups survive and grow ×1.5–3.2 (×2.35 on average), so money put in grows about ×1.85 per round on average; putting in the full share every round gave about 4.8 % of net worth a day — 57 % an hour, three times the bot's business income late in the game. Lower the round growth to about ×1.1–1.6, so a round is only slightly positive on average and a startup is a bet, not a machine.
3. **A price floor on takeovers.** A merger by bid costs at least 1.5 × what you have put into your own business, "or a merger would be the cheapest buy in the game" (`fusjon.ts`), but taking over a whole rival merges every business it owns with no such floor. Taking over two rivals at kr 10 mill cost kr 0.79 mill, doubled business income and brought 1 mrd at 3 h 50 min instead of 6 h 12 min. Give the takeover the same floor, summed over the businesses that will merge.
4. **Branches at a fixed price.** A branch costs a share of what you have put into the business *on the day it opens*, and then lifts every later level for free. Opening the branches at level 100 instead of 50 costs ×118, and reaching the same oil company the late way costs 649 % more — a trap for anyone who opens late. Price each branch on a fixed base per business type (its value at level 50), so it costs the same whenever it opens.
5. **A loan cap of one hour.** The loan costs 8 % an hour, and early purchases pay far more, so borrowing to the cap always pays: a bot that borrows the maximum reaches 1 mrd at 4 h 05 min instead of 6 h 12 min (−34 %) and kr 1 000 mrd 26 % sooner, with no margin call. Lower `LAANETAK_TIMER` from 2 to 1 hour of income (picked over a higher rate, which would move the golden master).

## Pace and choices

From the same review. The game opens everything by hour 3½ and then thins out: after kr 10 mrd there is almost nothing to decide.

1. **Milestones after level 100.** The level milestones stop at 100 (`MILEPAELER = [25, 50, 100]`), so old businesses freeze — the bot's Saftbod sat at level 112 from hour 4 to hour 42. Between decisions (a new business, a milestone, an improvement, a branch): 4–5 min up to kr 10 mill, 32 min from 1 to 10 mrd, and 7 h 27 min from 10 to 100 mrd (four decisions in 13 hours). Add milestones at 150, 200 and 250 with a smaller boost (×1.5), and retune the bench per tenfold. The graphics track's *Upgrades you can see* should know about the new steps.
2. **Goals after the last unlock.** After 11 h 33 min only five things unlock, with gaps of 5–8 hours, and nothing after Skisenter at 40 h; at kr 1 000 mrd the goal strip in the top bar disappears, because the goal list ends there (`ui/progresjon.ts`). Add the late goals the game already has: the landmarks (0.8, 2.5, 6 and 15 mrd), the long-range jet, New York, and the achievements not yet earned. Screen only, so the golden master and the bench don't move.
3. **A Hotell worth buying.** Hotell pays back in 37 500 s (kr 135 mill ÷ kr 3 600 a second) against about 30 000 s for Bank and Oljeselskap, and the bot didn't buy one until hour 58. Raise its base income to about kr 4 500 a second, within the ladder rules in `pakke35.test.ts`.
4. **Mergers that can pay.** A merger by bid costs at least 1.5 × what you have put into your own business for +50 % income — 2.7–3.9 times slower to pay back than upgrading, and the bot merged nothing in 67 hours. Lower the floor (`PRIS_MOT_DIN`) to about 1.0, decided together with *A price floor on takeovers* so a bid and a takeover cost the same.
5. **Status in the bench.** Each status level gives +2 % income for a fixed price in kroner: one level bought at kr 10 mill brings 1 mrd 1.2 hours sooner, and all luxury and homes (about 735 points, +16 %) pay back in minutes late in the game. The bench can't see any of it — its bot never buys status. Let the smart bot buy status, so the bench shows a real player's pace, then decide whether the higher levels should give less.
6. **Club tactics that each fit a match.** «Balansert» is never the best tactic (0 of 241 strength gaps, home or away): «Forsvar» wins up to about equal strength and «Angrep» above it, and «Angrep: bra når du må vinne» is wrong for the weaker team (27 % against 23 % win chance at home, ten weaker). Adjust the numbers — for example Forsvar 0.7/0.75 and Angrep 1.3/1.4 — so Forsvar fits a much weaker team, Balansert an even match and Angrep a stronger one, and fix the descriptions. Only the club's own die moves.
7. **Property for the late game.** All property costs 44–75 mrd, all land 2.3 mrd, the club under 0.7 mrd; at kr 1 000 mrd buying every unit adds about 5 % to income, and the whole-city bonus 0.03 %. Add property in the 100–1 000 mrd range (new entries in the catalogue, abroad or at home), so rent still matters late. New places need drawings, so this is shared with the graphics track.
8. **Hidden achievements.** There are 48 achievements, all visible, and the bot earns 12 of its 18 in the first 3 hours and none between hour 6 and hour 13. Add a few hidden ones for things players do on their own — «Kjøpte på bunnen», «Nattugle» — shown only once earned, so the empty stretches get surprises. Each needs a medal (`ui/merker.ts`).

## Speed and tests

From the same review, measured on the built engine.

1. **A slower tick while away.** Two hours away on the heaviest save costs 379 ms (net worth 118, rent 94, achievements 65); computing those three every 10 s instead of every second while away gives 117 ms — on a slow phone about 1.9 s down to 0.6 s. Only for time away (`borte`), so live play, the golden master, the bench and the tests that expect a stamp within a second are unchanged; the money paid differs by 4.5 · 10⁻⁵ of the rent. The cost: income records about 2.5 % lower for time away, and achievements stamped up to 9 s late. It also gives the speed test its margin back: alone, it failed 2 of 4 runs by a few ms (a fresh game at 102 ms against 100).
2. **Lighter saving.** Every live second copies the whole game (`structuredClone`, 1.6 of the 1.7 ms a second takes), and the game saves every 5 s: 7.5 ms here, about 37 ms on a phone — two dropped frames — plus a 193 kB write. Save when the browser is idle, or every 15 s (leaving the page still saves), and look at whether the per-second copy can go.
3. **Test housekeeping.** `pakke52.test.ts` runs 120 game days in one 13–14 s call, the pattern that starves the test runner — run it in chunks with `await` between, as `formue.test.ts` does. Wrap the `history.back()` calls in `pakke61.test.ts` in `act`, so its nine harmless React warnings go away. Update the save size in `pakke52.test.ts`'s comment (192 kB at day 122 after Pack 66, not 178).
4. **A real-phone check and an outside playtest.** Everything about phone speed is estimated from this PC, with a slow phone at about five times slower: two hours away on the heaviest save is 379 ms here, so about 1.9 s on a phone, and the speed test alone failed 2 of 4 runs (a fresh game at 102 ms against 100). Check on a real slow phone after *A slower tick while away*, and let someone outside play before the App Store.

## Football manager

From a look at the club after Pack 66, asked to be "similar to a football manager game". Today a player is two numbers (strength and age), team strength is the average of the best eleven whatever their position, the only decision per match is one of three tactics, and a match is a final score. The club's money can't carry it: a full season in Eliteserien nets about kr 80 mill, the same as 14 seconds of business income at kr 100 mrd — so the club has to matter through the game, its goals and its glory. The drawings for it are in *Graphics*.

1. **Positions and formations.** Every player gets a position — keeper, defence, midfield or attack — and you pick a formation (4-4-2, 4-3-3, 5-3-2). A player out of position counts for less, and a team without a keeper suffers. Today eleven strikers are as good as a balanced team, because `lagstyrke` is just the average of the best eleven.
2. **Attack and defence instead of one strength.** A player's attack feeds the goals you score and their defence the goals you let in, instead of one `styrke` for both. The tactics then have something to work on, and two players of the same strength stop being the same player. Goes with *Positions and formations*: a striker is mostly attack, a centre back mostly defence.
3. **A youth academy.** Each season two or three players aged 16–17 come up from the academy, with a potential you can't fully see. The academy is built in steps, like the stadium, and a better academy brings better juniors. Today every player comes from the market at 18–33, and every young player develops the same way (+1 to +4 a season up to 23).
4. **A match report.** A simple match engine gives each goal a minute and a scorer, each player a rating, and the match a man of the match. Shown on the club page after the round, and in the club's story in Avisa («Fjordby IL 2–1 Skogly FK — Hansen (12), Berg (77)»). Today a match is the final score and a row in the table.
5. **Player statistics and season awards.** Goals, matches and average rating per player and per season, the division's top-scorer list, and the player of the season when the season ends. Gives the squad names worth remembering.
6. **Europe.** Finishing at the top of Eliteserien qualifies for Europe the next season: a few European matches beside the league, with their own money, a trophy and achievements. Today there is nothing left to aim for once Eliteserien is won (status 90 for the division, 3 per trophy).
7. **The club's accounts.** TV money per division and prize money by table position, shown with tickets, sponsor and wages as the club's own accounts on the club page. Today a club has only tickets and sponsor coming in.
8. **A cup.** A knockout cup across all five divisions — the 50 fixed teams from Pack 66 — one round a week of game time beside the league, with a final and its own trophy; a team from a lower division can knock out a big one. A trophy to aim for before Europe.
9. **A season summary.** When a season ends, a page like «Uka di»: the final position, the top scorer and the player of the season (from *Player statistics and season awards*), the season's money in and out, who went up and down, and what the next division asks of the stadium.

## Parked (not chosen yet)

These ideas were suggested but not picked. They stay here so they can be moved up later. They are not part of any pack until they are chosen.

**Not picked from the game review after Pack 66**
- **A real return for the index funds.** Funds, stocks, bonds and savings pay 1–4 % an hour against 8 % for a loan and more than 10 % for businesses even at kr 1 000 mrd; raise the funds' drift to about 6–8 % an hour, or say in the explanation that the Investments tab is for play.
- **Offshore that costs more over time.** Hiding money offshore always pays (3.5–7 % faster to kr 100 mrd); let the charge if you are caught grow for every month the money is hidden.
- **Juniors that don't block.** A junior is exactly half an experienced hire but takes a whole slot and raises the price of every later hire; let juniors not count toward the hiring price.

**Not picked from the football manager list**
- **Form and morale.** Form from the last five matches, morale from results and playing time; a player who never plays asks to leave.
- **Injuries and suspensions.** A small risk per match of missing some rounds, so the squad of up to 18 is worth having.
- **Potential and scouting.** A hidden ceiling per player that a scout reveals.
- **Contracts.** One to four seasons with the wage set when signing; players can leave for free when a contract runs out.
- **Captain and club legends.** Name a captain; long-serving players become legends on the club page when they retire.
- **Bids from other clubs.** Other clubs bid for your best players; say yes, no or ask for more.
- **Players at the other clubs.** Named key players at the 49 fixed teams that you can bid for.
- **Transfer windows.** Trading between seasons and in a short window mid-season instead of a new market every day.
- **Loans of players.** Lend out a young player to a lower division, or borrow one for the rest of a season.
- **A halftime decision.** Change the tactic at halftime when you are behind.
- **Derbies.** Teams from nearby places as rivals, with a bigger crowd and their own story.
- **Home and away.** Each team meets every other twice: 18 rounds and 90 minutes a season instead of 9 and 45.
- **Staff.** A head coach with a style, a physio and a scout, each with wages.
- **Training focus.** Each week fitness, attack, defence or youth.
- **The board and the fans.** A goal for the season from the board, and fan mood that follows results and moves the crowd.
- **Status that grows with success.** More status per trophy (3 today, against 90 for just being in Eliteserien).
- **A tactics board.** The pitch with the players in their positions for the formation.
- **A sports page in Avisa.** Your match with the scorers, the table and the top scorer on a page of its own.

**Declined in earlier rounds** (from lists Folke saw and didn't pick; the details were in chat, not in this file)
- **Before v1.0:** a guided tutorial, an ending, missions, sound, accessibility.
- **For 2.0:** an auction house, a club league, an English version, sync between devices.
- **For v10.0:** cloud save, notifications, leaderboards, eras.
- **Graphics:** a portrait of the player, an empire panorama, a trophy cabinet.

**Game ideas**
- **Take your group public.** List your own group on the exchange with its own ticker: sell shares to raise money, the price follows your quarterly results, and the shareholders can be unhappy.
- **A finish line.** Reaching #1 on the Forbes list or kr 1 trillion gives a proper ending: a closing screen and a front page in the paper. Then choose to keep playing or start over.
- **Start-over bonus.** Sell everything for "legacy points" that give a permanent bonus in the next game.
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
