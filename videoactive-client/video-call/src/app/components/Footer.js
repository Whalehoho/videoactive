/**
 * Footer component that renders the footer section of the website.
 *
 * This component performs the following actions:
 * - Displays the logo, the platform's name, and a brief description of the service.
 * - Includes a copyright notice with the current year.
 * - Provides social media links (X, Instagram, YouTube, LinkedIn) with corresponding logos.
 *
 * @returns {JSX.Element} The rendered Footer component.
 */
export default function Footer() {
  return (
    <footer className="bg-gray-100 p-6  mx-2">
      <img src="https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/logos/logo.svg" alt="logo" className="rounded-lg" /><h2 className="text-pink-600 text-lg font-bold">ViMeet</h2>
      <p className="text-gray-700">A platform that provides opportunity for people to connect</p>
      &copy; {new Date().getFullYear()} ViMeet. All Rights Reserved.
      <p className="text-gray-500">&copy; 2025 ViMeet, Inc</p>
      <div className="flex justify-end space-x-4 mt-2">
          <a href="https://www.X.com" >
          <img src="https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/logos/X.svg" alt="X" className="w-6 h-6" />
          </a>
          <a href="https://www.instagram.com" >
          <img src="https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/logos/Instagram.svg" alt="Instagram" className="w-6 h-6" />
          </a>
          <a href="https://www.Youtube.com" >
          <img src="https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/logos/YouTube.svg" alt="Youtube" className="w-6 h-6" />
          </a>
          <a href="https://www.LinkedIn.com" >
          <img src="https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/logos/LinkedIn.svg" alt="LinkedIn" className="w-6 h-6" />
          </a>
      </div>
    </footer>
  );
}
