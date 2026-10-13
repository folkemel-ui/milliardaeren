/**
 * Rivalen som skal åpnes i Selskaper (Pakke 99): fusjonsraden på en bedrift sender deg dit, og
 * Rivaler leser det én gang når den tegnes — åpner rivalens bedrifter og ruller til bransjen.
 * Ingenting lagres.
 */

import type { BedriftstypeId } from '../engine/types'

export interface Rivalmaal {
  id: string
  type: BedriftstypeId
}

let valgt: Rivalmaal | null = null

export const rivalvalg = {
  sett(m: Rivalmaal): void {
    valgt = m
  },
  /** Rivalen som ble valgt, én gang: neste kall gir null. */
  ta(): Rivalmaal | null {
    const v = valgt
    valgt = null
    return v
  },
}

/** Ruller til et element, under toppfeltet som står fast øverst. */
export function rullTil(el: HTMLElement): void {
  const topp = document.querySelector('.toppfelt')?.getBoundingClientRect().bottom ?? 0
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - Math.max(0, topp) - 8 })
}
