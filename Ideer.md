# Ideer

The idea list for a business-empire game inspired by *Business Empire: RichMan*. Nothing is set in stone. We build in packs of 3–4 items at a time. When an item is done it is removed from this list and the list is renumbered; the git log holds the history. Refer to items by title, not number.

Stack: React + Vite + TypeScript, pure seeded engine (no `Math.random`/`Date.now` in the engine), Norwegian UI, NOK, no new dependencies.

## Businesses

1. **Merging businesses.** Merge two businesses of the same type and level into one bigger one with a bonus. Note: since Pack 2 you can only own one of each type (extra copies broke the balance). Merging therefore needs a rethink first, for example allowing copies again but only as merge material, or merging two different types into a chain.

2. **Football club.** Buy a club in a low division. Buy players, win matches, get promoted and win trophies. It gives prestige and income from tickets and sponsors, but player wages are a big cost.

3. **Startups.** Invest in rounds (seed, Series A, B and so on). Your share gets diluted when new money comes in. The company can go bankrupt, be sold or go public on the stock exchange.

## Investments

4. **Auto-trading.** Set target prices for automatic buying and selling of stocks and crypto, so the market works for you while you are away.

## Progression

5. **Achievements and a record book.** Milestones (first million, first billion, 10 businesses and so on) and personal records such as the biggest single trade and the fastest route to a billion.

## Luxury and status

6. **Travel.** A private jet unlocks new cities (Oslo → Stockholm → London → New York → Dubai …) with new businesses, properties and markets. Since Pack 4 there are three planes in the Luxury tab and the properties already have Norwegian locations, so travel can build on both.

## Risk

7. **Taxes and a tax audit.** Progressive tax on profit, with late fees if you don't pay. A risky offshore option lowers your tax but carries a chance of an audit and seizure.

8. **Rivals.** AI tycoons on a leaderboard who grow on their own. You can buy shares in their companies and try a hostile takeover.

## Presentation

9. **SVG icons.** An icon for each business, luxury item and property, built from simple shapes. Judge them at 5× in a gallery view.

10. **Newspaper.** A daily headline feed that reacts to the market, events and what the player does ("Crypto crashes 40 %", "Unknown investor buys football club").

## Layout

11. **Light "clean finance" theme.** White and light grey with green for gains and red for losses, like a banking app or Nordnet. The dark theme already uses color tokens in `styles.css`, so this is a new token block plus a way to switch.

12. **Date and time bar.** Shows the in-game day and week, which is useful for dividends, rent, taxes and match days.

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
- **Tabs that open as you progress.** Locked tabs stay greyed out with a padlock until you reach the right net worth.
- **Notification badges** on tabs when something needs attention.
- **Progress bar per business** that fills up and pays out when full.
- **Buy ×1 / ×10 / ×100 / Max** toggle.
- **Locked businesses: show all of them.** Today only the next locked one is shown.
- **Business detail page** with stats and history. Today staff and manager are in a fold-out panel on the card.
- **Stock chart time ranges.** Today the chart always shows the last 2 hours.
- **Portfolio summary: fuller version** with today's change and total return across everything. Today each tab shows its value and total gain.
- **Map view for Property.**
- **Showroom for Luxury** that you swipe through.
- **Garage, harbor and hangar grid** with slots.
- **Football club screen** with the league table, next match, squad and trophy cabinet.
- **Floating "+kr" numbers** on payouts.
- **Gold flash and confetti** at milestones.
- **Toast messages** for events.
- **Newspaper pop-up** each new in-game day.
- **Welcome-back screen** when the app opens.
- **Wide layout on PC** with a sidebar and two columns.
