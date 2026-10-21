/**
 * Børsen: aksjer og krypto, indeksfond og automatiske ordre.
 * En del av spillerens handlinger (Pakke 65 delte handlinger.ts per område). Hver er
 * en ren funksjon: tilstand inn, ny tilstand (eller en feilmelding) ut.
 */

import { maksKjop } from '../formler'
import { utforFondskjop, utforFondssalg, utforKjop, utforSalg } from '../handel'
import { FOND, fondStengt } from '../fond'
import { erHelg } from '../kalender'
import { maksPerOrdre, PAPIRER, rundAntall, stengtIHelgen } from '../marked'
import type { FondId, Forvalterprofil, Ordretype, PapirId, Spilltilstand } from '../types'
import { forvaltertrinn, forvaltertrinnpris, forvaltetVerdi, PROFILER, rebalanser, trekkForvaltergebyr } from '../forvalter'
import { sparingKostpris } from '../portefolje'
import { tall } from '../tall'
import { KONTRAER_ANDEL } from '../prestasjoner'
import { feil, ikkeTall, UGYLDIG, type Utfall } from './felles'

/** Aksjer og råvarer (Pakke 124) kan ikke handles i helgen; krypto kan. */
export function borsenStengt(s: Spilltilstand, id: PapirId): boolean {
  return stengtIHelgen(PAPIRER[id]) && erHelg(s.sek)
}

const STENGT = 'Børsen er stengt i helgen. Den åpner mandag morgen.'

function forStorOrdre(s: Spilltilstand, id: PapirId, retning: 'kjop' | 'selg'): string {
  const maks = maksPerOrdre(s, id, retning)
  const desimaler = PAPIRER[id].klasse === 'krypto' && maks < 100 ? 4 : 0
  return `Høyst ${tall(maks, desimaler)} om gangen — en større ordre ville ${retning === 'kjop' ? 'mer enn doblet' : 'mer enn halvert'} kursen.`
}

export function kjopPapir(s: Spilltilstand, id: PapirId, antall: number): Utfall {
  if (!PAPIRER[id]) return feil('Ukjent aksje eller mynt.')
  if (ikkeTall(antall)) return feil(UGYLDIG)
  if (borsenStengt(s, id)) return feil(STENGT)
  const a = rundAntall(id, antall)
  if (a <= 0) return feil('Velg hvor mye du vil kjøpe.')
  if (a > maksPerOrdre(s, id, 'kjop')) return feil(forStorOrdre(s, id, 'kjop'))
  if (a > maksKjop(s, id)) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const kostnad = utforKjop(n, id, a)
  n.rekorder.storsteHandel = Math.max(n.rekorder.storsteHandel, kostnad)
  // Pakke 70: et kjøp minst 20 % under toppen de siste to timene («Kontrær»), målt på kursen før kjøpet.
  const k = s.marked.kurser[id]
  if (n.kontraerKjop === undefined && k.historikk.length > 0 && k.kurs <= KONTRAER_ANDEL * Math.max(...k.historikk)) n.kontraerKjop = n.sek
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
  if (a > maksPerOrdre(s, id, 'selg')) return feil(forStorOrdre(s, id, 'selg'))
  const n = structuredClone(s)
  const inntekt = utforSalg(n, id, a)
  const gevinst = inntekt - b.kostpris * (a / b.antall)
  n.rekorder.storsteHandel = Math.max(n.rekorder.storsteHandel, inntekt)
  n.rekorder.storsteGevinst = Math.max(n.rekorder.storsteGevinst, gevinst)
  return { ok: true, tilstand: n }
}

/** Kjøper fondsandeler for et beløp, gebyret inkludert. */
export function kjopFond(s: Spilltilstand, id: FondId, belop: number): Utfall {
  if (!FOND[id]) return feil('Ukjent fond.')
  if (ikkeTall(belop)) return feil(UGYLDIG)
  if (fondStengt(s, id)) return feil(STENGT)
  const b = Math.floor(Math.min(belop, s.kontanter))
  if (b <= 0) return feil('Velg hvor mye du vil kjøpe for.')
  const n = structuredClone(s)
  utforFondskjop(n, id, b)
  n.rekorder.storsteHandel = Math.max(n.rekorder.storsteHandel, b)
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

/** Starter formuesforvalteren, eller bytter profil (Pakke 124). Første ukes gebyr tas med en gang. */
export function startForvalter(s: Spilltilstand, profil: Forvalterprofil): Utfall {
  if (!PROFILER[profil]) return feil('Ukjent profil.')
  if (erHelg(s.sek)) return feil(FORVALTER_STENGT)
  if (s.forvalter?.profil === profil) return feil(`Forvalteren er alt ${PROFILER[profil].navn.toLowerCase()}.`)
  const n = structuredClone(s)
  if (n.forvalter) n.forvalter.profil = profil
  else {
    n.forvalter = { profil, fra: n.sek, gebyrBetalt: 0 }
    trekkForvaltergebyr(n)
  }
  rebalanser(n)
  return { ok: true, tilstand: n }
}

/** Sier opp forvalteren. Det den har kjøpt, blir stående som ditt; forvalterkontoen går til sparekontoen. */
export function stoppForvalter(s: Spilltilstand): Utfall {
  if (!s.forvalter) return feil('Du har ingen forvalter.')
  const n = structuredClone(s)
  const konto = n.forvalter!.konto ?? 0
  if (konto > 0) {
    // Til sparekontoen med kostprisen den hadde, så avkastningen står som før.
    n.sparingKostpris = sparingKostpris(n) + (n.forvalter!.kontoKostpris ?? 0)
    n.sparing += konto
  }
  delete n.forvalter
  return { ok: true, tilstand: n }
}

/** Kjøper neste trinn til forvalteren (Pakke 125): en andel av nettoformuen, én gang. */
export function kjopForvaltertrinn(s: Spilltilstand): Utfall {
  const pris = forvaltertrinnpris(s)
  if (pris === null) return feil('Forvalteren har alle trinnene.')
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  n.kontanter -= pris
  n.totaltForbruk += pris
  n.forvaltertrinn = forvaltertrinn(n) + 1
  return { ok: true, tilstand: n }
}


/** Gir forvalteren `belop` av kontantene (positivt) eller tar ut (negativt), og blandingen holdes. */
export function forvalterBelop(s: Spilltilstand, belop: number): Utfall {
  if (!s.forvalter) return feil('Du har ingen forvalter.')
  if (ikkeTall(belop) || belop === 0) return feil(UGYLDIG)
  if (erHelg(s.sek)) return feil(FORVALTER_STENGT)
  if (belop > s.kontanter) return feil('Du har ikke så mye i kontanter.')
  const n = structuredClone(s)
  rebalanser(n, belop < 0 ? -Math.min(-belop, forvaltetVerdi(n)) : belop)
  return { ok: true, tilstand: n }
}

const FORVALTER_STENGT = 'Forvalteren handler når børsen er åpen, mandag til fredag.'

/** Hvor mye av inntekten og leia som går rett på sparekontoen hvert sekund (Pakke 124). */
export function settSparandel(s: Spilltilstand, andel: number): Utfall {
  if (!SPARANDELER.includes(andel)) return feil('Velg 0, 10, 25 eller 50 %.')
  const n = structuredClone(s)
  if (andel) n.sparandel = andel
  else delete n.sparandel
  return { ok: true, tilstand: n }
}
export const SPARANDELER = [0, 0.1, 0.25, 0.5]

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
