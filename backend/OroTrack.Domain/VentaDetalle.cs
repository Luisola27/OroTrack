namespace OroTrack.Domain;

public class VentaDetalle
{
    public int Id { get; set; }
    public int VentaId { get; set; }
    public Venta Venta { get; set; } = null!;
    public int ContenedorId { get; set; }
    public Contenedor Contenedor { get; set; } = null!;
    public decimal Gramos { get; set; }
    public decimal PrecioGramo { get; set; }
    public decimal Subtotal { get; set; }

    /// <summary>Costo por gramo del lote al momento de vender, para calcular la ganancia real.</summary>
    public decimal CostoGramo { get; set; }
}
