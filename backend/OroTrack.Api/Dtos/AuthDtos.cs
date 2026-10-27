namespace OroTrack.Api.Dtos;

public record LoginDto(string Email, string Password);

public record LoginResponseDto(string Token, DateTime ExpiresAt, string UsuarioId, string NombreCompleto, string[] Roles);

public record UsuarioCreateDto(string NombreCompleto, string Email, string Password, string Rol);
