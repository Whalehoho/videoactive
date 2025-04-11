import { cookies } from "next/headers";
import { NextResponse } from "next/server";
/**
 * Handles POST requests to accept a contact request by interacting with the backend.
 *
 * This function performs the following actions:
 * - Retrieves the AuthToken from the cookies to authenticate the request.
 * - Extracts the `friendId` from the request body.
 * - Sends a POST request to the backend to accept the contact request, passing the `friendId` and AuthToken for authorization.
 * - If the backend responds with an error, returns an error response with the appropriate status.
 * - If the request is successful, returns the result from the backend.
 *
 * @param {Request} req - The request object containing the HTTP request details, including the `friendId` in the body.
 * @returns {NextResponse} A JSON response containing either the success result or an error message.
 */
export async function POST(req) {
    try {
        // const authToken = req.headers.get("Authorization")?.split(" ")[1];

        const cookieStore = await cookies();
        const authToken = cookieStore.get("AuthToken")?.value;       

        if (!authToken) {
            return NextResponse.json({ error: "Missing AuthToken" }, { status: 401 });
        }
        console.log("Auth Token: ", authToken);

        const { friendId } = await req.json(); // ✅ Extract friendId from request body
        console.log("Friend ID: ", friendId);

        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/connections/acceptContact`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ friendId }),
        });

        // const result = await response.json();
        console.log("Response: ", response);
        if (!response.ok) {
        console.error("Error response from .NET backend:", result);
            return NextResponse.json({ error: "Failed to accept contact" }, { status: response.status });
        }

        console.log("Success response from .NET backend:", result);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error accepting contact:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
