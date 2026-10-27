using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OroTrack.Infrastructure;
using OroTrack.Infrastructure.Identity;

namespace OroTrack.Api.Data;

public static class SeedData
{
    public static async Task RunAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();

        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        foreach (var role in new[] { Roles.Admin, Roles.Vendedor })
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));

        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var adminEmail = "admin@orotrack.local";
        if (await userManager.FindByEmailAsync(adminEmail) is null)
        {
            var admin = new ApplicationUser
            {
                UserName = "Administrador",
                Email = adminEmail,
                NombreCompleto = "Administrador",
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(admin, "Admin123!");
            if (result.Succeeded)
                await userManager.AddToRoleAsync(admin, Roles.Admin);
        }
    }
}
