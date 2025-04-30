"use client";
import NavbarSwitcher from "./components/NavbarSwitcher";
import Link from "next/link";
import Head from "next/head";

/**
 * landing page page component of the ViMeet application.
 * Displays a hero section with background image and overlay text,
 * followed by a responsive image grid.
 *
 * @component
 * @returns {JSX.Element} The rendered landing page layout.
 */
export default function Landing() {
  return (
    <div>
        <Head>
        <title>ViMeet - Meet friends instantly, safely and virtually</title>
        <meta name="description" content="Learn about ViMeet – a virtual meeting platform built to connect people instantly and meaningfully." />
        <meta name="keywords" content="VIMEET, random call, random virtual call, virtual meetings, about VIMEET, video chat platform" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://videoactive.client.kc123.me/" />
        
        {/* Open Graph */}
        <meta property="og:title" content="About ViMeet - Virtual Meet Platform" />
        <meta property="og:description" content="Learn about ViMeet – a virtual meeting platform built to connect people instantly and meaningfully." />
        <meta property="og:image" content="https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/logos/logo.svg" />
        <meta property="og:url" content="https://videoactive.client.kc123.me/" />
        <meta property="og:type" content="website" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About ViMeet - Virtual Meet Platform" />
        <meta name="twitter:description" content="Learn about ViMeet – a virtual meeting platform built to connect people instantly and meaningfully." />
        <meta name="twitter:image" content="https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/logos/logo.svg" />
      </Head>
      {/* <NavbarSwitcher /> */}
      <main className="text-center">
        {/* Hero Section with Text Overlay */}
        <section className="relative w-full h-[400px]">
          {/* Background Image */}
          <img 
            src="https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/landing.jpg" 
            alt="ViMeet Logo" 
            className="w-full h-full object-cover opacity-70" 
          />
          
          {/* Centered Text Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <h1 className="text-4xl font-bold text-white">
              Meet Friends With <span className="text-pink-500">ViMEET</span>
            </h1>
            <Link href="/auth">
              <button className="bg-pink-500 text-white px-4 py-2 rounded-lg mt-4">
                Sign in / Register
              </button>
            </Link>
          </div>
        </section>

        {/* Image Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          <img src="https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/landing2.jpg" alt="Person working on laptop" className="rounded-lg shadow" />
          <img src="https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/landing3.jpg" alt="Group of friends chatting" className="rounded-lg shadow" />
        </section>
      </main>
    </div>
  );
}
