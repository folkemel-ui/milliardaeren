import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Avis } from './ui/komponenter/Avis'
import { aktivVelkomst, lukkVelkomst, spillnummer, startSpillokke, useAvbrudd, useSpill, useVelkomst } from './state/lager'
import { Avbruddskjerm } from './ui/komponenter/Avbrudd'
import { Velkomstskjerm } from './ui/komponenter/Velkomst'
import { FANE_INNHOLD, FANER, Fanemeny, type Fane } from './ui/komponenter/Fanemeny'
import { Feiring, Varselstabel } from './ui/komponenter/Varsler'
import { kortKroner, tall } from './ui/format'
import { FANE_AAPNER, faneAapen } from './ui/progresjon'
import { MAKS_ENKELTVARSLER, nytt, stoersteFeiring, type Nytt } from './ui/hendelsesstrom'
import { visFeiring, visKjop, visVarsel, type Varsel } from './ui/varsler'
import { Kjopsglimt } from './ui/komponenter/Kjopsglimt'
import { fjernNy, lyttEtterNyTrykk, merkNy } from './ui/nymerker'
import { lesAvisvalg } from './ui/avisvalg'
import { vises } from './ui/innstillinger'
import { merkVersjonSett, visNyheter } from './ui/versjon'
import { Nyheter } from './ui/komponenter/Nyheter'
import type { Hendelse } from './engine/types'
import { Toppfelt } from './ui/komponenter/Toppfelt'
import { Bedrifter } from './ui/screens/Bedrifter'
import { Eiendom } from './ui/screens/Eiendom'
import { Investeringer } from './ui/screens/Investeringer'
import { Luksus } from './ui/screens/Luksus'
import { Profil } from './ui/screens/Profil'
import { lyttEtterKorttrykk } from './ui/overgang'
import { lyttEtterTilbake, useTilbake } from './ui/tilbake'
import { Hendelseslogg } from './ui/komponenter/Hendelseslogg'
import type { Mål } from './ui/varsler'
import { delnokkel, luksusdel } from './ui/deler'
import { hentRulling, huskRulling } from './ui/rullehusk'

const FANENOKKEL = 'milliardaer.fane'
const GYLDIGE: Fane[] = ['bedrifter', 'investeringer', 'eiendom', 'luksus', 'profil']

/** Hvilken fane en hendelse hører hjemme i — dit tar et trykk på varselet deg. */
const HENDELSE_FANE: Record<string, Mål> = {
  Trofé: 'klubb',
  Opprykk: 'klubb',
  Nedrykk: 'klubb',
  Hogst: 'eiendom',
  Bokettersyn: 'profil',
  'Skatt innkrevd': 'profil',
}

const MAKS_KJOP_SAMTIDIG = 3

const ALVOR: Record<Hendelse['alvor'], Varsel['type']> = { info: 'god', advarsel: 'advarsel', kritisk: 'kritisk' }

/*
 * Sveip til siden for å bytte fane. Bare raske, tydelig vannrette sveip teller,
 * så vanlig rulling aldri bytter fane — og ikke på grafer (der drar du for å
 * lese av), i tekstfelt eller noe merket data-ingen-sveip.
 */
const SVEIP_MIN_PX = 70
const SVEIP_MAKS_MS = 700
const SVEIP_UNNTAK = 'input, textarea, select, .graf-flate, [data-ingen-sveip]'

