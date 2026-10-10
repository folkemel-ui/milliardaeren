/**
 * Alle stilarkene som én tekst, i den rekkefølgen de gjelder (Pakke 63):
 * src/styles/index.css importerer filene, og en test som leter etter en regel,
 * skal finne den uansett hvilken fil den står i.
 */

import { readFileSync } from 'node:fs'

const MAPPE = new URL('../../styles/', import.meta.url)

/** Filene index.css importerer, i rekkefølge. */
export function stilfiler(): string[] {
  const index = readFileSync(new URL('index.css', MAPPE), 'utf8')
  return [...index.matchAll(/@import\s+'\.\/([\w-]+\.css)'/g)].map((m) => m[1])
}

/** Hele stilen, med \n som linjeskift. */
export function alleStiler(): string {
  return stilfiler()
    .map((f) => readFileSync(new URL(f, MAPPE), 'utf8'))
    .join('\n')
    .replace(/\r\n/g, '\n')
}
