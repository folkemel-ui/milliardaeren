/**
 * Felles oppsett for alle testfilene (Pakke 104): etter hver test slipper arbeideren til
 * meldingene sine.
 *
 * Testkjøreren og arbeiderne snakker sammen med meldinger som har 60 s tidsfrist, og
 * fristen går i arbeideren. Mellom to tester venter Vitest bare på promiser, ikke på
 * meldinger — så en fil med mange synkrone tester holder arbeideren opptatt hele veien.
 * G13 og G16 (tegner alt på hvert trinn) og de gamle lagringene tar 49–55 s alene; på en
 * travel maskin gikk de over 60 s, fristen løp ut før svaret ble lest, og kjøringen endte
 * med «Timeout calling onTaskUpdate» — selv om hver test besto. En setTimeout(0) etter
 * hver test lar svaret komme inn.
 */

import { afterEach } from 'vitest'

afterEach(() => new Promise<void>((r) => setTimeout(r, 0)))
