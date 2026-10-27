using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OroTrack.Api.Dtos;
using OroTrack.Domain;
using OroTrack.Infrastructure;
using OroTrack.Infrastructure.Identity;
using System.Security.Claims;

namespace OroTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ContenedoresController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ContenedorDto>>> GetAll()
    {
        var contenedores = await db.Contenedores.Include(c => c.TipoOro).OrderBy(c => c.Id).ToListAsync();
        return contenedores.Select(ToDto).ToList();
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<ContenedorDto>> Create(ContenedorCreateDto dto)
    {
        if (dto.PesoInicialGramos <= 0) return BadRequest("El peso inicial debe ser mayor a cero.");
        if (dto.CostoTotal <= 0) return BadRequest("El costo total debe ser mayor a cero.");

        var tipoOro = await db.TiposOro.FindAsync(dto.TipoOroId);
        if (tipoOro is null) return BadRequest("Tipo de oro no encontrado.");

        var usuarioId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var (responsable, errorCaja) = await ResolverCajaAsync(dto.Fuente, dto.ResponsableCajaId, usuarioId);
        if (errorCaja is not null) return BadRequest(errorCaja);
        var costoPorGramo = dto.CostoTotal / dto.PesoInicialGramos;

        var contenedor = new Contenedor
        {
            TipoOroId = dto.TipoOroId,
            Calidad = dto.Calidad,
            PesoTotalGramos = dto.PesoInicialGramos,
            PesoDisponibleGramos = dto.PesoInicialGramos,
            CostoPorGramo = costoPorGramo,
            Proveedor = dto.Proveedor,
            Movimientos =
            [
                new MovimientoContenedor
                {
                    UsuarioId = usuarioId,
                    Tipo = TipoMovimientoContenedor.Reabastecimiento,
                    Gramos = dto.PesoInicialGramos,
                    CostoPorGramo = costoPorGramo,
                    Metodo = dto.Metodo,
                    CostoTotal = dto.CostoTotal,
                    Fuente = dto.Fuente,
                    ResponsableCajaId = responsable,
                    Nota = "Compra inicial del lote"
                }
            ]
        };
        db.Contenedores.Add(contenedor);
        await db.SaveChangesAsync();
        contenedor.TipoOro = tipoOro;
        return CreatedAtAction(nameof(GetAll), ToDto(contenedor));
    }

    [HttpPost("{id:int}/reabastecer")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<ContenedorDto>> Reabastecer(int id, ReabastecerDto dto)
    {
        if (dto.Gramos <= 0)
            return BadRequest("Los gramos deben ser mayores a cero.");
        if (dto.CostoTotal <= 0)
            return BadRequest("El costo total debe ser mayor a cero.");

        var contenedor = await db.Contenedores.Include(c => c.TipoOro).FirstOrDefaultAsync(c => c.Id == id);
        if (contenedor is null) return NotFound();

        var usuarioId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var (responsable, errorCaja) = await ResolverCajaAsync(dto.Fuente, dto.ResponsableCajaId, usuarioId);
        if (errorCaja is not null) return BadRequest(errorCaja);
        var costoPorGramo = dto.CostoTotal / dto.Gramos;

        // Costo promedio ponderado: el material que queda y el nuevo se mezclan en el mismo lote.
        var disponible = Math.Max(0, contenedor.PesoDisponibleGramos);
        contenedor.CostoPorGramo = (disponible * contenedor.CostoPorGramo + dto.CostoTotal) / (disponible + dto.Gramos);
        contenedor.PesoTotalGramos += dto.Gramos;
        contenedor.PesoDisponibleGramos += dto.Gramos;

        db.MovimientosContenedor.Add(new MovimientoContenedor
        {
            ContenedorId = id,
            UsuarioId = usuarioId,
            Tipo = TipoMovimientoContenedor.Reabastecimiento,
            Gramos = dto.Gramos,
            CostoPorGramo = costoPorGramo,
            Metodo = dto.Metodo,
            CostoTotal = dto.CostoTotal,
            Fuente = dto.Fuente,
            ResponsableCajaId = responsable,
            Nota = dto.Nota
        });

        await db.SaveChangesAsync();
        return ToDto(contenedor);
    }

    private async Task<(string? responsable, string? error)> ResolverCajaAsync(FuenteDinero fuente, string? responsableId, string usuarioId)
    {
        if (fuente == FuenteDinero.Capital) return (null, null);
        var id = string.IsNullOrWhiteSpace(responsableId) ? usuarioId : responsableId;
        return await db.Users.FindAsync(id) is null ? (null, "No se encontró la caja de ese usuario.") : (id, null);
    }

    private static ContenedorDto ToDto(Contenedor c) =>
        new(
            c.Id,
            new TipoOroDto(c.TipoOro.Id, c.TipoOro.Nombre, c.TipoOro.Emoji, c.TipoOro.QuilateReferencia, c.TipoOro.PermiteCalidad, c.TipoOro.Activo),
            c.Calidad,
            c.PesoTotalGramos,
            c.PesoDisponibleGramos,
            c.CostoPorGramo,
            c.Proveedor,
            c.Activo
        );
}
