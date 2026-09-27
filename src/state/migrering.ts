/**
 * Lagringsmigrering. Gamle lagringer løftes trinn for trinn i stedet for å
 * forkastes.
 *
 * Kontrakten når SPILLVERSJON bumpes fra N til N+1:
 *   1. Legg en funksjon under nøkkel N i MIGRERINGER som tar en versjon
 *      N-tilstand og returnerer feltene slik versjon N+1 forventer dem.
 *      Kjøreren stempler `versjon` selv — migreringen rører bare feltene.
 *   2. Skriv en test i migrering.test.ts som løfter en ekte N-lagring.
 * Hopp ALDRI over et trinn: en kjede 1→2→3 lar en hvilken som helst gammel
 * lagring nå frem, en direktehopp-migrering gjør det ikke.
 */

import { SPILLVERSJON } from '../engine/start'
import { BEDRIFTSTYPER } from '../engine/innhold'
import { lagEiendomsindeks, lagMarked } from '../engine/marked'
import { EIENDOMSTYPER, START_LAGER } from '../engine/eiendom'
import { lagDagsbilde } from '../engine/avis'
import { sjekkPrestasjoner } from '../engine/prestasjoner'
import { klasseverdier, nullPerKlasse } from '../engine/portefolje'
import { periodestart } from '../engine/oppgjor'
import { START_RIVALER } from '../engine/rivaler'
import type { BedriftstypeId, EiendomId, Spilltilstand } from '../engine/types'

export type Raatilstand = Record<string, unknown>

/** Nøkkel N løfter en lagring fra versjon N til N+1. */
export const MIGRERINGER: Record<number, (s: Raatilstand) => Raatilstand> = {
  /* 1 → 2: bransjestigen, ansatte og ledere. Bedriftene får null ansatte og
     ingen leder, og bokføres til typens pris — i versjon 1 fantes bare nivå 1,
     og saftboden var verdt 250 kr. Høyeste formue hentes fra historikken, som
     har logget nettoformuen hele tiden. */
  1: (s) => {
    const punkter = ((s.historikk as Raatilstand)?.punkter as { verdi: number }[]) ?? []
    return {
      ...s,
      bedrifter: (s.bedrifter as Raatilstand[]).map((b) => ({
        ansatte: 0,
        leder: false,
        investert: BEDRIFTSTYPER[b.type as BedriftstypeId].pris,
        ...b,
      })),
      hoyesteFormue: Math.max(s.kontanter as number, ...punkter.map((p) => p.verdi)),
    }
  },
  /* 2 → 3: markedet og banken. Et ferskt, oppvarmet marked fra spillets eget
     frø, ingen beholdning og ingen gjeld — så nettoformuen er uendret. */
  2: (s) => {
    const { marked, frø } = lagMarked(s.frø as number)
    return { ...s, frø, marked, beholdning: {}, gjeld: 0, totaltUtbytte: 0, hendelser: [] }
  },
  /* 3 → 4: eiendom, luksus og lager. Eiendomsindeksen legges til markedet
     (varmet opp fra spillets frø, starter på 1), ingen eiendom eller luksus,
     og garasjen med sin ene plass — så nettoformuen er uendret. */
  3: (s) => {
    const { indeks, frø } = lagEiendomsindeks(s.frø as number)
    return {
      ...s,
      frø,
      marked: { ...(s.marked as Raatilstand), eiendom: indeks },
      eiendommer: {},
      totaltLeie: 0,
      luksus: [],
      lager: { ...START_LAGER },
    }
  },
  /* 4 → 5: kalender, avis, prestasjoner og rekorder. Avisen starter tom og
     tar dagsbildet nå, så første utgave melder det som skjer fra i dag.
     Prestasjonene du allerede har gjort deg fortjent til, stemples med én
     gang — med dagens tidspunkt, siden vi ikke vet når de egentlig skjedde. */
  4: (s) => {
    const n = {
      ...s,
      avis: [],
      avisLest: 0,
      prestasjoner: {},
      rekorder: { hoyesteInntekt: 0, storsteHandel: 0, storsteGevinst: 0 },
    } as unknown as Spilltilstand
    n.forrigeDag = lagDagsbilde(n)
    sjekkPrestasjoner(n)
    return n as unknown as Raatilstand
  },
  /* 5 → 6: regnskap per bedrift, sparekonto og kostpris på eiendom.
     Bedriftene har ikke ført regnskap før, så «tjent» starter på null.
     Eiendom du alt eier, føres til dagens pris — den faktiske kjøpsprisen
     ble ikke lagret — så avkastningen på den teller fra nå. */
  5: (s) => {
    const eiendommer = (s.eiendommer ?? {}) as Record<EiendomId, number>
    const indeks = ((s.marked as Raatilstand).eiendom as { kurs: number }).kurs
    const eiendomKostpris: Partial<Record<EiendomId, number>> = {}
    for (const [id, antall] of Object.entries(eiendommer) as [EiendomId, number][]) {
      eiendomKostpris[id] = antall * EIENDOMSTYPER[id].pris * indeks
    }
    return {
      ...s,
      bedrifter: (s.bedrifter as Raatilstand[]).map((b) => ({ tjent: 0, inntektHistorikk: [], ...b })),
      eiendomKostpris,
      sparing: 0,
      totaltSparerente: 0,
    }
  },
  /* 6 → 7: porteføljens «i dag». Verdien ved dagens start er ukjent for en
     gammel lagring, så den settes til verdien nå: «i dag» teller fra nå og
     frem til neste dagsskifte, og er riktig fra da av. */
  6: (s) => {
    const n = { ...s, dagensFlyt: nullPerKlasse() } as unknown as Spilltilstand
    n.forrigeDag = { ...n.forrigeDag, verdier: klasseverdier(n) }
    return n as unknown as Raatilstand
  },
  /* 7 → 8: uke-, måneds- og årsoppgjør. Tellerne for renter og forbruk
     starter på null, og alle tre periodene starter nå — det første oppgjøret
     dekker bare tiden fra oppdateringen, og sier det ærlig med fraDag. */
  7: (s) => {
    const n = { ...s, totaltRentebetalt: 0, totaltForbruk: 0, oppgjor: [] } as unknown as Spilltilstand
    n.ukestart = periodestart(n)
    n.maanedstart = periodestart(n)
    n.aarstart = periodestart(n)
    return n as unknown as Raatilstand
  },
  /* 8 → 9: unike forbedringer og oppussing. Ingen forbedringer kjøpt, alle
     eiendommer på normal standard og ingen oppussing i gang — ingenting
     endrer seg for et pågående spill før du selv kjøper noe. */
  8: (s) => ({
    ...s,
    bedrifter: (s.bedrifter as Raatilstand[]).map((b) => ({ forbedringer: 0, ...b })),
    eiendomStandard: {},
    oppussing: {},
  }),
  /* 9 → 10: skatt, rivaler og automatiske ordre. Ingen skatt skyldes for
     tiden før oppdateringen, rivalene starter der alle nye spill starter, og
     porteføljen får en klasse for eierandeler i rivalselskaper. */
  9: (s) => {
    const forrigeDag = s.forrigeDag as Raatilstand
    return {
      ...s,
      skatt: { regninger: [], offshore: false, unndratt: 0, totaltBetalt: 0, nesteId: 1 },
      rivaler: structuredClone(START_RIVALER),
      ordre: [],
      nesteOrdreId: 1,
      dagensFlyt: { ...(s.dagensFlyt as Raatilstand), rival: 0 },
      forrigeDag: { ...forrigeDag, verdier: { ...(forrigeDag.verdier as Raatilstand), rival: 0 } },
    }
  },
}

