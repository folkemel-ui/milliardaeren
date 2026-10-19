/**
 * Skogen: hogst, bestand, sagbruk, maskiner, naboskog og forsikring.
 * En del av spillerens handlinger (Pakke 122 flyttet skogen ut av eiendom.ts, som nådde
 * Pakke 65s grense på 300 linjer). Hver er en ren funksjon: tilstand inn, ny tilstand ut.
 */

import { DAG_SEK, dagnummer } from '../kalender'
import { leggTilHendelse } from '../bank'
import { flyt } from '../portefolje'
import {
  bestand,
  bestandsalder,
  bestandsverdi,
  FORSIKRING_DAGER,
  forsikringspris,
  HOGSTER_HUSKET,
  JORD,
  MAKS_BESTAND,
  MAKS_MASKINTRINN,
  MAKS_NABOER,
  naboer,
  naboskogpris,
  naboskogTommer,
  nesteBestandpris,
  perfektOmlop,
  plantetrinnEtterPlanting,
  rekordPerDag,
  sagbrukpris,
  SKOGMASKINER,
  skogmaskinpris,
  skogmaskintrinn,
  skognavn,
  tommerverdi,
} from '../jord'
import type { JordId, Skogmaskin, Spilltilstand } from '../types'
import { kortKroner } from '../tall'
import { feil, type Utfall } from './felles'

/** Hogger hele skogen: alle bestandene på én gang, som før Pakke 120. */
export function hoggSkog(s: Spilltilstand, id: JordId): Utfall {
  if (!s.jord[id]) return feil('Du eier ikke skogen.')
  if (JORD[id].type !== 'skog') return feil('Det er ingen skog å hogge der.')
  const n = structuredClone(s)
  const tommer = tommerverdi(n, id)
  if (tommer < 1) return feil('Skogen er nyplantet — det er ingenting å hogge ennå.')
  const j = n.jord[id]!
  const b = bestand(j)
  for (let i = 0; i < b.length; i++) noterHogst(n, id, i, bestandsverdi(n, id, i))
  n.kontanter += tommer
  n.totaltHost += tommer
  n.totaltLeie += tommer
  j.bestand = b.map(() => n.sek)
  // Pakke 122: alle bestandene plantes med plantene skogen har nå.
  j.planter = b.map(() => skogmaskintrinn(j, 'planter'))
  j.plantetSek = n.sek
  flyt(n, 'eiendom', -tommer)
  leggTilHendelse(n, { tittel: 'Hogst', tekst: `${JORD[id].navn} er hogd. Tømmeret ga ${kortKroner(tommer)}, og ny skog er plantet.`, alvor: 'info' })
  return { ok: true, tilstand: n }
}

/**
 * Skriver en hogst i skogens regnskap. Pakke 123: en hogst som gir mer per dag enn noen før,
 * venter på morgendagens avis (`nyRekord`), og en hogst nær den beste dagen gir «Perfekt omløp».
 * Muterer.
 */
function noterHogst(n: Spilltilstand, id: JordId, i: number, belop: number): void {
  const j = n.jord[id]!
  const alder = bestandsalder(n, id, i)
  if (alder > 0) {
    const forrige = rekordPerDag(j)
    if (forrige !== null && belop / alder > forrige && (!j.nyRekord || belop / alder > j.nyRekord.belop / j.nyRekord.alder)) j.nyRekord = { bestand: i, belop, alder }
    j.rekordPerDag = Math.max(forrige ?? 0, belop / alder)
    if (perfektOmlop(j, i, alder)) j.perfektOmlop = true
  }
  const h = { dag: dagnummer(n.sek), bestand: i, alder: Math.round(alder * 10) / 10, belop }
  j.hogster = [...(j.hogster ?? []), h].slice(-HOGSTER_HUSKET)
  j.tommerTotalt = (j.tommerTotalt ?? 0) + belop
}

/** Hogger ett bestand (Pakke 120): tømmeret i det, og nytt bestand plantes. */
export function hoggBestand(s: Spilltilstand, id: JordId, i: number): Utfall {
  const j0 = s.jord[id]
  if (!j0) return feil('Du eier ikke skogen.')
  if (JORD[id].type !== 'skog') return feil('Det er ingen skog å hogge der.')
  if (!Number.isInteger(i) || i < 0 || i >= bestand(j0).length) return feil('Bestandet finnes ikke.')
  const n = structuredClone(s)
  const tommer = bestandsverdi(n, id, i)
  if (tommer < 1) return feil('Bestandet er nyplantet — det er ingenting å hogge ennå.')
  const j = n.jord[id]!
  noterHogst(n, id, i, tommer)
  const b = [...bestand(j)]
  b[i] = n.sek
  j.planter = plantetrinnEtterPlanting(j, i)
  j.bestand = b
  n.kontanter += tommer
  n.totaltHost += tommer
  n.totaltLeie += tommer
  flyt(n, 'eiendom', -tommer)
  leggTilHendelse(n, { tittel: 'Hogst', tekst: `Bestand ${i + 1} i ${skognavn(id)} er hogd. Tømmeret ga ${kortKroner(tommer)}, og nytt er plantet.`, alvor: 'info' })
  return { ok: true, tilstand: n }
}

