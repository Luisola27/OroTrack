namespace OroTrack.Domain;

public class MovimientoContenedor
{
    public int Id { get; set; }
    public int ContenedorId { get; set; }
    public Contenedor Contenedor { get; set; } = null!;
    public string UsuarioId { get; set; } = string.Empty;
    public TipoMovimientoContenedor Tipo { get; set; }
    public decimal Gramos { get; set; }
    public decimal? CostoPorGramo { get; set; }

    /// <summary>Lo que realmente se pagó por este material. Se guarda aparte para no perder
    /// céntimos al redondear el costo por gramo.</summary>
    public decimal? CostoTotal { get; set; }

    public MetodoPago? Metodo { get; set; }

    /// <summary>Con qué dinero se pagó: caja de ventas o capital aparte.</summary>
    public FuenteDinero? Fuente { get; set; }

    /// <summary>Usuario de cuya caja salió el dinero (solo si <see cref="Fuente"/> es Caja).</summary>
    public string? ResponsableCajaId { get; set; }

    public string? Nota { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
}
