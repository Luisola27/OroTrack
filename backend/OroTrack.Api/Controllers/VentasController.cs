using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OroTrack.Api.Dtos;
using OroTrack.Api.Services;
using OroTrack.Domain;
using OroTrack.Infrastructure;
using System.Security.Claims;

namespace OroTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VentasController(AppDbContext db, IVentaService ventaService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<VentaDto>>> GetAll(
        [FromQuery] DateTime? desde, [FromQuery] DateTime? hasta, [FromQuery] bool? soloFiado,
        [FromQuery] int? clienteId, [FromQuery] bool? conSaldo)
    {
        var query = db.Ventas
            .Include(v => v.Cliente)
            .Include(v => v.Pagos)
            .Include(v => v.Detalles).ThenInclude(d => d.Contenedor).ThenInclude(c => c.TipoOro)
            .AsQueryable();

        if (desde is not null) query = query.Where(v => v.Fecha >= desde);
        if (hasta is not null) query = query.Where(v => v.Fecha <= hasta);
        if (soloFiado == true) query = query.Where(v => v.TipoPago == TipoPago.Fiado);
        if (clienteId is not null) query = query.Where(v => v.ClienteId == clienteId);
        if (conSaldo == true) query = query.Where(v => v.Estado != EstadoVenta.Pagada);

        var ventas = await query.OrderByDescending(v => v.Fecha).ToListAsync();
        var vendedorIds = ventas.Select(v => v.UsuarioId).Distinct().ToList();
        var vendedores = await db.Users.Where(u => vendedorIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.NombreCompleto);

        return ventas.Select(v => new VentaDto(
            v.Id, v.ClienteId, v.Cliente.Nombre,
            vendedores.GetValueOrDefault(v.UsuarioId, "-"),
            v.Fecha, v.TipoPago, v.Estado, v.TotalGramos, v.TotalMonto,
            v.TotalMonto - v.Pagos.Sum(p => p.Monto),
            v.Detalles.Select(d => new VentaDetalleResumenDto(
                d.Contenedor.TipoOro.Nombre, d.Contenedor.TipoOro.Emoji, d.Contenedor.Calidad, d.Gramos
            )).ToList()
        )).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<VentaDto>> Create(VentaCreateDto dto)
    {
        var usuarioId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        try
        {
            var venta = await ventaService.CrearVentaAsync(dto, usuarioId);
            return CreatedAtAction(nameof(GetAll), venta);
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    [HttpPost("{id:int}/pagos")]
    public async Task<ActionResult<VentaDto>> RegistrarPago(int id, PagoCreateDto dto)
    {
        var usuarioId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        try
        {
            return await ventaService.RegistrarPagoAsync(id, dto, usuarioId);
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    [HttpGet("deudores")]
    public async Task<ActionResult<List<DeudorDto>>> Deudores() => await ventaService.ObtenerDeudoresAsync();
}
