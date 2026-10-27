using OroTrack.Domain;

namespace OroTrack.Api.Dtos;

public record VentaCreateDto(int ClienteId, int ContenedorId, decimal Gramos, decimal PrecioGramo, TipoPago TipoPago, MetodoPago? Metodo);

public record VentaDetalleResumenDto(string TipoOroNombre, string TipoOroEmoji, Calidad? Calidad, decimal Gramos);

public record VentaDto(
    int Id,
    int ClienteId,
    string ClienteNombre,
    string VendedorNombre,
    DateTime Fecha,
    TipoPago TipoPago,
    EstadoVenta Estado,
    decimal TotalGramos,
    decimal TotalMonto,
    decimal SaldoPendiente,
    List<VentaDetalleResumenDto> Detalles
);

public record PagoCreateDto(decimal Monto, MetodoPago Metodo, string? Nota);

public record DeudorDto(int ClienteId, string ClienteNombre, decimal SaldoPendiente, DateTime UltimaVentaFiada, int DiasVencido);
