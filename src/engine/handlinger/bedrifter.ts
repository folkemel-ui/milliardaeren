/**
 * Bedriftene: kjøpe, oppgradere, forbedringer, ansatte og leder, retning, filialer og salg.
 * En del av spillerens handlinger (Pakke 65 delte handlinger.ts per område). Hver er
 * en ren funksjon: tilstand inn, ny tilstand (eller en feilmelding) ut.
 */

import { ansettelsespris, bedriftsverdi, eierType, erLaastOpp, lederpris, maksAnsatte, forbedringspris, nesteForbedring, oppgraderingspris, MAKS_NIVAAER_PER_KJOP, prisForNivaaer } from '../formler'
import { bokforGevinst } from '../handel'
import { BEDRIFTSSALG_RABATT, BEDRIFTSTYPER } from '../innhold'
import { FILIAL_FRA_NIVAA, FILIALBYER, filialer, filialpris, MAKS_FILIALER } from '../filialer'
import { ansattnavn, GRADER, kanVelgeRetning, RETNING_NIVAA, RETNINGER, stab } from '../ansatte'
import type { Ansattgrad, Bedrift, BedriftstypeId, Retning, Spilltilstand, NorskBy } from '../types'
import { feil, finn, ikkeTall, investerI, UGYLDIG, type Utfall } from './felles'

/**
 * Åpner en filial for bedriften i en norsk by (Pakke 59). Prisen går inn i det
 * du har investert, som en oppgradering: bedriftens verdi og salgspris følger med.
 */
export function aapneFilial(s: Spilltilstand, id: string, by: NorskBy): Utfall {
  const b = finn(s, id)
  if (!b) return feil('Fant ikke bedriften.')
  if (!FILIALBYER.includes(by)) return feil('Du kan ikke åpne filial der.')
  if (filialer(b).some((f) => f.by === by)) return feil(`${BEDRIFTSTYPER[b.type].navn} har allerede en filial i ${by}.`)
  if (b.nivaa < FILIAL_FRA_NIVAA) return feil(`Filialer åpner ved nivå ${FILIAL_FRA_NIVAA}.`)
  const pris = filialpris(b)
  if (pris === null) return feil(`Høyst ${MAKS_FILIALER} filialer per bedrift.`)
  return investerI(s, id, pris, (n) => {
    n.filialer = [...filialer(n), { by, aapnetSek: s.sek }]
  })
}