/** Om et tekstfelt har fokus — da skal ikke avisen dukke opp over det du skriver. */
function skriver(): boolean {
  const el = document.activeElement
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
}

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
  // En husket fane som er låst (etter «Start på nytt»), gir Bedrifter.
  const [fane, settFane] = useState<Fane>(() => {
    const f = husketFane()
    return faneAapen(s, f) ? f : 'bedrifter'
  })
  const [avisÅpen, settAvisÅpen] = useState(false)
  const [loggÅpen, settLoggÅpen] = useState(false)
  // «Nytt i 1.0» for en spiller som kommer tilbake etter en oppdatering. En ny spiller merkes som oppdatert med en gang.
  const [nyheter, settNyheter] = useState(() => visNyheter(s.sek))
  const lukkAvis = useCallback(() => settAvisÅpen(false), [])
  // Retningen fanene glir: mot høyre når du går til en fane lenger til høyre.
  const [retning, settRetning] = useState<'hoyre' | 'venstre' | 'ingen'>('ingen')
  const forrige = useRef(s)
  const forrigeSpill = useRef(spillnummer())
  const velkomst = useVelkomst()
  const sveip = useRef<{ x: number; y: number; t: number } | null>(null)
  const avbrudd = useAvbrudd()

  useEffect(startSpillokke, [])
  useEffect(() => {
    if (!nyheter) merkVersjonSett()
    // Bare ved oppstart.
  }, [])
  useEffect(lyttEtterNyTrykk, [])
  useEffect(lyttEtterKorttrykk, [])
  useEffect(lyttEtterTilbake, [])

  // Har du valgt at avisen skal åpne seg selv, og en ulest utgave venter ved oppstart, kommer den med én gang.
  useEffect(() => {
    const siste = s.avis.at(-1)
    // Velkomstskjermen har sin egen «Les»-knapp, så avisen venter til den er lukket.
    if (lesAvisvalg() === 'apne' && !aktivVelkomst() && siste && siste.dag > s.avisLest) settAvisÅpen(true)
    // Bare ved oppstart — senere utgaver går gjennom hendelsesstrømmen.
  }, [])

  // Hendelsesstrømmen: det som er nytt siden forrige tilstand, blir varsler.
  useEffect(() => {
    const før = forrige.current
    forrige.current = s
    if (før === s) return
    // Et importert spill, reservekopien eller et nytt spill: et annet spills fortid er ikke nyheter.
    if (forrigeSpill.current !== spillnummer()) {
      forrigeSpill.current = spillnummer()
      return
    }
    const funn = nytt(før, s)
    const feiring = stoersteFeiring(funn)
    if (feiring) visFeiring(feiring)
    // Mange «kjøp» på en gang er automatiske ordre — da vises ingen av dem som nye.
    const alleKjop = funn.filter((f) => f.type === 'kjop')
    const kjop = alleKjop.length > MAKS_KJOP_SAMTIDIG ? [] : alleKjop
    for (const k of kjop) merkNy(k.id)
    // En fane som har åpnet seg, får en prikk til du har vært innom.
    for (const f of funn) if (f.type === 'fane') merkNy(`fane:${f.fane}`)
    // Etter lengre tid borte viser velkomstskjermen alt dette — da blir det bare feiring og NY-merker, ingen varsler.
    if (aktivVelkomst()?.etter === s) return
    // Kjøper du flere ting på en gang (automatiske ordre), vises det siste.
    // En fusjon går foran et kjøp: den skjer sjeldnere og betyr mer.
    const fusjon = funn.filter((f) => f.type === 'fusjon').at(-1)
    const siste = kjop.at(-1)
    if (fusjon?.type === 'fusjon') visKjop({ art: 'fusjon', id: fusjon.id, navn: fusjon.navn, under: `Inntekten ×${tall(fusjon.faktor, 2)}` })
    else if (siste) visKjop({ art: siste.art, id: siste.id, navn: siste.navn })
    håndter(funn.filter((f) => f.type !== 'kjop' && f.type !== 'fusjon'))
  }, [s])

  function håndter(funn: Nytt[]) {
    const avis = funn.find((f) => f.type === 'avis')
    // Varselvalget i Innstillinger bestemmer hvilke som vises. Avisa har sitt eget valg.
    const andre = funn.filter((f) => f.type !== 'avis' && vises(f))
    if (andre.length > MAKS_ENKELTVARSLER) {
      visVarsel({ type: 'god', tittel: `${andre.length} hendelser mens du var borte`, tekst: 'Alt står i hendelsesloggen.', mål: 'hendelser' })
    } else {
      for (const f of andre) {
        if (f.type === 'hendelse') {
          visVarsel({ type: ALVOR[f.hendelse.alvor], tittel: f.hendelse.tittel, tekst: f.hendelse.tekst, mål: HENDELSE_FANE[f.hendelse.tittel] ?? 'hendelser' })
        } else if (f.type === 'prestasjon') {
          visVarsel({ type: 'god', tittel: `${f.skjult ? 'Skjult prestasjon' : 'Prestasjon'}: ${f.navn}`, mål: 'profil' })
        } else if (f.type === 'fane') {
          visVarsel({ type: 'god', tittel: `Ny fane: ${FANER.find((x) => x.id === f.fane)!.navn}`, tekst: FANE_INNHOLD[f.fane], mål: f.fane })
        }
      }
    }
    if (avis) {
      const valg = lesAvisvalg()
      if (valg === 'apne' && !skriver()) settAvisÅpen(true)
      else if (valg !== 'av') visVarsel({ type: 'avis', tittel: 'Dagens Børstidende er her', handling: { tekst: 'Les', utfør: () => settAvisÅpen(true) } })
    }
  }

  const velg = (f: Fane) => {
    if (!faneAapen(s, f)) {
      const navn = FANER.find((x) => x.id === f)!.navn
      visVarsel({ type: 'feil', tittel: `${navn} åpner ved ${kortKroner(FANE_AAPNER[f])}`, tekst: 'Første gang nettoformuen din når dit.' })
      return
    }
    fjernNy(`fane:${f}`)
    const fra = FANER.findIndex((x) => x.id === fane)
    const til = FANER.findIndex((x) => x.id === f)
    settRetning(til > fra ? 'hoyre' : til < fra ? 'venstre' : 'ingen')
    // Pakke 74: du kommer tilbake dit du var i fanen. Står en detaljside åpen, huskes lista øverst;
    // et trykk på fanen du er i, ruller til toppen.
    if (f === fane) window.scrollTo({ top: 0 })
    else huskRulling(fane, document.querySelector('.innhold .detalj') ? 0 : window.scrollY, delnokkel(fane))
    settFane(f)
    try {
      localStorage.setItem(FANENOKKEL, f)
    } catch {
      /* bare en bekvemmelighet */
    }
  }

  // En annen fane enn Bedrifter er et steg i historikken: tilbake går hjem, og fra Bedrifter ut av spillet.
  useTilbake(fane !== 'bedrifter', () => velg('bedrifter'))
  // Fanen åpner der du sist var i den — øverst første gang, og når delen er en annen.
  useLayoutEffect(() => {
    window.scrollTo({ top: hentRulling(fane, delnokkel(fane)) })
  }, [fane])
  const gåTil = (m: Mål) => {
    if (m === 'hendelser') return settLoggÅpen(true)
    if (m === 'klubb') {
      luksusdel.sett('klubb')
      return velg('luksus')
    }
    velg(m)
  }

  // En annen fane har tatt over, eller noe gikk galt: da vises ikke spillet.
  if (avbrudd) return <Avbruddskjerm a={avbrudd} />

  return (
    <div className="app">
      <Toppfelt s={s} tilProfil={() => velg('profil')} åpneAvis={() => settAvisÅpen(true)} åpneLogg={() => settLoggÅpen(true)} gåTil={velg} />
      <main
        key={fane}
        className={`innhold gli-${retning}`}
        onTouchStart={(e) => {
          const mål = e.target as HTMLElement
          const t = e.touches[0]
          sveip.current = e.touches.length === 1 && !mål.closest(SVEIP_UNNTAK) ? { x: t.clientX, y: t.clientY, t: Date.now() } : null
        }}
        onTouchEnd={(e) => {
          const start = sveip.current
          sveip.current = null
          if (!start) return
          const t = e.changedTouches[0]
          const dx = t.clientX - start.x
          const dy = t.clientY - start.y
          if (Date.now() - start.t > SVEIP_MAKS_MS || Math.abs(dx) < SVEIP_MIN_PX || Math.abs(dy) > Math.abs(dx) * 0.6) return
          const i = FANER.findIndex((x) => x.id === fane)
          const ny = FANER[i + (dx < 0 ? 1 : -1)]
          // Sveip hopper ikke inn i en låst fane — da skjer ingenting.
          if (ny && faneAapen(s, ny.id)) velg(ny.id)
        }}
      >
        {fane === 'bedrifter' && <Bedrifter s={s} />}
        {fane === 'investeringer' && <Investeringer s={s} />}
        {fane === 'eiendom' && <Eiendom s={s} />}
        {fane === 'luksus' && <Luksus s={s} />}
        {fane === 'profil' && <Profil s={s} gåTil={velg} />}
      </main>
      <Fanemeny aktiv={fane} velg={velg} aapen={(f) => faneAapen(s, f)} />
      <Varselstabel gåTil={gåTil} />
      {velkomst && !avisÅpen && !loggÅpen && (
        <Velkomstskjerm
          v={velkomst}
          lukk={lukkVelkomst}
          lesAvis={() => {
            lukkVelkomst()
            settAvisÅpen(true)
          }}
          seHendelser={() => {
            lukkVelkomst()
            settLoggÅpen(true)
          }}
          gåTil={gåTil}
        />
      )}
      {avisÅpen && <Avis s={s} lukk={lukkAvis} />}
      {loggÅpen && <Hendelseslogg s={s} lukk={() => settLoggÅpen(false)} />}
      {nyheter && !velkomst && !avisÅpen && !loggÅpen && (
        <Nyheter
          lukk={() => {
            merkVersjonSett()
            settNyheter(false)
          }}
        />
      )}
      <Kjopsglimt />
      <Feiring />
    </div>
  )
}