/** Kjøper et bestand til (Pakke 120): en tredel mer jord, plantet nå. Prisen står i skogens verdi. */
export function kjopBestand(s: Spilltilstand, id: JordId): Utfall {
  const j0 = s.jord[id]
  if (!j0) return feil('Du eier ikke skogen.')
  const pris = nesteBestandpris(s, id)
  if (pris === null) return feil(`Skogen har ${MAKS_BESTAND} bestand.`)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const j = n.jord[id]!
  n.kontanter -= pris
  // Pakke 122: prisen står også i kostprisen, så et salg ikke skattes av det du selv la inn.
  j.kostpris += pris
  j.investert = (j.investert ?? 0) + pris
  const b = bestand(j)
  j.planter = [...Array.from({ length: b.length }, (_, k) => j.planter?.[k] ?? 0), skogmaskintrinn(j, 'planter')]
  j.bestand = [...b, n.sek]
  flyt(n, 'eiendom', pris)
  return { ok: true, tilstand: n }
}

/** Bygger skogens sagbruk (Pakke 121): hver hogst gir 20 % mer. Prisen står i skogens verdi. */
export function kjopSagbruk(s: Spilltilstand, id: JordId): Utfall {
  const j0 = s.jord[id]
  if (!j0) return feil('Du eier ikke skogen.')
  if (JORD[id].type !== 'skog') return feil('Sagbruk bygges ved skog.')
  if (j0.sagbruk) return feil('Skogen har sagbruk.')
  const pris = sagbrukpris(s, id)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const j = n.jord[id]!
  n.kontanter -= pris
  j.kostpris += pris
  j.investert = (j.investert ?? 0) + pris
  j.sagbruk = true
  flyt(n, 'eiendom', pris)
  return { ok: true, tilstand: n }
}

/** Neste trinn på en skogsmaskin (Pakke 122): vei, hogstmaskin eller bedre planter. */
export function kjopSkogmaskin(s: Spilltilstand, id: JordId, m: Skogmaskin): Utfall {
  const j0 = s.jord[id]
  if (!j0) return feil('Du eier ikke skogen.')
  if (JORD[id].type !== 'skog') return feil('Skogsmaskiner hører til en skog.')
  if (!SKOGMASKINER[m]) return feil('Ukjent maskin.')
  if (skogmaskintrinn(j0, m) >= MAKS_MASKINTRINN) return feil(`${SKOGMASKINER[m].navn} er på høyeste trinn.`)
  const pris = skogmaskinpris(s, id, m)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const j = n.jord[id]!
  n.kontanter -= pris
  j.kostpris += pris
  j.investert = (j.investert ?? 0) + pris
  j.skogmaskiner = { ...(j.skogmaskiner ?? {}), [m]: skogmaskintrinn(j, m) + 1 }
  flyt(n, 'eiendom', pris)
  return { ok: true, tilstand: n }
}

/**
 * Kjøper naboskogen (Pakke 122): jorda for 7,5 × skogens jord, og tømmeret som står der til det
 * er verdt. Jorda står i skogens verdi; tømmeret står i tømmerverdien, så formuen står stille.
 */
export function kjopNaboskog(s: Spilltilstand, id: JordId): Utfall {
  const j0 = s.jord[id]
  if (!j0) return feil('Du eier ikke skogen.')
  if (JORD[id].type !== 'skog') return feil('Naboskog kjøpes til en skog.')
  if (naboer(j0) >= MAKS_NABOER) return feil(`Skogen har ${MAKS_NABOER} naboskoger.`)
  const jordpris = naboskogpris(s, id)
  if (jordpris === null) return feil(`Bare en skog med alle ${MAKS_BESTAND} bestandene kan kjøpe naboskogen.`)
  const pris = jordpris + naboskogTommer(s, id)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const j = n.jord[id]!
  n.kontanter -= pris
  j.kostpris += pris
  j.investert = (j.investert ?? 0) + jordpris
  j.naboer = naboer(j) + 1
  flyt(n, 'eiendom', pris)
  return { ok: true, tilstand: n }
}

/** Forsikrer skogen for et år (Pakke 122), betalt på forskudd og fornyet av seg selv. */
export function kjopSkogforsikring(s: Spilltilstand, id: JordId): Utfall {
  const j0 = s.jord[id]
  if (!j0) return feil('Du eier ikke skogen.')
  if (JORD[id].type !== 'skog') return feil('Skogforsikring er for skog.')
  if ((j0.forsikretTil ?? 0) > s.sek) {
    if (j0.fornyForsikring) return feil('Skogen er forsikret.')
    // Sagt opp, men året løper ennå: bare slå fornyelsen på igjen.
    const n = structuredClone(s)
    n.jord[id]!.fornyForsikring = true
    return { ok: true, tilstand: n }
  }
  const pris = forsikringspris(s, id)
  if (s.kontanter < pris) return feil('Du har ikke råd.')
  const n = structuredClone(s)
  const j = n.jord[id]!
  n.kontanter -= pris
  n.totaltForbruk += pris
  j.forsikretTil = n.sek + FORSIKRING_DAGER * DAG_SEK
  j.fornyForsikring = true
  j.forsikringBetalt = (j.forsikringBetalt ?? 0) + pris
  return { ok: true, tilstand: n }
}

/** Sier opp skogforsikringen: den løper ut året den er betalt for, og fornyes ikke. */
export function siOppSkogforsikring(s: Spilltilstand, id: JordId): Utfall {
  const j0 = s.jord[id]
  if (!j0?.fornyForsikring) return feil('Skogen har ingen forsikring å si opp.')
  const n = structuredClone(s)
  n.jord[id]!.fornyForsikring = false
  return { ok: true, tilstand: n }
}
