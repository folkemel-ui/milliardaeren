/**
 * Skogen på sin side (Pakke 120): bestandene med alder, tømmer og hogst, et bestand til å
 * kjøpe, vekstkurven og skogens regnskap. Før var siden kortet, faktaene og kraftverket, og
 * en hogst etterlot bare en linje i loggen. Pakke 121: tømmerprisen, klimakredittene og sagbruket.
 * Pakke 122: skogsmaskinene, naboskogen, og storm, brann og forsikring.
 */

import { useState, type PointerEvent } from 'react'
import { hoggBestand, kjopBestand, kjopNaboskog, kjopSagbruk, kjopSkogforsikring, kjopSkogmaskin, siOppSkogforsikring } from '../../engine/handlinger'
import {
  bestand,
  bestandsalder,
  bestandsverdi,
  besteHogstdag,
  BRANN_SJANSE,
  erForsikret,
  FORSIKRING_DAGER,
  forsikringspris,
  HOGST_BEST_DAG,
  MAKS_MASKINTRINN,
  MAKS_NABOER,
  NABO_FAKTOR,
  naboer,
  naboskogpris,
  naboskogTommer,
  nyeVekstdager,
  SKOGMASKINER,
  SKOGMASKINLISTE,
  skoggrunnlag,
  skogmaskinPerDag,
  skogmaskinpris,
  skogmaskintekst,
  skogmaskintrinn,
  STORM_ANDEL,
  STORM_PRIS,
  STORM_SJANSE,
  vekstdager,
  KARBON_PER_DAG,
  karbonPerDag,
  MAKS_BESTAND,
  nesteBestandpris,
  omlopPerDag,
  SAGBRUK_LOFT,
  sagbrukPerDag,
  sagbrukpris,
  verdifaktor,
  START_BESTAND,
  TOMMER_DAGER,
  TOMMER_MAKS,
  tommerfaktor,
  tommerpris,
} from '../../engine/jord'
import { DAG_SEK } from '../../engine/kalender'
import type { JordId, Skogmaskin, Spilltilstand } from '../../engine/types'
import { utfor } from '../../state/lager'
import { kortKroner, tall, varighet } from '../format'

const dager = (d: number) => `${tall(d)} ${Math.round(d) === 1 ? 'dag' : 'dager'}`

/** Bestandene: alder, tømmer nå og når det er best å hogge, og knappen. Så et bestand til. */
export function Bestandkort({ s, id }: { s: Spilltilstand; id: JordId }) {
  const j = s.jord[id]
  if (!j) return null
  const b = bestand(j)
  const pris = nesteBestandpris(s, id)
  const best = besteHogstdag(j)
  // Et bestand til gir en tredel av jorda: tømmeret og kredittene over et omløp til den beste dagen.
  const perDag = omlopPerDag(s, id, best)
  return (
    <div className="kort">
      <h2 className="kort-tittel">Bestandene</h2>
      <p className="dempet liten">
        Hvert bestand er en tredel av jorda og hogges for seg. Hogger du dem på rad, kommer tømmeret jevnt — hvert bestand gir mest per dag ved {dager(best)}, med klimakredittene.
      </p>
      <Tommerpris s={s} />
      <ul className="forbedringer">
        {b.map((_, i) => {
          const alder = bestandsalder(s, id, i)
          const verdi = bestandsverdi(s, id, i)
          const igjen = besteHogstdag(j, i) - alder
          return (
            <li key={i}>
              <div>
                <strong>Bestand {i + 1}</strong>
                <p className="dempet liten">
                  {alder < 1 ? 'Nyplantet' : `${dager(Math.floor(alder))} · ${kortKroner(verdi)}`}
                  {igjen > 0 ? ` · best om ${dager(Math.ceil(igjen))}` : ''}
                </p>
              </div>
              {igjen <= 0 ? (
                <button className="knapp knapp-gull knapp-liten" onClick={() => utfor(hoggBestand(s, id, i))}>
                  Hogg · {kortKroner(verdi)}
                </button>
              ) : (
                <button className="knapp knapp-sekundær knapp-liten" disabled={alder < 1} onClick={() => utfor(hoggBestand(s, id, i))}>
                  Hogg nå
                </button>
              )}
            </li>
          )
        })}
      </ul>
      {pris !== null ? (
        <button className="knapp knapp-gull" disabled={s.kontanter < pris} onClick={() => utfor(kjopBestand(s, id))}>
          Bestand {b.length + 1} av {MAKS_BESTAND} · {kortKroner(pris)}
        </button>
      ) : (
        <p className="dempet liten">Skogen har alle {MAKS_BESTAND} bestandene.</p>
      )}
      {pris !== null && <p className="dempet liten">En tredel mer jord: ≈ {kortKroner(perDag)} om dagen i et jevnt omløp, tilbake på {varighet((pris / perDag) * DAG_SEK)}.</p>}
    </div>
  )
}

