using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
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
[Authorize]
public class CajaController(AppDbContext db, CajaService caja, UserManager<ApplicationUser> userManager) : ControllerBase
{
    private string UsuarioActualId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private bool EsAdmin => User.IsInRole(Roles.Admin);

    /// <summary>Un vendedor solo puede ver su propia caja; el admin puede ver la de cualquiera.</summary>
    private string ResolverUsuario(string? usuarioId) =>
        EsAdmin && !string.IsNullOrWhiteSpace(usuarioId) ? usuarioId : UsuarioActualId;

    [HttpGet("estado")]
    public async Task<ActionResult<CajaEstadoDto>> Estado([FromQuery] string? usuarioId)
    {
        var id = ResolverUsuario(usuarioId);
        var user = await userManager.FindByIdAsync(id);
        if (user is null) return NotFound("Usuario no encontrado.");
        var roles = await userManager.GetRolesAsync(user);
        return await caja.EstadoAsync(id, user.NombreCompleto, roles.FirstOrDefault());
    }

    /// <summary>Caja pendiente de cerrar de todos los usuarios activos (solo Admin).</summary>
    [HttpGet("general")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<List<CajaEstadoDto>>> General()
    {
        var usuarios = await db.Users.Where(u => u.Activo).OrderBy(u => u.NombreCompleto).ToListAsync();
        var resultado = new List<CajaEstadoDto>();
        foreach (var u in usuarios)
        {
            var roles = await userManager.GetRolesAsync(u);
            resultado.Add(await caja.EstadoAsync(u.Id, u.NombreCompleto, roles.FirstOrDefault()));
        }
        return resultado;
    }

    [HttpGet("movimientos")]
    public async Task<ActionResult<List<CajaMovimientoDto>>> Movimientos(
        [FromQuery] string? usuarioId, [FromQuery] DateTime? desde, [FromQuery] DateTime? hasta)
    {
        // Admin sin usuario = todo el negocio; vendedor = siempre su propia caja.
        string? id = EsAdmin ? (string.IsNullOrWhiteSpace(usuarioId) ? null : usuarioId) : UsuarioActualId;
        return await caja.MovimientosAsync(id, desde ?? DateTime.MinValue, hasta ?? DateTime.MaxValue);
    }

    [HttpPost("movimientos")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult> Registrar(MovimientoCajaCreateDto dto)
    {
        if (dto.Monto <= 0) return BadRequest("El monto debe ser mayor a cero.");
        if (await db.Users.FindAsync(dto.ResponsableUsuarioId) is null) return BadRequest("Usuario no encontrado.");

        db.MovimientosCaja.Add(new MovimientoCaja
        {
            ResponsableUsuarioId = dto.ResponsableUsuarioId,
            Tipo = dto.Tipo,
            Metodo = dto.Metodo,
            Monto = dto.Monto,
            Nota = string.IsNullOrWhiteSpace(dto.Nota) ? null : dto.Nota.Trim(),
            RegistradoPorUsuarioId = UsuarioActualId
        });
        await db.SaveChangesAsync();
        return NoContent();
    }
}
