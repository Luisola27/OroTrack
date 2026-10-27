namespace OroTrack.Domain;

/// <summary>Entrada o salida de dinero de la caja de un usuario que no es una venta ni una compra de material.</summary>
public class MovimientoCaja
{
    public int Id { get; set; }
    public string ResponsableUsuarioId { get; set; } = string.Empty;
    public TipoMovimientoCaja Tipo { get; set; }
    public MetodoPago Metodo { get; set; }
    public decimal Monto { get; set; }
    public string? Nota { get; set; }
    public string RegistradoPorUsuarioId { get; set; } = string.Empty;
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
}
