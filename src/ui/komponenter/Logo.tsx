/**
 * Logoen: en gullmynt med en M der høyre topp står høyere enn venstre — en
 * formue som vokser — og et glimt i kanten. Samme former som app-ikonet
 * (public/ikon.svg og scripts/lag-ikoner.mjs); endres de, endres alle tre.
 */

export function LogoMerke({ størrelse = 48 }: { størrelse?: number }) {
  return (
    <svg width={størrelse} height={størrelse} viewBox="64 64 384 384" aria-hidden="true">
      <circle cx="256" cy="256" r="184" fill="#f0d27a" />
      <circle cx="264" cy="266" r="171" fill="#d4af37" />
      <circle cx="256" cy="256" r="148" fill="none" stroke="#9c7c1c" strokeWidth="10" />
      <polyline points="178,336 178,236 254,300 334,178 334,336" fill="none" stroke="#1a1508" strokeWidth="42" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="382,104 390,132 418,140 390,148 382,176 374,148 346,140 374,132" fill="#fff4c8" />
    </svg>
  )
}

/** Merket med navnet ved siden av. Navnet er vanlig tekst, så skjermlesere leser det. */
export function Logo({ størrelse = 40, undertekst }: { størrelse?: number; undertekst?: string }) {
  return (
    <div className="logo">
      <LogoMerke størrelse={størrelse} />
      <div className="logo-tekst">
        <span className="logo-navn">Milliardær</span>
        {undertekst && <span className="logo-under">{undertekst}</span>}
      </div>
    </div>
  )
}
