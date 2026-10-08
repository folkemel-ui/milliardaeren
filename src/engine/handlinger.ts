/**
 * Spillerens handlinger. Hver er en ren funksjon: tilstand inn, ny tilstand
 * (eller en feilmelding) ut. Inndataene røres aldri.
 */

import {
  ansettelsespris,
  bedriftsverdi,
  fastrente,
  flytendeRente,
  eierType,
  erLaastOpp,
  lederpris,
  maksAnsatte,
  maksKjop,
  maksNyttLaan,
  forbedringspris,
  nesteForbedring,
  oppgraderingspris,
  MAKS_NIVAAER_PER_KJOP,
  prisForNivaaer,
} from './formler'
import {
  utforEiendomssalg,
  utforFondssalg,
  utforObligasjonssalg,
  utforJordsalg,
  utforKjop,
  utforKlubbsalg,
  utforLandemerkesalg,
  utforLuksussalg,
  utforMalerisalg,
  utforRivalsalg,
  utforSalg,
  bokforGevinst,
} from './handel'
import { FOND, FOND_GEBYR, fondskurs, fondStengt } from './fond'
import { BLOKK, blokkpris, oppkjopspris } from './rivaler'
import {
  brukteplasser,
  EIENDOM_SYNLIG_VED,
  eiendomspris,
  EIENDOMSTYPER,
  flyFor,
  kanReiseTil,
  LAGER,
  LAGER_FOR,
  LUKSUS,
  oppussingspris,
  standard,
  STANDARDER,
  statusnivaa,
  utvidelsespris,
} from './eiendom'
import { BEDRIFTSSALG_RABATT, BEDRIFTSTYPER, RENTE_PER_TIME } from './innhold'
import { DAG_SEK, dagnummer, erHelg } from './kalender'
import { leggTilHendelse } from './bank'
import {
  BUD,
  type BudId,
  dagensForhandling,
  FORMER,
  FUSJONSFAKTOR,
  fusjonerVedOppkjop,
  MOTBUD_VED,
  prisantydning,
  rivalbedrifter,
  type Rivalbedrift,
  rivalensPris,
  utforFusjon,
} from './fusjon'
import { flyt } from './portefolje'
import { ansattnavn, GRADER, kanVelgeRetning, RETNING_NIVAA, RETNINGER, stab } from './ansatte'
import { BINDING_DAGER, FAST_PAASLAG, NORMAL_STYRINGSRENTE, styringsrente } from './verden'
import { OBLIGASJONER } from './obligasjoner'
import { ledigIRunde } from './startups'
import { JORD, JORD_SYNLIG_VED, landverdi, tommerverdi } from './jord'
import { eierDu, kjopsprisLandemerke, landemerkepris, LANDEMERKER } from './landemerker'
import { kjopsprisMaleri, MALERIER } from './kunst'
import {
  KLUBB_LAAST_OPP,
  KLUBBNAVN,
  kjopspris,
  klubbTilSalgs,
  MAKS_TROPP,
  MIN_TROPP,
  salgspris,
  startKlubb,
  TAKTIKKER,
} from './klubb'
import { PAPIRER, rundAntall } from './marked'
import type { Ansattgrad, Bedrift, BedriftstypeId, EiendomId, FondId, JordId, LagerId, LandemerkeId, LuksusId, MaleriId, ObligasjonId, Ordretype, PapirId, Retning, Spilltilstand, Taktikk } from './types'
import { kortKroner } from './tall'

export type Utfall = { ok: true; tilstand: Spilltilstand } | { ok: false; feil: string }

const feil = (tekst: string): Utfall => ({ ok: false, feil: tekst })

/*
 * NaN slipper gjennom sammenligninger som «n < 1» (de er alltid usanne), og
 * blir null i lagringen. Alle antall og beløp sjekkes derfor først. Uendelig
 * er lov der det betyr «alt» — Math.min og taket tar seg av det.
 */
const ikkeTall = (x: number) => typeof x !== 'number' || Number.isNaN(x)
const UGYLDIG = 'Skriv inn et gyldig tall.'

function finn(s: Spilltilstand, id: string): Bedrift | undefined {
  return s.bedrifter.find((b) => b.id === id)
}

