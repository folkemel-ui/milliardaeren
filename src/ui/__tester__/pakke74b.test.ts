// @vitest-environment happy-dom
/** Pakke 74: fanene åpner der du var (hele appen, i happy-dom). Resten står i pakke74.test.ts. */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { startApp, type App } from './klikk'
import { nyttSpill } from '../../engine/start'
import type { Spilltilstand } from '../../engine/types'
import { glemRulling } from '../rullehusk'

describe('å komme tilbake dit du var i appen', () => {
  let app: App | null = null
  afterEach(() => {
    app?.lukk()
    app = null
    vi.restoreAllMocks()
  })

  function rik(): Spilltilstand {
    const s = nyttSpill(77)
    s.kontanter = 1e13
    s.hoyesteFormue = 1e13
    return s
  }

  it('Eiendom åpner på 2 500 etter et besøk i Luksus, men et trykk på fanen du er i, går til toppen', async () => {
    glemRulling()
    const ruller = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    let y = 0
    Object.defineProperty(window, 'scrollY', { configurable: true, get: () => y })
    app = await startApp(rik())

    await app.fane('Eiendom')
    y = 2500
    await app.fane('Luksus')
    ruller.mockClear()
    y = 0
    await app.fane('Eiendom')
    expect(ruller).toHaveBeenLastCalledWith({ top: 2500 })

    ruller.mockClear()
    y = 900
    await app.fane('Eiendom')
    expect(ruller).toHaveBeenLastCalledWith({ top: 0 })
  })
})
