import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { aktivKo, betjenKo, kanSelgeSelv, KO_VARER_SEK, KOPPEPRIS, selgKopp } from '../../engine/hender'
import type { Bedrift, Spilltilstand } from '../../engine/types'
import { utforMed } from '../../state/lager'
import { kortKroner } from '../format'
import { Ikon } from './Ikoner'

// ─────────────────────────────────────────────── Holde inne

/** Ventetiden før knappen begynner å gjenta, og den korteste tiden mellom to gjentak. */
const FØRSTE_VENT_MS = 400
const RASKEST_MS = 50

/**
 * Gjør en knapp til en du kan holde inne: første trykk virker med en gang,
 * og holder du, gjentas det stadig raskere. `steg` får vite om det er første
 * trykk (da vises feil som vanlig) og svarer om det gikk — et nei stopper.
 * Tastaturet (Enter og mellomrom) gir ett trykk, som en vanlig knapp.
 */
export function useHold(steg: (første: boolean) => boolean) {
  const tidtaker = useRef<number | null>(null)
  const stegRef = useRef(steg)
  stegRef.current = steg

  const stopp = useCallback(() => {
    if (tidtaker.current !== null) clearTimeout(tidtaker.current)
    tidtaker.current = null
  }, [])
  useEffect(() => stopp, [stopp])

  const planlegg = (vent: number) => {
    tidtaker.current = window.setTimeout(() => {
      if (!stegRef.current(false)) return stopp()
      planlegg(Math.max(RASKEST_MS, vent === FØRSTE_VENT_MS ? 180 : vent * 0.85))
    }, vent)
  }

  return {
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return
      stopp()
      if (stegRef.current(true)) planlegg(FØRSTE_VENT_MS)
    },
    onPointerUp: stopp,
    onPointerLeave: stopp,
    onPointerCancel: stopp,
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      // Pekeren har allerede gjort jobben ved trykket; et klikk med detail 0 kommer fra tastaturet.
      if (e.detail === 0) stegRef.current(true)
    },
    onContextMenu: (e: MouseEvent) => e.preventDefault(),
  }
}

// ─────────────────────────────────────────────── Flytende tall

/** «+kr 2» som stiger og blekner der du trykket. */
export function useFlytetall() {
  const [tall, settTall] = useState<{ id: number; tekst: string }[]>([])
  const neste = useRef(0)
  const legg = useCallback((tekst: string) => {
    const id = neste.current++
    settTall((t) => [...t.slice(-5), { id, tekst }])
    window.setTimeout(() => settTall((t) => t.filter((x) => x.id !== id)), 900)
  }, [])
  const vis = (
    <span className="flytetall-lag" aria-hidden="true">
      {tall.map((t) => (
        <span key={t.id} className="flytetall">
          {t.tekst}
        </span>
      ))}
    </span>
  )
  return [vis, legg] as const
}

// ─────────────────────────────────────────────── Selge selv og kø

/** Før saftboden har ansatte, selger du selv: én kopp per trykk. */
export function Koppknapp({ s, legg }: { s: Spilltilstand; legg: (tekst: string) => void }) {
  if (!kanSelgeSelv(s)) return null
  return (
    <div className="hender">
      <button
        className="knapp kopp-knapp"
        onClick={() => {
          // Taket på kopper per sekund gir bare et stille nei — trykk så fort du vil.
          if (utforMed(selgKopp, true) === null) legg(`+${kortKroner(KOPPEPRIS)}`)
        }}
      >
        <span>
          <Ikon navn="kopp" størrelse={18} /> Selg en kopp selv
        </span>
        <strong>+{kortKroner(KOPPEPRIS)}</strong>
      </button>
      <span className="dempet liten">Du selger selv til saftboden får sin første ansatte.</span>
    </div>
  )
}

/** Kø ved disken: trykk før kundene går, og få en halvt minutts inntekt ekstra. */
export function Koknapp({ s, b, legg }: { s: Spilltilstand; b: Bedrift; legg: (tekst: string) => void }) {
  const ko = aktivKo(s)
  if (!ko || ko.bedriftId !== b.id) return null
  const igjen = Math.max(0, ko.slutterSek - s.sek)
  return (
    <button
      className="ko-knapp"
      onClick={() => {
        if (utforMed(betjenKo) === null) legg(`+${kortKroner(ko.bonus)}`)
      }}
    >
      <span>
        <Ikon navn="folk" størrelse={18} /> <strong>Kø!</strong> Betjen dem
      </span>
      <strong>+{kortKroner(ko.bonus)}</strong>
      <span className="ko-tid" style={{ width: `${(igjen / KO_VARER_SEK) * 100}%` }} aria-hidden="true" />
    </button>
  )
}
