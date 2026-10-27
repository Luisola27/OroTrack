using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OroTrack.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ReemplazarQuilatePorTipoOro : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Quilate",
                table: "Contenedores",
                newName: "TipoOroId");

            migrationBuilder.AddColumn<int>(
                name: "Calidad",
                table: "Contenedores",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TiposOro",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Emoji = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, collation: "Latin1_General_100_CI_AS_SC"),
                    QuilateReferencia = table.Column<int>(type: "int", nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TiposOro", x => x.Id);
                });

            // Catálogo inicial. El orden importa: el identity resultante (1..6) se usa
            // abajo para remapear los valores del viejo enum Quilate (0=K10 .. 4=K24).
            migrationBuilder.Sql(@"
                INSERT INTO TiposOro (Nombre, Emoji, QuilateReferencia, Activo) VALUES
                (N'10k', N'🇲🇽', 10, 1),
                (N'14k', N'🇨🇴', 14, 1),
                (N'18k', N'🥦', 18, 1),
                (N'Oro Blanco', N'🍡', 22, 1),
                (N'Oro Rosa', N'🪩', 24, 1),
                (N'Oro Líquido', N'🍯', NULL, 1);
            ");

            migrationBuilder.Sql("UPDATE Contenedores SET TipoOroId = TipoOroId + 1;");

            migrationBuilder.CreateIndex(
                name: "IX_Contenedores_TipoOroId",
                table: "Contenedores",
                column: "TipoOroId");

            migrationBuilder.CreateIndex(
                name: "IX_TiposOro_Nombre",
                table: "TiposOro",
                column: "Nombre",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Contenedores_TiposOro_TipoOroId",
                table: "Contenedores",
                column: "TipoOroId",
                principalTable: "TiposOro",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Contenedores_TiposOro_TipoOroId",
                table: "Contenedores");

            migrationBuilder.DropTable(
                name: "TiposOro");

            migrationBuilder.DropIndex(
                name: "IX_Contenedores_TipoOroId",
                table: "Contenedores");

            migrationBuilder.DropColumn(
                name: "Calidad",
                table: "Contenedores");

            migrationBuilder.RenameColumn(
                name: "TipoOroId",
                table: "Contenedores",
                newName: "Quilate");
        }
    }
}
