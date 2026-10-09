import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { simuler } from '../../engine/simulering'
import { DAG_SEK } from '../../engine/kalender'
import { investerIStartup, kjopJord, kjopKlubb, kjopLandemerke, kjopMaleri, type Utfall } from '../../engine/handlinger'
import { KLUBBNAVN } from '../../engine/klubb'
import { ide } from '../../engine/startups'
import type { Overskrift, Spilltilstand } from '../../engine/types'
import { nytt } from '../hendelsesstrom'
import { avisbilde } from '../avisbilde'
import { avsluttKjop, visKjop } from '../varsler'
import { Kjopsglimt } from '../komponenter/Kjopsglimt'

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

function rik(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e13
  s.hoyesteFormue = 1e13
  return s
}

const kjop = (før: Spilltilstand, etter: Spilltilstand) => nytt(før, etter).filter((f) => f.type === 'kjop')
const sak = (tittel: string, type: Overskrift['type'] = 'deg'): Overskrift => ({ type, tittel, tekst: '' })

describe('G11: kjøpsøyeblikk for alt', () => {
  it('gård, skog, landemerke, maleri og klubb får et øyeblikk', () => {
    const før = rik()
    expect(kjop(før, ok(kjopJord(før, 'gard-hedmarken')))).toEqual([{ type: 'kjop', art: 'jord', id: 'gard-hedmarken', navn: 'Gård på Hedmarken' }])
    expect(kjop(før, ok(kjopJord(før, 'skog-trysil')))).toMatchObject([{ art: 'jord', id: 'skog-trysil' }])
    expect(kjop(før, ok(kjopLandemerke(før, 'tarnet')))).toMatchObject([{ art: 'landemerke', id: 'tarnet', navn: 'Oslotårnet' }])
    expect(kjop(før, ok(kjopMaleri(før, 'stormen')))).toMatchObject([{ art: 'maleri', id: 'stormen', navn: 'Stormen' }])
    expect(kjop(før, ok(kjopKlubb(før, KLUBBNAVN[1])))).toEqual([{ type: 'kjop', art: 'klubb', id: KLUBBNAVN[1], navn: KLUBBNAVN[1] }])
  })

  it('et landemerke du kjøper fra en rival, teller; ett rivalen kjøper, gjør det ikke', () => {
    const før = rik()
    før.landemerker.fyret = { eier: 'lunde', kostpris: 1 }
    expect(kjop(før, ok(kjopLandemerke(før, 'fyret')))).toMatchObject([{ art: 'landemerke', id: 'fyret' }])
    const etter = structuredClone(før)
    etter.landemerker.borgen = { eier: 'gronn', kostpris: 1 }
    expect(kjop(før, etter)).toEqual([])
  })

  it('første andel i en startup får logoen — neste runde gjør det ikke', () => {
    let s = rik()
    for (let d = 0; d < 40 && !s.startups.some((st) => st.status === 'aktiv'); d++) s = simuler(s, DAG_SEK)
    const st = s.startups.find((x) => x.status === 'aktiv')!
    expect(st).toBeDefined()
    const med = ok(investerIStartup(s, st.id, 1000))
    expect(kjop(s, med)).toEqual([{ type: 'kjop', art: 'startup', id: ide(st).navn, navn: ide(st).navn }])
    const mer = ok(investerIStartup(med, st.id, 1000))
    expect(kjop(med, mer)).toEqual([])
  })

  it('øyeblikket viser maleriet, våpenet og logoen — og en skog heter skog', () => {
    const vis = (art: Parameters<typeof visKjop>[0]['art'], id: string, navn = id) => {
      visKjop({ art, id, navn })
      return renderToStaticMarkup(createElement(Kjopsglimt))
    }
    expect(vis('maleri', 'stormen', 'Stormen')).toContain('maleri-bilde')
    expect(vis('klubb', 'Nordvik BK')).toContain('klubbvaapen')
    expect(vis('startup', 'Elferja')).toContain('startup-logo')
    expect(vis('jord', 'skog-trysil', 'Skog i Trysil')).toContain('Ny skog')
    expect(vis('jord', 'gard-lista', 'Gård på Lista')).toContain('Ny gård')
    const tarn = vis('landemerke', 'tarnet', 'Oslotårnet')
    expect(tarn).toContain('Nytt landemerke')
    expect(tarn).toContain('lerret')
    avsluttKjop(99)
  })
})

describe('G11: ekte bilder i Avisa', () => {
  it('startupsakene viser selskapets logo, og konkursen trykkes i grått', () => {
    expect(avisbilde(sak('Elferja søker penger', 'marked'))).toEqual({ art: 'startup', navn: 'Elferja' })
    expect(avisbilde(sak('Kvitre til børs'))).toEqual({ art: 'startup', navn: 'Kvitre' })
    expect(avisbilde(sak('Skygge AI kjøpt opp', 'marked'))).toEqual({ art: 'startup', navn: 'Skygge AI' })
    expect(avisbilde(sak('Matbudet er konkurs'))).toEqual({ art: 'startup', navn: 'Matbudet', konkurs: true })
  })

  it('en utstilling viser ditt dyreste verk av kunstneren, ellers kunstnerens dyreste', () => {
    const t = sak('Stor utstilling for Einar Solheim', 'marked')
    expect(avisbilde(t)).toEqual({ art: 'maleri', id: 'skrik-i-byen' })
    expect(avisbilde(t, { malerier: ['morgenlys'] })).toEqual({ art: 'maleri', id: 'morgenlys' })
    expect(avisbilde(t, { malerier: ['morgenlys', 'nordlys-over-vaagen'] })).toEqual({ art: 'maleri', id: 'nordlys-over-vaagen' })
    expect(avisbilde(sak('Stor utstilling for Maja Lind'))).toEqual({ art: 'maleri', id: 'kvinne-i-roedt' })
  })
})

describe('G11: klubbvåpen i Avisa', () => {
  it('en kamp viser begge våpnene, hjemmelaget først', () => {
    expect(avisbilde(sak('Sjøholt SK 2–1 Nordvik BK'))).toEqual({ art: 'kamp', hjemme: 'Sjøholt SK', borte: 'Nordvik BK' })
    expect(avisbilde(sak('Nordvik BK 0–0 Lia IL'))).toEqual({ art: 'kamp', hjemme: 'Nordvik BK', borte: 'Lia IL' })
  })

  it('opprykk, nedrykk og seriegull viser klubbens våpen — gullet med pokal', () => {
    expect(avisbilde(sak('OPPRYKK: Nordvik BK til 3. divisjon'))).toEqual({ art: 'klubb', navn: 'Nordvik BK' })
    expect(avisbilde(sak('Nedrykk for Nordvik BK'))).toEqual({ art: 'klubb', navn: 'Nordvik BK' })
    expect(avisbilde(sak('Nordvik BK vinner Eliteserien!'))).toEqual({ art: 'klubb', navn: 'Nordvik BK', pokal: true })
    // Byens seriegull er en lokalsak, ikke din klubb.
    expect(avisbilde(sak('Bergen vinner seriegull', 'lokalt'))).toEqual({ art: 'ikon', navn: 'trofe' })
  })

  it('en spiller som legger opp, viser klubben du eier — ikke rivalen med samme etternavn', () => {
    expect(avisbilde(sak('Ola Lunde legger opp'), { klubb: 'Fjordby IL' })).toEqual({ art: 'klubb', navn: 'Fjordby IL' })
    expect(avisbilde(sak('Ola Lunde legger opp'))).toEqual({ art: 'ikon', navn: 'ball' })
  })
})
