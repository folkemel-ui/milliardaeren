import { useState } from 'react'
import { eierType, erLaastOpp, forbedringspris, nesteForbedring } from '../../engine/formler'
import { kanVelgeRetning } from '../../engine/ansatte'
import { Bedriftdetalj } from './Bedriftdetalj'
import { kjopBedrift, kjopForbedringer } from '../../engine/handlinger'
import { BEDRIFTSTYPER, STIGEN } from '../../engine/innhold'
import type { BedriftstypeId, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, perSek } from '../format'
import { BedriftIkon } from '../komponenter/BedriftIkon'
import { Bedriftskort, Kompaktrad } from '../komponenter/Bedriftskort'
import { Seksjon } from '../komponenter/Seksjon'
import { Markedsknapp } from '../komponenter/Dagen'
import { lagreKjopsmengde, lesKjopsmengde, MENGDER, type Kjopsmengde } from '../kjopsmengde'
import { Forklaring } from '../komponenter/Forklaring'
import { bedriftsrekkefolge, bedriftsvisning, REKKEFOLGER } from '../deler'
import { fastInntekt } from '../sortering'
import { useTilbake } from '../tilbake'
import { Hjemskjermkort } from '../komponenter/Hjemskjerm'
import { Ikon } from '../komponenter/Ikoner'
import { Hovedkontorkort } from '../komponenter/Hovedkontor'
import { Romfartkort, RomfartLaast, Romfartside } from '../komponenter/Romfart'
import { romfartAapen } from '../../engine/romfart'

/** `tilRival` åpner en rival i Investeringer → Selskaper (Pakke 99: fusjonsraden). */
/** En forbedring er billig når den koster under så stor andel av kontantene (Pakke 102). */
export const BILLIG_ANDEL = 0.001
/** Knappen for de billige forbedringene kommer når det er minst så mange. */
const BILLIGE_MIN = 2

