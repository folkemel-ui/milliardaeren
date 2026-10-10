# Ideer

The idea list for a business-empire game inspired by *Business Empire: RichMan*. Nothing is set in stone. We build in packs of 3–4 items at a time. When an item is done it is removed from this list and the list is renumbered; the git log holds the history. Refer to items by title, not number.

Stack: React + Vite + TypeScript, pure seeded engine (no `Math.random`/`Date.now` in the engine), Norwegian UI, NOK, no new dependencies.

## Pack plan

A suggested order, grouped so each pack feels complete when played. The order is a suggestion; packs can be swapped or reshuffled at any time. Items are referred to by title.

Version 1.0 was reached with Pack 43.

Order across the tracks: Pack 63 is done — each track has its own folder and branch, and the stylesheet is split by owner — so G12 and the game packs can run side by side again.

**Next up: Pack 65 – Shorter lists.** The long lists get shorter and the biggest screen file gets split. (1) **The map switch filters the property list:** Eiendom is 12 screens at phone width, all 29 property types in one list with Norway and abroad mixed; the Norge/Verden switch (remembered since Pack 61) will filter the list too. (2) **Sort businesses by income:** in a late game the lemonade stand is on top and the earners at the bottom of a 4.6-screen list; a remembered choice sorts by income, buy order stays the default. (3) **Funds on the exchange:** index funds are bought like shares, so they move from Bank to Børs; Bank keeps the economy card, savings, bonds and loans. (4) **Smaller screen files:** `Investeringer.tsx` is 1 056 lines with 15 components; since the funds move anyway, it is split into a file per part (Oversikt, Børs, Selskaper, Bank). Questions at the start: filter by Norge/Verden or group by city, where funds sit in Børs (a third tile beside Aksjer and Krypto, or a list under them), and whether the business sort is remembered like the parts.

The work runs in **two tracks, each in its own session**. They are built side by side in the same repo, so they must not step on each other (see *Working side by side* below).

### Game track (Packs 65–66)

Items from *Room to grow*, *Navigation* and *Football club*, most important first. Commits: `Pakke N: …`. Packs 55–58 fixed the bugs from the code review on 8 October, Pack 59 brought franchises and more countries, and Pack 60 the homes and the Sunday paper's «Uka di» — every picked v10.0 game item is done. Pack 61 made back go back, gave every set of parts the same memory and put the event log behind a bell in the top bar. Pack 62 split Luksus into Samling · Hjem · Kunst · Klubb and showed the whole net worth, split by kind, on Profil → Meg. Pack 63 gave each track its own folder and branch, split the stylesheet by owner and made the test suite run clean. Pack 64 measured the per-second work: two screens redrew every drawing each second (Selskaper 161 ms, Samling 72 ms in development) because of a new array prop — fixed — and the speed test now has a budget per system. The navigation packs belong here because they change the screens' logic (App, the tab parts).

- **Pack 65 – Shorter lists:** The map switch filters the property list, Sort businesses by income, Funds on the exchange, Smaller screen files. Moving the funds already opens up `Investeringer.tsx`, so it is split into a file per part in the same go.
- **Pack 66 – A club that matters:** A home for new areas, Stadium upgrades, Fixed league teams. The rule for where new areas go is decided first, since a bigger club is the first thing that might want more than a part in Luksus. The graphics track draws the upgrades in `Stadion.tsx` alongside it, as with *Drawings for the v2.0 content*.

### Graphics track (Packs G12–G14)

Items from *Graphics* and *Room to grow*. Commits: `Grafikkpakke GN: …`. G1–G11 are done (the foundation, the businesses, the maps, faces and names, things you own, stadium and gallery, the finish, lighter and quicker, the last drawings, a living scene, moments and pictures); every drawing is now in the style G1 set, and moves and follows the clock on the big scene.

