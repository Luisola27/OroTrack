using OroTrack.Domain;

namespace OroTrack.Api.Dtos;

public record ContenedorDto(
    int Id,
    TipoOroDto TipoOro,
    Calidad? Calidad,
    decimal PesoTotalGramos,
    decimal PesoDisponibleGramos,
    decimal CostoPorGramo,
    string? Proveedor,
    bool Activo
);

/// <param name="Fuente">Con qué dinero se compró. Caja = plata de ventas (afecta el cierre de <paramref name="ResponsableCajaId"/>).</param>
/// <param name="ResponsableCajaId">De qué caja sale la plata; si viene vacío, de la del usuario que registra.</param>
public record ContenedorCreateDto(
    int TipoOroId, Calidad? Calidad, decimal PesoInicialGramos, decimal CostoTotal, MetodoPago Metodo,
    string? Proveedor, FuenteDinero Fuente = FuenteDinero.Caja, string? ResponsableCajaId = null);

public record ReabastecerDto(
    decimal Gramos, decimal CostoTotal, MetodoPago Metodo, string? Nota,
    FuenteDinero Fuente = FuenteDinero.Caja, string? ResponsableCajaId = null);
