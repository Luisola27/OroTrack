const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
const ESPECIALES = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve']
const DECENAS = ['veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

function grupoALetras(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'cien'

  const centena = Math.floor(n / 100)
  const resto = n % 100
  let texto = centena > 0 ? CENTENAS[centena] : ''

  if (resto > 0) {
    if (texto) texto += ' '
    if (resto < 10) texto += UNIDADES[resto]
    else if (resto < 20) texto += ESPECIALES[resto - 10]
    else {
      const decena = Math.floor(resto / 10)
      const unidad = resto % 10
      if (decena === 2) texto += unidad === 0 ? 'veinte' : `veinti${UNIDADES[unidad]}`
      else {
        texto += DECENAS[decena - 2]
        if (unidad > 0) texto += ` y ${UNIDADES[unidad]}`
      }
    }
  }
  return texto
}

function enteroALetras(n: number): string {
  if (n === 0) return 'cero'

  const millones = Math.floor(n / 1_000_000)
  const miles = Math.floor((n % 1_000_000) / 1000)
  const resto = n % 1000

  const partes: string[] = []
  if (millones > 0) partes.push(millones === 1 ? 'un millón' : `${grupoALetras(millones)} millones`)
  if (miles > 0) partes.push(miles === 1 ? 'mil' : `${grupoALetras(miles)} mil`)
  if (resto > 0) partes.push(grupoALetras(resto))

  return partes.join(' ')
}

/** Convierte un monto a su forma escrita en español, ej. 20000 -> "Veinte mil colones", 200.5 -> "Doscientos colones con cincuenta céntimos" */
export function montoALetras(valor: number): string {
  const negativo = valor < 0
  const absoluto = Math.abs(valor)
  const entero = Math.floor(absoluto)
  const centavos = Math.round((absoluto - entero) * 100)

  let texto = enteroALetras(entero)
  texto = texto.charAt(0).toUpperCase() + texto.slice(1)
  texto += entero === 1 ? ' colón' : ' colones'

  if (centavos > 0) {
    texto += ` con ${grupoALetras(centavos)} ${centavos === 1 ? 'céntimo' : 'céntimos'}`
  }

  return negativo ? `Menos ${texto.toLowerCase()}` : texto
}
