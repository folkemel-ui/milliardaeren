# Ideer

The idea list for a business-empire game inspired by *Business Empire: RichMan*. Nothing is set in stone. We build in packs of 3–4 items at a time. When an item is done it is removed from this list and the list is renumbered; the git log holds the history. Refer to items by title, not number.

Stack: React + Vite + TypeScript, pure seeded engine (no `Math.random`/`Date.now` in the engine), Norwegian UI, NOK, no new dependencies.

## Pack plan

A suggested order, grouped so each pack feels complete when played. The order is a suggestion; packs can be swapped or reshuffled at any time. Items are referred to by title.

Version 1.0 was reached with Pack 43.

Packs 47–51 are the road to v2.0:

- **Pack 47 – Solid ground:** Ready for years of saves, A real late game
- **Pack 48 – Your businesses, deeper:** Specialization at level 50, Staff with names and skills
- **Pack 49 – The world turns:** Economic cycles, The calendar comes alive
- **Pack 50 – Things happen:** Random events with choices, Rivals that fight back, Daily and weekly missions
- **Pack 51 – The top (v2.0):** Take your group public, A finish line, Start-over bonus

## Road to v2.0

The theme of 2.0: what do I do once I'm rich? Plus the depth and the solid ground to carry it.

1. **Ready for years of saves.** The balance bench runs past 1 mrd (today it stops there) and prints the time to 10 mrd, 100 mrd and 1 trillion. Every old save version (there are 20) is migrated to the latest in a test. The game is checked on a slow phone: two hours away costs ~300–390 ms CPU against the 500 ms limit. A short outside playtest before 2.0 is called done.
2. **A real late game.** The ladder goes to a business that unlocks at kr 1.9 trillion, the goal ladder ends at Billionær (kr 1 trillion) and status tops out at Udødelig (1 000 points) — but nothing after 1 mrd has been measured or tuned. Measure it with the bench above, tune it, and give the hours after the first billion their own goals.
3. **Specialization at level 50.** Choose a direction per business, for example *Volume* (more income) or *Premium* (higher value and status). The choice is permanent.
4. **Staff with names and skills.** Junior, experienced or star; stars cost more but give more. (Managers with traits stay parked for now.)
5. **Economic cycles.** A policy rate announced in Avisa, and boom and recession phases that move stocks, property and loan interest together. Includes a choice of fixed or variable rate (the variable rate follows the policy rate), and industry trends — weeks where "coffee is hot" (+20 % for cafés) or "the oil price falls", announced in the paper.
6. **The calendar comes alive.** The calendar (from Monday 4 January 2027) starts to matter: holidays (Easter, 17 May with the sausage stand +200 %, Christmas), seasons and weather in the paper (sun for the lemonade stand, snow for the ski resort and the cabin), and weekday effects (restaurants and hotels earn more at the weekend, banks and offices on weekdays).
7. **Random events with choices.** Crashes, booms, strikes, scandals and inspections, each with two or three ways to respond. Drawn from a hash, not the die.
8. **Rivals that fight back.** Today the rivals grow and can be taken over, but never come after you. Let them bid against you for landmarks, try a hostile takeover of one of your businesses, or poach your staff.
9. **Daily and weekly missions.** Short goals with small rewards, so a five-minute visit has a point too.
10. **Take your group public.** List your own group on the exchange with its own ticker: sell shares to raise money, the price follows your quarterly results, and the shareholders can be unhappy.
11. **A finish line.** Reaching #1 on the Forbes list or kr 1 trillion gives a proper ending: a closing screen and a front page in the paper. Then choose to keep playing or start over.
12. **Start-over bonus.** Sell everything for "legacy points" that give a permanent bonus in the next game.

## Graphics

13. **Real paintings.** The 12 paintings are generated miniatures today: the same landscape shape in each painting's three colours, in the same gold frame. Draw each as its own small work in its artist's style — Solheim's romantic fjords, Aske's harbour realism, Lind's modern colour fields, Vik's contemporary work — and hang the collection on a gallery wall.
14. **City properties that look like their city.** The 8 city properties from Pack 44 reuse the base drawings (`hybel-oslo` is the plain Hybel, `hytte-lofoten` the plain Hytte). Give them their own: a Bryggen house in Bergen, a rorbu in Lofoten, Bakklandet in Trondheim, a glass office block in Stavanger, and so on.
15. **Proper startup logos.** Startups are still initials on a coloured tile. Give them marks like the 21 in `Papirlogo.tsx`, with a symbol for the industry.
16. **Detail scenes for everything you own.** The large animated `Scene` exists only for businesses; properties, landmarks, luxury and paintings top out at 64 px. Give them the same big scene when opened — this is also the parked *Showroom for Luxury*.
17. **Reports as statements.** The weekly, monthly and yearly reports (`Oppgjor.tsx`) have no graphics. Give them a bar per income source and a before → after for net worth, laid out like an annual report.
18. **Loading screen and first frame.** The coin with the rising M animates on the loading screen, and the first view fades in instead of appearing all at once.

## Parked (not chosen yet)

These ideas were suggested but not picked. They stay here so they can be moved up later. They are not part of any pack until they are chosen.

**Game ideas**
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
- **Vacancy and tenants.** Properties can stand empty and bad tenants cost money; a property manager reduces the risk.
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
