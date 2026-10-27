using Microsoft.EntityFrameworkCore;
using OroTrack.Api.Dtos;
using OroTrack.Domain;
using OroTrack.Infrastructure;

namespace OroTrack.Api.Services;

public class VentaService(AppDbContext db) : IVentaService
{
    public async Task<VentaDto> CrearVentaAsync(VentaCreateDto dto, string usuarioId)
    {
        if (dto.Gramos <= 0)
            throw new InvalidOperationException("Los gramos deben ser mayores a cero.");

        if (dto.PrecioGramo <= 0)
            throw new InvalidOperationException("El precio por gramo debe ser mayor a cero.");

        if (dto.TipoPago == TipoPago.Contado && dto.Metodo is null)
            throw new InvalidOperationException("Selecciona el método de pago.");

        var cliente = await db.Clientes.FindAsync(dto.ClienteId)
            ?? throw new KeyNotFoundException("Cliente no encontrado.");

        var contenedor = await db.Contenedores.FindAsync(dto.ContenedorId)
            ?? throw new KeyNotFoundException("Contenedor no encontrado.");

        if (!contenedor.Activo)
            throw new InvalidOperationException("El contenedor no está activo.");

        if (contenedor.PesoDisponibleGramos < dto.Gramos)
            throw new InvalidOperationException(
                $"Disponible insuficiente: quedan {contenedor.PesoDisponibleGramos:0.###} g en ese contenedor.");

        var subtotal = dto.Gramos * dto.PrecioGramo;

        var venta = new Venta
        {
            ClienteId = dto.ClienteId,
            UsuarioId = usuarioId,
            TipoPago = dto.TipoPago,
            Estado = dto.TipoPago == TipoPago.Contado ? EstadoVenta.Pagada : EstadoVenta.Pendiente,
            TotalGramos = dto.Gramos,
            TotalMonto = subtotal,
            Detalles =
            [
                new VentaDetalle
                {
                    ContenedorId = contenedor.Id,
                    Gramos = dto.Gramos,
                    PrecioGramo = dto.PrecioGramo,
                    Subtotal = subtotal,
                    CostoGramo = contenedor.CostoPorGramo
                }
            ]
        };

        contenedor.PesoDisponibleGramos -= dto.Gramos;

        if (dto.TipoPago == TipoPago.Contado)
        {
            venta.Pagos.Add(new Pago
            {
                UsuarioId = usuarioId,
                Monto = subtotal,
                Metodo = dto.Metodo!.Value,
                Nota = "Pago al momento de la venta"
            });
        }

        db.Ventas.Add(venta);
        await db.SaveChangesAsync();

        return await MapAsync(venta.Id);
    }

    public async Task<VentaDto> RegistrarPagoAsync(int ventaId, PagoCreateDto dto, string usuarioId)
    {
        if (dto.Monto <= 0)
            throw new InvalidOperationException("El monto del abono debe ser mayor a cero.");

        var venta = await db.Ventas.Include(v => v.Pagos).FirstOrDefaultAsync(v => v.Id == ventaId)
            ?? throw new KeyNotFoundException("Venta no encontrada.");

        var pagado = venta.Pagos.Sum(p => p.Monto);
        var saldo = venta.TotalMonto - pagado;

        if (dto.Monto > saldo)
            throw new InvalidOperationException($"El abono ({dto.Monto:0.00}) supera el saldo pendiente ({saldo:0.00}).");

        venta.Pagos.Add(new Pago
        {
            VentaId = ventaId,
            UsuarioId = usuarioId,
            Monto = dto.Monto,
            Metodo = dto.Metodo,
            Nota = dto.Nota
        });

        var nuevoSaldo = saldo - dto.Monto;
        venta.Estado = nuevoSaldo <= 0 ? EstadoVenta.Pagada : EstadoVenta.Parcial;

        await db.SaveChangesAsync();
        return await MapAsync(ventaId);
    }

    public async Task<List<DeudorDto>> ObtenerDeudoresAsync()
    {
        var ventasFiadas = await db.Ventas
            .Include(v => v.Cliente)
            .Include(v => v.Pagos)
            .Where(v => v.TipoPago == TipoPago.Fiado && v.Estado != EstadoVenta.Pagada)
            .ToListAsync();

        var hoy = DateTime.UtcNow;

        return ventasFiadas
            .GroupBy(v => v.Cliente)
            .Select(g =>
            {
                var saldo = g.Sum(v => v.TotalMonto - v.Pagos.Sum(p => p.Monto));
                var ultima = g.Max(v => v.Fecha);
                return new DeudorDto(g.Key.Id, g.Key.Nombre, saldo, ultima, (int)(hoy - ultima).TotalDays);
            })
            .Where(d => d.SaldoPendiente > 0)
            .OrderByDescending(d => d.DiasVencido)
            .ToList();
    }

    private async Task<VentaDto> MapAsync(int ventaId)
    {
        var v = await db.Ventas
            .Include(x => x.Cliente)
            .Include(x => x.Pagos)
            .Include(x => x.Detalles).ThenInclude(d => d.Contenedor).ThenInclude(c => c.TipoOro)
            .FirstAsync(x => x.Id == ventaId);

        var vendedor = await db.Users.FindAsync(v.UsuarioId);
        var saldo = v.TotalMonto - v.Pagos.Sum(p => p.Monto);

        return new VentaDto(
            v.Id, v.ClienteId, v.Cliente.Nombre,
            vendedor?.NombreCompleto ?? "-", v.Fecha, v.TipoPago, v.Estado,
            v.TotalGramos, v.TotalMonto, saldo,
            v.Detalles.Select(d => new VentaDetalleResumenDto(
                d.Contenedor.TipoOro.Nombre, d.Contenedor.TipoOro.Emoji, d.Contenedor.Calidad, d.Gramos
            )).ToList());
    }
}
