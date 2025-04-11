import { cookies } from "next/headers";
import { NextResponse } from "next/server";
/**
 * Handles POST requests to send a message from one user to another by calling the backend API.
 *
 * This function performs the following actions:
 * - Retrieves the AuthToken from the cookies.
 * - If the AuthToken is missing, returns a 401 error indicating the missing token.
 * - Extracts the `messageText`, `senderId`, and `receiverId` from the request body.
 * - Sends a POST request to the backend API to add the message.
 * - Returns the response from the backend or an error message if the session is invalid or any other issue occurs.
 *
 * @param {Request} request - The request object containing the HTTP request details.
 * @returns {NextResponse} A JSON response with the result of the backend request or an error message.
 */
export async function POST(request) {
    try{
        // const authToken = request.headers.get("Authorization")?.split(" ")[1];

        const cookieStore = await cookies();
        const authToken = cookieStore.get("AuthToken")?.value;
        
        if (!authToken) {
            return NextResponse.json({ error: "Missing AuthToken" }, { status: 401 });
        }

        const body = await request.json();
        const { messageText, senderId, receiverId } = body;

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/message/addMessage`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ messageText, senderId, receiverId }),
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        return res


    } catch (error) {
        console.error("User fetch error:", error);
        return NextResponse.json({ error: "Failed to add message" }, { status: 500 });
    }
}