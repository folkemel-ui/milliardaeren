/**
 * Sjekker at en lagring faktisk kan spilles, før den får erstatte spillet.
 * Migreringen ser bare på versjonsnummeret; her ses det etter at de viktigste
 * feltene finnes og har riktig form, og så kjøres ett sekund på prøve — et
 * spill som krasjer da, ville krasjet ved hver oppstart.
 */

import { simuler } from '../engine/simulering'
import { nettoformue } from '../engine/formler'
import type { Spilltilstand } from '../engine/types'

const TALL = ['versjon', 'frø', 'sek', 'kontanter', 'gjeld', 'sparing', 'nesteId', 'totaltTjent', 'hoyesteFormue'] as const
const LISTER = ['bedrifter', 'hendelser', 'luksus', 'avis', 'rivaler', 'oppgjor'] as const
const OBJEKTER = ['marked', 'beholdning', 'eiendommer', 'lager', 'skatt', 'historikk', 'prestasjoner', 'rekorder'] as const

const erObjekt = (x: unknown) => typeof x === 'object' && x !== null && !Array.isArray(x)

/** Feilmeldingen hvis lagringen ikke kan brukes, ellers null. */
export function sjekkTilstand(s: Spilltilstand): string | null {
  const r = s as unknown as Record<string, unknown>
  for (const f of TALL) if (!Number.isFinite(r[f])) return `Lagringen er ødelagt: «${f}» mangler eller er ikke et tall.`
  for (const f of LISTER) if (!Array.isArray(r[f])) return `Lagringen er ødelagt: «${f}» mangler.`
  for (const f of OBJEKTER) if (!erObjekt(r[f])) return `Lagringen er ødelagt: «${f}» mangler.`
  for (const b of s.bedrifter) {
    if (!erObjekt(b) || typeof b.type !== 'string' || !Number.isFinite(b.nivaa) || b.nivaa < 1) {
      return 'Lagringen er ødelagt: en av bedriftene mangler type eller nivå.'
    }
  }
  try {
    const prøve = simuler(s, 1)
    if (!Number.isFinite(nettoformue(prøve))) return 'Lagringen er ødelagt: nettoformuen kan ikke regnes ut.'
  } catch (e) {
    return `Lagringen kan ikke spilles: ${e instanceof Error ? e.message : String(e)}`
  }
  return null
}
