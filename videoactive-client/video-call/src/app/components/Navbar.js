"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { handleLogout } from "../services/api";
import { useWebSocket } from "../context/WebSocketContext";
/**
 * Navbar component that displays navigation links and user interaction options.
 *
 * This component performs the following actions:
 * - Displays a logo that redirects to the home page when clicked.
 * - Displays navigation links for Home, Random Call, Connections, and Profile.
 * - Provides an option for the user to log out and redirect to the home page.
 * - Shows an indicator for incoming calls if there are any.
 * - Handles the visibility of the navbar with a fade-in effect after a slight delay.
 *
 * @param {Object} props - The props passed to the component.
 * @param {string} props.activePage - The current active page to highlight the respective link.
 * @param {Object} props.user - The user object containing user information.
 * @param {function} props.onLogout - The function to trigger when logging out the user.
 * @returns {JSX.Element} The rendered Navbar component.
 */
export default function Navbar({ activePage, user, onLogout }) { 
  const [navbarVisible, setNavbarVisible] = useState(false); // Track navbar visibility
  const router = useRouter();
  const { incomingCalls } = useWebSocket();
  const hasIncomingCalls = incomingCalls.length > 0;

  const handleUserLogout = async () => {
    localStorage.removeItem("authToken");
    await handleLogout();
    onLogout(); // ✅ Trigger re-fetch in NavbarSwitcher
    router.push("/"); // Redirect to home after logout
  };
  
  /**
   * Handles navigation to the random call page when the logo is clicked.
   */
  const handleClick = () => {
    router.push("/randomCall"); // Navigate to randomCall page
  };

  /**
   * Set navbar to be visible after data fetch or a slight delay
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setNavbarVisible(true); // Make navbar visible after a short delay
    }, 500); // Delay in milliseconds

    return () => clearTimeout(timer); // Clean up on component unmount
  }, []);

  return (
    <nav 
      className={`bg-white shadow-md p-4 flex justify-between items-center transition-opacity duration-500 ease-in-out ${navbarVisible ? "opacity-100" : "opacity-0"}`}
    >
      {/* Logo */}
      <div
        className="text-pink-600 text-xl font-bold flex items-center hover:bg-pink-200 rounded-lg px-1 cursor-pointer"
        onClick={handleClick} // Handle click event
      >
        <img
          src="https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/logos/logo.svg"
          alt="logo"
          className="rounded-lg px-1 mx-2"
        />
        ViMeet
      </div>

      {/* Navigation Links */}
      <div className="space-x-4 flex items-center pt-3">
        <ul className="flex space-x-6">
          <li>
            <Link 
              href="/home"
              className={`px-4 py-3 rounded-lg ${activePage === "/home" ? "bg-pink-600 text-white" : "text-gray-700 hover:bg-gray-200"}`}
            >
              Home
            </Link>
          </li>
          <li>
            <Link 
              href="/randomCall"
              className={`px-4 py-3 rounded-lg ${activePage === "/randomCall" ? "bg-pink-600 text-white" : "text-gray-700 hover:bg-gray-200"}`}
            >
              Random Call
            </Link>
          </li>
          <li>
            <Link 
              href="/connections"
              className={`px-4 py-3 rounded-lg ${activePage === "/connections" ? "bg-pink-600 text-white" : "text-gray-700 hover:bg-gray-200"}`}
            >
              Connections
            </Link>
            {hasIncomingCalls && (
              <span className="absolute top-0 right-60 w-3 h-3 bg-blue-500 rounded-full animate-ping"></span>
            )}
          </li>
          <li>
            <Link 
              href="/profile"
              className={`px-4 py-3 rounded-lg ${activePage === "/profile" ? "bg-pink-600 text-white" : "text-gray-700 hover:bg-gray-200"}`}
            >
              Profile
            </Link>
          </li>
          <li>
            <button onClick={handleUserLogout} className="px-2 py-1 bg-red-600 text-white rounded-lg">
            <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"
                  />
                </svg>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
