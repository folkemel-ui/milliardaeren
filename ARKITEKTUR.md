# Arkitektur: tilfeldighet og trygge endringer

Motoren i `src/engine` er ren og seedet: samme lagring og samme antall sekunder gir alltid samme resultat. Det er det som gjør gullmesteren, balansebenken og tid borte mulig. Denne notatet forklarer hvor tilfeldighetene kommer fra, hvilke som påvirker hverandre, og hvordan nytt innhold legges til uten å endre spill folk alt har.

## Grunnreglene

- **Ingen `Math.random` eller `Date.now` i `src/engine`.** Klokka bor i `state/lager.ts`, som gir motoren et antall sekunder. Konfetti og sveip i UI-et kan bruke `Math.random`; motoren kan ikke. Eneste klokke i motoren: `performance.now` i `simulering.ts`, som bare leses når ytelsestesten slår på delmålingen (`maalDeler`, Pakke 64) — den måler tiden og styrer ingenting.
- **Tiden går i hele sekunder** (`simulering.ts`). `simuler(s, n)` er det samme som `n` kall à ett sekund — gullmesteren sjekker det.
- **Datoer kommer fra dagnummeret**, aldri fra klokka (`kalender.ts`). Én spilldag er 300 sekunder.
- **Handlinger er rene funksjoner** (`handlinger.ts`): tilstand inn, ny tilstand eller feil ut. De trekker aldri fra terningen.

## Tre slags tilfeldighet

### 1. Hovedterningen (`s.frø`)

`Terning` i `rng.ts`. `simuler` lager én terning fra `s.frø`, bruker den gjennom alle sekundene, og skriver frøet tilbake. **Alt som trekker fra den, deler én strøm** — trekker én ting ett tall mer, får alt etter den andre tall.

Rekkefølgen per sekund:

1. **Hvert 5. sekund:** `markedstikk` — stemningen (2 trekk), så hvert *gamle* papir i `PAPIRER`-rekkefølge (2 trekk, pluss hopp for de som kan hoppe; aksjer står over i helgene), så eiendomsindeksen (2–4 trekk). Deretter `rivaltikk`: 2 trekk per rival, også de som er kjøpt opp.
2. **Ved dagsskiftet:** `gisUtAvis`, som trekker i denne rekkefølgen:
   - selskapsnyheter (hverdager: ett `sjanse`, og ved treff tre trekk til),
   - bokettersyn (ett trekk — bare på månedsskiftet og bare når noe er unndratt),
   - startups (ett eller to trekk per aktivt selskap, ett `sjanse` for et nytt, og fire trekk hvis det kommer),
   - sosietetssaken (fra statusnivå 2),
   - **fyllsakene** (se under).

Også `lagMarked` og `lagEiendomsindeks` bruker terningen når et nytt spill lages.

### 2. Egne terninger

Systemer som skulle kunne legges til uten å røre hovedstrømmen, har sin egen:

| System | Frø | Går fremover |
|---|---|---|
| Kunst | `kunst.frø` | hver dag i `kunstVedDagsskifte` |
| Klubb | `klubb.frø` (fra en hash av navn og dag) | hver dag i `klubbVedDagsskifte` |

Klubbens terning trekker også hele ligaen (Pakke 66): de andre divisjonene når klubben kjøpes, og opp- og nedrykket der ved hver sesongslutt. Klubber fra før Pakke 66 fikk divisjonene sine i migreringen 22 → 23 med en egen terning fra en hash av navn og sesong, så `klubb.frø` sto urørt.

### 3. Hasher (ingen terning)

`tilfeldig(hashTekst(nøkkel))` gir samme tall for samme nøkkel, uten tilstand. Brukes når svaret skal kunne vises på forhånd eller aldri skal påvirke noe annet:

| System | Nøkkel |
|---|---|
| Kø (`hender.ts`) | `hashTekst('kø') + sek` |
| Vær på gårdene (`jord.ts`) | ingen egen nøkkel fra Pakke 54: avlingen regnes fra ukas sju dager med norsk vær |
| Rivaler kjøper landemerker | `<landemerke>:<rival>:<dag>` |
| Rivalens pris i fusjoner | `<rival>:<bransje>:<dag>` |
| Kvartalsrapporter | `estimat:<id>:<dag>`, `resultat:<id>:<dag>` |
| Regioner | `marked.regioner.frø` + region + tikk |
| Papirene fra versjon 17 | `Hashkilde` på `marked.nyeFrø` + id + tikk |
| Klubb til salgs | `<navn>:<dag>` |
| Ansattnavn (`ansatte.ts`) | bedrift + sek + antall ved ansettelse; bedrift + plass for ansatte fra før Pakke 48 |
| Konjunkturen (`verden.ts`) | `konjunktur:<periode>` (28 dager per periode; periode 0 er alltid normal) |
| Dagens vær (`verden.ts`) | `dagsvær:<dag>` for Norge, `dagsvær:<sted>:<dag>` for Alpene og Syden (Pakke 54), med sjanser etter sesong |
| Ledighet (`utleie.ts`) | `ledighet:<by>\|<uke>` |
| Dårlig leietaker (`utleie.ts`) | `leietaker:<by>\|<uke>` |
| Ukas bransjetrend (`verden.ts`) | `trend:<spilluke>` |
| Valutakursene (`valuta.ts`, Pakke 59) | `valuta:<sti>:<lag>:<knute>` — tre glatte lag (14, 4 og 1 spilldag mellom knutene); DKK følger EUR, AED følger USD. Et spill fra før versjon 22 har `valutaanker` så kursen står på 1 der det var |

