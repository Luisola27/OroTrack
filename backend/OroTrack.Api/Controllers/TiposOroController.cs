using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OroTrack.Api.Dtos;
using OroTrack.Domain;
using OroTrack.Infrastructure;
using OroTrack.Infrastructure.Identity;

namespace OroTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TiposOroController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<TipoOroDto>>> GetAll([FromQuery] bool incluirInactivos = false)
    {
        var query = db.TiposOro.AsQueryable();
        if (!incluirInactivos) query = query.Where(t => t.Activo);

        var tipos = await query
            .OrderBy(t => t.QuilateReferencia == null)
            .ThenBy(t => t.QuilateReferencia)
            .ThenBy(t => t.Nombre)
            .ToListAsync();

        return tipos.Select(ToDto).ToList();
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<TipoOroDto>> Create(TipoOroCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre)) return BadRequest("El nombre es obligatorio.");
        if (string.IsNullOrWhiteSpace(dto.Emoji)) return BadRequest("El emoji es obligatorio.");

        if (await db.TiposOro.AnyAsync(t => t.Nombre == dto.Nombre))
            return BadRequest("Ya existe un tipo de oro con ese nombre.");

        var tipo = new TipoOro { Nombre = dto.Nombre, Emoji = dto.Emoji, QuilateReferencia = dto.QuilateReferencia, PermiteCalidad = dto.PermiteCalidad };
        db.TiposOro.Add(tipo);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), ToDto(tipo));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<TipoOroDto>> Update(int id, TipoOroUpdateDto dto)
    {
        var tipo = await db.TiposOro.FindAsync(id);
        if (tipo is null) return NotFound();

        if (string.IsNullOrWhiteSpace(dto.Nombre)) return BadRequest("El nombre es obligatorio.");
        if (string.IsNullOrWhiteSpace(dto.Emoji)) return BadRequest("El emoji es obligatorio.");

        if (await db.TiposOro.AnyAsync(t => t.Nombre == dto.Nombre && t.Id != id))
            return BadRequest("Ya existe un tipo de oro con ese nombre.");

        tipo.Nombre = dto.Nombre;
        tipo.Emoji = dto.Emoji;
        tipo.QuilateReferencia = dto.QuilateReferencia;
        tipo.PermiteCalidad = dto.PermiteCalidad;
        tipo.Activo = dto.Activo;
        await db.SaveChangesAsync();
        return ToDto(tipo);
    }

    private static TipoOroDto ToDto(TipoOro t) => new(t.Id, t.Nombre, t.Emoji, t.QuilateReferencia, t.PermiteCalidad, t.Activo);
}
