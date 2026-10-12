import { useState } from 'react'

const NOKKEL = 'milliardaer.hjemskjerm'
/** «Ikke nå» viser kortet igjen etter så lang tid. */
const IGJEN_ETTER_MS = 3 * 24 * 60 * 60 * 1000

/**
 * Om spillet kjører i Safari på en iPhone eller iPad, i en vanlig fane — ikke fra
 * Hjem-skjermen, og ikke i Chrome, Firefox eller Edge på iOS (de kan ikke legge til der på
 * samme måte). En iPad melder seg som Mac, men har berøring.
 */
export function iSafariFane(ua = navigator.userAgent, plattform = navigator.platform, berøring = navigator.maxTouchPoints ?? 0): boolean {
  const ios = /iPad|iPhone|iPod/.test(ua) || (plattform === 'MacIntel' && berøring > 1)
  if (!ios || /CriOS|FxiOS|EdgiOS/.test(ua)) return false
  const frittstaende = (navigator as { standalone?: boolean }).standalone === true || window.matchMedia?.('(display-mode: standalone)').matches
  return !frittstaende
}

/** Om kortet skal vises nå: Safari-fane, og ikke skjult for godt eller utsatt. */
export function visHjemskjermkort(naa = Date.now()): boolean {
  if (!iSafariFane()) return false
  try {
    const v = localStorage.getItem(NOKKEL)
    if (v === 'skjult') return false
    if (v && naa < Number(v)) return false
  } catch {
    /* uten lagring: vis det */
  }
  return true
}

function husk(verdi: string): void {
  try {
    localStorage.setItem(NOKKEL, verdi)
  } catch {
    /* bare en bekvemmelighet */
  }
}

/**
 * «Legg spillet på Hjem-skjermen» (Pakke 95), fra første besøk: Safari sletter lagringen til
 * en nettside etter sju dager uten besøk, men ikke til et spill på Hjem-skjermen. Tre trykk,
 * forklart. «Ikke nå» viser det igjen om tre dager, «Skjul» aldri mer.
 */
export function Hjemskjermkort() {
  const [vis, settVis] = useState(visHjemskjermkort)
  if (!vis) return null
  return (
    <div className="kort hjemskjermkort" role="note">
      <h2 className="kort-tittel">Legg spillet på Hjem-skjermen</h2>
      <p className="dempet liten">
        Safari sletter spillet ditt etter sju dager uten besøk. Fra Hjem-skjermen blir det liggende, og spillet åpner i full skjerm.
      </p>
      <ol className="liten hjemskjerm-steg">
        <li>
          Trykk på <strong>Del</strong> nederst i Safari.
        </li>
        <li>
          Velg <strong>Legg til på Hjem-skjerm</strong>.
        </li>
        <li>
          Trykk <strong>Legg til</strong>, og åpne spillet derfra.
        </li>
      </ol>
      <div className="eiendom-knapper">
        <button
          className="knapp knapp-liten"
          onClick={() => {
            husk(String(Date.now() + IGJEN_ETTER_MS))
            settVis(false)
          }}
        >
          Ikke nå
        </button>
        <button
          className="knapp knapp-liten"
          onClick={() => {
            husk('skjult')
            settVis(false)
          }}
        >
          Skjul
        </button>
      </div>
    </div>
  )
}
