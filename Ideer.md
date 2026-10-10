# Ideer

The idea list for a business-empire game inspired by *Business Empire: RichMan*. Nothing is set in stone. We build in packs of 3–4 items at a time. When an item is done it is removed from this list and the list is renumbered; the git log holds the history. Refer to items by title, not number.

Stack: React + Vite + TypeScript, pure seeded engine (no `Math.random`/`Date.now` in the engine), Norwegian UI, NOK, no new dependencies.

## Pack plan

A suggested order, grouped so each pack feels complete when played. The order is a suggestion; packs can be swapped or reshuffled at any time. Items are referred to by title.

Version 1.0 was reached with Pack 43.

Order across the tracks: Pack 63 gave each track its own folder and branch and split the stylesheet by owner, so the two tracks run side by side. G12 put the property and luxury drawings, the maps and the gallery outside the start-up script, so new drawings land in pieces that load when shown.

**Next up on the game track: Pack 70 – A longer climb.** The late game, where the review found a decision only every 7½ hours. (1) **Milestones after level 100:** the level milestones stop at 100 (`MILEPAELER = [25, 50, 100]`), so old businesses freeze — the bot's Saftbod sat at level 112 from hour 4 to hour 42; add milestones at 150, 200 and 250 with a smaller boost (×1.5). (2) **Status in the bench:** each status level gives +2 % income for a fixed price, and one level bought at kr 10 mill brings 1 mrd 1.2 hours sooner — but the bench bot never buys status; let the smart bot buy it, so the bench shows a real player's pace. (3) **Goals after the last unlock:** the goal strip disappears at kr 1 000 mrd and nothing opens after hour 40; add the late goals the game has (the landmarks at 0.8, 2.5, 6 and 15 mrd, the long-range jet, New York, achievements not yet earned). (4) **Hidden achievements:** a few for things players do on their own, shown only once earned. Then the bench is retuned once for both milestones and status: after Pack 68 the smart bot takes 5 h 11 min to 1 mrd and then 6 h 35, 11 h 54 and 14 h 18 per tenfold (Folke once chose «steady, ~15 h per tenfold» after 1 mrd). Questions at the start: the milestone levels and boost, how the bot spends on status, the pace to aim for per tenfold, which late goals the strip shows, and which hidden achievements. Pack 74 (Fits the phone) is done, so the phone frame is in place; Pack 75 (Calmer lists: the top of Bedrifter, one prompt for «Velg retning», the place in the property title, property sorting) has no dependencies and can go before or between Packs 70–73.

**Next up on the graphics track: Pack G18 – A full frame: buildings, land and landmarks.** G17 is done (the eleven homes), so the full frame goes on with thirteen drawings: the office buildings in Bjørvika and at Forus, the shopping centre in Trondheim, Aker Brygge, the private island in Lofoten, the farms on Hedmarken (Hamar) and Lista (Farsund), the forests in Trysil and Namdalen (Namsos), Ytterskjær lighthouse, Kollen hoppbakke (Holmenkollen), Steinvik borg and Oslotårnet (Bjørvika). All are at far distance; the island, the lighthouse and the castle stand on the sea (an irregular shore front, G7) and the ski hill and the forests fill the bottom of the canvas (`Bunnfade`), so those must reach −40 and 136 themselves. Same method as G17: the ids go in `FULL_RAMME`, the sides are drawn, and the card tile gets a square crop in `FLISUTSNITT` (the farms, forests and landmarks use the tile on `JordOgLandemerker` too, so they pick it up as it is). The drawings live in `ved-behov/Eiendomstegninger.tsx` (114 kB raw and 27.1 gzipped after G17), so the start-up script does not grow from them — and the start-up script (249.9 kB gzipped after G17; Pack 74 took it from 248.7 to 249.8) now has a budget of 500 kB, doubled on 11 October 2026 so the game can grow. A helper a business also needs still goes in the start file; the rest stays in the part, since a phone reads the whole start-up script before the first screen. Questions at the start: what each place continues into at the sides, named per drawing from `sted` (Bjørvika: the Opera and the fjord; Forus: a business park with car parks and roundabouts; Hamar: fields to Mjøsa; Lista: a flat coast with wind-bent trees; Namsos: a river and a sawmill; Holmenkollen: the city and the fjord below), and whether the three at sea get more sea (islets, boats) or a coast.

