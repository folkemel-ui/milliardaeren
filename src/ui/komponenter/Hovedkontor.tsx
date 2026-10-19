/**
 * Hovedkontoret på Bedrifter (Pakke 117): tårnet med etasjene du har bygget
 * tent, hva de gir, og knappen for neste etasje med når den er tjent inn.
 * Vises fra 1 mrd (høyeste formue), eller så snart du har en etasje.
 */

import { inntektPerSek } from '../../engine/formler'
import { byggEtasje } from '../../engine/handlinger'
import { etasjer, HK_ETASJER, HK_INNTEKT, HK_STATUS, HK_SYNLIG_VED, hovedkontorfaktor, nesteEtasjepris } from '../../engine/hovedkontor'
import type { Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { andelTekst, kortKroner } from '../format'
import { tilbakeTekst } from '../inntjening'
import { S } from './Tegnestil'

/**
 * Tårnet, tegnet enkelt: ti etasjer, de bygde med varmt lys i vinduene, de
 * andre som stillas. Grafikksporet kan gi det en ordentlig tegning.
 */
function Taarn({ n }: { n: number }) {
  const h = 4.4
  return (
    <svg className="hk-taarn" width="44" height="56" viewBox="0 0 44 56" aria-hidden="true">
      <rect x="2" y="53" width="40" height="2" rx="1" fill="var(--kant)" />
      {Array.from({ length: HK_ETASJER }, (_, i) => {
        const y = 52 - (i + 1) * h
        const bygd = i < n
        return (
          <g key={i}>
            <rect x="12" y={y} width="20" height={h - 0.6} fill={bygd ? S.petrol.flate : 'none'} stroke={bygd ? 'none' : 'var(--kant)'} strokeWidth="0.6" strokeDasharray={bygd ? undefined : '1.4 1.2'} />
            {bygd && [14, 18.5, 23, 27.5].map((x) => <rect key={x} x={x} y={y + 1} width="2.6" height="2" fill={(i + x) % 3 ? S.vinduLys.flate : S.glass.flate} />)}
          </g>
        )
      })}
      {n >= HK_ETASJER && <rect x="12" y={52 - HK_ETASJER * h - 1.4} width="20" height="1.2" fill="var(--gull)" />}
    </svg>
  )
}

export function Hovedkontorkort({ s }: { s: Spilltilstand }) {
  const n = etasjer(s)
  if (n === 0 && s.hoyesteFormue < HK_SYNLIG_VED) return null
  const pris = nesteEtasjepris(s)
  // Hva én etasje til gir i dag: 1 % av det bedriftene tjener uten hovedkontoret.
  const gir = (inntektPerSek(s) / hovedkontorfaktor(s)) * HK_INNTEKT
  return (
    <div className="kort kjopskort hovedkontor">
      <Taarn n={n} />
      <div className="bedriftskort-midt">
        <h2>Hovedkontoret i Bjørvika</h2>
        <span className="dempet liten">
          {n === 0
            ? `Hver etasje gir +${andelTekst(HK_INNTEKT)} på alle bedriftene og ${HK_STATUS} status.`
            : `${n} av ${HK_ETASJER} etasjer · +${andelTekst(HK_INNTEKT * n)} på alle bedriftene · ${HK_STATUS * n} status`}
        </span>
        {pris !== null && <span className="dempet liten">{tilbakeTekst(pris, gir)}</span>}
      </div>
      {pris === null ? (
        <span className="merke ok">✓ Ferdig</span>
      ) : (
        <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < pris} onClick={() => utfor(byggEtasje(s))}>
          Etasje {n + 1} · {kortKroner(pris)}
        </button>
      )}
    </div>
  )
}
