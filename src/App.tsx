import { useEffect, useState } from 'react'
import { startSpillokke, useSpill } from './state/lager'
import { Fanemeny, type Fane } from './ui/komponenter/Fanemeny'
import { IkonEiendom, IkonInvesteringer, IkonLuksus } from './ui/komponenter/Ikoner'
import { Toppfelt } from './ui/komponenter/Toppfelt'
import { Bedrifter } from './ui/screens/Bedrifter'
import { KommerSnart } from './ui/screens/KommerSnart'
import { Profil } from './ui/screens/Profil'

const FANENOKKEL = 'milliardaer.fane'
const GYLDIGE: Fane[] = ['bedrifter', 'investeringer', 'eiendom', 'luksus', 'profil']

function husketFane(): Fane {
  try {
    const f = localStorage.getItem(FANENOKKEL) as Fane | null
    return f && GYLDIGE.includes(f) ? f : 'bedrifter'
  } catch {
    return 'bedrifter'
  }
}

export default function App() {
  const s = useSpill()
  const [fane, settFane] = useState<Fane>(husketFane)

  useEffect(startSpillokke, [])

  const velg = (f: Fane) => {
    settFane(f)
    window.scrollTo({ top: 0 })
    try {
      localStorage.setItem(FANENOKKEL, f)
    } catch {
      /* bare en bekvemmelighet */
    }
  }

  return (
    <div className="app">
      <Toppfelt s={s} tilProfil={() => velg('profil')} />
      <main className="innhold">
        {fane === 'bedrifter' && <Bedrifter s={s} />}
        {fane === 'investeringer' && (
          <KommerSnart
            tittel="Investeringer"
            ikon={<IkonInvesteringer størrelse={48} />}
            tekst="Aksjer, krypto, oppstartsselskaper og banken."
          />
        )}
        {fane === 'eiendom' && (
          <KommerSnart
            tittel="Eiendom"
            ikon={<IkonEiendom størrelse={48} />}
            tekst="Leiligheter, kontorbygg og øyer som gir leieinntekter."
          />
        )}
        {fane === 'luksus' && (
          <KommerSnart
            tittel="Luksus"
            ikon={<IkonLuksus størrelse={48} />}
            tekst="Biler, yachter, privatfly og klokker som hever statusen din."
          />
        )}
        {fane === 'profil' && <Profil s={s} />}
      </main>
      <Fanemeny aktiv={fane} velg={velg} />
    </div>
  )
}
