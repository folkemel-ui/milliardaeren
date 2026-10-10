/**
 * Endringsloggen — en del som hentes ved behov (Pakke 70), så teksten ikke
 * ligger i startskriptet. Den nyeste oppføringen øverst; `versjon` må være lik
 * VERSJON i ui/versjon.ts (pakke43.test.ts passer på det).
 */

import type { Versjonsoppforing } from '../../versjon'

export const ENDRINGER: Versjonsoppforing[] = [
  {
    versjon: '2.6.0',
    navn: '2.6',
    dato: 'Oktober 2026',
    ingress: 'En klubb du kan styre, hjem som fyller rammen — og et spill som varer lenger.',
    punkter: [
      'Troppen: hver spiller har en posisjon, angrep og forsvar, og du velger formasjon. Taktikkene passer nå hver sin kamp.',
      'Et akademi i tre trinn sender opp juniorer hver sesong, med et tak du bare kan ane.',
      'Kampdag: hver kamp får målscorere, minutter og karakterer, og sesongen ender med toppscorer, årets spiller og en oppsummering.',
      'Cupen med alle femti lagene, og Europa for seriemesteren — med TV-penger, premier og et eget regnskap for klubben.',
      'Milepæler etter nivå 100: på 150, 200 og 250 ganger inntekten seg med 1,5.',
      'Nye mål etter den siste opplåsingen — landemerkene, langdistansejeten og New York — og fem skjulte prestasjoner.',
      'De elleve norske boligene og hyttene fyller rammen, og stedet fortsetter ut til sidene.',
      'Roligere lister: markedet i dag på én linje, én påminnelse om retning, stedet i eiendomstittelen og eiendom som kan sorteres.',
      'Fra hotellet og opp koster den første oppgraderingen mer, så det sene spillet går litt roligere.',
    ],
  },
  {
    versjon: '2.5.0',
    navn: '2.5',
    dato: 'Oktober 2026',
    ingress: 'Scener som vokser, hjem du kan se — og et spill som passer på telefonen.',
    punkter: [
      'Bedriftene vokser mellom trinnene: for hvert femte nivå kommer det noe nytt i scenen — flere kunder i køen, vimpler, ståbord, båter, fly og skiløpere.',
      'De tre hjemmene har hver sin scene der rommene står slik du har innredet dem, med egen side og et øyeblikk for hvert rom.',
      'Telefonen på sida har sidemeny og én topplinje i stedet for halve skjermen; fanene åpner der du var, og knappene er lettere å treffe.',
      'Kunst som holder: maleriene trekkes tilbake mot en verdi som følger kunstnerens trend, i stedet for å løpe av gårde.',
      'Startups er et spill: veksten følger risikoen i hver runde, et sterkt team lønner seg og et svakt taper.',
      'Rettferdigere avtaler: fusjoner kan lønne seg fra nivå 100, oppkjøp av en hel rival har gulv, filialer koster det samme når du åpner dem, og Hotellet tjener seg inn like fort som banken.',
      'Lånetaket er satt ned fra to timers inntekt til én.',
      'Lettere på telefonen: tiden du er borte regnes tre ganger så fort på det tyngste spillet, og lagringen skjer sjeldnere og i ro.',
    ],
  },
  {
    versjon: '2.0.0',
    navn: '2.0',
    dato: 'Oktober 2026',
    ingress: 'Et større imperium i en verden som går rundt — og hver tegning laget på nytt.',
    punkter: [
      'Filialer fra nivå 50, ansatte med navn og erfaring, og et valg mellom volum og premium.',
      'Elleve steder i utlandet, fra Marbella til Manhattan, med eiendom i egen valuta.',
      'En verden som går rundt: konjunkturer, styringsrente, vær, helligdager og ukas trender flytter inntekten.',
      'Tre hjem å innrede, statsobligasjoner, aksjer knyttet til bransjene og indeksfondene samlet i Børs.',
      'Søndagsavisa har fått «Uka di»: uka i tall, Forbes-lista og ukas beste og verste kjøp.',
      'Fotballklubben på alvor: bygg ut stadion, oppfyll lisenskravet og møt de samme lagene igjen sesong etter sesong.',
      'Alle tegningene laget på nytt i én stil: bedrifter som ekte steder, scener som følger klokka, ekte kart og malerier.',
      'Tilbake går tilbake, Luksus i deler, hendelsesloggen bak bjella og lister du kan sortere og filtrere.',
      'Raskere start, lettere lagringer, og rettferdigere markeder, eiendom og regnskap.',
    ],
  },
  {
    versjon: '1.0.0',
    navn: '1.0',
    dato: 'Oktober 2026',
    ingress: 'Fra saftbod til milliard — nå ferdig.',
    punkter: [
      'Faner som åpner seg etter hvert, og det neste målet alltid øverst.',
      'Statistikk på Profil: hvor inntekten kommer fra, dag for dag.',
      'Finansgrafer med rutenett, datoer og verdien i hver ende.',
      'Børstidende i ny drakt, med logoer for alle aksjer og portretter av rivalene.',
      'Garasje, havn og hangar du kan se, og et stadion som vokser med divisjonen.',
      'Innstillingene samlet, valg for varsler og bevegelse, og bredt oppsett på PC.',
      'Ærligere regnskap: klubbens resultat skattes, og tvangssalg gir tap.',
    ],
  },
  {
    versjon: '0.5.0',
    navn: '0.5',
    dato: 'September 2026',
    ingress: 'Spillet før versjonsnummeret: alt det store var på plass.',
    punkter: [
      'Tretten bransjer fra saftbod til skisenter, med ansatte, ledere, forbedringer og fusjoner.',
      'Aksjer, krypto og indeksfond med kvartalsrapporter, lån og sparekonto.',
      'Eiendom i norske og utenlandske byer, regioner med egne priser, gårder, skog og landemerker.',
      'Luksus og status, en fotballklubb, kunst og oppstartsselskaper.',
      'Fire rivaler på Forbes-lista som kjøper, selger og kan kjøpes opp.',
      'Skatt hver måned, Børstidende hver dag, og tiden du er borte regnes med.',
    ],
  },
]
