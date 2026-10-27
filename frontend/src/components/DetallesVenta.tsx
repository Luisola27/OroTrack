import type { VentaDetalleResumen } from '../api/types'
import { formatGramos } from '../lib/format'
import { EmojiGlyph } from './EmojiGlyph'

/** Muestra qué tipo(s) de oro se vendieron, en vez de un solo total de gramos mezclado. */
export function DetallesVenta({ detalles }: { detalles: VentaDetalleResumen[] }) {
  if (detalles.length === 0) return null
  return (
    <span className="text-[0.8rem] text-[var(--text-muted)]">
      {detalles.map((d, i) => (
        <span key={i}>
          {i > 0 && ' · '}
          <EmojiGlyph value={d.tipoOroEmoji} /> {d.tipoOroNombre}
          {d.calidad ? ` (${d.calidad})` : ''} · <span className="num">{formatGramos(d.gramos)}</span>
        </span>
      ))}
    </span>
  )
}
