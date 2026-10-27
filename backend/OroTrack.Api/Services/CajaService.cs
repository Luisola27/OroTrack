using Microsoft.EntityFrameworkCore;
using OroTrack.Api.Dtos;
using OroTrack.Domain;
using OroTrack.Infrastructure;

namespace OroTrack.Api.Services;

/// <summary>
/// Calcula el dinero que debería tener cada usuario en su caja.
/// Entra: cobros de ventas y abonos, y aportes. Sale: material comprado con plata de ventas,
/// retiros y gastos. El material comprado con capital aparte se reporta pero no toca la caja.
/// </summary>
public class CajaService(AppDbContext db)
{
    public async Task<CajaResumenDto> ResumenAsync(string usuarioId, DateTime desde, DateTime hasta)
    {
        var ventas = await db.Ventas
            .Include(v => v.Detalles)
            .Where(v => v.UsuarioId == usuarioId && v.Fecha >= desde && v.Fecha <= hasta)
            .ToListAsync();

        var pagos = await db.Pagos
            .Where(p => p.UsuarioId == usuarioId && p.Fecha >= desde && p.Fecha <= hasta)
            .ToListAsync();

        var compras = await db.MovimientosContenedor
            .Where(m => m.Tipo == TipoMovimientoContenedor.Reabastecimiento
                && m.Fecha >= desde && m.Fecha <= hasta
                && ((m.Fuente == FuenteDinero.Caja && m.ResponsableCajaId == usuarioId)
                    || (m.Fuente == FuenteDinero.Capital && m.UsuarioId == usuarioId)))
            .ToListAsync();

        var movimientosCaja = await db.MovimientosCaja
            .Where(m => m.ResponsableUsuarioId == usuarioId && m.Fecha >= desde && m.Fecha <= hasta)
            .ToListAsync();

        var comprasCaja = compras.Where(c => c.Fuente == FuenteDinero.Caja).ToList();

        var porMetodo = Enum.GetValues<MetodoPago>().Select(metodo =>
        {
            var cobrado = pagos.Where(p => p.Metodo == metodo).Sum(p => p.Monto);
            var gastoCompras = comprasCaja.Where(c => c.Metodo == metodo).Sum(CostoDe);
            var entradas = movimientosCaja
                .Where(m => m.Metodo == metodo && m.Tipo == TipoMovimientoCaja.Aporte).Sum(m => m.Monto);
            var salidas = movimientosCaja
                .Where(m => m.Metodo == metodo && m.Tipo != TipoMovimientoCaja.Aporte).Sum(m => m.Monto);
            return new MetodoResumenDto(metodo, cobrado, gastoCompras, entradas, salidas,
                cobrado - gastoCompras + entradas - salidas);
        }).ToList();

        var totalVendido = ventas.Sum(v => v.TotalMonto);
        var costoVendido = Math.Round(ventas.SelectMany(v => v.Detalles).Sum(d => d.Gramos * d.CostoGramo), 2);

        return new CajaResumenDto(
            totalVendido,
            ventas.Sum(v => v.TotalGramos),
            ventas.Where(v => v.TipoPago == TipoPago.Fiado).Sum(v => v.TotalMonto),
            pagos.Sum(p => p.Monto),
            costoVendido,
            totalVendido - costoVendido,
            comprasCaja.Sum(CostoDe),
            compras.Where(c => c.Fuente == FuenteDinero.Capital).Sum(CostoDe),
            porMetodo,
            porMetodo.First(m => m.Metodo == MetodoPago.Efectivo).Neto
        );
    }

    public async Task<DateTime?> UltimoCierreAsync(string usuarioId) =>
        await db.Cierres
            .Where(c => c.UsuarioId == usuarioId)
            .OrderByDescending(c => c.Hasta)
            .Select(c => (DateTime?)c.Hasta)
            .FirstOrDefaultAsync();

