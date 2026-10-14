/**
 * Den lettere kopien etter Pakke 105: et sekund deler markedets historikker med
 * sekundet før i stedet for å kopiere dem, og markedet skifter ut en liste når den
 * får et punkt. Den gamle tilstanden må stå urørt, og alt annet må være en ekte kopi.
 */

import { describe, expect, it } from 'vitest'
import { kopierSpill, simuler } from '../simulering'
import { nyttSpill } from '../start'
import { medPunkt, merkDelt } from '../delteLister'
import { fulltSpill } from './hjelp'

describe('kopien et sekund jobber på', () => {
  it('er lik spillet, tall for tall og nøkkel for nøkkel', () => {
    const s = simuler(nyttSpill(), 600)
    expect(JSON.stringify(kopierSpill(s))).toBe(JSON.stringify(s))
    expect(kopierSpill(s)).toEqual(s)
  })

  it('deler historikkene, men ingenting annet', () => {
    const s = simuler(nyttSpill(), 60)
    const n = kopierSpill(s)
    expect(n.marked.kurser.NFS.historikk).toBe(s.marked.kurser.NFS.historikk)
    expect(n.marked.eiendom.historikk).toBe(s.marked.eiendom.historikk)
    expect(n.marked.regioner!.indekser.oslo.historikk).toBe(s.marked.regioner!.indekser.oslo.historikk)
    expect(n.marked.kurser.NFS).not.toBe(s.marked.kurser.NFS)
    expect(n.marked).not.toBe(s.marked)
    expect(n.bedrifter).not.toBe(s.bedrifter)
    expect(n.historikk.punkter).not.toBe(s.historikk.punkter)
  })

  it('et spill som er simulert videre, rører ikke det gamle — heller ikke over dagsskifter', () => {
    const s = simuler(fulltSpill(), 1200, true)
    const før = JSON.stringify(s)
    let n = s
    // Over et dagsskifte (300 s) og mange historikkpunkter (hvert 30. sekund), både levende og borte.
    for (let i = 0; i < 400; i++) n = simuler(n, 1)
    n = simuler(n, 900, true)
    expect(JSON.stringify(s)).toBe(før)
    expect(n.marked.kurser.NFS.historikk).not.toBe(s.marked.kurser.NFS.historikk)
  })

  it('går like langt som med en full kopi', () => {
    const s = simuler(nyttSpill(), 300)
    const delt = simuler(simuler(s, 450), 450)
    const full = simuler(structuredClone(simuler(structuredClone(s), 450)), 450)
    expect(JSON.stringify(delt)).toBe(JSON.stringify(full))
  })

  it('medPunkt kopierer en delt liste én gang, og legger til i sin egen etterpå', () => {
    const a = [1, 2, 3]
    merkDelt(a)
    const b = medPunkt(a, 4, 3)
    expect(a).toEqual([1, 2, 3])
    expect(b).toEqual([2, 3, 4])
    // Kopien er simuleringens egen: neste punkt går rett inn.
    expect(medPunkt(b, 5, 3)).toBe(b)
    expect(b).toEqual([3, 4, 5])
    const c = [1]
    expect(medPunkt(c, 2, 3)).toBe(c)
    expect(c).toEqual([1, 2])
  })

  it('to timer borte kopierer hver historikk én gang, ikke ved hvert punkt', () => {
    const s = simuler(nyttSpill(), 60)
    const n = simuler(s, 3600, true)
    const h = n.marked.kurser.NFS.historikk
    // En simulering til: listen kopieres ved første punkt og vokser så i den nye kopien.
    const m = simuler(n, 3600, true)
    expect(m.marked.kurser.NFS.historikk).not.toBe(h)
    expect(n.marked.kurser.NFS.historikk).toBe(h)
  })
})
