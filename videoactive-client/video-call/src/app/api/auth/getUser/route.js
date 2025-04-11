import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req) {
  /**
   * Handles GET requests to fetch user information using an AuthToken stored in cookies.
   *
   * The function performs the following actions:
   * - Retrieves the AuthToken from the cookies.
   * - Validates the presence of the AuthToken; returns an error if missing.
   * - Sends a request to the backend to retrieve user information, using the AuthToken for authorization.
   * - If the token is invalid or the backend request fails, returns an error response.
   * - On successful response, returns the user details from the backend.
   *
   * @param {Request} req - The request object containing the HTTP request details.
   * @returns {NextResponse} A JSON response containing either user data or error information.
   */
  try {
    // const authToken = req.headers.get("Authorization")?.split(" ")[1];

    const cookieStore = await cookies();
    const authToken = cookieStore.get("AuthToken")?.value;
    

    if (!authToken) {
      return NextResponse.json({ error: "Missing AuthToken" }, { status: 401 });
    }

    // ✅ Call backend /validate-token since it also returns user info
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/getUser`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    return res; // ✅ Return user details
  } catch (error) {
    console.error("User fetch error:", error);
    return NextResponse.json({ error: "Failed to retrieve user data" }, { status: 500 });
  }
}
