namespace OroTrack.Api.Dtos;

public record ClienteDto(int Id, string Nombre, string? Telefono, string? Direccion, string? Identificacion, decimal SaldoPendiente, bool Activo);

public record ClienteCreateDto(string Nombre, string? Telefono, string? Direccion, string? Identificacion);

public record ClienteUpdateDto(string Nombre, string? Telefono, string? Direccion, string? Identificacion, bool Activo);
