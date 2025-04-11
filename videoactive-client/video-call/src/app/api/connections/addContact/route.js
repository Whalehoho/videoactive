import { cookies } from "next/headers";
import { NextResponse } from "next/server";
/**
 * Handles POST requests to add a new contact by sending a request to the backend with the AuthToken and friendId.
 *
 * This function performs the following actions:
 * - Retrieves the AuthToken from the cookies.
 * - If the AuthToken is missing, returns a 401 error with a message indicating the missing token.
 * - Extracts the `friendId` from the request body.
 * - Sends a request to the backend to add the new contact using the AuthToken and friendId.
 * - Returns the response data if the contact is successfully added, or an error message if something fails.
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

        console.log("Received request to add contact:", friendId);
        console.log("AuthToken from cookies:", authToken);

        // ✅ Send request to .NET backend
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/addContact`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ friendId }),
        });

        console.log("Response status from .NET backend:", res.status);

        if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response from .NET backend:", errorText);
        return NextResponse.json({ error: "Failed to add contact" }, { status: res.status });
        }

        const data = await res.json();
        console.log("Success response from .NET backend:", data);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Add contact error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
