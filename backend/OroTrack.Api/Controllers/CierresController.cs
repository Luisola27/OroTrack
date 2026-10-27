using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OroTrack.Api.Dtos;
using OroTrack.Api.Services;
using OroTrack.Domain;
using OroTrack.Infrastructure;
using OroTrack.Infrastructure.Identity;
using System.Security.Claims;

namespace OroTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = Roles.Admin)]
public class CierresController(AppDbContext db, CajaService caja) : ControllerBase
{
    [HttpGet("resumen")]
    public async Task<ActionResult<CajaResumenDto>> Resumen(
        [FromQuery] string usuarioId, [FromQuery] DateTime desde, [FromQuery] DateTime hasta)
    {
        if (hasta < desde) return BadRequest("La fecha final debe ser posterior a la inicial.");
        var (inicio, error) = await NormalizarDesdeAsync(usuarioId, desde);
        if (error is not null) return BadRequest(error);
        return await caja.ResumenAsync(usuarioId, inicio, hasta);
    }

    [HttpGet("ultimo")]
    public async Task<ActionResult<DateTime?>> Ultimo([FromQuery] string usuarioId) =>
        await caja.UltimoCierreAsync(usuarioId);

    [HttpGet]
    public async Task<ActionResult<List<CierreDto>>> GetAll()
    {
        var cierres = await db.Cierres.OrderByDescending(c => c.FechaCierre).ToListAsync();
        var usuarioIds = cierres.Select(c => c.UsuarioId).Concat(cierres.Select(c => c.CerradoPorUsuarioId)).Distinct().ToList();
        var usuarios = await db.Users.Where(u => usuarioIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.NombreCompleto);

        return cierres.Select(c => ToDto(c, usuarios)).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<CierreDto>> Crear(CierreCreateDto dto)
    {
        if (dto.Hasta < dto.Desde) return BadRequest("La fecha final debe ser posterior a la inicial.");
        if (dto.EfectivoContado < 0) return BadRequest("El efectivo contado no puede ser negativo.");

        var vendedor = await db.Users.FindAsync(dto.UsuarioId);
        if (vendedor is null) return BadRequest("Usuario no encontrado.");

        var (desde, error) = await NormalizarDesdeAsync(dto.UsuarioId, dto.Desde);
        if (error is not null) return BadRequest(error);

        var r = await caja.ResumenAsync(dto.UsuarioId, desde, dto.Hasta);
        MetodoResumenDto M(MetodoPago m) => r.PorMetodo.First(x => x.Metodo == m);
        var efectivo = M(MetodoPago.Efectivo);
        var cerradoPorId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var cierre = new Cierre
        {
            UsuarioId = dto.UsuarioId,
            Desde = desde,
            Hasta = dto.Hasta,
            TotalVendido = r.TotalVendido,
            TotalFiadoOtorgado = r.TotalFiadoOtorgado,
            CostoMaterialVendido = r.CostoMaterialVendido,
            EfectivoVentas = efectivo.Cobrado,
            EfectivoCompras = efectivo.Compras,
            SinpeVentas = M(MetodoPago.Sinpe).Cobrado,
            SinpeCompras = M(MetodoPago.Sinpe).Compras,
            TransferenciaVentas = M(MetodoPago.Transferencia).Cobrado,
            TransferenciaCompras = M(MetodoPago.Transferencia).Compras,
            RetiroSinTarjetaVentas = M(MetodoPago.RetiroSinTarjeta).Cobrado,
            RetiroSinTarjetaCompras = M(MetodoPago.RetiroSinTarjeta).Compras,
            EfectivoEntradas = efectivo.Entradas,
            EfectivoSalidas = efectivo.Salidas,
            ComprasConCapital = r.ComprasConCapital,
            EfectivoContado = dto.EfectivoContado,
            Nota = dto.Nota,
            CerradoPorUsuarioId = cerradoPorId
        };
        db.Cierres.Add(cierre);
        await db.SaveChangesAsync();

        var usuarios = await db.Users.Where(u => u.Id == dto.UsuarioId || u.Id == cerradoPorId)
            .ToDictionaryAsync(u => u.Id, u => u.NombreCompleto);
        return ToDto(cierre, usuarios);
    }

    /// <summary>
    /// Evita contar dos veces el mismo dinero: el período empieza justo después del último cierre.
    /// El input del navegador no tiene segundos, así que se tolera hasta un minuto antes.
    /// </summary>
    private async Task<(DateTime desde, string? error)> NormalizarDesdeAsync(string usuarioId, DateTime desde)
    {
        var ultimo = await caja.UltimoCierreAsync(usuarioId);
        if (ultimo is null || desde > ultimo) return (desde, null);
        if (ultimo.Value - desde <= TimeSpan.FromMinutes(1)) return (ultimo.Value.AddTicks(1), null);
        return (desde, "Este período se cruza con el último cierre de este usuario. Empieza desde la fecha del último cierre para no contar dos veces el mismo dinero.");
    }

    private static CierreDto ToDto(Cierre c, Dictionary<string, string> usuarios)
    {
        var efectivoEsperado = c.EfectivoVentas - c.EfectivoCompras + c.EfectivoEntradas - c.EfectivoSalidas;
        return new(
            c.Id, c.UsuarioId, usuarios.GetValueOrDefault(c.UsuarioId, "-"),
            c.Desde, c.Hasta,
            c.TotalVendido, c.TotalFiadoOtorgado, c.CostoMaterialVendido,
            c.EfectivoVentas, c.EfectivoCompras,
            c.SinpeVentas, c.SinpeCompras,
            c.TransferenciaVentas, c.TransferenciaCompras,
            c.RetiroSinTarjetaVentas, c.RetiroSinTarjetaCompras,
            c.EfectivoEntradas, c.EfectivoSalidas, c.ComprasConCapital,
            c.EfectivoContado, efectivoEsperado, c.EfectivoContado - efectivoEsperado,
            c.Nota, usuarios.GetValueOrDefault(c.CerradoPorUsuarioId, "-"), c.FechaCierre
        );
    }
}