/** «Tømmerprisen i dag ×1,08 · Høy», med hva den følger. */
function Tommerpris({ s }: { s: Spilltilstand }) {
  const p = tommerpris(s)
  const [merke, ord] = p >= 1.05 ? ['gull', 'Høy'] : p <= 0.95 ? ['varsel', 'Lav'] : ['kant', 'Vanlig']
  return (
    <p className="liten tommerpris">
      Tømmerprisen i dag ×{tall(p, 2)} <span className={`merke ${merke}`}>{ord}</span>{' '}
      <span className="dempet">
        {p >= 1.05 ? 'Boligmarkedet er sterkt — et godt tidspunkt å hogge.' : p <= 0.95 ? 'Boligmarkedet er svakt. Prisen pleier å komme tilbake i løpet av noen timer.' : 'Prisen følger boligmarkedet.'}
      </span>
    </p>
  )
}

/**
 * Klimakredittene og sagbruket (Pakke 121): det stående tømmeret betaler hvert sekund, og et
 * sagbruk gir mer for hver hogst. Knappen viser hva sagbruket gir om dagen og når det er tilbake.
 */
export function Skogdrift({ s, id }: { s: Spilltilstand; id: JordId }) {
  const j = s.jord[id]
  if (!j) return null
  const pris = sagbrukpris(s, id)
  const gir = sagbrukPerDag(s, id)
  return (
    <div className="kort">
      <h2 className="kort-tittel">Klima og sagbruk</h2>
      <p className="liten">
        Klimakreditter: {kortKroner(karbonPerDag(s, id))} om dagen nå
        {(j.karbon ?? 0) >= 1 && <span className="dempet"> · har gitt {kortKroner(j.karbon ?? 0)}</span>}
      </p>
      <p className="dempet liten">
        Skogen får betalt for CO₂-en den holder: {tall(KARBON_PER_DAG * 100, 1)} % av det stående tømmeret om dagen, også mens du er borte. Et nyhogd bestand gir nesten ingenting, et gammelt mest — så det lønner seg å la bestandene stå litt lenger enn før.
      </p>
      {j.sagbruk ? (
        <p className="liten">
          <span className="merke ok">Sagbruk</span> <span className="dempet">Hver hogst gir {Math.round(SAGBRUK_LOFT * 100)} % mer.</span>
        </p>
      ) : (
        <>
          <button className="knapp knapp-gull" disabled={s.kontanter < pris} onClick={() => utfor(kjopSagbruk(s, id))}>
            Bygg sagbruk · {kortKroner(pris)}
          </button>
          <p className="dempet liten">
            +{Math.round(SAGBRUK_LOFT * 100)} % på hver hogst: ≈ {kortKroner(gir)} om dagen i et jevnt omløp, tilbake på {varighet((pris / gir) * DAG_SEK)}.
          </p>
        </>
      )}
    </div>
  )
}

const B = 320
const H = 110
const MAKS_DAG = 150
/** Tømmeret som andel av en tredel av jorda: fra 0 til ~2,4 ved dag 150 (taket er 3). */
const TOPP = TOMMER_MAKS

/**
 * Vekstkurven (Pakke 120): tømmeret i et bestand fra planting til dag 150, som andel av
 * bestandets jord, med dagen da det gir mest per dag stiplet og hvert bestand der det står
 * nå. Under: hva det koster å vente forbi den beste dagen.
 */
