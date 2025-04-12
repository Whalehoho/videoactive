using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using VideoActive.Models;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;
using System.IO;
using System.Text;
using System.Text.Json;

[Route("api/user")]
[ApiController]

/// <summary>
/// User Controller handles the CRUD of the user details and image upload.
/// </summary>
public class UserController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly ApplicationDbContext _context;
    private readonly AuthService _authService;

    public UserController(IConfiguration config, ApplicationDbContext context, AuthService authService)
    {
        _config = config;
        _context = context;
        _authService = authService;
    }

    /**
    * Updates the user's profile information such as username, gender, and description.
    * 
    * @param {UpdateUserRequest} request - Contains new values for the user's profile.
    * @returns {IActionResult} - Returns success with updated user info or error response.
    */
    [HttpPost("updateUser")]
    public async Task<IActionResult> UpdateUser([FromBody] UpdateUserRequest request)
    {
        var user = await _authService.GetUserFromHeader(Request.Headers["Authorization"].ToString());
        if (user == null)
            return Unauthorized(new { message = "error", details = "Invalid or expired token" });

        if (request == null)
            return BadRequest(new { message = "error", details = "Invalid input" });

        if (!string.IsNullOrWhiteSpace(request.Username))
            user.Username = request.Username;

        if (request.Gender.HasValue)
            user.Gender = request.Gender.Value;

        if (!string.IsNullOrWhiteSpace(request.Description))
            user.Description = request.Description;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "success",
            details = "User updated successfully",
            user = new
            {
                user.UID,
                user.Username,
                user.Email,
                user.Gender,
                user.Description
            }
        });
    }

    /**
    * Updates the user's profile picture by sending the image to a Lambda function for S3 processing.
    * Validates image format and handles error responses from the Lambda service.
    * 
    * @param {IFormFile} file - The uploaded image file from the client.
    * @returns {IActionResult} - Returns success with new image URL or error if upload fails.
    */

    [HttpPost("updateImage")]
    public async Task<IActionResult> UpdateImage(IFormFile file)
    {
        var user = await _authService.GetUserFromHeader(Request.Headers["Authorization"].ToString());
        if (user == null)
            return Unauthorized(new { message = "error", details = "Invalid or expired token" });

        if (file == null || file.Length == 0)
            return BadRequest(new { message = "error", details = "No file uploaded" });

        var allowedExtensions = new[] { ".png", ".jpeg", ".jpg" };
        var fileExtension = Path.GetExtension(file.FileName).ToLower();
        if (!allowedExtensions.Contains(fileExtension))
            return BadRequest(new { message = "error", details = "Only PNG and JPEG files are allowed" });

        try
        {
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            var fileBytes = ms.ToArray();
            var base64Image = Convert.ToBase64String(fileBytes);

            var payload = new
            {
                image = base64Image,
                extension = fileExtension,
                userId = user.UID.ToString(),
                oldImageUrl = user.ProfilePic
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            using var httpClient = new HttpClient();
            var lambdaUrl = "https://91yzrzswsk.execute-api.ap-southeast-1.amazonaws.com/default/video-active-s3-trigger";

            var response = await httpClient.PostAsync(lambdaUrl, content);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine("Lambda error: " + responseBody);
                return StatusCode((int)response.StatusCode, new { message = "Lambda error", details = responseBody });
            }

            var result = JsonSerializer.Deserialize<Dictionary<string, string>>(responseBody);
            if (result == null || !result.TryGetValue("imageUrl", out var imageUrl))
                return StatusCode(500, new { message = "error", details = "Lambda response missing imageUrl" });

            user.ProfilePic = imageUrl;
            await _context.SaveChangesAsync();

            return Ok(new { message = "success", imageUrl = user.ProfilePic });
        }
        catch (Exception ex)
        {
            Console.WriteLine("Image Upload Error: " + ex.Message);
            return StatusCode(500, new { message = "Image upload failed", details = ex.Message });
        }
    }

