using OroTrack.Domain;

namespace OroTrack.Api.Dtos;

/// <summary>Cuánto entró y salió por un método de pago en un período.</summary>
public record MetodoResumenDto(
    MetodoPago Metodo,
    decimal Cobrado,
    decimal Compras,
    decimal Entradas,
    decimal Salidas,
    decimal Neto
);

/// <summary>Estado de la caja de un usuario en un período: la base del cierre.</summary>
public record CajaResumenDto(
    decimal TotalVendido,
    decimal TotalGramosVendido,
    decimal TotalFiadoOtorgado,
    decimal TotalCobrado,
    decimal CostoMaterialVendido,
    decimal GananciaBruta,
    decimal ComprasConCaja,
    decimal ComprasConCapital,
    List<MetodoResumenDto> PorMetodo,
    decimal EfectivoEsperado
);

public record CajaEstadoDto(
    string UsuarioId,
    string UsuarioNombre,
    string? Rol,
    DateTime? UltimoCierre,
    CajaResumenDto Resumen
);

/// <summary>Una línea del libro de dinero: cobros, compras de material, aportes, retiros y gastos.</summary>
public record CajaMovimientoDto(
    DateTime Fecha,
    string Tipo,
    string Descripcion,
    MetodoPago? Metodo,
    decimal Monto,
    bool AfectaCaja,
    string ResponsableNombre,
    string? Nota
);

public record MovimientoCajaCreateDto(
    string ResponsableUsuarioId,
    TipoMovimientoCaja Tipo,
    MetodoPago Metodo,
    decimal Monto,
    string? Nota
);
