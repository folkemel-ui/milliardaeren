/**
 * Tegnestilen (Grafikkpakke G1): grunnmuren alle nye tegninger bygges på.
 * Reglene står i toppen av Illustrasjoner.tsx; her er verktøyene.
 *
 * - Lerretet er 96 × 96. Små ikoner er den samme tegningen skalert ned.
 * - Fargene kommer fra paletten S. Hvert materiale har tre toner: `lys`
 *   (flater som vender mot lyset), `flate` (fronten) og `skygge` (siden
 *   bort fra lyset). Lyset kommer alltid ovenfra til venstre.
 * - Dybde vises skrått: en kloss har front, en side mot høyre og et tak,
 *   og dybden går opp og til høyre (DYBDE).
 * - Alt står på GRUNNLINJE (y = 84) og på en Bakke som passer motivet.
 * - Tre avstander gir fast målestokk (METER): nær, gate og fjern.
 */

import { createContext, Fragment, useContext, useId, type ReactNode } from 'react'

export type Materiale = { lys: string; flate: string; skygge: string }

/** Paletten: dempede nordiske toner. Gull er den eneste klare fargen. */
export const S = {
  puss: { lys: '#e4dccb', flate: '#d3c8b3', skygge: '#a99d87' },
  stein: { lys: '#bdb8ae', flate: '#a39e94', skygge: '#7d786f' },
  tegl: { lys: '#a8604b', flate: '#93503e', skygge: '#6f3b2f' },
  faluRod: { lys: '#9a4a3c', flate: '#823d32', skygge: '#5f2c25' },
  treverk: { lys: '#a88563', flate: '#8d6d4f', skygge: '#69503a' },
  treMork: { lys: '#6e5745', flate: '#574436', skygge: '#3d3027' },
  skifer: { lys: '#66717b', flate: '#505a64', skygge: '#3a424a' },
  metall: { lys: '#c6c9cb', flate: '#9ca1a5', skygge: '#6f7479' },
  glass: { lys: '#b4c5cc', flate: '#89a0ab', skygge: '#5f7784' },
  mork: { lys: '#4a4744', flate: '#353230', skygge: '#242120' },
  hvit: { lys: '#efece6', flate: '#ddd8ce', skygge: '#b7b0a3' },
  gran: { lys: '#5f7a58', flate: '#4a6345', skygge: '#344832' },
  gress: { lys: '#8b9a63', flate: '#738450', skygge: '#57663c' },
  sjo: { lys: '#7397a8', flate: '#4b7389', skygge: '#33566b' },
  sno: { lys: '#f2f3f1', flate: '#dfe3e3', skygge: '#b8c2c6' },
  fjell: { lys: '#9aa5ad', flate: '#7f8b94', skygge: '#626d77' },
  marine: { lys: '#506480', flate: '#3c4e69', skygge: '#2b3a50' },
  petrol: { lys: '#527f80', flate: '#3d6667', skygge: '#2b4c4d' },
  oker: { lys: '#d2ab5c', flate: '#b88f40', skygge: '#8b6b2d' },
  vin: { lys: '#934750', flate: '#77343c', skygge: '#55242b' },
  bjork: { lys: '#b7b45f', flate: '#9a9a4c', skygge: '#76783a' },
  lov: { lys: '#7c8f5c', flate: '#647748', skygge: '#4a5a35' },
  gull: { lys: '#e7cf88', flate: '#c9a54a', skygge: '#94782f' },
  hud: { lys: '#e2bd9b', flate: '#c99b77', skygge: '#a07858' },
  hudMork: { lys: '#a87a5c', flate: '#8a5f43', skygge: '#664532' },
  /** Varmt lys i et vindu. */
  vinduLys: { lys: '#f3dca4', flate: '#e8c98a', skygge: '#c9a66a' },
} as const satisfies Record<string, Materiale>

/**
 * Himmelen bak motivet, i mørkt tema. Himmelen er bakgrunn, ikke motiv, så
 * den følger temaet: det lyse temaet har egne, lysere farger i styles/grunnlag.css
 * (--himmel-dag-topp osv.). Selve motivet har faste farger i begge temaer.
 */
export const HIMMEL = {
  dag: ['#6f8798', '#d6c4a0'],
  inne: ['#4f4a45', '#7d756b'],
} as const

/** Fargen det som står langt unna blandes mot (`Dis`): midt i himmelen. */
export const DISFARGE = '#b3b2a5'

/** Grunnlinjen alt står på. */
export const GRUNNLINJE = 84

/** Dybden: én enhet inn i bildet flytter så langt til høyre og opp. */
export const DYBDE = { x: 0.5, y: -0.3 } as const

/**
 * Målestokken, i enheter per meter. Hvert motiv ses fra én av tre avstander,
 * og alt på samme avstand har samme mål: en person, en dør, en etasje.
 * - nær: ting du holder eller står ved — biler, klokker, boder.
 * - gate: hus og forretninger, sett fra fortauet.
 * - fjern: tårn, anlegg og store bygg, sett fra andre siden av byen.
 */
export const METER = { naer: 18, gate: 10, fjern: 2.5 } as const
export type Avstand = keyof typeof METER

/** Faste mål i meter, så en dør er like høy i hver tegning på samme avstand. */
export const MAAL = { person: 1.75, dor: 2.1, etasje: 3.2 } as const

export const maal = (avstand: Avstand, hva: keyof typeof MAAL) => MAAL[hva] * METER[avstand]

// ─────────────────────────────────────────────── Lerretet

/**
 * Lerretets id og definisjonene tegningen har bedt om (G8). Hver tegning skriver
 * bare ut de gradientene, maskene og filtrene den faktisk bruker: før fikk hver
 * tegning alle sammen, rundt 50 skjulte elementer, og på Luksus var nesten
 * halvparten av siden slike.
 */
type Lerretinfo = { id: string; brukt: Set<string>; x: number; b: number }

const Ider = createContext<Lerretinfo>({ id: 't', brukt: new Set(), x: 0, b: 96 })

/**
 * Utklipp: tegningen uten himmel, bakke og bakgrunn — bare motivet med
 * skyggen sin. Til steder som har sin egen scene rundt, som garasjen, havna
 * og hangaren i Luksus. Settes av `Illustrasjon` (`utklipp`).
 */
export const Utklipp = createContext(false)

/**
 * Nærbilde (G9): et utsnitt rundt motivet, til steder der tegningen er så
 * liten at kiosken eller snekka forsvinner (rivallista, plassene i garasjen,
 * havna og hangaren). \`boks\` er utsnittet i lerretets enheter, \`bredde\` og
 * \`hoyde\` størrelsen i piksler. Settes av \`Illustrasjon\` (\`naerbilde\`).
 */
export const Naerbilde = createContext<{ boks: readonly [number, number, number, number]; bredde: number; hoyde: number } | null>(null)

/**
 * Den store scenen (G10): sann bare øverst i detaljvisningene (`Scene`). Bare
 * der følger tegningen klokka — natt når siden rundt setter `--natt` (0–1,
 * `morke` i ui/dagognatt.ts) — og klokkene viser ekte tid. Lister, kort, Avisa
 * og galleriet står alltid midt på dagen, og slipper det ekstra natt-laget.
 */