The work runs in **two tracks, each in its own session**. They are built side by side in the same repo, so they must not step on each other (see *Working side by side* below).

### Game track (Packs 70–73 and 75–76)

Items from *Pace and choices*, *Speed and tests*, *Football manager* and *The frame and the lists*. Commits: `Pakke N: …`. Packs 55–58 fixed the bugs from the code review on 8 October, Pack 59 brought franchises and more countries, and Pack 60 the homes and the Sunday paper's «Uka di» — every picked v10.0 game item is done. Pack 61 made back go back, gave every set of parts the same memory and put the event log behind a bell in the top bar. Pack 62 split Luksus into Samling · Hjem · Kunst · Klubb and showed the whole net worth, split by kind, on Profil → Meg. Pack 63 gave each track its own folder and branch, split the stylesheet by owner and made the test suite run clean. Pack 64 measured the per-second work: two screens redrew every drawing each second (Selskaper 161 ms, Samling 72 ms in development) because of a new array prop — fixed — and the speed test now has a budget per system. Pack 65 made the Norge/Verden switch filter the property list, put the index funds in Børs, let the businesses be sorted by steady income, and split `Investeringer.tsx` and `handlinger.ts` by area. Pack 66 gave the club a stadium to build (seats, floodlights, a VIP lounge), a stadium requirement for promotion and a league of 50 fixed teams, and wrote down where new areas go (five tabs, at most four parts, then a detail page — in `ui/deler.ts`). Pack 67 stopped the three biggest money leaks: art now pulls back toward a slowly rising value (Vik ×2.5 in 42 hours instead of ×81 000), startups return about ×1.02 per krone instead of ×3.2, and the loan cap is one hour of income. Pack 68 made the business deals fair: a merger costs at least what your business is worth (1.5 → 1.0) but only from level 100 — without that gate mergers became the cheapest buy early (1 mrd at 3 h 26 min) — a takeover costs at least the mergers it brings, branches have a fixed price per type, and Hotell earns kr 4 500 a second. The smart bot now reaches 1 mrd at 5 h 11 min (6 h 12 before), 1 000 mrd at 38 h; Pack 70 retunes the pace. Pack 69 made the phone's work lighter: while you are away, rent, net worth and achievements are computed every 10 s (two hours away on the heaviest save 379 → ~125 ms, a fresh game ~95 → ~50 ms), the game saves every 15 s in a quiet moment instead of every 5 s, and the speed test now also guards a second of live play. The navigation packs belong here because they change the screens' logic (App, the tab parts).

- **Pack 70 – A longer climb:** Milestones after level 100, Status in the bench, Goals after the last unlock, Hidden achievements. The bench is retuned once, for both the new milestones and a bot that buys status; the goals and the hidden achievements fill the empty stretches it shows.
- **Pack 71 – The squad:** Positions and formations, Attack and defence instead of one strength, Club tactics that each fit a match, A youth academy. Everything that changes what a player is, under one save-version bump; the tactics are redone on top of attack and defence, and the juniors come with positions from the start.
- **Pack 72 – Match day:** A match report, Player statistics and season awards, A season summary. Builds on the positions (a scorer is mostly a striker); the summary shows the awards.
- **Pack 73 – Cups and Europe:** A cup, Europe, The club's accounts. The new competitions bring prize money and TV money, so the accounts come with them.
- **Pack 75 – Calmer lists:** The top of Bedrifter takes 44 % of the screen, One prompt for «Velg retning», The place in the property title, Sorting the property list. The two long lists, `Bedrifter.tsx` and `Eiendom.tsx` with their cards; engine-free too.
- **Pack 76 – The last stretch:** Property for the late game, A real-phone check and an outside playtest. Last: the new property needs drawings from the graphics track, and the playtest should see the finished game, including the landscape and tap-target work of Pack 74.

### Graphics track (Packs G18–G23)

Items from *Graphics*. Commits: `Grafikkpakke GN: …`. G1–G17 are done (the foundation, the businesses, the maps, faces and names, things you own, stadium and gallery, the finish, lighter and quicker, the last drawings, a living scene, moments and pictures, a lighter start, a full frame for every business, scenes that grow, a full frame for the homes); every drawing is now in the style G1 set, and moves and follows the clock on the big scene. Since G12 the start-up script holds only what the first screen needs (238 kB gzipped after G12, down from 300; 248.7 after the full frame and G16, 249.8 after Pack 74 and 249.9 after G17, against a budget of 250 that was doubled to 500 after G17); the rest loads when shown, or quietly just after start.

