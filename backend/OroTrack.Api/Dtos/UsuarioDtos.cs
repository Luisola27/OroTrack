namespace OroTrack.Api.Dtos;

public record UsuarioDto(string Id, string NombreCompleto, string Email, string? Rol, bool Activo);

public record UsuarioUpdateDto(string NombreCompleto, string Rol, bool Activo);
