namespace OroTrack.Domain;

public class Contenedor
{
    public int Id { get; set; }
    public int TipoOroId { get; set; }
    public TipoOro TipoOro { get; set; } = null!;
    public Calidad? Calidad { get; set; }
    public decimal PesoTotalGramos { get; set; }
    public decimal PesoDisponibleGramos { get; set; }
    public decimal CostoPorGramo { get; set; }
    public string? Proveedor { get; set; }
    public DateTime FechaIngreso { get; set; } = DateTime.UtcNow;
    public bool Activo { get; set; } = true;

    public ICollection<MovimientoContenedor> Movimientos { get; set; } = new List<MovimientoContenedor>();
    public ICollection<VentaDetalle> VentaDetalles { get; set; } = new List<VentaDetalle>();
}
