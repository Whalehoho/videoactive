import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Handles POST requests to upload an image for user profile.
 *
 * This function performs the following actions:
 * - Retrieves the uploaded file from the form data.
 * - Checks for the presence of the file and returns a 400 error if no file is uploaded.
 * - Retrieves the AuthToken from cookies to authenticate the request.
 * - If the AuthToken is missing, returns a 401 error indicating the unauthorized request.
 * - Forwards the request to the backend to update the user's image.
 * - Returns the backend's response, which includes the URL of the uploaded image.
 *
 * @param {Request} req - The request object containing the HTTP request details and form data.
 * @returns {NextResponse} A JSON response with the uploaded image URL or an error message.
 */

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Get AuthToken from cookies
    const cookieStore = await cookies();
    const authToken = cookieStore.get("AuthToken")?.value;

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized: Missing AuthToken" }, { status: 401 });
    }

    // Forward the request to the backend with Authorization header
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/updateImage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData, // Forward formData as it is
    });

    if (!backendResponse.ok) {
      return NextResponse.json({ error: "Failed to upload image" }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data); // Expected response: { url: "https://your-image-server.com/image.jpg" }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
