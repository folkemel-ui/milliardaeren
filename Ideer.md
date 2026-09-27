# Ideer

The idea list for a business-empire game inspired by *Business Empire: RichMan*. Nothing is set in stone. We build in packs of 3–4 items at a time. When an item is done it is removed from this list and the list is renumbered; the git log holds the history. Refer to items by title, not number.

Stack: React + Vite + TypeScript, pure seeded engine (no `Math.random`/`Date.now` in the engine), Norwegian UI, NOK, no new dependencies.

## Businesses

1. **Industry ladder.** Kiosk → café → restaurant → hotel chain → bank → oil company, and so on. Each step unlocks at a net-worth threshold, and each industry has its own cost, income and growth curve.

2. **Levels and upgrades.** Each business can be levelled up for more income, with milestones at levels 25, 50 and 100 that double its income. Costs grow exponentially, so it matters which business you upgrade next.

3. **Staff and managers.** Hiring employees raises income. A manager keeps the business running while you are offline and is required for idle income. Staff are a salary cost, so hiring is a real trade-off.

4. **Merging businesses.** Merge two businesses of the same type and level into one bigger one with a bonus. This gives a use for duplicates and a way to grow in steps.

5. **Football club.** Buy a club in a low division. Buy players, win matches, get promoted and win trophies. It gives prestige and income from tickets and sponsors, but player wages are a big cost.

6. **Startups.** Invest in rounds (seed, Series A, B and so on). Your share gets diluted when new money comes in. The company can go bankrupt, be sold or go public on the stock exchange.

## Investments

7. **Stock exchange.** 8–10 fictional companies with seeded price movements, weekly dividends and three risk levels. Buy and sell with a small fee.

8. **Crypto market.** Much bigger swings, trading every day of the week, and a sentiment meter. Large orders move the price for several days.

9. **Real estate.** Apartments, office buildings and islands in different cities. They earn rent every month and their value can rise or fall with the market.

10. **Bank and loans.** Borrow to grow faster, with interest and a credit limit based on net worth. Too much debt leads to margin calls and, at worst, bankruptcy.

11. **Auto-trading.** Set target prices for automatic buying and selling of stocks and crypto, so the market works for you while you are away.

## Progression

12. **Achievements and a record book.** Milestones (first million, first billion, 10 businesses and so on) and personal records such as the biggest single trade and the fastest route to a billion.

## Luxury and status

13. **Luxury collection.** Cars, yachts, private jets and watches. They count toward net worth and raise your status level, which gives small bonuses (such as better loan terms and access to exclusive properties).

14. **Garage, harbor and hangar.** Space is limited, so you have to build more room to store more cars, boats and planes. This adds a cost that stops endless buying.

15. **Travel.** A private jet unlocks new cities (Oslo → Stockholm → London → New York → Dubai …) with new businesses, properties and markets.

## Risk

16. **Taxes and a tax audit.** Progressive tax on profit, with late fees if you don't pay. A risky offshore option lowers your tax but carries a chance of an audit and seizure.

17. **Rivals.** AI tycoons on a leaderboard who grow on their own. You can buy shares in their companies and try a hostile takeover.

## Presentation

18. **SVG icons.** An icon for each business, luxury item and property, built from simple shapes. Judge them at 5× in a gallery view.

19. **Newspaper.** A daily headline feed that reacts to the market, events and what the player does ("Crypto crashes 40 %", "Unknown investor buys football club").

## Layout

20. **Light "clean finance" theme.** White and light grey with green for gains and red for losses, like a banking app or Nordnet. The dark theme already uses color tokens in `styles.css`, so this is a new token block plus a way to switch.

21. **Date and time bar.** Shows the in-game day and week, which is useful for dividends, rent, taxes and match days.

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

**Layout ideas**
- **Colorful cartoon style.** Bright colors, rounded shapes and big icons.
- **Light/dark toggle** in the settings, switching between the two themes above.
- **Five tabs with icons and text:** Businesses, Investments, Property, Luxury, Profile.
- **Tabs that open as you progress.** Locked tabs stay greyed out with a padlock until you reach the right net worth.
- **Notification badges** on tabs when something needs attention.
- **Business cards.** Icon, name, level, income per second and a big Upgrade button with the price.
- **Progress bar per business** that fills up and pays out when full.
- **Buy ×1 / ×10 / ×100 / Max** toggle.
- **Locked businesses** shown greyed out with their unlock requirement.
- **Business detail page** with staff, manager, merging and stats.
- **Investment sub-tabs:** Stocks, Crypto, Startups, Bank.
- **Stock list with sparklines.**
- **Full stock chart** with time ranges and Buy/Sell buttons.
- **Portfolio summary** showing total value, today's change and total return.
- **Map view for Property.**
- **Showroom for Luxury** that you swipe through.
- **Garage, harbor and hangar grid** with slots.
- **Football club screen** with the league table, next match, squad and trophy cabinet.
- **Floating "+kr" numbers** on payouts.
- **Gold flash and confetti** at milestones.
- **Toast messages** for events.
- **Newspaper pop-up** each new in-game day.
- **Welcome-back screen** when the app opens.
- **Phone frame on PC:** a centered column about 420 px wide.
- **Wide layout on PC** with a sidebar and two columns.
