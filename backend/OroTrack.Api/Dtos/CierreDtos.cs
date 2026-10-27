namespace OroTrack.Api.Dtos;

public record CierreCreateDto(string UsuarioId, DateTime Desde, DateTime Hasta, decimal EfectivoContado, string? Nota);

public record CierreDto(
    int Id,
    string UsuarioId,
    string UsuarioNombre,
    DateTime Desde,
    DateTime Hasta,
    decimal TotalVendido,
    decimal TotalFiadoOtorgado,
    decimal CostoMaterialVendido,
    decimal EfectivoVentas,
    decimal EfectivoCompras,
    decimal SinpeVentas,
    decimal SinpeCompras,
    decimal TransferenciaVentas,
    decimal TransferenciaCompras,
    decimal RetiroSinTarjetaVentas,
    decimal RetiroSinTarjetaCompras,
    decimal EfectivoEntradas,
    decimal EfectivoSalidas,
    decimal ComprasConCapital,
    decimal EfectivoContado,
    decimal EfectivoEsperado,
    decimal Diferencia,
    string? Nota,
    string CerradoPorNombre,
    DateTime FechaCierre
);
