/**
 * Kampen direkte (Pakke 86). En kamp avgjøres ved dagsskiftet, men spilles på skjermen
 * gjennom spilldagen som følger: 300 s blir 90 minutter, og målene kommer i sitt minutt.
 * Til fløyta går, viser klubbsidene klubben slik den var før kampen — tabellen før
 * runden, formen, rapporten, spillernes tall og sesongoppsummeringen. Ren, så den kan
 * testes; motoren og terningene er som før.
 */

import { DAG_SEK, dagnummer } from '../engine/kalender'
import type { Kamp, Klubb, Lag, Maalhendelse, Spiller, Spillerstatistikk, Spilltilstand } from '../engine/types'

/** Kampene som spilles nå: avgjort ved dagsskiftet som startet dagen. */
export function liveKamper(s: Spilltilstand): Kamp[] {
  const k = s.klubb
  if (!k) return []
  const dag = dagnummer(s.sek)
  return k.kamper.filter((m) => m.dag === dag)
}

/** Kampminuttet nå: 0 ved avspark, 90 ved fløyta (dagsskiftet). */
export function kampminutt(sek: number): number {
  return Math.min(90, Math.floor(((sek % DAG_SEK) * 90) / DAG_SEK))
}

/** Målene så langt og stillingen etter `minutt`. */
export function stilling(kamp: Kamp, minutt: number): { for: number; mot: number; maal: Maalhendelse[] } {
  const maal = (kamp.maal ?? []).filter((m) => m.minutt <= minutt)
  return { for: maal.filter((m) => !m.mot).length, mot: maal.filter((m) => m.mot).length, maal }
}

/** Klubben slik sidene viser den: med `tabellVenter` når den siste serierunden spilles og sesongen alt er snudd. */
export type Visningsklubb = Klubb & { tabellVenter?: boolean }

function angre(l: Lag, egne: number, mot: number): void {
  l.spilt--
  l.maalFor -= egne
  l.maalMot -= mot
  if (egne > mot) l.vunnet--
  else if (egne === mot) l.uavgjort--
  else l.tapt--
}

/** Tar én kamps vurdering, mål og assist ut av en statistikk (en kopi). */
function utenKamp(st: Spillerstatistikk, v: number, maal: number, assist: number, kurve: boolean): Spillerstatistikk {
  const ny = { ...st, kamper: st.kamper - 1, sum: st.sum - v, maal: st.maal - maal, assist: st.assist - assist }
  if (kurve && st.vurderinger) ny.vurderinger = st.vurderinger.slice(0, -1)
  return ny
}

/**
 * Klubben som sidene skal vise mens dagens kamp spilles: uten kampen. Uten kamp i
 * dag er det klubben selv. Handlinger går fortsatt mot den ekte klubben i spillet.
 */
export function visKlubb(s: Spilltilstand, k: Klubb): Visningsklubb {
  const live = liveKamper(s).filter((m) => k.kamper.includes(m))
  if (live.length === 0) return k
  const c: Visningsklubb = { ...k, kamper: k.kamper.filter((m) => !live.includes(m)) }
  const snudd = live.some((m) => m.sesong < k.sesong)

  // Seire fra kampene som spilles, telles ikke ennå.
  c.seire = k.seire - live.filter((m) => !m.turnering && m.maalFor > m.maalMot).length

  // Spillernes tall: kampene tas ut igjen. Har sesongen snudd, er sesongtallene alt nullstilt.
  const endret = new Map<number, Spiller>()
  const spiller = (id: number) => {
    let p = endret.get(id)
    if (!p) {
      const ekte = k.spillere.find((x) => x.id === id)
      if (!ekte) return null
      p = { ...ekte }
      endret.set(id, p)
    }
    return p
  }
  for (const m of live) {
    for (const v of m.vurderinger ?? []) {
      const p = spiller(v.id)
      if (!p) continue
      const maal = (m.maal ?? []).filter((x) => !x.mot && x.id === v.id).length
      const assist = (m.maal ?? []).filter((x) => !x.mot && x.assist === p.navn).length
      if (!snudd && p.sesong) p.sesong = utenKamp(p.sesong, v.vurdering, maal, assist, true)
      if (p.karriere) p.karriere = utenKamp(p.karriere, v.vurdering, maal, assist, false)
    }
    // Motstandernes scorere i toppscorerlista.
    if (!snudd) {
      const topp = { ...(k.toppscorere ?? {}) }
      for (const x of m.maal ?? []) {
        if (!x.mot) continue
        const nokkel = `${x.navn} (${m.motstander})`
        if (topp[nokkel] !== undefined) topp[nokkel] -= 1
        if ((topp[nokkel] ?? 0) <= 0) delete topp[nokkel]
      }
      c.toppscorere = topp
    }
  }
  if (endret.size > 0) c.spillere = k.spillere.map((p) => endret.get(p.id) ?? p)

  if (snudd) {
    // Siste serierunde spilles, men sesongen er alt gjort opp: vis den gamle sesongen uten tabell.
    const gammel = Math.min(...live.map((m) => m.sesong))
    const oppsummering = k.sesonger?.find((x) => x.sesong === gammel)
    c.sesong = gammel
    if (oppsummering) c.divisjon = oppsummering.divisjon
    c.sesonger = (k.sesonger ?? []).filter((x) => x.sesong !== gammel)
    c.tabellVenter = true
    return c
  }

  // Tabellen som før runden: rundens resultater tas ut igjen.
  if (k.sisteRunde && k.sisteRunde.dag === dagnummer(s.sek)) {
    const lag = k.lag.map((l) => ({ ...l }))
    for (const r of k.sisteRunde.kamper) {
      const h = lag.find((l) => l.navn === r.hjemme)
      const b = lag.find((l) => l.navn === r.borte)
      if (h) angre(h, r.mh, r.mb)
      if (b) angre(b, r.mb, r.mh)
    }
    c.lag = lag
  }
  return c
}
