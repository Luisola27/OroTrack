using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using OroTrack.Domain;
using OroTrack.Infrastructure.Identity;

namespace OroTrack.Infrastructure;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<TipoOro> TiposOro => Set<TipoOro>();
    public DbSet<Contenedor> Contenedores => Set<Contenedor>();
    public DbSet<MovimientoContenedor> MovimientosContenedor => Set<MovimientoContenedor>();
    public DbSet<Venta> Ventas => Set<Venta>();
    public DbSet<VentaDetalle> VentaDetalles => Set<VentaDetalle>();
    public DbSet<Pago> Pagos => Set<Pago>();
    public DbSet<Cierre> Cierres => Set<Cierre>();
    public DbSet<MovimientoCaja> MovimientosCaja => Set<MovimientoCaja>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Cliente>(e =>
        {
            e.Property(p => p.Nombre).HasMaxLength(150).IsRequired();
            e.HasIndex(p => p.Identificacion);
        });

        builder.Entity<TipoOro>(e =>
        {
            e.Property(p => p.Nombre).HasMaxLength(50).IsRequired();
            e.Property(p => p.Emoji).HasMaxLength(20).IsRequired().UseCollation("Latin1_General_100_CI_AS_SC");
            e.HasIndex(p => p.Nombre).IsUnique();
        });

        builder.Entity<Contenedor>(e =>
        {
            e.Property(p => p.PesoTotalGramos).HasPrecision(10, 3);
            e.Property(p => p.PesoDisponibleGramos).HasPrecision(10, 3);
            e.Property(p => p.CostoPorGramo).HasPrecision(14, 4);
            e.HasOne(p => p.TipoOro)
                .WithMany(t => t.Contenedores)
                .HasForeignKey(p => p.TipoOroId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<MovimientoContenedor>(e =>
        {
            e.Property(p => p.Gramos).HasPrecision(10, 3);
            e.Property(p => p.CostoPorGramo).HasPrecision(14, 4);
            e.Property(p => p.CostoTotal).HasPrecision(12, 2);
            e.HasOne(p => p.Contenedor)
                .WithMany(c => c.Movimientos)
                .HasForeignKey(p => p.ContenedorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Venta>(e =>
        {
            e.Property(p => p.TotalMonto).HasPrecision(12, 2);
            e.Property(p => p.TotalGramos).HasPrecision(10, 3);
            e.HasOne(p => p.Cliente)
                .WithMany(c => c.Ventas)
                .HasForeignKey(p => p.ClienteId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<VentaDetalle>(e =>
        {
            e.Property(p => p.Gramos).HasPrecision(10, 3);
            e.Property(p => p.PrecioGramo).HasPrecision(12, 2);
            e.Property(p => p.Subtotal).HasPrecision(12, 2);
            e.Property(p => p.CostoGramo).HasPrecision(14, 4);
            e.HasOne(p => p.Venta)
                .WithMany(v => v.Detalles)
                .HasForeignKey(p => p.VentaId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(p => p.Contenedor)
                .WithMany(c => c.VentaDetalles)
                .HasForeignKey(p => p.ContenedorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Pago>(e =>
        {
            e.Property(p => p.Monto).HasPrecision(12, 2);
            e.HasOne(p => p.Venta)
                .WithMany(v => v.Pagos)
                .HasForeignKey(p => p.VentaId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Cierre>(e =>
        {
            e.Property(p => p.TotalVendido).HasPrecision(12, 2);
            e.Property(p => p.TotalFiadoOtorgado).HasPrecision(12, 2);
            e.Property(p => p.EfectivoVentas).HasPrecision(12, 2);
            e.Property(p => p.EfectivoCompras).HasPrecision(12, 2);
            e.Property(p => p.SinpeVentas).HasPrecision(12, 2);
            e.Property(p => p.SinpeCompras).HasPrecision(12, 2);
            e.Property(p => p.TransferenciaVentas).HasPrecision(12, 2);
            e.Property(p => p.TransferenciaCompras).HasPrecision(12, 2);
            e.Property(p => p.RetiroSinTarjetaVentas).HasPrecision(12, 2);
            e.Property(p => p.RetiroSinTarjetaCompras).HasPrecision(12, 2);
            e.Property(p => p.EfectivoContado).HasPrecision(12, 2);
            e.Property(p => p.EfectivoEntradas).HasPrecision(12, 2);
            e.Property(p => p.EfectivoSalidas).HasPrecision(12, 2);
            e.Property(p => p.ComprasConCapital).HasPrecision(12, 2);
            e.Property(p => p.CostoMaterialVendido).HasPrecision(12, 2);
        });

        builder.Entity<MovimientoCaja>(e =>
        {
            e.Property(p => p.Monto).HasPrecision(12, 2);
            e.HasIndex(p => new { p.ResponsableUsuarioId, p.Fecha });
        });
    }
}
