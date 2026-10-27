using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OroTrack.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class QuitarCodigoYAgregarPermiteCalidad : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Contenedores_Codigo",
                table: "Contenedores");

            migrationBuilder.DropColumn(
                name: "Codigo",
                table: "Contenedores");

            migrationBuilder.AddColumn<bool>(
                name: "PermiteCalidad",
                table: "TiposOro",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql("UPDATE TiposOro SET PermiteCalidad = 1 WHERE Nombre = N'18k';");

            migrationBuilder.Sql(@"
                INSERT INTO TiposOro (Nombre, Emoji, QuilateReferencia, PermiteCalidad, Activo)
                VALUES (N'Lápiz', N'✏️', NULL, 0, 1);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PermiteCalidad",
                table: "TiposOro");

            migrationBuilder.AddColumn<string>(
                name: "Codigo",
                table: "Contenedores",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "",
                collation: "Latin1_General_100_CI_AS_SC");

            migrationBuilder.CreateIndex(
                name: "IX_Contenedores_Codigo",
                table: "Contenedores",
                column: "Codigo",
                unique: true);
        }
    }
}