export const IScenen = createContext(false)

/**
 * Full ramme (G13): tegningen fyller rammen helt ut, uten vignett — himmelen,
 * bakken og bakgrunnen går til kantene i stedet for å blekne ut. Settes av
 * `Illustrasjon` for tegningene i `FULL_RAMME`. På firkantede steder (kortet,
 * kjøpsøyeblikket, Avisa) er det midten av tegningen, kant i kant.
 */
export const Fullramme = createContext(false)

/**
 * Bred ramme (G13): stedet viser tegningen i bredformat, 176 × 96 (11:6), med
 * den gamle firkanten midt i (x 0–96) og 40 enheter nytt på hver side. Bare
 * scenen og galleriet; bare tegninger med full ramme blir brede.
 */
export const Bredt = createContext(false)

/** Den brede rammen i lerretets enheter: x fra −40 til 136. */
export const BRED = { x: -40, b: 176 } as const

/**
 * Farger som lyser om natta: vinduslyset og lampene. Natt-laget i scenen viser
 * bare disse (og alt med klassen `nattlys` eller `nattvindu`); resten blir svart.
 * styles/tegninger.css har de samme fargene — endres paletten, må de følge med.
 */
export const LYSFARGER = ['#f3dca4', '#e8c98a', '#c9a66a'] as const

/** Peker til en av lerretets felles gradienter, med lerretets egne id-er, og melder at den trengs. */
function useUrl() {
  const { id, brukt } = useContext(Ider)
  return (navn: string) => {
    brukt.add(navn)
    return `url(#${id}${navn})`
  }
}

/** En maske trenger gradienten sin. */
const TRENGER: Record<string, string> = { vm: 'v', km: 'k', nm: 'n', bm: 'b', rm: 'r' }

/** Himmelen om natta, i mørkt tema (det lyse har sine i styles/grunnlag.css). */
export const NATTHIMMEL = ['#0c1220', '#2a3046'] as const

/** Fargen motivet dempes mot om natta: mørk blå. */
export const NATTFARGE = '#25324f'

