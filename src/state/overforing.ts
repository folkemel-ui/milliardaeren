/**
 * Flytting av spillet mellom enheter: lagringen pakkes til en tekstkode du
 * kan kopiere, sende eller lagre som fil, og pakkes ut igjen på den andre
 * enheten. Koden er JSON, gzip-komprimert og base64-kodet, med et prefiks
 * som sier hvilket format det er. Nettlesere uten komprimering får en
 * ukomprimert kode, og begge kan leses overalt der komprimering finnes.
 *
 * Utpakking går gjennom migreringen, så en kode fra en eldre versjon av
 * spillet fungerer i en nyere. Etterpå sjekkes det at spillet faktisk kan
 * spilles, så en ødelagt kode aldri erstatter spillet.
 */

import type { Spilltilstand } from '../engine/types'
import { migrer } from './migrering'
import { sjekkTilstand } from './sjekk'
import { tilLagring } from './lagringsformat'

const GZIP = 'MLD1:'
const RÅ = 'MLD0:'

function tilBase64(bytes: Uint8Array): string {
  let binær = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binær += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binær)
}

function fraBase64(tekst: string): Uint8Array<ArrayBuffer> {
  const binær = atob(tekst)
  const bytes = new Uint8Array(binær.length)
  for (let i = 0; i < binær.length; i++) bytes[i] = binær.charCodeAt(i)
  return bytes
}

async function strøm(bytes: Uint8Array<ArrayBuffer>, transform: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const ut = new Blob([bytes]).stream().pipeThrough(transform)
  return new Uint8Array(await new Response(ut).arrayBuffer())
}

/** Pakker en spilltilstand til en kode. */
export async function pakk(s: Spilltilstand): Promise<string> {
  const bytes = new TextEncoder().encode(tilLagring(s))
  if (typeof CompressionStream === 'undefined') return RÅ + tilBase64(bytes)
  return GZIP + tilBase64(await strøm(bytes, new CompressionStream('gzip')))
}

export type Utpakking = { ok: true; tilstand: Spilltilstand } | { ok: false; feil: string }

/** Pakker ut en kode og løfter den til gjeldende versjon. Mellomrom og linjeskift i koden ignoreres. */
export async function pakkUt(kode: string): Promise<Utpakking> {
  const ren = kode.replace(/\s+/g, '')
  const prefiks = ren.slice(0, 5)
  if (prefiks !== GZIP && prefiks !== RÅ) return { ok: false, feil: 'Dette ser ikke ut som en kode fra Milliardær.' }
  let json: string
  try {
    const bytes = fraBase64(ren.slice(5))
    if (prefiks === GZIP) {
      if (typeof DecompressionStream === 'undefined') return { ok: false, feil: 'Denne nettleseren kan ikke lese komprimerte koder.' }
      json = new TextDecoder().decode(await strøm(bytes, new DecompressionStream('gzip')))
    } else {
      json = new TextDecoder().decode(bytes)
    }
  } catch {
    return { ok: false, feil: 'Koden er ødelagt eller ufullstendig. Kopierte du hele?' }
  }
  let rå: unknown
  try {
    rå = JSON.parse(json)
  } catch {
    return { ok: false, feil: 'Koden er ødelagt eller ufullstendig. Kopierte du hele?' }
  }
  const r = migrer(rå)
  if (!r.ok) return { ok: false, feil: r.feil }
  const feil = sjekkTilstand(r.tilstand)
  return feil ? { ok: false, feil } : { ok: true, tilstand: r.tilstand }
}
