# Ideer

The idea list for a business-empire game inspired by *Business Empire: RichMan*. Nothing is set in stone. We build in packs of 3–4 items at a time. When an item is done it is removed from this list and the list is renumbered; the git log holds the history. Refer to items by title, not number.

Stack: React + Vite + TypeScript, pure seeded engine (no `Math.random`/`Date.now` in the engine), Norwegian UI, NOK, no new dependencies.

## Pack plan

A suggested order, grouped so each pack feels complete when played. The order is a suggestion; packs can be swapped or reshuffled at any time. Items are referred to by title.

- **Pack 12 – Football club:** Football club (its own pack; it is the biggest system)
- **Pack 13 – More to own:** More rungs on the industry ladder · Farms and forest · Landmark buildings · Art
- **Later:** Hotels abroad and holiday apartments (Travel is built, so it can go in any pack)

## Businesses

1. **Football club.** Buy a club in a low division. Buy players, win matches, get promoted and win trophies. It gives prestige and income from tickets and sponsors, but player wages are a big cost. The club lives as a card in the Luxury tab that opens its own club screen, so the tab bar stays at five tabs.

2. **More rungs on the industry ladder.** New businesses between and after today's ones, for example a food truck, bakery, gym, car dealership, shipping company and airline, plus Norwegian specials such as a fish farm, ferry company and ski resort. Each needs a place on the ladder, an illustration and a check with the balance bench.

## Property

3. **Farms and forest.** Land that grows slowly in value and gives a yearly income from timber and crops.

4. **Hotels abroad and holiday apartments.** Properties with seasons: Spain pays best in summer, the Alps in winter. Since Pack 11 the planes unlock six foreign cities with a property each and a world map in the Property tab, so new places (Spain, the Alps) can be added there with the same plane requirement.

5. **Landmark buildings.** Unique and very expensive buildings, such as a tall tower in Oslo or a lighthouse. Each one exists only once, and the rivals can buy it before you.

## Luxury and status

6. **Art.** Paintings by made-up Norwegian artists that rise or fall in value. They can be lent to a museum for status.

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
- **Quarterly reports for companies.** Good, as expected or weak results that make prices jump and change dividends.
- **Limit orders.** "Buy NLT if the price falls to 450"; a first step toward auto-trading.
- **Watchlist.** Star the stocks and coins you follow so they show at the top.
- **Stock detail: history and key figures.** Highest and lowest price, dividend yield and your own trades marked on the chart.
- **Crypto events.** Listing on a big exchange, hacked exchange, and "rug pull" for the smallest coins.
- **Index funds.** A fund that follows all 8 stocks, for safer saving.
- **Short selling.** Bet against a stock; risky and requires a loan.
- **Fixed or variable rate.** A variable rate follows a policy rate announced in the paper.
- **Credit rating.** AAA to C based on how you handle debt; affects interest and credit limit.
- **Mortgages.** Borrow against specific properties at a better rate.
- **Vacancy and tenants.** Properties can stand empty and bad tenants cost money; a property manager reduces the risk.
- **Regional price differences.** Separate property indexes for Oslo, Bergen, Stavanger and the mountains.
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

**Layout ideas**
- **Colorful cartoon style.** Bright colors, rounded shapes and big icons.
- **Tabs that open as you progress.** Locked tabs stay greyed out with a padlock until you reach the right net worth.
- **Notification badges** on tabs when something needs attention.
- **Progress bar per business** that fills up and pays out when full.
- **Buy ×1 / ×10 / ×100 / Max** toggle.
- **Locked businesses: show all of them.** Today only the next locked one is shown.
- **Stock chart time ranges.** Today the chart always shows the last 2 hours.
- **Showroom for Luxury** that you swipe through.
- **Garage, harbor and hangar grid** with slots.
- **Football club screen** with the league table, next match, squad and trophy cabinet.
- **Floating "+kr" numbers** on payouts.
- **Gold flash and confetti** at milestones.
- **Toast messages** for events.
- **Newspaper pop-up** each new in-game day.
- **Welcome-back screen** when the app opens.
- **Wide layout on PC** with a sidebar and two columns.
