/**
 * Fanene som lastes når de trengs (Pakke 96), som tegningene i G12 (`ui/vedBehov.ts`).
 *
 * Spillet åpner på Bedrifter, men startskriptet hadde med alle fanene: klubben, racing,
 * Børsen, rivalportrettene og avisa. Nå er Investeringer, Eiendom, Luksus, Profil og
 * avisa egne biter. Startskriptet gikk fra 290.7 til ~230 kB gzippet. Bitene hentes i ro
 * like etter start (`forvarm`), så et fanebytte nesten aldri venter, og service workeren
 * har dem lagret fra første besøk.
 *
 * Til en fane er hentet, står innholdet tomt; menyen og toppfeltet er der hele tiden.
 */

import type { ComponentType } from 'react'
import { useDel, vedBehov, type Del } from './vedBehov'

export const SKJERMER = {
  investeringer: vedBehov('Investeringer', () => import('./screens/Investeringer').then((m) => m.Investeringer)),
  eiendom: vedBehov('Eiendom', () => import('./screens/Eiendom').then((m) => m.Eiendom)),
  luksus: vedBehov('Luksus', () => import('./screens/Luksus').then((m) => m.Luksus)),
  profil: vedBehov('Profil', () => import('./screens/Profil').then((m) => m.Profil)),
}

/** Avisa åpnes med et trykk, aldri ved start. */
export const AVIS = vedBehov('Avis', () => import('./komponenter/Avis').then((m) => m.Avis))

/** Henter fanene og avisa. Klikktestene venter på dette, så et fanebytte tegner med en gang. */
export async function lastSkjermer(): Promise<void> {
  await Promise.all([...Object.values(SKJERMER), AVIS].map((d) => d.last()))
}

/** Viser komponenten i en del når den er hentet, og ingenting før. Henter den om den mangler. */
export function Skjerm<P extends object>({ del, p }: { del: Del<ComponentType<P>>; p: P }) {
  const K = useDel(del)
  return K ? <K {...p} /> : null
}
