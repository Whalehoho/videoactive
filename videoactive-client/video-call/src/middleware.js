import { NextResponse } from "next/server";

/**
 * Middleware function to handle CORS headers for API routes.
 *
 * Adds necessary CORS headers to enable secure cross-origin communication,
 * including credentials (cookies), allowed methods, and accepted headers.
 *
 * @param {import("next/server").NextRequest} request - Incoming request object.
 * @returns {import("next/server").NextResponse} Modified response with CORS headers.
 */
export function middleware(request) {
  const response = NextResponse.next();

  response.headers.set("Access-Control-Allow-Credentials", "true"); // ✅ Allow cookies
  response.headers.set("Access-Control-Allow-Origin", process.env.NEXT_PUBLIC_BACKEND_URL);
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  return response;
}

/**
 * Middleware configuration object to apply the middleware
 * only to API route paths.
 */
export const config = {
  matcher: "/api/:path*",
};
