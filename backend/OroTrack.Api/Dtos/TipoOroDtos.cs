namespace OroTrack.Api.Dtos;

public record TipoOroDto(int Id, string Nombre, string Emoji, int? QuilateReferencia, bool PermiteCalidad, bool Activo);

public record TipoOroCreateDto(string Nombre, string Emoji, int? QuilateReferencia, bool PermiteCalidad);

public record TipoOroUpdateDto(string Nombre, string Emoji, int? QuilateReferencia, bool PermiteCalidad, bool Activo);