export function Tommerkurve({ s, id }: { s: Spilltilstand; id: JordId }) {
  const [valgt, settValgt] = useState<number | null>(null)
  const j = s.jord[id]
  if (!j) return null
  const x = (d: number) => (d / MAKS_DAG) * B
  const y = (f: number) => H - (f / TOPP) * H
  const tredel = skoggrunnlag(s, id) / START_BESTAND
  const verdiFaktor = tommerpris(s) * verdifaktor(j)
  const best = besteHogstdag(j)
  // Pakke 122: kurven er for et bestand som plantes nå, med plantene skogen har.
  const a = nyeVekstdager(j)
  const punkter = Array.from({ length: 76 }, (_, i) => i * 2).map((d) => `${x(d).toFixed(1)},${y(tommerfaktor(d, a)).toFixed(1)}`).join(' ')
  const lesAv = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    settValgt(Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * MAKS_DAG))
  }
  // Snittet per dag ved den beste dagen, ved dag 36 (den beste for tømmeret alene) og 30 dager etter den beste.
  const perDagBest = omlopPerDag(s, id, best)
  const perDag36 = omlopPerDag(s, id, HOGST_BEST_DAG)
  const perDagSent = omlopPerDag(s, id, best + 30)
  return (
    <div className="kort">
      <h2 className="kort-tittel">Tømmeret vokser</h2>
      <figure className="graf tommergraf">
        <div className="graf-akse-y" aria-hidden="true">
          {[1, 2, 3].map((v) => (
            <span key={v} style={{ top: `${(y(v) / H) * 100}%` }}>
              ×{v}
            </span>
          ))}
        </div>
        <div
          className="graf-flate"
          role="img"
          aria-label={`Tømmeret i et bestand vokser mot tre ganger jorda. Mest per dag ved dag ${best}.`}
          onPointerDown={lesAv}
          onPointerMove={(e) => (e.pointerType === 'mouse' || e.buttons) && lesAv(e)}
          onPointerUp={(e) => e.pointerType !== 'mouse' && settValgt(null)}
          onPointerLeave={(e) => e.pointerType === 'mouse' && settValgt(null)}
          onPointerCancel={() => settValgt(null)}
        >
          <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            {[1, 2].map((v) => (
              <line key={v} x1="0" y1={y(v)} x2={B} y2={y(v)} className="graf-rutenett" />
            ))}
            <line x1={x(best)} y1="0" x2={x(best)} y2={H} className="graf-snitt" />
            <polyline points={punkter} fill="none" className="graf-linje" style={{ stroke: 'var(--kilde-1)' }} />
          </svg>
          {bestand(j).map((_, i) => {
            const d = Math.min(MAKS_DAG, Math.max(0, bestandsalder(s, id, i)))
            return <span key={i} className="graf-punkt" style={{ left: `${(x(d) / B) * 100}%`, top: `${(y(tommerfaktor(d, vekstdager(j, i))) / H) * 100}%`, background: 'var(--gull)' }} aria-hidden="true" />
          })}
          {valgt !== null && (
            <>
              <span className="graf-sikte" style={{ left: `${(x(valgt) / B) * 100}%` }} aria-hidden="true" />
              <span className="graf-boble" style={{ left: `${Math.min(75, Math.max(25, (valgt / MAKS_DAG) * 100))}%` }} role="status">
                <strong>Dag {valgt}</strong>
                <span>{kortKroner(tredel * tommerfaktor(valgt, a) * verdiFaktor)} per bestand</span>
                <span>{valgt > 0 ? `${kortKroner(omlopPerDag(s, id, valgt))} om dagen med kredittene` : ''}</span>
              </span>
            </>
          )}
        </div>
        <figcaption className="graf-akse-x" aria-hidden="true">
          <span className="venstre" style={{ left: '0%' }}>
            plantet
          </span>
          <span style={{ left: `${(x(best) / B) * 100}%` }}>dag {best}</span>
          <span className="hoyre" style={{ left: '100%' }}>
            dag {MAKS_DAG}
          </span>
        </figcaption>
      </figure>
      <p className="dempet liten">
        Tømmeret vokser raskest rundt dag {TOMMER_DAGER / 2}. Med klimakredittene gir et omløp mest per dag ved dag {best}: {kortKroner(perDagBest)} om dagen per bestand til vanlig pris. Hogger du ved dag {HOGST_BEST_DAG}, er det {Math.round((1 - perDag36 / perDagBest) * 100)} % mindre; venter du til dag {best + 30}, {Math.round((1 - perDagSent / perDagBest) * 100)} % mindre. Prikkene er bestandene dine.
      </p>
    </div>
  )
}

