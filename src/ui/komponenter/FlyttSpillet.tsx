import { useState } from 'react'
import { eksporter, importer } from '../../state/lager'
import { tall } from '../format'

const FILNAVN = 'milliardaer-lagring.txt'

/**
 * Flytt spillet til en annen enhet: kopier koden eller lagre den som fil her,
 * og lim inn eller velg filen der. Importen erstatter spillet på enheten,
 * men det gamle legges i angre-posten.
 */
export function FlyttSpillet() {
  const [melding, settMelding] = useState<string | null>(null)
  const [kode, settKode] = useState('')
  const [bekreft, settBekreft] = useState(false)

  async function kopier() {
    const k = await eksporter()
    try {
      await navigator.clipboard.writeText(k)
      settMelding(`Koden er kopiert (${tall(k.length)} tegn). Lim den inn under «Hent inn» på den andre enheten.`)
    } catch {
      // Uten tilgang til utklippstavlen: vis koden, så den kan kopieres for hånd.
      settKode(k)
      settMelding('Kunne ikke kopiere automatisk. Koden står i feltet under — merk alt og kopier.')
    }
  }

  async function lagreFil() {
    const k = await eksporter()
    const fil = new File([k], FILNAVN, { type: 'text/plain' })
    // På mobil: del-arket, så filen kan sendes eller lagres. Ellers: vanlig nedlasting.
    if (navigator.canShare?.({ files: [fil] })) {
      try {
        await navigator.share({ files: [fil], title: 'Milliardær-lagring' })
        return
      } catch {
        /* avbrutt — faller tilbake til nedlasting */
      }
    }
    const url = URL.createObjectURL(fil)
    const a = document.createElement('a')
    a.href = url
    a.download = FILNAVN
    a.click()
    URL.revokeObjectURL(url)
    settMelding(`Lagret som ${FILNAVN}.`)
  }

  async function lesFil(fil: File | undefined) {
    if (!fil) return
    settKode(await fil.text())
    settBekreft(false)
    settMelding('Filen er lest inn. Trykk «Hent inn» for å bytte til det spillet.')
  }

  async function hentInn() {
    const feil = await importer(kode)
    settBekreft(false)
    if (feil) settMelding(feil)
    else {
      settKode('')
      settMelding('Spillet er hentet inn. Det forrige spillet på denne enheten ligger i reservekopien under.')
    }
  }

  return (
    <div className="kort flytt">
      <h2 className="kort-tittel">Flytt spillet</h2>
      <p className="dempet liten">
        Spillet lagres i nettleseren på hver enhet. For å spille videre et annet sted: ta med koden herfra, og hent den inn der.
      </p>
      <div className="rival-knapper">
        <button className="knapp knapp-gull" onClick={kopier}>
          Kopier kode
        </button>
        <button className="knapp" onClick={lagreFil}>
          Lagre som fil
        </button>
      </div>

      <label className="etikett" htmlFor="flytt-kode">
        Hent inn fra en annen enhet
      </label>
      <textarea
        id="flytt-kode"
        className="flytt-kode"
        rows={3}
        placeholder="Lim inn koden her …"
        value={kode}
        onChange={(e) => {
          settKode(e.target.value)
          settBekreft(false)
        }}
      />
      <div className="rival-knapper">
        <label className="knapp flytt-fil">
          Velg fil
          <input type="file" accept=".txt,text/plain" onChange={(e) => lesFil(e.target.files?.[0])} />
        </label>
        {bekreft ? (
          <button className="knapp knapp-fare" onClick={hentInn}>
            Ja, bytt spill
          </button>
        ) : (
          <button className="knapp" disabled={!kode.trim()} onClick={() => settBekreft(true)}>
            Hent inn
          </button>
        )}
      </div>
      {bekreft && <p className="dempet liten">Dette erstatter spillet på denne enheten. Det nåværende legges i reservekopien.</p>}
      {melding && <p className="rival-melding">{melding}</p>}
    </div>
  )
}
