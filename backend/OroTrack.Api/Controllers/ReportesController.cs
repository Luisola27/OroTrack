using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OroTrack.Infrastructure;
using OroTrack.Infrastructure.Identity;

namespace OroTrack.Api.Controllers;

[ApiController]
[Route("api/reportes")]
[Authorize]
public class ReportesController(AppDbContext db) : ControllerBase
{
    [HttpGet("resumen")]
    public async Task<ActionResult> Resumen([FromQuery] DateTime? desde, [FromQuery] DateTime? hasta)
    {
        var query = db.Ventas.AsQueryable();
        if (desde is not null) query = query.Where(v => v.Fecha >= desde);
        if (hasta is not null) query = query.Where(v => v.Fecha <= hasta);

        var ventas = await query.ToListAsync();
        var ventaIds = ventas.Select(v => v.Id).ToList();

        var detalles = await db.VentaDetalles
            .Include(d => d.Contenedor).ThenInclude(c => c.TipoOro)
            .Where(d => ventaIds.Contains(d.VentaId))
            .ToListAsync();

        var porTipo = detalles
            .GroupBy(d => new { d.Contenedor.TipoOro.Nombre, d.Contenedor.TipoOro.Emoji, d.Contenedor.Calidad })
            .Select(g => new
            {
                g.Key.Nombre,
                g.Key.Emoji,
                g.Key.Calidad,
                Gramos = g.Sum(d => d.Gramos),
                Monto = g.Sum(d => d.Subtotal)
            })
            .OrderByDescending(g => g.Monto)
            .ToList();

        var pagos = db.Pagos.AsQueryable();
        if (desde is not null) pagos = pagos.Where(p => p.Fecha >= desde);
        if (hasta is not null) pagos = pagos.Where(p => p.Fecha <= hasta);
        var totalCobrado = await pagos.SumAsync(p => (decimal?)p.Monto) ?? 0;

        // Costo y ganancia solo para el Admin.
        decimal? costo = User.IsInRole(Roles.Admin) ? Math.Round(detalles.Sum(d => d.Gramos * d.CostoGramo), 2) : null;

        return Ok(new
        {
            TotalVentas = ventas.Count,
            TotalGramosVendidos = ventas.Sum(v => v.TotalGramos),
            TotalMontoVendido = ventas.Sum(v => v.TotalMonto),
            TotalFiado = ventas.Where(v => v.TipoPago == Domain.TipoPago.Fiado).Sum(v => v.TotalMonto),
            TotalCobrado = totalCobrado,
            CostoVendido = costo,
            Ganancia = costo is null ? (decimal?)null : ventas.Sum(v => v.TotalMonto) - costo,
            PorTipo = porTipo
        });
    }

    [HttpGet("margen-por-contenedor")]
    public async Task<ActionResult> MargenPorContenedor()
    {
        var detalles = await db.VentaDetalles.Include(d => d.Contenedor).ThenInclude(c => c.TipoOro).ToListAsync();

        var resultado = detalles
            .GroupBy(d => new { d.Contenedor.Id, TipoOro = d.Contenedor.TipoOro.Nombre, d.Contenedor.Calidad })
            .Select(g => new
            {
                g.Key.Id,
                g.Key.TipoOro,
                g.Key.Calidad,
                GramosVendidos = g.Sum(d => d.Gramos),
                MontoVendido = g.Sum(d => d.Subtotal)
            });

        return Ok(resultado);
    }
}
