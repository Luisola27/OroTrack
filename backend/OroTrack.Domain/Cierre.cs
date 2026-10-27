namespace OroTrack.Domain;

public class Cierre
{
    public int Id { get; set; }
    public string UsuarioId { get; set; } = string.Empty;
    public DateTime Desde { get; set; }
    public DateTime Hasta { get; set; }

    public decimal TotalVendido { get; set; }
    public decimal TotalFiadoOtorgado { get; set; }
    public decimal CostoMaterialVendido { get; set; }

    public decimal EfectivoVentas { get; set; }
    public decimal EfectivoCompras { get; set; }
    public decimal SinpeVentas { get; set; }
    public decimal SinpeCompras { get; set; }
    public decimal TransferenciaVentas { get; set; }
    public decimal TransferenciaCompras { get; set; }
    public decimal RetiroSinTarjetaVentas { get; set; }
    public decimal RetiroSinTarjetaCompras { get; set; }

    /// <summary>Aportes en efectivo a la caja durante el período.</summary>
    public decimal EfectivoEntradas { get; set; }
    /// <summary>Retiros y gastos en efectivo de la caja durante el período.</summary>
    public decimal EfectivoSalidas { get; set; }

    /// <summary>Material comprado con capital aparte (informativo, no afecta la caja).</summary>
    public decimal ComprasConCapital { get; set; }

    public decimal EfectivoContado { get; set; }
    public string? Nota { get; set; }

    public string CerradoPorUsuarioId { get; set; } = string.Empty;
    public DateTime FechaCierre { get; set; } = DateTime.UtcNow;
}
