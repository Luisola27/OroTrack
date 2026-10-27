using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OroTrack.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class CodigoContenedorColacionUnicode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Codigo",
                table: "Contenedores",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                collation: "Latin1_General_100_CI_AS_SC",
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Codigo",
                table: "Contenedores",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30,
                oldCollation: "Latin1_General_100_CI_AS_SC");
        }
    }
}