export function kjopBedrift(s: Spilltilstand, type: BedriftstypeId): Utfall {
  const t = BEDRIFTSTYPER[type]
  if (!t) return feil('Ukjent bransje.')
  if (eierType(s, type)) return feil(`Du eier allerede en ${t.navn.toLowerCase()}.`)
  if (!erLaastOpp(s, type)) return feil(`${t.navn} er ikke låst opp ennå.`)
  if (s.kontanter < t.pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= t.pris
  n.bedrifter.push({
    id: `b${n.nesteId}`,
    type,
    nivaa: 1,
    startetSek: n.sek,
    ansatte: 0,
    leder: false,
    investert: t.pris,
    tjent: 0,
    inntektHistorikk: [],
    forbedringer: 0,
    fusjoner: 0,
  })
  n.nesteId += 1
  return { ok: true, tilstand: n }
}

export function oppgrader(s: Spilltilstand, id: string): Utfall {
  const b = finn(s, id)
  if (!b) return feil('Fant ikke bedriften.')
  return investerI(s, id, oppgraderingspris(b), (n) => {
    n.nivaa += 1
  })
}

/** Kjøper flere nivåer på en gang. Alt eller ingenting: har du ikke råd til alle, kjøpes ingen. */
export function oppgraderFlere(s: Spilltilstand, id: string, antall: number): Utfall {
  const b = finn(s, id)
  if (!b) return feil('Fant ikke bedriften.')
  if (ikkeTall(antall)) return feil(UGYLDIG)
  const n = Math.floor(antall)
  if (n < 1) return feil('Du har ikke råd til et eneste nivå.')
  if (n > MAKS_NIVAAER_PER_KJOP) return feil(`Høyst ${MAKS_NIVAAER_PER_KJOP} nivåer om gangen.`)
  return investerI(s, id, prisForNivaaer(b, n), (ny) => {
    ny.nivaa += n
  })
}

export function kjopForbedring(s: Spilltilstand, id: string): Utfall {
  const b = finn(s, id)
  if (!b) return feil('Fant ikke bedriften.')
  const f = nesteForbedring(b)
  if (!f) return feil('Alle forbedringene er kjøpt.')
  if (b.nivaa < f.nivaa) return feil(`${f.navn} krever nivå ${f.nivaa}.`)
  return investerI(s, id, forbedringspris(b, f), (n) => {
    n.forbedringer += 1
  })
}

/**
 * Ansetter én til, med et nivå: junior, erfaren eller — fra nivå 50 — stjerne.
 * Den nye får et navn fra en hash av bedriften og tidspunktet (Pakke 48).
 */
export function ansett(s: Spilltilstand, id: string, grad: Ansattgrad = 'erfaren'): Utfall {
  const b = finn(s, id)
  if (!b) return feil('Fant ikke bedriften.')
  if (!GRADER[grad]) return feil('Ukjent nivå.')
  if (b.ansatte >= maksAnsatte(b)) return feil('Det er ikke plass til flere ansatte. Oppgrader bedriften først.')
  if (b.nivaa < GRADER[grad].fraNivaa) return feil(`Stjernene vil ikke jobbe i en bedrift under nivå ${GRADER[grad].fraNivaa}.`)
  return investerI(s, id, ansettelsespris(b, grad), (n) => {
    n.stab = [...stab(n), { navn: ansattnavn(`${n.id}|${s.sek}|${n.ansatte}`), grad }]
    n.ansatte += 1
  }, false)
}

/** Sier opp en ansatt. Ingen kostnad og ingenting tilbake — bare lønnen forsvinner. */
/** Sier opp den ansatte på plass `indeks` — eller den sist ansatte når ingen er valgt. */
export function siOpp(s: Spilltilstand, id: string, indeks?: number): Utfall {
  const b = finn(s, id)
  if (!b) return feil('Fant ikke bedriften.')
  if (b.ansatte <= 0) return feil('Bedriften har ingen ansatte.')
  const i = indeks ?? b.ansatte - 1
  if (!Number.isInteger(i) || i < 0 || i >= b.ansatte) return feil('Fant ikke den ansatte.')
  const n = structuredClone(s)
  const nb = finn(n, id)!
  nb.stab = stab(nb).filter((_, j) => j !== i)
  nb.ansatte -= 1
  return { ok: true, tilstand: n }
}

/** Velger retning på nivå 50: volum eller premium. Gratis, men for godt (Pakke 48). */
export function velgRetning(s: Spilltilstand, id: string, retning: Retning): Utfall {
  const b = finn(s, id)
  if (!b) return feil('Fant ikke bedriften.')
  if (!RETNINGER[retning]) return feil('Ukjent retning.')
  if (b.retning) return feil('Bedriften har allerede valgt retning.')
  if (!kanVelgeRetning(b)) return feil(`Retningen velges på nivå ${RETNING_NIVAA}.`)
  const n = structuredClone(s)
  finn(n, id)!.retning = retning
  return { ok: true, tilstand: n }
}

/** Det du får for en bedrift du selger selv: det som er investert, minus rabatten. */
export function bedriftssalgspris(b: Bedrift): number {
  // Verdien, ikke bare det investerte: en premiumbedrift selges for mer.
  return Math.round(bedriftsverdi(b) * (1 - BEDRIFTSSALG_RABATT))
}

/**
 * Selger en bedrift til det som er investert i den, minus rabatten. Den siste
 * bedriften får du ikke selge. Fusjonene forsvinner med bedriften; kjøper du
 * bransjen igjen, starter du på nivå 1.
 */
export function selgBedrift(s: Spilltilstand, id: string): Utfall {
  const b = finn(s, id)
  if (!b) return feil('Fant ikke bedriften.')
  if (s.bedrifter.length <= 1) return feil('Du må ha minst én bedrift.')
  const n = structuredClone(s)
  const inntekt = bedriftssalgspris(b)
  n.kontanter += inntekt
  bokforGevinst(n, inntekt - b.investert)
  n.bedrifter = n.bedrifter.filter((x) => x.id !== id)
  if (n.ko?.bedriftId === id) n.ko = null
  return { ok: true, tilstand: n }
}

export function ansettLeder(s: Spilltilstand, id: string): Utfall {
  const b = finn(s, id)
  if (!b) return feil('Fant ikke bedriften.')
  if (b.leder) return feil('Bedriften har allerede en leder.')
  return investerI(s, id, lederpris(b.type), (n) => {
    n.leder = true
  }, false)
}