/** Én definisjon etter navn. `tema` gjelder bare himmelen. */
function definisjon(id: string, navn: string, tema: keyof typeof HIMMEL, x0 = 0, b = 96): ReactNode {
  const maske = (gradient: string) => (
    <mask id={`${id}${navn}`}>
      <rect x="0" y="0" width="96" height="96" fill={`url(#${id}${gradient})`} />
    </mask>
  )
  switch (navn) {
    case 'h': {
      const [topp, horisont] = HIMMEL[tema]
      return (
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: `var(--himmel-${tema}-topp, ${topp})` }} />
          <stop offset="0.85" style={{ stopColor: `var(--himmel-${tema}-horisont, ${horisont})` }} />
        </linearGradient>
      )
    }
    // Himmelen i scenen (G10): dagens farger blandet mot natta etter --natt.
    case 'hn': {
      const [topp, horisont] = HIMMEL.dag
      const bland = (dag: string, natt: string) => `color-mix(in srgb, ${dag}, ${natt} calc(var(--natt, 0) * 100%))`
      return (
        <linearGradient id={`${id}hn`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: bland(`var(--himmel-dag-topp, ${topp})`, `var(--himmel-natt-topp, ${NATTHIMMEL[0]})`) }} />
          <stop offset="0.85" style={{ stopColor: bland(`var(--himmel-dag-horisont, ${horisont})`, `var(--himmel-natt-horisont, ${NATTHIMMEL[1]})`) }} />
        </linearGradient>
      )
    }
    // Natta over motivet (G10): fargene ganges med en farge mellom hvitt (dag)
    // og mørk blå (natt). Hvor langt mot blått styres av --natt, så klokka
    // trenger ingen ny tegning. «arithmetic» med k1 = 1 ganger hver kanal og
    // lar gjennomsiktigheten være som den er (disen bak blir like mørk).
    case 'natt':
      return (
        <filter id={`${id}natt`} filterUnits="userSpaceOnUse" x={x0} y="0" width={b} height="96" colorInterpolationFilters="sRGB">
          <feFlood style={{ floodColor: `color-mix(in srgb, #ffffff, ${NATTFARGE} calc(var(--natt, 0) * 82%))` }} result="f" />
          <feComposite in="f" in2="SourceGraphic" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" />
        </filter>
      )
    // Lysene om natta får en myk glorie.
    case 'glod':
      return (
        <filter id={`${id}glod`} filterUnits="userSpaceOnUse" x={x0} y="0" width={b} height="96" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      )
    case 'v':
      return (
        <radialGradient id={`${id}v`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.15" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="0.8" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      )
    case 'vm':
      return maske('v')
    // Bakken blekner ut mot sidene.
    case 'k':
      return (
        <linearGradient id={`${id}k`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.14" stopColor="#ffffff" />
          <stop offset="0.86" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      )
    case 'km':
      return maske('k')
    // Havet blekner ut nederst, så det ikke slutter i en hard kant.
    case 'n':
      return (
        <linearGradient id={`${id}n`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.84" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      )
    case 'nm':
      return maske('n')
    case 'b':
      return (
        <radialGradient id={`${id}b`} gradientUnits="userSpaceOnUse" cx="48" cy={GRUNNLINJE - 3} r="58" gradientTransform={`translate(48 ${GRUNNLINJE - 3}) scale(1 0.3) translate(-48 -${GRUNNLINJE - 3})`}>
          <stop offset="0.55" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      )
    case 'bm':
      return maske('b')
    // Slagskygge: mørkest inntil tingen, borte et stykke unna.
    case 's':
      return (
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000000" stopOpacity="0.34" />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </linearGradient>
      )
    // Mørkere nederst på en vegg, der lyset ikke når.
    case 'a':
      return (
        <linearGradient id={`${id}a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.18" />
        </linearGradient>
      )
    // Glans på glass og lakk: lys streif ovenfra til venstre.
    case 'g':
      return (
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      )
    // Vann og blank flate: lysere inn mot horisonten.
    case 'd':
      return (
        <linearGradient id={`${id}d`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      )
    // Speilbildet på et blankt gulv blekner nedover.
    case 'r':
      return (
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.26" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      )
    case 'rm':
      return (
        <mask id={`${id}rm`} maskContentUnits="userSpaceOnUse">
          <rect x="0" y={GRUNNLINJE} width="96" height={96 - GRUNNLINJE} fill={`url(#${id}r)`} />
        </mask>
      )
    // Dis: hver farge blandes halvveis mot DISFARGE (#b3b2a5).
    case 'dis':
      return (
        <filter id={`${id}dis`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0.5 0 0 0 0.351  0 0.5 0 0 0.349  0 0 0.5 0 0.324  0 0 0 1 0" />
        </filter>
      )
    // Et lyskjegle ovenfra, for utstillingsrommet.
    case 'l':
      return (
        <radialGradient id={`${id}l`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff4dc" stopOpacity="0.3" />
          <stop offset="1" stopColor="#fff4dc" stopOpacity="0" />
        </radialGradient>
      )
    default:
      throw new Error(`Ukjent definisjon i lerretet: ${navn}`)
  }
}

/**
 * Definisjonene tegningen brukte. Står sist i lerretet: React tegner hele
 * innholdet før neste søsken, så da vet vi hva som ble brukt. En url() kan
 * peke fram i dokumentet, så rekkefølgen i SVG-en spiller ingen rolle.
 */
function Definisjoner({ tema }: { tema: keyof typeof HIMMEL }) {
  const { id, brukt, x, b } = useContext(Ider)
  const alle = new Set(brukt)
  for (const navn of brukt) if (TRENGER[navn]) alle.add(TRENGER[navn])
  if (alle.size === 0) return null
  return (
    <defs>
      {[...alle].sort().map((navn) => (
        <Fragment key={navn}>{definisjon(id, navn, tema, x, b)}</Fragment>
      ))}
    </defs>
  )
}

/**
 * Lerretet: 96 × 96, en myk himmel som blekner ut mot kantene (ingen hard
 * boks), og felles gradienter for skygger og glans — bare de tegningen
 * bruker. Id-ene er unike per tegning, så skjulte tegninger andre steder på
 * siden aldri tar dem med seg.
 */
export function Lerret({ størrelse, himmel = 'dag', children }: { størrelse: number; himmel?: keyof typeof HIMMEL | 'ingen'; children: ReactNode }) {
  const id = 't' + useId().replace(/[^a-zA-Z0-9]/g, '')
  if (useContext(Utklipp)) himmel = 'ingen'
  const naer = useContext(Naerbilde)
  // Full ramme (G13): ingen vignett, og bredformat der stedet ber om det.
  const full = useContext(Fullramme)
  const bredt = useContext(Bredt)
  const bred = full && bredt && !naer
  const [x0, b] = bred ? [BRED.x, BRED.b] : [0, 96]
  const tema = himmel === 'inne' ? 'inne' : 'dag'
  // Natt bare ute og bare i scenen: bilene og klokkene står inne, i lyset sitt.
  const natt = useContext(IScenen) && himmel === 'dag'
  const h = natt ? 'hn' : 'h'
  // Nytt for hver tegning av lerretet; barna fyller det mens de tegnes.
  const info: Lerretinfo = { id, brukt: new Set(), x: x0, b }
  if (himmel !== 'ingen') info.brukt.add(h)
  if (himmel !== 'ingen' && !full) info.brukt.add('vm')
  if (himmel === 'inne') info.brukt.add('l')
  if (natt) info.brukt.add('natt').add('glod')
  return (
    <svg
      className="illustrasjon lerret"
      width={naer ? naer.bredde : bred ? r2((størrelse * b) / 96) : størrelse}
      height={naer ? naer.hoyde : størrelse}
      viewBox={naer ? naer.boks.join(' ') : `${x0} 0 ${b} 96`}
      aria-hidden="true"
    >
      {himmel !== 'ingen' && <rect x={x0} y="0" width={b} height="96" fill={`url(#${id}${h})`} mask={full ? undefined : `url(#${id}vm)`} className={full ? 'lerret-himmel' : undefined} />}
      {himmel === 'inne' && <ellipse cx="48" cy="62" rx="44" ry="30" fill={`url(#${id}l)`} />}
      {natt && <Stjerner id={id} full={full} />}
      <Ider.Provider value={info}>
        {natt ? (
          <>
            {/* Motivet, mørknet etter --natt. */}
            <g filter={`url(#${id}natt)`}>{children}</g>
            {/* Det samme motivet en gang til, der bare lysene har farge
                (styles/tegninger.css gjør resten svart) — lagt over med «screen», så
                vinduene lyser gjennom natta. Det som står foran et vindu, er
                svart her også og skjuler lyset riktig. */}
            <g className="nattlag" filter={`url(#${id}glod)`}>
              {children}
            </g>
          </>
        ) : (
          children
        )}
        <Definisjoner tema={tema} />
      </Ider.Provider>
    </svg>
  )
}

/** Stjernene på nattehimmelen: synlige bare når det er mørkt (styles/tegninger.css). */
const STJERNER: [number, number, number][] = [
  [12, 12, 0.45],
  [24, 6, 0.35],
  [33, 17, 0.3],
  [47, 9, 0.4],
  [61, 4, 0.3],
  [70, 14, 0.45],
  [83, 9, 0.35],
  [88, 22, 0.3],
  [7, 26, 0.3],
]

function Stjerner({ id, full }: { id: string; full: boolean }) {
  // I full ramme står stjernene over hele himmelen, uten vignett: mønsteret gjentas til sidene.
  const stjerner = full ? [-88, 0, 88].flatMap((dx) => STJERNER.map(([x, y, r]) => [x + dx, y, r] as const)) : STJERNER
  return (
    <g className="stjerner" mask={full ? undefined : `url(#${id}vm)`}>
      {stjerner.map(([x, y, r]) => (
        <circle key={x} cx={x} cy={y} r={r} fill="#f1ece0" />
      ))}
    </g>
  )
}

// ─────────────────────────────────────────────── Lys og skygge

/** Et punkt flyttet `d` enheter inn i bildet. */
export const inn = (x: number, y: number, d: number): [number, number] => [+(x + d * DYBDE.x).toFixed(2), +(y + d * DYBDE.y).toFixed(2)]

/** Avrundet til to desimaler, så flyttallsrester (56.60000000000001) ikke havner i markupen. */
export const r2 = (n: number) => +n.toFixed(2)

export const pkt = (...p: [number, number][]) => p.map(([x, y]) => `${+x.toFixed(2)},${+y.toFixed(2)}`).join(' ')

/**
 * En kloss: fronten (b × h, nederste kant på y), siden mot høyre i skygge og
 * taket i lys. Grunnformen for hus, disker, kasser og tårn.
 */
export function Kloss({ x, y = GRUNNLINJE, b, h, d, m, front, tak = true }: { x: number; y?: number; b: number; h: number; d: number; m: Materiale; front?: string; tak?: boolean }) {
  const t = y - h
  return (
    <g>
      <polygon points={pkt([x + b, y], inn(x + b, y, d), inn(x + b, t, d), [x + b, t])} fill={m.skygge} />
      {tak && <polygon points={pkt([x, t], [x + b, t], inn(x + b, t, d), inn(x, t, d))} fill={m.lys} />}
      <rect x={x} y={t} width={b} height={h} fill={front ?? m.flate} />
    </g>
  )
}

/**
 * Saltak med mønet inn i bildet: gavlen vender mot oss. `x`, `b` og `y` er
 * veggens front (y = toppen av veggen), `h` takets høyde over veggen.
 */
export function Saltak({ x, y, b, d, h, m, gavl, overheng = 2 }: { x: number; y: number; b: number; d: number; h: number; m: Materiale; gavl: Materiale; overheng?: number }) {
  const v: [number, number] = [x - overheng, y + overheng * 0.6]
  const hoyre: [number, number] = [x + b + overheng, y + overheng * 0.6]
  const topp: [number, number] = [x + b / 2, y - h]
  return (
    <g>
      <polygon points={pkt(v, topp, inn(...topp, d + overheng), inn(...v, d + overheng))} fill={m.lys} />
      <polygon points={pkt(topp, hoyre, inn(...hoyre, d + overheng), inn(...topp, d + overheng))} fill={m.skygge} />
      <polygon points={pkt([x, y], [x + b / 2, y - h + overheng * 0.9], [x + b, y])} fill={gavl.lys} />
      <polygon points={pkt(v, topp, hoyre)} fill="none" stroke={m.flate} strokeWidth="1.6" strokeLinejoin="round" />
    </g>
  )
}

/**
 * Slagskyggen på bakken: fra tingens høyre kant, bort fra lyset og inn i
 * bildet. `x1`–`x2` er foten av tingen, `lengde` hvor langt skyggen når.
 */
export function Slagskygge({ x1, x2, y = GRUNNLINJE, lengde, d = 0 }: { x1: number; x2: number; y?: number; lengde: number; d?: number }) {
  const u = useUrl()
  const a: [number, number] = [x2, y]
  const b = inn(x2, y, d)
  return (
    <g>
      <ellipse cx={r2((x1 + x2) / 2)} cy={r2(y + 0.4)} rx={r2((x2 - x1) / 2 + 2)} ry="1.8" fill="#000000" opacity="0.28" />
      <polygon points={pkt([x1 + (x2 - x1) * 0.3, y], a, b, [b[0] + lengde, b[1]], [a[0] + lengde * 0.6, y])} fill={u('s')} />
    </g>
  )
}

/** Mørkere nederst på en flate, der lyset ikke når. */
export function Bunnskygge({ x, y, b, h }: { x: number; y: number; b: number; h: number }) {
  const u = useUrl()
  return <rect x={x} y={y} width={b} height={h} fill={u('a')} />
}

/** Glans over glass eller lakk, i formen du gir den. */
export function Glans({ points, d }: { points?: string; d?: string }) {
  const u = useUrl()
  return d ? <path d={d} fill={u('g')} /> : <polygon points={points} fill={u('g')} />
}

/**
 * Speilbildet på et blankt gulv: tegningen speilet om grunnlinjen, svakt og
 * blekende. Bare for `gulv`.
 */
export function Speiling({ children }: { children: ReactNode }) {
  const u = useUrl()
  if (useContext(Utklipp)) return null
  return (
    <g mask={u('rm')} opacity="0.8">
      <g transform={`translate(0 ${2 * GRUNNLINJE}) scale(1 -1)`}>{children}</g>
    </g>
  )
}

/**
 * Lyset som glir over lakken (G10): et lyst bånd som sveiper over bilen fra
 * venstre, med en pause, bare i scenen. Båndet holdes innenfor bilens omriss
 * med en maske laget av den samme tegningen (`children`), der alt er hvitt
 * unntatt det som har klassen `ikke-lakk` (dekkene). Uten bevegelse står båndet
 * utenfor lerretet og synes ikke.
 */
export function Lakksveip({ children }: { children: ReactNode }) {
  const { id } = useContext(Ider)
  const iScenen = useContext(IScenen)
  const utklipp = useContext(Utklipp)
  if (!iScenen || utklipp) return null
  const m = `${id}lakk`
  return (
    <g>
      <mask id={m} maskUnits="userSpaceOnUse" x="0" y="0" width="96" height="96">
        <g className="lakkmaske">{children}</g>
      </mask>
      <g mask={`url(#${m})`}>
        <g className="anim-sveip">
          <polygon points="-14,40 -3,40 -11,92 -22,92" fill="#ffffff" opacity="0.1" />
          <polygon points="-10,40 -6,40 -14,92 -18,92" fill="#ffffff" opacity="0.16" />
        </g>
      </g>
    </g>
  )
}

/** Dis over det som står langt unna: fargene blandes halvveis mot himmelen, og himmelen skinner litt gjennom. */
export function Dis({ children }: { children: ReactNode }) {
  const u = useUrl()
  return (
    <g filter={u('dis')} opacity="0.7">
      {children}
    </g>
  )
}

/**
 * Bakgrunnen (fjell, byen bak), som blekner ut mot kantene. Faller bort i et
 * utklipp, sammen med himmelen og bakken.
 */
export function Kantfade({ children }: { children: ReactNode }) {
  const u = useUrl()
  const full = useContext(Fullramme)
  if (useContext(Utklipp)) return null
  // Full ramme (G13): bakgrunnen går til kanten — tegningen må selv nå dit.
  if (full) return <g className="lerret-bakgrunn">{children}</g>
  return <g mask={u('km')}>{children}</g>
}

/**
 * Bakke som fyller bunnen av lerretet (en åsside, snøen under en hoppbakke),
 * blekner ut nederst og mot sidene, som havet gjør.
 */
export function Bunnfade({ children }: { children: ReactNode }) {
  const u = useUrl()
  const full = useContext(Fullramme)
  if (useContext(Utklipp)) return null
  if (full) return <g className="lerret-bakgrunn">{children}</g>
  return (
    <g mask={u('km')}>
      <g mask={u('nm')}>{children}</g>
    </g>
  )
}

// ─────────────────────────────────────────────── Bakken

export type Bakketype = 'fortau' | 'gress' | 'kai' | 'gulv' | 'sno' | 'hav' | 'asfalt' | 'brostein' | 'promenade'

/** Horisonten over åpent hav (`hav`). */
export const HORISONT = 56

/**
 * Bakken, tilpasset motivet: fortau for forretninger, gress for hus, kai og
 * sjø for båter, blankt gulv for biler, snø i fjellet, åpent hav helt ut til
 * horisonten for det som ligger til havs, og asfalt for flyplassen. Den
 * blekner ut mot sidene, så tegningen ikke står på en grå strek — unntatt i en
 * tegning med full ramme (G13), der den går helt ut til kantene av den brede
 * rammen.
 */
export function Bakke({ type }: { type: Bakketype }) {
  const u = useUrl()
  const utklipp = useContext(Utklipp)
  const full = useContext(Fullramme)
  const g = GRUNNLINJE
  if (utklipp) return null
  const x0 = full ? BRED.x : 0
  const w = full ? BRED.b : 96
  const x1 = x0 + w
  /** En jevn rad (`xs` med steg `steg`), forlenget ut til kantene i full ramme. */
  const utvid = (xs: number[], steg: number) => {
    if (!full) return xs
    const før: number[] = []
    for (let x = xs[0] - steg; x > x0 - steg; x -= steg) før.unshift(r2(x))
    const etter: number[] = []
    for (let x = xs[xs.length - 1] + steg; x < x1 + steg; x += steg) etter.push(r2(x))
    return [...før, ...xs, ...etter]
  }
  /** Et uregelmessig mønster over 96 enheter, gjentatt til hver side i full ramme. */
  const gjenta = <T extends readonly number[]>(xs: T[]): T[] =>
    full ? ([-96, 0, 96].flatMap((dx) => xs.map((p) => [p[0] + dx, ...p.slice(1)] as unknown as T)).filter((p) => p[0] > x0 - 10 && p[0] < x1) as T[]) : xs
  let innhold: ReactNode
  switch (type) {
    case 'fortau':
      innhold = (
        <>
          <rect x={x0} y={g - 16} width={w} height="28" fill={S.stein.lys} />
          {utvid([-24, -8, 8, 24, 40, 56, 72, 88, 104], 16).map((x) => (
            <line key={x} x1={x} y1={g + 6} x2={r2(x + 6.6)} y2={g - 16} stroke={S.stein.flate} strokeWidth="0.5" />
          ))}
          {[g - 9, g - 2].map((y) => (
            <line key={y} x1={x0} y1={y} x2={x1} y2={y} stroke={S.stein.flate} strokeWidth="0.5" />
          ))}
          <rect x={x0} y={g + 6} width={w} height="1" fill={S.hvit.flate} />
        </>
      )
      break
    case 'gress':
      innhold = (
        <>
          <rect x={x0} y={g - 16} width={w} height={full ? 28 : 26} fill={S.gress.flate} />
          <rect x={x0} y={g - 16} width={w} height="8" fill={S.gress.skygge} opacity="0.45" />
          {gjenta([8, 21, 33, 58, 77, 89].map((x, i) => [x, i] as const)).map(([x, i]) => (
            <path key={x} d={`M${x} ${g + 3 + (i % 3)} l1 -2.6 l1 2.6 l1 -2 l0.8 2`} fill="none" stroke={S.gress.lys} strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </>
      )
      break
    case 'sno':
      innhold = (
        <>
          <rect x={x0} y={g - 16} width={w} height={full ? 28 : 26} fill={S.sno.flate} />
          <rect x={x0} y={g - 16} width={w} height="7" fill={S.sno.skygge} opacity="0.5" />
        </>
      )
      break
    case 'gulv':
      innhold = (
        <>
          <rect x={x0} y={g - 12} width={w} height={full ? 24 : 22} fill={S.mork.flate} />
          <rect x={x0} y={g - 12} width={w} height={full ? 24 : 22} fill={u('d')} />
          <rect x={x0} y={g - 12.6} width={w} height="0.8" fill={S.metall.skygge} />
          {utvid([-20, 10, 40, 70, 100], 30).map((x) => (
            <line key={x} x1={x} y1={g + 10} x2={x + 22} y2={g - 12} stroke={S.mork.lys} strokeWidth="0.4" />
          ))}
        </>
      )
      break
    case 'kai':
      innhold = (
        <>
          <rect x={x0} y={g - 16} width={w} height="28" fill={S.sjo.flate} />
          <rect x={x0} y={g - 16} width={w} height="28" fill={u('d')} />
          <polyline className="anim-boelge" points={`40,${g + 4} 44,${g + 2.8} 48,${g + 4}`} fill="none" stroke={S.sjo.lys} strokeWidth="0.8" strokeLinecap="round" />
          <polyline className="anim-boelge sen" points={`70,${g + 8} 74,${g + 6.8} 78,${g + 8}`} fill="none" stroke={S.sjo.lys} strokeWidth="0.8" strokeLinecap="round" />
          <polyline className="anim-boelge" points={`82,${g - 4} 85,${g - 5} 88,${g - 4}`} fill="none" stroke={S.sjo.lys} strokeWidth="0.6" strokeLinecap="round" />
          {/* Kaia: steinkant med en planke på toppen og en pullert. */}
          <polygon points={pkt([x0, g - 4], [26, g - 4], inn(26, g - 4, 20), [x0, g - 10])} fill={S.stein.lys} />
          <rect x={x0} y={g - 4} width={26 - x0} height="14" fill={S.stein.flate} />
          {[g, g + 4.5].map((y) => (
            <line key={y} x1={x0} y1={y} x2="26" y2={y} stroke={S.stein.skygge} strokeWidth="0.6" />
          ))}
          {(full ? [-33, -24, -15, -6, 6, 15, 22] : [6, 15, 22]).map((x, i) => (
            <line key={x} x1={x - (i % 2) * 3} y1={g - 4 + (i % 2) * 4.5} x2={x - (i % 2) * 3} y2={g + (i % 2) * 4.5} stroke={S.stein.skygge} strokeWidth="0.6" />
          ))}
          <polygon points={pkt([26, g - 4], inn(26, g - 4, 20), inn(26, g + 10, 20), [26, g + 10])} fill={S.stein.skygge} />
          <rect x={x0} y={g - 5.4} width={26.4 - x0} height="1.6" fill={S.treverk.flate} />
          <rect x="16" y={g - 9.5} width="3" height="4.4" rx="1" fill={S.mork.lys} />
          <rect x="15.4" y={g - 10.2} width="4.2" height="1.4" rx="0.7" fill={S.mork.flate} />
        </>
      )
      break
    case 'hav':
      innhold = (
        <>
          <rect x={x0} y={HORISONT} width={w} height={96 - HORISONT} fill={S.sjo.flate} />
          <rect x={x0} y={HORISONT} width={w} height={96 - HORISONT} fill={u('d')} />
          <rect x={x0} y={HORISONT} width={w} height="3" fill={S.sjo.lys} opacity="0.55" />
          {gjenta([
            [12, 64, 0.5],
            [70, 62, 0.5],
            [30, 72, 0.7],
            [80, 76, 0.7],
            [8, 86, 0.9],
            [52, 91, 0.9],
          ]).map(([x, y, b], i) => (
            <polyline key={i} className={i % 2 ? 'anim-boelge sen' : 'anim-boelge'} points={`${x},${y} ${x + 4 * b},${y - 1.2 * b} ${x + 8 * b},${y}`} fill="none" stroke={S.sjo.lys} strokeWidth={b} strokeLinecap="round" />
          ))}
        </>
      )
      if (full) return <g className="lerret-bakke">{innhold}</g>
      return (
        <g mask={u('km')}>
          <g mask={u('nm')}>{innhold}</g>
        </g>
      )
    // Brostein på et torg: rader av runde steiner (avrundede streker), forskjøvet annenhver rad.
    case 'brostein':
      innhold = (
        <>
          <rect x={x0} y={g - 16} width={w} height="28" fill={S.stein.flate} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line key={i} x1={x0 - 4} y1={r2(g - 13.6 + i * 4.4)} x2={x1 + 4} y2={r2(g - 13.6 + i * 4.4)} stroke={S.stein.lys} strokeWidth={r2(1.3 + i * 0.25)} strokeDasharray={`${r2(2.2 + i * 0.4)} ${r2(1.4 + i * 0.2)}`} strokeDashoffset={i % 2 ? 1.8 : 0} strokeLinecap="round" opacity="0.7" />
          ))}
        </>
      )
      break
    // Strandpromenaden: en stripe sand bakerst og plankegang i tre.
    case 'promenade':
      innhold = (
        <>
          <rect x={x0} y={g - 16} width={w} height="5" fill={S.puss.lys} />
          <rect x={x0} y={g - 11} width={w} height="23" fill={S.treverk.lys} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <line key={i} x1={x0} y1={r2(g - 8 + i * 3.4)} x2={x1} y2={r2(g - 8 + i * 3.4)} stroke={S.treverk.flate} strokeWidth="0.4" />
          ))}
          {gjenta([[14, 0], [46, 1], [78, 2], [30, 3], [62, 4], [8, 5], [88, 5]]).map(([x, i]) => (
            <line key={`${x}-${i}`} x1={x} y1={r2(g - 8 + i * 3.4)} x2={x} y2={r2(g - 4.6 + i * 3.4)} stroke={S.treverk.flate} strokeWidth="0.4" />
          ))}
        </>
      )
      break
    case 'asfalt':
      innhold = (
        <>
          <rect x={x0} y={g - 16} width={w} height="28" fill={S.mork.lys} />
          <rect x={x0} y={g - 16} width={w} height="6" fill={S.mork.flate} opacity="0.5" />
          <path d={full ? `M${x0 - 4} ${g + 7} Q48 ${g - 2} ${x1 + 4} ${g - 7}` : `M-4 ${g + 6} Q40 ${g - 2} 100 ${g - 6}`} fill="none" stroke={S.oker.flate} strokeWidth="0.7" />
          {utvid([6, 22, 38, 54, 70, 86], 16).map((x) => (
            <rect key={x} x={x} y={g + 8} width="8" height="0.8" fill={S.hvit.flate} opacity="0.7" />
          ))}
        </>
      )
      break
  }
  if (full) return <g className="lerret-bakke">{innhold}</g>
  return <g mask={u('bm')}>{innhold}</g>
}

// ─────────────────────────────────────────────── Trær og lys

/**
 * Et tre som står på (x, y), `h` enheter høyt: løvtre (`lov`, en krone av
 * runde klynger) eller gran (tre lag, lys venstre og skygge høyre side).
 */
export function Tre({ x, y = GRUNNLINJE, h, slag = 'lov' }: { x: number; y?: number; h: number; slag?: 'lov' | 'gran' }) {
  if (slag === 'gran') {
    const lag = [0, 1, 2].map((i) => {
      const topp = y - h + i * h * 0.24
      const b = h * (0.2 + i * 0.09)
      const bunn = topp + h * 0.42
      return (
        <g key={i}>
          <polygon points={pkt([x, topp], [x - b, bunn], [x + b, bunn])} fill={S.gran.flate} />
          <polygon points={pkt([x, topp], [x + b * 0.15, bunn], [x + b, bunn])} fill={S.gran.skygge} />
        </g>
      )
    })
    return (
      <g>
        <ellipse cx={r2(x + h * 0.12)} cy={y} rx={r2(h * 0.3)} ry={r2(h * 0.04)} fill="#000000" opacity="0.22" />
        <rect x={r2(x - h * 0.03)} y={r2(y - h * 0.16)} width={r2(h * 0.06)} height={r2(h * 0.16)} fill={S.treMork.flate} />
        {lag}
      </g>
    )
  }
  const r = h * 0.2
  const sentrum = y - h * 0.62
  const klynger: [number, number, number, string][] = [
    [-0.9, 0.35, 0.95, S.lov.flate],
    [0.9, 0.3, 0.9, S.lov.skygge],
    [0, 0.45, 1.05, S.lov.flate],
    [-0.45, -0.45, 1, S.lov.flate],
    [0.55, -0.3, 0.95, S.lov.skygge],
    [-0.6, -0.15, 0.7, S.lov.lys],
    [0, -0.95, 0.85, S.lov.lys],
  ]
  return (
    <g>
      <ellipse cx={r2(x + h * 0.14)} cy={y} rx={r2(h * 0.32)} ry={r2(h * 0.045)} fill="#000000" opacity="0.22" />
      <polygon points={pkt([x - h * 0.045, y], [x + h * 0.045, y], [x + h * 0.025, sentrum], [x - h * 0.025, sentrum])} fill={S.treMork.flate} />
      {klynger.map(([dx, dy, k, c], i) => (
        <circle key={i} cx={+(x + dx * r).toFixed(2)} cy={+(sentrum + dy * r).toFixed(2)} r={+(r * k).toFixed(2)} fill={c} />
      ))}
    </g>
  )
}

/** En lampe med varm glød rundt; (x, y) er midt på lampen, `r` gløden. */
export function Lampe({ x, y, r = 2.6 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={S.vinduLys.lys} opacity="0.32" />
      <rect x={+(x - r * 0.3).toFixed(2)} y={+(y - r * 0.55).toFixed(2)} width={+(r * 0.6).toFixed(2)} height={+(r * 1.1).toFixed(2)} rx={+(r * 0.2).toFixed(2)} fill={S.vinduLys.lys} />
    </g>
  )
}

/**
 * Et blinkende varsellys (G10): rødt på toppen av fly og master, hvitt
 * på vingespissene. Lyser gjennom natta (`nattlys`) og blinker i scenen.
 */
export function Blinklys({ x, y, r = 1, farge = S.tegl.lys, sen = false }: { x: number; y: number; r?: number; farge?: string; sen?: boolean }) {
  return (
    <g className="nattlys">
      <circle className={sen ? 'anim-blink sen' : 'anim-blink'} cx={x} cy={y} r={r} fill={farge} />
    </g>
  )
}

/**
 * Tennes dette vinduet om natta? Omtrent to av tre mørke vinduer, spredt etter
 * plassen sin, så ikke hele rader lyser likt (G10).
 */
export const tennesOmNatta = (x: number, y: number, i = 0) => (Math.round(x * 3) + Math.round(y * 7) + i * 5) % 3 !== 0

/**
 * En rad vinduer: `antall` vinduer, `b` × `h` store med `mellom` mellom,
 * fra (x, y). Hvert `tent`-te vindu (fra `start`) lyser varmt. Om natta, i
 * scenen, tennes de fleste av de andre også (`nattvindu`). Vinduet nummer
 * `tennes` (fra 0) slår lyset av og på med jevne mellomrom i scenen.
 */
export function Vindusrad({ x, y, antall, b, h, mellom, tent = 0, start = 0, karm, tennes }: { x: number; y: number; antall: number; b: number; h: number; mellom: number; tent?: number; start?: number; karm?: string; tennes?: number }) {
  const iScenen = useContext(IScenen)
  return (
    <g>
      {Array.from({ length: antall }, (_, i) => {
        const vx = +(x + i * (b + mellom)).toFixed(2)
        const lyser = tent > 0 && (i + start) % tent === 0
        return (
          <g key={i}>
            {karm && <rect x={r2(vx - 0.5)} y={r2(y - 0.5)} width={r2(b + 1)} height={r2(h + 1)} fill={karm} />}
            <rect x={vx} y={y} width={b} height={h} fill={lyser ? S.vinduLys.flate : S.glass.skygge} className={!lyser && tennesOmNatta(vx, y, i) ? 'nattvindu' : undefined} />
            {!lyser && <rect x={vx} y={y} width={r2(b * 0.45)} height={h} fill={S.glass.flate} opacity="0.5" className="nattskjul" />}
            {iScenen && !lyser && i === tennes && <rect className="anim-vindu" x={vx} y={y} width={b} height={h} fill={S.vinduLys.flate} />}
          </g>
        )
      })}
    </g>
  )
}

// ─────────────────────────────────────────────── Mennesker

/**
 * En person i riktig målestokk for avstanden, med føttene på `y`.
 * Tegnet 20 enheter høy og skalert, så alle på samme avstand er like store.
 */
export function Person({ x, y = GRUNNLINJE, avstand, klaer, hud = S.hud, har = S.treMork.skygge, ben = S.mork.flate, vendt = 1 }: { x: number; y?: number; avstand: Avstand; klaer: Materiale; hud?: Materiale; har?: string; ben?: string; vendt?: 1 | -1 }) {
  const k = maal(avstand, 'person') / 20
  return (
    <g transform={`translate(${x} ${y}) scale(${k * vendt} ${k})`}>
      <ellipse cx="0.6" cy="0" rx="3.4" ry="0.7" fill="#000000" opacity="0.25" />
      <rect x="-2" y="-9" width="1.8" height="9" rx="0.8" fill={ben} />
      <rect x="0.3" y="-9" width="1.8" height="9" rx="0.8" fill={ben} />
      <path d="M-3 -9 L-2.6 -15.6 Q0 -17 2.6 -15.6 L3 -9 Z" fill={klaer.flate} />
      <path d="M0.8 -9 L1.1 -16.4 Q2.2 -16 2.6 -15.6 L3 -9 Z" fill={klaer.skygge} />
      <rect x="-3.8" y="-15.4" width="1.3" height="6.8" rx="0.65" fill={klaer.lys} />
      <rect x="2.6" y="-15.4" width="1.3" height="6.8" rx="0.65" fill={klaer.skygge} />
      <rect x="-0.7" y="-17.4" width="1.4" height="1.4" fill={hud.skygge} />
      <circle cx="0" cy="-18.4" r="1.75" fill={hud.flate} />
      <path d="M-1.8 -18.6 Q-1.6 -20.6 0.2 -20.4 Q1.9 -20.2 1.8 -18.4 Q0.9 -19.6 -0.2 -19.2 Q-1.1 -18.8 -1.8 -18.6 Z" fill={har} />
    </g>
  )
}

// ─────────────────────────────────────────────── Folk som gjør noe

/**
 * Armene til `Folk`, fra høyre skulder: albue og hånd, i figurens egne enheter
 * (20 høy). `frem` rekker over en disk (betaler, bestiller), `skjenk` holder en
 * kanne foran brystet, `opp` har hånda ved munnen, `holde` nede foran magen og
 * `grill` ned over en grillplate.
 */
export type Armstilling = 'ned' | 'frem' | 'skjenk' | 'opp' | 'holde' | 'grill'
const ARM: Record<Armstilling, [[number, number], [number, number]]> = {
  ned: [[0.2, 2.8], [0.4, 5.6]],
  frem: [[1.7, 2.8], [4.9, 2.4]],
  skjenk: [[1.5, 2.8], [4.4, 1.6]],
  opp: [[1.9, 2.6], [-1, -2.2]],
  holde: [[0.6, 3], [2.6, 4.2]],
  grill: [[1.4, 3], [4, 3.6]],
}

/** Det hånda holder: en kopp, et bankkort, en pølse i lompe eller en grilltang. */
export type Haandting = 'kopp' | 'kort' | 'polse' | 'tang'

/** Skulderen og armen er litt mindre på et barn. */
const skulder = (barn: boolean): [number, number] => (barn ? [2.5, -12.4] : [2.9, -15])
const armskala = (barn: boolean) => (barn ? 0.8 : 1)

/** Hvor stor en figur er: `m` meter høy på avstanden, tegnet 20 enheter høy. */
export const figurskala = (m: number, avstand: Avstand = 'naer') => r2(((m / MAAL.person) * maal(avstand, 'person')) / 20)

/** Hånda til en figur som står på (x, y), i lerretets enheter — der kanna, koppen eller tangen er. */
export function haand(x: number, y: number, m: number, barn: boolean, arm: Armstilling, avstand: Avstand = 'naer'): [number, number] {
  const k = figurskala(m, avstand)
  const [sx, sy] = skulder(barn)
  const [hx, hy] = ARM[arm][1]
  return [r2(x + (sx + hx * armskala(barn)) * k), r2(y + (sy + hy * armskala(barn)) * k)]
}

/** Tingen i hånda, i figurens enheter, med hånda i (x, y). */
function Ting({ ting, x, y }: { ting: Haandting; x: number; y: number }) {
  switch (ting) {
    case 'kopp':
      return <polygon points={pkt([x - 0.45, y - 1.3], [x + 0.7, y - 1.3], [x + 0.55, y + 0.25], [x - 0.3, y + 0.25])} fill={S.hvit.lys} />
    case 'kort':
      return <rect x={r2(x + 0.2)} y={r2(y - 0.9)} width="1.5" height="1" rx="0.15" fill={S.marine.lys} />
    case 'polse':
      // Pølse i lompe, holdt på skrå: pølsa stikker opp av den lyse lompa.
      return (
        <g transform={`rotate(-35 ${r2(x)} ${r2(y)})`}>
          <rect x={r2(x - 0.3)} y={r2(y - 1.6)} width="0.7" height="2.6" rx="0.35" fill={S.tegl.lys} />
          <rect x={r2(x - 0.55)} y={r2(y - 0.7)} width="1.2" height="1.6" rx="0.3" fill={S.puss.lys} />
        </g>
      )
    case 'tang':
      // Tanga snur pølsene: i scenen vipper den litt opp og ned (`anim-vend`).
      return (
        <g className="anim-vend">
          <line x1={r2(x)} y1={r2(y)} x2={r2(x + 2.2)} y2={r2(y + 1.3)} stroke={S.metall.skygge} strokeWidth="0.35" strokeLinecap="round" />
          <line x1={r2(x)} y1={r2(y + 0.3)} x2={r2(x + 2.2)} y2={r2(y + 1.7)} stroke={S.metall.flate} strokeWidth="0.35" strokeLinecap="round" />
        </g>
      )
  }
}

/** Én arm, i figurens enheter: skulder, albue, hånd, og det hånda holder. */
export function Arm({ barn, arm, klaer, hud, ting }: { barn: boolean; arm: Armstilling; klaer: Materiale; hud: Materiale; ting?: Haandting }) {
  const [sx, sy] = skulder(barn)
  const a = armskala(barn)
  const [[ax, ay], [hx, hy]] = ARM[arm]
  const albue: [number, number] = [sx + ax * a, sy + ay * a]
  const hand: [number, number] = [sx + hx * a, sy + hy * a]
  return (
    <g>
      <path d={`M${sx} ${sy} L${r2(albue[0])} ${r2(albue[1])} L${r2(hand[0])} ${r2(hand[1])}`} fill="none" stroke={klaer.skygge} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={r2(hand[0])} cy={r2(hand[1])} r="0.6" fill={hud.flate} />
      {ting && <Ting ting={ting} x={hand[0]} y={hand[1]} />}
    </g>
  )
}

export type Folkprops = {
  x: number
  y: number
  /** Høyden i meter. */
  m: number
  klaer: Materiale
  avstand?: Avstand
  hud?: Materiale
  har?: string
  ben?: string
  shorts?: boolean
  /** Fargen på capsen. */
  caps?: string
  /** En hvit papirhatt, som i en pølsebu. */
  papirhatt?: boolean
  /** Fargen på forkleet. */
  forkle?: string
  /** Fargen på et skjerf, som på kampdag. */
  skjerf?: string
  barn?: boolean
  arm?: Armstilling | 'ingen'
  ting?: Haandting
}

/**
 * Folk som gjør noe (Saftboden, Pølseboden): bygget som `Person` (20 enheter
 * høy, skalert til `m` meter på avstanden), men med barn, caps, papirhatt,
 * shorts, forkle, skjerf og en høyre arm som kan skjenke, betale, grille eller
 * spise, med noe i hånda.
 */
export function Folk({
  x,
  y,
  m,
  klaer,
  avstand = 'naer',
  hud = S.hud,
  har = S.treMork.skygge,
  ben = S.mork.flate,
  shorts = false,
  caps,
  papirhatt = false,
  forkle,
  skjerf,
  barn = false,
  arm = 'ned',
  ting,
}: Folkprops) {
  const k = figurskala(m, avstand)
  const p = barn ? { ben: 7.4, topp: 12.8, hode: 16.1, r: 2.25 } : { ben: 9, topp: 15.6, hode: 18.4, r: 1.75 }
  const hodeskala = r2(p.r / 1.75)
  return (
    <g transform={`translate(${x} ${y}) scale(${k} ${k})`}>
      <ellipse cx="0.6" cy="0" rx="3.4" ry="0.7" fill="#000000" opacity="0.25" />
      {[-2, 0.3].map((bx) => (
        <g key={bx}>
          <rect x={bx} y={-p.ben} width="1.8" height={p.ben} rx="0.8" fill={shorts ? hud.flate : ben} />
          {shorts && <rect x={bx} y={-p.ben} width="1.8" height={r2(p.ben * 0.45)} rx="0.5" fill={ben} />}
        </g>
      ))}
      <path d={`M-3 ${-p.ben} L-2.6 ${-p.topp} Q0 ${r2(-p.topp - 1.4)} 2.6 ${-p.topp} L3 ${-p.ben} Z`} fill={klaer.flate} />
      <path d={`M0.8 ${-p.ben} L1.1 ${r2(-p.topp - 0.8)} Q2.2 ${r2(-p.topp - 0.4)} 2.6 ${-p.topp} L3 ${-p.ben} Z`} fill={klaer.skygge} />
      {/* Barnet har en stripete T-skjorte. */}
      {barn &&
        [p.topp - 2, p.topp - 3.8].map((s) => (
          <rect key={s} x="-2.8" y={r2(-s)} width="5.6" height="0.6" fill={S.hvit.lys} opacity="0.8" />
        ))}
      {forkle && <path d={`M-1.6 ${r2(-p.topp + 1.2)} H1.6 L1.9 ${r2(-p.ben + 3)} H-1.9 Z`} fill={forkle} />}
      <rect x="-3.8" y={r2(-p.topp + 0.2)} width="1.3" height={r2(p.topp - p.ben - 0.6)} rx="0.65" fill={klaer.lys} />
      {arm !== 'ingen' && <Arm barn={barn} arm={arm} klaer={klaer} hud={hud} ting={ting} />}
      <rect x="-0.7" y={r2(-p.hode + p.r - 0.75)} width="1.4" height="1.4" fill={hud.skygge} />
      {skjerf && (
        <g>
          <rect x="-1.9" y={r2(-p.topp - 0.9)} width="3.8" height="1.2" rx="0.5" fill={skjerf} />
          <rect x="0.6" y={r2(-p.topp + 0.2)} width="1" height="3.2" fill={skjerf} />
          <rect x="0.6" y={r2(-p.topp + 1.4)} width="1" height="0.6" fill={S.hvit.lys} />
        </g>
      )}
      <g transform={`translate(0 ${-p.hode}) scale(${hodeskala})`}>
        <circle cx="0" cy="0" r="1.75" fill={hud.flate} />
        {barn && <ellipse cx="-2" cy="0.3" rx="0.7" ry="1.2" fill={har} />}
        {caps ? (
          <>
            <path d="M-1.9 -0.2 Q-1.8 -2.3 0.1 -2.2 Q1.9 -2.1 1.9 -0.4 Z" fill={caps} />
            <path d="M1.1 -0.6 L3.3 -0.3 L3.2 0.1 L1.1 0 Z" fill={caps} />
          </>
        ) : (
          <path d="M-1.8 -0.2 Q-1.6 -2.2 0.2 -2 Q1.9 -1.8 1.8 0 Q0.9 -1.2 -0.2 -0.8 Q-1.1 -0.4 -1.8 -0.2 Z" fill={har} />
        )}
        {papirhatt && (
          <>
            <path d="M-2 -0.9 L-1.5 -3.2 L1.6 -3.2 L2.1 -0.9 Z" fill={S.hvit.lys} />
            <rect x="-2" y="-1.4" width="4.1" height="0.5" fill={S.hvit.skygge} />
          </>
        )}
      </g>
    </g>
  )
}

/**
 * Noen som spiser eller drikker: to bilder av armen, tingen ved munnen og
 * tingen nede, som veksler i scenen (`anim-sipp`, `anim-sipp-ned`). I ro, og
 * i lista, er tingen ved munnen.
 */
export function Spiser(p: Folkprops & { ting: Haandting }) {
  const k = figurskala(p.m, p.avstand)
  const hud = p.hud ?? S.hud
  return (
    <g>
      <Folk {...p} arm="ingen" />
      <g className="anim-sipp-ned" opacity="0">
        <g transform={`translate(${p.x} ${p.y}) scale(${k} ${k})`}>
          <Arm barn={!!p.barn} arm="holde" klaer={p.klaer} hud={hud} ting={p.ting} />
        </g>
      </g>
      <g className="anim-sipp">
        <g transform={`translate(${p.x} ${p.y}) scale(${k} ${k})`}>
          <Arm barn={!!p.barn} arm="opp" klaer={p.klaer} hud={hud} ting={p.ting} />
        </g>
      </g>
    </g>
  )
}

/**
 * Gullplaketten ved nivå 100 i den nye stilen: en mørk plate med gullramme
 * og en stjerne, 12 × 8.6 enheter, med øvre venstre hjørne i (x, y).
 */
export function Plakett({ x, y }: { x: number; y: number }) {
  const cx = x + 6
  const cy = y + 4.3
  const stjerne = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 1.25 : 2.9
    const v = (i / 10) * Math.PI * 2
    return `${+(cx + Math.sin(v) * r).toFixed(2)},${+(cy - Math.cos(v) * r).toFixed(2)}`
  }).join(' ')
  return (
    <g>
      <rect x={x + 0.6} y={y + 0.8} width="12" height="8.6" rx="1.4" fill="#000000" opacity="0.25" />
      <rect x={x} y={y} width="12" height="8.6" rx="1.4" fill={S.mork.skygge} stroke={S.gull.flate} strokeWidth="1" />
      <polygon points={stjerne} fill={S.gull.lys} />
    </g>
  )
}