- **Pack G12 – A lighter start:** Load drawings and maps when needed. First on this track, so the new drawings in G13 and G14 land in chunks that load when shown, not in the start-up script.
- **Pack G13 – Scenes that grow:** Upgrades you can see, Scenes for the homes. The homes' scenes and detail page go in the *Hjem* part of Luksus (Pack 62).
- **Pack G14 – The living year:** Seasons in the drawings. Last, so the new upgrade steps and home scenes get their seasons too.

*Drawings for the v2.0 content* is not a pack: it runs alongside the game packs, as each one lands — Pack 59 drew Amsterdam, Roma and Paris itself (a rough Vespa in Roma could use a finer hand); the homes from Pack 60 are an item of their own (*Scenes for the homes*).

### Working side by side

- **Two folders, two branches** (Pack 63). The game track works in `Desktop\New folder (3)` on branch `spill`; the graphics track in `Desktop\milliardaer-grafikk` on branch `grafikk` — a git worktree of the same repo, with its own `node_modules`. Start each session in its own folder. Master is checked out nowhere: it is what is on GitHub.
- **Delivering a pack:** commit on your branch, then `node scripts/lever.mjs`. It fetches, rebases your branch onto `origin/master`, type-checks and runs every test on the result, and lists exactly what would go to master. When Folke says push: `node scripts/lever.mjs --push` (it refuses anything that wasn't tested as it stands). If the other track pushed in between, GitHub refuses the push — run the script again. Changes to `.md` files only skip the tests.
- **The stylesheet is one file per area** in `src/styles/`, imported in order by `index.css` (a later file wins over an equally specific rule in an earlier one, so `bred.css` comes last). Each file names its owner in its header: the graphics track owns `tegninger.css`, `kart.css` and `oppgjor.css`; the game track the rest. Tests read them all through `alleStiler()` in `src/ui/__tester__/stiler.ts`.
- **Who owns what.** The graphics track owns the drawings and how they render: `Illustrasjoner.tsx`, `Tegnestil.tsx`, `BedriftIkon.tsx`, `Rivalportrett.tsx`, `Stadion.tsx`, `Klubbvaapen.tsx`, `Papirlogo.tsx`, `StartupLogo.tsx`, the paintings in `Malerier.tsx` (and the gallery wall in `Kunst.tsx`), `Norgeskart.tsx`, `Verdenskart.tsx`, `Kartmerke.tsx`, `Gatebilde.tsx`, the map geometry in `ui/norgeskartet.ts` and `ui/verdenskartet.ts`, the map data in `ui/kartdata.ts` (generated by `scripts/lag-kartdata.mjs`), the wordmarks in `ui/ordmerker.ts` (generated by `scripts/lag-ordmerker.mjs`), `Oppgjor.tsx`, the detail pages for things you own (`screens/Tingdetalj.tsx`, `ui/detaljvisning.ts`), the logo files (`Logo.tsx`, `public/ikon.svg`, `index.html`, `scripts/lag-ikoner.mjs`) and `Galleri.tsx`. The game track owns `src/engine`, `src/state` and the screens' logic. The screens and `Ideer.md` are shared: change only what your pack needs.
- **Commit only your own work.** Each track has its own folder now, so the other track's half-done work can't end up in your commit; still `git add <paths>` rather than `-A`, so nothing stray (test saves, scratch files) slips in.
- **The graphics track never changes the engine's behaviour.** No dice, no balance, no save version — the golden master and the bench stay unchanged by every G pack.
- **New content in the game track gets a drawing in the current style.** G1 has landed: new drawings follow the rules in the header of `Illustrasjoner.tsx` and are built with `Tegnestil.tsx`. If that is too much for the pack, leave the drawing to the graphics track and say so in the commit message.
- **`Ideer.md`:** each track removes only its own finished items and pack line, by title. Pack numbers don't depend on item numbers, so renumbering is harmless.
- **Releases:** the game goes to the App Store at v10.0. Folke decides the version numbers on the way; the graphics track can ship with any game pack or after it.

## Graphics

Loose ends after G1–G7, and what was picked for v10.0.

1. **Drawings for the v2.0 content.** New businesses, cities or things to own from Packs 47–51 need drawings, detail pages and map labels in the current style, as each pack lands.
2. **Seasons in the drawings.** Snow on roofs and ground in winter, green summers and autumn colours, following the date and Pack 49's weather. Builds on G10's night scenes (the clock and the night layer in `Tegnestil.tsx`). Picked from the v10.0 list.
3. **Upgrades you can see.** A business drawing changes only at the four growth stages (level 1, 25, 50 and 100) and with its three improvements; the levels in between look the same. Show the steps: more customers, a longer queue, extra tables, a bigger sign — so every few levels can be seen in the detail scene. Picked from the v10.0 list.
4. **Scenes for the homes.** Pack 60 brought three homes to furnish (Hjemmet in Oslo, Hytta at Geilo, Feriehuset in Marbella), three rooms each in three levels, shown as a list with level dots on the Luksus tab. Give each home a scene in the G1 style where the furnished rooms show as they are bought (kitchen, living room with the art wall, wine cellar; fireplace lounge, sauna, hot tub; terrace, pool, guest wing), and a detail page. Picked with Pack 60 (9 October 2026).

## Navigation

From a review of how the game is organised (9 October 2026), measured at phone width (375 × 812) in a late game that owns everything. Lengths are in screens of 812 px.

1. **The map switch filters the property list.** The Eiendom tab is 12 screens: all 29 property types in one list, Norway and abroad mixed. The Norge/Verden switch changes only the map; the list below it stays the same. Let the switch filter the list too, or group the list by city or country.
2. **Sort businesses by income.** The cards stand in buy order, so in a late game the lemonade stand is on top and the businesses that earn the most are at the bottom of a 4.6-screen list (13 cards of about 290 px). Add a choice to sort by income; buy order stays the default.
3. **Funds on the exchange.** Bank holds five things: the economy card, savings, bonds, funds and loans. Index funds are bought like shares, so put them in Børs with stocks and crypto; Bank keeps savings, bonds and loans.

## Football club

From a look at why the club feels stale (10 October 2026). The club's money hardly matters: in 4. divisjon it loses about kr 15k a day (wages ~68k against tickets ~25k and sponsor ~28k), and the opponents are drawn anew every season, so no league ever feels familiar.

1. **Stadium upgrades.** Spend money on the stadium — more seats, floodlights, a VIP lounge — to raise ticket income (today a flat `billett` per division) and the club's value. A division could ask for a stadium of a certain size before you're let up. The stadium drawing (`Stadion.tsx`) belongs to the graphics track; it should show the upgrades.
2. **Fixed league teams.** Today `nySerie` draws nine new opponents every season. Keep the same teams from season to season instead — the ones that finish top go up, the bottom ones come down from the division above — so names come back, and old foes with them.

## Room to grow

From a look at whether the setup holds as the game grows (10 October 2026). The engine's rules, the saves (22 versions, each tested from a real old save) and the tests hold up; these are the places that won't. Measured after Pack 62. In Packs 65–66 and G12.

1. **A home for new areas.** The tab bar holds five tabs, and Investeringer, Luksus and Profil each have four parts (Profil already needs the squeezed `segment-fem` row). Bigger new areas (your own listed company, more sports) have nowhere obvious to go. Decide the rule before the next one: when something gets its own tab, how many parts a tab may have, and what a sixth place would look like.
2. **Load drawings and maps when needed.** The game is one 1 MB script (300 kB gzipped) that a phone must parse before the first frame. The drawings (`Illustrasjoner.tsx`, 6 449 lines), the maps and the gallery could load when they are first shown.
3. **Smaller screen files.** `Investeringer.tsx` is 1 053 lines with 15 components and `handlinger.ts` 964 lines. Split Investeringer into a file per part (Oversikt, Børs, Selskaper, Bank) and the actions by area.

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
