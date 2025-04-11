import { NextResponse } from "next/server";
/**
 * Handles GET requests by redirecting the user to the Google login endpoint.
 *
 * This function performs the following actions:
 * - Redirects the user to the Google login route on the backend.
 * - The redirect URL is dynamically constructed using the `NEXT_PUBLIC_BACKEND_URL` environment variable.
 *
 * @returns {NextResponse} A redirect response to the Google login endpoint.
 */
export async function GET() {
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google-login`);
}