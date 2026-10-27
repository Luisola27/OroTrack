using OroTrack.Api.Dtos;

namespace OroTrack.Api.Services;

public interface IVentaService
{
    Task<VentaDto> CrearVentaAsync(VentaCreateDto dto, string usuarioId);
    Task<VentaDto> RegistrarPagoAsync(int ventaId, PagoCreateDto dto, string usuarioId);
    Task<List<DeudorDto>> ObtenerDeudoresAsync();
}
