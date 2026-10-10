/**
 * Selskaper: rivalenes aksjer, oppkjøp og fusjoner, og startups.
 * En del av spillerens handlinger (Pakke 65 delte handlinger.ts per område). Hver er
 * en ren funksjon: tilstand inn, ny tilstand (eller en feilmelding) ut.
 */

import { eierType } from '../formler'
import { utforRivalsalg } from '../handel'
import { BLOKK, blokkpris, oppkjopspris } from '../rivaler'
import { dagnummer } from '../kalender'
import { leggTilHendelse } from '../bank'
import { BUD, type BudId, dagensForhandling, FORMER, FUSJONSFAKTOR, fusjonerVedOppkjop, MOTBUD_VED, prisantydning, rivalbedrifter, type Rivalbedrift, rivalensPris, utforFusjon } from '../fusjon'
import { flyt } from '../portefolje'
import { ledigIRunde } from '../startups'
import type { BedriftstypeId, Spilltilstand } from '../types'
import { feil, ikkeTall, UGYLDIG, type Utfall } from './felles'

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
