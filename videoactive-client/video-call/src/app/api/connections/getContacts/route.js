import { cookies } from "next/headers";
import { NextResponse } from "next/server";
/**
 * Handles GET requests to retrieve the user's contacts by fetching contact details from the backend.
 *
 * This function performs the following actions:
 * - Retrieves the AuthToken from the cookies.
 * - If the AuthToken is missing, returns a 401 error with a message indicating the missing token.
 * - Calls the backend to retrieve the user's contacts using the AuthToken.
 * - Returns the response containing the contact details if successful, or an error message if the session is invalid.
 *
 * @param {Request} req - The request object containing the HTTP request details.
 * @returns {NextResponse} A JSON response with the contact details or an error message.
 */
export async function GET(req) {
    try {
        // const authToken = req.headers.get("Authorization")?.split(" ")[1];

        const cookieStore = await cookies();
        const authToken = cookieStore.get("AuthToken")?.value;

        if (!authToken) {
        return NextResponse.json({ error: "Missing AuthToken" }, { status: 401 });
        }

        // ✅ Call backend /getContacts to get the user's friends' contacts
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/connections/getContacts`, {
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

        return res; // ✅ Return contact details
    } catch (error) {
        console.error("User fetch error:", error);
        return NextResponse.json({ error: "Failed to retrieve user data" }, { status: 500 });
    }
}
