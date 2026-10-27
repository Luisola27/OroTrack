namespace OroTrack.Domain;

public class Pago
{
    public int Id { get; set; }
    public int VentaId { get; set; }
    public Venta Venta { get; set; } = null!;
    public string UsuarioId { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public MetodoPago Metodo { get; set; }
    public string? Nota { get; set; }
}
