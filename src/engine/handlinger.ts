/**
 * Spillerens handlinger. Hver er en ren funksjon: tilstand inn, ny tilstand
 * (eller en feilmelding) ut. Inndataene røres aldri.
 *
 * Delt per område i handlinger/ (Pakke 65); denne fila samler dem, så alle
 * som importerer herfra, gjør det som før.
 */

export type { Utfall } from './handlinger/felles'
export * from './handlinger/bedrifter'
export * from './handlinger/bors'
export * from './handlinger/bank'
export * from './handlinger/eiendom'
export * from './handlinger/luksus'
export * from './handlinger/klubb'
export * from './handlinger/selskaper'
export * from './handlinger/avis'
