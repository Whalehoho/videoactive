// "use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavbarSwitcher from "./components/NavbarSwitcher";
import Footer from "./components/Footer";
import { WebSocketProvider } from "./context/WebSocketContext";
/**
 * Load Geist Sans font and attach it to a CSS variable for use throughout the app.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
 * Load Geist Mono font and attach it to a CSS variable for use throughout the app.
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Global metadata configuration for the application.
 * Includes title, favicon, theme color, and PWA manifest file.
 */
export const metadata = {
  title: "ViMeet - Meet friends instantly, safely and virtually",
  description: "Learn about ViMeet – a virtual meeting platform built to connect people instantly and meaningfully.",
  keywords: ["VIMEET", "random call", "random virtual call", "virtual meetings", "about VIMEET", "video chat platform"],
  robots: "index, follow",
  verification: {
    google: "Mw16fg7pQEwuKv03auvyZa_ond9EIIe1NzvsNHy3Wi4",
  },
  alternates: {
    canonical: "https://videoactive.client.kc123.me/",
  },
  openGraph: {
    title: "About ViMeet - Virtual Meet Platform",
    description: "Learn about ViMeet – a virtual meeting platform built to connect people instantly and meaningfully.",
    images: [
      {
        url: "https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/logos/logo.svg",
      },
    ],
    url: "https://videoactive.client.kc123.me/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About ViMeet - Virtual Meet Platform",
    description: "Learn about ViMeet – a virtual meeting platform built to connect people instantly and meaningfully.",
    images: [
      "https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/logos/logo.svg",
    ],
  },
  icons: [
    { rel: "icon", url: "https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/favicon.png" },
    { rel: "icon", type: "image/png", sizes: "96x96", url: "https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/favicon/favicon-96x96.png" },
    { rel: "apple-touch-icon", url: "https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/favicon/apple-touch-icon.png" },
    { rel: "icon", type: "image/png", sizes: "192x192", url: "https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/favicon/web-app-manifest-192x192.png" },
    { rel: "icon", type: "image/png", sizes: "512x512", url: "https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/favicon/web-app-manifest-512x512.png" },
  ],
  manifest: "/site.webmanifest",
  themeColor: "#ffffff",
};

/**
 * Root layout component that wraps the entire application.
 * Includes font styles, global context providers, navigation bar, footer, and page content.
 *
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - The child components to render within the layout.
 * @returns {JSX.Element} The HTML structure of the application layout.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
          <WebSocketProvider>
            <NavbarSwitcher />
            <main className="flex-grow">{children}</main>
            <Footer />
          </WebSocketProvider>
      </body>
    </html>
  );
}
