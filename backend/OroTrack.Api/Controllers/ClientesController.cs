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
public class ClientesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ClienteDto>>> GetAll([FromQuery] string? buscar, [FromQuery] bool incluirInactivos = false)
    {
        var query = incluirInactivos ? db.Clientes.AsQueryable() : db.Clientes.Where(c => c.Activo);
        if (!string.IsNullOrWhiteSpace(buscar))
            query = query.Where(c => c.Nombre.Contains(buscar) || (c.Identificacion != null && c.Identificacion.Contains(buscar)));

        var clientes = await query.Include(c => c.Ventas).ThenInclude(v => v.Pagos).ToListAsync();

        return clientes.Select(ToDto).ToList();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ClienteDto>> GetById(int id)
    {
        var cliente = await db.Clientes.Include(c => c.Ventas).ThenInclude(v => v.Pagos)
            .FirstOrDefaultAsync(c => c.Id == id);
        return cliente is null ? NotFound() : ToDto(cliente);
    }

    [HttpPost]
    public async Task<ActionResult<ClienteDto>> Create(ClienteCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre)) return BadRequest("El nombre es obligatorio.");

        var cliente = new Cliente
        {
            Nombre = dto.Nombre,
            Telefono = dto.Telefono,
            Direccion = dto.Direccion,
            Identificacion = dto.Identificacion
        };
        db.Clientes.Add(cliente);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = cliente.Id }, ToDto(cliente));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<ClienteDto>> Update(int id, ClienteUpdateDto dto)
    {
        var cliente = await db.Clientes.Include(c => c.Ventas).ThenInclude(v => v.Pagos).FirstOrDefaultAsync(c => c.Id == id);
        if (cliente is null) return NotFound();
        if (string.IsNullOrWhiteSpace(dto.Nombre)) return BadRequest("El nombre es obligatorio.");

        cliente.Nombre = dto.Nombre;
        cliente.Telefono = dto.Telefono;
        cliente.Direccion = dto.Direccion;
        cliente.Identificacion = dto.Identificacion;
        cliente.Activo = dto.Activo;
        await db.SaveChangesAsync();
        return ToDto(cliente);
    }

    private static ClienteDto ToDto(Cliente c)
    {
        var saldo = c.Ventas
            .Where(v => v.TipoPago == TipoPago.Fiado)
            .Sum(v => v.TotalMonto - v.Pagos.Sum(p => p.Monto));
        return new ClienteDto(c.Id, c.Nombre, c.Telefono, c.Direccion, c.Identificacion, saldo, c.Activo);
    }
}