/** Hva neste trinn gir om dagen og når det er tilbake, eller hva det gir når det står. */
function tilbake(pris: number, perDag: number): string {
  return perDag > 0 ? `≈ ${kortKroner(perDag)} om dagen i et jevnt omløp, tilbake på ${varighet((pris / perDag) * DAG_SEK)}` : ''
}

/**
 * Skogsmaskinene og naboskogen (Pakke 122): vei, hogstmaskin og bedre planter i tre trinn som
 * gårdens maskiner, og naboskogen når skogen har alle fem bestandene.
 */
export function Skogmaskiner({ s, id }: { s: Spilltilstand; id: JordId }) {
  const j = s.jord[id]
  if (!j) return null
  const jordpris = naboskogpris(s, id)
  const tommer = naboskogTommer(s, id)
  const n = naboer(j)
  // Naboskogen gir to ganger det skogen gir nå: jorda tredobles.
  const naboGir = omlopPerDag(s, id, besteHogstdag(j)) * bestand(j).length * (NABO_FAKTOR - 1)
  return (
    <div className="kort">
      <h2 className="kort-tittel">Maskiner og naboskog</h2>
      {SKOGMASKINLISTE.map((m: Skogmaskin) => {
        const trinn = skogmaskintrinn(j, m)
        const ferdig = trinn >= MAKS_MASKINTRINN
        const pris = skogmaskinpris(s, id, m)
        return (
          <div key={m} className="personale-rad gardsmaskin">
            <p className="liten">
              <strong>{SKOGMASKINER[m].navn}</strong>
              {trinn > 0 && ` · trinn ${trinn} av ${MAKS_MASKINTRINN}`}
              <br />
              <span className="dempet">{trinn > 0 && !ferdig ? `Nå ${skogmaskintekst(m, trinn)}; neste ${skogmaskintekst(m, trinn + 1)}` : skogmaskintekst(m, Math.max(1, trinn))}</span>
              {!ferdig && (
                <>
                  <br />
                  <span className="dempet">{tilbake(pris, skogmaskinPerDag(s, id, m))}</span>
                </>
              )}
            </p>
            {ferdig ? (
              <span className="merke ok">Ferdig</span>
            ) : (
              <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < pris} onClick={() => utfor(kjopSkogmaskin(s, id, m))}>
                {trinn > 0 ? `Trinn ${trinn + 1}` : 'Kjøp'} · {kortKroner(pris)}
              </button>
            )}
          </div>
        )
      })}
      <p className="dempet liten">Dagene er tiden til en firedel av tømmeret ({TOMMER_DAGER} uten bedre planter). Plantene gjelder bestand som plantes etter kjøpet; de som står, vokser som før.</p>
      <div className="personale-rad gardsmaskin">
        <p className="liten">
          <strong>Naboskog</strong>
          {n > 0 && ` · ${n} av ${MAKS_NABOER}`}
          <br />
          <span className="dempet">
            {n >= MAKS_NABOER
              ? `Skogen har alle ${MAKS_NABOER} naboskogene: tømmeret vokser på ${NABO_FAKTOR ** n} ganger jorda.`
              : jordpris === null
                ? `Når skogen har alle ${MAKS_BESTAND} bestandene, kan du kjøpe naboskogen: ${NABO_FAKTOR} ganger så mye jord til tømmeret.`
                : `${NABO_FAKTOR} ganger så mye jord til tømmeret. Jorda koster ${kortKroner(jordpris)}, og tømmeret som står der, ${kortKroner(tommer)}. ${tilbake(jordpris, naboGir)}.`}
          </span>
        </p>
        {jordpris !== null && (
          <button className="knapp knapp-gull knapp-liten" disabled={s.kontanter < jordpris + tommer} onClick={() => utfor(kjopNaboskog(s, id))}>
            Kjøp · {kortKroner(jordpris + tommer)}
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Storm og brann (Pakke 122): hva som kan skje, forsikringen, og de siste skadene. En storm tar en
 * tredel av det eldste bestandet om vinteren; en brann et bestand i en tørr sommeruke.
 */
export function Skogrisiko({ s, id }: { s: Spilltilstand; id: JordId }) {
  const j = s.jord[id]
  if (!j) return null
  const pris = forsikringspris(s, id)
  const forsikret = erForsikret(s, j)
  const skader = [...(j.skader ?? [])].reverse()
  const igjen = Math.max(0, ((j.forsikretTil ?? 0) - s.sek) / DAG_SEK)
  return (
    <div className="kort">
      <h2 className="kort-tittel">Storm og brann</h2>
      <p className="dempet liten">
        En vinteruke kan gi storm ({Math.round(STORM_SJANSE * 100)} % sjanse, omtrent én i året): den blåser ned en tredel av det eldste bestandet, som selges for {Math.round(STORM_PRIS * 100)} % av prisen. En tørr sommeruke gir {Math.round(BRANN_SJANSE * 100)} % sjanse for brann, omtrent annethvert år, og den tar et helt bestand.
      </p>
      {forsikret ? (
        <div className="personale-rad gardsmaskin">
          <p className="liten">
            <span className="merke ok">Forsikret</span> <span className="dempet">{j.fornyForsikring ? `Fornyes om ${dager(Math.ceil(igjen))} for ${kortKroner(pris)}.` : `Sagt opp — dekker i ${dager(Math.ceil(igjen))} til.`}</span>
          </p>
          {j.fornyForsikring ? (
            <button className="knapp knapp-sekundær knapp-liten" onClick={() => utfor(siOppSkogforsikring(s, id))}>
              Si opp
            </button>
          ) : (
            <button className="knapp knapp-sekundær knapp-liten" onClick={() => utfor(kjopSkogforsikring(s, id))}>
              Forny
            </button>
          )}
        </div>
      ) : (
        <>
          <button className="knapp knapp-gull" disabled={s.kontanter < pris} onClick={() => utfor(kjopSkogforsikring(s, id))}>
            Forsikre skogen · {kortKroner(pris)} i året
          </button>
          <p className="dempet liten">
            Dekker det stormen tar fullt ut og tømmeret en brann tar, til dagens verdi. Et år er {FORSIKRING_DAGER} spilldager, betalt på forskudd; den fornyes av seg selv og kan sies opp.
          </p>
        </>
      )}
      {skader.length > 0 && (
        <ul className="romlogg">
          {skader.map((k, i) => (
            <li key={`${k.dag}-${i}`}>
              <span>
                Dag {k.dag} · {k.type === 'storm' ? `storm, ${Math.round(STORM_ANDEL * 100)} % av et bestand` : 'brann, et bestand'}
              </span>
              <span>
                −{kortKroner(k.tapt)}
                {k.betalt > 0 && <span className="dempet"> · fikk {kortKroner(k.betalt)}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Skogens regnskap (Pakke 120): de siste åtte hogstene og alt tømmeret har gitt. */
export function Skogregnskap({ s, id }: { s: Spilltilstand; id: JordId }) {
  const j = s.jord[id]
  if (!j) return null
  const hogster = [...(j.hogster ?? [])].reverse()
  return (
    <div className="kort">
      <h2 className="kort-tittel">Regnskapet</h2>
      {hogster.length === 0 ? (
        <p className="dempet liten">Ingen hogster ennå. Hver hogst står her med dag, bestand, alder og hva den ga.</p>
      ) : (
        <>
          <p className="dempet liten">
            Tømmeret har gitt {kortKroner(j.tommerTotalt ?? 0)} siden du kjøpte skogen{(j.karbon ?? 0) >= 1 ? `, og klimakredittene ${kortKroner(j.karbon ?? 0)}` : ''}.
          </p>
          <ul className="romlogg">
            {hogster.map((h, i) => (
              <li key={`${h.dag}-${h.bestand}-${i}`}>
                <span>
                  Dag {h.dag} · bestand {h.bestand + 1} · {dager(Math.round(h.alder))}
                </span>
                <span>
                  {kortKroner(h.belop)}
                  {h.alder > 0 && <span className="dempet"> · {kortKroner(h.belop / h.alder)}/d</span>}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}


