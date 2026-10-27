namespace OroTrack.Domain;

public class TipoOro
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
    public int? QuilateReferencia { get; set; }
    public bool PermiteCalidad { get; set; }
    public bool Activo { get; set; } = true;

    public ICollection<Contenedor> Contenedores { get; set; } = new List<Contenedor>();
}