export type MigreringsResultat =
  | { ok: true; tilstand: Spilltilstand; migrert: boolean }
  | { ok: false; feil: string }

/**
 * Løfter en parset lagring til gjeldende versjon. Ren funksjon — muterer aldri
 * inndataene. `migreringer` og `tilVersjon` kan byttes ut i tester.
 */
export function migrer(
  rå: unknown,
  tilVersjon: number = SPILLVERSJON,
  migreringer: Record<number, (s: Raatilstand) => Raatilstand> = MIGRERINGER,
): MigreringsResultat {
  if (typeof rå !== 'object' || rå === null || Array.isArray(rå)) {
    return { ok: false, feil: 'Lagringen er ikke en gyldig spilltilstand.' }
  }
  const versjon = (rå as Raatilstand).versjon
  if (typeof versjon !== 'number' || !Number.isInteger(versjon)) {
    return { ok: false, feil: 'Lagringen mangler gyldig versjonsnummer.' }
  }
  if (versjon > tilVersjon) {
    return {
      ok: false,
      feil: `Lagringen er fra en nyere spillversjon (${versjon} — denne er ${tilVersjon}).`,
    }
  }
  let s = rå as Raatilstand
  for (let v = versjon; v < tilVersjon; v++) {
    const steg = migreringer[v]
    if (!steg) {
      return {
        ok: false,
        feil: `Lagringen (versjon ${versjon}) er for gammel — ingen migrering fra versjon ${v}.`,
      }
    }
    s = { ...steg(s), versjon: v + 1 }
  }
  return { ok: true, tilstand: s as unknown as Spilltilstand, migrert: versjon < tilVersjon }
}
