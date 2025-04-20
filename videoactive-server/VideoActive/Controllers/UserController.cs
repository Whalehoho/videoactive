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
using Amazon.Runtime; // For SessionAWSCredentials
using System.Net.Http; // For HttpClient
using System.Net.Http.Headers; // For MediaTypeHeaderValue
using System.Security.Cryptography;
using Amazon;
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
            Console.WriteLine("Started uploading file");

            var content = new MultipartFormDataContent();
            var fileContent = new StreamContent(file.OpenReadStream());
            fileContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);

            content.Add(fileContent, "file", file.FileName);
            content.Add(new StringContent(user.UID.ToString()), "userId");
            content.Add(new StringContent(Path.GetExtension(file.FileName)), "extension");
            content.Add(new StringContent(user.ProfilePic ?? ""), "oldImageUrl");

            var apiUrl = "https://yxq6c9r1hh.execute-api.ap-southeast-1.amazonaws.com/default/video-active-s3-trigger";
            var accessKey = _config["AWS:AccessKey"];
            var secretKey = _config["AWS:SecretKey"];
            var regionName = _config["AWS:Region"];
            var region = RegionEndpoint.GetBySystemName(regionName);

            using (var client = new HttpClient())
            {
                var requestMessage = new HttpRequestMessage(HttpMethod.Post, apiUrl);

                // Manually set the full content-type with boundary
                requestMessage.Headers.TryAddWithoutValidation("Content-Type", content.Headers.ContentType.ToString());

                requestMessage.Content = content;
                // Ensure the content-type is properly set in the logs for debugging
                Console.WriteLine($"Content-Type before signing: {content.Headers.ContentType}");
                await SignAwsRequest(requestMessage, content, "execute-api", region, accessKey, secretKey);
                // Ensure the content-type is properly set in the logs for debugging
                Console.WriteLine($"Content-Type after signing: {requestMessage.Content.Headers.ContentType}");
                var response = await client.SendAsync(requestMessage);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var lambdaResponse = JsonSerializer.Deserialize<Dictionary<string, string>>(responseContent);
                    if (lambdaResponse != null && lambdaResponse.TryGetValue("imageUrl", out var imageUrl))
                    {
                        user.ProfilePic = imageUrl;
                        await _context.SaveChangesAsync();

                        Console.WriteLine("Done upload");
                        return Ok(new { message = "success", details = "Image uploaded successfully", imageUrl });
                    }
                    else
                    {
                        return StatusCode(500, new { error = "Invalid Lambda response", details = responseContent });
                    }
                }
                else
                {
                    Console.WriteLine("error content " + responseContent);
                    return StatusCode(500, new { error = "API Gateway failed", details = responseContent });
                }
            }
        }
        catch (AmazonServiceException ex)
        {
            Console.WriteLine($"AWS Error: {ex.Message}");
            return StatusCode(500, new { error = "AWS service error", details = ex.Message });
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error: " + ex.Message);
            return StatusCode(500, new { error = "Image upload failed", details = ex.Message });
        }
    }

        /**
         * Signs an AWS HTTP request using Signature Version 4.
         * This method handles multipart content, computes the content hash, builds the canonical request,
         * and adds AWS-compliant authorization headers to the request.
         * 
         * @param {HttpRequestMessage} request - The HTTP request message to be signed.
         * @param {HttpContent} content - The content to be included in the request body, including headers.
         * @param {string} service - The AWS service name (e.g., "s3").
         * @param {RegionEndpoint} region - The AWS region (e.g., RegionEndpoint.APSoutheast1).
         * @param {string} accessKey - The AWS access key ID.
         * @param {string} secretKey - The AWS secret access key.
         * @returns {Task} An asynchronous task that completes after the request has been signed.
         */
        private async Task SignAwsRequest(HttpRequestMessage request, HttpContent content, string service, RegionEndpoint region, string accessKey, string secretKey)
        {
            // Step 1: Get exact body with headers (includes multipart boundaries)
            Console.WriteLine("Multipart Content-Type: " + content.Headers.ContentType);
            var bodyStream = new MemoryStream();
            await content.CopyToAsync(bodyStream);
            bodyStream.Position = 0;
            var bodyBytes = bodyStream.ToArray();

            // Step 2: Compute body hash for signing
            var bodyHash = ToHex(SHA256.HashData(bodyBytes));

            // Step 3: Build AWS Signature V4
            var now = DateTime.UtcNow;
            var amzDate = now.ToString("yyyyMMddTHHmmssZ");
            var dateStamp = now.ToString("yyyyMMdd");

            var host = request.RequestUri.Host;
            
            // Include content-type in canonical headers for signing
            var contentTypeValue = content.Headers.ContentType.ToString();
            var canonicalHeaders = $"content-type:{contentTypeValue}\n" +
                                $"host:{host}\n" + 
                                $"x-amz-date:{amzDate}\n";
            
            // Include content-type in signed headers
            var signedHeaders = "content-type;host;x-amz-date";

            var canonicalRequest = $"{request.Method}\n{request.RequestUri.AbsolutePath}\n\n{canonicalHeaders}\n{signedHeaders}\n{bodyHash}";
            var hashedCanonicalRequest = ToHex(SHA256.HashData(Encoding.UTF8.GetBytes(canonicalRequest)));

            var credentialScope = $"{dateStamp}/{region.SystemName}/{service}/aws4_request";
            var stringToSign = $"AWS4-HMAC-SHA256\n{amzDate}\n{credentialScope}\n{hashedCanonicalRequest}";

            var signingKey = GetSignatureKey(secretKey, dateStamp, region.SystemName, service);
            var signature = ToHex(HmacSHA256(signingKey, stringToSign));

            var authorizationHeader = $"AWS4-HMAC-SHA256 Credential={accessKey}/{credentialScope}, SignedHeaders={signedHeaders}, Signature={signature}";

            // Step 4: Apply signed headers
            request.Headers.Remove("x-amz-date");
            request.Headers.TryAddWithoutValidation("x-amz-date", amzDate);
            request.Headers.TryAddWithoutValidation("Authorization", authorizationHeader);

            // Step 5: Reset bodyStream and reassign to request.Content
            bodyStream.Position = 0;
            var newContent = new StreamContent(bodyStream);

            // Add back all original headers (especially multipart content-type with boundary)
            foreach (var header in content.Headers)
            {
                newContent.Headers.TryAddWithoutValidation(header.Key, header.Value);
            }

            request.Content = newContent;
        }


        /**
         * Generates the AWS signing key for Signature Version 4 using the provided credentials and request scope.
         * 
         * @param {string} key - The AWS secret access key.
         * @param {string} dateStamp - The date in 'yyyyMMdd' format.
         * @param {string} regionName - The AWS region name (e.g., "ap-southeast-1").
         * @param {string} serviceName - The name of the AWS service (e.g., "s3").
         * @returns {byte[]} A byte array containing the derived signing key.
         */
        private byte[] GetSignatureKey(string key, string dateStamp, string regionName, string serviceName)
        {
            var kDate = HmacSHA256(Encoding.UTF8.GetBytes("AWS4" + key), dateStamp);
            var kRegion = HmacSHA256(kDate, regionName);
            var kService = HmacSHA256(kRegion, serviceName);
            return HmacSHA256(kService, "aws4_request");
        }
        /**
         * Computes a HMAC-SHA256 hash using the specified key and data.
         * 
         * @param {byte[]} key - The key used for the HMAC operation.
         * @param {string} data - The input string to hash.
         * @returns {byte[]} A byte array containing the HMAC-SHA256 hash.
         */
        private byte[] HmacSHA256(byte[] key, string data)
        {
            using var hmac = new HMACSHA256(key);
            return hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        }

    private string ToHex(byte[] bytes) =>
        BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant();

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



public class UpdateUserRequest
{
    public string? Username { get; set; }
    public bool? Gender { get; set; }
    public string? Description { get; set; }
}
