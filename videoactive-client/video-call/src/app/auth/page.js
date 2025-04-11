"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUser, loginRedirectUrl } from "../services/api";

export default function AuthPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ Loading state

  useEffect(() => {
    fetchUser()
      .then((data) => {
        if (data) {
          setUser(data);
          router.push("/home"); // ✅ Redirect if already logged in
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false)); // ✅ Ensure loading state updates
  }, [router]);

  // Handle Google login, use a popup window for redirect
  const handleLogin = () => {
    const popup = window.open(loginRedirectUrl, "_blank", "width=600,height=600");
    if (popup) {
      popup.focus();
    } else {
      alert("Please allow popups for this website");
    }
  };

  // Listen for token response from popup
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.token) {
        console.log("Token received:", event.data.token);
        router.push("/home");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center">
      {loading ? (
        <p>Loading...</p>
      ) : user ? (
        <p>Redirecting...</p>
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
