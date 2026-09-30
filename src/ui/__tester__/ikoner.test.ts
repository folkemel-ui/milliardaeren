import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PRESTASJONER } from '../../engine/prestasjoner'
import { MERKER } from '../merker'

const SRC = fileURLToPath(new URL('../../', import.meta.url))

/** Alle kildefiler utenom testene. */
function kildefiler(mappe = SRC): string[] {
  return readdirSync(mappe).flatMap((navn) => {
    const sti = join(mappe, navn)
    if (statSync(sti).isDirectory()) return navn === '__tester__' ? [] : kildefiler(sti)
    return /\.(tsx?|css)$/.test(navn) ? [sti] : []
  })
}

describe('ikoner i stedet for emoji', () => {
  it('hver prestasjon har en medalje', () => {
    expect(PRESTASJONER.filter((p) => !MERKER[p.id]).map((p) => p.id)).toEqual([])
  })

  it('ingen emoji i koden', () => {
    const funn: string[] = []
    for (const fil of kildefiler()) {
      readFileSync(fil, 'utf8')
        .split('\n')
        .forEach((linje, i) => {
          // Kommentarer får vise hva som var der før.
          if (/^\s*(\/\/|\*|\/\*)/.test(linje)) return
          if (/\p{Extended_Pictographic}/u.test(linje)) funn.push(`${fil.slice(SRC.length)}:${i + 1}: ${linje.trim()}`)
        })
    }
    expect(funn).toEqual([])
  })
})
