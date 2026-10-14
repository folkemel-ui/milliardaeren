/** Pakke 104: åtte nye aksjer — én for hver bransje som manglet, og et eiendomsselskap — og ett utbyttetall. */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { nyttSpill, SPILLVERSJON } from '../start'
import { simuler } from '../simulering'
import { AKSJER, NYE_PAPIRER, PAPIRER } from '../marked'
import { AKSJE_FOR } from '../bransjer'
import { FOND } from '../fond'
import { RAPPORTDAG, kvartalFor } from '../kvartal'
import { BEDRIFTSTYPER } from '../innhold'
import { DAG_SEK } from '../kalender'
import { MIGRERINGER } from '../../state/migrering'
import type { BedriftstypeId, PapirId, Spilltilstand } from '../types'
import { Papirlogo, PAPIRLOGOER } from '../../ui/komponenter/Papirlogo'
import { utbyttetekst } from '../../ui/komponenter/Marked'

const NYE: PapirId[] = ['SOL', 'NPL', 'GMN', 'KBN', 'BRD', 'FJH', 'TOP', 'NBE']

describe('de åtte nye aksjene', () => {
  it('er aksjer med rapportdag, logo og plass blant de nye papirene — men ikke i Børsfondet', () => {
    expect(AKSJER).toHaveLength(20)
    for (const id of NYE) {
      expect(PAPIRER[id].klasse, id).toBe('aksje')
      expect(RAPPORTDAG[id], id).toBeLessThanOrEqual(24)
      expect(NYE_PAPIRER, id).toContain(id)
      expect(PAPIRLOGOER, id).toContain(id)
      expect(FOND.BORSFOND.medlemmer, id).not.toContain(id)
    }
  })

  it('hver av de tretten bransjene har sin aksje; eiendomsselskapet står for seg selv', () => {
    for (const type of Object.keys(BEDRIFTSTYPER) as BedriftstypeId[]) expect(AKSJE_FOR[type], type).toBeDefined()
    expect(PAPIRER.NBE.bransje).toBeUndefined()
  })

  it('handles i et nytt spill fra første stund, med to timers historikk', () => {
    const s = nyttSpill()
    for (const id of NYE) {
      expect(s.marked.kurser[id].kurs, id).toBe(PAPIRER[id].startkurs)
      expect(s.marked.kurser[id].historikk.length, id).toBeGreaterThan(100)
    }
  })
})

describe('lagringsversjon 25 → 26', () => {
  it('legger til de nye aksjene og lar terningen og de gamle kursene stå', () => {
    expect(SPILLVERSJON).toBe(26)
    const s = simuler(nyttSpill(), DAG_SEK)
    const gammel = structuredClone(s) as unknown as Record<string, unknown>
    const kurser = { ...(s.marked.kurser as Record<string, unknown>) }
    for (const id of NYE) delete kurser[id]
    gammel.marked = { ...s.marked, kurser }
    const m = MIGRERINGER[25](gammel) as unknown as Spilltilstand
    expect(m.frø).toBe(s.frø)
    for (const id of NYE) expect(m.marked.kurser[id].kurs, id).toBe(PAPIRER[id].startkurs)
    for (const id of AKSJER.filter((x) => !NYE.includes(x))) expect(m.marked.kurser[id], id).toEqual(s.marked.kurser[id])
  })
})

describe('ett utbyttetall', () => {
  it('det justerte utbyttet per uke, også øverst på aksjen og i lista', () => {
    const s = nyttSpill()
    s.kvartal = { ...s.kvartal, FJK: { ...kvartalFor(s, 'FJK'), utbytteFaktor: 1.97 } }
    expect(utbyttetekst(s, 'FJK')).toBe(`${(PAPIRER.FJK.utbytte * 1.97 * 5 * 100).toFixed(2).replace('.', ',')} % i uka`)
    expect(utbyttetekst(s, 'TOP')).toBeNull()
  })

  it('logoen til en ny aksje er merket alene til ordmerket kommer', () => {
    const svg = renderToStaticMarkup(createElement(Papirlogo, { id: 'FJH', størrelse: 36, ordmerke: true }))
    expect(svg).toContain('viewBox="0 0 24 24"')
  })
})
