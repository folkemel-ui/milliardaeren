/** Pakke 105: hva hvert kjøp på gården gir, og lagerets tre valg. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { nyttSpill } from '../../engine/start'
import { kjopGardsbygg, kjopJord, kjopJorde, settLagring, type Utfall } from '../../engine/handlinger'
import type { Spilltilstand } from '../../engine/types'
import { Gardskart } from '../komponenter/JordOgLandemerker'
import { gardTekst } from '../inntjening'
import { UKE_SEK } from '../../engine/jord'
import { lastAlle } from '../vedBehov'

const ID = 'gard-lista' as const

function ok(u: Utfall): Spilltilstand {
  if (!u.ok) throw new Error(u.feil)
  return u.tilstand
}

beforeAll(async () => {
  await lastAlle()
})

function medGard(): Spilltilstand {
  const s = nyttSpill()
  s.kontanter = 1e13
  s.hoyesteFormue = 1e13
  return ok(kjopJord(s, ID))
}

const tegn = (s: Spilltilstand) => renderToStaticMarkup(createElement(Gardskart, { s, id: ID }))

describe('hva et kjøp gir', () => {
  it('«≈ kr X i uka · tilbake på T»', () => {
    // Ti uker til prisen, og en uke er 35 minutter: 5 t 50 min.
    expect(UKE_SEK).toBe(35 * 60)
    expect(gardTekst(10_000_000, 1_000_000)).toMatch(/^≈ kr 1 mill i uka · tilbake på 5 t 50 min$/)
    expect(gardTekst(1, 0)).toBe('Gir ingenting mer på denne gården')
  })

  it('står på hver maskin, hvert bygg som kan bygges og neste jord — ikke på fjøset', () => {
    const html = tegn(medGard())
    // Tre maskiner, drenering, frostdekke og silo; drivhuset og låven er sperret, fjøset gir ingenting selv.
    expect(html.match(/i uka · tilbake på/g)!.length).toBe(3 + 3 + 1)
    expect(html).toContain('Neste jord: ≈ kr')
    expect(html).not.toMatch(/Fjøs<\/strong><br\/><span class="dempet">[^<]*<\/span><br\/>/)
  })

  it('forsvinner når gården er full og når tingen er kjøpt', () => {
    let s = medGard()
    while ((s.jord[ID]!.jorder ?? 3) < 10) s = ok(kjopJorde(s, ID))
    s = ok(kjopGardsbygg(s, ID, 'silo'))
    const html = tegn(s)
    expect(html).not.toContain('Neste jord')
    expect(html).not.toMatch(/Silo<\/strong><br\/><span class="dempet">[^<]*<\/span><br\/>/)
  })
})

describe('lageret', () => {
  it('tre valg, «Selg dyrt» for en ny silo, og en rad per slag med låve', () => {
    let s = medGard()
    while ((s.jord[ID]!.jorder ?? 3) < 10) s = ok(kjopJorde(s, ID))
    s = ok(kjopGardsbygg(s, ID, 'silo'))
    let html = tegn(s)
    expect(html).toContain('role="radiogroup" aria-label="Lageret mandag"')
    expect(html).toMatch(/aria-checked="true" class="aktiv">Selg dyrt</)
    expect(html).toContain('Lagre billig, selg dyrt')
    expect(html.match(/class="lagerrad"/g)!.length).toBe(1)
    s = ok(settLagring(ok(kjopGardsbygg(s, ID, 'laave')), ID, 'lagre'))
    html = tegn(s)
    expect(html).toContain('Silo og låve')
    expect(html.match(/class="lagerrad"/g)!.length).toBe(3)
    for (const navn of ['Korn', 'Grønnsaker', 'Frukt og bær']) expect(html).toContain(`<span class="liten">${navn}</span>`)
    expect(html).toMatch(/aria-checked="true" class="aktiv">Lagre</)
    expect(html).toContain('Selg lageret')
  })
})
