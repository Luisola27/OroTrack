import type { Contenedor, TipoOro } from '../api/types'

/** Menor quilate primero; los sin quilate de referencia (ej. Oro Líquido) van al final. */
export function ordenarPorTipoOro<T extends { tipoOro: TipoOro }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const qa = a.tipoOro.quilateReferencia ?? Infinity
    const qb = b.tipoOro.quilateReferencia ?? Infinity
    return qa - qb || a.tipoOro.nombre.localeCompare(b.tipoOro.nombre)
  })
}

export function ordenarTiposOro(tipos: TipoOro[]): TipoOro[] {
  return [...tipos].sort((a, b) => {
    const qa = a.quilateReferencia ?? Infinity
    const qb = b.quilateReferencia ?? Infinity
    return qa - qb || a.nombre.localeCompare(b.nombre)
  })
}

/** Ordena contenedores por su tipo de oro. */
export function ordenarPorQuilate(contenedores: Contenedor[]): Contenedor[] {
  return ordenarPorTipoOro(contenedores)
}
