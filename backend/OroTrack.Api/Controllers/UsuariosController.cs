using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OroTrack.Api.Dtos;
using OroTrack.Infrastructure.Identity;

namespace OroTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = Roles.Admin)]
public class UsuariosController(UserManager<ApplicationUser> userManager) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<UsuarioDto>>> GetAll()
    {
        var usuarios = userManager.Users.ToList();
        var resultado = new List<UsuarioDto>();

        foreach (var u in usuarios)
        {
            var roles = await userManager.GetRolesAsync(u);
            resultado.Add(new UsuarioDto(u.Id, u.NombreCompleto, u.Email ?? "", roles.FirstOrDefault(), u.Activo));
        }

        return resultado.OrderBy(u => u.NombreCompleto).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<UsuarioDto>> Create(UsuarioCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NombreCompleto)) return BadRequest("El nombre es obligatorio.");
        if (string.IsNullOrWhiteSpace(dto.Email)) return BadRequest("El correo es obligatorio.");
        if (dto.Rol != Roles.Admin && dto.Rol != Roles.Vendedor) return BadRequest("Rol inválido.");

        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            NombreCompleto = dto.NombreCompleto,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return BadRequest(string.Join(" ", result.Errors.Select(e => e.Description)));

        await userManager.AddToRoleAsync(user, dto.Rol);
        return new UsuarioDto(user.Id, user.NombreCompleto, user.Email ?? "", dto.Rol, user.Activo);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UsuarioDto>> Update(string id, UsuarioUpdateDto dto)
    {
        var user = await userManager.FindByIdAsync(id);
        if (user is null) return NotFound();
        if (string.IsNullOrWhiteSpace(dto.NombreCompleto)) return BadRequest("El nombre es obligatorio.");
        if (dto.Rol != Roles.Admin && dto.Rol != Roles.Vendedor) return BadRequest("Rol inválido.");

        user.NombreCompleto = dto.NombreCompleto;
        user.Activo = dto.Activo;
        await userManager.UpdateAsync(user);

        var rolesActuales = await userManager.GetRolesAsync(user);
        if (!rolesActuales.Contains(dto.Rol))
        {
            await userManager.RemoveFromRolesAsync(user, rolesActuales);
            await userManager.AddToRoleAsync(user, dto.Rol);
        }

        return new UsuarioDto(user.Id, user.NombreCompleto, user.Email ?? "", dto.Rol, user.Activo);
    }
}