`Hashkilde` (`rng.ts`) gir en rekke tall fra én hash, uten å lagre noe.

Verden fra Pakke 49 er den samme i alle spill: nøklene har ikke spillets frø i seg (et forsøk med regionfrøet fikk konjunkturen til å endre seg når en test fjernet regionene). Konjunkturen gir aksjene og eiendomsprisene ekstra drift i `markedstikk`, men trekker ikke ett tall mer fra terningen. Sakene den gir i avisa forskyver likevel terningen etter første dagsskifte, som alle nye saker gjør.

Ukas bransjetrend (Pakke 53, `bransjer.ts`) gir aksjen i den hete eller kalde bransjen ekstra drift på samme måte — uten et trekk mer. En selskapsnyhet som treffer bedriften din i bransjen, bruker nyheten terningen alt har trukket; ingen nye trekk.

Filialene (Pakke 59, `filialer.ts`) ganger inntekten før lønn med andelen og regionens `byfaktor` — samme regionindeks som eiendommen, uten et trekk mer. Uten filialer er faktoren nøyaktig 1, så ingenting annet flytter seg. Boten kjøper filialer bare som smart bot (benken); gullmesteren ser dem aldri.

Ditt eget kurstrykk (Pakke 56) står i `Kurs.trykk`, ikke i `avvik`: kursen er `fundament · e^(avvik + trykk)`, og trykket trekkes tilbake like fort som avviket — regnet ut, uten terningen. Fondene ser bort fra det (`markedskurs`). Gamle lagringer har trykket fra før i avviket og ingen `trykk`; det er greit. Obligasjonenes markedsrente regnes av konjunkturens hash og hvor mye av fasen som er igjen — heller ikke den trekker noe.

## Avisas bivirkning

Avisa har 3–5 saker (`avis.ts`). Først samles de ekte sakene; mangler det for å nå `MIN_SAKER`, fylles det på med lokalsaker med `t.velg(LOKALT)` — **fra hovedterningen**, og en duplikat koster et nytt trekk.

Det betyr at **alt som legger til eller fjerner en sak en dag, flytter hovedterningen** for resten av spillet — også systemer som selv bruker hasher eller egen terning: kvartalsrapporter, kunstutstillinger, avlinger, landemerker, klubbkamper, rivaler, markedssaker og dine egne handlinger. Sosietetssaken trekker også når avisa allerede er full.

Økonomien blir ikke dårligere av det — bare annerledes. Men gullmesterens `frø` endrer seg, og da må fasiten oppdateres med en forklaring.

## Nytt innhold uten å endre gamle spill

- **Nytt system med tilfeldighet:** bruk en hash eller en egen terning, aldri `s.frø`. Se kunst, klubb og kø.
- **Ny region:** legg den i `REGIONER` (`regioner.ts`) og skriv en migrering som gir den `nyRegion(frø, id, lengde)` med landsindeksens historikklengde — se 19 → 20 (Trøndelag og Nord). Hver region har sin egen hash, så de gamle står som før. `regiontikk` hopper over en region som mangler.
- **Samme bygg i en ny by:** en ny `EiendomId` (`<bygg>-<by>`) i `EIENDOMSTYPER`, sortert inn etter pris, og en linje i `ILLUSTRASJONER` som peker på samme tegning. Ingen migrering: antallet er 0 til du kjøper.
- **Sesong** (ferieboligene fra Pakke 45) kommer fra kalenderen — månedens faktor i `SESONGER` — ikke fra noen terning. Snittet over året skal være 1.
- **Nye papirer:** legg dem i `NYE_PAPIRER` (`marked.ts`) så de bruker `Hashkilde`. Fondene beholder medlemmene de hadde (`fond.ts`), ellers hopper fondskursen. Hver aksje trenger en `RAPPORTDAG` på høyst 26.
- **Nye felt i tilstanden:** valgfrie felt kan leses med `?.`/`?? 0` uten migrering (som `handsalg`, `ko`). Endrer formen seg ellers: skriv migreringen i `state/migrering.ts` **før** `SPILLVERSJON` i `engine/start.ts` bumpes — ellers starter en åpen dev-side et nytt spill og legger det gamle i `milliardaer.lagring.korrupt`. Migreringene kjører dagens motorkode på gamle former, så motorfunksjoner som leser nyere felt bruker `?.`.
- **Nye saker i avisa:** flytter terningen (se over). Det er greit, men si det i commit-meldingen når gullmesteren oppdateres.

## Testene som vokter dette

- **Gullmesteren** (`engine/__tester__/gullmester.test.ts`): boten spiller 4 timer, og et fingeravtrykk (frø, kontanter, formue, bedrifter) sammenlignes med `gullmester.fasit.json`. Oppdater med `$env:OPPDATER_FASIT=1; npm test`, og forklar endringen i commit-meldingen.
- **Balansebenken** (`engine/__tester__/balansebenken.test.ts`): `$env:BENK=1; npx vitest run balansebenken` skriver ut hvor lang tid boten bruker til hver milepæl. Målet er rundt 9 timer til milliarden.
- **Migreringstestene** (`state/__tester__/migrering.test.ts` og `pakkeNN.test.ts`): hver versjon løftes til den nyeste.
