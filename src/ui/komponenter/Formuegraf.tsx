import type { Formuepunkt } from '../../engine/types'
import { kortKroner } from '../format'
import { Linjegraf } from './Linjegraf'

/** Nettoformuen over tid. Siste punkt er alltid «nå», så grafen følger med. */
export function Formuegraf({ punkter, naa }: { punkter: Formuepunkt[]; naa: Formuepunkt }) {
  const alle = punkter.length && punkter[punkter.length - 1].sek === naa.sek ? punkter : [...punkter, naa]
  return <Linjegraf punkter={alle} format={kortKroner} etikett="Nettoformue over tid" />
}
