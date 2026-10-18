// @vitest-environment happy-dom
/**
 * `Illustrasjon` viser et tomt lerret til en eiendoms- eller luksustegning er hentet (G12). Tegningen
 * ble kalt som en funksjon, så en tegning med en krok i kroppen (lommeuret leser `IScenen`) ga
 * `Illustrasjon` én krok mer etter hentingen enn før, og React advarte om «a change in the order of
 * Hooks». Nå tegnes den som en komponent, og antallet kroker i `Illustrasjon` er det samme hver gang.
 */

import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { Illustrasjon } from '../komponenter/Illustrasjoner'
import { lastAlle } from '../vedBehov'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('Illustrasjon før og etter at tegningen er hentet', () => {
  it('lommeuret bytter fra tomt lerret til tegning uten advarsel om krokenes rekkefølge', async () => {
    const feil = vi.spyOn(console, 'error').mockImplementation(() => {})
    const rot = document.createElement('div')
    document.body.append(rot)
    const r = createRoot(rot)
    await act(async () => r.render(createElement(Illustrasjon, { id: 'lommeur', størrelse: 60 })))
    expect(rot.querySelector('svg')).not.toBeNull()
    await act(async () => {
      await lastAlle()
    })
    expect(rot.innerHTML.length).toBeGreaterThan(2000)
    const kroker = feil.mock.calls.filter((a) => String(a[0]).includes('order of Hooks'))
    act(() => r.unmount())
    rot.remove()
    feil.mockRestore()
    expect(kroker).toEqual([])
  })
})
