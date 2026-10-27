using OroTrack.Domain;

namespace OroTrack.Api.Dtos;

public record MovimientoDto(
    DateTime Fecha,
    string Tipo,
    int ContenedorId,
    string TipoOroNombre,
    string TipoOroEmoji,
    Calidad? Calidad,
    decimal Gramos,
    string UsuarioNombre,
    string? ClienteNombre,
    MetodoPago? Metodo,
    string? Nota
);

public record InventarioPorTipoDto(
    string TipoOroNombre,
    string TipoOroEmoji,
    int? QuilateReferencia,
    decimal PesoDisponibleTotal,
    decimal PesoTotalHistorico,
    decimal GramosVendidosHistorico,
    int CantidadContenedores
);
