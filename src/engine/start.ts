/** Et nytt spill: 1 000 kr og en saftbod. */

import { nettoformue } from './formler'
import { BEDRIFTSTYPER, STARTKAPITAL } from './innhold'
import { lagMarked } from './marked'
import { START_LAGER } from './eiendom'
import { lagDagsbilde } from './avis'
import { nullPerKlasse } from './portefolje'
import { periodestart } from './oppgjor'
import { START_RIVALER } from './rivaler'
import { lagKunst } from './kunst'
import { nyeKvartal } from './kvartal'
import type { Dagsbilde, Periodestart, Spilltilstand } from './types'

/** Lagringens skjemaversjon. Bumpes når tilstandens form endres — se migrering.ts. */
export const SPILLVERSJON = 15

/** Sekunder mellom punktene i formuehistorikken ved start. */
export const HISTORIKK_INTERVALL = 10

export function nyttSpill(startfrø = 20260927): Spilltilstand {
  const { marked, frø } = lagMarked(startfrø)
  const s: Spilltilstand = {
    versjon: SPILLVERSJON,
    frø,
    sek: 0,
    kontanter: STARTKAPITAL,
    // Saftboden er gratis, men bokføres til det den er verdt.
    bedrifter: [
      {
        id: 'b1',
        type: 'saftbod',
        nivaa: 1,
        startetSek: 0,
        ansatte: 0,
        leder: false,
        investert: BEDRIFTSTYPER.saftbod.pris,
        tjent: 0,
        inntektHistorikk: [],
        forbedringer: 0,
        fusjoner: 0,
      },
    ],
    nesteId: 2,
    historikk: { intervall: HISTORIKK_INTERVALL, punkter: [] },
    totaltTjent: 0,
    hoyesteFormue: 0,
    marked,
    beholdning: {},
    gjeld: 0,
    totaltUtbytte: 0,
    hendelser: [],
    eiendommer: {},
    eiendomKostpris: {},
    eiendomStandard: {},
    oppussing: {},
    totaltLeie: 0,
    sparing: 0,
    totaltSparerente: 0,
    luksus: [],
    lager: { ...START_LAGER },
    avis: [],
    avisLest: 0,
    // Fylles rett under — bildet trenger en ferdig tilstand å ta bilde av.
    forrigeDag: null as unknown as Dagsbilde,
    dagensFlyt: nullPerKlasse(),
    prestasjoner: {},
    rekorder: { hoyesteInntekt: 0, storsteHandel: 0, storsteGevinst: 0 },
    totaltRentebetalt: 0,
    totaltForbruk: 0,
    // Også disse fylles rett under.
    ukestart: null as unknown as Periodestart,
    maanedstart: null as unknown as Periodestart,
    aarstart: null as unknown as Periodestart,
    oppgjor: [],
    skatt: { regninger: [], offshore: false, unndratt: 0, totaltBetalt: 0, nesteId: 1 },
    rivaler: structuredClone(START_RIVALER),
    ordre: [],
    nesteOrdreId: 1,
    startups: [],
    nesteStartupId: 1,
    klubb: null,
    trofeer: [],
    jord: {},
    totaltHost: 0,
    landemerker: {},
    kunst: lagKunst(frø),
    fond: {},
    handler: [],
    kvartal: nyeKvartal(),
  }
  s.forrigeDag = lagDagsbilde(s)
  s.ukestart = periodestart(s)
  s.maanedstart = periodestart(s)
  s.aarstart = periodestart(s)
  s.hoyesteFormue = nettoformue(s)
  s.historikk.punkter.push({ sek: 0, verdi: s.hoyesteFormue })
  return s
}
