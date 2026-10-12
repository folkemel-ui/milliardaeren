# Butikken: App Store og Google Play

Det spillet trenger for å sendes inn (Pakke 97). Mappa legges ikke ut på nettsiden.

## Det som ligger klart

- **Butikkikonet:** `public/ikon-1024.png`, 1024 × 1024 uten gjennomsiktighet (App Store).
  Lages av `node scripts/lag-ikoner.mjs` fra de samme formene som `public/ikon.svg`.
- **Androids «maskable» ikon:** `public/ikon-maskable-512.png`, mynten på 80 % så alt ligger
  innenfor den sikre sirkelen.
- **Skjermbildet:** `butikk/skjermbilder/bedrifter-1290x2796.png` (iPhone 6.7–6.9") og en
  mindre utgave i manifestet (`public/skjermbilder/bedrifter.png`, 860 × 1864). Et spill midtveis,
  rundt 40 mrd, mørkt tema. Lages på nytt med `node scripts/lag-skjermbilder.mjs` (bygger spillet,
  åpner det i Chrome uten vindu og tar bildet; spillet står i `scripts/skjermbilde-spill.ts`).
- **Manifestet:** `id`, `categories` og `screenshots` (`public/manifest.webmanifest`).
- **Uten nett fra første start:** service workeren lagrer hele utgivelsen ved første besøk
  (Pakke 96), så appen starter uten dekning.

## Det innebygde skallet (ikke laget ennå)

Appen i butikkene blir det samme bygget (`dist/`) inne i et Capacitor-skall, i et eget
repo, så dette repoet fortsatt ikke har noen avhengigheter utover React og Vite. iOS må
bygges på en Mac med Xcode eller en byggetjeneste i skyen; Android kan bygges her.

Skallet trenger programtillegget **`@capacitor/filesystem`**. Spillet finner det på
`window.Capacitor` mens det kjører (`src/state/speil.ts`) og gjør da to ting:

- hver lagring skrives også til `milliardaer/lagring.json` i appens datamappe
  (`Directory.Data`), fordi iOS kan tømme en webvisnings lagring når telefonen er full;
- starter spillet uten lagring og fila har et spill, legges det tilbake og siden lastes på nytt.

I nettleseren finnes ikke `window.Capacitor`, og ingenting av dette skjer.
