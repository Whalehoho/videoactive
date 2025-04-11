import { cookies } from "next/headers";
import { NextResponse } from "next/server";
/**
 * Handles POST requests to update the user's information.
 *
 * This function performs the following actions:
 * - Retrieves the AuthToken from the cookies.
 * - Logs the received request method and the AuthToken for debugging purposes.
 * - If the AuthToken is missing, returns a 401 error indicating the missing token.
 * - Reads the request body and logs it for debugging purposes.
 * - Sends a POST request to the backend API to update the user's information.
 * - Returns the response from the backend with the updated user data or an error message if the operation fails.
 *
 * @param {Request} req - The request object containing the HTTP request details.
 * @returns {NextResponse} A JSON response with the updated user data or an error message.
 */
export async function POST(req) {
  try {
    // const authToken = req.headers.get("Authorization")?.split(" ")[1];

    const cookieStore = await cookies();
    const authToken = cookieStore.get("AuthToken")?.value;

    console.log("Received request in Next.js API:", req.method);
    console.log("AuthToken from cookies:", authToken);

    if (!authToken) {
      return NextResponse.json({ error: "Missing AuthToken" }, { status: 401 });
    }

    // ✅ Read request body
    const body = await req.json();
    console.log("Request body received in Next.js API:", body);

    // ✅ Send request to .NET backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/updateUser`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    console.log("Response status from .NET backend:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error response from .NET backend:", errorText);
      return NextResponse.json({ error: "Failed to update user" }, { status: res.status });
    }

    const data = await res.json();
    console.log("Success response from .NET backend:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
