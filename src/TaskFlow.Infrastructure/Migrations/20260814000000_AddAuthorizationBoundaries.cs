using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TaskFlow.Infrastructure.Data;

#nullable disable

namespace TaskFlow.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260814000000_AddAuthorizationBoundaries")]
public partial class AddAuthorizationBoundaries : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "IsAdmin",
            table: "Users",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AlterColumn<string>(
            name: "Token",
            table: "RefreshTokens",
            type: "character varying(512)",
            maxLength: 512,
            nullable: false,
            oldClrType: typeof(string),
            oldType: "text");

        migrationBuilder.CreateIndex(
            name: "IX_RefreshTokens_Token",
            table: "RefreshTokens",
            column: "Token",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_RefreshTokens_UserId_IsRevoked_ExpiresAt",
            table: "RefreshTokens",
            columns: new[] { "UserId", "IsRevoked", "ExpiresAt" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_RefreshTokens_Token", table: "RefreshTokens");
        migrationBuilder.DropIndex(name: "IX_RefreshTokens_UserId_IsRevoked_ExpiresAt", table: "RefreshTokens");
        migrationBuilder.DropColumn(name: "IsAdmin", table: "Users");
        migrationBuilder.AlterColumn<string>(
            name: "Token",
            table: "RefreshTokens",
            type: "text",
            nullable: false,
            oldClrType: typeof(string),
            oldType: "character varying(512)",
            oldMaxLength: 512);
    }
}
