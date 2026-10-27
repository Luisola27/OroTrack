function BanderaMexico() {
  return (
    <svg viewBox="0 0 3 2" width="1.3em" height="0.87em" className="inline-block align-[-0.15em]" aria-label="Bandera de México">
      <rect width="1" height="2" fill="#006341" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#ce1126" />
      <circle cx="1.5" cy="1" r="0.32" fill="#c9a04c" stroke="#3a2f14" strokeWidth="0.03" />
    </svg>
  )
}

function BanderaColombia() {
  return (
    <svg viewBox="0 0 3 2" width="1.3em" height="0.87em" className="inline-block align-[-0.15em]" aria-label="Bandera de Colombia">
      <rect width="3" height="1" fill="#fcd116" />
      <rect y="1" width="3" height="0.5" fill="#003893" />
      <rect y="1.5" width="3" height="0.5" fill="#ce1126" />
    </svg>
  )
}

const BANDERAS: Record<string, () => React.ReactElement> = {
  '🇲🇽': BanderaMexico,
  '🇨🇴': BanderaColombia,
}

/** Muestra el emoji tal cual, salvo para banderas: esas se dibujan como SVG
 * porque Windows no las renderiza como imagen (solo como texto "MX"/"CO"). */
export function EmojiGlyph({ value }: { value: string }) {
  const Bandera = BANDERAS[value]
  return Bandera ? <Bandera /> : <>{value}</>
}
