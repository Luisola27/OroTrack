using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OroTrack.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ControlDeDinero : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CostoGramo",
                table: "VentaDetalles",
                type: "decimal(14,4)",
                precision: 14,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AlterColumn<decimal>(
                name: "CostoPorGramo",
                table: "MovimientosContenedor",
                type: "decimal(14,4)",
                precision: 14,
                scale: 4,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(12,2)",
                oldPrecision: 12,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CostoTotal",
                table: "MovimientosContenedor",
                type: "decimal(12,2)",
                precision: 12,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Fuente",
                table: "MovimientosContenedor",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResponsableCajaId",
                table: "MovimientosContenedor",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "CostoPorGramo",
                table: "Contenedores",
                type: "decimal(14,4)",
                precision: 14,
                scale: 4,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(12,2)",
                oldPrecision: 12,
                oldScale: 2);

            migrationBuilder.AddColumn<decimal>(
                name: "ComprasConCapital",
                table: "Cierres",
                type: "decimal(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "CostoMaterialVendido",
                table: "Cierres",
                type: "decimal(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "EfectivoEntradas",
                table: "Cierres",
                type: "decimal(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "EfectivoSalidas",
                table: "Cierres",
                type: "decimal(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "MovimientosCaja",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ResponsableUsuarioId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Tipo = table.Column<int>(type: "int", nullable: false),
                    Metodo = table.Column<int>(type: "int", nullable: false),
                    Monto = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: false),
                    Nota = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RegistradoPorUsuarioId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovimientosCaja", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosCaja_ResponsableUsuarioId_Fecha",
                table: "MovimientosCaja",
                columns: new[] { "ResponsableUsuarioId", "Fecha" });

            // Datos existentes: las compras se pagaban con la caja de quien las registró (así las contaba el cierre),
            // el total pagado era gramos × costo, y las ventas viejas toman el costo actual de su lote.
            migrationBuilder.Sql(@"
                UPDATE MovimientosContenedor
                SET Fuente = 0, ResponsableCajaId = UsuarioId, CostoTotal = ROUND(Gramos * CostoPorGramo, 2)
                WHERE Tipo = 0 AND Fuente IS NULL;

                UPDATE d SET d.CostoGramo = c.CostoPorGramo
                FROM VentaDetalles d INNER JOIN Contenedores c ON c.Id = d.ContenedorId
                WHERE d.CostoGramo = 0;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MovimientosCaja");

            migrationBuilder.DropColumn(
                name: "CostoGramo",
                table: "VentaDetalles");

            migrationBuilder.DropColumn(
                name: "CostoTotal",
                table: "MovimientosContenedor");

            migrationBuilder.DropColumn(
                name: "Fuente",
                table: "MovimientosContenedor");

            migrationBuilder.DropColumn(
                name: "ResponsableCajaId",
                table: "MovimientosContenedor");

            migrationBuilder.DropColumn(
                name: "ComprasConCapital",
                table: "Cierres");

            migrationBuilder.DropColumn(
                name: "CostoMaterialVendido",
                table: "Cierres");

            migrationBuilder.DropColumn(
                name: "EfectivoEntradas",
                table: "Cierres");

            migrationBuilder.DropColumn(
                name: "EfectivoSalidas",
                table: "Cierres");

            migrationBuilder.AlterColumn<decimal>(
                name: "CostoPorGramo",
                table: "MovimientosContenedor",
                type: "decimal(12,2)",
                precision: 12,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(14,4)",
                oldPrecision: 14,
                oldScale: 4,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "CostoPorGramo",
                table: "Contenedores",
                type: "decimal(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(14,4)",
                oldPrecision: 14,
                oldScale: 4);
        }
    }
}
