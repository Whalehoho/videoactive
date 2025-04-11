import { cookies } from "next/headers";
import { NextResponse } from "next/server";
/**
 * Handles GET requests by retrieving the AuthToken from cookies.
 *
 * This function performs the following actions:
 * - Attempts to retrieve the AuthToken from the cookies.
 * - If the AuthToken is missing, returns a 401 error response with an error message.
 * - If the AuthToken is found, logs it and returns it as a JSON response.
 *
 * @param {Request} req - The request object containing the HTTP request details.
 * @returns {NextResponse} A JSON response containing the AuthToken or an error message.
 */
export async function GET(req) {

  const cookieStore = await cookies();
  const authToken = cookieStore.get("AuthToken")?.value;

  if (!authToken) {
    return NextResponse.json({ error: "No auth token found" }, { status: 401 });
  }

  console.log("Auth token found:", authToken);

  return NextResponse.json( authToken );
}