/**
 * Betaler for noe i en bedrift: trekker prisen og kjører endringen på en kopi.
 * Er det en investering (oppgradering, forbedring), legges beløpet til
 * bedriftens verdi; er det drift (ansatte, leder), er pengene brukt.
 */
function investerI(s: Spilltilstand, id: string, pris: number, endring: (b: Bedrift) => void, bokfor = true): Utfall {
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const b = finn(n, id)!
  n.kontanter -= pris
  if (bokfor) b.investert += pris
  else n.totaltForbruk += pris
  endring(b)
  return { ok: true, tilstand: n }
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

// ─────────────────────────────────────────────── Aksjer og krypto

/** Aksjer kan ikke handles i helgen; krypto kan. */
export function borsenStengt(s: Spilltilstand, id: PapirId): boolean {
  return PAPIRER[id].klasse === 'aksje' && erHelg(s.sek)
}

const STENGT = 'Børsen er stengt i helgen. Den åpner mandag morgen.'

export function kjopPapir(s: Spilltilstand, id: PapirId, antall: number): Utfall {
  if (!PAPIRER[id]) return feil('Ukjent aksje eller mynt.')
  if (ikkeTall(antall)) return feil(UGYLDIG)
  if (borsenStengt(s, id)) return feil(STENGT)
  const a = rundAntall(id, antall)
  if (a <= 0) return feil('Velg hvor mye du vil kjøpe.')
  if (a > maksKjop(s, id)) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const kostnad = utforKjop(n, id, a)
  n.rekorder.storsteHandel = Math.max(n.rekorder.storsteHandel, kostnad)
  return { ok: true, tilstand: n }
}

export function selgPapir(s: Spilltilstand, id: PapirId, antall: number): Utfall {
  const b = s.beholdning[id]
  if (!b) return feil('Du eier ingen.')
  if (ikkeTall(antall)) return feil(UGYLDIG)
  if (borsenStengt(s, id)) return feil(STENGT)
  // Et salg av (nesten) alt selger alt, så det ikke blir liggende støv igjen.
  const a = antall >= b.antall - 1e-9 ? b.antall : rundAntall(id, antall)
  if (a <= 0) return feil('Velg hvor mye du vil selge.')
  const n = structuredClone(s)
  const inntekt = utforSalg(n, id, a)
  const gevinst = inntekt - b.kostpris * (a / b.antall)
  n.rekorder.storsteHandel = Math.max(n.rekorder.storsteHandel, inntekt)
  n.rekorder.storsteGevinst = Math.max(n.rekorder.storsteGevinst, gevinst)
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Fond

/** Kjøper fondsandeler for et beløp, gebyret inkludert. */
export function kjopFond(s: Spilltilstand, id: FondId, belop: number): Utfall {
  if (!FOND[id]) return feil('Ukjent fond.')
  if (ikkeTall(belop)) return feil(UGYLDIG)
  if (fondStengt(s, id)) return feil(STENGT)
  const b = Math.floor(Math.min(belop, s.kontanter))
  if (b <= 0) return feil('Velg hvor mye du vil kjøpe for.')
  const n = structuredClone(s)
  const andeler = b / (1 + FOND_GEBYR) / fondskurs(n, id)
  const f = n.fond[id] ?? { antall: 0, kostpris: 0 }
  n.fond[id] = { antall: f.antall + andeler, kostpris: f.kostpris + b }
  n.kontanter -= b
  flyt(n, 'fond', b)
  n.rekorder.storsteHandel = Math.max(n.rekorder.storsteHandel, b)
  return { ok: true, tilstand: n }
}

/** Selger andeler for et beløp (før gebyr), eller alt. */
/**
 * Kjøper statsobligasjoner for `belop` (Pakke 53). Kupongen låses til
 * styringsrenten i dag; har du fra før, blir renten snittet vektet med
 * pålydende — det samme som å eie postene hver for seg.
 */
export function kjopObligasjon(s: Spilltilstand, id: ObligasjonId, belop: number): Utfall {
  if (!OBLIGASJONER[id]) return feil('Ukjent obligasjon.')
  if (ikkeTall(belop)) return feil(UGYLDIG)
  const b = Math.floor(Math.min(belop, s.kontanter))
  if (b <= 0) return feil('Velg hvor mye du vil kjøpe for.')
  const n = structuredClone(s)
  n.obligasjoner ??= {}
  const fra = n.obligasjoner[id]
  const rente = styringsrente(n)
  // En eldre post er verdt kurs · pålydende; den nye kjøpes til kurs 1 ved dagens rente.
  const palydende = (fra?.palydende ?? 0) + b
  n.obligasjoner[id] = {
    palydende,
    rente: fra ? (fra.palydende * fra.rente + b * rente) / palydende : rente,
    kostpris: (fra?.kostpris ?? 0) + b,
  }
  n.kontanter -= b
  flyt(n, 'obligasjon', b)
  n.rekorder.storsteHandel = Math.max(n.rekorder.storsteHandel, b)
  return { ok: true, tilstand: n }
}

/** Selger en andel (0–1) av en obligasjonspost. */
export function selgObligasjon(s: Spilltilstand, id: ObligasjonId, andel = 1): Utfall {
  if (!s.obligasjoner?.[id]) return feil('Du eier ingen slike obligasjoner.')
  if (ikkeTall(andel) || andel <= 0) return feil('Velg hvor mye du vil selge.')
  const n = structuredClone(s)
  const inntekt = utforObligasjonssalg(n, id, andel)
  n.rekorder.storsteHandel = Math.max(n.rekorder.storsteHandel, inntekt)
  return { ok: true, tilstand: n }
}

export function selgFond(s: Spilltilstand, id: FondId, belop = Infinity): Utfall {
  if (!s.fond[id]) return feil('Du eier ingen andeler.')
  if (fondStengt(s, id)) return feil(STENGT)
  if (!(belop > 0)) return feil('Velg hvor mye du vil selge.')
  const n = structuredClone(s)
  const inntekt = utforFondssalg(n, id, belop)
  n.rekorder.storsteHandel = Math.max(n.rekorder.storsteHandel, inntekt)
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Eiendom

export function eiendomSynlig(s: Spilltilstand, id: EiendomId): boolean {
  return s.hoyesteFormue >= EIENDOMSTYPER[id].pris * EIENDOM_SYNLIG_VED
}

export function kjopEiendom(s: Spilltilstand, id: EiendomId): Utfall {
  const t = EIENDOMSTYPER[id]
  if (!t) return feil('Ukjent eiendom.')
  if (!eiendomSynlig(s, id)) return feil(`${t.navn} er ikke til salgs for deg ennå.`)
  if (statusnivaa(s) < t.statuskrav) return feil(`Du trenger statusnivå ${t.statuskrav} for å kjøpe ${t.navn.toLowerCase()}.`)
  if (!kanReiseTil(s, id)) return feil(`Du må ha ${LUKSUS[flyFor(id)!].navn.toLowerCase()} for å komme deg til ${t.by}.`)
  if ((s.eiendommer[id] ?? 0) >= t.maksAntall) return feil(`Du eier allerede alle ${t.maksAntall} som er til salgs.`)
  if (s.oppussing[id]) return feil('Vent til oppussingen er ferdig.')
  const pris = eiendomspris(s, id)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= pris
  n.eiendommer[id] = (n.eiendommer[id] ?? 0) + 1
  n.eiendomKostpris[id] = (n.eiendomKostpris[id] ?? 0) + pris
  flyt(n, 'eiendom', pris)
  return { ok: true, tilstand: n }
}

export function selgEiendom(s: Spilltilstand, id: EiendomId): Utfall {
  if (!s.eiendommer[id]) return feil('Du eier ingen.')
  if (s.oppussing[id]) return feil('Vent til oppussingen er ferdig.')
  const n = structuredClone(s)
  utforEiendomssalg(n, id)
  return { ok: true, tilstand: n }
}

/**
 * Pusser opp alle enhetene av en type ett trinn. Pengene går ut nå, standarden
 * kommer når håndverkerne er ferdige — og så lenge står enhetene tomme.
 * Kostnaden legges til kostprisen, så avkastningen regnes riktig.
 */
export function pussOpp(s: Spilltilstand, id: EiendomId): Utfall {
  if (!s.eiendommer[id]) return feil('Du eier ingen å pusse opp.')
  if (s.oppussing[id]) return feil('Oppussingen er allerede i gang.')
  const pris = oppussingspris(s, id)
  if (pris === null) return feil('Høyeste standard er allerede nådd.')
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const neste = standard(s, id) + 1
  const n = structuredClone(s)
  n.kontanter -= pris
  n.eiendomKostpris[id] = (n.eiendomKostpris[id] ?? 0) + pris
  n.oppussing[id] = { standard: neste, ferdigSek: n.sek + STANDARDER[neste].dager * DAG_SEK }
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Luksus og lager

export function kjopLuksus(s: Spilltilstand, id: LuksusId): Utfall {
  const g = LUKSUS[id]
  if (!g) return feil('Ukjent gjenstand.')
  if (s.luksus.includes(id)) return feil(`Du eier allerede ${g.navn.toLowerCase()}.`)
  const lager = LAGER_FOR[g.kategori]
  if (lager && brukteplasser(s, lager) >= s.lager[lager]) {
    return feil(`Du har ikke plass. Bygg ut ${LAGER[lager].bestemt} først.`)
  }
  if (s.kontanter < g.pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= g.pris
  n.totaltForbruk += g.pris
  n.luksus.push(id)
  return { ok: true, tilstand: n }
}

export function selgLuksus(s: Spilltilstand, id: LuksusId): Utfall {
  if (!s.luksus.includes(id)) return feil('Du eier den ikke.')
  const n = structuredClone(s)
  utforLuksussalg(n, id)
  return { ok: true, tilstand: n }
}

export function utvidLager(s: Spilltilstand, lager: LagerId): Utfall {
  if (!LAGER[lager]) return feil('Ukjent lager.')
  const pris = utvidelsespris(s, lager)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= pris
  n.totaltForbruk += pris
  n.lager[lager] += 1
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Skatt

export function betalSkatt(s: Spilltilstand, id: number): Utfall {
  const r = s.skatt.regninger.find((x) => x.id === id)
  if (!r) return feil('Fant ikke regningen.')
  if (s.kontanter < r.belop) return feil('Du har ikke nok kontanter.')
  const n = structuredClone(s)
  n.kontanter -= r.belop
  n.skatt.totaltBetalt += r.belop
  n.skatt.regninger = n.skatt.regninger.filter((x) => x.id !== id)
  return { ok: true, tilstand: n }
}

export function settOffshore(s: Spilltilstand, på: boolean): Utfall {
  if (s.skatt.offshore === på) return feil(på ? 'Offshore er allerede i bruk.' : 'Offshore er allerede av.')
  const n = structuredClone(s)
  n.skatt.offshore = på
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Rivaler

function finnRival(s: Spilltilstand, id: string) {
  return s.rivaler.find((r) => r.id === id)
}

/** Kjøper en blokk på 10 % i en rivals selskap, opp til halvparten. */
export function kjopRivalblokk(s: Spilltilstand, id: string): Utfall {
  const r = finnRival(s, id)
  if (!r) return feil('Fant ikke rivalen.')
  if (r.overtatt) return feil('Du eier allerede hele selskapet.')
  if (r.andel >= 0.5 - 1e-9) return feil('Over 50 % krever et fiendtlig oppkjøp av resten.')
  const pris = blokkpris(r)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const nr = finnRival(n, id)!
  n.kontanter -= pris
  nr.andel = Math.round((nr.andel + BLOKK) * 10) / 10
  nr.kostpris += pris
  flyt(n, 'rival', pris)
  return { ok: true, tilstand: n }
}

/** Fiendtlig oppkjøp: med minst 50 % kan du kjøpe resten med premie og eie hele selskapet. */
export function overtaRival(s: Spilltilstand, id: string): Utfall {
  const r = finnRival(s, id)
  if (!r) return feil('Fant ikke rivalen.')
  if (r.overtatt) return feil('Du eier allerede hele selskapet.')
  if (r.andel < 0.5 - 1e-9) return feil('Du må eie minst 50 % før du kan kjøpe resten.')
  const pris = oppkjopspris(r)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const nr = finnRival(n, id)!
  n.kontanter -= pris
  nr.andel = 1
  nr.kostpris += pris
  const fusjonert = fusjonerVedOppkjop(n, nr)
  nr.overtatt = true
  flyt(n, 'rival', pris)
  if (fusjonert.length) {
    const navn = fusjonert.map((t) => FORMER[t].den)
    leggTilHendelse(n, { tittel: 'Fusjon', tekst: `${nr.selskap} er ditt, og ${liste(navn)} er slått sammen med virksomhetene dine.`, alvor: 'info' })
  }
  return { ok: true, tilstand: n }
}

const stor = (t: string) => t[0].toUpperCase() + t.slice(1)

/** «a», «a og b», «a, b og c». */
function liste(ord: string[]): string {
  return ord.length < 2 ? (ord[0] ?? '') : `${ord.slice(0, -1).join(', ')} og ${ord[ord.length - 1]}`
}

/** Sjekkene et bud og et motbud har felles. Gir rivalbedriften, eller en feil. */
function kanFusjonere(s: Spilltilstand, rivalId: string, type: BedriftstypeId): Rivalbedrift | string {
  const r = finnRival(s, rivalId)
  if (!r) return 'Fant ikke rivalen.'
  const rb = rivalbedrifter(r).find((x) => x.type === type)
  if (!rb) return `${r.navn} eier ikke ${FORMER[type]?.en ?? 'en slik bedrift'}.`
  if (!eierType(s, type)) return `Du må eie ${FORMER[type].en} selv for å slå dem sammen.`
  return rb
}

function fusjoner(s: Spilltilstand, rivalId: string, type: BedriftstypeId, pris: number): Utfall {
  const n = structuredClone(s)
  utforFusjon(n, rivalId, type, pris)
  const r = finnRival(n, rivalId)!
  leggTilHendelse(n, {
    tittel: 'Fusjon',
    tekst: `${stor(FORMER[type].den)} til ${r.navn} er kjøpt og slått sammen med virksomheten din: inntekten ×${FUSJONSFAKTOR.toLocaleString('nb-NO')}.`,
    alvor: 'info',
  })
  return { ok: true, tilstand: n }
}

/**
 * Et bud på en rivals bedrift. Høyt nok, og handelen er gjort. Litt for lavt,
 * og rivalen kommer med et motbud. For lavt, og svaret er nei. Uansett får du
 * bare ett bud per bransje per dag.
 */
export function byPaaBedrift(s: Spilltilstand, rivalId: string, type: BedriftstypeId, bud: BudId): Utfall {
  const rb = kanFusjonere(s, rivalId, type)
  if (typeof rb === 'string') return feil(rb)
  const r = finnRival(s, rivalId)!
  const valg = BUD.find((b) => b.id === bud)
  if (!valg) return feil('Ukjent bud.')
  if (dagensForhandling(s, r, type)) return feil(`${r.navn} vil ikke forhandle mer om den i dag.`)
  const tilbud = Math.round(prisantydning(s, rb) * valg.faktor)
  if (s.kontanter < tilbud) return feil('Du har ikke råd.')
  const pris = rivalensPris(s, r, rb)
  if (tilbud >= pris) return fusjoner(s, rivalId, type, tilbud)
  const n = structuredClone(s)
  const nr = finnRival(n, rivalId)!
  nr.bud = { ...(nr.bud ?? {}), [type]: { dag: dagnummer(n.sek), motbud: tilbud >= pris * MOTBUD_VED ? pris : null } }
  return { ok: true, tilstand: n }
}

/** Godtar rivalens motbud fra i dag. */
export function godtaMotbud(s: Spilltilstand, rivalId: string, type: BedriftstypeId): Utfall {
  const rb = kanFusjonere(s, rivalId, type)
  if (typeof rb === 'string') return feil(rb)
  const f = dagensForhandling(s, finnRival(s, rivalId)!, type)
  if (!f || f.motbud === null) return feil('Det finnes ikke noe motbud å godta.')
  if (s.kontanter < f.motbud) return feil('Du har ikke råd.')
  return fusjoner(s, rivalId, type, f.motbud)
}

export function selgRivalandel(s: Spilltilstand, id: string): Utfall {
  const r = finnRival(s, id)
  if (!r || r.andel <= 0) return feil('Du eier ingen andel.')
  const n = structuredClone(s)
  utforRivalsalg(n, id)
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Startups

/** Kjøper deg inn i runden som pågår. Andelen er beløpet delt på verdien etter runden. */
export function investerIStartup(s: Spilltilstand, id: number, belop: number): Utfall {
  const st = (s.startups ?? []).find((x) => x.id === id)
  if (!st) return feil('Fant ikke selskapet.')
  if (st.status !== 'aktiv') return feil('Selskapet henter ikke penger lenger.')
  if (ikkeTall(belop)) return feil(UGYLDIG)
  const b = Math.floor(Math.min(belop, ledigIRunde(st)))
  if (b <= 0) return feil('Runden er full — vent til neste.')
  if (s.kontanter < b) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const ns = n.startups.find((x) => x.id === id)!
  n.kontanter -= b
  ns.andel += b / ns.verdi
  ns.investert += b
  ns.investertIRunde += b
  flyt(n, 'startup', b)
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Fotballklubb

/**
 * Kjøper en klubb i 4. divisjon. Prisen er det klubben er verdt, så kjøpet
 * bare flytter penger.
 */
export function kjopKlubb(s: Spilltilstand, navn: string): Utfall {
  if (s.klubb) return feil('Du eier allerede en klubb.')
  if (s.hoyesteFormue < KLUBB_LAAST_OPP) return feil('Ingen klubb vil selge til deg ennå.')
  if (!KLUBBNAVN.includes(navn)) return feil('Velg en av klubbene som er til salgs.')
  const { klubb, pris } = klubbTilSalgs(s, navn)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= pris
  startKlubb(n, klubb)
  return { ok: true, tilstand: n }
}

export function selgKlubb(s: Spilltilstand): Utfall {
  if (!s.klubb) return feil('Du eier ingen klubb.')
  const n = structuredClone(s)
  utforKlubbsalg(n)
  return { ok: true, tilstand: n }
}

export function kjopSpiller(s: Spilltilstand, id: number): Utfall {
  const k = s.klubb
  if (!k) return feil('Du eier ingen klubb.')
  const p = k.marked.find((x) => x.id === id)
  if (!p) return feil('Spilleren er ikke til salgs lenger.')
  if (k.spillere.length >= MAKS_TROPP) return feil(`Troppen er full — høyst ${MAKS_TROPP} spillere.`)
  const pris = kjopspris(p)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const nk = n.klubb!
  n.kontanter -= pris
  nk.kostpris = (nk.kostpris ?? 0) + pris
  nk.marked = nk.marked.filter((x) => x.id !== id)
  nk.spillere = [...nk.spillere, { ...p }].sort((a, b) => b.styrke - a.styrke)
  return { ok: true, tilstand: n }
}

export function selgSpiller(s: Spilltilstand, id: number): Utfall {
  const k = s.klubb
  if (!k) return feil('Du eier ingen klubb.')
  const p = k.spillere.find((x) => x.id === id)
  if (!p) return feil('Fant ikke spilleren.')
  if (k.spillere.length <= MIN_TROPP) return feil(`Du må ha minst ${MIN_TROPP} spillere.`)
  const n = structuredClone(s)
  n.kontanter += salgspris(p)
  n.klubb!.kostpris = (n.klubb!.kostpris ?? 0) - salgspris(p)
  n.klubb!.spillere = n.klubb!.spillere.filter((x) => x.id !== id)
  return { ok: true, tilstand: n }
}

export function settTaktikk(s: Spilltilstand, taktikk: Taktikk): Utfall {
  if (!s.klubb) return feil('Du eier ingen klubb.')
  if (!TAKTIKKER[taktikk]) return feil('Ukjent taktikk.')
  if (s.klubb.taktikk === taktikk) return feil('Den taktikken er allerede valgt.')
  const n = structuredClone(s)
  n.klubb!.taktikk = taktikk
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Jord og skog

export function jordSynlig(s: Spilltilstand, id: JordId): boolean {
  return s.hoyesteFormue >= JORD[id].pris * JORD_SYNLIG_VED
}

/** Kjøper en gård eller en skog. En skog kjøpes nyplantet — tømmeret vokser fra nå. */
export function kjopJord(s: Spilltilstand, id: JordId): Utfall {
  const t = JORD[id]
  if (!t) return feil('Ukjent jord.')
  if (s.jord[id]) return feil(`Du eier allerede ${t.navn.toLowerCase()}.`)
  if (!jordSynlig(s, id)) return feil(`${t.navn} er ikke til salgs for deg ennå.`)
  const pris = landverdi(s, id)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= pris
  n.jord[id] = { kostpris: pris, plantetSek: n.sek }
  flyt(n, 'eiendom', pris)
  return { ok: true, tilstand: n }
}

/** Selger jorda, med tømmeret som står, minus meglerhonorar. */
export function selgJord(s: Spilltilstand, id: JordId): Utfall {
  if (!s.jord[id]) return feil('Du eier den ikke.')
  const n = structuredClone(s)
  utforJordsalg(n, id)
  return { ok: true, tilstand: n }
}

/** Hogger skogen: tømmeret selges, og ny skog plantes. */
export function hoggSkog(s: Spilltilstand, id: JordId): Utfall {
  if (!s.jord[id]) return feil('Du eier ikke skogen.')
  if (JORD[id].type !== 'skog') return feil('Det er ingen skog å hogge der.')
  const n = structuredClone(s)
  const tommer = tommerverdi(n, id)
  if (tommer < 1) return feil('Skogen er nyplantet — det er ingenting å hogge ennå.')
  n.kontanter += tommer
  n.totaltHost += tommer
  n.totaltLeie += tommer
  n.jord[id]!.plantetSek = n.sek
  flyt(n, 'eiendom', -tommer)
  leggTilHendelse(n, { tittel: 'Hogst', tekst: `${JORD[id].navn} er hogd. Tømmeret ga ${kortKroner(tommer)}, og ny skog er plantet.`, alvor: 'info' })
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Landemerker

/** Kjøper et landemerke — fra markedet, eller fra rivalen som eier det, med premie. */
export function kjopLandemerke(s: Spilltilstand, id: LandemerkeId): Utfall {
  const l = LANDEMERKER[id]
  if (!l) return feil('Ukjent landemerke.')
  if (eierDu(s, id)) return feil(`Du eier allerede ${l.navn}.`)
  const pris = kjopsprisLandemerke(s, id)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const eier = n.landemerker[id]?.eier
  const rival = eier ? n.rivaler.find((r) => r.id === eier) : undefined
  // Rivalen bytter bygget mot pengene — og tjener premien.
  if (rival) rival.formue += pris - landemerkepris(n, id)
  n.kontanter -= pris
  n.landemerker[id] = { eier: 'deg', kostpris: pris }
  flyt(n, 'eiendom', pris)
  return { ok: true, tilstand: n }
}

export function selgLandemerke(s: Spilltilstand, id: LandemerkeId): Utfall {
  if (!eierDu(s, id)) return feil('Du eier det ikke.')
  const n = structuredClone(s)
  utforLandemerkesalg(n, id)
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Kunst

export function kjopMaleri(s: Spilltilstand, id: MaleriId): Utfall {
  if (!MALERIER[id]) return feil('Ukjent maleri.')
  if (s.kunst.eide[id]) return feil('Du eier det allerede.')
  const pris = kjopsprisMaleri(s, id)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= pris
  n.totaltForbruk += pris - n.kunst.kurser[id]
  n.kunst.eide[id] = { kostpris: pris, utlant: false, hentes: false }
  return { ok: true, tilstand: n }
}

export function selgMaleri(s: Spilltilstand, id: MaleriId): Utfall {
  const v = s.kunst.eide[id]
  if (!v) return feil('Du eier det ikke.')
  if (v.utlant) return feil('Maleriet henger på museum. Hent det hjem først.')
  const n = structuredClone(s)
  utforMalerisalg(n, id)
  return { ok: true, tilstand: n }
}

/** Låner ut til museet, eller ber om å få det hjem — det kommer ved neste dagsskifte. */
export function museum(s: Spilltilstand, id: MaleriId): Utfall {
  const v = s.kunst.eide[id]
  if (!v) return feil('Du eier det ikke.')
  if (v.hentes) return feil('Maleriet er allerede på vei hjem.')
  const n = structuredClone(s)
  const nv = n.kunst.eide[id]!
  if (nv.utlant) nv.hentes = true
  else nv.utlant = true
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Automatiske ordre

export const MAKS_ORDRE = 20

export function nyOrdre(s: Spilltilstand, papir: PapirId, type: Ordretype, grense: number, antall: number): Utfall {
  if (!PAPIRER[papir]) return feil('Ukjent aksje eller mynt.')
  if (!Number.isFinite(grense) || !(grense > 0)) return feil('Sett en grense over null.')
  if (!Number.isFinite(antall)) return feil(UGYLDIG)
  const a = rundAntall(papir, antall)
  if (a <= 0) return feil('Velg hvor mange ordren gjelder.')
  if (type !== 'kjop' && !s.beholdning[papir]) return feil('Du eier ingen å selge.')
  if (s.ordre.length >= MAKS_ORDRE) return feil(`Du kan ha høyst ${MAKS_ORDRE} aktive ordrer.`)
  const n = structuredClone(s)
  n.ordre.push({ id: n.nesteOrdreId++, papir, type, grense, antall: a })
  return { ok: true, tilstand: n }
}

export function slettOrdre(s: Spilltilstand, id: number): Utfall {
  if (!s.ordre.some((o) => o.id === id)) return feil('Fant ikke ordren.')
  const n = structuredClone(s)
  n.ordre = n.ordre.filter((o) => o.id !== id)
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Avisen

export function lesAvis(s: Spilltilstand): Utfall {
  const siste = s.avis[s.avis.length - 1]
  if (!siste || s.avisLest >= siste.dag) return feil('Ingen nye utgaver.')
  const n = structuredClone(s)
  n.avisLest = siste.dag
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Sparekontoen

export function settInn(s: Spilltilstand, belop: number): Utfall {
  if (ikkeTall(belop)) return feil(UGYLDIG)
  const b = Math.min(belop, s.kontanter)
  if (b <= 0) return feil('Du har ingen kontanter å sette inn.')
  const n = structuredClone(s)
  n.kontanter -= b
  n.sparing += b
  flyt(n, 'sparing', b)
  return { ok: true, tilstand: n }
}

export function taUt(s: Spilltilstand, belop: number): Utfall {
  if (ikkeTall(belop)) return feil(UGYLDIG)
  const b = Math.min(belop, s.sparing)
  if (b <= 0) return feil('Sparekontoen er tom.')
  const n = structuredClone(s)
  n.sparing -= b
  n.kontanter += b
  flyt(n, 'sparing', -b)
  // Restbeløp under én krone føres over, så kontoen faktisk blir tom.
  if (n.sparing < 1) {
    flyt(n, 'sparing', -n.sparing)
    n.kontanter += n.sparing
    n.sparing = 0
  }
  return { ok: true, tilstand: n }
}

// ─────────────────────────────────────────────── Banken

export function laan(s: Spilltilstand, belop: number): Utfall {
  if (ikkeTall(belop)) return feil(UGYLDIG)
  const b = Math.floor(belop)
  if (b <= 0) return feil('Velg hvor mye du vil låne.')
  if (b > maksNyttLaan(s)) return feil('Banken låner deg ikke så mye.')
  const n = structuredClone(s)
  n.kontanter += b
  n.gjeld += b
  return { ok: true, tilstand: n }
}

/**
 * Binder lånerenten (Pakke 49): dagens flytende rente pluss et påslag, låst i
 * én fase. Bindingen kan ikke løses opp før den går ut — så kan du binde igjen
 * eller la renten flyte.
 */
export function bindRente(s: Spilltilstand): Utfall {
  if (fastrente(s) !== null) return feil('Renten er allerede bundet.')
  const n = structuredClone(s)
  n.rentebinding = {
    sats: flytendeRente(s) + (RENTE_PER_TIME * FAST_PAASLAG) / NORMAL_STYRINGSRENTE,
    tilDag: dagnummer(s.sek) + BINDING_DAGER,
  }
  return { ok: true, tilstand: n }
}

export function nedbetal(s: Spilltilstand, belop: number): Utfall {
  if (ikkeTall(belop)) return feil(UGYLDIG)
  const b = Math.min(belop, s.gjeld)
  if (b <= 0) return feil('Du har ingen gjeld å betale.')
  if (b > s.kontanter) return feil('Du har ikke nok kontanter.')
  const n = structuredClone(s)
  n.kontanter -= b
  n.gjeld -= b
  // Restgjeld under én krone strykes, så lånet faktisk blir borte.
  if (n.gjeld < 1) n.gjeld = 0
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
