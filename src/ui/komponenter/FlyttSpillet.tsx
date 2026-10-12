import { useEffect, useState } from 'react'
import { eksporter, importer } from '../../state/lager'
import { tall } from '../format'

const FILNAVN = 'milliardaer-lagring.txt'
/** Så ofte koden lages på nytt mens panelet vises. */
const FERSK_MS = 15_000

/**
 * Flytt spillet til en annen enhet: kopier koden eller lagre den som fil her,
 * og lim inn eller velg filen der. Importen erstatter spillet på enheten,
 * men det gamle legges i angre-posten.
 */
export function FlyttSpillet() {
  const [melding, settMelding] = useState<string | null>(null)
  const [kode, settKode] = useState('')
  const [bekreft, settBekreft] = useState(false)
  const [henter, settHenter] = useState(false)
  /*
   * Pakke 95: koden lages når panelet vises og holdes fersk, så «Kopier kode» og «Lagre som fil»
   * kan kopiere eller dele inne i trykket. Safari nekter utklippstavlen og del-arket når det
   * kommer etter en ventet komprimering — da trykket var «brukt opp».
   */
  const [ferdig, settFerdig] = useState<string | null>(null)
  useEffect(() => {
    let aktiv = true
    const lag = () => void eksporter().then((k) => aktiv && settFerdig(k))
    lag()
    const t = setInterval(lag, FERSK_MS)
    return () => {
      aktiv = false
      clearInterval(t)
    }
  }, [])

  function kopiert(k: string) {
    settMelding(`Koden er kopiert (${tall(k.length)} tegn). Lim den inn under «Hent inn» på den andre enheten.`)
  }

  function ikkeKopiert(k: string) {
    // Uten tilgang til utklippstavlen: vis koden, så den kan kopieres for hånd.
    settKode(k)
    settMelding('Kunne ikke kopiere automatisk. Koden står i feltet under — merk alt og kopier.')
  }

  function kopier() {
    const k = ferdig
    if (k && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(k).then(() => kopiert(k), () => ikkeKopiert(k))
      return
    }
    // Koden er ikke klar ennå: gi utklippstavlen et løfte (ClipboardItem), som Safari godtar inne i trykket.
    const lofte = eksporter()
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      navigator.clipboard
        .write([new ClipboardItem({ 'text/plain': lofte.then((x) => new Blob([x], { type: 'text/plain' })) })])
        .then(() => lofte.then(kopiert), () => lofte.then(ikkeKopiert))
      return
    }
    void lofte.then(ikkeKopiert)
  }

  async function lagreFil() {
    const k = ferdig ?? (await eksporter())
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
    // Safari starter nedlastingen etter klikket; frigis adressen med en gang, blir filen tom.
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    settMelding(`Lagret som ${FILNAVN}.`)
  }

  async function lesFil(fil: File | undefined) {
    if (!fil) return
    settKode(await fil.text())
    settBekreft(false)
    settMelding('Filen er lest inn. Trykk «Hent inn» for å bytte til det spillet.')
  }

  async function hentInn() {
    settHenter(true)
    const feil = await importer(kode)
    settHenter(false)
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
          <button className="knapp knapp-fare" disabled={henter} onClick={hentInn}>
            {henter ? 'Henter inn …' : 'Ja, bytt spill'}
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
