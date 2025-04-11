// "use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavbarSwitcher from "./components/NavbarSwitcher";
import Footer from "./components/Footer";
import { WebSocketProvider } from "./context/WebSocketContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ViMeet",
  icons: [
    // Tab icon for browsers
    { rel: "icon", url: "https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/favicon.png" },
    { rel: "icon", type: "image/png", sizes: "96x96", url: "https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/favicon/favicon-96x96.png" },
    { rel: "apple-touch-icon", url: "https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/favicon/apple-touch-icon.png" },
    { rel: "icon", type: "image/png", sizes: "192x192", url: "https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/favicon/web-app-manifest-192x192.png" },
    { rel: "icon", type: "image/png", sizes: "512x512", url: "https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/favicon/web-app-manifest-512x512.png" },
  ],
  manifest: "/site.webmanifest",
  themeColor: "#ffffff",
};

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
