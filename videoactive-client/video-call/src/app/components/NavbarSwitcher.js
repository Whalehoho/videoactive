"use client";
import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import LoginNavbar from "./LoginNavbar";
import { fetchUser } from "../services/api"; // Centralized API function
/**
 * NavbarSwitcher component responsible for conditionally rendering the Navbar or LoginNavbar
 * based on the authentication state of the user.
 *
 * It fetches user data asynchronously, updating the state accordingly and rendering 
 * the appropriate navbar (authenticated or login state).
 *
 * - Fetches user data on mount and whenever the pathname changes.
 * - Displays the Navbar for authenticated users, otherwise shows the LoginNavbar.
 *
 * @returns {JSX.Element} The rendered component with either Navbar or LoginNavbar.
 */
export default function NavbarSwitcher() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname(); // Get current path

  /**
   * Function to check and fetch user data.
   * This function updates the user state and loading state.
   * It is triggered whenever the pathname changes or the component mounts.
   */  const checkUser = useCallback(async () => {
    setLoading(true);
    const userData = await fetchUser();
    setUser(userData);
    setLoading(false);
  }, []);

  // Effect hook to trigger the checkUser function whenever the pathname changes
  useEffect(() => {
    checkUser();
  }, [pathname]);

  // Render the navbar immediately, but show the user data once it's fetched
  return (
    <div>
      {/* This renders immediately but becomes fully visible after loading */}
      {user ? (
        <Navbar user={user} activePage={pathname} onLogout={checkUser} />
      ) : (
        <LoginNavbar activePage={pathname} />
      )}
    </div>
  );
}
