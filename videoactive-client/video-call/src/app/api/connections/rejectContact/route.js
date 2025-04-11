import { cookies } from "next/headers";
import { NextResponse } from "next/server";
/**
 * Handles POST requests to reject a contact by sending a request to the backend with the AuthToken and friendId.
 *
 * This function performs the following actions:
 * - Retrieves the AuthToken from the cookies.
 * - If the AuthToken is missing, returns a 401 error with a message indicating the missing token.
 * - Extracts the `friendId` from the request body.
 * - Sends a request to the backend to reject the contact using the AuthToken and friendId.
 * - Returns the response data if the contact is successfully rejected, or an error message if something fails.
 *
 * @param {Request} req - The request object containing the HTTP request details.
 * @returns {NextResponse} A JSON response with the result of the backend request or an error message.
 */
export async function POST(req) {
    try {
        // const authToken = req.headers.get("Authorization")?.split(" ")[1];

        const cookieStore = await cookies();
        const authToken = cookieStore.get("AuthToken")?.value;

        if (!authToken) {
        return NextResponse.json({ error: "Missing AuthToken" }, { status: 401 });
        }

        const { friendId } = await req.json(); // ✅ Extract friendId from request body

        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/connections/rejectContact`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ friendId }),
        });

        const result = await response.json();
        if (!response.ok) {
        console.error("Error response from .NET backend:", result);
        return NextResponse.json({ error: "Failed to reject contact" }, { status: response.status });
        }

        console.log("Success response from .NET backend:", result);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error rejecting contact:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
    }
