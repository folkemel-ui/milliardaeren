# Ideer

The idea list for a business-empire game inspired by *Business Empire: RichMan*. Nothing is set in stone. We build in packs of 3–4 items at a time. When an item is done it is removed from this list and the list is renumbered; the git log holds the history. Refer to items by title, not number.

Stack: React + Vite + TypeScript, pure seeded engine (no `Math.random`/`Date.now` in the engine), Norwegian UI, NOK, no new dependencies.

## Pack plan

A suggested order, grouped so each pack feels complete when played. The order is a suggestion; packs can be swapped or reshuffled at any time. Items are referred to by title.

- **Pack 9 – Risk and competition:** Taxes and a tax audit (builds on the year-end report) · Rivals · Auto-trading
- **Pack 10 – Look and feel:** SVG icons · Light "clean finance" theme
- **Pack 11 – Big new systems:** Startups · Football club · Travel · Merging businesses (needs a rethink first)

## Businesses

1. **Merging businesses.** Merge two businesses of the same type and level into one bigger one with a bonus. Note: since Pack 2 you can only own one of each type (extra copies broke the balance). Merging therefore needs a rethink first, for example allowing copies again but only as merge material, or merging two different types into a chain.

2. **Football club.** Buy a club in a low division. Buy players, win matches, get promoted and win trophies. It gives prestige and income from tickets and sponsors, but player wages are a big cost.

3. **Startups.** Invest in rounds (seed, Series A, B and so on). Your share gets diluted when new money comes in. The company can go bankrupt, be sold or go public on the stock exchange.

## Investments

4. **Auto-trading.** Set target prices for automatic buying and selling of stocks and crypto, so the market works for you while you are away.

## Luxury and status

5. **Travel.** A private jet unlocks new cities (Oslo → Stockholm → London → New York → Dubai …) with new businesses, properties and markets. Since Pack 4 there are three planes in the Luxury tab and the properties already have Norwegian locations, so travel can build on both. Since Pack 8 the Property tab has a map of Norway, which could be extended with new cities and countries.

## Risk

6. **Taxes and a tax audit.** Progressive tax on profit, with late fees if you don't pay. A risky offshore option lowers your tax but carries a chance of an audit and seizure. Since Pack 7 the game has year-end reports with income per source, a natural basis for the tax bill.

7. **Rivals.** AI tycoons on a leaderboard who grow on their own. You can buy shares in their companies and try a hostile takeover.

## Presentation

8. **SVG icons.** An icon for each business, luxury item and property, built from simple shapes. Judge them at 5× in a gallery view.

## Layout

9. **Light "clean finance" theme.** White and light grey with green for gains and red for losses, like a banking app or Nordnet. The dark theme already uses color tokens in `styles.css`, so this is a new token block plus a way to switch.

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
- **Light/dark toggle** in the settings, switching between the two themes above.
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