export function Bedrifter({ s, tilRival }: { s: Spilltilstand; tilRival: (id: string, type: BedriftstypeId) => void }) {
  const [valgt, settValgt] = useState<string | null>(null)
  // Pakke 118: romfartsfabrikkens egen side.
  const [romfartApen, settRomfartApen] = useState(false)
  const [mengde, settMengde] = useState<Kjopsmengde>(lesKjopsmengde)
  const velgMengde = (m: Kjopsmengde) => {
    lagreKjopsmengde(m)
    settMengde(m)
  }
  // Kjøpt (standard) eller etter fast inntekt — størst først, lik inntekt i kjøpsrekkefølge.
  const rekkefolge = bedriftsrekkefolge.bruk()
  // Pakke 129: kort eller én rad per bedrift. Bryteren kommer med den tredje bedriften, som rekkefølgen.
  const visning = bedriftsvisning.bruk()
  const bedrifter = rekkefolge === 'inntekt' ? [...s.bedrifter].sort((a, b) => fastInntekt(b) - fastInntekt(a)) : s.bedrifter
  // Bedriftene som venter på en retning (Pakke 75): én linje øverst i stedet for et merke på hvert kort.
  const venter = bedrifter.filter(kanVelgeRetning)
  // Pakke 102: kjøpsmengdene først når de betyr noe — med en bedrift nummer to, eller nivå 10.
  const visMengde = s.bedrifter.length >= 2 || s.bedrifter.some((b) => b.nivaa >= 10)
  const visRekkefolge = s.bedrifter.length >= 3
  const kompakt = visRekkefolge && visning === 'kompakt'
  // Uten valget kjøper knappen ett nivå om gangen, uansett hva som er lagret fra før.
  const mengdeNaa: Kjopsmengde = visMengde ? mengde : '1'
  // De billige forbedringene (Pakke 102): klare til kjøp og under 0,1 % av kontantene hver.
  const billige = s.bedrifter.flatMap((b) => {
    const f = nesteForbedring(b)
    return f && b.nivaa >= f.nivaa && forbedringspris(b, f) <= BILLIG_ANDEL * s.kontanter ? [{ id: b.id, pris: forbedringspris(b, f) }] : []
  })
  const tilSalgs = STIGEN.filter((t) => !eierType(s, t) && erLaastOpp(s, t))
  const laaste = STIGEN.filter((t) => !erLaastOpp(s, t))
  const romfartTilSalgs = !s.romfart && romfartAapen(s)
  const romfartLaast = !s.romfart && !romfartAapen(s)

  // Bedriften kan forsvinne mens siden er åpen (banken kan ta den over).
  const detalj = valgt ? s.bedrifter.find((b) => b.id === valgt) : undefined
  useTilbake(detalj !== undefined, () => settValgt(null))
  useTilbake(romfartApen && !!s.romfart, () => settRomfartApen(false))
  if (romfartApen && s.romfart) return <Romfartside s={s} tilbake={() => settRomfartApen(false)} />
  if (detalj) return <Bedriftdetalj s={s} b={detalj} mengde={mengdeNaa} tilbake={() => settValgt(null)} tilRival={tilRival} />

  // Rekkefølgen som én knapp (Pakke 102): den viser hvordan lista står, og et trykk bytter.
  const neste = REKKEFOLGER[(REKKEFOLGER.findIndex((r) => r.id === rekkefolge) + 1) % REKKEFOLGER.length]
  const naa = REKKEFOLGER.find((r) => r.id === rekkefolge) ?? REKKEFOLGER[0]
  const prisBillige = billige.reduce((sum, x) => sum + x.pris, 0)
  const visBillige = billige.length >= BILLIGE_MIN

  return (
    <section className="skjerm">
      {/* Pakke 102: «Markedet i dag» i overskriftsraden; datoen står alt i toppfeltet. */}
      <div className="skjerm-hode">
        <h1 className="skjerm-tittel">
          Dine bedrifter <Forklaring tema="bedrifter" />
        </h1>
        <div className="skjerm-hode-hoyre">
          <Markedsknapp s={s} />
          {visRekkefolge && (
            <button
              type="button"
              className={kompakt ? 'visningsknapp aktiv' : 'visningsknapp'}
              aria-pressed={kompakt}
              aria-label="Kompakt visning: én rad per bedrift"
              title={kompakt ? 'Vis bedriftene som kort' : 'Vis bedriftene kompakt'}
              onClick={() => bedriftsvisning.sett(kompakt ? 'kort' : 'kompakt')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {/* Pakke 95: Safari-spillere får beskjed om Hjem-skjermen fra første besøk. */}
      <Hjemskjermkort />
      {/*
        Pakke 75: ganger og rekkefølge på én rad — med rekkefølgen som én knapp igjen (Pakke 102), og fra Pakke 129
        i samme segment, med en strek imellom, i stedet for en boks i boksen.
      */}
      {(visMengde || visRekkefolge) && (
        <div className="bedrifter-kontroller segment">
          {visMengde && (
            <div className="mengdevalg" role="radiogroup" aria-label="Hvor mange nivåer hver oppgradering kjøper">
              {MENGDER.map((m) => (
                <button key={m.id} role="radio" aria-checked={mengde === m.id} className={mengde === m.id ? 'aktiv' : ''} onClick={() => velgMengde(m.id)}>
                  {m.navn}
                </button>
              ))}
            </div>
          )}
          {visRekkefolge && (
            <div className={visMengde ? 'rekkefolge med-skille' : 'rekkefolge'} role="group" aria-label="Rekkefølge på bedriftene">
              <button type="button" className="rekkefolge-knapp" aria-label={`Rekkefølge: ${naa.navn.toLowerCase()}. Trykk for ${neste.navn.toLowerCase()}.`} onClick={() => bedriftsrekkefolge.sett(neste.id)}>
                {naa.navn}
              </button>
            </div>
          )}
        </div>
      )}
      {/*
        Pakke 129: retningen og de billige forbedringene i én stripe, i én stil — to halvdeler når begge står der,
        hele stripa når bare den ene gjør det. Før var de to linjer i to stiler, 98 px over det første kortet.
      */}
      {(venter.length > 0 || visBillige) && (
        <div className={venter.length > 0 && visBillige ? 'varselstripe delt' : 'varselstripe'}>
          {venter.length > 0 && (
            <button type="button" className="stripe-del stripe-retning" onClick={() => settValgt(venter[0].id)}>
              <span className="retningsprikk" aria-hidden="true" />
              <span>
                {venter.length === 1 && !visBillige ? `${BEDRIFTSTYPER[venter[0].type].navn} venter på retning` : `${venter.length} venter på retning`}
                <span aria-hidden="true"> ›</span>
              </span>
            </button>
          )}
          {visBillige && (
            <button type="button" className="stripe-del stripe-billige" onClick={() => utfor(kjopForbedringer(s, billige.map((x) => x.id)))}>
              <Ikon navn="gnist" størrelse={14} />
              <span>{venter.length > 0 ? `Kjøp ${billige.length} billige` : `Kjøp alle billige forbedringer (${billige.length})`}</span>
              <span className="stripe-pris">{kortKroner(prisBillige)}</span>
            </button>
          )}
        </div>
      )}
      <ul className={kompakt ? 'kortliste kompakt' : 'kortliste'}>
        {bedrifter.map((b) =>
          kompakt ? (
            <Kompaktrad key={b.id} b={b} s={s} mengde={mengdeNaa} åpne={() => settValgt(b.id)} />
          ) : (
            <Bedriftskort key={b.id} b={b} s={s} mengde={mengdeNaa} åpne={() => settValgt(b.id)} />
          ),
        )}
      </ul>

      {s.romfart && <Romfartkort s={s} åpne={() => settRomfartApen(true)} />}

      <Hovedkontorkort s={s} />

      {(tilSalgs.length > 0 || laaste.length > 0 || !s.romfart) && (
      <Seksjon
        id="bedrifter-nye"
        tittel="Start ny bedrift"
        sammendrag={tilSalgs.length + (romfartTilSalgs ? 1 : 0) > 0 ? `${tilSalgs.length + (romfartTilSalgs ? 1 : 0)} til salgs` : `${laaste.length + (romfartLaast ? 1 : 0)} låst`}
        harInnhold={tilSalgs.length > 0 || romfartTilSalgs}
      >
      <ul className="kortliste">
        {tilSalgs.map((id) => {
          const t = BEDRIFTSTYPER[id]
          return (
            <li key={id} className="kort kjopskort">
              <BedriftIkon type={id} />
              <div className="bedriftskort-midt">
                <h2>{t.navn}</h2>
                <span className="pluss liten">{perSek(t.grunninntekt)}</span>
              </div>
              <button
                className="knapp knapp-gull knapp-liten"
                disabled={s.kontanter < t.pris}
                onClick={() => utfor(kjopBedrift(s, id))}
              >
                Kjøp · {kortKroner(t.pris)}
              </button>
            </li>
          )
        })}
        {romfartTilSalgs && <Romfartkort s={s} åpne={() => settRomfartApen(true)} />}
        {laaste.map((id, i) => (
          <Laastkort key={id} s={s} id={id} neste={i === 0} synlig={i < SYNLIGE_LAASTE} />
        ))}
        <RomfartLaast s={s} synlig={laaste.length < SYNLIGE_LAASTE} />
      </ul>
      </Seksjon>
      )}
    </section>
  )
}

/** De første låste bedriftene vises med navn og bilde; resten er silhuetter, så sluttspillet blir en overraskelse. */
const SYNLIGE_LAASTE = 3

function Laastkort({ s, id, neste, synlig }: { s: Spilltilstand; id: BedriftstypeId; neste: boolean; synlig: boolean }) {
  const t = BEDRIFTSTYPER[id]
  return (
    <li className={synlig ? 'kort kjopskort laast' : 'kort kjopskort laast skjult'}>
      <div className={synlig ? '' : 'silhuett'}>
        <BedriftIkon type={id} dempet />
      </div>
      <div className="bedriftskort-midt">
        <h2>{synlig ? t.navn : '???'}</h2>
        <span className="dempet liten">Låses opp ved {kortKroner(t.laasesOppVed)}</span>
        {neste && (
          <div className="milepael-spor">
            <div className="milepael-fyll" style={{ width: `${Math.min(1, s.hoyesteFormue / t.laasesOppVed) * 100}%` }} />
          </div>
        )}
      </div>
      <span className="laas" aria-label="Låst">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11 V8 A4 4 0 0 1 16 8 V11" />
        </svg>
      </span>
    </li>
  )
}
