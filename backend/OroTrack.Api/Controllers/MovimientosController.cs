using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OroTrack.Api.Dtos;
using OroTrack.Domain;
using OroTrack.Infrastructure;

namespace OroTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MovimientosController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<MovimientoDto>>> GetAll([FromQuery] DateTime? desde, [FromQuery] DateTime? hasta)
    {
        var ventaDetalles = await db.VentaDetalles
            .Include(d => d.Venta).ThenInclude(v => v.Cliente)
            .Include(d => d.Contenedor).ThenInclude(c => c.TipoOro)
            .Where(d => (!desde.HasValue || d.Venta.Fecha >= desde) && (!hasta.HasValue || d.Venta.Fecha <= hasta))
            .ToListAsync();

        var movimientos = await db.MovimientosContenedor
            .Include(m => m.Contenedor).ThenInclude(c => c.TipoOro)
            .Where(m => (!desde.HasValue || m.Fecha >= desde) && (!hasta.HasValue || m.Fecha <= hasta))
            .ToListAsync();

        var ventaIds = ventaDetalles.Select(d => d.VentaId).Distinct().ToList();
        var metodoPorVenta = await db.Pagos
            .Where(p => ventaIds.Contains(p.VentaId))
            .GroupBy(p => p.VentaId)
            .Select(g => new { VentaId = g.Key, Metodo = g.OrderBy(p => p.Fecha).First().Metodo })
            .ToDictionaryAsync(x => x.VentaId, x => (MetodoPago?)x.Metodo);

        var usuarioIds = ventaDetalles.Select(d => d.Venta.UsuarioId)
            .Concat(movimientos.Select(m => m.UsuarioId))
            .Distinct()
            .ToList();
        var usuarios = await db.Users.Where(u => usuarioIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.NombreCompleto);

        var deVentas = ventaDetalles.Select(d => new MovimientoDto(
            d.Venta.Fecha,
            "Venta",
            d.ContenedorId,
            d.Contenedor.TipoOro.Nombre,
            d.Contenedor.TipoOro.Emoji,
            d.Contenedor.Calidad,
            -d.Gramos,
            usuarios.GetValueOrDefault(d.Venta.UsuarioId, "-"),
            d.Venta.Cliente.Nombre,
            metodoPorVenta.GetValueOrDefault(d.VentaId),
            null
        ));

        var deMovimientos = movimientos.Select(m => new MovimientoDto(
            m.Fecha,
            m.Tipo.ToString(),
            m.ContenedorId,
            m.Contenedor.TipoOro.Nombre,
            m.Contenedor.TipoOro.Emoji,
            m.Contenedor.Calidad,
            m.Gramos,
            usuarios.GetValueOrDefault(m.UsuarioId, "-"),
            null,
            m.Metodo,
            m.Nota
        ));

        var resultado = deVentas.Concat(deMovimientos)
            .OrderByDescending(m => m.Fecha)
            .ToList();

        return resultado;
    }

    [HttpGet("inventario-por-tipo")]
    public async Task<ActionResult<List<InventarioPorTipoDto>>> InventarioPorTipo()
    {
        var contenedores = await db.Contenedores.Include(c => c.TipoOro).Where(c => c.Activo).ToListAsync();
        var ventasPorContenedor = await db.VentaDetalles
            .GroupBy(d => d.ContenedorId)
            .Select(g => new { ContenedorId = g.Key, Gramos = g.Sum(d => d.Gramos) })
            .ToDictionaryAsync(x => x.ContenedorId, x => x.Gramos);

        var resultado = contenedores
            .GroupBy(c => new { c.TipoOro.Nombre, c.TipoOro.Emoji, c.TipoOro.QuilateReferencia })
            .Select(g => new InventarioPorTipoDto(
                g.Key.Nombre,
                g.Key.Emoji,
                g.Key.QuilateReferencia,
                g.Sum(c => c.PesoDisponibleGramos),
                g.Sum(c => c.PesoTotalGramos),
                g.Sum(c => ventasPorContenedor.GetValueOrDefault(c.Id, 0)),
                g.Count()
            ))
            .OrderBy(x => x.QuilateReferencia == null)
            .ThenBy(x => x.QuilateReferencia)
            .ThenBy(x => x.TipoOroNombre)
            .ToList();

        return resultado;
    }
}