*Drawings that fill their frame* covers all 71 drawings, so it runs over eight packs, one group of four or five businesses or nine to thirteen other drawings at a time; the item stays in the list until the last group is done. The businesses came first, since they are what the game opens on (G13–G15); *Scenes that grow* (G16) came next, so the new steps were drawn in the full frame and the homes are wide from the start; G17 did the eleven Norwegian homes, and 47 drawings are left (G18–G21).

- **Pack G18 – A full frame: buildings, land and landmarks:** Drawings that fill their frame, with the office buildings in Bjørvika and at Forus, the shopping centre in Trondheim, Aker Brygge, the private island in Lofoten, the farms on Hedmarken and Lista, the forests in Trysil and Namdalen, Ytterskjær lighthouse, Kollen hoppbakke, Steinvik borg and Oslotårnet (13).
- **Pack G19 – A full frame: abroad:** Drawings that fill their frame, with Östermalm, Nyhavn, Jordaan, Mitte, Mayfair, Trastevere, Le Marais, Palm Jumeirah, Manhattan, and the flat and the beach hotel in Marbella and the ski flat and the alpine hotel in Zermatt (13).
- **Pack G20 – A full frame: cars and watches:** Drawings that fill their frame, with the seven cars (stasjonsvogn, elbil, superbil, hyperbil, veteranbil, limousin, Formel 1-bil) and the five watches (dykkerklokke, gullklokke, mesterverk, lommeur, diamantklokke) — the two kinds shown indoors (12).
- **Pack G21 – A full frame: boats and planes:** Drawings that fill their frame, with the five boats (snekke, motorbåt, seilbåt, havseiler, superyacht) and the four aircraft (helikopter, propellfly, forretningsjet, langdistansejet) (9). The last group, so the item goes when it is done.
- **Pack G22 – The living year:** Seasons in the drawings. Last, so every drawing gets its seasons in the full frame, the new upgrade steps and the home scenes too.
- **Pack G23 – The club in pictures:** The stadium shows what you have built, Faces for the players, Kits, The match on the stadium. The stadium can be drawn any time; the faces and kits fit after Pack 71 (players with positions) and the match on the stadium after Pack 72 (it shows the match report's goals). It can move up between the full-frame packs as the football packs land.

*Drawings for the v2.0 content* is not a pack: it runs alongside the game packs, as each one lands — Pack 59 drew Amsterdam, Roma and Paris itself (a rough Vespa in Roma could use a finer hand); the homes from Pack 60 got their scenes in G16.

### Working side by side

- **Two folders, two branches** (Pack 63). The game track works in `Desktop\New folder (3)` on branch `spill`; the graphics track in `Desktop\milliardaer-grafikk` on branch `grafikk` — a git worktree of the same repo, with its own `node_modules`. Start each session in its own folder. Master is checked out nowhere: it is what is on GitHub.
- **Delivering a pack:** commit on your branch, then `node scripts/lever.mjs`. It fetches, rebases your branch onto `origin/master`, type-checks and runs every test on the result, and lists exactly what would go to master. When Folke says push: `node scripts/lever.mjs --push` (it refuses anything that wasn't tested as it stands). If the other track pushed in between, GitHub refuses the push — run the script again. Changes to `.md` files only skip the tests.
- **The stylesheet is one file per area** in `src/styles/`, imported in order by `index.css` (a later file wins over an equally specific rule in an earlier one, so `bred.css` comes last). Each file names its owner in its header: the graphics track owns `tegninger.css`, `kart.css` and `oppgjor.css`; the game track the rest. Tests read them all through `alleStiler()` in `src/ui/__tester__/stiler.ts`.
- **Who owns what.** The graphics track owns the drawings and how they render: `Illustrasjoner.tsx`, `Tegnestil.tsx`, `BedriftIkon.tsx`, `Rivalportrett.tsx`, `Stadion.tsx`, `Klubbvaapen.tsx`, `Papirlogo.tsx`, `StartupLogo.tsx`, the paintings in `Malerier.tsx` (and the gallery wall in `Kunst.tsx`), `Norgeskart.tsx` and `Verdenskart.tsx` (thin wrappers since G12), the pieces that load when needed in `komponenter/ved-behov/` and their loader `ui/vedBehov.ts`, `Kartmerke.tsx`, `Gatebilde.tsx`, the map geometry in `ui/norgeskartet.ts` and `ui/verdenskartet.ts`, the map data in `ui/kartdata.ts` (generated by `scripts/lag-kartdata.mjs`), the wordmarks in `ui/ordmerker.ts` (generated by `scripts/lag-ordmerker.mjs`), `Oppgjor.tsx`, the detail pages for things you own (`screens/Tingdetalj.tsx`, `ui/detaljvisning.ts`), the logo files (`Logo.tsx`, `public/ikon.svg`, `index.html`, `scripts/lag-ikoner.mjs`) and `Galleri.tsx`. The game track owns `src/engine`, `src/state` and the screens' logic. The screens and `Ideer.md` are shared: change only what your pack needs.
- **Commit only your own work.** Each track has its own folder now, so the other track's half-done work can't end up in your commit; still `git add <paths>` rather than `-A`, so nothing stray (test saves, scratch files) slips in.
- **The graphics track never changes the engine's behaviour.** No dice, no balance, no save version — the golden master and the bench stay unchanged by every G pack.
- **New content in the game track gets a drawing in the current style.** G1 has landed: new drawings follow the rules in the header of `Illustrasjoner.tsx` and are built with `Tegnestil.tsx`. If that is too much for the pack, leave the drawing to the graphics track and say so in the commit message. Since G12 a new property drawing goes in `ved-behov/Eiendomstegninger.tsx` and a new luxury drawing in `ved-behov/Luksustegninger.tsx`, with its id in `EIENDOMSIDER` or `LUKSUSIDER` in `Illustrasjoner.tsx`; a test that renders one must `await lastAlle()` (from `ui/vedBehov.ts`) first, and `startskript.test.ts` keeps the start-up script under 500 kB gzipped (250 until G17).
- **`Ideer.md`:** each track removes only its own finished items and pack line, by title. Pack numbers don't depend on item numbers, so renumbering is harmless.
- **Releases:** the game goes to the App Store at v10.0. Folke decides the version numbers on the way; the graphics track can ship with any game pack or after it. Version 2.5 (11 October 2026) named what came after 2.0: Packs 67–69, the steps and the homes (G16) and the phone frame (Pack 74); the next entry should start from there.

## Graphics

Loose ends after G1–G7, and what was picked for v10.0.

1. **Drawings for the v2.0 content.** New businesses, cities or things to own from Packs 47–51 need drawings, detail pages and map labels in the current style, as each pack lands. The stadium from Pack 66 has its own item, *The stadium shows what you have built*.
2. **Seasons in the drawings.** Snow on roofs and ground in winter, green summers and autumn colours, following the date and Pack 49's weather. Builds on G10's night scenes (the clock and the night layer in `Tegnestil.tsx`). Picked from the v10.0 list.
3. **Drawings that fill their frame.** Today every drawing is a square that fades out at its edges: the sky fades toward the corners and the ground toward the sides, and the frame around it adds a round glow. On a detail page the drawing is 172 × 172 px in the middle of a box that is 172 px tall and as wide as the card, so the sides of the box stand empty. On the cards the drawing is 44 px in a 52 px tile and fades out before the tile's edge (the Saftbod and Pølsebod close-ups through a round mask). Remove the vignette and let the subject fill the whole frame, edge to edge: the scene as wide as its box (wider sky, street, ground and background on each side, not a stretched drawing) and the card tile as a close-up out to its corners. For all 71 drawings — the 13 businesses, the 37 properties and the 21 cars, watches, boats and planes — on the detail pages and in the lists. Asked for on 10 October 2026 (with screenshots of the Saftbod). G13 built the frame (an 11:6 scene, as wide as the card up to 560 px; `FULL_RAMME` switches a drawing over) and did Saftbod, Pølsebod, Gatekjøkken and Kiosk; G14 did Kafé, Restaurant, Hotell and Bank; G15 did Oljeselskap, Rederi, Fiskeoppdrett, Flyselskap and Skisenter; G17 did the eleven Norwegian homes (the hybler, flats, terraced houses, cabins and the rorbu), with a square tile crop in `FLISUTSNITT`. All 13 businesses and the 11 homes are done; the 47 left (26 properties and 21 luxury items) are in G18–G21.
4. **The stadium shows what you have built.** Pack 66 gave the club a stadium to build: seats in five steps (700, 2 000, 5 000, 10 000 and 25 000), floodlights and a VIP lounge. `Stadion.tsx` still draws by division only; let it show the stands, the floodlight masts and the VIP boxes as they are built. The club has `k.stadion` (`trinn`, `flomlys`, `vip`), which `Klubb.tsx` can pass once the drawing takes it. From *Football manager*.
5. **Faces for the players.** Portraits for the club's players in the style the rivals got in G4 (`Rivalportrett.tsx`), from a hash of the name, in the squad list, the match report and the season awards. Not the owner's portrait that was declined earlier. From *Football manager*.
6. **The match on the stadium.** The players already drawn on the pitch in `Stadion.tsx` move while a round is played, and a goal gets a short moment with the crowd in the club's colours. Calm, like the other celebrations; nothing with reduced motion. From *Football manager*.
7. **Kits.** Home and away kits drawn in the club's colours — `drakt()` in `Klubbvaapen.tsx` already gives each club two colours and a pattern — on the club page, the match card and the players' portraits, and your own choice of colours and crest pattern. From *Football manager*.
8. **Rooms you can zoom to.** On a phone the home scene is 314 px wide, so a 38-unit room is 68 px and a sofa about 10 px. Tap a room and the scene zooms to it (a crop box per room through `Naerbilde`, nine boxes). Picked 11 October 2026, from G16.
9. **The truck across the street from the Pølsebod.** The food truck that comes with the third improvement stands inside `Dis` (0.7 opacity and haze), so the pavement and the queue show through it and it reads as a rendering error on every stage. Draw it solid in a slightly muted tone, with its two customers. Picked 11 October 2026, from G16.
10. **Steps and homes in the gallery, and the light theme.** `?galleri` shows neither the business steps nor the home scenes. Add a grid of the steps (stage × step, with the improvements on) and the home room combinations, and look at every new scene once in the light theme — G16 only saw the dark one. It also saves the next session from building a contact sheet by hand. Picked 11 October 2026, from G16.
11. **Steps that tell the hotel's and the bank's story.** Their G16 steps are mostly cars, people and a van (the hotel is at far distance, where a person is 4.4 units). The hotel could show occupancy as more lit windows (needs the window grid per stage) and a doorman with luggage; the bank a counter queue and a second ATM. Picked 11 October 2026, from G16.
12. **A moment when a business grows to a new place.** Level 25, 50 and 100 are the biggest change a business has — a new building, a new street — but only the card's gold pulse marks it; `nytt()` gives a moment for the first purchase of a type only. A «Bedriften vokser» moment with before and after, in the buy-moment machinery (a new `Kjopsart`, two scenes): 3 per business, 39 over a whole game. Calm and gold like the other celebrations. Picked 11 October 2026, from G16.

## Pace and choices

From the same review. The game opens everything by hour 3½ and then thins out: after kr 10 mrd there is almost nothing to decide.

1. **Milestones after level 100.** The level milestones stop at 100 (`MILEPAELER = [25, 50, 100]`), so old businesses freeze — the bot's Saftbod sat at level 112 from hour 4 to hour 42. Between decisions (a new business, a milestone, an improvement, a branch): 4–5 min up to kr 10 mill, 32 min from 1 to 10 mrd, and 7 h 27 min from 10 to 100 mrd (four decisions in 13 hours). Add milestones at 150, 200 and 250 with a smaller boost (×1.5), and retune the bench per tenfold. The scene's steps (G16, `stegFor` in `Illustrasjoner.tsx`) run every fifth level up to level 150 and don't depend on the milestones, so they need no change.
2. **Goals after the last unlock.** After 11 h 33 min only five things unlock, with gaps of 5–8 hours, and nothing after Skisenter at 40 h; at kr 1 000 mrd the goal strip in the top bar disappears, because the goal list ends there (`ui/progresjon.ts`). Add the late goals the game already has: the landmarks (0.8, 2.5, 6 and 15 mrd), the long-range jet, New York, and the achievements not yet earned. Screen only, so the golden master and the bench don't move.
3. **Status in the bench.** Each status level gives +2 % income for a fixed price in kroner: one level bought at kr 10 mill brings 1 mrd 1.2 hours sooner, and all luxury and homes (about 735 points, +16 %) pay back in minutes late in the game. The bench can't see any of it — its bot never buys status. Let the smart bot buy status, so the bench shows a real player's pace, then decide whether the higher levels should give less.
4. **Club tactics that each fit a match.** «Balansert» is never the best tactic (0 of 241 strength gaps, home or away): «Forsvar» wins up to about equal strength and «Angrep» above it, and «Angrep: bra når du må vinne» is wrong for the weaker team (27 % against 23 % win chance at home, ten weaker). Adjust the numbers — for example Forsvar 0.7/0.75 and Angrep 1.3/1.4 — so Forsvar fits a much weaker team, Balansert an even match and Angrep a stronger one, and fix the descriptions. Only the club's own die moves.
5. **Property for the late game.** All property costs 44–75 mrd, all land 2.3 mrd, the club under 0.7 mrd; at kr 1 000 mrd buying every unit adds about 5 % to income, and the whole-city bonus 0.03 %. Add property in the 100–1 000 mrd range (new entries in the catalogue, abroad or at home), so rent still matters late. New places need drawings, so this is shared with the graphics track.
6. **Hidden achievements.** There are 48 achievements, all visible, and the bot earns 12 of its 18 in the first 3 hours and none between hour 6 and hour 13. Add a few hidden ones for things players do on their own — «Kjøpte på bunnen», «Nattugle» — shown only once earned, so the empty stretches get surprises. Each needs a medal (`ui/merker.ts`).
7. **Homes that last.** All nine rooms cost kr 5.14 mrd together (10.4 + 15.6 + 26 + 111 + 138 + 170 + 1 110 + 1 440 + 2 120 mill) and the last home opens at 1 mrd, so on the bench's pace (1 mrd at 5 h 11) the whole home system is finished an hour or two later, in a game that runs to about 38 h at kr 1 000 mrd; after that the Hjem part never changes. Add a fourth step to every room (about ×4 the price of the third, more status) or two late homes (a manor and a private island villa, opening at about 50 and 500 mrd). The graphics track can draw either cheaply: a step is one more `if (n >= 4)` per room and a home one scene of about 150 lines in `ved-behov/Hjemtegninger.tsx`. Next to *Property for the late game*. Picked 11 October 2026.

## Speed and tests

From the same review, measured on the built engine.

1. **A real-phone check and an outside playtest.** Everything about phone speed is estimated from this PC, with a slow phone at about five times slower. After Pack 69, two hours away on the heaviest save is ~125 ms here (about 0.6 s on a phone, down from 1.9 s), and a second of live play is ~3.7 ms (about one frame on a phone, most of it the copy of the whole game). Check on a real slow phone, and let someone outside play before the App Store.

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

## The frame and the lists

From the UI review on 11 October 2026, measured in a late-game save at 375 × 812, in landscape, at 1280 wide and in a fresh game. Nothing here touches the engine. Pack 74 did the frame (landscape, scroll memory, tap targets, 13 px text); what is left is the two lists.

1. **The top of Bedrifter takes 44 % of the screen.** In the late game the first card starts at 357 of 812 px, below the title, the ×1 row, the date, up to four chips (SNØ / HET: KIOSK / KALD: RESTAURANT / NORMALE TIDER · RENTE 4 %) and the Kjøpt/Inntekt toggle; a fresh game shows the same chips and the whole multiplier row at kr 1 000. Fold the chips into one tappable line, «Markedet i dag ›», that opens the explanation, and keep the multiplier and sort controls on one line.
2. **One prompt for «Velg retning».** The same gold badge sits on 7 of 13 cards in the late-game save: one unresolved decision repeated down the page. Put one line at the top, «7 bedrifter venter på retning», that opens the first, and keep a smaller marker on the cards.
3. **The place in the property title.** Three cards in a row are called «Hybel» and three «Leilighet»; the place is in a small grey line below (`navn` in the `h2`, `sted` beside it). Put it in the title: «Hybel · Møhlenpris». The data is already there.
4. **Sorting the property list.** Businesses can be sorted by steady income (Pack 65), but `Eiendom.tsx` has no sort at all: the list is fixed in price order, 24 cards at about 210 px each. A toggle like the business one — price, yield, rent per second — using values that don't change under your finger (no weather, no vacancy).

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
