import { useState, type ReactNode } from 'react'
import { Forklaring } from './Forklaring'
import type { Tema } from '../forklaringer'

const NOKKEL = 'milliardaer.seksjoner'

/** Hvilke seksjoner du har åpnet eller lukket selv. Lagres i nettleseren, ikke i spillet. */
function lesValg(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(NOKKEL) ?? '{}') as Record<string, boolean>
  } catch {
    return {}
  }
}

function lagreValg(id: string, åpen: boolean): void {
  try {
    localStorage.setItem(NOKKEL, JSON.stringify({ ...lesValg(), [id]: åpen }))
  } catch {
    /* bare en bekvemmelighet */
  }
}

/**
 * Overskriften for en hel del (Pakke 62): Hjem og Kunst er hver sin del i
 * Luksus, og en del som åpner på en sammenfoldet seksjon, ser tom ut.
 */
export function Delhode({ tittel, sammendrag, forklaring }: { tittel: string; sammendrag?: string; forklaring?: Tema }) {
  return (
    <div className="del-hode">
      <h2 className="seksjon-tittel">{tittel}</h2>
      {sammendrag && <span className="dempet liten">{sammendrag}</span>}
      {forklaring && <Forklaring tema={forklaring} />}
    </div>
  )
}

/**
 * En seksjon du kan folde sammen. Uten eget valg er den åpen når du har noe
 * i den (`harInnhold`), og lukket ellers. Trykker du på overskriften, huskes
 * valget ditt.
 */
export function Seksjon({
  id,
  tittel,
  sammendrag,
  harInnhold,
  forklaring,
  children,
}: {
  id: string
  tittel: string
  /** Et «?» ved overskriften som forklarer systemet. */
  forklaring?: Tema
  sammendrag?: string
  harInnhold: boolean
  children: ReactNode
}) {
  const [valgt, settValgt] = useState<boolean | undefined>(() => lesValg()[id])
  const åpen = valgt ?? harInnhold
  const bytt = () => {
    lagreValg(id, !åpen)
    settValgt(!åpen)
  }
  return (
    <div className={åpen ? 'seksjon åpen' : 'seksjon'}>
      <div className="seksjon-hoderad">
        <button className="seksjon-hode" aria-expanded={åpen} onClick={bytt}>
          <span className="seksjon-pil" aria-hidden="true">
            ▸
          </span>
          <h2 className="seksjon-tittel">{tittel}</h2>
          {sammendrag && <span className="dempet liten seksjon-sammendrag">{sammendrag}</span>}
        </button>
        {forklaring && <Forklaring tema={forklaring} />}
      </div>
      {åpen && <div className="seksjon-innhold">{children}</div>}
    </div>
  )
}
