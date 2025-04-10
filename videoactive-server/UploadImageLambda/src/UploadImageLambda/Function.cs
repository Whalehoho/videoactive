using System;
using System.IO;
using System.Collections.Generic;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace UploadImageLambda
{
    public class Function
    {
        private readonly string bucketName = "my-video-active-bucket";
        private readonly RegionEndpoint region = RegionEndpoint.APSoutheast1;

        public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
        {
            try
            {
                var json = JsonSerializer.Deserialize<Dictionary<string, string>>(request.Body);

                if (json == null ||
                    !json.TryGetValue("image", out var base64Image) ||
                    !json.TryGetValue("extension", out var extension) ||
                    !json.TryGetValue("userId", out var userId))
                {
                    return new APIGatewayProxyResponse
                    {
                        StatusCode = 400,
                        Body = JsonSerializer.Serialize(new { message = "error", details = "Missing required fields: image, extension, userId" }),
                        Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                    };
                }

                byte[] fileBytes = Convert.FromBase64String(base64Image);

                // Generate consistent file key
                string keyName = $"videoCall/profile_{userId}{extension}";

                using var stream = new MemoryStream(fileBytes);
                using var client = new AmazonS3Client(region);
                var putRequest = new PutObjectRequest
                {
                    BucketName = bucketName,
                    Key = keyName,
                    InputStream = stream,
                    ContentType = GetContentType(extension),
                    CannedACL = S3CannedACL.PublicRead
                };

                await client.PutObjectAsync(putRequest);

                // Optionally delete old image if provided
                if (json.TryGetValue("oldImageUrl", out var oldImageUrl) && !string.IsNullOrEmpty(oldImageUrl))
                {
                    var oldKey = ExtractKeyFromUrl(oldImageUrl);
                    if (!string.IsNullOrEmpty(oldKey))
                    {
                        await client.DeleteObjectAsync(new DeleteObjectRequest
                        {
                            BucketName = bucketName,
                            Key = oldKey
                        });
                    }
                }

                var imageUrl = $"https://{bucketName}.s3.amazonaws.com/{keyName}";

                return new APIGatewayProxyResponse
                {
                    StatusCode = (int)HttpStatusCode.OK,
                    Body = JsonSerializer.Serialize(new { message = "success", imageUrl }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }
            catch (Exception ex)
            {
                context.Logger.LogLine($"Error: {ex.Message}");
                return new APIGatewayProxyResponse
                {
                    StatusCode = 500,
                    Body = JsonSerializer.Serialize(new { message = "error", details = ex.Message }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }
        }

        private string GetContentType(string extension)
        {
            return extension switch
            {
                ".png" => "image/png",
                ".jpeg" => "image/jpeg",
                ".jpg" => "image/jpeg",
                _ => "application/octet-stream"
            };
        }

        private string ExtractKeyFromUrl(string url)
        {
            try
            {
                var uri = new Uri(url);
                return uri.AbsolutePath.TrimStart('/');
            }
            catch
            {
                return null;
            }
        }
    }
}
