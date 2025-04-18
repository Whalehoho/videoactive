import { cookies } from "next/headers";
import { NextResponse } from "next/server";
/**
 * Handles GET requests to retrieve all messages for a user by calling the backend API.
 *
 * This function performs the following actions:
 * - Retrieves the AuthToken from the cookies.
 * - If the AuthToken is missing, returns a 401 error indicating the missing token.
 * - Logs the AuthToken for debugging purposes.
 * - Sends a GET request to the backend API to fetch the user's messages.
 * - Returns the response from the backend, containing the messages, or an error message if the session is invalid.
 *
 * @param {Request} req - The request object containing the HTTP request details.
 * @returns {NextResponse} A JSON response with the retrieved messages or an error message.
 */
export async function GET(req) {
    try {
        // const authToken = req.headers.get("Authorization")?.split(" ")[1];

        const cookieStore = await cookies();
        const authToken = cookieStore.get("AuthToken")?.value;

        if (!authToken) {
        return NextResponse.json({ error: "Missing AuthToken" }, { status: 401 });
        }

        console.log("authToken in get messages: ", authToken);

        // ✅ Call backend /getMessages to get the user's messages
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/message/getAllMessages`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
        },
        });

        if (!res.ok) {
            console.log("res in get messages: ", res);
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        return res; // ✅ Return messages
    } catch (error) {
        console.error("User fetch error:", error);
        return NextResponse.json({ error: "Failed to retrieve messages" }, { status: 500 });
    }
}