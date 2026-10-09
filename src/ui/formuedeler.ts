/**
 * Hva nettoformuen består av (Pakke 62), for Profil → Meg: hver slags ting du
 * eier, med fanen (og delen) den hører til. Summen av radene er nettoformuen.
 * Fargene følger gruppen, ikke rekkefølgen: Bedrifter er alltid --kilde-1.
 */

import { bedriftsverdi, papirverdi } from '../engine/formler'
import { fondverdi } from '../engine/fond'
import { obligasjonsverdi } from '../engine/obligasjoner'
import { eiendomsverdi, luksusverdi } from '../engine/eiendom'
import { hjemverdi } from '../engine/hjemmene'
import { klubbverdi } from '../engine/klubb'
import { kunstverdi } from '../engine/kunst'
import { rivalverdi } from '../engine/rivaler'
import { startupverdi } from '../engine/startups'
import type { Spilltilstand } from '../engine/types'
import type { Fane } from './komponenter/Fanemeny'
import type { Investeringsdel, Luksusdel } from './deler'

export type Formuegruppe = 'bedrifter' | 'investeringer' | 'eiendom' | 'luksus' | 'kontanter'

/** Hver gruppe har sin faste farge i stolpen. */
export const GRUPPEFARGE: Record<Formuegruppe, string> = {
  bedrifter: 'var(--kilde-1)',
  investeringer: 'var(--kilde-2)',
  eiendom: 'var(--kilde-3)',
  luksus: 'var(--kilde-4)',
  kontanter: 'var(--kilde-5)',
}

/** Hvor et trykk på raden tar deg. Kontanter har ingen fane. */
export type Formuemaal = { fane: Fane; investeringsdel?: Investeringsdel; luksusdel?: Luksusdel }

export interface Formuerad {
  id: string
  navn: string
  verdi: number
  gruppe: Formuegruppe
  /** En underrad i Luksus — Samling, Hjem, Kunst og Klubb deler gruppens farge. */
  under?: boolean
  maal?: Formuemaal
}

export interface Formuedeler {
  /** Gruppene med verdi, i fast rekkefølge, for stolpen. */
  grupper: { gruppe: Formuegruppe; navn: string; verdi: number }[]
  /** Radene under stolpen. Bare det du har, og gjelden når du har noen. */
  rader: Formuerad[]
  gjeld: number
  netto: number
}

export function formuedeler(s: Spilltilstand): Formuedeler {
  const bedrifter = s.bedrifter.reduce((sum, b) => sum + bedriftsverdi(b), 0)
  const investeringer = papirverdi(s) + fondverdi(s) + obligasjonsverdi(s) + rivalverdi(s) + startupverdi(s) + s.sparing
  const eiendom = eiendomsverdi(s)
  const samling = luksusverdi(s)
  const hjem = hjemverdi(s)
  const kunst = kunstverdi(s)
  const klubb = klubbverdi(s)
  const luksus = samling + hjem + kunst + klubb

  const alle: Formuerad[] = [
    { id: 'bedrifter', navn: 'Bedrifter', verdi: bedrifter, gruppe: 'bedrifter', maal: { fane: 'bedrifter' } },
    { id: 'investeringer', navn: 'Investeringer', verdi: investeringer, gruppe: 'investeringer', maal: { fane: 'investeringer', investeringsdel: 'oversikt' } },
    { id: 'eiendom', navn: 'Eiendom', verdi: eiendom, gruppe: 'eiendom', maal: { fane: 'eiendom' } },
    { id: 'luksus', navn: 'Luksus', verdi: luksus, gruppe: 'luksus' },
    { id: 'samling', navn: 'Samling', verdi: samling, gruppe: 'luksus', under: true, maal: { fane: 'luksus', luksusdel: 'samling' } },
    { id: 'hjem', navn: 'Hjem', verdi: hjem, gruppe: 'luksus', under: true, maal: { fane: 'luksus', luksusdel: 'hjem' } },
    { id: 'kunst', navn: 'Kunst', verdi: kunst, gruppe: 'luksus', under: true, maal: { fane: 'luksus', luksusdel: 'kunst' } },
    { id: 'klubb', navn: 'Klubb', verdi: klubb, gruppe: 'luksus', under: true, maal: { fane: 'luksus', luksusdel: 'klubb' } },
    { id: 'kontanter', navn: 'Kontanter', verdi: s.kontanter, gruppe: 'kontanter' },
  ]
  const grupper = alle.filter((r) => !r.under && r.verdi > 0).map((r) => ({ gruppe: r.gruppe, navn: r.navn, verdi: r.verdi }))
  // Bedriftene står alltid med, så lista aldri er tom.
  const rader = alle.filter((r) => r.verdi > 0 || r.id === 'bedrifter')
  return { grupper, rader, gjeld: s.gjeld, netto: bedrifter + investeringer + eiendom + luksus + s.kontanter - s.gjeld }
}