/**
 * [LEGACY/ALTERNATIVE] Uploads the user's profile picture directly to S3 using AWS SDK.
 * Deletes the previous image if it exists, and saves the new public image URL in the user's profile.
 * 
 * @param {IFormFile} file - The uploaded image file from the client.
 * @returns {IActionResult} - Returns success with image URL, or error if upload fails.
 */
// public async Task<IActionResult> UpdateImage(IFormFile file)
//     {
//         var user = await _authService.GetUserFromHeader(Request.Headers["Authorization"].ToString());
//         if (user == null)
//             return Unauthorized(new { message = "error", details = "Invalid or expired token" });

//         if (file == null || file.Length == 0)
//             return BadRequest(new { message = "error", details = "No file uploaded" });

//         // ✅ Validate file type (PNG & JPEG only)
//         var allowedExtensions = new[] { ".png", ".jpeg", ".jpg" };
//         var fileExtension = Path.GetExtension(file.FileName).ToLower();
//         if (!allowedExtensions.Contains(fileExtension))
//             return BadRequest(new { message = "error", details = "Only PNG and JPEG files are allowed" });

//         try
//         {
//             Console.WriteLine("Started uploading file");

//             // ✅ Retrieve AWS credentials from appsettings.json
//             var accessKey = _config["AWS:AccessKey"];
//             var secretKey = _config["AWS:SecretKey"];
//             var regionName = _config["AWS:Region"];
//             var bucketName = _config["AWS:BucketName"];

//             if (string.IsNullOrEmpty(accessKey) || string.IsNullOrEmpty(secretKey) || string.IsNullOrEmpty(regionName) || string.IsNullOrEmpty(bucketName))
//                 return StatusCode(500, new { message = "error", details = "AWS credentials are missing" });

//             Console.WriteLine("AWS Region: " + regionName);

//             var region = Amazon.RegionEndpoint.GetBySystemName(regionName);
//             var fileName = $"profile_{user.UID}{fileExtension}"; // ✅ Use user ID to avoid redundant uploads
//             var keyName = $"videoCall/{fileName}"; // ✅ Standardized file path in S3

//             using var client = new AmazonS3Client(accessKey, secretKey, region);

//             // ✅ Delete old image if it exists in S3
//             if (!string.IsNullOrEmpty(user.ProfilePic))
//             {
//                 var oldKey = user.ProfilePic.Replace($"https://{bucketName}.s3.amazonaws.com/", "");
//                 Console.WriteLine("Deleting old file: " + oldKey);

//                 var deleteRequest = new DeleteObjectRequest
//                 {
//                     BucketName = bucketName,
//                     Key = oldKey
//                 };

//                 await client.DeleteObjectAsync(deleteRequest);
//                 Console.WriteLine("Old file deleted successfully");
//             }

//             // ✅ Upload new image to S3
//             using var stream = file.OpenReadStream();
//             var putRequest = new PutObjectRequest
//             {
//                 BucketName = bucketName,
//                 Key = keyName,
//                 InputStream = stream,
//                 ContentType = file.ContentType,
//                 CannedACL = S3CannedACL.PublicRead // Make the file publicly accessible
//             };

//             await client.PutObjectAsync(putRequest);
//             Console.WriteLine("File uploaded successfully");

//             var imageUrl = $"https://{bucketName}.s3.amazonaws.com/{keyName}";

//             // ✅ Save new image URL to user profile in the database
//             user.ProfilePic = imageUrl;
//             await _context.SaveChangesAsync();

//             return Ok(new { message = "success", details = "Image uploaded successfully", imageUrl });
//         }
//         catch (AmazonS3Exception s3Ex)
//         {
//             Console.WriteLine("S3 Upload Error: " + s3Ex.Message);
//             return StatusCode(500, new { error = "S3 Upload failed", details = s3Ex.Message });
//         }
//         catch (Exception ex)
//         {
//             Console.WriteLine("Image Upload Error: " + ex.Message);
//             return StatusCode(500, new { error = "Image upload failed", details = ex.Message });
//         }
//     }


}

public class UpdateUserRequest
{
    public string? Username { get; set; }
    public bool? Gender { get; set; }
    public string? Description { get; set; }
}
