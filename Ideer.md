# Ideer

The idea list for a business-empire game inspired by *Business Empire: RichMan*. Nothing is set in stone. We build in packs of 3–4 items at a time. When an item is done it is removed from this list and the list is renumbered; the git log holds the history. Refer to items by title, not number.

Stack: React + Vite + TypeScript, pure seeded engine (no `Math.random`/`Date.now` in the engine), Norwegian UI, NOK, no new dependencies.

## Pack plan

A suggested order, grouped so each pack feels complete when played. The order is a suggestion; packs can be swapped or reshuffled at any time. Items are referred to by title.

- **Pack 24 – Living map:** Land and landmarks on the map, Regional prices and price colors, Rent per city, Zoom into a city
- **Pack 25 – Polish:** Keyboard focus in the newspaper and welcome screen, Stray text and number formatting in the locked-business list, Clearer status line in Luksus
- **Later:** Hotels abroad and holiday apartments (bring up the parked Map ideas at the same time)

## Property

1. **Hotels abroad and holiday apartments.** Properties with seasons: Spain pays best in summer, the Alps in winter. Since Pack 11 the planes unlock six foreign cities with a property each and a world map in the Property tab, so new places (Spain, the Alps) can be added there with the same plane requirement. When this comes up, bring up the parked **Map ideas** too.

## Interface

2. **Keyboard focus in the newspaper and welcome screen.** Move focus into the window when it opens, keep it there, and give it back when the window closes.
3. **Stray text and number formatting in the locked-business list.** "24" and "H" show up among the locked businesses. Amounts are formatted unevenly: "12,00 mill" next to "150 mill".
4. **Clearer status line in Luksus.** "rente 3,0 % per time" is hard to understand there. Explain what the status level does to the interest rate.

## Map

5. **Land and landmarks on the map.** Farms, forest and the four landmarks get their own small symbols on the map. Landmarks aren't shown at all today.
6. **Regional prices and price colors.** Separate property indexes for Oslo, Bergen, Stavanger and the mountains, instead of one index for the whole country. Each city is tinted green or red by how its prices have moved.
7. **Rent per city.** Cities where you have buildings rented out show a small label with rent per second, and a coin pops up when the rent comes in. Cities with nothing rented out show nothing.
8. **Zoom into a city.** Tap-and-hold or pinch to see a small street view where each property is a building that changes look with its standard and renovation.

## Parked (not chosen yet)

These ideas were suggested but not picked. They stay here so they can be moved up later. They are not part of any pack until they are chosen.

**Game ideas**
- **Start-over bonus.** Sell everything for "legacy points" that give a permanent bonus.
- **Temporary boosts.** Marketing campaigns for ×2 income for a limited time, followed by a cooldown.
- **Offline income report.** A "while you were away" screen with a Claim button and an hour cap that managers can raise.
- **Daily and weekly missions.**
- **Random events.** Crashes, booms, strikes, scandals and inspections, each with choices for how to respond.
- **Auction house.** Rare cars and art sold at auctions with rising bids.
- **Sound.** Synthesized coin and level-up sounds using Web Audio.
- **Other sports clubs.** Hockey and basketball, in addition to football.

**Expansions of what exists**
- **Specialization at level 50.** Choose a direction per business, for example *Volume* (more income) or *Premium* (higher value and status). The choice is permanent.
- **Opening hours and rush hours.** The kiosk earns most in the evening, the café in the morning and the restaurant at dinner, using the game clock.
- **Weekday effects.** Restaurants and hotels earn more at the weekend, banks and offices on weekdays.
- **Staff with names and skills.** Junior, experienced or star; stars cost more but give more.
- **Managers with traits.** Careful (safe offline income), Aggressive (more income, risk of mistakes) or Night owl (longer offline cap).
- **Business history.** A graph per business of income over time, when it was started and total earned.
- **Selling businesses.** Sell to a buyer at a price based on income, with bids that vary.
- **Industry trends.** Weeks where "coffee is hot" (+20 % for cafés) or "oil price falls", announced in the paper.
- **Limit orders.** "Buy NLT if the price falls to 450"; a first step toward auto-trading.
- **Watchlist.** Star the stocks and coins you follow so they show at the top.
- **Crypto events.** Listing on a big exchange, hacked exchange, and "rug pull" for the smallest coins.
- **Short selling.** Bet against a stock; risky and requires a loan.
- **Fixed or variable rate.** A variable rate follows a policy rate announced in the paper.
- **Credit rating.** AAA to C based on how you handle debt; affects interest and credit limit.
- **Mortgages.** Borrow against specific properties at a better rate.
- **Vacancy and tenants.** Properties can stand empty and bad tenants cost money; a property manager reduces the risk.
- **Building your own.** Buy a plot and build over several in-game days: cheaper, but ties up money.
- **Holiday home effect.** The cabin and island give status, and weekend rental income.
- **Car value that changes.** Classic cars rise in value, new cars lose value.
- **Using your items.** A boat trip on Sunday for status that day, a jet to "a meeting".
- **Collection bonuses.** All the cars gives "Car collector", all the watches "Watch nerd", and so on.
- **Events you can attend.** Charity gala, yacht race, opera premiere: cost money, give status, appear in the paper.
- **Holidays.** Easter, 17 May (sausage stand +200 %), Christmas.
- **Seasons and weather.** The weather in the paper affects business: sun for the lemonade stand, snow for the cabin.
- **Paper ads.** Offers in the paper, for example "Cabin for sale at 20 % discount, today only".
- **Rewards for achievements.** Small permanent bonuses or cash rewards.
- **Hidden achievements.** "Bought at the bottom", "Night owl" and so on.
- **Titles for your largest business.** "Lemonade king", "Sausage baron" and so on, shown on Profile.
- **Statistics page.** Income per source (businesses, rent, dividends) as a graph over time.

**Map ideas** (bring these up again with Hotels abroad and holiday apartments)
- **Businesses on the map.** Your kiosks, cafés and so on appear as small icons in the cities, so the map shows your whole empire.
- **Rivals on the map.** Each rival has a color; cities where they own landmarks or businesses are marked.
- **City card.** Tapping a city opens a card on the map with what's for sale, the price trend and rent, with Buy buttons right there.
- **City owner bonus.** Own every property in a city for a crown on the map and a small rent bonus there.
- **Deals on the map.** Markers pop up now and then, like "Plot for sale in Trysil, 20 % off today", and disappear after a while.
- **Local events.** "Festival in Bergen this week, +30 % rent", shown as a flag on the city and mentioned in the paper.
- **Movement.** Planes fly the routes on the world map, boats move along the coast, and a pulse runs out from cities you buy in.
- **Day and night.** The map darkens in the evening and lights come on in your cities, following the game clock.
- **Fog over what's locked.** Cities you can't buy in yet are hidden in fog that clears as your net worth grows.
- **A growing world map.** Bigger jets open new continents, and the world map widens and gets proper coastlines.

**Layout ideas**
- **Tabs that open as you progress.** Locked tabs stay greyed out with a padlock until you reach the right net worth, so a new player is not met with everything at once.
- **Wide layout on PC.** A sidebar and two columns on a wide screen, instead of a phone-width column in the middle.
- **Colorful cartoon style.** Bright colors, rounded shapes and big icons.
- **Notification badges** on tabs when something needs attention.
- **Progress bar per business** that fills up and pays out when full.
- **Showroom for Luxury** that you swipe through.
- **Floating "+kr" numbers** on payouts.
