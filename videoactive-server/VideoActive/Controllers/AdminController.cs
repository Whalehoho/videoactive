using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using VideoActive.Models;
using System.Text.Json;
using BCrypt.Net;

/// <summary>
/// AdminController Controller for managing administrative authentication and password handling.
/// Only accessible to users in the Admin role.
/// </summary>
[Authorize(Roles = "Admin")]
public class AdminController: Controller
{

    private readonly ApplicationDbContext _context;

    public AdminController(ApplicationDbContext context)
    {
        _context = context;
    }

    /**
    * Displays the login view for admin users.
    * 
    * @returns {IActionResult} - The login view for the admin user.
    */
    [AllowAnonymous]
    [HttpGet]
    public IActionResult Login()
    {
        return View();
    }


    /**
    * Handles the admin login requests and authenticates the user.
    * Redirects to the ChangePassword view if the default password is still in use.
    * 
    * @param {LoginViewModel} model - The login view model containing the username and password.
    * 
    * @returns {Task<IActionResult>} - A task representing the async operation:
    *                                 - Redirects to Dashboard on success.
    *                                 - Redirects to ChangePassword if default password used.
    *                                 - Returns the login view with error messages if authentication fails.
    */
    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> Login(LoginViewModel model)
    {
        if (!ModelState.IsValid)
            return View(model);

        var admin = _context.Admins.SingleOrDefault(a => a.Username == model.Username);
        if (admin == null || !BCrypt.Net.BCrypt.Verify(model.Password, admin.PasswordHash))
        {
            ModelState.AddModelError("", "Invalid username or password");
            return View(model);
        }

        // 🔹 Check if the password is still default
        bool needsPasswordUpdate = admin.IsDefaultPassword; // A new column in DB

        // 🔹 Store username for the password update modal
        ViewData["NeedsPasswordUpdate"] = needsPasswordUpdate ? "true" : "false";


        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, admin.Username),
            new Claim(ClaimTypes.Role, "Admin")
        };

        var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var authProperties = new AuthenticationProperties { IsPersistent = false };

        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme,
                                    new ClaimsPrincipal(claimsIdentity),
                                    authProperties);

        if (admin.IsDefaultPassword)
        {
            return RedirectToAction("ChangePassword");
        }


        return RedirectToAction("Dashboard", "Home");
    }

    /**
    * Logs out the current admin user and clears authentication cookies.
    * 
    * @returns {Task<IActionResult>} - A task representing the async operation, 
    *                                  which redirects to the login view after logging out.
    */
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme,
            new AuthenticationProperties 
            { 
                ExpiresUtc = DateTime.UtcNow,
                IsPersistent = false 
            }
        );
        Response.Cookies.Append(".AspNetCore.Cookies", "", new CookieOptions
        {
            Expires = DateTime.UtcNow.AddDays(-1),
            Secure = true,
            HttpOnly = true
        });
        return RedirectToAction("Login");
    }


    /**
    * Verifies the entered password against the stored hash using BCrypt.
    * 
    * @param {string} enteredPassword - The plain text password entered by the user.
    * @param {string} storedHash - The hashed password stored in the database.
    * 
    * @returns {boolean} - True if the entered password matches the stored hash; otherwise, false.
    */
    private bool VerifyPassword(string enteredPassword, string storedHash)
    {
        // print hash of entered password
        Console.WriteLine(BCrypt.Net.BCrypt.HashPassword(enteredPassword));
        return BCrypt.Net.BCrypt.Verify(enteredPassword, storedHash);
    }

    /**
    * Displays the change password view for the currently authenticated admin.
    * 
    * @returns {IActionResult} - The change password view for the authenticated admin user.
    */
    [HttpGet]
    public IActionResult ChangePassword()
    {
        string username = User.Identity.Name;
        var admin = _context.Admins.SingleOrDefault(a => a.Username == username);

        if (admin != null)
        {
            ViewData["IsDefaultPassword"] = admin.IsDefaultPassword;
        }

        return View();
    }


    /**
    * Handles the password change request for the current admin user.
    * Verifies the current password before updating to a new one.
    * 
    * @param {ChangePasswordViewModel} model - The view model containing the current and new passwords.
    * 
    * @returns {IActionResult} - The change password view:
    *                           - Displays success or error messages based on the password update process.
    */
    [HttpPost]
    public IActionResult ChangePassword(ChangePasswordViewModel model)
    {
        if (!ModelState.IsValid)
            return View(model);

        string username = User.Identity.Name;
        var admin = _context.Admins.SingleOrDefault(a => a.Username == username);

        if (admin == null)
        {
            TempData["Error"] = "Admin not found.";
            return RedirectToAction("ChangePassword");
        }

        // 🔹 Verify the current password
        if (!BCrypt.Net.BCrypt.Verify(model.CurrentPassword, admin.PasswordHash))
        {
            TempData["Error"] = "Current password is incorrect.";
            return RedirectToAction("ChangePassword");
        }

        // 🔹 Hash and update the new password
        admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.NewPassword);
        admin.IsDefaultPassword = false;
        _context.SaveChanges();

        TempData["Success"] = "Password updated successfully!";
        // return RedirectToAction("Logout");
        // Stay at the same page
        return View();
    }

}