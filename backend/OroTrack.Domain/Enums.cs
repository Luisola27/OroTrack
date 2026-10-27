namespace OroTrack.Domain;

public enum TipoPago
{
    Contado,
    Fiado
}

public enum EstadoVenta
{
    Pagada,
    Parcial,
    Pendiente
}

public enum TipoMovimientoContenedor
{
    Reabastecimiento,
    Ajuste
}

public enum Calidad
{
    Barata,
    Media,
    Cara
}

public enum MetodoPago
{
    Efectivo,
    Sinpe,
    Transferencia,
    RetiroSinTarjeta
}

/// <summary>De dónde salió el dinero con que se compró material para un lote.</summary>
public enum FuenteDinero
{
    /// <summary>Plata de las ventas: sale de la caja de alguien y reduce su efectivo esperado en el cierre.</summary>
    Caja,
    /// <summary>Capital aparte (dueño, banco): no toca ninguna caja.</summary>
    Capital
}

public enum TipoMovimientoCaja
{
    /// <summary>Entra dinero a la caja (fondo inicial, sencillo, capital que se deja para operar).</summary>
    Aporte,
    /// <summary>Se saca dinero de la caja para entregarlo (al dueño, al banco).</summary>
    Retiro,
    /// <summary>Se paga un gasto con dinero de la caja (transporte, comida, etc.).</summary>
    Gasto
}
