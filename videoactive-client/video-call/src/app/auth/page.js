"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUser, loginRedirectUrl } from "../services/api";

/**
 * AuthPage component handles user authentication and login process.
 *
 * This function performs the following actions:
 * - Checks if the user is already logged in by calling `fetchUser()`.
 * - If the user is logged in, redirects them to the `/home` page.
 * - If the user is not logged in, shows a button to log in via Google.
 * - Opens a popup window for Google login and listens for the token response.
 * - Redirects to the `/home` page once a valid token is received.
 *
 * @returns {JSX.Element} The rendered AuthPage component.
 */
export default function AuthPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ Loading state

  useEffect(() => {
    /**
     * Fetches the user data to determine if the user is logged in.
     * If logged in, redirects to the home page.
     */
    fetchUser()
      .then((data) => {
        if (data) {
          setUser(data); 
          router.push("/home");
        }
      })
      .catch(() => setUser(null)) 
      .finally(() => setLoading(false)); 
  }, [router]);

  /**
   * Handles the Google login process by opening a popup window.
   * The user will log in via Google in the popup, and the token will be sent back.
   */
  const handleLogin = () => {
    const popup = window.open(loginRedirectUrl, "_blank", "width=600,height=600");
    if (popup) {
      popup.focus();
    } else {
      alert("Please allow popups for this website"); // Inform user if popup is blocked
    }
  };

  /**
   * Listens for the token response from the popup window and redirects the user.
   * If a token is received, it is logged, and the user is redirected to the home page.
   */
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.token) {
        // console.log("Token received:", event.data.token); // Log the token for testing purposes
        router.push("/home"); 
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center text-pink-500">
      {loading ? (
        <p>Loading...</p> // ✅ Show loading message while checking user state
      ) : user ? (
        <p>Redirecting...</p> // ✅ Show message if user is logged in and redirecting
      ) : (
        <button
          onClick={handleLogin}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Login with Google
        </button>
      )}
    </div>
  );
}
