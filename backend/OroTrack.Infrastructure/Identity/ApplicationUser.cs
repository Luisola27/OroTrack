using Microsoft.AspNetCore.Identity;

namespace OroTrack.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public string NombreCompleto { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
}

public static class Roles
{
    public const string Admin = "Admin";
    public const string Vendedor = "Vendedor";
}
