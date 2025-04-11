"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { fetchUser } from "../services/api"; // ✅ Use your own API
  /**
 * Renders the home page for the ViMeet application.
 *
 * This component displays:
 * the home page content for authenticated users,
 * including a welcome message and a button navigate to random call page.
 *
 * @returns {JSX.Element} The rendered About page component.
 */
export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  /**
   * useEffect hook that runs on component mount.
   * Fetches the current user information.
   * If no user is returned, the user is redirected to the login page (/auth).
   * Otherwise, the user state is populated and the loading state is turned off.
   */
  useEffect(() => {
    fetchUser().then((data) => {
      if (!data) {
        router.push("/auth"); // Redirect if not logged in
      } else {
        setUser(data);
      }
      setLoading(false);
    });
  }, []);
  /**
   * Redirects the user to the /randomCall page.
   * Triggered when the "Make A Friend!" button is clicked.
   */
  const handleClick = () => {
    router.push("/randomCall");
  };
  /**
   * Renders a loading screen while user data is being fetched.
   */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-pink-500">
        Loading...
      </div>
    );
  }
 /**
   * Renders the landing page content for authenticated users.
   */
  return (
    <div>
      <main className="relative flex flex-col min-h-screen">
        <img
          src="https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/landing2.jpg"
          alt="Landing Image"
          layout="fill"
          objectFit="cover"
          className="opacity-70"
          priority
        />
        <div className="absolute inset-0 flex items-center px-20 ml-10">
          <div className="text-left z-10 max-w-lg">
            <h1 className="text-4xl font-bold text-black">Welcome Back!</h1>
            <h2 className="text-2xl text-pink-600 font-semibold">
              {user?.email}
            </h2>
            <button
              onClick={handleClick}
              className="mt-6 bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition"
            >
              Make A Friend!
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
