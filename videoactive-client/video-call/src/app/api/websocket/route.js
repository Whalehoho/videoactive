import { cookies } from "next/headers";
import { NextResponse } from "next/server";
/**
 * Establishes a WebSocket connection for direct communication with the backend server.
 *
 * This function performs the following actions:
 * - Retrieves the AuthToken from the cookies for secure access.
 * - Constructs a WebSocket URL with the backend WebSocket endpoint and appends the AuthToken as a query parameter.
 * - Establishes a WebSocket connection to the backend using the provided URL.
 * - Returns the WebSocket connection instance for further interaction.
 *
 * @param {Request} req - The request object containing the HTTP request details.
 * @returns {WebSocket} The WebSocket connection instance for direct communication with the backend.
 */
export async function GET(req) {

  const cookieStore = await cookies();
  const authToken = cookieStore.get("AuthToken")?.value;
  const socketConnection = new WebSocket(
    `${process.env.NEXT_PUBLIC_BACKEND_WEBSOCKET_URL}/ws/direct?authToken=${authToken}`
  );
  return socketConnection;
}