import type { TipoOro } from '../api/types'
import { EmojiGlyph } from './EmojiGlyph'

/** Ícono + nombre del tipo de oro, para usar fuera de un <select> (tarjetas, listas). */
export function QuilateBadge({ tipoOro }: { tipoOro: TipoOro }) {
  return (
    <>
      <EmojiGlyph value={tipoOro.emoji} /> {tipoOro.nombre}
    </>
  )
}
