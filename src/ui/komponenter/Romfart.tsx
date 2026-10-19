/**
 * Romfartsfabrikken på skjermen (Pakke 118): et kort på Bedrifter som åpner fabrikkens
 * egen side, og siden selv — scenen, neste oppskyting med dagens tre kontrakter,
 * forskningen og oppskytingene så langt. Fabrikken har ingen nivåer, så den har ikke
 * bedriftskortets knapper; alt skjer her.
 */

import { useId } from 'react'
import { DAG_SEK } from '../../engine/kalender'
import { byggAvdeling, kjopRomfart, startForskning, velgKontrakt } from '../../engine/handlinger'
import {
  AVDELING_KUTT,
  baneTekst,
  DELTRINN,
  forskningspris,
  forskningstid,
  forventet,
  GEO_FRA_TRINN,
  kanLofte,
  loft,
  LOFT_PER_TRINN,
  nesteAvdelingspris,
  RAKETTDELER,
  RAKETTDELLISTE,
  rakettpris,
  ROMFART_LAASES_OPP,
  ROMFART_PRIS,
  sikkerhet,
  trengerLoft,
  valgtKontrakt,
} from '../../engine/romfart'
import type { Romfart, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { andelTekst, kortKroner, perSek, tall, varighet } from '../format'
import { nattstil } from '../dagognatt'
import { Kloss, S } from './Tegnestil'

/** «9 t», «10,3 t», «2,25 t»: bare så mange desimaler som trengs. */
const tonn = (t: number) => `${tall(t, Math.round(t * 100) % 10 ? 2 : t % 1 ? 1 : 0)} t`

/**
 * Scenen: hallen der rakettene bygges, forskningsavdelingen med parabolen når den
 * finnes, og raketten på rampa — høyere jo mer den løfter, med landingsbein når
 * første trinn gjenbrukes og et gullbånd når alt er forsket fram. Tegnet enkelt av
 * spillsporet; grafikksporet kan gjøre den ferdig.
 */
export function Romfartscene({ r, liten = false }: { r: Romfart | null; liten?: boolean }) {
  const id = useId().replace(/:/g, '')
  const g = 84
  const l = r ? loft(r) : 8
  const rh = 30 + l * 0.75
  const rx = 128
  const topp = g - 6 - rh
  const ferdig = r !== null && RAKETTDELLISTE.every((d) => r.deler[d] >= DELTRINN)
  return (
    <svg viewBox={liten ? '96 14 64 64' : '0 0 176 96'} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Romfartsfabrikken">
      <defs>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f8798" />
          <stop offset="1" stopColor="#d6c4a0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="176" height="96" fill={`url(#${id}h)`} />
      {/* Havet bak rampa og kysten — fabrikken ligger ved sjøen, som Andøya. */}
      <rect x="0" y={g - 10} width="176" height="10" fill={S.sjo.flate} />
      <polygon points={`0,${g - 10} 30,${g - 16} 60,${g - 12} 90,${g - 18} 120,${g - 13} 150,${g - 17} 176,${g - 12} 176,${g - 10} 0,${g - 10}`} fill={S.fjell.flate} opacity="0.7" />
      <rect x="0" y={g - 2} width="176" height="14" fill={S.skifer.flate} />
      <rect x="0" y={g - 2} width="176" height="0.6" fill={S.skifer.lys} />
      {/* Hallen der rakettene bygges. */}
      <Kloss x={10} y={g} b={46} h={28} d={10} m={S.hvit} />
      <rect x="10" y={g - 24} width="46" height="1.4" fill={S.petrol.flate} />
      <rect x="22" y={g - 20} width="14" height="20" fill={S.hvit.skygge} />
      {[23.5, 26.8, 30.1, 33.4].map((x) => (
        <rect key={x} x={x} y={g - 19} width="0.4" height="19" fill={S.hvit.flate} />
      ))}
      {/* Forskningsavdelingen med parabolen, når den er bygget. */}
      {r && r.avdeling > 0 && (
        <g>
          <Kloss x={62} y={g} b={22} h={10 + r.avdeling * 2} d={8} m={S.glass} />
          {Array.from({ length: Math.min(6, r.avdeling + 1) }, (_, i) => (
            <rect key={i} x={64 + (i % 3) * 6.4} y={g - 8 - Math.floor(i / 3) * 5} width="4.4" height="2.6" fill={S.vinduLys.flate} />
          ))}
          <rect x="76.6" y={g - 18 - r.avdeling * 2} width="0.8" height="6" fill={S.metall.skygge} />
          <path d={`M71 ${g - 24 - r.avdeling * 2} Q77 ${g - 16 - r.avdeling * 2} 83 ${g - 24 - r.avdeling * 2}`} fill={S.metall.lys} stroke={S.metall.skygge} strokeWidth="0.4" />
        </g>
      )}
      {/* Rampa og tårnet. */}
      <rect x={rx - 14} y={g - 6} width="30" height="6" fill={S.stein.flate} />
      <rect x={rx - 14} y={g - 6} width="30" height="1" fill={S.stein.lys} />
      <rect x={rx - 12} y={topp - 4} width="3" height={rh + 4} fill={S.metall.skygge} />
      {Array.from({ length: Math.floor(rh / 6) }, (_, i) => (
        <path key={i} d={`M${rx - 12} ${topp + i * 6} L${rx - 9} ${topp + i * 6 + 6}`} stroke={S.metall.lys} strokeWidth="0.5" />
      ))}
      <rect x={rx - 9} y={topp + 6} width={4.6} height="1" fill={S.metall.flate} />
      {/* Raketten. */}
      <g>
        <rect x={rx - 3} y={topp + 6} width="6" height={rh - 6} fill={S.hvit.lys} />
        <rect x={rx + 1} y={topp + 6} width="2" height={rh - 6} fill={S.hvit.skygge} />
        <path d={`M${rx - 3} ${topp + 6} L${rx} ${topp - 2} L${rx + 3} ${topp + 6} Z`} fill={S.hvit.flate} />
        <rect x={rx - 3} y={topp + rh * 0.38} width="6" height="1.2" fill={S.mork.flate} />
        <rect x={rx - 3} y={topp + 10} width="6" height="1" fill={ferdig ? S.gull.flate : S.petrol.flate} />
        {/* Landingsbein når første trinn gjenbrukes. */}
        {r && r.deler.gjenbruk > 0 ? (
          <path d={`M${rx - 3} ${g - 12} L${rx - 7} ${g - 6} M${rx + 3} ${g - 12} L${rx + 7} ${g - 6}`} stroke={S.mork.lys} strokeWidth="1" />
        ) : (
          <path d={`M${rx - 3} ${g - 12} L${rx - 5.5} ${g - 6} L${rx - 3} ${g - 7} Z M${rx + 3} ${g - 12} L${rx + 5.5} ${g - 6} L${rx + 3} ${g - 7} Z`} fill={S.mork.flate} />
        )}
      </g>
      {/* Lagertankene til høyre. */}
      {[150, 158].map((x) => (
        <g key={x}>
          <rect x={x} y={g - 12} width="6" height="12" fill={S.hvit.flate} />
          <rect x={x + 4} y={g - 12} width="2" height="12" fill={S.hvit.skygge} />
          <ellipse cx={x + 3} cy={g - 12} rx="3" ry="0.9" fill={S.hvit.lys} />
        </g>
      ))}
    </svg>
  )
}

/** Kortet på Bedrifter: kjøp når den er låst opp, en låst rad før det, og fabrikken når du eier den. */
export function Romfartkort({ s, åpne }: { s: Spilltilstand; åpne: () => void }) {
  const r = s.romfart
  if (!r) {
    if (s.hoyesteFormue < ROMFART_LAASES_OPP) return null
    return (
      <li className="kort kjopskort romfart-kjop">
        <div className="romfart-flis">
          <Romfartscene r={null} liten />
        </div>
        <div className="bedriftskort-midt">
          <h2>Romfartsfabrikk</h2>
          <span className="dempet liten">Raketter for andre selskaper, og satellitter etter hvert. Ingen nivåer — du forsker fram delene.</span>
        </div>
        <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < ROMFART_PRIS} onClick={() => utfor(kjopRomfart(s))}>
          Kjøp · {kortKroner(ROMFART_PRIS)}
        </button>
      </li>
    )
  }
  const k = valgtKontrakt(r)
  const snitt = k ? forventet(r, k) / DAG_SEK : 0
  return (
    <button className="kort romfartkort" onClick={åpne}>
      <div className="romfart-flis">
        <Romfartscene r={r} liten />
      </div>
      <div className="bedriftskort-midt">
        <h2>Romfartsfabrikken</h2>
        <span className="dempet liten">
          {k ? `Neste: ${k.kunde} · ${tonn(k.tonn)} · ${kortKroner(k.honorar)}` : 'Ingen kontrakt raketten løfter i dag'}
          {r.forskning ? ` · forsker ${RAKETTDELER[r.forskning.del].navn.toLowerCase()}` : ''}
        </span>
      </div>
      <span className="pluss">{perSek(snitt)}</span>
    </button>
  )
}

