using System.Net;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Amazon.S3;
using Amazon.S3.Transfer;
using Microsoft.AspNetCore.WebUtilities;
using Amazon.S3.Model;
using Amazon;
using Microsoft.Net.Http.Headers;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace UploadImageLambda;
    /**
     * Represents the main Lambda function that handles image uploads to S3 and optional deletion of previous images.
     */
public class Function
{
    
    private readonly string bucketName = Environment.GetEnvironmentVariable("S3_BUCKET_NAME") ?? "my-video-active-bucket";
    private readonly RegionEndpoint bucketRegion = RegionEndpoint.GetBySystemName(Environment.GetEnvironmentVariable("AWS_BUCKET_REGION") ?? "ap-southeast-1");
    private readonly IAmazonS3 s3Client;

    public Function()
    {
        s3Client = new AmazonS3Client(bucketRegion);
    }

    /**
    * Handles incoming API Gateway requests for image upload.
    * Parses multipart/form-data to extract fields and image, uploads image to S3, 
    * and deletes any previous image if provided.
    *
    * @param {APIGatewayProxyRequest} request - The incoming HTTP request from API Gateway.
    * @param {ILambdaContext} context - The Lambda execution context.
    * @returns {Task<APIGatewayProxyResponse>} A response containing the image URL or an error.
    */
    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            // Try both case variants
            if (!request.Headers.TryGetValue("content-type", out var contentTypeHeader) && 
                !request.Headers.TryGetValue("Content-Type", out contentTypeHeader))
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = (int)HttpStatusCode.BadRequest,
                    Body = "Missing content-type header"
                };
            }

            var boundary = GetBoundary(contentTypeHeader);
            if (string.IsNullOrEmpty(boundary))
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = (int)HttpStatusCode.BadRequest,
                    Body = "Invalid content-type header"
                };
            }

            await using var stream = request.IsBase64Encoded
                ? new MemoryStream(Convert.FromBase64String(request.Body))
                : new MemoryStream(System.Text.Encoding.UTF8.GetBytes(request.Body));

            var reader = new MultipartReader(boundary, stream);

            string userId = null;
            string extension = null;
            string oldImageUrl = null;
            MemoryStream imageStream = null;
            string fileName = null;
            string contentType = null;

            MultipartSection section;
            while ((section = await reader.ReadNextSectionAsync()) != null)
            {
                var hasContentDispositionHeader = ContentDispositionHeaderValue.TryParse(section.ContentDisposition, out var contentDisposition);

                if (!hasContentDispositionHeader || string.IsNullOrEmpty(contentDisposition?.Name.Value)) continue;

                var key = contentDisposition.Name.Value;

                if (contentDisposition.DispositionType.Equals("form-data") && contentDisposition.FileName.HasValue)
                {
                    // File section
                    fileName = contentDisposition.FileName.Value;
                    contentType = section.ContentType ?? "application/octet-stream";
                    imageStream = new MemoryStream();
                    await section.Body.CopyToAsync(imageStream);
                    imageStream.Position = 0;
                }
                else
                {
                    // Text fields
                    using var sr = new StreamReader(section.Body);
                    var value = await sr.ReadToEndAsync();

                    if (key == "userId")
                        userId = value;
                    else if (key == "extension")
                        extension = value;
                    else if (key == "oldImageUrl")
                        oldImageUrl = value;
                }
            }

            if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(extension) || imageStream == null || imageStream.Length == 0) {

                return new APIGatewayProxyResponse
                {
                    StatusCode = (int)HttpStatusCode.BadRequest,
                    Body = "Missing form fields"
                };
            }

            // Upload the image to S3
            string keyName = $"videoCall/userImages/{userId}/{Guid.NewGuid()}{extension}";

            var uploadRequest = new TransferUtilityUploadRequest
            {
                InputStream = imageStream,
                Key = keyName,
                BucketName = bucketName,
                ContentType = contentType,
                CannedACL = S3CannedACL.PublicRead
            };

            var transferUtility = new TransferUtility(s3Client);
            await transferUtility.UploadAsync(uploadRequest);

            // Delete old image if provided
            if (!string.IsNullOrEmpty(oldImageUrl))
            {
                try
                {
                    var oldKey = ExtractKeyFromUrl(oldImageUrl);
                    if (!string.IsNullOrEmpty(oldKey))
                    {
                        await s3Client.DeleteObjectAsync(bucketName, oldKey);
                    }
                }
                catch (Exception ex)
                {
                    context.Logger.LogLine($"Failed to delete old image: {ex.Message}");
                }
            }

            var imageUrl = $"https://{bucketName}.s3.{bucketRegion.SystemName}.amazonaws.com/{keyName}";

            return new APIGatewayProxyResponse
            {
                StatusCode = (int)HttpStatusCode.OK,
                Body = System.Text.Json.JsonSerializer.Serialize(new { imageUrl }),
                Headers = new Dictionary<string, string>
                {
                    { "Content-Type", "application/json" },
                    { "Access-Control-Allow-Origin", "*" }
                }
            };
        }
        catch (Exception ex)
        {
            context.Logger.LogLine($"Lambda error: {ex.Message}");
            return new APIGatewayProxyResponse
            {
                StatusCode = 500,
                Body = $"Internal server error: {ex.Message}"
            };
        }
    }
    /**
    * Extracts the boundary string from the multipart content-type header.
    * Used by the MultipartReader to split incoming form-data sections.
    * 
    * @param {string} contentType - The Content-Type header from the request.
    * @returns {string} The boundary string used in multipart form parsing.
    */
    private string GetBoundary(string contentType)
    {
        var elements = contentType.Split(';');
        var boundaryElement = elements.FirstOrDefault(entry => entry.Trim().StartsWith("boundary=", StringComparison.OrdinalIgnoreCase));
        return boundaryElement?.Split('=')[1].Trim('"');
    }

    /**
    * Extracts the S3 object key from a full image URL.
    * Useful for locating and deleting old images stored in S3.
    * 
    * @param {string} imageUrl - The full image URL.
    * @returns {string} The object key part of the S3 URL.
    */
    private string ExtractKeyFromUrl(string imageUrl)
    {
        var uri = new Uri(imageUrl);
        return uri.AbsolutePath.TrimStart('/');
    }
}
