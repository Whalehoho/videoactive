using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using VideoActive.Models;
using Microsoft.AspNetCore.Authorization;
namespace VideoActive.Controllers;
/// <summary>
/// Handles the core admin-protected pages such as dashboard, privacy, and error views.
/// Access is restricted to users with the "Admin" role.
/// </summary>
[Authorize(Roles = "Admin")]
public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    /**
     * Initializes a new instance of the HomeController class.
     * 
     * @param {ILogger<HomeController>} logger - An instance of the logger for logging controller actions.
     */
    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    /**
     * Displays the main admin index page.
     * Redirects to the login page if the user is not authenticated.
     * 
     * @returns {IActionResult} - The index view or a redirection to the login page if not authenticated.
     */
    public IActionResult Index()
    {
        if (!User.Identity.IsAuthenticated) 
        {
            return RedirectToAction("Login", "Admin"); // ✅ Redirect if not authenticated
        }

        return View();
    }

    /**
     * Displays the privacy policy page.
     * 
     * @returns {IActionResult} - The privacy view.
     */
    public IActionResult Privacy()
    {
        return View();
    }

    /**
     * Displays the dashboard page.
     * 
     * @returns {IActionResult} - The dashboard view.
     */
    public IActionResult Dashboard()
    {
        return View();
    }

    /**
     * Displays the error page when an unhandled error occurs.
     * Response is not cached by any location.
     * 
     * @returns {IActionResult} - The error view populated with the current request ID.
     */
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
