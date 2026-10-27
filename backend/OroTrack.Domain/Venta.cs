namespace OroTrack.Domain;

public class Venta
{
    public int Id { get; set; }
    public int ClienteId { get; set; }
    public Cliente Cliente { get; set; } = null!;
    public string UsuarioId { get; set; } = string.Empty;
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public TipoPago TipoPago { get; set; }
    public EstadoVenta Estado { get; set; } = EstadoVenta.Pendiente;
    public decimal TotalMonto { get; set; }
    public decimal TotalGramos { get; set; }

    public ICollection<VentaDetalle> Detalles { get; set; } = new List<VentaDetalle>();
    public ICollection<Pago> Pagos { get; set; } = new List<Pago>();
}