    /// <summary>Lo que el usuario tiene pendiente de cerrar: desde su último cierre hasta ahora.</summary>
    public async Task<CajaEstadoDto> EstadoAsync(string usuarioId, string nombre, string? rol)
    {
        var ultimo = await UltimoCierreAsync(usuarioId);
        var desde = ultimo?.AddTicks(1) ?? DateTime.MinValue;
        var resumen = await ResumenAsync(usuarioId, desde, DateTime.UtcNow);
        return new CajaEstadoDto(usuarioId, nombre, rol, ultimo, resumen);
    }

    public async Task<List<CajaMovimientoDto>> MovimientosAsync(string? usuarioId, DateTime desde, DateTime hasta)
    {
        var pagos = await db.Pagos
            .Include(p => p.Venta).ThenInclude(v => v.Cliente)
            .Where(p => (usuarioId == null || p.UsuarioId == usuarioId) && p.Fecha >= desde && p.Fecha <= hasta)
            .ToListAsync();

        var compras = await db.MovimientosContenedor
            .Include(m => m.Contenedor).ThenInclude(c => c.TipoOro)
            .Where(m => m.Tipo == TipoMovimientoContenedor.Reabastecimiento && m.Fecha >= desde && m.Fecha <= hasta
                && (usuarioId == null || m.ResponsableCajaId == usuarioId
                    || (m.Fuente == FuenteDinero.Capital && m.UsuarioId == usuarioId)))
            .ToListAsync();

        var otros = await db.MovimientosCaja
            .Where(m => (usuarioId == null || m.ResponsableUsuarioId == usuarioId) && m.Fecha >= desde && m.Fecha <= hasta)
            .ToListAsync();

        var ids = pagos.Select(p => p.UsuarioId)
            .Concat(compras.Select(c => c.ResponsableCajaId ?? c.UsuarioId))
            .Concat(otros.Select(o => o.ResponsableUsuarioId))
            .Distinct().ToList();
        var nombres = await db.Users.Where(u => ids.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.NombreCompleto);
        string Nombre(string? id) => id is null ? "-" : nombres.GetValueOrDefault(id, "-");

        var lista = new List<CajaMovimientoDto>();

        lista.AddRange(pagos.Select(p => new CajaMovimientoDto(
            p.Fecha,
            p.Venta.TipoPago == TipoPago.Contado ? "Venta" : "Abono",
            $"{p.Venta.Cliente.Nombre} · venta #{p.VentaId}",
            p.Metodo, p.Monto, true, Nombre(p.UsuarioId), p.Nota)));

        lista.AddRange(compras.Select(c => new CajaMovimientoDto(
            c.Fecha,
            "Compra de material",
            $"{c.Contenedor.TipoOro.Nombre}{(c.Contenedor.Calidad is null ? "" : $" ({c.Contenedor.Calidad})")} · {c.Gramos:0.###} g",
            c.Metodo, -CostoDe(c), c.Fuente == FuenteDinero.Caja,
            c.Fuente == FuenteDinero.Caja ? Nombre(c.ResponsableCajaId) : "Capital aparte", c.Nota)));

        lista.AddRange(otros.Select(o => new CajaMovimientoDto(
            o.Fecha, o.Tipo.ToString(), o.Tipo switch
            {
                TipoMovimientoCaja.Aporte => "Entrada de dinero",
                TipoMovimientoCaja.Retiro => "Retiro de dinero",
                _ => "Gasto",
            },
            o.Metodo, o.Tipo == TipoMovimientoCaja.Aporte ? o.Monto : -o.Monto, true,
            Nombre(o.ResponsableUsuarioId), o.Nota)));

        return lista.OrderByDescending(m => m.Fecha).ToList();
    }

    /// <summary>Compras viejas no guardaban el total; se reconstruye con gramos × costo por gramo.</summary>
    private static decimal CostoDe(MovimientoContenedor m) =>
        m.CostoTotal ?? Math.Round(m.Gramos * (m.CostoPorGramo ?? 0), 2);
}
