import { useEffect, useState } from 'react'
import { startSpillokke, useSpill } from './state/lager'
import { Fanemeny, type Fane } from './ui/komponenter/Fanemeny'
import { Toppfelt } from './ui/komponenter/Toppfelt'
import { Bedrifter } from './ui/screens/Bedrifter'
import { Eiendom } from './ui/screens/Eiendom'
import { Investeringer } from './ui/screens/Investeringer'
import { Luksus } from './ui/screens/Luksus'
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
        {fane === 'investeringer' && <Investeringer s={s} />}
        {fane === 'eiendom' && <Eiendom s={s} />}
        {fane === 'luksus' && <Luksus s={s} />}
        {fane === 'profil' && <Profil s={s} />}
      </main>
      <Fanemeny aktiv={fane} velg={velg} />
    </div>
  )
}
