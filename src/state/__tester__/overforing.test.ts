import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { simuler } from '../../engine/simulering'
import { SPILLVERSJON } from '../../engine/start'
import { pakk, pakkUt } from '../overforing'

describe('flytte spillet', () => {
  it('en kode pakkes ut til nøyaktig samme spill', async () => {
    const s = simuler(nyttSpill(), 600)
    const kode = await pakk(s)
    expect(kode.startsWith('MLD1:')).toBe(true)
    const r = await pakkUt(kode)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.tilstand).toEqual(s)
  })

  it('koden er kortere enn råteksten', async () => {
    const s = simuler(nyttSpill(), 3600)
    const kode = await pakk(s)
    expect(kode.length).toBeLessThan(JSON.stringify(s).length)
  })

  it('tåler linjeskift og mellomrom fra kopiering', async () => {
    const kode = await pakk(nyttSpill())
    const oppdelt = kode.match(/.{1,60}/g)!.join('\n  ')
    expect((await pakkUt(oppdelt)).ok).toBe(true)
  })

  it('avviser tull og avkuttede koder med en forklaring', async () => {
    const tull = await pakkUt('hei')
    expect(tull.ok).toBe(false)
    const kode = await pakk(nyttSpill())
    const kuttet = await pakkUt(kode.slice(0, kode.length / 2))
    expect(kuttet.ok).toBe(false)
    if (!kuttet.ok) expect(kuttet.feil).toMatch(/ødelagt|ufullstendig/)
  })

  it('en ukomprimert kode fra en eldre versjon migreres', async () => {
    const gammel = {
      versjon: 1,
      frø: 20260927,
      sek: 120,
      kontanter: 1_120,
      bedrifter: [{ id: 'b1', type: 'saftbod', nivaa: 1, startetSek: 0 }],
      nesteId: 2,
      historikk: { intervall: 10, punkter: [{ sek: 0, verdi: 1_250 }] },
      totaltTjent: 120,
    }
    const kode = 'MLD0:' + btoa(JSON.stringify(gammel))
    const r = await pakkUt(kode)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.tilstand.versjon).toBe(SPILLVERSJON)
  })
})