/** Den låste raden under «Start ny bedrift» før fabrikken er låst opp. */
export function RomfartLaast({ s, synlig }: { s: Spilltilstand; synlig: boolean }) {
  if (s.romfart || s.hoyesteFormue >= ROMFART_LAASES_OPP) return null
  return (
    <li className={synlig ? 'kort kjopskort laast' : 'kort kjopskort laast skjult'}>
      <div className={synlig ? 'romfart-flis' : 'romfart-flis silhuett'}>
        <Romfartscene r={null} liten />
      </div>
      <div className="bedriftskort-midt">
        <h2>{synlig ? 'Romfartsfabrikk' : '???'}</h2>
        <span className="dempet liten">Låses opp ved {kortKroner(ROMFART_LAASES_OPP)}</span>
      </div>
    </li>
  )
}

export function Romfartside({ s, tilbake }: { s: Spilltilstand; tilbake: () => void }) {
  const r = s.romfart!
  const valgt = valgtKontrakt(r)
  const tilSkiftet = DAG_SEK - (s.sek % DAG_SEK)
  const avdPris = nesteAvdelingspris(r)
  const f = r.forskning
  const oppskutt = r.oppskytinger.slice(-5).reverse()
  return (
    <section className="skjerm detalj" style={nattstil(s.sek)}>
      <button className="tilbake" onClick={tilbake}>
        ‹ Bedrifter
      </button>

      <div className="kort">
        <div className="scene full" aria-hidden="true">
          <Romfartscene r={r} />
        </div>
        <h1 className="skjerm-tittel">Romfartsfabrikken</h1>
        <p className="dempet liten">
          Raketten løfter {tonn(loft(r))} til lav bane{r.deler.ovretrinn >= GEO_FRA_TRINN ? ` (${tonn(loft(r) / 2)} til geostasjonær)` : ''}, går bra {andelTekst(sikkerhet(r))} av gangene og koster {kortKroner(rakettpris(r))} å bygge.
        </p>
      </div>

      <div className="kort">
        <h2 className="kort-tittel">Neste oppskyting</h2>
        <p className="dempet liten">
          Ved dagsskiftet om {varighet(tilSkiftet)}. Uten valg tar fabrikken kontrakten som gir mest i snitt av dem raketten løfter.
        </p>
        <ul className="romkontrakter">
          {r.tavle.map((k) => {
            const kan = kanLofte(r, k)
            const er = valgt?.id === k.id
            // Valgt av deg, eller den fabrikken tar selv når du ikke har valgt.
            const selv = er && r.valgt === undefined
            return (
              <li key={k.id} className={er ? 'valgt' : ''}>
                <div>
                  <strong>{k.kunde}</strong>
                  <span className="dempet liten">
                    {k.last[0].toUpperCase() + k.last.slice(1)} · {tonn(k.tonn)} i {baneTekst(k.bane)}
                  </span>
                  <span className="liten">
                    {kortKroner(k.honorar)}
                    {kan ? <span className="dempet"> · snitt {perSek(forventet(r, k) / DAG_SEK)}</span> : <span className="dempet"> · trenger {tonn(trengerLoft(k))}{k.bane === 'geo' && r.deler.ovretrinn < GEO_FRA_TRINN ? ` og øvre trinn ${GEO_FRA_TRINN}` : ''}</span>}
                  </span>
                </div>
                {er && !selv ? (
                  <span className="merke ok">✓ Valgt</span>
                ) : er ? (
                  <span className="merke kant">Tas uten valg</span>
                ) : (
                  <button className="knapp knapp-sekundær knapp-liten" disabled={!kan} onClick={() => utfor(velgKontrakt(s, k.id))}>
                    {kan ? 'Velg' : 'For tung'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="kort">
        <h2 className="kort-tittel">Forskning</h2>
        {r.avdeling === 0 ? (
          <p className="dempet liten">Delene til raketten forskes fram i en forskningsavdeling. Hvert trinn av avdelingen etter det første kutter tiden {andelTekst(AVDELING_KUTT)}.</p>
        ) : (
          <p className="dempet liten">
            Avdelingen er på trinn {r.avdeling} av 6{r.avdeling > 1 ? ` · forsker på ${andelTekst((1 - AVDELING_KUTT) ** (r.avdeling - 1))} av tiden` : ''}.
            {f ? ` Forsker på ${RAKETTDELER[f.del].navn.toLowerCase()} trinn ${r.deler[f.del] + 1} — ferdig om ${varighet(Math.max(0, f.ferdigSek - s.sek))}.` : ' Ingen forskning pågår.'}
          </p>
        )}
        {avdPris !== null && (
          <button className="knapp knapp-gull" disabled={s.kontanter < avdPris} onClick={() => utfor(byggAvdeling(s))}>
            {r.avdeling === 0 ? 'Bygg forskningsavdeling' : `Avdelingen trinn ${r.avdeling + 1}`} · {kortKroner(avdPris)}
          </button>
        )}
        <ul className="forbedringer">
          {RAKETTDELLISTE.map((del) => {
            const d = RAKETTDELER[del]
            const trinn = r.deler[del]
            const pris = forskningspris(r, del)
            const tid = forskningstid(r, del)
            const gir = d.gir === 'loft' ? `+${tonn(LOFT_PER_TRINN)} per trinn` : d.gir === 'sikkerhet' ? 'sikrere oppskytinger' : 'billigere rakett'
            return (
              <li key={del} className={trinn >= DELTRINN ? 'kjøpt' : ''}>
                <div>
                  <strong>
                    {d.navn} <span className="gull">{trinn}/{DELTRINN}</span>
                  </strong>
                  <p className="dempet liten">
                    {d.tekst} {gir[0].toUpperCase() + gir.slice(1)}.
                  </p>
                </div>
                {pris === null ? (
                  <span className="merke ok">✓ Ferdig</span>
                ) : f?.del === del ? (
                  <span className="dempet liten">Forskes nå</span>
                ) : (
                  <span className="forbedring-kjop">
                    <button className="knapp knapp-gull knapp-liten" disabled={r.avdeling === 0 || !!f || s.kontanter < pris} onClick={() => utfor(startForskning(s, del))}>
                      {kortKroner(pris)}
                    </button>
                    <span className="dempet liten">{varighet(tid!)}</span>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="kort">
        <h2 className="kort-tittel">Oppskytinger</h2>
        <p className="dempet liten">
          {r.antall === 0
            ? 'Ingen ennå. Den første går ved neste dagsskifte.'
            : `${r.antall} oppskytinger, ${r.vellykket} vellykket. Honorarer ${kortKroner(r.inntekt)}, raketter ${kortKroner(r.kostnad)}: ${kortKroner(r.inntekt - r.kostnad)} i alt.`}
        </p>
        {oppskutt.length > 0 && (
          <ul className="romlogg">
            {oppskutt.map((o, i) => (
              <li key={`${o.dag}-${i}`}>
                <span>
                  {o.kunde} · {tonn(o.tonn)}
                  {o.bane === 'geo' ? ' · geo' : ''}
                </span>
                <span className={o.ok ? 'pluss' : 'minus'}>{o.ok ? kortKroner(o.honorar - o.kostnad) : 'Tapt'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
