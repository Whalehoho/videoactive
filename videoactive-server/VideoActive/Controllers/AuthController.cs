using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using VideoActive.Models;
using Microsoft.AspNetCore.Authorization;

/// <summary>
/// AuthController Controller for managing user authentication with google.
/// Provide JWT Token for user.
/// </summary>
[Route("api/auth")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly ApplicationDbContext _context;

    public AuthController(AuthService authService, ApplicationDbContext context)
    {
        _authService = authService;
        _context = context;
    }

    /**
    * Initiates the Google OAuth login flow by redirecting the user to the Google authentication page.
    * 
    * @returns {IActionResult} - A challenge result that redirects to Google's OAuth login.
    */
    [HttpGet("google-login")]
    public IActionResult GoogleLogin()
    {
        var redirectUrl = Url.Action(nameof(GoogleResponse), "Auth");
        Console.WriteLine("Redirect URL: " + redirectUrl);
        // var redirectUrl = "https://8e7f-2001-f40-98e-ab91-f84f-df17-f719-6909.ngrok-free.app/auth/google/callback";
        var properties = new AuthenticationProperties { RedirectUri = redirectUrl };
        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    /**
    * Handles the callback from Google after successful authentication.
    * Extracts user information (email and username) and issues a JWT token.
    * 
    * @returns {Task<IActionResult>} - A task representing the async operation, 
    *                                  containing an HTML script that sends the token to the client via postMessage.
    */
    [HttpGet("google-response")]
    public async Task<IActionResult> GoogleResponse()
    {
        var authenticateResult = await HttpContext.AuthenticateAsync();
        if (!authenticateResult.Succeeded)
            return BadRequest("Error during authentication");

        var claims = authenticateResult.Principal.Identities.FirstOrDefault()?.Claims;
        var email = claims?.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
        var username = claims?.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;

        if (string.IsNullOrEmpty(email))
            return BadRequest("Unable to retrieve user email");

        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (existingUser == null)
        {
            var newUser = new User
            {
                Username = username, // could be potential null
                Email = email,
                Status = UserStatus.Online
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();
        }

        var token = _authService.GenerateJwtToken(email);

        Response.Cookies.Append("AuthToken", token, new CookieOptions
         {
            Domain="kc123.me",
            Path = "/",
            HttpOnly = true,
            Secure = true, // Set to true in production
            SameSite = SameSiteMode.Lax,
            Expires = DateTime.UtcNow.AddHours(1)
         });

        // Return token using postMessage
        var script = $@"
            <script>
                window.opener.postMessage({{ message: 'Login successful', token: '{token}' }}, '*');
                window.close();
            </script>";
        return Content(script, "text/html");

    }

    /**
    * Validates the JWT token from the Authorization header and returns user details if valid.
    * 
    * @returns {Task<IActionResult>} - A task representing the async operation,
    *                                  containing user data if the token is valid, 
    *                                  or an Unauthorized status if the token is invalid.
    */
    [HttpGet("getUser")]
    public async Task<IActionResult> ValidateToken()
    {
        var user = await _authService.GetUserFromHeader(Request.Headers["Authorization"].ToString());
        if (user == null)
            return Unauthorized(new { message = "Invalid or expired token" });

        return Ok(new
        {   message = "success",
            user = new
            {
                user.UID,
                user.Username,
                user.Email,
                user.ProfilePic,
                user.Status,
                user.Description,
                gender = user.Gender,
                user.CreatedAt
            }
        });
    }

    /**
    * Logs the user out by deleting authentication cookies.
    * 
    * @returns {IActionResult} - A result indicating the success of the logout operation.
    */
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        var cookieOptions = new CookieOptions
        {
            Domain = "kc123.me",  // MUST match the one used when setting
            Path = "/"
        };

        Response.Cookies.Delete("AuthToken", cookieOptions);
        Response.Cookies.Delete(".AspNetCore.Cookies", cookieOptions); // if needed

        return Ok(new { message = "Logged out successfully" });
    }

}
