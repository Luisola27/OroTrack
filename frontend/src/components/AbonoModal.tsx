import { useState } from 'react'
import { api } from '../api/client'
import type { MetodoPago, Venta } from '../api/types'
import { METODOS_PAGO } from '../api/types'
import { formatColones, mensajeError } from '../lib/format'
import { montoALetras } from '../lib/numeroALetras'
import { IconDropdown, type IconOption } from './IconDropdown'
import { ErrorBox, Field, Modal, MoneyInput, Notice } from './ui'

/** Registra un abono a una venta fiada. El dinero entra a la caja de quien lo recibe.
 * Montarlo con `key={venta.id}` para que cada venta empiece con el formulario limpio. */
export default function AbonoModal({ venta, onClose, onGuardado }: { venta: Venta | null; onClose: () => void; onGuardado: () => void }) {
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState<MetodoPago | ''>('')
  const [nota, setNota] = useState('')
  const [errores, setErrores] = useState<{ monto?: string; metodo?: string }>({})
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (!venta) return null
  const montoNum = Number(monto) || 0

  async function guardar() {
    if (!venta) return
    const e: typeof errores = {}
    if (montoNum <= 0) e.monto = 'Ingresa cuánto abonó.'
    else if (montoNum > venta.saldoPendiente) e.monto = `No puede ser mayor al saldo (${formatColones(venta.saldoPendiente)}).`
    if (!metodo) e.metodo = 'Selecciona cómo pagó.'
    setErrores(e)
    if (Object.keys(e).length > 0) return

    setEnviando(true)
    setError(null)
    try {
      await api.post(`/ventas/${venta.id}/pagos`, { monto: montoNum, metodo, nota: nota || null })
      onGuardado()
      onClose()
    } catch (err) {
      setError(mensajeError(err, 'No se pudo registrar el abono.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Registrar abono" subtitle={`${venta.clienteNombre} · venta #${venta.id}`}>
      <div className="mb-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)' }}>
          <div className="text-xs text-[var(--text-muted)]">Total de la venta</div>
          <div className="num mt-0.5 font-semibold">{formatColones(venta.totalMonto)}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: 'var(--danger-soft)' }}>
          <div className="text-xs text-[var(--text-muted)]">Saldo pendiente</div>
          <div className="num mt-0.5 font-semibold text-[var(--danger)]">{formatColones(venta.saldoPendiente)}</div>
        </div>
      </div>

      <Field label="Monto del abono" required error={errores.monto} hint={montoNum > 0 ? montoALetras(montoNum) : undefined}>
        <MoneyInput value={monto} onChange={(v) => { setMonto(v); setErrores((p) => ({ ...p, monto: undefined })) }} invalid={!!errores.monto} autoFocus large />
        <button type="button" className="link mt-2 text-xs" onClick={() => setMonto(String(venta.saldoPendiente))}>
          Paga todo el saldo
        </button>
      </Field>

      <Field label="¿Cómo pagó?" required error={errores.metodo}>
        <IconDropdown
          value={metodo}
          onChange={(v) => { setMetodo(v); setErrores((p) => ({ ...p, metodo: undefined })) }}
          placeholder="Selecciona…"
          error={!!errores.metodo}
          options={METODOS_PAGO.map((m): IconOption<MetodoPago> => ({ value: m.value, label: m.label }))}
        />
      </Field>

      <Field label="Nota (opcional)">
        <input value={nota} onChange={(e) => setNota(e.target.value)} className="input" />
      </Field>

      <div className="mb-4">
        <Notice>El abono entra a tu caja y se cuenta en tu próximo cierre.</Notice>
      </div>

      <ErrorBox>{error}</ErrorBox>
      <button onClick={guardar} disabled={enviando} className="btn btn-primary btn-lg w-full">
        {enviando ? 'Guardando…' : 'Registrar abono'}
      </button>
    </Modal>
  )
}
