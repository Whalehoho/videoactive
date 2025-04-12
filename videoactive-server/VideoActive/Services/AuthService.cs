using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VideoActive.Models;

public class AuthService
{
    private readonly IConfiguration _config;
    private readonly ApplicationDbContext _context;

    public AuthService(IConfiguration config, ApplicationDbContext context)
    {
        _config = config;
        _context = context;
    }

    /**
    * Validates a JWT token and returns the ClaimsPrincipal if the token is valid.
    * 
    * @param {string} token - The JWT token to be validated.
    * 
    * @returns {ClaimsPrincipal?} - Returns a ClaimsPrincipal if the token is valid; otherwise, null.
    */
    public ClaimsPrincipal? ValidateJwtToken(string token)
    {
        var key = Encoding.UTF8.GetBytes(_config["JwtSettings:Key"]);
        var tokenHandler = new JwtSecurityTokenHandler();
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = _config["JwtSettings:Issuer"],
            ValidateAudience = true,
            ValidAudience = _config["JwtSettings:Audience"],
            ValidateLifetime = true
        };

        try
        {
            return tokenHandler.ValidateToken(token, validationParameters, out _);
        }
        catch
        {
            return null;
        }
    }

    /**
    * Extracts the user email from the JWT token in the authorization header 
    * and retrieves the corresponding user from the database.
    * 
    * @param {string} authHeader - The authorization header containing the JWT token.
    * 
    * @returns {Task<User?>} - A task representing the async operation:
    *                           - Returns the user if found, or null if the token is invalid or user not found.
    */
    public async Task<User?> GetUserFromHeader(string authHeader)
    {
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            return null;

        var token = authHeader.Substring("Bearer ".Length).Trim();
        var principal = ValidateJwtToken(token);
        if (principal == null)
            return null;

        var email = principal.FindFirst(ClaimTypes.Email)?.Value;
        if (string.IsNullOrEmpty(email))
            return null;

        return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
    }

    /**
    * Extracts the user email from the provided JWT token and retrieves the corresponding user from the database.
    * 
    * @param {string} token - The JWT token to extract the user information from.
    * 
    * @returns {Task<User?>} - A task representing the async operation:
    *                           - Returns the user if found, or null if the token is invalid or user not found.
    */
    public async Task<User?> GetUserFromToken(string token)
    {
        var principal = ValidateJwtToken(token);
        if (principal == null)
            return null;

        var email = principal.FindFirst(ClaimTypes.Email)?.Value;
        if (string.IsNullOrEmpty(email))
            return null;

        return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
    }

    /**
    * Generates a JWT token for the specified user email for authentication.
    * 
    * @param {string} email - The email of the user for whom the JWT token will be generated.
    * 
    * @returns {string} - The generated JWT token for authentication.
    */
    public string GenerateJwtToken(string email)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtSettings:Key"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.Email, email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _config["JwtSettings:Issuer"],
            audience: _config["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
