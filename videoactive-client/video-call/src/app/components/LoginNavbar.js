import Link from "next/link";

/**
 * Navbar component that renders the top navigation bar of the website.
 *
 * This component performs the following actions:
 * - Displays the logo of the platform.
 * - Includes navigation links for Home and About Us pages.
 * - Highlights the active page by changing the link styles dynamically.
 * - Provides a Sign-in/Register button that redirects to the authentication page.
 *
 * @param {Object} props - The props passed to the component.
 * @param {string} props.activePage - The currently active page to highlight in the navigation.
 * @returns {JSX.Element} The rendered Navbar component.
 */
export default function Navbar({ activePage }) {
  return (
    <nav className="bg-white/60  shadow-md p-4 flex justify-between items-center fixed top-0 left-0 w-full z-50">
      
      {/* Logo */}
      <div className="text-pink-600 text-xl font-bold flex items-center hover:bg-pink-200 rounded-lg px-1">
        <img src="https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/logos/logo.svg" alt="logo" className="rounded-lg px-1 mx-2" />
        <Link 
              href="/"
              className={`px-4 py-2 rounded-lg`}
            >
          ViMeet
        </Link>
      </div>
      {/* Navigation Links */}
      <div className="space-x-4 flex items-center">
        <ul className="flex space-x-6">
          <li>
            <Link 
              href="/"
              className={`px-4 py-2 rounded-lg ${activePage === "/" ? "bg-pink-600 text-white" : "text-gray-700 hover:bg-gray-200"}`}
            >
              Home
            </Link>
          </li>
          <li>
            <Link 
              href="/aboutUs"
              className={`px-4 py-2 rounded-lg ${activePage === "/aboutUs" ? "bg-pink-600 text-white" : "text-gray-700 hover:bg-gray-200"}`}
            >
              About
            </Link>
          </li>
        </ul>

        {/* Sign-in Button */}
        <Link href="/auth"> 
          <button className="bg-pink-500 text-white px-4 py-2 rounded-lg">
            Sign in / Register
          </button>
        </Link>
      </div>
    </nav>
  );
}
