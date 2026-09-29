import { useState, type ReactNode } from 'react'

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
 * En seksjon du kan folde sammen. Uten eget valg er den åpen når du har noe
 * i den (`harInnhold`), og lukket ellers. Trykker du på overskriften, huskes
 * valget ditt.
 */
export function Seksjon({
  id,
  tittel,
  sammendrag,
  harInnhold,
  children,
}: {
  id: string
  tittel: string
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
      <button className="seksjon-hode" aria-expanded={åpen} onClick={bytt}>
        <span className="seksjon-pil" aria-hidden="true">
          ▸
        </span>
        <h2 className="seksjon-tittel">{tittel}</h2>
        {sammendrag && <span className="dempet liten seksjon-sammendrag">{sammendrag}</span>}
      </button>
      {åpen && <div className="seksjon-innhold">{children}</div>}
    </div>
  )
}
